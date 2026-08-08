# Bật thông báo khi ĐÓNG app (web-push)

Trước đây app chỉ nhắc được **khi đang mở**: `NotiRunner` trong `index.html` là một
`useEffect` chạy trong trang (`setInterval` 15 phút + khi app quay lại foreground).
App đóng → không ai kiểm tra → không có thông báo. Phía máy khách đã có sẵn
(`subscribePush()` + handler `push` trong `sw.js`), chỉ thiếu **server đứng ra gửi**.

Hai file này lấp nốt phần thiếu:

| File | Việc |
|---|---|
| `supabase/functions/push-notify/index.ts` | Edge Function: nhận lời nhắn mới → bắn web-push cho nửa kia |
| `supabase/migrations/20260808120000_push_notify.sql` | Trigger trên `justus_data`: lọc lời nhắn mới rồi gọi function |

Luồng: máy A gửi lời nhắn → app đồng bộ, UPDATE `justus_data` → trigger so
`ju.notes` cũ/mới **ngay trong SQL** → chỉ khi có lời nhắn mới thì POST phần mới
sang Edge Function → function tra `justus_push_subs` lấy subscription của **người
kia** rồi gửi push → `sw.js` trên máy B hiện thông báo, kể cả khi app đã đóng.

---

## 1. Chuẩn bị cặp khoá VAPID

Public key đang dùng trong `index.html` (`VAPID_PUBLIC`, dòng ~5189):

```
BBGZe7N9CydCcQhvky9O2oVqzHPnV5Xbhcn7QBGGEFykxsDCoTI1nFpCJtaXkaG3wTH0xQM98RSaJlQNky795EM
```

**Còn giữ private key khớp với nó** → dùng luôn, sang bước 2.

**Mất rồi** → tạo cặp mới:

```bash
npx web-push generate-vapid-keys
```

rồi thay `VAPID_PUBLIC` trong `index.html` bằng public key mới.
Không phải làm gì thêm: `subscribePush()` đã tự phát hiện máy đang giữ
subscription của khoá cũ, tự `unsubscribe`, xoá dòng cũ trong `justus_push_subs`
rồi đăng ký lại bằng khoá mới.

## 2. Nạp secret cho Edge Function

```bash
supabase secrets set \
  VAPID_PUBLIC="<public key>" \
  VAPID_PRIVATE="<private key>" \
  VAPID_SUBJECT="mailto:huyneo1101@gmail.com"
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` Supabase tự cấp, không cần set.

## 3. Deploy function

```bash
supabase functions deploy push-notify
```

## 4. Chạy migration

Mở **Supabase Dashboard → SQL Editor**, dán cả file
`supabase/migrations/20260808120000_push_notify.sql`, **sửa 2 dòng dưới mục
`-- CẤU HÌNH`** (project ref + service_role key) rồi Run.

> Service role key là bí mật — chỉ dán trong SQL Editor. **Đừng commit vào repo.**

## 5. Thử

1. Cả hai máy: **Cá nhân → 🔔 Thông báo** → bật công tắc chính, cho phép quyền,
   và bật mục **Nhắn nhau**. (Công tắc chính mặc định **tắt** — không bật thì
   kể cả push về máy cũng không đăng ký được.)
2. Kiểm tra đã đăng ký: bảng `justus_push_subs` phải có **2 dòng**, `role` là `a` và `b`.
3. **Đóng hẳn** app trên máy B. Máy A gửi một lời nhắn.
4. Máy B phải hiện thông báo trong vài giây.

Không thấy gì thì xem log: `supabase functions logs push-notify`.
Function trả về `{ok:true, sent:N}` — `sent:0` nghĩa là không tìm thấy
subscription của người nhận (thường do máy kia chưa bật thông báo).

---

## Ghi chú

- **iPhone**: web-push chỉ chạy khi app đã được **"Thêm vào màn hình chính"**
  (iOS 16.4+). Mở bằng tab Safari thường sẽ không bao giờ có thông báo.
- Function tự dọn subscription chết: gặp HTTP 404/410 thì xoá dòng đó khỏi
  `justus_push_subs`.
- Muốn nhắc thêm mục khác (vd check-in ảnh): thêm một dòng vào `KINDS` trong
  `index.ts` và thêm khoá tương ứng trong file SQL — cấu trúc đã để sẵn cho việc đó.
- Thông báo **trong lúc app đang mở** vẫn do `NotiRunner` lo như cũ; hai đường
  này độc lập, không đụng nhau (đã đặt `tag` khác nhau nên không đè nhau).
