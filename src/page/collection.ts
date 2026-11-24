// La collection du joueur : cartes possédées, decks, niveau de l'ordinateur.
// Sauvegardée dans le navigateur du téléphone (une vraie sauvegarde par compte viendra à l'étape 7).

import { LUTTEURS, REGLES, verifierDeck, type IdAction, type Niveau, type Rarete } from '../moteur';
import type { Hasard } from "../moteur";

export interface Collection {
  cartes: string[]; // identifiants des lutteurs possédés
  decks: Record<string, IdAction[]>; // deck choisi pour chaque lutteur (sinon celui par défaut)
  niveau: Niveau;
  toutDebloque: boolean; // mode test : toutes les cartes disponibles
  victoires: number;
  defaitesDeSuite: number; // remis à zéro à chaque victoire ou booster de consolation
}

const ORDRE: Rarete[] = ['commune', 'rare', 'epique', 'legendaire'];

// Au départ : une carte par nation, la moins rare de chaque nation.
export function cartesDeDepart(): string[] {
  const nations = [...new Set(LUTTEURS.map((l) => l.nation))];
  return nations.map((n) => {
    const deLaNation = LUTTEURS.filter((l) => l.nation === n);
    return deLaNation.sort((a, b) => ORDRE.indexOf(a.rarete) - ORDRE.indexOf(b.rarete))[0].id;
  });
}

export function nouvelleCollection(): Collection {
  return { cartes: cartesDeDepart(), decks: {}, niveau: 'normal', toutDebloque: false, victoires: 0, defaitesDeSuite: 0 };
}

export function possede(c: Collection, id: string): boolean {
  return c.toutDebloque || c.cartes.includes(id);
}

// Tire les cartes d'un booster parmi celles qui manquent, selon le poids de chaque rareté.
export function ouvrirBooster(c: Collection, nombre: number, hasard: Hasard): string[] {
  const gagnees: string[] = [];
  for (let i = 0; i < nombre; i++) {
    const manquantes = LUTTEURS.filter((l) => !c.cartes.includes(l.id) && !gagnees.includes(l.id));
    if (manquantes.length === 0) break;
    const poids = manquantes.map((l) => REGLES.collection.poidsRarete[l.rarete]);
    const total = poids.reduce((a, b) => a + b, 0);
    let tirage = hasard() * total;
    let k = 0;
    while (tirage >= poids[k]) tirage -= poids[k++];
    gagnees.push(manquantes[Math.min(k, manquantes.length - 1)].id);
  }
  return gagnees;
}

// Enregistre une victoire et renvoie les cartes gagnées.
export function recompenser(c: Collection, niveau: Niveau, hasard: Hasard): string[] {
  c.victoires++;
  c.defaitesDeSuite = 0;
  const gagnees = ouvrirBooster(c, REGLES.collection.cartesParVictoire[niveau], hasard);
  c.cartes.push(...gagnees);
  return gagnees;
}

// Enregistre une défaite. Toutes les 2 défaites d'affilée : booster de consolation.
export function consoler(c: Collection, hasard: Hasard): string[] | null {
  c.defaitesDeSuite++;
  if (c.defaitesDeSuite < REGLES.collection.defaitesPourConsolation) return null;
  c.defaitesDeSuite = 0;
  const gagnees = ouvrirBooster(c, REGLES.collection.cartesConsolation, hasard);
  c.cartes.push(...gagnees);
  return gagnees;
}

export function deckDe(c: Collection, id: string): IdAction[] | undefined {
  return c.decks[id];
}

export function choisirDeck(c: Collection, id: string, actions: IdAction[]): string | null {
  const def = LUTTEURS.find((l) => l.id === id);
  if (!def) return 'Lutteur inconnu.';
  const erreur = verifierDeck(def, actions);
  if (!erreur) c.decks[id] = [...actions];
  return erreur;
}

// ---------- Sauvegarde dans le navigateur ----------

const CLE = 'wbc-collection-v1';

export function charger(): Collection {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return nouvelleCollection();
    const c = { ...nouvelleCollection(), ...JSON.parse(brut) } as Collection;
    c.cartes = c.cartes.filter((id) => LUTTEURS.some((l) => l.id === id));
    for (const [id, deck] of Object.entries(c.decks)) {
      const def = LUTTEURS.find((l) => l.id === id);
      if (!def || verifierDeck(def, deck)) delete c.decks[id];
    }
    return c;
  } catch {
    return nouvelleCollection();
  }
}

export function sauver(c: Collection) {
  try {
    localStorage.setItem(CLE, JSON.stringify(c));
  } catch {
    // Pas de sauvegarde possible (navigation privée, etc.) : la partie continue sans.
  }
}

