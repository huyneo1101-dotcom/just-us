# ⛔ ĐỌC TRƯỚC KHI SỬA APP — `index.html` LÀ BẢN DỰNG, KHÔNG PHẢI NGUỒN

Từ 10/08/2026 app này không còn bắt điện thoại người dùng tự dịch mã mỗi lần mở.
Việc dịch chuyển sang Mac lúc dựng bản, nên cấu trúc đổi:

| File | Vai trò |
|---|---|
| `nguon/app.jsx` | **mã app — ĐÂY là chỗ sửa** |
| `nguon/khung.html` | phần HTML bao quanh, chỗ chèn mã đánh dấu `<!--@@APP@@-->` |
| `index.html` | **bản dựng, sinh tự động — CẤM sửa tay** |

Sửa xong `nguon/app.jsx` thì dựng lại, nếu không thì bản chạy vẫn là mã cũ:

```bash
python3 /Users/Huy/Claude/HeThong/dungapp/dung.py /Users/Huy/Claude/App/JustUs
```

**Vì sao phải có dòng cảnh báo này:** sửa thẳng vào `index.html` vẫn chạy được ngay,
không lỗi nào phát ra — nên không có gì báo cho biết là đã sửa nhầm chỗ. Lần dựng kế
tiếp mới nuốt mất bản sửa ấy. Công cụ có chốt: thấy `index.html` lệch với dấu vân tay
của lần dựng trước thì DỪNG và bắt gộp tay, chứ không ghi đè.

## ⛔ MỘT PHẦN MÃ APP NÀY DÙNG CHUNG VỚI SÓC — sửa là phải dựng lại CẢ HAI

Từ 12/08/2026, hai khối dưới đây không còn nằm trong `nguon/app.jsx` nữa. Bản gốc
duy nhất ở `HeThong/dungapp/chung/`, được gộp vào lúc dựng bản qua chỉ thị `@@GOM`:

| File chung | Chứa gì | Dòng |
|---|---|---|
| `cloud-ju.jsx` | toàn bộ `Cloud` — đăng nhập, ghép đôi, đẩy/kéo dữ liệu, kho ảnh — và `useLocal` | 153 |
| `ui-ju.jsx` | `Collapse` · `Sheet` · `celebrate` | 37 |
| `noti-runner-ju.jsx` | `NotiRunner` — máy nhắc chạy nền trong app | 38 |

**Vì sao phải gộp:** Sóc chạy trên CÙNG dự án Supabase, CÙNG bảng `justus_data`,
CÙNG kho ảnh `justus-photos`, và khối `Cloud` bên đó vốn là bản chép từ đây. Đo
12/08/2026 thấy hai bản đã lệch nhau trong im lặng — app này đã hạ thời hạn link
ảnh từ 07 ngày xuống 01 giờ vì lý do bảo mật, Sóc thì chưa được vá theo. Không lỗi
nào phát ra: cả hai app vẫn mở được ảnh, chỉ khác thời hạn.

- Sửa file chung ⇒ **dựng lại cả `App/JustUs` lẫn `App/Soc`** ngay trong lượt đó.
  `khoe.py::app_dung_lech_nguon()` kêu ĐỎ khi một app chưa dựng theo.
- App phải tự khai TRƯỚC dòng chỉ thị: `SB_URL` · `SB_KEY` · `SYNC_KEYS` · `store`.
  `SYNC_KEYS` chính là chỗ hai app khác nhau nên cố ý để ngoài.
- ⛔ Cần thêm một hàm vào `Cloud` thì thêm vào **file chung**, đừng thêm riêng vào
  đây — thêm riêng là dựng lại đúng cái đã đi gỡ.

### ⛔ `Cloud.push()` TRỘN dữ liệu, KHÔNG ghi đè cả cột `data` (vá 14/08/2026)

Ba app — Just Us · Sóc · **Bếp Nhà** — ghi chung MỘT hàng `justus_data` theo `couple_id`,
mà mỗi app khai `SYNC_KEYS` riêng: **104 · 30 · 15 khoá**. Bản trước 14/08 đẩy thẳng
`data: snap` nên **mở app nào thì hàng đó chỉ còn khoá của app ấy**. Đo 14/08/2026: mở Sóc
một lần là **76 nhóm dữ liệu của Just Us biến khỏi bản đám mây**, và chiều ngược lại mất
`ju.childFever` · `ju.childDay`.

