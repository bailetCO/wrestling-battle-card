// Choix du deck, collection et fusion.

import { ACTIONS, CARTES_SPECIALES, CHAMPIONS, LUTTEURS, NATIONS, nomLocal, trouverLutteur, NIVEAUX, etoilesPossibles, verifierDeck, coutAction, actionsDebloquees, TAILLE_DECK, REGLES as R_, type DefLutteur, type IdAction } from '../../moteur';
import { ICONE, NOM_FAMILLE, effetAction } from '../textes';
import { NOM_RARETE, ORDRE_RARETE, STYLES_CARTE, activerReflets } from '../carte';
import { enFragment, debloquerLegendaire, legendaireDe, niveauCompte, gagnerMedailles, choisirDeck, deckDe, defPossede, etoilesDe, fusionPrete, fusionner, gradeDe, nbEtoiles, nbExemplaires, nouvelleCollection, possede, prochaineFusion, sauver, nbFusions, nbStyles, styleDe, doublesPourMaximum, type TriCollection } from '../collection';
import { ouvrirBooster } from '../collection';
import { DEV } from '../dev';
import { afficherBandeauTest, bonusDeTest } from '../test';
import { carteJoueur, compteur, defJoueur, niveauDe } from './accueil';
import { fermerFenetre, ouvrirFenetre } from './combat';
import { S, app, echap, enTete, portrait } from './commun';
import { revelerPaquet } from './fin';
import { route } from './navigation';
import { histoire, quete } from './progression';

// ---------- Choix du deck ----------

export function fenetreDeck(base: DefLutteur) {
  const def = defPossede(S.collection, base.id);
  const grade = gradeDe(S.collection, base.id);
  const et = etoilesDe(S.collection, base.id);
  let choix: IdAction[] = [...(deckDe(S.collection, def.id) ?? def.actions)];
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
    if (choisirDeck(S.collection, def.id, choix)) return;
    sauver(S.collection);
    quete({ type: 'deck' });
    fermerFenetre();
    route();
  });
  f.querySelector('[data-defaut]')!.addEventListener('click', () => {
    delete S.collection.decks[def.id];
    sauver(S.collection);
    fermerFenetre();
    route();
  });
  maj();
}


// ---------- Collection ----------

export const TRIS: { id: TriCollection; nom: string }[] = [
  { id: 'rarete', nom: 'Rareté de base' }, { id: 'nation', nom: 'Nation' },
  { id: 'fusions', nom: 'Fusions' }, { id: 'niveau', nom: 'Rareté actuelle' },
];

// Toutes les cartes qu'un joueur peut posséder : les 120 lutteurs, les 12 Champions du Monde et la
// carte secrète de Darius.
export const CARTES: DefLutteur[] = [...LUTTEURS, ...CHAMPIONS, ...CARTES_SPECIALES];

// Les groupes de cartes de la collection, selon le tri choisi.
// Sans aucun Champion du Monde, leur groupe est tout en bas ; dès le premier, il remonte en haut (tris
// par rareté seulement). Dans chaque groupe, les cartes à gagner sont cachées derrière « Voir plus »
// (sauf le groupe « À gagner » du tri par fusions, qui n'a que celles-là).
export const groupesDeplies = new Set<string>();
export function groupesCollection(): { titre: string; liste: DefLutteur[]; replie: boolean }[] {
  const aucun = !CHAMPIONS.some((l) => possede(S.collection, l.id));
  // La carte secrète de Darius n'apparaît qu'une fois gagnée (surprise de fin du mode histoire).
  const champions = { titre: 'Champions du Monde', liste: [...CARTES_SPECIALES.filter((l) => possede(S.collection, l.id)), ...CHAMPIONS] };
  // En haut seulement dans les tris par rareté (de base ou actuelle) ; ailleurs, tout en bas.
  const enHaut = !aucun && (S.collection.tri === 'rarete' || S.collection.tri === 'niveau');
  const groupes = enHaut ? [champions, ...groupesBase()] : [...groupesBase(), champions];
  return groupes.map((g) => ({ ...g, replie: g.titre !== 'À gagner' && !groupesDeplies.has(g.titre) }));
}

