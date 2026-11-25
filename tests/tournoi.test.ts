// Tournois : tableau à 6 avec repêchage croisé, tournoi par équipe, inscriptions et gains.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES, trouverLutteur } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { nouvelleCollection } from '../src/page/collection';
import {
  ORDRE_MATCHS, avancer, creerCompetition, creerTournoiEquipe, enregistrer, enregistrerDuel, equipeFinie,
  finie, gagnerCombatTournoi, payerInscription, places, prochainDuel, prochainMatch, recompenserTournoi,
  type Competition,
} from '../src/page/tournoi';

const T = REGLES.tournoi;

// Joue toute la compétition : le joueur (indice 0) gagne ou perd selon `gagne(cle)`.
function jouerTout(c: Competition, gagne: (cle: string) => boolean) {
  const combats: string[] = [];
  for (let k = avancer(c, (i) => trouverLutteur(c.lutteurs[i]), 'normal'); k; k = avancer(c, (i) => trouverLutteur(c.lutteurs[i]), 'normal')) {
    const m = c.matchs[k];
    combats.push(k);
    const moi = 0, lui = m.a === 0 ? m.b! : m.a!;
    enregistrer(c, k, gagne(k) ? moi : lui, 'test');
  }
  return combats;
}

test('compétition : 6 lutteurs différents, deux tableaux de 3', () => {
  const c = creerCompetition('usa', 7);
  assert.equal(new Set(c.lutteurs).size, 6);
  assert.equal(c.lutteurs[0], 'usa');
  assert.deepEqual([...c.tableaux[0], ...c.tableaux[1]].sort(), [0, 1, 2, 3, 4, 5]);
  assert.equal(prochainMatch(c), 'QA');
});

test('compétition : repêchage croisé, un seul 3e, places 1 2 3 4 5 5', () => {
  for (let g = 1; g <= 40; g++) {
    const c = creerCompetition('europe', g);
    const combats = jouerTout(c, (k) => (g + k.length + k.charCodeAt(0)) % 3 !== 0);
    assert.ok(finie(c));
    // Un lutteur fait de 2 à 4 combats.
    assert.ok(combats.length >= 2 && combats.length <= 4, `graine ${g} : ${combats.length} combats`);
    const p = places(c);
    assert.deepEqual([...p.values()].sort(), [1, 2, 3, 4, 5, 5]);
    // Le repêchage croise les tableaux : jamais deux lutteurs du même tableau en R1 ou R2.
    const tableau = (i: number) => (c.tableaux[0].includes(i) ? 0 : 1);
    for (const k of ['R1', 'R2'] as const) assert.notEqual(tableau(c.matchs[k].a!), tableau(c.matchs[k].b!));
    // Chaque lutteur combat au plus 4 fois, au moins 2.
    for (let i = 0; i < 6; i++) {
      const n = ORDRE_MATCHS.filter((k) => c.matchs[k].a === i || c.matchs[k].b === i).length;
      assert.ok(n >= 2 && n <= 4);
    }
  }
});

test('compétition : vainqueur = 10 médailles, 15 $ et un booster rare, en plus des médailles de combat', () => {
  const col = nouvelleCollection();
  col.dollars = 5;
  assert.equal(payerInscription(col, 'competition'), null);
  assert.equal(col.dollars, 0);
  assert.ok(payerInscription(col, 'competition')); // plus assez de $
  const c = creerCompetition('europe', 3);
  const combats = jouerTout(c, () => true);
  for (const _ of combats) gagnerCombatTournoi(col, c);
  assert.equal(places(c).get(0), 1);
  const r = recompenserTournoi(col, c, creerHasard(1));
  assert.equal(r[0].type, 'rare');
  assert.equal(r[0].medailles, T.competition.medailles[1] + combats.length);
  assert.equal(col.medailles, T.competition.medailles[1] + combats.length);
  // 15 $ + 10 $ par palier de 5 médailles franchi.
  const paliers = Math.floor(col.medailles / REGLES.economie.medaillesParPalier) * REGLES.economie.dollarsParPalier;
  assert.equal(col.dollars, T.competition.dollars[1] + paliers);
  assert.equal(recompenserTournoi(col, c, creerHasard(2)), r); // une seule fois
});

