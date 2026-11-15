const CACHE = 'possession-v12';
const FILES = ['./', './index.html', './manifest.json'];
const OFFLINE = '<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#111214;color:#f5f5f7;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><div><h2>読み込めませんでした</h2><p>ネットにつながる場所で、もう一度開いてください。</p></div></body>';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).searchParams.has('check')) { e.respondWith(fetch(e.request.url, {cache: 'no-store'})); return; }
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    let hit = await c.match(e.request, {ignoreSearch: true});
    if (!hit && e.request.mode === 'navigate') hit = (await c.match('./')) || (await c.match('./index.html'));
    const net = fetch(e.request.url, {cache: 'no-cache'}).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; });
    if (hit) { net.catch(() => {}); return hit; }
    try { return await net; }
    catch (err) {
      if (e.request.mode === 'navigate') return new Response(OFFLINE, {headers: {'Content-Type': 'text/html; charset=utf-8'}});
      return Response.error();
    }
  })());
});
