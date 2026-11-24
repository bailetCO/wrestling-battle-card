// Ordinateur très simple : choisit au hasard parmi les actions jouables.
// Un niveau « fort » est prévu plus tard.

import { ACTIONS, REGLES } from './config';
import {
  actionsJouables, chanceReussite, comparerFamilles, coutSpeciale, peutJouerSpeciale, precisionDe,
} from './combat';
import { choisirParmi, reussit, type Hasard } from './hasard';
import type { Choix, EtatCombat, IdAction, Joueur } from './types';

export function choixAleatoire(etat: EtatCombat, j: Joueur, hasard: Hasard, chanceSpeciale = 0.3): Choix {
  const jouables = actionsJouables(etat, j);
  if (jouables.length === 0) return { action: 'lutte' };
  const action = choisirParmi(hasard, jouables);
  const speciale =
    ACTIONS[action].famille === etat.joueurs[j].def.familleSpeciale &&
    peutJouerSpeciale(etat, j, action) &&
    reussit(hasard, chanceSpeciale);
  return { action, speciale };
}

// Quand l'ordinateur a l'initiative, il voit 2 actions possibles de l'adversaire.
// Niveau normal : une fois sur deux, il change pour une autre action jouable, au hasard.
export function reagirInitiative(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, hasard: Hasard,
): Choix {
  if (choixActuel.action === 'lutte') return choixActuel;
  if (!reussit(hasard, REGLES.ia.chanceChangerInitiative)) return choixActuel;
  const autres = actionsJouables(etat, j).filter((a) => a !== choixActuel.action);
  if (autres.length === 0) return choixActuel;
  return { action: choisirParmi(hasard, autres), speciale: false };
}

// ---------- Niveau fort ----------
// L'ordinateur estime, pour chacune de ses actions (et de ses spéciales possibles),
// ce qu'elle rapporte en moyenne face aux actions jouables de l'adversaire :
// points marqués ou encaissés, chances de tombé, coût en endurance, passivité.

interface Candidat { action: IdAction; speciale: boolean; }

function chanceTombe(etat: EtatCombat, j: Joueur): number {
  const T = REGLES.tombe;
  const a = etat.joueurs[j].endurance;
  const b = etat.joueurs[j === 0 ? 1 : 0].endurance;
  const base = a > b ? T.plusEndurance : a === b ? T.egalite : T.moinsEndurance;
  return base * 0.5; // puis le pile ou face de l'adversaire
}

// Ce que gagne `qui` si son action l'emporte (en points, approximatif).
function gain(etat: EtatCombat, qui: Joueur, c: Candidat, autre: Candidat | null): number {
  const F = REGLES.ia.fort;
  const S = REGLES.speciale;
  const l = etat.joueurs[qui];
  const a = ACTIONS[c.action];
  const famAutre = autre ? ACTIONS[autre.action].famille : null;
  const tombe = F.valeurTombe * chanceTombe(etat, qui);
  switch (a.famille) {
    case 'attaque': {
      let pts = a.points + (l.bonusFeinte ? REGLES.bonusFeinte : 0) + (l.bonusEnchainement ? S.bonusEnchainementFeinte : 0);
      if (c.speciale) pts += tombe;
      return pts;
    }
    case 'defense': {
      let pts = F.valeurRecuperation;
      if (c.speciale) pts += S.pointsDefense;
      else if (a.points > 0 && famAutre === 'attaque') pts += a.points;
      return pts;
    }
    case 'contre': {
      let pts = l.bonusEnchainement ? S.bonusEnchainementFeinte : 0;
      if (autre && famAutre === 'attaque') pts += ACTIONS[autre.action].points;
      if (c.speciale && (famAutre === 'attaque' || famAutre === 'feinte')) pts += tombe;
      return pts;
    }
    case 'feinte': {
      let pts = c.speciale ? S.pointsFeinte + 2 : F.valeurFeinte;
      if (famAutre === 'defense') pts += 1;
      if (a.id === 'matraquage') pts += 0.5;
      return pts;
    }
  }
}

function precision(etat: EtatCombat, j: Joueur, c: Candidat): number {
  const l = etat.joueurs[j];
  const malus = ACTIONS[c.action].famille === 'attaque' && l.malusPrecisionTours > 0 ? REGLES.matraquage.malusPrecision : 0;
  return chanceReussite(precisionDe(l.endurance) - malus);
}

function coutDe(etat: EtatCombat, j: Joueur, c: Candidat): number {
  return c.speciale ? coutSpeciale(etat, j, c.action) : ACTIONS[c.action].cout;
}

