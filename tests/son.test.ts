// Sons et vibrations (27/11/2026) : réglages gardés sur l'appareil, vibrations selon le réglage,
// son de fin joué une seule fois par combat.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const memoire = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => memoire.get(k) ?? null,
  setItem: (k: string, v: string) => void memoire.set(k, v),
  removeItem: (k: string) => void memoire.delete(k),
};
const vibrations: number[][] = [];
Object.defineProperty(globalThis, 'navigator', { value: { vibrate: (m: number[]) => { vibrations.push(m); return true; } }, configurable: true });

const { changerReglages, jouer, reglages, sonCarte, sonFin, vibrer } = await import('../src/page/son');

beforeEach(() => { memoire.clear(); vibrations.length = 0; });

test('au départ : son et vibrations activés', () => {
  assert.deepEqual(reglages(), { son: true, volume: 0.7, vibrations: true });
});

test('réglages gardés, valeurs abîmées ignorées', () => {
  changerReglages({ son: false, volume: 0.3 });
  assert.deepEqual(reglages(), { son: false, volume: 0.3, vibrations: true });
  memoire.set('wbc-son', JSON.stringify({ son: 'oui', volume: 5, vibrations: false }));
  assert.deepEqual(reglages(), { son: true, volume: 0.7, vibrations: false });
  memoire.set('wbc-son', '{abîmé');
  assert.equal(reglages().son, true);
});

test('vibrations : seulement si activées', () => {
  vibrer('encaisse');
  assert.equal(vibrations.length, 1);
  changerReglages({ vibrations: false });
  vibrer('tombe');
  assert.equal(vibrations.length, 1);
});

test('carte révélée : vibration à partir d\'épique', () => {
  sonCarte('rare');
  assert.equal(vibrations.length, 0);
  sonCarte('legendaire');
  assert.equal(vibrations.length, 1);
});

test('son de fin : une seule fois par combat', () => {
  sonFin('solo-1', true, false);
  sonFin('solo-1', true, false); // écran de fin redessiné
  assert.equal(vibrations.length, 1);
  sonFin('solo-2', false, false);
  assert.equal(vibrations.length, 2);
});

test('sans haut-parleur disponible (pas de Web Audio), jouer ne plante pas', () => {
  assert.doesNotThrow(() => jouer('victoire'));
});
