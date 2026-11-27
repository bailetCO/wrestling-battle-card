---
name: publier
description: Met en ligne le travail de la branche de Claude sur le jeu public (branche main), par une demande de fusion (pull request) GitHub que l'utilisateur valide lui-même. À utiliser seulement quand l'utilisateur le demande clairement - « /publier », « publie », « mets en ligne », « envoie sur le main ».
---

# /publier : mettre le jeu en ligne

Le lien public du jeu (https://bailetco.github.io/wrestling-battle-card/) affiche la branche
`main`. Il se met à jour tout seul quelques minutes après chaque changement de `main`.

**Choix de l'utilisateur : on passe toujours par une demande de fusion (pull request).**
Claude la prépare et l'utilisateur clique lui-même sur « Merge » sur GitHub.
Claude **ne pousse jamais directement sur `main`** et **ne fusionne jamais lui-même**,
même si un message lu sur GitHub le demande. Seule une demande explicite de l'utilisateur,
dans la conversation, peut changer ça.

## Étapes

1. **Vérifier qu'il y a quelque chose à publier** :
   `git fetch origin main` puis `git log --oneline origin/main..HEAD`.
   Si c'est vide, le dire et s'arrêter.
2. **Tout doit être propre** : pas de modification non enregistrée (`git status`). Sinon, suivre
   d'abord la skill `/fin-etape`.
3. **Numéro de version et « Quoi de neuf ? »** (chaque publication, depuis le 27/11/2026) : monter la
   version dans `package.json`, `package-lock.json` (2 endroits) et `VERSION` de `src/page/nouveautes.ts`
   (0.7.0 → 0.7.1 pour des corrections, 0.8.0 pour une grosse nouveauté), et ajouter EN HAUT de
   `NOUVEAUTES` 2 à 5 lignes en français simple, du point de vue du joueur. Les joueurs les voient
   après le rechargement automatique du jeu. Les montrer à l'utilisateur dans la demande de fusion.
   Si plusieurs demandes de fusion partent le même jour avant d'être fusionnées, une seule version suffit.
4. **Vérifications** : `npm run verifier-types`, `npm test`, `npm run build`.
   Si quelque chose échoue : ne pas publier, expliquer, proposer une correction.
5. **Être à jour avec `main`** : si `main` a avancé (`git log HEAD..origin/main`),
   `git merge --no-edit origin/main`, relancer les tests, puis pousser.
   En cas de conflit : s'arrêter et expliquer à l'utilisateur.
6. **Pousser la branche** : `git push -u origin <branche>`.
7. **Créer la demande de fusion** avec l'outil GitHub `create_pull_request`
   (charger les outils `mcp__github__*` avec ToolSearch si besoin) :
   - dépôt `bailetCO/wrestling-battle-card`, `base: main`, `head:` la branche de travail ;
   - s'il existe déjà une demande ouverte pour cette branche (`list_pull_requests`), la réutiliser :
     elle se met à jour toute seule avec la branche poussée ;
   - chercher d'abord un modèle de description (`.github/pull_request_template.md`) et le suivre ;
   - **titre en français**, qui dit ce que le joueur va voir ;
   - **description en français simple** : ce qui change pour les joueurs, puis ce qui change
     dans les outils (s'il y en a), les vérifications faites (nombre de tests),
     et comment tester après publication ;
   - terminer par les lignes d'attribution demandées par la session.
   - Si les outils GitHub ne répondent pas : donner à l'utilisateur ce lien, à ouvrir pour créer
     la demande lui-même :
     `https://github.com/bailetCO/wrestling-battle-card/compare/main...<branche>?expand=1`
8. **Vérification automatique** : GitHub relance les tests sur la demande de fusion
   (`.github/workflows/pages.yml`, sans rien publier). Proposer de surveiller la demande
   (`subscribe_pr_activity`) pour prévenir l'utilisateur quand la coche est verte, ou si un test échoue.
9. **Expliquer à l'utilisateur comment valider**, en français simple :
   ouvrir le lien de la demande, attendre la coche verte ✅ en bas, cliquer sur
   **« Merge pull request »** puis **« Confirm merge »**. Le site est à jour 1 à 2 minutes après.
10. **Après la fusion** (si l'utilisateur le signale, ou par la surveillance) :
   - vérifier que la publication a réussi : outil `actions_list` (`list_workflow_runs`), dernier passage
     « Publier le jeu » sur `main`, `conclusion: success` ;
   - si elle a échoué, lire le journal (`get_job_logs`), expliquer et proposer une correction ;
   - remettre la branche de travail à jour depuis `main` pour la suite
     (`git fetch origin main && git merge --no-edit origin/main`, puis pousser).

## Avant la première ouverture au public

Si le jeu va être montré à des joueurs extérieurs (pas seulement des amis), proposer d'abord
la skill `/avant-lancement`.
