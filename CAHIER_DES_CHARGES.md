# Cahier des charges – Wrestling Battle Card

Porteur du projet : Corentin Bailet (Cocoach_Wrestling)

## 1. Concept

Jeu vidéo de cartes à collectionner sur le thème de la lutte olympique, jouable en ligne depuis un navigateur. Les joueurs collectionnent des cartes de lutteurs et s'affrontent dans des combats tactiques où chaque joueur choisit son action en même temps que l'adversaire.

C'est un concept inédit : il existe très peu de jeux de lutte en ligne.

## 2. Public visé

- En priorité : la communauté de Corentin (lutteurs, pratiquants, abonnés Instagram et TikTok).
- Ensuite : le grand public, attiré par la jouabilité simple et la collection de cartes.
- Le jeu doit être compris en quelques minutes, sans connaître la lutte.

## 3. Personnages

- Personnages fictifs inspirés de lutteurs et de styles réels (pas de vrais noms ni de vraies photos, pour éviter les problèmes de droit à l'image).
- Chaque personnage a un style, une nationalité inspirée, des statistiques et des points forts selon les types d'attaque.
- Exemples de styles : technicien, explosif, lutteur de pression, défenseur, contre-attaquant.
- Niveaux de rareté à prévoir : commun, rare, épique, légendaire.

### Structure d'une carte

- Endurance : de 0 à 100, avec une vitesse de récupération entre les périodes.
- Force : de 10 à 250.
- Précision : calculée à partir de l'endurance, précision = (100 + endurance) / 200, soit de 0,5 à 1. Chance de réussir une action, quelle qu'elle soit : 100 % à 0,75 ou plus (endurance de 50 ou plus), 2 chances sur 3 sous 0,75, 1 chance sur 2 sous 0,6 (endurance sous 20), 1 chance sur 3 à 0,5 (endurance à 0).
- 4 actions.
- 1 action spéciale, active (attaque, contre, défense) ou passive (feinte).

### Personnages de départ

| Origine | Style | Points forts | Endurance | 4 actions |
| --- | --- | --- | --- | --- |
| USA | Lutteur de pression, très physique | Attaques aux jambes | Grande barre | Double jambe, sprawl, matraquage, relance |
| Russie | Technicien précis | Contres et relances | Moyenne | Ceinture arrière, parade, contre, feinte |
| Japon | Rapide et explosif | Feintes et attaques surprises | Petite barre | Simple jambe, feinte, esquive, contre |
| Afrique | Puissant et athlétique | Grandes projections | Récupération rapide | Grande projection, sprawl, bras roulé, relance |
| Europe | Équilibré et polyvalent, idéal pour débuter | Défense | Moyenne | Attaque, défense, feinte, contre |

Une même action peut porter un nom différent selon l'origine du lutteur (par exemple Double Leg Takedown chez l'Américain, Proxod chez le Russe). La mécanique reste identique, seuls le nom et l'animation changent ; une icône sur la carte indique la famille de l'action. Noms locaux à valider par Corentin.

### Noms locaux des actions

| Action | Famille | USA (anglais) | Russie (russe) | Japon (japonais) | Afrique (wolof) | Europe (français) |
| --- | --- | --- | --- | --- | --- | --- |
| Attaque de base | Attaque | Basic Shot | Ataka | Kōgeki | Song | Attaque |
| Simple jambe | Attaque | Single Leg | Proxod v odnu nogu | Kataashi takkuru | Benn tànk | Simple jambe |
| Double jambe | Attaque | Double Leg Takedown | Proxod | Ryōashi takkuru | Ñaari tànk | Double jambe |
| Ceinture arrière | Attaque | Rear Body Lock | Obkhvat szadi | Ushiro-dori | Geñ ginnaaw | Ceinture arrière |
| Bras roulé (bras à la volée) | Attaque | Arm Throw | Brosok cherez spinu | Ude-maki-nage | Sànni loxo | Bras roulé |
| Grande projection | Attaque | Big Throw | Brosok s amplitudoy | Ō-nage | Sànni bu mag | Grande projection |
| German suplex | Attaque | German Suplex | Progib | Jāman suprekkusu | Sànni ginnaaw | Suplex allemand |
| Défense | Défense | Defense | Zashchita | Bōgyo | Aar | Défense |
| Parade | Défense | Block | Blok | Uke | Tëj | Parade |
| Esquive | Défense | Dodge | Ukhod | Kawashi | Rëcc | Esquive |
| Sprawl | Défense | Sprawl | Otbros nog | Supurōru | Tëral | Sprawl |
| Contre | Contre | Counter | Kontrpriyom | Kaeshi-waza | Delloo | Contre |
| Relance | Contre | Re-Shot | Povtornaya ataka | Sai-kōgeki | Dellu song | Relance |
| Feinte | Feinte | Fake | Finta | Feinto | Nax | Feinte |
| Matraquage | Feinte | Snap Down | Sbivanie | Hatakikomi | Dóor-dóor | Matraquage |

