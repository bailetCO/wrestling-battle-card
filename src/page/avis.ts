// Avis et signalements de bug des testeurs (bêta), sans affichage (voir ecrans/avis.ts).
// Les textes des questions sont ici : on peut les modifier sans toucher au reste.

import { VERSION } from './nouveautes';

export const QUESTIONS = {
  note: 'As-tu envie de rejouer ?',
  prefere: { titre: 'Qu\'as-tu préféré ?', choix: ['Les combats', 'La collection', 'Le mode histoire', 'Les tournois', 'Les combats entre amis', 'Le combat automatique', 'La fusion des cartes', 'Mon Club'] },
  difficile: { titre: 'Qu\'est-ce qui était difficile à comprendre ?', choix: ['L\'initiative', 'Le pile ou face', 'Les enchaînements et combos', 'L\'endurance et le souffle', 'La fusion', 'Les boosters et la boutique', 'Le mode histoire', 'Les tournois', 'Rien, tout était clair'] },
  difficileTexte: 'Tu peux préciser (facultatif)',
  lutteur: 'Un lutteur t\'a paru trop fort ou trop faible ?',
  pratique: { titre: 'Pratiques-tu la lutte ?', choix: { jamais: 'Jamais', loisir: 'En loisir', competition: 'En compétition', entraineur: 'Je suis entraîneur' } },
  texte: 'Un mot libre (500 caractères au plus)',
  email: 'Ton adresse e-mail, pour qu\'on puisse te répondre',
};

export type Pratique = keyof typeof QUESTIONS.pratique.choix;
export type Donnees = Record<string, string | number | boolean | string[] | null | undefined>;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,100}\.[a-z]{2,}$/i;
const couper = (t: string, max: number) => t.trim().replace(/\s+\n/g, '\n').slice(0, max);

export interface ReponsesAvis {
  pseudo: string; age15: boolean; email: string; note: number;
  prefere: string[]; difficile: string[]; difficileTexte: string;
  lutteur: string; sens: '' | 'fort' | 'faible'; pratique: Pratique | ''; texte: string;
}

// Vérifie le questionnaire. Rend les données à envoyer, ou un message pour le joueur.
export function construireAvis(r: ReponsesAvis): Donnees | string {
  if (!(r.note >= 1 && r.note <= 5)) return 'Donne une note de 1 à 5 étoiles.';
  const email = r.age15 ? r.email.trim() : '';
  if (r.age15 && !EMAIL.test(email)) return 'Ton adresse e-mail a l\'air incomplète.';
  if (r.lutteur && !r.sens) return 'Ce lutteur est-il trop fort ou trop faible ?';
  return {
    type: 'avis', version: VERSION, pseudo: couper(r.pseudo || 'Sans pseudo', 16), age15: r.age15, email: email || null,
    note: Math.round(r.note),
    prefere: r.prefere.filter((x) => QUESTIONS.prefere.choix.includes(x)).slice(0, 8),
    difficile: r.difficile.filter((x) => QUESTIONS.difficile.choix.includes(x)).slice(0, 10),
    difficileTexte: couper(r.difficileTexte, 300),
    lutteur: r.lutteur ? couper(r.lutteur, 40) : null, sens: r.lutteur ? r.sens : null,
    pratique: r.pratique || null, texte: couper(r.texte, 500),
  };
}

export interface ContexteBug { ecranJeu: string; appareil: string; ecran: string; combat: unknown }

export function construireBug(description: string, pseudo: string, age15: boolean, email: string, c: ContexteBug): Donnees | string {
  const texte = couper(description, 1000);
  if (texte.length < 5) return 'Décris le problème en quelques mots.';
  const mail = age15 ? email.trim() : '';
  if (mail && !EMAIL.test(mail)) return 'Ton adresse e-mail a l\'air incomplète.';
  let combat = c.combat ? JSON.stringify(c.combat) : '';
  if (combat.length > 20_000) combat = ''; // trop long : on garde le reste du signalement
  return {
    type: 'bug', version: VERSION, pseudo: couper(pseudo || 'Sans pseudo', 16), age15, email: mail || null, texte,
    ecranJeu: couper(c.ecranJeu || 'menu', 40), appareil: couper(c.appareil, 300), ecran: couper(c.ecran, 20), combat: combat || null,
  };
}

// ---------- File d'attente : un envoi qui échoue (pas de réseau) repart plus tard ----------

const CLE_FILE = 'wbc-envois';
const MAX_FILE = 200;
type Envoi = { collection: string; limite: string; donnees: Donnees };

const lire = <T>(k: string, defaut: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? defaut; } catch { return defaut; } };
const ecrire = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* navigation privée */ } };

export type Deposer = (collection: string, donnees: Donnees, limite: string) => Promise<boolean>;

// Envoie tout de suite si possible ; sinon met en attente. Rend 'envoye' ou 'attente'.
// Un refus de Firebase (envoi trop rapproché, données refusées) n'est pas réessayé.
export async function envoyer(deposer: Deposer, collection: string, donnees: Donnees, limite: string): Promise<'envoye' | 'refuse' | 'attente'> {
  try {
    return (await deposer(collection, donnees, limite)) ? 'envoye' : 'refuse';
  } catch {
    const file = lire<Envoi[]>(CLE_FILE, []);
    file.push({ collection, limite, donnees });
    ecrire(CLE_FILE, file.slice(-MAX_FILE));
    return 'attente';
  }
}

// Réessaie les envois en attente (au démarrage du jeu). S'arrête au premier échec réseau.
export async function viderFile(deposer: Deposer): Promise<number> {
  const file = lire<Envoi[]>(CLE_FILE, []);
  let n = 0;
  while (file.length) {
    try {
      await deposer(file[0].collection, file[0].donnees, file[0].limite);
    } catch {
      break;
    }
    file.shift();
    n++;
    ecrire(CLE_FILE, file);
    if (file.length) await new Promise((r) => setTimeout(r, 61_000)); // une minute entre deux avis (règles Firebase)
  }
  return n;
}

// ---------- Inviter à donner son avis : une fois, après le 5e combat ----------

const CLE_AVIS = 'wbc-avis';
type EtatAvis = { combats: number; invite: boolean; envoye: boolean };
export const COMBATS_AVANT_INVITATION = 5;

const etatAvis = (): EtatAvis => ({ combats: 0, invite: false, envoye: false, ...lire<Partial<EtatAvis>>(CLE_AVIS, {}) });

export function compterCombat() {
  const e = etatAvis();
  e.combats++;
  ecrire(CLE_AVIS, e);
}
export const inviterAvis = () => { const e = etatAvis(); return e.combats >= COMBATS_AVANT_INVITATION && !e.invite && !e.envoye; };
export const avisInvite = () => ecrire(CLE_AVIS, { ...etatAvis(), invite: true });
export const avisEnvoye = () => ecrire(CLE_AVIS, { ...etatAvis(), envoye: true });

// Pseudo et adresse retenus d'un envoi à l'autre (le joueur n'a pas à les retaper).
const CLE_CONTACT = 'wbc-contact';
export const contact = () => lire<{ email: string; age15: boolean }>(CLE_CONTACT, { email: '', age15: false });
export const garderContact = (email: string, age15: boolean) => ecrire(CLE_CONTACT, { email: age15 ? email : '', age15 });
