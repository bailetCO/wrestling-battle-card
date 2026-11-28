// Notifications, à l'écran (28/11/2026) : proposition après la première récompense du jour, et
// réglage « Notifications » sous « Plus ».

import { activerNotifications, desactiverNotifications, etatNotifs, iphoneNonInstalle, jetonNotifs, noterPlusTard, notificationsPossibles, permission } from '../notifications';
import { DEV } from '../dev';
import { fenetreInstaller } from './beta';
import { fermerFenetre, ouvrirFenetre } from './combat';

const MESSAGE_REFUS = 'Les notifications sont bloquées pour ce jeu. Pour les autoriser : réglages du téléphone (ou du navigateur) → Notifications → Wrestling Battle Card.';

// Après la première récompense du jour (une seule fois ; ensuite, le réglage reste sous « Plus »).
// La proposition est montrée au retour au menu, avant les scènes de l'histoire (une seule fenêtre à la fois).
let aProposer = false;
export const prevoirPropositionNotifications = () => { aProposer = true; };
export function proposerNotifications(): boolean {
  if (!aProposer) return false;
  aProposer = false;
  if (etatNotifs() !== null || permission() === 'denied') return false;
  if (!notificationsPossibles() && !iphoneNonInstalle()) return false;
  if (document.querySelector('.voile, .revelation, .scene-dialogue')) { aProposer = true; return false; }
  noterPlusTard(); // proposé une fois : on ne redemande pas tout seul
  fenetreNotifications(true);
  return true;
}

export function fenetreNotifications(proposition = false) {
  const etat = etatNotifs();
  const p = permission();
  let corps: string;
  if (iphoneNonInstalle()) {
    corps = `<p>Sur iPhone, les notifications marchent seulement quand le jeu est <b>installé sur l'écran d'accueil</b>. Installe-le, ouvre-le depuis son icône, puis reviens ici.</p>
      <button class="principal" data-installer-jeu>Comment installer le jeu ?</button>`;
  } else if (!notificationsPossibles()) {
    corps = '<p class="note">Ce navigateur ne permet pas les notifications.</p>';
  } else if (p === 'denied') {
    corps = `<p class="note">${MESSAGE_REFUS}</p>`;
  } else if (etat === 'oui' && p === 'granted') {
    corps = `<p>🔔 Notifications activées : tu recevras le rappel de ta récompense du jour et les grandes nouveautés.</p>
      ${DEV && jetonNotifs() ? `<p class="note">🛠 Jeton de ce téléphone (pour « Envoyer un message test ») :</p><textarea class="jeton-notifs" readonly rows="4">${jetonNotifs()}</textarea>` : ''}
      <button class="secondaire" data-notifs-non>Ne plus recevoir de notifications</button>`;
  } else {
    corps = `<p>${proposition ? '🎁 Bravo pour ta première récompense du jour ! ' : ''}Veux-tu un <b>rappel quand ta récompense du jour est prête</b> ? Tu recevras aussi les grandes nouveautés du jeu (pas plus d'une notification par jour).</p>
      <button class="principal" data-notifs-oui>🔔 Oui, me prévenir</button>`;
  }
  const f = ouvrirFenetre(`
    <h2>Notifications</h2>
    ${corps}
    <p class="etat-notifs note" role="status"></p>
    <button class="lien" data-fermer>${proposition ? 'Plus tard' : 'Fermer'}</button>`, true);
  const etatEl = f.querySelector('.etat-notifs')!;
  f.querySelector('[data-installer-jeu]')?.addEventListener('click', () => { fermerFenetre(); fenetreInstaller(); });
  f.querySelector('[data-notifs-non]')?.addEventListener('click', async () => { await desactiverNotifications(); fermerFenetre(); fenetreNotifications(); });
  f.querySelector<HTMLButtonElement>('[data-notifs-oui]')?.addEventListener('click', async (ev) => {
    const b = ev.currentTarget as HTMLButtonElement;
    b.disabled = true;
    etatEl.textContent = 'Activation…';
    const r = await activerNotifications();
    if (r === 'oui') { fermerFenetre(); fenetreNotifications(); return; }
    b.disabled = false;
    etatEl.textContent = r === 'refuse' ? MESSAGE_REFUS : 'Activation impossible pour le moment. Vérifie ta connexion internet et réessaie.';
  });
}
