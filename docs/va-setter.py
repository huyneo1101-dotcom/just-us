#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rà và vá lỗi setter đọc biến của lần vẽ TRƯỚC (stale state) trong index.html.

  python3 va_setter.py --soi   -> chỉ liệt kê
  python3 va_setter.py --va    -> ghi đè file
"""
import re, sys, json, unicodedata, collections

import os
F = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')

def doc():
    with open(F, encoding='utf-8') as fh:
        return unicodedata.normalize('NFC', fh.read())

def can_bang(s, i):
    """i trỏ vào '(' -> chỉ số ')' khớp; bỏ qua chuỗi và chú thích dòng."""
    depth, n = 0, len(s)
    while i < n:
        c = s[i]
        if c in '"\'`':
            q, i = c, i + 1
            while i < n:
                if s[i] == '\\': i += 2; continue
                if s[i] == q: break
                i += 1
        elif c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0: return i
        elif c == '/' and i + 1 < n and s[i+1] == '/':
            while i < n and s[i] != '\n': i += 1
        i += 1
    return -1

def cac_lan_xuat_hien(arg, var):
    """Vị trí biến đứng độc lập. Chấp nhận '...var' (spread), loại '.var' (thuộc tính)."""
    ra = []
    for m in re.finditer(r'(?<![\w$])' + re.escape(var) + r'(?![\w$])', arg):
        i = m.start()
        if i > 0 and arg[i-1] == '.':
            # chỉ giữ khi là toán tử spread '...'
            if not (i >= 3 and arg[i-3:i] == '...'):
                continue
        ra.append(m.span())
    return ra

def nguon_khai_bao(s):
    """(var,setter) -> 'useLocal' | 'useState' | 'khac'"""
    ra = {}
    for m in re.finditer(r'\[\s*([A-Za-z_$][\w$]*)\s*,\s*(set[A-Z][\w$]*)\s*\]\s*=\s*([A-Za-z_$][\w$]*)', s):
        ra.setdefault((m.group(1), m.group(2)), set()).add(m.group(3))
    return ra

# Kiểu giá trị suy từ dạng biểu thức
def phan_loai(arg, var):
    a = arg.strip()
    if re.match(r'^\[', a) or re.search(r'(?<![\w$.])' + re.escape(var) + r'\s*\.\s*(map|filter|slice|concat|sort)\b', a):
        return 'mang'
    if re.match(r'^\{', a):
        return 'doi-tuong'
    if re.match(r'^\(\s*' + re.escape(var) + r'\s*\|\|\s*\[\]\s*\)', a):
        return 'mang'
    return 'khac'

def main():
    che_do = sys.argv[1] if len(sys.argv) > 1 else '--soi'
    s = doc()
    nguon = nguon_khai_bao(s)

    uv = []
    for m in re.finditer(r'\bset([A-Z][\w$]*)\s*\(', s):
        setter = 'set' + m.group(1)
        var = m.group(1)[0].lower() + m.group(1)[1:]
        o = m.end() - 1
        c = can_bang(s, o)
        if c < 0: continue
        arg = s[o+1:c]
        if re.match(r'\s*(prev|p)\s*=>', arg): continue
        spans = cac_lan_xuat_hien(arg, var)
        if not spans: continue
        hooks = nguon.get((var, setter), set())
        uv.append(dict(dong=s.count('\n', 0, o) + 1, o=o, c=c, setter=setter, var=var,
                       arg=arg, spans=spans, hook=('useLocal' if 'useLocal' in hooks
                                                   else ('useState' if 'useState' in hooks else 'khong-ro')),
                       kieu=phan_loai(arg, var)))

    dem = collections.Counter((u['hook'], u['kieu']) for u in uv)
    print('Tổng ứng viên đọc lại chính mình: %d' % len(uv))
    for k, v in sorted(dem.items()):
        print('   %-12s %-12s %d' % (k[0], k[1], v))

    # PHẠM VI VÁ: state lưu đĩa (useLocal) — cả mảng lẫn object spread-của-chính-nó
    lam = [u for u in uv if u['hook'] == 'useLocal' and u['kieu'] == 'mang']
    ngoai = [u for u in uv if u not in lam]

    if che_do == '--soi':
        print('\n--- SẼ VÁ (%d) ---' % len(lam))
        for u in lam:
            print(' %5d %-13s %-11s %s' % (u['dong'], u['setter'], u['kieu'], u['arg'][:120]))
        print('\n--- ĐỂ NGUYÊN (%d) ---' % len(ngoai))
        for u in ngoai:
            print(' %5d %-13s %-9s %-11s %s' % (u['dong'], u['setter'], u['hook'], u['kieu'], u['arg'][:100]))
        return

    out = s
    for u in sorted(lam, key=lambda z: -z['o']):
        arg = u['arg']
        for a, b in sorted(u['spans'], reverse=True):
            arg = arg[:a] + 'prev' + arg[b:]
        out = out[:u['o']+1] + 'prev=>' + arg + out[u['c']:]
    with open(F, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print('Đã vá %d chỗ.' % len(lam))

main()
