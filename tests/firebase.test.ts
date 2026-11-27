// Firebase : copie locale d'une salle, joueurs présents, connexion anonyme, secours par relais.
// Firebase lui-même est remplacé par des imitations (pas de réseau dans les tests).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIREBASE, appliquer, connexion, pairsDe, salleEnLigne, salleFirebase } from '../src/page/firebase';
import type { Salle } from '../src/page/enligne';

// ---------- Imitations : stockage du navigateur, réseau, flux en direct ----------

const stock = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => stock.get(k) ?? null, setItem: (k: string, v: string) => void stock.set(k, v),
  removeItem: (k: string) => void stock.delete(k),
};

type Appel = { url: string; methode: string; corps: unknown };
let appels: Appel[] = [];
let reponse: (url: string) => unknown = () => ({});
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  appels.push({ url, methode: init?.method ?? 'GET', corps: init?.body ? JSON.parse(String(init.body)) : null });
  return new Response(JSON.stringify(reponse(url)), { status: 200 });
}) as typeof fetch;

class FluxImite {
  static dernier: FluxImite | null = null;
  ecouteurs: Record<string, ((ev: MessageEvent) => void)[]> = {};
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ferme = false;
  constructor(public url: string) { FluxImite.dernier = this; }
  addEventListener(type: string, f: (ev: MessageEvent) => void) { (this.ecouteurs[type] ??= []).push(f); }
  close() { this.ferme = true; }
  envoyer(type: string, data: unknown) { for (const f of this.ecouteurs[type] ?? []) f({ data: JSON.stringify(data) } as MessageEvent); }
}
(globalThis as Record<string, unknown>).EventSource = FluxImite;

const attendre = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const reponsesFirebase = (url: string) => {
  if (url.includes('accounts:signUp')) return { localId: 'moi', idToken: 'jeton-1', refreshToken: 'renouv-1', expiresIn: '3600' };
  if (url.includes('securetoken')) return { user_id: 'moi', id_token: 'jeton-2', refresh_token: 'renouv-2', expires_in: '3600' };
  if (url.includes('serverTimeOffset')) return 0;
  return null;
};

// ---------- Copie locale de la salle ----------

test('salle : les événements put et patch mettent à jour la copie locale', () => {
  let a = appliquer(null, 'put', '/', { u1: { p: 'a', t: 1 } });
  assert.deepEqual(a, { u1: { p: 'a', t: 1 } });
  a = appliquer(a, 'put', '/u2', { p: 'b', t: 2 });
  assert.deepEqual(a, { u1: { p: 'a', t: 1 }, u2: { p: 'b', t: 2 } });
  a = appliquer(a, 'patch', '/u1', { t: 5 });
  assert.deepEqual(a, { u1: { p: 'a', t: 5 }, u2: { p: 'b', t: 2 } }, 'patch garde les autres champs');
  a = appliquer(a, 'put', '/u1/t', 9);
  assert.equal((a?.u1 as { t: number }).t, 9);
  a = appliquer(a, 'put', '/u2', null);
  assert.deepEqual(a, { u1: { p: 'a', t: 9 } }, 'un joueur qui part est effacé');
  assert.equal(appliquer(a, 'put', '/', null), null, 'salle vide');
});

test('salle : on ne voit que les autres joueurs, vivants, le plus récent d\'abord', () => {
  const t = 1_000_000;
  const arbre = {
    moi: { p: JSON.stringify({ role: 'hote' }), t },
    ami: { p: JSON.stringify({ role: 'invite', n: 1 }), t: t - 5_000 },
    ami2: { p: JSON.stringify({ role: 'invite', n: 2 }), t: t - 1_000 },
    parti: { p: JSON.stringify({ role: 'invite' }), t: t - 120_000 },
    abime: { p: '{pas du json', t },
    vide: { t },
  };
  assert.deepEqual(pairsDe(arbre, 'moi', t).map((p) => p.peer), ['ami2', 'ami']);
  assert.deepEqual(pairsDe(arbre, 'moi', t)[0].presence, { role: 'invite', n: 2 });
  assert.equal(pairsDe(arbre, 'moi', t + 200_000).length, 0, 'tout le monde silencieux depuis 90 s');
  assert.equal(pairsDe(arbre, 'moi', t - 100_000, 100_000).length, 2, 'horloge du téléphone en retard : corrigée');
});

// ---------- Connexion anonyme ----------

test('connexion : une seule inscription, puis le même identifiant, renouvelé avant expiration', async () => {
  stock.clear();
  appels = [];
  reponse = reponsesFirebase;
  const s1 = await connexion();
  assert.equal(s1.uid, 'moi');
  assert.equal(appels.filter((a) => a.url.includes('signUp')).length, 1);
  assert.ok(appels[0].url.includes(FIREBASE.apiKey));
  const s2 = await connexion();
  assert.equal(s2.jeton, 'jeton-1', 'jeton encore valide : pas de nouvel appel');
  assert.equal(appels.length, 1);
  // Le jeton expire bientôt : il est renouvelé, l'identifiant ne change pas.
  const garde = JSON.parse(stock.get('wbc-firebase')!);
  assert.equal(garde.uid, 'moi');
  s2.expire = Date.now() + 60_000;
  const s3 = await connexion();
  assert.equal(s3.jeton, 'jeton-2');
  assert.equal(s3.uid, 'moi');
  assert.equal(appels.filter((a) => a.url.includes('signUp')).length, 1, 'pas de nouvelle inscription');
});

