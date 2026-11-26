Tu es le directeur artistique de Wrestling Battle Card. Le pack V1 (WRESTLING_BATTLE_CARD_V1.zip) est intégré dans le jeu. Il reste des anomalies à corriger. Prépare un lot correctif V1.1 qui ne contient QUE les fichiers corrigés.

## Règles à respecter pour toute carte refaite

- Format : WebP 360 × 540 px, portrait 2:3, même chemin et même nom de fichier que dans la V1 : assets/cards/<DÉLÉGATION>/<id>/<rareté>.webp (rareté = commune, rare, epique, legendaire, champion_du_monde).
- La carte doit être entière dans l'image : les 4 bords du cadre visibles, une marge bleu nuit régulière autour, rien de coupé, aucun morceau d'une autre carte.
- Garder la même maquette que les autres cartes, dans cet ordre de haut en bas : poids en haut à gauche, emblème de la délégation en haut à droite, illustration, nom, étoiles de rareté, bande ATT / DEF / CTR / FNT avec ses 4 libellés colorés (orange, vert, rose, jaune) et ses chiffres, puis l'étiquette de rareté en bas. Le jeu recouvre automatiquement la bande des statistiques : elle doit rester entière et lisible pour être repérée.
- Même lutteur, même visage, même pose et même tenue que dans la V1 pour les 5 raretés : on corrige le cadrage et les détails, on ne change pas le personnage.
- Nom imprimé identique au registre wrestlers.json, accents compris.
- Résolution : partir d'une image source plus grande que 360 × 540, puis réduire. Ne pas agrandir une petite image.

## 1. Cartes à refaire entièrement (les 5 raretés)

Le bas de la carte est coupé (chiffres et étiquette de rareté absents) et une bande d'une carte voisine apparaît en haut :
Nika Darsveli (candidate-s17-2, GEO) ; Luka Makhareli (candidate-s22-2, GEO) ; Giorgi Kvaratskheli (candidate-s13-2, GEO) ; Aldar Bektemir (candidate-s20-2, KAZ) ; Alikhan Tursanek (candidate-s24-2, KAZ) ; Jasur Rakhimel (candidate-s16-2, UZB) ; Timur Zarvani (candidate-s21-2, UZB) ; Marcus Stonewell (candidate-s18-2, USA) ; Jayden Crosswell (candidate-s19-2, USA) ; Tyler Monroe (candidate-s14-2, USA).
Priorité à Marcus Stonewell : il devient le lutteur légendaire des USA dans le jeu.

## 2. Bande d'une carte voisine en haut (à recadrer, les 5 raretés)

Ermek Ak-Toren (candidate-s16-3, KGZ) ; Kubat Arkenov (candidate-s21-3, KGZ) ; Aibek Tashven (candidate-s12-3, KGZ) ; Emre Yildizhan (candidate-s13-3, TUR) ; Deniz Akveren (candidate-s17-3, TUR) ; Mert Yalderen (candidate-s22-3, TUR) ; Levan Kvaratskhelia (candidate-source00-2, GEO) ; Caleb Ashford (candidate-source28-2, USA) ; Elias Varden (candidate-source09-1, EUR) ; Timur Velkanov (candidate-s10-3, RUS) ; Alexei Voranek (candidate-s18-3, RUS) ; Dmitri Karsenov (candidate-s19-3, RUS) ; Ivan Kotov (candidate-s14-3, RUS) ; Nurlan Zhaksylyk (candidate-s15-2, KAZ) ; Riku Moriyama (candidate-s15-3, JPN) ; Renji Kurozane (candidate-s24-3, JPN) ; Daichi Kazehara (candidate-s20-3, JPN) ; Rustam Akhmedov (candidate-source33-2, UZB) ; Sardor Mirzanel (candidate-s12-2, UZB).

## 3. Bord gauche coupé, poids tronqué (carte commune)

Le poids apparaît incomplet (« 2 kg », « 25 kg »…) : Farid Zeyran (candidate-source30-1, AZE) ; Kamran Vezari (candidate-source14-1, AZE) ; Arash Zandivar (candidate-source55-1, IRN) ; Nurlan Temirbek (candidate-source49-3, KGZ) ; Kerem Aydorel (candidate-source55-3, TUR) ; Askar Nurzhanek (candidate-source14-2, KAZ) ; Barys Tulegen (candidate-source30-2, KAZ) ; Sora Takemori (candidate-source14-3, JPN) ; Haruto Mizunari (candidate-source30-3, JPN) ; Caleb Ashford (candidate-source28-2, USA) ; Luka Meskari (candidate-source55-2, GEO) ; Bekzod Nurakov (candidate-source49-2, UZB).
Et la carte rare d'Azamat Kervan (wbc-s25-3, KGZ), rognée en haut et en bas.

## 4. Drapeaux qui ne correspondent pas à la délégation

