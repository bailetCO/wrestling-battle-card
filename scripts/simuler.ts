// Mesure le taux de victoire de chaque lutteur contre des adversaires tirés au hasard parmi tous les
// lutteurs, avec l'ordinateur au hasard puis l'ordinateur fort (des deux côtés), et vérifie que
// chacun est dans la fourchette de sa rareté.
// Usage : npm run simuler -- [combats par lutteur au hasard] [combats par lutteur en fort] [options]
// Exemple : npm run simuler -- 1200 300
// Options (utilisées par la skill /equilibrage) :
//   --sauver fichier.json      garde les résultats, pour comparer plus tard
//   --avant fichier.json       compare avec des résultats gardés : affiche l'écart pour chaque lutteur
//   --lutteurs id1,id2         ne mesure que ces lutteurs (toujours contre les 120) : plus rapide
// Les 12 cartes Champion du Monde sont aussi mesurées (contre les 120 lutteurs ordinaires).
// Les combats sont rejouables : mêmes chiffres = mêmes résultats.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CARTES_SPECIALES, CHAMPIONS, LUTTEURS, NATIONS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixAleatoire, choixFort } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import type { Rarete } from '../src/moteur/types';

const args = process.argv.slice(2);
const option = (nom: string) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
const valeursOptions = new Set(['--sauver', '--avant', '--lutteurs'].map(option));
const nombres = args.filter((x) => /^\d+$/.test(x) && !valeursOptions.has(x)).map(Number);
const parHasard = nombres[0] ?? 600;
const parFort = nombres[1] ?? 150;
const fichierSauver = option('--sauver');
const fichierAvant = option('--avant');
const choisis = option('--lutteurs')?.split(',').map((x) => x.trim()).filter(Boolean);
const CARTES = [...LUTTEURS, ...CHAMPIONS, ...CARTES_SPECIALES];
if (choisis) for (const id of choisis) if (!CARTES.some((l) => l.id === id)) throw new Error(`Lutteur inconnu : ${id}`);

// Fourchettes : leur moyenne (pondérée par 4 communes, 3 rares, 2 épiques, 1 légendaire) fait 50 %.
const FOURCHETTES: Record<Rarete, [number, number]> = {
  champion: [0.625, 0.675], legendaire: [0.575, 0.625], epique: [0.525, 0.575], rare: [0.475, 0.525], commune: [0.425, 0.475],
};
// Au-delà de cet écart entre « ordinateur au hasard » et « ordinateur fort », la carte dépend trop de
// la façon de jouer : forte contre un débutant, faible contre un bon joueur (ou l'inverse).
const ECART_MAX = 0.25;

// Les graines dépendent du rang du lutteur, pas de l'ordre de mesure : mesurer un seul lutteur
// donne exactement le même résultat que dans la simulation complète. Adversaires : les 120 lutteurs.
function mesurer(n: number, fort: boolean, i: number): number {
  const choisir = fort ? choixFort : choixAleatoire;
  let graine = (fort ? 900000 : 1) + i * n;
  const a = CARTES[i];
  let v = 0;
  for (let k = 0; k < n; k++) {
    const h = creerHasard(graine++);
    let j = Math.floor(h() * LUTTEURS.length);
    if (j === i) j = (j + 1) % LUTTEURS.length;
    const cote = k % 2;
    let e = cote === 0 ? creerCombat(a, LUTTEURS[j]) : creerCombat(LUTTEURS[j], a);
    while (!e.termine) e = jouerTour(e, choisir(e, 0, h), choisir(e, 1, h), h);
    if (e.vainqueur === cote) v++;
  }
  return v / n;
}

type Resultat = { id: string; nom: string; nation: string; rarete: Rarete; hasard: number; fort: number; moyenne: number; verdict: string };
type Sauvegarde = { parHasard: number; parFort: number; resultats: Resultat[] };