Hỏng câm hoàn hảo: máy đang dùng vẫn đủ dữ liệu vì bản trong `localStorage` còn nguyên,
mọi lệnh vẫn trả về thành công, và máy nào mở sau sẽ push lại phần của nó. **Chỉ máy cài
lại hoặc máy mới đăng nhập mới kéo về bản đã khuyết** — tức lúc phát hiện thì đã mất.

Nay `push()` đọc hàng hiện có, giữ nguyên mọi khoá **không** thuộc `SYNC_KEYS` của app đang
chạy, rồi mới ghi. **Đọc hụt thì DỪNG, không ghi** — ghi tiếp là đúng cái đang đi vá.

- **Thêm app thứ tư vào cùng bảng thì không phải làm gì thêm**, nhưng phải khai `SYNC_KEYS`
  **chỉ gồm khoá của chính nó**; khai thừa một khoá của app khác là app này thành chủ sở hữu
  khoá đó và bản cũ của nó sẽ đè bản mới bên kia.
- **Cổng canh:** `python3 /Users/Huy/Claude/HeThong/dungapp/thu-cloud-tron.py --tu-kiem`
  — 05 ca chạy THẬT khối `Cloud` bằng Node với client giả, 03 bản hỏng. Đã nạp vào
  `khoe.py::BO_TEST`. Hai chiều hỏng ngược nhau đều có bản hỏng: giữ **thiếu** (mất dữ liệu
  app anh em) và giữ **thừa** (bản cũ trên đám mây đè bản mới của chính app này, người dùng
  sửa xong thấy giá trị quay về như cũ).

### `NotiRunner`: hai chỗ khác nhau là HẰNG SỐ APP TỰ KHAI

Khai ngay trên dòng chỉ thị gộp, đừng sửa vào file chung:

| Hằng | Just Us | Sóc | Vì sao phải khác |
|---|---|---|---|
| `KHO_NHAC` | `'justus-noti'` | `'soc-noti'` | dùng chung một tên là app mở sau ghi đè bản tóm tắt của app mở trước |
| `DANG_KY_DAY` | `subscribePush` | `null` | Sóc cố ý không đăng ký đẩy nền — xem `App/Soc/CLAUDE.md` |

⛔ `DANG_KY_DAY` phải khai **null tường minh**, không dùng phép dò `typeof x ===
'function'`. Phép dò hỏng về phía IM: app nào lỡ mất hàm đăng ký thì lặng lẽ chạy
tiếp như thể cố ý không có — đúng lỗi mà đợt gộp này đi vá ở Sóc.

## ⚠ CÒN 02 KHỐI TRÙNG VỚI SÓC, CỐ Ý CHƯA GỘP

| Khối | Trùng tới mức | Vướng gì |
|---|---|---|
| `Onboarding` (54 dòng) | khung giống, **chữ đã khác** từ 12/08 | Sóc nay chào "Sóc — Nuôi con nhàn nhất"; gộp thì phải đưa cả cụm chữ thành tham số, chưa đáng |
| `computeDueNotis` | khác 155% | luật riêng từng app, **không phải** ứng viên gộp |

---

# Just Us — Của riêng hai đứa (app riêng cho một cặp đôi/vợ chồng)

App tĩnh: UI + logic + CSS nằm trong `index.html` (~7810 dòng, ~676KB — vẫn RẤT LỚN), React 18 + Babel Standalone qua CDN, KHÔNG build step. Deploy tĩnh (GitHub Pages qua Actions + Netlify).

## Quy tắc làm việc với file này
- **KHÔNG đọc cả `index.html` (~676KB, ~7810 dòng)** — LUÔN grep định vị rồi Read cửa sổ nhỏ (xem skill `bigfile-nav`).
- Sửa nội dung đáng kể → **bump `CACHE` trong `sw.js`** (hiện: `justus-v38`; có thêm cache phụ `justus-noti`).
- Babel transpile trong trình duyệt: lỗi cú pháp = trắng màn hình. Kiểm tra Console sau khi sửa.

