// Classement mensuel (27/11/2026), sans affichage.
// - Points de combat : chaque victoire rapporte des points selon la difficulté (voir REGLES.classement).
//   Plafond par jour, remise à zéro le 1er du mois (heure universelle, la même que celle du serveur).
// - Les points comptent pour tout le monde ; ils ne sont publiés (et le classement n'est visible)
//   qu'avec un compte. Publication dans Firestore : classements/<mois>/joueurs/<identifiant>.
// - Trois classements : tous les joueurs, mes amis (liste d'amis), mon pays (choisi par le joueur).
// - Fin du mois : récompense du palier atteint (Bronze, Argent, Or), plus un booster rare et le badge
//   « Top 10 » pour les 10 premiers (vérifié en ligne). Le badge s'affiche à côté du pseudo.
// Le combat est calculé sur le téléphone : les règles de Firebase empêchent seulement de dépasser le
// plafond du jour, pas un tricheur décidé à envoyer de faux combats sous ce plafond.

import { REGLES } from '../moteur';
import type { Niveau } from '../moteur/ia';
import { joindreGains, ouvrirBooster, type Booster, type Collection } from './collection';
import { compteActuel } from './compte';
import { FIREBASE, connexion, type Session } from './firebase';

const R = REGLES.classement;
const JOUR_MS = 86_400_000;
export const jourUTC = (ms: number) => Math.floor(ms / JOUR_MS);
export const moisUTC = (ms: number) => new Date(ms).toISOString().slice(0, 7);

// ---------- Points ----------

export interface CombatGagne { niveau?: Niveau | null; tombe?: boolean; enLigne?: boolean; tournoiGagne?: boolean }

export function pointsCombat(x: CombatGagne): number {
  if (x.tournoiGagne) return R.points.tournoiGagne;
  const base = x.enLigne ? R.points.enLigne : R.points[x.niveau ?? 'normal'];
  return base + (x.tombe ? R.points.tombe : 0);
}

// Passe au nouveau jour ou au nouveau mois. Un mois terminé avec des points attend sa récompense.
export function majPeriode(c: Collection, maintenant = Date.now()) {
  const k = c.classement;
  const mois = moisUTC(maintenant), jour = jourUTC(maintenant);
  if (k.mois !== mois) {
    if (k.mois && k.points > 0 && !k.enAttente.some((e) => e.mois === k.mois)) k.enAttente.push({ mois: k.mois, points: k.points });
    k.mois = mois;
    k.points = 0;
    k.jour = jour;
    k.pointsJour = 0;
  } else if (k.jour !== jour) {
    k.jour = jour;
    k.pointsJour = 0;
  }
}

// Ajoute les points d'une victoire (dans la limite du plafond du jour). Renvoie les points ajoutés.
export function gagnerPoints(c: Collection, x: CombatGagne, maintenant = Date.now()): number {
  majPeriode(c, maintenant);
  const k = c.classement;
  const n = Math.max(0, Math.min(pointsCombat(x), R.plafondJour - k.pointsJour));
  k.points += n;
  k.pointsJour += n;
  if (n) programmerPublication(c);
  return n;
}

export type Palier = (typeof R.paliers)[number];
export const palierDe = (points: number): Palier | null => [...R.paliers].reverse().find((p) => points >= p.min) ?? null;
export const palierSuivant = (points: number): Palier | null => R.paliers.find((p) => points < p.min) ?? null;
export const nomPalier = (id: string | null) => R.paliers.find((p) => p.id === id)?.nom ?? '';

// Récompense d'un mois terminé : boosters du palier, plus le bonus du Top 10.
export function recompenseMois(c: Collection, points: number, top: boolean, hasard: () => number = Math.random): Booster[] {
  const p = palierDe(points);
  const boosters: Booster[] = [];
  for (let k = 0; k < (p?.classiques ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < (p?.rares ?? 0) + (top ? R.top.rares : 0); k++) boosters.push(ouvrirBooster(c, hasard, 'rare'));
  return joindreGains(boosters, { medailles: 0, dollars: 0 });
}

// Termine un mois en attente : badge et boosters (à mettre dans la boîte à récompenses).
export function cloturerMois(c: Collection, mois: string, top: boolean, hasard: () => number = Math.random): { titre: string; boosters: Booster[] } | null {
  const i = c.classement.enAttente.findIndex((e) => e.mois === mois);
  if (i < 0) return null;
  const { points } = c.classement.enAttente[i];
  c.classement.enAttente.splice(i, 1);
  const p = palierDe(points);
  if (!c.classement.badge || c.classement.badge.mois <= mois) c.classement.badge = { palier: p?.id ?? null, top, mois };
  const boosters = recompenseMois(c, points, top, hasard);
  if (!boosters.length) return null;
  const nom = nomMois(mois);
  return { titre: `Classement de ${nom} : ${top ? 'Top 10' : `palier ${p!.nom}`} (${points} points)`, boosters };
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const nomMois = (mois: string) => `${MOIS[Number(mois.slice(5, 7)) - 1] ?? ''} ${mois.slice(0, 4)}`.trim();
export const joursRestants = (maintenant = Date.now()) => {
  const d = new Date(maintenant);
  return Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - maintenant) / JOUR_MS);
};

