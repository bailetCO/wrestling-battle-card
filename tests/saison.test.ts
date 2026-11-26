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
  assert.equal(jo.boosters.length, 6); // légendaire + 3 rares + 2 fois les cartes de fin de saison
  assert.equal(jo.boosters[0].type, 'recompense');
  assert.equal(LUTTEURS.find((l) => l.id === jo.boosters[0].cartes[0])!.rarete, 'legendaire');
  assert.deepEqual(jo.boosters.slice(1, 4).map((b) => b.type), ['rare', 'rare', 'rare']);
  assert.ok(jo.finSaison);
  assert.equal(c.saison.terminees, 1);
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
  c.saison = { palier: 2, victoires: 0, numero: 1, terminees: 0 };
  c.scenesVues = ['histoire15', 'h0', 's1'];
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(d.saison, { palier: 2, victoires: 0, numero: 1, terminees: 0 });
  assert.deepEqual(d.scenesVues, ['histoire15', 'h0', 's1']);
  assert.deepEqual(depuisSauvegarde({}).saison, { palier: 0, victoires: 0, numero: 1, terminees: 0 });
});

test('dialogues : une scène pour chaque étape, chaque palier, et les deux fins', async () => {
  const { SCENES, scenesEnCours } = await import('../src/page/dialogues');
  for (let i = 0; i <= 14; i++) assert.ok(SCENES[`h${i}`]?.length, `h${i}`);
  assert.ok(SCENES.hfin?.length);
  for (let i = 0; i <= 6; i++) assert.ok(SCENES[`s${i}`]?.length, `s${i}`);
  for (const r of Object.values(SCENES).flat()) assert.ok(r.texte.length <= 160, r.texte);
  assert.deepEqual(scenesEnCours(3, 15, 0, false, true, true, 12), ['h3']);
  // Étapes 13 à 15 en même temps que la saison.
  assert.deepEqual(scenesEnCours(12, 15, 0, false, true, true, 12), ['hfin', 's0', 'h12']);
  assert.deepEqual(scenesEnCours(13, 15, 4, false, true, true, 12), ['s4', 'h13']);
  assert.deepEqual(scenesEnCours(15, 15, 4, false, true, true, 12), ['s4']);
  assert.deepEqual(scenesEnCours(15, 15, 6, true, true, true, 12), ['s6']);
});

test('saisons suivantes : fin aux Mondiaux, JO toutes les 4 saisons, cartes Champion du Monde', async () => {
  const { CHAMPIONS } = await import('../src/moteur/config');
  const { nbPaliers, nouvelleSaison, saisonOlympique, passerPalier } = await import('../src/page/saison');
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map(saisonOlympique), [true, false, false, false, true, false, true]);
  const c = ouverte();
  assert.ok(!nouvelleSaison(c)); // saison pas finie
  for (let s = 1; s <= 5; s++) {
    assert.equal(c.saison.numero, s);
    assert.equal(nbPaliers(c), s === 1 || s === 5 ? 6 : 5);
    let fin = null;
    for (let i = 0; i < nbPaliers(c); i++) fin = passerPalier(c, h);
    assert.ok(fin!.finSaison);
    const cartes = fin!.boosters.filter((b) => b.cartes.length && b.cartes.every((id) => id.startsWith('champion-')));
    assert.equal(cartes.length, s === 1 || s === 5 ? 2 : 1, `saison ${s}`);
    for (const b of cartes) {
      assert.equal(b.cartes.length, 5);
      const diff = new Set(b.cartes).size;
      assert.ok(diff === 1 || diff === 5);
      for (const id of b.cartes) assert.ok(CHAMPIONS.some((x) => x.id === id));
    }
    assert.ok(saisonFinie(c));
    assert.equal(c.saison.terminees, s);
    c.scenesVues = ['s0', 's3', 'h12'];
    assert.ok(nouvelleSaison(c));
    assert.deepEqual(c.scenesVues, ['h12']);
    assert.equal(c.saison.palier, 0);
  }
});

test('cartes Champion du Monde : 12, verrouillées, jamais en booster, achat 200 $, étoiles avec les doubles', async () => {
  const { CHAMPIONS, NATIONS, niveauCarte } = await import('../src/moteur/config');
  const { acheterChampion, gradeDe, ouvrirBooster, possede, prochaineFusion, fusionner } = await import('../src/page/collection');
  assert.equal(CHAMPIONS.length, 12);
  assert.deepEqual(new Set(CHAMPIONS.map((l) => l.nation)), new Set(NATIONS.map((n) => n.id)));
  const c = nouvelleCollection();
  for (const l of CHAMPIONS) {
    assert.ok(!possede(c, l.id));
    assert.equal(niveauCarte(l, gradeDe(c, l.id)), 'champion');
  }
  const hh = creerHasard(9);
  for (let i = 0; i < 300; i++) for (const id of ouvrirBooster(c, hh).cartes) assert.ok(!id.startsWith('champion-'));
  const id = CHAMPIONS[0].id;
  c.dollars = 199;
  assert.equal(typeof acheterChampion(c, id), 'string');
  c.dollars = 400;
  assert.notEqual(typeof acheterChampion(c, id), 'string');
  assert.notEqual(typeof acheterChampion(c, id), 'string');
  assert.equal(c.dollars, 0);
  assert.equal(c.exemplaires[id], 2);
  assert.ok(possede(c, id));
  // Les doubles servent aux étoiles (la carte est déjà au niveau Champion du Monde).
  const f = prochaineFusion(c, id)!;
  assert.equal(f.type, 'etoile');
  c.exemplaires[id] = 10;
  assert.equal(fusionner(c, id, f.actions[0]), null);
});

test('cartes Champion du Monde : gardées dans la sauvegarde, utilisables dans Mon Club et les decks', async () => {
  const { recruter } = await import('../src/page/collection');
  const c = ouverte();
  c.exemplaires['champion-japon'] = 3;
  c.etoiles['champion-japon'] = { feinte: 1 };
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.exemplaires['champion-japon'], 3);
  assert.deepEqual(d.etoiles['champion-japon'], { feinte: 1 });
  d.medailles = 30;
  assert.equal(recruter(d, 'champion-japon'), null);
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(d))).club, ['champion-japon']);
});
