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

    # ── bậc lấy bản trang dành cho trình thu thập của công cụ tìm kiếm ──────────
    # Đo bằng User-Agent của từng lời gọi, không chạm mạng: ca phải tất định.
    LD = ('<html><script type="application/ld+json">{"@type":"Product","name":"Ly giữ nhiệt",'
          '"offers":{"@type":"AggregateOffer","lowPrice":"139000","highPrice":"195000",'
          '"priceCurrency":"VND"}}</script></html>')
    TRONG = "<html><body>Shopee Việt Nam | Hot Deals</body></html>"
    U_SHOPEE = "https://shopee.vn/product/991867112/28356625535"
    U_THUONG = "https://tiki.vn/a-p1.html"

    class _TraLoi:
        def __init__(self, than):
            self.than = than.encode()

        def read(self, n=None):
            return self.than

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    that_mo = bg.urllib.request.urlopen
    that_cffi = bg._curl_cffi
    goi_ua: list = []

    def _mo_gia(req, timeout=None):
        ua = req.get_header("User-agent") or ""
        goi_ua.append(ua)
        return _TraLoi(LD if "Googlebot" in ua else TRONG)

    try:
        bg.urllib.request.urlopen = _mo_gia
        bg._curl_cffi = lambda u, timeout=25: TRONG    # bậc này cũng phải im, kẻo chạm mạng thật

        # Bọc lỗi ngay tại chỗ: bản hỏng gỡ bậc này thì `lay_gia` ném, mà ngoại lệ lọt ra
        # ngoài sẽ giết cả bộ ca — bản hỏng đọc thành "không nạp được" thay vì "bị bắt".
        try:
            r = bg.lay_gia(U_SHOPEE, cho_chrome=False, cho_cdp=False)
            ra["51 trang giấu giá được thử bằng bản dành cho bot tìm kiếm"] = (
                r["gia"] == 139000.0 and "bot-tìm-kiếm" in r["cach"]
                and any("Googlebot" in u for u in goi_ua))
        except bg.KhongBocDuoc:
            ra["51 trang giấu giá được thử bằng bản dành cho bot tìm kiếm"] = False

        # PHẢI CHẶN — trang thường đã ra giá ngay ở bậc đầu, thêm một lời gọi giả danh bot
        # nữa là tốn công vô ích và tăng nguy cơ bị trang chặn.
        goi_ua.clear()
        try:
            bg.lay_gia(U_THUONG, cho_chrome=False, cho_cdp=False)
        except bg.KhongBocDuoc:
            pass
        ra["52 PHẢI CHẶN gọi bậc bot cho trang không giấu giá"] = not any(
            "Googlebot" in u for u in goi_ua)

        # PHẢI CHẶN — bản cho bot cũng bị chặn (đo thật: 04/05 món trả "something is
        # missing") thì không được nhận bừa, và lỗi phải nêu đúng bậc đã trượt.
        def _mo_cam(req, timeout=None):
            goi_ua.append(req.get_header("User-agent") or "")
            return _TraLoi(TRONG)

        bg.urllib.request.urlopen = _mo_cam
        try:
            bg.lay_gia(U_SHOPEE, cho_chrome=False, cho_cdp=False)
            ra["53 PHẢI CHẶN nhận bừa bản cho bot không có giá"] = False
        except bg.KhongBocDuoc as e:
            ra["53 PHẢI CHẶN nhận bừa bản cho bot không có giá"] = "bot-tìm-kiếm" in str(e)

        # PHẢI CHẶN — bậc bot rẻ hơn Chrome thật vài chục lần nên phải đứng TRƯỚC; đảo thứ
        # tự thì ba mốc ban ngày lại phụ thuộc Chrome, đúng thứ vừa gỡ bỏ.
        bg.urllib.request.urlopen = _mo_gia
        mo_chrome = {"n": 0}

        def _cdp_dem(u, **k):
            mo_chrome["n"] += 1
            return LD

        import chrome_cdp as _cdp_m
        that_dom = _cdp_m.lay_dom
        try:
            _cdp_m.lay_dom = _cdp_dem
            r2 = bg.lay_gia(U_SHOPEE, cho_chrome=False, cho_cdp=True)
            ra["54 PHẢI CHẶN mở Chrome khi bản cho bot đã đủ giá"] = (
                mo_chrome["n"] == 0 and "bot-tìm-kiếm" in r2["cach"])
        except bg.KhongBocDuoc:
            ra["54 PHẢI CHẶN mở Chrome khi bản cho bot đã đủ giá"] = False
        finally:
            _cdp_m.lay_dom = that_dom
    finally:
        bg.urllib.request.urlopen = that_mo
        bg._curl_cffi = that_cffi
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

    # ── phiên Chrome dùng chung cho các món cùng một trang bán hàng ─────────────
    # Đo ARGV/đếm lời gọi, không mở trang thật: ca phải tất định.
    HTML_CO_GIA = ('<html><script type="application/ld+json">{"@type":"Product",'
                   '"name":"Váy ren","offers":{"price":"385000","priceCurrency":"VND"}}'
                   "</script></html>")
    U1 = "https://shopee.vn/product/1492977224/29785993166"
    U2 = "https://shopee.vn/product/991867112/28356625535"

    # Miền `.invalid` không phân giải được: thân trang lấy sẵn mà được dùng thì ra giá ngay,
    # còn nếu lớp đó bị gỡ thì mọi bậc mạng trượt tức khắc — ca tất định, không chạm mạng.
    try:
        ra["41 thân trang lấy sẵn được bóc trước mọi bậc mạng"] = (
            td.bocgia.lay_gia("https://khong-co-that.invalid/mon", cho_chrome=False,
                              cho_cdp=False, html_san=HTML_CO_GIA)["gia"] == 385000.0)
    except Exception:
        ra["41 thân trang lấy sẵn được bóc trước mọi bậc mạng"] = False

    # PHẢI CHẶN — thân trang lấy sẵn mà KHÔNG có giá (bị đá về trang chủ) thì không được
    # nhận bừa; phải đi tiếp thang và cuối cùng ném lỗi có nêu rõ bậc phiên-chung.
    try:
        td.bocgia.lay_gia(U1, cho_chrome=False, cho_cdp=False,
                          html_san="<html><body>Shopee Việt Nam | Hot Deals</body></html>")
        ra["42 PHẢI CHẶN nhận bừa thân trang không có giá"] = False
    except td.bocgia.KhongBocDuoc as e:
        ra["42 PHẢI CHẶN nhận bừa thân trang không có giá"] = "phiên-chung" in str(e)

    goc_nhieu = getattr(td, "_thu_lay_nhieu", None)
    import chrome_cdp as _cdp_mod
    that_nhieu = _cdp_mod.lay_nhieu
    moi_truong_goc = os.environ.get("JU_CHROME_THAT")
    try:
        goi = {"n": 0, "urls": None, "ghe": None}

        def _gia_lay_nhieu(urls, **k):
            goi["n"] += 1
            goi["urls"] = list(urls)
            goi["ghe"] = k.get("ghe_truoc")
            return {u: HTML_CO_GIA for u in urls}

        _cdp_mod.lay_nhieu = _gia_lay_nhieu
        os.environ["JU_CHROME_THAT"] = "1"      # mốc đêm mới được mở Chrome có giao diện
        kho = td.gom_phien_chung([_muc(url=U1), _muc(url=U2)], True)
        ra["43 nhiều món cùng trang đi CHUNG một phiên Chrome"] = (
            goi["n"] == 1 and len(goi["urls"]) == 2 and len(kho) == 2)
        ra["44 phiên chung có ghé trang chủ lấy cookie trước"] = goi["ghe"] == "https://shopee.vn/"

        # PHẢI CHẶN — một món lẻ thì đừng dựng phiên chung (mở Chrome mất 8-10 giây cho
        # đúng một trang, trong khi thang từng món đã lo được).
        goi["n"] = 0
        td.gom_phien_chung([_muc(url=U1)], True)
        ra["45 PHẢI CHẶN dựng phiên chung cho đúng một món"] = goi["n"] == 0

        # PHẢI CHẶN — phiên chung hỏng thì cả lượt quét vẫn phải chạy tiếp bằng thang cũ.
        def _no(urls, **k):
            raise RuntimeError("Chrome chết giữa chừng")
        _cdp_mod.lay_nhieu = _no
        ra["46 PHẢI CHẶN phiên chung hỏng kéo cả lượt quét xuống"] = (
            td.gom_phien_chung([_muc(url=U1), _muc(url=U2)], True) == {})

        # PHẢI CHẶN — ba mốc ban ngày KHÔNG được mở Chrome có giao diện: cửa sổ nhảy lên
        # giành tiêu điểm giữa lúc đang làm việc (Huy chê 12/08/2026). Chỉ mốc 03:00 đặt
        # `JU_CHROME_THAT=1` mới được. Đo bằng số lần bậc Chrome bị gọi, không đo lời khai.
        _cdp_mod.lay_nhieu = _gia_lay_nhieu
        goi["n"] = 0
        os.environ.pop("JU_CHROME_THAT", None)
        kho_ngay = td.gom_phien_chung([_muc(url=U1), _muc(url=U2)], True)
        ra["47 PHẢI CHẶN mở Chrome giao diện khi chưa bật cờ mốc đêm"] = (
            goi["n"] == 0 and kho_ngay == {})

        # ĐỐI CHỨNG — cờ bật lại thì bậc đó phải sống lại, kẻo bản vá thành "tắt vĩnh viễn".
        goi["n"] = 0
        os.environ["JU_CHROME_THAT"] = "1"
        td.gom_phien_chung([_muc(url=U1), _muc(url=U2)], True)
        ra["48 cờ mốc đêm bật thì bậc Chrome sống lại"] = goi["n"] == 1

        # PHẢI CHẶN — cờ chỉ nhận đúng chuỗi "1"; giá trị lạ phải hiểu là TẮT, không mở bừa.
        goi["n"] = 0
        os.environ["JU_CHROME_THAT"] = "true"
        td.gom_phien_chung([_muc(url=U1), _muc(url=U2)], True)
        ra["49 PHẢI CHẶN coi giá trị lạ của cờ là đã bật"] = goi["n"] == 0
    finally:
        _cdp_mod.lay_nhieu = that_nhieu
        if goc_nhieu is not None:
            td._thu_lay_nhieu = goc_nhieu
        if moi_truong_goc is None:
            os.environ.pop("JU_CHROME_THAT", None)
        else:
            os.environ["JU_CHROME_THAT"] = moi_truong_goc
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
    ("bỏ lớp bóc thân trang lấy sẵn, món nào cũng tự mở phiên riêng", F_BOCGIA,
     "    if html_san:\n        ra = boc_tu_html(html_san)",
     "    if False:\n        ra = boc_tu_html(html_san)",
     ["41"]),
    ("nhận bừa thân trang lấy sẵn dù bóc không ra giá", F_BOCGIA,
     '        daq.append("phiên-chung: lấy được trang (%d KB) nhưng không thấy mốc giá"',
     '        return {"gia": 1.0, "tien": "VND", "ten": "", "cach": "bừa", "url": url}\n'
     '        daq.append("phiên-chung: lấy được trang (%d KB) nhưng không thấy mốc giá"',
     ["42"]),
    ("mở phiên Chrome riêng cho từng món thay vì gom chung", F_THEODOI,
     "        if len(urls) < 2:            # một món lẻ thì thang cũ đã đủ, không cần dựng phiên chung",
     "        if True:",
     ["43", "44"]),
    ("gỡ bước ghé trang chủ lấy cookie của phiên chung", F_THEODOI,
     '            ra.update(lay_nhieu(urls, ghe_truoc=f"https://{mien}/") or {})',
     "            ra.update(lay_nhieu(urls) or {})",
     ["44"]),
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
    ("mở Chrome giao diện ở mọi mốc, kể cả giờ làm việc", F_THEODOI,
     '    return (os.environ.get("JU_CHROME_THAT") or "").strip() == "1"',
     "    return True",
     ["47", "49"]),
    ("tắt vĩnh viễn bậc Chrome, cờ mốc đêm cũng không bật lại", F_THEODOI,
     '    return (os.environ.get("JU_CHROME_THAT") or "").strip() == "1"',
     "    return False",
     ["43", "44", "48"]),
    ("bỏ bậc lấy bản trang dành cho bot tìm kiếm", F_BOCGIA,
     '        bac.append(("bot-tìm-kiếm", _curl_bot))',
     "        pass",
     ["51", "53", "54"]),
    ("gọi bậc bot cho mọi trang, kể cả trang không giấu giá", F_BOCGIA,
     "    if mien in MIEN_CAN_GHE:",
     "    if True:",
     ["52"]),
    ("bậc bot dùng User-Agent thường nên vẫn nhận bản giấu giá", F_BOCGIA,
     '        "User-Agent": UA_BOT,',
     '        "User-Agent": UA,',
     ["51", "54"]),
    ("đảo thứ tự: mở Chrome trước rồi mới thử bản cho bot", F_BOCGIA,
     '    if cho_cdp:\n        bac.append(("chrome-that", _cdp))',
     '    if cho_cdp:\n        bac.insert(0, ("chrome-that", _cdp))',
     ["54"]),
]

if __name__ == "__main__":
    if "--tu-kiem" in sys.argv:
        sys.exit(tu_kiem())
    print(__doc__)
