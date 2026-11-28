// L'ordinateur, en 3 niveaux. Il ne voit jamais l'action du joueur avant qu'elle soit jouée
// (sauf les 2 actions montrées par l'initiative, comme pour le joueur) et n'a aucun bonus de stats :
// seule sa façon de choisir change.
// - Facile : au hasard ; avec l'initiative, change d'action 1 fois sur 4.
// - Normal : au hasard ; avec l'initiative, change d'action 1 fois sur 2.
// - Fort : joue contre tes habitudes ; avec l'initiative, contre ton action 3 fois sur 4.

import { ACTIONS, REGLES } from './config';
import { seuilPrecision,
  actionsJouables, chanceReussite, comparerFamilles, coutDuTour, coutSpeciale, peutJouerSpeciale, pointsCombo, precisionDe, souffleDispo,
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
// Niveaux facile et normal : il change parfois pour une autre action jouable, au hasard.
export function reagirInitiative(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, hasard: Hasard, niveau: 'facile' | 'normal' = 'normal',
): Choix {
  if (choixActuel.action === 'lutte' || choixActuel.action === 'souffle') return choixActuel;
  if (!reussit(hasard, REGLES.ia.chanceChangerInitiative[niveau])) return choixActuel;
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
      let pts = a.points + pointsCombo(l, a.id) + (l.bonusFeinte ? REGLES.bonusFeinte : 0) + (l.bonusEnchainement ? S.bonusEnchainementFeinte : 0);
      if (c.speciale) pts += tombe;
      return pts;
    }
    case 'defense': {
      let pts = a.id === 'esquive' ? 0 : F.valeurRecuperation;
      if (c.speciale) pts += S.pointsDefense;
      else if (a.points > 0 && famAutre === 'attaque') pts += a.points + (a.id === 'sprawl' && autre?.action === 'double_jambe' ? REGLES.sprawlSurDoubleJambe : 0);
      if (famAutre === 'attaque' && a.id === 'parade') pts += 0.5;
      if (famAutre === 'attaque' && a.id === 'esquive') pts += 0.5;
      if (famAutre === 'attaque' && autre && ACTIONS[autre.action].points >= REGLES.grosseAttaqueBloquee.pointsMin) pts += 0.5;
      return pts;
    }
    case 'contre': {
      let pts = (l.bonusEnchainement ? S.bonusEnchainementFeinte : 0) + (l.bonusFeinte ? REGLES.bonusFeinte : 0);
      if (autre && famAutre === 'attaque') {
        const v = ACTIONS[autre.action].points;
        pts += a.id === 'relance' && !c.speciale ? Math.ceil(v * REGLES.relance.partRenvoyee) : v;
        if (l.derniereReussie === REGLES.combos.esquiveContre.avant) pts += REGLES.combos.esquiveContre.points;
        if (a.id === 'cravate' && REGLES.attaquesAuxJambes.includes(autre.action)) pts += 0.5;
      }
      if (a.id === 'relance' && famAutre === 'defense') pts += REGLES.relance.pointsSurDefense;
      if (c.speciale && (famAutre === 'attaque' || famAutre === 'feinte')) pts += tombe;
      return pts;
    }
    case 'feinte': {
      let pts = c.speciale ? S.pointsFeinte + 2 : F.valeurFeinte;
      if (famAutre === 'defense') pts += 1;
      if (a.id === 'matraquage') pts += 0.5;
      if (a.id === 'changement_niveau') pts += 0.5;
      return pts;
    }
  }
}

function precision(etat: EtatCombat, j: Joueur, c: Candidat): number {
  const l = etat.joueurs[j];
  const attaque = ACTIONS[c.action].famille === 'attaque';
  if (attaque && l.derniereReussie === REGLES.combos.contreTemps.avant) return 1;
  if (c.action === 'tour_hanche' && l.def.force > etat.joueurs[j === 0 ? 1 : 0].def.force) return 1;
  const malus = attaque && l.malusPrecisionTours > 0 && c.action !== 'simple_jambe' ? REGLES.matraquage.malusPrecision : 0;
  return chanceReussite(precisionDe(l.endurance) - malus, l.def.enduranceMax);
}

