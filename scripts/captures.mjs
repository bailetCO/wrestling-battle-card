// Photos de chaque écran du jeu, en taille téléphone, pour vérifier l'affichage
// sans tester à la main. Utilisé par la skill /captures.
//
// Usage : npm run captures [-- dossier]   (par défaut : .captures/, non enregistré dans le projet)
// Le jeu doit être construit avant (npm run build). Le programme sert dist/ lui-même.
//
// En plus des photos, il signale les problèmes d'affichage visibles par la machine :
// page plus large que l'écran (défilement de côté), éléments qui dépassent du bord,
// erreurs dans la console du navigateur.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const DOSSIER = resolve(process.argv[2] ?? '.captures');
const DIST = resolve('dist');

// Les écrans photographiés, dans l'ordre (adresse après le #).
const ECRANS = [
  ['menu', ''], ['combat-menu', '#combat'], ['carriere', '#arene'], ['entrainement', '#rapide'],
  ['collection', '#collection'], ['fusion', '#fusion'], ['tournois', '#tournois'], ['club', '#club'],
  ['social', '#social'], ['histoire', '#histoire'], ['saison', '#saison'], ['quetes', '#quetes'],
  ['recompenses', '#recompenses'], ['regles', '#regles'], ['tutoriel', '#tutoriel'], ['amis', '#amis'],
];

// Petit serveur pour le jeu construit (un seul fichier HTML).
async function servir() {
  const html = await readFile(join(DIST, 'index.html')).catch(() => null);
  if (!html) throw new Error('dist/index.html introuvable : lance d\'abord « npm run build ».');
  const serveur = createServer((_req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  return { serveur, adresse: `http://127.0.0.1:${serveur.address().port}/` };
}

// Ce que la machine peut voir comme défaut d'affichage sur l'écran affiché.
async function defauts(page) {
  return page.evaluate(() => {
    const l = document.documentElement.clientWidth;
    const res = [];
    if (document.documentElement.scrollWidth > l + 1) res.push(`la page est plus large que l'écran (${document.documentElement.scrollWidth} px pour ${l} px)`);
    const dansDefile = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
    let n = 0;
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect();
      if (!r.width || getComputedStyle(e).position === 'fixed') continue;
      if ((r.right > l + 1 || r.left < -1) && !dansDefile(e)) {
        if (n++ < 5) res.push(`dépasse du bord : <${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? ` class="${e.className}"` : ''}> « ${(e.textContent ?? '').trim().slice(0, 40)} »`);
      }
    }
    if (n > 5) res.push(`… et ${n - 5} autres éléments qui dépassent`);
    return res;
  });
}

const { serveur, adresse } = await servir();
await rm(DOSSIER, { recursive: true, force: true });
await mkdir(DOSSIER, { recursive: true });
const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ ...devices['iPhone 13'] });
const page = await contexte.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });

const rapport = [];
let num = 0;
async function photo(nom) {
  await page.waitForTimeout(400); // laisser finir les animations
  const fichier = `${String(++num).padStart(2, '0')}-${nom}.png`;
  await page.screenshot({ path: join(DOSSIER, fichier), fullPage: true });
  const d = [...await defauts(page), ...erreurs.splice(0).map((e) => `erreur : ${e}`)];
  rapport.push({ fichier, d });
}
// Ferme une scène de dialogue ou une fenêtre qui s'ouvrirait toute seule.
async function fermerFenetres() {
  for (let i = 0; i < 30; i++) {
    const b = page.locator('[role=dialog] button[data-suite], [role=dialog] button, .fenetre button, dialog[open] button').first();
    if (!(await b.isVisible().catch(() => false))) return;
    await b.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
}

// 1. Accueil, puis entrée dans le jeu avec un pseudo de test.
await page.goto(adresse);
await photo('accueil');
await page.fill('#pseudo', 'Photographe');
await page.click('form.form-pseudo button[type=submit]');
await fermerFenetres();

// 2. Chaque écran.
for (const [nom, h] of ECRANS) {
  await page.evaluate((x) => { location.hash = x || '#menu'; }, h);
  await page.waitForTimeout(200);
  await photo(nom);
  await fermerFenetres();
}

// 3. Un combat d'entraînement : début, puis après quelques tours.
await page.evaluate(() => { location.hash = '#rapide'; });
await page.waitForTimeout(300);
const lutter = page.locator('button.cl-choisir').first();
if (await lutter.isVisible().catch(() => false)) {
  await lutter.click({ timeout: 5000 });
  await page.waitForTimeout(500);
  await fermerFenetres();
  await photo('combat-debut');
  // Un tour joué : on voit le résultat du tour pendant le combat.
  const jouer = async () => {
    const action = page.locator('button[data-action]:not([disabled])').first();
    if (!(await action.isVisible().catch(() => false))) return false;
    await action.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
    await fermerFenetres();
    return true;
  };
  if (await jouer()) await photo('combat-apres-un-tour');
  for (let t = 0; t < 40 && await jouer(); t++);
  await photo('fin-de-combat');
} else rapport.push({ fichier: '(combat)', d: ['aucun bouton « Lutter avec… » trouvé'] });

await navigateur.close();
serveur.close();

// Rapport en français.
console.log(`Photos dans : ${DOSSIER}\n`);
let problemes = 0;
for (const { fichier, d } of rapport) {
  console.log(`${d.length ? '⚠️ ' : '✅'} ${fichier}`);
  for (const x of d) { console.log(`     - ${x}`); problemes++; }
}
console.log(`\n${rapport.length} photos, ${problemes} problème(s) repéré(s) automatiquement.`);
