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

// 15 lutteurs : 3 styles de jeu par nation. Noms fictifs, provisoires.
// Budget = endurance + force ÷ 5 + récupération (en %) : de 153 à 175 selon le style.
// La rareté vient du taux de victoire en simulation (npm run simuler) :
// les 2 meilleurs légendaires, les 3 suivants épiques, puis 5 rares et 5 communes.
// Classement du 24/11/2026 (après la révision des actions spéciales) : 210 000 combats,
// ordinateur aléatoire des deux côtés.
const L = (d: DefLutteur): DefLutteur => d;
export const LUTTEURS: DefLutteur[] = [
  // ----- USA -----
  L({
    id: 'usa', nom: 'Tanner Briggs', origine: 'USA', nation: 'usa', style: 'Lutteur de pression, très physique',
    enduranceMax: 100, force: 150, recuperation: 0.35, rarete: 'epique',
    actions: ['double_jambe', 'sprawl', 'matraquage', 'relance'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'usa-explosif', nom: 'Colt Ramsey', origine: 'USA', nation: 'usa', style: 'Explosif, enchaîne les attaques aux jambes',
    enduranceMax: 80, force: 200, recuperation: 0.4, rarete: 'commune',
    actions: ['simple_jambe', 'double_jambe', 'feinte', 'sprawl'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'usa-defenseur', nom: 'Duke Halvorsen', origine: 'USA', nation: 'usa', style: 'Défenseur, un mur qui use l\'adversaire',
    enduranceMax: 95, force: 175, recuperation: 0.45, rarete: 'legendaire',
    actions: ['attaque_base', 'sprawl', 'parade', 'contre'], familleSpeciale: 'defense',
  }),
  // ----- Russie -----
  L({
    id: 'russie', nom: 'Mikhaïl Orlov', origine: 'Russie', nation: 'russie', style: 'Technicien précis',
    enduranceMax: 90, force: 175, recuperation: 0.4, rarete: 'epique',
    actions: ['ceinture_arriere', 'parade', 'contre', 'feinte'], familleSpeciale: 'contre',
  }),
  L({
    id: 'russie-pression', nom: 'Rustam Kazbekov', origine: 'Russie', nation: 'russie', style: 'Lutteur de pression, infatigable',
    enduranceMax: 95, force: 200, recuperation: 0.35, rarete: 'epique',
    actions: ['double_jambe', 'matraquage', 'sprawl', 'relance'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'russie-contre', nom: 'Pavel Zorine', origine: 'Russie', nation: 'russie', style: 'Contre-attaquant patient',
    enduranceMax: 85, force: 150, recuperation: 0.5, rarete: 'rare',
    actions: ['attaque_base', 'esquive', 'contre', 'relance'], familleSpeciale: 'contre',
  }),
  // ----- Europe -----
  L({
    id: 'europe', nom: 'Hugo Delmas', origine: 'Europe', nation: 'europe', style: 'Équilibré, idéal pour débuter',
    enduranceMax: 85, force: 175, recuperation: 0.45, rarete: 'rare',
    actions: ['attaque_base', 'defense', 'feinte', 'contre'], familleSpeciale: 'defense',
  }),
  L({
    id: 'europe-technicien', nom: 'Lucas Ferrand', origine: 'Europe', nation: 'europe', style: 'Technicien, feintes et ceintures',
    enduranceMax: 90, force: 160, recuperation: 0.45, rarete: 'rare',
    actions: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'europe-puissant', nom: 'Théo Marchal', origine: 'Europe', nation: 'europe', style: 'Poids lourd, suplex dévastateur',
    enduranceMax: 70, force: 240, recuperation: 0.35, rarete: 'commune',
    actions: ['german_suplex', 'defense', 'matraquage', 'contre'], familleSpeciale: 'attaque',
  }),
  // ----- Afrique -----
  L({
    id: 'afrique', nom: 'Lamine Sarr', origine: 'Afrique', nation: 'afrique', style: 'Puissant et athlétique',
    enduranceMax: 75, force: 225, recuperation: 0.45, rarete: 'commune',
    actions: ['grande_projection', 'sprawl', 'bras_roule', 'relance'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'afrique-explosif', nom: 'Ibou Ndiaye', origine: 'Afrique', nation: 'afrique', style: 'Explosif, feintes et bras roulés',
    enduranceMax: 80, force: 190, recuperation: 0.55, rarete: 'rare',
    actions: ['simple_jambe', 'feinte', 'esquive', 'bras_roule'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'afrique-defenseur', nom: 'Cheikh Faye', origine: 'Afrique', nation: 'afrique', style: 'Défenseur, immense réserve d\'énergie',
    enduranceMax: 100, force: 170, recuperation: 0.4, rarete: 'legendaire',
    actions: ['attaque_base', 'parade', 'sprawl', 'contre'], familleSpeciale: 'defense',
  }),
  // ----- Japon -----
  L({
    id: 'japon', nom: 'Kenji Arata', origine: 'Japon', nation: 'japon', style: 'Rapide et explosif',
    enduranceMax: 70, force: 175, recuperation: 0.6, rarete: 'commune',
    actions: ['simple_jambe', 'feinte', 'esquive', 'contre'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'japon-technicien', nom: 'Ryō Takamine', origine: 'Japon', nation: 'japon', style: 'Technicien, ceinture et relances',
    enduranceMax: 75, force: 165, recuperation: 0.55, rarete: 'commune',
    actions: ['ceinture_arriere', 'feinte', 'parade', 'relance'], familleSpeciale: 'contre',
  }),
  L({
    id: 'japon-contre', nom: 'Daichi Morikawa', origine: 'Japon', nation: 'japon', style: 'Contre-attaquant insaisissable',
    enduranceMax: 85, force: 140, recuperation: 0.5, rarete: 'rare',
    actions: ['attaque_base', 'esquive', 'contre', 'matraquage'], familleSpeciale: 'contre',
  }),
];

// Noms locaux des actions selon l'origine du lutteur (à valider par Corentin).
// La mécanique reste identique : seul le nom affiché change.
export const NOMS_LOCAUX: Record<IdAction, Record<string, string>> = {
  attaque_base: { usa: 'Basic Shot', russie: 'Ataka', japon: 'Kōgeki', afrique: 'Song', europe: 'Attaque' },
  simple_jambe: { usa: 'Single Leg', russie: 'Proxod v odnu nogu', japon: 'Kataashi takkuru', afrique: 'Benn tànk', europe: 'Simple jambe' },
  double_jambe: { usa: 'Double Leg Takedown', russie: 'Proxod', japon: 'Ryōashi takkuru', afrique: 'Ñaari tànk', europe: 'Double jambe' },
  ceinture_arriere: { usa: 'Rear Body Lock', russie: 'Obkhvat szadi', japon: 'Ushiro-dori', afrique: 'Geñ ginnaaw', europe: 'Ceinture arrière' },
  bras_roule: { usa: 'Arm Throw', russie: 'Brosok cherez spinu', japon: 'Ude-maki-nage', afrique: 'Sànni loxo', europe: 'Bras roulé' },
  grande_projection: { usa: 'Big Throw', russie: 'Brosok s amplitudoy', japon: 'Ō-nage', afrique: 'Sànni bu mag', europe: 'Grande projection' },
  german_suplex: { usa: 'German Suplex', russie: 'Progib', japon: 'Jāman suprekkusu', afrique: 'Sànni ginnaaw', europe: 'Suplex allemand' },
  defense: { usa: 'Defense', russie: 'Zashchita', japon: 'Bōgyo', afrique: 'Aar', europe: 'Défense' },
  parade: { usa: 'Block', russie: 'Blok', japon: 'Uke', afrique: 'Tëj', europe: 'Parade' },
  esquive: { usa: 'Dodge', russie: 'Ukhod', japon: 'Kawashi', afrique: 'Rëcc', europe: 'Esquive' },
  sprawl: { usa: 'Sprawl', russie: 'Otbros nog', japon: 'Supurōru', afrique: 'Tëral', europe: 'Sprawl' },
  contre: { usa: 'Counter', russie: 'Kontrpriyom', japon: 'Kaeshi-waza', afrique: 'Delloo', europe: 'Contre' },
  relance: { usa: 'Re-Shot', russie: 'Povtornaya ataka', japon: 'Sai-kōgeki', afrique: 'Dellu song', europe: 'Relance' },
  feinte: { usa: 'Fake', russie: 'Finta', japon: 'Feinto', afrique: 'Nax', europe: 'Feinte' },
  matraquage: { usa: 'Snap Down', russie: 'Sbivanie', japon: 'Hatakikomi', afrique: 'Dóor-dóor', europe: 'Matraquage' },
};

// Nom d'une action selon la nation du lutteur ; à défaut, le nom français.
export function nomLocal(nation: string, action: IdAction): string {
  return NOMS_LOCAUX[action][nation] ?? ACTIONS[action].nom;
}

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

  // Ordinateur : quand il a l'initiative, chance de changer d'action (niveau normal).
  ia: { chanceChangerInitiative: 1 / 2 },

  tombe: { plusEndurance: 3 / 5, egalite: 2 / 5, moinsEndurance: 1 / 5 },

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
    // Feinte spéciale réussie : +4 au tour suivant si l'attaque ou le contre suivant réussit.
    bonusEnchainementFeinte: 4,
  },
} as const;

export function trouverLutteur(id: string): DefLutteur {
  const lutteur = LUTTEURS.find((l) => l.id === id);
  if (!lutteur) throw new Error(`Lutteur inconnu : ${id}`);
  return lutteur;
}
