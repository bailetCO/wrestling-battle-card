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

### Les 5 personnages d'origine (styles de base)

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

### Les 120 lutteurs

12 nations de 10 lutteurs : USA, Russie, Japon, Iran, Géorgie, Azerbaïdjan, Turquie, Ouzbékistan, Kazakhstan, Kirghizistan (sélection inspirée des championnats du monde 2025, à confirmer), plus l'Afrique et l'Europe, gardées. Noms inventés (jamais ceux de vrais lutteurs) et portraits dessinés en code : provisoires, à remplacer par Corentin.

- Par nation : 4 communes, 3 rares, 2 épiques, 1 légendaire (au total 48, 36, 24 et 12). 3 styles de jeu par nation, répartis à chaque rareté.
- Rareté fixée par simulation (`npm run simuler`) : chaque lutteur affronte des adversaires tirés au hasard parmi les 120, avec l'ordinateur au hasard puis l'ordinateur fort (des deux côtés). Dans chaque nation, le classement par taux de victoire moyen donne la rareté ; l'endurance est ajustée pour que chacun tombe dans sa fourchette : légendaire 57,5 à 62,5 %, épique 52,5 à 57,5 %, rare 47,5 à 52,5 %, commune 42,5 à 47,5 %. Ces fourchettes ont été relevées de 2,5 points (avant : 55 à 60, etc.) pour que leur moyenne pondérée fasse 50 %, sinon l'équilibrage ne peut pas aboutir. Mesure du 25/11/2026 (432 000 combats) : 104 lutteurs dans leur fourchette, 15 à 1 point près, 1 à 1,2 point (Riku Okabe).
- Débloqués dès le départ : les 4 communes et la rare la moins forte de chaque nation (60 cartes). Un nouveau joueur en reçoit 20, tirées au hasard ; une ancienne sauvegarde est complétée jusqu'à 20 cartes différentes.
- À débloquer : les 2 autres rares, les 2 épiques et la légendaire, par les boosters, l'arène et le mode histoire.
- Ajouter une nation ou un lutteur : une ligne dans NATIONS et une ligne par lutteur dans config.ts (et, si on veut, ses couleurs et son drapeau dans page/portrait.ts ; sans cela, des couleurs neutres et un drapeau en trois bandes). Le portrait est tiré automatiquement de l'identifiant. Les modes de jeu n'ont pas à changer.
- Noms locaux des actions : définis pour les 5 nations d'origine ; les 7 nouvelles affichent pour l'instant le nom français (à compléter et valider).

