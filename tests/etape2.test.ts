// Ajouts de l'étape 2 : noms locaux et réaction de l'ordinateur à l'initiative.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, LUTTEURS, NOMS_LOCAUX, avecDeck, nomLocal, verifierDeck } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { reagirInitiative } from '../src/moteur/ia';
import type { IdAction } from '../src/moteur/types';
import { c, toujours } from './outils';

test('chaque action a un nom local pour chacune des 5 nations', () => {
  for (const id of Object.keys(ACTIONS) as IdAction[]) {
    for (const l of LUTTEURS) assert.ok(NOMS_LOCAUX[id][l.nation], `${id} / ${l.nation}`);
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
  assert.ok(e.journal.some((l) => l.includes('La défense de Hugo Delmas l\'emporte sur l\'attaque de Tanner Briggs')));
});

test('feinte contre attaque ratée : la feinte est dissipée, sans bonus ni initiative', () => {
  const e = creerCombat('japon', 'usa');
  e.joueurs[1].endurance = 10; // précision basse : l'attaque de USA peut rater
  const tirages = [0, 0.99]; // la feinte passe, l'attaque rate
  let i = 0;
  const apres = jouerTour(e, c('feinte'), c('double_jambe'), () => tirages[i++] ?? 0.5);
  assert.equal(apres.joueurs[0].bonusFeinte, false);
  assert.equal(apres.joueurs[0].initiative, false);
  assert.ok(apres.journal.some((l) => l.includes('la feinte de Kenji Arata est dissipée')));
});

test('feinte sur défense : seul le feinteur peut prendre l\'initiative', () => {
  const apres = jouerTour(creerCombat('japon', 'usa'), c('feinte'), c('sprawl'), toujours(0));
  assert.equal(apres.joueurs[0].initiative, true);
  assert.equal(apres.joueurs[1].initiative, false);
});

test('15 lutteurs : 3 styles par nation, identifiants uniques', () => {
  assert.equal(LUTTEURS.length, 15);
  assert.equal(new Set(LUTTEURS.map((l) => l.id)).size, 15);
  for (const n of ['usa', 'russie', 'europe', 'afrique', 'japon']) {
    assert.equal(LUTTEURS.filter((l) => l.nation === n).length, 3, n);
  }
});

test('chaque lutteur : 4 actions différentes, une action de sa famille spéciale, force sous 250', () => {
  for (const l of LUTTEURS) {
    assert.equal(new Set(l.actions).size, 4, l.id);
    assert.ok(l.actions.some((a) => ACTIONS[a].famille === l.familleSpeciale), l.id);
    assert.ok(l.force <= 250 && l.enduranceMax <= 100, l.id);
  }
});

test('raretés réparties 5 communes, 5 rares, 3 épiques, 2 légendaires', () => {
  const n = (r: string) => LUTTEURS.filter((l) => l.rarete === r).length;
  assert.deepEqual([n('commune'), n('rare'), n('epique'), n('legendaire')], [5, 5, 3, 2]);
});

test('decks : 7 actions possibles par lutteur, le deck par défaut en fait partie et est valide', () => {
  for (const l of LUTTEURS) {
    assert.equal(new Set(l.actionsPossibles).size, 7, l.id);
    assert.equal(verifierDeck(l, l.actions), null, l.id);
  }
});

test('decks : refuse un deck sans action de la famille spéciale, ou hors liste', () => {
  const usa = LUTTEURS.find((l) => l.id === 'usa')!; // spéciale attaque
  assert.ok(verifierDeck(usa, ['sprawl', 'matraquage', 'relance', 'feinte']));
  assert.ok(verifierDeck(usa, ['double_jambe', 'sprawl', 'matraquage', 'contre']));
  assert.ok(verifierDeck(usa, ['double_jambe', 'double_jambe', 'matraquage', 'relance']));
  assert.equal(verifierDeck(usa, ['simple_jambe', 'sprawl', 'feinte', 'relance']), null);
  assert.deepEqual(avecDeck(usa, ['simple_jambe', 'sprawl', 'feinte', 'relance']).actions, ['simple_jambe', 'sprawl', 'feinte', 'relance']);
  assert.deepEqual(avecDeck(usa, ['contre', 'sprawl', 'feinte', 'relance']).actions, usa.actions);
});
