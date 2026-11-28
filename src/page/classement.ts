// Classements (28/11/2026, 2e version), sans affichage. Trois classements :
// - Division en ligne (saison classée = le mois) : seuls les combats en ligne la font bouger (victoire
//   +25, défaite −15, jamais sous le début de sa division ; barres de plus en plus longues). Le 1er du
//   mois, tout le monde repart en Bronze. Fin de saison (si au moins un combat en ligne dans le mois) :
//   récompense de la division, cadre de saison, et un booster rare pour le Top 10. Le badge s'affiche
//   à côté du pseudo la saison suivante. Publication : classements/<mois>/joueurs/<identifiant>.
// - Ordinateur fort (à vie) : victoires contre l'ordinateur fort, à la main (pas en mode auto).
// - Saison sportive (à vie) : saisons terminées, puis palier en cours.
//   Publication des deux : palmares/<identifiant>.
// Chaque classement se regarde pour tous les joueurs, mes amis ou mon pays ; il faut un compte pour y
// apparaître. Les combats sont calculés sur le téléphone : les règles de Firebase limitent seulement
// la vitesse de progression (un combat en ligne toutes les 2 minutes, etc.), pas un tricheur décidé.

import { CARTES_SPECIALES, LUTTEURS, REGLES } from '../moteur';
import { joindreGains, nbExemplaires, ouvrirBooster, type Booster, type Collection } from './collection';
import { compteActuel } from './compte';
import { FIREBASE, connexion, type Session } from './firebase';

const R = REGLES.classement;
const JOUR_MS = 86_400_000;
export const jourUTC = (ms: number) => Math.floor(ms / JOUR_MS);
export const moisUTC = (ms: number) => new Date(ms).toISOString().slice(0, 7);

// Passe au nouveau mois : un mois où l'on a joué en ligne attend sa récompense ; tout le monde repart
// en Bronze.
export function majPeriode(c: Collection, maintenant = Date.now()) {
  const k = c.classement;
  const mois = moisUTC(maintenant);
  if (k.mois === mois) return;
  if (k.mois && k.enLigne > 0 && !k.enAttente.some((e) => e.mois === k.mois)) k.enAttente.push({ mois: k.mois, points: k.points, division: k.division });
  k.mois = mois;
  k.points = 0;
  k.enLigne = 0;
  k.division = 0;
  k.progression = 0;
}

// ---------- Division en ligne ----------

export const DIVISIONS = R.divisions;
export type Division = (typeof DIVISIONS)[number];
export const nomDivision = (id: string | null) => DIVISIONS.find((d) => d.id === id)?.nom ?? '';
export const estMaitre = (c: Collection) => c.classement.division >= DIVISIONS.length - 1;
// Longueur de la barre d'une division (Maître : pas de barre, les points continuent pour classer).
export const barreDe = (division: number): number | null => R.barres[division] ?? null;
// Score du mois : barres des divisions passées + barre en cours (sert à classer les joueurs).
export const scoreEnLigne = (division: number, progression: number) => R.barres.slice(0, division).reduce((n, b) => n + b, 0) + progression;

// Remplit la barre ; passe à la division suivante quand elle est pleine.
export function progresser(c: Collection, gain: number): { monte: boolean } {
  const k = c.classement;
  const debut = k.division;
  k.progression += gain;
  for (let b = barreDe(k.division); b !== null && k.progression >= b; b = barreDe(k.division)) { k.progression -= b; k.division++; }
  k.points = scoreEnLigne(k.division, k.progression);
  return { monte: k.division > debut };
}

