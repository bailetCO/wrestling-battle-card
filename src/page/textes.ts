// Textes d'affichage (présentation des lutteurs, effets des actions spéciales).
// Aucun chiffre de jeu ici : ils restent dans src/moteur/config.ts.

import type { Famille } from '../moteur';

export const PRESENTATION: Record<string, { style: string; pointsForts: string; endurance: string }> = {
  usa: { style: 'Lutteur de pression, très physique', pointsForts: 'Attaques aux jambes', endurance: 'Grande barre' },
  russie: { style: 'Technicien précis', pointsForts: 'Contres et relances', endurance: 'Barre moyenne' },
  europe: { style: 'Équilibré, idéal pour débuter', pointsForts: 'Défense', endurance: 'Barre moyenne' },
  afrique: { style: 'Puissant et athlétique', pointsForts: 'Grandes projections', endurance: 'Récupération rapide' },
  japon: { style: 'Rapide et explosif', pointsForts: 'Feintes et attaques surprises', endurance: 'Petite barre' },
};

export const NOM_FAMILLE: Record<Famille, string> = {
  attaque: 'Attaque', defense: 'Défense', contre: 'Contre', feinte: 'Feinte',
};

export const EFFET_SPECIALE: Record<Famille, string> = {
  attaque: 'Si elle passe : tentative de tombé.',
  contre: 'S\'il passe : tentative de tombé.',
  defense: 'Si elle passe : renversement, 4 points.',
  feinte: 'Si elle passe : l\'adversaire glisse, 2 points.',
};

// Petites icônes de famille (SVG).
export const ICONE: Record<Famille | 'lutte', string> = {
  attaque: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  contre: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8H8a4 4 0 000 8h9M16 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  feinte: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l5-6 4 5 4-7 5 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lutte: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="15" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
};
