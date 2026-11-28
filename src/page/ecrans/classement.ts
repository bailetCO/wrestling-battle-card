import { blocInvitation, brancherInvitation } from './parrainage';
// Écran « Classement » (28/11/2026, 2e version) : trois classements en onglets (division en ligne du mois,
// ordinateur fort et saison sportive à vie), chacun pour tous les joueurs, mes amis ou mon pays. Sans compte :
// explication et bouton pour créer son compte. Fin de saison : récompense de la division, cadre et Top 10.

import { REGLES } from '../../moteur';
import {
  DIVISIONS, PAYS, badgeDe, barreDe, cloturerMois, dansLeTop, drapeau, joursRestants, lireClassement, maValeur, majPeriode, nomDivision, nomMois,
  numeroSaison, programmerPublication, scoreSaison, texteSaison, type Resultat, type TypeClassement, type Vue,
} from '../classement';
import { tuileVisible } from '../menu';
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

// La division en ligne en cours : icône, nom, barre de progression.
export function blocDivision(compact = false): string {
  const k = S.collection.classement;
  const d = DIVISIONS[k.division], suivante = DIVISIONS[k.division + 1];
  const barre = barreDe(k.division);
  const pct = barre ? Math.round((k.progression / barre) * 100) : 100;
  return `
    <div class="division d-${d.id} ${compact ? 'compacte' : ''}">
      <p class="div-nom"><span class="div-ico">${ICONE_DIVISION[d.id]}</span> <b>${d.nom}</b></p>
      <div class="div-jauge" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      ${compact ? '' : `<p class="note">${suivante && barre ? `${k.progression}/${barre} vers ${ICONE_DIVISION[suivante.id]} ${suivante.nom}.` : `Division maximale ! ${k.progression} points en Maître : vise le Top ${R.top.places}.`}</p>`}
    </div>`;
}

const ONGLETS: { type: TypeClassement; titre: string }[] = [
  { type: 'enLigne', titre: '🌐 En ligne' }, { type: 'fort', titre: '🤖 Ordinateur fort' }, { type: 'saison', titre: '🏅 Saison sportive' },
];
let type: TypeClassement = 'enLigne';

function blocMoi(): string {
  const k = S.collection.classement;
  const jours = joursRestants();
  if (type === 'fort') {
    const n = S.collection.palmares.fort;
    return `<section class="bloc mon-classement"><p class="mc-mois">Classement à vie</p>
      <p class="mc-points"><b>${n}</b> victoire${n > 1 ? 's' : ''} contre l'ordinateur fort</p>
      <p class="note">Seules comptent les victoires en jouant toi-même (pas en mode auto) : Carrière, entraînement et tournois.</p></section>`;
  }
  if (type === 'saison') {
    return `<section class="bloc mon-classement"><p class="mc-mois">Classement à vie</p>
      <p class="mc-points">${tuileVisible(S.collection, 'saison') ? `Saison sportive : <b>${texteSaison(scoreSaison(S.collection))}</b>` : 'La saison sportive s\'ouvre au niveau 10 de Mon Club.'}</p>
      <p class="note">Les joueurs sont classés selon leurs saisons terminées, puis le palier en cours.</p></section>`;
  }
  return `
    <section class="bloc mon-classement">
      <p class="mc-mois">Saison ${numeroSaison(k.mois)} · ${nomMois(k.mois)} · encore ${jours} jour${jours > 1 ? 's' : ''}</p>
      ${blocDivision()}
      <p class="mc-points">${k.enLigne} combat${k.enLigne > 1 ? 's' : ''} en ligne ce mois-ci${k.enLigne ? '' : ' : joue au moins un combat en ligne pour recevoir la récompense de fin de saison'}</p>
    </section>`;
}

const texteRecompense = (d: (typeof DIVISIONS)[number]) =>
  [d.classiques ? `${d.classiques} booster classique` : '', d.rares ? `${d.rares} booster${d.rares > 1 ? 's' : ''} rare${d.rares > 1 ? 's' : ''}` : '', d.carte ? `1 carte ${d.carte === 'epique' ? 'épique' : 'légendaire'}` : ''].filter(Boolean).join(' + ');