## ⛔ MỌI SETTER CỦA `useLocal` PHẢI VIẾT DẠNG HÀM CẬP NHẬT (vá 10/08/2026)

`useLocal` (dòng ~589) trả thẳng setter của React. Viết `setItems([{id:uid(),…},...items])`
là tính từ biến `items` **của lần vẽ TRƯỚC**. Hai thao tác rơi vào cùng một nhịp vẽ thì thao
tác sau đè mất thao tác trước, và **không có lỗi nào phát ra** — dữ liệu mất trong im lặng,
người dùng chỉ thấy "bấm hai lần mà chỉ vào một".

Dạng đúng, áp cho cả ba nhóm:

```js
setItems(prev=>[{id:uid(),…},...prev]);          // thêm
setItems(prev=>prev.filter(x=>x.id!==id));       // xoá
setItems(prev=>prev.map(x=>x.id===id?{...x,done:!x.done}:x));  // sửa/đánh dấu
setPantry(prev=>({...prev,[k]:!prev[k]}));       // state dạng object cũng vậy
```

**Số đo nghiệm thu 10/08/2026** (mở app thật, bấm 3 lần trong cùng một nhịp rồi đếm bản ghi
trong `localStorage`):

| Ca đo | Bản chưa vá | Bản đã vá |
|---|---|---|
| Thêm 3 việc liên tiếp (`ju.todos`) | **1** | **3** |
| Đánh dấu xong 3 việc liên tiếp (`ju.todos`) | **1** | **3** |

- Đã vá **111 chỗ**: 107 nhóm mảng (`useLocal`) + 4 ô tích dạng object (Tủ bếp `setPantry`,
  Việc nhờ `setHelp`, Tủ lạnh `setFridge`, nhóm nhắc việc `setNoti`).
- **Bước lọc trùng phải nằm TRONG hàm cập nhật**, không được tính trước từ mảng cũ — nếu
  không thì mất-ghi đổi thành thêm-trùng. 04 chỗ đã chuyển: đẩy món sang 🛒 Đi chợ (03 chỗ)
  và nhập ngày quan trọng hàng loạt.
- **CÒN NGUYÊN, cố ý không vá**: state của `useState` (nháp biểu mẫu, tab đang mở, tháng đang
  xem…) — mất một lần bấm ở đó không mất dữ liệu; và 33 chỗ `useLocal` dạng object mà biểu
  thức còn dùng biến phụ tính sẵn từ chính state đó (`setQa` ~1387, `setQuiz` ~1426,
  `setData` ~2390, `setP` ~3425). Vá nửa vời ở nhóm này còn tệ hơn để nguyên: phần trải
  (`...prev`) thì mới mà biến phụ vẫn cũ. Đụng tới thì đưa cả phép tính vào trong hàm.
- **Phép rà lại: `python3 docs/va-setter.py --soi`** (thêm `--va` để ghi đè). Nó đọc balanced
  paren nên bắt được cả dạng nhiều dòng, và tự phân loại `useLocal`/`useState`. Đã chứng minh
  công cụ có răng: chạy trên bản 10/08 đã vá ra **"SẼ VÁ 0"**, chạy trên bản trước khi vá ra
  **"SẼ VÁ 107"**. Cẩn thận với lookbehind: `...items` có dấu chấm đứng trước nên phép loại
  "thuộc tính `.x`" ăn nhầm cả toán tử spread — bản đầu tiên bỏ sót trọn nhóm thêm mục.

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
- ⛔ **Từ 10/08/2026 `tam-linh/index.html` là BẢN DỰNG — sửa `tam-linh/nguon/app.jsx` rồi chạy
  `python3 /Users/Huy/Claude/HeThong/dungapp/dung.py /Users/Huy/Claude/App/JustUs/tam-linh`.**
  App thôi nạp `@babel/standalone` (601 KB mỗi lần mở). `khoe.py::app_dung_lech_nguon()` nay
  duyệt thêm một cấp thư mục con nên có canh app này; sửa thẳng bản dựng là ĐỎ.
