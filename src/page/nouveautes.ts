// Les nouveautés de chaque version, montrées une fois aux joueurs après une mise à jour.
// Pour annoncer une mise à jour : changer VERSION (et "version" dans package.json), puis ajouter
// une entrée EN HAUT de la liste, avec 3 à 5 lignes en français simple, du point de vue du joueur.

export const VERSION = '0.6.0';

export type Nouveautes = { version: string; date: string; lignes: string[] };

export const NOUVEAUTES: Nouveautes[] = [
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
