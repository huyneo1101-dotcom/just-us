#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sao lưu sổ chung Just Us xuống đĩa — lưới đỡ khi dữ liệu trên máy chủ hỏng hoặc mất.

    python3 sao-luu-so.py            lưu một bản, dọn bản quá hạn
    python3 sao-luu-so.py --xem      chỉ đo, không ghi gì
    python3 sao-luu-so.py --liet-ke  liệt kê bản đang giữ

Vì sao cần: toàn bộ state của app nằm trong ĐÚNG MỘT hàng của bảng `justus_data`, và cả
hai máy đều ghi đè trọn hàng ấy mỗi lần đồng bộ. Không có phiên bản, không có lịch sử:
một lượt ghi hỏng, một lần xoá nhầm trong app, hay chính Supabase mất dữ liệu là mất sạch
nhật ký, ảnh kỷ niệm đã gắn, danh sách mong ước, hộp thư tình — thứ không dựng lại được
bằng bất cứ cách nào. Đo 03/09/2026: bảng có 01 hàng, lần ghi gần nhất 23/08.

⛔ BỐN LUẬT (giữ đúng khuôn `App/sync/sao-luu.js`, đã trả giá ở đó):
1. **Bản rỗng hay khối lạ thì NÉM, không ghi.** Đọc hỏng mà vẫn ghi xuống là tự tay thay
   lưới đỡ bằng tờ giấy trắng, rồi tuần sau bản tốt bị dọn mất.
2. **Quyền 600 ngay lúc tạo**, thư mục `sao-luu/` đã `.gitignore`. Đây là nhật ký riêng
   của hai vợ chồng — không `/tmp`, không git, kể cả repo riêng tư (mục 18 và 25).
3. **Dọn theo ngày nhưng luôn chừa `TOI_THIEU_GIU` bản mới nhất.** Máy tắt hai tuần rồi
   bật lại: mọi bản đều quá hạn, luật dọn thuần theo ngày quét sạch đúng lúc cần nhất.
4. **Khử trùng theo NỘI DUNG, không theo `updated_at`.** Hai bên sửa qua lại làm mốc giờ
   đổi mà nội dung y hệt; ngược lại một lượt ghi hỏng có thể giữ nguyên mốc.

⛔ Khoá `service_role` KHÔNG bao giờ ra màn hình, không vào log, không vào tham số dòng
lệnh (mục 14c) — chẩn đoán in độ dài và mã HTTP.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sb_admin  # noqa: E402

# Dòng khai giá trị ĐANG CÓ HIỆU LỰC — sửa đúng đây khi đổi ngưỡng.
KHUNG_NGAY = 7
TOI_THIEU_GIU = 8
TIEN_TO = 'justus-'
# Khoá bắt buộc phải có thì khối mới coi là sổ thật. `ju.` là tiền tố mọi khoá của app.
TIEN_TO_KHOA = 'ju.'

THU_MUC = Path(os.environ.get('JUSTUS_THU_MUC_SAO_LUU') or
               Path(__file__).resolve().parent.parent / 'sao-luu')


def hop_le(khoi) -> bool:
    """Khối phải là object mang ít nhất một khoá `ju.*`. Fail về phía KÊU."""
    if not isinstance(khoi, dict) or not khoi:
        return False
    return any(k.startswith(TIEN_TO_KHOA) for k in khoi)


def bam(chuoi: str) -> str:
    return hashlib.sha1(chuoi.encode('utf-8')).hexdigest()[:12]


def danh_sach(thu_muc: Path):
    """Bản sao đã có, mới nhất đứng đầu. Xếp theo TÊN (mang mốc giờ), không theo mtime."""
    try:
        ten = os.listdir(thu_muc)
    except OSError:
        return []
    return sorted((t for t in ten if t.startswith(TIEN_TO) and t.endswith('.json')),
                  reverse=True)


def bam_gan_nhat(thu_muc: Path):
    ds = danh_sach(thu_muc)
    if not ds:
        return None
    m = re.search(r'-([0-9a-f]{12})\.json$', ds[0])
    return m.group(1) if m else None


