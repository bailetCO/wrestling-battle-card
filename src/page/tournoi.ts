// Tournois contre l'ordinateur, sans affichage : tournoi individuel à double tableau, tournoi par
// équipe, ancienne compétition à 6, inscriptions et gains.
// La page joue les combats du joueur ; ceux entre deux ordinateurs sont simulés ici.

import {
  LUTTEURS, NATIONS, REGLES, choixOrdinateur, creerCombat, creerHasard, jouerTour,
  type DefLutteur, type Hasard, type Niveau,
} from '../moteur';
import { gagnerMedailles, joindreGains, ouvrirBooster, type Booster, type Collection } from './collection';

const T = REGLES.tournoi;

// ---------- Combat simulé entre deux ordinateurs ----------

export interface ResultatSimule { vainqueur: 0 | 1; detail: string }

export function simulerCombat(a: DefLutteur, b: DefLutteur, graine: number, niveau: Niveau): ResultatSimule {
  const h = creerHasard(graine);
  let e = creerCombat(a, b);
  while (!e.termine) e = jouerTour(e, choixOrdinateur(e, 0, h, niveau), choixOrdinateur(e, 1, h, niveau), h);
  const v = e.vainqueur === 0 ? 0 : 1;
  const [pv, pp] = [e.joueurs[v].periodesGagnees, e.joueurs[1 - v].periodesGagnees];
  return { vainqueur: v, detail: e.finPar === 'tombe' ? 'par tombé' : `${pv} périodes à ${pp}` };
}

// Tire `n` lutteurs différents, sans ceux de `exclus`.
function tirer(n: number, exclus: string[], hasard: Hasard): string[] {
  const pool = LUTTEURS.map((l) => l.id).filter((id) => !exclus.includes(id));
  const out: string[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(hasard() * pool.length), 1)[0]);
  return out;
}

// ---------- Compétition à 6 ----------

// Clés des combats, dans l'ordre où ils se jouent.
// QA, QB : 1/4 de finale ; SA, SB : 1/2 finales ; R1, R2 : repêchages croisés ;
// F : finale (1re et 2e places) ; R3 : finale du repêchage (3e et 4e places).
export type CleMatch = 'QA' | 'QB' | 'SA' | 'SB' | 'R1' | 'R2' | 'F' | 'R3';
export const ORDRE_MATCHS: CleMatch[] = ['QA', 'QB', 'SA', 'SB', 'R1', 'R2', 'F', 'R3'];
export const NOM_MATCH: Record<CleMatch, string> = {
  QA: '1/4 de finale', QB: '1/4 de finale', SA: '1/2 finale', SB: '1/2 finale',
  R1: 'Repêchage', R2: 'Repêchage', F: 'Finale', R3: 'Finale du repêchage (3e place)',
};

export interface Match { a: number | null; b: number | null; vainqueur: number | null; detail: string }

export interface Competition {
  type: 'competition';
  lutteurs: string[]; // 6 lutteurs ; l'indice 0 est celui du joueur
  tableaux: [number[], number[]]; // [exempté, puis les deux du 1/4] dans chaque tableau
  matchs: Record<CleMatch, Match>;
  graine: number;
  gainsCombats: { medailles: number; dollars: number }; // médailles des combats gagnés (et $ des paliers)
  recompense: Booster[] | null; // donnée une seule fois, à la fin
}

const vide = (): Match => ({ a: null, b: null, vainqueur: null, detail: '' });
const perdant = (m: Match) => (m.vainqueur === null ? null : m.vainqueur === m.a ? m.b : m.a);

