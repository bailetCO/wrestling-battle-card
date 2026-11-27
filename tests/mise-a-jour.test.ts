// Mises à jour automatiques (27/11/2026) : quand recharger le jeu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aRecharger, buildEnLigne } from '../src/page/mise-a-jour';
import { NOUVEAUTES, VERSION } from '../src/page/nouveautes';
import { readFileSync } from 'node:fs';

test('nouvelle version en ligne : on recharge', () => {
  assert.equal(aRecharger('abc', 'xyz', null), true);
});

test('même version, pas de réponse, ou jeu de développement : on ne recharge pas', () => {
  assert.equal(aRecharger('abc', 'abc', null), false);
  assert.equal(aRecharger(null, 'abc', null), false); // hors ligne
  assert.equal(aRecharger('abc', 'dev', null), false);
  assert.equal(aRecharger('abc', 'local-123', null), false);
});

test('pas de boucle : on vient d\'essayer pour cette version il y a moins de 5 minutes', () => {
  const t = 1_000_000_000;
  assert.equal(aRecharger('abc', 'xyz', `abc@${t - 60_000}`, t), false);
  assert.equal(aRecharger('abc', 'xyz', `abc@${t - 6 * 60_000}`, t), true); // on réessaie plus tard
  assert.equal(aRecharger('def', 'xyz', `abc@${t - 60_000}`, t), true); // encore une autre version
});

test('lecture de version.json, sans copie du navigateur', async () => {
  let vu: RequestInit | undefined;
  globalThis.fetch = (async (_u: string, init?: RequestInit) => { vu = init; return new Response('{"version":"0.7.0","build":"abc"}'); }) as typeof fetch;
  assert.equal(await buildEnLigne(), 'abc');
  assert.equal(vu?.cache, 'no-store');
  globalThis.fetch = (async () => { throw new Error('hors ligne'); }) as typeof fetch;
  assert.equal(await buildEnLigne(), null);
});

test('version du jeu : la même partout, avec ses nouveautés en haut de la liste', () => {
  assert.equal(JSON.parse(readFileSync('package.json', 'utf8')).version, VERSION);
  assert.equal(NOUVEAUTES[0].version, VERSION);
  assert.ok(NOUVEAUTES[0].lignes.length >= 2 && NOUVEAUTES[0].lignes.length <= 5);
});
