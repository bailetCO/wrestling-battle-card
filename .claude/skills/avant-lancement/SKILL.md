---
name: avant-lancement
description: Liste de contrôle avant d'ouvrir Wrestling Battle Card à de nouveaux joueurs (communauté, public) - outils de test, sauvegarde, triche, poids, affichage, équilibrage, vie privée. Produit d'abord un rapport ; les corrections ne se font qu'après validation de l'utilisateur. À utiliser quand l'utilisateur dit « /avant-lancement », « on va montrer le jeu », « on ouvre aux joueurs », ou avant la première publication vers un public plus large que des amis.
---

# /avant-lancement : le jeu est-il prêt pour de nouveaux joueurs ?

**Choix de l'utilisateur : d'abord le rapport, puis les corrections après sa validation.**
Ne rien modifier pendant le contrôle.

Demander d'abord **à qui** le jeu va être montré, car les exigences changent :
- **amis proches** (étape 6, premiers essais) : les outils de test peuvent rester, il faut surtout
  prévenir les testeurs de ce qui ne marche pas encore ;
- **communauté** (club de lutte, réseaux sociaux) : plus de triche visible, sauvegarde expliquée ;
- **public** (lancement) : tout doit être vert.

## La liste de contrôle

Pour chaque point : ✅ prêt, ⚠️ à surveiller, ❌ à corriger avant ce public. Donner la preuve
(commande lancée, fichier et ligne, photo).

### 1. Outils de test et triche
- Bonus de pseudo (`BONUS_PSEUDO` dans `src/page/test.ts`) : quels pseudos, et que donnent-ils ?
- Outils visibles sans `?dev` (`outilsTestVisibles`) : pour quels pseudos ?
- Mode développeur (`src/page/dev.ts`) : `?dev` dans l'adresse suffit-il à l'ouvrir ? Le dépôt
  étant public, n'importe qui peut le lire.
- Lutteur de test Cocoach, boutons « passer l'étape », « passer le combat et gagner ».
- Section « Outils de test (à retirer avant le lancement public) » du cahier des charges.
- Combat en ligne : chaque téléphone calcule le combat et le relais public transmet les messages
  sans vérification. Qu'est-ce qu'un tricheur pourrait faire ? (`src/page/enligne.ts`)

### 2. Sauvegarde des joueurs
- Où est gardée la collection ? (`localStorage`, `src/page/collection.ts`) Que perd un joueur qui
  change de téléphone, vide son navigateur ou joue en navigation privée ?
- Une sauvegarde abîmée est-elle remplacée par une collection neuve (perte définitive) ?
- Existe-t-il un moyen d'exporter ou de recopier sa sauvegarde ?
- Les anciennes sauvegardes sont-elles bien reprises ? (`depuisSauvegarde`, champ `version`, tests)

### 3. Qualité
- `npm run verifier-types`, `npm test`, `npm run build` : tout passe ? Taille du jeu (gzip).
- Skill `/captures` : aucun défaut sur les écrans, aucune erreur dans la console.
- `npm run simuler` : bilan d'équilibrage (lutteurs hors fourchette, cartes qui dépendent du niveau).
- `npm run verifier-cahier` : le cahier dit-il la même chose que le jeu ?
- Fiche `ESSAI_ENTRE_AMIS.md` : a-t-elle été faite en vrai, avec quels résultats ?

### 4. Présentation
- Titre, icône (favori, écran d'accueil du téléphone), couleur de thème (`index.html`).
- Le jeu s'ouvre et se joue sur un petit téléphone (390 px), en 4G.
- Premier lancement : le nouveau joueur comprend quoi faire (tutoriel, mode histoire) ?

### 5. Vie privée et légal
- Quelles données sortent du téléphone ? Le pseudo et les choix de combat passent par des relais
  publics (`RELAIS` dans `enligne.ts`) lisibles par d'autres : le dire aux joueurs.
- Noms des lutteurs inventés (aucun vrai lutteur), polices sous licence libre (`src/page/polices/`).
- Points ouverts du cahier (section 8) : nom du jeu libre (marque, domaine) ? Dépôt public ?
- Pour un public large : une courte page « confidentialité / à propos » (le jeu ne collecte rien,
  ou dit ce qu'il collecte).

## Le rapport

En français simple :
1. Le public visé et le verdict en une phrase (« prêt pour les amis, pas encore pour la communauté »).
2. Un tableau des points ❌ et ⚠️ : problème, pourquoi c'est gênant **pour un joueur**, correction
   proposée, effort (petit / moyen / gros).
3. Les points ✅ en une ligne chacun.
4. La question : « Lesquelles veux-tu que je corrige ? »

## Après la validation

Corriger seulement les points choisis, un à la fois, avec un test pour chacun quand c'est possible.
Pour les outils de test, **ne pas les supprimer** du code : les garder derrière le mode
développeur, pour pouvoir continuer à tester (sauf avis contraire de l'utilisateur).
Mettre à jour la section « Outils de test » du cahier des charges, puis terminer avec `/fin-etape`.
Proposer `/publier` ensuite.
