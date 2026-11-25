// Mode histoire : 12 étapes dans l'ordre, validées seulement une fois débloquées.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { depuisSauvegarde, nouvelleCollection, type Collection } from '../src/page/collection';
import { PAR_NATION, nationsArene } from '../src/page/arene';
import { ETAPES, histoireFinie, noterHistoire, progression, type EvenementHistoire } from '../src/page/histoire';

const h = creerHasard(1);
const noter = (c: Collection, ev: EvenementHistoire) => noterHistoire(c, ev, h);
const deNation = (n: string) => LUTTEURS.filter((l) => l.nation === n);

test('histoire : 12 étapes, récompenses du PDF', () => {
  assert.equal(ETAPES.length, 12);
  assert.deepEqual(REGLES.histoire.boosters, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 0]);
});

test('étape 1 : 3 nations différentes ; la même nation ne compte qu\'une fois', () => {
  const c = nouvelleCollection();
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal' }), []);
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'facile' }), []);
  assert.deepEqual(progression(c), [1, 3]);
  noter(c, { type: 'victoire', nation: 'iran', niveau: null });
  const r = noter(c, { type: 'victoire', nation: 'japon', niveau: 'normal' });
  assert.equal(r.length, 1);
  assert.equal(r[0].etape, 0);
  assert.equal(r[0].boosters.length, 1);
  assert.equal(r[0].boosters[0].type, 'classique');
  assert.equal(c.histoire.etape, 1);
});

test('dans l\'ordre : un événement d\'une étape future ne compte pas, même plus tard', () => {
  const c = nouvelleCollection();
  noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: true });
  noter(c, { type: 'enLigne' });
  assert.equal(c.histoire.etape, 0);
  for (const n of ['usa', 'iran', 'japon']) noter(c, { type: 'victoire', nation: n, niveau: 'normal' });
  assert.equal(c.histoire.etape, 1); // le tournoi gagné avant ne compte pas
  assert.deepEqual(noter(c, { type: 'tournoiIndividuel', place: 2, invaincu: false }), []);
  assert.equal(noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: false }).length, 1);
  assert.equal(c.histoire.etape, 2);
});

test('étape 3 : Mon Club déjà ouvert = validée tout de suite (enchaînée avec l\'étape 2)', () => {
  const c = nouvelleCollection();
  c.medailles = 12;
  c.histoire.etape = 1;
  const r = noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: false });
  assert.deepEqual(r.map((x) => x.etape), [1, 2]);
  assert.equal(c.histoire.etape, 3);
  // Club fermé : l'étape attend l'ouverture.
  const d = nouvelleCollection();
  d.histoire.etape = 2;
  assert.deepEqual(noter(d, { type: 'etat' }), []);
  d.medailles = 10;
  assert.equal(noter(d, { type: 'etat' }).length, 1);
});

test('étapes 4 et 5 : tournoi par équipe gagné, combat rapide par tombé ou 10 points', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 3;
  assert.deepEqual(noter(c, { type: 'tournoiEquipe', gagne: false }), []);
  assert.equal(noter(c, { type: 'tournoiEquipe', gagne: true }).length, 1);
  assert.deepEqual(noter(c, { type: 'rapide', tombe: false, ecart: 6 }), []);
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'fort' }), []);
  const r = noter(c, { type: 'rapide', tombe: false, ecart: -10 });
  assert.equal(r[0].boosters.length, 2);
  const d = nouvelleCollection();
  d.histoire.etape = 4;
  assert.equal(noter(d, { type: 'rapide', tombe: true, ecart: 0 }).length, 1);
});

test('étape 6 : un recrutement qui donne 3 lutteurs d\'une même nation', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 5;
  const t = deNation('turquie');
  c.club = [t[0].id, t[1].id, 'usa'];
  assert.deepEqual(noter(c, { type: 'etat' }), []); // déjà le cas avant : il faut recruter
  assert.deepEqual(noter(c, { type: 'recrutement' }), []);
  c.club.push(t[2].id);
  assert.equal(noter(c, { type: 'recrutement' }).length, 1);
});

