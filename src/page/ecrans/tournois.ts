import { sonFin } from '../son';
// Tournois (individuel, par équipe, compétitions de la saison).

import { gagnerPoints } from '../classement';
import { LUTTEUR_TEST, NATIONS, avecBonus, bonusNation, trouverLutteur, REGLES as R_ } from '../../moteur';
import { Partie } from '../partie';
import { NOM_RARETE, activerReflets } from '../carte';
import { niveauClub, possede, sauver } from '../collection';
import { NOM_MATCH, avancer, creerTournoiEquipe, enregistrer, enregistrerDuel, equipeFinie, finie, gagnerCombatTournoi, payerInscription, places, prochainDuel, recompenserTournoi, scoreEquipe, avancerI, creerIndividuel, niveauMatchI, enregistrerI, exemptes, exemption, finieI, nombreParticipants, placesI, joueurInvaincu, type CleMatch, type Competition, type Individuel, type MatchI, type Tournoi, type TournoiEquipe } from '../tournoi';
import { DEV } from '../dev';
import { ICONE_MEDAILLE, defJoueur, niveauDe, porteMonnaie } from './accueil';
import { miniCarteLutteur } from './club';
import { cartes as toutesLesCartes } from './collection';
import { boutonAuto, demarrer, htmlTourAncien, texteAuto } from './combat';
import { S, app, echap, enTete, nouvelleGraine, portrait } from './commun';
import { revelerPaquet, sectionPaquet } from './fin';
import { histoire, quete, queteCombat, saison } from './progression';
import { boutonTuto, brancherTutos, tutoAuto } from './tutos-courts';
import { boutonPartage, brancherPartage, type Moment } from '../partage';
import { PALIERS } from '../saison';

// ---------- Tournois ----------

export const CLE_TOURNOI = 'wbc-tournoi-v1';

export function chargerTournoi(): Tournoi | null {
  try {
    const t = JSON.parse(localStorage.getItem(CLE_TOURNOI) ?? 'null');
    return t && (t.type === 'individuel' || t.type === 'competition' || t.type === 'equipe') ? t : null;
  } catch {
    return null;
  }
}

export function sauverTournoi() {
  try {
    if (S.tournoi) localStorage.setItem(CLE_TOURNOI, JSON.stringify(S.tournoi));
    else localStorage.removeItem(CLE_TOURNOI);
  } catch { /* stockage indisponible : le tournoi vit seulement dans cette page */ }
}

// Bonus de nation d'une équipe, en clair.
export function texteBonusNation(ids: string[]): string {
  const b = bonusNation(ids);
  if (!b.bonus) return `aucun (il faut ${Object.keys(R_.tournoi.equipe.bonusNation)[0]} lutteurs d'une même nation)`;
  const nom = NATIONS.find((n) => n.id === b.nation)?.nom ?? '';
  return `<b>+${Math.round(b.bonus * 100)} %</b> sur les statistiques de toute l'équipe (${b.nombre} lutteurs ${nom === 'USA' ? 'des USA' : `de ${nom}`})`;
}

// La carte de mes lutteurs (avec fusion et deck) ; celles de l'ordinateur sont les cartes de base.
export const defTournoi = (id: string, moi: boolean) => (moi ? defJoueur(trouverLutteur(id)) : trouverLutteur(id));

