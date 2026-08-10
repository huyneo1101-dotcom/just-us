#!/usr/bin/env python3
"""Bộ ca kiểm cho tính năng Săn giá của Just Us (bocgia.py + theo-doi-gia.py).

Vì sao phải canh: mọi kiểu hỏng ở đây đều CÂM — app vẫn hiện một con số, điện thoại vẫn
nhận thông báo, chỉ là sai.
  (i)   bóc trúng giá của sản phẩm gợi ý bên cạnh ⇒ báo "giảm giá" cho món chẳng ai theo dõi;
  (ii)  bóc hụt mà trả về 0 ⇒ mọi phép so "rẻ hơn lần trước" đều đúng, mỗi lượt quét lại
        báo một kỷ lục mới;
  (iii) mất chốt chống báo lặp ⇒ một đợt khuyến mãi bắn thông báo 3 lần mỗi ngày cho tới
        khi hết đợt, và người dùng tắt thông báo — mất luôn cả những lần báo thật;
  (iv)  đọc "1.290.000" thành 1,29 ⇒ giá nền sai một triệu lần, cả lịch sử giá thành rác;
  (v)   lỗi mạng mà ghi đè giá cũ ⇒ mất mốc so sánh, không dấu hiệu nào phát ra;
  (vi)  bỏ kiểm "đang tạm dừng" ⇒ món đã tắt vẫn bị đo và vẫn báo.

Chạy: python3 thu_san_gia.py --tu-kiem
  · phần 1 chạy bộ ca trên bản ĐÚNG (phải xanh hết);
  · phần 2 dựng từng bản hỏng rồi chạy lại — ca khai trong BAN_HONG phải chuyển sang ĐỎ.
    Xanh cả ở bản đúng lẫn bản hỏng nghĩa là ca đó không canh gì cả.

Bộ ca chạy hoàn toàn bằng chữ mẫu: KHÔNG chạm mạng, KHÔNG mở Chrome.
Bậc Chrome thật có bộ ca riêng ở `chrome_cdp.py --tu-kiem` (phải mở Chrome nên không
nạp vào bảng khám hằng ngày).
"""
from __future__ import annotations

import hashlib
import importlib.util
import os
import sys
import time

sys.path.insert(0, "/Users/Huy/Claude/HeThong")
from khung_tu_kiem import LoiNeo, neo_hai_dong          # noqa: E402

THU_MUC = os.path.dirname(os.path.abspath(__file__))
F_BOCGIA = os.path.join(THU_MUC, "bocgia.py")
F_THEODOI = os.path.join(THU_MUC, "theo-doi-gia.py")
BAN_HONG_HAN_GIO = 6        # rác mồ côi quá tuổi này thì dọn, không cần hỏi pid


def nap(duong: str, ten: str):
    spec = importlib.util.spec_from_file_location(ten, duong)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[ten] = mod
    spec.loader.exec_module(mod)
    return mod


# ------------------------------------------------------------------ các ca
def _muc(**kw):
    m = {"id": "x", "url": "https://tiki.vn/a-p1.html", "name": "Món thử", "active": True}
    m.update(kw)
    return m


