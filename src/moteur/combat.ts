// Les règles du combat. Aucun affichage ici : ce fichier prend un état,
// les choix des deux joueurs, et renvoie le nouvel état avec un journal en français.

import { ACTIONS, BAT, REGLES, coutAction, trouverLutteur } from './config';
import { choisirParmi, reussit, type Hasard } from './hasard';
import type {
  Choix, DefLutteur, EtatCombat, EtatLutteur, Face, Famille, IdAction, Joueur, OptionsTour,
} from './types';

type Resultat = 'gagne' | 'perd' | 'neutre' | 'rien';

const LES_DEUX: readonly Joueur[] = [0, 1];
const autre = (j: Joueur): Joueur => (j === 0 ? 1 : 0);

// ---------- Création ----------

export function creerLutteur(def: DefLutteur): EtatLutteur {
  return {
    def,
    endurance: def.enduranceMax,
    score: 0,
    prises: [],
    periodesGagnees: 0,
    bonusFeinte: 0,
    bonusEnchainement: false,
    malusPrecisionTours: 0,
    toursSansAttaque: 0,
    historique: [],
    toursSansEndurance: 0,
    dernierSpecialTour: null,
    reductionSpeciale: false,
    initiative: false,
    habitudes: [],
    derniereReussie: null,
    attaqueIncontrable: false,
    souffleUtilise: false,
  };
}

// Durée infinie (combat rapide et entre amis) : `rapide` est aussi vrai (récompenses du combat
// rapide), mais le combat ne s'arrête ni en fin de période ni à 10 points d'écart.
export function creerCombat(a: string | DefLutteur, b: string | DefLutteur, opts: { rapide?: boolean; enchainement?: boolean; infini?: boolean; epuisement?: number } = {}): EtatCombat {
  const defA = typeof a === 'string' ? trouverLutteur(a) : a;
  const defB = typeof b === 'string' ? trouverLutteur(b) : b;
  return {
    joueurs: [creerLutteur(defA), creerLutteur(defB)],
    periode: 1,
    tour: 1,
    tourGlobal: 1,
    dernierMarqueur: null,
    termine: false,
    vainqueur: null,
    finPar: null,
    journal: [],
    rapide: !!opts.rapide || !!opts.infini,
    enchainement: !!opts.enchainement,
    infini: !!opts.infini,
    epuisementDes: opts.infini ? opts.epuisement ?? REGLES.infini.debutEpuisement : undefined,
    mortSubite: false,
  };
}

// Nombre de tours d'une période : 10, ou 12 en mode Enchaînement (4 séquences de 3 actions).
export function toursPeriode(e: EtatCombat): number {
  return e.enchainement ? REGLES.enchainement.toursParPeriode : REGLES.toursParPeriode;
}

// Durée infinie : surcoût de fatigue de chaque action (+1 dès le tour 25, puis +1 tous les 10 tours).
export function surcoutFatigue(e: EtatCombat): number {
  const I = REGLES.infini;
  if (!e.infini || e.tourGlobal < I.debutSurcout) return 0;
  return 1 + Math.floor((e.tourGlobal - I.debutSurcout) / I.palier);
}

// Durée infinie : la fatigue a commencé (tour 20 et après).
export function enFatigue(e: EtatCombat): boolean {
  return !!e.infini && e.tourGlobal >= REGLES.infini.debutFatigue;
}

// Tous les combien de tours on récupère : 2, puis en durée infinie 3 dès le tour 20, 4 dès le 30…
export function intervalleRecuperation(e: EtatCombat): number {
  const base = REGLES.recuperationReguliere.tousLesTours;
  if (!enFatigue(e)) return base;
  const I = REGLES.infini;
  return base + 1 + Math.floor((e.tourGlobal - I.debutFatigue) / I.palier);
}

// Niveau de fatigue (0 = aucune) : il monte à chaque nouvel effet (tours 20, 25, 30, 35…).
export function niveauFatigue(e: EtatCombat): number {
  if (!enFatigue(e)) return 0;
  return 1 + Math.floor((e.tourGlobal - REGLES.infini.debutFatigue) / (REGLES.infini.palier / 2));
}

// ---------- Précision ----------

export function precisionDe(endurance: number): number {
  return (100 + endurance) / 200;
}

// Endurance à partir de laquelle les actions ne ratent jamais : la moitié de l'endurance max.
export const seuilPrecision = (enduranceMax: number) => REGLES.precision.partPleine * enduranceMax;

// 100 % à partir de la moitié de l'endurance max, puis une baisse régulière jusqu'à 40 % à 0 d'endurance.
export function chanceReussite(precision: number, enduranceMax: number): number {
  const P = REGLES.precision;
  const seuil = seuilPrecision(enduranceMax);
  const endurance = precision * 200 - 100;
  if (endurance >= seuil) return 1;
  return P.chanceMinimale + (1 - P.chanceMinimale) * Math.max(0, endurance) / seuil;
}

// ---------- Ce qu'un joueur peut faire ----------

// Baisse de coût d'une action ce tour-ci, grâce à l'action réussie au tour précédent
// (Bras tiré puis attaque, ou combo Simple jambe puis Double jambe ; non cumulable).
export function reductionCout(etat: EtatCombat, j: Joueur, id: IdAction): number {
  const avant = etat.joueurs[j].derniereReussie;
  const C = REGLES.combos.enchainementJambes;
  if (avant === C.avant && id === C.apres) return C.reductionCout;
  if (avant === 'bras_tire' && ACTIONS[id].famille === 'attaque') return REGLES.brasTire.reductionCout;
  return 0;
}

// Coût réel d'une action (non spéciale) pour ce tour.
export function coutDuTour(etat: EtatCombat, j: Joueur, id: IdAction): number {
  const base = coutAction(etat.joueurs[j].def, id);
  const r = reductionCout(etat, j, id);
  return (r ? Math.max(REGLES.fusion.coutMinimum, base - r) : base) + surcoutFatigue(etat);
}

