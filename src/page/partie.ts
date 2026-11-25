// Le déroulé d'une partie contre l'ordinateur, sans affichage.
// La page appelle ces fonctions ; toutes les règles restent dans src/moteur.

import {
  apercuInitiative, choixOrdinateur, creerCombat, creerHasard, jouerTour, reagirInitiative,
  reagirInitiativeForte, trouverLutteur,
  type Choix, type DefLutteur, type EtatCombat, type Face, type Hasard, type IdAction, type Niveau,
} from '../moteur';

export const HUMAIN = 0;
export const ORDI = 1;

// Le hasard du moteur, avec un compteur de tirages : on peut revenir en arrière
// et rejouer exactement les mêmes tirages (utile pour le pile ou face).
export class HasardRejouable {
  private tirages = 0;
  private source: Hasard;
  constructor(readonly graine: number) {
    this.source = creerHasard(graine);
  }
  readonly fn: Hasard = () => {
    this.tirages++;
    return this.source();
  };
  marque(): number {
    return this.tirages;
  }
  revenirA(n: number) {
    this.source = creerHasard(this.graine);
    for (let i = 0; i < n; i++) this.source();
    this.tirages = n;
  }
}

class BesoinFace extends Error {}

export interface TourJoue {
  avant: EtatCombat;
  choixHumain: Choix;
  choixOrdi: Choix;
  ordiAChange: boolean;
  lignes: string[];
}

export class Partie {
  etat: EtatCombat;
  readonly hasard: HasardRejouable;

  constructor(
    readonly idHumain: string, readonly idOrdi: string, graine: number,
    readonly niveau: Niveau = 'normal', defHumain?: DefLutteur,
  ) {
    this.etat = creerCombat(defHumain ?? trouverLutteur(idHumain), idOrdi);
    this.hasard = new HasardRejouable(graine);
  }

  // L'ordinateur choisit en secret.
  choixOrdi(): Choix {
    return choixOrdinateur(this.etat, ORDI, this.hasard.fn, this.niveau);
  }

  // Si le joueur a l'initiative : 2 actions possibles de l'ordinateur, dont la vraie.
  apercuPourHumain(actionOrdi: IdAction | 'lutte'): (IdAction | 'lutte')[] | null {
    return apercuInitiative(this.etat, HUMAIN, actionOrdi, this.hasard.fn);
  }

  // Si l'ordinateur a l'initiative, il regarde 2 actions du joueur et peut changer.
  reactionOrdi(choixHumain: Choix, choixOrdi: Choix): Choix {
    if (!this.etat.joueurs[ORDI].initiative) return choixOrdi;
    apercuInitiative(this.etat, ORDI, choixHumain.action, this.hasard.fn);
    if (this.niveau === 'fort') return reagirInitiativeForte(this.etat, ORDI, choixOrdi, choixHumain, this.hasard.fn);
    return reagirInitiative(this.etat, ORDI, choixOrdi, this.hasard.fn);
  }

  // Joue le tour. Si l'ordinateur réussit sa tentative de tombé, le joueur doit
  // annoncer pile ou face : on renvoie 'pileOuFace', puis on rejoue le tour à
  // l'identique avec l'annonce.
  resoudre(choixHumain: Choix, choixOrdi: Choix, ordiAChange: boolean, face?: Face): TourJoue | 'pileOuFace' {
    const marque = this.hasard.marque();
    const avant = this.etat;
    try {
      const apres = jouerTour(avant, choixHumain, choixOrdi, this.hasard.fn, {
        choisirFace: (j) => {
          if (j !== HUMAIN) return undefined as unknown as Face; // l'ordinateur annonce au hasard
          if (!face) throw new BesoinFace();
          return face;
        },
      });
      this.etat = apres;
      return { avant, choixHumain, choixOrdi, ordiAChange, lignes: apres.journal.slice(avant.journal.length) };
    } catch (err) {
      if (err instanceof BesoinFace) {
        this.hasard.revenirA(marque);
        return 'pileOuFace';
      }
      throw err;
    }
  }
}
