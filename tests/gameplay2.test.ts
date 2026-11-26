// Gameplay 2 (25/11/2026) : identité des actions, combos, nouvelles actions, second souffle.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { c, combatTest, tour, toujours } from './outils';
import { ACTIONS, REGLES } from '../src/moteur/config';
import { comboPossible, coutDuTour, souffleDispo } from '../src/moteur/combat';
import { choixOrdinateur } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';

describe('Identité des actions', () => {
  it('Parade : bloque et fait perdre 3 d\'endurance à l\'attaquant', () => {
    const e = tour(combatTest(), c('parade'), c('attaque_base'));
    assert.equal(e.joueurs[1].score, 0);
    assert.equal(e.joueurs[1].endurance, 100 - ACTIONS.attaque_base.cout - REGLES.parade.perteAttaquant);
  });

  it('grosse attaque bloquée : 3 d\'endurance en plus pour l\'attaquant', () => {
    const e = tour(combatTest(), c('defense'), c('grande_projection'));
    assert.equal(e.joueurs[1].endurance, 100 - ACTIONS.grande_projection.cout - REGLES.grosseAttaqueBloquee.perte);
  });

  it('Esquive : pas de récupération, mais l\'initiative (ici le tirage la donne)', () => {
    const e = tour(combatTest(), c('esquive'), c('attaque_base'));
    assert.equal(e.joueurs[0].endurance, 100 - ACTIONS.esquive.cout);
    assert.equal(e.joueurs[0].initiative, true);
  });

  it('Relance : 2 points face à une défense, la moitié des points face à une attaque', () => {
    assert.equal(tour(combatTest(), c('relance'), c('defense')).joueurs[0].score, REGLES.relance.pointsSurDefense);
    const e = tour(combatTest({ force: 200 }), c('relance'), c('double_jambe'));
    assert.equal(e.joueurs[0].score, 2);
  });

  it('Simple jambe : le matraquage ne baisse pas sa précision', () => {
    const depart = combatTest();
    depart.joueurs[1].endurance = 52;
    depart.joueurs[1].malusPrecisionTours = 2;
    assert.equal(tour(depart, c('feinte'), c('simple_jambe'), toujours(0.95)).joueurs[1].score, 2);
    assert.equal(tour(depart, c('feinte'), c('attaque_base'), toujours(0.95)).joueurs[1].score, 0);
  });
});

describe('Combos', () => {
  it('Passage dans le dos : matraquage puis ceinture arrière, +2', () => {
    let e = tour(combatTest(), c('matraquage'), c('contre'));
    assert.equal(comboPossible(e, 0, 'ceinture_arriere'), 'Passage dans le dos');
    const avant = e.joueurs[0].score;
    e = tour(e, c('ceinture_arriere'), c('feinte'));
    assert.equal(e.joueurs[0].score - avant, ACTIONS.ceinture_arriere.points + REGLES.bonusFeinte + REGLES.combos.passageDansLeDos.points);
    assert.ok(e.journal.some((l) => l.startsWith('Combo « Passage dans le dos »')));
  });

  it('Contre-temps : après un sprawl réussi, l\'attaque ne peut pas rater', () => {
    let e = tour(combatTest(), c('sprawl'), c('attaque_base'));
    e.joueurs[0].endurance = 20; // elle raterait avec ce tirage
    const avant = e.joueurs[0].score;
    e = tour(e, c('attaque_base'), c('feinte'), toujours(0.99));
    assert.equal(e.joueurs[0].score - avant, 2);
  });

  it('Enchaînement aux jambes : simple puis double jambe, +1 et 2 d\'endurance en moins', () => {
    let e = tour(combatTest(), c('simple_jambe'), c('feinte'));
    assert.equal(coutDuTour(e, 0, 'double_jambe'), ACTIONS.double_jambe.cout - 2);
    const avant = e.joueurs[0].score;
    e = tour(e, c('double_jambe'), c('feinte'));
    assert.equal(e.joueurs[0].score - avant, ACTIONS.double_jambe.points + 1);
  });

  it('Esquive et contre : le contre gagne même sans avantage d\'endurance ni de force', () => {
    let e = tour(combatTest({ force: 100 }, { force: 200 }), c('esquive'), c('attaque_base'));
    e.joueurs[0].endurance = 50; // moins que l'attaquant, mais pas la moitié (pas de bonus de double)
    e.joueurs[0].initiative = false;
    e = tour(e, c('contre'), c('double_jambe'));
    assert.equal(e.joueurs[0].score, ACTIONS.double_jambe.points);
    assert.equal(e.joueurs[1].score, 0);
  });
});

describe('Nouvelles actions', () => {
  it('Bras tiré : l\'attaque suivante coûte 2 de moins', () => {
    const e = tour(combatTest(), c('bras_tire'), c('feinte'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(coutDuTour(e, 0, 'grande_projection'), ACTIONS.grande_projection.cout - 2);
    assert.equal(coutDuTour(e, 0, 'defense'), ACTIONS.defense.cout);
  });

  it('Sortie de zone : un contre ne la prend qu\'une fois sur 2', () => {
    const depart = combatTest({ force: 200 });
    assert.equal(tour(depart, c('contre'), c('sortie_zone'), toujours(0)).joueurs[0].score, 1);
    const rate = tour(depart, c('contre'), c('sortie_zone'), toujours(0.99));
    assert.equal(rate.joueurs[1].score, 1);
    assert.equal(rate.joueurs[0].score, 0);
  });

  it('Cravate : sur une attaque aux jambes, 5 d\'endurance en plus', () => {
    const e = tour(combatTest({ force: 200 }), c('cravate'), c('simple_jambe'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].endurance, 100 - ACTIONS.simple_jambe.cout - 5 - REGLES.cravate.perteEndurance);
  });

  it('Tour de hanche : ne rate jamais avec plus de force', () => {
    const depart = combatTest({ force: 200 });
    depart.joueurs[0].endurance = 10;
    assert.equal(tour(depart, c('tour_hanche'), c('feinte'), toujours(0.99)).joueurs[0].score, 4);
  });

  it('Changement de niveau : l\'attaque suivante ne peut pas être contrée', () => {
    let e = tour(combatTest({}, { force: 250 }), c('changement_niveau'), c('contre'));
    assert.equal(e.joueurs[0].attaqueIncontrable, true);
    assert.equal(e.joueurs[0].bonusFeinte, 0); // pas de bonus de points
    e = tour(e, c('attaque_base'), c('contre'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].score, 0);
  });
});

describe('Second souffle', () => {
  it('une fois par combat sous 25 : +15 d\'endurance, et +1 pour l\'adversaire s\'il attaque', () => {
    const depart = combatTest();
    assert.equal(souffleDispo(depart, 0), false);
    depart.joueurs[0].endurance = 20;
    depart.joueurs[1].endurance = 30; // pas le double : l'attaque vaut ses 2 points
    assert.equal(souffleDispo(depart, 0), true);
    const e = tour(depart, c('souffle' as never), c('attaque_base'));
    assert.equal(e.joueurs[0].endurance, 35);
    assert.equal(e.joueurs[1].score, 2 + REGLES.souffle.penalite);
    assert.equal(souffleDispo(e, 0), false);
    e.joueurs[0].endurance = 10;
    assert.throws(() => tour(e, { action: 'souffle' }, c('defense')));
  });

  it('l\'ordinateur prend son second souffle quand il est presque à bout', () => {
    const e = combatTest();
    e.joueurs[1].endurance = 5;
    assert.deepEqual(choixOrdinateur(e, 1, creerHasard(1), 'fort'), { action: 'souffle' });
  });
});
