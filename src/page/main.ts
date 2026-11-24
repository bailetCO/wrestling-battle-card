// La page du jeu : affiche le combat et transmet les choix au moteur.

import './style.css';
import {
  ACTIONS, LUTTEURS, REGLES, actionsJouables, chanceReussite, coutSpeciale, nomLocal,
  peutJouerSpeciale, precisionDe, specialeOuverte, trouverLutteur, avecDeck, verifierDeck, TAILLE_DECK,
  type Choix, type DefLutteur, type EtatCombat, type EtatLutteur, type Face, type Famille, type IdAction,
  type Joueur, type Nation,
} from '../moteur';
import { Partie, type TourJoue } from './partie';
import {
  ADRESSE_PUBLIQUE, Duel, RELAIS, codeValide, nouveauCode, salleLocale, salleRelais,
  type Presence, type Role, type Salle, type Vue,
} from './enligne';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE } from './textes';
import { NOM_RARETE, ORDRE_RARETE, activerReflets, carteHTML } from './carte';
import {
  charger, choisirDeck, consoler, deckDe, nouvelleCollection, possede, recompenser, sauver, type Collection,
} from './collection';
import { portraitSVG } from './portrait';

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
let absentDepuis: number | null = null;
const adv = () => (mode === 'ligne' ? 'Ami' : 'Ordi');
const etatEnCours = (): EtatCombat | null => (mode === 'ligne' ? vueLigne?.etat ?? null : partie?.etat ?? null);
let tours: TourJoue[] = [];
let scoresPeriodes: [number, number][] = [];
let enAttente = false; // un tour est en cours de résolution (fenêtre ouverte)
let endurancesAvant: [number, number] | null = null; // pour animer les barres
let idPortrait = 0;
let collection: Collection = charger();
let recompenseDonnee = false; // une seule récompense par combat
let partieBooster = ''; // ce qu'affiche l'écran de fin (booster ou message)

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

function compteur(): string {
  const n = collection.toutDebloque ? LUTTEURS.length : collection.cartes.length;
  return `Ta collection : <b>${n}/${LUTTEURS.length}</b> cartes${collection.toutDebloque ? ' (mode test)' : ''} · ${collection.victoires} victoire${collection.victoires > 1 ? 's' : ''}`;
}

function carteJoueur(def: DefLutteur, bouton = ''): string {
  return carteHTML(avecDeck(def, deckDe(collection, def.id)), bouton);
}

function carteVerrouillee(def: DefLutteur): string {
  return `
    <div class="verrou">
      ${carteHTML(def)}
      <p class="verrou-texte"><b>Carte ${NOM_RARETE[def.rarete].toLowerCase()} à gagner</b>Gagne des combats pour ouvrir des boosters.</p>
    </div>`;
}