export function ecranTournois(message = '') {
  S.partie = null;
  const C = R_.tournoi.individuel;
  const Q = R_.tournoi.equipe;
  const niv = niveauClub(S.collection);
  const equipeOk = niv >= R_.club.niveauTournoiEquipe && S.collection.club.length >= Q.duels;
  const enCours = S.tournoi && !S.tournoi.recompense;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournois', 'Inscription en $, médailles à chaque combat gagné.')}
      ${porteMonnaie()}
      ${message}
      ${enCours ? `<section class="bloc reprise-tournoi"><h2>Tournoi en cours</h2><p>${NOM_TOURNOI[S.tournoi!.type]} : reprends là où tu t'es arrêté.</p><button class="principal" data-reprendre-tournoi>Reprendre</button></section>` : ''}
      <section class="bloc">
        <h2>Tournoi individuel <small>${C.inscription} $</small></h2>
        <p>Ton lutteur contre ${C.minimum - 1} à ${C.maximum - 1} adversaires, en double tableau : tu avances tant que tu gagnes ; une première défaite avant les 1/2 finales t'envoie dans le tableau des perdants ; une deuxième t'élimine. +${R_.tournoi.medaillesParCombatGagne} médaille par combat gagné.</p>
        <ul class="liste-regles gains">
          <li>🥇 1er : ${C.medailles[1]} médailles, ${C.dollars[1]} $ et un booster épique</li>
          <li>🥈 2e : ${C.medailles[2]} médailles et ${C.dollars[2]} $</li>
          <li>🥉 3e : ${C.medailles[3]} médailles et ${C.dollars[3]} $</li>
        </ul>
        <button class="principal" data-individuel ${enCours ? 'disabled' : ''}>Contre l'ordinateur</button>
        <button class="secondaire" disabled>En ligne · bientôt</button>
        ${boutonTuto('individuel')}
      </section>
      <section class="bloc">
        <h2>Tournoi par équipe <small>${Q.inscription} $</small></h2>
        <p>Tes 5 lutteurs de Mon Club contre 5 lutteurs d'un club adverse, un duel chacun. La première équipe à ${Q.victoiresPourGagner} victoires gagne : ${Q.medailles} médailles, ${Q.dollars} $ et un booster épique.</p>
        ${equipeOk ? '' : `<p class="alerte-douce">🔒 Il faut Mon Club au niveau ${R_.club.niveauTournoiEquipe} avec ${Q.duels} lutteurs (niveau actuel : ${niv || 'fermé'}, ${S.collection.club.length} lutteur${S.collection.club.length > 1 ? 's' : ''}).</p>`}
        <button class="principal" data-equipe ${equipeOk && !enCours ? '' : 'disabled'}>Contre l'ordinateur</button>
        <button class="secondaire" disabled>En ligne · bientôt</button>
        ${boutonTuto('equipe', false)}
      </section>
    </main>`;
  brancherTutos();
  app.querySelector('[data-reprendre-tournoi]')?.addEventListener('click', ecranTournoiEnCours);
  app.querySelector('[data-individuel]')?.addEventListener('click', () => ecranInscriptionIndividuel(R_.tournoi.individuel.parDefaut));
  app.querySelector('[data-equipe]')?.addEventListener('click', () => ecranInscriptionEquipe([...S.collection.club]));
  window.scrollTo(0, 0);
  if (!S.collection.tutosVus.includes('individuel')) tutoAuto('individuel'); else tutoAuto('equipe');
}

export const NOM_TOURNOI: Record<Tournoi['type'], string> = { individuel: 'Tournoi individuel', competition: 'Compétition', equipe: 'Tournoi par équipe' };

export function ecranInscriptionIndividuel(nombre: number) {
  const C = R_.tournoi.individuel;
  const n = nombreParticipants(nombre);
  const miens = [...(DEV ? [LUTTEUR_TEST] : []), ...toutesLesCartes().filter((l) => possede(S.collection, l.id))]; // + Cocoach, lutteur de test (mode développeur)
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi individuel', `Inscription ${C.inscription} $ (tu as ${S.collection.dollars} $)`, '#tournois')}
      <section class="bloc nombre-participants">
        <h2>Participants</h2>
        <div class="compteur">
          <button class="rond" data-moins ${n <= C.minimum ? 'disabled' : ''} aria-label="Un participant de moins">−</button>
          <b>${n}</b>
          <button class="rond" data-plus ${n >= C.maximum ? 'disabled' : ''} aria-label="Un participant de plus">+</button>
        </div>
        <p class="note">Toi et ${n - 1} lutteurs de l'ordinateur, de ${C.minimum} à ${C.maximum}. ${n === 8 ? 'Pas d\'exemption.' : `${(n <= 8 ? 8 : 16) - n} lutteur${(n <= 8 ? 8 : 16) - n > 1 ? 's' : ''} tiré${(n <= 8 ? 8 : 16) - n > 1 ? 's' : ''} au sort passe${(n <= 8 ? 8 : 16) - n > 1 ? 'nt' : ''} directement au tour suivant (exemption).`}</p>
      </section>
      <section class="bloc"><h2>Choisis ton lutteur</h2></section>
      <div class="liste-recrues marge">${miens.map((l) => `<button data-inscrire="${l.id}" aria-label="Inscrire ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>
    </main>`;
  app.querySelector('[data-moins]')?.addEventListener('click', () => ecranInscriptionIndividuel(n - 1));
  app.querySelector('[data-plus]')?.addEventListener('click', () => ecranInscriptionIndividuel(n + 1));
  app.querySelectorAll<HTMLButtonElement>('[data-inscrire]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = payerInscription(S.collection, 'individuel');
      if (erreur) return ecranTournois(`<p class="alerte">${echap(erreur)}</p>`);
      S.tournoi = creerIndividuel(b.dataset.inscrire!, n, nouvelleGraine());
      S.paquetTournoi = null;
      sauver(S.collection);
      sauverTournoi();
      ecranTournoiEnCours();
    }),
  );
}

export function ecranInscriptionEquipe(ordre: string[]) {
  const n = R_.tournoi.equipe.duels;
  const dernier = ordre.length - 1;
  const liste = ordre.map((id, i) => {
    const l = trouverLutteur(id);
    return `<li class="ordre-ligne"><span class="ordre-n">${i + 1}</span><span class="vignette">${portrait(l, niveauDe(id))}</span>
      <span class="ordre-nom"><b>${echap(l.nom)}</b><small>${echap(l.origine)} · ${NOM_RARETE[niveauDe(id)]}</small></span>
      <button class="rond" data-monter="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
      <button class="rond" data-descendre="${i}" ${i === dernier ? 'disabled' : ''} aria-label="Descendre">↓</button></li>${i === n - 1 && dernier > i ? '<li class="ordre-separation">Remplaçants : ils ne combattent pas. Fais-en monter un pour l\'aligner.</li>' : ''}`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi par équipe', `Ordre des duels · inscription ${R_.tournoi.equipe.inscription} $ (tu as ${S.collection.dollars} $)`, '#tournois')}
      <section class="bloc"><p>Ton lutteur n°1 affronte leur n°1, etc. Place tes meilleurs où tu veux.</p>
        <p class="bonus-nation">🚩 Bonus de nation : ${texteBonusNation(ordre.slice(0, n))}</p>
        <p class="note">3 lutteurs d'une même nation : +5 % · 4 : +7 % · 5 : +10 %, pour toute l'équipe. Compose ton équipe dans Mon Club.</p>
        <ol class="ordre-liste">${liste}</ol>
        <button class="principal" data-valider-equipe>Inscrire mon équipe</button></section>
    </main>`;
  const echanger = (i: number, j: number) => {
    const o = [...ordre];
    [o[i], o[j]] = [o[j], o[i]];
    ecranInscriptionEquipe(o);
  };
  app.querySelectorAll<HTMLButtonElement>('[data-monter]').forEach((b) => b.addEventListener('click', () => echanger(Number(b.dataset.monter), Number(b.dataset.monter) - 1)));
  app.querySelectorAll<HTMLButtonElement>('[data-descendre]').forEach((b) => b.addEventListener('click', () => echanger(Number(b.dataset.descendre), Number(b.dataset.descendre) + 1)));
  app.querySelector('[data-valider-equipe]')!.addEventListener('click', () => {
    const erreur = payerInscription(S.collection, 'equipe');
    if (erreur) return ecranTournois(`<p class="alerte">${echap(erreur)}</p>`);
    S.tournoi = creerTournoiEquipe(ordre.slice(0, n), nouvelleGraine());
    S.paquetTournoi = null;
    sauver(S.collection);
    sauverTournoi();
    ecranTournoiEnCours();
  });
  window.scrollTo(0, 0);
}

