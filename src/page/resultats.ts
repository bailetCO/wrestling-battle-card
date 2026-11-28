// Résultat de chaque action d'un tour (28/11/2026), sans affichage : il colore la case de l'action
// dévoilée en combat. Lu dans le récit du tour écrit par le moteur.

export type ResultatAction = 'reussie' | 'ratee' | 'combo' | 'contree' | 'defendue' | 'battue' | 'neutre';
export const ETIQUETTE_RESULTAT: Record<ResultatAction, string> = { reussie: 'RÉUSSIE', ratee: 'RATÉE', combo: 'COMBO !', contree: 'CONTRÉE', defendue: 'DÉFENDUE', battue: 'BATTUE', neutre: '' };
const LIB_FAMILLE: Record<string, string> = { attaque: 'attaque', défense: 'défense', defense: 'défense', contre: 'contre', feinte: 'feinte' };
export function resultatAction(lignes: string[], nom: string, autre: string): ResultatAction {
  const a = (l: string) => l.startsWith(nom);
  if (lignes.some((l) => l.startsWith(`${nom} rate son action`))) return 'ratee';
  if (lignes.some((l) => /^Combo/.test(l) && l.includes(nom))) return 'combo';
  for (const l of lignes) {
    const m = l.match(/^(?:L[ae] |L')(\S+) de (.+) l'emporte sur (?:l[ae] |l')(\S+) de (.+)\.$/);
    if (m) {
      if (m[2] === nom) return 'reussie';
      if (m[4] === nom) {
        const gagnante = LIB_FAMILLE[m[1].toLowerCase()] ?? '';
        return gagnante === 'contre' ? 'contree' : gagnante === 'défense' ? 'defendue' : 'battue';
      }
    }
    if (/l'emporte\.$/.test(l) && (l.includes(`${nom} enchaîne`) || l.includes(`: ${nom} a la`) || l.includes(`: ${nom} est plus fort`) || l.startsWith(`${nom} a au moins le double`))) return 'reussie';
    if (/l'emporte\.$/.test(l) && (l.includes(`${autre} enchaîne`) || l.includes(`: ${autre} a la`) || l.includes(`: ${autre} est plus fort`) || l.startsWith(`${autre} a au moins le double`))) return 'battue';
  }
  if (lignes.some((l) => a(l) && / marque \d/.test(l))) return 'reussie';
  if (lignes.some((l) => l.includes('renvoyés') && !a(l))) return 'contree';
  return 'neutre';
}

