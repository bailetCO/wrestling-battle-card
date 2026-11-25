// Collection : cartes de départ, boosters, doublons, fusion, grades, sauvegarde, pseudo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, avecGrade, trouverLutteur } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import {
  cartesDeDepart, choisirDeck, consoler, depuisSauvegarde, fusionner, gradeDe, nbExemplaires,
  nouvelleCollection, ouvrirBooster, possede, prochaineFusion, recompenser, verifierPseudo,
} from '../src/page/collection';

test('départ : une carte par nation, la moins rare, en un exemplaire', () => {
  const c = nouvelleCollection();
  const d = cartesDeDepart();
  assert.equal(d.length, 5);
  assert.equal(new Set(d.map((id) => trouverLutteur(id).nation)).size, 5);
  for (const id of d) assert.equal(nbExemplaires(c, id), 1);
  assert.equal(c.coach, null);
});

test('boosters : 3 cartes (classique) ou 5 (rare), environ 1 rare sur 4, doublons possibles', () => {
  const h = creerHasard(5);
  let rares = 0, doublons = 0;
  for (let i = 0; i < 2000; i++) {
    const c = nouvelleCollection();
    const b = ouvrirBooster(c, h);
    assert.equal(b.cartes.length, b.type === 'rare' ? 5 : 3);
    if (b.type === 'rare') rares++;
    if (new Set(b.cartes).size < b.cartes.length || b.cartes.some((id) => cartesDeDepart().includes(id))) doublons++;
  }
  assert.ok(rares > 400 && rares < 600, `${rares} boosters rares sur 2000`);
  assert.ok(doublons > 0);
});

test('booster : les cartes s\'ajoutent aux exemplaires, les nouvelles sont signalées', () => {
  const c = nouvelleCollection();
  const avant = LUTTEURS.reduce((n, l) => n + nbExemplaires(c, l.id), 0);
  const b = ouvrirBooster(c, creerHasard(1));
  const apres = LUTTEURS.reduce((n, l) => n + nbExemplaires(c, l.id), 0);
  assert.equal(apres - avant, b.cartes.length);
  for (const id of b.nouvelles) assert.ok(possede(c, id));
});

test('victoire : 1 booster en arène, 2 en ligne', () => {
  const c = nouvelleCollection();
  assert.equal(recompenser(c, 'arene', creerHasard(1)).length, 1);
  assert.equal(recompenser(c, 'enLigne', creerHasard(2)).length, 2);
  assert.equal(c.victoires, 2);
});

test('consolation : un booster toutes les 2 défaites d\'affilée, remis à zéro par une victoire en arène', () => {
  const c = nouvelleCollection();
  assert.equal(consoler(c, creerHasard(1)), null);
  assert.ok(consoler(c, creerHasard(2)));
  assert.equal(consoler(c, creerHasard(3)), null);
  recompenser(c, 'arene', creerHasard(4));
  assert.equal(consoler(c, creerHasard(5)), null);
});

test('fusion : grade g = g exemplaires identiques, les doubles sont consommés', () => {
  const c = nouvelleCollection();
  c.exemplaires.usa = 1;
  assert.ok(fusionner(c, 'usa')); // pas de double
  c.exemplaires.usa = 2;
  assert.deepEqual(prochaineFusion(c, 'usa'), { grade: 2, doublesNecessaires: 1, doublesDispo: 1 });
  assert.equal(fusionner(c, 'usa'), null);
  assert.equal(gradeDe(c, 'usa'), 2);
  assert.equal(nbExemplaires(c, 'usa'), 1);
  c.exemplaires.usa = 3; // grade 3 : 2 doubles
  assert.equal(fusionner(c, 'usa'), null);
  assert.equal(gradeDe(c, 'usa'), 3);
  c.exemplaires.usa = 1 + 3 + 4; // grade 4 (3 doubles) puis grade 5 (4 doubles)
  assert.equal(fusionner(c, 'usa'), null);
  assert.equal(fusionner(c, 'usa'), null);
  assert.equal(gradeDe(c, 'usa'), 5);
  assert.equal(nbExemplaires(c, 'usa'), 1);
  c.exemplaires.usa = 9;
  assert.ok(fusionner(c, 'usa')); // grade maximal
});

test('grades : +5 % par grade, +10 % pour le dernier (+25 % au grade 5)', () => {
  const base = trouverLutteur('usa');
  assert.deepEqual(avecGrade(base, 1), base);
  const g2 = avecGrade(base, 2);
  assert.equal(g2.force, Math.round(base.force * 1.05));
  const g5 = avecGrade(base, 5);
  assert.equal(g5.enduranceMax, Math.round(base.enduranceMax * 1.25));
  assert.equal(g5.force, Math.round(base.force * 1.25));
  assert.equal(avecGrade(base, 9).force, g5.force);
});

test('sauvegarde : l\'ancien format (liste de cartes) est relu', () => {
  const c = depuisSauvegarde({ cartes: ['usa', 'japon', 'inconnu'], decks: {}, niveau: 'fort', victoires: 4 });
  assert.equal(nbExemplaires(c, 'usa'), 1);
  assert.equal(nbExemplaires(c, 'inconnu'), 0);
  assert.equal(c.niveau, 'fort');
  assert.equal(c.victoires, 4);
  assert.equal(c.version, 2);
});

test('pseudo : 3 à 16 caractères, lettres et chiffres', () => {
  assert.equal(verifierPseudo('Coco'), null);
  assert.equal(verifierPseudo('Coach Élodie'), null);
  assert.ok(verifierPseudo('ab'));
  assert.ok(verifierPseudo('x'.repeat(17)));
  assert.ok(verifierPseudo('<script>'));
});

test('mode test : toutes les cartes sont disponibles', () => {
  const c = nouvelleCollection();
  c.toutDebloque = true;
  assert.ok(LUTTEURS.every((l) => possede(c, l.id)));
});

test('deck : enregistré seulement s\'il est valide', () => {
  const c = nouvelleCollection();
  assert.ok(choisirDeck(c, 'usa', ['sprawl', 'matraquage', 'relance', 'feinte']));
  assert.equal(c.decks.usa, undefined);
  assert.equal(choisirDeck(c, 'usa', ['simple_jambe', 'sprawl', 'feinte', 'relance']), null);
});
