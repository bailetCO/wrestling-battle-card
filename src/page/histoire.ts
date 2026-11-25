// Mode histoire, sans affichage : 12 étapes dans l'ordre. Une étape ne se valide qu'une fois
// débloquée : ce qui a été fait avant ne compte pas, sauf pour les étapes 3 (Mon Club ouvert), 6 (3 lutteurs
// d'une même nation dans Mon Club), 7 (une nation battue dans l'arène) et 11 (arène terminée), validées
// tout de suite si c'est déjà le cas.

import { LUTTEURS, NIVEAUX, REGLES, niveauCarte, trouverLutteur, type Hasard, type Niveau } from '../moteur';
import { PAR_NATION, areneTerminee } from './arene';
import { gradeDe, nbExemplaires, niveauClub, ouvrirBooster, type Booster, type Collection } from './collection';

const H = REGLES.histoire;

export interface DefEtape {
  titre: string;
  objectif: string;
  guide: string; // explication pas à pas
  lien: string; // écran où aller
  bouton: string;
}

export const ETAPES: DefEtape[] = [
  {
    titre: 'Premiers combats', objectif: 'Gagner 3 combats contre 3 lutteurs de nations différentes',
    guide: 'Choisis un lutteur et bats l\'ordinateur. Change d\'adversaire à chaque fois : il faut 3 nations différentes. Tous les combats comptent : arène, combat rapide, tournoi, en ligne.',
    lien: '#arene', bouton: 'Aller dans l\'arène',
  },
  {
    titre: 'Premier tournoi', objectif: 'Gagner un tournoi individuel',
    guide: 'Dans Tournois, inscris-toi au tournoi individuel (5 $). Gagne tes combats du tableau principal, ou remonte par le tableau des perdants… mais seul le vainqueur de la finale gagne l\'étape.',
    lien: '#tournois', bouton: 'Voir les tournois',
  },
  {
    titre: 'Ton club', objectif: 'Ouvrir Mon Club',
    guide: 'Mon Club ouvre à 10 médailles. Gagne des combats et des tournois pour en récolter. Si ton club est déjà ouvert, l\'étape est validée tout de suite.',
    lien: '#club', bouton: 'Voir Mon Club',
  },
  {
    titre: 'Esprit d\'équipe', objectif: 'Gagner un tournoi par équipe',
    guide: 'Il faut Mon Club au niveau 5 avec 5 lutteurs recrutés (30 médailles). Inscris ensuite ton équipe dans Tournois : la première équipe à 3 victoires gagne.',
    lien: '#tournois', bouton: 'Voir les tournois',
  },
  {
    titre: 'Victoire éclair', objectif: 'Gagner un combat rapide par tombé ou par 10 points d\'écart',
    guide: 'Le combat rapide se joue en une seule période. Une victoire aux points ne suffit pas : fais tomber ton adversaire, ou mène de 10 points.',
    lien: '#rapide', bouton: 'Combat rapide',
  },
  {
    titre: 'Fierté nationale', objectif: 'Recruter 3 lutteurs d\'une même nation dans Mon Club',
    guide: 'Dans Mon Club, recrute des lutteurs pour avoir au moins 3 lutteurs de la même nation : c\'est le bonus de nation du tournoi par équipe. Si ton club les a déjà, l\'étape est validée tout de suite.',
    lien: '#club', bouton: 'Voir Mon Club',
  },
  {
    titre: 'Conquête', objectif: 'Battre une nation complète dans l\'arène',
    guide: 'Dans l\'arène, bats les 5 lutteurs d\'une nation, le dernier étant son champion. Si tu as déjà battu une nation, l\'étape est validée tout de suite.',
    lien: '#arene', bouton: 'Aller dans l\'arène',
  },
  {
    titre: 'Montée en puissance', objectif: 'Fusionner une carte jusqu\'au niveau épique ou légendaire',
    guide: 'Dans la Collection, réunis des doubles d\'un même lutteur et fusionne-les : une carte rare devient épique avec 3 exemplaires, une épique devient légendaire avec 4.',
    lien: '#collection', bouton: 'Ma collection',
  },
  {
    titre: 'Le grand défi', objectif: 'Battre l\'ordinateur fort',
    guide: 'Règle l\'ordinateur sur « fort » et gagne un combat, en jouant toi-même (le combat auto ne compte pas pour cette étape). Il lit tes habitudes : varie tes actions ! Le champion de chaque nation dans l\'arène est aussi au niveau fort.',
    lien: '#arene', bouton: 'Aller dans l\'arène',
  },
  {
    titre: 'Entre amis', objectif: 'Gagner un combat en ligne contre un ami',
    guide: 'Dans Social, crée une salle et envoie le code à un ami, ou rejoins la sienne. Gagne le combat.',
    lien: '#social', bouton: 'Ouvrir Social',
  },
  {
    titre: 'Tour du monde', objectif: 'Terminer l\'arène en battant toutes les nations',
    guide: 'Bats les 12 nations de l\'arène, l\'une après l\'autre. Si tu l\'as déjà terminée, l\'étape est validée tout de suite.',
    lien: '#arene', bouton: 'Aller dans l\'arène',
  },
  {
    titre: 'La consécration', objectif: 'Gagner un tournoi individuel sans passer par le tableau des perdants',
    guide: 'Gagne le tournoi individuel sans perdre un seul combat. Récompense : une carte légendaire que tu n\'as pas encore.',
    lien: '#tournois', bouton: 'Voir les tournois',
  },
];

