# Wrestling Battle Card

Jeu de cartes de lutte olympique jouable dans le navigateur.
Les règles complètes sont dans CAHIER_DES_CHARGES.md : c'est la référence.

## Choix techniques
- TypeScript + Vite, sans framework lourd au départ.
- La logique du combat (règles, points, endurance, précision) vit dans un dossier
  à part, sans aucun code d'affichage, et chaque règle a ses tests automatiques.
- Tous les chiffres (endurance, force, coûts, points, probabilités) sont dans un
  seul fichier de configuration, pour pouvoir les ajuster sans toucher au code.
- Le hasard passe par une seule fonction, pour pouvoir rejouer un combat à l'identique.

## Façon de travailler
- Je ne suis pas développeur : explique en français simple ce que tu fais.
- Une étape à la fois. Propose d'abord un plan court, attends mon accord.
- Si une règle du cahier des charges est ambiguë, pose-moi la question au lieu de deviner.
- À la fin de chaque étape : lance les tests, explique comment tester dans le
  navigateur, et fais un commit avec un message clair en français.
