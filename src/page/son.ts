// Sons et vibrations (27/11/2026). Les sons sont fabriqués par le navigateur (Web Audio), style
// arcade : aucun fichier à télécharger, ça marche hors ligne. On pourra les remplacer plus tard par de
// vrais fichiers. Vibrations : Android seulement (les iPhone ne les permettent pas aux pages web).
// Réglages propres à l'appareil (pas dans la sauvegarde) : son oui/non, volume, vibrations oui/non.

export type NomSon =
  | 'clic' | 'action' | 'marque' | 'encaisse' | 'bloque' | 'rate' | 'periode' | 'alerte'
  | 'tombe' | 'victoire' | 'defaite' | 'niveau' | 'palier'
  | 'booster' | 'gain' | 'commune' | 'rare' | 'epique' | 'legendaire' | 'champion';

export type NomVibration = 'marque' | 'encaisse' | 'tombe' | 'victoire' | 'defaite' | 'carteRare';

export interface Reglages { son: boolean; volume: number; vibrations: boolean }
const CLE = 'wbc-son';
const DEFAUT: Reglages = { son: true, volume: 0.7, vibrations: true };

export function reglages(): Reglages {
  try {
    const r = JSON.parse(localStorage.getItem(CLE) ?? 'null') as Partial<Reglages> | null;
    if (!r) return { ...DEFAUT };
    return {
      son: typeof r.son === 'boolean' ? r.son : DEFAUT.son,
      volume: typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 1 ? r.volume : DEFAUT.volume,
      vibrations: typeof r.vibrations === 'boolean' ? r.vibrations : DEFAUT.vibrations,
    };
  } catch { return { ...DEFAUT }; }
}
export function changerReglages(r: Partial<Reglages>) {
  const n = { ...reglages(), ...r };
  try { localStorage.setItem(CLE, JSON.stringify(n)); } catch { /* navigation privée */ }
  return n;
}
export const vibrationsPossibles = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// ---------- Fabrication des sons ----------