- ⚠️ **06 thứ dùng chung với Just Us từng bị bỏ quên lúc tách app (vá 10/08/2026):**
  `uid` · `celebrate` · `openUrl` · `reduceNum` · `thanSo` · `NUM_MEAN`/`PY_MEAN`. Thiếu chúng
  thì Tử vi và Thần số ném `ReferenceError` ngay lần bấm nút đầu — nút vẫn vẽ ra, không màn
  hình nào trắng, nên nhìn không ra là hỏng. **Chép thêm hàm nào từ `nguon/app.jsx` của Just
  Us sang thì kiểm cả hàm mà nó gọi**, và chạy `python3 tam-linh/thu-tam-linh.py` để đo lại.
- Giao diện (theme + nền tối) đọc từ khoá `ju.setup` của Just Us qua `apDungGiaoDien()`.

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
| `ju.movies` | Phim muốn xem — xem mục riêng bên dưới. Điểm sao để ở `rate:{a,b}`, **mỗi người một ô**, KHÔNG dùng chung một số như `rating` của `ju.watch` | array |
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

## 🍿 Phim muốn xem (dựng 12/08/2026)

Vào từ **Hẹn hò → Ước mơ chung → 🍿 Phim muốn xem** (`MovieList` + `MovieForm` trong
`nguon/app.jsx`, ngay trước khối Săn giá). Dữ liệu ở `ju.movies`, đã trong `SYNC_KEYS`.
Gợi ý phim ở `data/suggest.json` khoá `MOVIE_SUGGEST` (98 phim) — thêm khoá mới thì
phải khai placeholder rỗng trong `window.JUD` ở `nguon/khung.html`, nếu không thì
`const MOVIE_SUGGEST=JUD.MOVIE_SUGGEST` nhận `undefined` và màn hình trắng.

**Vì sao tách khỏi mục 🎬 Xem·Đọc·Nghe** thay vì thêm tag: `ju.watch` gộp chung sách,
nhạc, podcast nên chỉ có ô `rating` DÙNG CHUNG cho cả hai người, không có chỗ ghi nơi
xem. Phim là thứ hai vợ chồng chấm khác nhau, nên phải là `rate:{a,b}` tách ô.

- **Điểm sao:** `rate` là object theo vai (`a`/`b`), chấm bằng `Stars` chỉ ở dòng của
  chính mình; dòng của người kia hiện đọc-thôi. Sửa chỗ này thì giữ nguyên tách ô.
- **Chuyển phim cũ:** dải nhắc đầu mục đưa mục tag `Phim`/`Phim bộ` từ `ju.watch` sang.
  Chuyển HẲN (gỡ khỏi `ju.watch`), không chép — hai bản của cùng một phim thì đánh dấu
  đã xem ở bản này mà bản kia vẫn nằm đó, và không dấu hiệu nào cho thấy điều đó.
  `rating` cũ được quy về `rate[by]` chứ không vứt đi.
- **Chia sẻ** dùng helper `shareText()`: khay chia sẻ của máy, máy nào không có thì
  copy. ⛔ Người dùng bấm huỷ khay ném `AbortError` — phải trả `'huy'` và DỪNG, đừng
  rơi xuống nhánh copy rồi báo "đã copy" trong khi họ vừa cố ý thoát ra.
- ⚠ Hai chỗ dùng `navigator.share` bên **Sóc** (dặn cô, hồ sơ y tế) còn viết khuôn cũ
  `if(navigator.share)…else` nên dính đúng lỗi AbortError này. Đụng tới thì gọi
  `shareText()` — nhưng phải gộp về `HeThong/dungapp/chung/` trước, đừng chép sang.

⚠️ **`SEARCH_SRC` khai tab theo NƠI RENDER, không theo cảm giác** (vá 12/08/2026): 06
khoá của `WishTab` từng khai `tab:'us'` trong khi `WishTab` render bên trong `DateTab`,
nên bấm kết quả tìm kiếm nhảy sang Nhà mình — nơi `US_SEGS` không khai mục nào chứa
chúng. Không lỗi nào phát ra vì tab đích vẫn tồn tại, chỉ là không có mục cần tìm.
Thêm khoá mới vào `SEARCH_SRC` thì dò xem component đọc khoá đó nằm trong tab nào.

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

