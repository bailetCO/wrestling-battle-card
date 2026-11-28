import { proposerNotifications } from './notifications';
import { bandeauQuotidien, brancherQuotidien, montrerRetour } from './quotidien';
import { accueilFilleul } from './parrainage';
import { verifierMiseAJour } from '../mise-a-jour';
import { DIVISIONS, majPeriode, programmerPublication, texteCadre } from '../classement';
import { ICONE_DIVISION, pastilleMonBadge } from './classement';
// Écran d'accueil (pseudo) et menu principal.

import { LUTTEURS, trouverLutteur, niveauCarte, avecDeck, REGLES as R_, type DefLutteur } from '../../moteur';
import { carteHTML } from '../carte';
import { afficherBandeauTest, bonusDeTest } from '../test';
import { cartesPossedees, niveauCompte, niveauClub, placesClub, deckDe, defPossede, etoilesDe, fusionPrete, gradeDe, nbDoubles, nbEtoiles, nbExemplaires, sauver, verifierPseudo, styleDe } from '../collection';
import { PALIERS, saisonFinie, saisonOuverte } from '../saison';
import { DEV } from '../dev';
import { bandeauCompte, brancherBandeauCompte, brancherCompteExistant, fenetreCompte, indicateurCompte, lienCompteExistant } from './compte';
import { compteActuel } from '../compte';
import { tuileNouvelle, tuileVisible, type IdTuile } from '../menu';
import { connecter, oublierSession, sessionLigne } from './amis';
import { brancherPiedMenu, montrerNouveautes, piedMenu } from './beta';
import { bandeauAvis, brancherAvis } from './avis';
import { demanderAccord } from './stats';
import { cartes } from './collection';
import { S, app, echap, pastilleNiveau, pastilleSaisons } from './commun';
import { bandeauHistoire, blocQuetes, histoire, quete, recompenseClub, scenesAuto } from './progression';

// ---------- Accueil, menu principal ----------

export function compteur(): string {
  const n = S.collection.toutDebloque ? LUTTEURS.length : cartesPossedees(S.collection);
  return `<b>${n}/${LUTTEURS.length}</b> cartes${S.collection.toutDebloque ? ' (mode test)' : ''} · ${nbDoubles(S.collection)} double${nbDoubles(S.collection) > 1 ? 's' : ''} · ${S.collection.victoires} victoire${S.collection.victoires > 1 ? 's' : ''}`;
}

// Médailles (progression) et $ (à dépenser), en haut du menu et de Social.
export function porteMonnaie(): string {
  const E = R_.economie;
  const reste = E.medaillesParPalier - (S.collection.medailles % E.medaillesParPalier);
  return `
    <div class="porte-monnaie" aria-label="${S.collection.medailles} médailles, ${S.collection.dollars} dollars">
      <span class="pm-medailles">${ICONE_MEDAILLE}<b>${S.collection.medailles}</b><small>médaille${S.collection.medailles > 1 ? 's' : ''}</small></span>
      <span class="pm-dollars"><i aria-hidden="true">$</i><b>${S.collection.dollars}</b><small>+${E.dollarsParPalier} $ dans ${reste} médaille${reste > 1 ? 's' : ''}</small></span>
    </div>`;
}

export const ICONE_MEDAILLE = '<svg class="ico-medaille" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 1h4l2 7H9zM17 1h-4l-2 7h4z" fill="#c8102e"/><circle cx="12" cy="15" r="7.5" fill="#ffd76a" stroke="#8a5a00" stroke-width="1.5"/><path d="M12 10.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.6-2.8 1.6.6-3.1-2.3-2.1 3.1-.4z" fill="#b8860b"/></svg>';

// La carte telle que le joueur la possède : son deck, son grade, ses exemplaires.
export function defJoueur(def: DefLutteur): DefLutteur {
  return avecDeck(defPossede(S.collection, def.id), deckDe(S.collection, def.id));
}

// Rareté atteinte par la carte du joueur (sa rareté de départ, montée par fusion).
export const niveauDe = (id: string) => niveauCarte(trouverLutteur(id), gradeDe(S.collection, id));

export function etiquettesCarte(def: DefLutteur): string {
  const n = nbExemplaires(S.collection, def.id);
  const et = nbEtoiles(S.collection, def.id);
  return `${et ? `<span class="pastille grade" title="${et} étoile${et > 1 ? 's' : ''}">★${et}</span>` : ''}${n > 1 ? `<span class="pastille nombre" title="${n} exemplaires">×${n}</span>` : ''}`;
}

export function carteJoueur(def: DefLutteur, bouton = ''): string {
  return `<div class="carte-possedee">${carteHTML(defJoueur(def), bouton, { grade: gradeDe(S.collection, def.id), etoiles: etoilesDe(S.collection, def.id), style: styleDe(S.collection, def.id), cadre: cadreCarte(def.id) })}<div class="pastilles">${etiquettesCarte(def)}</div></div>`;
}

