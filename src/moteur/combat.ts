// Les règles du combat. Aucun affichage ici : ce fichier prend un état,
// les choix des deux joueurs, et renvoie le nouvel état avec un journal en français.

import { ACTIONS, BAT, REGLES, trouverLutteur } from './config';
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
    bonusFeinte: false,
    malusPrecisionTours: 0,
    toursSansAttaque: 0,
    historique: [],
    toursSansEndurance: 0,
    dernierSpecialTour: null,
    reductionSpeciale: false,
    initiative: false,
  };
}

export function creerCombat(a: string | DefLutteur, b: string | DefLutteur): EtatCombat {
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
  };
}

// ---------- Précision ----------

export function precisionDe(endurance: number): number {
  return (100 + endurance) / 200;
}

export function chanceReussite(precision: number): number {
  const P = REGLES.precision;
  if (precision >= P.seuilPlein) return P.chancePlein;
  if (precision >= P.seuilMoyen) return P.chanceMoyenne;
  if (precision > 0.5) return P.chanceFaible;
  return P.chanceMinimale;
}

// ---------- Ce qu'un joueur peut faire ----------

export function actionsJouables(etat: EtatCombat, j: Joueur): IdAction[] {
  const l = etat.joueurs[j];
  if (l.endurance <= 0) return [];
  return l.def.actions.filter((id) => ACTIONS[id].cout <= l.endurance);
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
  return ACTIONS[id].cout * multiplicateurSpeciale(etat, j);
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
  etat: EtatCombat, j: Joueur, actionAdverse: IdAction | 'lutte', hasard: Hasard,
): (IdAction | 'lutte')[] | null {
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

function valeurAttaque(e: EtatCombat, j: Joueur, id: IdAction, endDebut: [number, number]): number {
  const l = e.joueurs[j];
  let pts = ACTIONS[id].points;
  if (l.bonusFeinte) pts += REGLES.bonusFeinte;
  if (endDebut[j] >= 2 * endDebut[autre(j)]) pts += REGLES.bonusDoubleEndurance;
  return pts;
}

function perteDesequilibre(points: number): number {
  for (const palier of REGLES.desequilibre) if (points >= palier.pointsMin) return palier.perte;
  return 0;
}

function valider(e: EtatCombat, j: Joueur, c: Choix): Choix {
  const l = e.joueurs[j];
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
function duel(
  e: EtatCombat, f: [Famille, Famille], endDebut: [number, number],
): { res: [Resultat, Resultat]; sortie: boolean } {
  const [f0, f1] = f;
  if (f0 === f1) {
    if (endDebut[0] >= 2 * endDebut[1]) return { res: ['gagne', 'perd'], sortie: false };
    if (endDebut[1] >= 2 * endDebut[0]) return { res: ['perd', 'gagne'], sortie: false };
    return { res: ['neutre', 'neutre'], sortie: false };
  }
  for (const c of LES_DEUX) {
    const a = autre(c);
    if (f[c] === 'contre' && f[a] === 'attaque') {
      const plusEndurance = endDebut[c] > endDebut[a];
      const plusForce = e.joueurs[c].def.force > e.joueurs[a].def.force;
      const res: [Resultat, Resultat] = ['perd', 'perd'];
      if (plusEndurance || plusForce) {
        res[c] = 'gagne';
        return { res, sortie: !(plusEndurance && plusForce) };
      }
      res[a] = 'gagne';
      return { res, sortie: false };
    }
  }
  if (BAT[f0].includes(f1)) return { res: ['gagne', 'perd'], sortie: false };
  return { res: ['perd', 'gagne'], sortie: false };
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
  // 3. PROVISOIRE (règle à valider) : personne n'a marqué → plus d'endurance, sinon au hasard.
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
    x.bonusFeinte = false;
    x.malusPrecisionTours = 0;
    x.toursSansAttaque = 0;
    x.historique = [];
    x.initiative = false;
    x.toursSansEndurance = 0;
    ajouterEndurance(x, x.def.recuperation * x.def.enduranceMax);
  }
}

// ---------- Le tour ----------

export function jouerTour(
  etat: EtatCombat, choixA: Choix, choixB: Choix, hasard: Hasard, options: OptionsTour = {},
): EtatCombat {
  if (etat.termine) throw new Error('Le combat est terminé.');
  const e: EtatCombat = structuredClone(etat);
  const J = e.joueurs;
  const choix: [Choix, Choix] = [valider(e, 0, choixA), valider(e, 1, choixB)];
  const endDebut: [number, number] = [J[0].endurance, J[1].endurance];
  const fam = choix.map((c) => (c.action === 'lutte' ? null : ACTIONS[c.action].famille)) as [
    Famille | null, Famille | null,
  ];

  log(e, `Période ${e.periode}, tour ${e.tour} : ${nomChoix(J[0], choix[0])} contre ${nomChoix(J[1], choix[1])}.`);

  // 1. Paiement de l'endurance.
  for (const j of LES_DEUX) {
    const c = choix[j];
    if (c.action === 'lutte') continue;
    const cout = c.speciale ? coutSpeciale(e, j, c.action) : ACTIONS[c.action].cout;
    if (c.speciale) {
      J[j].dernierSpecialTour = e.tourGlobal;
      J[j].reductionSpeciale = false;
    }
    retirerEndurance(J[j], cout);
  }

  // 2. Tirage de précision, avant de comparer les familles.
  const passe: [boolean, boolean] = [false, false];
  for (const j of LES_DEUX) {
    if (choix[j].action === 'lutte') continue;
    const malus = fam[j] === 'attaque' && J[j].malusPrecisionTours > 0 ? REGLES.matraquage.malusPrecision : 0;
    const p = precisionDe(endDebut[j]) - malus;
    passe[j] = reussit(hasard, chanceReussite(p));
    if (!passe[j]) log(e, `${J[j].def.nom} rate son action (précision ${p.toFixed(2)}) : action dans le vent.`);
  }
  for (const l of J) if (l.malusPrecisionTours > 0) l.malusPrecisionTours--;

  // 3. Comparaison des familles.
  let res: [Resultat, Resultat] = ['rien', 'rien'];
  let sortie = false;
  if (passe[0] && passe[1]) {
    const d = duel(e, [fam[0]!, fam[1]!], endDebut);
    res = d.res;
    sortie = d.sortie;
    if (res[0] === 'neutre') log(e, 'Même famille et pas le double d\'endurance : personne ne marque.');
  } else {
    for (const j of LES_DEUX) if (passe[j]) res[j] = 'gagne';
  }

  // 4. Effets.
  const bonusSuivant: [boolean, boolean] = [false, false];
  const initiativeSuivante: [boolean, boolean] = [false, false];
  const tombe = new Set<Joueur>();

  for (const j of LES_DEUX) {
    const o = autre(j);
    const l = J[j];
    const adv = J[o];
    const c = choix[j];

    if (c.action === 'lutte') {
      if (reussit(hasard, REGLES.lutte.chance)) {
        const pts = reussit(hasard, 0.5) ? REGLES.lutte.pointsMin : REGLES.lutte.pointsMax;
        marquer(e, j, pts, 'Lutte');
      } else {
        log(e, `${l.def.nom} lutte sans résultat.`);
      }
      continue;
    }
    if (res[j] !== 'gagne') continue;

    const a = ACTIONS[c.action];
    const actionAdv = choix[o].action;
    const opposee = passe[o] && actionAdv !== 'lutte' ? ACTIONS[actionAdv] : null;

    switch (a.famille) {
      case 'attaque':
        marquer(e, j, valeurAttaque(e, j, a.id, endDebut), a.nom);
        if (c.speciale) tombe.add(j);
        break;

      case 'defense':
        if (c.speciale) marquer(e, j, REGLES.speciale.pointsDefense, `${a.nom} spéciale : renversement`);
        else if (a.points > 0 && opposee?.famille === 'attaque') marquer(e, j, a.points, a.nom);
        {
          const R = REGLES.recuperationDefense;
          const taux = l.endurance < l.def.enduranceMax / 2 ? R.sousMoitie : R.auDessus;
          ajouterEndurance(l, taux * l.def.enduranceMax);
          log(e, `${l.def.nom} récupère ${Math.round(taux * 100)} % d'endurance.`);
        }
        break;

      case 'contre':
        if (opposee?.famille === 'attaque') {
          if (sortie) {
            marquer(e, j, REGLES.pointsSortie, 'point de sortie');
          } else {
            const v = valeurAttaque(e, o, opposee.id, endDebut);
            marquer(e, j, v, `${a.nom} : points de l'attaque renvoyés`);
            const perte = perteDesequilibre(v);
            retirerEndurance(adv, perte * adv.def.enduranceMax);
            log(e, `${adv.def.nom} est déséquilibré et perd ${Math.round(perte * 100)} % d'endurance.`);
          }
        }
        if (c.speciale) tombe.add(j);
        break;

      case 'feinte':
        if (c.speciale) marquer(e, j, REGLES.speciale.pointsFeinte, `${a.nom} spéciale : l'adversaire glisse`);
        else bonusSuivant[j] = true;
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
    if (c.speciale) l.reductionSpeciale = true;
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

  // 8. Épuisement : 3 tours à 0 d'endurance = tombé.
  for (const j of LES_DEUX) {
    const l = J[j];
    l.toursSansEndurance = l.endurance <= 0 ? l.toursSansEndurance + 1 : 0;
    if (l.toursSansEndurance >= REGLES.toursSansEnduranceAvantTombe) {
      log(e, `${l.def.nom} est épuisé depuis 3 tours et se fait tomber.`);
      finirCombat(e, autre(j), 'tombe');
      return e;
    }
  }

  // 9. Préparation du tour suivant.
  for (const j of LES_DEUX) {
    J[j].bonusFeinte = bonusSuivant[j];
    J[j].initiative = initiativeSuivante[j];
  }
  e.tourGlobal++;

  const ecart = J[0].score - J[1].score;
  if (Math.abs(ecart) >= REGLES.ecartSuperiorite) {
    finirPeriode(e, ecart > 0 ? 0 : 1, 'supériorité technique');
  } else if (e.tour >= REGLES.toursParPeriode) {
    finirPeriode(e, gagnantPeriode(e, hasard), 'fin de la période');
  } else {
    e.tour++;
  }
  return e;
}
