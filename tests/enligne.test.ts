// Combat entre amis : deux joueurs simulés, reliés par une salle en mémoire.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionsJouables } from '../src/moteur/combat';
import { creerHasard } from '../src/moteur/hasard';
import { trouverLutteur } from '../src/moteur/config';
import { Duel, coder, coderSequence, decoder, decoderSequence, resume, type Presence, type Salle } from '../src/page/enligne';
import { sequenceOrdinateur } from '../src/moteur/enchainement';

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
// Attend qu'une condition soit vraie (au plus `max` ms) : robuste même si l'ordinateur est chargé.
async function attendreQue(cond: () => boolean, max = 60000) {
  const fin = Date.now() + max;
  while (!cond() && Date.now() < fin) await attendre(1);
}

// Un joueur automatique : choisit au hasard, garde ou change avec l'initiative, annonce au hasard.
// Il réagit à chaque changement, et vérifie aussi régulièrement s'il doit jouer : ainsi, même si
// un changement passe inaperçu quand l'ordinateur est chargé, la partie ne reste jamais bloquée.
function joueurAuto(d: Duel, graine: number) {
  const h = creerHasard(graine);
  const stats = { initiatives: 0, faces: 0 };
  let occupe = false;
  let dernier = ''; // ce à quoi il a déjà répondu (pas de double réponse)
  const agir = () => {
    occupe = false;
    const vv = d.vue;
    if (vv.phase !== 'combat' || !vv.etat) return;
    const cle = `${vv.etat.tourGlobal}:${vv.aChoisir}:${vv.initiative}:${vv.pileOuFace}`;
    if (cle === dernier) return;
    if (vv.aChoisir || vv.initiative || vv.pileOuFace) dernier = cle;
    {
      {
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
      }
    }
  };
  d.surVue(() => {
    if (occupe) return;
    occupe = true;
    queueMicrotask(agir);
  });
  const veille = setInterval(() => {
    if (d.vue.phase === 'fin') clearInterval(veille);
    else if (!occupe) agir();
  }, 20);
  veille.unref?.();
  return stats;
}

test('codage des choix aller-retour', () => {
  for (const c of [{ action: 'double_jambe' as const, speciale: true }, { action: 'feinte' as const, speciale: false }, { action: 'lutte' as const }]) {
    assert.deepEqual(decoder(coder(c)), c);
  }
});

test('deux amis jouent des combats complets et voient exactement le même combat', async () => {
  let initiatives = 0, faces = 0;
  // Au moins 12 combats, et on continue (40 au plus) tant qu'on n'a pas vu de pile ou face et
  // d'initiative : ils dépendent du hasard du combat.
  for (let partie = 0; partie < 40 && (partie < 12 || faces === 0 || initiatives === 0); partie++) {
    const salle = salleMemoire();
    const a = new Duel(salle('a'), 'hote');
    const b = new Duel(salle('b'), 'invite');
    const sa = joueurAuto(a, partie * 2 + 1);
    const sb = joueurAuto(b, partie * 2 + 2);
    await attendre();
    a.choisirLutteur(['usa', 'japon', 'europe-technicien', 'russie-contre'][partie % 4], undefined);
    b.choisirLutteur(['afrique', 'europe', 'japon-contre', 'usa-defenseur'][partie % 4], undefined);
    await attendreQue(() => a.vue.phase === 'fin' && b.vue.phase === 'fin');
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
  await attendreQue(() => a.vue.phase === 'combat');
  assert.equal(a.vue.phase, 'combat');
  b.abandonner();
  await attendreQue(() => a.vue.phase === 'fin');
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
  await attendreQue(() => a.vue.phase === 'combat' && b.vue.phase === 'combat');
  a.abandonner();
  await attendreQue(() => a.vue.phase === 'fin' && b.vue.phase === 'fin');
  a.revanche();
  b.revanche();
  await attendreQue(() => a.vue.phase === 'choix-lutteur' && b.vue.phase === 'choix-lutteur');
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
  await attendreQue(() => (b.vue.etat?.tourGlobal ?? 0) >= 6 || b.vue.phase === 'fin');
  const tourAvant = b.vue.etat!.tourGlobal;
  assert.ok(tourAvant >= 5);
  // L'invité recharge : son ancien duel disparaît, un nouveau repart de la sauvegarde.
  b.fermer();
  await attendre(2);
  const b2 = new Duel(salle('b'), 'invite', sauvegardeB);
  joueurAuto(b2, 3);
  await attendre(2);
  assert.ok(b2.vue.etat!.tourGlobal >= tourAvant - 1, 'le combat reprend où il en était');
  await attendreQue(() => a.vue.phase === 'fin' && b2.vue.phase === 'fin');
  assert.equal(b2.vue.phase, 'fin');
  assert.deepEqual(a.vue.etat!.journal, b2.vue.etat!.journal);
});

test('le style de carte choisi est transmis à l\'ami', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote');
  const b = new Duel(salle('b'), 'invite');
  await attendre();
  a.choisirLutteur('usa', undefined, 2, {}, 3);
  await attendreQue(() => b.vue.amiStyle === 3);
  assert.equal(b.vue.amiStyle, 3);
  assert.equal(a.vue.monStyle, 3);
  a.fermer(); b.fermer();
});

