// Parrainage (27/11/2026), sans affichage.
// - Lien perso : …/?parrain=<identifiant de coach>&de=<pseudo>. Il fait entrer dans la bêta fermée.
// - Nouveau joueur arrivé par ce lien : booster rare de bienvenue ; le parrain devient son ami.
//   Quand il crée un vrai compte (Google ou e-mail), il le signale en ligne :
//   Firestore parrainages/<son identifiant> (un seul parrain par compte, pour toujours).
// - Joueur qui jouait déjà : pas de parrainage, mais les deux deviennent amis
//   (Firestore amities/<son identifiant>_<parrain>).
// - Le parrain lit ces fiches au lancement et dans Social : ami ajouté, et pour un parrainage,
//   1 booster rare (et une carte légendaire au 3e), 10 parrainages récompensés au plus.

import { LUTTEURS, REGLES } from '../moteur';
import { nbExemplaires, ouvrirBooster, type Booster, type Collection } from './collection';
import { compteActuel } from './compte';
import { FIREBASE, connexion, type Session } from './firebase';
import { LIEN_JEU } from './partage';

const P = REGLES.parrainage;
const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
const NOM = `projects/${FIREBASE.projectId}/databases/(default)/documents`;
const idValide = (x: string) => /^[a-z0-9]{6,40}$/i.test(x);

export const lienParrainage = (c: Collection) =>
  `${LIEN_JEU}?parrain=${encodeURIComponent(c.idCoach)}&de=${encodeURIComponent(c.coach ?? '')}`;

export const texteInvitation = (c: Collection) =>
  `Viens jouer à Wrestling Battle Card avec moi${c.coach ? ` (Coach ${c.coach})` : ''} ! Avec ce lien, tu reçois un booster rare de bienvenue :`;

// Lit ?parrain=…&de=… dans l'adresse (puis le retire). null : pas de lien de parrainage.
export function lireLienParrain(adresse: URL): { id: string; pseudo: string } | null {
  const id = adresse.searchParams.get('parrain');
  if (!id || !idValide(id)) return null;
  const pseudo = (adresse.searchParams.get('de') ?? '').trim().slice(0, 16) || 'Coach';
  return { id, pseudo };
}

// Ajoute (ou met à jour) un ami dans la liste d'amis.
export function ajouterAmi(c: Collection, id: string, pseudo: string, quand = Date.now()) {
  if (id === c.idCoach) return;
  const a = c.amis[id] ?? { pseudo, vu: 0, victoires: 0, defaites: 0, echanges: 0 };
  a.pseudo = pseudo || a.pseudo;
  a.vu = Math.max(a.vu, quand);
  c.amis[id] = a;
}

// Un joueur ouvre un lien de parrainage. Nouveau joueur : parrainé, booster rare de bienvenue.
// Joueur existant : juste amis. Renvoie ce qui s'est passé.
export function accueillirParrain(c: Collection, parrain: { id: string; pseudo: string }, hasard: () => number = Math.random): { type: 'filleul'; cadeau: Booster } | { type: 'ami' } | null {
  if (parrain.id === c.idCoach) return null; // son propre lien
  ajouterAmi(c, parrain.id, parrain.pseudo);
  const nouveau = !c.coach && c.victoires === 0 && c.histoire.etape === 0;
  if (!nouveau || c.parrain) return { type: 'ami' };
  c.parrain = { ...parrain, declare: false };
  return { type: 'filleul', cadeau: ouvrirBooster(c, hasard, 'rare') };
}

// Récompense du parrain pour un ami de plus (null : plafond atteint).
export function recompenseParrain(c: Collection, hasard: () => number = Math.random): Booster[] | null {
  if (c.parrainage.recompenses >= P.recompensesMax) return null;
  c.parrainage.recompenses++;
  const boosters = [ouvrirBooster(c, hasard, 'rare')];
  if (c.parrainage.recompenses === P.bonusLegendaireAu) {
    const legendaires = LUTTEURS.filter((l) => l.rarete === 'legendaire');
    const l = legendaires[Math.floor(hasard() * legendaires.length)];
    const nouvelle = nbExemplaires(c, l.id) === 0;
    c.exemplaires[l.id] = nbExemplaires(c, l.id) + 1;
    boosters.push({ type: 'recompense', cartes: [l.id], nouvelles: nouvelle ? [l.id] : [] });
  }
  return boosters;
}

