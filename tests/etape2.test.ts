// Ajouts de l'étape 2 : noms locaux et réaction de l'ordinateur à l'initiative.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, CHAMPIONS, LUTTEURS, avecDeck, avecGrade, coutAction, nomLocal, trouverLutteur, verifierDeck } from '../src/moteur/config';
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
  assert.equal(apres.joueurs[0].bonusFeinte, 0);
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

test('coûts : le coût suit la puissance (attaque 1 pt : 3, 2 pts : 4, 4 pts : 6, 5 pts : 8)', () => {
  const parPoints: Record<number, number> = { 1: 3, 2: 4, 4: 6, 5: 8 };
  for (const a of Object.values(ACTIONS)) {
    if (a.famille === 'attaque') assert.equal(a.cout, parPoints[a.points], a.id);
  }
  assert.equal(ACTIONS.defense.cout, 3);
  assert.equal(ACTIONS.sprawl.cout, 4);
  assert.equal(ACTIONS.contre.cout, 6);
  assert.equal(ACTIONS.feinte.cout, 3);
  assert.equal(ACTIONS.matraquage.cout, 4);
});

test('chaque Champion du Monde a une nouvelle action en plus de ses 8 actions', () => {
  for (const ch of CHAMPIONS) {
    const g = avecGrade(ch, 1);
    assert.equal(g.actionsPossibles.length, 9, ch.id);
    const nouvelle = g.actionsPossibles.at(-1)!;
    const autres = [...ch.actions].sort((x, y) => Number(ACTIONS[y].famille === ch.familleSpeciale) - Number(ACTIONS[x].famille === ch.familleSpeciale));
    assert.equal(verifierDeck(g, [nouvelle, ...autres.slice(0, 3)]), null, ch.id);
  }
});

test('grades : chaque niveau de rareté donne une action qui coûte 1 de moins (coût minimum 1)', () => {
  const eu = trouverLutteur('europe-7'); // commune ; déblocages : simple jambe, parade, matraquage, relance
  const g3 = avecGrade(eu, 3);
  assert.deepEqual(g3.actionsPossibles, [...eu.actions, 'simple_jambe', 'parade']);
  assert.equal(coutAction(g3, 'simple_jambe'), 3);
  assert.equal(coutAction(g3, 'parade'), 2);
  assert.equal(coutAction(g3, 'attaque_base'), 4); // action de base : coût normal
  const g5 = avecGrade(eu, 5, { parade: 3, attaque_base: 2 });
  assert.equal(coutAction(g5, 'parade'), 1); // 3 − 1 (déblocage) − 3 étoiles → minimum 1
  assert.equal(coutAction(g5, 'attaque_base'), 2);
  assert.equal(coutAction(avecGrade(eu, 4, { attaque_base: 2 }), 'attaque_base'), 4); // étoiles seulement en Champion du Monde
  // Le niveau fixe le nombre d'actions : une légendaire en a 3 dès le départ, toutes en Champion du Monde.
  const usa = trouverLutteur('usa'); // déblocages : simple jambe, feinte, défense, ceinture arrière
  assert.deepEqual(avecGrade(usa, 1).actionsPossibles, [...usa.actions, 'simple_jambe', 'feinte', 'defense']);
  assert.deepEqual(avecGrade(usa, 2).actionsPossibles, [...usa.actions, ...usa.deblocages, usa.actionChampion]);
  assert.deepEqual(avecGrade(eu, 5).actionsPossibles, [...eu.actions, ...eu.deblocages, eu.actionChampion]);
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

test('récupération régulière : tous les 2 tours, 0,1 × récupération × barre d\'endurance si la précision le permet', () => {
  let e = creerCombat('europe', 'usa');
  e = jouerTour(e, c('defense'), c('sprawl'), toujours(0)); // tour 1 : rien
  const avant = e.joueurs[0].endurance;
  e = jouerTour(e, c('defense'), c('sprawl'), toujours(0)); // tour 2 : récupération
  const apres = avant - ACTIONS.defense.cout;
  assert.ok(e.journal.some((l) => l.includes('(tous les 2 tours)')));
  const d = e.joueurs[0].def;
  assert.equal(Math.round(e.joueurs[0].endurance * 100), Math.round(Math.min(d.enduranceMax, apres + 0.1 * d.recuperation * d.enduranceMax) * 100));
});


test('action de Champion : débloquée seulement au niveau Champion du Monde, selon rareté et style', () => {
  for (const l of LUTTEURS) {
    assert.ok(l.actionChampion, l.id);
    const simples = ['bras_tire', 'sortie_zone'];
    assert.equal(simples.includes(l.actionChampion!), l.rarete === 'commune' || l.rarete === 'rare', l.id);
    const max = avecGrade(l, 5);
    assert.ok(max.actionsPossibles.includes(l.actionChampion!), l.id);
    assert.equal(coutAction(max, l.actionChampion!), ACTIONS[l.actionChampion!].cout, l.id); // coût normal
    if (l.rarete !== 'legendaire') assert.ok(!avecGrade(l, 4 - ['commune', 'rare', 'epique'].indexOf(l.rarete)).actionsPossibles.includes(l.actionChampion!), l.id);
    else assert.ok(!avecGrade(l, 1).actionsPossibles.includes(l.actionChampion!), l.id);
  }
});
