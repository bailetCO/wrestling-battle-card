// Tutoriels courts, un par style de jeu (en plus du grand tutoriel du menu Combat).
// Chacun : 2 ou 3 écrans d'explication, puis une partie d'essai du mode. Depuis le 27/11/2026,
// la partie d'essai commence par des tours guidés, comme le grand tutoriel : seule l'action conseillée
// est jouable, et l'ordinateur joue en face l'action qui la fait réussir (sans que le coach la
// dévoile). Ensuite, la suite du combat se joue librement, avec des conseils ; une victoire rapporte
// un booster (une fois par tutoriel), sans autre récompense ni progression.
// Un tutoriel n'est proposé que si le joueur a déjà accès au style de jeu.

import { ACTIONS, REGLES, trouverLutteur, type DefLutteur, type IdAction } from '../moteur';
import { niveauClub, type Collection } from './collection';

export type IdTuto = 'combos' | 'enchainement' | 'infini' | 'arene' | 'individuel' | 'equipe' | 'amis';

// Ce que lance la partie d'essai.
export type Essai =
  | { type: 'rapide'; enchainement: boolean; infini: boolean; deck: IdAction[]; periodes?: boolean } // periodes : 3 périodes (au lieu d'une)
  | { type: 'arene'; deck: IdAction[] }
  | { type: 'individuel' }
  | { type: 'equipe' }
  | null; // pas de partie (explication seulement)

// Un tour guidé : l'action imposée au joueur, celle que joue l'ordinateur pour qu'elle réussisse, et
// le texte du coach (il dit quoi jouer et pourquoi, sans dévoiler l'action adverse).
// pause : tour « de respiration » où personne ne marque (il coupe la série de réussites qui
// déclencherait une tentative de tombé et finirait l'essai trop tôt).
export interface TourGuide { joueur: IdAction; ordi: IdAction; texte: string; pause?: boolean }
// En format Enchaînement : une séquence entière de chaque côté.
export interface SequenceGuidee { joueur: IdAction[]; ordi: IdAction[]; texte: string }

export interface MiniTuto {
  id: IdTuto;
  titre: string;
  ecrans: { titre: string; html: string }[];
  essai: Essai;
  guide?: TourGuide[]; // tours guidés au début de la partie d'essai
  guideSeq?: SequenceGuidee[]; // séquences guidées (format Enchaînement)
  // Deck de l'adversaire pendant la partie d'essai guidée (il doit contenir ses actions imposées).
  // Absent : l'adversaire garde son deck (Cocoach en durée infinie).
  deckAdversaire?: IdAction[];
  conseils: string[]; // conseils du coach pour les tours libres qui suivent les tours guidés
  // null si le style de jeu est accessible, sinon la raison.
  verrou: (c: Collection) => string | null;
}

const R = REGLES;
const nomA = (a: IdAction) => ACTIONS[a].nom;

