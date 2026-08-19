// Edge Function: bắn web-push khi có nội dung mới cho nửa kia, hoặc khi máy chủ
// thấy một mục tới hạn.
//
// Ai gọi hàm này?
//   1. Trigger `ju_notify_push` trên bảng `justus_data` (supabase/migrations/
//      20260808120000_push_notify.sql + 20260819190000_push_notify_moi_muc.sql).
//      Trigger tự lọc PHẦN MỚI của từng mảng rồi mới POST sang đây.
//   2. `scripts/theo-doi-gia.py` — khi một món đang theo dõi hạ giá (kind 'price').
//   3. `scripts/nhac-toi-han.py` — chạy trên Mac mỗi sáng, tính mục tới hạn theo
//      lịch (kỷ niệm, mùng 1 · rằm, chu kỳ…) rồi gửi kind 'nhac'.
//
// Body nhận vào:
//   { couple_id: "...", kind: "notes", items: [{ id, by, ... }, ...] }
//
// ⛔ MỘT MỤC MỘT THÔNG BÁO (đổi 19/08/2026). Trước đó mọi mục cùng loại dùng
// chung `tag: ju-<kind>-<couple>`, mà web-push lấy tag làm khoá thay thế: thông
// báo sau ĐÈ LÊN thông báo trước, nên khay chỉ còn đúng một dòng gộp. Không lỗi
// nào phát ra — hàm vẫn trả sent=3 trong khi người dùng chỉ thấy 1. Nay tag mang
// id của mục, và chỉ gộp khi vượt NGUONG_GOP để khỏi dội thông báo.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type Item = Record<string, unknown>;

/** Vượt số này thì gộp thành một thông báo tóm tắt thay vì bắn từng mục. */
const NGUONG_GOP = 3;

const chu = (v: unknown, mac = '') => {
  const t = String(v ?? '').replace(/\s+/g, ' ').trim();
  return t || mac;
};
const cat = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const soNgay = (iso: unknown): number | null => {
  const s = chu(iso);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const a = new Date(s.slice(0, 10) + 'T00:00:00Z').getTime();
  const h = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.round((a - h) / 86400000);
};
const duoiNgay = (iso: unknown) => {
  const d = soNgay(iso);
  if (d === null) return '';
  if (d < 0) return ' — đã quá hạn';
  if (d === 0) return ' — hôm nay';
  return ' — còn ' + d + ' ngày';
};

type Spec = {
  /** 'nuaKia' = báo cho người còn lại trong cặp; 'caHai' = báo cả hai máy. */
  nhan: 'nuaKia' | 'caHai';
  /** Một mục → một thông báo. */
  moi: (it: Item) => { title: string; body: string };
  /** Nhiều mục quá thì gộp lại một dòng. */
  gop: (n: number, items: Item[]) => { title: string; body: string };
};

