// Les nouveautés de chaque version, montrées une fois aux joueurs après une mise à jour.
// Pour annoncer une mise à jour : changer VERSION (et "version" dans package.json), puis ajouter
// une entrée EN HAUT de la liste, avec 3 à 5 lignes en français simple, du point de vue du joueur.

export const VERSION = '0.9.0';

export type Nouveautes = { version: string; date: string; lignes: string[] };

export const NOUVEAUTES: Nouveautes[] = [
  {
    version: '0.9.0',
    date: '2026-11-27',
    lignes: [
      'Le jeu a maintenant du son : prises, points, tombé, victoire, ouverture de booster et cartes rares !',
      'Sur Android, le téléphone vibre aussi quand tu marques, quand tu encaisses, au tombé et pour les cartes rares.',
      'Coupe le son d\'un geste avec le bouton 🔊 en combat, ou règle son, volume et vibrations dans « Plus » → « Son et vibrations ».',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-11-27',
    lignes: [
      'Nouveau : invite tes amis ! Bouton « Inviter un ami » dans Social, dans le Classement (onglet Amis) et sous « Plus ».',
      'Ton ami reçoit un booster rare de bienvenue, et toi un booster rare dès qu\'il crée son compte. Au 3e ami : une carte légendaire en bonus !',
      'Vous devenez amis automatiquement : mesure-toi à eux dans le classement Amis.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-11-27',
    lignes: [
      'Nouveau : le Classement du mois ! Chaque victoire rapporte des points, avec des boosters pour les paliers Bronze, Argent, Or et le Top 10.',
      'Crée ton compte (bouton « Mon compte » sous ton pseudo) : ta collection est sauvegardée en ligne et tu la retrouves sur tous tes appareils.',
      'Partage tes plus beaux moments (tombé, carte légendaire, nation battue…) avec le bouton « Partager ».',
      'Darius devient ton coach, Cocoach ton rival… et deux cartes secrètes sont à débloquer !',
      'Tutoriels guidés, menu plus simple au début, et le jeu se met maintenant à jour tout seul.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-11-26',
    lignes: [
      'Bienvenue dans la bêta de Wrestling Battle Card ! Merci de tester le jeu.',
      'Installe le jeu sur ton téléphone : bouton « Installer le jeu », sous « Plus » en bas du menu.',
      'Sauvegarde ta collection : bouton « Ma sauvegarde », sous « Plus » en bas du menu, pour la retrouver si tu changes de téléphone.',
      'Les cartes sont encore dessinées provisoirement : les illustrations arrivent bientôt.',
    ],
  },
];
