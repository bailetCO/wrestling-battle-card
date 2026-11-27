// Écrans des statistiques anonymes (bêta) : accord du joueur, page de confidentialité,
// et envoi des fiches à la fin des combats.

import { deposerLot, supprimerMesDonnees } from '../firebase';
import { accord, accordDemande, choisirAccord, enAttente, enregistrer, envoyerLot, ficheCombat, ficheParcours, type InfosCombat } from '../stats';
import { ouvrirFenetre } from './combat';

export const CONTACT = 'cocoachwrestling@gmail.com';

// ---------- Envoi ----------

let minuterie: ReturnType<typeof setTimeout> | null = null;
function planifierEnvoi(delai = 3000) {
  if (minuterie) return;
  minuterie = setTimeout(async () => {
    minuterie = null;
    await envoyerLot(deposerLot).catch(() => 0);
    if (enAttente()) planifierEnvoi(40_000); // il en reste : lot suivant dans 40 s
  }, delai);
}

export function demarrerStats() {
  if (enAttente()) planifierEnvoi(5000);
}

// Fin d'un combat contre l'ordinateur ou entre amis. Pas de fiche pour le tutoriel ni les parties d'essai.
// `cle` : l'objet du combat, pour ne compter chaque combat qu'une fois (l'écran de fin peut se redessiner).
const dejaNotes = new WeakSet<object>();
export function noterStatsCombat(cle: object, x: InfosCombat) {
  if (dejaNotes.has(cle)) return;
  dejaNotes.add(cle);
  if (enregistrer(ficheCombat(x))) planifierEnvoi();
}

// Étapes du parcours d'un joueur. Les « premiers » ne sont envoyés qu'une fois.
const CLE_VUS = 'wbc-parcours-vus';
export function noterParcours(evenement: string, valeur = '', une = false) {
  try {
    if (une) {
      const vus: string[] = JSON.parse(localStorage.getItem(CLE_VUS) ?? '[]');
      if (vus.includes(evenement)) return;
      localStorage.setItem(CLE_VUS, JSON.stringify([...vus, evenement]));
    }
  } catch { /* navigation privée */ }
  if (enregistrer(ficheParcours(evenement, valeur))) planifierEnvoi();
}

// ---------- Accord du joueur ----------

// Proposé une fois, au menu (si aucune autre fenêtre n'est ouverte). Rend vrai si la fenêtre s'est ouverte.
export function demanderAccord(): boolean {
  if (accordDemande() || document.querySelector('.voile, .scene-dialogue, .revelation')) return false;
  fenetreAccord();
  return true;
}

function fenetreAccord() {
  const a = accord();
  const f = ouvrirFenetre(`
    <h2>Aider à équilibrer le jeu ?</h2>
    <p>Pendant la bêta, le jeu peut envoyer des <b>statistiques anonymes de tes combats</b> : les lutteurs, le résultat, les actions jouées. Elles servent à rendre chaque carte juste. Jamais ton pseudo, ton nom ou ton adresse.</p>
    <label class="av-case"><input type="checkbox" data-age ${a.age15 ? 'checked' : ''}> J'ai 15 ans ou plus</label>
    <p class="note">En dessous de 15 ans, rien n'est envoyé.</p>
    <button class="principal" data-oui ${a.age15 ? '' : 'disabled'}>Oui, j'aide</button>
    <button class="secondaire" data-non>Non merci</button>
    <button class="lien" data-confidentialite>En savoir plus</button>
    <p class="note">Tu peux changer d'avis à tout moment : « Confidentialité », sous « Plus » en bas du menu.</p>`);
  const age = f.querySelector<HTMLInputElement>('[data-age]')!;
  const oui = f.querySelector<HTMLButtonElement>('[data-oui]')!;
  age.addEventListener('change', () => { oui.disabled = !age.checked; });
  oui.addEventListener('click', () => { choisirAccord(true, age.checked); f.remove(); });
  f.querySelector('[data-non]')!.addEventListener('click', () => { choisirAccord(false, age.checked); f.remove(); });
  f.querySelector('[data-confidentialite]')!.addEventListener('click', () => fenetreConfidentialite(true));
}

