// La page du jeu : affiche le combat et transmet les choix au moteur.

import './style.css';
import {
  ACTIONS, LUTTEURS, REGLES, actionsJouables, chanceReussite, coutSpeciale, nomLocal,
  peutJouerSpeciale, precisionDe, specialeOuverte, trouverLutteur, NIVEAUX, niveauCarte, etoilesPossibles, avecDeck, verifierDeck, coutAction, actionsDebloquees, TAILLE_DECK, REGLES as R_,
  type Choix, type DefLutteur, type EtatCombat, type EtatLutteur, type Face, type Famille, type IdAction,
  type Joueur, type Nation, type NiveauCarte,
} from '../moteur';
import { Partie, type TourJoue } from './partie';
import {
  ADRESSE_PUBLIQUE, Duel, RELAIS, codeValide, nouveauCode, salleLocale, salleRelais,
  type ModeSalle, type Presence, type Role, type Salle, type Vue,
} from './enligne';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, effetAction } from './textes';
import { NOM_RARETE, ORDRE_RARETE, STYLES_CARTE, activerReflets, carteHTML } from './carte';
import {
  cartesPossedees, charger, choisirDeck, consoler, deckDe, defPossede, etoilesDe, fusionPrete, fusionner, gradeDe, nbDoubles, nbEtoiles, nbExemplaires,
  nouvelleCollection, possede, prochaineFusion, recompenser, sauver, verifierPseudo, type Booster, type Collection,
  nbFusions, nbStyles, styleDe, doublesPourMaximum, type TriCollection,
} from './collection';
import { portraitSVG } from './portrait';
import { Echange, accepterOffre, jourDe, listeAmis, noterAmi, offreFaite, offresDuJour, type VueEchange } from './club';
import { ouvrirBooster } from './collection';
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
let absentDepuis: number | null = null;
const adv = () => (mode === 'ligne' ? vueLigne?.amiCoach || 'Ami' : 'Ordi');
const moiNom = () => collection.coach || 'Toi';
const etatEnCours = (): EtatCombat | null => (mode === 'ligne' ? vueLigne?.etat ?? null : partie?.etat ?? null);
let tours: TourJoue[] = [];
let scoresPeriodes: [number, number][] = [];
let enAttente = false; // un tour est en cours de résolution (fenêtre ouverte)
let endurancesAvant: [number, number] | null = null; // pour animer les barres
let idPortrait = 0;
let collection: Collection = charger();
let recompenseDonnee = false; // une seule récompense par combat
let tuto = false; // combat guidé du tutoriel en cours
let bonusCeCombat = false; // combat d'arène qui suit le tutoriel : boosters doublés
// Boosters gagnés pendant le combat solo (ou message de consolation), affichés à la fin.
let paquetSolo: Paquet | null = null;
let messageSolo = '';

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

const portrait = (def: DefLutteur, niveau?: NiveauCarte) => portraitSVG(def, `m${idPortrait++}`, { niveau });

// ---------- Accueil, menu principal ----------

const NATIONS: { id: Nation; nom: string }[] = [
  { id: 'usa', nom: 'USA' }, { id: 'russie', nom: 'Russie' }, { id: 'europe', nom: 'Europe' },
  { id: 'afrique', nom: 'Afrique' }, { id: 'japon', nom: 'Japon' },
];

function compteur(): string {
  const n = collection.toutDebloque ? LUTTEURS.length : cartesPossedees(collection);
  return `<b>${n}/${LUTTEURS.length}</b> cartes${collection.toutDebloque ? ' (mode test)' : ''} · ${nbDoubles(collection)} double${nbDoubles(collection) > 1 ? 's' : ''} · ${collection.victoires} victoire${collection.victoires > 1 ? 's' : ''}`;
}

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
  club: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="7" fill="currentColor"/><circle cx="33" cy="19" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M4 40c1-9 7-13 13-13s12 4 13 13M28 39c1-7 4-10 9-10s8 3 9 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
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

