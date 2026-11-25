// La collection du joueur : son pseudo de coach, ses cartes (exemplaires et grades), ses decks.
// Sauvegardée dans le navigateur du téléphone (une vraie sauvegarde par compte viendra avec Firebase).

import {
  LUTTEURS, REGLES, avecGrade, etoilesPossibles, exemplairesPourGrade, gradeMaxDe, niveauCarte, stylesDebloques, trouverLutteur, verifierDeck,
  type DefLutteur, type Hasard, type IdAction, type Niveau, type NiveauCarte,
} from '../moteur';

export interface Collection {
  version: 2;
  coach: string | null; // pseudo du joueur (le coach de ses lutteurs)
  idCoach: string; // identifiant aléatoire, pour reconnaître un ami
  exemplaires: Record<string, number>; // nombre d'exemplaires de chaque carte
  grades: Record<string, number>; // grade de chaque carte possédée (1 = de base)
  etoiles: Record<string, Partial<Record<IdAction, number>>>; // Champion du Monde : étoiles par action (−1 au coût chacune)
  decks: Record<string, IdAction[]>; // deck choisi pour chaque lutteur (sinon celui par défaut)
  niveau: Niveau;
  toutDebloque: boolean; // mode test : toutes les cartes disponibles
  victoires: number;
  defaitesDeSuite: number; // remis à zéro à chaque victoire ou booster de consolation
  recompensesEnLigne: string[]; // combats en ligne déjà récompensés (pas de double récompense)
  amis: Record<string, Ami>; // par identifiant de coach
  combatsComptes: string[]; // combats en ligne déjà comptés dans la liste d'amis
  echangesFaits: string[]; // échanges déjà appliqués (pas de double application)
  marchand: { jour: string; faits: number[] }; // offres du marchand utilisées aujourd'hui
  bonusTutoriel: boolean; // tutoriel suivi en entier : boosters doublés au prochain combat d'arène
  styles: Record<string, number>; // style de carte choisi (0 = cadre Champion du Monde classique)
  medailles: number; // médailles gagnées (progression, jamais dépensées)
  club: string[]; // lutteurs recrutés dans Mon Club (une place, la carte reste utilisable partout)
  fragments: Record<string, number>; // fragments de la légendaire de chaque nation
  departComplet: boolean; // a reçu ses 20 cartes de départ (les anciennes sauvegardes sont complétées)
  dollars: number; // $ disponibles (boosters, inscriptions aux tournois)
  tri: TriCollection; // ordre d'affichage de la collection
}

export type TriCollection = 'rarete' | 'nation' | 'fusions' | 'niveau';

export interface Ami {
  pseudo: string;
  vu: number; // date du dernier combat ou échange (ms)
  victoires: number; // mes victoires contre lui
  defaites: number;
  echanges: number;
}

export type TypeBooster = 'classique' | 'rare';
// Un booster : des cartes, et parfois les médailles et les $ de la récompense.
// Type « recompense » : sans cartes, seulement médailles et $.
export interface Booster {
  type: TypeBooster | 'recompense';
  cartes: string[];
  nouvelles: string[]; // cartes obtenues pour la première fois
  medailles?: number;
  dollars?: number;
}


// Au départ : une carte par nation, la moins rare de chaque nation.
// Les 20 cartes de départ : tirées au hasard parmi celles débloquées dès le départ
// (4 communes et 1 rare par nation).
export const POOL_DEPART = () => LUTTEURS.filter((l) => l.depart).map((l) => l.id);
export function cartesDeDepart(hasard: Hasard = Math.random, deja: string[] = []): string[] {
  const pool = POOL_DEPART().filter((id) => !deja.includes(id));
  const out: string[] = [];
  const n = Math.max(0, REGLES.collection.cartesDeDepart - deja.length);
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(hasard() * pool.length), 1)[0]);
  return out;
}