## Săn giá — theo dõi giá sản phẩm qua link (dựng 10/08/2026)

Vào từ **Hẹn hò → Ước mơ chung → 🏷️ Săn giá** (component `PriceWatch`). Dán link món đang
ngắm; giá hạ thì có tin Telegram + thông báo đẩy trên điện thoại.

| Mảnh | Nằm ở đâu |
|---|---|
| Giao diện | `nguon/app.jsx` — `PriceWatch`, `PriceSpark`, `tienVN`, `khiNao` |
| Dữ liệu | `ju.pricewatch` (đã trong `SYNC_KEYS`, đồng bộ 2 máy) |
| Bóc giá | `scripts/bocgia.py` |
| Chrome thật qua CDP | `scripts/chrome_cdp.py` |
| Quét + báo | `scripts/theo-doi-gia.py` (LaunchAgent `com.huy.justus-san-gia`, 08:10 · 13:10 · 20:10) |
| ~~Mốc ĐÊM mở Chrome~~ | **ĐÃ GỠ 12/08/2026** (Huy chốt *"bỏ Chrome 3h sáng"*) — plist dời sang `HeThong/task-da-go/com.huy.justus-san-gia-chrome.plist.go-12082026` |
| Khoá Supabase | `scripts/sb_admin.py` — service_role key tự lấy qua Supabase CLI, ghi `~/.config/api-keys.env` |
| Bộ ca kiểm | `scripts/thu_san_gia.py --tu-kiem` — 48 ca (28 PHẢI CHẶN) · 20 bản hỏng, đã nạp `khoe.py::BO_TEST` |

**App KHÔNG tự đo giá** — trình duyệt bị CORS chặn đọc trang của trang bán hàng khác. Máy ở
nhà đo rồi ghi giá ngược vào `justus_data`; app chỉ nhập link và xem.

**Thang lấy trang** (dừng khi BÓC RA GIÁ, không dừng khi có mã 200 — trang dựng bằng
JavaScript trả 200 kèm thân rỗng): API riêng của trang (Tiki) → `curl` → `curl_cffi` →
**bản dành cho bot tìm kiếm** (chỉ với miền trong `MIEN_CAN_GHE`) → Chrome không giao diện →
**Chrome thật qua CDP**.

⚠ **Shopee dựng sẵn giá cho trình thu thập của công cụ tìm kiếm** (vá 12/08/2026,
`bocgia._curl_bot` + `UA_BOT`). Cùng một link, đo trong một buổi: bản dành cho trình duyệt
thường trả 1.010 KB **không có ký tự ₫ nào**, API `get_pc` trả **403** (mã 90309999) kể cả
khi hồ sơ Chrome **đã đăng nhập** (`is_login: true`), mọi trường giá trong khối trạng thái
nhúng đều `null`; còn bản trả cho `Googlebot`/`Bingbot`/`Twitterbot` là 90 KB kèm JSON-LD
`AggregateOffer` đủ `lowPrice` 139.000 và `highPrice` 195.000, khớp khoảng giá hiện trên
trang. Bậc này chỉ tốn một lời gọi `curl`.

⛔ **NHƯNG BẬC BOT CHẾT NGAY TRONG NGÀY DỰNG — đo lại chiều 12/08/2026: 05/05 món Shopee
trả `HTTPError`, kể cả đúng món buổi sáng còn ra `lowPrice` 139.000.** Cửa sổ dùng được
của một đường lách chỉ tính bằng giờ, nên **đừng chép con số "01 món ra giá" của buổi
sáng làm hiện trạng** — phép đo hôm nay hết hạn trước khi tài liệu kịp cũ. Mã bậc bot
giữ nguyên trong `bocgia`, vô hại, và có thể sống lại khi Shopee đổi luật; muốn biết
còn ăn không thì ĐO, đừng đọc đoạn này.

