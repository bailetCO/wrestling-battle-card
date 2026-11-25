// Tutoriel : le combat guidé se déroule comme annoncé par le coach,
// et le bonus de boosters doublés s'applique au combat d'arène suivant.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES, peutJouerSpeciale, trouverLutteur } from '../src/moteur';
import { Partie, HUMAIN, ORDI } from '../src/page/partie';
import { ETAPES_GUIDEES, TUTO_COMBAT, reglesHTML } from '../src/page/aide';
import { depuisSauvegarde, nouvelleCollection, recompenser } from '../src/page/collection';
import { creerHasard } from '../src/moteur';

function partieTuto() {
  return new Partie(
    TUTO_COMBAT.moi, TUTO_COMBAT.adversaire, TUTO_COMBAT.graine, 'normal',
    trouverLutteur(TUTO_COMBAT.moi), ETAPES_GUIDEES.map((e) => e.ordi),
  );
}

test('tutoriel : les tours guidés se passent comme le coach l\'explique', () => {
  const p = partieTuto();
  const scores: [number, number][] = [];
  for (const etape of ETAPES_GUIDEES) {
    if (etape.conseil.speciale) {
      assert.ok(peutJouerSpeciale(p.etat, HUMAIN, etape.conseil.action), 'la spéciale conseillée doit être jouable');
    }
    const ordi = p.choixOrdi();
    assert.deepEqual(ordi, etape.ordi);
    p.apercuPourHumain(ordi.action);
    const final = p.reactionOrdi(etape.conseil, ordi);
    assert.deepEqual(final, ordi, 'pas de changement de l\'ordinateur pendant les tours guidés');
    const r = p.resoudre(etape.conseil, final, false);
    assert.notEqual(r, 'pileOuFace');
    scores.push([p.etat.joueurs[HUMAIN].score, p.etat.joueurs[ORDI].score]);
  }
  // Défense (0), feinte (0), attaque +2 après feinte (4), défense spéciale (+4).
  assert.deepEqual(scores, [[0, 0], [0, 0], [4, 0], [8, 0]]);
  assert.equal(p.etat.periode, 1);
  assert.equal(p.etat.termine, false);
  assert.equal(p.scripte, false, 'ensuite, l\'ordinateur joue librement');
});

test('tutoriel : boosters doublés une fois, et le bonus est relu dans la sauvegarde', () => {
  const c = nouvelleCollection();
  assert.equal(c.bonusTutoriel, false);
  const x = REGLES.collection.multiplicateurApresTutoriel;
  assert.equal(recompenser(c, 'arene', creerHasard(1), x).length, REGLES.collection.boostersParVictoire.arene * x);
  assert.equal(recompenser(c, 'arene', creerHasard(2)).length, REGLES.collection.boostersParVictoire.arene);
  c.bonusTutoriel = true;
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).bonusTutoriel, true);
});

test('règles : le texte suit la configuration', () => {
  const html = reglesHTML();
  assert.ok(html.includes(`${REGLES.toursParPeriode} tours`));
  assert.ok(html.includes(`coût ${6}`));
});
