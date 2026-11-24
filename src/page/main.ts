// La page du jeu : affiche le combat et transmet les choix au moteur.

import './style.css';
import {
  ACTIONS, LUTTEURS, REGLES, actionsJouables, chanceReussite, coutSpeciale, nomLocal,
  peutJouerSpeciale, precisionDe, specialeOuverte, trouverLutteur,
  type Choix, type DefLutteur, type EtatCombat, type EtatLutteur, type Face, type Famille, type IdAction,
  type Joueur, type Nation,
} from '../moteur';
import { HUMAIN, ORDI, Partie, type TourJoue } from './partie';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE } from './textes';
import { NOM_RARETE, ORDRE_RARETE, activerReflets, carteHTML } from './carte';
import { portraitSVG } from './portrait';

const app = document.getElementById('app')!;

// ---------- État de la page ----------

let partie: Partie | null = null;
let tours: TourJoue[] = [];
let scoresPeriodes: [number, number][] = [];
let enAttente = false; // un tour est en cours de résolution (fenêtre ouverte)
let endurancesAvant: [number, number] | null = null; // pour animer les barres
let idPortrait = 0;

// ---------- Outils ----------

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const pct = (x: number) => `${Math.round(x * 100)} %`;
const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function famille(a: IdAction | 'lutte'): Famille | 'lutte' {
  return a === 'lutte' ? 'lutte' : ACTIONS[a].famille;
}

function libelleAction(nation: string, a: IdAction | 'lutte'): { local: string; fr: string } {
  if (a === 'lutte') return { local: 'Lutte', fr: 'Lutte' };
  return { local: nomLocal(nation, a), fr: ACTIONS[a].nom };
}

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

const portrait = (def: DefLutteur) => portraitSVG(def, `m${idPortrait++}`);

// ---------- Écran 1 : choix du lutteur ----------

const NATIONS: { id: Nation; nom: string }[] = [
  { id: 'usa', nom: 'USA' }, { id: 'russie', nom: 'Russie' }, { id: 'europe', nom: 'Europe' },
  { id: 'afrique', nom: 'Afrique' }, { id: 'japon', nom: 'Japon' },
];

function ecranChoix() {
  partie = null;
  const cartes = LUTTEURS.map((l) => `
    <div class="emplacement" id="carte-${l.id}" data-nation="${l.nation}">
      ${carteHTML(l, `<button class="principal cl-choisir" data-lutteur="${l.id}">Lutter avec ${echap(l.nom)}</button>`)}
    </div>`).join('');
  const puces = NATIONS.map((n) => `<button class="puce" data-aller="${n.id}">${n.nom}</button>`).join('');

  app.innerHTML = `
    <main class="choix">
      <header class="titre">
        <h1>Wrestling Battle Card</h1>
        <p>Choisis ton lutteur parmi les 15 cartes. L'ordinateur prend un adversaire au hasard.</p>
      </header>
      <nav class="puces" aria-label="Aller à une nation">${puces}</nav>
      <div class="defile" tabindex="0" aria-label="Cartes des lutteurs">${cartes}</div>
      <div class="defile-nav">
        <button class="rond" data-pas="-1" aria-label="Carte précédente">‹</button>
        <a class="lien" href="#galerie">Voir la galerie par rareté</a>
        <button class="rond" data-pas="1" aria-label="Carte suivante">›</button>
      </div>
    </main>`;

  const defile = app.querySelector<HTMLElement>('.defile')!;
  const pas = (sens: number) => {
    const largeur = defile.querySelector<HTMLElement>('.emplacement')!.offsetWidth + 14;
    defile.scrollBy({ left: sens * largeur, behavior: 'smooth' });
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
  app.querySelectorAll<HTMLButtonElement>('[data-lutteur]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.lutteur!;
      const autres = LUTTEURS.filter((l) => l.id !== id);
      const ordi = autres[Math.floor(Math.random() * autres.length)].id;
      lancer(id, ordi, nouvelleGraine());
    }),
  );
  activerReflets(app);
  window.scrollTo(0, 0);
}

// ---------- Galerie par rareté ----------

