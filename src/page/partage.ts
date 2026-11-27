// Moments à partager (27/11/2026) : une affiche façon manga (format story, 1080 × 1920) dessinée
// à la volée, puis le menu de partage du téléphone (WhatsApp, Instagram, Messenger…) avec un
// texte et le lien simple du jeu. Sans menu de partage (ordinateur) : l'image est téléchargée.
// Moments : victoire par tombé, exploits de progression (nation battue, podium ou titre, médaille
// d'or olympique, Cocoach battu à un nouveau niveau), carte légendaire obtenue, carte secrète.

import { NIVEAUX, type DefLutteur, type NiveauCarte } from '../moteur';
import { NOM_RARETE } from './carte';
import { portraitSVG } from './portrait';

export const LIEN_JEU = 'https://bailetco.github.io/wrestling-battle-card/';

export interface Moment {
  titre: string; // le grand titre façon manga : « TOMBÉ ! », « LÉGENDAIRE ! »…
  sousTitre: string; // une phrase : ce qui s'est passé
  def: DefLutteur; // le lutteur à l'honneur
  niveau?: NiveauCarte; // rareté affichée (sinon celle de la carte)
  coach: string; // pseudo du joueur
  texte: string; // texte du message partagé (le lien est ajouté)
}

const COULEUR_RARETE: Record<NiveauCarte, string> = {
  commune: '#c8cfda', rare: '#9fd0ff', epique: '#e2b8ff', legendaire: '#ffd76a', champion: '#ff5a3c',
};
const POLICE = '"Roboto Condensed", "Arial Narrow", Arial, sans-serif';

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ko(new Error(`Image introuvable : ${src}`));
    im.src = src;
  });
}

// L'illustration du lutteur : son image (Darius, Cocoach…) ou son portrait dessiné en code.
async function imageLutteur(def: DefLutteur, niveau: NiveauCarte): Promise<{ im: HTMLImageElement; liberer?: () => void }> {
  const html = portraitSVG(def, 'partage', { niveau });
  const src = /<img[^>]*src="([^"]+)"/.exec(html)?.[1];
  if (src) return { im: await chargerImage(src) };
  const svg = html.trim().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" ');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  return { im: await chargerImage(url), liberer: () => URL.revokeObjectURL(url) };
}

// Dessine l'image dans un rectangle, recadrée pour le remplir (comme « object-fit: cover »).
function couvrir(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, l: number, h: number, hautDeLImage = 0.15) {
  const echelle = Math.max(l / im.width, h / im.height);
  const lw = im.width * echelle, lh = im.height * echelle;
  ctx.drawImage(im, x + (l - lw) / 2, y + (h - lh) * hautDeLImage, lw, lh);
}

