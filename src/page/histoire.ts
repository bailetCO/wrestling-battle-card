// Mode histoire, sans affichage (28/11/2026) : 33 quêtes dans l'ordre de progression d'un nouveau joueur,
// fixé par la simulation de 4 profils (occasionnel, social, collectionneur, passionné). Les 5 premières
// sont faciles ; ensuite, une quête secondaire (découvrir une fonction du jeu) alterne avec une quête
// principale (avancer : Carrière, tournois, divisions, Mon Club, Cocoach). Une quête ne se valide qu'une
// fois en cours ; celles qui portent sur l'état du jeu (nations battues, Mon Club, division, fusions,
// lien partagé…) sont validées tout de suite si c'est déjà fait. Les quêtes qui demandent un ami
// ou les combats en ligne peuvent être passées : elles restent à réussir, avec leur récompense.
// Avant le 28/11/2026 : 18 étapes ; les sauvegardes sont converties par migrerEtape.

import { DARIUS, ETOILES_DARIUS, ID_DARIUS, LUTTEURS, NIVEAUX, REGLES, niveauCarte, trouverLutteur, type Hasard, type IdAction, type Niveau } from '../moteur';
import { PAR_NATION, areneTerminee } from './arene';
import { gradeDe, nbExemplaires, nbEtoiles, niveauClub, ouvrirBooster, type Booster, type Collection } from './collection';

const H = REGLES.histoire;

export type TypeEtape = 'principale' | 'secondaire';
export interface DefEtape {
  id: string;
  type: TypeEtape;
  titre: string;
  objectif: string;
  guide: string; // explication pas à pas
  lien: string; // écran où aller
  bouton: string;
  passable?: boolean; // quête qui demande un ami ou le jeu en ligne : on peut la passer et la réussir plus tard
}

const P = 'principale', S = 'secondaire';
const EX = REGLES.fusion.exemplairesParNiveau;

