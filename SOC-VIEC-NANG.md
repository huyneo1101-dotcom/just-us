# Sóc — sổ việc nặng ĐÃ DỜI, bản này không còn dùng

⛔ **Sổ đang dùng nằm ở `/Users/Huy/Claude/App/Soc/SOC-VIEC-NANG.md`** (dời chiều 09/08/2026,
cùng lúc app Sóc tách hẳn sang repo `App/Soc` và lên `https://soc-eiv.pages.dev`).
Routine `soc-nang` đọc bản kia. Giữ file này chỉ để khỏi mất dấu, **cấm sửa và cấm làm theo** —
mọi mô tả cấu trúc bên dưới là của bản Sóc cũ trong repo này, đã ngừng dùng.

# (bản cũ) Sóc — sổ việc nặng, mỗi đêm làm đúng MỘT mục

Routine `com.huy.routine-soc-nang` chạy 23:30 hằng đêm, lấy mục `CHỜ` đầu tiên trong bảng
dưới, làm trọn mục đó rồi đổi trạng thái. Sổ hết mục `CHỜ` thì routine thoát êm, không kêu.

⚠️ **File phải sửa là `soc/index.html` + `data/child.json`, KHÔNG phải `index.html`** (đính chính
09/08/2026): Sóc đã tách thành app riêng trong thư mục `soc/`, `index.html` ở gốc repo không còn
`function ChildCare` cũng không còn cơ chế `GUIDE_KEYS`. App Sóc tra nội dung bằng `searchIndex()`,
điều hướng bằng hằng `NAV`. Mọi mô tả bên dưới đã sửa theo cấu trúc này.

Mỗi mục ghi đủ: **làm gì · nghiệm thu bằng gì · đụng vào đâu**. Mục nào không nghiệm thu
được bằng một phép đo cụ thể thì đừng đưa vào sổ — không có phép đo thì "xong" chỉ là lời khai.

| # | Mục | Trạng thái |
|---|---|---|
| 1 | Trợ lý cơn sốt | CHỜ |
| 2 | Biểu đồ tăng trưởng chuẩn WHO | CHỜ |
| 3 | Cẩm nang: mốc ngôn ngữ theo tháng tuổi | CHỜ |
| 4 | Thực đơn xoay tuần + danh sách đi chợ | CHỜ |
| 5 | Chia việc hai vợ chồng | CHỜ |

---

## 1. Trợ lý cơn sốt — CHỜ

Thứ phải tra lúc 2 giờ sáng. Hiện app Sóc chỉ có bài đọc sốt trong `EMERGENCY` ở tab 🏥 Sức khoẻ
→ An toàn, không có chỗ nào ghi lại đợt sốt hay tính liều (đo 09/08: `ju.childFever` chưa tồn tại).

**Làm gì**
- Khoá mới `ju.childFever`: mỗi đợt sốt là một bản ghi `{id, batDau, doNhietDo:[{at,do}], lieu:[{at,thuoc,ml}], ketThuc}`.
- Nhập nhiệt độ một chạm (bàn phím số, bước 0,1 °C), vẽ đường nhiệt độ theo giờ trong đợt.
- Tính liều hạ sốt theo **cân nặng gần nhất** trong `ju.childGrowth`: paracetamol 10–15 mg/kg mỗi
  4–6 giờ (tối đa 60 mg/kg/ngày), ibuprofen 5–10 mg/kg mỗi 6–8 giờ cho bé trên 06 tháng. Quy ra
  **ml theo hàm lượng siro người dùng chọn** (80 mg/5 ml · 100 mg/5 ml · 150 mg/5 ml · 250 mg/5 ml).
- Đồng hồ đếm tới liều kế tiếp, và chặn cứng khi chưa đủ khoảng cách liều.
- Ghim mốc **phải đi viện ngay** lấy từ `CHILD_SOS` (co giật, li bì, thóp phồng, phát ban không mất
  khi ấn kính, sốt trên 03 ngày, bé dưới 03 tháng sốt bất kỳ mức nào).

**Bắt buộc**
- Ô cảnh báo thường trực: đây là số tham khảo theo cân nặng, **không thay cho khám bác sĩ**, và
  liều bác sĩ kê luôn thắng.
- **Không có cân nặng thì KHÔNG hiện liều** — hiện lời nhắc đi cân, tuyệt đối không đoán theo tuổi.
- Cân nặng ghi quá 90 ngày thì kêu vàng và hỏi lại trước khi tính.

**Nghiệm thu**
- Nhập cân 12 kg + siro 100 mg/5 ml → liều paracetamol ra khoảng 6,0–9,0 ml; đổi sang 250 mg/5 ml
  → ra 2,4–3,6 ml. Sai số ngoài dải này là hỏng.
- Bấm liều thứ hai cách liều đầu 02 giờ → app phải CHẶN, nêu còn bao lâu.
- Xoá hết `ju.childGrowth` → khối liều biến mất, thay bằng lời nhắc đi cân.
- Tổng 24 giờ vượt 60 mg/kg → app phải kêu, không cho bấm tiếp.

## 2. Biểu đồ tăng trưởng chuẩn WHO — CHỜ

**Đo lại 09/08/2026:** app Sóc ĐÃ có `GrowthWHO` + `GrowthChart` + `whoAt`/`whoBand` (dòng ~1091,
~1141, vẽ ở tab Sức khoẻ) — nhưng bảng `WHO_WEIGHT`/`WHO_HEIGHT` trong `data/child.json` là bản
**rút gọn theo mốc 3 tháng, chỉ 0–36 tháng, nội suy tuyến tính**, và vẫn còn một dòng chữ tham
khảo cứng chỉ hiện khi bé trong khoảng 18–24 tháng (dòng ~1897) — bé lớn hơn là dòng đó
**biến mất trong im lặng**. Việc còn lại là thay bản rút gọn bằng chuẩn LMS thật.

