// Tutoriels courts, un par style de jeu (en plus du grand tutoriel du menu Combat).
// Chacun : 2 ou 3 écrans d'explication, puis une partie d'essai du mode (sans récompense ni
// progression), avec des conseils du coach sur les premiers tours, sans imposer d'action.
// Un tutoriel n'est proposé que si le joueur a déjà accès au style de jeu.

import { ACTIONS, REGLES, type IdAction } from '../moteur';
import { niveauClub, type Collection } from './collection';

export type IdTuto = 'combos' | 'enchainement' | 'infini' | 'arene' | 'individuel' | 'equipe' | 'amis';

// Ce que lance la partie d'essai.
export type Essai =
  | { type: 'rapide'; enchainement: boolean; infini: boolean; deck: IdAction[] }
  | { type: 'arene'; deck: IdAction[] }
  | { type: 'individuel' }
  | { type: 'equipe' }
  | null; // pas de partie (explication seulement)

export interface MiniTuto {
  id: IdTuto;
  titre: string;
  ecrans: { titre: string; html: string }[];
  essai: Essai;
  conseils: string[]; // un conseil par tour (ou par séquence) au début de la partie d'essai
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
        <p>Partie d'essai : combat rapide avec ${nomA('matraquage')}, ${nomA('ceinture_arriere')}, ${nomA('sprawl')} et ${nomA('simple_jambe')}. Pas de récompense.</p>` },
    ],
    essai: { type: 'rapide', enchainement: false, infini: false, deck: ['matraquage', 'ceinture_arriere', 'sprawl', 'simple_jambe'] },
    conseils: [
      'Commence par un Matraquage : s\'il réussit, la Ceinture arrière s\'allumera en vert.',
      'Ceinture arrière en vert ? Joue-la : c\'est le Passage dans le dos, +2 points.',
      'Essaie le Sprawl : s\'il bloque une attaque, ton attaque suivante ne pourra pas rater (Contre-temps).',
      'À toi de jouer ! Guette les boutons verts à chaque tour.',
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
        <p>Partie d'essai : combat rapide en format Enchaînement. Pas de récompense.</p>` },
    ],
    essai: { type: 'rapide', enchainement: true, infini: false, deck: ['matraquage', 'ceinture_arriere', 'contre', 'parade'] },
    conseils: [
      'Première séquence : essaie Parade, Matraquage, Ceinture arrière (un combo !).',
      'Un contre en 1re action, s\'il prend, brise toute la séquence adverse.',
      'Le Matraquage en 2e action peut annuler la 3e action adverse.',
    ],
    verrou: () => null,
  },
  infini: {
    id: 'infini', titre: 'La durée infinie',
    ecrans: [
      { titre: 'Jusqu\'au tombé', html: `<p>Pas de périodes, pas d'arrêt à ${R.ecartSuperiorite} points : le combat ne s'arrête que sur un <b>tombé</b> ou un abandon. En combat rapide, ton adversaire est <b>Cocoach</b>, ton rival : il monte de niveau chaque fois que tu le bats.</p>` },
      { titre: 'La fatigue', html: `<ul class="liste-regles">
        <li>Dès le tour ${R.infini.debutFatigue}, tu récupères tous les 3 tours, puis tous les 4 tours au tour ${R.infini.debutFatigue + R.infini.palier}…</li>
        <li>Dès le tour ${R.infini.debutSurcout}, chaque action coûte +1, puis +1 de plus tous les ${R.infini.palier} tours.</li>
        <li>Ne plus pouvoir payer aucune action pendant ${R.toursSansEnduranceAvantTombe} tours (à partir du tour d'épuisement choisi), c'est le tombé.</li></ul>` },
      { titre: 'Stratégie', html: `<p>Ne dépense pas tout au début : les défenses réussies rendent de l'endurance. Garde ton <b>second souffle</b> (+${R.souffle.gain} d'endurance, une fois, sous ${R.souffle.seuil}) pour la fin. Les combos et l'action spéciale d'attaque peuvent faire tomber l'adversaire.</p>
        <p>Partie d'essai contre Cocoach : elle ne le fait pas progresser et ne rapporte rien.</p>` },
    ],
    essai: { type: 'rapide', enchainement: false, infini: true, deck: ['simple_jambe', 'ceinture_arriere', 'parade', 'feinte'] },
    conseils: [
      'Pas de chrono : garde tes forces. Une Parade réussie fatigue Cocoach et te rend de l\'endurance.',
      'Varie tes actions : Cocoach adore les feintes. Une attaque bat la feinte.',
      'Sous 25 d\'endurance, le bouton Souffler te rend 15 d\'endurance, une seule fois.',
      'Dès le tour 20, l\'étiquette Fatigue apparaît : tu récupères moins souvent.',
    ],
    verrou: () => null,
  },
  arene: {
    id: 'arene', titre: 'L\'arène',
    ecrans: [
      { titre: 'Une nation après l\'autre', html: `<p>Dans l'arène, tu affrontes les nations une à une : ${R.arene.niveaux.length} lutteurs chacune, de plus en plus forts, le dernier étant son champion (ordinateur fort). Une défaite ? Tu réaffrontes le même lutteur.</p>` },
      { titre: 'Les récompenses', html: `<p>Chaque victoire rapporte un booster et une médaille. Une nation battue : ${R.arene.boostersParNation[0]} ou ${R.arene.boostersParNation[1]} boosters, ${R.arene.medaillesParNation} médailles, et 1 chance sur ${Math.round(1 / R.arene.chanceCarteBoss)} de gagner la carte du champion.</p>
        <p>Partie d'essai : un combat contre un premier adversaire, ordinateur facile. Pas de récompense ni de progression.</p>` },
    ],
    essai: { type: 'arene', deck: ['attaque_base', 'defense', 'feinte', 'contre'] },
    conseils: [
      'L\'arène se joue en 3 périodes de 10 tours : gagne-en 2.',
      'Attaque bat feinte, défense bat attaque, contre bat défense et attaque, feinte bat contre et défense.',
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
