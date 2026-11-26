// Tutoriels courts : accès selon le style de jeu, decks d'essai valides.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, REGLES } from '../src/moteur/config';
import { nouvelleCollection } from '../src/page/collection';
import { TUTOS, type IdTuto } from '../src/page/tutos';

const ids = Object.keys(TUTOS) as IdTuto[];

test('chaque tutoriel a des écrans et, s\'il y a une partie, des conseils', () => {
  for (const id of ids) {
    const t = TUTOS[id];
    assert.equal(t.id, id);
    assert.ok(t.ecrans.length >= 2 && t.ecrans.length <= 3, id);
    if (t.essai) assert.ok(t.conseils.length >= 1, id);
  }
});

test('les decks des parties d\'essai ne contiennent que des actions qui existent', () => {
  for (const id of ids) {
    const e = TUTOS[id].essai;
    if (e && 'deck' in e) {
      assert.equal(new Set(e.deck).size, e.deck.length, id);
      for (const a of e.deck) assert.ok(a in ACTIONS, `${id} : ${a}`);
    }
  }
});

test('un nouveau joueur ne peut pas lancer le tutoriel du tournoi par équipe', () => {
  const c = nouvelleCollection();
  assert.ok(TUTOS.equipe.verrou(c));
  for (const id of ids.filter((i) => i !== 'equipe')) assert.equal(TUTOS[id].verrou(c), null, id);
});

test('le tutoriel par équipe s\'ouvre avec Mon Club au bon niveau et 5 lutteurs', () => {
  const c = nouvelleCollection();
  c.medailles = 1e6; // niveau de club au maximum
  assert.ok(TUTOS.equipe.verrou(c), 'il manque encore les lutteurs');
  c.club = Object.keys(c.exemplaires).slice(0, REGLES.tournoi.equipe.duels);
  while (c.club.length < REGLES.tournoi.equipe.duels) c.club.push('europe');
  assert.equal(TUTOS.equipe.verrou(c), null);
});
