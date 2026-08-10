#!/usr/local/bin/python3
# -*- coding: utf-8 -*-
"""Đo app Tâm linh bằng cách MỞ THẬT trong trình duyệt rồi bấm thật.

VÌ SAO PHẢI CÓ (đo 10/08/2026). Lúc tách app này khỏi Just Us, 06 thứ dùng chung bị bỏ
quên: `uid` · `celebrate` · `openUrl` · `reduceNum` · `thanSo` · `NUM_MEAN`/`PY_MEAN`.
Hậu quả là Tử vi và Thần số ném `ReferenceError` NGAY ở lần bấm nút đầu tiên — nhưng
trang vẫn mở, menu vẫn vẽ, danh sách kinh vẫn đọc được. Không màn hình trắng, không
thông báo, không lệnh nào kêu. Phải có người ngồi bấm đúng hai nút ấy mới lộ ra, và
thực tế là Huy phát hiện chứ không phải máy.

Mọi phép đo tĩnh (grep, đếm ký tự, dịch thử) đều KHÔNG bắt được lỗi này: mã dịch sạch,
cú pháp đúng, tên hàm chỉ vắng mặt lúc chạy. Vì thế bộ này mở app bằng Chrome headless,
bấm vào từng nhánh có nhập liệu, rồi đọc kết quả hiện ra.

    python3 thu-tam-linh.py             # chạy 09 ca trên bản đang có
    python3 thu-tam-linh.py --tu-kiem   # dựng bản hỏng, chứng minh bộ ca bắt được lỗi

Ca PHẢI CHẶN của bộ này là các ca "bấm xong phải ra kết quả": gỡ một hàm dùng chung ra
khỏi nguồn thì đúng ca ấy phải ĐỎ. Ca ĐỐI CHỨNG là "trang mở được và menu đủ 04 nhóm" —
nó phải XANH ở cả bản đúng lẫn bản hỏng, vì bản hỏng chỉ giết nhánh bấm nút chứ không
giết cả app; ca nào cũng đỏ nghĩa là phép thay đã phá cú pháp chứ không phải gỡ lớp vá.
"""
import sys, os, re, json, time, socket, subprocess, tempfile, shutil, hashlib
import http.server, threading, functools

THU_MUC = os.path.dirname(os.path.abspath(__file__))
DUNG = '/Users/Huy/Claude/HeThong/dungapp/dung.py'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
NODE_BIN = '/opt/homebrew/bin'   # dung.py gọi `node`; PATH của phiên tự động thường thiếu

# Kịch bản bấm, nhét vào trước </body> của một bản sao index.html. Ghi kết quả vào
# document.title vì `--dump-dom` đọc được title mà không cần cầu nối gỡ lỗi nào.
KICH_BAN = r"""
<script>
(function(){
  var ket=[];
  function ghi(t,ok){ ket.push((ok?'PASS':'FAIL')+'\t'+t); }
  function txt(){ var r=document.getElementById('root'); return (r&&r.innerText||'').toLowerCase(); }
  function nut(chu){ return Array.from(document.querySelectorAll('button,a')).find(function(b){
    return ((b.innerText||'')+(b.getAttribute('aria-label')||'')).toLowerCase().indexOf(chu.toLowerCase())>=0; }); }
  function dat(inp,v){ var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    s.call(inp,v); inp.dispatchEvent(new Event('input',{bubbles:true})); }
  function xong(){ document.title='KETQUA::'+ket.join(' ## '); }
  window.addEventListener('error',function(e){ ket.push('FAIL\tlỗi JS: '+e.message); });
  setTimeout(function(){
    try{
      ghi('trang mở được, menu đủ 04 nhóm', document.querySelectorAll('.tl-dock button').length===4);
      ghi('thanh trên hiện ngày âm', /âm|rằm|mùng/.test((document.querySelector('.tl-ttl span')||{}).innerText||''));
      ghi('màn mở đầu có danh sách ngày lễ', txt().indexOf('ngày tới')>=0);
      var b=nut('Vận số'); ghi('vào được nhóm Vận số', !!b); if(b) b.click();
      setTimeout(function(){
        var i1=document.querySelectorAll('.card input');
        dat(i1[0],'Thử'); dat(i1[1],'1990-05-17');
        setTimeout(function(){
          var x=nut('Xem tử vi'); if(x) x.click();
          setTimeout(function(){
            var t=txt();
            ghi('TỬ VI: bấm xong ra bản mệnh', t.indexOf('bản mệnh')>=0);
            ghi('TỬ VI: ra tam hợp', t.indexOf('tam hợp')>=0);
            var tb=Array.from(document.querySelectorAll('.tl-sub')).find(function(s){ return (s.innerText||'').indexOf('Thần')>=0; });
            if(tb) tb.click();
            setTimeout(function(){
              var i2=document.querySelectorAll('.card input');
              dat(i2[0],'Thử2'); dat(i2[1],'1990-05-17');
              setTimeout(function(){
                var x2=nut('Xem số'); if(x2) x2.click();
                setTimeout(function(){
                  var t2=txt();
                  ghi('THẦN SỐ: bấm xong ra số chủ đạo', t2.indexOf('số chủ đạo')>=0);
                  ghi('THẦN SỐ: tính đúng số 5 cho 17/05/1990', /số 5\s*·/.test(t2));
                  ghi('THẦN SỐ: ra năm cá nhân', t2.indexOf('năm cá nhân')>=0);
                  xong();
                },300);
              },140);
            },260);
          },320);
        },140);
      },260);
    }catch(e){ ket.push('FAIL\tném lỗi: '+e.message); xong(); }
  },1400);
})();
</script>
</body>"""


