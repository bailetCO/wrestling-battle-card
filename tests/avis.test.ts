// Avis et signalements de bug : questionnaire, envoi (et file d'attente), invitation, combat rejoué.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { choixOrdinateur, creerHasard, sequenceOrdinateur } from '../src/moteur';
import { Partie, HUMAIN } from '../src/page/partie';
import {
  QUESTIONS, avisEnvoye, avisInvite, compterCombat, construireAvis, construireBug, envoyer, inviterAvis, viderFile,
  type Deposer, type ReponsesAvis,
} from '../src/page/avis';
import { versFirestore } from '../src/page/firebase';
import { VERSION } from '../src/page/nouveautes';

const stock = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => stock.get(k) ?? null, setItem: (k: string, v: string) => void stock.set(k, v),
  removeItem: (k: string) => void stock.delete(k), clear: () => stock.clear(),
};

const reponses = (x: Partial<ReponsesAvis> = {}): ReponsesAvis => ({
  pseudo: 'Testeur', age15: true, email: 'testeur@exemple.fr', note: 4, prefere: ['Les combats'], difficile: [], difficileTexte: '',
  lutteur: '', sens: '', pratique: 'loisir', texte: 'Super jeu', ...x,
});

test('avis : la note est obligatoire, l\'adresse est vérifiée, les réponses sont nettoyées', () => {
  assert.equal(typeof construireAvis(reponses({ note: 0 })), 'string', 'sans note');
  assert.equal(typeof construireAvis(reponses({ email: 'pas-une-adresse' })), 'string', 'adresse incomplète');
  assert.equal(typeof construireAvis(reponses({ lutteur: 'usa', sens: '' })), 'string', 'lutteur sans « fort » ni « faible »');
  const d = construireAvis(reponses({
    prefere: ['Les combats', 'choix inventé'], texte: 'x'.repeat(900), pseudo: 'Un pseudo beaucoup trop long',
    lutteur: 'usa', sens: 'fort',
  }));
  assert.ok(typeof d !== 'string');
  assert.equal(d.type, 'avis');
  assert.equal(d.version, VERSION);
  assert.deepEqual(d.prefere, ['Les combats'], 'seulement les choix proposés');
  assert.equal(String(d.texte).length, 500);
  assert.ok(String(d.pseudo).length <= 16);
  assert.equal(d.email, 'testeur@exemple.fr');
  assert.equal(d.sens, 'fort');
});

test('avis : moins de 15 ans, aucune adresse n\'est envoyée', () => {
  const d = construireAvis(reponses({ age15: false, email: 'enfant@exemple.fr' }));
  assert.ok(typeof d !== 'string');
  assert.equal(d.email, null);
  assert.equal(d.age15, false);
});

test('bug : description obligatoire, contexte joint, combat trop long retiré', () => {
  const c = { ecranJeu: 'tournois', appareil: 'Mozilla/5.0 (iPhone)', ecran: '390×844', combat: { graine: 42 } };
  assert.equal(typeof construireBug('bug', 'T', true, '', c), 'string');
  const d = construireBug('L\'écran reste bloqué après le pile ou face.', 'T', true, '', c);
  assert.ok(typeof d !== 'string');
  assert.equal(d.type, 'bug');
  assert.equal(d.ecranJeu, 'tournois');
  assert.equal(d.combat, '{"graine":42}');
  assert.equal(d.email, null);
  const gros = construireBug('Bug avec un énorme combat', 'T', true, '', { ...c, combat: { x: 'y'.repeat(30_000) } });
  assert.ok(typeof gros !== 'string' && gros.combat === null);
});

test('envoi : sans réseau, l\'avis attend et repart à la connexion suivante', async () => {
  stock.clear();
  const recus: unknown[] = [];
  const horsLigne: Deposer = async () => { throw new Error('réseau'); };
  const enLigne: Deposer = async (_c, d) => { recus.push(d); return true; };
  const refuse: Deposer = async () => false;
  assert.equal(await envoyer(horsLigne, 'avis', { type: 'avis', note: 5 }, 'avis'), 'attente');
  assert.equal(JSON.parse(stock.get('wbc-envois')!).length, 1);
  assert.equal(await envoyer(refuse, 'avis', { type: 'avis', note: 3 }, 'avis'), 'refuse', 'refus de Firebase : pas réessayé');
  assert.equal(JSON.parse(stock.get('wbc-envois')!).length, 1);
  assert.equal(await viderFile(horsLigne), 0);
  assert.equal(await viderFile(enLigne), 1);
  assert.deepEqual(recus, [{ type: 'avis', note: 5 }]);
  assert.equal(JSON.parse(stock.get('wbc-envois')!).length, 0);
});