function nouvelId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nouvelleCollection(): Collection {
  return {
    version: 2, coach: null, idCoach: nouvelId(),
    exemplaires: Object.fromEntries(cartesDeDepart().map((id) => [id, 1])), grades: {}, etoiles: {},
    decks: {}, niveau: 'normal', toutDebloque: false, victoires: 0, defaitesDeSuite: 0, recompensesEnLigne: [],
    amis: {}, combatsComptes: [], echangesFaits: [], marchand: { jour: '', faits: [] }, bonusTutoriel: false,
    styles: {}, tri: 'rarete', medailles: 0, dollars: 0, club: [], fragments: {}, departComplet: true,
  };
}

export const nbExemplaires = (c: Collection, id: string) => c.exemplaires[id] ?? 0;
// Grade de la carte (1 = rareté de départ). Borné : une ancienne sauvegarde pouvait dépasser le maximum.
export const gradeDe = (c: Collection, id: string) =>
  nbExemplaires(c, id) > 0 ? Math.min(gradeMaxDe(trouverLutteur(id)), c.grades[id] ?? 1) : 1;

export const etoilesDe = (c: Collection, id: string): Partial<Record<IdAction, number>> => c.etoiles[id] ?? {};
export const nbEtoiles = (c: Collection, id: string) => Object.values(etoilesDe(c, id)).reduce((n: number, x) => n + (x ?? 0), 0);

// La carte telle que le joueur la possède : grade, actions débloquées, étoiles (deck non appliqué).
export function defPossede(c: Collection, id: string): DefLutteur {
  return avecGrade(trouverLutteur(id), gradeDe(c, id), etoilesDe(c, id));
}

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
export function ouvrirBooster(c: Collection, hasard: Hasard, impose?: TypeBooster): Booster {
  const B = REGLES.collection.boosters;
  const type: TypeBooster = impose ?? (hasard() < B.chanceRare ? 'rare' : 'classique');
  const cartes = Array.from({ length: B[type].cartes }, () => tirerCarte(hasard));
  const nouvelles: string[] = [];
  for (const id of cartes) {
    if (nbExemplaires(c, id) === 0) nouvelles.push(id);
    c.exemplaires[id] = nbExemplaires(c, id) + 1;
  }
  return { type, cartes, nouvelles };
}

// ---------- Médailles et $ ----------

// Ajoute des médailles ; chaque palier de 5 médailles franchi rapporte 10 $.
export function gagnerMedailles(c: Collection, n: number): { medailles: number; dollars: number } {
  const E = REGLES.economie;
  const avant = Math.floor(c.medailles / E.medaillesParPalier);
  c.medailles += n;
  const dollars = (Math.floor(c.medailles / E.medaillesParPalier) - avant) * E.dollarsParPalier;
  c.dollars += dollars;
  return { medailles: n, dollars };
}

// Range les gains dans le premier booster de la récompense ; sans booster de cartes,
// un booster « récompense » qui ne contient que les médailles et les $.
export function joindreGains(boosters: Booster[], g: { medailles: number; dollars: number }): Booster[] {
  if (!g.medailles && !g.dollars) return boosters;
  if (!boosters.length) return [{ type: 'recompense', cartes: [], nouvelles: [], medailles: g.medailles, dollars: g.dollars }];
  boosters[0].medailles = (boosters[0].medailles ?? 0) + g.medailles;
  boosters[0].dollars = (boosters[0].dollars ?? 0) + g.dollars;
  return boosters;
}

// ---------- Fragments de légende ----------

export const legendaireDe = (nation: string) => LUTTEURS.find((l) => l.nation === nation && l.rarete === 'legendaire');

// Transforme un double en 1 fragment de la légendaire de sa nation (jamais le dernier exemplaire).
export function enFragment(c: Collection, id: string): string | null {
  if (nbExemplaires(c, id) < 2) return 'Il faut un double : ton dernier exemplaire reste.';
  const l = trouverLutteur(id);
  if (!legendaireDe(l.nation)) return 'Cette nation n\'a pas de légendaire.';
  c.exemplaires[id]--;
  c.fragments[l.nation] = (c.fragments[l.nation] ?? 0) + 1;
  return null;
}

