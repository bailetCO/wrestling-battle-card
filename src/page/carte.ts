// La carte d'un lutteur : portrait, stats, actions et cadre selon la rareté.

import { ACTIONS, NIVEAUX, REGLES, coutAction, niveauCarte, nomLocal, type DefLutteur, type IdAction, type NiveauCarte, type Rarete } from '../moteur';
import { COULEURS_NATION, portraitSVG } from './portrait';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, effetAction } from './textes';

export const NOM_RARETE: Record<NiveauCarte, string> = {
  commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire', champion: 'Champion du Monde',
};
// Styles de carte d'un Champion du Monde (0 = cadre classique, puis 4 styles à débloquer).
export const STYLES_CARTE = ['Ceinture', 'Or massif', 'Nuit étoilée', 'Couleurs de la nation', 'Panthéon'];

export const ORDRE_RARETE: Rarete[] = ['legendaire', 'epique', 'rare', 'commune'];
const GEMMES: Record<NiveauCarte, number> = { commune: 1, rare: 2, epique: 3, legendaire: 4, champion: 5 };

const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let compteur = 0;

// opts : le grade et les étoiles de la carte du joueur (pour afficher déblocages et étoiles).
export function carteHTML(def: DefLutteur, bouton = '', opts: { grade?: number; etoiles?: Partial<Record<IdAction, number>>; style?: number } = {}): string {
  const grade = opts.grade ?? 1;
  // Rareté affichée : celle atteinte par fusion.
  const niveau = opts.grade ? niveauCarte(def, opts.grade) : def.niveau ?? def.rarete;
  const rang = NIVEAUX.indexOf(def.rarete);
  const et = opts.etoiles ?? {};
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
    const etoiles = et[a] ? `<i class="etoiles-action">${'★'.repeat(et[a]!)}</i>` : '';
    return `<li class="${spe}"><span class="ico f-${f}">${ICONE[f]}</span><span>${echap(nomLocal(def.nation, a))}${etoiles}<small class="cl-effet">${effetAction(a)}</small></span><b>${coutAction(def, a)}</b></li>`;
  }).join('');
  const gemmes = '◆'.repeat(GEMMES[niveau]);
  return `
    <article class="carte-l" data-rarete="${niveau}" ${niveau === 'champion' && opts.style ? `data-style="${opts.style}"` : ''} style="--n1:${col.fond};--n2:${col.fond2}">
      <div class="cl-interieur">
        <header class="cl-tete">
          <span class="cl-nom">${echap(def.nom)}</span>
          <span class="cl-rarete" title="${NOM_RARETE[niveau]}">${gemmes}</span>
        </header>
        <div class="cl-portrait">
          ${portraitSVG(def, uid)}
          <span class="cl-nation">${echap(def.origine)}</span>
          <span class="cl-niveau">${NOM_RARETE[niveau]}</span>
        </div>
        <p class="cl-style">${echap(def.style)}</p>
        <div class="cl-stats">
          ${jauge(def.enduranceMax, 100, 'Endurance', String(def.enduranceMax))}
          ${jauge(def.force, 250, 'Force', String(def.force))}
          ${jauge(def.recuperation, 0.6, 'Récupération', `${Math.round(def.recuperation * 100)} %`)}
        </div>
        <ul class="cl-actions">${actions}</ul>
        <p class="cl-deblocages">${def.deblocages.map((a, k) => `<span class="${k < rang + grade - 1 ? 'ouvert' : ''}">${NOM_RARETE[NIVEAUX[k + 1]]} : ${echap(nomLocal(def.nation, a))}</span>`).join('')}</p>
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
  racine.querySelectorAll<HTMLElement>('.carte-l[data-rarete="epique"], .carte-l[data-rarete="legendaire"], .carte-l[data-rarete="champion"]').forEach((c) => {
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
