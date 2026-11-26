// Combat auto : seulement contre un lutteur déjà battu en jouant soi-même.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerHasard } from '../src/moteur';
import { adversaireAuto, autoPermis, depuisSauvegarde, noterBattuMain, nouvelleCollection } from '../src/page/collection';

test('auto interdit tant que le lutteur n\'a pas été battu à la main', () => {
  const c = nouvelleCollection();
  assert.equal(autoPermis(c, 'usa'), false);
  assert.equal(adversaireAuto(c, creerHasard(1)), null);
  noterBattuMain(c, 'usa');
  noterBattuMain(c, 'usa');
  assert.deepEqual(c.battusMain, ['usa']);
  assert.equal(autoPermis(c, 'usa'), true);
  assert.equal(autoPermis(c, 'japon'), false);
});

test('adversaire au hasard : seulement parmi les battus à la main, avec une exclusion', () => {
  const c = nouvelleCollection();
  for (const id of ['usa', 'japon', 'russie']) noterBattuMain(c, id);
  const h = creerHasard(3);
  for (let k = 0; k < 50; k++) {
    const x = adversaireAuto(c, h, (id) => id === 'japon');
    assert.ok(x === 'usa' || x === 'russie');
  }
  assert.equal(adversaireAuto(c, h, () => true), null);
});

test('la liste est gardée dans la sauvegarde', () => {
  const c = nouvelleCollection();
  noterBattuMain(c, 'europe');
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(c))).battusMain, ['europe']);
});
