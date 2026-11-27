// Petites scènes de dialogue des deux modes histoire : elles s'affichent quand une étape (ou un
// palier de la saison) se débloque, pour dire où va le joueur et quel est son objectif.
// Personnages : Darius, le mentor (ancien champion du monde poids lourd devenu directeur technique ;
// bienveillant et motivant, il donne un objectif clair et raconte parfois une anecdote), et Cocoach,
// le rival. Darius a remplacé Philippe le 27/11/2026 (même histoire, nouveau personnage).

export type Personnage = 'darius' | 'cocoach';

export const PERSONNAGES: Record<Personnage, { nom: string; role: string }> = {
  darius: { nom: 'Darius', role: 'Directeur technique, ancien champion du monde' },
  cocoach: { nom: 'Cocoach', role: 'Coach rival' },
};

// humeur : l'expression du personnage (portrait), « neutre » si rien n'est dit.
// ami : réplique de Cocoach devenu ami (cercle doré au lieu du rouge du rival).
export type Humeur = 'neutre' | 'content' | 'malin' | 'vaincu' | 'vainqueur' | 'arrogant' | 'mefiant';
export interface Replique { qui: Personnage; texte: string; humeur?: Humeur; ami?: boolean }

// Clés : h0 à h17 = étapes 1 à 18 du mode histoire ; hdarius = mode histoire terminé (Darius offre sa
// carte) ; hcocoach = première médaille d'or aux JO (Cocoach offre sa carte et devient un ami) ;
// <clé>_ami = la même scène quand Cocoach est devenu un ami (sinon, la scène de base) ; hfin = ouverture de la saison sportive (Mon Club niveau 10 ; avant le 26/11/2026, cette
// scène s'appelait h12) ; s0 à s5 = paliers de la saison ; s6 = saison olympique terminée ; s4b et
// s6b = championnats du monde et fin de saison quand il n'y a pas de Jeux Olympiques.
export const SCENES: Record<string, Replique[]> = {
  h0: [
    { qui: 'darius', texte: 'Bienvenue au club, Coach ! Moi, c\'est Darius, directeur technique et ancien champion du monde. Crois-moi : tout le monde commence ici, sur ce tapis.' },
    { qui: 'darius', texte: 'Premier objectif : trois victoires, contre trois nations différentes. Regarde comment chacun lutte : on apprend autant en gagnant qu\'en perdant.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Darius recrute n\'importe qui, maintenant ? Moi, c\'est Cocoach. Retiens bien ce nom : tu vas l\'entendre souvent.' },
    { qui: 'darius', texte: 'Ne l\'écoute pas. Je n\'ai encore jamais regretté de faire confiance à un coach.' },
  ],
  h1: [
    { qui: 'darius', texte: 'Trois nations battues, bravo ! Tu as le coup d\'œil. Maintenant, on passe au tournoi : il faut enchaîner les combats sans craquer.' },
    { qui: 'darius', texte: 'Objectif : gagner le tournoi individuel. Et si tu perds un combat, pas de panique : le tableau des perdants te laisse une seconde chance.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Je l\'ai gagné du premier coup, ce tournoi. Je dis ça, je dis rien.' },
    { qui: 'darius', texte: 'Moi, j\'ai perdu mon premier tournoi au premier tour. Le suivant, je l\'ai gagné. Ce qui compte, c\'est le prochain combat.' },
  ],
  h2: [
    { qui: 'darius', texte: 'Champion du tournoi ! Je savais que tu en étais capable. Un coach a besoin d\'une maison : il est temps de bâtir ton club.' },
    { qui: 'darius', texte: 'Objectif : récolter 10 médailles. Chaque victoire t\'en rapporte une, et à 10, Mon Club ouvre ses portes. C\'est là que tu recruteras ton équipe.' },
  ],
  h3: [
    { qui: 'darius', texte: 'Ton club est ouvert, je suis fier de toi. Place au travail d\'équipe : cinq lutteurs, et la première équipe à trois victoires l\'emporte.' },
    { qui: 'darius', texte: 'Objectif : gagner un tournoi par équipe. Choisis des lutteurs qui se complètent, pas seulement les plus forts.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Mon équipe t\'attend. Prépare tes cinq meilleurs… ou tes cinq moins mauvais.' },
  ],
  h4: [
    { qui: 'darius', texte: 'À l\'entraînement, il n\'y a qu\'une période. Pas le temps de calculer : il faut oser.' },
    { qui: 'darius', texte: 'Objectif : faire tomber ton adversaire, ou gagner avec 10 points d\'écart. Une petite victoire aux points ne suffira pas, alors attaque !' },
  ],
  h5: [
    { qui: 'darius', texte: 'Les grandes équipes ont une identité. Dans ma sélection, on se connaissait par cœur, et ça valait tous les muscles du monde.' },
    { qui: 'darius', texte: 'Objectif : trois lutteurs d\'une même nation dans ton club. Toute l\'équipe gagne en force, tu vas le sentir tout de suite.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Le bonus de nation ? Je l\'utilise depuis toujours. Bienvenue chez les grands.' },
  ],
  h6: [
    { qui: 'darius', texte: 'La Carrière, c\'est le tour du monde des styles de lutte. Chaque nation a ses spécialistes et son champion. C\'est le plus beau voyage qui soit.' },
    { qui: 'darius', texte: 'Objectif : battre une nation entière, son champion compris. Observe le boss avant de l\'affronter, il a toujours une habitude à exploiter.' },
  ],
  h7: [
    { qui: 'darius', texte: 'Un bon lutteur, ça se construit, comme un champion. Réunis ses doubles et fusionne-les : sa carte monte de niveau et apprend de nouvelles actions.' },
    { qui: 'darius', texte: 'Objectif : amener une carte au moins jusqu\'au niveau épique. Choisis un lutteur que tu aimes jouer, c\'est lui qui te le rendra le mieux.' },
  ],
  h8: [
    { qui: 'darius', texte: 'L\'ordinateur fort lit tes habitudes : si tu joues toujours la même chose, il te le fera payer. Moi aussi, j\'ai appris à varier… après quelques défaites.' },
    { qui: 'darius', texte: 'Objectif : battre l\'ordinateur fort, en jouant toi-même. Change de rythme, feinte, surprends-le.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Moi, je le bats les yeux fermés. Toi, fais-le à la main : le combat auto ne compte pas pour celui-là.' },
  ],
  h9: [
    { qui: 'darius', texte: 'Le vrai test, c\'est un adversaire en chair et en os. Rien ne remplace ça.' },
    { qui: 'darius', texte: 'Objectif : inviter un ami en ligne et le battre. Et après le combat, serrez-vous la main : c\'est ça aussi, la lutte.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Et si ton ami a besoin de conseils, il sait où me trouver.' },
  ],
  h10: [
    { qui: 'darius', texte: 'Tu as déjà fait un sacré bout de chemin. Il te reste des nations à conquérir.' },
    { qui: 'darius', texte: 'Objectif : terminer la Carrière. Douze nations, douze champions. Une à la fois, et tu y arriveras.' },
  ],
  h11: [
    { qui: 'darius', texte: 'Nouvelle épreuve : gagner un tournoi individuel sans perdre un seul combat. Le tableau principal, de bout en bout.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Sans une seule défaite ? Même moi, il m\'a fallu trois essais. Bon courage.' },
    { qui: 'darius', texte: 'Aux Mondiaux, j\'ai gagné mes cinq combats d\'affilée en pensant à un seul à la fois. Fais pareil : le prochain, rien que le prochain.' },
  ],
  hfin: [
    { qui: 'darius', texte: 'Coach, ton club a atteint le niveau 10 : tu as fait tes preuves. Place aux choses sérieuses, une vraie saison sportive !' },
    { qui: 'darius', texte: 'Interclub, régional, national, international, championnats du monde… et au bout, les Jeux Olympiques. Je serai à tes côtés à chaque étape.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Les Jeux ? On s\'y retrouvera. Sur le podium, il n\'y a qu\'une seule marche tout en haut.' },
  ],
  h12: [
    { qui: 'darius', texte: 'On travaille la technique. En vrai combat, les meilleurs enchaînent leurs actions.' },
    { qui: 'darius', texte: 'Un matraquage puis une ceinture arrière, un sprawl puis une attaque… Le bouton s\'allume en vert quand un combo est possible.' },
    { qui: 'darius', texte: 'Objectif : réussir deux combos dans un même combat. Mon enchaînement préféré, c\'était sprawl puis double jambe. Simple, mais imparable.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Deux combos ? Moi, j\'en place trois par période. Mais bon, chacun son rythme.' },
  ],
  h13: [
    { qui: 'darius', texte: 'Nouvel exercice : tu prépares tes actions par trois, d\'avance, comme une séquence travaillée mille fois à l\'entraînement.' },
    { qui: 'darius', texte: 'Objectif : gagner un combat au format « Enchaînement ». Attention : un contre en 1re action, ou un matraquage en 2e, brise la chaîne.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Trois coups d\'avance… C\'est comme aux échecs. Sauf qu\'ici, ça fait mal.' },
  ],
  h14: [
    { qui: 'darius', texte: 'Place à la durée infinie. Pas de chrono, pas de points qui arrêtent le combat : il faut faire tomber ton adversaire.' },
    { qui: 'darius', texte: 'Objectif : gagner par tombé. Gère ton endurance, garde ton second souffle pour le bon moment. Ma finale mondiale, je l\'ai gagnée comme ça, à la fin.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Jusqu\'au tombé ? Ça, c\'est de la lutte. Si tu y arrives, je viendrai te défier moi-même.' },
  ],
  h15: [
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Assez parlé, Coach. En durée infinie, c\'est moi qui t\'attends sur le tapis.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Je commence en carte rare, pour être sympa. Fais-moi tomber… si tu peux.' },
    { qui: 'darius', texte: 'Objectif : battre Cocoach. Méfie-toi de ses feintes, et souviens-toi : chaque fois que tu le bats, il revient plus fort. Tu es prêt, je le sais.' },
  ],
  h16: [
    { qui: 'cocoach', humeur: 'vainqueur', texte: 'Tu m\'as eu deux fois, d\'accord. Mais maintenant, je suis légendaire.' },
    { qui: 'darius', texte: 'Objectif : battre Cocoach Légendaire. L\'ordinateur qui le joue lit tes habitudes : varie tes actions, garde de l\'endurance. Tu as tout ce qu\'il faut.' },
  ],
  h17: [
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Champion du Monde. Toutes mes actions, le changement de niveau compris. C\'est le sommet, Coach.' },
    { qui: 'darius', texte: 'Dernier objectif : le battre à son meilleur niveau. Fais-le, et tu auras fait le tour de tout ce que je pouvais t\'apprendre.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Et si tu gagnes… une carte légendaire t\'attend. Je l\'ai choisie moi-même.' },
    { qui: 'darius', texte: 'Et moi aussi, j\'aurai une petite surprise pour toi. Allez, va le chercher.' },
  ],
  hdarius: [
    { qui: 'darius', texte: 'Tu l\'as fait, Coach. Cocoach Champion du Monde, au tapis. Je suis tellement fier de toi.' },
    { qui: 'darius', texte: 'Le jour de mon titre mondial, mon entraîneur m\'a dit : « Maintenant, c\'est à toi de transmettre. » Aujourd\'hui, c\'est mon tour.' },
    { qui: 'darius', texte: 'Voici ma carte : Darius Westrell, Champion du Monde, avec deux étoiles. Elle est dans ta collection. Fais-la lutter avec ton cœur.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Attends… Darius t\'a donné SA carte ? Il ne l\'avait jamais donnée à personne.' },
  ],
  hcocoach: [
    { qui: 'cocoach', humeur: 'vaincu', texte: '… L\'or olympique. Pour toi. Je n\'arrive pas à y croire.' },
    { qui: 'darius', texte: 'Cocoach, viens. Ça fait des années que tu cours après ce coach. Dis-lui ce que tu as sur le cœur.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Depuis ton premier jour, j\'ai tout fait pour te battre. Et toi, tu n\'as jamais lâché.' },
    { qui: 'cocoach', humeur: 'content', ami: true, texte: 'Alors voilà : ma carte. Cocoach, Champion du Monde, avec quatre étoiles. Tu l\'as méritée, Coach.' },
    { qui: 'cocoach', humeur: 'malin', ami: true, texte: 'Mais ne crois pas que c\'est fini. Maintenant, on est amis… et je vais te challenger encore plus fort.' },
    { qui: 'darius', texte: 'Un rival qui devient un ami, c\'est la plus belle médaille de la lutte. Je suis fier de vous deux.' },
  ],
  s0_ami: [
    { qui: 'darius', texte: 'Une nouvelle saison commence par les échanges interclub : des combats rapides, une seule période.' },
    { qui: 'cocoach', humeur: 'content', ami: true, texte: 'On remet ça, Coach ? Trois victoires en interclub. Le premier qualifié pour le régional paie le resto.' },
  ],
  s1_ami: [
    { qui: 'darius', texte: 'Le championnat régional : six lutteurs, un seul titre. Objectif : le gagner pour monter au national.' },
    { qui: 'cocoach', humeur: 'malin', ami: true, texte: 'J\'ai inscrit mon meilleur lutteur. Ami ou pas, je ne te ferai aucun cadeau sur le tapis.' },
  ],
  s2_ami: [
    { qui: 'darius', texte: 'Champion régional ! Au national, ils seront quinze. Objectif : le titre, pour partir à l\'international.' },
    { qui: 'cocoach', humeur: 'content', ami: true, texte: 'Bien joué ! Tes entraînements commencent à payer. On se retrouve au national ?' },
  ],
  s3_ami: [
    { qui: 'darius', texte: 'L\'international : trente lutteurs, des styles du monde entier. Objectif : un podium pour aller aux Mondiaux.' },
    { qui: 'cocoach', humeur: 'malin', ami: true, texte: 'J\'ai repéré deux ou trois lutteurs à surveiller. Je te le dis… mais seulement après le tournoi.' },
  ],
  s4_ami: [
    { qui: 'darius', texte: 'Les championnats du monde, avec l\'ordinateur au niveau fort. Objectif : un podium, et ton billet pour les Jeux.' },
    { qui: 'cocoach', humeur: 'vainqueur', ami: true, texte: 'Les Mondiaux ! Toi et moi sur le même podium, ça aurait de la gueule, non ?' },
  ],
  s5_ami: [
    { qui: 'darius', texte: 'Les Jeux Olympiques, encore une fois. Objectif : l\'or. Rien que l\'or.' },
    { qui: 'cocoach', humeur: 'malin', ami: true, texte: 'La dernière fois, tu m\'as eu. Cette fois, je suis prêt. Que le meilleur gagne, mon ami.' },
  ],
  s4b_ami: [
    { qui: 'darius', texte: 'Les championnats du monde, le sommet de la saison. Objectif : monter sur le podium.' },
    { qui: 'cocoach', humeur: 'content', ami: true, texte: 'Pas de Jeux cette année, alors on se donne rendez-vous en haut du podium mondial. Deal ?' },
  ],
  s6b_ami: [
    { qui: 'darius', texte: 'Podium mondial : saison bouclée ! Des cartes Champion du Monde t\'attendent.' },
    { qui: 'cocoach', humeur: 'content', ami: true, texte: 'Joli travail, Coach. Repose-toi bien… parce que la saison prochaine, je reviens avec de nouvelles idées.' },
  ],
  s6_ami: [
    { qui: 'darius', texte: 'Encore l\'or olympique ! Tu entres dans la légende, Coach.' },
    { qui: 'cocoach', humeur: 'vaincu', ami: true, texte: 'Deux fois que tu me prives de l\'or… Tiens, un autre exemplaire de ma carte. Fusionne-le, il te donnera des étoiles.' },
    { qui: 'cocoach', humeur: 'vainqueur', ami: true, texte: 'Et dans quatre ans, c\'est mon tour. Promis !' },
  ],
  s0: [
    { qui: 'darius', texte: 'Une saison commence toujours par les échanges interclub : des combats rapides, une seule période.' },
    { qui: 'darius', texte: 'Objectif : gagner trois combats contre d\'autres clubs. Ensuite, direction le championnat régional !' },
  ],
  s1: [
    { qui: 'darius', texte: 'Le championnat régional : six lutteurs, un seul titre. Objectif : le gagner pour monter au national.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Mon lutteur est inscrit aussi. Le régional, c\'est chez moi.' },
    { qui: 'darius', texte: 'Chez lui ou pas, le tapis est le même pour tout le monde. On y va !' },
  ],
  s2: [
    { qui: 'darius', texte: 'Champion régional ! Au national, ils seront quinze, et ils ont tous gagné leur région. Tu es à ta place parmi eux.' },
    { qui: 'darius', texte: 'Objectif : devenir champion national. Seul le vainqueur part à l\'international.' },
  ],
  s3: [
    { qui: 'darius', texte: 'Ton premier tournoi international : trente lutteurs, des styles jamais vus. Avant le mien, je n\'ai pas dormi de la nuit. Le trac, c\'est normal.' },
    { qui: 'darius', texte: 'Objectif : monter sur le podium. Ça suffit pour te qualifier aux championnats du monde.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Ma place aux Mondiaux, je l\'ai déjà. Je t\'attends là-bas… si tu y arrives.' },
  ],
  s4: [
    { qui: 'darius', texte: 'Les championnats du monde. Quarante lutteurs, les meilleurs de chaque nation, et l\'ordinateur au niveau fort. J\'en garde mes plus beaux souvenirs.' },
    { qui: 'darius', texte: 'Objectif : un podium, et tu décroches ton billet pour les Jeux Olympiques.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Cette fois, je ne te laisserai rien.' },
  ],
  s5: [
    { qui: 'darius', texte: 'Les Jeux Olympiques. Tous les quatre ans, une vie de travail pour quelques combats. Profite de chaque seconde.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Toi et moi, en finale. C\'est écrit.' },
    { qui: 'darius', texte: 'Objectif : la médaille d\'or. Tu as tout ce qu\'il faut, Coach. Va la chercher.' },
  ],
  s4b: [
    { qui: 'darius', texte: 'Les championnats du monde, le sommet de la saison. Quarante lutteurs, les meilleurs de chaque nation, et l\'ordinateur au niveau fort.' },
    { qui: 'darius', texte: 'Objectif : monter sur le podium pour boucler la saison en beauté.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Les Jeux, ce n\'est pas pour cette année. Alors les Mondiaux, je les veux.' },
  ],
  s6b: [
    { qui: 'darius', texte: 'Podium mondial : saison bouclée ! Des cartes Champion du Monde t\'attendent, tu les as bien méritées.' },
    { qui: 'cocoach', humeur: 'vaincu', texte: 'Profite bien. La saison prochaine, je reviens plus fort.' },
    { qui: 'darius', texte: 'Repose-toi, Coach. Une nouvelle saison commence quand tu veux. Les Jeux reviennent tous les quatre ans.' },
  ],
  s6: [
    { qui: 'darius', texte: 'Champion olympique ! Je savais que ce jour viendrait. Ce que j\'ai vécu sur le podium, tu le vis aujourd\'hui. Savoure.' },
    { qui: 'cocoach', humeur: 'vaincu', texte: '… Bien joué, Coach. Mais la prochaine fois, c\'est moi.' },
    { qui: 'darius', texte: 'Profite bien. Demain, on retourne à l\'entraînement. Ensemble.' },
  ],
};

