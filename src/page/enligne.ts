// Combat entre amis en ligne : le protocole, sans affichage.
//
// Principe : chaque joueur publie dans la salle un petit « état » (sa présence) qui
// décrit tout ce qu'il a fait : son lutteur, son deck, ses choix tour par tour.
// Les deux téléphones rejouent le combat avec le même moteur et le même hasard
// (même numéro de combat), donc ils obtiennent exactement le même résultat.
//
// Un tour sans triche possible :
//   1. chacun choisit en secret et publie seulement une empreinte de son choix ;
//   2. quand les deux empreintes sont là, chacun dévoile son choix (l'empreinte
//      prouve qu'il n'a pas changé d'avis après avoir vu celui de l'autre) ;
//   3. initiative : celui qui ne l'a pas publie 2 actions possibles (dont la vraie),
//      celui qui l'a choisit son action définitive, puis l'autre se dévoile ;
//   4. pile ou face : le lutteur menacé annonce sur son téléphone.
// Tout l'historique est dans la présence : après un rechargement, le combat reprend.

import {
  ACTIONS, LUTTEURS, apercuInitiative, avecDeck, avecGrade, creerCombat, creerHasard, jouerTour, trouverLutteur,
  type Choix, type EtatCombat, type Face, type IdAction, type Joueur,
} from '../moteur';
import mqtt from 'mqtt';
import { HasardRejouable, type TourJoue } from './partie';

// ---------- Transport : la salle ----------

export interface Pair {
  peer: string;
  presence: Readonly<Record<string, unknown>>;
}

// Adresse de la version ouverte à tous (GitHub Pages).
export const ADRESSE_PUBLIQUE = 'https://bailetco.github.io/wrestling-battle-card/';

// Relais publics gratuits et sans compte (MQTT sur WebSocket). On se branche sur les deux :
// si l'un ne répond pas, l'autre suffit. À remplacer par Firebase plus tard.
export const RELAIS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];

// Ce dont le protocole a besoin d'une salle (salle Claude, ou salle locale pour les tests).
export interface Salle {
  publier(etat: object): void; // remplace tout mon état publié
  pairs(): readonly Pair[]; // les autres personnes de la salle (pas moi)
  surChangement(fn: () => void): () => void;
  connecte(): boolean;
  quitter(): void;
}

// ---------- Codage compact des choix ----------

const IDS = Object.keys(ACTIONS) as IdAction[];
const LUTTE = 100;

export function coder(c: Choix): number {
  if (c.action === 'lutte') return LUTTE;
  return IDS.indexOf(c.action) * 2 + (c.speciale ? 1 : 0);
}

export function decoder(n: number): Choix {
  if (n === LUTTE) return { action: 'lutte' };
  return { action: IDS[Math.floor(n / 2)], speciale: n % 2 === 1 };
}

const codeAction = (a: IdAction | 'lutte') => (a === 'lutte' ? LUTTE : IDS.indexOf(a) * 2);
const actionDuCode = (n: number): IdAction | 'lutte' => (n === LUTTE ? 'lutte' : IDS[Math.floor(n / 2)]);

// ---------- Ce que chaque joueur publie ----------

export type Role = 'hote' | 'invite'; // l'hôte est le joueur 0 du moteur, l'invité le joueur 1
// Mode choisi par l'hôte : toutes les cartes de base (sans booster), ou chacun sa collection
// avec ses grades (boosters à la clé).
export type ModeSalle = 'base' | 'collection';