// Valeur moyenne d'une action face à une liste d'actions adverses possibles.
export function valeurAction(etat: EtatCombat, j: Joueur, c: Candidat, adverses: Candidat[]): number {
  const o: Joueur = j === 0 ? 1 : 0;
  const lj = etat.joueurs[j];
  const lo = etat.joueurs[o];
  const p = precision(etat, j, c);
  let total = 0;
  for (const d of adverses) {
    const q = precision(etat, o, d);
    const fj = ACTIONS[c.action].famille;
    const fo = ACTIONS[d.action].famille;
    // Les deux actions passent : duel (avec la percée possible de l'attaque spéciale).
    let duelVal: number;
    const issue = comparerFamilles(etat, j === 0 ? [fj, fo] : [fo, fj], j === 0 ? [lj.endurance, lo.endurance] : [lo.endurance, lj.endurance],
      j === 0 ? [c.speciale, d.speciale] : [d.speciale, c.speciale]);
    const issueJ = j === 0 ? issue : issue === 'gagne' ? 'perd' : issue === 'perd' ? 'gagne' : 'neutre';
    const valIssue = (r: string) => (r === 'gagne' ? gain(etat, j, c, d) : r === 'perd' ? -gain(etat, o, d, c) : 0);
    duelVal = valIssue(issueJ);
    const percee = (att: Joueur, ca: Candidat, cd: Candidat) =>
      ca.speciale && ACTIONS[ca.action].famille === 'attaque' && !cd.speciale &&
      ['defense', 'contre'].includes(ACTIONS[cd.action].famille) &&
      etat.joueurs[att].def.force > etat.joueurs[att === 0 ? 1 : 0].def.force
        ? 1 - etat.joueurs[att === 0 ? 1 : 0].def.force / etat.joueurs[att].def.force : 0;
    const pj = percee(j, c, d);
    const po = percee(o, d, c);
    if (pj > 0) duelVal = pj * gain(etat, j, c, d) + (1 - pj) * duelVal;
    if (po > 0) duelVal = -po * gain(etat, o, d, c) + (1 - po) * duelVal;
    total += p * q * duelVal + p * (1 - q) * gain(etat, j, c, null) - (1 - p) * q * gain(etat, o, d, null);
  }
  let v = total / Math.max(1, adverses.length);
  // Coût en endurance : plus cher quand l'endurance baisse, et passer sous 50 fait rater des actions.
  const cout = coutDe(etat, j, c);
  const reste = lj.endurance - cout;
  const E = REGLES.ia.fort.endurance;
  const poids = lj.endurance > E.seuilHaut ? E.poidsHaut : lj.endurance > E.seuilBas ? E.poidsMoyen : E.poidsBas;
  v -= cout * poids;
  if (lj.endurance >= 50 && reste < 50) v -= E.passerSous50;
  if (reste <= 0) v -= E.tomberAZero;
  // Passivité : 3 tours sans attaque ni contre donnent un point à l'adversaire.
  const fam = ACTIONS[c.action].famille;
  if (lj.toursSansAttaque >= REGLES.pression.tours - 1 && fam !== 'attaque' && fam !== 'contre') v -= REGLES.pression.points;
  return v;
}

function candidats(etat: EtatCombat, j: Joueur): Candidat[] {
  const jouables = actionsJouables(etat, j);
  const liste: Candidat[] = jouables.map((action) => ({ action, speciale: false }));
  for (const action of jouables) if (peutJouerSpeciale(etat, j, action)) liste.push({ action, speciale: true });
  return liste;
}

function meilleur(etat: EtatCombat, j: Joueur, adverses: Candidat[], hasard: Hasard, toujoursLeMeilleur = false): Choix {
  const liste = candidats(etat, j);
  if (liste.length === 0) return { action: 'lutte' };
  const o: Joueur = j === 0 ? 1 : 0;
  const adv = adverses.length ? adverses : [{ action: etat.joueurs[o].def.actions[0], speciale: false }];
  const notes = liste.map((c) => ({ c, v: valeurAction(etat, j, c, adv) })).sort((x, y) => y.v - x.v);
  const pris = toujoursLeMeilleur || notes.length === 1 || reussit(hasard, REGLES.ia.fort.chanceMeilleureAction) ? notes[0] : notes[1];
  return { action: pris.c.action, speciale: pris.c.speciale };
}

// Choix secret de l'ordinateur fort : la meilleure action en moyenne face à tout ce que l'adversaire peut jouer.
export function choixFort(etat: EtatCombat, j: Joueur, hasard: Hasard): Choix {
  const o: Joueur = j === 0 ? 1 : 0;
  const adverses = actionsJouables(etat, o).map((action) => ({ action, speciale: false }));
  return meilleur(etat, j, adverses, hasard);
}

// Avec l'initiative : 3 fois sur 4, l'ordinateur fort joue l'action qui contre la tienne.
export function reagirInitiativeForte(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, choixAdverse: Choix, hasard: Hasard,
): Choix {
  if (choixAdverse.action === 'lutte' || choixActuel.action === 'lutte') return choixActuel;
  if (!reussit(hasard, REGLES.ia.fort.chanceContrerInitiative)) return choixActuel;
  return meilleur(etat, j, [{ action: choixAdverse.action, speciale: !!choixAdverse.speciale }], hasard, true);
}

export type Niveau = 'normal' | 'fort';

export function choixOrdinateur(etat: EtatCombat, j: Joueur, hasard: Hasard, niveau: Niveau): Choix {
  return niveau === 'fort' ? choixFort(etat, j, hasard) : choixAleatoire(etat, j, hasard);
}
