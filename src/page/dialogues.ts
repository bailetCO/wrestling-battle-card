// Petites scènes de dialogue des deux modes histoire : elles s'affichent quand une étape (ou un
// palier de la saison) se débloque, pour dire où va le joueur et quel est son objectif.
// Personnages : Philippe, le mentor (ancien champion devenu directeur technique), et Cocoach, le rival.

export type Personnage = 'philippe' | 'cocoach';

export const PERSONNAGES: Record<Personnage, { nom: string; role: string }> = {
  philippe: { nom: 'Philippe', role: 'Directeur technique, ancien champion' },
  cocoach: { nom: 'Cocoach', role: 'Coach rival' },
};

export interface Replique { qui: Personnage; texte: string }

// Clés : h0 à h14 = étapes 1 à 15 du mode histoire ; hfin = étape 12 réussie (la saison
// s'ouvre ; avant le 26/11/2026, cette scène s'appelait h12) ; s0 à s5 = paliers de la saison ; s6 = saison olympique terminée ; s4b et s6b =
// championnats du monde et fin de saison quand il n'y a pas de Jeux Olympiques.
export const SCENES: Record<string, Replique[]> = {
  h0: [
    { qui: 'philippe', texte: 'Bienvenue au club, Coach ! Moi, c\'est Philippe, directeur technique. J\'ai vu passer beaucoup de lutteurs… et encore plus de coachs.' },
    { qui: 'philippe', texte: 'Avant de rêver de titres, montre-moi que tu sais gagner : trois victoires, contre trois nations différentes.' },
    { qui: 'cocoach', texte: 'Philippe recrute n\'importe qui, maintenant ? Moi, c\'est Cocoach. Retiens bien ce nom : tu vas l\'entendre souvent.' },
  ],
  h1: [
    { qui: 'philippe', texte: 'Trois nations battues, pas mal. Mais un tournoi, c\'est autre chose : il faut enchaîner les combats sans craquer.' },
    { qui: 'philippe', texte: 'Le tableau des perdants te laisse une seconde chance. Pas une troisième. Gagne le tournoi individuel.' },
    { qui: 'cocoach', texte: 'Je l\'ai gagné du premier coup, ce tournoi. Je dis ça, je dis rien.' },
  ],
  h2: [
    { qui: 'philippe', texte: 'Un coach sans club, c\'est un lutteur sans tapis. Récolte des médailles : à 10, Mon Club ouvre ses portes.' },
    { qui: 'philippe', texte: 'C\'est là que tu recruteras les lutteurs de ton équipe.' },
  ],
  h3: [
    { qui: 'philippe', texte: 'Ton club tourne. Aligne maintenant cinq lutteurs : la première équipe à trois victoires l\'emporte.' },
    { qui: 'cocoach', texte: 'Mon équipe t\'attend. Prépare tes cinq meilleurs… ou tes cinq moins mauvais.' },
  ],
  h4: [
    { qui: 'philippe', texte: 'En combat rapide, il n\'y a qu\'une période. Pas le temps de calculer : il faut frapper fort.' },
    { qui: 'philippe', texte: 'Fais tomber ton adversaire, ou prends-lui 10 points d\'écart. Une petite victoire aux points ne suffira pas.' },
  ],
  h5: [
    { qui: 'philippe', texte: 'Les grandes équipes ont une identité. Trois lutteurs d\'une même nation dans ton club, et toute l\'équipe gagne en force.' },
    { qui: 'cocoach', texte: 'Le bonus de nation ? Je l\'utilise depuis toujours. Bienvenue chez les grands.' },
  ],
  h6: [
    { qui: 'philippe', texte: 'L\'arène, c\'est le tour du monde des styles de lutte. Chaque nation a ses spécialistes et son champion.' },
    { qui: 'philippe', texte: 'Bats une nation entière, son champion compris.' },
  ],
  h7: [
    { qui: 'philippe', texte: 'Un bon lutteur, ça se construit. Réunis ses doubles et fusionne-les : sa carte monte de niveau et débloque de nouvelles actions.' },
    { qui: 'philippe', texte: 'Amène une carte jusqu\'au niveau épique.' },
  ],
  h8: [
    { qui: 'philippe', texte: 'L\'ordinateur fort lit tes habitudes. Si tu joues toujours la même chose, il te le fera payer.' },
    { qui: 'cocoach', texte: 'Moi, je le bats les yeux fermés. Toi, fais-le à la main : le combat auto ne compte pas pour celui-là.' },
  ],
  h9: [
    { qui: 'philippe', texte: 'Le vrai test, c\'est un adversaire en chair et en os. Invite un ami en ligne et bats-le.' },
    { qui: 'cocoach', texte: 'Et si ton ami a besoin de conseils, il sait où me trouver.' },
  ],
  h10: [
    { qui: 'philippe', texte: 'Il te reste des nations à conquérir. Termine l\'arène : douze nations, douze champions.' },
  ],
  h11: [
    { qui: 'philippe', texte: 'Dernière épreuve : gagner un tournoi individuel sans perdre un seul combat. Le tableau principal, de bout en bout.' },
    { qui: 'cocoach', texte: 'Sans une seule défaite ? Même moi, il m\'a fallu trois essais. Bon courage.' },
    { qui: 'philippe', texte: 'Réussis, et la saison sportive t\'ouvrira ses portes.' },
  ],
  hfin: [
    { qui: 'philippe', texte: 'Coach, tu as fait tes preuves. Place aux choses sérieuses : une vraie saison sportive.' },
    { qui: 'philippe', texte: 'Interclub, régional, national, international, championnats du monde… et au bout, les Jeux Olympiques.' },
    { qui: 'cocoach', texte: 'Les Jeux ? On s\'y retrouvera. Sur le podium, il n\'y a qu\'une seule marche tout en haut.' },
  ],
  h12: [
    { qui: 'philippe', texte: 'Pendant que la saison commence, on travaille la technique. En vrai combat, les meilleurs enchaînent leurs actions.' },
    { qui: 'philippe', texte: 'Un matraquage puis une ceinture arrière, un sprawl puis une attaque… Le bouton s\'allume en vert quand un combo est possible.' },
    { qui: 'philippe', texte: 'Réussis-en deux dans un même combat.' },
    { qui: 'cocoach', texte: 'Deux combos ? Moi, j\'en place trois par période. Mais bon, chacun son rythme.' },
  ],
  h13: [
    { qui: 'philippe', texte: 'Nouvel exercice : tu prépares tes actions par trois, d\'avance, comme une séquence travaillée à l\'entraînement.' },
    { qui: 'philippe', texte: 'Choisis le format « Enchaînement » et gagne un combat. Méfie-toi : un contre en 1re action, ou un matraquage en 2e, brise la chaîne.' },
    { qui: 'cocoach', texte: 'Trois coups d\'avance… C\'est comme aux échecs. Sauf qu\'ici, ça fait mal.' },
  ],
  h14: [
    { qui: 'philippe', texte: 'Dernière épreuve du mode histoire : la durée infinie. Pas de chrono, pas de points qui arrêtent le combat.' },
    { qui: 'philippe', texte: 'Il n\'y a qu\'une façon de gagner : faire tomber ton adversaire. Gère ton endurance et garde ton second souffle pour le bon moment.' },
    { qui: 'cocoach', texte: 'Jusqu\'au tombé ? Ça, c\'est de la lutte. Si tu y arrives, tu auras mérité ta légendaire.' },
  ],
  s0: [
    { qui: 'philippe', texte: 'Une saison commence toujours par les échanges interclub : des combats rapides, une seule période.' },
    { qui: 'philippe', texte: 'Gagne trois combats contre d\'autres clubs, et tu seras qualifié pour le championnat régional.' },
  ],
  s1: [
    { qui: 'philippe', texte: 'Le championnat régional : six lutteurs, un seul titre. Il faut le gagner pour monter au national.' },
    { qui: 'cocoach', texte: 'Mon lutteur est inscrit aussi. Le régional, c\'est chez moi.' },
  ],
  s2: [
    { qui: 'philippe', texte: 'Champion régional ! Au national, ils seront quinze, et ils ont tous gagné leur région.' },
    { qui: 'philippe', texte: 'Seul le champion national part à l\'international.' },
  ],
  s3: [
    { qui: 'philippe', texte: 'Ton premier tournoi international : trente lutteurs, et des styles que tu n\'as jamais vus.' },
    { qui: 'philippe', texte: 'Un podium suffit pour te qualifier aux championnats du monde.' },
    { qui: 'cocoach', texte: 'Ma place aux Mondiaux, je l\'ai déjà. Je t\'attends là-bas… si tu y arrives.' },
  ],
  s4: [
    { qui: 'philippe', texte: 'Les championnats du monde. Quarante lutteurs, les meilleurs de chaque nation, et l\'ordinateur au niveau fort.' },
    { qui: 'philippe', texte: 'Monte sur le podium, et tu décroches ton billet pour les Jeux Olympiques.' },
    { qui: 'cocoach', texte: 'Cette fois, je ne te laisserai rien.' },
  ],
  s5: [
    { qui: 'philippe', texte: 'Les Jeux Olympiques. Tous les quatre ans, une vie de travail pour quelques combats.' },
    { qui: 'cocoach', texte: 'Toi et moi, en finale. C\'est écrit.' },
    { qui: 'philippe', texte: 'Seul l\'or compte, Coach. Va le chercher.' },
  ],
  s4b: [
    { qui: 'philippe', texte: 'Les championnats du monde, le sommet de la saison. Quarante lutteurs, les meilleurs de chaque nation, et l\'ordinateur au niveau fort.' },
    { qui: 'philippe', texte: 'Monte sur le podium pour boucler la saison en beauté.' },
    { qui: 'cocoach', texte: 'Les Jeux, ce n\'est pas pour cette année. Alors les Mondiaux, je les veux.' },
  ],
  s6b: [
    { qui: 'philippe', texte: 'Podium mondial : saison bouclée ! Des cartes Champion du Monde t\'attendent.' },
    { qui: 'cocoach', texte: 'Profite bien. La saison prochaine, je reviens plus fort.' },
    { qui: 'philippe', texte: 'Repose-toi, Coach. Une nouvelle saison commence quand tu veux. Les Jeux reviennent tous les quatre ans.' },
  ],
  s6: [
    { qui: 'philippe', texte: 'Champion olympique ! Je savais que ce jour viendrait.' },
    { qui: 'cocoach', texte: '… Bien joué, Coach. Mais la prochaine fois, c\'est moi.' },
    { qui: 'philippe', texte: 'Profite bien. Demain, on retourne à l\'entraînement.' },
  ],
};

// Scènes liées à l'avancement du joueur (étape ou palier en cours), dans l'ordre où les montrer.
// La saison s'ouvre après l'étape `etapeSaison` ; les étapes suivantes se jouent en parallèle.
export function scenesEnCours(
  etapeHistoire: number, nbEtapes: number, palier: number, saisonFinie: boolean, olympique = true, premiereSaison = true, etapeSaison = nbEtapes,
): string[] {
  if (etapeHistoire < etapeSaison) return [`h${etapeHistoire}`];
  const saison = saisonFinie ? [olympique ? 's6' : 's6b']
    : palier === 0 ? (premiereSaison ? ['hfin', 's0'] : ['s0'])
    : palier === 4 && !olympique ? ['s4b'] : [`s${palier}`];
  return etapeHistoire < nbEtapes ? [...saison, `h${etapeHistoire}`] : saison;
}
