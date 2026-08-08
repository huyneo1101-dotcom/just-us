/* Service worker cho app Tâm linh — cùng nếp với sw.js của Just Us.
   - index.html & file cùng origin: NETWORK-FIRST (có mạng thì luôn lấy bản mới, mất mạng thì rơi về cache).
   - data/*.json + thư viện CDN: CACHE-FIRST → đổi nội dung JSON thì PHẢI bump CACHE.
*/
const CACHE = 'tamlinh-v1';
const CDN = ['https://cdn.jsdelivr.net'];

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    // CHỈ dọn cache 'tamlinh-*': Just Us dùng chung origin và có cache 'justus-*' riêng.
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('tamlinh-') && k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Thư viện CDN cố định theo version + dữ liệu tĩnh: cache-first
  const isData = url.origin === location.origin && url.pathname.includes('/data/');
  if (CDN.some(c => req.url.startsWith(c)) || isData) {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit =>
        hit || fetch(req).then(resp => { if (resp && resp.ok) c.put(req, resp.clone()); return resp; })
      ))
    );
    return;
  }

  // Cùng origin: network-first
  if (url.origin === location.origin) {
    const isHtml = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
    const netFetch = isHtml ? fetch(url.href, { cache: 'reload' }) : fetch(req);
    e.respondWith(
      netFetch.then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./')))
    );
  }
});