// ---------- Salle Firebase ----------

test('salle Firebase : écrit sa place, lit l\'ami en direct, efface sa place en partant', async () => {
  appels = [];
  reponse = reponsesFirebase;
  const salle = salleFirebase('abcd');
  let changements = 0;
  salle.surChangement(() => changements++);
  await attendre();
  const flux = FluxImite.dernier!;
  assert.ok(flux.url.startsWith(`${FIREBASE.base}/salles/abcd.json?auth=`));
  salle.publier({ role: 'hote', jt: 'x' });
  await attendre();
  const ecrit = appels.find((a) => a.methode === 'PATCH');
  assert.ok(ecrit && ecrit.url.includes('/salles/abcd/moi.json'));
  assert.deepEqual(ecrit.corps, { p: JSON.stringify({ role: 'hote', jt: 'x' }), t: { '.sv': 'timestamp' } }, 'heure donnée par le serveur');
  assert.equal(salle.connecte(), false);
  flux.envoyer('put', { path: '/', data: { moi: { p: '{"role":"hote"}', t: Date.now() }, ami: { p: '{"role":"invite"}', t: Date.now() } } });
  assert.equal(salle.connecte(), true);
  assert.deepEqual(salle.pairs(), [{ peer: 'ami', presence: { role: 'invite' } }]);
  flux.envoyer('put', { path: '/ami', data: null });
  assert.equal(salle.pairs().length, 0);
  assert.ok(changements >= 2);
  salle.quitter();
  await attendre();
  assert.ok(flux.ferme);
  assert.ok(appels.some((a) => a.methode === 'DELETE' && a.url.includes('/salles/abcd/moi.json')));
});

test('salle Firebase : un état trop gros n\'est pas envoyé (Firebase le refuserait)', async () => {
  appels = [];
  const salle = salleFirebase('efgh');
  await attendre();
  salle.publier({ gros: 'x'.repeat(40_000) });
  await attendre();
  assert.equal(appels.filter((a) => a.methode === 'PATCH' && a.corps && 'p' in (a.corps as object)).length, 0);
  salle.quitter();
});

// ---------- Secours ----------

function salleImitee(): Salle & { publie: object[]; amis: object[]; partie: boolean } {
  const s = {
    publie: [] as object[], amis: [] as object[], partie: false,
    publier(p: object) { s.publie.push(p); },
    pairs: () => s.amis.map((presence, i) => ({ peer: `r${i}`, presence: presence as Record<string, unknown> })),
    surChangement: () => () => true,
    connecte: () => true,
    quitter() { s.partie = true; },
  };
  return s;
}

test('secours : les relais publics ne s\'ouvrent que si Firebase ne répond pas ou si l\'ami n\'y est pas', async () => {
  appels = [];
  // 1. Firebase répond et l'ami y est : pas de relais.
  let relais: ReturnType<typeof salleImitee> | null = null;
  const s1 = salleEnLigne('ijkm', () => (relais = salleImitee()), { connexion: 40, ami: 80 });
  await attendre();
  FluxImite.dernier!.envoyer('put', { path: '/', data: { ami: { p: '{"role":"invite"}', t: Date.now() } } });
  await attendre(120);
  assert.equal(relais, null);
  s1.quitter();
  // 2. Firebase ne répond pas : relais ouverts, avec ce qui était déjà publié.
  reponse = () => { throw new Error('hors ligne'); };
  const s2 = salleEnLigne('npqr', () => (relais = salleImitee()), { connexion: 40, ami: 80 });
  s2.publier({ role: 'hote' });
  await attendre(60);
  assert.ok(relais);
  const r = relais as unknown as ReturnType<typeof salleImitee>;
  assert.deepEqual(r.publie, [{ role: 'hote' }]);
  r.amis.push({ role: 'invite' });
  assert.deepEqual(s2.pairs().map((p) => p.presence), [{ role: 'invite' }], 'l\'ami arrive par le relais');
  assert.equal(s2.connecte(), true);
  s2.quitter();
  assert.equal(r.partie, true);
  reponse = reponsesFirebase;
});

test('règles Firebase : chacun n\'écrit que sa place, une salle ne se lit qu\'avec son code', () => {
  const r = JSON.parse(readFileSync(new URL('../firebase/database.rules.json', import.meta.url), 'utf8')).rules;
  assert.equal(r['.read'], false);
  assert.equal(r['.write'], false);
  const salle = r.salles.$code;
  assert.equal(salle['.write'], undefined, 'personne n\'écrit la salle entière');
  assert.match(salle['.read'], /auth != null/);
  assert.match(salle.$joueur['.write'], /auth\.uid === \$joueur/);
  assert.match(salle.$joueur.p['.validate'], /30000/);
  assert.equal(salle.$joueur.$autre['.validate'], false, 'aucun autre champ');
  assert.equal(r.salles['.read'], undefined, 'la liste des salles est fermée');
});
