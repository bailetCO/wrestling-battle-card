// La page du jeu : affiche le combat et transmet les choix au moteur.

import './style.css';
import {
  ACTIONS, LUTTEURS, REGLES, actionsJouables, chanceReussite, coutSpeciale, nomLocal,
  peutJouerSpeciale, precisionDe, specialeOuverte,
  type Choix, type EtatCombat, type EtatLutteur, type Face, type Famille, type IdAction, type Joueur,
} from '../moteur';
import { HUMAIN, ORDI, Partie, type TourJoue } from './partie';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, PRESENTATION } from './textes';

const app = document.getElementById('app')!;

// ---------- État de la page ----------

let partie: Partie | null = null;
let tours: TourJoue[] = [];
let scoresPeriodes: [number, number][] = [];
let enAttente = false; // un tour est en cours de résolution (fenêtre ouverte)

// ---------- Outils ----------

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const pct = (x: number) => `${Math.round(x * 100)} %`;
const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function famille(a: IdAction | 'lutte'): Famille | 'lutte' {
  return a === 'lutte' ? 'lutte' : ACTIONS[a].famille;
}

function libelleAction(idLutteur: string, a: IdAction | 'lutte'): { local: string; fr: string } {
  if (a === 'lutte') return { local: 'Lutte', fr: 'Lutte' };
  return { local: nomLocal(idLutteur, a), fr: ACTIONS[a].nom };
}

function nouvelleGraine(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

// ---------- Écran 1 : choix du lutteur ----------

function ecranChoix() {
  partie = null;
  const cartes = LUTTEURS.map((l) => {
    const p = PRESENTATION[l.id];
    const actions = l.actions
      .map((a) => `<li><span class="ico f-${ACTIONS[a].famille}">${ICONE[ACTIONS[a].famille]}</span>${echap(nomLocal(l.id, a))}</li>`)
      .join('');
    return `
      <button class="carte" data-lutteur="${l.id}">
        <span class="carte-tete">
          <span class="carte-nom">${echap(l.nom)}</span>
          <span class="carte-style">${echap(p.style)}</span>
        </span>
        <span class="carte-stats">
          <span><b>${l.enduranceMax}</b> endurance</span>
          <span><b>${l.force}</b> force</span>
          <span><b>${pct(l.recuperation)}</b> récupération</span>
        </span>
        <span class="carte-fort">Points forts : ${echap(p.pointsForts)}. Spéciale : ${NOM_FAMILLE[l.familleSpeciale].toLowerCase()}.</span>
        <ul class="carte-actions">${actions}</ul>
      </button>`;
  }).join('');

  app.innerHTML = `
    <main class="choix">
      <header class="titre">
        <h1>Wrestling Battle Card</h1>
        <p>Choisis ton lutteur. L'ordinateur prend un des quatre autres.</p>
      </header>
      <div class="cartes">${cartes}</div>
    </main>`;

  app.querySelectorAll<HTMLButtonElement>('[data-lutteur]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.lutteur!;
      const autres = LUTTEURS.filter((l) => l.id !== id);
      const ordi = autres[Math.floor(Math.random() * autres.length)].id;
      lancer(id, ordi, nouvelleGraine());
    }),
  );
  window.scrollTo(0, 0);
}

