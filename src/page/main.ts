// La page du jeu : point d'entrée. Les écrans sont dans le dossier « ecrans » ; ici, la navigation.

import './style.css';
import { S } from './ecrans/commun';
import { route } from './ecrans/navigation';
import { chargerTournoi } from './ecrans/tournois';

// Démarrage : tournoi en cours relu, puis premier écran.
S.tournoi = chargerTournoi();
window.addEventListener('hashchange', route);
route();
