#!/usr/bin/env python3
"""Bóc giá sản phẩm từ một trang bán hàng — dùng cho tính năng Săn giá của Just Us.

Nguyên tắc gốc (quy tắc mục 6): THÀ TRẢ VỀ RỖNG CÒN HƠN ĐOÁN SAI. Một con số bịa
ra sẽ bắn thông báo "giảm giá" giả vào điện thoại, hoặc tệ hơn là chôn mất một đợt
giảm thật vì giá nền đã bị ghi sai. Vì vậy chỉ bóc theo các mốc TẤT ĐỊNH:

  1. Bộ chuyên trang  — API công khai của chính trang đó (Tiki, Shopee).
  2. JSON-LD          — <script type="application/ld+json"> có @type Product.
  3. Thẻ meta         — product:price:amount · og:price:amount · itemprop=price.
  4. JSON nhúng       — chỉ các khoá đặc trưng, và chỉ khi mọi ứng viên trùng nhau.

KHÔNG có lớp "dò số kèm chữ ₫ trong trang". Trang bán hàng nào cũng đầy giá của sản
phẩm gợi ý bên cạnh, nên lớp đó đọc trúng giá hàng khác mà không dấu hiệu nào phát ra.

Thang lấy trang đi theo `congcu/CLAUDE.md`: curl → curl_cffi → Chrome không giao diện.
Trang dựng bằng JavaScript trả mã 200 với thân rỗng, nên mã 200 KHÔNG phải bằng chứng
lấy được nội dung — điều kiện dừng là BÓC RA GIÁ, không phải mã trả về.

Tự kiểm: python3 bocgia.py --tu-kiem
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # để nạp được chrome_cdp dù gọi từ đâu

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Giá ngoài khoảng này gần như chắc chắn là bóc nhầm (mã sản phẩm, số lượt bán, năm…).
GIA_MIN = 1000
GIA_MAX = 2_000_000_000


class KhongBocDuoc(Exception):
    """Không lấy được giá — kèm lý do đọc được bằng tiếng người."""


# ------------------------------------------------------------------ tiện ích
def chuan_hoa(s: str) -> str:
    """NFC + gộp mọi khoảng trắng lạ (quy tắc mục 17 — U+202F, U+00A0 nhìn y hệt dấu cách)."""
    s = unicodedata.normalize("NFC", s or "")
    s = re.sub(r"[   ⁠​]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def so_tien(v) -> float | None:
    """Đổi giá trị thô sang số. Trả None khi không phải một con số tiền hợp lệ."""
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        x = float(v)
    elif isinstance(v, str):
        t = v.strip()
        if not t:
            return None
        # Bỏ ký hiệu tiền và khoảng trắng, giữ lại chữ số cùng dấu ngăn.
        t = re.sub(r"[^\d.,]", "", t)
        if not t:
            return None
        # "1.290.000" (VN) và "1,290,000" (EN) đều là dấu NGĂN NGHÌN khi nhóm đủ 3 chữ số.
        if re.fullmatch(r"\d{1,3}([.,]\d{3})+", t):
            t = re.sub(r"[.,]", "", t)
        elif t.count(",") == 1 and t.count(".") == 0 and len(t.split(",")[1]) == 2:
            t = t.replace(",", ".")          # "19,99" kiểu châu Âu
        else:
            t = t.replace(",", "")
        try:
            x = float(t)
        except ValueError:
            return None
    else:
        return None
    if x != x or x in (float("inf"), float("-inf")):
        return None
    return x


def hop_le(x) -> bool:
    return isinstance(x, (int, float)) and GIA_MIN <= x <= GIA_MAX


def ten_mien(url: str) -> str:
    try:
        h = (urllib.parse.urlparse(url).hostname or "").lower()
    except ValueError:
        return ""
    return h[4:] if h.startswith("www.") else h


# Miền rút gọn: link Huy chép từ app Shopee luôn ở dạng này, phải giải ra link thật
# thì mới biết là trang nào và mới bóc được mã sản phẩm.
MIEN_RUT_GON = {"vn.shp.ee", "shp.ee", "s.shopee.vn", "shope.ee", "s.lazada.vn",
                "c.lazada.vn", "bit.ly", "tinyurl.com", "tiki.vn/short", "l.tiki.vn"}
# Trang dựng bằng JavaScript và soi kỹ máy tự động: phải đi bằng Chrome thật, và phải
# ghé trang chủ lấy cookie trước (đo 10/08/2026 — vào thẳng thì bị đá về trang chủ).
MIEN_CAN_GHE = {"shopee.vn", "lazada.vn", "sendo.vn", "tiktok.com"}


def giai_link(url: str) -> str:
    """Trả về link thật sau khi đi hết các bước chuyển hướng. Không giải được thì trả nguyên."""
    if ten_mien(url) not in MIEN_RUT_GON:
        return url
    try:
        from curl_cffi import requests as cr
        r = cr.get(url, impersonate="chrome", timeout=25, allow_redirects=True)
        cuoi = str(getattr(r, "url", "") or "")
        if cuoi.startswith("http"):
            return cuoi.split("?")[0] if "?" in cuoi else cuoi
    except Exception:
        pass
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.geturl() or url
    except Exception:
        return url


# ------------------------------------------------------------------ lấy trang
def _curl(url: str, timeout: int = 25) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(6_000_000).decode("utf-8", "replace")


def _curl_cffi(url: str, timeout: int = 25) -> str:
    from curl_cffi import requests as cr          # nạp muộn: máy không có vẫn chạy được các bậc kia
    r = cr.get(url, impersonate="chrome", timeout=timeout,
               headers={"Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"})
    return r.text or ""


def _chrome(url: str, timeout: int = 60) -> str:
    """Chrome không giao diện — bậc cuối, qua được trang đòi chạy JavaScript.

    Hai bẫy đã trả giá (ghi ở congcu/CLAUDE.md):
      · hết `--virtual-time-budget` thì Chrome in thân trang rồi TREO, nên mã thoát
        khác 0 KHÔNG phải dấu hiệu hỏng — phải đọc thứ đã in ra khi hết giờ;
      · mỗi lượt một thư mục hồ sơ riêng, kẻo lượt sau thoát êm mà không làm gì.
    """
    with tempfile.TemporaryDirectory(prefix="ju-gia-") as tmp:
        lenh = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
                "--no-default-browser-check", "--disable-extensions", "--mute-audio",
                f"--user-data-dir={tmp}", "--virtual-time-budget=20000",
                f"--user-agent={UA}", "--dump-dom", url]
        try:
            p = subprocess.run(lenh, capture_output=True, text=True, timeout=timeout)
            return p.stdout or ""
        except subprocess.TimeoutExpired as e:
            ra = e.stdout or ""
            return ra.decode("utf-8", "replace") if isinstance(ra, bytes) else ra
        except OSError:
            return ""


# ------------------------------------------------------------------ các lớp bóc
def _quet_ld(nut, ra: list):
    """Đi đệ quy trong JSON-LD, nhặt giá của mọi node @type Product/Offer."""
    if isinstance(nut, list):
        for x in nut:
            _quet_ld(x, ra)
        return
    if not isinstance(nut, dict):
        return
    t = nut.get("@type")
    ts = " ".join(t) if isinstance(t, list) else str(t or "")
    if "Product" in ts or "Offer" in ts or "AggregateOffer" in ts:
        offers = nut.get("offers", nut if "Offer" in ts else None)
        for o in (offers if isinstance(offers, list) else [offers]):
            if not isinstance(o, dict):
                continue
            for khoa in ("price", "lowPrice", "highPrice"):
                x = so_tien(o.get(khoa))
                if hop_le(x):
                    ra.append((x, str(o.get("priceCurrency") or nut.get("priceCurrency") or "VND").upper(),
                               chuan_hoa(str(nut.get("name") or ""))))
                    break
    for v in nut.values():
        if isinstance(v, (dict, list)):
            _quet_ld(v, ra)


def boc_jsonld(html: str):
    ra: list = []
    for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                         html, re.S | re.I):
        raw = m.group(1).strip()
        for ung_vien in (raw, re.sub(r",\s*([}\]])", r"\1", raw)):   # vá dấu phẩy thừa
            try:
                _quet_ld(json.loads(ung_vien), ra)
                break
            except (json.JSONDecodeError, RecursionError):
                continue
    if not ra:
        return None
    gia, tien, ten = min(ra, key=lambda x: x[0])      # nhiều biến thể thì lấy giá thấp nhất
    return {"gia": gia, "tien": tien, "ten": ten, "cach": "json-ld"}


META = [
    r'<meta[^>]+(?:property|name|itemprop)=["\'](?:product:price:amount|og:price:amount|price)["\'][^>]*content=["\']([^"\']+)["\']',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name|itemprop)=["\'](?:product:price:amount|og:price:amount|price)["\']',
    r'<[^>]+itemprop=["\']price["\'][^>]*content=["\']([^"\']+)["\']',
]
META_TIEN = [
    r'<meta[^>]+(?:property|name|itemprop)=["\'](?:product:price:currency|og:price:currency|priceCurrency)["\'][^>]*content=["\']([^"\']+)["\']',
]


def boc_meta(html: str):
    for mau in META:
        for m in re.finditer(mau, html, re.I):
            x = so_tien(m.group(1))
            if hop_le(x):
                tien = "VND"
                for mt in META_TIEN:
                    mm = re.search(mt, html, re.I)
                    if mm:
                        tien = mm.group(1).strip().upper()
                        break
                return {"gia": x, "tien": tien, "ten": boc_ten(html), "cach": "meta"}
    return None


# Khoá JSON đặc trưng cho giá bán cuối. Cố ý KHÔNG nhận khoá `"price"` trần —
# nó xuất hiện ở cả sản phẩm gợi ý bên cạnh, đọc trúng là báo giảm giá của hàng khác.
KHOA_JSON = ["salePrice", "sale_price", "final_price", "finalPrice", "current_price",
             "currentPrice", "price_min", "priceMin", "lastPrice"]


def boc_json_nhung(html: str):
    ung_vien = set()
    for k in KHOA_JSON:
        for m in re.finditer(r'"%s"\s*:\s*("?[\d.,]+"?)' % re.escape(k), html):
            x = so_tien(m.group(1).strip('"'))
            if hop_le(x):
                ung_vien.add(round(x, 2))
    if len(ung_vien) == 1:                    # chỉ nhận khi mọi ứng viên khớp nhau
        return {"gia": ung_vien.pop(), "tien": "VND", "ten": boc_ten(html), "cach": "json-nhung"}
    return None


def boc_ten(html: str) -> str:
    for mau in (r'<meta[^>]+property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']',
                r"<title[^>]*>(.*?)</title>"):
        m = re.search(mau, html, re.S | re.I)
        if m:
            t = chuan_hoa(re.sub(r"<[^>]+>", "", m.group(1)))
            t = re.sub(r"\s*[|｜-]\s*(Tiki|Shopee|Lazada|Sendo)\b.*$", "", t, flags=re.I)
            if t:
                return t[:120]
    return ""


def boc_tu_html(html: str):
    """Ba lớp bóc tất định, theo thứ tự tin cậy giảm dần.

    Cố ý KHÔNG đặt ngưỡng độ dài thân trang ở đây: cả ba lớp đều tất định nên trang
    rỗng tự khắc không bóc ra gì, còn ngưỡng độ dài thì chặn oan trang gọn.
    """
    if not html:
        return None
    for f in (boc_jsonld, boc_meta, boc_json_nhung):
        ra = f(html)
        if ra:
            return ra
    return None


# ------------------------------------------------------------------ bộ chuyên trang
def _api_json(url: str):
    try:
        return json.loads(_curl(url, timeout=20))
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError, ValueError):
        return None


def bo_tiki(url: str):
    m = re.search(r"-p(\d+)\.html", url)
    if not m:
        return None
    g = _api_json(f"https://tiki.vn/api/v2/products/{m.group(1)}?platform=web")
    if not isinstance(g, dict):
        return None
    x = so_tien(g.get("price"))
    if hop_le(x):
        return {"gia": x, "tien": "VND", "ten": chuan_hoa(str(g.get("name") or "")), "cach": "api-tiki"}
    return None


def ma_shopee(url: str):
    """Bóc (shop_id, item_id) từ cả hai dạng link Shopee đang gặp."""
    m = re.search(r"i\.(\d+)\.(\d+)", url) or re.search(r"/product/(\d+)/(\d+)", url)
    return (m.group(1), m.group(2)) if m else None


def bo_shopee(url: str):
    m = ma_shopee(url)
    if not m:
        return None
    g = _api_json(f"https://shopee.vn/api/v4/pdp/get_pc?shop_id={m[0]}&item_id={m[1]}")
    d = (g or {}).get("data") or {}
    it = d.get("item") or d
    x = so_tien(it.get("price"))
    if x is None:
        return None
    x = x / 100000 if x > 100000 * GIA_MIN else x     # Shopee trả giá nhân 100.000
    if hop_le(x):
        return {"gia": x, "tien": "VND", "ten": chuan_hoa(str(it.get("title") or "")), "cach": "api-shopee"}
    return None


BO_CHUYEN = {"tiki.vn": bo_tiki, "shopee.vn": bo_shopee}


# ------------------------------------------------------------------ đường chính
def lay_gia(url: str, *, cho_chrome: bool = True, cho_cdp: bool = True) -> dict:
    """Trả `{gia, tien, ten, cach, url}`. Không lấy được thì ném KhongBocDuoc kèm lý do.

    Thang đi từ rẻ tới đắt và DỪNG KHI BÓC RA GIÁ, không dừng khi có mã 200 — trang dựng
    bằng JavaScript trả 200 kèm thân rỗng, nên mã trả về không phải bằng chứng lấy được gì.
    """
    url = giai_link((url or "").strip())
    if not re.match(r"^https?://", url, re.I):
        raise KhongBocDuoc("link phải bắt đầu bằng http:// hoặc https://")
    mien = ten_mien(url)
    daq = []

    bo = BO_CHUYEN.get(mien)
    if bo:
        try:
            ra = bo(url)
            if ra:
                return ra
            daq.append("API của trang không trả giá")
        except Exception as e:                        # bộ chuyên trang hỏng không được chặn các bậc sau
            daq.append(f"API của trang lỗi ({type(e).__name__})")

    def _cdp(u: str) -> str:
        from chrome_cdp import lay_dom
        return lay_dom(u, ghe_truoc=(f"https://{mien}/" if mien in MIEN_CAN_GHE else None))

    bac = [("curl", _curl), ("curl_cffi", _curl_cffi)]
    if cho_chrome and mien not in MIEN_CAN_GHE:
        bac.append(("chrome", _chrome))     # miền cần ghé thì Chrome không giao diện chắc chắn trượt, bỏ cho nhanh
    if cho_cdp:
        bac.append(("chrome-that", _cdp))

    for ten_bac, ham in bac:
        try:
            html = ham(url)
        except Exception as e:
            daq.append(f"{ten_bac}: {type(e).__name__}")
            continue
        if not html:
            daq.append(f"{ten_bac}: thân trang rỗng")
            continue
        ra = boc_tu_html(html)
        if ra:
            ra["cach"] = f"{ra['cach']}/{ten_bac}"
            if not ra.get("ten"):
                ra["ten"] = boc_ten(html)
            ra["url"] = url
            return ra
        daq.append(f"{ten_bac}: lấy được trang ({len(html)//1024} KB) nhưng không thấy mốc giá")

    raise KhongBocDuoc("; ".join(daq) or "không rõ nguyên nhân")


# ------------------------------------------------------------------ tự kiểm
CA_HTML = {
    "json-ld": ('<html><script type="application/ld+json">'
                '{"@type":"Product","name":"Máy hút sữa Medela","offers":{"@type":"Offer",'
                '"price":"4290000","priceCurrency":"VND"}}</script></html>', 4290000.0),
    "json-ld @graph": ('<html><script type="application/ld+json">{"@graph":[{"@type":"WebPage"},'
                       '{"@type":"Product","name":"Nôi cũi gỗ","offers":[{"@type":"Offer","price":2150000}]}]}'
                       "</script></html>", 2150000.0),
    "meta og": ('<html><head><meta property="og:title" content="Ghế ăn dặm"/>'
                '<meta property="og:price:amount" content="1.290.000"/></head></html>', 1290000.0),
    "itemprop": ('<html><span itemprop="price" content="899000">899.000₫</span></html>', 899000.0),
    "json nhúng": ('<html><script>window.__D={"salePrice":2490000,"sale_price":"2490000"}</script></html>', 2490000.0),
}
CA_PHAI_TRUOT = {
    "trang rỗng": "<html><body>Đang tải…</body></html>",
    "chỉ có giá kèm ₫ trong chữ": "<html><body><div>Giá bán: 1.290.000₫ · rẻ nhất thị trường</div></body></html>",
    "json nhúng hai giá lệch": '<html><script>{"salePrice":990000,"final_price":1490000}</script></html>',
    "giá nhỏ vô lý": '<html><script type="application/ld+json">{"@type":"Product","offers":{"price":5}}</script></html>',
    "giá lớn vô lý": '<html><script type="application/ld+json">{"@type":"Product","offers":{"price":9e12}}</script></html>',
}


def tu_kiem() -> int:
    hong = 0
    print("── bóc được (ca PHẢI CHO QUA) ──")
    for ten, (html, cho) in CA_HTML.items():
        ra = boc_tu_html(html)
        ok = bool(ra) and abs(ra["gia"] - cho) < 0.5
        print(f"  {'✓' if ok else '✗'} {ten}: {ra['gia'] if ra else None} (chờ {cho})")
        hong += 0 if ok else 1

    print("── PHẢI CHẶN (bóc ra số nào cũng là sai) ──")
    for ten, html in CA_PHAI_TRUOT.items():
        ra = boc_tu_html(html)
        ok = ra is None
        print(f"  {'✓' if ok else '✗'} {ten}: {'trả rỗng' if ok else 'BÓC NHẦM ' + str(ra)}")
        hong += 0 if ok else 1

    print("── đọc số tiền ──")
    for thô, cho in (("1.290.000", 1290000.0), ("1,290,000", 1290000.0), ("4290000", 4290000.0),
                     ("19,99", 19.99), ("990.000₫", 990000.0), ("", None), ("abc", None), (True, None)):
        got = so_tien(thô)
        ok = (got is None and cho is None) or (got is not None and cho is not None and abs(got - cho) < 0.01)
        print(f"  {'✓' if ok else '✗'} {thô!r} → {got} (chờ {cho})")
        hong += 0 if ok else 1

    print("── tên miền ──")
    for u, cho in (("https://www.tiki.vn/abc", "tiki.vn"), ("https://shopee.vn/x", "shopee.vn"),
                   ("không phải url", "")):
        got = ten_mien(u)
        ok = got == cho
        print(f"  {'✓' if ok else '✗'} {u} → {got!r}")
        hong += 0 if ok else 1

    print("── mã sản phẩm Shopee (hai dạng link) ──")
    for u, cho in (("https://shopee.vn/-i.273056223.19375315398", ("273056223", "19375315398")),
                   ("https://shopee.vn/product/273056223/19375315398", ("273056223", "19375315398")),
                   ("https://shopee.vn/tim-kiem", None)):
        got = ma_shopee(u)
        ok = got == cho
        print(f"  {'✓' if ok else '✗'} {u[-30:]} → {got}")
        hong += 0 if ok else 1

    print("── giải link rút gọn: miền thường phải giữ NGUYÊN (không gọi mạng oan) ──")
    for u in ("https://tiki.vn/abc-p1.html", "https://hasaki.vn/san-pham/x.html"):
        got = giai_link(u)
        ok = got == u
        print(f"  {'✓' if ok else '✗'} {u} → {'giữ nguyên' if ok else got}")
        hong += 0 if ok else 1

    print("── link sai dạng phải bị từ chối ──")
    for u in ("", "tiki.vn/abc", "ftp://x.vn/a"):
        try:
            lay_gia(u, cho_chrome=False, cho_cdp=False)
            print(f"  ✗ {u!r}: đi tiếp mà đáng lẽ phải từ chối")
            hong += 1
        except KhongBocDuoc:
            print(f"  ✓ {u!r}: bị từ chối")

    print(("✅ ĐẠT" if hong == 0 else f"❌ {hong} ca không đạt"))
    return 1 if hong else 0


if __name__ == "__main__":
    if "--tu-kiem" in sys.argv:
        sys.exit(tu_kiem())
    if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
        try:
            print(json.dumps(lay_gia(sys.argv[1]), ensure_ascii=False, indent=2))
        except KhongBocDuoc as e:
            print(f"❌ không bóc được giá: {e}")
            sys.exit(2)
    else:
        print(__doc__)
