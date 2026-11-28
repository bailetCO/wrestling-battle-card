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
- Précision : calculée à partir de l'endurance, précision = (100 + endurance) / 200, soit de 0,5 à 1. Chance de réussir une action, quelle qu'elle soit : 100 % tant que l'endurance vaut au moins la moitié de l'endurance max du lutteur, puis une baisse régulière, point par point, jusqu'à 40 % à 0 d'endurance (depuis le 28/11/2026 ; du 25 au 28/11/2026 : seuil de 50 d'endurance pour tous ; avant : paliers de 2/3, 1/2 et 1/3). Un repère sur la barre d'endurance marque ce seuil.
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
- Rareté fixée par simulation (`npm run simuler`) : chaque lutteur affronte des adversaires tirés au hasard parmi les 120, avec l'ordinateur au hasard puis l'ordinateur fort (des deux côtés). Dans chaque nation, le classement par taux de victoire moyen donne la rareté ; l'endurance est ajustée pour que chacun tombe dans sa fourchette : légendaire 57,5 à 62,5 %, épique 52,5 à 57,5 %, rare 47,5 à 52,5 %, commune 42,5 à 47,5 %. Ces fourchettes ont été relevées de 2,5 points (avant : 55 à 60, etc.) pour que leur moyenne pondérée fasse 50 %, sinon l'équilibrage ne peut pas aboutir. Mesure du 25/11/2026 (432 000 combats) : 104 lutteurs dans leur fourchette, 15 à 1 point près, 1 à 1,2 point (Riku Okabe). Mesure du 26/11/2026, après les changements de règles suivants (90 000 combats, `npm run simuler`) : 74 dans leur fourchette, 19 à 1 point près, 17 trop forts, 10 trop faibles ; moyennes par rareté : commune 45,9 %, rare 50,2 %, épique 55,3 %, légendaire 59,6 %. 18 lutteurs dépendent trop du niveau de jeu (plus de 25 points d'écart entre l'ordinateur au hasard et l'ordinateur fort), surtout les styles « Défenseur, immense réserve d'énergie » (70 % contre le hasard, 23 % contre le fort) et « Explosif, enchaîne les attaques aux jambes » (36 % et 65 %). Rééquilibrage du 26/11/2026 (soir), après la règle de priorité du combo et de l'attaque spéciale (qui avait fait tomber à 51 lutteurs dans leur fourchette, 32 trop forts, 20 trop faibles) : endurance seule, réglée par petites étapes sur 1 500 combats par lutteur (87 cartes modifiées, presque toutes de 1 à 3 points ; force, récupération, decks et raretés inchangés). Contrôle sur d'autres combats (2 500 par lutteur, 300 000 combats) : 96 dans leur fourchette, 15 à 1 point près, 9 un peu plus loin (au plus 2,9 points) ; moyennes par rareté : commune 44,8 %, rare 50,2 %, épique 55,0 %, légendaire 59,1 %, Champions du Monde 65,5 % (tous entre 61,3 et 68,4 %). Toujours 21 lutteurs qui dépendent trop du niveau de jeu (à traiter par le deck, pas par l'endurance).
- Rééquilibrage du 28/11/2026 (point faible n° 10). Mesure de départ (100 500 combats : 600 au hasard et 150 contre l'ordinateur fort par lutteur) : 84 dans leur fourchette, 17 à 1 point près, 12 trop forts, 7 trop faibles, **22 dépendent trop du niveau de jeu**, presque tous de 4 styles, chaque fois à cause d'une action de leur deck de base. Décision : changer le deck de ces styles (31 cartes), l'action retirée devenant un déblocage quand la nouvelle en était un :
  - « Défenseur, immense réserve d'énergie » (9 cartes) : Attaque → Feinte, endurance −14 (ils gagnaient grâce à l'endurance contre un débutant, mais un bon joueur les lisait) ;
  - « Explosif, enchaîne les attaques aux jambes » (10) : Double jambe → Attaque (la Double jambe devient leur 1er déblocage), endurance −1 (ils s'épuisaient avec la Double jambe en jouant au hasard) ;
  - « Technicien, feintes et ceintures » (6) : Ceinture arrière → Attaque, endurance −1 ;
  - « Contre-attaquant patient » (6) : Relance → Feinte (la Relance devient un déblocage), endurance −4.
  Ces changements déplacent les autres cartes (elles les affrontent) : quatre tours de petites retouches d'endurance (cartes à plus de 2,5 points de leur fourchette seulement ; Darius inchangé, à la demande de Corentin ; les petits écarts restent, pour garder des cartes plus fortes ou plus faibles à découvrir). Résultat (mesure finale, 100 500 combats) : 88 dans leur fourchette, 15 à 1 point près, 13 trop forts, 4 trop faibles, **0 carte qui dépend trop du niveau** ; 2 cartes seulement à plus de 2,5 points de leur fourchette (8 avant), aucune à plus de 5 (3 avant) ; moyennes par rareté : commune 44,8 %, rare 50,5 %, épique 55,7 %, légendaire 61,2 % ; Champions du Monde entre 63 et 70 % (11 sur 14 à 1 point près de leur fourchette ; à cette précision, la mesure elle-même varie d'environ 2 points). Conséquence : le niveau de jeu compte un peu moins (en combat automatique, un compte niveau 10 gagne 46 % contre l'ordinateur fort, contre 34 % au niveau 3).
- Rééquilibrage du 28/11/2026 (2e), après la nouvelle règle de précision (seuil à la moitié de l'endurance max au lieu de 50 pour tous) : elle avantageait les petites endurances (+5 points en moyenne sous 52) et pénalisait les grosses (−7 points à 60 et plus) ; seulement 38 cartes restaient dans leur fourchette. Sept tours de retouches d'endurance (Darius inchangé), et un 5e style au deck changé, « Contre-attaquant insaisissable » (2 cartes du Japon : Relance → Feinte, la Relance devient un déblocage, endurance −3 puis retouchée). Résultat (100 500 combats) : 83 dans leur fourchette, 25 à 1 point près, aucune à plus de 2,5 points (3 entre 1,5 et 2,5) ; moyennes par rareté : commune 45,6 %, rare 50,2 %, épique 55,9 %, légendaire 60,4 % ; Champions du Monde entre 61,1 et 68,8 % (Darius 65,6 %). 3 cartes dépendent encore un peu trop du niveau (Emre Aydınoğlu, Moussa Ba, Lucas Ferrand : 26 à 28 points d'écart) et Cocoach (carte secrète « exigeante », qui récompense les bons joueurs) : laissées telles quelles, à la demande de Corentin.
- Cartes de base contre cartes montées par fusion (outil `npm run fusion`, 26/11/2026) : chaque carte de base d'un niveau affronte des cartes plus faibles montées à ce même niveau ; les deux camps ont leurs actions débloquées et un deck optimisé (l'ordinateur essaie toutes les compositions de 4 actions et garde la meilleure), ordinateur fort des deux côtés. Résultat après rééquilibrage : les cartes montées gagnent un peu plus souvent (58,7 % au niveau légendaire, 55,8 % en épique, 51,4 % en rare), grâce au bonus de fusion (+5 à +15 % de statistiques) et à leurs actions débloquées moins chères. Quelques cartes de base restent nettement au-dessus des cartes montées (Garrett Kessler 71 %, Zurab Gvaramadze et Lamine Sarr 68 %).
- Débloqués dès le départ : les 4 communes et la rare la moins forte de chaque nation (60 cartes). Un nouveau joueur en reçoit 20, tirées au hasard ; une ancienne sauvegarde est complétée jusqu'à 20 cartes différentes.
- À débloquer : les 2 autres rares, les 2 épiques et la légendaire, par les boosters, l'arène et le mode histoire.
- Ajouter une nation ou un lutteur : une ligne dans NATIONS et une ligne par lutteur dans config.ts (et, si on veut, ses couleurs et son drapeau dans page/portrait.ts ; sans cela, des couleurs neutres et un drapeau en trois bandes). Le portrait est tiré automatiquement de l'identifiant. Les modes de jeu n'ont pas à changer.
- Noms locaux des actions : définis pour les 5 nations d'origine ; les 7 nouvelles affichent pour l'instant le nom français (à compléter et valider).

Légendaires (cartes « championnes ») : dans les boosters avec une chance très faible (poids 1 contre 50 pour les communes, environ 1 carte sur 100) ; par les fragments (dans Fusion, un double d'une nation devient 1 fragment de sa légendaire ; 10 fragments la débloquent) ; et dans l'arène (boss légendaire de chaque nation, 1 chance sur 3, étape suivante).

#### Afrique (arène : 1e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Babacar Mensah (Sénégal) | Légendaire | Puissant et athlétique | 71 | 240 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Lamine Sarr (Afrique) | Épique | Puissant et athlétique | 68 | 240 | 53 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Ibou Ndiaye (Afrique) | Épique | Explosif, feintes et bras roulés | 60 | 180 | 51 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Serge Diallo (Ghana) | Rare | Explosif, feintes et bras roulés | 56 | 175 | 52 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Cheikh Faye (Afrique) | Rare | Défenseur, immense réserve d'énergie | 62 | 155 | 37 % | Bras roulé, Sprawl, Contre, Feinte |  |
| Ousmane Kane (Sénégal) | Rare | Défenseur, immense réserve d'énergie | 63 | 155 | 36 % | Bras roulé, Sprawl, Contre, Feinte | oui |
| Moussa Ba (Cameroun) | Commune | Explosif, feintes et bras roulés | 51 | 185 | 53 % | Simple jambe, Feinte, Esquive, Bras roulé | oui |
| Kwame Ekotto (Côte d'Ivoire) | Commune | Puissant et athlétique | 66 | 240 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Tunde Adeyemi (Nigeria) | Commune | Défenseur, immense réserve d'énergie | 61 | 155 | 35 % | Bras roulé, Sprawl, Contre, Feinte | oui |
| Amadou Ndour (Sénégal) | Commune | Puissant et athlétique | 67 | 240 | 49 % | Grande projection, Sprawl, Bras roulé, Relance | oui |

#### Ouzbékistan (arène : 2e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jasur Karimjonov (Ouzbékistan) | Légendaire | Explosif, feintes et bras roulés | 66 | 180 | 49 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Farrukh Yusupjonov (Ouzbékistan) | Épique | Explosif, feintes et bras roulés | 60 | 185 | 52 % | Simple jambe, Feinte, Esquive, Bras roulé |  |
| Akmal Tursunboyev (Ouzbékistan) | Épique | Puissant et athlétique | 71 | 235 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Sardor Sobirjonov (Ouzbékistan) | Rare | Puissant et athlétique | 68 | 235 | 50 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Bekzod Kholmatov (Ouzbékistan) | Rare | Technicien précis | 58 | 165 | 36 % | Ceinture arrière, Parade, Contre, Feinte |  |
| Ulugbek Nazarbekov (Ouzbékistan) | Rare | Puissant et athlétique | 68 | 240 | 50 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Sanjar Usmonaliyev (Ouzbékistan) | Commune | Explosif, feintes et bras roulés | 56 | 175 | 49 % | Simple jambe, Feinte, Esquive, Bras roulé | oui |
| Dilshod Ergashboyev (Ouzbékistan) | Commune | Puissant et athlétique | 68 | 230 | 49 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Otabek Rakhmonov (Ouzbékistan) | Commune | Technicien précis | 55 | 170 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Sherzod Mirzayev (Ouzbékistan) | Commune | Technicien précis | 56 | 165 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Kirghizistan (arène : 3e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kanat Bekturov (Kirghizistan) | Légendaire | Rapide et explosif | 46 | 215 | 65 % | Simple jambe, Feinte, Esquive, Contre |  |
| Aibek Osmonbekov (Kirghizistan) | Épique | Équilibré, solide partout | 53 | 165 | 40 % | Attaque, Défense, Feinte, Contre |  |
| Azamat Asanaliev (Kirghizistan) | Épique | Équilibré, solide partout | 51 | 165 | 44 % | Attaque, Défense, Feinte, Contre |  |
| Erlan Isakbekov (Kirghizistan) | Rare | Rapide et explosif | 44 | 180 | 61 % | Simple jambe, Feinte, Esquive, Contre |  |
| Ruslan Jumabaev (Kirghizistan) | Rare | Défenseur, immense réserve d'énergie | 64 | 150 | 35 % | Bras roulé, Sprawl, Contre, Feinte |  |
| Ulan Mamytov (Kirghizistan) | Rare | Équilibré, solide partout | 52 | 165 | 42 % | Attaque, Défense, Feinte, Contre | oui |
| Talant Usenaliev (Kirghizistan) | Commune | Défenseur, immense réserve d'énergie | 61 | 150 | 35 % | Bras roulé, Sprawl, Contre, Feinte | oui |
| Nursultan Toktogulov (Kirghizistan) | Commune | Rapide et explosif | 41 | 210 | 64 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Bakyt Sadykbekov (Kirghizistan) | Commune | Défenseur, immense réserve d'énergie | 57 | 155 | 39 % | Bras roulé, Sprawl, Contre, Feinte | oui |
| Adilet Abdyldaev (Kirghizistan) | Commune | Rapide et explosif | 43 | 210 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |

#### Iran (arène : 4e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kian Jafarzadeh (Iran) | Légendaire | Lutteur de pression, très physique | 67 | 160 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Navid Tavakolian (Iran) | Épique | Poids lourd, suplex dévastateur | 59 | 240 | 44 % | German suplex, Défense, Matraquage, Contre |  |
| Arash Moradian (Iran) | Épique | Poids lourd, suplex dévastateur | 59 | 240 | 45 % | German suplex, Défense, Matraquage, Contre |  |
| Omid Rahbari (Iran) | Rare | Lutteur de pression, très physique | 64 | 155 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Behnam Nourbakhsh (Iran) | Rare | Lutteur de pression, très physique | 64 | 165 | 28 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Saeed Sadeghpour (Iran) | Rare | Poids lourd, suplex dévastateur | 56 | 230 | 45 % | German suplex, Défense, Matraquage, Contre | oui |
| Mehdi Ebrahimian (Iran) | Commune | Technicien précis | 55 | 170 | 38 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Farid Golzari (Iran) | Commune | Technicien précis | 57 | 170 | 36 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Pouya Karimpour (Iran) | Commune | Poids lourd, suplex dévastateur | 57 | 235 | 41 % | German suplex, Défense, Matraquage, Contre | oui |
| Reza Farahmand (Iran) | Commune | Technicien précis | 56 | 170 | 37 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Géorgie (arène : 5e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beka Tsiklauri (Géorgie) | Légendaire | Poids lourd, suplex dévastateur | 62 | 240 | 42 % | German suplex, Défense, Matraquage, Contre |  |
| Davit Kvirikashvili (Géorgie) | Épique | Poids lourd, suplex dévastateur | 58 | 235 | 46 % | German suplex, Défense, Matraquage, Contre |  |
| Zurab Gvaramadze (Géorgie) | Épique | Puissant et athlétique | 72 | 215 | 49 % | Grande projection, Sprawl, Bras roulé, Relance |  |
| Tornike Javakhidze (Géorgie) | Rare | Poids lourd, suplex dévastateur | 58 | 240 | 42 % | German suplex, Défense, Matraquage, Contre |  |
| Levan Nadiradze (Géorgie) | Rare | Technicien, ceinture et relances | 49 | 155 | 55 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Luka Lomidze (Géorgie) | Rare | Technicien, ceinture et relances | 48 | 160 | 54 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Sandro Chkhartishvili (Géorgie) | Commune | Technicien, ceinture et relances | 47 | 160 | 54 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Lasha Mchedlishvili (Géorgie) | Commune | Puissant et athlétique | 67 | 235 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Irakli Gelashvili (Géorgie) | Commune | Puissant et athlétique | 67 | 240 | 48 % | Grande projection, Sprawl, Bras roulé, Relance | oui |
| Nika Beridzeshvili (Géorgie) | Commune | Puissant et athlétique | 66 | 230 | 51 % | Grande projection, Sprawl, Bras roulé, Relance | oui |

#### Turquie (arène : 6e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Yusuf Doğancı (Turquie) | Légendaire | Lutteur de pression, très physique | 64 | 160 | 34 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Hakan Arslanoğlu (Turquie) | Épique | Technicien, feintes et ceintures | 53 | 165 | 43 % | Simple jambe, Attaque, Parade, Feinte |  |
| Burak Öztürkmen (Turquie) | Épique | Lutteur de pression, très physique | 66 | 155 | 30 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Ahmet Çelikkol (Turquie) | Rare | Lutteur de pression, très physique | 62 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Furkan Demirtaş (Turquie) | Rare | Défenseur, immense réserve d'énergie | 62 | 155 | 35 % | Bras roulé, Sprawl, Contre, Feinte |  |
| Emre Aydınoğlu (Turquie) | Rare | Technicien, feintes et ceintures | 49 | 165 | 44 % | Simple jambe, Attaque, Parade, Feinte | oui |
| Mert Karaca (Turquie) | Commune | Lutteur de pression, très physique | 62 | 155 | 31 % | Double jambe, Sprawl, Matraquage, Relance | oui |
| Kaan Kılıçarslan (Turquie) | Commune | Technicien, feintes et ceintures | 48 | 155 | 46 % | Simple jambe, Attaque, Parade, Feinte | oui |
| Oğuz Yıldırımlı (Turquie) | Commune | Défenseur, immense réserve d'énergie | 61 | 155 | 35 % | Bras roulé, Sprawl, Contre, Feinte | oui |
| Serkan Koçak (Turquie) | Commune | Défenseur, immense réserve d'énergie | 60 | 160 | 38 % | Bras roulé, Sprawl, Contre, Feinte | oui |

#### Europe (arène : 7e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lucas Ferrand (Europe) | Légendaire | Technicien, feintes et ceintures | 57 | 160 | 43 % | Simple jambe, Attaque, Parade, Feinte |  |
| Théo Marchal (Europe) | Épique | Poids lourd, suplex dévastateur | 59 | 240 | 43 % | German suplex, Défense, Matraquage, Contre |  |
| Lukas Weber (France) | Épique | Équilibré, solide partout | 53 | 160 | 43 % | Attaque, Défense, Feinte, Contre |  |
| Hugo Delmas (Europe) | Rare | Équilibré, solide partout | 51 | 165 | 42 % | Attaque, Défense, Feinte, Contre |  |
| Victor Schmid (Italie) | Rare | Poids lourd, suplex dévastateur | 58 | 230 | 43 % | German suplex, Défense, Matraquage, Contre |  |
| Bastien Ricci (Allemagne) | Rare | Technicien, feintes et ceintures | 49 | 165 | 44 % | Simple jambe, Attaque, Parade, Feinte | oui |
| Matteo Morel (Suisse) | Commune | Technicien, feintes et ceintures | 49 | 160 | 42 % | Simple jambe, Attaque, Parade, Feinte | oui |
| Jonas Lambert (France) | Commune | Poids lourd, suplex dévastateur | 55 | 230 | 43 % | German suplex, Défense, Matraquage, Contre | oui |
| Antoine Lemaire (Belgique) | Commune | Équilibré, solide partout | 52 | 165 | 40 % | Attaque, Défense, Feinte, Contre | oui |
| Pierre Girard (France) | Commune | Équilibré, solide partout | 50 | 170 | 40 % | Attaque, Défense, Feinte, Contre | oui |

#### USA (arène : 8e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tanner Briggs (USA) | Légendaire | Lutteur de pression, très physique | 67 | 150 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Tucker Holloway (USA) | Épique | Lutteur de pression, très physique | 64 | 165 | 31 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Jace Dunbar (USA) | Épique | Défenseur, un mur qui use l'adversaire | 54 | 145 | 42 % | Attaque, Sprawl, Contre, Matraquage |  |
| Wyatt Pruitt (USA) | Rare | Défenseur, un mur qui use l'adversaire | 57 | 145 | 36 % | Attaque, Sprawl, Contre, Matraquage |  |
| Cade Whitaker (USA) | Rare | Explosif, enchaîne les attaques aux jambes | 50 | 200 | 42 % | Simple jambe, Attaque, Feinte, Sprawl |  |
| Garrett Kessler (USA) | Rare | Lutteur de pression, très physique | 65 | 160 | 29 % | Double jambe, Sprawl, Matraquage, Relance | oui |
| Duke Halvorsen (USA) | Commune | Défenseur, un mur qui use l'adversaire | 53 | 140 | 39 % | Attaque, Sprawl, Contre, Matraquage | oui |
| Colt Ramsey (USA) | Commune | Explosif, enchaîne les attaques aux jambes | 49 | 200 | 40 % | Simple jambe, Attaque, Feinte, Sprawl | oui |
| Mason Sawyer (USA) | Commune | Explosif, enchaîne les attaques aux jambes | 51 | 195 | 40 % | Simple jambe, Attaque, Feinte, Sprawl | oui |
| Brody Mercer (USA) | Commune | Lutteur de pression, très physique | 61 | 160 | 30 % | Double jambe, Sprawl, Matraquage, Relance | oui |

#### Russie (arène : 9e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rustam Kazbekov (Russie) | Légendaire | Lutteur de pression, infatigable | 68 | 175 | 29 % | Double jambe, Matraquage, Sprawl, Relance |  |
| Ilya Belov (Russie) | Épique | Lutteur de pression, infatigable | 66 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Sergueï Teplov (Russie) | Épique | Lutteur de pression, infatigable | 63 | 160 | 32 % | Double jambe, Sprawl, Matraquage, Relance |  |
| Pavel Zorine (Russie) | Rare | Contre-attaquant patient | 51 | 145 | 48 % | Attaque, Esquive, Contre, Feinte |  |
| Dmitri Gromov (Russie) | Rare | Contre-attaquant patient | 50 | 145 | 50 % | Attaque, Esquive, Contre, Feinte |  |
| Timur Kostine (Russie) | Rare | Technicien précis | 55 | 170 | 40 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Mikhaïl Orlov (Russie) | Commune | Technicien précis | 56 | 170 | 35 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Artyom Sorokine (Russie) | Commune | Contre-attaquant patient | 48 | 145 | 50 % | Attaque, Esquive, Contre, Feinte | oui |
| Ruslan Vlassov (Russie) | Commune | Technicien précis | 54 | 170 | 41 % | Ceinture arrière, Parade, Contre, Feinte | oui |
| Nikita Panine (Russie) | Commune | Technicien précis | 56 | 165 | 36 % | Ceinture arrière, Parade, Contre, Feinte | oui |

#### Azerbaïdjan (arène : 10e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rashad Abbasli (Azerbaïdjan) | Légendaire | Explosif, enchaîne les attaques aux jambes | 55 | 195 | 43 % | Simple jambe, Attaque, Feinte, Sprawl |  |
| Murad Ismayilzade (Azerbaïdjan) | Épique | Explosif, enchaîne les attaques aux jambes | 54 | 190 | 41 % | Simple jambe, Attaque, Feinte, Sprawl |  |
| Elvin Hasanli (Azerbaïdjan) | Épique | Explosif, enchaîne les attaques aux jambes | 53 | 195 | 39 % | Simple jambe, Attaque, Feinte, Sprawl |  |
| Nijat Safarli (Azerbaïdjan) | Rare | Équilibré, solide partout | 48 | 165 | 45 % | Attaque, Défense, Feinte, Contre |  |
| Vugar Babayli (Azerbaïdjan) | Rare | Équilibré, solide partout | 52 | 165 | 40 % | Attaque, Défense, Feinte, Contre |  |
| Emil Gurbanov (Azerbaïdjan) | Rare | Équilibré, solide partout | 49 | 165 | 44 % | Attaque, Défense, Feinte, Contre | oui |
| Orkhan Novruzov (Azerbaïdjan) | Commune | Contre-attaquant patient | 51 | 150 | 47 % | Attaque, Esquive, Contre, Feinte | oui |
| Ramil Huseynli (Azerbaïdjan) | Commune | Explosif, enchaîne les attaques aux jambes | 51 | 200 | 39 % | Simple jambe, Attaque, Feinte, Sprawl | oui |
| Tural Rzayev (Azerbaïdjan) | Commune | Contre-attaquant patient | 48 | 150 | 50 % | Attaque, Esquive, Contre, Feinte | oui |
| Farid Mammadli (Azerbaïdjan) | Commune | Contre-attaquant patient | 50 | 150 | 49 % | Attaque, Esquive, Contre, Feinte | oui |

#### Kazakhstan (arène : 11e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aidos Ermekov (Kazakhstan) | Légendaire | Défenseur, un mur qui use l'adversaire | 58 | 140 | 40 % | Attaque, Sprawl, Contre, Matraquage |  |
| Dias Saparuly (Kazakhstan) | Épique | Explosif, enchaîne les attaques aux jambes | 52 | 195 | 41 % | Simple jambe, Attaque, Feinte, Sprawl |  |
| Askar Abenov (Kazakhstan) | Épique | Défenseur, un mur qui use l'adversaire | 55 | 150 | 42 % | Attaque, Sprawl, Contre, Matraquage |  |
| Arman Zhaksybekov (Kazakhstan) | Rare | Poids lourd, suplex dévastateur | 59 | 230 | 41 % | German suplex, Défense, Matraquage, Contre |  |
| Yerlan Seitkali (Kazakhstan) | Rare | Poids lourd, suplex dévastateur | 55 | 230 | 46 % | German suplex, Défense, Matraquage, Contre |  |
| Daulet Omarbekov (Kazakhstan) | Rare | Explosif, enchaîne les attaques aux jambes | 51 | 195 | 40 % | Simple jambe, Attaque, Feinte, Sprawl | oui |
| Timur Beisenuly (Kazakhstan) | Commune | Poids lourd, suplex dévastateur | 55 | 240 | 45 % | German suplex, Défense, Matraquage, Contre | oui |
| Nurlan Nurmukhan (Kazakhstan) | Commune | Explosif, enchaîne les attaques aux jambes | 49 | 195 | 41 % | Simple jambe, Attaque, Feinte, Sprawl | oui |
| Galym Kenzhebek (Kazakhstan) | Commune | Défenseur, un mur qui use l'adversaire | 53 | 145 | 38 % | Attaque, Sprawl, Contre, Matraquage | oui |
| Bauyrzhan Tokhtarbayev (Kazakhstan) | Commune | Poids lourd, suplex dévastateur | 55 | 235 | 45 % | German suplex, Défense, Matraquage, Contre | oui |

#### Japon (arène : 12e)

| Lutteur | Rareté | Style | Endurance | Force | Récupération | 4 actions de base | Départ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sōta Sugawara (Japon) | Légendaire | Technicien, ceinture et relances | 53 | 165 | 54 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Hayato Kurokawa (Japon) | Épique | Technicien, ceinture et relances | 51 | 165 | 53 % | Ceinture arrière, Feinte, Parade, Relance |  |
| Daichi Morikawa (Japon) | Épique | Contre-attaquant insaisissable | 51 | 140 | 48 % | Attaque, Esquive, Contre, Matraquage |  |
| Riku Okabe (Japon) | Rare | Rapide et explosif | 43 | 180 | 65 % | Simple jambe, Feinte, Esquive, Contre |  |
| Haruto Hanazawa (Japon) | Rare | Contre-attaquant insaisissable | 50 | 145 | 49 % | Attaque, Esquive, Contre, Feinte |  |
| Ryō Takamine (Japon) | Rare | Technicien, ceinture et relances | 48 | 160 | 55 % | Ceinture arrière, Feinte, Parade, Relance | oui |
| Ren Minegishi (Japon) | Commune | Rapide et explosif | 42 | 210 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Yūto Tsukada (Japon) | Commune | Rapide et explosif | 42 | 215 | 61 % | Simple jambe, Feinte, Esquive, Contre | oui |
| Kaito Shimura (Japon) | Commune | Contre-attaquant insaisissable | 48 | 140 | 50 % | Attaque, Esquive, Contre, Feinte | oui |
| Kenji Arata (Japon) | Commune | Rapide et explosif | 41 | 210 | 64 % | Simple jambe, Feinte, Esquive, Contre | oui |

### Decks

- On compose son deck de 4 actions parmi les actions débloquées de la carte (4 de base, plus une par niveau de rareté : jusqu'à 8 pour un Champion du Monde), avec au moins une action de la famille de l'action spéciale.
- L'équilibrage est mesuré avec les 4 actions de base, sans fusion.

### Accueil et menu

- À la première ouverture, le joueur choisit son pseudo de coach (3 à 16 caractères), modifiable ensuite. Il s'affiche dans les combats et ses amis le voient en ligne.
- Phase « Consolider » (26/11/2026) :
  - **Boîte à récompenses** : étapes du mode histoire, paliers de saison, quêtes et niveaux de Mon Club déposent leurs boosters dans une seule boîte, gardée dans la sauvegarde. Tuile « Récompenses » (toute la largeur, compteur), bandeau du menu et bulles d'annonce y mènent ; les écrans concernés montrent un lien « 🎁 N récompenses à ouvrir ». Une récompense quitte la boîte dès qu'on l'ouvre. Les boosters de fin de combat, de tournoi et de la boutique s'ouvrent toujours sur place.
  - **Écran de combat allégé** : chaque bouton d'action montre le nom et le coût (plus les badges ★ spéciale, Combo et la chance si elle baisse). L'effet et le combo s'affichent en appui long (le clic qui suit ne joue pas l'action) ; un bouton « Détails » les affiche en permanence (préférence gardée sur le téléphone) ; une astuce le rappelle tant que l'appui long n'a pas servi. Fenêtre d'initiative : détails toujours visibles.
  - **Fin du tutoriel** : un gros bouton « Ton premier vrai combat » lance tout de suite le meilleur lutteur du joueur contre le premier adversaire de la Carrière.
- Simplifications du 26/11/2026 (analyse du projet) :
  - Menu ouvert pas à pas selon le mode histoire : au départ, seulement Combat et Collection ; Tournois à l'étape 2, Mon Club et Saison sportive à l'étape 3, Social à l'étape 4, Fusion à l'étape 8 (réglable dans la configuration). Une tuile qui apparaît porte « Nouveau » jusqu'à la première visite. Les anciennes sauvegardes ne voient rien de « Nouveau ».
  - Réglages et modes avancés ouverts de la même façon (27/11/2026), pour ne pas noyer un débutant : ordinateur Fort à l'étape 9, combat entre amis (section « En ligne » de l'écran Combat) à l'étape 10, tutoriel des combos à l'étape 13, format Enchaînement à l'étape 14, durée infinie à l'étape 15, tutoriel du tournoi par équipe à l'étape 4 (réglable : `menu.etapeFonction`). Avant, ces choix n'apparaissent pas du tout (pas de bouton grisé). Les tutoriels courts et les quêtes du jour suivent : une quête qui demande un mode pas encore ouvert n'est jamais tirée. Un joueur déjà avancé voit ce que son étape a ouvert ; un joueur qui a déjà choisi l'ordinateur Fort le garde. Pas de raccourci « tout afficher ».
  - Bas du menu : les liens (Nouveautés, Ma sauvegarde, Installer le jeu, Donner mon avis, Signaler un bug, Confidentialité) regroupés derrière un bouton « Plus ».
  - Noms : l'arène devient la **Carrière** et le combat rapide devient l'**Entraînement** (les adresses et les sauvegardes ne changent pas ; « combat rapide » reste le nom du format en une période, en interclub et entre amis).
  - Le réglage d'épuisement disparaît : valeur fixe, tour 30.
  - Combat auto seulement contre un lutteur déjà battu en jouant soi-même (voir Combat automatique).
  - Grand tutoriel raccourci (environ 2 minutes) ; tutoriels courts ouverts tout seuls à la première visite d'un mode.
  - Espace administrateur retiré des Tournois (il deviendra un outil à part).
- Menu principal en 4 coins : Combat (arène contre l'ordinateur, ou en ligne contre un ami), Collection (cartes débloquées et manquantes, réglage des actions), Fusion, Club (amis, échanges de doubles, marchand).
- Section Combat : bouton « Règles » en haut à gauche (règlement simple, avec un schéma « qui bat qui » ; les chiffres viennent de la configuration) et bouton « Tutoriel » en haut à droite.
- Tutoriel (raccourci le 26/11/2026, environ 2 minutes) : 2 écrans (bienvenue, familles d'actions), puis un combat express de 6 tours avec Hugo Delmas contre Colt Ramsey. Pendant les 4 premiers tours, le coach annonce l'action de l'adversaire et seule l'action conseillée est jouable (défense, feinte, attaque, défense spéciale) ; ensuite le joueur joue librement les 2 derniers tours. Collection, fusion, Mon Club et les modes se découvrent ensuite avec le mode histoire et les tutoriels courts. Avant : 5 écrans et une période entière. Le combat guidé ne rapporte pas de booster.
- À la fin du tutoriel : retour au menu ou combat contre l'ordinateur. Un tutoriel suivi en entier double les boosters du combat d'arène suivant en cas de victoire ; le bonus est utilisé par ce combat, gagné ou perdu (pas par un abandon).
- Tutoriels courts (ajoutés le 26/11/2026), un par style de jeu : les combos, le format Enchaînement, la durée infinie, l'arène, le tournoi individuel, le tournoi par équipe et le combat entre amis. Chacun : 2 ou 3 écrans (règles et stratégie), puis une partie d'essai du mode (sauf le combat entre amis, qui ne se joue pas seul). Ils sont regroupés dans le menu Combat (« Tutoriels courts ») et proposés sur l'écran de chaque mode (combat rapide : combos, Enchaînement, infini ; arène ; tournois ; entre amis).
  - Partie d'essai : lutteur d'essai équilibré avec un deck qui montre le style. Depuis le 27/11/2026, elle commence par des **tours guidés**, comme le grand tutoriel : seule l'action conseillée est jouable, et l'ordinateur joue en face l'action qui la fait réussir (le coach ne dévoile pas l'action adverse). Ensuite, la suite du combat se joue librement, avec quelques conseils.
    - Combos (3 périodes) : Sprawl puis Simple jambe (Contre-temps), un tour de respiration (Sprawl contre une défense : personne ne marque, ce qui coupe la série de réussites et évite une tentative de tombé qui finirait l'essai), puis Matraquage et Ceinture arrière (Passage dans le dos).
    - Enchaînement : séquence 1 Matraquage, Ceinture arrière (combo), Parade ; séquence 2 Contre en 1re action, qui brise la chaîne adverse.
    - Durée infinie : contre Cocoach au niveau Rare, ordinateur normal (quel que soit son niveau réel) : Parade, Simple jambe, Feinte.
    - Carrière : Défense, Feinte, Attaque, Contre (les 4 règles de base).
    - Le lutteur d'essai et son adversaire ont 70 d'endurance (`tutoriel.enduranceEssai`) : rien ne rate pendant les tours guidés. Un test rejoue chaque tour guidé contre tous les lutteurs communs et vérifie qu'il réussit.
    - Une partie d'essai gagnée rapporte un **booster classique, une fois par tutoriel** ; pas de progression ni de quête. En durée infinie, Cocoach ne monte pas de niveau. Arène : ordinateur facile. Tournois d'essai : gratuits, 6 lutteurs pour l'individuel, l'équipe de Mon Club pour l'équipe, sans aucun gain ; refusés si un tournoi est en cours.
  - Un tutoriel n'est proposé que si le joueur a accès au style de jeu : sinon le bouton est grisé avec la raison (le tournoi par équipe demande Mon Club au niveau voulu avec 5 lutteurs).

### Collection

- Au départ, le joueur possède 5 cartes : la moins rare de chaque nation. La collection compte les exemplaires de chaque carte et son niveau de fusion.
- Boosters : classique (3 cartes, 75 % des boosters) ou rare (5 cartes, 25 %). Les cartes sont tirées parmi les 120, doublons possibles, avec des chances relatives de 50 (commune), 30 (rare), 15 (épique) et 1 (légendaire).
- Ouverture d'un booster : le paquet fermé s'affiche, puis chaque appui sur l'écran révèle une carte (avec « Nouvelle ! » ou « Double » et un éclat aux couleurs de sa rareté) ; à la fin, un récapitulatif montre toutes les cartes obtenues. Un bouton « Tout voir » passe directement au récapitulatif.
- Arène : 1 booster par victoire ; toutes les 2 défaites d'affilée, un booster de consolation. En ligne (mode collection) : 2 boosters par victoire (une victoire par abandon ne compte qu'après 5 tours).
- Tri de la collection : par rareté de base, par nation, par nombre de fusions (montées de rareté et étoiles) ou par rareté actuelle (fusion comprise). Le choix est gardé.
- La collection et les decks sont gardés dans le navigateur du téléphone, en attendant les comptes joueurs. Un mode test débloque toutes les cartes.

### Social

- Boutique : boosters à acheter en $ (classique 10 $, rare 25 $, épique 63 $ depuis le 28/11/2026).
- Booster épique (28/11/2026) : 8 cartes, dont au moins 1 épique et 3 rares (les 4 autres au hasard, comme d'habitude ; les cartes garanties sont révélées en dernier). Prix : 2,5 fois le booster rare (62,5 $, arrondi à 63 $). Aussi gagné : en bonus des 3 quêtes du jour réussies (à la place du booster rare), pour chaque nation battue en Carrière (en plus des 2 ou 3 boosters), pour un tournoi gagné (à la place du booster rare), et bientôt avec un code créateur. Paquet violet.
- Transfert de lutteur (anciennement « marchand ») : 3 offres par jour (les mêmes pour tous ce jour-là, renouvelées à minuit, heure du téléphone), chacune utilisable une fois. On reçoit une carte contre un double d'une autre carte de même rareté de départ (jamais le dernier exemplaire).
- Transfert entre amis (anciennement « échange ») : une salle avec un code de 4 lettres. Chacun voit les doubles de l'autre et propose un de ses doubles ; le transfert se fait quand les deux acceptent les mêmes cartes. Changer d'offre annule l'accord.
- Liste d'amis : chaque coach affronté en ligne ou avec qui on a fait un transfert y apparaît, avec les victoires, défaites et transferts.
- Sans serveur, ces transferts reposent sur la confiance entre amis ; Firebase les sécurisera.
- Pour les tests : un bouton « Ouvrir un booster (test) » dans la Collection.

### Revenir chaque jour (27/11/2026)

- Récompense du jour : un bloc « 🎁 Récompense du jour » en haut du menu tant qu'elle n'est pas récupérée, avec un calendrier de 7 cases (J1 à J7, cases faites cochées, case du jour entourée) et un bouton « Récupérer » qui ouvre la récompense comme un booster.
- Calendrier : J1 5 $, J2 1 booster, J3 10 $, J4 1 booster, J5 15 $, J6 1 booster + 5 $, J7 1 booster rare ; puis il recommence. Un jour manqué ne fait rien perdre : on reprend à la case suivante. Jours du téléphone (minuit, comme les quêtes du jour).
- Bonus de retour : après au moins 7 jours sans jouer, Darius accueille le joueur (« Content de te revoir, Coach … ! ») avec 1 booster rare dans la boîte à récompenses, une fois tous les 30 jours au plus.
- Notifications (28/11/2026) : proposées une seule fois, après la première récompense du jour (« Veux-tu un rappel quand ta récompense du jour est prête ? » : « 🔔 Oui, me prévenir » ou « Plus tard »), avant les scènes de l'histoire ; ensuite le réglage reste sous « Plus » → « Notifications » (activer, ne plus recevoir, explication si elles sont bloquées). Android : partout ; iPhone : seulement si le jeu est installé sur l'écran d'accueil (le jeu explique comment). Le jeu ne fait que s'inscrire (Firebase Cloud Messaging) ; c'est Corentin qui envoie, depuis la console Firebase : un rappel quotidien automatique et ses annonces (mode d'emploi dans `firebase/LISEZ-MOI.md`). Pas de notification personnalisée (il faudrait un serveur payant). Toucher une notification ouvre le jeu.
- Chiffres dans `REGLES.quotidien`.

### Inviter un ami : parrainage (27/11/2026)

- Bouton « 📨 Inviter un ami » : en haut de Social, dans le Classement (onglet Amis) et sous « Plus » en bas du menu. Il ouvre le menu de partage du téléphone (sinon, le lien est copié) avec un texte et le lien perso du joueur : `…/?parrain=<identifiant de coach>&de=<pseudo>`.
- Le lien perso fait entrer dans la bêta fermée sans code d'invitation.
- Nouveau joueur arrivé par ce lien : « Coach X t'invite ! » sur l'écran du pseudo, 1 booster rare de bienvenue dans la boîte à récompenses, et le parrain devient son ami. Un seul parrain par joueur.
- Le parrain est récompensé quand son ami crée un vrai compte (Google ou e-mail) : 1 booster rare par ami, plus une carte légendaire au hasard au 3e ami ; au plus 10 parrainages récompensés (les suivants deviennent quand même amis). Il le découvre au lancement suivant ou en ouvrant Social (bulle « Coach Y a rejoint le jeu grâce à toi ! »).
- Joueur qui jouait déjà et ouvre le lien d'un ami : pas de parrainage, mais les deux deviennent amis (chacun dans la liste d'amis de l'autre, donc dans le classement Amis).
- En ligne : Firestore `parrainages/<filleul>` (créé une seule fois, avec un vrai compte) et `amities/<joueur>_<ami>`. Le parrain ne cherche ces fiches que s'il a déjà partagé son lien.
- Chiffres dans `REGLES.parrainage`.

### Codes créateurs (28/11/2026)

- Pour les créateurs de contenu lutte (YouTube, TikTok, Instagram, clubs, athlètes). Champ « Code créateur » en bas de Social (sous « Inviter un ami ») et sous « Plus » → « Code créateur ».
- Chaque code s'entre une fois par joueur (un joueur peut entrer les codes de plusieurs créateurs) : il reçoit la **carte du créateur**, Champion du Monde (statistiques, actions et action de Champion du Champion du Monde de la nation choisie pour ce créateur ; le nom du créateur, son image s'il en a une, origine « Créateur »), et **un booster épique**, révélés comme un booster. Le « créateur soutenu » est le dernier code entré (« Tu soutiens … » dans Social).
- Codes créés par Corentin dans la console Firebase, sans mise à jour du jeu : Firestore `createurs/<CODE>` (nom, nation, image, actif). Un code désactivé ne marche plus, mais ceux qui l'ont utilisé gardent leur carte. Chaque soutien est noté (`soutiens/<joueur>_<CODE>`) pour compter les joueurs amenés par chaque créateur. Mode d'emploi : `firebase/LISEZ-MOI.md`.
- Les cartes des créateurs sont gardées dans la sauvegarde (avec la fiche du créateur), comme les cartes secrètes : jamais dans les boosters.
- À venir (étape 3) : le défi du créateur.

### Médailles et $

- Deux monnaies : les médailles mesurent la progression (jamais dépensées) ; les $ se dépensent (boosters, inscriptions aux tournois).
- Médailles : +1 par victoire contre l'ordinateur, +2 par victoire en ligne (dans les deux modes de salle ; boosters seulement avec nos collections).
- Toutes les 5 médailles gagnées : +10 $.
- Les médailles et les $ gagnés sont rangés dans le premier booster de la récompense, et révélés comme des cartes (médaille d'or, billet), puis dans le récapitulatif. Une récompense sans cartes s'ouvre quand même, dans un booster « Récompense ».
- Les récompenses en boosters restent (arène, en ligne, consolation, bonus du tutoriel).
- Médailles et $ s'affichent en haut du menu et de Social. Au départ : 0 médaille, 0 $.

### Classement (27/11/2026) et saison classée (28/11/2026)

- Tuile « Classement » du menu, à partir de l'étape 5 du mode histoire. On n'y entre qu'avec un compte (sinon : explication et bouton « Créer mon compte ») ; les points du mois comptent quand même et sont publiés dès la création du compte.
- Points de combat du mois : victoire contre l'ordinateur facile 1, normal 2, fort 4 ; +1 par tombé ; victoire en ligne contre un ami 6 (+1 par tombé) ; tournoi gagné +10 (en plus des combats du tournoi). Défaite : 0. Les tutoriels et parties d'essai ne comptent pas. Au plus 80 points par jour (« Plafond du jour atteint » en fin de combat). Remise à zéro le 1er du mois ; jours et mois en heure universelle (celle du serveur).
- Fin de combat gagné : « 🏆 +4 points de classement » sous le verdict (lien vers le classement).
- Écran : le mois et les jours restants, mes points, mon palier et une jauge jusqu'au palier suivant, mes points du jour ; trois onglets : 🌍 Tous (50 premiers, et « Ta place : 154e » si on est plus loin), 🤝 Amis (ma liste d'amis : coachs affrontés en ligne ou avec qui j'ai fait un transfert, s'ils ont un compte), Pays (joueurs de mon pays). Chaque ligne : rang, drapeau, pseudo, badge, points. « Comment gagner des points ? » résume le barème et les récompenses.
- Pays : choisi par le joueur (liste de pays avec drapeaux) dans « Mon compte » ou dans l'onglet Pays.
- Saison classée (28/11/2026) : une saison = un mois (saison 1 = novembre 2026). Les **divisions** remplacent les paliers de points : 🥉 Bronze → 🥈 Argent → 🥇 Or → 💠 Platine → 💎 Diamant → 👑 Maître. Chaque division a une barre de 100 : victoire contre l'ordinateur +10 (facile), +15 (normal), +25 (fort), +5 par tombé ; victoire en ligne +40 ; tournoi gagné +40 ; barre pleine : division suivante (celle du Maître reste pleine). Défaite en ligne : −15, jamais sous le début de la division ; les défaites contre l'ordinateur ne font rien perdre. Une victoire au-delà du plafond du jour (80 points) ne remplit pas la barre non plus. Le 1er du mois, on garde sa division et la barre repart de zéro. Fin de combat : « +4 points de classement · division +15 », « 🎉 Division Or atteinte ! » (avec une fanfare), ou « Défaite en ligne : division −15 ». La tuile Classement montre la division.
- Récompenses de fin de saison (si on a joué ; boîte à récompenses, au premier lancement de la saison suivante) : Bronze 1 booster classique ; Argent 1 booster rare ; Or 2 rares ; Platine 3 rares ; Diamant 3 rares + 1 carte épique au hasard ; Maître 3 rares + 1 carte légendaire au hasard ; 🏆 Top 10 du classement général : +1 booster rare (vérifié en ligne ; hors ligne, la récompense attend). Plus un **cadre de saison** (« Saison 1 · Or »), gardé pour toujours, à poser sur une carte de son choix (fenêtre de la carte dans la Collection, « Cadre de saison » ; « Aucun » pour l'enlever) : la carte prend la lueur de la division et un ruban avec le nom du cadre (aussi dans la grille de la Collection). Le badge de la division (ou 🏆) s'affiche à côté du pseudo toute la saison suivante.
- Passage aux divisions : un joueur qui avait déjà des points ce mois-ci commence dans la division de son palier (Argent dès 120 points, Or dès 300) ; un mois terminé avant les divisions est récompensé selon ses points (palier → division).
- En ligne : Firestore `classements/<mois>/joueurs/<identifiant>` (pseudo, pays, badge, points, points du jour). Les règles de sécurité vérifient le plafond de 80 points par jour, que les points ne baissent jamais, et que chacun n'écrit que sa ligne. Limite connue : le combat est calculé sur le téléphone, un tricheur décidé pourrait envoyer de faux combats sous ce plafond.
- Tous les chiffres sont dans `REGLES.classement` (fichier de configuration).

### Mon Club

- Tuile du menu, verrouillée jusqu'à 10 médailles. Ensuite, un niveau de plus toutes les 5 médailles : niveau 1 à 10, 2 à 15, 3 à 20, 4 à 25, 5 à 30… jusqu'au niveau 10 à 55 médailles (maximum ; jusqu'au 26/11/2026, le maximum était le niveau 5). Les médailles ne sont jamais dépensées.
- Une place par niveau (10 places au niveau 10). À partir du niveau 6, chaque nouveau niveau donne aussi 1 booster rare, à ouvrir dans Mon Club (annoncé par une bulle et par le bandeau du menu ; donné une seule fois, y compris pour un ancien joueur qui a déjà les médailles). Le niveau 10 ouvre la saison sportive. On y recrute ses propres lutteurs ; ce n'est qu'une place dans l'équipe : la carte reste utilisable partout. On peut libérer une place.
- Il faut un club de niveau 5 (5 lutteurs) pour le tournoi par équipe. Avec plus de 5 lutteurs, l'écran d'inscription les montre tous : les 5 premiers combattent, les autres sont remplaçants (on les fait monter avec les flèches).

### Tournois

- Tuile « Tournois » du menu. Contre l'ordinateur pour l'instant ; en ligne plus tard (avec Firebase).
- Chaque combat gagné dans un tournoi rapporte +1 médaille, même si le tournoi est perdu ; les médailles de fin s'ajoutent.
- Tournoi individuel à double tableau (inscription 5 $) : le joueur choisit un de ses lutteurs et le nombre de participants, de 6 à 15 (en dessous de 6, on complète avec des lutteurs de l'ordinateur). Les adversaires sont tirés au hasard, les places aussi.
  - Tableau principal de 8, 16, 32 ou 64 places selon le nombre de lutteurs : tant qu'un lutteur gagne, il avance jusqu'à la finale. Les places vides sont des exemptions : le lutteur tiré au sort en face passe directement au tour suivant (jamais deux places vides face à face).
  - Tableau des perdants : une première défaite avant les 1/2 finales y envoie. Il a deux côtés : A pour les perdants du haut du tableau principal, B pour ceux du bas. Dans chaque côté, les perdants d'un même tour s'affrontent ; les vainqueurs retrouvent ensuite les perdants du tour suivant (en ordre inverse, pour éviter de revoir le même adversaire), jusqu'à un vainqueur par côté. Une deuxième défaite élimine.
  - Finale : les deux vainqueurs des 1/2 finales. Le vainqueur est 1er, le perdant 2e.
  - 3e place : les deux perdants des 1/2 finales ne s'affrontent pas. Chacun joue une qualification pour la 3e place contre le vainqueur du tableau des perdants du côté opposé (perdant de la 1/2 finale du haut contre vainqueur du côté B, et inversement). Les deux gagnants jouent la petite finale : le vainqueur est 3e, le perdant 4e ; les deux perdants des qualifications sont 5es ex aequo. Un vainqueur du tableau des perdants ne peut donc pas faire mieux que 3e. Si un côté du tableau des perdants est vide (exemptions), le perdant de 1/2 finale opposé passe directement en petite finale.
  - Les autres sont classés selon le tour du tableau des perdants où ils sont éliminés (ex aequo dans un même tour).
- Gains du tournoi individuel : 1er 10 médailles, 15 $ et un booster épique (rare avant le 28/11/2026) ; 2e 6 médailles et 9 $ ; 3e 3 médailles et 5 $.
- Création par les administrateurs : l'écran d'aperçu a été retiré du jeu le 26/11/2026 ; ce sera un outil à part (pour toi et les clubs partenaires), avec les comptes en ligne (Firebase).
- L'ancienne compétition à 6 (deux tableaux de 3, repêchage croisé) est remplacée par le tournoi individuel ; une compétition déjà commencée peut être finie.
- Tournoi par équipe (inscription 10 $, Mon Club niveau 5 avec 5 lutteurs) : le joueur ordonne ses 5 lutteurs ; ils affrontent dans l'ordre les 5 lutteurs d'un club adverse. La première équipe à 3 victoires gagne : 10 médailles, 30 $ et un booster épique (rare avant le 28/11/2026). Défaite : aucun gain de fin.
- Bonus de nation (tournoi par équipe) : si l'équipe compte 3 lutteurs d'une même nation, toute l'équipe gagne +5 % d'endurance, de force et de récupération ; 4 lutteurs : +7 % ; 5 lutteurs : +10 %. Une fois sur deux, le club adverse est une « Sélection » nationale (3 à 5 lutteurs d'une même nation) qui profite du même bonus. Le bonus de chaque camp s'affiche à l'inscription, dans l'écran du tournoi et pendant le combat.
- Les combats sans le joueur sont simulés par l'ordinateur (au niveau choisi). Le tournoi en cours est gardé dans le téléphone : on peut le reprendre. Abandonner un combat le perd ; abandonner le tournoi perd l'inscription (les médailles gagnées restent).
- Les gains de fin sont montrés dans un booster (rare au vainqueur, « Récompense » sinon), avec les médailles gagnées pendant les combats.

### Saison sportive (mode à part)

- Depuis le 26/11/2026, c'est un mode à part : tuile « Saison sportive » du menu, sur toute la largeur, verrouillée avec la raison tant que Mon Club n'est pas au niveau 10. Elle se joue en même temps que le mode histoire (avant, elle s'ouvrait après l'étape 12 du mode histoire). Un joueur qui l'avait déjà ouverte garde sa progression, mais doit atteindre le niveau 10 pour y rejouer ; l'écran verrouillé lui rappelle où il en est. Mode histoire fini et club pas encore au niveau 10 : le bandeau du menu invite à faire monter Mon Club.
- 6 paliers, à valider dans l'ordre (écran « Saison sportive », bandeau du menu) :

| Palier | Format | Ordinateur | Objectif | Récompense du palier |
| --- | --- | --- | --- | --- |
| 1. Échanges interclub | Combats rapides (1 période) contre des lutteurs d'autres nations | Facile | 3 victoires | 2 boosters |
| 2. Championnat régional | 6 lutteurs, double tableau | Normal | 1re place | 2 boosters |
| 3. Championnat national | 15 lutteurs, double tableau | Normal | 1re place | 3 boosters |
| 4. Tournoi international | 30 lutteurs, double tableau | Normal ou fort selon le combat | Podium (top 3) | 3 boosters |
| 5. Championnats du monde | 40 lutteurs, double tableau | Fort | Podium (top 3) | 4 boosters |
| 6. Jeux Olympiques | 40 lutteurs, double tableau | Fort | Médaille d'or | 1 légendaire (une que le joueur n'a pas) + 3 boosters rares |

- Les compétitions se paient comme un tournoi individuel (5 $) et rapportent les gains habituels (+1 médaille par combat gagné, médailles et $ selon la place, booster rare au vainqueur), en plus de la récompense du palier. Une compétition ratée peut être retentée (nouvelle inscription). Les combats interclub rapportent comme un combat rapide (+1 médaille par victoire).
- Les tableaux vont jusqu'à 64 places (1/32 de finale) ; les places vides sont des exemptions tirées au sort.
- Récompenses des modes histoire : le booster s'ouvre carte par carte avec son récapitulatif ; une fois revenu sur l'écran du mode histoire ou de la saison, les cartes de la dernière récompense ne sont plus affichées.

### Quêtes journalières

- Chaque jour (à minuit, heure du téléphone), 3 quêtes tirées parmi celles du niveau de compte : une facile, une moyenne, une difficile. Tant qu'il reste des quêtes uniques à faire pour son niveau, l'une d'elles remplace la quête facile. Une quête non finie disparaît à minuit.
- Récompenses : facile 5 $ ; moyenne 10 $ + 1 médaille ; difficile 1 booster + 2 médailles ; les 3 quêtes du jour réussies : 1 booster épique en bonus (rare avant le 28/11/2026). Les quêtes uniques ont leur propre récompense.
- Bouton « Aller à la quête » (27/11/2026) : sous chaque quête pas encore faite, un bouton mène à l'écran où la faire (Carrière, Entraînement, boutique de Social, Collection, Fusion, Tournois, Mon Club, Combat entre amis, tutoriel). Pour les quêtes contre l'ordinateur fort, en format Enchaînement ou en durée infinie, l'Entraînement s'ouvre avec ce réglage déjà choisi. Le bloc « Quêtes du jour » du menu reste compact et ouvre l'écran des quêtes.
- Changer une quête : une seule fois par jour, 5 $, contre une autre quête de même difficulté. Les quêtes uniques ne peuvent pas être changées.
- Affichage : encart « Quêtes du jour » dans le menu (progression), écran « Quêtes du jour » (récompenses, changement, boosters à ouvrir), bulle quand une quête est réussie.
- Quêtes répétables (niveau minimum) :
  - faciles : lancer un combat dans l'arène (1), gagner 1 combat contre l'ordinateur (1), jouer 1 combat rapide (1), ouvrir 1 booster (1), réussir 3 feintes (1), réussir 2 contres qui marquent (1), régler les actions d'un lutteur (2) ;
  - moyennes : gagner 3 combats contre l'ordinateur (1), gagner avec un lutteur d'une nation tirée au hasard (1), marquer 20 points au total (1), gagner par tombé (2), gagner un combat rapide par 10 points d'écart (2), gagner 2 combats en auto (3), faire une fusion (3), avancer de 2 adversaires dans l'arène (4) ;
  - difficiles : gagner contre l'ordinateur fort en jouant soi-même (2), gagner avec une carte commune contre l'ordinateur normal ou fort (3), podium d'un tournoi individuel (4), gagner un tournoi individuel (5), gagner un duel d'un tournoi par équipe (5), battre le champion d'une nation dans l'arène (6), gagner un combat en ligne contre un ami (6), gagner 3 combats d'affilée contre l'ordinateur fort (8 ; une défaite contre le fort remet la série à zéro).
  - ajoutées le 26/11/2026 : jouer 1 combat en format Enchaînement (facile, 1) ; réussir 3 combos (moyenne, 1) ; briser 2 fois la chaîne adverse (moyenne, 2) ; gagner un combat après avoir pris son second souffle (moyenne, 2) ; gagner un combat en durée infinie (difficile, 3) ; gagner 3 combats en format Enchaînement (difficile, 3). Combos, chaînes brisées et souffle ne comptent pas en combat auto. Puis : battre Cocoach (moyenne, 2) ; tenir 30 tours en durée infinie (moyenne, 2) ; gagner un combat en durée infinie qui dure 40 tours ou plus (difficile, 4 ; avant le 26/11/2026 : « avec l'épuisement réglé au tour 40 ou plus »).
- Quêtes uniques (niveau minimum, récompense) : finir le tutoriel (1, 1 booster) ; posséder 30 cartes différentes (1, 1 booster) ; première étoile (2, 20 $) ; ouvrir Mon Club (3, 1 booster rare) ; premier combat auto (3, 10 $) ; premier ami (4, 1 booster) ; remplir les 5 places de Mon Club (5, 1 booster rare) ; bonus de nation de +10 % (5, 2 boosters) ; une carte de chaque nation (6, 1 booster rare) ; légendaire débloquée par les fragments (7, 50 $) ; 60 cartes différentes (8, 2 boosters rares) ; une carte Champion du Monde (10, 100 $) ; un style de carte (10, 2 boosters rares) ; les 120 cartes (12, 1 Champion du Monde au hasard) ; ajoutées le 26/11/2026 : première action de Champion, c'est-à-dire une carte montée Champion du Monde par fusion (3, 1 booster rare) ; réussir les 4 combos différents, sur plusieurs combats (2, 2 boosters) ; faire monter Cocoach au niveau Champion du Monde (4, 2 boosters rares). Les quêtes uniques sur la collection sont validées dès qu'elles apparaissent si c'est déjà le cas.

### Saisons à répétition et cartes Champion du Monde

- Une saison finie, le joueur peut en commencer une nouvelle (écran Saison, bandeau du menu). La 1re saison se termine aux Jeux Olympiques ; les suivantes aux championnats du monde ; les JO reviennent toutes les 4 saisons (saisons 1, 5, 9…), comme dans la vie réelle.
- Fin de saison : en plus de la récompense du dernier palier, des cartes Champion du Monde, au hasard : 5 exemplaires d'une même carte, ou 5 cartes différentes. Une saison avec les JO donne cette récompense deux fois.
- Le nombre de saisons terminées s'affiche à côté du niveau de compte (« 🏆 2 »).
- Les scènes de la saison reviennent à chaque nouvelle saison ; sans JO, les championnats du monde et la fin de saison ont leurs propres scènes.
- 12 cartes Champion du Monde, une par nation, rareté de base « Champion du Monde » (noms inventés, tous différents de ceux des 120 lutteurs : le 26/11/2026, les Champions du Kazakhstan et d'Azerbaïdjan, qui portaient le nom d'un lutteur de leur nation, deviennent Nurbol Zhanuzakov et Ilkin Mammadzade ; style, actions et récupération de la légendaire de leur nation, avec plus d'endurance et de force). Équilibrage par simulation : environ 65 % de victoires (fourchette 62,5 à 67,5 %), contre environ 60 % pour une légendaire.
  - Verrouillées : jamais dans les boosters, ni dans l'arène, ni chez les adversaires. On les obtient en fin de saison, ou dans la boutique (Social) à 200 $ l'exemplaire, autant de fois qu'on veut.
  - Elles sont déjà au niveau Champion du Monde : leurs doubles servent à gagner des étoiles (actions moins chères) et des styles de carte, par la fusion.
  - Dans la collection, elles ont leur propre groupe : tout en bas tant que le joueur n'en possède aucune ; en haut dès la première (seulement avec les tris « Rareté de base » et « Rareté actuelle » ; tout en bas avec les autres tris), avec seulement les cartes possédées et un bouton « Voir plus » pour afficher celles à gagner (comme les autres groupes). Le compte « x/120 cartes » ne les inclut pas.
- Collection : cartes affichées en miniature (3 par ligne sur téléphone) ; dans chaque groupe, seules les cartes possédées sont affichées ; les cartes à gagner sont cachées derrière un bouton « Voir plus (N à gagner) », puis « Voir moins » pour les replier (sauf le groupe « À gagner » du tri par fusions). Le combat rapide contre l'ordinateur reste ouvert dès le début (seul le combat auto attend le niveau 3).

### Scènes de dialogue (modes histoire)

- À chaque étape du mode histoire et à chaque palier de la saison, une petite scène façon BD (2 à 4 bulles) présente l'objectif. Elle s'affiche une fois, au menu ou dans l'écran du mode, et peut être revue (« Revoir la scène »).
- Personnages : **Darius** (Darius Westrell), le mentor, ancien champion du monde poids lourd américain devenu directeur technique, et **Cocoach**, le coach rival qu'on recroise jusqu'aux Jeux Olympiques. Darius remplace Philippe depuis le 27/11/2026 (même histoire, nouveau personnage).
- Ton de Darius : bienveillant et motivant ; chaque scène donne un objectif clair (« Objectif : … ») ; il raconte parfois une anecdote de sa carrière quand le dialogue s'y prête.
- Portrait de Darius : provisoire, découpé dans les illustrations ChatGPT de sa carte (`public/darius/coach.webp`) ; à remplacer par des portraits de coach faits exprès (buste, tenue de coach, quelques expressions), au même nom de fichier.
- Scènes : une par étape (18), une quand le mode histoire est terminé (Darius offre sa carte), une à l'ouverture de la saison, une par palier de la saison (6) et une finale (champion olympique).

### Moments à partager (27/11/2026)

- À certains moments, un bouton « 📸 Partager » crée une **affiche façon manga** (format story, 1080 × 1920) : grand titre penché (« TOMBÉ ! », « LÉGENDAIRE ! »…), la carte du lutteur dans le cadre de sa rareté, une phrase sur l'exploit, « Coach <pseudo> », le nom et le lien du jeu.
- Moments : victoire par **tombé** contre l'ordinateur ; **exploits** (nation battue en Carrière, Cocoach battu à un nouveau niveau, podium ou titre en tournoi individuel et dans la saison sportive, médaille d'or olympique) ; **carte légendaire** obtenue pour la première fois ; **carte secrète** (Darius, Cocoach) débloquée. Jamais pendant un tutoriel ou une partie d'essai.
- Le bouton ouvre le menu de partage du téléphone (WhatsApp, Instagram, Messenger, SMS…) avec l'image et un texte prêt, suivi du **lien simple** du jeu (sans code d'invitation). Sans menu de partage (ordinateur), l'image est téléchargée.
- Pas encore : le combat entre amis (son écran de fin est à part).

### Cocoach : expressions, rival puis ami (27/11/2026)

- Caractère : compétiteur, taquin, stratège ; il défie le joueur et le pousse à se dépasser.
- Dialogues : chaque réplique de Cocoach a une expression (Neutre, Content, Malin, Vaincu, Vainqueur, Arrogant, Méfiant), montrée par son portrait (`public/cocoach/expressions/`). Sans expression : Neutre.
- Rival jusqu'à la première médaille d'or aux Jeux Olympiques : ton moqueur, cercle du portrait rouge.
- Le jour de cette médaille, une scène à part (montrée une fois) : vaincu, il reconnaît le joueur, lui offre sa carte et devient un **ami qui le challenge**. Ensuite, les scènes de la saison ont une version « ami » (complice mais toujours compétitif) et son cercle devient doré.
- Le rival de la durée infinie prend l'illustration de son niveau (Rare, Épique, Légendaire, Champion du Monde) ; l'encart du rival à l'Entraînement montre son illustration de présentation (bras croisés).
- Illustrations de carte : définitives depuis le 27 novembre 2026, grand format (1024 × 1536, `public/cocoach/cartes/`). Leur bandeau de rareté imprimé en bas reste hors du cadre de la carte (cadrage sur le haut de l'image), pour ne pas doubler la rareté écrite par le jeu. Expressions : 512 × 512. Fiche personnage, planche de contrôle et anciennes images : `direction-artistique/cocoach/` (jamais affichées dans le jeu).
- Le lutteur de test du mode développeur s'appelle désormais « Cocoach (test) ».
- À faire lors de la fusion de la branche graphique (`integration-graphique-v1`) : elle contient d'anciennes images de Cocoach, à remplacer par celles-ci ; les cartes verticales ne doivent pas dessiner leur propre étiquette de rareté par-dessus le bandeau de Cocoach.

### Cartes secrètes : présentation (27/11/2026)

- Cartes « pleine illustration » (style des cartes « full art ») : sur les cartes de Darius et de Cocoach, l'illustration couvre toute la carte ; le nom, les statistiques, les actions et les déblocages passent par-dessus, sur des pavés sombres translucides pour rester lisibles. Images : `public/darius/carte-pleine.webp` et `public/cocoach/cartes/champion-pleine.webp` (sans le bandeau de rareté, qui passait sous les boutons).
- Collection : le groupe Champions du Monde compte les 12 Champions à part et ajoute les cartes secrètes gagnées (« 2/12 · 2 secrètes ») ; une carte secrète non gagnée n'apparaît pas.
- Emblème du style « Ceinture » (et des autres styles) des cartes Champion du Monde : plus transparent, pour ne plus cacher les chiffres.

### Carte secrète de Cocoach (27/11/2026)

- Easter egg : la carte **Cocoach**, Champion du Monde de naissance (style du rival : technicien des feintes et des ceintures, Europe ; endurance 59 (60 avant les rééquilibrages du 28/11/2026), force 175, récupération 44 % ; action de Champion : Changement de niveau). Différente du rival de la durée infinie et du lutteur de test.
- **Première médaille d'or aux JO** : la carte, avec **4 étoiles** posées au hasard sur 4 actions différentes (−1 au coût de chacune), tirées une fois pour toutes.
- **Chaque médaille d'or aux JO suivants** : un exemplaire de plus, qui sert de double pour la fusion (étoiles et styles de carte, règles habituelles : 5 doubles par étoile, 3 étoiles au plus par action).
- Jamais dans les boosters, l'arène, la boutique, les fins de saison ni les quêtes. Jouable partout ; visible dans la collection (groupe Champions du Monde) une fois gagnée.
- Équilibrage (simulation du 27/11/2026, sans ses étoiles) : 65,8 % de victoires, dans la fourchette des Champions du Monde (62,5 à 67,5 %) ; remesuré après la règle de priorité du combo et le rééquilibrage de l'étape 6 : 65,1 %.

### Carte secrète de Darius (27/11/2026)

- Easter egg : la carte **Darius Westrell**, Champion du Monde de naissance (style « Lutteur de pression, très physique », actions de la légendaire des USA, action de Champion : Tour de hanche ; endurance 70, force 165).
- Gagnée **uniquement** en terminant le mode histoire (étape 18), en plus de la légendaire offerte. Jamais dans les boosters, l'arène, la boutique, les fins de saison ni les quêtes. Un seul exemplaire.
- Elle arrive avec **2 étoiles**, posées au hasard sur 2 de ses actions différentes (−1 au coût de chacune), tirées une fois pour toutes le jour où on la gagne.
- Jouable partout (carrière, entraînement, tournois, Mon Club, combat entre amis). Elle n'apparaît dans la collection (groupe Champions du Monde) qu'une fois gagnée.
- Équilibrage (simulation du 27/11/2026, sans ses étoiles) : 64,9 % de victoires, dans la fourchette des Champions du Monde (62,5 à 67,5 %) ; remesuré après la règle de priorité du combo et le rééquilibrage de l'étape 6 : 67,0 % (toujours dans la fourchette, près du haut).
- Illustration provisoire : `public/darius/carte.webp`, recadrée dans son illustration Champion du Monde.
- À faire lors de la fusion de la branche graphique (`integration-graphique-v1`) : la carte épique `usa-7` y porte le nom « Darius Westrell » et utilise ses images. Il faudra lui donner un autre nom et d'autres images, pour qu'il n'y ait qu'un seul Darius.

### Outils de test (à retirer avant le lancement public)

- Mode histoire et saison : un bouton « ⏭ Passer à l'étape suivante (test) » / « Passer au palier suivant (test) » valide l'étape ou le palier en cours comme s'il était réussi, avec sa récompense et sa scène de dialogue, pour parcourir toute l'histoire.
- Lutteur de test **Cocoach (test)** (nommé « Cocoach » avant le 27/11/2026) : déjà Champion du Monde, avec les meilleures statistiques du jeu (le maximum des 120 lutteurs pour l'endurance, la force et la récupération, plus le bonus de Champion du Monde). Il apparaît en tête des listes de choix contre l'ordinateur (arène, combat rapide, tournoi individuel, saison), mais pas dans la collection, les boosters, l'arène adverse ni Mon Club, et il ne peut pas être choisi en ligne.
- Collection, réglages de test : « +10 médailles », « +50 $ », mode test (toutes les cartes), ouvrir un booster.
- Bonus du pseudo « Coco » (1000 $) et bouton « Passer le combat et gagner » : réservés au mode développeur (`?dev`) depuis la bêta (26/11/2026), car n'importe quel testeur pourrait choisir ce pseudo.

### Salle en ligne : retour d'un joueur

- Si un joueur quitte la salle puis la rejoint avec le code (il arrive alors comme invité, même s'il l'avait créée), les deux joueurs se retrouvent avec le même rôle. Le jeu le détecte et rétablit tout seul un hôte et un invité (départage par un jeton tiré au hasard) ; celui qui change de rôle rechoisit son lutteur, et le combat démarre normalement. S'il devient l'hôte, la salle repasse en mode de base, sans combat rapide.

### Combat automatique

- À partir du niveau de compte 3, un bouton « ⚡ Combat auto » apparaît à côté de chaque bouton de combat contre l'ordinateur (arène, combat rapide, tournois, revanche, adversaire suivant). Avant, il est affiché verrouillé.
- L'ordinateur choisit alors les actions du lutteur du joueur (avec ses 4 actions réglées) et joue tout le combat d'un coup : le joueur arrive directement sur la page de fin (verdict, score, journal tour par tour), avec le booster, les médailles et les $ s'il doit en gagner.
- Force de l'auto selon le niveau de compte : au niveau 3, il joue comme l'ordinateur normal ; ensuite, chaque décision est prise de plus en plus souvent comme l'ordinateur fort, jusqu'à toujours jouer « fort » au niveau 10.
- Au-dessus du niveau 10, contre l'ordinateur, l'auto gagne environ 3 combats sur 4 : contre l'ordinateur fort, son lutteur reçoit +14 % d'endurance, de force et de récupération (mesuré : environ 75 % de victoires) ; contre le normal (environ 80 %) et le facile (environ 92 %), il dépasse déjà 3 sur 4 sans bonus. En ligne, jamais de bonus.
- En ligne : chaque joueur peut cocher « Combat automatique » avant de choisir son lutteur. Le combat se joue en automatique seulement si les deux l'ont coché (sinon, combat normal). Les deux téléphones calculent le même combat, l'ordinateur jouant pour chacun selon son niveau de compte.
- Depuis le 26/11/2026, l'auto n'est permis que contre un lutteur déjà battu au moins une fois en jouant soi-même (liste gardée dans la sauvegarde ; les combats en ligne ne comptent pas). Partout contre l'ordinateur : Carrière, Entraînement, tournois, interclub, revanche, adversaire suivant. Sinon, le bouton est grisé : « Auto : bats-le d'abord à la main ». À l'Entraînement et en interclub, où l'adversaire est tiré au hasard, l'auto le tire parmi les lutteurs déjà battus à la main ; contre Cocoach, il faut l'avoir battu à la main. Exception : le combat auto entre amis reste comme avant (l'adversaire n'est pas connu avant le choix).
- Une victoire en automatique compte pour tout (médailles, boosters, mode histoire), sauf l'étape 9 du mode histoire (« Battre l'ordinateur fort »), à gagner à la main.

### Mode histoire

- Un parcours de 18 étapes qui fait découvrir tout le jeu (12 à l'origine, 6 ajoutées le 26/11/2026). L'objectif en cours (avec sa progression) est toujours affiché en haut du menu ; l'écran « Mode histoire » montre les étapes faites, l'étape en cours avec un guide pas à pas et un bouton vers le bon écran, et les étapes verrouillées.
- Les étapes se débloquent dans l'ordre : il faut valider l'étape 1 pour passer à la 2, etc. Une étape ne se valide qu'une fois débloquée ; ce qui a été fait avant ne compte pas, sauf pour les étapes 3, 6, 7 et 11 : elles sont validées dès leur déblocage si le joueur remplit déjà la condition (Mon Club ouvert, 3 lutteurs d'une même nation dans Mon Club, une nation battue dans l'arène, arène terminée).
  1. Gagner 3 combats contre des lutteurs de 3 nations différentes (tous les combats comptent : ordinateur, arène, combat rapide, tournoi, en ligne) : 1 booster.
  2. Gagner un tournoi individuel : 1 booster.
  3. Ouvrir Mon Club : 1 booster.
  4. Gagner un tournoi par équipe : 1 booster.
  5. Gagner un combat rapide par tombé ou par 10 points d'écart : 2 boosters.
  6. Avoir au moins 3 lutteurs d'une même nation dans Mon Club : 2 boosters (validée dès le déblocage si c'est déjà le cas).
  7. Battre une nation complète dans l'arène : 2 boosters.
  8. Faire monter une carte au niveau épique ou plus par une fusion : 2 boosters.
  9. Battre l'ordinateur fort (n'importe quel combat, arène et tournois compris, mais pas en combat automatique) : 3 boosters.
  10. Gagner un combat en ligne contre un ami : 3 boosters.
  11. Terminer l'arène en battant toutes les nations : 3 boosters.
  12. Gagner un tournoi individuel sans perdre un combat (donc sans passer par le tableau des perdants) : 3 boosters. (Jusqu'au 26/11/2026, cette étape ouvrait la saison sportive.)
  13. Le tacticien : réussir 2 combos dans un même combat (pas en combat auto ; gagner n'est pas obligatoire) : 2 boosters.
  14. L'enchaîneur : gagner un combat en format Enchaînement : 2 boosters.
  15. Jusqu'au bout : gagner un combat en durée infinie : 3 boosters.
  16. Le rival : battre Cocoach une première fois (combat rapide, durée infinie ; pas en combat auto) : 2 boosters.
  17. Rival de taille : battre Cocoach au niveau Légendaire ou plus : 3 boosters.
  18. Le sommet : battre Cocoach Champion du Monde : 3 boosters et une carte légendaire au hasard parmi celles que le joueur n'a pas ; s'il les a toutes, une légendaire au hasard (un double).
- Anciennes sauvegardes : un joueur qui avait fini les 12 étapes garde sa saison et commence l'étape 13 ; la scène d'ouverture de la saison (ancienne clé h12, nouvelle clé hfin) n'est pas remontrée. Il recevra une seconde légendaire à l'étape 18.
- Quand la saison est ouverte et que l'histoire n'est pas finie, l'accueil montre les deux bandeaux : la saison, puis l'étape du mode histoire en cours.
- Les boosters des étapes sont des boosters classiques. Une bulle annonce chaque étape validée ; la récompense s'ouvre dans l'écran du mode histoire. Le mode histoire ne donne pas de médailles.
- Le tutoriel présente les modes de jeu et se termine sur le mode histoire ; la page des règles décrit tous les modes.


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

### Langue

- Le jeu est entièrement en français, noms des actions compris (les mêmes pour toutes les nations ; les anciens noms locaux, comme « Double Leg Takedown », sont retirés).
- Plus tard : un choix de langue sur l'écran d'accueil traduira tout le jeu (noms des actions et descriptions des lutteurs compris ; les noms des lutteurs restent tels quels). On commencera par le français et l'anglais, puis les langues des nations, une par une, avec relecture par quelqu'un qui parle la langue.

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
| Contre contre attaque | Depuis le 25/11/2026 (soir) : seule la précision compte. Un contre qui passe son tirage de précision prend l'attaque, renvoie ses points et l'attaquant subit un déséquilibre ; un contre raté laisse passer l'attaque. (Avant : il fallait plus d'endurance ou plus de force que l'attaquant.) Exceptions : actions spéciales (voir Action spéciale), Changement de niveau (attaque incontrable), Sortie de zone (prise 1 fois sur 2), Relance (moitié des points) |
| Même famille | Le lutteur qui a au moins le double d'endurance gagne, sinon personne ne marque. Depuis le 26/11/2026 : l'action qui termine un combo (Passage dans le dos, Contre-temps, Enchaînement aux jambes, Esquive et contre) et l'attaque spéciale sont prioritaires et ne sont pas bloquées par la même famille (elles gardent leur tirage de précision). Si les deux lutteurs ont une priorité, celui qui a la meilleure chance de réussite du tour l'emporte, puis le plus fort ; à égalité, la règle habituelle |

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
- Attaque réussie : 2, 4 ou 5 points selon l'action (voir Chiffrage) ; +2 points avec au moins le double d'endurance.
- Supériorité technique : la période (ou le combat rapide) est gagnée dès que l'écart atteint 10 points, à la fin du tour. Le score n'est pas plafonné : une grosse prise peut finir la période à plus de 10 d'écart (par exemple 13-0).
- Bonus de feinte : une feinte réussie donne +2 points à la prochaine attaque ou au prochain contre réussi, pendant 2 tours. Le bonus sert une seule fois ; une attaque ou un contre raté ne le consomme pas ; un contre réussi en profite même sans points de base (contre une défense) ; une nouvelle feinte réussie le relance pour 2 tours. Un contre renvoie la valeur de l'attaque adverse, bonus de l'attaquant compris (l'attaquant garde alors son bonus).
- Contre réussi : il renvoie les points de l'attaque adverse.

### Gameplay 2 : identité des actions, combos, second souffle (25/11/2026)

Coûts : ils suivent la puissance (voir Chiffrage).

Chaque action a son caractère :

- Simple jambe : le Matraquage ne baisse pas sa précision.
- Grosse attaque (5 points) bloquée par une défense : l'attaquant perd 3 d'endurance de plus.
- Parade : bloque l'attaque et fait perdre 3 d'endurance à l'attaquant.
- Esquive : ne fait pas récupérer d'endurance ; une attaque esquivée donne l'initiative 1 fois sur 2.
- Sprawl : 2 points, 4 sur une Double jambe.
- Relance : face à une défense, 2 points ; face à une attaque, ne renvoie que la moitié des points (arrondie au-dessus). La Relance spéciale renvoie tout.
- Défense : inchangée (bloque et fait récupérer).

Nouvelles actions (actions de Champion) : chaque carte en a une, débloquée au niveau Champion du Monde (de naissance, ou par fusion), en plus de ses 8 actions, au coût normal de l'action. Le lutteur de test Cocoach a toutes les actions :

| Action | Famille | Coût | Points | Effet |
| --- | --- | --- | --- | --- |
| Bras tiré | Attaque | 4 | 2 | L'attaque du tour suivant coûte 2 de moins |
| Sortie de zone | Attaque | 3 | 1 | Un contre (non spécial) ne la prend qu'une fois sur 2 |
| Tour de hanche | Attaque | 6 | 4 | Ne rate jamais avec plus de force que l'adversaire |
| Cravate | Contre | 6 | Renvoi | Sur une attaque aux jambes (simple ou double), 5 d'endurance en plus pour l'attaquant |
| Changement de niveau | Feinte | 3 | 0 | Pas de bonus de +2, mais l'attaque du tour suivant ne peut pas être contrée (sauf contre spécial) |

Répartition selon la rareté de départ et le style : communes et rares reçoivent une action simple (Sortie de zone pour les poids lourds, puissants, lutteurs de pression et défenseurs ; Bras tiré pour les autres) ; épiques et légendaires une action forte (Tour de hanche pour les poids lourds, puissants et techniciens « ceinture et relances » ; Cravate pour les contre-attaquants, défenseurs, équilibrés et techniciens précis ; Changement de niveau pour les autres). Sur la carte, l'action de Champion s'affiche avec les déblocages ; elle compte pour les étoiles (9 actions × 3 = 27 étoiles, un style toutes les 6,75 étoiles).

Champions du Monde de naissance : USA et Kirghizistan Changement de niveau ; Russie, Kazakhstan et Afrique Sortie de zone ; Japon et Azerbaïdjan Bras tiré ; Iran, Ouzbékistan et Europe Cravate ; Géorgie et Turquie Tour de hanche.

Combos (deux actions réussies à la suite ; le bouton de l'action qui déclenche un combo s'allume en vert avec « Combo ! ») :

- Passage dans le dos : Matraquage puis Ceinture arrière, +2 points.
- Contre-temps : Sprawl puis n'importe quelle attaque, qui ne peut pas rater.
- Enchaînement aux jambes : Simple jambe puis Double jambe, +1 point et 2 d'endurance en moins.
- Esquive et contre : Esquive puis une action de contre qui prend l'attaque, +2 points.
- Le combo de tombé (3 actions réussies dont 2 attaques) reste en place.

Second souffle : une fois par combat, sous 25 d'endurance (même à 0), l'action « Souffler » (gratuite, elle ne fait rien d'autre) rend 15 d'endurance. Si l'adversaire attaque pendant ce tour, son attaque passe et il marque 1 point de plus. L'ordinateur souffle sous 12 d'endurance.

Affichage : chaque bouton montre sa chance de réussite quand elle est sous 100 %, son coût réel du tour (en vert s'il est réduit), et le combo possible. Le contour de la barre d'endurance devient orange puis rouge avec la fatigue.

Équilibrage : les 120 cartes et les 12 Champions du Monde ont été rééquilibrés par simulation (2 500 combats par carte) en ajustant l'endurance. Après la nouvelle règle du contre (25/11/2026, soir) : 119 cartes dans la fourchette de leur rareté, 1 à un point près ; Champions du Monde entre 62,5 et 66,4 %. Combat auto expert contre l'ordinateur fort : 74 %.

Écran de combat (25/11/2026, soir) : tout tient sur une page, sans défiler. En haut, le score et les barres d'endurance ; au milieu, la case du dernier tour (les deux actions, le mot du résultat et les points marqués) ; en bas, des boutons d'action plus petits (effet sur une ligne). Le détail de tous les tours s'ouvre comme un chat (bouton « Récap » avec le nombre de tours pas encore lus) : un panneau monte du bas de l'écran, avec une bulle par événement, à droite pour son lutteur, à gauche pour l'adversaire, au centre pour le reste. L'écran de fin garde la liste complète « tour par tour ».

### Avantages

- **Initiative** : réservée au lutteur qui a feinté. Après une feinte réussie sur une défense, 2 chances sur 3 d'obtenir l'initiative au tour suivant : le joueur voit 2 actions de l'adversaire, dont celle qu'il a choisie, et peut changer son action ou non.
- **Déséquilibre** : face à un contre réussi, l'attaquant perd 5, 10 ou 15 % de son endurance selon que son attaque valait 2 points, 4 points, ou 5 points et plus.
- **Combo** : trois actions réussies dont deux attaques permettent de tenter un tombé. Réussite : 3 chances sur 5 avec plus d'endurance, 2 sur 5 à égalité, 1 sur 5 avec moins. Si la tentative réussit, le lutteur menacé annonce pile ou face : s'il devine juste, il s'en sort.
- **Récupération** : une défense réussie (sauf l'Esquive) rend 5 % d'endurance sous la moitié de la barre, 10 % au-dessus.
- **Pression** : trois tours d'affilée sans attaque ni contre donnent 1 point de pénalité à l'adversaire.

### Action spéciale

- Affichage en combat : pas de bouton à part. Quand l'action spéciale est disponible, l'action de la famille spéciale brille en orange avec une ★ ; en la touchant, une bulle demande « Activer l'action spéciale ? » (version spéciale, avec son effet et son coût, ou version normale, ou annuler). Cela laisse plus de place à l'écran pour le combat.
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

Version d'origine, remplacée par le rééquilibrage de l'étape 4 (voir Les 120 lutteurs) : chaque personnage de départ avait le même budget, endurance + force ÷ 5 + récupération = 165. La force reste sous 250 pour laisser de la marge aux futures cartes.

| Lutteur | Endurance | Force | Récupération entre périodes |
| --- | --- | --- | --- |
| USA | 100 | 150 | 35 % |
| Russie | 90 | 175 | 40 % |
| Europe | 85 | 175 | 45 % |
| Afrique | 75 | 225 | 45 % |
| Japon | 70 | 175 | 60 % |

| Actions | Famille | Coût en endurance | Points |
| --- | --- | --- | --- |
| Feinte, changement de niveau | Feinte | 3 | 0 (feinte : +2 sur la prochaine attaque ou le prochain contre réussi, pendant 2 tours) |
| Matraquage | Feinte | 4 | 0 |
| Défense, parade, esquive | Défense | 3 | 0 |
| Sprawl | Défense | 4 | 2 (4 sur une double jambe) |
| Contre, relance, cravate | Contre | 6 | Points de l'attaque renvoyés (relance : la moitié) |
| Sortie de zone | Attaque | 3 | 1 |
| Attaque de base, simple jambe, bras tiré | Attaque | 4 | 2 |
| Double jambe, ceinture arrière, bras roulé (bras à la volée), tour de hanche | Attaque | 6 | 4 |
| Grande projection, german suplex | Attaque | 8 | 5 |

Depuis le 25/11/2026 (2e version), le coût suit la puissance : attaque à 1 point 3, à 2 points 4, à 4 points 6, à 5 points 8 ; défense 3 (Sprawl 4), contre 6, feinte 3 (Matraquage 4). Une action débloquée par fusion coûte 1 de moins ; chaque étoile (Champion du Monde) retire encore 1, sans descendre sous 1.

Récupération en combat : tous les 2 tours de chaque période (tours 2, 4, 6, 8, 10), chaque lutteur récupère 0,1 × sa récupération × sa barre d'endurance (par exemple 2,3 pour une barre de 57 et une récupération de 0,4) ; sa chance de réussite est sa précision du moment. Avant le 25/11/2026 : 5 % de l'endurance actuelle.

Le coût est payé même si l'action échoue. Un jeu varié coûte environ 50 d'endurance par période, ce qui permet de tenir jusqu'à la 3e période ; enchaîner les attaques fait passer sous 50 d'endurance dès la 3e période, avec une précision dégradée.

### Endurance

- Chaque lutteur a deux statistiques d'endurance : la taille de sa barre et sa vitesse de récupération entre les périodes.
- Chaque action coûte plus ou moins d'endurance selon sa puissance, ce qui évite de répéter les grosses attaques.
- À 0 d'endurance, la seule action possible est « Lutte » : 1 chance sur 10 de marquer 1 ou 2 points (tirés au hasard), ou « Souffler » si le second souffle n'a pas encore servi.
- Après 3 tours sans endurance, le lutteur a 100 % de chance de se faire tomber.

### Ordinateur (3 niveaux)

L'ordinateur se distingue seulement par sa façon de choisir : mêmes cartes que le joueur, aucun bonus de stats. Il ne voit jamais l'action du joueur avant qu'elle soit jouée, sauf les 2 actions montrées par l'initiative (comme pour le joueur).

- Facile : au hasard, sans action spéciale, et 45 % du temps l'action la moins bonne (comme un débutant qui se trompe) ; avec l'initiative, change d'action 1 fois sur 4.
- Normal : au hasard ; avec l'initiative, change d'action 1 fois sur 2.
- Fort : il retient les 6 dernières familles d'actions du joueur et estime ce que rapporte chacune de ses actions (points, tombé, endurance, passivité) face à ce que le joueur joue d'habitude ; il joue la meilleure 9 fois sur 10. Avec l'initiative, il joue l'action qui contre celle du joueur 3 fois sur 4. Varier ses actions ou feinter permet de le piéger.
- Mesures (`npm run niveaux`, 2 000 combats par case, cartes au hasard, 25/11/2026 après le gameplay 2 et la règle du contre) : joueur au hasard (débutant) 65 % contre le facile, 51 % contre le normal, 26 % contre le fort ; joueur qui calcule comme l'ordinateur fort (expérimenté) 50 % contre le fort. Le joueur simulé prend son second souffle comme l'ordinateur. Un joueur humain expérimenté devrait se situer entre les deux, vers 40 %.
- Le choix du facile au lieu du hasard pur est voulu : un ordinateur qui joue entièrement au hasard laisse 50 % de victoires à un joueur au hasard, pas 70 %.

### Arène par nation

- L'ordinateur représente une nation à la fois, dans cet ordre (de la plus abordable à la plus forte) : Afrique, Ouzbékistan, Kirghizistan, Iran, Géorgie, Turquie, Europe, USA, Russie, Azerbaïdjan, Kazakhstan, Japon (champ `ordreArene` de NATIONS).
- 5 adversaires par nation, de plus en plus forts : la commune la plus faible, la commune la plus forte, la meilleure rare, la meilleure épique, puis la légendaire en boss. Ordinateur facile pour les 2 premiers, normal pour les 3e et 4e, fort pour le boss.
- Le joueur choisit son lutteur à chaque combat. Après une défaite, il réaffronte le même adversaire, sans recommencer la nation. La progression est sauvegardée.
- +1 médaille par victoire. Nation battue : 2 ou 3 boosters (au hasard), 1 booster épique (depuis le 28/11/2026), 3 médailles, et 1 chance sur 3 de gagner la carte du boss. Le booster de consolation (toutes les 2 défaites d'affilée) est gardé.
- Les boss des nations battues peuvent être réaffrontés (ordinateur fort) : +1 médaille et 1 chance sur 3 de gagner leur carte à chaque victoire.
- Objectif : battre les 12 nations. Le bonus du tutoriel donne 2 boosters en plus à la prochaine victoire dans l'arène.

### Style de combat : format et durée (26/11/2026)

- En combat rapide et entre amis seulement, deux réglages :
  - Format : Normal (une action par tour) ou Enchaînement (séquences de 3 actions, voir ci-dessous).
  - Durée : en combat rapide, Normale (une période) ou Infinie ; entre amis, 3 périodes, Rapide (une période) ou Infinie.
- Durée infinie : pas de périodes, pas d'arrêt à 10 points d'écart ; le combat ne s'arrête que sur un tombé (combo, action spéciale, épuisement : 3 tours à 0 d'endurance) ou un abandon. Les points restent affichés. Récompenses du combat rapide (1 médaille contre l'ordinateur, 2 en ligne, pas de booster).
- Cocoach, le rival (26/11/2026) : en combat rapide, la durée infinie se joue toujours contre Cocoach (une carte à part, différente du lutteur de test). Il commence en carte rare (endurance 58, force 168, récupération 44 %, spéciale feinte). Chaque fois que le joueur le bat, il monte d'un niveau (Épique, Légendaire, Champion du Monde : statistiques et actions comme une fusion, avec un deck propre à chaque niveau), puis gagne une étoile par victoire jusqu'au maximum. L'ordinateur qui le joue est normal en Rare et Épique, fort ensuite (le niveau d'ordinateur choisi ne compte pas). À chaque montée de niveau : 1 booster rare. À chaque nouvelle saison sportive, il repart de Rare avec +2 % de statistiques par saison passée. L'écran du combat rapide montre son niveau, ses étoiles et le nombre de fois où il a été battu ; l'écran de fin annonce sa progression.
- Fatigue croissante (26/11/2026, 2e version) : récupération tous les 3 tours dès le tour 20, tous les 4 tours dès le tour 30, et ainsi de suite (un tour de plus tous les 10 tours) ; coût des actions +1 dès le tour 25, puis +1 de plus tous les 10 tours (+2 au tour 35, +3 au tour 45…). Lutte et Souffler restent gratuits. L'étiquette « Fatigue » (récupération et surcoût en cours) change de couleur à chaque nouvel effet (tours 20, 25, 30, 35…), du jaune au rouge foncé.
- Épuisement en durée infinie : dès le tour 30 (valeur fixe depuis le 26/11/2026 ; avant, le joueur le réglait à 20, 30, 40 ou 50), 3 tours sans pouvoir payer aucune action = tombé, comme à 0 d'endurance. Sans cette règle, deux lutteurs à bout luttent l'un contre l'autre sans fin (mesuré : plus de 3 000 tours).
- Mesures (1 000 combats simulés, ordinateur normal des deux côtés) : sans fatigue, 94 tours en moyenne (le plus long : 1 053) ; avec la fatigue, 19,5 tours en moyenne, 23 au plus ; 81 % des combats finissent par épuisement, surtout entre les tours 20 et 25, car l'ordinateur dépense toute son endurance. Un joueur qui garde des réserves tiendra plus longtemps.

### Mode Enchaînement (à l'essai, 25/11/2026)

- Disponible pour l'essai en combat rapide et entre amis seulement.
- Chacun compose en secret une séquence de 3 actions. Elles sont comparées dans l'ordre (1 contre 1, 2 contre 2, 3 contre 3) avec les règles habituelles d'un tour (familles, précision, combos, points). 12 tours par période, soit 4 séquences ; en combat rapide, mort subite séquence par séquence.
- Rupture de chaîne (2e version, 25/11/2026) :
  - seul un contre réussi au 1er duel brise la chaîne : les deux séquences s'arrêtent, ce qui a été joué compte (points compris), et l'adversaire paie quand même l'endurance de ses actions annulées ; celui qui a contré ne paie pas les siennes ;
  - seul un Matraquage réussi au 2e duel (2 fois sur 3) annule la dernière action de l'adversaire : elle est payée mais sans effet ; la dernière action de celui qui a matraqué se joue normalement (elle réussit seule si elle passe sa précision). Les autres feintes ne cassent rien ;
- Action spéciale : mêmes règles qu'un combat normal, place par place : possible dès le 2e tour (donc à partir de la 2e action de la 1re séquence), puis après 3 actions de recharge ; son coût dépend du tour où elle tombe.
  - un contre réussi au 2e duel ne brise plus rien.
- Affichage : la case de la dernière séquence ne rejoue son animation qu'une fois ; pendant qu'on compose la séquence suivante, elle reste figée.
- Endurance : on ne peut valider qu'une séquence dont on peut payer les 3 actions (coût de base) ; quand il ne reste plus de quoi payer aucune action, la place est prise par « Lutte ». Une action devenue impossible pendant la séquence (endurance perdue, spéciale plus disponible) est remplacée par Lutte. Une seule action spéciale par séquence ; « Souffler » compte comme une action.
- Initiative : celui qui l'a voit la dernière action de l'adversaire avant la séquence et peut changer sa propre dernière action. Une initiative gagnée pendant une séquence sert pour la suivante. Si les deux lutteurs l'ont gagnée pendant la même séquence, elles s'annulent (sinon chacun attendrait l'autre).
- Ordinateur : il compose ses séquences action par action, à son niveau ; avec l'initiative, il ne change que sa dernière action.
- Étape 1 (moteur et tests) faite le 25/11/2026. Mesures sur 2 000 combats rapides (2e version des ruptures) : 29 % des séquences sont touchées par une rupture, 11 % des combats finissent par tombé, l'ordinateur fort bat le normal 54 % du temps. Étape 2 (écran en combat rapide contre l'ordinateur) faite le 25/11/2026 : case « Mode Enchaînement » sur l'écran du combat rapide ; trois cases à remplir en touchant les actions dans l'ordre (une case remplie se retire d'un toucher, avec celles qui suivent) ; endurance restante après la séquence affichée ; actions trop chères grisées, « Lutte » seulement quand plus rien n'est payable ; bouton « Valider la séquence » ; fenêtre d'initiative avec la dernière action de l'ordinateur ; pile ou face pendant la séquence ; les duels se révèlent l'un après l'autre, puis « CHAÎNE BRISÉE ! » en cas de rupture ; le Récap sépare les séquences. Le combat auto reste disponible (il joue tour par tour sur 12 tours).
- Étape 3 (entre amis) faite le 26/11/2026 : à la création de la salle, case « Mode Enchaînement » (combinable avec « Combat rapide »). Chaque séquence est envoyée d'abord sous forme d'empreinte, puis dévoilée (une séquence modifiée après l'envoi est détectée) ; elle tient dans un seul nombre. L'initiative montre la dernière action de l'ami et permet de changer la sienne. Les annonces pile ou face sont numérotées dans la séquence (il peut y en avoir plusieurs). Le combat entre amis n'a pas pu être essayé en vrai depuis l'environnement de développement (les relais en ligne n'y sont pas joignables) : il est vérifié par des tests où deux joueurs simulés jouent des dizaines de combats complets.

### Affichage du combat (28/11/2026)

- Case de l'action dévoilée : sa couleur dit le résultat de l'action, avec une étiquette dessous : réussie (vert, « RÉUSSIE »), ratée par manque de précision (gris, nom barré, « RATÉE »), combo (or brillant, « COMBO ! »), contrée, points renvoyés (rouge, « CONTRÉE »), défendue, bloquée par la défense (bleu, « DÉFENDUE »), battue par l'attaque ou la feinte adverse (orange, « BATTUE »), sans résultat (neutre). L'action spéciale prend les mêmes couleurs, en plus vif.
- Fin de période (combats en périodes, pas le tutoriel) : un panneau « PAUSE » avec le score de la période, les périodes gagnées par chacun et la meilleure prise de la période (nom de la prise, points, lutteur qui l'a marquée). Il disparaît tout seul après 5 secondes (barre qui se vide) ; bouton « Période 2 → » pour reprendre tout de suite.
- Fin du combat : avant l'écran de fin, un moment de 2,5 secondes (toucher l'écran pour passer) où l'arbitre lève le bras du vainqueur. Le même dessin pour tous : le vainqueur à gauche, avec le maillot rouge si c'est le joueur, bleu si c'est l'adversaire ; le bras se lève en petite animation ; « VICTOIRE ! » ou « DÉFAITE… » et le nom du vainqueur (« par tombé » s'il y a lieu). Contre l'ordinateur, en tournoi et en ligne.

### Combat rapide

- Fin de combat (arène, combat rapide) : un bouton « Retour au menu » ramène directement à l'accueil, sans repasser par le choix du lutteur.

- Une seule période. Victoire à 10 points d'écart, par tombé, ou aux points à la fin de la période.
- Égalité à la fin de la période : mort subite, le premier qui marque gagne. Au bout de 10 tours de mort subite sans point, on départage comme une période normale.
- Contre l'ordinateur (niveau au choix) : +1 médaille par victoire, sans booster ni consolation. Entre amis (case « Combat rapide » à la création de la salle) : +2 médailles par victoire, sans booster.

### Niveau de compte

- +1 niveau toutes les 15 médailles (niveau 1 au départ). Il montre seulement l'expérience du joueur : aucune récompense.
- Affiché dans le menu, à côté du nom en combat et dans la salle en ligne (envoyé à l'ami).

### Combat entre amis (étape 5)

- Le combat entre amis se joue sur la version ouverte à tous : https://bailetco.github.io/wrestling-battle-card/ (GitHub Pages, publiée automatiquement à chaque modification). Pas besoin de compte : il suffit du lien. La page sur claude.ai renvoie vers cette version.
- Un joueur crée une salle et reçoit un code de 4 lettres ; son ami ouvre le même lien, touche « Combat entre amis » et tape le code.
- Connexion (depuis le 26/11/2026, étape 6) : Firebase (Realtime Database, projet `wrestling-battle-card`, en Europe). Chaque téléphone se connecte de façon anonyme (identifiant tiré au hasard, sans nom ni e-mail) et écrit son état dans `salles/<code>/<identifiant>` ; il reçoit en direct l'état de l'ami. Les règles de sécurité (`firebase/database.rules.json`) : chacun n'écrit que sa place, avec l'heure du serveur, 30 000 caractères au plus ; une salle ne se lit qu'en connaissant son code ; la liste des salles est fermée. En quittant, chacun efface sa place ; un état sans signe de vie depuis 90 secondes est ignoré.
- Secours : si Firebase ne répond pas en 8 secondes, ou si l'ami n'apparaît pas sur Firebase en 20 secondes, le jeu ouvre aussi les anciens relais publics gratuits (MQTT) et publie des deux côtés. Les relais publics ne sont pas privés : n'importe qui connaissant le code peut lire les échanges d'une salle (pas de donnée personnelle échangée).
- Les échanges de lutteurs entre amis (Social) passent par les mêmes salles.
- Correction du 26/11/2026 (essai réel téléphone + ordinateur) : le message « vos deux téléphones ne calculent pas la même chose » apparaissait à tort, car chaque joueur publie son tour puis, juste après, son contrôle ; entre les deux, l'autre téléphone comparait le contrôle du tour d'avant. Le contrôle porte maintenant le numéro du tour, et seuls deux contrôles du même tour sont comparés. Un vrai désaccord (triche) reste affiché jusqu'à la fin du combat. Les envois à Firebase partent un par un, dans l'ordre. Fin d'un combat rapide entre amis : le score s'affiche (« 10 à 8 »), au lieu de « 0 périodes à 0 ».
- En créant la salle, l'hôte choisit le mode : « Cartes de base » (toutes les cartes, sans fusion, sans booster) ou « Avec nos collections » (chacun ses cartes et leurs niveaux, 2 boosters par victoire). Chacun utilise son deck personnalisé s'il en a un. Le pseudo de coach de chacun s'affiche chez l'autre.
- Chaque tour : chacun choisit en secret et n'envoie d'abord qu'une empreinte de son choix ; les choix sont dévoilés quand les deux ont joué, ce qui empêche de changer d'avis après avoir vu l'action de l'autre.
- Initiative : le téléphone du joueur qui ne l'a pas montre 2 actions possibles (dont la vraie) ; celui qui a l'initiative garde ou change son action. Pile ou face : le lutteur menacé annonce sur son téléphone.
- Les deux téléphones calculent le combat avec le même moteur et le même numéro de combat : ils obtiennent le même résultat, vérifié à chaque tour.
- Reprise : chaque téléphone garde son historique ; après un rechargement, le combat reprend où il en était. Si l'ami part plus de 2 minutes, on peut arrêter le combat (victoire par forfait). Abandon et revanche possibles.
- Correction du 25/11/2026 : un combat pouvait rester bloqué (environ 1 fois sur 30) quand un joueur contrôlait l'empreinte de son ami pendant que celui-ci annonçait pile ou face. Le contrôle reprend maintenant le calcul depuis le début avec les informations à jour. Un choix dévoilé impossible (action absente de la carte) est signalé comme un désaccord au lieu de faire planter la page.

## 5. Plateforme et technique

- Version 1 : jeu sur navigateur, accessible par un simple lien, sur ordinateur et mobile.
- Si les retours sont bons : application mobile.
- Développement réalisé avec Claude Code, code stocké sur le GitHub de Corentin.
- Avancement étape par étape avec validation d'une esquisse à chaque étape.
- Organisation du code (26/11/2026) : les règles dans `src/moteur` ; l'affichage dans `src/page`, avec un écran par fichier dans `src/page/ecrans` (accueil, carrière, combat, fin, tournois, club, collection, progression, tutoriel, tutoriels courts, amis, navigation, commun). L'état de la page est réuni dans un seul objet. `src/page/main.ts` ne fait que démarrer le jeu.
- Bêta fermée (étape 6, 26/11/2026) :
  - Code d'invitation demandé au premier lancement (un seul code, envoyé par Corentin aux testeurs ; il n'est pas écrit en clair dans le jeu ni dans le dépôt). Le lien `…/?invitation=CODE` l'entre tout seul. Les joueurs qui avaient déjà un pseudo avant la bêta, et le mode développeur, n'ont pas à le saisir. C'est un verrou léger : il évite qu'un inconnu tombe sur la bêta par hasard.
  - Version affichée en bas du menu (« Bêta 0.6.0 »), la même que dans `package.json`. Écran « Nouveautés » : une fois après chaque mise à jour (pas au tout premier lancement) ; les textes sont dans `src/page/nouveautes.ts`. Si une autre fenêtre est ouverte, il attend le prochain passage par le menu.
  - « Ma sauvegarde » : un code à copier, envoyer ou télécharger, qui contient toute la collection (compressée), et l'import d'un code ou d'un fichier, qui remplace la collection après confirmation. Un code abîmé ou retouché à la main est refusé, et la collection importée passe par les mêmes contrôles qu'au démarrage. Ce n'est pas une protection contre un tricheur décidé : ce sera le rôle des comptes en ligne (étape 7). Depuis le 27/11/2026, les comptes joueurs sauvegardent la collection en ligne (voir plus bas).
  - Installation sur l'écran d'accueil du téléphone (icône, plein écran) ; une copie du jeu permet de jouer contre l'ordinateur sans réseau, la version en ligne passant toujours en premier. Vignette de partage (image 1200 × 630) quand le lien est collé dans Instagram, WhatsApp ou Messenger.
- Avis et signalements de bug (étape 6, lot C, 26/11/2026) : boutons « Donner mon avis » et « Signaler un bug » en bas du menu ; une invitation dans le menu, une seule fois, après le 5e combat (« Plus tard » la retire). Questionnaire : note de 1 à 5 étoiles (seule réponse obligatoire), ce qu'on a préféré, ce qui était difficile à comprendre, un lutteur trop fort ou trop faible, « Pratiques-tu la lutte ? », un mot libre (500 caractères). Signé du pseudo de coach et d'une adresse e-mail, demandée seulement aux 15 ans et plus (case à cocher). Le signalement de bug joint la version, le téléphone, la taille de l'écran, l'écran du jeu et le dernier combat contre l'ordinateur (numéro de hasard, choix et nombre de tirages de chaque tour), de quoi le rejouer exactement. Si la page plante, une fenêtre propose d'envoyer un rapport. Envoi dans Firestore (collection `avis`, dépôt seulement, un envoi par minute au plus) ; sans réseau, l'envoi attend dans le téléphone (200 au plus) et repart au lancement suivant.
- Statistiques anonymes (étape 6, lot D, 26/11/2026) : au premier passage par le menu, une fenêtre demande « Aider à équilibrer le jeu ? » ; « Oui, j'aide » n'est possible qu'en cochant « J'ai 15 ans ou plus ». Sans oui (ou en dessous de 15 ans), rien n'est envoyé et le jeu est identique. Le choix se change dans « Confidentialité » (bas du menu), qui explique aussi ce qui est envoyé, où (Firebase, Europe), combien de temps (12 mois après la fin de la bêta), le responsable (Corentin Bailet, cocoachwrestling@gmail.com), avec un bouton « Supprimer mes données » (deux appuis) qui efface avis, signalements et statistiques envoyés par ce téléphone.
  - Une fiche par combat (contre l'ordinateur ou entre amis ; pas pour le tutoriel ni les parties d'essai) : mode (carrière, entraînement, tournoi, interclub, amis), format, Enchaînement, auto, niveau de l'ordinateur, les deux lutteurs et leur rareté, résultat, fin du combat, scores, nombre de tours, durée, et pour chaque camp les actions choisies (combien de fois, combien de fois elles ont fait marquer). Plus des fiches de parcours : premier combat, tutoriel terminé, étape d'histoire validée, premier booster, premier combat entre amis. La pratique de la lutte (réponse d'un avis) est jointe si elle est connue. Jamais de pseudo, de nom ni de contact.
  - Les fiches attendent dans le téléphone (300 au plus) et partent par lots de 20 au plus, toutes les 35 secondes au plus (Firestore, collection `stats`, un lot par 30 secondes accepté par les règles).
- Comptes joueurs (27/11/2026) : facultatifs, pour ne jamais perdre sa collection et la retrouver sur tous ses appareils.
  - Deux façons : « Continuer avec Google », ou e-mail + mot de passe (onglets « Créer un compte » / « J'ai déjà un compte », lien « Mot de passe oublié ? » qui envoie un e-mail). Créer un compte transforme l'identifiant anonyme du téléphone en compte : avis, statistiques et combats entre amis continuent de marcher.
  - Proposé au bon moment : un bandeau dans le menu après 3 victoires (« Plus tard » le retire pour toujours), le lien « Mon compte » en premier dans « Plus », et la fenêtre « Ma sauvegarde » qui conseille le compte. Bouton « 👤 Mon compte » toujours visible sous le pseudo, dans le menu : orange « non sauvegardé » sans compte, vert « ☁ Sauvegardé ✓ » une fois connecté ; il ouvre la fenêtre du compte (avec « Se déconnecter »).
  - Sauvegarde automatique : 4 secondes après le dernier changement de la collection, dans Firestore `comptes/<identifiant>` (le code de sauvegarde compressé, plus un résumé : cartes, médailles, victoires, étape d'histoire, pseudo, heure du serveur). Seul le propriétaire, connecté avec un vrai compte (pas anonyme), peut lire ou écrire sa fiche.
  - Deux sauvegardes différentes : au moment de se connecter, si le compte n'a rien, on y met celle du téléphone ; si le téléphone est neuf (aucune victoire, médaille ni étape), on prend celle du compte ; sinon le joueur choisit entre « ☁ Mon compte » et « 📱 Ce téléphone » (résumé de chacune), l'autre est remplacée. Aux lancements suivants, si un seul côté a changé depuis la dernière synchronisation, il est suivi sans rien demander.
  - Déconnexion : la collection reste sur le téléphone, qui redevient anonyme.
  - Nouvel appareil (autre téléphone ou navigateur) : « Déjà joué sur un autre téléphone ou navigateur ? J'ai déjà un compte » sous le code d'invitation et sous le choix du pseudo. La fenêtre ne propose alors que la connexion (pas de création de compte). Si le compte a une collection : elle revient (pseudo, cartes, progression), le code d'invitation n'est plus demandé (le compte prouve que le joueur a été invité), le joueur arrive directement sur son menu avec « Bon retour, Coach … ! ». Si le compte n'a pas encore de collection : rien n'est envoyé, le joueur entre le code d'invitation ou choisit son pseudo comme un nouveau joueur.
  - Mise en route dans la console Firebase : voir `firebase/LISEZ-MOI.md` (activer E-mail/Mot de passe et Google, copier l'identifiant client Google dans `googleClientId`, coller les nouvelles règles). Tant que `googleClientId` est vide, le bouton Google est caché.
- Son et vibrations (27/11/2026) : sons fabriqués par le navigateur (Web Audio, style arcade, sans fichier, hors ligne aussi), remplaçables plus tard par de vrais fichiers. Pas de musique pour l'instant.
  - Sons : clic sur les boutons et tuiles ; choix d'une action ; tour de combat (points marqués, points encaissés, blocage, action ratée), fin de période, endurance qui passe sous 50 (les actions peuvent rater) ; TOMBÉ, victoire, défaite (une fois par combat), nouveau niveau de compte, nouveau palier de classement ; ouverture d'un booster, gain de médailles ou de $, révélation d'une carte (son plus riche selon la rareté).
  - Vibrations (Android seulement : les iPhone ne les permettent pas aux pages web) : points marqués (courte), points encaissés, tombé (forte), victoire et défaite (motifs différents), carte épique, légendaire ou Champion du Monde.
  - Réglages propres à l'appareil, activés au départ : bouton 🔊 / 🔇 en bas de l'écran de combat (à côté d'« Abandonner ») ; « Plus » → « Son et vibrations » : son oui/non, volume, vibrations oui/non, bouton « Essayer ».
- Mises à jour automatiques (27/11/2026) : le jeu installé sur le téléphone reste ouvert en arrière-plan et ne se rechargeait pas tout seul. Chaque publication écrit maintenant un numéro (fichier `version.json`, à côté du jeu) ; le jeu le compare au sien au lancement, à chaque retour sur le jeu et à chaque retour au menu (au plus une fois par minute). Nouvelle version : le jeu se recharge et revient à l'accueil, avec « Quoi de neuf ? ». Un combat contre l'ordinateur en cours (carrière, entraînement, tutoriel, combat de tournoi) est annulé : ni gagné ni perdu, le combat de tournoi se rejoue ; la fenêtre le dit au joueur. Un combat en ligne contre un ami n'est jamais coupé : la mise à jour attend le retour au menu. Chaque publication monte le numéro de version (0.7.0, 0.7.1…) avec 2 à 5 lignes de nouveautés.
- Mode développeur (26/11/2026) : les outils de test (médailles, $, boosters et doubles de test, toutes les cartes, Cocoach de test, passer une étape ou un palier) ne sont visibles qu'en ajoutant `?dev` à l'adresse du jeu, une fois (le téléphone s'en souvient) ; `?nodev` les retire. Sans mode développeur, une collection « tout débloqué » est désactivée.
- Essai réel du combat entre amis : fiche `ESSAI_ENTRE_AMIS.md` (deux téléphones, environ 20 minutes).

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
- Choix de la langue (traduction du jeu) : reporté (28/11/2026) jusqu'à ce que le jeu soit prêt à être déployé. Plan prêt : anglais d'abord, langue du téléphone détectée + réglage « Langue » sous « Plus » et drapeau sur le premier écran ; lot 1 en 3 étapes (1a système et menus, 1b combat (le récit des tours devient des événements, plus des phrases françaises relues), 1c cartes et le reste), lot 2 tutoriels, règles et quêtes, lot 3 dialogues et nouveautés ; noms des lutteurs inchangés, actions avec leurs noms anglais de la lutte ; traduction faite par Claude sans relecture.
- Dépôt GitHub public : le code est visible de tous. Le passer en privé demanderait un abonnement GitHub payant pour garder GitHub Pages, ou un autre hébergement (Firebase Hosting à l'étape 7).

### Idée mise de côté

- Bonus de collection : posséder toutes les cartes d'une même origine donne un bonus à chaque carte de cette collection.