export function ecranTournoiEnCours() {
  S.partie = null;
  if (!S.tournoi) return ecranTournois();
  if (S.tournoi.type === 'individuel') return ecranIndividuel(S.tournoi);
  if (S.tournoi.type === 'competition') return ecranCompetition(S.tournoi);
  return ecranEquipe(S.tournoi);
}

// Gains de fin : donnés une seule fois, puis montrés dans un booster.
export function sectionFinTournoi(t: Tournoi, titre: string): string {
  if ('essai' in t && t.essai) {
    if (!t.recompense) { t.recompense = []; sauverTournoi(); }
    return '<section class="booster"><p>Tournoi d\'essai terminé : pas de gain. Inscris-toi pour de vrai dans Tournois !</p></section>';
  }
  if (!S.paquetTournoi) {
    const premiereFois = !t.recompense;
    const boosters = recompenserTournoi(S.collection, t, Math.random);
    if (premiereFois && t.type === 'individuel') histoire({ type: 'tournoiIndividuel', place: placesI(t).get(0) ?? 99, invaincu: joueurInvaincu(t) });
    if (premiereFois && t.type === 'individuel') quete({ type: 'tournoi', place: placesI(t).get(0) ?? 99 });
    if (premiereFois && t.type === 'individuel' && t.saison !== undefined) saison({ type: 'competition', palier: t.saison, place: placesI(t).get(0) ?? 99 });
    if (premiereFois && t.type === 'equipe') histoire({ type: 'tournoiEquipe', gagne: scoreEquipe(t)[0] >= R_.tournoi.equipe.victoiresPourGagner });
    sauver(S.collection);
    sauverTournoi();
    S.paquetTournoi = boosters.length ? { titre, boosters, ouvert: false } : null;
  }
  return S.paquetTournoi ? sectionPaquet(S.paquetTournoi) : '<section class="booster"><p>Pas de gain cette fois. Retente ta chance !</p></section>';
}

