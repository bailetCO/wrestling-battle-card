// Cocoach, le rival du mode infini (combat rapide, durée infinie), sans affichage.
// - Il commence en carte rare. Chaque fois que le joueur le bat, il monte d'un niveau : Épique,
//   Légendaire, Champion du Monde (statistiques et actions comme une fusion) ; ensuite, chaque
//   victoire lui donne une étoile (une action coûte 1 de moins), jusqu'au maximum.
// - L'ordinateur qui le joue : normal en Rare et Épique, fort ensuite.
// - Quand il monte de niveau : 1 booster rare pour le joueur.
// - À chaque nouvelle saison, il repart de Rare, avec +2 % de statistiques par saison passée.

import { COCOACH_RIVAL, REGLES, avecBonus, avecDeck, avecGrade, gradeMaxDe, type DefLutteur, type IdAction, type Niveau } from '../moteur';
import type { Collection } from './collection';

const R = REGLES.rival;

export interface EtatRival { grade: number; etoiles: Partial<Record<IdAction, number>>; victoires: number; bonus: number }
export const rivalNeuf = (bonus = 0): EtatRival => ({ grade: 1, etoiles: {}, victoires: 0, bonus });

// La carte de Cocoach à son niveau actuel (avec son deck de ce niveau et son bonus de saison).
export function defRival(c: Collection): DefLutteur {
  const r = c.rival;
  const g = Math.min(r.grade, gradeMaxDe(COCOACH_RIVAL));
  return avecBonus(avecDeck(avecGrade(COCOACH_RIVAL, g, r.etoiles), R.decks[g - 1]), r.bonus);
}

export const niveauOrdiRival = (c: Collection): Niveau => R.ordinateur[Math.min(c.rival.grade, R.ordinateur.length) - 1];
export const etoilesRival = (c: Collection) => Object.values(c.rival.etoiles).reduce((n, x) => n + (x ?? 0), 0);

export interface MonteeRival { monte: boolean; grade: number; etoile: IdAction | null }

// Le joueur a battu Cocoach : il progresse.
export function rivalBattu(c: Collection): MonteeRival {
  const r = c.rival;
  r.victoires++;
  if (r.grade < gradeMaxDe(COCOACH_RIVAL)) {
    r.grade++;
    return { monte: true, grade: r.grade, etoile: null };
  }
  // Champion du Monde : une étoile sur la première action qui n'a pas encore ses 3 étoiles.
  const possibles = avecGrade(COCOACH_RIVAL, r.grade).actionsPossibles;
  const a = possibles.find((x) => (r.etoiles[x] ?? 0) < REGLES.fusion.etoilesMaxParAction) ?? null;
  if (a) r.etoiles[a] = (r.etoiles[a] ?? 0) + 1;
  return { monte: false, grade: r.grade, etoile: a };
}

// Nouvelle saison : Cocoach repart de Rare, un peu plus fort (+2 % par saison passée).
export function rivalNouvelleSaison(c: Collection) {
  c.rival = rivalNeuf(Math.round((c.rival.bonus + R.bonusParSaison) * 100) / 100);
}
