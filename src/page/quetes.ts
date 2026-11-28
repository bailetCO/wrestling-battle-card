// Quêtes journalières, sans affichage. Chaque jour, 3 quêtes tirées parmi celles du niveau de compte :
// une facile, une moyenne, une difficile ; tant qu'il reste des quêtes uniques à faire, l'une d'elles
// remplace la quête facile. Une quête (pas unique) peut être changée une fois par jour pour 5 $.
// Une quête non finie disparaît à minuit.

import { CHAMPIONS, LUTTEURS, NATIONS, REGLES, creerHasard, niveauCarte, trouverLutteur, type Hasard, type Niveau } from '../moteur';
import { fonctionVisible, type IdFonction } from './menu';
import {
  carteConnue, cartesPossedees, gagnerMedailles, gradeDe, nbExemplaires, nbStyles, niveauClub, niveauCompte, ouvrirBooster, placesClub, prochaineFusion,
  type Booster, type Collection,
} from './collection';

export type Difficulte = 'facile' | 'moyenne' | 'difficile' | 'unique';

// Ce qui se passe dans le jeu et peut faire avancer une quête.
export type EvenementQuete =
  | {
      type: 'combat'; // un combat du joueur terminé
      mode: 'arene' | 'rapide' | 'tournoi' | 'equipe' | 'enLigne';
      gagne: boolean;
      niveau: Niveau | null; // ordinateur (null en ligne)
      auto: boolean;
      tombe: boolean;
      ecart: number; // mon score − score adverse (combat rapide)
      points: number; // points que j'ai marqués
      nation: string; // nation de mon lutteur
      niveauCarte: string; // niveau actuel de ma carte (commune…)
      feintes: number; // feintes réussies
      contres: number; // contres qui ont marqué
      champion: boolean; // champion d'une nation battu en Carrière
      combos?: number; // combos réussis (combat joué à la main)
      ruptures?: number; // chaînes adverses brisées (mode Enchaînement)
      souffle?: boolean; // second souffle pris pendant le combat
      enchainement?: boolean; // format Enchaînement
      infini?: boolean; // durée infinie
      rival?: boolean; // contre Cocoach, le rival
      tours?: number; // nombre de tours joués
      epuisement?: number; // durée infinie : tour où commence l'épuisement
    }
  | { type: 'arene' } // un adversaire de la Carrière battu (progression)
  | { type: 'tournoi'; place: number } // tournoi individuel terminé
  | { type: 'booster'; n: number } // boosters ouverts
  | { type: 'deck' }
  | { type: 'fusion'; etoile: boolean }
  | { type: 'fragments' } // légendaire débloquée grâce aux fragments
  | { type: 'tutoriel' }
  | { type: 'etat' }; // simple vérification (quêtes uniques sur la collection)

export interface DefQuete {
  id: string;
  difficulte: Difficulte;
  niveauMin: number;
  but: number;
  texte: (param: string) => string;
  // Progression apportée par un événement (0 = rien) ; « remise » : la série repart de zéro.
  avance?: (ev: EvenementQuete, param: string) => number | 'remise';
  // Quête unique sur l'état de la collection : déjà remplie ?
  etat?: (c: Collection) => boolean;
  recompense?: { dollars?: number; medailles?: number; boosters?: number; boostersRares?: number; boostersEpiques?: number; champion?: boolean };
}

const combat = (ev: EvenementQuete) => (ev.type === 'combat' ? ev : null);
const contreOrdi = (ev: EvenementQuete) => { const c = combat(ev); return c && c.niveau !== null ? c : null; };
const nomNation = (id: string) => NATIONS.find((n) => n.id === id)?.nom ?? id;
const memeNation = (c: Collection, n: number) => {
  const compte = new Map<string, number>();
  for (const id of c.club) compte.set(trouverLutteur(id).nation, (compte.get(trouverLutteur(id).nation) ?? 0) + 1);
  return Math.max(0, ...compte.values()) >= n;
};