// ---------- En ligne (Firestore) ----------

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
const entete = (s: Session) => ({ 'content-type': 'application/json', authorization: `Bearer ${s.jeton}` });

export interface Ligne { uid: string; idCoach: string; pseudo: string; pays: string; points: number; badge: string; moi: boolean }

// Badge affiché : « top » ou le palier du dernier mois terminé.
export const badgeDe = (c: Collection) => (c.classement.badge ? (c.classement.badge.top ? 'top' : c.classement.badge.palier ?? '') : '');

export async function publier(c: Collection): Promise<boolean> {
  if (!compteActuel() || !c.coach) return false;
  const s = await connexion();
  if (!s.compte) return false;
  majPeriode(c);
  const k = c.classement;
  const fields = {
    idCoach: { stringValue: c.idCoach }, pseudo: { stringValue: c.coach }, pays: { stringValue: c.pays },
    badge: { stringValue: badgeDe(c) },
    points: { integerValue: String(k.points) }, jour: { integerValue: String(k.jour) }, pointsJour: { integerValue: String(k.pointsJour) },
  };
  const corps = { writes: [{ update: { name: `${BASE.replace('https://firestore.googleapis.com/v1/', '')}/classements/${k.mois}/joueurs/${s.uid}`, fields }, updateTransforms: [{ fieldPath: 'maj', setToServerValue: 'REQUEST_TIME' }] }] };
  const r = await fetch(`${BASE}:commit`, { method: 'POST', headers: entete(s), body: JSON.stringify(corps) });
  return r.ok;
}

let minuteur: ReturnType<typeof setTimeout> | null = null;
export function programmerPublication(c: Collection, delai = 3000) {
  if (!compteActuel()) return;
  if (minuteur) clearTimeout(minuteur);
  minuteur = setTimeout(() => { minuteur = null; void publier(c).catch(() => false); }, delai);
}

type Doc = { name: string; fields?: Record<string, { stringValue?: string; integerValue?: string }> };
function ligneDe(d: Doc, monUid: string): Ligne {
  const f = d.fields ?? {};
  const uid = d.name.split('/').pop() ?? '';
  return {
    uid, idCoach: f.idCoach?.stringValue ?? '', pseudo: f.pseudo?.stringValue ?? 'Coach', pays: f.pays?.stringValue ?? '',
    points: Number(f.points?.integerValue ?? 0), badge: f.badge?.stringValue ?? '', moi: uid === monUid,
  };
}

async function requete(s: Session, mois: string, q: Record<string, unknown>): Promise<Doc[]> {
  const r = await fetch(`${BASE}/classements/${mois}:runQuery`, { method: 'POST', headers: entete(s), body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'joueurs' }], ...q } }) });
  if (!r.ok) throw new Error(`Classement illisible (${r.status})`);
  return ((await r.json()) as { document?: Doc }[]).flatMap((x) => (x.document ? [x.document] : []));
}

const filtre = (champ: string, op: string, valeur: Record<string, unknown>) => ({ fieldFilter: { field: { fieldPath: champ }, op, value: valeur } });
const parPoints = (a: Ligne, b: Ligne) => b.points - a.points || a.pseudo.localeCompare(b.pseudo);

export type Vue = 'monde' | 'amis' | 'pays';
export interface Resultat { lignes: Ligne[]; maPlace: number | null }

