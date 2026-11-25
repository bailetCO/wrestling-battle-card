// TOUS les chiffres du jeu sont ici. Pour rééquilibrer, on modifie ce fichier,
// sans toucher aux règles.

import type { DefAction, DefLutteur, Famille, IdAction, NiveauCarte } from './types';

// Coût de base en endurance : le même pour toutes les actions d'une famille.
export const COUT_FAMILLE: Record<Famille, number> = { attaque: 6, defense: 3, contre: 6, feinte: 3 };

export const ACTIONS: Record<IdAction, DefAction> = {
  attaque_base: { id: 'attaque_base', nom: 'Attaque', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 2 },
  simple_jambe: { id: 'simple_jambe', nom: 'Simple jambe', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 2 },
  double_jambe: { id: 'double_jambe', nom: 'Double jambe', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 4 },
  ceinture_arriere: { id: 'ceinture_arriere', nom: 'Ceinture arrière', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 4 },
  bras_roule: { id: 'bras_roule', nom: 'Bras roulé', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 4 },
  grande_projection: { id: 'grande_projection', nom: 'Grande projection', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 5 },
  german_suplex: { id: 'german_suplex', nom: 'German suplex', famille: 'attaque', cout: COUT_FAMILLE.attaque, points: 5 },
  defense: { id: 'defense', nom: 'Défense', famille: 'defense', cout: COUT_FAMILLE.defense, points: 0 },
  parade: { id: 'parade', nom: 'Parade', famille: 'defense', cout: COUT_FAMILLE.defense, points: 0 },
  esquive: { id: 'esquive', nom: 'Esquive', famille: 'defense', cout: COUT_FAMILLE.defense, points: 0 },
  sprawl: { id: 'sprawl', nom: 'Sprawl', famille: 'defense', cout: COUT_FAMILLE.defense, points: 2 },
  contre: { id: 'contre', nom: 'Contre', famille: 'contre', cout: COUT_FAMILLE.contre, points: 0 },
  relance: { id: 'relance', nom: 'Relance', famille: 'contre', cout: COUT_FAMILLE.contre, points: 0 },
  feinte: { id: 'feinte', nom: 'Feinte', famille: 'feinte', cout: COUT_FAMILLE.feinte, points: 0 },
  matraquage: { id: 'matraquage', nom: 'Matraquage', famille: 'feinte', cout: COUT_FAMILLE.feinte, points: 0 },
};

