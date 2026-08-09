# Just Us — Của riêng hai đứa (app riêng cho một cặp đôi/vợ chồng)

App tĩnh: UI + logic + CSS nằm trong `index.html` (~7810 dòng, ~676KB — vẫn RẤT LỚN), React 18 + Babel Standalone qua CDN, KHÔNG build step. Deploy tĩnh (GitHub Pages qua Actions + Netlify).

## Quy tắc làm việc với file này
- **KHÔNG đọc cả `index.html` (~676KB, ~7810 dòng)** — LUÔN grep định vị rồi Read cửa sổ nhỏ (xem skill `bigfile-nav`).
- Sửa nội dung đáng kể → **bump `CACHE` trong `sw.js`** (hiện: `justus-v37`; có thêm cache phụ `justus-noti`).
- Babel transpile trong trình duyệt: lỗi cú pháp = trắng màn hình. Kiểm tra Console sau khi sửa.

## Dữ liệu tĩnh tách rời (`data/*.json`)
Các mảng nội dung lớn KHÔNG còn nằm trong `index.html` — sửa nội dung thì sửa file JSON, đừng tìm trong `index.html`:

| File | Chứa |
|---|---|
| `data/suggest.json` | `IDEA_SUGGEST` `BUCKET_SUGGEST` `FOOD_SUGGEST` `GIFT_SUGGEST` `WATCH_SUGGEST` `COUPON_SUGGEST` `LOVEJAR_SUGGEST` `MEAL_SUGGEST` |
| `data/dishes.json` | `MENU_GOALS` `EASY_DISHES` `DISHES` (232 món) |
| `data/prompts.json` | `QUESTIONS` `QUIZ_Q` `CHALLENGES` `TALK_TOPICS` |
| `data/hanoi.json` | `HANOI_CATS` `HANOI_SPOTS` |
| `data/child.json` | **CHỈ app Sóc (`soc/`) nạp file này — `index.html` KHÔNG còn nạp** (2026-08-09). 62 khoá nội dung nuôi con — nhóm gốc (`CHILD_VACCINES` `CHILD_MILESTONES` `CHILD_TIPS` `CHILD_PACK` `CHILD_SKILLS` `PLAY_LIB` `WEAN_MENU` `PARENTING_QS` `ILL_SYMPTOMS` `KIDS_CAFES` `SKILL_GUIDES` `CHILD_ISSUES`) + nhóm đợt 1 (`EMERGENCY` `RED_FLAGS` `DANGER_ITEMS` `HOME_SAFETY` `CONTACT_SUGGEST` `TANTRUM_SCRIPTS` `CHILD_BEHAVIOR` `CHORES_2Y` `SELF_CORNER` `DRESS_TEMP` `DRESS_RULES` `SEASON_ILL` `SCARY_TASKS` `WEEKEND_PLANS` `CHILD_DOCS` + 3 **object** `POST_VACCINE` `CONSTIPATION` `SCREEN_GUIDE`) + nhóm đợt 2 (`POTTY_READY` `POTTY_TIMES` `POTTY_FIX` + 2 **object** `WHO_WEIGHT` `WHO_HEIGHT`) + nhóm đợt 3 (`SCHOOL_START` `SCHOOL_ILL` `TEACHER_NOTE` `TRIP_PACK` `TRIP_TIPS` `DUTY_SLOTS` + 3 **object** `SCHOOL_PICK` `TWOS_CRISIS` `PARENT_BURNOUT`) + nhóm bổ sung (`SLEEP_NEED` `SLEEP_ROUTINE` `SLEEP_FIX` `TEETH_ORDER` `CHECKUP_SCHEDULE` `DEV_REDFLAGS` + object `TEETH_CARE`) + nhóm đợt 4 (`SLEEP_MORE` `POTTY_PREP` `POTTY_STEPS` `MONTESSORI_PRINCIPLES` `MONTESSORI_ACT` `MONTESSORI_MAT` `STEAM_PRINCIPLES` `STEAM_ACT` + object `STEAM_LABEL`) + nhóm đợt 5 (`DAY_EVENTS` `DAY_GROUPS`) |

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

## App Sóc — ĐÃ TÁCH HẲN, không còn trong repo này

App nuôi con nay là **repo riêng `/Users/Huy/Claude/App/Soc`**, chạy ở
<https://soc-eiv.pages.dev> (Cloudflare Pages). Luật của nó nằm ở `App/Soc/CLAUDE.md`.

- **Thư mục `soc/` đã gỡ khỏi repo này tối 09/08/2026**, sau khi 12 mảng bản cũ có mà bản
  mới chưa có đều đã bù xong. Cần đọc lại mã cũ thì `git show 7bac245:soc/index.html`, hoặc
  bản sao ở `~/.Trash/soc-ban-cu-trong-JustUs-2026-08-09/`.
