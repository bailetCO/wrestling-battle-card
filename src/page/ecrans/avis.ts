// Écrans des avis et des signalements de bug (bêta).

import { LUTTEURS } from '../../moteur';
import {
  QUESTIONS, avisEnvoye, avisInvite, compterCombat, construireAvis, construireBug, contact, envoyer, garderContact, inviterAvis, viderFile,
  type ContexteBug, type Donnees, type Pratique,
} from '../avis';
import { deposer } from '../firebase';
import type { Partie, RapportCombat } from '../partie';
import { ouvrirFenetre } from './combat';
import { S, app, echap } from './commun';

const envoi = (d: Donnees) => envoyer(deposer, 'avis', d, 'avis');

// ---------- Dernier combat joué (joint aux signalements de bug) ----------

let dernierCombat: RapportCombat | null = null;
const comptees = new WeakSet<object>();

// Appelé à la fin de chaque combat : garde de quoi le rejouer, et compte les combats (invitation à l'avis).
export function noterFinCombat(partie: Partie | null, cle: object | null = partie) {
  if (partie) dernierCombat = partie.rapport();
  if (cle && !comptees.has(cle)) {
    comptees.add(cle);
    compterCombat();
  }
}

function contexte(): ContexteBug {
  return {
    ecranJeu: location.hash.slice(1) || 'menu',
    appareil: navigator.userAgent,
    ecran: `${innerWidth}×${innerHeight}`,
    combat: S.partie ? S.partie.rapport() : dernierCombat,
  };
}

// ---------- Morceaux de formulaire ----------

const cases = (nom: string, choix: string[]) => `<div class="av-cases">${choix.map((c) => `<label class="av-case"><input type="checkbox" name="${nom}" value="${echap(c)}"> ${echap(c)}</label>`).join('')}</div>`;

const blocContact = () => {
  const c = contact();
  return `<div class="av-contact">
    <label class="av-case"><input type="checkbox" name="age15" ${c.age15 ? 'checked' : ''}> J'ai 15 ans ou plus</label>
    <label class="av-email" ${c.age15 ? '' : 'hidden'}>${QUESTIONS.email}
      <input type="email" name="email" maxlength="120" autocomplete="email" value="${echap(c.email)}" placeholder="toi@exemple.fr"></label>
    <p class="note">Signé de ton pseudo de coach (${echap(S.collection.coach ?? '')}). L'adresse sert seulement à te répondre, elle n'est jamais affichée dans le jeu.</p>
  </div>`;
};

function brancherContact(f: HTMLElement) {
  const age = f.querySelector<HTMLInputElement>('[name="age15"]')!;
  age.addEventListener('change', () => { f.querySelector<HTMLElement>('.av-email')!.hidden = !age.checked; });
}

const lireContact = (f: HTMLElement) => ({
  age15: f.querySelector<HTMLInputElement>('[name="age15"]')!.checked,
  email: f.querySelector<HTMLInputElement>('[name="email"]')!.value,
});

async function envoyerEtConclure(f: HTMLElement, d: Donnees | string, merci: string, apres = () => {}) {
  const zone = f.querySelector('.av-etat')!;
  if (typeof d === 'string') { zone.innerHTML = `<p class="erreur">${echap(d)}</p>`; return; }
  const bouton = f.querySelector<HTMLButtonElement>('[data-envoyer]')!;
  bouton.disabled = true;
  zone.innerHTML = '<p class="note">Envoi…</p>';
  const r = await envoi(d);
  if (r === 'refuse') {
    bouton.disabled = false;
    zone.innerHTML = '<p class="erreur">Envoi refusé : attends une minute entre deux envois, puis réessaie.</p>';
    return;
  }
  garderContact(String(d.email ?? ''), d.age15 === true);
  apres();
  ouvrirFenetre(`<h2>Merci !</h2><p>${merci}</p>${r === 'attente' ? '<p class="note">Pas de réseau pour l\'instant : ton message partira tout seul à ta prochaine connexion.</p>' : ''}
    <button class="principal" data-fermer>Retour au jeu</button>`, true);
}

// ---------- Donner son avis ----------

