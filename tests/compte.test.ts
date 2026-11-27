// Comptes joueurs (27/11/2026) : création, connexion, Google, sauvegarde en ligne et choix en cas
// de deux sauvegardes différentes. Firebase est simulé (aucun appel réseau réel).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { changerSession, sessionActuelle } from '../src/page/firebase';
import { collectionNeuve, connexionGoogle, creerCompteEmail, decision, ecrireEnLigne, messageErreur, resumeDe, type SauvegardeEnLigne } from '../src/page/compte';
import { nouvelleCollection } from '../src/page/collection';
import { exporterSauvegarde } from '../src/page/beta';

type Appel = { url: string; corps: Record<string, unknown> | null; entetes: Record<string, string> };
let appels: Appel[] = [];
// Réponses simulées, dans l'ordre des appels.
function simuler(reponses: (Record<string, unknown> | { erreur: string })[]) {
  appels = [];
  let i = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    appels.push({ url: String(url), corps: init?.body ? JSON.parse(String(init.body)) : null, entetes: (init?.headers ?? {}) as Record<string, string> });
    const r = reponses[i++] ?? {};
    if ('erreur' in r) return new Response(JSON.stringify({ error: { message: r.erreur } }), { status: 400 });
    return new Response(JSON.stringify(r), { status: 200 });
  }) as typeof fetch;
}
const jetons = (uid: string, t: string) => ({ localId: uid, idToken: t, refreshToken: `r-${t}`, expiresIn: '3600' });

beforeEach(() => changerSession(null));

test('créer un compte e-mail garde l\'identifiant anonyme du téléphone', async () => {
  simuler([jetons('anon-1', 't0'), jetons('anon-1', 't1')]);
  const s = await creerCompteEmail(' coach@exemple.fr ', 'secret1');
  assert.match(appels[0].url, /accounts:signUp/); // connexion anonyme d'abord
  assert.match(appels[1].url, /accounts:update/); // puis liaison de l'e-mail à cet identifiant
  assert.deepEqual(appels[1].corps, { idToken: 't0', email: 'coach@exemple.fr', password: 'secret1', returnSecureToken: true });
  assert.equal(s.uid, 'anon-1');
  assert.deepEqual(sessionActuelle()?.compte, { email: 'coach@exemple.fr', fournisseur: 'password' });
});

test('Google : si le compte Google existe déjà ailleurs, on s\'y connecte', async () => {
  simuler([jetons('anon-2', 't0'), { erreur: 'FEDERATED_USER_ID_ALREADY_LINKED' }, { ...jetons('google-9', 'g1'), email: 'coach@gmail.com' }]);
  const s = await connexionGoogle('jeton-google', 'https://bailetco.github.io/wrestling-battle-card/');
  assert.equal(appels[1].corps?.idToken, 't0'); // essai de liaison avec le compte anonyme
  assert.equal(appels[2].corps?.idToken, undefined); // puis simple connexion
  assert.match(String(appels[2].corps?.postBody), /id_token=jeton-google&providerId=google\.com/);
  assert.equal(s.uid, 'google-9');
  assert.equal(sessionActuelle()?.compte?.email, 'coach@gmail.com');
});

test('messages d\'erreur en français simple', () => {
  assert.match(messageErreur(new Error('Firebase : EMAIL_EXISTS')), /existe déjà/);
  assert.match(messageErreur(new Error('Firebase : WEAK_PASSWORD : Password should be at least 6 characters')), /6 caractères/);
  assert.match(messageErreur(new Error('Firebase : INVALID_LOGIN_CREDENTIALS')), /incorrect/);
  assert.match(messageErreur(new Error('Failed to fetch')), /connexion internet/);
});

test('sauvegarde en ligne : écrite dans comptes/<identifiant>, avec l\'heure du serveur', async () => {
  simuler([jetons('anon-3', 't0'), jetons('anon-3', 't1'), {}]);
  await creerCompteEmail('a@b.fr', 'secret1');
  const c = nouvelleCollection();
  c.coach = 'Corentin';
  assert.ok(await ecrireEnLigne(c));
  const ecriture = appels[2];
  assert.match(ecriture.url, /documents:commit$/);
  assert.equal(ecriture.entetes.authorization, 'Bearer t1');
  const w = (ecriture.corps!.writes as { update: { name: string; fields: Record<string, { stringValue?: string }> }; updateTransforms: { fieldPath: string }[] }[])[0];
  assert.match(w.update.name, /\/comptes\/anon-3$/);
  assert.equal(w.update.fields.code.stringValue, await exporterSauvegarde(c));
  assert.equal(w.update.fields.coach.stringValue, 'Corentin');
  assert.deepEqual(w.updateTransforms.map((x) => x.fieldPath), ['maj']);
});

test('sans compte, rien n\'est envoyé', async () => {
  simuler([jetons('anon-4', 't0')]);
  assert.equal(await ecrireEnLigne(nouvelleCollection()), false);
  assert.ok(!appels.some((a) => /commit/.test(a.url)));
});

test('deux sauvegardes : envoyer, reprendre, identiques ou demander au joueur', async () => {
  const local = nouvelleCollection();
  const enLigne = (code: string): SauvegardeEnLigne => ({ code, maj: '', resume: resumeDe(local) });
  assert.equal(await decision(local, null), 'envoyer'); // le compte n'a pas encore de sauvegarde
  assert.equal(await decision(local, enLigne(await exporterSauvegarde(local))), 'identiques');
  const autre = nouvelleCollection();
  autre.victoires = 12;
  assert.ok(collectionNeuve(local));
  assert.equal(await decision(local, enLigne(await exporterSauvegarde(autre))), 'reprendre'); // téléphone neuf
  local.victoires = 3;
  assert.equal(await decision(local, enLigne(await exporterSauvegarde(autre))), 'choisir');
});
