// Ajouts de l'étape 2 : noms locaux et réaction de l'ordinateur à l'initiative.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, COUT_FAMILLE, LUTTEURS, avecDeck, avecGrade, coutAction, nomLocal, trouverLutteur, verifierDeck } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { reagirInitiative } from '../src/moteur/ia';
import type { IdAction } from '../src/moteur/types';
import { c, toujours } from './outils';

test('jeu entièrement en français : le nom d\'une action est le même pour toutes les nations', () => {
  for (const id of Object.keys(ACTIONS) as IdAction[]) {
    for (const l of LUTTEURS) assert.equal(nomLocal(l.nation, id), ACTIONS[id].nom);
  }
  assert.equal(nomLocal('usa', 'double_jambe'), 'Double jambe');
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

test('chaque lutteur : 4 actions différentes, une action de sa famille spéciale, force sous 250', () => {
  for (const l of LUTTEURS) {
    assert.equal(new Set(l.actions).size, 4, l.id);
    assert.ok(l.actions.some((a) => ACTIONS[a].famille === l.familleSpeciale), l.id);
    assert.ok(l.force <= 250 && l.enduranceMax <= 100, l.id);
  }
});

test('decks : 4 actions de base + 4 déblocages différents par lutteur', () => {
  for (const l of LUTTEURS) {
    assert.deepEqual(l.actionsPossibles, l.actions, l.id);
    assert.equal(new Set([...l.actions, ...l.deblocages]).size, 8, l.id);
    assert.equal(verifierDeck(l, l.actions), null, l.id);
  }
});

test('coûts : les actions d\'une même famille ont le même coût de base', () => {
  assert.deepEqual(COUT_FAMILLE, { attaque: 6, defense: 3, contre: 6, feinte: 3 });
  for (const a of Object.values(ACTIONS)) assert.equal(a.cout, COUT_FAMILLE[a.famille], a.id);
});

test('grades : chaque niveau de rareté donne une action qui coûte 1 de moins (coût minimum 1)', () => {
  const eu = trouverLutteur('europe-7'); // commune ; déblocages : simple jambe, parade, matraquage, relance
  const g3 = avecGrade(eu, 3);
  assert.deepEqual(g3.actionsPossibles, [...eu.actions, 'simple_jambe', 'parade']);
  assert.equal(coutAction(g3, 'simple_jambe'), 5);
  assert.equal(coutAction(g3, 'parade'), 2);
  assert.equal(coutAction(g3, 'attaque_base'), 6); // action de base : coût normal
  const g5 = avecGrade(eu, 5, { parade: 3, attaque_base: 2 });
  assert.equal(coutAction(g5, 'parade'), 1); // 3 − 1 (déblocage) − 3 étoiles → minimum 1
  assert.equal(coutAction(g5, 'attaque_base'), 4);
  assert.equal(coutAction(avecGrade(eu, 4, { attaque_base: 2 }), 'attaque_base'), 6); // étoiles seulement en Champion du Monde
  // Le niveau fixe le nombre d'actions : une légendaire en a 3 dès le départ, toutes en Champion du Monde.
  const usa = trouverLutteur('usa'); // déblocages : simple jambe, feinte, défense, ceinture arrière
  assert.deepEqual(avecGrade(usa, 1).actionsPossibles, [...usa.actions, 'simple_jambe', 'feinte', 'defense']);
  assert.deepEqual(avecGrade(usa, 2).actionsPossibles, [...usa.actions, ...usa.deblocages]);
  assert.deepEqual(avecGrade(eu, 5).actionsPossibles, [...eu.actions, ...eu.deblocages]);
  assert.equal(coutAction(avecGrade(usa, 2, { double_jambe: 1 }), 'double_jambe'), 5);
});

test('decks : refuse un deck sans action de la famille spéciale, ou avec une action pas encore débloquée', () => {
  const usa = trouverLutteur('usa'); // spéciale attaque
  assert.ok(verifierDeck(usa, ['sprawl', 'matraquage', 'relance', 'double_jambe', 'feinte'].slice(1, 5) as never));
  assert.ok(verifierDeck(usa, ['double_jambe', 'double_jambe', 'matraquage', 'relance']));
  assert.ok(verifierDeck(usa, ['simple_jambe', 'sprawl', 'matraquage', 'relance'])); // grade 1 : pas encore
  const g2 = avecGrade(usa, 2);
  assert.equal(verifierDeck(g2, ['simple_jambe', 'sprawl', 'matraquage', 'relance']), null);
  assert.ok(verifierDeck(g2, ['sprawl', 'matraquage', 'relance', 'feinte'])); // pas d'attaque
  assert.deepEqual(avecDeck(g2, ['simple_jambe', 'sprawl', 'matraquage', 'relance']).actions, ['simple_jambe', 'sprawl', 'matraquage', 'relance']);
});

test('récupération régulière : tous les 2 tours, 5 % de l\'endurance actuelle si la précision le permet', () => {
  let e = creerCombat('europe', 'usa');
  e = jouerTour(e, c('defense'), c('sprawl'), toujours(0)); // tour 1 : rien
  const avant = e.joueurs[0].endurance;
  e = jouerTour(e, c('defense'), c('sprawl'), toujours(0)); // tour 2 : récupération
  const apres = avant - ACTIONS.defense.cout;
  assert.ok(e.journal.some((l) => l.includes('(tous les 2 tours)')));
  assert.equal(Math.round(e.joueurs[0].endurance * 100), Math.round(Math.min(e.joueurs[0].def.enduranceMax, apres * 1.05) * 100));
});

