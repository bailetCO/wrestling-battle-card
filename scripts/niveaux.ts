// Mesure le taux de victoire d'un joueur simulé contre les 3 niveaux de l'ordinateur.
// Deux joueurs simulés : « au hasard » (débutant) et « à habitudes » (répète ses familles d'actions
// préférées, comme beaucoup de joueurs). Les deux camps utilisent les mêmes cartes, tirées au hasard.
// Usage : npm run niveaux -- [combats par case]

import { LUTTEURS, REGLES, ACTIONS } from '../src/moteur/config';
import { actionsJouables, apercuInitiative, creerCombat, jouerTour, souffleDispo } from '../src/moteur/combat';
import { choixAleatoire, choixFort, choixOrdinateur, reactionOrdinateur, reagirInitiative, type Niveau } from '../src/moteur/ia';
import { creerHasard, choisirParmi, type Hasard } from '../src/moteur/hasard';
import type { Choix, EtatCombat, Famille, Joueur } from '../src/moteur/types';

const n = Number(process.argv.slice(2).find((x) => /^\d+$/.test(x)) ?? 2000);

type Profil = 'hasard' | 'habitudes' | 'experimente';

// Joueur à habitudes : chaque combat, il a une famille préférée qu'il joue 1 fois sur 2.
// Comme l'ordinateur, le joueur simulé prend son second souffle quand il est presque à bout.
function choixJoueur(e: EtatCombat, j: Joueur, h: Hasard, profil: Profil, prefere: Famille): Choix {
  if (souffleDispo(e, j) && e.joueurs[j].endurance < REGLES.ia.seuilSouffle) return { action: 'souffle' };
  if (profil === 'hasard') return choixAleatoire(e, j, h);
  if (profil === 'experimente') return choixFort(e, j, h);
  const jouables = actionsJouables(e, j);
  const favoris = jouables.filter((a) => ACTIONS[a].famille === prefere);
  if (favoris.length && h() < 0.5) return { action: choisirParmi(h, favoris), speciale: false };
  return choixAleatoire(e, j, h);
}

function mesurer(profil: Profil, niveau: Niveau, rapide = false): number {
  let gagnes = 0;
  const familles: Famille[] = ['attaque', 'defense', 'contre', 'feinte'];
  for (let i = 0; i < n; i++) {
    const h = creerHasard(1000 + i);
    const a = choisirParmi(h, LUTTEURS), b = choisirParmi(h, LUTTEURS);
    const prefere = choisirParmi(h, familles);
    let e = creerCombat(a, b, { rapide });
    while (!e.termine) {
      let moi = choixJoueur(e, 0, h, profil, prefere);
      let ordi = choixOrdinateur(e, 1, h, niveau);
      // Initiative du joueur : il voit 2 actions et change parfois (comme l'ordinateur normal).
      if (apercuInitiative(e, 0, ordi.action, h)) {
        moi = profil === 'experimente' ? reactionOrdinateur(e, 0, moi, ordi, h, 'fort') : reagirInitiative(e, 0, moi, h, 'normal');
      }
      if (apercuInitiative(e, 1, moi.action, h)) ordi = reactionOrdinateur(e, 1, ordi, moi, h, niveau);
      e = jouerTour(e, moi, ordi, h);
    }
    if (e.vainqueur === 0) gagnes++;
  }
  return gagnes / n;
}

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
console.log(`\nTaux de victoire du joueur simulé (${n} combats par case, cartes au hasard des deux côtés)\n`);
console.log('Ordinateur | Joueur au hasard | Joueur à habitudes | Joueur expérimenté | Visé');
const vise: Record<Niveau, string> = { facile: '≈ 70 % (débutant)', normal: '≈ 50 %', fort: '≈ 40 % (expérimenté)' };
for (const niv of ['facile', 'normal', 'fort'] as Niveau[]) {
  console.log(`${niv.padEnd(10)} | ${pct(mesurer('hasard', niv)).padEnd(16)} | ${pct(mesurer('habitudes', niv)).padEnd(18)} | ${pct(mesurer('experimente', niv)).padEnd(18)} | ${vise[niv]}`);
}
console.log(`\nCombat rapide, ordinateur normal : joueur au hasard ${pct(mesurer('hasard', 'normal', true))}`);
void REGLES;