// 15 lutteurs : 3 styles de jeu par nation. Noms fictifs, provisoires.
// actions : le deck par défaut (les 4 actions de base). actionsPossibles : les actions parmi
// lesquelles le joueur compose son deck de 4 (au grade 1 : les 4 de base). deblocages : les
// 4 actions débloquées aux grades 2 à 5, dans cet ordre, qui coûtent 1 de moins que leur famille.
// Stats rééquilibrées le 25/11/2026 (coûts par famille, déblocages, récupération tous les 2 tours). Rareté = classement par taux de victoire,
// moyenne de deux simulations (ordinateur au hasard et ordinateur fort, des deux côtés) :
// légendaire 55 à 60 %, épique 50 à 55 %, rare 45 à 50 %, commune 40 à 45 %.
// Vérification : npm run simuler.
const L = (d: DefLutteur): DefLutteur => d;
export const LUTTEURS: DefLutteur[] = [
  // ----- USA -----
  L({
    id: 'usa', nom: 'Tanner Briggs', origine: 'USA', nation: 'usa', style: 'Lutteur de pression, très physique',
    enduranceMax: 69, force: 150, recuperation: 0.31, rarete: 'legendaire',
    actions: ['double_jambe', 'sprawl', 'matraquage', 'relance'],
    actionsPossibles: ['double_jambe', 'sprawl', 'matraquage', 'relance'],
    deblocages: ['simple_jambe', 'feinte', 'defense', 'ceinture_arriere'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'usa-explosif', nom: 'Colt Ramsey', origine: 'USA', nation: 'usa', style: 'Explosif, enchaîne les attaques aux jambes',
    enduranceMax: 65, force: 200, recuperation: 0.4, rarete: 'rare',
    actions: ['simple_jambe', 'double_jambe', 'feinte', 'sprawl'],
    actionsPossibles: ['simple_jambe', 'double_jambe', 'feinte', 'sprawl'],
    deblocages: ['attaque_base', 'esquive', 'relance', 'matraquage'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'usa-defenseur', nom: 'Duke Halvorsen', origine: 'USA', nation: 'usa', style: 'Défenseur, un mur qui use l\'adversaire',
    enduranceMax: 69, force: 140, recuperation: 0.39, rarete: 'epique',
    actions: ['attaque_base', 'sprawl', 'contre', 'matraquage'],
    actionsPossibles: ['attaque_base', 'sprawl', 'contre', 'matraquage'],
    deblocages: ['parade', 'defense', 'double_jambe', 'relance'], familleSpeciale: 'defense',
  }),
  // ----- Russie -----
  L({
    id: 'russie', nom: 'Mikhaïl Orlov', origine: 'Russie', nation: 'russie', style: 'Technicien précis',
    enduranceMax: 68, force: 170, recuperation: 0.35, rarete: 'rare',
    actions: ['ceinture_arriere', 'parade', 'contre', 'feinte'],
    actionsPossibles: ['ceinture_arriere', 'parade', 'contre', 'feinte'],
    deblocages: ['bras_roule', 'relance', 'esquive', 'simple_jambe'], familleSpeciale: 'contre',
  }),
  L({
    id: 'russie-pression', nom: 'Rustam Kazbekov', origine: 'Russie', nation: 'russie', style: 'Lutteur de pression, infatigable',
    enduranceMax: 71, force: 175, recuperation: 0.29, rarete: 'legendaire',
    actions: ['double_jambe', 'matraquage', 'sprawl', 'relance'],
    actionsPossibles: ['double_jambe', 'matraquage', 'sprawl', 'relance'],
    deblocages: ['ceinture_arriere', 'defense', 'grande_projection', 'feinte'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'russie-contre', nom: 'Pavel Zorine', origine: 'Russie', nation: 'russie', style: 'Contre-attaquant patient',
    enduranceMax: 69, force: 145, recuperation: 0.48, rarete: 'commune',
    actions: ['attaque_base', 'esquive', 'contre', 'relance'],
    actionsPossibles: ['attaque_base', 'esquive', 'contre', 'relance'],
    deblocages: ['parade', 'feinte', 'simple_jambe', 'matraquage'], familleSpeciale: 'contre',
  }),
  // ----- Europe -----
  L({
    id: 'europe', nom: 'Hugo Delmas', origine: 'Europe', nation: 'europe', style: 'Équilibré, idéal pour débuter',
    enduranceMax: 69, force: 165, recuperation: 0.42, rarete: 'commune',
    actions: ['attaque_base', 'defense', 'feinte', 'contre'],
    actionsPossibles: ['attaque_base', 'defense', 'feinte', 'contre'],
    deblocages: ['simple_jambe', 'parade', 'matraquage', 'relance'], familleSpeciale: 'defense',
  }),
  L({
    id: 'europe-technicien', nom: 'Lucas Ferrand', origine: 'Europe', nation: 'europe', style: 'Technicien, feintes et ceintures',
    enduranceMax: 65, force: 160, recuperation: 0.43, rarete: 'rare',
    actions: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'],
    actionsPossibles: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'],
    deblocages: ['contre', 'esquive', 'bras_roule', 'matraquage'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'europe-puissant', nom: 'Théo Marchal', origine: 'Europe', nation: 'europe', style: 'Poids lourd, suplex dévastateur',
    enduranceMax: 62, force: 240, recuperation: 0.43, rarete: 'epique',
    actions: ['german_suplex', 'defense', 'matraquage', 'contre'],
    actionsPossibles: ['german_suplex', 'defense', 'matraquage', 'contre'],
    deblocages: ['grande_projection', 'sprawl', 'ceinture_arriere', 'relance'], familleSpeciale: 'attaque',
  }),
  // ----- Afrique -----
  L({
    id: 'afrique', nom: 'Lamine Sarr', origine: 'Afrique', nation: 'afrique', style: 'Puissant et athlétique',
    enduranceMax: 65, force: 240, recuperation: 0.53, rarete: 'rare',
    actions: ['grande_projection', 'sprawl', 'bras_roule', 'relance'],
    actionsPossibles: ['grande_projection', 'sprawl', 'bras_roule', 'relance'],
    deblocages: ['double_jambe', 'feinte', 'defense', 'german_suplex'], familleSpeciale: 'attaque',
  }),
  L({
    id: 'afrique-explosif', nom: 'Ibou Ndiaye', origine: 'Afrique', nation: 'afrique', style: 'Explosif, feintes et bras roulés',
    enduranceMax: 61, force: 180, recuperation: 0.51, rarete: 'commune',
    actions: ['simple_jambe', 'feinte', 'esquive', 'bras_roule'],
    actionsPossibles: ['simple_jambe', 'feinte', 'esquive', 'bras_roule'],
    deblocages: ['double_jambe', 'relance', 'matraquage', 'sprawl'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'afrique-defenseur', nom: 'Cheikh Faye', origine: 'Afrique', nation: 'afrique', style: 'Défenseur, immense réserve d\'énergie',
    enduranceMax: 72, force: 155, recuperation: 0.37, rarete: 'rare',
    actions: ['bras_roule', 'sprawl', 'contre', 'attaque_base'],
    actionsPossibles: ['bras_roule', 'sprawl', 'contre', 'attaque_base'],
    deblocages: ['parade', 'defense', 'relance', 'matraquage'], familleSpeciale: 'defense',
  }),
  // ----- Japon -----
  L({
    id: 'japon', nom: 'Kenji Arata', origine: 'Japon', nation: 'japon', style: 'Rapide et explosif',
    enduranceMax: 62, force: 210, recuperation: 0.64, rarete: 'commune',
    actions: ['simple_jambe', 'feinte', 'esquive', 'contre'],
    actionsPossibles: ['simple_jambe', 'feinte', 'esquive', 'contre'],
    deblocages: ['matraquage', 'relance', 'attaque_base', 'parade'], familleSpeciale: 'feinte',
  }),
  L({
    id: 'japon-technicien', nom: 'Ryō Takamine', origine: 'Japon', nation: 'japon', style: 'Technicien, ceinture et relances',
    enduranceMax: 62, force: 160, recuperation: 0.55, rarete: 'commune',
    actions: ['ceinture_arriere', 'feinte', 'parade', 'relance'],
    actionsPossibles: ['ceinture_arriere', 'feinte', 'parade', 'relance'],
    deblocages: ['contre', 'simple_jambe', 'esquive', 'matraquage'], familleSpeciale: 'contre',
  }),
  L({
    id: 'japon-contre', nom: 'Daichi Morikawa', origine: 'Japon', nation: 'japon', style: 'Contre-attaquant insaisissable',
    enduranceMax: 65, force: 140, recuperation: 0.48, rarete: 'epique',
    actions: ['attaque_base', 'esquive', 'contre', 'matraquage'],
    actionsPossibles: ['attaque_base', 'esquive', 'contre', 'matraquage'],
    deblocages: ['relance', 'parade', 'feinte', 'simple_jambe'], familleSpeciale: 'contre',
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

  // Récupération en combat : tous les 2 tours de chaque période, chaque lutteur récupère
  // 5 % de son endurance actuelle ; sa chance de réussite est sa précision.
  recuperationReguliere: { tousLesTours: 2, part: 0.05 },

  // Collection : cartes gagnées après une victoire, tirées parmi celles qu'on n'a pas encore.
  collection: {
    // Boosters : classique (3 cartes, 75 % des boosters) ou rare (5 cartes, 25 %).
    // Les cartes sont tirées parmi les 15, doublons possibles, selon le poids de leur rareté.
    boosters: { classique: { cartes: 3 }, rare: { cartes: 5 }, chanceRare: 0.25 },
    boostersParVictoire: { arene: 1, enLigne: 2 },
    // Booster de consolation (arène) : toutes les 2 défaites d'affilée.
    defaitesPourConsolation: 2,
    poidsRarete: { commune: 50, rare: 30, epique: 15, legendaire: 5 }, // chances relatives
    // Marchand du club : offres par jour (il donne une carte contre un double de même rareté).
    offresMarchandParJour: 3,
    // Tutoriel suivi en entier : les boosters du combat d'arène suivant sont multipliés.
    multiplicateurApresTutoriel: 2,
  },

  // Fusion : chaque fusion fait monter la carte d'un niveau de rareté, jusqu'à Champion du Monde
  // (voir NIVEAUX). Atteindre le niveau n demande n exemplaires identiques (Rare 2, Épique 3,
  // Légendaire 4, Champion du Monde 5), l'original compris ; les doubles sont consommés.
  // « grade » = nombre de niveaux gagnés + 1. Le bonus et les actions débloquées suivent le grade.
  fusion: {
    reductionDeblocage: 1, // une action débloquée coûte 1 de moins que le coût de sa famille
    doublesParEtoile: 5, // une fois Champion du Monde : 5 doubles pour une étoile (−1 au coût d'une action)
    etoilesMaxParAction: 3,
    coutMinimum: 1,
    stylesCarte: 4, // Champion du Monde : un nouveau style de carte par quart des étoiles obtenues
    bonus: [0, 0, 0.05, 0.1, 0.15, 0.25], // indice = grade (grade 1 = carte de base, +1 par niveau gagné)
  },

  // Ordinateur.
  ia: {
    // Niveau normal : avec l'initiative, chance de changer d'action (au hasard).
    chanceChangerInitiative: 1 / 2,
    // Niveau fort.
    fort: {
      chanceContrerInitiative: 3 / 4, // avec l'initiative, joue l'action qui contre la tienne
      chanceMeilleureAction: 0.9, // sinon la 2e meilleure, pour rester imprévisible
      valeurTombe: 10, // valeur d'un tombé réussi, comptée en points
      valeurFeinte: 1.5, // valeur du bonus +2 d'une feinte réussie
      valeurRecuperation: 0.6, // valeur de l'endurance récupérée par une défense réussie
      // Prix d'un point d'endurance dépensé, selon l'endurance restante.
      endurance: { seuilHaut: 60, seuilBas: 30, poidsHaut: 0.3, poidsMoyen: 0.5, poidsBas: 0.7, passerSous50: 0.8, tomberAZero: 3 },
    },
  },

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

// ---------- Decks ----------

export const TAILLE_DECK = 4;

// Un deck est valide s'il a 4 actions différentes, toutes dans la liste du lutteur,
// dont au moins une de sa famille spéciale. Renvoie la raison sinon.
export function verifierDeck(def: DefLutteur, actions: IdAction[]): string | null {
  if (actions.length !== TAILLE_DECK) return `Il faut exactement ${TAILLE_DECK} actions.`;
  if (new Set(actions).size !== actions.length) return 'Chaque action ne peut être prise qu\'une fois.';
  if (actions.some((a) => !def.actionsPossibles.includes(a))) return 'Une action ne fait pas partie de la liste de ce lutteur.';
  if (!actions.some((a) => ACTIONS[a].famille === def.familleSpeciale)) {
    return 'Il faut au moins une action de la famille de l\'action spéciale.';
  }
  return null;
}

// Copie du lutteur avec un autre deck (si le deck n'est pas valide, on garde celui par défaut).
export function avecDeck(def: DefLutteur, actions: IdAction[] | undefined): DefLutteur {
  if (!actions || verifierDeck(def, actions)) return def;
  return { ...def, actions: [...actions] };
}

// ---------- Grades ----------

// Coût d'une action pour ce lutteur (débloquée ou améliorée par des étoiles), sinon celui de sa famille.
export function coutAction(def: DefLutteur, a: IdAction): number {
  return def.couts?.[a] ?? ACTIONS[a].cout;
}

// Actions débloquées à ce grade (grade 2 : la 1re action de la liste, etc.).
// Les niveaux de carte, du plus bas au plus haut.
export const NIVEAUX: NiveauCarte[] = ['commune', 'rare', 'epique', 'legendaire', 'champion'];
const rangDe = (def: DefLutteur) => NIVEAUX.indexOf(def.rarete);

// Grade maximal d'une carte : commune 5 (4 fusions), rare 4, épique 3, légendaire 2.
export const gradeMaxDe = (def: DefLutteur) => NIVEAUX.length - rangDe(def);
const borner = (def: DefLutteur, grade: number) => Math.max(1, Math.min(gradeMaxDe(def), Math.floor(grade)));

// Niveau de rareté atteint par la carte à ce grade.
export const niveauCarte = (def: DefLutteur, grade = 1): NiveauCarte => NIVEAUX[rangDe(def) + borner(def, grade) - 1];

// Actions débloquées : le niveau atteint en fixe le nombre (Commune 0, Rare 1, Épique 2,
// Légendaire 3, Champion du Monde 4 = toutes). Une épique en a donc 2 dès le départ.
export const actionsDebloquees = (def: DefLutteur, grade: number) => def.deblocages.slice(0, rangDe(def) + borner(def, grade) - 1);

// Champion du Monde : nombre d'étoiles possibles en tout (3 par action débloquée) et
// styles de carte débloqués (un par quart des étoiles, jusqu'à 4).
export function etoilesPossibles(def: DefLutteur): number {
  const toutes = new Set([...def.actions, ...def.deblocages]);
  return toutes.size * REGLES.fusion.etoilesMaxParAction;
}
export function stylesDebloques(def: DefLutteur, grade: number, nbEtoiles: number): number {
  if (borner(def, grade) < gradeMaxDe(def)) return 0;
  const n = REGLES.fusion.stylesCarte;
  return Math.min(n, Math.floor((nbEtoiles * n) / etoilesPossibles(def)));
}

// Copie du lutteur à son grade (1 = carte de base) : statistiques augmentées, actions débloquées
// (au coût de leur famille − 1), et étoiles (−1 par étoile sur une action, coût minimum 1).
// À appliquer sur la carte de base, avant de choisir le deck.
export function avecGrade(def: DefLutteur, grade: number, etoiles: Partial<Record<IdAction, number>> = {}): DefLutteur {
  const F = REGLES.fusion;
  const g = borner(def, grade);
  const b = F.bonus[g];
  const debloquees = actionsDebloquees(def, g);
  const possibles = [...def.actions, ...debloquees.filter((x) => !def.actions.includes(x))];
  const couts: Partial<Record<IdAction, number>> = {};
  for (const x of possibles) {
    let c = ACTIONS[x].cout - (debloquees.includes(x) ? F.reductionDeblocage : 0);
    if (g === gradeMaxDe(def)) c -= Math.min(F.etoilesMaxParAction, etoiles[x] ?? 0);
    c = Math.max(F.coutMinimum, c);
    if (c !== ACTIONS[x].cout) couts[x] = c;
  }
  return {
    ...def,
    enduranceMax: Math.round(def.enduranceMax * (1 + b)),
    force: Math.round(def.force * (1 + b)),
    recuperation: Math.round(def.recuperation * (1 + b) * 100) / 100,
    actionsPossibles: possibles,
    couts,
    niveau: niveauCarte(def, g),
  };
}

// Nombre d'exemplaires identiques pour atteindre ce grade (l'original compris) :
// le rang du niveau visé (Rare 2, Épique 3, Légendaire 4, Champion du Monde 5).
export const exemplairesPourGrade = (def: DefLutteur, grade: number) => rangDe(def) + grade;

export function trouverLutteur(id: string): DefLutteur {
  const lutteur = LUTTEURS.find((l) => l.id === id);
  if (!lutteur) throw new Error(`Lutteur inconnu : ${id}`);
  return lutteur;
}
