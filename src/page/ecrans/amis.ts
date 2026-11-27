// Combat entre amis (en ligne).

import { gagnerPoints } from '../classement';
import { lignePointsFin } from './fin';
import { LUTTEURS, trouverLutteur, TAILLE_SEQUENCE, niveauCarte, REGLES as R_, type Face } from '../../moteur';
import { salleEnLigne } from '../firebase';
import { noterFinCombat } from './avis';
import { noterParcours, noterStatsCombat } from './stats';
import { ADRESSE_PUBLIQUE, Duel, RELAIS, codeValide, nouveauCode, salleLocale, salleRelais, type ModeSalle, type Presence, type Role, type Salle, type Vue } from '../enligne';
import { ICONE } from '../textes';
import { NOM_RARETE, activerReflets } from '../carte';
import { niveauCompte, deckDe, etoilesDe, gradeDe, possede, recompenser, sauver, styleDe } from '../collection';
import { noterAmi } from '../club';
import { ecranMenu } from './accueil';
import { CARTES } from './collection';
import { autoDispo, boutonsActions, brancherStyle, demanderSpeciale, ecranCombat, fenetreDerniereAction, fermerFenetre, htmlTourAncien, ouvrirFenetre, quetesLigneComptees, reglagesStyle } from './combat';
import { S, adv, app, echap, famille, legendeFamille, libelleAction, moiNom, pastilleNiveau, portrait } from './commun';
import { revelerPaquet, sectionPaquet } from './fin';
import { histoire, queteCombat } from './progression';
import { boutonTuto, brancherTutos, tutoAuto } from './tutos-courts';

// ---------- Combat entre amis ----------

export const CLE_SESSION = 'wbc-ligne-session';
export const clePresence = (code: string, role: Role) => `wbc-ligne-${code}-${role}`;

export function sessionLigne(): { code: string; role: Role } | null {
  try {
    const x = JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null');
    return x && codeValide(x.code) && (x.role === 'hote' || x.role === 'invite') ? x : null;
  } catch {
    return null;
  }
}

export function oublierSession() {
  try {
    const x = sessionLigne();
    if (x) localStorage.removeItem(clePresence(x.code, x.role));
    localStorage.removeItem(CLE_SESSION);
  } catch {
    // rien à faire
  }
}

// Où se joue le combat entre amis selon l'adresse de la page.
export function relaisPerso(): string | null {
  try {
    return localStorage.getItem('wbc-relais'); // pour les tests : adresse d'un relais local
  } catch {
    return null;
  }
}
export function acces(): 'relais' | 'local' | 'ailleurs' {
  if (relaisPerso()) return 'relais';
  const h = location.hostname;
  if (h.endsWith('github.io')) return 'relais';
  if (h === 'localhost' || h === '127.0.0.1') return 'local';
  return 'ailleurs';
}

