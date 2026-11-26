// Menu ouvert pas à pas selon le mode histoire, avec « Nouveau » jusqu'à la première visite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { noterVisite, tuileNouvelle, tuilesVisibles } from '../src/page/menu';

test('au départ : Combat et Collection seulement, sans « Nouveau »', () => {
  const c = nouvelleCollection();
  assert.deepEqual(tuilesVisibles(c), ['combat', 'collection']);
  assert.equal(tuileNouvelle(c, 'combat'), false);
});

test('les tuiles arrivent avec les étapes : Tournois (2), Mon Club et Saison (3), Social (4), Fusion (8)', () => {
  const c = nouvelleCollection();
  const vues = (etape: number) => { c.histoire.etape = etape; return tuilesVisibles(c); };
  assert.deepEqual(vues(1), ['combat', 'tournois', 'collection']);
  assert.deepEqual(vues(2), ['combat', 'tournois', 'saison', 'collection', 'club']);
  assert.deepEqual(vues(3), ['combat', 'tournois', 'saison', 'collection', 'club', 'social']);
  assert.deepEqual(vues(7), ['combat', 'tournois', 'saison', 'collection', 'fusion', 'club', 'social']);
  assert.equal(tuileNouvelle(c, 'fusion'), true);
  assert.equal(noterVisite(c, '#fusion'), true);
  assert.equal(noterVisite(c, '#fusion'), false);
  assert.equal(tuileNouvelle(c, 'fusion'), false);
});

test('ancienne sauvegarde : rien de « Nouveau »', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 10;
  const brut = JSON.parse(JSON.stringify(c));
  delete brut.menusVus;
  const d = depuisSauvegarde(brut);
  assert.ok(tuilesVisibles(d).every((t) => !tuileNouvelle(d, t)));
});