export const ETAPES: DefEtape[] = [
  // ----- Les 5 premières : faciles, dès le premier jour -----
  { id: 'carriere', type: P, titre: 'Premier combat', objectif: 'Gagner un combat en Carrière',
    guide: 'Va dans Carrière, choisis un lutteur de ta collection et bats ton premier adversaire. Si tu perds, recommence : chaque combat t\'apprend quelque chose.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'deck', type: S, titre: 'Ton style', objectif: 'Régler les actions d\'un de tes lutteurs',
    guide: 'Dans la Collection, touche une carte puis « Régler les actions » : choisis les actions que ton lutteur emportera en combat.',
    lien: '#collection', bouton: 'Ouvrir la Collection' },
  { id: 'entrainement', type: S, titre: 'À l\'entraînement', objectif: 'Gagner un combat d\'entraînement',
    guide: 'Combat → Entraînement : une seule période, idéale pour essayer un lutteur ou une action. Gagne un combat.',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'quete-jour', type: S, titre: 'Quêtes du jour', objectif: 'Réussir une quête du jour',
    guide: 'Chaque jour, trois quêtes te rapportent des $ et des boosters. Ouvre-les depuis le menu, et réussis-en une.',
    lien: '#quetes', bouton: 'Voir les quêtes' },
  { id: 'club', type: P, titre: 'Ton club', objectif: 'Ouvrir Mon Club (10 médailles)',
    guide: 'Chaque victoire rapporte des médailles. À 10 médailles, Mon Club ouvre ses portes. Si ton club est déjà ouvert, la quête est validée tout de suite.',
    lien: '#arene', bouton: 'Gagner des médailles' },
  // ----- Puis secondaires et principales en alternance -----
  { id: 'nations-1', type: P, titre: 'Première nation', objectif: 'Battre une nation complète en Carrière, champion compris',
    guide: 'Chaque nation a 5 adversaires ; le dernier, son champion, est joué par l\'ordinateur fort. Observe-le, puis bats-le.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'recrutement', type: S, titre: 'Recrutement', objectif: 'Recruter un lutteur dans Mon Club',
    guide: 'Dans Mon Club, choisis un lutteur de ta collection pour l\'une de tes places. Ton club grandit avec tes médailles.',
    lien: '#club', bouton: 'Voir Mon Club' },
  { id: 'podium', type: P, titre: 'Premier tournoi', objectif: 'Finir sur le podium d\'un tournoi individuel',
    guide: 'Dans Tournois, inscris-toi au tournoi individuel (5 $). Une défaite t\'envoie dans le tableau des perdants : tu peux encore finir sur le podium.',
    lien: '#tournois', bouton: 'Voir les tournois' },
  { id: 'achat', type: S, titre: 'La boutique', objectif: 'Acheter un booster dans la boutique',
    guide: 'Dans Social, la boutique vend des boosters contre tes $. Plus le booster est cher, meilleures sont les cartes.',
    lien: '#social', bouton: 'Aller à la boutique' },
  { id: 'argent', type: P, titre: 'Classé', objectif: 'Atteindre la division Argent en ligne', passable: true,
    guide: 'Chaque victoire en ligne remplit ta barre de division (+25, une défaite −15). Barre pleine : division suivante. Tu joues seul ? Passe cette quête : tu pourras la réussir plus tard.',
    lien: '#amis', bouton: 'Combat en ligne' },
  { id: 'invitation', type: S, titre: 'Invite un ami', objectif: 'Envoyer ton lien d\'invitation à un ami', passable: true,
    guide: 'Dans Social, partage ton lien : ton ami reçoit un booster rare de bienvenue, et toi un booster rare quand il crée son compte. Tu joues seul ? Tu peux passer cette quête.',
    lien: '#social', bouton: 'Ouvrir Social' },
  { id: 'fusion', type: P, titre: 'Montée en puissance', objectif: 'Faire ta première fusion',
    guide: `Réunis des exemplaires d'une même carte et fusionne-les : elle monte d'un niveau. Il en faut ${EX.commune} pour une commune, ${EX.rare} pour une rare, ${EX.epique} pour une épique, ${EX.legendaire} pour une légendaire.`,
    lien: '#fusion', bouton: 'Aller à la Fusion' },
  { id: 'combos', type: S, titre: 'Le tacticien', objectif: 'Réussir 2 combos dans un même combat',
    guide: 'Certaines actions s\'enchaînent : le bouton s\'allume en vert quand un combo est possible. Réussis-en deux dans le même combat (en jouant toi-même).',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'nations-3', type: P, titre: 'Conquête', objectif: 'Battre 3 nations en Carrière',
    guide: 'Continue ton tour du monde : chaque nation battue rapporte des boosters, dont un booster épique.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'auto', type: S, titre: 'Pilote automatique', objectif: 'Gagner un combat en mode auto',
    guide: 'À partir du niveau 3, le bouton « Auto » fait jouer l\'ordinateur pour toi : pratique pour avancer vite. Il joue de mieux en mieux avec ton niveau.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'tournoi', type: P, titre: 'Champion du tournoi', objectif: 'Gagner un tournoi individuel',
    guide: 'Cette fois, il faut gagner la finale. Une défaite n\'élimine pas : remonte par le tableau des perdants.',
    lien: '#tournois', bouton: 'Voir les tournois' },
  { id: 'enchainement', type: S, titre: 'L\'enchaîneur', objectif: 'Gagner un combat en format Enchaînement',
    guide: 'Dans l\'Entraînement, choisis le format Enchaînement : tu prépares tes actions par trois, d\'avance. Gagne un combat en jouant toi-même.',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'equipe', type: P, titre: 'Esprit d\'équipe', objectif: 'Gagner un tournoi par équipe',
    guide: 'Dans Tournois, compose une équipe de 5 lutteurs : la première équipe à 3 victoires gagne. Des lutteurs d\'une même nation donnent un bonus à toute l\'équipe.',
    lien: '#tournois', bouton: 'Voir les tournois' },
  { id: 'fragment', type: S, titre: 'Fragments de légende', objectif: 'Transformer un double en fragment de légende',
    guide: 'Dans Fusion, un double d\'une nation peut devenir un fragment de sa légendaire. Avec assez de fragments, la légendaire est à toi.',
    lien: '#fusion', bouton: 'Aller à la Fusion' },
  { id: 'rival', type: P, titre: 'Le rival', objectif: 'Battre Cocoach, ton rival (entraînement, durée infinie)',
    guide: 'Dans l\'Entraînement, choisis la durée infinie : pas de chrono, il faut faire tomber l\'adversaire. Cocoach t\'y attend, en carte rare. À jouer toi-même.',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'fort', type: S, titre: 'Le grand défi', objectif: 'Battre l\'ordinateur fort en jouant toi-même',
    guide: 'L\'ordinateur fort lit tes habitudes : varie tes actions. Choisis-le dans l\'Entraînement (ou bats un champion de nation), sans le mode auto.',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'nations-6', type: P, titre: 'Mi-parcours', objectif: 'Battre 6 nations en Carrière',
    guide: 'La moitié du tour du monde ! Les nations suivantes sont plus fortes : fais monter tes meilleures cartes.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'epique', type: S, titre: 'Carte épique', objectif: 'Monter une carte jusqu\'au niveau Épique par fusion',
    guide: 'Choisis un lutteur que tu aimes jouer et fusionne ses exemplaires jusqu\'au niveau Épique : il gagne des statistiques et des actions.',
    lien: '#fusion', bouton: 'Aller à la Fusion' },
  { id: 'club-10', type: P, titre: 'Un grand club', objectif: 'Monter Mon Club au niveau 10',
    guide: 'Mon Club monte d\'un niveau toutes les 5 médailles. Au niveau 10, la saison sportive s\'ouvre : interclub, championnats… jusqu\'aux Jeux Olympiques.',
    lien: '#club', bouton: 'Voir Mon Club' },
  { id: 'en-ligne', type: S, titre: 'Entre amis', objectif: 'Gagner un combat en ligne contre un ami', passable: true,
    guide: 'Dans Combat, choisis « Contre un ami » et envoie-lui le lien du combat. Tu joues seul ? Tu peux passer cette quête.',
    lien: '#amis', bouton: 'Combat entre amis' },
  { id: 'or', type: P, titre: 'Division Or', objectif: 'Atteindre la division Or en ligne', passable: true,
    guide: 'Gagne des combats en ligne pour monter jusqu\'à la division Or : elle rapporte de belles récompenses en fin de saison. Tu peux passer cette quête et la réussir plus tard.',
    lien: '#amis', bouton: 'Combat en ligne' },
  { id: 'champion', type: S, titre: 'Champion du Monde', objectif: 'Obtenir une carte Champion du Monde par fusion',
    guide: 'Fusionne une carte jusqu\'au sommet : Champion du Monde. Elle débloque toutes ses actions, et son action de Champion.',
    lien: '#fusion', bouton: 'Aller à la Fusion' },
  { id: 'nations-9', type: P, titre: 'Presque au bout', objectif: 'Battre 9 nations en Carrière',
    guide: 'Plus que trois nations après celles-là : les plus fortes. Prépare tes meilleures cartes.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'invaincu', type: S, titre: 'La consécration', objectif: 'Gagner un tournoi individuel sans passer par le tableau des perdants',
    guide: 'Gagne tous tes combats du tableau principal, jusqu\'à la finale comprise.',
    lien: '#tournois', bouton: 'Voir les tournois' },
  { id: 'nations-12', type: P, titre: 'Tour du monde', objectif: 'Terminer la Carrière en battant les 12 nations',
    guide: 'Douze nations, douze champions. Récompense : une carte légendaire que tu n\'as pas encore.',
    lien: '#arene', bouton: 'Aller en Carrière' },
  { id: 'etoile', type: S, titre: 'Première étoile', objectif: 'Donner une première étoile à une action',
    guide: 'Une carte Champion du Monde peut encore progresser : dans Fusion, ses doubles donnent des étoiles qui rendent une action moins chère.',
    lien: '#fusion', bouton: 'Aller à la Fusion' },
  { id: 'rival-legendaire', type: P, titre: 'Rival de taille', objectif: 'Battre Cocoach au niveau Légendaire',
    guide: 'Chaque fois que tu bats Cocoach, il monte d\'un niveau. Bats-le au niveau Légendaire (durée infinie, en jouant toi-même).',
    lien: '#rapide', bouton: 'Entraînement' },
  { id: 'rival-champion', type: P, titre: 'Le sommet', objectif: 'Battre Cocoach Champion du Monde',
    guide: 'Dernier défi : Cocoach au niveau Champion du Monde, avec toutes ses actions. Récompense : une carte légendaire que tu n\'as pas encore… et une surprise de Darius.',
    lien: '#rapide', bouton: 'Entraînement' },
];

