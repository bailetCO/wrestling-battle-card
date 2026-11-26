// Mode développeur : les outils de test (débloquer les cartes, médailles, passer une étape…)
// ne sont visibles que pour l'auteur du jeu. On l'ouvre en ajoutant ?dev à l'adresse du jeu,
// une fois : le téléphone s'en souvient. ?nodev le retire.

const CLE = 'wbc-dev';

function lireModeDev(): boolean {
  try {
    const p = new URLSearchParams(location.search);
    if (p.has('dev')) localStorage.setItem(CLE, '1');
    if (p.has('nodev')) localStorage.removeItem(CLE);
    return localStorage.getItem(CLE) === '1';
  } catch {
    return false;
  }
}

export const DEV = typeof location !== 'undefined' && lireModeDev();