function ecranGalerie() {
  partie = null;
  const groupes = ORDRE_RARETE.map((r) => {
    const cartes = LUTTEURS.filter((l) => l.rarete === r).map((l) => carteHTML(l)).join('');
    return `<section class="groupe"><h2>${NOM_RARETE[r]}</h2><div class="grille-cartes">${cartes}</div></section>`;
  }).join('');
  app.innerHTML = `
    <main class="galerie">
      <header class="titre">
        <h1>Galerie</h1>
        <p>Raretés fixées d'après 210 000 combats simulés : les 2 lutteurs qui gagnent le plus sont légendaires, les 3 suivants épiques, puis 5 rares et 5 communes.</p>
        <a class="lien" href="#">Retour au choix du lutteur</a>
      </header>
      ${groupes}
    </main>`;
  activerReflets(app);
  window.scrollTo(0, 0);
}

function lancer(idHumain: string, idOrdi: string, graine: number) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  partie = new Partie(idHumain, idOrdi, graine);
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  ecranCombat();
}

// ---------- Écran 2 : le combat ----------

function badges(e: EtatCombat, j: Joueur): string {
  const l = e.joueurs[j];
  const b: string[] = [];
  if (l.initiative) b.push('Initiative');
  if (l.bonusFeinte) b.push('+2 sur la prochaine attaque');
  if (l.malusPrecisionTours > 0) b.push(`Matraqué : −5 % de précision (${l.malusPrecisionTours} tour${l.malusPrecisionTours > 1 ? 's' : ''})`);
  let serie = 0;
  for (let i = l.historique.length - 1; i >= 0 && l.historique[i].reussie; i--) serie++;
  const attaques = l.historique.slice(l.historique.length - serie).filter((h) => h.attaque).length;
  if (serie >= 2 && attaques >= 1) b.push(`Combo en vue (${serie}/3)`);
  if (l.toursSansAttaque === REGLES.pression.tours - 1) b.push('Passif : attaque ou contre au prochain tour');
  if (l.toursSansEndurance > 0) b.push(`Épuisé : ${l.toursSansEndurance}/${REGLES.toursSansEnduranceAvantTombe}`);
  return b.map((t) => `<span class="badge">${echap(t)}</span>`).join('');
}

function barre(l: EtatLutteur, j: Joueur, coin: 'rouge' | 'bleu', etiquette: string): string {
  const max = l.def.enduranceMax;
  const cible = (l.endurance / max) * 100;
  const depart = endurancesAvant ? (endurancesAvant[j] / max) * 100 : cible;
  const repere = (50 / max) * 100;
  const chance = chanceReussite(precisionDe(l.endurance));
  return `
    <div class="endu ${coin}">
      <div class="endu-ligne">
        <span>${etiquette}</span>
        <span><b>${fmt(l.endurance)}</b> / ${max} · réussite ${pct(chance)}</span>
      </div>
      <div class="endu-barre" role="meter" aria-label="Endurance ${etiquette}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${fmt(l.endurance)}">
        <div class="endu-rempli ${l.endurance < 50 ? 'bas' : ''}" style="width:${depart}%" data-cible="${cible}"></div>
        ${repere < 100 ? `<div class="endu-repere" style="left:${repere}%" title="Sous 50, la précision baisse"></div>` : ''}
      </div>
    </div>`;
}

function etatSpeciale(e: EtatCombat): string {
  const l = e.joueurs[HUMAIN];
  const S = REGLES.speciale;
  const fam = l.def.familleSpeciale;
  const candidates = l.def.actions.filter((a) => ACTIONS[a].famille === fam);
  if (candidates.some((a) => peutJouerSpeciale(e, HUMAIN, a))) return '';
  let raison: string;
  if (e.periode === 3 && e.tour > S.periode3DernierTour) raison = 'plus disponible après le 5e tour de la 3e période';
  else if (e.tour < S.premierTour) raison = 'disponible à partir du 2e tour';
  else if (!specialeOuverte(e, HUMAIN)) {
    const reste = S.toursRecharge - (e.tourGlobal - (l.dernierSpecialTour ?? 0)) + 1;
    raison = `recharge, encore ${reste} tour${reste > 1 ? 's' : ''}`;
  } else raison = 'pas assez d\'endurance';
  return `<p class="spe-info">Action spéciale (${NOM_FAMILLE[fam].toLowerCase()}) : ${raison}.</p>`;
}