// Destinations du bouton « Aller à la quête » : l'écran (adresse après le #), le texte du bouton, et
// un réglage déjà choisi en arrivant sur l'Entraînement (ordinateur fort, Enchaînement, durée infinie).
export type IdDestination = 'carriere' | 'entrainement' | 'fort' | 'enchainement' | 'infini' | 'boutique' | 'collection' | 'fusion' | 'tournois' | 'club' | 'amis' | 'tutoriel';
export const DESTINATIONS: Record<IdDestination, { lien: string; bouton: string; reglage?: 'fort' | 'enchainement' | 'infini' }> = {
  carriere: { lien: '#arene', bouton: 'Aller à la Carrière' },
  entrainement: { lien: '#rapide', bouton: 'Aller à l\'Entraînement' },
  fort: { lien: '#rapide', bouton: 'Entraînement contre l\'ordinateur fort', reglage: 'fort' },
  enchainement: { lien: '#rapide', bouton: 'Entraînement en Enchaînement', reglage: 'enchainement' },
  infini: { lien: '#rapide', bouton: 'Entraînement en durée infinie', reglage: 'infini' },
  boutique: { lien: '#social', bouton: 'Aller à la boutique' },
  collection: { lien: '#collection', bouton: 'Aller à la Collection' },
  fusion: { lien: '#fusion', bouton: 'Aller à la Fusion' },
  tournois: { lien: '#tournois', bouton: 'Aller aux Tournois' },
  club: { lien: '#club', bouton: 'Aller à Mon Club' },
  amis: { lien: '#amis', bouton: 'Combat entre amis' },
  tutoriel: { lien: '#tutoriel', bouton: 'Aller au tutoriel' },
};

// Destination de chaque quête (le test vérifie qu'aucune n'est oubliée).
const ALLER: Record<string, IdDestination> = {
  'arene-lancer': 'carriere', 'gagner-1': 'entrainement', 'rapide-jouer': 'entrainement', booster: 'boutique', feintes: 'entrainement',
  contres: 'entrainement', 'ench-jouer': 'enchainement', deck: 'collection', 'gagner-3': 'entrainement', nation: 'entrainement',
  'points-20': 'entrainement', tombe: 'entrainement', 'rapide-10': 'entrainement', 'combos-3': 'entrainement', 'chaine-2': 'enchainement',
  'souffle-gagne': 'entrainement', 'rival-1': 'infini', 'tenir-30': 'infini', 'auto-2': 'carriere', fusion: 'fusion', 'arene-2': 'carriere',
  fort: 'fort', commune: 'entrainement', podium: 'tournois', tournoi: 'tournois', equipe: 'tournois', champion: 'carriere', 'en-ligne': 'amis',
  infini: 'infini', 'ench-3': 'enchainement', 'infini-40': 'infini', 'serie-fort': 'fort',
  'u-tutoriel': 'tutoriel', 'u-30-cartes': 'boutique', 'u-etoile': 'fusion', 'u-club': 'club', 'u-action-champion': 'fusion',
  'u-4-combos': 'entrainement', 'u-rival-champion': 'infini', 'u-auto': 'carriere', 'u-ami': 'amis', 'u-club-plein': 'club',
  'u-nation-10': 'club', 'u-nations': 'boutique', 'u-fragments': 'fusion', 'u-60-cartes': 'boutique', 'u-champion': 'boutique',
  'u-style': 'fusion', 'u-120-cartes': 'boutique',
};
export const destinationQuete = (id: string) => (ALLER[id] ? DESTINATIONS[ALLER[id]] : null);