export function ecranAmis(message = '') {
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
        ${reglagesStyle('ligne', 'normal', 'periodes', [['periodes', '3 périodes', 'Le combat complet'], ['rapide', 'Rapide', 'Une période, sans booster'], ['infinie', 'Infinie', 'Jusqu\'au tombé, sans booster']])}
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
      ${boutonTuto('amis')}
      <a class="lien" href="#">Retour</a>
    </main>`;
  brancherTutos();
  brancherStyle('ligne', () => undefined);
  tutoAuto('amis');
  app.querySelectorAll<HTMLButtonElement>('[data-creer]').forEach((b) =>
    b.addEventListener('click', () => {
      const duree = app.querySelector<HTMLInputElement>('input[name="ligne-duree"]:checked')?.value;
      const format = app.querySelector<HTMLInputElement>('input[name="ligne-format"]:checked')?.value;
      connecter(nouveauCode(), 'hote', b.dataset.creer === 'collection' ? 'collection' : 'base', duree === 'rapide', format === 'enchainement', duree === 'infinie');
    }),
  );
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranAmis('Le code fait 4 lettres, sans chiffres.');
    connecter(code, 'invite');
  });
  window.scrollTo(0, 0);
}

export async function connecter(code: string, role: Role, modeSalle?: ModeSalle, rapide = false, enchainement = false, infini = false, epuisement?: number) {
  app.innerHTML = '<main class="amis"><header class="titre"><h1>Connexion…</h1><p>Ouverture de la salle.</p></header></main>';
  const a = acces();
  if (a === 'ailleurs') return ecranAmis();
  const perso = relaisPerso();
  // Firebase d'abord, relais publics en secours (un relais personnel, pour les tests, remplace tout).
  const salle: Salle = a === 'local' ? salleLocale(code) : perso ? salleRelais(code, [perso]) : salleEnLigne(code, () => salleRelais(code, RELAIS));
  S.salleActive = salle;
  let depart: Presence | null = null;
  try {
    depart = JSON.parse(localStorage.getItem(clePresence(code, role)) ?? 'null');
    localStorage.setItem(CLE_SESSION, JSON.stringify({ code, role }));
  } catch {
    depart = null;
  }
  S.partie = null;
  S.mode = 'ligne';
  S.bonusEnCours = null;
  S.codeSalle = code;
  S.HUMAIN = role === 'hote' ? 0 : 1;
  S.ORDI = role === 'hote' ? 1 : 0;
  S.toursAffiches = -1;
  S.fenetreLigne = '';
  S.absentDepuis = null;
  if (location.hash) history.replaceState(null, '', location.pathname);
  S.duel = new Duel(salle, role, depart, (p) => {
    try {
      localStorage.setItem(clePresence(code, p.role), JSON.stringify(p));
    } catch {
      // pas de sauvegarde possible : la reprise après rechargement ne marchera pas
    }
  }, { mode: modeSalle, coach: S.collection.coach, idCoach: S.collection.idCoach, niveauCompte: niveauCompte(S.collection), rapide, enchainement, infini, epuisement });
  S.duel.surVue(rafraichirLigne);
}

export function quitterLigne() {
  if (S.duel) S.duel.fermer();
  S.duel = null;
  S.salleActive = null;
  S.vueLigne = null;
  S.mode = 'solo';
  S.HUMAIN = 0;
  S.ORDI = 1;
  fermerFenetre();
}

export function rafraichirLigne(v: Vue) {
  S.vueLigne = v;
  if (S.mode !== 'ligne') return;
  // Le rôle peut changer (ami revenu dans la salle avec le code) : on suit le duel.
  if (S.duel && S.HUMAIN !== (S.duel.role === 'hote' ? 0 : 1)) {
    S.HUMAIN = S.duel.role === 'hote' ? 0 : 1;
    S.ORDI = S.HUMAIN === 0 ? 1 : 0;
    S.toursAffiches = -1;
    try {
      localStorage.setItem(CLE_SESSION, JSON.stringify({ code: S.codeSalle, role: S.duel.role }));
    } catch {
      // pas de sauvegarde possible
    }
  }
  // Absence de l'ami pendant le combat
  if (v.phase === 'combat' && !v.amiPresent) S.absentDepuis ??= Date.now();
  else S.absentDepuis = null;
  clearTimeout(S.minuteurAbsence);
  if (S.absentDepuis) S.minuteurAbsence = window.setTimeout(() => S.vueLigne && rafraichirLigne(S.vueLigne), 5000);

  if (v.phase === 'attente-ami' || v.phase === 'choix-lutteur') {
    const sig = `${v.enchainement}|${v.infini}|${v.phase}|${v.amiPresent}|${v.monLutteur}|${v.amiLutteur}|${v.attente}|${S.salleActive?.connecte()}|${v.modeSalle}|${v.amiCoach}|${v.autoMoi}|${v.autoAmi}`;
    if (sig !== S.signatureSalle) ecranSalle(v);
    S.signatureSalle = sig;
    return;
  }
  S.signatureSalle = '';
  if (v.phase === 'fin') {
    fermerFenetre();
    S.fenetreLigne = '';
    S.tours = v.tours;
    S.scoresPeriodes = [];
    for (const t of S.tours) for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) S.scoresPeriodes.push(S.HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
    }
    return ecranFinLigne();
  }
  // Combat : on ne redessine tout que quand un nouveau tour est joué.
  if (v.tours.length !== S.toursAffiches || !app.querySelector('.combat')) {
    if (v.tours.length !== S.toursAffiches) S.sequenceHumain = []; // nouvelle séquence jouée : on recompose
    S.toursAffiches = v.tours.length;
    S.tours = v.tours;
    S.scoresPeriodes = [];
    for (const t of S.tours) for (const l of t.lignes) {
      const m = l.match(/^Période \d gagnée par .* : (\d+) - (\d+)\.$/);
      if (m) S.scoresPeriodes.push(S.HUMAIN === 0 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]);
    }
    if (S.toursAffiches === 0 || !app.querySelector('.combat')) S.endurancesAvant = null;
    S.fenetreLigne = '';
    fermerFenetre();
    ecranCombat();
  }
  majStatutLigne();
}

// Met à jour la zone d'état et les fenêtres sans tout redessiner.
export function majStatutLigne() {
  const v = S.vueLigne;
  const e = v?.etat;
  if (!v || !e || v.phase !== 'combat') return;
  const statut = app.querySelector<HTMLElement>('.statut');
  const zone = app.querySelector<HTMLElement>('.actions-zone');
  let texte = '';
  if (S.absentDepuis) {
    const s = Math.round((Date.now() - S.absentDepuis) / 1000);
    texte = s >= 120 ? 'Ton ami est parti depuis plus de 2 minutes.' : `Ton ami s'est déconnecté. En attente de son retour… (${s} s)`;
  } else if (v.desaccord) {
    texte = 'Attention : vos deux téléphones ne calculent pas la même chose. Recommencez le combat.';
  } else if (v.aChoisir) {
    texte = v.enchainement ? 'À toi de composer ta séquence.' : 'À toi de choisir ton action.';
  } else if (v.maSequence && v.attente) {
    const noms = v.maSequence.map((c) => `${c.speciale ? '★ ' : ''}${libelleAction(e.joueurs[S.HUMAIN].def.nation, c.action).local}`).join(', ');
    texte = `Ta séquence : ${noms}. ${v.attente}`;
  } else if (v.monChoix && v.attente) {
    const lib = libelleAction(e.joueurs[S.HUMAIN].def.nation, v.monChoix.action);
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
  if (S.absentDepuis && Date.now() - S.absentDepuis >= 120_000 && !app.querySelector('[data-forfait]')) {
    statut?.insertAdjacentHTML('afterend', '<button class="secondaire" data-forfait>Arrêter : victoire par forfait</button>');
    app.querySelector('[data-forfait]')!.addEventListener('click', () => {
      oublierSession();
      quitterLigne();
      ecranMenu();
    });
  }
  // Fenêtres d'initiative et de pile ou face
  if (v.initiative && S.fenetreLigne !== 'init') {
    S.fenetreLigne = 'init';
    fenetreInitiativeLigne(v);
  } else if (v.pileOuFace && S.fenetreLigne !== 'face') {
    S.fenetreLigne = 'face';
    fenetrePileOuFaceLigne(v);
  } else if (!v.initiative && !v.pileOuFace && S.fenetreLigne) {
    S.fenetreLigne = '';
    fermerFenetre();
  }
}

