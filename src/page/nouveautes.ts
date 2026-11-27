// Les nouveautés de chaque version, montrées une fois aux joueurs après une mise à jour.
// Pour annoncer une mise à jour : changer VERSION (et "version" dans package.json), puis ajouter
// une entrée EN HAUT de la liste, avec 3 à 5 lignes en français simple, du point de vue du joueur.

export const VERSION = '0.7.0';

export type Nouveautes = { version: string; date: string; lignes: string[] };

export const NOUVEAUTES: Nouveautes[] = [
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
