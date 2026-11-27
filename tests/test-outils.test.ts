// Outils de test : lutteur Cocoach (Champion du Monde, meilleures statistiques) et passage d'étape.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ID_LUTTEUR_TEST, LUTTEURS, LUTTEUR_TEST, niveauCarte, trouverLutteur } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { choisirDeck, defPossede, depuisSauvegarde, gradeDe, nouvelleCollection, possede } from '../src/page/collection';
import { passerEtape } from '../src/page/histoire';
import { NB_PALIERS, passerPalier } from '../src/page/saison';

test('Cocoach (test) : meilleures statistiques, Champion du Monde, hors des 120 cartes', () => {
  assert.equal(LUTTEUR_TEST.nom, 'Cocoach');
  assert.ok(!LUTTEURS.some((l) => l.id === ID_LUTTEUR_TEST));
  assert.equal(trouverLutteur(ID_LUTTEUR_TEST), LUTTEUR_TEST);
  for (const l of LUTTEURS) {
    assert.ok(LUTTEUR_TEST.enduranceMax >= l.enduranceMax);
    assert.ok(LUTTEUR_TEST.force >= l.force);
    assert.ok(LUTTEUR_TEST.recuperation >= l.recuperation);
  }
  const c = nouvelleCollection();
  assert.ok(possede(c, ID_LUTTEUR_TEST));
  assert.equal(niveauCarte(LUTTEUR_TEST, gradeDe(c, ID_LUTTEUR_TEST)), 'champion');
  const d = defPossede(c, ID_LUTTEUR_TEST);
  assert.ok(d.enduranceMax > LUTTEUR_TEST.enduranceMax); // bonus de niveau en plus
  assert.equal(d.actions.length, 4);
});

test('passer l\'étape (test) : tout le mode histoire puis toute la saison, avec les récompenses', () => {
  const c = nouvelleCollection();
  const h = creerHasard(5);
  let boosters = 0;
  for (let i = 0; i < 18; i++) {
    const r = passerEtape(c, h);
    assert.ok(r.length >= 1);
    boosters += r.reduce((n, x) => n + x.boosters.length, 0);
  }
  assert.equal(c.histoire.etape, 18);
  assert.equal(boosters, 1 + 1 + 1 + 1 + 2 + 2 + 2 + 2 + 3 + 3 + 3 + 3 + 2 + 2 + 3 + 2 + 3 + 3 + 1 + 1); // dernière étape : la légendaire, puis la carte de Darius
  assert.deepEqual(passerEtape(c, h), []);
  assert.equal(passerPalier(c, h), null); // saison fermée : Mon Club pas au niveau 10
  c.medailles = 55;
  for (let i = 0; i < NB_PALIERS; i++) assert.equal(passerPalier(c, h)!.palier, i);
  assert.equal(c.saison.palier, NB_PALIERS);
  assert.equal(passerPalier(c, h), null);
});

test('le lutteur de test peut composer son deck avec toutes les actions du jeu', () => {
  const c = nouvelleCollection();
  assert.equal(choisirDeck(c, ID_LUTTEUR_TEST, ['matraquage', 'ceinture_arriere', 'sprawl', 'bras_tire']), null);
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(c))).decks[ID_LUTTEUR_TEST], ['matraquage', 'ceinture_arriere', 'sprawl', 'bras_tire']);
});