def doc_may_chu():
    """Trả (couple_id, khối data). Ném khi không đọc được — đọc hỏng phải KÊU."""
    khoa = sb_admin.khoa_service()
    if not khoa:
        raise RuntimeError('không lấy được khoá service_role')
    url = sb_admin.SB_URL + '/rest/v1/justus_data?select=couple_id,data,updated_at'
    req = urllib.request.Request(url, headers={'apikey': khoa, 'Authorization': 'Bearer ' + khoa})
    with urllib.request.urlopen(req, timeout=60) as r:
        hang = json.load(r)
    if not hang:
        raise RuntimeError('bảng justus_data KHÔNG có hàng nào — sổ chung đã mất hoặc chưa ghép cặp')
    if len(hang) > 1:
        raise RuntimeError('bảng có %d hàng, khuôn app chỉ có 01 — dừng để người xem lại' % len(hang))
    return hang[0].get('couple_id'), hang[0].get('data')


def luu(khoi, thu_muc: Path, bay_gio: datetime = None):
    """Ghi bản mới. Trả dict {duong,byte,bam} hoặc {bo_qua:...}. Ném khi khối không hợp lệ."""
    if not hop_le(khoi):
        raise RuntimeError('khối dữ liệu rỗng hoặc không mang khoá ju.* — từ chối ghi bản sao rỗng')
    bay_gio = bay_gio or datetime.now()
    noi_dung = json.dumps(khoi, ensure_ascii=False, sort_keys=True)
    h = bam(noi_dung)
    if bam_gan_nhat(thu_muc) == h:
        return {'bo_qua': 'trung-noi-dung', 'bam': h}
    thu_muc.mkdir(parents=True, exist_ok=True)
    os.chmod(thu_muc, 0o700)
    duong = thu_muc / (TIEN_TO + bay_gio.strftime('%Y%m%d-%H%M%S') + '-' + h + '.json')
    # Mở bằng mô tả file có sẵn cờ quyền: ghi trước rồi chmod sau là chừa một khoảnh khắc
    # file nằm đó với quyền mặc định.
    fd = os.open(duong, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(noi_dung)
    os.chmod(duong, 0o600)
    return {'duong': str(duong), 'byte': len(noi_dung.encode('utf-8')), 'bam': h}


def don(thu_muc: Path, ngay=KHUNG_NGAY, toi_thieu=TOI_THIEU_GIU, bay_gio: datetime = None):
    bay_gio = bay_gio or datetime.now()
    han = bay_gio - timedelta(days=ngay)
    da_xoa = []
    for ten in danh_sach(thu_muc)[toi_thieu:]:
        m = re.match(r'^justus-(\d{8}-\d{6})-', ten)
        if not m:
            continue
        try:
            moc = datetime.strptime(m.group(1), '%Y%m%d-%H%M%S')
        except ValueError:
            continue
        if moc >= han:
            continue
        try:
            os.unlink(thu_muc / ten)
            da_xoa.append(ten)
        except OSError:
            pass
    return {'da_xoa': da_xoa, 'con_lai': len(danh_sach(thu_muc))}


def main():
    if '--liet-ke' in sys.argv:
        ds = danh_sach(THU_MUC)
        print('%d bản đang giữ ở %s' % (len(ds), THU_MUC))
        for t in ds:
            print('   ', t, '·', os.path.getsize(THU_MUC / t) // 1024, 'KB')
        return 0

    try:
        couple, khoi = doc_may_chu()
    except Exception as e:
        print('⛔ KHÔNG đọc được sổ trên máy chủ: %s' % e)
        return 1

    so_khoa = len(khoi) if isinstance(khoi, dict) else 0
    print('Đọc được sổ của cặp %s… · %d khoá' % (str(couple)[:8], so_khoa))
    if '--xem' in sys.argv:
        print('(chỉ đo, không ghi)')
        return 0

    try:
        kq = luu(khoi, THU_MUC)
    except Exception as e:
        print('⛔ KHÔNG lưu được: %s' % e)
        return 1
    if kq.get('bo_qua'):
        print('💾 Sổ y hệt bản đã lưu — không ghi thêm.')
    else:
        print('💾 Đã lưu %d KB → %s' % (kq['byte'] // 1024, kq['duong']))
    kq_don = don(THU_MUC)
    if kq_don['da_xoa']:
        print('🧹 Dọn %d bản quá %d ngày, còn giữ %d.'
              % (len(kq_don['da_xoa']), KHUNG_NGAY, kq_don['con_lai']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
