# Importe le pack graphique V1 dans le jeu, sans toucher au moteur ni aux données des lutteurs.
#   python3 -I outils/importer_pack.py <dossier du pack décompressé> [--essai id1,id2]
# - copie les images utiles dans public/illustrations/v1/ (mêmes chemins que dans le pack) ;
# - fabrique des miniatures légères pour le téléphone (public/illustrations/v1/mini/...) ;
# - écrit src/page/illustrations/pack-v1.json : lutteur du jeu → carte du pack (outils/appariement.json),
#   zone des statistiques imprimées de chaque carte, Cocoach, emblèmes des nations.
# --essai : n'associe que ces lutteurs du jeu (essai avant l'import complet).
import json, os, shutil, statistics, sys, collections
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zones_stats import zone

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = sys.argv[1]
ESSAI = None
if '--essai' in sys.argv:
    ESSAI = set(sys.argv[sys.argv.index('--essai') + 1].split(','))
DEST = os.path.join(RACINE, 'public', 'illustrations', 'v1')
NIVEAUX = {'commune': 'commune', 'rare': 'rare', 'epique': 'epique', 'legendaire': 'legendaire', 'champion': 'champion_du_monde'}
NATIONS = {'afrique': 'AFR', 'ouzbekistan': 'UZB', 'kirghizistan': 'KGZ', 'iran': 'IRN', 'georgie': 'GEO', 'turquie': 'TUR', 'europe': 'EUR', 'usa': 'USA', 'russie': 'RUS', 'azerbaidjan': 'AZE', 'kazakhstan': 'KAZ', 'japon': 'JPN'}

def charger(nom):
    with open(os.path.join(PACK, nom), encoding='utf-8') as f:
        return json.load(f)

def copier(rel, mini=None):
    src = os.path.join(PACK, rel)
    if not os.path.exists(src):
        return False
    dst = os.path.join(DEST, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)
    if mini:
        m = os.path.join(DEST, 'mini', rel)
        os.makedirs(os.path.dirname(m), exist_ok=True)
        im = Image.open(src).convert('RGB')
        im.thumbnail(mini, Image.LANCZOS)
        im.save(m, 'WEBP', quality=72, method=6)
    return True

lutteurs_pack = {w['id']: w for w in charger('wrestlers.json')}
cartes = charger('cards.json') + charger('rival_cards.json')
appariement = json.load(open(os.path.join(RACINE, 'outils', 'appariement.json'), encoding='utf-8'))
if ESSAI:
    appariement = [a for a in appariement if a['jeu'] in ESSAI]

shutil.rmtree(DEST, ignore_errors=True)
manquants = []
# Zones des statistiques imprimées : détection, puis alignement sur les autres raretés du même lutteur
zones = {}
par_lutteur = collections.defaultdict(list)
for c in cartes:
    par_lutteur[c['wrestler_id']].append(c['image'])
    z = zone(os.path.join(PACK, c['image']))
    if z:
        zones[c['image']] = {k: float(v) for k, v in z.items()}
for w, ims in par_lutteur.items():
    surs = [zones[i] for i in ims if i in zones and 'legendaire' not in i]
    if not surs:
        continue
    med = {k: round(statistics.median(z[k] for z in surs), 2) for k in ['x', 'y', 'l', 'h']}
    for i in ims:
        z = zones.get(i)
        if z is None or 'legendaire' in i or abs(z['y'] - med['y']) > 3 or abs(z['x'] - med['x']) > 4:
            zones[i] = dict(med)

donnees = {'version': 'v1', 'lutteurs': {}, 'cocoach': {}, 'emblemes': {}, 'cadres': {}}
for a in appariement:
    w = lutteurs_pack[a['pack']]
    images = {}
    for niv_jeu, niv_pack in NIVEAUX.items():
        rel = w['images'][niv_pack]
        if copier(rel, mini=(180, 270)):
            images[niv_jeu] = {'chemin': rel, 'zone': zones.get(rel)}
        else:
            manquants.append(rel)
    portrait = w.get('portrait')
    if portrait and copier(portrait, mini=(96, 96)):
        pass
    else:
        manquants.append(portrait); portrait = None
    donnees['lutteurs'][a['jeu']] = {'pack': a['pack'], 'nom': w['name'], 'poids': w['weight_kg'], 'delegation': w['delegation'], 'images': images, 'portrait': portrait}

rival = charger('rival.json')
images = {}
for niv_jeu, niv_pack in NIVEAUX.items():
    rel = rival['images'][niv_pack]
    if copier(rel, mini=(180, 270)):
        images[niv_jeu] = {'chemin': rel, 'zone': zones.get(rel)}
    else:
        manquants.append(rel)
pres = rival.get('presentation')
if pres and copier(pres, mini=(360, 540)):
    pass
else:
    manquants.append(pres); pres = None
port = rival.get('portrait')
if not (port and copier(port, mini=(96, 96))):
    manquants.append(port); port = None
donnees['cocoach'] = {'nom': rival['name'], 'titre': rival.get('title'), 'images': images, 'presentation': pres, 'portrait': port}

for e in charger('emblems.json'):
    if copier(e['path']):
        donnees['emblemes'][e['id']] = e['path']
    else:
        manquants.append(e['path'])
donnees['nations'] = NATIONS
for c in charger('frames.json'):
    if copier(c['path']):
        donnees['cadres'][c['id']] = c['path']
    else:
        manquants.append(c['path'])

os.makedirs(os.path.join(RACINE, 'src', 'page', 'illustrations'), exist_ok=True)
with open(os.path.join(RACINE, 'src', 'page', 'illustrations', 'pack-v1.json'), 'w', encoding='utf-8') as f:
    json.dump(donnees, f, ensure_ascii=False, indent=1)
    f.write('\n')
taille = sum(os.path.getsize(os.path.join(d, x)) for d, _, fs in os.walk(DEST) for x in fs)
print(f"{len(donnees['lutteurs'])} lutteurs associés, Cocoach, {len(donnees['emblemes'])} emblèmes, {len(donnees['cadres'])} cadres ; {taille/1e6:.1f} Mo ; manquants : {manquants}")
