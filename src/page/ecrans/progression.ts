// Mode histoire, boîte à récompenses, quêtes du jour, scènes de dialogue et saison sportive.

import { ACTIONS, LUTTEURS, LUTTEUR_TEST, REGLES, ID_COCOACH, ID_RIVAL, trouverLutteur, REGLES as R_, type DefLutteur, type EtatCombat, type Niveau } from '../../moteur';
import { NOM_RARETE, activerReflets } from '../carte';
import { recompensesClub, noterBattuMain, adversaireAuto, nbExemplaires, niveauClub, possede, sauver, type Booster, type RecompenseAOuvrir, type SourceRecompense } from '../collection';
import { portraitPersonnage } from '../portrait';
import { jourDe } from '../club';
import { payerInscription } from '../tournoi';
import { changerQuete, destinationQuete, noterQuete, queteDe, quetesDuJour, texteRecompense, type EvenementQuete } from '../quetes';
import { ETAPES, NB_ETAPES, histoireFinie, noterHistoire, passerEtape, progression, type EvenementHistoire } from '../histoire';
import { PALIERS, creerCompetitionSaison, nbPaliers, noterSaison, nouvelleSaison, passerPalier, saisonOlympique, objectifPalier, recompensePalier, saisonFinie, saisonOuverte, type EvenementSaison } from '../saison';
import { PERSONNAGES, SCENES, scenesEnCours, varianteScene, type Personnage } from '../dialogues';
import { DEV } from '../dev';
import { niveauDe } from './accueil';
import { miniCarteLutteur } from './club';
import { CARTES } from './collection';
import { autoDispo, lancer } from './combat';
import { S, app, echap, enTete, nouvelleGraine } from './commun';
import { revelerPaquet, sectionPaquet } from './fin';
import { ecranTournoiEnCours, sauverTournoi } from './tournois';
import { noterParcours } from './stats';

// ---------- Modes histoire (histoire et saison) ----------


// ---------- Boîte à récompenses ----------
// Tout ce qui est gagné ailleurs qu'en fin de combat (étapes, paliers, quêtes, Mon Club) arrive dans
// une seule boîte, gardée dans la sauvegarde. Les cartes sont déjà dans la collection : la boîte
// sert à les découvrir.

export const NOM_SOURCE: Record<SourceRecompense, string> = { histoire: 'Mode histoire', saison: 'Saison sportive', quetes: 'Quêtes du jour', club: 'Mon Club', classement: 'Classement' };

export function mettreEnBoite(titre: string, source: SourceRecompense, boosters: Booster[]) {
  if (boosters.length) S.collection.aOuvrir.push({ titre, source, boosters });
}

// Petit lien vers la boîte, en haut des écrans qui donnent des récompenses.
export function lienBoite(): string {
  const n = S.collection.aOuvrir.length;
  return n ? `<a class="lien-boite" href="#recompenses">🎁 ${n} récompense${n > 1 ? 's' : ''} à ouvrir</a>` : '';
}