export const NB_ETAPES = ETAPES.length;

// Ce qui se passe dans le jeu et peut faire avancer l'histoire.
export type EvenementHistoire =
  | { type: 'victoire'; nation: string; niveau: Niveau | null; auto?: boolean } // tout combat gagné (niveau null : en ligne ; auto : combat automatique)
  | { type: 'rapide'; tombe: boolean; ecart: number } // combat rapide gagné
  | { type: 'tournoiIndividuel'; place: number; invaincu: boolean }
  | { type: 'tournoiEquipe'; gagne: boolean }
  | { type: 'recrutement' }
  | { type: 'nationArene' } // une nation battue dans l'arène
  | { type: 'fusion'; id: string }
  | { type: 'enLigne' } // combat en ligne gagné contre un ami
  | { type: 'etat' }; // simple vérification (Mon Club, arène)

export const histoireFinie = (c: Collection) => c.histoire.etape >= NB_ETAPES;

// Progression de l'étape en cours, pour l'affichage ([fait, à faire]), ou null.
export function progression(c: Collection): [number, number] | null {
  if (c.histoire.etape === 0) return [c.histoire.nations.length, H.nationsEtape1];
  return null;
}

// L'événement valide-t-il l'étape en cours ?
function valide(c: Collection, ev: EvenementHistoire): boolean {
  const h = c.histoire;
  switch (h.etape) {
    case 0:
      if (ev.type !== 'victoire' || h.nations.includes(ev.nation)) return false;
      h.nations.push(ev.nation);
      return h.nations.length >= H.nationsEtape1;
    case 1: return ev.type === 'tournoiIndividuel' && ev.place === 1;
    case 2: return niveauClub(c) > 0;
    case 3: return ev.type === 'tournoiEquipe' && ev.gagne;
    case 4: return ev.type === 'rapide' && (ev.tombe || Math.abs(ev.ecart) >= REGLES.ecartSuperiorite);
    case 5: {
      // Validée dès le déblocage si Mon Club compte déjà 3 lutteurs d'une même nation.
      const parNation = new Map<string, number>();
      for (const id of c.club) parNation.set(trouverLutteur(id).nation, (parNation.get(trouverLutteur(id).nation) ?? 0) + 1);
      return Math.max(0, ...parNation.values()) >= H.memeNationEtape6;
    }
    case 6: return c.arene >= PAR_NATION; // au moins une nation battue, avant ou après le déblocage
    case 7: return ev.type === 'fusion' && NIVEAUX.indexOf(niveauCarte(trouverLutteur(ev.id), gradeDe(c, ev.id))) >= NIVEAUX.indexOf('epique');
    case 8: return ev.type === 'victoire' && ev.niveau === 'fort' && !ev.auto; // à gagner à la main
    case 9: return ev.type === 'enLigne';
    case 10: return areneTerminee(c);
    case 11: return ev.type === 'tournoiIndividuel' && ev.place === 1 && ev.invaincu;
    default: return false;
  }
}

// Récompense de l'étape `i` (0 à 11) : boosters classiques, ou la légendaire de l'étape 12.
function recompense(c: Collection, i: number, hasard: Hasard): Booster[] {
  const n = H.boosters[i] ?? 0;
  if (n > 0) return Array.from({ length: n }, () => ouvrirBooster(c, hasard, 'classique'));
  return [legendaireOfferte(c, hasard)];
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

// Note un événement. Si l'étape en cours est validée, on passe à la suivante et on renvoie sa
// récompense (une étape validée peut en valider une autre aussitôt : club ouvert, arène).
export interface EtapeValidee { etape: number; boosters: Booster[] }

export function noterHistoire(c: Collection, ev: EvenementHistoire, hasard: Hasard, forcer = false): EtapeValidee[] {
  const faites: EtapeValidee[] = [];
  let e: EvenementHistoire = ev;
  while (!histoireFinie(c) && (forcer || valide(c, e))) {
    forcer = false;
    const i = c.histoire.etape;
    c.histoire.etape++;
    c.histoire.nations = [];
    faites.push({ etape: i, boosters: recompense(c, i, hasard) });
    e = { type: 'etat' }; // l'étape suivante ne profite pas du même événement
  }
  return faites;
}

// Test : valide l'étape en cours comme si elle était réussie (avec sa récompense).
export const passerEtape = (c: Collection, hasard: Hasard) => noterHistoire(c, { type: 'etat' }, hasard, true);
