// État de la page et petits outils d'affichage partagés par tous les écrans.

import { ACTIONS, nomLocal, type Choix, type DefLutteur, type EtatCombat, type Famille, type Joueur, type NiveauCarte, type Niveau } from '../../moteur';
import { Partie, type TourJoue } from '../partie';
import { Duel, type Salle, type Vue } from '../enligne';
import { NOM_FAMILLE } from '../textes';
import { charger, type Collection } from '../collection';
import { portraitSVG } from '../portrait';
import { Echange } from '../club';
import { type CleMatch, type Tournoi } from '../tournoi';
import { type MonteeRival } from '../rival';
import { type IdTuto } from '../tutos';
import { DEV } from '../dev';
import { Paquet } from './fin';

export const app = document.getElementById('app')!;

// État de la page : toutes les variables qui changent pendant le jeu.
export const S = {
  partie: (null) as Partie | null,
  HUMAIN: (0) as Joueur,
  ORDI: (1) as Joueur,
  mode: ('solo') as 'solo' | 'ligne',
  duel: (null) as Duel | null,
  vueLigne: (null) as Vue | null,
  codeSalle: ('') as string,
  fenetreLigne: ('') as '' | 'init' | 'face',
  toursAffiches: (-1) as number,
  toursAnimes: (-1) as number,
  absentDepuis: (null) as number | null,
  tours: ([]) as TourJoue[],
  scoresPeriodes: ([]) as [number, number][],
  enAttente: (false) as boolean, // un tour est en cours de résolution (fenêtre ouverte)
  endurancesAvant: (null) as [number, number] | null, // pour animer les barres
  idPortrait: (0) as number,
  collection: (charger()) as Collection,
  recompenseDonnee: (false) as boolean, // une seule récompense par combat
  pointsFin: (null) as number | null, // points de classement gagnés au dernier combat (null : défaite ou sans objet)
  tuto: (false) as boolean, // combat guidé du tutoriel en cours
  areneCtx: (null) as { type: 'progression' } | { type: 'boss'; nation: string } | null,
  bossChoisi: (null) as string | null, // nation dont on va réaffronter le boss (choix du lutteur)
  enTournoi: (null) as CleMatch | number | null,
  bonusEnCours: (null) as { moi: number; lui: number } | null, // bonus de nation du combat (tournoi par équipe) // combat du joueur dans un tournoi (clé du combat ou n° du duel)
  bonusCeCombat: (false) as boolean, // combat d'arène qui suit le tutoriel : boosters doublés
  paquetSolo: (null) as Paquet | null,
  exploitFin: (null) as { titre: string; sousTitre: string; texte: string } | null, // exploit du dernier combat, à partager
  messageSolo: ('') as string,
  paquetBoite: (null) as Paquet | null, // récompense en cours d'ouverture (la première de la boîte)
  essaiSolo: (null) as IdTuto | null, // partie d'essai d'un tutoriel court en cours
  tournoi: (null) as Tournoi | null, // lu au démarrage (voir Navigation)
  paquetTournoi: (null) as Paquet | null,
  echange: (null) as Echange | null,
  codeEchange: ('') as string,
  combatEnAuto: (false) as boolean,
  interclubEnCours: (false) as boolean,
  chatOuvert: (false) as boolean,
  chatLus: (0) as number,
  enchainementChoisi: (false) as boolean, // format choisi sur l'écran du combat rapide
  infiniChoisi: (false) as boolean, // durée choisie sur l'écran du combat rapide
  rivalFin: (null) as (MonteeRival & { gradeAvant: number }) | null, // dernière progression de Cocoach (écran de fin)
  sequenceHumain: ([]) as Choix[],
  salleActive: (null) as Salle | null,
  signatureSalle: ('') as string,
  paquetLigne: (null) as { cle: string; paquet: Paquet } | null,
  minuteurAbsence: (undefined) as number | undefined,
};


// ---------- État de la page ----------

