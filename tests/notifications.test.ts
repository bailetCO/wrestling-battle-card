// Notifications (28/11/2026) : état mémorisé, et rien ne casse là où elles sont impossibles.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const memoire = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => memoire.get(k) ?? null,
  setItem: (k: string, v: string) => void memoire.set(k, v),
  removeItem: (k: string) => void memoire.delete(k),
};
const { activerNotifications, etatNotifs, noterPlusTard, notificationsPossibles, permission } = await import('../src/page/notifications');
const { FIREBASE } = await import('../src/page/firebase');

test('jamais proposé au départ, puis « plus tard » mémorisé', () => {
  assert.equal(etatNotifs(), null);
  noterPlusTard();
  assert.equal(etatNotifs(), 'plus-tard');
});

test('sans navigateur compatible : impossible, sans planter', async () => {
  assert.equal(notificationsPossibles(), false);
  assert.equal(permission(), 'impossible');
  assert.equal(await activerNotifications(), 'impossible');
});

test('réglages Firebase des notifications présents', () => {
  assert.match(FIREBASE.appId, /^1:626474743975:web:[0-9a-f]+$/);
  assert.equal(FIREBASE.messagingSenderId, '626474743975');
  assert.match(FIREBASE.vapidKey, /^B[A-Za-z0-9_-]{80,}$/);
});
