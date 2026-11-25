// Points, endurance, précision, avantages, action spéciale, périodes.

import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import { c, combatTest, tour, toujours } from './outils';
import {
  actionsJouables, apercuInitiative, chanceReussite, gagnantPeriode, jouerTour,
  multiplicateurSpeciale, peutJouerSpeciale, precisionDe,
} from '../src/moteur/combat';
import { choixAleatoire } from '../src/moteur/ia';
import { ACTIONS } from '../src/moteur/config';
import { creerCombat } from '../src/moteur/combat';
import { creerHasard } from '../src/moteur/hasard';

describe('Précision', () => {
  it('précision = (100 + endurance) / 200', () => {
    assert.equal(precisionDe(100), 1);
    assert.equal(precisionDe(50), 0.75);
    assert.equal(precisionDe(0), 0.5);
  });

  it('chances : 100 % dès 0,75, 2/3 sous 0,75, 1/2 sous 0,6, 1/3 à 0,5', () => {
    assert.equal(chanceReussite(0.75), 1);
    assert.equal(chanceReussite(0.74), 2 / 3);
    assert.equal(chanceReussite(0.6), 2 / 3);
    assert.equal(chanceReussite(0.59), 1 / 2);
    assert.equal(chanceReussite(0.5), 1 / 3);
  });

  it("une action ratée part dans le vent : l'action adverse réussit seule", () => {
    const depart = combatTest();
    depart.joueurs[1].endurance = 30; // précision 0,65 → 2 chances sur 3
    const e = tour(depart, c('attaque_base'), c('defense'), toujours(0.7));
    assert.ok(e.journal.some((l) => l.includes('B rate son action')));
    assert.equal(e.joueurs[0].score, 4); // 2 + 2 (100 contre 30 : plus du double d'endurance)
  });
});

describe('Points', () => {
  it('sprawl réussi : 2 points pour le défenseur', () => {
    const e = tour(combatTest(), c('sprawl'), c('double_jambe'));
    assert.equal(e.joueurs[0].score, 2);
  });

  it('attaque à 4 points, +2 si elle suit une feinte réussie', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('double_jambe'), c('feinte'));
    assert.equal(e.joueurs[0].score, 6);
  });

  it('le bonus de feinte reste actif 2 tours : il sert encore au 2e tour', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('defense'), c('defense'));
    assert.equal(e.joueurs[0].bonusFeinte, 1);
    e = tour(e, c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].score, 4);
    assert.equal(e.joueurs[0].bonusFeinte, 0);
  });

  it('le bonus de feinte expire après 2 tours sans attaque ni contre réussi', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('defense'), c('defense'));
    e = tour(e, c('defense'), c('defense'));
    assert.equal(e.joueurs[0].bonusFeinte, 0);
    const avant = e.journal.length;
    e = tour(e, c('attaque_base'), c('feinte'));
    const lignes = e.journal.slice(avant);
    assert.ok(lignes.some((l) => /marque 2 points \(Attaque/.test(l)), lignes.join(' | '));
    assert.ok(!lignes.some((l) => l.includes('bonus de feinte')));
  });

  it('le bonus de feinte ne sert qu\'une fois', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].score, 4);
    e = tour(e, c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].score, 6);
  });

  it('le bonus de feinte vaut aussi pour un contre réussi, même contre une défense', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('contre'), c('defense'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[0].bonusFeinte, 0);
  });

  it('une attaque ratée (bloquée) ne consomme pas le bonus de feinte', () => {
    let e = tour(combatTest(), c('feinte'), c('contre'));
    e = tour(e, c('attaque_base'), c('defense'));
    assert.equal(e.joueurs[0].score, 0);
    assert.equal(e.joueurs[0].bonusFeinte, 1);
  });

  it('grande projection : 5 points', () => {
    const e = tour(combatTest(), c('grande_projection'), c('feinte'));
    assert.equal(e.joueurs[0].score, 5);
  });
});

