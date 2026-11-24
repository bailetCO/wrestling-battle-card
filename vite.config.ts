// Vite construit la page du jeu. Le module « singlefile » met tout dans un seul
// fichier HTML (dist/index.html), facile à publier et à ouvrir depuis un lien.
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// La bibliothèque du relais contient le caractère « � » (U+FFFD) écrit tel quel dans
// son code. Certains hébergeurs le refusent : on l'écrit sous la forme \ufffd, qui
// donne exactement le même caractère quand le code tourne.
function remplacerCaractereInvalide(): Plugin {
  return {
    name: 'remplacer-caractere-invalide',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const fichier of Object.values(bundle)) {
        if (fichier.type === 'asset' && typeof fichier.source === 'string') {
          fichier.source = fichier.source.replaceAll('\uFFFD', '\\ufffd');
        }
        if (fichier.type === 'chunk') fichier.code = fichier.code.replaceAll('\uFFFD', '\\ufffd');
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [viteSingleFile(), remplacerCaractereInvalide()],
});