def ca_bocgia(bg) -> dict:
    """Trả {tên ca: đạt hay không}. Số hiệu ca cố định để BAN_HONG khai theo."""
    ra = {}
    ra["01 bóc được JSON-LD"] = (lambda r: bool(r) and r["gia"] == 4290000.0)(bg.boc_tu_html(
        '<html><script type="application/ld+json">{"@type":"Product","name":"Máy hút sữa",'
        '"offers":{"price":"4290000","priceCurrency":"VND"}}</script></html>'))
    ra["02 bóc được thẻ meta"] = (lambda r: bool(r) and r["gia"] == 1290000.0)(bg.boc_tu_html(
        '<html><head><meta property="og:price:amount" content="1.290.000"/></head></html>'))
    ra["03 đọc đúng số kiểu Việt Nam"] = bg.so_tien("1.290.000") == 1290000.0
    ra["04 đọc đúng số kiểu Anh Mỹ"] = bg.so_tien("1,290,000") == 1290000.0
    # PHẢI CHẶN — trang chỉ có giá nằm trong câu chữ thì KHÔNG được đoán.
    ra["05 PHẢI CHẶN giá trôi trong câu chữ"] = bg.boc_tu_html(
        "<html><body><div>Giá bán: 1.290.000₫ · rẻ nhất thị trường</div></body></html>") is None
    # PHẢI CHẶN — hai khoá JSON lệch nhau thì không biết tin cái nào.
    ra["06 PHẢI CHẶN hai giá JSON lệch nhau"] = bg.boc_tu_html(
        '<html><script>{"salePrice":990000,"final_price":1490000}</script></html>') is None
    # PHẢI CHẶN — số ngoài khoảng tiền hợp lý là mã hàng hoặc lượt bán, không phải giá.
    ra["07 PHẢI CHẶN giá nhỏ vô lý"] = bg.boc_tu_html(
        '<html><script type="application/ld+json">{"@type":"Product","offers":{"price":5}}</script></html>') is None
    ra["08 PHẢI CHẶN giá lớn vô lý"] = bg.boc_tu_html(
        '<html><script type="application/ld+json">{"@type":"Product","offers":{"price":9e12}}</script></html>') is None
    ra["09 PHẢI CHẶN trang rỗng"] = bg.boc_tu_html("<html><body>Đang tải…</body></html>") is None
    ra["10 PHẢI CHẶN chữ không phải số"] = bg.so_tien("abc") is None and bg.so_tien(True) is None
    ra["11 mã Shopee dạng i.<shop>.<item>"] = bg.ma_shopee("https://shopee.vn/-i.11.22") == ("11", "22")
    ra["12 mã Shopee dạng /product/"] = bg.ma_shopee("https://shopee.vn/product/11/22") == ("11", "22")
    ra["13 PHẢI CHẶN trang không phải sản phẩm"] = bg.ma_shopee("https://shopee.vn/tim-kiem") is None
    ra["14 link miền thường giữ nguyên"] = bg.giai_link("https://tiki.vn/x-p1.html") == "https://tiki.vn/x-p1.html"
    # Phải chặn NGAY vì thiếu giao thức, và nói đúng lý do. Chỉ kiểm "có ném lỗi không" là
    # chưa canh gì: mọi bậc lấy trang đều trượt với link như vậy nên lỗi vẫn ném, chỉ khác
    # là sau khi đã gọi mạng mấy lượt vô ích.
    try:
        bg.lay_gia("tiki.vn/thieu-giao-thuc", cho_chrome=False, cho_cdp=False)
        ra["15 PHẢI CHẶN link sai dạng"] = False
    except bg.KhongBocDuoc as e:
        ra["15 PHẢI CHẶN link sai dạng"] = "http://" in str(e)
    return ra


def ca_theodoi(td) -> dict:
    ra = {}
    ra["21 báo khi giảm 20%"] = (td.xet_bao(_muc(cur=500000), 400000) or ("", ""))[0] == "giam"
    ra["22 báo khi chạm giá mong muốn"] = (td.xet_bao(_muc(cur=500000, target=450000), 450000) or ("", ""))[0] == "dich"
    ra["23 báo lại khi giảm sâu hơn lần đã báo"] = (td.xet_bao(_muc(cur=400000, baoGia=400000), 350000) or ("", ""))[0] == "giam"
    # PHẢI CHẶN — mấy ca dưới đây mà báo là bắn thông báo rác về điện thoại.
    ra["24 PHẢI CHẶN giá không đổi"] = td.xet_bao(_muc(cur=500000), 500000) is None
    ra["25 PHẢI CHẶN giá tăng"] = td.xet_bao(_muc(cur=500000), 560000) is None
    ra["26 PHẢI CHẶN giảm vặt dưới 1%"] = td.xet_bao(_muc(cur=500000), 498000) is None
    ra["27 PHẢI CHẶN giảm dưới mức tiền tối thiểu"] = td.xet_bao(_muc(cur=100000), 96000) is None
    # Giảm đủ sâu so với lần đo trước, NHƯNG vẫn cao hơn mức đã báo ⇒ im. Cố ý không dùng
    # ca "giá y nguyên": ca đó bị lớp ngưỡng giảm chặn trước, nên nó canh lớp khác chứ không
    # canh chốt chống báo lặp.
    ra["28 PHẢI CHẶN báo lặp khi chưa rẻ hơn mức đã báo"] = td.xet_bao(
        _muc(cur=500000, baoGia=400000), 450000) is None
    ra["29 PHẢI CHẶN lần đo đầu chưa có giá cũ"] = td.xet_bao(_muc(), 500000) is None
    ra["30 PHẢI CHẶN giá cũ hỏng"] = (td.xet_bao(_muc(cur=0), 400000) is None
                                     and td.xet_bao(_muc(cur="rẻ"), 400000) is None)

    nay = time.time() * 1000
    ra["31 đo lại sau vài giờ"] = td.can_do(_muc(last=nay - 180 * 60_000), False) is True
    ra["32 PHẢI CHẶN đo dồn dập"] = td.can_do(_muc(last=nay - 5 * 60_000), False) is False
    ra["33 PHẢI CHẶN đo món đang tạm dừng"] = td.can_do(_muc(active=False), True) is False

    # Cập nhật một món — thay hàm bóc giá bằng bản giả, không chạm mạng.
    that = td.bocgia.lay_gia
    try:
        td.bocgia.lay_gia = lambda u, **k: {"gia": 380000.0, "tien": "VND", "ten": "Giày", "cach": "json-ld/curl"}
        m = _muc(cur=500000, low=450000, hist=[{"t": 1, "p": 500000}])
        td.cap_nhat_mot(m, gui=False, couple_id=None)
        ra["34 giá mới thay giá cũ"] = m["cur"] == 380000 and m["prev"] == 500000
        ra["35 đáy giá hạ theo"] = m["low"] == 380000
        ra["36 lịch sử dài thêm"] = len(m["hist"]) == 2

        m2 = _muc(cur=300000, low=280000)
        td.cap_nhat_mot(m2, gui=False, couple_id=None)
        ra["37 PHẢI CHẶN kéo đáy lên khi giá cao hơn"] = m2["low"] == 280000

        m3 = _muc(cur=1, hist=[{"t": i, "p": 1000 + i} for i in range(td.MOC_LICH_SU + 40)])
        td.cap_nhat_mot(m3, gui=False, couple_id=None)
        ra["38 PHẢI CHẶN lịch sử phình quá trần"] = len(m3["hist"]) == td.MOC_LICH_SU

        def _hong(u, **k):
            raise td.bocgia.KhongBocDuoc("trang đổi giao diện")
        td.bocgia.lay_gia = _hong
        m4 = _muc(cur=250000)
        td.cap_nhat_mot(m4, gui=False, couple_id=None)
        ra["39 PHẢI CHẶN ghi đè giá cũ khi bóc trượt"] = m4["cur"] == 250000 and m4["errN"] == 1
    finally:
        td.bocgia.lay_gia = that

    ra["40 định dạng tiền"] = td.tien(1290000) == "1.290.000₫" and td.tien(None) == "?"
    return ra


