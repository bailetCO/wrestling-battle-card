import { programmerPublication } from '../classement';
import { brancherPays, choixPays } from './classement';
// Écrans du compte joueur (27/11/2026) : se connecter (Google ou e-mail), choisir la sauvegarde à
// garder si le téléphone et le compte en ont deux différentes, proposition après quelques victoires,
// indicateur « Sauvegardé ».

import { collectionEnLigne, compteActuel, connexionEmail, connexionGoogle, creerCompteEmail, decision, deconnexion, ecrireEnLigne, lireEnLigne, messageErreur, motDePasseOublie, programmerEnregistrement, resumeDe, surEtatSauvegarde, type Resume, type SauvegardeEnLigne } from '../compte';
import { exporterSauvegarde } from '../beta';
import { accorderInvitation, invitationOk } from './beta';
import { sauver, surSauvegarde } from '../collection';
import { FIREBASE } from '../firebase';
import { fermerFenetre, ouvrirFenetre } from './combat';
import { S, echap } from './commun';
import { annoncer } from './progression';
import { route } from './navigation';

const CLE_SYNCHRO = 'wbc-compte-synchro'; // code de la dernière sauvegarde envoyée ou reprise
const lireSynchro = () => { try { return localStorage.getItem(CLE_SYNCHRO); } catch { return null; } };
const noterSynchro = (code: string) => { try { localStorage.setItem(CLE_SYNCHRO, code); } catch { /* navigation privée */ } };
const VICTOIRES_PROPOSITION = 3; // le compte est proposé après ce nombre de victoires
const MARQUE_PROPOSITION = 'proposition-compte';

const texteResume = (r: Resume) => `${r.cartes} cartes · ${r.medailles} médaille${r.medailles > 1 ? 's' : ''} · ${r.victoires} victoire${r.victoires > 1 ? 's' : ''} · mode histoire étape ${Math.min(r.etape + 1, 18)}${r.etape >= 18 ? ' (fini)' : ''}`;

// Au démarrage : l'enregistrement automatique, et la synchronisation avec le compte.
export function demarrerCompte() {
  surSauvegarde((c) => programmerEnregistrement(c));
  surEtatSauvegarde((e) => {
    document.querySelectorAll('.etat-cloud').forEach((x) => { x.textContent = e === 'en-cours' ? '☁ Sauvegarde…' : e === 'ok' ? '☁ Sauvegardé ✓' : '☁ Hors ligne'; });
    if (e === 'ok') void exporterSauvegarde(S.collection).then(noterSynchro);
  });
  if (compteActuel()) void synchroniser(false);
}

// Compare la sauvegarde du téléphone et celle du compte. `connexion` : juste après s'être connecté.
async function synchroniser(connexion: boolean, dejaLu?: SauvegardeEnLigne | null) {
  let enLigne: SauvegardeEnLigne | null;
  if (dejaLu !== undefined) enLigne = dejaLu;
  else try { enLigne = await lireEnLigne(); } catch { return; } // hors ligne : on réessaiera au prochain lancement
  const local = await exporterSauvegarde(S.collection);
  const d = await decision(S.collection, enLigne);
  if (d === 'identiques') return noterSynchro(local);
  if (d === 'envoyer') { if (await ecrireEnLigne(S.collection).catch(() => false)) noterSynchro(local); return; }
  if (d === 'reprendre') return reprendre(enLigne!);
  // Deux sauvegardes différentes. Hors connexion : si un seul côté a changé depuis la dernière synchro,
  // on suit ce côté sans rien demander.
  const synchro = lireSynchro();
  if (!connexion && synchro === local) return reprendre(enLigne!); // le téléphone n'a pas bougé : le compte est plus récent
  if (!connexion && synchro === enLigne!.code) { if (await ecrireEnLigne(S.collection).catch(() => false)) noterSynchro(local); return; }
  fenetreChoix(enLigne!);
}

async function reprendre(enLigne: SauvegardeEnLigne) {
  const c = await collectionEnLigne(enLigne);
  if (typeof c === 'string') return;
  S.collection = c;
  sauver(S.collection);
  noterSynchro(enLigne.code);
  route();
}