const KINDS: Record<string, Spec> = {
  // ── Nửa kia vừa thêm/gửi cái gì đó ────────────────────────────────────────
  notes: {
    nhan: 'nuaKia',
    moi: (it) => ({ title: '💌 Nửa kia vừa nhắn cho bạn', body: cat(chu(it.text, 'Mở app để xem nhé 💗'), 120) }),
    gop: (n) => ({ title: `💌 Nửa kia vừa nhắn ${n} lời nhắn`, body: 'Mở app để đọc nhé 💗' }),
  },
  checkins: {
    nhan: 'nuaKia',
    moi: (it) => ({
      title: '📸 Nửa kia vừa check-in quán mới',
      body: cat(chu(it.name, 'Mở app để xem nhé'), 120),
    }),
    gop: (n) => ({ title: `📸 Nửa kia vừa check-in ${n} quán mới`, body: 'Mở app để xem nhé' }),
  },
  events: {
    nhan: 'nuaKia',
    moi: (it) => ({
      title: '📅 Nửa kia vừa thêm sự kiện',
      body: cat(chu(it.title, 'Một sự kiện mới') + duoiNgay(it.date), 120),
    }),
    gop: (n) => ({ title: `📅 Nửa kia vừa thêm ${n} sự kiện`, body: 'Mở mục Sự kiện để xem' }),
  },
  dates: {
    nhan: 'nuaKia',
    moi: (it) => ({
      title: chu(it.icon, '🎂') + ' Nửa kia vừa thêm ngày nhớ',
      body: cat(chu(it.title, 'Một ngày cần nhớ'), 120),
    }),
    gop: (n) => ({ title: `🎂 Nửa kia vừa thêm ${n} ngày nhớ`, body: 'Mở mục Ngày nhớ để xem' }),
  },
  todos: {
    nhan: 'nuaKia',
    moi: (it) => ({
      title: '✅ Nửa kia vừa giao một việc',
      body: cat(chu(it.title, 'Một việc mới') + (it.due ? duoiNgay(it.due) : ''), 120),
    }),
    gop: (n) => ({ title: `✅ Nửa kia vừa thêm ${n} việc`, body: 'Mở mục Việc cần làm để xem' }),
  },
  shop: {
    nhan: 'nuaKia',
    moi: (it) => ({ title: '🛒 Nửa kia vừa thêm món cần mua', body: cat(chu(it.name, 'Một món mới'), 120) }),
    gop: (n) => ({ title: `🛒 Nửa kia vừa thêm ${n} món cần mua`, body: 'Mở danh sách đi chợ để xem' }),
  },
  expiry: {
    nhan: 'caHai',
    moi: (it) => ({ title: '⏳ Sắp hết hạn', body: cat(chu(it.name, 'Một món trong tủ') + duoiNgay(it.date), 120) }),
    gop: (n) => ({ title: `⏳ ${n} món sắp hết hạn`, body: 'Mở mục Hạn dùng để xem' }),
  },
  // ⛔ Tên giấy tờ đã mã hoá phía máy — CẤM đưa vào thân thông báo, vì push đi qua
  // máy chủ của Google/Apple. Chỉ nhắc chung, mở app mới thấy tên.
  docs: {
    nhan: 'caHai',
    moi: () => ({ title: '🗂️ Một giấy tờ sắp hết hạn', body: 'Mở mục Giấy tờ để xem là giấy nào' }),
    gop: (n) => ({ title: `🗂️ ${n} giấy tờ sắp hết hạn`, body: 'Mở mục Giấy tờ để xem' }),
  },
  intimacy: {
    nhan: 'nuaKia',
    moi: () => ({ title: '💗 Nửa kia vừa bật tín hiệu cho bạn 😏', body: 'Mở app để trả lời nhé' }),
    gop: (n) => ({ title: `💗 Nửa kia vừa bật tín hiệu ${n} lần 😏`, body: 'Mở app để trả lời nhé' }),
  },

  // ── Máy chủ tính, không do ai gửi ─────────────────────────────────────────
  // Săn giá: script theo-doi-gia.py gọi thẳng khi một món đang theo dõi hạ giá.
  price: {
    nhan: 'caHai',
    moi: (it) => ({ title: chu(it.title, '🏷️ Săn giá'), body: cat(chu(it.body, 'Mở app để xem giá mới nhé'), 160) }),
    gop: (n, items) => ({ title: `🏷️ ${n} món vừa hạ giá`, body: cat(chu(items[0]?.title), 160) }),
  },
  // Mục tới hạn theo lịch, do scripts/nhac-toi-han.py tính trên Mac mỗi sáng.
  // Mỗi item: { id, title, cat }.
  nhac: {
    nhan: 'caHai',
    moi: (it) => ({ title: chu(it.title, '🔔 Just Us'), body: chu(it.body, 'Mở app để xem chi tiết') }),
    gop: (n, items) => ({
      title: `🔔 Hôm nay có ${n} mục cần để ý`,
      body: cat(items.map((x) => chu(x.title)).filter(Boolean).slice(0, 3).join(' · '), 160),
    }),
  },
};

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:huyneo1101@gmail.com';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Khoá thay thế trong khay thông báo. Mục có id thì lấy id; không thì băm nội dung. */
const khoaMuc = (kind: string, it: Item, i: number) => {
  const id = chu(it.id) || chu(it.createdAt) || chu(it.title) || chu(it.name);
  return `ju-${kind}-${id ? id.slice(0, 60) : 'i' + i}`;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'thiếu VAPID_PUBLIC / VAPID_PRIVATE' }, 500);

  let p: { couple_id?: string; kind?: string; items?: Item[] };
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
  // Loại gửi cho cả hai không có người gửi nên gom vào một rổ chung.
  const theoNguoi = new Map<string, Item[]>();
  if (spec.nhan === 'caHai') {
    theoNguoi.set('*', items);
  } else {
    for (const it of items) {
      const who = it?.by === 'a' || it?.by === 'b' ? String(it.by) : null;
      if (!who) continue;
      theoNguoi.set(who, [...(theoNguoi.get(who) ?? []), it]);
    }
  }
  // Mục không mang `by` (việc cần làm, món cần mua… — app chưa ghi người tạo) thì
  // gửi CẢ HAI máy thay vì im lặng bỏ qua. Bản trước trả {sent:0} ở đây, đúng kiểu
  // hỏng về phía im: phía gọi thấy «ok» trong khi không ai nhận được gì.
  if (!theoNguoi.size) theoNguoi.set('*', items);

  const { data: subs, error } = await db
    .from('justus_push_subs')
    .select('endpoint,p256dh,auth,role')
    .eq('couple_id', coupleId);
  if (error) return json({ error: error.message }, 500);
  if (!subs?.length) return json({ ok: true, sent: 0, note: 'cặp này chưa máy nào đăng ký push' });

  let sent = 0;
  const stale: string[] = [];
  // Vì sao phải gom lỗi rồi trả về: trước đây push hỏng thì hàm vẫn trả {ok:true, sent:0}
  // và lỗi chỉ nằm trong log của Supabase, nên phía gọi thấy "gửi 0 máy" mà không có cách
  // nào biết là chưa ai đăng ký hay là subscription đã chết — đúng kiểu hỏng câm.
  const loi: string[] = [];

  for (const [nguoiGui, list] of theoNguoi) {
    // Người nhận: loại 'caHai' gửi mọi máy; còn lại gửi máy của người kia. Máy nào
    // chưa khai role thì vẫn nhận — dòng thiếu role là bản đăng ký đời cũ, bỏ qua
    // nó thì người dùng im lặng không nhận được gì.
    const nhan = nguoiGui === '*'
      ? subs
      : subs.filter((x) => !x.role || x.role === (nguoiGui === 'a' ? 'b' : 'a'));

    // Quá nhiều mục thì gộp một dòng, còn lại mỗi mục một thông báo có tag riêng.
    const goi = list.length > NGUONG_GOP
      ? [{ ...spec.gop(list.length, list), tag: `ju-${kind}-gop-${coupleId}` }]
      : list.map((it, i) => ({ ...spec.moi(it), tag: khoaMuc(kind, it, i) }));

    for (const s of nhan) {
      for (const g of goi) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: g.title, body: g.body, tag: g.tag, url: './' }),
          );
          sent++;
        } catch (e) {
          // 404/410 = máy đã gỡ app hoặc subscription hết hạn → dọn khỏi bảng.
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) { stale.push(s.endpoint); break; }
          console.error('push lỗi', code, String(e));
          loi.push(`${code ?? '?'}: ${String((e as Error)?.message || e).slice(0, 120)}`);
        }
      }
    }
  }

  if (stale.length) {
    await db.from('justus_push_subs').delete().in('endpoint', stale);
  }

  return json({ ok: true, sent, cleaned: stale.length, subs: subs.length, kinds: Object.keys(KINDS).length, loi });
});
