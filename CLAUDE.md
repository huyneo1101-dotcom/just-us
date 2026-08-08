# Just Us — Của riêng hai đứa (app riêng cho một cặp đôi/vợ chồng)

App tĩnh: UI + logic + CSS nằm trong `index.html` (~8290 dòng, ~710KB — vẫn RẤT LỚN), React 18 + Babel Standalone qua CDN, KHÔNG build step. Deploy tĩnh (GitHub Pages qua Actions + Netlify).

## Quy tắc làm việc với file này
- **KHÔNG đọc cả `index.html` (~710KB, ~8290 dòng)** — LUÔN grep định vị rồi Read cửa sổ nhỏ (xem skill `bigfile-nav`).
- Sửa nội dung đáng kể → **bump `CACHE` trong `sw.js`** (hiện: `justus-v25`; có thêm cache phụ `justus-noti`).
- Babel transpile trong trình duyệt: lỗi cú pháp = trắng màn hình. Kiểm tra Console sau khi sửa.

## Dữ liệu tĩnh tách rời (`data/*.json`)
Các mảng nội dung lớn KHÔNG còn nằm trong `index.html` — sửa nội dung thì sửa file JSON, đừng tìm trong `index.html`:

| File | Chứa |
|---|---|
| `data/suggest.json` | `IDEA_SUGGEST` `BUCKET_SUGGEST` `FOOD_SUGGEST` `GIFT_SUGGEST` `WATCH_SUGGEST` `COUPON_SUGGEST` `LOVEJAR_SUGGEST` `MEAL_SUGGEST` |
| `data/dishes.json` | `MENU_GOALS` `EASY_DISHES` `DISHES` (232 món) |
| `data/prompts.json` | `QUESTIONS` `QUIZ_Q` `CHALLENGES` `TALK_TOPICS` |
| `data/hanoi.json` | `HANOI_CATS` `HANOI_SPOTS` |

Cách hoạt động: một `<script>` ngay trước khối `text/babel` tạo `window.JUD` với mảng/object RỖNG rồi `fetch` các JSON và **đổ dữ liệu vào đúng chỗ cũ** (giữ nguyên identity, vì trong khối babel viết `const DISHES=JUD.DISHES;` chạy ngay lập tức). App chỉ vẽ sau khi dữ liệu về (tối đa chờ 5s rồi vẽ trước, dữ liệu về muộn thì vẽ lại).
- Thêm mảng dữ liệu mới → thêm khoá vào JSON **và** thêm placeholder rỗng đúng kiểu trong `window.JUD`.
- `sw.js` cache `data/*.json` + `fonts.css` theo kiểu **cache-first** → đổi nội dung JSON PHẢI bump `CACHE`.
- Font viết tay Patrick Hand (base64, ~47KB) nằm ở `fonts.css`, không còn trong `index.html`.

## App con: Tâm linh (`tam-linh/`)
Phần Tâm linh **đã tách khỏi `index.html`** thành app tĩnh độc lập trong thư mục `tam-linh/`
(`index.html` + `manifest.json` + `sw.js` + `icon.svg` + `data/spirit.json` riêng, cài được như PWA riêng):
ngày lễ âm lịch · kinh Phật · văn khấn · tử vi · thần số · quán chay · mâm cỗ giỗ/Tết.

- Vào từ Just Us: tab **Cá nhân → 🪷 Tâm linh → "Mở app Tâm linh →"** (`href="tam-linh/"`).
- **Cùng origin** với Just Us → dùng chung `localStorage`, nên `ju.tuvi` / `ju.thanso` đã lưu vẫn còn.
  Hai khoá này vẫn nằm trong `SYNC_KEYS` của Just Us nên vẫn đồng bộ 2 máy qua Supabase như cũ.
- Cache riêng `tamlinh-v1`. **Hai service worker dùng chung origin**: mỗi `sw.js` chỉ được xoá cache có
  tiền tố của chính nó (`justus-*` / `tamlinh-*`), nếu không sẽ xoá cache của app kia.
