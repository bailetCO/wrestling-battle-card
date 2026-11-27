// Mises à jour automatiques (27/11/2026). Le jeu installé sur le téléphone reste ouvert en arrière-plan :
// le rouvrir ne le recharge pas. On compare donc le numéro de construction du jeu à celui de la
// version en ligne (fichier version.json, publié avec le jeu) :
//   - au lancement, à chaque retour sur le jeu (application rouverte, onglet revenu au premier plan)
//     et à chaque retour au menu (au plus une fois par minute) ;
//   - nouvelle version : le jeu se recharge et revient à l'accueil, où « Quoi de neuf ? » s'affiche.
//     Un combat contre l'ordinateur (carrière, entraînement, tournoi, tutoriel) est annulé : il n'est
//     ni gagné ni perdu (un combat de tournoi se rejoue). Un combat en ligne contre un ami n'est jamais
//     coupé : la mise à jour attend le retour au menu.

export const BUILD: string = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
const CLE_ANNULEE = 'wbc-maj-partie-annulee';
const CLE_ESSAI = 'wbc-maj-essai'; // dernière tentative de rechargement (évite une boucle si l'hébergeur sert encore l'ancienne page)
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* navigation privée */ } };

export async function buildEnLigne(): Promise<string | null> {
  try {
    const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json()) as { build?: unknown };
    return typeof d.build === 'string' ? d.build : null;
  } catch {
    return null; // hors ligne
  }
}

// Faut-il recharger ? Pas en développement, pas si on vient d'essayer pour cette même version (moins de 5 min).
export function aRecharger(enLigne: string | null, actuel = BUILD, essai = lire(CLE_ESSAI), maintenant = Date.now()): boolean {
  if (!enLigne || enLigne === actuel || actuel === 'dev' || actuel.startsWith('local-')) return false;
  const [cible, quand] = (essai ?? '').split('@');
  return !(cible === enLigne && maintenant - Number(quand) < 5 * 60_000);
}

export type EtatJeu = 'libre' | 'combat' | 'enLigne';

let enAttente: string | null = null; // nouvelle version vue pendant un combat en ligne
let derniere = 0;

// Vérifie et recharge si besoin. `etat` : ce que fait le joueur à ce moment-là.
export async function verifierMiseAJour(etat: () => EtatJeu, force = false) {
  if (!force && !enAttente && Date.now() - derniere < 60_000) return;
  derniere = Date.now();
  const enLigne = enAttente ?? (await buildEnLigne());
  if (!aRecharger(enLigne)) return;
  const e = etat();
  if (e === 'enLigne') { enAttente = enLigne; return; } // on ne coupe pas un combat contre un ami
  if (e === 'combat') ecrire(CLE_ANNULEE, '1');
  ecrire(CLE_ESSAI, `${enLigne}@${Date.now()}`);
  history.replaceState(null, '', location.pathname + location.search); // retour à l'accueil
  location.reload();
}

export function demarrerMisesAJour(etat: () => EtatJeu) {
  void verifierMiseAJour(etat, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void verifierMiseAJour(etat, true); });
  window.addEventListener('pageshow', (ev) => { if (ev.persisted) void verifierMiseAJour(etat, true); });
}

// Après le rechargement : la partie en cours a-t-elle été annulée ? (lu une seule fois)
export function partieAnnulee(): boolean {
  const oui = lire(CLE_ANNULEE) === '1';
  if (oui) ecrire(CLE_ANNULEE, null);
  return oui;
}
