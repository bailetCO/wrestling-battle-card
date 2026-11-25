// TOUS les chiffres du jeu sont ici. Pour rééquilibrer, on modifie ce fichier,
// sans toucher aux règles.

import type { DefAction, DefLutteur, DefNation, Famille, IdAction, Nation, NiveauCarte, Rarete } from './types';

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
  ['usa', 'Tanner Briggs', 'USA', 'usa', 'Lutteur de pression, très physique', 62, 150, 0.31, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', false],
  ['usa-7', 'Tucker Holloway', 'USA', 'usa', 'Lutteur de pression, très physique', 59, 165, 0.31, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['usa-6', 'Jace Dunbar', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 60, 145, 0.42, 'epique', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['usa-9', 'Wyatt Pruitt', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 59, 145, 0.36, 'rare', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['usa-5', 'Cade Whitaker', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 57, 200, 0.42, 'rare', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', false],
  ['usa-4', 'Garrett Kessler', 'USA', 'usa', 'Lutteur de pression, très physique', 57, 160, 0.29, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', true],
  ['usa-defenseur', 'Duke Halvorsen', 'USA', 'usa', 'Défenseur, un mur qui use l\'adversaire', 57, 140, 0.39, 'commune', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', true],
  ['usa-explosif', 'Colt Ramsey', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 57, 200, 0.4, 'commune', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', true],
  ['usa-8', 'Mason Sawyer', 'USA', 'usa', 'Explosif, enchaîne les attaques aux jambes', 57, 195, 0.4, 'commune', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive matraquage relance', true],
  ['usa-10', 'Brody Mercer', 'USA', 'usa', 'Lutteur de pression, très physique', 57, 160, 0.3, 'commune', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', true],
  // ----- Russie -----
  ['russie-pression', 'Rustam Kazbekov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 61, 175, 0.29, 'legendaire', 'attaque', 'double_jambe matraquage sprawl relance', 'ceinture_arriere defense grande_projection feinte', false],
  ['russie-5', 'Ilya Belov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 59, 160, 0.32, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'feinte simple_jambe defense ceinture_arriere', false],
  ['russie-8', 'Sergueï Teplov', 'Russie', 'russie', 'Lutteur de pression, infatigable', 59, 160, 0.32, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', false],
  ['russie-contre', 'Pavel Zorine', 'Russie', 'russie', 'Contre-attaquant patient', 65, 145, 0.48, 'rare', 'contre', 'attaque_base esquive contre relance', 'parade feinte simple_jambe matraquage', false],
  ['russie-6', 'Dmitri Gromov', 'Russie', 'russie', 'Contre-attaquant patient', 64, 145, 0.5, 'rare', 'contre', 'attaque_base esquive contre relance', 'parade feinte simple_jambe matraquage', false],
  ['russie-4', 'Timur Kostine', 'Russie', 'russie', 'Technicien précis', 59, 170, 0.4, 'rare', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie', 'Mikhaïl Orlov', 'Russie', 'russie', 'Technicien précis', 60, 170, 0.35, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie-9', 'Artyom Sorokine', 'Russie', 'russie', 'Contre-attaquant patient', 63, 145, 0.5, 'commune', 'contre', 'attaque_base esquive contre relance', 'parade simple_jambe feinte matraquage', true],
  ['russie-7', 'Ruslan Vlassov', 'Russie', 'russie', 'Technicien précis', 58, 170, 0.41, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['russie-10', 'Nikita Panine', 'Russie', 'russie', 'Technicien précis', 59, 165, 0.36, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  // ----- Japon -----
  ['japon-5', 'Sōta Sugawara', 'Japon', 'japon', 'Technicien, ceinture et relances', 59, 165, 0.54, 'legendaire', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', false],
  ['japon-8', 'Hayato Kurokawa', 'Japon', 'japon', 'Technicien, ceinture et relances', 56, 165, 0.53, 'epique', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe matraquage esquive', false],
  ['japon-contre', 'Daichi Morikawa', 'Japon', 'japon', 'Contre-attaquant insaisissable', 58, 140, 0.48, 'epique', 'contre', 'attaque_base esquive contre matraquage', 'relance parade feinte simple_jambe', false],
  ['japon-4', 'Riku Okabe', 'Japon', 'japon', 'Rapide et explosif', 56, 210, 0.65, 'rare', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance parade attaque_base', false],
  ['japon-6', 'Haruto Hanazawa', 'Japon', 'japon', 'Contre-attaquant insaisissable', 64, 145, 0.49, 'rare', 'contre', 'attaque_base esquive contre relance', 'parade feinte simple_jambe matraquage', false],
  ['japon-technicien', 'Ryō Takamine', 'Japon', 'japon', 'Technicien, ceinture et relances', 55, 160, 0.55, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', true],
  ['japon-10', 'Ren Minegishi', 'Japon', 'japon', 'Rapide et explosif', 55, 210, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  ['japon-7', 'Yūto Tsukada', 'Japon', 'japon', 'Rapide et explosif', 55, 215, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage attaque_base relance parade', true],
  ['japon-9', 'Kaito Shimura', 'Japon', 'japon', 'Contre-attaquant insaisissable', 62, 140, 0.5, 'commune', 'contre', 'attaque_base esquive contre relance', 'parade feinte matraquage simple_jambe', true],
  ['japon', 'Kenji Arata', 'Japon', 'japon', 'Rapide et explosif', 55, 210, 0.64, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  // ----- Iran -----
  ['iran-2', 'Kian Jafarzadeh', 'Iran', 'iran', 'Lutteur de pression, très physique', 62, 160, 0.31, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['iran-10', 'Navid Tavakolian', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 54, 240, 0.44, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['iran-1', 'Arash Moradian', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 53, 240, 0.45, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['iran-5', 'Omid Rahbari', 'Iran', 'iran', 'Lutteur de pression, très physique', 58, 155, 0.32, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte defense ceinture_arriere', false],
  ['iran-8', 'Behnam Nourbakhsh', 'Iran', 'iran', 'Lutteur de pression, très physique', 59, 165, 0.28, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['iran-7', 'Saeed Sadeghpour', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 52, 230, 0.45, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  ['iran-9', 'Mehdi Ebrahimian', 'Iran', 'iran', 'Technicien précis', 58, 170, 0.38, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['iran-3', 'Farid Golzari', 'Iran', 'iran', 'Technicien précis', 59, 170, 0.36, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule relance esquive simple_jambe', true],
  ['iran-4', 'Pouya Karimpour', 'Iran', 'iran', 'Poids lourd, suplex dévastateur', 52, 235, 0.41, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', true],
  ['iran-6', 'Reza Farahmand', 'Iran', 'iran', 'Technicien précis', 59, 170, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', true],
  // ----- Géorgie -----
  ['georgie-2', 'Beka Tsiklauri', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 55, 240, 0.42, 'legendaire', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['georgie-5', 'Davit Kvirikashvili', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 53, 235, 0.46, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', false],
  ['georgie-1', 'Zurab Gvaramadze', 'Géorgie', 'georgie', 'Puissant et athlétique', 62, 230, 0.49, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['georgie-8', 'Tornike Javakhidze', 'Géorgie', 'georgie', 'Poids lourd, suplex dévastateur', 53, 240, 0.42, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'sprawl grande_projection ceinture_arriere relance', false],
  ['georgie-9', 'Levan Nadiradze', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 56, 155, 0.55, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre esquive simple_jambe matraquage', false],
  ['georgie-6', 'Luka Lomidze', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 55, 160, 0.54, 'rare', 'contre', 'ceinture_arriere feinte parade relance', 'contre esquive simple_jambe matraquage', true],
  ['georgie-3', 'Sandro Chkhartishvili', 'Géorgie', 'georgie', 'Technicien, ceinture et relances', 54, 160, 0.54, 'commune', 'contre', 'ceinture_arriere feinte parade relance', 'contre simple_jambe esquive matraquage', true],
  ['georgie-10', 'Lasha Mchedlishvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 60, 235, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'feinte double_jambe defense german_suplex', true],
  ['georgie-7', 'Irakli Gelashvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 58, 240, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte german_suplex defense', true],
  ['georgie-4', 'Nika Beridzeshvili', 'Géorgie', 'georgie', 'Puissant et athlétique', 58, 230, 0.51, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'feinte double_jambe defense german_suplex', true],
  // ----- Azerbaïdjan -----
  ['azerbaidjan-1', 'Rashad Abbasli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 61, 195, 0.43, 'legendaire', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', false],
  ['azerbaidjan-10', 'Murad Ismayilzade', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 61, 190, 0.41, 'epique', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive matraquage relance', false],
  ['azerbaidjan-4', 'Elvin Hasanli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 61, 195, 0.39, 'epique', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', false],
  ['azerbaidjan-9', 'Nijat Safarli', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 60, 165, 0.45, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['azerbaidjan-6', 'Vugar Babayli', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 62, 165, 0.4, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade relance matraquage', false],
  ['azerbaidjan-3', 'Emil Gurbanov', 'Azerbaïdjan', 'azerbaidjan', 'Équilibré, solide partout', 61, 165, 0.44, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['azerbaidjan-2', 'Orkhan Novruzov', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 62, 150, 0.47, 'commune', 'contre', 'attaque_base esquive contre relance', 'parade simple_jambe feinte matraquage', true],
  ['azerbaidjan-7', 'Ramil Huseynli', 'Azerbaïdjan', 'azerbaidjan', 'Explosif, enchaîne les attaques aux jambes', 57, 200, 0.39, 'commune', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', true],
  ['azerbaidjan-5', 'Tural Rzayev', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 62, 150, 0.5, 'commune', 'contre', 'attaque_base esquive contre relance', 'parade feinte simple_jambe matraquage', true],
  ['azerbaidjan-8', 'Farid Mammadli', 'Azerbaïdjan', 'azerbaidjan', 'Contre-attaquant patient', 63, 150, 0.49, 'commune', 'contre', 'attaque_base esquive contre relance', 'feinte parade simple_jambe matraquage', true],
  // ----- Turquie -----
  ['turquie-1', 'Yusuf Doğancı', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 61, 160, 0.34, 'legendaire', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', false],
  ['turquie-3', 'Hakan Arslanoğlu', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 59, 165, 0.43, 'epique', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre esquive bras_roule matraquage', false],
  ['turquie-4', 'Burak Öztürkmen', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 60, 155, 0.3, 'epique', 'attaque', 'double_jambe sprawl matraquage relance', 'feinte simple_jambe defense ceinture_arriere', false],
  ['turquie-10', 'Ahmet Çelikkol', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 57, 160, 0.32, 'rare', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe defense feinte ceinture_arriere', false],
  ['turquie-5', 'Furkan Demirtaş', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 69, 155, 0.35, 'rare', 'defense', 'bras_roule sprawl contre attaque_base', 'parade relance defense matraquage', false],
  ['turquie-6', 'Emre Aydınoğlu', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 57, 165, 0.44, 'rare', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre esquive matraquage bras_roule', true],
  ['turquie-7', 'Mert Karaca', 'Turquie', 'turquie', 'Lutteur de pression, très physique', 56, 155, 0.31, 'commune', 'attaque', 'double_jambe sprawl matraquage relance', 'simple_jambe feinte ceinture_arriere defense', true],
  ['turquie-9', 'Kaan Kılıçarslan', 'Turquie', 'turquie', 'Technicien, feintes et ceintures', 55, 155, 0.46, 'commune', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre esquive bras_roule matraquage', true],
  ['turquie-2', 'Oğuz Yıldırımlı', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 67, 155, 0.35, 'commune', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense relance matraquage', true],
  ['turquie-8', 'Serkan Koçak', 'Turquie', 'turquie', 'Défenseur, immense réserve d\'énergie', 66, 160, 0.38, 'commune', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense matraquage relance', true],
  // ----- Ouzbékistan -----
  ['ouzbekistan-3', 'Jasur Karimjonov', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 59, 180, 0.49, 'legendaire', 'feinte', 'simple_jambe feinte esquive bras_roule', 'relance double_jambe matraquage sprawl', false],
  ['ouzbekistan-6', 'Farrukh Yusupjonov', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 57, 185, 0.52, 'epique', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['ouzbekistan-1', 'Akmal Tursunboyev', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 62, 235, 0.5, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['ouzbekistan-7', 'Sardor Sobirjonov', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 59, 235, 0.5, 'rare', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', false],
  ['ouzbekistan-2', 'Bekzod Kholmatov', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 59, 165, 0.36, 'rare', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', false],
  ['ouzbekistan-10', 'Ulugbek Nazarbekov', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 59, 240, 0.5, 'rare', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', true],
  ['ouzbekistan-9', 'Sanjar Usmonaliyev', 'Ouzbékistan', 'ouzbekistan', 'Explosif, feintes et bras roulés', 55, 175, 0.49, 'commune', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', true],
  ['ouzbekistan-4', 'Dilshod Ergashboyev', 'Ouzbékistan', 'ouzbekistan', 'Puissant et athlétique', 59, 230, 0.49, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', true],
  ['ouzbekistan-5', 'Otabek Rakhmonov', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 60, 170, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'relance bras_roule esquive simple_jambe', true],
  ['ouzbekistan-8', 'Sherzod Mirzayev', 'Ouzbékistan', 'ouzbekistan', 'Technicien précis', 59, 165, 0.37, 'commune', 'contre', 'ceinture_arriere parade contre feinte', 'bras_roule esquive relance simple_jambe', true],
  // ----- Kazakhstan -----
  ['kazakhstan-2', 'Aidos Ermekov', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 62, 140, 0.4, 'legendaire', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['kazakhstan-3', 'Dias Saparuly', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 60, 195, 0.41, 'epique', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', false],
  ['kazakhstan-5', 'Askar Abenov', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 59, 150, 0.42, 'epique', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', false],
  ['kazakhstan-1', 'Arman Zhaksybekov', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 54, 230, 0.41, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'sprawl grande_projection ceinture_arriere relance', false],
  ['kazakhstan-4', 'Yerlan Seitkali', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 52, 230, 0.46, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl relance ceinture_arriere', false],
  ['kazakhstan-6', 'Daulet Omarbekov', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 59, 195, 0.4, 'rare', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', true],
  ['kazakhstan-7', 'Timur Beisenuly', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 50, 240, 0.45, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection ceinture_arriere sprawl relance', true],
  ['kazakhstan-9', 'Nurlan Nurmukhan', 'Kazakhstan', 'kazakhstan', 'Explosif, enchaîne les attaques aux jambes', 57, 195, 0.41, 'commune', 'attaque', 'simple_jambe double_jambe feinte sprawl', 'attaque_base esquive relance matraquage', true],
  ['kazakhstan-8', 'Galym Kenzhebek', 'Kazakhstan', 'kazakhstan', 'Défenseur, un mur qui use l\'adversaire', 57, 145, 0.38, 'commune', 'defense', 'attaque_base sprawl contre matraquage', 'parade defense double_jambe relance', true],
  ['kazakhstan-10', 'Bauyrzhan Tokhtarbayev', 'Kazakhstan', 'kazakhstan', 'Poids lourd, suplex dévastateur', 52, 235, 0.45, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  // ----- Kirghizistan -----
  ['kirghizistan-1', 'Kanat Bekturov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 57, 215, 0.65, 'legendaire', 'feinte', 'simple_jambe feinte esquive contre', 'relance matraquage attaque_base parade', false],
  ['kirghizistan-5', 'Aibek Osmonbekov', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 63, 165, 0.4, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['kirghizistan-8', 'Azamat Asanaliev', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 63, 165, 0.44, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade relance matraquage', false],
  ['kirghizistan-4', 'Erlan Isakbekov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 56, 215, 0.61, 'rare', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', false],
  ['kirghizistan-6', 'Ruslan Jumabaev', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 69, 150, 0.35, 'rare', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense relance matraquage', false],
  ['kirghizistan-2', 'Ulan Mamytov', 'Kirghizistan', 'kirghizistan', 'Équilibré, solide partout', 61, 165, 0.42, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['kirghizistan-9', 'Talant Usenaliev', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 67, 150, 0.35, 'commune', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense relance matraquage', true],
  ['kirghizistan-7', 'Nursultan Toktogulov', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 55, 210, 0.64, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  ['kirghizistan-3', 'Bakyt Sadykbekov', 'Kirghizistan', 'kirghizistan', 'Défenseur, immense réserve d\'énergie', 66, 155, 0.39, 'commune', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense matraquage relance', true],
  ['kirghizistan-10', 'Adilet Abdyldaev', 'Kirghizistan', 'kirghizistan', 'Rapide et explosif', 55, 210, 0.61, 'commune', 'feinte', 'simple_jambe feinte esquive contre', 'matraquage relance attaque_base parade', true],
  // ----- Afrique -----
  ['afrique-4', 'Babacar Mensah', 'Sénégal', 'afrique', 'Puissant et athlétique', 62, 240, 0.5, 'legendaire', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte german_suplex defense', false],
  ['afrique', 'Lamine Sarr', 'Afrique', 'afrique', 'Puissant et athlétique', 60, 240, 0.53, 'epique', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', false],
  ['afrique-explosif', 'Ibou Ndiaye', 'Afrique', 'afrique', 'Explosif, feintes et bras roulés', 56, 180, 0.51, 'epique', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['afrique-5', 'Serge Diallo', 'Ghana', 'afrique', 'Explosif, feintes et bras roulés', 55, 175, 0.52, 'rare', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe relance matraquage sprawl', false],
  ['afrique-defenseur', 'Cheikh Faye', 'Afrique', 'afrique', 'Défenseur, immense réserve d\'énergie', 68, 155, 0.37, 'rare', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense relance matraquage', false],
  ['afrique-9', 'Ousmane Kane', 'Sénégal', 'afrique', 'Défenseur, immense réserve d\'énergie', 68, 155, 0.36, 'rare', 'defense', 'bras_roule sprawl contre attaque_base', 'parade relance defense matraquage', true],
  ['afrique-8', 'Moussa Ba', 'Cameroun', 'afrique', 'Explosif, feintes et bras roulés', 53, 185, 0.53, 'commune', 'feinte', 'simple_jambe feinte esquive bras_roule', 'double_jambe matraquage relance sprawl', true],
  ['afrique-10', 'Kwame Ekotto', 'Côte d\'Ivoire', 'afrique', 'Puissant et athlétique', 59, 240, 0.48, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe feinte defense german_suplex', true],
  ['afrique-6', 'Tunde Adeyemi', 'Nigeria', 'afrique', 'Défenseur, immense réserve d\'énergie', 67, 155, 0.35, 'commune', 'defense', 'bras_roule sprawl contre attaque_base', 'parade defense relance matraquage', true],
  ['afrique-7', 'Amadou Ndour', 'Sénégal', 'afrique', 'Puissant et athlétique', 58, 240, 0.49, 'commune', 'attaque', 'grande_projection sprawl bras_roule relance', 'double_jambe defense feinte german_suplex', true],
  // ----- Europe -----
  ['europe-technicien', 'Lucas Ferrand', 'Europe', 'europe', 'Technicien, feintes et ceintures', 60, 160, 0.43, 'legendaire', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre esquive bras_roule matraquage', false],
  ['europe-puissant', 'Théo Marchal', 'Europe', 'europe', 'Poids lourd, suplex dévastateur', 53, 240, 0.43, 'epique', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['europe-4', 'Lukas Weber', 'France', 'europe', 'Équilibré, solide partout', 63, 160, 0.43, 'epique', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['europe', 'Hugo Delmas', 'Europe', 'europe', 'Équilibré, solide partout', 61, 165, 0.42, 'rare', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', false],
  ['europe-6', 'Victor Schmid', 'Italie', 'europe', 'Poids lourd, suplex dévastateur', 53, 230, 0.43, 'rare', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', false],
  ['europe-5', 'Bastien Ricci', 'Allemagne', 'europe', 'Technicien, feintes et ceintures', 57, 165, 0.44, 'rare', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre esquive matraquage bras_roule', true],
  ['europe-8', 'Matteo Morel', 'Suisse', 'europe', 'Technicien, feintes et ceintures', 57, 160, 0.42, 'commune', 'feinte', 'simple_jambe ceinture_arriere parade feinte', 'contre bras_roule esquive matraquage', true],
  ['europe-9', 'Jonas Lambert', 'France', 'europe', 'Poids lourd, suplex dévastateur', 52, 230, 0.43, 'commune', 'attaque', 'german_suplex defense matraquage contre', 'grande_projection sprawl ceinture_arriere relance', true],
  ['europe-10', 'Antoine Lemaire', 'Belgique', 'europe', 'Équilibré, solide partout', 60, 165, 0.4, 'commune', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
  ['europe-7', 'Pierre Girard', 'France', 'europe', 'Équilibré, solide partout', 60, 170, 0.4, 'commune', 'defense', 'attaque_base defense feinte contre', 'simple_jambe parade matraquage relance', true],
];

export const LUTTEURS: DefLutteur[] = LIGNES.map(([id, nom, origine, nation, style, enduranceMax, force, recuperation, rarete, familleSpeciale, a, d, depart]) => {
  const actions = a.split(' ') as IdAction[];
  return {
    id, nom, origine, nation, style, enduranceMax, force, recuperation, rarete, familleSpeciale, depart,
    actions, actionsPossibles: actions, deblocages: d.split(' ') as IdAction[],
  };
});

// Nom affiché d'une action. Le jeu est entièrement en français : toutes les nations utilisent le
// même nom (plus tard, un choix de langue traduira tout le jeu, noms des actions compris).
export function nomLocal(_nation: string, action: IdAction): string {
  return ACTIONS[action].nom;
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
    poidsRarete: { commune: 50, rare: 30, epique: 15, legendaire: 1 }, // chances relatives (légendaire : très rare)
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
  club: { medaillesOuverture: 10, medaillesParNiveau: 5, niveauMax: 5, placesParNiveau: 1, niveauTournoiEquipe: 5 },

  // Tournois contre l'ordinateur. +1 médaille par combat gagné, en plus des gains de fin.
  tournoi: {
    medaillesParCombatGagne: 1,
    // Tournoi individuel à double tableau (remplace la compétition à 6) : de 6 à 15 lutteurs.
    // Tableau principal (on avance tant qu'on gagne) ; une première défaite avant les 1/2 finales
    // envoie dans le tableau des perdants ; une deuxième défaite élimine.
    // 3e place : les perdants des 1/2 finales s'affrontent ; le gagnant va en petite finale ; le
    // perdant affronte le vainqueur du tableau des perdants (barrage), dont le gagnant va en petite finale.
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
  auto: { niveauCompteMin: 3, niveauCompteFort: 10 },

  // Mode histoire : 12 étapes, chacune débloque la suivante. Boosters classiques des étapes 1 à 11 ;
  // l'étape 12 donne une carte légendaire (une que le joueur n'a pas, s'il en reste).
  histoire: {
    boosters: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 0],
    nationsEtape1: 3, // victoires contre des lutteurs de 3 nations différentes
    memeNationEtape6: 3, // lutteurs d'une même nation dans Mon Club
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

export function trouverLutteur(id: string): DefLutteur {
  const lutteur = LUTTEURS.find((l) => l.id === id);
  if (!lutteur) throw new Error(`Lutteur inconnu : ${id}`);
  return lutteur;
}