// Qui est qui dans le moteur : en solo tu es le joueur 0 ; en ligne, l'invité est le joueur 1.

// Combat entre amis

// Nombre de tours déjà montrés avec leur animation : quand l'écran se redessine sans nouveau tour
// (choix des actions d'une séquence, ouverture du Récap), la case reste figée au lieu de rejouer.

export const adv = () => (S.mode === 'ligne' ? S.vueLigne?.amiCoach || 'Ami' : 'Ordi');
export const moiNom = () => S.collection.coach || 'Toi';
// Pastille du niveau de compte, à côté du nom d'un coach.
export const pastilleNiveau = (n: number | null | undefined) => (n ? `<span class="niv-compte" title="Niveau de compte ${n}">Niv. ${n}</span>` : '');
export const pastilleSaisons = (n: number) => (n ? `<span class="niv-compte saisons" title="${n} saison${n > 1 ? 's' : ''} terminée${n > 1 ? 's' : ''}">🏆 ${n}</span>` : '');
export const niveauOrdi = (n: Niveau | undefined) => (n === 'fort' ? 'fort' : n === 'facile' ? 'facile' : 'normal');
export const etatEnCours = (): EtatCombat | null => (S.mode === 'ligne' ? S.vueLigne?.etat ?? null : S.partie?.etat ?? null);

if (!DEV && S.collection.toutDebloque) S.collection.toutDebloque = false; // hors mode développeur : la vraie collection

// Combat d'arène en cours : progression par nation, ou revanche contre le boss d'une nation battue.

// Boosters gagnés pendant le combat solo (ou message de consolation), affichés à la fin.


// ---------- Outils ----------

export const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
export const pct = (x: number) => `${Math.round(x * 100)} %`;
export const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type ActionJouee = Choix['action'];
export function famille(a: ActionJouee): Famille | 'lutte' | 'souffle' {
  return a === 'lutte' || a === 'souffle' ? a : ACTIONS[a].famille;
}
// Nom de la famille, en minuscules, pour les petites légendes (rien pour Lutte et Souffler).
export const legendeFamille = (f: Famille | 'lutte' | 'souffle') => (f === 'lutte' || f === 'souffle' ? '' : ` · ${NOM_FAMILLE[f].toLowerCase()}`);

export function libelleAction(nation: string, a: ActionJouee): { local: string; fr: string } {
  if (a === 'lutte') return { local: 'Lutte', fr: 'Lutte' };
  if (a === 'souffle') return { local: 'Souffler', fr: 'Second souffle' };
  return { local: nomLocal(nation, a), fr: ACTIONS[a].nom };
}

export function nouvelleGraine(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export const portrait = (def: DefLutteur, niveau?: NiveauCarte) => portraitSVG(def, `m${S.idPortrait++}`, { niveau });




export function enTete(titre: string, sous = '', retour = '#') {
  return `
    <header class="titre entete">
      <a class="retour" href="${retour}" aria-label="Retour">‹</a>
      <div><h1>${titre}</h1>${sous ? `<p>${sous}</p>` : ''}</div>
    </header>`;
}


// Les 3 niveaux de l'ordinateur.
// avecFort : le niveau Fort n'apparaît qu'à l'étape du mode histoire qui le présente (sauf s'il est déjà choisi).
export function choixNiveau(niv: Niveau, avecFort = true): string {
  const b = (n: Niveau, nom: string, sous: string) =>
    `<button class="${niv === n ? 'actif' : ''}" data-niveau="${n}" aria-pressed="${niv === n}">${nom}<small>${sous}</small></button>`;
  const fort = avecFort || niv === 'fort';
  return `<div class="niveau ${fort ? 'trois' : 'deux'}" role="group" aria-label="Niveau de l'ordinateur">
    ${b('facile', 'Facile', 'Pour débuter')}${b('normal', 'Normal', 'Pour s\'entraîner')}${fort ? b('fort', 'Fort', 'Il lit ton jeu') : ''}
  </div>`;
}