export function actionsJouables(etat: EtatCombat, j: Joueur): IdAction[] {
  const l = etat.joueurs[j];
  if (l.endurance <= 0) return [];
  return l.def.actions.filter((id) => coutDuTour(etat, j, id) <= l.endurance);
}

// Nom du combo que déclencherait cette action ce tour-ci (si elle réussit), sinon null.
export function comboPossible(etat: EtatCombat, j: Joueur, id: IdAction): string | null {
  const avant = etat.joueurs[j].derniereReussie;
  const C = REGLES.combos;
  const f = ACTIONS[id].famille;
  if (avant === C.passageDansLeDos.avant && id === C.passageDansLeDos.apres) return 'Passage dans le dos';
  if (avant === C.enchainementJambes.avant && id === C.enchainementJambes.apres) return 'Enchaînement aux jambes';
  if (avant === C.contreTemps.avant && f === 'attaque') return 'Contre-temps';
  if (avant === C.esquiveContre.avant && f === 'contre') return 'Esquive et contre';
  return null;
}

// Second souffle : une fois par combat, sous le seuil d'endurance.
export function souffleDispo(etat: EtatCombat, j: Joueur): boolean {
  const l = etat.joueurs[j];
  return !l.souffleUtilise && l.endurance < REGLES.souffle.seuil;
}

export function multiplicateurSpeciale(etat: EtatCombat, j: Joueur): number {
  const S = REGLES.speciale;
  const l = etat.joueurs[j];
  let m: number;
  if (etat.periode === 1) m = etat.tour <= S.periode1DernierTourReduit ? S.coutReduit : S.coutPlein;
  else if (etat.periode === 2) m = l.endurance > S.periode2SeuilEndurance * l.def.enduranceMax ? S.coutReduit : S.coutPlein;
  else m = S.coutPlein;
  if (l.reductionSpeciale) m -= S.reductionApresReussite;
  return m;
}

export function coutSpeciale(etat: EtatCombat, j: Joueur, id: IdAction): number {
  return coutAction(etat.joueurs[j].def, id) * multiplicateurSpeciale(etat, j) + surcoutFatigue(etat);
}

export function specialeOuverte(etat: EtatCombat, j: Joueur): boolean {
  const S = REGLES.speciale;
  const l = etat.joueurs[j];
  if (etat.tour < S.premierTour) return false;
  if (etat.periode === 3 && etat.tour > S.periode3DernierTour) return false;
  if (l.dernierSpecialTour !== null && etat.tourGlobal - l.dernierSpecialTour <= S.toursRecharge) return false;
  return true;
}

export function peutJouerSpeciale(etat: EtatCombat, j: Joueur, id: IdAction): boolean {
  const l = etat.joueurs[j];
  return (
    l.def.actions.includes(id) &&
    ACTIONS[id].famille === l.def.familleSpeciale &&
    specialeOuverte(etat, j) &&
    coutSpeciale(etat, j, id) <= l.endurance
  );
}

// Initiative : le joueur voit 2 actions de l'adversaire, dont la vraie, dans un ordre au hasard.
export function apercuInitiative(
  etat: EtatCombat, j: Joueur, actionAdverse: IdAction | 'lutte' | 'souffle', hasard: Hasard,
): (IdAction | 'lutte' | 'souffle')[] | null {
  if (!etat.joueurs[j].initiative) return null;
  const leurres = etat.joueurs[autre(j)].def.actions.filter((a) => a !== actionAdverse);
  if (leurres.length === 0) return [actionAdverse];
  const leurre = choisirParmi(hasard, leurres);
  return reussit(hasard, 0.5) ? [actionAdverse, leurre] : [leurre, actionAdverse];
}

// ---------- Outils internes ----------

function log(e: EtatCombat, texte: string) {
  e.journal.push(texte);
}

function nomChoix(l: EtatLutteur, c: Choix): string {
  if (c.action === 'lutte') return `${l.def.nom} (Lutte)`;
  if (c.action === 'souffle') return `${l.def.nom} (Souffler)`;
  return `${l.def.nom} (${ACTIONS[c.action].nom}${c.speciale ? ' spéciale' : ''})`;
}

function marquer(e: EtatCombat, j: Joueur, points: number, raison: string) {
  if (points <= 0) return;
  const l = e.joueurs[j];
  l.score += points;
  l.prises.push(points);
  e.dernierMarqueur = j;
  log(e, `${l.def.nom} marque ${points} point${points > 1 ? 's' : ''} (${raison}).`);
}

function retirerEndurance(l: EtatLutteur, quantite: number) {
  l.endurance = Math.max(0, l.endurance - quantite);
}

function ajouterEndurance(l: EtatLutteur, quantite: number) {
  l.endurance = Math.min(l.def.enduranceMax, l.endurance + quantite);
}

// Valeur d'une attaque, bonus compris. Un contre renvoie cette valeur (bonus de l'attaquant compris,
// sans que l'attaquant perde son bonus de feinte : son attaque n'a pas réussi).
function valeurAttaque(e: EtatCombat, j: Joueur, id: IdAction, endDebut: [number, number]): number {
  const l = e.joueurs[j];
  let pts = ACTIONS[id].points + pointsCombo(l, id);
  if (l.bonusFeinte > 0) pts += REGLES.bonusFeinte;
  if (l.bonusEnchainement) pts += REGLES.speciale.bonusEnchainementFeinte;
  if (endDebut[j] >= 2 * endDebut[autre(j)]) pts += REGLES.bonusDoubleEndurance;
  return pts;
}

