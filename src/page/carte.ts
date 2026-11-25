// La carte d'un lutteur : portrait, stats, actions et cadre selon la rareté.

import { ACTIONS, NIVEAUX, REGLES, coutAction, niveauCarte, nomLocal, type DefLutteur, type IdAction, type NiveauCarte, type Rarete } from '../moteur';
import { COULEURS_NATION, portraitSVG } from './portrait';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, effetAction } from './textes';

export const NOM_RARETE: Record<NiveauCarte, string> = {
  commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire', champion: 'Champion du Monde',
};
// Styles de carte d'un Champion du Monde (0 = cadre classique, puis 4 styles à débloquer).
export const STYLES_CARTE = ['Ceinture', 'Or massif', 'Nuit étoilée', 'Couleurs de la nation', 'Panthéon'];

// Emblème de chaque style, affiché en filigrane au milieu d'une carte Champion du Monde.
const EMBLEMES: string[] = [
  // Ceinture de champion : bande, plaque centrale et plaques latérales.
  `<rect x="2" y="40" width="96" height="20" rx="6" fill="currentColor" opacity=".55"/>
   <rect x="10" y="36" width="16" height="28" rx="4" fill="currentColor"/>
   <rect x="74" y="36" width="16" height="28" rx="4" fill="currentColor"/>
   <ellipse cx="50" cy="50" rx="24" ry="22" fill="currentColor"/>
   <ellipse cx="50" cy="50" rx="17" ry="15" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2.5"/>
   <path d="M50 39l3.3 7 7.6.8-5.7 5.1 1.6 7.5L50 55.6l-6.8 3.8 1.6-7.5-5.7-5.1 7.6-.8z" fill="#000" fill-opacity=".35"/>`,
  // Or massif : médaille d'or olympique, ruban et couronne de laurier.
  `<path d="M30 4h14l10 30h-14z M70 4H56L46 34h14z" fill="currentColor" opacity=".6"/>
   <circle cx="50" cy="62" r="30" fill="currentColor"/>
   <circle cx="50" cy="62" r="22" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2.5"/>
   <path d="M36 74c-6-6-7-15-3-22 M64 74c6-6 7-15 3-22" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2.5"/>
   <path d="M33 58l-5-2 M34 66l-5 0 M37 72l-4 3 M67 58l5-2 M66 66l5 0 M63 72l4 3" stroke="#000" stroke-opacity=".3" stroke-width="2.5" stroke-linecap="round"/>
   <text x="50" y="69" text-anchor="middle" font-size="20" font-weight="700" fill="#000" fill-opacity=".35" font-family="sans-serif">1</text>`,
  // Nuit étoilée : croissant de lune et étoiles.
  `<path d="M58 14a34 34 0 1 0 28 54A28 28 0 1 1 58 14z" fill="currentColor"/>
   <path d="M78 16l2.4 5 5.4.6-4 3.7 1.1 5.4-4.9-2.7-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z M88 42l1.6 3.3 3.6.4-2.7 2.5.8 3.6-3.3-1.8-3.3 1.8.8-3.6-2.7-2.5 3.6-.4z M66 6l1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.4-2.4 1.4.5-2.7-2-1.9 2.7-.3z" fill="currentColor"/>`,
  // Couleurs de la nation : drapeau qui flotte, aux couleurs du lutteur.
  `<rect x="14" y="10" width="5" height="82" rx="2" fill="currentColor"/>
   <path d="M19 14c14-8 26 8 40 0s24-6 34 0v40c-10-6-20-8-34 0s-26-8-40 0z" fill="var(--n1)" stroke="currentColor" stroke-width="3"/>
   <path d="M19 34c14-8 26 8 40 0s24-6 34 0v20c-10-6-20-8-34 0s-26-8-40 0z" fill="var(--n2)"/>`,
  // Panthéon : temple grec avec fronton et colonnes.
  `<path d="M50 8L6 32h88z" fill="currentColor"/>
   <rect x="8" y="34" width="84" height="6" fill="currentColor"/>
   <path d="M16 44h8v38h-8z M33 44h8v38h-8z M59 44h8v38h-8z M76 44h8v38h-8z" fill="currentColor"/>
   <rect x="4" y="84" width="92" height="8" rx="2" fill="currentColor"/>`,
];

function filigrane(style: number): string {
  return `<svg class="cl-filigrane" viewBox="0 0 100 100" aria-hidden="true">${EMBLEMES[style] ?? EMBLEMES[0]}</svg>`;
}

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
      ${niveau === 'champion' ? filigrane(opts.style ?? 0) : ''}
      ${niveau === 'champion' && opts.style === 2 ? '<div class="etoiles-filantes" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
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
