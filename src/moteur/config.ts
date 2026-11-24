// TOUS les chiffres du jeu sont ici. Pour rééquilibrer, on modifie ce fichier,
// sans toucher aux règles.

import type { DefAction, DefLutteur, Famille, IdAction } from './types';

export const ACTIONS: Record<IdAction, DefAction> = {
  attaque_base: { id: 'attaque_base', nom: 'Attaque', famille: 'attaque', cout: 6, points: 2 },
  simple_jambe: { id: 'simple_jambe', nom: 'Simple jambe', famille: 'attaque', cout: 6, points: 2 },
  double_jambe: { id: 'double_jambe', nom: 'Double jambe', famille: 'attaque', cout: 7, points: 4 },
  ceinture_arriere: { id: 'ceinture_arriere', nom: 'Ceinture arrière', famille: 'attaque', cout: 7, points: 4 },
  bras_roule: { id: 'bras_roule', nom: 'Bras roulé', famille: 'attaque', cout: 7, points: 4 },
  grande_projection: { id: 'grande_projection', nom: 'Grande projection', famille: 'attaque', cout: 10, points: 5 },
  german_suplex: { id: 'german_suplex', nom: 'German suplex', famille: 'attaque', cout: 10, points: 5 },
  defense: { id: 'defense', nom: 'Défense', famille: 'defense', cout: 3, points: 0 },
  parade: { id: 'parade', nom: 'Parade', famille: 'defense', cout: 3, points: 0 },
  esquive: { id: 'esquive', nom: 'Esquive', famille: 'defense', cout: 3, points: 0 },
  sprawl: { id: 'sprawl', nom: 'Sprawl', famille: 'defense', cout: 4, points: 2 },
  contre: { id: 'contre', nom: 'Contre', famille: 'contre', cout: 6, points: 0 },
  relance: { id: 'relance', nom: 'Relance', famille: 'contre', cout: 6, points: 0 },
  feinte: { id: 'feinte', nom: 'Feinte', famille: 'feinte', cout: 3, points: 0 },
  matraquage: { id: 'matraquage', nom: 'Matraquage', famille: 'feinte', cout: 5, points: 0 },
};

// Budget de chaque lutteur de départ : endurance + force ÷ 5 + récupération (en %) = 165.
// Familles spéciales validées pour l'instant. Équilibrage des statistiques prévu à l'étape 4.
export const LUTTEURS: DefLutteur[] = [
  {
    id: 'usa', nom: 'USA', origine: 'USA',
    enduranceMax: 100, force: 150, recuperation: 0.35,
    actions: ['double_jambe', 'sprawl', 'matraquage', 'relance'],
    familleSpeciale: 'attaque',
  },
  {
    id: 'russie', nom: 'Russie', origine: 'Russie',
    enduranceMax: 90, force: 175, recuperation: 0.4,
    actions: ['ceinture_arriere', 'parade', 'contre', 'feinte'],
    familleSpeciale: 'contre',
  },
  {
    id: 'europe', nom: 'Europe', origine: 'Europe',
    enduranceMax: 85, force: 175, recuperation: 0.45,
    actions: ['attaque_base', 'defense', 'feinte', 'contre'],
    familleSpeciale: 'defense',
  },
  {
    id: 'afrique', nom: 'Afrique', origine: 'Afrique',
    enduranceMax: 75, force: 225, recuperation: 0.45,
    actions: ['grande_projection', 'sprawl', 'bras_roule', 'relance'],
    familleSpeciale: 'attaque',
  },
  {
    id: 'japon', nom: 'Japon', origine: 'Japon',
    enduranceMax: 70, force: 175, recuperation: 0.6,
    actions: ['simple_jambe', 'feinte', 'esquive', 'contre'],
    familleSpeciale: 'feinte',
  },
];

// Qui bat qui (hors cas particulier « contre contre attaque » et « même famille »).
export const BAT: Record<Famille, Famille[]> = {
  attaque: ['feinte'],
  defense: ['attaque'],
  contre: ['defense'],
  feinte: ['contre', 'defense'],
};

export const REGLES = {
  toursParPeriode: 10,
  periodesPourGagner: 2,
  ecartSuperiorite: 10,

  // Précision = (100 + endurance) / 200, puis chance de réussir une action.
  precision: {
    seuilPlein: 0.75, // à partir de là : 100 %
    seuilMoyen: 0.6, // de 0,6 à 0,75 : 2 chances sur 3
    chancePlein: 1,
    chanceMoyenne: 2 / 3,
    chanceFaible: 1 / 2, // entre 0,5 et 0,6
    chanceMinimale: 1 / 3, // à 0,5 ou moins
  },

  bonusFeinte: 2,
  bonusDoubleEndurance: 2,
  pointsSortie: 1,

  feinteSurDefense: { perteEndurance: 0.1, chanceInitiative: 2 / 3 },
  matraquage: { perteEndurance: 0.05, malusPrecision: 0.05, tours: 2 },

  // Perte d'endurance de l'attaquant contré, selon la valeur de son attaque.
  desequilibre: [
    { pointsMin: 5, perte: 0.15 },
    { pointsMin: 4, perte: 0.1 },
    { pointsMin: 0, perte: 0.05 },
  ],

  recuperationDefense: { sousMoitie: 0.05, auDessus: 0.1 },

  combo: { actions: 3, attaquesMin: 2 },
  pression: { tours: 3, points: 1 },

  tombe: { plusEndurance: 3 / 5, egalite: 2 / 5, moinsEndurance: 1 / 8 },

  lutte: { chance: 1 / 10, pointsMin: 1, pointsMax: 2 },
  toursSansEnduranceAvantTombe: 3,

  speciale: {
    premierTour: 2,
    toursRecharge: 3,
    coutReduit: 1.5,
    coutPlein: 2,
    periode1DernierTourReduit: 4,
    periode2SeuilEndurance: 0.75,
    periode3DernierTour: 5,
    reductionApresReussite: 0.5,
    pointsDefense: 4,
    pointsFeinte: 2,
  },
} as const;

export function trouverLutteur(id: string): DefLutteur {
  const lutteur = LUTTEURS.find((l) => l.id === id);
  if (!lutteur) throw new Error(`Lutteur inconnu : ${id}`);
  return lutteur;
}