// Lit un classement du mois. `maPlace` : rang du joueur (même s'il n'est pas dans la liste, pour « monde »).
export async function lireClassement(c: Collection, vue: Vue, mois = moisUTC(Date.now())): Promise<Resultat> {
  const s = await connexion();
  const ordre = { orderBy: [{ field: { fieldPath: 'points' }, direction: 'DESCENDING' }] };
  let lignes: Ligne[];
  if (vue === 'monde') lignes = (await requete(s, mois, { ...ordre, limit: R.taille.monde })).map((d) => ligneDe(d, s.uid));
  else if (vue === 'pays') {
    if (!c.pays) return { lignes: [], maPlace: null };
    lignes = (await requete(s, mois, { where: filtre('pays', 'EQUAL', { stringValue: c.pays }), limit: R.taille.pays })).map((d) => ligneDe(d, s.uid));
  } else {
    const ids = [c.idCoach, ...Object.entries(c.amis).sort((a, b) => b[1].vu - a[1].vu).map(([id]) => id)].slice(0, R.taille.amis + 1);
    lignes = (await requete(s, mois, { where: filtre('idCoach', 'IN', { arrayValue: { values: ids.map((id) => ({ stringValue: id })) } }) })).map((d) => ligneDe(d, s.uid));
  }
  lignes.sort(parPoints);
  const i = lignes.findIndex((l) => l.moi);
  if (i >= 0 || vue !== 'monde') return { lignes, maPlace: i >= 0 ? i + 1 : null };
  // Pas dans les 50 premiers : on compte les joueurs devant.
  const pts = mois === c.classement.mois ? c.classement.points : 0;
  const r = await fetch(`${BASE}/classements/${mois}:runAggregationQuery`, {
    method: 'POST', headers: entete(s),
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'joueurs' }], where: filtre('points', 'GREATER_THAN', { integerValue: String(pts) }) }, aggregations: [{ alias: 'n', count: {} }] } }),
  });
  if (!r.ok || !pts) return { lignes, maPlace: null };
  const n = Number(((await r.json()) as { result?: { aggregateFields?: { n?: { integerValue?: string } } } }[])[0]?.result?.aggregateFields?.n?.integerValue ?? NaN);
  return { lignes, maPlace: Number.isFinite(n) ? n + 1 : null };
}

// Le joueur est-il dans le Top 10 d'un mois terminé ? null : impossible de vérifier (hors ligne).
export async function dansLeTop(mois: string): Promise<boolean | null> {
  try {
    const s = await connexion();
    const docs = await requete(s, mois, { orderBy: [{ field: { fieldPath: 'points' }, direction: 'DESCENDING' }], limit: R.top.places });
    return docs.some((d) => d.name.endsWith(`/${s.uid}`));
  } catch {
    return null;
  }
}

// ---------- Pays ----------
// Pays de la lutte d'abord, puis les autres pays courants. Code à 2 lettres → drapeau.
export const PAYS: [string, string][] = [
  ['FR', 'France'], ['BE', 'Belgique'], ['CH', 'Suisse'], ['CA', 'Canada'], ['MA', 'Maroc'], ['DZ', 'Algérie'], ['TN', 'Tunisie'], ['SN', 'Sénégal'],
  ['CI', 'Côte d\'Ivoire'], ['CM', 'Cameroun'], ['US', 'États-Unis'], ['RU', 'Russie'], ['JP', 'Japon'], ['IR', 'Iran'], ['TR', 'Turquie'],
  ['GE', 'Géorgie'], ['AZ', 'Azerbaïdjan'], ['KZ', 'Kazakhstan'], ['UZ', 'Ouzbékistan'], ['MN', 'Mongolie'], ['UA', 'Ukraine'], ['AM', 'Arménie'],
  ['BG', 'Bulgarie'], ['RO', 'Roumanie'], ['HU', 'Hongrie'], ['PL', 'Pologne'], ['DE', 'Allemagne'], ['IT', 'Italie'], ['ES', 'Espagne'],
  ['PT', 'Portugal'], ['GB', 'Royaume-Uni'], ['SE', 'Suède'], ['NO', 'Norvège'], ['FI', 'Finlande'], ['GR', 'Grèce'], ['RS', 'Serbie'],
  ['CU', 'Cuba'], ['MX', 'Mexique'], ['BR', 'Brésil'], ['IN', 'Inde'], ['CN', 'Chine'], ['KR', 'Corée du Sud'], ['KP', 'Corée du Nord'],
  ['EG', 'Égypte'], ['NG', 'Nigeria'], ['AU', 'Australie'],
];
export const drapeau = (code: string) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((l) => 0x1f1e6 + l.charCodeAt(0) - 65)) : '');
export const nomPays = (code: string) => PAYS.find(([c]) => c === code)?.[1] ?? '';
