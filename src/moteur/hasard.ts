// Tout le hasard du jeu passe par ici. Avec la même graine,
// un combat se rejoue exactement à l'identique.

export type Hasard = () => number; // renvoie un nombre entre 0 (inclus) et 1 (exclu)

export function creerHasard(graine: number): Hasard {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function reussit(hasard: Hasard, chance: number): boolean {
  return hasard() < chance;
}

export function choisirParmi<T>(hasard: Hasard, elements: readonly T[]): T {
  return elements[Math.floor(hasard() * elements.length)];
}
