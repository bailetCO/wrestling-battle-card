import { createurValide, enregistrerCreateur, type Createur } from './createurs';
// La collection du joueur : son pseudo de coach, ses cartes (exemplaires et grades), ses decks.
// Sauvegardée dans le navigateur du téléphone (une vraie sauvegarde par compte viendra avec Firebase).

import type { Rarete } from '../moteur';
import {
  CARTES_SPECIALES, CHAMPIONS, ID_LUTTEUR_TEST, LUTTEURS, REGLES, avecGrade, etoilesPossibles, exemplairesPourGrade, gradeMaxDe, niveauCarte, stylesDebloques, trouverLutteur, verifierDeck,
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
  aOuvrir: RecompenseAOuvrir[]; // boîte à récompenses : gagnées ailleurs qu'en fin de combat, à ouvrir (cartes déjà dans la collection)
  recompensesEnLigne: string[]; // combats en ligne déjà récompensés (pas de double récompense)
  amis: Record<string, Ami>; // par identifiant de coach
  combatsComptes: string[]; // combats en ligne déjà comptés dans la liste d'amis
  echangesFaits: string[]; // échanges déjà appliqués (pas de double application)
  marchand: { jour: string; faits: number[] }; // offres du marchand utilisées aujourd'hui
  bonusTutoriel: boolean; // tutoriel suivi en entier : boosters doublés au prochain combat d'arène
  styles: Record<string, number>; // style de carte choisi (0 = cadre Champion du Monde classique)
  medailles: number; // médailles gagnées (progression, jamais dépensées)
  club: string[]; // lutteurs recrutés dans Mon Club (une place, la carte reste utilisable partout)
  clubRecompense: number; // dernier niveau de Mon Club dont le booster rare a été donné (niveaux 6 à 10)
  fragments: Record<string, number>; // fragments de la légendaire de chaque nation
  arene: number; // progression dans l'arène : nation × 5 + rang de l'adversaire en cours
  departComplet: boolean; // a reçu ses 20 cartes de départ (les anciennes sauvegardes sont complétées)
  dollars: number; // $ disponibles (boosters, inscriptions aux tournois)
  tri: TriCollection; // ordre d'affichage de la collection
  histoire: { etape: number; nations: string[]; passees: string[] }; // mode histoire : quête en cours (0 = quête 1) ; quêtes passées, encore à réussir
  saison: { palier: number; victoires: number; numero: number; terminees: number }; // saison sportive : palier en cours (0 = interclub), victoires interclub, n° de la saison (1, 2…), saisons terminées
  scenesVues: string[]; // scènes de dialogue déjà montrées
  ouverts: string[]; // tuiles du menu et modes restés ouverts après le passage à 33 quêtes (28/11/2026)
  palmares: { fort: number; derniereFort: number }; // classement à vie : victoires contre l'ordinateur fort (à la main), heure de la dernière
  combosVus: string[]; // combos différents déjà réussis (quête unique des 4 combos)
  tutosVus: string[]; // tutoriels courts déjà vus (ouverts tout seuls à la première visite d'un mode)
  essaisGagnes: string[]; // tutoriels courts dont la partie d'essai a été gagnée (booster déjà donné)
  menusVus: string[]; // tuiles du menu déjà visitées (les autres portent « Nouveau »)
  battusMain: string[]; // lutteurs adverses battus au moins une fois en jouant soi-même (le combat auto n'est permis que contre eux)
  rival: { grade: number; etoiles: Partial<Record<IdAction, number>>; victoires: number; bonus: number }; // Cocoach, rival du mode infini
  classement: Classement; // classement mensuel : points du mois, plafond du jour, badge, fins de mois à récompenser
  createurs: Createur[]; // codes créateurs entrés (chacun une fois) : leurs cartes sont connues du jeu
  defisCreateurs: Record<string, string>; // défi du créateur : code → dernier mois (« 2026-12 ») où il a été récompensé
  createurSoutenu: string; // dernier code créateur entré
  quotidien: { jour: string; rang: number; visite: string; retour: string }; // dernier jour réclamé, prochaine case (0 à 6), dernière visite, dernier bonus de retour (jours AAAA-MM-JJ)
  parrain: { id: string; pseudo: string; declare: boolean } | null; // coach qui m'a invité (nouveau joueur) ; declare : signalé en ligne
  parrainage: { vus: string[]; recompenses: number; partage: boolean }; // amis invités déjà comptés, parrainages récompensés, lien déjà partagé
  pays: string; // pays choisi par le joueur (code à 2 lettres, '' = pas choisi), pour le classement par pays
  quetes: { jour: string; liste: { id: string; param: string; progres: number; faite: boolean }[]; change: boolean; bonus: boolean; uniques: string[] }; // quêtes journalières
}

