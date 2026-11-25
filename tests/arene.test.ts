// Arène par nation : ordre, adversaires, progression, récompenses, boss.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { PAR_NATION, adversairesDe, areneTerminee, etapeArene, nationsArene, victoireArene, victoireBossRejoue } from '../src/page/arene';

test('arène : l\'Afrique d\'abord, 5 adversaires par nation, la légendaire en boss', () => {
  const ordre = nationsArene();
  assert.equal(ordre[0].id, 'afrique');
  assert.equal(ordre.length, 12);
  for (const n of ordre) {
    const ids = adversairesDe(n.id);
    assert.equal(ids.length, PAR_NATION);
    assert.equal(new Set(ids).size, PAR_NATION);
    const r = ids.map((id) => LUTTEURS.find((l) => l.id === id)!.rarete);
    assert.deepEqual(r, ['commune', 'commune', 'rare', 'epique', 'legendaire']);
  }
});

test('arène : niveaux facile, facile, normal, normal, fort ; une défaite ne fait pas reculer', () => {
  const c = nouvelleCollection();
  const niveaux = [];
  for (let i = 0; i < PAR_NATION; i++) { niveaux.push(etapeArene(c).niveau); c.arene++; }
  assert.deepEqual(niveaux, REGLES.arene.niveaux);
  assert.equal(etapeArene(c).nation!.id, nationsArene()[1].id);
  assert.equal(etapeArene(c).rang, 0);
});

test('arène : +1 médaille par victoire ; nation battue : 2 ou 3 boosters et 3 médailles', () => {
  const c = nouvelleCollection();
  const h = creerHasard(4);
  for (let i = 0; i < PAR_NATION - 1; i++) {
    const r = victoireArene(c, h);
    assert.equal(r.nationBattue, null);
    assert.equal(r.boosters.length, 1);
    assert.equal(r.boosters[0].type, 'recompense');
  }
  assert.equal(c.medailles, 4);
  const r = victoireArene(c, h);
  assert.equal(r.nationBattue?.id, 'afrique');
  const avecCartes = r.boosters.filter((b) => b.type !== 'recompense');
  assert.ok(avecCartes.length === 2 || avecCartes.length === 3);
  assert.equal(c.medailles, 4 + 1 + REGLES.arene.medaillesParNation);
  assert.equal(etapeArene(c).nation!.id, nationsArene()[1].id);
});

test('arène : la carte du boss tombe environ 1 fois sur 3 ; le boss se réaffronte', () => {
  const h = creerHasard(11);
  let cartes = 0;
  for (let i = 0; i < 900; i++) {
    const c = nouvelleCollection();
    c.arene = PAR_NATION - 1;
    if (victoireArene(c, h).carteBoss) cartes++;
  }
  assert.ok(Math.abs(cartes / 900 - 1 / 3) < 0.05, `${cartes}/900`);
  const c = nouvelleCollection();
  const boss = adversairesDe('afrique')[PAR_NATION - 1];
  let n = 0;
  for (let i = 0; i < 30; i++) if (victoireBossRejoue(c, 'afrique', h).carteBoss) n++;
  assert.equal(c.exemplaires[boss] ?? 0, n);
  assert.equal(c.medailles, 30);
});

test('arène : terminée après toutes les nations ; progression gardée dans la sauvegarde', () => {
  const c = nouvelleCollection();
  c.arene = 12 * PAR_NATION;
  assert.ok(areneTerminee(c));
  assert.equal(etapeArene(c).nation, null);
  assert.equal(etapeArene(c).nationsBattues.length, 12);
  c.arene = 7;
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).arene, 7);
});