export interface Presence {
  v: 1;
  jeu: 'wbc';
  role: Role;
  m: number; // numéro de la manche (revanche = +1)
  mo: ModeSalle | null; // mode de la salle (publié par l'hôte)
  co: string | null; // pseudo du coach
  ic: string | null; // identifiant du coach (pour la liste d'amis)
  gr: number; // grade du lutteur choisi (mode collection)
  et: Record<string, number>; // étoiles par action (mode collection, Champion du Monde)
  sy?: number; // style de carte choisi (Champion du Monde, mode collection), pour l'affichage
  lu: string | null; // lutteur choisi
  dk: number[] | null; // deck (codes d'actions)
  g: number | null; // numéro de combat (graine), publié par l'hôte
  t: number; // tour en cours (= nombre de tours joués)
  eng: string | null; // empreinte du choix secret du tour t
  rev: { c: number; s: string } | null; // choix dévoilé du tour t, avec son sel
  ap: number[] | null; // initiative : les 2 actions possibles montrées à l'adversaire (tour t)
  fc: Record<string, Face>; // annonces pile ou face, par tour
  h: number[]; // mes choix définitifs, tour par tour
  ab: boolean; // abandon
  rv: boolean; // demande de revanche
  ck: string | null; // contrôle : résumé de l'état après le dernier tour
}

export function presenceVide(role: Role, m = 0, moi?: { mo?: ModeSalle | null; co?: string | null; ic?: string | null }): Presence {
  return { v: 1, jeu: 'wbc', role, m, mo: moi?.mo ?? null, co: moi?.co ?? null, ic: moi?.ic ?? null, gr: 1, et: {}, lu: null, dk: null, g: null, t: 0, eng: null, rev: null, ap: null, fc: {}, h: [], ab: false, rv: false, ck: null };
}

function lirePresence(p: Readonly<Record<string, unknown>>): Presence | null {
  if (p.v !== 1 || p.jeu !== 'wbc') return null;
  if (p.role !== 'hote' && p.role !== 'invite') return null;
  return p as unknown as Presence;
}

// ---------- Outils ----------

