// Ajouts de l'étape 2 : noms locaux et réaction de l'ordinateur à l'initiative.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, LUTTEURS, NOMS_LOCAUX, nomLocal } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { reagirInitiative } from '../src/moteur/ia';
import type { IdAction } from '../src/moteur/types';
import { c, toujours } from './outils';

test('chaque action a un nom local pour chacune des 5 origines', () => {
  for (const id of Object.keys(ACTIONS) as IdAction[]) {
    for (const l of LUTTEURS) assert.ok(NOMS_LOCAUX[id][l.id], `${id} / ${l.id}`);
  }
});

test('le nom local dépend de l\'origine du lutteur', () => {
  assert.equal(nomLocal('usa', 'double_jambe'), 'Double Leg Takedown');
  assert.equal(nomLocal('russie', 'double_jambe'), 'Proxod');
  assert.equal(nomLocal('inconnu', 'double_jambe'), 'Double jambe');
});

test('initiative de l\'ordinateur : il garde son action si le tirage dépasse 1 chance sur 2', () => {
  const e = creerCombat('europe', 'usa');
  assert.deepEqual(reagirInitiative(e, 1, c('double_jambe'), toujours(0.9)), c('double_jambe'));
});

test('initiative de l\'ordinateur : il change pour une autre action jouable sinon', () => {
  const e = creerCombat('europe', 'usa');
  const nouveau = reagirInitiative(e, 1, c('double_jambe', true), toujours(0));
  assert.notEqual(nouveau.action, 'double_jambe');
  assert.ok(e.joueurs[1].def.actions.includes(nouveau.action as IdAction));
  assert.equal(nouveau.speciale, false);
});

test('le journal explique pourquoi un duel est gagné', () => {
  let e = creerCombat('europe', 'usa');
  e = jouerTour(e, c('defense'), c('double_jambe'), toujours(0));
  assert.ok(e.journal.some((l) => l.includes('La défense de Europe l\'emporte sur l\'attaque de USA')));
});
