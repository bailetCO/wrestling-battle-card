// Bêta : code d'invitation, nouveautés, export et import de la sauvegarde.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creerHasard } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection, ouvrirBooster } from '../src/page/collection';
import { codeInvitationValide, empreinte, exporterSauvegarde, importerSauvegarde, normaliserCode, nouveautesAMontrer } from '../src/page/beta';
import { NOUVEAUTES, VERSION } from '../src/page/nouveautes';

test('la version du jeu est la même partout, et ses nouveautés sont écrites', () => {
  const paquet = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(paquet.version, VERSION);
  assert.equal(NOUVEAUTES[0].version, VERSION, 'la première entrée de NOUVEAUTES est la version actuelle');
  for (const n of NOUVEAUTES) {
    assert.ok(n.lignes.length >= 1 && n.lignes.length <= 6, `${n.version} : 1 à 6 lignes`);
    assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('code d\'invitation : seul le bon code ouvre la bêta, il n\'est pas écrit en clair', () => {
  assert.equal(normaliserCode(' ab c-d '), 'ABCD');
  for (const faux of ['', 'COCOACH', 'WRESTLING', 'cocoachgames', '1234']) assert.equal(codeInvitationValide(faux), false, faux);
  assert.equal(empreinte('abc'), empreinte('abc'));
  assert.notEqual(empreinte('abc'), empreinte('abd'));
  // Le vrai code est vérifié dans le navigateur : il n'est écrit nulle part dans le dépôt public.
});

test('nouveautés : rien au premier lancement, la dernière après une mise à jour, une seule fois', () => {
  const liste = [
    { version: '0.8.0', date: '2026-12-20', lignes: ['c'] },
    { version: '0.7.0', date: '2026-12-10', lignes: ['b'] },
    { version: '0.6.0', date: '2026-11-26', lignes: ['a'] },
  ];
  assert.deepEqual(nouveautesAMontrer(null, liste, '0.8.0'), [], 'premier lancement');
  assert.deepEqual(nouveautesAMontrer('0.8.0', liste, '0.8.0'), [], 'déjà vues');
  assert.deepEqual(nouveautesAMontrer('0.7.0', liste, '0.8.0').map((n) => n.version), ['0.8.0']);
  assert.deepEqual(nouveautesAMontrer('0.6.0', liste, '0.8.0').map((n) => n.version), ['0.8.0', '0.7.0'], 'deux mises à jour manquées');
  assert.deepEqual(nouveautesAMontrer('0.0.0', liste, '0.8.0').map((n) => n.version), ['0.8.0'], 'joueur d\'avant la bêta');
});

function collectionDeTest() {
  const c = nouvelleCollection();
  c.coach = 'Testeur';
  c.medailles = 137;
  c.dollars = 420;
  c.victoires = 12;
  for (let i = 0; i < 6; i++) ouvrirBooster(c, creerHasard(10 + i), 'rare');
  c.histoire = { etape: 4, nations: ['usa', 'iran'], passees: [] };
  return depuisSauvegarde(JSON.parse(JSON.stringify(c)));
}

test('sauvegarde : le code exporté redonne exactement la même collection', async () => {
  const c = collectionDeTest();
  const code = await exporterSauvegarde(c);
  assert.match(code, /^WBC1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
  assert.ok(code.length < JSON.stringify(c).length, 'le code est compressé');
  const lu = await importerSauvegarde(`  ${code.slice(0, 40)}\n${code.slice(40)}  `); // retours à la ligne d'un copier-coller
  assert.notEqual(typeof lu, 'string');
  assert.deepEqual(JSON.parse(JSON.stringify(lu)), JSON.parse(JSON.stringify(c)));
});

test('sauvegarde : un code modifié, coupé ou inventé est refusé', async () => {
  const code = await exporterSauvegarde(collectionDeTest());
  const [type, corps, controle] = code.split('.');
  const lettre = corps[20] === 'A' ? 'B' : 'A';
  for (const faux of [
    `${type}.${corps.slice(0, 20)}${lettre}${corps.slice(21)}.${controle}`, // une lettre changée
    code.slice(0, -10), // code coupé
    `${type}.${corps}.00000000`, // contrôle inventé
    'bonjour',
    '',
  ]) {
    const r = await importerSauvegarde(faux);
    assert.equal(typeof r, 'string', `refusé : ${faux.slice(0, 30)}`);
  }
});

test('sauvegarde : un code sans compression (vieux navigateur) se relit aussi', async () => {
  const c = collectionDeTest();
  const brut = Buffer.from(JSON.stringify(c)).toString('base64url');
  const corps = `WBC0.${brut}`;
  const code = `${corps}.${empreinte(`wbc-sauvegarde${corps}`)}`;
  const lu = await importerSauvegarde(code);
  assert.notEqual(typeof lu, 'string');
  assert.deepEqual(JSON.parse(JSON.stringify(lu)), JSON.parse(JSON.stringify(c)));
});

test('sauvegarde : une collection lue passe par les mêmes contrôles qu\'au démarrage', async () => {
  const c = collectionDeTest() as unknown as Record<string, unknown>;
  (c.exemplaires as Record<string, number>)['lutteur-invente'] = 99;
  c.medailles = -50;
  const corps = `WBC0.${Buffer.from(JSON.stringify(c)).toString('base64url')}`;
  const lu = await importerSauvegarde(`${corps}.${empreinte(`wbc-sauvegarde${corps}`)}`);
  assert.notEqual(typeof lu, 'string');
  if (typeof lu === 'string') return;
  assert.equal(lu.exemplaires['lutteur-invente'], undefined, 'carte inconnue retirée');
  assert.equal(lu.medailles, 0, 'nombre impossible remis à zéro');
});
