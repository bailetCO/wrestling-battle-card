// Textes d'affichage (familles, effets des actions spéciales, icônes).
// Aucun chiffre de jeu ici : ils restent dans src/moteur/config.ts.

import { ACTIONS, REGLES, type Famille, type IdAction } from '../moteur';

export const NOM_FAMILLE: Record<Famille, string> = {
  attaque: 'Attaque', defense: 'Défense', contre: 'Contre', feinte: 'Feinte',
};

// Effet d'une action en quelques mots (sur la carte et sur les boutons de combat).
// `bonus` : points en plus déjà acquis (feinte réussie, enchaînement), pour le combat.
export function effetAction(id: IdAction, bonus: { feinte?: boolean; enchainement?: boolean; combo?: number } = {}): string {
  const a = ACTIONS[id];
  const pc = (x: number) => `${Math.round(x * 100)} %`;
  const extra = (bonus.feinte && (a.famille === 'attaque' || a.famille === 'contre') ? REGLES.bonusFeinte : 0)
    + (bonus.enchainement && (a.famille === 'attaque' || a.famille === 'contre') ? REGLES.speciale.bonusEnchainementFeinte : 0)
    + (a.famille === 'attaque' ? bonus.combo ?? 0 : 0);
  const plus = extra ? ` (+${extra})` : '';
  switch (id) {
    case 'simple_jambe': return `${a.points + extra} pts${plus ? ' avec bonus' : ''} · ignore le matraquage`;
    case 'bras_tire': return `${a.points + extra} pts${plus ? ' avec bonus' : ''} · attaque suivante −${REGLES.brasTire.reductionCout}`;
    case 'sortie_zone': return `${a.points + extra} pt${a.points + extra > 1 ? 's' : ''}${plus ? ' avec bonus' : ''} · dure à contrer`;
    case 'tour_hanche': return `${a.points + extra} pts${plus ? ' avec bonus' : ''} · sûr si plus fort`;
    case 'parade': return `Bloque · fatigue l'attaquant (−${REGLES.parade.perteAttaquant})`;
    case 'esquive': return 'Bloque · peut donner l\'initiative';
    case 'sprawl': return `Bloque · ${a.points} pts (${a.points + REGLES.sprawlSurDoubleJambe} sur double jambe)`;
    case 'relance': return `Moitié des pts · ${REGLES.relance.pointsSurDefense} pts sur défense${plus}`;
    case 'cravate': return `Renvoie les pts${plus} · use les jambes`;
    case 'matraquage': return `+${REGLES.bonusFeinte} · −${pc(REGLES.matraquage.malusPrecision)} précision`;
    case 'changement_niveau': return 'Attaque suivante incontrable';
    default: break;
  }
  switch (a.famille) {
    case 'attaque': return `${a.points + extra} pts${plus ? ' avec bonus' : ''}${a.points >= REGLES.grosseAttaqueBloquee.pointsMin ? ' · épuise si bloquée' : ''}`;
    case 'defense': return 'Bloque · récupère';
    case 'contre': return `Renvoie les pts${plus}`;
    case 'feinte': return `+${REGLES.bonusFeinte} · initiative`;
  }
}

export const EFFET_SPECIALE: Record<Famille, string> = {
  attaque: 'Si elle passe : tentative de tombé. Plus fort que l\'adversaire : peut percer sa défense ou son contre.',
  contre: 'Face à une attaque ou une feinte : gagne toujours, renvoie tous les points et tente le tombé.',
  defense: 'Si elle passe : renversement, 4 points.',
  feinte: 'Si elle passe : 2 points, puis +4 si ton attaque ou ton contre suivant réussit.',
};

// Petites icônes de famille (SVG).
export const ICONE: Record<Famille | 'lutte' | 'souffle', string> = {
  attaque: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  contre: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8H8a4 4 0 000 8h9M16 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  feinte: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l5-6 4 5 4-7 5 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  souffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h11a3 3 0 10-3-3M3 14h15a3 3 0 11-3 3M3 19h7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  lutte: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="15" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
};