function boutonsActions(e: EtatCombat, mode: 'tour' | 'initiative'): string {
  const l = e.joueurs[HUMAIN];
  const jouables = actionsJouables(e, HUMAIN);
  if (jouables.length === 0) {
    return `
      <button class="action lutte" data-action="lutte" data-mode="${mode}">
        <span class="ico">${ICONE.lutte}</span>
        <span class="a-nom">Lutte</span>
        <span class="a-fr">Plus d'endurance : 1 chance sur 10 de marquer 1 ou 2 points</span>
        <span class="a-cout">0</span>
      </button>`;
  }
  const speciales = l.def.actions
    .filter((a) => ACTIONS[a].famille === l.def.familleSpeciale && peutJouerSpeciale(e, HUMAIN, a))
    .map((a) => `
      <button class="action speciale" data-action="${a}" data-speciale="1" data-mode="${mode}">
        <span class="ico f-${ACTIONS[a].famille}">${ICONE[ACTIONS[a].famille]}</span>
        <span class="a-nom">★ ${echap(nomLocal(l.def.nation, a))} spéciale</span>
        <span class="a-fr">${EFFET_SPECIALE[ACTIONS[a].famille]}</span>
        <span class="a-cout">−${fmt(coutSpeciale(e, HUMAIN, a))}</span>
      </button>`)
    .join('');
  const normales = l.def.actions.map((a) => {
    const ok = jouables.includes(a);
    const f = ACTIONS[a].famille;
    return `
      <button class="action" data-action="${a}" data-mode="${mode}" ${ok ? '' : 'disabled'}>
        <span class="ico f-${f}">${ICONE[f]}</span>
        <span class="a-nom">${echap(nomLocal(l.def.nation, a))}</span>
        <span class="a-fr">${echap(ACTIONS[a].nom)} · ${NOM_FAMILLE[f].toLowerCase()}</span>
        <span class="a-cout">−${fmt(ACTIONS[a].cout)}</span>
      </button>`;
  }).join('');
  return `${speciales}<div class="grille">${normales}</div>`;
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
  if ((l = trouve(/se fait tomber/))) return { texte: 'TOMBÉ !', cote: inverse(de(l)), fort: true };
  if ((l = trouve(/il s'en sort/))) return { texte: 'SAUVÉ !', cote: inverse(de(l)), fort: true };
  if ((l = trouve(/renvoyés/))) return { texte: 'CONTRE !', cote: de(l), fort: true };
  if ((l = trouve(/renversement/))) return { texte: 'RENVERSEMENT !', cote: de(l), fort: true };
  const nomsAttaque = Object.values(ACTIONS).filter((a) => a.famille === 'attaque').map((a) => a.nom);
  for (const ligne of L) {
    const m = ligne.match(/ marque (\d+) points? \((.+)\)\.$/);
    if (m && nomsAttaque.includes(m[2])) {
      const pts = Number(m[1]);
      return { texte: pts >= 5 ? 'PROJECTION !' : 'AMENÉE !', cote: de(ligne), fort: pts >= 4 };
    }
  }
  if ((l = trouve(/marque \d+ points? \(Sprawl\)/))) return { texte: 'SPRAWL !', cote: de(l), fort: false };
  if ((l = trouve(/point de sortie/))) return { texte: 'SORTIE !', cote: de(l), fort: false };
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
      <small>${echap(lib.fr)}${f !== 'lutte' ? ` · ${NOM_FAMILLE[f].toLowerCase()}` : ''}</small>
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

// La case du dernier tour : les deux actions se révèlent, puis le mot du résultat.
function caseDernierTour(e: EtatCombat): string {
  const t = tours[tours.length - 1];
  const [h, o] = e.joueurs;
  if (!t) {
    return `
      <section class="case face-a-face">
        <div class="vs-portrait rouge">${portrait(h.def)}<span>Toi</span></div>
        <span class="vs">VS</span>
        <div class="vs-portrait bleu">${portrait(o.def)}<span>Ordi</span></div>
        <p class="case-aide">Choisis ton action en bas. L'ordinateur choisit en même temps que toi, en secret. Sous 50 d'endurance, tes actions peuvent rater.</p>
      </section>`;
  }
  const ono = onomatopee(t, e);
  return `
    <section class="case ${ono?.fort ? 'secoue' : ''}" aria-live="polite">
      ${ono?.fort ? '<div class="rayons" aria-hidden="true"></div>' : ''}
      <h3>${echap(titreTour(t))}</h3>
      ${htmlDuel(t.choixHumain, t.choixOrdi, e)}
      ${ono ? `<p class="onomato ${ono.cote}">${ono.texte}</p>` : ''}
      <ul class="case-texte">${lignesTour(t, e)}</ul>
    </section>`;
}

function htmlTourAncien(t: TourJoue, e: EtatCombat): string {
  const h = libelleAction(e.joueurs[HUMAIN].def.nation, t.choixHumain.action);
  const o = libelleAction(e.joueurs[ORDI].def.nation, t.choixOrdi.action);
  return `
    <article class="tour">
      <h3>${echap(titreTour(t))} : <span class="rouge">${t.choixHumain.speciale ? '★ ' : ''}${echap(h.local)}</span> contre <span class="bleu">${t.choixOrdi.speciale ? '★ ' : ''}${echap(o.local)}</span></h3>
      <ul>${lignesTour(t, e)}</ul>
    </article>`;
}

function tableau(e: EtatCombat): string {
  const [h, o] = e.joueurs;
  const pastilles = (n: number) =>
    Array.from({ length: REGLES.periodesPourGagner }, (_, i) => `<i class="${i < n ? 'pleine' : ''}"></i>`).join('');
  const historique = scoresPeriodes.length
    ? `<span class="hist">${scoresPeriodes.map(([a, b], i) => `P${i + 1} ${a}-${b}`).join('  ')}</span>`
    : '';
  const coin = (l: EtatLutteur, c: 'rouge' | 'bleu', qui: string) => `
      <button class="coin ${c}" data-voir="${l.def.id}" aria-label="Voir la carte de ${echap(l.def.nom)}">
        <span class="coin-tete"><span class="vignette">${portrait(l.def)}</span><span class="qui">${qui}<br><small>${echap(l.def.nom)}</small></span></span>
        <span class="score">${l.score}</span>
        <span class="periodes" aria-label="Périodes gagnées : ${l.periodesGagnees}">${pastilles(l.periodesGagnees)}</span>
      </button>`;
  return `
    <header class="tableau">
      ${coin(h, 'rouge', 'Toi')}
      <div class="centre">
        <span class="per">Période <b>${e.periode}</b>/3</span>
        <span class="trn">Tour <b>${e.tour}</b>/${REGLES.toursParPeriode}</span>
        ${historique}
      </div>
      ${coin(o, 'bleu', 'Ordi')}
    </header>`;
}

function ecranCombat() {
  if (!partie) return;
  const e = partie.etat;
  if (e.termine) return ecranFin();
  const [h, o] = e.joueurs;
  const anciens = tours.slice(0, -1).reverse().map((t) => htmlTourAncien(t, e)).join('');

  app.innerHTML = `
    <main class="combat">
      ${tableau(e)}
      <section class="jauges">
        ${barre(h, HUMAIN, 'rouge', 'Toi')}
        <div class="badges rouge">${badges(e, HUMAIN)}</div>
        ${barre(o, ORDI, 'bleu', 'Ordi')}
        <div class="badges bleu">${badges(e, ORDI)}</div>
      </section>
      ${caseDernierTour(e)}
      ${anciens ? `<section class="journal"><h2>Tours précédents</h2>${anciens}</section>` : ''}
      <footer class="pave">
        ${h.initiative ? '<p class="spe-info init">Tu as l\'initiative : après ton choix, tu verras deux actions possibles de l\'ordinateur.</p>' : ''}
        ${etatSpeciale(e)}
        ${boutonsActions(e, 'tour')}
        <p class="graine">Combat n° ${partie.hasard.graine} · <button class="lien" data-quitter>Abandonner</button></p>
      </footer>
    </main>`;

  // Les barres partent de l'endurance d'avant le tour et glissent vers la nouvelle valeur.
  requestAnimationFrame(() =>
    app.querySelectorAll<HTMLElement>('.endu-rempli[data-cible]').forEach((b) => {
      b.style.width = `${b.dataset.cible}%`;
    }),
  );
  endurancesAvant = [h.endurance, o.endurance];

  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="tour"]').forEach((b) =>
    b.addEventListener('click', () => choisir(lireChoix(b))),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-voir]').forEach((b) =>
    b.addEventListener('click', () => fenetreCarte(trouverLutteur(b.dataset.voir!))),
  );
  app.querySelector('[data-quitter]')?.addEventListener('click', () => {
    if (confirmerAbandon()) ecranChoix();
  });
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
  const a = b.dataset.action as IdAction | 'lutte';
  return a === 'lutte' ? { action: 'lutte' } : { action: a, speciale: b.dataset.speciale === '1' };
}

// ---------- Déroulé d'un tour ----------

function choisir(choixHumain: Choix) {
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
    if (m) scoresPeriodes.push([Number(m[1]), Number(m[2])]);
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
}

function fenetreCarte(def: DefLutteur) {
  const f = ouvrirFenetre(`<div class="fenetre-carte">${carteHTML(def)}</div><button class="secondaire" data-fermer>Fermer</button>`, true);
  activerReflets(f);
}

function fenetreInitiative(choixHumain: Choix, choixOrdi: Choix, apercu: (IdAction | 'lutte')[]) {
  const e = partie!.etat;
  const nationO = e.joueurs[ORDI].def.nation;
  const mien = libelleAction(e.joueurs[HUMAIN].def.nation, choixHumain.action);
  const options = apercu.map((a) => {
    const lib = libelleAction(nationO, a);
    const f = famille(a);
    return `<li class="bleu"><span class="ico f-${f}">${ICONE[f]}</span><b>${echap(lib.local)}</b> <small>${echap(lib.fr)}${f !== 'lutte' ? ` · ${NOM_FAMILLE[f].toLowerCase()}` : ''}</small></li>`;
  }).join('');
  const f = ouvrirFenetre(`
    <h2>Initiative</h2>
    <p>L'ordinateur a choisi une de ces deux actions :</p>
    <ul class="apercu">${options}</ul>
    <button class="principal" data-garder>Garder ${choixHumain.speciale ? '★ ' : ''}${echap(mien.local)}</button>
    <p class="ou">ou changer pour :</p>
    <div class="pave-fenetre">${boutonsActions(e, 'initiative')}</div>`);
  f.querySelector('[data-garder]')!.addEventListener('click', () => suite(choixHumain, choixOrdi));
  f.querySelectorAll<HTMLButtonElement>('[data-mode="initiative"]').forEach((b) =>
    b.addEventListener('click', () => suite(lireChoix(b), choixOrdi)),
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

function ecranFin() {
  if (!partie) return;
  const e = partie.etat;
  const gagne = e.vainqueur === HUMAIN;
  const [h, o] = e.joueurs;
  const vainqueur = gagne ? h : o;
  const comment = e.finPar === 'tombe'
    ? 'par tombé'
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  const { idHumain, idOrdi } = partie;
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(vainqueur.def)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(vainqueur.def.nom)} gagne ${comment}.</p>
        ${scoresPeriodes.length ? `<p class="hist">${scoresPeriodes.map(([a, b], i) => `Période ${i + 1} : ${a} - ${b}`).join('<br>')}</p>` : ''}
        <p class="hist">Toi : ${echap(h.def.nom)} · Ordi : ${echap(o.def.nom)} · ${e.tourGlobal} tours</p>
        <div class="fin-boutons">
          <button class="principal" data-revanche>Revanche</button>
          <button class="secondaire" data-changer>Changer de lutteur</button>
        </div>
      </section>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  app.querySelector('[data-revanche]')!.addEventListener('click', () => lancer(idHumain, idOrdi, nouvelleGraine()));
  app.querySelector('[data-changer]')!.addEventListener('click', ecranChoix);
  window.scrollTo(0, 0);
}

// ---------- Navigation ----------

function route() {
  fermerFenetre();
  if (location.hash === '#galerie') ecranGalerie();
  else if (!partie) ecranChoix();
}
window.addEventListener('hashchange', route);
route();
