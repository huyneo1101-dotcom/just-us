# Just Us — Của riêng hai đứa (app riêng cho một cặp đôi/vợ chồng)

App tĩnh: UI + logic + CSS nằm trong `index.html` (~7810 dòng, ~676KB — vẫn RẤT LỚN), React 18 + Babel Standalone qua CDN, KHÔNG build step. Deploy tĩnh (GitHub Pages qua Actions + Netlify).

## Quy tắc làm việc với file này
- **KHÔNG đọc cả `index.html` (~676KB, ~7810 dòng)** — LUÔN grep định vị rồi Read cửa sổ nhỏ (xem skill `bigfile-nav`).
- Sửa nội dung đáng kể → **bump `CACHE` trong `sw.js`** (hiện: `justus-v34`; có thêm cache phụ `justus-noti`).
- Babel transpile trong trình duyệt: lỗi cú pháp = trắng màn hình. Kiểm tra Console sau khi sửa.

## Dữ liệu tĩnh tách rời (`data/*.json`)
Các mảng nội dung lớn KHÔNG còn nằm trong `index.html` — sửa nội dung thì sửa file JSON, đừng tìm trong `index.html`:

| File | Chứa |
|---|---|
| `data/suggest.json` | `IDEA_SUGGEST` `BUCKET_SUGGEST` `FOOD_SUGGEST` `GIFT_SUGGEST` `WATCH_SUGGEST` `COUPON_SUGGEST` `LOVEJAR_SUGGEST` `MEAL_SUGGEST` |
| `data/dishes.json` | `MENU_GOALS` `EASY_DISHES` `DISHES` (232 món) |
| `data/prompts.json` | `QUESTIONS` `QUIZ_Q` `CHALLENGES` `TALK_TOPICS` |
| `data/hanoi.json` | `HANOI_CATS` `HANOI_SPOTS` |
| `data/child.json` | 60 khoá nội dung nuôi con — nhóm gốc (`CHILD_VACCINES` `CHILD_MILESTONES` `CHILD_TIPS` `CHILD_PACK` `CHILD_SKILLS` `PLAY_LIB` `WEAN_MENU` `PARENTING_QS` `ILL_SYMPTOMS` `KIDS_CAFES` `SKILL_GUIDES` `CHILD_ISSUES`) + nhóm đợt 1 (`EMERGENCY` `RED_FLAGS` `DANGER_ITEMS` `HOME_SAFETY` `CONTACT_SUGGEST` `TANTRUM_SCRIPTS` `CHILD_BEHAVIOR` `CHORES_2Y` `SELF_CORNER` `DRESS_TEMP` `DRESS_RULES` `SEASON_ILL` `SCARY_TASKS` `WEEKEND_PLANS` `CHILD_DOCS` + 3 **object** `POST_VACCINE` `CONSTIPATION` `SCREEN_GUIDE`) + nhóm đợt 2 (`POTTY_READY` `POTTY_TIMES` `POTTY_FIX` + 2 **object** `WHO_WEIGHT` `WHO_HEIGHT`) + nhóm đợt 3 (`SCHOOL_START` `SCHOOL_ILL` `TEACHER_NOTE` `TRIP_PACK` `TRIP_TIPS` `DUTY_SLOTS` + 3 **object** `SCHOOL_PICK` `TWOS_CRISIS` `PARENT_BURNOUT`) + nhóm bổ sung (`SLEEP_NEED` `SLEEP_ROUTINE` `SLEEP_FIX` `TEETH_ORDER` `CHECKUP_SCHEDULE` `DEV_REDFLAGS` + object `TEETH_CARE`) + nhóm đợt 4 (`SLEEP_MORE` `POTTY_PREP` `POTTY_STEPS` `MONTESSORI_PRINCIPLES` `MONTESSORI_ACT` `MONTESSORI_MAT` `STEAM_PRINCIPLES` `STEAM_ACT` + object `STEAM_LABEL`) — **dùng chung** cho app Sóc (`soc/`) và trang chủ Just Us |

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

## App con: Sóc / Nuôi con (`soc/`)
Phần Nuôi con **đã tách khỏi `index.html`** thành app tĩnh độc lập trong thư mục `soc/`
(`index.html` + `manifest.json` + `sw.js` + `icon.svg`, cài được như PWA riêng): mốc phát triển ·
mốc ngôn ngữ · trò chơi theo kỹ năng · cafe/khu vui chơi cho bé ở HN · tiêm chủng · cân nặng chiều cao ·
nhật ký ốm · hồ sơ y tế gửi cô · mẹo ăn uống · thực đơn ăn dặm · đếm ngược ngày nhập học · đồ mang đi lớp ·
kỹ năng tự lập · thống nhất cách dạy con · dạy kỹ năng tự túc · nhật ký "điều đầu tiên" & "cơn ăn vạ".

