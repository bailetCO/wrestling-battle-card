// Textes d'affichage (familles, effets des actions spéciales, icônes).
// Aucun chiffre de jeu ici : ils restent dans src/moteur/config.ts.

import { ACTIONS, REGLES, type Famille, type IdAction } from '../moteur';

export const NOM_FAMILLE: Record<Famille, string> = {
  attaque: 'Attaque', defense: 'Défense', contre: 'Contre', feinte: 'Feinte',
};

// Effet d'une action en quelques mots (sur la carte et sur les boutons de combat).
// `bonus` : points en plus déjà acquis (feinte réussie, enchaînement), pour le combat.
export function effetAction(id: IdAction, bonus: { feinte?: boolean; enchainement?: boolean } = {}): string {
  const a = ACTIONS[id];
  const pc = (x: number) => `${Math.round(x * 100)} %`;
  const extra = (bonus.feinte && a.famille === 'attaque' ? REGLES.bonusFeinte : 0)
    + (bonus.enchainement && (a.famille === 'attaque' || a.famille === 'contre') ? REGLES.speciale.bonusEnchainementFeinte : 0);
  const plus = extra ? ` (+${extra})` : '';
  switch (a.famille) {
    case 'attaque': return `${a.points + extra} pts${plus ? ' avec bonus' : ''}`;
    case 'defense': return a.points ? `Bloque · ${a.points} pts` : 'Bloque · récupère';
    case 'contre': return `Renvoie les pts${plus}`;
    case 'feinte':
      return id === 'matraquage'
        ? `+${REGLES.bonusFeinte} · −${pc(REGLES.matraquage.malusPrecision)} précision`
        : `+${REGLES.bonusFeinte} · initiative`;
  }
}

export const EFFET_SPECIALE: Record<Famille, string> = {
  attaque: 'Si elle passe : tentative de tombé. Plus fort que l\'adversaire : peut percer sa défense ou son contre.',
  contre: 'Face à une attaque ou une feinte : gagne toujours, renvoie tous les points et tente le tombé.',
  defense: 'Si elle passe : renversement, 4 points.',
  feinte: 'Si elle passe : 2 points, puis +4 si ton attaque ou ton contre suivant réussit.',
};

// Petites icônes de famille (SVG).
export const ICONE: Record<Famille | 'lutte', string> = {
  attaque: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  contre: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8H8a4 4 0 000 8h9M16 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  feinte: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l5-6 4 5 4-7 5 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lutte: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="15" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
};
