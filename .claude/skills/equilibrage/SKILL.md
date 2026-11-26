---
name: equilibrage
description: Mesure l'équilibre des 120 lutteurs par simulation, explique les cartes trop fortes, trop faibles ou qui dépendent trop du niveau de jeu, propose des réglages de chiffres et montre un avant/après. À utiliser quand l'utilisateur dit « /equilibrage », « équilibrer », « tel lutteur est trop fort / trop faible », ou après une modification des règles de combat ou des chiffres des lutteurs.
---

# /equilibrage : régler la force des lutteurs

L'utilisateur n'est pas développeur : expliquer en français simple, avec des pourcentages
de victoires, jamais avec du code. **Aucun chiffre du jeu n'est modifié sans son accord.**

## Ce que mesure la simulation

`npm run simuler` fait jouer chaque lutteur contre des adversaires tirés parmi les 120 :
d'abord ordinateur « au hasard » des deux côtés (un débutant), puis ordinateur « fort »
(un bon joueur). La **moyenne** des deux doit tomber dans la fourchette de la rareté :

| Rareté | Fourchette de victoires |
| --- | --- |
| Commune | 42,5 à 47,5 % |
| Rare | 47,5 à 52,5 % |
| Épique | 52,5 à 57,5 % |
| Légendaire | 57,5 à 62,5 % |
| Champion du Monde | 62,5 à 67,5 % |

Second signal, aussi important : **« DÉPEND DU NIVEAU »**. Ça veut dire plus de 25 points d'écart
entre « hasard » et « fort ». Une telle carte est très forte contre un débutant et très faible
contre un bon joueur (ou l'inverse) : elle paraîtra injuste. On ne la corrige pas en
changeant seulement l'endurance (ça déplace la moyenne, pas l'écart). Il faut changer son
**deck** (ses 4 actions de base), sa **récupération** ou sa **force**, ou bien une règle de son style.

## Commandes

- Mesure complète, gardée comme référence (environ 1 min 30) :
  `npm run simuler -- --sauver .equilibrage/reference.json`
- Mesure rapide de quelques lutteurs (contre les 120, mêmes résultats que la mesure complète) :
  `npm run simuler -- --lutteurs id1,id2 --avant .equilibrage/reference.json`
- Comparaison complète après réglages :
  `npm run simuler -- --avant .equilibrage/reference.json`
- Plus précis (plus long) : `npm run simuler -- 1200 300 …` (garder les mêmes nombres pour comparer).

Le dossier `.equilibrage/` n'est pas enregistré dans le projet.

## Étapes

1. **Mesurer** avec `--sauver` (référence). Si une référence récente existe déjà et
   qu'aucun chiffre n'a changé depuis (`git log -- src/moteur`), la réutiliser.
2. **Rapport** à l'utilisateur, court :
   - le bilan : X/120 dans la fourchette, à 1 point près, trop forts, trop faibles, dépendants du niveau ;
   - la moyenne par rareté (elle doit monter régulièrement : commune < rare < épique < légendaire) ;
   - **les causes communes**. Regrouper par style de jeu (colonne `style` dans `LIGNES` de
     `src/moteur/config.ts`) : si tous les lutteurs d'un style ont le même défaut, le problème
     vient du style (deck, règle), pas de chaque carte ;
   - la liste des cartes à corriger, de la plus éloignée à la moins éloignée.
3. **Proposer** des réglages, chiffre par chiffre, avec la raison. Repères :
   - toujours **un seul levier à la fois**, de petits pas ;
   - endurance (`enduranceMax`) : environ +1 = +1 à 2 points de victoire, levier principal pour la moyenne ;
   - force et récupération : changent aussi le style de jeu, à utiliser avec prudence ;
   - deck (4 actions de base) : seul vrai levier contre « dépend du niveau » ;
   - **ne jamais changer la rareté, l'identifiant ou le nom** d'un lutteur sans l'accord explicite
     de l'utilisateur. Les joueurs ont des sauvegardes qui pointent vers les identifiants.
   - Une règle de combat (`REGLES` dans `config.ts`, `combat.ts`) touche les 120 lutteurs :
     la présenter comme un choix de conception et poser la question.
4. **Attendre l'accord.** Puis modifier `src/moteur/config.ts` (tous les chiffres y sont,
   jamais ailleurs).
5. **Vérifier** : mesure rapide des cartes touchées, puis mesure complète avec `--avant`.
   Un réglage peut décaler un peu les autres lutteurs (ils les affrontent).
   Montrer l'**avant/après** : bilan global, et une ligne par carte modifiée.
6. Si le résultat est moins bon, revenir en arrière et le dire honnêtement.
7. **Mettre à jour le cahier des charges** : tableau du lutteur dans sa nation, et la phrase
   « Mesure du … » dans la section « Les 120 lutteurs » (date, nombre de combats, bilan).
8. Terminer avec la skill `/fin-etape` (tests, commit en français).

## Les cartes Champion du Monde

Elles sont définies à part (`LIGNES_CHAMPIONS` dans `config.ts`). Elles reprennent la légendaire
de leur nation avec plus d'endurance et de force, et visent environ 65 %. La simulation actuelle
ne mesure que les 120 lutteurs ordinaires. Pour les champions, le signaler à l'utilisateur
plutôt que de régler à l'aveugle.
