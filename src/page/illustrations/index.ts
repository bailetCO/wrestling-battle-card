// Illustrations du jeu (pack graphique), sans aucun lien avec le moteur des règles.
//
// - Les images sont des fichiers à part, dans public/illustrations/<version>/ : pour remplacer
//   une illustration, il suffit de déposer un nouveau fichier au même chemin, ou de déclarer un
//   autre chemin dans remplacements.json (clé « idDuJeu/niveau », « idDuJeu/portrait »,
//   « cocoach/niveau », « emblème/CODE »).
// - Deux tailles : « mini » (listes, grilles, téléphone) et « grande » (fiche, booster).
// - Chargement différé (loading="lazy") ; si une image manque, le dessin d'origine du jeu la
//   remplace (voir brancherRepli).
// - Les statistiques imprimées sur les cartes ne comptent pas : le jeu les masque avec une bande
//   qui montre ses propres valeurs (zone repérée à l'import, voir outils/importer_pack.py).
// - Nouvelle formule (V2, public/illustrations/v2/, registre pack-v2.json, outil
//   outils/importer_v2.py) : l'image n'est qu'une illustration, sans texte. Le jeu dessine
//   lui-même le cadre de la rareté, l'en-tête (nom, emblème, gemmes) et l'étiquette du bas
//   (rareté et statistiques). Une image V2 passe devant la carte V1 du même lutteur.

import { ID_LUTTEUR_TEST, ID_RIVAL } from '../../moteur';
import type { DefLutteur, NiveauCarte } from '../../moteur';
import PACK from './pack-v1.json';
import PACK2 from './pack-v2.json';
import REMPLACEMENTS from './remplacements.json';

export interface Zone { x: number; y: number; l: number; h: number }
interface ImagePack { chemin: string; zone: Zone | null }
interface LutteurPack { pack: string; nom: string; poids: number | null; delegation: string; images: Partial<Record<NiveauCarte, ImagePack>>; portrait: string | null }

const DONNEES = PACK as unknown as {
  version: string;
  lutteurs: Record<string, LutteurPack>;
  cocoach: { nom: string; titre: string; images: Partial<Record<NiveauCarte, ImagePack>>; presentation: string | null; portrait: string | null };
  emblemes: Record<string, string>;
  nations: Record<string, string>;
  cadres: Record<string, string>;
};
const AUTRES = REMPLACEMENTS as Record<string, string>;
const V2 = (PACK2 as { lutteurs: Record<string, string[]> }).lutteurs;

const BASE = `${import.meta.env?.BASE_URL ?? './'}illustrations/${DONNEES.version}/`;
const BASE2 = `${import.meta.env?.BASE_URL ?? './'}illustrations/v2/`;
const url2 = (id: string, niveau: NiveauCarte, taille: 'mini' | 'grande') => `${BASE2}${taille === 'mini' ? 'mini/' : ''}${id}/${niveau}.webp`;
const url = (chemin: string, taille: 'mini' | 'grande') => (/^(https?:|\/|\.)/.test(chemin) ? chemin : BASE + (taille === 'mini' ? 'mini/' : '') + chemin);

