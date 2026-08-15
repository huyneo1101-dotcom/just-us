#!/usr/bin/env python3
"""Bộ ca cho mục 📆 Ngày này năm ngoái của Just Us.

Đo THẬT phần logic gom: bóc nguyên khối `otdNgayTu` … `otdNgayThang` ra khỏi
`nguon/app.jsx` rồi chạy bằng Node với `store` giả, đúng mã sắp giao đi — không
chép lại logic sang đây, vì bản chép thì sửa app xong bộ ca vẫn xanh.

⚠ Vì sao phải có bộ ca riêng thay vì tin bước dựng: `dung.py` chỉ chứng minh JSX
dịch được. Chuyện mục lọc nhầm năm, để lọt khoá riêng tư, hay đếm cả dòng rỗng
đều KHÔNG làm vỡ cú pháp — app vẫn mở, chỉ kể sai chuyện.

Chạy:  python3 scripts/thu_onthisday.py --tu-kiem
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / "nguon" / "app.jsx"

# Mốc bóc khối. Đổi tên hàm trong app mà quên sửa đây thì bóc hụt → báo lỗi rõ,
# cố ý KHÔNG lùi về "bóc được bao nhiêu chạy bấy nhiêu" (đó là hỏng về phía im).
DAU = "function otdNgayTu("
CUOI = "const otdNgayThang="


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def boc_khoi() -> str:
    src = nfc(NGUON.read_text(encoding="utf-8"))
    i = src.find(DAU)
    if i < 0:
        raise SystemExit(f"không thấy mốc đầu {DAU!r} trong {NGUON}")
    j = src.find(CUOI, i)
    if j < 0:
        raise SystemExit(f"không thấy mốc cuối {CUOI!r} trong {NGUON}")
    k = src.find("\n", j)
    return src[i:k]


# Những thứ khối trên gọi tới nhưng nằm chỗ khác trong app — dựng lại đúng hành vi.
NEN = r"""
const pad=(n)=> n<10?'0'+n:''+n;
const VND=(n)=> (Number(n)||0).toLocaleString('vi-VN')+'đ';
function fmtDateVN(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return d+'/'+m+'/'+y; }
function photoList(x){ if(!x) return []; const a=(x.photos||[]).filter(Boolean); if(a.length) return a; return x.photo?[x.photo]:[]; }
const EXPENSE_CATS=[
  {k:'food',icon:'🍜',label:'Ăn uống'},{k:'groc',icon:'🛒',label:'Đi chợ'},{k:'cafe',icon:'☕',label:'Cà phê'},
  {k:'move',icon:'⛽',label:'Đi lại'},{k:'bill',icon:'🧾',label:'Hóa đơn'},{k:'home',icon:'🏠',label:'Nhà cửa'},
  {k:'shop',icon:'🛍️',label:'Mua sắm'},{k:'fun',icon:'🎬',label:'Giải trí'},{k:'health',icon:'💊',label:'Sức khỏe'},
  {k:'edu',icon:'📚',label:'Giáo dục'},{k:'kid',icon:'🧸',label:'Con cái'},{k:'gift',icon:'🎁',label:'Quà tặng'},
  {k:'debt',icon:'💳',label:'Trả nợ'},{k:'other',icon:'📦',label:'Khác'},
];
let KHO={};
const DA_DOC=[];
const store={ get:(k,d)=>{ DA_DOC.push(k); return (k in KHO)?KHO[k]:d; } };
"""

DUOI = r"""
const VAO=JSON.parse(process.argv[2]);
KHO=VAO.kho||{};
const people=VAO.people||{a:{name:'Huy'},b:{name:'Vợ'}};
const tatCa=otdTatCa(people);
const nhom=otdNhom(tatCa,VAO.iso);
const gan=otdGanNhat(tatCa,VAO.iso);
console.log(JSON.stringify({tatCa,nhom,gan,daDoc:[...new Set(DA_DOC)]}));
"""

# ─── Dữ liệu mẫu: hôm nay coi như 15/08/2026 ────────────────────────────────
KHO_DAY = {
    "ju.timeline": [
        {"id": "t1", "date": "2025-08-15", "title": "Đi Tam Đảo", "icon": "✈️", "note": "mưa cả ngày"},
        {"id": "t2", "date": "2024-08-15", "title": "Ăn bún chả Hàng Quạt"},
        {"id": "t3", "date": "2026-08-15", "title": "Mốc CỦA CHÍNH HÔM NAY"},   # cùng năm → PHẢI LOẠI
        {"id": "t4", "date": "2025-08-14", "title": "Lệch một ngày"},           # khác ngày → PHẢI LOẠI
        {"id": "t5", "date": "", "title": "Không có ngày"},                     # PHẢI LOẠI
    ],
    "ju.photos": [{"id": "p1", "date": "2025-08-15", "caption": "", "src": "x"}],
    "ju.notes": [
        # 15/08/2025 12:00 giờ Việt Nam
        {"id": "n1", "createdAt": 1755234000000, "by": "a", "text": "Nhớ em"},
        {"id": "n2", "createdAt": None, "by": "a", "text": "Không có mốc giờ"},   # PHẢI LOẠI
    ],
    "ju.checkins": [{"id": "c1", "date": "2024-08-15", "name": "Cafe Đinh", "type": "cafe",
                     "review": "view hồ đẹp", "photos": [{"src": "y"}]}],
    "ju.expenses": [{"id": "e1", "date": "2025-08-15", "amount": 250000, "cat": "food", "note": "cơm trưa"}],
    "ju.mood": {"2025-08-15": {"a": "😍", "an": "vui"}, "2026-08-15": {"a": "😴"}},   # bản 2026 PHẢI LOẠI
    "ju.qa": {"2025-08-15": {"q": "Điều gì làm em cười hôm nay?", "a": "anh"}},
    "ju.cookLogs": [{"date": "2025-08-15", "cook": "b", "dish": "canh chua"}],
    "ju.movies": [{"id": "m1", "title": "Về nhà đi con", "watchedAt": 1755234000000, "done": True}],
    "ju.childDiary": [{"id": "d1", "date": "2025-08-15", "text": "Con tự xúc cơm"}],
    "ju.childWords": [{"id": "w1", "date": "2025-08-15", "word": "bà"}],
    # ⛔ Hai khoá dưới đây KHÔNG được lọt ra màn — có ca PHẢI CHẶN canh riêng.
    "ju.intimacy": [{"id": "i1", "date": "2025-08-15", "title": "chuyện riêng tư"}],
    "ju.docs": [{"id": "g1", "date": "2025-08-15", "expiry": "2030-01-01", "enc": "..."}],
}

ISO = "2026-08-15"


def chay_node(kho: dict, iso: str, people: dict | None = None, khoi: str | None = None) -> dict:
    js = NEN + "\n" + (khoi if khoi is not None else boc_khoi()) + "\n" + DUOI
    d = Path(tempfile.mkdtemp(prefix="thu-otd-"))
    try:
        f = d / "thu.mjs"
        f.write_text(js, encoding="utf-8")
        vao = json.dumps({"kho": kho, "iso": iso, "people": people or {"a": {"name": "Huy"}, "b": {"name": "Vợ"}}},
                         ensure_ascii=False)
        r = subprocess.run(["node", str(f), vao], capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            raise RuntimeError("node lỗi: " + (r.stderr or "")[-800:])
        return json.loads(r.stdout)
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ─── Bộ ca ──────────────────────────────────────────────────────────────────
CA: list = []


def ca(so: int, ten: str, loai: str):
    def deco(f):
        CA.append((so, ten, loai, f))
        return f
    return deco


def _tieu_de(kq) -> list:
    return [x["title"] for x in kq["nhom"] and [i for g in kq["nhom"] for i in g["items"]] or []]


@ca(1, "gom đủ 11 nguồn cho ngày 15/08 các năm trước", "cho-qua")
def _c1():
    kq = chay_node(KHO_DAY, ISO)
    kinds = {i["kind"].split(" · ")[0] for g in kq["nhom"] for i in g["items"]}
    can = {"Cột mốc", "Ảnh chung", "Lời nhắn", "Check-in quán", "Chi tiêu", "Tâm trạng",
           "Câu hỏi mỗi ngày", "Bữa nhà nấu", "Phim đã xem", "Điều đầu tiên của con",
           "Con nói được từ mới"}
    thieu = can - kinds
    return (not thieu, f"thiếu nguồn: {sorted(thieu)}" if thieu else f"đủ {len(kinds)} loại nguồn")


@ca(2, "mục CÙNG NĂM với ngày đang xem phải bị loại", "phai-chan")
def _c2():
    kq = chay_node(KHO_DAY, ISO)
    tds = _tieu_de(kq)
    lot = [t for t in tds if "CỦA CHÍNH HÔM NAY" in t]
    return (not lot, f"lọt mục cùng năm: {lot}" if lot else "đã loại mục cùng năm")


@ca(3, "mục LỆCH NGÀY (14/08) phải bị loại", "phai-chan")
def _c3():
    kq = chay_node(KHO_DAY, ISO)
    lot = [t for t in _tieu_de(kq) if "Lệch một ngày" in t]
    return (not lot, f"lọt mục khác ngày: {lot}" if lot else "đã loại mục khác ngày")


@ca(4, "khoá RIÊNG TƯ ju.intimacy không được đọc tới", "phai-chan")
def _c4():
    kq = chay_node(KHO_DAY, ISO)
    xau = json.dumps(kq, ensure_ascii=False)
    return ("ju.intimacy" not in kq["daDoc"] and "chuyện riêng tư" not in xau,
            "ju.intimacy đã bị đọc/hiện ra" if "ju.intimacy" in kq["daDoc"] else "không đụng ju.intimacy")


@ca(5, "khoá GIẤY TỜ ju.docs không được đọc tới", "phai-chan")
def _c5():
    kq = chay_node(KHO_DAY, ISO)
    return ("ju.docs" not in kq["daDoc"], "ju.docs đã bị đọc" if "ju.docs" in kq["daDoc"] else "không đụng ju.docs")


@ca(6, "mục KHÔNG CÓ NGÀY hoặc không có mốc giờ phải bị loại", "phai-chan")
def _c6():
    kq = chay_node(KHO_DAY, ISO)
    tds = _tieu_de(kq)
    lot = [t for t in tds if t in ("Không có ngày", "Không có mốc giờ")]
    return (not lot, f"lọt mục thiếu ngày: {lot}" if lot else "đã loại mục thiếu ngày")


@ca(7, "mục không có chữ để hiện phải bị loại, không đếm vào số kỷ niệm", "phai-chan")
def _c7():
    kho = {"ju.mood": {"2025-08-15": {}}, "ju.timeline": [{"date": "2025-08-15", "title": "  "}]}
    kq = chay_node(kho, ISO)
    n = sum(len(g["items"]) for g in kq["nhom"])
    return (n == 0, f"đếm {n} mục rỗng" if n else "không đếm mục rỗng")


@ca(8, "nhóm theo năm, sắp mới → cũ, nhãn 'Năm ngoái' đúng khoảng cách", "cho-qua")
def _c8():
    kq = chay_node(KHO_DAY, ISO)
    nams = [g["y"] for g in kq["nhom"]]
    cach = {g["y"]: g["cach"] for g in kq["nhom"]}
    ok = nams == sorted(nams, reverse=True) and cach.get(2025) == 1 and cach.get(2024) == 2
    return (ok, f"năm={nams} cách={cach}")


@ca(9, "ngày trống thì chỉ đúng ngày gần nhất CÓ kỷ niệm", "cho-qua")
def _c9():
    kq = chay_node(KHO_DAY, "2026-08-20")
    n = sum(len(g["items"]) for g in kq["nhom"])
    gan = kq["gan"]
    return (n == 0 and gan and gan["iso"] == "2026-08-15" and gan["cach"] == -5,
            f"tong={n} gan={gan}")


@ca(10, "kho rỗng thì không chỉ đi đâu cả, không được ném lỗi", "cho-qua")
def _c10():
    kq = chay_node({}, ISO)
    return (kq["nhom"] == [] and kq["gan"] is None, f"nhom={kq['nhom']} gan={kq['gan']}")


@ca(11, "ngày 29/02 không được đẩy sang năm không nhuận thành ngày hỏng", "phai-chan")
def _c11():
    kq = chay_node({"ju.timeline": [{"date": "2024-02-29", "title": "Ngày nhuận"}]}, "2027-03-01")
    gan = kq["gan"]
    ok = gan is None or not gan["iso"].endswith("-02-29")
    return (ok, f"chỉ sang ngày không tồn tại: {gan}" if not ok else f"gan={gan}")


@ca(12, "dữ liệu sai kiểu (mảng thành chuỗi) không được làm vỡ màn", "phai-chan")
def _c12():
    kq = chay_node({"ju.timeline": "hỏng", "ju.mood": [1, 2], "ju.photos": None,
                    "ju.expenses": {"a": 1}}, ISO)
    return (kq["nhom"] == [], f"nhom={kq['nhom']}")


# ─── Bản hỏng: gỡ đúng dòng vá, ca tương ứng PHẢI ĐỎ ────────────────────────
CHOT_DAI = "if(s.length<10) return;"
CHOT_NAM = "if(!y||y>=yy) return;"
CHOT_MD = "if(x.d.slice(5,10)!==md) return;"
CHOT_NHUAN = "if(isNaN(kt.getTime())||pad(kt.getMonth()+1)+'-'+pad(kt.getDate())!==md) continue;"

# Mỗi bản hỏng: (tên, [(chuỗi cần gỡ, chuỗi thay), ...], các ca PHẢI báo không đạt)
BAN_HONG = [
    ("bỏ chốt 'năm phải nhỏ hơn năm đang xem'",
     [("if(!y||y>=yy) return;", "if(!y) return;")], [2]),
    ("bỏ chốt so khớp ngày-tháng",
     [(CHOT_MD, "if(false) return;")], [3]),
    # ⚠ Mục thiếu ngày bị CHẶN BA LỚP, đo thật 15/08/2026: chốt độ dài lúc gom · phép so
    # ngày-tháng · và chốt năm (`Number('')` ra 0 nên `!y` bắt luôn). Gỡ một hay hai lớp
    # thì lớp còn lại vẫn đỡ và ca 6 vẫn báo đạt — phải gỡ ĐỦ BA mới chứng minh được ca 6
    # có răng. Chính vì thế ca 2 và ca 3 cũng phải đỏ theo: đó là dấu hiệu bản hỏng đã
    # ăn thật, không phải nhiễu.
    ("bỏ CẢ BA lớp canh mục thiếu ngày",
     [(CHOT_DAI, ""), (CHOT_MD, "if(false) return;"), (CHOT_NAM, "if(false) return;")], [2, 3, 6]),
    ("đọc thêm khoá riêng tư ju.intimacy",
     [("  const qa=doiTuong('ju.qa');",
       "  mang('ju.intimacy').forEach(x=>them(x.date,{icon:'🔒',kind:'Riêng tư',title:x.title}));\n  const qa=doiTuong('ju.qa');")],
     [4]),
    ("bỏ chốt 'phải có chữ để hiện'",
     [("if(!String((it&&it.title)||'').trim()) return;", "")], [7]),
    ("bỏ chốt loại ngày 29/02 của năm không nhuận",
     [(CHOT_NHUAN, "")], [11]),
    # ⚠ Chiều hỏng NGƯỢC của chính chốt trên: dựng lại đúng bản `isNaN` đã trượt ngày
    # 15/08/2026. Thiếu ca này thì lần sau ai đó "rút gọn" về `isNaN` là lỗi sống lại.
    ("dùng lại phép isNaN đã chứng minh là chết câm",
     [(CHOT_NHUAN, "if(isNaN(kt.getTime())) continue;")], [11]),
    ("bỏ chốt ép kiểu mảng/đối tượng",
     [("return Array.isArray(v)?v:[];", "return v||[];")], [12]),
]


def tu_kiem() -> int:
    khoi = boc_khoi()
    print(f"Bóc {len(khoi)} ký tự khối logic từ {NGUON.relative_to(GOC.parent)}\n")

    do = 0
    print("── Bản THẬT ────────────────────────────────────────────")
    for so, ten, loai, f in CA:
        try:
            ok, ghi = f()
        except Exception as e:                                    # noqa: BLE001
            ok, ghi = False, f"ném lỗi: {e}"
        if not ok:
            do += 1
        print(f"  [{so:>2}] {'đạt   ' if ok else 'KHÔNG '} {loai:9} {ten}  — {ghi}")

    print("\n── Bản HỎNG (ca nêu trong ngoặc PHẢI báo không đạt) ────")
    for ten_hong, va, ca_do in BAN_HONG:
        # Chuỗi cần gỡ không còn trong mã ⇒ bản hỏng không gỡ được gì, và một bản hỏng
        # không gỡ được gì thì mọi ca đều đạt — tức bộ ca im lặng mất răng. Kêu ĐỎ.
        thieu = [t for t, _ in va if t not in khoi]
        if thieu:
            print(f"  ✗ {ten_hong}: không thấy {len(thieu)} chuỗi cần gỡ — bản hỏng vô nghĩa")
            do += 1
            continue
        hong = khoi
        for t, th in va:
            hong = hong.replace(t, th, 1)
        bat = []
        for so, ten, loai, f in CA:
            if so not in ca_do:
                continue
            _goc = globals()["chay_node"]
            try:
                globals()["chay_node"] = lambda kho, iso, people=None, _k=hong: _goc(kho, iso, people, _k)
                try:
                    ok, _ = f()
                except Exception:                                  # noqa: BLE001
                    ok = False                                     # ném lỗi cũng là bắt được
            finally:
                globals()["chay_node"] = _goc
            if not ok:
                bat.append(so)
        du = sorted(set(ca_do)) == sorted(bat)
        if not du:
            do += 1
        print(f"  {'✓' if du else '✗'} {ten_hong}: ca bắt được {bat or '—'} / cần {ca_do}")

    print(f"\n{'✅ ĐẠT TOÀN BỘ' if do == 0 else f'❌ {do} mục không đạt'} — {len(CA)} ca · {len(BAN_HONG)} bản hỏng")
    return 0 if do == 0 else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tu-kiem", action="store_true", help="chạy bộ ca + bản hỏng")
    a = ap.parse_args()
    if not a.tu_kiem:
        ap.print_help()
        sys.exit(2)
    sys.exit(tu_kiem())
