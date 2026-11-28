// Tutoriels courts (un par style de jeu) et parties d'essai.

import { ID_RIVAL, LUTTEURS, REGLES as R_, type EtatCombat, type IdAction, type Niveau } from '../../moteur';
import { possede, sauver } from '../collection';
import { tutoVisible } from '../menu';
import { creerTournoiEquipe, creerIndividuel } from '../tournoi';
import { TUTOS, defAdversaireEssai, defEssai, type IdTuto } from '../tutos';
import { cartes as toutesLesCartes } from './collection';
import { fermerFenetre, lancer, ouvrirFenetre } from './combat';
import { S, app, echap, nouvelleGraine } from './commun';
import { ecranTournoiEnCours, ecranTournois, sauverTournoi } from './tournois';

// ---------- Tutoriels courts (un par style de jeu) ----------

// Bouton d'un tutoriel court ; grisé, avec la raison, si le style de jeu n'est pas encore accessible.
// Caché tant que le mode histoire n'a pas ouvert le mode qu'il présente (27/11/2026).
export function boutonTuto(id: IdTuto, note = true): string {
  if (!tutoVisible(S.collection, id)) return '';
  const t = TUTOS[id];
  const verrou = t.verrou(S.collection);
  return `<button class="secondaire bouton-tuto" data-tuto="${id}" ${verrou ? 'disabled' : ''}>📘 Tutoriel : ${echap(t.titre)}</button>${verrou && note ? `<p class="note">🔒 ${echap(verrou)}</p>` : ''}`;
}

export function brancherTutos(racine: ParentNode = app) {
  racine.querySelectorAll<HTMLButtonElement>('[data-tuto]').forEach((b) => b.addEventListener('click', () => ouvrirTuto(b.dataset.tuto as IdTuto)));
}

// Ouvre un tutoriel court tout seul à la première visite d'un mode (une seule fois).
export function tutoAuto(id: IdTuto) {
  if (S.collection.tutosVus.includes(id) || TUTOS[id].verrou(S.collection) || !tutoVisible(S.collection, id) || S.tuto || S.essaiSolo) return;
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

export function lancerEssai(id: IdTuto) {
  const t = TUTOS[id];
  const e = t.essai;
  if (!e || t.verrou(S.collection)) return;
  const auHasard = () => LUTTEURS.filter((l) => l.rarete === 'commune')[Math.floor(Math.random() * LUTTEURS.filter((l) => l.rarete === 'commune').length)].id;
  // Tours guidés : actions (ou séquences) imposées à l'ordinateur, adversaire avec le bon deck.
  const adv = auHasard();
  const guide = {
    defOrdi: t.deckAdversaire ? defAdversaireEssai(e.type === 'rapide' && e.infini ? ID_RIVAL : adv, t.deckAdversaire) : undefined,
    script: (t.guide ?? []).map((g) => ({ action: g.ordi })),
    scriptSeq: (t.guideSeq ?? []).map((g) => g.ordi.map((action) => ({ action }))),
  };
  if (e.type === 'rapide') {
    return lancer('europe', adv, nouvelleGraine(), !e.periodes, 'normal', false, null, false, { id, enchainement: e.enchainement, infini: e.infini, def: defEssai(e.deck), ...guide });
  }
  if (e.type === 'arene') {
    return lancer('europe', adv, nouvelleGraine(), false, 'facile', false, null, false, { id, enchainement: false, infini: false, def: defEssai(e.deck), ...guide });
  }
  if (S.tournoi && !S.tournoi.recompense) return ecranTournois('<p class="alerte">Termine d\'abord le tournoi en cours.</p>');
  const moi = toutesLesCartes().find((l) => possede(S.collection, l.id))?.id ?? 'europe';
  S.tournoi = e.type === 'individuel'
    ? { ...creerIndividuel(moi, R_.tournoi.individuel.minimum, nouvelleGraine()), essai: true }
    : { ...creerTournoiEquipe(S.collection.club.slice(0, R_.tournoi.equipe.duels), nouvelleGraine()), essai: true };
  S.paquetTournoi = null;
  sauverTournoi();
  location.hash = '#tournois';
  ecranTournoiEnCours();
}

// Tour (ou séquence) guidé en cours d'une partie d'essai, sinon null.
export function tourGuideEssai(): { joueur: IdAction[]; texte: string } | null {
  if (!S.essaiSolo || !S.partie) return null;
  const t = TUTOS[S.essaiSolo];
  if (S.partie.etat.enchainement) {
    const g = t.guideSeq?.[S.partie.sequencesJouees];
    return g ? { joueur: g.joueur, texte: g.texte } : null;
  }
  const g = t.guide?.[S.partie.toursJoues];
  return g ? { joueur: [g.joueur], texte: g.texte } : null;
}

// Coach pendant une partie d'essai (ou un tournoi d'essai) : le texte du tour guidé, puis des conseils
// sur les premiers tours libres.
export function bulleConseil(e: EtatCombat): string {
  const id: IdTuto | null = S.essaiSolo ?? (S.enTournoi !== null && S.tournoi && 'essai' in S.tournoi && S.tournoi.essai ? (S.tournoi.type === 'equipe' ? 'equipe' : 'individuel') : null);
  if (!id || S.tuto) return '';
  const g = tourGuideEssai();
  if (g) return `<div class="bulle-coach conseil guide" role="status"><b>Coach</b><p>${g.texte}</p></div>`;
  const t = TUTOS[id];
  const guides = e.enchainement ? (t.guideSeq?.length ?? 0) : (t.guide?.length ?? 0);
  const i = (e.enchainement ? (S.partie?.sequencesJouees ?? 0) : S.tours.length) - guides;
  const c = i >= 0 ? t.conseils[i] : undefined;
  return c ? `<div class="bulle-coach conseil"><b>Coach</b><p>${echap(c)}</p></div>` : '';
}

// Arène : choix du lutteur parmi ses cartes.
export const NOM_NIVEAU: Record<Niveau, string> = { facile: 'Facile', normal: 'Normal', fort: 'Fort' };