export const textePlace = (pl: number) => (pl === 1 ? '🥇' : pl === 2 ? '🥈' : pl === 3 ? '🥉' : `${pl}e`);

// Moment à partager en fin de tournoi individuel (ou de compétition de la saison) : un podium, un
// titre, et la médaille d'or olympique. Pas pour un tournoi d'essai.
function momentTournoi(t: Individuel, place: number | undefined): Moment | null {
  if (!place || place > 3 || ('essai' in t && t.essai)) return null;
  const nom = t.nom ?? 'Tournoi individuel';
  const jo = t.saison !== undefined && PALIERS[t.saison]?.nom === 'Jeux Olympiques';
  const titre = jo && place === 1 ? 'OR OLYMPIQUE !' : place === 1 ? 'CHAMPION !' : 'PODIUM !';
  const rang = place === 1 ? '1er' : `${place}e`;
  const def = defJoueur(trouverLutteur(t.lutteurs[0]));
  return {
    titre, sousTitre: `${rang} : ${nom}`, def, coach: S.collection.coach || 'Toi',
    texte: `${jo && place === 1 ? 'Médaille d\'or aux Jeux Olympiques' : `${rang} au ${nom}`} avec ${def.nom} ! Viens jouer à Wrestling Battle Card :`,
  };
}

