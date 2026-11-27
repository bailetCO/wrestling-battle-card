// Tutoriels courts (27/11/2026) : chaque tour guidé de la partie d'essai réussit vraiment pour le
// joueur, quel que soit le hasard et quel que soit l'adversaire tiré (un lutteur commun).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ID_RIVAL, LUTTEURS, creerCombat, creerHasard, jouerSequence, jouerTour, type EtatCombat } from '../src/moteur';
import { TUTOS, defAdversaireEssai, defEssai, type IdTuto } from '../src/page/tutos';

const NOM = 'Lutteur d\'essai';
const COMMUNES = LUTTEURS.filter((l) => l.rarete === 'commune').map((l) => l.id);
const GRAINES = [1, 2, 3, 7, 42, 99, 2026];

function combat(id: IdTuto, adv: string): EtatCombat {
  const t = TUTOS[id];
  const e = t.essai!;
  const infini = e.type === 'rapide' && e.infini;
  const rapide = e.type === 'rapide' && !e.periodes;
  return creerCombat(defEssai(e.type === 'rapide' || e.type === 'arene' ? e.deck : []), defAdversaireEssai(infini ? ID_RIVAL : adv, t.deckAdversaire!), {
    rapide, enchainement: e.type === 'rapide' && e.enchainement, infini,
  });
}

// Ce tour (ou cette séquence) a réussi pour le joueur : personne ne rate, et le joueur l'emporte.
function verifierReussite(lignes: string[], contexte: string) {
  const texte = lignes.join(' / ');
  assert.ok(!/rate son action/.test(texte), `action ratée : ${contexte} : ${texte}`);
  assert.ok(new RegExp(`de ${NOM} l'emporte|Le contre de ${NOM} prend|Combo`).test(texte), `pas de réussite : ${contexte} : ${texte}`);
  assert.ok(!/l'emporte sur l'attaque de Lutteur|l'emporte sur la (feinte|défense) de Lutteur|l'emporte sur le contre de Lutteur/.test(texte), `l'adversaire l'emporte : ${contexte} : ${texte}`);
}

for (const id of ['combos', 'infini', 'arene'] as IdTuto[]) {
  test(`tutoriel « ${TUTOS[id].titre} » : chaque tour guidé réussit`, () => {
    const t = TUTOS[id];
    assert.ok(t.guide?.length && t.deckAdversaire, 'tours guidés et deck adverse');
    const e0 = t.essai!;
    for (const g of t.guide!) {
      assert.ok((e0.type === 'rapide' || e0.type === 'arene') && e0.deck.includes(g.joueur), `${g.joueur} dans le deck du joueur`);
      assert.ok(t.deckAdversaire!.includes(g.ordi), `${g.ordi} dans le deck adverse`);
    }
    for (const adv of COMMUNES) for (const graine of GRAINES) {
      const h = creerHasard(graine);
      let e = combat(id, adv);
      t.guide!.forEach((g, k) => {
        const n = e.journal.length;
        e = jouerTour(e, { action: g.joueur }, { action: g.ordi }, h);
        const ctx = `${id} tour ${k + 1}, ${adv}, graine ${graine}`;
        if (g.pause) assert.match(e.journal.slice(n).join(' '), /personne ne marque/, ctx); // tour de respiration
        else verifierReussite(e.journal.slice(n), ctx);
      });
      assert.ok(!e.termine, `${id} : le combat continue après les tours guidés (${adv}, graine ${graine})`);
      if (id === 'combos') {
        const j = e.journal.join(' ');
        assert.match(j, /Contre-temps/);
        assert.match(j, /Passage dans le dos/);
      }
    }
  });
}

test('tutoriel « Le format Enchaînement » : le combo passe, puis le contre brise la chaîne', () => {
  const t = TUTOS.enchainement;
  assert.ok(t.guideSeq?.length === 2 && t.deckAdversaire);
  for (const s of t.guideSeq!) {
    for (const a of s.joueur) assert.ok(t.essai!.type === 'rapide' && t.essai!.deck.includes(a), a);
    for (const a of s.ordi) assert.ok(t.deckAdversaire!.includes(a), a);
  }
  for (const adv of COMMUNES) for (const graine of GRAINES) {
    const h = creerHasard(graine);
    let e = combat('enchainement', adv);
    const lignes: string[][] = [];
    for (const s of t.guideSeq!) {
      const n = e.journal.length;
      e = jouerSequence(e, s.joueur.map((action) => ({ action })), s.ordi.map((action) => ({ action })), h).etat;
      lignes.push(e.journal.slice(n));
    }
    const ctx = `${adv}, graine ${graine}`;
    assert.ok(!/rate son action/.test(lignes.flat().join(' ')), `action ratée : ${ctx}`);
    assert.match(lignes[0].join(' '), /Passage dans le dos/, ctx);
    assert.match(lignes[1].join(' '), new RegExp(`Chaîne brisée : le contre de ${NOM}`), ctx);
    assert.ok(!e.termine, `le combat continue (${ctx})`);
  }
});

test('les tutoriels de tournoi et du combat entre amis ne sont pas guidés', () => {
  for (const id of ['individuel', 'equipe', 'amis'] as IdTuto[]) assert.ok(!TUTOS[id].guide && !TUTOS[id].guideSeq, id);
});

test('booster de partie d\'essai : la liste des tutoriels déjà récompensés est gardée par la sauvegarde', async () => {
  const { depuisSauvegarde, nouvelleCollection } = await import('../src/page/collection');
  const c = nouvelleCollection();
  assert.equal(c.essaisGagnes.length, 0); // (deepEqual avec [] réduirait le type à « jamais »)
  c.essaisGagnes.push('combos');
  assert.deepEqual(depuisSauvegarde(JSON.parse(JSON.stringify(c))).essaisGagnes, ['combos']);
  assert.deepEqual(depuisSauvegarde({ version: 2, coach: 'Ancien' }).essaisGagnes, []); // ancienne sauvegarde
});
