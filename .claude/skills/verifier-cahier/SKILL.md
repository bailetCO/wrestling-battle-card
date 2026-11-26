---
name: verifier-cahier
description: Compare le cahier des charges (CAHIER_DES_CHARGES.md) et le code du jeu, liste les différences et les règles ambiguës sous forme de questions pour l'utilisateur. À utiliser quand l'utilisateur dit « /verifier-cahier », « est-ce que le cahier est à jour », avant une grosse étape, ou après plusieurs changements de règles.
---

# /verifier-cahier : le cahier des charges dit-il la même chose que le jeu ?

Le cahier des charges est **la référence** du projet. Quand il ne dit pas la même chose que
le jeu, il faut savoir lequel a raison, et **c'est l'utilisateur qui décide**.
Cette skill ne corrige rien toute seule : elle produit un rapport et des questions.

## 1. La partie automatique

`npm run verifier-cahier` compare les tableaux des lutteurs du cahier (rareté, style,
endurance, force, récupération, 4 actions de base, carte de départ) avec
`src/moteur/config.ts`, et cherche les noms en double. Il ne modifie rien.

## 2. La partie à lire soi-même

Le cahier fait plus de 700 lignes. Le parcourir **section par section** et comparer avec le
code concerné. Les plus importantes :

| Section du cahier | Où regarder dans le code |
| --- | --- |
| 4. Système de combat (actions, interactions, points, endurance, chiffrage) | `src/moteur/config.ts` (`ACTIONS`, `REGLES`), `src/moteur/combat.ts` |
| Ordinateur (3 niveaux) | `src/moteur/ia.ts` |
| Médailles et $, boosters, fusion | `REGLES.economie` et `REGLES.collection` dans `config.ts`, `src/page/collection.ts` |
| Tournois, saison, quêtes, mode histoire | `src/page/tournoi.ts`, `saison.ts`, `quetes.ts`, `histoire.ts` |
| Combat entre amis | `src/page/enligne.ts` |
| Outils de test | `src/page/test.ts`, `src/page/dev.ts` |
| Organisation du code (section 5) et README | les dossiers réels |

Pour chaque chiffre écrit dans le cahier (coût, points, pourcentage, nombre de boosters…),
vérifier la valeur dans `config.ts`. Utiliser `grep` pour aller vite. Ne pas tout lire d'un coup :
une section, puis le code correspondant.

Repérer aussi les **règles ambiguës** : une phrase qu'on peut comprendre de deux façons, un cas
non prévu (égalité, abandon, déconnexion…), deux sections qui se contredisent.

## 3. Le rapport à l'utilisateur

En français simple, trié du plus important au moins important :

1. **Différences qui changent le jeu** : une règle écrite d'une façon et codée d'une autre.
   Pour chacune : ce que dit le cahier, ce que fait le jeu, et la question
   « lequel a raison ? ».
2. **Cahier pas à jour** : des chiffres qui ont changé dans le jeu (par exemple après un
   équilibrage) sans être recopiés dans le cahier. Proposer de les recopier.
3. **Règles ambiguës** : sous forme de questions, avec 2 ou 3 réponses possibles et la
   recommandation de Claude.
4. **Petites choses** : fautes, doublons, sections mal rangées.

Ne jamais deviner la bonne réponse à la place de l'utilisateur (règle du projet).

## 4. Après ses réponses

- Si le cahier a raison : corriger le jeu, avec un test qui vérifie la règle.
- Si le jeu a raison : corriger le cahier, avec la date du jour entre parenthèses.
- Lancer `npm run verifier-cahier` pour vérifier qu'il ne reste plus de différence automatique.
- Terminer avec la skill `/fin-etape`.
