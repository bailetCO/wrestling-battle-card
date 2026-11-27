// La page du jeu : point d'entrée. Les écrans sont dans le dossier « ecrans » ; ici, la navigation.

import './style.css';
import { S } from './ecrans/commun';
import { route } from './ecrans/navigation';
import { chargerTournoi } from './ecrans/tournois';
import { demarrerBeta } from './ecrans/beta';
import { demarrerAvis } from './ecrans/avis';
import { demarrerStats } from './ecrans/stats';
import { demarrerCompte } from './ecrans/compte';

// Démarrage : tournoi en cours relu, puis premier écran.
demarrerBeta(); // code d'invitation, nouveautés, installation
demarrerAvis(); // avis en attente d'envoi, rapport si la page plante
demarrerStats(); // statistiques anonymes en attente d'envoi
demarrerCompte(); // compte joueur : sauvegarde en ligne automatique
S.tournoi = chargerTournoi();
window.addEventListener('hashchange', route);
route();