test('compétition : 2e = 6 médailles et 9 $, 3e = 3 médailles et 5 $, sans booster', () => {
  const vus = new Set<number>();
  for (let g = 1; g < 200 && vus.size < 2; g++) {
    const c = creerCompetition('europe', g);
    // Le joueur gagne tout sauf la finale (2e), ou perd sa 1/2 finale puis gagne le repêchage (3e).
    const mode = g % 2;
    jouerTout(c, (k) => (mode === 0 ? k !== 'F' : !(k === 'SA' || k === 'SB')));
    const place = places(c).get(0)!;
    if (place !== 2 && place !== 3) continue;
    vus.add(place);
    const col = nouvelleCollection();
    const r = recompenserTournoi(col, c, creerHasard(1));
    assert.equal(r[0].type, 'recompense');
    assert.equal(col.medailles, T.competition.medailles[place]);
    const palier = place === 2 ? REGLES.economie.dollarsParPalier : 0; // 6 médailles : un palier franchi
    assert.equal(r[0].dollars, T.competition.dollars[place] + palier);
  }
  assert.deepEqual([...vus].sort(), [2, 3]);
});

test('tournoi par équipe : 5 duels, fini à 3 victoires ; 10 médailles, 30 $ et booster rare au vainqueur', () => {
  const t = creerTournoiEquipe(['usa', 'europe', 'japon', 'russie', 'afrique'], 5);
  assert.equal(t.leurs.length, 5);
  enregistrerDuel(t, 0, true, '');
  enregistrerDuel(t, 1, false, '');
  enregistrerDuel(t, 2, true, '');
  assert.equal(equipeFinie(t), false);
  enregistrerDuel(t, 3, true, '');
  assert.equal(equipeFinie(t), true);
  assert.equal(prochainDuel(t), null);
  const col = nouvelleCollection();
  const r = recompenserTournoi(col, t, creerHasard(1));
  assert.equal(r[0].type, 'rare');
  assert.equal(col.medailles, T.equipe.medailles);
  const perdu = creerTournoiEquipe(['usa', 'europe', 'japon', 'russie', 'afrique'], 6);
  for (let i = 0; i < 3; i++) enregistrerDuel(perdu, i, false, '');
  const col2 = nouvelleCollection();
  assert.deepEqual(recompenserTournoi(col2, perdu, creerHasard(1)), []);
  assert.equal(col2.medailles, 0);
});

test('bonus de nation : 3 lutteurs +5 %, 4 +7 %, 5 +10 %, pour toute l\'équipe', async () => {
  const { bonusNation, avecBonus, LUTTEURS: L } = await import('../src/moteur/config');
  const de = (n: string) => L.filter((l) => l.nation === n).map((l) => l.id);
  const tur = de('turquie'), iran = de('iran'), geo = de('georgie');
  assert.equal(bonusNation([tur[0], tur[1], iran[0], iran[1], geo[0]]).bonus, 0);
  assert.equal(bonusNation([tur[0], tur[1], tur[2], iran[0], geo[0]]).bonus, 0.05);
  assert.equal(bonusNation([tur[0], tur[1], tur[2], tur[3], geo[0]]).bonus, 0.07);
  const b = bonusNation(tur.slice(0, 5));
  assert.deepEqual([b.nation, b.nombre, b.bonus], ['turquie', 5, 0.1]);
  const d = L.find((l) => l.id === geo[0])!;
  assert.equal(avecBonus(d, 0.1).force, Math.round(d.force * 1.1));
  assert.equal(avecBonus(d, 0), d);
});

test('tournoi par équipe : le club adverse est souvent une sélection nationale (bonus de nation)', async () => {
  const { bonusNation } = await import('../src/moteur/config');
  let nationales = 0;
  for (let g = 1; g <= 200; g++) {
    const t = creerTournoiEquipe(['usa', 'europe', 'japon', 'russie', 'afrique'], g);
    assert.equal(new Set(t.leurs).size, 5);
    if (t.nomAdverse.startsWith('Sélection')) { nationales++; assert.ok(bonusNation(t.leurs).bonus > 0); }
  }
  assert.ok(nationales > 60 && nationales < 140, `${nationales}`);
});