export const QUETES: DefQuete[] = [
  // ----- Faciles -----
  { id: 'arene-lancer', difficulte: 'facile', niveauMin: 1, but: 1, texte: () => 'Lancer un combat en Carrière', avance: (ev) => (combat(ev)?.mode === 'arene' ? 1 : 0) },
  { id: 'gagner-1', difficulte: 'facile', niveauMin: 1, but: 1, texte: () => 'Gagner 1 combat contre l\'ordinateur', avance: (ev) => (contreOrdi(ev)?.gagne ? 1 : 0) },
  { id: 'rapide-jouer', difficulte: 'facile', niveauMin: 1, but: 1, texte: () => 'Jouer 1 combat d\'entraînement', avance: (ev) => (combat(ev)?.mode === 'rapide' ? 1 : 0) },
  { id: 'booster', difficulte: 'facile', niveauMin: 1, but: 1, texte: () => 'Ouvrir 1 booster', avance: (ev) => (ev.type === 'booster' ? ev.n : 0) },
  { id: 'feintes', difficulte: 'facile', niveauMin: 1, but: 3, texte: () => 'Réussir 3 feintes en combat', avance: (ev) => combat(ev)?.feintes ?? 0 },
  { id: 'contres', difficulte: 'facile', niveauMin: 1, but: 2, texte: () => 'Réussir 2 contres en combat', avance: (ev) => combat(ev)?.contres ?? 0 },
  { id: 'ench-jouer', difficulte: 'facile', niveauMin: 1, but: 1, texte: () => 'Jouer 1 combat en format Enchaînement', avance: (ev) => (combat(ev)?.enchainement ? 1 : 0) },
  { id: 'deck', difficulte: 'facile', niveauMin: 2, but: 1, texte: () => 'Régler les actions d\'un de tes lutteurs', avance: (ev) => (ev.type === 'deck' ? 1 : 0) },
  // ----- Moyennes -----
  { id: 'gagner-3', difficulte: 'moyenne', niveauMin: 1, but: 3, texte: () => 'Gagner 3 combats contre l\'ordinateur', avance: (ev) => (contreOrdi(ev)?.gagne ? 1 : 0) },
  { id: 'nation', difficulte: 'moyenne', niveauMin: 1, but: 1, texte: (n) => `Gagner un combat avec un lutteur de la nation : ${nomNation(n)}`, avance: (ev, n) => (combat(ev)?.gagne && combat(ev)!.nation === n ? 1 : 0) },
  { id: 'points-20', difficulte: 'moyenne', niveauMin: 1, but: 20, texte: () => 'Marquer 20 points au total en combat', avance: (ev) => combat(ev)?.points ?? 0 },
  { id: 'tombe', difficulte: 'moyenne', niveauMin: 2, but: 1, texte: () => 'Gagner un combat par tombé', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.tombe ? 1 : 0) },
  { id: 'rapide-10', difficulte: 'moyenne', niveauMin: 2, but: 1, texte: () => 'Gagner un combat d\'entraînement par 10 points d\'écart', avance: (ev) => { const c = combat(ev); return c?.mode === 'rapide' && c.gagne && c.ecart >= REGLES.ecartSuperiorite ? 1 : 0; } },
  { id: 'combos-3', difficulte: 'moyenne', niveauMin: 1, but: 3, texte: () => 'Réussir 3 combos en combat', avance: (ev) => combat(ev)?.combos ?? 0 },
  { id: 'chaine-2', difficulte: 'moyenne', niveauMin: 2, but: 2, texte: () => 'Briser 2 fois la chaîne adverse (format Enchaînement)', avance: (ev) => combat(ev)?.ruptures ?? 0 },
  { id: 'souffle-gagne', difficulte: 'moyenne', niveauMin: 2, but: 1, texte: () => 'Gagner un combat après avoir pris ton second souffle', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.souffle && !combat(ev)!.auto ? 1 : 0) },
  { id: 'rival-1', difficulte: 'moyenne', niveauMin: 2, but: 1, texte: () => 'Battre Cocoach, ton rival (entraînement, durée infinie)', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.rival && !combat(ev)!.auto ? 1 : 0) },
  { id: 'tenir-30', difficulte: 'moyenne', niveauMin: 2, but: 1, texte: () => 'Tenir 30 tours dans un combat en durée infinie', avance: (ev) => (combat(ev)?.infini && !combat(ev)!.auto && (combat(ev)!.tours ?? 0) >= 30 ? 1 : 0) },
  { id: 'auto-2', difficulte: 'moyenne', niveauMin: 3, but: 2, texte: () => 'Gagner 2 combats en mode auto', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.auto ? 1 : 0) },
  { id: 'fusion', difficulte: 'moyenne', niveauMin: 3, but: 1, texte: () => 'Faire une fusion', avance: (ev) => (ev.type === 'fusion' ? 1 : 0) },
  { id: 'arene-2', difficulte: 'moyenne', niveauMin: 4, but: 2, texte: () => 'Avancer de 2 adversaires en Carrière', avance: (ev) => (ev.type === 'arene' ? 1 : 0) },
  // ----- Difficiles -----
  { id: 'fort', difficulte: 'difficile', niveauMin: 2, but: 1, texte: () => 'Gagner un combat contre l\'ordinateur fort, en jouant toi-même', avance: (ev) => { const c = contreOrdi(ev); return c?.gagne && c.niveau === 'fort' && !c.auto ? 1 : 0; } },
  { id: 'commune', difficulte: 'difficile', niveauMin: 3, but: 1, texte: () => 'Gagner avec une carte commune contre l\'ordinateur normal ou fort', avance: (ev) => { const c = contreOrdi(ev); return c?.gagne && c.niveauCarte === 'commune' && c.niveau !== 'facile' ? 1 : 0; } },
  { id: 'podium', difficulte: 'difficile', niveauMin: 4, but: 1, texte: () => 'Finir sur le podium d\'un tournoi individuel', avance: (ev) => (ev.type === 'tournoi' && ev.place <= 3 ? 1 : 0) },
  { id: 'tournoi', difficulte: 'difficile', niveauMin: 5, but: 1, texte: () => 'Gagner un tournoi individuel', avance: (ev) => (ev.type === 'tournoi' && ev.place === 1 ? 1 : 0) },
  { id: 'equipe', difficulte: 'difficile', niveauMin: 5, but: 1, texte: () => 'Gagner un duel d\'un tournoi par équipe', avance: (ev) => (combat(ev)?.mode === 'equipe' && combat(ev)!.gagne ? 1 : 0) },
  { id: 'champion', difficulte: 'difficile', niveauMin: 6, but: 1, texte: () => 'Battre le champion d\'une nation en Carrière', avance: (ev) => (combat(ev)?.champion ? 1 : 0) },
  { id: 'en-ligne', difficulte: 'difficile', niveauMin: 6, but: 1, texte: () => 'Gagner un combat en ligne contre un ami', avance: (ev) => (combat(ev)?.mode === 'enLigne' && combat(ev)!.gagne ? 1 : 0) },
  { id: 'infini', difficulte: 'difficile', niveauMin: 3, but: 1, texte: () => 'Gagner un combat en durée infinie', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.infini && !combat(ev)!.auto ? 1 : 0) },
  { id: 'ench-3', difficulte: 'difficile', niveauMin: 3, but: 3, texte: () => 'Gagner 3 combats en format Enchaînement', avance: (ev) => (combat(ev)?.gagne && combat(ev)!.enchainement ? 1 : 0) },
  { id: 'infini-40', difficulte: 'difficile', niveauMin: 4, but: 1, texte: () => 'Gagner un combat en durée infinie qui dure 40 tours ou plus', avance: (ev) => { const c = combat(ev); return c?.gagne && c.infini && !c.auto && (c.tours ?? 0) >= 40 ? 1 : 0; } },
  { id: 'serie-fort', difficulte: 'difficile', niveauMin: 8, but: 3, texte: () => 'Gagner 3 combats d\'affilée contre l\'ordinateur fort', avance: (ev) => { const c = contreOrdi(ev); if (!c || c.niveau !== 'fort') return 0; return c.gagne ? 1 : 'remise'; } },
  // ----- Uniques -----
  { id: 'u-tutoriel', difficulte: 'unique', niveauMin: 1, but: 1, texte: () => 'Finir le tutoriel', avance: (ev) => (ev.type === 'tutoriel' ? 1 : 0), etat: (c) => c.bonusTutoriel, recompense: { boosters: 1 } },
  { id: 'u-30-cartes', difficulte: 'unique', niveauMin: 1, but: 1, texte: () => 'Posséder 30 cartes différentes', etat: (c) => cartesPossedees(c) >= 30, recompense: { boosters: 1 } },
  { id: 'u-etoile', difficulte: 'unique', niveauMin: 2, but: 1, texte: () => 'Donner une première étoile à une action', avance: (ev) => (ev.type === 'fusion' && ev.etoile ? 1 : 0), etat: (c) => Object.values(c.etoiles).some((e) => Object.values(e ?? {}).some((n) => (n ?? 0) > 0)), recompense: { dollars: 20 } },
  { id: 'u-club', difficulte: 'unique', niveauMin: 3, but: 1, texte: () => 'Ouvrir Mon Club', etat: (c) => niveauClub(c) > 0, recompense: { boostersRares: 1 } },
  { id: 'u-action-champion', difficulte: 'unique', niveauMin: 3, but: 1, texte: () => 'Débloquer une première action de Champion (une carte montée Champion du Monde par fusion)', etat: (c) => LUTTEURS.some((l) => nbExemplaires(c, l.id) > 0 && niveauCarte(l, gradeDe(c, l.id)) === 'champion'), recompense: { boostersRares: 1 } },
  { id: 'u-4-combos', difficulte: 'unique', niveauMin: 2, but: 1, texte: () => 'Réussir les 4 combos différents (Passage dans le dos, Contre-temps, Enchaînement aux jambes, Esquive et contre)', etat: (c) => c.combosVus.length >= 4, recompense: { boosters: 2 } },
  { id: 'u-rival-champion', difficulte: 'unique', niveauMin: 4, but: 1, texte: () => 'Faire monter Cocoach, ton rival, au niveau Champion du Monde', etat: (c) => c.rival.grade >= 4, recompense: { boostersRares: 2 } },
  { id: 'u-auto', difficulte: 'unique', niveauMin: 3, but: 1, texte: () => 'Lancer ton premier combat auto', avance: (ev) => (combat(ev)?.auto ? 1 : 0), recompense: { dollars: 10 } },
  { id: 'u-ami', difficulte: 'unique', niveauMin: 4, but: 1, texte: () => 'Ajouter un premier ami (combat ou transfert en ligne)', etat: (c) => Object.keys(c.amis).length > 0, recompense: { boosters: 1 } },
  { id: 'u-club-plein', difficulte: 'unique', niveauMin: 5, but: 1, texte: () => 'Remplir les 5 places de Mon Club', etat: (c) => placesClub(c) >= 5 && c.club.length >= 5, recompense: { boostersRares: 1 } },
  { id: 'u-nation-10', difficulte: 'unique', niveauMin: 5, but: 1, texte: () => 'Avoir le bonus de nation de +10 % (5 lutteurs d\'une même nation dans Mon Club)', etat: (c) => memeNation(c, 5), recompense: { boosters: 2 } },
  { id: 'u-nations', difficulte: 'unique', niveauMin: 6, but: 1, texte: () => 'Posséder une carte de chaque nation', etat: (c) => NATIONS.every((n) => LUTTEURS.some((l) => l.nation === n.id && nbExemplaires(c, l.id) > 0)), recompense: { boostersRares: 1 } },
  { id: 'u-fragments', difficulte: 'unique', niveauMin: 7, but: 1, texte: () => 'Débloquer une légendaire grâce aux fragments', avance: (ev) => (ev.type === 'fragments' ? 1 : 0), recompense: { dollars: 50 } },
  { id: 'u-60-cartes', difficulte: 'unique', niveauMin: 8, but: 1, texte: () => 'Posséder 60 cartes différentes', etat: (c) => cartesPossedees(c) >= 60, recompense: { boostersRares: 2 } },
  { id: 'u-champion', difficulte: 'unique', niveauMin: 10, but: 1, texte: () => 'Obtenir une carte Champion du Monde', etat: (c) => CHAMPIONS.some((l) => nbExemplaires(c, l.id) > 0), recompense: { dollars: 100 } },
  { id: 'u-style', difficulte: 'unique', niveauMin: 10, but: 1, texte: () => 'Débloquer un style de carte', etat: (c) => [...LUTTEURS, ...CHAMPIONS].some((l) => nbStyles(c, l.id) > 0), recompense: { boostersRares: 2 } },
  { id: 'u-120-cartes', difficulte: 'unique', niveauMin: 12, but: 1, texte: () => 'Posséder les 120 cartes', etat: (c) => cartesPossedees(c) >= LUTTEURS.length, recompense: { champion: true } },
];

