// TOUS les chiffres du jeu sont ici. Pour rééquilibrer, on modifie ce fichier,
// sans toucher aux règles.

import type { DefAction, DefLutteur, DefNation, Famille, IdAction, Nation, NiveauCarte, Rarete } from './types';

// Coût de base en endurance de chaque action (avant fusion et étoiles).
// Depuis le 25/11/2026 (2e version) : le coût suit la puissance. Attaque à 1 point : 3 ; à 2 points : 4 ;
// à 4 points : 6 ; à 5 points : 8. Défense 3 (Sprawl 4), contre 6, feinte 3 (Matraquage 4).
export const ACTIONS: Record<IdAction, DefAction> = {
  attaque_base: { id: 'attaque_base', nom: 'Attaque', famille: 'attaque', cout: 4, points: 2 },
  simple_jambe: { id: 'simple_jambe', nom: 'Simple jambe', famille: 'attaque', cout: 4, points: 2 },
  double_jambe: { id: 'double_jambe', nom: 'Double jambe', famille: 'attaque', cout: 6, points: 4 },
  ceinture_arriere: { id: 'ceinture_arriere', nom: 'Ceinture arrière', famille: 'attaque', cout: 6, points: 4 },
  bras_roule: { id: 'bras_roule', nom: 'Bras roulé', famille: 'attaque', cout: 6, points: 4 },
  grande_projection: { id: 'grande_projection', nom: 'Grande projection', famille: 'attaque', cout: 8, points: 5 },
  german_suplex: { id: 'german_suplex', nom: 'German suplex', famille: 'attaque', cout: 8, points: 5 },
  defense: { id: 'defense', nom: 'Défense', famille: 'defense', cout: 3, points: 0 },
  parade: { id: 'parade', nom: 'Parade', famille: 'defense', cout: 3, points: 0 },
  esquive: { id: 'esquive', nom: 'Esquive', famille: 'defense', cout: 3, points: 0 },
  sprawl: { id: 'sprawl', nom: 'Sprawl', famille: 'defense', cout: 4, points: 2 },
  contre: { id: 'contre', nom: 'Contre', famille: 'contre', cout: 6, points: 0 },
  relance: { id: 'relance', nom: 'Relance', famille: 'contre', cout: 6, points: 0 },
  feinte: { id: 'feinte', nom: 'Feinte', famille: 'feinte', cout: 3, points: 0 },
  matraquage: { id: 'matraquage', nom: 'Matraquage', famille: 'feinte', cout: 4, points: 0 },
  // Nouvelles actions (25/11/2026). Toujours les ajouter À LA FIN : le combat en ligne code les
  // actions par leur rang dans cette liste.
  bras_tire: { id: 'bras_tire', nom: 'Bras tiré', famille: 'attaque', cout: 4, points: 2 },
  sortie_zone: { id: 'sortie_zone', nom: 'Sortie de zone', famille: 'attaque', cout: 3, points: 1 },
  cravate: { id: 'cravate', nom: 'Cravate', famille: 'contre', cout: 6, points: 0 },
  tour_hanche: { id: 'tour_hanche', nom: 'Tour de hanche', famille: 'attaque', cout: 6, points: 4 },
  changement_niveau: { id: 'changement_niveau', nom: 'Changement de niveau', famille: 'feinte', cout: 3, points: 0 },
};

// L'action de Champion de chaque Champion du Monde de naissance, en plus de ses 8 actions.
export const ACTION_CHAMPION: Record<string, IdAction> = {
  'champion-usa': 'changement_niveau',
  'champion-russie': 'sortie_zone',
  'champion-japon': 'bras_tire',
  'champion-iran': 'cravate',
  'champion-georgie': 'tour_hanche',
  'champion-azerbaidjan': 'bras_tire',
  'champion-turquie': 'tour_hanche',
  'champion-ouzbekistan': 'cravate',
  'champion-kazakhstan': 'sortie_zone',
  'champion-kirghizistan': 'changement_niveau',
  'champion-afrique': 'sortie_zone',
  'champion-europe': 'cravate',
};

// Les nations du jeu. Pour en ajouter une : une ligne ici, ses lutteurs dans LIGNES ci-dessous,
// et (facultatif) ses couleurs et son drapeau dans page/portrait.ts. Les modes de jeu s'adaptent seuls.
export const NATIONS: DefNation[] = [
  { id: 'usa', nom: 'USA', ordreArene: 8 },
  { id: 'russie', nom: 'Russie', ordreArene: 9 },
  { id: 'japon', nom: 'Japon', ordreArene: 12 },
  { id: 'iran', nom: 'Iran', ordreArene: 4 },
  { id: 'georgie', nom: 'Géorgie', ordreArene: 5 },
  { id: 'azerbaidjan', nom: 'Azerbaïdjan', ordreArene: 10 },
  { id: 'turquie', nom: 'Turquie', ordreArene: 6 },
  { id: 'ouzbekistan', nom: 'Ouzbékistan', ordreArene: 2 },
  { id: 'kazakhstan', nom: 'Kazakhstan', ordreArene: 11 },
  { id: 'kirghizistan', nom: 'Kirghizistan', ordreArene: 3 },
  { id: 'afrique', nom: 'Afrique', ordreArene: 1 },
  { id: 'europe', nom: 'Europe', ordreArene: 7 },
];