function ecranChoix() {
  partie = null;
  const tries = [...LUTTEURS].sort((a, b) => Number(possede(collection, b.id)) - Number(possede(collection, a.id)));
  const cartes = tries.map((l) => {
    const a = possede(collection, l.id);
    const perso = deckDe(collection, l.id) ? ' (perso)' : '';
    const boutons = `
      <button class="principal cl-choisir" data-lutteur="${l.id}">Lutter avec ${echap(l.nom)}</button>
      <button class="secondaire cl-deck" data-deck="${l.id}">Modifier le deck${perso}</button>`;
    return `<div class="emplacement" data-nation="${l.nation}">${a ? carteJoueur(l, boutons) : carteVerrouillee(l)}</div>`;
  }).join('');
  const puces = NATIONS.map((n) => `<button class="puce" data-aller="${n.id}">${n.nom}</button>`).join('');
  const niv = collection.niveau;

  app.innerHTML = `
    <main class="choix">
      <header class="titre">
        <h1>Wrestling Battle Card</h1>
        <p>Choisis ton lutteur. L'ordinateur prend un adversaire au hasard parmi les 15. Chaque victoire ouvre un booster.</p>
        <p class="compteur">${compteur()}</p>
      </header>
      ${sessionLigne() ? `<div class="reprise"><p>Combat entre amis en cours (salle ${echap(sessionLigne()!.code.toUpperCase())}).</p><button class="principal" data-reprendre>Reprendre</button><button class="lien" data-oublier>Quitter ce combat</button></div>` : ''}
      <a class="principal bouton-amis" href="#amis">Combat entre amis</a>
      <div class="niveau" role="group" aria-label="Niveau de l'ordinateur">
        <span>Ordinateur</span>
        <button class="${niv === 'normal' ? 'actif' : ''}" data-niveau="normal" aria-pressed="${niv === 'normal'}">Normal<small>1 carte par victoire</small></button>
        <button class="${niv === 'fort' ? 'actif' : ''}" data-niveau="fort" aria-pressed="${niv === 'fort'}">Fort<small>2 cartes par victoire</small></button>
      </div>
      <nav class="puces" aria-label="Aller à une nation">${puces}</nav>
      <div class="defile" tabindex="0" aria-label="Cartes des lutteurs">${cartes}</div>
      <div class="defile-nav">
        <button class="rond" data-pas="-1" aria-label="Carte précédente">‹</button>
        <a class="lien" href="#galerie">Galerie et collection</a>
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
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      collection.niveau = b.dataset.niveau === 'fort' ? 'fort' : 'normal';
      sauver(collection);
      app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((x) => {
        const actif = x.dataset.niveau === collection.niveau;
        x.classList.toggle('actif', actif);
        x.setAttribute('aria-pressed', String(actif));
      });
    }),
  );
  app.querySelector('[data-reprendre]')?.addEventListener('click', () => {
    const x = sessionLigne();
    if (x) connecter(x.code, x.role);
  });
  app.querySelector('[data-oublier]')?.addEventListener('click', () => {
    oublierSession();
    ecranChoix();
  });
  app.querySelectorAll<HTMLButtonElement>('[data-deck]').forEach((b) =>
    b.addEventListener('click', () => fenetreDeck(trouverLutteur(b.dataset.deck!))),
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

// ---------- Choix du deck ----------

function fenetreDeck(def: DefLutteur) {
  let choix: IdAction[] = [...(deckDe(collection, def.id) ?? def.actions)];
  const f = ouvrirFenetre(`
    <h2>Deck de ${echap(def.nom)}</h2>
    <p>Choisis ${TAILLE_DECK} actions parmi ${def.actionsPossibles.length}, dont au moins une de la famille de son action spéciale (${NOM_FAMILLE[def.familleSpeciale].toLowerCase()}).</p>
    <div class="deck-liste">${def.actionsPossibles.map((a) => {
      const fam = ACTIONS[a].famille;
      return `
        <button class="deck-action" data-a="${a}" aria-pressed="false">
          <span class="ico f-${fam}">${ICONE[fam]}</span>
          <span class="a-nom">${echap(nomLocal(def.nation, a))}${fam === def.familleSpeciale ? ' ★' : ''}</span>
          <span class="a-fr">${echap(ACTIONS[a].nom)} · ${NOM_FAMILLE[fam].toLowerCase()} · ${ACTIONS[a].points ? `${ACTIONS[a].points} pts` : 'sans points'}</span>
          <span class="a-cout">${ACTIONS[a].cout}</span>
        </button>`;
    }).join('')}</div>
    <p class="deck-etat" aria-live="polite"></p>
    <div class="deck-boutons">
      <button class="principal" data-enregistrer>Enregistrer le deck</button>
      <button class="secondaire" data-defaut>Revenir au deck de départ</button>
      <button class="lien" data-fermer>Annuler</button>
    </div>`, true);
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
    fermerFenetre();
    ecranChoix();
  });
  f.querySelector('[data-defaut]')!.addEventListener('click', () => {
    delete collection.decks[def.id];
    sauver(collection);
    fermerFenetre();
    ecranChoix();
  });
  maj();
}

// ---------- Galerie et collection ----------

function ecranGalerie() {
  partie = null;
  const groupes = ORDRE_RARETE.map((r) => {
    const liste = LUTTEURS.filter((l) => l.rarete === r);
    const n = liste.filter((l) => possede(collection, l.id)).length;
    const cartes = liste.map((l) => (possede(collection, l.id) ? carteJoueur(l) : carteVerrouillee(l))).join('');
    return `<section class="groupe"><h2>${NOM_RARETE[r]} <small>${n}/${liste.length}</small></h2><div class="grille-cartes">${cartes}</div></section>`;
  }).join('');
  app.innerHTML = `
    <main class="galerie">
      <header class="titre">
        <h1>Galerie</h1>
        <p class="compteur">${compteur()}</p>
        <p>Chaque victoire ouvre un booster : 1 carte contre l'ordinateur normal, 2 contre le fort. Les cartes communes sortent plus souvent que les légendaires. La collection est gardée sur ce téléphone.</p>
        <p>Raretés fixées d'après plus de 100 000 combats simulés : les 2 lutteurs qui gagnent le plus sont légendaires, les 3 suivants épiques, puis 5 rares et 5 communes.</p>
        <a class="lien" href="#">Retour au choix du lutteur</a>
      </header>
      ${groupes}
      <section class="groupe reglages">
        <h2>Réglages de test</h2>
        <button class="secondaire" data-test>${collection.toutDebloque ? 'Revenir à ma vraie collection' : 'Débloquer toutes les cartes (mode test)'}</button>
        <button class="lien" data-raz>Remettre la collection à zéro</button>
      </section>
    </main>`;
  app.querySelector('[data-test]')!.addEventListener('click', () => {
    collection.toutDebloque = !collection.toutDebloque;
    sauver(collection);
    ecranGalerie();
  });
  const raz = app.querySelector<HTMLButtonElement>('[data-raz]')!;
  raz.addEventListener('click', () => {
    if (!raz.dataset.confirme) {
      raz.dataset.confirme = '1';
      raz.textContent = 'Appuie encore pour tout effacer (cartes, decks, victoires)';
      return;
    }
    collection = nouvelleCollection();
    sauver(collection);
    ecranGalerie();
  });
  activerReflets(app);
  window.scrollTo(0, 0);
}

function lancer(idHumain: string, idOrdi: string, graine: number) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  partie = new Partie(idHumain, idOrdi, graine, collection.niveau, deckDe(collection, idHumain));
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  recompenseDonnee = false;
  partieBooster = '';
  ecranCombat();
}

// ---------- Écran 2 : le combat ----------

function badges(e: EtatCombat, j: Joueur): string {
  const l = e.joueurs[j];
  const b: string[] = [];
  if (l.initiative) b.push('Initiative');
  if (l.bonusFeinte) b.push('+2 sur la prochaine attaque');
  if (l.bonusEnchainement) b.push('Enchaînement : +4 si attaque ou contre réussi');
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
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  if (!t) {
    return `
      <section class="case face-a-face">
        <div class="vs-portrait rouge">${portrait(h.def)}<span>Toi</span></div>
        <span class="vs">VS</span>
        <div class="vs-portrait bleu">${portrait(o.def)}<span>${adv()}</span></div>
        <p class="case-aide">Choisis ton action en bas. ${mode === 'ligne' ? 'Ton ami' : 'L\'ordinateur'} choisit en même temps que toi, en secret. Sous 50 d'endurance, tes actions peuvent rater.</p>
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
        <span class="periodes" aria-label="Périodes gagnées : ${l.periodesGagnees}">${pastilles(l.periodesGagnees)}</span>
      </button>`;
  return `
    <header class="tableau">
      ${coin(h, 'rouge', 'Toi')}
      <div class="centre">
        <span class="per">Période <b>${e.periode}</b>/3</span>
        <span class="trn">Tour <b>${e.tour}</b>/${REGLES.toursParPeriode}</span>
        ${historique}
        <span class="niv">${mode === 'ligne' ? 'Entre amis' : `Ordi ${partie?.niveau === 'fort' ? 'fort' : 'normal'}`}</span>
      </div>
      ${coin(o, 'bleu', adv())}
    </header>`;
}

function ecranCombat() {
  const e = etatEnCours();
  if (!e) return;
  if (e.termine) return mode === 'ligne' ? ecranFinLigne() : ecranFin();
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  const anciens = tours.slice(0, -1).reverse().map((t) => htmlTourAncien(t, e)).join('');

  app.innerHTML = `
    <main class="combat">
      ${tableau(e)}
      <section class="jauges">
        ${barre(h, HUMAIN, 'rouge', 'Toi')}
        <div class="badges rouge">${badges(e, HUMAIN)}</div>
        ${barre(o, ORDI, 'bleu', adv())}
        <div class="badges bleu">${badges(e, ORDI)}</div>
      </section>
      ${caseDernierTour(e)}
      ${anciens ? `<section class="journal"><h2>Tours précédents</h2>${anciens}</section>` : ''}
      <footer class="pave">
        ${h.initiative ? `<p class="spe-info init">Tu as l'initiative : après ton choix, tu verras deux actions possibles ${mode === 'ligne' ? 'de ton ami' : 'de l\'ordinateur'}.</p>` : ''}
        ${mode === 'ligne' ? '<p class="statut" aria-live="polite"></p>' : ''}
        ${etatSpeciale(e)}
        <div class="actions-zone">${boutonsActions(e, 'tour')}</div>
        <p class="graine">${mode === 'ligne' ? `Salle ${codeSalle.toUpperCase()} · combat n° ${vueLigne?.graine ?? ''}` : `Combat n° ${partie!.hasard.graine}`} · <button class="lien" data-quitter>Abandonner</button></p>
      </footer>
    </main>`;

  // Les barres partent de l'endurance d'avant le tour et glissent vers la nouvelle valeur.
  requestAnimationFrame(() =>
    app.querySelectorAll<HTMLElement>('.endu-rempli[data-cible]').forEach((b) => {
      b.style.width = `${b.dataset.cible}%`;
    }),
  );
  endurancesAvant = [e.joueurs[0].endurance, e.joueurs[1].endurance];

  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="tour"]').forEach((b) =>
    b.addEventListener('click', () => choisir(lireChoix(b))),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-voir]').forEach((b) =>
    b.addEventListener('click', () => {
      const j = etatEnCours()?.joueurs.find((x) => x.def.id === b.dataset.voir);
      fenetreCarte(j ? j.def : trouverLutteur(b.dataset.voir!));
    }),
  );
  app.querySelector('[data-quitter]')?.addEventListener('click', () => {
    if (!confirmerAbandon()) return;
    if (mode === 'ligne') duel?.abandonner();
    else ecranChoix();
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
  const a = b.dataset.action as IdAction | 'lutte';
  return a === 'lutte' ? { action: 'lutte' } : { action: a, speciale: b.dataset.speciale === '1' };
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
  const h = e.joueurs[HUMAIN];
  const o = e.joueurs[ORDI];
  const vainqueur = gagne ? h : o;
  const comment = e.finPar === 'tombe'
    ? 'par tombé'
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  const { idHumain, idOrdi } = partie;
  const montrer = (titre: string, gagnees: string[]) => gagnees.length
    ? `<section class="booster">
        <h2>${titre} : ${gagnees.length > 1 ? `${gagnees.length} nouvelles cartes` : 'nouvelle carte'} !</h2>
        <div class="booster-cartes">${gagnees.map((id, i) => `<div class="tirage" style="--delai:${300 + i * 450}ms">${carteHTML(trouverLutteur(id))}</div>`).join('')}</div>
        <p class="compteur">${compteur()}</p>
      </section>`
    : `<section class="booster"><h2>Collection complète</h2><p>Tu as déjà les 15 cartes.</p></section>`;
  if (!recompenseDonnee) {
    recompenseDonnee = true;
    if (gagne) {
      partieBooster = montrer('Booster ouvert', recompenser(collection, partie.niveau, Math.random));
    } else {
      const conso = consoler(collection, Math.random);
      partieBooster = conso
        ? montrer('Booster de consolation', conso)
        : `<section class="booster"><p>Encore une défaite d'affilée et tu reçois un booster de consolation.</p></section>`;
    }
    sauver(collection);
  }
  const booster = partieBooster;
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(vainqueur.def)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(vainqueur.def.nom)} gagne ${comment}.</p>
        ${scoresPeriodes.length ? `<p class="hist">${scoresPeriodes.map(([a, b], i) => `Période ${i + 1} : ${a} - ${b}`).join('<br>')}</p>` : ''}
        <p class="hist">Toi : ${echap(h.def.nom)} · Ordi : ${echap(o.def.nom)} · ${e.tourGlobal} tours</p>
      </section>
      ${booster}
      <div class="fin-boutons">
        <button class="principal" data-revanche>Revanche</button>
        <button class="secondaire" data-changer>Changer de lutteur</button>
      </div>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  activerReflets(app);
  app.querySelector('[data-revanche]')!.addEventListener('click', () => lancer(idHumain, idOrdi, nouvelleGraine()));
  app.querySelector('[data-changer]')!.addEventListener('click', ecranChoix);
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
        <button class="principal" data-creer>Créer et obtenir un code</button>
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
  app.querySelector('[data-creer]')!.addEventListener('click', () => connecter(nouveauCode(), 'hote'));
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranAmis('Le code fait 4 lettres, sans chiffres.');
    connecter(code, 'invite');
  });
  window.scrollTo(0, 0);
}

