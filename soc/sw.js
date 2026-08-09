/* Service worker cho app Sóc (nuôi con) — cùng nếp với sw.js của Just Us.
   - index.html & file cùng origin: NETWORK-FIRST (có mạng thì luôn lấy bản mới, mất mạng thì rơi về cache).
   - data/*.json + fonts.css + thư viện CDN: CACHE-FIRST → đổi nội dung JSON thì PHẢI bump CACHE.
   Lưu ý: app này đọc ../data/child.json và ../fonts.css (dùng chung với Just Us). Phạm vi (scope)
   của service worker chỉ giới hạn TRANG nào do nó điều khiển, còn request thì nó chặn được cả
   đường dẫn ngoài thư mục — nên hai file trên vẫn vào cache 'soc-*' của app này.
*/
const CACHE = 'soc-v7';
const CDN = ['https://cdn.jsdelivr.net'];

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    // CHỈ dọn cache 'soc-*': Just Us ('justus-*') và Tâm linh ('tamlinh-*') dùng chung origin.
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('soc-') && k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Supabase (REST/Auth/Realtime): luôn ra mạng
  if (url.hostname.endsWith('supabase.co')) return;

  // Thư viện CDN cố định theo version + dữ liệu tĩnh + font: cache-first
  const isData = url.origin === location.origin && (url.pathname.includes('/data/') || url.pathname.endsWith('fonts.css'));
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

/* Bấm vào thông báo nhắc việc (do trang gọi showNotification khi app đang mở)
   → đưa app Sóc lên trước thay vì mở thêm một cửa sổ mới. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) { if (c.url.indexOf('/soc') >= 0 && 'focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
