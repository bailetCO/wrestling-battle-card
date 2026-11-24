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
| Attaque contre feinte | L'attaque l'emporte. Même si l'attaque rate, la feinte est dissipée : aucun effet (ni bonus, ni initiative, ni effet de matraquage ou d'action spéciale) |
| Défense contre attaque | La défense l'emporte |
| Contre contre défense | Le contre l'emporte |
| Feinte contre contre | La feinte l'emporte |
| Feinte contre défense | La feinte l'emporte : le défenseur perd 10 % de son endurance totale et le feinteur a 2 chances sur 3 de gagner l'initiative |
| Contre contre attaque | Plus d'endurance et plus de force : le contre renvoie les points de l'attaque et l'attaquant subit un déséquilibre. Un seul des deux : 1 point de sortie pour le contreur. Aucun des deux : l'attaque passe |
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
- **Combo** : trois actions réussies dont deux attaques permettent de tenter un tombé. Réussite : 3 chances sur 5 avec plus d'endurance, 2 sur 5 à égalité, 1 sur 8 avec moins.
- **Récupération** : une défense réussie rend 5 % d'endurance sous la moitié de la barre, 10 % au-dessus.
- **Pression** : trois tours d'affilée sans attaque ni contre donnent 1 point de pénalité à l'adversaire.

### Action spéciale

- Effet au tour suivant : attaque ou contre réussi permet de tenter un tombé (mêmes chances que le combo) ; défense réussie renverse la situation et rapporte 4 points (2 × 2) ; feinte réussie fait glisser l'adversaire et rapporte 2 points immédiatement, sans bonus sur l'action suivante.
- Disponible à partir du 2e tour, avec 3 tours de recharge entre deux utilisations.
- Coût en 1re période : 1,5 fois l'endurance de l'action de base jusqu'au 4e tour, 2 fois ensuite.
- Coût en 2e période : 1,5 fois si l'endurance dépasse 75 %, sinon 2 fois.
- 3e période : disponible seulement les 5 premiers tours, pour 2 fois l'endurance.
- Une action spéciale réussie réduit de 0,5 fois le coût de la suivante (non cumulable).

### Chiffrage

Chaque personnage de départ a le même budget : endurance + force ÷ 5 + récupération = 165. La force reste sous 250 pour laisser de la marge aux cartes légendaires ; les cartes communes ont un budget plus faible.

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
| Grande projection, german suplex | Attaque | 10 | 5 |

Le coût est payé même si l'action échoue. Un jeu varié coûte environ 50 d'endurance par période, ce qui permet de tenir jusqu'à la 3e période ; enchaîner les attaques fait passer sous 50 d'endurance dès la 3e période, avec une précision dégradée.

### Endurance

- Chaque lutteur a deux statistiques d'endurance : la taille de sa barre et sa vitesse de récupération entre les périodes.
- Chaque action coûte plus ou moins d'endurance selon sa puissance, ce qui évite de répéter les grosses attaques.
- À 0 d'endurance, la seule action possible est « Lutte » : 1 chance sur 10 de marquer 1 ou 2 points (tirés au hasard).
- Après 3 tours sans endurance, le lutteur a 100 % de chance de se faire tomber.

## 5. Plateforme et technique

- Version 1 : jeu sur navigateur, accessible par un simple lien, sur ordinateur et mobile.
- Si les retours sont bons : application mobile.
- Développement réalisé avec Claude Code, code stocké sur le GitHub de Corentin.
- Avancement étape par étape avec validation d'une esquisse à chaque étape.

## 6. Feuille de route

1. Prototype du combat : deux personnages, 4 actions chacun, combat local.
2. Interface visuelle : cartes, écran de combat, animations simples.
3. Collection : plusieurs personnages, une dizaine d'actions, choix du deck.
4. Multijoueur en ligne entre amis.
5. Comptes joueurs et sauvegarde de la collection.
6. Tests avec la communauté et équilibrage.
7. Monétisation et application mobile.

## 7. Modèle économique

- Premiers mois : jeu entièrement gratuit pour tester et recueillir des avis.
- Ensuite, quand il y aura plus de personnages : boosters de cartes payants et améliorations payantes.
- Veiller à ce que le jeu reste équitable pour les joueurs gratuits.

## 8. Points ouverts

- Vérifier que le nom Wrestling Battle Card est libre (marque, nom de domaine).
- Valider les noms locaux des actions selon l'origine.

### Idée mise de côté

- Bonus de collection : posséder toutes les cartes d'une même origine donne un bonus à chaque carte de cette collection.
