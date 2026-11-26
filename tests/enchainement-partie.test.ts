// Mode Enchaînement contre l'ordinateur : déroulé d'une partie (sans affichage).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HUMAIN, ORDI, Partie } from '../src/page/partie';
import { sequenceOrdinateur } from '../src/moteur/enchainement';
import { creerHasard } from '../src/moteur/hasard';
import type { Face } from '../src/moteur/types';

test('une partie en mode Enchaînement se joue séquence par séquence jusqu\'au bout', () => {
  const p = new Partie('usa', 'japon', 12, 'normal', undefined, [], true, undefined, true);
  assert.equal(p.etat.enchainement, true);
  const h = creerHasard(3);
  let n = 0;
  while (!p.etat.termine && n++ < 40) {
    let r = p.resoudreSequence(sequenceOrdinateur(p.etat, HUMAIN, h, 'normal'), p.sequenceOrdi(), false);
    const faces: Face[] = [];
    while (r === 'pileOuFace') {
      faces.push('pile');
      r = p.resoudreSequence(sequenceOrdinateur(p.etat, HUMAIN, creerHasard(n), 'normal'), p.sequenceOrdi(), false, faces);
    }
    assert.ok(r.tours.length >= 1 && r.tours.length <= 3);
    assert.ok(r.tours.every((t) => t.sequence === p.sequencesJouees));
  }
  assert.ok(p.etat.termine);
});

test('pile ou face pendant une séquence : la séquence est rejouée à l\'identique avec l\'annonce', () => {
  for (let g = 1; g < 400; g++) {
    const p = new Partie('usa', 'afrique', g, 'fort', undefined, [], true, undefined, true);
    const h = creerHasard(g);
    while (!p.etat.termine) {
      const seqH = sequenceOrdinateur(p.etat, HUMAIN, h, 'facile');
      const seqO = p.sequenceOrdi();
      const avant = p.hasard.marque();
      const r = p.resoudreSequence(seqH, seqO, false);
      if (r !== 'pileOuFace') continue;
      // Rejouée deux fois avec la même annonce : même résultat.
      assert.equal(p.hasard.marque(), avant);
      const copie = new Partie('usa', 'afrique', g, 'fort', undefined, [], true, undefined, true);
      copie.etat = structuredClone(p.etat);
      copie.hasard.revenirA(avant);
      const a = p.resoudreSequence(seqH, seqO, false, ['pile', 'face', 'pile']);
      const b = copie.resoudreSequence(seqH, seqO, false, ['pile', 'face', 'pile']);
      assert.notEqual(a, 'pileOuFace');
      assert.deepEqual(p.etat.journal, copie.etat.journal);
      void b;
      void ORDI;
      return;
    }
  }
  assert.fail('aucune tentative de tombé de l\'ordinateur trouvée');
});
