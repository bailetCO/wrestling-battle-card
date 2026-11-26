// Pack graphique V1 : chaque lutteur a ses 5 cartes, son portrait et la zone de ses statistiques
// imprimées ; Cocoach reste à part ; aucun fichier déclaré ne manque ; noms = noms imprimés.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ID_LUTTEUR_TEST, ID_RIVAL, LUTTEURS, NATIONS } from '../src/moteur/config';
import { imageCarte, imageEmbleme, imagePortrait, imagePresentationCocoach, infosPack } from '../src/page/illustrations';
import PACK from '../src/page/illustrations/pack-v1.json';

const NIVEAUX = ['commune', 'rare', 'epique', 'legendaire', 'champion'] as const;
const existe = (url: string) => fs.existsSync(path.join('public', url.replace(/^.*?illustrations\//, 'illustrations/')));

test('les 120 lutteurs ont 5 cartes (grande et miniature), un portrait et une zone de statistiques', () => {
  assert.equal(LUTTEURS.length, 120);
  for (const l of LUTTEURS) {
    for (const n of NIVEAUX) {
      const g = imageCarte(l.id, n, 'grande');
      const m = imageCarte(l.id, n, 'mini');
      assert.ok(g && m, `${l.id} ${n}`);
      assert.ok(existe(g.url) && existe(m.url), `fichier manquant : ${g.url}`);
      assert.ok(g.zone && g.zone.y > 40 && g.zone.y < 95, `zone douteuse : ${l.id} ${n}`); // cartes coupées en bas : bande limitée au bord (voir bandeStats)
    }
    const p = imagePortrait(l.id);
    assert.ok(p && existe(p), `portrait : ${l.id}`);
  }
});

test('le nom du jeu est le nom imprimé sur la carte, et chaque carte du pack sert une seule fois', () => {
  const vus = new Set<string>();
  for (const l of LUTTEURS) {
    const i = infosPack(l.id)!;
    assert.equal(l.nom, i.nom, l.id);
    assert.ok(!vus.has(i.pack), `carte utilisée deux fois : ${i.pack}`);
    vus.add(i.pack);
  }
});

test('Cocoach : 5 cartes et une présentation, hors de la collection classique', () => {
  for (const id of [ID_RIVAL, ID_LUTTEUR_TEST]) for (const n of NIVEAUX) assert.ok(imageCarte(id, n, 'grande'), `${id} ${n}`);
  assert.ok(imagePresentationCocoach());
  assert.ok(!LUTTEURS.some((l) => l.id === ID_RIVAL || l.id === ID_LUTTEUR_TEST));
  assert.ok(!Object.keys(PACK.lutteurs).some((id) => id.includes('cocoach')));
});

test('un emblème pour chaque nation du jeu', () => {
  for (const n of NATIONS) {
    const u = imageEmbleme(n.id);
    assert.ok(u && existe(u), n.id);
  }
});

test('lutteur sans illustration (Champion du Monde spécial) : pas d\'image, le dessin d\'origine reste', () => {
  assert.equal(imageCarte('champion-usa', 'champion', 'grande'), null);
  assert.equal(imagePortrait('champion-usa'), null);
});
