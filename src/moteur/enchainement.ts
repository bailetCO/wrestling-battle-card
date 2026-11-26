// Mode Enchaînement (à l'essai : combat rapide et entre amis). Aucun affichage ici.
// Chacun compose en secret une séquence de 3 actions. Les actions sont comparées une à une
// (1 contre 1, 2 contre 2, 3 contre 3) avec les règles habituelles d'un tour.
// - Rupture de chaîne par un contre réussi au 1er duel : les deux séquences s'arrêtent. Ce qui a
//   été joué compte (points compris). L'adversaire paie quand même l'endurance de ses actions
//   annulées ; celui qui a contré ne paie pas les siennes.
// - Feinte réussie au 2e duel (2 chances sur 3) : la dernière action de l'adversaire est annulée
//   (payée, sans effet) ; celle du feinteur se joue normalement.
// - Endurance : une séquence doit pouvoir être payée en entier (coût de base de chaque action) ;
//   s'il ne reste plus de quoi payer aucune action, la place est prise par « Lutte ». Si, pendant
//   la séquence, une action devient impossible (endurance perdue, spéciale plus disponible),
//   elle est remplacée par Lutte.
// - Initiative : celui qui l'a voit la dernière action de l'adversaire avant la séquence et
//   peut changer sa propre dernière action. Une initiative gagnée pendant une séquence sert
//   pour la séquence suivante.

import { ACTIONS, REGLES, coutAction } from './config';
import { actionsJouables, coutSpeciale, jouerTour, peutJouerSpeciale, souffleDispo } from './combat';
import { reussit, type Hasard } from './hasard';
import { choixOrdinateur, reactionOrdinateur, type Niveau } from './ia';
import type { Choix, EtatCombat, IdAction, Joueur, OptionsTour } from './types';

export type Sequence = Choix[];

const autre = (j: Joueur): Joueur => (j === 0 ? 1 : 0);
export const TAILLE_SEQUENCE = REGLES.enchainement.actions;

// Coût prévu d'une action de la séquence (coût de base, sans les réductions de combo qui
// dépendent de la réussite des actions précédentes).
export function coutPrevu(etat: EtatCombat, j: Joueur, c: Choix): number {
  if (c.action === 'lutte' || c.action === 'souffle') return 0;
  return c.speciale ? coutSpeciale(etat, j, c.action) : coutAction(etat.joueurs[j].def, c.action);
}

// Endurance qui resterait après avoir payé ces actions (le souffle rend de l'endurance).
export function enduranceApres(etat: EtatCombat, j: Joueur, debut: Sequence): number {
  let reste = etat.joueurs[j].endurance;
  for (const c of debut) {
    reste -= coutPrevu(etat, j, c);
    if (c.action === 'souffle') reste = Math.min(etat.joueurs[j].def.enduranceMax, reste + REGLES.souffle.gain);
  }
  return reste;
}

// Actions qu'on peut encore ajouter à une séquence déjà commencée.
export function actionsAjoutables(etat: EtatCombat, j: Joueur, debut: Sequence): IdAction[] {
  const reste = enduranceApres(etat, j, debut);
  if (reste <= 0) return [];
  return etat.joueurs[j].def.actions.filter((a) => coutAction(etat.joueurs[j].def, a) <= reste);
}

// L'action spéciale est-elle possible à cette place de la séquence ? (une seule par séquence)
export function speciaux(etat: EtatCombat, j: Joueur, debut: Sequence, a: IdAction): boolean {
  if (debut.some((c) => c.speciale)) return false;
  if (!peutJouerSpeciale(etat, j, a)) return false;
  return coutSpeciale(etat, j, a) <= enduranceApres(etat, j, debut);
}

// Le second souffle est-il possible à cette place ? (une fois, sous le seuil d'endurance)
export function souffleAjoutable(etat: EtatCombat, j: Joueur, debut: Sequence): boolean {
  return souffleDispo(etat, j) && !debut.some((c) => c.action === 'souffle') && enduranceApres(etat, j, debut) < REGLES.souffle.seuil;
}

// Vérifie une séquence avant de l'envoyer. Renvoie un message d'erreur, ou null si elle est bonne.
export function validerSequence(etat: EtatCombat, j: Joueur, seq: Sequence): string | null {
  if (seq.length !== TAILLE_SEQUENCE) return `Il faut ${TAILLE_SEQUENCE} actions.`;
  for (let k = 0; k < seq.length; k++) {
    const debut = seq.slice(0, k);
    const c = seq[k];
    if (c.action === 'lutte') {
      if (actionsAjoutables(etat, j, debut).length) return 'Lutte seulement quand il ne reste plus de quoi payer une action.';
      continue;
    }
    if (c.action === 'souffle') {
      if (!souffleAjoutable(etat, j, debut)) return 'Le second souffle n\'est pas possible ici.';
      continue;
    }
    if (!etat.joueurs[j].def.actions.includes(c.action)) return 'Action inconnue pour ce lutteur.';
    if (c.speciale ? !speciaux(etat, j, debut, c.action) : !actionsAjoutables(etat, j, debut).includes(c.action)) {
      return 'Pas assez d\'endurance pour toute la séquence.';
    }
  }
  return null;
}

// Initiative : la dernière action de l'adversaire, montrée à celui qui a l'initiative.
export function apercuSequence(etat: EtatCombat, j: Joueur, seqAdverse: Sequence): Choix | null {
  return etat.joueurs[j].initiative ? seqAdverse[seqAdverse.length - 1] : null;
}

export interface DuelJoue { avant: EtatCombat; choix: [Choix, Choix]; lignes: string[] }
export interface ResultatSequence {
  etat: EtatCombat;
  duels: DuelJoue[];
  rupture: { par: Joueur; duel: number; cause: 'contre' | 'feinte' } | null;
}

