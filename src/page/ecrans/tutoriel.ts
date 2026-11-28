// Règles et grand tutoriel.

import { trouverLutteur, NIVEAUX } from '../../moteur';
import { Partie } from '../partie';
import { activerReflets } from '../carte';
import { possede, sauver } from '../collection';
import { etapeArene } from '../arene';
import { ETAPES } from '../histoire';
import { ETAPES_GUIDEES, TEXTE_LIBRE, TEXTE_LIBRE_SUITE, TUTO_COMBAT, ecransTutoriel, reglesHTML, type EtapeGuidee } from '../aide';
import { niveauDe } from './accueil';
import { cartes } from './collection';
import { ecranCombat, lancerArene } from './combat';
import { tourGuideEssai } from './tutos-courts';
import { S, app, echap, enTete } from './commun';
import { quete } from './progression';
import { noterParcours } from './stats';

// ---------- Règles et tutoriel ----------

export function ecranRegles() {
  S.partie = null;
  app.innerHTML = `
    <main class="sous-menu regles">
      ${enTete('Règles', 'Le combat en quelques minutes', '#combat')}
      <div class="regles-corps">${reglesHTML()}</div>
      <a class="principal lien-bouton marge" href="#tutoriel">Essayer avec le tutoriel</a>
    </main>`;
  window.scrollTo(0, 0);
}

export function ecranTutoriel(i = 0) {
  S.partie = null;
  S.tuto = false;
  const ecrans = ecransTutoriel();
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
          : '<button class="principal" data-combat-guide>Jouer le combat express</button>'}
      </div>
    </main>`;
  activerReflets(app);
  app.querySelector('[data-precedent]')?.addEventListener('click', () => ecranTutoriel(i - 1));
  app.querySelector('[data-suivant]')?.addEventListener('click', () => ecranTutoriel(i + 1));
  app.querySelector('[data-combat-guide]')?.addEventListener('click', lancerTutoriel);
  window.scrollTo(0, 0);
}

export function lancerTutoriel() {
  if (location.hash) history.replaceState(null, '', location.pathname);
  S.mode = 'solo';
  S.HUMAIN = 0;
  S.ORDI = 1;
  S.partie = new Partie(
    TUTO_COMBAT.moi, TUTO_COMBAT.adversaire, TUTO_COMBAT.graine, 'normal',
    trouverLutteur(TUTO_COMBAT.moi), ETAPES_GUIDEES.map((e) => e.ordi),
  );
  S.tours = [];
  S.scoresPeriodes = [];
  S.enAttente = false;
  S.endurancesAvant = null;
  S.recompenseDonnee = true; // pas de récompense pour le combat guidé
  S.paquetSolo = null;
  S.messageSolo = '';
  S.tuto = true;
  S.enTournoi = null;
  S.bonusEnCours = null;
  S.bonusCeCombat = false;
  ecranCombat();
}

// Étape guidée du tour en cours (null quand le joueur joue librement).
export function etapeGuidee(): EtapeGuidee | null {
  return S.tuto && S.partie?.scripte ? ETAPES_GUIDEES[S.partie.toursJoues] : null;
}

export function bulleCoach(): string {
  if (!S.tuto || !S.partie) return '';
  const g = etapeGuidee();
  const texte = g ? g.texte : S.partie.toursJoues === ETAPES_GUIDEES.length ? TEXTE_LIBRE : TEXTE_LIBRE_SUITE;
  return `<div class="bulle-coach" role="status"><span class="bc-qui">Coach</span><p>${texte}</p></div>`;
}

// Pendant les tours guidés (grand tutoriel, ou parties d'essai des tutoriels courts) : seule l'action
// conseillée reste jouable. En format Enchaînement : l'action suivante de la séquence guidée.
export function guiderBoutons(racine: ParentNode) {
  const g = etapeGuidee();
  const ge = tourGuideEssai();
  if (!g && !ge) return;
  const attendue = g ? g.conseil.action : S.partie?.etat.enchainement ? ge!.joueur[S.sequenceHumain.length] ?? null : ge!.joueur[0];
  racine.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((b) => {
    const bon = b.dataset.action === attendue; // spéciale ou non : demandé ensuite
    b.disabled = !bon;
    b.classList.toggle('conseille', bon);
  });
}

export function ecranFinTutoriel() {
  if (!S.partie) return;
  const e = S.partie.etat;
  const h = e.joueurs[S.HUMAIN];
  const o = e.joueurs[S.ORDI];
  const score = S.scoresPeriodes[0] ?? [h.score, o.score];
  const gagne = e.termine ? e.vainqueur === S.HUMAIN : h.periodesGagnees > 0 || (e.periode === 1 && h.score > o.score);
  S.tuto = false;
  S.partie = null;
  S.collection.bonusTutoriel = true;
  sauver(S.collection);
  quete({ type: 'tutoriel' });
  noterParcours('tutoriel_fini', '', true);
  // Premier vrai combat : le meilleur lutteur du joueur contre le premier adversaire de la Carrière.
  const adv = etapeArene(S.collection).adversaire;
  const premier = adv ? [...cartes()].filter((l) => possede(S.collection, l.id)).sort((x, y) => NIVEAUX.indexOf(niveauDe(y.id)) - NIVEAUX.indexOf(niveauDe(x.id)))[0] ?? null : null;
  app.innerHTML = `
    <main class="sous-menu tuto">
      ${enTete('Tutoriel terminé', '', '#combat')}
      <section class="bloc tuto-ecran">
        <h2>${gagne ? 'Combat express gagné !' : 'Combat express perdu, mais tu as compris le principe !'}</h2>
        <p class="tuto-score">${score[0]} - ${score[1]}</p>
        <p>Un vrai combat se joue en 3 périodes : gagne-en 2, ou fais un tombé. Sans le coach, tu ne verras pas le choix de l'adversaire : à toi de deviner son jeu.</p>
        <p><b>Bonus :</b> ta prochaine victoire en Carrière rapporte 2 boosters en plus.</p>
        <p><b>Et maintenant ?</b> ${premier ? `Ton premier vrai combat : <b>${echap(premier.nom)}</b> contre <b>${echap(trouverLutteur(adv!).nom)}</b>, premier adversaire de la Carrière. ` : ''}Le mode histoire te guide ensuite pas à pas. Première étape : ${echap(ETAPES[0].objectif.toLowerCase())}.</p>
      </section>
      <div class="fin-boutons marge">
        ${premier ? '<button class="principal gros" data-premier-combat>Ton premier vrai combat</button>' : '<a class="principal lien-bouton" href="#arene">Combattre l\'ordinateur</a>'}
        <a class="secondaire lien-bouton" href="#histoire">Voir le mode histoire</a>
        <a class="lien" href="#">Retour au menu</a>
      </div>
    </main>`;
  app.querySelector('[data-premier-combat]')?.addEventListener('click', () => premier && lancerArene(premier.id));
  window.scrollTo(0, 0);
}
