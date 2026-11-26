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
  | 'matraquage'
  | 'bras_tire'
  | 'sortie_zone'
  | 'cravate'
  | 'tour_hanche'
  | 'changement_niveau';

export interface DefAction {
  id: IdAction;
  nom: string;
  famille: Famille;
  cout: number; // coût en endurance
  points: number; // points marqués si l'action réussit (0 si aucun)
}

// Identifiant d'une nation (voir NATIONS dans config.ts) : on peut en ajouter sans toucher au code.
export type Nation = string;

export interface DefNation {
  id: Nation;
  nom: string;
  ordreArene: number; // ordre de passage dans l'arène (de la plus abordable à la plus forte)
}
export type Rarete = 'commune' | 'rare' | 'epique' | 'legendaire' | 'champion'; // champion : les 12 cartes Champion du Monde de naissance
// Niveau d'une carte : sa rareté de départ, puis celle qu'elle atteint par fusion.
export type NiveauCarte = Rarete | 'champion';

export interface DefLutteur {
  id: string;
  nom: string; // nom fictif du personnage
  origine: string; // nom affiché de la nation
  nation: Nation; // sert aux noms locaux des actions
  style: string; // style de jeu, en clair
  rarete: Rarete; // rareté de départ, fixée d'après les simulations (taux de victoire)
  niveau?: NiveauCarte; // rareté atteinte par fusion (posée par avecGrade)
  depart?: boolean; // fait partie des cartes débloquées dès le départ (4 communes et 1 rare par nation)
  enduranceMax: number; // 0 à 100
  force: number; // 10 à 250
  recuperation: number; // part de l'endurance max récupérée entre deux périodes (0,35 = 35 %)
  actions: IdAction[]; // les 4 actions de la carte (le deck)
  actionsPossibles: IdAction[]; // les actions parmi lesquelles on compose le deck
  deblocages: IdAction[]; // actions débloquées aux grades 2 à 5, dans l'ordre
  couts?: Partial<Record<IdAction, number>>; // coûts propres à cette carte (grade, étoiles)
  actionChampion?: IdAction; // nouvelle action débloquée au niveau Champion du Monde
  familleSpeciale: Famille; // famille de l'action spéciale
}

// « lutte » : seule action possible à 0 d'endurance ; « souffle » : second souffle (une fois par combat).
export interface Choix {
  action: IdAction | 'lutte' | 'souffle';
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
  bonusFeinte: number; // tours restants du bonus de feinte (+2 sur la prochaine attaque ou le prochain contre réussi ; 0 = aucun)
  bonusEnchainement: boolean; // +4 si l'attaque ou le contre de ce tour réussit (feinte spéciale au tour précédent)
  malusPrecisionTours: number; // tours restants avec -5 % de précision sur les attaques (matraquage)
  toursSansAttaque: number; // compteur pour la pénalité de passivité
  historique: { reussie: boolean; attaque: boolean }[]; // 3 derniers tours, pour le combo
  toursSansEndurance: number;
  dernierSpecialTour: number | null; // numéro de tour global de la dernière action spéciale
  reductionSpeciale: boolean; // prochaine action spéciale moins chère (non cumulable)
  initiative: boolean; // peut voir 2 actions adverses et changer la sienne ce tour
  habitudes: Famille[]; // familles des dernières actions jouées (l'ordinateur fort s'en sert)
  derniereReussie: IdAction | null; // action réussie au tour précédent (combos, Bras tiré)
  attaqueIncontrable: boolean; // Changement de niveau réussi : l'attaque de ce tour ne peut pas être contrée
  souffleUtilise: boolean; // le second souffle a déjà servi dans ce combat
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
  rapide: boolean; // combat rapide : une seule période, mort subite en cas d'égalité
  mortSubite: boolean; // combat rapide à égalité après la période : le premier qui marque gagne
  enchainement?: boolean; // mode Enchaînement : séquences de 3 actions, 12 tours par période
  derniersChoix?: [Choix, Choix]; // les actions réellement jouées au dernier tour (Lutte si remplacée)
}

export interface OptionsTour {
  // Quand un lutteur subit une tentative de tombé, il choisit pile ou face.
  // Sans réponse, le choix est fait au hasard.
  choisirFace?: (joueur: Joueur, etat: EtatCombat) => Face;
  // Mode Enchaînement : les actions ont été choisies d'avance ; une action devenue impossible
  // est remplacée par Lutte au lieu d'être refusée.
  sequence?: boolean;
  // Mode Enchaînement : l'action de ce joueur est annulée (chaîne brisée par une feinte) ;
  // elle est payée mais n'a aucun effet.
  annulee?: Joueur;
}