// 120 lutteurs : 12 nations × 10 (4 communes, 3 rares, 2 épiques, 1 légendaire), 3 styles de jeu par
// nation répartis à chaque rareté. Noms fictifs et provisoires.
// Une ligne : identifiant, nom, origine, nation, style, endurance, force, récupération, rareté,
// famille spéciale, 4 actions de base (le deck par défaut), 4 déblocages (dans l'ordre des niveaux
// de rareté, chacun coûte 1 de moins que sa famille), carte débloquée dès le départ.
// Rareté = rang dans sa nation selon le taux de victoire moyen de deux simulations (ordinateur au
// hasard et ordinateur fort, des deux côtés, contre des adversaires tirés parmi les 120) ;
// fourchettes : légendaire 57,5 à 62,5 %, épique 52,5 à 57,5 %, rare 47,5 à 52,5 %, commune 42,5 à 47,5 %.
// Vérification : npm run simuler.
type Ligne = [string, string, string, Nation, string, number, number, number, Rarete, Famille, string, string, boolean];
const LIGNES: Ligne[] = [
  // ----- USA -----
  ['usa', 'Tanner Briggs', 'USA', 'usa', 'Lutteur de pression, très physique', 67, 150, 0.31, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', false],
  ['usa-7', 'Tucker Holloway', 'USA', 'usa', 'Lutteur de pression, très physique', 64, 165, 0.31, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['usa-6', 'Jace Dunbar', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 54, 145, 0.42, 'epique', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['usa-9', 'Wyatt Pruitt', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 57, 145, 0.36, 'rare', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['usa-5', 'Cade Whitaker', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 50, 200, 0.42, 'rare', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', false],
  ['usa-4', 'Garrett Kessler', 'USA', 'usa', 'Lutteur de pression, très physique', 65, 160, 0.29, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', true],
  ['usa-defenseur', 'Duke Halvorsen', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 53, 140, 0.39, 'commune', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', true],
  ['usa-explosif', 'Colt Ramsey', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 49, 200, 0.4, 'commune', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', true],
  ['usa-8', 'Mason Sawyer', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 51, 195, 0.4, 'commune', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive matraquage relance', true],
  ['usa-10', 'Brody Mercer', 'USA', 'usa', 'Lutteur de pression, très physique', 61, 160, 0.3, 'commune', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', true],
  // ----- Russie -----
  ['russie-pression', 'Rustam Kazbekov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 68, 175, 0.29, 'legendaire', 'attaque', 'double_jambe matraquage sprawl relance', 'ceinture_arriere defense grande_projection feinte', false],
  ['russie-5', 'Ilya Belov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 66, 160, 0.32, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'feinte simple_jambe defense ceinture_arriere', false],
  ['russie-8', 'Sergueï Teplov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 63, 160, 0.32, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', false],
  ['russie-contre', 'Pavel Zorine', 'Russie', 'russie', 'Contre-attaquant patient', 51, 145, 0.48, 'rare', 'contre', 'attaque_base esquive contre feinte', 'parade relance simple_jambe matraquage', false],
  ['russie-6', 'Dmitri Gromov', 'Russie', 'russie', 'Contre-attaquant patient', 50, 145, 0.5, 'rare', 'contre', 'attaque_base esquive contre feinte', 'parade relance simple_jambe matraquage', false],
  ['russie-4', 'Timur Kostine', 'Russie', 'russie', 'Technicien précis', 55, 170, 0.4, 'rare', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie', 'Mikhaïl Orlov', 'Russie', 'russie', 'Technicien précis', 56, 170, 0.35, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie-9', 'Artyom Sorokine', 'Russie', 'russie', 'Contre-attaquant patient', 48, 145, 0.5, 'commune', 'contre', 'attaque_base esquive contre feinte', 'parade simple_jambe relance matraquage', true],
  ['russie-7', 'Ruslan Vlassov', 'Russie', 'russie', 'Technicien précis', 54, 170, 0.41, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie-10', 'Nikita Panine', 'Russie', 'russie', 'Technicien précis', 56, 165, 0.36, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  // ----- Japon -----
  ['japon-5', 'Sōta Sugawara', 'Japon', 'japon', 'Technicien, ceinture et relances', 53, 165, 0.54, 'legendaire', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', false],
  ['japon-8', 'Hayato Kurokawa', 'Japon', 'japon', 'Technicien, ceinture et relances', 51, 165, 0.53, 'epique', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe matraquage esquive', false],
  ['japon-contre', 'Daichi Morikawa', 'Japon', 'japon', 'Contre-attaquant insaisissable', 51, 140, 0.48, 'epique', 'contre', 'attaque_base esquive contre matraquage', 'relance parade feinte simple_jambe', false],
  ['japon-4', 'Riku Okabe', 'Japon', 'japon', 'Rapide et explosif', 43, 180, 0.65, 'rare', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance parade attaque_base', false],
  ['japon-6', 'Haruto Hanazawa', 'Japon', 'japon', 'Contre-attaquant insaisissable', 50, 145, 0.49, 'rare', 'contre', 'attaque_base esquive contre feinte', 'parade relance simple_jambe matraquage', false],
  ['japon-technicien', 'Ryō Takamine', 'Japon', 'japon', 'Technicien, ceinture et relances', 48, 160, 0.55, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', true],
  ['japon-10', 'Ren Minegishi', 'Japon', 'japon', 'Rapide et explosif', 42, 210, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  ['japon-7', 'Yūto Tsukada', 'Japon', 'japon', 'Rapide et explosif', 42, 215, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage attaque_base relance parade', true],
  ['japon-9', 'Kaito Shimura', 'Japon', 'japon', 'Contre-attaquant insaisissable', 48, 140, 0.5, 'commune', 'contre', 'attaque_base esquive contre feinte', 'parade relance matraquage simple_jambe', true],
  ['japon', 'Kenji Arata', 'Japon', 'japon', 'Rapide et explosif', 41, 210, 0.64, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  // ----- Iran -----
  ['iran-2', 'Kian Jafarzadeh', 'Iran', 'iran', 'Lutteur de pression, très physique', 67, 160, 0.31, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['iran-10', 'Navid Tavakolian', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 59, 240, 0.44, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['iran-1', 'Arash Moradian', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 59, 240, 0.45, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['iran-5', 'Omid Rahbari', 'Iran', 'iran', 'Lutteur de pression, très physique', 64, 155, 0.32, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', false],
  ['iran-8', 'Behnam Nourbakhsh', 'Iran', 'iran', 'Lutteur de pression, très physique', 64, 165, 0.28, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['iran-7', 'Saeed Sadeghpour', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 56, 230, 0.45, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  ['iran-9', 'Mehdi Ebrahimian', 'Iran', 'iran', 'Technicien précis', 55, 170, 0.38, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['iran-3', 'Farid Golzari', 'Iran', 'iran', 'Technicien précis', 57, 170, 0.36, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['iran-4', 'Pouya Karimpour', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 57, 235, 0.41, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', true],
  ['iran-6', 'Reza Farahmand', 'Iran', 'iran', 'Technicien précis', 56, 170, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', true],
  // ----- Géorgie -----
  ['georgie-2', 'Beka Tsiklauri', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 62, 240, 0.42, 'legendaire', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['georgie-5', 'Davit Kvirikashvili', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 58, 235, 0.46, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', false],
  ['georgie-1', 'Zurab Gvaramadze', 'Géorgie', 'georgie', 'Puissant et athlétique', 72, 215, 0.49, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['georgie-8', 'Tornike Javakhidze', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 58, 240, 0.42, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'sprawl grande_projection ceinture_arriere relance', false],
  ['georgie-9', 'Levan Nadiradze', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 49, 155, 0.55, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre esquive simple_jambe matraquage', false],
  ['georgie-6', 'Luka Lomidze', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 48, 160, 0.54, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre esquive simple_jambe matraquage', true],
  ['georgie-3', 'Sandro Chkhartishvili', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 47, 160, 0.54, 'commune', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', true],
  ['georgie-10', 'Lasha Mchedlishvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 67, 235, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'feinte double_jambe defense german_suplex', true],
  ['georgie-7', 'Irakli Gelashvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 67, 240, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte german_suplex defense', true],
  ['georgie-4', 'Nika Beridzeshvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 66, 230, 0.51, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'feinte double_jambe defense german_suplex', true],
  // ----- Azerbaïdjan -----
  ['azerbaidjan-1', 'Rashad Abbasli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 55, 195, 0.43, 'legendaire', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', false],
  ['azerbaidjan-10', 'Murad Ismayilzade', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 54, 190, 0.41, 'epique', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive matraquage relance', false],
  ['azerbaidjan-4', 'Elvin Hasanli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 53, 195, 0.39, 'epique', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', false],
  ['azerbaidjan-9', 'Nijat Safarli', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 48, 165, 0.45, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['azerbaidjan-6', 'Vugar Babayli', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 52, 165, 0.4, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade relance matraquage', false],
  ['azerbaidjan-3', 'Emil Gurbanov', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 49, 165, 0.44, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['azerbaidjan-2', 'Orkhan Novruzov', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 51, 150, 0.47, 'commune', 'contre', 'attaque_base esquive contre feinte', 'parade simple_jambe relance matraquage', true],
  ['azerbaidjan-7', 'Ramil Huseynli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 51, 200, 0.39, 'commune', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', true],
  ['azerbaidjan-5', 'Tural Rzayev', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 48, 150, 0.5, 'commune', 'contre', 'attaque_base esquive contre feinte', 'parade relance simple_jambe matraquage', true],
  ['azerbaidjan-8', 'Farid Mammadli', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 50, 150, 0.49, 'commune', 'contre', 'attaque_base esquive contre feinte', 'relance parade simple_jambe matraquage', true],
  // ----- Turquie -----
  ['turquie-1', 'Yusuf Doğancı', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 64, 160, 0.34, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', false],
  ['turquie-3', 'Hakan Arslanoğlu', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 53, 165, 0.43, 'epique', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre esquive bras_roule matraquage', false],
  ['turquie-4', 'Burak Öztürkmen', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 66, 155, 0.3, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'feinte simple_jambe defense ceinture_arriere', false],
  ['turquie-10', 'Ahmet Çelikkol', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 62, 160, 0.32, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['turquie-5', 'Furkan Demirtaş', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 62, 155, 0.35, 'rare', 'defense', 'bras_roule sprawl contre feinte', 'parade relance defense matraquage', false],
  ['turquie-6', 'Emre Aydınoğlu', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 49, 165, 0.44, 'rare', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre esquive matraquage bras_roule', true],
  ['turquie-7', 'Mert Karaca', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 62, 155, 0.31, 'commune', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', true],
  ['turquie-9', 'Kaan Kılıçarslan', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 48, 155, 0.46, 'commune', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre esquive bras_roule matraquage', true],
  ['turquie-2', 'Oğuz Yıldırımlı', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 61, 155, 0.35, 'commune', 'defense', 'bras_roule sprawl contre feinte', 'parade defense relance matraquage', true],
  ['turquie-8', 'Serkan Koçak', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 60, 160, 0.38, 'commune', 'defense', 'bras_roule sprawl contre feinte', 'parade defense matraquage relance', true],
  // ----- Ouzbékistan -----
  ['ouzbekistan-3', 'Jasur Karimjonov', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 66, 180, 0.49, 'legendaire', 'feinte', 'simple_jambe feinte esquive bras_roule', 'relance double_jambe matraquage sprawl', false],
  ['ouzbekistan-6', 'Farrukh Yusupjonov', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 60, 185, 0.52, 'epique', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['ouzbekistan-1', 'Akmal Tursunboyev', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 71, 235, 0.5, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['ouzbekistan-7', 'Sardor Sobirjonov', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 68, 235, 0.5, 'rare', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', false],
  ['ouzbekistan-2', 'Bekzod Kholmatov', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 58, 165, 0.36, 'rare', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', false],
  ['ouzbekistan-10', 'Ulugbek Nazarbekov', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 68, 240, 0.5, 'rare', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', true],
  ['ouzbekistan-9', 'Sanjar Usmonaliyev', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 56, 175, 0.49, 'commune', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', true],
  ['ouzbekistan-4', 'Dilshod Ergashboyev', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 68, 230, 0.49, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', true],
  ['ouzbekistan-5', 'Otabek Rakhmonov', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 55, 170, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'relance bras_roule esquive simple_jambe', true],
  ['ouzbekistan-8', 'Sherzod Mirzayev', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 56, 165, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', true],
  // ----- Kazakhstan -----
  ['kazakhstan-2', 'Aidos Ermekov', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 58, 140, 0.4, 'legendaire', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['kazakhstan-3', 'Dias Saparuly', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 52, 195, 0.41, 'epique', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', false],
  ['kazakhstan-5', 'Askar Abenov', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 55, 150, 0.42, 'epique', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['kazakhstan-1', 'Arman Zhaksybekov', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 59, 230, 0.41, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'sprawl grande_projection ceinture_arriere relance', false],
  ['kazakhstan-4', 'Yerlan Seitkali', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 55, 230, 0.46, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['kazakhstan-6', 'Daulet Omarbekov', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 51, 195, 0.4, 'rare', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', true],
  ['kazakhstan-7', 'Timur Beisenuly', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 55, 240, 0.45, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', true],
  ['kazakhstan-9', 'Nurlan Nurmukhan', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 49, 195, 0.41, 'commune', 'attaque', 'simple_jambe attaque_base feinte sprawl', 'double_jambe esquive relance matraquage', true],
  ['kazakhstan-8', 'Galym Kenzhebek', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 53, 145, 0.38, 'commune', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', true],
  ['kazakhstan-10', 'Bauyrzhan Tokhtarbayev', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 55, 235, 0.45, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  // ----- Kirghizistan -----
  ['kirghizistan-1', 'Kanat Bekturov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 46, 215, 0.65, 'legendaire', 'feinte', 'simple_jambe feinte esquive contre', 'relance matraquage attaque_base parade', false],
  ['kirghizistan-5', 'Aibek Osmonbekov', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 53, 165, 0.4, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['kirghizistan-8', 'Azamat Asanaliev', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 51, 165, 0.44, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade relance matraquage', false],
  ['kirghizistan-4', 'Erlan Isakbekov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 44, 180, 0.61, 'rare', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', false],
  ['kirghizistan-6', 'Ruslan Jumabaev', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 64, 150, 0.35, 'rare', 'defense', 'bras_roule sprawl contre feinte', 'parade defense relance matraquage', false],
  ['kirghizistan-2', 'Ulan Mamytov', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 52, 165, 0.42, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['kirghizistan-9', 'Talant Usenaliev', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 61, 150, 0.35, 'commune', 'defense', 'bras_roule sprawl contre feinte', 'parade defense relance matraquage', true],
  ['kirghizistan-7', 'Nursultan Toktogulov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 41, 210, 0.64, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  ['kirghizistan-3', 'Bakyt Sadykbekov', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 57, 155, 0.39, 'commune', 'defense', 'bras_roule sprawl contre feinte', 'parade defense matraquage relance', true],
  ['kirghizistan-10', 'Adilet Abdyldaev', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 43, 210, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  // ----- Afrique -----
  ['afrique-4', 'Babacar Mensah', 'Sénégal', 'afrique', 'Puissant et athlétique', 71, 240, 0.5, 'legendaire', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte german_suplex defense', false],
  ['afrique', 'Lamine Sarr', 'Afrique', 'afrique', 'Puissant et athlétique', 68, 240, 0.53, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['afrique-explosif', 'Ibou Ndiaye', 'Afrique', 'afrique', 'Explosif, feintes et bras roulés', 60, 180, 0.51, 'epique', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['afrique-5', 'Serge Diallo', 'Ghana', 'afrique', 'Explosif, feintes et bras roulés', 56, 175, 0.52, 'rare', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['afrique-defenseur', 'Cheikh Faye', 'Afrique', 'afrique', 'Défenseur, immense réserve d\'énergie', 62, 155, 0.37, 'rare', 'defense', 'bras_roule sprawl contre feinte', 'parade defense relance matraquage', false],
  ['afrique-9', 'Ousmane Kane', 'Sénégal', 'afrique', 'Défenseur, immense réserve d\'énergie', 63, 155, 0.36, 'rare', 'defense', 'bras_roule sprawl contre feinte', 'parade relance defense matraquage', true],
  ['afrique-8', 'Moussa Ba', 'Cameroun', 'afrique', 'Explosif, feintes et bras roulés', 51, 185, 0.53, 'commune', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe matraquage relance sprawl', true],
  ['afrique-10', 'Kwame Ekotto', 'Côte d\'Ivoire', 'afrique', 'Puissant et athlétique', 66, 240, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', true],
  ['afrique-6', 'Tunde Adeyemi', 'Nigeria', 'afrique', 'Défenseur, immense réserve d\'énergie', 61, 155, 0.35, 'commune', 'defense', 'bras_roule sprawl contre feinte', 'parade defense relance matraquage', true],
  ['afrique-7', 'Amadou Ndour', 'Sénégal', 'afrique', 'Puissant et athlétique', 67, 240, 0.49, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', true],
  // ----- Europe -----
  ['europe-technicien', 'Lucas Ferrand', 'Europe', 'europe', 'Technicien, feintes et ceintures', 57, 160, 0.43, 'legendaire', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre esquive bras_roule matraquage', false],
  ['europe-puissant', 'Théo Marchal', 'Europe', 'europe', 'Poids lourd, suplex dévastateur', 59, 240, 0.43, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['europe-4', 'Lukas Weber', 'France', 'europe', 'Équilibré, solide partout', 53, 160, 0.43, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['europe', 'Hugo Delmas', 'Europe', 'europe', 'Équilibré, solide partout', 51, 165, 0.42, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['europe-6', 'Victor Schmid', 'Italie', 'europe', 'Poids lourd, suplex dévastateur', 58, 230, 0.43, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['europe-5', 'Bastien Ricci', 'Allemagne', 'europe', 'Technicien, feintes et ceintures', 49, 165, 0.44, 'rare', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre esquive matraquage bras_roule', true],
  ['europe-8', 'Matteo Morel', 'Suisse', 'europe', 'Technicien, feintes et ceintures', 49, 160, 0.42, 'commune', 'feinte', 'simple_jambe attaque_base parade feinte', 'contre bras_roule esquive matraquage', true],
  ['europe-9', 'Jonas Lambert', 'France', 'europe', 'Poids lourd, suplex dévastateur', 55, 230, 0.43, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  ['europe-10', 'Antoine Lemaire', 'Belgique', 'europe', 'Équilibré, solide partout', 52, 165, 0.4, 'commune', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['europe-7', 'Pierre Girard', 'France', 'europe', 'Équilibré, solide partout', 50, 170, 0.4, 'commune', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
];

// Action de Champion : chaque carte qui devient Champion du Monde par fusion débloque une nouvelle
// action en plus de ses 8 (comme la 9e action des cartes Champion du Monde de naissance).
// Elle dépend de la rareté de départ et du style : actions simples pour les communes et les rares,
// actions fortes pour les épiques et les légendaires.
export function actionChampionPour(style: string, rarete: Rarete): IdAction {
  const st = style.toLowerCase();
  const a = (...mots: string[]) => mots.some((m) => st.includes(m));
  if (rarete === 'commune' || rarete === 'rare') {
    return a('poids lourd', 'puissant', 'pression', 'défenseur') ? 'sortie_zone' : 'bras_tire';
  }
  if (a('poids lourd', 'puissant', 'ceinture et relances')) return 'tour_hanche';
  if (a('contre-attaquant', 'défenseur', 'équilibré', 'technicien précis')) return 'cravate';
  return 'changement_niveau';
}

export const LUTTEURS: DefLutteur[] = LIGNES.map(([id, nom, origine, nation, style, enduranceMax, force, recuperation, rarete, familleSpeciale, a, d, depart]) => {
  const actions = a.split(' ') as IdAction[];
  return {
    id, nom, origine, nation, style, enduranceMax, force, recuperation, rarete, familleSpeciale, depart,
    actions, actionsPossibles: actions, deblocages: d.split(' ') as IdAction[],
    actionChampion: actionChampionPour(style, rarete),
  };
});

// 12 cartes Champion du Monde de naissance, une par nation (rareté « champion »). Verrouillées :
// jamais dans les boosters ni dans l'arène ; gagnées en fin de saison sportive ou achetées 200 $.
// Elles reprennent le style, les actions et la récupération de la légendaire de leur nation, avec
// plus d'endurance et de force (équilibrage par simulation : environ 65 % de victoires).
// [id, nom, origine, endurance, force, légendaire de référence]
const LIGNES_CHAMPIONS: [string, string, string, number, number, string][] = [
  ['champion-usa', 'Brody Callahan', 'USA', 68, 158, 'usa'],
  ['champion-russie', 'Aleksandr Voronine', 'Russie', 71, 184, 'russie-pression'],
  ['champion-japon', 'Takeru Hoshino', 'Japon', 53, 173, 'japon-5'],
  ['champion-iran', 'Kourosh Rahimzadeh', 'Iran', 68, 160, 'iran-2'],
  ['champion-georgie', 'Nodar Kvachadze', 'Géorgie', 63, 252, 'georgie-2'],
  ['champion-azerbaidjan', 'Ilkin Mammadzade', 'Azerbaïdjan', 58, 195, 'azerbaidjan-1'],
  ['champion-turquie', 'Selim Karadağ', 'Turquie', 67, 168, 'turquie-1'],
  ['champion-ouzbekistan', 'Rustamjon Toshpulatov', 'Ouzbékistan', 79, 180, 'ouzbekistan-3'],
  ['champion-kazakhstan', 'Nurbol Zhanuzakov', 'Kazakhstan', 59, 147, 'kazakhstan-2'],
  ['champion-kirghizistan', 'Bakytbek Asanov', 'Kirghizistan', 51, 226, 'kirghizistan-1'],
  ['champion-afrique', 'Mamadou Diagne', 'Sénégal', 73, 252, 'afrique-4'],
  ['champion-europe', 'Maxime Verdier', 'France', 60, 168, 'europe-technicien'],
];
export const CHAMPIONS: DefLutteur[] = LIGNES_CHAMPIONS.map(([id, nom, origine, enduranceMax, force, ref]) => {
  const l = LUTTEURS.find((x) => x.id === ref)!;
  return { ...l, id, nom, origine, enduranceMax, force, rarete: 'champion', depart: false, actions: [...l.actions], actionsPossibles: [...l.actions], deblocages: [...l.deblocages], actionChampion: ACTION_CHAMPION[id] };
});
export const estChampion = (id: string) => id.startsWith('champion-');

// Carte secrète : Darius Westrell, le mentor du mode histoire (ancien champion du monde poids lourd).
// Champion du Monde de naissance, gagnée seulement en terminant le mode histoire, avec 2 étoiles
// tirées au hasard ce jour-là. Jamais dans les boosters, l'arène, la boutique ni les fins de saison.
// Style de la légendaire des USA (lutteur de pression), plus d'endurance et de force.
export const ID_DARIUS = 'darius';
export const DARIUS: DefLutteur = (() => {
  const l = LUTTEURS.find((x) => x.id === 'usa')!;
  return {
    ...l, id: ID_DARIUS, nom: 'Darius Westrell', origine: 'USA', enduranceMax: 70, force: 165, rarete: 'champion', depart: false,
    actions: [...l.actions], actionsPossibles: [...l.actions], deblocages: [...l.deblocages], actionChampion: 'tour_hanche',
  };
})();
export const ETOILES_DARIUS = 2; // étoiles offertes avec la carte, sur 2 actions différentes

// Lutteur spécial pour les tests : Cocoach, déjà Champion du Monde, avec les meilleures statistiques
// du jeu (le maximum des 132 cartes pour chacune). Hors collection, boosters et arène ; choisissable
// seulement contre l'ordinateur, jamais en ligne.
export const ID_LUTTEUR_TEST = 'cocoach-test';
export const LUTTEUR_TEST: DefLutteur = {
  id: ID_LUTTEUR_TEST, nom: 'Cocoach (test)', origine: 'France', nation: 'europe', style: 'Champion du Monde, lutteur de test',
  enduranceMax: Math.max(...LUTTEURS.map((l) => l.enduranceMax), ...CHAMPIONS.map((l) => l.enduranceMax)),
  force: Math.max(...LUTTEURS.map((l) => l.force), ...CHAMPIONS.map((l) => l.force)),
  recuperation: Math.max(...LUTTEURS.map((l) => l.recuperation), ...CHAMPIONS.map((l) => l.recuperation)),
  rarete: 'legendaire', familleSpeciale: 'feinte',
  actions: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'],
  deblocages: ['contre', 'esquive', 'bras_roule', 'matraquage'],
  // Toutes les actions du jeu, pour tester les combos et les nouvelles actions.
  actionsPossibles: Object.keys(ACTIONS) as IdAction[],
};

// Nom affiché d'une action. Le jeu est entièrement en français : toutes les nations utilisent le
// même nom (plus tard, un choix de langue traduira tout le jeu, noms des actions compris).
export function nomLocal(_nation: string, action: IdAction): string {
  return ACTIONS[action].nom;
}

// Qui bat qui (hors cas particulier « contre contre attaque » et « même famille »).
// Le contre bat aussi l'attaque (voir duel dans combat.ts).
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

  // Précision = (100 + endurance) / 200. Chance de réussir une action : 100 % tant que l'endurance
  // est au moins `partPleine` de l'endurance max du lutteur (la moitié ; avant le 28/11/2026 : 50
  // d'endurance pour tout le monde), puis elle baisse régulièrement jusqu'à `chanceMinimale` à 0.
  precision: { partPleine: 0.5, chanceMinimale: 0.4 },

  // Feinte réussie : +2 points sur la prochaine attaque ou le prochain contre réussi, pendant 2 tours
  // (le bonus sert une seule fois ; une nouvelle feinte réussie le relance pour 2 tours).
  bonusFeinte: 2,
  toursBonusFeinte: 2,
  bonusDoubleEndurance: 2,

  feinteSurDefense: { perteEndurance: 0.1, chanceInitiative: 2 / 3 },
  matraquage: { perteEndurance: 0.05, malusPrecision: 0.05, tours: 2 },

  // Perte d'endurance de l'attaquant contré, selon la valeur de son attaque.
  desequilibre: [
    { pointsMin: 5, perte: 0.15 },
    { pointsMin: 4, perte: 0.1 },
    { pointsMin: 0, perte: 0.05 },
  ],

  recuperationDefense: { sousMoitie: 0.05, auDessus: 0.1 },

  // Identité de chaque action (25/11/2026).
  // Grosse attaque (5 points ou plus) bloquée par une défense : l'attaquant perd en plus 3 d'endurance.
  grosseAttaqueBloquee: { pointsMin: 5, perte: 3 },
  parade: { perteAttaquant: 3 }, // la Parade bloque l'attaque et fatigue l'attaquant
  esquive: { chanceInitiative: 1 / 2 }, // l'Esquive ne fait pas récupérer, mais peut donner l'initiative
  relance: { pointsSurDefense: 2, partRenvoyee: 1 / 2 }, // la Relance marque face à une défense, renvoie moitié face à une attaque
  sprawlSurDoubleJambe: 2, // points en plus quand le Sprawl stoppe une Double jambe
  simpleJambeSansMalus: true, // la Simple jambe ignore la baisse de précision du Matraquage
  brasTire: { reductionCout: 2 }, // Bras tiré réussi : l'attaque du tour suivant coûte 2 de moins
  sortieZone: { chanceContre: 1 / 2 }, // un contre (non spécial) ne prend la Sortie de zone qu'une fois sur 2
  cravate: { perteEndurance: 5 }, // Cravate réussie sur une attaque aux jambes : 5 d'endurance en moins
  attaquesAuxJambes: ['simple_jambe', 'double_jambe'] as IdAction[],

  // Combos : deux actions réussies à la suite (tour précédent puis tour actuel).
  combos: {
    passageDansLeDos: { avant: 'matraquage', apres: 'ceinture_arriere', points: 2 },
    contreTemps: { avant: 'sprawl' }, // puis n'importe quelle attaque : elle ne peut pas rater
    enchainementJambes: { avant: 'simple_jambe', apres: 'double_jambe', points: 1, reductionCout: 2 },
    esquiveContre: { avant: 'esquive', points: 2 }, // puis un contre qui prend l'attaque : +2 points
  },

  // Second souffle : une fois par combat, sous `seuil` d'endurance, l'action « Souffler » (gratuite,
  // elle ne fait rien d'autre) rend `gain` d'endurance ; si l'adversaire attaque ce tour-là, il marque
  // son attaque normalement et `penalite` point de plus.
  souffle: { seuil: 25, gain: 15, penalite: 1 },

  combo: { actions: 3, attaquesMin: 2 },
  pression: { tours: 3, points: 1 },

  // Récupération en combat : tous les 2 tours de chaque période, chaque lutteur récupère
  // part × sa récupération × sa barre d'endurance (25/11/2026 : avant, 5 % de l'endurance actuelle) ;
  // sa chance de réussite est sa précision. Exemple : barre 57, récupération 0,4 → 2,3 d'endurance.
  recuperationReguliere: { tousLesTours: 2, part: 0.1 },

  // Collection : cartes gagnées après une victoire, tirées parmi celles qu'on n'a pas encore.
  collection: {
    // Boosters : classique (3 cartes, 75 % des boosters) ou rare (5 cartes, 25 %).
    // Les cartes sont tirées parmi les 15, doublons possibles, selon le poids de leur rareté.
    boosters: { classique: { cartes: 3 }, rare: { cartes: 5 }, chanceRare: 0.25 },
    boostersParVictoire: { arene: 1, enLigne: 2 },
    // Booster de consolation (arène) : toutes les 2 défaites d'affilée.
    defaitesPourConsolation: 2,
    poidsRarete: { commune: 50, rare: 30, epique: 15, legendaire: 1, champion: 0 }, // chances relatives (légendaire : très rare ; Champion du Monde : jamais en booster)
    cartesDeDepart: 20, // tirées au hasard parmi les cartes débloquées dès le départ
    // Fragments : un double d'une nation se transforme en 1 fragment de sa légendaire ;
    // assez de fragments débloquent la légendaire (même un joueur malchanceux finit par l'avoir).
    fragmentsPourLegendaire: 10,
    // Marchand du club : offres par jour (il donne une carte contre un double de même rareté).
    offresMarchandParJour: 3,
    // Tutoriel suivi en entier : les boosters du combat d'arène suivant sont multipliés.
    multiplicateurApresTutoriel: 2,
  },

  // Économie : les médailles mesurent la progression (jamais dépensées), les $ se dépensent.
  economie: {
    medaillesParVictoire: { arene: 1, enLigne: 2 },
    medaillesParPalier: 5, // toutes les 5 médailles gagnées…
    dollarsParPalier: 10, // … +10 $
    prixBooster: { classique: 10, rare: 25 },
  },

  // Mon Club : s'ouvre à 10 médailles, puis +1 niveau toutes les 5 médailles de plus (niveau 5 au
  // maximum). Le niveau donne le nombre de places pour les lutteurs recrutés (1 place par niveau).
  // Menu principal ouvert pas à pas : étape du mode histoire (0 = étape 1) où chaque tuile apparaît.
  // Tournois à l'étape 2, Mon Club et la saison sportive à la 3, Social à la 4, Fusion à la 8.
  // Grand tutoriel : un combat express de 2 minutes (4 tours guidés, puis libre jusqu'au 6e tour).
  // enduranceEssai : lutteur d'essai et adversaire des tutoriels courts (assez pour ne rien rater pendant les
  // tours guidés) ; une partie d'essai gagnée rapporte un booster classique, une fois par tutoriel.
  tutoriel: { toursCombat: 6, enduranceEssai: 70 },

  // etapeFonction (27/11/2026) : les réglages et modes avancés apparaissent aussi à l'étape du mode
  // histoire qui les présente (0 = étape 1) : ordinateur fort (étape 9), combat entre amis (10),
  // tutoriel des combos (13), format Enchaînement (14), durée infinie (15). Tutoriels et quêtes suivent.
  menu: {
    etapeTuile: { combat: 0, collection: 0, tournois: 1, club: 2, saison: 2, social: 3, classement: 4, fusion: 7, recompenses: 0 },
    etapeFonction: { fort: 8, amis: 9, combos: 12, enchainement: 13, infini: 14, equipe: 3 },
  },

  // Classement mensuel (27/11/2026) : points de combat gagnés dans le mois (remis à zéro le 1er, heure
  // universelle). Victoire contre l'ordinateur selon son niveau (facile 1, normal 2, fort 4), +1 par
  // tombé ; victoire en ligne 6 ; tournoi gagné +10. Défaite : 0. Plafond par jour : 80 points (vérifié
  // aussi par les règles de Firebase). Fin du mois : récompense du palier atteint (Bronze, Argent, Or)
  // et bonus pour le Top 10 ; le badge s'affiche à côté du pseudo le mois suivant.
  classement: {
    points: { facile: 1, normal: 2, fort: 4, tombe: 1, enLigne: 6, tournoiGagne: 10 },
    plafondJour: 80,
    // Divisions (28/11/2026, saison classée = le mois) : elles remplacent les paliers de points. Chaque
    // division a une barre de `parDivision` ; une victoire la remplit (selon la difficulté), une défaite
    // en ligne la vide un peu (jamais sous le début de la division). Le 1er du mois, on garde sa
    // division et la barre repart de zéro. Récompense de fin de saison selon la division (si on a joué)
    // et un cadre de carte « Saison N · Division », à poser sur une carte de son choix.
    divisions: [
      { id: 'bronze', nom: 'Bronze', classiques: 1, rares: 0, carte: null },
      { id: 'argent', nom: 'Argent', classiques: 0, rares: 1, carte: null },
      { id: 'or', nom: 'Or', classiques: 0, rares: 2, carte: null },
      { id: 'platine', nom: 'Platine', classiques: 0, rares: 3, carte: null },
      { id: 'diamant', nom: 'Diamant', classiques: 0, rares: 3, carte: 'epique' },
      { id: 'maitre', nom: 'Maître', classiques: 0, rares: 3, carte: 'legendaire' },
    ] as { id: string; nom: string; classiques: number; rares: number; carte: 'epique' | 'legendaire' | null }[],
    parDivision: 100,
    gainsDivision: { facile: 10, normal: 15, fort: 25, tombe: 5, enLigne: 40, tournoiGagne: 40 },
    perteEnLigne: 15,
    premiereSaison: '2026-11', // la saison 1 (pour le nom des cadres)
    top: { places: 10, rares: 1 },
    taille: { monde: 50, pays: 500, amis: 29 }, // nombre de lignes lues (amis : 29 + soi, limite de Firebase)
  },

  // Revenir chaque jour (27/11/2026) : calendrier de 7 jours, une récompense par jour (heure du
  // téléphone). Un jour manqué ne fait rien perdre : on reprend à la case suivante. Après la 7e case,
  // le calendrier recommence. Bonus de retour : après au moins 7 jours sans jouer, 1 booster rare
  // (une fois tous les 30 jours au plus).
  quotidien: {
    calendrier: [
      { dollars: 5 }, { boosters: 1 }, { dollars: 10 }, { boosters: 1 }, { dollars: 15 }, { boosters: 1, dollars: 5 }, { boostersRares: 1 },
    ] as { dollars?: number; boosters?: number; boostersRares?: number }[],
    retour: { joursAbsence: 7, boostersRares: 1, intervalleJours: 30 },
  },

  // Parrainage (27/11/2026) : chaque joueur a son lien perso (il fait aussi entrer dans la bêta).
  // Le nouveau joueur arrivé par ce lien reçoit un booster rare de bienvenue ; le parrain reçoit
  // 1 booster rare quand son ami crée un vrai compte (Google ou e-mail), plus une carte légendaire
  // au hasard au 3e ami. Au plus 10 parrainages récompensés par joueur. Les deux deviennent amis.
  parrainage: { recompensesMax: 10, bonusLegendaireAu: 3 },

  // Mon Club : ouvre à 10 médailles, puis 1 niveau (et 1 place) toutes les 5 médailles, jusqu'au niveau 10.
  // Chaque niveau à partir du 6e donne aussi 1 booster rare. La saison sportive s'ouvre au niveau 10.
  club: { medaillesOuverture: 10, medaillesParNiveau: 5, niveauMax: 10, placesParNiveau: 1, niveauTournoiEquipe: 5,
    niveauBooster: 6, boostersRaresParNiveau: 1, niveauSaison: 10 },

  // Tournois contre l'ordinateur. +1 médaille par combat gagné, en plus des gains de fin.
  tournoi: {
    medaillesParCombatGagne: 1,
    // Tournoi individuel à double tableau (remplace la compétition à 6) : de 6 à 15 lutteurs.
    // Tableau principal (on avance tant qu'on gagne) ; une première défaite avant les 1/2 finales
    // envoie dans le tableau des perdants ; une deuxième défaite élimine.
    // 3e place : chaque perdant de 1/2 finale affronte le vainqueur du tableau des perdants du côté
    // opposé (qualification) ; les deux gagnants jouent la petite finale.
    individuel: {
      inscription: 5,
      minimum: 6, // en dessous, on complète avec des lutteurs de l'ordinateur
      maximum: 15,
      parDefaut: 8,
      medailles: { 1: 10, 2: 6, 3: 3 } as Record<number, number>,
      dollars: { 1: 15, 2: 9, 3: 5 } as Record<number, number>,
    },
    // Ancienne compétition à 6 (deux tableaux de 3, repêchage croisé) : gardée seulement pour finir
    // un tournoi déjà commencé.
    competition: {
      inscription: 5,
      medailles: { 1: 10, 2: 6, 3: 3 } as Record<number, number>,
      dollars: { 1: 15, 2: 9, 3: 5 } as Record<number, number>,
    },
    // Par équipe : 5 duels (lutteur n°1 contre n°1, etc.), la première équipe à 3 victoires gagne.
    equipe: {
      inscription: 10, duels: 5, victoiresPourGagner: 3, medailles: 10, dollars: 30,
      // Bonus de nation : selon le nombre de lutteurs de la même nation dans l'équipe, toute
      // l'équipe (même les lutteurs d'une autre nation) gagne ce pourcentage sur ses statistiques.
      bonusNation: { 3: 0.05, 4: 0.07, 5: 0.1 } as Record<number, number>,
    },
  },

  // Combat automatique : l'ordinateur joue aussi pour le joueur. Ouvert à partir du niveau de
  // compte `niveauCompteMin` ; il joue comme l'ordinateur normal à ce niveau, puis de plus en plus
  // souvent comme l'ordinateur fort, jusqu'à toujours jouer « fort » au niveau `niveauCompteFort`.
  // Au-dessus du niveau `niveauCompteFort`, contre l'ordinateur seulement, l'auto gagne environ 3 fois
  // sur 4 : il joue déjà « fort » et gagne ~80 % contre l'ordinateur normal et ~92 % contre le facile ;
  // contre le fort, son lutteur reçoit un bonus de statistiques (mesuré : +14 % ≈ 75 % de victoires).
  auto: { niveauCompteMin: 3, niveauCompteFort: 10, bonusExpert: { facile: 0, normal: 0, fort: 0.15 } as Record<'facile' | 'normal' | 'fort', number> },

  // Mode histoire : 12 étapes, chacune débloque la suivante. Boosters classiques des étapes 1 à 11 ;
  // l'étape 12 donne une carte légendaire (une que le joueur n'a pas, s'il en reste).
  histoire: {
    // Boosters de chaque étape (18). La dernière donne aussi une carte légendaire. Depuis le
    // 26/11/2026, la saison sportive est un mode à part, ouvert au niveau 10 de Mon Club.
    boosters: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 3, 2, 3, 3],
    combosTacticien: 2, // étape 13 : combos réussis dans un même combat
    nationsEtape1: 3, // victoires contre des lutteurs de 3 nations différentes
    memeNationEtape6: 3, // lutteurs d'une même nation dans Mon Club
  },

  // Quêtes journalières : récompenses par difficulté (les quêtes uniques ont la leur), bonus quand
  // les 3 quêtes du jour sont réussies, prix pour changer une quête (une fois par jour).
  quetes: {
    recompenses: {
      facile: { dollars: 5 },
      moyenne: { dollars: 10, medailles: 1 },
      difficile: { boosters: 1, medailles: 2 },
    } as Record<'facile' | 'moyenne' | 'difficile', { dollars?: number; medailles?: number; boosters?: number; boostersRares?: number; champion?: boolean }>,
    bonus: { boostersRares: 1 } as { boostersRares: number },
    prixChangement: 5,
  },

  // Saison sportive (mode histoire 2), ouverte quand le mode histoire 1 est fini : 6 paliers dans
  // l'ordre. Les compétitions sont des tournois individuels à double tableau : inscription et gains
  // habituels du tournoi individuel, plus la récompense du palier quand l'objectif est atteint.
  saison: {
    // La 1re saison finit aux Jeux Olympiques ; les suivantes aux championnats du monde, et les JO
    // reviennent toutes les 4 saisons (saisons 1, 5, 9…). Fin de saison : des cartes Champion du
    // Monde (au hasard : 5 exemplaires d'une même carte, ou 5 cartes différentes) ; deux fois avec les JO.
    joTousLes: 4,
    cartesFinSaison: 5,
    prixChampion: 200, // achat d'une carte Champion du Monde (un exemplaire) dans la boutique
    paliers: [
      { nom: 'Échanges interclub', victoires: 3, participants: 0, niveau: 'facile', placeMax: 0, boosters: 2, boostersRares: 0, legendaire: false },
      { nom: 'Championnat régional', victoires: 0, participants: 6, niveau: 'normal', placeMax: 1, boosters: 2, boostersRares: 0, legendaire: false },
      { nom: 'Championnat national', victoires: 0, participants: 15, niveau: 'normal', placeMax: 1, boosters: 3, boostersRares: 0, legendaire: false },
      { nom: 'Tournoi international', victoires: 0, participants: 30, niveau: 'mixte', placeMax: 3, boosters: 3, boostersRares: 0, legendaire: false },
      { nom: 'Championnats du monde', victoires: 0, participants: 40, niveau: 'fort', placeMax: 3, boosters: 4, boostersRares: 0, legendaire: false },
      { nom: 'Jeux Olympiques', victoires: 0, participants: 40, niveau: 'fort', placeMax: 1, boosters: 0, boostersRares: 3, legendaire: true },
    ] as { nom: string; victoires: number; participants: number; niveau: 'facile' | 'normal' | 'fort' | 'mixte'; placeMax: number; boosters: number; boostersRares: number; legendaire: boolean }[],
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
    seuilSouffle: 12, // l'ordinateur prend son second souffle sous 12 d'endurance (ou à 0)
    // Niveaux facile et normal : actions au hasard ; avec l'initiative, chance de changer d'action.
    chanceChangerInitiative: { facile: 1 / 4, normal: 1 / 2 },
    // Niveau facile : en plus du hasard, il fait parfois l'action la moins bonne (un débutant qui
    // se trompe), pour qu'un joueur débutant gagne environ 7 fois sur 10. Jamais d'action spéciale.
    facile: { chanceMaladresse: 0.45 },
    // Niveau fort : avec l'initiative, contre ton action 3 fois sur 4 ; sans l'initiative, joue
    // contre tes habitudes (les familles d'actions que tu as jouées le plus récemment).
    fort: {
      memoireHabitudes: 6, // nombre de tes dernières actions retenues
      poidsHabitude: 2, // une famille souvent jouée compte d'autant plus dans ses prévisions
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

  // Arène : l'ordinateur représente une nation à la fois (ordre : NATIONS.ordreArene). 5 adversaires
  // de plus en plus forts, la légendaire en boss ; niveau de l'ordinateur selon le rang.
  // Après une défaite, on réaffronte le même lutteur. Nation battue : 2 ou 3 boosters et 3 médailles,
  // et 1 chance sur 3 de gagner la carte du boss (qu'on peut réaffronter ensuite pour retenter).
  // Chaque victoire : +1 médaille (economie.medaillesParVictoire.arene) ; consolation inchangée.
  arene: {
    niveaux: ['facile', 'facile', 'normal', 'normal', 'fort'] as const,
    boostersParNation: [2, 3], // tirés au hasard entre ces deux nombres
    medaillesParNation: 3,
    chanceCarteBoss: 1 / 3,
  },

  // Combat rapide : une seule période ; victoire à 10 points d'écart, par tombé, ou aux points à la
  // fin de la période. Égalité : mort subite, le premier qui marque gagne (au bout de
  // `mortSubiteMax` tours sans point, on départage comme une période normale).
  rapide: { mortSubiteMax: 10 },

  // Durée infinie : fatigue croissante pour que le combat finisse (26/11/2026, 2e version).
  // - Récupération : tous les 2 tours, puis tous les 3 tours dès le tour `debutFatigue` (20),
  //   tous les 4 tours dès le tour 30… (un tour de plus tous les `palier` tours).
  // - Coût : +1 d'endurance par action dès le tour `debutSurcout` (25), puis +1 de plus tous les
  //   `palier` tours (+2 au tour 35, +3 au tour 45…). Lutte et Souffler restent gratuits.
  // - Dès le tour `debutEpuisement`, 3 tours sans pouvoir payer aucune action = épuisement (tombé).
  //   Sans cette règle, deux lutteurs à bout peuvent lutter l'un contre l'autre sans fin.
  //   Valeur fixe (le réglage par le joueur a été retiré le 26/11/2026).
  // Cocoach, le rival du mode infini : ses 4 actions à chaque niveau (grade 1 = rare … 4 = Champion
  // du Monde), le niveau de l'ordinateur qui le joue, la récompense quand il monte de niveau, et
  // le bonus de statistiques par saison (il repart de Rare à chaque nouvelle saison, +2 % à chaque fois).
  rival: {
    decks: [
      ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'],
      ['simple_jambe', 'ceinture_arriere', 'contre', 'feinte'],
      ['matraquage', 'ceinture_arriere', 'contre', 'feinte'],
      ['matraquage', 'ceinture_arriere', 'contre', 'changement_niveau'],
    ] as IdAction[][],
    ordinateur: ['normal', 'normal', 'fort', 'fort'] as ('facile' | 'normal' | 'fort')[],
    boostersRaresParMontee: 1,
    bonusParSaison: 0.02,
  },

  infini: { debutFatigue: 20, debutSurcout: 25, palier: 10, debutEpuisement: 30 },

  // Mode Enchaînement (à l'essai : combat rapide et entre amis). Chacun compose en secret une
  // séquence de `actions` actions, comparées une à une. 12 tours par période (4 séquences).
  // Rupture (25/11/2026, 2e version) :
  // - contre réussi au 1er duel : les deux séquences s'arrêtent ; l'adversaire paie quand même
  //   l'endurance de ses actions annulées (celui qui contre ne paie pas les siennes) ;
  // - Matraquage réussi au 2e duel (`chanceFeinteRupture`) : la dernière action de l'adversaire est
  //   annulée (il la paie quand même), celle du lutteur qui a matraqué se joue normalement.
  // Initiative : on voit la dernière action de l'adversaire et on peut changer sa dernière action.
  enchainement: { actions: 3, toursParPeriode: 12, rupturesContre: [1], ruptureFeinte: 2, actionRuptureFeinte: 'matraquage' as IdAction, chanceFeinteRupture: 2 / 3 },

  // Niveau de compte : +1 toutes les 15 médailles, seulement pour montrer l'expérience du joueur.
  compte: { medaillesParNiveau: 15 },

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
  const toutes = new Set([...def.actions, ...def.deblocages, ...(def.actionChampion ? [def.actionChampion] : [])]);
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
  // Les actions du deck, celles débloquées, puis les actions en plus propres à la carte (nouvelle
  // action d'un Champion du Monde, toutes les actions pour le lutteur de test).
  const base = [...def.actions, ...debloquees.filter((x) => !def.actions.includes(x))];
  // Au niveau Champion du Monde (de naissance ou par fusion) : l'action de Champion en plus.
  const champion = niveauCarte(def, g) === 'champion' && def.actionChampion && !base.includes(def.actionChampion) ? [def.actionChampion] : [];
  const avecChampion = [...base, ...champion];
  const possibles = [...avecChampion, ...def.actionsPossibles.filter((x) => !avecChampion.includes(x))];
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

// Bonus de nation d'une équipe : la nation la plus représentée et le pourcentage gagné (0 sans bonus).
export function bonusNation(ids: string[]): { nation: Nation | null; nombre: number; bonus: number } {
  const compte = new Map<Nation, number>();
  for (const id of ids) {
    const n = trouverLutteur(id).nation;
    compte.set(n, (compte.get(n) ?? 0) + 1);
  }
  let nation: Nation | null = null, nombre = 0;
  for (const [n, k] of compte) if (k > nombre) { nation = n; nombre = k; }
  const bonus = REGLES.tournoi.equipe.bonusNation[nombre] ?? 0;
  return { nation: bonus ? nation : null, nombre, bonus };
}

// Statistiques augmentées d'un pourcentage (bonus de nation), comme pour la fusion.
export function avecBonus(def: DefLutteur, bonus: number): DefLutteur {
  if (!bonus) return def;
  return {
    ...def,
    enduranceMax: Math.round(def.enduranceMax * (1 + bonus)),
    force: Math.round(def.force * (1 + bonus)),
    recuperation: Math.round(def.recuperation * (1 + bonus) * 100) / 100,
  };
}

// Nombre d'exemplaires identiques pour atteindre ce grade (l'original compris) :
// le rang du niveau visé (Rare 2, Épique 3, Légendaire 4, Champion du Monde 5).
export const exemplairesPourGrade = (def: DefLutteur, grade: number) => rangDe(def) + grade;

// Cocoach, le rival du mode infini (combat rapide, durée infinie). Il commence en carte rare et
// monte d'un niveau à chaque défaite (Épique, Légendaire, Champion du Monde), puis gagne des
// étoiles. Ce n'est pas le lutteur de test (Cocoach, id « cocoach-test »).
export const ID_RIVAL = 'cocoach-rival';
export const COCOACH_RIVAL: DefLutteur = {
  id: ID_RIVAL, nom: 'Cocoach', origine: 'France', nation: 'europe', style: 'Rival, technicien des feintes et des ceintures',
  rarete: 'rare', enduranceMax: 58, force: 168, recuperation: 0.44, familleSpeciale: 'feinte',
  actions: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'], actionsPossibles: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'],
  deblocages: ['contre', 'matraquage', 'esquive', 'bras_roule'], actionChampion: 'changement_niveau',
};

// Carte secrète : Cocoach, le rival devenu ami. Champion du Monde de naissance, avec le style, les
// actions et la récupération du rival. Gagnée à la 1re médaille d'or aux JO avec 4 étoiles tirées au
// hasard sur 4 actions différentes ; chaque nouvelle médaille d'or aux JO en donne un exemplaire de plus
// (un double pour la fusion : étoiles et styles de carte, comme les autres Champions du Monde).
// Différente du rival de la durée infinie (ID_RIVAL) et du lutteur de test (« Cocoach (test) »).
export const ID_COCOACH = 'cocoach';
export const COCOACH: DefLutteur = {
  ...COCOACH_RIVAL, id: ID_COCOACH, nom: 'Cocoach', style: 'Technicien des feintes et des ceintures', rarete: 'champion',
  enduranceMax: 59, force: 175, depart: false,
  actions: [...COCOACH_RIVAL.actions], actionsPossibles: [...COCOACH_RIVAL.actions], deblocages: [...COCOACH_RIVAL.deblocages],
};
export const ETOILES_COCOACH = 4; // étoiles offertes avec la carte, sur 4 actions différentes

// Cartes à part : jouables partout, mais jamais distribuées au hasard.
export const CARTES_SPECIALES: DefLutteur[] = [DARIUS, COCOACH];

export function trouverLutteur(id: string): DefLutteur {
  if (id === ID_RIVAL) return COCOACH_RIVAL;
  const lutteur = id === ID_LUTTEUR_TEST ? LUTTEUR_TEST : LUTTEURS.find((l) => l.id === id) ?? CHAMPIONS.find((l) => l.id === id) ?? CARTES_SPECIALES.find((l) => l.id === id);
  if (!lutteur) throw new Error(`Lutteur inconnu : ${id}`);
  return lutteur;
}