function ecranMenu() {
  partie = null;
  const session = sessionLigne();
  const fusions = LUTTEURS.filter((l) => fusionPrete(collection, l.id)).length;
  const tuile = (id: string, titre: string, sous: string, href: string, alerte = '') => `
    <a class="tuile t-${id}" href="${href}">
      <span class="tuile-ico">${ICONES_MENU[id]}</span>
      <span class="tuile-titre">${titre}</span>
      <span class="tuile-sous">${sous}</span>
      ${alerte ? `<span class="tuile-alerte">${alerte}</span>` : ''}
    </a>`;
  app.innerHTML = `
    <main class="menu">
      <header class="menu-tete">
        <span class="avatar" aria-hidden="true">${echap((collection.coach ?? '?').slice(0, 1).toUpperCase())}</span>
        <span class="menu-coach"><small>Coach</small><b>${echap(collection.coach ?? '')}</b></span>
        <a class="lien petit" href="#pseudo">Modifier</a>
      </header>
      <p class="compteur menu-stats">${compteur()}</p>
      ${session ? `<div class="reprise"><p>Combat entre amis en cours (salle ${echap(session.code.toUpperCase())}).</p><button class="principal" data-reprendre>Reprendre</button><button class="lien" data-oublier>Quitter ce combat</button></div>` : ''}
      <nav class="tuiles" aria-label="Menu principal">
        ${tuile('combat', 'Combat', 'Arène contre l\'ordinateur ou en ligne contre un ami', '#combat')}
        ${tuile('collection', 'Collection', `${collection.toutDebloque ? LUTTEURS.length : cartesPossedees(collection)}/${LUTTEURS.length} cartes · régler les actions`, '#collection')}
        ${tuile('fusion', 'Fusion', 'Fusionne tes doubles pour monter en rareté', '#fusion', fusions ? `${fusions} prête${fusions > 1 ? 's' : ''}` : '')}
        ${tuile('club', 'Club', 'Amis, échanges et marchand', '#club')}
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
  window.scrollTo(0, 0);
}

function enTete(titre: string, sous = '', retour = '#') {
  return `
    <header class="titre entete">
      <a class="retour" href="${retour}" aria-label="Retour">‹</a>
      <div><h1>${titre}</h1>${sous ? `<p>${sous}</p>` : ''}</div>
    </header>`;
}

function ecranCombatMenu() {
  partie = null;
  const niv = collection.niveau;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Combat')}
      <nav class="aide-barre" aria-label="Aide">
        <a class="aide-btn" href="#regles"><span aria-hidden="true">?</span>Règles</a>
        <a class="aide-btn" href="#tutoriel">Tutoriel<span aria-hidden="true">▶</span></a>
      </nav>
      <section class="bloc">
        <h2>Arène</h2>
        ${collection.bonusTutoriel ? '<p class="bandeau-bonus">Tutoriel terminé : ton prochain combat d\'arène rapporte 2 fois plus de boosters en cas de victoire.</p>' : ''}
        <p>Affronte l'ordinateur avec un lutteur de ta collection. Chaque victoire ouvre un booster ; toutes les 2 défaites d'affilée, un booster de consolation.</p>
        <div class="niveau" role="group" aria-label="Niveau de l'ordinateur">
          <button class="${niv === 'normal' ? 'actif' : ''}" data-niveau="normal" aria-pressed="${niv === 'normal'}">Normal<small>Pour s'entraîner</small></button>
          <button class="${niv === 'fort' ? 'actif' : ''}" data-niveau="fort" aria-pressed="${niv === 'fort'}">Fort<small>Il lit ton jeu</small></button>
        </div>
        <a class="principal lien-bouton" href="#arene">Choisir mon lutteur</a>
      </section>
      <section class="bloc">
        <h2>En ligne</h2>
        <p>Affronte un ami sur son téléphone. Avec ta collection, chaque victoire ouvre 2 boosters.</p>
        <a class="principal lien-bouton" href="#amis">Combat entre amis</a>
      </section>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      collection.niveau = b.dataset.niveau === 'fort' ? 'fort' : 'normal';
      sauver(collection);
      ecranCombatMenu();
    }),
  );
  window.scrollTo(0, 0);
}

// Arène : choix du lutteur parmi ses cartes.
function ecranArene() {
  partie = null;
  const miens = LUTTEURS.filter((l) => possede(collection, l.id));
  const cartes = miens.map((l) => {
    const boutons = `
      <button class="principal cl-choisir" data-lutteur="${l.id}">Lutter avec ${echap(l.nom)}</button>
      <button class="secondaire cl-deck" data-deck="${l.id}">Régler les actions${deckDe(collection, l.id) ? ' (perso)' : ''}</button>`;
    return `<div class="emplacement" data-nation="${l.nation}">${carteJoueur(l, boutons)}</div>`;
  }).join('');
  const nations = NATIONS.filter((n) => miens.some((l) => l.nation === n.id));
  const puces = nations.map((n) => `<button class="puce" data-aller="${n.id}">${n.nom}</button>`).join('');
  app.innerHTML = `
    <main class="choix">
      ${enTete('Arène', `Ordinateur ${collection.niveau === 'fort' ? 'fort' : 'normal'} · l'adversaire est tiré au hasard parmi les 15 lutteurs.`, '#combat')}
      ${collection.bonusTutoriel ? '<p class="bandeau-bonus marge">Bonus du tutoriel : boosters doublés si tu gagnes ce combat.</p>' : ''}
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

function fenetreDeck(base: DefLutteur) {
  const def = defPossede(collection, base.id);
  const grade = gradeDe(collection, base.id);
  const et = etoilesDe(collection, base.id);
  let choix: IdAction[] = [...(deckDe(collection, def.id) ?? def.actions)];
  const verrouillees = def.deblocages.filter((a) => !def.actionsPossibles.includes(a));
  const ligne = (a: IdAction, ouverte: boolean, gradeDeblocage = 0) => {
    const fam = ACTIONS[a].famille;
    const cout = ouverte ? coutAction(def, a) : Math.max(R_.fusion.coutMinimum, ACTIONS[a].cout - R_.fusion.reductionDeblocage);
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
    <p>Choisis ${TAILLE_DECK} actions parmi les ${def.actionsPossibles.length} débloquées, dont au moins une de la famille de son action spéciale (${NOM_FAMILLE[def.familleSpeciale].toLowerCase()}). Chaque niveau de rareté donne une action de plus (Champion du Monde : toutes), qui coûte 1 d'endurance de moins.</p>
    <div class="deck-liste">
      ${def.actionsPossibles.map((a) => ligne(a, true)).join('')}
      ${verrouillees.map((a) => ligne(a, false, def.deblocages.indexOf(a) + 2)).join('')}
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

// Les groupes de cartes de la collection, selon le tri choisi.
function groupesCollection(): { titre: string; liste: DefLutteur[] }[] {
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
  const groupes = groupesCollection().map(({ titre, liste }) => {
    const n = liste.filter((l) => possede(collection, l.id)).length;
    const cartes = liste.map((l) => miniCarteCollection(l)).join('');
    return `<section class="groupe"><h2>${titre} <small>${n}/${liste.length}</small></h2><div class="grille-mini">${cartes}</div></section>`;
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
        <button class="secondaire" data-booster-test>Ouvrir un booster (test)</button>
        <button class="secondaire" data-doubles-test>Doubles pour tout monter au maximum (test)</button>
        <button class="secondaire" data-test>${collection.toutDebloque ? 'Revenir à ma vraie collection' : 'Débloquer toutes les cartes (mode test)'}</button>
        <button class="lien" data-raz>Remettre la collection à zéro</button>
      </section>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-carte]').forEach((b) =>
    b.addEventListener('click', () => fenetreCarteCollection(trouverLutteur(b.dataset.carte!))),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-tri]').forEach((b) =>
    b.addEventListener('click', () => {
      collection.tri = b.dataset.tri as TriCollection;
      sauver(collection);
      ecranCollection();
    }),
  );
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

function ecranFusion(message = '') {
  partie = null;
  const miens = LUTTEURS.filter((l) => nbExemplaires(collection, l.id) > 0)
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
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-fusion]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.fusion!;
      if (prochaineFusion(collection, id)?.type === 'etoile') return fenetreEtoile(id);
      const def = trouverLutteur(id);
      const avant = defJoueur(def);
      const erreur = fusionner(collection, id);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
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

// ---------- Club ----------

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

function ecranClub(message = '') {
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
        ? `<button class="principal petit-bouton" data-offre="${i}">Échanger</button>`
        : '<button class="secondaire petit-bouton" disabled>Pas de double</button>';
    return `
      <li class="offre ${fait ? 'faite' : ''}">
        <div class="offre-cartes">
          <div><small>Il te donne</small>${miniCarteLutteur(donne, `${echap(donne.origine)} · ${NOM_RARETE[donne.rarete]}${possede(collection, donne.id) ? '' : ' · nouvelle'}`)}</div>
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
          <span class="ami-info"><b>${echap(a.pseudo)}</b><small>${a.victoires} victoire${a.victoires > 1 ? 's' : ''} · ${a.defaites} défaite${a.defaites > 1 ? 's' : ''} · ${a.echanges} échange${a.echanges > 1 ? 's' : ''}</small></span>
          <small class="ami-date">${new Date(a.vu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>
        </li>`).join('')}</ul>`
    : '<p class="note">Affronte un ami en ligne ou fais un échange avec lui : il apparaîtra ici.</p>';
  const enLigne = acces() !== 'ailleurs';
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Club', 'Le marchand du jour, les échanges avec tes amis et ta liste d\'amis.')}
      ${message}
      <section class="bloc">
        <h2>Marchand</h2>
        <p>3 offres par jour, chacune une fois : il te donne une carte contre un de tes doubles de même rareté. Nouvelles offres demain.</p>
        <ul class="offres">${offres}</ul>
      </section>
      <section class="bloc">
        <h2>Échanger avec un ami</h2>
        ${enLigne ? `
          <p>Ouvrez une salle d'échange : chacun propose un de ses doubles, l'échange se fait quand vous acceptez tous les deux.</p>
          <button class="principal" data-ouvrir-echange>Ouvrir une salle d'échange</button>
          <form class="rejoindre" data-rejoindre-echange>
            <label for="code-echange">Ou rejoins ton ami avec son code</label>
            <input id="code-echange" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD">
            <button class="secondaire" type="submit">Rejoindre</button>
          </form>`
        : `<p>Les échanges se font sur la version du jeu ouverte à tous.</p><a class="principal lien-bouton" href="${ADRESSE_PUBLIQUE}" target="_blank" rel="noopener">Ouvrir la version ouverte à tous</a>`}
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
      if (erreur) return ecranClub(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(collection);
      ecranClub();
      const f = ouvrirFenetre(`
        <h2 class="onomato rouge">MARCHÉ CONCLU !</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(trouverLutteur(o.donne))}</div>
        <p>Tu as reçu <b>${echap(trouverLutteur(o.donne).nom)}</b> contre un double de ${echap(trouverLutteur(o.demande).nom)}.</p>
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  app.querySelector('[data-ouvrir-echange]')?.addEventListener('click', () => ouvrirEchange(nouveauCode()));
  app.querySelector('[data-rejoindre-echange]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code-echange')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranClub('<p class="alerte">Le code fait 4 lettres, sans chiffres.</p>');
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
      ${enTete(`Échange ${echap(codeEchange.toUpperCase())}`, '', '#club')}
      <p class="code-grand marge" aria-label="Code de la salle d'échange">${echap(codeEchange.toUpperCase())}</p>
      <p class="marge">${!connecte ? 'Connexion au relais…' : v.amiPresent ? `<b class="ok">${echap(ami)} est dans la salle.</b>` : 'Envoie ce code à ton ami : dans le Club, il touche « Rejoindre » et tape le code.'}</p>
      ${dernier}
      <section class="bloc">
        <h2>${echap(ami)} propose</h2>
        ${son ? `<div class="offre-ami">${miniCarteLutteur(son, `${echap(son.origine)} · ${NOM_RARETE[son.rarete]}${possede(collection, son.id) ? '' : ' · nouvelle pour toi'}`)}${v.ilAccepte ? '<span class="pastille nouvelle">A accepté</span>' : ''}</div>` : `<p class="note">${v.amiPresent ? 'Il choisit une carte…' : 'En attente de ton ami.'}</p>`}
      </section>
      <section class="bloc">
        <h2>Tu proposes</h2>
        <div class="grille-mini">${choix}</div>
      </section>
      <div class="barre-bas">${bouton || `<p class="note">${v.monOffre ? 'En attente de la proposition de ton ami.' : 'Choisis le double que tu proposes.'}</p>`}<button class="lien" data-quitter-echange>Quitter la salle d'échange</button></div>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-proposer]').forEach((b) =>
    b.addEventListener('click', () => echange?.proposer(v.monOffre === b.dataset.proposer ? null : b.dataset.proposer!)),
  );
  app.querySelector('[data-accepter]')?.addEventListener('click', () => echange?.accepter());
  app.querySelector('[data-annuler]')?.addEventListener('click', () => echange?.annulerAccord());
  const sortir = (ev?: Event) => {
    ev?.preventDefault();
    quitterEchange();
    ecranClub();
  };
  app.querySelector('[data-quitter-echange]')!.addEventListener('click', () => sortir());
  app.querySelector('.retour')?.addEventListener('click', sortir);
}

