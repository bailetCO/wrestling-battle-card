// La carte d'un lutteur : portrait, stats, actions et cadre selon la rareté.

import { ACTIONS, NIVEAUX, REGLES, coutAction, niveauCarte, nomLocal, type DefLutteur, type IdAction, type NiveauCarte, type Rarete } from '../moteur';
import { APPARENCE, COULEURS_NATION, portraitSVG } from './portrait';
import { EFFET_SPECIALE, ICONE, NOM_FAMILLE, effetAction } from './textes';

export const NOM_RARETE: Record<NiveauCarte, string> = {
  commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire', champion: 'Champion du Monde',
};
// Styles de carte d'un Champion du Monde (0 = cadre classique, puis 4 styles à débloquer).
export const STYLES_CARTE = ['Ceinture', 'Or massif', 'Nuit étoilée', 'Couleurs de la nation', 'Panthéon'];

// Emblème de chaque style, au premier plan d'une carte Champion du Monde : dessiné avec des
// dégradés métalliques, semi-transparent pour laisser voir la carte dessous.
// `u` rend les identifiants de dégradés uniques pour chaque carte affichée.
function emblemeSVG(style: number, u: string): string {
  const or = `url(#${u}or)`, rouge = `url(#${u}rouge)`, lune = `url(#${u}lune)`, marbre = `url(#${u}marbre)`;
  const defs = `<defs>
    <linearGradient id="${u}or" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7cf"/><stop offset=".35" stop-color="#ffd76a"/>
      <stop offset=".6" stop-color="#b8860b"/><stop offset="1" stop-color="#ffe9a0"/></linearGradient>
    <linearGradient id="${u}rouge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff5a6e"/><stop offset="1" stop-color="#8e0a1e"/></linearGradient>
    <radialGradient id="${u}lune" cx=".35" cy=".35" r=".8">
      <stop offset="0" stop-color="#fffbe6"/><stop offset=".6" stop-color="#ffe38a"/><stop offset="1" stop-color="#c99a2e"/></radialGradient>
    <linearGradient id="${u}marbre" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e8e6f2"/><stop offset="1" stop-color="#b9b6cc"/></linearGradient>
  </defs>`;
  const etoile = (x: number, y: number, r: number, fill: string) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      return `${(x + rr * Math.cos(ang)).toFixed(1)},${(y + rr * Math.sin(ang)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${fill}"/>`;
  };
  const trait = 'stroke="#2a1a00" stroke-opacity=".55" stroke-width="1.5"';
  const dessins = [
    // Ceinture de champion : sangle de cuir, plaques dorées, pierre rouge et étoile.
    `<rect x="2" y="41" width="96" height="18" rx="5" fill="#1b1b22" ${trait}/>
     <path d="M2 45h96M2 55h96" stroke="#ffd76a" stroke-opacity=".5" stroke-dasharray="2 3"/>
     <rect x="8" y="35" width="18" height="30" rx="5" fill="${or}" ${trait}/>
     <rect x="74" y="35" width="18" height="30" rx="5" fill="${or}" ${trait}/>
     <ellipse cx="50" cy="50" rx="26" ry="23" fill="${or}" ${trait}/>
     <ellipse cx="50" cy="50" rx="18" ry="16" fill="${rouge}" ${trait}/>
     ${etoile(50, 50, 11, or)}
     <ellipse cx="42" cy="38" rx="8" ry="3" fill="#fff" opacity=".55"/>`,
    // Or : médaille d'or, ruban rouge, couronne de laurier et « 1 ».
    `<path d="M28 2h16l10 34H38z" fill="${rouge}" ${trait}/><path d="M72 2H56L46 36h16z" fill="${rouge}" ${trait}/>
     <path d="M34 2h4l9 32h-4z M62 2h4l-9 32h-4z" fill="#fff" opacity=".7"/>
     <circle cx="50" cy="64" r="32" fill="${or}" ${trait}/>
     <circle cx="50" cy="64" r="24" fill="none" stroke="#7a5a00" stroke-opacity=".6" stroke-width="2"/>
     ${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="${33 + k * 0.5}" cy="${78 - k * 7}" rx="5" ry="2.4" transform="rotate(${-60 + k * 12} ${33 + k * 0.5} ${78 - k * 7})" fill="#7a5a00" opacity=".55"/>
       <ellipse cx="${67 - k * 0.5}" cy="${78 - k * 7}" rx="5" ry="2.4" transform="rotate(${60 - k * 12} ${67 - k * 0.5} ${78 - k * 7})" fill="#7a5a00" opacity=".55"/>`).join('')}
     <text x="50" y="74" text-anchor="middle" font-size="26" font-weight="800" fill="#7a5a00" fill-opacity=".75" font-family="Georgia, serif">1</text>
     <path d="M30 50a24 24 0 0 1 22-14" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>`,
    // Nuit étoilée : lune dorée avec cratères, entourée d'étoiles.
    `<path d="M60 12a38 38 0 1 0 30 60A32 32 0 1 1 60 12z" fill="${lune}" ${trait}/>
     <circle cx="34" cy="48" r="4" fill="#c99a2e" opacity=".5"/><circle cx="44" cy="72" r="6" fill="#c99a2e" opacity=".45"/><circle cx="28" cy="66" r="2.5" fill="#c99a2e" opacity=".5"/>
     ${etoile(80, 20, 8, or)}${etoile(92, 46, 5, '#fffbe6')}${etoile(70, 6, 4, '#fffbe6')}${etoile(86, 82, 4, or)}`,
    // Couleurs de la nation : drapeau flottant sur un mât doré.
    `<rect x="13" y="12" width="5" height="84" rx="2" fill="${or}" ${trait}/>
     <circle cx="15.5" cy="9" r="5" fill="${or}" ${trait}/>
     <path d="M18 16c14-8 26 8 40 0s24-6 36 0v44c-12-6-22-8-36 0s-26-8-40 0z" fill="var(--n1)" ${trait}/>
     <path d="M18 31c14-8 26 8 40 0s24-6 36 0v14c-12-6-22-8-36 0s-26-8-40 0z" fill="var(--n2)"/>
     <path d="M18 16c14-8 26 8 40 0s24-6 36 0v44c-12-6-22-8-36 0s-26-8-40 0z" fill="url(#${u}pli)" opacity=".5"/>
     <defs><linearGradient id="${u}pli" x1="0" y1="0" x2="1" y2="0">
       <stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".3" stop-color="#fff" stop-opacity=".5"/>
       <stop offset=".5" stop-color="#000" stop-opacity=".3"/><stop offset=".75" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>`,
    // Panthéon : temple de marbre, fronton doré, colonnes cannelées, marches.
    `<path d="M50 6L4 30h92z" fill="${or}" ${trait}/>
     <path d="M50 13L20 27h60z" fill="#fff" opacity=".35"/>
     <rect x="8" y="31" width="84" height="7" fill="${marbre}" ${trait}/>
     ${[14, 31, 59, 76].map((x) => `<rect x="${x}" y="40" width="10" height="40" fill="${marbre}" ${trait}/>
       <path d="M${x + 3} 42v36M${x + 7} 42v36" stroke="#9a96b0" stroke-width="1"/>`).join('')}
     <rect x="6" y="81" width="88" height="6" fill="${marbre}" ${trait}/>
     <rect x="2" y="88" width="96" height="7" rx="1.5" fill="${or}" ${trait}/>`,
  ];
  return `<svg class="cl-filigrane" viewBox="0 0 100 100" aria-hidden="true">${defs}${dessins[style] ?? dessins[0]}</svg>`;
}

export const ORDRE_RARETE: Rarete[] = ['legendaire', 'epique', 'rare', 'commune'];
const GEMMES: Record<NiveauCarte, number> = { commune: 1, rare: 2, epique: 3, legendaire: 4, champion: 5 };

const echap = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let compteur = 0;

// opts : le grade et les étoiles de la carte du joueur (pour afficher déblocages et étoiles).
export function carteHTML(def: DefLutteur, bouton = '', opts: { grade?: number; etoiles?: Partial<Record<IdAction, number>>; style?: number; cadre?: { texte: string; division: string } | null } = {}): string {
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
  // Cartes secrètes : « pleine illustration », l'image couvre toute la carte et les textes passent dessus.
  const pleine = APPARENCE[def.id]?.pleine;
  return `
    <article class="carte-l${pleine ? ' pleine' : ''}${opts.cadre ? ` cadre-saison d-${opts.cadre.division}` : ''}" data-rarete="${niveau}" ${niveau === 'champion' && opts.style ? `data-style="${opts.style}"` : ''} style="--n1:${col.fond};--n2:${col.fond2}">
      ${opts.cadre ? `<span class="ruban-saison">${opts.cadre.texte}</span>` : ''}
      <div class="cl-interieur">
        ${pleine ? `<img class="cl-fond" src="${pleine}" alt="" aria-hidden="true">` : ''}
        <header class="cl-tete">
          <span class="cl-nom">${echap(def.nom)}</span>
          <span class="cl-rarete" title="${NOM_RARETE[niveau]}">${gemmes}</span>
        </header>
        <div class="cl-portrait">
          ${pleine ? '' : portraitSVG(def, uid, { niveau, scene: true })}
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
        <p class="cl-deblocages">${def.deblocages.map((a, k) => `<span class="${k < rang + grade - 1 ? 'ouvert' : ''}">${NOM_RARETE[NIVEAUX[k + 1]]} : ${echap(nomLocal(def.nation, a))}</span>`).join('')}${def.actionChampion ? `<span class="${niveau === 'champion' ? 'ouvert' : ''} action-champion">★ Action de Champion : ${echap(nomLocal(def.nation, def.actionChampion))}</span>` : ''}</p>
        <p class="cl-spe"><b>★ Spéciale ${NOM_FAMILLE[def.familleSpeciale].toLowerCase()}</b> ${EFFET_SPECIALE[def.familleSpeciale]}
          Dès le tour ${REGLES.speciale.premierTour}, recharge ${REGLES.speciale.toursRecharge} tours.</p>
        ${bouton}
      </div>
      ${niveau === 'champion' ? emblemeSVG(opts.style ?? 0, uid) : ''}
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
