---
name: captures
description: Prend une photo de chaque écran du jeu en taille téléphone, repère les défauts d'affichage et montre les photos à l'utilisateur dans la conversation. À utiliser après toute modification de l'affichage (écrans, style, textes, cartes), ou quand l'utilisateur demande à voir le jeu, « /captures », « montre-moi », « fais des photos ».
---

# /captures : voir le jeu sans le tester à la main

L'utilisateur n'est pas développeur et ne teste pas toujours lui-même : les photos
lui montrent le résultat. Elles ne sont **jamais enregistrées dans le projet**
(le dossier `.captures/` est ignoré par git) : on les montre seulement dans la conversation.

## Étapes

1. Construire le jeu : `npm run build` (le programme photographie la version construite).
2. Lancer : `npm run captures`
   - Photos dans `.captures/`, numérotées dans l'ordre du parcours : accueil, menu,
     chaque écran (`#combat`, `#arene`, `#rapide`, `#collection`, `#fusion`, `#tournois`,
     `#club`, `#social`, `#histoire`, `#saison`, `#quetes`, `#recompenses`, `#regles`,
     `#tutoriel`, `#amis`), puis un combat d'entraînement (début, après un tour, fin).
   - Taille : iPhone 13 (390 px de large), comme le téléphone d'un joueur.
   - Le programme entre avec le pseudo « Photographe » (jamais « Coco », qui donne des bonus de test)
     et ferme tout seul les scènes de dialogue.
3. Lire le rapport automatique : il signale la page plus large que l'écran, les éléments
   qui dépassent du bord et les erreurs du navigateur.
4. **Regarder soi-même les photos** des écrans touchés par la modification (outil Read
   sur l'image). La machine ne voit pas tout. Vérifier :
   - texte coupé, qui se chevauche ou colle à un bord ;
   - bouton trop petit pour un doigt, ou caché sous un autre élément ;
   - écran vide ou resté bloqué derrière une fenêtre ;
   - couleurs illisibles (texte clair sur fond clair).
5. Envoyer à l'utilisateur, avec l'outil SendUserFile, **seulement les photos utiles**
   (les écrans modifiés, ou ceux qui ont un défaut), pas les 20 à chaque fois.
   Une légende courte en français pour chacune.
6. Résumer en français simple : ce qui va bien, les défauts trouvés, et proposer
   une correction (sans la faire avant son accord).

## Si un écran nouveau a été ajouté

Ajouter son adresse dans la liste `ECRANS` de `scripts/captures.mjs`, pour qu'il soit
photographié les fois suivantes.

## En cas de problème

- « dist/index.html introuvable » : lancer `npm run build` avant.
- Playwright introuvable : il est déjà installé dans les sessions cloud ; ne pas le réinstaller.
  Sur un autre ordinateur, l'utilisateur n'en a pas besoin : c'est un outil pour Claude.
- Un clic bloqué par une fenêtre : regarder la photo, puis compléter `fermerFenetres()` dans le programme.
