// L'arbitre lève le bras du vainqueur (28/11/2026) : le même dessin pour tous, seule la couleur des
// maillots change (rouge : le joueur, bleu : l'adversaire). Le vainqueur est toujours à gauche.

const COULEUR = { rouge: '#d63a3a', bleu: '#2f6fc0' } as const;

export function dessinArbitre(gagnant: 'rouge' | 'bleu'): string {
  const g = COULEUR[gagnant], p = COULEUR[gagnant === 'rouge' ? 'bleu' : 'rouge'];
  const peau = '#e9b98a', trait = '#120a06';
  const lutteur = (x: number, couleur: string, tete: number) => `
    <g stroke="${trait}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <rect x="${x - 14}" y="168" width="11" height="66" rx="5" fill="${peau}"/>
      <rect x="${x + 3}" y="168" width="11" height="66" rx="5" fill="${peau}"/>
      <path d="M${x - 22} 96 Q${x} 84 ${x + 22} 96 L${x + 17} 174 L${x - 17} 174 Z" fill="${couleur}"/>
      <circle cx="${x}" cy="${tete}" r="17" fill="${peau}"/>
    </g>`;
  return `
<svg class="arbitre-svg" viewBox="0 0 300 250" role="img" aria-label="L'arbitre lève le bras du vainqueur">
  <defs><pattern id="rayures" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#111"/><rect x="5" width="5" height="10" fill="#fff"/></pattern></defs>
  <ellipse cx="150" cy="238" rx="140" ry="9" fill="rgba(0,0,0,.25)"/>
  ${lutteur(78, g, 70)}
  <g stroke="${trait}" stroke-width="4" stroke-linecap="round"><line x1="58" y1="100" x2="46" y2="160" stroke="${peau}" stroke-width="10"/></g>
  ${lutteur(224, p, 80)}
  <g stroke="${peau}" stroke-width="10" stroke-linecap="round"><line x1="204" y1="102" x2="198" y2="162"/><line x1="244" y1="102" x2="250" y2="162"/></g>
  <g stroke="${trait}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <rect x="135" y="160" width="13" height="74" rx="4" fill="#1b1b1b"/>
    <rect x="152" y="160" width="13" height="74" rx="4" fill="#1b1b1b"/>
    <rect x="128" y="84" width="44" height="82" rx="10" fill="url(#rayures)"/>
    <circle cx="150" cy="64" r="16" fill="${peau}"/>
    <line x1="170" y1="92" x2="182" y2="148" stroke="${peau}" stroke-width="10"/>
  </g>
  <g class="bras-vainqueur"><line x1="98" y1="100" x2="118" y2="34" stroke="${peau}" stroke-width="10" stroke-linecap="round"/></g>
  <g class="bras-arbitre"><line x1="130" y1="92" x2="121" y2="34" stroke="${peau}" stroke-width="10" stroke-linecap="round"/><circle cx="120" cy="32" r="8" fill="${peau}" stroke="${trait}" stroke-width="3"/></g>
</svg>`;
}
