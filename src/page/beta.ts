// La bêta : code d'invitation, nouveautés à montrer, export et import de la sauvegarde.
// Aucun affichage ici (voir ecrans/beta.ts) : ces règles sont testées dans tests/beta.test.ts.

import { depuisSauvegarde, type Collection } from './collection';
import { NOUVEAUTES, VERSION, type Nouveautes } from './nouveautes';

// ---------- Code d'invitation ----------

// Empreinte (FNV-1a, 32 bits) : le code n'est pas écrit en clair dans le jeu. Ce n'est qu'un verrou
// léger (le jeu est public) : il évite qu'un inconnu tombe sur la bêta par hasard.
export function empreinte(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Empreintes des codes acceptés (aujourd'hui un seul : celui que Corentin envoie aux testeurs).
const CODES_INVITATION = ['783870b9'];

// Majuscules, minuscules, espaces et tirets ne comptent pas.
export const normaliserCode = (code: string) => code.toUpperCase().replace(/[\s-]/g, '');
export const codeInvitationValide = (code: string) => CODES_INVITATION.includes(empreinte(normaliserCode(code)));

// ---------- Nouveautés ----------

// Ce qu'il faut montrer au démarrage, selon la dernière version vue par ce téléphone.
// Premier lancement (rien de vu) : rien, le joueur découvre le jeu. Sinon : les nouveautés
// des versions sorties depuis sa dernière visite.
export function nouveautesAMontrer(versionVue: string | null, liste: Nouveautes[] = NOUVEAUTES, actuelle = VERSION): Nouveautes[] {
  if (!versionVue || versionVue === actuelle) return [];
  const i = liste.findIndex((n) => n.version === versionVue);
  return i === -1 ? liste.slice(0, 1) : liste.slice(0, i);
}

// ---------- Export et import de la sauvegarde ----------

// Format : WBC1.<sauvegarde compressée en base64>.<contrôle>, ou WBC0 si le navigateur ne sait pas
// compresser. Le contrôle repère un code abîmé ou retouché à la main. Ce n'est pas une protection
// contre un tricheur décidé (le jeu tourne sur le téléphone) : ce sera le rôle des comptes en ligne.
const SEL = 'wbc-sauvegarde';
const controle = (corps: string) => empreinte(SEL + corps);

const versBase64 = (o: Uint8Array) => {
  let s = '';
  for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000));
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const depuisBase64 = (t: string) => Uint8Array.from(atob(t.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));

async function transformer(o: Uint8Array, flux: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const sortie = new Blob([o as BlobPart]).stream().pipeThrough(flux);
  return new Uint8Array(await new Response(sortie).arrayBuffer());
}

export async function exporterSauvegarde(c: Collection): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(c));
  const compresse = typeof CompressionStream !== 'undefined';
  const corps = `${compresse ? 'WBC1' : 'WBC0'}.${versBase64(compresse ? await transformer(json, new CompressionStream('deflate-raw')) : json)}`;
  return `${corps}.${controle(corps)}`;
}

// Rend la collection lue, ou un message d'erreur pour le joueur.
export async function importerSauvegarde(code: string): Promise<Collection | string> {
  const t = code.replace(/\s/g, '');
  const m = /^(WBC[01])\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/.exec(t);
  if (!m) return 'Ce n\'est pas un code de sauvegarde Wrestling Battle Card. Copie le code en entier.';
  const corps = `${m[1]}.${m[2]}`;
  if (controle(corps) !== m[3]) return 'Ce code est incomplet ou a été modifié. Recopie-le en entier, sans rien changer.';
  try {
    let octets: Uint8Array = depuisBase64(m[2]);
    if (m[1] === 'WBC1') {
      if (typeof DecompressionStream === 'undefined') return 'Ton navigateur est trop ancien pour lire ce code. Mets-le à jour, puis réessaie.';
      octets = await transformer(octets, new DecompressionStream('deflate-raw'));
    }
    const brut = JSON.parse(new TextDecoder().decode(octets));
    if (!brut || typeof brut !== 'object' || !('exemplaires' in brut)) return 'Ce code ne contient pas de collection.';
    return depuisSauvegarde(brut);
  } catch {
    return 'Ce code est abîmé : impossible de le lire. Recopie-le en entier.';
  }
}
