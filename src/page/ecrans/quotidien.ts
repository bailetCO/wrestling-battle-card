import { prevoirPropositionNotifications } from './notifications';
// Revenir chaque jour, à l'écran (27/11/2026) : la récompense du jour (calendrier de 7 jours) en haut
// du menu, et le mot de Darius pour un joueur qui revient après une longue absence.

import { REGLES } from '../../moteur';
import { sauver } from '../collection';
import { portraitPersonnage } from '../portrait';
import { CASES, reclamer, recompenseDisponible, texteCase, visite } from '../quotidien';
import { jourDe } from '../club';
import { jouer } from '../son';
import { ouvrirFenetre } from './combat';
import { S, echap } from './commun';
import { revelerPaquet } from './fin';
import { mettreEnBoite } from './progression';
import { route } from './navigation';

const Q = REGLES.quotidien;
let retourAMontrer = false;

// Au lancement : visite du jour, et cadeau de retour après une longue absence.
export function demarrerQuotidien() {
  const cadeau = visite(S.collection, jourDe());
  if (cadeau) {
    mettreEnBoite('Cadeau de retour de Darius', 'quotidien', cadeau);
    retourAMontrer = true;
  }
  sauver(S.collection);
}

export function bandeauQuotidien(): string {
  if (!S.collection.coach || !recompenseDisponible(S.collection, jourDe())) return '';
  const rang = S.collection.quotidien.rang;
  const cases = Q.calendrier.map((r, k) => `
    <li class="${k < rang ? 'fait' : k === rang ? 'aujourdhui' : ''}" title="Jour ${k + 1} : ${texteCase(r)}">
      <small>J${k + 1}</small><span>${r.boostersRares ? '🎴' : r.boosters ? '🃏' : '💵'}</span>
    </li>`).join('');
  return `
    <section class="bloc quotidien">
      <h2>🎁 Récompense du jour</h2>
      <ol class="calendrier">${cases}</ol>
      <p class="note">Jour ${rang + 1}/${CASES} : <b>${texteCase(Q.calendrier[rang])}</b>. Reviens chaque jour : le 7e jour, un booster rare !</p>
      <button class="principal" data-quotidien>Récupérer</button>
    </section>`;
}

export function brancherQuotidien(racine: ParentNode) {
  racine.querySelector('[data-quotidien]')?.addEventListener('click', () => {
    const r = reclamer(S.collection, jourDe());
    if (!r) return route();
    sauver(S.collection);
    jouer('gain');
    revelerPaquet({ titre: `Récompense du jour · jour ${r.rang + 1}`, boosters: r.boosters, ouvert: false }, () => { prevoirPropositionNotifications(); route(); });
  });
}

// Mot de Darius au retour d'une longue absence (une fois, à l'arrivée sur le menu).
export function montrerRetour(): boolean {
  if (!retourAMontrer || document.querySelector('.voile, .scene-dialogue, .revelation')) return false;
  retourAMontrer = false;
  const f = ouvrirFenetre(`
    <div class="retour-darius">${portraitPersonnage('darius')}</div>
    <h2>Content de te revoir, Coach ${echap(S.collection.coach ?? '')} !</h2>
    <p>Le tapis t'attendait. Pour reprendre en forme, voici un cadeau : <b>${Q.retour.boostersRares} booster rare</b>, dans ta boîte à récompenses.</p>
    <button class="principal" data-voir-cadeau>Ouvrir mon cadeau</button>
    <button class="lien" data-fermer>Plus tard</button>`, true);
  f.querySelector('[data-voir-cadeau]')!.addEventListener('click', () => { location.hash = '#recompenses'; });
  return true;
}
