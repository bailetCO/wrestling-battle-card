// Code créateur, à l'écran (28/11/2026) : un champ dans Social et sous « Plus ». Chaque code une fois :
// la carte du créateur (Champion du Monde) et un booster épique, révélés comme un booster.

import { recevoirCodeCreateur, sauver } from '../collection';
import { codeValide, lireCode, noterSoutien, normaliserCode } from '../createurs';
import { fermerFenetre, ouvrirFenetre } from './combat';
import { S, echap } from './commun';
import { revelerPaquet } from './fin';
import { route } from './navigation';

const soutenu = () => S.collection.createurs.find((x) => x.code === S.collection.createurSoutenu);

export function blocCodeCreateur(): string {
  const cr = soutenu();
  return `
    <section class="bloc code-createur">
      <h2>Code créateur</h2>
      <p>Tu suis un créateur de contenu lutte ? Entre son code : tu reçois <b>sa carte Champion du Monde</b> et <b>un booster épique</b>.</p>
      <form class="form-code-createur" novalidate>
        <input name="code" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Code créateur">
        <button class="principal" type="submit">Valider</button>
      </form>
      <p class="etat-code note" role="status">${cr ? `Tu soutiens <b>${echap(cr.nom)}</b>. ${S.collection.createurs.length} code${S.collection.createurs.length > 1 ? 's' : ''} entré${S.collection.createurs.length > 1 ? 's' : ''}.` : ''}</p>
    </section>`;
}

export function brancherCodeCreateur(racine: ParentNode) {
  const form = racine.querySelector<HTMLFormElement>('.form-code-createur');
  if (!form) return;
  const etat = racine.querySelector<HTMLElement>('.etat-code')!;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const code = normaliserCode(form.querySelector<HTMLInputElement>('[name=code]')!.value);
    if (!codeValide(code)) { etat.textContent = 'Ce code n\'est pas valide : 3 à 20 lettres ou chiffres.'; return; }
    if (S.collection.createurs.some((x) => x.code === code)) { etat.textContent = 'Tu as déjà utilisé ce code.'; return; }
    const bouton = form.querySelector<HTMLButtonElement>('button')!;
    bouton.disabled = true;
    etat.textContent = 'Vérification…';
    try {
      const cr = await lireCode(code);
      if (!cr) { etat.textContent = 'Code inconnu. Vérifie-le auprès de ton créateur.'; bouton.disabled = false; return; }
      const boosters = recevoirCodeCreateur(S.collection, cr, Math.random);
      if (!boosters) { etat.textContent = 'Tu as déjà utilisé ce code.'; bouton.disabled = false; return; }
      sauver(S.collection);
      void noterSoutien(code, S.collection.idCoach).catch(() => false);
      fermerFenetre();
      revelerPaquet({ titre: `Code ${code} · ${cr.nom}`, boosters, ouvert: false }, () => route());
    } catch {
      etat.textContent = 'Vérification impossible pour le moment. Vérifie ta connexion internet et réessaie.';
      bouton.disabled = false;
    }
  });
}

export function fenetreCodeCreateur() {
  const f = ouvrirFenetre(`${blocCodeCreateur()}<button class="lien" data-fermer>Fermer</button>`, true);
  brancherCodeCreateur(f);
}
