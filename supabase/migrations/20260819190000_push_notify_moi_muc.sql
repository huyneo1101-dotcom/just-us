-- Mở rộng đẩy thông báo: không chỉ lời nhắn nữa (19/08/2026).
--
-- Cách chạy: Supabase Dashboard → SQL Editor → dán cả file này → Run.
-- (Bản 20260808120000_push_notify.sql phải chạy TRƯỚC — file này chỉ thay hàm,
--  không tạo lại bảng `justus_push_subs` hay hai biến cấu hình `app.push_fn_*`.)
--
-- Vì sao có file này: bản cũ chỉ so đúng mảng `ju.notes`, nên mọi thứ khác nửa kia
-- thêm vào — sự kiện, ngày nhớ, việc cần làm, món cần mua, đồ sắp hết hạn, giấy tờ,
-- check-in quán — đều không có đường ra khỏi app khi máy kia đang đóng. Không lỗi nào
-- phát ra: trigger vẫn chạy, vẫn trả về `new`, chỉ là không gọi gì.
--
-- Nay hàm duyệt một BẢNG KHOÁ. Mỗi khoá là một mảng trong cột `data`, so cũ/mới theo
-- `id` y như cách bản đầu làm với lời nhắn, và mỗi khoá gửi một `kind` riêng để
-- Edge Function chọn đúng câu chữ. Một lượt UPDATE có thể gọi hàm nhiều lần — mỗi
-- loại một lời gọi, cố ý, vì gộp lại thì phía kia không biết mục nào thuộc loại nào.

-- ⛔ ĐỊA CHỈ VÀ KHOÁ GỌI HÀM NAY NẰM TRONG BẢNG, KHÔNG CÒN Ở `app.push_fn_*`.
-- Bản 08/08 đặt hai giá trị này bằng `alter database postgres set`, mà vai chạy SQL
-- qua Management API KHÔNG có quyền đó (đo 19/08/2026: `42501: permission denied to
-- set parameter`). Hậu quả im lặng: `current_setting(...)` trả null ⇒ hàm thoát ngay
-- ở dòng đầu ⇒ trigger vẫn chạy, vẫn trả `new`, và **không thông báo nào từng được
-- gửi** kể từ ngày dựng. Bảng dưới đây bật RLS và KHÔNG có policy nào, nên chỉ
-- `service_role` và hàm `security definer` đọc được; khoá công khai của app không.
create table if not exists public.ju_push_cfg (
  k text primary key,
  v text not null
);
alter table public.ju_push_cfg enable row level security;
revoke all on public.ju_push_cfg from anon, authenticated;

create or replace function public.ju_notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url   text := coalesce((select v from public.ju_push_cfg where k = 'url'),
                           current_setting('app.push_fn_url', true));
  v_key   text := coalesce((select v from public.ju_push_cfg where k = 'key'),
                           current_setting('app.push_fn_key', true));
  v_khoa  text;
  v_kind  text;
  v_new   jsonb;
  -- khoá trong cột data  →  kind gửi cho Edge Function
  v_map   text[][] := array[
    ['ju.notes',     'notes'],
    ['ju.checkins',  'checkins'],
    ['ju.events',    'events'],
    ['ju.dates',     'dates'],
    ['ju.todos',     'todos'],
    ['ju.shop',      'shop'],
    ['ju.expiry',    'expiry'],
    ['ju.docs',      'docs']
  ];
  i int;
begin
  if v_url is null or v_key is null then
    return new;  -- chưa cấu hình thì im lặng bỏ qua, không làm hỏng việc ghi dữ liệu
  end if;

  for i in 1 .. array_length(v_map, 1) loop
    v_khoa := v_map[i][1];
    v_kind := v_map[i][2];

    -- Mục có trong bản MỚI mà không có trong bản CŨ (so theo id).
    select jsonb_agg(n.value)
      into v_new
    from jsonb_array_elements(coalesce(new.data -> v_khoa, '[]'::jsonb)) as n(value)
    where n.value ->> 'id' is not null
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(old.data -> v_khoa, '[]'::jsonb)) as o(value)
        where o.value ->> 'id' = n.value ->> 'id'
      );

    if v_new is not null and jsonb_array_length(v_new) > 0 then
      -- ⛔ Giấy tờ: chỉ gửi id + ngày hết hạn. Mọi thứ khác của mục đó đã mã hoá phía
      -- máy, và dù chưa mã hoá thì cũng không được đi qua máy chủ đẩy của Google/Apple.
      if v_kind = 'docs' then
        select jsonb_agg(jsonb_build_object('id', x.value ->> 'id', 'date', x.value ->> 'expiry'))
          into v_new
        from jsonb_array_elements(v_new) as x(value);
      end if;

      -- Gọi Edge Function không đồng bộ (pg_net) — không giữ transaction của app.
      perform extensions.net.http_post(
        url     := v_url,
        headers := jsonb_build_object(
                     'Content-Type', 'application/json',
                     'Authorization', 'Bearer ' || v_key
                   ),
        body    := jsonb_build_object(
                     'couple_id', new.couple_id,
                     'kind', v_kind,
                     'items', v_new
                   )
      );
    end if;
  end loop;

  return new;
end;
$$;

-- Trigger giữ nguyên tên và điều kiện của bản cũ; tạo lại cho chắc nếu chưa có.
drop trigger if exists ju_notify_push on public.justus_data;
create trigger ju_notify_push
  after update on public.justus_data
  for each row
  when (old.data is distinct from new.data)
  execute function public.ju_notify_push();