function lancer(idHumain: string, idOrdi: string, graine: number) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  mode = 'solo';
  HUMAIN = 0;
  ORDI = 1;
  partie = new Partie(idHumain, idOrdi, graine, collection.niveau, avecDeck(defPossede(collection, idHumain), deckDe(collection, idHumain)));
  tours = [];
  scoresPeriodes = [];
  enAttente = false;
  endurancesAvant = null;
  recompenseDonnee = false;
  paquetSolo = null;
  messageSolo = '';
  tuto = false;
  bonusCeCombat = collection.bonusTutoriel;
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
    const bon = b.dataset.action === g.conseil.action && (b.dataset.speciale === '1') === g.conseil.speciale;
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
  app.innerHTML = `
    <main class="sous-menu tuto">
      ${enTete('Tutoriel terminé', '', '#combat')}
      <section class="bloc tuto-ecran">
        <h2>${gagne ? 'Période gagnée !' : 'Période perdue, mais tu as compris le principe !'}</h2>
        <p class="tuto-score">${score[0]} - ${score[1]}</p>
        <p>Un vrai combat se joue en 3 périodes : gagne-en 2, ou fais un tombé. Sans le coach, tu ne verras pas le choix de l'adversaire : à toi de deviner son jeu.</p>
        <p><b>Bonus :</b> ton prochain combat d'arène rapporte 2 fois plus de boosters si tu gagnes.</p>
      </section>
      <div class="fin-boutons marge">
        <a class="principal lien-bouton" href="#arene">Combattre l'ordinateur</a>
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
        <span class="a-fr">${nomLocal(l.def.nation, a) !== ACTIONS[a].nom ? `${echap(ACTIONS[a].nom)} · ` : ''}<b class="a-effet">${effetAction(a, { feinte: l.bonusFeinte, enchainement: l.bonusEnchainement })}</b></span>
        <span class="a-cout">−${fmt(coutAction(l.def, a))}</span>
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
      ${coin(h, 'rouge', echap(moiNom()))}
      <div class="centre">
        <span class="per">Période <b>${e.periode}</b>/3</span>
        <span class="trn">Tour <b>${e.tour}</b>/${REGLES.toursParPeriode}</span>
        ${historique}
        <span class="niv">${mode === 'ligne' ? 'Entre amis' : `Ordi ${partie?.niveau === 'fort' ? 'fort' : 'normal'}`}</span>
      </div>
      ${coin(o, 'bleu', echap(adv()))}
    </header>`;
}