function lancer(idHumain: string, idOrdi: string, graine: number) {
  partie = new Partie(idHumain, idOrdi, graine);
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
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

function barre(l: EtatLutteur, coin: 'rouge' | 'bleu', etiquette: string): string {
  const max = l.def.enduranceMax;
  const larg = (l.endurance / max) * 100;
  const repere = (50 / max) * 100;
  const chance = chanceReussite(precisionDe(l.endurance));
  const bas = l.endurance < 50;
  return `
    <div class="endu ${coin}">
      <div class="endu-ligne">
        <span>${etiquette}</span>
        <span><b>${fmt(l.endurance)}</b> / ${max} · réussite ${pct(chance)}</span>
      </div>
      <div class="endu-barre" role="meter" aria-label="Endurance ${etiquette}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${fmt(l.endurance)}">
        <div class="endu-rempli ${bas ? 'bas' : ''}" style="width:${larg}%"></div>
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
        <span class="a-nom">★ ${echap(nomLocal(l.def.id, a))} spéciale</span>
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
        <span class="a-nom">${echap(nomLocal(l.def.id, a))}</span>
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

function htmlDuel(choixH: Choix, choixO: Choix, e: EtatCombat): string {
  const cote = (c: Choix, j: Joueur, coin: string) => {
    const lib = libelleAction(e.joueurs[j].def.id, c.action);
    const f = famille(c.action);
    return `<span class="${coin}"><span class="ico f-${f}">${ICONE[f]}</span>${c.speciale ? '★ ' : ''}${echap(lib.local)}<small>${echap(lib.fr)}</small></span>`;
  };
  return `<div class="duel">${cote(choixH, HUMAIN, 'rouge')}<span class="contre-mot">contre</span>${cote(choixO, ORDI, 'bleu')}</div>`;
}

function htmlTour(t: TourJoue, e: EtatCombat, recent: boolean): string {
  const [entete, ...reste] = t.lignes;
  const lignes = reste.map((l) => `<li class="${classeLigne(l, e)}">${echap(l)}</li>`).join('');
  const titre = entete?.replace(/ :.*$/, '') ?? '';
  return `
    <article class="tour ${recent ? 'recent' : ''}">
      <h3>${echap(titre)}</h3>
      ${htmlDuel(t.choixHumain, t.choixOrdi, e)}
      <ul>
        ${t.ordiAChange ? '<li>L\'ordinateur avait l\'initiative : il a vu deux de tes actions possibles et a changé la sienne.</li>' : ''}
        ${lignes}
      </ul>
    </article>`;
}

function tableau(e: EtatCombat): string {
  const [h, o] = e.joueurs;
  const pastilles = (n: number) =>
    Array.from({ length: REGLES.periodesPourGagner }, (_, i) => `<i class="${i < n ? 'pleine' : ''}"></i>`).join('');
  const historique = scoresPeriodes.length
    ? `<span class="hist">${scoresPeriodes.map(([a, b], i) => `P${i + 1} ${a}-${b}`).join('  ')}</span>`
    : '';
  return `
    <header class="tableau">
      <div class="coin rouge">
        <span class="qui">Toi · ${echap(h.def.nom)}</span>
        <span class="score">${h.score}</span>
        <span class="periodes" aria-label="Périodes gagnées : ${h.periodesGagnees}">${pastilles(h.periodesGagnees)}</span>
      </div>
      <div class="centre">
        <span class="per">Période <b>${e.periode}</b>/3</span>
        <span class="trn">Tour <b>${e.tour}</b>/${REGLES.toursParPeriode}</span>
        ${historique}
      </div>
      <div class="coin bleu">
        <span class="qui">Ordi · ${echap(o.def.nom)}</span>
        <span class="score">${o.score}</span>
        <span class="periodes" aria-label="Périodes gagnées : ${o.periodesGagnees}">${pastilles(o.periodesGagnees)}</span>
      </div>
    </header>`;
}

function ecranCombat() {
  if (!partie) return;
  const e = partie.etat;
  if (e.termine) return ecranFin();
  const [h, o] = e.joueurs;
  const journal = tours
    .slice()
    .reverse()
    .map((t, i) => htmlTour(t, e, i === 0))
    .join('');

  app.innerHTML = `
    <main class="combat">
      ${tableau(e)}
      <section class="jauges">
        ${barre(h, 'rouge', 'Toi')}
        <div class="badges rouge">${badges(e, HUMAIN)}</div>
        ${barre(o, 'bleu', 'Ordi')}
        <div class="badges bleu">${badges(e, ORDI)}</div>
      </section>
      <section class="journal" aria-live="polite">
        ${journal || `<p class="vide">Choisis ton action en bas de l'écran. L'ordinateur choisit en même temps que toi, en secret. Coûts en endurance à droite de chaque bouton ; sous 50 d'endurance, tes actions peuvent rater.</p>`}
      </section>
      <footer class="pave">
        ${h.initiative ? '<p class="spe-info init">Tu as l\'initiative : après ton choix, tu verras deux actions possibles de l\'ordinateur.</p>' : ''}
        ${etatSpeciale(e)}
        ${boutonsActions(e, 'tour')}
        <p class="graine">Combat n° ${partie.hasard.graine} · <button class="lien" data-quitter>Abandonner</button></p>
      </footer>
    </main>`;

  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="tour"]').forEach((b) =>
    b.addEventListener('click', () => choisir(lireChoix(b))),
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

function ouvrirFenetre(html: string): HTMLElement {
  fermerFenetre();
  const f = document.createElement('div');
  f.className = 'voile';
  f.innerHTML = `<div class="fenetre" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(f);
  f.querySelector<HTMLElement>('button')?.focus();
  return f;
}

function fermerFenetre() {
  document.querySelector('.voile')?.remove();
}

function fenetreInitiative(choixHumain: Choix, choixOrdi: Choix, apercu: (IdAction | 'lutte')[]) {
  const e = partie!.etat;
  const idO = e.joueurs[ORDI].def.id;
  const mien = libelleAction(e.joueurs[HUMAIN].def.id, choixHumain.action);
  const options = apercu.map((a) => {
    const lib = libelleAction(idO, a);
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
  const comment = e.finPar === 'tombe'
    ? 'par tombé'
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const journal = tours.slice().reverse().map((t, i) => htmlTour(t, e, i === 0)).join('');
  const { idHumain, idOrdi } = partie;
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <h1>${gagne ? 'Victoire' : 'Défaite'}</h1>
        <p>${echap(gagne ? h.def.nom : o.def.nom)} gagne ${comment}.</p>
        ${scoresPeriodes.length ? `<p class="hist">${scoresPeriodes.map(([a, b], i) => `Période ${i + 1} : ${a} - ${b}`).join('<br>')}</p>` : ''}
        <p class="hist">Toi : ${echap(h.def.nom)} · Ordi : ${echap(o.def.nom)} · ${e.tourGlobal} tours</p>
        <div class="fin-boutons">
          <button class="principal" data-revanche>Revanche</button>
          <button class="secondaire" data-changer>Changer de lutteur</button>
        </div>
      </section>
      <section class="journal">${journal}</section>
    </main>`;
  app.querySelector('[data-revanche]')!.addEventListener('click', () => lancer(idHumain, idOrdi, nouvelleGraine()));
  app.querySelector('[data-changer]')!.addEventListener('click', ecranChoix);
  window.scrollTo(0, 0);
}

ecranChoix();