**Đợt 1 (nội dung) đã thêm:** sub-tab **🚨 An toàn** (`SafetyTab`) + thanh đỏ cấp cứu luôn hiện ở đầu app —
sơ cứu 8 tình huống, dấu hiệu đi viện ngay, đồ nguy hiểm, checklist chống trẻ trong nhà, danh bạ khẩn tự
điền (`ContactBook`); **💬 kịch bản câu nói khi con ăn vạ** (`TantrumScripts`, 14 tình huống); hành vi
tuổi lên 2 + quy tắc thân thể; việc nhà vừa sức; bày nhà cho bé tự lập; sau tiêm 48h; táo bón; mặc gì
theo nhiệt độ; bệnh theo mùa Hà Nội; việc bé sợ; cuối tuần làm gì; màn hình; giấy tờ của bé.
- Nội dung y tế chỉ là **sơ cứu tham khảo** — app KHÔNG tự tính liều thuốc, chỉ ghi thứ bác sĩ đã kê.

**Đợt 2 (cần code) đã thêm:** sub-tab **🚽 Tập bô** (`PottyTab`) — checklist dấu hiệu sẵn sàng, ghi nhanh
mỗi ngày, chuỗi ngày khô, lưới 30 ngày, mốc ngồi bô, gỡ vướng; **📈 So với chuẩn WHO** (`GrowthWHO`
+ `GrowthChart`, helper `whoAt`/`whoBand`) trong tab Sức khoẻ — bảng `WHO_WEIGHT`/`WHO_HEIGHT` là bản
**rút gọn mốc 3 tháng, 0–36 tháng**, nội suy tuyến tính giữa hai mốc, chỉ để nhìn xu hướng; **🔔 nhắc việc**
(`childDueList` + `NotiRunner` + `NotiSettings`).
- `childDueList()` là **một nguồn duy nhất** cho cả thẻ "📌 Cần để ý" ở trang chủ lẫn thông báo — sửa
  luật nhắc thì sửa đúng một chỗ.
- App Sóc **không có server đẩy**, chỉ nhắc được khi app đang mở (mở app · mỗi 15 phút · quay lại tab).
  Thông báo lúc đóng app vẫn là việc của Just Us. `soc/sw.js` có `notificationclick` để bấm là focus app.

**Đợt 3 (nội dung + vài phần có lưu) đã thêm:** tab **Đi học** có chọn trường mầm non (`SchoolPicker`,
so sánh các trường đã xem), lịch làm quen ngày đầu, tờ dặn cô (`TeacherNote`, in/gửi được), bệnh hay lây
ở lớp kèm số ngày nghỉ; tab **Chơi với con** có đồ mang đi chơi xa (`TripPack`) + ra khỏi nhà cùng con
(ô tô · máy bay · ăn hàng · gửi ông bà); tab **Nuôi dạy** có "khủng hoảng tuổi lên 2", bố mẹ đuối sức,
và bảng **ai lo việc nào** (`DutyBoard`); sub-tab mới **📔 Kỷ niệm** (`MemoryTab`) — một dòng mỗi ngày,
ảnh mỗi tháng, câu nói ngộ nghĩnh, thư gửi con sau này, và nhật ký "điều đầu tiên" (**đã chuyển từ tab
Nuôi dạy sang đây**; state `ju.childDiary` giờ chỉ do `MemoryTab` giữ, đừng khai lại ở `ChildCare`).
- **Ảnh**: `soc/` nay có `Cloud.uploadPhoto` / `signedUrl` / `deletePhoto` dùng chung bucket
  `justus-photos` với Just Us, kèm `compressImage` (cạnh dài 1200px, JPEG 0.82) và `CloudImg`.
  `ju.childPhotos` chỉ giữ **đường dẫn** — nhét base64 vào đây sẽ phình hàng `justus_data` của cả cặp.
  Chưa ghép cặp thì không tải ảnh được, app báo rõ chứ không im lặng.
- `GuideList` + `bullets()` là hai helper dùng lại cho mọi mục "bấm mở ra đọc".