⚠ **Hệ quả đã chốt 12/08/2026 (Huy: *"bị chặn thì thôi không theo dõi nữa"*): 05 món
Shopee đã đặt `active:false` trong `ju.pricewatch`.** Tắt chứ KHÔNG xoá — món vẫn nằm
trong app kèm link, bật lại bằng một nút. `theo-doi-gia.py` bỏ qua mục `active is False`
ngay đầu vòng nên không tốn lời gọi mạng nào và không đẻ lỗi mỗi lượt quét.

⛔ Đừng dựng lại các đường đã đo và đã trượt: `facebookexternalhit` và `WhatsApp` (trả
trang không giá) · dạng link cũ `-i.<shop>.<item>` (trả rỗng) · giao diện điện thoại
(590 KB, không giá) · gọi API từ trong trang đã tải (403) · và **Chrome thật** — mở bằng
hồ sơ đã đăng nhập cũng chỉ ra khung trang 3,9 KB không giá.

Ghé trang chủ trước vẫn giữ cho bậc Chrome thật: vào thẳng thì bị đá về trang chủ (thân 199
KB, 0 ký tự ₫), ghé `https://shopee.vn/` 10 giây lấy cookie rồi `Page.navigate` thì ra giá.
Miền cần cách này khai ở `bocgia.MIEN_CAN_GHE`. Link rút gọn `vn.shp.ee` được giải trước
(`giai_link`).

⛔ **KHÔNG CÒN MỐC TỰ ĐỘNG NÀO MỞ CHROME** (Huy chốt 12/08/2026: *"bỏ Chrome 3h sáng"*).
Mốc 03:00 dựng buổi sáng cùng ngày và bị gỡ ngay chiều đó, vì bậc bot tìm kiếm ở trên đã
lấy được đúng những món Chrome lấy được, còn 04 món Shopee bị chặn thì **Chrome thật cũng
trượt** — mở bằng hồ sơ đã đăng nhập vẫn chỉ ra khung trang 3,9 KB không giá. Giữ lại một
mốc mở trình duyệt mỗi đêm để đổi lấy 0 món là phần đánh đổi không có lợi.

- Bậc `chrome-that` và toàn bộ phần phiên chung **vẫn còn trong mã**, chỉ là không mốc tự
  động nào bật cờ nữa. Cần dùng tay thì chạy `JU_CHROME_THAT=1 JU_CHROME_HO_SO=… python3
  scripts/theo-doi-gia.py --kho`.
- Hồ sơ Chrome cố định **cố ý chưa xoá** (`~/Library/Application Support/JustUsSanGia/`),
  vì xoá là phải đăng nhập Shopee lại bằng tay. Nó chứa cookie tài khoản thật, quyền 700 —
  không cần nữa thì xoá cả thư mục, đừng để lẫn vào bản sao lưu nào.
- ⚠ Dựng lại mốc đêm thì **đo trước bằng số**: món nào ra giá nhờ `chrome-that` mà bậc bot
  không lấy được. Chuỗi `kq["cach"]` đã ghi sẵn tên bậc, đừng dựng theo suy đoán.

⚠ **Nếu có ngày dùng lại Chrome có giao diện thì phải giấu cửa sổ bằng giao thức** (đo
12/08/2026 sau khi Huy chê *"đừng có hiện chrome lên trên claude tao đang làm việc nữa"*).
Ba điều đã trả giá, mỗi điều đều hỏng câm:

- `--window-position=-3200,-3200` **KHÔNG đủ trên macOS** — hệ điều hành kéo cửa sổ về màn
  hình và Chrome giành luôn tiêu điểm. Vá bằng `Browser.setWindowBounds` với
  `windowState:"minimized"` ngay sau khi nối CDP (`chrome_cdp._giau_cua_so`).
- **Hồ sơ tạm mất sạch cookie mỗi lượt**, nên Shopee đòi đăng nhập lần nào cũng như lần đầu.
  Đặt `JU_CHROME_HO_SO=<thư mục>` để dùng hồ sơ CỐ ĐỊNH; đang dùng
  `~/Library/Application Support/JustUsSanGia/chrome-ho-so` (ngoài repo, quyền 700 vì chứa
  cookie tài khoản thật). Đăng nhập lại khi hết phiên: mở Chrome với đúng `--user-data-dir`
  đó rồi đăng nhập tay — **cấm** hỏi mật khẩu qua chat.
