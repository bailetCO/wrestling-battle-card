// Darius, le mentor du mode histoire, et sa carte secrète (27/11/2026).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAMPIONS, DARIUS, ETOILES_DARIUS, ID_DARIUS, LUTTEURS, REGLES, coutAction, trouverLutteur } from '../src/moteur';
import { creerHasard } from '../src/moteur/hasard';
import { defPossede, depuisSauvegarde, nbEtoiles, nbExemplaires, nouvelleCollection, ouvrirBooster } from '../src/page/collection';
import { NB_ETAPES, carteDarius, passerEtape } from '../src/page/histoire';
import { SCENES } from '../src/page/dialogues';

test('Darius remplace Philippe dans tous les dialogues', () => {
  const qui = new Set(Object.values(SCENES).flat().map((r) => r.qui));
  assert.deepEqual([...qui].sort(), ['cocoach', 'darius']);
  assert.ok(!JSON.stringify(SCENES).includes('Philippe'));
});

test('carte Darius : Champion du Monde, hors des 120 et des 12 Champions distribués', () => {
  assert.equal(DARIUS.rarete, 'champion');
  assert.equal(DARIUS.nom, 'Darius Westrell');
  assert.equal(trouverLutteur(ID_DARIUS).id, ID_DARIUS);
  assert.ok(!LUTTEURS.some((l) => l.id === ID_DARIUS));
  assert.ok(!CHAMPIONS.some((l) => l.id === ID_DARIUS)); // ni boutique, ni fin de saison, ni quête
});

test('carte Darius : jamais dans un booster', () => {
  const c = nouvelleCollection();
  const h = creerHasard(7);
  for (let i = 0; i < 400; i++) assert.ok(!ouvrirBooster(c, h, i % 2 ? 'rare' : 'classique').cartes.includes(ID_DARIUS));
  assert.equal(nbExemplaires(c, ID_DARIUS), 0);
});

test('carte Darius : gagnée seulement à la fin du mode histoire, avec 2 étoiles sur 2 actions différentes', () => {
  const c = nouvelleCollection();
  const h = creerHasard(3);
  for (let i = 0; i < NB_ETAPES - 1; i++) {
    passerEtape(c, h);
    assert.equal(nbExemplaires(c, ID_DARIUS), 0, `pas encore à l'étape ${i + 1}`);
  }
  const fin = passerEtape(c, h);
  assert.ok(fin[0].boosters.some((b) => b.cartes.includes(ID_DARIUS)));
  assert.equal(nbExemplaires(c, ID_DARIUS), 1);
  const etoiles = c.etoiles[ID_DARIUS];
  assert.equal(nbEtoiles(c, ID_DARIUS), ETOILES_DARIUS);
  assert.equal(Object.keys(etoiles).length, 2);
  // Les 2 actions étoilées coûtent 1 de moins que sans étoile.
  const d = defPossede(c, ID_DARIUS);
  for (const a of Object.keys(etoiles) as (keyof typeof etoiles)[]) {
    assert.equal(coutAction(d, a), Math.max(REGLES.fusion.coutMinimum, coutAction(defPossede({ ...c, etoiles: {} }, ID_DARIUS), a) - 1));
  }
});

test('carte Darius : un seul exemplaire, les étoiles ne changent plus', () => {
  const c = nouvelleCollection();
  carteDarius(c, creerHasard(1));
  const avant = { ...c.etoiles[ID_DARIUS] };
  const b = carteDarius(c, creerHasard(99));
  assert.deepEqual(b.nouvelles, []);
  assert.equal(nbExemplaires(c, ID_DARIUS), 1);
  assert.deepEqual(c.etoiles[ID_DARIUS], avant);
});

test('carte Darius : gardée par la sauvegarde', () => {
  const c = nouvelleCollection();
  carteDarius(c, creerHasard(5));
  const r = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(nbExemplaires(r, ID_DARIUS), 1);
  assert.equal(nbEtoiles(r, ID_DARIUS), 2);
});
