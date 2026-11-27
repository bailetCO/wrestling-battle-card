// Statistiques anonymes de la bêta (lot D) : une fiche par combat, et quelques fiches de parcours.
// Rien ne part sans l'accord du joueur, ni s'il a moins de 15 ans. Sans affichage (voir ecrans/stats.ts).
//
// Une fiche ne contient ni pseudo, ni nom, ni contact : le joueur n'est connu que par son
// identifiant anonyme (tiré au hasard par Firebase). Les fiches attendent dans le téléphone et
// partent par lots (20 au plus, toutes les 35 secondes au plus : les règles Firebase l'imposent).

import type { Choix, DefLutteur, EtatCombat, Joueur } from '../moteur';
import { VERSION } from './nouveautes';
import type { TourJoue } from './partie';

export type Fiche = Record<string, string | number | boolean>;

// ---------- Accord du joueur ----------

const CLE_ACCORD = 'wbc-stats';
type Accord = { choix: 'oui' | 'non' | null; age15: boolean };

const lire = <T>(k: string, defaut: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? defaut; } catch { return defaut; } };
const ecrire = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* navigation privée */ } };

export const accord = (): Accord => ({ choix: null, age15: false, ...lire<Partial<Accord>>(CLE_ACCORD, {}) });
export const accordDemande = () => accord().choix !== null;
// On n'envoie que si le joueur a dit oui ET a 15 ans ou plus.
export const envoiPermis = () => { const a = accord(); return a.choix === 'oui' && a.age15; };
export function choisirAccord(oui: boolean, age15: boolean) {
  ecrire(CLE_ACCORD, { choix: oui && age15 ? 'oui' : 'non', age15 });
  if (!(oui && age15)) ecrire(CLE_FILE, []); // refus : on oublie aussi ce qui attendait
}

// « Pratiques-tu la lutte ? » (réponse donnée dans un avis), pour comparer lutteurs et grand public.
const CLE_PRATIQUE = 'wbc-pratique';
export const pratique = () => lire<string>(CLE_PRATIQUE, '');
export const garderPratique = (p: string) => { if (p) ecrire(CLE_PRATIQUE, p); };

// ---------- Fiche d'un combat ----------

export interface InfosCombat {
  etat: EtatCombat;
  moi: Joueur;
  tours: readonly TourJoue[]; // vide pour un combat automatique
  mode: string; // carriere, entrainement, tournoi, interclub, saison, amis…
  niveau: string; // niveau de l'ordinateur ('' entre amis)
  auto: boolean;
  dureeMs: number;
}

const rarete = (d: DefLutteur) => d.niveau ?? d.rarete;
const jour = (t = new Date()) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
const nomChoix = (c: Choix) => c.action + (c.speciale ? '*' : '');

// Pour chaque action choisie : combien de fois, et combien de fois elle a fait marquer des points.
// Format compact : « double_jambe:6/4,sprawl:3/1 » (choisie 6 fois, a marqué 4 fois).
// `j` : le joueur dans le moteur (ses points) ; `cote` : ses choix dans les tours, rangés du point de
// vue de ce téléphone (choixHumain = le joueur du téléphone, même s'il est le joueur 1 en ligne).
export function resumeActions(tours: readonly TourJoue[], fin: EtatCombat, j: Joueur, cote: 'humain' | 'ordi'): string {
  const compte = new Map<string, [number, number]>();
  tours.forEach((t, i) => {
    const choix = cote === 'humain' ? t.choixHumain : t.choixOrdi;
    const apres = (tours[i + 1]?.avant ?? fin).joueurs[j].score;
    const c = compte.get(nomChoix(choix)) ?? [0, 0];
    c[0]++;
    if (apres > t.avant.joueurs[j].score) c[1]++;
    compte.set(nomChoix(choix), c);
  });
  return [...compte].sort((a, b) => b[1][0] - a[1][0]).map(([k, [n, m]]) => `${k}:${n}/${m}`).join(',').slice(0, 600);
}

export function ficheCombat(x: InfosCombat): Fiche {
  const e = x.etat;
  const moi = e.joueurs[x.moi];
  const adv = e.joueurs[1 - x.moi];
  return {
    type: 'combat', version: VERSION, jour: jour(), mode: x.mode.slice(0, 20),
    format: e.infini ? 'infini' : e.rapide ? 'rapide' : 'periodes', enchainement: !!e.enchainement, auto: x.auto, niveau: x.niveau.slice(0, 10),
    moi: moi.def.id, moiRarete: rarete(moi.def), adv: adv.def.id, advRarete: rarete(adv.def),
    resultat: e.vainqueur === x.moi ? 'victoire' : 'defaite', finPar: e.finPar ?? 'abandon',
    scoreMoi: moi.score, scoreAdv: adv.score, tours: e.tourGlobal, duree: Math.max(0, Math.min(36_000, Math.round(x.dureeMs / 1000))),
    actionsMoi: resumeActions(x.tours, e, x.moi, 'humain'), actionsAdv: resumeActions(x.tours, e, (1 - x.moi) as Joueur, 'ordi'),
    ...(pratique() ? { pratique: pratique() } : {}),
  };
}

export function ficheParcours(evenement: string, valeur = ''): Fiche {
  return { type: 'parcours', version: VERSION, jour: jour(), evenement: evenement.slice(0, 30), ...(valeur ? { valeur: valeur.slice(0, 40) } : {}), ...(pratique() ? { pratique: pratique() } : {}) };
}

// ---------- File d'attente et envoi par lots ----------

const CLE_FILE = 'wbc-stats-file';
const CLE_ENVOI = 'wbc-stats-envoi';
export const MAX_FILE = 300;
export const TAILLE_LOT = 20;
export const ECART_MS = 35_000; // Firebase refuse deux lots à moins de 30 secondes

type EnAttente = { fiche: Fiche; essais: number };
export type DeposerLot = (collection: string, docs: Fiche[], champLimite: string) => Promise<boolean>;

export function enregistrer(f: Fiche): boolean {
  if (!envoiPermis()) return false;
  const file = lire<EnAttente[]>(CLE_FILE, []);
  file.push({ fiche: f, essais: 0 });
  ecrire(CLE_FILE, file.slice(-MAX_FILE));
  return true;
}

export const enAttente = () => lire<EnAttente[]>(CLE_FILE, []).length;

// Envoie un lot si c'est permis et si le dernier envoi date de plus de 35 secondes.
// Une fiche refusée trois fois par Firebase est abandonnée (elle bloquerait les autres).
export async function envoyerLot(deposerLot: DeposerLot, maintenant = Date.now()): Promise<number> {
  if (!envoiPermis()) return 0;
  const file = lire<EnAttente[]>(CLE_FILE, []);
  if (!file.length || maintenant - lire<number>(CLE_ENVOI, 0) < ECART_MS) return 0;
  const lot = file.slice(0, TAILLE_LOT);
  ecrire(CLE_ENVOI, maintenant);
  let ok: boolean;
  try {
    ok = await deposerLot('stats', lot.map((x) => x.fiche), 'stats');
  } catch {
    return 0; // pas de réseau : on réessaiera
  }
  const reste = lire<EnAttente[]>(CLE_FILE, []).slice(lot.length);
  if (ok) {
    ecrire(CLE_FILE, reste);
    return lot.length;
  }
  ecrire(CLE_FILE, [...lot.map((x) => ({ ...x, essais: x.essais + 1 })).filter((x) => x.essais < 3), ...reste]);
  return 0;
}