// Cadre de saison posé sur une carte (28/11/2026).
export function cadreCarte(id: string): { texte: string; division: string } | null {
  const cd = S.collection.classement.cadreCartes[id];
  return cd ? { texte: texteCadre(cd), division: cd.split(':')[1] } : null;
}

export const ICONES_MENU: Record<string, string> = {
  collection: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="10" width="20" height="28" rx="3" transform="rotate(-12 18 24)" fill="none" stroke="currentColor" stroke-width="3"/><rect x="20" y="10" width="20" height="28" rx="3" transform="rotate(10 30 24)" fill="currentColor" opacity=".9"/></svg>',
  combat: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40 30 18M14 12l6 6M40 40 18 18M34 12l-6 6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/></svg>',
  tournois: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 6h20v12a10 10 0 0 1-20 0z" fill="currentColor"/><path d="M14 10H7c0 7 3 11 8 11M34 10h7c0 7-3 11-8 11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 28v8M16 42h16l-2-6H18z" fill="currentColor"/></svg>',
  club: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l17 6v13c0 11-8 19-17 23C15 41 7 33 7 22V9z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 13l3 6.2 6.8.9-5 4.7 1.3 6.7L24 28.2l-6.1 3.3 1.3-6.7-5-4.7 6.8-.9z" fill="currentColor"/></svg>',
  social: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="7" fill="currentColor"/><circle cx="33" cy="19" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M4 40c1-9 7-13 13-13s12 4 13 13M28 39c1-7 4-10 9-10s8 3 9 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  recompenses: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="20" width="32" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><rect x="6" y="14" width="36" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 14v26M24 14c-4-8-12-6-10-1s10 1 10 1c4-8 12-6 10-1s-10 1-10 1" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  saison: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="12" cy="18" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="18" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="36" cy="18" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="18" cy="26" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="26" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 40h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  classement: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="26" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><rect x="18" y="14" width="12" height="28" rx="2" fill="currentColor"/><rect x="32" y="22" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 4l2 4 4 .5-3 3 .8 4.5-3.8-2-3.8 2 .8-4.5-3-3 4-.5z" fill="currentColor"/></svg>',
  fusion: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8v10c0 6 6 8 14 12M38 8v10c0 6-6 8-14 12v12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M17 36l7 8 7-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export function ecranAccueil(message = '') {
  S.partie = null;
  app.innerHTML = `
    <main class="accueil">
      <div class="rayons" aria-hidden="true"></div>
      <section class="accueil-centre">
        <h1 class="logo">Wrestling<br>Battle Card</h1>
        <span class="badge-beta">Bêta</span>
        <p>Bienvenue sur le tapis. Avant ton premier combat, choisis ton nom de coach : c'est sous ce nom que tu diriges tes lutteurs et que tes amis te verront.</p>
        ${accueilFilleul()}
        <form class="form-pseudo">
          <label for="pseudo">Ton pseudo de coach</label>
          <input id="pseudo" name="pseudo" maxlength="16" autocomplete="nickname" placeholder="Coach…" value="${echap(S.collection.coach ?? '')}">
          <p class="erreur" role="alert">${echap(message)}</p>
          <button class="principal" type="submit">${S.collection.coach ? 'Enregistrer' : 'Entrer dans le jeu'}</button>
        </form>
        ${S.collection.coach ? '<a class="lien" href="#">Annuler</a>' : compteActuel() ? '' : lienCompteExistant()}
      </section>
    </main>`;
  brancherCompteExistant(app);
  app.querySelector('form')!.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const v = app.querySelector<HTMLInputElement>('#pseudo')!.value.trim();
    const erreur = verifierPseudo(v);
    if (erreur) return ecranAccueil(erreur);
    S.collection.coach = v;
    const bonus = bonusDeTest(S.collection, v);
    sauver(S.collection);
    programmerPublication(S.collection); // nouveau pseudo dans le classement
    if (location.hash) history.replaceState(null, '', location.pathname);
    ecranMenu();
    if (bonus) afficherBandeauTest(bonus);
  });
  app.querySelector<HTMLInputElement>('#pseudo')!.focus();
  window.scrollTo(0, 0);
}




