// Écran de combat : boutons, récapitulatif, mode Enchaînement, déroulé d'un tour et fenêtres.

import { PRESENTATION_COCOACH } from '../portrait';
import { ACTIONS, REGLES, ID_RIVAL, COCOACH_RIVAL, autoOuvert, bonusAutoExpert, creerCombat, chanceFortAuto, combatAuto, avecBonus, actionsJouables, chanceReussite, coutSpeciale, nomLocal, peutJouerSpeciale, precisionDe, trouverLutteur, souffleDispo, comboPossible, coutDuTour, pointsCombo, surcoutFatigue, intervalleRecuperation, niveauFatigue, toursPeriode, actionsAjoutables, speciaux, souffleAjoutable, validerSequence, apercuSequence, enduranceApres, coutALaPlace, TAILLE_SEQUENCE, niveauCarte, avecDeck, coutAction, REGLES as R_, type Choix, type DefLutteur, type Sequence, type EtatCombat, type EtatLutteur, type Face, type IdAction, type Joueur, type Niveau } from '../../moteur';
import { Partie, type TourJoue, type SequenceJouee } from '../partie';
import { EFFET_SPECIALE, ICONE, effetAction } from '../textes';
import { NOM_RARETE, activerReflets, carteHTML } from '../carte';
import { niveauCompte, autoPermis, deckDe, defPossede, styleDe } from '../collection';
import { PAR_NATION, adversairesDe, etapeArene } from '../arene';
import { defRival, etoilesRival, niveauOrdiRival } from '../rival';
import { type IdTuto } from '../tutos';
import { ecranFinLigne, majStatutLigne } from './amis';
import { ecranArene } from './carriere';
import { ActionJouee, S, adv, app, echap, etatEnCours, famille, fmt, legendeFamille, libelleAction, moiNom, niveauOrdi, nouvelleGraine, pastilleNiveau, pct, portrait } from './commun';
import { ecranFin } from './fin';
import { gagnerTout, outilsTestVisibles } from '../test';
import { finCombatTournoi } from './tournois';
import { bulleCoach, ecranFinTutoriel, etapeGuidee, guiderBoutons } from './tutoriel';
import { bulleConseil, tourGuideEssai } from './tutos-courts';

// ---------- Combat automatique ----------

export const quetesLigneComptees = new Set<string>(); // combats en ligne déjà comptés pour les quêtes // combat interclub de la saison sportive // le combat en cours (ou qui vient de finir) a été joué en automatique
export const autoDispo = () => autoOuvert(niveauCompte(S.collection));

// Bouton « Combat auto » à côté d'un bouton de combat : actif à partir du niveau de compte 3.
// `adversaire` : l'adversaire connu (l'auto n'est permis que s'il a déjà été battu à la main),
// ou null quand il sera tiré au hasard parmi les lutteurs déjà battus à la main.
export function boutonAuto(attribut: string, valeur: string, adversaire: string | null): string {
  if (!autoDispo()) return `<button class="secondaire bouton-auto" disabled>🔒 Combat auto · niveau ${R_.auto.niveauCompteMin}</button>`;
  const ok = adversaire === null ? S.collection.battusMain.length > 0 : autoPermis(S.collection, adversaire);
  return ok
    ? `<button class="secondaire bouton-auto" ${attribut}${valeur ? `="${valeur}"` : ''}>⚡ Combat auto</button>`
    : `<button class="secondaire bouton-auto" disabled>🔒 Auto : ${adversaire === null ? 'bats d\'abord un lutteur à la main' : 'bats-le d\'abord à la main'}</button>`;
}

export function texteAuto(): string {
  const p = Math.round(chanceFortAuto(niveauCompte(S.collection)) * 100);
  const expert = S.partie && bonusAutoExpert(niveauCompte(S.collection), S.partie.niveau) ? ', avec le bonus de niveau 10+' : '';
  return `⚡ Combat joué en automatique${expert} (${p === 0 ? 'comme l\'ordinateur normal' : p === 100 ? 'comme l\'ordinateur fort' : `fort ${p} % du temps, normal sinon`}).`;
}

// Lance l'écran de combat, ou joue tout le combat d'un coup et montre directement la fin.
export function demarrer(auto: boolean) {
  // Le combat auto n'est permis que contre un lutteur déjà battu à la main.
  S.combatEnAuto = auto && autoDispo() && !!S.partie && autoPermis(S.collection, S.partie.etat.joueurs[S.HUMAIN === 0 ? 1 : 0].def.id);
  if (!S.combatEnAuto || !S.partie) return ecranCombat();
  // Au-dessus du niveau 10, l'auto gagne environ 3 fois sur 4 contre l'ordinateur.
  const bonus = bonusAutoExpert(niveauCompte(S.collection), S.partie.niveau);
  if (bonus) {
    const [moi, lui] = S.partie.etat.joueurs;
    S.partie.etat = creerCombat(avecBonus(moi.def, bonus), lui.def, { rapide: S.partie.etat.rapide });
  }
  const r = combatAuto(S.partie.etat, S.partie.hasard.graine, [{ chanceFort: chanceFortAuto(niveauCompte(S.collection)) }, { niveau: S.partie.niveau }]);
  S.partie.etat = r.etat;
  S.tours = r.tours.map((t) => ({ avant: t.avant, choixHumain: t.choix[0], choixOrdi: t.choix[1], ordiAChange: false, lignes: t.lignes }));
  for (const t of S.tours) for (const l of t.lignes) {
    const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
    if (m) S.scoresPeriodes.push([Number(m[1]), Number(m[2])]);
  }
  ecranCombat();
}


// ---------- Écran 2 : le combat ----------