export const queteDe = (id: string) => QUETES.find((q) => q.id === id)!;

export interface QueteDuJour { id: string; param: string; progres: number; faite: boolean }
export interface EtatQuetes {
  jour: string;
  liste: QueteDuJour[];
  change: boolean; // une quête a déjà été changée aujourd'hui
  bonus: boolean; // bonus des 3 quêtes déjà reçu
  uniques: string[]; // quêtes uniques réussies (pour toujours)
}

export const quetesVides = (): EtatQuetes => ({ jour: '', liste: [], change: false, bonus: false, uniques: [] });

const Q = () => REGLES.quetes;

// Récompense d'une quête, en mots.
export function texteRecompense(q: DefQuete): string {
  const r = q.recompense ?? Q().recompenses[q.difficulte as 'facile' | 'moyenne' | 'difficile'];
  const parts: string[] = [];
  if (r.champion) parts.push('1 carte Champion du Monde');
  if (r.boostersRares) parts.push(`${r.boostersRares} booster${r.boostersRares > 1 ? 's' : ''} rare${r.boostersRares > 1 ? 's' : ''}`);
  if (r.boostersEpiques) parts.push(`${r.boostersEpiques} booster${r.boostersEpiques > 1 ? 's' : ''} épique${r.boostersEpiques > 1 ? 's' : ''}`);
  if (r.boosters) parts.push(`${r.boosters} booster${r.boosters > 1 ? 's' : ''}`);
  if (r.dollars) parts.push(`${r.dollars} $`);
  if (r.medailles) parts.push(`${r.medailles} médaille${r.medailles > 1 ? 's' : ''}`);
  return parts.join(' + ');
}

