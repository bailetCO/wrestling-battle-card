// Mon Club : ouverture, niveaux, places et recrutement.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import {
  depuisSauvegarde, libererPlace, medaillesNiveauSuivant, niveauClub, nouvelleCollection, placesClub, recruter,
} from '../src/page/collection';

const K = REGLES.club;

test('Mon Club : fermé avant 10 médailles, puis un niveau toutes les 5 médailles (10 au maximum)', () => {
  const c = nouvelleCollection();
  const niveau = (m: number) => { c.medailles = m; return niveauClub(c); };
  assert.deepEqual([9, 10, 14, 15, 20, 25, 30, 54, 55, 99].map(niveau), [0, 1, 1, 2, 3, 4, 5, 9, 10, 10]);
  c.medailles = 12;
  assert.equal(placesClub(c), 1);
  assert.equal(medaillesNiveauSuivant(c), 15);
  c.medailles = 55;
  assert.equal(placesClub(c), K.niveauMax);
  assert.equal(medaillesNiveauSuivant(c), null);
});

test('recrutement : seulement ses cartes, une place par niveau, sans doublon', () => {
  const c = nouvelleCollection();
  const [a, b] = Object.keys(c.exemplaires).filter((id) => c.exemplaires[id] > 0);
  assert.ok(recruter(c, a)); // club fermé
  c.medailles = 10;
  assert.ok(recruter(c, 'usa')); // pas possédée
  assert.equal(recruter(c, a), null);
  assert.ok(recruter(c, a)); // déjà dans le club
  assert.ok(recruter(c, b)); // plus de place au niveau 1
  c.medailles = 15;
  assert.equal(recruter(c, b), null);
  libererPlace(c, a);
  assert.deepEqual(c.club, [b]);
});

test('sauvegarde : le club est relu, les identifiants inconnus sont retirés', () => {
  const c = nouvelleCollection();
  c.club = ['europe', 'inconnu', 'europe'];
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(c))).club, ['europe']);
});
