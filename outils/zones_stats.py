# Repère, sur une carte du pack graphique, la bande des statistiques imprimées (ATT, DEF, CTR, FNT)
# grâce aux couleurs de ses libellés : orange, vert, rose, jaune, rangés de gauche à droite.
# Renvoie la zone en pourcentages de la carte (x, y, largeur l, hauteur h), ou None.
import sys
from PIL import Image
import numpy as np
ORDRE=['att','def','ctr','fnt']
def masques(im):
    a=np.asarray(im).astype(np.float32)/255
    mx=a.max(2); mn=a.min(2); sat=(mx-mn)/(mx+1e-6)
    h=np.asarray(im.convert('HSV')).astype(np.float32)[...,0]*360/255
    vif=(sat>0.5)&(mx>0.5)
    return {'att':vif&((h<38)|(h>352)),'def':vif&(h>80)&(h<165),'ctr':((sat>0.3)&(mx>0.5))&(h>255)&(h<350),'fnt':vif&(h>42)&(h<72)}
def zone(path):
    im=Image.open(path).convert('RGB'); W,H=im.size; m=masques(im)
    bons=[]; lig_meds={}
    for y in range(int(H*0.5),H):
        meds=[]
        for k in ORDRE:
            c=np.where(m[k][y])[0]
            if len(c)>=2: meds.append(np.median(c))
        if len(meds)>=3: lig_meds[y]=(meds[0],meds[-1],len(meds))
        # au moins 3 des 4 libellés colorés, rangés de gauche à droite, sur une bonne largeur
        if len(meds)>=3 and all(meds[i]<meds[i+1] for i in range(len(meds)-1)) and meds[-1]-meds[0]>W*0.4:
            bons.append(y)
    if not bons: return None
    blocs=[]; d=p=bons[0]
    for y in bons[1:]:
        if y-p>4: blocs.append((d,p)); d=y
        p=y
    blocs.append((d,p)); y0,y1=max(blocs,key=lambda b:b[1]-b[0])
    hl=y1-y0+1
    if hl<5: return None
    top=y0-max(3,int(hl*0.4)); bot=y1+int(hl*2.4)
    g=[lig_meds[y] for y in range(y0,y1+1) if y in lig_meds and lig_meds[y][2]==4] or [lig_meds[y] for y in range(y0,y1+1) if y in lig_meds]
    a=np.median([v[0] for v in g]); b=np.median([v[1] for v in g])
    pas=(b-a)/3 if all(v[2]==4 for v in g) else (b-a)/3
    x0=max(0,a-pas*0.75); x1=min(W,b+pas*0.75)
    return {'x':round(x0/W*100,2),'y':round(top/H*100,2),'l':round((x1-x0)/W*100,2),'h':round((bot-top)/H*100,2)}
if __name__=='__main__':
    for p in sys.argv[1:]: print(p, zone(p))
