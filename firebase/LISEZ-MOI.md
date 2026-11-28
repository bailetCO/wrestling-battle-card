# Règles de sécurité Firebase

Ces fichiers disent à Firebase qui a le droit de lire et d'écrire quoi. Ils ne s'appliquent
pas tout seuls : il faut les coller dans la console Firebase (projet `wrestling-battle-card`)
après chaque modification.

- `database.rules.json` → Realtime Database, onglet **Règles** : remplacer tout le texte, puis **Publier**.
  Salles des combats et échanges entre amis : `salles/<code>/<joueur>`. Chaque joueur (connexion
  anonyme) n'écrit que sa propre place, avec son état (30 000 caractères au plus) et l'heure
  donnée par le serveur. On ne peut lire une salle qu'en connaissant son code ; la liste des
  salles n'est lisible par personne.
- `firestore.rules` → Firestore Database, onglet **Règles** : remplacer tout le texte, puis **Publier**.
  Avis et signalements de bug (`avis`) : dépôt seulement, champs et tailles contrôlés, un envoi
  par minute et par joueur (fiche `limites/<joueur>`, heure du serveur). Personne ne lit depuis le jeu :
  Corentin les lit dans la console (Firestore Database, onglet Données).
  Comptes joueurs (`comptes/<joueur>`) : la sauvegarde de la collection ; seul son propriétaire,
  connecté avec Google ou un e-mail (pas en anonyme), la lit et l'écrit.
  Classement mensuel (`classements/<mois>/joueurs/<joueur>`) : lisible par tous les joueurs connectés ;
  chacun n'écrit que sa ligne, avec un vrai compte. Les règles vérifient le plafond de 80 points par
  jour (jour du serveur, heure universelle) : les points ne montent que de ce que les jours écoulés
  permettent, et ne baissent jamais.
  Parrainage (`parrainages/<filleul>`) : un nouveau joueur avec un vrai compte désigne son parrain,
  une seule fois. Amitiés (`amities/<joueur>_<ami>`) : un joueur existant qui ouvre le lien d'un ami
  le prévient. Lisibles par les joueurs connectés, jamais modifiées ni effacées.

## Comptes joueurs : réglages à faire une fois dans la console Firebase

1. Authentication → Sign-in method : activer **E-mail/Mot de passe** (pas besoin du « lien par e-mail »).
2. Authentication → Sign-in method : activer **Google** ; ouvrir « Configuration du SDK Web » et
   copier l'**ID client Web** dans `googleClientId` (fichier `src/page/firebase.ts`).
3. Authentication → Settings → Domaines autorisés : vérifier que `bailetco.github.io` est dans la liste.
4. Google Cloud Console → API et services → Identifiants → l'ID client Web ci-dessus :
   ajouter `https://bailetco.github.io` dans « Origines JavaScript autorisées ».
5. Coller les nouvelles règles `firestore.rules` (Firestore Database → Règles → Publier).

Les vieilles salles ne sont pas effacées automatiquement (il faudrait l'offre payante) : chaque
joueur efface sa place en quittant, et un état sans signe de vie depuis 90 secondes est ignoré.

## Notifications : envoyer un rappel ou une annonce (28/11/2026)

Les joueurs qui ont accepté les notifications sont inscrits automatiquement. Pour leur écrire :

1. Console Firebase → menu de gauche **Exécuter** (ou « Engage ») → **Messaging**.
2. **Créer votre première campagne** (ou « Nouvelle campagne ») → **Messages Firebase Notifications** → Créer.
3. **Titre** (ex. « 🎁 Ta récompense du jour t'attend ! ») et **Texte** (ex. « Reviens chercher ta case du calendrier, le 7e jour c'est un booster rare. »). Image : facultative.
4. **Cible** : « Application » → choisir l'application web **Wrestling Battle Card**.
5. **Planification** :
   - Annonce : « Maintenant ».
   - Rappel quotidien : « Planifié » → « Récurrent » → « Quotidien », à 18 h 00 (heure de Paris), sans date de fin. Cocher « Fuseau horaire du destinataire » si proposé.
6. Options supplémentaires : rien d'obligatoire. **Examiner** → **Publier**.

Pour essayer sur ton seul téléphone d'abord : à l'étape 3, bouton « Envoyer un message test » (il faut le jeton du téléphone : ouvre le jeu avec `?dev` à la fin de l'adresse, puis « Plus » → « Notifications » : le jeton s'affiche, à copier).
Ne pas envoyer plus d'une notification par jour : c'est ce qui est promis aux joueurs.

## Codes créateurs : ajouter un créateur (28/11/2026)

Un code donne au joueur la carte Champion du Monde du créateur (avec son nom et son image) et un booster épique, une fois par joueur.

1. Console Firebase → **Firestore Database** → onglet **Données**.
2. Si elle n'existe pas encore : **Commencer une collection**, identifiant `createurs`.
3. **Ajouter un document** :
   - **ID du document** : le code, en MAJUSCULES, 3 à 20 lettres ou chiffres, sans espace (ex. `LUTTEMAG`) ;
   - champ `nom` (string) : le nom affiché sur la carte, 30 caractères au plus (ex. `Lutte Mag`) ;
   - champ `nation` (string) : le style de la carte, celui du Champion du Monde de cette nation, parmi `usa`, `russie`, `japon`, `iran`, `georgie`, `azerbaidjan`, `turquie`, `ouzbekistan`, `kazakhstan`, `kirghizistan`, `afrique`, `europe` ;
   - champ `image` (string, facultatif) : le lien d'une image carrée du créateur, qui commence par `https://` (laisser vide : portrait dessiné) ;
   - champ `actif` (boolean) : `true`. Le passer à `false` désactive le code (ceux qui l'ont déjà gardent leur carte).
4. Enregistrer : le code marche tout de suite, sans mise à jour du jeu.

Combien de joueurs chaque code a amenés : collection `soutiens` (une fiche par joueur et par code, avec le champ `code`) ; dans l'onglet Données, filtrer sur `code` (« Ajouter un filtre », `code` == `LUTTEMAG`) pour compter.
Penser aussi à coller les nouvelles règles `firestore.rules`.