export function ecranRecompenses() {
  S.partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  const liste = S.collection.aOuvrir;
  if (!S.paquetBoite && liste.length) S.paquetBoite = { titre: liste[0].titre, boosters: liste[0].boosters, ouvert: false };
  const nbCartes = (r: RecompenseAOuvrir) => r.boosters.reduce((n, b) => n + b.cartes.length, 0);
  const reste = liste.slice(1).map((r) => `<li><small>${NOM_SOURCE[r.source]}</small><b>${echap(r.titre)}</b><span>${nbCartes(r)} carte${nbCartes(r) > 1 ? 's' : ''}</span></li>`).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Récompenses', liste.length ? `${liste.length} à ouvrir` : 'Rien à ouvrir pour l\'instant')}
      ${S.paquetBoite ? `<p class="note marge">${NOM_SOURCE[liste[0]?.source ?? 'histoire']}</p>${sectionPaquet(S.paquetBoite)}` : `<section class="bloc"><p>Les étapes du mode histoire, les quêtes du jour, la saison sportive et Mon Club déposent leurs récompenses ici. Reviens après tes prochains combats !</p><a class="principal lien-bouton" href="#combat">Combattre</a></section>`}
      ${reste ? `<section class="bloc"><h2>Ensuite</h2><ol class="liste-boite">${reste}</ol></section>` : ''}
    </main>`;
  activerReflets(app);
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => {
    if (!S.paquetBoite) return;
    // Retirée de la boîte dès l'ouverture : elle ne peut pas être découverte deux fois.
    S.collection.aOuvrir.shift();
    sauver(S.collection);
    revelerPaquet(S.paquetBoite, () => { S.paquetBoite = null; ecranRecompenses(); });
  });
  window.scrollTo(0, 0);
}

// Note un événement du jeu ; une étape validée est annoncée par une bulle.
export function histoire(ev: EvenementHistoire) {
  etapesValidees(noterHistoire(S.collection, ev, Math.random));
}

export function etapesValidees(r: ReturnType<typeof noterHistoire>) {
  if (!r.length) return;
  for (const x of r) {
    const legendaire = x.etape === NB_ETAPES - 1;
    mettreEnBoite(`Étape ${x.etape + 1} validée${legendaire ? ', carte légendaire' : ''}`, 'histoire', x.boosters);
  }
  sauver(S.collection);
  for (const x of r) noterParcours('histoire', `etape ${x.etape + 1}`);
  const der = r[r.length - 1].etape;
  annoncer(`Étape ${der + 1} validée : ${ETAPES[der].titre} !`);
}

// Note un événement de la saison sportive.
export function saison(ev: EvenementSaison) {
  palierValide(noterSaison(S.collection, ev, Math.random));
}

export function palierValide(r: ReturnType<typeof noterSaison>) {
  sauver(S.collection);
  if (!r) return;
  mettreEnBoite(`${PALIERS[r.palier].nom} : réussi${r.finSaison ? ', fin de saison' : ''}`, 'saison', r.boosters);
  sauver(S.collection);
  annoncer(r.finSaison ? `Saison ${S.collection.saison.numero} terminée !` : `${PALIERS[r.palier].nom} : objectif atteint !`);
}

// Boosters rares des nouveaux niveaux de Mon Club (6 à 10), à ouvrir dans Mon Club.
export function recompenseClub() {
  const r = recompensesClub(S.collection, Math.random);
  if (!r.length) return;
  for (const x of r) mettreEnBoite(`Mon Club niveau ${x.niveau}${x.niveau === R_.club.niveauSaison ? ' : la saison sportive est ouverte' : ''}`, 'club', [x.booster]);
  sauver(S.collection);
  const der = r[r.length - 1].niveau;
  annoncer(der >= R_.club.niveauSaison ? `Mon Club niveau ${der} : saison sportive ouverte !` : `Mon Club passe au niveau ${der} !`);
}

// Bulle d'annonce ; elle mène à la boîte à récompenses.
export function annoncer(titre: string, lien = '#recompenses', sousTitre = 'Touche ici pour ta récompense') {
  document.querySelector('.bulle-histoire')?.remove();
  const b = document.createElement('a');
  b.className = 'bulle-histoire';
  b.href = lien;
  b.setAttribute('role', 'status');
  b.innerHTML = `<b>${echap(titre)}</b><span>${echap(sousTitre)}</span>`;
  document.body.append(b);
  b.addEventListener('click', () => b.remove());
  setTimeout(() => b.remove(), 7000);
}

export const jauge = (p: [number, number]) => `<span class="jauge-histoire" style="--p:${(p[0] / p[1]) * 100}%"><i></i></span>`;

export function bandeauHistoire(): string {
  const n = S.collection.aOuvrir.length;
  if (n) {
    return `<a class="bandeau-histoire pret" href="#recompenses"><small>Boîte à récompenses</small><b>🎁 ${n} récompense${n > 1 ? 's' : ''} à ouvrir</b><span>${echap(S.collection.aOuvrir[0].titre)}</span></a>`;
  }
  // Saison ouverte et mode histoire pas fini : un petit rappel du mode histoire en dessous.
  const reste = saisonOuverte(S.collection) && !histoireFinie(S.collection)
    ? `<a class="bandeau-histoire petit" href="#histoire"><small>Mode histoire · étape ${S.collection.histoire.etape + 1}/${NB_ETAPES}</small><b>${echap(ETAPES[S.collection.histoire.etape].objectif)}</b></a>` : '';
  if (saisonOuverte(S.collection)) {
    const num = S.collection.saison.numero;
    if (saisonFinie(S.collection)) return `<a class="bandeau-histoire fini" href="#saison"><small>Saison ${num} terminée</small><b>Commencer la saison ${num + 1} ▶</b></a>${reste}`;
    const i = S.collection.saison.palier;
    const v = PALIERS[i].victoires;
    return `<a class="bandeau-histoire" href="#saison"><small>Saison ${num} · palier ${i + 1}/${nbPaliers(S.collection)} · ${echap(PALIERS[i].nom)}</small>
      <b>${echap(objectifPalier(i))}</b>${v ? `${jauge([S.collection.saison.victoires, v])}<span>${S.collection.saison.victoires}/${v}</span>` : ''}</a>${reste}`;
  }
  // Mode histoire fini, saison pas encore ouverte : on vise le niveau 10 de Mon Club.
  if (histoireFinie(S.collection)) {
    const n = niveauClub(S.collection);
    return `<a class="bandeau-histoire fini" href="#club"><small>Mode histoire terminé · Mon Club niveau ${n || 'fermé'}/${R_.club.niveauSaison}</small><b>Monte Mon Club au niveau ${R_.club.niveauSaison} pour ouvrir la saison sportive</b></a>`;
  }
  const i = S.collection.histoire.etape;
  const p = progression(S.collection);
  return `<a class="bandeau-histoire" href="#histoire"><small>Mode histoire · étape ${i + 1}/${NB_ETAPES}</small>
    <b>${echap(ETAPES[i].objectif)}</b>${p ? `${jauge(p)}<span>${p[0]}/${p[1]}</span>` : ''}</a>`;
}


// ---------- Quêtes journalières ----------

// Note un événement pour les quêtes du jour ; une quête réussie est annoncée par une bulle.
export function quete(ev: EvenementQuete) {
  const r = noterQuete(S.collection, ev, jourDe(), Math.random);
  sauver(S.collection);
  if (!r.length) return;
  for (const x of r) mettreEnBoite(`Quête réussie : ${x.titre}`, 'quetes', x.boosters);
  sauver(S.collection);
  annoncer(r.length > 1 ? `${r.length} quêtes réussies !` : `Quête réussie : ${r[0].titre}`, r.some((x) => x.boosters.length) ? '#recompenses' : '#quetes');
}

// Événement « combat terminé » pour les quêtes, calculé à partir des tours joués.
export function queteCombat(e: EtatCombat, mode: 'arene' | 'rapide' | 'tournoi' | 'equipe' | 'enLigne', niveau: Niveau | null, champion = false) {
  const moi = e.joueurs[S.HUMAIN];
  const nom = moi.def.nom;
  let feintes = 0, contres = 0, points = 0;
  S.tours.forEach((t, i) => {
    const apres = S.tours[i + 1]?.avant ?? e;
    const ch = t.choixHumain.action;
    const fam = ch === 'lutte' || ch === 'souffle' ? null : ACTIONS[ch].famille;
    const marque = t.lignes.filter((l) => l.startsWith(`${nom} marque `));
    for (const l of marque) points += Number(l.match(/marque (\d+)/)?.[1] ?? 0);
    if (fam === 'feinte' && apres.joueurs[S.HUMAIN].bonusFeinte === REGLES.toursBonusFeinte) feintes++;
    if (fam === 'contre' && marque.length) contres++;
  });
  // Combos, chaînes brisées, second souffle : seulement dans un combat joué à la main.
  const lignes = S.combatEnAuto ? [] : S.tours.flatMap((t) => t.lignes);
  const deMoi = (l: string) => { const fin = l.slice(l.indexOf('»')); return fin.includes(` ${nom} `) && !fin.includes(` ${nom} (`); };
  const combosNoms = lignes.filter((l) => l.startsWith('Combo « ') && deMoi(l)).map((l) => l.match(/« (.+?) »/)?.[1] ?? '');
  const combos = combosNoms.length + lignes.filter((l) => l === `Combo pour ${nom} !`).length;
  const ruptures = lignes.filter((l) => l.startsWith(`Chaîne brisée : le contre de ${nom} `) || l.startsWith(`Chaîne brisée : le matraquage de ${nom} `)).length;
  const souffle = lignes.some((l) => l.startsWith(`${nom} reprend son souffle`));
  const nouveaux = combosNoms.filter((n) => n && !S.collection.combosVus.includes(n));
  if (nouveaux.length) S.collection.combosVus = [...new Set([...S.collection.combosVus, ...nouveaux])];
  const gagne = e.vainqueur === S.HUMAIN;
  if (gagne && !S.combatEnAuto && mode !== 'enLigne') noterBattuMain(S.collection, e.joueurs[S.HUMAIN === 0 ? 1 : 0].def.id);
  quete({
    type: 'combat', mode, gagne, niveau, auto: S.combatEnAuto, tombe: e.finPar === 'tombe',
    ecart: moi.score - e.joueurs[S.HUMAIN === 0 ? 1 : 0].score, points, nation: moi.def.nation,
    niveauCarte: niveauDe(moi.def.id), feintes, contres, champion,
    combos, ruptures, souffle, enchainement: !!e.enchainement, infini: !!e.infini,
    rival: e.joueurs[S.HUMAIN === 0 ? 1 : 0].def.id === ID_RIVAL, tours: e.tourGlobal, epuisement: e.epuisementDes,
  });
  histoire({ type: 'combat', gagne, combos, enchainement: !!e.enchainement, infini: !!e.infini, auto: S.combatEnAuto });
}

export function blocQuetes(): string {
  const liste = quetesDuJour(S.collection, jourDe());
  const faites = liste.filter((q) => q.faite).length;
  return `<a class="bloc-quetes" href="#quetes"><span class="bq-titre">Quêtes du jour <b>${faites}/${liste.length}</b></span>
    ${liste.map((q) => {
      const d = queteDe(q.id);
      return `<span class="bq-ligne ${q.faite ? 'faite' : ''}"><i>${q.faite ? '✓' : d.difficulte === 'unique' ? '★' : '•'}</i>${echap(d.texte(q.param))}${d.but > 1 && !q.faite ? ` <small>${q.progres}/${d.but}</small>` : ''}</span>`;
    }).join('')}</a>`;
}

export const NOM_DIFFICULTE: Record<string, string> = { facile: 'Facile', moyenne: 'Moyenne', difficile: 'Difficile', unique: 'Unique' };

export function ecranQuetes(message = '') {
  S.partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  quete({ type: 'etat' });
  const jour = jourDe();
  const liste = quetesDuJour(S.collection, jour);
  const P = R_.quetes.prixChangement;
  const lignes = liste.map((q, i) => {
    const d = queteDe(q.id);
    const peutChanger = !q.faite && d.difficulte !== 'unique' && !S.collection.quetes.change;
    return `<li class="etape-histoire ${q.faite ? 'faite' : 'en-cours'} q-${d.difficulte}">
      <span class="etape-n">${q.faite ? '✓' : d.difficulte === 'unique' ? '★' : i + 1}</span>
      <div><small class="q-diff">${NOM_DIFFICULTE[d.difficulte]}</small><b>${echap(d.texte(q.param))}</b>
        ${d.but > 1 ? `<p class="progres">${jauge([q.progres, d.but])} ${q.progres}/${d.but}</p>` : ''}
        <small class="gain">🎁 ${texteRecompense(d)}</small>
        ${!q.faite && destinationQuete(q.id) ? `<button class="principal bouton-aller" data-aller-quete="${q.id}">${echap(destinationQuete(q.id)!.bouton)} →</button>` : ''}
        ${peutChanger ? `<button class="secondaire bouton-changer" data-changer="${i}" ${S.collection.dollars >= P ? '' : 'disabled'}>Changer cette quête (${P} $)</button>` : ''}
      </div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Quêtes du jour', 'Trois nouvelles quêtes chaque jour à minuit. Celles qui ne sont pas finies disparaissent.')}
      ${message}
      ${lienBoite()}
      <ol class="etapes-histoire">${lignes}</ol>
      <section class="bloc"><p class="note">🎁 Les 3 quêtes réussies : ${S.collection.quetes.bonus ? 'bonus reçu ✓' : '1 booster rare en bonus'}.
        ${S.collection.quetes.change ? 'Tu as déjà changé une quête aujourd\'hui.' : `Tu peux changer une quête par jour (${P} $), sauf une quête unique.`}
        Les quêtes uniques (★) ne reviennent jamais une fois réussies.</p></section>
    </main>`;
  activerReflets(app);
  // « Aller à la quête » : l'écran où la faire, avec le bon réglage déjà choisi à l'Entraînement.
  app.querySelectorAll<HTMLButtonElement>('[data-aller-quete]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = destinationQuete(b.dataset.allerQuete!);
      if (!d) return;
      if (d.reglage === 'fort') { S.collection.niveau = 'fort'; S.infiniChoisi = false; S.enchainementChoisi = false; sauver(S.collection); }
      if (d.reglage === 'enchainement') { S.enchainementChoisi = true; S.infiniChoisi = false; }
      if (d.reglage === 'infini') { S.infiniChoisi = true; S.enchainementChoisi = false; }
      location.hash = d.lien;
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-changer]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = changerQuete(S.collection, jour, Number(b.dataset.changer));
      sauver(S.collection);
      ecranQuetes(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
  window.scrollTo(0, 0);
}


// ---------- Scènes de dialogue ----------

export const defPersonnage = (qui: Personnage): DefLutteur => ({ ...trouverLutteur('europe'), id: `perso-${qui}`, nom: PERSONNAGES[qui].nom });

// Montre les scènes de l'avancement en cours que le joueur n'a pas encore vues.
export function scenesAuto() {
  if (document.querySelector('.voile, .scene-dialogue, .revelation')) return;
  const cles = scenesEnCours(S.collection.histoire.etape, NB_ETAPES, S.collection.saison.palier, saisonFinie(S.collection), saisonOlympique(S.collection.saison.numero), S.collection.saison.numero === 1, saisonOuverte(S.collection), nbExemplaires(S.collection, ID_COCOACH) > 0)
    .filter((k) => !S.collection.scenesVues.includes(k));
  if (cles.length) montrerScene(cles);
}

// Une scène façon BD : les bulles apparaissent une à une (« Suite »), « Passer » ferme tout.
export function montrerScene(cles: string[]) {
  // Cocoach devenu ami (il a donné sa carte) : version « ami » des scènes, cercle doré.
  const ami = S.collection.scenesVues.includes('hcocoach');
  const repliques = cles.flatMap((k) => SCENES[varianteScene(k, ami)] ?? []);
  if (!repliques.length) return;
  document.querySelector('.scene-dialogue')?.remove();
  const voile = document.createElement('div');
  voile.className = 'scene-dialogue';
  voile.setAttribute('role', 'dialog');
  voile.setAttribute('aria-modal', 'true');
  voile.setAttribute('aria-label', 'Scène du mode histoire');
  document.body.append(voile);
  let n = 1;
  const fermer = () => {
    for (const k of cles) if (!S.collection.scenesVues.includes(k)) S.collection.scenesVues.push(k);
    sauver(S.collection);
    voile.remove();
  };
  const rendre = () => {
    voile.innerHTML = `<div class="scene-cadre">
      <div class="scene-bulles">${repliques.slice(0, n).map((r, i) => `
        <div class="replique r-${r.qui} ${r.qui === 'cocoach' && (ami || r.ami) ? 'ami' : ''} ${i === n - 1 ? 'nouvelle' : ''}">
          <div class="replique-portrait">${portraitPersonnage(r.qui, r.humeur)}</div>
          <div class="replique-bulle"><b>${PERSONNAGES[r.qui].nom}</b><p>${echap(r.texte)}</p></div>
        </div>`).join('')}</div>
      <div class="scene-boutons">
        <button class="lien" data-passer>Passer</button>
        <button class="principal" data-suite>${n < repliques.length ? 'Suite' : 'C\'est parti !'}</button>
      </div></div>`;
    voile.querySelector('.scene-bulles')!.scrollTop = 1e6;
    voile.querySelector<HTMLButtonElement>('[data-suite]')!.focus();
    voile.querySelector('[data-suite]')!.addEventListener('click', () => { if (n < repliques.length) { n++; rendre(); } else fermer(); });
    voile.querySelector('[data-passer]')!.addEventListener('click', fermer);
  };
  rendre();
}

export function ecranHistoire() {
  S.partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  histoire({ type: 'etat' });
  const cours = S.collection.histoire.etape;
  const p = progression(S.collection);
  const lignes = ETAPES.map((e, i) => {
    const etat = i < cours ? 'faite' : i === cours ? 'en-cours' : 'verrouillee';
    const nb = R_.histoire.boosters[i];
    const recompense = `${nb ? `${nb} booster${nb > 1 ? 's' : ''}` : ''}${i === NB_ETAPES - 1 ? `${nb ? ' + ' : ''}1 carte légendaire` : ''}`;
    return `<li class="etape-histoire ${etat}">
      <span class="etape-n">${i < cours ? '✓' : i + 1}</span>
      <div><b>${echap(e.titre)}</b><p>${echap(e.objectif)}</p>
        ${i === cours ? `<p class="guide">${echap(e.guide)}</p>${p ? `<p class="progres">${jauge(p)} ${p[0]}/${p[1]}</p>` : ''}<a class="principal lien-bouton bouton-etape" href="${e.lien}">${echap(e.bouton)}</a>` : ''}
        ${i <= cours ? `<button class="lien revoir-scene" data-scene="h${i}">💬 Revoir la scène</button>` : ''}
        ${i === cours && DEV ? '<button class="secondaire bouton-test" data-passer-etape>⏭ Passer à l\'étape suivante (test)</button>' : ''}
        <small class="gain">🎁 ${recompense}</small></div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Mode histoire', histoireFinie(S.collection) ? 'Toutes les étapes sont validées. Bravo, coach !' : `Étape ${cours + 1} sur ${NB_ETAPES} · chaque étape débloque la suivante`)}
      ${lienBoite()}
      <section class="bloc"><p class="note">Une étape ne compte qu'une fois débloquée : ce que tu as fait avant ne compte pas, sauf pour Mon Club (étapes 3 et 6) et la Carrière (étapes 7 et 11), validées tout de suite si c'est déjà fait. Pas de médailles dans le mode histoire, mais des boosters à chaque étape. La saison sportive est un mode à part, ouvert au niveau ${R_.club.niveauSaison} de Mon Club.</p></section>
      <ol class="etapes-histoire">${lignes}</ol>
    </main>`;
  activerReflets(app);
  app.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => montrerScene([b.dataset.scene!])));
  app.querySelector('[data-passer-etape]')?.addEventListener('click', () => {
    etapesValidees(passerEtape(S.collection, Math.random));
    document.querySelector('.bulle-histoire')?.remove();
    ecranHistoire();
  });
  window.scrollTo(0, 0);
  scenesAuto();
}


// ---------- Saison sportive ----------

export function ecranSaison() {
  S.partie = null;
  document.querySelector('.bulle-histoire')?.remove();
  if (!saisonOuverte(S.collection)) {
    app.innerHTML = `<main class="sous-menu">${enTete('Saison sportive', 'Verrouillée')}
      <section class="bloc"><p>🔒 La saison sportive s'ouvre au <b>niveau ${R_.club.niveauSaison} de Mon Club</b> (niveau actuel : ${niveauClub(S.collection) || 'fermé'}). Gagne des médailles en combat pour faire monter ton club.</p>
      ${S.collection.saison.palier > 0 || S.collection.saison.terminees > 0 ? `<p class="note">Ta progression est gardée : saison ${S.collection.saison.numero}, palier ${Math.min(S.collection.saison.palier + 1, nbPaliers(S.collection))}. Tu la retrouves dès que ton club atteint le niveau ${R_.club.niveauSaison}.</p>` : ''}
      <a class="principal lien-bouton" href="#club">Voir Mon Club</a></section></main>`;
    return;
  }
  const cours = S.collection.saison.palier;
  const enCours = !!S.tournoi && !S.tournoi.recompense;
  const C = R_.tournoi.individuel;
  const olympique = saisonOlympique(S.collection.saison.numero);
  const num = S.collection.saison.numero;
  const lignes = PALIERS.slice(0, nbPaliers(S.collection)).map((p, i) => {
    const etat = i < cours ? 'faite' : i === cours ? 'en-cours' : 'verrouillee';
    let action = '';
    if (i === cours) {
      if (p.victoires) {
        action = `<p class="progres">${jauge([S.collection.saison.victoires, p.victoires])} ${S.collection.saison.victoires}/${p.victoires} victoires</p>
          <button class="principal" data-interclub>Combat interclub</button>`;
      } else if (enCours && S.tournoi?.type === 'individuel' && S.tournoi.saison === i) {
        action = '<button class="principal" data-reprendre-competition>Reprendre la compétition</button>';
      } else {
        action = `<p class="note">Inscription ${C.inscription} $ (tu as ${S.collection.dollars} $). Gains habituels du tournoi individuel, plus la récompense du palier.</p>
          <button class="principal" data-competition ${enCours ? 'disabled' : ''}>S'inscrire</button>
          ${enCours ? '<p class="note">Un autre tournoi est en cours : termine-le d\'abord.</p>' : ''}`;
      }
    }
    return `<li class="etape-histoire ${etat}">
      <span class="etape-n">${i < cours ? '✓' : i + 1}</span>
      <div><b>${echap(p.nom)}</b><p>${echap(objectifPalier(i))}</p>${action}
        ${i <= cours ? `<button class="lien revoir-scene" data-scene="${i === 4 && !olympique ? 's4b' : `s${i}`}">💬 Revoir la scène</button>` : ''}
        ${i === cours && DEV ? '<button class="secondaire bouton-test" data-passer-palier>⏭ Passer au palier suivant (test)</button>' : ''}
        <small class="gain">🎁 ${recompensePalier(i)}</small></div></li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(`Saison ${num}`, saisonFinie(S.collection) ? 'Saison terminée !' : `Palier ${cours + 1} sur ${nbPaliers(S.collection)} · ${PALIERS[cours].nom}`)}
      ${lienBoite()}
      ${saisonFinie(S.collection) ? `<section class="bloc saison-ouverte"><h2>Saison ${num} terminée 🏆</h2>
        <p>${S.collection.saison.terminees} saison${S.collection.saison.terminees > 1 ? 's' : ''} terminée${S.collection.saison.terminees > 1 ? 's' : ''} au total. La saison ${num + 1} ${saisonOlympique(num + 1) ? 'se termine aux Jeux Olympiques' : 'se termine aux championnats du monde (les Jeux reviennent tous les 4 ans)'}.</p>
        <button class="principal" data-nouvelle-saison>Commencer la saison ${num + 1}</button>
        <button class="lien" data-scene="${olympique ? 's6' : 's6b'}">💬 Revoir la scène finale</button></section>` : ''}
      <section class="bloc"><p class="note">${olympique ? 'Saison olympique : elle se termine aux Jeux Olympiques' : 'Cette saison se termine aux championnats du monde'}. Fin de saison : ${R_.saison.cartesFinSaison} cartes Champion du Monde (au hasard : 5 exemplaires d'une même carte, ou 5 cartes différentes)${olympique ? ', deux fois' : ''}.</p></section>
      <ol class="etapes-histoire">${lignes}</ol>
    </main>`;
  activerReflets(app);
  app.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => montrerScene([b.dataset.scene!])));
  app.querySelector('[data-interclub]')?.addEventListener('click', () => ecranChoixSaison('interclub'));
  app.querySelector('[data-competition]')?.addEventListener('click', () => ecranChoixSaison('competition'));
  app.querySelector('[data-reprendre-competition]')?.addEventListener('click', ecranTournoiEnCours);
  app.querySelector('[data-nouvelle-saison]')?.addEventListener('click', () => {
    if (nouvelleSaison(S.collection)) sauver(S.collection);
    ecranSaison();
  });
  app.querySelector('[data-passer-palier]')?.addEventListener('click', () => {
    palierValide(passerPalier(S.collection, Math.random));
    document.querySelector('.bulle-histoire')?.remove();
    ecranSaison();
  });
  window.scrollTo(0, 0);
  scenesAuto();
}

// Choix du lutteur pour un combat interclub ou pour s'inscrire à la compétition du palier.
export function ecranChoixSaison(quoi: 'interclub' | 'competition', message = '') {
  const p = PALIERS[S.collection.saison.palier];
  if (!p) return ecranSaison();
  const miens = [...(DEV ? [LUTTEUR_TEST] : []), ...CARTES.filter((l) => possede(S.collection, l.id))]; // + Cocoach, lutteur de test (mode développeur)
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(p.nom, quoi === 'interclub' ? 'Combat rapide (1 période) contre un autre club' : `Inscription ${R_.tournoi.individuel.inscription} $ (tu as ${S.collection.dollars} $)`, '#saison')}
      ${message}
      ${quoi === 'interclub' && autoDispo() && S.collection.battusMain.length ? '<section class="bloc"><label class="case"><input type="checkbox" data-auto-saison> ⚡ Combat auto</label><p class="note">En auto, l\'adversaire est tiré parmi les lutteurs que tu as déjà battus à la main.</p></section>' : ''}
      <section class="bloc"><h2>Choisis ton lutteur</h2></section>
      <div class="liste-recrues marge">${miens.map((l) => `<button data-choisir="${l.id}" aria-label="Choisir ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-choisir]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.choisir!;
      if (quoi === 'interclub') return lancerInterclub(id, !!app.querySelector<HTMLInputElement>('[data-auto-saison]')?.checked);
      const erreur = payerInscription(S.collection, 'individuel');
      if (erreur) return ecranChoixSaison(quoi, `<p class="alerte">${echap(erreur)}</p>`);
      S.tournoi = creerCompetitionSaison(S.collection, id, nouvelleGraine());
      S.paquetTournoi = null;
      sauver(S.collection);
      sauverTournoi();
      ecranTournoiEnCours();
    }),
  );
  window.scrollTo(0, 0);
}

// Combat interclub : combat rapide contre un lutteur d'une autre nation, ordinateur du palier.
export function lancerInterclub(id: string, auto: boolean) {
  const nation = trouverLutteur(id).nation;
  const autres = LUTTEURS.filter((l) => l.nation !== nation);
  // En auto : un adversaire d'une autre nation déjà battu à la main (sinon le combat se joue à la main).
  const ordi = (auto ? adversaireAuto(S.collection, Math.random, (x) => trouverLutteur(x).nation === nation) : null) ?? autres[Math.floor(Math.random() * autres.length)].id;
  lancer(id, ordi, nouvelleGraine(), true, PALIERS[0].niveau as Niveau, auto, null, true);
}
