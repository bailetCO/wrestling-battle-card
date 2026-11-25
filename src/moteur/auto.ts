// Combat automatique : l'ordinateur choisit les actions des deux lutteurs et joue tout le combat
// d'un coup. Entièrement déterminé par la graine : deux téléphones calculent le même combat.

import { REGLES } from './config';
import { apercuInitiative, jouerTour } from './combat';
import { creerHasard, type Hasard } from './hasard';
import { choixOrdinateur, reactionOrdinateur, type Niveau } from './ia';
import type { Choix, EtatCombat, Joueur } from './types';

// Chance qu'une décision du combat automatique soit prise comme l'ordinateur fort (sinon normal),
// selon le niveau de compte du joueur : 0 au niveau 3, 1 au niveau 10.
export function chanceFortAuto(niveauCompte: number): number {
  const A = REGLES.auto;
  return Math.max(0, Math.min(1, (niveauCompte - A.niveauCompteMin) / (A.niveauCompteFort - A.niveauCompteMin)));
}

// Bonus de statistiques de l'auto au-dessus du niveau de compte 10, contre l'ordinateur (0 sinon).
export function bonusAutoExpert(niveauCompte: number, niveauOrdi: Niveau): number {
  return niveauCompte > REGLES.auto.niveauCompteFort ? REGLES.auto.bonusExpert[niveauOrdi] : 0;
}

export const autoOuvert = (niveauCompte: number) => niveauCompte >= REGLES.auto.niveauCompteMin;

// Comment joue chaque camp : un niveau fixe (l'ordinateur adverse) ou un mélange normal / fort.
export type CampAuto = { niveau: Niveau } | { chanceFort: number };

export interface TourAuto { avant: EtatCombat; choix: [Choix, Choix]; lignes: string[] }

const niveauDuTour = (c: CampAuto, d: Hasard): Niveau => ('niveau' in c ? c.niveau : d() < c.chanceFort ? 'fort' : 'normal');

// Joue le combat jusqu'au bout. `graine` règle le hasard du combat ; les décisions des deux camps
// ont leur propre hasard (tiré de la même graine).
export function combatAuto(depart: EtatCombat, graine: number, camps: [CampAuto, CampAuto], maxTours = 300): { etat: EtatCombat; tours: TourAuto[] } {
  const h = creerHasard(graine);
  const d = creerHasard((graine * 7 + 3) >>> 0);
  let etat = depart;
  const tours: TourAuto[] = [];
  while (!etat.termine && tours.length < maxTours) {
    const niv: [Niveau, Niveau] = [niveauDuTour(camps[0], d), niveauDuTour(camps[1], d)];
    const c: [Choix, Choix] = [choixOrdinateur(etat, 0, d, niv[0]), choixOrdinateur(etat, 1, d, niv[1])];
    // Initiative : celui qui l'a voit 2 actions possibles de l'autre et peut changer.
    for (const j of [0, 1] as Joueur[]) {
      const o: Joueur = j === 0 ? 1 : 0;
      if (etat.joueurs[j].initiative && apercuInitiative(etat, j, c[o].action, d)) {
        c[j] = reactionOrdinateur(etat, j, c[j], c[o], d, niv[j]);
      }
    }
    const avant = etat;
    etat = jouerTour(etat, c[0], c[1], h); // pile ou face : annoncé au hasard
    tours.push({ avant, choix: c, lignes: etat.journal.slice(avant.journal.length) });
  }
  return { etat, tours };
}