### Les 15 lutteurs

Trois styles de jeu par nation. Noms et dessins fictifs et provisoires.

Rééquilibrage de l'étape 4 : chaque lutteur est mesuré sur plus de 100 000 combats simulés, avec l'ordinateur au hasard puis avec l'ordinateur fort (des deux côtés). Sa rareté dépend de son taux de victoire moyen : légendaire 55 à 60 %, épique 50 à 55 %, rare 45 à 50 %, commune 40 à 45 % (à 1 point près). Les 2 premiers sont légendaires, les 3 suivants épiques, puis 5 rares et 5 communes. Vérification : `npm run simuler`.

| Lutteur | Nation | Style | Endurance | Force | Récupération | Deck de départ | Autres actions possibles | Spéciale | Victoires (hasard / fort / moyenne) | Rareté |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lucas Ferrand | Europe | Technicien, feintes et ceintures | 68 | 160 | 43 % | Simple jambe, Ceinture arrière, Parade, Feinte | Contre, Esquive, Bras roulé | feinte | 50,6 / 68,8 / 59,7 % | Légendaire |
| Tanner Briggs | USA | Lutteur de pression, très physique | 85 | 145 | 35 % | Double jambe, Sprawl, Matraquage, Relance | Simple jambe, Feinte, Défense | attaque | 72,7 / 46,4 / 59,5 % | Légendaire |
| Rustam Kazbekov | Russie | Lutteur de pression, infatigable | 79 | 200 | 32 % | Double jambe, Matraquage, Sprawl, Relance | Ceinture arrière, Défense, Grande projection | attaque | 64,5 / 43,0 / 53,7 % | Épique |
| Daichi Morikawa | Japon | Contre-attaquant insaisissable | 69 | 140 | 48 % | Attaque, Esquive, Contre, Matraquage | Relance, Parade, Feinte | contre | 51,9 / 55,4 / 53,6 % | Épique |
| Mikhaïl Orlov | Russie | Technicien précis | 71 | 170 | 35 % | Ceinture arrière, Parade, Contre, Feinte | Bras roulé, Relance, Esquive | contre | 51,0 / 55,1 / 53,0 % | Épique |
| Pavel Zorine | Russie | Contre-attaquant patient | 71 | 145 | 48 % | Attaque, Esquive, Contre, Relance | Parade, Feinte, Simple jambe | contre | 43,8 / 57,2 / 50,5 % | Rare |
| Duke Halvorsen | USA | Défenseur, un mur qui use l'adversaire | 76 | 140 | 39 % | Attaque, Sprawl, Contre, Matraquage | Parade, Défense, Double jambe | défense | 58,6 / 42,1 / 50,3 % | Rare |
| Hugo Delmas | Europe | Équilibré, idéal pour débuter | 68 | 165 | 42 % | Attaque, Défense, Feinte, Contre | Simple jambe, Parade, Matraquage | défense | 48,8 / 49,3 / 49,1 % | Rare |
| Ibou Ndiaye | Afrique | Explosif, feintes et bras roulés | 60 | 180 | 51 % | Simple jambe, Feinte, Esquive, Bras roulé | Double jambe, Relance, Matraquage | feinte | 39,0 / 58,4 / 48,7 % | Rare |
| Cheikh Faye | Afrique | Défenseur, immense réserve d'énergie | 78 | 155 | 37 % | Bras roulé, Sprawl, Contre, Attaque | Parade, Défense, Relance | défense | 47,3 / 49,5 / 48,4 % | Rare |
| Colt Ramsey | USA | Explosif, enchaîne les attaques aux jambes | 66 | 200 | 40 % | Simple jambe, Double jambe, Feinte, Sprawl | Attaque, Esquive, Relance | attaque | 38,7 / 53,3 / 46,0 % | Commune |
| Kenji Arata | Japon | Rapide et explosif | 61 | 165 | 60 % | Simple jambe, Feinte, Esquive, Contre | Matraquage, Relance, Attaque | feinte | 42,3 / 48,8 / 45,6 % | Commune |
| Théo Marchal | Europe | Poids lourd, suplex dévastateur | 68 | 240 | 43 % | German suplex, Défense, Matraquage, Contre | Grande projection, Sprawl, Ceinture arrière | attaque | 49,0 / 39,7 / 44,3 % | Commune |
| Lamine Sarr | Afrique | Puissant et athlétique | 71 | 240 | 53 % | Grande projection, Sprawl, Bras roulé, Relance | Double jambe, Feinte, Défense | attaque | 54,2 / 33,4 / 43,8 % | Commune |
| Ryō Takamine | Japon | Technicien, ceinture et relances | 61 | 160 | 55 % | Ceinture arrière, Feinte, Parade, Relance | Contre, Simple jambe, Esquive | contre | 37,7 / 49,5 / 43,6 % | Commune |

