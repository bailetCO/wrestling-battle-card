// Mode Enchaînement : séquences de 3 actions, rupture de chaîne, initiative, endurance.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { c, testeur, toujours } from './outils';
import { ACTIONS, REGLES } from '../src/moteur/config';
import { coutDuTour, creerCombat, enFatigue, intervalleRecuperation, jouerTour, niveauFatigue, toursPeriode } from '../src/moteur/combat';
import { choixOrdinateur } from '../src/moteur/ia';
import {
  apercuSequence, actionsAjoutables, jouerSequence, reactionSequence, sequenceOrdinateur, validerSequence,
} from '../src/moteur/enchainement';
import { creerHasard } from '../src/moteur/hasard';
import type { Choix } from '../src/moteur/types';

const combat = (rapide = true) => creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { rapide, enchainement: true });
const seq = (...a: Choix['action'][]): Choix[] => a.map((x) => ({ action: x }));

describe('Séquences', () => {
  it('12 tours par période, et une séquence joue 3 duels', () => {
    const e = combat();
    assert.equal(toursPeriode(e), 12);
    const r = jouerSequence(e, seq('defense', 'defense', 'defense'), seq('defense', 'defense', 'defense'), toujours(0));
    assert.equal(r.duels.length, 3);
    assert.equal(r.etat.tour, 4);
    assert.equal(r.rupture, null);
  });

  it('combat rapide : 4 séquences sans point mènent à la mort subite au bout de 12 tours', () => {
    let e = combat();
    for (let k = 0; k < 4; k++) e = jouerSequence(e, seq('defense', 'defense', 'defense'), seq('defense', 'defense', 'defense'), toujours(0)).etat;
    assert.equal(e.mortSubite, true);
  });

  it('les actions de chacun sont comparées dans l\'ordre', () => {
    const r = jouerSequence(combat(), seq('attaque_base', 'defense', 'defense'), seq('feinte', 'parade', 'attaque_base'), toujours(0));
    assert.equal(r.duels.map((d) => d.choix.map((x) => x.action).join('/')).join(' '), 'attaque_base/feinte defense/parade defense/attaque_base');
  });
});

describe('Rupture de chaîne', () => {
  it('contre réussi au 1er duel : les deux séquences s\'arrêtent, l\'adversaire paie ses actions annulées', () => {
    const r = jouerSequence(combat(), seq('contre', 'attaque_base', 'attaque_base'), seq('attaque_base', 'grande_projection', 'grande_projection'), toujours(0));
    assert.equal(r.duels.length, 1);
    assert.deepEqual(r.rupture, { par: 0, duel: 1, cause: 'contre' });
    assert.equal(r.etat.joueurs[0].score, 2);
    // B paie son attaque, le déséquilibre (5 %), puis ses 2 grandes projections annulées.
    assert.equal(r.etat.joueurs[1].endurance, 100 - ACTIONS.attaque_base.cout - 5 - 2 * ACTIONS.grande_projection.cout);
    // A ne paie que son contre.
    assert.equal(r.etat.joueurs[0].endurance, 100 - ACTIONS.contre.cout);
    assert.ok(r.etat.journal.some((l) => l.startsWith('Chaîne brisée')));
  });

  it('contre réussi au 2e duel : plus de rupture, la séquence continue', () => {
    const r = jouerSequence(combat(), seq('feinte', 'contre', 'attaque_base'), seq('attaque_base', 'defense', 'feinte'), toujours(0));
    assert.equal(r.duels.length, 3);
    assert.equal(r.rupture, null);
    assert.equal(r.etat.joueurs[1].score, 2); // l'attaque du 1er duel a marqué
  });

  it('matraquage réussi au 2e duel : la dernière action adverse est annulée mais payée, celle du lutteur qui a matraqué se joue', () => {
    const r = jouerSequence(combat(), seq('defense', 'matraquage', 'attaque_base'), seq('defense', 'defense', 'grande_projection'), toujours(0));
    assert.deepEqual(r.rupture, { par: 0, duel: 2, cause: 'matraquage' });
    assert.equal(r.duels.length, 3);
    assert.ok(r.etat.journal.some((l) => l.includes('est annulée')));
    // La grande projection de B ne marque rien, mais elle est payée ; l'attaque de A passe (+2 du bonus de feinte).
    assert.equal(r.etat.joueurs[1].score, 0);
    assert.equal(r.etat.joueurs[0].score, ACTIONS.attaque_base.points + REGLES.bonusFeinte);
    const avant3 = r.duels[2].avant.joueurs[1].endurance;
    assert.equal(r.etat.joueurs[1].endurance, avant3 - ACTIONS.grande_projection.cout); // payée quand même
  });

  it('le matraquage au 2e duel ne casse la chaîne que 2 fois sur 3', () => {
    const tient = jouerSequence(combat(), seq('defense', 'matraquage', 'attaque_base'), seq('defense', 'defense', 'attaque_base'), toujours(0.99));
    assert.equal(tient.rupture, null);
    assert.equal(tient.duels.length, 3);
  });

  it('une autre feinte réussie au 2e duel ne casse rien', () => {
    for (const f of ['feinte', 'changement_niveau'] as const) {
      const r = jouerSequence(combat(), seq('defense', f, 'attaque_base'), seq('defense', 'defense', 'attaque_base'), toujours(0));
      assert.equal(r.rupture, null, f);
    }
  });

  it('feinte réussie au 1er duel : pas de rupture', () => {
    const r = jouerSequence(combat(), seq('feinte', 'defense', 'defense'), seq('defense', 'defense', 'defense'), toujours(0));
    assert.equal(r.rupture, null);
    assert.equal(r.duels.length, 3);
  });
});