export interface Classement {
  mois: string; // « 2026-11 » (heure universelle)
  points: number; // score en ligne du mois (barres des divisions passées + barre en cours) : sert à classer
  enLigne: number; // combats en ligne joués ce mois (au moins 1 : récompense de fin de saison)
  badge: { palier: string | null; top: boolean; mois: string } | null; // résultat du dernier mois terminé
  enAttente: { mois: string; points: number; division: number }[]; // mois terminés pas encore récompensés (Top 10 à vérifier en ligne)
  division: number; // division en ligne de la saison en cours (0 = Bronze … 5 = Maître)
  progression: number; // barre de la division (0 à REGLES.classement.barres[division] ; sans limite en Maître)
  derniereEnLigne: number; // heure (ms) du dernier combat en ligne compté (anti-triche, comme Firebase)
  cadres: string[]; // cadres de saison gagnés (« 2026-11:or ») ; posés sur une carte avec cadreCartes
  cadreCartes: Record<string, string>; // carte → cadre posé
}
export const classementVide = (): Classement => ({ mois: '', points: 0, enLigne: 0, badge: null, enAttente: [], division: 0, progression: 0, derniereEnLigne: 0, cadres: [], cadreCartes: {} });

export type TriCollection = 'rarete' | 'nation' | 'fusions' | 'niveau';

export interface Ami {
  pseudo: string;
  vu: number; // date du dernier combat ou échange (ms)
  victoires: number; // mes victoires contre lui
  defaites: number;
  echanges: number;
}

export type TypeBooster = 'classique' | 'rare' | 'epique';
// Un booster : des cartes, et parfois les médailles et les $ de la récompense.
// Type « recompense » : sans cartes, seulement médailles et $.
// Une récompense de la boîte : étape, palier de saison, quête, niveau de Mon Club.
export type SourceRecompense = 'histoire' | 'saison' | 'quetes' | 'club' | 'classement' | 'parrainage' | 'quotidien';
export interface RecompenseAOuvrir { titre: string; source: SourceRecompense; boosters: Booster[] }

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
// Carte connue du jeu : un des 120 lutteurs ou une des 12 cartes Champion du Monde.
export const carteConnue = (id: string) => LUTTEURS.some((l) => l.id === id) || CHAMPIONS.some((l) => l.id === id) || CARTES_SPECIALES.some((l) => l.id === id);

export const POOL_DEPART = () => LUTTEURS.filter((l) => l.depart).map((l) => l.id);
export function cartesDeDepart(hasard: Hasard = Math.random, deja: string[] = []): string[] {
  const pool = POOL_DEPART().filter((id) => !deja.includes(id));
  const out: string[] = [];
  const n = Math.max(0, REGLES.collection.cartesDeDepart - deja.length);
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(hasard() * pool.length), 1)[0]);
  return out;
}