export const NB_ETAPES = ETAPES.length;
export const indexEtape = (id: string) => ETAPES.findIndex((e) => e.id === id);

// Ce qui se passe dans le jeu et peut faire avancer l'histoire.
export type EvenementHistoire =
  | { type: 'victoire'; nation: string; niveau: Niveau | null; auto?: boolean; carriere?: boolean } // tout combat gagné (niveau null : en ligne ; auto : combat automatique ; carriere : en Carrière)
  | { type: 'rapide'; tombe: boolean; ecart: number } // combat d'entraînement gagné
  | { type: 'tournoiIndividuel'; place: number; invaincu: boolean }
  | { type: 'tournoiEquipe'; gagne: boolean }
  | { type: 'recrutement' }
  | { type: 'nationArene' } // une nation battue en Carrière
  | { type: 'fusion'; id: string }
  | { type: 'enLigne' } // combat en ligne gagné contre un ami
  | { type: 'combat'; gagne: boolean; combos: number; enchainement: boolean; infini: boolean; auto: boolean } // tout combat terminé
  | { type: 'rival'; grade: number; auto: boolean } // Cocoach battu (grade : son niveau pendant le combat, 1 = rare … 4 = Champion du Monde)
  | { type: 'deck' } // actions d'un lutteur réglées
  | { type: 'queteDuJour' } // une quête du jour réussie
  | { type: 'achat' } // booster (ou carte) acheté dans la boutique
  | { type: 'fragment' } // un double transformé en fragment de légende
  | { type: 'etat' }; // simple vérification (Mon Club, Carrière, division, fusions…)

