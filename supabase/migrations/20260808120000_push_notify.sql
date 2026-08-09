-- Bắn web-push khi nửa kia có lời nhắn mới.
--
-- Cách chạy: Supabase Dashboard → SQL Editor → dán cả file này → Run.
-- Trước khi chạy, sửa 2 dòng `-- CẤU HÌNH` bên dưới cho đúng project.
--
-- Ý tưởng: app ghi TOÀN BỘ state vào 1 hàng `justus_data`, nên mỗi lần đồng bộ
-- là một UPDATE. Trigger dưới đây so mảng `ju.notes` cũ/mới NGAY TRONG SQL,
-- chỉ khi có lời nhắn mới mới gọi Edge Function `push-notify`, và chỉ gửi đúng
-- phần mới (không gửi cả lịch sử chat).

create extension if not exists pg_net with schema extensions;

-- Bảng subscription (app đã upsert vào đây sẵn; tạo nếu chưa có).
create table if not exists public.justus_push_subs (
  endpoint   text primary key,
  couple_id  uuid not null,
  user_id    uuid not null,
  role       text not null check (role in ('a','b')),
  p256dh     text not null,
  auth       text not null,
  ua         text,
  created_at timestamptz not null default now()
);
create index if not exists justus_push_subs_couple_idx on public.justus_push_subs (couple_id, role);

-- ===================== CẤU HÌNH =====================
-- Đổi <PROJECT_REF> thành ref project Supabase, và dán service_role key.
-- Lưu ở cấp database nên chỉ phải làm một lần.
-- LƯU Ý: service_role key là bí mật — chỉ chạy trong SQL Editor, ĐỪNG commit key vào repo.
alter database postgres set app.push_fn_url = 'https://<PROJECT_REF>.supabase.co/functions/v1/push-notify';
alter database postgres set app.push_fn_key = '<SERVICE_ROLE_KEY>';
-- ====================================================

create or replace function public.ju_notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_new   jsonb;
  v_url   text := current_setting('app.push_fn_url', true);
  v_key   text := current_setting('app.push_fn_key', true);
begin
  if v_url is null or v_key is null then
    return new;  -- chưa cấu hình thì im lặng bỏ qua, không làm hỏng việc ghi dữ liệu
  end if;

  -- Lời nhắn có trong bản MỚI mà không có trong bản CŨ (so theo id).
  select jsonb_agg(n.value)
    into v_new
  from jsonb_array_elements(coalesce(new.data -> 'ju.notes', '[]'::jsonb)) as n(value)
  where n.value ->> 'id' is not null
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(old.data -> 'ju.notes', '[]'::jsonb)) as o(value)
      where o.value ->> 'id' = n.value ->> 'id'
    );

  if v_new is null or jsonb_array_length(v_new) = 0 then
    return new;
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
                 'kind', 'notes',
                 'items', v_new
               )
  );

  return new;
end;
$$;

drop trigger if exists ju_notify_push_trg on public.justus_data;
create trigger ju_notify_push_trg
  after update on public.justus_data
  for each row
  when (old.data -> 'ju.notes' is distinct from new.data -> 'ju.notes')
  execute function public.ju_notify_push();