- **Cookie chỉ xuống đĩa khi Chrome tự thoát.** Cắt bằng `p.terminate()` thì lượt sau vẫn là
  khách chưa đăng nhập mà không lỗi nào phát ra — phải gửi `Browser.close` trước
  (`chrome_cdp._dong_chrome`). Ca canh dùng cookie có `Max-Age`; cookie không hạn là cookie
  phiên, Chrome không bao giờ ghi nó xuống hồ sơ nên ca sẽ đỏ vì lý do sai.

Cờ `JU_CHROME_THAT=1` bật bậc Chrome; **không mốc tự động nào đặt cờ này nữa**, nên cả ba
mốc quét đều dừng ở bậc `curl` và bậc bot tìm kiếm — đủ cho Tiki/Vivaia/Dyson và cho món
Shopee nào Shopee còn cho. Bộ ca canh cả hai chiều: ca 47 chặn mở Chrome khi chưa bật cờ,
ca 48 là đối chứng bắt bậc đó sống lại khi bật tay, ca 49 chặn việc coi giá trị lạ (`true`)
là đã bật.

⚠ **Bóc giá KHÔNG có lớp "dò số kèm chữ ₫"** — trang bán hàng nào cũng đầy giá của sản phẩm
gợi ý bên cạnh, lớp đó đọc trúng giá hàng khác mà không dấu hiệu nào phát ra. Chỉ 04 mốc tất
định: API riêng · JSON-LD · thẻ meta · khoá JSON đặc trưng (và chỉ nhận khi mọi ứng viên
trùng nhau). Bóc không ra thì ghi lỗi, app hiện "chưa đọc được giá tự động".

⚠ **Ghi ngược vào Supabase bằng phép so-rồi-đổi trên `updated_at`** — app cũng ghi vào chính
hàng ấy, ghi đè theo bản đọc lúc đầu là nuốt mất thay đổi app vừa lưu. PATCH kèm
`updated_at=eq.<mốc cũ>`; sửa 0 hàng ⇒ đọc lại rồi thử lần nữa.

⚠ **Ba lớp lọc mức giảm gộp trong `du_giam()`, đừng tách ra** — tách thì chúng che lẫn nhau:
gỡ điều kiện "phải thấp hơn lần trước" mà còn ngưỡng tiền thì giá TĂNG vẫn bị chặn (chênh
lệch âm luôn nhỏ hơn ngưỡng), nên bộ ca không chứng minh được lớp nào đang canh việc gì.

**Đo thật lượt đầu (23:42 ngày 10/08/2026):** 08 món · 07 lấy được giá (Shopee ×5, Dyson,
Vivaia) · 01 trượt đúng (trang giới thiệu xe Yadea không niêm yết giá).

⚠ **Đăng ký thông báo trên máy Huy đang CHẾT — đo 11/08/2026: `{sent:0, subs:1, loi:["403"]}`.**
Dòng duy nhất trong `justus_push_subs` có từ 02/07 và `role` rỗng, tức đăng ký từ trước lần đổi
khoá VAPID. Chữa bằng cách mở app trên điện thoại rồi bật lại thông báo (`subscribePush()` tự huỷ
và đăng ký lại) — không có đường nào làm hộ từ máy. Mã 403 cố ý KHÔNG tự dọn khỏi bảng (chỉ
404/410 mới dọn), vì 403 cũng có thể là cấu hình VAPID phía máy chủ sai tạm thời.
**Trong lúc chưa bật lại, tin báo giá vẫn về đủ qua Telegram.**

**Thông báo đẩy:** `theo-doi-gia.py` gọi thẳng Edge Function `push-notify` với `kind:'price'`.
Loại này gửi cho **cả hai máy** trong cặp (`moiNguoi: true`), khác `notes` là báo cho người
còn lại. Sửa function thì phải deploy lại:
`~/bin/supabase functions deploy push-notify --project-ref vvgkjgvzjeklaadusbne --workdir /Users/Huy/Claude/App/JustUs`

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