- Deploy: Pages và Netlify đều publish cả thư mục nên `tam-linh/` tự lên, không cần sửa CI.

**Vẫn nằm trong `index.html` (KHÔNG tách):** thuật toán âm lịch (`lunar2Solar`, `lunarISO`, `solar2Lunar`,
`nextTetISO`, `holidaysForYear`, `SPIRIT_FESTIVALS`, `upcomingSpiritual`) vì còn dùng cho ngày giỗ/Tết ở
`ImportantDates`, dấu ngày lễ ở `MiniCalendar`, nhắc việc ở `Reminders` và thông báo nhóm `tamLinh`.
App `tam-linh/` giữ **bản sao** các hàm này.

## Dữ liệu (localStorage, tiền tố `ju.`)
| Khoá | Ý nghĩa | Kiểu |
|---|---|---|
| `ju.setup` | Cấu hình cặp đôi (tên 2 người, avatar, tab mặc định) | object |
| `ju.couple` | Thông tin pair Supabase đang ghép | object |
| `ju.me` | Vai của thiết bị này trong cặp (`a`/`b`) | string |
| `ju.notes` | Lời nhắn giữa hai người (love notes) | array |
| `ju.events` / `ju.dates` / `ju.timeline` | Sự kiện · ngày nhớ · dòng thời gian kỷ niệm | array |
| `ju.wish` / `ju.bucket` / `ju.watch` / `ju.coupons` | Quà · muốn làm cùng · xem·đọc·nghe · phiếu yêu thương | array |
| `ju.ideas` / `ju.food` / `ju.checkins` | Ý tưởng hẹn hò · quán & món · check-in ảnh | array |
| ↳ mục của `ju.food` / `ju.checkins` | nhiều ảnh ở `photos[]` + ảnh menu ở `menuPhotos[]` (khoá cũ 1 ảnh `photo` vẫn đọc được qua helper `photoList()`, tự gộp khi sửa) | array |
| `ju.child*` (diary, growth, milestones, vaccines…) | Nhóm dữ liệu "Nuôi con / Sóc" | array/object |
| `ju.routine` | Lịch sinh hoạt để nhắc trong ngày | array |
| `ju.diary` / `ju.mood` / `ju.checkin(s)` | Nhật ký · cảm xúc · weekly check-in | array |
| `ju.docs` | Giấy tờ — **mã hoá đầu-cuối**: mỗi mục chỉ để thô `id` + `expiry`, phần còn lại (tên, số hiệu, loại, nơi cất, ghi chú, ảnh) nằm trong `enc` (AES-256-GCM base64) | array |
| `ju.docsLock` | Cấu hình mã hoá mục Giấy tờ: `{v,salt,iter,check}` — **không** phải bí mật nên đồng bộ được; khoá thật chỉ sống trong RAM (`DocsCrypto.key`) | object |
| `ju.usNav` | Nhóm + mục đang mở ở tab Nhà mình (riêng từng máy, KHÔNG trong `SYNC_KEYS`) | object |

*(chỉ các khoá chính — còn nhiều khoá `ju.*` khác cho từng mục nhỏ)*

- **Mục Giấy tờ mã hoá đầu-cuối** (`DocsCrypto` ~6300, `DocsLock` + `DocsVault` ~6371): PBKDF2-SHA256 210k vòng → AES-256-GCM. Ảnh nén rồi mã hoá **trước khi** upload, lưu dạng `{epath}` và tải về bằng `Cloud.downloadBytes` (không sinh link). Mất mật khẩu là mất dữ liệu — không có cửa sau. Đổi `DOCS_ITER`/`DOCS_MAGIC` = làm hỏng dữ liệu cũ.

