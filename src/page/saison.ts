// Saison sportive, sans affichage : un mode à part, ouvert au niveau 10 de Mon Club (avant le 26/11/2026,
// elle s'ouvrait après l'étape 12 du mode histoire ; la progression d'un ancien joueur est gardée).
// Paliers dans l'ordre : interclub (combats rapides), puis compétitions individuelles de plus en plus
// grandes : régional, national, international, championnats du monde, et Jeux Olympiques une saison
// sur 4 (la 1re, puis la 5e, la 9e…). Une saison finie, on peut en commencer une nouvelle.

import { CHAMPIONS, COCOACH, ETOILES_COCOACH, ID_COCOACH, REGLES, type Hasard, type IdAction } from '../moteur';
import { nbExemplaires, niveauClub, ouvrirBooster, type Booster, type Collection } from './collection';
import { legendaireOfferte } from './histoire';
import { rivalNouvelleSaison } from './rival';
import { creerIndividuel, type Individuel } from './tournoi';

const S = REGLES.saison;
export const PALIERS = S.paliers;
export const NB_PALIERS = PALIERS.length; // avec les Jeux Olympiques

export const saisonOlympique = (numero: number) => (numero - 1) % S.joTousLes === 0;
// Nombre de paliers de la saison en cours : 6 avec les JO, 5 sinon (fin aux championnats du monde).
export const nbPaliers = (c: Collection) => (saisonOlympique(c.saison.numero) ? NB_PALIERS : NB_PALIERS - 1);

export const saisonOuverte = (c: Collection) => niveauClub(c) >= REGLES.club.niveauSaison;
export const saisonFinie = (c: Collection) => c.saison.palier >= nbPaliers(c);

// Objectif d'un palier, en mots.
export function objectifPalier(i: number): string {
  const p = PALIERS[i];
  if (p.victoires) return `Gagner ${p.victoires} combats rapides (1 période) contre d'autres clubs`;
  const ou = p.placeMax === 1 ? (p.legendaire ? 'Décrocher la médaille d\'or' : 'Gagner la compétition') : `Monter sur le podium (top ${p.placeMax})`;
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

export interface PalierValide { palier: number; boosters: Booster[]; finSaison: boolean }

// Récompense de fin de saison, au hasard : 5 exemplaires d'une même carte Champion du Monde, ou 5
// cartes Champion du Monde différentes.
export function cartesFinSaison(c: Collection, hasard: Hasard): Booster {
  const n = S.cartesFinSaison;
  let ids: string[];
  if (hasard() < 0.5) {
    const id = CHAMPIONS[Math.floor(hasard() * CHAMPIONS.length)].id;
    ids = Array.from({ length: n }, () => id);
  } else {
    const pool = CHAMPIONS.map((l) => l.id);
    ids = Array.from({ length: Math.min(n, pool.length) }, () => pool.splice(Math.floor(hasard() * pool.length), 1)[0]);
  }
  const nouvelles = [...new Set(ids.filter((id) => !(c.exemplaires[id] > 0)))];
  for (const id of ids) c.exemplaires[id] = (c.exemplaires[id] ?? 0) + 1;
  return { type: 'recompense', cartes: ids, nouvelles };
}

// Commence la saison suivante (seulement quand la saison en cours est finie).
export function nouvelleSaison(c: Collection): boolean {
  if (!saisonOuverte(c) || !saisonFinie(c)) return false;
  c.saison = { palier: 0, victoires: 0, numero: c.saison.numero + 1, terminees: c.saison.terminees };
  rivalNouvelleSaison(c); // Cocoach repart de Rare, un peu plus fort
  c.scenesVues = c.scenesVues.filter((k) => !k.startsWith('s')); // les scènes de la saison reviennent
  return true;
}

// Carte secrète de Cocoach, à chaque médaille d'or aux Jeux Olympiques : la 1re fois, la carte avec
// 4 étoiles sur 4 actions différentes tirées au hasard ; les fois suivantes, un exemplaire de plus
// (un double pour la fusion).
export function carteCocoach(c: Collection, hasard: Hasard): Booster {
  const nouvelle = nbExemplaires(c, ID_COCOACH) === 0;
  c.exemplaires[ID_COCOACH] = nbExemplaires(c, ID_COCOACH) + 1;
  if (nouvelle) {
    const actions: IdAction[] = [...new Set([...COCOACH.actions, ...COCOACH.deblocages, ...(COCOACH.actionChampion ? [COCOACH.actionChampion] : [])])];
    const etoiles: Partial<Record<IdAction, number>> = {};
    for (let k = 0; k < ETOILES_COCOACH; k++) {
      const restantes = actions.filter((a) => !etoiles[a]);
      etoiles[restantes[Math.floor(hasard() * restantes.length)]] = 1;
    }
    c.etoiles[ID_COCOACH] = etoiles;
  }
  return { type: 'recompense', cartes: [ID_COCOACH], nouvelles: nouvelle ? [ID_COCOACH] : [] };
}

const estJO = (i: number) => PALIERS[i]?.nom === 'Jeux Olympiques';

function recompense(c: Collection, i: number, hasard: Hasard): Booster[] {
  const p = PALIERS[i];
  const out: Booster[] = [];
  if (p.legendaire) out.push(legendaireOfferte(c, hasard));
  for (let k = 0; k < p.boosters; k++) out.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < p.boostersRares; k++) out.push(ouvrirBooster(c, hasard, 'rare'));
  if (estJO(i)) out.push(carteCocoach(c, hasard)); // médaille d'or (seule la 1re place valide les JO)
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
  return validerPalier(c, i, hasard);
}

// Test : valide le palier en cours comme s'il était réussi (avec sa récompense).
export function passerPalier(c: Collection, hasard: Hasard): PalierValide | null {
  if (!saisonOuverte(c) || saisonFinie(c)) return null;
  return validerPalier(c, c.saison.palier, hasard);
}

function validerPalier(c: Collection, i: number, hasard: Hasard): PalierValide {
  c.saison.palier++;
  c.saison.victoires = 0;
  const boosters = recompense(c, i, hasard);
  const finSaison = saisonFinie(c);
  if (finSaison) {
    c.saison.terminees++;
    const fois = saisonOlympique(c.saison.numero) ? 2 : 1;
    for (let k = 0; k < fois; k++) boosters.push(cartesFinSaison(c, hasard));
  }
  return { palier: i, boosters, finSaison };
}

// Compétition du palier en cours (l'inscription se paie à part, comme un tournoi individuel).
export function creerCompetitionSaison(c: Collection, idJoueur: string, graine: number): Individuel | null {
  const i = c.saison.palier;
  const p = PALIERS[i];
  if (!p || p.victoires) return null;
  return creerIndividuel(idJoueur, p.participants, graine, { minimum: p.participants, maximum: p.participants, nom: p.nom, niveaux: p.niveau, saison: i });
}