// Avec assez de fragments : la légendaire de la nation rejoint la collection.
export function debloquerLegendaire(c: Collection, nation: string): string | null {
  const leg = legendaireDe(nation);
  const n = REGLES.collection.fragmentsPourLegendaire;
  if (!leg) return 'Cette nation n\'a pas de légendaire.';
  if ((c.fragments[nation] ?? 0) < n) return `Il faut ${n} fragments.`;
  c.fragments[nation] -= n;
  c.exemplaires[leg.id] = (c.exemplaires[leg.id] ?? 0) + 1;
  return null;
}

// Niveau de compte : 1 au départ, +1 toutes les 15 médailles (aucune récompense, juste l'expérience).
export const niveauCompte = (c: Collection) => 1 + Math.floor(c.medailles / REGLES.compte.medaillesParNiveau);

// ---------- Mon Club ----------

// Niveau du club : 0 tant qu'il est fermé, puis 1 à 5 selon les médailles.
export function niveauClub(c: Collection): number {
  const K = REGLES.club;
  if (c.medailles < K.medaillesOuverture) return 0;
  return Math.min(K.niveauMax, 1 + Math.floor((c.medailles - K.medaillesOuverture) / K.medaillesParNiveau));
}

export const placesClub = (c: Collection) => niveauClub(c) * REGLES.club.placesParNiveau;

// Médailles à atteindre pour le niveau suivant (null au niveau maximum).
export function medaillesNiveauSuivant(c: Collection): number | null {
  const K = REGLES.club;
  const n = niveauClub(c);
  if (n >= K.niveauMax) return null;
  return K.medaillesOuverture + n * K.medaillesParNiveau;
}

export function recruter(c: Collection, id: string): string | null {
  if (niveauClub(c) === 0) return `Mon Club s'ouvre à ${REGLES.club.medaillesOuverture} médailles.`;
  if (!possede(c, id)) return 'Tu ne possèdes pas ce lutteur.';
  if (c.club.includes(id)) return 'Ce lutteur est déjà dans ton club.';
  if (c.club.length >= placesClub(c)) return 'Plus de place : fais monter ton club de niveau.';
  c.club = [...c.club, id];
  return null;
}

export function libererPlace(c: Collection, id: string) {
  c.club = c.club.filter((x) => x !== id);
}

// Boutique (Social) : acheter un booster avec des $. Renvoie le booster, ou la raison.
export function acheterBooster(c: Collection, type: TypeBooster, hasard: Hasard): Booster | string {
  const prix = REGLES.economie.prixBooster[type];
  if (c.dollars < prix) return `Il te faut ${prix} $ (tu as ${c.dollars} $).`;
  c.dollars -= prix;
  return ouvrirBooster(c, hasard, type);
}

// Victoire : 1 booster en arène, 2 en ligne (mode collection), plus les médailles (+1 en arène,
// +2 en ligne) et les $ des paliers franchis. `multiplicateur` : 2 pour le combat d'arène qui suit
// le tutoriel (boosters doublés). `boosters` : false en ligne avec les cartes de base (médailles seules).
export function recompenser(c: Collection, ou: 'arene' | 'enLigne', hasard: Hasard, multiplicateur = 1, boosters = true): Booster[] {
  c.victoires++;
  if (ou === 'arene') c.defaitesDeSuite = 0;
  const n = boosters ? REGLES.collection.boostersParVictoire[ou] * multiplicateur : 0;
  const liste = Array.from({ length: n }, () => ouvrirBooster(c, hasard));
  return joindreGains(liste, gagnerMedailles(c, REGLES.economie.medaillesParVictoire[ou]));
}

// Défaite en arène. Toutes les 2 défaites d'affilée : booster de consolation.
export function consoler(c: Collection, hasard: Hasard): Booster | null {
  c.defaitesDeSuite++;
  if (c.defaitesDeSuite < REGLES.collection.defaitesPourConsolation) return null;
  c.defaitesDeSuite = 0;
  return ouvrirBooster(c, hasard);
}

// ---------- Fusion ----------

export type ProchaineFusion =
  | { type: 'grade'; grade: number; niveau: NiveauCarte; doublesNecessaires: number; doublesDispo: number }
  | { type: 'etoile'; actions: IdAction[]; doublesNecessaires: number; doublesDispo: number };

