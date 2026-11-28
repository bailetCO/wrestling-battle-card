import { jouer, sonCarte, sonFin } from '../son';
import { niveauCompte } from '../collection';
import { DIVISIONS, perdreEnLigne, type CombatGagne } from '../classement';
// Fin du combat et ouverture des boosters.

import { gagnerPoints } from '../classement';
import { tuileVisible } from '../menu';
import { ACTIONS, REGLES, ID_RIVAL, COCOACH_RIVAL, trouverLutteur, niveauCarte, REGLES as R_ } from '../../moteur';
import { NOM_RARETE, activerReflets, carteHTML } from '../carte';
import { gagnerMedailles, joindreGains, consoler, sauver, type Booster } from '../collection';
import { ouvrirBooster } from '../collection';
import { etapeArene, victoireArene, victoireBossRejoue } from '../arene';
import { rivalBattu } from '../rival';
import { ICONE_MEDAILLE, compteur } from './accueil';
import { ecranArene } from './carriere';
import { miniCarteLutteur } from './club';
import { boutonAuto, htmlTourAncien, lancer, lancerArene, texteAuto } from './combat';
import { S, app, echap, moiNom, nouvelleGraine, portrait } from './commun';
import { route } from './navigation';
import { histoire, lancerInterclub, quete, queteCombat, saison } from './progression';
import { lancerEssai } from './tutos-courts';
import { noterFinCombat } from './avis';
import { noterParcours, noterStatsCombat } from './stats';
import { boutonPartage, brancherPartage, type Moment } from '../partage';
import { CARTES_SPECIALES } from '../../moteur';

// ---------- Écran 3 : fin du combat ----------


// ---------- Ouverture des boosters ----------

export interface Paquet {
  titre: string; // « Victoire », « Booster de consolation »…
  boosters: Booster[];
  ouvert: boolean;
  sansRecap?: boolean; // pas de récapitulatif des cartes à la fin (récompenses des modes histoire)
}

// Moment à partager à l'ouverture d'un booster : une carte légendaire, ou une carte secrète
// (Darius, Cocoach), obtenue pour la première fois.
function momentCarte(id: string, nouvelle: boolean): Moment | null {
  if (!nouvelle) return null;
  const def = trouverLutteur(id);
  const secrete = CARTES_SPECIALES.some((l) => l.id === id);
  if (!secrete && def.rarete !== 'legendaire') return null;
  return secrete
    ? { titre: 'CARTE SECRÈTE !', sousTitre: `${def.nom} rejoint ma collection : la carte la plus rare du jeu`, def, coach: moiNom(), texte: `J'ai débloqué la carte secrète de ${def.nom} ! Viens jouer à Wrestling Battle Card :` }
    : { titre: 'LÉGENDAIRE !', sousTitre: `${def.nom} (${def.origine}) rejoint ma collection`, def, coach: moiNom(), texte: `J'ai obtenu ${def.nom}, carte légendaire ! Viens jouer à Wrestling Battle Card :` };
}

export interface CarteTiree { id: string; nouvelle: boolean; booster: number }

