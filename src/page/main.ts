// La page du jeu : point d'entrée. Les écrans sont dans le dossier « ecrans » ; ici, la navigation.

import './style.css';
import { S } from './ecrans/commun';
import { route } from './ecrans/navigation';
import { chargerTournoi } from './ecrans/tournois';
import { demarrerBeta } from './ecrans/beta';
import { demarrerParrainage } from './ecrans/parrainage';
import { demarrerAvis } from './ecrans/avis';
import { demarrerStats } from './ecrans/stats';
import { demarrerCompte } from './ecrans/compte';
import { demarrerClassement } from './ecrans/classement';
import { demarrerMisesAJour } from './mise-a-jour';

// Démarrage : tournoi en cours relu, puis premier écran.
demarrerBeta(); // code d'invitation, nouveautés, installation
demarrerParrainage(); // lien de parrainage (fait entrer dans la bêta), récompenses du parrain
demarrerAvis(); // avis en attente d'envoi, rapport si la page plante
demarrerStats(); // statistiques anonymes en attente d'envoi
demarrerCompte(); // compte joueur : sauvegarde en ligne automatique
void demarrerClassement(); // classement : nouveau mois, récompenses de fin de mois
S.tournoi = chargerTournoi();
window.addEventListener('hashchange', route);
route();
// Nouvelle version en ligne : rechargement (un combat contre l'ordinateur est annulé, pas un combat en ligne).
demarrerMisesAJour(() => (S.mode === 'ligne' ? 'enLigne' : (S.partie && !S.partie.etat.termine) || S.tuto ? 'combat' : 'libre'));
