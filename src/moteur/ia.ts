// Ordinateur très simple : choisit au hasard parmi les actions jouables.
// Un niveau « fort » est prévu plus tard.

import { ACTIONS, REGLES } from './config';
import { actionsJouables, peutJouerSpeciale } from './combat';
import { choisirParmi, reussit, type Hasard } from './hasard';
import type { Choix, EtatCombat, Joueur } from './types';

export function choixAleatoire(etat: EtatCombat, j: Joueur, hasard: Hasard, chanceSpeciale = 0.3): Choix {
  const jouables = actionsJouables(etat, j);
  if (jouables.length === 0) return { action: 'lutte' };
  const action = choisirParmi(hasard, jouables);
  const speciale =
    ACTIONS[action].famille === etat.joueurs[j].def.familleSpeciale &&
    peutJouerSpeciale(etat, j, action) &&
    reussit(hasard, chanceSpeciale);
  return { action, speciale };
}

// Quand l'ordinateur a l'initiative, il voit 2 actions possibles de l'adversaire.
// Niveau normal : une fois sur deux, il change pour une autre action jouable, au hasard.
export function reagirInitiative(
  etat: EtatCombat, j: Joueur, choixActuel: Choix, hasard: Hasard,
): Choix {
  if (choixActuel.action === 'lutte') return choixActuel;
  if (!reussit(hasard, REGLES.ia.chanceChangerInitiative)) return choixActuel;
  const autres = actionsJouables(etat, j).filter((a) => a !== choixActuel.action);
  if (autres.length === 0) return choixActuel;
  return { action: choisirParmi(hasard, autres), speciale: false };
}
