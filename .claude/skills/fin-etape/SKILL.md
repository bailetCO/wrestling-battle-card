---
name: fin-etape
description: Le rituel de fin d'étape du projet Wrestling Battle Card - vérification du code, tests, construction, photos, mise à jour du README et du cahier des charges, explication de comment tester, puis commit en français. À utiliser quand une modification du jeu est terminée, ou quand l'utilisateur dit « /fin-etape », « on termine », « c'est bon, enregistre ».
---

# /fin-etape : terminer proprement une étape

L'utilisateur n'est pas développeur : tout ce qui lui est dit est en **français simple**,
sans jargon (ou avec le jargon expliqué). On ne publie **jamais** sur `main` ici :
c'est le rôle de `/publier`, et seulement avec son accord.

## Étapes, dans l'ordre

1. **Vérifier le code** : `npm run verifier-types`.
2. **Lancer tous les tests** : `npm test`.
   - Si une modification touche une règle du jeu et qu'aucun test ne la vérifie,
     **ajouter le test** dans `tests/` avant d'aller plus loin (règle du projet : chaque règle a son test).
   - Si un test échoue : s'arrêter, corriger, relancer. Ne jamais désactiver ni affaiblir
     un test pour qu'il passe. Si on ne sait pas si c'est le test ou le jeu qui a raison,
     poser la question à l'utilisateur.
3. **Construire le jeu** : `npm run build`. Noter la taille affichée (`gzip: … kB`) ;
   la signaler si elle a augmenté de plus de 10 % par rapport au dernier commit.
4. **Si des chiffres de combat ont changé** (`src/moteur/config.ts`, `combat.ts`, `ia.ts`) :
   lancer `npm run simuler` et dire en une phrase si l'équilibrage a bougé.
5. **Si l'affichage a changé** : suivre la skill `/captures` et montrer les photos utiles.
6. **Mettre à jour la documentation** si besoin :
   - `README.md` : la liste « Organisation » (nouveau fichier, nouvel écran) et
     « Où en est le projet » (étape terminée).
   - `CAHIER_DES_CHARGES.md` : si une règle a été ajoutée ou changée, l'écrire dans la
     bonne section, avec la date du jour entre parenthèses, comme les autres.
     Ne jamais y inventer une règle que l'utilisateur n'a pas validée.
7. **Vérifier ce qui va être enregistré** : `git status` et `git diff --stat`.
   Ne rien enregistrer de personnel ou de secret, ni les dossiers `.captures/`, `dist/`, `node_modules/`.
8. **Faire le commit** sur la branche de travail (jamais sur `main`) :
   - message en français, au même style que l'historique (`git log --oneline -10`) :
     une première ligne courte qui dit ce qui change **pour le joueur**, puis si besoin
     quelques lignes d'explication ;
   - terminer par les lignes d'attribution demandées par la session.
9. **Envoyer la branche** : `git push -u origin <branche>`.

## Le message final à l'utilisateur

Court, en français simple, avec ces quatre parties :

- **Ce qui a changé** dans le jeu, en 2 à 4 points.
- **Les vérifications** : « X tests, tous réussis », taille du jeu, équilibrage si lancé.
- **Comment le tester toi-même** : quoi ouvrir, où cliquer, ce qu'on doit voir.
  Rappeler que le lien public du jeu ne change qu'après `/publier`.
- **La suite** : proposer la prochaine étape ou demander s'il veut publier.
