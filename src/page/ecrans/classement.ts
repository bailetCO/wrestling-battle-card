import { blocInvitation, brancherInvitation } from './parrainage';
// Écran « Classement » (27/11/2026) : points du mois, palier, et trois classements (tous les joueurs,
// mes amis, mon pays). Sans compte : explication et bouton pour créer son compte (les points du mois
// comptent déjà). Fin du mois : récompense du palier et du Top 10 dans la boîte à récompenses.

import { REGLES } from '../../moteur';
import {
  PAYS, badgeDe, cloturerMois, dansLeTop, drapeau, joursRestants, lireClassement, majPeriode, nomMois, nomPalier,
  palierDe, palierSuivant, programmerPublication, type Resultat, type Vue,
} from '../classement';
import { sauver } from '../collection';
import { compteActuel } from '../compte';
import { S, app, echap, enTete } from './commun';
import { fenetreCompte } from './compte';
import { annoncer, mettreEnBoite } from './progression';

const R = REGLES.classement;
let vue: Vue = 'monde';
const ICONE_BADGE: Record<string, string> = { bronze: '🥉', argent: '🥈', or: '🥇', top: '🏆' };

// Petit badge à côté d'un pseudo : 🏆 Top 10, ou la médaille du palier du mois dernier.
export function pastilleBadge(badge: string): string {
  if (!ICONE_BADGE[badge]) return '';
  const titre = badge === 'top' ? 'Top 10 du mois dernier' : `Palier ${nomPalier(badge)} le mois dernier`;
  return `<span class="badge-classement" title="${titre}" aria-label="${titre}">${ICONE_BADGE[badge]}</span>`;
}
export const pastilleMonBadge = () => pastilleBadge(badgeDe(S.collection));

// Au lancement : nouveau mois ? Récompense des mois terminés (Top 10 vérifié en ligne avec un compte).
export async function demarrerClassement() {
  majPeriode(S.collection);
  for (const { mois, points } of [...S.collection.classement.enAttente]) {
    const top = compteActuel() ? await dansLeTop(mois) : false;
    if (top === null) continue; // hors ligne : on réessaiera au prochain lancement
    const r = cloturerMois(S.collection, mois, top);
    if (r) {
      mettreEnBoite(r.titre, 'classement', r.boosters);
      annoncer(`Classement de ${nomMois(mois)} : ${top ? 'Top 10 !' : `palier ${palierDe(points)?.nom ?? ''}`}`);
    }
  }
  sauver(S.collection);
  programmerPublication(S.collection, 1000);
}

function blocMoi(): string {
  const k = S.collection.classement;
  const p = palierDe(k.points), suivant = palierSuivant(k.points);
  const debut = p?.min ?? 0;
  const jauge = suivant ? Math.round(((k.points - debut) / (suivant.min - debut)) * 100) : 100;
  const jours = joursRestants();
  return `
    <section class="bloc mon-classement">
      <p class="mc-mois">${nomMois(k.mois)} · encore ${jours} jour${jours > 1 ? 's' : ''}</p>
      <p class="mc-points"><b>${k.points}</b> point${k.points > 1 ? 's' : ''} ${p ? `<span class="mc-palier p-${p.id}">${ICONE_BADGE[p.id]} ${p.nom}</span>` : ''}</p>
      <div class="mc-jauge" role="progressbar" aria-valuenow="${jauge}" aria-valuemin="0" aria-valuemax="100"><i style="width:${jauge}%"></i></div>
      <p class="note">${suivant ? `Encore <b>${suivant.min - k.points}</b> points pour le palier ${ICONE_BADGE[suivant.id]} ${suivant.nom}.` : 'Palier maximum atteint ! Vise le Top 10.'}
        Aujourd'hui : ${k.pointsJour}/${R.plafondJour} points.</p>
    </section>`;
}

const texteRecompense = (p: (typeof R.paliers)[number]) =>
  [p.classiques ? `${p.classiques} booster classique` : '', p.rares ? `${p.rares} booster${p.rares > 1 ? 's' : ''} rare${p.rares > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ');

function blocRegles(): string {
  const P = R.points;
  return `
    <details class="bloc regles-classement">
      <summary>Comment gagner des points ?</summary>
      <ul>
        <li>Victoire contre l'ordinateur : facile <b>${P.facile}</b>, normal <b>${P.normal}</b>, fort <b>${P.fort}</b> ; +${P.tombe} par tombé.</li>
        <li>Victoire en ligne contre un ami : <b>${P.enLigne}</b> (+${P.tombe} par tombé).</li>
        <li>Tournoi gagné : <b>+${P.tournoiGagne}</b>. Une défaite ne fait rien perdre.</li>
        <li>Au plus <b>${R.plafondJour}</b> points par jour. Remise à zéro le 1er du mois.</li>
      </ul>
      <p><b>Récompenses de fin de mois</b> (dans la boîte à récompenses) :</p>
      <ul>
        ${R.paliers.map((p) => `<li>${ICONE_BADGE[p.id]} ${p.nom} (${p.min} points) : ${texteRecompense(p)}</li>`).join('')}
        <li>🏆 Top ${R.top.places} du classement général : +${R.top.rares} booster rare.</li>
      </ul>
      <p class="note">Ton badge s'affiche à côté de ton pseudo tout le mois suivant.</p>
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