describe('Avantages', () => {
  it("récupération : +5 % sous la moitié de la barre", () => {
    const depart = combatTest();
    depart.joueurs[0].endurance = 40;
    const e = tour(depart, c('defense'), c('attaque_base'));
    assert.equal(e.joueurs[0].endurance, 40 - 3 + 5);
  });

  it('récupération : +10 % au-dessus de la moitié', () => {
    const depart = combatTest();
    depart.joueurs[0].endurance = 80;
    const e = tour(depart, c('defense'), c('attaque_base'));
    assert.equal(e.joueurs[0].endurance, 80 - 3 + 10);
  });

  it("matraquage : -5 % d'endurance et précision baissée pendant 2 tours", () => {
    const e = tour(combatTest(), c('matraquage'), c('contre'));
    assert.equal(e.joueurs[1].endurance, 100 - 6 - 5);
    assert.equal(e.joueurs[1].malusPrecisionTours, 2);
  });

  it('le malus de précision du matraquage fait rater une attaque limite', () => {
    const depart = combatTest();
    depart.joueurs[1].endurance = 52; // précision 0,76, et 0,71 avec le malus
    const sans = tour(depart, c('defense'), c('attaque_base'), toujours(0.7));
    assert.equal(sans.joueurs[1].historique.at(-1)?.reussie, false); // battue par la défense, mais tirée
    depart.joueurs[1].malusPrecisionTours = 2;
    const avec = tour(depart, c('feinte'), c('attaque_base'), toujours(0.7));
    assert.equal(avec.joueurs[1].score, 0); // l'attaque part dans le vent
    assert.ok(avec.journal.some((l) => l.includes('B rate son action')));
    assert.equal(avec.joueurs[1].malusPrecisionTours, 1);
  });

  it("pression : 3 tours sans attaque ni contre donnent 1 point à l'adversaire", () => {
    let e = combatTest();
    for (let i = 0; i < 3; i++) e = tour(e, c('defense'), c('attaque_base'));
    assert.equal(e.joueurs[1].score, 1);
    assert.equal(e.joueurs[0].toursSansAttaque, 0);
  });

  it("combo : 3 réussites dont 2 attaques déclenchent un tombé", () => {
    let e = combatTest();
    const options = { choisirFace: () => 'face' as const }; // la pièce (hasard 0) tombe sur pile
    e = tour(e, c('attaque_base'), c('feinte'), toujours(0), options);
    e = tour(e, c('feinte'), c('contre'), toujours(0), options);
    e = tour(e, c('attaque_base'), c('feinte'), toujours(0), options);
    assert.equal(e.termine, true);
    assert.equal(e.vainqueur, 0);
    assert.equal(e.finPar, 'tombe');
  });

  it('tombé : le défenseur qui trouve la bonne face s\'en sort', () => {
    let e = combatTest();
    const options = { choisirFace: () => 'pile' as const };
    e = tour(e, c('attaque_base'), c('feinte'), toujours(0), options);
    e = tour(e, c('feinte'), c('contre'), toujours(0), options);
    e = tour(e, c('attaque_base'), c('feinte'), toujours(0), options);
    assert.equal(e.termine, false);
    assert.equal(e.joueurs[0].historique.length, 0); // compteur remis à zéro
  });

  it("initiative : on voit 2 actions de l'adversaire, dont la vraie", () => {
    const e = tour(combatTest(), c('feinte'), c('defense'));
    const apercu = apercuInitiative(e, 0, 'double_jambe', toujours(0.3));
    assert.ok(apercu);
    assert.equal(apercu.length, 2);
    assert.ok(apercu.includes('double_jambe'));
    assert.equal(apercuInitiative(e, 1, 'feinte', toujours(0.3)), null);
  });
});

describe('Endurance et action Lutte', () => {
  it('à 0 d\'endurance, seule la Lutte est possible (1 chance sur 10 de marquer)', () => {
    const depart = combatTest();
    depart.joueurs[0].endurance = 0;
    assert.deepEqual(actionsJouables(depart, 0), []);
    const marque = tour(depart, c('attaque_base'), c('defense'), toujours(0));
    assert.equal(marque.joueurs[0].score, 1);
    const rate = tour(depart, c('attaque_base'), c('defense'), toujours(0.5));
    assert.equal(rate.joueurs[0].score, 0);
  });

  it("avec un peu d'endurance mais aucune action payable, la Lutte s'active", () => {
    const depart = combatTest();
    depart.joueurs[0].endurance = 2;
    const e = tour(depart, c('attaque_base'), c('defense'), toujours(0.5));
    assert.ok(e.journal.some((l) => l.includes('A (Lutte)')));
  });

  it("Lutte refusée tant qu'il reste des actions jouables", () => {
    assert.throws(() => tour(combatTest(), c('lutte'), c('defense')));
  });

  it('3 tours à 0 d\'endurance : tombé', () => {
    let e = combatTest();
    e.joueurs[0].endurance = 0;
    for (let i = 0; i < 3; i++) e = tour(e, c('lutte'), c('defense'), toujours(0.99));
    assert.equal(e.termine, true);
    assert.equal(e.vainqueur, 1);
    assert.equal(e.finPar, 'tombe');
  });
});

