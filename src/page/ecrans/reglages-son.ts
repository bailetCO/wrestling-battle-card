// Réglages du son et des vibrations (27/11/2026) : bouton 🔊 sur l'écran de combat (coupe ou remet le
// son d'un geste) et fenêtre « Son et vibrations » sous « Plus » (son, volume, vibrations).

import { changerReglages, jouer, reglages, vibrationsPossibles, vibrer } from '../son';
import { ouvrirFenetre } from './combat';

const icone = () => (reglages().son ? '🔊' : '🔇');

export const boutonSon = () =>
  `<button class="bouton-son" data-son aria-label="${reglages().son ? 'Couper le son' : 'Remettre le son'}">${icone()}</button>`;

export function brancherBoutonSon(racine: ParentNode) {
  racine.querySelector<HTMLButtonElement>('[data-son]')?.addEventListener('click', (ev) => {
    const b = ev.currentTarget as HTMLButtonElement;
    const r = changerReglages({ son: !reglages().son });
    b.textContent = icone();
    b.setAttribute('aria-label', r.son ? 'Couper le son' : 'Remettre le son');
  });
}

export function fenetreReglagesSon() {
  const r = reglages();
  const f = ouvrirFenetre(`
    <h2>Son et vibrations</h2>
    <label class="reglage-ligne"><input type="checkbox" data-r-son ${r.son ? 'checked' : ''}> Son</label>
    <label class="reglage-volume">Volume <input type="range" min="0" max="100" step="5" value="${Math.round(r.volume * 100)}" data-r-volume></label>
    <label class="reglage-ligne"><input type="checkbox" data-r-vib ${r.vibrations ? 'checked' : ''} ${vibrationsPossibles() ? '' : 'disabled'}> Vibrations</label>
    ${vibrationsPossibles() ? '' : '<p class="note">Ce téléphone ou ce navigateur ne permet pas les vibrations (c\'est le cas des iPhone).</p>'}
    <button class="secondaire" data-r-essai>Essayer</button>
    <p class="note">Astuce : en combat, le bouton 🔊 coupe ou remet le son d'un geste.</p>
    <button class="lien" data-fermer>Fermer</button>`, true);
  f.querySelector<HTMLInputElement>('[data-r-son]')!.addEventListener('change', (ev) => changerReglages({ son: (ev.target as HTMLInputElement).checked }));
  const vol = f.querySelector<HTMLInputElement>('[data-r-volume]')!;
  vol.addEventListener('input', () => changerReglages({ volume: Number(vol.value) / 100 }));
  vol.addEventListener('change', () => jouer('marque'));
  f.querySelector<HTMLInputElement>('[data-r-vib]')!.addEventListener('change', (ev) => changerReglages({ vibrations: (ev.target as HTMLInputElement).checked }));
  f.querySelector('[data-r-essai]')!.addEventListener('click', () => { jouer('victoire'); vibrer('victoire'); });
}
