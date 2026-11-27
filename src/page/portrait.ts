// Portraits manga provisoires, dessinés en code (SVG).
// Pour mettre une vraie illustration plus tard : renseigner `image` dans APPARENCE
// (chemin d'une image), elle remplacera le dessin.

import type { DefLutteur, Nation, NiveauCarte } from '../moteur';

type Coiffure = 'ras' | 'pics' | 'crete' | 'meche' | 'chauve' | 'boucles' | 'tresses';
type Pilosite = 'aucune' | 'barbe' | 'bouc' | 'moustache';

export interface Apparence {
  peau: string;
  cheveux: string;
  coiffure: Coiffure;
  pilosite: Pilosite;
  casque: boolean; // casque de lutte (protège-oreilles)
  oreille: boolean; // oreille en chou-fleur, signe des vieux lutteurs
  cicatrice: boolean;
  image?: string;
  images?: Partial<Record<NiveauCarte, string>>; // une illustration par niveau de carte (passe devant `image`)
  cadrage?: string; // partie de l'image à garder quand elle est recadrée (object-position CSS)
}

const PEAU = { claire: '#f2cfae', mate: '#dcaa82', doree: '#c98f62', brune: '#91603f', foncee: '#64402a' };
const CHEVEUX = { noir: '#1d1715', brun: '#4a2f22', chatain: '#7a4f2e', blond: '#d8b46a', roux: '#a8492a' };

// Dossier des images (public/), relatif à la page du jeu.
const IMAGES = import.meta.env?.BASE_URL ?? './';

const COCOACH_BASE: Apparence = { peau: '#dcaa82', cheveux: '#4a2f22', coiffure: 'meche', pilosite: 'bouc', casque: false, oreille: true, cicatrice: false };
const CARTES_COCOACH: Partial<Record<NiveauCarte, string>> = Object.fromEntries(
  (['commune', 'rare', 'epique', 'legendaire', 'champion'] as NiveauCarte[]).map((n) => [n, `${IMAGES}cocoach/cartes/${n}.webp`]),
);

// Expressions des personnages des dialogues (Cocoach). Sans expression : « neutre ».
type Humeur = 'neutre' | 'content' | 'malin' | 'vaincu' | 'vainqueur' | 'arrogant' | 'mefiant';
export const PRESENTATION_COCOACH = `${IMAGES}cocoach/cartes/presentation.webp`;

// Portrait d'un personnage des dialogues : Cocoach selon son expression ; Darius (une seule image
// pour l'instant : ses expressions viendront avec les prochaines illustrations).
export function portraitPersonnage(qui: 'darius' | 'cocoach', humeur: Humeur = 'neutre'): string {
  const src = qui === 'cocoach' ? `${IMAGES}cocoach/expressions/${humeur}.webp` : `${IMAGES}darius/coach.webp`;
  return `<img class="portrait-img" src="${src}" alt="${qui === 'cocoach' ? 'Cocoach' : 'Darius'}">`;
}

export const APPARENCE: Record<string, Apparence> = {
  // Personnages des modes histoire : Philippe (le mentor, ancien champion) et Cocoach (le rival).
  // Darius (le mentor) et sa carte secrète : illustrations provisoires tirées du pack ChatGPT
  // (public/darius/ ; pour les changer, remplacer les fichiers, même nom).
  // Cocoach : illustrations provisoires tirées des planches ChatGPT (public/cocoach/ ; pour les
  // changer, remplacer les fichiers, même nom). Le rival prend l'illustration de son niveau ; la carte
  // secrète, celle du Champion. Les cartes portent leur bandeau de rareté en bas (voulu).
  'cocoach-rival': { ...COCOACH_BASE, images: CARTES_COCOACH, cadrage: '50% 22%' },
  cocoach: { ...COCOACH_BASE, image: `${IMAGES}cocoach/cartes/champion.webp`, cadrage: '50% 22%' },
  'cocoach-test': { ...COCOACH_BASE, image: `${IMAGES}cocoach/cartes/presentation.webp`, cadrage: '50% 18%' },
  'perso-darius': { peau: PEAU.brune, cheveux: CHEVEUX.noir, coiffure: 'chauve', pilosite: 'barbe', casque: false, oreille: true, cicatrice: false, image: `${IMAGES}darius/coach.webp` },
  darius: { peau: PEAU.brune, cheveux: CHEVEUX.noir, coiffure: 'chauve', pilosite: 'barbe', casque: false, oreille: true, cicatrice: false, image: `${IMAGES}darius/carte.webp` },
  'perso-cocoach': { peau: PEAU.claire, cheveux: CHEVEUX.brun, coiffure: 'crete', pilosite: 'bouc', casque: false, oreille: true, cicatrice: false, image: `${IMAGES}cocoach/expressions/neutre.webp` },
  usa: { peau: PEAU.claire, cheveux: CHEVEUX.blond, coiffure: 'ras', pilosite: 'aucune', casque: false, oreille: true, cicatrice: false },
  'usa-explosif': { peau: PEAU.brune, cheveux: CHEVEUX.noir, coiffure: 'crete', pilosite: 'aucune', casque: true, oreille: false, cicatrice: false },
  'usa-defenseur': { peau: PEAU.claire, cheveux: CHEVEUX.roux, coiffure: 'pics', pilosite: 'barbe', casque: false, oreille: true, cicatrice: true },
  russie: { peau: PEAU.claire, cheveux: CHEVEUX.chatain, coiffure: 'meche', pilosite: 'aucune', casque: false, oreille: true, cicatrice: false },
  'russie-pression': { peau: PEAU.mate, cheveux: CHEVEUX.noir, coiffure: 'ras', pilosite: 'barbe', casque: false, oreille: true, cicatrice: true },
  'russie-contre': { peau: PEAU.claire, cheveux: CHEVEUX.blond, coiffure: 'pics', pilosite: 'aucune', casque: true, oreille: false, cicatrice: false },
  europe: { peau: PEAU.mate, cheveux: CHEVEUX.brun, coiffure: 'pics', pilosite: 'aucune', casque: false, oreille: false, cicatrice: false },
  'europe-technicien': { peau: PEAU.claire, cheveux: CHEVEUX.chatain, coiffure: 'meche', pilosite: 'bouc', casque: false, oreille: true, cicatrice: false },
  'europe-puissant': { peau: PEAU.mate, cheveux: CHEVEUX.brun, coiffure: 'chauve', pilosite: 'barbe', casque: false, oreille: true, cicatrice: true },
  afrique: { peau: PEAU.foncee, cheveux: CHEVEUX.noir, coiffure: 'ras', pilosite: 'aucune', casque: false, oreille: false, cicatrice: true },
  'afrique-explosif': { peau: PEAU.brune, cheveux: CHEVEUX.noir, coiffure: 'tresses', pilosite: 'aucune', casque: false, oreille: false, cicatrice: false },
  'afrique-defenseur': { peau: PEAU.foncee, cheveux: CHEVEUX.noir, coiffure: 'boucles', pilosite: 'bouc', casque: false, oreille: true, cicatrice: false },
  japon: { peau: PEAU.doree, cheveux: CHEVEUX.noir, coiffure: 'pics', pilosite: 'aucune', casque: false, oreille: false, cicatrice: false },
  'japon-technicien': { peau: PEAU.doree, cheveux: CHEVEUX.noir, coiffure: 'meche', pilosite: 'aucune', casque: true, oreille: false, cicatrice: false },
  'japon-contre': { peau: PEAU.doree, cheveux: CHEVEUX.brun, coiffure: 'crete', pilosite: 'moustache', casque: false, oreille: true, cicatrice: true },
};

