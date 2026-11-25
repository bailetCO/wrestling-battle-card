// Tournois contre l'ordinateur, sans affichage : tirage, tableau, repêchage croisé, gains.
// La page joue les combats du joueur ; ceux entre deux ordinateurs sont simulés ici.

import {
  LUTTEURS, REGLES, choixOrdinateur, creerCombat, creerHasard, jouerTour,
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

export function creerTournoiEquipe(mes: string[], graine: number): TournoiEquipe {
  const h = creerHasard(graine);
  const n = T.equipe.duels;
  return {
    type: 'equipe', mes: mes.slice(0, n), leurs: tirer(n, [], h), nomAdverse: CLUBS[Math.floor(h() * CLUBS.length)],
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

export function payerInscription(c: Collection, type: 'competition' | 'equipe'): string | null {
  const prix = T[type].inscription;
  if (c.dollars < prix) return `L'inscription coûte ${prix} $ (tu as ${c.dollars} $).`;
  c.dollars -= prix;
  return null;
}

// Combat du joueur gagné dans un tournoi : +1 médaille (et les $ d'un palier franchi).
export function gagnerCombatTournoi(c: Collection, t: Competition | TournoiEquipe) {
  const g = gagnerMedailles(c, T.medaillesParCombatGagne);
  t.gainsCombats.medailles += g.medailles;
  t.gainsCombats.dollars += g.dollars;
}

// Gains de fin (une seule fois) : médailles et $ de la place, booster rare au vainqueur.
// Le booster montre aussi les médailles déjà gagnées pendant les combats.
export function recompenserTournoi(c: Collection, t: Competition | TournoiEquipe, hasard: Hasard): Booster[] {
  if (t.recompense) return t.recompense;
  let medailles = 0, dollars = 0, premier = false;
  if (t.type === 'competition') {
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
