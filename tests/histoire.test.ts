// Mode histoire : 18 étapes dans l'ordre, validées seulement une fois débloquées.

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

test('histoire : 18 étapes, récompenses du PDF puis des étapes 13 à 18', () => {
  assert.equal(ETAPES.length, 18);
  assert.deepEqual(REGLES.histoire.boosters, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 3, 2, 3, 3]);
});

test('étape 1 : gagner un combat en Carrière (les autres victoires ne comptent pas)', () => {
  const c = nouvelleCollection();
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal' }), []);
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'iran', niveau: null }), []);
  assert.equal(progression(c), null);
  const r = noter(c, { type: 'victoire', nation: 'japon', niveau: 'normal', carriere: true });
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
  noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal', carriere: true });
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

test('étape 6 : 3 lutteurs d\'une même nation dans Mon Club (déjà le cas = validée dès le déblocage)', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 5;
  const t = deNation('turquie');
  c.club = [t[0].id, t[1].id, 'usa'];
  assert.deepEqual(noter(c, { type: 'recrutement' }), []);
  c.club.push(t[2].id);
  assert.equal(noter(c, { type: 'recrutement' }).length, 1);
  // Déjà 3 lutteurs d'une même nation : l'étape 6 suit aussitôt la validation de l'étape 5.
  const d = nouvelleCollection();
  d.histoire.etape = 4;
  d.club = [t[0].id, t[1].id, t[2].id];
  assert.deepEqual(noter(d, { type: 'rapide', tombe: true, ecart: 0 }).map((x) => x.etape), [4, 5]);
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

test('étape 12 : tournoi sans défaite = 3 boosters ; la saison ne s\'ouvre plus avec l\'histoire', async () => {
  const { saisonOuverte } = await import('../src/page/saison');
  const c = nouvelleCollection();
  c.histoire.etape = 11;
  assert.deepEqual(noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: false }), []);
  const r = noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: true });
  assert.equal(r[0].boosters.length, 3);
  assert.ok(!saisonOuverte(c));
  assert.ok(!histoireFinie(c));
});

const fin = (ev: Partial<Extract<EvenementHistoire, { type: 'combat' }>>): EvenementHistoire =>
  ({ type: 'combat', gagne: false, combos: 0, enchainement: false, infini: false, auto: false, ...ev });

test('étapes 13 à 15 : combos, Enchaînement, durée infinie (pas en combat auto)', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 12;
  assert.deepEqual(noter(c, fin({ combos: 1 })), []);
  assert.deepEqual(noter(c, fin({ combos: 3, auto: true })), []);
  assert.equal(noter(c, fin({ combos: 2 })).length, 1); // même sans gagner
  assert.deepEqual(noter(c, fin({ enchainement: true })), []); // il faut gagner
  assert.equal(noter(c, fin({ gagne: true, enchainement: true })).length, 1);
  assert.deepEqual(noter(c, fin({ gagne: true })), []);
  const r = noter(c, fin({ gagne: true, infini: true }));
  assert.equal(r.length, 1);
  assert.equal(r[0].boosters.length, 3);
  assert.ok(!histoireFinie(c));
});

test('étapes 16 à 18 : battre Cocoach, puis Légendaire, puis Champion du Monde (+ légendaire)', () => {
  const c = nouvelleCollection();
  c.histoire.etape = 15;
  assert.deepEqual(noter(c, { type: 'rival', grade: 1, auto: true }), []);
  assert.equal(noter(c, { type: 'rival', grade: 1, auto: false }).length, 1);
  assert.deepEqual(noter(c, { type: 'rival', grade: 2, auto: false }), []);
  assert.equal(noter(c, { type: 'rival', grade: 3, auto: false }).length, 1);
  assert.deepEqual(noter(c, { type: 'rival', grade: 3, auto: false }), []);
  const legendaires = LUTTEURS.filter((l) => l.rarete === 'legendaire');
  for (const l of legendaires.slice(1)) c.exemplaires[l.id] = 1;
  const r = noter(c, { type: 'rival', grade: 4, auto: false });
  assert.equal(r[0].boosters.length, 5);
  assert.deepEqual(r[0].boosters[3].cartes, [legendaires[0].id]);
  assert.deepEqual(r[0].boosters[4].cartes, ['darius']); // la carte secrète de Darius (27/11/2026)
  assert.ok(histoireFinie(c));
});

test('ancienne sauvegarde (histoire finie à 12 étapes) : la scène de la saison est gardée, les étapes 13 à 15 s\'ouvrent', () => {
  const d = depuisSauvegarde({ histoire: { etape: 12, nations: [] }, scenesVues: ['h11', 'h12', 's0'] });
  assert.equal(d.histoire.etape, 12);
  assert.ok(!histoireFinie(d));
  assert.deepEqual(d.scenesVues, ['h11', 'hfin', 's0', 'histoire15']);
  // Une sauvegarde déjà convertie ne l'est pas deux fois (h12 = scène de l'étape 13).
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify({ ...d, scenesVues: [...d.scenesVues, 'h12'] }))).scenesVues, ['h11', 'hfin', 's0', 'histoire15', 'h12']);
});

test('histoire gardée dans la sauvegarde', () => {
  const c = nouvelleCollection();
  c.histoire = { etape: 4, nations: [] };
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).histoire.etape, 4);
  assert.equal(depuisSauvegarde({}).histoire.etape, 0);
  assert.equal(depuisSauvegarde({ histoire: { etape: 99 } }).histoire.etape, 18);
});
