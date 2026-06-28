/* Service worker cho Just Us — PWA cài được + chạy offline.
   Chiến lược:
   - index.html & file cùng origin: NETWORK-FIRST (luôn lấy bản mới khi có mạng → bản auto-deploy
     hiện ngay; offline thì rơi về cache).
   - Thư viện CDN (jsdelivr) cố định theo version: CACHE-FIRST.
   - Supabase: KHÔNG cache (luôn ra mạng).
*/
const CACHE = 'justus-v1';
const CDN = ['https://cdn.jsdelivr.net'];

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Supabase (REST/Auth/Storage/Realtime): luôn ra mạng
  if (url.hostname.endsWith('supabase.co')) return;

  // Thư viện CDN cố định: cache-first
  if (CDN.some(c => req.url.startsWith(c))) {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit =>
        hit || fetch(req).then(resp => { if (resp && resp.ok) c.put(req, resp.clone()); return resp; })
      ))
    );
    return;
  }

  // Cùng origin (index.html, manifest, icon…): network-first
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./')))
    );
    return;
  }
  // Còn lại (vd tile bản đồ): để mặc định ra mạng
});
