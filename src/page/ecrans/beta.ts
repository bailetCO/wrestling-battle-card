import { fenetreCodeCreateur } from './createurs';
import { fenetreNotifications } from './notifications';
import { fenetreReglagesSon } from './reglages-son';
import { fenetreInvitation } from './parrainage';
// Écrans de la bêta : code d'invitation, pied du menu (version, nouveautés, sauvegarde, installation).

import { codeInvitationValide, exporterSauvegarde, importerSauvegarde, nouveautesAMontrer } from '../beta';
import { cartesPossedees, sauver, type Collection } from '../collection';
import { DEV } from '../dev';
import { partieAnnulee } from '../mise-a-jour';
import { NOUVEAUTES, VERSION, type Nouveautes } from '../nouveautes';
import { fermerFenetre, ouvrirFenetre } from './combat';
import { S, app, echap } from './commun';
import { fenetreConfidentialite } from './stats';
import { brancherCompteExistant, fenetreCompte, lienCompteExistant } from './compte';
import { compteActuel } from '../compte';

const CLE_INVITATION = 'wbc-invitation';
const CLE_VERSION = 'wbc-version-vue';

const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* navigation privée */ } };

// ---------- Démarrage ----------

let invitationAccordee = false;
let demandeInstallation: (Event & { prompt: () => Promise<void> }) | null = null;

