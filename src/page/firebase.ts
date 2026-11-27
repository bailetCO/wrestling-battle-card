// Firebase (Google) : connexion anonyme des joueurs et salles des combats entre amis.
// Le jeu parle à Firebase par de simples appels web, sans la bibliothèque Firebase (lourde) :
//   - connexion anonyme (Identity Toolkit) : chaque téléphone reçoit un identifiant tiré au
//     hasard, sans nom ni e-mail, gardé dans le navigateur ;
//   - Realtime Database : chaque joueur écrit son état dans salles/<code>/<identifiant>, et
//     reçoit en direct (flux « EventSource ») les états des autres joueurs de la salle.
// La sécurité est assurée par les règles du projet Firebase (dossier firebase/ du dépôt).
// Ces réglages ne sont pas secrets : Google les prévoit pour être visibles dans le jeu.

import type { Pair, Salle } from './enligne';

export const FIREBASE = {
  apiKey: 'AIzaSyC4n2njBnh7ajyXX75veCIQeoszSSj77oY',
  projectId: 'wrestling-battle-card',
  base: 'https://wrestling-battle-card-default-rtdb.europe-west1.firebasedatabase.app',
};

// ---------- Connexion anonyme ----------

type Session = { uid: string; jeton: string; renouvellement: string; expire: number };
const CLE = 'wbc-firebase';

let session: Session | null = null;
let enCours: Promise<Session> | null = null;

const lire = (): Session | null => {
  try {
    const s = JSON.parse(localStorage.getItem(CLE) ?? 'null');
    return s && typeof s.uid === 'string' && typeof s.renouvellement === 'string' ? s : null;
  } catch {
    return null;
  }
};
const garder = (s: Session) => {
  try { localStorage.setItem(CLE, JSON.stringify(s)); } catch { /* navigation privée */ }
};

async function appel(url: string, corps: object): Promise<Record<string, unknown>> {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Firebase : ${(d as { error?: { message?: string } }).error?.message ?? r.status}`);
  return d as Record<string, unknown>;
}

// Rend une session valide (jeton d'au moins 5 minutes), en se connectant ou en renouvelant si besoin.
export function connexion(): Promise<Session> {
  session ??= lire();
  if (session && session.jeton && session.expire - Date.now() > 5 * 60_000) return Promise.resolve(session);
  enCours ??= (async () => {
    try {
      let s: Session;
      if (session) {
        const d = await appel(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, { grant_type: 'refresh_token', refresh_token: session.renouvellement });
        s = { uid: String(d.user_id), jeton: String(d.id_token), renouvellement: String(d.refresh_token), expire: Date.now() + Number(d.expires_in) * 1000 };
      } else {
        const d = await appel(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`, { returnSecureToken: true });
        s = { uid: String(d.localId), jeton: String(d.idToken), renouvellement: String(d.refreshToken), expire: Date.now() + Number(d.expiresIn) * 1000 };
      }
      session = s;
      garder(s);
      return s;
    } finally {
      enCours = null;
    }
  })();
  return enCours;
}

// ---------- Arbre reçu en direct (événements « put » et « patch » de la Realtime Database) ----------

export type Arbre = Record<string, unknown> | null;

// Applique un événement à la copie locale de la salle. « put » remplace ce qui est au chemin
// (null = effacé), « patch » met à jour quelques enfants du chemin.
export function appliquer(arbre: Arbre, type: 'put' | 'patch', chemin: string, donnees: unknown): Arbre {
  const parts = chemin.split('/').filter(Boolean);
  const copie = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' ? { ...(x as Record<string, unknown>) } : {});
  const ecrire = (noeud: unknown, i: number): unknown => {
    if (i === parts.length) {
      if (type === 'put') return donnees;
      const n = copie(noeud);
      for (const [k, v] of Object.entries((donnees ?? {}) as Record<string, unknown>)) {
        if (v === null) delete n[k];
        else n[k] = v;
      }
      return n;
    }
    const n = copie(noeud);
    const v = ecrire(n[parts[i]], i + 1);
    if (v === null || v === undefined) delete n[parts[i]];
    else n[parts[i]] = v;
    return Object.keys(n).length ? n : null;
  };
  const r = ecrire(arbre, 0);
  return r && typeof r === 'object' ? (r as Record<string, unknown>) : null;
}

// Les autres joueurs de la salle, le plus récent d'abord. Un état sans signe de vie depuis
// 90 secondes est ignoré (page fermée, ou vieille salle au même code).
export function pairsDe(arbre: Arbre, moi: string, maintenant = Date.now(), decalage = 0): Pair[] {
  const res: { peer: string; presence: Record<string, unknown>; t: number }[] = [];
  for (const [peer, x] of Object.entries(arbre ?? {})) {
    if (peer === moi || !x || typeof x !== 'object') continue;
    const { p, t } = x as { p?: unknown; t?: unknown };
    if (typeof p !== 'string' || typeof t !== 'number' || maintenant + decalage - t > 90_000) continue;
    try {
      const presence = JSON.parse(p);
      if (presence && typeof presence === 'object') res.push({ peer, presence, t });
    } catch { /* état illisible : ignoré */ }
  }
  return res.sort((a, b) => b.t - a.t).map(({ peer, presence }) => ({ peer, presence }));
}

