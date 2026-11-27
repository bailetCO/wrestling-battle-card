// Menu Combat, Carrière et Entraînement (choix du lutteur et de l'adversaire).

import { LUTTEURS, LUTTEUR_TEST, NATIONS, ID_RIVAL, trouverLutteur, REGLES as R_ } from '../../moteur';
import { NOM_RARETE, activerReflets } from '../carte';
import { adversaireAuto, deckDe, possede, sauver } from '../collection';
import { drapeauSVG } from '../portrait';
import { PAR_NATION, adversairesDe, areneTerminee, etapeArene, nationsArene } from '../arene';
import { TUTOS, type IdTuto } from '../tutos';
import { DEV } from '../dev';
import { carteJoueur } from './accueil';
import { CARTES, fenetreDeck } from './collection';
import { boutonAuto, brancherStyle, encartRival, lancer, lancerArene, reglagesStyle } from './combat';
import { fonctionVisible } from '../menu';
import { S, app, choixNiveau, echap, enTete, niveauOrdi, nouvelleGraine, portrait } from './commun';
import { NOM_NIVEAU, boutonTuto, brancherTutos, tutoAuto } from './tutos-courts';

export function ecranCombatMenu() {
  S.partie = null;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Combat')}
      <nav class="aide-barre" aria-label="Aide">
        <a class="aide-btn" href="#regles"><span aria-hidden="true">?</span>Règles</a>
        <a class="aide-btn" href="#tutoriel">Tutoriel<span aria-hidden="true">▶</span></a>
      </nav>
      <section class="bloc">
        <h2>Carrière</h2>
        ${S.collection.bonusTutoriel ? '<p class="bandeau-bonus">Tutoriel terminé : ta prochaine victoire en Carrière rapporte 2 boosters en bonus.</p>' : ''}
        <p>${areneTerminee(S.collection) ? 'Carrière terminée : réaffronte les boss pour gagner leur carte.' : `En cours : <b>${echap(etapeArene(S.collection).nation!.nom)}</b>, adversaire ${etapeArene(S.collection).rang + 1}/${PAR_NATION}.`} Bats les nations une à une : 5 lutteurs chacune, de plus en plus forts, le dernier est le boss. +1 médaille par victoire ; nation battue : 2 ou 3 boosters et ${R_.arene.medaillesParNation} médailles. Toutes les 2 défaites d'affilée, un booster de consolation.</p>
        <a class="principal lien-bouton" href="#arene">Aller en Carrière</a>
      </section>
      <section class="bloc">
        <h2>Entraînement</h2>
        <p>Une seule période : victoire à 10 points d'écart, par tombé, ou aux points. Égalité à la fin : mort subite, le premier qui marque gagne. +1 médaille par victoire, sans booster.</p>
        <a class="principal lien-bouton" href="#rapide">S'entraîner contre l'ordinateur</a>
      </section>
      ${fonctionVisible(S.collection, 'amis') ? `<section class="bloc">
        <h2>En ligne</h2>
        <p>Affronte un ami sur son téléphone. Chaque victoire rapporte 2 médailles, et 2 boosters avec ta collection.</p>
        <a class="principal lien-bouton" href="#amis">Combat entre amis</a>
      </section>` : ''}
      <section class="bloc tutos-courts">
        <h2>Tutoriels courts</h2>
        <p class="note">Quelques écrans, puis une partie d'essai guidée, pour découvrir un style de jeu. D'autres tutoriels apparaissent au fil du mode histoire.</p>
        ${(Object.keys(TUTOS) as IdTuto[]).map((id) => boutonTuto(id)).join('')}
      </section>
    </main>`;
  brancherTutos();
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = b.dataset.niveau;
      S.collection.niveau = n === 'fort' || n === 'facile' ? n : 'normal';
      sauver(S.collection);
      ecranCombatMenu();
    }),
  );
  window.scrollTo(0, 0);
}


// En-tête de l'arène : la nation en cours, ses 5 adversaires et l'adversaire à battre.
export function blocArene(): string {
  if (S.bossChoisi) {
    const n = nationsArene().find((x) => x.id === S.bossChoisi)!;
    const boss = trouverLutteur(adversairesDe(n.id)[PAR_NATION - 1]);
    return `<section class="bloc arene-nation">${drapeauSVG(n.id)}<h2>Revanche : ${echap(boss.nom)}</h2>
      <p>Boss de ${echap(n.nom)}, ordinateur fort. Victoire : +1 médaille et 1 chance sur 3 de gagner sa carte.</p>
      <button class="lien" data-annuler-boss>Revenir à la Carrière</button></section>`;
  }
  const e = etapeArene(S.collection);
  const battues = e.nationsBattues;
  const boss = battues.length
    ? `<section class="bloc"><h2>Boss à réaffronter</h2><p>1 chance sur 3 de gagner sa carte à chaque victoire.</p>
        <div class="boss-liste">${battues.map((n) => {
          const b = trouverLutteur(adversairesDe(n.id)[PAR_NATION - 1]);
          return `<button class="boss" data-boss="${n.id}">${drapeauSVG(n.id)}<span><b>${echap(b.nom)}</b><small>${echap(n.nom)}${possede(S.collection, b.id) ? ' · carte obtenue' : ''}</small></span></button>`;
        }).join('')}</div></section>`
    : '';
  if (!e.nation) {
    return `<section class="bloc arene-nation"><h2>🏆 Carrière terminée !</h2><p>Tu as battu les ${nationsArene().length} nations. Réaffronte leurs boss pour gagner leur carte.</p></section>${boss}`;
  }
  const ids = adversairesDe(e.nation.id);
  const etapes = ids.map((id, i) => {
    const l = trouverLutteur(id);
    const etat = i < e.rang ? 'battu' : i === e.rang ? 'actuel' : 'a-venir';
    return `<li class="etape-arene ${etat}"><span class="vignette">${i <= e.rang ? portrait(l) : '<span class="mystere">?</span>'}</span>
      <small>${i === PAR_NATION - 1 ? 'Boss' : `${i + 1}`}</small></li>`;
  }).join('');
  const adv = trouverLutteur(e.adversaire!);
  return `
    <section class="bloc arene-nation">
      <div class="arene-titre">${drapeauSVG(e.nation.id)}<h2>${echap(e.nation.nom)}</h2><small>Nation ${nationsArene().indexOf(e.nation) + 1}/${nationsArene().length}</small></div>
      <ol class="etapes-arene">${etapes}</ol>
      <p class="prochain">${e.rang === PAR_NATION - 1 ? '👑 Boss : ' : 'Adversaire : '}<b>${echap(adv.nom)}</b> · ${NOM_RARETE[adv.rarete]} · ordinateur ${NOM_NIVEAU[e.niveau].toLowerCase()}</p>
      <p class="note">Bats les 5 lutteurs pour gagner 2 ou 3 boosters et ${R_.arene.medaillesParNation} médailles (+1 médaille par victoire). Le boss : 1 chance sur 3 de gagner sa carte. Choisis ton lutteur ci-dessous.</p>
    </section>
    ${boss}`;
}


export function ecranArene(rapide = false) {
  S.partie = null;
  // Format et durée pas encore ouverts par le mode histoire : on revient au réglage simple.
  if (!fonctionVisible(S.collection, 'enchainement')) S.enchainementChoisi = false;
  if (!fonctionVisible(S.collection, 'infini')) S.infiniChoisi = false;
  const miens = [...(DEV ? [LUTTEUR_TEST] : []), ...CARTES.filter((l) => possede(S.collection, l.id))]; // + Cocoach, lutteur de test (mode développeur)
  // Adversaire du combat auto : connu en Carrière et contre Cocoach ; au hasard (parmi les battus à la main) sinon.
  const advListe: string | null = rapide ? (S.infiniChoisi ? ID_RIVAL : null) : S.bossChoisi ? adversairesDe(S.bossChoisi)[PAR_NATION - 1] : etapeArene(S.collection).adversaire ?? '';
  const cartes = miens.map((l) => {
    const boutons = `
      <button class="principal cl-choisir" data-lutteur="${l.id}">Lutter avec ${echap(l.nom)}</button>
      ${boutonAuto('data-lutteur-auto', l.id, advListe)}
      <button class="secondaire cl-deck" data-deck="${l.id}">Régler les actions${deckDe(S.collection, l.id) ? ' (perso)' : ''}</button>`;
    return `<div class="emplacement" data-nation="${l.nation}">${carteJoueur(l, boutons)}</div>`;
  }).join('');
  const nations = NATIONS.filter((n) => miens.some((l) => l.nation === n.id));
  const puces = nations.map((n) => `<button class="puce" data-aller="${n.id}">${n.nom}</button>`).join('');
  app.innerHTML = `
    <main class="choix">
      ${rapide
        ? `${enTete('Entraînement', `Ordinateur ${niveauOrdi(S.collection.niveau)} · l'adversaire est tiré au hasard parmi les ${LUTTEURS.length} lutteurs.`, '#combat')}
           <div class="marge">${choixNiveau(S.collection.niveau, fonctionVisible(S.collection, 'fort'))}
             ${reglagesStyle('solo', S.enchainementChoisi ? 'enchainement' : 'normal', S.infiniChoisi ? 'infinie' : 'normale', [['normale', 'Normale', 'Une période'], ['infinie', 'Infinie', 'Jusqu\'au tombé contre Cocoach']])}
             ${encartRival()}
             <div class="tutos-ligne">${boutonTuto('combos')}${boutonTuto('enchainement')}${boutonTuto('infini')}</div></div>`
        : `${enTete('Carrière', 'Bats les nations une à une.', '#combat')}<div class="marge">${blocArene()}<div class="tutos-ligne">${boutonTuto('arene')}</div></div>`}
      ${S.collection.bonusTutoriel && !rapide ? '<p class="bandeau-bonus marge">Bonus du tutoriel : 2 boosters en plus si tu gagnes ce combat.</p>' : ''}
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
  const lutter = (id: string, auto: boolean) => {
    if (!rapide) return lancerArene(id, auto);
    const autres = LUTTEURS.filter((l) => l.id !== id);
    // En auto (hors Cocoach), l'adversaire est tiré parmi les lutteurs déjà battus à la main.
    const ordi = (auto && !S.infiniChoisi ? adversaireAuto(S.collection, Math.random, (x) => x === id) : null) ?? autres[Math.floor(Math.random() * autres.length)].id;
    lancer(id, ordi, nouvelleGraine(), rapide, S.collection.niveau, auto);
  };
  app.querySelectorAll<HTMLButtonElement>('[data-lutteur]').forEach((b) => b.addEventListener('click', () => lutter(b.dataset.lutteur!, false)));
  app.querySelectorAll<HTMLButtonElement>('[data-lutteur-auto]').forEach((b) => b.addEventListener('click', () => lutter(b.dataset.lutteurAuto!, true)));
  app.querySelectorAll<HTMLButtonElement>('[data-niveau]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = b.dataset.niveau;
      S.collection.niveau = n === 'fort' || n === 'facile' ? n : 'normal';
      sauver(S.collection);
      ecranArene(rapide);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-boss]').forEach((b) =>
    b.addEventListener('click', () => { S.bossChoisi = b.dataset.boss!; ecranArene(); }),
  );
  brancherStyle('solo', (cle, v) => {
    if (cle === 'format') { S.enchainementChoisi = v === 'enchainement'; if (S.enchainementChoisi) tutoAuto('enchainement'); }
    else { S.infiniChoisi = v === 'infinie'; ecranArene(true); if (S.infiniChoisi) tutoAuto('infini'); } // l'adversaire change (Cocoach) : boutons auto à jour
  });
  brancherTutos();
  app.querySelector('[data-annuler-boss]')?.addEventListener('click', () => { S.bossChoisi = null; ecranArene(); });
  if (areneTerminee(S.collection) && !S.bossChoisi && !rapide) app.querySelector('.defile')?.closest('main')?.classList.add('arene-finie');
  activerReflets(app);
  window.scrollTo(0, 0);
  tutoAuto(rapide ? 'combos' : 'arene');
}
