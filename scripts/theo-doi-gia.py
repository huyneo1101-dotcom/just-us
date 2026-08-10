#!/usr/bin/env python3
"""Săn giá cho app Just Us — đo giá các link đang theo dõi, giảm giá thì báo về điện thoại.

Đường đi:
  Supabase `justus_data` → khoá `ju.pricewatch` (app ghi vào đây khi thêm link)
    → bóc giá từng link (bocgia.py, thang curl → curl_cffi → Chrome thật)
      → so với lần đo trước
        → giảm đủ mức thì gửi Telegram + web-push
          → ghi giá và lịch sử ngược lại Supabase để app hiện.

Ghi ngược lại bằng phép SO-RỒI-ĐỔI trên cột `updated_at`: app cũng ghi vào chính hàng ấy,
nên nếu ghi đè cả hàng theo bản đọc lúc đầu thì mọi thay đổi app vừa lưu sẽ mất trong im
lặng. Cột `updated_at` không khớp ⇒ ghi trượt ⇒ đọc lại rồi thử lần nữa.

    python3 theo-doi-gia.py                 # quét thật
    python3 theo-doi-gia.py --kho           # đo giá nhưng KHÔNG ghi, KHÔNG gửi
    python3 theo-doi-gia.py --thu <link>    # thử một link
    python3 theo-doi-gia.py --tu-kiem       # bộ ca kiểm
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bocgia                                   # noqa: E402
import sb_admin                                 # noqa: E402

KHOA = "ju.pricewatch"
MOC_LICH_SU = 90            # giữ tối đa ngần này mốc giá mỗi món
GIAM_TOI_THIEU_PC = 1.0     # giảm dưới 1% thì coi như dao động vặt, không báo
GIAM_TOI_THIEU_VND = 5000   # và phải giảm ít nhất ngần này tiền
CACH_LAN_DO_PHUT = 60       # đo lại sớm hơn ngần này thì bỏ qua, tránh nện trang bán hàng
LAN_LOI_MOI_BAO = 3         # lỗi liên tiếp tới lần này mới báo, tránh kêu vì mạng chập chờn


def gio_vn() -> str:
    return datetime.now().strftime("%H:%M %d/%m")


def tien(x) -> str:
    try:
        return f"{float(x):,.0f}₫".replace(",", ".")
    except (TypeError, ValueError):
        return "?"


def chuan(s) -> str:
    return unicodedata.normalize("NFC", str(s or "")).strip()


# ------------------------------------------------------------------ đọc / ghi Supabase
def doc_hang() -> list:
    ma, ra = sb_admin.rest("justus_data", params="select=couple_id,data,updated_at")
    if ma >= 300 or not isinstance(ra, list):
        raise SystemExit(f"❌ không đọc được justus_data (mã {ma}): {str(ra)[:200]}")
    return ra


def ghi_khoa(couple_id: str, moc_cu: str, data_moi: dict) -> bool:
    """Ghi cả cột `data`, nhưng CHỈ khi hàng chưa bị ai sửa từ lúc đọc (so `updated_at`).

    Điều kiện `updated_at=eq.<mốc cũ>` chính là phép so-rồi-đổi: app vừa lưu xen vào thì
    mốc đã khác, PostgREST sửa 0 hàng và trả mảng rỗng — đó là tín hiệu phải đọc lại.
    """
    ma, ra = sb_admin.rest(
        "justus_data",
        method="PATCH",
        params=(f"couple_id=eq.{urllib.parse.quote(str(couple_id))}"
                f"&updated_at=eq.{urllib.parse.quote(str(moc_cu))}"),
        body={"data": data_moi, "last_writer": "san-gia"},
    )
    return ma < 300 and bool(ra)


# ------------------------------------------------------------------ báo tin
def bao(tieu_de: str, than: str, couple_id: str | None = None, gui: bool = True) -> None:
    print(f"  📣 {tieu_de} — {than}")
    if not gui:
        return
    # Đẩy thông báo TRƯỚC, để biết nó có tới máy không rồi mới soạn tin Telegram: push chết
    # là chuyện im lặng, nếu không nói ra thì cứ tưởng đang nhận đủ hai đường.
    them = ""
    if couple_id:
        ok, vi_sao = day_push(couple_id, tieu_de, than)
        if not ok:
            them = f"\n\n⚠️ Thông báo trên máy chưa tới ({vi_sao}). Mở app Just Us một lần là nó tự bật lại."
    try:
        sys.path.insert(0, "/Users/Huy/Claude/congcu")
        from gui_tele import gui_text
        gui_text(f"{tieu_de}\n{than}{them}")
    except Exception as e:
        print(f"  ⚠ không gửi được Telegram: {type(e).__name__}: {e}")


def day_push(couple_id: str, tieu_de: str, than: str) -> tuple[bool, str]:
    """Bắn web-push qua Edge Function push-notify. Trả (tới được máy nào không, lý do)."""
    try:
        key = sb_admin.khoa_service()
        req = urllib.request.Request(
            f"{sb_admin.SB_URL}/functions/v1/push-notify",
            data=json.dumps({"couple_id": couple_id, "kind": "price",
                             "items": [{"title": tieu_de, "body": than}]}).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            method="POST")
        with urllib.request.urlopen(req, timeout=30) as r:
            g = json.loads(r.read().decode() or "{}")
        # In cả số máy đã đăng ký và lý do trượt: "gửi 0 máy" một mình không phân biệt được
        # "chưa ai bật thông báo" với "đăng ký cũ đã chết", mà hai cái cần hai cách xử khác nhau.
        so = int(g.get("sent") or 0)
        if so:
            print(f"  🔔 web-push: gửi {so} máy")
            return True, ""
        vi_sao = ("chưa máy nào đăng ký" if not g.get("subs")
                  else "đăng ký cũ đã hết hiệu lực" if g.get("loi") else "không rõ")
        print(f"  🔔 web-push: gửi 0 máy — {vi_sao} (đăng ký: {g.get('subs', 0)}"
              f"{' · ' + '; '.join(g['loi'])[:120] if g.get('loi') else ''})")
        return False, vi_sao
    except Exception as e:
        print(f"  ⚠ không gọi được web-push: {type(e).__name__}")
        return False, "không gọi được máy chủ đẩy tin"


# ------------------------------------------------------------------ phần lõi
def can_do(m: dict, khan: bool) -> bool:
    if m.get("active") is False:
        return False
    if khan:
        return True
    lan = m.get("last") or 0
    return (time.time() * 1000 - lan) >= CACH_LAN_DO_PHUT * 60_000


def du_giam(cu: float, gia_moi: float) -> bool:
    """Mức giảm có đáng báo không: phải THẤP HƠN lần trước, và hạ đủ sâu cả về tiền lẫn %.

    Gộp ba điều kiện vào một chỗ có chủ đích. Tách rời ra thì chúng che lẫn nhau — gỡ điều
    kiện "phải thấp hơn" mà vẫn còn ngưỡng tiền thì giá TĂNG vẫn bị chặn (chênh lệch âm luôn
    nhỏ hơn ngưỡng), nên bộ ca không cách nào chứng minh được từng lớp đang canh việc gì.
    """
    chenh = cu - gia_moi
    return chenh >= GIAM_TOI_THIEU_VND and (chenh / cu * 100) >= GIAM_TOI_THIEU_PC


def xet_bao(m: dict, gia_moi: float) -> tuple[str, str] | None:
    """Quyết định có báo không. Trả (loại, câu mô tả) hoặc None.

    Chống báo lặp bằng `baoGia` — mốc giá của lần báo gần nhất. Chỉ báo lại khi giá xuống
    THẤP HƠN mốc đó; nếu không, một món giảm giá sẽ bắn thông báo mỗi lượt quét cho tới
    khi hết đợt khuyến mãi.
    """
    cu = m.get("cur")
    dich = m.get("target")
    da_bao = m.get("baoGia")
    if isinstance(dich, (int, float)) and dich > 0 and gia_moi <= dich:
        if da_bao is None or gia_moi < da_bao:
            return ("dich", f"đã về mức mong muốn {tien(dich)}")
    if not isinstance(cu, (int, float)) or cu <= 0:
        return None
    if not du_giam(cu, gia_moi):
        return None
    if da_bao is not None and gia_moi >= da_bao:
        return None
    chenh = cu - gia_moi
    return ("giam", f"giảm {tien(chenh)} ({chenh / cu * 100:.0f}%) so với {tien(cu)}")


def cap_nhat_mot(m: dict, *, gui: bool, couple_id: str | None) -> dict:
    """Đo một món, cập nhật tại chỗ. Trả về mô tả việc đã xảy ra."""
    ten = chuan(m.get("name")) or chuan(m.get("url"))[:60]
    try:
        kq = bocgia.lay_gia(m.get("url", ""))
    except bocgia.KhongBocDuoc as e:
        m["last"] = int(time.time() * 1000)
        m["errN"] = int(m.get("errN") or 0) + 1
        m["err"] = str(e)[:300]
        if m["errN"] == LAN_LOI_MOI_BAO:
            bao("🏷️ Săn giá: không đọc được giá",
                f"{ten}\n{m.get('url', '')}\nĐã trượt {m['errN']} lượt liền — có thể trang đổi cách hiện giá.",
                couple_id, gui)
        return {"trang_thai": "loi", "ten": ten, "vi_sao": str(e)[:120]}

    gia = float(kq["gia"])
    lo = m.get("low")
    quyet = xet_bao(m, gia)

    m["err"] = ""
    m["errN"] = 0
    m["prev"] = m.get("cur")
    m["cur"] = gia
    m["tien"] = kq.get("tien") or "VND"
    m["cach"] = kq.get("cach") or ""
    m["last"] = int(time.time() * 1000)
    if kq.get("url") and kq["url"] != m.get("url"):
        m["urlThat"] = kq["url"]
    if not chuan(m.get("name")) and kq.get("ten"):
        m["name"] = chuan(kq["ten"])[:120]
    if m.get("base") is None:
        m["base"] = gia
    if not isinstance(lo, (int, float)) or gia < lo:
        m["low"] = gia
        m["lowAt"] = m["last"]
    hist = m.get("hist") if isinstance(m.get("hist"), list) else []
    if not hist or hist[-1].get("p") != gia:
        hist.append({"t": m["last"], "p": gia})
    m["hist"] = hist[-MOC_LICH_SU:]

    if quyet:
        loai, mo_ta = quyet
        m["baoGia"] = gia
        m["baoLuc"] = m["last"]
        m["baoLoai"] = loai
        icon = "🎯" if loai == "dich" else "📉"
        bao(f"{icon} Săn giá: {chuan(m.get('name'))[:70]}",
            f"Giá hiện tại {tien(gia)} — {mo_ta}.\n"
            f"Thấp nhất từng thấy {tien(m.get('low'))}.\n{m.get('urlThat') or m.get('url', '')}",
            couple_id, gui)
        return {"trang_thai": loai, "ten": ten, "gia": gia}
    return {"trang_thai": "yen", "ten": ten, "gia": gia}


def chay(*, gui: bool = True, ghi: bool = True, khan: bool = False) -> int:
    hang = doc_hang()
    tong = {"do": 0, "bao": 0, "loi": 0}
    for h in hang:
        couple_id = h.get("couple_id")
        moc = h.get("updated_at")
        data = h.get("data") or {}
        ds = data.get(KHOA)
        if not isinstance(ds, list) or not ds:
            continue
        print(f"▸ cặp {str(couple_id)[:8]}… — {len(ds)} món đang theo dõi")
        doi = False
        for m in ds:
            if not isinstance(m, dict) or not m.get("url"):
                continue
            if not can_do(m, khan):
                continue
            kq = cap_nhat_mot(m, gui=gui, couple_id=couple_id if gui else None)
            doi = True
            tong["do"] += 1
            if kq["trang_thai"] == "loi":
                tong["loi"] += 1
                print(f"  ✗ {kq['ten']}: {kq['vi_sao']}")
            else:
                if kq["trang_thai"] != "yen":
                    tong["bao"] += 1
                print(f"  ✓ {kq['ten'][:60]}: {tien(kq['gia'])}")
        if doi and ghi:
            data[KHOA] = ds
            xong = ghi_khoa(couple_id, moc, data)
            if not xong:
                # App vừa ghi xen vào giữa — đọc lại bản mới nhất rồi chỉ đặt lại đúng khoá này.
                lai = doc_hang()
                for h2 in lai:
                    if h2.get("couple_id") == couple_id:
                        d2 = h2.get("data") or {}
                        d2[KHOA] = ds
                        xong = ghi_khoa(couple_id, h2.get("updated_at"), d2)
                        break
            print(f"  {'💾 đã lưu' if xong else '⚠ CHƯA lưu được — sẽ đo lại lượt sau'}")
    print(f"── đo {tong['do']} món · báo {tong['bao']} · trượt {tong['loi']} — {gio_vn()}")
    return 0


# ------------------------------------------------------------------ tự kiểm
def _muc(**kw):
    m = {"id": "x", "url": "https://tiki.vn/a-p1.html", "name": "Món thử", "active": True}
    m.update(kw)
    return m


def tu_kiem() -> int:
    hong = 0
    print("── quyết định báo hay không (ca PHẢI BÁO) ──")
    ca_bao = [
        ("giảm 20% từ 500k", _muc(cur=500000), 400000, "giam"),
        ("chạm giá mong muốn", _muc(cur=500000, target=450000), 450000, "dich"),
        ("giảm tiếp sâu hơn lần đã báo", _muc(cur=400000, baoGia=400000), 350000, "giam"),
        ("đúng ngưỡng 1% và 5.000₫", _muc(cur=500000), 495000, "giam"),
    ]
    for ten, m, gia, cho in ca_bao:
        got = xet_bao(m, gia)
        ok = bool(got) and got[0] == cho
        print(f"  {'✓' if ok else '✗'} {ten} → {got[0] if got else 'KHÔNG BÁO'} (chờ {cho})")
        hong += 0 if ok else 1

    print("── ca PHẢI CHẶN (báo ở đây là bắn thông báo rác) ──")
    ca_chan = [
        ("giá không đổi", _muc(cur=500000), 500000),
        ("giá TĂNG", _muc(cur=500000), 560000),
        ("giảm vặt 0,4%", _muc(cur=500000), 498000),
        ("giảm 4.000₫ dưới mức tiền tối thiểu", _muc(cur=100000), 96000),
        ("đã báo rồi, giá y nguyên", _muc(cur=400000, baoGia=400000), 400000),
        ("đã báo rồi, giá nhích lên", _muc(cur=350000, baoGia=350000), 380000),
        ("chạm đích nhưng đã báo đúng mức đó", _muc(cur=500000, target=450000, baoGia=450000), 450000),
        ("lần đo đầu, chưa có giá cũ", _muc(), 500000),
        ("giá cũ hỏng (0)", _muc(cur=0), 400000),
        ("giá cũ hỏng (chuỗi)", _muc(cur="rẻ"), 400000),
    ]
    for ten, m, gia in ca_chan:
        got = xet_bao(m, gia)
        ok = got is None
        print(f"  {'✓' if ok else '✗'} {ten} → {'im' if ok else 'BÁO OAN ' + got[0]}")
        hong += 0 if ok else 1

    print("── nhịp đo ──")
    nay = time.time() * 1000
    for ten, m, khan, cho in (
        ("vừa đo 5 phút trước", _muc(last=nay - 5 * 60_000), False, False),
        ("đo từ 3 tiếng trước", _muc(last=nay - 180 * 60_000), False, True),
        ("chưa đo lần nào", _muc(), False, True),
        ("đã tắt theo dõi", _muc(active=False, last=0), False, False),
        ("đã tắt, kể cả khi ép đo", _muc(active=False), True, False),
        ("vừa đo nhưng ép đo", _muc(last=nay - 60_000), True, True),
    ):
        got = can_do(m, khan)
        ok = got == cho
        print(f"  {'✓' if ok else '✗'} {ten} → {got} (chờ {cho})")
        hong += 0 if ok else 1

    print("── cập nhật một món (không chạm mạng) ──")
    that = bocgia.lay_gia
    try:
        bocgia.lay_gia = lambda u, **k: {"gia": 380000.0, "tien": "VND", "ten": "Giày sục", "cach": "json-ld/curl"}
        m = _muc(cur=500000, low=450000, hist=[{"t": 1, "p": 500000}])
        cap_nhat_mot(m, gui=False, couple_id=None)
        kt = [("giá mới vào cur", m["cur"] == 380000),
              ("giá cũ dồn sang prev", m["prev"] == 500000),
              ("thấp nhất hạ theo", m["low"] == 380000),
              ("lịch sử dài thêm", len(m["hist"]) == 2),
              ("nhớ mốc đã báo", m.get("baoGia") == 380000),
              ("xoá dấu lỗi cũ", m.get("errN") == 0)]
        for ten, ok in kt:
            print(f"  {'✓' if ok else '✗'} {ten}")
            hong += 0 if ok else 1

        # Ca PHẢI CHẶN: giá không hạ thì KHÔNG được kéo `low` xuống theo.
        m2 = _muc(cur=300000, low=280000)
        cap_nhat_mot(m2, gui=False, couple_id=None)
        ok = m2["low"] == 280000
        print(f"  {'✓' if ok else '✗'} giá đo cao hơn đáy cũ thì giữ nguyên đáy ({tien(m2['low'])})")
        hong += 0 if ok else 1

        # Ca PHẢI CHẶN: lịch sử không được phình quá trần.
        m3 = _muc(cur=1, hist=[{"t": i, "p": 1000 + i} for i in range(MOC_LICH_SU + 40)])
        cap_nhat_mot(m3, gui=False, couple_id=None)
        ok = len(m3["hist"]) == MOC_LICH_SU
        print(f"  {'✓' if ok else '✗'} lịch sử cắt đúng trần {MOC_LICH_SU} mốc (đang {len(m3['hist'])})")
        hong += 0 if ok else 1

        # Bóc giá hỏng thì phải đếm lỗi, KHÔNG được ghi đè giá cũ bằng số rác.
        def _hong(u, **k):
            raise bocgia.KhongBocDuoc("trang đổi giao diện")
        bocgia.lay_gia = _hong
        m4 = _muc(cur=250000)
        cap_nhat_mot(m4, gui=False, couple_id=None)
        ok = m4["cur"] == 250000 and m4["errN"] == 1 and m4["err"]
        print(f"  {'✓' if ok else '✗'} bóc trượt thì giữ nguyên giá cũ và đếm lỗi")
        hong += 0 if ok else 1
    finally:
        bocgia.lay_gia = that

    print("── định dạng tiền ──")
    for x, cho in ((1290000, "1.290.000₫"), (0, "0₫"), (None, "?"), ("x", "?")):
        got = tien(x)
        ok = got == cho
        print(f"  {'✓' if ok else '✗'} {x!r} → {got}")
        hong += 0 if ok else 1

    print("✅ ĐẠT" if hong == 0 else f"❌ {hong} ca không đạt")
    return 1 if hong else 0


if __name__ == "__main__":
    if "--tu-kiem" in sys.argv:
        sys.exit(tu_kiem())
    if "--thu" in sys.argv:
        i = sys.argv.index("--thu")
        u = sys.argv[i + 1] if len(sys.argv) > i + 1 else ""
        try:
            print(json.dumps(bocgia.lay_gia(u), ensure_ascii=False, indent=2))
        except bocgia.KhongBocDuoc as e:
            print(f"❌ {e}")
            sys.exit(2)
    else:
        kho = "--kho" in sys.argv
        sys.exit(chay(gui=not kho, ghi=not kho, khan="--khan" in sys.argv or kho))
