// Mode histoire (28/11/2026) : 33 quêtes dans l'ordre, validées seulement une fois en cours, sauf
// celles qui portent sur l'état du jeu (validées tout de suite si c'est déjà fait).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LUTTEURS, REGLES } from '../src/moteur/config';
import { creerHasard } from '../src/moteur/hasard';
import { ANCIEN_VERS_NOUVEAU, depuisSauvegarde, nouvelleCollection, type Collection } from '../src/page/collection';
import { PAR_NATION, nationsArene } from '../src/page/arene';
import { ETAPES, histoireFinie, indexEtape, noterHistoire, passerQuete, progression, texteRecompense, type EvenementHistoire } from '../src/page/histoire';
import { fonctionVisible, tuileVisible } from '../src/page/menu';

const h = creerHasard(1);
const noter = (c: Collection, ev: EvenementHistoire) => noterHistoire(c, ev, h);
const etat: EvenementHistoire = { type: 'etat' };
const a = (id: string) => { const c = nouvelleCollection(); c.histoire.etape = indexEtape(id); return c; };
const fin = (ev: Partial<Extract<EvenementHistoire, { type: 'combat' }>>): EvenementHistoire =>
  ({ type: 'combat', gagne: false, combos: 0, enchainement: false, infini: false, auto: false, ...ev });

test('histoire : 33 quêtes, identifiants uniques, une récompense chacune, 5 premières faciles puis alternance', () => {
  assert.equal(ETAPES.length, 33);
  assert.equal(REGLES.histoire.nbEtapes, ETAPES.length);
  assert.equal(new Set(ETAPES.map((e) => e.id)).size, ETAPES.length);
  assert.deepEqual(Object.keys(REGLES.histoire.recompenses).sort(), ETAPES.map((e) => e.id).sort());
  for (let i = 0; i < ETAPES.length; i++) assert.ok(texteRecompense(i).length > 0, ETAPES[i].id);
  // Après les 5 premières : jamais deux quêtes secondaires de suite.
  for (let i = 6; i < ETAPES.length; i++) assert.ok(!(ETAPES[i].type === 'secondaire' && ETAPES[i - 1].type === 'secondaire'), ETAPES[i].id);
  assert.deepEqual(ETAPES.filter((e) => e.passable).map((e) => e.id), ['invitation', 'en-ligne']);
});

test('quête 1 : gagner un combat en Carrière (les autres victoires ne comptent pas)', () => {
  const c = nouvelleCollection();
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal' }), []);
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'iran', niveau: null }), []);
  const r = noter(c, { type: 'victoire', nation: 'japon', niveau: 'normal', carriere: true });
  assert.equal(r.length, 1);
  assert.equal(r[0].boosters[0].type, 'classique');
  assert.equal(c.histoire.etape, 1);
});

test('quêtes 2 à 4 : régler un deck, gagner à l\'entraînement, réussir une quête du jour ($ ou booster)', () => {
  const c = a('deck');
  const dollars = c.dollars;
  assert.deepEqual(noter(c, { type: 'achat' }), []);
  const r = noter(c, { type: 'deck' });
  assert.equal(r[0].dollars, 10);
  assert.equal(c.dollars, dollars + 10);
  assert.equal(noter(c, { type: 'rapide', tombe: false, ecart: 1 }).length, 1);
  assert.equal(noter(c, { type: 'queteDuJour' })[0].boosters.length, 1);
  assert.equal(ETAPES[c.histoire.etape].id, 'club');
});

test('dans l\'ordre : un événement d\'une quête future ne compte pas, même plus tard', () => {
  const c = nouvelleCollection();
  noter(c, { type: 'tournoiIndividuel', place: 1, invaincu: true });
  noter(c, { type: 'deck' });
  assert.equal(c.histoire.etape, 0);
  noter(c, { type: 'victoire', nation: 'usa', niveau: 'normal', carriere: true });
  assert.equal(c.histoire.etape, 1); // le deck réglé avant ne compte pas
});

test('quêtes sur l\'état du jeu : validées tout de suite, et enchaînées', () => {
  // Mon Club déjà ouvert et une nation déjà battue : la quête du jour valide aussi les deux suivantes.
  const c = a('quete-jour');
  c.medailles = 12;
  c.arene = PAR_NATION;
  assert.deepEqual(noter(c, { type: 'queteDuJour' }).map((x) => ETAPES[x.etape].id), ['quete-jour', 'club', 'nations-1']);
  // Club fermé : la quête attend l'ouverture, avec une jauge des médailles.
  const d = a('club');
  d.medailles = 4;
  assert.deepEqual(noter(d, etat), []);
  assert.deepEqual(progression(d), [4, 10]);
  d.medailles = 10;
  assert.equal(noter(d, etat).length, 1);
});

