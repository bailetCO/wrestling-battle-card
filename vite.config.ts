// Vite construit la page du jeu. Le module « singlefile » met tout dans un seul
// fichier HTML (dist/index.html), facile à publier et à ouvrir depuis un lien.
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
