// Les nouveautés de chaque version, montrées une fois aux joueurs après une mise à jour.
// Pour annoncer une mise à jour : changer VERSION (et "version" dans package.json), puis ajouter
// une entrée EN HAUT de la liste, avec 3 à 5 lignes en français simple, du point de vue du joueur.

export const VERSION = '0.21.0';

export type Nouveautes = { version: string; date: string; lignes: string[] };

export const NOUVEAUTES: Nouveautes[] = [
  {
    version: '0.21.0',
    date: '2026-11-28',
    lignes: [
      'Menu : ton objectif du mode histoire passe en premier, juste sous ton nom.',
      'Nouveaux joueurs : un menu plus simple au tout début (Combat et Collection).',
    ],
  },
  {
    version: '0.20.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau : le défi du créateur ! Dans Social, défie la carte de chaque créateur dont tu as entré le code (ordinateur fort).',
      'Chaque mois, une victoire te rapporte un exemplaire de sa carte et un booster épique.',
      'La première fois, tu gagnes aussi son cadre « Créateur », à poser sur la carte de ton choix.',
    ],
  },
  {
    version: '0.19.0',
    date: '2026-11-28',
    lignes: [
      'Trois classements : 🌐 En ligne, 🤖 Ordinateur fort et 🏅 Saison sportive (Tous, Amis ou Pays).',
      'Ta division ne monte plus qu\'avec les combats en ligne : victoire +25, défaite −15. Chaque mois, tout le monde repart en Bronze.',
      'Les victoires contre l\'ordinateur fort (en jouant toi-même) et ta saison sportive comptent pour toujours.',
      'Mode histoire : une quête passée reste à réussir, avec sa récompense.',
    ],
  },
  {
    version: '0.18.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau mode histoire : 33 quêtes au lieu de 18, dans l\'ordre où tu découvres le jeu.',
      '★ Les quêtes principales te font avancer (Carrière, tournois, divisions, Mon Club, Cocoach) ; les quêtes secondaires te font découvrir chaque fonction.',
      'Plus de récompenses : $, boosters rares et épiques, et deux cartes légendaires.',
      'Tu joues seul ? Les quêtes qui demandent un ami peuvent être passées.',
      'Déjà avancé ? Tu reprends à la bonne quête, et tes menus restent ouverts.',
    ],
  },
  {
    version: '0.17.0',
    date: '2026-11-28',
    lignes: [
      'Fusions : plus une carte est commune, plus il faut d\'exemplaires. Commune → Rare : 5, Rare → Épique : 4, Épique → Légendaire : 3, Légendaire → Champion du Monde : 2.',
      'Étoiles des Champions du Monde : 2 doubles suffisent maintenant (au lieu de 5).',
      'Collection : touche une carte grisée pour la voir en entier et savoir où l\'obtenir.',
      'Histoire : la 1re étape est maintenant « Gagner un combat en Carrière ».',
    ],
  },
  {
    version: '0.16.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau : les codes créateurs ! Entre le code d\'un créateur de contenu lutte (Social, ou « Plus » → « Code créateur »).',
      'Chaque code te donne la carte Champion du Monde du créateur et un booster épique. Collectionne-les tous !',
    ],
  },
  {
    version: '0.15.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau : le booster épique ! 8 cartes, dont au moins 1 épique et 3 rares. En boutique pour 63 $.',
      'Gagne-le aussi en réussissant tes 3 quêtes du jour, en battant une nation en Carrière ou en remportant un tournoi.',
    ],
  },
  {
    version: '0.14.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau : la saison classée ! Monte de 🥉 Bronze à 👑 Maître : chaque victoire remplit ta barre de division, une défaite en ligne la fait un peu baisser.',
      'Une saison dure un mois. À la fin : des boosters selon ta division (jusqu\'à une carte légendaire en Maître) et un cadre de saison à poser sur ta carte préférée.',
      'Le 1er du mois, tu gardes ta division : seule ta barre repart de zéro.',
    ],
  },
  {
    version: '0.13.0',
    date: '2026-11-28',
    lignes: [
      'Combats plus lisibles : la case de chaque action se colore selon son résultat (réussie, ratée, combo, contrée, défendue…).',
      'Fin de période : une PAUSE annonce le score, les périodes gagnées et la meilleure prise. Fin du combat : l\'arbitre lève le bras du vainqueur !',
      'Nouvelle règle : tes actions commencent à rater sous la moitié de ton endurance max (le repère sur la barre), au lieu de 50 pour tout le monde. Les cartes ont été rééquilibrées.',
    ],
  },
  {
    version: '0.12.0',
    date: '2026-11-28',
    lignes: [
      'Grand rééquilibrage des cartes : chaque lutteur est maintenant aussi bon contre un débutant que contre un bon joueur.',
      'Défenseurs « grande réserve d\'énergie » : une Feinte à la place de l\'Attaque, un peu moins d\'endurance.',
      'Explosifs : l\'Attaque à la place de la Double jambe, qui devient leur première action débloquée. Techniciens « feintes et ceintures » et Contre-attaquants patients retouchés aussi.',
      'Si tu avais composé ton propre deck avec une action retirée, cette carte reprend son deck de départ : pense à le refaire dans la Collection.',
    ],
  },
  {
    version: '0.11.0',
    date: '2026-11-28',
    lignes: [
      'Nouveau : les notifications ! Reçois un rappel quand ta récompense du jour est prête, et les grandes nouveautés du jeu.',
      'Active-les ou coupe-les quand tu veux : « Plus » → « Notifications ».',
      'Sur iPhone, installe d\'abord le jeu sur ton écran d\'accueil pour pouvoir les recevoir.',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-11-27',
    lignes: [
      'Nouveau : la Récompense du jour ! Reviens chaque jour pour remplir ton calendrier de 7 jours : des $, des boosters, et un booster rare le 7e jour.',
      'Un jour manqué ne fait rien perdre : tu reprends où tu en étais.',
      'Absent depuis une semaine ? Darius t\'attend avec un booster rare pour ton retour.',
    ],
  },
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