// Page de test seulement (construite avec VITE_PAQUETS=1) : les images y sont regroupées en
// paquets, car l'hébergement de la page de test limite le nombre de fichiers. Chaque <img> part
// avec une image vide et un attribut data-paquet, puis reçoit sa vraie image quand elle approche
// de l'écran. Le jeu normal n'est pas concerné.
const PAQUETS = (import.meta.env as Record<string, string> | undefined)?.VITE_PAQUETS === '1';
const VIDE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// Attribut src (et data-paquet en page de test) pour une URL produite par url().
function source(u: string): string {
  if (PAQUETS && u.startsWith(BASE2)) return `src="${VIDE}" data-paquet="v2:${u.slice(BASE2.length)}"`;
  if (!PAQUETS || !u.startsWith(BASE)) return `src="${u}"`;
  return `src="${VIDE}" data-paquet="${u.slice(BASE.length)}"`;
}
// Nom du paquet d'une image : taille + délégation (cartes), portraits, cocoach ou emblèmes.
export function nomPaquet(rel: string): string {
  if (rel.startsWith('v2:')) return `${rel.startsWith('v2:mini/') ? 'mini' : 'grande'}-v2`;
  const mini = rel.startsWith('mini/');
  const r = mini ? rel.slice(5) : rel;
  const m = /^assets\/cards\/([A-Z]+)\//.exec(r);
  const groupe = m ? m[1] : r.startsWith('assets/portraits/') ? 'portraits' : r.startsWith('assets/rival/') ? 'cocoach' : 'emblemes';
  return `${mini ? 'mini' : 'grande'}-${groupe}`;
}
const paquets = new Map<string, Promise<Record<string, string>>>();
const blobs = new Map<string, string>();
function chargerPaquet(nom: string) {
  if (!paquets.has(nom)) paquets.set(nom, fetch(`${BASE}paquets/${nom}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
  return paquets.get(nom)!;
}
async function remplir(img: HTMLImageElement) {
  const rel = img.dataset.paquet!;
  delete img.dataset.paquet;
  let u = blobs.get(rel);
  if (!u) {
    const b64 = (await chargerPaquet(nomPaquet(rel)))[rel];
    if (!b64) { img.src = `${BASE}absente.webp`; return; } // image absente : l'erreur déclenche le repli
    const type = rel.endsWith('.svg') ? 'image/svg+xml' : 'image/webp';
    u = URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type }));
    blobs.set(rel, u);
  }
  img.src = u;
}
export function brancherPaquets() {
  if (!PAQUETS) return;
  const vue = new IntersectionObserver((entrees) => entrees.forEach((e) => {
    if (e.isIntersecting) { vue.unobserve(e.target); void remplir(e.target as HTMLImageElement); }
  }), { rootMargin: '600px' });
  const suivre = () => document.querySelectorAll<HTMLImageElement>('img[data-paquet]:not([data-suivi])').forEach((i) => { i.dataset.suivi = '1'; vue.observe(i); });
  new MutationObserver(suivre).observe(document.body, { childList: true, subtree: true });
  suivre();
}

export const estCocoach = (id: string) => id === ID_RIVAL || id === ID_LUTTEUR_TEST;

// Image d'une carte (niveau = rareté atteinte), ou null si le pack n'en a pas pour ce lutteur.
// v2 : illustration seule (nouvelle formule), le jeu dessine cadre, nom, rareté et statistiques.
export function imageCarte(id: string, niveau: NiveauCarte, taille: 'mini' | 'grande'): { url: string; zone: Zone | null; v2?: boolean } | null {
  const cle = `${estCocoach(id) ? 'cocoach' : id}/${niveau}`;
  if (AUTRES[cle]) return { url: url(AUTRES[cle], taille), zone: null };
  const id2 = estCocoach(id) ? 'cocoach' : id;
  if (V2[id2]?.includes(niveau)) return { url: url2(id2, niveau, taille), zone: null, v2: true };
  const im = estCocoach(id) ? DONNEES.cocoach.images[niveau] : DONNEES.lutteurs[id]?.images[niveau];
  return im ? { url: url(im.chemin, taille), zone: im.zone } : null;
}

export function imagePortrait(id: string): string | null {
  const cle = `${estCocoach(id) ? 'cocoach' : id}/portrait`;
  if (AUTRES[cle]) return url(AUTRES[cle], 'mini');
  const p = estCocoach(id) ? DONNEES.cocoach.portrait : DONNEES.lutteurs[id]?.portrait;
  return p ? url(p, 'mini') : null;
}

export const imagePresentationCocoach = () => (AUTRES['cocoach/presentation'] ? url(AUTRES['cocoach/presentation'], 'grande') : DONNEES.cocoach.presentation ? url(DONNEES.cocoach.presentation, 'grande') : null);

// Emblème d'une nation du jeu (« afrique » → AFR), ou de Cocoach.
export function imageEmbleme(nation: string): string | null {
  const code = nation === 'cocoach' ? 'RIVAL-COCOACH' : DONNEES.nations[nation];
  if (!code) return null;
  const chemin = AUTRES[`embleme/${code}`] ?? DONNEES.emblemes[code];
  return chemin ? url(chemin, 'grande') : null;
}

// <img> de la carte de présentation de Cocoach.
export function imgPresentationCocoach(): string | null {
  const u = imagePresentationCocoach();
  return u ? `<img class="illu rival-presentation" ${source(u)} alt="Cocoach, le rival" loading="lazy" decoding="async" width="720" height="1080" data-repli="carte">` : null;
}

export const infosPack = (id: string) => DONNEES.lutteurs[id] ?? null;
export const nbLutteursIllustres = () => Object.keys(DONNEES.lutteurs).length;

const echap = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// <img> d'une carte ; data-repli permet de revenir au dessin d'origine si le fichier manque.
export function imgCarte(def: DefLutteur, niveau: NiveauCarte, taille: 'mini' | 'grande', classe = ''): string | null {
  const im = imageCarte(def.id, niveau, taille);
  if (!im) return null;
  return `<img class="illu illu-carte ${classe}" ${source(im.url)} alt="Carte ${echap(def.nom)}" loading="lazy" decoding="async" width="360" height="540" data-repli="carte">`;
}

export function imgPortrait(def: DefLutteur): string | null {
  const u = imagePortrait(def.id);
  if (!u) return null;
  return `<img class="illu illu-portrait" ${source(u)} alt="" loading="lazy" decoding="async" width="96" height="96" data-repli="portrait" data-id="${echap(def.id)}">`;
}

export function imgEmbleme(nation: string, nom = ''): string | null {
  const u = imageEmbleme(nation);
  return u ? `<img class="illu illu-embleme" ${source(u)} alt="${echap(nom)}" loading="lazy" decoding="async" data-repli="embleme" data-nation="${echap(nation)}">` : null;
}

// Bande qui recouvre les statistiques imprimées (non contractuelles) et montre celles du jeu.
export function bandeStats(def: DefLutteur, zone: Zone | null): string {
  const z = zone ?? { x: 6, y: 76, l: 88, h: 12 }; // zone inconnue (image remplacée) : position la plus courante
  const h = Math.min(z.h, 100 - z.y); // carte coupée en bas (V1) : la bande s'arrête au bord
  return `<div class="cl-bande" style="left:${z.x}%;top:${z.y}%;width:${z.l}%;height:${h}%" aria-label="Endurance ${def.enduranceMax}, force ${def.force}, récupération ${Math.round(def.recuperation * 100)} %">
    <span><i>END</i><b>${def.enduranceMax}</b></span><span><i>FOR</i><b>${def.force}</b></span><span><i>RÉC</i><b>${Math.round(def.recuperation * 100)}</b></span></div>`;
}

const NOMS_RARETE: Record<NiveauCarte, string> = { commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire', champion: 'Champion du Monde' };
const GEMMES: Record<NiveauCarte, number> = { commune: 1, rare: 2, epique: 3, legendaire: 4, champion: 5 };

// Nouvelle formule : le modèle commun de la rareté (cadre, en-tête, étiquette) autour de l'illustration.
// Les tailles sont relatives à la largeur de la carte : le même dessin sert en grand et en miniature.
export function carteV2(def: DefLutteur, niveau: NiveauCarte, taille: 'mini' | 'grande', style = 0): string | null {
  const im = imageCarte(def.id, niveau, taille);
  if (!im?.v2) return null;
  const emb = imgEmbleme(def.nation, def.origine) ?? '';
  const rec = Math.round(def.recuperation * 100);
  return `<div class="cl-illu cl-v2" data-rarete="${niveau}"${niveau === 'champion' && style ? ` data-style="${style}"` : ''}>
    <div class="v2-fenetre">
      <img class="illu illu-carte" ${source(im.url)} alt="Carte ${echap(def.nom)}" loading="lazy" decoding="async" width="600" height="900" data-repli="carte">
      <div class="v2-tete"><span class="v2-embleme">${emb}</span><span class="v2-nom">${echap(def.nom)}</span><span class="v2-gemmes" aria-label="${NOMS_RARETE[niveau]}">${'◆'.repeat(GEMMES[niveau])}</span></div>
      <div class="v2-bas">
        <span class="v2-rarete">${NOMS_RARETE[niveau]}</span>
        <span class="v2-stats" aria-label="Endurance ${def.enduranceMax}, force ${def.force}, récupération ${rec} %"><span><i>END</i><b>${def.enduranceMax}</b></span><span><i>FOR</i><b>${def.force}</b></span><span><i>RÉC</i><b>${rec}</b></span></span>
      </div>
    </div>
  </div>`;
}

// Carte illustrée complète, ou null sans illustration : nouvelle formule si elle existe,
// sinon carte V1 (image + bande des vraies statistiques).
export function blocIllustre(def: DefLutteur, niveau: NiveauCarte, taille: 'mini' | 'grande', style = 0): string | null {
  const v2 = carteV2(def, niveau, taille, style);
  if (v2) return v2;
  const im = imageCarte(def.id, niveau, taille);
  const img = imgCarte(def, niveau, taille);
  if (!im || !img) return null;
  return `<div class="cl-illu">${img}${bandeStats(def, im.zone)}</div>`;
}

// Si une illustration ne se charge pas, on remet le dessin d'origine du jeu à sa place.
// `dessin(id, nation)` fournit ce dessin (portrait SVG ou drapeau) ; une carte complète
// manquante retire simplement le bloc illustré, la fiche d'origine réapparaît.
export function brancherRepli(dessin: { portrait: (id: string) => string; embleme: (nation: string) => string }) {
  document.addEventListener('error', (ev) => {
    const img = ev.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.repli) return;
    const type = img.dataset.repli;
    delete img.dataset.repli;
    if (type === 'carte') {
      const carte = img.closest('.carte-l, .mini-carte');
      img.closest('.cl-illu')?.remove();
      carte?.classList.remove('avec-illu', 'illu-v2');
      if (!carte) img.replaceWith(document.createRange().createContextualFragment('<span class="illu-absente">Illustration indisponible</span>'));
    } else if (type === 'portrait') {
      img.replaceWith(document.createRange().createContextualFragment(dessin.portrait(img.dataset.id ?? '')));
    } else if (type === 'embleme') {
      img.replaceWith(document.createRange().createContextualFragment(dessin.embleme(img.dataset.nation ?? '')));
    }
  }, true);
}