// Ce que permet la prochaine fusion de cette carte : monter d'un niveau de rareté, ou (une fois
// Champion du Monde) ajouter une étoile à une action. null si plus rien n'est possible.
// `niveau` : la rareté atteinte par la fusion.
export function prochaineFusion(c: Collection, id: string): ProchaineFusion | null {
  if (nbExemplaires(c, id) === 0) return null;
  const F = REGLES.fusion;
  const base = trouverLutteur(id);
  const g = gradeDe(c, id);
  const dispo = nbExemplaires(c, id) - 1;
  if (g < gradeMaxDe(base)) {
    return { type: 'grade', grade: g + 1, niveau: niveauCarte(base, g + 1), doublesNecessaires: exemplairesPourGrade(base, g + 1) - 1, doublesDispo: dispo };
  }
  const et = etoilesDe(c, id);
  const actions = defPossede(c, id).actionsPossibles.filter((a) => (et[a] ?? 0) < F.etoilesMaxParAction);
  if (!actions.length) return null;
  return { type: 'etoile', actions, doublesNecessaires: F.doublesParEtoile, doublesDispo: dispo };
}

// Styles de carte débloqués (Champion du Monde, un par quart des étoiles) et style choisi.
export const nbStyles = (c: Collection, id: string) =>
  nbExemplaires(c, id) > 0 ? stylesDebloques(trouverLutteur(id), gradeDe(c, id), nbEtoiles(c, id)) : 0;
export const styleDe = (c: Collection, id: string) => Math.min(nbStyles(c, id), c.styles[id] ?? 0);

// Bouton de test : donne à chaque carte possédée assez de doubles pour la monter au maximum
// (Champion du Monde, puis toutes les étoiles). Renvoie le nombre de doubles ajoutés.
export function doublesPourMaximum(c: Collection): number {
  let ajout = 0;
  for (const l of LUTTEURS) {
    if (nbExemplaires(c, l.id) === 0) continue;
    const g = gradeDe(c, l.id);
    let besoin = 1; // l'original
    for (let x = g + 1; x <= gradeMaxDe(l); x++) besoin += exemplairesPourGrade(l, x) - 1;
    const etoilesRestantes = etoilesPossibles(l) - nbEtoiles(c, l.id);
    besoin += etoilesRestantes * REGLES.fusion.doublesParEtoile;
    if (besoin > nbExemplaires(c, l.id)) {
      ajout += besoin - nbExemplaires(c, l.id);
      c.exemplaires[l.id] = besoin;
    }
  }
  return ajout;
}

// Nombre de fusions faites sur une carte (montées de rareté + étoiles).
export const nbFusions = (c: Collection, id: string) => (nbExemplaires(c, id) > 0 ? gradeDe(c, id) - 1 + nbEtoiles(c, id) : 0);

export const fusionPrete = (c: Collection, id: string) => {
  const f = prochaineFusion(c, id);
  return !!f && f.doublesDispo >= f.doublesNecessaires;
};

// Fusionne : consomme les doubles et monte la carte d'une rareté, ou (Champion du Monde) ajoute une étoile
// à l'action choisie. Renvoie la raison si impossible.
export function fusionner(c: Collection, id: string, action?: IdAction): string | null {
  const f = prochaineFusion(c, id);
  if (!f) return nbExemplaires(c, id) === 0 ? 'Tu ne possèdes pas cette carte.' : 'Cette carte est au maximum : toutes ses actions ont 3 étoiles.';
  if (f.doublesDispo < f.doublesNecessaires) {
    const quoi = f.type === 'grade' ? `monter d'une rareté` : 'gagner une étoile';
    return `Il faut ${f.doublesNecessaires} double${f.doublesNecessaires > 1 ? 's' : ''} pour ${quoi}.`;
  }
  if (f.type === 'etoile') {
    if (!action || !f.actions.includes(action)) return 'Choisis l\'action qui reçoit l\'étoile.';
    const avant = nbStyles(c, id);
    c.exemplaires[id] -= f.doublesNecessaires;
    c.etoiles[id] = { ...etoilesDe(c, id), [action]: (etoilesDe(c, id)[action] ?? 0) + 1 };
    if (nbStyles(c, id) > avant) c.styles[id] = nbStyles(c, id); // nouveau style : on l'affiche
    return null;
  }
  c.exemplaires[id] -= f.doublesNecessaires;
  c.grades[id] = f.grade;
  return null;
}

