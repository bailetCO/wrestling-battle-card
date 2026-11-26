Tu es le directeur artistique de Wrestling Battle Card, un jeu de cartes de lutte olympique sur téléphone, en français. Je te joins trois fichiers :
- GUIDE_STYLE_CARTES.md : le style actuel des cartes du jeu (couleurs, cadres, scènes par rareté). C'est le fil directeur à respecter.
- reference_cartes_claude.png : les 5 raretés telles que le jeu les dessine aujourd'hui.
- registre_lutteurs.csv : les 120 lutteurs (identifiant, nom, délégation, poids, style, couleurs du maillot).

Lis-les entièrement avant de commencer.

## Ce qui change par rapport à la première version, et pourquoi

Dans la V1, tu produisais des cartes complètes (cadre, nom, poids, statistiques, étiquette de rareté), souvent plusieurs par image, ensuite découpées automatiquement. Résultat : bas de cartes coupés, morceaux de cartes voisines, poids tronqués, statistiques imprimées fausses, drapeaux d'autres pays, cinq raretés avec la même pose.

Nouvelle règle : toutes les cartes d'une même rareté partagent le même design, et seule l'illustration change. Le jeu dessine lui-même, dans le style du guide, le cadre de rareté, l'en-tête avec le nom et l'emblème de la délégation en haut, l'étiquette de rareté en bas, et les statistiques. Toi, tu produis UNIQUEMENT l'illustration, une par image.

## Format de chaque illustration

- Une image = un lutteur, une rareté. Jamais plusieurs cartes ou plusieurs lutteurs dans une même image.
- Format portrait 2:3, 1024 × 1536 px, PNG. L'image remplit tout le cadre, jusqu'aux bords : pas de marge, pas de bordure, pas de cadre, pas de coins arrondis.
- Zone de sécurité : le jeu pose l'en-tête sur les 12 % du haut et l'étiquette de rareté sur les 15 % du bas. Le visage, les mains et l'action principale restent dans la zone centrale : entre 12 % et 82 % de la hauteur, et entre 8 % et 92 % de la largeur. Les bords contiennent seulement du décor.
- AUCUN texte dans l'image : pas de nom, pas de poids, pas de chiffres, pas de statistiques, pas d'étoiles de rareté, pas de logo, pas d'écriteau lisible (la licence de la carte commune est montrée sans texte lisible), pas d'écran de score avec des chiffres (lumières seulement).

## Style

- Manga semi-réaliste, entre réalisme et anime, dans l'esprit de Baki et de Hajime no Ippo : anatomie crédible de lutteur, encrage noir marqué, couleurs franches, lumière dramatique.
- Palette du guide : bleu nuit #08193a, arène #090d1f à #1c2550, tapis olympique bleu #1d5fc4 avec sa zone orange #f07c2a et sa ligne blanche, projecteurs blancs.
- Maillot de lutte aux couleurs de la délégation (colonnes couleur_maillot et couleur_liseret du registre). L'adversaire porte le maillot de l'autre coin : bleu #1a49a8, ou rouge #c8283a si le lutteur est déjà en bleu.
- La carrure suit la catégorie de poids : 57 kg sec et vif, 125 kg massif. Le style du registre guide l'attitude : un « explosif » est en mouvement, un « défenseur » est solide et ancré.

## Les 5 scènes (une par rareté, du même lutteur)

Même visage, même coiffure, même barbe, même couleur de peau, même carrure sur les 5 images. La scène, la pose et le cadrage changent à chaque rareté.
1. **commune** : salle d'entraînement du club, le lutteur au premier plan en veste de sa délégation, regard déterminé, sa licence à la main (sans texte lisible) ; deux partenaires s'entraînent au fond.
2. **rare** : sur le tapis, face-à-face en garde avec un adversaire, mains engagées, tension avant l'attaque.
3. **epique** : arène sous les projecteurs, grosse projection (souplesse, suplex, bras roulé, selon le style), lignes de vitesse, public dans l'ombre.
4. **legendaire** : victoire dans l'arène, saut ou bras levé, le coach exulte derrière lui, panneau de score lumineux sans chiffres.
5. **champion** : podium, plus haute marche, médaille d'or, confettis, drapeau de SA délégation en grand fond.

Varie les angles et les poses d'un lutteur à l'autre : deux lutteurs d'une même délégation ne doivent pas avoir la même composition.

## Drapeaux et identité

- Un seul drapeau autorisé : celui de la délégation du lutteur, sur l'écusson de la veste (commune) et en fond du podium (champion). Europe = drapeau européen. Afrique = couleurs panafricaines (vert, jaune, rouge) sans drapeau d'un pays précis. Jamais le drapeau d'une autre délégation, nulle part.
- Personnages fictifs : aucune ressemblance avec un sportif, un artiste ou une personnalité réelle ; aucune marque réelle sur les tenues.
- Pas de sang, pas de blessure.

## Livraison

- Avant de dessiner un lutteur, fais sa fiche personnage : une image de référence (visage de face et de profil, silhouette, maillot), qui servira pour ses 5 illustrations.
- Noms des fichiers : <id>_<rareté>.png, avec l'identifiant du registre et la rareté parmi commune, rare, epique, legendaire, champion. Exemple : iran-2_legendaire.png. La fiche personnage : <id>_fiche.png.
- Par délégation : un ZIP qui contient les 10 lutteurs (5 illustrations et 1 fiche chacun), une planche de contrôle (10 lignes × 5 raretés) et un fichier livraison.csv (id ; rareté ; fichier ; remarques).

## Contrôle avant chaque livraison (à faire toi-même)

Pour chaque image, vérifie et corrige avant de livrer :
1. Une seule illustration, format 1024 × 1536, sans bordure, sans marge.
2. Aucun texte, chiffre, étoile ou logo.
3. Visage, mains et action dans la zone de sécurité.
4. Même personnage que sa fiche (visage, cheveux, peau, carrure).
5. Maillot aux bonnes couleurs ; aucun drapeau d'une autre délégation.
6. Scène conforme à la rareté et différente des autres lutteurs de la délégation.
Écris en fin de livraison la liste des contrôles et de ce que tu as corrigé.

## Cocoach, le rival (personnage spécial, hors collection)

Identifiant cocoach. Coach de lutte français, le rival du joueur. Même visage sur toutes les images, mais 5 scènes différentes (en V1, ses 5 cartes avaient la même pose) :
- commune : il coache au bord du tapis de son club ;
- rare : il montre une technique à un élève ;
- epique : il réalise une projection spectaculaire ;
- legendaire : il célèbre une victoire, bras levés ;
- champion : il porte une ceinture de champion sur le podium.
Plus une image de présentation (cocoach_presentation.png, 1024 × 1536) : de face, bras croisés, dans une arène illuminée.

## Pour commencer

1. Résume-moi en 10 lignes les règles que tu as comprises.
2. Fais la fiche personnage et les 5 illustrations d'UN seul lutteur : usa (Marcus Stonewell, USA, 92 kg, « Lutteur de pression, très physique »). Je les valide dans le jeu avant de lancer le reste.
3. Après ma validation, avance délégation par délégation, dans l'ordre du registre, en attendant mon accord entre deux délégations.