// ---------- La salle ----------

export const TAILLE_MAX = 30_000; // caractères, la même limite que dans les règles Firebase

export function salleFirebase(code: string): Salle {
  const ecouteurs = new Set<() => void>();
  const prevenir = () => ecouteurs.forEach((f) => f());
  let arbre: Arbre = null;
  let flux: EventSource | null = null;
  let ouvert = false;
  let fini = false;
  let mien: string | null = null;
  let uid = '';
  let decalage = 0; // horloge du serveur moins horloge du téléphone
  let attente: ReturnType<typeof setTimeout> | null = null;

  const adresse = (s: Session, chemin = '') => `${FIREBASE.base}/salles/${code}${chemin}.json?auth=${encodeURIComponent(s.jeton)}`;

  const ecrire = async (corps: object) => {
    if (fini) return;
    try {
      const s = await connexion();
      await fetch(adresse(s, `/${s.uid}`), { method: 'PATCH', body: JSON.stringify(corps) });
    } catch { /* réseau absent : le battement réessaiera */ }
  };
  const envoyer = () => mien !== null && ecrire({ p: mien, t: { '.sv': 'timestamp' } });

  const ecouter = async () => {
    if (fini) return;
    try {
      const s = await connexion();
      uid = s.uid;
      const d = await fetch(`${FIREBASE.base}/.info/serverTimeOffset.json?auth=${encodeURIComponent(s.jeton)}`).then((r) => r.json()).catch(() => 0);
      decalage = typeof d === 'number' ? d : 0;
      flux?.close();
      flux = new EventSource(adresse(s));
      const recu = (type: 'put' | 'patch') => (ev: MessageEvent) => {
        try {
          const { path, data } = JSON.parse(ev.data) as { path: string; data: unknown };
          arbre = appliquer(arbre, type, path, data);
          ouvert = true;
          prevenir();
        } catch { /* message illisible */ }
      };
      flux.addEventListener('put', recu('put'));
      flux.addEventListener('patch', recu('patch'));
      // Jeton expiré (toutes les heures) ou accès refusé : on se reconnecte avec un jeton neuf.
      const relancer = () => { ouvert = false; prevenir(); flux?.close(); attente = setTimeout(ecouter, 1500); };
      flux.addEventListener('auth_revoked', relancer);
      flux.addEventListener('cancel', relancer);
      flux.onerror = () => { if (ouvert) { ouvert = false; prevenir(); } };
      flux.onopen = () => envoyer();
    } catch {
      attente = setTimeout(ecouter, 5000);
    }
  };
  ecouter();
  // Toutes les 10 s : signe de vie, et un ami silencieux depuis 90 s disparaît de la liste.
  const battement = setInterval(() => { ecrire({ t: { '.sv': 'timestamp' } }); prevenir(); }, 10_000);

  return {
    publier(p) {
      const texte = JSON.stringify(p);
      if (texte.length > TAILLE_MAX) return; // ne devrait jamais arriver : refusé par Firebase
      mien = texte;
      envoyer();
    },
    pairs: () => pairsDe(arbre, uid, Date.now(), decalage),
    surChangement(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    connecte: () => ouvert,
    quitter() {
      fini = true;
      clearInterval(battement);
      if (attente) clearTimeout(attente);
      flux?.close();
      // On efface son état de la salle (la salle disparaît quand les deux sont partis).
      connexion().then((s) => fetch(adresse(s, `/${s.uid}`), { method: 'DELETE', keepalive: true })).catch(() => {});
    },
  };
}

// ---------- Firebase d'abord, relais publics en secours ----------

// Les relais publics ne s'ouvrent que si Firebase ne répond pas (8 s), ou si l'ami n'apparaît pas
// sur Firebase (20 s) : son téléphone n'arrive peut-être pas à joindre Firebase. Dans ce cas, on
// publie des deux côtés pour être sûr de se retrouver.
export function salleEnLigne(code: string, secours: () => Salle, delais = { connexion: 8000, ami: 20_000 }): Salle {
  const fb = salleFirebase(code);
  let relais: Salle | null = null;
  let mien: object | null = null;
  const ecouteurs = new Set<() => void>();
  const prevenir = () => ecouteurs.forEach((f) => f());
  fb.surChangement(prevenir);
  const ouvrirSecours = () => {
    if (relais) return;
    relais = secours();
    relais.surChangement(prevenir);
    if (mien) relais.publier(mien);
  };
  const t1 = setTimeout(() => { if (!fb.connecte()) ouvrirSecours(); }, delais.connexion);
  const t2 = setTimeout(() => { if (!fb.pairs().length) ouvrirSecours(); }, delais.ami);
  return {
    publier(p) {
      mien = p;
      fb.publier(p);
      relais?.publier(p);
    },
    pairs: () => {
      const a = fb.pairs();
      return a.length || !relais ? a : relais.pairs();
    },
    surChangement(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    connecte: () => fb.connecte() || !!relais?.connecte(),
    quitter() {
      clearTimeout(t1);
      clearTimeout(t2);
      fb.quitter();
      relais?.quitter();
    },
  };
}
