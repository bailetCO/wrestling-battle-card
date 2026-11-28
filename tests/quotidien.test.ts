// Revenir chaque jour (27/11/2026) : calendrier de 7 jours, jour manqué, bonus de retour.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { reclamer, recompenseDisponible, visite } from '../src/page/quotidien';

test('une récompense par jour, puis la case suivante du calendrier', () => {
  const c = nouvelleCollection();
  assert.ok(recompenseDisponible(c, '2026-11-27'));
  const r = reclamer(c, '2026-11-27')!;
  assert.equal(r.rang, 0);
  assert.equal(c.dollars, REGLES.quotidien.calendrier[0].dollars);
  assert.equal(r.boosters[0].dollars, 5); // les $ se voient comme un gain à l'ouverture
  assert.equal(recompenseDisponible(c, '2026-11-27'), false);
  assert.equal(reclamer(c, '2026-11-27'), null); // pas deux fois le même jour
  assert.equal(reclamer(c, '2026-11-28')!.boosters[0].type, 'classique'); // jour 2 : booster
});

test('un jour manqué ne fait rien perdre ; après le jour 7, le calendrier recommence', () => {
  const c = nouvelleCollection();
  reclamer(c, '2026-11-01');
  reclamer(c, '2026-11-05'); // 3 jours manqués : on reprend au jour 2
  assert.equal(c.quotidien.rang, 2);
  for (const j of ['06', '07', '08', '09']) reclamer(c, `2026-11-${j}`);
  const j7 = reclamer(c, '2026-11-10')!;
  assert.equal(j7.rang, 6);
  assert.equal(j7.boosters[0].type, 'rare');
  assert.equal(c.quotidien.rang, 0);
});

test('bonus de retour : après 7 jours d\'absence, une fois tous les 30 jours au plus', () => {
  const c = nouvelleCollection();
  c.coach = 'Léa';
  assert.equal(visite(c, '2026-11-01'), null); // première visite
  assert.equal(visite(c, '2026-11-05'), null); // 4 jours : rien
  const cadeau = visite(c, '2026-11-13')!; // 8 jours
  assert.equal(cadeau.length, 1);
  assert.equal(cadeau[0].type, 'rare');
  assert.equal(visite(c, '2026-11-25'), null); // 12 jours d'absence, mais moins de 30 jours depuis le dernier bonus
  assert.ok(visite(c, '2027-01-02')); // plus tard : à nouveau
});

test('gardé dans la sauvegarde', () => {
  const c = nouvelleCollection();
  reclamer(c, '2026-11-27');
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(d.quotidien, c.quotidien);
  assert.equal(depuisSauvegarde({ ...JSON.parse(JSON.stringify(c)), quotidien: { jour: 'hier', rang: 99 } }).quotidien.rang, 0);
});
