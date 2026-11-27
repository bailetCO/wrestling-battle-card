// Bouton « Aller à la quête » (27/11/2026) : chaque quête mène à un écran qui existe.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DESTINATIONS, QUETES, destinationQuete } from '../src/page/quetes';

// Les écrans connus de la navigation (adresse après le #).
const ECRANS = new Set([...readFileSync('src/page/ecrans/navigation.ts', 'utf8').matchAll(/h === '(#[a-z]+)'/g)].map((m) => m[1]));

test('chaque quête a une destination', () => {
  for (const q of QUETES) assert.ok(destinationQuete(q.id), q.id);
});

test('chaque destination mène à un écran qui existe, avec un texte de bouton', () => {
  for (const [id, d] of Object.entries(DESTINATIONS)) {
    assert.ok(ECRANS.has(d.lien), `${id} : ${d.lien}`);
    assert.ok(d.bouton.length > 3 && d.bouton.length <= 40, id);
  }
});

test('les quêtes d\'Enchaînement, de durée infinie et contre l\'ordinateur fort arrivent avec le bon réglage', () => {
  assert.equal(destinationQuete('ench-jouer')!.reglage, 'enchainement');
  assert.equal(destinationQuete('chaine-2')!.reglage, 'enchainement');
  assert.equal(destinationQuete('rival-1')!.reglage, 'infini');
  assert.equal(destinationQuete('infini-40')!.reglage, 'infini');
  assert.equal(destinationQuete('fort')!.reglage, 'fort');
  assert.equal(destinationQuete('serie-fort')!.reglage, 'fort');
  assert.equal(destinationQuete('gagner-1')!.reglage, undefined);
});
