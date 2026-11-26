// La page du jeu : point d'entrée. Les écrans sont dans le dossier « ecrans » ; ici, la navigation.

import './style.css';
import { trouverLutteur } from '../moteur';
import { brancherPaquets, brancherRepli } from './illustrations';
import { drapeauSVG, portraitSVG } from './portrait';
import { S } from './ecrans/commun';
import { route } from './ecrans/navigation';
import { chargerTournoi } from './ecrans/tournois';

// Illustration manquante : retour au dessin d'origine du jeu.
brancherPaquets(); // page de test seulement
brancherRepli({ portrait: (id) => portraitSVG(trouverLutteur(id), `r${S.idPortrait++}`), embleme: (n) => drapeauSVG(n) });

// Démarrage : tournoi en cours relu, puis premier écran.
S.tournoi = chargerTournoi();
window.addEventListener('hashchange', route);
route();
