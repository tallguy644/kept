// Kept offline support: keeps the app cached so it opens with no signal.
// The app's own files always load fresh when online (so every update reaches drivers right away)
// and fall back to the cached copy offline. Fonts and the Firebase code are versioned, so they load from cache.
const CACHE = 'kept-v29';
const SHELL = ['./', './index.html', './privacy.html', './manifest.webmanifest', './pro.js', './account.js', './lock.js', './moved.js', './sync.js', './native.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's own HTTP cache, so a new version never stores stale files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache Google sign-in, Drive or Firebase database traffic.
  if (/(^|\.)googleapis\.com$|accounts\.google\.com$/.test(url.hostname) && !url.hostname.startsWith('fonts.')) return;
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isSdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!sameOrigin && !isFont && !isSdk) return;
  const keep = res => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (sameOrigin) {
    // Network first: newest version when online, cached copy when offline.
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(keep)
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(keep)));
});
