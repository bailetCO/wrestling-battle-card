// Parrainage (27/11/2026) : lien perso, accueil d'un nouveau joueur, récompenses du parrain
// (plafond, carte légendaire au 3e), et fiches en ligne (Firebase simulé).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REGLES, trouverLutteur } from '../src/moteur';
import { depuisSauvegarde, nouvelleCollection } from '../src/page/collection';
import { changerSession } from '../src/page/firebase';
import { accueillirParrain, declarerParrain, lienParrainage, lireLienParrain, nouveauxAmisInvites, recompenseParrain } from '../src/page/parrainage';

beforeEach(() => changerSession(null));

test('lien perso : identifiant et pseudo, relus à l\'arrivée', () => {
  const c = nouvelleCollection();
  c.coach = 'Corentin B';
  const lien = lienParrainage(c);
  assert.match(lien, /^https:\/\/bailetco\.github\.io\/wrestling-battle-card\/\?parrain=/);
  assert.deepEqual(lireLienParrain(new URL(lien)), { id: c.idCoach, pseudo: 'Corentin B' });
  assert.equal(lireLienParrain(new URL('https://x.fr/?parrain=<script>')), null);
  assert.equal(lireLienParrain(new URL('https://x.fr/')), null);
});

test('nouveau joueur invité : booster rare de bienvenue, et son parrain devient son ami', () => {
  const c = nouvelleCollection();
  const r = accueillirParrain(c, { id: 'abcdef123', pseudo: 'Tom' });
  assert.equal(r?.type, 'filleul');
  assert.equal(r?.type === 'filleul' && r.cadeau.type, 'rare');
  assert.deepEqual(c.parrain, { id: 'abcdef123', pseudo: 'Tom', declare: false });
  assert.equal(c.amis.abcdef123.pseudo, 'Tom');
  assert.equal(accueillirParrain(c, { id: 'autre12345', pseudo: 'Léa' })?.type, 'ami'); // un seul parrain
});

test('joueur qui jouait déjà : juste amis ; son propre lien : rien', () => {
  const c = nouvelleCollection();
  c.coach = 'Ana';
  c.victoires = 4;
  assert.equal(accueillirParrain(c, { id: 'abcdef123', pseudo: 'Tom' })?.type, 'ami');
  assert.equal(c.parrain, null);
  assert.ok(c.amis.abcdef123);
  assert.equal(accueillirParrain(c, { id: c.idCoach, pseudo: 'Ana' }), null);
});

test('parrain : 1 booster rare par ami, une légendaire au 3e, 10 au plus', () => {
  const c = nouvelleCollection();
  const lots = Array.from({ length: 12 }, () => recompenseParrain(c));
  assert.equal(lots[0]?.length, 1);
  assert.equal(lots[0]?.[0].type, 'rare');
  const bonus = lots[REGLES.parrainage.bonusLegendaireAu - 1]!;
  assert.equal(bonus.length, 2);
  assert.equal(trouverLutteur(bonus[1].cartes[0]).rarete, 'legendaire');
  assert.equal(lots[9]?.length, 1);
  assert.equal(lots[10], null);
  assert.equal(c.parrainage.recompenses, 10);
});

test('parrainage gardé dans la sauvegarde', () => {
  const c = nouvelleCollection();
  accueillirParrain(c, { id: 'abcdef123', pseudo: 'Tom' });
  c.parrainage = { vus: ['f:x1y2z3a4'], recompenses: 2, partage: true };
  const d = depuisSauvegarde(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(d.parrain, c.parrain);
  assert.deepEqual(d.parrainage, c.parrainage);
});

// ---------- En ligne ----------

let appels: { url: string; corps: Record<string, unknown> | null }[] = [];
function simuler(reponses: unknown[], statut = 200) {
  appels = [];
  let i = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    appels.push({ url: String(url), corps: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(reponses[i++] ?? {}), { status: statut });
  }) as typeof fetch;
}
const connecte = () => changerSession({ uid: 'u-moi', jeton: 't', renouvellement: 'r', expire: Date.now() + 3_600_000, compte: { email: 'a@b.fr', fournisseur: 'password' } });

test('filleul avec un compte : signale son parrain une seule fois', async () => {
  const c = nouvelleCollection();
  c.coach = 'Léa';
  c.parrain = { id: 'abcdef123', pseudo: 'Tom', declare: false };
  assert.equal(await declarerParrain(c), false); // pas de compte : rien
  connecte();
  simuler([{}]);
  assert.ok(await declarerParrain(c));
  const w = (appels[0].corps!.writes as { update: { name: string; fields: Record<string, { stringValue: string }> }; currentDocument: { exists: boolean } }[])[0];
  assert.match(w.update.name, /\/parrainages\/u-moi$/);
  assert.equal(w.update.fields.parrain.stringValue, 'abcdef123');
  assert.deepEqual(w.currentDocument, { exists: false });
  assert.equal(c.parrain.declare, true);
  assert.equal(await declarerParrain(c), false); // déjà fait
});

test('parrain : nouveaux amis arrivés par son lien, comptés une seule fois', async () => {
  connecte();
  const c = nouvelleCollection();
  const doc = (id: string, pseudo: string) => ({ document: { name: `x/${id}`, fields: { idCoach: { stringValue: id }, pseudo: { stringValue: pseudo } } } });
  simuler([[doc('filleul111', 'Léa')], [doc('amiami222', 'Max')]]);
  const n = await nouveauxAmisInvites(c);
  assert.deepEqual(n, [{ id: 'filleul111', pseudo: 'Léa', filleul: true }, { id: 'amiami222', pseudo: 'Max', filleul: false }]);
  simuler([[doc('filleul111', 'Léa')], []]);
  assert.deepEqual(await nouveauxAmisInvites(c), []);
});