Règle : licence, écusson de veste et fond du podium montrent uniquement le drapeau de la délégation du lutteur (EUR = drapeau européen ; AFR = emblème Afrique ou couleurs panafricaines, jamais le drapeau d'un pays d'une autre délégation). Aucun drapeau d'une autre délégation nulle part sur la carte.
- AFR : Bakary N’Darven (wbc-s25-1) commune et champion_du_monde (écusson tricolore, fond vert-blanc-rouge) ; Sékou Damaré (candidate-s12-1) commune (licence européenne, écusson vert-jaune) ; Amadou Darsané (candidate-s16-1) commune (licence rayée).
- EUR : Viktor Eisenvar (wbc-s27-1) commune (écusson américain) ; Mathis Valcourt (wbc-s35-1) champion_du_monde et Erik Nordvahl (wbc-s31-1) commune (motif proche du drapeau américain).
- KGZ : Nurlan Temirbek (candidate-source49-3) et Ermek Ak-Toren (candidate-s16-3), commune (licence américaine).
- IRN : Arash Zandivar (candidate-source55-1) commune (licence européenne).
- AZE : Emin Zardanel (candidate-s20-1), Rashad Velzari (candidate-s24-1), Farid Zeyran (candidate-source30-1), Kamran Vezari (candidate-source14-1) champion_du_monde (fond turc) ; Azad Mammadov (candidate-s15-1) commune (licence européenne) et champion_du_monde (fond kazakh) ; Rashad Alverzan (wbc-s40-1) et Elvin Narzade (wbc-s32-1) champion_du_monde (fond non azerbaïdjanais) ; Kamran Vezari commune (écusson kazakh).
- KAZ : Askar Nurzhanek (candidate-source14-2) commune (licence azerbaïdjanaise) ; Barys Tulegen (candidate-source30-2) commune (licence américaine).
- UZB : Bakhrom Tavren (wbc-s29-2) champion_du_monde (fond proche du drapeau américain).
- GEO : Luka Makhareli (candidate-s22-2) commune (licence iranienne) ; Giorgi Vardaneli (wbc-s34-2) commune (écusson américain).
- JPN : Riku Moriyama (candidate-s15-3) commune (licence turque) ; Sora Takemori (candidate-source14-3) et Haruto Mizunari (candidate-source30-3) commune (licence russe ou américaine).
Vérifie aussi toutes les autres cartes à pleine taille avec la même règle et ajoute à la liste ce que tu trouves.

## 5. Poids

- Rustam Akhmedov (candidate-source33-2, UZB) : 86 kg sur la carte champion_du_monde, 74 kg partout ailleurs et dans le registre. Mettre 74 kg.
- Bakary N’Dale (candidate-source33-1, AFR) : poids absent du registre. Choisis une catégorie olympique (57, 61, 65, 70, 74, 79, 86, 92, 97 ou 125 kg) cohérente avec sa carrure, imprime-la sur ses 5 cartes et ajoute-la dans wrestlers.json.

## 6. Noms : à me PROPOSER d'abord, sans refaire les cartes

Propose 2 noms de remplacement fictifs pour chacun de ces cas, dans la langue de la délégation, sans ressemblance avec une personne réelle connue (sportif, artiste, personnalité). Attends ma validation avant de réimprimer les noms.
- Noms trop proches d'un autre lutteur : Darius Westrell (proche de Darius Westford, USA) ; Sardor Mirzanel (proche de Sardor Mirzavel, UZB) ; Emre Yildizhan (proche d'Emre Yildarven, TUR) ; Rashad Alverzan (proche de Rashad Velzari, AZE) ; Bakary N’Dale (proche de Bakary N’Darven, AFR) ; Haru Kazemori (proche de Ren Kazemori, JPN) ; Kenzo Takemori (proche de Sora Takemori, JPN) ; Kian Mehravan (même nom de famille qu'Arash Mehravan, IRN) ; Giorgi Kvaratskheli (proche de Levan Kvaratskhelia, GEO).
- Trop de prénoms répétés dans une délégation : garde un seul « Reza » en Iran (Reza Mehradin, Reza Kaviranel, Reza Mousavi, Reza Navzaren), un seul « Amadou » en Afrique (Amadou Kassaré, Amadou Diallo, Amadou Darsané), et un seul de chaque prénom en Géorgie (Luka, Levan, Giorgi, Davit).
- Noms de personnes réelles connues : Cem Yilmaz (humoriste turc) ; Levan Kvaratskhelia (proche du footballeur Khvicha Kvaratskhelia) ; et à vérifier : Sergei Volkov, Ivan Kotov, Amadou Diallo, Reza Mousavi, Azad Mammadov, Lukas Müller.

## Ce que je veux recevoir

1. D'abord, dans ta réponse : le tableau des noms proposés (partie 6) et la liste des drapeaux supplémentaires trouvés (partie 4).
2. Après ma validation des noms : un fichier WRESTLING_BATTLE_CARD_V1_1.zip avec la même arborescence que la V1, contenant seulement les cartes corrigées, plus wrestlers.json et cards.json mis à jour (mêmes identifiants : ne change jamais un id, seulement name et weight_kg).
3. Un fichier CORRECTIONS_V1_1.csv avec une ligne par fichier modifié : id du lutteur, rareté, chemin, type de correction (cadrage, drapeau, poids, nom), description courte.
4. Une planche de contrôle par délégation (les 10 lutteurs × 5 raretés) pour que je vérifie avant de l'envoyer au développeur.
