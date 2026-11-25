// Les 120 cartes : nations, raretés, cartes de départ, légendaires et fragments.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, NATIONS, REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import {
  POOL_DEPART, cartesDeDepart, debloquerLegendaire, depuisSauvegarde, enFragment, legendaireDe, nouvelleCollection, ouvrirBooster,
} from '../src/page/collection';

test('12 nations de 10 lutteurs : 4 communes, 3 rares, 2 épiques, 1 légendaire', () => {
  assert.equal(NATIONS.length, 12);
  assert.equal(LUTTEURS.length, 120);
  assert.equal(new Set(LUTTEURS.map((l) => l.id)).size, 120);
  assert.equal(new Set(LUTTEURS.map((l) => l.nom)).size, 120);
  for (const n of NATIONS) {
    const l = LUTTEURS.filter((x) => x.nation === n.id);
    const compte = (r: string) => l.filter((x) => x.rarete === r).length;
    assert.deepEqual([compte('commune'), compte('rare'), compte('epique'), compte('legendaire')], [4, 3, 2, 1], n.id);
    // Cartes de départ : les 4 communes et 1 rare.
    assert.equal(l.filter((x) => x.depart).length, 5);
    assert.ok(l.filter((x) => x.depart).every((x) => x.rarete === 'commune' || x.rarete === 'rare'));
    // 3 styles par nation.
    assert.equal(new Set(l.map((x) => x.style)).size, 3, n.id);
    for (const x of l) assert.equal(x.actions.length, 4);
  }
  assert.deepEqual([...NATIONS].map((n) => n.ordreArene).sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1));
});

test('départ : 20 cartes différentes tirées parmi les cartes débloquées dès le départ', () => {
  const c = nouvelleCollection();
  const ids = Object.keys(c.exemplaires).filter((id) => c.exemplaires[id] > 0);
  assert.equal(ids.length, REGLES.collection.cartesDeDepart);
  assert.ok(ids.every((id) => POOL_DEPART().includes(id)));
  assert.equal(cartesDeDepart(creerHasard(1)).length, 20);
});

test('ancienne sauvegarde : complétée jusqu\'à 20 cartes différentes, une seule fois', () => {
  const r = depuisSauvegarde({ version: 2, coach: 'Coco', exemplaires: { usa: 3, europe: 1 } });
  const ids = Object.keys(r.exemplaires).filter((id) => r.exemplaires[id] > 0);
  assert.equal(ids.length, 20);
  assert.equal(r.exemplaires.usa, 3);
  const encore = depuisSauvegarde(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(encore.exemplaires, r.exemplaires);
});

test('boosters : légendaires très rares (environ 1 carte sur 100)', () => {
  const c = nouvelleCollection();
  const h = creerHasard(9);
  let leg = 0, total = 0;
  for (let i = 0; i < 4000; i++) for (const id of ouvrirBooster(c, h).cartes) { total++; if (LUTTEURS.find((l) => l.id === id)!.rarete === 'legendaire') leg++; }
  assert.ok(leg / total > 0.003 && leg / total < 0.02, `${leg}/${total}`);
});

test('fragments : un double devient un fragment ; 10 fragments débloquent la légendaire', () => {
  const c = nouvelleCollection();
  const nation = NATIONS[0].id;
  const commune = LUTTEURS.find((l) => l.nation === nation && l.rarete === 'commune')!;
  c.exemplaires = { [commune.id]: 1 };
  assert.ok(enFragment(c, commune.id)); // dernier exemplaire : refusé
  c.exemplaires[commune.id] = 11;
  for (let i = 0; i < 10; i++) assert.equal(enFragment(c, commune.id), null);
  assert.equal(c.exemplaires[commune.id], 1);
  assert.equal(c.fragments[nation], 10);
  const leg = legendaireDe(nation)!;
  assert.equal(debloquerLegendaire(c, nation), null);
  assert.equal(c.exemplaires[leg.id], 1);
  assert.equal(c.fragments[nation], 0);
  assert.ok(debloquerLegendaire(c, nation));
});
