// Ouverture progressive du menu principal, sans affichage : au départ, seuls Combat et
// Collection sont visibles ; les autres tuiles apparaissent à l'étape du mode histoire qui
// les utilise (ajouté le 26/11/2026). Une tuile qui vient d'apparaître porte « Nouveau »
// jusqu'à la première visite.

import { REGLES } from '../moteur';
import type { Collection } from './collection';

export type IdTuile = 'combat' | 'collection' | 'tournois' | 'club' | 'saison' | 'social' | 'fusion';

export const TUILES: IdTuile[] = ['combat', 'tournois', 'saison', 'collection', 'fusion', 'club', 'social'];

// Étape du mode histoire (0 = étape 1) à partir de laquelle chaque tuile apparaît.
const ETAPE_TUILE: Record<IdTuile, number> = REGLES.menu.etapeTuile;

export const tuileVisible = (c: Collection, t: IdTuile) => c.histoire.etape >= ETAPE_TUILE[t];
export const tuilesVisibles = (c: Collection) => TUILES.filter((t) => tuileVisible(c, t));
export const tuileNouvelle = (c: Collection, t: IdTuile) => tuileVisible(c, t) && !c.menusVus.includes(t);

// Adresse de l'écran de chaque tuile, pour noter la première visite.
const ADRESSES: Record<string, IdTuile> = { '#combat': 'combat', '#collection': 'collection', '#tournois': 'tournois', '#club': 'club', '#saison': 'saison', '#social': 'social', '#fusion': 'fusion' };

// Note la visite de l'écran d'une tuile ; vrai si c'était la première.
export function noterVisite(c: Collection, adresse: string): boolean {
  const t = ADRESSES[adresse];
  if (!t || c.menusVus.includes(t)) return false;
  c.menusVus.push(t);
  return true;
}
