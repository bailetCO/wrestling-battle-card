// Compare le cahier des charges et le jeu, pour ce qui peut être vérifié par la machine :
// les tableaux des lutteurs (rareté, style, endurance, force, récupération, actions, départ)
// et les noms en double. Utilisé par la skill /verifier-cahier.
// Usage : npm run verifier-cahier
// Il ne modifie rien : il affiche seulement les différences.

import { readFileSync } from 'node:fs';
import { ACTIONS, CARTES_SPECIALES, CHAMPIONS, LUTTEURS } from '../src/moteur/config';

const RARETES: Record<string, string> = { commune: 'commune', rare: 'rare', épique: 'epique', légendaire: 'legendaire', 'champion du monde': 'champion' };
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const idAction = new Map(Object.values(ACTIONS).map((a) => [norm(a.nom), a.id]));

const lignes = readFileSync('CAHIER_DES_CHARGES.md', 'utf8').split('\n');
const differences: string[] = [];
const vus = new Set<string>();
let dansTableau = false;

lignes.forEach((ligne, i) => {
  if (ligne.startsWith('| Lutteur | Rareté |')) { dansTableau = true; return; }
  if (!ligne.startsWith('|')) { dansTableau = false; return; }
  if (!dansTableau || ligne.startsWith('| ---')) return;
  const c = ligne.split('|').slice(1, -1).map((x) => x.trim());
  const [nomOrigine, rarete, style, endurance, force, recup, actions, depart] = c;
  const nom = nomOrigine.replace(/\s*\([^)]*\)\s*$/, '');
  const ou = `ligne ${i + 1}`;
  const l = LUTTEURS.find((x) => x.nom === nom);
  if (!l) { differences.push(`${ou} : « ${nom} » est dans le cahier mais pas dans le jeu`); return; }
  vus.add(l.id);
  const ecart = (quoi: string, cahier: string | number, jeu: string | number) => {
    if (String(cahier) !== String(jeu)) differences.push(`${nom} (${ou}) : ${quoi} ${cahier} dans le cahier, ${jeu} dans le jeu`);
  };
  ecart('rareté', RARETES[norm(rarete)] ?? rarete, l.rarete);
  ecart('style', style, l.style);
  ecart('endurance', Number(endurance), l.enduranceMax);
  ecart('force', Number(force), l.force);
  ecart('récupération', `${Number(recup.replace('%', '').replace(',', '.').trim())} %`, `${Math.round(l.recuperation * 100)} %`);
  const ids = actions.split(',').map((a) => idAction.get(norm(a)) ?? `?${a.trim()}`);
  ecart('actions', ids.join(' '), l.actions.join(' '));
  ecart('départ', depart === 'oui' ? 'oui' : 'non', l.depart ? 'oui' : 'non');
});

for (const l of LUTTEURS) if (!vus.has(l.id)) differences.push(`« ${l.nom} » (${l.id}) est dans le jeu mais pas dans les tableaux du cahier`);

// Noms en double parmi toutes les cartes (lutteurs et Champions du Monde).
const parNom = new Map<string, string[]>();
for (const l of [...LUTTEURS, ...CHAMPIONS, ...CARTES_SPECIALES]) parNom.set(l.nom, [...(parNom.get(l.nom) ?? []), l.id]);
for (const [nom, ids] of parNom) if (ids.length > 1) differences.push(`le nom « ${nom} » est porté par plusieurs cartes : ${ids.join(', ')}`);

console.log(`${vus.size} lutteurs du cahier comparés au jeu.\n`);
if (!differences.length) console.log('✅ Aucune différence.');
else {
  for (const d of differences) console.log(`- ${d}`);
  console.log(`\n${differences.length} différence(s).`);
}
