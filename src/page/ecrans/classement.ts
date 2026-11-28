import { blocInvitation, brancherInvitation } from './parrainage';
// Écran « Classement » (27/11/2026) : division de la saison (28/11/2026), points du mois, et trois classements (tous les joueurs,
// mes amis, mon pays). Sans compte : explication et bouton pour créer son compte (les points du mois
// comptent déjà). Fin de saison : récompense de la division, cadre de saison et Top 10.

import { REGLES } from '../../moteur';
import {
  DIVISIONS, PAYS, badgeDe, cloturerMois, dansLeTop, drapeau, estMaitre, joursRestants, lireClassement, majPeriode, nomDivision, nomMois,
  numeroSaison, programmerPublication, type Resultat, type Vue,
} from '../classement';
import { sauver } from '../collection';
import { compteActuel } from '../compte';
import { S, app, echap, enTete } from './commun';
import { fenetreCompte } from './compte';
import { annoncer, mettreEnBoite } from './progression';

const R = REGLES.classement;
let vue: Vue = 'monde';
export const ICONE_DIVISION: Record<string, string> = { bronze: '🥉', argent: '🥈', or: '🥇', platine: '💠', diamant: '💎', maitre: '👑', top: '🏆' };

// Petit badge à côté d'un pseudo : 🏆 Top 10, ou la division de la saison dernière.
export function pastilleBadge(badge: string): string {
  if (!ICONE_DIVISION[badge]) return '';
  const titre = badge === 'top' ? 'Top 10 de la saison dernière' : `Division ${nomDivision(badge)} la saison dernière`;
  return `<span class="badge-classement" title="${titre}" aria-label="${titre}">${ICONE_DIVISION[badge]}</span>`;
}
export const pastilleMonBadge = () => pastilleBadge(badgeDe(S.collection));

// Au lancement : nouvelle saison ? Récompense des saisons terminées (Top 10 vérifié en ligne avec un compte).
export async function demarrerClassement() {
  majPeriode(S.collection);
  for (const { mois } of [...S.collection.classement.enAttente]) {
    const top = compteActuel() ? await dansLeTop(mois) : false;
    if (top === null) continue; // hors ligne : on réessaiera au prochain lancement
    const r = cloturerMois(S.collection, mois, top);
    if (r) {
      if (r.boosters.length) mettreEnBoite(r.titre, 'classement', r.boosters);
      annoncer(r.titre, '#recompenses', 'Récompenses et cadre de saison : pose le cadre sur une carte dans ta Collection.');
    }
  }
  sauver(S.collection);
  programmerPublication(S.collection, 1000);
}

// La division en cours : icône, nom, barre de progression.
export function blocDivision(compact = false): string {
  const k = S.collection.classement;
  const d = DIVISIONS[k.division], suivante = DIVISIONS[k.division + 1];
  const pct = Math.round((k.progression / R.parDivision) * 100);
  return `
    <div class="division d-${d.id} ${compact ? 'compacte' : ''}">
      <p class="div-nom"><span class="div-ico">${ICONE_DIVISION[d.id]}</span> <b>${d.nom}</b></p>
      <div class="div-jauge" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      ${compact ? '' : `<p class="note">${suivante ? `${k.progression}/${R.parDivision} vers ${ICONE_DIVISION[suivante.id]} ${suivante.nom}.` : estMaitre(S.collection) ? 'Division maximale ! Vise le Top 10.' : ''}</p>`}
    </div>`;
}

function blocMoi(): string {
  const k = S.collection.classement;
  const jours = joursRestants();
  return `
    <section class="bloc mon-classement">
      <p class="mc-mois">Saison ${numeroSaison(k.mois)} · ${nomMois(k.mois)} · encore ${jours} jour${jours > 1 ? 's' : ''}</p>
      ${blocDivision()}
      <p class="mc-points"><b>${k.points}</b> point${k.points > 1 ? 's' : ''} de classement <small>· aujourd'hui ${k.pointsJour}/${R.plafondJour}</small></p>
    </section>`;
}

const texteRecompense = (d: (typeof DIVISIONS)[number]) =>
  [d.classiques ? `${d.classiques} booster classique` : '', d.rares ? `${d.rares} booster${d.rares > 1 ? 's' : ''} rare${d.rares > 1 ? 's' : ''}` : '', d.carte ? `1 carte ${d.carte === 'epique' ? 'épique' : 'légendaire'}` : ''].filter(Boolean).join(' + ');

function blocRegles(): string {
  const P = R.points, G = R.gainsDivision;
  return `
    <details class="bloc regles-classement">
      <summary>Comment ça marche ?</summary>
      <p><b>Divisions</b> : ${DIVISIONS.map((d) => `${ICONE_DIVISION[d.id]} ${d.nom}`).join(' → ')}.</p>
      <ul>
        <li>Victoire contre l'ordinateur : la barre monte de <b>${G.facile}</b> (facile), <b>${G.normal}</b> (normal), <b>${G.fort}</b> (fort), +${G.tombe} par tombé.</li>
        <li>Victoire en ligne : <b>+${G.enLigne}</b> ; tournoi gagné : <b>+${G.tournoiGagne}</b>. Barre pleine (${R.parDivision}) : division suivante.</li>
        <li>Défaite en ligne : <b>−${R.perteEnLigne}</b>, jamais sous le début de ta division. Les défaites contre l'ordinateur ne font rien perdre.</li>
        <li>Une saison = un mois. Le 1er du mois, tu gardes ta division et ta barre repart de zéro.</li>
      </ul>
      <p><b>Points de classement</b> (classements Tous, Amis, Pays) : facile ${P.facile}, normal ${P.normal}, fort ${P.fort}, en ligne ${P.enLigne}, +${P.tombe} par tombé, tournoi +${P.tournoiGagne} ; au plus ${R.plafondJour} par jour.</p>
      <p><b>Fin de saison</b> (si tu as joué) : récompenses dans la boîte, et un <b>cadre de saison</b> à poser sur une carte de ta Collection.</p>
      <ul>
        ${DIVISIONS.map((d) => `<li>${ICONE_DIVISION[d.id]} ${d.nom} : ${texteRecompense(d)}</li>`).join('')}
        <li>🏆 Top ${R.top.places} du classement général : +${R.top.rares} booster rare.</li>
      </ul>
      <p class="note">Ton badge s'affiche à côté de ton pseudo toute la saison suivante.</p>
    </details>`;
}

