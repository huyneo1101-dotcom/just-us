# Cách đặt câu hỏi & prompt cho repo Just Us

Tài liệu cho chủ repo. Quy tắc vận hành (Claude phải chấm prompt sau mỗi lượt) nằm ở `CLAUDE.md`,
mục *Chế độ huấn luyện prompt*. File này là phần giáo trình.

---

## 1. Khung 5 mảnh — thang điểm

Một prompt tốt cho việc code có 5 mảnh. Không phải lúc nào cũng cần đủ 5, nhưng thiếu mảnh nào thì
Claude phải đoán — mà đoán là nguồn gốc của "làm sai ý".

| Mảnh | Câu hỏi nó trả lời | Ví dụ trong repo này |
|---|---|---|
| **Neo** | Chỗ nào? | "component `LoveJar`", "tab Hẹn hò → mục Quán ăn", "`data/dishes.json`" |
| **Mục tiêu** | Muốn kết quả gì? (hành vi, không phải cách làm) | "mỗi món hiện được nhiều ảnh, vuốt ngang để xem" |
| **Ràng buộc** | Cấm gì / giữ gì? | "đừng đụng phần đồng bộ Supabase", "giữ nguyên dữ liệu cũ" |
| **Tiêu chí xong** | Làm sao biết là xong? | "mở app trên điện thoại thấy 3 ảnh, bấm ảnh thứ 2 phóng to được" |
| **Chế độ** | Claude được tự quyết tới đâu? | "làm luôn và merge" / "kế hoạch trước đã" / "trả lời thôi, đừng sửa code" |

**Mảnh quan trọng nhất với repo này là Neo.** `index.html` có ~8290 dòng. Prompt "sửa chỗ hiện danh sách
món" bắt Claude grep mò 3–4 lượt; prompt "trong `DishList`, chỗ render thẻ món" thì vào thẳng.
Không cần biết tên hàm — chỉ cần mô tả **đường đi trong app**: "tab nào → nút nào → màn hình nào".

---

## 2. Chữa từ mơ hồ

Quy tắc chung: **từ đánh giá** (đẹp, gọn, tối ưu, chuẩn) là ý kiến trong đầu mình, Claude không đọc được.
Đổi sang **từ mô tả** (cái gì, ở đâu, thành ra sao).

| Đừng viết | Viết thế này |
|---|---|
| "sửa lại cho đẹp" | "nút Lưu đang sát mép quá, cho cách mép 16px và bo góc tròn hơn" |
| "app lỗi rồi" | "bấm tab Sóc → trắng màn hình. Console báo: `Unexpected token '<'`" |
| "tối ưu lại đi" | "app mở lần đầu mất 6 giây, muốn xuống dưới 3" *(hoặc)* "hàm này lặp 3 chỗ, gộp lại một chỗ" |
| "thêm tính năng ghi chú" | "trong mỗi mục Giấy tờ, thêm ô ghi chú nhiều dòng, lưu cùng chỗ với các trường khác" |
| "làm giống app kia" | mô tả **hành vi**: "vuốt trái vào một dòng thì hiện nút Xoá màu đỏ" |
| "kiểm tra kỹ nhé" | "chạy smoke-test và báo kết quả trước khi merge" |
| "cái này" / "chỗ đó" | tên tab + tên nút + chữ hiển thị trên màn hình |

Ba thói quen về từ ngữ:

- **Dán lỗi thật, đừng kể lại lỗi.** Một dòng Console copy nguyên văn giá trị bằng cả đoạn văn mô tả.
- **Phân biệt "muốn" và "đang bị".** Nói cả hai thì Claude biết khoảng cách cần lấp.
- **Nói "đừng".** Ràng buộc âm rất rẻ mà cực hiệu quả: "đừng đổi cấu trúc `ju.food`",
  "đừng thêm thư viện mới", "đừng sửa file nào ngoài `index.html`".

---

## 3. Ba lỗi hay mắc nhất

**Lỗi 1 — Nhồi nhiều việc vào một prompt.**
"Sửa lỗi ảnh, thêm nút chia sẻ, đổi màu theme, mà nhớ bump cache" → cái nào cũng nông, và nếu hỏng thì
không biết hỏng vì cái nào. → Một prompt = một mục tiêu. Việc lớn thì tách.

**Lỗi 2 — Ra lệnh cách làm thay vì nói kết quả muốn có.**
"Dùng `useMemo` cho danh sách món" → nếu chẩn đoán sai thì Claude làm sai theo. → Nói triệu chứng
("cuộn danh sách 232 món bị giật"), để phần chẩn đoán cho Claude. Trừ khi *thật sự* muốn ép cách làm —
lúc đó nói rõ: "tao muốn dùng cách X, kể cả có cách khác tốt hơn."

**Lỗi 3 — Không nói chế độ**, rồi bực vì Claude hỏi quá nhiều hoặc tự tiện quá nhiều. → Mở đầu bằng một
trong ba từ khoá:

- `Trả lời thôi` → không sửa file.
- `Kế hoạch trước` → trình bày cách làm, chờ duyệt.
- `Làm luôn` → sửa, test, commit, merge (repo này đã cho phép — xem *Quy tắc phát hành*).

---

## 4. Mẫu copy-paste

**Sửa lỗi**
```
[Tab X → nút Y] bấm vào thì <hiện tượng>.
Console: <dán nguyên văn>
Mong muốn: <hành vi đúng>
Làm luôn, nhớ smoke-test trước khi merge.
```

**Thêm tính năng**
```
Chỗ: <đường đi trong app>
Muốn: <mô tả hành vi người dùng thấy>
Dữ liệu: lưu vào <khoá ju.*> / thêm trường <tên>
Đừng: đụng <phần nào>
Xong = <tiêu chí kiểm được bằng mắt>
Kế hoạch trước đã.
```

**Hỏi hiểu code**
```
Trả lời thôi, đừng sửa gì.
Giải thích <cơ chế> hoạt động thế nào, chỉ chỗ nó nằm.
```

**Sửa nội dung dữ liệu tĩnh**
```
Thêm/sửa <mục> trong data/<file>.json.
Nội dung: <liệt kê>
Nhớ bump CACHE trong sw.js.
```
