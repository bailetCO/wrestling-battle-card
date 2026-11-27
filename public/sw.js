// Service worker : garde une copie du jeu sur le téléphone pour pouvoir jouer sans réseau
// (combats contre l'ordinateur). Toujours la version en ligne d'abord : la copie ne sert
// que si le réseau manque, donc une mise à jour arrive dès la connexion suivante.
const CACHE = 'wbc-jeu';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (ev) => ev.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Firebase, relais : jamais en copie
  if (url.pathname.endsWith('/version.json')) return; // numéro de la version en ligne : toujours demandé au serveur
  // La page est toujours revérifiée auprès du serveur (pas de vieille copie du navigateur après une mise à jour).
  const demande = req.mode === 'navigate' ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : req;
  ev.respondWith(
    fetch(demande)
      .then((rep) => {
        if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
        return rep;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r ?? caches.match('./'))),
  );
});
