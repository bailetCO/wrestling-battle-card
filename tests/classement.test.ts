// Classement mensuel (27/11/2026) : barème, plafond du jour, nouveau mois (divisions : divisions.test.ts),
// publication et lecture (Firebase simulé).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { changerSession } from '../src/page/firebase';
import {
  drapeau, gagnerPoints, joursRestants, lireClassement, majPeriode, moisUTC, nomMois, pointsCombat, publier,
} from '../src/page/classement';

const R = REGLES.classement;
const JOUR = 86_400_000;
const t0 = Date.UTC(2026, 10, 27, 12); // 27 novembre 2026, midi (heure universelle)

beforeEach(() => changerSession(null));

test('barème : niveau de l\'ordinateur, tombé, en ligne, tournoi', () => {
  assert.equal(pointsCombat({ niveau: 'facile' }), 1);
  assert.equal(pointsCombat({ niveau: 'normal' }), 2);
  assert.equal(pointsCombat({ niveau: 'fort', tombe: true }), 5);
  assert.equal(pointsCombat({ enLigne: true }), 6);
  assert.equal(pointsCombat({ enLigne: true, tombe: true }), 7);
  assert.equal(pointsCombat({ tournoiGagne: true }), 10);
});

test('plafond de 80 points par jour, puis nouveau jour', () => {
  const c = nouvelleCollection();
  let total = 0;
  for (let k = 0; k < 30; k++) total += gagnerPoints(c, { niveau: 'fort' }, t0); // 30 × 4 = 120 demandés
  assert.equal(total, R.plafondJour);
  assert.equal(c.classement.pointsJour, 80);
  assert.equal(gagnerPoints(c, { niveau: 'fort' }, t0), 0);
  assert.equal(gagnerPoints(c, { niveau: 'fort' }, t0 + JOUR), 4); // le lendemain, ça repart
  assert.equal(c.classement.points, 84);
  assert.equal(c.classement.pointsJour, 4);
});

test('nouveau mois : remise à zéro, le mois terminé attend sa récompense', () => {
  const c = nouvelleCollection();
  gagnerPoints(c, { niveau: 'fort' }, t0);
  assert.equal(c.classement.mois, '2026-11');
  majPeriode(c, Date.UTC(2026, 11, 1, 0, 5)); // 1er décembre
  assert.equal(c.classement.mois, '2026-12');
  assert.equal(c.classement.points, 0);
  assert.deepEqual(c.classement.enAttente, [{ mois: '2026-11', points: 4, division: 0 }]);
  majPeriode(c, Date.UTC(2026, 11, 2)); // pas de doublon
  assert.equal(c.classement.enAttente.length, 1);
});




test('le classement est gardé dans la sauvegarde', () => {
  const c = nouvelleCollection();
  gagnerPoints(c, { enLigne: true }, t0);
  c.pays = 'FR';
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.classement.points, 6);
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

test('publication : ma ligne du mois, avec le jour et les points du jour', async () => {
  connecte();
  simuler([{}]);
  const c = nouvelleCollection();
  c.coach = 'Corentin';
  c.pays = 'FR';
  gagnerPoints(c, { niveau: 'fort', tombe: true });
  assert.ok(await publier(c));
  const w = (appels[0].corps!.writes as { update: { name: string; fields: Record<string, { stringValue?: string; integerValue?: string }> } }[])[0];
  assert.match(w.update.name, new RegExp(`/classements/${moisUTC(Date.now())}/joueurs/moi$`));
  assert.equal(w.update.fields.points.integerValue, '5');
  assert.equal(w.update.fields.pointsJour.integerValue, '5');
  assert.equal(w.update.fields.jour.integerValue, String(Math.floor(Date.now() / JOUR)));
  assert.equal(w.update.fields.pays.stringValue, 'FR');
  assert.equal(w.update.fields.pseudo.stringValue, 'Corentin');
});

const doc = (uid: string, pseudo: string, points: number) => ({ document: { name: `x/joueurs/${uid}`, fields: { pseudo: { stringValue: pseudo }, points: { integerValue: String(points) }, pays: { stringValue: 'FR' }, idCoach: { stringValue: `c-${uid}` } } } });

test('classement de tous : trié, et ma place comptée si je suis loin', async () => {
  connecte();
  simuler([[doc('a', 'Ana', 300), doc('b', 'Bo', 120)], [{ result: { aggregateFields: { n: { integerValue: '153' } } } }]]);
  const c = nouvelleCollection();
  gagnerPoints(c, { niveau: 'facile' });
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