Légendaires (cartes « championnes ») : dans les boosters avec une chance très faible (poids 1 contre 50 pour les communes, environ 1 carte sur 100) ; par les fragments (dans Fusion, un double d'une nation devient 1 fragment de sa légendaire ; 10 fragments la débloquent) ; et dans l'arène (boss légendaire de chaque nation, 1 chance sur 3, étape suivante).

#### Afrique (arène : 1e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Babacar Mensah (Sénégal) | Légendaire | Puissant et athlétique | 62 | 240 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Lamine Sarr (Afrique) | Épique | Puissant et athlétique | 60 | 240 | 53 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Ibou Ndiaye (Afrique) | Épique | Explosif, feintes et bras roulés | 56 | 180 | 51 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Serge Diallo (Ghana) | Rare | Explosif, feintes et bras roulés | 55 | 175 | 52 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Cheikh Faye (Afrique) | Rare | Défenseur, immense réserve d'énergie | 68 | 155 | 37 % | Bras roulé, Sprawl, Contre, Attaque |  |
| Ousmane Kane (Sénégal) | Rare | Défenseur, immense réserve d'énergie | 68 | 155 | 36 % | Bras roulé, Sprawl, Contre, Attaque | oui |
| Moussa Ba (Cameroun) | Commune | Explosif, feintes et bras roulés | 53 | 185 | 53 % | Simple jambe, Feinte, Esquive, Bras roulé | oui |
| Kwame Ekotto (Côte d'Ivoire) | Commune | Puissant et athlétique | 59 | 240 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Tunde Adeyemi (Nigeria) | Commune | Défenseur, immense réserve d'énergie | 67 | 155 | 35 % | Bras roulé, Sprawl, Contre, Attaque | oui |
| Amadou Ndour (Sénégal) | Commune | Puissant et athlétique | 58 | 240 | 49 % | Grande projection, Sprawl, Bras roulé, Relance | oui |

#### Ouzbékistan (arène : 2e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jasur Karimjonov (Ouzbékistan) | Légendaire | Explosif, feintes et bras roulés | 59 | 180 | 49 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Farrukh Yusupjonov (Ouzbékistan) | Épique | Explosif, feintes et bras roulés | 57 | 185 | 52 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Akmal Tursunboyev (Ouzbékistan) | Épique | Puissant et athlétique | 62 | 235 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Sardor Sobirjonov (Ouzbékistan) | Rare | Puissant et athlétique | 59 | 235 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Bekzod Kholmatov (Ouzbékistan) | Rare | Technicien précis | 59 | 165 | 36 % | Ceinture arrière, Parade, Contre, Feinte |  |
| Ulugbek Nazarbekov (Ouzbékistan) | Rare | Puissant et athlétique | 59 | 240 | 50 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Sanjar Usmonaliyev (Ouzbékistan) | Commune | Explosif, feintes et bras roulés | 55 | 175 | 49 % | Simple jambe, Feinte, Esquive, Bras roulé | oui |
| Dilshod Ergashboyev (Ouzbékistan) | Commune | Puissant et athlétique | 59 | 230 | 49 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Otabek Rakhmonov (Ouzbékistan) | Commune | Technicien précis | 60 | 170 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Sherzod Mirzayev (Ouzbékistan) | Commune | Technicien précis | 59 | 165 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Kirghizistan (arène : 3e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kanat Bekturov (Kirghizistan) | Légendaire | Rapide et explosif | 57 | 215 | 65 % | Simple jambe, Feinte, Esquive, Contre |  |
| Aibek Osmonbekov (Kirghizistan) | Épique | Équilibré, solide partout | 63 | 165 | 40 % | Attaque, Défense, Feinte, Contre |  |
| Azamat Asanaliev (Kirghizistan) | Épique | Équilibré, solide partout | 63 | 165 | 44 % | Attaque, Défense, Feinte, Contre |  |
| Erlan Isakbekov (Kirghizistan) | Rare | Rapide et explosif | 56 | 215 | 61 % | Simple jambe, Feinte, Esquive, Contre |  |
| Ruslan Jumabaev (Kirghizistan) | Rare | Défenseur, immense réserve d'énergie | 69 | 150 | 35 % | Bras roulé, Sprawl, Contre, Attaque |  |
| Ulan Mamytov (Kirghizistan) | Rare | Équilibré, solide partout | 61 | 165 | 42 % | Attaque, Défense, Feinte, Contre | oui |
| Talant Usenaliev (Kirghizistan) | Commune | Défenseur, immense réserve d'énergie | 67 | 150 | 35 % | Bras roulé, Sprawl, Contre, Attaque | oui |
| Nursultan Toktogulov (Kirghizistan) | Commune | Rapide et explosif | 55 | 210 | 64 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Bakyt Sadykbekov (Kirghizistan) | Commune | Défenseur, immense réserve d'énergie | 66 | 155 | 39 % | Bras roulé, Sprawl, Contre, Attaque | oui |
| Adilet Abdyldaev (Kirghizistan) | Commune | Rapide et explosif | 55 | 210 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |

#### Iran (arène : 4e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kian Jafarzadeh (Iran) | Légendaire | Lutteur de pression, très physique | 62 | 160 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Navid Tavakolian (Iran) | Épique | Poids lourd, suplex dévastateur | 54 | 240 | 44 % | German suplex, Défense, Matraquage, Contre |  |
| Arash Moradian (Iran) | Épique | Poids lourd, suplex dévastateur | 53 | 240 | 45 % | German suplex, Défense, Matraquage, Contre |  |
| Omid Rahbari (Iran) | Rare | Lutteur de pression, très physique | 58 | 155 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Behnam Nourbakhsh (Iran) | Rare | Lutteur de pression, très physique | 59 | 165 | 28 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Saeed Sadeghpour (Iran) | Rare | Poids lourd, suplex dévastateur | 52 | 230 | 45 % | German suplex, Défense, Matraquage, Contre | oui |
| Mehdi Ebrahimian (Iran) | Commune | Technicien précis | 58 | 170 | 38 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Farid Golzari (Iran) | Commune | Technicien précis | 59 | 170 | 36 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Pouya Karimpour (Iran) | Commune | Poids lourd, suplex dévastateur | 52 | 235 | 41 % | German suplex, Défense, Matraquage, Contre | oui |
| Reza Farahmand (Iran) | Commune | Technicien précis | 59 | 170 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Géorgie (arène : 5e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beka Tsiklauri (Géorgie) | Légendaire | Poids lourd, suplex dévastateur | 55 | 240 | 42 % | German suplex, Défense, Matraquage, Contre |  |
| Davit Kvirikashvili (Géorgie) | Épique | Poids lourd, suplex dévastateur | 53 | 235 | 46 % | German suplex, Défense, Matraquage, Contre |  |
| Zurab Gvaramadze (Géorgie) | Épique | Puissant et athlétique | 62 | 230 | 49 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Tornike Javakhidze (Géorgie) | Rare | Poids lourd, suplex dévastateur | 53 | 240 | 42 % | German suplex, Défense, Matraquage, Contre |  |
| Levan Nadiradze (Géorgie) | Rare | Technicien, ceinture et relances | 56 | 155 | 55 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Luka Lomidze (Géorgie) | Rare | Technicien, ceinture et relances | 55 | 160 | 54 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Sandro Chkhartishvili (Géorgie) | Commune | Technicien, ceinture et relances | 54 | 160 | 54 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Lasha Mchedlishvili (Géorgie) | Commune | Puissant et athlétique | 60 | 235 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Irakli Gelashvili (Géorgie) | Commune | Puissant et athlétique | 58 | 240 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Nika Beridzeshvili (Géorgie) | Commune | Puissant et athlétique | 58 | 230 | 51 % | Grande projection, Sprawl, Bras roulé, Relance | oui |

#### Turquie (arène : 6e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Yusuf Doğancı (Turquie) | Légendaire | Lutteur de pression, très physique | 61 | 160 | 34 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Hakan Arslanoğlu (Turquie) | Épique | Technicien, feintes et ceintures | 59 | 165 | 43 % | Simple jambe, Ceinture arrière, Parade, Feinte |  |
| Burak Öztürkmen (Turquie) | Épique | Lutteur de pression, très physique | 60 | 155 | 30 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Ahmet Çelikkol (Turquie) | Rare | Lutteur de pression, très physique | 57 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Furkan Demirtaş (Turquie) | Rare | Défenseur, immense réserve d'énergie | 69 | 155 | 35 % | Bras roulé, Sprawl, Contre, Attaque |  |
| Emre Aydınoğlu (Turquie) | Rare | Technicien, feintes et ceintures | 57 | 165 | 44 % | Simple jambe, Ceinture arrière, Parade, Feinte | oui |
| Mert Karaca (Turquie) | Commune | Lutteur de pression, très physique | 56 | 155 | 31 % | Double jambe, Sprawl, Matraquage, Relance | oui |
| Kaan Kılıçarslan (Turquie) | Commune | Technicien, feintes et ceintures | 55 | 155 | 46 % | Simple jambe, Ceinture arrière, Parade, Feinte | oui |
| Oğuz Yıldırımlı (Turquie) | Commune | Défenseur, immense réserve d'énergie | 67 | 155 | 35 % | Bras roulé, Sprawl, Contre, Attaque | oui |
| Serkan Koçak (Turquie) | Commune | Défenseur, immense réserve d'énergie | 66 | 160 | 38 % | Bras roulé, Sprawl, Contre, Attaque | oui |

#### Europe (arène : 7e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lucas Ferrand (Europe) | Légendaire | Technicien, feintes et ceintures | 60 | 160 | 43 % | Simple jambe, Ceinture arrière, Parade, Feinte |  |
| Théo Marchal (Europe) | Épique | Poids lourd, suplex dévastateur | 53 | 240 | 43 % | German suplex, Défense, Matraquage, Contre |  |
| Lukas Weber (France) | Épique | Équilibré, solide partout | 63 | 160 | 43 % | Attaque, Défense, Feinte, Contre |  |
| Hugo Delmas (Europe) | Rare | Équilibré, solide partout | 61 | 165 | 42 % | Attaque, Défense, Feinte, Contre |  |
| Victor Schmid (Italie) | Rare | Poids lourd, suplex dévastateur | 53 | 230 | 43 % | German suplex, Défense, Matraquage, Contre |  |
| Bastien Ricci (Allemagne) | Rare | Technicien, feintes et ceintures | 57 | 165 | 44 % | Simple jambe, Ceinture arrière, Parade, Feinte | oui |
| Matteo Morel (Suisse) | Commune | Technicien, feintes et ceintures | 57 | 160 | 42 % | Simple jambe, Ceinture arrière, Parade, Feinte | oui |
| Jonas Lambert (France) | Commune | Poids lourd, suplex dévastateur | 52 | 230 | 43 % | German suplex, Défense, Matraquage, Contre | oui |
| Antoine Lemaire (Belgique) | Commune | Équilibré, solide partout | 60 | 165 | 40 % | Attaque, Défense, Feinte, Contre | oui |
| Pierre Girard (France) | Commune | Équilibré, solide partout | 60 | 170 | 40 % | Attaque, Défense, Feinte, Contre | oui |

#### USA (arène : 8e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tanner Briggs (USA) | Légendaire | Lutteur de pression, très physique | 62 | 150 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Tucker Holloway (USA) | Épique | Lutteur de pression, très physique | 59 | 165 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Jace Dunbar (USA) | Épique | Défenseur, un mur qui use l'adversaire | 60 | 145 | 42 % | Attaque, Sprawl, Contre, Matraquage |  |
| Wyatt Pruitt (USA) | Rare | Défenseur, un mur qui use l'adversaire | 59 | 145 | 36 % | Attaque, Sprawl, Contre, Matraquage |  |
| Cade Whitaker (USA) | Rare | Explosif, enchaîne les attaques aux jambes | 57 | 200 | 42 % | Simple jambe, Double jambe, Feinte, Sprawl |  |
| Garrett Kessler (USA) | Rare | Lutteur de pression, très physique | 57 | 160 | 29 % | Double jambe, Sprawl, Matraquage, Relance | oui |
| Duke Halvorsen (USA) | Commune | Défenseur, un mur qui use l'adversaire | 57 | 140 | 39 % | Attaque, Sprawl, Contre, Matraquage | oui |
| Colt Ramsey (USA) | Commune | Explosif, enchaîne les attaques aux jambes | 57 | 200 | 40 % | Simple jambe, Double jambe, Feinte, Sprawl | oui |
| Mason Sawyer (USA) | Commune | Explosif, enchaîne les attaques aux jambes | 57 | 195 | 40 % | Simple jambe, Double jambe, Feinte, Sprawl | oui |
| Brody Mercer (USA) | Commune | Lutteur de pression, très physique | 57 | 160 | 30 % | Double jambe, Sprawl, Matraquage, Relance | oui |

#### Russie (arène : 9e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rustam Kazbekov (Russie) | Légendaire | Lutteur de pression, infatigable | 61 | 175 | 29 % | Double jambe, Matraquage, Sprawl, Relance |  |
| Ilya Belov (Russie) | Épique | Lutteur de pression, infatigable | 59 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Sergueï Teplov (Russie) | Épique | Lutteur de pression, infatigable | 59 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Pavel Zorine (Russie) | Rare | Contre-attaquant patient | 65 | 145 | 48 % | Attaque, Esquive, Contre, Relance |  |
| Dmitri Gromov (Russie) | Rare | Contre-attaquant patient | 64 | 145 | 50 % | Attaque, Esquive, Contre, Relance |  |
| Timur Kostine (Russie) | Rare | Technicien précis | 59 | 170 | 40 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Mikhaïl Orlov (Russie) | Commune | Technicien précis | 60 | 170 | 35 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Artyom Sorokine (Russie) | Commune | Contre-attaquant patient | 63 | 145 | 50 % | Attaque, Esquive, Contre, Relance | oui |
| Ruslan Vlassov (Russie) | Commune | Technicien précis | 58 | 170 | 41 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Nikita Panine (Russie) | Commune | Technicien précis | 59 | 165 | 36 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Azerbaïdjan (arène : 10e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rashad Abbasli (Azerbaïdjan) | Légendaire | Explosif, enchaîne les attaques aux jambes | 61 | 195 | 43 % | Simple jambe, Double jambe, Feinte, Sprawl |  |
| Murad Ismayilzade (Azerbaïdjan) | Épique | Explosif, enchaîne les attaques aux jambes | 61 | 190 | 41 % | Simple jambe, Double jambe, Feinte, Sprawl |  |
| Elvin Hasanli (Azerbaïdjan) | Épique | Explosif, enchaîne les attaques aux jambes | 61 | 195 | 39 % | Simple jambe, Double jambe, Feinte, Sprawl |  |
| Nijat Safarli (Azerbaïdjan) | Rare | Équilibré, solide partout | 60 | 165 | 45 % | Attaque, Défense, Feinte, Contre |  |
| Vugar Babayli (Azerbaïdjan) | Rare | Équilibré, solide partout | 62 | 165 | 40 % | Attaque, Défense, Feinte, Contre |  |
| Emil Gurbanov (Azerbaïdjan) | Rare | Équilibré, solide partout | 61 | 165 | 44 % | Attaque, Défense, Feinte, Contre | oui |
| Orkhan Novruzov (Azerbaïdjan) | Commune | Contre-attaquant patient | 62 | 150 | 47 % | Attaque, Esquive, Contre, Relance | oui |
| Ramil Huseynli (Azerbaïdjan) | Commune | Explosif, enchaîne les attaques aux jambes | 57 | 200 | 39 % | Simple jambe, Double jambe, Feinte, Sprawl | oui |
| Tural Rzayev (Azerbaïdjan) | Commune | Contre-attaquant patient | 62 | 150 | 50 % | Attaque, Esquive, Contre, Relance | oui |
| Farid Mammadli (Azerbaïdjan) | Commune | Contre-attaquant patient | 63 | 150 | 49 % | Attaque, Esquive, Contre, Relance | oui |

#### Kazakhstan (arène : 11e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aidos Ermekov (Kazakhstan) | Légendaire | Défenseur, un mur qui use l'adversaire | 62 | 140 | 40 % | Attaque, Sprawl, Contre, Matraquage |  |
| Dias Saparuly (Kazakhstan) | Épique | Explosif, enchaîne les attaques aux jambes | 60 | 195 | 41 % | Simple jambe, Double jambe, Feinte, Sprawl |  |
| Askar Abenov (Kazakhstan) | Épique | Défenseur, un mur qui use l'adversaire | 59 | 150 | 42 % | Attaque, Sprawl, Contre, Matraquage |  |
| Arman Zhaksybekov (Kazakhstan) | Rare | Poids lourd, suplex dévastateur | 54 | 230 | 41 % | German suplex, Défense, Matraquage, Contre |  |
| Yerlan Seitkali (Kazakhstan) | Rare | Poids lourd, suplex dévastateur | 52 | 230 | 46 % | German suplex, Défense, Matraquage, Contre |  |
| Daulet Omarbekov (Kazakhstan) | Rare | Explosif, enchaîne les attaques aux jambes | 59 | 195 | 40 % | Simple jambe, Double jambe, Feinte, Sprawl | oui |
| Timur Beisenuly (Kazakhstan) | Commune | Poids lourd, suplex dévastateur | 50 | 240 | 45 % | German suplex, Défense, Matraquage, Contre | oui |
| Nurlan Nurmukhan (Kazakhstan) | Commune | Explosif, enchaîne les attaques aux jambes | 57 | 195 | 41 % | Simple jambe, Double jambe, Feinte, Sprawl | oui |
| Galym Kenzhebek (Kazakhstan) | Commune | Défenseur, un mur qui use l'adversaire | 57 | 145 | 38 % | Attaque, Sprawl, Contre, Matraquage | oui |
| Bauyrzhan Tokhtarbayev (Kazakhstan) | Commune | Poids lourd, suplex dévastateur | 52 | 235 | 45 % | German suplex, Défense, Matraquage, Contre | oui |

#### Japon (arène : 12e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sōta Sugawara (Japon) | Légendaire | Technicien, ceinture et relances | 59 | 165 | 54 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Hayato Kurokawa (Japon) | Épique | Technicien, ceinture et relances | 56 | 165 | 53 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Daichi Morikawa (Japon) | Épique | Contre-attaquant insaisissable | 58 | 140 | 48 % | Attaque, Esquive, Contre, Matraquage |  |
| Riku Okabe (Japon) | Rare | Rapide et explosif | 56 | 210 | 65 % | Simple jambe, Feinte, Esquive, Contre |  |
| Haruto Hanazawa (Japon) | Rare | Contre-attaquant insaisissable | 64 | 145 | 49 % | Attaque, Esquive, Contre, Relance |  |
| Ryō Takamine (Japon) | Rare | Technicien, ceinture et relances | 55 | 160 | 55 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Ren Minegishi (Japon) | Commune | Rapide et explosif | 55 | 210 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Yūto Tsukada (Japon) | Commune | Rapide et explosif | 55 | 215 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Kaito Shimura (Japon) | Commune | Contre-attaquant insaisissable | 62 | 140 | 50 % | Attaque, Esquive, Contre, Relance | oui |
| Kenji Arata (Japon) | Commune | Rapide et explosif | 55 | 210 | 64 % | Simple jambe, Feinte, Esquive, Contre | oui |

### Decks

- On compose son deck de 4 actions parmi les actions débloquées de la carte (4 de base, plus une par niveau de rareté : jusqu'à 8 pour un Champion du Monde), avec au moins une action de la famille de l'action spéciale.
- L'équilibrage est mesuré avec les 4 actions de base, sans fusion.

### Accueil et menu

- À la première ouverture, le joueur choisit son pseudo de coach (3 à 16 caractères), modifiable ensuite. Il s'affiche dans les combats et ses amis le voient en ligne.
- Menu principal en 4 coins : Combat (arène contre l'ordinateur, ou en ligne contre un ami), Collection (cartes débloquées et manquantes, réglage des actions), Fusion, Club (amis, échanges de doubles, marchand).
- Section Combat : bouton « Règles » en haut à gauche (règlement simple, avec un schéma « qui bat qui » ; les chiffres viennent de la configuration) et bouton « Tutoriel » en haut à droite.
- Tutoriel : 5 écrans (bienvenue, collection et boosters, fusion, Club, familles d'actions), puis une période guidée avec Hugo Delmas contre Colt Ramsey. Pendant les 4 premiers tours, le coach annonce l'action de l'adversaire et seule l'action conseillée est jouable (défense, feinte, attaque, défense spéciale) ; ensuite le joueur joue librement jusqu'à la fin de la période. Le combat guidé ne rapporte pas de booster.
- À la fin du tutoriel : retour au menu ou combat contre l'ordinateur. Un tutoriel suivi en entier double les boosters du combat d'arène suivant en cas de victoire ; le bonus est utilisé par ce combat, gagné ou perdu (pas par un abandon).

### Collection

- Au départ, le joueur possède 5 cartes : la moins rare de chaque nation. La collection compte les exemplaires de chaque carte et son niveau de fusion.
- Boosters : classique (3 cartes, 75 % des boosters) ou rare (5 cartes, 25 %). Les cartes sont tirées parmi les 120, doublons possibles, avec des chances relatives de 50 (commune), 30 (rare), 15 (épique) et 1 (légendaire).
- Ouverture d'un booster : le paquet fermé s'affiche, puis chaque appui sur l'écran révèle une carte (avec « Nouvelle ! » ou « Double » et un éclat aux couleurs de sa rareté) ; à la fin, un récapitulatif montre toutes les cartes obtenues. Un bouton « Tout voir » passe directement au récapitulatif.
- Arène : 1 booster par victoire ; toutes les 2 défaites d'affilée, un booster de consolation. En ligne (mode collection) : 2 boosters par victoire (une victoire par abandon ne compte qu'après 5 tours).
- Tri de la collection : par rareté de base, par nation, par nombre de fusions (montées de rareté et étoiles) ou par rareté actuelle (fusion comprise). Le choix est gardé.
- La collection et les decks sont gardés dans le navigateur du téléphone, en attendant les comptes joueurs. Un mode test débloque toutes les cartes.

### Social

- Boutique : boosters à acheter en $ (classique 10 $, rare 25 $).
- Transfert de lutteur (anciennement « marchand ») : 3 offres par jour (les mêmes pour tous ce jour-là, renouvelées à minuit, heure du téléphone), chacune utilisable une fois. On reçoit une carte contre un double d'une autre carte de même rareté de départ (jamais le dernier exemplaire).
- Transfert entre amis (anciennement « échange ») : une salle avec un code de 4 lettres. Chacun voit les doubles de l'autre et propose un de ses doubles ; le transfert se fait quand les deux acceptent les mêmes cartes. Changer d'offre annule l'accord.
- Liste d'amis : chaque coach affronté en ligne ou avec qui on a fait un transfert y apparaît, avec les victoires, défaites et transferts.
- Sans serveur, ces transferts reposent sur la confiance entre amis ; Firebase les sécurisera.
- Pour les tests : un bouton « Ouvrir un booster (test) » dans la Collection.

### Médailles et $

- Deux monnaies : les médailles mesurent la progression (jamais dépensées) ; les $ se dépensent (boosters, inscriptions aux tournois).
- Médailles : +1 par victoire contre l'ordinateur, +2 par victoire en ligne (dans les deux modes de salle ; boosters seulement avec nos collections).
- Toutes les 5 médailles gagnées : +10 $.
- Les médailles et les $ gagnés sont rangés dans le premier booster de la récompense, et révélés comme des cartes (médaille d'or, billet), puis dans le récapitulatif. Une récompense sans cartes s'ouvre quand même, dans un booster « Récompense ».
- Les récompenses en boosters restent (arène, en ligne, consolation, bonus du tutoriel).
- Médailles et $ s'affichent en haut du menu et de Social. Au départ : 0 médaille, 0 $.

### Mon Club

- Tuile du menu, verrouillée jusqu'à 10 médailles. Ensuite, un niveau de plus toutes les 5 médailles : niveau 1 à 10, 2 à 15, 3 à 20, 4 à 25, 5 à 30 (maximum). Les médailles ne sont jamais dépensées.
- Une place par niveau (5 places au niveau 5). On y recrute ses propres lutteurs ; ce n'est qu'une place dans l'équipe : la carte reste utilisable partout. On peut libérer une place.
- Il faut un club de niveau 5 (5 lutteurs) pour le tournoi par équipe.

### Tournois

- Tuile « Tournois » du menu. Contre l'ordinateur pour l'instant ; en ligne plus tard (avec Firebase).
- Chaque combat gagné dans un tournoi rapporte +1 médaille, même si le tournoi est perdu ; les médailles de fin s'ajoutent.
- Tournoi individuel à double tableau (inscription 5 $) : le joueur choisit un de ses lutteurs et le nombre de participants, de 6 à 15 (en dessous de 6, on complète avec des lutteurs de l'ordinateur). Les adversaires sont tirés au hasard, les places aussi.
  - Tableau principal de 8 places (6 à 8 lutteurs) ou de 16 (9 à 15) : tant qu'un lutteur gagne, il avance jusqu'à la finale. Les places vides sont des exemptions : le lutteur tiré au sort en face passe directement au tour suivant (jamais deux places vides face à face).
  - Tableau des perdants : une première défaite avant les 1/2 finales y envoie. Les perdants d'un même tour s'affrontent ; les vainqueurs retrouvent ensuite les perdants du tour suivant (en ordre inverse, pour éviter de revoir le même adversaire), jusqu'à un seul vainqueur. Une deuxième défaite élimine.
  - Finale : les deux vainqueurs des 1/2 finales. Le vainqueur est 1er, le perdant 2e.
  - 3e place : les deux perdants des 1/2 finales s'affrontent ; le gagnant va en petite finale. Le perdant affronte le vainqueur du tableau des perdants (barrage) ; le gagnant du barrage va en petite finale. Le vainqueur de la petite finale est 3e, le perdant 4e ; le perdant du barrage est 5e. Le vainqueur du tableau des perdants ne peut donc pas faire mieux que 3e.
  - Les autres sont classés selon le tour du tableau des perdants où ils sont éliminés (ex aequo dans un même tour).
- Gains du tournoi individuel : 1er 10 médailles, 15 $ et un booster rare ; 2e 6 médailles et 9 $ ; 3e 3 médailles et 5 $.
- Création par les administrateurs : un écran « Créer un tournoi » (nom, date, joueurs au maximum, inscription) existe déjà, mais seulement en aperçu ; il fonctionnera avec les comptes en ligne (Firebase).
- L'ancienne compétition à 6 (deux tableaux de 3, repêchage croisé) est remplacée par le tournoi individuel ; une compétition déjà commencée peut être finie.
- Tournoi par équipe (inscription 10 $, Mon Club niveau 5 avec 5 lutteurs) : le joueur ordonne ses 5 lutteurs ; ils affrontent dans l'ordre les 5 lutteurs d'un club adverse. La première équipe à 3 victoires gagne : 10 médailles, 30 $ et un booster rare. Défaite : aucun gain de fin.
- Bonus de nation (tournoi par équipe) : si l'équipe compte 3 lutteurs d'une même nation, toute l'équipe gagne +5 % d'endurance, de force et de récupération ; 4 lutteurs : +7 % ; 5 lutteurs : +10 %. Une fois sur deux, le club adverse est une « Sélection » nationale (3 à 5 lutteurs d'une même nation) qui profite du même bonus. Le bonus de chaque camp s'affiche à l'inscription, dans l'écran du tournoi et pendant le combat.
- Les combats sans le joueur sont simulés par l'ordinateur (au niveau choisi). Le tournoi en cours est gardé dans le téléphone : on peut le reprendre. Abandonner un combat le perd ; abandonner le tournoi perd l'inscription (les médailles gagnées restent).
- Les gains de fin sont montrés dans un booster (rare au vainqueur, « Récompense » sinon), avec les médailles gagnées pendant les combats.

### Fusion, niveaux de rareté et étoiles

- Une carte a une rareté de départ (celle du booster) et un niveau, qui monte par fusion : Commune → Rare → Épique → Légendaire → Champion du Monde. Champion du Monde ne s'obtient que par fusion. Une commune peut donc monter 4 fois, une rare 3, une épique 2, une légendaire 1.
- Monter au niveau visé demande autant d'exemplaires identiques que son rang : Rare 2, Épique 3, Légendaire 4, Champion du Monde 5 (l'original compris ; les doubles sont consommés). C'est le même nombre pour toutes les cartes : une légendaire a besoin de 5 exemplaires pour devenir Champion du Monde.
- Bonus de statistiques compté par niveau gagné : +5 % pour chacun des 3 premiers niveaux gagnés, +10 % pour le 4e (+25 % au total pour une commune devenue Champion du Monde ; +5 % pour une légendaire).
- Actions : le niveau de la carte fixe le nombre d'actions débloquées, dans un ordre fixe propre à la carte et affiché sur la carte : Commune 0, Rare 1, Épique 2, Légendaire 3, Champion du Monde 4 (toutes). Une carte rare ou plus a donc déjà des actions débloquées dès le booster, et tout Champion du Monde a accès à toutes ses actions. Une action débloquée coûte 1 d'endurance de moins que le coût de sa famille. En combat, on joue toujours avec 4 actions choisies parmi celles débloquées (au moins une de la famille spéciale).
- La carte prend le cadre de son niveau ; Champion du Monde a un cadre rouge et or façon ceinture de champion.
- Le marchand et les échanges comparent la rareté de départ.
- Étoiles (une fois Champion du Monde) : chaque fusion de 5 doubles donne une étoile, qui baisse de 1 le coût d'une action choisie (coût minimum 1). 3 étoiles maximum par action ; on peut continuer jusqu'à ce que toutes les actions débloquées aient 3 étoiles.
- Styles de carte : un Champion du Monde débloque un nouveau style de carte à chaque quart des étoiles possibles (8 actions × 3 = 24 étoiles, soit un style toutes les 6 étoiles), jusqu'à 4 quand toutes les étoiles sont obtenues : Or massif, Nuit étoilée, Couleurs de la nation, Panthéon. Le dernier style débloqué s'affiche ; le joueur peut revenir à n'importe quel style débloqué (ou au cadre classique) depuis la Collection.
- Dans le code, le « grade » est le nombre de niveaux gagnés + 1 (grade 1 = rareté de départ). Une ancienne sauvegarde qui dépasse le maximum est ramenée au maximum.

### Style graphique

- Style manga semi-réaliste, entre réalisme et anime (esprit Baki, Hajime no Ippo).
- Visuel propre à chaque rareté : cadre simple (commune), reflets brillants (rare), effet holographique (épique), illustration animée (légendaire).
- Cartes spéciales possibles en éditions limitées.
- Illustration selon le niveau de la carte (dessins provisoires faits en code, à remplacer par les vrais dessins) :
  - Commune : dans une salle de lutte (tapis, lutteurs à l'entraînement au fond), le lutteur au premier plan tient son dossier de licence.
  - Rare : au centre du tapis, en garde face à un adversaire.
  - Épique : en train de placer une souplesse arrière.
  - Légendaire : au bord du tapis, il saute dans les bras de son coach ; sur le côté, le tableau de score affiche le score et son nom de vainqueur.
  - Champion du Monde : à la première place du podium, médaille d'or au cou, devant le tapis et le drapeau de sa nation qui descend du plafond.
  - Petits portraits (mini-cartes, vignettes, combat) : le buste du lutteur sur le décor de son niveau (médaille d'or pour un Champion du Monde).

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
| Contre contre attaque | Plus d'endurance OU plus de force que l'attaquant (depuis le 25/11/2026) : le contre renvoie les points de l'attaque et l'attaquant subit un déséquilibre. Aucun des deux : l'attaque passe. (Le point de sortie a été supprimé.) Exceptions pour les actions spéciales : voir Action spéciale |
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
- Contre réussi : il renvoie les points de l'attaque adverse.

### Avantages

- **Initiative** : réservée au lutteur qui a feinté. Après une feinte réussie sur une défense, 2 chances sur 3 d'obtenir l'initiative au tour suivant : le joueur voit 2 actions de l'adversaire, dont celle qu'il a choisie, et peut changer son action ou non.
- **Déséquilibre** : face à un contre réussi, l'attaquant perd 5, 10 ou 15 % de son endurance selon que son attaque valait 2 points, 4 points, ou 5 points et plus.
- **Combo** : trois actions réussies dont deux attaques permettent de tenter un tombé. Réussite : 3 chances sur 5 avec plus d'endurance, 2 sur 5 à égalité, 1 sur 5 avec moins. Si la tentative réussit, le lutteur menacé annonce pile ou face : s'il devine juste, il s'en sort.
- **Récupération** : une défense réussie rend 5 % d'endurance sous la moitié de la barre, 10 % au-dessus.
- **Pression** : trois tours d'affilée sans attaque ni contre donnent 1 point de pénalité à l'adversaire.

### Action spéciale

- Tout se passe au même tour. Une action spéciale réussit comme une action normale (tirage de précision, puis duel des familles), avec les exceptions ci-dessous.
- **Attaque spéciale** : si elle passe, tentative de tombé (mêmes chances que le combo). Si le lutteur a plus de force que l'adversaire, elle peut percer une défense ou un contre (sauf défense ou contre spéciale) et les faire échouer ; chance de percée = 1 − force de l'adversaire ÷ force de l'attaquant (250 contre 150 : 40 %).
- **Contre spécial** : face à une attaque ou une feinte, il gagne toujours, renvoie tous les points de l'attaque (même sans avantage d'endurance ou de force) et tente le tombé. Face à une défense, il agit comme un contre normal, sans tombé.
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
| Matraquage | Feinte | 3 | 0 |
| Défense, parade, esquive | Défense | 3 | 0 |
| Sprawl | Défense | 3 | 2 |
| Contre, relance | Contre | 6 | Points de l'attaque renvoyés |
| Attaque de base, simple jambe | Attaque | 6 | 2 |
| Double jambe, ceinture arrière, bras roulé (bras à la volée) | Attaque | 6 | 4 |
| Grande projection, german suplex | Attaque | 6 | 5 |

Depuis le 25/11/2026, toutes les actions d'une même famille ont le même coût de base : attaque 6, défense 3, contre 6, feinte 3. Une action débloquée par fusion coûte 1 de moins ; chaque étoile (Champion du Monde) retire encore 1, sans descendre sous 1.

Récupération en combat : tous les 2 tours de chaque période (tours 2, 4, 6, 8, 10), chaque lutteur récupère 5 % de son endurance actuelle ; sa chance de réussite est sa précision du moment.

Le coût est payé même si l'action échoue. Un jeu varié coûte environ 50 d'endurance par période, ce qui permet de tenir jusqu'à la 3e période ; enchaîner les attaques fait passer sous 50 d'endurance dès la 3e période, avec une précision dégradée.

### Endurance

- Chaque lutteur a deux statistiques d'endurance : la taille de sa barre et sa vitesse de récupération entre les périodes.
- Chaque action coûte plus ou moins d'endurance selon sa puissance, ce qui évite de répéter les grosses attaques.
- À 0 d'endurance, la seule action possible est « Lutte » : 1 chance sur 10 de marquer 1 ou 2 points (tirés au hasard).
- Après 3 tours sans endurance, le lutteur a 100 % de chance de se faire tomber.

### Ordinateur (3 niveaux)

L'ordinateur se distingue seulement par sa façon de choisir : mêmes cartes que le joueur, aucun bonus de stats. Il ne voit jamais l'action du joueur avant qu'elle soit jouée, sauf les 2 actions montrées par l'initiative (comme pour le joueur).

- Facile : au hasard, sans action spéciale, et 45 % du temps l'action la moins bonne (comme un débutant qui se trompe) ; avec l'initiative, change d'action 1 fois sur 4.
- Normal : au hasard ; avec l'initiative, change d'action 1 fois sur 2.
- Fort : il retient les 6 dernières familles d'actions du joueur et estime ce que rapporte chacune de ses actions (points, tombé, endurance, passivité) face à ce que le joueur joue d'habitude ; il joue la meilleure 9 fois sur 10. Avec l'initiative, il joue l'action qui contre celle du joueur 3 fois sur 4. Varier ses actions ou feinter permet de le piéger.
- Mesures (`npm run niveaux`, 1 000 combats par case, cartes au hasard) : joueur au hasard (débutant) 69 % contre le facile, 51 % contre le normal, 16 % contre le fort ; joueur qui calcule comme l'ordinateur fort (expérimenté) 51 % contre le fort. Un joueur humain expérimenté devrait se situer entre les deux, vers 40 %.
- Le choix du facile au lieu du hasard pur est voulu : un ordinateur qui joue entièrement au hasard laisse 50 % de victoires à un joueur au hasard, pas 70 %.

### Arène par nation

- L'ordinateur représente une nation à la fois, dans cet ordre (de la plus abordable à la plus forte) : Afrique, Ouzbékistan, Kirghizistan, Iran, Géorgie, Turquie, Europe, USA, Russie, Azerbaïdjan, Kazakhstan, Japon (champ `ordreArene` de NATIONS).
- 5 adversaires par nation, de plus en plus forts : la commune la plus faible, la commune la plus forte, la meilleure rare, la meilleure épique, puis la légendaire en boss. Ordinateur facile pour les 2 premiers, normal pour les 3e et 4e, fort pour le boss.
- Le joueur choisit son lutteur à chaque combat. Après une défaite, il réaffronte le même adversaire, sans recommencer la nation. La progression est sauvegardée.
- +1 médaille par victoire. Nation battue : 2 ou 3 boosters (au hasard), 3 médailles, et 1 chance sur 3 de gagner la carte du boss. Le booster de consolation (toutes les 2 défaites d'affilée) est gardé.
- Les boss des nations battues peuvent être réaffrontés (ordinateur fort) : +1 médaille et 1 chance sur 3 de gagner leur carte à chaque victoire.
- Objectif : battre les 12 nations. Le bonus du tutoriel donne 2 boosters en plus à la prochaine victoire dans l'arène.

### Combat rapide

- Une seule période. Victoire à 10 points d'écart, par tombé, ou aux points à la fin de la période.
- Égalité à la fin de la période : mort subite, le premier qui marque gagne. Au bout de 10 tours de mort subite sans point, on départage comme une période normale.
- Contre l'ordinateur (niveau au choix) : +1 médaille par victoire, sans booster ni consolation. Entre amis (case « Combat rapide » à la création de la salle) : +2 médailles par victoire, sans booster.

### Niveau de compte

- +1 niveau toutes les 15 médailles (niveau 1 au départ). Il montre seulement l'expérience du joueur : aucune récompense.
- Affiché dans le menu, à côté du nom en combat et dans la salle en ligne (envoyé à l'ami).

### Combat entre amis (étape 5)

- Le combat entre amis se joue sur la version ouverte à tous : https://bailetco.github.io/wrestling-battle-card/ (GitHub Pages, publiée automatiquement à chaque modification). Pas besoin de compte : il suffit du lien. La page sur claude.ai renvoie vers cette version.
- Un joueur crée une salle et reçoit un code de 4 lettres ; son ami ouvre le même lien, touche « Combat entre amis » et tape le code.
- Connexion : relais publics gratuits et sans compte (MQTT), deux à la fois pour plus de fiabilité. Solution provisoire, à remplacer par Firebase (au plus tard pour les comptes joueurs, étape 7). Les relais publics ne sont pas privés : n'importe qui connaissant le code peut lire les échanges d'une salle (pas de donnée personnelle échangée).
- En créant la salle, l'hôte choisit le mode : « Cartes de base » (toutes les cartes, sans fusion, sans booster) ou « Avec nos collections » (chacun ses cartes et leurs niveaux, 2 boosters par victoire). Chacun utilise son deck personnalisé s'il en a un. Le pseudo de coach de chacun s'affiche chez l'autre.
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
- Police du jeu (Roboto Condensed) chargée depuis Google Fonts : à héberger avec le jeu avant le lancement public (vie privée, RGPD, fonctionnement hors ligne).
- Dépôt GitHub public : le code est visible de tous. Le passer en privé demanderait un abonnement GitHub payant pour garder GitHub Pages, ou un autre hébergement (Firebase Hosting à l'étape 7).

### Idée mise de côté

- Bonus de collection : posséder toutes les cartes d'une même origine donne un bonus à chaque carte de cette collection.
