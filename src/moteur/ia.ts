// Ordinateur très simple : choisit au hasard parmi les actions jouables.
// Il sera amélioré à l'étape 4.

import { ACTIONS } from './config';
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
