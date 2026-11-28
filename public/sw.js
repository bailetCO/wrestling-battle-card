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

// Notifications (28/11/2026) : envoyées par Corentin depuis la console Firebase (Cloud Messaging).
// Le message arrive ici même quand le jeu est fermé ; on l'affiche, et toucher la notification
// ouvre le jeu (ou le ramène au premier plan).
self.addEventListener('push', (ev) => {
  let d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch { d = { notification: { body: ev.data ? ev.data.text() : '' } }; }
  const n = d.notification || {};
  const lien = (d.fcmOptions && d.fcmOptions.link) || (d.data && d.data.lien) || './';
  ev.waitUntil(self.registration.showNotification(n.title || 'Wrestling Battle Card', {
    body: n.body || '', icon: n.icon || './icone-192.png', badge: './icone-192.png', image: n.image, data: { lien }, tag: d.fcmMessageId,
  }));
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const lien = new URL((ev.notification.data && ev.notification.data.lien) || './', self.location.href).href;
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
    const ouverte = fenetres.find((f) => f.url.startsWith(self.registration.scope));
    return ouverte ? ouverte.focus() : self.clients.openWindow(lien);
  }));
});