export function ecranIndividuel(t: Individuel) {
  const prochain = avancerI(t, (i) => defTournoi(t.lutteurs[i], i === 0), S.collection.niveau);
  sauverTournoi();
  const nom = (i: number | null) => (i === null ? '…' : i === 0 ? `<b class="moi">${echap(trouverLutteur(t.lutteurs[0]).nom)}</b>` : echap(trouverLutteur(t.lutteurs[i]).nom));
  const ligne = (m: MatchI) => {
    const k = t.matchs.indexOf(m);
    const v = m.vainqueur;
    const cote = (i: number | null) => `<span class="${v !== null ? (v === i ? 'gagnant' : 'perdant') : ''}">${nom(i)}</span>`;
    return `<li class="match ${m.a === 0 || m.b === 0 ? 'avec-moi' : ''} ${k === prochain ? 'prochain' : ''}">
      <small>${echap(nomMatch(m))}</small>${cote(m.a)}<i>contre</i>${cote(m.b)}${m.detail ? `<small class="detail">${echap(m.detail)}</small>` : ''}</li>`;
  };
  const visibles = (tab: MatchI['tableau']) => t.matchs.filter((m) => m.tableau === tab && !exemption(m));
  const ex = exemptes(t);
  const fin = finieI(t);
  const p = placesI(t);
  const maPlace = p.get(0);
  const classement = fin ? `<section class="bloc"><h2>Classement</h2><ol class="classement">${[...p.entries()].sort((x, y) => x[1] - y[1]).map(([i, pl]) => `<li class="${i === 0 ? 'moi' : ''}"><span class="place p${pl}">${textePlace(pl)}</span>${nom(i)}</li>`).join('')}</ol></section>` : '';
  const m = prochain !== null ? t.matchs[prochain] : null;
  const adversaire = m ? (m.a === 0 ? m.b : m.a) : null;
  // Tours du tableau des perdants renumérotés : un tour réglé seulement par des exemptions n'apparaît pas.
  const perdants = visibles('perdants');
  const toursP = [...new Set(perdants.map((x) => x.tour))].sort((x, y) => x - y);
  const nomMatch = (x: MatchI) => (x.tableau === 'perdants' && x.nom.startsWith('Tableau') ? `Tableau des perdants, tour ${toursP.indexOf(x.tour) + 1}` : x.nom);
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(t.nom ?? 'Tournoi individuel', fin ? `Terminé : tu finis ${maPlace === 1 ? '1er' : `${maPlace}e`}` : `${t.lutteurs.length} lutteurs · ton lutteur : ${echap(trouverLutteur(t.lutteurs[0]).nom)}`, '#tournois')}
      ${m ? `<section class="bloc prochain-combat"><h2>${echap(nomMatch(m))}</h2><p>${nom(0)} contre ${nom(adversaire)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto', '', t.lutteurs[adversaire!])}</section>` : ''}
      ${fin ? sectionFinTournoi(t, maPlace === 1 ? 'Tournoi individuel gagné' : 'Tournoi individuel') : ''}
      ${fin && momentTournoi(t, maPlace) ? `<div class="marge">${boutonPartage('Partager ce moment')}</div>` : ''}
      ${classement}
      <section class="bloc tableau-tournoi"><h2>Tableau principal</h2>
        ${ex.length ? `<p class="note">Exempté${ex.length > 1 ? 's' : ''} du premier tour : ${ex.map(nom).join(', ')}</p>` : ''}
        <ul class="matchs">${visibles('principal').map(ligne).join('')}</ul></section>
      <section class="bloc tableau-tournoi perdants"><h2>Tableau des perdants</h2>
        <p class="note">Une première défaite avant les 1/2 finales mène ici (côté A pour le haut du tableau, côté B pour le bas) ; une deuxième élimine. Le vainqueur de chaque côté affronte le perdant de la 1/2 finale opposée pour aller en petite finale : au mieux 3e.</p>
        <ul class="matchs">${perdants.length ? perdants.map(ligne).join('') : '<li class="match"><small>En attente des premiers perdants</small></li>'}</ul></section>
      <section class="bloc"><h2>Finales</h2><ul class="matchs">${visibles('finales').map(ligne).join('')}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  brancherPartage(app, () => momentTournoi(t, maPlace));
  app.querySelector('[data-combattre]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.lutteurs[0], t.lutteurs[adversaire!]));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.lutteurs[0], t.lutteurs[adversaire!], true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

export function ecranCompetition(c: Competition) {
  const prochain = avancer(c, (i) => defTournoi(c.lutteurs[i], i === 0), S.collection.niveau);
  sauverTournoi();
  const nom = (i: number | null) => (i === null ? '…' : i === 0 ? `<b class="moi">${echap(trouverLutteur(c.lutteurs[0]).nom)}</b>` : echap(trouverLutteur(c.lutteurs[i]).nom));
  const ligne = (k: CleMatch) => {
    const m = c.matchs[k];
    const v = m.vainqueur;
    const cote = (i: number | null) => `<span class="${v !== null ? (v === i ? 'gagnant' : 'perdant') : ''}">${nom(i)}</span>`;
    return `<li class="match ${m.a === 0 || m.b === 0 ? 'avec-moi' : ''} ${k === prochain ? 'prochain' : ''}">
      <small>${NOM_MATCH[k]}</small>${cote(m.a)}<i>contre</i>${cote(m.b)}${m.detail ? `<small class="detail">${echap(m.detail)}</small>` : ''}</li>`;
  };
  const tableau = (t: 0 | 1) => `
    <section class="bloc tableau-tournoi"><h2>Tableau ${t === 0 ? 'A' : 'B'}</h2>
      <p class="note">Qualifié d'office pour la 1/2 finale : ${nom(c.tableaux[t][0])}</p>
      <ul class="matchs">${ligne(t === 0 ? 'QA' : 'QB')}${ligne(t === 0 ? 'SA' : 'SB')}</ul></section>`;
  const fin = finie(c);
  const p = places(c);
  const classement = fin ? `<section class="bloc"><h2>Classement</h2><ol class="classement">${[...p.entries()].sort((x, y) => x[1] - y[1]).map(([i, pl]) => `<li class="${i === 0 ? 'moi' : ''}"><span class="place p${pl}">${pl === 1 ? '🥇' : pl === 2 ? '🥈' : pl === 3 ? '🥉' : `${pl}e`}</span>${nom(i)}</li>`).join('')}</ol></section>` : '';
  const maPlace = p.get(0);
  const adversaire = prochain ? (c.matchs[prochain].a === 0 ? c.matchs[prochain].b : c.matchs[prochain].a) : null;
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Compétition', fin ? `Terminé : tu finis ${maPlace === 1 ? '1er' : `${maPlace}e`}` : `Ton lutteur : ${echap(trouverLutteur(c.lutteurs[0]).nom)}`, '#tournois')}
      ${prochain ? `<section class="bloc prochain-combat"><h2>${NOM_MATCH[prochain]}</h2><p>${nom(0)} contre ${nom(adversaire)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto', '', c.lutteurs[adversaire!])}</section>` : ''}
      ${fin ? sectionFinTournoi(c, maPlace === 1 ? 'Compétition gagnée' : 'Compétition') : ''}
      ${classement}
      ${tableau(0)}${tableau(1)}
      <section class="bloc"><h2>Repêchage et finales</h2><ul class="matchs">${(['R1', 'R2', 'F', 'R3'] as CleMatch[]).map(ligne).join('')}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  const combattre = (auto: boolean) => {
    const m = c.matchs[prochain!];
    lancerCombatTournoi(prochain!, c.lutteurs[0], c.lutteurs[m.a === 0 ? m.b! : m.a!], auto);
  };
  app.querySelector('[data-combattre]')?.addEventListener('click', () => combattre(false));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => combattre(true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

export function ecranEquipe(t: TournoiEquipe) {
  const [moi, eux] = scoreEquipe(t);
  const prochain = prochainDuel(t);
  const fin = equipeFinie(t);
  const gagne = moi > eux;
  const duels = t.mes.map((id, i) => {
    const r = t.resultats[i];
    const a = trouverLutteur(id), b = trouverLutteur(t.leurs[i]);
    return `<li class="match avec-moi ${i === prochain ? 'prochain' : ''}"><small>Duel ${i + 1}</small>
      <span class="${r === true ? 'gagnant' : r === false ? 'perdant' : ''}"><b class="moi">${echap(a.nom)}</b></span><i>contre</i>
      <span class="${r === false ? 'gagnant' : r === true ? 'perdant' : ''}">${echap(b.nom)}</span>
      ${t.details[i] ? `<small class="detail">${echap(t.details[i])}</small>` : r === null && fin ? '<small class="detail">Pas joué</small>' : ''}</li>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Tournoi par équipe', `Club de ${echap(S.collection.coach ?? '')} contre ${echap(t.nomAdverse)}`, '#tournois')}
      <section class="bloc score-equipe"><span>${moi}</span><i>–</i><span>${eux}</span></section>
      <section class="bloc"><p class="bonus-nation">🚩 Ton bonus de nation : ${texteBonusNation(t.mes)}</p>
        <p class="bonus-nation adverse">🚩 ${echap(t.nomAdverse)} : ${texteBonusNation(t.leurs)}</p></section>
      ${prochain !== null ? `<section class="bloc prochain-combat"><h2>Duel ${prochain + 1}</h2><p><b class="moi">${echap(trouverLutteur(t.mes[prochain]).nom)}</b> contre ${echap(trouverLutteur(t.leurs[prochain]).nom)}</p><button class="principal" data-combattre>Combattre</button>${boutonAuto('data-combattre-auto', '', t.leurs[prochain])}</section>` : ''}
      ${fin ? sectionFinTournoi(t, gagne ? 'Tournoi par équipe gagné' : 'Tournoi par équipe') : ''}
      <section class="bloc"><h2>Les duels</h2><ul class="matchs">${duels}</ul></section>
      ${fin ? '<button class="principal marge" data-terminer>Terminer</button>' : '<button class="lien marge" data-abandonner-tournoi>Abandonner le tournoi</button>'}
    </main>`;
  activerReflets(app);
  app.querySelector('[data-combattre]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.mes[prochain!], t.leurs[prochain!]));
  app.querySelector('[data-combattre-auto]')?.addEventListener('click', () => lancerCombatTournoi(prochain!, t.mes[prochain!], t.leurs[prochain!], true));
  brancherFinTournoi();
  window.scrollTo(0, 0);
}

export function allerAuxTournois() {
  if (location.hash === '#tournois') ecranTournois();
  else location.hash = '#tournois';
}

export function brancherFinTournoi() {
  app.querySelector('[data-ouvrir-paquet]')?.addEventListener('click', () => S.paquetTournoi && revelerPaquet(S.paquetTournoi, ecranTournoiEnCours));
  app.querySelector('[data-terminer]')?.addEventListener('click', () => {
    S.tournoi = null;
    S.paquetTournoi = null;
    sauverTournoi();
    allerAuxTournois();
  });
  const ab = app.querySelector<HTMLButtonElement>('[data-abandonner-tournoi]');
  ab?.addEventListener('click', () => {
    if (!ab.dataset.confirme) {
      ab.dataset.confirme = '1';
      ab.textContent = 'Appuie encore : l\'inscription est perdue (les médailles gagnées restent)';
      return;
    }
    S.tournoi = null;
    S.paquetTournoi = null;
    sauverTournoi();
    allerAuxTournois();
  });
}

export function lancerCombatTournoi(cle: CleMatch | number, idMoi: string, idLui: string, auto = false) {
  if (location.hash) history.replaceState(null, '', location.pathname);
  S.mode = 'solo';
  S.HUMAIN = 0;
  S.ORDI = 1;
  // Tournoi par équipe : le bonus de nation de chaque équipe s'applique à ses lutteurs.
  const equipe = S.tournoi?.type === 'equipe' ? S.tournoi : null;
  const bMoi = equipe ? bonusNation(equipe.mes).bonus : 0;
  const bLui = equipe ? bonusNation(equipe.leurs).bonus : 0;
  S.bonusEnCours = equipe ? { moi: bMoi, lui: bLui } : null;
  const niveau = S.tournoi?.type === 'individuel' && typeof cle === 'number' ? niveauMatchI(S.tournoi, cle, S.collection.niveau) : S.collection.niveau;
  S.partie = new Partie(idMoi, idLui, nouvelleGraine(), niveau, avecBonus(defTournoi(idMoi, true), bMoi), [], false, avecBonus(defTournoi(idLui, false), bLui));
  S.tours = [];
  S.scoresPeriodes = [];
  S.enAttente = false;
  S.endurancesAvant = null;
  S.recompenseDonnee = true; // pas de récompense d'arène
  S.tuto = false;
  S.enTournoi = cle;
  S.interclubEnCours = false;
  demarrer(auto);
}

// Fin d'un combat du joueur dans un tournoi : on note le résultat, +1 médaille s'il gagne.
export function finCombatTournoi(abandon: boolean) {
  const cle = S.enTournoi;
  S.enTournoi = null;
  S.bonusEnCours = null;
  if (!S.partie || !S.tournoi || cle === null) return ecranTournois();
  const e = S.partie.etat;
  const gagne = !abandon && e.vainqueur === S.HUMAIN;
  if (!abandon) sonFin(`tournoi-${S.partie.debut}`, gagne, e.finPar === 'tombe');
  const essaiT = 'essai' in S.tournoi && !!S.tournoi.essai;
  if (!abandon && !essaiT) queteCombat(e, S.tournoi.type === 'equipe' ? 'equipe' : 'tournoi', S.partie.niveau);
  const detail = abandon ? 'par abandon' : e.finPar === 'tombe' ? 'par tombé'
    : `${Math.max(e.joueurs[0].periodesGagnees, e.joueurs[1].periodesGagnees)} périodes à ${Math.min(e.joueurs[0].periodesGagnees, e.joueurs[1].periodesGagnees)}`;
  if (S.tournoi.type === 'individuel' && typeof cle === 'number') {
    const m = S.tournoi.matchs[cle];
    enregistrerI(S.tournoi, cle, gagne ? 0 : (m.a === 0 ? m.b! : m.a!), detail);
  } else if (S.tournoi.type === 'competition' && typeof cle === 'string') {
    const m = S.tournoi.matchs[cle];
    const lui = m.a === 0 ? m.b! : m.a!;
    enregistrer(S.tournoi, cle, gagne ? 0 : lui, detail);
  } else if (S.tournoi.type === 'equipe' && typeof cle === 'number') {
    enregistrerDuel(S.tournoi, cle, gagne, detail);
  }
  if (gagne && !essaiT) {
    gagnerCombatTournoi(S.collection, S.tournoi);
    gagnerPoints(S.collection, { niveau: S.partie.niveau, tombe: e.finPar === 'tombe' });
    histoire({ type: 'victoire', nation: trouverLutteur(S.partie.idOrdi).nation, niveau: S.partie.niveau, auto: S.combatEnAuto });
  }
  sauver(S.collection);
  sauverTournoi();
  const lutteur = e.joueurs[gagne ? S.HUMAIN : S.ORDI].def;
  const anciens = S.tours.slice().reverse().map((t) => htmlTourAncien(t, e)).join('');
  S.partie = null;
  app.innerHTML = `
    <main class="fin">
      <section class="verdict ${gagne ? 'rouge' : 'bleu'}">
        <div class="rayons" aria-hidden="true"></div>
        <div class="verdict-portrait">${portrait(lutteur)}</div>
        <h1 class="onomato ${gagne ? 'rouge' : 'bleu'}">${gagne ? 'VICTOIRE !' : 'DÉFAITE…'}</h1>
        <p>${echap(lutteur.nom)} gagne ${detail}.</p>
        ${S.combatEnAuto ? `<p class="hist">${texteAuto()}</p>` : ''}
        ${gagne ? `<p class="recap-gains">${ICONE_MEDAILLE}<b>+${R_.tournoi.medaillesParCombatGagne} médaille</b></p>` : ''}
      </section>
      <div class="fin-boutons"><button class="principal" data-suite-tournoi>Voir le tournoi</button></div>
      ${anciens ? `<section class="journal"><h2>Le combat tour par tour</h2>${anciens}</section>` : ''}
    </main>`;
  app.querySelector('[data-suite-tournoi]')!.addEventListener('click', ecranTournoiEnCours);
  window.scrollTo(0, 0);
}
