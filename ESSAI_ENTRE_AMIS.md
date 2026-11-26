# Fiche d'essai : combat entre amis sur deux téléphones

But : vérifier en vrai ce que les tests automatiques ne peuvent pas voir (deux téléphones, deux réseaux, de vraies coupures).
Durée : environ 20 minutes. Il faut deux téléphones (A et B), idéalement l'un en Wi-Fi et l'autre en 4G.

Note le résultat de chaque ligne (✅ ou ❌) et, en cas de problème, ce qui s'est passé et l'heure. Une capture d'écran aide beaucoup.

## 1. Entrer dans la salle

- [ ] A ouvre le jeu, va dans Combat, puis « Combat entre amis », et crée une salle : un code s'affiche.
- [ ] B ouvre le même lien, va dans « Combat entre amis » et tape le code : chacun voit « Coach … est dans la salle » en moins de 10 secondes.
- [ ] Les deux pseudos et les niveaux de compte sont les bons de chaque côté.

## 2. Un combat normal

- [ ] Chacun choisit son lutteur : le combat commence des deux côtés.
- [ ] Jouez 5 tours : le même score et la même endurance s'affichent sur les deux téléphones à chaque tour.
- [ ] Une initiative arrive : seul celui qui l'a voit la fenêtre, et l'autre attend sans blocage.
- [ ] Un pile ou face arrive : les deux voient le même résultat.
- [ ] Fin du combat : le gagnant reçoit 2 médailles, une seule fois (recharger la page ne redonne rien).

## 3. Les styles de combat

- [ ] Format Enchaînement : chacun compose 3 actions, la séquence se joue pareil des deux côtés.
- [ ] Durée infinie : le combat continue après le tour 10 et finit par un tombé ou un épuisement (dès le tour 30).
- [ ] Combat auto coché par les deux : le combat se joue tout seul et donne le même résultat des deux côtés. Coché par un seul : combat normal.

## 4. Coupures

- [ ] Pendant un combat, B ferme l'application 30 secondes puis la rouvre : il retrouve le combat au bon tour (« Reprendre »).
- [ ] B passe du Wi-Fi à la 4G pendant un tour : le tour finit quand même.
- [ ] B quitte pour de bon : A voit que son ami est parti et peut revenir au menu.

## 5. Transferts entre amis

- [ ] Dans Social, A propose un double à B : B voit l'offre, l'accepte, et chacun reçoit la bonne carte.

## Ce qu'il faut me renvoyer

La liste avec les ✅ et ❌, les captures des problèmes, le modèle des deux téléphones et le type de réseau.