// Joue une séquence complète (ou jusqu'à la rupture, la fin de la période ou du combat).
export function jouerSequence(
  depart: EtatCombat, seqA: Sequence, seqB: Sequence, hasard: Hasard, options: OptionsTour = {},
): ResultatSequence {
  const E = REGLES.enchainement;
  let e = depart;
  const duels: DuelJoue[] = [];
  const initiative: [boolean, boolean] = [false, false];
  let rupture: ResultatSequence['rupture'] = null;
  let annulee: Joueur | undefined;
  for (let k = 0; k < TAILLE_SEQUENCE && !e.termine; k++) {
    const avant = e;
    e = jouerTour(e, seqA[k], seqB[k], hasard, { ...options, sequence: true, annulee });
    annulee = undefined;
    duels.push({ avant, choix: e.derniersChoix!, lignes: e.journal.slice(avant.journal.length) });
    if (e.termine || e.periode !== avant.periode) {
      return { etat: e, duels, rupture }; // période ou combat terminés : la séquence s'arrête
    }
    for (const j of [0, 1] as Joueur[]) initiative[j] ||= e.joueurs[j].initiative;
    if (k === TAILLE_SEQUENCE - 1) break;
    const seqs = [seqA, seqB];
    for (const j of [0, 1] as Joueur[]) {
      const r = e.joueurs[j].derniereReussie;
      if (!r) continue;
      const f = ACTIONS[r].famille;
      const o = autre(j);
      // Contre réussi au 1er duel : les deux séquences s'arrêtent, l'adversaire paie ses actions annulées.
      if (f === 'contre' && (E.rupturesContre as readonly number[]).includes(k + 1) && !rupture) {
        rupture = { par: j, duel: k + 1, cause: 'contre' };
        e = structuredClone(e);
        const l = e.joueurs[o];
        const perte = seqs[o].slice(k + 1).reduce((t, c) => t + coutPrevu(e, o, c), 0);
        l.endurance = Math.max(0, l.endurance - perte);
        e.journal.push(`Chaîne brisée : le contre de ${e.joueurs[j].def.nom} casse l'enchaînement de ${l.def.nom}, qui s'épuise sur ses actions annulées (−${Math.round(perte * 10) / 10} d'endurance). La séquence s'arrête là.`);
        duels[duels.length - 1].lignes = e.journal.slice(duels[duels.length - 1].avant.journal.length);
      // Feinte réussie au 2e duel : la dernière action de l'adversaire est annulée (et payée).
      } else if (f === 'feinte' && k + 1 === E.ruptureFeinte && !rupture && reussit(hasard, E.chanceFeinteRupture)) {
        rupture = { par: j, duel: k + 1, cause: 'feinte' };
        annulee = o;
        e = structuredClone(e);
        e.journal.push(`Chaîne brisée : la feinte de ${e.joueurs[j].def.nom} casse l'enchaînement de ${e.joueurs[o].def.nom}, dont la dernière action sera annulée.`);
        duels[duels.length - 1].lignes = e.journal.slice(duels[duels.length - 1].avant.journal.length);
      }
    }
    if (rupture?.cause === 'contre') break;
  }
  if (!e.termine) {
    e = e === depart ? structuredClone(e) : e;
    for (const j of [0, 1] as Joueur[]) e.joueurs[j].initiative = initiative[j];
  }
  return { etat: e, duels, rupture };
}

// ---------- Ordinateur ----------

// Projection de l'état d'un lutteur après des actions prévues (pour choisir les suivantes) :
// endurance payée, souffle, spéciale utilisée, action « réussie » pour viser les combos.
function projeter(etat: EtatCombat, j: Joueur, debut: Sequence): EtatCombat {
  const p = structuredClone({ ...etat, journal: [] });
  const l = p.joueurs[j];
  for (const c of debut) {
    l.endurance = Math.max(0, l.endurance - coutPrevu(p, j, c));
    if (c.action === 'souffle') {
      l.endurance = Math.min(l.def.enduranceMax, l.endurance + REGLES.souffle.gain);
      l.souffleUtilise = true;
    }
    if (c.speciale) l.dernierSpecialTour = p.tourGlobal;
    l.derniereReussie = c.action === 'lutte' || c.action === 'souffle' ? null : c.action;
    p.tour++;
    p.tourGlobal++;
  }
  return p;
}

// Séquence de l'ordinateur, action par action, à son niveau.
export function sequenceOrdinateur(etat: EtatCombat, j: Joueur, hasard: Hasard, niveau: Niveau): Sequence {
  const seq: Sequence = [];
  for (let k = 0; k < TAILLE_SEQUENCE; k++) {
    const p = projeter(etat, j, seq);
    let c = actionsJouables(p, j).length || souffleDispo(p, j) ? choixOrdinateur(p, j, hasard, niveau) : { action: 'lutte' as const };
    if (c.speciale && seq.some((x) => x.speciale)) c = { action: c.action };
    if (c.action === 'souffle' && seq.some((x) => x.action === 'souffle')) c = { action: 'lutte' };
    seq.push(c);
  }
  return seq;
}

// Avec l'initiative, l'ordinateur voit la dernière action de l'adversaire et peut changer la sienne.
export function reactionSequence(
  etat: EtatCombat, j: Joueur, seq: Sequence, seqAdverse: Sequence, hasard: Hasard, niveau: Niveau,
): Sequence {
  const vue = apercuSequence(etat, j, seqAdverse);
  if (!vue) return seq;
  const n = seq.length - 1;
  const p = projeter(etat, j, seq.slice(0, n));
  const derniere = actionsJouables(p, j).length ? reactionOrdinateur(p, j, seq[n], vue, hasard, niveau) : seq[n];
  return [...seq.slice(0, n), derniere];
}