test('combat rapide en ligne : choisi par l\'hôte, joué par les deux ; niveau de compte transmis', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote', null, () => undefined, { rapide: true, niveauCompte: 4 });
  const b = new Duel(salle('b'), 'invite', null, () => undefined, { niveauCompte: 2 });
  await attendre();
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('europe', undefined);
  await attendreQue(() => !!a.vue.etat && !!b.vue.etat);
  assert.equal(b.vue.rapide, true);
  assert.equal(a.vue.etat!.rapide, true);
  assert.equal(b.vue.etat!.rapide, true);
  assert.equal(a.vue.amiNiveau, 2);
  assert.equal(b.vue.amiNiveau, 4);
  a.fermer(); b.fermer();
});

test('combat automatique en ligne : seulement si les deux le demandent, même résultat des deux côtés', async () => {
  // Les deux le demandent : fin directe, même combat.
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote', null, () => undefined, { niveauCompte: 10 });
  const b = new Duel(salle('b'), 'invite', null, () => undefined, { niveauCompte: 3 });
  await attendre();
  a.choisirAuto(true);
  b.choisirAuto(true);
  await attendreQue(() => a.vue.autoAmi && b.vue.autoAmi);
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('europe', undefined);
  await attendreQue(() => a.vue.phase === 'fin' && b.vue.phase === 'fin');
  assert.equal(a.vue.auto, true);
  assert.equal(b.vue.auto, true);
  assert.ok(a.vue.etat!.termine);
  assert.deepEqual(a.vue.etat!.journal, b.vue.etat!.journal);
  assert.equal(a.vue.tours.length, b.vue.tours.length);
  // Une fois le lutteur choisi, on ne peut plus changer d'avis.
  a.choisirAuto(false);
  assert.equal(a.vue.autoMoi, true);
  a.fermer(); b.fermer();

  // Un seul le demande : combat normal, tour par tour.
  const salle2 = salleMemoire();
  const c = new Duel(salle2('c'), 'hote', null, () => undefined, { niveauCompte: 5 });
  const d = new Duel(salle2('d'), 'invite', null, () => undefined, { niveauCompte: 5 });
  await attendre();
  c.choisirAuto(true);
  c.choisirLutteur('usa', undefined);
  d.choisirLutteur('europe', undefined);
  await attendreQue(() => c.vue.phase === 'combat' && d.vue.phase === 'combat');
  assert.equal(c.vue.phase, 'combat');
  assert.equal(c.vue.auto, false);
  assert.equal(d.vue.autoAmi, true);
  c.fermer(); d.fermer();
});

test('en ligne : le lutteur de test Cocoach ne peut pas être choisi', async () => {
  const { ID_LUTTEUR_TEST } = await import('../src/moteur/config');
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote', null, () => undefined);
  await attendre();
  a.choisirLutteur(ID_LUTTEUR_TEST, undefined);
  await attendre();
  assert.equal(a.vue.monLutteur, null);
  a.fermer();
});

