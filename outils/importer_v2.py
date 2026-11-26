# Importe des illustrations « nouvelle formule » (V2) : une image sans texte par lutteur et par
# rareté, nommée <id>_<rareté>.png (commune, rare, epique, legendaire, champion). Le jeu dessine
# lui-même le cadre, le nom, l'étiquette de rareté et les statistiques par-dessus.
#   python3 -I outils/importer_v2.py <dossier ou zip déjà extrait> [<dossier> ...]
# Pour chaque image : une grande version (600 × 900) et une miniature (240 × 360) en WebP dans
# public/illustrations/v2/, puis mise à jour de src/page/illustrations/pack-v2.json.
# Les fiches personnage (<id>_fiche.png) et les planches de contrôle sont ignorées.
import json, os, re, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(RACINE, 'public', 'illustrations', 'v2')
REGISTRE = os.path.join(RACINE, 'src', 'page', 'illustrations', 'pack-v2.json')
NIVEAUX = ['commune', 'rare', 'epique', 'legendaire', 'champion']
TAILLES = {'': (600, 900), 'mini/': (240, 360)}
MOTIF = re.compile(r'^(.+)_(' + '|'.join(NIVEAUX) + r')\.(png|jpe?g|webp)$', re.I)

ids_connus = set(re.findall(r"^  \['([a-z0-9-]+)',", open(os.path.join(RACINE, 'src', 'moteur', 'config.ts'), encoding='utf-8').read(), re.M))
ids_connus.add('cocoach')

registre = json.load(open(REGISTRE, encoding='utf-8')) if os.path.exists(REGISTRE) else {'version': 'v2', 'lutteurs': {}}
compte, ignores = 0, []
for dossier in sys.argv[1:]:
    for nom in sorted(os.listdir(dossier)):
        m = MOTIF.match(nom)
        if not m:
            ignores.append(nom); continue
        ident, niveau = m.group(1), m.group(2).lower()
        if ident not in ids_connus:
            print(f'ATTENTION : identifiant inconnu du jeu, image ignorée : {nom}'); continue
        im = Image.open(os.path.join(dossier, nom)).convert('RGB')
        if abs(im.width / im.height - 2 / 3) > 0.02:
            print(f'ATTENTION : {nom} n\'est pas au format 2:3 ({im.width} × {im.height}), recadrée au centre')
            h = round(im.width * 3 / 2)
            if h <= im.height: im = im.crop((0, (im.height - h) // 2, im.width, (im.height - h) // 2 + h))
            else:
                w = round(im.height * 2 / 3); im = im.crop(((im.width - w) // 2, 0, (im.width - w) // 2 + w, im.height))
        for prefixe, taille in TAILLES.items():
            chemin = os.path.join(DEST, prefixe, ident, f'{niveau}.webp')
            os.makedirs(os.path.dirname(chemin), exist_ok=True)
            im.resize(taille, Image.LANCZOS).save(chemin, 'WEBP', quality=82, method=6)
        niveaux = registre['lutteurs'].setdefault(ident, [])
        if niveau not in niveaux: niveaux.append(niveau)
        niveaux.sort(key=NIVEAUX.index)
        compte += 1
registre['lutteurs'] = dict(sorted(registre['lutteurs'].items()))
json.dump(registre, open(REGISTRE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{compte} illustrations importées ; {len(registre["lutteurs"])} lutteur(s) en nouvelle formule.')
if ignores: print('Fichiers ignorés :', ', '.join(ignores))
