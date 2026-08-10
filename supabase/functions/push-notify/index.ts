// Edge Function: bắn web-push khi nửa kia có nội dung mới.
//
// Ai gọi hàm này? Trigger `ju_notify_push` trên bảng `justus_data` (xem
// supabase/migrations/20260808120000_push_notify.sql). Trigger đã tự lọc ra
// PHẦN MỚI rồi mới POST sang đây, nên payload luôn nhỏ.
//
// Body nhận vào:
//   { couple_id: "...", kind: "notes", items: [{ id, by, text, createdAt }, ...] }
//
// Việc của hàm: gom item theo người gửi ('a' | 'b'), rồi đẩy thông báo tới các
// subscription của NGƯỜI CÒN LẠI trong cùng cặp.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Mỗi loại nội dung một dòng — muốn nhắc thêm mục nào (vd 'checkins') thì thêm
// ở đây VÀ thêm đúng tên khoá đó trong file migration.
const KINDS: Record<string, {
  title: (n: number, items: Item[]) => string;
  body: (items: Item[]) => string;
  /** true = gửi cho CẢ HAI máy trong cặp, không phải "báo cho người còn lại". */
  moiNguoi?: boolean;
}> = {
  // Săn giá: script theo-doi-gia.py gọi thẳng hàm này khi một món đang theo dõi hạ giá.
  // Tin này không do ai trong hai người gửi, nên phải tới cả hai máy — vì thế moiNguoi.
  price: {
    moiNguoi: true,
    title: (_n, items) => String(items[items.length - 1]?.title || '🏷️ Săn giá'),
    body: (items) => {
      const t = String(items[items.length - 1]?.body || '').replace(/\s+/g, ' ').trim();
      return t.length > 160 ? t.slice(0, 157) + '…' : t || 'Mở app để xem giá mới nhé';
    },
  },
  notes: {
    title: (n) => (n === 1 ? '💌 Nửa kia vừa nhắn cho bạn' : `💌 Nửa kia vừa nhắn ${n} lời nhắn`),
    // Chỉ lấy lời nhắn mới nhất làm nội dung, cắt ngắn cho vừa khay thông báo.
    body: (items) => {
      const last = items[items.length - 1];
      const t = String(last?.text || '').replace(/\s+/g, ' ').trim();
      return t.length > 120 ? t.slice(0, 117) + '…' : t || 'Mở app để xem nhé 💗';
    },
  },
};

type Item = { id?: string; by?: string; text?: string; createdAt?: number; title?: string; body?: string };
type Payload = { couple_id?: string; kind?: string; items?: Item[] };

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:huyneo1101@gmail.com';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'thiếu VAPID_PUBLIC / VAPID_PRIVATE' }, 500);

  let p: Payload;
  try { p = await req.json(); } catch { return json({ error: 'body không phải JSON' }, 400); }

  const coupleId = p.couple_id;
  const kind = p.kind || 'notes';
  const items = Array.isArray(p.items) ? p.items : [];
  const spec = KINDS[kind];
  if (!coupleId || !spec) return json({ error: 'thiếu couple_id hoặc kind lạ' }, 400);
  if (!items.length) return json({ ok: true, sent: 0, note: 'không có gì mới' });

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  // SUPABASE_URL + SERVICE_ROLE_KEY được Supabase tự cấp cho Edge Function.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Gom theo người gửi: người gửi là 'a' thì phải báo cho 'b', và ngược lại.
  // Loại tin gửi cho cả hai (vd 'price') không có người gửi nên gom vào một rổ chung.
  const bySender = new Map<string, Item[]>();
  if (spec.moiNguoi) {
    bySender.set('*', items);
  } else {
    for (const it of items) {
      const who = it?.by === 'a' || it?.by === 'b' ? it.by : null;
      if (!who) continue;
      bySender.set(who, [...(bySender.get(who) ?? []), it]);
    }
  }
  if (!bySender.size) return json({ ok: true, sent: 0, note: 'không xác định được người gửi' });

  const { data: subs, error } = await db
    .from('justus_push_subs')
    .select('endpoint,p256dh,auth,role')
    .eq('couple_id', coupleId);
  if (error) return json({ error: error.message }, 500);
  if (!subs?.length) return json({ ok: true, sent: 0, note: 'cặp này chưa máy nào đăng ký push' });

  let sent = 0;
  const stale: string[] = [];

  for (const [sender, list] of bySender) {
    const payload = JSON.stringify({
      title: spec.title(list.length, list),
      body: spec.body(list),
      tag: `ju-${kind}-${coupleId}`,
      url: './',
    });
    const nhan = sender === '*' ? subs : subs.filter((x) => x.role === (sender === 'a' ? 'b' : 'a'));

    for (const s of nhan) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        // 404/410 = máy đã gỡ app hoặc subscription hết hạn → dọn khỏi bảng.
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
        else console.error('push lỗi', code, String(e));
      }
    }
  }

  if (stale.length) {
    await db.from('justus_push_subs').delete().in('endpoint', stale);
  }

  return json({ ok: true, sent, cleaned: stale.length });
});
