// Saison classée (28/11/2026) : divisions, défaite en ligne, nouvelle saison, récompenses, cadres.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES, trouverLutteur } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import {
  cloturerMois, gagnerPoints, gainDivision, majPeriode, moisUTC, numeroSaison, perdreEnLigne, progresser, recompenseMois, texteCadre,
} from '../src/page/classement';

const JOUR = 86_400_000;
const t0 = Date.UTC(2026, 10, 27, 12);

test('divisions : la barre monte avec les victoires, division suivante à 100', () => {
  const c = nouvelleCollection();
  assert.equal(gainDivision({ niveau: 'facile' }), 10);
  assert.equal(gainDivision({ niveau: 'fort', tombe: true }), 30);
  assert.equal(gainDivision({ enLigne: true }), 40);
  assert.equal(gainDivision({ tournoiGagne: true }), 40);
  gagnerPoints(c, { enLigne: true }, t0);
  gagnerPoints(c, { enLigne: true }, t0);
  assert.deepEqual([c.classement.division, c.classement.progression], [0, 80]);
  assert.equal(progresser(c, 40).monte, true);
  assert.deepEqual([c.classement.division, c.classement.progression], [1, 20]); // Argent
});

test('défaite en ligne : −15, jamais sous le début de la division', () => {
  const c = nouvelleCollection();
  c.classement.division = 2;
  c.classement.progression = 20;
  assert.equal(perdreEnLigne(c, t0), 15);
  assert.equal(perdreEnLigne(c, t0), 5);
  assert.deepEqual([c.classement.division, c.classement.progression], [2, 0]);
});

test('Maître : la barre reste pleine', () => {
  const c = nouvelleCollection();
  c.classement.division = 5;
  progresser(c, 500);
  assert.deepEqual([c.classement.division, c.classement.progression], [5, 100]);
});

test('plafond du jour atteint : ni points ni division', () => {
  const c = nouvelleCollection();
  c.classement.mois = moisUTC(t0);
  c.classement.jour = Math.floor(t0 / JOUR);
  c.classement.pointsJour = REGLES.classement.plafondJour;
  assert.equal(gagnerPoints(c, { enLigne: true }, t0), 0);
  assert.equal(c.classement.progression, 0);
});

test('nouvelle saison : on garde sa division, la barre repart de zéro', () => {
  const c = nouvelleCollection();
  gagnerPoints(c, { niveau: 'fort' }, t0);
  c.classement.division = 3;
  c.classement.progression = 70;
  majPeriode(c, Date.UTC(2026, 11, 1, 1));
  assert.deepEqual([c.classement.division, c.classement.progression], [3, 0]);
  assert.deepEqual(c.classement.enAttente, [{ mois: '2026-11', points: 4, division: 3 }]);
});

test('récompenses de fin de saison selon la division, plus le Top 10', () => {
  const c = nouvelleCollection();
  const types = (b: { type: string }[]) => b.map((x) => x.type).join(',');
  assert.equal(types(recompenseMois(c, 0, false)), 'classique');
  assert.equal(types(recompenseMois(c, 1, false)), 'rare');
  assert.equal(types(recompenseMois(c, 3, true)), 'rare,rare,rare,rare');
  const maitre = recompenseMois(c, 5, false);
  assert.equal(types(maitre), 'rare,rare,rare,recompense');
  assert.equal(trouverLutteur(maitre[3].cartes[0]).rarete, 'legendaire');
});

test('fin de saison : badge, cadre de saison et titre', () => {
  const c = nouvelleCollection();
  c.classement.enAttente = [{ mois: '2026-11', points: 130, division: 2 }];
  const r = cloturerMois(c, '2026-11', false);
  assert.match(r!.titre, /Saison 1 \(novembre 2026\) : division Or/);
  assert.deepEqual(c.classement.badge, { palier: 'or', top: false, mois: '2026-11' });
  assert.deepEqual(c.classement.cadres, ['2026-11:or']);
  assert.equal(texteCadre('2026-11:or'), 'Saison 1 · Or');
  assert.equal(numeroSaison('2027-02'), 4);
  assert.equal(cloturerMois(c, '2026-11', false), null); // une seule fois
});

test('ancienne sauvegarde : division tirée des points du mois, cadre posé gardé', () => {
  const c = nouvelleCollection();
  const brut = JSON.parse(JSON.stringify(c));
  brut.classement = { mois: '2026-11', points: 150, jour: 0, pointsJour: 0, badge: null, enAttente: [{ mois: '2026-10', points: 320 }] };
  const d = depuisSauvegarde(brut);
  assert.equal(d.classement.division, 1); // 150 points : Argent
  assert.equal(d.classement.enAttente[0].division, -1);
  assert.equal(cloturerMois(d, '2026-10', false)!.cadre, '2026-10:or'); // 320 points : Or
  d.classement.cadreCartes.usa = '2026-10:or';
  d.classement.cadreCartes.japon = '2099-01:or'; // cadre jamais gagné : refusé
  const e = depuisSauvegarde(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(e.classement.cadreCartes, { usa: '2026-10:or' });
});
