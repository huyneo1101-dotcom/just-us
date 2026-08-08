/* Service worker cho Just Us — PWA cài được + chạy offline.
   Chiến lược:
   - index.html & file cùng origin: NETWORK-FIRST (luôn lấy bản mới khi có mạng → bản auto-deploy
     hiện ngay; offline thì rơi về cache).
   - Thư viện CDN (jsdelivr) cố định theo version: CACHE-FIRST.
   - Supabase: KHÔNG cache (luôn ra mạng).
*/
const CACHE = 'justus-v24';
const NOTI_CACHE = 'justus-noti';
const CDN = ['https://cdn.jsdelivr.net'];

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== NOTI_CACHE).map(k => caches.delete(k))))
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

  // Cùng origin (index.html, manifest, icon…): network-first.
  // HTML/điều hướng: BỎ QUA HTTP cache (cache:'reload') để luôn lấy bản mới nhất khi có mạng.
  if (url.origin === location.origin) {
    const isHtml = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
    const netFetch = isHtml ? fetch(url.href, { cache: 'reload' }) : fetch(req);
    e.respondWith(
      netFetch.then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./')))
    );
    return;
  }
  // Còn lại (vd tile bản đồ): để mặc định ra mạng
});

/* ===== Thông báo (notifications) ===== */
// Bấm vào thông báo → mở/đưa app lên trước
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Push từ server (nếu sau này có backend web-push)
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Just Us 💗', {
    body: d.body || '', icon: 'icon.svg', badge: 'icon.svg', tag: d.tag || 'ju-push', data: d
  }));
});

// Nền định kỳ (Android/Chrome, best-effort): đọc "digest" trang đã lưu rồi nhắc
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'ju-daily') e.waitUntil(showDailyDigest());
});
async function showDailyDigest() {
  try {
    const c = await caches.open(NOTI_CACHE);
    const r = await c.match('/__digest');
    if (!r) return;
    const d = await r.json();
    const today = new Date().toISOString().slice(0, 10);
    if (!d || d.date !== today || !d.items || !d.items.length) return;
    await self.registration.showNotification('Hôm nay của tụi mình 💗', {
      body: d.items.slice(0, 5).map(x => x.title).join('\n'),
      icon: 'icon.svg', badge: 'icon.svg', tag: 'ju-daily-' + today, data: { url: './' }
    });
  } catch (_) {}
}