// Combat en ligne terminé : victoire +25, défaite −15 (jamais sous le début de la division).
// Renvoie le changement de la barre et la nouvelle division si elle monte.
export function combatEnLigne(c: Collection, gagne: boolean, maintenant = Date.now()): { gain: number; monte: string | null } {
  majPeriode(c, maintenant);
  const k = c.classement;
  if (maintenant - k.derniereEnLigne < R.secondesParCombatEnLigne * 1000) return { gain: 0, monte: null }; // anti-triche
  k.enLigne++;
  k.derniereEnLigne = maintenant;
  if (gagne) {
    const { monte } = progresser(c, R.victoireEnLigne);
    programmerPublication(c);
    return { gain: R.victoireEnLigne, monte: monte ? DIVISIONS[k.division].nom : null };
  }
  const avant = k.progression;
  k.progression = Math.max(0, k.progression - R.defaiteEnLigne);
  k.points = scoreEnLigne(k.division, k.progression);
  programmerPublication(c);
  return { gain: k.progression - avant, monte: null };
}

// ---------- Palmarès à vie ----------

// Victoire contre l'ordinateur fort, à la main : +1 au classement « Ordinateur fort ».
export function victoireFort(c: Collection, maintenant = Date.now()) {
  if (maintenant - c.palmares.derniereFort < R.secondesParVictoireFort * 1000) return; // anti-triche
  c.palmares.fort++;
  c.palmares.derniereFort = maintenant;
  programmerPublication(c);
}
// Saison sportive : saisons terminées × 10 + palier en cours (6 paliers par saison au plus).
export const scoreSaison = (c: Collection) => c.saison.terminees * 10 + Math.min(9, c.saison.palier);
export const texteSaison = (score: number) => {
  const t = Math.floor(score / 10), p = score % 10;
  return t ? `${t} saison${t > 1 ? 's' : ''} · palier ${p + 1}` : `palier ${p + 1}`;
};

// Saison n° : la saison 1 est le mois de REGLES.classement.premiereSaison.
export const numeroSaison = (mois: string) => {
  const [a, m] = mois.split('-').map(Number), [a0, m0] = R.premiereSaison.split('-').map(Number);
  return Math.max(1, (a - a0) * 12 + (m - m0) + 1);
};
// Cadre de saison : « 2026-11:or » → « Saison 1 · Or ».
export const texteCadre = (cadre: string) => {
  const [mois, div] = cadre.split(':');
  if (mois === 'createur') return `Créateur · ${CARTES_SPECIALES.find((l) => l.id === `createur-${div.toLowerCase()}`)?.nom ?? div}`;
  return `Saison ${numeroSaison(mois)} · ${nomDivision(div)}`;
};

// Récompense d'une saison terminée : boosters et carte de la division, plus le bonus du Top 10.
export function recompenseMois(c: Collection, division: number, top: boolean, hasard: () => number = Math.random): Booster[] {
  const d = DIVISIONS[division];
  const boosters: Booster[] = [];
  if (!d) return boosters;
  for (let k = 0; k < d.classiques; k++) boosters.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < d.rares + (top ? R.top.rares : 0); k++) boosters.push(ouvrirBooster(c, hasard, 'rare'));
  if (d.carte) {
    const liste = LUTTEURS.filter((l) => l.rarete === d.carte);
    const l = liste[Math.floor(hasard() * liste.length)];
    const nouvelle = nbExemplaires(c, l.id) === 0;
    c.exemplaires[l.id] = nbExemplaires(c, l.id) + 1;
    boosters.push({ type: 'recompense', cartes: [l.id], nouvelles: nouvelle ? [l.id] : [] });
  }
  return joindreGains(boosters, { medailles: 0, dollars: 0 });
}