**Đợt 4 (nội dung, 2026-08-09) đã thêm:** sub-tab mới **🌱 Lớn lên → Học sớm** (`tab==='learn'`) gồm
**Montessori tại nhà** (10 nguyên lý · hoạt động mẫu 2 nhóm tuổi · đồ chơi và vật liệu) và **STEAM cho bé**
(nguyên lý chơi · hoạt động mẫu 2 nhóm tuổi có nhãn S/T/E/A/M qua `STEAM_LABEL`); tab **Giấc ngủ** thêm khối
"giấc ngày · cai ti đêm · ác mộng" (`SLEEP_MORE`) và bảng `SLEEP_NEED` tách mốc **12–18** và **18–24 tháng**
kèm cột giấc ngày (trường `g`); tab **Tập bô** thêm "chuẩn bị trước khi bắt đầu" (`POTTY_PREP`) và
**bảy bước cai bỉm** (`POTTY_STEPS`).
- Nội dung này vốn viết cho `ChildCare` trong `index.html` (commit `f721818`, cơ chế `GUIDE_KEYS`), nhưng
  bản trên `origin/main` đã tách Sóc sang `soc/` nên **đã chuyển thẳng sang đây và bỏ `GUIDE_KEYS`** —
  app Sóc tra nội dung bằng `searchIndex()` chứ không bằng chuỗi khoá từng mảng.
- Phần giấc ngủ và tập bô **gộp** với `SLEEP_ROUTINE`/`SLEEP_FIX`/`POTTY_READY`/`POTTY_TIMES`/`POTTY_FIX`
  đã có, không chép đè: chỉ đưa sang phần app Sóc còn thiếu.

### Thiết kế lại (2026-08-09)
App Sóc **không còn mượn da "Sổ tay"** của Just Us nữa — nó có hệ token riêng trong khối `<style>`
(`--brand` xanh mòng két, `--surface`, `--ink*`, `--line`, sáng/tối đầy đủ). Lý do đổi: da sổ tay lấy
đỏ gạch làm màu chính, gần trùng màu cấp cứu nên thứ quan trọng nhất lại không nổi. **Nay đỏ
(`--danger`) CHỈ dùng cho cấp cứu, không dùng ở đâu khác** — đừng phá luật này.
- Sửa giao diện thì sửa token, đừng viết màu thẳng vào style nội tuyến.
- Muốn quay lại da sổ tay thì thay đúng khối `<style>` của `soc/index.html`, phần JS không phụ thuộc.

**Điều hướng hai tầng** thay cho lưới 10 pill cũ: hằng `NAV` chia 14 mục vào **5 nhóm** —
🏠 Nhà · 🌱 Lớn lên (mốc & lời nói · chơi & ra ngoài · học sớm · ăn uống · giấc ngủ · đi lớp) ·
🏥 Sức khoẻ (theo dõi & khám · răng · tập bô · an toàn) · 💞 Nuôi dạy (với con · bố mẹ) · 📔 Kỷ niệm.
`Dock` là thanh dưới cố định (có chấm nhắc khi nhóm đó đang có việc), `SubTabs` là hàng tab con.
Thêm mục mới → thêm vào `NAV`, `TAB_GROUP`/`TAB_NAME` tự suy ra.
- Nút 🚨 nằm cố định ở `header`, luôn một chạm là tới từ bất kỳ đâu.

**Ba thứ vá điểm yếu cũ:**
- `SearchSheet` + `searchIndex()` — tìm toàn app, bỏ dấu vẫn ra ("sot co giat"). Thêm nội dung mới
  thì nhớ thêm một dòng vào `searchIndex()`, không thì tra không thấy.
- `MenuSheet` — xuất/nhập file sao lưu JSON toàn bộ `CHILD_KEYS`, kèm trạng thái đồng bộ và giờ
  đồng bộ gần nhất. Ảnh KHÔNG nằm trong file (chỉ có đường dẫn).
- `App` kiểm dữ liệu tĩnh trước khi vẽ: `data/child.json` hỏng thì hiện màn báo lỗi có nút tải lại,
  thay vì vẽ hàng loạt mục rỗng một cách im lặng.

**Trang chủ** (`HomeTab`) là sub-tab đầu tiên và là màn mặc định khi mở app — ghép hai mẫu đã chọn:
phần trên là **bảng chỉ số** (cân nặng lớn + đường 6 lần đo gần nhất vẽ bằng `Spark`, rồi 4 ô chiều cao ·
từ nói được · mũi đã tiêm · kỹ năng tự lập), giữa là **📌 Cần để ý** (mũi còn thiếu, mũi kế tiếp trong 60
ngày, đếm ngược đi lớp, đợt ốm chưa đánh dấu khỏi, lâu chưa đo) — bấm là nhảy đúng tab; dưới là **lưới 8 ô
lớn** vào từng mục (thêm 🚽 Tập bô và 📔 Kỷ niệm ở đợt 3). Thẻ hồ sơ bé cũ chỉ còn hiện ở trang chủ khi chưa điền đủ hoặc đang bấm sửa.

