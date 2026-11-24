# Wrestling Battle Card

Jeu de cartes de lutte olympique jouable dans le navigateur. Les règles sont dans
[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Où en est le projet

- [x] Étape 1 – Moteur de règles (sans graphisme), testé
- [ ] Étape 2 – Premier combat jouable dans le navigateur
- [ ] Étape 3 – Cartes et interface style manga
- [ ] Étape 4 – Les 5 personnages et la collection
- [ ] Étape 5 – Combat entre amis en ligne
- [ ] Étape 6 – Mise en ligne et équilibrage

## Organisation

- `src/moteur/config.ts` : tous les chiffres du jeu (lutteurs, coûts, points, probabilités).
- `src/moteur/combat.ts` : les règles d'un tour, des périodes et de la fin du match.
- `src/moteur/hasard.ts` : le hasard, rejouable à l'identique avec une graine.
- `src/moteur/ia.ts` : l'ordinateur (pour l'instant, choix au hasard).
- `tests/` : un test par règle.
- `scripts/simuler.ts` : simule des milliers de combats pour vérifier l'équilibrage.

## Commandes

```bash
npm install          # une seule fois
npm test             # lance tous les tests
npm run simuler      # simule 500 combats par duel
npm run simuler -- 2000
```