### Decks

- Chaque lutteur a une liste de 7 actions possibles, liée à son style. Le joueur compose son deck de 4 actions avant le combat, dont au moins une de la famille de son action spéciale.
- Le deck de départ est celui du tableau ci-dessus ; l'équilibrage est mesuré avec lui.

### Accueil et menu

- À la première ouverture, le joueur choisit son pseudo de coach (3 à 16 caractères), modifiable ensuite. Il s'affiche dans les combats et ses amis le voient en ligne.
- Menu principal en 4 coins : Combat (arène contre l'ordinateur, ou en ligne contre un ami), Collection (cartes débloquées et manquantes, réglage des actions), Fusion, Club (amis, échanges de doubles, marchand).

### Collection

- Au départ, le joueur possède 5 cartes : la moins rare de chaque nation. La collection compte les exemplaires de chaque carte et son grade.
- Boosters : classique (3 cartes, 75 % des boosters) ou rare (5 cartes, 25 %). Les cartes sont tirées parmi les 15, doublons possibles, avec des chances relatives de 50 (commune), 30 (rare), 15 (épique) et 5 (légendaire).
- Arène : 1 booster par victoire ; toutes les 2 défaites d'affilée, un booster de consolation. En ligne (mode collection) : 2 boosters par victoire (une victoire par abandon ne compte qu'après 5 tours).
- La collection et les decks sont gardés dans le navigateur du téléphone, en attendant les comptes joueurs. Un mode test débloque toutes les cartes.

### Club

- Marchand : 3 offres par jour (les mêmes pour tous ce jour-là, renouvelées à minuit, heure du téléphone), chacune utilisable une fois. Il donne une carte contre un double d'une autre carte de même rareté (jamais le dernier exemplaire).
- Échange entre amis : une salle d'échange avec un code de 4 lettres. Chacun voit les doubles de l'autre et propose un de ses doubles ; l'échange se fait quand les deux acceptent les mêmes cartes. Changer d'offre annule l'accord.
- Liste d'amis : chaque coach affronté en ligne ou avec qui on a échangé y apparaît, avec les victoires, défaites et échanges.
- Sans serveur, ces échanges reposent sur la confiance entre amis ; Firebase les sécurisera.
- Pour les tests : un bouton « Ouvrir un booster (test) » dans la Collection.

### Fusion

- Passer au grade g demande g exemplaires identiques : l'original + (g − 1) doubles, qui sont consommés. Grade 2 : 1 double, grade 3 : 2, grade 4 : 3, grade 5 : 4 (grade maximal).
- Bonus sur toutes les statistiques (endurance, force, récupération) par rapport à la carte de base : +5 % aux grades 2, 3 et 4, puis +10 % au grade 5, soit +5, +10, +15 et +25 %.

