// Aide au joueur : la page de règles et les écrans du tutoriel.
// Les chiffres viennent de la configuration : si on rééquilibre, les textes suivent.

import { COUT_FAMILLE, REGLES, type Choix, type IdAction } from '../moteur';
import { ICONE } from './textes';

const R = REGLES;
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
      <svg class="schema-familles" viewBox="0 0 320 256" role="img" aria-label="L'attaque bat la feinte. La feinte bat la défense et le contre. La défense bat l'attaque. Le contre bat la défense, et bat l'attaque sous condition.">
        <defs><marker id="sf-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs>
        <g class="sf-fleches" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" marker-end="url(#sf-pointe)">
          <path d="M106 60 L210 60" />
          <path d="M224 84 L98 176" />
          <path d="M248 94 L248 162" />
          <path d="M72 162 L72 94" />
          <path d="M212 196 L110 196" />
          <path d="M224 176 L98 82" stroke-dasharray="7 6" class="sf-condition" />
        </g>
        ${bulle('attaque', 'Attaque', 72, 60, true)}
        ${bulle('feinte', 'Feinte', 248, 60, true)}
        ${bulle('defense', 'Défense', 72, 196, false)}
        ${bulle('contre', 'Contre', 248, 196, false)}
      </svg>
      <figcaption>La flèche va du gagnant vers le perdant. En pointillés (violet) : le contre bat l'attaque seulement avec plus d'endurance <i>et</i> plus de force.</figcaption>
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
        <li><b>Attaque</b> (coût ${COUT_FAMILLE.attaque}) : marque des points (2 à 5 selon la prise).</li>
        <li><b>Défense</b> (coût ${COUT_FAMILLE.defense}) : bloque l'attaque et fait récupérer de l'endurance. Le Sprawl marque aussi 2 points.</li>
        <li><b>Feinte</b> (coût ${COUT_FAMILLE.feinte}) : bat la défense et le contre. Contre une défense, l'adversaire perd ${pct(R.feinteSurDefense.perteEndurance)} d'endurance, et tu peux prendre l'<b>initiative</b>. Ta prochaine attaque vaut +${R.bonusFeinte}.</li>
        <li><b>Contre</b> (coût ${COUT_FAMILLE.contre}) : bat la défense. Face à une attaque, il renvoie ses points si tu as plus d'endurance <i>et</i> plus de force (un seul des deux : 1 point de sortie).</li>
        <li>Deux actions de la même famille s'annulent, sauf si l'un a au moins le double d'endurance de l'autre.</li>
      </ul>
    </section>
    <section class="regle">
      <h2>Endurance et précision</h2>
      <p>Plus ton endurance baisse, plus tes actions risquent de rater :</p>
      <ul class="liste-regles">
        <li>50 d'endurance ou plus : <b>toujours réussie</b>.</li>
        <li>De 20 à 50 : 2 chances sur 3. De 0 à 20 : 1 chance sur 2.</li>
        <li>Sans assez d'endurance pour une action, il ne reste que <b>Lutte</b> (1 chance sur 10 de marquer). ${R.toursSansEnduranceAvantTombe} tours à 0, c'est le tombé.</li>
      </ul>
      <p>Tous les ${R.recuperationReguliere.tousLesTours} tours, chaque lutteur récupère ${pct(R.recuperationReguliere.part)} de son endurance actuelle (si sa précision le permet), et il récupère davantage entre deux périodes.</p>
    </section>
    <section class="regle">
      <h2>Action spéciale</h2>
      <p>Une fois disponible (dès le tour ${R.speciale.premierTour}, puis après ${R.speciale.toursRecharge} tours de repos), le bouton orange joue une action de ta famille spéciale en version renforcée, plus chère :</p>
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
    </section>`;
}

// ---------- Tutoriel ----------

export interface EcranTuto { titre: string; html: string }

// Les écrans avant le combat guidé. `illus` fournit les illustrations faites avec les vraies cartes.
export function ecransTutoriel(illus: { cartes: string; fusion: string; club: string }): EcranTuto[] {
  return [
    {
      titre: 'Bienvenue, coach !',
      html: `<p>Ton rôle : réunir des lutteurs, régler leurs actions et les mener à la victoire.</p>
        <p>En quelques écrans, découvre la collection, la fusion et les échanges, puis joue une période guidée pour apprendre à combattre.</p>`,
    },
    {
      titre: 'Ta collection',
      html: `${illus.cartes}
        <p>Chaque lutteur est une carte : <b>commune</b>, <b>rare</b>, <b>épique</b> ou <b>légendaire</b>. Plus elle est rare, plus elle gagne souvent.</p>
        <p>Chaque victoire ouvre un <b>booster</b> : 3 cartes (classique) ou 5 cartes (rare). Tu peux recevoir des cartes en double, et c'est utile.</p>
        <p>Dans Collection, touche une carte pour choisir ses 4 actions.</p>`,
    },
    {
      titre: 'La fusion',
      html: `${illus.fusion}
        <p>Fusionne tes doubles pour faire monter une carte de grade : grade 2 avec 1 double, grade 3 avec 2, jusqu'au grade 5.</p>
        <p>Chaque grade ajoute +5 % sur les statistiques (+10 % au grade 5) et <b>débloque une nouvelle action</b>, moins chère.</p>
        <p>Au grade 5, chaque fusion de 5 doubles donne une <b>étoile</b> : −1 d'endurance sur l'action de ton choix.</p>`,
    },
    {
      titre: 'Le Club',
      html: `${illus.club}
        <p><b>Échange</b> tes doubles avec un ami : ouvre une salle, donne-lui le code, chacun propose une carte et l'échange se fait quand vous acceptez tous les deux.</p>
        <p>Le <b>marchand</b> propose 3 échanges par jour : une carte contre un de tes doubles de même rareté.</p>`,
    },
    {
      titre: 'Le combat',
      html: `${schemaFamilles()}
        <p>Chacun choisit en secret, puis on révèle. <b>L'attaque bat la feinte, la feinte bat la défense et le contre, la défense bat l'attaque, le contre bat la défense.</b></p>
        <p>Place à la pratique : tu vas jouer une période avec Hugo Delmas. Le coach te guide pendant les premiers tours.</p>`,
    },
  ];
}

// Combat guidé : Hugo Delmas (toi) contre Colt Ramsey, sur une période.
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
    texte: 'Des points pour toi ! Ton <b>action spéciale</b> est prête (le bouton orange). La Défense spéciale renverse l\'adversaire pour 4 points si elle bloque une attaque, et il va attaquer. Choisis la Défense spéciale.',
  },
];

export const TEXTE_LIBRE = `Renversement ! À toi de jouer jusqu'à la fin de la période. Surveille ta barre : sous 50 d'endurance, tes actions peuvent rater. Retiens : l'Attaque bat la Feinte, la Feinte bat la Défense et le Contre, la Défense bat l'Attaque, le Contre bat la Défense.`;

export const TEXTE_LIBRE_SUITE = `À toi de jouer ! La période se termine au 10e tour, ou dès qu'un lutteur mène de 10 points.`;