async function connecter(code: string, role: Role) {
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
  codeSalle = code;
  HUMAIN = role === 'hote' ? 0 : 1;
  ORDI = role === 'hote' ? 1 : 0;
  toursAffiches = -1;
  fenetreLigne = '';
  absentDepuis = null;
  if (location.hash) history.replaceState(null, '', location.pathname);
  duel = new Duel(salle, role, depart, (p) => {
    try {
      localStorage.setItem(clePresence(code, role), JSON.stringify(p));
    } catch {
      // pas de sauvegarde possible : la reprise après rechargement ne marchera pas
    }
  });
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
let minuteurAbsence: number | undefined;

function rafraichirLigne(v: Vue) {
  vueLigne = v;
  if (mode !== 'ligne') return;
  // Absence de l'ami pendant le combat
  if (v.phase === 'combat' && !v.amiPresent) absentDepuis ??= Date.now();
  else absentDepuis = null;
  clearTimeout(minuteurAbsence);
  if (absentDepuis) minuteurAbsence = window.setTimeout(() => vueLigne && rafraichirLigne(vueLigne), 5000);

  if (v.phase === 'attente-ami' || v.phase === 'choix-lutteur') {
    const sig = `${v.phase}|${v.amiPresent}|${v.monLutteur}|${v.amiLutteur}|${v.attente}|${salleActive?.connecte()}`;
    if (sig !== signatureSalle) ecranSalle(v);
    signatureSalle = sig;
    return;
  }
  signatureSalle = '';
  if (v.phase === 'fin') {
    fermerFenetre();
    fenetreLigne = '';
    tours = v.tours;
    return ecranFinLigne();
  }
  // Combat : on ne redessine tout que quand un nouveau tour est joué.
  if (v.tours.length !== toursAffiches || !app.querySelector('.combat')) {
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
    texte = 'À toi de choisir ton action.';
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
      ecranChoix();
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
  const liste = LUTTEURS.map((l) => `
    <button class="choix-l ${v.monLutteur === l.id ? 'pris' : ''}" data-l="${l.id}" aria-pressed="${v.monLutteur === l.id}">
      <span class="vignette">${portrait(l)}</span>
      <span><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[l.rarete]}</small></span>
    </button>`).join('');
  const ami = v.amiLutteur ? trouverLutteur(v.amiLutteur) : null;
  app.innerHTML = `
    <main class="amis">
      <header class="titre">
        <h1>Salle ${echap(codeSalle.toUpperCase())}</h1>
        <p class="code-grand" aria-label="Code de la salle">${echap(codeSalle.toUpperCase())}</p>
        <p>${!salleActive?.connecte() ? 'Connexion au relais…' : v.amiPresent ? '<b class="ok">Ton ami est dans la salle.</b>' : 'Envoie ce code à ton ami. Il ouvre ce même lien, touche « Combat entre amis » et tape le code.'}</p>
        <p>${v.monLutteur ? `Tu as choisi <b>${echap(trouverLutteur(v.monLutteur).nom)}</b>.` : 'Choisis ton lutteur ci-dessous.'}
           ${ami ? ` Ton ami a choisi <b>${echap(ami.nom)}</b>.` : v.amiPresent ? ' Ton ami choisit son lutteur…' : ''}
           ${v.attente ? echap(v.attente) : ''}</p>
      </header>
      <div class="liste-l">${liste}</div>
      <p class="note">Ton deck personnalisé est utilisé s'il existe (sinon le deck de départ).</p>
      <button class="lien" data-sortir>Quitter la salle</button>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((b) =>
    b.addEventListener('click', () => duel?.choisirLutteur(b.dataset.l!, deckDe(collection, b.dataset.l!))),
  );
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranChoix();
  });
}

function fenetreInitiativeLigne(v: Vue) {
  const e = v.etat!;
  const choix = v.monChoix;
  const nationA = e.joueurs[ORDI].def.nation;
  const options = v.initiative!.map((a) => {
    const lib = libelleAction(nationA, a);
    const f = famille(a);
    return `<li class="bleu"><span class="ico f-${f}">${ICONE[f]}</span><b>${echap(lib.local)}</b> <small>${echap(lib.fr)}${f !== 'lutte' ? ` · ${NOM_FAMILLE[f].toLowerCase()}` : ''}</small></li>`;
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
    b.addEventListener('click', () => duel?.decider(lireChoix(b))),
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
        <p class="hist">Toi : ${echap(h.def.nom)} · Ami : ${echap(o.def.nom)} · ${e.tourGlobal} tours · salle ${echap(codeSalle.toUpperCase())}</p>
      </section>
      <div class="fin-boutons">
        ${revanche ? `<p class="statut">${revanche}</p>` : ''}
        <button class="principal" data-revanche ${v.revancheMoi ? 'disabled' : ''}>Revanche</button>
        <button class="secondaire" data-sortir>Quitter la salle</button>
      </div>
      <section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>
    </main>`;
  app.querySelector('[data-revanche]')!.addEventListener('click', () => duel?.revanche());
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranChoix();
  });
}

// ---------- Navigation ----------

function route() {
  fermerFenetre();
  if (location.hash === '#galerie') ecranGalerie();
  else if (location.hash === '#amis') ecranAmis();
  else if (!partie && mode === 'solo') ecranChoix();
}
window.addEventListener('hashchange', route);
route();