// Couleurs de chaque nation : fond du portrait et maillot. Une nation sans couleurs prend les neutres.
type Couleurs = { fond: string; fond2: string; maillot: string; liseré: string };
const NEUTRE: Couleurs = { fond: '#3a4466', fond2: '#1a2038', maillot: '#5a6a9a', liseré: '#ffffff' };
export const COULEURS_NATION: Record<Nation, Couleurs> = new Proxy({
  iran: { fond: '#239f40', fond2: '#0e4a1d', maillot: '#da0000', liseré: '#ffffff' },
  georgie: { fond: '#9b1020', fond2: '#4a0710', maillot: '#ffffff', liseré: '#e8112d' },
  azerbaidjan: { fond: '#0092bc', fond2: '#00455a', maillot: '#e4002b', liseré: '#00af66' },
  turquie: { fond: '#c8102e', fond2: '#5e0715', maillot: '#ffffff', liseré: '#e30a17' },
  ouzbekistan: { fond: '#0099b5', fond2: '#004a59', maillot: '#1eb53a', liseré: '#ffffff' },
  kazakhstan: { fond: '#00afca', fond2: '#005866', maillot: '#fec50c', liseré: '#00afca' },
  kirghizistan: { fond: '#e8112d', fond2: '#6b0814', maillot: '#ffef00', liseré: '#e8112d' },
  usa: { fond: '#1f3a7a', fond2: '#0c1c45', maillot: '#c8283a', liseré: '#ffffff' },
  russie: { fond: '#2a5fb0', fond2: '#13305e', maillot: '#d42f2f', liseré: '#ffffff' },
  europe: { fond: '#1d4ea0', fond2: '#0d2557', maillot: '#1a49a8', liseré: '#f5c518' },
  afrique: { fond: '#14804a', fond2: '#0a3f25', maillot: '#f2c230', liseré: '#d33a2c' },
  japon: { fond: '#b3203a', fond2: '#5a0d1c', maillot: '#f4f4f4', liseré: '#c51f35' },
} as Record<Nation, Couleurs>, { get: (t, k: string) => t[k] ?? NEUTRE });

// Apparence d'un lutteur : celle définie ci-dessus, sinon une apparence tirée de son identifiant
// (toujours la même pour un même lutteur), avec des teintes plausibles pour sa nation.
const TEINTES: Record<string, (keyof typeof PEAU)[]> = {
  usa: ['claire', 'mate', 'brune', 'foncee'], russie: ['claire', 'claire', 'mate'], japon: ['doree'],
  afrique: ['foncee', 'brune', 'foncee'], europe: ['claire', 'mate', 'claire', 'brune'],
  iran: ['mate', 'doree'], georgie: ['claire', 'mate'], azerbaidjan: ['mate', 'claire'], turquie: ['mate', 'claire', 'doree'],
  ouzbekistan: ['mate', 'doree'], kazakhstan: ['doree', 'mate'], kirghizistan: ['doree', 'mate'],
};
const COIFFURES: Coiffure[] = ['ras', 'pics', 'crete', 'meche', 'chauve', 'boucles', 'tresses'];
const PILOSITES: Pilosite[] = ['aucune', 'aucune', 'barbe', 'bouc', 'moustache'];
export function apparenceDe(def: DefLutteur): Apparence {
  if (APPARENCE[def.id]) return APPARENCE[def.id];
  let x = 0;
  for (const c of def.id) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  const tire = <T,>(liste: T[]) => { x = (x * 1103515245 + 12345) >>> 0; return liste[(x >>> 8) % liste.length]; };
  const peau = PEAU[tire(TEINTES[def.nation] ?? ['claire', 'mate', 'doree', 'brune', 'foncee'])];
  const foncee = peau === PEAU.foncee || peau === PEAU.brune;
  return {
    peau,
    cheveux: CHEVEUX[tire<keyof typeof CHEVEUX>(foncee || def.nation === 'japon' ? ['noir'] : ['noir', 'brun', 'brun', 'chatain', 'blond', 'roux'])],
    coiffure: tire(foncee ? COIFFURES : COIFFURES.filter((c) => c !== 'tresses')),
    pilosite: tire(PILOSITES),
    casque: tire([false, false, false, true]),
    oreille: tire([false, true]),
    cicatrice: tire([false, false, true]),
  };
}