function ecranCombat() {
  const e = etatEnCours();
  if (!e) return;
  if (tuto && (e.termine || e.periode > 1)) return ecranFinTutoriel();
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
        ${bulleCoach()}
        ${etatSpeciale(e)}
        <div class="actions-zone">${boutonsActions(e, 'tour')}</div>
        <p class="graine">${mode === 'ligne' ? `Salle ${codeSalle.toUpperCase()} · combat n° ${vueLigne?.graine ?? ''}` : tuto ? 'Combat guidé' : `Combat n° ${partie!.hasard.graine}`} · <button class="lien" data-quitter>${tuto ? 'Quitter le tutoriel' : 'Abandonner'}</button></p>
      </footer>
    </main>`;

  // Les barres partent de l'endurance d'avant le tour et glissent vers la nouvelle valeur.
  requestAnimationFrame(() =>
    app.querySelectorAll<HTMLElement>('.endu-rempli[data-cible]').forEach((b) => {
      b.style.width = `${b.dataset.cible}%`;
    }),
  );
  endurancesAvant = [e.joueurs[0].endurance, e.joueurs[1].endurance];
  guiderBoutons(app);

  app.querySelectorAll<HTMLButtonElement>('[data-action][data-mode="tour"]').forEach((b) =>
    b.addEventListener('click', () => choisir(lireChoix(b))),
  );
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
    else ecranArene();
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
  document.querySelector('.revelation')?.remove(); // ouverture de booster interrompue (changement d'écran)
}

function fenetreCarte(def: DefLutteur, style = 0) {
  const f = ouvrirFenetre(`<div class="fenetre-carte">${carteHTML(def, '', { style })}</div><button class="secondaire" data-fermer>Fermer</button>`, true);
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
  guiderBoutons(f);
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

// ---------- Ouverture des boosters ----------

interface Paquet {
  titre: string; // « Victoire », « Booster de consolation »…
  boosters: Booster[];
  ouvert: boolean;
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

const nomBooster = (b: Booster) => (b.type === 'rare' ? 'Booster rare · 5 cartes' : 'Booster classique · 3 cartes');

function visuelPaquet(b: Booster, extra = ''): string {
  return `
    <span class="paquet p-${b.type}">
      <span class="paquet-logo">Wrestling<br>Battle Card</span>
      <span class="paquet-type">${b.type === 'rare' ? 'Rare' : 'Classique'}</span>
      <span class="paquet-nb">${b.cartes.length} cartes</span>
      ${extra}
    </span>`;
}

function recapPaquet(p: Paquet): string {
  const cartes = cartesDuPaquet(p);
  const nouvelles = cartes.filter((c) => c.nouvelle).length;
  return `
    <p class="recap-resume"><b>${nouvelles}</b> nouvelle${nouvelles > 1 ? 's' : ''} carte${nouvelles > 1 ? 's' : ''} · <b>${cartes.length - nouvelles}</b> double${cartes.length - nouvelles > 1 ? 's' : ''}</p>
    <div class="grille-mini recap">${cartes.map((c) => `
      <div class="recap-carte">
        ${miniCarteLutteur(trouverLutteur(c.id), NOM_RARETE[trouverLutteur(c.id).rarete])}
        <span class="pastille ${c.nouvelle ? 'nouvelle' : 'nombre'}">${c.nouvelle ? 'Nouvelle !' : 'Double'}</span>
      </div>`).join('')}</div>
    <p class="note">${compteur()} · tes doubles servent à la fusion et aux échanges.</p>`;
}

// Section de l'écran de fin : le booster fermé à ouvrir, ou le récapitulatif une fois ouvert.
function sectionPaquet(p: Paquet | null, message = ''): string {
  if (!p) return message ? `<section class="booster"><p>${message}</p></section>` : '';
  if (!p.ouvert) {
    return `
      <section class="booster">
        <h2>${echap(p.titre)} : ${p.boosters.length > 1 ? `${p.boosters.length} boosters` : 'un booster'} !</h2>
        <button class="paquet-bouton" data-ouvrir-paquet aria-label="Ouvrir le booster">
          ${visuelPaquet(p.boosters[0], p.boosters.length > 1 ? `<span class="paquet-x">×${p.boosters.length}</span>` : '')}
        </button>
        <p class="note">Touche le booster pour l'ouvrir.</p>
      </section>`;
  }
  return `<section class="booster"><h2>${echap(p.titre)} : tes cartes</h2>${recapPaquet(p)}</section>`;
}

// Ouverture en plein écran : le paquet, puis une carte par appui, puis le récapitulatif.
function revelerPaquet(p: Paquet, fin: () => void) {
  document.querySelector('.revelation')?.remove();
  const cartes = cartesDuPaquet(p);
  type Etape = { type: 'paquet'; b: number } | { type: 'carte'; k: number } | { type: 'recap' };
  const etapes: Etape[] = [];
  p.boosters.forEach((_, b) => {
    etapes.push({ type: 'paquet', b });
    cartes.forEach((c, k) => { if (c.booster === b) etapes.push({ type: 'carte', k }); });
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
      el.innerHTML = `
        <div class="rev-recap">
          <h2>${echap(p.titre)} : tes cartes</h2>
          ${recapPaquet(p)}
          <button class="principal" data-fin>Continuer</button>
        </div>`;
      el.querySelector('[data-fin]')!.addEventListener('click', terminer);
      activerReflets(el);
      (el.querySelector('[data-fin]') as HTMLElement).focus();
      return;
    }
    const b = e.type === 'paquet' ? e.b : cartes[e.k].booster;
    const dansBooster = cartes.filter((c) => c.booster === b);
    const rang = e.type === 'carte' ? dansBooster.indexOf(cartes[e.k]) + 1 : 0;
    const info = `${plusieurs ? `Booster ${b + 1}/${p.boosters.length} · ` : ''}${nomBooster(p.boosters[b])}${rang ? ` · carte ${rang}/${dansBooster.length}` : ''}`;
    let scene: string;
    let aide: string;
    if (e.type === 'paquet') {
      scene = `<div class="rev-paquet">${visuelPaquet(p.boosters[b])}</div>`;
      aide = 'Touche l\'écran pour ouvrir le booster';
    } else {
      const c = cartes[e.k];
      const def = trouverLutteur(c.id);
      scene = `
        <div class="rev-carte r-${def.rarete}">
          <div class="rev-eclat" aria-hidden="true"></div>
          <span class="pastille ${c.nouvelle ? 'nouvelle' : 'nombre'}">${c.nouvelle ? 'Nouvelle !' : 'Double'}</span>
          ${carteHTML(def)}
        </div>`;
      const derniere = etapes[i + 1]?.type === 'recap';
      aide = derniere ? 'Touche l\'écran pour voir le récapitulatif' : 'Touche l\'écran pour la carte suivante';
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
    : `${Math.max(h.periodesGagnees, o.periodesGagnees)} périodes à ${Math.min(h.periodesGagnees, o.periodesGagnees)}`;
  const anciens = tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  const { idHumain, idOrdi } = partie;
  if (!recompenseDonnee) {
    recompenseDonnee = true;
    const x = bonusCeCombat ? REGLES.collection.multiplicateurApresTutoriel : 1;
    if (bonusCeCombat) collection.bonusTutoriel = false; // le bonus vaut pour un seul combat
    bonusCeCombat = false;
    if (gagne) {
      paquetSolo = { titre: x > 1 ? 'Victoire · boosters doublés' : 'Victoire', boosters: recompenser(collection, 'arene', Math.random, x), ouvert: false };
    } else {
      const conso = consoler(collection, Math.random);
      if (conso) paquetSolo = { titre: 'Booster de consolation', boosters: [conso], ouvert: false };
      else messageSolo = 'Encore une défaite d\'affilée et tu reçois un booster de consolation.';
    }
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
  app.querySelector('[data-changer]')!.addEventListener('click', ecranArene);
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
        <button class="principal" data-creer="collection">Avec nos collections<small>Vos cartes fusionnées · 2 boosters par victoire</small></button>
        <button class="secondaire" data-creer="base">Cartes de base<small>Les 15 cartes, sans fusion · pas de booster</small></button>
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
    b.addEventListener('click', () => connecter(nouveauCode(), 'hote', b.dataset.creer === 'collection' ? 'collection' : 'base')),
  );
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranAmis('Le code fait 4 lettres, sans chiffres.');
    connecter(code, 'invite');
  });
  window.scrollTo(0, 0);
}

async function connecter(code: string, role: Role, modeSalle?: ModeSalle) {
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
  }, { mode: modeSalle, coach: collection.coach, idCoach: collection.idCoach });
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
  // Absence de l'ami pendant le combat
  if (v.phase === 'combat' && !v.amiPresent) absentDepuis ??= Date.now();
  else absentDepuis = null;
  clearTimeout(minuteurAbsence);
  if (absentDepuis) minuteurAbsence = window.setTimeout(() => vueLigne && rafraichirLigne(vueLigne), 5000);

  if (v.phase === 'attente-ami' || v.phase === 'choix-lutteur') {
    const sig = `${v.phase}|${v.amiPresent}|${v.monLutteur}|${v.amiLutteur}|${v.attente}|${salleActive?.connecte()}|${v.modeSalle}|${v.amiCoach}`;
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
  const dispo = enCollection ? LUTTEURS.filter((l) => possede(collection, l.id)) : LUTTEURS;
  const liste = dispo.map((l) => {
    const g = enCollection ? gradeDe(collection, l.id) : 1;
    return `
    <button class="choix-l ${v.monLutteur === l.id ? 'pris' : ''}" data-l="${l.id}" aria-pressed="${v.monLutteur === l.id}">
      <span class="vignette">${portrait(l)}</span>
      <span><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[niveauCarte(l, g)]}</small></span>
    </button>`;
  }).join('');
  const modeTexte = v.modeSalle === null ? 'Connexion à la salle…'
    : enCollection ? 'Mode : vos collections (fusions comprises) · 2 boosters par victoire.'
    : 'Mode : cartes de base, toutes permises · pas de booster.';
  const ami = v.amiLutteur ? trouverLutteur(v.amiLutteur) : null;
  app.innerHTML = `
    <main class="amis">
      <header class="titre">
        <h1>Salle ${echap(codeSalle.toUpperCase())}</h1>
        <p class="code-grand" aria-label="Code de la salle">${echap(codeSalle.toUpperCase())}</p>
        <p class="note">${modeTexte}</p>
        <p>${!salleActive?.connecte() ? 'Connexion au relais…' : v.amiPresent ? `<b class="ok">${echap(v.amiCoach ? `Coach ${v.amiCoach}` : 'Ton ami')} est dans la salle.</b>` : 'Envoie ce code à ton ami. Il ouvre ce même lien, touche « Combat entre amis » et tape le code.'}</p>
        <p>${v.monLutteur ? `Tu as choisi <b>${echap(trouverLutteur(v.monLutteur).nom)}</b>.` : 'Choisis ton lutteur ci-dessous.'}
           ${ami ? ` Ton ami a choisi <b>${echap(ami.nom)}</b>.` : v.amiPresent ? ' Ton ami choisit son lutteur…' : ''}
           ${v.attente ? echap(v.attente) : ''}</p>
      </header>
      <div class="liste-l">${liste}</div>
      <p class="note">Ton deck personnalisé est utilisé s'il existe (sinon le deck de départ).</p>
      <button class="lien" data-sortir>Quitter la salle</button>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((b) =>
    b.addEventListener('click', () => duel?.choisirLutteur(b.dataset.l!, deckDe(collection, b.dataset.l!), enCollection ? gradeDe(collection, b.dataset.l!) : 1, enCollection ? etoilesDe(collection, b.dataset.l!) : {}, enCollection ? styleDe(collection, b.dataset.l!) : 0)),
  );
  app.querySelector('[data-sortir]')!.addEventListener('click', () => {
    oublierSession();
    quitterLigne();
    ecranMenu();
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
  // Récompense (mode collection) : 2 boosters par victoire, une seule fois par combat.
  // Une victoire par abandon ne compte qu'après 5 tours joués.
  const cle = `${codeSalle}-${v.graine}`;
  if (v.modeSalle === 'collection' && gagne && (!v.abandon || e.tourGlobal >= 5) && paquetLigne?.cle !== cle) {
    if (!collection.recompensesEnLigne.includes(cle)) {
      collection.recompensesEnLigne = [...collection.recompensesEnLigne, cle].slice(-50);
      paquetLigne = { cle, paquet: { titre: 'Victoire en ligne', boosters: recompenser(collection, 'enLigne', Math.random), ouvert: false } };
      sauver(collection);
    }
  }
  const booster = paquetLigne?.cle === cle ? sectionPaquet(paquetLigne.paquet) : '';
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
  if (h === '#club') return ecranClub();
  quitterEchange();
  if (h === '#combat') return ecranCombatMenu();
  if (h === '#regles') return ecranRegles();
  if (h === '#tutoriel') return ecranTutoriel();
  if (h === '#arene') return ecranArene();
  if (!partie) ecranMenu();
}
window.addEventListener('hashchange', route);
route();