test('étapes 7 à 11 : arène, fusion épique, ordinateur fort, en ligne, arène finie', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 6;
  assert.deepEqual(noter(c, { type: 'etat' }), []); // aucune nation battue
  c.arene = PAR_NATION; // une nation battue
  assert.equal(noter(c, { type: 'nationArene' }).length, 1);
  // Étape 8 : seulement une fusion qui atteint épique ou plus.
  const commune = LUTTEURS.find((l) => l.rarete === 'commune')!;
  c.exemplaires[commune.id] = 1;
  c.grades[commune.id] = 2; // rare
  assert.deepEqual(noter(c, { type: 'fusion', id: commune.id }), []);
  c.grades[commune.id] = 3; // épique
  assert.equal(noter(c, { type: 'fusion', id: commune.id }).length, 1);
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal' }), []);
  assert.equal(noter(c, { type: 'victoire', nation: 'usa', niveau: 'fort' })[0].boosters.length, 3);
  assert.equal(noter(c, { type: 'enLigne' }).length, 1);
  assert.deepEqual(noter(c, { type: 'nationArene' }), []); // arène pas finie
  c.arene = nationsArene().length * PAR_NATION;
  assert.equal(noter(c, { type: 'nationArene' }).length, 1);
  assert.equal(c.histoire.etape, 11);
});

test('étapes 7 et 11 : validées dès le déblocage si l\'arène est déjà avancée', () => {
  // Une nation déjà battue : l'étape 7 se valide dès que l'étape 6 est validée.
  const c = nouvelleCollection();
  c.histoire.etape = 5;
  c.arene = PAR_NATION + 2;
  const t = deNation('turquie');
  c.club = [t[0].id, t[1].id, t[2].id];
  assert.deepEqual(noter(c, { type: 'recrutement' }).map((x) => x.etape), [5, 6]);
  assert.equal(c.histoire.etape, 7);
  // Arène finie : l'étape 11 se valide dès que l'étape 10 est validée.
  const d = nouvelleCollection();
  d.histoire.etape = 9;
  d.arene = nationsArene().length * PAR_NATION;
  assert.deepEqual(noter(d, { type: 'enLigne' }).map((x) => x.etape), [9, 10]);
  assert.equal(d.histoire.etape, 11);
});

test('étape 12 : tournoi sans défaite = une légendaire que le joueur n\'a pas', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 11;
  assert.deepEqual(noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: false }), []);
  const legendaires = LUTTEURS.filter((l) => l.rarete === 'legendaire');
  for (const l of legendaires.slice(1)) c.exemplaires[l.id] = 1;
  const r = noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: true });
  assert.deepEqual(r[0].boosters[0].cartes, [legendaires[0].id]);
  assert.deepEqual(r[0].boosters[0].nouvelles, [legendaires[0].id]);
  assert.ok(histoireFinie(c));
  assert.deepEqual(noter(c, { type: 'enLigne' }), []);
  // Toutes possédées : une légendaire quand même (un double).
  const d = nouvelleCollection();
  d.histoire.etape = 11;
  for (const l of legendaires) d.exemplaires[l.id] = 1;
  const r2 = noter(d, { type: 'tournoiIndividuel', place: 1, invaincu: true });
  assert.equal(r2[0].boosters[0].cartes.length, 1);
  assert.equal(d.exemplaires[r2[0].boosters[0].cartes[0]], 2);
});

test('histoire gardée dans la sauvegarde', () => {
  const c = nouvelleCollection();
  c.histoire = { etape: 4, nations: [] };
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).histoire.etape, 4);
  assert.equal(depuisSauvegarde({}).histoire.etape, 0);
  assert.equal(depuisSauvegarde({ histoire: { etape: 99 } }).histoire.etape, 12);
});
