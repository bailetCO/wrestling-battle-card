// Déroulé d'une partie contre l'ordinateur (src/page/partie.ts, sans affichage).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HasardRejouable, Partie } from '../src/page/partie';

test('le hasard rejouable reproduit les mêmes tirages après un retour en arrière', () => {
  const h = new HasardRejouable(42);
  h.fn();
  const m = h.marque();
  const suite = [h.fn(), h.fn(), h.fn()];
  h.revenirA(m);
  assert.deepEqual([h.fn(), h.fn(), h.fn()], suite);
});

test('pile ou face : le tour est mis en pause puis rejoué avec l\'annonce du joueur', () => {
  // On cherche une graine où l'ordinateur obtient une tentative de tombé réussie.
  for (let graine = 1; graine < 3000; graine++) {
    const p = new Partie('europe', 'usa', graine);
    p.etat.tour = 2;
    const r = p.resoudre({ action: 'feinte' }, { action: 'double_jambe', speciale: true }, false);
    if (r !== 'pileOuFace') continue;
    assert.equal(p.etat.tour, 2, 'le tour n\'est pas encore joué');
    const final = p.resoudre({ action: 'feinte' }, { action: 'double_jambe', speciale: true }, false, 'pile');
    assert.notEqual(final, 'pileOuFace');
    assert.ok(p.etat.journal.some((l) => l.includes('annonce pile')));
    return;
  }
  assert.fail('aucune tentative de tombé trouvée');
});