### Style graphique

- Style manga semi-réaliste, entre réalisme et anime (esprit Baki, Hajime no Ippo).
- Visuel propre à chaque rareté : cadre simple (commune), reflets brillants (rare), effet holographique (épique), illustration animée (légendaire).
- Cartes spéciales possibles en éditions limitées.

## 4. Système de combat

### Principe

À chaque tour, les deux joueurs choisissent secrètement une action, puis les actions sont révélées en même temps. Le résultat peut être : action réussie, parade, action dans le vent ou contre.

### Actions

- Il existe une large bibliothèque d'actions, enrichie au fil des mises à jour.
- Chaque personnage ne peut utiliser que 4 actions (comme les attaques dans Pokémon).
- Personnage de base : attaque, défense, feinte, contre (une action de chaque famille).
- Actions supplémentaires : matraquage, feinte, et d'autres à ajouter.

Famille des feintes :

- Feinte classique : efficace sur la défense.
- Matraquage : baisse de 5 % la précision de l'attaque adverse et de 5 % son endurance.

### Interactions entre les actions

Chaque action appartient à une famille : attaque, défense, contre ou feinte.

| Duel | Résultat |
| --- | --- |
| Attaque contre feinte | L'attaque l'emporte. Même si l'attaque rate, la feinte est dissipée : aucun effet (ni bonus, ni initiative, ni effet de matraquage ou d'action spéciale) et elle compte comme ratée pour le combo |
| Défense contre attaque | La défense l'emporte |
| Contre contre défense | Le contre l'emporte |
| Feinte contre contre | La feinte l'emporte |
| Feinte contre défense | La feinte l'emporte : le défenseur perd 10 % de son endurance totale et le feinteur a 2 chances sur 3 de gagner l'initiative |
| Contre contre attaque | Plus d'endurance et plus de force : le contre renvoie les points de l'attaque et l'attaquant subit un déséquilibre. Un seul des deux : 1 point de sortie pour le contreur. Aucun des deux : l'attaque passe. Exceptions pour les actions spéciales : voir Action spéciale |
| Même famille | Le lutteur qui a au moins le double d'endurance gagne, sinon personne ne marque |

### Format du match

- 3 périodes de 10 tours ; il faut gagner 2 périodes pour remporter le match.
- Une période se gagne aux points ou par 10 points d'écart (supériorité technique).
- Un tombé réussi met fin au combat et donne la victoire.
- Égalité de points en fin de période : la période revient au lutteur qui a marqué la prise la plus élevée (valeur de prise la plus haute, puis la suivante, etc.) ; si l'égalité persiste, au dernier lutteur à avoir marqué. À 0-0, la période revient au lutteur qui a le plus d'endurance (à endurance égale, tirage au sort).

### Résolution d'un tour

1. Les deux joueurs choisissent leur action en secret.
2. Initiative (si active) : le joueur qui a l'initiative voit 2 actions de l'adversaire, dont celle réellement choisie, et peut changer son action ou la garder.
3. La précision de chaque action est tirée avant de comparer les familles.
4. Les familles sont comparées (voir Interactions entre les actions), puis points, endurance et avantages sont appliqués.

### Points

- Marquent des points : une attaque, un contre ou un sprawl réussis (sprawl : 2 points techniques pour le défenseur).
- Attaque réussie : 2, 4 ou 5 points selon l'action (voir Chiffrage) ; +2 points si elle suit une feinte réussie ; +2 points avec au moins le double d'endurance.
- Contre réussi : il renvoie les points de l'attaque adverse ; point de sortie : 1 point.

### Avantages

- **Initiative** : réservée au lutteur qui a feinté. Après une feinte réussie sur une défense, 2 chances sur 3 d'obtenir l'initiative au tour suivant : le joueur voit 2 actions de l'adversaire, dont celle qu'il a choisie, et peut changer son action ou non.
- **Déséquilibre** : face à un contre réussi, l'attaquant perd 5, 10 ou 15 % de son endurance selon que son attaque valait 2 points, 4 points, ou 5 points et plus.
- **Combo** : trois actions réussies dont deux attaques permettent de tenter un tombé. Réussite : 3 chances sur 5 avec plus d'endurance, 2 sur 5 à égalité, 1 sur 5 avec moins. Si la tentative réussit, le lutteur menacé annonce pile ou face : s'il devine juste, il s'en sort.
- **Récupération** : une défense réussie rend 5 % d'endurance sous la moitié de la barre, 10 % au-dessus.
- **Pression** : trois tours d'affilée sans attaque ni contre donnent 1 point de pénalité à l'adversaire.