function hasardDuJour(c: Collection, jour: string, sel = 0): Hasard {
  let x = sel;
  for (const ch of `${c.idCoach ?? ''}|${jour}`) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return creerHasard(x);
}

// Quêtes qui demandent un mode pas encore ouvert par le mode histoire : jamais tirées avant (27/11/2026).
const FONCTION_QUETE: Record<string, IdFonction> = {
  'ench-jouer': 'enchainement', 'chaine-2': 'enchainement', 'ench-3': 'enchainement',
  'rival-1': 'infini', 'tenir-30': 'infini', infini: 'infini', 'infini-40': 'infini', 'u-rival-champion': 'infini',
  fort: 'fort', 'serie-fort': 'fort', 'en-ligne': 'amis', 'u-ami': 'amis', equipe: 'equipe',
  'combos-3': 'combos', 'u-4-combos': 'combos', // les combos s'ouvrent avec le mode histoire (28/11/2026)
};
export const queteOuverte = (c: Collection, id: string) => !FONCTION_QUETE[id] || fonctionVisible(c, FONCTION_QUETE[id]);

// « Faire une fusion » n'est proposée que si une fusion est prête ou presque (au plus 1 double manquant) :
// depuis le 28/11/2026, il faut plus d'exemplaires et un débutant n'a souvent rien à fusionner.
export const fusionAPortee = (c: Collection) => Object.keys(c.exemplaires).some((id) => {
  if (!carteConnue(id)) return false;
  const f = prochaineFusion(c, id);
  return !!f && f.doublesDispo >= f.doublesNecessaires - 1;
});
const quetePossible = (c: Collection, id: string) => queteOuverte(c, id) && (id !== 'fusion' || fusionAPortee(c));

