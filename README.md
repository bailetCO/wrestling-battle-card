# Wrestling Battle Card

Jouer : https://bailetco.github.io/wrestling-battle-card/ (mis à jour automatiquement à chaque modification de la branche main).

Jeu de cartes de lutte olympique jouable dans le navigateur. Les règles sont dans
[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Où en est le projet

- [x] Étape 1 – Moteur de règles (sans graphisme), testé
- [x] Étape 2 – Premier combat jouable dans le navigateur, contre l'ordinateur
- [x] Étape 3 – Cartes et interface style manga : 15 lutteurs, portraits provisoires, raretés
- [x] Étape 4 – Collection, decks, niveau « fort » de l'ordinateur et rééquilibrage
- [x] Étape 5 – Combat entre amis en ligne
- [ ] Étape 6 – Mise en ligne, tests avec la communauté et équilibrage
- [ ] Étape 7 – Comptes joueurs et sauvegarde de la collection
- [ ] Étape 8 – Monétisation et application mobile

## Organisation

- `src/moteur/config.ts` : tous les chiffres du jeu (lutteurs, coûts, points, probabilités).
- `src/moteur/combat.ts` : les règles d'un tour, des périodes et de la fin du match.
- `src/moteur/hasard.ts` : le hasard, rejouable à l'identique avec une graine.
- `src/moteur/ia.ts` : l'ordinateur, niveau normal (au hasard) et niveau fort.
- `src/page/` : la page du jeu (écran de choix, combat, fin). Elle n'applique aucune règle elle-même, elle appelle le moteur.
- `src/page/partie.ts` : le déroulé d'une partie contre l'ordinateur (initiative, pile ou face).
- `src/page/carte.ts` : la carte d'un lutteur et ses cadres de rareté.
- `src/page/portrait.ts` : les portraits et scènes manga provisoires (une scène par niveau de carte), dessinés en code. Pour une vraie illustration, renseigner `image` dans `APPARENCE`.
- `src/page/enligne.ts` : le combat entre amis (salle, choix secrets, initiative, pile ou face, reprise), sans affichage, et la connexion par relais public.
- `.github/workflows/pages.yml` : publication automatique sur GitHub Pages (tests puis construction).
- `src/page/club.ts` : la section Social (amis, transfert de lutteur du jour, transfert entre amis), sans affichage.
- `src/page/aide.ts` : la page Règles (textes tirés de la configuration) et le tutoriel (écrans et combat guidé).
- `src/page/collection.ts` : la collection (cartes, boosters, decks, médailles et $), gardée dans le navigateur.
- Écrans (adresse après `#`) : `pseudo`, menu, `collection` (tri, styles, boutons de test), `fusion`, `social`, `combat`, `regles`, `tutoriel`, `arene`, `amis`.
- `tests/` : un test par règle.
- `scripts/simuler.ts` : simule des milliers de combats pour vérifier l'équilibrage.

## Commandes

```bash
npm install          # une seule fois
npm test             # lance tous les tests
npm run simuler      # simule les combats (ordinateur au hasard puis fort) et vérifie les raretés
npm run simuler -- 400 150   # plus de combats, résultat plus précis (environ 1 minute)
npm run dev          # lance le jeu sur l'ordinateur (adresse affichée, à ouvrir dans le navigateur)
npm run build        # construit le jeu en un seul fichier : dist/index.html
npm run apercu       # sert le jeu construit sur http://localhost:4173 ; le combat entre amis
                     # y marche entre deux onglets du même navigateur (pour tester)
```