// Points de combo d'une attaque, selon l'action réussie au tour précédent.
export function pointsCombo(l: EtatLutteur, id: IdAction): number {
  const C = REGLES.combos;
  if (l.derniereReussie === C.passageDansLeDos.avant && id === C.passageDansLeDos.apres) return C.passageDansLeDos.points;
  if (l.derniereReussie === C.enchainementJambes.avant && id === C.enchainementJambes.apres) return C.enchainementJambes.points;
  return 0;
}

function perteDesequilibre(points: number): number {
  for (const palier of REGLES.desequilibre) if (points >= palier.pointsMin) return palier.perte;
  return 0;
}

function valider(e: EtatCombat, j: Joueur, c: Choix, sequence = false): Choix {
  const l = e.joueurs[j];
  // Mode Enchaînement : la séquence a été choisie d'avance. Une action devenue impossible
  // (plus assez d'endurance, spéciale plus disponible, souffle déjà pris) est remplacée.
  if (sequence) {
    const jouables = actionsJouables(e, j);
    if (c.action === 'souffle' && !souffleDispo(e, j)) return { action: 'lutte' };
    const a = c.action;
    if (a === 'lutte') return { action: 'lutte' };
    if (a !== 'souffle') {
      if (c.speciale && !peutJouerSpeciale(e, j, a)) c = { action: a };
      if (!c.speciale && !jouables.includes(a)) return { action: 'lutte' };
    }
  }
  if (c.action === 'souffle') {
    if (!souffleDispo(e, j)) throw new Error(`${l.def.nom} ne peut pas souffler maintenant.`);
    return { action: 'souffle' };
  }
  const jouables = actionsJouables(e, j);
  if (jouables.length === 0) return { action: 'lutte' };
  if (c.action === 'lutte') throw new Error(`${l.def.nom} a encore des actions jouables : Lutte n'est pas autorisée.`);
  if (!jouables.includes(c.action)) throw new Error(`${l.def.nom} ne peut pas jouer ${c.action}.`);
  if (c.speciale && !peutJouerSpeciale(e, j, c.action)) {
    throw new Error(`${l.def.nom} ne peut pas jouer ${c.action} en action spéciale maintenant.`);
  }
  return { action: c.action, speciale: !!c.speciale };
}

// Compare deux actions qui ont toutes les deux passé leur tirage de précision.
// Situations du tour qui changent le duel « contre contre attaque ».
export interface OptionsDuel {
  incontrable?: [boolean, boolean]; // Changement de niveau au tour précédent : l'attaque ne peut pas être contrée
  // Même famille (26/11/2026) : un combo ou une attaque spéciale n'est pas bloqué par l'égalité de famille.
  priorite?: [boolean, boolean];
  chances?: [number, number]; // chance de réussite du tour (départage de deux priorités)
}

// Pourquoi un duel de même famille a été gagné (pour le journal).
export type RaisonMemeFamille = 'priorite' | 'precision' | 'force' | 'endurance';

function duel(
  e: EtatCombat, f: [Famille, Famille], endDebut: [number, number], speciale: [boolean, boolean],
  opts: OptionsDuel = {},
): { res: [Resultat, Resultat]; raison?: RaisonMemeFamille } {
  const [f0, f1] = f;
  // Contre spécial : bat toujours une attaque ou une feinte.
  for (const c of LES_DEUX) {
    const a = autre(c);
    if (speciale[c] && f[c] === 'contre' && (f[a] === 'attaque' || f[a] === 'feinte')) {
      const res: [Resultat, Resultat] = ['perd', 'perd'];
      res[c] = 'gagne';
      return { res };
    }
  }
  if (f0 === f1) {
    const gagne = (j: Joueur, raison: RaisonMemeFamille): { res: [Resultat, Resultat]; raison: RaisonMemeFamille } =>
      ({ res: j === 0 ? ['gagne', 'perd'] : ['perd', 'gagne'], raison });
    // Combo ou attaque spéciale : prioritaire. Deux priorités : la meilleure chance de réussite du
    // tour, puis la plus grande force ; sinon, la règle habituelle.
    const [p0, p1] = opts.priorite ?? [false, false];
    if (p0 !== p1) return gagne(p0 ? 0 : 1, 'priorite');
    if (p0 && p1) {
      const [c0, c1] = opts.chances ?? [0, 0];
      if (c0 !== c1) return gagne(c0 > c1 ? 0 : 1, 'precision');
      const [F0, F1] = [e.joueurs[0].def.force, e.joueurs[1].def.force];
      if (F0 !== F1) return gagne(F0 > F1 ? 0 : 1, 'force');
    }
    if (endDebut[0] >= 2 * endDebut[1]) return gagne(0, 'endurance');
    if (endDebut[1] >= 2 * endDebut[0]) return gagne(1, 'endurance');
    return { res: ['neutre', 'neutre'] };
  }
  for (const c of LES_DEUX) {
    const a = autre(c);
    if (f[c] === 'contre' && f[a] === 'attaque') {
      // Depuis le 25/11/2026 (soir) : le contre qui passe son tirage de précision prend l'attaque,
      // sans condition d'endurance ni de force. Seule exception : l'attaque préparée par un
      // Changement de niveau, impossible à contrer.
      const res: [Resultat, Resultat] = ['perd', 'perd'];
      res[opts.incontrable?.[a] ? a : c] = 'gagne';
      return { res };
    }
  }
  if (BAT[f0].includes(f1)) return { res: ['gagne', 'perd'] };
  return { res: ['perd', 'gagne'] };
}

