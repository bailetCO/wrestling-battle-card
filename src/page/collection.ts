// La collection du joueur : son pseudo de coach, ses cartes (exemplaires et grades), ses decks.
// Sauvegardée dans le navigateur du téléphone (une vraie sauvegarde par compte viendra avec Firebase).

import {
  LUTTEURS, REGLES, exemplairesPourGrade, verifierDeck,
  type Hasard, type IdAction, type Niveau, type Rarete,
} from '../moteur';

export interface Collection {
  version: 2;
  coach: string | null; // pseudo du joueur (le coach de ses lutteurs)
  idCoach: string; // identifiant aléatoire, pour reconnaître un ami
  exemplaires: Record<string, number>; // nombre d'exemplaires de chaque carte
  grades: Record<string, number>; // grade de chaque carte possédée (1 = de base)
  decks: Record<string, IdAction[]>; // deck choisi pour chaque lutteur (sinon celui par défaut)
  niveau: Niveau;
  toutDebloque: boolean; // mode test : toutes les cartes disponibles
  victoires: number;
  defaitesDeSuite: number; // remis à zéro à chaque victoire ou booster de consolation
  recompensesEnLigne: string[]; // combats en ligne déjà récompensés (pas de double récompense)
}

export type TypeBooster = 'classique' | 'rare';
export interface Booster {
  type: TypeBooster;
  cartes: string[];
  nouvelles: string[]; // cartes obtenues pour la première fois
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

function nouvelId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nouvelleCollection(): Collection {
  return {
    version: 2, coach: null, idCoach: nouvelId(),
    exemplaires: Object.fromEntries(cartesDeDepart().map((id) => [id, 1])), grades: {},
    decks: {}, niveau: 'normal', toutDebloque: false, victoires: 0, defaitesDeSuite: 0, recompensesEnLigne: [],
  };
}

export const nbExemplaires = (c: Collection, id: string) => c.exemplaires[id] ?? 0;
export const gradeDe = (c: Collection, id: string) => (nbExemplaires(c, id) > 0 ? c.grades[id] ?? 1 : 1);

export function possede(c: Collection, id: string): boolean {
  return c.toutDebloque || nbExemplaires(c, id) > 0;
}

export const cartesPossedees = (c: Collection) => LUTTEURS.filter((l) => nbExemplaires(c, l.id) > 0).length;
export const nbDoubles = (c: Collection) => LUTTEURS.reduce((n, l) => n + Math.max(0, nbExemplaires(c, l.id) - 1), 0);

// ---------- Pseudo ----------

export function verifierPseudo(p: string): string | null {
  const t = p.trim();
  if (t.length < 3) return 'Au moins 3 caractères.';
  if (t.length > 16) return '16 caractères au maximum.';
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(t)) return 'Lettres, chiffres, espaces, tirets et points seulement.';
  return null;
}

// ---------- Boosters ----------

function tirerCarte(hasard: Hasard): string {
  const poids = LUTTEURS.map((l) => REGLES.collection.poidsRarete[l.rarete]);
  let tirage = hasard() * poids.reduce((a, b) => a + b, 0);
  let k = 0;
  while (k < poids.length - 1 && tirage >= poids[k]) tirage -= poids[k++];
  return LUTTEURS[k].id;
}

// Ouvre un booster (classique ou rare, au hasard) et ajoute ses cartes à la collection.
export function ouvrirBooster(c: Collection, hasard: Hasard): Booster {
  const B = REGLES.collection.boosters;
  const type: TypeBooster = hasard() < B.chanceRare ? 'rare' : 'classique';
  const cartes = Array.from({ length: B[type].cartes }, () => tirerCarte(hasard));
  const nouvelles: string[] = [];
  for (const id of cartes) {
    if (nbExemplaires(c, id) === 0) nouvelles.push(id);
    c.exemplaires[id] = nbExemplaires(c, id) + 1;
  }
  return { type, cartes, nouvelles };
}