// Assombrit une couleur hexadécimale (ombre portée façon manga).
function ombre(hex: string, f = 0.78): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function coiffure(a: Apparence): string {
  const c = a.cheveux;
  switch (a.coiffure) {
    case 'ras':
      return `<path d="M66 82 C64 52 82 40 100 40 C118 40 136 52 134 82 C128 66 116 58 100 58 C84 58 72 66 66 82Z" fill="${c}" opacity=".85"/>`;
    case 'pics':
      return `<path d="M62 86 L60 60 L70 64 L68 42 L82 52 L86 32 L96 48 L104 28 L110 48 L122 34 L122 54 L136 46 L132 66 L140 64 L138 86 C130 70 118 62 100 62 C82 62 70 70 62 86Z" fill="${c}"/>`;
    case 'crete':
      return `<path d="M66 80 C66 58 80 46 100 46 C120 46 134 58 134 80 C126 68 114 62 100 62 C86 62 74 68 66 80Z" fill="${c}" opacity=".45"/>
              <path d="M90 64 L88 30 L96 40 L100 22 L104 40 L112 30 L110 64Z" fill="${c}"/>`;
    case 'meche':
      return `<path d="M64 88 C58 56 78 38 102 38 C124 38 140 52 136 84 C132 72 126 66 120 64 C112 74 96 80 74 78 C70 80 66 84 64 88Z" fill="${c}"/>
              <path d="M84 52 C98 46 116 48 126 58" stroke="${ombre(c, 1.6)}" stroke-width="2" fill="none" opacity=".5"/>`;
    case 'chauve':
      return `<path d="M80 52 C88 46 100 45 108 48" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".45"/>`;
    case 'boucles': {
      const pts = [[70, 66], [80, 54], [92, 48], [104, 47], [116, 50], [127, 58], [133, 70], [66, 78], [134, 80]];
      return `<path d="M66 82 C64 52 82 42 100 42 C118 42 136 52 134 82 C128 68 116 60 100 60 C84 60 72 68 66 82Z" fill="${c}"/>` +
        pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/>`).join('');
    }
    case 'tresses':
      return `<path d="M66 82 C64 52 82 42 100 42 C118 42 136 52 134 82 C128 68 116 60 100 60 C84 60 72 68 66 82Z" fill="${c}"/>` +
        [74, 86, 100, 114, 126].map((x) => `<path d="M${x} 48 L${x + 2} 62" stroke="${ombre(c, 2.4)}" stroke-width="2.5" opacity=".6"/>`).join('');
  }
}

function pilosite(a: Apparence): string {
  const c = a.cheveux;
  switch (a.pilosite) {
    case 'barbe':
      return `<path d="M70 112 C72 138 86 152 100 153 C114 152 128 138 130 112 C124 126 116 134 100 134 C84 134 76 126 70 112Z" fill="${c}"/>
              <path d="M88 126 Q100 120 112 126" stroke="${c}" stroke-width="5" fill="none"/>`;
    case 'bouc':
      return `<path d="M92 136 Q100 152 108 136 Q100 140 92 136Z" fill="${c}"/><path d="M88 125 Q100 120 112 125" stroke="${c}" stroke-width="3" fill="none"/>`;
    case 'moustache':
      return `<path d="M86 126 Q100 118 114 126 Q100 123 86 126Z" fill="${c}" stroke="${c}" stroke-width="2"/>`;
    default:
      return '';
  }
}

// ---------- Morceaux de dessin ----------

const ENCRE = '#120c08';

// La tête du lutteur, dans le repère 200 × 200 du buste (centre du visage vers 100, 95).
function tete(a: Apparence, uid: string): string {
  const p = a.peau;
  const po = ombre(p);
  const oreilleG = a.oreille
    ? `<path d="M64 88 C54 84 52 100 56 110 C60 116 66 112 66 106 C58 104 60 94 64 96Z" fill="${p}" stroke="${po}" stroke-width="2"/><path d="M58 96 Q62 100 59 106" stroke="${po}" stroke-width="2" fill="none"/>`
    : `<ellipse cx="62" cy="100" rx="6" ry="11" fill="${p}" stroke="${po}" stroke-width="1.5"/>`;
  const oreilleD = `<ellipse cx="138" cy="100" rx="6" ry="11" fill="${po}"/>`;
  const casque = a.casque
    ? `<g fill="#20232b" stroke="#454a57" stroke-width="2"><ellipse cx="60" cy="101" rx="12" ry="16"/><ellipse cx="140" cy="101" rx="12" ry="16"/></g>
       <g fill="#5d6373">${[[60, 95], [60, 103], [56, 99], [64, 99], [60, 111], [140, 95], [140, 103], [136, 99], [144, 99], [140, 111]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>
       <path d="M60 86 C64 54 136 54 140 86" stroke="#20232b" stroke-width="6" fill="none"/>
       <path d="M60 116 C70 146 130 146 140 116" stroke="#20232b" stroke-width="4" fill="none"/>`
    : '';
  return `
    <defs><clipPath id="c${uid}"><path d="M66 80 C64 120 80 146 100 151 C120 146 136 120 134 80 C134 46 66 46 66 80Z"/></clipPath></defs>
    ${oreilleG}${oreilleD}
    <path d="M66 80 C64 120 80 146 100 151 C120 146 136 120 134 80 C134 46 66 46 66 80Z" fill="${p}" stroke="${ENCRE}" stroke-width="2.8"/>
    <g clip-path="url(#c${uid})"><path d="M104 40 C122 60 128 100 112 160 L150 160 L150 40Z" fill="${po}"/></g>
    <path d="M82 138 Q100 146 118 138" stroke="${po}" stroke-width="2" fill="none"/>
    <path d="M72 84 L94 92" stroke="${ENCRE}" stroke-width="5" stroke-linecap="round"/>
    <path d="M128 84 L106 92" stroke="${ENCRE}" stroke-width="5" stroke-linecap="round"/>
    <path d="M75 98 L93 95 L90 102 Q82 104 75 98Z" fill="#fff" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M125 98 L107 95 L110 102 Q118 104 125 98Z" fill="#fff" stroke="${ENCRE}" stroke-width="2"/>
    <circle cx="87" cy="98.5" r="2.8" fill="${ENCRE}"/><circle cx="113" cy="98.5" r="2.8" fill="${ENCRE}"/>
    <circle cx="88" cy="97.5" r=".9" fill="#fff" class="eclat"/><circle cx="114" cy="97.5" r=".9" fill="#fff" class="eclat"/>
    <path d="M101 100 L96 117 L104 118" stroke="${ENCRE}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
    <path d="M90 130 L111 128" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M78 110 L82 112 M80 114 L84 116" stroke="${po}" stroke-width="1.6"/>
    ${a.cicatrice ? '<path d="M118 84 L124 104 M117 92 L123 90 M119 98 L125 96" stroke="#7a2b22" stroke-width="1.8"/>' : ''}
    ${pilosite(a)}
    ${coiffure(a)}
    ${casque}`;
}

// Buste : cou, épaules, maillot (même repère que la tête).
function buste(def: DefLutteur, a: Apparence, uid: string, medaille = false): string {
  const col = COULEURS_NATION[def.nation];
  const w = 62 + ((def.force - 140) / 100) * 34; // carrure selon la force
  const p = a.peau;
  const po = ombre(p);
  return `
    <path d="M${100 - w} 200 C${100 - w} 172 ${100 - w * 0.8} 158 84 150 L116 150 C${100 + w * 0.8} 158 ${100 + w} 172 ${100 + w} 200Z" fill="${p}" stroke="${ENCRE}" stroke-width="2.5"/>
    <path d="M${100 + w * 0.15} 152 C${100 + w * 0.7} 160 ${100 + w} 176 ${100 + w} 200 L${100 + w * 0.35} 200Z" fill="${po}"/>
    <path d="M82 128 L82 156 Q100 166 118 156 L118 128Z" fill="${p}" stroke="${ENCRE}" stroke-width="2.5"/>
    <path d="M100 130 L118 128 L118 156 Q110 162 100 163Z" fill="${po}"/>
    <path d="M${100 - w * 0.62} 200 L${100 - w * 0.5} 166 L${100 - w * 0.36} 166 L${100 - w * 0.3} 186 Q100 176 ${100 + w * 0.3} 186 L${100 + w * 0.36} 166 L${100 + w * 0.5} 166 L${100 + w * 0.62} 200Z" fill="${col.maillot}" stroke="${ENCRE}" stroke-width="2.5"/>
    <path d="M${100 - w * 0.3} 190 Q100 180 ${100 + w * 0.3} 190" stroke="${col.liseré}" stroke-width="3" fill="none"/>
    ${medaille ? `<path d="M86 152 L100 184 L114 152" fill="none" stroke="#c8102e" stroke-width="5"/><circle cx="100" cy="188" r="10" fill="#ffd76a" stroke="${ENCRE}" stroke-width="2"/><circle cx="100" cy="188" r="6" fill="none" stroke="#b8860b" stroke-width="1.5"/>` : ''}
    ${tete(a, uid)}`;
}

// Une tête simple, pour l'adversaire, le coach et les silhouettes.
function teteSimple(x: number, y: number, r: number, peau: string, cheveux: string, sourire = false): string {
  return `<g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${peau}" stroke="${ENCRE}" stroke-width="1.6"/>
    <path d="M${x - r} ${y - r * 0.1} C${x - r} ${y - r * 1.3} ${x + r} ${y - r * 1.3} ${x + r} ${y - r * 0.1} C${x + r * 0.5} ${y - r * 0.6} ${x - r * 0.5} ${y - r * 0.6} ${x - r} ${y - r * 0.1}Z" fill="${cheveux}"/>
    <circle cx="${x - r * 0.35}" cy="${y + r * 0.1}" r="${r * 0.11}" fill="${ENCRE}"/><circle cx="${x + r * 0.35}" cy="${y + r * 0.1}" r="${r * 0.11}" fill="${ENCRE}"/>
    ${sourire ? `<path d="M${x - r * 0.4} ${y + r * 0.45} Q${x} ${y + r * 0.85} ${x + r * 0.4} ${y + r * 0.45}" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>` : `<path d="M${x - r * 0.3} ${y + r * 0.5} L${x + r * 0.3} ${y + r * 0.5}" stroke="${ENCRE}" stroke-width="1.4"/>`}
  </g>`;
}

type Pt = [number, number];
interface Pose {
  tete: [number, number, number]; // centre de la tête et rotation (degrés)
  cou: Pt; hanche: Pt;
  coudeA: Pt; mainA: Pt; coudeB: Pt; mainB: Pt;
  genouA: Pt; piedA: Pt; genouB: Pt; piedB: Pt;
}

// Un membre : contour noir, puis la couleur.
function membre(pts: Pt[], couleur: string, epaisseur: number): string {
  const d = `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}`;
  return `<path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${epaisseur + 3}" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${d}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Un personnage entier. `teteHTML` : la tête déjà dessinée (dans le repère du buste) ou une tête simple.
function personnage(o: {
  pose: Pose; peau: string; maillot: string; liseré?: string; bas?: string; echelle?: number;
  teteDetaillee?: string; teteSimple?: string; medaille?: boolean;
}): string {
  const { pose: q, peau, maillot } = o;
  const k = o.echelle ?? 1;
  const bas = o.bas ?? maillot; // couleur du short (ou du pantalon du coach)
  const mi = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const jambe = (g: Pt, p: Pt) => membre([q.hanche, g, p], peau, 8 * k) + membre([q.hanche, mi(q.hanche, g)], bas, 9 * k)
    + `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${4.5 * k}" ry="${2.6 * k}" fill="#22252e" stroke="${ENCRE}" stroke-width="1.2"/>`;
  const bras = (c: Pt, m: Pt) => membre([q.cou, c, m], peau, 6 * k);
  const [tx, ty, tr] = q.tete;
  const teteG = o.teteDetaillee
    ? `<g transform="translate(${tx} ${ty}) rotate(${tr}) scale(${0.25 * k}) translate(-100 -98)">${o.teteDetaillee}</g>`
    : o.teteSimple ?? '';
  return `<g>
    ${bras(q.coudeB, q.mainB)}
    ${jambe(q.genouB, q.piedB)}
    ${membre([q.cou, q.hanche], maillot, 17 * k)}
    ${o.liseré ? `<path d="M${q.cou[0]} ${q.cou[1]} L${q.hanche[0]} ${q.hanche[1]}" stroke="${o.liseré}" stroke-width="${2 * k}" opacity=".8"/>` : ''}
    ${jambe(q.genouA, q.piedA)}
    ${o.medaille ? `<circle cx="${(q.cou[0] * 2 + q.hanche[0]) / 3}" cy="${(q.cou[1] * 2 + q.hanche[1]) / 3}" r="${3.6 * k}" fill="#ffd76a" stroke="${ENCRE}" stroke-width="1"/>
      <path d="M${q.cou[0] - 3 * k} ${q.cou[1]} L${(q.cou[0] * 2 + q.hanche[0]) / 3} ${(q.cou[1] * 2 + q.hanche[1]) / 3 - 3 * k} L${q.cou[0] + 3 * k} ${q.cou[1]}" fill="none" stroke="#c8102e" stroke-width="${1.6 * k}"/>` : ''}
    ${teteG}
    ${bras(q.coudeA, q.mainA)}
  </g>`;
}

// Miroir horizontal d'une pose (dans un repère de 200 de large).
function miroir(q: Pose): Pose {
  const m = (p: Pt): Pt => [200 - p[0], p[1]];
  return {
    tete: [200 - q.tete[0], q.tete[1], -q.tete[2]], cou: m(q.cou), hanche: m(q.hanche),
    coudeA: m(q.coudeA), mainA: m(q.mainA), coudeB: m(q.coudeB), mainB: m(q.mainB),
    genouA: m(q.genouA), piedA: m(q.piedA), genouB: m(q.genouB), piedB: m(q.piedB),
  };
}

// Drapeau d'une nation, dans un rectangle.
// Petit drapeau d'une nation, en SVG autonome (arène, listes).
export function drapeauSVG(n: Nation): string {
  return `<svg class="drapeau" viewBox="0 0 30 20" aria-hidden="true">${drapeau(n, 0, 0, 30, 20)}</svg>`;
}

function drapeau(n: Nation, x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2, cy = y + h / 2, m = Math.min(w, h);
  const bandes = (cs: string[]) => cs.map((c, i) => `<rect x="${x}" y="${y + (i * h) / cs.length}" width="${w}" height="${h / cs.length + 0.3}" fill="${c}"/>`).join('');
  switch (n) {
    case 'usa':
      return Array.from({ length: 7 }, (_, i) => `<rect x="${x}" y="${y + (i * h) / 7}" width="${w}" height="${h / 7 + 0.3}" fill="${i % 2 ? '#ffffff' : '#c8283a'}"/>`).join('')
        + `<rect x="${x}" y="${y}" width="${w * 0.45}" height="${h * 0.5}" fill="#1f3a7a"/>`
        + Array.from({ length: 6 }, (_, i) => `<circle cx="${x + w * 0.08 + (i % 3) * w * 0.14}" cy="${y + h * 0.12 + Math.floor(i / 3) * h * 0.2}" r="${w * 0.025}" fill="#fff"/>`).join('');
    case 'russie': return bandes(['#ffffff', '#1c57b5', '#d42f2f']);
    case 'afrique': return bandes(['#14804a', '#f2c230', '#d33a2c']);
    case 'japon':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f7f7f7"/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) * 0.28}" fill="#c51f35"/>`;
    case 'europe':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1d4ea0"/>`
        + Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          const r = Math.min(w, h) * 0.3;
          return `<circle cx="${(x + w / 2 + Math.cos(ang) * r).toFixed(1)}" cy="${(y + h / 2 + Math.sin(ang) * r).toFixed(1)}" r="${Math.min(w, h) * 0.035}" fill="#f5c518"/>`;
        }).join('');
    case 'iran':
      return bandes(['#239f40', '#ffffff', '#da0000']) + `<circle cx="${cx}" cy="${cy}" r="${m * 0.1}" fill="none" stroke="#da0000" stroke-width="${m * 0.03}"/>`;
    case 'georgie':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>`
        + `<rect x="${cx - m * 0.08}" y="${y}" width="${m * 0.16}" height="${h}" fill="#e8112d"/><rect x="${x}" y="${cy - m * 0.08}" width="${w}" height="${m * 0.16}" fill="#e8112d"/>`
        + [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].map(([fx, fy]) => croix(x + w * fx, y + h * fy, m * 0.08, '#e8112d')).join('');
    case 'azerbaidjan':
      return bandes(['#0092bc', '#e4002b', '#00af66']) + croissant(cx, cy, m * 0.12, '#e4002b');
    case 'turquie':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e30a17"/>` + croissant(x + w * 0.4, cy, m * 0.25, '#e30a17');
    case 'ouzbekistan':
      return bandes(['#0099b5', '#ffffff', '#1eb53a'])
        + `<rect x="${x}" y="${y + h / 3 - h * 0.02}" width="${w}" height="${h * 0.03}" fill="#ce1126"/><rect x="${x}" y="${y + (2 * h) / 3 - h * 0.01}" width="${w}" height="${h * 0.03}" fill="#ce1126"/>`
        + croissant(x + w * 0.15, y + h * 0.16, m * 0.1, '#0099b5');
    case 'kazakhstan':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#00afca"/>` + soleil(cx, cy * 0.98, m * 0.18, '#fec50c');
    case 'kirghizistan':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e8112d"/>` + soleil(cx, cy, m * 0.22, '#ffef00');
    default: {
      // Nation sans drapeau dessiné : ses couleurs en trois bandes.
      const c = COULEURS_NATION[n];
      return bandes([c.fond, c.liseré, c.maillot]);
    }
  }
}

// Petits motifs des drapeaux.
function croix(cx: number, cy: number, t: number, c: string): string {
  return `<rect x="${cx - t * 0.18}" y="${cy - t / 2}" width="${t * 0.36}" height="${t}" fill="${c}"/><rect x="${cx - t / 2}" y="${cy - t * 0.18}" width="${t}" height="${t * 0.36}" fill="${c}"/>`;
}
function croissant(cx: number, cy: number, r: number, fond: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/><circle cx="${cx + r * 0.28}" cy="${cy}" r="${r * 0.8}" fill="${fond}"/>`
    + `<circle cx="${cx + r * 1.05}" cy="${cy}" r="${r * 0.28}" fill="#ffffff"/>`;
}
function soleil(cx: number, cy: number, r: number, c: string): string {
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<path d="M${cx} ${cy} L${(cx + Math.cos(a - 0.08) * r * 1.6).toFixed(1)} ${(cy + Math.sin(a - 0.08) * r * 1.6).toFixed(1)} L${(cx + Math.cos(a + 0.08) * r * 1.6).toFixed(1)} ${(cy + Math.sin(a + 0.08) * r * 1.6).toFixed(1)}Z" fill="${c}"/>`;
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
}

// ---------- Décors ----------

// Salle de lutte : mur, bandeau, et tapis en perspective (repère 200 × 137,5).
function salle(uid: string, tapisY = 96): string {
  return `
    <defs>
      <linearGradient id="m${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2544"/><stop offset="1" stop-color="#31406b"/></linearGradient>
      <radialGradient id="l${uid}" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="200" height="138" fill="url(#m${uid})"/>
    ${[30, 100, 170].map((x) => `<rect x="${x - 18}" y="6" width="36" height="5" rx="2" fill="#fffbe6" opacity=".7"/>`).join('')}
    <rect width="200" height="138" fill="url(#l${uid})"/>
    <rect x="0" y="${tapisY - 26}" width="200" height="10" fill="#c8102e" opacity=".55"/>
    <path d="M0 ${tapisY} H200 V138 H0Z" fill="#1d5fc4"/>
    <path d="M-30 138 Q100 ${tapisY - 4} 230 138" fill="#f07c2a"/>
    <path d="M-5 138 Q100 ${tapisY + 6} 205 138" fill="#2a72d8"/>
    <path d="M70 138 Q100 ${tapisY + 26} 130 138" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>`;
}

// Arène sombre avec projecteurs.
function arene(uid: string, tapisY = 100): string {
  return `
    <defs>
      <linearGradient id="a${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090d1f"/><stop offset="1" stop-color="#1c2550"/></linearGradient>
    </defs>
    <rect width="200" height="138" fill="url(#a${uid})"/>
    ${[20, 60, 140, 180].map((x) => `<path d="M${x} 0 L${x - 22} ${tapisY} L${x + 22} ${tapisY}Z" fill="#fff" opacity=".06"/><circle cx="${x}" cy="3" r="3" fill="#fffbe6"/>`).join('')}
    ${Array.from({ length: 22 }, (_, i) => `<circle cx="${5 + i * 9.2}" cy="${tapisY - 8 - (i % 3) * 3}" r="3.4" fill="#000" opacity=".35"/>`).join('')}
    <path d="M0 ${tapisY} H200 V138 H0Z" fill="#1d5fc4"/>
    <path d="M-40 138 Q100 ${tapisY - 6} 240 138" fill="#f07c2a"/>
    <path d="M-12 138 Q100 ${tapisY + 6} 212 138" fill="#2a72d8"/>`;
}

// ---------- Scènes de la grande carte (repère 200 × 137,5) ----------

const ADVERSAIRE = { peau: '#c98f62', cheveux: '#1d1715' };

function sceneCommune(def: DefLutteur, a: Apparence, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  // Deux lutteurs qui s'entraînent au fond.
  const fond = (x: number, sens: 1 | -1) => {
    const q: Pose = { tete: [x, 66, 0], cou: [x, 72], hanche: [x - 4 * sens, 86], coudeA: [x + 8 * sens, 76], mainA: [x + 13 * sens, 72], coudeB: [x + 6 * sens, 80], mainB: [x + 12 * sens, 80], genouA: [x + 4 * sens, 94], piedA: [x + 2 * sens, 104], genouB: [x - 10 * sens, 94], piedB: [x - 14 * sens, 104] };
    return `<g opacity=".45">${personnage({ pose: q, peau: '#8a7a70', maillot: '#2b2f3a', echelle: 0.55, teteSimple: teteSimple(x, 66, 4.5, '#8a7a70', '#2b2f3a') })}</g>`;
  };
  return `${salle(uid)}${fond(24, 1)}${fond(46, -1)}${fond(160, 1)}${fond(182, -1)}
    <g transform="translate(34 4) scale(.66)">${buste(def, a, uid)}
      <g transform="rotate(-6 100 190)">
        <rect x="62" y="168" width="76" height="52" rx="4" fill="#f4efe2" stroke="${ENCRE}" stroke-width="2.5"/>
        <rect x="62" y="168" width="76" height="12" rx="4" fill="${col.maillot}" stroke="${ENCRE}" stroke-width="2"/>
        <text x="100" y="177.5" text-anchor="middle" font-size="8.5" font-weight="800" fill="${col.liseré === '#ffffff' ? '#fff' : col.liseré}" font-family="Arial, sans-serif" letter-spacing="1">LICENCE</text>
        <rect x="68" y="184" width="16" height="20" fill="${col.fond}" stroke="${ENCRE}" stroke-width="1.2"/>
        <circle cx="76" cy="191" r="4" fill="${a.peau}"/>
        ${[188, 194, 200].map((y) => `<path d="M90 ${y} H130" stroke="#9a9384" stroke-width="2"/>`).join('')}
        <circle cx="62" cy="196" r="7" fill="${a.peau}" stroke="${ENCRE}" stroke-width="2"/>
        <circle cx="138" cy="196" r="7" fill="${a.peau}" stroke="${ENCRE}" stroke-width="2"/>
      </g>
    </g>`;
}

function sceneRare(def: DefLutteur, a: Apparence, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  const garde: Pose = {
    tete: [72, 54, 8], cou: [75, 66], hanche: [66, 94],
    coudeA: [90, 74], mainA: [100, 68], coudeB: [86, 82], mainB: [97, 80],
    genouA: [84, 106], piedA: [80, 126], genouB: [56, 108], piedB: [46, 126],
  };
  const adv = miroir(garde);
  const maillotAdv = col.maillot.toLowerCase() === '#1a49a8' ? '#c8283a' : '#1a49a8';
  return `${salle(uid, 88)}
    <ellipse cx="100" cy="124" rx="74" ry="10" fill="none" stroke="#fff" stroke-width="1.2" opacity=".5"/>
    ${personnage({ pose: adv, peau: ADVERSAIRE.peau, maillot: maillotAdv, teteSimple: teteSimple(adv.tete[0], adv.tete[1], 11, ADVERSAIRE.peau, ADVERSAIRE.cheveux) })}
    ${personnage({ pose: garde, peau: a.peau, maillot: col.maillot, liseré: col.liseré, teteDetaillee: tete(a, uid) })}`;
}

function sceneEpique(def: DefLutteur, a: Apparence, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  const lanceur: Pose = {
    tete: [128, 84, 150], cou: [114, 70], hanche: [86, 92],
    coudeA: [116, 52], mainA: [108, 40], coudeB: [122, 54], mainB: [116, 42],
    genouA: [76, 110], piedA: [66, 128], genouB: [66, 108], piedB: [52, 128],
  };
  const vole: Pose = {
    tete: [150, 64, 150], cou: [140, 52], hanche: [108, 36],
    coudeA: [154, 40], mainA: [164, 34], coudeB: [150, 34], mainB: [158, 26],
    genouA: [92, 20], piedA: [78, 10], genouB: [100, 16], piedB: [92, 4],
  };
  const maillotAdv = col.maillot.toLowerCase() === '#1a49a8' ? '#c8283a' : '#1a49a8';
  return `${arene(uid, 104)}
    <g fill="none" stroke="#fff" stroke-linecap="round" opacity=".55">
      <path d="M60 30 Q110 -10 170 50" stroke-width="2.5" stroke-dasharray="10 6"/>
      <path d="M52 44 Q112 4 176 64" stroke-width="1.5" stroke-dasharray="6 8"/>
    </g>
    ${personnage({ pose: vole, peau: ADVERSAIRE.peau, maillot: maillotAdv, teteSimple: teteSimple(vole.tete[0], vole.tete[1], 10, ADVERSAIRE.peau, ADVERSAIRE.cheveux) })}
    ${personnage({ pose: lanceur, peau: a.peau, maillot: col.maillot, liseré: col.liseré, teteDetaillee: tete(a, uid) })}
    <text x="20" y="30" font-size="15" font-weight="900" fill="#ffd76a" stroke="${ENCRE}" stroke-width="1" font-family="Arial Black, Arial, sans-serif" transform="rotate(-12 20 30)">SOUPLESSE !</text>`;
}

function sceneLegendaire(def: DefLutteur, a: Apparence, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  const saut: Pose = {
    tete: [116, 46, 18], cou: [110, 58], hanche: [92, 78],
    coudeA: [126, 50], mainA: [138, 44], coudeB: [124, 58], mainB: [136, 54],
    genouA: [80, 88], piedA: [66, 82], genouB: [86, 94], piedB: [72, 102],
  };
  const coach: Pose = {
    tete: [158, 50, -4], cou: [158, 62], hanche: [158, 94],
    coudeA: [140, 56], mainA: [134, 44], coudeB: [178, 56], mainB: [186, 44],
    genouA: [152, 112], piedA: [150, 130], genouB: [164, 112], piedB: [168, 130],
  };
  const score = `${8 + (def.nom.length % 5)} - ${def.nom.length % 4}`;
  const nom = def.nom.length > 16 ? def.nom.split(' ').slice(-1)[0] : def.nom;
  return `${arene(uid, 104)}
    <g>
      <rect x="6" y="12" width="68" height="50" rx="4" fill="#050608" stroke="#ffd76a" stroke-width="1.5"/>
      <text x="40" y="22" text-anchor="middle" font-size="6" font-weight="700" fill="#ffd76a" font-family="Arial, sans-serif" letter-spacing=".8">VAINQUEUR</text>
      <text x="40" y="33" text-anchor="middle" font-size="7" font-weight="800" fill="#fff" font-family="Arial, sans-serif">${nom.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
      <text x="40" y="55" text-anchor="middle" font-size="17" font-weight="900" fill="#ff5a3c" font-family="'Courier New', monospace">${score}</text>
    </g>
    <path d="M0 108 H200" stroke="#f07c2a" stroke-width="3"/>
    <g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"><path d="M52 70 H70 M48 80 H66 M54 90 H72"/></g>
    ${personnage({ pose: coach, peau: '#dcaa82', maillot: '#2b2f3a', bas: '#2b2f3a', teteSimple: teteSimple(158, 50, 10, '#dcaa82', '#4a2f22', true) })}
    ${personnage({ pose: saut, peau: a.peau, maillot: col.maillot, liseré: col.liseré, teteDetaillee: tete(a, uid) })}`;
}

function sceneChampion(def: DefLutteur, a: Apparence, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  const podium: Pose = {
    tete: [100, 30, 0], cou: [100, 42], hanche: [100, 66],
    coudeA: [84, 36], mainA: [78, 22], coudeB: [114, 54], mainB: [104, 50],
    genouA: [96, 76], piedA: [95, 86], genouB: [104, 76], piedB: [105, 86],
  };
  const bloc = (x: number, y: number, w: number, n: string, c: string) => `
    <rect x="${x}" y="${y}" width="${w}" height="${138 - y}" fill="${c}" stroke="${ENCRE}" stroke-width="1.6"/>
    <rect x="${x}" y="${y}" width="${w}" height="4" fill="#fff" opacity=".35"/>
    <text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" stroke="${ENCRE}" stroke-width=".8" font-family="Arial Black, Arial, sans-serif">${n}</text>`;
  const confettis = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 37) % 200, y = (i * 23) % 80;
    const c = ['#ffd76a', '#ff5a6e', '#79f2c0', '#6cc8ff', '#fff'][i % 5];
    return `<rect x="${x}" y="${y}" width="3" height="1.6" fill="${c}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`;
  }).join('');
  return `${arene(uid, 96)}
    <path d="M48 0 H152" stroke="#888" stroke-width="2"/>
    <g>
      ${drapeau(def.nation, 52, 0, 96, 58)}
      <rect x="52" y="0" width="96" height="58" fill="url(#pli${uid})" opacity=".35"/>
      <defs><linearGradient id="pli${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset=".25" stop-color="#fff" stop-opacity=".3"/>
        <stop offset=".5" stop-color="#000" stop-opacity=".25"/><stop offset=".75" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient></defs>
      <rect x="52" y="0" width="96" height="58" fill="none" stroke="${ENCRE}" stroke-width="1.2"/>
    </g>
    ${confettis}
    ${bloc(36, 102, 42, '2', '#9aa3b2')}
    ${bloc(122, 110, 42, '3', '#b07a4a')}
    ${bloc(78, 86, 44, '1', '#d9a520')}
    <defs><filter id="g${uid}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#fff6c8" flood-opacity="1"/></filter></defs>
    <g filter="url(#g${uid})" transform="translate(100 86) scale(1.18) translate(-100 -86)">
      ${personnage({ pose: podium, peau: a.peau, maillot: col.maillot, liseré: col.liseré, medaille: true, teteDetaillee: tete(a, uid) })}
    </g>`;
}