let ctx: AudioContext | null = null;
function contexte(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

type Forme = OscillatorType;
// Une note : fréquence (Hz), début et durée (s), forme, volume, glissement de fréquence à la fin.
interface Note { f: number; t: number; d: number; forme?: Forme; v?: number; vers?: number }
// Un bruit (souffle, impact) : début, durée, volume, filtre.
interface Bruit { t: number; d: number; v?: number; filtre?: number; bruit: true }

const NOTE = (n: number) => 440 * 2 ** ((n - 69) / 12); // numéro MIDI → Hz
const arpege = (base: number, intervalles: number[], pas: number, d: number, forme: Forme = 'square', v = 0.25): Note[] =>
  intervalles.map((i, k) => ({ f: NOTE(base + i), t: k * pas, d, forme, v }));

const SONS: Record<NomSon, (Note | Bruit)[]> = {
  clic: [{ f: 1200, t: 0, d: 0.03, forme: 'square', v: 0.08 }],
  action: [{ f: 520, t: 0, d: 0.06, forme: 'triangle', v: 0.2, vers: 780 }],
  marque: [...arpege(72, [0, 4, 7], 0.06, 0.09, 'square', 0.22)],
  encaisse: [{ bruit: true, t: 0, d: 0.18, v: 0.5, filtre: 600 }, { f: 160, t: 0, d: 0.2, forme: 'sawtooth', v: 0.25, vers: 70 }],
  bloque: [{ bruit: true, t: 0, d: 0.08, v: 0.25, filtre: 1500 }, { f: 220, t: 0, d: 0.08, forme: 'square', v: 0.1 }],
  rate: [{ f: 400, t: 0, d: 0.18, forme: 'triangle', v: 0.15, vers: 200 }],
  periode: [{ f: NOTE(76), t: 0, d: 0.25, forme: 'square', v: 0.2 }, { f: NOTE(76), t: 0.32, d: 0.4, forme: 'square', v: 0.2 }],
  alerte: [{ f: 880, t: 0, d: 0.08, forme: 'square', v: 0.12 }, { f: 660, t: 0.12, d: 0.12, forme: 'square', v: 0.12 }],
  tombe: [{ bruit: true, t: 0, d: 0.4, v: 0.7, filtre: 300 }, { f: 90, t: 0, d: 0.45, forme: 'sine', v: 0.6, vers: 40 }, ...arpege(67, [0, 5, 9, 12], 0.08, 0.16, 'square', 0.22).map((n) => ({ ...n, t: n.t + 0.35 }))],
  victoire: [...arpege(72, [0, 4, 7, 12], 0.11, 0.14, 'square', 0.22), { f: NOTE(84), t: 0.44, d: 0.5, forme: 'square', v: 0.22 }, { f: NOTE(76), t: 0.44, d: 0.5, forme: 'triangle', v: 0.18 }],
  defaite: [...arpege(67, [0, -2, -5], 0.2, 0.22, 'triangle', 0.22), { f: NOTE(58), t: 0.6, d: 0.6, forme: 'triangle', v: 0.22, vers: NOTE(55) }],
  niveau: [...arpege(76, [0, 7, 12, 16, 19], 0.07, 0.12, 'square', 0.18)],
  palier: [...arpege(79, [0, 4, 7, 12], 0.09, 0.2, 'triangle', 0.25), { f: NOTE(91), t: 0.36, d: 0.6, forme: 'sine', v: 0.2 }],
  booster: [{ bruit: true, t: 0, d: 0.35, v: 0.35, filtre: 3000 }, { f: 300, t: 0, d: 0.3, forme: 'sine', v: 0.15, vers: 1200 }],
  gain: [{ f: NOTE(88), t: 0, d: 0.06, forme: 'square', v: 0.15 }, { f: NOTE(93), t: 0.07, d: 0.18, forme: 'square', v: 0.15 }],
  commune: [{ f: NOTE(79), t: 0, d: 0.15, forme: 'triangle', v: 0.2 }],
  rare: [...arpege(79, [0, 7], 0.08, 0.2, 'triangle', 0.22)],
  epique: [...arpege(76, [0, 4, 7, 11], 0.07, 0.25, 'triangle', 0.22)],
  legendaire: [{ bruit: true, t: 0, d: 0.5, v: 0.2, filtre: 5000 }, ...arpege(72, [0, 4, 7, 12, 16, 19], 0.07, 0.3, 'square', 0.18)],
  champion: [{ bruit: true, t: 0, d: 0.3, v: 0.5, filtre: 400 }, ...arpege(67, [0, 7, 12, 16, 19, 24], 0.08, 0.35, 'sawtooth', 0.16), { f: NOTE(91), t: 0.5, d: 0.9, forme: 'square', v: 0.16 }],
};

export function jouer(nom: NomSon, apres = 0) {
  const r = reglages();
  if (!r.son || r.volume <= 0) return;
  const a = contexte();
  if (!a) return;
  const t0 = a.currentTime + 0.01 + apres;
  const sortie = a.createGain();
  sortie.gain.value = r.volume;
  sortie.connect(a.destination);
  for (const n of SONS[nom]) {
    const g = a.createGain();
    const v = n.v ?? 0.2, debut = t0 + n.t, fin = debut + n.d;
    g.gain.setValueAtTime(0.0001, debut);
    g.gain.exponentialRampToValueAtTime(v, debut + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, fin);
    g.connect(sortie);
    if ('bruit' in n) {
      const taille = Math.ceil(a.sampleRate * n.d);
      const tampon = a.createBuffer(1, taille, a.sampleRate);
      const d = tampon.getChannelData(0);
      for (let k = 0; k < taille; k++) d[k] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = tampon;
      const filtre = a.createBiquadFilter();
      filtre.type = 'lowpass';
      filtre.frequency.value = n.filtre ?? 1000;
      src.connect(filtre).connect(g);
      src.start(debut);
      src.stop(fin);
    } else {
      const o = a.createOscillator();
      o.type = n.forme ?? 'square';
      o.frequency.setValueAtTime(n.f, debut);
      if (n.vers) o.frequency.exponentialRampToValueAtTime(n.vers, fin);
      o.connect(g);
      o.start(debut);
      o.stop(fin + 0.02);
    }
  }
}

// ---------- Vibrations ----------

const MOTIFS: Record<NomVibration, number[]> = {
  marque: [25],
  encaisse: [60],
  tombe: [120, 60, 220],
  victoire: [40, 50, 40, 50, 120],
  defaite: [250],
  carteRare: [30, 40, 30, 40, 90],
};
export function vibrer(nom: NomVibration) {
  if (!reglages().vibrations || !vibrationsPossibles()) return;
  try { navigator.vibrate(MOTIFS[nom]); } catch { /* refusé */ }
}

// Son de la carte révélée, selon sa rareté (et vibration à partir d'épique).
export function sonCarte(rarete: 'commune' | 'rare' | 'epique' | 'legendaire' | 'champion') {
  jouer(rarete);
  if (rarete !== 'commune' && rarete !== 'rare') vibrer('carteRare');
}

// Un son de fin une seule fois par combat (l'écran de fin est redessiné après un booster).
const finsJouees = new Set<string>();
export function sonFin(cle: string, gagne: boolean, tombe: boolean) {
  if (finsJouees.has(cle)) return;
  finsJouees.add(cle);
  jouer(gagne ? 'victoire' : 'defaite', tombe ? 0.6 : 0.15);
  vibrer(gagne ? 'victoire' : 'defaite');
}

// Petit clic sur les boutons, tuiles et liens d'écran (les boutons d'action de combat ont leur son).
export function brancherClics(racine: Document = document) {
  racine.addEventListener('click', (ev) => {
    const el = (ev.target as Element | null)?.closest?.('button, a.tuile, a.retour, summary, [data-vue]');
    if (!el || (el as HTMLButtonElement).disabled) return;
    jouer(el.matches('[data-action]') ? 'action' : 'clic');
  }, { capture: true });
}
