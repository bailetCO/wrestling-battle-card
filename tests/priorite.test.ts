// Même famille (26/11/2026) : un combo ou une attaque spéciale n'est pas bloqué par l'égalité de
// famille. Deux priorités : la meilleure chance de réussite du tour, puis la plus grande force.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { c, combatTest, tour, toujours } from './outils';
import type { EtatCombat } from '../src/moteur/types';

const auTour2 = (e: EtatCombat) => tour(e, c('attaque_base'), c('attaque_base')); // personne ne marque (même famille)
const marque = (e: EtatCombat) => e.joueurs.map((j) => j.score);

describe('Même famille : priorité du combo et de l\'attaque spéciale', () => {
  it('sans combo ni spéciale : blocage, personne ne marque (règle inchangée)', () => {
    const e = tour(combatTest(), c('double_jambe'), c('double_jambe'));
    assert.deepEqual(marque(e), [0, 0]);
  });

  it('combo (Simple jambe puis Double jambe) contre la même action : le combo passe', () => {
    const e0 = combatTest();
    e0.joueurs[0].derniereReussie = 'simple_jambe';
    const e = tour(e0, c('double_jambe'), c('double_jambe'));
    assert.ok(e.joueurs[0].score > 0, 'le combo marque');
    assert.equal(e.joueurs[1].score, 0, 'l\'autre est bloqué');
    assert.ok(e.journal.some((l) => l.includes('pas de blocage')));
  });

  it('combo contre une autre attaque (même famille) : le combo passe aussi', () => {
    const e0 = combatTest();
    e0.joueurs[1].derniereReussie = 'matraquage';
    const e = tour(e0, c('simple_jambe'), c('ceinture_arriere'));
    assert.equal(e.joueurs[0].score, 0);
    assert.ok(e.joueurs[1].score > 0);
  });

  it('le combo garde son tirage de précision : s\'il rate, rien ne passe', () => {
    const e0 = combatTest();
    e0.joueurs[0].derniereReussie = 'simple_jambe';
    e0.joueurs[0].endurance = 20; // précision basse
    const e = tour(e0, c('double_jambe'), c('double_jambe'), toujours(0.9));
    assert.equal(e.joueurs[0].score, 0);
  });

  it('attaque spéciale contre une attaque normale : elle n\'est pas bloquée', () => {
    let e = auTour2(combatTest());
    e = tour(e, c('double_jambe', true), c('simple_jambe'), toujours(0), { choisirFace: () => 'face' });
    assert.ok(e.joueurs[0].score > 0, 'la spéciale marque');
    assert.equal(e.joueurs[1].score, 0);
    assert.ok(e.journal.some((l) => l.includes('attaque spéciale')));
  });

  it('deux priorités : la meilleure chance de réussite du tour l\'emporte', () => {
    const e0 = combatTest();
    e0.joueurs[0].derniereReussie = 'simple_jambe'; // Enchaînement aux jambes : tirage normal
    e0.joueurs[0].endurance = 40; // chance de réussite plus basse
    e0.joueurs[1].derniereReussie = 'sprawl'; // Contre-temps : ne peut pas rater (100 %)
    const e = tour(e0, c('double_jambe'), c('double_jambe'));
    assert.equal(e.joueurs[0].score, 0);
    assert.ok(e.joueurs[1].score > 0);
    assert.ok(e.journal.some((l) => l.includes('meilleure chance de réussite')));
  });

  it('deux priorités, même chance de réussite : le plus fort l\'emporte', () => {
    const e0 = combatTest({ force: 120 }, { force: 200 });
    e0.joueurs[0].derniereReussie = 'sprawl';
    e0.joueurs[1].derniereReussie = 'sprawl';
    const e = tour(e0, c('double_jambe'), c('simple_jambe'));
    assert.equal(e.joueurs[0].score, 0);
    assert.ok(e.joueurs[1].score > 0);
    assert.ok(e.journal.some((l) => l.includes('plus fort')));
  });

  it('deux priorités, même chance et même force : règle habituelle (blocage)', () => {
    const e0 = combatTest();
    e0.joueurs[0].derniereReussie = 'sprawl';
    e0.joueurs[1].derniereReussie = 'sprawl';
    const e = tour(e0, c('double_jambe'), c('double_jambe'));
    assert.deepEqual(marque(e), [0, 0]);
  });
});
