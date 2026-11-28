# Wrestling Battle Card

Jouer : https://bailetco.github.io/wrestling-battle-card/ (mis à jour automatiquement à chaque modification de la branche main).

Jeu de cartes de lutte olympique jouable dans le navigateur. Les règles sont dans
[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Où en est le projet

- [x] Étape 1 – Moteur de règles (sans graphisme), testé
- [x] Étape 2 – Premier combat jouable dans le navigateur, contre l'ordinateur
- [x] Étape 3 – Cartes et interface style manga : 15 lutteurs, portraits provisoires, raretés (puis 120 lutteurs, 12 nations, le 25/11/2026)
- [x] Étape 4 – Collection, decks, niveau « fort » de l'ordinateur et rééquilibrage
- [x] Étape 5 – Combat entre amis en ligne
- [ ] Étape 6 – Mise en ligne, tests avec la communauté et équilibrage
- [ ] Étape 7 – Comptes joueurs et sauvegarde de la collection
- [ ] Étape 8 – Monétisation et application mobile

## Organisation

- `src/moteur/config.ts` : tous les chiffres du jeu (lutteurs, coûts, points, probabilités).
- `src/moteur/combat.ts` : les règles d'un tour, des périodes et de la fin du match.
- `src/moteur/hasard.ts` : le hasard, rejouable à l'identique avec une graine.
- `src/moteur/ia.ts` : l'ordinateur, niveau normal (au hasard) et niveau fort.
- `src/page/` : la page du jeu (écran de choix, combat, fin). Elle n'applique aucune règle elle-même, elle appelle le moteur.
- `src/page/partie.ts` : le déroulé d'une partie contre l'ordinateur (initiative, pile ou face).
- `src/page/carte.ts` : la carte d'un lutteur et ses cadres de rareté.
- `src/page/portrait.ts` : les portraits et scènes manga provisoires (une scène par niveau de carte), dessinés en code. Pour une vraie illustration, renseigner `image` dans `APPARENCE`.
- `src/page/enligne.ts` : le combat entre amis (salle, choix secrets, initiative, pile ou face, reprise), sans affichage, et la connexion par relais public.
- `.github/workflows/pages.yml` : publication automatique sur GitHub Pages (tests puis construction) ; sur une demande de fusion vers main, vérifie seulement, sans publier.
- `src/page/club.ts` : la section Social (amis, transfert de lutteur du jour, transfert entre amis), sans affichage.
- `src/page/aide.ts` : la page Règles (textes tirés de la configuration) et le tutoriel (écrans et combat guidé).
- `src/moteur/auto.ts` : le combat automatique (l'ordinateur joue pour les deux camps, force selon le niveau de compte).
- `src/page/polices/` : la police des titres (Roboto Condensed, licence libre OFL), intégrée au jeu : rien n'est téléchargé chez Google.
- `src/page/quetes.ts` : les quêtes journalières (tirage du jour, progression, récompenses, quêtes uniques), sans affichage.
- `src/page/saison.ts` : la saison sportive (mode histoire 2 : interclub, régional, national, international, Mondiaux, JO), sans affichage.
- `src/page/dialogues.ts` : les scènes de dialogue des modes histoire (Darius et Cocoach). Darius, le mentor, a aussi sa carte secrète, gagnée à la fin du mode histoire ; ses images sont dans `public/darius/`. Cocoach (rival puis ami) a ses expressions et ses illustrations dans `public/cocoach/` (fiche, planche de contrôle et anciennes images : `direction-artistique/cocoach/`), et sa carte secrète, gagnée avec la première médaille d'or aux JO.
- `src/page/histoire.ts` : le mode histoire (18 étapes, validation dans l'ordre, récompenses), sans affichage.
- `src/page/tournoi.ts` : les tournois (individuel à double tableau de 6 à 15 lutteurs, tournoi par équipe avec bonus de nation, ancienne compétition à 6, inscriptions et gains), sans affichage.
- `src/page/partage.ts` : les moments à partager (affiche façon manga dessinée à la volée, menu de partage du téléphone).
- `src/page/compte.ts` et `src/page/ecrans/compte.ts` : les comptes joueurs (Google ou e-mail), la sauvegarde en ligne automatique et le choix entre deux sauvegardes.
- `src/page/classement.ts` et `src/page/ecrans/classement.ts` : le classement mensuel (points de combat, plafond du jour, paliers, Top 10, classements tous / amis / pays).
- `src/page/parrainage.ts` et `src/page/ecrans/parrainage.ts` : inviter un ami (lien perso, cadeau de bienvenue, récompenses du parrain, amis automatiques).
- `src/page/son.ts` et `src/page/ecrans/reglages-son.ts` : sons (fabriqués en code, style arcade) et vibrations, avec leurs réglages.
- `src/page/quotidien.ts` et `src/page/ecrans/quotidien.ts` : récompense du jour (calendrier de 7 jours) et cadeau de retour de Darius.
- `src/page/notifications.ts` et `src/page/ecrans/notifications.ts` : inscription aux notifications (Firebase Cloud Messaging) ; leur affichage est dans `public/sw.js`.
- `src/page/collection.ts` : la collection (cartes, boosters, decks, médailles et $), gardée dans le navigateur.
- `src/page/nouveautes.ts` : le numéro de version et le texte des nouveautés (à compléter à chaque mise à jour).
- `src/page/beta.ts` et `src/page/ecrans/beta.ts` : la bêta (code d'invitation, nouveautés, export et import de la sauvegarde, installation sur le téléphone).
- `src/page/firebase.ts` : la connexion anonyme à Firebase et les salles des combats entre amis (relais publics en secours).
- `scripts/fusion.ts` (`npm run fusion`) : cartes de base contre cartes plus faibles montées au même niveau par fusion, avec un deck optimisé pour chaque carte.
- `firebase/` : les règles de sécurité de Firebase, à coller dans la console (mode d'emploi dans `firebase/LISEZ-MOI.md`).
- `public/` : icônes, vignette de partage, manifeste et copie hors ligne (`sw.js`) pour installer le jeu sur le téléphone.
- Écrans (adresse après `#`) : `pseudo`, menu, `collection` (tri, styles, boutons de test), `fusion`, `club` (Mon Club), `tournois`, `social`, `combat`, `regles`, `tutoriel`, `arene`, `amis`.
- `tests/` : un test par règle.
- `scripts/simuler.ts` : simule des milliers de combats pour vérifier l'équilibrage.
- `scripts/verifier-cahier.ts` : compare les tableaux des lutteurs du cahier des charges avec le jeu.
- `scripts/captures.mjs` : photographie chaque écran en taille téléphone et signale les défauts d'affichage.
- `.claude/skills/` : les recettes de travail de Claude (`/fin-etape`, `/captures`, `/equilibrage`, `/nouveau-lutteur`, `/publier`, `/verifier-cahier`, `/retours-testeurs`, `/avant-lancement`), à taper dans Claude Code.

## Commandes

```bash
npm install          # une seule fois
npm test             # lance tous les tests
npm run simuler      # simule les combats (ordinateur au hasard puis fort) et vérifie les raretés
npm run simuler -- 400 150   # plus de combats, résultat plus précis (environ 1 minute)
npm run simuler -- --sauver .equilibrage/reference.json   # garde les résultats pour comparer
npm run simuler -- --avant .equilibrage/reference.json    # avant/après pour chaque lutteur
npm run simuler -- --lutteurs usa-4,japon-5               # mesure rapide de quelques lutteurs
npm run dev          # lance le jeu sur l'ordinateur (adresse affichée, à ouvrir dans le navigateur)
npm run verifier-cahier   # différences entre le cahier des charges et le jeu (lutteurs)
npm run captures     # (après build) photos de chaque écran dans .captures/, non enregistrées
npm run build        # construit le jeu en un seul fichier : dist/index.html
npm run apercu       # sert le jeu construit sur http://localhost:4173 ; le combat entre amis
                     # y marche entre deux onglets du même navigateur (pour tester)
```