def chay_bo(bg, td) -> dict:
    ra = {}
    ra.update(ca_bocgia(bg))
    ra.update(ca_theodoi(td))
    return ra


# ------------------------------------------------------------------ bản hỏng
def _don_rac():
    """Dọn bản hỏng mồ côi: cắt bằng TUỔI FILE trước, vì macOS cấp lại pid."""
    for f in os.listdir(THU_MUC):
        if not f.startswith("_thu-hong-"):
            continue
        d = os.path.join(THU_MUC, f)
        try:
            if (time.time() - os.path.getmtime(d)) / 3600 > BAN_HONG_HAN_GIO:
                os.remove(d)
        except OSError:
            pass


def _dung_ban_hong(goc_duong: str, tim: str, thay: str, ten: str):
    goc = open(goc_duong, encoding="utf-8").read()
    tim2, thay2 = neo_hai_dong(goc, tim, thay)
    noi_dung = goc.replace(tim2, thay2)
    if noi_dung == goc:
        raise LoiNeo("phép thay không đổi được gì")
    sha = hashlib.sha1(noi_dung.encode()).hexdigest()[:8]
    ten_file = f"_thu-hong-{os.getpid()}-{sha}-{os.path.basename(goc_duong)}"
    duong = os.path.join(THU_MUC, ten_file)
    with open(duong, "w", encoding="utf-8") as f:
        f.write(noi_dung)
    return duong, f"hong_{sha}_{ten}"