export function ecranSalle(v: Vue) {
  const enCollection = v.modeSalle === 'collection';
  const dispo = enCollection ? CARTES.filter((l) => possede(S.collection, l.id)) : LUTTEURS;
  const liste = dispo.map((l) => {
    const g = enCollection ? gradeDe(S.collection, l.id) : 1;
    return `
    <button class="choix-l ${v.monLutteur === l.id ? 'pris' : ''}" data-l="${l.id}" aria-pressed="${v.monLutteur === l.id}">
      <span class="vignette">${portrait(l)}</span>
      <span><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[niveauCarte(l, g)]}</small></span>
    </button>`;
  }).join('');
  const modeTexte = (v.enchainement ? `Mode Enchaînement (séquences de ${TAILLE_SEQUENCE} actions) · ` : '') + (v.modeSalle === null ? 'Connexion à la salle…'
    : v.infini ? `Durée infinie (fin par tombé ou abandon, épuisement dès le tour ${v.epuisement ?? R_.infini.debutEpuisement}) · ${enCollection ? 'vos collections' : 'cartes de base'} · 2 médailles par victoire, pas de booster.`
    : v.rapide ? `Combat rapide (une période, mort subite) · ${enCollection ? 'vos collections' : 'cartes de base'} · 2 médailles par victoire, pas de booster.`
    : enCollection ? 'Mode : vos collections (fusions comprises) · 2 boosters et 2 médailles par victoire.'
    : 'Mode : cartes de base, toutes permises · 2 médailles par victoire, pas de booster.');
  const ami = v.amiLutteur ? trouverLutteur(v.amiLutteur) : null;
  app.innerHTML = `
    <main class="amis">
      <header class="titre">
        <h1>Salle ${echap(S.codeSalle.toUpperCase())}</h1>
        <p class="code-grand" aria-label="Code de la salle">${echap(S.codeSalle.toUpperCase())}</p>
        <p class="note">${modeTexte}</p>
        <p>${!S.salleActive?.connecte() ? 'Connexion…' : v.amiPresent ? `<b class="ok">${echap(v.amiCoach ? `Coach ${v.amiCoach}` : 'Ton ami')} ${pastilleNiveau(v.amiNiveau)} est dans la salle.</b>` : 'Envoie ce code à ton ami. Il ouvre ce même lien, touche « Combat entre amis » et tape le code.'}</p>
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
    b.addEventListener('click', () => S.duel?.choisirLutteur(b.dataset.l!, deckDe(S.collection, b.dataset.l!), enCollection ? gradeDe(S.collection, b.dataset.l!) : 1, enCollection ? etoilesDe(S.collection, b.dataset.l!) : {}, enCollection ? styleDe(S.collection, b.dataset.l!) : 0)),
  );
  app.querySelector<HTMLInputElement>('[data-auto-ligne]')?.addEventListener('change', (ev) => S.duel?.choisirAuto((ev.target as HTMLInputElement).checked));
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranMenu();
  });
}

export function fenetreInitiativeLigne(v: Vue) {
  const e = v.etat!;
  if (v.enchainement) {
    if (!v.maSequence || !v.initiative?.length) return;
    return fenetreDerniereAction(e, v.maSequence, { action: v.initiative[0] }, 'ton ami', (seq) => S.duel?.deciderSequence(seq));
  }
  const choix = v.monChoix;
  const nationA = e.joueurs[S.ORDI].def.nation;
  const options = v.initiative!.map((a) => {
    const lib = libelleAction(nationA, a);
    const f = famille(a);
    return `<li class="bleu"><span class="ico f-${f}">${ICONE[f]}</span><b>${echap(lib.local)}</b> <small>${echap(lib.fr)}${legendeFamille(f)}</small></li>`;
  }).join('');
  const mien = choix ? libelleAction(e.joueurs[S.HUMAIN].def.nation, choix.action) : null;
  const f = ouvrirFenetre(`
    <h2>Initiative</h2>
    <p>Ton ami a choisi une de ces deux actions :</p>
    <ul class="apercu">${options}</ul>
    ${choix && mien ? `<button class="principal" data-garder>Garder ${choix.speciale ? '★ ' : ''}${echap(mien.local)}</button>` : ''}
    <p class="ou">ou changer pour :</p>
    <div class="pave-fenetre">${boutonsActions(e, 'initiative')}</div>`);
  f.querySelector('[data-garder]')?.addEventListener('click', () => choix && S.duel?.decider(choix));
  f.querySelectorAll<HTMLButtonElement>('[data-mode="initiative"]').forEach((b) =>
    b.addEventListener('click', () => demanderSpeciale(b, (c) => S.duel?.decider(c))),
  );
}

export function fenetrePileOuFaceLigne(v: Vue) {
  const f = ouvrirFenetre(`
    <h2>Tentative de tombé !</h2>
    <p>Ton ami est sur le point de te faire tomber. Annonce pile ou face : si la pièce tombe sur ton annonce, tu t'en sors.</p>
    <div class="pile-face">
      <button class="principal" data-face="pile">Pile</button>
      <button class="principal" data-face="face">Face</button>
    </div>`);
  f.querySelectorAll<HTMLButtonElement>('[data-face]').forEach((b) =>
    b.addEventListener('click', () => S.duel?.annoncer(b.dataset.face as Face)),
  );
  void v;
}

export function ecranFinLigne() {
  const v = S.vueLigne;
  const e = v?.etat;
  if (!v || !e) return;
  noterFinCombat(null, e); // compte le combat (invitation à donner son avis)
  noterStatsCombat(e, { etat: e, moi: S.HUMAIN, tours: S.tours, mode: 'amis', niveau: '', auto: !!v.auto, dureeMs: 0 });
  noterParcours('premier_amis', '', true);
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  let gagne: boolean;
  let comment: string;
  if (v.abandon) {
    gagne = v.abandon === 'ami';
    comment = gagne ? 'par abandon de ton ami' : 'par abandon';
  } else {
    gagne = e.vainqueur === S.HUMAIN;
    comment = e.finPar === 'tombe'
      ? 'par tombé'
      : e.rapide ? `${Math.max(h.score, o.score)} à ${Math.min(h.score, o.score)}${e.mortSubite ? ' en mort subite' : ''}`
      : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  }
  const vainqueur = gagne ? h : o;
  const anciens = S.tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  // Récompense : +2 médailles (et les $ des paliers), plus 2 boosters en mode collection ; une seule fois par combat.
  // Une victoire par abandon ne compte qu'après 5 tours joués.
  const cle = `${S.codeSalle}-${v.graine}`;
  // Médailles dans les deux modes ; boosters seulement avec nos collections.
  if (gagne && (!v.abandon || e.tourGlobal >= 5) && S.paquetLigne?.cle !== cle) {
    if (!S.collection.recompensesEnLigne.includes(cle)) {
      S.collection.recompensesEnLigne = [...S.collection.recompensesEnLigne, cle].slice(-50);
      histoire({ type: 'victoire', nation: o.def.nation, niveau: null });
      histoire({ type: 'enLigne' });
      S.paquetLigne = { cle, paquet: { titre: 'Victoire en ligne', boosters: recompenser(S.collection, 'enLigne', Math.random, 1, v.modeSalle === 'collection' && !v.rapide), ouvert: false } };
      S.pointsFin = gagnerPoints(S.collection, { enLigne: true, tombe: e.finPar === 'tombe' });
      sauver(S.collection);
    }
  }
  const booster = S.paquetLigne?.cle === cle ? sectionPaquet(S.paquetLigne.paquet) : '';
  // Quêtes : le combat compte une fois.
  if (!v.abandon && !quetesLigneComptees.has(cle)) {
    quetesLigneComptees.add(cle);
    S.combatEnAuto = v.auto;
    queteCombat(e, 'enLigne', null);
    S.combatEnAuto = false;
  }
  // Liste d'amis : le combat compte une fois (victoire ou défaite).
  if (v.amiIdCoach && (!v.abandon || e.tourGlobal >= 5)) {
    noterAmi(S.collection, v.amiIdCoach, v.amiCoach, { type: gagne ? 'victoire' : 'defaite', cle: `combat-${cle}` });
    sauver(S.collection);
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
        <p class="hist">${echap(moiNom())} : ${echap(h.def.nom)} · ${echap(adv())} : ${echap(o.def.nom)} · ${e.tourGlobal} tours · salle ${echap(S.codeSalle.toUpperCase())}</p>
        ${v.auto ? '<p class="hist">⚡ Combat joué en automatique : l\'ordinateur a joué pour vous deux, selon vos niveaux de compte.</p>' : ''}
        ${S.paquetLigne?.cle === cle ? lignePointsFin() : ''}
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
  app.querySelector('[data-revanche]')!.addEventListener('click', () => S.duel?.revanche());
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => S.paquetLigne && revelerPaquet(S.paquetLigne.paquet, ecranFinLigne));
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranMenu();
  });
}
