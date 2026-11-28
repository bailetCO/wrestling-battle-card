// Parrainage, à l'écran (27/11/2026) : lien perso à partager (Social, Classement → Amis, menu « Plus »),
// accueil d'un nouveau joueur invité, et récompenses du parrain. Les règles sont dans ../parrainage.ts.

import { REGLES } from '../../moteur';
import { sauver } from '../collection';
import { accueillirParrain, ajouterAmi, declarerParrain, lienParrainage, lireLienParrain, nouveauxAmisInvites, recompenseParrain, signalerAmitie, texteInvitation } from '../parrainage';
import { accorderInvitation } from './beta';
import { ouvrirFenetre } from './combat';
import { S, echap } from './commun';
import { annoncer, histoire, mettreEnBoite } from './progression';

const P = REGLES.parrainage;

// Au lancement : lien de parrainage dans l'adresse, puis nouvelles du parrainage.
export function demarrerParrainage() {
  try {
    const adresse = new URL(location.href);
    const parrain = lireLienParrain(adresse);
    if (adresse.searchParams.has('parrain') || adresse.searchParams.has('de')) {
      adresse.searchParams.delete('parrain');
      adresse.searchParams.delete('de');
      history.replaceState(null, '', `${adresse.pathname}${adresse.search}${adresse.hash}`);
    }
    if (parrain) {
      accorderInvitation(); // le lien d'un joueur fait entrer dans la bêta
      const r = accueillirParrain(S.collection, parrain);
      if (r?.type === 'filleul') mettreEnBoite(`Cadeau de bienvenue de Coach ${parrain.pseudo}`, 'parrainage', [r.cadeau]);
      if (r?.type === 'ami' && S.collection.coach) void signalerAmitie(S.collection, parrain.id).catch(() => false);
      sauver(S.collection);
    }
  } catch { /* adresse illisible */ }
  void verifierParrainage();
}

// Filleul avec un compte : prévient son parrain. Parrain : amis arrivés par son lien, et récompenses.
export async function verifierParrainage() {
  const c = S.collection;
  try {
    if (await declarerParrain(c)) sauver(c);
    if (!c.parrainage.partage || !c.coach) return; // n'a jamais partagé son lien : personne à chercher
    const nouveaux = await nouveauxAmisInvites(c);
    for (const n of nouveaux) {
      ajouterAmi(c, n.id, n.pseudo);
      const boosters = n.filleul ? recompenseParrain(c) : null;
      if (boosters) {
        mettreEnBoite(`Coach ${n.pseudo} a rejoint le jeu grâce à toi`, 'parrainage', boosters);
        annoncer(`Coach ${n.pseudo} a rejoint le jeu grâce à toi !`, '#recompenses');
      } else annoncer(`Coach ${n.pseudo} est maintenant ton ami`, '#social', 'Retrouve-le dans Social et dans le classement Amis.');
    }
    if (nouveaux.length) sauver(c);
  } catch { /* hors ligne : on réessaiera */ }
}

// Message d'accueil sur l'écran du pseudo, pour un joueur invité.
export function accueilFilleul(): string {
  const p = S.collection.parrain;
  if (!p || S.collection.coach) return '';
  return `<p class="accueil-parrain">🎁 <b>Coach ${echap(p.pseudo)} t'invite !</b> Un booster rare de bienvenue t'attend. Crée ensuite ton compte pour que Coach ${echap(p.pseudo)} reçoive aussi son cadeau.</p>`;
}

export function blocInvitation(titre = true): string {
  const n = S.collection.parrainage.recompenses;
  const prochain = n < P.bonusLegendaireAu ? `Au ${P.bonusLegendaireAu}e ami : une carte légendaire en bonus !` : '';
  return `
    <section class="bloc invitation">
      ${titre ? '<h2>Inviter un ami</h2>' : ''}
      <p>Envoie ton lien perso : ton ami reçoit <b>1 booster rare</b> de bienvenue. Toi, tu reçois <b>1 booster rare</b> dès qu'il crée son compte. ${prochain}</p>
      <button class="principal" data-inviter>📨 Inviter un ami</button>
      <p class="note">Amis parrainés : <b>${n}</b>/${P.recompensesMax} récompensés. Vous devenez amis automatiquement.</p>
      <p class="etat-invitation note" role="status"></p>
    </section>`;
}

export async function partagerLien(): Promise<'partage' | 'copie' | 'annule'> {
  const c = S.collection;
  const lien = lienParrainage(c);
  c.parrainage.partage = true;
  sauver(c);
  histoire({ type: 'etat' });
  if (navigator.share) {
    try { await navigator.share({ title: 'Wrestling Battle Card', text: texteInvitation(c), url: lien }); return 'partage'; } catch { /* fermé, ou refusé : on copie */ }
  }
  try { await navigator.clipboard.writeText(`${texteInvitation(c)} ${lien}`); return 'copie'; } catch { return 'annule'; }
}

export function brancherInvitation(racine: ParentNode) {
  racine.querySelectorAll<HTMLButtonElement>('[data-inviter]').forEach((b) => b.addEventListener('click', async () => {
    const r = await partagerLien();
    const etat = b.closest('.invitation')?.querySelector('.etat-invitation');
    if (etat) etat.textContent = r === 'copie' ? 'Lien copié : colle-le dans un message à ton ami.' : r === 'partage' ? 'Merci ! Ta récompense arrivera quand ton ami aura créé son compte.' : `Ton lien : ${lienParrainage(S.collection)}`;
  }));
}

export function fenetreInvitation() {
  const f = ouvrirFenetre(`<h2>Inviter un ami</h2>${blocInvitation(false)}<button class="lien" data-fermer>Fermer</button>`, true);
  brancherInvitation(f);
}