export function groupesBase(): { titre: string; liste: DefLutteur[] }[] {
  const tri = S.collection.tri;
  const rangBase = (l: DefLutteur) => ORDRE_RARETE.indexOf(l.rarete);
  if (tri === 'nation') {
    return NATIONS.map((n) => ({ titre: n.nom, liste: LUTTEURS.filter((l) => l.nation === n.id).sort((a, b) => rangBase(a) - rangBase(b)) }));
  }
  if (tri === 'niveau') {
    return [...NIVEAUX].reverse().map((niv) => ({
      titre: NOM_RARETE[niv],
      liste: LUTTEURS.filter((l) => (possede(S.collection, l.id) ? niveauDe(l.id) : l.rarete) === niv),
    })).filter((g) => g.liste.length);
  }
  if (tri === 'fusions') {
    const miens = LUTTEURS.filter((l) => possede(S.collection, l.id))
      .sort((a, b) => nbFusions(S.collection, b.id) - nbFusions(S.collection, a.id) || rangBase(a) - rangBase(b));
    const autres = LUTTEURS.filter((l) => !possede(S.collection, l.id));
    return [{ titre: 'Les plus fusionnées', liste: miens }, { titre: 'À gagner', liste: autres }].filter((g) => g.liste.length);
  }
  return ORDRE_RARETE.map((r) => ({ titre: NOM_RARETE[r], liste: LUTTEURS.filter((l) => l.rarete === r) }));
}

