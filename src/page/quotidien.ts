// Revenir chaque jour (27/11/2026), sans affichage : calendrier de 7 jours et bonus de retour.
// Les jours sont ceux du téléphone (AAAA-MM-JJ, comme les quêtes du jour).

import { REGLES } from '../moteur';
import { joindreGains, ouvrirBooster, type Booster, type Collection } from './collection';

const Q = REGLES.quotidien;
export const CASES = Q.calendrier.length;

const ecart = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86_400_000);

export const recompenseDisponible = (c: Collection, jour: string) => c.quotidien.jour !== jour;

// Récupère la récompense du jour : la case en cours du calendrier, puis on passe à la suivante.
export function reclamer(c: Collection, jour: string, hasard: () => number = Math.random): { rang: number; boosters: Booster[] } | null {
  if (!recompenseDisponible(c, jour)) return null;
  const rang = c.quotidien.rang % CASES;
  const r = Q.calendrier[rang];
  const boosters: Booster[] = [];
  for (let k = 0; k < (r.boosters ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < (r.boostersRares ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'rare'));
  const dollars = r.dollars ?? 0;
  c.dollars += dollars;
  c.quotidien.jour = jour;
  c.quotidien.rang = (rang + 1) % CASES;
  return { rang, boosters: joindreGains(boosters, { medailles: 0, dollars }) };
}

export const texteCase = (r: (typeof Q.calendrier)[number]) =>
  [r.boostersRares ? `${r.boostersRares} booster rare` : '', r.boosters ? `${r.boosters} booster` : '', r.dollars ? `${r.dollars} $` : ''].filter(Boolean).join(' + ');

// À chaque lancement : bonus de retour après une longue absence ? (note la visite du jour)
export function visite(c: Collection, jour: string, hasard: () => number = Math.random): Booster[] | null {
  const avant = c.quotidien.visite;
  c.quotidien.visite = jour;
  if (!avant || !c.coach || ecart(avant, jour) < Q.retour.joursAbsence) return null;
  if (c.quotidien.retour && ecart(c.quotidien.retour, jour) < Q.retour.intervalleJours) return null;
  c.quotidien.retour = jour;
  return Array.from({ length: Q.retour.boostersRares }, () => ouvrirBooster(c, hasard, 'rare'));
}

