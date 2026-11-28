// Codes créateurs (28/11/2026), sans affichage.
// Corentin crée les codes dans la console Firebase : Firestore, collection « createurs », une fiche par
// code (identifiant = le code en majuscules) avec nom, nation (le style de la carte), image (lien,
// facultatif) et actif (vrai/faux). Un joueur peut entrer chaque code une fois : il reçoit un booster
// épique et la carte du créateur, Champion du Monde (statistiques et actions du Champion du Monde
// de sa nation, avec le nom et l'image du créateur). Son « créateur soutenu » est le dernier code
// entré ; chaque soutien est noté en ligne (soutiens/<joueur>_<code>) pour les statistiques.

import { CARTES_SPECIALES, CHAMPIONS, NATIONS, type DefLutteur } from '../moteur';
import { APPARENCE, apparenceDe } from './portrait';
import { FIREBASE, connexion, type Session } from './firebase';

export interface Createur { code: string; nom: string; nation: string; image: string }

export const normaliserCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const codeValide = (code: string) => /^[A-Z0-9]{3,20}$/.test(code);
export const idCarteCreateur = (code: string) => `createur-${code.toLowerCase()}`;
export const nationValide = (n: string) => NATIONS.some((x) => x.id === n) && CHAMPIONS.some((c) => c.nation === n);
const imageValide = (u: string) => u === '' || /^https:\/\/[^\s"'<>]+$/.test(u);

export function createurValide(x: unknown): x is Createur {
  const c = x as Createur;
  return !!c && typeof c.code === 'string' && codeValide(c.code) && typeof c.nom === 'string' && c.nom.trim().length > 0 && c.nom.length <= 30
    && typeof c.nation === 'string' && nationValide(c.nation) && typeof c.image === 'string' && imageValide(c.image);
}

// La carte du créateur : le Champion du Monde de sa nation, avec son nom (et son image).
export function defCreateur(cr: Createur): DefLutteur {
  const ch = CHAMPIONS.find((c) => c.nation === cr.nation)!;
  return { ...ch, id: idCarteCreateur(cr.code), nom: cr.nom.trim(), origine: 'Créateur', actions: [...ch.actions], actionsPossibles: [...ch.actionsPossibles], deblocages: [...ch.deblocages] };
}

// Rend la carte connue du jeu (collection, combats, sauvegarde). Sans effet si elle l'est déjà.
export function enregistrerCreateur(cr: Createur): DefLutteur {
  const id = idCarteCreateur(cr.code);
  const deja = CARTES_SPECIALES.find((l) => l.id === id);
  if (deja) return deja;
  const def = defCreateur(cr);
  CARTES_SPECIALES.push(def);
  if (cr.image) APPARENCE[id] = { ...apparenceDe(def), image: cr.image };
  return def;
}

// ---------- En ligne ----------

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
const NOM = `projects/${FIREBASE.projectId}/databases/(default)/documents`;
const entete = (s: Session) => ({ 'content-type': 'application/json', authorization: `Bearer ${s.jeton}` });
type Champ = { stringValue?: string; booleanValue?: boolean };

// Lit la fiche d'un code. null : code inconnu ou désactivé ; une erreur : hors ligne.
export async function lireCode(code: string): Promise<Createur | null> {
  const s = await connexion();
  const r = await fetch(`${BASE}/createurs/${code}`, { headers: entete(s) });
  if (r.status === 404 || r.status === 403) return null;
  if (!r.ok) throw new Error(`Lecture du code impossible (${r.status})`);
  const f = ((await r.json()) as { fields?: Record<string, Champ> }).fields ?? {};
  if (f.actif?.booleanValue === false) return null;
  const cr = { code, nom: f.nom?.stringValue ?? '', nation: (f.nation?.stringValue ?? '').trim().toLowerCase(), image: (f.image?.stringValue ?? '').trim() };
  return createurValide(cr) ? cr : null;
}

// Note le soutien en ligne (pour les statistiques de Corentin). Sans réseau : tant pis.
export async function noterSoutien(code: string, idCoach: string): Promise<boolean> {
  const s = await connexion();
  const corps = { writes: [{ update: { name: `${NOM}/soutiens/${s.uid}_${code}`, fields: { code: { stringValue: code }, idCoach: { stringValue: idCoach } } }, currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 'cree', setToServerValue: 'REQUEST_TIME' }] }] };
  const r = await fetch(`${BASE}:commit`, { method: 'POST', headers: entete(s), body: JSON.stringify(corps) });
  return r.ok;
}
