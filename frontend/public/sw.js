const VERSION = 'pockettrail-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const response = await fetch('/');
    if (!response.ok) throw new Error('App shell unavailable');
    const html = await response.clone().text();
    await cache.put('/', response);
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(match => match[1]);
    await cache.addAll([...assets, '/icon.svg', '/manifest.webmanifest']);
    // Fonts must be cached during installation, before the first page is controlled.
    for (const asset of assets.filter(path => path.endsWith('.css'))) {
      const stylesheet = await cache.match(asset);
      const css = await stylesheet.text();
      const fonts = [...css.matchAll(/url\(["']?(\/assets\/[^\)"'\s]+)["']?\)/g)].map(match => match[1]);
      await cache.addAll([...new Set(fonts)]);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('pockettrail-') && name !== VERSION) await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname === '/health') return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
