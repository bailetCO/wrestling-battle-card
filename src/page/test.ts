// Bonus de test : à retirer avant la sortie du jeu.
// Chaque bonus est une ligne de la liste ci-dessous, pour pouvoir en ajouter ou en enlever facilement.
// Pas de médailles offertes : ce sont elles qui débloquent Mon Club, le niveau de compte,
// les quêtes et l'Histoire, qui doivent se débloquer en jouant.

import type { Collection } from './collection';
import type { EtatCombat, Joueur } from '../moteur/types';
import { DEV } from './dev';

type BonusPseudo = { pseudo: string; medailles: number; dollars: number };

const BONUS_PSEUDO: BonusPseudo[] = [
  { pseudo: 'Coco', medailles: 0, dollars: 1000 },
];

// Appelé quand le joueur enregistre son pseudo. Majuscules et minuscules ne comptent pas.
// Rend le texte à afficher si un bonus a été donné, sinon null.
export function bonusDeTest(c: Collection, pseudo: string): string | null {
  const b = BONUS_PSEUDO.find((x) => x.pseudo.toLowerCase() === pseudo.trim().toLowerCase());
  if (!b) return null;
  c.medailles += b.medailles;
  c.dollars += b.dollars;
  const t: string[] = [];
  if (b.medailles) t.push(`+${b.medailles} médailles`);
  if (b.dollars) t.push(`+${b.dollars} $`);
  return `Bonus de test : ${t.join(' et ')}`;
}

// Petit bandeau en haut de l'écran qui disparaît tout seul après quelques secondes.
export function afficherBandeauTest(texte: string) {
  const d = document.createElement('div');
  d.textContent = texte;
  d.setAttribute('role', 'status');
  d.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;'
    + 'background:#1b1b1b;color:#ffd54a;border:2px solid #ffd54a;border-radius:10px;'
    + 'padding:10px 16px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.4);max-width:90vw;text-align:center';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 4000);
}

// Outils de test visibles seulement pour le pseudo Coco (ou en mode développeur, ?dev).
export const outilsTestVisibles = (pseudo: string | null) =>
  DEV || (pseudo ?? '').trim().toLowerCase() === 'coco';

// « Passer le combat et gagner » : le combat se termine tout de suite par une victoire par tombé.
// L'écran de fin donne ensuite les récompenses habituelles d'une victoire.
export function gagnerTout(e: EtatCombat, moi: Joueur) {
  e.termine = true;
  e.vainqueur = moi;
  e.finPar = 'tombe';
  e.journal.push(`Combat passé (test) : victoire de ${e.joueurs[moi].def.nom} par tombé.`);
}
