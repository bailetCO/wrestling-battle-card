// Combat rapide (une période, mort subite) et ordinateur à 3 niveaux.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixFacile, choixFort, choixOrdinateur, reactionOrdinateur } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import { niveauCompte, nouvelleCollection } from '../src/page/collection';
import { testeur, toujours } from './outils';

const a = () => testeur({ id: 'a', nom: 'A' });
const b = () => testeur({ id: 'b', nom: 'B' });

test('combat rapide : une seule période, puis mort subite à égalité', () => {
  let e = creerCombat(a(), b(), { rapide: true });
  // 10 tours de défense des deux côtés : 0-0, donc mort subite.
  for (let t = 0; t < REGLES.toursParPeriode; t++) e = jouerTour(e, { action: 'defense' }, { action: 'defense' }, toujours(0));
  assert.equal(e.termine, false);
  assert.equal(e.mortSubite, true);
  assert.equal(e.periode, 1);
  // Le premier qui marque gagne.
  e = jouerTour(e, { action: 'attaque_base' }, { action: 'feinte' }, toujours(0));
  assert.equal(e.termine, true);
  assert.equal(e.vainqueur, 0);
});

test('combat rapide : victoire aux points à la fin de la période, sans 2e période', () => {
  let e = creerCombat(a(), b(), { rapide: true });
  e = jouerTour(e, { action: 'attaque_base' }, { action: 'feinte' }, toujours(0));
  for (let t = 1; t < REGLES.toursParPeriode && !e.termine; t++) e = jouerTour(e, { action: 'defense' }, { action: 'defense' }, toujours(0));
  assert.equal(e.termine, true);
  assert.equal(e.vainqueur, 0);
  assert.equal(e.periode, 1);
});

test('combat rapide : la mort subite finit toujours (départage au bout de 10 tours sans point)', () => {
  let e = creerCombat(a(), b(), { rapide: true });
  let n = 0;
  while (!e.termine && n++ < 100) e = jouerTour(e, { action: 'defense' }, { action: 'defense' }, toujours(0));
  assert.equal(e.termine, true);
  assert.equal(e.tourGlobal - 1, REGLES.toursParPeriode + REGLES.rapide.mortSubiteMax);
});

test('habitudes : les dernières familles jouées sont retenues (6 au plus)', () => {
  let e = creerCombat(a(), b());
  for (let t = 0; t < 8; t++) e = jouerTour(e, { action: 'defense' }, { action: 'feinte' }, toujours(0.99));
  assert.equal(e.joueurs[0].habitudes.length, REGLES.ia.fort.memoireHabitudes);
  assert.ok(e.joueurs[0].habitudes.every((f) => f === 'defense'));
});

test('ordinateur fort : contre un joueur qui se défend toujours, il feinte ou contre le plus souvent', () => {
  let e = creerCombat(a(), b());
  for (let t = 0; t < 6; t++) e = jouerTour(e, { action: 'defense' }, { action: 'defense' }, toujours(0.99));
  const h = creerHasard(3);
  let bat = 0;
  for (let i = 0; i < 200; i++) {
    const f = choixFort(e, 1, h);
    if (f.action === 'feinte' || f.action === 'contre' || f.action === 'matraquage' || f.action === 'relance') bat++;
  }
  assert.ok(bat > 140, `${bat}/200`);
});

test('ordinateur facile : jamais d\'action spéciale ; avec l\'initiative, change rarement', () => {
  const e = creerCombat(a(), b());
  e.tourGlobal = 10;
  const h = creerHasard(5);
  for (let i = 0; i < 200; i++) assert.ok(!choixFacile(e, 1, h).speciale);
  let change = 0;
  for (let i = 0; i < 4000; i++) {
    const r = reactionOrdinateur(e, 1, { action: 'defense' }, { action: 'feinte' }, h, 'facile');
    if (r.action !== 'defense') change++;
  }
  assert.ok(Math.abs(change / 4000 - REGLES.ia.chanceChangerInitiative.facile) < 0.03);
  assert.ok(choixOrdinateur(e, 1, h, 'normal'));
});

test('niveau de compte : +1 toutes les 15 médailles', () => {
  const c = nouvelleCollection();
  const niv = (m: number) => { c.medailles = m; return niveauCompte(c); };
  assert.deepEqual([0, 14, 15, 29, 30, 100].map(niv), [1, 1, 2, 2, 3, 7]);
});
