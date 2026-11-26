# Construit la page de test « préproduction graphique » : le jeu (construit avec VITE_PAQUETS=1)
# et ses images regroupées en paquets JSON (base64) par taille et par délégation, dans
# dist-test/. Le jeu normal (dist/) garde ses images en fichiers séparés.
#   VITE_PAQUETS=1 npx vite build --outDir dist-test && python3 -I outils/page_test.py
import base64, json, os, shutil, sys
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'public', 'illustrations', 'v1')
DEST = os.path.join(RACINE, 'dist-test', 'illustrations', 'v1')
UTILES = json.load(open(os.path.join(RACINE, 'src', 'page', 'illustrations', 'pack-v1.json'), encoding='utf-8'))

def paquet(rel):
    mini = rel.startswith('mini/')
    r = rel[5:] if mini else rel
    if r.startswith('assets/cards/'): g = r.split('/')[2]
    elif r.startswith('assets/portraits/'): g = 'portraits'
    elif r.startswith('assets/rival/'): g = 'cocoach'
    else: g = 'emblemes'
    return ('mini' if mini else 'grande') + '-' + g

# fichiers utilisés par le jeu : grandes cartes, miniatures, portraits (mini), Cocoach, emblèmes
groupes = {}
for d, _, fs in os.walk(SRC):
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), SRC).replace(os.sep, '/')
        if rel.startswith('frames/') or rel.startswith('assets/portraits/') or rel == 'mini/assets/rival/cocoach/presentation.webp':
            continue
        groupes.setdefault(paquet(rel), {})[rel] = base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
shutil.rmtree(DEST, ignore_errors=True)
os.makedirs(os.path.join(DEST, 'paquets'))
for nom, contenu in sorted(groupes.items()):
    with open(os.path.join(DEST, 'paquets', nom + '.json'), 'w') as f:
        json.dump(contenu, f, separators=(',', ':'))
tailles = {n: os.path.getsize(os.path.join(DEST, 'paquets', n + '.json')) for n in groupes}
print(len(groupes), 'paquets,', sum(len(c) for c in groupes.values()), 'images,', f'{sum(tailles.values())/1e6:.1f} Mo')
print('plus gros :', sorted(tailles.items(), key=lambda x: -x[1])[:3])
