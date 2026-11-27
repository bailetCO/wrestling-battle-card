// Comptes joueurs (27/11/2026), sans affichage : retrouver sa collection sur n'importe quel appareil.
// - Le compte est facultatif. Sans compte, le joueur est « anonyme » (identifiant tiré au hasard).
// - Deux façons de se connecter : compte Google, ou e-mail + mot de passe (avec « mot de passe
//   oublié »). Créer un compte transforme l'identifiant anonyme du téléphone en compte : on garde
//   le même identifiant (avis, statistiques, combats entre amis continuent de marcher).
// - La collection est enregistrée en ligne dans Firestore, comptes/<identifiant>, automatiquement,
//   quelques secondes après chaque changement. Le format est celui du code de sauvegarde (compressé).
// - Si le téléphone et le compte ont deux sauvegardes différentes, le joueur choisit.
// Le jeu parle à Firebase par de simples appels web, sans la bibliothèque Firebase.

import { exporterSauvegarde, importerSauvegarde } from './beta';
import { cartesPossedees, type Collection } from './collection';
import { FIREBASE, appelFirebase, changerSession, connexion, sessionActuelle, type Session } from './firebase';

const AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts';
const DOCS = `projects/${FIREBASE.projectId}/databases/(default)/documents`;

export type Compte = { email: string; fournisseur: string };
export const compteActuel = (): Compte | null => sessionActuelle()?.compte ?? null;

// Les messages d'erreur de Firebase, en français simple.
const ERREURS: Record<string, string> = {
  EMAIL_EXISTS: 'Un compte existe déjà avec cet e-mail : connecte-toi plutôt.',
  EMAIL_NOT_FOUND: 'Aucun compte avec cet e-mail.',
  INVALID_PASSWORD: 'Mot de passe incorrect.',
  INVALID_LOGIN_CREDENTIALS: 'E-mail ou mot de passe incorrect.',
  INVALID_EMAIL: 'Cet e-mail n\'est pas valide.',
  WEAK_PASSWORD: 'Mot de passe trop court : 6 caractères au moins.',
  MISSING_PASSWORD: 'Choisis un mot de passe.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Trop d\'essais : réessaie dans quelques minutes.',
  USER_DISABLED: 'Ce compte a été désactivé.',
  OPERATION_NOT_ALLOWED: 'Ce mode de connexion n\'est pas encore activé.',
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Reconnecte-toi, puis réessaie.',
};
export function messageErreur(err: unknown): string {
  const brut = err instanceof Error ? err.message.replace(/^Firebase : /, '') : String(err);
  const cle = Object.keys(ERREURS).find((k) => brut.startsWith(k));
  return cle ? ERREURS[cle] : 'Connexion impossible pour le moment. Vérifie ta connexion internet et réessaie.';
}

function sessionDe(d: Record<string, unknown>, compte: Compte): Session {
  return { uid: String(d.localId), jeton: String(d.idToken), renouvellement: String(d.refreshToken), expire: Date.now() + Number(d.expiresIn ?? 3600) * 1000, compte };
}

// Crée un compte e-mail : l'identifiant anonyme du téléphone devient ce compte.
export async function creerCompteEmail(email: string, motDePasse: string): Promise<Session> {
  const anonyme = await connexion();
  const d = await appelFirebase(`${AUTH}:update?key=${FIREBASE.apiKey}`, { idToken: anonyme.jeton, email: email.trim(), password: motDePasse, returnSecureToken: true });
  const s = sessionDe(d, { email: email.trim(), fournisseur: 'password' });
  changerSession(s);
  return s;
}

export async function connexionEmail(email: string, motDePasse: string): Promise<Session> {
  const d = await appelFirebase(`${AUTH}:signInWithPassword?key=${FIREBASE.apiKey}`, { email: email.trim(), password: motDePasse, returnSecureToken: true });
  const s = sessionDe(d, { email: email.trim(), fournisseur: 'password' });
  changerSession(s);
  return s;
}

export async function motDePasseOublie(email: string): Promise<void> {
  await appelFirebase(`${AUTH}:sendOobCode?key=${FIREBASE.apiKey}`, { requestType: 'PASSWORD_RESET', email: email.trim() });
}

// Compte Google : à partir du jeton donné par le bouton « Continuer avec Google ». D'abord, on essaie
// de transformer l'identifiant anonyme en compte Google ; si ce compte Google existe déjà (autre
// appareil), on s'y connecte simplement.
export async function connexionGoogle(jetonGoogle: string, adresse: string): Promise<Session> {
  const corps = { postBody: `id_token=${encodeURIComponent(jetonGoogle)}&providerId=google.com`, requestUri: adresse, returnSecureToken: true, returnIdpCredential: true };
  let d: Record<string, unknown>;
  try {
    const anonyme = await connexion();
    d = await appelFirebase(`${AUTH}:signInWithIdp?key=${FIREBASE.apiKey}`, { ...corps, idToken: anonyme.jeton });
  } catch (err) {
    if (!/FEDERATED_USER_ID_ALREADY_LINKED|EMAIL_EXISTS|CREDENTIAL_ALREADY_IN_USE/.test(String(err))) throw err;
    d = await appelFirebase(`${AUTH}:signInWithIdp?key=${FIREBASE.apiKey}`, corps);
  }
  const s = sessionDe(d, { email: String(d.email ?? ''), fournisseur: 'google.com' });
  changerSession(s);
  return s;
}

