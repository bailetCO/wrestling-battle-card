// Collection : cartes de départ, boosters, doublons, fusion, grades, sauvegarde, pseudo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, avecGrade, coutAction, etoilesPossibles, exemplairesPourGrade, gradeMaxDe, niveauCarte, stylesDebloques, trouverLutteur } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import {
  cartesDeDepart, choisirDeck, consoler, defPossede, depuisSauvegarde, fusionner, gradeDe, nbEtoiles, nbExemplaires, nbFusions, nbStyles, styleDe,
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

test('fusion : chaque fusion monte d\'une rareté ; il faut autant d\'exemplaires que le rang visé', () => {
  const c = nouvelleCollection();
  c.exemplaires.europe = 1; // commune
  assert.ok(fusionner(c, 'europe')); // pas de double
  c.exemplaires.europe = 2; // Rare : 2 exemplaires (1 double)
  assert.deepEqual(prochaineFusion(c, 'europe'), { type: 'grade', grade: 2, niveau: 'rare', doublesNecessaires: 1, doublesDispo: 1 });
  assert.equal(fusionner(c, 'europe'), null);
  assert.equal(niveauCarte(trouverLutteur('europe'), gradeDe(c, 'europe')), 'rare');
  assert.equal(nbExemplaires(c, 'europe'), 1);
  c.exemplaires.europe = 1 + 2 + 3 + 4; // Épique (2 doubles), Légendaire (3), Champion du Monde (4)
  for (let i = 0; i < 3; i++) assert.equal(fusionner(c, 'europe'), null);
  assert.equal(gradeDe(c, 'europe'), 5);
  assert.equal(niveauCarte(trouverLutteur('europe'), 5), 'champion');
  assert.equal(nbExemplaires(c, 'europe'), 1);
  assert.equal(prochaineFusion(c, 'europe')?.type, 'etoile');
});

test('fusion : une légendaire n\'a qu\'une montée, vers Champion du Monde, avec 5 exemplaires', () => {
  const c = nouvelleCollection();
  const usa = trouverLutteur('usa'); // légendaire
  assert.equal(gradeMaxDe(usa), 2);
  c.exemplaires.usa = 4;
  assert.deepEqual(prochaineFusion(c, 'usa'), { type: 'grade', grade: 2, niveau: 'champion', doublesNecessaires: 4, doublesDispo: 3 });
  assert.ok(fusionner(c, 'usa'));
  c.exemplaires.usa = 5;
  assert.equal(fusionner(c, 'usa'), null);
  assert.equal(niveauCarte(usa, gradeDe(c, 'usa')), 'champion');
  assert.equal(prochaineFusion(c, 'usa')?.type, 'etoile');
  // Bonus d'un seul niveau gagné ; Champion du Monde : toutes les actions débloquées.
  const d = defPossede(c, 'usa');
  assert.equal(d.force, Math.round(usa.force * 1.05));
  assert.equal(d.actionsPossibles.length, usa.actions.length + usa.deblocages.length);
  assert.equal(d.niveau, 'champion');
  // Ancienne sauvegarde au-delà du maximum : ramenée au maximum.
  c.grades.usa = 5;
  assert.equal(gradeDe(c, 'usa'), 2);
});

test('fusion : nombre de montées selon la rareté de départ', () => {
  const max = (r: string) => gradeMaxDe(LUTTEURS.find((l) => l.rarete === r)!);
  assert.deepEqual(['commune', 'rare', 'epique', 'legendaire'].map(max), [5, 4, 3, 2]);
  const rare = LUTTEURS.find((l) => l.rarete === 'rare')!;
  assert.equal(exemplairesPourGrade(rare, 2), 3); // Rare → Épique : 3 exemplaires
});

test('étoiles (Champion du Monde) : 5 doubles, −1 au coût de l\'action choisie, 3 maximum par action', () => {
  const c = nouvelleCollection();
  c.exemplaires.usa = 1 + 5 * 4;
  c.grades.usa = 2; // légendaire montée en Champion du Monde
  const f = prochaineFusion(c, 'usa');
  assert.equal(f?.type, 'etoile');
  assert.equal(f?.doublesNecessaires, 5);
  assert.ok(fusionner(c, 'usa')); // il faut choisir l'action
  const cout0 = coutAction(defPossede(c, 'usa'), 'double_jambe');
  for (let i = 0; i < 3; i++) assert.equal(fusionner(c, 'usa', 'double_jambe'), null);
  assert.equal(coutAction(defPossede(c, 'usa'), 'double_jambe'), cout0 - 3);
  assert.ok(fusionner(c, 'usa', 'double_jambe')); // déjà 3 étoiles
  assert.equal(nbExemplaires(c, 'usa'), 1 + 5);
  assert.equal(nbEtoiles(c, 'usa'), 3);
});

test('grades : +5 % par niveau gagné, +10 % pour le 4e (+25 % en tout)', () => {
  const base = trouverLutteur('europe'); // commune : 4 niveaux à gagner
  assert.equal(avecGrade(base, 1).force, base.force);
  assert.deepEqual(avecGrade(base, 1).actionsPossibles, base.actions);
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
  // Europe (commune) : simple_jambe s'ouvre au niveau Rare. Refusée avant, acceptée ensuite.
  assert.ok(choisirDeck(c, 'europe', ['simple_jambe', 'defense', 'feinte', 'contre']));
  c.grades.europe = 2;
  assert.equal(choisirDeck(c, 'europe', ['simple_jambe', 'defense', 'feinte', 'contre']), null);
});

test('styles de carte : un par quart des étoiles possibles, une fois Champion du Monde', () => {
  const c = nouvelleCollection();
  const usa = trouverLutteur('usa');
  c.exemplaires.usa = 1 + 5 * 24;
  assert.equal(nbStyles(c, 'usa'), 0);
  c.grades.usa = 2; // Champion du Monde
  const possibles = defPossede(c, 'usa').actionsPossibles;
  assert.equal(possibles.length * 3, etoilesPossibles(usa)); // 8 actions × 3 = 24 étoiles
  const palier = etoilesPossibles(usa) / 4;
  let n = 0;
  for (const a of possibles) {
    for (let k = 0; k < 3; k++) {
      assert.equal(fusionner(c, 'usa', a), null);
      n++;
      assert.equal(nbStyles(c, 'usa'), Math.floor(n / palier));
    }
  }
  assert.equal(nbStyles(c, 'usa'), 4);
  assert.equal(styleDe(c, 'usa'), 4); // le dernier style débloqué s'affiche
  assert.equal(nbFusions(c, 'usa'), 1 + 24);
  assert.equal(stylesDebloques(usa, 1, 24), 0); // pas Champion du Monde : aucun style
});

test('collection : le tri et le style choisi sont gardés dans la sauvegarde', () => {
  const c = nouvelleCollection();
  assert.equal(c.tri, 'rarete');
  c.tri = 'nation';
  c.styles.usa = 2;
  const r = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.equal(r.tri, 'nation');
  assert.equal(r.styles.usa, 2);
});
