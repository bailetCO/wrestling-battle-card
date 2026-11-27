// Cartes de haute rareté de base contre des cartes plus faibles montées au même niveau par fusion.
// Idée de Corentin (26/11/2026) : une légendaire de base ne doit pas écraser une commune montée
// légendaire. La carte montée a débloqué de nouvelles actions : l'ordinateur lui compose d'abord
// le meilleur deck de 4 actions (essai de toutes les compositions valides), puis on fait s'affronter
// les cartes, ordinateur fort des deux côtés (des joueurs qui fusionnent leurs cartes savent jouer).
//
// Usage : npm run fusion -- [combats par carte] [--niveau legendaire,epique,rare] [--lutteurs id1,id2] [--echantillon 24]
// Les combats sont rejouables : mêmes chiffres = mêmes résultats.

import { ACTIONS, LUTTEURS, NIVEAUX, TAILLE_DECK, avecDeck, avecGrade, gradeMaxDe, niveauCarte, verifierDeck } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixFort } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import type { DefLutteur, IdAction, NiveauCarte } from '../src/moteur/types';

const args = process.argv.slice(2);
const option = (nom: string) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
const parDuel = Number(args.find((x) => /^\d+$/.test(x)) ?? 200);
const niveaux = (option('--niveau')?.split(',') ?? ['legendaire', 'epique', 'rare']) as NiveauCarte[];
const choisis = option('--lutteurs')?.split(',');
// Nombre de cartes montées gardées par niveau (prises régulièrement dans la liste) : l'optimisation
// des decks est longue (jusqu'à 126 compositions par carte).
const echantillon = Number(option('--echantillon') ?? 24);

// Un combat, ordinateur fort des deux côtés ; rend 1 si `a` gagne.
function combat(a: DefLutteur, b: DefLutteur, graine: number): number {
  const h = creerHasard(graine);
  const cote = graine % 2;
  let e = cote === 0 ? creerCombat(a, b) : creerCombat(b, a);
  while (!e.termine) e = jouerTour(e, choixFort(e, 0, h), choixFort(e, 1, h), h);
  return e.vainqueur === cote ? 1 : 0;
}

function taux(a: DefLutteur, adversaires: DefLutteur[], n: number, graine: number): number {
  let v = 0;
  for (let k = 0; k < n; k++) v += combat(a, adversaires[k % adversaires.length], graine + k);
  return v / n;
}

// Toutes les compositions valides de 4 actions parmi celles que la carte a débloquées.
function decks(def: DefLutteur): IdAction[][] {
  const dispo = def.actionsPossibles.filter((a) => ACTIONS[a]);
  const res: IdAction[][] = [];
  const rec = (i: number, pris: IdAction[]) => {
    if (pris.length === TAILLE_DECK) { if (!verifierDeck(def, pris)) res.push([...pris]); return; }
    for (let k = i; k < dispo.length; k++) rec(k + 1, [...pris, dispo[k]]);
  };
  rec(0, []);
  return res;
}

// Le meilleur deck : un premier tri rapide de toutes les compositions, puis les 4 meilleures
// départagées sur plus de combats. Les adversaires sont les cartes de même niveau.
function meilleurDeck(def: DefLutteur, adversaires: DefLutteur[], graine: number): { deck: IdAction[]; taux: number; essais: number } {
  const tous = decks(def);
  const tri = tous.map((d) => ({ d, t: taux(avecDeck(def, d), adversaires, 20, graine) })).sort((x, y) => y.t - x.t);
  const finale = tri.slice(0, 4).map(({ d }) => ({ d, t: taux(avecDeck(def, d), adversaires, 160, graine + 1000) })).sort((x, y) => y.t - x.t);
  return { deck: finale[0].d, taux: finale[0].t, essais: tous.length };
}

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
const nomAction = (a: IdAction) => ACTIONS[a].nom;

for (const niveau of niveaux) {
  const rang = NIVEAUX.indexOf(niveau);
  // Les cartes de base de ce niveau, et les cartes plus faibles montées à ce niveau (deck optimisé).
  // Les cartes de base passent aussi par avecGrade (grade 1) : elles ont leurs actions débloquées,
  // comme dans le jeu. Les deux camps ont un deck optimisé : chacun choisit ses 4 meilleures actions.
  const deBase = LUTTEURS.filter((l) => l.rarete === niveau && (!choisis || choisis.includes(l.id))).map((l) => avecGrade(l, 1));
  const montees = LUTTEURS.filter((l) => NIVEAUX.indexOf(l.rarete) < rang).map((l) => {
    const grade = rang - NIVEAUX.indexOf(l.rarete) + 1;
    if (grade > gradeMaxDe(l)) return null;
    const def = avecGrade(l, grade);
    return niveauCarte(l, grade) === niveau ? def : null;
  }).filter((x): x is DefLutteur => !!x).filter((_, i, t) => t.length <= echantillon || i % Math.ceil(t.length / echantillon) === 0);
  console.log(`\n===== Niveau ${niveau} : ${deBase.length} cartes de base contre ${montees.length} cartes montées par fusion =====`);
  // 1. Le meilleur deck de chaque carte, contre les cartes de l'autre camp (avec leur deck de départ).
  const optimisees = montees.map((def, i) => {
    const m = meilleurDeck(def, deBase, 50_000 + i * 997);
    return { def: avecDeck(def, m.deck), deckDepart: def.actions, ...m };
  });
  const basesOptimisees = deBase.map((def, i) => avecDeck(def, meilleurDeck(def, montees, 70_000 + i * 991).deck));
  const changes = optimisees.filter((o) => o.deck.some((a) => !o.deckDepart.includes(a))).length;
  console.log(`Decks optimisés : ${changes}/${optimisees.length} cartes montées changent de deck (${optimisees[0]?.essais ?? 0} compositions essayées par carte en moyenne).`);
  // 2. Chaque carte de base contre les cartes montées (deck optimisé) : 50 % = équitable.
  const lignes = basesOptimisees.map((l, i) => {
    const t = taux(l, optimisees.map((o) => o.def), parDuel, 800_000 + i * parDuel);
    return { l, t };
  }).sort((x, y) => y.t - x.t);
  console.log('Carte de base contre les cartes montées au même niveau (50 % = équitable) :');
  for (const { l, t } of lignes) console.log(`  ${l.nom.padEnd(26)} ${pct(t)}${t > 0.6 ? '  TROP FORTE contre les cartes montées' : t < 0.4 ? '  trop faible contre les cartes montées' : ''}`);
  const moyenne = lignes.reduce((s, x) => s + x.t, 0) / (lignes.length || 1);
  console.log(`Moyenne des cartes de base : ${pct(moyenne)} (les cartes montées gagnent donc ${pct(1 - moyenne)})`);
  // 3. Les decks les plus choisis (pour voir les actions débloquées qui comptent).
  const freq = new Map<IdAction, number>();
  for (const o of optimisees) for (const a of o.deck) if (!o.deckDepart.includes(a)) freq.set(a, (freq.get(a) ?? 0) + 1);
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a, n]) => `${nomAction(a)} (${n})`).join(', ');
  if (top) console.log(`Actions débloquées les plus prises dans les decks optimisés : ${top}`);
}