const disponibles = (c: Collection, d: Difficulte, exclus: string[]) =>
  QUETES.filter((q) => q.difficulte === d && q.niveauMin <= niveauCompte(c) && !exclus.includes(q.id) && (d !== 'unique' || !c.quetes.uniques.includes(q.id)) && quetePossible(c, q.id));

function tirer(c: Collection, d: Difficulte, exclus: string[], h: Hasard): QueteDuJour | null {
  const pool = disponibles(c, d, exclus);
  if (!pool.length) return null;
  const q = d === 'unique' ? pool[0] : pool[Math.floor(h() * pool.length)];
  const param = q.id === 'nation' ? NATIONS[Math.floor(h() * NATIONS.length)].id : '';
  return { id: q.id, param, progres: 0, faite: false };
}

// Prépare les quêtes du jour (nouveau jour : nouvelles quêtes ; les quêtes non finies disparaissent).
export function quetesDuJour(c: Collection, jour: string): QueteDuJour[] {
  if (c.quetes.jour === jour && c.quetes.liste.length && c.quetes.liste.every((q) => QUETES.some((d) => d.id === q.id))) return c.quetes.liste;
  const h = hasardDuJour(c, jour);
  const liste: QueteDuJour[] = [];
  const unique = tirer(c, 'unique', [], h);
  liste.push(unique ?? tirer(c, 'facile', [], h)!);
  for (const d of ['moyenne', 'difficile'] as const) {
    const q = tirer(c, d, liste.map((x) => x.id), h) ?? tirer(c, 'moyenne', liste.map((x) => x.id), h) ?? tirer(c, 'facile', liste.map((x) => x.id), h);
    if (q) liste.push(q);
  }
  c.quetes = { ...c.quetes, jour, liste, change: false, bonus: false };
  return liste;
}

