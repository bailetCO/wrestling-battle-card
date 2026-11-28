// Codes créateurs (28/11/2026) : carte du créateur, une fois par code, sauvegarde, lecture en ligne.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAMPIONS, trouverLutteur } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection, recevoirCodeCreateur } from '../src/page/collection';
import { changerSession } from '../src/page/firebase';
import { createurValide, defCreateur, lireCode, normaliserCode } from '../src/page/createurs';

const lutteMag = { code: 'LUTTEMAG', nom: 'Lutte Mag', nation: 'japon', image: 'https://exemple.fr/lm.png' };

test('code normalisé et fiche vérifiée', () => {
  assert.equal(normaliserCode(' lutte-mag '), 'LUTTEMAG');
  assert.ok(createurValide(lutteMag));
  assert.ok(!createurValide({ ...lutteMag, nation: 'mars' }));
  assert.ok(!createurValide({ ...lutteMag, image: 'javascript:alert(1)' }));
  assert.ok(!createurValide({ ...lutteMag, code: 'X' }));
});

test('carte du créateur : le Champion du Monde de sa nation, avec son nom', () => {
  const d = defCreateur(lutteMag);
  const ch = CHAMPIONS.find((c) => c.nation === 'japon')!;
  assert.equal(d.id, 'createur-luttemag');
  assert.equal(d.nom, 'Lutte Mag');
  assert.equal(d.rarete, 'champion');
  assert.deepEqual([d.enduranceMax, d.force, d.actions], [ch.enduranceMax, ch.force, ch.actions]);
});

test('entrer un code : carte + booster épique, une seule fois', () => {
  const c = nouvelleCollection();
  const r = recevoirCodeCreateur(c, lutteMag, Math.random)!;
  assert.deepEqual(r.map((b) => b.type), ['recompense', 'epique']);
  assert.equal(c.exemplaires['createur-luttemag'], 1);
  assert.equal(c.createurSoutenu, 'LUTTEMAG');
  assert.equal(trouverLutteur('createur-luttemag').nom, 'Lutte Mag'); // connue du jeu
  assert.equal(recevoirCodeCreateur(c, lutteMag, Math.random), null);
  const autre = recevoirCodeCreateur(c, { ...lutteMag, code: 'TAPIS', nom: 'Le Tapis', nation: 'iran' }, Math.random);
  assert.ok(autre);
  assert.equal(c.createurSoutenu, 'TAPIS');
});

test('la carte du créateur reste dans la sauvegarde', () => {
  const c = nouvelleCollection();
  recevoirCodeCreateur(c, lutteMag, Math.random);
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.exemplaires['createur-luttemag'], 1);
  assert.deepEqual(d.createurs, [lutteMag]);
});

test('lecture d\'un code en ligne : actif, inconnu, désactivé', async () => {
  changerSession({ uid: 'u', jeton: 't', renouvellement: 'r', expire: Date.now() + 3_600_000 });
  const reponse = (statut: number, champs?: object) => { globalThis.fetch = (async () => new Response(JSON.stringify({ fields: champs }), { status: statut })) as typeof fetch; };
  reponse(200, { nom: { stringValue: 'Lutte Mag' }, nation: { stringValue: 'Japon' }, image: { stringValue: '' }, actif: { booleanValue: true } });
  assert.deepEqual(await lireCode('LUTTEMAG'), { code: 'LUTTEMAG', nom: 'Lutte Mag', nation: 'japon', image: '' });
  reponse(404);
  assert.equal(await lireCode('INCONNU'), null);
  reponse(200, { nom: { stringValue: 'Lutte Mag' }, nation: { stringValue: 'japon' }, actif: { booleanValue: false } });
  assert.equal(await lireCode('LUTTEMAG'), null);
  changerSession(null);
});

test('défi du créateur : une récompense par mois, cadre « Créateur » la première fois, seulement avec son code', async () => {
  const { gagnerDefiCreateur, defiDisponible, cadreCreateur } = await import('../src/page/collection');
  const { texteCadre } = await import('../src/page/classement');
  const { creerHasard } = await import('../src/moteur/hasard');
  const h = creerHasard(3);
  const c = nouvelleCollection();
  assert.equal(gagnerDefiCreateur(c, 'LUTTEMAG', '2026-12', h), null); // code jamais entré
  recevoirCodeCreateur(c, lutteMag, h);
  const id = 'createur-luttemag';
  assert.equal(c.exemplaires[id], 1);
  assert.ok(defiDisponible(c, 'LUTTEMAG', '2026-12'));
  const r = gagnerDefiCreateur(c, 'LUTTEMAG', '2026-12', h)!;
  assert.deepEqual(r.boosters.map((b) => b.type), ['recompense', 'epique']);
  assert.ok(r.cadre);
  assert.equal(c.exemplaires[id], 2);
  assert.deepEqual(c.classement.cadres, [cadreCreateur('LUTTEMAG')]);
  assert.equal(texteCadre('createur:LUTTEMAG'), 'Créateur · Lutte Mag');
  assert.equal(gagnerDefiCreateur(c, 'LUTTEMAG', '2026-12', h), null); // même mois : rien
  const r2 = gagnerDefiCreateur(c, 'LUTTEMAG', '2027-01', h)!; // mois suivant : de nouveau
  assert.ok(!r2.cadre); // le cadre, une seule fois
  assert.equal(c.exemplaires[id], 3);
  // Sauvegarde : défi du mois et cadre gardés ; le cadre peut être posé sur une carte.
  c.classement.cadreCartes.usa = 'createur:LUTTEMAG';
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(d.defisCreateurs.LUTTEMAG, '2027-01');
  assert.deepEqual(d.classement.cadreCartes, { usa: 'createur:LUTTEMAG' });
});