function blocRegles(): string {
  return `
    <details class="bloc regles-classement">
      <summary>Comment ça marche ?</summary>
      <p><b>🌐 En ligne</b> : ta division du mois, ${DIVISIONS.map((d) => `${ICONE_DIVISION[d.id]} ${d.nom}`).join(' → ')}.</p>
      <ul>
        <li>Seuls les combats en ligne comptent : victoire <b>+${R.victoireEnLigne}</b>, défaite <b>−${R.defaiteEnLigne}</b> (jamais sous le début de ta division).</li>
        <li>Barres de plus en plus longues : ${R.barres.map((b, i) => `${b} pour ${DIVISIONS[i + 1].nom}`).join(', ')}.</li>
        <li>Une saison = un mois. Le 1er du mois, tout le monde repart en Bronze.</li>
      </ul>
      <p><b>Fin de saison</b> (si tu as joué au moins un combat en ligne dans le mois) : récompenses dans la boîte, et un <b>cadre de saison</b> à poser sur une carte de ta Collection.</p>
      <ul>
        ${DIVISIONS.map((d) => `<li>${ICONE_DIVISION[d.id]} ${d.nom} : ${texteRecompense(d)}</li>`).join('')}
        <li>🏆 Top ${R.top.places} du mois : +${R.top.rares} booster rare.</li>
      </ul>
      <p><b>🤖 Ordinateur fort</b> (à vie) : tes victoires contre l'ordinateur fort, en jouant toi-même.</p>
      <p><b>🏅 Saison sportive</b> (à vie) : tes saisons terminées, puis ton palier en cours.</p>
      <p class="note">Ton badge de division s'affiche à côté de ton pseudo toute la saison suivante.</p>
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
      ? '<p class="note">Aucun ami classé ici. Invite tes amis pour te mesurer à eux : ils apparaissent quand ils ont un compte.</p>'
      : `<p class="note">${type === 'enLigne' ? 'Personne n\'a encore joué en ligne ce mois-ci : sois le premier !' : 'Personne n\'est encore classé : sois le premier !'}</p>`;
  }
  const lignes = r.lignes.map((l, i) => `
    <li class="${l.moi ? 'moi' : ''} ${i < 3 ? `podium-${i + 1}` : ''}">
      <span class="cl-rang">${i + 1}</span>
      <span class="cl-nom">${drapeau(l.pays)} ${echap(l.pseudo)} ${pastilleBadge(l.badge)}</span>
      <span class="cl-points">${type === 'saison' ? texteSaison(l.points) : l.points}</span>
    </li>`).join('');
  const horsListe = vue === 'monde' && r.maPlace && !r.lignes.some((l) => l.moi)
    ? `<p class="ma-place">Ta place : <b>${r.maPlace}e</b> avec ${type === 'saison' ? texteSaison(maValeur(S.collection, type)) : `${maValeur(S.collection, type)} ${type === 'fort' ? 'victoires' : 'points'}`}</p>` : '';
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
    const t = type;
    const r = await lireClassement(S.collection, v, t);
    if (v !== vue || t !== type || !zone.isConnected) return;
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
      ${enTete('Classement', 'Trois classements : ta division en ligne du mois, tes victoires contre l\'ordinateur fort, et ta saison sportive.')}
      <div class="onglets-classement types" role="tablist">${ONGLETS.map((o) => `<button type="button" role="tab" data-type="${o.type}" class="${type === o.type ? 'actif' : ''}" aria-selected="${type === o.type}">${o.titre}</button>`).join('')}</div>
      <div class="zone-moi">${blocMoi()}</div>
      ${compte ? `
        <div class="onglets-classement" role="tablist">${onglet('monde', '🌍 Tous')}${onglet('amis', '🤝 Amis')}${onglet('pays', `${drapeau(S.collection.pays) || '🏳️'} Pays`)}</div>
        <section class="zone-classement" aria-live="polite"></section>`
      : `<section class="bloc classement-compte">
          <p>🔒 <b>Crée ton compte pour entrer dans les classements.</b> Ce que tu fais déjà compte : tu apparaîtras dès que ton compte sera créé.</p>
          <button class="principal" data-creer-compte>Créer mon compte</button>
        </section>`}
      ${blocRegles()}
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-vue]').forEach((b) => b.addEventListener('click', () => {
    vue = b.dataset.vue as Vue;
    app.querySelectorAll<HTMLButtonElement>('[data-vue]').forEach((x) => { x.classList.toggle('actif', x === b); x.setAttribute('aria-selected', String(x === b)); });
    void chargerListe();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-type]').forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.type as TypeClassement;
    app.querySelectorAll<HTMLButtonElement>('[data-type]').forEach((x) => { x.classList.toggle('actif', x === b); x.setAttribute('aria-selected', String(x === b)); });
    app.querySelector('.zone-moi')!.innerHTML = blocMoi();
    if (compteActuel()) void chargerListe();
  }));
  app.querySelector('[data-creer-compte]')?.addEventListener('click', () => fenetreCompte());
  if (compte) void chargerListe();
  window.scrollTo(0, 0);
}

// Pour la fenêtre « Mon compte » : le choix du pays.
export { choixPays };
