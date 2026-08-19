#!/usr/bin/env python3
"""Cầu nối quản trị Supabase cho app Just Us — dùng chung cho mọi script phía máy chủ.

Hai việc:
  1. `khoa_service()` — trả về service_role key của project JustUs, lấy theo thứ tự:
     biến môi trường → `~/.config/api-keys.env` → hỏi Supabase CLI (đã đăng nhập sẵn).
     Lấy được từ CLI thì tự ghi vào file env (quyền 600) để lần sau khỏi gọi mạng.
  2. `chay_sql(sql)` — chạy câu lệnh SQL qua Management API bằng access token của
     Supabase CLI trong Keychain. Dùng để tạo bảng/policy, không dùng lúc chạy thường.

⛔ Không in giá trị khoá ra màn hình (quy tắc mục 14c) — chỉ in độ dài khi cần chẩn đoán.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

REF = "vvgkjgvzjeklaadusbne"          # project Supabase của Just Us
SB_URL = f"https://{REF}.supabase.co"
ENV = Path.home() / ".config" / "api-keys.env"
KHOA_ENV = "SUPABASE_SERVICE_KEY_JUSTUS"
CLI = Path.home() / "bin" / "supabase"
MGMT = "https://api.supabase.com/v1"


# ---------------------------------------------------------------- file env
def doc_env() -> dict:
    if not ENV.exists():
        return {}
    ra = {}
    for dong in ENV.read_text(encoding="utf-8").splitlines():
        dong = dong.strip()
        if not dong or dong.startswith("#") or "=" not in dong:
            continue
        k, v = dong.split("=", 1)
        ra[k.strip()] = v.strip().strip('"').strip("'")
    return ra


def ghi_env(khoa: str, gia_tri: str) -> None:
    """Ghi/ghi đè một khoá trong file env, giữ nguyên phần còn lại, quyền 600."""
    ENV.parent.mkdir(parents=True, exist_ok=True)
    dong_cu = ENV.read_text(encoding="utf-8").splitlines() if ENV.exists() else []
    ra, thay = [], False
    for d in dong_cu:
        if d.strip().startswith(khoa + "="):
            ra.append(f"{khoa}={gia_tri}")
            thay = True
        else:
            ra.append(d)
    if not thay:
        ra.append(f"{khoa}={gia_tri}")
    ENV.write_text("\n".join(ra).rstrip("\n") + "\n", encoding="utf-8")
    os.chmod(ENV, 0o600)


# ---------------------------------------------------------------- khoá
def _hoi_cli_service_key() -> str | None:
    """Hỏi Supabase CLI. CLI chưa đăng nhập hoặc không có thì trả None, không ném."""
    if not CLI.exists():
        return None
    try:
        p = subprocess.run(
            [str(CLI), "projects", "api-keys", "--project-ref", REF, "--output", "json"],
            capture_output=True, text=True, timeout=90,
        )
    except (subprocess.TimeoutExpired, OSError):
        return None
    if p.returncode != 0:
        return None
    try:
        goi = json.loads(p.stdout)
    except json.JSONDecodeError:
        # CLI cũ in thẳng mảng, bản mới bọc trong {"keys": [...]}
        return None
    ds = goi.get("keys") if isinstance(goi, dict) else goi
    if not isinstance(ds, list):
        return None
    for k in ds:
        if not isinstance(k, dict):
            continue
        vai = (k.get("secret_jwt_template") or {}).get("role") if isinstance(k.get("secret_jwt_template"), dict) else None
        if k.get("name") == "service_role" or k.get("id") == "service_role" or vai == "service_role":
            v = k.get("api_key")
            if isinstance(v, str) and len(v) > 20 and "·" not in v:
                return v
    return None


def khoa_service(bat_buoc: bool = True) -> str:
    v = os.environ.get(KHOA_ENV) or doc_env().get(KHOA_ENV)
    if v:
        return v
    v = _hoi_cli_service_key()
    if v:
        ghi_env(KHOA_ENV, v)
        return v
    if bat_buoc:
        raise SystemExit(
            f"❌ thiếu {KHOA_ENV}. Chạy `~/bin/supabase login` rồi thử lại, "
            f"hoặc cắm tay bằng: python3 {Path(__file__).resolve()} --cam"
        )
    return ""


def _access_token() -> str | None:
    """Access token của Supabase CLI (Keychain macOS), dùng cho Management API."""
    v = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if v:
        return v
    for dv in ("Supabase CLI", "supabase"):
        try:
            p = subprocess.run(
                ["security", "find-generic-password", "-s", dv, "-w"],
                capture_output=True, text=True, timeout=20,
            )
        except (subprocess.TimeoutExpired, OSError):
            continue
        if p.returncode == 0 and p.stdout.strip():
            return p.stdout.strip()
    return None


# ---------------------------------------------------------------- gọi API
def _goi(url: str, *, method="GET", body=None, headers=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    # ⚠ Management API của Supabase đứng sau Cloudflare, và Cloudflare CHẶN
    # User-Agent mặc định của urllib bằng mã 403 «error code: 1010» — đọc ra
    # giống hệt token hỏng hay hết quyền, nên rất dễ đi sửa nhầm chỗ (đo
    # 19/08/2026: cùng token, chỉ thêm dòng dưới là câu SQL chạy được).
    req.add_header("User-Agent", "justus-sb-admin/1.0")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"error": raw[:500]}


def chay_sql(sql: str):
    """Chạy SQL qua Management API. Ném SystemExit kèm lý do nếu không chạy được."""
    tok = _access_token()
    if not tok:
        raise SystemExit("❌ không tìm thấy access token của Supabase CLI — chạy `~/bin/supabase login`")
    ma, ra = _goi(
        f"{MGMT}/projects/{REF}/database/query",
        method="POST", body={"query": sql},
        headers={"Authorization": f"Bearer {tok}"},
    )
    if ma >= 300:
        raise SystemExit(f"❌ SQL lỗi {ma}: {json.dumps(ra, ensure_ascii=False)[:600]}")
    return ra


def rest(duong: str, *, method="GET", body=None, params="", timeout=60):
    """Gọi PostgREST bằng service_role key (bỏ qua RLS)."""
    key = khoa_service()
    url = f"{SB_URL}/rest/v1/{duong}" + (f"?{params}" if params else "")
    return _goi(url, method=method, body=body, timeout=timeout, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "return=representation,resolution=merge-duplicates",
    })


if __name__ == "__main__":
    if "--cam" in sys.argv:
        import getpass
        v = getpass.getpass("Dán service_role key của project JustUs (không hiện lên màn hình): ").strip()
        if len(v) < 20:
            raise SystemExit("❌ khoá quá ngắn, chưa ghi gì")
        ghi_env(KHOA_ENV, v)
        print(f"✅ đã ghi {KHOA_ENV} vào {ENV} (dài {len(v)} ký tự)")
    elif "--kiem" in sys.argv:
        k = khoa_service(bat_buoc=False)
        print(f"service_role key: {'có, dài ' + str(len(k)) + ' ký tự' if k else 'CHƯA CÓ'}")
        print(f"access token CLI: {'có' if _access_token() else 'CHƯA CÓ'}")
    else:
        print(__doc__)