def _cong_trong():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); c = s.getsockname()[1]; s.close(); return c


def _mo_web(thu_muc):
    """Máy chủ tĩnh tạm — app fetch data/spirit.json nên mở bằng file:// là chết CORS."""
    cong = _cong_trong()
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=thu_muc)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', cong), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, cong


def chay_ca(thu_muc=THU_MUC):
    """Trả danh sách (dat, ten). Ném RuntimeError khi CHƯA ĐO ĐƯỢC (khác với đo ra hỏng)."""
    if not os.path.exists(CHROME):
        raise RuntimeError('không có Chrome ở %s — chưa đo được' % CHROME)
    idx = os.path.join(thu_muc, 'index.html')
    if not os.path.exists(idx):
        raise RuntimeError('không thấy %s' % idx)
    than = open(idx, encoding='utf-8').read()
    if '</body>' not in than:
        raise RuntimeError('index.html không có </body> — hình dạng file khác dự kiến')
    ten_thu = '_thu-%d.html' % os.getpid()
    d_thu = os.path.join(thu_muc, ten_thu)
    open(d_thu, 'w', encoding='utf-8').write(than.replace('</body>', KICH_BAN))
    srv, cong = _mo_web(thu_muc)
    try:
        r = subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox',
                            '--virtual-time-budget=15000', '--dump-dom',
                            'http://127.0.0.1:%d/%s' % (cong, ten_thu)],
                           capture_output=True, text=True, timeout=120)
        m = re.search(r'<title>(.*?)</title>', r.stdout, re.S)
        if not m or 'KETQUA::' not in m.group(1):
            # Không có title kết quả nghĩa là kịch bản chưa chạy hết — app chết giữa chừng.
            return [(False, 'app chạy tới cuối kịch bản (không có kết quả trả về)')]
        ra = []
        for muc in m.group(1).split('KETQUA::')[1].split(' ## '):
            if '\t' not in muc:
                continue
            tt, ten = muc.split('\t', 1)
            ra.append((tt == 'PASS', ten))
        return ra
    finally:
        srv.shutdown()
        try:
            os.remove(d_thu)
        except OSError:
            pass


def main():
    try:
        ket = chay_ca()
    except RuntimeError as e:
        print('⚠ CHƯA ĐO ĐƯỢC: %s' % e)
        return 2
    hong = [t for ok, t in ket if not ok]
    for ok, t in ket:
        print('  %s %s' % ('✓' if ok else '✗ TRƯỢT', t))
    if hong:
        print('\n✗ %d/%d ca TRƯỢT' % (len(hong), len(ket)))
        return 1
    print('\n✓ %d/%d ca đạt' % (len(ket), len(ket)))
    return 0