export const TUTOS: Record<IdTuto, MiniTuto> = {
  combos: {
    id: 'combos', titre: 'Les combos',
    ecrans: [
      { titre: 'Deux actions qui s\'enchaînent', html: `<p>Un <b>combo</b>, ce sont deux actions réussies à la suite. Quand une action peut déclencher un combo, son bouton s'allume en <b>vert</b> avec « Combo ! ».</p>` },
      { titre: 'Les 4 combos', html: `<ul class="liste-regles">
        <li><b>Passage dans le dos</b> : ${nomA('matraquage')} puis ${nomA('ceinture_arriere')}, +${R.combos.passageDansLeDos.points} points.</li>
        <li><b>Contre-temps</b> : ${nomA('sprawl')} puis n'importe quelle attaque, qui ne peut pas rater.</li>
        <li><b>Enchaînement aux jambes</b> : ${nomA('simple_jambe')} puis ${nomA('double_jambe')}, +${R.combos.enchainementJambes.points} point et ${R.combos.enchainementJambes.reductionCout} d'endurance en moins.</li>
        <li><b>Esquive et contre</b> : ${nomA('esquive')} puis un contre qui prend l'attaque, +${R.combos.esquiveContre.points} points.</li></ul>` },
      { titre: 'Stratégie', html: `<p>Le Matraquage use l'adversaire et prépare la Ceinture arrière. Le Contre-temps est précieux quand ton endurance baisse : ton attaque ne peut plus rater. Et 3 actions réussies d'affilée, dont 2 attaques, donnent une tentative de <b>tombé</b>.</p>
        <p>Partie d'essai : entraînement avec ${nomA('matraquage')}, ${nomA('ceinture_arriere')}, ${nomA('sprawl')} et ${nomA('simple_jambe')}. Le coach te guide sur les premiers tours, puis tu joues seul. Un booster si tu gagnes (une fois).</p>` },
    ],
    essai: { type: 'rapide', enchainement: false, infini: false, deck: ['matraquage', 'ceinture_arriere', 'sprawl', 'simple_jambe'], periodes: true },
    guide: [
      { joueur: 'sprawl', ordi: 'attaque_base', texte: 'Premier combo : le <b>Contre-temps</b>. Commence par un <b>Sprawl</b> : s\'il bloque une attaque, ton attaque suivante ne pourra pas rater.' },
      { joueur: 'simple_jambe', ordi: 'feinte', texte: 'Ton Sprawl a bloqué : la <b>Simple jambe</b> s\'allume en vert. Joue-la : c\'est le Contre-temps, elle ne peut pas rater.' },
      { joueur: 'sprawl', ordi: 'defense', pause: true, texte: 'Contre-temps réussi ! Un tour pour souffler avant le deuxième combo : joue encore un <b>Sprawl</b>.' },
      { joueur: 'matraquage', ordi: 'defense', texte: 'Deuxième combo : le <b>Passage dans le dos</b>. Il commence par un <b>Matraquage</b>.' },
      { joueur: 'ceinture_arriere', ordi: 'feinte', texte: 'Matraquage réussi : la <b>Ceinture arrière</b> est en vert. Joue-la pour le Passage dans le dos, +2 points !' },
    ],
    deckAdversaire: ['attaque_base', 'defense', 'feinte', 'double_jambe'],
    conseils: [
      'À toi de jouer seul ! Guette les boutons verts : ils annoncent un combo.',
      'Le Matraquage use l\'adversaire et prépare la Ceinture arrière.',
    ],
    verrou: () => null,
  },
  enchainement: {
    id: 'enchainement', titre: 'Le format Enchaînement',
    ecrans: [
      { titre: 'Trois actions d\'avance', html: `<p>Tu composes une <b>séquence de ${R.enchainement.actions} actions</b>, dans l'ordre, en touchant les boutons ; ton adversaire fait de même en secret. Les actions sont comparées une à une : 1 contre 1, 2 contre 2, 3 contre 3. Une période dure ${R.enchainement.toursParPeriode} tours, soit 4 séquences.</p>` },
      { titre: 'Briser la chaîne', html: `<ul class="liste-regles">
        <li>Un <b>contre réussi en 1re action</b> arrête les deux séquences ; l'adversaire paie quand même ses actions annulées.</li>
        <li>Un <b>Matraquage réussi en 2e action</b> annule la dernière action adverse (2 fois sur 3).</li>
        <li>Avec l'<b>initiative</b>, tu vois la dernière action adverse et tu peux changer la tienne.</li></ul>` },
      { titre: 'Stratégie', html: `<p>Contre un adversaire qui attaque d'entrée, ouvre par un contre. Glisse un combo dans ta séquence (Matraquage puis Ceinture arrière). Garde de l'endurance : une séquence doit pouvoir être payée en entier.</p>
        <p>Partie d'essai : entraînement en format Enchaînement. Le coach te guide sur les 2 premières séquences, puis tu joues seul. Un booster si tu gagnes (une fois).</p>` },
    ],
    essai: { type: 'rapide', enchainement: true, infini: false, deck: ['matraquage', 'ceinture_arriere', 'contre', 'parade'] },
    guideSeq: [
      { joueur: ['matraquage', 'ceinture_arriere', 'parade'], ordi: ['defense', 'feinte', 'attaque_base'], texte: 'Compose ta première séquence, dans l\'ordre : <b>Matraquage</b>, <b>Ceinture arrière</b> (un combo !), puis <b>Parade</b>. Valide-la.' },
      { joueur: ['contre', 'parade', 'matraquage'], ordi: ['defense', 'feinte', 'attaque_base'], texte: 'Maintenant, ouvre par un <b>Contre</b> : réussi en 1re action, il <b>brise toute la séquence adverse</b>. Puis Parade et Matraquage.' },
    ],
    deckAdversaire: ['attaque_base', 'defense', 'feinte', 'simple_jambe'],
    conseils: [
      'À toi de composer tes séquences. Le Matraquage en 2e action peut annuler la 3e action adverse.',
      'Garde de l\'endurance : une séquence doit pouvoir être payée en entier.',
    ],
    verrou: () => null,
  },
  infini: {
    id: 'infini', titre: 'La durée infinie',
    ecrans: [
      { titre: 'Jusqu\'au tombé', html: `<p>Pas de périodes, pas d'arrêt à ${R.ecartSuperiorite} points : le combat ne s'arrête que sur un <b>tombé</b> ou un abandon. À l'entraînement, ton adversaire est <b>Cocoach</b>, ton rival : il monte de niveau chaque fois que tu le bats.</p>` },
      { titre: 'La fatigue', html: `<ul class="liste-regles">
        <li>Dès le tour ${R.infini.debutFatigue}, tu récupères tous les 3 tours, puis tous les 4 tours au tour ${R.infini.debutFatigue + R.infini.palier}…</li>
        <li>Dès le tour ${R.infini.debutSurcout}, chaque action coûte +1, puis +1 de plus tous les ${R.infini.palier} tours.</li>
        <li>Ne plus pouvoir payer aucune action pendant ${R.toursSansEnduranceAvantTombe} tours (à partir du tour ${R.infini.debutEpuisement}), c'est le tombé.</li></ul>` },
      { titre: 'Stratégie', html: `<p>Ne dépense pas tout au début : les défenses réussies rendent de l'endurance. Garde ton <b>second souffle</b> (+${R.souffle.gain} d'endurance, une fois, sous ${R.souffle.seuil}) pour la fin. Les combos et l'action spéciale d'attaque peuvent faire tomber l'adversaire.</p>
        <p>Partie d'essai contre Cocoach : le coach te guide sur les premiers tours, puis tu joues seul. Elle ne fait pas progresser Cocoach ; un booster si tu gagnes (une fois).</p>` },
    ],
    essai: { type: 'rapide', enchainement: false, infini: true, deck: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'] },
    deckAdversaire: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'], // Cocoach au niveau Rare, toujours
    guide: [
      { joueur: 'parade', ordi: 'simple_jambe', texte: 'Pas de chrono : garde tes forces. Commence par une <b>Parade</b> : réussie, elle fatigue Cocoach et te rend de l\'endurance.' },
      { joueur: 'simple_jambe', ordi: 'feinte', texte: 'Bien bloqué ! Cocoach adore les feintes, et l\'<b>attaque bat la feinte</b>. Joue la <b>Simple jambe</b>.' },
      { joueur: 'feinte', ordi: 'parade', texte: 'Des points ! S\'il se met en défense, la <b>feinte bat la défense</b> : il perd de l\'endurance et tu prends l\'initiative. Joue la <b>Feinte</b>.' },
    ],
    conseils: [
      'À toi de jouer seul ! Varie tes actions : Cocoach apprend vite.',
      'Sous 25 d\'endurance, le bouton Souffler te rend 15 d\'endurance, une seule fois.',
      'Dès le tour 20, l\'étiquette Fatigue apparaît : tu récupères moins souvent.',
    ],
    verrou: () => null,
  },
  arene: {
    id: 'arene', titre: 'La Carrière',
    ecrans: [
      { titre: 'Une nation après l\'autre', html: `<p>En Carrière, tu affrontes les nations une à une : ${R.arene.niveaux.length} lutteurs chacune, de plus en plus forts, le dernier étant son champion (ordinateur fort). Une défaite ? Tu réaffrontes le même lutteur.</p>` },
      { titre: 'Les récompenses', html: `<p>Chaque victoire rapporte un booster et une médaille. Une nation battue : ${R.arene.boostersParNation[0]} ou ${R.arene.boostersParNation[1]} boosters, ${R.arene.medaillesParNation} médailles, et 1 chance sur ${Math.round(1 / R.arene.chanceCarteBoss)} de gagner la carte du champion.</p>
        <p>Partie d'essai : un combat contre un premier adversaire, ordinateur facile. Le coach te guide sur les premiers tours. Pas de progression ; un booster si tu gagnes (une fois).</p>` },
    ],
    essai: { type: 'arene', deck: ['attaque_base', 'defense', 'feinte', 'contre'] },
    guide: [
      { joueur: 'defense', ordi: 'double_jambe', texte: 'Les 4 règles de base, une par tour. D\'abord : la <b>Défense bat l\'Attaque</b>. Joue la <b>Défense</b>.' },
      { joueur: 'feinte', ordi: 'defense', texte: 'Bloqué, et tu récupères de l\'endurance ! Ensuite : la <b>Feinte bat la Défense</b>. Joue la <b>Feinte</b>.' },
      { joueur: 'attaque_base', ordi: 'feinte', texte: 'Feinte réussie : ta prochaine attaque vaut +2. L\'<b>Attaque bat la Feinte</b> : joue l\'<b>Attaque</b>.' },
      { joueur: 'contre', ordi: 'simple_jambe', texte: 'Des points ! Dernière règle : le <b>Contre</b> prend l\'attaque adverse et renvoie ses points. Joue le <b>Contre</b>.' },
    ],
    deckAdversaire: ['double_jambe', 'defense', 'feinte', 'simple_jambe'],
    conseils: [
      'À toi de jouer seul ! La Carrière se joue en 3 périodes de 10 tours : gagne-en 2.',
      'Sous 50 d\'endurance, tes actions peuvent rater : alterne attaques et défenses.',
    ],
    verrou: () => null,
  },
  individuel: {
    id: 'individuel', titre: 'Le tournoi individuel',
    ecrans: [
      { titre: 'Le double tableau', html: `<p>Toi et des lutteurs de l'ordinateur, en double tableau. Une défaite avant les 1/2 finales t'envoie dans le <b>tableau des perdants</b> ; une deuxième t'élimine. Les perdants des 1/2 finales affrontent les vainqueurs du tableau des perdants, pour la petite finale.</p>` },
      { titre: 'Les gains', html: `<p>Un vrai tournoi coûte ${R.tournoi.individuel.inscription} $ : médailles et $ pour le podium, un booster rare au vainqueur.</p>
        <p>Tournoi d'essai : ${R.tournoi.individuel.minimum} lutteurs, gratuit, sans gain.</p>` },
    ],
    essai: { type: 'individuel' },
    conseils: ['Chaque victoire te fait avancer dans le tableau. Une défaite n\'est pas la fin : il reste le tableau des perdants.'],
    verrou: () => null,
  },
  equipe: {
    id: 'equipe', titre: 'Le tournoi par équipe',
    ecrans: [
      { titre: 'Ton club en équipe', html: `<p>Tes ${R.tournoi.equipe.duels} lutteurs de Mon Club, un duel chacun ; la première équipe à ${R.tournoi.equipe.victoiresPourGagner} victoires gagne. Tu choisis l'ordre de passage.</p>` },
      { titre: 'Le bonus de nation', html: `<p>3 lutteurs d'une même nation donnent +${Math.round(R.tournoi.equipe.bonusNation[3] * 100)} % à toute l'équipe, 4 : +${Math.round(R.tournoi.equipe.bonusNation[4] * 100)} %, 5 : +${Math.round(R.tournoi.equipe.bonusNation[5] * 100)} %.</p>
        <p>Tournoi d'essai : gratuit, sans gain.</p>` },
    ],
    essai: { type: 'equipe' },
    conseils: ['Chaque duel compte : la première équipe à 3 victoires gagne.'],
    verrou: (c) => niveauClub(c) >= R.club.niveauTournoiEquipe && c.club.length >= R.tournoi.equipe.duels ? null
      : `Il faut Mon Club au niveau ${R.club.niveauTournoiEquipe} avec ${R.tournoi.equipe.duels} lutteurs.`,
  },
  amis: {
    id: 'amis', titre: 'Le combat entre amis',
    ecrans: [
      { titre: 'Une salle, un code', html: `<p>L'un de vous crée une salle et reçoit un code de 4 lettres ; l'autre ouvre le même lien, touche « Combat entre amis » et tape le code. Choisissez le format et la durée en créant la salle.</p>` },
      { titre: 'Pas de triche', html: `<p>Chacun choisit en secret : le choix est envoyé caché, puis dévoilé quand les deux ont joué. Une victoire rapporte 2 médailles (et 2 boosters en mode « Avec nos collections »).</p>` },
    ],
    essai: null,
    conseils: [],
    verrou: () => null,
  },
};

// Le lutteur des parties d'essai : un lutteur équilibré, avec le deck qui montre le style de jeu.
// Endurance confortable (voir REGLES.tutoriel.enduranceEssai) : ses actions ne ratent pas pendant les tours guidés.
export function defEssai(deck: IdAction[]): DefLutteur {
  const base = trouverLutteur('europe');
  return { ...base, nom: 'Lutteur d\'essai', enduranceMax: REGLES.tutoriel.enduranceEssai, actions: [...deck], actionsPossibles: Object.keys(ACTIONS) as IdAction[] };
}

// L'adversaire d'une partie d'essai guidée : un lutteur commun, avec le deck qui contient ses actions
// imposées, et la même endurance que le lutteur d'essai (il ne rate pas les tours guidés).
export function defAdversaireEssai(id: string, deck: IdAction[]): DefLutteur {
  return { ...trouverLutteur(id), enduranceMax: REGLES.tutoriel.enduranceEssai, actions: [...deck], actionsPossibles: [...deck] };
}