function fenetreChoix(enLigne: SauvegardeEnLigne) {
  const f = ouvrirFenetre(`
    <h2>Deux sauvegardes différentes</h2>
    <p>Ce téléphone et ton compte n'ont pas la même collection. Laquelle veux-tu garder ? L'autre sera remplacée.</p>
    <div class="choix-sauvegardes">
      <button class="carte-choix" data-garder="compte"><b>☁ Mon compte</b><small>${echap(enLigne.resume.coach ? `Coach ${enLigne.resume.coach}` : '')}</small><span>${texteResume(enLigne.resume)}</span></button>
      <button class="carte-choix" data-garder="telephone"><b>📱 Ce téléphone</b><small>${echap(S.collection.coach ? `Coach ${S.collection.coach}` : '')}</small><span>${texteResume(resumeDe(S.collection))}</span></button>
    </div>`, false);
  f.querySelector('[data-garder="compte"]')!.addEventListener('click', () => { fermerFenetre(); void reprendre(enLigne); });
  f.querySelector('[data-garder="telephone"]')!.addEventListener('click', async () => {
    fermerFenetre();
    if (await ecrireEnLigne(S.collection).catch(() => false)) noterSynchro(await exporterSauvegarde(S.collection));
    route(); // le menu affiche maintenant « Sauvegardé »
  });
}

// ---------- Fenêtre « Mon compte » ----------

