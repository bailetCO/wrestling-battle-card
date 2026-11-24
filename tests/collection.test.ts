// Collection : cartes de départ, boosters, decks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { cartesDeDepart, choisirDeck, nouvelleCollection, ouvrirBooster, possede, recompenser } from '../src/page/collection';

test('départ : une carte par nation, la moins rare', () => {
  const d = cartesDeDepart();
  assert.equal(d.length, 5);
  assert.equal(new Set(d.map((id) => LUTTEURS.find((l) => l.id === id)!.nation)).size, 5);
});

test('booster : uniquement des cartes qu\'on n\'a pas, sans doublon', () => {
  const c = nouvelleCollection();
  const g = ouvrirBooster(c, 2, creerHasard(3));
  assert.equal(g.length, 2);
  assert.notEqual(g[0], g[1]);
  for (const id of g) assert.equal(c.cartes.includes(id), false);
});

test('victoire : 1 carte au niveau normal, 2 au niveau fort, rien quand la collection est complète', () => {
  const c = nouvelleCollection();
  assert.equal(recompenser(c, 'normal', creerHasard(1)).length, 1);
  assert.equal(recompenser(c, 'fort', creerHasard(2)).length, 2);
  assert.equal(c.cartes.length, 8);
  c.cartes = LUTTEURS.map((l) => l.id);
  assert.deepEqual(recompenser(c, 'fort', creerHasard(3)), []);
});

test('les communes sortent plus souvent que les légendaires', () => {
  const h = creerHasard(9);
  const compte: Record<string, number> = {};
  for (let i = 0; i < 3000; i++) {
    const [id] = ouvrirBooster({ ...nouvelleCollection(), cartes: [] }, 1, h);
    const r = LUTTEURS.find((l) => l.id === id)!.rarete;
    compte[r] = (compte[r] ?? 0) + 1;
  }
  assert.ok(compte.commune > compte.legendaire * 4, JSON.stringify(compte));
});

test('mode test : toutes les cartes sont disponibles', () => {
  const c = nouvelleCollection();
  assert.equal(possede(c, 'usa'), c.cartes.includes('usa'));
  c.toutDebloque = true;
  assert.equal(possede(c, 'usa'), true);
});

test('deck : enregistré seulement s\'il est valide', () => {
  const c = nouvelleCollection();
  assert.ok(choisirDeck(c, 'usa', ['sprawl', 'matraquage', 'relance', 'feinte']));
  assert.equal(c.decks.usa, undefined);
  assert.equal(choisirDeck(c, 'usa', ['simple_jambe', 'sprawl', 'feinte', 'relance']), null);
  assert.deepEqual(c.decks.usa, ['simple_jambe', 'sprawl', 'feinte', 'relance']);
});
