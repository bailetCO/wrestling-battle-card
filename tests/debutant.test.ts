// Débutant (27/11/2026) : les réglages et modes avancés, leurs tutoriels et leurs quêtes
// n'apparaissent qu'à l'étape du mode histoire qui les présente.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur';
import { nouvelleCollection } from '../src/page/collection';
import { fonctionVisible, tutoVisible, type IdFonction } from '../src/page/menu';
import { quetesDuJour, queteOuverte } from '../src/page/quetes';
import { ETAPES } from '../src/page/histoire';

const FONCTIONS: IdFonction[] = ['fort', 'amis', 'combos', 'enchainement', 'infini', 'equipe'];

test('nouveau joueur : aucun réglage avancé ; mode histoire fini : tout est ouvert', () => {
  const c = nouvelleCollection();
  for (const f of FONCTIONS) assert.equal(fonctionVisible(c, f), false, f);
  c.histoire.etape = ETAPES.length;
  for (const f of FONCTIONS) assert.equal(fonctionVisible(c, f), true, f);
});

test('chaque réglage apparaît au plus tard à l\'étape du mode histoire qui le demande', () => {
  // L'étape qui demande l'ordinateur fort, un combat en ligne, l'Enchaînement, la durée infinie.
  const etapeDe = (mot: RegExp) => ETAPES.findIndex((e) => mot.test(e.objectif));
  const attendu: [IdFonction, number][] = [['fort', etapeDe(/ordinateur fort/)], ['amis', etapeDe(/en ligne/)], ['enchainement', etapeDe(/Enchaînement/)], ['infini', etapeDe(/durée infinie/)], ['equipe', etapeDe(/par équipe/)]];
  for (const [f, i] of attendu) {
    assert.ok(i >= 0, f);
    assert.ok(REGLES.menu.etapeFonction[f] <= i, `${f} doit être ouvert à l'étape ${i + 1}`);
    const c = nouvelleCollection();
    c.histoire.etape = i;
    assert.ok(fonctionVisible(c, f), f);
  }
});

test('tutoriels : la Carrière tout de suite, les autres avec leur mode', () => {
  const c = nouvelleCollection();
  assert.ok(tutoVisible(c, 'arene'));
  for (const id of ['combos', 'enchainement', 'infini', 'amis', 'equipe', 'individuel']) assert.equal(tutoVisible(c, id), false, id);
  c.histoire.etape = ETAPES.length;
  for (const id of ['arene', 'combos', 'enchainement', 'infini', 'amis', 'equipe', 'individuel']) assert.ok(tutoVisible(c, id), id);
});

test('quêtes : jamais une quête d\'un mode pas encore ouvert', () => {
  const c = nouvelleCollection();
  c.medailles = 500; // niveau de compte élevé : toutes les quêtes sont possibles par le niveau
  for (let j = 1; j <= 120; j++) {
    c.quetes.jour = '';
    for (const q of quetesDuJour(c, `2026-01-${String(j).padStart(3, '0')}`)) assert.ok(queteOuverte(c, q.id), `${q.id} tirée trop tôt`);
  }
  c.histoire.etape = ETAPES.length;
  const vues = new Set<string>();
  for (let j = 1; j <= 200; j++) { c.quetes.jour = ''; for (const q of quetesDuJour(c, `2027-${j}`)) vues.add(q.id); }
  assert.ok(['ench-jouer', 'rival-1', 'fort', 'en-ligne'].some((id) => vues.has(id)), 'les quêtes avancées reviennent ensuite');
});