test('en ligne : l\'hôte quitte puis revient avec le code (comme invité) : les rôles se rétablissent et le combat démarre', async () => {
  const salle = salleMemoire();
  const hote = new Duel(salle('a'), 'hote', null, () => undefined);
  const invite = new Duel(salle('b'), 'invite', null, () => undefined);
  await attendreQue(() => hote.vue.amiPresent && invite.vue.amiPresent);
  hote.fermer(); // il quitte la salle
  await attendreQue(() => !invite.vue.amiPresent);
  const revenu = new Duel(salle('c'), 'invite', null, () => undefined); // il revient avec le code
  await attendreQue(() => revenu.vue.amiPresent && invite.vue.amiPresent);
  assert.notEqual(revenu.role, invite.role);
  revenu.choisirLutteur('usa', undefined);
  invite.choisirLutteur('europe', undefined);
  await attendreQue(() => revenu.vue.phase === 'combat' && invite.vue.phase === 'combat');
  assert.equal(revenu.vue.graine, invite.vue.graine);
  revenu.fermer(); invite.fermer();
});

for (const cas of ['une autre action de sa carte', 'une action que sa carte n\'a pas'] as const) {
  test(`triche : un ami qui dévoile ${cas} au lieu de celle envoyée est détecté`, async () => {
    const salle = salleMemoire();
    const a = new Duel(salle('a'), 'hote');
    const vraie = salle('b');
    const deck = trouverLutteur('japon').actions.map((x) => coder({ action: x }));
    const absente = coder({ action: 'german_suplex' });
    // Salle truquée : le choix dévoilé n'est pas celui qui a été envoyé en secret.
    const truquee: Salle = {
      ...vraie,
      publier(p) {
        const q = JSON.parse(JSON.stringify(p));
        if (q.rev && q.t === 0) q.rev.c = cas === 'une autre action de sa carte' ? deck.find((x) => x !== q.rev.c) : absente;
        vraie.publier(q);
      },
    };
    const b = new Duel(truquee, 'invite');
    joueurAuto(a, 1);
    joueurAuto(b, 2);
    await attendre();
    a.choisirLutteur('usa', undefined);
    b.choisirLutteur('japon', undefined);
    await attendreQue(() => a.vue.desaccord, 20000);
    assert.equal(a.vue.desaccord, true);
    a.fermer(); b.fermer();
  });
}

// ---------- Mode Enchaînement entre amis ----------

function joueurAutoSeq(d: Duel, graine: number) {
  const h = creerHasard(graine);
  const stats = { initiatives: 0, faces: 0 };
  let dernier = '';
  const agir = () => {
    const vv = d.vue;
    if (vv.phase !== 'combat' || !vv.etat) return;
    const cle = `${vv.etat.tourGlobal}:${vv.aChoisir}:${!!vv.initiative}:${vv.pileOuFace}:${vv.tours.length}`;
    if (cle === dernier) return;
    if (vv.aChoisir || vv.initiative || vv.pileOuFace) dernier = cle;
    if (vv.aChoisir) void d.jouerSequence(sequenceOrdinateur(vv.etat, vv.moi, h, 'normal'));
    else if (vv.initiative && vv.maSequence) {
      stats.initiatives++;
      const seq = [...vv.maSequence];
      if (h() < 0.5) seq[seq.length - 1] = { action: 'lutte' }; // change sa dernière action (Lutte : toujours jouable)
      d.deciderSequence(seq);
    } else if (vv.pileOuFace) {
      stats.faces++;
      d.annoncer(h() < 0.5 ? 'pile' : 'face');
    }
  };
  d.surVue(() => queueMicrotask(agir));
  const veille = setInterval(() => {
    if (d.vue.phase === 'fin') clearInterval(veille);
    else agir();
  }, 20);
  veille.unref?.();
  return stats;
}

test('codage d\'une séquence aller-retour', () => {
  const seq = [{ action: 'double_jambe' as const, speciale: true }, { action: 'lutte' as const }, { action: 'souffle' as const }];
  assert.deepEqual(decoderSequence(coderSequence(seq)), seq);
});

