// Boîte à récompenses : gardée dans la sauvegarde, contenu contrôlé.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerHasard } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection, ouvrirBooster } from '../src/page/collection';

test('les récompenses à ouvrir sont gardées dans la sauvegarde', () => {
  const c = nouvelleCollection();
  assert.deepEqual(c.aOuvrir, []);
  const b = ouvrirBooster(c, creerHasard(4), 'rare');
  c.aOuvrir.push({ titre: 'Étape 1 validée', source: 'histoire', boosters: [b] });
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.aOuvrir.length, 1);
  assert.deepEqual(d.aOuvrir[0].boosters[0].cartes, b.cartes);
});

test('une récompense abîmée ou inventée est écartée', () => {
  const brut = JSON.parse(JSON.stringify(nouvelleCollection()));
  brut.aOuvrir = [
    { titre: 'faux', source: 'histoire', boosters: [{ type: 'rare', cartes: ['carte-inconnue'], nouvelles: [] }] },
    { titre: 'mauvaise source', source: 'banque', boosters: [{ type: 'rare', cartes: ['usa'], nouvelles: [] }] },
    { titre: 'ok', source: 'quetes', boosters: [{ type: 'classique', cartes: ['usa'], nouvelles: ['usa'] }] },
  ];
  assert.deepEqual(depuisSauvegarde(brut).aOuvrir.map((r) => r.titre), ['ok']);
});