// ---------- Décor des petits portraits (buste) ----------

function decorBuste(def: DefLutteur, niveau: NiveauCarte, uid: string): string {
  const col = COULEURS_NATION[def.nation];
  const rayons = (opacite: number) => Array.from({ length: 28 }, (_, i) => {
    const ang = (i / 28) * Math.PI * 2;
    return `<path d="M100 95 L${(100 + Math.cos(ang) * 260).toFixed(0)} ${(95 + Math.sin(ang) * 260).toFixed(0)}" stroke="#fff" stroke-width="${i % 3 === 0 ? 2.5 : 1}" opacity="${opacite}"/>`;
  }).join('');
  switch (niveau) {
    case 'commune':
      return `<rect width="200" height="200" fill="#25305a"/>${[40, 100, 160].map((x) => `<rect x="${x - 20}" y="26" width="40" height="6" rx="2" fill="#fffbe6" opacity=".6"/>`).join('')}
        <rect y="140" width="200" height="60" fill="#1d5fc4"/><path d="M-20 200 Q100 130 220 200" fill="#f07c2a"/>`;
    case 'rare':
      return `<rect width="200" height="200" fill="#1b2544"/><radialGradient id="s${uid}" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <rect width="200" height="200" fill="url(#s${uid})"/><ellipse cx="100" cy="190" rx="130" ry="40" fill="#f07c2a"/><ellipse cx="100" cy="194" rx="104" ry="30" fill="#2a72d8"/>`;
    case 'epique':
      return `<rect width="200" height="200" fill="#2a0f3d"/><g class="aura">${rayons(0.22)}</g>`;
    case 'legendaire':
      return `<rect width="200" height="200" fill="#120c02"/><g class="aura">${rayons(0.2)}</g>
        <rect x="18" y="28" width="56" height="34" rx="3" fill="#050608" stroke="#ffd76a" stroke-width="1.5"/>
        <text x="46" y="52" text-anchor="middle" font-size="16" font-weight="900" fill="#ff5a3c" font-family="'Courier New', monospace">${8 + (def.nom.length % 5)}-${def.nom.length % 4}</text>`;
    case 'champion':
      return `<rect width="200" height="200" fill="#0b1030"/>${drapeau(def.nation, 16, 22, 168, 110)}
        <rect x="16" y="22" width="168" height="110" fill="#000" opacity=".25"/>`;
  }
  return `<rect width="200" height="200" fill="${col.fond}"/>`;
}