// `retour` : le joueur ouvre le jeu sur un nouvel appareil et a déjà un compte (écran du code
// d'invitation ou du pseudo) : seulement « se connecter », pas de création de compte.
let modeRetour = false;
export function fenetreCompte(message = '', retour = false) {
  modeRetour = retour;
  const compte = compteActuel();
  if (compte) {
    const f = ouvrirFenetre(`
      <h2>${retour ? 'Retrouver mon compte' : 'Mon compte'}</h2>
      ${message ? `<p class="succes">${echap(message)}</p>` : ''}
      <p>Connecté avec ${compte.fournisseur === 'google.com' ? 'Google' : 'ton e-mail'} : <b>${echap(compte.email)}</b></p>
      <p class="etat-cloud">☁ Ta collection est sauvegardée en ligne automatiquement.</p>
      <p class="note">Sur un autre téléphone ou un ordinateur, connecte-toi avec le même compte pour retrouver ta collection.</p>
      ${choixPays()}
      <button class="secondaire" data-deconnexion>Se déconnecter</button>
      <button class="lien" data-fermer>Fermer</button>`, true);
    brancherPays(f, () => {});
    f.querySelector('[data-deconnexion]')!.addEventListener('click', () => {
      deconnexion();
      fenetreCompte('');
    });
    return;
  }
  const f = ouvrirFenetre(`
    <h2>${retour ? 'Retrouver mon compte' : 'Mon compte'}</h2>
    ${message ? `<p class="erreur">${echap(message)}</p>` : ''}
    ${retour ? '<p>Connecte-toi avec ton compte pour <b>retrouver ta collection</b>, ton pseudo et ta progression.</p>' : '<p>Crée un compte gratuit pour <b>ne jamais perdre ta collection</b> et la retrouver sur tous tes appareils. Elle sera sauvegardée en ligne automatiquement.</p>'}
    ${FIREBASE.googleClientId ? '<div class="bouton-google" aria-label="Continuer avec Google"></div><p class="separateur"><span>ou</span></p>' : ''}
    <form class="form-compte" novalidate>
      ${retour ? '' : `<div class="onglets-compte" role="tablist">
        <button type="button" class="actif" data-mode="creer" role="tab" aria-selected="true">Créer un compte</button>
        <button type="button" data-mode="connexion" role="tab" aria-selected="false">J'ai déjà un compte</button>
      </div>`}
      <label>E-mail<input type="email" name="email" autocomplete="email" required></label>
      <label>Mot de passe<input type="password" name="mdp" autocomplete="${retour ? 'current' : 'new'}-password" minlength="6" required>${retour ? '' : '<small>6 caractères au moins</small>'}</label>
      <button class="principal" type="submit" data-valider>${retour ? 'Me connecter' : 'Créer mon compte'}</button>
      <button class="lien" type="button" data-oubli${retour ? '' : ' hidden'}>Mot de passe oublié ?</button>
      <p class="etat-compte" role="status"></p>
    </form>
    <p class="note">Ton e-mail sert seulement à te connecter. Il n'est jamais montré aux autres joueurs.</p>
    <button class="lien" data-fermer>Fermer</button>`, true);
  let mode: 'creer' | 'connexion' = retour ? 'connexion' : 'creer';
  const form = f.querySelector<HTMLFormElement>('.form-compte')!;
  const etat = (t: string, erreur = false) => { const p = f.querySelector('.etat-compte')!; p.textContent = t; p.className = `etat-compte ${erreur ? 'erreur' : ''}`; };
  f.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode as typeof mode;
    f.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((x) => { x.classList.toggle('actif', x === b); x.setAttribute('aria-selected', String(x === b)); });
    f.querySelector<HTMLButtonElement>('[data-valider]')!.textContent = mode === 'creer' ? 'Créer mon compte' : 'Me connecter';
    f.querySelector<HTMLButtonElement>('[data-oubli]')!.hidden = mode === 'creer';
    form.querySelector<HTMLInputElement>('[name=mdp]')!.autocomplete = mode === 'creer' ? 'new-password' : 'current-password';
    etat('');
  }));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = form.querySelector<HTMLInputElement>('[name=email]')!.value;
    const mdp = form.querySelector<HTMLInputElement>('[name=mdp]')!.value;
    const bouton = form.querySelector<HTMLButtonElement>('[data-valider]')!;
    bouton.disabled = true;
    etat(mode === 'creer' ? 'Création du compte…' : 'Connexion…');
    try {
      if (mode === 'creer') await creerCompteEmail(email, mdp); else await connexionEmail(email, mdp);
      await apresConnexion(mode === 'creer' ? 'Compte créé ! Ta collection est maintenant sauvegardée en ligne.' : 'Connecté ! ');
    } catch (err) {
      etat(messageErreur(err), true);
      bouton.disabled = false;
    }
  });
  f.querySelector('[data-oubli]')!.addEventListener('click', async () => {
    const email = form.querySelector<HTMLInputElement>('[name=email]')!.value;
    if (!email) return etat('Écris d\'abord ton e-mail.', true);
    try { await motDePasseOublie(email); etat('Un e-mail pour choisir un nouveau mot de passe vient d\'être envoyé.'); } catch (err) { etat(messageErreur(err), true); }
  });
  const zone = f.querySelector<HTMLElement>('.bouton-google');
  if (zone) brancherGoogle(zone, (err) => etat(err, true));
}

async function apresConnexion(message: string) {
  if (modeRetour) return retrouverCollection();
  fermerFenetre();
  await synchroniser(true);
  if (document.querySelector('.voile')) return; // le joueur choisit sa sauvegarde
  route(); // le menu affiche maintenant « Sauvegardé »
  programmerPublication(S.collection, 500); // les points du mois entrent dans le classement
  fenetreCompte(message.trim() || 'Connecté !');
}

// Connexion depuis un nouvel appareil : on reprend la collection du compte. Un compte qui a une
// sauvegarde prouve que le joueur a déjà été invité : plus besoin du code d'invitation.
async function retrouverCollection() {
  let enLigne: SauvegardeEnLigne | null;
  try { enLigne = await lireEnLigne(); } catch { return fenetreCompte('Connexion impossible pour le moment. Vérifie ta connexion internet et réessaie.', true); }
  if (!enLigne?.code) {
    // Compte sans sauvegarde : on n'y envoie rien de ce téléphone vide.
    const suite = invitationOk() ? 'Choisis ton pseudo pour commencer : ta collection y sera sauvegardée.' : 'Entre ton code d\'invitation pour commencer.';
    fermerFenetre();
    return fenetreCompte(`Ce compte n'a pas encore de collection. ${suite}`);
  }
  fermerFenetre();
  accorderInvitation();
  await synchroniser(true, enLigne);
  if (document.querySelector('.voile')) return; // deux sauvegardes : le joueur choisit
  route();
  programmerPublication(S.collection, 500);
  if (S.collection.coach) annoncer(`Bon retour, Coach ${S.collection.coach} !`, '#', 'Ta collection est de retour sur cet appareil.');
}