const LIBELLE: Record<Famille, string> = {
  attaque: 'l\'attaque', defense: 'la défense', contre: 'le contre', feinte: 'la feinte',
};
const maj = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Phrase qui explique pourquoi un duel a été gagné (pour le journal).
function expliquerDuel(
  e: EtatCombat, f: [Famille, Famille], res: [Resultat, Resultat], spe: [boolean, boolean], opts: OptionsDuel = {},
  raison?: RaisonMemeFamille,
): string {
  const g: Joueur = res[0] === 'gagne' ? 0 : 1;
  const p = autre(g);
  const nomG = e.joueurs[g].def.nom;
  const nomP = e.joueurs[p].def.nom;
  if (spe[g] && f[g] === 'contre' && (f[p] === 'attaque' || f[p] === 'feinte')) {
    return `Le contre spécial de ${nomG} prend ${LIBELLE[f[p]]} de ${nomP} à contretemps.`;
  }
  if (f[g] === f[p]) {
    const quoi = spe[g] && f[g] === 'attaque' ? 'son attaque spéciale' : 'son combo';
    if (raison === 'priorite') return `Même famille, mais ${nomG} enchaîne ${quoi} : pas de blocage, ${LIBELLE[f[g]]} l'emporte.`;
    if (raison === 'precision') return `Priorité des deux côtés : ${nomG} a la meilleure chance de réussite, ${LIBELLE[f[g]]} l'emporte.`;
    if (raison === 'force') return `Priorité des deux côtés et même chance de réussite : ${nomG} est plus fort, ${LIBELLE[f[g]]} l'emporte.`;
    return `${nomG} a au moins le double d'endurance : ${LIBELLE[f[g]]} l'emporte.`;
  }
  if (f[g] === 'contre' && f[p] === 'attaque') return `Le contre de ${nomG} prend l'attaque de ${nomP} et la renvoie.`;
  if (f[g] === 'attaque' && f[p] === 'contre' && opts.incontrable?.[g]) {
    return `${nomG} a changé de niveau : son attaque ne peut pas être contrée.`;
  }
  return `${maj(LIBELLE[f[g]])} de ${nomG} l'emporte sur ${LIBELLE[f[p]]} de ${nomP}.`;
}

// Attaque spéciale plus forte que l'adversaire : elle peut percer une défense ou un
// contre (non spéciaux). Chance = 1 − force de l'adversaire / force de l'attaquant.
function tenterPercee(
  e: EtatCombat, choix: [Choix, Choix], fam: [Famille | null, Famille | null], hasard: Hasard,
): Joueur | null {
  for (const j of LES_DEUX) {
    const o = autre(j);
    if (!choix[j].speciale || fam[j] !== 'attaque') continue;
    if (fam[o] !== 'defense' && fam[o] !== 'contre') return null;
    if (choix[o].speciale) return null;
    const fj = e.joueurs[j].def.force;
    const fo = e.joueurs[o].def.force;
    if (fj <= fo) return null;
    const chance = 1 - fo / fj;
    if (reussit(hasard, chance)) {
      log(e, `${e.joueurs[j].def.nom} est plus fort : son attaque spéciale perce ${LIBELLE[fam[o]!]} de ${e.joueurs[o].def.nom} (${Math.round(chance * 100)} % de chances).`);
      return j;
    }
    log(e, `${e.joueurs[j].def.nom} tente de percer ${LIBELLE[fam[o]!]} en force, sans succès (${Math.round(chance * 100)} % de chances).`);
    return null;
  }
  return null;
}

// Utilisé par l'ordinateur « fort » pour prévoir l'issue d'un duel (aucun hasard, aucun effet).
export function comparerFamilles(
  e: EtatCombat, f: [Famille, Famille], endurances: [number, number], speciale: [boolean, boolean],
): 'gagne' | 'perd' | 'neutre' {
  const J = e.joueurs;
  const r = duel(e, f, endurances, speciale, { incontrable: [J[0].attaqueIncontrable, J[1].attaqueIncontrable] }).res[0];
  return r === 'gagne' ? 'gagne' : r === 'perd' ? 'perd' : 'neutre';
}

function tenterTombe(
  e: EtatCombat, j: Joueur, endDebut: [number, number], hasard: Hasard, options: OptionsTour,
): boolean {
  const o = autre(j);
  const T = REGLES.tombe;
  const chance =
    endDebut[j] > endDebut[o] ? T.plusEndurance : endDebut[j] === endDebut[o] ? T.egalite : T.moinsEndurance;
  const nom = e.joueurs[j].def.nom;
  const nomAdv = e.joueurs[o].def.nom;
  if (!reussit(hasard, chance)) {
    log(e, `${nom} tente un tombé, sans succès.`);
    return false;
  }
  const choixDefenseur: Face = options.choisirFace?.(o, e) ?? (reussit(hasard, 0.5) ? 'pile' : 'face');
  const piece: Face = reussit(hasard, 0.5) ? 'pile' : 'face';
  if (choixDefenseur === piece) {
    log(e, `${nom} tente un tombé ! ${nomAdv} annonce ${choixDefenseur}, la pièce tombe sur ${piece} : il s'en sort.`);
    return false;
  }
  log(e, `${nom} tente un tombé ! ${nomAdv} annonce ${choixDefenseur}, la pièce tombe sur ${piece} : TOMBÉ.`);
  return true;
}

function finirCombat(e: EtatCombat, vainqueur: Joueur, par: 'periodes' | 'tombe') {
  e.termine = true;
  e.vainqueur = vainqueur;
  e.finPar = par;
  log(e, `Fin du combat : victoire de ${e.joueurs[vainqueur].def.nom}${par === 'tombe' ? ' par tombé' : ''}.`);
}