test('Carrière : 1, 3, 6, 9 puis 12 nations (jauge), la dernière donne une légendaire', () => {
  const c = a('nations-3');
  c.arene = 2 * PAR_NATION;
  assert.deepEqual(progression(c), [2, 3]);
  assert.deepEqual(noter(c, { type: 'nationArene' }), []);
  c.arene = 3 * PAR_NATION;
  assert.equal(noter(c, { type: 'nationArene' })[0].boosters.length, 2);
  const d = a('nations-12');
  d.arene = nationsArene().length * PAR_NATION - 1;
  assert.deepEqual(noter(d, etat), []);
  d.arene++;
  const r = noter(d, etat);
  assert.equal(r[0].boosters.length, 1);
  assert.equal(r[0].boosters[0].type, 'recompense'); // la carte légendaire
});

test('recrutement, podium, achat, division Argent puis Or', () => {
  const c = a('recrutement');
  assert.equal(noter(c, { type: 'recrutement' }).length, 1);
  assert.deepEqual(noter(c, { type: 'tournoiIndividuel', place: 4, invaincu: false }), []);
  assert.equal(noter(c, { type: 'tournoiIndividuel', place: 3, invaincu: false }).length, 1);
  assert.equal(noter(c, { type: 'achat' }).length, 1);
  assert.deepEqual(noter(c, etat), []); // division Bronze
  c.classement.division = 1;
  assert.equal(noter(c, etat).length, 1);
  const d = a('or');
  d.classement.division = 1;
  assert.deepEqual(noter(d, etat), []);
  d.classement.division = 2;
  assert.equal(noter(d, etat).length, 1);
});

test('quêtes qui demandent un ami : lien partagé, ou passées sans récompense', () => {
  const c = a('invitation');
  c.parrainage.partage = true;
  assert.equal(noter(c, etat).length, 1);
  const d = a('en-ligne');
  assert.equal(passerQuete(a('deck'), h), null); // une quête ordinaire ne se passe pas
  const r = passerQuete(d, h)!;
  assert.deepEqual(r, []);
  assert.equal(ETAPES[d.histoire.etape].id, 'or');
});

test('fusions : première fusion, Épique, Champion du Monde, étoile (déjà fait = validé)', () => {
  const commune = LUTTEURS.find((l) => l.rarete === 'commune')!;
  const c = a('fusion');
  assert.deepEqual(noter(c, etat), []);
  c.exemplaires[commune.id] = 1;
  c.grades[commune.id] = 2; // rare
  assert.equal(noter(c, { type: 'fusion', id: commune.id }).length, 1);
  const d = a('epique');
  d.exemplaires[commune.id] = 1;
  d.grades[commune.id] = 2;
  assert.deepEqual(noter(d, etat), []);
  d.grades[commune.id] = 3; // épique
  assert.equal(noter(d, etat).length, 1);
  const e = a('champion');
  e.exemplaires[commune.id] = 1;
  e.grades[commune.id] = 5;
  assert.equal(noter(e, etat).length, 1);
  const f = a('etoile');
  f.etoiles.darius = { double_jambe: 1 }; // la carte de Darius ne compte pas
  assert.deepEqual(noter(f, etat), []);
  f.exemplaires[commune.id] = 1;
  f.etoiles[commune.id] = { double_jambe: 1 };
  assert.equal(noter(f, etat).length, 1);
});

test('combos, auto, Enchaînement, ordinateur fort (à la main), tournois, fragment', () => {
  const c = a('combos');
  assert.deepEqual(noter(c, fin({ combos: 3, auto: true })), []);
  assert.equal(noter(c, fin({ combos: 2 })).length, 1);
  c.histoire.etape = indexEtape('auto');
  assert.deepEqual(noter(c, fin({ gagne: true })), []);
  assert.equal(noter(c, fin({ gagne: true, auto: true })).length, 1);
  c.histoire.etape = indexEtape('enchainement');
  assert.deepEqual(noter(c, fin({ enchainement: true })), []);
  assert.equal(noter(c, fin({ gagne: true, enchainement: true })).length, 1);
  assert.deepEqual(noter(c, { type: 'tournoiEquipe', gagne: false }), []);
  assert.equal(noter(c, { type: 'tournoiEquipe', gagne: true }).length, 1);
  assert.equal(noter(c, { type: 'fragment' }).length, 1);
  c.histoire.etape = indexEtape('fort');
  assert.deepEqual(noter(c, { type: 'victoire', nation: 'usa', niveau: 'fort', auto: true }), []);
  assert.equal(noter(c, { type: 'victoire', nation: 'usa', niveau: 'fort' }).length, 1);
  const t = a('tournoi');
  assert.deepEqual(noter(t, { type: 'tournoiIndividuel', place: 2, invaincu: false }), []);
  assert.equal(noter(t, { type: 'tournoiIndividuel', place: 1, invaincu: false }).length, 1);
  const i = a('invaincu');
  assert.deepEqual(noter(i, { type: 'tournoiIndividuel', place: 1, invaincu: false }), []);
  assert.equal(noter(i, { type: 'tournoiIndividuel', place: 1, invaincu: true }).length, 1);
});

