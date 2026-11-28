import { blocCodeCreateur, brancherCodeCreateur } from './createurs';
import { blocInvitation, brancherInvitation, verifierParrainage } from './parrainage';
// Mon Club et Social (boutique, transferts, amis).

import { CHAMPIONS, NATIONS, trouverLutteur, REGLES as R_, type DefLutteur, type NiveauCarte } from '../../moteur';
import { salleEnLigne } from '../firebase';
import { ADRESSE_PUBLIQUE, RELAIS, codeValide, nouveauCode, salleLocale, salleRelais } from '../enligne';
import { NOM_RARETE, activerReflets } from '../carte';
import { acheterBooster, acheterChampion, libererPlace, medaillesNiveauSuivant, niveauClub, placesClub, recruter, nbExemplaires, possede, sauver } from '../collection';
import { Echange, accepterOffre, jourDe, listeAmis, offreFaite, offresDuJour, type VueEchange } from '../club';


import { carteJoueur, niveauDe, porteMonnaie } from './accueil';
import { acces, relaisPerso } from './amis';
import { cartes } from './collection';
import { fermerFenetre, ouvrirFenetre } from './combat';
import { S, app, echap, enTete, portrait } from './commun';
import { revelerPaquet, visuelPaquet } from './fin';
import { histoire, lienBoite, recompenseClub } from './progression';

// ---------- Mon Club ----------