function rectArrondi(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

// Texte qui tient dans une largeur : la taille baisse s'il le faut.
function texteAjuste(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, largeur: number, taille: number, poids = 800) {
  let s = taille;
  do { ctx.font = `${poids} ${s}px ${POLICE}`; s -= 4; } while (ctx.measureText(t).width > largeur && s > 20);
  ctx.fillText(t, x, y);
}

// Découpe une phrase en lignes d'une largeur donnée.
function lignes(ctx: CanvasRenderingContext2D, t: string, largeur: number): string[] {
  const mots = t.split(' ');
  const res: string[] = [];
  let l = '';
  for (const m of mots) {
    const essai = l ? `${l} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && l) { res.push(l); l = m; } else l = essai;
  }
  if (l) res.push(l);
  return res;
}

export async function creerAffiche(m: Moment): Promise<HTMLCanvasElement> {
  const L = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = L; c.height = H;
  const ctx = c.getContext('2d')!;
  await document.fonts?.load(`800 100px ${POLICE}`).catch(() => {});
  const niveau = m.niveau ?? m.def.niveau ?? m.def.rarete;
  const couleur = COULEUR_RARETE[niveau];

  // Fond : bleu nuit, rayons façon manga.
  const fond = ctx.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, '#0e2a5a'); fond.addColorStop(1, '#071636');
  ctx.fillStyle = fond; ctx.fillRect(0, 0, L, H);
  ctx.save();
  ctx.translate(L / 2, 760);
  for (let k = 0; k < 36; k++) {
    ctx.rotate((Math.PI * 2) / 36);
    ctx.fillStyle = k % 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,215,106,.07)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1600); ctx.lineTo(90, -1600); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Grand titre, penché, contour noir.
  ctx.save();
  ctx.translate(L / 2, 250); ctx.rotate(-0.06);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let taille = 190;
  do { ctx.font = `italic 900 ${taille}px ${POLICE}`; taille -= 6; } while (ctx.measureText(m.titre).width > L - 120 && taille > 60);
  ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = '#120a06'; ctx.strokeText(m.titre, 0, 0);
  ctx.fillStyle = '#e8393f'; ctx.fillText(m.titre, 0, 0);
  ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.strokeText(m.titre, 0, 0);
  ctx.restore();

  // La carte : cadre de la rareté, illustration, nom et rareté.
  const cx = 150, cy = 430, cl = L - 300, ch = 1000;
  ctx.save();
  ctx.shadowColor = couleur; ctx.shadowBlur = 60;
  rectArrondi(ctx, cx - 16, cy - 16, cl + 32, ch + 32, 44); ctx.fillStyle = couleur; ctx.fill();
  ctx.restore();
  rectArrondi(ctx, cx, cy, cl, ch, 32); ctx.fillStyle = '#101d3a'; ctx.fill();
  const { im, liberer } = await imageLutteur(m.def, niveau).catch(() => ({ im: null as unknown as HTMLImageElement, liberer: undefined }));
  ctx.save();
  rectArrondi(ctx, cx + 24, cy + 110, cl - 48, ch - 250, 18); ctx.clip();
  ctx.fillStyle = '#1d2f5c'; ctx.fillRect(cx + 24, cy + 110, cl - 48, ch - 250);
  if (im) couvrir(ctx, im, cx + 24, cy + 110, cl - 48, ch - 250);
  ctx.restore();
  liberer?.();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
  texteAjuste(ctx, m.def.nom, cx + 30, cy + 82, cl - 220, 66);
  ctx.textAlign = 'right'; ctx.fillStyle = couleur;
  ctx.font = `700 44px ${POLICE}`;
  ctx.fillText('◆'.repeat(NIVEAUX.indexOf(niveau) + 1), cx + cl - 30, cy + 78);
  ctx.textAlign = 'left'; ctx.fillStyle = '#c9d6f2';
  ctx.font = `600 40px ${POLICE}`;
  ctx.fillText(m.def.origine, cx + 30, cy + ch - 80);
  ctx.textAlign = 'right'; ctx.fillStyle = couleur;
  ctx.font = `800 44px ${POLICE}`;
  ctx.fillText(NOM_RARETE[niveau].toUpperCase(), cx + cl - 30, cy + ch - 80);

  // Ce qui s'est passé, et le coach.
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = `700 54px ${POLICE}`;
  lignes(ctx, m.sousTitre, L - 160).slice(0, 3).forEach((l, k) => ctx.fillText(l, L / 2, 1560 + k * 66));
  ctx.fillStyle = '#ffd76a';
  ctx.font = `800 50px ${POLICE}`;
  ctx.fillText(`Coach ${m.coach}`, L / 2, 1760);

  // Le jeu.
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = `italic 900 46px ${POLICE}`;
  ctx.fillText('WRESTLING BATTLE CARD', L / 2, 1850);
  ctx.fillStyle = '#9fb3dc';
  ctx.font = `500 30px ${POLICE}`;
  ctx.fillText(LIEN_JEU.replace('https://', '').replace(/\/$/, ''), L / 2, 1895);
  return c;
}

// Partage l'affiche : menu de partage du téléphone, sinon téléchargement de l'image.
export async function partager(m: Moment): Promise<'partage' | 'telechargement' | 'annule'> {
  const c = await creerAffiche(m);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) return 'annule';
  const fichier = new File([blob], `wrestling-battle-card-${Date.now()}.png`, { type: 'image/png' });
  const texte = `${m.texte} ${LIEN_JEU}`;
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: 'Wrestling Battle Card', text: texte });
      return 'partage';
    } catch {
      return 'annule'; // le joueur a fermé le menu de partage
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fichier.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'telechargement';
}

// Le bouton, et son branchement (le moment est calculé au clic).
export const boutonPartage = (texte = 'Partager') => `<button class="secondaire bouton-partage" data-partager>📸 ${texte}</button>`;

export function brancherPartage(racine: ParentNode, moment: () => Moment | null) {
  racine.querySelectorAll<HTMLButtonElement>('[data-partager]').forEach((b) => b.addEventListener('click', async (ev) => {
    ev.stopPropagation(); // dans l'ouverture d'un booster, un clic fait passer à la carte suivante
    const m = moment();
    if (!m || b.disabled) return;
    b.disabled = true;
    const avant = b.textContent;
    b.textContent = '📸 Préparation…';
    const r = await partager(m).catch(() => 'annule' as const);
    b.textContent = r === 'telechargement' ? '📸 Image enregistrée' : avant;
    b.disabled = false;
  }));
}