// Termine une saison en attente : badge, cadre de saison et récompenses (à mettre dans la boîte).
export function cloturerMois(c: Collection, mois: string, top: boolean, hasard: () => number = Math.random): { titre: string; boosters: Booster[]; cadre: string } | null {
  const i = c.classement.enAttente.findIndex((e) => e.mois === mois);
  if (i < 0) return null;
  const e = c.classement.enAttente[i];
  c.classement.enAttente.splice(i, 1);
  // Mois d'avant les divisions : la division vient des anciens paliers de points.
  const division = e.division >= 0 ? e.division : e.points >= 300 ? 2 : e.points >= 120 ? 1 : 0;
  const d = DIVISIONS[division];
  if (!c.classement.badge || c.classement.badge.mois <= mois) c.classement.badge = { palier: d.id, top, mois };
  const cadre = `${mois}:${d.id}`;
  if (!c.classement.cadres.includes(cadre)) c.classement.cadres.push(cadre);
  const boosters = recompenseMois(c, division, top, hasard);
  return { titre: `Saison ${numeroSaison(mois)} (${nomMois(mois)}) : division ${d.nom}${top ? ' et Top 10' : ''}`, boosters, cadre };
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

export type TypeClassement = 'enLigne' | 'fort' | 'saison';
export interface Ligne { uid: string; idCoach: string; pseudo: string; pays: string; points: number; badge: string; moi: boolean }

// Badge affiché : « top » ou la division de la dernière saison terminée.
export const badgeDe = (c: Collection) => (c.classement.badge ? (c.classement.badge.top ? 'top' : c.classement.badge.palier ?? '') : '');

const CHEMIN = BASE.replace('https://firestore.googleapis.com/v1/', '');
const ident = (c: Collection) => ({ idCoach: { stringValue: c.idCoach }, pseudo: { stringValue: c.coach ?? '' }, pays: { stringValue: c.pays }, badge: { stringValue: badgeDe(c) } });

// Publie la ligne du mois (seulement si on a joué en ligne) et le palmarès à vie.
export async function publier(c: Collection): Promise<boolean> {
  if (!compteActuel() || !c.coach) return false;
  const s = await connexion();
  if (!s.compte) return false;
  majPeriode(c);
  const k = c.classement;
  const ecrire = (nom: string, fields: Record<string, unknown>) => ({ update: { name: `${CHEMIN}/${nom}`, fields }, updateTransforms: [{ fieldPath: 'maj', setToServerValue: 'REQUEST_TIME' }] });
  // Deux envois séparés : si l'un est refusé (anti-triche), l'autre passe quand même.
  const envoyer = (w: ReturnType<typeof ecrire>) => fetch(`${BASE}:commit`, { method: 'POST', headers: entete(s), body: JSON.stringify({ writes: [w] }) }).then((r) => r.ok);
  const ok = await envoyer(ecrire(`palmares/${s.uid}`, { ...ident(c), fort: { integerValue: String(c.palmares.fort) }, saison: { integerValue: String(scoreSaison(c)) } }));
  if (k.enLigne === 0) return ok;
  return (await envoyer(ecrire(`classements/${k.mois}/joueurs/${s.uid}`, { ...ident(c), points: { integerValue: String(k.points) }, enLigne: { integerValue: String(k.enLigne) } }))) && ok;
}

let minuteur: ReturnType<typeof setTimeout> | null = null;
export function programmerPublication(c: Collection, delai = 3000) {
  if (!compteActuel()) return;
  if (minuteur) clearTimeout(minuteur);
  minuteur = setTimeout(() => { minuteur = null; void publier(c).catch(() => false); }, delai);
}

type Doc = { name: string; fields?: Record<string, { stringValue?: string; integerValue?: string }> };
function ligneDe(d: Doc, monUid: string, champ: string): Ligne {
  const f = d.fields ?? {};
  const uid = d.name.split('/').pop() ?? '';
  return {
    uid, idCoach: f.idCoach?.stringValue ?? '', pseudo: f.pseudo?.stringValue ?? 'Coach', pays: f.pays?.stringValue ?? '',
    points: Number(f[champ]?.integerValue ?? 0), badge: f.badge?.stringValue ?? '', moi: uid === monUid,
  };
}

// Où lire chaque classement : document parent, collection et champ qui classe.
function source(type: TypeClassement, mois: string) {
  return type === 'enLigne' ? { parent: `/classements/${mois}`, collection: 'joueurs', champ: 'points' } : { parent: '', collection: 'palmares', champ: type };
}

async function requete(s: Session, parent: string, collection: string, q: Record<string, unknown>): Promise<Doc[]> {
  const r = await fetch(`${BASE}${parent}:runQuery`, { method: 'POST', headers: entete(s), body: JSON.stringify({ structuredQuery: { from: [{ collectionId: collection }], ...q } }) });
  if (!r.ok) throw new Error(`Classement illisible (${r.status})`);
  return ((await r.json()) as { document?: Doc }[]).flatMap((x) => (x.document ? [x.document] : []));
}

const filtre = (champ: string, op: string, valeur: Record<string, unknown>) => ({ fieldFilter: { field: { fieldPath: champ }, op, value: valeur } });
const parPoints = (a: Ligne, b: Ligne) => b.points - a.points || a.pseudo.localeCompare(b.pseudo);

export type Vue = 'monde' | 'amis' | 'pays';
export interface Resultat { lignes: Ligne[]; maPlace: number | null }

// Ma valeur dans un classement (pour « ta place »).
export const maValeur = (c: Collection, type: TypeClassement) => (type === 'enLigne' ? c.classement.points : type === 'fort' ? c.palmares.fort : scoreSaison(c));

// Lit un classement. `maPlace` : rang du joueur (même s'il n'est pas dans la liste, pour « monde »).
export async function lireClassement(c: Collection, vue: Vue, type: TypeClassement = 'enLigne', mois = moisUTC(Date.now())): Promise<Resultat> {
  const s = await connexion();
  const { parent, collection, champ } = source(type, mois);
  const ordre = { orderBy: [{ field: { fieldPath: champ }, direction: 'DESCENDING' }] };
  const lire = async (q: Record<string, unknown>) => (await requete(s, parent, collection, q)).map((d) => ligneDe(d, s.uid, champ));
  let lignes: Ligne[];
  if (vue === 'monde') lignes = await lire({ ...ordre, limit: R.taille.monde });
  else if (vue === 'pays') {
    if (!c.pays) return { lignes: [], maPlace: null };
    lignes = await lire({ where: filtre('pays', 'EQUAL', { stringValue: c.pays }), limit: R.taille.pays });
  } else {
    const ids = [c.idCoach, ...Object.entries(c.amis).sort((a, b) => b[1].vu - a[1].vu).map(([id]) => id)].slice(0, R.taille.amis + 1);
    lignes = await lire({ where: filtre('idCoach', 'IN', { arrayValue: { values: ids.map((id) => ({ stringValue: id })) } }) });
  }
  lignes = lignes.filter((l) => l.points > 0 || l.moi);
  lignes.sort(parPoints);
  const i = lignes.findIndex((l) => l.moi);
  if (i >= 0 || vue !== 'monde') return { lignes, maPlace: i >= 0 ? i + 1 : null };
  // Pas dans les 50 premiers : on compte les joueurs devant.
  const mien = type !== 'enLigne' || mois === c.classement.mois ? maValeur(c, type) : 0;
  if (!mien) return { lignes, maPlace: null };
  const r = await fetch(`${BASE}${parent}:runAggregationQuery`, {
    method: 'POST', headers: entete(s),
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: collection }], where: filtre(champ, 'GREATER_THAN', { integerValue: String(mien) }) }, aggregations: [{ alias: 'n', count: {} }] } }),
  });
  if (!r.ok) return { lignes, maPlace: null };
  const n = Number(((await r.json()) as { result?: { aggregateFields?: { n?: { integerValue?: string } } } }[])[0]?.result?.aggregateFields?.n?.integerValue ?? NaN);
  return { lignes, maPlace: Number.isFinite(n) ? n + 1 : null };
}

// Le joueur est-il dans le Top 10 (division en ligne) d'un mois terminé ? null : impossible de vérifier (hors ligne).
export async function dansLeTop(mois: string): Promise<boolean | null> {
  try {
    const s = await connexion();
    const docs = await requete(s, `/classements/${mois}`, 'joueurs', { orderBy: [{ field: { fieldPath: 'points' }, direction: 'DESCENDING' }], limit: R.top.places });
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