export const histoireFinie = (c: Collection) => c.histoire.etape >= NB_ETAPES;
const etapeEnCours = (c: Collection): DefEtape | null => ETAPES[c.histoire.etape] ?? null;

// Nations battues en Carrière.
export const nationsBattues = (c: Collection) => Math.floor(c.arene / PAR_NATION);
// Plus haut niveau atteint par fusion (−1 : aucune fusion).
function meilleureFusion(c: Collection): number {
  let m = -1;
  for (const [id, g] of Object.entries(c.grades)) {
    if (g > 1 && nbExemplaires(c, id) > 0) m = Math.max(m, NIVEAUX.indexOf(niveauCarte(trouverLutteur(id), gradeDe(c, id))));
  }
  return m;
}
const nbNations = (id: string) => Number(id.split('-')[1]);

// Progression de la quête en cours, pour l'affichage ([fait, à faire]), ou null.
export function progression(c: Collection): [number, number] | null {
  const e = etapeEnCours(c);
  if (!e) return null;
  if (e.id.startsWith('nations-')) return [Math.min(nationsBattues(c), nbNations(e.id)), nbNations(e.id)];
  if (e.id === 'club-10') return [niveauClub(c), REGLES.club.niveauSaison];
  if (e.id === 'club') return [Math.min(c.medailles, REGLES.club.medaillesOuverture), REGLES.club.medaillesOuverture];
  return null;
}

