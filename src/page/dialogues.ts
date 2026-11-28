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

// Clés : h0 à h32 = quêtes 1 à 33 du mode histoire (depuis le 28/11/2026) ; hdarius = mode histoire terminé (Darius offre sa
// carte) ; hcocoach = première médaille d'or aux JO (Cocoach offre sa carte et devient un ami) ;
// <clé>_ami = la même scène quand Cocoach est devenu un ami (sinon, la scène de base) ; hfin = ouverture de la saison sportive (Mon Club niveau 10 ; avant le 26/11/2026, cette
// scène s'appelait h12) ; s0 à s5 = paliers de la saison ; s6 = saison olympique terminée ; s4b et
// s6b = championnats du monde et fin de saison quand il n'y a pas de Jeux Olympiques.
export const SCENES: Record<string, Replique[]> = {
  h0: [
    { qui: 'darius', texte: 'Bienvenue au club, Coach ! Moi, c\'est Darius, directeur technique et ancien champion du monde. Crois-moi : tout le monde commence ici, sur ce tapis.' },
    { qui: 'darius', texte: 'Premier objectif : gagner ton premier combat en Carrière. Regarde comment ton adversaire lutte : on apprend autant en gagnant qu\'en perdant.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Darius recrute n\'importe qui, maintenant ? Moi, c\'est Cocoach. Retiens bien ce nom : tu vas l\'entendre souvent.' },
    { qui: 'darius', texte: 'Ne l\'écoute pas. Je n\'ai encore jamais regretté de faire confiance à un coach.' },
  ],
  h1: [
    { qui: 'darius', texte: 'Première victoire, bravo ! Un bon coach choisit les actions de ses lutteurs. Dans la Collection, règle celles d\'un de tes lutteurs.' },
  ],
  h2: [
    { qui: 'darius', texte: 'À l\'entraînement, il n\'y a qu\'une période : parfait pour essayer une action ou un lutteur. Gagne un combat d\'entraînement.' },
  ],
  h3: [
    { qui: 'darius', texte: 'Chaque jour, trois quêtes t\'attendent, avec des $ et des boosters à la clé. Réussis-en une : c\'est la meilleure habitude à prendre.' },
  ],
  h4: [
    { qui: 'darius', texte: 'Tu prends le rythme, Coach. Un coach a besoin d\'une maison : il est temps de bâtir ton club.' },
    { qui: 'darius', texte: 'Objectif : récolter 10 médailles. Chaque victoire t\'en rapporte une, et à 10, Mon Club ouvre ses portes. C\'est là que tu recruteras ton équipe.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Un club ? Le mien a déjà dix places. Mais bon, il faut bien commencer quelque part.' },
  ],
  h5: [
    { qui: 'darius', texte: 'Ton club est ouvert, je suis fier de toi. Maintenant, le grand voyage : la Carrière, c\'est le tour du monde des styles de lutte.' },
    { qui: 'darius', texte: 'Objectif : battre une nation entière, champion compris. Le champion est joué par l\'ordinateur fort : observe-le, il a toujours une habitude à exploiter.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Le premier champion, c\'est le plus facile. Profite, ça ne va pas durer.' },
  ],
  h6: [
    { qui: 'darius', texte: 'Une nation au tapis ! Ton club a des places libres : recrute un lutteur de ta collection pour lui donner vie.' },
  ],
  h7: [
    { qui: 'darius', texte: 'Place au tournoi : il faut enchaîner les combats sans craquer.' },
    { qui: 'darius', texte: 'Objectif : finir sur le podium du tournoi individuel. Et si tu perds un combat, pas de panique : le tableau des perdants te laisse une seconde chance.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Moi, j\'ai gagné mon premier tournoi. Un podium, c\'est pour les débutants. Je dis ça, je dis rien.' },
    { qui: 'darius', texte: 'Moi, j\'ai perdu mon premier tournoi au premier tour. Ce qui compte, c\'est le prochain combat.' },
  ],
  h8: [
    { qui: 'darius', texte: 'Sur le podium ! Tes $ servent aussi à acheter des boosters : la boutique est dans Social. Offre-toi un booster.' },
  ],
  h9: [
    { qui: 'darius', texte: 'Chaque victoire te fait monter au classement. Bronze, Argent, Or… jusqu\'à Maître, et chaque mois, une nouvelle saison classée.' },
    { qui: 'darius', texte: 'Objectif : atteindre la division Argent. Les victoires contre un ordinateur plus fort font monter ta barre plus vite.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Tu verras mon nom tout en haut du classement. Essaie de ne pas trop le regarder.' },
  ],
  h10: [
    { qui: 'darius', texte: 'La lutte, ça se partage : envoie ton lien d\'invitation à un ami, il recevra un booster rare. Tu joues seul ? Tu peux passer cette quête.' },
  ],
  h11: [
    { qui: 'darius', texte: 'Un bon lutteur, ça se construit. Réunis des exemplaires d\'une même carte et fusionne-les : elle monte de niveau et apprend de nouvelles actions.' },
    { qui: 'darius', texte: 'Objectif : faire ta première fusion. Plus une carte est commune, plus il en faut : garde tes doubles, ils valent de l\'or.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Mes cartes, je les ai toutes fusionnées. Tu as du retard, Coach.' },
  ],
  h12: [
    { qui: 'darius', texte: 'Le bouton s\'allume en vert quand un combo est possible. Réussis deux combos dans un même combat. Mon préféré : sprawl, puis double jambe.' },
  ],
  h13: [
    { qui: 'darius', texte: 'Ta carte a déjà pris du galon. Retour sur la route : trois nations, trois champions.' },
    { qui: 'darius', texte: 'Objectif : battre 3 nations en Carrière. Chaque nation battue t\'offre un booster épique : de quoi préparer les suivantes.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Trois nations ? Pas mal… pour un début.' },
  ],
  h14: [
    { qui: 'darius', texte: 'Depuis le niveau 3, le bouton « Auto » fait jouer l\'ordinateur pour toi. Gagne un combat en auto : pratique quand tu veux avancer vite.' },
  ],
  h15: [
    { qui: 'darius', texte: 'Un podium, c\'est bien. Une victoire, c\'est mieux. Cette fois, il faut gagner la finale.' },
    { qui: 'darius', texte: 'Objectif : gagner un tournoi individuel. Aux Mondiaux, j\'ai gagné mes cinq combats en pensant à un seul à la fois. Fais pareil.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Je l\'ai gagné du premier coup, ce tournoi. Mais vas-y, je regarde.' },
  ],
  h16: [
    { qui: 'darius', texte: 'Nouvel exercice : le format Enchaînement. Tu prépares tes actions par trois, d\'avance. Gagne un combat dans ce format, en jouant toi-même.' },
  ],
  h17: [
    { qui: 'darius', texte: 'Champion du tournoi ! Place au travail d\'équipe : cinq lutteurs, et la première équipe à trois victoires l\'emporte.' },
    { qui: 'darius', texte: 'Objectif : gagner un tournoi par équipe. Des lutteurs d\'une même nation donnent un bonus à toute l\'équipe : dans ma sélection, on se connaissait par cœur.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Mon équipe t\'attend. Prépare tes cinq meilleurs… ou tes cinq moins mauvais.' },
  ],
  h18: [
    { qui: 'darius', texte: 'Une astuce de vieux coach : dans Fusion, un double d\'une nation peut devenir un fragment de sa légendaire. Transforme un double en fragment.' },
  ],
  h19: [
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Assez parlé, Coach. En durée infinie, pas de chrono : il faut faire tomber l\'adversaire. Et c\'est moi qui t\'attends sur le tapis.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Je commence en carte rare, pour être sympa. Fais-moi tomber… si tu peux.' },
    { qui: 'darius', texte: 'Objectif : battre Cocoach, en jouant toi-même. Méfie-toi de ses feintes, et souviens-toi : chaque fois que tu le bats, il revient plus fort.' },
  ],
  h20: [
    { qui: 'darius', texte: 'Cocoach au tapis ! L\'ordinateur fort, maintenant : il lit tes habitudes, alors varie tes actions. Bats-le en jouant toi-même, sans le mode auto.' },
  ],
  h21: [
    { qui: 'darius', texte: 'Tu as déjà fait un sacré bout de chemin. Les nations suivantes sont plus fortes : fais monter tes meilleures cartes.' },
    { qui: 'darius', texte: 'Objectif : battre 6 nations en Carrière. La moitié du tour du monde !' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Six nations… Tu commences à m\'inquiéter, Coach.' },
  ],
  h22: [
    { qui: 'darius', texte: 'Choisis un lutteur que tu aimes jouer et fusionne-le jusqu\'au niveau Épique. C\'est lui qui te le rendra le mieux.' },
  ],
  h23: [
    { qui: 'darius', texte: 'Ton club grandit. Au niveau 10, une vraie saison sportive s\'ouvre : interclub, championnats… et au bout, les Jeux Olympiques.' },
    { qui: 'darius', texte: 'Objectif : monter Mon Club au niveau 10. Chaque médaille compte.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Les Jeux ? On s\'y retrouvera. Sur le podium, il n\'y a qu\'une seule marche tout en haut.' },
  ],
  h24: [
    { qui: 'darius', texte: 'Le vrai test, c\'est un adversaire en chair et en os. Invite un ami en ligne et bats-le. Tu joues seul ? Tu peux passer cette quête.' },
  ],
  h25: [
    { qui: 'darius', texte: 'Ta barre de division se remplit vite. Vise plus haut : la division Or.' },
    { qui: 'darius', texte: 'Objectif : atteindre la division Or. En fin de saison, chaque division rapporte ses récompenses.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'L\'Or ? Moi, je suis déjà en Platine. Rattrape-moi si tu peux.' },
  ],
  h26: [
    { qui: 'darius', texte: 'Le sommet d\'une carte : Champion du Monde. Fusionne une carte jusque-là : elle débloque toutes ses actions, et son action de Champion.' },
  ],
  h27: [
    { qui: 'darius', texte: 'Neuf nations, c\'est le dernier virage. Les trois dernières sont les plus fortes du monde.' },
    { qui: 'darius', texte: 'Objectif : battre 9 nations en Carrière. Prends ton temps, prépare tes meilleures cartes.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Plus que trois après ça… et ce ne sont pas les plus tendres.' },
  ],
  h28: [
    { qui: 'darius', texte: 'Nouvelle épreuve : gagner un tournoi individuel sans perdre un seul combat. Le tableau principal, de bout en bout.' },
  ],
  h29: [
    { qui: 'darius', texte: 'Tu es invaincu en tournoi, Coach. Il ne reste plus que le tour du monde à boucler.' },
    { qui: 'darius', texte: 'Objectif : terminer la Carrière. Douze nations, douze champions. Une carte légendaire t\'attend au bout.' },
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Le tour du monde ? Je l\'ai fait deux fois. Mais je veux bien t\'attendre à l\'arrivée.' },
  ],
  h30: [
    { qui: 'darius', texte: 'Une carte Champion du Monde peut encore progresser : dans Fusion, ses doubles donnent des étoiles. Donne une première étoile à une action.' },
  ],
  h31: [
    { qui: 'cocoach', humeur: 'vainqueur', texte: 'Tu m\'as eu, d\'accord. Mais maintenant, je suis légendaire.' },
    { qui: 'darius', texte: 'Objectif : battre Cocoach Légendaire. L\'ordinateur qui le joue lit tes habitudes : varie tes actions, garde de l\'endurance. Tu as tout ce qu\'il faut.' },
  ],
  h32: [
    { qui: 'cocoach', humeur: 'arrogant', texte: 'Champion du Monde. Toutes mes actions, le changement de niveau compris. C\'est le sommet, Coach.' },
    { qui: 'darius', texte: 'Dernier objectif : le battre à son meilleur niveau. Fais-le, et tu auras fait le tour de tout ce que je pouvais t\'apprendre.' },
    { qui: 'cocoach', humeur: 'malin', texte: 'Et si tu gagnes… une carte légendaire t\'attend. Je l\'ai choisie moi-même.' },
    { qui: 'darius', texte: 'Et moi aussi, j\'aurai une petite surprise pour toi. Allez, va le chercher.' },
  ],
  hfin: [
    { qui: 'darius', texte: 'Coach, ton club a atteint le niveau 10 : tu as fait tes preuves. Place aux choses sérieuses, une vraie saison sportive !' },
    { qui: 'darius', texte: 'Interclub, régional, national, international, championnats du monde… et au bout, les Jeux Olympiques. Je serai à tes côtés à chaque étape.' },
    { qui: 'cocoach', humeur: 'mefiant', texte: 'Les Jeux ? On s\'y retrouvera. Sur le podium, il n\'y a qu\'une seule marche tout en haut.' },
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
