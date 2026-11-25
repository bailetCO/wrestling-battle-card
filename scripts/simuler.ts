// Mesure le taux de victoire de chaque lutteur contre des adversaires tirés au hasard parmi tous les
// lutteurs, avec l'ordinateur au hasard puis l'ordinateur fort (des deux côtés), et vérifie que
// chacun est dans la fourchette de sa rareté.
// Usage : npm run simuler -- [combats par lutteur au hasard] [combats par lutteur en fort]
// Exemple : npm run simuler -- 1200 300

import { LUTTEURS, NATIONS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixAleatoire, choixFort } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';
import type { Rarete } from '../src/moteur/types';

const nombres = process.argv.slice(2).filter((x) => /^\d+$/.test(x)).map(Number);
const parHasard = nombres[0] ?? 600;
const parFort = nombres[1] ?? 150;

// Fourchettes : leur moyenne (pondérée par 4 communes, 3 rares, 2 épiques, 1 légendaire) fait 50 %.
const FOURCHETTES: Record<Rarete, [number, number]> = {
  champion: [0.625, 0.675], legendaire: [0.575, 0.625], epique: [0.525, 0.575], rare: [0.475, 0.525], commune: [0.425, 0.475],
};

function mesurer(n: number, fort: boolean): number[] {
  const choisir = fort ? choixFort : choixAleatoire;
  let graine = fort ? 900000 : 1;
  return LUTTEURS.map((a, i) => {
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
  });
}

const h = mesurer(parHasard, false);
const f = mesurer(parFort, true);
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
let dans = 0, presque = 0;
console.log(`\n${LUTTEURS.length * (parHasard + parFort)} combats simulés (${parHasard} par lutteur au hasard, ${parFort} en fort)\n`);
for (const n of NATIONS) {
  console.log(`----- ${n.nom} -----`);
  LUTTEURS.map((l, i) => ({ l, m: (h[i] + f[i]) / 2, h: h[i], f: f[i] })).filter((x) => x.l.nation === n.id)
    .sort((x, y) => y.m - x.m)
    .forEach((x) => {
      const [lo, hi] = FOURCHETTES[x.l.rarete];
      const ok = x.m >= lo && x.m <= hi;
      const proche = !ok && x.m >= lo - 0.01 && x.m <= hi + 0.01;
      if (ok) dans++; else if (proche) presque++;
      console.log(`${x.l.nom.padEnd(26)} ${x.l.rarete.padEnd(10)} hasard ${pct(x.h)} · fort ${pct(x.f)} · moyenne ${pct(x.m)} ${ok ? '' : proche ? '(à 1 point près)' : x.m > hi ? 'TROP FORT' : 'TROP FAIBLE'}`);
    });
}
console.log(`\nDans la fourchette : ${dans}/${LUTTEURS.length} · à 1 point près : ${presque}`);
