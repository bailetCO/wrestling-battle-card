// Saison sportive (mode histoire 2), sans affichage : 6 paliers dans l'ordre, ouverts quand le mode
// histoire 1 est fini. Interclub (combats rapides), puis compétitions individuelles de plus en plus
// grandes : régional, national, international, championnats du monde, Jeux Olympiques.

import { REGLES, type Hasard } from '../moteur';
import { ouvrirBooster, type Booster, type Collection } from './collection';
import { NB_ETAPES, legendaireOfferte } from './histoire';
import { creerIndividuel, type Individuel } from './tournoi';

export const PALIERS = REGLES.saison.paliers;
export const NB_PALIERS = PALIERS.length;

export const saisonOuverte = (c: Collection) => c.histoire.etape >= NB_ETAPES;
export const saisonFinie = (c: Collection) => c.saison.palier >= NB_PALIERS;

// Objectif d'un palier, en mots.
export function objectifPalier(i: number): string {
  const p = PALIERS[i];
  if (p.victoires) return `Gagner ${p.victoires} combats rapides (1 période) contre d'autres clubs`;
  const ou = p.placeMax === 1 ? (i === NB_PALIERS - 1 ? 'Décrocher la médaille d\'or' : 'Gagner la compétition') : `Monter sur le podium (top ${p.placeMax})`;
  return `${ou} : ${p.participants} lutteurs maximum, double tableau`;
}

export function recompensePalier(i: number): string {
  const p = PALIERS[i];
  const parts: string[] = [];
  if (p.legendaire) parts.push('1 carte légendaire');
  if (p.boosters) parts.push(`${p.boosters} booster${p.boosters > 1 ? 's' : ''}`);
  if (p.boostersRares) parts.push(`${p.boostersRares} boosters rares`);
  return parts.join(' + ');
}

export type EvenementSaison =
  | { type: 'interclub' } // combat interclub gagné
  | { type: 'competition'; palier: number; place: number };

export interface PalierValide { palier: number; boosters: Booster[] }

function recompense(c: Collection, i: number, hasard: Hasard): Booster[] {
  const p = PALIERS[i];
  const out: Booster[] = [];
  if (p.legendaire) out.push(legendaireOfferte(c, hasard));
  for (let k = 0; k < p.boosters; k++) out.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < p.boostersRares; k++) out.push(ouvrirBooster(c, hasard, 'rare'));
  return out;
}

// Note un événement ; renvoie le palier validé (avec sa récompense), ou null.
export function noterSaison(c: Collection, ev: EvenementSaison, hasard: Hasard): PalierValide | null {
  if (!saisonOuverte(c) || saisonFinie(c)) return null;
  const i = c.saison.palier;
  const p = PALIERS[i];
  let ok = false;
  if (ev.type === 'interclub' && p.victoires) {
    c.saison.victoires++;
    ok = c.saison.victoires >= p.victoires;
  }
  if (ev.type === 'competition' && ev.palier === i && !p.victoires) ok = ev.place <= p.placeMax;
  if (!ok) return null;
  c.saison.palier++;
  c.saison.victoires = 0;
  return { palier: i, boosters: recompense(c, i, hasard) };
}

// Compétition du palier en cours (l'inscription se paie à part, comme un tournoi individuel).
export function creerCompetitionSaison(c: Collection, idJoueur: string, graine: number): Individuel | null {
  const i = c.saison.palier;
  const p = PALIERS[i];
  if (!p || p.victoires) return null;
  return creerIndividuel(idJoueur, p.participants, graine, { minimum: p.participants, maximum: p.participants, nom: p.nom, niveaux: p.niveau, saison: i });
}