### Action spéciale

- Tout se passe au même tour. Une action spéciale réussit comme une action normale (tirage de précision, puis duel des familles), avec les exceptions ci-dessous.
- **Attaque spéciale** : si elle passe, tentative de tombé (mêmes chances que le combo). Si le lutteur a plus de force que l'adversaire, elle peut percer une défense ou un contre (sauf défense ou contre spéciale) et les faire échouer ; chance de percée = 1 − force de l'adversaire ÷ force de l'attaquant (250 contre 150 : 40 %).
- **Contre spécial** : face à une attaque ou une feinte, il gagne toujours, renvoie tous les points de l'attaque (sans point de sortie, même sans avantage d'endurance ou de force) et tente le tombé. Face à une défense, il agit comme un contre normal, sans tombé.
- **Défense spéciale** : si elle passe, elle renverse la situation et rapporte 4 points (2 × 2).
- **Feinte spéciale** : si elle passe, l'adversaire glisse et elle rapporte 2 points immédiatement ; au tour suivant, +4 points d'enchaînement si l'attaque ou le contre du lutteur réussit (même un contre sur une défense).
- Disponible à partir du 2e tour, avec 3 tours de recharge entre deux utilisations.
- Coût en 1re période : 1,5 fois l'endurance de l'action de base jusqu'au 4e tour, 2 fois ensuite.
- Coût en 2e période : 1,5 fois si l'endurance dépasse 75 %, sinon 2 fois.
- 3e période : disponible seulement les 5 premiers tours, pour 2 fois l'endurance.
- Une action spéciale réussie réduit de 0,5 fois le coût de la suivante (non cumulable). Un contre spécial face à une défense ne compte pas comme réussi.

### Chiffrage

Version d'origine, remplacée par le rééquilibrage de l'étape 4 (voir Les 15 lutteurs) : chaque personnage de départ avait le même budget, endurance + force ÷ 5 + récupération = 165. La force reste sous 250 pour laisser de la marge aux futures cartes.

| Lutteur | Endurance | Force | Récupération entre périodes |
| --- | --- | --- | --- |
| USA | 100 | 150 | 35 % |
| Russie | 90 | 175 | 40 % |
| Europe | 85 | 175 | 45 % |
| Afrique | 75 | 225 | 45 % |
| Japon | 70 | 175 | 60 % |