export function demarrerBeta() {
  // Lien d'invitation : ...?invitation=CODE (le code est retiré de l'adresse aussitôt lu).
  try {
    const p = new URLSearchParams(location.search);
    const code = p.get('invitation');
    if (code !== null) {
      if (codeInvitationValide(code)) ecrire(CLE_INVITATION, '1');
      p.delete('invitation');
      history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}${location.hash}`);
    }
  } catch { /* adresse illisible : on demandera le code */ }
  // Les joueurs d'avant la bêta (pseudo déjà choisi) gardent l'accès.
  invitationAccordee = DEV || lire(CLE_INVITATION) === '1' || !!S.collection.coach;
  // Nouveau joueur : il découvre le jeu, pas besoin de lui montrer les nouveautés.
  if (!lire(CLE_VERSION) && !S.collection.coach) ecrire(CLE_VERSION, VERSION);
  window.addEventListener('beforeinstallprompt', (ev) => {
    ev.preventDefault(); // on propose l'installation depuis notre bouton
    demandeInstallation = ev as typeof demandeInstallation;
  });
  // Jeu installé sur le téléphone : il reste jouable contre l'ordinateur sans réseau.
  if (import.meta.env.PROD && location.protocol === 'https:' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* le jeu marche sans */ });
  }
}

export const invitationOk = () => invitationAccordee;
// Un joueur qui retrouve son compte (avec une collection) a déjà été invité.
export function accorderInvitation() {
  ecrire(CLE_INVITATION, '1');
  invitationAccordee = true;
}

// ---------- Code d'invitation ----------

export function ecranInvitation(message = '') {
  app.innerHTML = `
    <main class="accueil">
      <div class="rayons" aria-hidden="true"></div>
      <section class="accueil-centre">
        <h1 class="logo">Wrestling<br>Battle Card</h1>
        <span class="badge-beta">Bêta</span>
        <p>Le jeu est en test avec un petit groupe de joueurs. Entre le code d'invitation que tu as reçu.</p>
        <form class="form-pseudo form-invitation">
          <label for="invitation">Code d'invitation</label>
          <input id="invitation" name="invitation" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ton code">
          <p class="erreur" role="alert">${echap(message)}</p>
          <button class="principal" type="submit">Entrer</button>
        </form>
        <p class="note">Pas encore de code ? Le jeu ouvrira bientôt à tous.</p>
        ${lienCompteExistant()}
      </section>
    </main>`;
  brancherCompteExistant(app);
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const v = app.querySelector<HTMLInputElement>('#invitation')!.value;
    if (!codeInvitationValide(v)) return ecranInvitation('Ce code n\'est pas le bon. Vérifie-le dans le message que tu as reçu.');
    ecrire(CLE_INVITATION, '1');
    invitationAccordee = true;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  app.querySelector<HTMLInputElement>('#invitation')!.focus();
  window.scrollTo(0, 0);
}

// ---------- Pied du menu ----------

// Les liens sont regroupés derrière « Plus » (27/11/2026) : le menu reste simple pour un débutant.
export const piedMenu = () => `
  <footer class="pied-menu">
    <span class="badge-beta">Bêta ${VERSION}</span>
    <details class="pied-plus">
      <summary>Plus</summary>
      <div class="pied-liens">
        <button class="lien" data-compte>Mon compte</button>
        <button class="lien" data-inviter-ami>Inviter un ami</button>
        <button class="lien" data-code-createur>Code créateur</button>
        <button class="lien" data-reglages-son>Son et vibrations</button>
        <button class="lien" data-notifications>Notifications</button>
        <button class="lien" data-nouveautes>Nouveautés</button>
        <button class="lien" data-sauvegarde>Ma sauvegarde</button>
        <button class="lien" data-installer>Installer le jeu</button>
        <button class="lien" data-donner-avis>Donner mon avis</button>
        <button class="lien" data-signaler>Signaler un bug</button>
        <button class="lien" data-confidentialite>Confidentialité</button>
      </div>
    </details>
  </footer>`;

export function brancherPiedMenu() {
  app.querySelector('[data-nouveautes]')?.addEventListener('click', () => fenetreNouveautes(NOUVEAUTES.slice(0, 3), 'Les dernières nouveautés'));
  app.querySelector('[data-sauvegarde]')?.addEventListener('click', () => fenetreSauvegarde());
  app.querySelector('[data-compte]')?.addEventListener('click', () => fenetreCompte());
  app.querySelector('[data-inviter-ami]')?.addEventListener('click', () => fenetreInvitation());
  app.querySelector('[data-code-createur]')?.addEventListener('click', () => fenetreCodeCreateur());
  app.querySelector('[data-reglages-son]')?.addEventListener('click', () => fenetreReglagesSon());
  app.querySelector('[data-notifications]')?.addEventListener('click', () => fenetreNotifications());
  app.querySelector('[data-installer]')?.addEventListener('click', () => fenetreInstaller());
  app.querySelector('[data-confidentialite]')?.addEventListener('click', () => fenetreConfidentialite());
}

// Une fois après une mise à jour. Rend vrai si la fenêtre s'est ouverte.
let annulee: boolean | null = null; // partie arrêtée par une mise à jour (lu une fois au lancement)
export function montrerNouveautes(): boolean {
  annulee ??= partieAnnulee();
  const liste = nouveautesAMontrer(lire(CLE_VERSION) ?? '0.0.0');
  // Une autre fenêtre est déjà ouverte : on les montrera au prochain passage par le menu.
  if ((liste.length || annulee) && document.querySelector('.voile, .scene-dialogue, .revelation')) return false;
  ecrire(CLE_VERSION, VERSION);
  const message = annulee ? 'Le jeu vient d\'être mis à jour : ta partie en cours a été arrêtée (ni gagnée ni perdue). Tu peux la relancer.' : '';
  annulee = false;
  if (!liste.length && !message) return false;
  if (!liste.length) fenetreNouveautes([], 'Mise à jour', message);
  else fenetreNouveautes(liste, 'Quoi de neuf ?', message);
  return true;
}

// Typographie française : pas de retour à la ligne avant « ! ? : ; » ni après « .
const insecables = (t: string) => t.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

function fenetreNouveautes(liste: Nouveautes[], titre: string, message = '') {
  const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  ouvrirFenetre(`
    <h2>${titre}</h2>
    ${message ? `<p class="maj-annulee">⚠️ ${insecables(echap(message))}</p>` : ''}
    ${liste.map((n) => `<h3 class="nv-version">Version ${echap(n.version)} <small>${date(n.date)}</small></h3>
      <ul class="nv-liste">${n.lignes.map((l) => `<li>${insecables(echap(l))}</li>`).join('')}</ul>`).join('')}
    <button class="principal" data-fermer>C'est parti</button>`, true);
}

// ---------- Sauvegarde : exporter, importer ----------

const resume = (c: Collection) => `coach ${echap(c.coach ?? 'sans nom')}, ${cartesPossedees(c)} cartes, ${c.medailles} médailles, ${c.dollars} $`;

function fenetreSauvegarde() {
  const f = ouvrirFenetre(`
    <h2>Ma sauvegarde</h2>
    ${compteActuel() ? '<p class="succes">☁ Tu es connecté à ton compte : ta collection est sauvegardée en ligne automatiquement.</p>' : `<p>Ta collection est gardée dans ce navigateur. Si tu vides l'historique ou changes de téléphone, elle est perdue.</p>
    <p><b>Le plus simple :</b> crée un compte, elle sera sauvegardée en ligne automatiquement.</p>
    <button class="principal" data-ouvrir-compte>Créer un compte</button>
    <p class="note">Sinon, garde un code de sauvegarde en lieu sûr (message à toi-même, notes, e-mail).</p>`}
    <h3>Exporter</h3>
    <button class="principal" data-creer>Créer mon code de sauvegarde</button>
    <div class="sv-export" hidden>
      <textarea class="sv-code" readonly rows="4" aria-label="Ton code de sauvegarde"></textarea>
      <div class="sv-boutons">
        <button class="secondaire" data-copier>Copier</button>
        ${'share' in navigator ? '<button class="secondaire" data-partager>Envoyer</button>' : ''}
        <button class="secondaire" data-telecharger>Télécharger</button>
      </div>
      <p class="note sv-etat" role="status"></p>
    </div>
    <h3>Importer</h3>
    <p class="note">Colle un code de sauvegarde, ou choisis le fichier téléchargé. Ta collection actuelle sera remplacée.</p>
    <textarea class="sv-coller" rows="3" aria-label="Code de sauvegarde à importer" placeholder="WBC1…"></textarea>
    <label class="secondaire sv-choisir">Choisir un fichier<input type="file" class="sv-fichier" accept=".txt,text/plain"></label>
    <button class="secondaire" data-lire>Lire le code</button>
    <div class="sv-import" role="status"></div>
    <button class="lien" data-fermer>Fermer</button>`, true);
  const q = <T extends HTMLElement>(s: string) => f.querySelector<T>(s)!;
  f.querySelector('[data-ouvrir-compte]')?.addEventListener('click', () => fenetreCompte());
  const etat = (t: string) => { q('.sv-etat').textContent = t; };
  let code = '';
  q('[data-creer]').addEventListener('click', async () => {
    code = await exporterSauvegarde(S.collection);
    q<HTMLTextAreaElement>('.sv-code').value = code;
    q('.sv-export').hidden = false;
  });
  q('[data-copier]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); etat('Code copié. Colle-le dans un message à toi-même ou dans tes notes.'); } catch {
      q<HTMLTextAreaElement>('.sv-code').select(); etat('Sélectionne le code et copie-le.');
    }
  });
  f.querySelector('[data-partager]')?.addEventListener('click', () => {
    navigator.share({ title: 'Ma sauvegarde Wrestling Battle Card', text: code }).catch(() => {});
  });
  q('[data-telecharger]').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    a.download = `wrestling-battle-card-sauvegarde-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    etat('Fichier téléchargé.');
  });
  q<HTMLInputElement>('.sv-fichier').addEventListener('change', async (ev) => {
    const fichier = (ev.target as HTMLInputElement).files?.[0];
    if (fichier) q<HTMLTextAreaElement>('.sv-coller').value = (await fichier.text()).slice(0, 2_000_000);
  });
  q('[data-lire]').addEventListener('click', async () => {
    const zone = q('.sv-import');
    const lu = await importerSauvegarde(q<HTMLTextAreaElement>('.sv-coller').value);
    if (typeof lu === 'string') { zone.innerHTML = `<p class="erreur">${echap(lu)}</p>`; return; }
    zone.innerHTML = `<p>Sauvegarde trouvée : ${resume(lu)}.</p><p>Elle remplacera ta collection actuelle : ${resume(S.collection)}.</p>
      <button class="principal" data-remplacer>Remplacer ma collection</button>`;
    zone.querySelector('[data-remplacer]')!.addEventListener('click', () => {
      S.collection = lu;
      sauver(S.collection);
      ecrire(CLE_INVITATION, '1');
      fermerFenetre();
      location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });
}

// ---------- Installer le jeu sur le téléphone ----------

export function fenetreInstaller() {
  const installe = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  const f = ouvrirFenetre(installe ? `
    <h2>Installer le jeu</h2><p>Le jeu est déjà installé sur cet appareil. Ouvre-le depuis son icône.</p>
    <button class="principal" data-fermer>OK</button>` : `
    <h2>Installer le jeu</h2>
    <p>Une icône sur l'écran d'accueil, le jeu en plein écran, et les combats contre l'ordinateur même sans réseau.</p>
    ${demandeInstallation ? '<button class="principal" data-installer-maintenant>Installer maintenant</button>' : ''}
    <h3>Sur iPhone (Safari)</h3>
    <ol class="nv-liste"><li>Touche le bouton Partager (le carré avec une flèche vers le haut).</li><li>Choisis « Sur l'écran d'accueil ».</li><li>Touche « Ajouter ».</li></ol>
    <h3>Sur Android (Chrome)</h3>
    <ol class="nv-liste"><li>Touche le menu ⋮ en haut à droite.</li><li>Choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</li></ol>
    <button class="lien" data-fermer>Fermer</button>`, true);
  f.querySelector('[data-installer-maintenant]')?.addEventListener('click', async () => {
    await demandeInstallation?.prompt().catch(() => {});
    demandeInstallation = null;
    fermerFenetre();
  });
}
