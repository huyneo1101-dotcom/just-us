#!/usr/bin/env python3
"""Nhắc mục tới hạn của Just Us khi app đang ĐÓNG — chạy trên Mac mỗi sáng.

Vì sao cần: máy nhắc trong app (`NotiRunner`) chỉ chạy khi app đang mở, còn trigger
`ju_notify_push` chỉ bắn khi nửa kia VỪA THÊM gì đó. Mục đến hạn theo lịch — sự kiện
còn 1 ngày, đồ sắp hết hạn, giấy tờ hết hạn, việc quá hạn — không ai «thêm» vào lúc
nó tới hạn, nên trước 19/08/2026 chúng không có đường nào ra khỏi app.

Cách chạy:
    python3 /Users/Huy/Claude/App/JustUs/scripts/nhac-toi-han.py            # gửi thật
    python3 /Users/Huy/Claude/App/JustUs/scripts/nhac-toi-han.py --thu      # chỉ in ra
    python3 /Users/Huy/Claude/App/JustUs/scripts/nhac-toi-han.py --tu-kiem  # bộ ca

⚠ PHỦ ĐƯỢC 06 NHÓM, cố ý chưa phủ 03 nhóm còn lại:
  ✅ sukien · ngayNho (dương lịch) · viec · hanDung · giayTo · kyNiem
  ❌ tamLinh và ngày nhớ ÂM LỊCH — cần thuật toán âm dương lịch đang nằm trong
     `nguon/app.jsx`; port sang đây là chép bản thứ hai của cùng một luật, mà hai bản
     lệch nhau thì không lỗi nào phát ra. Chờ bóc khối lịch ra file dùng chung.
  ❌ chuky — dữ liệu chu kỳ nằm trong `ju.period*`, đang chỉ hiện trong app.
Sổ đã nhắc để ở `logs/nhac-toi-han.json` (không phải /tmp — file mang dữ liệu riêng).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sb_admin  # noqa: E402

SO = Path(__file__).resolve().parent / "logs" / "nhac-toi-han.json"
# Nhóm nào tắt trong `ju.noti.cats` thì không nhắc. Khoá trùng tên với app.
NHOM = ("kyNiem", "sukien", "ngayNho", "viec", "hanDung", "giayTo")


def hom_nay() -> date:
    return date.today()


def _ngay(s) -> date | None:
    s = str(s or "")[:10]
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None


def con_may_ngay(iso, moc: date | None = None) -> int | None:
    """Số ngày từ hôm nay tới `iso`. Âm = đã qua. Không đọc được ngày ⇒ None."""
    d = _ngay(iso)
    return None if d is None else (d - (moc or hom_nay())).days


def toi_ngay_sinh_nhat(iso, moc: date | None = None) -> int | None:
    """Số ngày tới lần kỷ niệm/sinh nhật KẾ TIẾP của một ngày trong quá khứ."""
    d = _ngay(iso)
    if d is None:
        return None
    m = moc or hom_nay()
    for nam in (m.year, m.year + 1):
        try:
            moc_nam = date(nam, d.month, d.day)
        except ValueError:          # 29/02 của năm không nhuận
            moc_nam = date(nam, 3, 1) if d.month == 2 else None
            if moc_nam is None:
                continue
        if moc_nam >= m:
            return (moc_nam - m).days
    return None


def duoi(d: int) -> str:
    if d < 0:
        return " — đã quá hạn"
    if d == 0:
        return " — hôm nay"
    return f" — còn {d} ngày"


def tinh_toi_han(data: dict, moc: date | None = None) -> list[dict]:
    """Đọc một hàng `justus_data` → danh sách mục cần nhắc hôm nay.

    Mỗi mục: {id, title, body, cat}. `id` phải ỔN ĐỊNH trong ngày để sổ chống nhắc lặp
    hoạt động, nên nó gắn với id của bản ghi chứ không gắn với thứ tự.
    """
    moc = moc or hom_nay()
    noti = data.get("ju.noti") or {}
    cats = noti.get("cats") or {}
    bat = lambda k: cats.get(k) is not False and k in NHOM  # noqa: E731
    ra: list[dict] = []
    ds = lambda k: [x for x in (data.get(k) or []) if isinstance(x, dict)]  # noqa: E731

    if bat("kyNiem"):
        ngay_yeu = (data.get("ju.setup") or {}).get("loveDate")
        d = toi_ngay_sinh_nhat(ngay_yeu, moc)
        if d is not None and d <= 2:
            ra.append({"id": "anniv", "cat": "kyNiem",
                       "title": "💞 Kỷ niệm ngày yêu nhau" + duoi(d),
                       "body": "Hôm nay nhớ dành cho nhau chút gì đó nhé"})

    if bat("sukien"):
        for e in ds("ju.events"):
            d = con_may_ngay(e.get("date"), moc)
            lead = e.get("remind")
            lead = 1 if lead is None else int(lead)
            if d is not None and 0 <= d <= lead:
                ra.append({"id": "ev" + str(e.get("id") or e.get("title")), "cat": "sukien",
                           "title": "📅 " + str(e.get("title") or "Sự kiện") + duoi(d),
                           "body": str(e.get("note") or "Mở mục Sự kiện để xem")})

    if bat("ngayNho"):
        for e in ds("ju.dates"):
            if e.get("lunar"):
                continue                     # ngày âm lịch: chưa phủ, xem đầu file
            d = toi_ngay_sinh_nhat(e.get("date"), moc)
            lead = e.get("remind")
            lead = 1 if lead is None else int(lead)
            if d is not None and 0 <= d <= lead:
                ra.append({"id": "dt" + str(e.get("id") or e.get("title")), "cat": "ngayNho",
                           "title": str(e.get("icon") or "🎂") + " " + str(e.get("title") or "Ngày nhớ") + duoi(d),
                           "body": "Mở mục Ngày nhớ để xem"})

    if bat("viec"):
        for t in ds("ju.todos"):
            if t.get("done") or not t.get("due"):
                continue
            d = con_may_ngay(t.get("due"), moc)
            if d is not None and d <= 0:
                ra.append({"id": "td" + str(t.get("id") or t.get("title")), "cat": "viec",
                           "title": "✅ " + str(t.get("title") or "Một việc") + duoi(d),
                           "body": "Mở mục Việc cần làm để xem"})

    if bat("hanDung"):
        for x in ds("ju.expiry"):
            d = con_may_ngay(x.get("date"), moc)
            if d is not None and d <= 3:
                ra.append({"id": "exp" + str(x.get("id") or x.get("name")), "cat": "hanDung",
                           "title": "⏳ " + str(x.get("name") or "Một món") + duoi(d),
                           "body": "Mở mục Hạn dùng để xem"})

    if bat("giayTo"):
        # ⛔ Tên giấy tờ đã mã hoá đầu-cuối. Chỉ nhắc CHUNG, không đưa gì vào tiêu đề.
        n = 0
        for x in ds("ju.docs"):
            d = con_may_ngay(x.get("expiry"), moc)
            if d is not None and d <= 30:
                n += 1
        if n:
            ra.append({"id": "doc%d" % n, "cat": "giayTo",
                       "title": "🗂️ %d giấy tờ sắp hết hạn" % n,
                       "body": "Mở mục Giấy tờ để xem là giấy nào"})
    return ra


# ------------------------------------------------------------------ sổ đã nhắc
def doc_so() -> dict:
    try:
        return json.loads(SO.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def ghi_so(so: dict) -> None:
    SO.parent.mkdir(parents=True, exist_ok=True)
    SO.write_text(json.dumps(so, ensure_ascii=False), encoding="utf-8")
    os.chmod(SO, 0o600)


def loc_chua_nhac(cid: str, muc: list[dict], so: dict, ngay: str) -> list[dict]:
    da = so.get(cid) or {}
    if da.get("ngay") != ngay:
        da = {"ngay": ngay, "ids": []}
        so[cid] = da
    cu = set(da["ids"])
    moi = [m for m in muc if m["id"] not in cu]
    da["ids"] = sorted(cu | {m["id"] for m in moi})
    return moi


# ------------------------------------------------------------------ gửi
def gui(cid: str, muc: list[dict]) -> dict:
    key = sb_admin.khoa_service()
    body = json.dumps({"couple_id": cid, "kind": "nhac", "items": muc}).encode()
    req = urllib.request.Request(
        sb_admin.SB_URL + "/functions/v1/push-notify", data=body,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + key,
                 "User-Agent": "justus-nhac/1.0"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
    except urllib.error.HTTPError as e:
        return {"ok": False, "http": e.code, "loi": e.read().decode()[:200]}


def chay(thu: bool = False) -> int:
    ma, hang = sb_admin.rest("justus_data", params="select=couple_id,data")
    if ma >= 300 or not isinstance(hang, list):
        print("❌ không đọc được justus_data:", ma, str(hang)[:200])
        return 2
    ngay = hom_nay().isoformat()
    so = doc_so()
    tong = 0
    for h in hang:
        cid = h.get("couple_id")
        muc = tinh_toi_han(h.get("data") or {})
        if not muc:
            continue
        moi = muc if thu else loc_chua_nhac(cid, muc, so, ngay)
        if not moi:
            continue
        tong += len(moi)
        if thu:
            print("cặp %s — %d mục:" % (str(cid)[:8], len(moi)))
            for m in moi:
                print("   •", m["title"])
        else:
            print("cặp %s — gửi %d mục → %s" % (str(cid)[:8], len(moi), gui(cid, moi)))
    if not thu:
        ghi_so(so)
    print("— %s: %d mục%s" % (ngay, tong, " (thử, chưa gửi gì)" if thu else ""))
    return 0


# ------------------------------------------------------------------ bộ ca
def tu_kiem() -> int:
    M = date(2026, 8, 19)
    ca, do = [], []

    def them(ten, dieu_kien):
        ca.append(ten)
        if not dieu_kien:
            do.append(ten)

    # PHẢI CHẶN — mục chưa tới hạn thì không được nhắc
    them("01 sự kiện còn 5 ngày, remind=1 ⇒ không nhắc",
         not [x for x in tinh_toi_han({"ju.events": [{"id": "e1", "title": "Xa", "date": "2026-08-24"}]}, M) if x["cat"] == "sukien"])
    them("02 việc chưa tới hạn ⇒ không nhắc",
         not tinh_toi_han({"ju.todos": [{"id": "t1", "title": "Sau", "due": "2026-08-30"}]}, M))
    them("03 việc đã xong dù quá hạn ⇒ không nhắc",
         not tinh_toi_han({"ju.todos": [{"id": "t2", "title": "Xong", "due": "2026-08-01", "done": True}]}, M))
    them("04 nhóm bị tắt trong cấu hình ⇒ không nhắc",
         not tinh_toi_han({"ju.noti": {"cats": {"hanDung": False}},
                           "ju.expiry": [{"id": "x1", "name": "Sữa", "date": "2026-08-19"}]}, M))
    # ⚠ Mục âm lịch trong app VẪN mang ô `date` (ngày dương của lần gần nhất), nên ca
    # này phải để nguyên ô đó — bỏ đi thì bản hỏng «gỡ chốt âm lịch» vẫn đạt, vì không
    # có ngày để tính. Đo 19/08/2026: đúng bản hỏng ấy đã lọt qua ca viết theo kiểu cũ.
    them("05 ngày nhớ ÂM LỊCH ⇒ bỏ qua, không quy bừa ngày dương kèm theo",
         not tinh_toi_han({"ju.dates": [{"id": "d1", "title": "Giỗ", "lunar": True,
                                         "lunarDay": 5, "lunarMonth": 7, "date": "2025-08-19"}]}, M))
    them("06 ngày hỏng ⇒ không nhắc, không nổ",
         not tinh_toi_han({"ju.expiry": [{"id": "x2", "name": "Lỗi", "date": "khong-phai-ngay"}]}, M))
    them("07 tên giấy tờ KHÔNG được lọt vào nội dung thông báo",
         all("Hộ chiếu" not in (m["title"] + m["body"])
             for m in tinh_toi_han({"ju.docs": [{"id": "g1", "name": "Hộ chiếu", "expiry": "2026-08-25"}]}, M)))
    them("08 mục đã nhắc trong ngày ⇒ không nhắc lại",
         (lambda so: (loc_chua_nhac("c1", [{"id": "a", "title": "x"}], so, "2026-08-19"),
                      loc_chua_nhac("c1", [{"id": "a", "title": "x"}], so, "2026-08-19") == [])[1])({}))

    # ĐỐI CHỨNG — đúng lúc tới hạn thì PHẢI nhắc
    them("09 sự kiện hôm nay ⇒ có nhắc",
         any(x["cat"] == "sukien" for x in tinh_toi_han({"ju.events": [{"id": "e2", "title": "Gần", "date": "2026-08-19"}]}, M)))
    them("10 đồ hết hạn sau 2 ngày ⇒ có nhắc",
         any(x["cat"] == "hanDung" for x in tinh_toi_han({"ju.expiry": [{"id": "x3", "name": "Sữa", "date": "2026-08-21"}]}, M)))
    them("11 việc quá hạn ⇒ có nhắc",
         any(x["cat"] == "viec" for x in tinh_toi_han({"ju.todos": [{"id": "t3", "title": "Trễ", "due": "2026-08-10"}]}, M)))
    them("12 kỷ niệm ngày yêu tính theo NĂM KẾ TIẾP, không theo năm gốc",
         any(x["id"] == "anniv" for x in tinh_toi_han({"ju.setup": {"loveDate": "2019-08-20"}}, M)))
    them("13 giấy tờ hết hạn trong 30 ngày ⇒ có nhắc chung",
         any(x["cat"] == "giayTo" for x in tinh_toi_han({"ju.docs": [{"id": "g2", "name": "Hộ chiếu", "expiry": "2026-09-10"}]}, M)))
    them("14 sang ngày mới thì sổ reset, nhắc lại được",
         (lambda so: (loc_chua_nhac("c2", [{"id": "a", "title": "x"}], so, "2026-08-19"),
                      len(loc_chua_nhac("c2", [{"id": "a", "title": "x"}], so, "2026-08-20")) == 1)[1])({}))
    them("15 mục có remind=3 ⇒ nhắc sớm đúng 3 ngày",
         any(x["cat"] == "sukien" for x in tinh_toi_han({"ju.events": [{"id": "e3", "title": "Cưới", "date": "2026-08-22", "remind": 3}]}, M)))

    for t in ca:
        print(("  ❌ " if t in do else "  ✅ ") + t)
    print("— %d ca, %d không đạt" % (len(ca), len(do)))
    return 1 if do else 0


# ------------------------------------------------------------------ bản hỏng
# Bộ ca xanh chưa chứng minh được gì: phải dựng lại đúng lỗi mà từng chốt đi canh,
# rồi xem ca có ĐỎ không. Mỗi dòng dưới đây gỡ một chốt (mục 17 của ~/.claude/CLAUDE.md).
BAN_HONG = [
    ("gỡ chốt bỏ qua ngày ÂM LỊCH",
     '            if e.get("lunar"):\n                continue', '            if False:\n                continue'),
    ("gỡ chốt việc đã xong", 'if t.get("done") or not t.get("due"):', 'if not t.get("due"):'),
    ("gỡ chốt nhóm bị tắt trong cấu hình",
     'bat = lambda k: cats.get(k) is not False and k in NHOM', 'bat = lambda k: k in NHOM'),
    ("để tên giấy tờ lọt vào tiêu đề",
     '"title": "🗂️ %d giấy tờ sắp hết hạn" % n', '"title": "🗂️ " + str(x.get("name")) + " sắp hết hạn"'),
    ("gỡ sổ chống nhắc lặp trong ngày", 'moi = [m for m in muc if m["id"] not in cu]', 'moi = list(muc)'),
    ("nới ngưỡng sự kiện thành 7 ngày", 'if d is not None and 0 <= d <= lead:\n                ra.append({"id": "ev"',
     'if d is not None and 0 <= d <= 7:\n                ra.append({"id": "ev"'),
]


def thu_hong() -> int:
    import subprocess, tempfile
    goc = Path(__file__).read_text(encoding="utf-8")
    xau = []
    for ten, cu, moi in BAN_HONG:
        if cu == moi:
            continue
        if cu not in goc:
            print("  ⚠ KHÔNG DỰNG ĐƯỢC bản hỏng «%s» — chuỗi neo đã đổi" % ten)
            xau.append(ten)
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".py", dir=str(Path(__file__).parent),
                                         prefix="_thu-hong-", delete=False, encoding="utf-8") as f:
            f.write(goc.replace(cu, moi, 1))
            duong = f.name
        try:
            r = subprocess.run([sys.executable, duong, "--tu-kiem"], capture_output=True, text=True)
            if r.returncode == 0:
                print("  ❌ bản hỏng «%s» VẪN ĐẠT — bộ ca không có răng" % ten)
                xau.append(ten)
            else:
                print("  ✅ bản hỏng «%s» ⇒ bộ ca báo không đạt" % ten)
        finally:
            os.unlink(duong)
    print("— %d bản hỏng, %d bản lọt" % (len([b for b in BAN_HONG if b[1] != b[2]]), len(xau)))
    return 1 if xau else 0


if __name__ == "__main__":
    if "--thu-hong" in sys.argv:
        raise SystemExit(thu_hong())
    if "--tu-kiem" in sys.argv:
        raise SystemExit(tu_kiem())
    raise SystemExit(chay(thu="--thu" in sys.argv))
