// Notifications sur le téléphone (28/11/2026), sans affichage.
// Le jeu ne fait que s'inscrire : c'est Corentin qui envoie les notifications depuis la console
// Firebase (Cloud Messaging → campagnes) : rappel quotidien de la récompense du jour, annonces.
// Android : partout. iPhone : seulement si le jeu est installé sur l'écran d'accueil.
// L'inscription passe par la bibliothèque Firebase (chargée seulement à ce moment-là) ; l'affichage
// des notifications reçues est fait par la copie hors ligne du jeu (public/sw.js).

import { FIREBASE } from './firebase';

export type EtatNotifs = 'oui' | 'non' | 'plus-tard' | null; // null : jamais proposé
const CLE = 'wbc-notifs';
export const etatNotifs = (): EtatNotifs => { try { return (localStorage.getItem(CLE) as EtatNotifs) ?? null; } catch { return null; } };
const noter = (e: EtatNotifs) => { try { if (e) localStorage.setItem(CLE, e); else localStorage.removeItem(CLE); } catch { /* navigation privée */ } };
export const noterPlusTard = () => noter('plus-tard');
// Jeton du téléphone : seulement pour « Envoyer un message test » depuis la console (mode développeur).
const CLE_JETON = 'wbc-notifs-jeton';
const garderJeton = (j: string) => { try { localStorage.setItem(CLE_JETON, j); } catch { /* navigation privée */ } };
export const jetonNotifs = () => { try { return localStorage.getItem(CLE_JETON) ?? ''; } catch { return ''; } };

export const notificationsPossibles = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && window.isSecureContext;

// iPhone ou iPad, jeu ouvert dans le navigateur (pas installé) : les notifications demandent l'installation.
export const iphoneNonInstalle = () =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone);

export const permission = (): NotificationPermission | 'impossible' => (notificationsPossibles() ? Notification.permission : 'impossible');

// La copie hors ligne du jeu (sw.js) reçoit les notifications ; 10 secondes au plus pour l'attendre.
function copieHorsLigne(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, ko) => setTimeout(() => ko(new Error('Copie hors ligne absente')), 10_000)),
  ]);
}

async function messagerie() {
  const [{ initializeApp, getApps }, { getMessaging, getToken, deleteToken }] = await Promise.all([import('firebase/app'), import('firebase/messaging')]);
  const app = getApps()[0] ?? initializeApp({ apiKey: FIREBASE.apiKey, projectId: FIREBASE.projectId, appId: FIREBASE.appId, messagingSenderId: FIREBASE.messagingSenderId });
  return { m: getMessaging(app), getToken, deleteToken };
}

// Demande l'autorisation et inscrit le téléphone. Renvoie l'état obtenu.
export async function activerNotifications(): Promise<'oui' | 'refuse' | 'impossible' | 'erreur'> {
  if (!notificationsPossibles()) return 'impossible';
  const p = await Notification.requestPermission();
  if (p !== 'granted') { noter('non'); return 'refuse'; }
  try {
    const { m, getToken } = await messagerie();
    garderJeton(await getToken(m, { vapidKey: FIREBASE.vapidKey, serviceWorkerRegistration: await copieHorsLigne() }));
    noter('oui');
    return 'oui';
  } catch {
    return 'erreur';
  }
}

export async function desactiverNotifications() {
  noter('non');
  try { const { m, deleteToken } = await messagerie(); await deleteToken(m); } catch { /* hors ligne : tant pis */ }
}

// Au lancement : un joueur inscrit garde son inscription à jour (Firebase renouvelle le jeton).
export function rafraichirNotifications() {
  if (etatNotifs() !== 'oui' || permission() !== 'granted') return;
  void messagerie().then(async ({ m, getToken }) => garderJeton(await getToken(m, { vapidKey: FIREBASE.vapidKey, serviceWorkerRegistration: await copieHorsLigne() }))).catch(() => {});
}
