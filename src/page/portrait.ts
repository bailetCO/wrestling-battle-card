// Portraits manga provisoires, dessinés en code (SVG).
// Pour mettre une vraie illustration plus tard : renseigner `image` dans APPARENCE
// (chemin d'une image), elle remplacera le dessin.

import type { DefLutteur, Nation } from '../moteur';

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
}

const PEAU = { claire: '#f2cfae', mate: '#dcaa82', doree: '#c98f62', brune: '#91603f', foncee: '#64402a' };
const CHEVEUX = { noir: '#1d1715', brun: '#4a2f22', chatain: '#7a4f2e', blond: '#d8b46a', roux: '#a8492a' };

export const APPARENCE: Record<string, Apparence> = {
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

// Couleurs de chaque nation : fond du portrait et maillot.
export const COULEURS_NATION: Record<Nation, { fond: string; fond2: string; maillot: string; liseré: string }> = {
  usa: { fond: '#1f3a7a', fond2: '#0c1c45', maillot: '#c8283a', liseré: '#ffffff' },
  russie: { fond: '#2a5fb0', fond2: '#13305e', maillot: '#d42f2f', liseré: '#ffffff' },
  europe: { fond: '#1d4ea0', fond2: '#0d2557', maillot: '#1a49a8', liseré: '#f5c518' },
  afrique: { fond: '#14804a', fond2: '#0a3f25', maillot: '#f2c230', liseré: '#d33a2c' },
  japon: { fond: '#b3203a', fond2: '#5a0d1c', maillot: '#f4f4f4', liseré: '#c51f35' },
};

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

// Dessin complet. `uid` rend les identifiants SVG uniques quand plusieurs portraits sont affichés.
export function portraitSVG(def: DefLutteur, uid: string): string {
  const a = APPARENCE[def.id];
  const col = COULEURS_NATION[def.nation];
  if (a?.image) {
    return `<img class="portrait-img" src="${a.image}" alt="Portrait de ${def.nom}">`;
  }
  if (!a) return '';
  const w = 62 + ((def.force - 140) / 100) * 34; // carrure selon la force
  const p = a.peau;
  const po = ombre(p);
  const rayons = Array.from({ length: 28 }, (_, i) => {
    const ang = (i / 28) * Math.PI * 2;
    const x = 100 + Math.cos(ang) * 260;
    const y = 95 + Math.sin(ang) * 260;
    return `<path d="M100 95 L${x.toFixed(0)} ${y.toFixed(0)}" stroke="#fff" stroke-width="${i % 3 === 0 ? 2.5 : 1}" opacity=".16"/>`;
  }).join('');
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
  <svg class="portrait-svg" viewBox="16 22 168 178" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Portrait de ${def.nom}">
    <defs>
      <linearGradient id="f${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col.fond}"/><stop offset="1" stop-color="${col.fond2}"/></linearGradient>
      <pattern id="t${uid}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.3" fill="#000" opacity=".28"/></pattern>
      <clipPath id="c${uid}"><path d="M66 80 C64 120 80 146 100 151 C120 146 136 120 134 80 C134 46 66 46 66 80Z"/></clipPath>
    </defs>
    <rect width="200" height="200" fill="url(#f${uid})"/>
    <g class="aura">${rayons}</g>
    <rect y="120" width="200" height="80" fill="url(#t${uid})"/>
    <path d="M${100 - w} 200 C${100 - w} 172 ${100 - w * 0.8} 158 84 150 L116 150 C${100 + w * 0.8} 158 ${100 + w} 172 ${100 + w} 200Z" fill="${p}" stroke="#120c08" stroke-width="2.5"/>
    <path d="M${100 + w * 0.15} 152 C${100 + w * 0.7} 160 ${100 + w} 176 ${100 + w} 200 L${100 + w * 0.35} 200Z" fill="${po}"/>
    <path d="M82 128 L82 156 Q100 166 118 156 L118 128Z" fill="${p}" stroke="#120c08" stroke-width="2.5"/>
    <path d="M100 130 L118 128 L118 156 Q110 162 100 163Z" fill="${po}"/>
    <path d="M${100 - w * 0.62} 200 L${100 - w * 0.5} 166 L${100 - w * 0.36} 166 L${100 - w * 0.3} 186 Q100 176 ${100 + w * 0.3} 186 L${100 + w * 0.36} 166 L${100 + w * 0.5} 166 L${100 + w * 0.62} 200Z" fill="${col.maillot}" stroke="#120c08" stroke-width="2.5"/>
    <path d="M${100 - w * 0.3} 190 Q100 180 ${100 + w * 0.3} 190" stroke="${col.liseré}" stroke-width="3" fill="none"/>
    ${oreilleG}${oreilleD}
    <path d="M66 80 C64 120 80 146 100 151 C120 146 136 120 134 80 C134 46 66 46 66 80Z" fill="${p}" stroke="#120c08" stroke-width="2.8"/>
    <g clip-path="url(#c${uid})"><path d="M104 40 C122 60 128 100 112 160 L150 160 L150 40Z" fill="${po}"/></g>
    <path d="M82 138 Q100 146 118 138" stroke="${po}" stroke-width="2" fill="none"/>
    <path d="M72 84 L94 92" stroke="#120c08" stroke-width="5" stroke-linecap="round"/>
    <path d="M128 84 L106 92" stroke="#120c08" stroke-width="5" stroke-linecap="round"/>
    <path d="M75 98 L93 95 L90 102 Q82 104 75 98Z" fill="#fff" stroke="#120c08" stroke-width="2"/>
    <path d="M125 98 L107 95 L110 102 Q118 104 125 98Z" fill="#fff" stroke="#120c08" stroke-width="2"/>
    <circle cx="87" cy="98.5" r="2.8" fill="#120c08"/><circle cx="113" cy="98.5" r="2.8" fill="#120c08"/>
    <circle cx="88" cy="97.5" r=".9" fill="#fff" class="eclat"/><circle cx="114" cy="97.5" r=".9" fill="#fff" class="eclat"/>
    <path d="M101 100 L96 117 L104 118" stroke="#120c08" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
    <path d="M90 130 L111 128" stroke="#120c08" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M78 110 L82 112 M80 114 L84 116" stroke="${po}" stroke-width="1.6"/>
    ${a.cicatrice ? '<path d="M118 84 L124 104 M117 92 L123 90 M119 98 L125 96" stroke="#7a2b22" stroke-width="1.8"/>' : ''}
    ${pilosite(a)}
    ${coiffure(a)}
    ${casque}
  </svg>`;
}
