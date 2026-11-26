// Mode Enchaînement : séquences de 3 actions, rupture de chaîne, initiative, endurance.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { c, testeur, toujours } from './outils';
import { ACTIONS, REGLES } from '../src/moteur/config';
import { creerCombat, toursPeriode } from '../src/moteur/combat';
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
