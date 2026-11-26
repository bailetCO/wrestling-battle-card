// La page du jeu : affiche le combat et transmet les choix au moteur.

import './style.css';
import {
  ACTIONS, CHAMPIONS, LUTTEURS, LUTTEUR_TEST, NATIONS, REGLES, autoOuvert, bonusAutoExpert, creerCombat, chanceFortAuto, combatAuto, avecBonus, bonusNation, actionsJouables, chanceReussite, coutSpeciale, nomLocal,
  peutJouerSpeciale, precisionDe, trouverLutteur, souffleDispo, comboPossible, coutDuTour, pointsCombo, toursPeriode, actionsAjoutables, speciaux, souffleAjoutable, validerSequence, apercuSequence, enduranceApres, coutALaPlace, TAILLE_SEQUENCE, NIVEAUX, niveauCarte, etoilesPossibles, avecDeck, verifierDeck, coutAction, actionsDebloquees, TAILLE_DECK, REGLES as R_,
  type Choix, type DefLutteur, type EtatCombat, type EtatLutteur, type Face, type Famille, type IdAction,
  type Joueur, type NiveauCarte,
  type Niveau,
} from '../moteur';
import { Partie, type TourJoue , type SequenceJouee } from './partie';
import {
  ADRESSE_PUBLIQUE, Duel, RELAIS, codeValide, nouveauCode, salleLocale, salleRelais,
  type ModeSalle, type Presence, type Role, type Salle, type Vue,
} from './enligne';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, effetAction } from './textes';
import { NOM_RARETE, ORDRE_RARETE, STYLES_CARTE, activerReflets, carteHTML } from './carte';
import {
  acheterBooster, acheterChampion, cartesPossedees, charger, enFragment, debloquerLegendaire, legendaireDe, niveauCompte, gagnerMedailles, joindreGains, libererPlace, medaillesNiveauSuivant, niveauClub, placesClub, recruter, choisirDeck, consoler, deckDe, defPossede, etoilesDe, fusionPrete, fusionner, gradeDe, nbDoubles, nbEtoiles, nbExemplaires,
  nouvelleCollection, possede, prochaineFusion, recompenser, sauver, verifierPseudo, type Booster, type Collection,
  nbFusions, nbStyles, styleDe, doublesPourMaximum, type TriCollection,
} from './collection';
import { drapeauSVG, portraitSVG } from './portrait';
import { Echange, accepterOffre, jourDe, listeAmis, noterAmi, offreFaite, offresDuJour, type VueEchange } from './club';
import { ouvrirBooster } from './collection';
import { PAR_NATION, adversairesDe, areneTerminee, etapeArene, nationsArene, victoireArene, victoireBossRejoue } from './arene';
import {
  NOM_MATCH, avancer, creerTournoiEquipe, enregistrer, enregistrerDuel, equipeFinie,
  finie, gagnerCombatTournoi, payerInscription, places, prochainDuel, recompenserTournoi, scoreEquipe,
  avancerI, creerIndividuel, niveauMatchI, enregistrerI, exemptes, exemption, finieI, nombreParticipants, placesI,
  joueurInvaincu, type CleMatch, type Competition, type Individuel, type MatchI, type Tournoi, type TournoiEquipe,
} from './tournoi';
import { changerQuete, noterQuete, queteDe, quetesDuJour, texteRecompense, type EvenementQuete } from './quetes';
import { ETAPES, NB_ETAPES, histoireFinie, noterHistoire, passerEtape, progression, type EvenementHistoire } from './histoire';
import { PALIERS, creerCompetitionSaison, nbPaliers, noterSaison, nouvelleSaison, passerPalier, saisonOlympique, objectifPalier, recompensePalier, saisonFinie, saisonOuverte, type EvenementSaison } from './saison';
import { PERSONNAGES, SCENES, scenesEnCours, type Personnage } from './dialogues';
import { ETAPES_GUIDEES, TEXTE_LIBRE, TEXTE_LIBRE_SUITE, TUTO_COMBAT, ecransTutoriel, reglesHTML, type EtapeGuidee } from './aide';

const app = document.getElementById('app')!;

// ---------- État de la page ----------

let partie: Partie | null = null;
// Qui est qui dans le moteur : en solo tu es le joueur 0 ; en ligne, l'invité est le joueur 1.
let HUMAIN: Joueur = 0;
let ORDI: Joueur = 1;
// Combat entre amis
let mode: 'solo' | 'ligne' = 'solo';
let duel: Duel | null = null;
let vueLigne: Vue | null = null;
let codeSalle = '';
let fenetreLigne: '' | 'init' | 'face' = '';
let toursAffiches = -1;
// Nombre de tours déjà montrés avec leur animation : quand l'écran se redessine sans nouveau tour
// (choix des actions d'une séquence, ouverture du Récap), la case reste figée au lieu de rejouer.
let toursAnimes = -1;
let absentDepuis: number | null = null;
const adv = () => (mode === 'ligne' ? vueLigne?.amiCoach || 'Ami' : 'Ordi');
const moiNom = () => collection.coach || 'Toi';
// Pastille du niveau de compte, à côté du nom d'un coach.
const pastilleNiveau = (n: number | null | undefined) => (n ? `<span class="niv-compte" title="Niveau de compte ${n}">Niv. ${n}</span>` : '');
const pastilleSaisons = (n: number) => (n ? `<span class="niv-compte saisons" title="${n} saison${n > 1 ? 's' : ''} terminée${n > 1 ? 's' : ''}">🏆 ${n}</span>` : '');
const niveauOrdi = (n: Niveau | undefined) => (n === 'fort' ? 'fort' : n === 'facile' ? 'facile' : 'normal');
const etatEnCours = (): EtatCombat | null => (mode === 'ligne' ? vueLigne?.etat ?? null : partie?.etat ?? null);
let tours: TourJoue[] = [];
let scoresPeriodes: [number, number][] = [];
let enAttente = false; // un tour est en cours de résolution (fenêtre ouverte)
let endurancesAvant: [number, number] | null = null; // pour animer les barres
let idPortrait = 0;
let collection: Collection = charger();
let recompenseDonnee = false; // une seule récompense par combat
let tuto = false; // combat guidé du tutoriel en cours
// Combat d'arène en cours : progression par nation, ou revanche contre le boss d'une nation battue.
let areneCtx: { type: 'progression' } | { type: 'boss'; nation: string } | null = null;
let bossChoisi: string | null = null; // nation dont on va réaffronter le boss (choix du lutteur)
let enTournoi: CleMatch | number | null = null;
let bonusEnCours: { moi: number; lui: number } | null = null; // bonus de nation du combat (tournoi par équipe) // combat du joueur dans un tournoi (clé du combat ou n° du duel)
let bonusCeCombat = false; // combat d'arène qui suit le tutoriel : boosters doublés
// Boosters gagnés pendant le combat solo (ou message de consolation), affichés à la fin.
let paquetSolo: Paquet | null = null;
let messageSolo = '';

// ---------- Outils ----------

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const pct = (x: number) => `${Math.round(x * 100)} %`;
const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type ActionJouee = Choix['action'];
function famille(a: ActionJouee): Famille | 'lutte' | 'souffle' {
  return a === 'lutte' || a === 'souffle' ? a : ACTIONS[a].famille;
}
// Nom de la famille, en minuscules, pour les petites légendes (rien pour Lutte et Souffler).
const legendeFamille = (f: Famille | 'lutte' | 'souffle') => (f === 'lutte' || f === 'souffle' ? '' : ` · ${NOM_FAMILLE[f].toLowerCase()}`);

function libelleAction(nation: string, a: ActionJouee): { local: string; fr: string } {
  if (a === 'lutte') return { local: 'Lutte', fr: 'Lutte' };
  if (a === 'souffle') return { local: 'Souffler', fr: 'Second souffle' };
  return { local: nomLocal(nation, a), fr: ACTIONS[a].nom };
}

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

const portrait = (def: DefLutteur, niveau?: NiveauCarte) => portraitSVG(def, `m${idPortrait++}`, { niveau });

// ---------- Accueil, menu principal ----------


function compteur(): string {
  const n = collection.toutDebloque ? LUTTEURS.length : cartesPossedees(collection);
  return `<b>${n}/${LUTTEURS.length}</b> cartes${collection.toutDebloque ? ' (mode test)' : ''} · ${nbDoubles(collection)} double${nbDoubles(collection) > 1 ? 's' : ''} · ${collection.victoires} victoire${collection.victoires > 1 ? 's' : ''}`;
}

// Médailles (progression) et $ (à dépenser), en haut du menu et de Social.
function porteMonnaie(): string {
  const E = R_.economie;
  const reste = E.medaillesParPalier - (collection.medailles % E.medaillesParPalier);
  return `
    <div class="porte-monnaie" aria-label="${collection.medailles} médailles, ${collection.dollars} dollars">
      <span class="pm-medailles">${ICONE_MEDAILLE}<b>${collection.medailles}</b><small>médaille${collection.medailles > 1 ? 's' : ''}</small></span>
      <span class="pm-dollars"><i aria-hidden="true">$</i><b>${collection.dollars}</b><small>+${E.dollarsParPalier} $ dans ${reste} médaille${reste > 1 ? 's' : ''}</small></span>
    </div>`;
}

const ICONE_MEDAILLE = '<svg class="ico-medaille" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 1h4l2 7H9zM17 1h-4l-2 7h4z" fill="#c8102e"/><circle cx="12" cy="15" r="7.5" fill="#ffd76a" stroke="#8a5a00" stroke-width="1.5"/><path d="M12 10.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.6-2.8 1.6.6-3.1-2.3-2.1 3.1-.4z" fill="#b8860b"/></svg>';

// La carte telle que le joueur la possède : son deck, son grade, ses exemplaires.
function defJoueur(def: DefLutteur): DefLutteur {
  return avecDeck(defPossede(collection, def.id), deckDe(collection, def.id));
}

// Rareté atteinte par la carte du joueur (sa rareté de départ, montée par fusion).
const niveauDe = (id: string) => niveauCarte(trouverLutteur(id), gradeDe(collection, id));

function etiquettesCarte(def: DefLutteur): string {
  const n = nbExemplaires(collection, def.id);
  const et = nbEtoiles(collection, def.id);
  return `${et ? `<span class="pastille grade" title="${et} étoile${et > 1 ? 's' : ''}">★${et}</span>` : ''}${n > 1 ? `<span class="pastille nombre" title="${n} exemplaires">×${n}</span>` : ''}`;
}

function carteJoueur(def: DefLutteur, bouton = ''): string {
  return `<div class="carte-possedee">${carteHTML(defJoueur(def), bouton, { grade: gradeDe(collection, def.id), etoiles: etoilesDe(collection, def.id), style: styleDe(collection, def.id) })}<div class="pastilles">${etiquettesCarte(def)}</div></div>`;
}

const ICONES_MENU: Record<string, string> = {
  collection: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="10" width="20" height="28" rx="3" transform="rotate(-12 18 24)" fill="none" stroke="currentColor" stroke-width="3"/><rect x="20" y="10" width="20" height="28" rx="3" transform="rotate(10 30 24)" fill="currentColor" opacity=".9"/></svg>',
  combat: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40 30 18M14 12l6 6M40 40 18 18M34 12l-6 6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/></svg>',
  tournois: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 6h20v12a10 10 0 0 1-20 0z" fill="currentColor"/><path d="M14 10H7c0 7 3 11 8 11M34 10h7c0 7-3 11-8 11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 28v8M16 42h16l-2-6H18z" fill="currentColor"/></svg>',
  club: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l17 6v13c0 11-8 19-17 23C15 41 7 33 7 22V9z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 13l3 6.2 6.8.9-5 4.7 1.3 6.7L24 28.2l-6.1 3.3 1.3-6.7-5-4.7 6.8-.9z" fill="currentColor"/></svg>',
  social: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="7" fill="currentColor"/><circle cx="33" cy="19" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M4 40c1-9 7-13 13-13s12 4 13 13M28 39c1-7 4-10 9-10s8 3 9 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  fusion: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8v10c0 6 6 8 14 12M38 8v10c0 6-6 8-14 12v12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M17 36l7 8 7-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function ecranAccueil(message = '') {
  partie = null;
  app.innerHTML = `
    <main class="accueil">
      <div class="rayons" aria-hidden="true"></div>
      <section class="accueil-centre">
        <h1 class="logo">Wrestling<br>Battle Card</h1>
        <p>Bienvenue sur le tapis. Avant ton premier combat, choisis ton nom de coach : c'est sous ce nom que tu diriges tes lutteurs et que tes amis te verront.</p>
        <form class="form-pseudo">
          <label for="pseudo">Ton pseudo de coach</label>
          <input id="pseudo" name="pseudo" maxlength="16" autocomplete="nickname" placeholder="Coach…" value="${echap(collection.coach ?? '')}">
          <p class="erreur" role="alert">${echap(message)}</p>
          <button class="principal" type="submit">${collection.coach ? 'Enregistrer' : 'Entrer dans le jeu'}</button>
        </form>
        ${collection.coach ? '<a class="lien" href="#">Annuler</a>' : ''}
      </section>
    </main>`;
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const v = app.querySelector<HTMLInputElement>('#pseudo')!.value.trim();
    const erreur = verifierPseudo(v);
    if (erreur) return ecranAccueil(erreur);
    collection.coach = v;
    sauver(collection);
    if (location.hash) history.replaceState(null, '', location.pathname);
    ecranMenu();
  });
  app.querySelector<HTMLInputElement>('#pseudo')!.focus();
  window.scrollTo(0, 0);
}

// ---------- Modes histoire (histoire et saison) ----------

interface RecompenseHistoire { titre: string; lien: string; boosters: Booster[] }
let recompensesHistoire: RecompenseHistoire[] = []; // étapes ou paliers validés dont les boosters restent à ouvrir
let paquetHistoire: Paquet | null = null;
let paquetHistoireLien = ''; // écran du paquet en cours (#histoire ou #saison)

// Note un événement du jeu ; une étape validée est annoncée par une bulle.
function histoire(ev: EvenementHistoire) {
  etapesValidees(noterHistoire(collection, ev, Math.random));
}

function etapesValidees(r: ReturnType<typeof noterHistoire>) {
  if (!r.length) return;
  for (const x of r) {
    const legendaire = x.etape === NB_ETAPES - 1;
    recompensesHistoire.push({ titre: `Étape ${x.etape + 1} validée${legendaire ? ', carte légendaire' : ''}`, lien: '#histoire', boosters: x.boosters });
  }
  sauver(collection);
  const der = r[r.length - 1].etape;
  annoncer(`Étape ${der + 1} validée : ${ETAPES[der].titre} !`, '#histoire');
}

// Note un événement de la saison sportive.
function saison(ev: EvenementSaison) {
  palierValide(noterSaison(collection, ev, Math.random));
}

function palierValide(r: ReturnType<typeof noterSaison>) {
  sauver(collection);
  if (!r) return;
  recompensesHistoire.push({ titre: `${PALIERS[r.palier].nom} : réussi${r.finSaison ? ', fin de saison' : ''}`, lien: '#saison', boosters: r.boosters });
  annoncer(r.finSaison ? `Saison ${collection.saison.numero} terminée !` : `${PALIERS[r.palier].nom} : objectif atteint !`, '#saison');
}

function annoncer(titre: string, lien: string) {
  document.querySelector('.bulle-histoire')?.remove();
  const b = document.createElement('a');
  b.className = 'bulle-histoire';
  b.href = lien;
  b.setAttribute('role', 'status');
  b.innerHTML = `<b>${echap(titre)}</b><span>Touche ici pour ta récompense</span>`;
  document.body.append(b);
  b.addEventListener('click', () => b.remove());
  setTimeout(() => b.remove(), 7000);
}

const jauge = (p: [number, number]) => `<span class="jauge-histoire" style="--p:${(p[0] / p[1]) * 100}%"><i></i></span>`;

function bandeauHistoire(): string {
  if (recompensesHistoire.length) {
    const r = recompensesHistoire[0];
    return `<a class="bandeau-histoire pret" href="${r.lien}"><small>${r.lien === '#saison' ? 'Saison sportive' : r.lien === '#quetes' ? 'Quêtes du jour' : 'Mode histoire'}</small><b>🎁 Récompense à ouvrir</b><span>${echap(r.titre)}</span></a>`;
  }
  if (saisonOuverte(collection)) {
    const num = collection.saison.numero;
    if (saisonFinie(collection)) return `<a class="bandeau-histoire fini" href="#saison"><small>Saison ${num} terminée</small><b>Commencer la saison ${num + 1} ▶</b></a>`;
    const i = collection.saison.palier;
    const v = PALIERS[i].victoires;
    return `<a class="bandeau-histoire" href="#saison"><small>Saison ${num} · palier ${i + 1}/${nbPaliers(collection)} · ${echap(PALIERS[i].nom)}</small>
      <b>${echap(objectifPalier(i))}</b>${v ? `${jauge([collection.saison.victoires, v])}<span>${collection.saison.victoires}/${v}</span>` : ''}</a>`;
  }
  const i = collection.histoire.etape;
  const p = progression(collection);
  return `<a class="bandeau-histoire" href="#histoire"><small>Mode histoire · étape ${i + 1}/${NB_ETAPES}</small>
    <b>${echap(ETAPES[i].objectif)}</b>${p ? `${jauge(p)}<span>${p[0]}/${p[1]}</span>` : ''}</a>`;
}

// Prend la prochaine récompense à ouvrir pour cet écran (histoire ou saison).
function preparerPaquet(lien: string) {
  if (paquetHistoire && paquetHistoireLien === lien) return;
  if (paquetHistoire && !paquetHistoire.ouvert) {
    // Paquet de l'autre écran pas encore ouvert : il retourne dans la file.
    recompensesHistoire.unshift({ titre: paquetHistoire.titre, lien: paquetHistoireLien, boosters: paquetHistoire.boosters });
  }
  paquetHistoire = null;
  const i = recompensesHistoire.findIndex((r) => r.lien === lien);
  if (i < 0) return;
  const r = recompensesHistoire.splice(i, 1)[0];
  paquetHistoire = { titre: r.titre, boosters: r.boosters, ouvert: false };
  paquetHistoireLien = lien;
}

// Récompense à ouvrir ; une fois ouverte (récapitulatif compris), l'écran ne la montre plus : on passe à la suivante.
function blocPaquet(lien: string): string {
  if (!paquetHistoire || paquetHistoireLien !== lien || paquetHistoire.ouvert) return '';
  return sectionPaquet(paquetHistoire);
}

function brancherPaquet(_lien: string, ecran: () => void) {
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () =>
    paquetHistoire && revelerPaquet(paquetHistoire, () => { paquetHistoire = null; ecran(); }));
}

// ---------- Quêtes journalières ----------

// Note un événement pour les quêtes du jour ; une quête réussie est annoncée par une bulle.
function quete(ev: EvenementQuete) {
  const r = noterQuete(collection, ev, jourDe(), Math.random);
  sauver(collection);
  if (!r.length) return;
  for (const x of r) if (x.boosters.length) recompensesHistoire.push({ titre: `Quête réussie : ${x.titre}`, lien: '#quetes', boosters: x.boosters });
  annoncer(r.length > 1 ? `${r.length} quêtes réussies !` : `Quête réussie : ${r[0].titre}`, '#quetes');
}

// Événement « combat terminé » pour les quêtes, calculé à partir des tours joués.
function queteCombat(e: EtatCombat, mode: 'arene' | 'rapide' | 'tournoi' | 'equipe' | 'enLigne', niveau: Niveau | null, champion = false) {
  const moi = e.joueurs[HUMAIN];
  const nom = moi.def.nom;
  let feintes = 0, contres = 0, points = 0;
  tours.forEach((t, i) => {
    const apres = tours[i + 1]?.avant ?? e;
    const ch = t.choixHumain.action;
    const fam = ch === 'lutte' || ch === 'souffle' ? null : ACTIONS[ch].famille;
    const marque = t.lignes.filter((l) => l.startsWith(`${nom} marque `));
    for (const l of marque) points += Number(l.match(/marque (\d+)/)?.[1] ?? 0);
    if (fam === 'feinte' && apres.joueurs[HUMAIN].bonusFeinte === REGLES.toursBonusFeinte) feintes++;
    if (fam === 'contre' && marque.length) contres++;
  });
  quete({
    type: 'combat', mode, gagne: e.vainqueur === HUMAIN, niveau, auto: combatEnAuto, tombe: e.finPar === 'tombe',
    ecart: moi.score - e.joueurs[HUMAIN === 0 ? 1 : 0].score, points, nation: moi.def.nation,
    niveauCarte: niveauDe(moi.def.id), feintes, contres, champion,
  });
}

function blocQuetes(): string {
  const liste = quetesDuJour(collection, jourDe());
  const faites = liste.filter((q) => q.faite).length;
  return `<a class="bloc-quetes" href="#quetes"><span class="bq-titre">Quêtes du jour <b>${faites}/${liste.length}</b></span>
    ${liste.map((q) => {
      const d = queteDe(q.id);
      return `<span class="bq-ligne ${q.faite ? 'faite' : ''}"><i>${q.faite ? '✓' : d.difficulte === 'unique' ? '★' : '•'}</i>${echap(d.texte(q.param))}${d.but > 1 && !q.faite ? ` <small>${q.progres}/${d.but}</small>` : ''}</span>`;
    }).join('')}</a>`;
}

const NOM_DIFFICULTE: Record<string, string> = { facile: 'Facile', moyenne: 'Moyenne', difficile: 'Difficile', unique: 'Unique' };

