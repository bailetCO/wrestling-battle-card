// Mode histoire, sans affichage : 18 étapes dans l'ordre. Les étapes 13 à 15 (26/11/2026) font
// découvrir les combos, l'Enchaînement et la durée infinie ; les étapes 16 à 18, le rival Cocoach. Une étape ne se valide qu'une fois
// débloquée : ce qui a été fait avant ne compte pas, sauf pour les étapes 3 (Mon Club ouvert), 6 (3 lutteurs
// d'une même nation dans Mon Club), 7 (une nation battue dans l'arène) et 11 (arène terminée), validées
// tout de suite si c'est déjà le cas.

import { DARIUS, ETOILES_DARIUS, ID_DARIUS, LUTTEURS, NIVEAUX, REGLES, niveauCarte, trouverLutteur, type Hasard, type IdAction, type Niveau } from '../moteur';
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
    titre: 'Premier combat', objectif: 'Gagner un combat en Carrière',
    guide: 'Va dans Carrière, choisis un lutteur de ta collection et bats ton premier adversaire. Si tu perds, recommence : chaque combat t\'apprend quelque chose.',
    lien: '#arene', bouton: 'Aller en Carrière',
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
    titre: 'Victoire éclair', objectif: 'Gagner un combat d\'entraînement par tombé ou par 10 points d\'écart',
    guide: 'L\'entraînement se joue en une seule période. Une victoire aux points ne suffit pas : fais tomber ton adversaire, ou mène de 10 points.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'Fierté nationale', objectif: 'Recruter 3 lutteurs d\'une même nation dans Mon Club',
    guide: 'Dans Mon Club, recrute des lutteurs pour avoir au moins 3 lutteurs de la même nation : c\'est le bonus de nation du tournoi par équipe. Si ton club les a déjà, l\'étape est validée tout de suite.',
    lien: '#club', bouton: 'Voir Mon Club',
  },
  {
    titre: 'Conquête', objectif: 'Battre une nation complète en Carrière',
    guide: 'En Carrière, bats les 5 lutteurs d\'une nation, le dernier étant son champion. Si tu as déjà battu une nation, l\'étape est validée tout de suite.',
    lien: '#arene', bouton: 'Aller en Carrière',
  },
  {
    titre: 'Montée en puissance', objectif: 'Fusionner une carte jusqu\'au niveau épique ou légendaire',
    guide: 'Dans la Collection, réunis des doubles d\'un même lutteur et fusionne-les : une carte rare devient épique avec 3 exemplaires, une épique devient légendaire avec 4.',
    lien: '#collection', bouton: 'Ma collection',
  },
  {
    titre: 'Le grand défi', objectif: 'Battre l\'ordinateur fort',
    guide: 'Règle l\'ordinateur sur « fort » et gagne un combat, en jouant toi-même (le combat auto ne compte pas pour cette étape). Il lit tes habitudes : varie tes actions ! Le champion de chaque nation en Carrière est aussi au niveau fort.',
    lien: '#arene', bouton: 'Aller en Carrière',
  },
  {
    titre: 'Entre amis', objectif: 'Gagner un combat en ligne contre un ami',
    guide: 'Dans Social, crée une salle et envoie le code à un ami, ou rejoins la sienne. Gagne le combat.',
    lien: '#social', bouton: 'Ouvrir Social',
  },
  {
    titre: 'Tour du monde', objectif: 'Terminer la Carrière en battant toutes les nations',
    guide: 'Bats les 12 nations de la Carrière, l\'une après l\'autre. Si tu l\'as déjà terminée, l\'étape est validée tout de suite.',
    lien: '#arene', bouton: 'Aller en Carrière',
  },
  {
    titre: 'La consécration', objectif: 'Gagner un tournoi individuel sans passer par le tableau des perdants',
    guide: 'Gagne le tournoi individuel sans perdre un seul combat.',
    lien: '#tournois', bouton: 'Voir les tournois',
  },
  {
    titre: 'Le tacticien', objectif: 'Réussir 2 combos dans un même combat',
    guide: 'Un combo, ce sont deux actions qui s\'enchaînent : Matraquage puis Ceinture arrière, Sprawl puis une attaque, Simple jambe puis Double jambe, Esquive puis un contre. Le bouton de l\'action qui déclenche un combo s\'allume en vert. Le combat auto ne compte pas.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'L\'enchaîneur', objectif: 'Gagner un combat en format Enchaînement',
    guide: 'Dans Entraînement (ou entre amis), choisis le format « Enchaînement » : tu composes des séquences de 3 actions. Attention au contre en 1re action et au Matraquage en 2e : ils brisent la chaîne.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'Jusqu\'au bout', objectif: 'Gagner un combat en durée infinie',
    guide: 'Dans Entraînement (ou entre amis), choisis la durée « Infinie » : pas de périodes, pas d\'écart qui arrête le combat. Il faut faire tomber ton adversaire. Garde ton second souffle pour la fin.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'Le rival', objectif: 'Battre Cocoach une première fois',
    guide: 'À l\'entraînement, la durée « Infinie » se joue contre Cocoach, ton rival. Il commence en carte rare : fais-le tomber. À chaque défaite, il monte de niveau.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'Rival de taille', objectif: 'Battre Cocoach au niveau Légendaire',
    guide: 'Cocoach monte d\'un niveau à chaque fois que tu le bats : Épique, puis Légendaire. Au niveau Légendaire, l\'ordinateur qui le joue passe en fort. Bats-le à ce niveau.',
    lien: '#rapide', bouton: 'Entraînement',
  },
  {
    titre: 'Le sommet', objectif: 'Battre Cocoach Champion du Monde',
    guide: 'Dernier défi : Cocoach au niveau Champion du Monde, avec toutes ses actions. Récompense : des boosters et une carte légendaire que tu n\'as pas encore.',
    lien: '#rapide', bouton: 'Entraînement',
  },
];

