# Just Us — Của riêng hai đứa (app riêng cho một cặp đôi/vợ chồng)

App tĩnh một-file: UI + logic + CSS đều nằm trong `index.html` (~7977 dòng, ~1.1MB — RẤT LỚN), React 18 + Babel Standalone qua CDN, KHÔNG build step. Deploy tĩnh (GitHub Pages qua Actions + Netlify).

## Quy tắc làm việc với file này
- **KHÔNG đọc cả `index.html` (~1.1MB, ~7977 dòng)** — đây là file to nhất trong họ app, LUÔN grep định vị rồi Read cửa sổ nhỏ (xem skill `bigfile-nav`).
- Sửa nội dung đáng kể → **bump `CACHE` trong `sw.js`** (hiện: `justus-v3`; có thêm cache phụ `justus-noti`).
- Babel transpile trong trình duyệt: lỗi cú pháp = trắng màn hình. Kiểm tra Console sau khi sửa.

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
| `ju.child*` (diary, growth, milestones, vaccines…) | Nhóm dữ liệu "Nuôi con / Sóc" | array/object |
| `ju.routine` | Lịch sinh hoạt để nhắc trong ngày | array |
| `ju.diary` / `ju.mood` / `ju.checkin(s)` | Nhật ký · cảm xúc · weekly check-in | array |

*(chỉ các khoá chính — còn nhiều khoá `ju.*` khác cho từng mục nhỏ)*

- Đồng bộ Supabase: **có** — **ghép cặp bằng mã mời** (RLS giới hạn dữ liệu cho đúng 2 tài khoản trong pair). Object `Cloud` (dòng ~318) dùng RPC `ju_create_couple` / `ju_join_couple(p_code)` / `ju_my_couple` / `ju_leave_couple`; toàn bộ state ghi 1 hàng vào bảng `justus_data` theo `couple_id`, realtime qua `postgres_changes`, ảnh lưu ở storage bucket `justus-photos`. Xem skill `supabase-sync` (pattern B). Migration: skill `local-store`.

## Bản đồ component chính
- `App` — dòng ~7855; 6 tab dưới (`MAIN_TABS`, dòng 7854): 🏠 Tổ ấm (`home`) · 🐿️ Sóc (`child`, nuôi con) · 🗺️ Hẹn hò (`date`) · 📅 Tụi mình (`us`) · 💬 Nói chuyện (`talk`) · 💞 Hồ sơ (`me`).
- `ChildCare` (~5090) — tab 🐿️ Sóc. **Sắp theo Ý ĐỊNH người dùng, không theo lĩnh vực** (Huy chốt 09/08/2026), 05 sub-tab: 🏠 Hôm nay (`today`, thẻ động: con đang ốm · mũi tiêm đến hạn · ghi nhanh · mốc chưa đạt · trò chơi hôm nay · đếm ngược đi lớp) · 📈 Theo dõi (`track`, mọi thứ GHI VÀO) · 📚 Cẩm nang (`guide`, đọc lúc rảnh, có ô tìm không dấu qua `GUIDE_KEYS`) · 🆘 Gỡ rối (`sos`, tra lúc đang có chuyện — `CHILD_SOS` sơ cứu + `CHILD_ISSUES`) · 🧒 Hồ sơ bé (`profile`). **04 nguyên tắc phải giữ khi thêm mục:** mỗi cấp một trục phân loại · tối đa 04-05 tab · sâu tối đa 03 tầng · một nội dung một chỗ. Đổi danh sách sub-tab thì **phải sửa cả `MENU_REGISTRY` mục `child`**, nếu không màn sắp xếp menu sẽ lệch.
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

## Skills dùng chung
Repo có `.claude/skills/` (11 skill từ plugin vibe-pwa-kit): `bigfile-nav`, `data-backup`, `deploy-static`, `doc-single-file-app`, `local-store`, `lock-static-app`, `pwa-healthcheck`, `scaffold-vibe-pwa`, `supabase-sync`, `theme-pack`, `web-push`.