// ---------- En ligne ----------

const entete = (s: Session) => ({ 'content-type': 'application/json', authorization: `Bearer ${s.jeton}` });

async function creer(s: Session, chemin: string, fields: Record<string, unknown>): Promise<boolean> {
  // « exists: false » : on crée seulement, sans jamais remplacer une fiche existante.
  const corps = { writes: [{ update: { name: `${NOM}/${chemin}`, fields }, currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 'cree', setToServerValue: 'REQUEST_TIME' }] }] };
  const r = await fetch(`${BASE}:commit`, { method: 'POST', headers: entete(s), body: JSON.stringify(corps) });
  if (r.ok) return true;
  const t = await r.text().catch(() => '');
  return /ALREADY_EXISTS/.test(t); // déjà signalé : c'est fait
}

// Filleul avec un vrai compte : signale son parrain (une fois).
export async function declarerParrain(c: Collection): Promise<boolean> {
  if (!c.parrain || c.parrain.declare || !compteActuel() || !c.coach) return false;
  const s = await connexion();
  if (!s.compte) return false;
  const ok = await creer(s, `parrainages/${s.uid}`, { parrain: { stringValue: c.parrain.id }, idCoach: { stringValue: c.idCoach }, pseudo: { stringValue: c.coach } });
  if (ok) c.parrain.declare = true;
  return ok;
}

// Joueur existant qui a ouvert le lien d'un ami : prévient cet ami (une fois par ami).
export async function signalerAmitie(c: Collection, ami: string): Promise<boolean> {
  if (!c.coach || !idValide(ami)) return false;
  const s = await connexion();
  return creer(s, `amities/${s.uid}_${ami}`, { vers: { stringValue: ami }, idCoach: { stringValue: c.idCoach }, pseudo: { stringValue: c.coach } });
}

type Doc = { name: string; fields?: Record<string, { stringValue?: string; timestampValue?: string }> };
async function chercher(s: Session, collection: string, champ: string, valeur: string): Promise<Doc[]> {
  const q = { structuredQuery: { from: [{ collectionId: collection }], where: { fieldFilter: { field: { fieldPath: champ }, op: 'EQUAL', value: { stringValue: valeur } } }, limit: 100 } };
  const r = await fetch(`${BASE}:runQuery`, { method: 'POST', headers: entete(s), body: JSON.stringify(q) });
  if (!r.ok) throw new Error(`Lecture refusée (${r.status})`);
  return ((await r.json()) as { document?: Doc }[]).flatMap((x) => (x.document ? [x.document] : []));
}

export interface Nouvel { id: string; pseudo: string; filleul: boolean }

// Parrain : les amis arrivés par son lien (filleuls avec un vrai compte, et joueurs existants).
// Ne renvoie que les nouveaux, et les note comme vus.
export async function nouveauxAmisInvites(c: Collection): Promise<Nouvel[]> {
  const s = await connexion();
  const [filleuls, amis] = await Promise.all([chercher(s, 'parrainages', 'parrain', c.idCoach), chercher(s, 'amities', 'vers', c.idCoach)]);
  const res: Nouvel[] = [];
  for (const [docs, filleul] of [[filleuls, true], [amis, false]] as const) {
    for (const d of docs) {
      const id = d.fields?.idCoach?.stringValue ?? '';
      const cle = `${filleul ? 'f' : 'a'}:${id}`;
      if (!idValide(id) || id === c.idCoach || c.parrainage.vus.includes(cle)) continue;
      c.parrainage.vus.push(cle);
      res.push({ id, pseudo: (d.fields?.pseudo?.stringValue ?? 'Coach').slice(0, 16), filleul });
    }
  }
  return res;
}
