import { ecranClassement } from './classement';
// Navigation entre les écrans (adresse après le #).

import { sauver } from '../collection';
import { noterVisite } from '../menu';
import { ecranAccueil, ecranMenu } from './accueil';
import { ecranAmis } from './amis';
import { ecranArene, ecranCombatMenu } from './carriere';
import { ecranMonClub, ecranSocial, quitterEchange } from './club';
import { ecranCollection, ecranFusion } from './collection';
import { fermerFenetre } from './combat';
import { S } from './commun';
import { ecranInvitation, invitationOk } from './beta';
import { ecranHistoire, ecranQuetes, ecranRecompenses, ecranSaison } from './progression';
import { ecranTournois } from './tournois';
import { ecranRegles, ecranTutoriel } from './tutoriel';

// ---------- Navigation ----------

export function route() {
  fermerFenetre();
  const h = location.hash;
  if (!invitationOk()) return ecranInvitation(); // bêta fermée
  if (!S.collection.coach || h === '#pseudo') return ecranAccueil();
  if (noterVisite(S.collection, h)) sauver(S.collection); // la tuile ne porte plus « Nouveau »
  if (h === '#amis') return ecranAmis();
  if (S.mode === 'ligne') return; // un combat en ligne est en cours : on n'y touche pas
  if (h === '#collection' || h === '#galerie') return ecranCollection();
  if (h === '#fusion') return ecranFusion();
  if (h === '#social') return ecranSocial();
  if (h === '#club') return ecranMonClub();
  if (h === '#histoire') return ecranHistoire();
  if (h === '#saison') return ecranSaison();
  if (h === '#quetes') return ecranQuetes();
  if (h === '#recompenses') return ecranRecompenses();
  if (h === '#tournois') return ecranTournois();
  if (h === '#classement') return ecranClassement();
  if (h === '#rapide') return ecranArene(true);
  quitterEchange();
  if (h === '#combat') return ecranCombatMenu();
  if (h === '#regles') return ecranRegles();
  if (h === '#tutoriel') return ecranTutoriel();
  if (h === '#arene') { S.defiChoisi = null; return ecranArene(); }
  if (!S.partie) ecranMenu();
}