describe('Action spéciale', () => {
  it('pas disponible au 1er tour', () => {
    const e = combatTest();
    assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), false);
    assert.throws(() => tour(e, c('attaque_base', true), c('defense')));
  });

  it("seulement dans la famille spéciale du lutteur", () => {
    const e = tour(combatTest(), c('defense'), c('defense'));
    assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), true);
    assert.equal(peutJouerSpeciale(e, 0, 'defense'), false);
  });

  it('coût : x1,5 jusqu\'au 4e tour de la 1re période, x2 ensuite', () => {
    const e = combatTest();
    e.tour = 4;
    assert.equal(multiplicateurSpeciale(e, 0), 1.5);
    e.tour = 5;
    assert.equal(multiplicateurSpeciale(e, 0), 2);
  });

  it("coût en 2e période : x1,5 au-dessus de 75 % d'endurance, sinon x2", () => {
    const e = combatTest();
    e.periode = 2;
    e.joueurs[0].endurance = 80;
    assert.equal(multiplicateurSpeciale(e, 0), 1.5);
    e.joueurs[0].endurance = 70;
    assert.equal(multiplicateurSpeciale(e, 0), 2);
  });

  it('3e période : seulement les 5 premiers tours, x2', () => {
    const e = combatTest();
    e.periode = 3;
    e.tour = 5;
    assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), true);
    assert.equal(multiplicateurSpeciale(e, 0), 2);
    e.tour = 6;
    assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), false);
  });

  it('3 tours de recharge entre deux utilisations', () => {
    let e = tour(combatTest(), c('defense'), c('defense'));
    e = tour(e, c('attaque_base', true), c('defense'), toujours(0.99)); // tour 2, ratée
    for (let i = 0; i < 3; i++) {
      assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), false);
      e = tour(e, c('defense'), c('defense'));
    }
    assert.equal(peutJouerSpeciale(e, 0, 'attaque_base'), true);
  });

  it('réussie : la suivante coûte 0,5x de moins, une seule fois', () => {
    let e = tour(combatTest(), c('defense'), c('defense'));
    e = tour(e, c('attaque_base', true), c('feinte'), toujours(0), { choisirFace: () => 'pile' });
    assert.equal(e.joueurs[0].reductionSpeciale, true);
    e.tour = 2; // reste dans la zone x1,5
    assert.equal(multiplicateurSpeciale(e, 0), 1);
    for (let i = 0; i < 3; i++) e = tour(e, c('defense'), c('defense'));
    // Tour 5 (impair) : pas de récupération régulière qui fausserait le calcul.
    const avant = e.joueurs[0].endurance;
    e = tour(e, c('attaque_base', true), c('attaque_base'), toujours(0.99)); // ratée
    assert.equal(avant - e.joueurs[0].endurance, ACTIONS.attaque_base.cout * (2 - 0.5));
    assert.equal(e.joueurs[0].reductionSpeciale, false);
  });

  it('défense spéciale réussie : 4 points', () => {
    const def = combatTest({ familleSpeciale: 'defense' });
    let e = tour(def, c('feinte'), c('feinte'));
    e = tour(e, c('defense', true), c('attaque_base'));
    assert.equal(e.joueurs[0].score, 4);
  });

  it('feinte spéciale réussie : 2 points tout de suite, puis enchaînement possible (+4)', () => {
    const def = combatTest({ familleSpeciale: 'feinte' });
    let e = tour(def, c('defense'), c('defense'));
    e = tour(e, c('feinte', true), c('contre'));
    assert.equal(e.joueurs[0].score, 2);
    assert.equal(e.joueurs[0].bonusFeinte, 0);
    assert.equal(e.joueurs[0].bonusEnchainement, true);
  });

  it('attaque spéciale réussie : tentative de tombé', () => {
    let e = tour(combatTest(), c('defense'), c('defense'));
    e = tour(e, c('attaque_base', true), c('feinte'), toujours(0), { choisirFace: () => 'face' });
    assert.equal(e.termine, true);
    assert.equal(e.finPar, 'tombe');
  });
});

