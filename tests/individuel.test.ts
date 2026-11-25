// Tournoi individuel à double tableau : tirage, exemptions, tableau des perdants, 3e place, gains.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES, trouverLutteur } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { nouvelleCollection } from '../src/page/collection';
import {
  PERSONNE, avancerI, creerIndividuel, enregistrerI, exemptes, exemption, finieI, gagnerCombatTournoi,
  joueurInvaincu, niveauMatchI, nombreParticipants, payerInscription, tailleTableau, placesI, pretI, recompenserTournoi, type Individuel,
} from '../src/page/tournoi';

const I = REGLES.tournoi.individuel;
const defs = (t: Individuel) => (i: number) => trouverLutteur(t.lutteurs[i]);

// Joue tout le tournoi ; le joueur gagne ou perd selon `gagne(nom du combat, n° du combat du joueur)`.
function jouerTout(t: Individuel, gagne: (nom: string, n: number) => boolean) {
  const noms: string[] = [];
  for (let k = avancerI(t, defs(t), 'facile'); k !== null; k = avancerI(t, defs(t), 'facile')) {
    const m = t.matchs[k];
    const lui = m.a === 0 ? m.b! : m.a!;
    enregistrerI(t, k, gagne(m.nom, noms.length) ? 0 : lui, 'test');
    noms.push(m.nom);
  }
  return noms;
}

// Toutes les défaites de chaque lutteur, et ses combats réels.
function bilan(t: Individuel) {
  const defaites = new Map<number, string[]>();
  for (const m of t.matchs) {
    if (exemption(m) || m.vainqueur === null) continue;
    const perdant = m.vainqueur === m.a ? m.b! : m.a!;
    defaites.set(perdant, [...(defaites.get(perdant) ?? []), m.tableau]);
  }
  return defaites;
}

test('individuel : on complète à 6 au minimum, 15 au maximum', () => {
  assert.equal(nombreParticipants(2), 6);
  assert.equal(nombreParticipants(4), 6);
  assert.equal(nombreParticipants(9), 9);
  assert.equal(nombreParticipants(40), 15);
  const t = creerIndividuel('usa', 3, 1);
  assert.equal(t.lutteurs.length, 6);
  assert.equal(t.lutteurs[0], 'usa');
  assert.equal(new Set(t.lutteurs).size, 6);
});

test('individuel : exemptions = places vides du premier tour, jamais deux places vides face à face', () => {
  for (let n = 6; n <= 15; n++) {
    const t = creerIndividuel('europe', n, n);
    const S = n <= 8 ? 8 : 16;
    assert.equal(exemptes(t).length, S - n, `${n} lutteurs`);
    for (const m of t.matchs.filter((x) => x.tableau === 'principal' && x.tour === 1)) assert.ok(m.sa !== null);
  }
});