const choixPays = () => `
  <label class="choix-pays">Mon pays
    <select data-pays>
      <option value="">Choisir…</option>
      ${PAYS.map(([c, n]) => `<option value="${c}" ${S.collection.pays === c ? 'selected' : ''}>${drapeau(c)} ${echap(n)}</option>`).join('')}
    </select>
  </label>`;

export function brancherPays(racine: ParentNode, apres: () => void) {
  racine.querySelector<HTMLSelectElement>('[data-pays]')?.addEventListener('change', (ev) => {
    S.collection.pays = (ev.target as HTMLSelectElement).value;
    sauver(S.collection);
    programmerPublication(S.collection, 500);
    apres();
  });
}

function lignesHTML(r: Resultat): string {
  if (!r.lignes.length) {
    return vue === 'amis'
      ? '<p class="note">Aucun ami classé ce mois-ci. Invite tes amis pour te mesurer à eux : ils apparaissent ici quand ils ont un compte et des points.</p>'
      : '<p class="note">Personne n\'a encore de points ce mois-ci : sois le premier !</p>';
  }
  const lignes = r.lignes.map((l, i) => `
    <li class="${l.moi ? 'moi' : ''} ${i < 3 ? `podium-${i + 1}` : ''}">
      <span class="cl-rang">${i + 1}</span>
      <span class="cl-nom">${drapeau(l.pays)} ${echap(l.pseudo)} ${pastilleBadge(l.badge)}</span>
      <span class="cl-points">${l.points}</span>
    </li>`).join('');
  const horsListe = vue === 'monde' && r.maPlace && !r.lignes.some((l) => l.moi)
    ? `<p class="ma-place">Ta place : <b>${r.maPlace}e</b> avec ${S.collection.classement.points} points</p>` : '';
  return `<ol class="liste-classement">${lignes}</ol>${horsListe}`;
}

async function chargerListe() {
  const zone = app.querySelector<HTMLElement>('.zone-classement');
  if (!zone) return;
  if (vue === 'pays' && !S.collection.pays) {
    zone.innerHTML = `<p class="note">Choisis ton pays pour voir le classement des joueurs de ton pays.</p>${choixPays()}`;
    brancherPays(zone, () => void chargerListe());
    return;
  }
  zone.innerHTML = '<p class="note">Chargement du classement…</p>';
  const v = vue;
  try {
    const r = await lireClassement(S.collection, v);
    if (v !== vue || !zone.isConnected) return;
    zone.innerHTML = `${v === 'pays' ? `<p class="note">${drapeau(S.collection.pays)} ${echap(PAYS.find(([c]) => c === S.collection.pays)?.[1] ?? '')} · <button class="lien" data-changer-pays>changer</button></p>` : ''}${lignesHTML(r)}${v === 'amis' ? `<div class="invitation-classement">${blocInvitation()}</div>` : ''}`;
    brancherInvitation(zone);
    zone.querySelector('[data-changer-pays]')?.addEventListener('click', () => { zone.innerHTML = choixPays(); brancherPays(zone, () => void chargerListe()); });
  } catch {
    if (v === vue && zone.isConnected) zone.innerHTML = '<p class="note">Classement indisponible pour le moment. Vérifie ta connexion internet et réessaie.</p>';
  }
}

export function ecranClassement() {
  S.partie = null;
  majPeriode(S.collection);
  const compte = compteActuel();
  const onglet = (v: Vue, t: string) => `<button type="button" role="tab" data-vue="${v}" class="${vue === v ? 'actif' : ''}" aria-selected="${vue === v}">${t}</button>`;
  app.innerHTML = `
    <main class="sous-menu classement">
      ${enTete('Classement', 'Chaque victoire rapporte des points. Les meilleurs coachs du mois gagnent des boosters.')}
      ${blocMoi()}
      ${compte ? `
        <div class="onglets-classement" role="tablist">${onglet('monde', '🌍 Tous')}${onglet('amis', '🤝 Amis')}${onglet('pays', `${drapeau(S.collection.pays) || '🏳️'} Pays`)}</div>
        <section class="zone-classement" aria-live="polite"></section>`
      : `<section class="bloc classement-compte">
          <p>🔒 <b>Crée ton compte pour entrer dans le classement.</b> Tes points de ce mois comptent déjà : ils apparaîtront dès que ton compte sera créé.</p>
          <button class="principal" data-creer-compte>Créer mon compte</button>
        </section>`}
      ${blocRegles()}
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-vue]').forEach((b) => b.addEventListener('click', () => {
    vue = b.dataset.vue as Vue;
    app.querySelectorAll<HTMLButtonElement>('[data-vue]').forEach((x) => { x.classList.toggle('actif', x === b); x.setAttribute('aria-selected', String(x === b)); });
    void chargerListe();
  }));
  app.querySelector('[data-creer-compte]')?.addEventListener('click', () => fenetreCompte());
  if (compte) void chargerListe();
  window.scrollTo(0, 0);
}

// Pour la fenêtre « Mon compte » : le choix du pays.
export { choixPays };