export function badges(e: EtatCombat, j: Joueur): string {
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
  // Durée infinie : l'étiquette Fatigue change de couleur à chaque nouvel effet (tours 20, 25, 30…).
  const nf = j === S.HUMAIN ? niveauFatigue(e) : 0;
  const fatigue = nf ? `<span class="badge fatigue f${Math.min(5, nf)}">Fatigue : récupération tous les ${intervalleRecuperation(e)} tours${surcoutFatigue(e) ? ` · +${surcoutFatigue(e)} par action` : ''}</span>` : '';
  return fatigue + b.map((t) => `<span class="badge">${echap(t)}</span>`).join('');
}

// Jauge d'endurance façon jeu de combat : la barre se vide vers l'extérieur, une trace claire
// montre ce qui vient d'être perdu, un repère marque le seuil de 50 (précision en baisse).
export function barre(l: EtatLutteur, j: Joueur, coin: 'rouge' | 'bleu', etiquette: string): string {
  const max = l.def.enduranceMax;
  const cible = Math.max(0, (l.endurance / max) * 100);
  const depart = S.endurancesAvant ? Math.max(0, (S.endurancesAvant[j] / max) * 100) : cible;
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
export function chanceAction(e: EtatCombat, a: IdAction): number {
  const l = e.joueurs[S.HUMAIN];
  const attaque = ACTIONS[a].famille === 'attaque';
  if (attaque && l.derniereReussie === R_.combos.contreTemps.avant) return 1;
  if (a === 'tour_hanche' && l.def.force > e.joueurs[S.ORDI].def.force) return 1;
  const malus = attaque && l.malusPrecisionTours > 0 && a !== 'simple_jambe' ? R_.matraquage.malusPrecision : 0;
  return chanceReussite(precisionDe(l.endurance) - malus);
}

export function boutonsActions(e: EtatCombat, mode: 'tour' | 'initiative'): string {
  const l = e.joueurs[S.HUMAIN];
  const jouables = actionsJouables(e, S.HUMAIN);
  // Second souffle : une fois par combat, sous 25 d'endurance.
  const souffle = mode === 'tour' && souffleDispo(e, S.HUMAIN) ? `
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
    const spe = f === l.def.familleSpeciale && peutJouerSpeciale(e, S.HUMAIN, a);
    const combo = ok ? comboPossible(e, S.HUMAIN, a) : null;
    const chance = chanceAction(e, a);
    const cout = coutDuTour(e, S.HUMAIN, a);
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
  // Fenêtre d'initiative : détails toujours visibles (pas d'appui long dans une fenêtre).
  if (mode === 'initiative') return `<div class="grille details">${normales}${souffle}</div>`;
  return `${barreDetails()}<div class="grille ${detailsActions() ? 'details' : ''}">${normales}${souffle}</div>`;
}


// ---------- Boutons d'action allégés : nom et coût ; le détail en appui long ----------

export const CLE_DETAILS = 'wbc-details'; // détails toujours affichés (préférence du téléphone)
export const CLE_APPUI = 'wbc-appui-vu'; // l'astuce de l'appui long a servi
export const lireCle = (k: string) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
export const ecrireCle = (k: string, v: boolean) => { try { if (v) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch { /* navigation privée */ } };
export const detailsActions = () => lireCle(CLE_DETAILS);

export function barreDetails(): string {
  const astuce = !lireCle(CLE_APPUI) && !detailsActions();
  return `<div class="barre-details">${astuce ? '<span class="astuce-appui">Appui long sur une action : son effet.</span>' : '<span></span>'}
    <button class="lien" data-details>${detailsActions() ? 'Masquer les détails' : 'Détails'}</button></div>`;
}

// Fenêtre de détail d'une action, faite à partir de ce que contient son bouton.
export function fenetreDetailAction(b: HTMLButtonElement) {
  const t = (sel: string) => b.querySelector(sel)?.textContent?.trim() ?? '';
  const chance = t('.a-chance');
  ouvrirFenetre(`<h2>${echap(t('.a-nom'))}</h2>
    <p>${echap(t('.a-fr'))}</p>
    ${t('.a-combo') ? `<p class="a-combo">${echap(t('.a-combo'))}</p>` : ''}
    ${b.dataset.spe ? '<p>★ Action spéciale possible ce tour-ci.</p>' : ''}
    <p class="note">Coût : ${echap(t('.a-cout').replace('−', ''))} d'endurance${chance ? ` · chance de réussite : ${echap(chance)}` : ''}</p>
    <div class="fin-boutons"><button class="principal" data-fermer>Compris</button></div>`, true);
}

export function brancherAppuiLong(racine: ParentNode) {
  racine.querySelector('[data-details]')?.addEventListener('click', () => { ecrireCle(CLE_DETAILS, !detailsActions()); ecranCombat(); });
  racine.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((b) => {
    let minuterie = 0;
    const annuler = () => { clearTimeout(minuterie); minuterie = 0; };
    b.addEventListener('pointerdown', () => {
      annuler();
      minuterie = window.setTimeout(() => {
        b.dataset.appuiLong = '1';
        ecrireCle(CLE_APPUI, true);
        racine.querySelector('.astuce-appui')?.remove();
        fenetreDetailAction(b);
      }, 450);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, annuler);
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());
    // Le clic qui suit un appui long ne joue pas l'action.
    b.addEventListener('click', (ev) => {
      if (b.dataset.appuiLong) { delete b.dataset.appuiLong; ev.stopImmediatePropagation(); ev.preventDefault(); }
    }, true);
  });
}

export function classeLigne(ligne: string, e: EtatCombat): string {
  const nomH = e.joueurs[S.HUMAIN].def.nom;
  const nomO = e.joueurs[S.ORDI].def.nom;
  if (/TOMBÉ|Fin du combat/.test(ligne)) return 'fort';
  if (/^Période \d gagnée/.test(ligne)) return 'periode';
  if (/ marque \d/.test(ligne)) return ligne.startsWith(nomH) ? 'pts rouge' : ligne.startsWith(nomO) ? 'pts bleu' : 'pts';
  return '';
}

// Le mot qui s'affiche en grand dans la case, façon manga, selon ce qui s'est passé.
export type Cote = 'rouge' | 'bleu' | 'neutre';
export function onomatopee(t: TourJoue, e: EtatCombat): { texte: string; cote: Cote; fort: boolean } | null {
  const nh = e.joueurs[S.HUMAIN].def.nom;
  const no = e.joueurs[S.ORDI].def.nom;
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

export function miniCarte(c: Choix, def: DefLutteur, coin: 'rouge' | 'bleu', delai: number): string {
  const lib = libelleAction(def.nation, c.action);
  const f = famille(c.action);
  return `
    <div class="mini ${coin} ${c.speciale ? 'speciale' : ''}" style="--delai:${delai}ms">
      <span class="mini-ico f-${f}">${ICONE[f]}</span>
      <b>${c.speciale ? '★ ' : ''}${echap(lib.local)}</b>
      <small>${echap(lib.fr)}${legendeFamille(f)}</small>
    </div>`;
}

export function htmlDuel(choixH: Choix, choixO: Choix, e: EtatCombat): string {
  return `<div class="duel-mini">${miniCarte(choixH, e.joueurs[S.HUMAIN].def, 'rouge', 0)}<span class="contre-mot">contre</span>${miniCarte(choixO, e.joueurs[S.ORDI].def, 'bleu', 140)}</div>`;
}

export function lignesTour(t: TourJoue, e: EtatCombat): string {
  const [, ...reste] = t.lignes;
  return `
    ${t.ordiAChange ? '<li>L\'ordinateur avait l\'initiative : il a vu deux de tes actions possibles et a changé la sienne.</li>' : ''}
    ${reste.map((l) => `<li class="${classeLigne(l, e)}">${echap(l)}</li>`).join('')}`;
}

export const titreTour = (t: TourJoue) => (t.lignes[0] ?? '').replace(/ :.*$/, '');

// Un tour dans la liste « combat tour par tour » de l'écran de fin.
export function htmlTourAncien(t: TourJoue, e: EtatCombat): string {
  const h = libelleAction(e.joueurs[S.HUMAIN].def.nation, t.choixHumain.action);
  const o = libelleAction(e.joueurs[S.ORDI].def.nation, t.choixOrdi.action);
  return `
    <article class="tour">
      <h3>${echap(titreTour(t))} : <span class="rouge">${t.choixHumain.speciale ? '★ ' : ''}${echap(h.local)}</span> contre <span class="bleu">${t.choixOrdi.speciale ? '★ ' : ''}${echap(o.local)}</span></h3>
      <ul>${lignesTour(t, e)}</ul>
    </article>`;
}


// ---------- Récapitulatif du combat, façon chat ----------
// Tout le détail des tours s'ouvre dans un panneau par-dessus l'écran : l'écran de combat tient
// ainsi sur une seule page, sans défiler. Le bouton montre le nombre de tours pas encore lus.

export function boutonChat(): string {
  if (S.tours.length < S.chatLus) S.chatLus = 0; // nouveau combat
  const nb = S.chatOuvert ? 0 : S.tours.length - S.chatLus;
  return `<button class="bouton-chat" data-chat aria-label="Récapitulatif du combat${nb ? ` (${nb} nouveau${nb > 1 ? 'x' : ''})` : ''}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
    Récap${nb ? `<span class="chat-nb">${nb}</span>` : ''}</button>`;
}

export function filChat(e: EtatCombat): string {
  const nh = e.joueurs[S.HUMAIN].def.nom;
  const no = e.joueurs[S.ORDI].def.nom;
  // La bulle va du côté du lutteur dont le nom apparaît en premier dans la phrase.
  const cote = (l: string) => {
    const ih = l.indexOf(nh), io = l.indexOf(no);
    if (ih < 0 && io < 0) return 'neutre';
    return io < 0 || (ih >= 0 && ih <= io && !(nh.length < no.length && no.includes(nh) && ih === io)) ? 'moi' : 'lui';
  };
  return S.tours.map((t, i) => {
    const entete = t.sequence && t.sequence !== S.tours[i - 1]?.sequence ? `<p class="chat-seq">Séquence ${t.sequence}</p>` : '';
    const h = libelleAction(e.joueurs[S.HUMAIN].def.nation, t.choixHumain.action);
    const o = libelleAction(e.joueurs[S.ORDI].def.nation, t.choixOrdi.action);
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

export function panneauChat(e: EtatCombat): string {
  return `
    <div class="chat-voile ${S.chatOuvert ? 'ouvert' : ''}" data-chat-fermer></div>
    <aside class="chat ${S.chatOuvert ? 'ouvert' : ''}" aria-label="Récapitulatif du combat" ${S.chatOuvert ? '' : 'hidden'}>
      <header class="chat-tete"><b>Récapitulatif</b><button class="lien" data-chat-fermer>Fermer</button></header>
      <div class="chat-fil">${filChat(e)}</div>
    </aside>`;
}

export function brancherChat() {
  const basculer = (ouvrir: boolean) => {
    S.chatOuvert = ouvrir;
    if (ouvrir) S.chatLus = S.tours.length;
    ecranCombat();
  };
  app.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => basculer(true)));
  app.querySelectorAll('[data-chat-fermer]').forEach((b) => b.addEventListener('click', () => basculer(false)));
  if (S.chatOuvert) {
    S.chatLus = S.tours.length;
    const fil = app.querySelector<HTMLElement>('.chat-fil');
    if (fil) fil.scrollTop = fil.scrollHeight;
  }
}


// ---------- Mode Enchaînement (à l'essai, combat rapide) ----------
// Le joueur compose sa séquence de 3 actions en touchant les boutons dans l'ordre ; une case
// remplie se retire d'un toucher (avec celles qui suivent). Puis les 3 duels se révèlent.

// Encart du rival sur l'écran du combat rapide (durée infinie).
export function encartRival(): string {
  const r = S.collection.rival;
  const niv = NOM_RARETE[niveauCarte(COCOACH_RIVAL, r.grade)];
  const et = etoilesRival(S.collection);
  return `<div class="encart-rival si-infini" ${S.infiniChoisi ? '' : 'hidden'}>
    <span class="vignette"><img class="portrait-img" src="${PRESENTATION_COCOACH}" alt="Cocoach" style="object-position: 50% 12%"></span>
    <span><b>Adversaire : Cocoach, ton rival</b><small>${niv}${et ? ` · ${et} étoile${et > 1 ? 's' : ''}` : ''} · ordinateur ${niveauOrdiRival(S.collection)} · battu ${r.victoires} fois${r.bonus ? ` · +${Math.round(r.bonus * 100)} % (saisons)` : ''}</small>
    <small>À chaque victoire, il monte de niveau${r.grade < 4 ? ` (prochain : ${NOM_RARETE[niveauCarte(COCOACH_RIVAL, r.grade + 1)]}, 1 booster rare)` : ' (étoiles)'}.</small></span></div>`;
}

// Réglages « Style de combat » : le format (normal ou Enchaînement) et la durée.
export function reglagesStyle(nom: string, format: 'normal' | 'enchainement', duree: string, durees: [string, string, string][]): string {
  const choix = (groupe: string, valeur: string, actuel: string, titre: string, sous: string) => `
    <label class="choix-style"><input type="radio" name="${nom}-${groupe}" value="${valeur}" ${valeur === actuel ? 'checked' : ''}>
      <span><b>${titre}</b><small>${sous}</small></span></label>`;
  return `
    <fieldset class="style-combat"><legend>Format</legend>
      ${choix('format', 'normal', format, 'Normal', 'Une action par tour')}
      ${choix('format', 'enchainement', format, 'Enchaînement', `Séquences de ${TAILLE_SEQUENCE} actions`)}
    </fieldset>
    <fieldset class="style-combat"><legend>Durée</legend>
      ${durees.map(([v, t, sous]) => choix('duree', v, duree, t, sous)).join('')}
    </fieldset>`;
}

export function brancherStyle(nom: string, changer: (cle: 'format' | 'duree', valeur: string) => void) {
  app.querySelectorAll<HTMLInputElement>(`input[name^="${nom}-"]`).forEach((i) => i.addEventListener('change', () => {
    const cle = i.name.slice(nom.length + 1) as 'format' | 'duree';
    changer(cle, i.value);
  }));
}

// La dernière séquence jouée, retrouvée dans la liste des tours (contre l'ordinateur ou en ligne).
export function sequenceAffichee(): SequenceJouee | null {
  const der = S.tours[S.tours.length - 1];
  if (!der?.sequence) return null;
  const ts = S.tours.filter((t) => t.sequence === der.sequence);
  return { tours: ts, rupture: ts[ts.length - 1].rupture ?? null, ordiAChange: ts.some((t) => t.ordiAChange) };
}

export function caseSequenceHTML(e: EtatCombat, c: Choix | undefined, k: number): string {
  if (!c) return `<span class="seq-case vide">${k + 1}</span>`;
  const lib = libelleAction(e.joueurs[S.HUMAIN].def.nation, c.action);
  const f = famille(c.action);
  const cout = c.action === 'lutte' || c.action === 'souffle' ? 0 : coutALaPlace(e, S.HUMAIN, S.sequenceHumain.slice(0, k), c);
  return `<button class="seq-case pleine ${c.speciale ? 'speciale' : ''}" data-retirer="${k}" aria-label="Retirer ${echap(lib.local)}">
    <small>${k + 1}</small><span class="ico f-${f}">${ICONE[f]}</span><b>${c.speciale ? '★ ' : ''}${echap(lib.local)}</b><i>−${fmt(cout)}</i></button>`;
}

export function paveSequence(e: EtatCombat): string {
  const l = e.joueurs[S.HUMAIN];
  const seq = S.sequenceHumain;
  const plein = seq.length >= TAILLE_SEQUENCE;
  const cases = Array.from({ length: TAILLE_SEQUENCE }, (_, k) => caseSequenceHTML(e, seq[k], k)).join('');
  const reste = enduranceApres(e, S.HUMAIN, seq);
  let boutons = '';
  if (!plein) {
    const ok = actionsAjoutables(e, S.HUMAIN, seq);
    const souffle = souffleAjoutable(e, S.HUMAIN, seq);
    if (!ok.length && !souffle) {
      boutons = `${barreDetails()}<div class="grille ${detailsActions() ? 'details' : ''}"><button class="action lutte" data-action="lutte" data-mode="sequence">
        <span class="ico">${ICONE.lutte}</span><span class="a-nom">Lutte</span>
        <span class="a-fr">Plus de quoi payer une action : 1 chance sur 10 de marquer</span><span class="a-cout">0</span></button></div>`;
    } else {
      boutons = `${barreDetails()}<div class="grille ${detailsActions() ? 'details' : ''}">${l.def.actions.map((a) => {
        const f = ACTIONS[a].famille;
        const spe = f === l.def.familleSpeciale && speciaux(e, S.HUMAIN, seq, a);
        return `<button class="action ${spe ? 'peut-speciale' : ''}" data-action="${a}" data-mode="sequence" ${spe ? 'data-spe="1"' : ''} ${ok.includes(a) || spe ? '' : 'disabled'}>
          ${spe ? '<span class="badge-spe" aria-label="Action spéciale possible">★</span>' : ''}
          <span class="ico f-${f}">${ICONE[f]}</span>
          <span class="a-nom">${echap(nomLocal(l.def.nation, a))}</span>
          <span class="a-fr"><b class="a-effet">${effetAction(a)}</b></span>
          <span class="a-cout">−${fmt(coutALaPlace(e, S.HUMAIN, seq, { action: a }))}</span></button>`;
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

export function brancherSequence() {
  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="sequence"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, (c) => {
      if (S.sequenceHumain.length >= TAILLE_SEQUENCE) return;
      S.sequenceHumain = [...S.sequenceHumain, c];
      ecranCombat();
    })),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-retirer]').forEach((b) =>
    b.addEventListener('click', () => {
      S.sequenceHumain = S.sequenceHumain.slice(0, Number(b.dataset.retirer));
      ecranCombat();
    }),
  );
  app.querySelector('[data-valider-seq]')?.addEventListener('click', validerSequenceHumain);
}

export function validerSequenceHumain() {
  if (S.mode === 'ligne') {
    const e = S.vueLigne?.etat;
    if (!e || !S.vueLigne?.aChoisir || validerSequence(e, S.HUMAIN, S.sequenceHumain)) return;
    void S.duel?.jouerSequence(S.sequenceHumain);
    S.sequenceHumain = [];
    ecranCombat();
    return;
  }
  if (!S.partie || S.enAttente) return;
  const erreur = validerSequence(S.partie.etat, S.HUMAIN, S.sequenceHumain);
  if (erreur) {
    S.sequenceHumain = [];
    ecranCombat();
    return;
  }
  S.enAttente = true;
  const seqO = S.partie.sequenceOrdi();
  const vue = apercuSequence(S.partie.etat, S.HUMAIN, seqO);
  if (vue) return fenetreInitiativeSequence(seqO, vue);
  suiteSequence(S.sequenceHumain, seqO);
}

// Initiative : le joueur voit la dernière action de l'ordinateur et peut changer la sienne.
export function fenetreInitiativeSequence(seqO: Choix[], vue: Choix) {
  fenetreDerniereAction(S.partie!.etat, S.sequenceHumain, vue, 'l\'ordinateur', (seq) => suiteSequence(seq, seqO));
}

// Fenêtre d'initiative du mode Enchaînement : la dernière action adverse, et le choix de garder
// ou de changer sa propre dernière action. `decider` reçoit la séquence finale.
export function fenetreDerniereAction(e: EtatCombat, maSeq: Choix[], vue: Choix, qui: string, decider: (seq: Choix[]) => void) {
  const n = TAILLE_SEQUENCE - 1;
  const debut = maSeq.slice(0, n);
  const mien = maSeq[n];
  const libO = libelleAction(e.joueurs[S.ORDI].def.nation, vue.action);
  const fO = famille(vue.action);
  const libM = libelleAction(e.joueurs[S.HUMAIN].def.nation, mien.action);
  const ok = actionsAjoutables(e, S.HUMAIN, debut).filter((a) => a !== mien.action);
  const autres = ok.map((a) => {
    const f = ACTIONS[a].famille;
    return `<button class="action" data-autre="${a}"><span class="ico f-${f}">${ICONE[f]}</span>
      <span class="a-nom">${echap(nomLocal(e.joueurs[S.HUMAIN].def.nation, a))}</span>
      <span class="a-fr"><b class="a-effet">${effetAction(a)}</b></span><span class="a-cout">−${fmt(coutALaPlace(e, S.HUMAIN, debut, { action: a }))}</span></button>`;
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

export function suiteSequence(seqH: Choix[], seqO: Choix[]) {
  if (!S.partie) return;
  const finale = S.partie.reactionSequenceOrdi(seqH, seqO);
  const change = finale[finale.length - 1].action !== seqO[seqO.length - 1].action;
  resoudreSequenceHumain(seqH, finale, change, []);
}

export function resoudreSequenceHumain(seqH: Choix[], seqO: Choix[], change: boolean, faces: Face[]) {
  if (!S.partie) return;
  const r = S.partie.resoudreSequence(seqH, seqO, change, faces);
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
    S.tours.push(t);
    for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) S.scoresPeriodes.push([Number(m[1]), Number(m[2])]);
    }
  }
  S.sequenceHumain = [];
  fermerFenetre();
  S.enAttente = false;
  ecranCombat();
}

// La case de la dernière séquence : les duels se révèlent l'un après l'autre.
export function caseSequence(e: EtatCombat, s: SequenceJouee): string {
  const dh = e.joueurs[S.HUMAIN].def;
  const dO = e.joueurs[S.ORDI].def;
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
      ${s.rupture ? `<p class="onomato ${s.rupture.par === S.HUMAIN ? 'rouge' : 'bleu'} seq-brisee" style="animation-delay:${fin}ms">CHAÎNE BRISÉE !</p>` : ''}
      ${pts ? `<ul class="case-points" style="animation-delay:${fin}ms">${pts}</ul>` : ''}
    </section>`;
}

// La case du dernier tour : les deux actions se révèlent, puis le mot du résultat.
export function caseDernierTour(e: EtatCombat): string {
  const seqVue = e.enchainement ? sequenceAffichee() : null;
  if (seqVue) return caseSequence(e, seqVue);
  const t = S.tours[S.tours.length - 1];
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  if (!t) {
    return `
      <section class="case face-a-face">
        <div class="vs-portrait rouge">${portrait(h.def)}<span>Toi</span></div>
        <span class="vs">VS</span>
        <div class="vs-portrait bleu">${portrait(o.def)}<span>${adv()}</span></div>
        <p class="case-aide">${e.enchainement
          ? `Compose en bas ta séquence de ${TAILLE_SEQUENCE} actions, dans l'ordre. ${S.mode === 'ligne' ? 'Ton ami' : 'L\'ordinateur'} fait de même en secret ; les actions sont comparées une à une. Un contre réussi à la 1re action brise la chaîne ; un matraquage réussi à la 2e action peut annuler la dernière action adverse. L'action spéciale est possible dès le 2e tour, puis après 3 actions de recharge.`
          : `Choisis ton action en bas. ${S.mode === 'ligne' ? 'Ton ami' : 'L\'ordinateur'} choisit en même temps que toi, en secret. Sous 50 d'endurance, tes actions peuvent rater.`}${e.infini ? ' Durée infinie : le combat ne s\'arrête que sur un tombé ou un abandon.' : ''}</p>
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

export function tableau(e: EtatCombat): string {
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  const pastilles = (n: number) =>
    Array.from({ length: REGLES.periodesPourGagner }, (_, i) => `<i class="${i < n ? 'pleine' : ''}"></i>`).join('');
  const historique = S.scoresPeriodes.length
    ? `<span class="hist">${S.scoresPeriodes.map(([a, b], i) => `P${i + 1} ${a}-${b}`).join('  ')}</span>`
    : '';
  const coin = (l: EtatLutteur, c: 'rouge' | 'bleu', qui: string) => `
      <button class="coin ${c}" data-voir="${l.def.id}" aria-label="Voir la carte de ${echap(l.def.nom)}">
        <span class="coin-tete"><span class="vignette">${portrait(l.def)}</span><span class="qui">${qui}<br><small>${echap(l.def.nom)}</small></span></span>
        <span class="score">${l.score}</span>
        ${e.rapide ? '' : `<span class="periodes" aria-label="Périodes gagnées : ${l.periodesGagnees}">${pastilles(l.periodesGagnees)}</span>`}
      </button>`;
  return `
    <header class="tableau">
      ${coin(h, 'rouge', `${echap(moiNom())} ${pastilleNiveau(niveauCompte(S.collection))}`)}
      <div class="centre">
        ${e.infini
          ? `<span class="per">Durée <b>infinie</b></span>
             <span class="trn">Tour <b>${e.tour}</b></span>`
          : e.rapide
          ? `<span class="per">${e.mortSubite ? '<b class="mort-subite">Mort subite</b>' : 'Combat <b>rapide</b>'}</span>
             <span class="trn">Tour <b>${e.tour}</b>${e.mortSubite ? '' : `/${toursPeriode(e)}`}</span>`
          : `<span class="per">Période <b>${e.periode}</b>/3</span>
             <span class="trn">Tour <b>${e.tour}</b>/${toursPeriode(e)}</span>`}
        ${historique}
        <span class="niv">${S.mode === 'ligne' ? 'Entre amis' : `Ordi ${niveauOrdi(S.partie?.niveau)}`}</span>
      </div>
      ${coin(o, 'bleu', `${echap(adv())} ${S.mode === 'ligne' ? pastilleNiveau(S.vueLigne?.amiNiveau) : ''}`)}
    </header>`;
}

export function ecranCombat() {
  const e = etatEnCours();
  if (!e) return;
  const animer = S.tours.length !== S.toursAnimes;
  S.toursAnimes = S.tours.length;
  if (S.tuto && (e.termine || e.periode > 1 || (S.partie?.toursJoues ?? 0) >= R_.tutoriel.toursCombat)) return ecranFinTutoriel();
  if (S.enTournoi !== null && e.termine) return finCombatTournoi(false);
  if (e.termine) return S.mode === 'ligne' ? ecranFinLigne() : ecranFin();
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];

  app.innerHTML = `
    <main class="combat">
      <div class="haut-combat">
        ${tableau(e)}
        <section class="jauges" aria-label="Endurance">
          ${barre(h, S.HUMAIN, 'rouge', 'Toi')}
          <span class="jauges-vs" aria-hidden="true">VS</span>
          ${barre(o, S.ORDI, 'bleu', adv())}
        </section>
      </div>
      <section class="badges-ligne">
        <div class="badges rouge">${badges(e, S.HUMAIN)}${S.bonusEnCours?.moi ? `<span class="badge">🚩 Nation +${Math.round(S.bonusEnCours.moi * 100)} %</span>` : ''}</div>
        <div class="badges bleu">${badges(e, S.ORDI)}${S.bonusEnCours?.lui ? `<span class="badge">🚩 Nation +${Math.round(S.bonusEnCours.lui * 100)} %</span>` : ''}</div>
      </section>
      ${caseDernierTour(e)}
      <footer class="pave">
        ${h.initiative ? `<p class="spe-info init">${e.enchainement
          ? `Tu as l'initiative : après ta séquence, tu verras la dernière action ${S.mode === 'ligne' ? 'de ton ami' : 'de l\'ordinateur'} et pourras changer la tienne.`
          : `Tu as l'initiative : après ton choix, tu verras deux actions possibles ${S.mode === 'ligne' ? 'de ton ami' : 'de l\'ordinateur'}.`}</p>` : ''}
        ${S.mode === 'ligne' ? '<p class="statut" aria-live="polite"></p>' : ''}
        ${bulleCoach()}${bulleConseil(e)}

        <div class="actions-zone">${e.enchainement ? paveSequence(e) : boutonsActions(e, 'tour')}</div>
        <p class="graine">${S.mode === 'ligne' ? `Salle ${S.codeSalle.toUpperCase()} · combat n° ${S.vueLigne?.graine ?? ''}` : S.tuto ? 'Combat guidé' : `Combat n° ${S.partie!.hasard.graine}`} · <button class="lien" data-quitter>${S.tuto ? 'Quitter le tutoriel' : 'Abandonner'}</button></p>
        ${S.mode !== 'ligne' && !S.tuto && outilsTestVisibles(S.collection.coach) ? '<button class="secondaire bouton-test" data-passer-combat>⏩ Passer le combat et gagner (test)</button>' : ''}
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
  S.endurancesAvant = [e.joueurs[0].endurance, e.joueurs[1].endurance];
  if (!animer) app.querySelector('.case')?.classList.add('fige');
  guiderBoutons(app);
  brancherAppuiLong(app);

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
      const style = S.mode === 'ligne'
        ? (idx === S.HUMAIN ? S.vueLigne?.monStyle : S.vueLigne?.amiStyle) ?? 0
        : idx === S.HUMAIN ? styleDe(S.collection, b.dataset.voir!) : 0;
      fenetreCarte(e.joueurs[idx].def, style);
    }),
  );
  app.querySelector('[data-passer-combat]')?.addEventListener('click', () => {
    if (!S.partie) return;
    gagnerTout(S.partie.etat, S.HUMAIN);
    ecranCombat();
  });
  app.querySelector('[data-quitter]')?.addEventListener('click', () => {
    if (S.tuto) {
      S.tuto = false;
      S.partie = null;
      location.hash = '#combat';
      return;
    }
    if (!confirmerAbandon()) return;
    if (S.mode === 'ligne') S.duel?.abandonner();
    else if (S.enTournoi !== null) finCombatTournoi(true);
    else ecranArene(!!S.partie?.etat.rapide);
  });
  if (S.mode === 'ligne') majStatutLigne();
}

export function confirmerAbandon(): boolean {
  // Pas de fenêtre du navigateur : un second appui confirme.
  const b = app.querySelector<HTMLButtonElement>('[data-quitter]')!;
  if (b.dataset.confirme) return true;
  b.dataset.confirme = '1';
  b.textContent = 'Appuie encore pour abandonner';
  return false;
}

export function lireChoix(b: HTMLButtonElement): Choix {
  const a = b.dataset.action as ActionJouee;
  return a === 'lutte' || a === 'souffle' ? { action: a } : { action: a, speciale: b.dataset.speciale === '1' };
}

// Choix d'une action : si elle peut être jouée en spéciale (elle brille), le jeu demande d'abord
// si on active l'action spéciale, dans une petite bulle par-dessus l'écran.
export function demanderSpeciale(b: HTMLButtonElement, suite: (c: Choix) => void) {
  const c = lireChoix(b);
  if (b.dataset.spe !== '1' || c.action === 'lutte' || c.action === 'souffle') return suite(c);
  if (S.mode === 'solo' && tourGuideEssai()) return suite({ action: c.action, speciale: false }); // tour guidé d'un essai : action normale
  const e = S.partie?.etat ?? S.vueLigne?.etat;
  if (!e) return suite(c);
  const l = e.joueurs[S.HUMAIN];
  const a = c.action;
  const nom = echap(nomLocal(l.def.nation, a));
  const normaleOk = actionsJouables(e, S.HUMAIN).includes(a);
  const g = etapeGuidee();
  document.querySelector('.choix-spe')?.remove();
  const el = document.createElement('div');
  el.className = 'choix-spe';
  el.innerHTML = `<div class="choix-spe-boite" role="dialog" aria-modal="true" aria-label="Activer l'action spéciale ?">
    <h3>★ Activer l'action spéciale ?</h3>
    <button class="principal" data-oui ${g && !g.conseil.speciale ? 'disabled' : ''}>
      <b>★ ${nom} spéciale</b><small>${EFFET_SPECIALE[ACTIONS[a].famille]} · −${fmt(b.dataset.mode === 'sequence' ? coutALaPlace(e, S.HUMAIN, S.sequenceHumain, { action: a, speciale: true }) : coutSpeciale(e, S.HUMAIN, a))} d'endurance</small></button>
    <button class="secondaire" data-non ${normaleOk && !(g && g.conseil.speciale) ? '' : 'disabled'}>
      <b>${nom} normale</b><small>${effetAction(a, { feinte: l.bonusFeinte > 0, enchainement: l.bonusEnchainement, combo: pointsCombo(l, a) })} · −${fmt(coutDuTour(e, S.HUMAIN, a))} d'endurance</small></button>
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

export function choisir(choixHumain: Choix) {
  if (S.mode === 'ligne') {
    S.duel?.jouer(choixHumain);
    return;
  }
  if (!S.partie || S.enAttente) return;
  S.enAttente = true;
  const choixOrdi = S.partie.choixOrdi();
  const apercu = S.partie.apercuPourHumain(choixOrdi.action);
  if (apercu) fenetreInitiative(choixHumain, choixOrdi, apercu);
  else suite(choixHumain, choixOrdi);
}

export function suite(choixHumain: Choix, choixOrdi: Choix) {
  if (!S.partie) return;
  const final = S.partie.reactionOrdi(choixHumain, choixOrdi);
  const change = final.action !== choixOrdi.action;
  resoudre(choixHumain, final, change);
}

export function resoudre(choixHumain: Choix, choixOrdi: Choix, change: boolean, face?: Face) {
  if (!S.partie) return;
  const r = S.partie.resoudre(choixHumain, choixOrdi, change, face);
  if (r === 'pileOuFace') return fenetrePileOuFace(choixHumain, choixOrdi, change);
  S.tours.push(r);
  for (const l of r.lignes) {
    const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
    if (m) S.scoresPeriodes.push(S.HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
  }
  fermerFenetre();
  S.enAttente = false;
  ecranCombat();
}


// ---------- Fenêtres ----------

export function ouvrirFenetre(html: string, fermable = false): HTMLElement {
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

export function fermerFenetre() {
  document.querySelector('.voile')?.remove();
  document.querySelector('.revelation')?.remove(); // ouverture de booster interrompue (changement d'écran)
}

export function fenetreCarte(def: DefLutteur, style = 0) {
  const f = ouvrirFenetre(`<div class="fenetre-carte">${carteHTML(def, '', { style })}</div><button class="secondaire" data-fermer>Fermer</button>`, true);
  activerReflets(f);
}

export function fenetreInitiative(choixHumain: Choix, choixOrdi: Choix, apercu: ActionJouee[]) {
  const e = S.partie!.etat;
  const nationO = e.joueurs[S.ORDI].def.nation;
  const mien = libelleAction(e.joueurs[S.HUMAIN].def.nation, choixHumain.action);
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

export function fenetrePileOuFace(choixHumain: Choix, choixOrdi: Choix, change: boolean) {
  const f = ouvrirFenetre(`
    <h2>Tentative de tombé !</h2>
    ${htmlDuel(choixHumain, choixOrdi, S.partie!.etat)}
    <p>L'ordinateur est sur le point de te faire tomber. Annonce pile ou face : si la pièce tombe sur ton annonce, tu t'en sors.</p>
    <div class="pile-face">
      <button class="principal" data-face="pile">Pile</button>
      <button class="principal" data-face="face">Face</button>
    </div>`);
  f.querySelectorAll<HTMLButtonElement>('[data-face]').forEach((b) =>
    b.addEventListener('click', () => resoudre(choixHumain, choixOrdi, change, b.dataset.face as Face)),
  );
}




// Combat d'arène : l'adversaire et le niveau de l'ordinateur viennent de la progression
// (ou du boss choisi pour une revanche).
export function lancerArene(idHumain: string, auto = false) {
  if (S.bossChoisi) {
    const nation = S.bossChoisi;
    lancer(idHumain, adversairesDe(nation)[PAR_NATION - 1], nouvelleGraine(), false, 'fort', auto, { type: 'boss', nation });
    return;
  }
  const e = etapeArene(S.collection);
  if (!e.adversaire) return ecranArene();
  lancer(idHumain, e.adversaire, nouvelleGraine(), false, e.niveau, auto, { type: 'progression' });
}


// `essai` : partie d'essai d'un tutoriel court (format, durée et lutteur imposés ; pas de récompense).
export function lancer(idHumain: string, idOrdi: string, graine: number, rapide = false, niveau: Niveau = S.collection.niveau, auto = false, ctx: typeof S.areneCtx = null, interclub = false,
  essai: { id: IdTuto; enchainement: boolean; infini: boolean; def: DefLutteur; defOrdi?: DefLutteur; script?: Choix[]; scriptSeq?: Sequence[] } | null = null) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  S.mode = 'solo';
  S.HUMAIN = 0;
  S.ORDI = 1;
  // Mode Enchaînement : à l'essai, seulement en combat rapide (pas en interclub ni en arène).
  const libre = rapide && !interclub && !ctx; // les styles de combat : combat rapide seulement
  const ench = essai ? essai.enchainement : libre && S.enchainementChoisi;
  const inf = essai ? essai.infini : libre && S.infiniChoisi;
  S.essaiSolo = essai?.id ?? null;
  // Durée infinie en combat rapide : l'adversaire est toujours Cocoach, le rival, à son niveau.
  const rival = inf;
  if (rival) {
    idOrdi = ID_RIVAL;
    niveau = essai ? 'normal' : niveauOrdiRival(S.collection); // partie d'essai : Cocoach Rare, ordinateur normal
  }
  // Partie d'essai guidée : actions (ou séquences) imposées à l'ordinateur sur les premiers tours.
  S.partie = new Partie(idHumain, idOrdi, graine, niveau, essai?.def ?? avecDeck(defPossede(S.collection, idHumain), deckDe(S.collection, idHumain)), essai?.script ?? [], rapide, essai?.defOrdi ?? (rival ? defRival(S.collection) : undefined), ench, inf);
  if (essai?.scriptSeq) S.partie.scriptSequences = essai.scriptSeq;
  S.sequenceHumain = [];
  S.areneCtx = ctx;
  S.interclubEnCours = interclub;
  S.tours = [];
  S.scoresPeriodes = [];
  S.enAttente = false;
  S.endurancesAvant = null;
  S.recompenseDonnee = false;
  S.paquetSolo = null;
  S.messageSolo = '';
  S.tuto = false;
  S.enTournoi = null;
  S.bonusEnCours = null;
  S.bonusCeCombat = rapide || essai ? false : S.collection.bonusTutoriel;
  if (essai) {
    S.recompenseDonnee = true; // partie d'essai : ni progression, ni quête ; un booster si elle est gagnée (voir ecranFin)
    S.messageSolo = '';
  }
  demarrer(auto);
}