| Actions | Famille | Coût en endurance | Points |
| --- | --- | --- | --- |
| Feinte | Feinte | 3 | 0 (+2 sur l'attaque suivante) |
| Matraquage | Feinte | 5 | 0 |
| Défense, parade, esquive | Défense | 3 | 0 |
| Sprawl | Défense | 4 | 2 |
| Contre, relance | Contre | 6 | Points de l'attaque renvoyés |
| Attaque de base, simple jambe | Attaque | 6 | 2 |
| Double jambe, ceinture arrière, bras roulé (bras à la volée) | Attaque | 7 | 4 |
| Grande projection, german suplex | Attaque | 8 (10 avant l'étape 4) | 5 |

Le coût est payé même si l'action échoue. Un jeu varié coûte environ 50 d'endurance par période, ce qui permet de tenir jusqu'à la 3e période ; enchaîner les attaques fait passer sous 50 d'endurance dès la 3e période, avec une précision dégradée.

### Endurance

- Chaque lutteur a deux statistiques d'endurance : la taille de sa barre et sa vitesse de récupération entre les périodes.
- Chaque action coûte plus ou moins d'endurance selon sa puissance, ce qui évite de répéter les grosses attaques.
- À 0 d'endurance, la seule action possible est « Lutte » : 1 chance sur 10 de marquer 1 ou 2 points (tirés au hasard).
- Après 3 tours sans endurance, le lutteur a 100 % de chance de se faire tomber.

### Ordinateur

- Niveau normal : il choisit au hasard parmi ses actions jouables. Avec l'initiative, il change d'action une fois sur deux, au hasard.
- Niveau fort : il estime ce que rapporte chacune de ses actions (et spéciales) face à tout ce que l'adversaire peut jouer : points, chances de tombé, coût en endurance, risque de passer sous 50, passivité. Il joue la meilleure 9 fois sur 10, sinon la deuxième, pour rester imprévisible. Avec l'initiative, il joue l'action qui contre celle de l'adversaire 3 fois sur 4. Il gagne environ 78 % de ses combats contre le niveau normal.

### Combat entre amis (étape 5)

- Le combat entre amis se joue sur la version ouverte à tous : https://bailetco.github.io/wrestling-battle-card/ (GitHub Pages, publiée automatiquement à chaque modification). Pas besoin de compte : il suffit du lien. La page sur claude.ai renvoie vers cette version.
- Un joueur crée une salle et reçoit un code de 4 lettres ; son ami ouvre le même lien, touche « Combat entre amis » et tape le code.
- Connexion : relais publics gratuits et sans compte (MQTT), deux à la fois pour plus de fiabilité. Solution provisoire, à remplacer par Firebase (au plus tard pour les comptes joueurs, étape 7). Les relais publics ne sont pas privés : n'importe qui connaissant le code peut lire les échanges d'une salle (pas de donnée personnelle échangée).
- En créant la salle, l'hôte choisit le mode : « Cartes de base » (les 15 cartes, sans grade, sans booster) ou « Avec nos collections » (chacun ses cartes et leurs grades, 2 boosters par victoire). Chacun utilise son deck personnalisé s'il en a un. Le pseudo de coach de chacun s'affiche chez l'autre.
- Chaque tour : chacun choisit en secret et n'envoie d'abord qu'une empreinte de son choix ; les choix sont dévoilés quand les deux ont joué, ce qui empêche de changer d'avis après avoir vu l'action de l'autre.
- Initiative : le téléphone du joueur qui ne l'a pas montre 2 actions possibles (dont la vraie) ; celui qui a l'initiative garde ou change son action. Pile ou face : le lutteur menacé annonce sur son téléphone.
- Les deux téléphones calculent le combat avec le même moteur et le même numéro de combat : ils obtiennent le même résultat, vérifié à chaque tour.
- Reprise : chaque téléphone garde son historique ; après un rechargement, le combat reprend où il en était. Si l'ami part plus de 2 minutes, on peut arrêter le combat (victoire par forfait). Abandon et revanche possibles.

## 5. Plateforme et technique

- Version 1 : jeu sur navigateur, accessible par un simple lien, sur ordinateur et mobile.
- Si les retours sont bons : application mobile.
- Développement réalisé avec Claude Code, code stocké sur le GitHub de Corentin.
- Avancement étape par étape avec validation d'une esquisse à chaque étape.

## 6. Feuille de route

1. Moteur de règles du combat (sans graphisme), testé.
2. Premier combat jouable dans le navigateur, contre l'ordinateur.
3. Cartes et interface style manga : 15 lutteurs (3 styles par nation), portraits provisoires, cadres de rareté.
4. Collection, niveau « fort » de l'ordinateur et rééquilibrage des lutteurs.
5. Combat entre amis en ligne.
6. Mise en ligne, tests avec la communauté et équilibrage.
7. Comptes joueurs et sauvegarde de la collection.
8. Monétisation et application mobile.

## 7. Modèle économique

- Premiers mois : jeu entièrement gratuit pour tester et recueillir des avis.
- Ensuite, quand il y aura plus de personnages : boosters de cartes payants et améliorations payantes.
- Veiller à ce que le jeu reste équitable pour les joueurs gratuits.

## 8. Points ouverts

- Vérifier que le nom Wrestling Battle Card est libre (marque, nom de domaine).
- Valider les noms locaux des actions selon l'origine.

### Idée mise de côté

- Bonus de collection : posséder toutes les cartes d'une même origine donne un bonus à chaque carte de cette collection.
