// Le Club : liste d'amis, marchand du jour et échange de doubles entre amis.
// Sans affichage : les écrans sont dans main.ts.

import { LUTTEURS, REGLES, creerHasard, type Rarete } from '../moteur';
import { nbExemplaires, type Collection } from './collection';
import type { Salle } from './enligne';

// ---------- Amis ----------

// Ajoute ou met à jour un ami (après un combat en ligne ou un échange).
export function noterAmi(
  c: Collection, idCoach: string | null, pseudo: string | null,
  evenement: { type: 'victoire' | 'defaite' | 'echange' | 'rencontre'; cle?: string },
) {
  if (!idCoach || idCoach === c.idCoach) return;
  if (evenement.cle) {
    if (c.combatsComptes.includes(evenement.cle)) return;
    c.combatsComptes = [...c.combatsComptes, evenement.cle].slice(-100);
  }
  const a = c.amis[idCoach] ?? { pseudo: pseudo || 'Coach', vu: 0, victoires: 0, defaites: 0, echanges: 0 };
  if (pseudo) a.pseudo = pseudo;
  a.vu = Date.now();
  if (evenement.type === 'victoire') a.victoires++;
  if (evenement.type === 'defaite') a.defaites++;
  if (evenement.type === 'echange') a.echanges++;
  c.amis[idCoach] = a;
}

export function listeAmis(c: Collection): ({ id: string } & Collection['amis'][string])[] {
  return Object.entries(c.amis).map(([id, a]) => ({ id, ...a })).sort((x, y) => y.vu - x.vu);
}

// ---------- Marchand ----------

export interface Offre {
  donne: string; // la carte que le marchand donne
  demande: string; // le double que le marchand veut, de même rareté
}