export function fenetreAvis() {
  avisInvite();
  const lutteurs = [...LUTTEURS].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const f = ouvrirFenetre(`
    <h2>Donner mon avis</h2>
    <p class="note">2 minutes. Toutes les questions sont facultatives, sauf la note.</p>
    <form class="av-form" novalidate>
      <fieldset><legend>${QUESTIONS.note}</legend>
        <div class="av-etoiles">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="note" value="${n}"><span aria-label="${n} sur 5">★</span></label>`).join('')}</div>
      </fieldset>
      <fieldset><legend>${QUESTIONS.prefere.titre}</legend>${cases('prefere', QUESTIONS.prefere.choix)}</fieldset>
      <fieldset><legend>${QUESTIONS.difficile.titre}</legend>${cases('difficile', QUESTIONS.difficile.choix)}
        <label class="av-libre">${QUESTIONS.difficileTexte}<input name="difficileTexte" maxlength="300"></label></fieldset>
      <fieldset><legend>${QUESTIONS.lutteur}</legend>
        <select name="lutteur"><option value="">Non</option>${lutteurs.map((l) => `<option value="${l.id}">${echap(l.nom)}</option>`).join('')}</select>
        <div class="av-sens"><label class="av-case"><input type="radio" name="sens" value="fort"> Trop fort</label><label class="av-case"><input type="radio" name="sens" value="faible"> Trop faible</label></div>
      </fieldset>
      <fieldset><legend>${QUESTIONS.pratique.titre}</legend>
        <div class="av-cases">${Object.entries(QUESTIONS.pratique.choix).map(([k, v]) => `<label class="av-case"><input type="radio" name="pratique" value="${k}"> ${v}</label>`).join('')}</div>
      </fieldset>
      <label class="av-libre">${QUESTIONS.texte}<textarea name="texte" maxlength="500" rows="3"></textarea></label>
      ${blocContact()}
      <div class="av-etat" role="status"></div>
      <button class="principal" type="submit" data-envoyer>Envoyer mon avis</button>
    </form>
    <button class="lien" data-fermer>Annuler</button>`, true);
  brancherContact(f);
  // Étoiles : tout jusqu'à la note choisie s'allume.
  f.querySelectorAll<HTMLInputElement>('[name="note"]').forEach((r) => r.addEventListener('change', () => {
    f.querySelectorAll<HTMLInputElement>('[name="note"]').forEach((x) => x.parentElement!.classList.toggle('allume', Number(x.value) <= Number(r.value)));
  }));
  f.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const val = (n: string) => f.querySelector<HTMLInputElement>(`[name="${n}"]:checked`)?.value ?? '';
    const coches = (n: string) => [...f.querySelectorAll<HTMLInputElement>(`[name="${n}"]:checked`)].map((x) => x.value);
    const champ = (n: string) => f.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${n}"]`)!.value;
    const d = construireAvis({
      pseudo: S.collection.coach ?? '', ...lireContact(f), note: Number(val('note')),
      prefere: coches('prefere'), difficile: coches('difficile'), difficileTexte: champ('difficileTexte'),
      lutteur: champ('lutteur'), sens: val('sens') as '' | 'fort' | 'faible', pratique: val('pratique') as Pratique | '', texte: champ('texte'),
    });
    envoyerEtConclure(f, d, 'Ton avis est bien arrivé. Il nous aide à rendre le jeu meilleur.', avisEnvoye);
  });
}

// ---------- Signaler un bug ----------

export function fenetreBug(description = '') {
  const f = ouvrirFenetre(`
    <h2>Signaler un bug</h2>
    <form class="av-form" novalidate>
      <label class="av-libre">Que s'est-il passé ? Qu'est-ce que tu faisais juste avant ?
        <textarea name="texte" maxlength="1000" rows="4" placeholder="Exemple : en tournoi, après le pile ou face, l'écran est resté bloqué.">${echap(description)}</textarea></label>
      <p class="note">Le jeu joint automatiquement la version, le type de téléphone, la taille de l'écran, l'écran où tu étais et ton dernier combat contre l'ordinateur (pour le rejouer à l'identique). Rien d'autre.</p>
      ${blocContact()}
      <div class="av-etat" role="status"></div>
      <button class="principal" type="submit" data-envoyer>Envoyer le signalement</button>
    </form>
    <button class="lien" data-fermer>Annuler</button>`, true);
  brancherContact(f);
  f.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const c = lireContact(f);
    const d = construireBug(f.querySelector<HTMLTextAreaElement>('[name="texte"]')!.value, S.collection.coach ?? '', c.age15, c.email, contexte());
    envoyerEtConclure(f, d, 'Ton signalement est bien arrivé. Merci de nous aider à corriger le jeu !');
  });
}

// ---------- Invitation dans le menu (une fois, après le 5e combat) ----------

export const bandeauAvis = () => !inviterAvis() ? '' : `
  <section class="bloc av-invitation" aria-label="Donner ton avis">
    <p><b>Ton avis compte !</b> Tu as joué plusieurs combats : 2 minutes pour nous dire ce que tu en penses ?</p>
    <div class="sv-boutons"><button class="principal" data-avis-oui>Donner mon avis</button><button class="secondaire" data-avis-non>Plus tard</button></div>
  </section>`;

export function brancherAvis() {
  app.querySelector('[data-avis-oui]')?.addEventListener('click', () => { app.querySelector('.av-invitation')?.remove(); fenetreAvis(); });
  app.querySelector('[data-avis-non]')?.addEventListener('click', () => { avisInvite(); app.querySelector('.av-invitation')?.remove(); });
  app.querySelector('[data-donner-avis]')?.addEventListener('click', () => fenetreAvis());
  app.querySelector('[data-signaler]')?.addEventListener('click', () => fenetreBug());
}

// ---------- Démarrage : envois en attente, page qui plante ----------

let erreurMontree = false;

export function demarrerAvis() {
  viderFile(deposer).catch(() => {});
  const surErreur = (message: string) => {
    if (erreurMontree) return;
    erreurMontree = true;
    const f = ouvrirFenetre(`<h2>Oups, un problème</h2>
      <p>Le jeu a rencontré une erreur. Tu peux nous envoyer un rapport pour qu'on la corrige, puis recharger le jeu (ta collection est gardée).</p>
      <button class="principal" data-rapport>Envoyer un rapport</button>
      <button class="secondaire" data-recharger>Recharger le jeu</button>
      <button class="lien" data-fermer>Continuer quand même</button>`, true);
    f.querySelector('[data-rapport]')!.addEventListener('click', () => fenetreBug(`Erreur du jeu : ${message.slice(0, 300)}\n\nCe que je faisais : `));
    f.querySelector('[data-recharger]')!.addEventListener('click', () => location.reload());
  };
  window.addEventListener('error', (ev) => { if (ev.error) surErreur(String(ev.error?.message ?? ev.message)); });
}

