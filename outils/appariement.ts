// Proposition d'appariement entre les lutteurs du jeu et ceux du pack graphique V1, délégation
// par délégation : on range les 10 du jeu du plus léger au plus lourd (style et force), les 10
// du pack par poids imprimé, et on les associe rang par rang. Résultat : outils/appariement.json
// et outils/appariement.md, à faire valider avant usage.
// Lancer : npx tsx outils/appariement.ts <dossier du pack>

import fs from 'node:fs';
import path from 'node:path';
import { LUTTEURS } from '../src/moteur/config';

const CODES: Record<string, string> = { afrique: 'AFR', ouzbekistan: 'UZB', kirghizistan: 'KGZ', iran: 'IRN', georgie: 'GEO', turquie: 'TUR', europe: 'EUR', usa: 'USA', russie: 'RUS', azerbaidjan: 'AZE', kazakhstan: 'KAZ', japon: 'JPN' };

// Corpulence estimée d'après le style (plus haut = plus lourd), puis la force pour départager.
function corpulence(style: string, force: number): number {
  const s = style.toLowerCase();
  const base = s.includes('poids lourd') ? 5 : s.includes('puissant') ? 4 : s.includes('pression') ? 3.5 : s.includes('défenseur') ? 3
    : s.includes('équilibré') ? 2.5 : s.includes('technicien') ? 2 : s.includes('contre') ? 1.5 : s.includes('explosif') || s.includes('rapide') ? 1 : 2.5;
  return base * 1000 + force;
}

const dossier = process.argv[2] ?? '/tmp/pack';
const pack: { id: string; name: string; delegation: string; weight_kg: number | null }[] = JSON.parse(fs.readFileSync(path.join(dossier, 'wrestlers.json'), 'utf8'));
const lignes: { jeu: string; nomJeu: string; style: string; rarete: string; pack: string; nomPack: string; poids: number | null; delegation: string }[] = [];
for (const [nation, code] of Object.entries(CODES)) {
  const jeu = LUTTEURS.filter((l) => l.nation === nation).sort((a, b) => corpulence(a.style, a.force) - corpulence(b.style, b.force));
  const p = pack.filter((w) => w.delegation === code).sort((a, b) => (a.weight_kg ?? 86) - (b.weight_kg ?? 86));
  if (jeu.length !== p.length) throw new Error(`${nation} : ${jeu.length} dans le jeu, ${p.length} dans le pack`);
  jeu.forEach((l, i) => lignes.push({ jeu: l.id, nomJeu: l.nom, style: l.style, rarete: l.rarete, pack: p[i].id, nomPack: p[i].name, poids: p[i].weight_kg, delegation: code }));
}
fs.writeFileSync('outils/appariement.json', JSON.stringify(lignes.map(({ jeu, pack, nomPack, poids }) => ({ jeu, pack, nom: nomPack, poids })), null, 1) + '\n');
let md = '# Appariement proposé : lutteurs du jeu ↔ pack graphique V1\n\nRègle : dans chaque délégation, les lutteurs du jeu sont rangés du plus léger au plus lourd (style, puis force), ceux du pack par poids imprimé, et associés rang par rang. Identifiants, statistiques et raretés du jeu ne changent pas ; seul le nom affiché devient celui imprimé sur la carte.\n';
for (const code of Object.values(CODES)) {
  md += `\n## ${code}\n\n| Identifiant du jeu | Nom actuel | Style | Rareté de départ | Carte du pack | Nouveau nom | Poids imprimé |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const l of lignes.filter((x) => x.delegation === code)) md += `| ${l.jeu} | ${l.nomJeu} | ${l.style} | ${l.rarete} | ${l.pack} | ${l.nomPack} | ${l.poids ?? 'inconnu'} kg |\n`;
}
fs.writeFileSync('outils/appariement.md', md);
console.log(lignes.length, 'associations');