export function ecranCollection() {
  S.partie = null;
  const groupes = groupesCollection().map(({ titre, liste, replie }) => {
    // Les cartes secrètes (Darius, Cocoach) ne comptent pas dans le total : « 2/12 + 2 cartes secrètes ».
    const speciales = liste.filter((l) => CARTES_SPECIALES.includes(l)).length;
    const n = liste.filter((l) => possede(S.collection, l.id)).length - speciales;
    const total = liste.length - speciales;
    const secretes = speciales ? ` · ${speciales} secrète${speciales > 1 ? 's' : ''}` : '';
    // Les cartes possédées d'abord, celles à gagner ensuite (l'ordre du tri est gardé dans chaque partie).
    const aGagner = liste.filter((l) => !possede(S.collection, l.id));
    const triees = [...liste.filter((l) => possede(S.collection, l.id)), ...(replie ? [] : aGagner)];
    const cartes = triees.map((l) => miniCarteCollection(l)).join('');
    const bouton = !aGagner.length || titre === 'À gagner' ? ''
      : `<button class="lien voir-plus" data-voir="${titre}">${replie ? `Voir plus (${aGagner.length} à gagner)` : 'Voir moins'}</button>`;
    return `<section class="groupe"><h2>${titre} <small>${n}/${total}${secretes}</small></h2><div class="grille-mini miniatures">${cartes}</div>${bouton}</section>`;
  }).join('');
  const tris = TRIS.map((t) => `<button class="puce ${S.collection.tri === t.id ? 'actif' : ''}" data-tri="${t.id}" aria-pressed="${S.collection.tri === t.id}">${t.nom}</button>`).join('');
  app.innerHTML = `
    <main class="galerie">
      ${enTete('Collection', compteur())}
      <p class="note marge">Touche une de tes cartes pour régler ses actions ou la fusionner. Boosters : classique (3 cartes) ou rare (5 cartes, 1 fois sur 4). Les communes sortent plus souvent que les légendaires.</p>
      <nav class="puces tri" aria-label="Trier la collection"><span>Trier par</span>${tris}</nav>
      ${groupes}
      <section class="groupe reglages">
        <h2>Réglages</h2>
        ${DEV ? `<p class="note">Mode développeur · tu as ${S.collection.medailles} médaille${S.collection.medailles > 1 ? 's' : ''} et ${S.collection.dollars} $.</p>
        <div class="boutons-test">
          <button class="secondaire" data-medailles-test>+10 médailles (test)</button>
          <button class="secondaire" data-dollars-test>+50 $ (test)</button>
        </div>
        <button class="secondaire" data-booster-test>Ouvrir un booster (test)</button>
        <button class="secondaire" data-doubles-test>Doubles pour tout monter au maximum (test)</button>
        <button class="secondaire" data-test>${S.collection.toutDebloque ? 'Revenir à ma vraie collection' : 'Débloquer toutes les cartes (mode test)'}</button>` : ''}
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
      S.collection.tri = b.dataset.tri as TriCollection;
      sauver(S.collection);
      ecranCollection();
    }),
  );
  // Test : des médailles comme si on les avait gagnées (10 $ par palier de 5, niveau de compte, Mon Club).
  app.querySelector('[data-medailles-test]')?.addEventListener('click', () => {
    const g = gagnerMedailles(S.collection, 10);
    sauver(S.collection);
    histoire({ type: 'etat' });
    ecranCollection();
    ouvrirFenetre(`<h2>+10 médailles</h2><p>Tu as maintenant ${S.collection.medailles} médailles${g.dollars ? `, et ${g.dollars} $ de paliers en plus` : ''} (niveau de compte ${niveauCompte(S.collection)}).</p><button class="principal" data-fermer>OK</button>`, true);
  });
  app.querySelector('[data-dollars-test]')?.addEventListener('click', () => {
    S.collection.dollars += 50;
    sauver(S.collection);
    ecranCollection();
    ouvrirFenetre(`<h2>+50 $</h2><p>Tu as maintenant ${S.collection.dollars} $.</p><button class="principal" data-fermer>OK</button>`, true);
  });
  app.querySelector('[data-test]')?.addEventListener('click', () => {
    S.collection.toutDebloque = !S.collection.toutDebloque;
    sauver(S.collection);
    ecranCollection();
  });
  app.querySelector('[data-doubles-test]')?.addEventListener('click', () => {
    const n = doublesPourMaximum(S.collection);
    sauver(S.collection);
    ecranCollection();
    ouvrirFenetre(`<h2>Doubles ajoutés</h2><p>${n ? `${n} doubles ajoutés : tu peux monter chacune de tes cartes jusqu'à Champion du Monde et lui donner toutes ses étoiles dans Fusion.` : 'Tes cartes ont déjà assez de doubles.'}</p>
      <a class="principal lien-bouton" href="#fusion" data-fermer>Aller à la fusion</a><button class="lien" data-fermer>Fermer</button>`, true);
  });
  app.querySelector('[data-booster-test]')?.addEventListener('click', () => {
    const b = ouvrirBooster(S.collection, Math.random);
    sauver(S.collection);
    revelerPaquet({ titre: 'Booster de test', boosters: [b], ouvert: false }, () => ecranCollection());
  });
  const raz = app.querySelector<HTMLButtonElement>('[data-raz]')!;
  raz.addEventListener('click', () => {
    if (!raz.dataset.confirme) {
      raz.dataset.confirme = '1';
      raz.textContent = 'Appuie encore pour tout effacer (cartes, grades, decks, victoires)';
      return;
    }
    const coach = S.collection.coach;
    S.collection = nouvelleCollection();
    S.collection.coach = coach;
    const bonus = coach ? bonusDeTest(S.collection, coach) : null; // le bonus de test revient après une remise à zéro
    sauver(S.collection);
    ecranCollection();
    if (bonus) afficherBandeauTest(bonus);
  });
  activerReflets(app);
  window.scrollTo(0, 0);
}

// Petite carte pour la grille de la collection : portrait, nom, nation, grade, exemplaires.
export function miniCarteCollection(l: DefLutteur): string {
  const a = possede(S.collection, l.id);
  const g = gradeDe(S.collection, l.id);
  const n = nbExemplaires(S.collection, l.id);
  const et = nbEtoiles(S.collection, l.id);
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
export function blocStyles(def: DefLutteur): string {
  if (nbExemplaires(S.collection, def.id) === 0 || niveauDe(def.id) !== 'champion') return '';
  const n = nbStyles(S.collection, def.id);
  const choisi = styleDe(S.collection, def.id);
  const palier = etoilesPossibles(def) / R_.fusion.stylesCarte;
  const et = nbEtoiles(S.collection, def.id);
  const suite = n < R_.fusion.stylesCarte
    ? `Prochain style à ${Math.ceil(palier * (n + 1))} étoiles (tu en as ${et}).`
    : 'Tous les styles sont débloqués.';
  const boutons = STYLES_CARTE.map((nom, i) => i <= n
    ? `<button class="puce ${i === choisi ? 'actif' : ''}" data-style="${i}" aria-pressed="${i === choisi}">${nom}</button>`
    : `<button class="puce" disabled>🔒 ${nom}</button>`).join('');
  return `<div class="styles-carte"><p class="note">Style de la carte · ${n}/${R_.fusion.stylesCarte} débloqués. ${suite}</p><div class="puces">${boutons}</div></div>`;
}

export function fenetreCarteCollection(def: DefLutteur) {
  const f = prochaineFusion(S.collection, def.id);
  const n = nbExemplaires(S.collection, def.id);
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
      S.collection.styles[def.id] = Number(b.dataset.style);
      sauver(S.collection);
      ecranCollection();
      fenetreCarteCollection(def);
    }),
  );
}


// ---------- Fusion ----------

export function statsTexte(d: DefLutteur): string {
  return `Endurance ${d.enduranceMax} · force ${d.force} · récupération ${Math.round(d.recuperation * 100)} %`;
}

// Fragments de légende : chaque double d'une nation peut devenir un fragment de sa légendaire.
export function sectionFragments(): string {
  const N = R_.collection.fragmentsPourLegendaire;
  const lignes = NATIONS.map((n) => {
    const leg = legendaireDe(n.id);
    if (!leg) return '';
    const frag = S.collection.fragments[n.id] ?? 0;
    // Le double proposé : celui de la nation qu'on a en plus grand nombre (jamais le dernier exemplaire).
    const double = LUTTEURS.filter((l) => l.nation === n.id && nbExemplaires(S.collection, l.id) >= 2)
      .sort((a, b) => nbExemplaires(S.collection, b.id) - nbExemplaires(S.collection, a.id))[0];
    if (!frag && !double) return '';
    return `<li class="fragment-ligne">
      <span class="vignette">${portrait(leg, 'legendaire')}</span>
      <span class="fusion-info"><b>${echap(n.nom)} · ${echap(leg.nom)}</b>
        <small>${frag}/${N} fragments${possede(S.collection, leg.id) ? ' · déjà dans ta collection (un exemplaire de plus)' : ''}</small>
        <span class="jauge"><i style="width:${Math.min(100, (frag / N) * 100)}%"></i></span></span>
      ${frag >= N
        ? `<button class="principal petit-bouton" data-legende="${n.id}">Débloquer</button>`
        : double ? `<button class="secondaire petit-bouton" data-fragment="${double.id}" title="Transformer un double de ${echap(double.nom)}">+1 fragment<small>${echap(double.nom.split(' ')[0])} ×${nbExemplaires(S.collection, double.id)}</small></button>` : ''}
    </li>`;
  }).join('');
  return `<section class="bloc"><h2>Fragments de légende</h2>
    <p>Transforme un double d'une nation en 1 fragment de sa légendaire. ${N} fragments la débloquent.</p>
    ${lignes ? `<ul class="fusion-liste">${lignes}</ul>` : '<p class="note">Il te faut des doubles pour gagner des fragments.</p>'}</section>`;
}

export function ecranFusion(message = '') {
  S.partie = null;
  const miens = CARTES.filter((l) => nbExemplaires(S.collection, l.id) > 0)
    .sort((a, b) => {
      return Number(fusionPrete(S.collection, b.id)) - Number(fusionPrete(S.collection, a.id))
        || nbExemplaires(S.collection, b.id) - nbExemplaires(S.collection, a.id);
    });
  const lignes = miens.map((l) => {
    const f = prochaineFusion(S.collection, l.id);
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
          <small>${f ? `${f.type === 'grade' ? `Vers ${NOM_RARETE[f.niveau]}` : `Étoile (★${nbEtoiles(S.collection, l.id)})`} : ${Math.min(f.doublesDispo, f.doublesNecessaires)}/${f.doublesNecessaires} double${f.doublesNecessaires > 1 ? 's' : ''}` : 'Maximum atteint : toutes les actions ont 3 étoiles'}</small>
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
      const erreur = enFragment(S.collection, b.dataset.fragment!);
      if (!erreur) sauver(S.collection);
      ecranFusion(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-legende]').forEach((b) =>
    b.addEventListener('click', () => {
      const nation = b.dataset.legende!;
      const erreur = debloquerLegendaire(S.collection, nation);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(S.collection);
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
      if (prochaineFusion(S.collection, id)?.type === 'etoile') return fenetreEtoile(id);
      const def = trouverLutteur(id);
      const avant = defJoueur(def);
      const erreur = fusionner(S.collection, id);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(S.collection);
      quete({ type: 'fusion', etoile: false });
      histoire({ type: 'fusion', id });
      const apres = defJoueur(def);
      ecranFusion();
      const f = ouvrirFenetre(`
        <h2 class="onomato rouge">FUSION !</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(def)}</div>
        <p><b>${echap(def.nom)}</b> devient <b>${NOM_RARETE[niveauDe(id)]}</b> ! Nouvelle action débloquée : <b>${echap(nomLocal(def.nation, actionsDebloquees(def, gradeDe(S.collection, id)).slice(-1)[0] ?? def.actions[0]))}</b> (coût ${coutAction(defPossede(S.collection, id), actionsDebloquees(def, gradeDe(S.collection, id)).slice(-1)[0] ?? def.actions[0])}).</p>
        <p class="note">Avant : ${statsTexte(avant)}<br>Après : ${statsTexte(apres)}</p>
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  window.scrollTo(0, 0);
}

// Étoile (Champion du Monde) : choisir l'action dont le coût baisse de 1.
export function fenetreEtoile(id: string) {
  const f = prochaineFusion(S.collection, id);
  if (!f || f.type !== 'etoile') return;
  const def = defPossede(S.collection, id);
  const et = etoilesDe(S.collection, id);
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
      const stylesAvant = nbStyles(S.collection, id);
      const erreur = fusionner(S.collection, id, a);
      if (erreur) return ecranFusion(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(S.collection);
      quete({ type: 'fusion', etoile: true });
      ecranFusion();
      const nouveau = nbStyles(S.collection, id) > stylesAvant;
      const ok = ouvrirFenetre(`
        <h2 class="onomato rouge">${nouveau ? 'NOUVEAU STYLE !' : 'ÉTOILE !'}</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(trouverLutteur(id))}</div>
        <p><b>${echap(nomLocal(def.nation, a))}</b> coûte maintenant ${coutAction(defPossede(S.collection, id), a)} d'endurance.</p>
        ${nouveau ? `<p>Style débloqué : <b>${STYLES_CARTE[nbStyles(S.collection, id)]}</b>. Tu peux changer de style dans la Collection.</p>` : ''}
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(ok);
    }),
  );
}