test('individuel : de 6 à 15 lutteurs, tableau complet, double élimination et 3e place', () => {
  for (let n = 6; n <= 15; n++) {
    for (let g = 1; g <= 12; g++) {
      const t = creerIndividuel('europe', n, g * 100 + n);
      jouerTout(t, (_, k) => (g + k) % 3 !== 0);
      assert.ok(finieI(t), `${n} lutteurs, graine ${g}`);
      assert.ok(t.matchs.every((m) => m.vainqueur !== null));
      const p = placesI(t);
      assert.equal(p.size, n, `${n} lutteurs : tout le monde est classé`);
      const v = [...p.values()].sort((a, b) => a - b);
      assert.deepEqual(v.slice(0, 5), [1, 2, 3, 4, 5]);
      const nb = (pl: number) => v.filter((x) => x === pl).length;
      assert.equal(nb(1) + nb(2) + nb(3), 3);
      const M = t.matchs;
      const finale = M[M.length - 1], petite = M[M.length - 2], q2 = M[M.length - 3], q1 = M[M.length - 4];
      const demies = M.filter((m) => m.nom === '1/2 finale');
      // La finale oppose les deux vainqueurs des 1/2 finales.
      assert.deepEqual([finale.a, finale.b].sort(), demies.map((d) => d.vainqueur).sort());
      // Les perdants des 1/2 finales ne s'affrontent pas : chacun joue la qualification pour la 3e place
      // contre le vainqueur du tableau des perdants du côté opposé.
      const perdu = (m: typeof q1) => (m.vainqueur === m.a ? m.b : m.a);
      assert.equal(q1.nom, 'Qualification pour la 3e place');
      assert.equal(q1.a, perdu(demies[0]));
      assert.equal(q2.a, perdu(demies[1]));
      const finA = M.filter((m) => m.nom.startsWith('Tableau des perdants A') || m.nom === 'Finale du tableau des perdants A').at(-1);
      const finB = M.filter((m) => m.nom.startsWith('Tableau des perdants B') || m.nom === 'Finale du tableau des perdants B').at(-1);
      if (finB) assert.equal(q1.b, finB.vainqueur);
      if (finA) assert.equal(q2.b, finA.vainqueur);
      assert.ok(!(perdu(demies[0]) === q2.a || perdu(demies[1]) === q1.a));
      // Les gagnants des deux qualifications jouent la petite finale.
      assert.deepEqual([petite.a, petite.b], [q1.vainqueur, q2.vainqueur]);
      // Un vainqueur du tableau des perdants ne fait pas mieux que 3e.
      for (const fp of [finA, finB]) if (fp && fp.vainqueur! >= 0) assert.ok(p.get(fp.vainqueur!)! >= 3);
      // Double élimination : avant les finales, personne ne perd deux fois et continue ; personne
      // n'est éliminé du tableau principal sans passer par les perdants (sauf les 1/2 finalistes).
      for (const [i, d] of bilan(t)) {
        const avantFinales = d.filter((x) => x !== 'finales');
        assert.ok(avantFinales.length <= 2, `lutteur ${i} : ${d}`);
      }
      // Chaque lutteur battu avant les 1/2 finales joue dans le tableau des perdants (sauf exemption).
      for (const m of M.filter((x) => x.tableau === 'principal' && x.nom !== '1/2 finale' && !exemption(x))) {
        const perdant = perdu(m)!;
        assert.ok(M.some((x) => x.tableau === 'perdants' && (x.a === perdant || x.b === perdant)), `${n} : ${perdant}`);
      }
    }
  }
});

test('individuel : un lutteur ne rencontre jamais une place vide en combat réel', () => {
  for (let n = 6; n <= 15; n++) {
    const t = creerIndividuel('japon', n, 7);
    jouerTout(t, () => false);
    for (const m of t.matchs) if (!exemption(m)) assert.ok(m.a! >= 0 && m.b! >= 0);
    assert.ok(!t.matchs.some(pretI));
    assert.ok(t.matchs.every((m) => m.vainqueur !== null && (m.vainqueur >= 0 || (m.a === PERSONNE && m.b === PERSONNE))));
  }
});

test('individuel : tout gagner = 1er sans défaite ; perdre la 1/2 puis tout gagner = 3e', () => {
  for (let n = 6; n <= 15; n++) {
    const t = creerIndividuel('europe', n, 5);
    jouerTout(t, () => true);
    assert.equal(placesI(t).get(0), 1);
    assert.ok(joueurInvaincu(t));
    const t2 = creerIndividuel('europe', n, 5);
    const noms = jouerTout(t2, (nom) => nom !== '1/2 finale');
    assert.equal(placesI(t2).get(0), 3, noms.join(', '));
    assert.ok(!joueurInvaincu(t2));
    assert.equal(noms.at(-1), 'Petite finale (3e place)');
  }
});