export function creerCompetition(idJoueur: string, graine: number): Competition {
  const h = creerHasard(graine);
  const lutteurs = [idJoueur, ...tirer(5, [idJoueur], h)];
  const ordre = [0, 1, 2, 3, 4, 5];
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(h() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  const c: Competition = {
    type: 'competition', lutteurs, tableaux: [ordre.slice(0, 3), ordre.slice(3, 6)], graine,
    matchs: { QA: vide(), QB: vide(), SA: vide(), SB: vide(), R1: vide(), R2: vide(), F: vide(), R3: vide() },
    gainsCombats: { medailles: 0, dollars: 0 }, recompense: null,
  };
  majTableau(c);
  return c;
}

// Place les lutteurs dans les combats dont les deux adversaires sont connus.
export function majTableau(c: Competition) {
  const M = c.matchs;
  const [A, B] = c.tableaux;
  const poser = (m: Match, a: number | null, b: number | null) => {
    if (m.vainqueur === null) { m.a = a; m.b = b; }
  };
  poser(M.QA, A[1], A[2]);
  poser(M.QB, B[1], B[2]);
  poser(M.SA, A[0], M.QA.vainqueur);
  poser(M.SB, B[0], M.QB.vainqueur);
  // Repêchage croisé : le perdant du 1/4 d'un tableau affronte le perdant de la 1/2 de l'autre.
  poser(M.R1, perdant(M.QA), perdant(M.SB));
  poser(M.R2, perdant(M.SA), perdant(M.QB));
  poser(M.F, M.SA.vainqueur, M.SB.vainqueur);
  poser(M.R3, M.R1.vainqueur, M.R2.vainqueur);
}

export const pret = (m: Match) => m.a !== null && m.b !== null && m.vainqueur === null;
export const avecJoueur = (m: Match) => m.a === 0 || m.b === 0;

// Le prochain combat à jouer (dans l'ordre), ou null si la compétition est finie.
export function prochainMatch(c: Competition): CleMatch | null {
  return ORDRE_MATCHS.find((k) => pret(c.matchs[k])) ?? null;
}

export function enregistrer(c: Competition, cle: CleMatch, vainqueur: number, detail: string) {
  const m = c.matchs[cle];
  if (!pret(m) || (vainqueur !== m.a && vainqueur !== m.b)) throw new Error(`Résultat impossible pour ${cle}`);
  m.vainqueur = vainqueur;
  m.detail = detail;
  majTableau(c);
}

// Simule tous les combats sans le joueur jusqu'au prochain combat du joueur (ou jusqu'à la fin).
export function avancer(c: Competition, defs: (i: number) => DefLutteur, niveau: Niveau): CleMatch | null {
  for (let k = prochainMatch(c); k; k = prochainMatch(c)) {
    const m = c.matchs[k];
    if (avecJoueur(m)) return k;
    const r = simulerCombat(defs(m.a!), defs(m.b!), c.graine * 31 + ORDRE_MATCHS.indexOf(k) + 1, niveau);
    enregistrer(c, k, r.vainqueur === 0 ? m.a! : m.b!, r.detail);
  }
  return null;
}

export const finie = (c: Competition) => prochainMatch(c) === null;

// Classement final : indice du lutteur → place (1, 2, 3, 4, 5 ; deux 5es).
export function places(c: Competition): Map<number, number> {
  const M = c.matchs;
  const p = new Map<number, number>();
  if (!finie(c)) return p;
  p.set(M.F.vainqueur!, 1);
  p.set(perdant(M.F)!, 2);
  p.set(M.R3.vainqueur!, 3);
  p.set(perdant(M.R3)!, 4);
  p.set(perdant(M.R1)!, 5);
  p.set(perdant(M.R2)!, 5);
  return p;
}

// ---------- Tournoi individuel à double tableau ----------

// D'où vient chaque côté d'un combat : un lutteur placé au tirage ({ j }), le vainqueur ({ v }) ou
// le perdant ({ p }) d'un combat précédent (son numéro), ou personne (null : exemption).
export type Source = { j: number } | { v: number } | { p: number } | null;
export type PartieTableau = 'principal' | 'perdants' | 'finales';

// Dans a, b et vainqueur : null = pas encore connu, PERSONNE = place vide (exemption).
export const PERSONNE = -1;

export interface MatchI {
  nom: string;
  tableau: PartieTableau;
  tour: number; // numéro du tour dans sa partie du tableau
  sa: Source;
  sb: Source;
  a: number | null;
  b: number | null;
  vainqueur: number | null;
  detail: string;
}

export interface Individuel {
  type: 'individuel';
  lutteurs: string[]; // l'indice 0 est le lutteur du joueur
  matchs: MatchI[]; // dans l'ordre où ils se jouent
  graine: number;
  gainsCombats: { medailles: number; dollars: number };
  recompense: Booster[] | null;
  nom?: string; // nom de la compétition (saison : « Championnat régional »…)
  niveaux?: NiveauxTournoi; // niveau de l'ordinateur imposé (sinon celui choisi par le joueur)
  saison?: number; // palier de la saison sportive auquel ce tournoi compte
}

// Niveau de l'ordinateur d'un tournoi : un niveau fixe, ou « mixte » (normal ou fort selon le combat).
export type NiveauxTournoi = Niveau | 'mixte';

const I = T.individuel;

// Niveau de l'ordinateur pour le combat `k` d'un tournoi (tiré de la graine pour « mixte »).
export function niveauMatchI(t: Individuel, k: number, defaut: Niveau): Niveau {
  if (!t.niveaux) return defaut;
  if (t.niveaux !== 'mixte') return t.niveaux;
  return creerHasard((t.graine * 13 + k * 7 + 5) >>> 0)() < 0.5 ? 'normal' : 'fort';
}

function melanger<X>(t: X[], h: Hasard): X[] {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(h() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

const NOM_TOUR: Record<number, string> = { 64: '1/32 de finale', 32: '1/16 de finale', 16: '1/8 de finale', 8: '1/4 de finale', 4: '1/2 finale' };

// Nombre de participants accepté : au moins 6 (on complète), au plus 15.
export const nombreParticipants = (n: number, min: number = I.minimum, max: number = I.maximum) =>
  Math.max(min, Math.min(max, Math.round(n) || I.parDefaut));

// Taille du tableau principal : la plus petite puissance de 2 (8 au moins) qui contient tout le monde.
export const tailleTableau = (n: number) => Math.max(8, 2 ** Math.ceil(Math.log2(n)));

export interface OptionsIndividuel { minimum?: number; maximum?: number; nom?: string; niveaux?: NiveauxTournoi; saison?: number }

export function creerIndividuel(idJoueur: string, nombre: number, graine: number, o: OptionsIndividuel = {}): Individuel {
  const h = creerHasard(graine);
  const n = nombreParticipants(nombre, o.minimum, o.maximum);
  const lutteurs = [idJoueur, ...tirer(n - 1, [idJoueur], h)];
  const S = tailleTableau(n); // taille du tableau principal
  const paires = S / 2;
  // Tirage : chaque paire du premier tour reçoit un lutteur ; n − paires paires (au hasard) en
  // reçoivent un second. Les autres lutteurs sont exemptés du premier tour.
  const ordre = melanger([...Array(n).keys()], h);
  const doubles = new Set(melanger([...Array(paires).keys()], h).slice(0, n - paires));
  const places: Source[] = [];
  let k = 0;
  for (let i = 0; i < paires; i++) {
    places.push({ j: ordre[k++] });
    places.push(doubles.has(i) ? { j: ordre[k++] } : null);
  }

  const matchs: MatchI[] = [];
  const ajouter = (nom: string, tableau: PartieTableau, tour: number, sa: Source, sb: Source) => {
    matchs.push({ nom, tableau, tour, sa, sb, a: null, b: null, vainqueur: null, detail: '' });
    return matchs.length - 1;
  };

  // Tableau principal, jusqu'aux 1/2 finales comprises.
  const tours: number[][] = [];
  let cotes = places;
  for (let taille = S, t = 1; taille > 2; taille /= 2, t++) {
    const ids: number[] = [];
    for (let i = 0; i < cotes.length; i += 2) ids.push(ajouter(NOM_TOUR[taille], 'principal', t, cotes[i], cotes[i + 1]));
    tours.push(ids);
    cotes = ids.map((m) => ({ v: m }));
  }

  // Tableau des perdants, en deux côtés (A : haut du tableau principal, B : bas) : les perdants
  // d'avant les 1/2 finales. Dans chaque côté, les perdants d'un même tour s'affrontent ; les
  // vainqueurs retrouvent ensuite les perdants du tour suivant (en ordre inverse, pour éviter de
  // revoir le même adversaire), et ainsi de suite jusqu'à un vainqueur par côté.
  const avantDemies = tours.slice(0, -1);
  const vainqueurDuCote = (cote: 0 | 1): Source => {
    const lettre = cote === 0 ? 'A' : 'B';
    let tourP = 0;
    const tourPerdants = (c: Source[]): Source[] => {
      tourP++;
      const out: Source[] = [];
      for (let i = 0; i < c.length; i += 2) out.push({ v: ajouter(`Tableau des perdants ${lettre}, tour ${tourP}`, 'perdants', tourP, c[i], c[i + 1]) });
      return out;
    };
    let courant: Source[] = [];
    for (const ids of avantDemies) {
      const moitie = cote === 0 ? ids.slice(0, ids.length / 2) : ids.slice(ids.length / 2);
      const pertes: Source[] = moitie.map((m) => ({ p: m }));
      if (!courant.length) { courant = pertes; continue; }
      while (courant.length > pertes.length) courant = tourPerdants(courant);
      courant = tourPerdants(courant.flatMap((c, i) => [c, pertes[pertes.length - 1 - i]]));
    }
    while (courant.length > 1) courant = tourPerdants(courant);
    if (tourP) matchs[matchs.length - 1].nom = `Finale du tableau des perdants ${lettre}`;
    return courant[0] ?? null;
  };
  const gagnantA = vainqueurDuCote(0);
  const gagnantB = vainqueurDuCote(1);

  // Finales. Chaque perdant de 1/2 finale affronte le vainqueur du tableau des perdants du côté
  // opposé ; les deux gagnants se disputent la 3e place (petite finale).
  const [d1, d2] = tours[tours.length - 1];
  const q1 = ajouter('Qualification pour la 3e place', 'finales', 1, { p: d1 }, gagnantB);
  const q2 = ajouter('Qualification pour la 3e place', 'finales', 1, { p: d2 }, gagnantA);
  ajouter('Petite finale (3e place)', 'finales', 2, { v: q1 }, { v: q2 });
  ajouter('Finale', 'finales', 3, { v: d1 }, { v: d2 });

  const t: Individuel = { type: 'individuel', lutteurs, matchs, graine, gainsCombats: { medailles: 0, dollars: 0 }, recompense: null };
  if (o.nom) t.nom = o.nom;
  if (o.niveaux) t.niveaux = o.niveaux;
  if (o.saison !== undefined) t.saison = o.saison;
  majIndividuel(t);
  return t;
}

const perdantI = (m: MatchI) => (m.vainqueur === null ? null : m.vainqueur === PERSONNE ? PERSONNE : m.vainqueur === m.a ? m.b : m.a);
// Combat sans adversaire (exemption) : réglé tout seul, sans combat.
export const exemption = (m: MatchI) => m.a === PERSONNE || m.b === PERSONNE;

// Place les lutteurs connus et règle les exemptions. Les sources pointent toujours vers des
// combats précédents : un seul passage dans l'ordre suffit.
export function majIndividuel(t: Individuel) {
  const val = (s: Source): number | null =>
    s === null ? PERSONNE : 'j' in s ? s.j : 'v' in s ? t.matchs[s.v].vainqueur : perdantI(t.matchs[s.p]);
  for (const m of t.matchs) {
    if (m.vainqueur !== null) continue;
    m.a = val(m.sa);
    m.b = val(m.sb);
    if (m.a !== null && m.b !== null && exemption(m)) m.vainqueur = m.a === PERSONNE ? m.b : m.a;
  }
}

export const pretI = (m: MatchI) => m.a !== null && m.b !== null && m.a >= 0 && m.b >= 0 && m.vainqueur === null;
export const avecJoueurI = (m: MatchI) => m.a === 0 || m.b === 0;

export function prochainMatchI(t: Individuel): number | null {
  const i = t.matchs.findIndex(pretI);
  return i < 0 ? null : i;
}

export function enregistrerI(t: Individuel, i: number, vainqueur: number, detail: string) {
  const m = t.matchs[i];
  if (!m || !pretI(m) || (vainqueur !== m.a && vainqueur !== m.b)) throw new Error(`Résultat impossible pour le combat ${i}`);
  m.vainqueur = vainqueur;
  m.detail = detail;
  majIndividuel(t);
}

// Simule les combats sans le joueur jusqu'à son prochain combat (ou jusqu'à la fin).
export function avancerI(t: Individuel, defs: (i: number) => DefLutteur, niveau: Niveau): number | null {
  for (let k = prochainMatchI(t); k !== null; k = prochainMatchI(t)) {
    const m = t.matchs[k];
    if (avecJoueurI(m)) return k;
    const r = simulerCombat(defs(m.a!), defs(m.b!), t.graine * 31 + k + 1, niveauMatchI(t, k, niveau));
    enregistrerI(t, k, r.vainqueur === 0 ? m.a! : m.b!, r.detail);
  }
  return null;
}

export const finieI = (t: Individuel) => prochainMatchI(t) === null;

// Lutteurs exemptés du premier tour.
export const exemptes = (t: Individuel) =>
  t.matchs.filter((m) => m.tableau === 'principal' && m.tour === 1 && (m.sa === null || m.sb === null))
    .map((m) => (m.a === PERSONNE ? m.b : m.a)).filter((i): i is number => i !== null && i >= 0);

// Le joueur a-t-il perdu au moins un combat ? (utile pour « gagner sans passer par les perdants »)
export const joueurInvaincu = (t: Individuel) =>
  t.matchs.every((m) => !avecJoueurI(m) || m.vainqueur === null || m.vainqueur === 0 || exemption(m));

// Classement final : 1 (finale), 2, 3 (petite finale), 4, 5 ex aequo (perdants des deux
// qualifications pour la 3e place), puis les éliminés du tableau des perdants, du dernier tour au
// premier (ex aequo par tour, les deux côtés ensemble).
export function placesI(t: Individuel): Map<number, number> {
  const p = new Map<number, number>();
  if (!finieI(t)) return p;
  const M = t.matchs;
  const n = M.length;
  const [f, pf] = [M[n - 1], M[n - 2]];
  p.set(f.vainqueur!, 1);
  p.set(perdantI(f)!, 2);
  p.set(pf.vainqueur!, 3);
  p.set(perdantI(pf)!, 4);
  for (const q of [M[n - 4], M[n - 3]]) if (perdantI(q)! >= 0) p.set(perdantI(q)!, 5);
  let place = p.size + 1;
  const toursP = [...new Set(M.filter((m) => m.tableau === 'perdants').map((m) => m.tour))].sort((x, y) => y - x);
  for (const tr of toursP) {
    const elimines = M.filter((m) => m.tableau === 'perdants' && m.tour === tr && !exemption(m)).map((m) => perdantI(m)!)
      .filter((i) => i >= 0 && !p.has(i));
    for (const i of elimines) p.set(i, place);
    place += elimines.length;
  }
  return p;
}

// ---------- Tournoi par équipe ----------

export interface TournoiEquipe {
  type: 'equipe';
  mes: string[]; // mes 5 lutteurs, dans l'ordre des duels
  leurs: string[]; // les 5 lutteurs du club adverse
  nomAdverse: string;
  resultats: (boolean | null)[]; // true : duel gagné par moi
  details: string[];
  graine: number;
  gainsCombats: { medailles: number; dollars: number };
  recompense: Booster[] | null;
}

const CLUBS = ['Club de Tbilissi', 'Club d\'Oulan-Bator', 'Club de Dakar', 'Club d\'Osaka', 'Club du Dagestan', 'Club de l\'Iowa', 'Club de Bakou', 'Club de Téhéran'];

// Le club adverse : une fois sur deux, un club national (3 à 5 lutteurs d'une même nation, donc
// avec un bonus de nation), sinon des lutteurs de partout.
export function creerTournoiEquipe(mes: string[], graine: number): TournoiEquipe {
  const h = creerHasard(graine);
  const n = T.equipe.duels;
  let leurs: string[];
  let nomAdverse = CLUBS[Math.floor(h() * CLUBS.length)];
  if (h() < 0.5) {
    const nation = NATIONS[Math.floor(h() * NATIONS.length)];
    const k = 3 + Math.floor(h() * 3);
    const deLaNation = LUTTEURS.filter((l) => l.nation === nation.id).map((l) => l.id);
    const pris: string[] = [];
    while (pris.length < k) pris.push(deLaNation.splice(Math.floor(h() * deLaNation.length), 1)[0]);
    leurs = [...pris, ...tirer(n - k, LUTTEURS.filter((l) => l.nation === nation.id).map((l) => l.id), h)];
    for (let i = leurs.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [leurs[i], leurs[j]] = [leurs[j], leurs[i]]; }
    nomAdverse = `Sélection ${nation.nom}`;
  } else {
    leurs = tirer(n, [], h);
  }
  return {
    type: 'equipe', mes: mes.slice(0, n), leurs, nomAdverse,
    resultats: Array(n).fill(null), details: Array(n).fill(''), graine, gainsCombats: { medailles: 0, dollars: 0 }, recompense: null,
  };
}

export const scoreEquipe = (t: TournoiEquipe): [number, number] =>
  [t.resultats.filter((r) => r === true).length, t.resultats.filter((r) => r === false).length];

// Fini dès qu'une équipe a 3 victoires.
export const equipeFinie = (t: TournoiEquipe) => Math.max(...scoreEquipe(t)) >= T.equipe.victoiresPourGagner;
export const prochainDuel = (t: TournoiEquipe) => (equipeFinie(t) ? null : t.resultats.indexOf(null));

export function enregistrerDuel(t: TournoiEquipe, i: number, gagne: boolean, detail: string) {
  if (prochainDuel(t) !== i) throw new Error(`Duel ${i} : pas le prochain duel`);
  t.resultats[i] = gagne;
  t.details[i] = detail;
}

// ---------- Inscription et gains ----------

export type Tournoi = Competition | TournoiEquipe | Individuel;

export function payerInscription(c: Collection, type: 'individuel' | 'competition' | 'equipe'): string | null {
  const prix = T[type].inscription;
  if (c.dollars < prix) return `L'inscription coûte ${prix} $ (tu as ${c.dollars} $).`;
  c.dollars -= prix;
  return null;
}

// Combat du joueur gagné dans un tournoi : +1 médaille (et les $ d'un palier franchi).
export function gagnerCombatTournoi(c: Collection, t: Tournoi) {
  const g = gagnerMedailles(c, T.medaillesParCombatGagne);
  t.gainsCombats.medailles += g.medailles;
  t.gainsCombats.dollars += g.dollars;
}

// Gains de fin (une seule fois) : médailles et $ de la place, booster rare au vainqueur.
// Le booster montre aussi les médailles déjà gagnées pendant les combats.
export function recompenserTournoi(c: Collection, t: Tournoi, hasard: Hasard): Booster[] {
  if (t.recompense) return t.recompense;
  let medailles = 0, dollars = 0, premier = false;
  if (t.type === 'individuel') {
    const place = placesI(t).get(0) ?? 99;
    medailles = I.medailles[place] ?? 0;
    dollars = I.dollars[place] ?? 0;
    premier = place === 1;
  } else if (t.type === 'competition') {
    const place = places(t).get(0) ?? 6;
    medailles = T.competition.medailles[place] ?? 0;
    dollars = T.competition.dollars[place] ?? 0;
    premier = place === 1;
  } else {
    premier = scoreEquipe(t)[0] >= T.equipe.victoiresPourGagner;
    if (premier) { medailles = T.equipe.medailles; dollars = T.equipe.dollars; }
  }
  const g = gagnerMedailles(c, medailles);
  c.dollars += dollars;
  const boosters = premier ? [ouvrirBooster(c, hasard, 'rare')] : [];
  t.recompense = joindreGains(boosters, {
    medailles: g.medailles + t.gainsCombats.medailles,
    dollars: g.dollars + dollars + t.gainsCombats.dollars,
  });
  return t.recompense;
}
