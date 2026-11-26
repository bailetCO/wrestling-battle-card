// Tutoriels courts (un par style de jeu) et parties d'essai.

import { ACTIONS, LUTTEURS, trouverLutteur, REGLES as R_, type DefLutteur, type EtatCombat, type IdAction, type Niveau } from '../../moteur';
import { possede, sauver } from '../collection';
import { creerTournoiEquipe, creerIndividuel } from '../tournoi';
import { TUTOS, type IdTuto } from '../tutos';
import { CARTES } from './collection';
import { fermerFenetre, lancer, ouvrirFenetre } from './combat';
import { S, app, echap, nouvelleGraine } from './commun';
import { ecranTournoiEnCours, ecranTournois, sauverTournoi } from './tournois';

// ---------- Tutoriels courts (un par style de jeu) ----------

// Bouton d'un tutoriel court ; grisé, avec la raison, si le style de jeu n'est pas encore accessible.
export function boutonTuto(id: IdTuto, note = true): string {
  const t = TUTOS[id];
  const verrou = t.verrou(S.collection);
  return `<button class="secondaire bouton-tuto" data-tuto="${id}" ${verrou ? 'disabled' : ''}>📘 Tutoriel : ${echap(t.titre)}</button>${verrou && note ? `<p class="note">🔒 ${echap(verrou)}</p>` : ''}`;
}

export function brancherTutos(racine: ParentNode = app) {
  racine.querySelectorAll<HTMLButtonElement>('[data-tuto]').forEach((b) => b.addEventListener('click', () => ouvrirTuto(b.dataset.tuto as IdTuto)));
}

// Ouvre un tutoriel court tout seul à la première visite d'un mode (une seule fois).
export function tutoAuto(id: IdTuto) {
  if (S.collection.tutosVus.includes(id) || TUTOS[id].verrou(S.collection) || S.tuto || S.essaiSolo) return;
  if (document.querySelector('.voile, .scene-dialogue, .revelation')) return; // une scène est déjà ouverte : à la prochaine visite
  ouvrirTuto(id);
}

export function ouvrirTuto(id: IdTuto, k = 0) {
  const t = TUTOS[id];
  if (t.verrou(S.collection)) return;
  if (!S.collection.tutosVus.includes(id)) { S.collection.tutosVus.push(id); sauver(S.collection); }
  const ecran = t.ecrans[k];
  const dernier = k === t.ecrans.length - 1;
  const f = ouvrirFenetre(`
    <p class="tuto-etape">Tutoriel · ${echap(t.titre)} · ${k + 1}/${t.ecrans.length}</p>
    <h2>${echap(ecran.titre)}</h2>
    <div class="tuto-court">${ecran.html}</div>
    <div class="fin-boutons">
      ${dernier
        ? t.essai ? '<button class="principal" data-essai>Lancer la partie d\'essai</button>' : '<button class="principal" data-fermer>Compris</button>'
        : '<button class="principal" data-suite-tuto>Suite</button>'}
      ${k > 0 ? '<button class="secondaire" data-avant-tuto>Retour</button>' : ''}
      <button class="lien" data-fermer>Fermer</button>
    </div>`, true);
  f.querySelector('[data-suite-tuto]')?.addEventListener('click', () => ouvrirTuto(id, k + 1));
  f.querySelector('[data-avant-tuto]')?.addEventListener('click', () => ouvrirTuto(id, k - 1));
  f.querySelector('[data-essai]')?.addEventListener('click', () => { fermerFenetre(); lancerEssai(id); });
}

// Le lutteur des parties d'essai : un lutteur équilibré, avec le deck qui montre le style de jeu.
export function defEssai(deck: IdAction[]): DefLutteur {
  const base = trouverLutteur('europe');
  return { ...base, nom: 'Lutteur d\'essai', actions: [...deck], actionsPossibles: Object.keys(ACTIONS) as IdAction[] };
}

export function lancerEssai(id: IdTuto) {
  const t = TUTOS[id];
  const e = t.essai;
  if (!e || t.verrou(S.collection)) return;
  const auHasard = () => LUTTEURS.filter((l) => l.rarete === 'commune')[Math.floor(Math.random() * LUTTEURS.filter((l) => l.rarete === 'commune').length)].id;
  if (e.type === 'rapide') {
    return lancer('europe', auHasard(), nouvelleGraine(), true, 'normal', false, null, false, { id, enchainement: e.enchainement, infini: e.infini, def: defEssai(e.deck) });
  }
  if (e.type === 'arene') {
    return lancer('europe', auHasard(), nouvelleGraine(), false, 'facile', false, null, false, { id, enchainement: false, infini: false, def: defEssai(e.deck) });
  }
  if (S.tournoi && !S.tournoi.recompense) return ecranTournois('<p class="alerte">Termine d\'abord le tournoi en cours.</p>');
  const moi = CARTES.find((l) => possede(S.collection, l.id))?.id ?? 'europe';
  S.tournoi = e.type === 'individuel'
    ? { ...creerIndividuel(moi, R_.tournoi.individuel.minimum, nouvelleGraine()), essai: true }
    : { ...creerTournoiEquipe(S.collection.club.slice(0, R_.tournoi.equipe.duels), nouvelleGraine()), essai: true };
  S.paquetTournoi = null;
  sauverTournoi();
  location.hash = '#tournois';
  ecranTournoiEnCours();
}

// Conseil du coach pendant une partie d'essai (ou un tournoi d'essai), sur les premiers tours.
export function bulleConseil(e: EtatCombat): string {
  const id: IdTuto | null = S.essaiSolo ?? (S.enTournoi !== null && S.tournoi && 'essai' in S.tournoi && S.tournoi.essai ? (S.tournoi.type === 'equipe' ? 'equipe' : 'individuel') : null);
  if (!id || S.tuto) return '';
  const i = e.enchainement ? (S.tours[S.tours.length - 1]?.sequence ?? 0) : S.tours.length;
  const c = TUTOS[id].conseils[i];
  return c ? `<div class="bulle-coach conseil"><b>Coach</b><p>${echap(c)}</p></div>` : '';
}

// Arène : choix du lutteur parmi ses cartes.
export const NOM_NIVEAU: Record<Niveau, string> = { facile: 'Facile', normal: 'Normal', fort: 'Fort' };