// L'état du jeu remplit-il déjà la quête ? (quêtes validées dès qu'elles sont en cours)
function dejaFait(c: Collection, id: string): boolean {
  switch (id) {
    case 'club': return niveauClub(c) > 0;
    case 'recrutement': return c.club.length > 0;
    case 'argent': return c.classement.division >= 1;
    case 'or': return c.classement.division >= 2;
    case 'invitation': return c.parrainage.partage;
    case 'fusion': return meilleureFusion(c) >= 0 || Object.keys(c.etoiles).some((x) => x !== ID_DARIUS && nbEtoiles(c, x) > 0);
    case 'epique': return meilleureFusion(c) >= NIVEAUX.indexOf('epique');
    case 'champion': return meilleureFusion(c) >= NIVEAUX.indexOf('champion');
    case 'etoile': return Object.keys(c.etoiles).some((x) => x !== ID_DARIUS && nbEtoiles(c, x) > 0);
    case 'club-10': return niveauClub(c) >= REGLES.club.niveauSaison;
    case 'nations-12': return areneTerminee(c);
    default: return id.startsWith('nations-') && nationsBattues(c) >= nbNations(id);
  }
}

// L'événement valide-t-il la quête en cours ?
function valide(c: Collection, ev: EvenementHistoire): boolean {
  const e = etapeEnCours(c);
  return !!e && (dejaFait(c, e.id) || valideId(c, e.id, ev));
}
function valideId(_c: Collection, id: string, ev: EvenementHistoire): boolean {
  switch (id) {
    case 'carriere': return ev.type === 'victoire' && !!ev.carriere;
    case 'deck': return ev.type === 'deck';
    case 'entrainement': return ev.type === 'rapide';
    case 'quete-jour': return ev.type === 'queteDuJour';
    case 'recrutement': return ev.type === 'recrutement';
    case 'podium': return ev.type === 'tournoiIndividuel' && ev.place <= 3;
    case 'achat': return ev.type === 'achat';
    case 'fusion': return ev.type === 'fusion';
    case 'combos': return ev.type === 'combat' && !ev.auto && ev.combos >= H.combosTacticien;
    case 'auto': return ev.type === 'combat' && ev.auto && ev.gagne;
    case 'tournoi': return ev.type === 'tournoiIndividuel' && ev.place === 1;
    case 'enchainement': return ev.type === 'combat' && !ev.auto && ev.gagne && ev.enchainement;
    case 'equipe': return ev.type === 'tournoiEquipe' && ev.gagne;
    case 'fragment': return ev.type === 'fragment';
    case 'rival': return ev.type === 'rival' && !ev.auto;
    case 'fort': return ev.type === 'victoire' && ev.niveau === 'fort' && !ev.auto;
    case 'en-ligne': return ev.type === 'enLigne';
    case 'invaincu': return ev.type === 'tournoiIndividuel' && ev.place === 1 && ev.invaincu;
    case 'rival-legendaire': return ev.type === 'rival' && !ev.auto && ev.grade >= 3;
    case 'rival-champion': return ev.type === 'rival' && !ev.auto && ev.grade >= 4;
    default: return false;
  }
}

// Récompense de la quête `i` (voir REGLES.histoire.recompenses).
export const recompenseDe = (i: number) => H.recompenses[ETAPES[i]?.id] ?? {};
export function texteRecompense(i: number): string {
  const r = recompenseDe(i);
  const pl = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  return [
    r.dollars ? `${r.dollars} $` : '',
    r.boosters ? pl(r.boosters, 'booster') : '',
    r.rares ? `${pl(r.rares, 'booster')} rare${r.rares > 1 ? 's' : ''}` : '',
    r.epiques ? `${pl(r.epiques, 'booster')} épique${r.epiques > 1 ? 's' : ''}` : '',
    r.legendaire ? '1 carte légendaire' : '',
    r.darius ? 'une surprise' : '',
  ].filter(Boolean).join(' + ');
}

function recompense(c: Collection, i: number, hasard: Hasard): Booster[] {
  const r = recompenseDe(i);
  c.dollars += r.dollars ?? 0;
  const boosters: Booster[] = [
    ...Array.from({ length: r.boosters ?? 0 }, () => ouvrirBooster(c, hasard, 'classique')),
    ...Array.from({ length: r.rares ?? 0 }, () => ouvrirBooster(c, hasard, 'rare')),
    ...Array.from({ length: r.epiques ?? 0 }, () => ouvrirBooster(c, hasard, 'epique')),
  ];
  if (r.legendaire) boosters.push(legendaireOfferte(c, hasard));
  if (r.darius) boosters.push(carteDarius(c, hasard));
  return boosters;
}