// ---------- Bouton « Continuer avec Google » (Google Identity Services) ----------

type Google = { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } };
let chargement: Promise<Google> | null = null;
function chargerGoogle(): Promise<Google> {
  const w = window as unknown as { google?: Google };
  if (w.google?.accounts) return Promise.resolve(w.google);
  chargement ??= new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? ok(w.google) : ko(new Error('Google indisponible')));
    s.onerror = () => { chargement = null; ko(new Error('Google indisponible')); };
    document.head.append(s);
  });
  return chargement;
}

function brancherGoogle(zone: HTMLElement, erreur: (t: string) => void) {
  chargerGoogle().then((g) => {
    g.accounts.id.initialize({
      client_id: FIREBASE.googleClientId,
      callback: async (r: { credential: string }) => {
        try {
          await connexionGoogle(r.credential, location.origin + location.pathname);
          await apresConnexion('Connecté avec Google ! Ta collection est sauvegardée en ligne.');
        } catch (err) { erreur(messageErreur(err)); }
      },
    });
    g.accounts.id.renderButton(zone, { theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'pill', locale: 'fr', width: 280 });
  }).catch(() => { zone.innerHTML = '<p class="note">Connexion Google indisponible pour le moment : utilise ton e-mail.</p>'; });
}

// ---------- Proposition dans le menu, après quelques victoires ----------

export function bandeauCompte(): string {
  if (compteActuel()) return '';
  if (S.collection.victoires < VICTOIRES_PROPOSITION || S.collection.menusVus.includes(MARQUE_PROPOSITION)) return '';
  return `<div class="bandeau-compte"><p>🔒 <b>Ne perds jamais ta collection.</b> Crée un compte gratuit : elle sera sauvegardée en ligne et tu la retrouveras sur tous tes appareils.</p>
    <div class="bc-boutons"><button class="principal" data-compte-oui>Créer mon compte</button><button class="lien" data-compte-non>Plus tard</button></div></div>`;
}

export function brancherBandeauCompte(racine: ParentNode) {
  const fermer = () => { if (!S.collection.menusVus.includes(MARQUE_PROPOSITION)) S.collection.menusVus.push(MARQUE_PROPOSITION); sauver(S.collection); racine.querySelector('.bandeau-compte')?.remove(); };
  racine.querySelector('[data-compte-oui]')?.addEventListener('click', () => { fermer(); fenetreCompte(); });
  racine.querySelector('[data-compte-non]')?.addEventListener('click', fermer);
}

// Petit indicateur dans l'en-tête du menu.
// « J'ai déjà un compte » sur les premiers écrans (code d'invitation, pseudo) d'un nouvel appareil.
export const lienCompteExistant = () => '<p class="compte-existant">Déjà joué sur un autre téléphone ou navigateur ? <button class="lien" type="button" data-compte-existant>J\'ai déjà un compte</button></p>';
export function brancherCompteExistant(racine: ParentNode) {
  racine.querySelector('[data-compte-existant]')?.addEventListener('click', () => fenetreCompte('', true));
}

// Bouton « Mon compte » sous le pseudo, dans le menu (27/11/2026) : toujours visible. Connecté, il
// montre l'état de la sauvegarde en ligne ; sinon il invite à protéger sa collection.
export const indicateurCompte = () => (compteActuel()
  ? '<button class="bouton-compte connecte" data-mon-compte>👤 Mon compte · <span class="etat-cloud">☁ Sauvegardé ✓</span></button>'
  : '<button class="bouton-compte" data-mon-compte>👤 Mon compte · <span>non sauvegardé</span></button>');