export function cartesDuPaquet(p: Paquet): CarteTiree[] {
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

export const nomBooster = (b: Booster) =>
  b.type === 'recompense' ? 'Récompense' : b.type === 'epique' ? 'Booster épique · 8 cartes' : b.type === 'rare' ? 'Booster rare · 5 cartes' : 'Booster classique · 3 cartes';

// Ce que contient le booster en plus des cartes : médailles et $.
export function texteGains(g: { medailles?: number; dollars?: number }): string {
  const t: string[] = [];
  if (g.medailles) t.push(`+${g.medailles} médaille${g.medailles > 1 ? 's' : ''}`);
  if (g.dollars) t.push(`+${g.dollars} $`);
  return t.join(' · ');
}

export function visuelPaquet(b: Booster, extra = ''): string {
  const contenu = b.type === 'recompense' && !b.cartes.length
    ? texteGains(b)
    : `${b.cartes.length} carte${b.cartes.length > 1 ? 's' : ''}${b.medailles || b.dollars ? ` · ${texteGains(b)}` : ''}`;
  return `
    <span class="paquet p-${b.type}">
      <span class="paquet-logo">Wrestling<br>Battle Card</span>
      <span class="paquet-type">${b.type === 'recompense' ? 'Récompense' : b.type === 'epique' ? 'Épique' : b.type === 'rare' ? 'Rare' : 'Classique'}</span>
      <span class="paquet-nb">${contenu}</span>
      ${extra}
    </span>`;
}

// Le jeton d'un gain, révélé comme une carte : médaille d'or ou billet.
export function jetonGain(type: 'medailles' | 'dollars', n: number): string {
  return type === 'medailles'
    ? `<div class="jeton jeton-medaille">${ICONE_MEDAILLE}<b>+${n}</b><span>médaille${n > 1 ? 's' : ''}</span><small>Total : ${S.collection.medailles}</small></div>`
    : `<div class="jeton jeton-dollars"><i aria-hidden="true">$</i><b>+${n} $</b><span>Palier de ${R_.economie.medaillesParPalier} médailles atteint</span><small>Total : ${S.collection.dollars} $</small></div>`;
}

export function recapPaquet(p: Paquet): string {
  const cartes = cartesDuPaquet(p);
  const nouvelles = cartes.filter((c) => c.nouvelle).length;
  const gains = {
    medailles: p.boosters.reduce((n, b) => n + (b.medailles ?? 0), 0),
    dollars: p.boosters.reduce((n, b) => n + (b.dollars ?? 0), 0),
  };
  const ligneGains = gains.medailles || gains.dollars
    ? `<p class="recap-gains">${ICONE_MEDAILLE}<b>${texteGains(gains)}</b> <small>· tu as ${S.collection.medailles} médaille${S.collection.medailles > 1 ? 's' : ''} et ${S.collection.dollars} $</small></p>`
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
export function sectionPaquet(p: Paquet | null, message = ''): string {
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
export function revelerPaquet(p: Paquet, fin: () => void) {
  document.querySelector('.revelation')?.remove();
  const nb = p.boosters.filter((b) => b.cartes.length).length;
  if (!p.ouvert && nb) setTimeout(() => quete({ type: 'booster', n: nb }), 0);
  if (!p.ouvert && nb) noterParcours('premier_booster', '', true);
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
      jouer('booster');
      scene = `<div class="rev-paquet">${visuelPaquet(p.boosters[b])}</div>`;
      aide = 'Touche l\'écran pour ouvrir le booster';
    } else if (e.type === 'gain') {
      const bo = p.boosters[b];
      jouer('gain');
      scene = `<div class="rev-carte rev-gain"><div class="rev-eclat" aria-hidden="true"></div>${jetonGain(e.quoi, (e.quoi === 'medailles' ? bo.medailles : bo.dollars) ?? 0)}</div>`;
      aide = derniere ? (p.sansRecap ? 'Touche l\'écran pour terminer' : 'Touche l\'écran pour voir le récapitulatif') : 'Touche l\'écran pour la suite';
    } else {
      const c = cartes[e.k];
      const def = trouverLutteur(c.id);
      sonCarte(def.rarete);
      scene = `
        <div class="rev-carte r-${def.rarete}">
          <div class="rev-eclat" aria-hidden="true"></div>
          <span class="pastille ${c.nouvelle ? 'nouvelle' : 'nombre'}">${c.nouvelle ? 'Nouvelle !' : 'Double'}</span>
          ${carteHTML(def)}
          ${momentCarte(c.id, c.nouvelle) ? boutonPartage() : ''}
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
    if (e.type === 'carte') brancherPartage(el, () => momentCarte(cartes[e.k].id, cartes[e.k].nouvelle));
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

// Moment à partager après un combat contre l'ordinateur : un exploit (nation battue, Cocoach battu à
// un nouveau niveau), sinon une victoire par tombé. Jamais pendant un tutoriel ou une partie d'essai.
function momentFin(): Moment | null {
  if (!S.partie || S.tuto || S.essaiSolo) return null;
  const e = S.partie.etat;
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  if (e.vainqueur !== S.HUMAIN) return null;
  const x = S.exploitFin ?? (e.finPar === 'tombe'
    ? { titre: 'TOMBÉ !', sousTitre: `${h.def.nom} fait tomber ${o.def.nom}`, texte: `J'ai fait tomber ${o.def.nom} avec ${h.def.nom} !` }
    : null);
  return x ? { ...x, def: h.def, coach: moiNom(), texte: `${x.texte} Viens jouer à Wrestling Battle Card :` } : null;
}

// « +4 points de classement » sous le verdict, quand la tuile Classement est ouverte.
// Victoire : points de classement et barre de division (28/11/2026). Fanfare si la division monte.
let divisionFin: { gain: number; monte: string | null } | null = null;
export function victoireClassement(x: CombatGagne): number {
  const k = S.collection.classement;
  const d0 = k.division, p0 = k.progression;
  const n = gagnerPoints(S.collection, x);
  const monte = k.division > d0 ? DIVISIONS[k.division].nom : null;
  divisionFin = { gain: (k.division - d0) * REGLES.classement.parDivision + k.progression - p0, monte };
  if (monte) jouer('palier', 1.4);
  return n;
}
// Défaite en ligne : la barre de division baisse un peu.
export function defaiteEnLigneClassement() {
  divisionFin = { gain: -perdreEnLigne(S.collection), monte: null };
  S.pointsFin = 0;
}

// « +4 points de classement · division +15 » sous le verdict, quand la tuile Classement est ouverte.
export function lignePointsFin(): string {
  if (S.pointsFin === null || !tuileVisible(S.collection, 'classement')) return '';
  const d = divisionFin;
  const division = d?.monte ? ` · 🎉 Division ${d.monte} atteinte !` : d && d.gain ? ` · division ${d.gain > 0 ? '+' : '−'}${Math.abs(d.gain)}` : '';
  if (d && d.gain < 0) return `<a class="points-fin perte" href="#classement">Défaite en ligne : division −${-d.gain}</a>`;
  return S.pointsFin > 0
    ? `<a class="points-fin" href="#classement">🏆 +${S.pointsFin} point${S.pointsFin > 1 ? 's' : ''} de classement${division}</a>`
    : `<a class="points-fin" href="#classement">🏆 Plafond du jour atteint (${REGLES.classement.plafondJour} points) : reviens demain !</a>`;
}

export function ecranFin() {
  if (!S.partie) return;
  noterFinCombat(S.partie); // pour un signalement de bug, et l'invitation à donner son avis
  if (!S.tuto && !S.essaiSolo) {
    const mode = S.enTournoi !== null ? 'tournoi' : S.interclubEnCours ? 'interclub' : S.areneCtx ? 'carriere' : 'entrainement';
    noterStatsCombat(S.partie, { etat: S.partie.etat, moi: S.HUMAIN, tours: S.tours, mode, niveau: S.partie.niveau, auto: S.combatEnAuto, dureeMs: Date.now() - S.partie.debut });
    noterParcours('premier_combat', '', true);
  }
  const e = S.partie.etat;
  const gagne = e.vainqueur === S.HUMAIN;
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  const vainqueur = gagne ? h : o;
  sonFin(`solo-${S.partie.debut}`, gagne, e.finPar === 'tombe');
  const comment = e.finPar === 'tombe'
    ? 'par tombé'
    : e.rapide ? `${Math.max(h.score, o.score)} à ${Math.min(h.score, o.score)}${e.mortSubite ? ' en mort subite' : ''}`
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const anciens = S.tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  const { idHumain, idOrdi } = S.partie;
  const enArene = !e.rapide && S.areneCtx !== null;
  if (!S.recompenseDonnee) {
    S.recompenseDonnee = true;
    S.exploitFin = null;
    const x = S.bonusCeCombat ? REGLES.collection.multiplicateurApresTutoriel : 1;
    if (S.bonusCeCombat) S.collection.bonusTutoriel = false; // le bonus vaut pour un seul combat
    S.bonusCeCombat = false;
    if (gagne) histoire({ type: 'victoire', nation: o.def.nation, niveau: S.partie.niveau, auto: S.combatEnAuto, carriere: enArene && !S.tuto && !S.essaiSolo });
    const niveauAvant = niveauCompte(S.collection);
    S.pointsFin = gagne && !S.tuto && !S.essaiSolo ? victoireClassement({ niveau: S.partie.niveau, tombe: e.finPar === 'tombe' }) : null;
    queueMicrotask(() => { if (niveauCompte(S.collection) > niveauAvant) jouer('niveau', 1.2); });
    let championBattu = gagne && S.areneCtx?.type === 'boss'; // champion d'une nation battu en Carrière
    if (e.rapide) {
      // Combat rapide : +1 médaille par victoire, sans booster ni consolation.
      if (gagne) {
        histoire({ type: 'rapide', tombe: e.finPar === 'tombe', ecart: h.score - o.score });
        if (S.interclubEnCours) saison({ type: 'interclub' });
        S.collection.victoires++;
        // Cocoach battu : il progresse ; quand il monte de niveau, 1 booster rare.
        const boostersRival: Booster[] = [];
        S.rivalFin = null;
        if (idOrdi === ID_RIVAL) {
          const gradeAvant = S.collection.rival.grade;
          const m = rivalBattu(S.collection);
          S.rivalFin = { ...m, gradeAvant };
          if (m.monte) S.exploitFin = { titre: 'COCOACH BATTU !', sousTitre: `Cocoach, mon rival, monte au niveau ${NOM_RARETE[niveauCarte(COCOACH_RIVAL, m.grade)]}`, texte: `J'ai battu Cocoach, mon rival : il passe au niveau ${NOM_RARETE[niveauCarte(COCOACH_RIVAL, m.grade)]} !` };
          histoire({ type: 'rival', grade: gradeAvant, auto: S.combatEnAuto });
          if (m.monte) for (let k = 0; k < R_.rival.boostersRaresParMontee; k++) boostersRival.push(ouvrirBooster(S.collection, Math.random, 'rare'));
        }
        S.paquetSolo = { titre: S.rivalFin?.monte ? 'Victoire contre Cocoach' : 'Victoire', boosters: joindreGains(boostersRival, gagnerMedailles(S.collection, R_.economie.medaillesParVictoire.arene)), ouvert: false };
      }
    } else if (gagne && S.areneCtx?.type === 'boss') {
      const r = victoireBossRejoue(S.collection, S.areneCtx.nation, Math.random);
      S.paquetSolo = { titre: r.carteBoss ? 'Victoire et carte du boss gagnée' : 'Victoire', boosters: r.boosters, ouvert: false };
    } else if (gagne) {
      // Arène : +1 médaille ; nation battue : 2 ou 3 boosters, 3 médailles, peut-être la carte du boss.
      // Bonus du tutoriel : des boosters en plus sur cette victoire.
      const bonus = x > 1 ? R_.collection.boostersParVictoire.arene * x : 0;
      const r = victoireArene(S.collection, Math.random, bonus);
      if (r.nationBattue) histoire({ type: 'nationArene' });
      quete({ type: 'arene' });
      if (r.nationBattue) championBattu = true;
      if (r.nationBattue) S.exploitFin = { titre: 'NATION BATTUE !', sousTitre: `${r.nationBattue.nom} battue en Carrière, champion compris`, texte: `J'ai battu toute la nation ${r.nationBattue.nom} en Carrière !` };
      const titre = r.nationBattue ? `${r.nationBattue.nom} battue${r.carteBoss ? ' et carte du boss gagnée' : ''}` : bonus ? 'Victoire · bonus du tutoriel' : 'Victoire';
      S.paquetSolo = { titre, boosters: r.boosters, ouvert: false };
    } else {
      const conso = consoler(S.collection, Math.random);
      if (conso) S.paquetSolo = { titre: 'Booster de consolation', boosters: [conso], ouvert: false };
      else S.messageSolo = 'Encore une défaite d\'affilée et tu reçois un booster de consolation.';
    }
    queteCombat(e, e.rapide ? 'rapide' : 'arene', S.partie.niveau, championBattu);
    sauver(S.collection);
  }
  // Partie d'essai d'un tutoriel court gagnée : un booster classique, une seule fois par tutoriel.
  if (S.essaiSolo && gagne && !S.paquetSolo) {
    if (!S.collection.essaisGagnes.includes(S.essaiSolo)) {
      S.collection.essaisGagnes.push(S.essaiSolo);
      S.paquetSolo = { titre: 'Partie d\'essai gagnée', boosters: [ouvrirBooster(S.collection, Math.random, 'classique')], ouvert: false };
      sauver(S.collection);
    } else S.messageSolo = 'Partie d\'essai gagnée ! Le booster de ce tutoriel a déjà été reçu.';
  }
  const booster = sectionPaquet(S.paquetSolo, S.messageSolo);
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(vainqueur.def)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(vainqueur.def.nom)} gagne ${comment}.</p>
        ${S.scoresPeriodes.length ? `<p class="hist">${S.scoresPeriodes.map(([a, b], i) => `Période ${i + 1} : ${a} - ${b}`).join('<br>')}</p>` : ''}
        <p class="hist">${echap(moiNom())} : ${echap(h.def.nom)} · Ordi : ${echap(o.def.nom)} · ${e.tourGlobal} tours</p>
        ${S.combatEnAuto ? `<p class="hist">${texteAuto()}</p>` : ''}
        ${idOrdi === ID_RIVAL && S.rivalFin ? `<p class="rival-fin">${S.rivalFin.monte
          ? `Cocoach passe au niveau <b>${NOM_RARETE[niveauCarte(COCOACH_RIVAL, S.rivalFin.grade)]}</b> ! Il sera plus fort au prochain combat. Tu gagnes ${R_.rival.boostersRaresParMontee} booster rare.`
          : S.rivalFin.etoile ? `Cocoach gagne une étoile sur ${echap(ACTIONS[S.rivalFin.etoile].nom)}.` : 'Cocoach est à son maximum.'}</p>` : ''}
        ${lignePointsFin()}
      </section>
      ${booster}
      <div class="fin-boutons">
        ${momentFin() ? boutonPartage('Partager ce moment') : ''}
        ${enArene && gagne && S.areneCtx?.type === 'progression'
          ? `${etapeArene(S.collection).adversaire ? `<button class="principal" data-suivant-arene>Adversaire suivant avec ${echap(h.def.nom)}</button>${boutonAuto('data-suivant-arene-auto', '', etapeArene(S.collection).adversaire ?? '')}` : ''}`
          : `<button class="principal" data-revanche>${S.interclubEnCours ? 'Combat interclub suivant' : enArene && !gagne ? `Retenter avec ${echap(h.def.nom)}` : 'Revanche'}</button>${boutonAuto('data-revanche-auto', '', S.interclubEnCours ? null : idOrdi)}`}
        <button class="secondaire" data-changer>${enArene ? 'Retour à la Carrière' : 'Changer de lutteur'}</button>
        <button class="lien" data-menu>Retour au menu</button>
      </div>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  activerReflets(app);
  brancherPartage(app, momentFin);
  const ctx = S.areneCtx;
  const revanche = (auto: boolean) => {
    if (S.essaiSolo) return lancerEssai(S.essaiSolo);
    if (S.interclubEnCours) return lancerInterclub(idHumain, auto);
    if (!enArene) return lancer(idHumain, idOrdi, nouvelleGraine(), e.rapide, S.partie?.niveau ?? S.collection.niveau, auto);
    if (ctx?.type === 'boss') S.bossChoisi = ctx.nation;
    lancerArene(idHumain, auto);
  };
  app.querySelector('[data-revanche]')?.addEventListener('click', () => revanche(false));
  app.querySelector('[data-revanche-auto]')?.addEventListener('click', () => revanche(true));
  app.querySelector('[data-suivant-arene]')?.addEventListener('click', () => { S.bossChoisi = null; lancerArene(idHumain); });
  app.querySelector('[data-suivant-arene-auto]')?.addEventListener('click', () => { S.bossChoisi = null; lancerArene(idHumain, true); });
  app.querySelector('[data-changer]')!.addEventListener('click', () => {
    if (ctx?.type === 'boss' && !gagne) S.bossChoisi = ctx.nation; else S.bossChoisi = null;
    ecranArene(e.rapide);
  });
  // Retour direct à l'accueil, sans repasser par le choix du lutteur.
  app.querySelector('[data-menu]')!.addEventListener('click', () => {
    S.bossChoisi = null;
    S.partie = null;
    if (location.hash && location.hash !== '#') location.hash = '';
    else route();
  });
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => S.paquetSolo && revelerPaquet(S.paquetSolo, ecranFin));
  window.scrollTo(0, 0);
}