// La carte de Darius, Champion du Monde avec 2 étoiles sur 2 actions différentes tirées au hasard
// (parmi ses 9 actions). Un seul exemplaire : si le joueur l'a déjà, rien de plus.
export function carteDarius(c: Collection, hasard: Hasard): Booster {
  if (nbExemplaires(c, ID_DARIUS) > 0) return { type: 'recompense', cartes: [ID_DARIUS], nouvelles: [] };
  c.exemplaires[ID_DARIUS] = 1;
  const actions: IdAction[] = [...new Set([...DARIUS.actions, ...DARIUS.deblocages, ...(DARIUS.actionChampion ? [DARIUS.actionChampion] : [])])];
  const etoiles: Partial<Record<IdAction, number>> = {};
  for (let k = 0; k < ETOILES_DARIUS; k++) {
    const restantes = actions.filter((a) => !etoiles[a]);
    etoiles[restantes[Math.floor(hasard() * restantes.length)]] = 1;
  }
  c.etoiles[ID_DARIUS] = etoiles;
  return { type: 'recompense', cartes: [ID_DARIUS], nouvelles: [ID_DARIUS] };
}

// Une carte légendaire que le joueur n'a pas encore (s'il les a toutes : une au hasard, un double).
export function legendaireOfferte(c: Collection, hasard: Hasard): Booster {
  const legendaires = LUTTEURS.filter((l) => l.rarete === 'legendaire');
  const manquantes = legendaires.filter((l) => nbExemplaires(c, l.id) === 0);
  const pool = manquantes.length ? manquantes : legendaires;
  const id = pool[Math.floor(hasard() * pool.length)].id;
  const nouvelle = nbExemplaires(c, id) === 0;
  c.exemplaires[id] = nbExemplaires(c, id) + 1;
  return { type: 'recompense', cartes: [id], nouvelles: nouvelle ? [id] : [] };
}

// Note un événement. Si la quête en cours est validée, on passe à la suivante et on renvoie sa
// récompense (une quête validée peut en valider une autre aussitôt : Mon Club, Carrière, fusions…).
export interface EtapeValidee { etape: number; boosters: Booster[]; dollars: number }

export function noterHistoire(c: Collection, ev: EvenementHistoire, hasard: Hasard, forcer = false): EtapeValidee[] {
  const faites: EtapeValidee[] = [];
  let e: EvenementHistoire = ev;
  while (!histoireFinie(c) && (forcer || valide(c, e))) {
    forcer = false;
    const i = c.histoire.etape;
    c.histoire.etape++;
    c.histoire.nations = [];
    faites.push({ etape: i, boosters: recompense(c, i, hasard), dollars: recompenseDe(i).dollars ?? 0 });
    e = { type: 'etat' }; // la quête suivante ne profite pas du même événement
  }
  // Quêtes passées : toujours réussissables, avec leur récompense.
  for (const id of [...c.histoire.passees]) {
    if (!dejaFait(c, id) && !valideId(c, id, ev)) continue;
    c.histoire.passees = c.histoire.passees.filter((x) => x !== id);
    const i = indexEtape(id);
    faites.push({ etape: i, boosters: recompense(c, i, hasard), dollars: recompenseDe(i).dollars ?? 0 });
  }
  return faites;
}

// Quête qui demande un ami (ou les combats en ligne) : le joueur passe à la suivante. La quête passée
// reste à réussir quand il veut, avec sa récompense. Renvoie les quêtes validées aussitôt (déjà faites).
export function passerQuete(c: Collection, hasard: Hasard): EtapeValidee[] | null {
  const e = etapeEnCours(c);
  if (!e?.passable) return null;
  c.histoire.passees = [...c.histoire.passees.filter((x) => x !== e.id), e.id];
  c.histoire.etape++;
  return noterHistoire(c, { type: 'etat' }, hasard);
}

// Test : valide la quête en cours comme si elle était réussie (avec sa récompense).
export const passerEtape = (c: Collection, hasard: Hasard) => noterHistoire(c, { type: 'etat' }, hasard, true);