// Déconnexion : la collection reste sur ce téléphone ; une nouvelle session anonyme sera créée.
export function deconnexion() {
  changerSession(null);
}

// ---------- La sauvegarde en ligne ----------

export interface Resume { cartes: number; medailles: number; victoires: number; etape: number; coach: string }
export const resumeDe = (c: Collection): Resume => ({
  cartes: cartesPossedees(c), medailles: c.medailles, victoires: c.victoires, etape: c.histoire.etape, coach: c.coach ?? '',
});
export interface SauvegardeEnLigne { code: string; resume: Resume; maj: string }

const entete = (s: Session) => ({ 'content-type': 'application/json', authorization: `Bearer ${s.jeton}` });
const champ = (f: Record<string, { stringValue?: string; integerValue?: string; timestampValue?: string }>, k: string) =>
  f[k]?.stringValue ?? f[k]?.integerValue ?? f[k]?.timestampValue ?? '';

export async function lireEnLigne(): Promise<SauvegardeEnLigne | null> {
  const s = await connexion();
  if (!s.compte) return null;
  const r = await fetch(`https://firestore.googleapis.com/v1/${DOCS}/comptes/${s.uid}`, { headers: entete(s) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Lecture de la sauvegarde refusée (${r.status})`);
  const f = ((await r.json()) as { fields?: Record<string, never> }).fields ?? {};
  return {
    code: champ(f, 'code'), maj: champ(f, 'maj'),
    resume: { cartes: Number(champ(f, 'cartes')), medailles: Number(champ(f, 'medailles')), victoires: Number(champ(f, 'victoires')), etape: Number(champ(f, 'etape')), coach: champ(f, 'coach') },
  };
}

export async function ecrireEnLigne(c: Collection): Promise<boolean> {
  const s = await connexion();
  if (!s.compte) return false;
  const r0 = resumeDe(c);
  const fields = {
    code: { stringValue: await exporterSauvegarde(c) },
    cartes: { integerValue: String(r0.cartes) }, medailles: { integerValue: String(r0.medailles) },
    victoires: { integerValue: String(r0.victoires) }, etape: { integerValue: String(r0.etape) }, coach: { stringValue: r0.coach },
  };
  const corps = { writes: [{ update: { name: `${DOCS}/comptes/${s.uid}`, fields }, updateTransforms: [{ fieldPath: 'maj', setToServerValue: 'REQUEST_TIME' }] }] };
  const r = await fetch(`https://firestore.googleapis.com/v1/${DOCS}:commit`, { method: 'POST', headers: entete(s), body: JSON.stringify(corps) });
  return r.ok;
}

// Une collection « neuve » : rien joué sur ce téléphone (on prend alors la sauvegarde du compte sans demander).
export const collectionNeuve = (c: Collection) => c.victoires === 0 && c.medailles === 0 && c.histoire.etape === 0;

// Après une connexion : que faire des deux sauvegardes ?
//   - 'envoyer' : le compte n'a pas encore de sauvegarde, on y met celle du téléphone ;
//   - 'reprendre' : le téléphone est neuf, on prend celle du compte ;
//   - 'identiques' : rien à faire ;
//   - 'choisir' : deux sauvegardes différentes, le joueur choisit.
export async function decision(local: Collection, enLigne: SauvegardeEnLigne | null): Promise<'envoyer' | 'reprendre' | 'identiques' | 'choisir'> {
  if (!enLigne || !enLigne.code) return 'envoyer';
  if (enLigne.code === await exporterSauvegarde(local)) return 'identiques';
  if (collectionNeuve(local)) return 'reprendre';
  return 'choisir';
}

export async function collectionEnLigne(enLigne: SauvegardeEnLigne): Promise<Collection | string> {
  return importerSauvegarde(enLigne.code);
}

// ---------- Enregistrement automatique ----------
// Quelques secondes après le dernier changement (un combat, un booster… en déclenchent plusieurs).

export const DELAI_ENREGISTREMENT = 4000;
let minuteur: ReturnType<typeof setTimeout> | null = null;
let ecouteurs: ((etat: 'en-cours' | 'ok' | 'erreur') => void)[] = [];
export let derniereSauvegarde: number | null = null;

export function surEtatSauvegarde(f: (etat: 'en-cours' | 'ok' | 'erreur') => void) {
  ecouteurs.push(f);
  return () => { ecouteurs = ecouteurs.filter((x) => x !== f); };
}

export function programmerEnregistrement(c: Collection) {
  if (!compteActuel()) return;
  if (minuteur) clearTimeout(minuteur);
  minuteur = setTimeout(async () => {
    minuteur = null;
    ecouteurs.forEach((f) => f('en-cours'));
    const ok = await ecrireEnLigne(c).catch(() => false);
    if (ok) derniereSauvegarde = Date.now();
    ecouteurs.forEach((f) => f(ok ? 'ok' : 'erreur'));
  }, DELAI_ENREGISTREMENT);
}