- `data/child.json` **không còn ai nạp** — `index.html` bỏ nạp từ 09/08, bản Sóc mới nhúng
  thẳng dữ liệu vào file. Giữ lại file để tra nội dung gốc, sửa nó không làm đổi app nào.
- Vào app Sóc: tab **Cá nhân → 📱 App của nhà mình → 🐿️ Sóc**, mở tab ngoài sang tên miền
  riêng. Hằng `APP_BOARD` giữ đường dẫn đó; đổi tên miền thì sửa cả `App/BangApp/apps.json`.
- **Khác origin nên KHÔNG còn chung `localStorage`.** Mọi khoá `ju.child*` của máy nào ở lại
  máy đó; chuyển sang app mới bằng mục "📥 Chuyển dữ liệu từ Just Us" trong ⚙️ Cài đặt của
  Sóc (xuất file sao lưu bên này rồi nhập bên kia).
- Ảnh của bé vẫn dùng chung bucket `justus-photos` và vẫn cần phiên Supabase đã ghép cặp
  của Just Us — đây là chỗ duy nhất hai app còn dính nhau.

**Vẫn nằm trong `index.html` (KHÔNG tách):** những chỗ nói về con nhưng là việc của HAI VỢ
CHỒNG, không phải app nuôi con — mục Sức khỏe gia đình (thành viên `child`, đọc `ju.child`
lấy tên), chế độ nấu ăn "🐿️ Đang trông Sóc", `DEFAULT_ROUTINE` / lịch sinh hoạt trong ngày,
chi tiêu ví `m_soc` lấy từ VíNhà, và nhóm câu đố "👶 Nuôi con" trong `KnowledgeQuiz`.

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
| `ju.child*` (diary, growth, milestones, vaccines…) | Nhóm dữ liệu "Nuôi con / Sóc" — nay do **app `soc/`** ghi (Just Us chỉ đọc `ju.child`) | array/object |
| ↳ `ju.childContacts` / `ju.childSafety` / `ju.childDocs` | Danh bạ khẩn · checklist chống trẻ trong nhà · checklist giấy tờ của bé (đợt 1) | array/object |
| ↳ `ju.childPotty` / `ju.childNoti` | Tập bô (`{start,ready,log}`) · bật/tắt nhắc việc (đợt 2). Dấu vết đã báo nằm ở `ju.childNotiSeen` — **riêng từng máy, KHÔNG đồng bộ** | object |
| ↳ đợt 3 | `ju.childSchools` (trường đã xem) · `ju.childTeacherNote` · `ju.childTripPack` · `ju.childDuty` · `ju.childOneLine` · `ju.childQuotes` · `ju.childLetters` · `ju.childPhotos` (chỉ lưu **đường dẫn** ảnh trên storage, KHÔNG lưu base64) | array/object |
| `ju.routine` | Lịch sinh hoạt để nhắc trong ngày | array |
| `ju.diary` / `ju.mood` / `ju.checkin(s)` | Nhật ký · cảm xúc · weekly check-in | array |
| `ju.docs` | Giấy tờ — **mã hoá đầu-cuối**: mỗi mục chỉ để thô `id` + `expiry`, phần còn lại (tên, số hiệu, loại, nơi cất, ghi chú, ảnh) nằm trong `enc` (AES-256-GCM base64) | array |
| `ju.docsLock` | Cấu hình mã hoá mục Giấy tờ: `{v,salt,iter,check}` — **không** phải bí mật nên đồng bộ được; khoá thật chỉ sống trong RAM (`DocsCrypto.key`) | object |
| `ju.usNav` | Nhóm + mục đang mở ở tab Nhà mình (riêng từng máy, KHÔNG trong `SYNC_KEYS`) | object |

*(chỉ các khoá chính — còn nhiều khoá `ju.*` khác cho từng mục nhỏ)*

- **Mục Giấy tờ mã hoá đầu-cuối** (`DocsCrypto` ~6300, `DocsLock` + `DocsVault` ~6371): PBKDF2-SHA256 210k vòng → AES-256-GCM. Ảnh nén rồi mã hoá **trước khi** upload, lưu dạng `{epath}` và tải về bằng `Cloud.downloadBytes` (không sinh link). Mất mật khẩu là mất dữ liệu — không có cửa sau. Đổi `DOCS_ITER`/`DOCS_MAGIC` = làm hỏng dữ liệu cũ.

- Đồng bộ Supabase: **có** — **ghép cặp bằng mã mời** (RLS giới hạn dữ liệu cho đúng 2 tài khoản trong pair). Object `Cloud` (dòng ~318) dùng RPC `ju_create_couple` / `ju_join_couple(p_code)` / `ju_my_couple` / `ju_leave_couple`; toàn bộ state ghi 1 hàng vào bảng `justus_data` theo `couple_id`, realtime qua `postgres_changes`, ảnh lưu ở storage bucket `justus-photos`. Xem skill `supabase-sync` (pattern B). Migration: skill `local-store`.

