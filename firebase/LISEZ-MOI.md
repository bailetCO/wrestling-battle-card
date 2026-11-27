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