// Scènes liées à l'avancement du joueur (étape ou palier en cours), dans l'ordre où les montrer.
// Le mode histoire et la saison sportive (ouverte au niveau 10 de Mon Club) se jouent en parallèle.
// Mode histoire terminé : la scène où Darius offre sa carte (montrée une seule fois, comme les autres).
// cadeauCocoach : le joueur a la carte de Cocoach (1re médaille d'or aux JO) : la scène où il la
// donne vient après celle de la saison (montrée une seule fois, jamais remise à zéro).
export function scenesEnCours(
  etapeHistoire: number, nbEtapes: number, palier: number, saisonFinie: boolean, olympique = true, premiereSaison = true, saisonOuverte = false,
  cadeauCocoach = false,
): string[] {
  const histoire = etapeHistoire < nbEtapes ? [`h${etapeHistoire}`] : ['hdarius'];
  if (!saisonOuverte) return histoire;
  if (cadeauCocoach) return [...scenesEnCours(etapeHistoire, nbEtapes, palier, saisonFinie, olympique, premiereSaison, true), 'hcocoach'];
  const saison = saisonFinie ? [olympique ? 's6' : 's6b']
    : palier === 0 ? (premiereSaison ? ['hfin', 's0'] : ['s0'])
    : palier === 4 && !olympique ? ['s4b'] : [`s${palier}`];
  return etapeHistoire < nbEtapes ? [...saison, ...histoire] : [...histoire, ...saison];
}

// Cocoach est devenu un ami : il a donné sa carte (scène « hcocoach » vue). Les scènes qui ont une
// version « _ami » la montrent à la place de la scène de base.
export const varianteScene = (cle: string, ami: boolean) => (ami && SCENES[`${cle}_ami`] ? `${cle}_ami` : cle);