function verdict(rarete: Rarete, m: number): string {
  const [lo, hi] = FOURCHETTES[rarete];
  if (m >= lo && m <= hi) return 'ok';
  if (m >= lo - 0.01 && m <= hi + 0.01) return 'presque';
  return m > hi ? 'trop fort' : 'trop faible';
}

const resultats: Resultat[] = [];
CARTES.forEach((l, i) => {
  if (choisis && !choisis.includes(l.id)) return;
  const h = mesurer(parHasard, false, i);
  const f = mesurer(parFort, true, i);
  const m = (h + f) / 2;
  resultats.push({ id: l.id, nom: l.nom, nation: l.nation, rarete: l.rarete, hasard: h, fort: f, moyenne: m, verdict: verdict(l.rarete, m) });
});

let avant: Map<string, Resultat> | null = null;
if (fichierAvant) {
  const s = JSON.parse(readFileSync(fichierAvant, 'utf8')) as Sauvegarde;
  if (s.parHasard !== parHasard || s.parFort !== parFort) console.log(`Attention : la sauvegarde a été faite avec ${s.parHasard}/${s.parFort} combats, la comparaison est moins fiable.`);
  avant = new Map(s.resultats.map((r) => [r.id, r]));
}

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
const signe = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}`;
const MOTS: Record<string, string> = { ok: '', presque: '(à 1 point près)', 'trop fort': 'TROP FORT', 'trop faible': 'TROP FAIBLE' };
console.log(`\n${resultats.length * (parHasard + parFort)} combats simulés (${parHasard} par lutteur au hasard, ${parFort} en fort)\n`);
for (const n of [...NATIONS, { id: 'champions', nom: 'Champions du Monde' }]) {
  const liste = resultats.filter((r) => (n.id === 'champions' ? r.rarete === 'champion' : r.nation === n.id && r.rarete !== 'champion')).sort((x, y) => y.moyenne - x.moyenne);
  if (!liste.length) continue;
  console.log(`----- ${n.nom} -----`);
  for (const r of liste) {
    const ecart = Math.abs(r.hasard - r.fort) > ECART_MAX ? ' DÉPEND DU NIVEAU' : '';
    const a = avant?.get(r.id);
    const compare = a ? `  [avant ${pct(a.moyenne)}, ${signe(r.moyenne - a.moyenne)} pts${a.verdict !== r.verdict ? `, était ${a.verdict}` : ''}]` : '';
    console.log(`${r.nom.padEnd(26)} ${r.rarete.padEnd(10)} hasard ${pct(r.hasard)} · fort ${pct(r.fort)} · moyenne ${pct(r.moyenne)} ${MOTS[r.verdict]}${ecart}${compare}`);
  }
}
const ordinaires = resultats.filter((r) => r.rarete !== 'champion');
const champions = resultats.filter((r) => r.rarete === 'champion');
const compte = (v: string) => ordinaires.filter((r) => r.verdict === v).length;
const dependants = ordinaires.filter((r) => Math.abs(r.hasard - r.fort) > ECART_MAX).length;
console.log(`\nDans la fourchette : ${compte('ok')}/${ordinaires.length} · à 1 point près : ${compte('presque')} · trop forts : ${compte('trop fort')} · trop faibles : ${compte('trop faible')}`);
console.log(`Dépendent trop du niveau de jeu (écart hasard/fort de plus de ${ECART_MAX * 100} points) : ${dependants}`);
if (champions.length) console.log(`Champions du Monde dans leur fourchette (62,5 à 67,5 %) : ${champions.filter((r) => r.verdict === 'ok').length}/${champions.length}`);
if (avant) {
  const avantOk = ordinaires.filter((r) => avant!.get(r.id)?.verdict === 'ok').length;
  console.log(`Avant : ${avantOk} dans la fourchette · après : ${compte('ok')}`);
}
if (fichierSauver) {
  mkdirSync(dirname(fichierSauver), { recursive: true });
  writeFileSync(fichierSauver, JSON.stringify({ parHasard, parFort, resultats } satisfies Sauvegarde, null, 1));
  console.log(`Résultats gardés dans ${fichierSauver}`);
}