// Gagnant d'une période terminée à égalité de points ou non.
export function gagnantPeriode(e: EtatCombat, hasard: Hasard): Joueur {
  const [a, b] = e.joueurs;
  if (a.score !== b.score) return a.score > b.score ? 0 : 1;
  // 1. Le plus de prises de la plus haute valeur, puis de la suivante, etc.
  const valeurs = [...new Set([...a.prises, ...b.prises])].sort((x, y) => y - x);
  for (const v of valeurs) {
    const na = a.prises.filter((p) => p === v).length;
    const nb = b.prises.filter((p) => p === v).length;
    if (na !== nb) return na > nb ? 0 : 1;
  }
  // 2. Le dernier à avoir marqué.
  if (e.dernierMarqueur !== null) return e.dernierMarqueur;
  // 3. Personne n'a marqué (0-0) : le lutteur avec le plus d'endurance ; à endurance égale, au hasard.
  if (a.endurance !== b.endurance) return a.endurance > b.endurance ? 0 : 1;
  return reussit(hasard, 0.5) ? 0 : 1;
}

function finirPeriode(e: EtatCombat, g: Joueur, raison: string) {
  const l = e.joueurs[g];
  l.periodesGagnees++;
  log(e, `Période ${e.periode} gagnée par ${l.def.nom} (${raison}) : ${e.joueurs[0].score} - ${e.joueurs[1].score}.`);
  if (l.periodesGagnees >= REGLES.periodesPourGagner) {
    finirCombat(e, g, 'periodes');
    return;
  }
  e.periode++;
  e.tour = 1;
  e.dernierMarqueur = null;
  for (const x of e.joueurs) {
    x.score = 0;
    x.prises = [];
    x.bonusFeinte = 0;
    x.bonusEnchainement = false;
    x.malusPrecisionTours = 0;
    x.toursSansAttaque = 0;
    x.historique = [];
    x.initiative = false;
    x.toursSansEndurance = 0;
    x.derniereReussie = null;
    x.attaqueIncontrable = false;
    ajouterEndurance(x, x.def.recuperation * x.def.enduranceMax);
  }
}

// Combat rapide : une seule période, puis mort subite en cas d'égalité.
function finTourRapide(e: EtatCombat, ecart: number, hasard: Hasard): EtatCombat {
  const meneur: Joueur = ecart > 0 ? 0 : 1;
  if (Math.abs(ecart) >= REGLES.ecartSuperiorite) {
    log(e, `Supériorité technique (${e.joueurs[0].score} - ${e.joueurs[1].score}).`);
    finirCombat(e, meneur, 'periodes');
  } else if (e.mortSubite && ecart !== 0) {
    log(e, `Mort subite : ${e.joueurs[meneur].def.nom} marque le premier.`);
    finirCombat(e, meneur, 'periodes');
  } else if (e.mortSubite && e.tour >= toursPeriode(e) + REGLES.rapide.mortSubiteMax) {
    const g = gagnantPeriode(e, hasard);
    log(e, `Toujours personne en mort subite : ${e.joueurs[g].def.nom} l'emporte au départage.`);
    finirCombat(e, g, 'periodes');
  } else if (!e.mortSubite && e.tour >= toursPeriode(e)) {
    if (ecart !== 0) {
      log(e, `Fin de la période : ${e.joueurs[0].score} - ${e.joueurs[1].score}.`);
      finirCombat(e, meneur, 'periodes');
    } else {
      e.mortSubite = true;
      log(e, `Égalité ${e.joueurs[0].score} - ${e.joueurs[1].score} : mort subite, le premier qui marque gagne !`);
      e.tour++;
    }
  } else {
    e.tour++;
  }
  return e;
}

// ---------- Le tour ----------