describe('Périodes et fin du match', () => {
  it('10 points d\'écart : période gagnée, nouvelle période avec récupération', () => {
    const depart = combatTest();
    depart.joueurs[0].score = 8;
    depart.joueurs[0].prises = [4, 4];
    depart.joueurs[1].endurance = 50;
    const e = tour(depart, c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].periodesGagnees, 1);
    assert.equal(e.periode, 2);
    assert.equal(e.tour, 1);
    assert.equal(e.joueurs[0].score, 0);
    assert.equal(e.joueurs[1].endurance, 50 - 3 + 40); // récupération 40 %
  });

  it('fin des 10 tours : le score décide', () => {
    let e = combatTest();
    e.tour = 10;
    e = tour(e, c('attaque_base'), c('feinte'));
    assert.equal(e.joueurs[0].periodesGagnees, 1);
    assert.equal(e.periode, 2);
  });

  it('égalité : le plus de prises de haute valeur gagne, puis le dernier à marquer', () => {
    const e = combatTest();
    e.joueurs[0].score = 6;
    e.joueurs[0].prises = [4, 2];
    e.joueurs[1].score = 6;
    e.joueurs[1].prises = [2, 2, 2];
    e.dernierMarqueur = 1;
    assert.equal(gagnantPeriode(e, toujours(0)), 0);
    e.joueurs[0].prises = [2, 2, 2];
    assert.equal(gagnantPeriode(e, toujours(0)), 1);
  });

  it("0-0 : le lutteur avec le plus d'endurance gagne la période", () => {
    const e = combatTest();
    e.joueurs[0].endurance = 40;
    e.joueurs[1].endurance = 55;
    assert.equal(gagnantPeriode(e, toujours(0)), 1);
  });

  it('2 périodes gagnées : victoire', () => {
    let e = combatTest();
    e.joueurs[0].periodesGagnees = 1;
    e.tour = 10;
    e = tour(e, c('attaque_base'), c('feinte'));
    assert.equal(e.termine, true);
    assert.equal(e.vainqueur, 0);
    assert.equal(e.finPar, 'periodes');
    assert.throws(() => tour(e, c('attaque_base'), c('feinte')));
  });
});

describe('Hasard rejouable', () => {
  it('la même graine rejoue exactement le même combat', () => {
    const jouer = (graine: number) => {
      const h = creerHasard(graine);
      let e = creerCombat('usa', 'japon');
      while (!e.termine) e = jouerTour(e, choixAleatoire(e, 0, h), choixAleatoire(e, 1, h), h);
      return e.journal.join('\n');
    };
    assert.equal(jouer(42), jouer(42));
    assert.notEqual(jouer(42), jouer(43));
  });
});

test('supériorité technique : l\'écart ne dépasse jamais 10 points', async () => {
  const { LUTTEURS } = await import('../src/moteur/config');
  const { creerCombat, jouerTour } = await import('../src/moteur/combat');
  const { choixAleatoire } = await import('../src/moteur/ia');
  const { creerHasard } = await import('../src/moteur/hasard');
  for (let g = 1; g <= 600; g++) {
    const h = creerHasard(g);
    let e = creerCombat(LUTTEURS[g % 120], LUTTEURS[(g * 7 + 3) % 120], { rapide: g % 3 === 0 });
    while (!e.termine) {
      e = jouerTour(e, choixAleatoire(e, 0, h), choixAleatoire(e, 1, h), h);
      assert.ok(Math.abs(e.joueurs[0].score - e.joueurs[1].score) <= 10);
      for (const l of e.journal) {
        const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)/);
        if (m) assert.ok(Math.abs(+m[1] - +m[2]) <= 10, l);
      }
    }
  }
});