// 28/11/2026 : le mode histoire passe de 18 étapes à 33 quêtes. Pour chaque ancienne étape, l'indice
// de la nouvelle quête qui lui correspond (−1 : supprimée). On reprend à la première nouvelle quête
// qui correspond à une ancienne étape pas encore faite ; les quêtes placées avant sont considérées
// comme faites (sans récompense). Les menus et modes déjà ouverts le restent.
export const ANCIEN_VERS_NOUVEAU = [0, 15, 4, 17, -1, -1, 5, 22, 20, 24, 29, 28, 12, 16, -1, 19, 31, 32];
const ANCIENS_SEUILS: Record<string, number> = { tournois: 1, club: 2, saison: 2, social: 3, classement: 4, fusion: 7, fort: 8, amis: 9, combos: 12, enchainement: 13, infini: 14, equipe: 3 };
export function migrerHistoire33(c: Collection) {
  const ancienne = c.histoire.etape;
  const restantes = ANCIEN_VERS_NOUVEAU.slice(ancienne).filter((x) => x >= 0);
  const nouvelle = restantes.length ? Math.min(...restantes) : REGLES.histoire.nbEtapes;
  c.ouverts = [...new Set([...c.ouverts, ...Object.keys(ANCIENS_SEUILS).filter((k) => ancienne >= ANCIENS_SEUILS[k])])];
  c.histoire = { etape: nouvelle, nations: [], passees: [] };
  // Scènes : celles des quêtes passées sont vues ; celle de la quête en cours sera montrée.
  c.scenesVues = [...c.scenesVues.filter((k) => !/^h\d+$/.test(k)), ...Array.from({ length: nouvelle }, (_, i) => `h${i}`), 'histoire33'];
}

function nouvelId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nouvelleCollection(): Collection {
  return {
    version: 2, coach: null, idCoach: nouvelId(),
    exemplaires: Object.fromEntries(cartesDeDepart().map((id) => [id, 1])), grades: {}, etoiles: {},
    decks: {}, niveau: 'normal', toutDebloque: false, victoires: 0, defaitesDeSuite: 0, recompensesEnLigne: [], aOuvrir: [],
    amis: {}, combatsComptes: [], echangesFaits: [], marchand: { jour: '', faits: [] }, bonusTutoriel: false,
    styles: {}, tri: 'rarete', medailles: 0, dollars: 0, club: [], clubRecompense: 0, battusMain: [], tutosVus: [], essaisGagnes: [], menusVus: ['combat', 'collection', 'recompenses'], fragments: {}, departComplet: true, arene: 0,
    histoire: { etape: 0, nations: [], passees: [] },
    saison: { palier: 0, victoires: 0, numero: 1, terminees: 0 },
    scenesVues: ['histoire15', 'histoire33'], // repères : sauvegarde déjà au format des 15 puis des 33 quêtes
    ouverts: [],
    palmares: { fort: 0, derniereFort: 0 },
    combosVus: [],
    classement: classementVide(), pays: '', parrain: null, parrainage: { vus: [], recompenses: 0, partage: false }, quotidien: { jour: '', rang: 0, visite: '', retour: '' }, createurs: [], createurSoutenu: '', defisCreateurs: {},
    rival: { grade: 1, etoiles: {}, victoires: 0, bonus: 0 },
    quetes: { jour: '', liste: [], change: false, bonus: false, uniques: [] },
  };
}

export const nbExemplaires = (c: Collection, id: string) => c.exemplaires[id] ?? 0;
// Grade de la carte (1 = rareté de départ). Borné : une ancienne sauvegarde pouvait dépasser le maximum.
export const gradeDe = (c: Collection, id: string) =>
  id === ID_LUTTEUR_TEST ? gradeMaxDe(trouverLutteur(id)) // lutteur de test : toujours Champion du Monde
  : nbExemplaires(c, id) > 0 ? Math.min(gradeMaxDe(trouverLutteur(id)), c.grades[id] ?? 1) : 1;

export const etoilesDe = (c: Collection, id: string): Partial<Record<IdAction, number>> => c.etoiles[id] ?? {};
export const nbEtoiles = (c: Collection, id: string) => Object.values(etoilesDe(c, id)).reduce((n: number, x) => n + (x ?? 0), 0);

// La carte telle que le joueur la possède : grade, actions débloquées, étoiles (deck non appliqué).
export function defPossede(c: Collection, id: string): DefLutteur {
  return avecGrade(trouverLutteur(id), gradeDe(c, id), etoilesDe(c, id));
}

