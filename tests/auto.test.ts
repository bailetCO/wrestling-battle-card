// Combat automatique : niveau selon le compte, déterminé par la graine, combat toujours fini.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, REGLES } from '../src/moteur/config';
import { autoOuvert, chanceFortAuto, combatAuto } from '../src/moteur/auto';
import { creerCombat } from '../src/moteur/combat';

test('auto : ouvert au niveau de compte 3, normal au niveau 3, fort au niveau 10', () => {
  assert.equal(REGLES.auto.niveauCompteMin, 3);
  assert.ok(!autoOuvert(2));
  assert.ok(autoOuvert(3));
  assert.equal(chanceFortAuto(3), 0);
  assert.equal(chanceFortAuto(10), 1);
  assert.equal(chanceFortAuto(25), 1);
  assert.ok(Math.abs(chanceFortAuto(6.5) - 0.5) < 1e-9);
  assert.ok(chanceFortAuto(4) < chanceFortAuto(7));
});

test('auto : le combat va toujours au bout, et la même graine donne le même combat', () => {
  for (let g = 1; g <= 40; g++) {
    const a = LUTTEURS[g % LUTTEURS.length], b = LUTTEURS[(g * 7) % LUTTEURS.length];
    const rapide = g % 2 === 0;
    const r1 = combatAuto(creerCombat(a, b, { rapide }), g, [{ chanceFort: 0.4 }, { niveau: 'normal' }]);
    const r2 = combatAuto(creerCombat(a, b, { rapide }), g, [{ chanceFort: 0.4 }, { niveau: 'normal' }]);
    assert.ok(r1.etat.termine);
    assert.ok(r1.tours.length > 0);
    assert.equal(r1.etat.vainqueur, r2.etat.vainqueur);
    assert.deepEqual(r1.etat.journal, r2.etat.journal);
  }
});

test('auto : au niveau 10 du compte, il gagne bien plus souvent qu\'au niveau 3 contre l\'ordinateur fort', () => {
  const taux = (chanceFort: number) => {
    let v = 0;
    const N = 300;
    for (let g = 1; g <= N; g++) {
      const a = LUTTEURS[g % LUTTEURS.length], b = LUTTEURS[(g * 13 + 5) % LUTTEURS.length];
      const r = combatAuto(creerCombat(a, b), g * 101, [{ chanceFort }, { niveau: 'fort' }]);
      if (r.etat.vainqueur === 0) v++;
    }
    return v / N;
  };
  const t3 = taux(chanceFortAuto(3)), t10 = taux(chanceFortAuto(10));
  assert.ok(t10 > t3 + 0.15, `niveau 3 : ${t3}, niveau 10 : ${t10}`);
  assert.ok(t10 > 0.35 && t10 < 0.65, `niveau 10 contre fort : ${t10}`);
});

test('auto : au-dessus du niveau 10, environ 3 victoires sur 4 contre l\'ordinateur fort', async () => {
  const { bonusAutoExpert } = await import('../src/moteur/auto');
  const { avecBonus } = await import('../src/moteur/config');
  assert.equal(bonusAutoExpert(10, 'fort'), 0);
  assert.equal(bonusAutoExpert(9, 'fort'), 0);
  assert.ok(bonusAutoExpert(11, 'fort') > 0);
  assert.equal(bonusAutoExpert(11, 'normal'), 0);
  let v = 0;
  const N = 800;
  for (let g = 1; g <= N; g++) {
    const a = LUTTEURS[(g * 31) % LUTTEURS.length], b = LUTTEURS[(g * 17 + 5) % LUTTEURS.length];
    const r = combatAuto(creerCombat(avecBonus(a, bonusAutoExpert(11, 'fort')), b), g * 7919, [{ chanceFort: chanceFortAuto(11) }, { niveau: 'fort' }]);
    if (r.etat.vainqueur === 0) v++;
  }
  assert.ok(v / N > 0.68 && v / N < 0.82, `${v / N}`);
});
