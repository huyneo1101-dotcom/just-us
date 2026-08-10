#!/usr/bin/env python3
"""Lấy nội dung trang bằng Chrome THẬT (có giao diện), điều khiển qua CDP.

Vì sao phải có bậc này: Shopee chặn cả API công khai (403, mã lỗi 90309999) lẫn Chrome
`--headless` (bị đá về trang chủ, thân trang 189 KB không có ký tự ₫ nào). Bản crawl dành
cho bot mạng xã hội có tên sản phẩm nhưng cố tình KHÔNG có giá. Chrome có giao diện là bậc
cuối cùng còn lại trước khi phải bỏ trang đó.

Cửa sổ được đẩy ra ngoài khung nhìn (`--window-position=-3200,0`) và dùng hồ sơ tạm riêng
từng lượt chạy, nên không đụng vào Chrome đang mở của người dùng.

⚠ WebSocket viết bằng socket thuần để khỏi thêm phụ thuộc — chỉ làm đúng phần cần: bắt tay,
gửi khung có mask, đọc khung (kể cả khung phân mảnh và khung dài 64-bit).

Tự kiểm: python3 chrome_cdp.py --tu-kiem
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHO_MAC_DINH = 12          # giây chờ trang chạy xong JavaScript
CONG_DAU = 9333            # cổng gỡ lỗi; bận thì tự dò cổng kế tiếp


class LoiCDP(Exception):
    pass


# ------------------------------------------------------------------ WebSocket tối giản
class WS:
    def __init__(self, url: str, timeout: float = 30):
        u = urllib.parse.urlparse(url)
        self.sk = socket.create_connection((u.hostname, u.port or 80), timeout=timeout)
        self.sk.settimeout(timeout)
        khoa = base64.b64encode(os.urandom(16)).decode()
        duong = u.path + ("?" + u.query if u.query else "")
        self.sk.sendall((
            f"GET {duong} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {khoa}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        ).encode())
        dem = b""
        while b"\r\n\r\n" not in dem:
            m = self.sk.recv(4096)
            if not m:
                raise LoiCDP("Chrome đóng kết nối lúc bắt tay WebSocket")
            dem += m
        dau, _, con = dem.partition(b"\r\n\r\n")
        if b"101" not in dau.split(b"\r\n")[0]:
            raise LoiCDP("Chrome từ chối nâng cấp WebSocket: " + dau.split(b"\r\n")[0].decode("utf-8", "replace"))
        cho = base64.b64encode(hashlib.sha1(
            (khoa + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode()
        if cho.lower() not in dau.decode("utf-8", "replace").lower():
            raise LoiCDP("Sec-WebSocket-Accept không khớp")
        self.dem = con

    def _doc(self, n: int) -> bytes:
        while len(self.dem) < n:
            m = self.sk.recv(65536)
            if not m:
                raise LoiCDP("mất kết nối giữa chừng")
            self.dem += m
        ra, self.dem = self.dem[:n], self.dem[n:]
        return ra

    def gui(self, obj) -> None:
        than = json.dumps(obj).encode()
        dai = len(than)
        khung = bytearray([0x81])
        mask = os.urandom(4)
        if dai < 126:
            khung.append(0x80 | dai)
        elif dai < 65536:
            khung.append(0x80 | 126); khung += struct.pack(">H", dai)
        else:
            khung.append(0x80 | 127); khung += struct.pack(">Q", dai)
        khung += mask + bytes(b ^ mask[i % 4] for i, b in enumerate(than))
        self.sk.sendall(bytes(khung))

    def nhan(self):
        """Đọc một thông điệp hoàn chỉnh (ghép các khung phân mảnh)."""
        cac_phan = []
        while True:
            b0, b1 = self._doc(2)
            fin, opcode = b0 & 0x80, b0 & 0x0F
            dai = b1 & 0x7F
            if dai == 126:
                dai = struct.unpack(">H", self._doc(2))[0]
            elif dai == 127:
                dai = struct.unpack(">Q", self._doc(8))[0]
            than = self._doc(dai) if dai else b""
            if opcode == 0x8:
                raise LoiCDP("Chrome đóng kênh")
            if opcode == 0x9:                      # ping → pong, giữ kênh sống
                self.sk.sendall(b"\x8a\x80" + os.urandom(4))
                continue
            if opcode == 0xA:
                continue
            cac_phan.append(than)
            if fin:
                break
        try:
            return json.loads(b"".join(cac_phan).decode("utf-8", "replace"))
        except json.JSONDecodeError:
            return None

    def dong(self):
        try:
            self.sk.close()
        except OSError:
            pass


# ------------------------------------------------------------------ Chrome
def _cong_ranh(dau: int = CONG_DAU) -> int:
    for c in range(dau, dau + 40):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", c)) != 0:
                return c
    raise LoiCDP("không tìm được cổng rảnh cho Chrome")


def _tab(cong: int, han: float):
    """Chờ Chrome mở cổng gỡ lỗi rồi trả về tab trang (bỏ qua tab nội bộ)."""
    het = time.time() + han
    loi = "chưa rõ"
    while time.time() < het:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{cong}/json/list", timeout=3) as r:
                ds = json.loads(r.read().decode())
            for t in ds:
                if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
                    return t
            loi = "Chrome đã mở cổng nhưng chưa có tab trang"
        except (urllib.error.URLError, json.JSONDecodeError, OSError, TimeoutError) as e:
            loi = type(e).__name__
        time.sleep(0.4)
    raise LoiCDP(f"Chrome không mở cổng gỡ lỗi trong {han:.0f}s ({loi})")


def lay_dom(url: str, *, cho: int = CHO_MAC_DINH, hien: bool = False, timeout: int = 90,
            ghe_truoc: str | None = None, cho_ghe: int = 10) -> str:
    """Mở `url` bằng Chrome thật, chờ `cho` giây, trả về HTML sau khi JavaScript đã chạy.

    `ghe_truoc`: mở trang này trước rồi mới điều hướng sang `url` trong CÙNG một phiên.
    Đo thật 10/08/2026 trên Shopee: vào thẳng trang sản phẩm bằng hồ sơ mới thì bị đá về
    trang chủ (thân trang 199 KB, không có ký tự ₫ nào, tiêu đề là "Shopee Việt Nam");
    ghé trang chủ 10 giây lấy cookie rồi mới sang thì ra đủ giá 385.000₫ kèm JSON-LD.
    """
    if not os.path.exists(CHROME):
        raise LoiCDP(f"không thấy Chrome ở {CHROME}")
    cong = _cong_ranh()
    tmp = tempfile.mkdtemp(prefix="ju-cdp-")
    lenh = [CHROME, f"--remote-debugging-port={cong}", f"--user-data-dir={tmp}",
            "--no-first-run", "--no-default-browser-check", "--disable-extensions",
            "--mute-audio", "--disable-background-networking", "--window-size=1280,900",
            "--disable-blink-features=AutomationControlled", "--no-service-autorun",
            "--disable-features=Translate,MediaRouter"]
    if not hien:
        lenh.append("--window-position=-3200,-3200")    # đẩy ra ngoài khung nhìn, khỏi che việc đang làm
    lenh.append(ghe_truoc or url)
    p = subprocess.Popen(lenh, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    try:
        tab = _tab(cong, min(25, timeout))
        ws = WS(tab["webSocketDebuggerUrl"], timeout=timeout)
        if ghe_truoc:
            time.sleep(cho_ghe)
            ws.gui({"id": 0, "method": "Page.navigate", "params": {"url": url}})
        time.sleep(cho)
        ws.gui({"id": 1, "method": "Runtime.evaluate",
                "params": {"expression": "document.documentElement.outerHTML",
                           "returnByValue": True, "awaitPromise": False}})
        het = time.time() + 30
        while time.time() < het:
            g = ws.nhan()
            if isinstance(g, dict) and g.get("id") == 1:
                kq = (g.get("result") or {}).get("result") or {}
                if isinstance(kq.get("value"), str):
                    return kq["value"]
                raise LoiCDP("Chrome trả về không phải HTML: " + json.dumps(g)[:200])
        raise LoiCDP("chờ 30s không thấy Chrome trả HTML")
    finally:
        if ws:
            ws.dong()
        p.terminate()
        try:
            p.wait(timeout=8)
        except subprocess.TimeoutExpired:
            p.kill()
        shutil.rmtree(tmp, ignore_errors=True)


def lay_nhieu(urls, *, cho: int = CHO_MAC_DINH, ghe_truoc: str | None = None,
              cho_ghe: int = 10, hien: bool = False, timeout: int = 90) -> dict:
    """Lấy DOM của NHIỀU trang trong CÙNG một phiên Chrome.

    Mở Chrome tốn khoảng 8-10 giây và bước ghé trang chủ lấy cookie tốn thêm chừng ấy;
    mở lại cho từng link là trả cái giá đó lặp lại. Danh sách link cùng một trang bán
    hàng vì thế đi chung một phiên: ghé một lần, rồi điều hướng lần lượt.
    """
    urls = [u for u in (urls or []) if u]
    if not urls:
        return {}
    if not os.path.exists(CHROME):
        raise LoiCDP(f"không thấy Chrome ở {CHROME}")
    cong = _cong_ranh()
    tmp = tempfile.mkdtemp(prefix="ju-cdp-")
    lenh = [CHROME, f"--remote-debugging-port={cong}", f"--user-data-dir={tmp}",
            "--no-first-run", "--no-default-browser-check", "--disable-extensions",
            "--mute-audio", "--disable-background-networking", "--window-size=1280,900",
            "--disable-blink-features=AutomationControlled", "--no-service-autorun",
            "--disable-features=Translate,MediaRouter"]
    if not hien:
        lenh.append("--window-position=-3200,-3200")
    lenh.append(ghe_truoc or urls[0])
    p = subprocess.Popen(lenh, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ra, ws = {}, None
    try:
        tab = _tab(cong, min(25, timeout))
        ws = WS(tab["webSocketDebuggerUrl"], timeout=timeout)
        if ghe_truoc:
            time.sleep(cho_ghe)
        for i, u in enumerate(urls):
            try:
                if ghe_truoc or i > 0:
                    ws.gui({"id": 1000 + i, "method": "Page.navigate", "params": {"url": u}})
                time.sleep(cho)
                ma = 2000 + i
                ws.gui({"id": ma, "method": "Runtime.evaluate",
                        "params": {"expression": "document.documentElement.outerHTML",
                                   "returnByValue": True}})
                het = time.time() + 30
                while time.time() < het:
                    g = ws.nhan()
                    if isinstance(g, dict) and g.get("id") == ma:
                        v = ((g.get("result") or {}).get("result") or {}).get("value")
                        ra[u] = v if isinstance(v, str) else ""
                        break
                else:
                    ra[u] = ""
            except (LoiCDP, OSError):
                ra[u] = ""      # một link hỏng không được kéo đổ cả lượt
        return ra
    finally:
        if ws:
            ws.dong()
        p.terminate()
        try:
            p.wait(timeout=8)
        except subprocess.TimeoutExpired:
            p.kill()
        shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------------------------------------------ tự kiểm
def tu_kiem() -> int:
    hong = 0

    # Ca ĐỐI CHỨNG: trang tĩnh cực đơn giản, không cần JavaScript.
    import http.server
    import threading
    THAN = b"<html><head><title>Ca kiem CDP</title></head><body><div id=x>chua chay</div>" \
           b"<script>document.getElementById('x').textContent='da chay JavaScript';</script></body></html>"

    TRANG_GHE = b"<html><head><title>Trang ghe truoc</title></head><body>cookie</body></html>"

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(TRANG_GHE if self.path.startswith("/ghe") else THAN)

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    cong = srv.server_address[1]
    try:
        html = lay_dom(f"http://127.0.0.1:{cong}/", cho=3)
        ok = "Ca kiem CDP" in html
        print(f"  {'✓' if ok else '✗'} lấy được HTML qua CDP ({len(html)} ký tự)")
        hong += 0 if ok else 1
        # Ca PHẢI CHẶN kiểu ngược: nếu chỉ tải thô mà không chạy JavaScript thì DOM còn
        # chữ 'chua chay'. Thấy chữ đó nghĩa là bậc này không hơn gì `curl` — vô dụng.
        ok2 = "da chay JavaScript" in html and "chua chay" not in html
        print(f"  {'✓' if ok2 else '✗'} JavaScript đã chạy thật (DOM sau khi dựng)")
        hong += 0 if ok2 else 1

        # Ghé trang khác trước rồi mới sang trang đích — đường đã cứu được Shopee.
        # Ca này PHẢI đỏ nếu bước Page.navigate bị gỡ: khi đó HTML trả về là của trang ghé.
        h2 = lay_dom(f"http://127.0.0.1:{cong}/sp", cho=3,
                     ghe_truoc=f"http://127.0.0.1:{cong}/ghe", cho_ghe=2)
        ok3 = "Ca kiem CDP" in h2 and "Trang ghe truoc" not in h2
        print(f"  {'✓' if ok3 else '✗'} ghé trang trước rồi điều hướng sang trang đích")
        hong += 0 if ok3 else 1

        # Nhiều link trong một phiên: cả hai link phải ra nội dung của chính nó.
        goi = lay_nhieu([f"http://127.0.0.1:{cong}/sp", f"http://127.0.0.1:{cong}/ghe"],
                        cho=3, ghe_truoc=f"http://127.0.0.1:{cong}/ghe", cho_ghe=2)
        ok4 = ("Ca kiem CDP" in goi.get(f"http://127.0.0.1:{cong}/sp", "")
               and "Trang ghe truoc" in goi.get(f"http://127.0.0.1:{cong}/ghe", ""))
        print(f"  {'✓' if ok4 else '✗'} nhiều link trong một phiên, mỗi link ra đúng trang của nó")
        hong += 0 if ok4 else 1
    except LoiCDP as e:
        print(f"  ✗ không lấy được: {e}")
        hong += 2
    finally:
        srv.shutdown()

    # Ca PHẢI CHẶN: cổng không có Chrome nào thì phải kêu, không được treo im.
    try:
        _tab(_cong_ranh(45000), 2)
        print("  ✗ cổng rỗng mà vẫn báo có tab")
        hong += 1
    except LoiCDP:
        print("  ✓ cổng rỗng: kêu đúng lỗi thay vì treo")

    # Ca PHẢI CHẶN: bắt tay WebSocket với máy chủ không phải Chrome.
    try:
        WS("ws://127.0.0.1:1/x", timeout=3)
        print("  ✗ bắt tay với cổng chết mà không kêu")
        hong += 1
    except (LoiCDP, OSError):
        print("  ✓ cổng chết: bắt tay thất bại có tiếng")

    print("✅ ĐẠT" if hong == 0 else f"❌ {hong} ca không đạt")
    return 1 if hong else 0


if __name__ == "__main__":
    if "--tu-kiem" in sys.argv:
        sys.exit(tu_kiem())
    if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
        h = lay_dom(sys.argv[1], hien="--hien" in sys.argv)
        print(f"dài {len(h)} ký tự")
        m = re.search(r"<title[^>]*>(.*?)</title>", h, re.S | re.I)
        print("title:", (m.group(1).strip()[:100] if m else "(không có)"))
        if "--dom" in sys.argv:
            sys.stdout.write(h)
    else:
        print(__doc__)