describe('Endurance', () => {
  it('une séquence doit pouvoir être payée en entier', () => {
    const e = combat();
    e.joueurs[0].endurance = 16;
    assert.equal(validerSequence(e, 0, seq('grande_projection', 'grande_projection', 'defense')), 'Pas assez d\'endurance pour toute la séquence.');
    assert.equal(validerSequence(e, 0, seq('grande_projection', 'attaque_base', 'lutte')), 'Lutte seulement quand il ne reste plus de quoi payer une action.');
    e.joueurs[0].endurance = 12;
    assert.deepEqual(actionsAjoutables(e, 0, seq('grande_projection', 'attaque_base')), []);
    assert.equal(validerSequence(e, 0, seq('grande_projection', 'attaque_base', 'lutte')), null);
  });

  it('action spéciale : pas avant le 2e tour, puis 3 actions de recharge', () => {
    const e = combat(); // tour 1
    assert.equal(validerSequence(e, 0, [c('attaque_base', true), c('defense'), c('defense')]), 'Action spéciale pas disponible à cette place.');
    assert.equal(validerSequence(e, 0, [c('defense'), c('attaque_base', true), c('defense')]), null);
    // Spéciale au tour 3 (fin de la 1re séquence) : la prochaine au tour 7 au plus tôt.
    const r = jouerSequence(e, [c('defense'), c('defense'), c('attaque_base', true)], seq('defense', 'defense', 'defense'), toujours(0.99));
    const e2 = r.etat; // tour 4
    for (let k = 0; k < 3; k++) {
      const debut = Array.from({ length: k }, () => c('defense'));
      assert.equal(validerSequence(e2, 0, [...debut, c('attaque_base', true), ...Array.from({ length: 2 - k }, () => c('defense'))]), 'Action spéciale pas disponible à cette place.', `tour ${4 + k}`);
    }
  });

  it('une seule action spéciale par séquence', () => {
    const e = combat();
    e.tour = 3;
    e.tourGlobal = 3;
    assert.equal(validerSequence(e, 0, [c('attaque_base', true), c('attaque_base', true), c('defense')]), 'Action spéciale pas disponible à cette place.');
    assert.equal(validerSequence(e, 0, [c('attaque_base', true), c('attaque_base'), c('defense')]), null);
  });

  it('une action devenue impossible pendant la séquence est remplacée par Lutte', () => {
    const e = combat();
    e.joueurs[0].endurance = 9; // assez pour 2 attaques à 4… avant d'être contré
    e.joueurs[1].endurance = 9;
    const r = jouerSequence(e, seq('attaque_base', 'attaque_base', 'defense'), seq('parade', 'parade', 'parade'), toujours(0));
    assert.equal(r.duels[1].choix[0].action, 'lutte');
    assert.ok(r.etat.journal.some((l) => l.includes('il lutte')));
  });
});