test('mode Enchaînement entre amis : combats complets, même combat des deux côtés, initiative et pile ou face', async () => {
  let initiatives = 0, faces = 0;
  for (let partie = 0; partie < 40 && (partie < 8 || faces === 0 || initiatives === 0); partie++) {
    const salle = salleMemoire();
    const a = new Duel(salle('a'), 'hote', null, undefined, { rapide: partie % 2 === 0, enchainement: true });
    const b = new Duel(salle('b'), 'invite');
    const sa = joueurAutoSeq(a, partie * 2 + 1);
    const sb = joueurAutoSeq(b, partie * 2 + 2);
    await attendre();
    a.choisirLutteur(['usa', 'japon', 'europe-technicien', 'russie-contre'][partie % 4], undefined);
    b.choisirLutteur(['afrique', 'europe', 'japon-contre', 'usa-defenseur'][partie % 4], undefined);
    await attendreQue(() => a.vue.phase === 'fin' && b.vue.phase === 'fin');
    assert.equal(a.vue.phase, 'fin', `partie ${partie} : l'hôte n'a pas fini`);
    assert.equal(b.vue.phase, 'fin', `partie ${partie} : l'invité n'a pas fini`);
    assert.equal(a.vue.enchainement && b.vue.enchainement, true);
    assert.equal(a.vue.etat!.enchainement, true);
    assert.deepEqual(a.vue.etat!.journal, b.vue.etat!.journal);
    assert.equal(a.vue.desaccord || b.vue.desaccord, false);
    assert.ok(a.vue.tours.every((t) => t.sequence! >= 1));
    initiatives += sa.initiatives + sb.initiatives;
    faces += sa.faces + sb.faces;
    a.fermer(); b.fermer();
  }
  assert.ok(faces > 0, 'au moins un pile ou face');
  assert.ok(initiatives > 0, 'au moins une initiative');
});

test('mode Enchaînement entre amis : une séquence modifiée après l\'envoi est détectée', async () => {
  const salle = salleMemoire();
  const a = new Duel(salle('a'), 'hote', null, undefined, { rapide: true, enchainement: true });
  const vraie = salle('b');
  const deck = trouverLutteur('japon').actions.map((x) => coder({ action: x }));
  const truquee: Salle = {
    ...vraie,
    publier(p) {
      const q = JSON.parse(JSON.stringify(p));
      if (q.rev && q.t === 0) q.rev.c = coderSequence(decoderSequence(q.rev.c).reverse()) === q.rev.c ? q.rev.c + deck[1] - (q.rev.c % 128) : coderSequence(decoderSequence(q.rev.c).reverse());
      vraie.publier(q);
    },
  };
  const b = new Duel(truquee, 'invite');
  joueurAutoSeq(a, 1);
  joueurAutoSeq(b, 2);
  await attendre();
  a.choisirLutteur('usa', undefined);
  b.choisirLutteur('japon', undefined);
  await attendreQue(() => a.vue.desaccord, 20000);
  assert.equal(a.vue.desaccord, true);
  a.fermer(); b.fermer();
});

test('durée infinie entre amis : le combat va jusqu\'au tombé, même combat des deux côtés', async () => {
  for (let partie = 0; partie < 3; partie++) {
    const salle = salleMemoire();
    const a = new Duel(salle('a'), 'hote', null, undefined, { infini: true, enchainement: partie === 2, epuisement: 30 });
    const b = new Duel(salle('b'), 'invite');
    if (partie === 2) { joueurAutoSeq(a, 5); joueurAutoSeq(b, 6); } else { joueurAuto(a, partie + 1); joueurAuto(b, partie + 7); }
    await attendre();
    a.choisirLutteur('usa', undefined);
    b.choisirLutteur('japon', undefined);
    await attendreQue(() => a.vue.phase === 'fin' && b.vue.phase === 'fin');
    assert.equal(a.vue.phase, 'fin');
    assert.equal(b.vue.infini, true);
    assert.equal(b.vue.epuisement, 30);
    assert.equal(a.vue.etat!.infini, true);
    assert.equal(b.vue.etat!.epuisementDes, 30);
    assert.equal(a.vue.etat!.finPar, 'tombe');
    assert.deepEqual(a.vue.etat!.journal, b.vue.etat!.journal);
    a.fermer(); b.fermer();
  }
});
