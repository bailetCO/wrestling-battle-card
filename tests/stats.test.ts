// Statistiques anonymes : accord du joueur, contenu d'une fiche, envoi par lots.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { choixOrdinateur, creerHasard } from '../src/moteur';
import { HUMAIN, Partie, type TourJoue } from '../src/page/partie';
import {
  ECART_MS, TAILLE_LOT, accord, choisirAccord, enAttente, enregistrer, envoiPermis, envoyerLot, ficheCombat, ficheParcours, garderPratique,
  resumeActions, type DeposerLot, type Fiche,
} from '../src/page/stats';
import { VERSION } from '../src/page/nouveautes';

const stock = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => stock.get(k) ?? null, setItem: (k: string, v: string) => void stock.set(k, v),
  removeItem: (k: string) => void stock.delete(k),
};

function combat(graine: number) {
  const p = new Partie('usa', 'iran-2', graine, 'normal');
  const tours: TourJoue[] = [];
  const rnd = creerHasard(graine + 7);
  while (!p.etat.termine) {
    const h = choixOrdinateur(p.etat, HUMAIN, rnd, 'normal');
    const o = p.reactionOrdi(h, p.choixOrdi());
    let r = p.resoudre(h, o, false);
    if (r === 'pileOuFace') r = p.resoudre(h, o, false, 'pile');
    if (r !== 'pileOuFace') tours.push(r);
  }
  return { p, tours };
}

test('accord : rien ne part sans un oui, ni en dessous de 15 ans', () => {
  stock.clear();
  assert.equal(accord().choix, null, 'pas encore demandé');
  assert.equal(enregistrer(ficheParcours('essai')), false);
  choisirAccord(true, false);
  assert.equal(accord().choix, 'non', 'oui sans avoir 15 ans : non');
  assert.equal(envoiPermis(), false);
  choisirAccord(true, true);
  assert.equal(envoiPermis(), true);
  assert.equal(enregistrer(ficheParcours('essai')), true);
  assert.equal(enAttente(), 1);
  choisirAccord(false, true);
  assert.equal(enAttente(), 0, 'un refus efface aussi ce qui attendait');
});

test('fiche de combat : ce qu\'il faut pour équilibrer, rien de personnel', () => {
  stock.clear();
  garderPratique('competition');
  const { p, tours } = combat(11);
  const f = ficheCombat({ etat: p.etat, moi: 0, tours, mode: 'carriere', niveau: 'normal', auto: false, dureeMs: 185_400 });
  assert.equal(f.type, 'combat');
  assert.equal(f.version, VERSION);
  assert.equal(f.moi, 'usa');
  assert.equal(f.adv, 'iran-2');
  assert.equal(f.resultat, p.etat.vainqueur === 0 ? 'victoire' : 'defaite');
  assert.equal(f.scoreMoi, p.etat.joueurs[0].score);
  assert.equal(f.duree, 185);
  assert.equal(f.pratique, 'competition');
  assert.match(String(f.jour), /^\d{4}-\d{2}-\d{2}$/);
  for (const interdit of ['pseudo', 'coach', 'email', 'nom', 'idCoach']) assert.ok(!(interdit in f), `pas de champ ${interdit}`);
  // Chaque tour compte une fois de chaque côté.
  const total = (s: string) => s.split(',').reduce((n, x) => n + Number(x.split(':')[1].split('/')[0]), 0);
  assert.equal(total(String(f.actionsMoi)), tours.length);
  assert.equal(total(String(f.actionsAdv)), tours.length);
});

test('actions : les points marqués sont comptés pour le bon joueur, même en ligne côté invité', () => {
  const { p, tours } = combat(29);
  const marques = (j: 0 | 1) => tours.filter((t, i) => (tours[i + 1]?.avant ?? p.etat).joueurs[j].score > t.avant.joueurs[j].score).length;
  const reussites = (s: string) => s.split(',').reduce((n, x) => n + Number(x.split('/')[1]), 0);
  assert.equal(reussites(resumeActions(tours, p.etat, 0, 'humain')), marques(0));
  assert.equal(reussites(resumeActions(tours, p.etat, 1, 'ordi')), marques(1));
  // Vu du téléphone de l'invité : ses choix sont rangés en « humain », ses points sont ceux du joueur 1.
  const inverses = tours.map((t) => ({ ...t, choixHumain: t.choixOrdi, choixOrdi: t.choixHumain }));
  assert.equal(resumeActions(inverses, p.etat, 1, 'humain'), resumeActions(tours, p.etat, 1, 'ordi'));
});

test('envoi : par lots de 20, pas plus d\'un lot toutes les 35 s, rien de perdu sans réseau', async () => {
  stock.clear();
  choisirAccord(true, true);
  for (let i = 0; i < 45; i++) enregistrer(ficheParcours('essai', String(i)));
  const lots: Fiche[][] = [];
  const ok: DeposerLot = async (_c, docs) => { lots.push(docs); return true; };
  let t = 1_000_000;
  assert.equal(await envoyerLot(ok, t), TAILLE_LOT);
  assert.equal(await envoyerLot(ok, t + 5_000), 0, 'trop tôt');
  t += ECART_MS;
  const horsLigne: DeposerLot = async () => { throw new Error('réseau'); };
  assert.equal(await envoyerLot(horsLigne, t), 0);
  assert.equal(enAttente(), 25, 'rien de perdu');
  t += ECART_MS;
  assert.equal(await envoyerLot(ok, t), 20);
  t += ECART_MS;
  assert.equal(await envoyerLot(ok, t), 5);
  assert.equal(enAttente(), 0);
  assert.deepEqual(lots.flat().map((f) => f.valeur), Array.from({ length: 45 }, (_, i) => String(i)), 'dans l\'ordre, sans doublon');
});

test('envoi : une fiche refusée trois fois par Firebase est abandonnée', async () => {
  stock.clear();
  choisirAccord(true, true);
  enregistrer(ficheParcours('refusee'));
  const refuse: DeposerLot = async () => false;
  let t = 5_000_000;
  for (let i = 0; i < 3; i++) { await envoyerLot(refuse, t); t += ECART_MS; }
  assert.equal(enAttente(), 0);
});

test('règles Firestore : statistiques contrôlées, un lot toutes les 30 secondes', () => {
  const r = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
  const stats = r.slice(r.indexOf('match /stats/'), r.indexOf('match /limites/'));
  assert.match(stats, /type in \['combat', 'parcours'\]/);
  assert.match(stats, /limite\('stats'\)/);
  assert.doesNotMatch(stats, /'pseudo'|'email'/, 'aucun champ personnel accepté');
  assert.match(r, /resource\.data\.stats \+ duration\.value\(30, 's'\)/);
  // Les champs d'une fiche sont tous acceptés par les règles.
  const { p, tours } = combat(5);
  const f = ficheCombat({ etat: p.etat, moi: 0, tours, mode: 'amis', niveau: '', auto: true, dureeMs: 0 });
  for (const k of [...Object.keys(f), ...Object.keys(ficheParcours('x', 'y'))]) assert.match(stats, new RegExp(`'${k}'`), `champ ${k} accepté`);
});
