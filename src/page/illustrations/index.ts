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

import { ID_LUTTEUR_TEST, ID_RIVAL } from '../../moteur';
import type { DefLutteur, NiveauCarte } from '../../moteur';
import PACK from './pack-v1.json';
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

const BASE = `${import.meta.env?.BASE_URL ?? './'}illustrations/${DONNEES.version}/`;
const url = (chemin: string, taille: 'mini' | 'grande') => (/^(https?:|\/|\.)/.test(chemin) ? chemin : BASE + (taille === 'mini' ? 'mini/' : '') + chemin);

export const estCocoach = (id: string) => id === ID_RIVAL || id === ID_LUTTEUR_TEST;

// Image d'une carte (niveau = rareté atteinte), ou null si le pack n'en a pas pour ce lutteur.
export function imageCarte(id: string, niveau: NiveauCarte, taille: 'mini' | 'grande'): { url: string; zone: Zone | null } | null {
  const cle = `${estCocoach(id) ? 'cocoach' : id}/${niveau}`;
  if (AUTRES[cle]) return { url: url(AUTRES[cle], taille), zone: null };
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

export const infosPack = (id: string) => DONNEES.lutteurs[id] ?? null;
export const nbLutteursIllustres = () => Object.keys(DONNEES.lutteurs).length;

const echap = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// <img> d'une carte ; data-repli permet de revenir au dessin d'origine si le fichier manque.
export function imgCarte(def: DefLutteur, niveau: NiveauCarte, taille: 'mini' | 'grande', classe = ''): string | null {
  const im = imageCarte(def.id, niveau, taille);
  if (!im) return null;
  return `<img class="illu illu-carte ${classe}" src="${im.url}" alt="Carte ${echap(def.nom)}" loading="lazy" decoding="async" width="360" height="540" data-repli="carte">`;
}

export function imgPortrait(def: DefLutteur): string | null {
  const u = imagePortrait(def.id);
  if (!u) return null;
  return `<img class="illu illu-portrait" src="${u}" alt="" loading="lazy" decoding="async" width="96" height="96" data-repli="portrait" data-id="${echap(def.id)}">`;
}

export function imgEmbleme(nation: string, nom = ''): string | null {
  const u = imageEmbleme(nation);
  return u ? `<img class="illu illu-embleme" src="${u}" alt="${echap(nom)}" loading="lazy" decoding="async" data-repli="embleme" data-nation="${echap(nation)}">` : null;
}

// Bande qui recouvre les statistiques imprimées (non contractuelles) et montre celles du jeu.
export function bandeStats(def: DefLutteur, zone: Zone | null): string {
  const z = zone ?? { x: 6, y: 76, l: 88, h: 12 }; // zone inconnue (image remplacée) : position la plus courante
  return `<div class="cl-bande" style="left:${z.x}%;top:${z.y}%;width:${z.l}%;height:${z.h}%" aria-label="Endurance ${def.enduranceMax}, force ${def.force}, récupération ${Math.round(def.recuperation * 100)} %">
    <span><i>END</i><b>${def.enduranceMax}</b></span><span><i>FOR</i><b>${def.force}</b></span><span><i>RÉC</i><b>${Math.round(def.recuperation * 100)}</b></span></div>`;
}

// Carte illustrée complète (image + bande des vraies statistiques), ou null sans illustration.
export function blocIllustre(def: DefLutteur, niveau: NiveauCarte, taille: 'mini' | 'grande'): string | null {
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
      carte?.classList.remove('avec-illu');
      if (!carte) img.replaceWith(document.createRange().createContextualFragment('<span class="illu-absente">Illustration indisponible</span>'));
    } else if (type === 'portrait') {
      img.replaceWith(document.createRange().createContextualFragment(dessin.portrait(img.dataset.id ?? '')));
    } else if (type === 'embleme') {
      img.replaceWith(document.createRange().createContextualFragment(dessin.embleme(img.dataset.nation ?? '')));
    }
  }, true);
}