test('Cocoach : battu, puis Légendaire, puis Champion du Monde (+ légendaire et carte de Darius)', () => {
  const c = a('rival');
  assert.deepEqual(noter(c, { type: 'rival', grade: 1, auto: true }), []);
  assert.equal(noter(c, { type: 'rival', grade: 1, auto: false }).length, 1);
  c.histoire.etape = indexEtape('rival-legendaire');
  assert.deepEqual(noter(c, { type: 'rival', grade: 2, auto: false }), []);
  assert.equal(noter(c, { type: 'rival', grade: 3, auto: false }).length, 1);
  const legendaires = LUTTEURS.filter((l) => l.rarete === 'legendaire');
  for (const l of legendaires.slice(1)) c.exemplaires[l.id] = 1;
  const r = noter(c, { type: 'rival', grade: 4, auto: false });
  assert.deepEqual(r[0].boosters.map((b) => b.cartes[0]), [legendaires[0].id, 'darius']);
  assert.ok(histoireFinie(c));
});

test('menus : chaque tuile ou mode apparaît quand la quête qui s\'en sert est en cours', () => {
  const vu = (id: string) => a(id);
  assert.ok(!tuileVisible(vu('recrutement'), 'tournois') && tuileVisible(vu('podium'), 'tournois'));
  assert.ok(tuileVisible(vu('club'), 'club'));
  assert.ok(tuileVisible(vu('achat'), 'social'));
  assert.ok(tuileVisible(vu('argent'), 'classement'));
  assert.ok(!tuileVisible(vu('invitation'), 'fusion') && tuileVisible(vu('fusion'), 'fusion'));
  assert.ok(fonctionVisible(vu('combos'), 'combos') && fonctionVisible(vu('enchainement'), 'enchainement'));
  assert.ok(fonctionVisible(vu('equipe'), 'equipe') && fonctionVisible(vu('rival'), 'infini'));
  assert.ok(fonctionVisible(vu('fort'), 'fort') && fonctionVisible(vu('en-ligne'), 'amis'));
  assert.ok(tuileVisible(vu('club-10'), 'saison'));
});

test('ancienne sauvegarde (18 étapes) : reprise à la bonne quête, menus déjà ouverts gardés', () => {
  // Table de conversion : chaque ancienne étape vers la quête équivalente.
  const anciennes = ['carriere', 'tournoi', 'club', 'equipe', '', '', 'nations-1', 'epique', 'fort', 'en-ligne', 'nations-12', 'invaincu', 'combos', 'enchainement', '', 'rival', 'rival-legendaire', 'rival-champion'];
  assert.deepEqual(ANCIEN_VERS_NOUVEAU, anciennes.map((id) => (id ? indexEtape(id) : -1)));
  // Ancienne étape 4 (tournoi par équipe en cours) : reprise à « Première nation » ; Mon Club, Social et
  // les tournois restent ouverts, comme avant.
  const d = depuisSauvegarde({ histoire: { etape: 3, nations: [] }, scenesVues: ['histoire15', 'h0', 'h1', 'h2', 'h3', 's0'] });
  assert.equal(ETAPES[d.histoire.etape].id, 'nations-1');
  assert.ok(tuileVisible(d, 'tournois') && tuileVisible(d, 'social') && fonctionVisible(d, 'equipe'));
  assert.ok(!tuileVisible(d, 'fusion'));
  assert.ok(d.scenesVues.includes('s0') && d.scenesVues.includes('h4') && !d.scenesVues.includes('h5'));
  // Conversion faite une seule fois.
  const e = depuisSauvegarde(JSON.parse(JSON.stringify(d)));
  assert.equal(e.histoire.etape, d.histoire.etape);
  // Histoire finie : elle le reste.
  assert.ok(histoireFinie(depuisSauvegarde({ histoire: { etape: 18, nations: [] }, scenesVues: ['histoire15'] })));
  // Ancienne étape 1 : rien de fait, on commence au début.
  assert.equal(depuisSauvegarde({ histoire: { etape: 0, nations: [] }, scenesVues: ['histoire15'] }).histoire.etape, 0);
});

test('histoire gardée dans la sauvegarde', () => {
  const c = nouvelleCollection();
  c.histoire = { etape: 4, nations: [] };
  assert.equal(depuisSauvegarde(JSON.parse(JSON.stringify(c))).histoire.etape, 4);
  assert.equal(depuisSauvegarde({ histoire: { etape: 99 }, scenesVues: ['histoire33'] }).histoire.etape, 33);
});