export function ecranMenu() {
  S.partie = null;
  void verifierMiseAJour(() => (S.mode === 'ligne' ? 'enLigne' : 'libre'));
  majPeriode(S.collection);
  recompenseClub();
  histoire({ type: 'etat' });
  quete({ type: 'etat' });
  const session = sessionLigne();
  const fusions = cartes().filter((l) => fusionPrete(S.collection, l.id)).length;
  // Tuiles ouvertes pas à pas selon le mode histoire ; « Nouveau » jusqu'à la première visite.
  const tuile = (id: IdTuile, titre: string, sous: string, href: string, alerte = '', cadenas = '') => !tuileVisible(S.collection, id) ? '' : (alerte = alerte || (tuileNouvelle(S.collection, id) ? 'Nouveau' : ''), `
    <a class="tuile t-${id} ${cadenas ? 'verrouillee' : ''}" href="${href}">
      <span class="tuile-ico">${ICONES_MENU[id]}</span>
      <span class="tuile-titre">${titre}</span>
      <span class="tuile-sous">${sous}</span>
      ${alerte ? `<span class="tuile-alerte">${alerte}</span>` : ''}
      ${cadenas ? `<span class="tuile-cadenas">🔒 ${cadenas}</span>` : ''}
    </a>`);
  const nivClub = niveauClub(S.collection);
  const tournoiActif = !!S.tournoi && !S.tournoi.recompense;
  app.innerHTML = `
    <main class="menu">
      <header class="menu-tete">
        <span class="avatar" aria-hidden="true">${echap((S.collection.coach ?? '?').slice(0, 1).toUpperCase())}</span>
        <span class="menu-coach"><small>Coach · niveau de compte</small><b>${echap(S.collection.coach ?? '')} ${pastilleNiveau(niveauCompte(S.collection))}${pastilleSaisons(S.collection.saison.terminees)}${pastilleMonBadge()}</b>${indicateurCompte()}</span>
        <a class="lien petit" href="#pseudo">Modifier</a>
      </header>
      ${porteMonnaie()}
      <p class="compteur menu-stats">${compteur()}</p>
      ${DEV ? '<p class="note mode-dev">🛠 Mode développeur (retirer : ajouter ?nodev à l\'adresse)</p>' : ''}
      ${session ? `<div class="reprise"><p>Combat entre amis en cours (salle ${echap(session.code.toUpperCase())}).</p><button class="principal" data-reprendre>Reprendre</button><button class="lien" data-oublier>Quitter ce combat</button></div>` : ''}
      ${bandeauQuotidien()}
      ${bandeauHistoire()}
      ${blocQuetes()}
      ${bandeauCompte()}
      ${bandeauAvis()}
      <nav class="tuiles" aria-label="Menu principal">
        ${tuile('combat', 'Combat', 'Carrière et entraînement contre l\'ordinateur, ou en ligne contre un ami', '#combat')}
        ${tuile('tournois', 'Tournois', 'Individuel et par équipe', '#tournois', tournoiActif ? 'En cours' : '')}
        ${tuile('saison', 'Saison sportive', saisonOuverte(S.collection) ? `Saison ${S.collection.saison.numero} · ${saisonFinie(S.collection) ? 'terminée' : PALIERS[S.collection.saison.palier].nom}` : 'Interclub, championnats, Jeux Olympiques', '#saison', '', saisonOuverte(S.collection) ? '' : `Club niveau ${R_.club.niveauSaison}`)}
        ${tuile('collection', 'Collection', `${S.collection.toutDebloque ? LUTTEURS.length : cartesPossedees(S.collection)}/${LUTTEURS.length} cartes · régler les actions`, '#collection')}
        ${tuile('fusion', 'Fusion', 'Fusionne tes doubles pour monter en rareté', '#fusion', fusions ? `${fusions} prête${fusions > 1 ? 's' : ''}` : '')}
        ${tuile('club', 'Mon Club', nivClub ? `Niveau ${nivClub} · ${S.collection.club.length}/${placesClub(S.collection)} lutteurs` : 'Recrute tes lutteurs dans ton club', '#club', '', nivClub ? '' : `${R_.club.medaillesOuverture} médailles`)}
        ${tuile('social', 'Social', 'Boutique, transferts de lutteurs et amis', '#social')}
        ${tuile('classement', 'Classement', `${ICONE_DIVISION[DIVISIONS[S.collection.classement.division].id]} ${DIVISIONS[S.collection.classement.division].nom} · ${S.collection.classement.points} point${S.collection.classement.points > 1 ? 's' : ''}`, '#classement', '', compteActuel() ? '' : 'Compte')}
        ${tuile('recompenses', 'Récompenses', S.collection.aOuvrir.length ? `${S.collection.aOuvrir.length} à ouvrir` : 'Rien à ouvrir pour l\'instant', '#recompenses', S.collection.aOuvrir.length ? `🎁 ${S.collection.aOuvrir.length}` : '')}
      </nav>
      ${piedMenu()}
    </main>`;
  app.querySelector('[data-reprendre]')?.addEventListener('click', () => {
    const x = sessionLigne();
    if (x) connecter(x.code, x.role);
  });
  app.querySelector('[data-oublier]')?.addEventListener('click', () => {
    oublierSession();
    ecranMenu();
  });
  brancherPiedMenu();
  brancherAvis();
  brancherBandeauCompte(app);
  brancherQuotidien(app);
  app.querySelector('[data-mon-compte]')?.addEventListener('click', () => fenetreCompte());
  window.scrollTo(0, 0);
  // Après une mise à jour, les nouveautés passent avant la scène de dialogue (montrée au retour au menu).
  if (montrerNouveautes()) return;
  if (montrerRetour()) return;
  if (proposerNotifications()) return; // après la 1re récompense du jour
  // Une fois : l'accord pour les statistiques anonymes.
  if (demanderAccord()) return;
  // On présente au joueur son objectif du moment (scène de dialogue pas encore vue).
  scenesAuto();
}
