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
  Tout fermé pour l'instant (avis et statistiques : lots C et D).

Les vieilles salles ne sont pas effacées automatiquement (il faudrait l'offre payante) : chaque
joueur efface sa place en quittant, et un état sans signe de vie depuis 90 secondes est ignoré.