def tu_kiem() -> int:
    _don_rac()
    bg = nap(F_BOCGIA, "bocgia")
    td = nap(F_THEODOI, "theodoigia")

    print("── bộ ca trên bản ĐÚNG ──")
    goc = chay_bo(bg, td)
    do_o_ban_dung = [k for k, v in goc.items() if not v]
    for k in sorted(goc):
        print(f"  {'✓' if goc[k] else '✗'} {k}")
    if do_o_ban_dung:
        print(f"❌ {len(do_o_ban_dung)} ca không đạt ngay trên bản đúng — dừng, chưa xét bản hỏng")
        return 1

    print(f"── dựng {len(BAN_HONG)} bản hỏng, mỗi bản phải làm ĐỎ đúng các ca đã khai ──")
    tong_hong = 0
    for ten, f_goc, tim, thay, phai_do in BAN_HONG:
        try:
            duong, ten_mod = _dung_ban_hong(f_goc, tim, thay, ten)
        except LoiNeo as e:
            print(f"  ✗ {ten} — {e}")
            tong_hong += 1
            continue
        try:
            if f_goc == F_BOCGIA:
                bg2 = nap(duong, ten_mod)
                td2 = nap(F_THEODOI, "theodoigia_" + ten_mod)
                td2.bocgia = bg2
                kq = chay_bo(bg2, td2)
            else:
                td2 = nap(duong, ten_mod)
                kq = chay_bo(bg, td2)
            do = {k for k, v in kq.items() if not v}
            if len(do) == len(kq):
                print(f"  ✗ {ten}: ĐỎ TOÀN BỘ {len(do)} ca — phép thay làm hỏng cú pháp chứ không gỡ lớp vá")
                tong_hong += 1
                continue
            thieu = [s for s in phai_do if not any(k.startswith(s) for k in do)]
            thua = sorted(k for k in do if not any(k.startswith(s) for s in phai_do))
            if thieu:
                print(f"  ✗ {ten}: ca {', '.join(thieu)} VẪN XANH ở bản hỏng — ca đó không canh gì")
                tong_hong += 1
            else:
                print(f"  ✓ {ten}: bắt được ({len(do)} ca đỏ){' · đỏ lây: ' + ', '.join(thua) if thua else ''}")
        except Exception as e:                      # bản hỏng nổ ngay lúc nạp cũng là hỏng cú pháp
            print(f"  ✗ {ten}: bản hỏng không nạp được ({type(e).__name__}: {str(e)[:80]})")
            tong_hong += 1
        finally:
            try:
                os.remove(duong)
            except OSError:
                pass

    print("✅ ĐẠT" if tong_hong == 0 else f"❌ {tong_hong} bản hỏng không bị bắt")
    return 1 if tong_hong else 0


# Bảng khai bản hỏng — đặt CUỐI file, sau mã (quy ước mục 17).
# Mỗi dòng: (tên, file gốc, chuỗi cần thay, chuỗi thay bằng, các ca PHẢI chuyển sang đỏ).
BAN_HONG = [
    ("gỡ chốt khoảng giá hợp lý", F_BOCGIA,
     "    return isinstance(x, (int, float)) and GIA_MIN <= x <= GIA_MAX",
     "    return isinstance(x, (int, float))",
     ["07", "08"]),
    ("cho nhận cả khi các khoá JSON lệch nhau", F_BOCGIA,
     "    if len(ung_vien) == 1:                    # chỉ nhận khi mọi ứng viên khớp nhau",
     "    if len(ung_vien) >= 1:",
     ["06"]),
    ("đọc dấu chấm nghìn thành dấu thập phân", F_BOCGIA,
     '        if re.fullmatch(r"\\d{1,3}([.,]\\d{3})+", t):',
     '        if False:',
     ["03"]),
    ("nhận cả link thiếu giao thức", F_BOCGIA,
     '    if not re.match(r"^https?://", url, re.I):',
     "    if False:",
     ["15"]),
    ("bỏ ngưỡng giảm tối thiểu (giữ chiều giảm)", F_THEODOI,
     "    return chenh >= GIAM_TOI_THIEU_VND and (chenh / cu * 100) >= GIAM_TOI_THIEU_PC",
     "    return chenh > 0",
     ["26", "27"]),
    ("bỏ hết phép lọc mức giảm", F_THEODOI,
     "    return chenh >= GIAM_TOI_THIEU_VND and (chenh / cu * 100) >= GIAM_TOI_THIEU_PC",
     "    return True",
     ["24", "25", "26", "27"]),
    ("bỏ chốt chống báo lặp", F_THEODOI,
     "    if da_bao is not None and gia_moi >= da_bao:",
     "    if False:",
     ["28"]),
    ("vẫn đo món đang tạm dừng", F_THEODOI,
     '    if m.get("active") is False:',
     "    if False:",
     ["33"]),
    ("ghi đè giá cũ khi bóc trượt", F_THEODOI,
     '        m["errN"] = int(m.get("errN") or 0) + 1',
     '        m["cur"] = 0; m["errN"] = 0',
     ["39"]),
    ("bỏ cắt trần lịch sử giá", F_THEODOI,
     '    m["hist"] = hist[-MOC_LICH_SU:]',
     '    m["hist"] = hist',
     ["38"]),
]

if __name__ == "__main__":
    if "--tu-kiem" in sys.argv:
        sys.exit(tu_kiem())
    print(__doc__)
