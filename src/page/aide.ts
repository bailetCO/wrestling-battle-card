// Aide au joueur : la page de règles et les écrans du tutoriel.
// Les chiffres viennent de la configuration : si on rééquilibre, les textes suivent.

import { ACTIONS, REGLES, trouverLutteur, type Choix, type IdAction } from '../moteur';
import { ICONE } from './textes';

const R = REGLES;
const NB_ETAPES_HISTOIRE = R.histoire.boosters.length;
const pct = (x: number) => `${Math.round(x * 100)} %`;

// Schéma « qui bat qui » : chaque flèche va du gagnant vers le perdant.
// Attaque > Feinte ; Feinte > Défense et Contre ; Défense > Attaque ; Contre > Défense.
export function schemaFamilles(): string {
  const icone = (f: 'attaque' | 'defense' | 'contre' | 'feinte') =>
    ICONE[f].replace('<svg viewBox="0 0 24 24" aria-hidden="true">', '').replace('</svg>', '');
  // Étiquette au-dessus pour la ligne du haut, en dessous pour celle du bas.
  const bulle = (f: 'attaque' | 'defense' | 'contre' | 'feinte', nom: string, x: number, y: number, haut: boolean) => `
    <g transform="translate(${x} ${y})" class="sf-noeud f-${f}">
      <circle r="28" />
      <g transform="translate(-13 -13) scale(1.08)">${icone(f)}</g>
      <text y="${haut ? -38 : 50}" text-anchor="middle">${nom}</text>
    </g>`;
  return `
    <figure class="schema">
      <svg class="schema-familles" viewBox="0 0 320 256" role="img" aria-label="L'attaque bat la feinte. La feinte bat la défense et le contre. La défense bat l'attaque. Le contre bat la défense et l'attaque.">
        <defs><marker id="sf-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs>
        <g class="sf-fleches" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" marker-end="url(#sf-pointe)">
          <path d="M106 60 L210 60" />
          <path d="M224 84 L98 176" />
          <path d="M248 94 L248 162" />
          <path d="M72 162 L72 94" />
          <path d="M212 196 L110 196" />
          <path d="M224 176 L98 82" class="sf-condition" />
        </g>
        ${bulle('attaque', 'Attaque', 72, 60, true)}
        ${bulle('feinte', 'Feinte', 248, 60, true)}
        ${bulle('defense', 'Défense', 72, 196, false)}
        ${bulle('contre', 'Contre', 248, 196, false)}
      </svg>
      <figcaption>La flèche va du gagnant vers le perdant. En violet : le contre bat aussi l'attaque, s'il ne rate pas (précision).</figcaption>
    </figure>`;
}

