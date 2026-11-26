// Mon Club jusqu'au niveau 10 : places, boosters rares dès le niveau 6, saison sportive au niveau 10.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur';
import { depuisSauvegarde, medaillesNiveauSuivant, niveauClub, nouvelleCollection, placesClub, recompensesClub } from '../src/page/collection';
import { noterSaison, saisonOuverte } from '../src/page/saison';

const h = creerHasard(7);

test('Mon Club : 1 niveau toutes les 5 médailles, jusqu\'au niveau 10 (10 places)', () => {
  const c = nouvelleCollection();
  const attendus: [number, number][] = [[9, 0], [10, 1], [30, 5], [35, 6], [54, 9], [55, 10], [500, 10]];
  for (const [m, n] of attendus) {
    c.medailles = m;
    assert.equal(niveauClub(c), n, `${m} médailles`);
    assert.equal(placesClub(c), n);
  }
  c.medailles = 50;
  assert.equal(medaillesNiveauSuivant(c), 55);
  c.medailles = 55;
  assert.equal(medaillesNiveauSuivant(c), null);
  assert.equal(REGLES.club.niveauMax, 10);
});

test('un booster rare par niveau à partir du 6e, donné une seule fois', () => {
  const c = nouvelleCollection();
  c.medailles = 30; // niveau 5 : rien
  assert.deepEqual(recompensesClub(c, h), []);
  c.medailles = 40; // niveau 7 : niveaux 6 et 7
  const r = recompensesClub(c, h);
  assert.deepEqual(r.map((x) => x.niveau), [6, 7]);
  assert.ok(r.every((x) => x.booster.type === 'rare'));
  assert.deepEqual(recompensesClub(c, h), []); // pas deux fois
  c.medailles = 55;
  assert.deepEqual(recompensesClub(c, h).map((x) => x.niveau), [8, 9, 10]);
  // Gardé dans la sauvegarde.
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.clubRecompense, 10);
  assert.deepEqual(recompensesClub(d, h), []);
});

test('ancien joueur : saison déjà ouverte par l\'histoire, mais club trop bas → verrouillée, progression gardée', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 15;
  c.saison = { palier: 2, victoires: 0, numero: 1, terminees: 0 };
  c.medailles = 30;
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.ok(!saisonOuverte(d));
  assert.equal(d.saison.palier, 2);
  assert.equal(noterSaison(d, { type: 'interclub' }, h), null);
  d.medailles = 55;
  assert.ok(saisonOuverte(d));
  assert.equal(d.saison.palier, 2);
});