test('invitation à donner son avis : une seule fois, après le 5e combat', () => {
  stock.clear();
  for (let i = 0; i < 4; i++) compterCombat();
  assert.equal(inviterAvis(), false);
  compterCombat();
  assert.equal(inviterAvis(), true);
  avisInvite();
  assert.equal(inviterAvis(), false, 'refusée : plus proposée');
  stock.clear();
  for (let i = 0; i < 6; i++) compterCombat();
  avisEnvoye();
  assert.equal(inviterAvis(), false, 'déjà envoyé');
});

test('questionnaire : les choix et les textes sont écrits', () => {
  assert.ok(QUESTIONS.prefere.choix.length <= 8, 'Firebase accepte 8 choix au plus');
  assert.ok(QUESTIONS.difficile.choix.length <= 10, 'Firebase accepte 10 choix au plus');
  assert.deepEqual(Object.keys(QUESTIONS.pratique.choix), ['jamais', 'loisir', 'competition', 'entraineur']);
});

test('Firestore : les réponses sont traduites dans son format, les champs vides omis', () => {
  assert.deepEqual(versFirestore({ a: 'x', n: 4, ok: true, l: ['p', 'q'], vide: '', rien: null }), {
    a: { stringValue: 'x' }, n: { integerValue: '4' }, ok: { booleanValue: true }, l: { arrayValue: { values: [{ stringValue: 'p' }, { stringValue: 'q' }] } },
  });
});

// ---------- Rejouer le dernier combat d'un signalement ----------

function jouerCombat(graine: number, enchainement: boolean) {
  const p = new Partie('usa', 'iran-2', graine, 'fort', undefined, [], false, undefined, enchainement);
  const choixJoueur = creerHasard(graine + 1);
  let garde = 0;
  while (!p.etat.termine && garde++ < 400) {
    if (enchainement) {
      const h = sequenceOrdinateur(p.etat, HUMAIN, choixJoueur, 'normal');
      const o = p.sequenceOrdi();
      const faces: ('pile' | 'face')[] = [];
      let r = p.resoudreSequence(h, o, false, faces);
      while (r === 'pileOuFace') { faces.push(faces.length % 2 ? 'face' : 'pile'); r = p.resoudreSequence(h, o, false, faces); }
    } else {
      const h = choixOrdinateur(p.etat, HUMAIN, choixJoueur, 'normal');
      const o = p.reactionOrdi(h, p.choixOrdi());
      let r = p.resoudre(h, o, false);
      if (r === 'pileOuFace') r = p.resoudre(h, o, false, 'face');
    }
  }
  return p;
}

test('signalement de bug : le dernier combat se rejoue exactement à l\'identique', () => {
  for (const enchainement of [false, true]) {
    for (const graine of [3, 17, 2024]) {
      const p = jouerCombat(graine, enchainement);
      assert.ok(p.etat.termine, 'combat terminé');
      const rapport = JSON.parse(JSON.stringify(p.rapport())); // comme envoyé à Firebase
      assert.ok(JSON.stringify(rapport).length < 20_000, 'le rapport tient dans la limite de Firebase');
      const rejoue = Partie.rejouer(rapport);
      assert.deepEqual(
        rejoue.joueurs.map((j) => [j.score, j.endurance, j.periodesGagnees]), p.etat.joueurs.map((j) => [j.score, j.endurance, j.periodesGagnees]),
        `graine ${graine}${enchainement ? ', Enchaînement' : ''}`,
      );
      assert.equal(rejoue.vainqueur, p.etat.vainqueur);
      assert.deepEqual(rejoue.journal, p.etat.journal);
    }
  }
});

test('règles Firestore : dépôt seulement, champs contrôlés, un avis par minute', () => {
  const r = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
  assert.match(r, /match \/avis\/\{id\} \{\s+allow create:/);
  assert.doesNotMatch(r.slice(r.indexOf('match /avis/'), r.indexOf('match /limites/')), /allow (read|update|delete|write)/);
  assert.match(r, /duration\.value\(60, 's'\)/);
  assert.match(r, /hasOnly\(\['type', 'version', 'uid', 'envoye', 'pseudo', 'email'/);
  assert.match(r, /allow read, write: if false;/);
});