export function reglesHTML(): string {
  return `
    <section class="regle">
      <h2>Le but</h2>
      <p>Deux lutteurs s'affrontent en <b>3 périodes de ${R.toursParPeriode} tours</b>. Gagne <b>${R.periodesPourGagner} périodes</b>, ou fais un <b>tombé</b> pour gagner tout de suite. Une période s'arrête aussi si un lutteur mène de ${R.ecartSuperiorite} points.</p>
    </section>
    <section class="regle">
      <h2>Un tour</h2>
      <p>Chacun choisit en secret une de ses 4 actions, puis on les révèle en même temps. Chaque action coûte de l'endurance.</p>
    </section>
    <section class="regle">
      <h2>Qui bat qui</h2>
      ${schemaFamilles()}
      <ul class="liste-regles">
        <li><b>Attaque</b> : marque des points (1 à 5 selon la prise). Plus elle rapporte, plus elle coûte : ${ACTIONS.sortie_zone.cout} pour 1 point, ${ACTIONS.simple_jambe.cout} pour 2, ${ACTIONS.double_jambe.cout} pour 4, ${ACTIONS.grande_projection.cout} pour 5.</li>
        <li><b>Défense</b> (coût ${ACTIONS.defense.cout}) : bloque l'attaque et fait récupérer de l'endurance.</li>
        <li><b>Feinte</b> (coût ${ACTIONS.feinte.cout}) : bat la défense et le contre. Contre une défense, l'adversaire perd ${pct(R.feinteSurDefense.perteEndurance)} d'endurance, et tu peux prendre l'<b>initiative</b>. Ta prochaine attaque ou ton prochain contre réussi vaut +${R.bonusFeinte}, pendant ${R.toursBonusFeinte} tours.</li>
        <li><b>Contre</b> (coût ${ACTIONS.contre.cout}) : bat la défense. Face à une attaque, il la prend et renvoie ses points : seule la précision compte (un contre raté laisse passer l'attaque).</li>
        <li>Deux actions de la même famille s'annulent, sauf si l'un a au moins le double d'endurance de l'autre.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Chaque action a son caractère</h2>
      <ul class="liste-regles">
        <li><b>Simple jambe</b> (2 pts) : pas chère, et le Matraquage ne baisse pas sa précision.</li>
        <li><b>Grosses attaques</b> (5 pts) : bloquées par une défense, elles coûtent ${R.grosseAttaqueBloquee.perte} d'endurance de plus.</li>
        <li><b>Parade</b> : bloque l'attaque et fait perdre ${R.parade.perteAttaquant} d'endurance à l'attaquant.</li>
        <li><b>Esquive</b> : ne fait pas récupérer, mais une attaque esquivée donne l'initiative 1 fois sur ${Math.round(1 / R.esquive.chanceInitiative)}.</li>
        <li><b>Sprawl</b> (coût ${ACTIONS.sprawl.cout}) : bloque et marque ${ACTIONS.sprawl.points} points, ${ACTIONS.sprawl.points + R.sprawlSurDoubleJambe} sur une Double jambe.</li>
        <li><b>Relance</b> : face à une défense, marque ${R.relance.pointsSurDefense} points ; face à une attaque, ne renvoie que la moitié des points.</li>
        <li><b>Matraquage</b> (coût ${ACTIONS.matraquage.cout}) : l'adversaire perd ${pct(R.matraquage.perteEndurance)} d'endurance et ${pct(R.matraquage.malusPrecision)} de précision sur ses attaques pendant ${R.matraquage.tours} tours.</li>
        <li><b>Bras tiré</b> (2 pts) : l'attaque du tour suivant coûte ${R.brasTire.reductionCout} de moins.</li>
        <li><b>Sortie de zone</b> (1 pt) : un contre ne la prend qu'une fois sur ${Math.round(1 / R.sortieZone.chanceContre)}.</li>
        <li><b>Tour de hanche</b> (4 pts) : ne rate jamais si tu es plus fort que l'adversaire.</li>
        <li><b>Cravate</b> (contre) : sur une attaque aux jambes, l'attaquant perd ${R.cravate.perteEndurance} d'endurance de plus.</li>
        <li><b>Changement de niveau</b> (feinte) : pas de bonus de points, mais ton attaque du tour suivant ne peut pas être contrée.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Combos</h2>
      <p>Deux actions réussies à la suite. Le bouton de l'action qui déclenche un combo s'allume en combat.</p>
      <ul class="liste-regles">
        <li><b>Passage dans le dos</b> : Matraquage puis Ceinture arrière, +${R.combos.passageDansLeDos.points} points.</li>
        <li><b>Contre-temps</b> : Sprawl puis n'importe quelle attaque, qui ne peut pas rater.</li>
        <li><b>Enchaînement aux jambes</b> : Simple jambe puis Double jambe, +${R.combos.enchainementJambes.points} point et ${R.combos.enchainementJambes.reductionCout} d'endurance en moins.</li>
        <li><b>Esquive et contre</b> : Esquive puis un contre qui prend l'attaque, +${R.combos.esquiveContre.points} points.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Endurance et précision</h2>
      <p>Plus ton endurance baisse, plus tes actions risquent de rater :</p>
      <ul class="liste-regles">
        <li>${R.precision.seuilPlein} d'endurance ou plus : <b>toujours réussie</b>.</li>
        <li>En dessous, la chance baisse un peu à chaque point perdu, jusqu'à ${pct(R.precision.chanceMinimale)} à 0. Elle s'affiche sur chaque action.</li>
        <li><b>Second souffle</b> : une fois par combat, sous ${R.souffle.seuil} d'endurance, « Souffler » rend ${R.souffle.gain} d'endurance. Si l'adversaire attaque pendant ce temps, il marque son attaque et ${R.souffle.penalite} point de plus.</li>
        <li>Sans assez d'endurance pour une action, il ne reste que <b>Lutte</b> (1 chance sur 10 de marquer). ${R.toursSansEnduranceAvantTombe} tours à 0, c'est le tombé.</li>
      </ul>
      <p>Tous les ${R.recuperationReguliere.tousLesTours} tours, chaque lutteur récupère un peu d'endurance selon sa statistique de récupération (si sa précision le permet), et il récupère davantage entre deux périodes.</p>
    </section>
    <section class="regle">
      <h2>Action spéciale</h2>
      <p>Une fois disponible (dès le tour ${R.speciale.premierTour}, puis après ${R.speciale.toursRecharge} tours de repos), l'action de ta famille spéciale brille en orange avec une ★ : touche-la, et le jeu te demande si tu l'actives en version spéciale, renforcée et plus chère :</p>
      <ul class="liste-regles">
        <li><b>Attaque spéciale</b> : tentative de tombé. Plus fort que l'adversaire, elle peut percer sa défense.</li>
        <li><b>Défense spéciale</b> : renversement, ${R.speciale.pointsDefense} points.</li>
        <li><b>Contre spécial</b> : bat toujours une attaque ou une feinte, et tente le tombé.</li>
        <li><b>Feinte spéciale</b> : ${R.speciale.pointsFeinte} points tout de suite, puis +${R.speciale.bonusEnchainementFeinte} si ton action suivante réussit.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Tombé</h2>
      <p>Une tentative de tombé réussit plus souvent si tu as plus d'endurance que l'adversaire. Le lutteur menacé annonce <b>pile ou face</b> : s'il devine juste, il s'en sort.</p>
      <p>Un <b>combo</b> (3 actions réussies d'affilée, dont 2 attaques) déclenche aussi une tentative de tombé.</p>
    </section>
    <section class="regle">
      <h2>À ne pas oublier</h2>
      <ul class="liste-regles">
        <li><b>Passivité</b> : ${R.pression.tours} tours sans attaque ni contre donnent 1 point à l'adversaire.</li>
        <li><b>Initiative</b> : tu vois 2 actions possibles de l'adversaire (dont la vraie) et tu peux changer la tienne.</li>
        <li>À égalité en fin de période, c'est la plus grosse prise qui départage.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Les modes de jeu</h2>
      <ul class="liste-regles">
        <li><b>Entraînement</b> : une seule période. Victoire par tombé, à ${R.ecartSuperiorite} points d'écart, ou aux points à la fin. Égalité : mort subite, le premier qui marque gagne.</li>
        <li><b>Style de combat</b> (entraînement et entre amis) : le <b>format</b> (Normal ou Enchaînement) et la <b>durée</b> (normale, ou <b>infinie</b> : pas de périodes ni d'écart, le combat ne s'arrête que sur un tombé ou un abandon). En durée infinie, la fatigue monte : dès le tour ${R.infini.debutFatigue}, on récupère tous les 3 tours, puis tous les 4 tours au tour ${R.infini.debutFatigue + R.infini.palier}, etc. ; dès le tour ${R.infini.debutSurcout}, chaque action coûte +1, puis +1 de plus tous les ${R.infini.palier} tours. Ne plus pouvoir payer aucune action pendant ${R.toursSansEnduranceAvantTombe} tours, c'est le tombé.</li>
        <li><b>Format Enchaînement</b> (à l'essai) : chacun compose en secret une séquence de ${R.enchainement.actions} actions, comparées une à une ; ${R.enchainement.toursParPeriode} tours, soit 4 séquences. Un contre réussi à la 1re action brise la chaîne : les deux séquences s'arrêtent, mais l'adversaire paie l'endurance de ses actions annulées. Un Matraquage réussi à la 2e action (2 fois sur 3) annule la dernière action adverse, qui est payée quand même ; celle du lutteur qui a matraqué se joue. L'action spéciale suit les règles normales : dès le 2e tour, puis 3 actions de recharge. L'initiative montre la dernière action de l'adversaire et permet de changer la sienne.</li>
        <li><b>Carrière</b> : ${R.arene.niveaux.length} lutteurs par nation, de plus en plus forts, le dernier étant son champion (ordinateur fort). Une défaite ? Tu réaffrontes le même lutteur. Chaque nation battue : ${R.arene.boostersParNation[0]} ou ${R.arene.boostersParNation[1]} boosters, ${R.arene.medaillesParNation} médailles, et 1 chance sur ${Math.round(1 / R.arene.chanceCarteBoss)} de gagner la carte du champion (on peut le réaffronter).</li>
        <li><b>Tournoi individuel</b> (${R.tournoi.individuel.inscription} $) : de ${R.tournoi.individuel.minimum} à ${R.tournoi.individuel.maximum} lutteurs, en double tableau. Tu avances tant que tu gagnes ; une défaite avant les 1/2 finales t'envoie dans le tableau des perdants, une deuxième t'élimine. Chaque perdant de 1/2 finale affronte le vainqueur du tableau des perdants du côté opposé ; les deux gagnants jouent la petite finale (3e place). Gains : ${R.tournoi.individuel.medailles[1]}, ${R.tournoi.individuel.medailles[2]} et ${R.tournoi.individuel.medailles[3]} médailles, ${R.tournoi.individuel.dollars[1]}, ${R.tournoi.individuel.dollars[2]} et ${R.tournoi.individuel.dollars[3]} $, booster rare au vainqueur.</li>
        <li><b>Tournoi par équipe</b> (${R.tournoi.equipe.inscription} $) : tes ${R.tournoi.equipe.duels} lutteurs de Mon Club, un duel chacun ; la première équipe à ${R.tournoi.equipe.victoiresPourGagner} victoires gagne. <b>Bonus de nation</b> : 3 lutteurs d'une même nation donnent ${pct(R.tournoi.equipe.bonusNation[3])} à toute l'équipe, 4 : ${pct(R.tournoi.equipe.bonusNation[4])}, 5 : ${pct(R.tournoi.equipe.bonusNation[5])}.</li>
        <li><b>Mon Club</b> : ouvre à ${R.club.medaillesOuverture} médailles, puis un niveau et une place de plus toutes les ${R.club.medaillesParNiveau} médailles, jusqu'au niveau ${R.club.niveauMax} (${R.club.niveauMax} places). À partir du niveau ${R.club.niveauBooster}, chaque niveau donne aussi un booster rare.</li>
        <li><b>Mode histoire</b> : ${NB_ETAPES_HISTOIRE} étapes qui font découvrir tout le jeu, à valider dans l'ordre. Chaque étape rapporte des boosters ; la dernière, aussi une carte légendaire. </li>
        <li><b>Saison sportive</b> : un mode à part, ouvert au niveau ${R.club.niveauSaison} de Mon Club. Interclub, régional, national, international, championnats du monde, et Jeux Olympiques une saison sur 4.</li>
        <li><b>Médailles et niveau</b> : +1 médaille par victoire contre l'ordinateur ou en tournoi, +2 en ligne ; toutes les ${R.economie.medaillesParPalier} médailles, ${R.economie.dollarsParPalier} $. Un niveau de compte toutes les ${R.compte.medaillesParNiveau} médailles.</li>
      </ul>
    </section>`;
}

