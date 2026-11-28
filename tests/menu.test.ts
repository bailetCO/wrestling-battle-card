// Menu ouvert pas à pas selon le mode histoire, avec « Nouveau » jusqu'à la première visite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { noterVisite, tuileNouvelle, tuilesVisibles } from '../src/page/menu';

test('au départ : Combat et Collection seulement, sans « Nouveau » ; Récompenses dès qu\'il y a quelque chose à ouvrir', () => {
  const c = nouvelleCollection();
  assert.deepEqual(tuilesVisibles(c), ['combat', 'collection']);
  assert.equal(tuileNouvelle(c, 'combat'), false);
  c.aOuvrir.push({ titre: 'Victoire', source: 'histoire', boosters: [] });
  assert.deepEqual(tuilesVisibles(c), ['combat', 'collection', 'recompenses']);
  c.aOuvrir = [];
  c.histoire.etape = 1; // 1re victoire en Carrière : la tuile reste
  assert.deepEqual(tuilesVisibles(c), ['combat', 'collection', 'recompenses']);
});

test('les tuiles arrivent avec les quêtes (33 quêtes) : Mon Club (5), Tournois (8), Social (9), Classement (10), Fusion (12), Saison (24)', () => {
  const c = nouvelleCollection();
  const vues = (etape: number) => { c.histoire.etape = etape; return tuilesVisibles(c); };
  assert.deepEqual(vues(0), ['combat', 'collection']);
  assert.deepEqual(vues(4), ['combat', 'collection', 'club', 'recompenses']);
  assert.deepEqual(vues(7), ['combat', 'tournois', 'collection', 'club', 'recompenses']);
  assert.deepEqual(vues(8), ['combat', 'tournois', 'collection', 'club', 'social', 'recompenses']);
  assert.deepEqual(vues(9), ['combat', 'tournois', 'collection', 'club', 'social', 'classement', 'recompenses']);
  assert.deepEqual(vues(11), ['combat', 'tournois', 'collection', 'fusion', 'club', 'social', 'classement', 'recompenses']);
  assert.deepEqual(vues(23), ['combat', 'tournois', 'saison', 'collection', 'fusion', 'club', 'social', 'classement', 'recompenses']);
  assert.equal(tuileNouvelle(c, 'fusion'), true);
  assert.equal(noterVisite(c, '#fusion'), true);
  assert.equal(noterVisite(c, '#fusion'), false);
  assert.equal(tuileNouvelle(c, 'fusion'), false);
});

test('ancienne sauvegarde : rien de « Nouveau », sauf le Classement (ajouté le 27/11/2026)', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 10;
  const brut = JSON.parse(JSON.stringify(c));
  delete brut.menusVus;
  const d = depuisSauvegarde(brut);
  assert.ok(tuilesVisibles(d).every((t) => !tuileNouvelle(d, t) || t === 'classement'));
  assert.ok(tuileNouvelle(d, 'classement'));
});