# ─────────────────────────── tự kiểm ───────────────────────────
# Mỗi bản hỏng gỡ ĐÚNG một hàm dùng chung khỏi nguồn rồi dựng lại — mô phỏng đúng cái đã
# xảy ra thật lúc tách app. Lời khai là những ca BẮT BUỘC phải đỏ ở bản đó.
"""Lời khai là CHUỖI CON của tên ca phải đỏ, không phải tên đầy đủ: ba lối chết dưới đây
ra ba dạng bản ghi khác hẳn nhau, và đó chính là thứ phải đo trước rồi mới khai.

- Hàm bị gọi lúc RENDER (`thanSo`, `luanTuVi`) ⇒ React bỏ cả cây, kịch bản không chạy hết,
  bộ ca chỉ còn đúng một dòng "app chạy tới cuối kịch bản".
- Hàm bị gọi SAU khi đã lưu state (`celebrate` nằm cuối `add()`) ⇒ kết quả vẫn hiện ra
  bình thường, chỉ có `window.onerror` bắt được. Không có lớp bắt lỗi JS ấy thì bản hỏng
  này lọt hoàn toàn — đo thật 10/08/2026, 09/09 ca vẫn PASS.
"""
BAN_HONG = [
    ('gỡ hàm thanSo (đúng lỗi đã xảy ra 09/08)',
     'function thanSo(dateStr,curYear){', 'function thanSo_DA_GO(dateStr,curYear){',
     ['THẦN SỐ: bấm xong ra số chủ đạo']),
    ('gỡ hàm celebrate — chỉ lớp bắt lỗi JS thấy được',
     'function celebrate(emojis){', 'function celebrate_DA_GO(emojis){',
     ['lỗi JS']),
    ('gỡ hàm luanTuVi (ném ngay lúc render, app chết giữa chừng)',
     'function luanTuVi(p){', 'function luanTuVi_DA_GO(p){',
     ['app chạy tới cuối kịch bản']),
    ('bỏ hẳn nhóm Chay · Cỗ khỏi dock (menu còn 03 nhóm)',
     "  {k:'an',   ten:'Chay · Cỗ', ic:Ic.chay, con:[{k:'chay', ten:'Quán chay'},{k:'co', ten:'Mâm cỗ'}]},\n",
     '',
     ['menu đủ 04 nhóm']),
]


def tu_kiem():
    if not os.path.exists(DUNG):
        print('⚠ CHƯA ĐO ĐƯỢC: không thấy %s' % DUNG)
        return 2
    print('Chạy bộ ca trên BẢN ĐÚNG trước — một ca đỏ sẵn ở đây cũng đỏ ở mọi bản hỏng,')
    print('nên không làm lệch phép so nào và sẽ nuốt mất bản hỏng thật.\n')
    if main() != 0:
        print('\n✗ TỰ KIỂM TRƯỢT: bản đúng đã không đạt.')
        return 1
    goc_jsx = open(os.path.join(THU_MUC, 'nguon', 'app.jsx'), encoding='utf-8').read()
    tong_hong = 0
    for ten, tim, thay, phai_do in BAN_HONG:
        if goc_jsx.count(tim) != 1:
            print('  ✗ %s — chuỗi neo khớp %d chỗ (phải đúng 1)' % (ten, goc_jsx.count(tim)))
            tong_hong += 1
            continue
        # Bản hỏng dựng trong thư mục tạm RIÊNG, mang pid vào tên: hai phiên chạy song
        # song không được xoá bản hỏng của nhau, và bản thật không bị chạm tới.
        tam = tempfile.mkdtemp(prefix='_thu-hong-%d-%s-' % (
            os.getpid(), hashlib.sha1(tim.encode()).hexdigest()[:8]))
        try:
            d = os.path.join(tam, 'tam-linh')
            shutil.copytree(THU_MUC, d, ignore=shutil.ignore_patterns('_thu-*', '*.bak'))
            p = os.path.join(d, 'nguon', 'app.jsx')
            open(p, 'w', encoding='utf-8').write(goc_jsx.replace(tim, thay))
            moi = dict(os.environ, PATH=NODE_BIN + ':' + os.environ.get('PATH', ''))
            r = subprocess.run(['python3', DUNG, d], capture_output=True, text=True,
                               timeout=300, env=moi)
            if r.returncode != 0:
                print('  ✗ %s — không dựng được bản hỏng: %s' % (ten, (r.stderr or r.stdout)[-160:]))
                tong_hong += 1
                continue
            ket = chay_ca(d)
            do = [t for ok, t in ket if not ok]
            if len(do) == len(ket) and len(ket) > 1:
                print('  ✗ %s — MỌI ca đều đỏ: phép thay đã phá cú pháp, không phải gỡ lớp vá' % ten)
                tong_hong += 1
                continue
            thieu = [k for k in phai_do if not any(k in t for t in do)]
            if thieu:
                print('  ✗ %s — bộ ca KHÔNG bắt được: thiếu đỏ ở %s' % (ten, ' · '.join(thieu)))
                tong_hong += 1
            else:
                print('  ✓ %s — bắt được bởi: %s' % (ten, ' · '.join(do[:3])))
        finally:
            shutil.rmtree(tam, ignore_errors=True)
    if tong_hong:
        print('\n✗ TỰ KIỂM TRƯỢT %d/%d bản hỏng' % (tong_hong, len(BAN_HONG)))
        return 1
    print('\n✓ TỰ KIỂM ĐẠT: %d/%d bản hỏng đều bị bắt' % (len(BAN_HONG), len(BAN_HONG)))
    return 0


if __name__ == '__main__':
    sys.exit(tu_kiem() if '--tu-kiem' in sys.argv else main())
