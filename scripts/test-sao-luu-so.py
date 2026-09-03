#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bộ ca cho `sao-luu-so.py` — luật mục 17 CLAUDE.md toàn cục.

    python3 test-sao-luu-so.py
    python3 test-sao-luu-so.py --tu-kiem

HAI CHIỀU HỎNG NGƯỢC NHAU:
  · lưới ĐỠ THỦNG — ghi bản rỗng đè lên chỗ đáng lẽ có bản tốt, hoặc phép dọn quét sạch cả
    bản vừa ghi (máy tắt hai tuần là mọi bản đều quá hạn);
  · lưới ĐỠ THỪA — ghi mọi lượt kể cả khi sổ không đổi, thư mục phình mà không thêm gì.
Bộ ca chỉ có chiều "phải ghi" thì một bản nhận mọi thứ làm dữ liệu vẫn xanh trơn — mà đó
đúng là bản nguy hiểm nhất, vì bản rỗng ghi hôm nay sẽ đẩy bản tốt ra khỏi cửa sổ giữ.

Chạy hoàn toàn NGOẠI TUYẾN trong thư mục tạm: không gọi Supabase, không cần khoá. Đồng hồ
ghim bằng tham số `bay_gio` — ca biên quanh `KHUNG_NGAY` mà lấy giờ thật thì trôi theo ngày
chạy và một hôm nào đó đỏ oan.
"""

import importlib.util
import os
import shutil
import stat
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

THU_MUC = os.path.dirname(os.path.abspath(__file__))
MODULE = os.environ.get('SAOLUUSO_BIN', os.path.join(THU_MUC, 'sao-luu-so.py'))

NAY = datetime(2026, 9, 3, 22, 0, 0)


def truoc(n):
    return NAY - timedelta(days=n)


SO = {'ju.notes': [{'id': 1, 'text': 'ky niem'}], 'ju.wish': [], 'ju.couple': {'id': 'x'}}
SO2 = {'ju.notes': [{'id': 1, 'text': 'ky niem'}, {'id': 2, 'text': 'them'}], 'ju.wish': []}


def nap(duong):
    spec = importlib.util.spec_from_file_location('sl_' + str(abs(hash(duong))), duong)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def dung_ban(M, thu, moc):
    """Dựng sẵn bản sao mang mốc giờ cho trước, để đo phép dọn mà không phải chờ."""
    thu.mkdir(parents=True, exist_ok=True)
    for i, d in enumerate(moc):
        ten = 'justus-' + d.strftime('%Y%m%d-%H%M%S') + '-' + ('%012d' % i) + '.json'
        (thu / ten).write_text('{"ju.notes":[]}', encoding='utf-8')


# ---------- 07 ca PHẢI CHẶN / PHẢI GHI ----------

def ca_01(M, thu):
    """PHẢI CHẶN · khối None."""
    try:
        M.luu(None, thu, NAY)
        return 'không ném khi khối là None'
    except Exception:
        return '' if not M.danh_sach(thu) else 'đã ghi file dù khối rỗng'


def ca_02(M, thu):
    """PHẢI CHẶN · khối {} rỗng."""
    try:
        M.luu({}, thu, NAY)
        return 'không ném khi khối {} rỗng'
    except Exception:
        return ''


def ca_03(M, thu):
    """PHẢI CHẶN · khối lạ không mang khoá ju.* (đọc máy chủ đã hỏng)."""
    try:
        M.luu({'message': 'JWT expired', 'code': 401}, thu, NAY)
        return 'nhận thông báo lỗi làm bản sao sổ'
    except Exception:
        return ''


def ca_04(M, thu):
    """PHẢI CHẶN · khối là danh sách."""
    try:
        M.luu([{'ju.notes': []}], thu, NAY)
        return 'nhận danh sách làm khối dữ liệu'
    except Exception:
        return ''


def ca_05(M, thu):
    """PHẢI GHI · khối hợp lệ ra đúng 01 file, đọc lại khớp."""
    import json
    kq = M.luu(SO, thu, NAY)
    if kq.get('bo_qua'):
        return 'bỏ qua khối hợp lệ đầu tiên'
    ds = M.danh_sach(thu)
    if len(ds) != 1:
        return 'ra %d file' % len(ds)
    lai = json.loads((thu / ds[0]).read_text(encoding='utf-8'))
    return '' if lai == SO else 'nội dung đọc lại không khớp'


def ca_06(M, thu):
    """PHẢI CHẶN · file phải quyền 600 (nhật ký riêng, mục 18/25)."""
    kq = M.luu(SO, thu, NAY)
    che = stat.S_IMODE(os.stat(kq['duong']).st_mode)
    return '' if che == 0o600 else 'quyền là %o, phải là 600' % che


def ca_07(M, thu):
    """PHẢI DỌN · 12 bản đều quá hạn thì xoá 04, chừa đúng 08 bản mới nhất."""
    dung_ban(M, thu, [truoc(20 + i) for i in range(12)])
    kq = M.don(thu, bay_gio=NAY)
    if len(kq['da_xoa']) != 4:
        return 'xoá %d bản, phải xoá 4' % len(kq['da_xoa'])
    return '' if kq['con_lai'] == 8 else 'còn %d bản, phải còn 8' % kq['con_lai']


# ---------- 06 ca ĐỐI CHỨNG ----------

def ca_08(M, thu):
    """ĐỐI CHỨNG · mọi bản quá hạn mà chỉ có 03 bản thì KHÔNG xoá cái nào."""
    dung_ban(M, thu, [truoc(40), truoc(50), truoc(60)])
    kq = M.don(thu, bay_gio=NAY)
    return '' if not kq['da_xoa'] else 'quét sạch lưới đỡ, xoá %d' % len(kq['da_xoa'])


def ca_09(M, thu):
    """ĐỐI CHỨNG · 20 bản đều trong hạn thì KHÔNG xoá cái nào."""
    dung_ban(M, thu, [NAY - timedelta(hours=i) for i in range(20)])
    kq = M.don(thu, bay_gio=NAY)
    return '' if not kq['da_xoa'] else 'xoá nhầm %d bản còn trong hạn' % len(kq['da_xoa'])


def ca_10(M, thu):
    """ĐỐI CHỨNG · biên: đúng 07 ngày còn giữ, quá 01 phút thì xoá."""
    dung_ban(M, thu, [NAY - timedelta(minutes=i) for i in range(9)])
    dung_ban(M, thu, [NAY - timedelta(days=7) + timedelta(minutes=1)])
    if M.don(thu, bay_gio=NAY)['da_xoa']:
        return 'xoá bản đúng biên 07 ngày (phải giữ)'
    dung_ban(M, thu, [NAY - timedelta(days=7, minutes=1)])
    kq = M.don(thu, bay_gio=NAY)
    return '' if len(kq['da_xoa']) == 1 else 'không xoá bản quá biên 01 phút'


def ca_11(M, thu):
    """ĐỐI CHỨNG · sổ y hệt bản trước thì bỏ qua, không ghi thêm."""
    M.luu(SO, thu, truoc(0))
    kq = M.luu(SO, thu, NAY)
    if not kq.get('bo_qua'):
        return 'ghi thêm bản trùng nội dung'
    return '' if len(M.danh_sach(thu)) == 1 else 'ra %d file' % len(M.danh_sach(thu))


def ca_12(M, thu):
    """ĐỐI CHỨNG · sổ đã đổi thì phải ghi bản riêng, dù mốc giờ máy chủ không đổi."""
    M.luu(SO, thu, truoc(0))
    kq = M.luu(SO2, thu, NAY)
    if kq.get('bo_qua'):
        return 'bỏ qua bản đã đổi nội dung — mất lưới đỡ của lượt này'
    return '' if len(M.danh_sach(thu)) == 2 else 'không ghi thành 2 bản'


def ca_13(M, thu):
    """ĐỐI CHỨNG · file lạ trong thư mục không bị đụng tới."""
    thu.mkdir(parents=True, exist_ok=True)
    (thu / 'ghi-chu.txt').write_text('khong phai ban sao', encoding='utf-8')
    dung_ban(M, thu, [truoc(20 + i) for i in range(12)])
    M.don(thu, bay_gio=NAY)
    return '' if (thu / 'ghi-chu.txt').exists() else 'đã xoá file lạ không phải bản sao'


CA = [('01 PHẢI CHẶN · khối None', ca_01),
      ('02 PHẢI CHẶN · khối {} rỗng', ca_02),
      ('03 PHẢI CHẶN · khối lạ không mang khoá ju.*', ca_03),
      ('04 PHẢI CHẶN · khối là danh sách', ca_04),
      ('05 PHẢI GHI · khối hợp lệ, đọc lại khớp', ca_05),
      ('06 PHẢI CHẶN · file phải quyền 600', ca_06),
      ('07 PHẢI DỌN · bản quá hạn, chừa 08 bản mới nhất', ca_07),
      ('08 ĐỐI CHỨNG · ít bản thì không xoá dù quá hạn', ca_08),
      ('09 ĐỐI CHỨNG · bản trong hạn không bị xoá', ca_09),
      ('10 ĐỐI CHỨNG · hai biên quanh 07 ngày', ca_10),
      ('11 ĐỐI CHỨNG · sổ không đổi thì không ghi thêm', ca_11),
      ('12 ĐỐI CHỨNG · sổ đã đổi thì phải ghi', ca_12),
      ('13 ĐỐI CHỨNG · file lạ không bị đụng', ca_13)]


def chay(duong_module):
    M = nap(duong_module)
    loi = []
    for ten, ham in CA:
        thu = Path(tempfile.mkdtemp(prefix='jusaoluu-')) / 'sao-luu'
        try:
            vidu = ham(M, thu)
        except Exception as e:
            vidu = 'NỔ: %s' % e
        if vidu:
            loi.append((ten, vidu))
        shutil.rmtree(thu.parent, ignore_errors=True)
    return loi


BAN_HONG = [
    ('bỏ kiểm khối rỗng (ghi bản rỗng đè chỗ của bản tốt)',
     lambda s: s.replace(
         "    if not hop_le(khoi):\n"
         "        raise RuntimeError('khối dữ liệu rỗng hoặc không mang khoá ju.* — từ chối ghi bản sao rỗng')\n", ''),
     ['01', '02', '03', '04']),

    ('nới `hop_le` thành "cứ là dict thì nhận"',
     lambda s: s.replace("    return any(k.startswith(TIEN_TO_KHOA) for k in khoi)", '    return True'),
     ['03']),

    ('ghi bằng quyền mặc định (nhật ký riêng ai đọc cũng được)',
     lambda s: s.replace("    fd = os.open(duong, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)\n"
                         "    with os.fdopen(fd, 'w', encoding='utf-8') as f:\n"
                         "        f.write(noi_dung)\n"
                         "    os.chmod(duong, 0o600)",
                         "    duong.write_text(noi_dung, encoding='utf-8')"),
     ['06']),

    ('dọn bỏ luật giữ tối thiểu (máy tắt hai tuần là quét sạch)',
     lambda s: s.replace('    for ten in danh_sach(thu_muc)[toi_thieu:]:',
                         '    for ten in danh_sach(thu_muc):'),
     ['08']),

    ('dọn bỏ lọc theo ngày (xoá cả bản vừa ghi)',
     lambda s: s.replace('        if moc >= han:\n            continue\n', ''),
     ['09', '10']),

    ('dọn nhận mọi tên file (xoá cả file lạ)',
     lambda s: s.replace("    return sorted((t for t in ten if t.startswith(TIEN_TO) and t.endswith('.json')),\n"
                         "                  reverse=True)",
                         '    return sorted(ten, reverse=True)')
                .replace("        m = re.match(r'^justus-(\\d{8}-\\d{6})-', ten)\n"
                         "        if not m:\n            continue\n",
                         "        m = re.match(r'^justus-(\\d{8}-\\d{6})-', ten)\n"
                         "        if not m:\n"
                         "            try:\n                os.unlink(thu_muc / ten)\n"
                         "                da_xoa.append(ten)\n            except OSError:\n                pass\n"
                         "            continue\n"),
     ['13']),

    ('bỏ khử trùng, lượt nào cũng ghi',
     lambda s: s.replace("    if bam_gan_nhat(thu_muc) == h:\n"
                         "        return {'bo_qua': 'trung-noi-dung', 'bam': h}\n", ''),
     ['11']),
]


def tu_kiem():
    goc = open(MODULE, encoding='utf-8').read()
    bat_het = True
    print('\n--- TỰ KIỂM: dựng bản hỏng rồi đòi ca đã khai phải ĐỎ ---')
    for ten, pha, ca_phai_do in BAN_HONG:
        hong = pha(goc)
        if hong == goc:
            print('  ✗ %s: PHÉP THAY KHÔNG ĂN — mã nguồn đã đổi, sửa lại phép thay' % ten)
            bat_het = False
            continue
        thu = tempfile.mkdtemp(prefix='juhong-')
        tam = os.path.join(thu, 'sao-luu-so.py')
        open(tam, 'w', encoding='utf-8').write(hong)
        do_that = {t[:2] for t, _ in chay(tam)}
        thieu = [c for c in ca_phai_do if c not in do_that]
        if thieu:
            print('  ✗ %s: ca %s vẫn XANH trên bản hỏng' % (ten, ','.join(thieu)))
            bat_het = False
        else:
            print('  ✓ %s: bắt được (ca %s đỏ)' % (ten, ','.join(ca_phai_do)))
        shutil.rmtree(thu, ignore_errors=True)
    return bat_het


def main():
    loi = chay(MODULE)
    print('\n=== %d/%d ca đạt trên bản thật ===' % (len(CA) - len(loi), len(CA)))
    for ten, vidu in loi:
        print('  ✗ %s\n      %s' % (ten, vidu))
    ok = not loi
    if '--tu-kiem' in sys.argv:
        bat = tu_kiem()
        print('\n=== TỰ KIỂM: %s ===' % ('mọi bản hỏng đều bị bắt' if bat else 'CÓ BẢN HỎNG LỌT LƯỚI'))
        ok = ok and bat
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
