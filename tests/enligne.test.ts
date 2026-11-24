// Combat entre amis : deux joueurs simulés, reliés par une salle en mémoire.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionsJouables } from '../src/moteur/combat';
import { creerHasard } from '../src/moteur/hasard';
import { Duel, coder, decoder, resume, type Presence, type Salle, type Vue } from '../src/page/enligne';

function salleMemoire() {
  const presences = new Map<string, Presence>();
  const ecouteurs = new Map<string, Set<() => void>>();
  const prevenir = (sauf: string) => {
    for (const [id, fs] of ecouteurs) if (id !== sauf) for (const f of fs) queueMicrotask(f);
  };
  return (id: string): Salle => {
    ecouteurs.set(id, new Set());
    return {
      publier(p) { presences.set(id, JSON.parse(JSON.stringify(p))); prevenir(id); },
      pairs: () => [...presences.entries()].filter(([k]) => k !== id).map(([peer, presence]) => ({ peer, presence: presence as unknown as Record<string, unknown> })),
      surChangement(fn) { ecouteurs.get(id)!.add(fn); return () => ecouteurs.get(id)!.delete(fn); },
      connecte: () => true,
      quitter() { presences.delete(id); prevenir(id); },
    };
  };
}

const attendre = (ms = 2) => new Promise((r) => setTimeout(r, ms));

// Un joueur automatique : choisit au hasard, garde ou change avec l'initiative, annonce au hasard.
function joueurAuto(d: Duel, graine: number) {
  const h = creerHasard(graine);
  const stats = { initiatives: 0, faces: 0 };
  let occupe = false;
  d.surVue((v: Vue) => {
    if (occupe) return;
    if (v.phase === 'combat' && v.etat) {
      occupe = true;
      queueMicrotask(() => {
        occupe = false;
        const vv = d.vue;
        if (!vv.etat) return;
        if (vv.aChoisir) {
          const jouables = actionsJouables(vv.etat, vv.moi);
          const c = jouables.length ? { action: jouables[Math.floor(h() * jouables.length)] } : { action: 'lutte' as const };
          d.jouer(c);
        } else if (vv.initiative) {
          stats.initiatives++;
          const jouables = actionsJouables(vv.etat, vv.moi);
          d.decider(h() < 0.5 && vv.monChoix ? vv.monChoix : { action: jouables[0] ?? 'lutte' });
        } else if (vv.pileOuFace) {
          stats.faces++;
          d.annoncer(h() < 0.5 ? 'pile' : 'face');
        }
      });
    }
  });
  return stats;
}

test('codage des choix aller-retour', () => {
  for (const c of [{ action: 'double_jambe' as const, speciale: true }, { action: 'feinte' as const, speciale: false }, { action: 'lutte' as const }]) {
    assert.deepEqual(decoder(coder(c)), c);
  }
});

test('deux amis jouent des combats complets et voient exactement le même combat', async () => {
  let initiatives = 0, faces = 0;
  for (let partie = 0; partie < 12; partie++) {
    const salle = salleMemoire();
    const a = new Duel(salle('a'), 'hote');
    const b = new Duel(salle('b'), 'invite');
    const sa = joueurAuto(a, partie * 2 + 1);
    const sb = joueurAuto(b, partie * 2 + 2);
    await attendre();
    a.choisirLutteur(['usa', 'japon', 'europe-technicien', 'russie-contre'][partie % 4], undefined);
    b.choisirLutteur(['afrique', 'europe', 'japon-contre', 'usa-defenseur'][partie % 4], undefined);
    for (let i = 0; i < 4000 && !(a.vue.phase === 'fin' && b.vue.phase === 'fin'); i++) await attendre(0);
    assert.equal(a.vue.phase, 'fin', `partie ${partie} : l'hôte n'a pas fini`);
    assert.equal(b.vue.phase, 'fin', `partie ${partie} : l'invité n'a pas fini`);
    assert.equal(resume(a.vue.etat!), resume(b.vue.etat!));
    assert.deepEqual(a.vue.etat!.journal, b.vue.etat!.journal);
    assert.equal(a.vue.desaccord || b.vue.desaccord, false);
    initiatives += sa.initiatives + sb.initiatives;
    faces += sa.faces + sb.faces;
    a.fermer(); b.fermer();
  }
  assert.ok(faces > 0, 'au moins un pile ou face');
  assert.ok(initiatives > 0, 'au moins une initiative');
});

test('abandon : l\'ami gagne', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote');
  const b = new Duel(salle('b'), 'invite');
  await attendre();
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('japon', undefined);
  await attendre(5);
  assert.equal(a.vue.phase, 'combat');
  b.abandonner();
  await attendre(5);
  assert.equal(a.vue.phase, 'fin');
  assert.equal(a.vue.abandon, 'ami');
});

test('revanche : nouvelle manche quand les deux la demandent', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote');
  const b = new Duel(salle('b'), 'invite');
  await attendre();
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('japon', undefined);
  await attendre(5);
  a.abandonner();
  await attendre(5);
  a.revanche();
  b.revanche();
  await attendre(10);
  assert.equal(a.vue.phase, 'choix-lutteur');
  assert.equal(b.vue.phase, 'choix-lutteur');
});

test('reprise : un joueur qui recharge la page retrouve le combat et le termine', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote');
  let sauvegardeB: Presence | null = null;
  const b = new Duel(salle('b'), 'invite', null, (p) => { sauvegardeB = JSON.parse(JSON.stringify(p)); });
  joueurAuto(a, 1);
  joueurAuto(b, 2);
  await attendre();
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('japon', undefined);
  for (let i = 0; i < 600 && (b.vue.etat?.tourGlobal ?? 0) < 6; i++) await attendre(0);
  const tourAvant = b.vue.etat!.tourGlobal;
  assert.ok(tourAvant >= 5);
  // L'invité recharge : son ancien duel disparaît, un nouveau repart de la sauvegarde.
  b.fermer();
  await attendre(2);
  const b2 = new Duel(salle('b'), 'invite', sauvegardeB);
  joueurAuto(b2, 3);
  await attendre(2);
  assert.ok(b2.vue.etat!.tourGlobal >= tourAvant - 1, 'le combat reprend où il en était');
  for (let i = 0; i < 4000 && !(a.vue.phase === 'fin' && b2.vue.phase === 'fin'); i++) await attendre(0);
  assert.equal(b2.vue.phase, 'fin');
  assert.deepEqual(a.vue.etat!.journal, b2.vue.etat!.journal);
});
