// La carte d'un lutteur : portrait, stats, actions et cadre selon la rareté.

import { ACTIONS, REGLES, nomLocal, type DefLutteur, type Rarete } from '../moteur';
import { COULEURS_NATION, portraitSVG } from './portrait';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE } from './textes';

export const NOM_RARETE: Record<Rarete, string> = {
  commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire',
};
export const ORDRE_RARETE: Rarete[] = ['legendaire', 'epique', 'rare', 'commune'];
const GEMMES: Record<Rarete, number> = { commune: 1, rare: 2, epique: 3, legendaire: 4 };

const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let compteur = 0;

export function carteHTML(def: DefLutteur, bouton = ''): string {
  const uid = `c${compteur++}`;
  const col = COULEURS_NATION[def.nation];
  const jauge = (val: number, max: number, libelle: string, texte: string) => `
    <div class="cl-stat">
      <span class="cl-stat-lib">${libelle}</span>
      <span class="cl-stat-barre"><i style="width:${Math.min(100, (val / max) * 100)}%"></i></span>
      <b>${texte}</b>
    </div>`;
  const actions = def.actions.map((a) => {
    const f = ACTIONS[a].famille;
    const spe = f === def.familleSpeciale ? ' spe' : '';
    return `<li class="${spe}"><span class="ico f-${f}">${ICONE[f]}</span><span>${echap(nomLocal(def.nation, a))}</span><b>${ACTIONS[a].cout}</b></li>`;
  }).join('');
  const gemmes = '◆'.repeat(GEMMES[def.rarete]);
  return `
    <article class="carte-l" data-rarete="${def.rarete}" style="--n1:${col.fond};--n2:${col.fond2}">
      <div class="cl-interieur">
        <header class="cl-tete">
          <span class="cl-nom">${echap(def.nom)}</span>
          <span class="cl-rarete" title="${NOM_RARETE[def.rarete]}">${gemmes}</span>
        </header>
        <div class="cl-portrait">
          ${portraitSVG(def, uid)}
          <span class="cl-nation">${echap(def.origine)}</span>
          <span class="cl-niveau">${NOM_RARETE[def.rarete]}</span>
        </div>
        <p class="cl-style">${echap(def.style)}</p>
        <div class="cl-stats">
          ${jauge(def.enduranceMax, 100, 'Endurance', String(def.enduranceMax))}
          ${jauge(def.force, 250, 'Force', String(def.force))}
          ${jauge(def.recuperation, 0.6, 'Récupération', `${Math.round(def.recuperation * 100)} %`)}
        </div>
        <ul class="cl-actions">${actions}</ul>
        <p class="cl-spe"><b>★ Spéciale ${NOM_FAMILLE[def.familleSpeciale].toLowerCase()}</b> ${EFFET_SPECIALE[def.familleSpeciale]}
          Dès le tour ${REGLES.speciale.premierTour}, recharge ${REGLES.speciale.toursRecharge} tours.</p>
        ${bouton}
      </div>
      <div class="cl-reflet" aria-hidden="true"></div>
    </article>`;
}

// Reflets holographiques qui suivent le doigt ou la souris (cartes épiques et légendaires).
export function activerReflets(racine: ParentNode) {
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  racine.querySelectorAll<HTMLElement>('.carte-l[data-rarete="epique"], .carte-l[data-rarete="legendaire"]').forEach((c) => {
    c.addEventListener('pointermove', (ev) => {
      const r = c.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      c.style.setProperty('--mx', `${x * 100}%`);
      c.style.setProperty('--my', `${y * 100}%`);
      if (!calme) c.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg)`;
    });
    c.addEventListener('pointerleave', () => {
      c.style.transform = '';
    });
  });
}
