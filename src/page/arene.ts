// Arène par nation, sans affichage : ordre des nations, adversaires, progression et récompenses.

import { LUTTEURS, NATIONS, REGLES, type DefNation, type Hasard, type Niveau } from '../moteur';
import { gagnerMedailles, joindreGains, ouvrirBooster, type Booster, type Collection } from './collection';

const A = REGLES.arene;
export const PAR_NATION = A.niveaux.length;

export const nationsArene = (): DefNation[] => [...NATIONS].sort((a, b) => a.ordreArene - b.ordreArene);

// Les 5 adversaires d'une nation, du plus abordable au boss : la commune la plus faible, la commune
// la plus forte, la meilleure rare, la meilleure épique, puis la légendaire. (Dans config.ts, les
// lutteurs de chaque nation sont rangés par rareté, du plus fort au plus faible.)
export function adversairesDe(nation: string): string[] {
  const de = (r: string) => LUTTEURS.filter((l) => l.nation === nation && l.rarete === r);
  const communes = de('commune');
  return [communes[communes.length - 1], communes[0], de('rare')[0], de('epique')[0], de('legendaire')[0]]
    .filter(Boolean).map((l) => l.id);
}

export interface EtapeArene {
  nation: DefNation | null; // null : arène terminée
  rang: number; // 0 à 4 dans la nation
  adversaire: string | null;
  niveau: Niveau;
  nationsBattues: DefNation[];
}

export function etapeArene(c: Collection): EtapeArene {
  const ordre = nationsArene();
  const i = Math.floor(c.arene / PAR_NATION);
  const rang = c.arene % PAR_NATION;
  const nation = ordre[i] ?? null;
  return {
    nation, rang,
    adversaire: nation ? adversairesDe(nation.id)[rang] : null,
    niveau: A.niveaux[rang] as Niveau,
    nationsBattues: ordre.slice(0, Math.min(i, ordre.length)),
  };
}

export const areneTerminee = (c: Collection) => c.arene >= nationsArene().length * PAR_NATION;

// La carte du boss : 1 chance sur 3. Rangée dans un booster « récompense » pour être révélée.
function tenterCarteBoss(c: Collection, nation: string, hasard: Hasard): Booster[] {
  if (hasard() >= A.chanceCarteBoss) return [];
  const boss = adversairesDe(nation)[PAR_NATION - 1];
  const nouvelle = (c.exemplaires[boss] ?? 0) === 0;
  c.exemplaires[boss] = (c.exemplaires[boss] ?? 0) + 1;
  return [{ type: 'recompense', cartes: [boss], nouvelles: nouvelle ? [boss] : [] }];
}

// Victoire contre l'adversaire en cours : +1 médaille ; on passe au suivant. Au 5e, la nation est
// battue : 2 ou 3 boosters, 3 médailles, et peut-être la carte du boss. `bonus` : boosters du
// bonus de tutoriel (0 sans bonus).
export function victoireArene(c: Collection, hasard: Hasard, bonus = 0): { boosters: Booster[]; nationBattue: DefNation | null; carteBoss: boolean } {
  const e = etapeArene(c);
  if (!e.nation) return { boosters: [], nationBattue: null, carteBoss: false };
  c.victoires++;
  c.defaitesDeSuite = 0;
  c.arene++;
  let medailles = REGLES.economie.medaillesParVictoire.arene;
  const boosters: Booster[] = Array.from({ length: bonus }, () => ouvrirBooster(c, hasard));
  let carte: Booster[] = [];
  const battue = e.rang === PAR_NATION - 1;
  if (battue) {
    const [mini, maxi] = A.boostersParNation;
    const n = mini + Math.floor(hasard() * (maxi - mini + 1));
    for (let k = 0; k < n; k++) boosters.push(ouvrirBooster(c, hasard));
    medailles += A.medaillesParNation;
    carte = tenterCarteBoss(c, e.nation.id, hasard);
  }
  const g = gagnerMedailles(c, medailles);
  return { boosters: [...carte, ...joindreGains(boosters, g)], nationBattue: battue ? e.nation : null, carteBoss: carte.length > 0 };
}

// Revanche contre le boss d'une nation déjà battue : +1 médaille, et 1 chance sur 3 d'avoir sa carte.
export function victoireBossRejoue(c: Collection, nation: string, hasard: Hasard): { boosters: Booster[]; carteBoss: boolean } {
  c.victoires++;
  c.defaitesDeSuite = 0;
  const carte = tenterCarteBoss(c, nation, hasard);
  const g = gagnerMedailles(c, REGLES.economie.medaillesParVictoire.arene);
  return { boosters: [...carte, ...joindreGains([], g)], carteBoss: carte.length > 0 };
}
