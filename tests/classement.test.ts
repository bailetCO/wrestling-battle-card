// Classements (28/11/2026) : sauvegarde, dates, publication et lecture des trois classements (Firebase simulé).
// Règles des divisions et du palmarès : divisions.test.ts.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { changerSession } from '../src/page/firebase';
import {
  combatEnLigne, drapeau, joursRestants, lireClassement, moisUTC, nomMois, publier, victoireFort,
} from '../src/page/classement';

const t0 = Date.UTC(2026, 10, 27, 12); // 27 novembre 2026, midi (heure universelle)

beforeEach(() => changerSession(null));

test('le classement est gardé dans la sauvegarde', () => {
  const c = nouvelleCollection();
  combatEnLigne(c, true, t0);
  c.pays = 'FR';
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.classement.points, 25);
  assert.equal(d.pays, 'FR');
  assert.equal(depuisSauvegarde({ ...JSON.parse(JSON.stringify(c)), pays: 'France!', classement: { points: -5 } }).classement.points, 0); // données abîmées
});

test('dates, drapeaux et jours restants', () => {
  assert.equal(moisUTC(t0), '2026-11');
  assert.equal(nomMois('2026-11'), 'novembre 2026');
  assert.equal(drapeau('FR'), '🇫🇷');
  assert.equal(drapeau(''), '');
  assert.equal(joursRestants(t0), 4); // 27 nov. midi → 1er déc. : 3,5 jours, arrondi à 4
});

// ---------- En ligne, Firebase simulé ----------

type Appel = { url: string; corps: Record<string, unknown> | null };
let appels: Appel[] = [];
function simuler(reponses: unknown[]) {
  appels = [];
  let i = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    appels.push({ url: String(url), corps: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(reponses[i++] ?? {}), { status: 200 });
  }) as typeof fetch;
}
const connecte = () => changerSession({ uid: 'moi', jeton: 't', renouvellement: 'r', expire: Date.now() + 3_600_000, compte: { email: 'a@b.fr', fournisseur: 'google.com' } });

test('sans compte, rien n\'est publié', async () => {
  simuler([{ localId: 'anon', idToken: 't', refreshToken: 'r', expiresIn: '3600' }]);
  const c = nouvelleCollection();
  c.coach = 'Corentin';
  assert.equal(await publier(c), false);
  assert.ok(!appels.some((a) => /commit/.test(a.url)));
});

test('publication : palmarès à vie, puis ma ligne du mois si j\'ai joué en ligne', async () => {
  connecte();
  simuler([{}, {}, {}]);
  const c = nouvelleCollection();
  c.coach = 'Corentin';
  c.pays = 'FR';
  victoireFort(c);
  assert.ok(await publier(c));
  type W = { update: { name: string; fields: Record<string, { stringValue?: string; integerValue?: string }> } };
  const ecrit = (i: number) => (appels[i].corps!.writes as W[])[0].update;
  assert.equal(appels.length, 1); // pas encore de combat en ligne : seulement le palmarès
  assert.match(ecrit(0).name, /\/palmares\/moi$/);
  assert.equal(ecrit(0).fields.fort.integerValue, '1');
  assert.equal(ecrit(0).fields.saison.integerValue, '0');
  assert.equal(ecrit(0).fields.pseudo.stringValue, 'Corentin');
  combatEnLigne(c, true);
  assert.ok(await publier(c));
  assert.match(ecrit(2).name, new RegExp(`/classements/${moisUTC(Date.now())}/joueurs/moi$`));
  assert.equal(ecrit(2).fields.points.integerValue, '25');
  assert.equal(ecrit(2).fields.enLigne.integerValue, '1');
  assert.equal(ecrit(2).fields.pays.stringValue, 'FR');
});

const doc = (uid: string, pseudo: string, points: number) => ({ document: { name: `x/joueurs/${uid}`, fields: { pseudo: { stringValue: pseudo }, points: { integerValue: String(points) }, pays: { stringValue: 'FR' }, idCoach: { stringValue: `c-${uid}` } } } });

test('classement de tous : trié, et ma place comptée si je suis loin', async () => {
  connecte();
  simuler([[doc('a', 'Ana', 300), doc('b', 'Bo', 120)], [{ result: { aggregateFields: { n: { integerValue: '153' } } } }]]);
  const c = nouvelleCollection();
  combatEnLigne(c, true);
  const r = await lireClassement(c, 'monde');
  assert.deepEqual(r.lignes.map((l) => l.pseudo), ['Ana', 'Bo']);
  assert.equal(r.maPlace, 154);
  assert.match(appels[1].url, /runAggregationQuery/);
});

test('classement des amis : filtre sur mes amis et moi', async () => {
  connecte();
  simuler([[doc('b', 'Bo', 12), doc('moi', 'Moi', 40)]]);
  const c = nouvelleCollection();
  c.amis = { 'c-b': { pseudo: 'Bo', vu: 1, victoires: 0, defaites: 0, echanges: 0 } };
  const r = await lireClassement(c, 'amis');
  assert.deepEqual(r.lignes.map((l) => [l.pseudo, l.moi]), [['Moi', true], ['Bo', false]]);
  assert.equal(r.maPlace, 1);
  const q = (appels[0].corps!.structuredQuery as { where: { fieldFilter: { op: string; value: { arrayValue: { values: { stringValue: string }[] } } } } }).where.fieldFilter;
  assert.equal(q.op, 'IN');
  assert.deepEqual(q.value.arrayValue.values.map((v) => v.stringValue), [c.idCoach, 'c-b']);
});

const docPalmares = (uid: string, pseudo: string, fort: number, saison: number) => ({ document: { name: `x/palmares/${uid}`, fields: { pseudo: { stringValue: pseudo }, fort: { integerValue: String(fort) }, saison: { integerValue: String(saison) }, idCoach: { stringValue: `c-${uid}` } } } });

test('classements à vie : ordinateur fort et saison sportive, lus dans palmares', async () => {
  connecte();
  simuler([[docPalmares('a', 'Ana', 40, 12), docPalmares('b', 'Bo', 9, 31), docPalmares('z', 'Zéro', 0, 0)]]);
  const c = nouvelleCollection();
  const r = await lireClassement(c, 'monde', 'fort');
  assert.deepEqual(r.lignes.map((l) => [l.pseudo, l.points]), [['Ana', 40], ['Bo', 9]]); // les joueurs à 0 ne sont pas listés
  const q = appels[0];
  assert.match(q.url, /documents:runQuery$/);
  assert.equal((q.corps!.structuredQuery as { from: { collectionId: string }[] }).from[0].collectionId, 'palmares');
  simuler([[docPalmares('a', 'Ana', 40, 12), docPalmares('b', 'Bo', 9, 31)]]);
  const s = await lireClassement(c, 'monde', 'saison');
  assert.deepEqual(s.lignes.map((l) => l.pseudo), ['Bo', 'Ana']);
});
