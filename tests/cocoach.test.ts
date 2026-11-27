// Cocoach : expressions des dialogues, rival puis ami, et sa carte secrète (27/11/2026).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CHAMPIONS, COCOACH, ETOILES_COCOACH, ID_COCOACH, ID_RIVAL, LUTTEURS, LUTTEUR_TEST, trouverLutteur } from '../src/moteur';
import { creerHasard } from '../src/moteur/hasard';
import { nbEtoiles, nbExemplaires, nouvelleCollection, ouvrirBooster } from '../src/page/collection';
import { carteCocoach } from '../src/page/saison';
import { SCENES, scenesEnCours, varianteScene } from '../src/page/dialogues';

const HUMEURS = ['neutre', 'content', 'malin', 'vaincu', 'vainqueur', 'arrogant', 'mefiant'];

test('images : les 7 expressions et les 6 illustrations de carte existent', () => {
  for (const h of HUMEURS) assert.ok(existsSync(`public/cocoach/expressions/${h}.webp`), h);
  for (const n of ['presentation', 'commune', 'rare', 'epique', 'legendaire', 'champion']) assert.ok(existsSync(`public/cocoach/cartes/${n}.webp`), n);
});

test('dialogues : chaque réplique de Cocoach a une expression connue', () => {
  for (const r of Object.values(SCENES).flat()) {
    if (r.qui !== 'cocoach') continue;
    assert.ok(r.humeur && HUMEURS.includes(r.humeur), r.texte);
  }
});

test('dialogues : scène du cadeau après la 1re médaille d\'or, puis versions « ami »', () => {
  assert.ok(SCENES.hcocoach.some((r) => r.ami)); // il devient ami pendant la scène
  // JO gagnés (saison olympique finie) : la scène de la saison, puis celle du cadeau.
  assert.deepEqual(scenesEnCours(18, 18, 6, true, true, true, true, true), ['hdarius', 's6', 'hcocoach']);
  assert.deepEqual(scenesEnCours(18, 18, 6, true, true, true, true, false), ['hdarius', 's6']);
  // Avant le cadeau : scènes du rival ; après : celles de l'ami, quand elles existent.
  assert.equal(varianteScene('s1', false), 's1');
  assert.equal(varianteScene('s1', true), 's1_ami');
  assert.equal(varianteScene('h3', true), 'h3'); // pas de version ami : la scène de base
  for (const k of ['s0', 's1', 's2', 's3', 's4', 's5', 's4b', 's6b', 's6']) {
    assert.ok(SCENES[`${k}_ami`]?.length, k);
    assert.ok(SCENES[`${k}_ami`].filter((r) => r.qui === 'cocoach').every((r) => r.ami), k);
  }
});

test('carte Cocoach : Champion du Monde à part, différente du rival et du lutteur de test', () => {
  assert.equal(COCOACH.rarete, 'champion');
  assert.equal(trouverLutteur(ID_COCOACH).nom, 'Cocoach');
  assert.notEqual(ID_COCOACH, ID_RIVAL);
  assert.equal(LUTTEUR_TEST.nom, 'Cocoach (test)');
  assert.ok(![...LUTTEURS, ...CHAMPIONS].some((l) => l.id === ID_COCOACH));
});

test('carte Cocoach : jamais dans un booster', () => {
  const c = nouvelleCollection();
  const h = creerHasard(11);
  for (let i = 0; i < 400; i++) assert.ok(!ouvrirBooster(c, h, i % 2 ? 'rare' : 'classique').cartes.includes(ID_COCOACH));
});

test('carte Cocoach : 1re médaille d\'or = la carte avec 4 étoiles sur 4 actions ; ensuite un exemplaire de plus', () => {
  const c = nouvelleCollection();
  const b1 = carteCocoach(c, creerHasard(2));
  assert.deepEqual(b1.nouvelles, [ID_COCOACH]);
  assert.equal(nbExemplaires(c, ID_COCOACH), 1);
  assert.equal(nbEtoiles(c, ID_COCOACH), ETOILES_COCOACH);
  assert.equal(Object.keys(c.etoiles[ID_COCOACH]).length, 4);
  assert.ok(Object.values(c.etoiles[ID_COCOACH]).every((x) => x === 1));
  const avant = { ...c.etoiles[ID_COCOACH] };
  const b2 = carteCocoach(c, creerHasard(3));
  assert.deepEqual(b2.nouvelles, []);
  assert.equal(nbExemplaires(c, ID_COCOACH), 2); // un double pour la fusion
  assert.deepEqual(c.etoiles[ID_COCOACH], avant); // les étoiles ne bougent pas : elles se gagnent par fusion
});