export function possede(c: Collection, id: string): boolean {
  return id === ID_LUTTEUR_TEST || c.toutDebloque || nbExemplaires(c, id) > 0;
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

function tirerCarte(hasard: Hasard, rarete?: Rarete): string {
  if (rarete) {
    const liste = LUTTEURS.filter((l) => l.rarete === rarete);
    return liste[Math.floor(hasard() * liste.length)].id;
  }
  const poids: number[] = LUTTEURS.map((l) => REGLES.collection.poidsRarete[l.rarete]);
  let tirage = hasard() * poids.reduce((a, b) => a + b, 0);
  let k = 0;
  while (k < poids.length - 1 && tirage >= poids[k]) tirage -= poids[k++];
  return LUTTEURS[k].id;
}

// Ouvre un booster (classique ou rare, au hasard) et ajoute ses cartes à la collection.
export function ouvrirBooster(c: Collection, hasard: Hasard, impose?: TypeBooster): Booster {
  const B = REGLES.collection.boosters;
  const type: TypeBooster = impose ?? (hasard() < B.chanceRare ? 'rare' : 'classique');
  // Booster épique : les cartes garanties en dernier (la meilleure à la fin de l'ouverture).
  const garanties: Rarete[] = type === 'epique'
    ? [...Array<Rarete>(B.epique.garanties.rare).fill('rare'), ...Array<Rarete>(B.epique.garanties.epique).fill('epique')] : [];
  const cartes = [
    ...Array.from({ length: B[type].cartes - garanties.length }, () => tirerCarte(hasard)),
    ...garanties.map((r) => tirerCarte(hasard, r)),
  ];
  const nouvelles: string[] = [];
  for (const id of cartes) {
    if (nbExemplaires(c, id) === 0) nouvelles.push(id);
    c.exemplaires[id] = nbExemplaires(c, id) + 1;
  }
  return { type, cartes, nouvelles };
}

// Contrôle d'une récompense lue dans une sauvegarde.
function lireClassement(x: unknown): Classement {
  const v = classementVide();
  if (!x || typeof x !== 'object') return v;
  const o = x as Record<string, unknown>;
  const n = (k: string) => (typeof o[k] === 'number' && Number.isFinite(o[k]) && (o[k] as number) >= 0 ? Math.floor(o[k] as number) : 0);
  const mois = (m: unknown) => typeof m === 'string' && /^\d{4}-\d{2}$/.test(m);
  if (mois(o.mois)) v.mois = o.mois as string;
  v.points = n('points');
  // Sauvegarde d'avant le 28/11/2026 (points de tous les combats) : le mois en cours garde son ancienne
  // division et compte comme joué (récompense de fin de saison), puis tout le monde repart en Bronze.
  v.enLigne = typeof o.enLigne === 'number' ? n('enLigne') : v.points > 0 ? 1 : 0;
  v.derniereEnLigne = n('derniereEnLigne');
  const b = o.badge as Classement['badge'];
  if (b && typeof b === 'object' && mois(b.mois) && typeof b.top === 'boolean') v.badge = { palier: typeof b.palier === 'string' ? b.palier : null, top: b.top, mois: b.mois };
  if (Array.isArray(o.enAttente)) v.enAttente = (o.enAttente as { mois: unknown; points: unknown; division?: unknown }[]).filter((e) => e && mois(e.mois) && typeof e.points === 'number').slice(-3).map((e) => ({ mois: e.mois as string, points: e.points as number, division: typeof e.division === 'number' ? Math.max(0, Math.min(5, Math.floor(e.division))) : -1 }));
  const NB = REGLES.classement.divisions.length;
  if (typeof o.division === 'number') v.division = Math.max(0, Math.min(NB - 1, Math.floor(o.division)));
  else v.division = v.points >= 300 ? 2 : v.points >= 120 ? 1 : 0; // ancienne sauvegarde : division tirée du palier de points
  if (typeof o.progression === 'number') v.progression = Math.max(0, Math.floor(o.progression));
  if (Array.isArray(o.cadres)) v.cadres = [...new Set((o.cadres as unknown[]).filter((x): x is string => typeof x === 'string' && (/^\d{4}-\d{2}:[a-z]+$/.test(x) || /^createur:[A-Z0-9]{3,20}$/.test(x))))].slice(-60);
  if (o.cadreCartes && typeof o.cadreCartes === 'object') for (const [id, cd] of Object.entries(o.cadreCartes as Record<string, unknown>)) if (typeof cd === 'string' && v.cadres.includes(cd)) v.cadreCartes[id] = cd;
  return v;
}

function recompenseValide(r: unknown): r is RecompenseAOuvrir {
  const x = r as RecompenseAOuvrir;
  const ids = (l: unknown) => Array.isArray(l) && l.every((id) => typeof id === 'string' && trouverLutteurOuNull(id));
  return !!x && typeof x.titre === 'string' && ['histoire', 'saison', 'quetes', 'club', 'classement', 'parrainage', 'quotidien'].includes(x.source)
    && Array.isArray(x.boosters) && x.boosters.length > 0 && x.boosters.length <= 10
    && x.boosters.every((b) => b && ['classique', 'rare', 'epique', 'recompense'].includes(b.type) && ids(b.cartes) && ids(b.nouvelles));
}
function trouverLutteurOuNull(id: string) {
  try { return trouverLutteur(id); } catch { return null; }
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

// ---------- Combat automatique ----------

// Le combat auto n'est permis que contre un lutteur déjà battu en jouant soi-même.
export const autoPermis = (c: Collection, idAdversaire: string) => c.battusMain.includes(idAdversaire);

export function noterBattuMain(c: Collection, idAdversaire: string) {
  if (!c.battusMain.includes(idAdversaire)) c.battusMain.push(idAdversaire);
}

// Un adversaire au hasard parmi ceux déjà battus à la main (sauf `sauf`), ou null s'il n'y en a pas.
export function adversaireAuto(c: Collection, hasard: Hasard, sauf: (id: string) => boolean = () => false): string | null {
  const ok = c.battusMain.filter((id) => !sauf(id));
  return ok.length ? ok[Math.floor(hasard() * ok.length)] : null;
}

// Boosters rares des niveaux de Mon Club atteints (à partir du 6e) et pas encore donnés.
export function recompensesClub(c: Collection, hasard: Hasard): { niveau: number; booster: Booster }[] {
  const K = REGLES.club;
  const r: { niveau: number; booster: Booster }[] = [];
  for (let n = Math.max(c.clubRecompense + 1, K.niveauBooster); n <= niveauClub(c); n++) {
    for (let k = 0; k < K.boostersRaresParNiveau; k++) r.push({ niveau: n, booster: ouvrirBooster(c, hasard, 'rare') });
    c.clubRecompense = n;
  }
  return r;
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

// Achat d'un exemplaire d'une carte Champion du Monde (200 $, autant de fois qu'on veut).
export function acheterChampion(c: Collection, id: string): Booster | string {
  const prix = REGLES.saison.prixChampion;
  if (!CHAMPIONS.some((l) => l.id === id)) return 'Carte inconnue.';
  if (c.dollars < prix) return `Il te faut ${prix} $ (tu as ${c.dollars} $).`;
  c.dollars -= prix;
  const nouvelle = nbExemplaires(c, id) === 0;
  c.exemplaires[id] = nbExemplaires(c, id) + 1;
  return { type: 'recompense', cartes: [id], nouvelles: nouvelle ? [id] : [] };
}

// Victoire : 1 booster en arène, 2 en ligne (mode collection), plus les médailles (+1 en arène,
// +2 en ligne) et les $ des paliers franchis. `multiplicateur` : 2 pour le combat d'arène qui suit
// le tutoriel (boosters doublés). `boosters` : false en ligne avec les cartes de base (médailles seules).
// Code créateur (28/11/2026) : la carte du créateur (Champion du Monde) et un booster épique.
// null : code déjà utilisé par ce joueur.
export function recevoirCodeCreateur(c: Collection, cr: Createur, hasard: Hasard): Booster[] | null {
  if (c.createurs.some((x) => x.code === cr.code)) return null;
  const def = enregistrerCreateur(cr);
  c.createurs.push(cr);
  c.createurSoutenu = cr.code;
  const nouvelle = nbExemplaires(c, def.id) === 0;
  c.exemplaires[def.id] = nbExemplaires(c, def.id) + 1;
  return [{ type: 'recompense', cartes: [def.id], nouvelles: nouvelle ? [def.id] : [] }, ouvrirBooster(c, hasard, 'epique')];
}

// Défi du créateur (28/11/2026) : récompense possible ce mois-ci ?
export const cadreCreateur = (code: string) => `createur:${code}`;
export const defiDisponible = (c: Collection, code: string, mois: string) => c.createurs.some((x) => x.code === code) && c.defisCreateurs[code] !== mois;
// Défi réussi : exemplaires de la carte, boosters épiques et (la première fois) le cadre « Créateur ».
// null : déjà récompensé ce mois-ci, ou code jamais entré.
export function gagnerDefiCreateur(c: Collection, code: string, mois: string, hasard: Hasard): { boosters: Booster[]; cadre: boolean } | null {
  const cr = c.createurs.find((x) => x.code === code);
  if (!cr || !defiDisponible(c, code, mois)) return null;
  const D = REGLES.defiCreateur;
  c.defisCreateurs[code] = mois;
  const def = enregistrerCreateur(cr);
  c.exemplaires[def.id] = nbExemplaires(c, def.id) + D.exemplaires;
  const boosters: Booster[] = [{ type: 'recompense', cartes: Array<string>(D.exemplaires).fill(def.id), nouvelles: [] }];
  for (let k = 0; k < D.boostersEpiques; k++) boosters.push(ouvrirBooster(c, hasard, 'epique'));
  const cadre = !c.classement.cadres.includes(cadreCreateur(code));
  if (cadre) c.classement.cadres.push(cadreCreateur(code));
  return { boosters, cadre };
}

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
  for (const l of [...LUTTEURS, ...CHAMPIONS, ...CARTES_SPECIALES]) {
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
  if (!carteConnue(id) && id !== ID_LUTTEUR_TEST) return 'Lutteur inconnu.';
  const erreur = verifierDeck(defPossede(c, id), actions);
  if (!erreur) c.decks[id] = [...actions];
  return erreur;
}

// ---------- Sauvegarde dans le navigateur ----------

const CLE = 'wbc-collection-v1';

// Lit une sauvegarde, y compris l'ancien format (liste de cartes sans exemplaires).
export function depuisSauvegarde(brut: unknown): Collection {
  // Cartes des créateurs : connues du jeu avant de vérifier les cartes de la sauvegarde.
  const crs = (brut as { createurs?: unknown } | null)?.createurs;
  const createurs = Array.isArray(crs) ? crs.filter(createurValide).slice(0, 50) : [];
  createurs.forEach(enregistrerCreateur);
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
  c.arene = entier(b.arene);
  c.clubRecompense = Math.min(REGLES.club.niveauMax, entier(b.clubRecompense));
  const sa = b.saison as { palier?: unknown; victoires?: unknown; numero?: unknown; terminees?: unknown } | undefined;
  if (sa && typeof sa === 'object') {
    c.saison = {
      palier: Math.min(REGLES.saison.paliers.length, entier(sa.palier)), victoires: entier(sa.victoires),
      numero: Math.max(1, entier(sa.numero)), terminees: entier(sa.terminees),
    };
    // Ancienne sauvegarde : la 1re saison finie aux JO compte comme terminée.
    if (!sa.terminees && c.saison.palier >= REGLES.saison.paliers.length) c.saison.terminees = 1;
  }
  const qu = b.quetes as Record<string, unknown> | undefined;
  if (qu && typeof qu === 'object') {
    const liste = Array.isArray(qu.liste) ? qu.liste.filter((q): q is { id: string; param: string; progres: number; faite: boolean } =>
      !!q && typeof q === 'object' && typeof (q as { id?: unknown }).id === 'string').slice(0, 3)
      .map((q) => ({ id: q.id, param: typeof q.param === 'string' ? q.param : '', progres: entier(q.progres), faite: q.faite === true })) : [];
    c.quetes = {
      jour: typeof qu.jour === 'string' ? qu.jour : '', liste, change: qu.change === true, bonus: qu.bonus === true,
      uniques: Array.isArray(qu.uniques) ? qu.uniques.filter((x): x is string => typeof x === 'string') : [],
    };
  }
  c.scenesVues = Array.isArray(b.scenesVues) ? b.scenesVues.filter((x): x is string => typeof x === 'string').slice(0, 200) : [];
  const ri = b.rival as { grade?: unknown; etoiles?: unknown; victoires?: unknown; bonus?: unknown } | undefined;
  if (ri && typeof ri === 'object') {
    c.rival = {
      grade: Math.max(1, Math.min(4, entier(ri.grade) || 1)),
      etoiles: ri.etoiles && typeof ri.etoiles === 'object' ? Object.fromEntries(Object.entries(ri.etoiles as Record<string, unknown>).map(([k, v]) => [k, Math.min(3, entier(v))])) : {},
      victoires: entier(ri.victoires),
      bonus: typeof ri.bonus === 'number' && ri.bonus >= 0 && ri.bonus < 5 ? ri.bonus : 0,
    };
  }
  // Ancienne sauvegarde (avant l'ouverture progressive du menu) : rien de « Nouveau ».
  c.menusVus = Array.isArray(b.menusVus) ? b.menusVus.filter((x): x is string => typeof x === 'string').slice(0, 20) : ['combat', 'collection', 'tournois', 'club', 'saison', 'social', 'fusion', 'recompenses'];
  if (!c.menusVus.includes('recompenses')) c.menusVus.push('recompenses'); // boîte ajoutée après le menu pas à pas
  // Ancienne sauvegarde : le joueur connaît déjà les modes, les tutoriels courts ne s'ouvrent pas tout seuls.
  c.essaisGagnes = Array.isArray(b.essaisGagnes) ? b.essaisGagnes.filter((x): x is string => typeof x === 'string').slice(0, 20) : [];
  c.tutosVus = Array.isArray(b.tutosVus) ? b.tutosVus.filter((x): x is string => typeof x === 'string').slice(0, 20) : ['combos', 'enchainement', 'infini', 'arene', 'individuel', 'equipe', 'amis'];
  if (Array.isArray(b.battusMain)) c.battusMain = [...new Set(b.battusMain.filter((x): x is string => typeof x === 'string'))].slice(0, 500);
  if (Array.isArray(b.combosVus)) c.combosVus = [...new Set(b.combosVus.filter((x): x is string => typeof x === 'string'))].slice(0, 10);
  // 26/11/2026 : la scène d'ouverture de la saison s'appelait h12 ; h12 est maintenant l'étape 13.
  if (!c.scenesVues.includes('histoire15')) {
    c.scenesVues = [...c.scenesVues.map((k) => (k === 'h12' ? 'hfin' : k)), 'histoire15'];
  }
  const hi = b.histoire as { etape?: unknown; nations?: unknown; passees?: unknown } | undefined;
  if (hi && typeof hi === 'object') {
    c.histoire = {
      etape: Math.min(REGLES.histoire.nbEtapes, entier(hi.etape)),
      nations: Array.isArray(hi.nations) ? hi.nations.filter((x): x is string => typeof x === 'string') : [],
      passees: Array.isArray(hi.passees) ? [...new Set(hi.passees.filter((x): x is string => typeof x === 'string'))].slice(0, 10) : [],
    };
  }
  const pm = b.palmares as { fort?: unknown; derniereFort?: unknown } | undefined;
  if (pm && typeof pm === 'object') c.palmares = { fort: entier(pm.fort), derniereFort: entier(pm.derniereFort) };
  if (b.defisCreateurs && typeof b.defisCreateurs === 'object') {
    for (const [code, mois] of Object.entries(b.defisCreateurs as Record<string, unknown>)) if (/^[A-Z0-9]{3,20}$/.test(code) && typeof mois === 'string' && /^\d{4}-\d{2}$/.test(mois)) c.defisCreateurs[code] = mois;
  }
  if (Array.isArray(b.ouverts)) c.ouverts = [...new Set(b.ouverts.filter((x): x is string => typeof x === 'string'))].slice(0, 30);
  if (!c.scenesVues.includes('histoire33')) migrerHistoire33(c);
  if (b.fragments && typeof b.fragments === 'object') {
    c.fragments = Object.fromEntries(Object.entries(b.fragments as Record<string, unknown>).map(([k, v]) => [k, entier(v)]));
  }
  // Ancienne sauvegarde : on complète jusqu'à 20 cartes différentes avec des cartes de départ.
  if (b.departComplet !== true) {
    const miens = Object.keys(c.exemplaires).filter((id) => c.exemplaires[id] > 0);
    for (const id of cartesDeDepart(Math.random, miens)) c.exemplaires[id] = (c.exemplaires[id] ?? 0) + 1;
  }
  c.departComplet = true;
  if (Array.isArray(b.club)) c.club = [...new Set((b.club as unknown[]).filter((x): x is string => typeof x === 'string' && carteConnue(x)))];
  c.dollars = entier(b.dollars);
  if (b.styles && typeof b.styles === 'object') c.styles = { ...(b.styles as Record<string, number>) };
  if (['rarete', 'nation', 'fusions', 'niveau'].includes(b.tri as string)) c.tri = b.tri as TriCollection;
  if (typeof b.victoires === 'number') c.victoires = b.victoires;
  if (typeof b.defaitesDeSuite === 'number') c.defaitesDeSuite = b.defaitesDeSuite;
  c.classement = lireClassement(b.classement);
  c.createurs = createurs;
  if (typeof b.createurSoutenu === 'string' && createurs.some((x) => x.code === b.createurSoutenu)) c.createurSoutenu = b.createurSoutenu;
  const q = b.quotidien as Collection['quotidien'];
  const jourOk = (x: unknown) => typeof x === 'string' && (x === '' || /^\d{4}-\d{2}-\d{2}$/.test(x));
  if (q && jourOk(q.jour) && jourOk(q.visite) && jourOk(q.retour) && Number.isInteger(q.rang)) c.quotidien = { jour: q.jour, rang: Math.min(6, Math.max(0, q.rang)), visite: q.visite, retour: q.retour };
  const pr = b.parrain as Collection['parrain'];
  if (pr && typeof pr.id === 'string' && typeof pr.pseudo === 'string') c.parrain = { id: pr.id.slice(0, 40), pseudo: pr.pseudo.slice(0, 16), declare: pr.declare === true };
  const pg = b.parrainage as Collection['parrainage'];
  if (pg && Array.isArray(pg.vus) && typeof pg.recompenses === 'number') c.parrainage = { vus: pg.vus.filter((x): x is string => typeof x === 'string').slice(-200), recompenses: Math.max(0, Math.floor(pg.recompenses)), partage: pg.partage === true };
  if (typeof b.pays === 'string' && /^[A-Z]{2}$/.test(b.pays)) c.pays = b.pays;
  if (Array.isArray(b.aOuvrir)) c.aOuvrir = b.aOuvrir.filter(recompenseValide).slice(0, 60);
  if (Array.isArray(b.recompensesEnLigne)) c.recompensesEnLigne = (b.recompensesEnLigne as string[]).slice(-50);
  if (b.amis && typeof b.amis === 'object') c.amis = { ...(b.amis as Record<string, Ami>) };
  if (Array.isArray(b.combatsComptes)) c.combatsComptes = (b.combatsComptes as string[]).slice(-100);
  if (Array.isArray(b.echangesFaits)) c.echangesFaits = (b.echangesFaits as string[]).slice(-100);
  const m = b.marchand as { jour?: unknown; faits?: unknown } | undefined;
  if (m && typeof m.jour === 'string' && Array.isArray(m.faits)) c.marchand = { jour: m.jour, faits: m.faits.filter((x): x is number => typeof x === 'number') };
  // Nettoyage : cartes inconnues, decks invalides
  for (const id of Object.keys(c.exemplaires)) {
    if (!carteConnue(id) || !(c.exemplaires[id] > 0)) delete c.exemplaires[id];
  }
  for (const [id, deck] of Object.entries(c.decks)) {
    if ((!carteConnue(id) && id !== ID_LUTTEUR_TEST) || verifierDeck(defPossede(c, id), deck)) delete c.decks[id];
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

// Après chaque sauvegarde dans le navigateur (par exemple : l'enregistrement en ligne du compte).
let apresSauvegarde: ((c: Collection) => void) | null = null;
export function surSauvegarde(f: ((c: Collection) => void) | null) { apresSauvegarde = f; }

export function sauver(c: Collection) {
  try {
    localStorage.setItem(CLE, JSON.stringify(c));
  } catch {
    // Pas de sauvegarde possible (navigation privée, etc.) : la partie continue sans.
  }
  apresSauvegarde?.(c);
}