// Victoire : 1 booster en arène, 2 en ligne (mode collection).
export function recompenser(c: Collection, ou: 'arene' | 'enLigne', hasard: Hasard): Booster[] {
  c.victoires++;
  if (ou === 'arene') c.defaitesDeSuite = 0;
  return Array.from({ length: REGLES.collection.boostersParVictoire[ou] }, () => ouvrirBooster(c, hasard));
}

// Défaite en arène. Toutes les 2 défaites d'affilée : booster de consolation.
export function consoler(c: Collection, hasard: Hasard): Booster | null {
  c.defaitesDeSuite++;
  if (c.defaitesDeSuite < REGLES.collection.defaitesPourConsolation) return null;
  c.defaitesDeSuite = 0;
  return ouvrirBooster(c, hasard);
}

// ---------- Fusion ----------

// Ce qu'il faut pour monter cette carte d'un grade : null si impossible (grade maximal).
export function prochaineFusion(c: Collection, id: string): { grade: number; doublesNecessaires: number; doublesDispo: number } | null {
  const g = gradeDe(c, id);
  if (g >= REGLES.fusion.gradeMax || nbExemplaires(c, id) === 0) return null;
  return { grade: g + 1, doublesNecessaires: exemplairesPourGrade(g + 1) - 1, doublesDispo: nbExemplaires(c, id) - 1 };
}

// Fusionne : consomme les doubles et monte la carte d'un grade. Renvoie la raison si impossible.
export function fusionner(c: Collection, id: string): string | null {
  const f = prochaineFusion(c, id);
  if (!f) return nbExemplaires(c, id) === 0 ? 'Tu ne possèdes pas cette carte.' : 'Cette carte est déjà au grade maximal.';
  if (f.doublesDispo < f.doublesNecessaires) return `Il faut ${f.doublesNecessaires} double${f.doublesNecessaires > 1 ? 's' : ''} pour passer au grade ${f.grade}.`;
  c.exemplaires[id] -= f.doublesNecessaires;
  c.grades[id] = f.grade;
  return null;
}

// ---------- Decks ----------

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

// Lit une sauvegarde, y compris l'ancien format (liste de cartes sans exemplaires).
export function depuisSauvegarde(brut: unknown): Collection {
  const c = nouvelleCollection();
  if (!brut || typeof brut !== 'object') return c;
  const b = brut as Record<string, unknown>;
  if (Array.isArray(b.cartes)) {
    c.exemplaires = Object.fromEntries((b.cartes as string[]).map((id) => [id, 1]));
  }
  if (b.exemplaires && typeof b.exemplaires === 'object') c.exemplaires = { ...(b.exemplaires as Record<string, number>) };
  if (b.grades && typeof b.grades === 'object') c.grades = { ...(b.grades as Record<string, number>) };
  if (b.decks && typeof b.decks === 'object') c.decks = { ...(b.decks as Record<string, IdAction[]>) };
  if (typeof b.coach === 'string' && !verifierPseudo(b.coach)) c.coach = b.coach.trim();
  if (typeof b.idCoach === 'string') c.idCoach = b.idCoach;
  if (b.niveau === 'fort') c.niveau = 'fort';
  c.toutDebloque = b.toutDebloque === true;
  if (typeof b.victoires === 'number') c.victoires = b.victoires;
  if (typeof b.defaitesDeSuite === 'number') c.defaitesDeSuite = b.defaitesDeSuite;
  if (Array.isArray(b.recompensesEnLigne)) c.recompensesEnLigne = (b.recompensesEnLigne as string[]).slice(-50);
  // Nettoyage : cartes inconnues, decks invalides
  for (const id of Object.keys(c.exemplaires)) {
    if (!LUTTEURS.some((l) => l.id === id) || !(c.exemplaires[id] > 0)) delete c.exemplaires[id];
  }
  for (const [id, deck] of Object.entries(c.decks)) {
    const def = LUTTEURS.find((l) => l.id === id);
    if (!def || verifierDeck(def, deck)) delete c.decks[id];
  }
  return c;
}

export function charger(): Collection {
  try {
    const brut = localStorage.getItem(CLE);
    return depuisSauvegarde(brut ? JSON.parse(brut) : null);
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