// ---------- Portrait ----------

// Dessin complet. `uid` rend les identifiants SVG uniques quand plusieurs portraits sont affichés.
// `niveau` : la rareté atteinte (décor et scène). `scene` : la grande scène de la carte ;
// sinon, le buste sur le décor du niveau (petits portraits, vignettes).
export function portraitSVG(def: DefLutteur, uid: string, opts: { niveau?: NiveauCarte; scene?: boolean } = {}): string {
  const a = apparenceDe(def);
  const src = a?.images?.[opts.niveau ?? def.niveau ?? def.rarete] ?? a?.image;
  if (src) {
    return `<img class="portrait-img" src="${src}" alt="Portrait de ${def.nom}"${a?.cadrage ? ` style="object-position: ${a.cadrage}"` : ''}>`;
  }
  if (!a) return '';
  const niveau = opts.niveau ?? def.niveau ?? def.rarete;
  if (opts.scene) {
    const scenes = { commune: sceneCommune, rare: sceneRare, epique: sceneEpique, legendaire: sceneLegendaire, champion: sceneChampion };
    return `<svg class="portrait-svg scene" viewBox="0 0 200 137.5" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${def.nom}">${scenes[niveau](def, a, uid)}</svg>`;
  }
  return `
  <svg class="portrait-svg" viewBox="16 22 168 178" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Portrait de ${def.nom}">
    <defs><pattern id="t${uid}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.3" fill="#000" opacity=".28"/></pattern></defs>
    ${decorBuste(def, niveau, uid)}
    <rect y="120" width="200" height="80" fill="url(#t${uid})" opacity=".6"/>
    ${buste(def, a, uid, niveau === 'champion')}
  </svg>`;
}