- Đồng bộ Supabase: **có** — **ghép cặp bằng mã mời** (RLS giới hạn dữ liệu cho đúng 2 tài khoản trong pair). Object `Cloud` (dòng ~318) dùng RPC `ju_create_couple` / `ju_join_couple(p_code)` / `ju_my_couple` / `ju_leave_couple`; toàn bộ state ghi 1 hàng vào bảng `justus_data` theo `couple_id`, realtime qua `postgres_changes`, ảnh lưu ở storage bucket `justus-photos`. Xem skill `supabase-sync` (pattern B). Migration: skill `local-store`.

## Bản đồ component chính
- `App` — dòng ~7855; 6 tab dưới (`MAIN_TABS`, dòng 7854): 🏠 Tổ ấm (`home`) · 🐿️ Sóc (`child`, nuôi con) · 🗺️ Hẹn hò (`date`) · 📅 Tụi mình (`us`) · 💬 Nói chuyện (`talk`) · 💞 Hồ sơ (`me`).
- `Cloud` (~318) — lớp Supabase. `MENU_REGISTRY` (~5645) — cấu hình sub-tab/segment của từng màn. Nhiều component con: `Home`, `DateTab`, `UsTab`, `TalkTab`, `Profile`, `ChildCare`, `LoveJar`, `DailyQuestion`, `WeeklyCheckin`, `CheckIns`, `Timeline`, `Coupons`, `WishTab`, `HanoiCatalog`, `Reminders`…

## PWA / Thông báo
- Service worker + manifest đầy đủ (`manifest.json`, `sw.js`, icon SVG).
- **Có thông báo đẩy + digest hằng ngày**: `sw.js` xử lý `push` (VAPID, hỗ trợ backend web-push) và `periodicsync` tag `ju-daily` → `showDailyDigest()` đọc cache `/__digest`. `index.html` (~5222+) xin quyền `Notification`, đăng ký `pushManager.subscribe`, lưu subscription vào bảng `justus_push_subs`, đăng ký `periodicSync('ju-daily')`, và nhắc lịch `ju.routine` trong ngày. Xem skill `web-push`.

## Thư viện (đã pin version, qua cdn.jsdelivr.net)
- `react@18.2.0` + `react-dom@18.2.0` (production UMD)
- `@babel/standalone@7.23.6`
- `@supabase/supabase-js@2.39.7`
- Leaflet (bản đồ) — dùng cho gợi ý địa điểm Hà Nội / check-in.

## Deploy
- **GitHub Pages** qua Actions: `.github/workflows/deploy-pages.yml` (push `main` → upload toàn bộ thư mục → `deploy-pages`).
- **Netlify** qua `netlify.toml` (`publish = "."`, không build, kèm vài security header).

## Quy tắc phát hành (chủ repo đã cho phép — 2026-08-01)
- **Tự động merge vào `main`, KHÔNG cần hỏi lại.** Sau khi hoàn tất một thay đổi trên nhánh phát triển: mở PR rồi merge luôn vào `main` (hoặc merge thẳng) để deploy — chủ repo đã đồng ý đứng ra chịu trách nhiệm cho app riêng của hai vợ chồng.
- **Trước khi merge PHẢI:** kiểm cú pháp (transpile Babel khối `text/babel`, xem skill `bigfile-nav`/`smoke-test`) để tránh trắng màn hình; và **bump `CACHE` trong `sw.js`** nếu có sửa nội dung.
- Mỗi thay đổi lớn = 1 commit rõ ràng; nếu PR của nhánh đã merge thì coi việc tiếp theo là thay đổi mới (restart nhánh từ `main`).
- Deploy xong nhắc chủ repo **đóng hẳn app rồi mở lại** để service worker nhận bản mới.

## Skills dùng chung
Repo có `.claude/skills/` (13 skill từ plugin vibe-pwa-kit): `bigfile-nav`, `data-backup`, `deploy-static`, `doc-single-file-app`, `local-store`, `lock-static-app`, `pwa-healthcheck`, `scaffold-vibe-pwa`, `smoke-test`, `supabase-security-audit`, `supabase-sync`, `theme-pack`, `web-push`.
