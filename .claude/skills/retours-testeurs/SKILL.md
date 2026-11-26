---
name: retours-testeurs
description: Transforme les retours des testeurs (messages collés, captures d'écran, fiche ESSAI_ENTRE_AMIS.md remplie, notes vocales retranscrites) en liste de problèmes triés par importance, avec un plan pour chacun. À utiliser quand l'utilisateur dit « /retours-testeurs », « voilà ce que mes amis ont dit », « un testeur a trouvé un bug », ou colle des avis sur le jeu.
---

# /retours-testeurs : des avis des joueurs à un plan d'action

L'utilisateur colle ou envoie ce que ses testeurs ont dit. Le but est de ne rien perdre,
de séparer les vrais problèmes des goûts personnels, et de proposer quoi faire en premier.
**On ne corrige rien dans cette skill** : on trie, on comprend et on propose un plan.

## Confidentialité

Les retours peuvent contenir des prénoms, des numéros ou des pseudos. **Ne jamais les recopier**
dans le projet : le dépôt GitHub est public. Écrire « Testeur A », « Testeur B »… et, si
utile, le téléphone ou le navigateur (« iPhone, Safari »).

## Étapes

1. **Lire tout** ce qui a été donné, captures d'écran comprises (outil Read sur l'image).
2. **Découper** en retours unitaires : une phrase ou une observation = un retour.
3. **Classer chaque retour** dans une catégorie :
   - 🐞 **Bug** : le jeu ne fait pas ce que dit le cahier des charges (blocage, mauvais score,
     récompense donnée deux fois, combat en ligne désynchronisé…) ;
   - ⚖️ **Équilibrage** : « tel lutteur est trop fort », « on perd toujours contre l'ordi fort » ;
   - 🤔 **Compréhension** : le joueur n'a pas compris une règle ou un écran (problème d'explication,
     pas forcément de règle) ;
   - 📱 **Affichage** : texte coupé, bouton trop petit, lenteur sur téléphone ;
   - 💡 **Idée** : une envie ou une suggestion (nouveau mode, nouvelle carte…).
4. **Regrouper les doublons** : si 3 testeurs disent la même chose, c'est un seul problème vu 3 fois.
   Le nombre de testeurs concernés est un signal fort.
5. **Vérifier ce qui peut l'être**, sans rien modifier :
   - un bug : chercher la règle dans `CAHIER_DES_CHARGES.md` et le code concerné. Essayer de le
     reproduire (un test qui échoue, ou la skill `/captures`). Noter « reproduit » ou « pas reproduit » ;
   - un retour d'équilibrage : comparer avec la dernière mesure (`.equilibrage/reference.json`,
     sinon `npm run simuler -- --lutteurs <id>`) ;
   - une incompréhension : retrouver le texte affiché au joueur (tutoriel, page Règles,
     `src/page/textes.ts`, `src/page/aide.ts`).
6. **Noter la gravité** :
   - 🔴 **Bloquant** : empêche de jouer, fait perdre la collection, triche possible en ligne ;
   - 🟠 **Important** : gêne beaucoup de joueurs, ou rend une règle injuste ;
   - 🟢 **Mineur** : petit défaut, un seul joueur, ou question de goût.
7. **Rapport à l'utilisateur**, en français simple :
   - un tableau : gravité, catégorie, problème (en une phrase), testeurs concernés, reproduit ou non ;
   - pour chaque 🔴 et 🟠 : la cause probable et la correction proposée, avec la skill à utiliser
     (`/equilibrage`, `/verifier-cahier`, `/captures`…) ;
   - les 💡 idées à part, sans les mélanger aux problèmes. Ce sont des choix pour l'utilisateur,
     pas des tâches ;
   - les **questions** : ce qu'il faudrait redemander au testeur pour comprendre
     (téléphone utilisé, étapes exactes, capture d'écran, heure).
8. **Proposer un plan court** : les 3 premières choses à faire, dans l'ordre. Attendre l'accord.

## Garder une trace (avec l'accord de l'utilisateur)

À la première utilisation, proposer de créer `RETOURS_TESTEURS.md` à la racine du projet :
une ligne par problème (date, gravité, catégorie, problème, état : à faire / corrigé le … / écarté).
Les fois suivantes, le mettre à jour : on voit ce qui revient et ce qui est réglé.
Jamais de nom ni de contact de testeur dans ce fichier.

## Fiche d'essai entre amis

Si l'utilisateur envoie la fiche `ESSAI_ENTRE_AMIS.md` remplie (✅/❌), chaque ❌ est un retour.
Le rattacher au numéro de ligne de la fiche. Les ❌ des parties « Coupures » et « Triche » sont
souvent 🔴.