function coutDe(etat: EtatCombat, j: Joueur, c: Candidat): number {
  return c.speciale ? coutSpeciale(etat, j, c.action) : coutDuTour(etat, j, c.action);
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
  // Coût en endurance : plus cher quand l'endurance baisse, et passer sous la moitié de son endurance max fait rater des actions.
  const cout = coutDe(etat, j, c);
  const reste = lj.endurance - cout;
  const E = REGLES.ia.fort.endurance;
  const poids = lj.endurance > E.seuilHaut ? E.poidsHaut : lj.endurance > E.seuilBas ? E.poidsMoyen : E.poidsBas;
  v -= cout * poids;
  const seuil = seuilPrecision(lj.def.enduranceMax);
  if (lj.endurance >= seuil && reste < seuil) v -= E.passerSous50;
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

// Second souffle : l'ordinateur souffle à 0 d'endurance, ou sous `REGLES.ia.seuilSouffle`.
function veutSouffler(etat: EtatCombat, j: Joueur): boolean {
  return souffleDispo(etat, j) && etat.joueurs[j].endurance < REGLES.ia.seuilSouffle;
}

// Choix secret de l'ordinateur fort : la meilleure action face à ce que l'adversaire joue
// d'habitude. Chaque action jouable de l'adversaire compte d'autant plus que sa famille revient
// souvent dans ses dernières actions ; sans habitudes connues, toutes comptent pareil.
export function choixFort(etat: EtatCombat, j: Joueur, hasard: Hasard): Choix {
  const o: Joueur = j === 0 ? 1 : 0;
  const F = REGLES.ia.fort;
  const habitudes = etat.joueurs[o].habitudes;
  const adverses: Candidat[] = [];
  for (const action of actionsJouables(etat, o)) {
    const n = habitudes.filter((f) => f === ACTIONS[action].famille).length;
    for (let k = 0; k < 1 + n * F.poidsHabitude; k++) adverses.push({ action, speciale: false });
  }
  return meilleur(etat, j, adverses, hasard);
}

// Avec l'initiative : 3 fois sur 4, l'ordinateur fort joue l'action qui contre la tienne.
export function reagirInitiativeForte(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, choixAdverse: Choix, hasard: Hasard,
): Choix {
  const passer = (a: Choix['action']) => a === 'lutte' || a === 'souffle';
  if (passer(choixAdverse.action) || passer(choixActuel.action)) return choixActuel;
  if (!reussit(hasard, REGLES.ia.fort.chanceContrerInitiative)) return choixActuel;
  return meilleur(etat, j, [{ action: choixAdverse.action, speciale: !!choixAdverse.speciale }], hasard, true);
}

export type Niveau = 'facile' | 'normal' | 'fort';
export const NIVEAUX_ORDI: Niveau[] = ['facile', 'normal', 'fort'];

// Choix secret de l'ordinateur facile : au hasard, sans spéciale, et parfois la moins bonne action.
export function choixFacile(etat: EtatCombat, j: Joueur, hasard: Hasard): Choix {
  if (!reussit(hasard, REGLES.ia.facile.chanceMaladresse)) return choixAleatoire(etat, j, hasard, 0);
  const liste = actionsJouables(etat, j).map((action) => ({ action, speciale: false }));
  if (liste.length === 0) return { action: 'lutte' };
  const o: Joueur = j === 0 ? 1 : 0;
  const adverses = actionsJouables(etat, o).map((action) => ({ action, speciale: false }));
  const adv = adverses.length ? adverses : [{ action: etat.joueurs[o].def.actions[0], speciale: false }];
  const pire = liste.map((c) => ({ c, v: valeurAction(etat, j, c, adv) })).sort((x, y) => x.v - y.v)[0];
  return { action: pire.c.action, speciale: false };
}

export function choixOrdinateur(etat: EtatCombat, j: Joueur, hasard: Hasard, niveau: Niveau): Choix {
  if (veutSouffler(etat, j) || (souffleDispo(etat, j) && etat.joueurs[j].endurance <= 0)) return { action: 'souffle' };
  if (niveau === 'fort') return choixFort(etat, j, hasard);
  return niveau === 'facile' ? choixFacile(etat, j, hasard) : choixAleatoire(etat, j, hasard);
}

// Réaction de l'ordinateur quand il a l'initiative et voit 2 actions possibles du joueur.
export function reactionOrdinateur(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, choixAdverse: Choix, hasard: Hasard, niveau: Niveau,
): Choix {
  return niveau === 'fort'
    ? reagirInitiativeForte(etat, j, choixActuel, choixAdverse, hasard)
    : reagirInitiative(etat, j, choixActuel, hasard, niveau);
}