export function ecranMonClub(message = '') {
  S.partie = null;
  recompenseClub();
  document.querySelector('.bulle-histoire')?.remove();
  const K = R_.club;
  const niv = niveauClub(S.collection);
  if (!niv) {
    const pct2 = Math.min(100, (S.collection.medailles / K.medaillesOuverture) * 100);
    app.innerHTML = `
      <main class="sous-menu">
        ${enTete('Mon Club', 'Recrute tes lutteurs et forme ton équipe.')}
        ${porteMonnaie()}
        <section class="bloc">
          <h2>🔒 Club fermé</h2>
          <p>Mon Club s'ouvre à <b>${K.medaillesOuverture} médailles</b>. Tu en as ${S.collection.medailles}.</p>
          <div class="jauge-club" role="meter" aria-valuemin="0" aria-valuemax="${K.medaillesOuverture}" aria-valuenow="${S.collection.medailles}"><i style="width:${pct2}%"></i></div>
          <p>Gagne des combats : +1 médaille contre l'ordinateur, +2 en ligne.</p>
          <a class="principal lien-bouton" href="#combat">Aller combattre</a>
        </section>
      </main>`;
    window.scrollTo(0, 0);
    return;
  }
  const places = placesClub(S.collection);
  const suivant = medaillesNiveauSuivant(S.collection);
  const debutNiveau = K.medaillesOuverture + (niv - 1) * K.medaillesParNiveau;
  const progression = suivant === null ? 100 : ((S.collection.medailles - debutNiveau) / (suivant - debutNiveau)) * 100;
  const cases = Array.from({ length: K.niveauMax * K.placesParNiveau }, (_, i) => {
    const id = S.collection.club[i];
    if (id) {
      const l = trouverLutteur(id);
      return `<div class="club-place">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(id)]}`, '', niveauDe(id))}
        <button class="lien petit" data-liberer="${id}">Libérer la place</button></div>`;
    }
    if (i < places) return '<button class="place-vide" data-recruter>+ Recruter</button>';
    const nivPlace = Math.floor(i / K.placesParNiveau) + 1;
    return `<div class="place-vide place-verrou">🔒 Niveau ${nivPlace}</div>`;
  }).join('');
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Mon Club', `Club de ${echap(S.collection.coach ?? '')}`)}
      ${porteMonnaie()}
      ${message}
      ${lienBoite()}
      <section class="bloc">
        <div class="club-niveau">
          <span class="club-blason" aria-hidden="true">${niv}</span>
          <b>Niveau ${niv}/${K.niveauMax} · ${S.collection.club.length}/${places} lutteur${places > 1 ? 's' : ''}</b>
          <div>
            <div class="jauge-club" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progression)}"><i style="width:${progression}%"></i></div>
            <small>${suivant === null ? 'Niveau maximum : la saison sportive est ouverte.' : `Niveau ${niv + 1} à ${suivant} médailles (encore ${suivant - S.collection.medailles})${niv + 1 >= K.niveauBooster ? ' · 1 booster rare' : ''}${niv + 1 === K.niveauSaison ? ' · saison sportive' : ''}.`}</small>
          </div>
        </div>
      </section>
      <section class="bloc">
        <h2>Mes lutteurs</h2>
        <p>Une place par niveau. Le lutteur reste utilisable partout : c'est seulement sa place dans l'équipe. Il faut un club de niveau ${K.niveauTournoiEquipe} (5 lutteurs) pour le tournoi par équipe : avec plus de 5 lutteurs, tu choisis les 5 qui combattent. Dès le niveau ${K.niveauBooster}, chaque niveau donne un booster rare ; le niveau ${K.niveauSaison} ouvre la saison sportive.</p>
        <div class="club-places">${cases}</div>
      </section>
    </main>`;
  activerReflets(app);
  app.querySelectorAll<HTMLButtonElement>('[data-recruter]').forEach((b) => b.addEventListener('click', fenetreRecruter));
  app.querySelectorAll<HTMLButtonElement>('[data-liberer]').forEach((b) =>
    b.addEventListener('click', () => {
      libererPlace(S.collection, b.dataset.liberer!);
      sauver(S.collection);
      ecranMonClub();
    }),
  );
  window.scrollTo(0, 0);
}

export function fenetreRecruter() {
  const libres = cartes().filter((l) => possede(S.collection, l.id) && !S.collection.club.includes(l.id));
  const f = ouvrirFenetre(`
    <h2>Recruter un lutteur</h2>
    ${libres.length
      ? `<div class="liste-recrues">${libres.map((l) => `<button data-recrue="${l.id}" aria-label="Recruter ${echap(l.nom)}">${miniCarteLutteur(l, `${echap(l.origine)} · ${NOM_RARETE[niveauDe(l.id)]}`, '', niveauDe(l.id))}</button>`).join('')}</div>`
      : '<p>Tous tes lutteurs sont déjà dans ton club. Ouvre des boosters pour en avoir d\'autres.</p>'}
    <button class="lien" data-fermer>Annuler</button>`, true);
  f.querySelectorAll<HTMLButtonElement>('[data-recrue]').forEach((b) =>
    b.addEventListener('click', () => {
      const erreur = recruter(S.collection, b.dataset.recrue!);
      fermerFenetre();
      if (!erreur) { sauver(S.collection); histoire({ type: 'recrutement' }); }
      ecranMonClub(erreur ? `<p class="alerte">${echap(erreur)}</p>` : '');
    }),
  );
}


// ---------- Social ----------

// Petite carte simple (portrait, nom, rareté) avec une ligne en dessous.
export function miniCarteLutteur(l: DefLutteur, bas: string, attrs = '', niveau: NiveauCarte = l.rarete): string {
  return `
    <span class="mini-carte" data-rarete="${niveau}" ${attrs}>
      <span class="mc-portrait">${portrait(l)}</span>
      <span class="mc-nom">${echap(l.nom)}</span>
      <span class="mc-bas">${bas}</span>
    </span>`;
}

export function quitterEchange() {
  S.echange?.fermer();
  S.echange = null;
}

export function ecranSocial(message = '') {
  S.partie = null;
  quitterEchange();
  const jour = jourDe();
  const offres = offresDuJour(jour).map((o, i) => {
    const donne = trouverLutteur(o.donne);
    const demande = trouverLutteur(o.demande);
    const fait = offreFaite(S.collection, jour, i);
    const doubles = nbExemplaires(S.collection, o.demande) - 1;
    const bouton = fait
      ? '<button class="secondaire petit-bouton" disabled>Fait</button>'
      : doubles > 0
        ? `<button class="principal petit-bouton" data-offre="${i}">Transférer</button>`
        : '<button class="secondaire petit-bouton" disabled>Pas de double</button>';
    return `
      <li class="offre ${fait ? 'faite' : ''}">
        <div class="offre-cartes">
          <div><small>Tu reçois</small>${miniCarteLutteur(donne, `${echap(donne.origine)} · ${NOM_RARETE[donne.rarete]}${possede(S.collection, donne.id) ? '' : ' · nouvelle'}`)}</div>
          <span class="offre-fleche" aria-hidden="true">⇄</span>
          <div><small>Contre ton double</small>${miniCarteLutteur(demande, doubles > 0 ? `Tu en as ${doubles} en trop` : 'Aucun double')}</div>
        </div>
        ${bouton}
      </li>`;
  }).join('');
  const amis = listeAmis(S.collection);
  const listeA = amis.length
    ? `<ul class="amis-liste">${amis.map((a) => `
        <li>
          <span class="avatar petit" aria-hidden="true">${echap(a.pseudo.slice(0, 1).toUpperCase())}</span>
          <span class="ami-info"><b>${echap(a.pseudo)}</b><small>${a.victoires} victoire${a.victoires > 1 ? 's' : ''} · ${a.defaites} défaite${a.defaites > 1 ? 's' : ''} · ${a.echanges} transfert${a.echanges > 1 ? 's' : ''}</small></span>
          <small class="ami-date">${new Date(a.vu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>
        </li>`).join('')}</ul>`
    : '<p class="note">Affronte un ami en ligne ou fais un transfert avec lui : il apparaîtra ici.</p>';
  const enLigne = acces() !== 'ailleurs';
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete('Social', 'Boutique de boosters, transferts de lutteurs et tes amis.')}
      ${porteMonnaie()}
      ${message}
      ${S.collection.coach ? blocInvitation() : ''}
      ${S.collection.coach ? blocCodeCreateur() : ''}
      <section class="bloc boutique">
        <h2>Boutique</h2>
        <p>Achète des boosters avec tes $. Tu gagnes 10 $ toutes les 5 médailles.</p>
        <div class="boutique-offres">
          ${(['classique', 'rare', 'epique'] as const).map((t) => {
            const prix = R_.economie.prixBooster[t];
            const ok = S.collection.dollars >= prix;
            return `<button class="boutique-offre" data-acheter="${t}" ${ok ? '' : 'disabled'} aria-label="Acheter un booster ${t} pour ${prix} dollars">
              ${visuelPaquet({ type: t, cartes: Array(R_.collection.boosters[t].cartes).fill(''), nouvelles: [] })}
              <span class="prix">${prix} $</span>
            </button>`;
          }).join('')}
        </div>
      </section>
      <section class="bloc boutique-champions">
        <h2>Champions du Monde <small>${R_.saison.prixChampion} $</small></h2>
        <p>Ces cartes ne sortent jamais des boosters : gagne-les en fin de saison sportive, ou achète-les ici (${R_.saison.prixChampion} $ l'exemplaire). Les doubles servent à leur donner des étoiles et des styles de carte.</p>
        <ul class="liste-champions">${CHAMPIONS.map((l) => {
          const n = nbExemplaires(S.collection, l.id);
          const ok = S.collection.dollars >= R_.saison.prixChampion;
          return `<li><span class="vignette">${portrait(l, 'champion')}</span>
            <span class="fusion-info"><b>${echap(l.nom)}</b><small>${echap(NATIONS.find((x) => x.id === l.nation)?.nom ?? '')} · ${n ? `${n} exemplaire${n > 1 ? 's' : ''}` : '🔒 verrouillée'}</small></span>
            <button class="${ok ? 'principal' : 'secondaire'} petit-bouton" data-champion="${l.id}" ${ok ? '' : 'disabled'}>${R_.saison.prixChampion} $</button></li>`;
        }).join('')}</ul>
      </section>
      <section class="bloc">
        <h2>Transfert de lutteur</h2>
        <p>3 offres par jour, chacune une fois : on te transfère un lutteur contre un de tes doubles de même rareté. Nouvelles offres demain.</p>
        <ul class="offres">${offres}</ul>
      </section>
      <section class="bloc">
        <h2>Transfert entre amis</h2>
        ${enLigne ? `
          <p>Ouvrez une salle de transfert : chacun propose un de ses doubles, le transfert se fait quand vous acceptez tous les deux.</p>
          <button class="principal" data-ouvrir-echange>Ouvrir une salle de transfert</button>
          <form class="rejoindre" data-rejoindre-echange>
            <label for="code-echange">Ou rejoins ton ami avec son code</label>
            <input id="code-echange" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD">
            <button class="secondaire" type="submit">Rejoindre</button>
          </form>`
        : `<p>Les transferts se font sur la version du jeu ouverte à tous.</p><a class="principal lien-bouton" href="${ADRESSE_PUBLIQUE}" target="_blank" rel="noopener">Ouvrir la version ouverte à tous</a>`}
      </section>
      <section class="bloc">
        <h2>Mes amis <small>${amis.length}</small></h2>
        ${listeA}
      </section>
    </main>`;
  brancherInvitation(app);
  brancherCodeCreateur(app);
  // Amis arrivés par mon lien depuis la dernière visite : récompenses, puis compteur à jour.
  if (S.collection.parrainage.partage) {
    void verifierParrainage().then(() => {
      const bloc = app.querySelector('.invitation');
      if (location.hash !== '#social' || !bloc) return;
      bloc.outerHTML = blocInvitation();
      brancherInvitation(app);
    });
  }
  app.querySelectorAll<HTMLButtonElement>('[data-offre]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.offre);
      const o = offresDuJour(jour)[i];
      const erreur = accepterOffre(S.collection, jour, i);
      if (erreur) return ecranSocial(`<p class="alerte">${echap(erreur)}</p>`);
      sauver(S.collection);
      ecranSocial();
      const f = ouvrirFenetre(`
        <h2 class="onomato rouge">TRANSFERT !</h2>
        <div class="fenetre-carte eclat-fusion">${carteJoueur(trouverLutteur(o.donne))}</div>
        <p>Tu as reçu <b>${echap(trouverLutteur(o.donne).nom)}</b> contre un double de ${echap(trouverLutteur(o.demande).nom)}.</p>
        <button class="principal" data-fermer>Continuer</button>`, true);
      activerReflets(f);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-acheter]').forEach((b) =>
    b.addEventListener('click', () => {
      const r = acheterBooster(S.collection, b.dataset.acheter as 'classique' | 'rare', Math.random);
      if (typeof r === 'string') return ecranSocial(`<p class="alerte">${echap(r)}</p>`);
      sauver(S.collection);
      revelerPaquet({ titre: 'Booster acheté', boosters: [r], ouvert: false }, () => ecranSocial());
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-champion]').forEach((b) =>
    b.addEventListener('click', () => {
      const r = acheterChampion(S.collection, b.dataset.champion!);
      if (typeof r === 'string') return ecranSocial(`<p class="alerte">${echap(r)}</p>`);
      sauver(S.collection);
      revelerPaquet({ titre: 'Champion du Monde acheté', boosters: [r], ouvert: false }, () => ecranSocial());
    }),
  );
  app.querySelector('[data-ouvrir-echange]')?.addEventListener('click', () => ouvrirEchange(nouveauCode()));
  app.querySelector('[data-rejoindre-echange]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = (app.querySelector<HTMLInputElement>('#code-echange')!.value || '').trim().toLowerCase();
    if (!codeValide(code)) return ecranSocial('<p class="alerte">Le code fait 4 lettres, sans chiffres.</p>');
    ouvrirEchange(code);
  });
  window.scrollTo(0, 0);
}

export function ouvrirEchange(code: string) {
  quitterEchange();
  const perso = relaisPerso();
  const salle = acces() === 'local' && !perso ? salleLocale(`x${code}`) : perso ? salleRelais(`x${code}`, [perso]) : salleEnLigne(`x${code}`, () => salleRelais(`x${code}`, RELAIS));
  S.codeEchange = code;
  S.echange = new Echange(salle, code, S.collection, () => sauver(S.collection));
  let signature = '';
  S.echange.surVue((v) => {
    const sig = JSON.stringify(v) + String(salle.connecte());
    if (sig === signature) return;
    signature = sig;
    ecranEchange(v, salle.connecte());
  });
}

export function ecranEchange(v: VueEchange, connecte: boolean) {
  if (!S.echange) return;
  const mes = Object.entries(v.mesDoubles);
  const choix = mes.length
    ? mes.map(([id, n]) => {
        const l = trouverLutteur(id);
        return `<button class="choix-double ${v.monOffre === id ? 'pris' : ''}" data-proposer="${id}" aria-pressed="${v.monOffre === id}">${miniCarteLutteur(l, `${n} en trop`)}</button>`;
      }).join('')
    : '<p class="note">Tu n\'as aucun double pour l\'instant.</p>';
  const son = v.sonOffre ? trouverLutteur(v.sonOffre) : null;
  const ami = v.amiCoach ? `Coach ${v.amiCoach}` : 'Ton ami';
  let bouton = '';
  if (v.monOffre && son) {
    bouton = v.jaiAccepte
      ? `<button class="secondaire" data-annuler>${v.ilAccepte ? 'Échange en cours…' : `En attente de l'accord de ${echap(ami)} (annuler)`}</button>`
      : `<button class="principal" data-accepter>Accepter : ${echap(trouverLutteur(v.monOffre).nom)} contre ${echap(son.nom)}</button>`;
  }
  const dernier = v.dernier
    ? `<p class="succes">Échange réussi : tu as donné ${echap(trouverLutteur(v.dernier.donne).nom)} et reçu <b>${echap(trouverLutteur(v.dernier.recoit).nom)}</b>.</p>`
    : '';
  app.innerHTML = `
    <main class="sous-menu">
      ${enTete(`Transfert ${echap(S.codeEchange.toUpperCase())}`, '', '#social')}
      <p class="code-grand marge" aria-label="Code de la salle d'échange">${echap(S.codeEchange.toUpperCase())}</p>
      <p class="marge">${!connecte ? 'Connexion…' : v.amiPresent ? `<b class="ok">${echap(ami)} est dans la salle.</b>` : 'Envoie ce code à ton ami : dans Social, il touche « Rejoindre » et tape le code.'}</p>
      ${dernier}
      <section class="bloc">
        <h2>${echap(ami)} propose</h2>
        ${son ? `<div class="offre-ami">${miniCarteLutteur(son, `${echap(son.origine)} · ${NOM_RARETE[son.rarete]}${possede(S.collection, son.id) ? '' : ' · nouvelle pour toi'}`)}${v.ilAccepte ? '<span class="pastille nouvelle">A accepté</span>' : ''}</div>` : `<p class="note">${v.amiPresent ? 'Il choisit une carte…' : 'En attente de ton ami.'}</p>`}
      </section>
      <section class="bloc">
        <h2>Tu proposes</h2>
        <div class="grille-mini">${choix}</div>
      </section>
      <div class="barre-bas">${bouton || `<p class="note">${v.monOffre ? 'En attente de la proposition de ton ami.' : 'Choisis le double que tu proposes.'}</p>`}<button class="lien" data-quitter-echange>Quitter la salle de transfert</button></div>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('[data-proposer]').forEach((b) =>
    b.addEventListener('click', () => S.echange?.proposer(v.monOffre === b.dataset.proposer ? null : b.dataset.proposer!)),
  );
  app.querySelector('[data-accepter]')?.addEventListener('click', () => S.echange?.accepter());
  app.querySelector('[data-annuler]')?.addEventListener('click', () => S.echange?.annulerAccord());
  const sortir = (ev?: Event) => {
    ev?.preventDefault();
    quitterEchange();
    ecranSocial();
  };
  app.querySelector('[data-quitter-echange]')!.addEventListener('click', () => sortir());
  app.querySelector('.retour')?.addEventListener('click', sortir);
}
