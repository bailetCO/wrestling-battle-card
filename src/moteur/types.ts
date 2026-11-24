// Types partagés par tout le moteur de combat.

export type Famille = 'attaque' | 'defense' | 'contre' | 'feinte';

export type IdAction =
  | 'attaque_base'
  | 'simple_jambe'
  | 'double_jambe'
  | 'ceinture_arriere'
  | 'bras_roule'
  | 'grande_projection'
  | 'german_suplex'
  | 'defense'
  | 'parade'
  | 'esquive'
  | 'sprawl'
  | 'contre'
  | 'relance'
  | 'feinte'
  | 'matraquage';

export interface DefAction {
  id: IdAction;
  nom: string;
  famille: Famille;
  cout: number; // coût en endurance
  points: number; // points marqués si l'action réussit (0 si aucun)
}

export type Nation = 'usa' | 'russie' | 'europe' | 'afrique' | 'japon';
export type Rarete = 'commune' | 'rare' | 'epique' | 'legendaire';

export interface DefLutteur {
  id: string;
  nom: string; // nom fictif du personnage
  origine: string; // nom affiché de la nation
  nation: Nation; // sert aux noms locaux des actions
  style: string; // style de jeu, en clair
  rarete: Rarete; // fixée d'après les simulations (taux de victoire)
  enduranceMax: number; // 0 à 100
  force: number; // 10 à 250
  recuperation: number; // part de l'endurance max récupérée entre deux périodes (0,35 = 35 %)
  actions: IdAction[]; // les 4 actions de la carte
  familleSpeciale: Famille; // famille de l'action spéciale
}

export interface Choix {
  action: IdAction | 'lutte';
  speciale?: boolean;
}

export type Face = 'pile' | 'face';
export type Joueur = 0 | 1;

export interface EtatLutteur {
  def: DefLutteur;
  endurance: number;
  score: number; // points de la période en cours
  prises: number[]; // valeur de chaque prise marquée dans la période
  periodesGagnees: number;
  bonusFeinte: boolean; // +2 sur l'attaque de ce tour (feinte réussie au tour précédent)
  malusPrecisionTours: number; // tours restants avec -5 % de précision sur les attaques (matraquage)
  toursSansAttaque: number; // compteur pour la pénalité de passivité
  historique: { reussie: boolean; attaque: boolean }[]; // 3 derniers tours, pour le combo
  toursSansEndurance: number;
  dernierSpecialTour: number | null; // numéro de tour global de la dernière action spéciale
  reductionSpeciale: boolean; // prochaine action spéciale moins chère (non cumulable)
  initiative: boolean; // peut voir 2 actions adverses et changer la sienne ce tour
}

export interface EtatCombat {
  joueurs: [EtatLutteur, EtatLutteur];
  periode: number; // 1 à 3
  tour: number; // 1 à 10 dans la période
  tourGlobal: number; // compte tous les tours du match
  dernierMarqueur: Joueur | null; // dans la période en cours
  termine: boolean;
  vainqueur: Joueur | null;
  finPar: 'periodes' | 'tombe' | null;
  journal: string[];
}

export interface OptionsTour {
  // Quand un lutteur subit une tentative de tombé, il choisit pile ou face.
  // Sans réponse, le choix est fait au hasard.
  choisirFace?: (joueur: Joueur, etat: EtatCombat) => Face;
}