describe('Initiative', () => {
  it('celui qui a l\'initiative voit la dernière action adverse, l\'autre rien', () => {
    const e = combat();
    e.joueurs[0].initiative = true;
    assert.deepEqual(apercuSequence(e, 0, seq('feinte', 'defense', 'contre')), { action: 'contre' });
    assert.equal(apercuSequence(e, 1, seq('feinte', 'defense', 'contre')), null);
  });

  it('une initiative gagnée pendant une séquence sert pour la suivante', () => {
    const r = jouerSequence(combat(), seq('feinte', 'defense', 'defense'), seq('defense', 'defense', 'defense'), toujours(0));
    assert.equal(r.etat.joueurs[0].initiative, true);
    assert.equal(r.etat.joueurs[1].initiative, false);
  });

  it('deux initiatives gagnées dans la même séquence s\'annulent', () => {
    // A feinte sur la défense au 1er duel, B feinte sur la défense au 3e : les deux gagnent l'initiative.
    const r = jouerSequence(combat(), seq('feinte', 'defense', 'defense'), seq('defense', 'defense', 'feinte'), toujours(0));
    assert.equal(r.etat.joueurs[0].initiative, false);
    assert.equal(r.etat.joueurs[1].initiative, false);
    assert.ok(r.etat.journal.some((l) => l.includes('elles s\'annulent')));
  });

  it('l\'ordinateur avec l\'initiative ne change que sa dernière action', () => {
    const e = combat();
    e.joueurs[1].initiative = true;
    const h = creerHasard(4);
    const mien = seq('defense', 'defense', 'defense');
    for (let i = 0; i < 30; i++) {
      const r = reactionSequence(e, 1, mien, seq('feinte', 'feinte', 'attaque_base'), h, 'fort');
      assert.deepEqual(r.slice(0, 2), mien.slice(0, 2));
    }
  });
});

describe('Ordinateur', () => {
  it('compose des séquences de 3 actions jouables, et lutte quand il est à bout', () => {
    const h = creerHasard(7);
    const e = combat();
    for (const niveau of ['facile', 'normal', 'fort'] as const) {
      const s = sequenceOrdinateur(e, 1, h, niveau);
      assert.equal(s.length, REGLES.enchainement.actions);
    }
    e.joueurs[1].endurance = 0;
    e.joueurs[1].souffleUtilise = true;
    assert.deepEqual(sequenceOrdinateur(e, 1, h, 'fort').map((x) => x.action), ['lutte', 'lutte', 'lutte']);
  });

  it('un combat rapide complet se termine toujours', () => {
    for (let g = 1; g <= 30; g++) {
      const h = creerHasard(g);
      let e = combat();
      let n = 0;
      while (!e.termine && n++ < 60) e = jouerSequence(e, sequenceOrdinateur(e, 0, h, 'normal'), sequenceOrdinateur(e, 1, h, 'fort'), h).etat;
      assert.ok(e.termine, `graine ${g}`);
    }
  });
});