// ---------- Tutoriel ----------

export interface EcranTuto { titre: string; html: string }

// Les écrans avant le combat guidé : deux seulement (le grand tutoriel dure environ 2 minutes ;
// collection, fusion, Mon Club et les modes se découvrent ensuite avec le mode histoire et les
// tutoriels courts).
export function ecransTutoriel(): EcranTuto[] {
  return [
    {
      titre: 'Bienvenue, coach !',
      html: `<p>Ton rôle : réunir des lutteurs, régler leurs actions et les mener à la victoire.</p>
        <p>Commence par un combat express de ${R.tutoriel.toursCombat} tours avec ${trouverLutteur('europe').nom} : le coach te guide. Le reste (collection, fusion, ton club, les tournois) se découvre ensuite, pas à pas, avec le mode histoire.</p>`,
    },
    {
      titre: 'Le combat',
      html: `${schemaFamilles()}
        <p>Chacun choisit en secret, puis on révèle. <b>L'attaque bat la feinte, la feinte bat la défense et le contre, la défense bat l'attaque, le contre bat la défense.</b></p>`,
    },
  ];
}

// Combat guidé : le lutteur « europe » (toi) contre « usa-explosif » (noms : voir config).
export const TUTO_COMBAT = { moi: 'europe', adversaire: 'usa-explosif', graine: 2026 };

