// Couleur de la case d'action selon son résultat (28/11/2026), lu dans le récit du tour.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resultatAction } from '../src/page/resultats';

const r = (lignes: string[], nom = 'Ana', autre = 'Bo') => resultatAction(lignes, nom, autre);

test('défense qui bloque : réussie pour l\'un, défendue pour l\'autre', () => {
  const l = ["La défense de Ana l'emporte sur l'attaque de Bo."];
  assert.equal(r(l), 'reussie');
  assert.equal(r(l, 'Bo', 'Ana'), 'defendue');
});

test('contre : l\'attaque est contrée', () => {
  assert.equal(r(["Le contre de Bo l'emporte sur l'attaque de Ana.", "Bo marque 2 points (Contre : points de l'attaque renvoyés)."]), 'contree');
});

test('feinte qui passe : la défense est battue', () => {
  assert.equal(r(["La feinte de Bo l'emporte sur la défense de Ana."]), 'battue');
});

test('ratée, combo, rien', () => {
  assert.equal(r(['Ana rate son action (précision 0,62) : action dans le vent.']), 'ratee');
  assert.equal(r(['Combo « Enchaînement aux jambes » : Ana passe de la simple à la double jambe (+1).', 'Ana marque 5 points (Double jambe).']), 'combo');
  assert.equal(r(["Même famille et pas le double d'endurance : personne ne marque."]), 'neutre');
  assert.equal(r(['Ana marque 2 points (Simple jambe).']), 'reussie');
});