describe('Durée infinie', () => {
  it('pas de fin de période ni de supériorité : seul le tombé arrête le combat', () => {
    let e = creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { infini: true });
    assert.equal(e.rapide, true);
    // 15 attaques à 5 points qui passent : 75 - 0, et le combat continue.
    for (let k = 0; k < 15; k++) {
      e = jouerTour(e, c('grande_projection'), c('feinte'), toujours(0.5));
      if (e.termine) break;
      e.joueurs[0].endurance = 100;
      e.joueurs[0].historique = [];
    }
    assert.equal(e.periode, 1);
    assert.ok(e.joueurs[0].score >= 50);
    assert.equal(e.termine, false);
  });

  it('les combats en durée infinie finissent toujours (tombé ou épuisement)', () => {
    for (let g = 1; g <= 40; g++) {
      const h = creerHasard(g);
      let e = creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { infini: true, enchainement: g % 2 === 0 });
      let n = 0;
      while (!e.termine && n++ < 400) {
        e = e.enchainement
          ? jouerSequence(e, sequenceOrdinateur(e, 0, h, 'normal'), sequenceOrdinateur(e, 1, h, 'fort'), h).etat
          : jouerTour(e, choixOrdinateur(e, 0, h, 'normal'), choixOrdinateur(e, 1, h, 'fort'), h);
      }
      assert.ok(e.termine, `graine ${g}`);
      assert.equal(e.finPar, 'tombe');
    }
  });
});

describe('Durée infinie : fatigue croissante', () => {
  it('récupération tous les 3 tours dès le tour 20, 4 dès le 30 ; coût +1 dès le 25, +2 dès le 35', () => {
    const e = creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { infini: true });
    const a = (tour: number) => { e.tour = tour; e.tourGlobal = tour; return [intervalleRecuperation(e), coutDuTour(e, 0, 'attaque_base') - ACTIONS.attaque_base.cout, niveauFatigue(e)]; };
    assert.deepEqual(a(19), [2, 0, 0]);
    assert.equal(enFatigue(e), false);
    assert.deepEqual(a(20), [3, 0, 1]);
    assert.equal(enFatigue(e), true);
    assert.deepEqual(a(25), [3, 1, 2]);
    assert.deepEqual(a(30), [4, 1, 3]);
    assert.deepEqual(a(35), [4, 2, 4]);
    assert.deepEqual(a(40), [5, 2, 5]);
    assert.deepEqual(a(45), [5, 3, 6]);
    // Combat normal : jamais de fatigue.
    const n = creerCombat(testeur(), testeur(), { rapide: true });
    n.tourGlobal = 50;
    assert.equal(coutDuTour(n, 0, 'attaque_base'), ACTIONS.attaque_base.cout);
    assert.equal(intervalleRecuperation(n), 2);
  });

  it('au tour 21 : pas de récupération (pas un multiple de 3) ; au tour 24 : récupération', () => {
    const debut = creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { infini: true });
    debut.joueurs[0].endurance = 50; debut.joueurs[1].endurance = 50;
    for (const [tour, recupere] of [[22, false], [24, true]] as const) {
      const e = structuredClone(debut);
      e.tour = tour; e.tourGlobal = tour;
      const apres = jouerTour(e, c('defense'), c('defense'), toujours(0));
      assert.equal(apres.journal.some((l) => l.includes('(tous les 3 tours)')), recupere, `tour ${tour}`);
    }
  });
});

describe('Durée infinie : tour d\'épuisement réglable', () => {
  it('épuisement dès le tour choisi seulement (20 par défaut)', () => {
    const tester = (ep: number | undefined, tour: number) => {
      let e = creerCombat(testeur({ nom: 'A' }), testeur({ nom: 'B' }), { infini: true, epuisement: ep });
      e.tour = tour; e.tourGlobal = tour;
      e.joueurs[0].endurance = 2; // ne peut payer aucune action
      for (let k = 0; k < 3; k++) e = jouerTour(e, c('lutte'), c('defense'), toujours(0.99));
      return e.termine;
    };
    assert.equal(creerCombat(testeur(), testeur(), { infini: true }).epuisementDes, 20);
    assert.equal(tester(undefined, 21), true);
    assert.equal(tester(40, 21), false);
    assert.equal(tester(40, 41), true);
  });
});
