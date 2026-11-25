// Quêtes journalières : tirage du jour, progression, récompenses, quêtes uniques, changement à 5 $.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { depuisSauvegarde, nouvelleCollection, type Collection } from '../src/page/collection';
import { QUETES, changerQuete, noterQuete, queteDe, quetesDuJour, type EvenementQuete } from '../src/page/quetes';

const h = creerHasard(4);
const combat = (o: Partial<Extract<EvenementQuete, { type: 'combat' }>> = {}): EvenementQuete => ({
  type: 'combat', mode: 'arene', gagne: true, niveau: 'normal', auto: false, tombe: false, ecart: 4, points: 6,
  nation: 'usa', niveauCarte: 'rare', feintes: 0, contres: 0, champion: false, ...o,
});
const avecNiveau = (medailles: number) => { const c = nouvelleCollection(); c.idCoach = 'coach-test'; c.medailles = medailles; return c; };

test('quêtes : 3 par jour, une facile (ou unique), une moyenne, une difficile, adaptées au niveau', () => {
  for (const m of [0, 30, 60, 150]) {
    const c = avecNiveau(m);
    c.quetes.uniques = QUETES.filter((q) => q.difficulte === 'unique').map((q) => q.id); // plus d'unique
    const l = quetesDuJour(c, '2026-11-25');
    assert.equal(l.length, 3);
    assert.equal(new Set(l.map((q) => q.id)).size, 3);
    for (const q of l) assert.ok(queteDe(q.id).niveauMin <= 1 + Math.floor(m / 15));
    if (m >= 30) assert.deepEqual(l.map((q) => queteDe(q.id).difficulte), ['facile', 'moyenne', 'difficile']);
  }
});

test('quêtes : même jour = mêmes quêtes ; nouveau jour = nouvelles quêtes, les anciennes disparaissent', () => {
  const c = avecNiveau(60);
  const a = quetesDuJour(c, '2026-11-25').map((q) => q.id);
  assert.deepEqual(quetesDuJour(c, '2026-11-25').map((q) => q.id), a);
  c.quetes.liste[1].progres = 1;
  const jours = ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'].map((j) => quetesDuJour(c, j).map((q) => q.id).join());
  assert.ok(jours.some((x) => x !== a.join()));
  assert.ok(c.quetes.liste.every((q) => q.progres === 0));
});

test('quêtes uniques : une par jour tant qu\'il en reste, jamais deux fois ; validée tout de suite si déjà remplie', () => {
  const c = avecNiveau(0);
  c.bonusTutoriel = true; // tutoriel déjà fini : « Finir le tutoriel » se valide dès la première vérification
  const l = quetesDuJour(c, '2026-11-25');
  assert.equal(l[0].id, 'u-tutoriel');
  const r = noterQuete(c, { type: 'etat' }, '2026-11-25', h);
  assert.equal(r.length, 1);
  assert.equal(r[0].boosters.length, 1);
  assert.deepEqual(c.quetes.uniques, ['u-tutoriel']);
  const l2 = quetesDuJour(c, '2026-11-26');
  assert.notEqual(l2[0].id, 'u-tutoriel');
  assert.equal(queteDe(l2[0].id).difficulte, 'unique');
});

test('quêtes : progression, récompenses (5 $ / 10 $ + 1 médaille / booster + 2 médailles) et bonus des 3', () => {
  const c = avecNiveau(60);
  c.quetes.uniques = QUETES.filter((q) => q.difficulte === 'unique').map((q) => q.id);
  quetesDuJour(c, '2026-11-25');
  c.quetes.liste = [
    { id: 'gagner-1', param: '', progres: 0, faite: false },
    { id: 'gagner-3', param: '', progres: 0, faite: false },
    { id: 'fort', param: '', progres: 0, faite: false },
  ];
  const d0 = c.dollars, m0 = c.medailles;
  const r1 = noterQuete(c, combat(), '2026-11-25', h);
  assert.deepEqual(r1.map((x) => x.dollars), [5]);
  noterQuete(c, combat({ gagne: false }), '2026-11-25', h);
  noterQuete(c, combat(), '2026-11-25', h);
  const r3 = noterQuete(c, combat({ niveau: 'fort', auto: true }), '2026-11-25', h); // 3e victoire ; fort mais en auto
  assert.equal(r3.length, 1);
  assert.equal(c.quetes.liste[1].faite, true);
  assert.equal(c.quetes.liste[2].faite, false);
  const r4 = noterQuete(c, combat({ niveau: 'fort' }), '2026-11-25', h);
  assert.equal(r4.length, 2); // quête difficile + bonus
  assert.equal(r4[0].boosters.length, 1);
  assert.equal(r4[1].boosters[0].type, 'rare');
  assert.equal(c.medailles - m0, 1 + 2);
  assert.ok(c.dollars - d0 >= 15);
  assert.deepEqual(noterQuete(c, combat(), '2026-11-25', h), []); // plus rien à gagner
});

test('quêtes : série « 3 d\'affilée contre le fort » remise à zéro par une défaite', () => {
  const c = avecNiveau(150);
  quetesDuJour(c, '2026-11-25');
  c.quetes.liste = [{ id: 'serie-fort', param: '', progres: 0, faite: false }];
  noterQuete(c, combat({ niveau: 'fort' }), '2026-11-25', h);
  noterQuete(c, combat({ niveau: 'fort' }), '2026-11-25', h);
  noterQuete(c, combat({ niveau: 'fort', gagne: false }), '2026-11-25', h);
  assert.equal(c.quetes.liste[0].progres, 0);
});

test('changer une quête : une fois par jour, 5 $, jamais une quête unique', () => {
  const c = avecNiveau(60);
  c.bonusTutoriel = false;
  const l = quetesDuJour(c, '2026-11-25');
  assert.equal(queteDe(l[0].id).difficulte, 'unique');
  c.dollars = 20;
  assert.match(changerQuete(c, '2026-11-25', 0)!, /unique/);
  const avant = l[1].id;
  assert.equal(changerQuete(c, '2026-11-25', 1), null);
  assert.equal(c.dollars, 20 - REGLES.quetes.prixChangement);
  assert.notEqual(c.quetes.liste[1].id, avant);
  assert.equal(queteDe(c.quetes.liste[1].id).difficulte, 'moyenne');
  assert.match(changerQuete(c, '2026-11-25', 2)!, /déjà changé/);
  const d = avecNiveau(60);
  quetesDuJour(d, '2026-11-25');
  d.dollars = 4;
  assert.match(changerQuete(d, '2026-11-25', 2)!, /5 \$/);
});

test('quêtes gardées dans la sauvegarde', () => {
  const c: Collection = avecNiveau(30);
  quetesDuJour(c, '2026-11-25');
  c.quetes.uniques = ['u-club'];
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(d.quetes, c.quetes);
});
