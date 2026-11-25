// Club : amis, marchand du jour, échange de doubles entre deux téléphones simulés.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trouverLutteur } from '../src/moteur/config';
import { nbExemplaires, nouvelleCollection, type Collection } from '../src/page/collection';
import { Echange, accepterOffre, jourDe, listeAmis, noterAmi, offreFaite, offresDuJour } from '../src/page/club';
import type { Salle } from '../src/page/enligne';

function salleMemoire() {
  const presences = new Map<string, object>();
  const ecouteurs = new Map<string, Set<() => void>>();
  const prevenir = (sauf: string) => {
    for (const [id, fs] of ecouteurs) if (id !== sauf) for (const f of fs) queueMicrotask(f);
  };
  return (id: string): Salle => {
    ecouteurs.set(id, new Set());
    return {
      publier(p) { presences.set(id, JSON.parse(JSON.stringify(p))); prevenir(id); },
      pairs: () => [...presences.entries()].filter(([k]) => k !== id).map(([peer, presence]) => ({ peer, presence: presence as Record<string, unknown> })),
      surChangement(fn) { ecouteurs.get(id)!.add(fn); return () => ecouteurs.get(id)!.delete(fn); },
      connecte: () => true,
      quitter() { presences.delete(id); prevenir(id); },
    };
  };
}
const attendre = (ms = 5) => new Promise((r) => setTimeout(r, ms));
async function attendreQue(cond: () => boolean, max = 10000) {
  const fin = Date.now() + max;
  while (!cond() && Date.now() < fin) await attendre(1);
}

function coach(nom: string, exemplaires: Record<string, number>): Collection {
  const c = nouvelleCollection();
  c.coach = nom;
  c.exemplaires = { ...exemplaires };
  return c;
}

test('amis : un combat n\'est compté qu\'une fois, la liste est triée par date', () => {
  const c = nouvelleCollection();
  noterAmi(c, 'b1', 'Bruno', { type: 'victoire', cle: 'abcd-1' });
  noterAmi(c, 'b1', 'Bruno', { type: 'victoire', cle: 'abcd-1' });
  noterAmi(c, 'b1', 'Bruno', { type: 'defaite', cle: 'abcd-2' });
  noterAmi(c, c.idCoach, 'Moi', { type: 'victoire', cle: 'x' }); // soi-même : ignoré
  const l = listeAmis(c);
  assert.equal(l.length, 1);
  assert.equal(l[0].victoires, 1);
  assert.equal(l[0].defaites, 1);
});

test('marchand : 3 offres par jour, les mêmes pour tous, même rareté, cartes différentes', () => {
  const j = '2026-11-24';
  assert.deepEqual(offresDuJour(j), offresDuJour(j));
  assert.notDeepEqual(offresDuJour(j), offresDuJour('2026-11-25'));
  for (const jour of ['2026-11-24', '2026-11-25', '2026-12-01', '2027-01-01']) {
    const o = offresDuJour(jour);
    assert.equal(o.length, 3);
    for (const x of o) {
      assert.notEqual(x.donne, x.demande);
      assert.equal(trouverLutteur(x.donne).rarete, trouverLutteur(x.demande).rarete);
    }
  }
  assert.match(jourDe(new Date(2026, 10, 5)), /^2026-11-05$/);
});

test('marchand : il faut un double, une seule fois par offre et par jour', () => {
  const j = '2026-11-24';
  const o = offresDuJour(j)[0];
  const c = coach('A', { [o.demande]: 1 });
  assert.ok(accepterOffre(c, j, 0)); // pas de double
  c.exemplaires[o.demande] = 2;
  assert.equal(accepterOffre(c, j, 0), null);
  assert.equal(nbExemplaires(c, o.demande), 1);
  assert.equal(nbExemplaires(c, o.donne), 1);
  assert.ok(offreFaite(c, j, 0));
  c.exemplaires[o.demande] = 3;
  assert.ok(accepterOffre(c, j, 0)); // déjà fait aujourd'hui
  assert.equal(offreFaite(c, '2026-11-25', 0), false);
});

test('échange : chacun propose un double, les deux acceptent, les cartes changent de main', async () => {
  const salle = salleMemoire();
  const ca = coach('Alice', { usa: 3, europe: 1 });
  const cb = coach('Bruno', { japon: 2, afrique: 1 });
  const a = new Echange(salle('a'), 'abcd', ca);
  const b = new Echange(salle('b'), 'abcd', cb);
  await attendreQue(() => a.vue.amiCoach === 'Bruno');
  assert.equal(a.vue.amiCoach, 'Bruno');
  assert.deepEqual(a.vue.sesDoubles, { japon: 1 });
  a.proposer('usa');
  b.proposer('japon');
  await attendre();
  a.accepter();
  await attendre();
  assert.equal(nbExemplaires(ca, 'usa'), 3, 'rien ne bouge tant que les deux n\'ont pas accepté');
  b.accepter();
  await attendreQue(() => !!a.vue.dernier && !!b.vue.dernier);
  assert.equal(nbExemplaires(ca, 'usa'), 2);
  assert.equal(nbExemplaires(ca, 'japon'), 1);
  assert.equal(nbExemplaires(cb, 'japon'), 1);
  assert.equal(nbExemplaires(cb, 'usa'), 1);
  assert.deepEqual(a.vue.dernier, { donne: 'usa', recoit: 'japon' });
  assert.equal(listeAmis(ca)[0].echanges, 1);
  assert.equal(a.vue.monOffre, null);
});

test('échange : changer son offre annule l\'accord de l\'autre', async () => {
  const salle = salleMemoire();
  const ca = coach('Alice', { usa: 2, russie: 2 });
  const cb = coach('Bruno', { japon: 2 });
  const a = new Echange(salle('a'), 'abcd', ca);
  const b = new Echange(salle('b'), 'abcd', cb);
  await attendre();
  a.proposer('usa');
  b.proposer('japon');
  await attendre();
  b.accepter();
  await attendre();
  a.proposer('russie'); // Alice change d'avis
  await attendre();
  a.accepter();
  await attendre(20);
  assert.equal(nbExemplaires(cb, 'japon'), 2, 'Bruno n\'avait pas accepté la nouvelle offre');
  assert.equal(b.vue.jaiAccepte, false);
});
