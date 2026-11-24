# Wrestling Battle Card

Jeu de cartes de lutte olympique jouable dans le navigateur. Les règles sont dans
[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Où en est le projet

- [x] Étape 1 – Moteur de règles (sans graphisme), testé
- [x] Étape 2 – Premier combat jouable dans le navigateur, contre l'ordinateur
- [x] Étape 3 – Cartes et interface style manga : 15 lutteurs, portraits provisoires, raretés
- [ ] Étape 4 – Collection, niveau « fort » de l'ordinateur et rééquilibrage
- [ ] Étape 5 – Combat entre amis en ligne
- [ ] Étape 6 – Mise en ligne, tests avec la communauté et équilibrage
- [ ] Étape 7 – Comptes joueurs et sauvegarde de la collection
- [ ] Étape 8 – Monétisation et application mobile

## Organisation

- `src/moteur/config.ts` : tous les chiffres du jeu (lutteurs, coûts, points, probabilités).
- `src/moteur/combat.ts` : les règles d'un tour, des périodes et de la fin du match.
- `src/moteur/hasard.ts` : le hasard, rejouable à l'identique avec une graine.
- `src/moteur/ia.ts` : l'ordinateur (choix au hasard ; avec l'initiative, il change d'action une fois sur deux).
- `src/page/` : la page du jeu (écran de choix, combat, fin). Elle n'applique aucune règle elle-même, elle appelle le moteur.
- `src/page/partie.ts` : le déroulé d'une partie contre l'ordinateur (initiative, pile ou face).
- `src/page/carte.ts` : la carte d'un lutteur et ses cadres de rareté.
- `src/page/portrait.ts` : les portraits manga provisoires, dessinés en code. Pour une vraie illustration, renseigner `image` dans `APPARENCE`.
- Page `#galerie` : les 15 cartes rangées par rareté.
- `tests/` : un test par règle.
- `scripts/simuler.ts` : simule des milliers de combats pour vérifier l'équilibrage.

## Commandes

```bash
npm install          # une seule fois
npm test             # lance tous les tests
npm run simuler      # simule 300 combats par duel et propose les raretés
npm run simuler -- 1000 --duels
npm run dev          # lance le jeu sur l'ordinateur (adresse affichée, à ouvrir dans le navigateur)
npm run build        # construit le jeu en un seul fichier : dist/index.html
```
