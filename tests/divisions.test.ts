// Classements (28/11/2026, 2e version) : division en ligne du mois, palmarès à vie, fin de saison, cadres.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trouverLutteur } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import {
  cloturerMois, combatEnLigne, majPeriode, numeroSaison, progresser, recompenseMois, scoreEnLigne, scoreSaison, texteCadre, texteSaison, victoireFort,
} from '../src/page/classement';

const MIN = 60_000;
const t0 = Date.UTC(2026, 11, 3, 12); // 3 décembre 2026

test('division en ligne : victoire +25, barres de 100, 150, 200, 300 puis 400', () => {
  const c = nouvelleCollection();
  let t = t0;
  for (let k = 0; k < 4; k++) combatEnLigne(c, true, (t += 2 * MIN));
  assert.deepEqual([c.classement.division, c.classement.progression], [1, 0]); // Argent
  assert.equal(c.classement.enLigne, 4);
  assert.equal(c.classement.points, 100);
  for (let k = 0; k < 6; k++) combatEnLigne(c, true, (t += 2 * MIN));
  assert.equal(c.classement.division, 2); // Or après 150 de plus
  assert.equal(scoreEnLigne(5, 30), 100 + 150 + 200 + 300 + 400 + 30);
});

test('défaite en ligne : −15, jamais sous le début de la division ; les combats trop rapprochés ne comptent pas', () => {
  const c = nouvelleCollection();
  c.classement.mois = '2026-12';
  c.classement.division = 2;
  c.classement.progression = 20;
  assert.equal(combatEnLigne(c, false, t0).gain, -15);
  assert.equal(combatEnLigne(c, false, t0 + 30_000).gain, 0); // 30 secondes après : pas compté
  assert.equal(c.classement.enLigne, 1);
  assert.equal(combatEnLigne(c, false, t0 + 2 * MIN).gain, -5);
  assert.deepEqual([c.classement.division, c.classement.progression], [2, 0]);
  assert.equal(c.classement.points, 250);
});

test('Maître : plus de barre, les points continuent (pour classer les Maîtres)', () => {
  const c = nouvelleCollection();
  progresser(c, 1150 + 80);
  assert.deepEqual([c.classement.division, c.classement.progression], [5, 80]);
  assert.equal(c.classement.points, 1230);
});

test('nouvelle saison : tout le monde repart en Bronze ; récompense seulement si on a joué en ligne', () => {
  const c = nouvelleCollection();
  combatEnLigne(c, true, t0);
  c.classement.division = 3;
  majPeriode(c, Date.UTC(2027, 0, 1, 1));
  assert.deepEqual([c.classement.division, c.classement.progression, c.classement.points, c.classement.enLigne], [0, 0, 0, 0]);
  assert.deepEqual(c.classement.enAttente, [{ mois: '2026-12', points: 25, division: 3 }]);
  // Pas de combat en ligne en janvier : pas de récompense.
  majPeriode(c, Date.UTC(2027, 1, 1, 1));
  assert.equal(c.classement.enAttente.length, 1);
});

test('palmarès à vie : victoires contre l\'ordinateur fort (pas deux en 20 secondes) et saison sportive', () => {
  const c = nouvelleCollection();
  victoireFort(c, t0);
  victoireFort(c, t0 + 5_000);
  victoireFort(c, t0 + MIN);
  assert.equal(c.palmares.fort, 2);
  c.saison = { palier: 3, victoires: 0, numero: 3, terminees: 2 };
  assert.equal(scoreSaison(c), 23);
  assert.equal(texteSaison(23), '2 saisons · palier 4');
  assert.equal(texteSaison(0), 'palier 1');
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).palmares.fort, 2);
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

test('sauvegarde de novembre 2026 (anciens points) : division gardée et récompensée, puis Bronze en décembre', () => {
  const c = nouvelleCollection();
  const brut = JSON.parse(JSON.stringify(c));
  brut.classement = { mois: '2026-11', points: 150, jour: 0, pointsJour: 0, division: 4, progression: 60, badge: null, enAttente: [{ mois: '2026-10', points: 320 }] };
  const d = depuisSauvegarde(brut);
  assert.deepEqual([d.classement.division, d.classement.enLigne], [4, 1]);
  assert.equal(cloturerMois(d, '2026-10', false)!.cadre, '2026-10:or'); // 320 anciens points : Or
  majPeriode(d, Date.UTC(2026, 11, 1, 1));
  assert.deepEqual(d.classement.enAttente.map((e) => [e.mois, e.division]), [['2026-11', 4]]);
  assert.equal(d.classement.division, 0);
  d.classement.cadreCartes.usa = '2026-10:or';
  d.classement.cadreCartes.japon = '2099-01:or'; // cadre jamais gagné : refusé
  const e = depuisSauvegarde(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(e.classement.cadreCartes, { usa: '2026-10:or' });
});