test('individuel : perdre au premier combat puis tout gagner mène à la qualification pour la 3e place, au mieux 3e', () => {
  let vus = 0;
  for (let g = 1; g <= 30; g++) {
    const t = creerIndividuel('europe', 12, g);
    const noms = jouerTout(t, (_, k) => k > 0);
    if (exemptes(t).includes(0)) continue; // exempté : son 1er combat est un 1/4
    vus++;
    assert.ok(noms.includes('Qualification pour la 3e place'), noms.join(', '));
    assert.equal(placesI(t).get(0), 3);
  }
  assert.ok(vus > 0);
});

test('individuel : gains 1er 10 médailles + 15 $ + booster rare ; 2e 6 et 9 $ ; 3e 3 et 5 $', () => {
  const col = nouvelleCollection();
  col.dollars = I.inscription;
  assert.equal(payerInscription(col, 'individuel'), null);
  assert.equal(col.dollars, 0);
  const t = creerIndividuel('europe', 8, 3);
  const noms = jouerTout(t, () => true);
  for (const _ of noms) gagnerCombatTournoi(col, t);
  const r = recompenserTournoi(col, t, creerHasard(1));
  assert.equal(r[0].type, 'rare');
  assert.equal(r[0].medailles, I.medailles[1] + noms.length);
  for (const [place, perdre] of [[2, (nom: string) => nom !== 'Finale'], [3, (nom: string) => nom !== '1/2 finale']] as const) {
    const c = nouvelleCollection();
    const t2 = creerIndividuel('europe', 8, 3);
    jouerTout(t2, perdre);
    assert.equal(placesI(t2).get(0), place);
    const r2 = recompenserTournoi(c, t2, creerHasard(1));
    assert.equal(c.medailles, I.medailles[place]);
    assert.equal(c.dollars, I.dollars[place] + Math.floor(c.medailles / REGLES.economie.medaillesParPalier) * REGLES.economie.dollarsParPalier);
    assert.ok(r2.every((b) => b.type !== 'rare'));
  }
});

test('individuel : grands tableaux de la saison (jusqu\'à 40), niveaux imposés', () => {
  for (const n of [6, 15, 16, 17, 30, 32, 33, 40]) {
    for (let g = 1; g <= 4; g++) {
      const t = creerIndividuel('europe', n, g * 37 + n, { minimum: 6, maximum: 40, nom: 'Test', niveaux: 'mixte', saison: 2 });
      assert.equal(t.lutteurs.length, n);
      assert.equal(t.nom, 'Test');
      assert.equal(t.saison, 2);
      jouerTout(t, (_, k) => (g + k) % 3 !== 0);
      assert.ok(finieI(t), `${n}`);
      const p = placesI(t);
      assert.equal(p.size, n);
      assert.deepEqual([...p.values()].sort((a, b) => a - b).slice(0, 5), [1, 2, 3, 4, 5]);
      for (const [i, d] of bilanDefaites(t)) assert.ok(d <= 2, `${n} : lutteur ${i} perd ${d} fois avant les finales`);
    }
  }
  const t = creerIndividuel('europe', 40, 9, { maximum: 40, niveaux: 'mixte' });
  const niv = new Set(t.matchs.map((_, k) => niveauMatchI(t, k, 'facile')));
  assert.deepEqual([...niv].sort(), ['fort', 'normal']);
  assert.equal(niveauMatchI(creerIndividuel('europe', 6, 1, { niveaux: 'fort' }), 0, 'facile'), 'fort');
  assert.equal(niveauMatchI(creerIndividuel('europe', 6, 1), 0, 'facile'), 'facile');
  assert.equal(tailleTableau(40), 64);
  assert.equal(tailleTableau(6), 8);
});

function bilanDefaites(t: Individuel) {
  const d = new Map<number, number>();
  for (const m of t.matchs) {
    if (exemption(m) || m.tableau === 'finales') continue;
    const perdant = m.vainqueur === m.a ? m.b! : m.a!;
    d.set(perdant, (d.get(perdant) ?? 0) + 1);
  }
  return d;
}