// ---------- Decks ----------

export function deckDe(c: Collection, id: string): IdAction[] | undefined {
  return c.decks[id];
}

export function choisirDeck(c: Collection, id: string, actions: IdAction[]): string | null {
  if (!LUTTEURS.some((l) => l.id === id)) return 'Lutteur inconnu.';
  const erreur = verifierDeck(defPossede(c, id), actions);
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
  if (b.etoiles && typeof b.etoiles === 'object') c.etoiles = { ...(b.etoiles as Collection['etoiles']) };
  if (b.decks && typeof b.decks === 'object') c.decks = { ...(b.decks as Record<string, IdAction[]>) };
  if (typeof b.coach === 'string' && !verifierPseudo(b.coach)) c.coach = b.coach.trim();
  if (typeof b.idCoach === 'string') c.idCoach = b.idCoach;
  if (b.niveau === 'fort' || b.niveau === 'facile') c.niveau = b.niveau;
  c.toutDebloque = b.toutDebloque === true;
  c.bonusTutoriel = b.bonusTutoriel === true;
  const entier = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  c.medailles = entier(b.medailles);
  if (b.fragments && typeof b.fragments === 'object') {
    c.fragments = Object.fromEntries(Object.entries(b.fragments as Record<string, unknown>).map(([k, v]) => [k, entier(v)]));
  }
  // Ancienne sauvegarde : on complète jusqu'à 20 cartes différentes avec des cartes de départ.
  if (b.departComplet !== true) {
    const miens = Object.keys(c.exemplaires).filter((id) => c.exemplaires[id] > 0);
    for (const id of cartesDeDepart(Math.random, miens)) c.exemplaires[id] = (c.exemplaires[id] ?? 0) + 1;
  }
  c.departComplet = true;
  if (Array.isArray(b.club)) c.club = [...new Set((b.club as unknown[]).filter((x): x is string => typeof x === 'string' && LUTTEURS.some((l) => l.id === x)))];
  c.dollars = entier(b.dollars);
  if (b.styles && typeof b.styles === 'object') c.styles = { ...(b.styles as Record<string, number>) };
  if (['rarete', 'nation', 'fusions', 'niveau'].includes(b.tri as string)) c.tri = b.tri as TriCollection;
  if (typeof b.victoires === 'number') c.victoires = b.victoires;
  if (typeof b.defaitesDeSuite === 'number') c.defaitesDeSuite = b.defaitesDeSuite;
  if (Array.isArray(b.recompensesEnLigne)) c.recompensesEnLigne = (b.recompensesEnLigne as string[]).slice(-50);
  if (b.amis && typeof b.amis === 'object') c.amis = { ...(b.amis as Record<string, Ami>) };
  if (Array.isArray(b.combatsComptes)) c.combatsComptes = (b.combatsComptes as string[]).slice(-100);
  if (Array.isArray(b.echangesFaits)) c.echangesFaits = (b.echangesFaits as string[]).slice(-100);
  const m = b.marchand as { jour?: unknown; faits?: unknown } | undefined;
  if (m && typeof m.jour === 'string' && Array.isArray(m.faits)) c.marchand = { jour: m.jour, faits: m.faits.filter((x): x is number => typeof x === 'number') };
  // Nettoyage : cartes inconnues, decks invalides
  for (const id of Object.keys(c.exemplaires)) {
    if (!LUTTEURS.some((l) => l.id === id) || !(c.exemplaires[id] > 0)) delete c.exemplaires[id];
  }
  for (const [id, deck] of Object.entries(c.decks)) {
    if (!LUTTEURS.some((l) => l.id === id) || verifierDeck(defPossede(c, id), deck)) delete c.decks[id];
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