**Làm gì**
- Thay bảng rút gọn bằng bảng LMS của WHO Child Growth Standards, 0–60 tháng, hai giới, hai chỉ
  số: cân nặng theo tuổi và chiều cao theo tuổi. Nguồn: bảng LMS công bố công khai của WHO.
- Gỡ dòng tham khảo cứng 18–24 tháng, vì biểu đồ LMS đã phủ mọi tuổi.
- Tính z-score theo công thức LMS rồi quy ra bách phân vị; vẽ các đường P3 · P15 · P50 · P85 · P97
  bằng SVG thuần (app không có thư viện biểu đồ, đừng thêm CDN mới).
- Chấm mọi lần đo trong `ju.childGrowth` lên biểu đồ, nối thành đường của bé.
- Câu kết luận bằng tiếng người: *"Sóc đang ở khoảng kênh 50 — nằm trong vùng bình thường."*
  Dưới P3 hoặc trên P97 thì nêu rõ nên cho đi khám dinh dưỡng.

**Nghiệm thu**
- Bé trai 24 tháng nặng 12,2 kg phải ra xấp xỉ kênh 50 (z gần 0); 9,0 kg phải rơi xuống dưới P3.
- Đổi giới tính thì đường chuẩn phải đổi theo, không dùng chung một bảng.
- Bé 30 tháng vẫn thấy biểu đồ — tức đã bỏ được cái cổng cứng 18–24 tháng.

## 3. Cẩm nang: mốc ngôn ngữ theo tháng tuổi — CHỜ

**Đính chính 09/08/2026.** Mục này viết khi Cẩm nang còn nằm trong `index.html` với cơ chế
`GUIDE_KEYS`. Đo lại hiện trạng trên `soc/index.html`:

- **04 mảng giấc ngủ · cai bỉm · Montessori · STEAM: ĐÃ XONG** (commit `3b3d0b3`) — nay là tab
  🌱 Lớn lên → Học sớm, cộng phần bổ sung ở tab Giấc ngủ và Tập bô.
- **Chuẩn bị đi lớp: ĐÃ CÓ** — tab Đi lớp (`SCHOOL_PICK` · `SCHOOL_START` · `TEACHER_NOTE` ·
  `SCHOOL_ILL` · `CHILD_DOCS`).
- **Phát triển theo tháng tuổi: ĐÃ CÓ** — tab Mốc & lời nói (`CHILD_MILESTONES` · `DEV_REDFLAGS`).
- **Ngôn ngữ & giao tiếp: CÒN MỎNG** — chỉ có sổ đếm từ (`ju.childWords`) và một khối
  "Con chậm nói?". Đây là phần còn lại của mục này.

**Làm gì** — dựng bảng **mốc ngôn ngữ theo tháng tuổi** (12 · 18 · 24 · 30 · 36 tháng: số từ
trung bình, ghép câu mấy từ, người lạ hiểu được bao nhiêu phần trăm) và **cách chơi để con bật
nói** (đặt tên đồ vật, chờ con nói thay vì đưa ngay, mở rộng câu con vừa nói, đọc sách tương tác,
song ngữ trong nhà). Kèm mốc phải cho đi khám thính lực hoặc âm ngữ trị liệu.

Đặt dữ liệu vào `data/child.json`, khai placeholder trong `window.JUD`, vẽ ở tab `develop`.
Nguồn: WHO, Viện Dinh dưỡng Quốc gia, học viện nhi khoa. Viết cho người không học ngành y đọc hiểu.

**Nghiệm thu** — mở `/soc/index.html`, vào tab Mốc & lời nói thấy bảng mốc ngôn ngữ; gõ
"chậm nói", "24 tháng", "bao nhieu tu" vào ô tìm 🔍 đều ra kết quả (tức đã nạp `searchIndex()`);
`python3 -c "import json;d=json.load(open('data/child.json'));print(len(d))"` chạy được, tức JSON
vẫn hợp lệ sau khi thêm khoá.

## 4. Thực đơn xoay tuần + danh sách đi chợ — CHỜ

`WEAN_MENU` đang là bảng tĩnh 07 ngày, tuần nào cũng y hệt.

**Làm gì** — dựng 03–04 tuần thực đơn xoay vòng theo số tuần trong năm, và nút sinh danh sách đi
chợ gom nguyên liệu cả tuần, nối vào mục món ăn sẵn có của app (`ju.menu` · `ju.food`).

**Nghiệm thu** — đổi ngày hệ thống sang tuần kế tiếp thì thực đơn phải khác; danh sách đi chợ
gộp đúng nguyên liệu trùng thay vì liệt kê hai lần.

## 5. Chia việc hai vợ chồng — CHỜ

**Đo lại 09/08/2026:** app Sóc ĐÃ có `DutyBoard` (dòng ~936, vẽ ở tab Nuôi dạy → Bố mẹ) chia việc
theo `DUTY_SLOTS` — nhưng đó là bảng phân công tĩnh, không xoay vòng, không đếm, và không báo sang
máy kia. Việc còn lại là phần động.

**Làm gì** — phiên trực: tối nay ai dỗ ngủ, ai dậy đêm, xoay vòng và ghi lại số đêm mỗi người đã
trực. Khi một máy ghi "con sốt" hoặc mở đợt ốm mới, máy kia nhận thông báo. Dùng lại lớp `Cloud`
sẵn có của `soc/index.html` (chỉ đụng `CHILD_KEYS`, trộn chứ không đè).

**Nghiệm thu** — mở hai cửa sổ trình duyệt cùng một cặp, ghi ở cửa sổ này thì cửa sổ kia hiện
trong vòng vài giây.
