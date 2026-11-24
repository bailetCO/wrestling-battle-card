// Ordinateur « fort ».

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixAleatoire, choixFort, reagirInitiativeForte } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import { c, combatTest, toujours } from './outils';

test('fort : choisit toujours une action jouable', () => {
  const h = creerHasard(7);
  let e = creerCombat('usa', 'japon');
  while (!e.termine) e = jouerTour(e, choixFort(e, 0, h), choixFort(e, 1, h), h);
  assert.ok(e.termine);
});

test('fort : sans endurance, joue Lutte', () => {
  const e = combatTest();
  e.joueurs[0].endurance = 0;
  assert.deepEqual(choixFort(e, 0, toujours(0)), { action: 'lutte' });
});

test('fort : avec l\'initiative, 3 fois sur 4 il contre ton action', () => {
  const e = creerCombat('europe', 'usa'); // Europe : attaque, défense, feinte, contre
  // L'adversaire attaque : la défense ou le contre battent l'attaque.
  const r = reagirInitiativeForte(e, 0, c('feinte'), c('double_jambe'), toujours(0));
  assert.ok(['defense', 'contre'].includes(r.action as string), `a joué ${r.action}`);
  // Tirage au-dessus de 3/4 : il garde son action.
  assert.deepEqual(reagirInitiativeForte(e, 0, c('feinte'), c('double_jambe'), toujours(0.9)), c('feinte'));
});

test('fort : bat nettement l\'ordinateur au hasard (plus de 65 % sur 300 combats)', () => {
  let victoires = 0, total = 0, g = 1;
  for (let i = 0; i < 300; i++) {
    const a = LUTTEURS[i % 15].id, b = LUTTEURS[(i * 7 + 3) % 15].id;
    const h = creerHasard(g++);
    let e = creerCombat(a, b);
    const fort = (i % 2) as 0 | 1;
    while (!e.termine) {
      const c0 = fort === 0 ? choixFort(e, 0, h) : choixAleatoire(e, 0, h);
      const c1 = fort === 1 ? choixFort(e, 1, h) : choixAleatoire(e, 1, h);
      e = jouerTour(e, c0, c1, h);
    }
    total++;
    if (e.vainqueur === fort) victoires++;
  }
  assert.ok(victoires / total > 0.65, `${victoires}/${total}`);
});
