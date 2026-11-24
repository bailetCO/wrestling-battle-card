// Simule des combats entre les 15 lutteurs, avec l'ordinateur au hasard puis avec
// l'ordinateur fort (des deux côtés), et classe les lutteurs par taux de victoire moyen.
// Usage : npm run simuler -- [combats par duel au hasard] [combats par duel en fort]
// Exemple : npm run simuler -- 300 120

import { LUTTEURS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixAleatoire, choixFort } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import type { Rarete } from '../src/moteur/types';

const nombres = process.argv.slice(2).filter((x) => /^\d+$/.test(x)).map(Number);
const parDuelHasard = nombres[0] ?? 150;
const parDuelFort = nombres[1] ?? 60;

function mesurer(parDuel: number, mode: 'hasard' | 'fort') {
  const victoires: Record<string, number> = {};
  const combats: Record<string, number> = {};
  let graine = 1, total = 0, tombes = 0, tours = 0;
  const choisir = mode === 'fort' ? choixFort : choixAleatoire;
  for (const a of LUTTEURS) {
    for (const b of LUTTEURS) {
      if (a === b) continue;
      for (let i = 0; i < parDuel; i++) {
        const h = creerHasard(graine++);
        let e = creerCombat(a, b);
        while (!e.termine) e = jouerTour(e, choisir(e, 0, h), choisir(e, 1, h), h);
        total++;
        tours += e.tourGlobal;
        if (e.finPar === 'tombe') tombes++;
        const g = e.vainqueur === 0 ? a.id : b.id;
        victoires[g] = (victoires[g] ?? 0) + 1;
        combats[a.id] = (combats[a.id] ?? 0) + 1;
        combats[b.id] = (combats[b.id] ?? 0) + 1;
      }
    }
  }
  const taux = Object.fromEntries(LUTTEURS.map((l) => [l.id, (victoires[l.id] ?? 0) / combats[l.id]]));
  return { taux, total, tombes: tombes / total, tours: tours / total };
}

const FOURCHETTES: Record<Rarete, [number, number]> = {
  legendaire: [0.55, 0.6], epique: [0.5, 0.55], rare: [0.45, 0.5], commune: [0.4, 0.45],
};
// Rareté proposée selon le rang : 2 légendaires, 3 épiques, 5 rares, 5 communes.
const PALIERS: Rarete[] = ['legendaire', 'legendaire', 'epique', 'epique', 'epique', 'rare', 'rare', 'rare', 'rare', 'rare'];

const h = mesurer(parDuelHasard, 'hasard');
const f = mesurer(parDuelFort, 'fort');
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
const classement = LUTTEURS
  .map((l) => ({ l, h: h.taux[l.id], f: f.taux[l.id], m: (h.taux[l.id] + f.taux[l.id]) / 2 }))
  .sort((x, y) => y.m - x.m);

console.log(`\n${h.total + f.total} combats simulés (${parDuelHasard} par duel au hasard, ${parDuelFort} par duel en fort)\n`);
console.log('Rang | Lutteur                        | Hasard  | Fort    | Moyenne | Rareté   | Fourchette');
classement.forEach((x, i) => {
  const [lo, hi] = FOURCHETTES[x.l.rarete];
  const dans = x.m >= lo && x.m <= hi ? 'oui'
    : x.m >= lo - 0.01 && x.m <= hi + 0.01 ? 'oui, à 1 point près'
    : x.m < lo ? 'trop faible' : 'trop fort';
  const propose = PALIERS[i] ?? 'commune';
  console.log(
    `${String(i + 1).padStart(4)} | ${`${x.l.nom} (${x.l.origine})`.padEnd(30)} | ${pct(x.h).padStart(7)} | ${pct(x.f).padStart(7)} | ${pct(x.m).padStart(7)} | ${x.l.rarete.padEnd(8)} | ${dans}${propose !== x.l.rarete ? ` (rang : ${propose})` : ''}`,
  );
});
console.log(`\nFin par tombé : ${pct(h.tombes)} au hasard, ${pct(f.tombes)} en fort`);
console.log(`Durée moyenne : ${h.tours.toFixed(1)} tours au hasard, ${f.tours.toFixed(1)} en fort`);