## Bản đồ component chính
- `App` — 5 tab dưới (`MAIN_TABS`): 🏠 Tổ ấm (`home`) · 🏡 Nhà mình (`us`) · 💞 Chúng mình (`talk`) · 🗺️ Hẹn hò (`date`) · 🙋 Cá nhân (`me`). Tab 🐿️ Sóc đã gỡ.
- `Cloud` (~452) — lớp Supabase. `MENU_REGISTRY` (~5145) — cấu hình sub-tab/segment của từng màn. Nhiều component con: `Home`, `DateTab`, `UsTab`, `TalkTab`, `Profile`, `AppBoard`, `LoveJar`, `DailyQuestion`, `WeeklyCheckin`, `CheckIns`, `Timeline`, `Coupons`, `WishTab`, `HanoiCatalog`, `Reminders`…

## PWA / Thông báo
- Service worker + manifest đầy đủ (`manifest.json`, `sw.js`, icon SVG).
- **Có thông báo đẩy + digest hằng ngày**: `sw.js` xử lý `push` (VAPID) và `periodicsync` tag `ju-daily` → `showDailyDigest()` đọc cache `/__digest`. `index.html` (~5189+) xin quyền `Notification`, đăng ký `pushManager.subscribe`, lưu subscription vào bảng `justus_push_subs`, đăng ký `periodicSync('ju-daily')`, và nhắc lịch `ju.routine` trong ngày. Xem skill `web-push`.
- **Hai đường thông báo, đừng lẫn:**
  1. `NotiRunner` (~5243) — `computeDueNotis()` + `showNotification`, **chỉ chạy khi app đang mở**
     (`setInterval` 15 phút + `visibilitychange`). Đây là toàn bộ thông báo "trong app".
  2. **web-push khi app đóng** — cần **server** giữ VAPID private key. Nằm ở
     `supabase/functions/push-notify/` + trigger `ju_notify_push` trên `justus_data`
     (`supabase/migrations/20260808120000_push_notify.sql`). Trigger lọc lời nhắn mới ngay
     trong SQL rồi mới gọi function, nên payload nhỏ. Hướng dẫn deploy: **`docs/push-setup.md`**.
  - Đổi `VAPID_PUBLIC` = mọi subscription cũ chết; `subscribePush()` đã tự huỷ và đăng ký lại.
  - `justus_push_subs` khoá chính là `endpoint`; function tự xoá dòng khi push trả 404/410.

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

## Chế độ huấn luyện prompt (bật — 2026-08-08)
Chủ repo muốn được **rèn cách đặt câu hỏi / cách prompt / cách dùng từ** trong lúc làm việc.
Vì vậy, sau MỖI câu trả lời cho một yêu cầu của chủ repo (trừ khi được bảo tắt), thêm ở CUỐI một khối ngắn:

```
📝 Prompt vừa rồi: <n>/5
Thiếu: <mảnh còn thiếu, ≤1 dòng>
Viết lại: "<bản prompt tốt hơn, copy dùng được ngay>"
```

- Chấm theo 5 mảnh: **Neo** (chỗ nào trong app/file) · **Mục tiêu** (kết quả muốn, không phải cách làm) ·
  **Ràng buộc** (cấm gì / giữ gì) · **Tiêu chí xong** (làm sao biết là xong) · **Chế độ** (trả lời thôi / kế hoạch trước / làm luôn).
- Ngắn gọn, không giảng đạo, không lặp lại lý thuyết. Nếu prompt đã 5/5 thì chỉ ghi `📝 Prompt vừa rồi: 5/5 — ổn.`
- **Việc chính vẫn phải làm đầy đủ trước**; khối chấm điểm chỉ là phần phụ ở cuối, không thay thế công việc.
- Không chấm khi: chủ repo nói "tắt chấm prompt", hoặc lượt đó chỉ là trò chuyện/xác nhận ngắn.
  Nói "chấm gắt vào" → khắt khe hơn, soi cả từ mơ hồ. Nói "bật lại" → bật lại.
- Giáo trình đầy đủ (bảng từ mơ hồ → từ chính xác, các mẫu prompt) ở **`docs/prompt-guide.md`** — đọc file đó khi cần trích dẫn, đừng chép vào đây.

## Skills dùng chung
Repo có `.claude/skills/` (13 skill từ plugin vibe-pwa-kit): `bigfile-nav`, `data-backup`, `deploy-static`, `doc-single-file-app`, `local-store`, `lock-static-app`, `pwa-healthcheck`, `scaffold-vibe-pwa`, `smoke-test`, `supabase-security-audit`, `supabase-sync`, `theme-pack`, `web-push`.