export const NB_ETAPES = ETAPES.length;

// Ce qui se passe dans le jeu et peut faire avancer l'histoire.
export type EvenementHistoire =
  | { type: 'victoire'; nation: string; niveau: Niveau | null; auto?: boolean; carriere?: boolean } // tout combat gagné (niveau null : en ligne ; auto : combat automatique ; carriere : en Carrière)
  | { type: 'rapide'; tombe: boolean; ecart: number } // combat rapide gagné
  | { type: 'tournoiIndividuel'; place: number; invaincu: boolean }
  | { type: 'tournoiEquipe'; gagne: boolean }
  | { type: 'recrutement' }
  | { type: 'nationArene' } // une nation battue en Carrière
  | { type: 'fusion'; id: string }
  | { type: 'enLigne' } // combat en ligne gagné contre un ami
  | { type: 'combat'; gagne: boolean; combos: number; enchainement: boolean; infini: boolean; auto: boolean } // tout combat terminé
  | { type: 'rival'; grade: number; auto: boolean } // Cocoach battu (grade : son niveau pendant le combat, 1 = rare … 4 = Champion du Monde)
  | { type: 'etat' }; // simple vérification (Mon Club, arène)

export const histoireFinie = (c: Collection) => c.histoire.etape >= NB_ETAPES;

// Progression de l'étape en cours, pour l'affichage ([fait, à faire]), ou null.
export function progression(_c: Collection): [number, number] | null {
  return null;
}

// L'événement valide-t-il l'étape en cours ?
function valide(c: Collection, ev: EvenementHistoire): boolean {
  const h = c.histoire;
  switch (h.etape) {
    case 0: return ev.type === 'victoire' && !!ev.carriere;
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
    case 12: return ev.type === 'combat' && !ev.auto && ev.combos >= H.combosTacticien;
    case 13: return ev.type === 'combat' && !ev.auto && ev.gagne && ev.enchainement;
    case 14: return ev.type === 'combat' && !ev.auto && ev.gagne && ev.infini;
    case 15: return ev.type === 'rival' && !ev.auto;
    case 16: return ev.type === 'rival' && !ev.auto && ev.grade >= 3;
    case 17: return ev.type === 'rival' && !ev.auto && ev.grade >= 4;
    default: return false;
  }
}

// Récompense de l'étape `i` : boosters classiques ; pour la dernière étape, une légendaire et la
// carte secrète de Darius.
function recompense(c: Collection, i: number, hasard: Hasard): Booster[] {
  const n = H.boosters[i] ?? 0;
  const boosters = Array.from({ length: n }, () => ouvrirBooster(c, hasard, 'classique'));
  return i === NB_ETAPES - 1 ? [...boosters, legendaireOfferte(c, hasard), carteDarius(c, hasard)] : boosters;
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
