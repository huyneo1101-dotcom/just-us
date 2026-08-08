#!/usr/bin/env bash
# Bật thông báo web-push cho Just Us — chạy MỘT LẦN trên máy anh.
#
#   VAPID_PRIVATE='<private key>' bash supabase/setup-push.sh
#
# Script tự làm: nạp secret → deploy Edge Function → tạo trigger trong database.
# Cần: Supabase CLI (https://supabase.com/docs/guides/cli) và đã `supabase login`.

set -euo pipefail

PROJECT_REF="${PROJECT_REF:-vvgkjgvzjeklaadusbne}"   # lấy từ SB_URL trong index.html
VAPID_PUBLIC="${VAPID_PUBLIC:-BFj7hLMvv3G60I0gTYNAvblUBtL4QaYgwV3Go6nzNQDpvkhrhsDxAEOaz8AMaBgU-yrNy6HQo0_ad_5qCZ7bqog}"
VAPID_SUBJECT="${VAPID_SUBJECT:-mailto:huyneo1101@gmail.com}"

cd "$(dirname "$0")/.."

say(){ printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
die(){ printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v supabase >/dev/null || die "Chưa có Supabase CLI. Cài: brew install supabase/tap/supabase (hoặc npm i -g supabase)"
[ -n "${VAPID_PRIVATE:-}" ] || die "Thiếu VAPID_PRIVATE. Chạy lại kiểu: VAPID_PRIVATE='<khoá bí mật>' bash supabase/setup-push.sh"

# Kiểm tra private key có đúng khớp public key không — sai khoá thì push sẽ im lặng thất bại,
# rất khó lần ra, nên chặn ngay ở đây.
say "Kiểm tra cặp khoá VAPID"
# Suy public key TỪ private scalar rồi so — không dùng createPublicKey(jwk) vì hàm đó
# chỉ trả lại đúng x/y mình đưa vào, sai khoá vẫn lọt.
VAPID_PUBLIC="$VAPID_PUBLIC" node -e '
const {createECDH}=require("crypto");
const ec=createECDH("prime256v1");
try{ ec.setPrivateKey(Buffer.from(process.env.VAPID_PRIVATE,"base64url")); }
catch(e){ console.error("  VAPID_PRIVATE không đọc được (phải là base64url 32 byte)"); process.exit(1); }
if(ec.getPublicKey().toString("base64url")!==process.env.VAPID_PUBLIC){
  console.error("  Private key KHÔNG khớp VAPID_PUBLIC trong index.html");
  process.exit(1);
}
console.log("  ✓ khoá khớp");
' || die "Cặp khoá VAPID không hợp lệ — push sẽ im lặng thất bại, dừng ở đây cho đỡ mất công dò"

say "Liên kết project $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF" >/dev/null

say "Nạp secret cho Edge Function"
supabase secrets set \
  VAPID_PUBLIC="$VAPID_PUBLIC" \
  VAPID_PRIVATE="$VAPID_PRIVATE" \
  VAPID_SUBJECT="$VAPID_SUBJECT" >/dev/null
echo "  ✓ đã nạp VAPID_PUBLIC / VAPID_PRIVATE / VAPID_SUBJECT"

say "Deploy function push-notify"
supabase functions deploy push-notify

say "Lấy service_role key để trigger gọi được function"
SERVICE_KEY="$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json \
  | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const k=JSON.parse(s).find(x=>x.name==="service_role");if(!k){console.error("không tìm thấy service_role key");process.exit(1);}process.stdout.write(k.api_key)})')"
[ -n "$SERVICE_KEY" ] || die "Không lấy được service_role key"
echo "  ✓ đã lấy (không in ra, không ghi vào repo)"

say "Tạo trigger trong database"
TMP_SQL="$(mktemp -t ju-push-XXXXXX.sql)"
trap 'rm -f "$TMP_SQL"' EXIT
sed -e "s|<PROJECT_REF>|$PROJECT_REF|g" \
    -e "s|<SERVICE_ROLE_KEY>|$SERVICE_KEY|g" \
    supabase/migrations/20260808120000_push_notify.sql > "$TMP_SQL"

# Ưu tiên chạy thẳng qua psql nếu có DB_URL; không thì bảo dán vào SQL Editor.
if [ -n "${DB_URL:-}" ] && command -v psql >/dev/null; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$TMP_SQL"
  echo "  ✓ trigger đã tạo"
else
  OUT="$(pwd)/ju-push-ready.sql"
  cp "$TMP_SQL" "$OUT"
  cat <<EOF

  Bước cuối cần anh dán tay (script không có mật khẩu database):

    1. Mở  https://supabase.com/dashboard/project/$PROJECT_REF/sql/new
    2. Dán toàn bộ nội dung file:  $OUT
    3. Run

  File đó CÓ CHỨA service_role key — chạy xong thì xoá đi:
    rm "$OUT"
  (đã thêm vào .gitignore nên không lỡ commit được)

  Muốn script tự chạy nốt bước này thì đưa thêm DB_URL:
    DB_URL='postgresql://postgres:<mật khẩu>@db.$PROJECT_REF.supabase.co:5432/postgres' \\
      VAPID_PRIVATE='...' bash supabase/setup-push.sh
EOF
fi

say "Xong. Thử ngay:"
cat <<'EOF'
  1. Cả hai máy: Cá nhân → 🔔 Thông báo → bật công tắc chính + mục "Nhắn nhau"
  2. Kiểm bảng justus_push_subs phải có 2 dòng, role là 'a' và 'b'
  3. Đóng HẲN app máy kia rồi gửi thử một lời nhắn
  Lỗi thì xem log:  supabase functions logs push-notify
EOF
