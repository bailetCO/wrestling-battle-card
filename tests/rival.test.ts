// Cocoach, le rival du mode infini : progression, étoiles, ordinateur, nouvelle saison.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COCOACH_RIVAL, ID_RIVAL, REGLES, trouverLutteur } from '../src/moteur/config';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { defRival, etoilesRival, niveauOrdiRival, rivalBattu, rivalNouvelleSaison } from '../src/page/rival';

test('Cocoach commence en carte rare, ordinateur normal, deck de son niveau', () => {
  const c = nouvelleCollection();
  assert.equal(trouverLutteur(ID_RIVAL).nom, 'Cocoach');
  const d = defRival(c);
  assert.equal(d.niveau, 'rare');
  assert.deepEqual(d.actions, REGLES.rival.decks[0]);
  assert.equal(niveauOrdiRival(c), 'normal');
});

test('chaque victoire le fait monter : Épique, Légendaire, Champion du Monde, puis des étoiles', () => {
  const c = nouvelleCollection();
  const niveaux: string[] = [];
  for (let k = 0; k < 3; k++) {
    const m = rivalBattu(c);
    assert.equal(m.monte, true);
    niveaux.push(defRival(c).niveau!);
  }
  assert.deepEqual(niveaux, ['epique', 'legendaire', 'champion']);
  assert.equal(niveauOrdiRival(c), 'fort');
  assert.ok(defRival(c).force > COCOACH_RIVAL.force);
  assert.ok(defRival(c).actionsPossibles.includes('changement_niveau')); // action de Champion
  const m = rivalBattu(c);
  assert.equal(m.monte, false);
  assert.ok(m.etoile);
  assert.equal(etoilesRival(c), 1);
  assert.equal(c.rival.victoires, 4);
  // Jusqu'au maximum, puis plus rien.
  for (let k = 0; k < 40; k++) rivalBattu(c);
  assert.equal(etoilesRival(c), defRival(c).actionsPossibles.length * 3);
  assert.equal(rivalBattu(c).etoile, null);
});

test('nouvelle saison : il repart de Rare avec +2 % par saison, et c\'est sauvegardé', () => {
  const c = nouvelleCollection();
  rivalBattu(c); rivalBattu(c);
  rivalNouvelleSaison(c);
  assert.equal(c.rival.grade, 1);
  assert.equal(c.rival.bonus, 0.02);
  rivalNouvelleSaison(c);
  assert.equal(c.rival.bonus, 0.04);
  assert.equal(defRival(c).enduranceMax, Math.round(COCOACH_RIVAL.enduranceMax * 1.04));
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(c))).rival, c.rival);
});

test('la nouvelle saison sportive remet Cocoach à Rare', async () => {
  const { nouvelleSaison, passerPalier, nbPaliers } = await import('../src/page/saison');
  const { creerHasard } = await import('../src/moteur/hasard');
  const c = nouvelleCollection();
  c.histoire.etape = 12;
  rivalBattu(c);
  const h = creerHasard(2);
  for (let i = 0; i < nbPaliers(c); i++) passerPalier(c, h);
  assert.ok(nouvelleSaison(c));
  assert.equal(c.rival.grade, 1);
  assert.equal(c.rival.bonus, 0.02);
});