function ecranQuetes(message = '') {
  partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  quete({ type: 'etat' });
  preparerPaquet('#quetes');
  const jour = jourDe();
  const liste = quetesDuJour(collection, jour);
  const P = R_.quetes.prixChangement;
  const lignes = liste.map((q, i) => {
    const d = queteDe(q.id);
    const peutChanger = !q.faite && d.difficulte !== 'unique' && !collection.quetes.change;
    return `<li class="etape-histoire ${q.faite ? 'faite' : 'en-cours'} q-${d.difficulte}">
      <span class="etape-n">${q.faite ? '✓' : d.difficulte === 'unique' ? '★' : i + 1}</span>
      <div><small class="q-diff">${NOM_DIFFICULTE[d.difficulte]}</small><b>${echap(d.texte(q.param))}</b>
        ${d.but > 1 ? `<p class="progres">${jauge([q.progres, d.but])} ${q.progres}/${d.but}</p>` : ''}
        <small class="gain">🎁 ${texteRecompense(d)}</small>
        ${peutChanger ? `<button class="secondaire bouton-changer" data-changer="${i}" ${collection.dollars >= P ? '' : 'disabled'}>Changer cette quête (${P} $)</button>` : ''}
      </div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Quêtes du jour', 'Trois nouvelles quêtes chaque jour à minuit. Celles qui ne sont pas finies disparaissent.')}
      ${message}
      ${blocPaquet('#quetes')}
      <ol class="etapes-histoire">${lignes}</ol>
      <section class="bloc"><p class="note">🎁 Les 3 quêtes réussies : ${collection.quetes.bonus ? 'bonus reçu ✓' : '1 booster rare en bonus'}.
        ${collection.quetes.change ? 'Tu as déjà changé une quête aujourd\'hui.' : `Tu peux changer une quête par jour (${P} $), sauf une quête unique.`}
        Les quêtes uniques (★) ne reviennent jamais une fois réussies.</p></section>
    </main>`;
  activerReflets(app);
  brancherPaquet('#quetes', () => ecranQuetes());
  app.querySelectorAll<HTMLButtonElement>('[data-changer]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = changerQuete(collection, jour, Number(b.dataset.changer));
      sauver(collection);
      ecranQuetes(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
  window.scrollTo(0, 0);
}

// ---------- Scènes de dialogue ----------

const defPersonnage = (qui: Personnage): DefLutteur => ({ ...trouverLutteur('europe'), id: `perso-${qui}`, nom: PERSONNAGES[qui].nom });

// Montre les scènes de l'avancement en cours que le joueur n'a pas encore vues.
function scenesAuto() {
  if (document.querySelector('.voile, .scene-dialogue, .revelation')) return;
  const cles = scenesEnCours(collection.histoire.etape, NB_ETAPES, collection.saison.palier, saisonFinie(collection), saisonOlympique(collection.saison.numero), collection.saison.numero === 1)
    .filter((k) => !collection.scenesVues.includes(k));
  if (cles.length) montrerScene(cles);
}

// Une scène façon BD : les bulles apparaissent une à une (« Suite »), « Passer » ferme tout.
function montrerScene(cles: string[]) {
  const repliques = cles.flatMap((k) => SCENES[k] ?? []);
  if (!repliques.length) return;
  document.querySelector('.scene-dialogue')?.remove();
  const voile = document.createElement('div');
  voile.className = 'scene-dialogue';
  voile.setAttribute('role', 'dialog');
  voile.setAttribute('aria-modal', 'true');
  voile.setAttribute('aria-label', 'Scène du mode histoire');
  document.body.append(voile);
  let n = 1;
  const fermer = () => {
    for (const k of cles) if (!collection.scenesVues.includes(k)) collection.scenesVues.push(k);
    sauver(collection);
    voile.remove();
  };
  const rendre = () => {
    voile.innerHTML = `<div class="scene-cadre">
      <div class="scene-bulles">${repliques.slice(0, n).map((r, i) => `
        <div class="replique r-${r.qui} ${i === n - 1 ? 'nouvelle' : ''}">
          <div class="replique-portrait">${portraitSVG(defPersonnage(r.qui), `sc${i}`)}</div>
          <div class="replique-bulle"><b>${PERSONNAGES[r.qui].nom}</b><p>${echap(r.texte)}</p></div>
        </div>`).join('')}</div>
      <div class="scene-boutons">
        <button class="lien" data-passer>Passer</button>
        <button class="principal" data-suite>${n < repliques.length ? 'Suite' : 'C\'est parti !'}</button>
      </div></div>`;
    voile.querySelector('.scene-bulles')!.scrollTop = 1e6;
    voile.querySelector<HTMLButtonElement>('[data-suite]')!.focus();
    voile.querySelector('[data-suite]')!.addEventListener('click', () => { if (n < repliques.length) { n++; rendre(); } else fermer(); });
    voile.querySelector('[data-passer]')!.addEventListener('click', fermer);
  };
  rendre();
}

function ecranHistoire() {
  partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  histoire({ type: 'etat' });
  preparerPaquet('#histoire');
  const cours = collection.histoire.etape;
  const p = progression(collection);
  const lignes = ETAPES.map((e, i) => {
    const etat = i < cours ? 'faite' : i === cours ? 'en-cours' : 'verrouillee';
    const recompense = R_.histoire.boosters[i] ? `${R_.histoire.boosters[i]} booster${R_.histoire.boosters[i] > 1 ? 's' : ''}` : '1 carte légendaire';
    return `<li class="etape-histoire ${etat}">
      <span class="etape-n">${i < cours ? '✓' : i + 1}</span>
      <div><b>${echap(e.titre)}</b><p>${echap(e.objectif)}</p>
        ${i === cours ? `<p class="guide">${echap(e.guide)}</p>${p ? `<p class="progres">${jauge(p)} ${p[0]}/${p[1]}</p>` : ''}<a class="principal lien-bouton bouton-etape" href="${e.lien}">${echap(e.bouton)}</a>` : ''}
        ${i <= cours ? `<button class="lien revoir-scene" data-scene="h${i}">💬 Revoir la scène</button>` : ''}
        ${i === cours ? '<button class="secondaire bouton-test" data-passer-etape>⏭ Passer à l\'étape suivante (test)</button>' : ''}
        <small class="gain">🎁 ${recompense}</small></div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Mode histoire', histoireFinie(collection) ? 'Toutes les étapes sont validées. Bravo, coach !' : `Étape ${cours + 1} sur ${NB_ETAPES} · chaque étape débloque la suivante`)}
      ${blocPaquet('#histoire')}
      ${histoireFinie(collection) ? '<section class="bloc saison-ouverte"><h2>La saison sportive est ouverte</h2><p>Interclub, régional, national, international, championnats du monde et Jeux Olympiques.</p><a class="principal lien-bouton" href="#saison">Commencer la saison</a></section>' : ''}
      <section class="bloc"><p class="note">Une étape ne compte qu'une fois débloquée : ce que tu as fait avant ne compte pas, sauf pour Mon Club (étapes 3 et 6) et l'arène (étapes 7 et 11), validées tout de suite si c'est déjà fait. Pas de médailles dans le mode histoire, mais des boosters à chaque étape.</p></section>
      <ol class="etapes-histoire">${lignes}</ol>
    </main>`;
  activerReflets(app);
  brancherPaquet('#histoire', ecranHistoire);
  app.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => montrerScene([b.dataset.scene!])));
  app.querySelector('[data-passer-etape]')?.addEventListener('click', () => {
    etapesValidees(passerEtape(collection, Math.random));
    document.querySelector('.bulle-histoire')?.remove();
    ecranHistoire();
  });
  window.scrollTo(0, 0);
  scenesAuto();
}

// ---------- Saison sportive ----------

function ecranSaison() {
  partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  if (!saisonOuverte(collection)) {
    app.innerHTML = `<main class="sous-menu">${enTete('Saison sportive', 'Verrouillée')}
      <section class="bloc"><p>🔒 La saison s'ouvre quand les 12 étapes du mode histoire sont validées (étape ${collection.histoire.etape + 1} en cours).</p>
      <a class="principal lien-bouton" href="#histoire">Voir le mode histoire</a></section></main>`;
    return;
  }
  preparerPaquet('#saison');
  const cours = collection.saison.palier;
  const enCours = !!tournoi && !tournoi.recompense;
  const C = R_.tournoi.individuel;
  const olympique = saisonOlympique(collection.saison.numero);
  const num = collection.saison.numero;
  const lignes = PALIERS.slice(0, nbPaliers(collection)).map((p, i) => {
    const etat = i < cours ? 'faite' : i === cours ? 'en-cours' : 'verrouillee';
    let action = '';
    if (i === cours) {
      if (p.victoires) {
        action = `<p class="progres">${jauge([collection.saison.victoires, p.victoires])} ${collection.saison.victoires}/${p.victoires} victoires</p>
          <button class="principal" data-interclub>Combat interclub</button>`;
      } else if (enCours && tournoi?.type === 'individuel' && tournoi.saison === i) {
        action = '<button class="principal" data-reprendre-competition>Reprendre la compétition</button>';
      } else {
        action = `<p class="note">Inscription ${C.inscription} $ (tu as ${collection.dollars} $). Gains habituels du tournoi individuel, plus la récompense du palier.</p>
          <button class="principal" data-competition ${enCours ? 'disabled' : ''}>S'inscrire</button>
          ${enCours ? '<p class="note">Un autre tournoi est en cours : termine-le d\'abord.</p>' : ''}`;
      }
    }
    return `<li class="etape-histoire ${etat}">
      <span class="etape-n">${i < cours ? '✓' : i + 1}</span>
      <div><b>${echap(p.nom)}</b><p>${echap(objectifPalier(i))}</p>${action}
        ${i <= cours ? `<button class="lien revoir-scene" data-scene="${i === 4 && !olympique ? 's4b' : `s${i}`}">💬 Revoir la scène</button>` : ''}
        ${i === cours ? '<button class="secondaire bouton-test" data-passer-palier>⏭ Passer au palier suivant (test)</button>' : ''}
        <small class="gain">🎁 ${recompensePalier(i)}</small></div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(`Saison ${num}`, saisonFinie(collection) ? 'Saison terminée !' : `Palier ${cours + 1} sur ${nbPaliers(collection)} · ${PALIERS[cours].nom}`)}
      ${blocPaquet('#saison')}
      ${saisonFinie(collection) ? `<section class="bloc saison-ouverte"><h2>Saison ${num} terminée 🏆</h2>
        <p>${collection.saison.terminees} saison${collection.saison.terminees > 1 ? 's' : ''} terminée${collection.saison.terminees > 1 ? 's' : ''} au total. La saison ${num + 1} ${saisonOlympique(num + 1) ? 'se termine aux Jeux Olympiques' : 'se termine aux championnats du monde (les Jeux reviennent tous les 4 ans)'}.</p>
        <button class="principal" data-nouvelle-saison>Commencer la saison ${num + 1}</button>
        <button class="lien" data-scene="${olympique ? 's6' : 's6b'}">💬 Revoir la scène finale</button></section>` : ''}
      <section class="bloc"><p class="note">${olympique ? 'Saison olympique : elle se termine aux Jeux Olympiques' : 'Cette saison se termine aux championnats du monde'}. Fin de saison : ${R_.saison.cartesFinSaison} cartes Champion du Monde (au hasard : 5 exemplaires d'une même carte, ou 5 cartes différentes)${olympique ? ', deux fois' : ''}.</p></section>
      <ol class="etapes-histoire">${lignes}</ol>
    </main>`;
  activerReflets(app);
  brancherPaquet('#saison', ecranSaison);
  app.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => montrerScene([b.dataset.scene!])));
  app.querySelector('[data-interclub]')?.addEventListener('click', () => ecranChoixSaison('interclub'));
  app.querySelector('[data-competition]')?.addEventListener('click', () => ecranChoixSaison('competition'));
  app.querySelector('[data-reprendre-competition]')?.addEventListener('click', ecranTournoiEnCours);
  app.querySelector('[data-nouvelle-saison]')?.addEventListener('click', () => {
    if (nouvelleSaison(collection)) sauver(collection);
    ecranSaison();
  });
  app.querySelector('[data-passer-palier]')?.addEventListener('click', () => {
    palierValide(passerPalier(collection, Math.random));
    document.querySelector('.bulle-histoire')?.remove();
    ecranSaison();
  });
  window.scrollTo(0, 0);
  scenesAuto();
}

// Choix du lutteur pour un combat interclub ou pour s'inscrire à la compétition du palier.
function ecranChoixSaison(quoi: 'interclub' | 'competition', message = '') {
  const p = PALIERS[collection.saison.palier];
  if (!p) return ecranSaison();
  const miens = [LUTTEUR_TEST, ...CARTES.filter((l) => possede(collection, l.id))]; // + Cocoach, lutteur de test
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(p.nom, quoi === 'interclub' ? 'Combat rapide (1 période) contre un autre club' : `Inscription ${R_.tournoi.individuel.inscription} $ (tu as ${collection.dollars} $)`, '#saison')}
      ${message}
      ${quoi === 'interclub' && autoDispo() ? '<section class="bloc"><label class="case"><input type="checkbox" data-auto-saison> ⚡ Combat auto</label></section>' : ''}
      <section class="bloc"><h2>Choisis ton lutteur</h2></section>
      <div class="liste-recrues marge">${miens.map((l) => `<button data-choisir="${l.id}" aria-label="Choisir ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-choisir]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.choisir!;
      if (quoi === 'interclub') return lancerInterclub(id, !!app.querySelector<HTMLInputElement>('[data-auto-saison]')?.checked);
      const erreur = payerInscription(collection, 'individuel');
      if (erreur) return ecranChoixSaison(quoi, `<p class="alerte">${echap(erreur)}</p>`);
      tournoi = creerCompetitionSaison(collection, id, nouvelleGraine());
      paquetTournoi = null;
      sauver(collection);
      sauverTournoi();
      ecranTournoiEnCours();
    }),
  );
  window.scrollTo(0, 0);
}

// Combat interclub : combat rapide contre un lutteur d'une autre nation, ordinateur du palier.
function lancerInterclub(id: string, auto: boolean) {
  const nation = trouverLutteur(id).nation;
  const autres = LUTTEURS.filter((l) => l.nation !== nation);
  const ordi = autres[Math.floor(Math.random() * autres.length)].id;
  lancer(id, ordi, nouvelleGraine(), true, PALIERS[0].niveau as Niveau, auto, null, true);
}

function ecranMenu() {
  partie = null;
  histoire({ type: 'etat' });
  quete({ type: 'etat' });
  const session = sessionLigne();
  const fusions = CARTES.filter((l) => fusionPrete(collection, l.id)).length;
  const tuile = (id: string, titre: string, sous: string, href: string, alerte = '', cadenas = '') => `
    <a class="tuile t-${id} ${cadenas ? 'verrouillee' : ''}" href="${href}">
      <span class="tuile-ico">${ICONES_MENU[id]}</span>
      <span class="tuile-titre">${titre}</span>
      <span class="tuile-sous">${sous}</span>
      ${alerte ? `<span class="tuile-alerte">${alerte}</span>` : ''}
      ${cadenas ? `<span class="tuile-cadenas">🔒 ${cadenas}</span>` : ''}
    </a>`;
  const nivClub = niveauClub(collection);
  const tournoiActif = !!tournoi && !tournoi.recompense;
  app.innerHTML = `
    <main class="menu">
      <header class="menu-tete">
        <span class="avatar" aria-hidden="true">${echap((collection.coach ?? '?').slice(0, 1).toUpperCase())}</span>
        <span class="menu-coach"><small>Coach · niveau de compte</small><b>${echap(collection.coach ?? '')} ${pastilleNiveau(niveauCompte(collection))}${pastilleSaisons(collection.saison.terminees)}</b></span>
        <a class="lien petit" href="#pseudo">Modifier</a>
      </header>
      ${porteMonnaie()}
      <p class="compteur menu-stats">${compteur()}</p>
      ${session ? `<div class="reprise"><p>Combat entre amis en cours (salle ${echap(session.code.toUpperCase())}).</p><button class="principal" data-reprendre>Reprendre</button><button class="lien" data-oublier>Quitter ce combat</button></div>` : ''}
      ${bandeauHistoire()}
      ${blocQuetes()}
      <nav class="tuiles" aria-label="Menu principal">
        ${tuile('combat', 'Combat', 'Arène contre l\'ordinateur ou en ligne contre un ami', '#combat')}
        ${tuile('tournois', 'Tournois', 'Individuel et par équipe', '#tournois', tournoiActif ? 'En cours' : '')}
        ${tuile('collection', 'Collection', `${collection.toutDebloque ? LUTTEURS.length : cartesPossedees(collection)}/${LUTTEURS.length} cartes · régler les actions`, '#collection')}
        ${tuile('fusion', 'Fusion', 'Fusionne tes doubles pour monter en rareté', '#fusion', fusions ? `${fusions} prête${fusions > 1 ? 's' : ''}` : '')}
        ${tuile('club', 'Mon Club', nivClub ? `Niveau ${nivClub} · ${collection.club.length}/${placesClub(collection)} lutteurs` : 'Recrute tes lutteurs dans ton club', '#club', '', nivClub ? '' : `${R_.club.medaillesOuverture} médailles`)}
        ${tuile('social', 'Social', 'Boutique, transferts de lutteurs et amis', '#social')}
      </nav>
    </main>`;
  app.querySelector('[data-reprendre]')?.addEventListener('click', () => {
    const x = sessionLigne();
    if (x) connecter(x.code, x.role);
  });
  app.querySelector('[data-oublier]')?.addEventListener('click', () => {
    oublierSession();
    ecranMenu();
  });
  window.scrollTo(0, 0);  // On présente au joueur son objectif du moment (scène de dialogue pas encore vue).
  scenesAuto();
}

function enTete(titre: string, sous = '', retour = '#') {
  return `
    <header class="titre entete">
      <a class="retour" href="${retour}" aria-label="Retour">‹</a>
      <div><h1>${titre}</h1>${sous ? `<p>${sous}</p>` : ''}</div>
    </header>`;
}

// Les 3 niveaux de l'ordinateur.
function choixNiveau(niv: Niveau): string {
  const b = (n: Niveau, nom: string, sous: string) =>
    `<button class="${niv === n ? 'actif' : ''}" data-niveau="${n}" aria-pressed="${niv === n}">${nom}<small>${sous}</small></button>`;
  return `<div class="niveau trois" role="group" aria-label="Niveau de l'ordinateur">
    ${b('facile', 'Facile', 'Pour débuter')}${b('normal', 'Normal', 'Pour s\'entraîner')}${b('fort', 'Fort', 'Il lit ton jeu')}
  </div>`;
}

function ecranCombatMenu() {
  partie = null;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Combat')}
      <nav class="aide-barre" aria-label="Aide">
        <a class="aide-btn" href="#regles"><span aria-hidden="true">?</span>Règles</a>
        <a class="aide-btn" href="#tutoriel">Tutoriel<span aria-hidden="true">▶</span></a>
      </nav>
      <section class="bloc">
        <h2>Arène</h2>
        ${collection.bonusTutoriel ? '<p class="bandeau-bonus">Tutoriel terminé : ta prochaine victoire dans l\'arène rapporte 2 boosters en bonus.</p>' : ''}
        <p>${areneTerminee(collection) ? 'Arène terminée : réaffronte les boss pour gagner leur carte.' : `En cours : <b>${echap(etapeArene(collection).nation!.nom)}</b>, adversaire ${etapeArene(collection).rang + 1}/${PAR_NATION}.`} Bats les nations une à une : 5 lutteurs chacune, de plus en plus forts, le dernier est le boss. +1 médaille par victoire ; nation battue : 2 ou 3 boosters et ${R_.arene.medaillesParNation} médailles. Toutes les 2 défaites d'affilée, un booster de consolation.</p>
        <a class="principal lien-bouton" href="#arene">Aller dans l'arène</a>
      </section>
      <section class="bloc">
        <h2>Combat rapide</h2>
        <p>Une seule période : victoire à 10 points d'écart, par tombé, ou aux points. Égalité à la fin : mort subite, le premier qui marque gagne. +1 médaille par victoire, sans booster.</p>
        <a class="principal lien-bouton" href="#rapide">Combat rapide contre l'ordinateur</a>
      </section>
      <section class="bloc">
        <h2>En ligne</h2>
        <p>Affronte un ami sur son téléphone. Chaque victoire rapporte 2 médailles, et 2 boosters avec ta collection.</p>
        <a class="principal lien-bouton" href="#amis">Combat entre amis</a>
      </section>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = b.dataset.niveau;
      collection.niveau = n === 'fort' || n === 'facile' ? n : 'normal';
      sauver(collection);
      ecranCombatMenu();
    }),
  );
  window.scrollTo(0, 0);
}

// Arène : choix du lutteur parmi ses cartes.
const NOM_NIVEAU: Record<Niveau, string> = { facile: 'Facile', normal: 'Normal', fort: 'Fort' };

// En-tête de l'arène : la nation en cours, ses 5 adversaires et l'adversaire à battre.
function blocArene(): string {
  if (bossChoisi) {
    const n = nationsArene().find((x) => x.id === bossChoisi)!;
    const boss = trouverLutteur(adversairesDe(n.id)[PAR_NATION - 1]);
    return `<section class="bloc arene-nation">${drapeauSVG(n.id)}<h2>Revanche : ${echap(boss.nom)}</h2>
      <p>Boss de ${echap(n.nom)}, ordinateur fort. Victoire : +1 médaille et 1 chance sur 3 de gagner sa carte.</p>
      <button class="lien" data-annuler-boss>Revenir à l'arène</button></section>`;
  }
  const e = etapeArene(collection);
  const battues = e.nationsBattues;
  const boss = battues.length
    ? `<section class="bloc"><h2>Boss à réaffronter</h2><p>1 chance sur 3 de gagner sa carte à chaque victoire.</p>
        <div class="boss-liste">${battues.map((n) => {
          const b = trouverLutteur(adversairesDe(n.id)[PAR_NATION - 1]);
          return `<button class="boss" data-boss="${n.id}">${drapeauSVG(n.id)}<span><b>${echap(b.nom)}</b><small>${echap(n.nom)}${possede(collection, b.id) ? ' · carte obtenue' : ''}</small></span></button>`;
        }).join('')}</div></section>`
    : '';
  if (!e.nation) {
    return `<section class="bloc arene-nation"><h2>🏆 Arène terminée !</h2><p>Tu as battu les ${nationsArene().length} nations. Réaffronte leurs boss pour gagner leur carte.</p></section>${boss}`;
  }
  const ids = adversairesDe(e.nation.id);
  const etapes = ids.map((id, i) => {
    const l = trouverLutteur(id);
    const etat = i < e.rang ? 'battu' : i === e.rang ? 'actuel' : 'a-venir';
    return `<li class="etape-arene ${etat}"><span class="vignette">${i <= e.rang ? portrait(l) : '<span class="mystere">?</span>'}</span>
      <small>${i === PAR_NATION - 1 ? 'Boss' : `${i + 1}`}</small></li>`;
  }).join('');
  const adv = trouverLutteur(e.adversaire!);
  return `
    <section class="bloc arene-nation">
      <div class="arene-titre">${drapeauSVG(e.nation.id)}<h2>${echap(e.nation.nom)}</h2><small>Nation ${nationsArene().indexOf(e.nation) + 1}/${nationsArene().length}</small></div>
      <ol class="etapes-arene">${etapes}</ol>
      <p class="prochain">${e.rang === PAR_NATION - 1 ? '👑 Boss : ' : 'Adversaire : '}<b>${echap(adv.nom)}</b> · ${NOM_RARETE[adv.rarete]} · ordinateur ${NOM_NIVEAU[e.niveau].toLowerCase()}</p>
      <p class="note">Bats les 5 lutteurs pour gagner 2 ou 3 boosters et ${R_.arene.medaillesParNation} médailles (+1 médaille par victoire). Le boss : 1 chance sur 3 de gagner sa carte. Choisis ton lutteur ci-dessous.</p>
    </section>
    ${boss}`;
}

function ecranArene(rapide = false) {
  partie = null;
  const miens = [LUTTEUR_TEST, ...CARTES.filter((l) => possede(collection, l.id))]; // + Cocoach, lutteur de test
  const cartes = miens.map((l) => {
    const boutons = `
      <button class="principal cl-choisir" data-lutteur="${l.id}">Lutter avec ${echap(l.nom)}</button>
      ${boutonAuto('data-lutteur-auto', l.id)}
      <button class="secondaire cl-deck" data-deck="${l.id}">Régler les actions${deckDe(collection, l.id) ? ' (perso)' : ''}</button>`;
    return `<div class="emplacement" data-nation="${l.nation}">${carteJoueur(l, boutons)}</div>`;
  }).join('');
  const nations = NATIONS.filter((n) => miens.some((l) => l.nation === n.id));
  const puces = nations.map((n) => `<button class="puce" data-aller="${n.id}">${n.nom}</button>`).join('');
  app.innerHTML = `
    <main class="choix">
      ${rapide
        ? `${enTete('Combat rapide', `Ordinateur ${niveauOrdi(collection.niveau)} · l'adversaire est tiré au hasard parmi les ${LUTTEURS.length} lutteurs.`, '#combat')}
           <div class="marge">${choixNiveau(collection.niveau)}
             <label class="case-rapide"><input type="checkbox" id="enchainement" ${enchainementChoisi ? 'checked' : ''}> Mode Enchaînement <small>(à l'essai : séquences de ${TAILLE_SEQUENCE} actions, ${R_.enchainement.toursParPeriode} tours)</small></label></div>`
        : `${enTete('Arène', 'Bats les nations une à une.', '#combat')}<div class="marge">${blocArene()}</div>`}
      ${collection.bonusTutoriel && !rapide ? '<p class="bandeau-bonus marge">Bonus du tutoriel : 2 boosters en plus si tu gagnes ce combat.</p>' : ''}
      <nav class="puces" aria-label="Aller à une nation">${puces}</nav>
      <div class="defile" tabindex="0" aria-label="Tes lutteurs">${cartes}</div>
      <div class="defile-nav">
        <button class="rond" data-pas="-1" aria-label="Carte précédente">‹</button>
        <span class="compteur">${miens.length} lutteur${miens.length > 1 ? 's' : ''}</span>
        <button class="rond" data-pas="1" aria-label="Carte suivante">›</button>
      </div>
    </main>`;
  const defile = app.querySelector<HTMLElement>('.defile')!;
  const pas = (sens: number) => {
    const e = defile.querySelector<HTMLElement>('.emplacement');
    if (e) defile.scrollBy({ left: sens * (e.offsetWidth + 14), behavior: 'smooth' });
  };
  app.querySelectorAll<HTMLButtonElement>('[data-pas]').forEach((b) => b.addEventListener('click', () => pas(Number(b.dataset.pas))));
  defile.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') pas(1);
    if (ev.key === 'ArrowLeft') pas(-1);
  });
  app.querySelectorAll<HTMLButtonElement>('[data-aller]').forEach((b) =>
    b.addEventListener('click', () => {
      const cible = defile.querySelector<HTMLElement>(`[data-nation="${b.dataset.aller}"]`);
      if (cible) defile.scrollTo({ left: cible.offsetLeft - defile.offsetLeft - 16, behavior: 'smooth' });
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-deck]').forEach((b) =>
    b.addEventListener('click', () => fenetreDeck(trouverLutteur(b.dataset.deck!))),
  );
  const lutter = (id: string, auto: boolean) => {
    if (!rapide) return lancerArene(id, auto);
    const autres = LUTTEURS.filter((l) => l.id !== id);
    const ordi = autres[Math.floor(Math.random() * autres.length)].id;
    lancer(id, ordi, nouvelleGraine(), rapide, collection.niveau, auto);
  };
  app.querySelectorAll<HTMLButtonElement>('[data-lutteur]').forEach((b) => b.addEventListener('click', () => lutter(b.dataset.lutteur!, false)));
  app.querySelectorAll<HTMLButtonElement>('[data-lutteur-auto]').forEach((b) => b.addEventListener('click', () => lutter(b.dataset.lutteurAuto!, true)));
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = b.dataset.niveau;
      collection.niveau = n === 'fort' || n === 'facile' ? n : 'normal';
      sauver(collection);
      ecranArene(rapide);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-boss]').forEach((b) =>
    b.addEventListener('click', () => { bossChoisi = b.dataset.boss!; ecranArene(); }),
  );
  app.querySelector<HTMLInputElement>('#enchainement')?.addEventListener('change', (ev) => {
    enchainementChoisi = (ev.target as HTMLInputElement).checked;
  });
  app.querySelector('[data-annuler-boss]')?.addEventListener('click', () => { bossChoisi = null; ecranArene(); });
  if (areneTerminee(collection) && !bossChoisi && !rapide) app.querySelector('.defile')?.closest('main')?.classList.add('arene-finie');
  activerReflets(app);
  window.scrollTo(0, 0);
}

// ---------- Choix du deck ----------

function fenetreDeck(base: DefLutteur) {
  const def = defPossede(collection, base.id);
  const grade = gradeDe(collection, base.id);
  const et = etoilesDe(collection, base.id);
  let choix: IdAction[] = [...(deckDe(collection, def.id) ?? def.actions)];
  const verrouillees = def.deblocages.filter((a) => !def.actionsPossibles.includes(a));
  // L'action de Champion, débloquée au niveau Champion du Monde (au coût normal de l'action).
  const champion = def.actionChampion && !def.actionsPossibles.includes(def.actionChampion) ? def.actionChampion : null;
  const ligne = (a: IdAction, ouverte: boolean, gradeDeblocage = 0) => {
    const fam = ACTIONS[a].famille;
    const cout = ouverte ? coutAction(def, a) : a === champion ? ACTIONS[a].cout : Math.max(R_.fusion.coutMinimum, ACTIONS[a].cout - R_.fusion.reductionDeblocage);
    const etoiles = et[a] ? `<span class="etoiles-action">${'★'.repeat(et[a]!)}</span>` : '';
    return `
      <button class="deck-action ${ouverte ? '' : 'verrouillee'}" ${ouverte ? `data-a="${a}" aria-pressed="false"` : 'disabled'}>
        <span class="ico f-${fam}">${ICONE[fam]}</span>
        <span class="a-nom">${echap(nomLocal(def.nation, a))} ${etoiles}${fam === def.familleSpeciale ? ' <small class="marque-spe">spéciale</small>' : ''}</span>
        <span class="a-fr">${ouverte ? '' : `Débloquée au niveau ${NOM_RARETE[NIVEAUX[gradeDeblocage - 1]]} · `}${echap(ACTIONS[a].nom)} · ${NOM_FAMILLE[fam].toLowerCase()} · ${effetAction(a)}</span>
        <span class="a-cout">${cout}</span>
      </button>`;
  };
  const f = ouvrirFenetre(`
    <h2>Actions de ${echap(def.nom)}</h2>
    <p>Choisis ${TAILLE_DECK} actions parmi les ${def.actionsPossibles.length} débloquées, dont au moins une de la famille de son action spéciale (${NOM_FAMILLE[def.familleSpeciale].toLowerCase()}). Chaque niveau de rareté donne une action de plus (Champion du Monde : toutes), qui coûte 1 d'endurance de moins. Au niveau Champion du Monde, la carte gagne aussi son <b>action de Champion</b>.</p>
    <div class="deck-liste">
      ${def.actionsPossibles.map((a) => ligne(a, true)).join('')}
      ${verrouillees.map((a) => ligne(a, false, def.deblocages.indexOf(a) + 2)).join('')}
      ${champion ? ligne(champion, false, NIVEAUX.length) : ''}
    </div>
    <p class="deck-etat" aria-live="polite"></p>
    <div class="deck-boutons">
      <button class="principal" data-enregistrer>Enregistrer le deck</button>
      <button class="secondaire" data-defaut>Revenir aux 4 actions de base</button>
      <button class="lien" data-fermer>Annuler</button>
    </div>`, true);
  void grade;
  const maj = () => {
    f.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => {
      const pris = choix.includes(b.dataset.a as IdAction);
      b.classList.toggle('pris', pris);
      b.setAttribute('aria-pressed', String(pris));
    });
    const erreur = verifierDeck(def, choix);
    const etat = f.querySelector<HTMLElement>('.deck-etat')!;
    etat.textContent = `${choix.length}/${TAILLE_DECK} actions choisies.${erreur && choix.length === TAILLE_DECK ? ` ${erreur}` : ''}`;
    f.querySelector<HTMLButtonElement>('[data-enregistrer]')!.disabled = !!erreur;
  };
  f.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) =>
    b.addEventListener('click', () => {
      const a = b.dataset.a as IdAction;
      if (choix.includes(a)) choix = choix.filter((x) => x !== a);
      else if (choix.length < TAILLE_DECK) choix.push(a);
      maj();
    }),
  );
  f.querySelector('[data-enregistrer]')!.addEventListener('click', () => {
    if (choisirDeck(collection, def.id, choix)) return;
    sauver(collection);
    quete({ type: 'deck' });
    fermerFenetre();
    route();
  });
  f.querySelector('[data-defaut]')!.addEventListener('click', () => {
    delete collection.decks[def.id];
    sauver(collection);
    fermerFenetre();
    route();
  });
  maj();
}

// ---------- Collection ----------

const TRIS: { id: TriCollection; nom: string }[] = [
  { id: 'rarete', nom: 'Rareté de base' }, { id: 'nation', nom: 'Nation' },
  { id: 'fusions', nom: 'Fusions' }, { id: 'niveau', nom: 'Rareté actuelle' },
];

// Toutes les cartes qu'un joueur peut posséder : les 120 lutteurs et les 12 Champions du Monde.
const CARTES: DefLutteur[] = [...LUTTEURS, ...CHAMPIONS];

// Les groupes de cartes de la collection, selon le tri choisi.
// Sans aucun Champion du Monde, leur groupe est tout en bas ; dès le premier, il remonte en haut (tris
// par rareté seulement). Dans chaque groupe, les cartes à gagner sont cachées derrière « Voir plus »
// (sauf le groupe « À gagner » du tri par fusions, qui n'a que celles-là).
const groupesDeplies = new Set<string>();
function groupesCollection(): { titre: string; liste: DefLutteur[]; replie: boolean }[] {
  const aucun = !CHAMPIONS.some((l) => possede(collection, l.id));
  const champions = { titre: 'Champions du Monde', liste: CHAMPIONS };
  // En haut seulement dans les tris par rareté (de base ou actuelle) ; ailleurs, tout en bas.
  const enHaut = !aucun && (collection.tri === 'rarete' || collection.tri === 'niveau');
  const groupes = enHaut ? [champions, ...groupesBase()] : [...groupesBase(), champions];
  return groupes.map((g) => ({ ...g, replie: g.titre !== 'À gagner' && !groupesDeplies.has(g.titre) }));
}

function groupesBase(): { titre: string; liste: DefLutteur[] }[] {
  const tri = collection.tri;
  const rangBase = (l: DefLutteur) => ORDRE_RARETE.indexOf(l.rarete);
  if (tri === 'nation') {
    return NATIONS.map((n) => ({ titre: n.nom, liste: LUTTEURS.filter((l) => l.nation === n.id).sort((a, b) => rangBase(a) - rangBase(b)) }));
  }
  if (tri === 'niveau') {
    return [...NIVEAUX].reverse().map((niv) => ({
      titre: NOM_RARETE[niv],
      liste: LUTTEURS.filter((l) => (possede(collection, l.id) ? niveauDe(l.id) : l.rarete) === niv),
    })).filter((g) => g.liste.length);
  }
  if (tri === 'fusions') {
    const miens = LUTTEURS.filter((l) => possede(collection, l.id))
      .sort((a, b) => nbFusions(collection, b.id) - nbFusions(collection, a.id) || rangBase(a) - rangBase(b));
    const autres = LUTTEURS.filter((l) => !possede(collection, l.id));
    return [{ titre: 'Les plus fusionnées', liste: miens }, { titre: 'À gagner', liste: autres }].filter((g) => g.liste.length);
  }
  return ORDRE_RARETE.map((r) => ({ titre: NOM_RARETE[r], liste: LUTTEURS.filter((l) => l.rarete === r) }));
}

function ecranCollection() {
  partie = null;
  const groupes = groupesCollection().map(({ titre, liste, replie }) => {
    const n = liste.filter((l) => possede(collection, l.id)).length;
    // Les cartes possédées d'abord, celles à gagner ensuite (l'ordre du tri est gardé dans chaque partie).
    const aGagner = liste.filter((l) => !possede(collection, l.id));
    const triees = [...liste.filter((l) => possede(collection, l.id)), ...(replie ? [] : aGagner)];
    const cartes = triees.map((l) => miniCarteCollection(l)).join('');
    const bouton = !aGagner.length || titre === 'À gagner' ? ''
      : `<button class="lien voir-plus" data-voir="${titre}">${replie ? `Voir plus (${aGagner.length} à gagner)` : 'Voir moins'}</button>`;
    return `<section class="groupe"><h2>${titre} <small>${n}/${liste.length}</small></h2><div class="grille-mini miniatures">${cartes}</div>${bouton}</section>`;
  }).join('');
  const tris = TRIS.map((t) => `<button class="puce ${collection.tri === t.id ? 'actif' : ''}" data-tri="${t.id}" aria-pressed="${collection.tri === t.id}">${t.nom}</button>`).join('');
  app.innerHTML = `
    <main class="galerie">
      ${enTete('Collection', compteur())}
      <p class="note marge">Touche une de tes cartes pour régler ses actions ou la fusionner. Boosters : classique (3 cartes) ou rare (5 cartes, 1 fois sur 4). Les communes sortent plus souvent que les légendaires.</p>
      <nav class="puces tri" aria-label="Trier la collection"><span>Trier par</span>${tris}</nav>
      ${groupes}
      <section class="groupe reglages">
        <h2>Réglages de test</h2>
        <p class="note">Tu as ${collection.medailles} médaille${collection.medailles > 1 ? 's' : ''} et ${collection.dollars} $.</p>
        <div class="boutons-test">
          <button class="secondaire" data-medailles-test>+10 médailles (test)</button>
          <button class="secondaire" data-dollars-test>+50 $ (test)</button>
        </div>
        <button class="secondaire" data-booster-test>Ouvrir un booster (test)</button>
        <button class="secondaire" data-doubles-test>Doubles pour tout monter au maximum (test)</button>
        <button class="secondaire" data-test>${collection.toutDebloque ? 'Revenir à ma vraie collection' : 'Débloquer toutes les cartes (mode test)'}</button>
        <button class="lien" data-raz>Remettre la collection à zéro</button>
      </section>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-carte]').forEach((b) =>
    b.addEventListener('click', () => fenetreCarteCollection(trouverLutteur(b.dataset.carte!))),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-voir]').forEach((b) => b.addEventListener('click', () => {
    const y = window.scrollY;
    const t = b.dataset.voir!;
    if (groupesDeplies.has(t)) groupesDeplies.delete(t); else groupesDeplies.add(t);
    ecranCollection();
    window.scrollTo(0, y);
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-tri]').forEach((b) =>
    b.addEventListener('click', () => {
      collection.tri = b.dataset.tri as TriCollection;
      sauver(collection);
      ecranCollection();
    }),
  );
  // Test : des médailles comme si on les avait gagnées (10 $ par palier de 5, niveau de compte, Mon Club).
  app.querySelector('[data-medailles-test]')!.addEventListener('click', () => {
    const g = gagnerMedailles(collection, 10);
    sauver(collection);
    histoire({ type: 'etat' });
    ecranCollection();
    ouvrirFenetre(`<h2>+10 médailles</h2><p>Tu as maintenant ${collection.medailles} médailles${g.dollars ? `, et ${g.dollars} $ de paliers en plus` : ''} (niveau de compte ${niveauCompte(collection)}).</p><button class="principal" data-fermer>OK</button>`, true);
  });
  app.querySelector('[data-dollars-test]')!.addEventListener('click', () => {
    collection.dollars += 50;
    sauver(collection);
    ecranCollection();
    ouvrirFenetre(`<h2>+50 $</h2><p>Tu as maintenant ${collection.dollars} $.</p><button class="principal" data-fermer>OK</button>`, true);
  });
  app.querySelector('[data-test]')!.addEventListener('click', () => {
    collection.toutDebloque = !collection.toutDebloque;
    sauver(collection);
    ecranCollection();
  });
  app.querySelector('[data-doubles-test]')!.addEventListener('click', () => {
    const n = doublesPourMaximum(collection);
    sauver(collection);
    ecranCollection();
    ouvrirFenetre(`<h2>Doubles ajoutés</h2><p>${n ? `${n} doubles ajoutés : tu peux monter chacune de tes cartes jusqu'à Champion du Monde et lui donner toutes ses étoiles dans Fusion.` : 'Tes cartes ont déjà assez de doubles.'}</p>
      <a class="principal lien-bouton" href="#fusion" data-fermer>Aller à la fusion</a><button class="lien" data-fermer>Fermer</button>`, true);
  });
  app.querySelector('[data-booster-test]')!.addEventListener('click', () => {
    const b = ouvrirBooster(collection, Math.random);
    sauver(collection);
    revelerPaquet({ titre: 'Booster de test', boosters: [b], ouvert: false }, () => ecranCollection());
  });
  const raz = app.querySelector<HTMLButtonElement>('[data-raz]')!;
  raz.addEventListener('click', () => {
    if (!raz.dataset.confirme) {
      raz.dataset.confirme = '1';
      raz.textContent = 'Appuie encore pour tout effacer (cartes, grades, decks, victoires)';
      return;
    }
    const coach = collection.coach;
    collection = nouvelleCollection();
    collection.coach = coach;
    sauver(collection);
    ecranCollection();
  });
  activerReflets(app);
  window.scrollTo(0, 0);
}

// Petite carte pour la grille de la collection : portrait, nom, nation, grade, exemplaires.
function miniCarteCollection(l: DefLutteur): string {
  const a = possede(collection, l.id);
  const g = gradeDe(collection, l.id);
  const n = nbExemplaires(collection, l.id);
  const et = nbEtoiles(collection, l.id);
  const etoiles = et ? `<span class="mc-grade">★${et}</span>` : '';
  const niv = niveauDe(l.id);
  if (!a) {
    return `
      <div class="mini-carte verrouillee" data-rarete="${l.rarete}" aria-label="Carte ${NOM_RARETE[l.rarete].toLowerCase()} à gagner">
        <span class="mc-portrait">${portrait(l)}</span>
        <span class="mc-nom">${echap(l.nom)}</span>
        <span class="mc-bas">À gagner</span>
      </div>`;
  }
  return `
    <button class="mini-carte" data-rarete="${niv}" data-carte="${l.id}" aria-label="${echap(l.nom)}, ${NOM_RARETE[niv].toLowerCase()}${g > 1 ? ' (fusionnée)' : ''}, ${n} exemplaire${n > 1 ? 's' : ''} : voir et régler">
      <span class="mc-portrait">${portrait(l, niv)}</span>
      ${n > 1 ? `<span class="pastille nombre mc-nombre">×${n}</span>` : ''}
      <span class="mc-nom">${echap(l.nom)}</span>
      <span class="mc-bas">${echap(l.origine)} ${etoiles}</span>
    </button>`;
}

// Champion du Monde : choix du style de carte parmi ceux débloqués par les étoiles.
function blocStyles(def: DefLutteur): string {
  if (nbExemplaires(collection, def.id) === 0 || niveauDe(def.id) !== 'champion') return '';
  const n = nbStyles(collection, def.id);
  const choisi = styleDe(collection, def.id);
  const palier = etoilesPossibles(def) / R_.fusion.stylesCarte;
  const et = nbEtoiles(collection, def.id);
  const suite = n < R_.fusion.stylesCarte
    ? `Prochain style à ${Math.ceil(palier * (n + 1))} étoiles (tu en as ${et}).`
    : 'Tous les styles sont débloqués.';
  const boutons = STYLES_CARTE.map((nom, i) => i <= n
    ? `<button class="puce ${i === choisi ? 'actif' : ''}" data-style="${i}" aria-pressed="${i === choisi}">${nom}</button>`
    : `<button class="puce" disabled>🔒 ${nom}</button>`).join('');
  return `<div class="styles-carte"><p class="note">Style de la carte · ${n}/${R_.fusion.stylesCarte} débloqués. ${suite}</p><div class="puces">${boutons}</div></div>`;
}

function fenetreCarteCollection(def: DefLutteur) {
  const f = prochaineFusion(collection, def.id);
  const n = nbExemplaires(collection, def.id);
  const f2 = ouvrirFenetre(`
    <div class="fenetre-carte">${carteJoueur(def)}</div>
    <p class="note">${n > 0 ? `${n} exemplaire${n > 1 ? 's' : ''} · ${NOM_RARETE[niveauDe(def.id)]}${niveauDe(def.id) !== def.rarete ? ` (au départ ${NOM_RARETE[def.rarete].toLowerCase()})` : ''}` : 'Carte du mode test'}${f ? (f.doublesDispo >= f.doublesNecessaires ? ` · fusion possible (${f.type === 'grade' ? NOM_RARETE[f.niveau] : 'étoile'})` : ` · ${f.type === 'grade' ? NOM_RARETE[f.niveau] : 'étoile'} : ${f.doublesDispo}/${f.doublesNecessaires} doubles`) : ''}</p>
    ${blocStyles(def)}
    <div class="deck-boutons">
      <button class="principal" data-regler>Régler les actions</button>
      ${f ? `<a class="secondaire lien-bouton" href="#fusion" data-fermer>Aller à la fusion</a>` : ''}
      <button class="lien" data-fermer>Fermer</button>
    </div>`, true);
  activerReflets(f2);
  f2.querySelector('[data-regler]')!.addEventListener('click', () => fenetreDeck(def));
  f2.querySelectorAll<HTMLButtonElement>('button[data-style]').forEach((b) =>
    b.addEventListener('click', () => {
      collection.styles[def.id] = Number(b.dataset.style);
      sauver(collection);
      ecranCollection();
      fenetreCarteCollection(def);
    }),
  );
}

// ---------- Fusion ----------

function statsTexte(d: DefLutteur): string {
  return `Endurance ${d.enduranceMax} · force ${d.force} · récupération ${Math.round(d.recuperation * 100)} %`;
}

// Fragments de légende : chaque double d'une nation peut devenir un fragment de sa légendaire.
function sectionFragments(): string {
  const N = R_.collection.fragmentsPourLegendaire;
  const lignes = NATIONS.map((n) => {
    const leg = legendaireDe(n.id);
    if (!leg) return '';
    const frag = collection.fragments[n.id] ?? 0;
    // Le double proposé : celui de la nation qu'on a en plus grand nombre (jamais le dernier exemplaire).
    const double = LUTTEURS.filter((l) => l.nation === n.id && nbExemplaires(collection, l.id) >= 2)
      .sort((a, b) => nbExemplaires(collection, b.id) - nbExemplaires(collection, a.id))[0];
    if (!frag && !double) return '';
    return `<li class="fragment-ligne">
      <span class="vignette">${portrait(leg, 'legendaire')}</span>
      <span class="fusion-info"><b>${echap(n.nom)} · ${echap(leg.nom)}</b>
        <small>${frag}/${N} fragments${possede(collection, leg.id) ? ' · déjà dans ta collection (un exemplaire de plus)' : ''}</small>
        <span class="jauge"><i style="width:${Math.min(100, (frag / N) * 100)}%"></i></span></span>
      ${frag >= N
        ? `<button class="principal petit-bouton" data-legende="${n.id}">Débloquer</button>`
        : double ? `<button class="secondaire petit-bouton" data-fragment="${double.id}" title="Transformer un double de ${echap(double.nom)}">+1 fragment<small>${echap(double.nom.split(' ')[0])} ×${nbExemplaires(collection, double.id)}</small></button>` : ''}
    </li>`;
  }).join('');
  return `<section class="bloc"><h2>Fragments de légende</h2>
    <p>Transforme un double d'une nation en 1 fragment de sa légendaire. ${N} fragments la débloquent.</p>
    ${lignes ? `<ul class="fusion-liste">${lignes}</ul>` : '<p class="note">Il te faut des doubles pour gagner des fragments.</p>'}</section>`;
}

function ecranFusion(message = '') {
  partie = null;
  const miens = CARTES.filter((l) => nbExemplaires(collection, l.id) > 0)
    .sort((a, b) => {
      return Number(fusionPrete(collection, b.id)) - Number(fusionPrete(collection, a.id))
        || nbExemplaires(collection, b.id) - nbExemplaires(collection, a.id);
    });
  const lignes = miens.map((l) => {
    const f = prochaineFusion(collection, l.id);
    const niv = niveauDe(l.id);
    // Les 5 niveaux de Commune à Champion du Monde ; remplis jusqu'au niveau atteint.
    const rangAtteint = NIVEAUX.indexOf(niv);
    const etoiles = NIVEAUX.map((_, i) => `<i class="${i <= rangAtteint ? 'plein' : ''}"></i>`).join('');
    const pret = f && f.doublesDispo >= f.doublesNecessaires;
    const prog = f ? Math.min(100, (f.doublesDispo / f.doublesNecessaires) * 100) : 100;
    return `
      <li class="fusion-ligne ${pret ? 'pret' : ''}" data-rarete="${niv}">
        <span class="vignette">${portrait(l, niv)}</span>
        <span class="fusion-info">
          <b>${echap(l.nom)}</b>
          <span class="grades" aria-label="${NOM_RARETE[niv]}, niveau ${rangAtteint + 1} sur ${NIVEAUX.length}">${etoiles}<em>${NOM_RARETE[niv]}</em></span>
          <small>${f ? `${f.type === 'grade' ? `Vers ${NOM_RARETE[f.niveau]}` : `Étoile (★${nbEtoiles(collection, l.id)})`} : ${Math.min(f.doublesDispo, f.doublesNecessaires)}/${f.doublesNecessaires} double${f.doublesNecessaires > 1 ? 's' : ''}` : 'Maximum atteint : toutes les actions ont 3 étoiles'}</small>
          <span class="jauge"><i style="width:${prog}%"></i></span>
        </span>
        <button class="${pret ? 'principal' : 'secondaire'} petit-bouton" data-fusion="${l.id}" ${pret ? '' : 'disabled'}>${f?.type === 'etoile' ? 'Étoile' : 'Fusionner'}</button>
      </li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Fusion', 'Chaque fusion fait monter la carte d\'une rareté, jusqu\'à Champion du Monde. Il faut 2 exemplaires pour passer Rare, 3 pour Épique, 4 pour Légendaire, 5 pour Champion du Monde. Chaque niveau gagné : +5 % sur les stats (+10 % pour le 4e) et une action débloquée ; Champion du Monde, toutes les actions sont ouvertes. Ensuite, 5 doubles pour une étoile (−1 d\'endurance sur l\'action choisie, 3 par action) ; chaque quart des étoiles débloque un style de carte.')}
      ${message}
      ${miens.length ? `<ul class="fusion-liste">${lignes}</ul>` : '<p class="note marge">Tu n\'as encore aucune carte.</p>'}
      ${sectionFragments()}
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-fragment]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = enFragment(collection, b.dataset.fragment!);
      if (!erreur) sauver(collection);
      ecranFusion(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-legende]').forEach((b) =>
    b.addEventListener('click', () => {
      const nation = b.dataset.legende!;
      const erreur = debloquerLegendaire(collection, nation);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
      quete({ type: 'fragments' });
      ecranFusion();
      const leg = legendaireDe(nation)!;
      const f = ouvrirFenetre(`<h2 class="onomato rouge">LÉGENDE !</h2><div class="fenetre-carte eclat-fusion">${carteJoueur(leg)}</div>
        <p><b>${echap(leg.nom)}</b> rejoint ta collection.</p><button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-fusion]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.fusion!;
      if (prochaineFusion(collection, id)?.type === 'etoile') return fenetreEtoile(id);
      const def = trouverLutteur(id);
      const avant = defJoueur(def);
      const erreur = fusionner(collection, id);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
      quete({ type: 'fusion', etoile: false });
      histoire({ type: 'fusion', id });
      const apres = defJoueur(def);
      ecranFusion();
      const f = ouvrirFenetre(`
        <h2 class="onomato rouge">FUSION !</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(def)}</div>
        <p><b>${echap(def.nom)}</b> devient <b>${NOM_RARETE[niveauDe(id)]}</b> ! Nouvelle action débloquée : <b>${echap(nomLocal(def.nation, actionsDebloquees(def, gradeDe(collection, id)).slice(-1)[0] ?? def.actions[0]))}</b> (coût ${coutAction(defPossede(collection, id), actionsDebloquees(def, gradeDe(collection, id)).slice(-1)[0] ?? def.actions[0])}).</p>
        <p class="note">Avant : ${statsTexte(avant)}<br>Après : ${statsTexte(apres)}</p>
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  window.scrollTo(0, 0);
}

// Étoile (Champion du Monde) : choisir l'action dont le coût baisse de 1.
function fenetreEtoile(id: string) {
  const f = prochaineFusion(collection, id);
  if (!f || f.type !== 'etoile') return;
  const def = defPossede(collection, id);
  const et = etoilesDe(collection, id);
  const fe = ouvrirFenetre(`
    <h2>Étoile pour ${echap(def.nom)}</h2>
    <p>5 doubles pour une étoile : choisis l'action dont le coût baisse de 1 (3 étoiles maximum par action, coût minimum ${R_.fusion.coutMinimum}).</p>
    <div class="deck-liste">${def.actionsPossibles.map((a) => {
      const fam = ACTIONS[a].famille;
      const ok = f.actions.includes(a);
      const c = coutAction(def, a);
      return `
        <button class="deck-action" ${ok ? `data-etoile="${a}"` : 'disabled'}>
          <span class="ico f-${fam}">${ICONE[fam]}</span>
          <span class="a-nom">${echap(nomLocal(def.nation, a))} <span class="etoiles-action">${'★'.repeat(et[a] ?? 0)}${'☆'.repeat(R_.fusion.etoilesMaxParAction - (et[a] ?? 0))}</span></span>
          <span class="a-fr">${ok ? `Coût ${c} → ${Math.max(R_.fusion.coutMinimum, c - 1)}` : 'Déjà 3 étoiles'}</span>
          <span class="a-cout">${c}</span>
        </button>`;
    }).join('')}</div>
    <button class="lien" data-fermer>Annuler</button>`, true);
  fe.querySelectorAll<HTMLButtonElement>('[data-etoile]').forEach((b) =>
    b.addEventListener('click', () => {
      const a = b.dataset.etoile as IdAction;
      const stylesAvant = nbStyles(collection, id);
      const erreur = fusionner(collection, id, a);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
      quete({ type: 'fusion', etoile: true });
      ecranFusion();
      const nouveau = nbStyles(collection, id) > stylesAvant;
      const ok = ouvrirFenetre(`
        <h2 class="onomato rouge">${nouveau ? 'NOUVEAU STYLE !' : 'ÉTOILE !'}</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(trouverLutteur(id))}</div>
        <p><b>${echap(nomLocal(def.nation, a))}</b> coûte maintenant ${coutAction(defPossede(collection, id), a)} d'endurance.</p>
        ${nouveau ? `<p>Style débloqué : <b>${STYLES_CARTE[nbStyles(collection, id)]}</b>. Tu peux changer de style dans la Collection.</p>` : ''}
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(ok);
    }),
  );
}

// ---------- Tournois ----------

const CLE_TOURNOI = 'wbc-tournoi-v1';
let tournoi: Tournoi | null = chargerTournoi();
let paquetTournoi: Paquet | null = null;

function chargerTournoi(): Tournoi | null {
  try {
    const t = JSON.parse(localStorage.getItem(CLE_TOURNOI) ?? 'null');
    return t && (t.type === 'individuel' || t.type === 'competition' || t.type === 'equipe') ? t : null;
  } catch {
    return null;
  }
}

function sauverTournoi() {
  try {
    if (tournoi) localStorage.setItem(CLE_TOURNOI, JSON.stringify(tournoi));
    else localStorage.removeItem(CLE_TOURNOI);
  } catch { /* stockage indisponible : le tournoi vit seulement dans cette page */ }
}

// Bonus de nation d'une équipe, en clair.
function texteBonusNation(ids: string[]): string {
  const b = bonusNation(ids);
  if (!b.bonus) return `aucun (il faut ${Object.keys(R_.tournoi.equipe.bonusNation)[0]} lutteurs d'une même nation)`;
  const nom = NATIONS.find((n) => n.id === b.nation)?.nom ?? '';
  return `<b>+${Math.round(b.bonus * 100)} %</b> sur les statistiques de toute l'équipe (${b.nombre} lutteurs ${nom === 'USA' ? 'des USA' : `de ${nom}`})`;
}

// La carte de mes lutteurs (avec fusion et deck) ; celles de l'ordinateur sont les cartes de base.
const defTournoi = (id: string, moi: boolean) => (moi ? defJoueur(trouverLutteur(id)) : trouverLutteur(id));

function ecranTournois(message = '') {
  partie = null;
  const C = R_.tournoi.individuel;
  const Q = R_.tournoi.equipe;
  const niv = niveauClub(collection);
  const equipeOk = niv >= R_.club.niveauTournoiEquipe && collection.club.length >= Q.duels;
  const enCours = tournoi && !tournoi.recompense;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournois', 'Inscription en $, médailles à chaque combat gagné.')}
      ${porteMonnaie()}
      ${message}
      ${enCours ? `<section class="bloc reprise-tournoi"><h2>Tournoi en cours</h2><p>${NOM_TOURNOI[tournoi!.type]} : reprends là où tu t'es arrêté.</p><button class="principal" data-reprendre-tournoi>Reprendre</button></section>` : ''}
      <section class="bloc">
        <h2>Tournoi individuel <small>${C.inscription} $</small></h2>
        <p>Ton lutteur contre ${C.minimum - 1} à ${C.maximum - 1} adversaires, en double tableau : tu avances tant que tu gagnes ; une première défaite avant les 1/2 finales t'envoie dans le tableau des perdants ; une deuxième t'élimine. +${R_.tournoi.medaillesParCombatGagne} médaille par combat gagné.</p>
        <ul class="liste-regles gains">
          <li>🥇 1er : ${C.medailles[1]} médailles, ${C.dollars[1]} $ et un booster rare</li>
          <li>🥈 2e : ${C.medailles[2]} médailles et ${C.dollars[2]} $</li>
          <li>🥉 3e : ${C.medailles[3]} médailles et ${C.dollars[3]} $</li>
        </ul>
        <button class="principal" data-individuel ${enCours ? 'disabled' : ''}>Contre l'ordinateur</button>
        <button class="secondaire" disabled>En ligne · bientôt</button>
      </section>
      <section class="bloc">
        <h2>Tournoi par équipe <small>${Q.inscription} $</small></h2>
        <p>Tes 5 lutteurs de Mon Club contre 5 lutteurs d'un club adverse, un duel chacun. La première équipe à ${Q.victoiresPourGagner} victoires gagne : ${Q.medailles} médailles, ${Q.dollars} $ et un booster rare.</p>
        ${equipeOk ? '' : `<p class="alerte-douce">🔒 Il faut Mon Club au niveau ${R_.club.niveauTournoiEquipe} avec ${Q.duels} lutteurs (niveau actuel : ${niv || 'fermé'}, ${collection.club.length} lutteur${collection.club.length > 1 ? 's' : ''}).</p>`}
        <button class="principal" data-equipe ${equipeOk && !enCours ? '' : 'disabled'}>Contre l'ordinateur</button>
        <button class="secondaire" disabled>En ligne · bientôt</button>
      </section>
      <section class="bloc admin">
        <h2>Espace administrateur</h2>
        <p>Créer un tournoi individuel ouvert à tous les joueurs, en ligne.</p>
        <button class="secondaire" data-admin>Créer un tournoi</button>
      </section>
    </main>`;
  app.querySelector('[data-reprendre-tournoi]')?.addEventListener('click', ecranTournoiEnCours);
  app.querySelector('[data-individuel]')?.addEventListener('click', () => ecranInscriptionIndividuel(R_.tournoi.individuel.parDefaut));
  app.querySelector('[data-admin]')?.addEventListener('click', () => ecranCreationAdmin());
  app.querySelector('[data-equipe]')?.addEventListener('click', () => ecranInscriptionEquipe([...collection.club]));
  window.scrollTo(0, 0);
}

const NOM_TOURNOI: Record<Tournoi['type'], string> = { individuel: 'Tournoi individuel', competition: 'Compétition', equipe: 'Tournoi par équipe' };

function ecranInscriptionIndividuel(nombre: number) {
  const C = R_.tournoi.individuel;
  const n = nombreParticipants(nombre);
  const miens = [LUTTEUR_TEST, ...CARTES.filter((l) => possede(collection, l.id))]; // + Cocoach, lutteur de test
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi individuel', `Inscription ${C.inscription} $ (tu as ${collection.dollars} $)`, '#tournois')}
      <section class="bloc nombre-participants">
        <h2>Participants</h2>
        <div class="compteur">
          <button class="rond" data-moins ${n <= C.minimum ? 'disabled' : ''} aria-label="Un participant de moins">−</button>
          <b>${n}</b>
          <button class="rond" data-plus ${n >= C.maximum ? 'disabled' : ''} aria-label="Un participant de plus">+</button>
        </div>
        <p class="note">Toi et ${n - 1} lutteurs de l'ordinateur, de ${C.minimum} à ${C.maximum}. ${n === 8 ? 'Pas d\'exemption.' : `${(n <= 8 ? 8 : 16) - n} lutteur${(n <= 8 ? 8 : 16) - n > 1 ? 's' : ''} tiré${(n <= 8 ? 8 : 16) - n > 1 ? 's' : ''} au sort passe${(n <= 8 ? 8 : 16) - n > 1 ? 'nt' : ''} directement au tour suivant (exemption).`}</p>
      </section>
      <section class="bloc"><h2>Choisis ton lutteur</h2></section>
      <div class="liste-recrues marge">${miens.map((l) => `<button data-inscrire="${l.id}" aria-label="Inscrire ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>
    </main>`;
  app.querySelector('[data-moins]')?.addEventListener('click', () => ecranInscriptionIndividuel(n - 1));
  app.querySelector('[data-plus]')?.addEventListener('click', () => ecranInscriptionIndividuel(n + 1));
  app.querySelectorAll<HTMLButtonElement>('[data-inscrire]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = payerInscription(collection, 'individuel');
      if (erreur) return ecranTournois(`<p class="alerte">${echap(erreur)}</p>`);
      tournoi = creerIndividuel(b.dataset.inscrire!, n, nouvelleGraine());
      paquetTournoi = null;
      sauver(collection);
      sauverTournoi();
      ecranTournoiEnCours();
    }),
  );
}

// Création d'un tournoi par un administrateur : écran seulement visuel pour l'instant.
// Il fonctionnera avec les comptes en ligne (Firebase).
function ecranCreationAdmin(message = '') {
  const C = R_.tournoi.individuel;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Créer un tournoi', 'Réservé aux administrateurs', '#tournois')}
      ${message}
      <section class="bloc formulaire-admin">
        <label>Nom du tournoi<input type="text" value="Open de Saint-Barth" maxlength="40"></label>
        <label>Date et heure<input type="datetime-local"></label>
        <label>Joueurs au maximum
          <select>${Array.from({ length: C.maximum - C.minimum + 1 }, (_, i) => C.minimum + i).map((k) => `<option ${k === C.maximum ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Inscription<select><option>${C.inscription} $</option></select></label>
        <p class="note">Format : double tableau (tableau principal, tableau des perdants, petite finale). Gains : ${C.medailles[1]}, ${C.medailles[2]} et ${C.medailles[3]} médailles ; ${C.dollars[1]}, ${C.dollars[2]} et ${C.dollars[3]} $ ; booster rare au vainqueur.</p>
        <button class="principal" data-creer>Créer le tournoi</button>
      </section>
    </main>`;
  app.querySelector('[data-creer]')!.addEventListener('click', () =>
    ecranCreationAdmin('<p class="alerte-douce">Aperçu seulement : la création des tournois en ligne arrivera avec les comptes en ligne.</p>'));
  window.scrollTo(0, 0);
}

function ecranInscriptionEquipe(ordre: string[]) {
  const n = R_.tournoi.equipe.duels;
  const liste = ordre.slice(0, n).map((id, i) => {
    const l = trouverLutteur(id);
    return `<li class="ordre-ligne"><span class="ordre-n">${i + 1}</span><span class="vignette">${portrait(l, niveauDe(id))}</span>
      <span class="ordre-nom"><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[niveauDe(id)]}</small></span>
      <button class="rond" data-monter="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
      <button class="rond" data-descendre="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi par équipe', `Ordre des duels · inscription ${R_.tournoi.equipe.inscription} $ (tu as ${collection.dollars} $)`, '#tournois')}
      <section class="bloc"><p>Ton lutteur n°1 affronte leur n°1, etc. Place tes meilleurs où tu veux.</p>
        <p class="bonus-nation">🚩 Bonus de nation : ${texteBonusNation(ordre.slice(0, n))}</p>
        <p class="note">3 lutteurs d'une même nation : +5 % · 4 : +7 % · 5 : +10 %, pour toute l'équipe. Compose ton équipe dans Mon Club.</p>
        <ol class="ordre-liste">${liste}</ol>
        <button class="principal" data-valider-equipe>Inscrire mon équipe</button></section>
    </main>`;
  const echanger = (i: number, j: number) => {
    const o = [...ordre];
    [o[i], o[j]] = [o[j], o[i]];
    ecranInscriptionEquipe(o);
  };
  app.querySelectorAll<HTMLButtonElement>('[data-monter]').forEach((b) => b.addEventListener('click', () => echanger(Number(b.dataset.monter), Number(b.dataset.monter) - 1)));
  app.querySelectorAll<HTMLButtonElement>('[data-descendre]').forEach((b) => b.addEventListener('click', () => echanger(Number(b.dataset.descendre), Number(b.dataset.descendre) + 1)));
  app.querySelector('[data-valider-equipe]')!.addEventListener('click', () => {
    const erreur = payerInscription(collection, 'equipe');
    if (erreur) return ecranTournois(`<p class="alerte">${echap(erreur)}</p>`);
    tournoi = creerTournoiEquipe(ordre, nouvelleGraine());
    paquetTournoi = null;
    sauver(collection);
    sauverTournoi();
    ecranTournoiEnCours();
  });
  window.scrollTo(0, 0);
}

function ecranTournoiEnCours() {
  partie = null;
  if (!tournoi) return ecranTournois();
  if (tournoi.type === 'individuel') return ecranIndividuel(tournoi);
  if (tournoi.type === 'competition') return ecranCompetition(tournoi);
  return ecranEquipe(tournoi);
}

// Gains de fin : donnés une seule fois, puis montrés dans un booster.
function sectionFinTournoi(t: Tournoi, titre: string): string {
  if (!paquetTournoi) {
    const premiereFois = !t.recompense;
    const boosters = recompenserTournoi(collection, t, Math.random);
    if (premiereFois && t.type === 'individuel') histoire({ type: 'tournoiIndividuel', place: placesI(t).get(0) ?? 99, invaincu: joueurInvaincu(t) });
    if (premiereFois && t.type === 'individuel') quete({ type: 'tournoi', place: placesI(t).get(0) ?? 99 });
    if (premiereFois && t.type === 'individuel' && t.saison !== undefined) saison({ type: 'competition', palier: t.saison, place: placesI(t).get(0) ?? 99 });
    if (premiereFois && t.type === 'equipe') histoire({ type: 'tournoiEquipe', gagne: scoreEquipe(t)[0] >= R_.tournoi.equipe.victoiresPourGagner });
    sauver(collection);
    sauverTournoi();
    paquetTournoi = boosters.length ? { titre, boosters, ouvert: false } : null;
  }
  return paquetTournoi ? sectionPaquet(paquetTournoi) : '<section class="booster"><p>Pas de gain cette fois. Retente ta chance !</p></section>';
}

const textePlace = (pl: number) => (pl === 1 ? '🥇' : pl === 2 ? '🥈' : pl === 3 ? '🥉' : `${pl}e`);

function ecranIndividuel(t: Individuel) {
  const prochain = avancerI(t, (i) => defTournoi(t.lutteurs[i], i === 0), collection.niveau);
  sauverTournoi();
  const nom = (i: number | null) => (i === null ? '…' : i === 0 ? `<b class="moi">${echap(trouverLutteur(t.lutteurs[0]).nom)}</b>` : echap(trouverLutteur(t.lutteurs[i]).nom));
  const ligne = (m: MatchI) => {
    const k = t.matchs.indexOf(m);
    const v = m.vainqueur;
    const cote = (i: number | null) => `<span class="${v !== null ? (v === i ? 'gagnant' : 'perdant') : ''}">${nom(i)}</span>`;
    return `<li class="match ${m.a === 0 || m.b === 0 ? 'avec-moi' : ''} ${k === prochain ? 'prochain' : ''}">
      <small>${echap(nomMatch(m))}</small>${cote(m.a)}<i>contre</i>${cote(m.b)}${m.detail ? `<small class="detail">${echap(m.detail)}</small>` : ''}</li>`;
  };
  const visibles = (tab: MatchI['tableau']) => t.matchs.filter((m) => m.tableau === tab && !exemption(m));
  const ex = exemptes(t);
  const fin = finieI(t);
  const p = placesI(t);
  const maPlace = p.get(0);
  const classement = fin ? `<section class="bloc"><h2>Classement</h2><ol class="classement">${[...p.entries()].sort((x, y) => x[1] - y[1]).map(([i, pl]) => `<li class="${i === 0 ? 'moi' : ''}"><span class="place p${pl}">${textePlace(pl)}</span>${nom(i)}</li>`).join('')}</ol></section>` : '';
  const m = prochain !== null ? t.matchs[prochain] : null;
  const adversaire = m ? (m.a === 0 ? m.b : m.a) : null;
  // Tours du tableau des perdants renumérotés : un tour réglé seulement par des exemptions n'apparaît pas.
  const perdants = visibles('perdants');
  const toursP = [...new Set(perdants.map((x) => x.tour))].sort((x, y) => x - y);
  const nomMatch = (x: MatchI) => (x.tableau === 'perdants' && x.nom.startsWith('Tableau') ? `Tableau des perdants, tour ${toursP.indexOf(x.tour) + 1}` : x.nom);
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(t.nom ?? 'Tournoi individuel', fin ? `Terminé : tu finis ${maPlace === 1 ? '1er' : `${maPlace}e`}` : `${t.lutteurs.length} lutteurs · ton lutteur : ${echap(trouverLutteur(t.lutteurs[0]).nom)}`, '#tournois')}
      ${m ? `<section class="bloc prochain-combat"><h2>${echap(nomMatch(m))}</h2><p>${nom(0)} contre ${nom(adversaire)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto')}</section>` : ''}
      ${fin ? sectionFinTournoi(t, maPlace === 1 ? 'Tournoi individuel gagné' : 'Tournoi individuel') : ''}
      ${classement}
      <section class="bloc tableau-tournoi"><h2>Tableau principal</h2>
        ${ex.length ? `<p class="note">Exempté${ex.length > 1 ? 's' : ''} du premier tour : ${ex.map(nom).join(', ')}</p>` : ''}
        <ul class="matchs">${visibles('principal').map(ligne).join('')}</ul></section>
      <section class="bloc tableau-tournoi perdants"><h2>Tableau des perdants</h2>
        <p class="note">Une première défaite avant les 1/2 finales mène ici (côté A pour le haut du tableau, côté B pour le bas) ; une deuxième élimine. Le vainqueur de chaque côté affronte le perdant de la 1/2 finale opposée pour aller en petite finale : au mieux 3e.</p>
        <ul class="matchs">${perdants.length ? perdants.map(ligne).join('') : '<li class="match"><small>En attente des premiers perdants</small></li>'}</ul></section>
      <section class="bloc"><h2>Finales</h2><ul class="matchs">${visibles('finales').map(ligne).join('')}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  app.querySelector('[data-combattre]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.lutteurs[0], t.lutteurs[adversaire!]));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.lutteurs[0], t.lutteurs[adversaire!], true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

function ecranCompetition(c: Competition) {
  const prochain = avancer(c, (i) => defTournoi(c.lutteurs[i], i === 0), collection.niveau);
  sauverTournoi();
  const nom = (i: number | null) => (i === null ? '…' : i === 0 ? `<b class="moi">${echap(trouverLutteur(c.lutteurs[0]).nom)}</b>` : echap(trouverLutteur(c.lutteurs[i]).nom));
  const ligne = (k: CleMatch) => {
    const m = c.matchs[k];
    const v = m.vainqueur;
    const cote = (i: number | null) => `<span class="${v !== null ? (v === i ? 'gagnant' : 'perdant') : ''}">${nom(i)}</span>`;
    return `<li class="match ${m.a === 0 || m.b === 0 ? 'avec-moi' : ''} ${k === prochain ? 'prochain' : ''}">
      <small>${NOM_MATCH[k]}</small>${cote(m.a)}<i>contre</i>${cote(m.b)}${m.detail ? `<small class="detail">${echap(m.detail)}</small>` : ''}</li>`;
  };
  const tableau = (t: 0 | 1) => `
    <section class="bloc tableau-tournoi"><h2>Tableau ${t === 0 ? 'A' : 'B'}</h2>
      <p class="note">Qualifié d'office pour la 1/2 finale : ${nom(c.tableaux[t][0])}</p>
      <ul class="matchs">${ligne(t === 0 ? 'QA' : 'QB')}${ligne(t === 0 ? 'SA' : 'SB')}</ul></section>`;
  const fin = finie(c);
  const p = places(c);
  const classement = fin ? `<section class="bloc"><h2>Classement</h2><ol class="classement">${[...p.entries()].sort((x, y) => x[1] - y[1]).map(([i, pl]) => `<li class="${i === 0 ? 'moi' : ''}"><span class="place p${pl}">${pl === 1 ? '🥇' : pl === 2 ? '🥈' : pl === 3 ? '🥉' : `${pl}e`}</span>${nom(i)}</li>`).join('')}</ol></section>` : '';
  const maPlace = p.get(0);
  const adversaire = prochain ? (c.matchs[prochain].a === 0 ? c.matchs[prochain].b : c.matchs[prochain].a) : null;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Compétition', fin ? `Terminé : tu finis ${maPlace === 1 ? '1er' : `${maPlace}e`}` : `Ton lutteur : ${echap(trouverLutteur(c.lutteurs[0]).nom)}`, '#tournois')}
      ${prochain ? `<section class="bloc prochain-combat"><h2>${NOM_MATCH[prochain]}</h2><p>${nom(0)} contre ${nom(adversaire)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto')}</section>` : ''}
      ${fin ? sectionFinTournoi(c, maPlace === 1 ? 'Compétition gagnée' : 'Compétition') : ''}
      ${classement}
      ${tableau(0)}${tableau(1)}
      <section class="bloc"><h2>Repêchage et finales</h2><ul class="matchs">${(['R1', 'R2', 'F', 'R3'] as CleMatch[]).map(ligne).join('')}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  const combattre = (auto: boolean) => {
    const m = c.matchs[prochain!];
    lancerCombatTournoi(prochain!, c.lutteurs[0], c.lutteurs[m.a === 0 ? m.b! : m.a!], auto);
  };
  app.querySelector('[data-combattre]')?.addEventListener('click', () => combattre(false));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => combattre(true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

function ecranEquipe(t: TournoiEquipe) {
  const [moi, eux] = scoreEquipe(t);
  const prochain = prochainDuel(t);
  const fin = equipeFinie(t);
  const gagne = moi > eux;
  const duels = t.mes.map((id, i) => {
    const r = t.resultats[i];
    const a = trouverLutteur(id), b = trouverLutteur(t.leurs[i]);
    return `<li class="match avec-moi ${i === prochain ? 'prochain' : ''}"><small>Duel ${i + 1}</small>
      <span class="${r === true ? 'gagnant' : r === false ? 'perdant' : ''}"><b class="moi">${echap(a.nom)}</b></span><i>contre</i>
      <span class="${r === false ? 'gagnant' : r === true ? 'perdant' : ''}">${echap(b.nom)}</span>
      ${t.details[i] ? `<small class="detail">${echap(t.details[i])}</small>` : r === null && fin ? '<small class="detail">Pas joué</small>' : ''}</li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi par équipe', `Club de ${echap(collection.coach ?? '')} contre ${echap(t.nomAdverse)}`, '#tournois')}
      <section class="bloc score-equipe"><span>${moi}</span><i>–</i><span>${eux}</span></section>
      <section class="bloc"><p class="bonus-nation">🚩 Ton bonus de nation : ${texteBonusNation(t.mes)}</p>
        <p class="bonus-nation adverse">🚩 ${echap(t.nomAdverse)} : ${texteBonusNation(t.leurs)}</p></section>
      ${prochain !== null ? `<section class="bloc prochain-combat"><h2>Duel ${prochain + 1}</h2><p><b class="moi">${echap(trouverLutteur(t.mes[prochain]).nom)}</b> contre ${echap(trouverLutteur(t.leurs[prochain]).nom)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto')}</section>` : ''}
      ${fin ? sectionFinTournoi(t, gagne ? 'Tournoi par équipe gagné' : 'Tournoi par équipe') : ''}
      <section class="bloc"><h2>Les duels</h2><ul class="matchs">${duels}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  app.querySelector('[data-combattre]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.mes[prochain!], t.leurs[prochain!]));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.mes[prochain!], t.leurs[prochain!], true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

function allerAuxTournois() {
  if (location.hash === '#tournois') ecranTournois();
  else location.hash = '#tournois';
}

function brancherFinTournoi() {
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => paquetTournoi && revelerPaquet(paquetTournoi, ecranTournoiEnCours));
  app.querySelector('[data-terminer]')?.addEventListener('click', () => {
    tournoi = null;
    paquetTournoi = null;
    sauverTournoi();
    allerAuxTournois();
  });
  const ab = app.querySelector<HTMLButtonElement>('[data-abandonner-tournoi]');
  ab?.addEventListener('click', () => {
    if (!ab.dataset.confirme) {
      ab.dataset.confirme = '1';
      ab.textContent = 'Appuie encore : l\'inscription est perdue (les médailles gagnées restent)';
      return;
    }
    tournoi = null;
    paquetTournoi = null;
    sauverTournoi();
    allerAuxTournois();
  });
}

function lancerCombatTournoi(cle: CleMatch | number, idMoi: string, idLui: string, auto = false) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  // Tournoi par équipe : le bonus de nation de chaque équipe s'applique à ses lutteurs.
  const equipe = tournoi?.type === 'equipe' ? tournoi : null;
  const bMoi = equipe ? bonusNation(equipe.mes).bonus : 0;
  const bLui = equipe ? bonusNation(equipe.leurs).bonus : 0;
  bonusEnCours = equipe ? { moi: bMoi, lui: bLui } : null;
  const niveau = tournoi?.type === 'individuel' && typeof cle === 'number' ? niveauMatchI(tournoi, cle, collection.niveau) : collection.niveau;
  partie = new Partie(idMoi, idLui, nouvelleGraine(), niveau, avecBonus(defTournoi(idMoi, true), bMoi), [], false, avecBonus(defTournoi(idLui, false), bLui));
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  recompenseDonnee = true; // pas de récompense d'arène
  tuto = false;
  enTournoi = cle;
  interclubEnCours = false;
  demarrer(auto);
}

// Fin d'un combat du joueur dans un tournoi : on note le résultat, +1 médaille s'il gagne.
function finCombatTournoi(abandon: boolean) {
  const cle = enTournoi;
  enTournoi = null;
  bonusEnCours = null;
  if (!partie || !tournoi || cle === null) return ecranTournois();
  const e = partie.etat;
  const gagne = !abandon && e.vainqueur === HUMAIN;
  if (!abandon) queteCombat(e, tournoi.type === 'equipe' ? 'equipe' : 'tournoi', partie.niveau);
  const detail = abandon ? 'par abandon' : e.finPar === 'tombe' ? 'par tombé'
    : `${Math.max(e.joueurs[0].periodesGagnees, e.joueurs[1].periodesGagnees)} périodes à ${Math.min(e.joueurs[0].periodesGagnees, e.joueurs[1].periodesGagnees)}`;
  if (tournoi.type === 'individuel' && typeof cle === 'number') {
    const m = tournoi.matchs[cle];
    enregistrerI(tournoi, cle, gagne ? 0 : (m.a === 0 ? m.b! : m.a!), detail);
  } else if (tournoi.type === 'competition' && typeof cle === 'string') {
    const m = tournoi.matchs[cle];
    const lui = m.a === 0 ? m.b! : m.a!;
    enregistrer(tournoi, cle, gagne ? 0 : lui, detail);
  } else if (tournoi.type === 'equipe' && typeof cle === 'number') {
    enregistrerDuel(tournoi, cle, gagne, detail);
  }
  if (gagne) {
    gagnerCombatTournoi(collection, tournoi);
    histoire({ type: 'victoire', nation: trouverLutteur(partie.idOrdi).nation, niveau: partie.niveau, auto: combatEnAuto });
  }
  sauver(collection);
  sauverTournoi();
  const lutteur = e.joueurs[gagne ? HUMAIN : ORDI].def;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  partie = null;
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(lutteur)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(lutteur.nom)} gagne ${detail}.</p>
        ${combatEnAuto ? `<p class="hist">${texteAuto()}</p>` : ''}
        ${gagne ? `<p class="recap-gains">${ICONE_MEDAILLE}<b>+${R_.tournoi.medaillesParCombatGagne} médaille</b></p>` : ''}
      </section>
      <div class="fin-boutons"><button class="principal" data-suite-tournoi>Voir le tournoi</button></div>
      ${anciens ? `<section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>` : ''}
    </main>`;
  app.querySelector('[data-suite-tournoi]')!.addEventListener('click', ecranTournoiEnCours);
  window.scrollTo(0, 0);
}

// ---------- Mon Club ----------

function ecranMonClub(message = '') {
  partie = null;
  const K = R_.club;
  const niv = niveauClub(collection);
  if (!niv) {
    const pct2 = Math.min(100, (collection.medailles / K.medaillesOuverture) * 100);
    app.innerHTML = `
      <main class="sous-menu">
        ${enTete('Mon Club', 'Recrute tes lutteurs et forme ton équipe.')}
        ${porteMonnaie()}
        <section class="bloc">
          <h2>🔒 Club fermé</h2>
          <p>Mon Club s'ouvre à <b>${K.medaillesOuverture} médailles</b>. Tu en as ${collection.medailles}.</p>
          <div class="jauge-club" role="meter" aria-valuemin="0" aria-valuemax="${K.medaillesOuverture}" aria-valuenow="${collection.medailles}"><i style="width:${pct2}%"></i></div>
          <p>Gagne des combats : +1 médaille contre l'ordinateur, +2 en ligne.</p>
          <a class="principal lien-bouton" href="#combat">Aller combattre</a>
        </section>
      </main>`;
    window.scrollTo(0, 0);
    return;
  }
  const places = placesClub(collection);
  const suivant = medaillesNiveauSuivant(collection);
  const debutNiveau = K.medaillesOuverture + (niv - 1) * K.medaillesParNiveau;
  const progression = suivant === null ? 100 : ((collection.medailles - debutNiveau) / (suivant - debutNiveau)) * 100;
  const cases = Array.from({ length: K.niveauMax * K.placesParNiveau }, (_, i) => {
    const id = collection.club[i];
    if (id) {
      const l = trouverLutteur(id);
      return `<div class="club-place">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(id)]}`, '', niveauDe(id))}
        <button class="lien petit" data-liberer="${id}">Libérer la place</button></div>`;
    }
    if (i < places) return '<button class="place-vide" data-recruter>+ Recruter</button>';
    const nivPlace = Math.floor(i / K.placesParNiveau) + 1;
    return `<div class="place-vide place-verrou">🔒 Niveau ${nivPlace}</div>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Mon Club', `Club de ${echap(collection.coach ?? '')}`)}
      ${porteMonnaie()}
      ${message}
      <section class="bloc">
        <div class="club-niveau">
          <span class="club-blason" aria-hidden="true">${niv}</span>
          <b>Niveau ${niv}/${K.niveauMax} · ${collection.club.length}/${places} lutteur${places > 1 ? 's' : ''}</b>
          <div>
            <div class="jauge-club" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progression)}"><i style="width:${progression}%"></i></div>
            <small>${suivant === null ? 'Niveau maximum : le tournoi par équipe est ouvert.' : `Niveau ${niv + 1} à ${suivant} médailles (encore ${suivant - collection.medailles}).`}</small>
          </div>
        </div>
      </section>
      <section class="bloc">
        <h2>Mes lutteurs</h2>
        <p>Une place par niveau. Le lutteur reste utilisable partout : c'est seulement sa place dans l'équipe. Il faut un club de niveau ${K.niveauTournoiEquipe} (5 lutteurs) pour le tournoi par équipe.</p>
        <div class="club-places">${cases}</div>
      </section>
    </main>`;
  activerReflets(app);
  app.querySelectorAll<HTMLButtonElement>('[data-recruter]').forEach((b) => b.addEventListener('click', fenetreRecruter));
  app.querySelectorAll<HTMLButtonElement>('[data-liberer]').forEach((b) =>
    b.addEventListener('click', () => {
      libererPlace(collection, b.dataset.liberer!);
      sauver(collection);
      ecranMonClub();
    }),
  );
  window.scrollTo(0, 0);
}

function fenetreRecruter() {
  const libres = CARTES.filter((l) => possede(collection, l.id) && !collection.club.includes(l.id));
  const f = ouvrirFenetre(`
    <h2>Recruter un lutteur</h2>
    ${libres.length
      ? `<div class="liste-recrues">${libres.map((l) => `<button data-recrue="${l.id}" aria-label="Recruter ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>`
      : '<p>Tous tes lutteurs sont déjà dans ton club. Ouvre des boosters pour en avoir d\'autres.</p>'}
    <button class="lien" data-fermer>Annuler</button>`, true);
  f.querySelectorAll<HTMLButtonElement>('[data-recrue]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = recruter(collection, b.dataset.recrue!);
      fermerFenetre();
      if (!erreur) { sauver(collection); histoire({ type: 'recrutement' }); }
      ecranMonClub(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
}

// ---------- Social ----------

// Petite carte simple (portrait, nom, rareté) avec une ligne en dessous.
function miniCarteLutteur(l: DefLutteur, bas: string, attrs = '', niveau: NiveauCarte = l.rarete): string {
  return `
    <span class="mini-carte" data-rarete="${niveau}" ${attrs}>
      <span class="mc-portrait">${portrait(l)}</span>
      <span class="mc-nom">${echap(l.nom)}</span>
      <span class="mc-bas">${bas}</span>
    </span>`;
}

let echange: Echange | null = null;
let codeEchange = '';

function quitterEchange() {
  echange?.fermer();
  echange = null;
}

function ecranSocial(message = '') {
  partie = null;
  quitterEchange();
  const jour = jourDe();
  const offres = offresDuJour(jour).map((o, i) => {
    const donne = trouverLutteur(o.donne);
    const demande = trouverLutteur(o.demande);
    const fait = offreFaite(collection, jour, i);
    const doubles = nbExemplaires(collection, o.demande) - 1;
    const bouton = fait
      ? '<button class="secondaire petit-bouton" disabled>Fait</button>'
      : doubles > 0
        ? `<button class="principal petit-bouton" data-offre="${i}">Transférer</button>`
        : '<button class="secondaire petit-bouton" disabled>Pas de double</button>';
    return `
      <li class="offre ${fait ? 'faite' : ''}">
        <div class="offre-cartes">
          <div><small>Tu reçois</small>${miniCarteLutteur(donne, `${echap(donne.origine)} · ${NOM_RARETE[donne.rarete]}${possede(collection, donne.id) ? '' : ' · nouvelle'}`)}</div>
          <span class="offre-fleche" aria-hidden="true">⇄</span>
          <div><small>Contre ton double</small>${miniCarteLutteur(demande, doubles > 0 ? `Tu en as ${doubles} en trop` : 'Aucun double')}</div>
        </div>
        ${bouton}
      </li>`;
  }).join('');
  const amis = listeAmis(collection);
  const listeA = amis.length
    ? `<ul class="amis-liste">${amis.map((a) => `
        <li>
          <span class="avatar petit" aria-hidden="true">${echap(a.pseudo.slice(0, 1).toUpperCase())}</span>
          <span class="ami-info"><b>${echap(a.pseudo)}</b><small>${a.victoires} victoire${a.victoires > 1 ? 's' : ''} · ${a.defaites} défaite${a.defaites > 1 ? 's' : ''} · ${a.echanges} transfert${a.echanges > 1 ? 's' : ''}</small></span>
          <small class="ami-date">${new Date(a.vu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>
        </li>`).join('')}</ul>`
    : '<p class="note">Affronte un ami en ligne ou fais un transfert avec lui : il apparaîtra ici.</p>';
  const enLigne = acces() !== 'ailleurs';
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Social', 'Boutique de boosters, transferts de lutteurs et tes amis.')}
      ${porteMonnaie()}
      ${message}
      <section class="bloc boutique">
        <h2>Boutique</h2>
        <p>Achète des boosters avec tes $. Tu gagnes 10 $ toutes les 5 médailles.</p>
        <div class="boutique-offres">
          ${(['classique', 'rare'] as const).map((t) => {
            const prix = R_.economie.prixBooster[t];
            const ok = collection.dollars >= prix;
            return `<button class="boutique-offre" data-acheter="${t}" ${ok ? '' : 'disabled'} aria-label="Acheter un booster ${t} pour ${prix} dollars">
              ${visuelPaquet({ type: t, cartes: Array(R_.collection.boosters[t].cartes).fill(''), nouvelles: [] })}
              <span class="prix">${prix} $</span>
            </button>`;
          }).join('')}
        </div>
      </section>
      <section class="bloc boutique-champions">
        <h2>Champions du Monde <small>${R_.saison.prixChampion} $</small></h2>
        <p>Ces cartes ne sortent jamais des boosters : gagne-les en fin de saison sportive, ou achète-les ici (${R_.saison.prixChampion} $ l'exemplaire). Les doubles servent à leur donner des étoiles et des styles de carte.</p>
        <ul class="liste-champions">${CHAMPIONS.map((l) => {
          const n = nbExemplaires(collection, l.id);
          const ok = collection.dollars >= R_.saison.prixChampion;
          return `<li><span class="vignette">${portrait(l, 'champion')}</span>
            <span class="fusion-info"><b>${echap(l.nom)}</b><small>${echap(NATIONS.find((x) => x.id === l.nation)?.nom ?? '')} · ${n ? `${n} exemplaire${n > 1 ? 's' : ''}` : '🔒 verrouillée'}</small></span>
            <button class="${ok ? 'principal' : 'secondaire'} petit-bouton" data-champion="${l.id}" ${ok ? '' : 'disabled'}>${R_.saison.prixChampion} $</button></li>`;
        }).join('')}</ul>
      </section>
      <section class="bloc">
        <h2>Transfert de lutteur</h2>
        <p>3 offres par jour, chacune une fois : on te transfère un lutteur contre un de tes doubles de même rareté. Nouvelles offres demain.</p>
        <ul class="offres">${offres}</ul>
      </section>
      <section class="bloc">
        <h2>Transfert entre amis</h2>
        ${enLigne ? `
          <p>Ouvrez une salle de transfert : chacun propose un de ses doubles, le transfert se fait quand vous acceptez tous les deux.</p>
          <button class="principal" data-ouvrir-echange>Ouvrir une salle de transfert</button>
          <form class="rejoindre" data-rejoindre-echange>
            <label for="code-echange">Ou rejoins ton ami avec son code</label>
            <input id="code-echange" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD">
            <button class="secondaire" type="submit">Rejoindre</button>
          </form>`
        : `<p>Les transferts se font sur la version du jeu ouverte à tous.</p><a class="principal lien-bouton" href="${ADRESSE_PUBLIQUE}" target="_blank" rel="noopener">Ouvrir la version ouverte à tous</a>`}
      </section>
      <section class="bloc">
        <h2>Mes amis <small>${amis.length}</small></h2>
        ${listeA}
      </section>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-offre]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.offre);
      const o = offresDuJour(jour)[i];
      const erreur = accepterOffre(collection, jour, i);
      if (erreur) return ecranSocial(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
      ecranSocial();
      const f = ouvrirFenetre(`
        <h2 class="onomato rouge">TRANSFERT !</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(trouverLutteur(o.donne))}</div>
        <p>Tu as reçu <b>${echap(trouverLutteur(o.donne).nom)}</b> contre un double de ${echap(trouverLutteur(o.demande).nom)}.</p>
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-acheter]').forEach((b) =>
    b.addEventListener('click', () => {
      const r = acheterBooster(collection, b.dataset.acheter as 'classique' | 'rare', Math.random);
      if (typeof r === 'string') return ecranSocial(`<p class="alerte">${echap(r)}</p>`);
      sauver(collection);
      revelerPaquet({ titre: 'Booster acheté', boosters: [r], ouvert: false }, () => ecranSocial());
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-champion]').forEach((b) =>
    b.addEventListener('click', () => {
      const r = acheterChampion(collection, b.dataset.champion!);
      if (typeof r === 'string') return ecranSocial(`<p class="alerte">${echap(r)}</p>`);
      sauver(collection);
      revelerPaquet({ titre: 'Champion du Monde acheté', boosters: [r], ouvert: false }, () => ecranSocial());
    }),
  );
  app.querySelector('[data-ouvrir-echange]')?.addEventListener('click', () => ouvrirEchange(nouveauCode()));
  app.querySelector('[data-rejoindre-echange]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code-echange')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranSocial('<p class="alerte">Le code fait 4 lettres, sans chiffres.</p>');
    ouvrirEchange(code);
  });
  window.scrollTo(0, 0);
}

function ouvrirEchange(code: string) {
  quitterEchange();
  const perso = relaisPerso();
  const salle = acces() === 'local' && !perso ? salleLocale(`x${code}`) : salleRelais(`x${code}`, perso ? [perso] : RELAIS);
  codeEchange = code;
  echange = new Echange(salle, code, collection, () => sauver(collection));
  let signature = '';
  echange.surVue((v) => {
    const sig = JSON.stringify(v) + String(salle.connecte());
    if (sig === signature) return;
    signature = sig;
    ecranEchange(v, salle.connecte());
  });
}

function ecranEchange(v: VueEchange, connecte: boolean) {
  if (!echange) return;
  const mes = Object.entries(v.mesDoubles);
  const choix = mes.length
    ? mes.map(([id, n]) => {
        const l = trouverLutteur(id);
        return `<button class="choix-double ${v.monOffre === id ? 'pris' : ''}" data-proposer="${id}" aria-pressed="${v.monOffre === id}">${miniCarteLutteur(l, `${n} en trop`)}</button>`;
      }).join('')
    : '<p class="note">Tu n\'as aucun double pour l\'instant.</p>';
  const son = v.sonOffre ? trouverLutteur(v.sonOffre) : null;
  const ami = v.amiCoach ? `Coach ${v.amiCoach}` : 'Ton ami';
  let bouton = '';
  if (v.monOffre && son) {
    bouton = v.jaiAccepte
      ? `<button class="secondaire" data-annuler>${v.ilAccepte ? 'Échange en cours…' : `En attente de l'accord de ${echap(ami)} (annuler)`}</button>`
      : `<button class="principal" data-accepter>Accepter : ${echap(trouverLutteur(v.monOffre).nom)} contre ${echap(son.nom)}</button>`;
  }
  const dernier = v.dernier
    ? `<p class="succes">Échange réussi : tu as donné ${echap(trouverLutteur(v.dernier.donne).nom)} et reçu <b>${echap(trouverLutteur(v.dernier.recoit).nom)}</b>.</p>`
    : '';
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(`Transfert ${echap(codeEchange.toUpperCase())}`, '', '#social')}
      <p class="code-grand marge" aria-label="Code de la salle d'échange">${echap(codeEchange.toUpperCase())}</p>
      <p class="marge">${!connecte ? 'Connexion au relais…' : v.amiPresent ? `<b class="ok">${echap(ami)} est dans la salle.</b>` : 'Envoie ce code à ton ami : dans Social, il touche « Rejoindre » et tape le code.'}</p>
      ${dernier}
      <section class="bloc">
        <h2>${echap(ami)} propose</h2>
        ${son ? `<div class="offre-ami">${miniCarteLutteur(son, `${echap(son.origine)} · ${NOM_RARETE[son.rarete]}${possede(collection, son.id) ? '' : ' · nouvelle pour toi'}`)}${v.ilAccepte ? '<span class="pastille nouvelle">A accepté</span>' : ''}</div>` : `<p class="note">${v.amiPresent ? 'Il choisit une carte…' : 'En attente de ton ami.'}</p>`}
      </section>
      <section class="bloc">
        <h2>Tu proposes</h2>
        <div class="grille-mini">${choix}</div>
      </section>
      <div class="barre-bas">${bouton || `<p class="note">${v.monOffre ? 'En attente de la proposition de ton ami.' : 'Choisis le double que tu proposes.'}</p>`}<button class="lien" data-quitter-echange>Quitter la salle de transfert</button></div>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-proposer]').forEach((b) =>
    b.addEventListener('click', () => echange?.proposer(v.monOffre === b.dataset.proposer ? null : b.dataset.proposer!)),
  );
  app.querySelector('[data-accepter]')?.addEventListener('click', () => echange?.accepter());
  app.querySelector('[data-annuler]')?.addEventListener('click', () => echange?.annulerAccord());
  const sortir = (ev?: Event) => {
    ev?.preventDefault();
    quitterEchange();
    ecranSocial();
  };
  app.querySelector('[data-quitter-echange]')!.addEventListener('click', () => sortir());
  app.querySelector('.retour')?.addEventListener('click', sortir);
}

// Combat d'arène : l'adversaire et le niveau de l'ordinateur viennent de la progression
// (ou du boss choisi pour une revanche).
function lancerArene(idHumain: string, auto = false) {
  if (bossChoisi) {
    const nation = bossChoisi;
    lancer(idHumain, adversairesDe(nation)[PAR_NATION - 1], nouvelleGraine(), false, 'fort', auto, { type: 'boss', nation });
    return;
  }
  const e = etapeArene(collection);
  if (!e.adversaire) return ecranArene();
  lancer(idHumain, e.adversaire, nouvelleGraine(), false, e.niveau, auto, { type: 'progression' });
}

function lancer(idHumain: string, idOrdi: string, graine: number, rapide = false, niveau: Niveau = collection.niveau, auto = false, ctx: typeof areneCtx = null, interclub = false) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  // Mode Enchaînement : à l'essai, seulement en combat rapide (pas en interclub ni en arène).
  const ench = rapide && !interclub && !ctx && enchainementChoisi;
  partie = new Partie(idHumain, idOrdi, graine, niveau, avecDeck(defPossede(collection, idHumain), deckDe(collection, idHumain)), [], rapide, undefined, ench);
  sequenceHumain = [];
  areneCtx = ctx;
  interclubEnCours = interclub;
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  recompenseDonnee = false;
  paquetSolo = null;
  messageSolo = '';
  tuto = false;
  enTournoi = null;
  bonusEnCours = null;
  bonusCeCombat = rapide ? false : collection.bonusTutoriel;
  demarrer(auto);
}

// ---------- Combat automatique ----------

let combatEnAuto = false;
let interclubEnCours = false;
const quetesLigneComptees = new Set<string>(); // combats en ligne déjà comptés pour les quêtes // combat interclub de la saison sportive // le combat en cours (ou qui vient de finir) a été joué en automatique
const autoDispo = () => autoOuvert(niveauCompte(collection));

// Bouton « Combat auto » à côté d'un bouton de combat : actif à partir du niveau de compte 3.
function boutonAuto(attribut: string, valeur = ''): string {
  return autoDispo()
    ? `<button class="secondaire bouton-auto" ${attribut}${valeur ? `="${valeur}"` : ''}>⚡ Combat auto</button>`
    : `<button class="secondaire bouton-auto" disabled>🔒 Combat auto · niveau ${R_.auto.niveauCompteMin}</button>`;
}

function texteAuto(): string {
  const p = Math.round(chanceFortAuto(niveauCompte(collection)) * 100);
  const expert = partie && bonusAutoExpert(niveauCompte(collection), partie.niveau) ? ', avec le bonus de niveau 10+' : '';
  return `⚡ Combat joué en automatique${expert} (${p === 0 ? 'comme l\'ordinateur normal' : p === 100 ? 'comme l\'ordinateur fort' : `fort ${p} % du temps, normal sinon`}).`;
}

// Lance l'écran de combat, ou joue tout le combat d'un coup et montre directement la fin.
function demarrer(auto: boolean) {
  combatEnAuto = auto && autoDispo();
  if (!combatEnAuto || !partie) return ecranCombat();
  // Au-dessus du niveau 10, l'auto gagne environ 3 fois sur 4 contre l'ordinateur.
  const bonus = bonusAutoExpert(niveauCompte(collection), partie.niveau);
  if (bonus) {
    const [moi, lui] = partie.etat.joueurs;
    partie.etat = creerCombat(avecBonus(moi.def, bonus), lui.def, { rapide: partie.etat.rapide });
  }
  const r = combatAuto(partie.etat, partie.hasard.graine, [{ chanceFort: chanceFortAuto(niveauCompte(collection)) }, { niveau: partie.niveau }]);
  partie.etat = r.etat;
  tours = r.tours.map((t) => ({ avant: t.avant, choixHumain: t.choix[0], choixOrdi: t.choix[1], ordiAChange: false, lignes: t.lignes }));
  for (const t of tours) for (const l of t.lignes) {
    const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
    if (m) scoresPeriodes.push([Number(m[1]), Number(m[2])]);
  }
  ecranCombat();
}

// ---------- Règles et tutoriel ----------

function ecranRegles() {
  partie = null;
  app.innerHTML = `
    <main class="sous-menu regles">
      ${enTete('Règles', 'Le combat en quelques minutes', '#combat')}
      <div class="regles-corps">${reglesHTML()}</div>
      <a class="principal lien-bouton marge" href="#tutoriel">Essayer avec le tutoriel</a>
    </main>`;
  window.scrollTo(0, 0);
}

function illustrationsTuto() {
  const ex = (id: string) => trouverLutteur(id);
  const cartes = `<div class="tuto-illus">${(['europe', 'russie', 'usa-defenseur', 'usa'] as const)
    .map((id) => miniCarteLutteur(ex(id), NOM_RARETE[ex(id).rarete])).join('')}</div>`;
  const e = ex('europe');
  const fusion = `<div class="tuto-illus fusion-illus">
      ${miniCarteLutteur(e, 'Commune')}<span class="tuto-signe">+</span>${miniCarteLutteur(e, 'double')}
      <span class="tuto-signe">=</span>${miniCarteLutteur(e, 'Rare · +5 %', '', 'rare')}</div>`;
  const club = `<div class="tuto-illus">
      ${miniCarteLutteur(ex('japon'), 'ton double')}<span class="tuto-signe">⇄</span>${miniCarteLutteur(ex('afrique-explosif'), 'son double')}</div>`;
  return { cartes, fusion, club };
}

function ecranTutoriel(i = 0) {
  partie = null;
  tuto = false;
  const ecrans = ecransTutoriel(illustrationsTuto());
  const n = ecrans.length;
  const ec = ecrans[i];
  const points = ecrans.map((_, k) => `<span class="${k === i ? 'actif' : ''}"></span>`).join('');
  app.innerHTML = `
    <main class="sous-menu tuto">
      ${enTete('Tutoriel', `Étape ${i + 1} sur ${n + 1}`, '#combat')}
      <section class="bloc tuto-ecran">
        <h2>${ec.titre}</h2>
        ${ec.html}
      </section>
      <div class="tuto-points" aria-hidden="true">${points}<span></span></div>
      <div class="tuto-nav marge">
        ${i > 0 ? '<button class="secondaire" data-precedent>Précédent</button>' : '<span></span>'}
        ${i < n - 1
          ? '<button class="principal" data-suivant>Suivant</button>'
          : '<button class="principal" data-combat-guide>Jouer le combat guidé</button>'}
      </div>
    </main>`;
  activerReflets(app);
  app.querySelector('[data-precedent]')?.addEventListener('click', () => ecranTutoriel(i - 1));
  app.querySelector('[data-suivant]')?.addEventListener('click', () => ecranTutoriel(i + 1));
  app.querySelector('[data-combat-guide]')?.addEventListener('click', lancerTutoriel);
  window.scrollTo(0, 0);
}

function lancerTutoriel() {
  if (location.hash) history.replaceState(null, '', location.pathname);
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  partie = new Partie(
    TUTO_COMBAT.moi, TUTO_COMBAT.adversaire, TUTO_COMBAT.graine, 'normal',
    trouverLutteur(TUTO_COMBAT.moi), ETAPES_GUIDEES.map((e) => e.ordi),
  );
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  recompenseDonnee = true; // pas de récompense pour le combat guidé
  paquetSolo = null;
  messageSolo = '';
  tuto = true;
  enTournoi = null;
  bonusEnCours = null;
  bonusCeCombat = false;
  ecranCombat();
}

// Étape guidée du tour en cours (null quand le joueur joue librement).
function etapeGuidee(): EtapeGuidee | null {
  return tuto && partie?.scripte ? ETAPES_GUIDEES[partie.toursJoues] : null;
}

function bulleCoach(): string {
  if (!tuto || !partie) return '';
  const g = etapeGuidee();
  const texte = g ? g.texte : partie.toursJoues === ETAPES_GUIDEES.length ? TEXTE_LIBRE : TEXTE_LIBRE_SUITE;
  return `<div class="bulle-coach" role="status"><span class="bc-qui">Coach</span><p>${texte}</p></div>`;
}

// Pendant les tours guidés : seule l'action conseillée reste jouable.
function guiderBoutons(racine: ParentNode) {
  const g = etapeGuidee();
  if (!g) return;
  racine.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((b) => {
    const bon = b.dataset.action === g.conseil.action; // spéciale ou non : demandé ensuite
    b.disabled = !bon;
    b.classList.toggle('conseille', bon);
  });
}

function ecranFinTutoriel() {
  if (!partie) return;
  const e = partie.etat;
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  const score = scoresPeriodes[0] ?? [h.score, o.score];
  const gagne = e.termine ? e.vainqueur === HUMAIN : h.periodesGagnees > 0;
  tuto = false;
  partie = null;
  collection.bonusTutoriel = true;
  sauver(collection);
  quete({ type: 'tutoriel' });
  app.innerHTML = `
    <main class="sous-menu tuto">
      ${enTete('Tutoriel terminé', '', '#combat')}
      <section class="bloc tuto-ecran">
        <h2>${gagne ? 'Période gagnée !' : 'Période perdue, mais tu as compris le principe !'}</h2>
        <p class="tuto-score">${score[0]} - ${score[1]}</p>
        <p>Un vrai combat se joue en 3 périodes : gagne-en 2, ou fais un tombé. Sans le coach, tu ne verras pas le choix de l'adversaire : à toi de deviner son jeu.</p>
        <p><b>Bonus :</b> ta prochaine victoire dans l'arène rapporte 2 boosters en plus.</p>
        <p><b>Et maintenant ?</b> Le mode histoire te guide pas à pas. Première étape : ${echap(ETAPES[0].objectif.toLowerCase())}.</p>
      </section>
      <div class="fin-boutons marge">
        <a class="principal lien-bouton" href="#histoire">Commencer le mode histoire</a>
        <a class="secondaire lien-bouton" href="#arene">Combattre l'ordinateur</a>
        <a class="secondaire lien-bouton" href="#">Retour au menu</a>
      </div>
    </main>`;
  window.scrollTo(0, 0);
}

// ---------- Écran 2 : le combat ----------

function badges(e: EtatCombat, j: Joueur): string {
  const l = e.joueurs[j];
  const b: string[] = [];
  if (l.initiative) b.push('Initiative');
  if (l.bonusFeinte > 0) b.push(`Feinte : +${REGLES.bonusFeinte} (${l.bonusFeinte} tour${l.bonusFeinte > 1 ? 's' : ''})`);
  if (l.bonusEnchainement) b.push(`Enchaînement : +${REGLES.speciale.bonusEnchainementFeinte}`);
  if (l.malusPrecisionTours > 0) b.push(`Matraqué : −5 % (${l.malusPrecisionTours} tour${l.malusPrecisionTours > 1 ? 's' : ''})`);
  if (l.attaqueIncontrable) b.push('Attaque incontrable');
  if (l.derniereReussie === 'bras_tire') b.push(`Attaque −${REGLES.brasTire.reductionCout} d'endurance`);
  let serie = 0;
  for (let i = l.historique.length - 1; i >= 0 && l.historique[i].reussie; i--) serie++;
  const attaques = l.historique.slice(l.historique.length - serie).filter((h) => h.attaque).length;
  if (serie >= 2 && attaques >= 1) b.push(`Combo en vue (${serie}/3)`);
  if (l.toursSansAttaque === REGLES.pression.tours - 1) b.push('Passif : attaque ou contre !');
  if (l.toursSansEndurance > 0) b.push(`Épuisé : ${l.toursSansEndurance}/${REGLES.toursSansEnduranceAvantTombe}`);
  return b.map((t) => `<span class="badge">${echap(t)}</span>`).join('');
}

// Jauge d'endurance façon jeu de combat : la barre se vide vers l'extérieur, une trace claire
// montre ce qui vient d'être perdu, un repère marque le seuil de 50 (précision en baisse).
function barre(l: EtatLutteur, j: Joueur, coin: 'rouge' | 'bleu', etiquette: string): string {
  const max = l.def.enduranceMax;
  const cible = Math.max(0, (l.endurance / max) * 100);
  const depart = endurancesAvant ? Math.max(0, (endurancesAvant[j] / max) * 100) : cible;
  const repere = (50 / max) * 100;
  const chance = chanceReussite(precisionDe(l.endurance));
  const etatPrecision = chance >= 1 ? 'pleine' : chance >= 0.6 ? 'moyenne' : 'faible';
  return `
    <div class="endu ${coin}">
      <div class="endu-ligne">
        <span class="endu-qui">${etiquette}</span>
        <span class="endu-val"><b>${fmt(l.endurance)}</b><small>/${max}</small></span>
      </div>
      <div class="endu-barre ${etatPrecision}" role="meter" aria-label="Endurance ${etiquette}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${fmt(l.endurance)}">
        <div class="endu-trace" style="width:${Math.max(depart, cible)}%" data-cible="${cible}"></div>
        <div class="endu-rempli ${l.endurance < 50 ? 'bas' : ''}" style="width:${depart}%" data-cible="${cible}"></div>
        ${repere < 100 ? `<div class="endu-repere" style="${coin === 'bleu' ? 'right' : 'left'}:${repere}%" title="Sous 50, la précision baisse"></div>` : ''}
      </div>
      <span class="endu-precision ${etatPrecision}">Réussite ${pct(chance)}</span>
    </div>`;
}

// Chance de réussite d'une action pour le joueur, ce tour-ci (précision, matraquage, combos).
function chanceAction(e: EtatCombat, a: IdAction): number {
  const l = e.joueurs[HUMAIN];
  const attaque = ACTIONS[a].famille === 'attaque';
  if (attaque && l.derniereReussie === R_.combos.contreTemps.avant) return 1;
  if (a === 'tour_hanche' && l.def.force > e.joueurs[ORDI].def.force) return 1;
  const malus = attaque && l.malusPrecisionTours > 0 && a !== 'simple_jambe' ? R_.matraquage.malusPrecision : 0;
  return chanceReussite(precisionDe(l.endurance) - malus);
}

function boutonsActions(e: EtatCombat, mode: 'tour' | 'initiative'): string {
  const l = e.joueurs[HUMAIN];
  const jouables = actionsJouables(e, HUMAIN);
  // Second souffle : une fois par combat, sous 25 d'endurance.
  const souffle = mode === 'tour' && souffleDispo(e, HUMAIN) ? `
      <button class="action souffle" data-action="souffle" data-mode="${mode}">
        <span class="ico">${ICONE.souffle}</span>
        <span class="a-nom">Souffler</span>
        <span class="a-fr"><b class="a-effet">+${REGLES.souffle.gain} d'endurance · 1 fois par combat</b> · si l'adversaire attaque, +${REGLES.souffle.penalite} pour lui</span>
        <span class="a-cout">0</span>
      </button>` : '';
  if (jouables.length === 0) {
    return `<div class="grille">
      <button class="action lutte" data-action="lutte" data-mode="${mode}">
        <span class="ico">${ICONE.lutte}</span>
        <span class="a-nom">Lutte</span>
        <span class="a-fr">Plus d'endurance : 1 chance sur 10 de marquer 1 ou 2 points</span>
        <span class="a-cout">0</span>
      </button>${souffle}</div>`;
  }
  // Action spéciale : pas de bouton à part ; l'action qui peut être jouée en spéciale brille, et le
  // jeu demande au moment du choix si on active la spéciale (voir demanderSpeciale).
  const normales = l.def.actions.map((a) => {
    const ok = jouables.includes(a);
    const f = ACTIONS[a].famille;
    const spe = f === l.def.familleSpeciale && peutJouerSpeciale(e, HUMAIN, a);
    const combo = ok ? comboPossible(e, HUMAIN, a) : null;
    const chance = chanceAction(e, a);
    const cout = coutDuTour(e, HUMAIN, a);
    const moinsCher = cout < coutAction(l.def, a);
    return `
      <button class="action ${spe ? 'peut-speciale' : ''} ${combo ? 'combo' : ''}" data-action="${a}" data-mode="${mode}" ${spe ? 'data-spe="1"' : ''} ${ok || spe ? '' : 'disabled'}>
        ${spe ? '<span class="badge-spe" aria-label="Action spéciale possible">★</span>' : ''}
        ${combo ? `<span class="badge-combo" title="${echap(combo)}">Combo !</span>` : ''}
        ${chance < 1 ? `<span class="a-chance ${chance >= 0.7 ? 'moyenne' : 'faible'}" title="Chance de réussite">${pct(chance)}</span>` : ''}
        <span class="ico f-${f}">${ICONE[f]}</span>
        <span class="a-nom">${echap(nomLocal(l.def.nation, a))}</span>
        <span class="a-fr">${nomLocal(l.def.nation, a) !== ACTIONS[a].nom ? `${echap(ACTIONS[a].nom)} · ` : ''}<b class="a-effet">${effetAction(a, { feinte: l.bonusFeinte > 0, enchainement: l.bonusEnchainement, combo: pointsCombo(l, a) })}</b></span>${combo ? `<span class="a-combo">${echap(combo)}</span>` : ''}
        <span class="a-cout ${moinsCher ? 'moins-cher' : ''}">−${fmt(cout)}</span>
      </button>`;
  }).join('');
  return `<div class="grille">${normales}${souffle}</div>`;
}

function classeLigne(ligne: string, e: EtatCombat): string {
  const nomH = e.joueurs[HUMAIN].def.nom;
  const nomO = e.joueurs[ORDI].def.nom;
  if (/TOMBÉ|Fin du combat/.test(ligne)) return 'fort';
  if (/^Période \d gagnée/.test(ligne)) return 'periode';
  if (/ marque \d/.test(ligne)) return ligne.startsWith(nomH) ? 'pts rouge' : ligne.startsWith(nomO) ? 'pts bleu' : 'pts';
  return '';
}

// Le mot qui s'affiche en grand dans la case, façon manga, selon ce qui s'est passé.
type Cote = 'rouge' | 'bleu' | 'neutre';
function onomatopee(t: TourJoue, e: EtatCombat): { texte: string; cote: Cote; fort: boolean } | null {
  const nh = e.joueurs[HUMAIN].def.nom;
  const no = e.joueurs[ORDI].def.nom;
  const de = (l: string): Cote =>
    l.startsWith(nh) || l.includes(`de ${nh} l'emporte`) ? 'rouge' : l.startsWith(no) || l.includes(`de ${no} l'emporte`) ? 'bleu' : 'neutre';
  const inverse = (c: Cote): Cote => (c === 'rouge' ? 'bleu' : c === 'bleu' ? 'rouge' : 'neutre');
  const L = t.lignes;
  const trouve = (re: RegExp) => L.find((l) => re.test(l));
  let l: string | undefined;
  if ((l = trouve(/: TOMBÉ\./))) return { texte: 'TOMBÉ !', cote: de(l), fort: true };
  if ((l = trouve(/^Combo « /))) return { texte: 'COMBO !', cote: l.includes(nh) ? 'rouge' : 'bleu', fort: true };
  if ((l = trouve(/reprend son souffle/))) return { texte: 'SECOND SOUFFLE', cote: de(l), fort: false };
  if ((l = trouve(/hors de la zone/))) return { texte: 'SORTIE !', cote: de(l), fort: false };
  if ((l = trouve(/se fait tomber/))) return { texte: 'TOMBÉ !', cote: inverse(de(l)), fort: true };
  if ((l = trouve(/il s'en sort/))) return { texte: 'SAUVÉ !', cote: inverse(de(l)), fort: true };
  if ((l = trouve(/renvoyés/))) return { texte: 'CONTRE !', cote: de(l), fort: true };
  if ((l = trouve(/perce /))) return { texte: 'PERCÉE !', cote: de(l), fort: true };
  if ((l = trouve(/à contretemps/))) return { texte: 'CONTRE !', cote: de(l), fort: true };
  if ((l = trouve(/renversement/))) return { texte: 'RENVERSEMENT !', cote: de(l), fort: true };
  const nomsAttaque = Object.values(ACTIONS).filter((a) => a.famille === 'attaque').map((a) => a.nom);
  for (const ligne of L) {
    const m = ligne.match(/ marque (\d+) points? \((.+)\)\.$/);
    if (m && nomsAttaque.includes(m[2])) {
      const pts = Number(m[1]);
      return { texte: pts >= 5 ? 'PROJECTION !' : 'AMENÉE !', cote: de(ligne), fort: pts >= 4 };
    }
    if (m && /enchaînement/.test(m[2])) {
      return { texte: 'ENCHAÎNEMENT !', cote: de(ligne), fort: true };
    }
  }
  if ((l = trouve(/marque \d+ points? \(Sprawl\)/))) return { texte: 'SPRAWL !', cote: de(l), fort: false };
  if ((l = trouve(/glisse/))) return { texte: 'GLISSADE !', cote: de(l), fort: false };
  if ((l = trouve(/passivité adverse/))) return { texte: 'PASSIVITÉ !', cote: de(l), fort: false };
  if ((l = trouve(/marque \d+ points? \(Lutte\)/))) return { texte: 'ÇA PASSE !', cote: de(l), fort: false };
  if ((l = trouve(/^Combo pour/))) return { texte: 'COMBO !', cote: l.includes(nh) ? 'rouge' : 'bleu', fort: false };
  if ((l = trouve(/est dissipée/))) return { texte: 'DISSIPÉE !', cote: de(l), fort: false };
  if ((l = trouve(/sur la feinte\./))) return { texte: 'FEINTE !', cote: inverse(de(l)), fort: false };
  if ((l = trouve(/La défense de .* l'emporte/))) return { texte: 'BLOQUÉ !', cote: de(l), fort: false };
  if ((l = trouve(/La feinte de .* l'emporte/))) return { texte: 'FEINTE !', cote: de(l), fort: false };
  if ((l = trouve(/Le contre de .* l'emporte/))) return { texte: 'CONTRE !', cote: de(l), fort: false };
  if ((l = trouve(/a au moins le double d'endurance/))) return { texte: 'PLUS FORT !', cote: de(l), fort: false };
  if ((l = trouve(/tente un tombé, sans succès/))) return { texte: 'RATÉ !', cote: inverse(de(l)), fort: false };
  if (trouve(/personne ne marque/)) return { texte: 'BLOCAGE', cote: 'neutre', fort: false };
  if (L.filter((x) => /rate son action/.test(x)).length >= 1) return { texte: 'DANS LE VENT…', cote: 'neutre', fort: false };
  if (trouve(/lutte sans résultat/)) return { texte: 'LUTTE…', cote: 'neutre', fort: false };
  return null;
}

function miniCarte(c: Choix, def: DefLutteur, coin: 'rouge' | 'bleu', delai: number): string {
  const lib = libelleAction(def.nation, c.action);
  const f = famille(c.action);
  return `
    <div class="mini ${coin} ${c.speciale ? 'speciale' : ''}" style="--delai:${delai}ms">
      <span class="mini-ico f-${f}">${ICONE[f]}</span>
      <b>${c.speciale ? '★ ' : ''}${echap(lib.local)}</b>
      <small>${echap(lib.fr)}${legendeFamille(f)}</small>
    </div>`;
}

function htmlDuel(choixH: Choix, choixO: Choix, e: EtatCombat): string {
  return `<div class="duel-mini">${miniCarte(choixH, e.joueurs[HUMAIN].def, 'rouge', 0)}<span class="contre-mot">contre</span>${miniCarte(choixO, e.joueurs[ORDI].def, 'bleu', 140)}</div>`;
}

function lignesTour(t: TourJoue, e: EtatCombat): string {
  const [, ...reste] = t.lignes;
  return `
    ${t.ordiAChange ? '<li>L\'ordinateur avait l\'initiative : il a vu deux de tes actions possibles et a changé la sienne.</li>' : ''}
    ${reste.map((l) => `<li class="${classeLigne(l, e)}">${echap(l)}</li>`).join('')}`;
}

const titreTour = (t: TourJoue) => (t.lignes[0] ?? '').replace(/ :.*$/, '');

// Un tour dans la liste « combat tour par tour » de l'écran de fin.
function htmlTourAncien(t: TourJoue, e: EtatCombat): string {
  const h = libelleAction(e.joueurs[HUMAIN].def.nation, t.choixHumain.action);
  const o = libelleAction(e.joueurs[ORDI].def.nation, t.choixOrdi.action);
  return `
    <article class="tour">
      <h3>${echap(titreTour(t))} : <span class="rouge">${t.choixHumain.speciale ? '★ ' : ''}${echap(h.local)}</span> contre <span class="bleu">${t.choixOrdi.speciale ? '★ ' : ''}${echap(o.local)}</span></h3>
      <ul>${lignesTour(t, e)}</ul>
    </article>`;
}

// ---------- Récapitulatif du combat, façon chat ----------
// Tout le détail des tours s'ouvre dans un panneau par-dessus l'écran : l'écran de combat tient
// ainsi sur une seule page, sans défiler. Le bouton montre le nombre de tours pas encore lus.
let chatOuvert = false;
let chatLus = 0;

function boutonChat(): string {
  if (tours.length < chatLus) chatLus = 0; // nouveau combat
  const nb = chatOuvert ? 0 : tours.length - chatLus;
  return `<button class="bouton-chat" data-chat aria-label="Récapitulatif du combat${nb ? ` (${nb} nouveau${nb > 1 ? 'x' : ''})` : ''}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
    Récap${nb ? `<span class="chat-nb">${nb}</span>` : ''}</button>`;
}

function filChat(e: EtatCombat): string {
  const nh = e.joueurs[HUMAIN].def.nom;
  const no = e.joueurs[ORDI].def.nom;
  // La bulle va du côté du lutteur dont le nom apparaît en premier dans la phrase.
  const cote = (l: string) => {
    const ih = l.indexOf(nh), io = l.indexOf(no);
    if (ih < 0 && io < 0) return 'neutre';
    return io < 0 || (ih >= 0 && ih <= io && !(nh.length < no.length && no.includes(nh) && ih === io)) ? 'moi' : 'lui';
  };
  return tours.map((t, i) => {
    const entete = t.sequence && t.sequence !== tours[i - 1]?.sequence ? `<p class="chat-seq">Séquence ${t.sequence}</p>` : '';
    const h = libelleAction(e.joueurs[HUMAIN].def.nation, t.choixHumain.action);
    const o = libelleAction(e.joueurs[ORDI].def.nation, t.choixOrdi.action);
    const lignes = [
      ...(t.ordiAChange ? [`${no} avait l'initiative : il a vu deux de tes actions possibles et a changé la sienne.`] : []),
      ...t.lignes.slice(1),
    ];
    return `${entete}
      <div class="chat-tour"><b>${echap(titreTour(t))}</b>
        <span><i class="rouge">${t.choixHumain.speciale ? '★ ' : ''}${echap(h.local)}</i> contre <i class="bleu">${t.choixOrdi.speciale ? '★ ' : ''}${echap(o.local)}</i></span></div>
      ${lignes.map((l) => `<p class="bulle-chat ${cote(l)} ${classeLigne(l, e)}">${echap(l)}</p>`).join('')}`;
  }).join('') || '<p class="chat-vide">Le récapitulatif des tours apparaîtra ici.</p>';
}

function panneauChat(e: EtatCombat): string {
  return `
    <div class="chat-voile ${chatOuvert ? 'ouvert' : ''}" data-chat-fermer></div>
    <aside class="chat ${chatOuvert ? 'ouvert' : ''}" aria-label="Récapitulatif du combat" ${chatOuvert ? '' : 'hidden'}>
      <header class="chat-tete"><b>Récapitulatif</b><button class="lien" data-chat-fermer>Fermer</button></header>
      <div class="chat-fil">${filChat(e)}</div>
    </aside>`;
}

function brancherChat() {
  const basculer = (ouvrir: boolean) => {
    chatOuvert = ouvrir;
    if (ouvrir) chatLus = tours.length;
    ecranCombat();
  };
  app.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => basculer(true)));
  app.querySelectorAll('[data-chat-fermer]').forEach((b) => b.addEventListener('click', () => basculer(false)));
  if (chatOuvert) {
    chatLus = tours.length;
    const fil = app.querySelector<HTMLElement>('.chat-fil');
    if (fil) fil.scrollTop = fil.scrollHeight;
  }
}

// ---------- Mode Enchaînement (à l'essai, combat rapide) ----------
// Le joueur compose sa séquence de 3 actions en touchant les boutons dans l'ordre ; une case
// remplie se retire d'un toucher (avec celles qui suivent). Puis les 3 duels se révèlent.
let enchainementChoisi = false; // case cochée sur l'écran du combat rapide
let sequenceHumain: Choix[] = [];

// La dernière séquence jouée, retrouvée dans la liste des tours (contre l'ordinateur ou en ligne).
function sequenceAffichee(): SequenceJouee | null {
  const der = tours[tours.length - 1];
  if (!der?.sequence) return null;
  const ts = tours.filter((t) => t.sequence === der.sequence);
  return { tours: ts, rupture: ts[ts.length - 1].rupture ?? null, ordiAChange: ts.some((t) => t.ordiAChange) };
}

function caseSequenceHTML(e: EtatCombat, c: Choix | undefined, k: number): string {
  if (!c) return `<span class="seq-case vide">${k + 1}</span>`;
  const lib = libelleAction(e.joueurs[HUMAIN].def.nation, c.action);
  const f = famille(c.action);
  const cout = c.action === 'lutte' || c.action === 'souffle' ? 0 : coutALaPlace(e, HUMAIN, sequenceHumain.slice(0, k), c);
  return `<button class="seq-case pleine ${c.speciale ? 'speciale' : ''}" data-retirer="${k}" aria-label="Retirer ${echap(lib.local)}">
    <small>${k + 1}</small><span class="ico f-${f}">${ICONE[f]}</span><b>${c.speciale ? '★ ' : ''}${echap(lib.local)}</b><i>−${fmt(cout)}</i></button>`;
}

function paveSequence(e: EtatCombat): string {
  const l = e.joueurs[HUMAIN];
  const seq = sequenceHumain;
  const plein = seq.length >= TAILLE_SEQUENCE;
  const cases = Array.from({ length: TAILLE_SEQUENCE }, (_, k) => caseSequenceHTML(e, seq[k], k)).join('');
  const reste = enduranceApres(e, HUMAIN, seq);
  let boutons = '';
  if (!plein) {
    const ok = actionsAjoutables(e, HUMAIN, seq);
    const souffle = souffleAjoutable(e, HUMAIN, seq);
    if (!ok.length && !souffle) {
      boutons = `<div class="grille"><button class="action lutte" data-action="lutte" data-mode="sequence">
        <span class="ico">${ICONE.lutte}</span><span class="a-nom">Lutte</span>
        <span class="a-fr">Plus de quoi payer une action : 1 chance sur 10 de marquer</span><span class="a-cout">0</span></button></div>`;
    } else {
      boutons = `<div class="grille">${l.def.actions.map((a) => {
        const f = ACTIONS[a].famille;
        const spe = f === l.def.familleSpeciale && speciaux(e, HUMAIN, seq, a);
        return `<button class="action ${spe ? 'peut-speciale' : ''}" data-action="${a}" data-mode="sequence" ${spe ? 'data-spe="1"' : ''} ${ok.includes(a) || spe ? '' : 'disabled'}>
          ${spe ? '<span class="badge-spe" aria-label="Action spéciale possible">★</span>' : ''}
          <span class="ico f-${f}">${ICONE[f]}</span>
          <span class="a-nom">${echap(nomLocal(l.def.nation, a))}</span>
          <span class="a-fr"><b class="a-effet">${effetAction(a)}</b></span>
          <span class="a-cout">−${fmt(coutAction(l.def, a))}</span></button>`;
      }).join('')}${souffle ? `<button class="action souffle" data-action="souffle" data-mode="sequence">
          <span class="ico">${ICONE.souffle}</span><span class="a-nom">Souffler</span>
          <span class="a-fr"><b class="a-effet">+${R_.souffle.gain} d'endurance · 1 fois par combat</b></span><span class="a-cout">0</span></button>` : ''}</div>`;
    }
  }
  return `
    <div class="seq-cases" aria-label="Ta séquence">${cases}</div>
    <p class="seq-info">${plein ? 'Séquence prête.' : `Choisis l'action ${seq.length + 1} sur ${TAILLE_SEQUENCE}.`} Endurance après la séquence : <b>${fmt(Math.max(0, reste))}</b>${seq.length ? ' · touche une case pour la retirer' : ''}</p>
    ${boutons}
    ${plein ? '<button class="principal" data-valider-seq>Valider la séquence</button>' : ''}`;
}

function brancherSequence() {
  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="sequence"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, (c) => {
      if (sequenceHumain.length >= TAILLE_SEQUENCE) return;
      sequenceHumain = [...sequenceHumain, c];
      ecranCombat();
    })),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-retirer]').forEach((b) =>
    b.addEventListener('click', () => {
      sequenceHumain = sequenceHumain.slice(0, Number(b.dataset.retirer));
      ecranCombat();
    }),
  );
  app.querySelector('[data-valider-seq]')?.addEventListener('click', validerSequenceHumain);
}

function validerSequenceHumain() {
  if (mode === 'ligne') {
    const e = vueLigne?.etat;
    if (!e || !vueLigne?.aChoisir || validerSequence(e, HUMAIN, sequenceHumain)) return;
    void duel?.jouerSequence(sequenceHumain);
    sequenceHumain = [];
    ecranCombat();
    return;
  }
  if (!partie || enAttente) return;
  const erreur = validerSequence(partie.etat, HUMAIN, sequenceHumain);
  if (erreur) {
    sequenceHumain = [];
    ecranCombat();
    return;
  }
  enAttente = true;
  const seqO = partie.sequenceOrdi();
  const vue = apercuSequence(partie.etat, HUMAIN, seqO);
  if (vue) return fenetreInitiativeSequence(seqO, vue);
  suiteSequence(sequenceHumain, seqO);
}

// Initiative : le joueur voit la dernière action de l'ordinateur et peut changer la sienne.
function fenetreInitiativeSequence(seqO: Choix[], vue: Choix) {
  fenetreDerniereAction(partie!.etat, sequenceHumain, vue, 'l\'ordinateur', (seq) => suiteSequence(seq, seqO));
}

// Fenêtre d'initiative du mode Enchaînement : la dernière action adverse, et le choix de garder
// ou de changer sa propre dernière action. `decider` reçoit la séquence finale.
function fenetreDerniereAction(e: EtatCombat, maSeq: Choix[], vue: Choix, qui: string, decider: (seq: Choix[]) => void) {
  const n = TAILLE_SEQUENCE - 1;
  const debut = maSeq.slice(0, n);
  const mien = maSeq[n];
  const libO = libelleAction(e.joueurs[ORDI].def.nation, vue.action);
  const fO = famille(vue.action);
  const libM = libelleAction(e.joueurs[HUMAIN].def.nation, mien.action);
  const ok = actionsAjoutables(e, HUMAIN, debut).filter((a) => a !== mien.action);
  const autres = ok.map((a) => {
    const f = ACTIONS[a].famille;
    return `<button class="action" data-autre="${a}"><span class="ico f-${f}">${ICONE[f]}</span>
      <span class="a-nom">${echap(nomLocal(e.joueurs[HUMAIN].def.nation, a))}</span>
      <span class="a-fr"><b class="a-effet">${effetAction(a)}</b></span><span class="a-cout">−${fmt(coutAction(e.joueurs[HUMAIN].def, a))}</span></button>`;
  }).join('');
  const f = ouvrirFenetre(`
    <h2>Initiative</h2>
    <p>La dernière action de ${qui} sera :</p>
    <ul class="apercu"><li class="bleu"><span class="ico f-${fO}">${ICONE[fO]}</span><b>${vue.speciale ? '★ ' : ''}${echap(libO.local)}</b> <small>${echap(libO.fr)}${legendeFamille(fO)}</small></li></ul>
    <button class="principal" data-garder>Garder ma dernière action : ${mien.speciale ? '★ ' : ''}${echap(libM.local)}</button>
    ${autres ? `<p class="ou">ou la changer pour :</p><div class="pave-fenetre"><div class="grille">${autres}</div></div>` : ''}`);
  f.querySelector('[data-garder]')!.addEventListener('click', () => decider(maSeq));
  f.querySelectorAll<HTMLButtonElement>('[data-autre]').forEach((b) =>
    b.addEventListener('click', () => decider([...debut, { action: b.dataset.autre as IdAction }])),
  );
}

function suiteSequence(seqH: Choix[], seqO: Choix[]) {
  if (!partie) return;
  const finale = partie.reactionSequenceOrdi(seqH, seqO);
  const change = finale[finale.length - 1].action !== seqO[seqO.length - 1].action;
  resoudreSequenceHumain(seqH, finale, change, []);
}

function resoudreSequenceHumain(seqH: Choix[], seqO: Choix[], change: boolean, faces: Face[]) {
  if (!partie) return;
  const r = partie.resoudreSequence(seqH, seqO, change, faces);
  if (r === 'pileOuFace') {
    const f = ouvrirFenetre(`
      <h2>Tentative de tombé !</h2>
      <p>L'ordinateur est sur le point de te faire tomber pendant la séquence. Annonce pile ou face : si la pièce tombe sur ton annonce, tu t'en sors.</p>
      <div class="pile-face">
        <button class="principal" data-face="pile">Pile</button>
        <button class="principal" data-face="face">Face</button>
      </div>`);
    f.querySelectorAll<HTMLButtonElement>('[data-face]').forEach((b) =>
      b.addEventListener('click', () => resoudreSequenceHumain(seqH, seqO, change, [...faces, b.dataset.face as Face])),
    );
    return;
  }
  for (const t of r.tours) {
    tours.push(t);
    for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) scoresPeriodes.push([Number(m[1]), Number(m[2])]);
    }
  }
  sequenceHumain = [];
  fermerFenetre();
  enAttente = false;
  ecranCombat();
}

// La case de la dernière séquence : les duels se révèlent l'un après l'autre.
function caseSequence(e: EtatCombat, s: SequenceJouee): string {
  const dh = e.joueurs[HUMAIN].def;
  const dO = e.joueurs[ORDI].def;
  const pas = 650;
  const lignes = s.tours.map((t, k) => {
    const ono = onomatopee(t, e);
    return `
      <div class="seq-duel" style="--delai:${k * pas}ms">
        <span class="seq-num">${k + 1}</span>
        ${miniCarte(t.choixHumain, dh, 'rouge', k * pas)}
        <span class="seq-mot ${ono?.cote ?? 'neutre'}">${ono?.texte ?? '—'}</span>
        ${miniCarte(t.choixOrdi, dO, 'bleu', k * pas + 120)}
      </div>`;
  }).join('');
  const pts = s.tours.flatMap((t) => t.lignes).filter((l) => / marque \d/.test(l))
    .map((l) => `<li class="${classeLigne(l, e)}">${echap(l.replace(/ \(.*\)\.$/, ''))}</li>`).join('');
  const fin = s.tours.length * pas;
  const num = s.tours[0]?.sequence ?? 0;
  return `
    <section class="case case-seq" aria-live="polite">
      <div class="case-tete"><h3>Séquence ${num}${s.ordiAChange ? ' · l\'ordinateur a changé sa dernière action' : ''}</h3>${boutonChat()}</div>
      <div class="seq-duels">${lignes}</div>
      ${s.rupture ? `<p class="onomato ${s.rupture.par === HUMAIN ? 'rouge' : 'bleu'} seq-brisee" style="animation-delay:${fin}ms">CHAÎNE BRISÉE !</p>` : ''}
      ${pts ? `<ul class="case-points" style="animation-delay:${fin}ms">${pts}</ul>` : ''}
    </section>`;
}

// La case du dernier tour : les deux actions se révèlent, puis le mot du résultat.
function caseDernierTour(e: EtatCombat): string {
  const seqVue = e.enchainement ? sequenceAffichee() : null;
  if (seqVue) return caseSequence(e, seqVue);
  const t = tours[tours.length - 1];
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  if (!t) {
    return `
      <section class="case face-a-face">
        <div class="vs-portrait rouge">${portrait(h.def)}<span>Toi</span></div>
        <span class="vs">VS</span>
        <div class="vs-portrait bleu">${portrait(o.def)}<span>${adv()}</span></div>
        <p class="case-aide">${e.enchainement
          ? `Compose en bas ta séquence de ${TAILLE_SEQUENCE} actions, dans l'ordre. ${mode === 'ligne' ? 'Ton ami' : 'L\'ordinateur'} fait de même en secret ; les actions sont comparées une à une. Un contre réussi à la 1re action brise la chaîne ; un matraquage réussi à la 2e action peut annuler la dernière action adverse. L'action spéciale est possible dès le 2e tour, puis après 3 actions de recharge.`
          : `Choisis ton action en bas. ${mode === 'ligne' ? 'Ton ami' : 'L\'ordinateur'} choisit en même temps que toi, en secret. Sous 50 d'endurance, tes actions peuvent rater.`}</p>
      </section>`;
  }
  const ono = onomatopee(t, e);
  // Le détail du tour est dans le récapitulatif (chat) ; ici, seulement les points marqués.
  const pts = t.lignes.filter((l) => / marque \d/.test(l)).map((l) => `<li class="${classeLigne(l, e)}">${echap(l.replace(/ \(.*\)\.$/, ''))}</li>`).join('');
  return `
    <section class="case ${ono?.fort ? 'secoue' : ''}" aria-live="polite">
      ${ono?.fort ? '<div class="rayons" aria-hidden="true"></div>' : ''}
      <div class="case-tete"><h3>${echap(titreTour(t))}</h3>${boutonChat()}</div>
      ${htmlDuel(t.choixHumain, t.choixOrdi, e)}
      ${ono ? `<p class="onomato ${ono.cote}">${ono.texte}</p>` : ''}
      ${pts ? `<ul class="case-points">${pts}</ul>` : ''}
    </section>`;
}

function tableau(e: EtatCombat): string {
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  const pastilles = (n: number) =>
    Array.from({ length: REGLES.periodesPourGagner }, (_, i) => `<i class="${i < n ? 'pleine' : ''}"></i>`).join('');
  const historique = scoresPeriodes.length
    ? `<span class="hist">${scoresPeriodes.map(([a, b], i) => `P${i + 1} ${a}-${b}`).join('  ')}</span>`
    : '';
  const coin = (l: EtatLutteur, c: 'rouge' | 'bleu', qui: string) => `
      <button class="coin ${c}" data-voir="${l.def.id}" aria-label="Voir la carte de ${echap(l.def.nom)}">
        <span class="coin-tete"><span class="vignette">${portrait(l.def)}</span><span class="qui">${qui}<br><small>${echap(l.def.nom)}</small></span></span>
        <span class="score">${l.score}</span>
        ${e.rapide ? '' : `<span class="periodes" aria-label="Périodes gagnées : ${l.periodesGagnees}">${pastilles(l.periodesGagnees)}</span>`}
      </button>`;
  return `
    <header class="tableau">
      ${coin(h, 'rouge', `${echap(moiNom())} ${pastilleNiveau(niveauCompte(collection))}`)}
      <div class="centre">
        ${e.rapide
          ? `<span class="per">${e.mortSubite ? '<b class="mort-subite">Mort subite</b>' : 'Combat <b>rapide</b>'}</span>
             <span class="trn">Tour <b>${e.tour}</b>${e.mortSubite ? '' : `/${toursPeriode(e)}`}</span>`
          : `<span class="per">Période <b>${e.periode}</b>/3</span>
             <span class="trn">Tour <b>${e.tour}</b>/${toursPeriode(e)}</span>`}
        ${historique}
        <span class="niv">${mode === 'ligne' ? 'Entre amis' : `Ordi ${niveauOrdi(partie?.niveau)}`}</span>
      </div>
      ${coin(o, 'bleu', `${echap(adv())} ${mode === 'ligne' ? pastilleNiveau(vueLigne?.amiNiveau) : ''}`)}
    </header>`;
}

function ecranCombat() {
  const e = etatEnCours();
  if (!e) return;
  const animer = tours.length !== toursAnimes;
  toursAnimes = tours.length;
  if (tuto && (e.termine || e.periode > 1)) return ecranFinTutoriel();
  if (enTournoi !== null && e.termine) return finCombatTournoi(false);
  if (e.termine) return mode === 'ligne' ? ecranFinLigne() : ecranFin();
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];

  app.innerHTML = `
    <main class="combat">
      <div class="haut-combat">
        ${tableau(e)}
        <section class="jauges" aria-label="Endurance">
          ${barre(h, HUMAIN, 'rouge', 'Toi')}
          <span class="jauges-vs" aria-hidden="true">VS</span>
          ${barre(o, ORDI, 'bleu', adv())}
        </section>
      </div>
      <section class="badges-ligne">
        <div class="badges rouge">${badges(e, HUMAIN)}${bonusEnCours?.moi ? `<span class="badge">🚩 Nation +${Math.round(bonusEnCours.moi * 100)} %</span>` : ''}</div>
        <div class="badges bleu">${badges(e, ORDI)}${bonusEnCours?.lui ? `<span class="badge">🚩 Nation +${Math.round(bonusEnCours.lui * 100)} %</span>` : ''}</div>
      </section>
      ${caseDernierTour(e)}
      <footer class="pave">
        ${h.initiative ? `<p class="spe-info init">${e.enchainement
          ? `Tu as l'initiative : après ta séquence, tu verras la dernière action ${mode === 'ligne' ? 'de ton ami' : 'de l\'ordinateur'} et pourras changer la tienne.`
          : `Tu as l'initiative : après ton choix, tu verras deux actions possibles ${mode === 'ligne' ? 'de ton ami' : 'de l\'ordinateur'}.`}</p>` : ''}
        ${mode === 'ligne' ? '<p class="statut" aria-live="polite"></p>' : ''}
        ${bulleCoach()}

        <div class="actions-zone">${e.enchainement ? paveSequence(e) : boutonsActions(e, 'tour')}</div>
        <p class="graine">${mode === 'ligne' ? `Salle ${codeSalle.toUpperCase()} · combat n° ${vueLigne?.graine ?? ''}` : tuto ? 'Combat guidé' : `Combat n° ${partie!.hasard.graine}`} · <button class="lien" data-quitter>${tuto ? 'Quitter le tutoriel' : 'Abandonner'}</button></p>
      </footer>
      ${panneauChat(e)}
    </main>`;
  brancherChat();

  // Les barres partent de l'endurance d'avant le tour et glissent vers la nouvelle valeur.
  requestAnimationFrame(() =>
    app.querySelectorAll<HTMLElement>('.endu-barre [data-cible]').forEach((b) => {
      b.style.width = `${b.dataset.cible}%`;
    }),
  );
  endurancesAvant = [e.joueurs[0].endurance, e.joueurs[1].endurance];
  if (!animer) app.querySelector('.case')?.classList.add('fige');
  guiderBoutons(app);

  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="tour"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, choisir)),
  );
  if (e.enchainement) brancherSequence();
  app.querySelectorAll<HTMLButtonElement>('[data-voir]').forEach((b) =>
    b.addEventListener('click', () => {
      const e = etatEnCours();
      const idx = e ? e.joueurs.findIndex((x) => x.def.id === b.dataset.voir) : -1;
      if (!e || idx < 0) return fenetreCarte(trouverLutteur(b.dataset.voir!));
      // Style de carte : le sien (collection), ou celui que l'ami a envoyé en ligne.
      const style = mode === 'ligne'
        ? (idx === HUMAIN ? vueLigne?.monStyle : vueLigne?.amiStyle) ?? 0
        : idx === HUMAIN ? styleDe(collection, b.dataset.voir!) : 0;
      fenetreCarte(e.joueurs[idx].def, style);
    }),
  );
  app.querySelector('[data-quitter]')?.addEventListener('click', () => {
    if (tuto) {
      tuto = false;
      partie = null;
      location.hash = '#combat';
      return;
    }
    if (!confirmerAbandon()) return;
    if (mode === 'ligne') duel?.abandonner();
    else if (enTournoi !== null) finCombatTournoi(true);
    else ecranArene(!!partie?.etat.rapide);
  });
  if (mode === 'ligne') majStatutLigne();
}

function confirmerAbandon(): boolean {
  // Pas de fenêtre du navigateur : un second appui confirme.
  const b = app.querySelector<HTMLButtonElement>('[data-quitter]')!;
  if (b.dataset.confirme) return true;
  b.dataset.confirme = '1';
  b.textContent = 'Appuie encore pour abandonner';
  return false;
}

function lireChoix(b: HTMLButtonElement): Choix {
  const a = b.dataset.action as ActionJouee;
  return a === 'lutte' || a === 'souffle' ? { action: a } : { action: a, speciale: b.dataset.speciale === '1' };
}

// Choix d'une action : si elle peut être jouée en spéciale (elle brille), le jeu demande d'abord
// si on active l'action spéciale, dans une petite bulle par-dessus l'écran.
function demanderSpeciale(b: HTMLButtonElement, suite: (c: Choix) => void) {
  const c = lireChoix(b);
  if (b.dataset.spe !== '1' || c.action === 'lutte' || c.action === 'souffle') return suite(c);
  const e = partie?.etat ?? vueLigne?.etat;
  if (!e) return suite(c);
  const l = e.joueurs[HUMAIN];
  const a = c.action;
  const nom = echap(nomLocal(l.def.nation, a));
  const normaleOk = actionsJouables(e, HUMAIN).includes(a);
  const g = etapeGuidee();
  document.querySelector('.choix-spe')?.remove();
  const el = document.createElement('div');
  el.className = 'choix-spe';
  el.innerHTML = `<div class="choix-spe-boite" role="dialog" aria-modal="true" aria-label="Activer l'action spéciale ?">
    <h3>★ Activer l'action spéciale ?</h3>
    <button class="principal" data-oui ${g && !g.conseil.speciale ? 'disabled' : ''}>
      <b>★ ${nom} spéciale</b><small>${EFFET_SPECIALE[ACTIONS[a].famille]} · −${fmt(b.dataset.mode === 'sequence' ? coutALaPlace(e, HUMAIN, sequenceHumain, { action: a, speciale: true }) : coutSpeciale(e, HUMAIN, a))} d'endurance</small></button>
    <button class="secondaire" data-non ${normaleOk && !(g && g.conseil.speciale) ? '' : 'disabled'}>
      <b>${nom} normale</b><small>${effetAction(a, { feinte: l.bonusFeinte > 0, enchainement: l.bonusEnchainement, combo: pointsCombo(l, a) })} · −${fmt(coutDuTour(e, HUMAIN, a))} d'endurance</small></button>
    <button class="lien" data-annuler>Annuler</button></div>`;
  document.body.append(el);
  const fermer = () => el.remove();
  el.querySelector('[data-oui]')!.addEventListener('click', () => { fermer(); suite({ action: a, speciale: true }); });
  el.querySelector('[data-non]')!.addEventListener('click', () => { fermer(); suite({ action: a, speciale: false }); });
  el.querySelector('[data-annuler]')!.addEventListener('click', fermer);
  el.addEventListener('click', (ev) => { if (ev.target === el) fermer(); });
  el.querySelector<HTMLButtonElement>('[data-oui]:not([disabled]), [data-non]:not([disabled])')?.focus();
}

// ---------- Déroulé d'un tour ----------

function choisir(choixHumain: Choix) {
  if (mode === 'ligne') {
    duel?.jouer(choixHumain);
    return;
  }
  if (!partie || enAttente) return;
  enAttente = true;
  const choixOrdi = partie.choixOrdi();
  const apercu = partie.apercuPourHumain(choixOrdi.action);
  if (apercu) fenetreInitiative(choixHumain, choixOrdi, apercu);
  else suite(choixHumain, choixOrdi);
}

function suite(choixHumain: Choix, choixOrdi: Choix) {
  if (!partie) return;
  const final = partie.reactionOrdi(choixHumain, choixOrdi);
  const change = final.action !== choixOrdi.action;
  resoudre(choixHumain, final, change);
}

function resoudre(choixHumain: Choix, choixOrdi: Choix, change: boolean, face?: Face) {
  if (!partie) return;
  const r = partie.resoudre(choixHumain, choixOrdi, change, face);
  if (r === 'pileOuFace') return fenetrePileOuFace(choixHumain, choixOrdi, change);
  tours.push(r);
  for (const l of r.lignes) {
    const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
    if (m) scoresPeriodes.push(HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
  }
  fermerFenetre();
  enAttente = false;
  ecranCombat();
}

// ---------- Fenêtres ----------

function ouvrirFenetre(html: string, fermable = false): HTMLElement {
  fermerFenetre();
  const f = document.createElement('div');
  f.className = 'voile';
  f.innerHTML = `<div class="fenetre" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(f);
  if (fermable) {
    f.addEventListener('click', (ev) => {
      if (ev.target === f || (ev.target as HTMLElement).closest('[data-fermer]')) fermerFenetre();
    });
  }
  f.querySelector<HTMLElement>('button')?.focus();
  return f;
}

function fermerFenetre() {
  document.querySelector('.voile')?.remove();
  document.querySelector('.revelation')?.remove(); // ouverture de booster interrompue (changement d'écran)
}

function fenetreCarte(def: DefLutteur, style = 0) {
  const f = ouvrirFenetre(`<div class="fenetre-carte">${carteHTML(def, '', { style })}</div><button class="secondaire" data-fermer>Fermer</button>`, true);
  activerReflets(f);
}

function fenetreInitiative(choixHumain: Choix, choixOrdi: Choix, apercu: ActionJouee[]) {
  const e = partie!.etat;
  const nationO = e.joueurs[ORDI].def.nation;
  const mien = libelleAction(e.joueurs[HUMAIN].def.nation, choixHumain.action);
  const options = apercu.map((a) => {
    const lib = libelleAction(nationO, a);
    const f = famille(a);
    return `<li class="bleu"><span class="ico f-${f}">${ICONE[f]}</span><b>${echap(lib.local)}</b> <small>${echap(lib.fr)}${legendeFamille(f)}</small></li>`;
  }).join('');
  const f = ouvrirFenetre(`
    <h2>Initiative</h2>
    <p>L'ordinateur a choisi une de ces deux actions :</p>
    <ul class="apercu">${options}</ul>
    <button class="principal" data-garder>Garder ${choixHumain.speciale ? '★ ' : ''}${echap(mien.local)}</button>
    <p class="ou">ou changer pour :</p>
    <div class="pave-fenetre">${boutonsActions(e, 'initiative')}</div>`);
  guiderBoutons(f);
  f.querySelector('[data-garder]')!.addEventListener('click', () => suite(choixHumain, choixOrdi));
  f.querySelectorAll<HTMLButtonElement>('[data-mode="initiative"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, (c) => suite(c, choixOrdi))),
  );
}

function fenetrePileOuFace(choixHumain: Choix, choixOrdi: Choix, change: boolean) {
  const f = ouvrirFenetre(`
    <h2>Tentative de tombé !</h2>
    ${htmlDuel(choixHumain, choixOrdi, partie!.etat)}
    <p>L'ordinateur est sur le point de te faire tomber. Annonce pile ou face : si la pièce tombe sur ton annonce, tu t'en sors.</p>
    <div class="pile-face">
      <button class="principal" data-face="pile">Pile</button>
      <button class="principal" data-face="face">Face</button>
    </div>`);
  f.querySelectorAll<HTMLButtonElement>('[data-face]').forEach((b) =>
    b.addEventListener('click', () => resoudre(choixHumain, choixOrdi, change, b.dataset.face as Face)),
  );
}

// ---------- Écran 3 : fin du combat ----------

// ---------- Ouverture des boosters ----------

interface Paquet {
  titre: string; // « Victoire », « Booster de consolation »…
  boosters: Booster[];
  ouvert: boolean;
  sansRecap?: boolean; // pas de récapitulatif des cartes à la fin (récompenses des modes histoire)
}

interface CarteTiree { id: string; nouvelle: boolean; booster: number }

function cartesDuPaquet(p: Paquet): CarteTiree[] {
  const liste: CarteTiree[] = [];
  p.boosters.forEach((b, k) => {
    const nouvelles = new Set(b.nouvelles);
    for (const id of b.cartes) {
      const nouvelle = nouvelles.has(id);
      nouvelles.delete(id);
      liste.push({ id, nouvelle, booster: k });
    }
  });
  return liste;
}

const nomBooster = (b: Booster) =>
  b.type === 'recompense' ? 'Récompense' : b.type === 'rare' ? 'Booster rare · 5 cartes' : 'Booster classique · 3 cartes';

// Ce que contient le booster en plus des cartes : médailles et $.
function texteGains(g: { medailles?: number; dollars?: number }): string {
  const t: string[] = [];
  if (g.medailles) t.push(`+${g.medailles} médaille${g.medailles > 1 ? 's' : ''}`);
  if (g.dollars) t.push(`+${g.dollars} $`);
  return t.join(' · ');
}

function visuelPaquet(b: Booster, extra = ''): string {
  const contenu = b.type === 'recompense' && !b.cartes.length
    ? texteGains(b)
    : `${b.cartes.length} carte${b.cartes.length > 1 ? 's' : ''}${b.medailles || b.dollars ? ` · ${texteGains(b)}` : ''}`;
  return `
    <span class="paquet p-${b.type}">
      <span class="paquet-logo">Wrestling<br>Battle Card</span>
      <span class="paquet-type">${b.type === 'recompense' ? 'Récompense' : b.type === 'rare' ? 'Rare' : 'Classique'}</span>
      <span class="paquet-nb">${contenu}</span>
      ${extra}
    </span>`;
}

// Le jeton d'un gain, révélé comme une carte : médaille d'or ou billet.
function jetonGain(type: 'medailles' | 'dollars', n: number): string {
  return type === 'medailles'
    ? `<div class="jeton jeton-medaille">${ICONE_MEDAILLE}<b>+${n}</b><span>médaille${n > 1 ? 's' : ''}</span><small>Total : ${collection.medailles}</small></div>`
    : `<div class="jeton jeton-dollars"><i aria-hidden="true">$</i><b>+${n} $</b><span>Palier de ${R_.economie.medaillesParPalier} médailles atteint</span><small>Total : ${collection.dollars} $</small></div>`;
}

function recapPaquet(p: Paquet): string {
  const cartes = cartesDuPaquet(p);
  const nouvelles = cartes.filter((c) => c.nouvelle).length;
  const gains = {
    medailles: p.boosters.reduce((n, b) => n + (b.medailles ?? 0), 0),
    dollars: p.boosters.reduce((n, b) => n + (b.dollars ?? 0), 0),
  };
  const ligneGains = gains.medailles || gains.dollars
    ? `<p class="recap-gains">${ICONE_MEDAILLE}<b>${texteGains(gains)}</b> <small>· tu as ${collection.medailles} médaille${collection.medailles > 1 ? 's' : ''} et ${collection.dollars} $</small></p>`
    : '';
  if (!cartes.length) return `${ligneGains}<p class="note">Dépense tes $ en boosters dans Social.</p>`;
  return `
    ${ligneGains}
    <p class="recap-resume"><b>${nouvelles}</b> nouvelle${nouvelles > 1 ? 's' : ''} carte${nouvelles > 1 ? 's' : ''} · <b>${cartes.length - nouvelles}</b> double${cartes.length - nouvelles > 1 ? 's' : ''}</p>
    <div class="grille-mini recap">${cartes.map((c) => `
      <div class="recap-carte">
        ${miniCarteLutteur(trouverLutteur(c.id), NOM_RARETE[trouverLutteur(c.id).rarete])}
        <span class="pastille ${c.nouvelle ? 'nouvelle' : 'nombre'}">${c.nouvelle ? 'Nouvelle !' : 'Double'}</span>
      </div>`).join('')}</div>
    <p class="note">${compteur()} · tes doubles servent à la fusion et aux transferts.</p>`;
}

// Section de l'écran de fin : le booster fermé à ouvrir, ou le récapitulatif une fois ouvert.
function sectionPaquet(p: Paquet | null, message = ''): string {
  if (!p) return message ? `<section class="booster"><p>${message}</p></section>` : '';
  if (!p.ouvert) {
    return `
      <section class="booster">
        <h2>${echap(p.titre)} : ${p.boosters[0].type === 'recompense' ? 'ta récompense' : p.boosters.length > 1 ? `${p.boosters.length} boosters` : 'un booster'} !</h2>
        <button class="paquet-bouton" data-ouvrir-paquet aria-label="Ouvrir le booster">
          ${visuelPaquet(p.boosters[0], p.boosters.length > 1 ? `<span class="paquet-x">×${p.boosters.length}</span>` : '')}
        </button>
        <p class="note">Touche le booster pour l'ouvrir.</p>
      </section>`;
  }
  return `<section class="booster"><h2>${echap(p.titre)} : ${cartesDuPaquet(p).length ? 'tes cartes' : 'tes gains'}</h2>${recapPaquet(p)}</section>`;
}

// Ouverture en plein écran : le paquet, puis une carte par appui, puis le récapitulatif.
function revelerPaquet(p: Paquet, fin: () => void) {
  document.querySelector('.revelation')?.remove();
  const nb = p.boosters.filter((b) => b.cartes.length).length;
  if (!p.ouvert && nb) setTimeout(() => quete({ type: 'booster', n: nb }), 0);
  const cartes = cartesDuPaquet(p);
  type Etape = { type: 'paquet'; b: number } | { type: 'carte'; k: number } | { type: 'gain'; b: number; quoi: 'medailles' | 'dollars' } | { type: 'recap' };
  const etapes: Etape[] = [];
  p.boosters.forEach((bo, b) => {
    etapes.push({ type: 'paquet', b });
    cartes.forEach((c, k) => { if (c.booster === b) etapes.push({ type: 'carte', k }); });
    if (bo.medailles) etapes.push({ type: 'gain', b, quoi: 'medailles' });
    if (bo.dollars) etapes.push({ type: 'gain', b, quoi: 'dollars' });
  });
  etapes.push({ type: 'recap' });
  let i = 0;
  const el = document.createElement('div');
  el.className = 'revelation';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Ouverture du booster');
  el.tabIndex = -1;
  document.body.appendChild(el);
  const plusieurs = p.boosters.length > 1;
  const terminer = () => {
    el.remove();
    p.ouvert = true;
    fin();
  };
  const afficher = () => {
    const e = etapes[i];
    if (e.type === 'recap') {
      if (p.sansRecap) return terminer();
      el.innerHTML = `
        <div class="rev-recap">
          <h2>${echap(p.titre)} : ${cartes.length ? 'tes cartes' : 'tes gains'}</h2>
          ${recapPaquet(p)}
          <button class="principal" data-fin>Continuer</button>
        </div>`;
      el.querySelector('[data-fin]')!.addEventListener('click', terminer);
      activerReflets(el);
      (el.querySelector('[data-fin]') as HTMLElement).focus();
      return;
    }
    const b = e.type === 'carte' ? cartes[e.k].booster : e.b;
    const dansBooster = cartes.filter((c) => c.booster === b);
    const rang = e.type === 'carte' ? dansBooster.indexOf(cartes[e.k]) + 1 : 0;
    const info = `${plusieurs ? `Booster ${b + 1}/${p.boosters.length} · ` : ''}${nomBooster(p.boosters[b])}${rang ? ` · carte ${rang}/${dansBooster.length}` : ''}`;
    let scene: string;
    let aide: string;
    const derniere = etapes[i + 1]?.type === 'recap';
    if (e.type === 'paquet') {
      scene = `<div class="rev-paquet">${visuelPaquet(p.boosters[b])}</div>`;
      aide = 'Touche l\'écran pour ouvrir le booster';
    } else if (e.type === 'gain') {
      const bo = p.boosters[b];
      scene = `<div class="rev-carte rev-gain"><div class="rev-eclat" aria-hidden="true"></div>${jetonGain(e.quoi, (e.quoi === 'medailles' ? bo.medailles : bo.dollars) ?? 0)}</div>`;
      aide = derniere ? (p.sansRecap ? 'Touche l\'écran pour terminer' : 'Touche l\'écran pour voir le récapitulatif') : 'Touche l\'écran pour la suite';
    } else {
      const c = cartes[e.k];
      const def = trouverLutteur(c.id);
      scene = `
        <div class="rev-carte r-${def.rarete}">
          <div class="rev-eclat" aria-hidden="true"></div>
          <span class="pastille ${c.nouvelle ? 'nouvelle' : 'nombre'}">${c.nouvelle ? 'Nouvelle !' : 'Double'}</span>
          ${carteHTML(def)}
        </div>`;
      aide = derniere ? (p.sansRecap ? 'Touche l\'écran pour terminer' : 'Touche l\'écran pour voir le récapitulatif') : 'Touche l\'écran pour la carte suivante';
    }
    el.innerHTML = `
      <header class="rev-tete"><span>${info}</span><button class="lien" data-tout>Tout voir</button></header>
      <div class="rev-scene">${scene}</div>
      <p class="rev-aide">${aide}</p>`;
    el.querySelector('[data-tout]')!.addEventListener('click', (ev) => {
      ev.stopPropagation();
      i = etapes.length - 1;
      afficher();
    });
    activerReflets(el);
    el.focus();
  };
  const suivant = () => {
    if (etapes[i].type === 'recap') return;
    i++;
    afficher();
  };
  el.addEventListener('click', (ev) => {
    if ((ev.target as HTMLElement).closest('button')) return;
    suivant();
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      if ((ev.target as HTMLElement).closest('button')) return;
      ev.preventDefault();
      suivant();
    }
  });
  afficher();
}

function ecranFin() {
  if (!partie) return;
  const e = partie.etat;
  const gagne = e.vainqueur === HUMAIN;
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  const vainqueur = gagne ? h : o;
  const comment = e.finPar === 'tombe'
    ? 'par tombé'
    : e.rapide ? `${Math.max(h.score, o.score)} à ${Math.min(h.score, o.score)}${e.mortSubite ? ' en mort subite' : ''}`
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  const { idHumain, idOrdi } = partie;
  const enArene = !e.rapide && areneCtx !== null;
  if (!recompenseDonnee) {
    recompenseDonnee = true;
    const x = bonusCeCombat ? REGLES.collection.multiplicateurApresTutoriel : 1;
    if (bonusCeCombat) collection.bonusTutoriel = false; // le bonus vaut pour un seul combat
    bonusCeCombat = false;
    if (gagne) histoire({ type: 'victoire', nation: o.def.nation, niveau: partie.niveau, auto: combatEnAuto });
    let championBattu = gagne && areneCtx?.type === 'boss'; // champion d'une nation battu dans l'arène
    if (e.rapide) {
      // Combat rapide : +1 médaille par victoire, sans booster ni consolation.
      if (gagne) {
        histoire({ type: 'rapide', tombe: e.finPar === 'tombe', ecart: h.score - o.score });
        if (interclubEnCours) saison({ type: 'interclub' });
        collection.victoires++;
        paquetSolo = { titre: 'Victoire', boosters: joindreGains([], gagnerMedailles(collection, R_.economie.medaillesParVictoire.arene)), ouvert: false };
      }
    } else if (gagne && areneCtx?.type === 'boss') {
      const r = victoireBossRejoue(collection, areneCtx.nation, Math.random);
      paquetSolo = { titre: r.carteBoss ? 'Victoire et carte du boss gagnée' : 'Victoire', boosters: r.boosters, ouvert: false };
    } else if (gagne) {
      // Arène : +1 médaille ; nation battue : 2 ou 3 boosters, 3 médailles, peut-être la carte du boss.
      // Bonus du tutoriel : des boosters en plus sur cette victoire.
      const bonus = x > 1 ? R_.collection.boostersParVictoire.arene * x : 0;
      const r = victoireArene(collection, Math.random, bonus);
      if (r.nationBattue) histoire({ type: 'nationArene' });
      quete({ type: 'arene' });
      if (r.nationBattue) championBattu = true;
      const titre = r.nationBattue ? `${r.nationBattue.nom} battue${r.carteBoss ? ' et carte du boss gagnée' : ''}` : bonus ? 'Victoire · bonus du tutoriel' : 'Victoire';
      paquetSolo = { titre, boosters: r.boosters, ouvert: false };
    } else {
      const conso = consoler(collection, Math.random);
      if (conso) paquetSolo = { titre: 'Booster de consolation', boosters: [conso], ouvert: false };
      else messageSolo = 'Encore une défaite d\'affilée et tu reçois un booster de consolation.';
    }
    queteCombat(e, e.rapide ? 'rapide' : 'arene', partie.niveau, championBattu);
    sauver(collection);
  }
  const booster = sectionPaquet(paquetSolo, messageSolo);
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(vainqueur.def)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(vainqueur.def.nom)} gagne ${comment}.</p>
        ${scoresPeriodes.length ? `<p class="hist">${scoresPeriodes.map(([a, b], i) => `Période ${i + 1} : ${a} - ${b}`).join('<br>')}</p>` : ''}
        <p class="hist">${echap(moiNom())} : ${echap(h.def.nom)} · Ordi : ${echap(o.def.nom)} · ${e.tourGlobal} tours</p>
        ${combatEnAuto ? `<p class="hist">${texteAuto()}</p>` : ''}
      </section>
      ${booster}
      <div class="fin-boutons">
        ${enArene && gagne && areneCtx?.type === 'progression'
          ? `${etapeArene(collection).adversaire ? `<button class="principal" data-suivant-arene>Adversaire suivant avec ${echap(h.def.nom)}</button>${boutonAuto('data-suivant-arene-auto')}` : ''}`
          : `<button class="principal" data-revanche>${interclubEnCours ? 'Combat interclub suivant' : enArene && !gagne ? `Retenter avec ${echap(h.def.nom)}` : 'Revanche'}</button>${boutonAuto('data-revanche-auto')}`}
        <button class="secondaire" data-changer>${enArene ? 'Retour à l\'arène' : 'Changer de lutteur'}</button>
        <button class="lien" data-menu>Retour au menu</button>
      </div>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  activerReflets(app);
  const ctx = areneCtx;
  const revanche = (auto: boolean) => {
    if (interclubEnCours) return lancerInterclub(idHumain, auto);
    if (!enArene) return lancer(idHumain, idOrdi, nouvelleGraine(), e.rapide, partie?.niveau ?? collection.niveau, auto);
    if (ctx?.type === 'boss') bossChoisi = ctx.nation;
    lancerArene(idHumain, auto);
  };
  app.querySelector('[data-revanche]')?.addEventListener('click', () => revanche(false));
  app.querySelector('[data-revanche-auto]')?.addEventListener('click', () => revanche(true));
  app.querySelector('[data-suivant-arene]')?.addEventListener('click', () => { bossChoisi = null; lancerArene(idHumain); });
  app.querySelector('[data-suivant-arene-auto]')?.addEventListener('click', () => { bossChoisi = null; lancerArene(idHumain, true); });
  app.querySelector('[data-changer]')!.addEventListener('click', () => {
    if (ctx?.type === 'boss' && !gagne) bossChoisi = ctx.nation; else bossChoisi = null;
    ecranArene(e.rapide);
  });
  // Retour direct à l'accueil, sans repasser par le choix du lutteur.
  app.querySelector('[data-menu]')!.addEventListener('click', () => {
    bossChoisi = null;
    partie = null;
    if (location.hash && location.hash !== '#') location.hash = '';
    else route();
  });
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => paquetSolo && revelerPaquet(paquetSolo, ecranFin));
  window.scrollTo(0, 0);
}


// ---------- Combat entre amis ----------

const CLE_SESSION = 'wbc-ligne-session';
const clePresence = (code: string, role: Role) => `wbc-ligne-${code}-${role}`;

function sessionLigne(): { code: string; role: Role } | null {
  try {
    const x = JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null');
    return x && codeValide(x.code) && (x.role === 'hote' || x.role === 'invite') ? x : null;
  } catch {
    return null;
  }
}

function oublierSession() {
  try {
    const x = sessionLigne();
    if (x) localStorage.removeItem(clePresence(x.code, x.role));
    localStorage.removeItem(CLE_SESSION);
  } catch {
    // rien à faire
  }
}

// Où se joue le combat entre amis selon l'adresse de la page.
function relaisPerso(): string | null {
  try {
    return localStorage.getItem('wbc-relais'); // pour les tests : adresse d'un relais local
  } catch {
    return null;
  }
}
function acces(): 'relais' | 'local' | 'ailleurs' {
  if (relaisPerso()) return 'relais';
  const h = location.hostname;
  if (h.endsWith('github.io')) return 'relais';
  if (h === 'localhost' || h === '127.0.0.1') return 'local';
  return 'ailleurs';
}

let salleActive: Salle | null = null;

function ecranAmis(message = '') {
  quitterLigne();
  if (acces() === 'ailleurs') {
    app.innerHTML = `
      <main class="amis">
        <header class="titre">
          <h1>Combat entre amis</h1>
          <p>Le combat entre amis se joue sur la version du jeu ouverte à tous : pas besoin de compte, il suffit du lien. Ouvre-la sur ton téléphone et envoie le même lien à ton ami.</p>
        </header>
        <section class="bloc">
          <a class="principal lien-bouton" href="${ADRESSE_PUBLIQUE}" target="_blank" rel="noopener">Ouvrir la version ouverte à tous</a>
          <p class="note">Adresse : ${ADRESSE_PUBLIQUE}</p>
          <p class="note">Ta collection est gardée séparément sur chaque version du jeu.</p>
        </section>
        <a class="lien" href="#">Retour</a>
      </main>`;
    return;
  }
  app.innerHTML = `
    <main class="amis">
      <header class="titre">
        <h1>Combat entre amis</h1>
        <p>Toi et ton ami ouvrez ce même lien sur vos téléphones. L'un crée une salle, l'autre tape son code. Toutes les cartes sont permises entre amis.</p>
      </header>
      ${message ? `<p class="alerte" role="alert">${message}</p>` : ''}
      <section class="bloc">
        <h2>Créer une salle</h2>
        <p>Choisis comment vous jouez :</p>
        <label class="case-rapide"><input type="checkbox" id="rapide"> Combat rapide <small>(une période, mort subite, sans booster)</small></label>
        <label class="case-rapide"><input type="checkbox" id="enchainement-ligne"> Mode Enchaînement <small>(à l'essai : séquences de ${TAILLE_SEQUENCE} actions, ${R_.enchainement.toursParPeriode} tours par période)</small></label>
        <button class="principal" data-creer="collection">Avec nos collections<small>Vos cartes fusionnées · 2 boosters et 2 médailles par victoire</small></button>
        <button class="secondaire" data-creer="base">Cartes de base<small>Toutes les cartes, sans fusion · 2 médailles par victoire, pas de booster</small></button>
      </section>
      <section class="bloc">
        <h2>Rejoindre ton ami</h2>
        <form class="rejoindre">
          <label for="code">Code de la salle (4 lettres)</label>
          <input id="code" name="code" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="4" placeholder="ABCD">
          <button class="principal" type="submit">Rejoindre</button>
        </form>
      </section>
      <a class="lien" href="#">Retour</a>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-creer]').forEach((b) =>
    b.addEventListener('click', () => connecter(nouveauCode(), 'hote', b.dataset.creer === 'collection' ? 'collection' : 'base', app.querySelector<HTMLInputElement>('#rapide')?.checked, app.querySelector<HTMLInputElement>('#enchainement-ligne')?.checked)),
  );
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranAmis('Le code fait 4 lettres, sans chiffres.');
    connecter(code, 'invite');
  });
  window.scrollTo(0, 0);
}

async function connecter(code: string, role: Role, modeSalle?: ModeSalle, rapide = false, enchainement = false) {
  app.innerHTML = '<main class="amis"><header class="titre"><h1>Connexion…</h1><p>Ouverture de la salle.</p></header></main>';
  const a = acces();
  if (a === 'ailleurs') return ecranAmis();
  const perso = relaisPerso();
  const salle: Salle = a === 'local' ? salleLocale(code) : salleRelais(code, perso ? [perso] : RELAIS);
  salleActive = salle;
  let depart: Presence | null = null;
  try {
    depart = JSON.parse(localStorage.getItem(clePresence(code, role)) ?? 'null');
    localStorage.setItem(CLE_SESSION, JSON.stringify({ code, role }));
  } catch {
    depart = null;
  }
  partie = null;
  mode = 'ligne';
  bonusEnCours = null;
  codeSalle = code;
  HUMAIN = role === 'hote' ? 0 : 1;
  ORDI = role === 'hote' ? 1 : 0;
  toursAffiches = -1;
  fenetreLigne = '';
  absentDepuis = null;
  if (location.hash) history.replaceState(null, '', location.pathname);
  duel = new Duel(salle, role, depart, (p) => {
    try {
      localStorage.setItem(clePresence(code, p.role), JSON.stringify(p));
    } catch {
      // pas de sauvegarde possible : la reprise après rechargement ne marchera pas
    }
  }, { mode: modeSalle, coach: collection.coach, idCoach: collection.idCoach, niveauCompte: niveauCompte(collection), rapide, enchainement });
  duel.surVue(rafraichirLigne);
}

function quitterLigne() {
  if (duel) duel.fermer();
  duel = null;
  salleActive = null;
  vueLigne = null;
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  fermerFenetre();
}

let signatureSalle = '';
let paquetLigne: { cle: string; paquet: Paquet } | null = null;
let minuteurAbsence: number | undefined;

function rafraichirLigne(v: Vue) {
  vueLigne = v;
  if (mode !== 'ligne') return;
  // Le rôle peut changer (ami revenu dans la salle avec le code) : on suit le duel.
  if (duel && HUMAIN !== (duel.role === 'hote' ? 0 : 1)) {
    HUMAIN = duel.role === 'hote' ? 0 : 1;
    ORDI = HUMAIN === 0 ? 1 : 0;
    toursAffiches = -1;
    try {
      localStorage.setItem(CLE_SESSION, JSON.stringify({ code: codeSalle, role: duel.role }));
    } catch {
      // pas de sauvegarde possible
    }
  }
  // Absence de l'ami pendant le combat
  if (v.phase === 'combat' && !v.amiPresent) absentDepuis ??= Date.now();
  else absentDepuis = null;
  clearTimeout(minuteurAbsence);
  if (absentDepuis) minuteurAbsence = window.setTimeout(() => vueLigne && rafraichirLigne(vueLigne), 5000);

  if (v.phase === 'attente-ami' || v.phase === 'choix-lutteur') {
    const sig = `${v.enchainement}|${v.phase}|${v.amiPresent}|${v.monLutteur}|${v.amiLutteur}|${v.attente}|${salleActive?.connecte()}|${v.modeSalle}|${v.amiCoach}|${v.autoMoi}|${v.autoAmi}`;
    if (sig !== signatureSalle) ecranSalle(v);
    signatureSalle = sig;
    return;
  }
  signatureSalle = '';
  if (v.phase === 'fin') {
    fermerFenetre();
    fenetreLigne = '';
    tours = v.tours;
    scoresPeriodes = [];
    for (const t of tours) for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) scoresPeriodes.push(HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
    }
    return ecranFinLigne();
  }
  // Combat : on ne redessine tout que quand un nouveau tour est joué.
  if (v.tours.length !== toursAffiches || !app.querySelector('.combat')) {
    if (v.tours.length !== toursAffiches) sequenceHumain = []; // nouvelle séquence jouée : on recompose
    toursAffiches = v.tours.length;
    tours = v.tours;
    scoresPeriodes = [];
    for (const t of tours) for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) scoresPeriodes.push(HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
    }
    if (toursAffiches === 0 || !app.querySelector('.combat')) endurancesAvant = null;
    fenetreLigne = '';
    fermerFenetre();
    ecranCombat();
  }
  majStatutLigne();
}

// Met à jour la zone d'état et les fenêtres sans tout redessiner.
function majStatutLigne() {
  const v = vueLigne;
  const e = v?.etat;
  if (!v || !e || v.phase !== 'combat') return;
  const statut = app.querySelector<HTMLElement>('.statut');
  const zone = app.querySelector<HTMLElement>('.actions-zone');
  let texte = '';
  if (absentDepuis) {
    const s = Math.round((Date.now() - absentDepuis) / 1000);
    texte = s >= 120 ? 'Ton ami est parti depuis plus de 2 minutes.' : `Ton ami s'est déconnecté. En attente de son retour… (${s} s)`;
  } else if (v.desaccord) {
    texte = 'Attention : vos deux téléphones ne calculent pas la même chose. Recommencez le combat.';
  } else if (v.aChoisir) {
    texte = v.enchainement ? 'À toi de composer ta séquence.' : 'À toi de choisir ton action.';
  } else if (v.maSequence && v.attente) {
    const noms = v.maSequence.map((c) => `${c.speciale ? '★ ' : ''}${libelleAction(e.joueurs[HUMAIN].def.nation, c.action).local}`).join(', ');
    texte = `Ta séquence : ${noms}. ${v.attente}`;
  } else if (v.monChoix && v.attente) {
    const lib = libelleAction(e.joueurs[HUMAIN].def.nation, v.monChoix.action);
    texte = `Ton choix : ${v.monChoix.speciale ? '★ ' : ''}${lib.local}. ${v.attente}`;
  } else if (v.attente) {
    texte = v.attente;
  }
  if (statut) statut.textContent = texte;
  if (zone) zone.classList.toggle('bloque', !v.aChoisir);
  zone?.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    if (!v.aChoisir) b.dataset.bloque = '1';
    else delete b.dataset.bloque;
  });
  if (absentDepuis && Date.now() - absentDepuis >= 120_000 && !app.querySelector('[data-forfait]')) {
    statut?.insertAdjacentHTML('afterend', '<button class="secondaire" data-forfait>Arrêter : victoire par forfait</button>');
    app.querySelector('[data-forfait]')!.addEventListener('click', () => {
      oublierSession();
      quitterLigne();
      ecranMenu();
    });
  }
  // Fenêtres d'initiative et de pile ou face
  if (v.initiative && fenetreLigne !== 'init') {
    fenetreLigne = 'init';
    fenetreInitiativeLigne(v);
  } else if (v.pileOuFace && fenetreLigne !== 'face') {
    fenetreLigne = 'face';
    fenetrePileOuFaceLigne(v);
  } else if (!v.initiative && !v.pileOuFace && fenetreLigne) {
    fenetreLigne = '';
    fermerFenetre();
  }
}

function ecranSalle(v: Vue) {
  const enCollection = v.modeSalle === 'collection';
  const dispo = enCollection ? CARTES.filter((l) => possede(collection, l.id)) : LUTTEURS;
  const liste = dispo.map((l) => {
    const g = enCollection ? gradeDe(collection, l.id) : 1;
    return `
    <button class="choix-l ${v.monLutteur === l.id ? 'pris' : ''}" data-l="${l.id}" aria-pressed="${v.monLutteur === l.id}">
      <span class="vignette">${portrait(l)}</span>
      <span><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[niveauCarte(l, g)]}</small></span>
    </button>`;
  }).join('');
  const modeTexte = (v.enchainement ? `Mode Enchaînement (séquences de ${TAILLE_SEQUENCE} actions) · ` : '') + (v.modeSalle === null ? 'Connexion à la salle…'
    : v.rapide ? `Combat rapide (une période, mort subite) · ${enCollection ? 'vos collections' : 'cartes de base'} · 2 médailles par victoire, pas de booster.`
    : enCollection ? 'Mode : vos collections (fusions comprises) · 2 boosters et 2 médailles par victoire.'
    : 'Mode : cartes de base, toutes permises · 2 médailles par victoire, pas de booster.');
  const ami = v.amiLutteur ? trouverLutteur(v.amiLutteur) : null;
  app.innerHTML = `
    <main class="amis">
      <header class="titre">
        <h1>Salle ${echap(codeSalle.toUpperCase())}</h1>
        <p class="code-grand" aria-label="Code de la salle">${echap(codeSalle.toUpperCase())}</p>
        <p class="note">${modeTexte}</p>
        <p>${!salleActive?.connecte() ? 'Connexion au relais…' : v.amiPresent ? `<b class="ok">${echap(v.amiCoach ? `Coach ${v.amiCoach}` : 'Ton ami')} ${pastilleNiveau(v.amiNiveau)} est dans la salle.</b>` : 'Envoie ce code à ton ami. Il ouvre ce même lien, touche « Combat entre amis » et tape le code.'}</p>
        <p>${v.monLutteur ? `Tu as choisi <b>${echap(trouverLutteur(v.monLutteur).nom)}</b>.` : 'Choisis ton lutteur ci-dessous.'}
           ${ami ? ` Ton ami a choisi <b>${echap(ami.nom)}</b>.` : v.amiPresent ? ' Ton ami choisit son lutteur…' : ''}
           ${v.attente ? echap(v.attente) : ''}</p>
      </header>
      ${autoDispo() || v.autoAmi ? `<section class="bloc auto-ligne">
        <label class="case"><input type="checkbox" data-auto-ligne ${v.autoMoi ? 'checked' : ''} ${v.monLutteur || !autoDispo() ? 'disabled' : ''}> ⚡ Combat automatique</label>
        <p class="note">${!autoDispo() ? `Ton ami propose le combat automatique, ouvert à partir du niveau de compte ${R_.auto.niveauCompteMin}.`
          : v.autoMoi && v.autoAmi ? 'Vous l\'avez choisi tous les deux : le combat se jouera tout seul, vous verrez directement le résultat.'
          : v.autoMoi ? 'En attente de ton ami : il doit aussi le cocher, sinon le combat se joue normalement.'
          : v.autoAmi ? 'Ton ami l\'a coché : coche-le aussi pour un combat automatique.'
          : 'Il faut que vous le cochiez tous les deux, avant de choisir vos lutteurs.'}</p>
      </section>` : ''}
      <div class="liste-l">${liste}</div>
      <p class="note">Ton deck personnalisé est utilisé s'il existe (sinon le deck de départ).</p>
      <button class="lien" data-sortir>Quitter la salle</button>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((b) =>
    b.addEventListener('click', () => duel?.choisirLutteur(b.dataset.l!, deckDe(collection, b.dataset.l!), enCollection ? gradeDe(collection, b.dataset.l!) : 1, enCollection ? etoilesDe(collection, b.dataset.l!) : {}, enCollection ? styleDe(collection, b.dataset.l!) : 0)),
  );
  app.querySelector<HTMLInputElement>('[data-auto-ligne]')?.addEventListener('change', (ev) => duel?.choisirAuto((ev.target as HTMLInputElement).checked));
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranMenu();
  });
}

function fenetreInitiativeLigne(v: Vue) {
  const e = v.etat!;
  if (v.enchainement) {
    if (!v.maSequence || !v.initiative?.length) return;
    return fenetreDerniereAction(e, v.maSequence, { action: v.initiative[0] }, 'ton ami', (seq) => duel?.deciderSequence(seq));
  }
  const choix = v.monChoix;
  const nationA = e.joueurs[ORDI].def.nation;
  const options = v.initiative!.map((a) => {
    const lib = libelleAction(nationA, a);
    const f = famille(a);
    return `<li class="bleu"><span class="ico f-${f}">${ICONE[f]}</span><b>${echap(lib.local)}</b> <small>${echap(lib.fr)}${legendeFamille(f)}</small></li>`;
  }).join('');
  const mien = choix ? libelleAction(e.joueurs[HUMAIN].def.nation, choix.action) : null;
  const f = ouvrirFenetre(`
    <h2>Initiative</h2>
    <p>Ton ami a choisi une de ces deux actions :</p>
    <ul class="apercu">${options}</ul>
    ${choix && mien ? `<button class="principal" data-garder>Garder ${choix.speciale ? '★ ' : ''}${echap(mien.local)}</button>` : ''}
    <p class="ou">ou changer pour :</p>
    <div class="pave-fenetre">${boutonsActions(e, 'initiative')}</div>`);
  f.querySelector('[data-garder]')?.addEventListener('click', () => choix && duel?.decider(choix));
  f.querySelectorAll<HTMLButtonElement>('[data-mode="initiative"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, (c) => duel?.decider(c))),
  );
}

function fenetrePileOuFaceLigne(v: Vue) {
  const f = ouvrirFenetre(`
    <h2>Tentative de tombé !</h2>
    <p>Ton ami est sur le point de te faire tomber. Annonce pile ou face : si la pièce tombe sur ton annonce, tu t'en sors.</p>
    <div class="pile-face">
      <button class="principal" data-face="pile">Pile</button>
      <button class="principal" data-face="face">Face</button>
    </div>`);
  f.querySelectorAll<HTMLButtonElement>('[data-face]').forEach((b) =>
    b.addEventListener('click', () => duel?.annoncer(b.dataset.face as Face)),
  );
  void v;
}

function ecranFinLigne() {
  const v = vueLigne;
  const e = v?.etat;
  if (!v || !e) return;
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  let gagne: boolean;
  let comment: string;
  if (v.abandon) {
    gagne = v.abandon === 'ami';
    comment = gagne ? 'par abandon de ton ami' : 'par abandon';
  } else {
    gagne = e.vainqueur === HUMAIN;
    comment = e.finPar === 'tombe'
      ? 'par tombé'
      : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  }
  const vainqueur = gagne ? h : o;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  // Récompense : +2 médailles (et les $ des paliers), plus 2 boosters en mode collection ; une seule fois par combat.
  // Une victoire par abandon ne compte qu'après 5 tours joués.
  const cle = `${codeSalle}-${v.graine}`;
  // Médailles dans les deux modes ; boosters seulement avec nos collections.
  if (gagne && (!v.abandon || e.tourGlobal >= 5) && paquetLigne?.cle !== cle) {
    if (!collection.recompensesEnLigne.includes(cle)) {
      collection.recompensesEnLigne = [...collection.recompensesEnLigne, cle].slice(-50);
      histoire({ type: 'victoire', nation: o.def.nation, niveau: null });
      histoire({ type: 'enLigne' });
      paquetLigne = { cle, paquet: { titre: 'Victoire en ligne', boosters: recompenser(collection, 'enLigne', Math.random, 1, v.modeSalle === 'collection' && !v.rapide), ouvert: false } };
      sauver(collection);
    }
  }
  const booster = paquetLigne?.cle === cle ? sectionPaquet(paquetLigne.paquet) : '';
  // Quêtes : le combat compte une fois.
  if (!v.abandon && !quetesLigneComptees.has(cle)) {
    quetesLigneComptees.add(cle);
    combatEnAuto = v.auto;
    queteCombat(e, 'enLigne', null);
    combatEnAuto = false;
  }
  // Liste d'amis : le combat compte une fois (victoire ou défaite).
  if (v.amiIdCoach && (!v.abandon || e.tourGlobal >= 5)) {
    noterAmi(collection, v.amiIdCoach, v.amiCoach, { type: gagne ? 'victoire' : 'defaite', cle: `combat-${cle}` });
    sauver(collection);
  }
  const revanche = v.revancheMoi
    ? (v.revancheAmi ? 'Nouvelle manche…' : 'Revanche demandée : en attente de ton ami…')
    : v.revancheAmi ? 'Ton ami veut une revanche !' : '';
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(vainqueur.def)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(vainqueur.def.nom)} gagne ${comment}.</p>
        <p class="hist">${echap(moiNom())} : ${echap(h.def.nom)} · ${echap(adv())} : ${echap(o.def.nom)} · ${e.tourGlobal} tours · salle ${echap(codeSalle.toUpperCase())}</p>
        ${v.auto ? '<p class="hist">⚡ Combat joué en automatique : l\'ordinateur a joué pour vous deux, selon vos niveaux de compte.</p>' : ''}
      </section>
      ${booster}
      <div class="fin-boutons">
        ${revanche ? `<p class="statut">${revanche}</p>` : ''}
        <button class="principal" data-revanche ${v.revancheMoi ? 'disabled' : ''}>Revanche</button>
        <button class="secondaire" data-sortir>Quitter la salle</button>
      </div>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  activerReflets(app);
  app.querySelector('[data-revanche]')!.addEventListener('click', () => duel?.revanche());
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => paquetLigne && revelerPaquet(paquetLigne.paquet, ecranFinLigne));
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranMenu();
  });
}

// ---------- Navigation ----------

function route() {
  fermerFenetre();
  const h = location.hash;
  if (!collection.coach || h === '#pseudo') return ecranAccueil();
  if (h === '#amis') return ecranAmis();
  if (mode === 'ligne') return; // un combat en ligne est en cours : on n'y touche pas
  if (h === '#collection' || h === '#galerie') return ecranCollection();
  if (h === '#fusion') return ecranFusion();
  if (h === '#social') return ecranSocial();
  if (h === '#club') return ecranMonClub();
  if (h === '#histoire') return ecranHistoire();
  if (h === '#saison') return ecranSaison();
  if (h === '#quetes') return ecranQuetes();
  if (h === '#tournois') return ecranTournois();
  if (h === '#rapide') return ecranArene(true);
  quitterEchange();
  if (h === '#combat') return ecranCombatMenu();
  if (h === '#regles') return ecranRegles();
  if (h === '#tutoriel') return ecranTutoriel();
  if (h === '#arene') return ecranArene();
  if (!partie) ecranMenu();
}
window.addEventListener('hashchange', route);
route();