export interface EtapeGuidee {
  ordi: Choix; // ce que joue l'adversaire
  conseil: { action: IdAction; speciale: boolean };
  texte: string;
}

export const ETAPES_GUIDEES: EtapeGuidee[] = [
  {
    ordi: { action: 'double_jambe' },
    conseil: { action: 'defense', speciale: false },
    texte: 'Premier tour ! Colt va attaquer (dans un vrai combat, tu ne verras pas son choix). La <b>Défense bat l\'Attaque</b> : choisis Défense.',
  },
  {
    ordi: { action: 'sprawl' },
    conseil: { action: 'feinte', speciale: false },
    texte: 'Bien joué : ta défense a bloqué son attaque et t\'a fait récupérer de l\'endurance. Maintenant, il se met en défense. La <b>Feinte bat la Défense</b> : il perd de l\'endurance et tu peux gagner l\'initiative. Choisis Feinte.',
  },
  {
    ordi: { action: 'feinte' },
    conseil: { action: 'attaque_base', speciale: false },
    texte: 'Ta feinte est passée, et ta prochaine attaque vaut +2. Il tente une feinte à son tour : l\'<b>Attaque bat la Feinte</b>. Attaque !',
  },
  {
    ordi: { action: 'simple_jambe' },
    conseil: { action: 'defense', speciale: true },
    texte: 'Des points pour toi ! Ton <b>action spéciale</b> est prête : l\'action qui peut la jouer brille en orange avec une ★. La Défense spéciale renverse l\'adversaire pour 4 points si elle bloque une attaque, et il va attaquer. Touche la Défense, puis active la spéciale.',
  },
];

export const TEXTE_LIBRE = `Renversement ! À toi de jouer seul pour les ${R.tutoriel.toursCombat - 4} derniers tours. Surveille ta barre : sous 50 d'endurance, tes actions peuvent rater.`;

export const TEXTE_LIBRE_SUITE = `Dernier tour : l'Attaque bat la Feinte, la Feinte bat la Défense et le Contre, la Défense bat l'Attaque, le Contre bat la Défense.`;
