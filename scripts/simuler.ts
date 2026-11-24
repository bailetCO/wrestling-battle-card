// Simule des combats entre les 5 lutteurs (ordinateur aléatoire des deux côtés)
// et affiche les taux de victoire. Usage : npm run simuler -- [combats par duel]

import { LUTTEURS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import { choixAleatoire } from '../src/moteur/ia';
import { creerHasard } from '../src/moteur/hasard';

const parDuel = Number(process.argv.find((x) => /^\d+$/.test(x)) ?? 300);
const ids = LUTTEURS.map((l) => l.id);
const stats = Object.fromEntries(
  ids.map((id) => [id, { combats: 0, victoires: 0, tombes: 0, enduranceFin: 0 }]),
);
const duels: Record<string, number> = {};
let total = 0, parTombe = 0, epuisement = 0, toursTotal = 0, periodesTotal = 0;
let graine = 1;

for (const a of ids) {
  for (const b of ids) {
    if (a === b) continue;
    for (let i = 0; i < parDuel; i++) {
      const h = creerHasard(graine++);
      let e = creerCombat(a, b);
      while (!e.termine) e = jouerTour(e, choixAleatoire(e, 0, h), choixAleatoire(e, 1, h), h);
      total++;
      toursTotal += e.tourGlobal;
      periodesTotal += e.periode;
      if (e.finPar === 'tombe') parTombe++;
      if (e.journal.some((l) => l.includes('épuisé'))) epuisement++;
      const g = e.vainqueur === 0 ? a : b;
      for (const [k, id] of [[0, a], [1, b]] as const) {
        stats[id].combats++;
        stats[id].enduranceFin += e.joueurs[k].endurance / e.joueurs[k].def.enduranceMax;
      }
      stats[g].victoires++;
      if (e.finPar === 'tombe') stats[g].tombes++;
      const cle = `${a} contre ${b}`;
      duels[cle] = (duels[cle] ?? 0) + (e.vainqueur === 0 ? 1 : 0);
    }
  }
}

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
const nom = (id: string) => LUTTEURS.find((l) => l.id === id)!;
console.log(`\n${total} combats simulés (${parDuel} par duel, ordinateur aléatoire)\n`);

// Classement par taux de victoire et rareté proposée : 2 légendaires, 3 épiques, 5 rares, 5 communes.
const PALIERS = ['legendaire', 'legendaire', 'epique', 'epique', 'epique', 'rare', 'rare', 'rare', 'rare', 'rare'];
const classement = [...ids].sort((x, y) => stats[y].victoires / stats[y].combats - stats[x].victoires / stats[x].combats);
console.log('Rang | Lutteur                        | Victoires | dont tombés | Endurance restante | Rareté proposée | Actuelle');
classement.forEach((id, i) => {
  const s = stats[id];
  const l = nom(id);
  const propose = PALIERS[i] ?? 'commune';
  console.log(
    `${String(i + 1).padStart(4)} | ${`${l.nom} (${l.origine})`.padEnd(30)} | ${pct(s.victoires / s.combats).padStart(9)} | ${String(s.tombes).padStart(11)} | ${pct(s.enduranceFin / s.combats).padStart(18)} | ${propose.padEnd(15)} | ${l.rarete}${l.rarete !== propose ? '  <- à changer' : ''}`,
  );
});
console.log(`\nDurée moyenne : ${(toursTotal / total).toFixed(1)} tours, ${(periodesTotal / total).toFixed(2)} périodes`);
console.log(`Fin par tombé : ${pct(parTombe / total)} (dont épuisement : ${pct(epuisement / total)})`);
if (process.argv.includes('--duels')) {
  console.log('\nDuels (victoires du premier nommé) :');
  for (const [cle, v] of Object.entries(duels)) console.log(`  ${cle.padEnd(40)} ${pct(v / parDuel)}`);
}
