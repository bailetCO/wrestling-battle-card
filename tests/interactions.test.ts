// Une vérification pour chaque ligne du tableau « Interactions entre les actions ».

import { describe, it } from 'node:test';
import { ACTIONS, REGLES } from '../src/moteur/config';
import assert from 'node:assert/strict';
import { c, combatTest, tour } from './outils';

describe('Interactions entre les familles', () => {
  it("l'attaque bat la feinte", () => {
    const e = tour(combatTest(), c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].score, 0);
  });

  it("la défense bat l'attaque (sans marquer, sauf sprawl)", () => {
    const e = tour(combatTest(), c('defense'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 0);
    assert.equal(e.joueurs[1].score, 0);
    assert.equal(e.joueurs[0].historique.at(-1)?.reussie, true);
  });

  it('le contre bat la défense (sans marquer)', () => {
    const e = tour(combatTest(), c('contre'), c('defense'));
    assert.equal(e.joueurs[0].score + e.joueurs[1].score, 0);
    assert.equal(e.joueurs[0].historique.at(-1)?.reussie, true);
    assert.equal(e.joueurs[1].historique.at(-1)?.reussie, false);
  });

  it('la feinte bat le contre et prépare +2 sur la prochaine attaque ou le prochain contre, pendant 2 tours', () => {
    const e = tour(combatTest(), c('feinte'), c('contre'));
    assert.equal(e.joueurs[0].bonusFeinte, REGLES.toursBonusFeinte);
  });

  it("la feinte bat la défense : -10 % d'endurance au défenseur et initiative (2 chances sur 3)", () => {
    const e = tour(combatTest(), c('feinte'), c('defense'));
    assert.equal(e.joueurs[1].endurance, 100 - 3 - 10);
    assert.equal(e.joueurs[0].initiative, true);
  });

  it("feinte sur défense sans initiative quand le tirage échoue", () => {
    let n = 0;
    // précisions (0, 0) puis tirage d'initiative à 0,9 (> 2/3)
    const hasard = () => [0, 0, 0.9][n++] ?? 0;
    const e = tour(combatTest(), c('feinte'), c('defense'), hasard);
    assert.equal(e.joueurs[0].initiative, false);
  });
});

describe('Contre contre attaque', () => {
  it("plus d'endurance ET plus de force : points renvoyés et déséquilibre", () => {
    const depart = combatTest({ force: 200 }, { force: 150 });
    depart.joueurs[1].endurance = 60;
    const e = tour(depart, c('contre'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].score, 0);
    assert.equal(e.joueurs[1].endurance, 60 - 6 - 5); // coût + déséquilibre 5 %
  });

  it('les points renvoyés incluent les bonus de l\'attaquant (ex. double jambe après feinte)', () => {
    const depart = combatTest({ force: 200 }, { force: 150 });
    depart.joueurs[1].endurance = 60;
    depart.joueurs[1].bonusFeinte = 2;
    const e = tour(depart, c('contre'), c('double_jambe'));
    assert.equal(e.joueurs[0].score, 6);
    assert.equal(e.joueurs[1].endurance, 60 - ACTIONS.double_jambe.cout - 15); // attaque à 6 points : -15 %
  });

  it("un seul des deux (endurance OU force) suffit : le contre renvoie les points", () => {
    // Même force, plus d'endurance pour le contreur.
    const parEndurance = combatTest({ force: 150 }, { force: 150 });
    parEndurance.joueurs[1].endurance = 60;
    let e = tour(parEndurance, c('contre'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].score, 0);
    // Même endurance, plus de force pour le contreur.
    e = tour(combatTest({ force: 200 }, { force: 150 }), c('contre'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[1].score, 0);
  });

  it("aucun des deux : l'attaque passe", () => {
    const e = tour(combatTest(), c('contre'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 0);
    assert.equal(e.joueurs[1].score, 2);
  });
});

describe('Même famille', () => {
  it("sans le double d'endurance, personne ne marque", () => {
    const e = tour(combatTest(), c('attaque_base'), c('attaque_base'));
    assert.equal(e.joueurs[0].score + e.joueurs[1].score, 0);
  });

  it("avec au moins le double d'endurance, l'action passe (+2 de bonus d'endurance)", () => {
    const depart = combatTest();
    depart.joueurs[1].endurance = 50;
    const e = tour(depart, c('attaque_base'), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 4);
    assert.equal(e.joueurs[1].score, 0);
  });

  it('contre contre contre gagné ne rapporte rien (pas d\'attaque à renvoyer)', () => {
    const depart = combatTest();
    depart.joueurs[1].endurance = 50;
    const e = tour(depart, c('contre'), c('contre'));
    assert.equal(e.joueurs[0].score, 0);
    assert.equal(e.joueurs[0].historique.at(-1)?.reussie, true);
  });
});