- Vào từ Just Us: tab dưới **🐿️ Sóc** giờ chỉ là **màn cửa vào** (`ChildLauncher`, ~dòng 4463) với nút
  "Mở app Sóc →" (`href="soc/"`). Component `ChildCare` KHÔNG còn trong `index.html`.
- Ngoài ra tab **Cá nhân** có **bảng app** (`AppBoard`, hằng `APP_BOARD`) gom mọi app riêng về một chỗ:
  🐿️ Sóc · 🪷 Tâm linh · 💰 VíNhà (chỉ hiện khi đã dán link ở `ju.vinhaUrl`). Tách thêm app mới thì
  thêm một dòng vào `APP_BOARD`, không dựng thẻ riêng nữa.
- Dữ liệu tĩnh **không nhân bản**: `soc/index.html` fetch `../data/child.json`, còn `index.html` cũng nạp
  chính file đó nhưng chỉ dùng `PLAY_LIB` + `WEAN_MENU` (thẻ trang chủ "Chơi với con hôm nay" và phần của
  bé trong "Thực đơn hôm nay"). Sửa nội dung nuôi con → sửa `data/child.json`, cả hai app cùng đổi.
- **Cùng origin** với Just Us → chung `localStorage`, mọi khoá `ju.child*` + `ju.skillGuidesDone` giữ nguyên.
- **Đồng bộ đám mây**: khác Tâm linh, `soc/` CÓ lớp `Cloud` gọn riêng — nó dùng lại **phiên Supabase đã có
  của Just Us** (không tự đăng nhập / ghép cặp) và chỉ đụng vào `CHILD_KEYS`: kéo về thì chỉ ghi đè khoá của
  Sóc, đẩy lên thì **trộn** khoá Sóc vào hàng `justus_data` đang có. Nhờ vậy ghi bên này không đè mất dữ
  liệu khác, và `Cloud.start()` của Just Us (vốn `pull()` đè localStorage khi mở app) không nuốt mất phần
  vừa ghi bên Sóc. `last_writer` ghi là `<device>.soc` để máy kia (và tab Just Us) nhận realtime.
  Chưa đăng nhập/ghép cặp thì app vẫn chạy, chỉ lưu máy này (có dòng báo "📴 Chưa nối đám mây").
- Cache riêng `soc-v7`. **Ba service worker dùng chung origin**: mỗi `sw.js` chỉ được xoá cache có tiền tố
  của chính nó (`justus-*` / `tamlinh-*` / `soc-*`). `soc/sw.js` cache cả `../data/child.json` + `../fonts.css`
  (scope chỉ giới hạn TRANG được điều khiển, không giới hạn URL được chặn) → đổi 2 file đó phải bump `soc-v*`.
- Deploy: Pages và Netlify đều publish cả thư mục nên `soc/` tự lên, không cần sửa CI.

**Vẫn nằm trong `index.html` (KHÔNG tách):** `ju.child` còn được đọc ở `ChildPlayCard`, `TodayMenuCard`
(phần của bé) và mục Sức khỏe gia đình; `DEFAULT_ROUTINE` / lịch sinh hoạt vẫn nhắc việc liên quan tới bé.

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
- `App` — dòng ~7668; 6 tab dưới (`MAIN_TABS`, dòng 7648): 🏠 Tổ ấm (`home`) · 🏡 Nhà mình (`us`) · 💞 Chúng mình (`talk`) · 🗺️ Hẹn hò (`date`) · 🐿️ Sóc (`child` — chỉ là cửa vào app `soc/`) · 🙋 Cá nhân (`me`).
- `Cloud` (~452) — lớp Supabase. `MENU_REGISTRY` (~5145) — cấu hình sub-tab/segment của từng màn. Nhiều component con: `Home`, `DateTab`, `UsTab`, `TalkTab`, `Profile`, `ChildLauncher`, `LoveJar`, `DailyQuestion`, `WeeklyCheckin`, `CheckIns`, `Timeline`, `Coupons`, `WishTab`, `HanoiCatalog`, `Reminders`…

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
