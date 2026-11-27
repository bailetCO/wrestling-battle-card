// Le déroulé d'une partie contre l'ordinateur, sans affichage.
// La page appelle ces fonctions ; toutes les règles restent dans src/moteur.

import {
  apercuInitiative, choixOrdinateur, creerCombat, creerHasard, jouerSequence, jouerTour, reactionOrdinateur, reactionSequence,
  sequenceOrdinateur, trouverLutteur,
  type Choix, type DefLutteur, type EtatCombat, type Face, type Hasard, type IdAction, type Niveau, type ResultatSequence, type Sequence,
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
  sequence?: number; // mode Enchaînement : numéro de la séquence (les 3 duels d'une séquence ont le même)
  rupture?: ResultatSequence['rupture']; // mode Enchaînement : la chaîne a été brisée à ce duel (sinon null)
}

// Une séquence jouée (mode Enchaînement) : ses duels, et l'éventuelle rupture de chaîne.
export interface SequenceJouee { tours: TourJoue[]; rupture: ResultatSequence['rupture']; ordiAChange: boolean }

// De quoi rejouer un combat contre l'ordinateur coup par coup (signalement de bug) : les lutteurs,
// le numéro de hasard, et pour chaque tour (ou séquence) les choix et le nombre de tirages du hasard
// déjà faits à ce moment-là. Tout le hasard passe par une seule fonction : c'est suffisant.
export interface RapportCombat {
  v: 1;
  idHumain: string; idOrdi: string; graine: number; niveau: Niveau;
  defHumain: DefLutteur; defOrdi: DefLutteur;
  options: { rapide: boolean; enchainement: boolean; infini: boolean; epuisement?: number };
  tours: { m: number; h: Choix; o: Choix; f?: Face }[];
  sequences: { m: number; h: Sequence; o: Sequence; f: Face[] }[];
}

export class Partie {
  etat: EtatCombat;
  readonly hasard: HasardRejouable;
  toursJoues = 0;
  readonly debut = Date.now(); // pour la durée du combat (statistiques)
  private readonly depart: Omit<RapportCombat, 'tours' | 'sequences'>;
  private readonly rejeu: Pick<RapportCombat, 'tours' | 'sequences'> = { tours: [], sequences: [] };

  // `script` : choix imposés à l'ordinateur pour les premiers tours (tutoriel).
  constructor(
    readonly idHumain: string, readonly idOrdi: string, graine: number,
    readonly niveau: Niveau = 'normal', defHumain?: DefLutteur, readonly script: Choix[] = [], rapide = false,
    defOrdi?: DefLutteur, enchainement = false, infini = false, epuisement?: number,
  ) {
    this.etat = creerCombat(defHumain ?? trouverLutteur(idHumain), defOrdi ?? idOrdi, { rapide, enchainement, infini, epuisement });
    this.hasard = new HasardRejouable(graine);
    this.depart = {
      v: 1, idHumain, idOrdi, graine, niveau, defHumain: this.etat.joueurs[HUMAIN].def, defOrdi: this.etat.joueurs[ORDI].def,
      options: { rapide, enchainement, infini, ...(epuisement !== undefined ? { epuisement } : {}) },
    };
  }

  // Le combat tel qu'il a été joué jusqu'ici, pour le rejouer à l'identique.
  rapport(): RapportCombat {
    return structuredClone({ ...this.depart, ...this.rejeu });
  }

  // Rejoue un combat à partir de son rapport et rend l'état final.
  static rejouer(r: RapportCombat): EtatCombat {
    const o = r.options;
    const p = new Partie(r.idHumain, r.idOrdi, r.graine, r.niveau, r.defHumain, [], o.rapide, r.defOrdi, o.enchainement, o.infini, o.epuisement);
    for (const t of r.tours) {
      p.hasard.revenirA(t.m);
      if (p.resoudre(t.h, t.o, false, t.f) === 'pileOuFace') throw new Error('Rapport incomplet : annonce de pile ou face manquante.');
    }
    for (const s of r.sequences) {
      p.hasard.revenirA(s.m);
      if (p.resoudreSequence(s.h, s.o, false, s.f) === 'pileOuFace') throw new Error('Rapport incomplet : annonce de pile ou face manquante.');
    }
    return p.etat;
  }