async function empreinte(t: number, code: number, sel: string): Promise<string> {
  const octets = new TextEncoder().encode(`wbc|${t}|${code}|${sel}`);
  const h = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(h)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function nouveauSel(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function resume(e: EtatCombat): string {
  const [a, b] = e.joueurs;
  return [e.tourGlobal, a.score, b.score, Math.round(a.endurance * 10), Math.round(b.endurance * 10), a.periodesGagnees, b.periodesGagnees].join('.');
}

// Hasard à part pour l'aperçu d'initiative : calculé par un seul téléphone,
// il ne doit pas décaler le hasard commun du combat.
const hasardApercu = (graine: number, t: number) => creerHasard((graine * 31 + t * 7919 + 1) >>> 0);

class BesoinFace extends Error {
  constructor(readonly joueur: Joueur) {
    super('pile ou face');
  }
}

// ---------- Ce que voit l'écran ----------

export type Phase =
  | 'attente-ami' // seul dans la salle
  | 'choix-lutteur' // chacun choisit son lutteur
  | 'combat'
  | 'fin';

export interface Vue {
  phase: Phase;
  moi: Joueur;
  modeSalle: ModeSalle | null;
  amiCoach: string | null;
  amiIdCoach: string | null;
  amiPresent: boolean;
  amiLutteur: string | null;
  monLutteur: string | null;
  amiStyle: number; // style de carte de l'ami (Champion du Monde), 0 = classique
  monStyle: number;
  etat: EtatCombat | null;
  tours: TourJoue[];
  graine: number | null;
  // Pendant le combat : ce que l'écran doit faire.
  aChoisir: boolean; // je peux choisir mon action
  monChoix: Choix | null; // mon choix secret du tour en cours
  initiative: (IdAction | 'lutte')[] | null; // j'ai l'initiative : voici les 2 actions possibles de mon ami
  pileOuFace: boolean; // je dois annoncer pile ou face
  attente: string | null; // ce qu'on attend de l'ami
  abandon: 'moi' | 'ami' | null;
  revancheAmi: boolean;
  revancheMoi: boolean;
  desaccord: boolean; // les deux téléphones ne calculent pas la même chose
}

// ---------- Le duel ----------

export class Duel {
  private moiP: Presence;
  private secret: { t: number; m: number; choix: Choix; sel: string } | null = null;
  private enCours = false; // un calcul asynchrone (empreinte) est en cours
  private ecouteurs = new Set<(v: Vue) => void>();
  private arret: () => void;
  vue: Vue;

  // depart : mon état sauvegardé sur ce téléphone (reprise après un rechargement).
  // sauvegarder : appelé à chaque changement de mon état.
  private ident: { mo: ModeSalle | null; co: string | null; ic: string | null };

  constructor(
    private salle: Salle, readonly role: Role,
    depart?: Presence | null, private sauvegarder: (p: Presence) => void = () => undefined,
    ident: { mode?: ModeSalle; coach?: string | null; idCoach?: string | null } = {},
  ) {
    this.ident = { mo: role === 'hote' ? ident.mode ?? 'base' : null, co: ident.coach ?? null, ic: ident.idCoach ?? null };
    this.moiP = depart && depart.role === role && depart.v === 1
      ? { ...presenceVide(role), ...depart, co: this.ident.co ?? depart.co ?? null, ic: this.ident.ic ?? depart.ic ?? null }
      : presenceVide(role, 0, this.ident);
    this.vue = this.vueVide();
    this.arret = salle.surChangement(() => this.avancer());
    this.publier();
    queueMicrotask(() => this.avancer());
  }

  get moi(): Joueur {
    return this.role === 'hote' ? 0 : 1;
  }

  surVue(fn: (v: Vue) => void): () => void {
    this.ecouteurs.add(fn);
    fn(this.vue);
    return () => this.ecouteurs.delete(fn);
  }

  fermer() {
    this.arret();
    this.salle.quitter();
  }

  // ----- Actions du joueur -----

  // grade : celui de la carte du joueur (pris en compte seulement en mode collection).
  choisirLutteur(id: string, deck: IdAction[] | undefined, grade = 1, etoiles: Partial<Record<IdAction, number>> = {}, style = 0) {
    const def = avecDeck(avecGrade(trouverLutteur(id), grade, etoiles), deck);
    this.maj({ lu: id, dk: def.actions.map((a) => codeAction(a)), gr: grade, et: { ...etoiles } as Record<string, number>, sy: style });
  }

  async jouer(choix: Choix) {
    const v = this.vue;
    if (!v.aChoisir || !v.etat) return;
    const t = this.moiP.t;
    const sel = nouveauSel();
    this.secret = { t, m: this.moiP.m, choix, sel };
    this.enCours = true;
    const eng = await empreinte(t, coder(choix), sel);
    this.enCours = false;
    if (this.moiP.t === t && this.secret?.t === t) this.maj({ eng, rev: null });
    else this.avancer();
  }

  // Initiative : garder ou changer d'action après avoir vu les 2 possibilités adverses.
  decider(choix: Choix) {
    if (!this.vue.initiative) return;
    const sel = nouveauSel();
    this.secret = { t: this.moiP.t, m: this.moiP.m, choix, sel };
    this.maj({ rev: { c: coder(choix), s: sel } });
  }

  annoncer(face: Face) {
    if (!this.vue.pileOuFace) return;
    this.maj({ fc: { ...this.moiP.fc, [String(this.moiP.t)]: face } });
  }

  abandonner() {
    this.maj({ ab: true });
  }

  revanche() {
    this.maj({ rv: true });
  }

  // ----- Interne -----

  private maj(patch: Partial<Presence>) {
    this.moiP = { ...this.moiP, ...patch };
    this.publier();
    this.avancer();
  }

  private publier() {
    this.salle.publier(this.moiP);
    this.sauvegarder(this.moiP);
  }

  private ami(): Presence | null {
    for (const p of this.salle.pairs()) {
      const pr = lirePresence(p.presence);
      if (pr && pr.role !== this.role) return pr;
    }
    return null;
  }

  private vueVide(): Vue {
    return {
      phase: 'attente-ami', moi: this.moi, modeSalle: null, amiCoach: null, amiIdCoach: null, amiPresent: false, amiLutteur: null, monLutteur: null, amiStyle: 0, monStyle: 0,
      etat: null, tours: [], graine: null, aChoisir: false, monChoix: null, initiative: null, pileOuFace: false,
      attente: null, abandon: null, revancheAmi: false, revancheMoi: false, desaccord: false,
    };
  }

  private emettre(v: Vue) {
    this.vue = v;
    for (const f of this.ecouteurs) f(v);
  }

  // Recalcule tout à partir des deux présences. Appelé à chaque changement.
  avancer(): void {
    if (this.enCours) return;
    const v = this.vueVide();
    let ami = this.ami();
    v.amiPresent = !!ami;
    v.revancheMoi = this.moiP.rv;

    // Manche : l'invité suit l'hôte ; l'hôte lance une nouvelle manche quand les deux veulent la revanche.
    if (ami && ami.m > this.moiP.m) {
      this.moiP = presenceVide(this.role, ami.m, this.ident);
      this.secret = null;
      this.publier();
    }
    if (ami && this.role === 'hote' && this.moiP.rv && ami.rv && ami.m === this.moiP.m) {
      this.moiP = presenceVide(this.role, this.moiP.m + 1, this.ident);
      this.secret = null;
      this.publier();
    }
    if (ami && ami.m !== this.moiP.m) ami = null; // l'ami est encore dans l'ancienne manche

    const moi = this.moiP;
    v.modeSalle = this.role === 'hote' ? moi.mo ?? 'base' : ami?.mo ?? null;
    v.amiCoach = ami?.co ?? null;
    v.amiIdCoach = ami?.ic ?? null;
    v.monLutteur = moi.lu;
    v.amiLutteur = ami?.lu ?? null;
    v.monStyle = moi.sy ?? 0;
    v.amiStyle = ami?.sy ?? 0;
    v.revancheAmi = !!ami?.rv;
    if (!ami) {
      v.phase = v.amiPresent ? 'choix-lutteur' : 'attente-ami';
      if (moi.lu && moi.g === null && !v.amiPresent) v.phase = 'attente-ami';
      return this.emettre(v);
    }

    const hote = this.role === 'hote' ? moi : ami;
    const invite = this.role === 'hote' ? ami : moi;
    if (!hote.lu || !invite.lu || !hote.dk || !invite.dk) {
      v.phase = 'choix-lutteur';
      return this.emettre(v);
    }
    // L'hôte tire le numéro de combat quand les deux lutteurs sont choisis.
    if (hote.g === null) {
      if (this.role === 'hote') {
        this.maj({ g: Math.floor(Math.random() * 1_000_000) + 1 });
        return;
      }
      v.phase = 'choix-lutteur';
      v.attente = 'Ton ami lance le combat…';
      return this.emettre(v);
    }

    // ----- Rejouer le combat à partir des deux historiques -----
    const graine = hote.g;
    v.graine = graine;
    const enCollection = (hote.mo ?? 'base') === 'collection';
    const def = (p: Presence) => {
      const base = enCollection ? avecGrade(trouverLutteur(p.lu!), p.gr ?? 1, (p.et ?? {}) as Partial<Record<IdAction, number>>) : trouverLutteur(p.lu!);
      return avecDeck(base, p.dk!.map(actionDuCode).filter((a): a is IdAction => a !== 'lutte'));
    };
    const defHote = def(hote);
    let defInvite = def(invite);
    if (defInvite.nom === defHote.nom) defInvite = { ...defInvite, nom: `${defInvite.nom} (2)` };
    let etat = creerCombat(defHote, defInvite);
    const hasard = new HasardRejouable(graine);
    const P: [Presence, Presence] = [hote, invite];
    const face = (j: Joueur, t: number): Face | undefined => P[j].fc[String(t)];
    const jouerT = (t: number, c0: Choix, c1: Choix): EtatCombat => {
      const marque = hasard.marque();
      try {
        return jouerTour(etat, c0, c1, hasard.fn, {
          choisirFace: (j) => {
            const f = face(j, t);
            if (!f) throw new BesoinFace(j);
            return f;
          },
        });
      } catch (err) {
        hasard.revenirA(marque);
        throw err;
      }
    };
    const tours: TourJoue[] = [];
    let n = 0;
    try {
      while (!etat.termine && n < hote.h.length && n < invite.h.length) {
        const avant = etat;
        const c0 = decoder(hote.h[n]);
        const c1 = decoder(invite.h[n]);
        etat = jouerT(n, c0, c1);
        tours.push({ avant, choixHumain: this.moi === 0 ? c0 : c1, choixOrdi: this.moi === 0 ? c1 : c0, ordiAChange: false, lignes: etat.journal.slice(avant.journal.length) });
        n++;
      }
    } catch {
      v.desaccord = true; // un historique incohérent : on s'arrête là
    }
    v.etat = etat;
    v.tours = tours;
    if (ami.ck && moi.ck && ami.h.length === moi.h.length && ami.ck !== moi.ck) v.desaccord = true;

    // Abandon
    if (moi.ab || ami.ab) {
      v.phase = 'fin';
      v.abandon = moi.ab ? 'moi' : 'ami';
      return this.emettre(v);
    }
    if (etat.termine) {
      v.phase = 'fin';
      if (moi.ck !== resume(etat) && moi.h.length === n) this.maj({ ck: resume(etat) });
      return this.emettre(v);
    }
    v.phase = 'combat';

    // ----- Le tour en cours : n -----
    const t = n;
    if (moi.h.length > t) {
      // J'ai déjà joué ce tour, j'attends que l'ami publie le sien.
      v.attente = 'Ton ami termine le tour…';
      return this.emettre(v);
    }
    if (moi.t !== t) {
      this.maj({ t, eng: null, rev: null, ap: null, ck: n > 0 ? resume(etat) : null });
      return;
    }
    const secret = this.secret && this.secret.t === t && this.secret.m === moi.m ? this.secret : null;
    if (!secret) {
      // Après un rechargement, on retrouve le choix déjà dévoilé dans la présence.
      if (moi.rev) {
        this.secret = { t, m: moi.m, choix: decoder(moi.rev.c), sel: moi.rev.s };
        return this.avancer();
      }
      if (moi.eng) {
        // Choix secret perdu (rechargement avant de dévoiler) : on rejoue ce tour.
        this.maj({ eng: null });
        return;
      }
      v.aChoisir = true;
      return this.emettre(v);
    }
    v.monChoix = secret.choix;
    if (!moi.eng && !moi.rev) {
      v.attente = 'Envoi de ton choix…';
      return this.emettre(v);
    }

    const moiJ = this.moi;
    const amiJ: Joueur = moiJ === 0 ? 1 : 0;
    const initMoi = etat.joueurs[moiJ].initiative;
    const initAmi = etat.joueurs[amiJ].initiative;
    const amiFini = ami.h.length > t; // l'ami a déjà enregistré ce tour
    const amiEng = amiFini || (ami.t === t && !!ami.eng);
    const amiRev = amiFini ? { c: ami.h[t], s: '' } : ami.t === t ? ami.rev : null;
    const amiAp = ami.t === t ? ami.ap : null;

    if (!amiEng) {
      v.attente = 'Ton ami choisit son action…';
      return this.emettre(v);
    }

    // Initiative
    if (initMoi && !moi.rev) {
      if (!amiAp) {
        v.attente = 'Ton ami prépare ses deux actions possibles…';
        return this.emettre(v);
      }
      v.initiative = amiAp.map(actionDuCode);
      return this.emettre(v);
    }
    if (initAmi && !moi.ap && !moi.rev) {
      const ap = apercuInitiative(etat, amiJ, secret.choix.action, hasardApercu(graine, t)) ?? [secret.choix.action];
      this.maj({ ap: ap.map(codeAction) });
      return;
    }
    if (initAmi && !moi.rev && !amiRev) {
      v.attente = 'Ton ami a l\'initiative : il décide de garder ou de changer son action…';
      return this.emettre(v);
    }
    if (!moi.rev) {
      this.maj({ rev: { c: coder(secret.choix), s: secret.sel } });
      return;
    }
    if (!amiRev) {
      v.attente = 'Ton ami dévoile son action…';
      return this.emettre(v);
    }

    // Vérification de l'empreinte de l'ami (sauf s'il avait l'initiative : il pouvait changer).
    if (!amiFini && !initAmi && ami.eng) {
      const ref = ami.eng;
      this.enCours = true;
      empreinte(t, amiRev.c, amiRev.s).then((e) => {
        this.enCours = false;
        if (e !== ref) this.vue = { ...this.vue, desaccord: true };
        this.resoudre(etat, hasard, t, moi, amiRev.c, v, jouerT);
      });
      return;
    }
    this.resoudre(etat, hasard, t, moi, amiRev.c, v, jouerT);
  }

  private resoudre(
    etat: EtatCombat, _h: HasardRejouable, t: number, moi: Presence, codeAmi: number, v: Vue,
    jouerT: (t: number, c0: Choix, c1: Choix) => EtatCombat,
  ) {
    const monCode = moi.rev!.c;
    const c0 = decoder(this.moi === 0 ? monCode : codeAmi);
    const c1 = decoder(this.moi === 0 ? codeAmi : monCode);
    try {
      jouerT(t, c0, c1);
    } catch (err) {
      if (err instanceof BesoinFace) {
        if (err.joueur === this.moi) {
          v.pileOuFace = true;
          v.monChoix = decoder(monCode);
        } else {
          v.attente = 'Ton ami annonce pile ou face…';
        }
        return this.emettre(v);
      }
      throw err;
    }
    // Tour joué : je l'enregistre dans mon historique.
    this.secret = null;
    this.maj({ h: [...moi.h, monCode] });
  }
}

// ---------- Salle par relais public ----------
// Chaque joueur publie son état comme message « retenu » sur wbc/v1/<code>/p/<identifiant> :
// le relais le garde et le donne à quiconque arrive. Si la page se ferme brutalement,
// le relais efface cet état (« dernière volonté »). Un battement toutes les 10 s dit qu'on est là.

export function salleRelais(code: string, adresses: string[] = RELAIS): Salle {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const base = `wbc/v1/${code}/p/`;
  const sujet = base + id;
  const autres = new Map<string, { presence: Record<string, unknown>; vu: number; recu: number }>();
  const ecouteurs = new Set<() => void>();
  const prevenir = () => ecouteurs.forEach((f) => f());
  let mien: object | null = null;
  const message = () => JSON.stringify({ p: mien, vu: Date.now() });
  const clients = adresses.map((url, i) => {
    const c = mqtt.connect(url, {
      clientId: `wbc-${id}-${i}`, keepalive: 20, clean: true, reconnectPeriod: 3000, connectTimeout: 8000,
      will: { topic: sujet, payload: '', retain: true, qos: 0 },
    });
    c.on('connect', () => {
      c.subscribe(`${base}+`);
      if (mien) c.publish(sujet, message(), { retain: true, qos: 0 });
      prevenir();
    });
    c.on('close', prevenir);
    c.on('error', () => undefined);
    c.on('message', (topic, payload) => {
      const peer = topic.slice(base.length);
      if (peer === id || topic.indexOf(base) !== 0) return;
      if (!payload.length) {
        if (autres.delete(peer)) prevenir();
        return;
      }
      try {
        const d = JSON.parse(payload.toString()) as { p: Record<string, unknown> | null; vu: number };
        if (!d.p || typeof d.vu !== 'number' || Date.now() - d.vu > 90_000) return; // ancien état oublié
        const avant = autres.get(peer);
        if (avant && avant.vu > d.vu) return;
        autres.set(peer, { presence: d.p, vu: d.vu, recu: Date.now() });
        prevenir();
      } catch {
        // message illisible : ignoré
      }
    });
    return c;
  });
  const envoyer = () => {
    if (!mien) return;
    const m = message();
    for (const c of clients) if (c.connected) c.publish(sujet, m, { retain: true, qos: 0 });
  };
  const battement = setInterval(() => {
    envoyer();
    const limite = Date.now() - 35_000;
    let change = false;
    for (const [k, x] of autres) if (x.recu < limite) { autres.delete(k); change = true; }
    if (change) prevenir();
  }, 10_000);
  return {
    publier(p) {
      mien = p;
      envoyer();
    },
    // Le plus récent d'abord : après un rechargement, l'ancien état de l'ami est ignoré.
    pairs: () => [...autres.entries()].sort((a, b) => b[1].vu - a[1].vu).map(([peer, x]) => ({ peer, presence: x.presence })),
    surChangement(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    connecte: () => clients.some((c) => c.connected),
    quitter() {
      clearInterval(battement);
      for (const c of clients) {
        if (c.connected) c.publish(sujet, '', { retain: true, qos: 0 }, () => c.end());
        else c.end(true);
      }
    },
  };
}

// ---------- Salle locale (deux onglets du même navigateur, pour les tests) ----------

export function salleLocale(code: string): Salle {
  const canal = new BroadcastChannel(`wbc-${code}`);
  const moi = Math.random().toString(36).slice(2);
  let mien: object | null = null;
  const autres = new Map<string, { presence: Record<string, unknown>; vu: number }>();
  const ecouteurs = new Set<() => void>();
  const prevenir = () => ecouteurs.forEach((f) => f());
  const envoyer = () => mien && canal.postMessage({ de: moi, presence: mien });
  canal.onmessage = (ev) => {
    const d = ev.data as { de: string; presence?: Record<string, unknown>; bonjour?: boolean; parti?: boolean };
    if (d.parti) {
      autres.delete(d.de);
      return prevenir();
    }
    if (d.bonjour) return envoyer();
    if (d.presence) {
      autres.set(d.de, { presence: d.presence, vu: Date.now() });
      prevenir();
    }
  };
  canal.postMessage({ de: moi, bonjour: true });
  const battement = setInterval(() => {
    envoyer();
    const limite = Date.now() - 6000;
    let change = false;
    for (const [k, x] of autres) if (x.vu < limite) { autres.delete(k); change = true; }
    if (change) prevenir();
  }, 2000);
  return {
    publier(p) {
      mien = p;
      envoyer();
    },
    pairs: () => [...autres.entries()].map(([peer, x]) => ({ peer, presence: x.presence })),
    surChangement(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    connecte: () => true,
    quitter() {
      clearInterval(battement);
      canal.postMessage({ de: moi, parti: true });
      canal.close();
    },
  };
}

// ---------- Salle Claude (connexion en direct de la page publiée) ----------

interface RoomPeer { peer: string; isMe: boolean; presence: Readonly<Record<string, unknown>> }
interface NamedRoomLike {
  presence(p: Record<string, unknown>): Promise<void>;
  peers(): readonly RoomPeer[];
  onPeers(fn: () => void, onError?: (e: { code: string }) => void): () => void;
  connected(): boolean;
  leave(): Promise<void>;
}
export interface RoomLike { join(name: string): Promise<NamedRoomLike> }

// La connexion en direct de claude.ai. Renvoie la salle, ou la raison de l'échec.
export type RaisonEchec = 'hors-claude' | 'non-admis';
export async function obtenirRoom(): Promise<RoomLike | RaisonEchec> {
  const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (!c?.use) return 'hors-claude';
  try {
    const r = (await c.use('room')) as RoomLike | null;
    return r ?? 'non-admis';
  } catch {
    return 'non-admis';
  }
}

export async function salleClaude(room: RoomLike, code: string): Promise<Salle> {
  const r = await room.join(`wbc-${code}`);
  const ecouteurs = new Set<() => void>();
  const stop = r.onPeers(() => ecouteurs.forEach((f) => f()));
  return {
    publier(p) {
      // La présence fusionne champ par champ : on envoie tout, à chaque fois.
      r.presence({ ...p } as unknown as Record<string, unknown>).catch(() => undefined);
    },
    pairs: () => r.peers().filter((p) => !p.isMe),
    surChangement(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    connecte: () => r.connected(),
    quitter() {
      stop();
      r.leave().catch(() => undefined);
    },
  };
}

// Code de salle : 4 lettres faciles à dicter (sans I, O, L).
export function nouveauCode(): string {
  const lettres = 'abcdefghjkmnpqrstuvwxyz';
  return Array.from({ length: 4 }, () => lettres[Math.floor(Math.random() * lettres.length)]).join('');
}

export const codeValide = (c: string) => /^[a-z]{4}$/.test(c);

// Liste des lutteurs pour le choix en ligne (toutes les cartes sont permises entre amis).
export const LUTTEURS_EN_LIGNE = LUTTEURS;