// Date du jour (heure du téléphone), sous la forme 2026-11-24.
export function jourDe(d = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

function graineDuJour(jour: string): number {
  let h = 2166136261;
  for (const ch of jour) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

// Les offres du jour : les mêmes pour tout le monde ce jour-là.
export function offresDuJour(jour: string): Offre[] {
  const h = creerHasard(graineDuJour(jour));
  const P = REGLES.collection.poidsRarete;
  const raretes = (Object.keys(P) as Rarete[]);
  const offres: Offre[] = [];
  for (let essai = 0; offres.length < REGLES.collection.offresMarchandParJour && essai < 50; essai++) {
    let tirage = h() * raretes.reduce((n, r) => n + P[r], 0);
    let k = 0;
    while (k < raretes.length - 1 && tirage >= P[raretes[k]]) tirage -= P[raretes[k++]];
    const liste = LUTTEURS.filter((l) => l.rarete === raretes[k]);
    if (liste.length < 2) continue;
    const a = liste[Math.floor(h() * liste.length)];
    const autres = liste.filter((l) => l.id !== a.id);
    const b = autres[Math.floor(h() * autres.length)];
    if (offres.some((o) => o.donne === a.id && o.demande === b.id)) continue;
    offres.push({ donne: a.id, demande: b.id });
  }
  return offres;
}

export function offreFaite(c: Collection, jour: string, i: number): boolean {
  return c.marchand.jour === jour && c.marchand.faits.includes(i);
}

// Accepte une offre : on donne un double de la carte demandée, on reçoit l'autre carte.
export function accepterOffre(c: Collection, jour: string, i: number): string | null {
  const o = offresDuJour(jour)[i];
  if (!o) return 'Offre inconnue.';
  if (offreFaite(c, jour, i)) return 'Tu as déjà fait cet échange aujourd\'hui.';
  if (nbExemplaires(c, o.demande) < 2) return 'Il te faut un double de cette carte.';
  if (c.marchand.jour !== jour) c.marchand = { jour, faits: [] };
  c.exemplaires[o.demande] -= 1;
  c.exemplaires[o.donne] = nbExemplaires(c, o.donne) + 1;
  c.marchand.faits.push(i);
  return null;
}

// ---------- Échange de doubles entre amis ----------

interface EtatEchange {
  v: 1;
  jeu: 'wbc-echange';
  co: string | null; // pseudo
  ic: string; // identifiant du coach
  d: Record<string, number>; // mes doubles (nombre d'exemplaires en trop)
  n: number; // numéro de l'échange en cours
  o: string | null; // la carte que je propose
  ok: string | null; // « n|ce que je donne|ce que je reçois » quand j'accepte
  f: { n: number; donne: string; recoit: string }[]; // derniers échanges faits
}

export interface VueEchange {
  amiPresent: boolean;
  amiCoach: string | null;
  amiId: string | null;
  mesDoubles: Record<string, number>;
  sesDoubles: Record<string, number>;
  monOffre: string | null;
  sonOffre: string | null;
  jaiAccepte: boolean;
  ilAccepte: boolean;
  dernier: { donne: string; recoit: string } | null; // dernier échange réussi
}

const doublesDe = (c: Collection) =>
  Object.fromEntries(LUTTEURS.map((l) => [l.id, nbExemplaires(c, l.id) - 1]).filter(([, n]) => (n as number) > 0));

export class Echange {
  private moi: EtatEchange;
  private ecouteurs = new Set<(v: VueEchange) => void>();
  private arret: () => void;
  private dernier: VueEchange['dernier'] = null;
  vue: VueEchange;

  // applique : enregistre la collection modifiée (sauvegarde).
  constructor(
    private salle: Salle, private code: string, private c: Collection,
    private enregistrer: () => void = () => undefined,
  ) {
    this.moi = { v: 1, jeu: 'wbc-echange', co: c.coach, ic: c.idCoach, d: doublesDe(c), n: 0, o: null, ok: null, f: [] };
    this.vue = this.calculer();
    this.arret = salle.surChangement(() => this.avancer());
    salle.publier(this.moi);
    queueMicrotask(() => this.avancer());
  }

  surVue(fn: (v: VueEchange) => void) {
    this.ecouteurs.add(fn);
    fn(this.vue);
    return () => this.ecouteurs.delete(fn);
  }

  fermer() {
    this.arret();
    this.salle.quitter();
  }

  proposer(id: string | null) {
    if (id && !(this.moi.d[id] > 0)) return;
    this.maj({ o: id, ok: null });
  }

  accepter() {
    const ami = this.ami();
    if (!this.moi.o || !ami?.o) return;
    this.maj({ ok: `${this.moi.n}|${this.moi.o}|${ami.o}` });
  }

  annulerAccord() {
    this.maj({ ok: null });
  }

  private maj(patch: Partial<EtatEchange>) {
    this.moi = { ...this.moi, ...patch };
    this.salle.publier(this.moi);
    this.avancer();
  }

  private ami(): EtatEchange | null {
    for (const p of this.salle.pairs()) {
      const e = p.presence as unknown as EtatEchange;
      if (e?.v === 1 && e.jeu === 'wbc-echange' && e.ic !== this.c.idCoach) return e;
    }
    return null;
  }

  private calculer(): VueEchange {
    const ami = this.ami();
    const n = this.moi.n;
    return {
      amiPresent: !!ami, amiCoach: ami?.co ?? null, amiId: ami?.ic ?? null,
      mesDoubles: this.moi.d, sesDoubles: ami?.d ?? {},
      monOffre: this.moi.o, sonOffre: ami?.o ?? null,
      jaiAccepte: !!this.moi.ok,
      ilAccepte: !!ami?.ok && !!this.moi.o && ami.ok === `${n}|${ami.o}|${this.moi.o}`,
      dernier: this.dernier,
    };
  }

  avancer() {
    const ami = this.ami();
    const n = this.moi.n;
    // Mon accord n'est valable que pour les offres qui étaient sur la table.
    if (this.moi.ok && (!ami || this.moi.ok !== `${n}|${this.moi.o}|${ami.o}`)) {
      const faitChezLui = ami?.f.some((x) => x.n === n && x.recoit === this.moi.o);
      if (!faitChezLui) {
        this.moi = { ...this.moi, ok: null };
        this.salle.publier(this.moi);
      }
    }
    if (ami && this.moi.o) {
      const accordLui = ami.ok === `${n}|${ami.o}|${this.moi.o}`;
      const faitChezLui = ami.f.find((x) => x.n === n && x.recoit === this.moi.o);
      const recu = faitChezLui ? faitChezLui.donne : ami.o;
      if (this.moi.ok && recu && (accordLui || faitChezLui)) this.appliquer(n, this.moi.o, recu, ami);
    }
    this.vue = this.calculer();
    for (const f of this.ecouteurs) f(this.vue);
  }

  private appliquer(n: number, donne: string, recoit: string, ami: EtatEchange) {
    const cle = `${this.code}-${ami.ic}-${n}`;
    if (!this.c.echangesFaits.includes(cle)) {
      if (nbExemplaires(this.c, donne) < 2) return; // plus de double : on n'échange pas
      this.c.exemplaires[donne] -= 1;
      this.c.exemplaires[recoit] = nbExemplaires(this.c, recoit) + 1;
      this.c.echangesFaits = [...this.c.echangesFaits, cle].slice(-100);
      noterAmi(this.c, ami.ic, ami.co, { type: 'echange' });
      this.enregistrer();
    }
    this.dernier = { donne, recoit };
    this.moi = {
      ...this.moi, n: n + 1, o: null, ok: null, d: doublesDe(this.c),
      f: [...this.moi.f, { n, donne, recoit }].slice(-5),
    };
    this.salle.publier(this.moi);
  }
}
