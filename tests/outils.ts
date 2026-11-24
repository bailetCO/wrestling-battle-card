// Outils communs aux tests.

import { ACTIONS } from '../src/moteur/config';
import { creerCombat, jouerTour } from '../src/moteur/combat';
import type { Choix, DefLutteur, EtatCombat, Famille, IdAction, OptionsTour } from '../src/moteur/types';
import type { Hasard } from '../src/moteur/hasard';

// Hasard qui renvoie toujours la même valeur : 0 = tout réussit, 0,99 = presque tout échoue.
export const toujours = (v: number): Hasard => () => v;

// Lutteur de test qui connaît toutes les actions.
export function testeur(modif: Partial<DefLutteur> = {}): DefLutteur {
  return {
    id: 'test',
    nom: 'Test',
    origine: 'Test',
    nation: 'europe',
    style: 'Test',
    rarete: 'commune',
    enduranceMax: 100,
    force: 150,
    recuperation: 0.4,
    actions: Object.keys(ACTIONS) as IdAction[],
    familleSpeciale: 'attaque' as Famille,
    ...modif,
  };
}

export function combatTest(a: Partial<DefLutteur> = {}, b: Partial<DefLutteur> = {}): EtatCombat {
  return creerCombat(testeur({ nom: 'A', ...a }), testeur({ nom: 'B', ...b }));
}

export const c = (action: IdAction | 'lutte', speciale = false): Choix => ({ action, speciale });

export function tour(
  e: EtatCombat, a: Choix, b: Choix, hasard: Hasard = toujours(0), options: OptionsTour = {},
): EtatCombat {
  return jouerTour(e, a, b, hasard, options);
}
