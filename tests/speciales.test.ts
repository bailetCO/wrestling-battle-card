// Actions spéciales revues (24/11/2026) : contre spécial, feinte spéciale et
// enchaînement, percée de l'attaque spéciale, tombé à 1 chance sur 5.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import { c, combatTest, tour, toujours } from './outils';

// Joue un tour neutre pour arriver au tour 2 (spéciale disponible).
// Attaque contre attaque : personne ne marque, et le compteur de passivité repart à zéro.
const auTour2 = (e: ReturnType<typeof combatTest>) => tour(e, c('attaque_base'), c('attaque_base'));

describe('Tombé', () => {
  it('avec moins d\'endurance : 1 chance sur 5', () => {
    assert.equal(REGLES.tombe.moinsEndurance, 1 / 5);
  });
});

describe('Contre spécial', () => {
  it('face à une attaque : gagne toujours, renvoie tous les points, puis tombé', () => {
    // Le contreur a moins d'endurance et moins de force : un contre normal laisserait passer l'attaque.
    let e = auTour2(combatTest({ familleSpeciale: 'contre', force: 100 }, { force: 200 }));
    e.joueurs[0].endurance = 60;
    e = tour(e, c('contre', true), c('double_jambe'), toujours(0), { choisirFace: () => 'face' });
    assert.ok(e.journal.some((l) => l.includes('A marque 4 points (Contre : points de l\'attaque renvoyés)')));
    assert.ok(e.journal.some((l) => l.startsWith('A tente un tombé')));
  });

  it('face à une feinte : bat la feinte et tente le tombé', () => {
    let e = auTour2(combatTest({ familleSpeciale: 'contre' }));
    e = tour(e, c('contre', true), c('feinte'), toujours(0), { choisirFace: () => 'face' });
    assert.ok(e.journal.some((l) => l.includes('prend la feinte de B à contretemps')));
    assert.ok(e.journal.some((l) => l.startsWith('A tente un tombé')));
  });

  it('face à une défense : contre normal, sans tombé ni réduction de coût', () => {
    let e = auTour2(combatTest({ familleSpeciale: 'contre' }));
    e = tour(e, c('contre', true), c('defense'));
    assert.equal(e.journal.some((l) => l.includes('tente un tombé')), false);
    assert.equal(e.joueurs[0].reductionSpeciale, false);
    assert.ok(e.journal.some((l) => l.includes('ne se déclenche que face à une attaque ou une feinte')));
  });
});

describe('Feinte spéciale : enchaînement', () => {
  it('+4 sur l\'attaque suivante si elle réussit', () => {
    let e = auTour2(combatTest({ familleSpeciale: 'feinte' }));
    e = tour(e, c('feinte', true), c('defense')); // 2 points
    e = tour(e, c('attaque_base'), c('feinte')); // 2 points de l'attaque + 4 d'enchaînement
    assert.equal(e.joueurs[0].score, 2 + 2 + 4);
  });

  it('+4 sur le contre suivant, même face à une défense (qui ne rapporte rien sinon)', () => {
    let e = auTour2(combatTest({ familleSpeciale: 'feinte' }));
    e = tour(e, c('feinte', true), c('defense'));
    e = tour(e, c('contre'), c('defense'));
    assert.equal(e.joueurs[0].score, 2 + 4);
  });

  it('le bonus disparaît si l\'action suivante échoue ou n\'est ni une attaque ni un contre', () => {
    let e = auTour2(combatTest({ familleSpeciale: 'feinte' }));
    e = tour(e, c('feinte', true), c('defense'));
    e = tour(e, c('defense'), c('defense'));
    assert.equal(e.joueurs[0].bonusEnchainement, false);
    assert.equal(e.joueurs[0].score, 2);
  });
});

describe('Attaque spéciale : percée en force', () => {
  it('plus forte : perce la défense adverse (chance = 1 − 150 / 250 = 40 %)', () => {
    let e = auTour2(combatTest({ force: 250 }, { force: 150 }));
    e = tour(e, c('attaque_base', true), c('defense'), toujours(0), { choisirFace: () => 'face' });
    assert.ok(e.journal.some((l) => l.includes('perce la défense de B (40 % de chances)')));
    assert.ok(e.journal.some((l) => l.startsWith('A marque 2 points')));
  });

  it('perce aussi un contre normal', () => {
    let e = auTour2(combatTest({ force: 250 }, { force: 150 }));
    e = tour(e, c('attaque_base', true), c('contre'), toujours(0), { choisirFace: () => 'face' });
    assert.ok(e.journal.some((l) => l.includes('perce le contre de B')));
  });

  it('tirage raté : la défense tient', () => {
    let e = auTour2(combatTest({ force: 250 }, { force: 150 }));
    const tirages = [0, 0, 0.5]; // précisions réussies, percée ratée (0,5 > 0,4)
    let i = 0;
    e = tour(e, c('attaque_base', true), c('defense'), () => tirages[i++] ?? 0);
    assert.ok(e.journal.some((l) => l.includes('sans succès (40 % de chances)')));
    assert.equal(e.joueurs[0].score, 0);
  });

  it('pas de percée face à une défense spéciale ni sans avantage de force', () => {
    let e = auTour2(combatTest({ force: 250 }, { force: 150, familleSpeciale: 'defense' }));
    e = tour(e, c('attaque_base', true), c('defense', true), toujours(0));
    assert.equal(e.journal.some((l) => l.includes('perce')), false);
    let f = auTour2(combatTest({ force: 150 }, { force: 150 }));
    f = tour(f, c('attaque_base', true), c('defense'), toujours(0));
    assert.equal(f.journal.some((l) => l.includes('perce')), false);
  });
});