export function jouerTour(
  etat: EtatCombat, choixA: Choix, choixB: Choix, hasard: Hasard, options: OptionsTour = {},
): EtatCombat {
  if (etat.termine) throw new Error('Le combat est terminé.');
  const e: EtatCombat = structuredClone(etat);
  const J = e.joueurs;
  const choix: [Choix, Choix] = [valider(e, 0, choixA, options.sequence), valider(e, 1, choixB, options.sequence)];
  for (const j of LES_DEUX) {
    const voulu = [choixA, choixB][j];
    if (options.sequence && voulu.action !== choix[j].action && choix[j].action === 'lutte') {
      log(e, `${J[j].def.nom} n'a plus de quoi jouer ce qu'il avait prévu : il lutte.`);
    }
  }
  e.derniersChoix = [choix[0], choix[1]];
  const endDebut: [number, number] = [J[0].endurance, J[1].endurance];
  const fam = choix.map((c) => (c.action === 'lutte' || c.action === 'souffle' ? null : ACTIONS[c.action].famille)) as [
    Famille | null, Famille | null,
  ];

  log(e, `${e.infini ? 'Tour' : `${e.mortSubite ? 'Mort subite' : `Période ${e.periode}`}, tour`} ${e.tour} : ${nomChoix(J[0], choix[0])} contre ${nomChoix(J[1], choix[1])}.`);
  // Habitudes : les familles d'actions jouées récemment.
  for (const j of LES_DEUX) {
    const f = fam[j];
    if (!f) continue;
    J[j].habitudes.push(f);
    if (J[j].habitudes.length > REGLES.ia.fort.memoireHabitudes) J[j].habitudes.shift();
  }

  // 1. Paiement de l'endurance.
  for (const j of LES_DEUX) {
    const c = choix[j];
    if (c.action === 'lutte' || c.action === 'souffle') continue;
    const cout = c.speciale ? coutSpeciale(e, j, c.action) : coutDuTour(e, j, c.action);
    if (c.speciale) {
      J[j].dernierSpecialTour = e.tourGlobal;
      J[j].reductionSpeciale = false;
    }
    retirerEndurance(J[j], cout);
  }

  // 2. Tirage de précision, avant de comparer les familles.
  const passe: [boolean, boolean] = [false, false];
  const chances: [number, number] = [0, 0]; // chance de réussite du tour (départage des priorités)
  for (const j of LES_DEUX) {
    const id = choix[j].action;
    if (options.annulee === j) {
      log(e, `L'action de ${J[j].def.nom} est annulée : sa chaîne est brisée.`);
      continue;
    }
    if (id === 'lutte' || id === 'souffle') continue;
    // Actions qui ne peuvent pas rater : attaque juste après un sprawl réussi (combo Contre-temps),
    // Tour de hanche avec plus de force que l'adversaire.
    if (fam[j] === 'attaque' && J[j].derniereReussie === REGLES.combos.contreTemps.avant) {
      passe[j] = true;
      chances[j] = 1;
      log(e, `Combo « Contre-temps » : après son sprawl, ${J[j].def.nom} attaque sans pouvoir rater.`);
      continue;
    }
    if (id === 'tour_hanche' && J[j].def.force > J[autre(j)].def.force) {
      passe[j] = true;
      chances[j] = 1;
      log(e, `${J[j].def.nom} est plus fort : son tour de hanche ne peut pas rater.`);
      continue;
    }
    const sansMalus = id === 'simple_jambe' && REGLES.simpleJambeSansMalus;
    const malus = fam[j] === 'attaque' && J[j].malusPrecisionTours > 0 && !sansMalus ? REGLES.matraquage.malusPrecision : 0;
    const p = precisionDe(endDebut[j]) - malus;
    chances[j] = chanceReussite(p, J[j].def.enduranceMax);
    passe[j] = reussit(hasard, chances[j]);
    if (!passe[j]) log(e, `${J[j].def.nom} rate son action (précision ${p.toFixed(2).replace('.', ',')}) : action dans le vent.`);
  }
  for (const l of J) if (l.malusPrecisionTours > 0) l.malusPrecisionTours--;

  // 3. Comparaison des familles.
  let res: [Resultat, Resultat] = ['rien', 'rien'];
  const spe: [boolean, boolean] = [!!choix[0].speciale, !!choix[1].speciale];
  const percee = passe[0] && passe[1] ? tenterPercee(e, choix, fam, hasard) : null;
  if (percee !== null) {
    res[percee] = 'gagne';
    res[autre(percee)] = 'perd';
  } else if (passe[0] && passe[1]) {
    // Priorité en cas de même famille : l'action qui termine un combo, ou une attaque spéciale.
    const prioritaire = (j: Joueur) => {
      const id = choix[j].action;
      if (id === 'lutte' || id === 'souffle') return false;
      return comboPossible(e, j, id) !== null || (spe[j] && fam[j] === 'attaque');
    };
    const opts: OptionsDuel = {
      incontrable: [J[0].attaqueIncontrable, J[1].attaqueIncontrable], priorite: [prioritaire(0), prioritaire(1)], chances,
    };
    const d = duel(e, [fam[0]!, fam[1]!], endDebut, spe, opts);
    res = d.res;
    if (res[0] === 'neutre') log(e, 'Même famille et pas le double d\'endurance : personne ne marque.');
    else log(e, expliquerDuel(e, [fam[0]!, fam[1]!], res, spe, opts, d.raison));
    // Sortie de zone : un contre normal ne la prend qu'une fois sur 2.
    for (const c of LES_DEUX) {
      const a = autre(c);
      if (res[c] === 'gagne' && fam[c] === 'contre' && !spe[c] && choix[a].action === 'sortie_zone'
        && !reussit(hasard, REGLES.sortieZone.chanceContre)) {
        res[c] = 'perd';
        res[a] = 'gagne';
        log(e, `${J[a].def.nom} pousse ${J[c].def.nom} hors de la zone avant que le contre ne prenne.`);
      }
    }
  } else {
    for (const j of LES_DEUX) if (passe[j]) res[j] = 'gagne';
  }
  // Feinte face à une attaque : même si l'attaque rate, la feinte est dissipée (aucun effet).
  for (const j of LES_DEUX) {
    if (fam[j] === 'feinte' && fam[autre(j)] === 'attaque' && res[j] === 'gagne') {
      res[j] = 'rien';
      log(e, `${J[autre(j)].def.nom} attaque : la feinte de ${J[j].def.nom} est dissipée, sans effet.`);
    }
  }

  // 4. Effets.
  const bonusSuivant: [boolean, boolean] = [false, false];
  const bonusUtilise: [boolean, boolean] = [false, false]; // bonus de feinte servi ce tour
  const enchainementSuivant: [boolean, boolean] = [false, false];
  const initiativeSuivante: [boolean, boolean] = [false, false];
  const incontrableSuivant: [boolean, boolean] = [false, false];
  const tombe = new Set<Joueur>();

  for (const j of LES_DEUX) {
    const o = autre(j);
    const l = J[j];
    const adv = J[o];
    const c = choix[j];
    if (options.annulee === j) continue; // action annulée (chaîne brisée) : aucun effet

    if (c.action === 'lutte') {
      if (reussit(hasard, REGLES.lutte.chance)) {
        const pts = reussit(hasard, 0.5) ? REGLES.lutte.pointsMin : REGLES.lutte.pointsMax;
        marquer(e, j, pts, 'Lutte');
      } else {
        log(e, `${l.def.nom} lutte sans résultat.`);
      }
      continue;
    }
    if (c.action === 'souffle') {
      const S = REGLES.souffle;
      ajouterEndurance(l, S.gain);
      l.souffleUtilise = true;
      log(e, `${l.def.nom} reprend son souffle : +${S.gain} d'endurance.`);
      if (fam[o] === 'attaque') marquer(e, o, S.penalite, `${l.def.nom} souffle pendant l'attaque`);
      continue;
    }
    if (res[j] !== 'gagne') continue;

    const a = ACTIONS[c.action];
    const actionAdv = choix[o].action;
    const opposee = passe[o] && actionAdv !== 'lutte' && actionAdv !== 'souffle' ? ACTIONS[actionAdv] : null;
    let speDeclenchee = !!c.speciale;

    switch (a.famille) {
      case 'attaque': {
        if (l.bonusFeinte > 0) bonusUtilise[j] = true;
        const C = REGLES.combos;
        if (l.derniereReussie === C.passageDansLeDos.avant && a.id === C.passageDansLeDos.apres) {
          log(e, `Combo « Passage dans le dos » : ${l.def.nom} enchaîne matraquage et ceinture arrière (+${C.passageDansLeDos.points}).`);
        } else if (l.derniereReussie === C.enchainementJambes.avant && a.id === C.enchainementJambes.apres) {
          log(e, `Combo « Enchaînement aux jambes » : ${l.def.nom} passe de la simple à la double jambe (+${C.enchainementJambes.points}).`);
        }
        marquer(e, j, valeurAttaque(e, j, a.id, endDebut), `${a.nom}${l.bonusFeinte > 0 ? ' + bonus de feinte' : ''}`);
        if (c.speciale) tombe.add(j);
        break;
      }

      case 'defense': {
        const bloque = opposee?.famille === 'attaque';
        if (c.speciale) marquer(e, j, REGLES.speciale.pointsDefense, `${a.nom} spéciale : renversement`);
        else if (a.points > 0 && bloque) {
          const enPlus = a.id === 'sprawl' && opposee!.id === 'double_jambe' ? REGLES.sprawlSurDoubleJambe : 0;
          marquer(e, j, a.points + enPlus, `${a.nom}${enPlus ? ' sur la double jambe' : ''}`);
        }
        if (bloque && a.id === 'parade') {
          retirerEndurance(adv, REGLES.parade.perteAttaquant);
          log(e, `La parade de ${l.def.nom} fatigue ${adv.def.nom} : −${REGLES.parade.perteAttaquant} d'endurance.`);
        }
        if (bloque && opposee!.points >= REGLES.grosseAttaqueBloquee.pointsMin) {
          retirerEndurance(adv, REGLES.grosseAttaqueBloquee.perte);
          log(e, `${adv.def.nom} s'épuise sur sa grosse attaque bloquée : −${REGLES.grosseAttaqueBloquee.perte} d'endurance.`);
        }
        if (a.id === 'esquive') {
          // L'esquive ne fait pas récupérer, mais peut donner l'initiative quand elle évite une attaque.
          if (bloque && reussit(hasard, REGLES.esquive.chanceInitiative)) {
            initiativeSuivante[j] = true;
            log(e, `${l.def.nom} esquive et prend l'initiative pour le prochain tour.`);
          }
        } else {
          const R = REGLES.recuperationDefense;
          const taux = l.endurance < l.def.enduranceMax / 2 ? R.sousMoitie : R.auDessus;
          ajouterEndurance(l, taux * l.def.enduranceMax);
          log(e, `${l.def.nom} récupère ${Math.round(taux * 100)} % d'endurance.`);
        }
        break;
      }

      case 'contre': {
        const ench = l.bonusEnchainement ? REGLES.speciale.bonusEnchainementFeinte : 0;
        const bf = l.bonusFeinte > 0 ? REGLES.bonusFeinte : 0; // bonus de feinte : sert aussi au contre
        if (bf) bonusUtilise[j] = true;
        const extras = `${ench ? ' + enchaînement' : ''}${bf ? ' + bonus de feinte' : ''}`;
        if (opposee?.famille === 'attaque') {
          const v = valeurAttaque(e, o, opposee.id, endDebut);
          // La Relance (non spéciale) ne renvoie que la moitié des points (arrondie au-dessus).
          const moitie = a.id === 'relance' && !c.speciale;
          const EC = REGLES.combos.esquiveContre;
          const combo = l.derniereReussie === EC.avant ? EC.points : 0;
          if (combo) log(e, `Combo « Esquive et contre » : ${l.def.nom} prend l'attaque à contretemps (+${combo}).`);
          const renvoi = (moitie ? Math.ceil(v * REGLES.relance.partRenvoyee) : v) + combo;
          marquer(e, j, renvoi + ench + bf, `${a.nom} : ${moitie ? 'la moitié des points' : 'points'} de l'attaque renvoyés${extras}`);
          const perte = perteDesequilibre(v);
          retirerEndurance(adv, perte * adv.def.enduranceMax);
          log(e, `${adv.def.nom} est déséquilibré et perd ${Math.round(perte * 100)} % d'endurance.`);
          if (a.id === 'cravate' && REGLES.attaquesAuxJambes.includes(opposee.id)) {
            retirerEndurance(adv, REGLES.cravate.perteEndurance);
            log(e, `${l.def.nom} prend la tête en cravate : ${adv.def.nom} perd ${REGLES.cravate.perteEndurance} d'endurance de plus.`);
          }
        } else if (a.id === 'relance' && opposee?.famille === 'defense') {
          marquer(e, j, REGLES.relance.pointsSurDefense + ench + bf, `${a.nom} : la défense est surprise${extras}`);
        } else if (ench || bf) {
          marquer(e, j, ench + bf, `${a.nom} réussi :${extras.slice(2)}`);
        }
        if (c.speciale) {
          const famAdv = actionAdv === 'lutte' || actionAdv === 'souffle' ? null : ACTIONS[actionAdv].famille;
          if (famAdv === 'attaque' || famAdv === 'feinte') tombe.add(j);
          else {
            speDeclenchee = false;
            log(e, `Le contre spécial de ${l.def.nom} ne se déclenche que face à une attaque ou une feinte : pas de tentative de tombé.`);
          }
        }
        break;
      }

      case 'feinte':
        if (c.speciale) {
          marquer(e, j, REGLES.speciale.pointsFeinte, `${a.nom} spéciale : l'adversaire glisse`);
          enchainementSuivant[j] = true;
          log(e, `${l.def.nom} pourra enchaîner : +${REGLES.speciale.bonusEnchainementFeinte} si son attaque ou son contre réussit au prochain tour.`);
        } else if (a.id === 'changement_niveau') {
          incontrableSuivant[j] = true;
          log(e, `${l.def.nom} change de niveau : son attaque du prochain tour ne pourra pas être contrée.`);
        } else bonusSuivant[j] = true;
        if (a.id === 'matraquage') {
          retirerEndurance(adv, REGLES.matraquage.perteEndurance * adv.def.enduranceMax);
          adv.malusPrecisionTours = REGLES.matraquage.tours;
          log(e, `${adv.def.nom} perd 5 % d'endurance et 5 % de précision sur ses attaques pendant 2 tours.`);
        }
        if (opposee?.famille === 'defense') {
          retirerEndurance(adv, REGLES.feinteSurDefense.perteEndurance * adv.def.enduranceMax);
          log(e, `${adv.def.nom} perd 10 % d'endurance sur la feinte.`);
          if (reussit(hasard, REGLES.feinteSurDefense.chanceInitiative)) {
            initiativeSuivante[j] = true;
            log(e, `${l.def.nom} prend l'initiative pour le prochain tour.`);
          }
        }
        break;
    }
    if (speDeclenchee) l.reductionSpeciale = true;
  }

  // 5. Combo : 3 actions réussies d'affilée dont au moins 2 attaques.
  for (const j of LES_DEUX) {
    const l = J[j];
    l.historique.push({ reussie: res[j] === 'gagne', attaque: res[j] === 'gagne' && fam[j] === 'attaque' });
    if (l.historique.length > REGLES.combo.actions) l.historique.shift();
    const h = l.historique;
    if (
      h.length === REGLES.combo.actions &&
      h.every((x) => x.reussie) &&
      h.filter((x) => x.attaque).length >= REGLES.combo.attaquesMin
    ) {
      log(e, `Combo pour ${l.def.nom} !`);
      tombe.add(j);
      l.historique = [];
    }
  }

  // 6. Pression : 3 tours d'affilée sans attaque ni contre.
  for (const j of LES_DEUX) {
    const l = J[j];
    if (fam[j] === 'attaque' || fam[j] === 'contre') {
      l.toursSansAttaque = 0;
    } else if (++l.toursSansAttaque >= REGLES.pression.tours) {
      log(e, `Pénalité de passivité pour ${l.def.nom}.`);
      marquer(e, autre(j), REGLES.pression.points, 'passivité adverse');
      l.toursSansAttaque = 0;
    }
  }

  // 7. Tentatives de tombé.
  for (const j of LES_DEUX) {
    if (tombe.has(j) && tenterTombe(e, j, endDebut, hasard, options)) {
      finirCombat(e, j, 'tombe');
      return e;
    }
  }

  // 8. Épuisement : 3 tours à 0 d'endurance = tombé. En durée infinie (plus de récupération),
  // 3 tours sans pouvoir payer aucune action comptent aussi, sinon le combat ne finirait jamais.
  for (const j of LES_DEUX) {
    const l = J[j];
    const aBout = l.endurance <= 0
      || (!!e.infini && e.tourGlobal >= (e.epuisementDes ?? REGLES.infini.debutEpuisement) && actionsJouables(e, j).length === 0);
    l.toursSansEndurance = aBout ? l.toursSansEndurance + 1 : 0;
    if (l.toursSansEndurance >= REGLES.toursSansEnduranceAvantTombe) {
      log(e, `${l.def.nom} est épuisé depuis 3 tours et se fait tomber.`);
      finirCombat(e, autre(j), 'tombe');
      return e;
    }
  }

  // 8 bis. Récupération régulière : tous les 2 tours, part × récupération × barre d'endurance,
  // avec la précision du lutteur comme chance de réussite.
  const RR = REGLES.recuperationReguliere;
  const intervalle = intervalleRecuperation(e);
  if (e.tour % intervalle === 0) {
    for (const j of LES_DEUX) {
      const l = J[j];
      if (l.endurance <= 0) continue;
      if (reussit(hasard, chanceReussite(precisionDe(l.endurance), l.def.enduranceMax))) {
        const gain = RR.part * l.def.recuperation * l.def.enduranceMax;
        ajouterEndurance(l, gain);
        log(e, `${l.def.nom} récupère ${Math.round(gain * 10) / 10} d'endurance (tous les ${intervalle} tours).`);
      }
    }
  }

  // 9. Préparation du tour suivant.
  for (const j of LES_DEUX) {
    // Bonus de feinte : relancé pour 2 tours par une feinte réussie, retiré une fois servi, sinon un tour de moins.
    J[j].bonusFeinte = bonusSuivant[j] ? REGLES.toursBonusFeinte : bonusUtilise[j] ? 0 : Math.max(0, J[j].bonusFeinte - 1);
    J[j].bonusEnchainement = enchainementSuivant[j];
    J[j].initiative = initiativeSuivante[j];
    J[j].attaqueIncontrable = incontrableSuivant[j];
    const id = choix[j].action;
    J[j].derniereReussie = res[j] === 'gagne' && id !== 'lutte' && id !== 'souffle' ? id : null;
  }
  e.tourGlobal++;

  const ecart = J[0].score - J[1].score;
  if (e.termine) return e;
  if (e.infini) {
    // Durée infinie : le combat continue jusqu'au tombé (combo, action spéciale, épuisement) ou l'abandon.
    e.tour++;
    return e;
  }
  if (e.rapide) return finTourRapide(e, ecart, hasard);
  if (Math.abs(ecart) >= REGLES.ecartSuperiorite) {
    finirPeriode(e, ecart > 0 ? 0 : 1, 'supériorité technique');
  } else if (e.tour >= toursPeriode(e)) {
    finirPeriode(e, gagnantPeriode(e, hasard), 'fin de la période');
  } else {
    e.tour++;
  }
  return e;
}