// ---------- Page de confidentialité ----------

export function fenetreConfidentialite(depuisAccord = false) {
  const a = accord();
  const actif = a.choix === 'oui' && a.age15;
  const f = ouvrirFenetre(`
    <h2>Confidentialité</h2>
    <div class="conf-texte">
      <p><b>Ce que le jeu garde sur ton téléphone</b> : ta collection, ta progression et tes réglages. Rien ne quitte le téléphone sans ton action.</p>
      <p><b>Ce qui est envoyé, et quand</b></p>
      <ul class="nv-liste">
        <li><b>Statistiques anonymes</b> (si tu as dit oui et que tu as 15 ans ou plus) : pour chaque combat, le mode, les lutteurs et leur rareté, le résultat, le score, le nombre de tours, la durée et les actions jouées ; et quelques étapes de ton parcours (tutoriel terminé, étape d'histoire validée, premier booster). Elles servent à équilibrer le jeu.</li>
        <li><b>Tes avis et signalements de bug</b>, seulement quand tu les envoies : tes réponses, ton pseudo de coach et ton adresse e-mail (15 ans et plus) pour qu'on puisse te répondre. Un signalement joint aussi le type de téléphone et ton dernier combat contre l'ordinateur.</li>
        <li><b>Les combats entre amis</b> : les choix de chaque tour passent par le serveur, le temps du combat.</li>
      </ul>
      <p>Tu n'es connu que par un identifiant tiré au hasard : ni nom, ni position, ni publicité, ni pisteur.</p>
      <p><b>Où</b> : chez Firebase (Google), sur des serveurs en Europe (Belgique). <b>Qui les lit</b> : seulement l'équipe du jeu.</p>
      <p><b>Combien de temps</b> : jusqu'à 12 mois après la fin de la bêta, puis effacées.</p>
      <p><b>Responsable</b> : Corentin Bailet (Wrestling Battle Card). Pour toute question, ou pour faire effacer tes données : <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
    </div>
    <h3>Statistiques anonymes</h3>
    <p class="conf-etat">${actif ? 'Activées : merci de ton aide !' : a.choix === 'oui' && !a.age15 ? 'Désactivées (moins de 15 ans).' : 'Désactivées.'}</p>
    <button class="secondaire" data-basculer>${actif ? 'Arrêter l\'envoi' : 'Activer (15 ans ou plus)'}</button>
    <h3>Mes données</h3>
    <p class="note">Efface tout ce que ce téléphone a envoyé : avis, signalements et statistiques.</p>
    <button class="secondaire" data-supprimer>Supprimer mes données</button>
    <div class="conf-resultat" role="status"></div>
    <button class="lien" data-fermer>${depuisAccord ? 'Retour' : 'Fermer'}</button>`, true);
  f.querySelector('[data-basculer]')!.addEventListener('click', () => {
    if (actif) choisirAccord(false, a.age15);
    else return fenetreAccord();
    fenetreConfidentialite();
  });
  if (depuisAccord) f.querySelector('[data-fermer]')!.addEventListener('click', (ev) => { ev.stopPropagation(); fenetreAccord(); });
  f.querySelector('[data-supprimer]')!.addEventListener('click', async (ev) => {
    const zone = f.querySelector('.conf-resultat')!;
    const b = ev.currentTarget as HTMLButtonElement;
    // Deux appuis : le premier demande confirmation (la suppression est définitive).
    if (!b.dataset.confirme) {
      b.dataset.confirme = '1';
      b.textContent = 'Confirmer : tout effacer définitivement';
      return;
    }
    b.disabled = true;
    zone.innerHTML = '<p class="note">Suppression…</p>';
    try {
      const n = await supprimerMesDonnees();
      zone.innerHTML = `<p>C'est fait : ${n} envoi${n > 1 ? 's' : ''} effacé${n > 1 ? 's' : ''}.</p>`;
    } catch {
      zone.innerHTML = `<p class="erreur">Impossible pour l'instant (pas de réseau ?). Réessaie plus tard, ou écris à ${CONTACT}.</p>`;
    }
  });
}