// Change une quête (pas unique) contre une autre de même difficulté : une fois par jour, 5 $.
export function changerQuete(c: Collection, jour: string, i: number): string | null {
  const liste = quetesDuJour(c, jour);
  const q = liste[i];
  if (!q) return 'Quête inconnue.';
  if (q.faite) return 'Cette quête est déjà réussie.';
  if (queteDe(q.id).difficulte === 'unique') return 'Une quête unique ne peut pas être changée.';
  if (c.quetes.change) return 'Tu as déjà changé une quête aujourd\'hui.';
  if (c.dollars < Q().prixChangement) return `Il te faut ${Q().prixChangement} $ (tu as ${c.dollars} $).`;
  const nouvelle = tirer(c, queteDe(q.id).difficulte, liste.map((x) => x.id), hasardDuJour(c, jour, 7 + i));
  if (!nouvelle) return 'Pas d\'autre quête disponible pour l\'instant.';
  c.dollars -= Q().prixChangement;
  liste[i] = nouvelle;
  c.quetes.change = true;
  return null;
}

export interface QueteReussie { titre: string; boosters: Booster[]; dollars: number; medailles: number }

function donner(c: Collection, r: NonNullable<DefQuete['recompense']>, hasard: Hasard): Omit<QueteReussie, 'titre'> {
  const boosters: Booster[] = [];
  for (let k = 0; k < (r.boosters ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'classique'));
  for (let k = 0; k < (r.boostersRares ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'rare'));
  for (let k = 0; k < (r.boostersEpiques ?? 0); k++) boosters.push(ouvrirBooster(c, hasard, 'epique'));
  if (r.champion) {
    const id = CHAMPIONS[Math.floor(hasard() * CHAMPIONS.length)].id;
    const nouvelle = nbExemplaires(c, id) === 0;
    c.exemplaires[id] = nbExemplaires(c, id) + 1;
    boosters.push({ type: 'recompense', cartes: [id], nouvelles: nouvelle ? [id] : [] });
  }
  c.dollars += r.dollars ?? 0;
  if (r.medailles) gagnerMedailles(c, r.medailles);
  return { boosters, dollars: r.dollars ?? 0, medailles: r.medailles ?? 0 };
}

// Note un événement : fait avancer les quêtes du jour ; renvoie les quêtes réussies (et le bonus).
export function noterQuete(c: Collection, ev: EvenementQuete, jour: string, hasard: Hasard): QueteReussie[] {
  const liste = quetesDuJour(c, jour);
  const faites: QueteReussie[] = [];
  for (const q of liste) {
    if (q.faite) continue;
    const def = queteDe(q.id);
    const a = def.avance ? def.avance(ev, q.param) : 0;
    if (a === 'remise') q.progres = 0;
    else q.progres = Math.min(def.but, q.progres + a);
    if (def.etat?.(c)) q.progres = def.but;
    if (q.progres < def.but) continue;
    q.faite = true;
    if (def.difficulte === 'unique') c.quetes.uniques.push(def.id);
    const r = def.recompense ?? Q().recompenses[def.difficulte as 'facile' | 'moyenne' | 'difficile'];
    faites.push({ titre: def.texte(q.param), ...donner(c, r, hasard) });
  }
  if (!c.quetes.bonus && liste.length === 3 && liste.every((q) => q.faite)) {
    c.quetes.bonus = true;
    faites.push({ titre: 'Bonus : les 3 quêtes du jour', ...donner(c, Q().bonus, hasard) });
  }
  return faites;
}
