// Saison sportive : ouverte après le mode histoire 1, 6 paliers dans l'ordre, objectifs, récompenses.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { NB_PALIERS, PALIERS, creerCompetitionSaison, noterSaison, saisonFinie, saisonOuverte } from '../src/page/saison';

const h = creerHasard(3);
const ouverte = () => { const c = nouvelleCollection(); c.histoire.etape = 12; return c; };

test('saison : 6 paliers, tailles et objectifs du cahier des charges', () => {
  assert.equal(NB_PALIERS, 6);
  assert.deepEqual(PALIERS.map((p) => p.participants), [0, 6, 15, 30, 40, 40]);
  assert.deepEqual(PALIERS.map((p) => p.placeMax), [0, 1, 1, 3, 3, 1]);
  assert.equal(PALIERS[0].victoires, 3);
});

test('saison : fermée tant que le mode histoire 1 n\'est pas fini', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 11;
  assert.ok(!saisonOuverte(c));
  assert.equal(noterSaison(c, { type: 'interclub' }, h), null);
  assert.equal(c.saison.victoires, 0);
});

test('saison : interclub = 3 victoires, puis compétitions dans l\'ordre', () => {
  const c = ouverte();
  assert.equal(noterSaison(c, { type: 'competition', palier: 1, place: 1 }, h), null); // pas encore débloqué
  assert.equal(noterSaison(c, { type: 'interclub' }, h), null);
  assert.equal(noterSaison(c, { type: 'interclub' }, h), null);
  const r = noterSaison(c, { type: 'interclub' }, h)!;
  assert.equal(r.palier, 0);
  assert.equal(r.boosters.length, 2);
  assert.equal(c.saison.palier, 1);
  assert.equal(noterSaison(c, { type: 'interclub' }, h), null); // l'interclub ne compte plus
  // Régional : il faut gagner.
  assert.equal(noterSaison(c, { type: 'competition', palier: 1, place: 2 }, h), null);
  assert.equal(noterSaison(c, { type: 'competition', palier: 1, place: 1 }, h)!.boosters.length, 2);
  assert.equal(noterSaison(c, { type: 'competition', palier: 2, place: 1 }, h)!.boosters.length, 3);
  // International et Mondiaux : le podium suffit.
  assert.equal(noterSaison(c, { type: 'competition', palier: 3, place: 4 }, h), null);
  assert.equal(noterSaison(c, { type: 'competition', palier: 3, place: 3 }, h)!.boosters.length, 3);
  assert.equal(noterSaison(c, { type: 'competition', palier: 4, place: 2 }, h)!.boosters.length, 4);
  // JO : seulement l'or ; légendaire + 3 boosters rares.
  assert.equal(noterSaison(c, { type: 'competition', palier: 5, place: 2 }, h), null);
  const jo = noterSaison(c, { type: 'competition', palier: 5, place: 1 }, h)!;
  assert.equal(jo.boosters.length, 4);
  assert.equal(jo.boosters[0].type, 'recompense');
  assert.equal(LUTTEURS.find((l) => l.id === jo.boosters[0].cartes[0])!.rarete, 'legendaire');
  assert.deepEqual(jo.boosters.slice(1).map((b) => b.type), ['rare', 'rare', 'rare']);
  assert.ok(saisonFinie(c));
});

test('saison : une compétition d\'un ancien palier ne compte pas', () => {
  const c = ouverte();
  c.saison.palier = 3;
  assert.equal(noterSaison(c, { type: 'competition', palier: 2, place: 1 }, h), null);
  assert.equal(c.saison.palier, 3);
});

test('saison : compétitions à la bonne taille et au bon niveau', () => {
  const c = ouverte();
  assert.equal(creerCompetitionSaison(c, 'usa', 1), null); // interclub : pas de compétition
  for (let i = 1; i < NB_PALIERS; i++) {
    c.saison.palier = i;
    const t = creerCompetitionSaison(c, 'usa', i)!;
    assert.equal(t.lutteurs.length, PALIERS[i].participants);
    assert.equal(t.saison, i);
    assert.equal(t.nom, PALIERS[i].nom);
    assert.equal(t.niveaux, PALIERS[i].niveau);
  }
});

test('saison et scènes gardées dans la sauvegarde', () => {
  const c = ouverte();
  c.saison = { palier: 2, victoires: 0 };
  c.scenesVues = ['h0', 's1'];
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(d.saison, { palier: 2, victoires: 0 });
  assert.deepEqual(d.scenesVues, ['h0', 's1']);
  assert.deepEqual(depuisSauvegarde({}).saison, { palier: 0, victoires: 0 });
});

test('dialogues : une scène pour chaque étape, chaque palier, et les deux fins', async () => {
  const { SCENES, scenesEnCours } = await import('../src/page/dialogues');
  for (let i = 0; i <= 12; i++) assert.ok(SCENES[`h${i}`]?.length, `h${i}`);
  for (let i = 0; i <= 6; i++) assert.ok(SCENES[`s${i}`]?.length, `s${i}`);
  for (const r of Object.values(SCENES).flat()) assert.ok(r.texte.length <= 160, r.texte);
  assert.deepEqual(scenesEnCours(3, 12, 0, false), ['h3']);
  assert.deepEqual(scenesEnCours(12, 12, 0, false), ['h12', 's0']);
  assert.deepEqual(scenesEnCours(12, 12, 4, false), ['s4']);
  assert.deepEqual(scenesEnCours(12, 12, 6, true), ['s6']);
});
