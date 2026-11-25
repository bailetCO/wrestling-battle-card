// Économie : médailles (progression) et $ (à dépenser).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { acheterBooster, depuisSauvegarde, gagnerMedailles, nouvelleCollection, recompenser } from '../src/page/collection';

const E = REGLES.economie;

test('médailles : +10 $ à chaque palier de 5 médailles franchi', () => {
  const c = nouvelleCollection();
  assert.deepEqual([c.medailles, c.dollars], [0, 0]);
  assert.deepEqual(gagnerMedailles(c, 4), { medailles: 4, dollars: 0 });
  assert.deepEqual(gagnerMedailles(c, 2), { medailles: 2, dollars: 10 }); // 6 : palier 5 franchi
  assert.deepEqual(gagnerMedailles(c, 10), { medailles: 10, dollars: 20 }); // 16 : paliers 10 et 15
  assert.deepEqual([c.medailles, c.dollars], [16, 30]);
});

test('victoire : boosters habituels, avec les médailles et les $ dans le premier', () => {
  const c = nouvelleCollection();
  c.medailles = 4; // la prochaine médaille franchit le palier
  const arene = recompenser(c, 'arene', creerHasard(1));
  assert.equal(arene.length, REGLES.collection.boostersParVictoire.arene);
  assert.equal(arene[0].medailles, E.medaillesParVictoire.arene);
  assert.equal(arene[0].dollars, E.dollarsParPalier);
  assert.ok(arene[0].cartes.length > 0);
  const ligne = recompenser(c, 'enLigne', creerHasard(2));
  assert.equal(ligne.length, REGLES.collection.boostersParVictoire.enLigne);
  assert.equal(ligne[0].medailles, E.medaillesParVictoire.enLigne);
  assert.equal(ligne[1].medailles, undefined);
});

test('en ligne avec les cartes de base : pas de cartes, un booster de récompense avec les médailles', () => {
  const c = nouvelleCollection();
  const r = recompenser(c, 'enLigne', creerHasard(3), 1, false);
  assert.equal(r.length, 1);
  assert.equal(r[0].type, 'recompense');
  assert.deepEqual(r[0].cartes, []);
  assert.equal(r[0].medailles, E.medaillesParVictoire.enLigne);
  assert.equal(c.medailles, E.medaillesParVictoire.enLigne);
});

test('boutique : un booster coûte des $, refusé sans assez de $', () => {
  const c = nouvelleCollection();
  assert.equal(typeof acheterBooster(c, 'classique', creerHasard(4)), 'string');
  c.dollars = E.prixBooster.rare + 3;
  const b = acheterBooster(c, 'rare', creerHasard(5));
  assert.ok(typeof b !== 'string' && b.type === 'rare' && b.cartes.length === REGLES.collection.boosters.rare.cartes);
  assert.equal(c.dollars, 3);
});

test('sauvegarde : médailles et $ relus, valeurs absurdes remises à zéro', () => {
  const c = nouvelleCollection();
  c.medailles = 12; c.dollars = 40;
  const r = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual([r.medailles, r.dollars], [12, 40]);
  const x = depuisSauvegarde({ ...JSON.parse(JSON.stringify(c)), medailles: -3, dollars: 'beaucoup' });
  assert.deepEqual([x.medailles, x.dollars], [0, 0]);
});
