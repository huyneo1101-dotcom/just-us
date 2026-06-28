# Just Us 💞 — Của riêng hai đứa

Web app riêng cho cặp đôi: wishlist quà, chỗ đi chơi, ý tưởng hẹn hò theo budget, quán/món muốn thử,
link gửi nhau, ảnh chung, sự kiện & ngày kỷ niệm, quỹ chung, đi chợ, lời nhắn yêu thương…

Một file `index.html` tự chứa (React + Leaflet qua CDN). Backend đồng bộ + đăng nhập dùng **Supabase**.

## Chạy thử trên máy (dev)
Mọi tính năng đám mây (đăng nhập, đồng bộ 2 máy, ảnh) **cần chạy qua http**, không chạy bằng nhấp đúp `file://`.

```bash
# trong thư mục JustUs/
node .preview-server.js     # mở http://localhost:4182
```
(Hoặc bất kỳ static server nào, miễn là phục vụ `index.html` qua http/https.)

## Đăng lên mạng (cho điện thoại)
Trang tĩnh — deploy lên **Netlify** là xong, không cần cấu hình Supabase thêm.

**Cập nhật khi sửa app:** chỉ cần
```bash
git add -A
git commit -m "Cập nhật ..."
git push
```
→ Netlify tự build lại và lên web sau ~20 giây (nếu đã nối repo này với Netlify).

### Nối Netlify lần đầu (làm 1 lần)
1. Vào https://app.netlify.com → **Add new site → Import an existing project**.
2. Chọn **GitHub**, cho phép truy cập, chọn repo này.
3. Build command để **trống**, Publish directory để **`.`** (đã có sẵn trong `netlify.toml`).
4. **Deploy** → nhận URL dạng `ten-cua-ban.netlify.app`. Mở trên điện thoại để dùng.

## Tài khoản & quyền riêng tư
- Đăng nhập bằng email + mật khẩu (Supabase Auth). Mỗi cặp đôi có **mã mời** để ghép 2 máy.
- Dữ liệu & ảnh được bảo vệ bằng RLS theo tài khoản — chỉ 2 người trong cặp đôi xem/sửa được.

## Cấu hình Supabase
`SB_URL` và `SB_KEY` (publishable key — công khai được, an toàn vì có RLS) nằm trong `index.html`.
