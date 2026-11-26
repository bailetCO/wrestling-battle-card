---
name: nouveau-lutteur
description: Ajoute ou modifie des lutteurs (ou une nation entière) dans Wrestling Battle Card en suivant toujours les mêmes étapes - cahier des charges, chiffres, portrait, tests et simulation. À utiliser quand l'utilisateur dit « /nouveau-lutteur », « ajoute un lutteur », « nouvelle nation », « change le nom / le style / les actions d'un lutteur ».
---

# /nouveau-lutteur : ajouter ou modifier des lutteurs

L'utilisateur n'est pas développeur : lui parler de noms, de styles et de pourcentages,
pas de code. Le cahier des charges (`CAHIER_DES_CHARGES.md`) est la référence.

## Règles du jeu à respecter (vérifiées par `tests/cartes120.test.ts`)

- Chaque nation a **exactement 10 lutteurs** : 4 communes, 3 rares, 2 épiques, 1 légendaire.
- **3 styles de jeu par nation**, répartis à chaque rareté.
- **5 cartes de départ** par nation : les 4 communes et la rare la moins forte.
- Chaque lutteur a 4 actions de base (son deck) et 4 déblocages (un par niveau de rareté).
- Noms et identifiants **tous différents**. Les noms sont **inventés** : jamais celui d'un vrai lutteur
  (vérifier les championnats récents en cas de doute).
- Chaque nation peut avoir **1 carte Champion du Monde** (`LIGNES_CHAMPIONS`).

Conséquence : on n'ajoute pas « un » lutteur seul à une nation. Il faut ajouter une **nation
entière** (10 lutteurs + son champion), ou **remplacer / modifier** un lutteur existant.
Si la demande de l'utilisateur ne rentre pas dans ces règles, **lui poser la question**
(par exemple : passer à 11 lutteurs par nation est un changement de règle du jeu).

## Ne jamais faire sans accord explicite

- Changer l'**identifiant** d'un lutteur existant (`'usa-4'`…). Les collections des joueurs
  sont gardées avec ces identifiants : un changement leur ferait perdre leurs cartes.
  On peut changer le nom affiché, pas l'identifiant.
- Supprimer un lutteur.
- Changer la rareté d'un lutteur que des joueurs possèdent déjà.

## Étapes

1. **Comprendre la demande** et proposer un plan court : quels lutteurs, quelle nation,
   quels styles, quelle rareté visée. Pour un style nouveau, demander à l'utilisateur
   comment il imagine ce lutteur (attaquant, défenseur, contre-attaquant, rapide, puissant…).
   Attendre son accord.
2. **Écrire d'abord dans le cahier des charges** : le tableau de la nation (section
   « Les 120 lutteurs », un tableau par nation, avec l'ordre d'arène) et le compte total
   s'il change (« 120 lutteurs », « 12 nations »).
3. **Ajouter les chiffres** dans `src/moteur/config.ts` :
   - une ligne par lutteur dans `LIGNES` (le commentaire au-dessus décrit chaque colonne) ;
   - pour une nouvelle nation : une ligne dans `NATIONS` (avec son ordre d'arène) et sa carte Champion dans `LIGNES_CHAMPIONS` (et `ACTION_CHAMPION`) ;
   - partir des chiffres d'un lutteur existant du même style et de la même rareté : c'est le
     point de départ le plus sûr pour l'équilibrage.
4. **Portrait** (`src/page/portrait.ts`) : sans rien faire, le portrait est tiré automatiquement
   de l'identifiant. Pour une nouvelle nation, ajouter ses teintes (`TEINTES`), ses couleurs
   (`COULEURS_NATION`) et son drapeau. Une vraie illustration se met avec `image` dans `APPARENCE`.
5. **Noms locaux des actions** (section « Noms locaux des actions » du cahier) : les demander à
   l'utilisateur pour une nouvelle nation. Sinon, le nom français s'affiche.
6. **Tests** : adapter `tests/cartes120.test.ts` si le nombre de nations change (seulement
   après accord, car c'est un changement de règle), puis `npm test`.
7. **Équilibrage** : mesurer les nouveaux lutteurs avec
   `npm run simuler -- --lutteurs id1,id2 …` et suivre la skill `/equilibrage` pour les mettre
   dans leur fourchette. Vérifier ensuite que les autres n'ont pas trop bougé (mesure complète).
8. **Voir le résultat** : skill `/captures` (collection, carte du lutteur, un combat avec lui).
9. Terminer avec la skill `/fin-etape`.

## Message final à l'utilisateur

Pour chaque lutteur ajouté ou modifié : nom, nation, rareté, style, taux de victoire mesuré
et fourchette visée. Joindre la photo de sa carte.