  // Le tour en cours suit-il le script ?
  get scripte(): boolean {
    return this.toursJoues < this.script.length;
  }

  // L'ordinateur choisit en secret.
  choixOrdi(): Choix {
    if (this.scripte) return this.script[this.toursJoues];
    return choixOrdinateur(this.etat, ORDI, this.hasard.fn, this.niveau);
  }

  // Si le joueur a l'initiative : 2 actions possibles de l'ordinateur, dont la vraie.
  apercuPourHumain(actionOrdi: IdAction | 'lutte' | 'souffle'): (IdAction | 'lutte' | 'souffle')[] | null {
    return apercuInitiative(this.etat, HUMAIN, actionOrdi, this.hasard.fn);
  }

  // Si l'ordinateur a l'initiative, il regarde 2 actions du joueur et peut changer.
  reactionOrdi(choixHumain: Choix, choixOrdi: Choix): Choix {
    if (this.scripte || !this.etat.joueurs[ORDI].initiative) return choixOrdi;
    apercuInitiative(this.etat, ORDI, choixHumain.action, this.hasard.fn);
    return reactionOrdinateur(this.etat, ORDI, choixOrdi, choixHumain, this.hasard.fn, this.niveau);
  }

  // ---------- Mode Enchaînement ----------
  sequencesJouees = 0;

  // L'ordinateur compose sa séquence en secret.
  sequenceOrdi(): Sequence {
    return sequenceOrdinateur(this.etat, ORDI, this.hasard.fn, this.niveau);
  }

  // Avec l'initiative, l'ordinateur voit la dernière action du joueur et peut changer la sienne.
  reactionSequenceOrdi(seqHumain: Sequence, seqOrdi: Sequence): Sequence {
    return reactionSequence(this.etat, ORDI, seqOrdi, seqHumain, this.hasard.fn, this.niveau);
  }

  // Joue la séquence. Chaque tentative de tombé de l'ordinateur demande une annonce au joueur :
  // tant qu'il en manque, on renvoie 'pileOuFace' et la séquence sera rejouée à l'identique.
  resoudreSequence(seqHumain: Sequence, seqOrdi: Sequence, ordiAChange: boolean, faces: Face[] = []): SequenceJouee | 'pileOuFace' {
    const marque = this.hasard.marque();
    let n = 0;
    try {
      const r = jouerSequence(this.etat, seqHumain, seqOrdi, this.hasard.fn, {
        choisirFace: (j) => {
          if (j !== HUMAIN) return undefined as unknown as Face;
          if (n >= faces.length) throw new BesoinFace();
          return faces[n++];
        },
      });
      this.etat = r.etat;
      this.rejeu.sequences.push({ m: marque, h: seqHumain, o: seqOrdi, f: faces.slice(0, n) });
      this.toursJoues += r.duels.length;
      const num = ++this.sequencesJouees;
      const tours = r.duels.map((d, k): TourJoue => ({
        avant: d.avant, choixHumain: d.choix[HUMAIN], choixOrdi: d.choix[ORDI], ordiAChange: ordiAChange && k === r.duels.length - 1,
        lignes: d.lignes, sequence: num, rupture: k === r.duels.length - 1 ? r.rupture : null,
      }));
      return { tours, rupture: r.rupture, ordiAChange };
    } catch (err) {
      if (err instanceof BesoinFace) {
        this.hasard.revenirA(marque);
        return 'pileOuFace';
      }
      throw err;
    }
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
      this.rejeu.tours.push({ m: marque, h: choixHumain, o: choixOrdi, ...(face ? { f: face } : {}) });
      this.toursJoues++;
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
