
const {useState,useEffect,useRef,useMemo} = React;

/* ============ store (fallback in-memory cho file://) ============ */
const mem={};
const store={
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return (k in mem)?mem[k]:d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){ mem[k]=v; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){ delete mem[k]; } }
};

/* ============ Cloud: đồng bộ 2 máy qua Supabase (tuỳ chọn) ============ */
const SB_URL='https://vvgkjgvzjeklaadusbne.supabase.co';
const SB_KEY='sb_publishable_DMMPv5L2kGhrHTxeQ72iKw_dIh13iT1';
// Các key được đồng bộ (KHÔNG gồm ju.me/ju.device/ju.sync — đó là riêng từng máy)
const SYNC_KEYS=['ju.setup','ju.wish','ju.bucket','ju.watch','ju.links','ju.ideas','ju.food','ju.spots','ju.events','ju.dates','ju.fund','ju.shop','ju.notes','ju.photos','ju.mood','ju.qa','ju.timeline','ju.coupons','ju.chores','ju.lovejar','ju.quiz','ju.city','ju.goals','ju.checkin','ju.challengeDone','ju.homecfg','ju.diary','ju.projects','ju.vinhaUrl','ju.checkins','ju.menu','ju.period','ju.menuPlan','ju.accuKey','ju.habits','ju.hiddenSpots','ju.usOrder','ju.eventPrefs','ju.child','ju.childGrowth','ju.childVaccines','ju.childMilestones','ju.childDiary','ju.partnerWishes','ju.todos','ju.spotify','ju.dishPrefs','ju.favDishes','ju.childPack','ju.childSkills','ju.childMed','ju.childIllness','ju.childWords','ju.childTantrum','ju.childParenting','ju.saveTips','ju.saveCustom','ju.funPrefs','ju.routine','ju.routineIssues','ju.noti','ju.family','ju.health','ju.transfers','ju.skillGuidesDone','ju.expenses','ju.budget','ju.vinhaSync','ju.menuOrder','ju.notesSeen','ju.intimacy','ju.intimacySeen','ju.quizKnow','ju.familyRules','ju.expiry','ju.stash','ju.docs','ju.tuvi','ju.thanso','ju.checkinSeen','ju.menuHidden','ju.gameBets','ju.cook','ju.cookLogs','ju.cookRewards','ju.cookHelp','ju.cookPantry','ju.cookFridge','ju.docsLock','ju.childContacts','ju.childSafety','ju.childDocs','ju.childPotty','ju.childNoti','ju.childSchools','ju.childTeacherNote','ju.childTripPack','ju.childDuty','ju.childOneLine','ju.childQuotes','ju.childLetters','ju.childPhotos','ju.pricewatch','ju.movies'];
/* @@GOM cloud-ju.jsx */


/* ============ Bộ biểu tượng nét cho nút chỉ-có-hình (vá 04/09/2026) ============
   Trước bản này ~80 nút không nhãn chữ chỉ mang một emoji. Ba thứ hỏng cùng lúc:
   emoji mỗi hệ điều hành vẽ một kiểu và mang màu riêng nên không đổi theo nền tối,
   cỡ trôi theo `font-size` của thẻ cha nên vùng bấm co lại còn bằng con chữ, và
   trình đọc màn hình đọc ra tên emoji chứ không phải việc mà nút làm.
   Nút mang biểu tượng này BẮT BUỘC có `aria-label` hoặc `title`.
   Phong cách: viewBox 24, nét 1.8, ăn `currentColor` — khớp 02 icon SVG có sẵn ở topbar. */
function Ic({n,size=17}){
  const S={fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round'};
  const P={
    dong:'M6 6l12 12M18 6L6 18',
    sua:'M4.2 19.8h3.6L18.9 8.7a1.9 1.9 0 0 0 0-2.7l-.9-.9a1.9 1.9 0 0 0-2.7 0L4.2 16.2z',
    thung:'M4.4 6.8h15.2M9.4 6.8V5.4a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.4M17.6 6.8v12.4a1.4 1.4 0 0 1-1.4 1.4H7.8a1.4 1.4 0 0 1-1.4-1.4V6.8',
    vach:'M10.2 10.6v6M13.8 10.6v6',
    tick:'M5.2 12.6l4.4 4.4 9.2-9.6',
    otron:'M5.2 4.4h13.6a.8.8 0 0 1 .8.8v13.6a.8.8 0 0 1-.8.8H5.2a.8.8 0 0 1-.8-.8V5.2a.8.8 0 0 1 .8-.8z',
    tim:'M12 20.4S3.6 15.2 3.6 9.5A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.4 2.6c0 5.7-8.4 10.9-8.4 10.9z',
    len:'M12 19V5M6 11l6-6 6 6',
    xuong:'M12 5v14M6 13l6 6 6-6',
    bongden:'M9.3 18.4h5.4M10.2 21.2h3.6M12 2.8a6 6 0 0 0-3.5 10.9c.5.4.6.8.6 1.2v.3h5.8v-.3c0-.4.1-.8.6-1.2A6 6 0 0 0 12 2.8z',
    chep1:'M8.6 8.6h9.2a1.2 1.2 0 0 1 1.2 1.2v9.2a1.2 1.2 0 0 1-1.2 1.2H8.6a1.2 1.2 0 0 1-1.2-1.2V9.8a1.2 1.2 0 0 1 1.2-1.2z',
    chep2:'M4.6 15.4a1.2 1.2 0 0 1-1.2-1.2V4.8a1.2 1.2 0 0 1 1.2-1.2h9.4a1.2 1.2 0 0 1 1.2 1.2',
    chiase:'M12 15.4V3.6M8.2 7.4L12 3.6l3.8 3.8M5 13.6v5.6a1.2 1.2 0 0 0 1.2 1.2h11.6a1.2 1.2 0 0 0 1.2-1.2v-5.6',
    lienket1:'M10.2 13.8a3.6 3.6 0 0 0 5.4.4l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5',
    lienket2:'M13.8 10.2a3.6 3.6 0 0 0-5.4-.4l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5',
    cam1:'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2z', cam2:'M5.9 5.9l12.2 12.2',
    ngonlen:'M7.4 10.6H4.8a1.2 1.2 0 0 0-1.2 1.2v7a1.2 1.2 0 0 0 1.2 1.2h2.6zM7.4 10.6l4.2-7.2a2 2 0 0 1 3.6 1.6l-.7 3.4h4a1.8 1.8 0 0 1 1.8 2.2l-1.4 6.6a1.8 1.8 0 0 1-1.8 1.4H7.4z',
    chuong:'M18.2 15.6V10a6.2 6.2 0 1 0-12.4 0v5.6L4 18.2h16zM10 21.2a2.4 2.4 0 0 0 4 0',
  };
  const V=p=><svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{display:'block',flex:'none'}}>{p}</svg>;
  if(n==='dong')     return V(<path d={P.dong} {...S}/>);
  if(n==='sua')      return V(<path d={P.sua} {...S}/>);
  if(n==='xoa')      return V(<><path d={P.thung} {...S}/><path d={P.vach} {...S}/></>);
  if(n==='tick')     return V(<path d={P.tick} {...S}/>);
  if(n==='dadanh')   return V(<><path d={P.otron} {...S}/><path d="M8 12.2l2.8 2.8 5.4-5.6" {...S}/></>);
  if(n==='chuadanh') return V(<path d={P.otron} {...S}/>);
  if(n==='tim')      return V(<path d={P.tim} fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>);
  if(n==='timrong')  return V(<path d={P.tim} {...S}/>);
  if(n==='len')      return V(<path d={P.len} {...S}/>);
  if(n==='xuong')    return V(<path d={P.xuong} {...S}/>);
  if(n==='goiy')     return V(<path d={P.bongden} {...S}/>);
  if(n==='chep')     return V(<><path d={P.chep1} {...S}/><path d={P.chep2} {...S}/></>);
  if(n==='chiase')   return V(<path d={P.chiase} {...S}/>);
  if(n==='lienket')  return V(<><path d={P.lienket1} {...S}/><path d={P.lienket2} {...S}/></>);
  if(n==='cam')      return V(<><path d={P.cam1} {...S}/><path d={P.cam2} {...S}/></>);
  if(n==='thich')    return V(<path d={P.ngonlen} {...S}/>);
  if(n==='khongthich') return V(<g transform="rotate(180 12 12)"><path d={P.ngonlen} {...S}/></g>);
  if(n==='nhac')     return V(<path d={P.chuong} {...S}/>);
  return null;
}

/* ============ helpers ============ */
const uid=()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const VND=(n)=> (Number(n)||0).toLocaleString('vi-VN')+'đ';
const pad=(n)=> n<10?'0'+n:''+n;
function todayISO(){ const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function fmtDateVN(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return d+'/'+m+'/'+y; }
function escHtml(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function openUrl(u){ let x=(u||'').trim(); if(!x) return; if(!/^https?:\/\//i.test(x)) x='https://'+x; window.open(x,'_blank','noreferrer'); }
/* ===== Tạo file .docx thật (Open XML) — zip STORED + CRC32, không cần thư viện ===== */
function crc32(bytes){ const tbl=crc32._t||(crc32._t=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})()); let crc=-1; for(let i=0;i<bytes.length;i++) crc=(crc>>>8)^tbl[(crc^bytes[i])&0xFF]; return (crc^-1)>>>0; }
function zipStore(files){
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];
  const parts=[]; let off=0; const central=[];
  files.forEach(f=>{ const nm=f.name, data=f.data, crc=crc32(data);
    const loc=[].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(nm.length),u16(0));
    parts.push(Uint8Array.from(loc),nm,data); central.push({nm,crc,size:data.length,off}); off+=loc.length+nm.length+data.length;
  });
  const cen=[]; const cenStart=off; let cenSize=0;
  central.forEach(c=>{ const rec=[].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0x21),u32(c.crc),u32(c.size),u32(c.size),u16(c.nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(c.off)); cen.push(Uint8Array.from(rec),c.nm); cenSize+=rec.length+c.nm.length; });
  const eocd=[].concat(u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(cenSize),u32(cenStart),u16(0));
  const all=parts.concat(cen,[Uint8Array.from(eocd)]); let total=0; all.forEach(p=>total+=p.length);
  const out=new Uint8Array(total); let pos=0; all.forEach(p=>{out.set(p,pos);pos+=p.length;}); return out;
}
function ooP(text,o){ o=o||{}; const rpr='<w:rPr>'+(o.bold?'<w:b/>':'')+(o.color?'<w:color w:val="'+o.color+'"/>':'')+(o.size?'<w:sz w:val="'+(o.size*2)+'"/>':'')+'</w:rPr>';
  const ppr='<w:pPr>'+(o.align?'<w:jc w:val="'+o.align+'"/>':'')+'<w:spacing w:after="'+(o.spacing!=null?o.spacing:80)+'"/></w:pPr>';
  return '<w:p>'+ppr+'<w:r>'+rpr+'<w:t xml:space="preserve">'+escHtml(text)+'</w:t></w:r></w:p>'; }
function ooCell(text,o){ o=o||{}; const w=o.w?'<w:tcW w:w="'+o.w+'" w:type="dxa"/>':''; const span=o.span?'<w:gridSpan w:val="'+o.span+'"/>':''; const shd=o.shade?'<w:shd w:val="clear" w:color="auto" w:fill="'+o.shade+'"/>':'';
  return '<w:tc><w:tcPr>'+w+span+shd+'</w:tcPr>'+ooP(text,{bold:o.bold,align:o.align})+'</w:tc>'; }
function ooTable(rowsXml){ const b='<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>'<w:'+s+' w:val="single" w:sz="4" w:color="E0A7BD"/>').join('')+'</w:tblBorders>';
  return '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>'+b+'</w:tblPr>'+rowsXml+'</w:tbl>'; }
function exportDocx(filename,bodyXml){
  const enc=new TextEncoder();
  const ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  const doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+bodyXml+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>';
  const files=[{name:enc.encode('[Content_Types].xml'),data:enc.encode(ct)},{name:enc.encode('_rels/.rels'),data:enc.encode(rels)},{name:enc.encode('word/document.xml'),data:enc.encode(doc)}];
  try{ const zip=zipStore(files); const blob=new Blob([zip],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ try{document.body.removeChild(a);}catch(_){} URL.revokeObjectURL(url); },600); }catch(e){ alert('Không tạo được file: '+((e&&e.message)||e)); }
}
function daysFromToday(iso){
  if(!iso) return null;
  const t=new Date(); t.setHours(0,0,0,0);
  const d=new Date(iso+'T00:00:00');
  return Math.round((d-t)/86400000);
}
function nextOccurrence(iso){
  // lấy ngày-tháng, đẩy về lần xuất hiện kế tiếp (>= hôm nay)
  if(!iso) return null;
  const [_,m,d]=iso.split('-').map(Number);
  const t=new Date(); t.setHours(0,0,0,0);
  let y=t.getFullYear();
  let nd=new Date(y,m-1,d);
  if(nd<t){ nd=new Date(y+1,m-1,d); }
  return nd;
}
function daysToNext(iso){
  const nd=nextOccurrence(iso); if(!nd) return null;
  const t=new Date(); t.setHours(0,0,0,0);
  return Math.round((nd-t)/86400000);
}
function yearsBetween(iso){
  if(!iso) return 0;
  const a=new Date(iso+'T00:00:00'), b=new Date();
  let y=b.getFullYear()-a.getFullYear();
  const m=b.getMonth()-a.getMonth();
  if(m<0||(m===0&&b.getDate()<a.getDate())) y--;
  return y;
}
function normCode(s){ return (s||'').toUpperCase().replace(/[^A-Z0-9-]/g,''); }
// Mốc "ngày bên nhau" sắp tới (bội số 100 ngày hoặc mốc năm)
function nextMilestone(days){
  if(days==null||days<0) return null;
  const set=new Set();
  for(let n=100;n<=20000;n+=100) set.add(n);
  for(let y=1;y<=60;y++) set.add(y*365);
  const sorted=[...set].sort((a,b)=>a-b);
  const m=sorted.find(x=>x>days);
  if(!m) return null;
  return {mark:m, inDays:m-days, isYear:m%365===0, years:Math.round(m/365)};
}
// Hiệu ứng confetti + rung nhẹ khi có khoảnh khắc vui
// Chuỗi ngày liên tiếp có trả lời câu hỏi (giữ streak nếu hôm nay chưa trả lời nhưng hôm qua có)
function answerStreak(qa){
  if(!qa) return 0;
  const has=(date)=>{ const k=date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate()); const e=qa[k]; return !!(e && (e.a||e.b)); };
  let d=new Date(); d.setHours(0,0,0,0);
  if(!has(d)) d.setDate(d.getDate()-1);
  let n=0; while(has(d)){ n++; d.setDate(d.getDate()-1); }
  return n;
}

const BUDGETS=[
  {k:'free', label:'Miễn phí 💸', max:0},
  {k:'u100', label:'Rẻ (<200k/2)', max:200000},
  {k:'u300', label:'Vừa (200–400k/2)', max:400000},
  {k:'u500', label:'Khá (400–700k/2)', max:700000},
  {k:'o500', label:'Sang (>700k/2)', max:Infinity},
];
const budgetLabel=(k)=> (BUDGETS.find(b=>b.k===k)||{}).label||'';

const THEMES=[
  {k:'sotay', name:'Sổ tay', c:'#c65b52'},
  {k:'rose', name:'Hồng yêu', c:'#e85d8a'},
  {k:'peach', name:'Hoàng hôn', c:'#f0803c'},
  {k:'lavender', name:'Oải hương', c:'#8b5cf6'},
  {k:'ocean', name:'Đại dương', c:'#119cb0'},
  {k:'forest', name:'Rừng xanh', c:'#2f9e57'},
  {k:'night', name:'Đêm tình', c:'#ff6f9d'},
  {k:'cherry', name:'Anh đào', c:'#e03131'},
  {k:'sky', name:'Trời xanh', c:'#3b82f6'},
  {k:'mocha', name:'Mocha', c:'#b07a4f'},
];
// Báo cho trình duyệt biết app ĐANG sáng hay tối, để nó đừng tự bôi đen giúp
// (Chrome Android "Làm tối trang web" / Samsung Internet). Đọc thẳng màu nền
// thật đang áp dụng nên tự đúng với mọi theme, kể cả skin Sổ tay.
function syncColorScheme(){
  try{
    const v=getComputedStyle(document.body).getPropertyValue('--bg').trim();
    const m=/^#([0-9a-f]{6})$/i.exec(v);
    let dark=false;
    if(m){ const n=parseInt(m[1],16);
      dark = ((((n>>16)&255)*0.299 + (((n>>8)&255))*0.587 + (n&255)*0.114)/255) < 0.5; }
    document.documentElement.style.colorScheme = dark ? 'dark' : 'only light';
  }catch(_){}
}
function applyTheme(k){
  [...document.body.classList].forEach(c=>{ if(c.indexOf('theme-')===0) document.body.classList.remove(c); });
  document.body.classList.add('theme-'+k);
  syncColorScheme();
}
// mode: 'light' | 'dark' | 'system' (theo cài đặt sáng/tối của điện thoại)
function applyDarkMode(mode){
  const dark = mode==='dark' || (mode==='system' && typeof window.matchMedia==='function' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark', dark);
  syncColorScheme();
}
// Skin "Sổ tay": gán góc nghiêng NGẪU NHIÊN thật cho từng thẻ/dòng (biến --rot).
// Mỗi phần tử chỉ gán 1 lần (nhớ qua data-rot) nên góc ổn định, không nhảy khi re-render.
let sotayLastSign=0, sotayRunLen=0;
function sotayTiltSign(){
  // Chiều nghiêng NGẪU NHIÊN (không luân phiên máy móc), nhưng chặn không cho
  // quá 2 thẻ liền nhau cùng chiều → vẫn tự nhiên mà không dồn hết về một bên.
  let sign = Math.random()<0.5 ? -1 : 1;
  if(sign===sotayLastSign && sotayRunLen>=2) sign=-sign;
  sotayRunLen = (sign===sotayLastSign) ? sotayRunLen+1 : 1;
  sotayLastSign = sign;
  return sign;
}
function applySotayTilt(root){
  if(!document.body.classList.contains('theme-sotay')) return;
  const scope=root||document;
  const els=scope.querySelectorAll('.card, .item');
  for(let i=0;i<els.length;i++){ const el=els[i];
    if(el.classList.contains('ju-now')) continue;
    if(el.dataset.rot) continue;
    // Mọi thẻ/dòng (Trang chủ lẫn các tab khác) dùng chung độ nghiêng nhè nhẹ 0.35–1°
    // để cả app cùng một chất "sổ tay", chiều nghiêng thì ngẫu nhiên.
    const mag=0.35+Math.random()*0.65;
    el.dataset.rot='1';
    el.style.setProperty('--rot',(sotayTiltSign()*mag).toFixed(2)+'deg');
  }
}
const HOME_FONTS=[
  {k:'bevn',name:'Be Vietnam Pro',css:"'Be Vietnam Pro','Segoe UI',system-ui,sans-serif"},
  {k:'nunito',name:'Nunito · tròn, thân thiện',css:"'Nunito','Segoe UI',system-ui,sans-serif"},
  {k:'quicksand',name:'Quicksand · bo tròn',css:"'Quicksand','Segoe UI',system-ui,sans-serif"},
  {k:'montserrat',name:'Montserrat · hiện đại',css:"'Montserrat','Segoe UI',system-ui,sans-serif"},
  {k:'lora',name:'Lora · serif thanh lịch',css:"'Lora',ui-serif,'New York',Cambria,'Noto Serif','Times New Roman',Times,serif"},
  {k:'system',name:'Hệ thống (nhẹ nhất)',css:"'Segoe UI',system-ui,-apple-system,Roboto,sans-serif"},
];
function applyHomeFont(k){ const f=HOME_FONTS.find(x=>x.k===k)||HOME_FONTS[0]; try{ document.body.style.setProperty('--home-font',f.css); }catch(_){} }

const AVATARS=['🧑','👩','👨','🧔','👱‍♀️','👩‍🦱','🧑‍🦰','👸','🤴','🐰','🐱','🐻','🦊','🐧','🌷','⭐'];
const MOODS=['😍','😊','🥰','😌','😎','😴','🤒','😢','😠','🤩','🥺','😋'];
/* Tên đọc được của từng mặt cười — nút cảm xúc cố ý GIỮ emoji vì emoji chính là nội dung
   người chọn, không phải biểu tượng điều khiển; nhưng trình đọc màn hình cần tên tiếng Việt. */
const TEN_MOOD={'😍':'yêu quá','😊':'vui','🥰':'hạnh phúc','😌':'nhẹ nhõm','😎':'phấn khởi','😴':'buồn ngủ',
  '🤒':'mệt, ốm','😢':'buồn','😠':'bực','🤩':'hào hứng','🥺':'tủi thân','😋':'thèm ăn'};

/* ===== Thư viện gợi ý nội dung (chạm để thêm) ===== */
const IDEA_SUGGEST=JUD.IDEA_SUGGEST;
const BUCKET_SUGGEST=JUD.BUCKET_SUGGEST;
const FOOD_SUGGEST=JUD.FOOD_SUGGEST;
const GIFT_SUGGEST=JUD.GIFT_SUGGEST;
const WATCH_SUGGEST=JUD.WATCH_SUGGEST;
const MOVIE_SUGGEST=JUD.MOVIE_SUGGEST;
const COUPON_SUGGEST=JUD.COUPON_SUGGEST;
const LOVEJAR_SUGGEST=JUD.LOVEJAR_SUGGEST;
const MEAL_SUGGEST=JUD.MEAL_SUGGEST;
const DOW=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const MENU_GOALS=JUD.MENU_GOALS;
// Món đơn giản, nhanh, dễ nấu — hợp cho người ít vào bếp (vd chồng nấu). Đều gắn 'ez' + 'cb'.
const EASY_DISHES=JUD.EASY_DISHES;
const DISHES=JUD.DISHES;

/* ===== Âm lịch → Dương lịch (thuật toán Hồ Ngọc Đức) — cho Tết, Giỗ Tổ, giỗ ===== */
function jdFromDate(dd,mm,yy){ var a=Math.floor((14-mm)/12); var y=yy+4800-a; var m=mm+12*a-3;
  var jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  if(jd<2299161){ jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-32083; } return jd; }
function jdToDate(jd){ var a,b,c; if(jd>2299160){ a=jd+32044; b=Math.floor((4*a+3)/146097); c=a-Math.floor((b*146097)/4); } else { b=0; c=jd+32082; }
  var d=Math.floor((4*c+3)/1461); var e=c-Math.floor((1461*d)/4); var m=Math.floor((5*e+2)/153);
  var day=e-Math.floor((153*m+2)/5)+1; var month=m+3-12*Math.floor(m/10); var year=b*100+d-4800+Math.floor(m/10);
  return [day,month,year]; }
function _NewMoon(k){ var T=k/1236.85,T2=T*T,T3=T2*T,dr=Math.PI/180;
  var J1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
  J1=J1+0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);
  var M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
  var Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
  var F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
  var C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M);
  C1=C1-0.4068*Math.sin(Mpr*dr)+0.0161*Math.sin(dr*2*Mpr)-0.0004*Math.sin(dr*3*Mpr);
  C1=C1+0.0104*Math.sin(dr*2*F)-0.0051*Math.sin(dr*(M+Mpr))-0.0074*Math.sin(dr*(M-Mpr));
  C1=C1+0.0004*Math.sin(dr*(2*F+M))-0.0004*Math.sin(dr*(2*F-M))-0.0006*Math.sin(dr*(2*F+Mpr));
  C1=C1+0.0010*Math.sin(dr*(2*F-Mpr))+0.0005*Math.sin(dr*(2*Mpr+M));
  var dt; if(T<-11){ dt=0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3; } else { dt=-0.000278+0.000265*T+0.000262*T2; }
  return J1+C1-dt; }
function _SunLong(jdn){ var T=(jdn-2451545.0)/36525,T2=T*T,dr=Math.PI/180;
  var M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;
  var L0=280.46645+36000.76983*T+0.0003032*T2;
  var DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M)+(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);
  var L=(L0+DL)*dr; L=L-Math.PI*2*Math.floor(L/(Math.PI*2)); return L; }
function _sunLongInt(dn,tz){ return Math.floor(_SunLong(dn-0.5-tz/24)/Math.PI*6); }
function _newMoonDay(k,tz){ return Math.floor(_NewMoon(k)+0.5+tz/24); }
function _lunarMonth11(yy,tz){ var off=jdFromDate(31,12,yy)-2415021; var k=Math.floor(off/29.530588853);
  var nm=_newMoonDay(k,tz); if(_sunLongInt(nm,tz)>=9){ nm=_newMoonDay(k-1,tz); } return nm; }
function _leapOffset(a11,tz){ var k=Math.floor((a11-2415021.076998695)/29.530588853+0.5),last=0,i=1;
  var arc=_sunLongInt(_newMoonDay(k+i,tz),tz);
  do{ last=arc; i++; arc=_sunLongInt(_newMoonDay(k+i,tz),tz); }while(arc!==last && i<14); return i-1; }
function lunar2Solar(lD,lM,lY,leap,tz){ tz=tz==null?7:tz; var a11,b11;
  if(lM<11){ a11=_lunarMonth11(lY-1,tz); b11=_lunarMonth11(lY,tz); } else { a11=_lunarMonth11(lY,tz); b11=_lunarMonth11(lY+1,tz); }
  var k=Math.floor(0.5+(a11-2415021.076998695)/29.530588853); var off=lM-11; if(off<0) off+=12;
  if(b11-a11>365){ var lo=_leapOffset(a11,tz); var lm=lo-2; if(lm<0) lm+=12;
    if(leap!==0 && lM!==lm){ return [0,0,0]; } else if(leap!==0 || off>=lo){ off+=1; } }
  var ms=_newMoonDay(k+off,tz); return jdToDate(ms+lD-1); }
function lunarISO(d,m,y){ var r=lunar2Solar(d,m,y,0,7); if(!r||!r[2]) return null; return r[2]+'-'+pad(r[1])+'-'+pad(r[0]); }
function nextTetISO(){ var y=new Date().getFullYear(); var iso=lunarISO(1,1,y);
  if(iso && new Date(iso+'T00:00:00')<new Date(todayISO()+'T00:00:00')) iso=lunarISO(1,1,y+1); return iso; }
function lunarDaysToNext(ld,lm){
  var today=new Date(todayISO()+'T00:00:00'), y=today.getFullYear();
  for(var i=-1;i<=2;i++){ var r=lunar2Solar(ld,lm,y+i,0,7); if(!r||!r[2]) continue;
    var d=new Date(r[2],r[1]-1,r[0]); if(d>=today) return {days:Math.round((d-today)/86400000),date:r[2]+'-'+pad(r[1])+'-'+pad(r[0])}; }
  return null;
}
function dnext(e){ if(!e) return null; if(e.lunar&&e.lunarDay&&e.lunarMonth){ var r=lunarDaysToNext(e.lunarDay,e.lunarMonth); return r?r.days:null; } return e.date?daysToNext(e.date):null; }
function dnextDate(e){ if(e&&e.lunar&&e.lunarDay&&e.lunarMonth){ var r=lunarDaysToNext(e.lunarDay,e.lunarMonth); return r?r.date:null; } return e?e.date:null; }
function holidaysForYear(y){
  var H=[{date:y+'-01-01',name:'Tết Dương lịch',icon:'🎉'}];
  var tet=lunarISO(1,1,y);
  if(tet){ var dp=new Date(tet+'T00:00:00'); dp.setDate(dp.getDate()-1);
    H.push({date:dp.getFullYear()+'-'+pad(dp.getMonth()+1)+'-'+pad(dp.getDate()),name:'Giao thừa (30 Tết)',icon:'🧧'});
    H.push({date:tet,name:'Tết Nguyên Đán (Mùng 1)',icon:'🧧'}); }
  var gio=lunarISO(10,3,y); if(gio) H.push({date:gio,name:'Giỗ Tổ Hùng Vương',icon:'🛕'});
  H.push({date:y+'-04-30',name:'Giải phóng miền Nam 30/4',icon:'🇻🇳'});
  H.push({date:y+'-05-01',name:'Quốc tế Lao động 1/5',icon:'🛠️'});
  H.push({date:y+'-09-02',name:'Quốc khánh 2/9',icon:'🇻🇳'});
  return H;
}
function upcomingHolidays(within){
  var t=new Date(); t.setHours(0,0,0,0); var out=[];
  [t.getFullYear(),t.getFullYear()+1].forEach(function(y){ holidaysForYear(y).forEach(function(h){
    var d=Math.round((new Date(h.date+'T00:00:00')-t)/86400000); if(d>=0&&d<=within) out.push({icon:h.icon,name:h.name,d:d}); }); });
  out.sort(function(a,b){return a.d-b.d;}); return out;
}
const GIFT_HOLIDAYS=[
  {m:1,d:1,name:'Tết Dương lịch',who:'both',note:'Lời chúc & món quà nhỏ đầu năm',icon:'🎉'},
  {m:2,d:14,name:'Valentine 14/2',who:'both',note:'Hoa, sô-cô-la, quà cho nhau',icon:'💝'},
  {m:3,d:8,name:'Quốc tế Phụ nữ 8/3',who:'h2w',note:'Mua hoa & quà cho vợ',icon:'🌹'},
  {m:10,d:20,name:'Phụ nữ Việt Nam 20/10',who:'h2w',note:'Mua hoa & quà cho vợ',icon:'🌷'},
  {m:11,d:19,name:'Quốc tế Đàn ông 19/11',who:'w2h',note:'Mua quà cho chồng',icon:'🎁'},
  {m:12,d:24,name:'Giáng sinh 24/12',who:'both',note:'Quà Noel cho nhau',icon:'🎄'},
  {m:6,d:28,name:'Ngày Gia đình Việt Nam 28/6',who:'both',note:'Bữa cơm ấm & lời yêu thương',icon:'🏡'},
  {m:10,d:31,name:'Halloween 31/10',who:'both',note:'Hoá trang & xem phim ma cùng nhau',icon:'🎃'},
  {m:12,d:31,name:'Đêm Giao thừa Dương lịch',who:'both',note:'Cùng đếm ngược đón năm mới',icon:'🎆'},
];
function upcomingGiftHolidays(within){ const t=new Date(todayISO()+'T00:00:00'); const cy=t.getFullYear(); const out=[];
  GIFT_HOLIDAYS.forEach(function(h){ [cy,cy+1].forEach(function(y){ const dt=new Date(y,h.m-1,h.d); const dd=Math.round((dt-t)/86400000);
    if(dd>=0&&dd<=within) out.push(Object.assign({},h,{d:dd,date:y+'-'+pad(h.m)+'-'+pad(h.d)})); }); });
  const seen={}, res=[]; out.sort(function(a,b){return a.d-b.d;}).forEach(function(h){ if(!seen[h.name]){seen[h.name]=1;res.push(h);} }); return res; }
function solar2Lunar(dd,mm,yy,tz){ tz=tz==null?7:tz;
  var dn=jdFromDate(dd,mm,yy);
  var k=Math.floor((dn-2415021.076998695)/29.530588853);
  var monthStart=_newMoonDay(k+1,tz); if(monthStart>dn){ monthStart=_newMoonDay(k,tz); }
  var a11=_lunarMonth11(yy,tz), b11; var lunarYear;
  if(a11>=monthStart){ lunarYear=yy; a11=_lunarMonth11(yy-1,tz); b11=_lunarMonth11(yy,tz); } else { lunarYear=yy+1; b11=_lunarMonth11(yy+1,tz); }
  var lunarDay=dn-monthStart+1; var diff=Math.floor((monthStart-a11)/29);
  var lunarLeap=0, lunarMonth=diff+11;
  if(b11-a11>365){ var lo=_leapOffset(a11,tz); if(diff>=lo){ lunarMonth=diff+10; if(diff===lo) lunarLeap=1; } }
  if(lunarMonth>12) lunarMonth-=12; if(lunarMonth>=11 && diff<4) lunarYear-=1;
  return [lunarDay,lunarMonth,lunarYear,lunarLeap]; }
const SPIRIT_FESTIVALS=[
  {d:1,m:1,name:'Mùng 1 Tết Nguyên Đán',icon:'🧧'},{d:15,m:1,name:'Rằm tháng Giêng (Thượng Nguyên)',icon:'🏮'},
  {d:3,m:3,name:'Tết Hàn thực',icon:'🍡'},{d:10,m:3,name:'Giỗ Tổ Hùng Vương',icon:'🛕'},
  {d:15,m:4,name:'Lễ Phật Đản',icon:'🪷'},{d:5,m:5,name:'Tết Đoan Ngọ',icon:'🌿'},
  {d:15,m:7,name:'Lễ Vu Lan (Rằm tháng Bảy)',icon:'🪷'},{d:15,m:8,name:'Tết Trung Thu',icon:'🥮'},
  {d:15,m:10,name:'Rằm tháng Mười (Hạ Nguyên)',icon:'🌾'},{d:23,m:12,name:'Ông Công Ông Táo',icon:'🐟'},
  {d:10,m:1,name:'Vía Thần Tài',icon:'💰'},{d:19,m:2,name:'Vía Quan Âm (Đản sinh)',icon:'🪷'},
  {d:19,m:6,name:'Vía Quan Âm (Thành đạo)',icon:'🪷'},{d:19,m:9,name:'Vía Quan Âm (Xuất gia)',icon:'🪷'},
  {d:30,m:7,name:'Vía Địa Tạng Vương',icon:'🙏'},{d:17,m:11,name:'Vía Phật A Di Đà',icon:'🙏'},
  {d:9,m:1,name:'Vía Ngọc Hoàng (mùng 9 tháng Giêng)',icon:'🙏'},{d:15,m:2,name:'Vía Phật Thích Ca nhập Niết Bàn',icon:'🪷'},
  {d:24,m:6,name:'Vía Quan Thánh Đế Quân',icon:'🙏'},
];
function upcomingSpiritual(within){
  var t=new Date(); t.setHours(0,0,0,0); var out=[];
  for(var i=0;i<=within;i++){ var d=new Date(t); d.setDate(d.getDate()+i);
    var lr=solar2Lunar(d.getDate(),d.getMonth()+1,d.getFullYear(),7); var ld=lr[0],lm=lr[1];
    var label=null,icon='🪷';
    var fest=SPIRIT_FESTIVALS.find(function(f){return f.d===ld&&f.m===lm;});
    if(fest){ label=fest.name; icon=fest.icon; }
    else if(ld===1){ label='Mùng 1 (âm lịch)'; icon='🙏'; }
    else if(ld===15){ label='Ngày Rằm (âm lịch)'; icon='🌕'; }
    if(label) out.push({d:i,name:label,icon:icon,date:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),lunar:ld+'/'+lm}); }
  return out;
}
const PERIOD_PREP=[
  {cat:'🩸 Vệ sinh (thiết yếu)',items:['Băng vệ sinh / tampon / cốc nguyệt san','Miếng lót chống tràn ban đêm','Quần lót dự phòng + túi zip để thay','Khăn ướt không mùi & giấy']},
  {cat:'💊 Giảm đau & bổ sung',items:['Thuốc giảm đau (nếu cần)','Viên sắt / vitamin tổng hợp','Vitamin B6 / magie (dịu cáu gắt)','Nước điện giải bù khoáng ngày mệt']},
  {cat:'🔥 Giữ ấm & chườm bụng',items:['Túi chườm ấm / chai nước nóng','Miếng dán giữ nhiệt dán bụng','Túi chườm hạt quay lò vi sóng','Tất ấm & quần áo rộng giữ ấm']},
  {cat:'🍵 Đồ uống & ăn nhẹ ấm',items:['Bình giữ nhiệt nước ấm uống cả ngày','Trà gừng / trà hoa cúc','Nước gừng mật ong pha sẵn','Sô-cô-la đen','Ít hạt / trái cây ngọt bù năng lượng']},
  {cat:'😌 Thư giãn & dễ chịu',items:['Gối ôm kê bụng / kẹp chân','Nhạc nhẹ / podcast thư giãn','Tinh dầu oải hương / bạc hà','Phim hài nhẹ để xem cho khuây','Sạc dự phòng cho ngày nằm nghỉ']},
  {cat:'📅 Nhờ người kia',items:['Đánh dấu lịch để chồng biết mà chăm','Nhờ chồng nhắc uống thuốc đúng giờ','Ghi mức độ đau để theo dõi chu kỳ']},
];
const PERIOD_FOOD=['Canh gừng ấm','Thịt bò xào (bổ sắt)','Cá hồi (omega-3)','Rau bina / cải bó xôi','Trà gừng mật ong','Chuối (kali, giảm chuột rút)','Sô-cô-la đen','Súp gà ấm','Canh đương quy táo đỏ','Yến mạch','Hạt bí, hạnh nhân','Sữa ấm nghệ','Trứng','Khoai lang','Nước ấm / trà hoa cúc'];
const PERIOD_AVOID=['Đồ uống lạnh / đá','Đồ cay nóng nhiều','Cà phê / trà đặc','Đồ chiên rán dầu mỡ','Đồ quá mặn (giữ nước)','Rượu bia','Đồ ngọt nhiều đường','Nước có ga','Đồ ăn nhanh nhiều dầu','Đồ sống / tái','Đồ muối chua nhiều','Trà sữa nhiều đá'];

/* ===== Catalog địa điểm hẹn hò THẬT ở Hà Nội (toạ độ gần đúng theo khu vực) ===== */
const HANOI_CATS=JUD.HANOI_CATS;
const HANOI_SPOTS=JUD.HANOI_SPOTS;
const QUESTIONS=JUD.QUESTIONS;
function dayNumber(){ const d=new Date(); return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000); }
function weekKey(){ const d=new Date(); d.setHours(0,0,0,0); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function questionOfToday(){ return QUESTIONS[((dayNumber()%QUESTIONS.length)+QUESTIONS.length)%QUESTIONS.length]; }
const QUIZ_Q=JUD.QUIZ_Q;
function quizOfToday(){ return QUIZ_Q[((dayNumber()%QUIZ_Q.length)+QUIZ_Q.length)%QUIZ_Q.length]; }
const CHALLENGES=JUD.CHALLENGES;
function challengeOfToday(){ return CHALLENGES[((dayNumber()%CHALLENGES.length)+CHALLENGES.length)%CHALLENGES.length]; }
function streakOf(has){ let d=new Date(); d.setHours(0,0,0,0); if(!has(d)) d.setDate(d.getDate()-1); let n=0; while(has(d)){ n++; d.setDate(d.getDate()-1); } return n; }
const TALK_TOPICS=JUD.TALK_TOPICS;
const PROJ_TYPES=[
  {k:'tet',icon:'🧧',label:'Tết'},{k:'wedding',icon:'💒',label:'Đám cưới'},{k:'birthday',icon:'🎂',label:'Sinh nhật'},
  {k:'travel',icon:'✈️',label:'Du lịch'},{k:'event',icon:'🎉',label:'Sự kiện'},
  {k:'home',icon:'🏠',label:'Nhà cửa'},{k:'baby',icon:'👶',label:'Em bé'},
  {k:'paperwork',icon:'📋',label:'Thủ tục giấy tờ'},{k:'other',icon:'📦',label:'Khác'},
];
function projIcon(k){ const t=PROJ_TYPES.find(x=>x.k===k); return t?t.icon:'📦'; }
const PROJ_TASK_SUGGEST={
  tet:['Lên lịch về quê / kế hoạch ăn Tết (trước 21 ngày)','Mua vé tàu/xe nếu về quê (trước 21 ngày)','Chuẩn bị quà biếu nội ngoại (trước 10 ngày)','Mua quần áo Tết (trước 10 ngày)','Tổng vệ sinh, dọn nhà (trước 7 ngày)','Mua sắm thực phẩm Tết (trước 7 ngày)','Đổi tiền mới lì xì (trước 7 ngày)','Lên thực đơn cỗ Tết (trước 5 ngày)','Mua bánh chưng / giò chả (trước 5 ngày)','Mua đào/quất/hoa (trước 5 ngày)','Dọn bàn thờ, thay đồ thờ (trước 5 ngày)','Cúng ông Công ông Táo 23 tháng Chạp (trước 7 ngày)','Trang trí nhà đón Tết (trước 3 ngày)','Chuẩn bị phong bao lì xì (trước 3 ngày)','Gói/đặt bánh chưng (trước 3 ngày)','Làm cơm tất niên chiều 30 (trước 1 ngày)','Sắm đồ cúng giao thừa (trước 2 ngày)','Chọn người xông đất hợp tuổi (trước 2 ngày)'],
  wedding:['Chốt ngày cưới','Đặt nhà hàng / địa điểm','Chụp ảnh cưới','Thuê váy/vest','Thiệp mời','Trang điểm cô dâu','Xe hoa','Chốt khách mời','Nhẫn cưới','Trang trí'],
  travel:['Chốt điểm đến & ngày','Đặt vé máy bay/tàu','Đặt khách sạn','Lên lịch trình','Đổi tiền / thẻ','Chuẩn bị hành lý','Mua bảo hiểm','Thuê xe','Kiểm tra hộ chiếu/visa còn hạn','Tải bản đồ & lưu địa điểm offline'],
  birthday:['Chốt ngày & khách mời','Đặt bánh','Đặt quán/đồ ăn','Mua quà','Trang trí','Chụp ảnh'],
  baby:['Khám thai định kỳ','Mua đồ sơ sinh','Chuẩn bị phòng cho bé','Chọn tên','Đặt lịch sinh','Học lớp tiền sản'],
  event:['Chốt ngày & địa điểm','Lên danh sách khách mời','Gửi lời mời','Đặt đồ ăn / bánh','Trang trí','Chuẩn bị nhạc / trò chơi','Phân công chuẩn bị','Chụp ảnh / quay phim'],
  home:['Lên ngân sách sửa nhà','Chốt phong cách / màu sơn','Tìm thợ / báo giá','Mua nội thất chính','Mua đồ điện gia dụng','Dọn dẹp & sắp xếp','Mua cây xanh trang trí','Kiểm tra điện nước','Lắp rèm / đèn trang trí','Sắp xếp góc làm việc chung'],
};
// Mẫu checklist thủ tục hành chính — giấy tờ cần mang + các bước. THAM KHẢO, thủ tục có thể đổi theo địa phương/thời điểm.
const PAPERWORK_TEMPLATES=[
  {k:'thuongtru',icon:'🏠',label:'Chuyển / đăng ký thường trú',
    docs:['CCCD/CMND của người đăng ký','Giấy tờ chứng minh chỗ ở hợp pháp (sổ đỏ / hợp đồng thuê / giấy cho ở nhờ)','Giấy tờ chứng minh quan hệ nhân thân (giấy kết hôn, giấy khai sinh của con)','Tờ khai thay đổi thông tin cư trú (mẫu CT01)'],
    steps:['Xác định nơi đăng ký thường trú mới','Điền tờ khai CT01 (lấy tại công an xã/phường hoặc trên VNeID)','Nộp hồ sơ tại Công an xã/phường nơi đến (hoặc online qua Cổng DVC / VNeID)','Nhận giấy hẹn, chờ giải quyết (tối đa ~7 ngày làm việc)','Kiểm tra & cập nhật thông tin cư trú trên VNeID sau khi xong']},
  {k:'khaisinh',icon:'📄',label:'Làm giấy khai sinh cho con',
    docs:['Giấy chứng sinh (bệnh viện cấp)','CCCD/CMND của bố mẹ','Giấy đăng ký kết hôn của bố mẹ','Giấy tờ xác nhận cư trú'],
    steps:['Chuẩn bị giấy chứng sinh & giấy tờ tuỳ thân','Đến UBND xã/phường nơi cư trú (nên làm trong 60 ngày sau sinh)','Điền tờ khai đăng ký khai sinh','Đăng ký liên thông: khai sinh + thường trú + BHYT cho trẻ','Nhận giấy khai sinh (thường trong ngày)']},
  {k:'bhyt',icon:'💳',label:'Đăng ký BHYT cho con',
    docs:['Giấy khai sinh (bản sao)','CCCD của bố/mẹ','Thông tin nơi khám chữa bệnh ban đầu mong muốn'],
    steps:['Trẻ dưới 6 tuổi được cấp BHYT miễn phí — thường cấp cùng lúc khai sinh liên thông','Nếu chưa có: nộp hồ sơ tại UBND xã/phường hoặc cơ quan BHXH','Chọn nơi khám chữa bệnh ban đầu','Nhận thẻ BHYT (hoặc dùng mã số BHYT trên VssID / CCCD)']},
  {k:'mamnon',icon:'🏫',label:'Xin nhập học mầm non',
    docs:['Giấy khai sinh (bản sao)','Giấy tờ xác nhận cư trú (đúng tuyến)','Giấy khám sức khoẻ của bé','Sổ tiêm chủng','Ảnh thẻ của bé'],
    steps:['Tìm hiểu trường công đúng tuyến / trường tư phù hợp','Xem thời gian tuyển sinh (thường tháng 6–8)','Chuẩn bị hồ sơ theo yêu cầu của trường','Nộp hồ sơ & tham quan/phỏng vấn trường','Đóng phí nhập học, sắm đồ dùng cho bé đi lớp']},
  {k:'cccd',icon:'🪪',label:'Làm / đổi CCCD gắn chip',
    docs:['CCCD/CMND cũ (nếu có)','Thông tin cư trú đã cập nhật'],
    steps:['Đặt lịch / đến Công an cấp huyện hoặc điểm cấp CCCD lưu động','Khai thông tin, lấy vân tay & chụp ảnh tại chỗ','Nhận giấy hẹn','Nhận CCCD qua bưu điện hoặc đến lấy','Kích hoạt định danh điện tử VNeID mức 2']},
  {k:'hochieu',icon:'🛂',label:'Làm hộ chiếu cho con',
    docs:['Giấy khai sinh của con','CCCD của bố/mẹ','Ảnh 4x6 nền trắng của con','Tờ khai hộ chiếu (mẫu X01)'],
    steps:['Điền tờ khai online tại Cổng DVC Bộ Công an (hoặc mẫu X01)','Bố/mẹ đưa con đến Phòng Quản lý XNC công an tỉnh nộp hồ sơ','Nộp lệ phí','Nhận giấy hẹn','Nhận hộ chiếu qua bưu điện hoặc đến lấy']},
];
const CITIES=[
  {k:'giangvo',name:'Giảng Võ, HN',lat:21.0313,lng:105.8163},
  {k:'hanoi',name:'Hà Nội',lat:21.03,lng:105.85},{k:'hcm',name:'TP.HCM',lat:10.78,lng:106.70},
  {k:'danang',name:'Đà Nẵng',lat:16.05,lng:108.22},{k:'haiphong',name:'Hải Phòng',lat:20.86,lng:106.68},
  {k:'cantho',name:'Cần Thơ',lat:10.03,lng:105.78},{k:'dalat',name:'Đà Lạt',lat:11.94,lng:108.46},
  {k:'nhatrang',name:'Nha Trang',lat:12.24,lng:109.19},{k:'hue',name:'Huế',lat:16.46,lng:107.59},
  {k:'vungtau',name:'Vũng Tàu',lat:10.41,lng:107.14},{k:'quynhon',name:'Quy Nhơn',lat:13.78,lng:109.22},
];
function wmo(c){
  if(c===0) return {icon:'☀️',text:'Quang đãng'};
  if(c<=2) return {icon:'⛅',text:'Ít mây'};
  if(c===3) return {icon:'☁️',text:'Nhiều mây'};
  if(c<=48) return {icon:'🌫️',text:'Sương mù'};
  if(c<=57) return {icon:'🌦️',text:'Mưa phùn'};
  if(c<=67) return {icon:'🌧️',text:'Mưa'};
  if(c<=77) return {icon:'🌨️',text:'Tuyết'};
  if(c<=82) return {icon:'🌧️',text:'Mưa rào'};
  return {icon:'⛈️',text:'Dông'};
}
const GIANGVO={lat:21.0313,lng:105.8163,name:'Giảng Võ, Ba Đình, Hà Nội'};
function accuIcon(n){ if(n==null) return '⛅';
  if([1,2,3,4,30,31,32,33,34].indexOf(n)>=0) return '☀️';
  if([5,6,7,8,35,36,37,38].indexOf(n)>=0) return '⛅';
  if([11].indexOf(n)>=0) return '🌫️';
  if([12,13,14,18,39,40].indexOf(n)>=0) return '🌧️';
  if([15,16,17,41,42].indexOf(n)>=0) return '⛈️';
  if([19,20,21,22,23,24,25,26,29,43,44].indexOf(n)>=0) return '🌨️';
  return '⛅'; }
const _wcache={};
async function getWeather(lat,lng){
  const key=lat.toFixed(3)+','+lng.toFixed(3);
  const c=_wcache[key]; if(c && Date.now()-c.t<12*60*1000) return c.v;
  const accu=store.get('ju.accuKey',''); let v=null;
  if(accu){ try{
    const loc=await fetch('https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey='+encodeURIComponent(accu)+'&q='+lat+','+lng+'&language=vi-vn').then(r=>r.ok?r.json():null);
    if(loc&&loc.Key){ const cur=await fetch('https://dataservice.accuweather.com/currentconditions/v1/'+loc.Key+'?apikey='+encodeURIComponent(accu)+'&language=vi-vn&details=true').then(r=>r.ok?r.json():null);
      const x=cur&&cur[0]; if(x){ const txt=x.WeatherText||''; v={src:'AccuWeather',temp:Math.round(x.Temperature.Metric.Value),text:txt,icon:accuIcon(x.WeatherIcon),rain:!!x.HasPrecipitation,storm:/dông|giông|bão|sấm|thunder|storm/i.test(txt)}; } }
  }catch(e){} }
  if(!v){ try{
    // Dự báo THEO GIỜ (open-meteo, miễn phí) -> chính xác cho đúng thời điểm mở app + cảnh báo mưa sắp tới
    const d=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lng+'&current=temperature_2m,weather_code,precipitation,wind_speed_10m&hourly=precipitation,precipitation_probability,weather_code&forecast_days=1&timezone=auto').then(r=>r.json());
    const w=d.current, code=w.weather_code, wm=wmo(code);
    let rainSoon=false, rainSoonP=0, soonHrs=0;
    try{ const H=d.hourly, now=(w.time||'').slice(0,13);
      let idx=H&&H.time?H.time.findIndex(t=>t.slice(0,13)===now):-1; if(idx<0) idx=0;
      for(let k=idx;k<Math.min(idx+3,H.time.length);k++){
        const p=H.precipitation_probability?H.precipitation_probability[k]:0;
        const pr=H.precipitation?H.precipitation[k]:0;
        if((p>=55||pr>0.2) && !rainSoon){ rainSoon=true; soonHrs=k-idx; }
        if(p>rainSoonP) rainSoonP=p;
      }
    }catch(e2){}
    v={src:'open-meteo (theo giờ)',temp:Math.round(w.temperature_2m),text:wm.text,icon:wm.icon,
      rain:(w.precipitation>0)||[51,53,55,61,63,65,80,81,82].indexOf(code)>=0,
      storm:[95,96,99].indexOf(code)>=0||(w.wind_speed_10m>40),
      rainSoon,rainSoonP,soonHrs};
  }catch(e){ v=null; } }
  if(v) _wcache[key]={t:Date.now(),v}; return v;
}
async function getForecast(lat,lng){
  try{ const d=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lng+'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(r=>r.json());
    const dd=d.daily; return dd.time.map((t,i)=>({date:t,code:dd.weather_code[i],max:Math.round(dd.temperature_2m_max[i]),min:Math.round(dd.temperature_2m_min[i]),rainP:dd.precipitation_probability_max[i]}));
  }catch(e){ return null; }
}
function ideaOutdoor(title){ const s=(title||'').toLowerCase();
  if(/(dạo|đi bộ|công viên|đạp xe|picnic|ngoài trời|biển|cắm trại|glamping|hồ |ven hồ|phố đi bộ|phố đêm|chợ đêm|chợ hoa|vườn |sông|patin|chèo|sup|kayak|nông trại|farmstay|phượt|dù lượn|khinh khí cầu|ngắm sao|hoàng hôn|bãi đá|thung lũng|sân thượng)/.test(s)) return true;
  if(/(xem phim|rạp|cà phê|cafe|bảo tàng|nhà hàng|karaoke|board game|spa|nấu|ở nhà|workshop|lớp học|bowling|trượt băng|thuỷ cung|thủy cung|nướng|lẩu|buffet|đọc sách|nhà sách|massage|gốm|vẽ|phòng chiếu|hát|trà chiều)/.test(s)) return false;
  return null; }
const IDEA_PLACES=[
  {re:/cà phê trứng|cafe trứng|cf trứng|cà phê cốt dừa/i, p:[{n:'Giảng Café',a:'39 Nguyễn Hữu Huân, Hoàn Kiếm'},{n:'Cafe Đinh',a:'13 Đinh Tiên Hoàng, Hoàn Kiếm'},{n:'Cafe Phố Cổ',a:'11 Hàng Gai, Hoàn Kiếm'},{n:'Loiding Cafe',a:'8 Chân Cầm, Hoàn Kiếm'}]},
  {re:/nhà sách|hiệu sách|mua sách|phố sách|đi sách/i, p:[{n:'Nhã Nam Books & Coffee',a:'Nguyễn Thái Học, Ba Đình'},{n:'Phố sách 19/12',a:'Phố 19/12, Hoàn Kiếm'},{n:'Phố sách cũ Đinh Lễ – Nguyễn Xí',a:'Hoàn Kiếm'},{n:'Fahasa',a:'Vincom / Tràng Tiền Plaza'},{n:'Nhà sách Tiền Phong',a:'175 Nguyễn Thái Học, Ba Đình'}]},
  {re:/cà phê sách|cafe sách|cà phê yên tĩnh|đọc sách/i, p:[{n:'Tranquil Books & Coffee',a:'Nguyễn Quang Bích, Hoàn Kiếm'},{n:'Trạm Đọc Cafe',a:'Hà Nội'},{n:'Reading Room Cafe',a:'Hà Nội'},{n:'The Wiselands Coffee',a:'Tô Ngọc Vân, Tây Hồ'}]},
  {re:/board game/i, p:[{n:'The Dice Cafe & Board Game',a:'Ngõ 612 Đê La Thành, Ba Đình'},{n:'The Nest Board Game Cafe',a:'Ngõ 133 Thái Hà, Đống Đa'},{n:'Gotham Board Game & Coffee',a:'Kim Mã Thượng, Ba Đình'},{n:'The Cube Cafe',a:'Ngũ Xã, Trúc Bạch'}]},
  {re:/lẩu|nướng|bbq/i, p:[{n:'Manwah (lẩu Đài Loan)',a:'Vincom các quận'},{n:'Kichi-Kichi (lẩu băng chuyền)',a:'Royal City, 72 Nguyễn Trãi'},{n:'Gogi House (nướng Hàn)',a:'Vincom / phố lớn'},{n:'Sumo BBQ',a:'Vincom / Bà Triệu'},{n:'Hutong (lẩu Hong Kong)',a:'Vincom Bà Triệu'}]},
  {re:/buffet/i, p:[{n:'Sen Tây Hồ (buffet)',a:'10 Nguyễn Đình Thi, Tây Hồ'},{n:'Kichi-Kichi',a:'Royal City'},{n:'Sumo BBQ buffet',a:'Vincom'},{n:'Buffet Poseidon',a:'Trần Thái Tông / Hà Đông'}]},
  {re:/hải sản|ốc/i, p:[{n:'Ốc nóng Đặng Văn Ngữ',a:'Đặng Văn Ngữ, Đống Đa'},{n:'Hải sản Bể (Lê Văn Hưu)',a:'Hai Bà Trưng'},{n:'Ốc luộc ven Hồ Tây',a:'Trích Sài / Nhật Chiêu, Tây Hồ'}]},
  {re:/bảo tàng/i, p:[{n:'Bảo tàng Dân tộc học',a:'Nguyễn Văn Huyên, Cầu Giấy'},{n:'Bảo tàng Mỹ thuật VN',a:'66 Nguyễn Thái Học'},{n:'Bảo tàng Lịch sử Quốc gia',a:'1 Tràng Tiền, Hoàn Kiếm'},{n:'Bảo tàng Phụ nữ VN',a:'36 Lý Thường Kiệt'}]},
  {re:/triển lãm|nghệ thuật|tranh|gallery/i, p:[{n:'VCCA (Trung tâm NT đương đại)',a:'Royal City, Thanh Xuân'},{n:'Manzi Art Space',a:'14 Phan Huy Ích, Ba Đình'},{n:'Complex 01',a:'Ngõ 31 Tây Sơn, Đống Đa'},{n:'Á Space',a:'Hà Nội'}]},
  {re:/di tích|hoả lò|hỏa lò|hoàng thành|văn miếu|đền|chùa/i, p:[{n:'Di tích Nhà tù Hoả Lò',a:'1 Hoả Lò, Hoàn Kiếm'},{n:'Hoàng thành Thăng Long',a:'19C Hoàng Diệu, Ba Đình'},{n:'Văn Miếu – Quốc Tử Giám',a:'58 Quốc Tử Giám, Đống Đa'}]},
  {re:/thuỷ cung|thủy cung|aquarium/i, p:[{n:'Vinpearl Aquarium Times City',a:'458 Minh Khai, Hai Bà Trưng'}]},
  {re:/sở thú|vườn thú/i, p:[{n:'Vườn thú Hà Nội (CV Thủ Lệ)',a:'Bưởi, Ba Đình'}]},
  {re:/công viên nước/i, p:[{n:'Công viên nước Hồ Tây',a:'614 Lạc Long Quân, Tây Hồ'},{n:'Thiên đường Bảo Sơn',a:'Km5 Lê Trọng Tấn, An Khánh'}]},
  {re:/công viên giải trí|cảm giác mạnh|vui chơi/i, p:[{n:'Công viên Hồ Tây',a:'614 Lạc Long Quân, Tây Hồ'},{n:'Thiên đường Bảo Sơn',a:'An Khánh, Hoài Đức'},{n:'Khu vui chơi VinKE Times City',a:'458 Minh Khai'}]},
  {re:/trượt băng|trượt patin|patin/i, p:[{n:'Vinpearl Ice Rink (sân trượt băng)',a:'Royal City, 72 Nguyễn Trãi'},{n:'Sân patin Cung Thiếu Nhi',a:'36 Lý Thái Tổ, Hoàn Kiếm'}]},
  {re:/bowling/i, p:[{n:'Smile Bowling',a:'Royal City B1, 72 Nguyễn Trãi'},{n:'Galaxy Bowling',a:'Hà Nội'}]},
  {re:/xem phim|rạp|phòng chiếu|chiếu phim/i, p:[{n:'CGV Cinemas',a:'Vincom các quận'},{n:'Lotte Cinema',a:'Lotte / Đào Tấn'},{n:'Beta Cinemas',a:'Mỹ Đình / Thanh Xuân (vé rẻ)'},{n:'BHD Star',a:'Phạm Ngọc Thạch / Vincom'}]},
  {re:/karaoke|hát karaoke/i, p:[{n:'Kingdom Karaoke',a:'Hà Nội'},{n:'Nnice Karaoke',a:'Hà Nội'},{n:'ICOOL Karaoke',a:'Hà Nội'}]},
  {re:/nhạc sống|acoustic|live music|jazz/i, p:[{n:'Bình Minh Jazz Club',a:'1 Tràng Tiền, Hoàn Kiếm'},{n:'Hanoi Rock City',a:'27/52 Tô Ngọc Vân, Tây Hồ'},{n:'Minh Jazz / Swing Lounge',a:'Hoàn Kiếm'}]},
  {re:/gốm|nặn gốm|làm gốm/i, p:[{n:'Làng gốm Bát Tràng',a:'Bát Tràng, Gia Lâm'},{n:'Xưởng gốm Authentic',a:'Bát Tràng'}]},
  {re:/trà chanh/i, p:[{n:'Trà chanh Nhà Thờ',a:'Phố Nhà Thờ, Hoàn Kiếm'},{n:'Trà chanh Đào Duy Từ',a:'Phố cổ Hoàn Kiếm'}]},
  {re:/kem tràng tiền|ăn kem|kem/i, p:[{n:'Kem Tràng Tiền',a:'35 Tràng Tiền, Hoàn Kiếm'},{n:'Kem Thuỷ Tạ',a:'1 Lê Thái Tổ, ven Hồ Gươm'}]},
  {re:/rooftop|sân thượng|cà phê view|view đẹp|sống ảo|ngắm hoàng hôn/i, p:[{n:'Top of Hanoi (Lotte 65F)',a:'54 Liễu Giai, Ba Đình'},{n:'Summit Lounge (Pan Pacific)',a:'1 Thanh Niên, Tây Hồ'},{n:'Serein Cafe & Lounge',a:'Quảng An, Tây Hồ'},{n:'6 Degrees Rooftop',a:'Nghi Tàm, Tây Hồ'}]},
  {re:/chợ đêm/i, p:[{n:'Chợ đêm Đồng Xuân',a:'Phố cổ Hoàn Kiếm (T6–CN)'},{n:'Chợ đêm phố cổ Hàng Đào',a:'Hàng Đào → Đồng Xuân'}]},
  {re:/phố đi bộ/i, p:[{n:'Phố đi bộ Hồ Gươm',a:'Hồ Hoàn Kiếm (cuối tuần)'},{n:'Phố đi bộ Trịnh Công Sơn',a:'Tây Hồ'}]},
  {re:/đạp xe/i, p:[{n:'Thuê xe đạp quanh Hồ Tây',a:'đường ven Hồ Tây'},{n:'Đạp xe quanh Hồ Gươm sáng sớm',a:'Hoàn Kiếm'}]},
  {re:/picnic|dã ngoại|cắm trại/i, p:[{n:'Bãi đá sông Hồng',a:'Ngõ 264 Âu Cơ, Tây Hồ'},{n:'Công viên Yên Sở',a:'Hoàng Mai'},{n:'Vườn nhãn Long Biên',a:'Bồ Đề, Long Biên'}]},
  {re:/làm bánh|lớp bánh|bánh trung thu|bánh quy|baking|lớp.*bánh/i, p:[{n:'Hanoi Cooking Centre (lớp làm bánh)',a:'44 Châu Long, Ba Đình'},{n:'Savor Cake Studio (lớp bánh)',a:'Hà Nội'},{n:'Beautiful Mind Baking Class',a:'Hà Nội'}]},
  {re:/lớp học nấu ăn|học nấu ăn/i, p:[{n:'Hanoi Cooking Centre',a:'44 Châu Long, Ba Đình'},{n:'Lớp nấu ăn Blue Butterfly',a:'69 Mã Mây, Hoàn Kiếm'}]},
  {re:/làm gốm|nặn gốm|lớp gốm|tô tượng|tô gốm/i, p:[{n:'Làng gốm Bát Tràng (workshop)',a:'Bát Tràng, Gia Lâm'},{n:'Xưởng gốm Authentic Hanoi',a:'Bát Tràng'},{n:'Studio gốm nội thành',a:'Hà Nội'}]},
  {re:/vẽ tranh|lớp vẽ|workshop vẽ|color me/i, p:[{n:'Tiny Art Studio (lớp vẽ)',a:'Hà Nội'},{n:'Toong Art / Workshop vẽ',a:'Hà Nội'}]},
  {re:/workshop|làm nến|làm xà phòng|làm son|cắm hoa/i, p:[{n:'Workshop thủ công (nến/son/hoa)',a:'tìm studio gần Núi Trúc'},{n:'Complex 01 (hay có workshop)',a:'Ngõ 31 Tây Sơn, Đống Đa'}]},{re:/bún đậu|mắm tôm/i,p:[{n:'Bún đậu Trung Hương',a:'49 Ngõ Phất Lộc, Hoàn Kiếm'},{n:'Bún đậu A Chảnh',a:'Ngã Tư Sở, Đống Đa'}]},{re:/lẩu|nhúng/i,p:[{n:'Lẩu nấm Ashima',a:'Nhiều cơ sở, Hà Nội'},{n:'Kichi Kichi lẩu băng chuyền',a:'Vincom các quận'},{n:'Lẩu Phan',a:'Chuỗi lẩu bò Hà Nội'}]},{re:/nướng|bbq|kagawa|đồ hàn/i,p:[{n:'GoGi House',a:'Vincom / TTTM'},{n:'Sườn nướng Vạn Tuế',a:'Nhiều cơ sở'},{n:'Meat Plus BBQ',a:'Trần Duy Hưng, Cầu Giấy'}]},{re:/pizza|mỳ ý|pasta/i,p:[{n:'Pizza 4P’s',a:'Tràng Tiền / Lotte'},{n:'The Pizza Company',a:'TTTM các quận'}]},{re:/kem|tráng miệng|ăn chè/i,p:[{n:'Kem Tràng Tiền',a:'35 Tràng Tiền, Hoàn Kiếm'},{n:'Chè bốn mùa',a:'4 Hàng Cân, Hoàn Kiếm'},{n:'Kem Thủy Tạ',a:'Hồ Gươm, Hoàn Kiếm'}]},{re:/công viên|đi dạo|đi bộ ngoài trời/i,p:[{n:'Công viên Thống Nhất',a:'Đại Cồ Việt, Hai Bà Trưng'},{n:'Vườn hoa Bách Thảo',a:'Hoàng Hoa Thám, Ba Đình'},{n:'Công viên Cầu Giấy',a:'Cầu Giấy'}]},{re:/vui chơi trẻ|khu vui chơi|cho bé chơi|cho con chơi/i,p:[{n:'tiNiWorld',a:'Vincom các quận'},{n:'Khu vui chơi trong TTTM',a:'Aeon, Vincom, Times City'},{n:'Sở thú Thủ Lệ',a:'Kim Mã, Ba Đình'}]},{re:/bảo tàng|triển lãm/i,p:[{n:'Bảo tàng Dân tộc học',a:'Nguyễn Văn Huyên, Cầu Giấy'},{n:'Bảo tàng Mỹ thuật VN',a:'66 Nguyễn Thái Học, Ba Đình'},{n:'VCCA triển lãm nghệ thuật',a:'Royal City'}]}];
function ideaPlace(title,budget){
  const raw=title||'';
  const hiddenC=store.get('ju.hiddenSpots',[])||[];
  for(const r of IDEA_PLACES){ if(r.re.test(raw)){ const ps=r.p.filter(x=>hiddenC.indexOf(x.n)<0); const arr=ps.length?ps:r.p; const c=arr[Math.floor(Math.random()*arr.length)]; return {n:c.n,area:c.a,p:c.p||'',curated:true}; } }
  const s=(title||'').toLowerCase(); let cat=null, vibe=null;
  // Ý tưởng dạng HOẠT ĐỘNG (lớp học, workshop, tự làm, thể thao…) thì KHÔNG suy ra quán ăn/cafe
  const isActivity=/lớp|học|workshop|khoá|tự tay|tự làm|làm bánh|làm gốm|nặn|vẽ|tô tượng|thử thách|chèo|kayak|sup|đạp xe|leo|cắm trại|glamping|chụp ảnh|đọc|viết|hát|nhảy|khiêu vũ|tập|trồng|may|đan|móc|massage|spa|xông|thiền|yoga/.test(s);
  if(!isActivity && /cà phê|cafe|cà-phê|trà chanh|trà sữa|trà đá|board game/.test(s)){ cat='cafe';
    if(/board game/.test(s)) vibe='boardgame';
    else if(/view|hoàng hôn|sống ảo|rooftop|sang/.test(s)) vibe='songao'; }
  else if(!isActivity && /(^|\s)ăn lẩu|(^|\s)lẩu|nướng|buffet|hải sản|ăn ốc|(^|\s)ốc|(^|\s)bún |(^|\s)phở|miến |cháo |(^|\s)cơm |đi ăn|quán ăn|nhà hàng|ăn vặt|vịt quay|chả cá/.test(s)){ cat='an';
    if(/lẩu/.test(s)) vibe='lau'; else if(/nướng/.test(s)) vibe='nuong'; else if(/hải sản|ốc/.test(s)) vibe='haisan'; else if(/buffet/.test(s)) vibe='buffet'; else if(/chay/.test(s)) vibe='chay'; }
  else if(/bảo tàng|triển lãm|kịch|nhà hát|xem phim|rạp|sở thú|thuỷ cung|thủy cung|patin|bowling/.test(s)) cat='vanhoa';
  else if(/công viên|dạo|đi bộ|picnic|ngoài trời|đạp xe|vườn|cắm trại|chợ đêm|chợ hoa|ven hồ/.test(s)) cat='ngoaitroi';
  if(!cat) return null;
  const hidden=store.get('ju.hiddenSpots',[])||[];
  let arr=HANOI_SPOTS.filter(x=>x.cat===cat && hidden.indexOf(x.n)<0);
  if(vibe){ const v=arr.filter(x=>vibeTags(x).indexOf(vibe)>=0); if(v.length) arr=v; }
  if(budget){ const b=arr.filter(x=>x.budget===budget); if(b.length) arr=b; }
  if(!arr.length) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}
const CALM_ANGRY=['Hít thở sâu kiểu 4–7–8 trong 1 phút','Ra ngoài đi bộ nhanh 5 phút cho hạ nhiệt','Uống một cốc nước mát từ từ','Viết ra điều khiến bạn bực rồi… xé tờ giấy đi','Đếm ngược thật chậm từ 20 về 0','Rửa mặt / rửa tay bằng nước mát','Tạm rời khỏi tình huống 10 phút rồi quay lại','Vận động mạnh 2 phút (chống đẩy, nhảy dây) để xả','Nghe một bài nhạc bạn thích','Tự hỏi: “Việc này 1 tuần nữa còn quan trọng không?”','Nói ra cảm xúc bằng câu “Anh/em đang thấy…” thay vì trách','Bóp một quả bóng/khăn cho xả lực','Nhắm mắt, thả lỏng vai và hàm trong 30 giây','Uống ngụm nước, nhẩm “mình chọn bình tĩnh”','Ra ban công hít thở khí trời','Tưởng tượng điều khiến mình bực sẽ ra sao nếu cười xoà','Viết 1 câu cảm ơn người kia để đổi góc nhìn','Vỗ nước lạnh lên cổ tay','Uống một ngụm nước mát và đếm ngược từ 10','Ra ban công hít thở sâu 5 nhịp rồi quay lại','Viết nhanh điều đang bực ra giấy rồi xé bỏ','Rửa mặt bằng nước mát cho dịu lại','Đi bộ một vòng quanh nhà cho hạ nhiệt','Nghe một bài hát yêu thích trọn vẹn rồi mới nói','Tạm dừng 15 phút, hẹn nói chuyện lại khi bình tĩnh','Bóp chặt rồi thả lỏng hai bàn tay vài lần',"Đếm ngược từ 20 về 0 thật chậm","Rửa mặt bằng nước mát","Nghe trọn một bài hát yêu thích","Gọi tên cảm xúc: mình đang giận vì…","Ôm con hoặc thú cưng một lúc","Nhắn người kia: cho anh/em xin ít phút bình tĩnh nhé","Pha một tách trà ấm và uống chậm","Vươn vai, xoay cổ vai gáy 10 nhịp","Viết ra 3 điều mình biết ơn ngay lúc này","Ra ban công hít thở không khí 2 phút","Tự hỏi: chuyện này 1 tuần nữa có còn quan trọng không?","Uống nước hoặc ăn nhẹ nếu đang đói"];
const SWEET_NOTES=['Cảm ơn em/anh vì hôm nay nhé 💗','Nhớ em/anh quá đi mất 🥰','Hôm nay làm tốt lắm, tự hào về em/anh!','Về nhà an toàn nha, có anh/em đợi 🏠','Yêu em/anh nhiều hơn hôm qua một chút 💞','Tối nay mình ăn gì ngon ngon nhé?','Cười lên nào, mọi chuyện sẽ ổn thôi 🌈','Có gì mệt cứ kể anh/em nghe nhé','Cảm ơn vì luôn ở bên cạnh 🤍','Mai mình đi chơi đâu đó đi 🚲','Em/anh là điều tuyệt nhất của ngày hôm nay ✨','Ôm một cái cho có động lực nào 🤗','Uống đủ nước và nghỉ ngơi nhé!','Dù xa hay gần, tim vẫn hướng về nhau 💕','Cứ là chính mình, anh/em yêu em/anh như thế','Có anh/em ở đây rồi, đừng lo nhé','Hôm nay vất vả rồi, nghỉ ngơi đi nha','Gặp được em/anh là điều may nhất đời anh/em','Đi đâu cũng được, miễn có nhau','Cảm ơn vì đã chọn ở lại bên anh/em mỗi ngày','Mai trời đẹp, mình đi đâu đó nhé','Em/anh cứ dựa vào anh/em những lúc mỏi mệt','Nhớ ăn uống đầy đủ khi anh/em không ở cạnh nhé','Yêu cái cách em/anh cười khi vui','Về nhà thôi, có người đợi cơm rồi nè','Chúc em/anh một ngày nhẹ nhàng và nhiều niềm vui','Chỉ cần em/anh khoẻ và vui là đủ rồi'];
const CALM_ANXIOUS=['Thở ra dài hơn hít vào, lặp lại 1 phút','Kỹ thuật 5-4-3-2-1: gọi tên 5 thứ nhìn thấy, 4 nghe được, 3 chạm được…','Viết ra điều lo + tách “việc mình kiểm soát được” và “không”','Uống một tách trà ấm','Đi bộ chậm, chú ý từng bước chân','Nhắn cho người ấy điều đang khiến bạn lo','Tắm nước ấm thư giãn','Nghe nhạc thiền / lo-fi 10 phút','Ghi ra 3 điều bạn biết ơn hôm nay','Đặt điện thoại xuống 15 phút','Ôm người ấy 20 giây cho dịu lại','Tự nhủ: “Mình đã vượt qua những lúc khó hơn thế này.”','Đặt tay lên ngực, cảm nhận nhịp thở chậm lại','Chia việc đang lo thành 1 bước nhỏ làm ngay','Pha một ly nước ấm mật ong','Ra ngoài nhìn cây xanh / bầu trời 2 phút','Viết thư cho chính mình của tuần sau','Vươn vai, xoay cổ nhẹ nhàng','Gọi tên 5 thứ đang nhìn thấy quanh mình','Đặt tay lên ngực, cảm nhận hơi thở vào ra','Viết ra điều lo lắng và một việc nhỏ có thể làm ngay','Pha một ly trà ấm và uống thật chậm','Nhắn cho người mình tin một câu cho nhẹ lòng','Co duỗi vai gáy nhẹ nhàng vài phút','Nhắc mình: phần lớn điều lo chưa chắc xảy ra','Ra chỗ có nắng / cây xanh đứng vài phút'];

/* ============ small components ============ */
/* @@GOM ui-ju.jsx */
function Stars({value=0,onChange}){
  return <span className="stars">{[1,2,3,4,5].map(i=>(
    <span key={i} onClick={onChange?()=>onChange(i===value?0:i):undefined} style={{cursor:onChange?'pointer':'default'}}>
      {i<=value?'★':'☆'}</span>
  ))}</span>;
}

/* ============ Sheet (modal) ============ */

/* ============ Menu lưới biểu tượng (thay seg cuộn ngang) ============ */
function orderItems(items, menuId){
  const ord=(store.get('ju.menuOrder',{})||{})[menuId];
  let list=items;
  if(ord&&ord.length){
    const byK={}; items.forEach(it=>{ byK[it.k]=it; });
    const out=[]; ord.forEach(k=>{ if(byK[k]){ out.push(byK[k]); delete byK[k]; } });
    items.forEach(it=>{ if(byK[it.k]) out.push(it); });
    list=out;
  }
  const hidden=(store.get('ju.menuHidden',{})||{})[menuId];
  if(hidden&&hidden.length) list=list.filter(it=>!hidden.includes(it.k));
  return list;
}
function ReorderSheet({items, menuId, onClose}){
  const [order,setOrder]=useLocal('ju.menuOrder',{});
  const [menuHidden,setMenuHidden]=useLocal('ju.menuHidden',{});
  const byK=Object.fromEntries(items.map(it=>[it.k,it]));
  const [list,setList]=useState(()=>{ const ord=orderItems(items,menuId).map(it=>it.k).filter(k=>byK[k]); const rest=items.map(it=>it.k).filter(k=>!ord.includes(k)); return [...ord,...rest]; });
  const [hidden,setHidden]=useState(()=>(menuHidden[menuId]||[]).filter(k=>byK[k]));
  const move=(i,dir)=>{ const j=i+dir; if(j<0||j>=list.length) return; const n=list.slice(); const t=n[i]; n[i]=n[j]; n[j]=t; setList(n); };
  const toggleHidden=(k)=> setHidden(h=>h.includes(k)?h.filter(x=>x!==k):[...h,k]);
  const save=()=>{
    store.set('ju.menuOrder',{...order,[menuId]:list}); setOrder({...order,[menuId]:list});
    store.set('ju.menuHidden',{...menuHidden,[menuId]:hidden}); setMenuHidden({...menuHidden,[menuId]:hidden});
    try{ Cloud.schedulePush&&Cloud.schedulePush(); }catch(_){}
    onClose&&onClose();
  };
  const reset=()=>{
    const nOrder={...order}; delete nOrder[menuId]; store.set('ju.menuOrder',nOrder); setOrder(nOrder);
    const nHidden={...menuHidden}; delete nHidden[menuId]; store.set('ju.menuHidden',nHidden); setMenuHidden(nHidden);
    try{ Cloud.schedulePush&&Cloud.schedulePush(); }catch(_){}
    onClose&&onClose();
  };
  return (<div>
    <div className="muted" style={{fontSize:12.5,marginBottom:10}}>Bấm ▲ ▼ để đổi thứ tự, bấm Ẩn/Hiện để bớt mục không dùng, rồi Lưu.</div>
    <div className="card" style={{padding:'2px 12px'}}>
      {list.map((k,i)=>{ const it=byK[k]; if(!it) return null; const off=hidden.includes(k); return (
        <div key={k} className="row" style={{padding:'8px 0',borderBottom:i<list.length-1?'1px solid var(--line)':'none',opacity:off?.5:1}}>
          <span style={{fontSize:17,marginRight:8}}>{it.icon}</span><span className="grow" style={{fontSize:14}}>{it.label}</span>
          <button className="pill" style={{marginRight:4,background:off?'var(--bg)':'var(--good)',color:off?'var(--muted)':'#fff',border:off?'1px solid var(--line)':'none'}} onClick={()=>toggleHidden(k)}>{off?'Ẩn':'Hiện'}</button>
          <button className="iconbtn" style={i===0?{opacity:.3}:{}} aria-label="Lên" onClick={()=>move(i,-1)}><Ic n="len" size={16}/></button>
          <button className="iconbtn" style={i===list.length-1?{opacity:.3}:{}} aria-label="Xuống" onClick={()=>move(i,1)}><Ic n="xuong" size={16}/></button>
        </div>
      ); })}
    </div>
    <div className="row" style={{gap:8,marginTop:12}}>
      <button className="btn grow" onClick={save}>💾 Lưu</button>
      <button className="btn soft" onClick={reset}>↺ Mặc định</button>
    </div>
  </div>);
}
function FilterBar({items, value, onChange, menuId}){
  const shown=menuId?orderItems(items,menuId):items;
  return (
    <div className="filters">
      {shown.map(it=>(<button key={it.k} className={value===it.k?'on':''} onClick={()=>onChange(it.k)}>{it.icon?it.icon+' ':''}{it.label}</button>))}
    </div>
  );
}
function SegGrid({items, value, onChange, sub, menuId}){
  const shown=menuId?orderItems(items,menuId):items;
  return (
    <div className={'segbar'+(sub?' sub':'')}>
      {shown.map(it=>(
        <button key={it.k} className={'segpill'+(value===it.k?' on':'')} onClick={()=>onChange(it.k)}>
          <span className="segic">{it.icon}</span><span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ============ Generic list (Wishlist, Bucket, Watch, Links, Places, Food, Date ideas) ============ */
function SimpleList({skey, people, me, addLabel, doneLabel='Xong', fields=[], tagOptions, empty, flash, suggest, claimable, showTotal}){
  const [items,setItems]=useLocal(skey,[]);
  const other=me==='a'?'b':'a';
  const claim=(id)=> setItems(prev=>prev.map(x=>x.id===id?{...x,claimedBy:x.claimedBy?null:me}:x));
  const totalPrice=showTotal? items.reduce((s,x)=>s+(Number(x.price)||0),0):0;
  const [filter,setFilter]=useState('all');
  const [q,setQ]=useState('');
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [sugOpen,setSugOpen]=useState(false);
  const [view,setView]=useState(null);

  const save=(it)=>{
    if(it.id){ setItems(prev=>prev.map(x=>x.id===it.id?it:x)); }
    else { setItems(prev=>[{...it,id:uid(),by:me,fav:false,done:false,createdAt:Date.now()}, ...prev]); }
    setOpen(false); setEdit(null);
  };
  const addQuick=(title)=> setItems(prev=>[{title,id:uid(),by:me,fav:false,done:false,createdAt:Date.now()},...prev]);
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const toggle=(id,f)=> setItems(prev=>prev.map(x=>{ if(x.id!==id) return x; const nv={...x,[f]:!x[f]}; if(f==='done'&&nv.done) celebrate(); return nv; }));

  const shown=useMemo(()=>{
    let a=items.slice();
    if(filter==='mine') a=a.filter(x=>x.by===me);
    if(filter==='partner') a=a.filter(x=>x.by===other);
    if(filter==='fav') a=a.filter(x=>x.fav);
    if(filter==='todo') a=a.filter(x=>!x.done);
    if(q.trim()){ const s=q.toLowerCase(); a=a.filter(x=>(x.title||'').toLowerCase().includes(s)||(x.note||'').toLowerCase().includes(s)); }
    a.sort((p,r)=> (r.fav?1:0)-(p.fav?1:0) || r.createdAt-p.createdAt);
    return a;
  },[items,filter,q,me]);

  return (
    <div>
      <div className="row" style={{margin:'4px 14px 0',gap:8}}>
        <input className="inp grow" placeholder="🔎 Tìm…" value={q} onChange={e=>setQ(e.target.value)} />
        {suggest && <button className="btn sm soft" aria-label="Gợi ý" title="Gợi ý" onClick={()=>setSugOpen(true)}><Ic n="goiy"/></button>}
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button>
      </div>
      <div className="filters">
        <button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Tất cả</button>
        <button className={filter==='todo'?'on':''} onClick={()=>setFilter('todo')}>Chưa {doneLabel.toLowerCase()}</button>
        <button className={filter==='mine'?'on':''} onClick={()=>setFilter('mine')}>{people[me]?.name||'Của tôi'}</button>
        <button className={filter==='partner'?'on':''} onClick={()=>setFilter('partner')}>{people[other]?.name||'Của nửa kia'}</button>
        <button className={filter==='fav'?'on':''} onClick={()=>setFilter('fav')}>❤️ Thích</button>
      </div>

      {showTotal && totalPrice>0 && <div className="muted center" style={{fontSize:12.5,margin:'6px 14px 0'}}>💰 Tổng ước tính: <b>{VND(totalPrice)}</b></div>}
      {shown.length===0 && <div className="empty"><span className="big">{empty?.icon||'✨'}</span>{empty?.text||'Chưa có gì cả — thêm mục đầu tiên nhé!'}</div>}

      {shown.map(it=>{ const multi=fields.includes('photos'); const ps=photoList(it); const ms=(it.menuPhotos||[]).filter(Boolean); return (
        <div key={it.id} className={'item'+(it.done?' dn':'')}>
          <div className="it-top">
            <h4>{it.title}</h4>
            <button className={'heartbtn'+(it.fav?' on':'')} aria-label={it.fav?'Bỏ thích':'Thích'} onClick={()=>toggle(it.id,'fav')}><Ic n={it.fav?'tim':'timrong'} size={18}/></button>
          </div>
          {multi
            ? <React.Fragment>
                {ps.length>0 && <div style={{marginTop:8}}><PhotoShow photos={ps} big onView={i=>setView({photos:ps,i,title:'📷 '+it.title})}/></div>}
                {ms.length>0 && <div style={{marginTop:6}}>
                  <div className="phlab" style={{marginTop:0}}>📋 Menu · {ms.length} ảnh</div>
                  <PhotoShow photos={ms} onView={i=>setView({photos:ms,i,title:'📋 Menu · '+it.title})}/>
                </div>}
              </React.Fragment>
            : (it.photo && <PhotoImg photo={it.photo} style={{width:'100%',maxHeight:200,objectFit:'cover',borderRadius:10,margin:'8px 0 0',display:'block'}}/>)}
          {it.note && <div className="it-note">{it.note}</div>}
          {it.address && <div className="it-note muted">📍 {it.address}</div>}
          {it.link && <div style={{marginTop:6}}><a className="linkout" href={it.link} target="_blank" rel="noreferrer">🔗 {it.link}</a></div>}
          <div className="it-meta">
            <span className="av-sm">{people[it.by]?.avatar||'❤️'}</span>
            <span className="muted" style={{fontSize:12.5}}>{people[it.by]?.name||''}</span>
            {it.budget && <span className="pill">{budgetLabel(it.budget)}</span>}
            {fields.includes('price')
              ? <span className="pill">{(typeof it.price==='number'&&it.price>0)?VND(it.price):'Chưa ghi giá'}</span>
              : (typeof it.price==='number' && it.price>0 && <span className="pill">{VND(it.price)}</span>)}
            {it.tag && <span className="pill">{it.tag}</span>}
            {typeof it.rating==='number' && it.rating>0 && <Stars value={it.rating} />}
            <span className="grow"></span>
            {claimable && it.by!==me && <button className="pill" onClick={()=>claim(it.id)}
              style={{background:it.claimedBy?'var(--good)':'var(--chip)',color:it.claimedBy?'#fff':'var(--chip-tx)'}}>{it.claimedBy?'🤫 Đã nhận lo':'🤝 Tôi lo'}</button>}
            <button className="pill" onClick={()=>toggle(it.id,'done')}>{it.done?'↩︎ Bỏ':'✓ '+doneLabel}</button>
            <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(it);setOpen(true);}}><Ic n="sua"/></button>
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(it.id)}><Ic n="xoa"/></button>
          </div>
        </div>
      ); })}

      <PhotoLightbox photos={view&&view.photos} index={view&&view.i} title={view&&view.title} onClose={()=>setView(null)}/>

      {open && <ItemForm title={(edit?'Sửa ':'Thêm ')+addLabel} init={edit} fields={fields} tagOptions={tagOptions}
        onClose={()=>{setOpen(false);setEdit(null);}} onSave={save} />}

      {sugOpen && suggest && <Sheet title="💡 Gợi ý — chạm để thêm" onClose={()=>setSugOpen(false)}>
        <div>
          {suggest.filter(s=>!items.some(it=>(it.title||'').trim().toLowerCase()===s.toLowerCase())).map(s=>(
            <button key={s} className="pill" style={{margin:'4px 6px 4px 0',padding:'8px 12px',fontSize:12.5}}
              onClick={()=>{ addQuick(s); flash&&flash('Đã thêm: '+s); }}>＋ {s}</button>
          ))}
          {suggest.filter(s=>!items.some(it=>(it.title||'').trim().toLowerCase()===s.toLowerCase())).length===0 &&
            <div className="muted center" style={{padding:'16px 0'}}>Bạn đã thêm hết gợi ý rồi 🎉</div>}
        </div>
      </Sheet>}
    </div>
  );
}

function ItemForm({title,init,fields,tagOptions,onClose,onSave}){
  const [f,setF]=useState(()=>{
    const b=init? {...init} : {title:''};
    if(fields.includes('photos')){ b.photos=photoList(b); delete b.photo; }   // gộp ảnh cũ (1 ảnh) vào danh sách
    if(fields.includes('menu')) b.menuPhotos=b.menuPhotos||[];
    return b;
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const has=(k)=>fields.includes(k);
  const fileRef=useRef(null); const [busy,setBusy]=useState(false);
  const onFile=async(e)=>{ const file=e.target.files[0]; if(!file)return; e.target.value=''; setBusy(true);
    try{ if(Cloud.connected()){ const path=await Cloud.uploadPhoto(file); set('photo',{path}); setBusy(false); }
      else { const r=new FileReader(); r.onload=()=>{ set('photo',{src:r.result}); setBusy(false); }; r.readAsDataURL(file); } }
    catch(err){ setBusy(false); } };
  const submit=()=>{ if(!f.title || !f.title.trim()){ return; } onSave(f); };
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="field"><label>Tiêu đề</label>
        <input className="inp" value={f.title||''} onChange={e=>set('title',e.target.value)} placeholder="Nhập…" autoFocus/></div>
      {has('price') && <div className="field"><label>Giá ước tính (đ)</label>
        <input className="inp" type="number" value={f.price||''} onChange={e=>set('price',Number(e.target.value))} placeholder="0"/></div>}
      {has('photo') && <div className="field"><label>Ảnh quán</label>
        {f.photo
          ? <div style={{position:'relative'}}>
              <PhotoImg photo={f.photo} style={{width:'100%',height:160,objectFit:'cover',borderRadius:12,display:'block'}}/>
              <button className="pill" style={{position:'absolute',top:6,right:6}} onClick={()=>set('photo',null)}>✕ Bỏ ảnh</button></div>
          : <button className="btn soft" onClick={()=>fileRef.current.click()}>{busy?'Đang tải…':'📷 Thêm ảnh'}</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/></div>}
      {has('photos') && <div className="field"><label>📷 Ảnh quán / món (thêm bao nhiêu cũng được)</label>
        <PhotoPicker value={f.photos} onChange={v=>set('photos',v)} label="📷 Thêm ảnh" hint="chọn được nhiều ảnh một lần"/></div>}
      {has('menu') && <div className="field"><label>📋 Ảnh menu / bảng giá</label>
        <PhotoPicker value={f.menuPhotos} onChange={v=>set('menuPhotos',v)} label="📋 Thêm ảnh menu" hint="chụp tờ menu để lần sau khỏi đoán giá"/></div>}
      {has('budget') && <div className="field"><label>Ngân sách</label>
        <select className="inp" value={f.budget||''} onChange={e=>set('budget',e.target.value)}>
          <option value="">— chọn —</option>{BUDGETS.map(b=><option key={b.k} value={b.k}>{b.label}</option>)}
        </select></div>}
      {has('tag') && <div className="field"><label>Loại</label>
        <select className="inp" value={f.tag||''} onChange={e=>set('tag',e.target.value)}>
          <option value="">— chọn —</option>{(tagOptions||[]).map(t=><option key={t} value={t}>{t}</option>)}
        </select></div>}
      {has('address') && <div className="field"><label>Địa chỉ</label>
        <input className="inp" value={f.address||''} onChange={e=>set('address',e.target.value)} placeholder="Ở đâu?"/></div>}
      {has('link') && <div className="field"><label>Link</label>
        <input className="inp" value={f.link||''} onChange={e=>set('link',e.target.value)} placeholder="https://…"/></div>}
      {has('rating') && <div className="field"><label>Đánh giá</label>
        <div><Stars value={f.rating||0} onChange={v=>set('rating',v)} /></div></div>}
      {has('note') && <div className="field"><label>Ghi chú</label>
        <textarea className="inp" value={f.note||''} onChange={e=>set('note',e.target.value)} placeholder="Thêm chi tiết…"/></div>}
      <button className="btn" onClick={submit}>💾 Lưu</button>
    </Sheet>
  );
}

/* ============ Câu hỏi mỗi ngày ============ */
function DailyQuestion({people,me}){
  const [qa,setQa]=useLocal('ju.qa',{});
  const key=todayISO();
  const q=questionOfToday();
  const today=qa[key]||{q};
  const [draft,setDraft]=useState('');
  const [editing,setEditing]=useState(false);
  useEffect(()=>{ setDraft((qa[key]||{})[me]||''); setEditing(false); },[key]);
  const other=me==='a'?'b':'a';
  const myAnswer=today[me], otherAnswer=today[other];
  const save=()=>{ if(!draft.trim())return; setQa({...qa,[key]:{...today,q,[me]:draft.trim()}}); setEditing(false); };
  const streak=answerStreak(qa);
  return (
    <div className="card">
      <div className="row"><b>❓ Câu hỏi hôm nay</b>{streak>1 && <span className="pill" style={{marginLeft:8}}>🔥 {streak} ngày</span>}<span className="grow"></span><span className="muted" style={{fontSize:12.5}}>{fmtDateVN(key)}</span></div>
      <div style={{fontWeight:700,margin:'8px 0 10px',fontSize:15,lineHeight:1.35}}>{q}</div>
      {(!myAnswer || editing) ? (
        <div className="row" style={{gap:8}}>
          <input className="inp grow" placeholder="Câu trả lời của bạn…" value={draft}
            onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') save(); }} autoFocus={editing}/>
          <button className="btn sm" onClick={save}>Gửi</button>
        </div>
      ) : (
        <div style={{background:'var(--chip)',color:'var(--chip-tx)',borderRadius:12,padding:'9px 12px',fontSize:14}}>
          <div className="row"><span className="muted" style={{fontSize:11}}>{people[me].name} (bạn)</span>
            <span className="grow"></span><button className="muted" style={{fontSize:11}} onClick={()=>{setDraft(myAnswer);setEditing(true);}}>✏️ sửa</button></div>
          <div style={{marginTop:2}}>{myAnswer}</div>
        </div>
      )}
      {myAnswer && (otherAnswer
        ? <div style={{background:'var(--bg)',border:'1px solid var(--line)',borderRadius:12,padding:'9px 12px',fontSize:14,marginTop:6}}>
            <span className="muted" style={{fontSize:11}}>{people[other].name}</span>
            <div style={{marginTop:2}}>{otherAnswer}</div></div>
        : <div className="muted" style={{fontSize:12.5,marginTop:8}}>Đã trả lời ✓ — chờ {people[other].name} trả lời nhé 💞</div>)}
    </div>
  );
}

/* ============ Đố vui "Hiểu nhau đến đâu?" ============ */
function CoupleQuiz({people,me}){
  const [quiz,setQuiz]=useLocal('ju.quiz',{});
  const key=todayISO(); const q=quizOfToday();
  const today=quiz[key]||{q};
  const other=me==='a'?'b':'a';
  const mine=today[me]||{}, theirs=today[other]||{};
  const [self,setSelf]=useState(''); const [guess,setGuess]=useState('');
  useEffect(()=>{ const t=(quiz[key]||{})[me]||{}; setSelf(t.self||''); setGuess(t.guess||''); },[key,me]);
  const done=mine.self&&mine.guess;
  const bothDone=done && theirs.self && theirs.guess;
  const save=()=>{ if(!self.trim()||!guess.trim())return; setQuiz({...quiz,[key]:{...today,q,[me]:{self:self.trim(),guess:guess.trim()}}}); };
  const norm=(s)=>(s||'').trim().toLowerCase();
  const iRight=bothDone && norm(mine.guess)===norm(theirs.self);
  const theyRight=bothDone && norm(theirs.guess)===norm(mine.self);
  const score=(iRight?1:0)+(theyRight?1:0);
  return (
    <div className="card">
      <div className="row"><span className="hc-title">💞 Hiểu nhau đến đâu?</span><span className="grow"></span><span className="hc-act">đố vui mỗi ngày</span></div>
      <div className="hc-lead">{q}</div>
      {!done ? (
        <div>
          <div className="field"><label>Câu trả lời thật của bạn</label>
            <input className="inp" value={self} onChange={e=>setSelf(e.target.value)} placeholder="Về chính bạn…"/></div>
          <div className="field"><label>Đoán câu trả lời của {people[other].name}</label>
            <input className="inp" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="Bạn nghĩ người kia trả lời gì?"/></div>
          <button className="btn" onClick={save}>Gửi</button>
        </div>
      ) : !bothDone ? (
        <div className="muted" style={{fontSize:12.5}}>Bạn đã chơi ✓ — chờ {people[other].name} để lật kết quả 💕</div>
      ) : (
        <div>
          <div style={{background:'var(--chip)',color:'var(--chip-tx)',borderRadius:12,padding:'10px',fontSize:12.5}}>
            <div>Bạn đoán {people[other].name}: “{mine.guess}” → {iRight?'✅ Đúng!':'❌ thật ra: “'+theirs.self+'”'}</div>
            <div style={{marginTop:6}}>{people[other].name} đoán bạn: “{theirs.guess}” → {theyRight?'✅ Đúng!':'❌ thật ra: “'+mine.self+'”'}</div>
          </div>
          <div className="center" style={{marginTop:8,fontWeight:800}}>Điểm hiểu nhau: {score}/2 {score===2?'🎉':'💪'}</div>
        </div>
      )}
    </div>
  );
}

/* ============ Thử thách đôi hôm nay ============ */
function DailyChallenge(){
  const [log,setLog]=useLocal('ju.challengeDone',{});
  const key=todayISO();
  const ch=challengeOfToday();
  const done=!!log[key];
  const has=(d)=>!!log[d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())];
  const streak=streakOf(has);
  const toggle=()=>{ const nv={...log}; if(done){ delete nv[key]; } else { nv[key]=true; celebrate(['💞','🎉','✨','💪']); } setLog(nv); };
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🎯 Thử thách đôi hôm nay</span>{streak>1 && <span className="pill" style={{marginLeft:8}}>🔥 {streak} ngày</span>}<span className="grow"></span></div>
      <div className="hc-lead">{ch}</div>
      <button className={'btn'+(done?' soft':'')} onClick={toggle}>{done?'✓ Đã làm cùng nhau 💞 (bỏ đánh dấu)':'Đánh dấu đã làm cùng nhau'}</button>
    </div>
  );
}

/* ============ Check-in tuần ============ */
function WeeklyCheckin({people,me}){
  const [data,setData]=useLocal('ju.checkin',{});
  const wk=weekKey();
  const week=data[wk]||{};
  const mine=week[me]||{}, other=me==='a'?'b':'a', theirs=week[other]||{};
  const [rating,setRating]=useState(0); const [note,setNote]=useState('');
  useEffect(()=>{ const w=(data[wk]||{})[me]||{}; setRating(w.rating||0); setNote(w.note||''); },[wk,me]);
  const save=()=>{ if(!rating)return; setData({...data,[wk]:{...(data[wk]||{}),[me]:{rating,note:note.trim()}}}); };
  return (
    <div className="card">
      <div className="row"><span className="hc-title">📝 Check-in tuần này</span><span className="grow"></span><span className="hc-act">tuần {fmtDateVN(wk)}</span></div>
      <div className="hc-body" style={{margin:'6px 0'}}>Tuần qua của hai đứa thế nào?</div>
      <div className="row" style={{gap:2}}>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setRating(i)} aria-label={'Chấm '+i+' trên 5'} className="tapmin" style={{lineHeight:1,color:'var(--heart)'}}><Ic n={i<=rating?'tim':'timrong'} size={24}/></button>)}</div>
      <input className="inp" style={{marginTop:8}} placeholder="Điều gì đáng nhớ tuần này? (tuỳ chọn)" value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') save(); }}/>
      <button className="btn" style={{marginTop:8}} onClick={save}>{mine.rating?'Cập nhật check-in':'Gửi check-in'}</button>
      {theirs.rating
        ? <div style={{marginTop:10,background:'var(--chip)',color:'var(--chip-tx)',borderRadius:12,padding:'9px 11px',fontSize:12.5}}>
            <b>{people[other].name}:</b> {'❤️'.repeat(theirs.rating)}{theirs.note?' · '+theirs.note:''}</div>
        : <div className="muted" style={{fontSize:12.5,marginTop:8}}>{people[other].name} chưa check-in tuần này.</div>}
    </div>
  );
}

/* ============ Lọ yêu thương ============ */
function LoveJar({people,me}){
  const [jar,setJar]=useLocal('ju.lovejar',[]);
  const [drawn,setDrawn]=useState(null);
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const add=(t)=>{ const x=((t!=null?t:text)||'').trim(); if(!x)return; setJar(prev=>[{id:uid(),text:x,by:me,createdAt:Date.now()},...prev]); setText(''); };
  const draw=()=>{ if(jar.length===0)return; setDrawn(jar[Math.floor(Math.random()*jar.length)]); };
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🫙 Lọ yêu thương</span><span className="grow"></span><span className="hc-act">{jar.length} điều</span></div>
      {drawn
        ? <div className="center" style={{margin:'10px 0'}}>
            <div style={{fontSize:16,fontWeight:700,lineHeight:1.4}}>“{drawn.text}”</div>
            <div className="muted" style={{fontSize:11,marginTop:4}}>— {people[drawn.by]?.name} viết</div>
          </div>
        : <div className="muted" style={{fontSize:12.5,margin:'8px 0'}}>Cất những lý do yêu nhau / điều biết ơn vào lọ — lúc buồn rút ra đọc 💞</div>}
      <div className="row" style={{gap:8}}>
        <button className="btn grow" onClick={draw} disabled={jar.length===0}>{jar.length===0?'Lọ đang trống':'💝 Rút một điều'}</button>
        <button className="btn sm soft" onClick={()=>setOpen(true)}>＋</button>
      </div>
      {open && <Sheet title="🫙 Thêm vào lọ yêu thương" onClose={()=>setOpen(false)}>
        <div className="field"><label>Điều bạn yêu / biết ơn ở người ấy</label>
          <textarea className="inp" autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Vì em luôn…"/></div>
        <button className="btn" onClick={()=>{ if(text.trim()){ add(); setOpen(false); } }}>💾 Cất vào lọ</button>
        <div className="muted" style={{fontSize:12.5,margin:'14px 0 6px'}}>Gợi ý nhanh:</div>
        <div>{LOVEJAR_SUGGEST.map(s=><button key={s} className="pill" style={{margin:'3px 6px 3px 0',padding:'7px 11px',fontSize:12.5}}
          onClick={()=>{ add(s); setOpen(false); }}>＋ {s}</button>)}</div>
      </Sheet>}
    </div>
  );
}

/* ============ "Ăn gì / Làm gì" random ============ */
const LUNCH_SPOTS=[
  {n:'Phở Bát Đàn',a:'49 Bát Đàn, Hoàn Kiếm',p:'40–60k'},
  {n:'Phở Thìn Lò Đúc',a:'13 Lò Đúc, Hai Bà Trưng',p:'50–70k'},
  {n:'Phở gà Nam Ngư',a:'Nam Ngư, Hoàn Kiếm',p:'40–55k'},
  {n:'Bún chả Hương Liên',a:'24 Lê Văn Hưu, Hai Bà Trưng',p:'45–70k'},
  {n:'Bún chả Đắc Kim',a:'1 Hàng Mành, Hoàn Kiếm',p:'50–80k'},
  {n:'Bún đậu mắm tôm Trung Hương',a:'Ngõ Phất Lộc, Hoàn Kiếm',p:'40–70k'},
  {n:'Bún bò Nam Bộ',a:'67 Hàng Điếu, Hoàn Kiếm',p:'40–60k'},
  {n:'Miến lươn Đông Thịnh',a:'87 Hàng Điếu, Hoàn Kiếm',p:'40–60k'},
  {n:'Bún thang Cầu Gỗ',a:'48 Cầu Gỗ, Hoàn Kiếm',p:'45–65k'},
  {n:'Bánh cuốn Bà Hoành',a:'66 Tô Hiến Thành, Hai Bà Trưng',p:'35–55k'},
  {n:'Bánh cuốn Thanh Vân',a:'12–14 Hàng Gà, Hoàn Kiếm',p:'35–55k'},
  {n:'Xôi Yến',a:'35B Nguyễn Hữu Huân, Hoàn Kiếm',p:'30–50k'},
  {n:'Cháo sườn Hàng Bồ',a:'Hàng Bồ, Hoàn Kiếm',p:'25–40k'},
  {n:'Bún cá Văn Tý',a:'7 Hàng Cá, Hoàn Kiếm',p:'40–55k'},
  {n:'Bún ngan Nhàn',a:'89 Hàng Bồ, Hoàn Kiếm',p:'45–70k'},
  {n:'Phở cuốn Ngũ Xã',a:'Ngũ Xã, Trúc Bạch',p:'50–80k'},
  {n:'Bún chả que tre',a:'Hàng Than, Ba Đình',p:'50–70k'},
  {n:'Cơm rang dưa bò',a:'quán cơm gần bạn',p:'40–60k'},
  {n:'Cơm gà xối mỡ',a:'quán phố cổ',p:'45–65k'},
  {n:'Cơm tấm sườn bì chả',a:'quán cơm tấm gần bạn',p:'45–65k'},
  {n:'Miến trộn / miến gà',a:'quán phố cổ',p:'35–55k'},
  {n:'Bún riêu cua / bún ốc',a:'quán quanh phố cổ',p:'30–50k'},
  {n:'Bánh mì pate + cà phê',a:'tiệm bánh mì gần bạn',p:'25–45k'},
  {n:'Nem nướng / bún nem',a:'quán phố cổ',p:'45–65k'},{n:'Bún chả Hương Liên',a:'24 Lê Văn Hưu, Hai Bà Trưng',p:'50–80k'},{n:'Cơm rang Chấn Hưng',a:'11 Hàng Buồm, Hoàn Kiếm',p:'50–90k'},{n:'Bún đậu Trung Hương',a:'49 Ngõ Phất Lộc, Hoàn Kiếm',p:'50–90k'},{n:'Miến lươn Đông Thịnh',a:'87 Hàng Điếu, Hoàn Kiếm',p:'40–60k'},{n:'Bún riêu cua Hàng Bạc',a:'11 Hàng Bạc, Hoàn Kiếm',p:'35–50k'},{n:'Cháo sườn Ngõ Huyện',a:'Ngõ Huyện, Hoàn Kiếm',p:'25–40k'},{n:'Xôi Yến',a:'35B Nguyễn Hữu Huân, Hoàn Kiếm',p:'30–60k'},{n:'Bún ốc bà Lương',a:'Khương Thượng, Đống Đa',p:'35–55k'},{n:'Phở gà Nguyệt',a:'5B Phủ Doãn, Hoàn Kiếm',p:'50–70k'},{n:'Bánh cuốn Bà Hoành',a:'66 Tô Hiến Thành, Hai Bà Trưng',p:'40–60k'},{n:'Bún bò Huế Ngự Bình',a:'109 Nguyễn Khuyến, Đống Đa',p:'45–65k'},{n:'Nem nướng Nha Trang',a:'Trần Đại Nghĩa, Hai Bà Trưng',p:'60–100k'},{n:'Cơm gà Hải Nam',a:'Tống Duy Tân, Hoàn Kiếm',p:'70–120k'},{n:'Bún chả que tre',a:'Hàng Than, Ba Đình',p:'50–80k'},{n:'Cơm tấm Cali',a:'Chuỗi, Hà Nội',p:'60–110k'}];
function FunPickers(){
  const [res,setRes]=useState(null);
  const [recipe,setRecipe]=useState(null);
  const [prefs,setPrefs]=useLocal('ju.funPrefs',{});
  const flatIdeas=[].concat.apply([],Object.keys(IDEA_SUGGEST).map(k=>IDEA_SUGGEST[k]));
  const hidden=store.get('ju.hiddenSpots',[])||[];
  const dishByName=(n)=>DISHES.find(d=>d.n===n);
  const foodSpots=HANOI_SPOTS.filter(s=>s.cat==='an'&&hidden.indexOf(s.n)<0);
  const nice=foodSpots.filter(s=>(s.budget==='u300'||s.budget==='u500'||s.budget==='o500')&&prefs[s.n]!==-1);
  const lunch=LUNCH_SPOTS.filter(s=>prefs[s.n]!==-1&&hidden.indexOf(s.n)<0);
  const toiDishes=MEAL_SUGGEST.toi.filter(d=>prefs[d]!==-1);
  const mapsUrl=(n,a)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(n+', '+(a||'')+', Hà Nội');
  const rate=(name,v)=>{ const n={...prefs}; n[name]= n[name]===v?0:v; if(!n[name]) delete n[name]; setPrefs(n); };
  const pickDish=(label,icon,pool,opt)=>{ if(!pool.length) return; setRes(Object.assign({label,icon,value:pool[Math.floor(Math.random()*pool.length)]},opt||{})); };
  const pickPlace=(label,icon,pool)=>{ const arr=pool.length?pool:lunch; if(!arr.length) return; const s=arr[Math.floor(Math.random()*arr.length)]; setRes({label,icon,value:s.n,place:s,food:true}); };
  return (
    <div className="card">
      <div className="hc-title">🎲 Phân vân quá?</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
        <button className="btn soft" onClick={()=>pickPlace('Ăn trưa ngoài (dưới 150k)','🍱',lunch)}>🍱 Trưa ngoài</button>
        <button className="btn soft" onClick={()=>pickDish('Ăn tối ở nhà','🍳',toiDishes,{food:true,cook:true})}>🍳 Tối ở nhà</button>
        <button className="btn soft" onClick={()=>pickPlace('Ăn nhà hàng (cuối tuần)','🍽️',nice)}>🍽️ Nhà hàng</button>
        <button className="btn soft" onClick={()=>pickDish('Hôm nay làm gì','💡',flatIdeas)}>💡 Làm gì?</button>
      </div>
      {res && <div className="center" style={{marginTop:10}}>
        <div className="muted" style={{fontSize:12.5}}>{res.label}:</div>
        <div className="row" style={{justifyContent:'center',gap:6,marginTop:2,flexWrap:'wrap'}}>
          <span style={{fontSize:18,fontWeight:800}}>{res.icon} {res.value}</span>
          {res.food && <button title="Thích" aria-label="Thích món này" className="tapmin" onClick={()=>rate(res.value,1)} style={{opacity:prefs[res.value]===1?1:.4}}><Ic n="thich" size={16}/></button>}
          {res.food && <button title="Không thích (sẽ ít gợi ý lại)" onClick={()=>rate(res.value,-1)} aria-label="Không thích món này" className="tapmin" style={{opacity:prefs[res.value]===-1?1:.4}}><Ic n="khongthich" size={16}/></button>}
        </div>
        {res.place && <div className="muted" style={{fontSize:12.5,marginTop:3}}>📍 {res.place.area||res.place.a}{res.place.p?' · 💵 '+res.place.p+((''+res.place.p).indexOf('/')<0?'/người':''):''}</div>}
        {(res.place||res.cook) && <div className="row" style={{justifyContent:'center',gap:8,marginTop:6}}>
          {res.place && <a className="pill" style={{textDecoration:'none'}} href={mapsUrl(res.value,res.place.area||res.place.a)} target="_blank" rel="noreferrer">🗺️ Chỉ đường</a>}
          {res.cook && <button className="pill" onClick={()=>setRecipe(res.value)}>📖 Cách nấu</button>}
        </div>}
      </div>}
      {recipe && (()=>{ const d=dishByName(recipe); return (
        <Sheet title={recipe} onClose={()=>setRecipe(null)}>
          {d && (d.ing||[]).length>0 && <><b style={{fontSize:14}}>Nguyên liệu (2 người):</b>
            <ul style={{margin:'6px 0 12px',paddingLeft:18,fontSize:14,lineHeight:1.6}}>{d.ing.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
          {d ? <><b style={{fontSize:14}}>Cách làm:</b>
            <div style={{fontSize:14,marginTop:6,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{d.r}</div></>
            : <div className="muted" style={{fontSize:12.5}}>Chưa có công thức sẵn cho món này — xem video hướng dẫn bên dưới nhé.</div>}
          <a className="btn" style={{display:'block',textAlign:'center',marginTop:14,textDecoration:'none'}}
            href={'https://www.youtube.com/results?search_query='+encodeURIComponent('cách làm '+recipe)} target="_blank" rel="noreferrer">🎬 Xem video hướng dẫn</a>
        </Sheet>); })()}
    </div>
  );
}

/* ============ Nhắc nhở hôm nay ============ */
function Reminders({setup,go}){
  const [events]=useLocal('ju.events',[]);
  const [dates]=useLocal('ju.dates',[]);
  const [chores]=useLocal('ju.chores',[]);
  const [shop]=useLocal('ju.shop',[]);
  const [period]=useLocal('ju.period',null);
  const list=[];
  events.forEach(e=>{ const d=daysFromToday(e.date); const lead=e.remind!=null?e.remind:3; if(d!=null && d>=0 && d<=lead) list.push({icon:'📅',text:e.title,d}); });
  dates.forEach(e=>{ const d=dnext(e); const lead=e.remind!=null?e.remind:3; if(d!=null && d<=lead) list.push({icon:e.icon||'🎂',text:e.title,d}); });
  if(setup.loveDate){ const d=daysToNext(setup.loveDate); if(d<=3) list.push({icon:'💗',text:'Kỷ niệm ngày yêu',d}); }
  if(setup.weddingDate){ const d=daysToNext(setup.weddingDate); if(d<=3) list.push({icon:'💍',text:'Kỷ niệm ngày cưới',d}); }
  const pn=periodNext();
  if(pn){ if(pn.onPeriod) list.push({icon:'🌸',text:'Đang kỳ đèn đỏ (ngày '+pn.dayOfPeriod+') — giữ ấm nhé',d:0}); else if(pn.days<=3) list.push({icon:'🌸',text:'Kỳ kinh dự kiến — chuẩn bị',d:pn.days}); }
  try{ upcomingSpiritual(3).forEach(h=>{ if(h.d<=2) list.push({icon:h.icon,text:h.name+' — sửa lễ/khấn',d:h.d}); }); }catch(e){}
  list.sort((a,b)=>a.d-b.d);
  const choreLeft=chores.filter(c=>!c.done).length;
  const shopLeft=shop.filter(s=>!s.done).length;
  if(list.length===0 && choreLeft===0 && shopLeft===0) return null;
  return (
    <div className="card" style={{borderLeft:'4px solid var(--primary)'}}>
      <div className="hc-title">🔔 Hôm nay cần nhớ</div>
      {list.map((r,i)=>(
        <div key={i} className="row" onClick={()=>go('us')} style={{cursor:'pointer',marginTop:6,fontSize:14}}>
          <span>{r.icon}</span><span className="grow">{r.text}</span>
          <span className="pill">{r.d===0?'Hôm nay!':r.d===1?'Ngày mai':'còn '+r.d+' ngày'}</span>
        </div>
      ))}
      {(choreLeft>0||shopLeft>0) && <div className="row" style={{marginTop:10,gap:8,flexWrap:'wrap'}}>
        {choreLeft>0 && <button className="pill" onClick={()=>go('us')}>🧹 {choreLeft} việc nhà chưa xong</button>}
        {shopLeft>0 && <button className="pill" onClick={()=>go('us')}>🛒 {shopLeft} món cần mua</button>}
      </div>}
    </div>
  );
}

/* ============ Ngày này năm ngoái ============ */
/* MỘT phép gom duy nhất cho cả thẻ trang chủ lẫn màn đầy đủ. Trước 15/08/2026 thẻ
   trang chủ có phép gom riêng chỉ đọc 03 khoá (kỷ niệm, ảnh, lời nhắn); giữ hai bản
   thì thêm nguồn ở bản này mà bản kia không theo, và lệch kiểu đó KHÔNG phát ra lỗi
   nào — thẻ và màn chỉ đơn giản là kể hai câu chuyện khác nhau về cùng một ngày.

   ⛔ CỐ Ý BỎ QUA `ju.intimacy` và `ju.docs`: một cái là chuyện riêng tư có lớp khoá
      riêng, một cái là giấy tờ mã hoá đầu-cuối (phần chữ nằm trong `enc`, đằng nào
      cũng không đọc ra được). Màn này mở ra là hiện hết ngay, không có bước xác nhận
      nào, nên thêm nguồn mới phải cân nhắc đúng hai khoá đó trước.
   ⚠ CHỈ ĐỌC bằng `store.get`, cố ý KHÔNG dùng `useLocal`: `useLocal` ghi ngược lại
      localStorage rồi gọi `Cloud.schedulePush()` ngay khi gắn, tức mở màn xem lại kỷ
      niệm là đẩy 12 lượt lên đám mây. Thay đổi từ máy kia bắt bằng `ju:remote`. */
function otdNgayTu(ms){ if(!ms) return ''; const d=new Date(ms); if(isNaN(d.getTime())) return ''; return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function otdTatCa(people){
  const out=[];
  const ten=(w)=> w==='both'?'Cả hai':((people&&people[w]&&people[w].name)||'');
  const mang=(k)=>{ const v=store.get(k,[]); return Array.isArray(v)?v:[]; };
  const doiTuong=(k)=>{ const v=store.get(k,{}); return (v&&typeof v==='object'&&!Array.isArray(v))?v:{}; };
  /* Bỏ mục không có ngày HOẶC không có chữ để hiện — dòng trống lẫn vào đây thì
     người xem tưởng dữ liệu hỏng, mà đếm số kỷ niệm vẫn cộng thêm một. */
  const them=(d,it)=>{ const s=String(d||''); if(s.length<10) return; if(!String((it&&it.title)||'').trim()) return; out.push({...it,d:s.slice(0,10)}); };
  const themMs=(ms,it)=>them(otdNgayTu(ms),it);

  mang('ju.timeline').forEach(x=>them(x.date,{icon:x.icon||'🕰️',kind:'Cột mốc',title:x.title,note:x.note,photos:x.photo?[x.photo]:[]}));
  mang('ju.photos').forEach(x=>them(x.date,{icon:'📷',kind:'Ảnh chung',title:x.caption||'Ảnh của hai đứa',photos:[x]}));
  mang('ju.notes').forEach(x=>themMs(x.createdAt,{icon:'💌',kind:'Lời nhắn'+(ten(x.by)?' · '+ten(x.by):''),title:x.text}));
  mang('ju.checkins').forEach(x=>them(x.date,{icon:x.type==='food'?'🍜':'☕',kind:'Check-in quán',title:x.name,note:x.review,photos:photoList(x)}));
  mang('ju.events').forEach(x=>them(x.date,{icon:'📅',kind:'Sự kiện',title:x.title,note:x.note}));
  mang('ju.cookLogs').forEach(x=>them(x.date,{icon:'🍳',kind:'Bữa nhà nấu',title:(ten(x.cook)?ten(x.cook)+' nấu':'Đã nấu')+(x.dish?' — '+x.dish:'')}));
  mang('ju.movies').forEach(x=>themMs(x.watchedAt,{icon:'🍿',kind:'Phim đã xem',title:x.title,note:x.where}));
  mang('ju.childDiary').forEach(x=>them(x.date,{icon:'📔',kind:'Điều đầu tiên của con',title:x.text}));
  mang('ju.childWords').forEach(x=>them(x.date,{icon:'🗣️',kind:'Con nói được từ mới',title:x.word}));
  mang('ju.expenses').forEach(x=>{ const dm=EXPENSE_CATS.find(z=>z.k===x.cat);
    them(x.date,{icon:dm?dm.icon:'🧾',kind:'Chi tiêu'+(dm?' · '+dm.label:''),title:VND(x.amount),note:x.note}); });
  const mood=doiTuong('ju.mood');
  Object.keys(mood).forEach(k=>{ const m=mood[k]||{};
    const cau=['a','b'].filter(w=>m[w]||m[w+'n']).map(w=>[(m[w]||''),ten(w),(m[w+'n']?'· '+m[w+'n']:'')].filter(Boolean).join(' ')).join('   ');
    them(k,{icon:'🙂',kind:'Tâm trạng',title:cau.trim()});
  });
  const qa=doiTuong('ju.qa');
  Object.keys(qa).forEach(k=>{ const q=qa[k]||{};
    const tl=['a','b'].filter(w=>q[w]).map(w=>ten(w)+': '+q[w]).join('\n');
    if(tl) them(k,{icon:'❓',kind:'Câu hỏi mỗi ngày',title:q.q||'Câu hỏi hôm đó',note:tl});
  });
  return out;
}
/* Lọc những mục rơi đúng ngày-tháng của `iso` nhưng ở NĂM TRƯỚC đó, gom theo năm, mới → cũ. */
function otdNhom(tatCa,iso){
  const s=String(iso||''); if(s.length<10) return [];
  const md=s.slice(5,10), yy=Number(s.slice(0,4)); if(!yy) return [];
  const theoNam={};
  tatCa.forEach(x=>{ if(x.d.slice(5,10)!==md) return; const y=Number(x.d.slice(0,4)); if(!y||y>=yy) return; (theoNam[y]=theoNam[y]||[]).push(x); });
  return Object.keys(theoNam).map(Number).sort((a,b)=>b-a).map(y=>({y,cach:yy-y,items:theoNam[y]}));
}
/* Ngày gần nhất còn có kỷ niệm, dò vòng quanh năm — dùng khi ngày đang xem trống trơn,
   để màn rỗng vẫn có một đường đi tiếp thay vì bắt bấm mò từng ngày. */
function otdGanNhat(tatCa,iso){
  const s=String(iso||''); if(s.length<10) return null;
  const yy=Number(s.slice(0,4)); if(!yy) return null;
  const co=new Set(); tatCa.forEach(x=>{ if(Number(x.d.slice(0,4))<yy) co.add(x.d.slice(5,10)); });
  if(!co.size) return null;
  const goc=new Date(yy+'-'+s.slice(5,10)+'T00:00:00'); if(isNaN(goc.getTime())) return null;
  for(let i=1;i<=366;i++) for(const b of [1,-1]){
    const d=new Date(goc.getTime()); d.setDate(d.getDate()+i*b);
    const md=pad(d.getMonth()+1)+'-'+pad(d.getDate());
    if(!co.has(md)) continue;
    const ra=yy+'-'+md;                             /* giữ NĂM ĐANG XEM, chỉ đổi ngày-tháng */
    /* 29/02 của năm không nhuận: ⛔ ĐỪNG kiểm bằng `isNaN` — đo 15/08/2026, V8 KHÔNG trả
       ngày hỏng mà LĂN `2027-02-29` sang `2027-03-01`, nên chốt kiểu đó chết câm và nút
       vẫn mời "xem ngày 29/02" để rồi mở ra một ngày trống. Phải so quay vòng. */
    const kt=new Date(ra+'T00:00:00');
    if(isNaN(kt.getTime())||pad(kt.getMonth()+1)+'-'+pad(kt.getDate())!==md) continue;
    return {iso:ra,cach:i*b};
  }
  return null;
}
const otdNhanNam=(cach)=> cach===1?'Năm ngoái':(cach+' năm trước');
const otdNgayThang=(iso)=> fmtDateVN(iso).slice(0,5);

/* Thẻ trang chủ — tóm tắt 04 dòng, chạm là mở màn đầy đủ. */
function OnThisDay({people,go}){
  const nhom=useMemo(()=>otdNhom(otdTatCa(people),todayISO()),[people]);
  if(!nhom.length) return null;
  const tong=nhom.reduce((s,g)=>s+g.items.length,0);
  const hien=[]; nhom.forEach(g=>g.items.forEach(it=>{ if(hien.length<4) hien.push({...it,cach:g.cach}); }));
  /* Ghi `ju.usNav` TRƯỚC rồi mới chuyển tab: UsTab đọc khoá này ở lượt gắn đầu tiên,
     mà tab 🏡 Nhà mình chỉ được vẽ khi đang mở nên nó gắn lại mỗi lần chuyển sang. */
  const moMuc=()=>{ store.set('ju.usNav',{g:'plan',s:'onthisday'}); go&&go('us'); };
  return (
    <div className="card" onClick={moMuc} style={{cursor:'pointer',background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
      <div className="row"><span className="hc-title">📆 Ngày này năm ngoái</span><span className="grow"></span>
        <span className="hc-act">{tong} kỷ niệm ›</span></div>
      {hien.map((it,i)=>(
        <div key={i} className="row" style={{marginTop:8,gap:8,alignItems:'flex-start'}}>
          <span style={{fontSize:18}}>{it.icon}</span>
          <div className="grow" style={{fontSize:14}}>{it.title} <span className="muted">· {otdNhanNam(it.cach).toLowerCase()}</span></div>
        </div>
      ))}
      {tong>hien.length && <div className="muted" style={{fontSize:12,marginTop:8}}>còn {tong-hien.length} kỷ niệm nữa — chạm để xem hết ›</div>}
    </div>
  );
}

/* Màn đầy đủ: xem được MỌI ngày, không chỉ hôm nay. */
function OnThisDayTab({people}){
  const [iso,setIso]=useState(todayISO());
  const [nhip,setNhip]=useState(0);
  const [xem,setXem]=useState(null);
  useEffect(()=>{ const h=()=>setNhip(t=>t+1); window.addEventListener('ju:remote',h); return ()=>window.removeEventListener('ju:remote',h); },[]);
  const tatCa=useMemo(()=>otdTatCa(people),[people,nhip]);
  const nhom=useMemo(()=>otdNhom(tatCa,iso),[tatCa,iso]);
  const tong=nhom.reduce((s,g)=>s+g.items.length,0);
  const gan=tong?null:otdGanNhat(tatCa,iso);
  const hnay=iso===todayISO();
  const doiNgay=(b)=>{ const d=new Date(iso+'T00:00:00'); if(isNaN(d.getTime())) return;
    d.setDate(d.getDate()+b); setIso(d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())); };
  const chiaSe=async()=>{
    const dong=[];
    nhom.forEach(g=>{ dong.push('— '+otdNhanNam(g.cach)+' ('+fmtDateVN(g.y+'-'+iso.slice(5))+')');
      g.items.forEach(it=>dong.push('   '+it.icon+' '+it.title)); });
    await shareText({title:'Ngày này năm ngoái',text:'📆 Ngày '+otdNgayThang(iso)+' của hai đứa\n'+dong.join('\n')});
  };
  return (
    <div>
      <div className="card">
        <div className="row" style={{gap:6}}>
          <button className="btn sm soft" onClick={()=>doiNgay(-1)} aria-label="Ngày trước">‹</button>
          <input className="inp grow" type="date" value={iso} style={{textAlign:'center'}}
            onChange={e=>{ if(e.target.value) setIso(e.target.value); }}/>
          <button className="btn sm soft" onClick={()=>doiNgay(1)} aria-label="Ngày sau">›</button>
        </div>
        <div className="row" style={{marginTop:8,gap:8}}>
          <span className="grow muted" style={{fontSize:12.5}}>
            {hnay?'Hôm nay · ':''}ngày {otdNgayThang(iso)} · {tong? (tong+' kỷ niệm ở '+nhom.length+' năm trước') : 'những năm trước chưa ghi gì'}
          </span>
          {!hnay && <button className="btn sm soft" onClick={()=>setIso(todayISO())}>Hôm nay</button>}
          {tong>0 && <button className="btn sm soft" onClick={chiaSe}>↗ Chia sẻ</button>}
        </div>
      </div>

      {tong===0 && (
        <div className="empty"><span className="big">📆</span>
          Ngày {otdNgayThang(iso)} những năm trước chưa có gì được ghi lại. Ghi một cột mốc, thả một tấm ảnh hay một lời nhắn hôm nay — sang năm mở lại mục này là thấy.
          {gan && <div style={{marginTop:12}}>
            <button className="btn sm" onClick={()=>setIso(gan.iso)}>📆 Xem ngày {otdNgayThang(gan.iso)} — ngày gần nhất có kỷ niệm</button>
          </div>}
        </div>
      )}

      {nhom.map(g=>(
        <div key={g.y}>
          <div className="hc-title" style={{margin:'16px 16px 8px'}}>{otdNhanNam(g.cach)}
            <span className="hc-act" style={{marginLeft:6}}>{fmtDateVN(g.y+'-'+iso.slice(5))} · {g.items.length} mục</span></div>
          {g.items.map((it,i)=>(
            <div key={i} className="item">
              <PhotoShow photos={it.photos} big onView={j=>setXem({photos:it.photos,i:j,title:it.icon+' '+it.title})}/>
              <div className="it-top"><h4>{it.icon} {it.title}</h4></div>
              {it.note && <div className="it-note">{it.note}</div>}
              <div className="it-meta"><span className="muted" style={{fontSize:12.5}}>{it.kind}</span></div>
            </div>
          ))}
        </div>
      ))}
      <PhotoLightbox photos={xem&&xem.photos} index={xem&&xem.i} title={xem&&xem.title} onClose={()=>setXem(null)}/>
      <div className="muted center" style={{fontSize:11,margin:'14px 16px 8px',lineHeight:1.6}}>
        Gom từ cột mốc, ảnh chung, lời nhắn, check-in quán, sự kiện, tâm trạng, câu hỏi mỗi ngày,
        bữa nhà nấu, chi tiêu, phim đã xem và nhật ký của con. Mục Riêng tư và Giấy tờ cố ý không đưa vào đây.
      </div>
    </div>
  );
}

/* ============ Tâm trạng + lịch 14 ngày ============ */
function MoodCard({people,me}){
  const [mood,setMood]=useLocal('ju.mood',{});
  const key=todayISO();
  const today=mood[key]||{};
  const [note,setNote]=useState('');
  useEffect(()=>{ setNote((mood[key]||{})[me+'n']||''); },[key,me]);
  const setMyMood=(emo)=> setMood({...mood,[key]:{...(mood[key]||{}),[me]:emo}});
  const saveNote=()=> setMood({...mood,[key]:{...(mood[key]||{}),[me+'n']:note.trim()}});
  const days=[];
  for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); days.push({k,day:d.getDate(),m:mood[k]||{}}); }
  const [showHist,setShowHist]=useState(false);
  const mode7=(who)=>{ const c={}; days.slice(-7).forEach(d=>{ const m=d.m[who]; if(m) c[m]=(c[m]||0)+1; }); const e=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; return e?{m:e[0],n:e[1]}:null; };
  const ia=mode7('a'), ib=mode7('b');
  return (
    <div className="card">
      <div className="row" style={{gap:8}}>
        <span className="hc-title">🙂 Tâm trạng</span>
        <span className="muted" style={{fontSize:12.5}}>{people.a.name} <b style={{fontSize:16}}>{today.a||'—'}</b>{today.an?' · '+today.an:''}</span>
        <span className="muted" style={{fontSize:12.5}}>{people.b.name} <b style={{fontSize:16}}>{today.b||'—'}</b>{today.bn?' · '+today.bn:''}</span>
        <span className="grow"></span>
        <button className="muted tapmin" style={{fontSize:11}} onClick={()=>setShowHist(v=>!v)}>📅 14 ngày</button>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:8}}>
        {MOODS.map(m=><button key={m} onClick={()=>setMyMood(m)} aria-label={'Tâm trạng '+TEN_MOOD[m]} title={TEN_MOOD[m]} className="tapmin"
          style={{fontSize:18,width:33,height:33,borderRadius:9,lineHeight:1,
            background:today[me]===m?'var(--chip)':'var(--bg)',
            border:today[me]===m?'1.5px solid var(--primary)':'1px solid var(--line)'}}>{m}</button>)}
      </div>
      {today[me] && <input className="inp" style={{marginTop:7,padding:'7px 11px',fontSize:12.5}} placeholder="Vì sao? (tuỳ chọn)" value={note}
        onChange={e=>setNote(e.target.value)} onBlur={saveNote} onKeyDown={e=>{ if(e.key==='Enter') saveNote(); }}/>}
      {showHist && (ia||ib) && <div className="muted" style={{fontSize:11,marginTop:9}}>📊 Tuần này: {ia?`${people.a.name} hay ${ia.m} (${ia.n}/7)`:''}{ia&&ib?' · ':''}{ib?`${people.b.name} hay ${ib.m} (${ib.n}/7)`:''}</div>}
      {showHist && <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:4,marginTop:10}}>
        {days.map(d=>(
          <div key={d.k} style={{flex:'0 0 auto',textAlign:'center',minWidth:24,background:d.k===key?'var(--chip)':'transparent',borderRadius:8,padding:'3px 1px'}}>
            <div style={{fontSize:15,lineHeight:1.15}}>{d.m.a||'·'}</div>
            <div style={{fontSize:15,lineHeight:1.15}}>{d.m.b||'·'}</div>
            <div className="muted" style={{fontSize:9}}>{d.day}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

/* ============ Kỷ niệm ngày cưới ============ */

/* ============ Thói quen chung ============ */
function HabitTracker(){
  const [habits,setHabits]=useLocal('ju.habits',[]);
  const [t,setT]=useState('');
  const key=todayISO();
  const add=()=>{ if(!t.trim())return; setHabits(prev=>[...prev,{id:uid(),name:t.trim(),log:{}}]); setT(''); };
  const toggle=(id)=>setHabits(prev=>prev.map(h=>h.id===id?{...h,log:{...(h.log||{}),[key]:!(h.log||{})[key]}}:h));
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setHabits(prev=>prev.filter(h=>h.id!==id)); } };
  const streak=(h)=>streakOf(d=>!!(h.log||{})[d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())]);
  return (
    <div className="card">
      <div className="row"><span className="hc-title">✅ Thói quen chung</span><span className="grow"></span><span className="hc-act">{fmtDateVN(key)}</span></div>
      {habits.length===0 && <div className="muted" style={{fontSize:12.5,margin:'8px 0'}}>Thêm thói quen cả hai cùng giữ: uống đủ nước, tập thể dục, đọc sách, đi ngủ sớm…</div>}
      {habits.map(h=>{ const done=!!(h.log||{})[key]; const st=streak(h); return (
        <div key={h.id} className="row" style={{padding:'6px 0',borderBottom:'1px solid var(--line)'}}>
          <button onClick={()=>toggle(h.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={done?'dadanh':'chuadanh'} size={18}/>}</button>
          <span className="grow" style={{fontSize:14,textDecoration:done?'line-through':'none',opacity:done?.65:1}}>{h.name}</span>
          {st>1 && <span className="pill">🔥 {st}</span>}
          <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(h.id)} style={{marginLeft:6}}><Ic n="dong" size={15}/></button>
        </div>
      ); })}
      <div className="row" style={{gap:8,marginTop:8}}>
        <input className="inp grow" placeholder="Thêm thói quen…" value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <button className="btn sm" onClick={add}>＋</button>
      </div>
    </div>
  );
}

/* ============ Cài app + chia sẻ link ============ */
function InstallShare(){
  const [pe,setPe]=useState(null); const [done,setDone]=useState(false);
  useEffect(()=>{ const h=(e)=>{ e.preventDefault(); setPe(e); }; window.addEventListener('beforeinstallprompt',h); return ()=>window.removeEventListener('beforeinstallprompt',h); },[]);
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  if(standalone||done) return null;
  const install=async()=>{ if(pe){ pe.prompt(); try{ await pe.userChoice; }catch(e){} setPe(null); } else alert('Trên điện thoại: mở menu trình duyệt → “Thêm vào màn hình chính” để cài Just Us như một app 💗'); };
  const share=async()=>{ const url=location.href.split('#')[0];
    const r=await shareText({title:'Just Us — Của riêng hai đứa',text:'Không gian riêng của hai đứa mình 💗',url});
    if(r==='copy') alert('Đã copy link — gửi cho nửa kia nhé!');
    else if(r==='loi') alert('Không chia sẻ được — copy tay đường dẫn trên thanh địa chỉ nhé.'); };
  return (
    <div className="card" style={{display:'flex',gap:8,alignItems:'center'}}>
      <span style={{fontSize:20}}>📲</span>
      <span className="grow" style={{fontSize:12.5}}>Cài app & gửi link cho nửa kia</span>
      <button className="btn sm soft" onClick={share}>🔗 Link</button>
      <button className="btn sm" onClick={install}>Cài app</button>
      <button className="muted tapmin" aria-label="Xoá" onClick={()=>setDone(true)} style={{marginLeft:2}}><Ic n="dong" size={15}/></button>
    </div>
  );
}

/* ============ Đang cáu / lo lắng ============ */
function AngerHelper(){
  const [res,setRes]=useState(null);
  const pick=(label,icon,pool)=> setRes({label,icon,pool,value:pool[Math.floor(Math.random()*pool.length)]});
  return (
    <div className="card">
      <div className="row"><span className="hc-title">😤 Đang cáu / lo lắng?</span></div>
      <div className="hc-body" style={{marginTop:3}}>Thử một việc nhỏ để dịu lại 💗</div>
      <div className="row" style={{gap:8,marginTop:8}}>
        <button className="btn soft grow" onClick={()=>pick('Để hạ hoả','🧯',CALM_ANGRY)}>😤 Bực mình</button>
        <button className="btn soft grow" onClick={()=>pick('Để bớt lo','🌿',CALM_ANXIOUS)}>😟 Lo lắng</button>
      </div>
      {res && <div className="center" style={{marginTop:10}}>
        <div className="muted" style={{fontSize:12.5}}>{res.label}:</div>
        <div style={{fontSize:16,fontWeight:700,marginTop:3,lineHeight:1.45}}>{res.icon} {res.value}</div>
        <button className="btn sm soft" style={{marginTop:8}} onClick={()=>pick(res.label,res.icon,res.pool)}>🔄 Cách khác</button>
      </div>}
    </div>
  );
}

/* ============ HOME ============ */
const WHATS_NEW=[
  {d:'2026-08-08',ic:'🖼️',t:'Thêm ảnh quán nay có 2 nút: 📷 mở đủ Thư viện/Máy ảnh (1 ảnh mỗi lần), 🖼️ chọn nhiều ảnh một lượt. Trước đó máy Android ẩn mất app Thư viện khi bảng chọn ở chế độ nhiều ảnh.'},
  {d:'2026-08-08',ic:'📷',t:'Cafe &amp; quán ăn thêm được NHIỀU ẢNH: cả "Quán &amp; Món" và "Check-in ảnh" (Hẹn hò) giờ chọn một lần nhiều ảnh, ảnh đầu hiện to, còn lại thành dải nhỏ — chạm để xem lớn và lật qua lại.'},
  {d:'2026-08-08',ic:'📋',t:'Mỗi quán lưu được riêng "Ảnh menu / bảng giá" — chụp tờ menu một lần, lần sau khỏi đoán giá. Ảnh cũ (1 ảnh) tự chuyển sang danh sách, không mất.'},
  {d:'2026-07-08',ic:'🔠',t:'Tự chọn font chữ Trang chủ: vào Hồ sơ → 🔤 Font chữ trang chủ, chọn 1 trong 6 kiểu (Be Vietnam Pro, Nunito, Quicksand, Montserrat, Lora, Hệ thống) — áp ngay, số ngày vẫn giữ serif.'},
  {d:'2026-07-08',ic:'🔤',t:'Chỉnh lại chữ toàn app: dùng font Be Vietnam Pro (thiết kế cho tiếng Việt), thống nhất cỡ chữ &amp; độ đậm giữa các mục cho gọn gàng, dễ đọc hơn.'},
  {d:'2026-07-08',ic:'🔢',t:'Tâm linh thêm "Thần số học": nhập ngày sinh ra số chủ đạo (đường đời) + điểm mạnh/lưu ý, số ngày sinh và năm cá nhân của năm nay.'},
  {d:'2026-07-08',ic:'🔮',t:'Tâm linh có thêm "Đọc lá số tử vi": nhập ngày sinh để xem can chi · con giáp · bản mệnh (nạp âm), tuổi tam hợp/tứ hành xung, màu &amp; hướng hợp; kèm nút lập lá số đầy đủ.'},
  {d:'2026-07-08',ic:'🎨',t:'Trang chủ khoác áo mới — phong cách tối giản thanh lịch: số ngày bên nhau kiểu chữ serif, các mục ngăn bằng đường kẻ mảnh, nhiều khoảng thở.'},
  {d:'2026-07-08',ic:'🧹',t:'Trang chủ gọn hơn: ô "Mới cập nhật" mặc định thu gọn (bấm mở ra xem vài mục, "Xem thêm" xem hết). Chuyển "Cài app & gửi link cho nửa kia" vào Hồ sơ.'},
  {d:'2026-07-08',ic:'🗂️',t:'Nhóm mới 📦 Nhà & Kho (trong Tụi mình): ⏳ Hạn dùng (đồ ăn/thuốc/mỹ phẩm — đếm ngày, nhắc trước khi hết hạn) · 📦 Cất giữ (đồ trái mùa/kho + vị trí + ảnh, tìm nhanh khỏi quên chỗ) · 🗂️ Giấy tờ (CCCD/hộ chiếu/sổ đỏ… kèm nhiều ảnh, số hiệu, ngày hết hạn, nơi cất).'},
  {d:'2026-07-08',ic:'📷',t:'Cất giữ & Giấy tờ: thêm được ảnh (tự nén cho nhẹ máy, bấm phóng to), và dán "🔗 Link Google Photos" để mở album ra xem — khỏi copy ảnh.'},
  {d:'2026-07-08',ic:'🗓️',t:'Trang chủ có thẻ "Bây giờ nên làm" — hiện việc đang làm ngay lúc này theo lịch sinh hoạt (2 cột bố/mẹ) + việc tiếp theo.'},
  {d:'2026-07-08',ic:'⏰',t:'Lịch sinh hoạt: tách 2 cột bố / mẹ, mỗi mốc bật 🔔 để được nhắc đúng giờ; nút 🖨️ In xuất file Word (.docx) để sửa/in.'},
  {d:'2026-07-08',ic:'📜',t:'Thêm mục "Quy tắc gia đình" (Tụi mình → Hàng ngày): giao ước của nhà, 67 gợi ý theo 10 nhóm, đánh dấu "đã cam kết", xuất file Word.'},
  {d:'2026-07-08',ic:'✅',t:'Việc cần làm: mỗi việc thêm được việc nhỏ (subtask) và bình luận. Việc nhà có bộ gợi ý chia theo khu vực. Việc gia đình có mẫu checklist thủ tục giấy tờ (hộ khẩu, khai sinh, hộ chiếu…).'},
  {d:'2026-07-08',ic:'🧩',t:'Vấn đề & gợi ý (Lịch sinh hoạt): lời khuyên luôn hiện sẵn, lưu được chủ đề thường gặp để theo dõi, bổ sung lên 24 chủ đề.'},
  {d:'2026-07-05',ic:'🧠',t:'Thêm "Đố kiến thức gia đình" — nút 🧠 trên thanh trên cùng (cạnh 🔎): trắc nghiệm rút từ mọi bài viết trong app (vợ chồng · nuôi con · giao tiếp · tâm linh · sức khỏe · bếp núc · tiền nong), có kỷ lục điểm.'},
  {d:'2026-07-05',ic:'✨',t:'Trả bài: bổ sung nhiều dữ liệu — thêm mẹo giữ lửa, câu hỏi, Thật/Thách, câu hỏi nóng dần, thử thách tuần, muốn thử; +4 bài kiến thức (massage đôi · gần gũi khi mang thai · sau "cuộc yêu" · khi trục trặc) + 2 bài sức khỏe nam (thực phẩm · kéo dài & kiểm soát).'},
  {d:'2026-07-05',ic:'🧘',t:'Trả bài → Kiến thức: các tư thế quan hệ nay có hình minh hoạ (vẽ tế nhị, đơn giản).'},
  {d:'2026-07-05',ic:'💗',t:'Trả bài thêm nhiều: tab 🎲 Chơi (Thật/Thách · xúc xắc · câu hỏi nóng dần), tab 📅 Hẹn hò (mẹo giữ lửa mỗi ngày · đặt đêm hẹn · tạo không khí), dự đoán "ngày vợ dễ hứng khởi" theo chu kỳ, góc sức khỏe nam + bài tư thế; noti báo chồng khi sắp tới ngày vợ hứng khởi.'},
  {d:'2026-07-05',ic:'🗂️',t:'Hồ sơ gọn hơn: mỗi mục có nút gập/mở (mặc định thu gọn) — dùng "Mở tất cả" trong 🎛️ Giao diện nếu muốn xem hết. Bỏ mục "Nguồn thời tiết".'},
  {d:'2026-07-05',ic:'💛',t:'Trả bài → tab "Cảm xúc": từ chu kỳ, app dự đoán ngày vợ dễ nhạy cảm (tiền kinh nguyệt / đèn đỏ) + gợi ý cách quan tâm. Mục kế hoạch thụ thai tạm ẩn (bật lại được).'},
  {d:'2026-07-05',ic:'💗',t:'"Trả bài" là menu lớn riêng trong Tụi mình — 6 tab: Nhật ký · Tín hiệu tế nhị · Muốn thử · Cảm xúc · Kiến thức vợ chồng · Riêng tư (khoá mã)'},
  {d:'2026-07-05',ic:'🆕',t:'Trang chủ có ô "Mới cập nhật" điểm các thay đổi mới nhất'},
  {d:'2026-07-04',ic:'🔀',t:'Đổi thứ tự mục trong mọi menu + Mở/thu gọn tất cả mục dài (trong Hồ Sơ → Giao diện)'},
  {d:'2026-07-04',ic:'💵',t:'Tiền nong: "Money Lover" tự đồng bộ chi tiêu chung nhà + Sóc từ VíNhà; thêm mục Ngân sách'},
  {d:'2026-07-04',ic:'🔔',t:'Thông báo: nhắc ngày yêu nhau, việc tới hạn, món nấu hôm nay, ngân sách, gửi lời yêu thương, mùng 1·rằm·lễ'},
  {d:'2026-07-04',ic:'🎛️',t:'Menu đổi sang kiểu lưới ô gọn (bỏ cuộn ngang); các mục dài giờ gập/mở được'},
  {d:'2026-07-03',ic:'🧾',t:'Chi tiêu: ghi khoản chi theo danh mục + đặt ngân sách tháng, cảnh báo sắp/vượt'},
  {d:'2026-07-03',ic:'🍱',t:'Thực đơn: thêm bữa sáng mỗi ngày + gợi ý món hợp sức khỏe cả nhà'},
  {d:'2026-07-02',ic:'🌱',t:'Nuôi con: hướng dẫn dạy bé kỹ năng tự túc (ăn thìa, bỏ bỉm…) + tick khi bé làm được'},
  {d:'2026-07-02',ic:'🩺',t:'Sức khỏe: theo dõi bệnh nền + lưu ý sinh hoạt/ăn uống cho từng thành viên'},
  {d:'2026-07-02',ic:'🍲',t:'Tâm linh: mâm cỗ ngày giỗ & Tết kèm công thức'},
];
function WhatsNewCard(){
  const [seen,setSeen]=useState(()=>store.get('ju.whatsNewSeen','')||'');
  const [open,setOpen]=useState(false);
  const [all,setAll]=useState(false);
  const PEEK=3;
  const newest=WHATS_NEW[0]?WHATS_NEW[0].d:'';
  const nUnseen=WHATS_NEW.filter(x=>x.d>seen).length;
  const markSeen=()=>{ store.set('ju.whatsNewSeen',newest); setSeen(newest); };
  const list=!open?[]:(all?WHATS_NEW:WHATS_NEW.slice(0,PEEK));
  return (
    <div className="card" style={{margin:'12px 14px 0',borderColor:nUnseen>0?'var(--primary)':'var(--line)'}}>
      <div className="row" style={{cursor:'pointer'}} onClick={()=>{ setOpen(o=>!o); if(all) setAll(false); }}>
        <span className="hc-title">🆕 Mới cập nhật</span>
        {nUnseen>0 && <span className="pill" style={{background:'var(--primary)',color:'#fff',marginLeft:6,fontSize:11}}>{nUnseen} mới</span>}
        <span className="grow"></span>
        {open && nUnseen>0 && <span className="hc-act" style={{cursor:'pointer'}} onClick={e=>{e.stopPropagation();markSeen();}}>✓ Đã xem</span>}
        <span className="hc-act" style={{marginLeft:8}}>{open?'▴ Thu gọn':'▾ Mở ra xem'}</span>
      </div>
      {open && <div style={{marginTop:4}}>
        {list.map((x,i)=>(
          <div key={i} style={{display:'flex',gap:8,padding:'6px 0',borderTop:i>0?'1px solid var(--line)':'none'}}>
            <span style={{fontSize:16,flex:'0 0 auto'}}>{x.ic}</span>
            <div className="grow" style={{fontSize:12.5,lineHeight:1.5}}>{x.t}{x.d>seen && <span style={{color:'var(--primary)',fontWeight:700,fontSize:11}}> · MỚI</span>}
              <div className="muted" style={{fontSize:11,marginTop:1}}>{fmtDateVN(x.d)}</div></div>
          </div>
        ))}
        {!all && WHATS_NEW.length>PEEK && <button className="muted" style={{fontSize:12.5,marginTop:6,cursor:'pointer'}} onClick={()=>setAll(true)}>▾ Xem thêm ({WHATS_NEW.length-PEEK} mục nữa)</button>}
        {all && WHATS_NEW.length>PEEK && <button className="muted" style={{fontSize:12.5,marginTop:6,cursor:'pointer'}} onClick={()=>setAll(false)}>▴ Rút gọn</button>}
      </div>}
    </div>
  );
}
function Home({setup,setSetup,people,me,go}){
  const coverRef=useRef(null);
  const [coverBusy,setCoverBusy]=useState(false);
  const onCoverFile=async(e)=>{ const file=e.target.files&&e.target.files[0]; if(!file) return; setCoverBusy(true);
    try{ if(Cloud.connected()){ const path=await Cloud.uploadPhoto(file); setSetup({...setup,cover:{path}}); setCoverBusy(false); celebrate(['🖼️','💞']); }
      else { const r=new FileReader(); r.onload=()=>{ setSetup({...setup,cover:{src:r.result}}); setCoverBusy(false); celebrate(['🖼️','💞']); }; r.readAsDataURL(file); }
    }catch(err){ setCoverBusy(false); alert('Không tải được ảnh, thử ảnh khác nhé.'); }
    e.target.value=''; };
  const [notes]=useLocal('ju.notes',[]);
  const [events]=useLocal('ju.events',[]);
  const [dates]=useLocal('ju.dates',[]);
  const [photos]=useLocal('ju.photos',[]);
  const [wish]=useLocal('ju.wish',[]);
  const [bucket]=useLocal('ju.bucket',[]);

  const loveDays = setup.loveDate ? Math.max(0,(daysFromToday(setup.loveDate)||0)*-1) : null;
  const weddingDays = setup.weddingDate ? Math.max(0,(daysFromToday(setup.weddingDate)||0)*-1) : null;
  useEffect(()=>{ if(loveDays!=null && loveDays>0 && (loveDays%100===0||loveDays%365===0)) celebrate(['🎉','🎊','💞','✨','💖']); },[]);

  // sự kiện / ngày sắp tới trong 14 ngày
  const upcoming=useMemo(()=>{
    const list=[];
    events.forEach(e=>{ const d=daysFromToday(e.date); if(d!=null&&d>=0&&d<=14) list.push({t:e.title,d,date:e.date,kind:'Sự kiện'}); });
    dates.forEach(e=>{ const d=dnext(e); if(d!=null&&d<=14) list.push({t:(e.icon||'🎂')+' '+e.title,d,kind:'Ngày nhớ'}); });
    if(setup.loveDate){ const d=daysToNext(setup.loveDate); if(d<=14) list.push({t:'💗 Kỷ niệm ngày yêu',d,kind:''}); }
    if(setup.weddingDate){ const d=daysToNext(setup.weddingDate); if(d<=14) list.push({t:'💍 Kỷ niệm ngày cưới',d,kind:''}); }
    upcomingHolidays(14).forEach(h=>list.push({t:h.icon+' '+h.name,d:h.d,kind:'Ngày lễ'}));
    const pn=periodNext(); if(pn&&!pn.onPeriod&&pn.days<=14) list.push({t:'🌸 Kỳ kinh dự kiến',d:pn.days,kind:'Chu kỳ'});
    list.sort((a,b)=>a.d-b.d);
    return list.slice(0,8);
  },[events,dates,setup]);

  const lastNote=notes.slice().sort((a,b)=>b.createdAt-a.createdAt)[0];
  const [cover,setCover]=useState(null);
  useEffect(()=>{ let on=true; const c=setup.cover||photos[0]; if(!c){ setCover(null); return; }
    if(c.path){ Cloud.signedUrl(c.path).then(u=>{ if(on) setCover(u); }); } else setCover(c.src||null);
    return ()=>{ on=false; };
  },[setup.cover, photos]);
  const [homecfg,setHomecfg]=useLocal('ju.homecfg',{hidden:[]});
  useEffect(()=>{ if(!homecfg.v){ setHomecfg({...homecfg,v:2,hidden:[...new Set([...((homecfg&&homecfg.hidden)||[]),...HOME_DEFAULT_OFF])]}); } },[]);
  const hidden=(homecfg&&homecfg.hidden)||[];
  const show=(k)=> !hidden.includes(k);
  const keys=homeOrder(homecfg);
  const cardEls={
    partnerwish:<PartnerWishCard people={people} me={me}/>,
    cook:<KitchenCard people={people} me={me} go={go}/>,
    fun:<FunPickers/>,
    anger:<AngerHelper/>,
    reminders:<Reminders setup={setup} go={go}/>,
    upcoming:(<div>
      <div className="hc-title" style={{margin:'16px 16px 8px'}}>⏳ Sắp tới <span className="hc-act" style={{marginLeft:4}}>2 tuần</span></div>
      {upcoming.length===0 && <div className="empty">Chưa có sự kiện nào sắp tới.</div>}
      {upcoming.map((u,i)=>(
        <div key={i} className="item" onClick={()=>go('us')} style={{cursor:'pointer'}}>
          <div className="it-top"><h4>{u.t}</h4><span className="pill">{u.d===0?'Hôm nay!':u.d===1?'Ngày mai':'còn '+u.d+' ngày'}</span></div>
          <div className="muted" style={{fontSize:12.5,marginTop:4}}>{u.kind}{u.date?' · '+fmtDateVN(u.date):''}</div>
        </div>
      ))}
    </div>),
    todos:<TodosCard go={go}/>,
    now:<NowCard people={people} go={go}/>,
    onthisday:<OnThisDay people={people} go={go}/>,
    mood:<MoodCard people={people} me={me}/>,
    challenge:<DailyChallenge/>,
    habits:<HabitTracker/>,
    lovejar:<LoveJar people={people} me={me}/>,
    lastnote: lastNote ? (
      <div className="card" onClick={()=>go('us')} style={{cursor:'pointer'}}>
        <div className="row"><span className="hc-title">💌 Lời nhắn mới</span><span className="grow"></span><span className="hc-act">{people[lastNote.by]?.name}</span></div>
        <div className="it-note" style={{marginTop:6}}>{lastNote.text}</div>
      </div>) : null,
    stats:(
      <div className="stat-grid">
        <div className="stat" onClick={()=>go('us')} style={{cursor:'pointer'}}><div className="n">{wish.length}</div><div className="l">🎁 Quà mong muốn</div></div>
        <div className="stat" onClick={()=>go('us')} style={{cursor:'pointer'}}><div className="n">{bucket.filter(b=>!b.done).length}</div><div className="l">🎯 Điều muốn làm cùng</div></div>
        <div className="stat" onClick={()=>go('us')} style={{cursor:'pointer'}}><div className="n">{events.length}</div><div className="l">📅 Sự kiện</div></div>
        <div className="stat" onClick={()=>go('me')} style={{cursor:'pointer'}}><div className="n">{photos.length}</div><div className="l">📷 Ảnh chung</div></div>
      </div>),
    weather:<WeatherCard/>,
    question:<DailyQuestion people={people} me={me}/>,
    quiz:<CoupleQuiz people={people} me={me}/>,
    checkin:<WeeklyCheckin people={people} me={me}/>,
    savings:<SavingsMini go={go}/>,
  };

  return (
    <div className="homev3">
      <div className={'hero'+(cover?' hascover':'')}>
        {cover && <div className="cover" style={{backgroundImage:`url(${cover})`}}></div>}
        {cover && <div className="scrim"></div>}
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCoverFile}/>
        <button onClick={()=>coverRef.current&&coverRef.current.click()} title="Đổi ảnh bìa hai đứa"
          style={{position:'absolute',top:12,left:12,zIndex:2,background:'rgba(255,255,255,.92)',color:'#993556',border:'none',borderRadius:20,fontSize:11,fontWeight:700,padding:'4px 10px',cursor:'pointer'}}>{coverBusy?'⏳ đang tải…':'📷 Ảnh bìa'}</button>
        <div className="badges">
          {loveDays!=null && (()=>{ const ms=nextMilestone(loveDays); return ms? <span className="b">🎯 mốc {ms.mark.toLocaleString('vi-VN')} · {ms.inDays}n</span> : null; })()}
          {weddingDays!=null
            ? (()=>{ const tn=daysToNext(setup.weddingDate); return tn!=null? <span className="b">💍 kỷ niệm {tn}n</span> : null; })()
            : (loveDays!=null && (()=>{ const tn=daysToNext(setup.loveDate); return tn!=null? <span className="b">💗 kỷ niệm {tn}n</span> : null; })())}
        </div>
        <div className="inner">
          <div className="names">{people.a.avatar} {people.a.name} <span style={{opacity:.85}}>＋</span> {people.b.name} {people.b.avatar}</div>
          {loveDays!=null
            ? <><div className="count">{loveDays.toLocaleString('vi-VN')} ngày</div>
                <div className="sub">bên nhau · {yearsBetween(setup.loveDate)} năm 💗{weddingDays!=null?`  ·  💍 cưới ${weddingDays.toLocaleString('vi-VN')} ngày`:''}</div></>
            : <div className="sub" style={{marginTop:10}}>Thêm ngày yêu nhau trong Hồ sơ để bắt đầu đếm ✨</div>}
          {weddingDays==null && loveDays!=null && <div className="sub" style={{marginTop:3,opacity:.92,cursor:'pointer'}} onClick={()=>go('me')}>💍 ＋ Thêm ngày cưới</div>}
        </div>
      </div>
      {!cover && <div className="muted center" style={{fontSize:11,margin:'-6px 14px 6px',cursor:'pointer'}} onClick={()=>coverRef.current&&coverRef.current.click()}>📷 Chọn ảnh hai đứa làm ảnh bìa — số ngày sẽ hiện đè lên ảnh ›</div>}

      <WhatsNewCard/>
      {keys.filter(show).map(k=> cardEls[k] ? <div key={k}>{cardEls[k]}</div> : null)}
      <div style={{height:8}}></div>
    </div>
  );
}

/* ============ Phiếu yêu thương ============ */
function Coupons({people,me,flash}){
  const [coupons,setCoupons]=useLocal('ju.coupons',[]);
  const [t,setT]=useState('');
  const [sugOpen,setSugOpen]=useState(false);
  const other=me==='a'?'b':'a';
  const add=(title)=>{ const x=((title!=null?title:t)||'').trim(); if(!x)return; setCoupons(prev=>[{id:uid(),title:x,by:me,redeemed:false,createdAt:Date.now()},...prev]); setT(''); };
  const redeem=(id)=>{ setCoupons(prev=>prev.map(c=>c.id===id?{...c,redeemed:true,redeemedAt:Date.now()}:c)); celebrate(['🎟️','🎉','💝','✨','💞']); };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setCoupons(prev=>prev.filter(c=>c.id!==id)); } };

  const received=coupons.filter(c=>c.by===other);
  const given=coupons.filter(c=>c.by===me);
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🎟️ Tặng nhau những “phiếu” dễ thương — người kia đổi được bất cứ lúc nào.</div>
      <div className="row" style={{margin:'0 14px',gap:8}}>
        <input className="inp grow" placeholder={'Tặng '+people[other].name+' một phiếu…'} value={t}
          onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <button className="btn sm soft" aria-label="Gợi ý" title="Gợi ý" onClick={()=>setSugOpen(true)}><Ic n="goiy"/></button>
        <button className="btn sm" onClick={()=>add()}>Tặng</button>
      </div>

      <div className="sec-title">🎁 Phiếu bạn nhận ({received.filter(c=>!c.redeemed).length})</div>
      {received.length===0 && <div className="empty" style={{padding:'14px'}}>Chưa có phiếu nào — rủ {people[other].name} tặng bạn nhé 💕</div>}
      {received.map(c=>(
        <div key={c.id} className={'item'+(c.redeemed?' dn':'')}>
          <div className="it-top"><h4>🎟️ {c.title}</h4></div>
          <div className="it-meta">
            <span className="av-sm">{people[c.by]?.avatar}</span><span className="muted" style={{fontSize:12.5}}>{people[c.by]?.name} tặng</span>
            <span className="grow"></span>
            {c.redeemed ? <span className="pill">✓ Đã đổi</span> : <button className="btn sm" onClick={()=>redeem(c.id)}>Đổi ngay 🎉</button>}
          </div>
        </div>
      ))}

      <div className="sec-title">💝 Phiếu bạn đã tặng ({given.length})</div>
      {given.length===0 && <div className="empty" style={{padding:'14px'}}>Bạn chưa tặng phiếu nào.</div>}
      {given.map(c=>(
        <div key={c.id} className={'item'+(c.redeemed?' dn':'')}>
          <div className="it-top"><h4>🎟️ {c.title}</h4>
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(c.id)}><Ic n="xoa"/></button></div>
          <div className="it-meta"><span className="muted" style={{fontSize:12.5}}>Tặng {people[other].name}</span>
            <span className="grow"></span>
            {c.redeemed ? <span className="pill" style={{background:'var(--good)',color:'#fff'}}>Đã được đổi 🎉</span> : <span className="pill">Chờ đổi</span>}
          </div>
        </div>
      ))}

      {sugOpen && <Sheet title="💡 Gợi ý phiếu — chạm để tặng" onClose={()=>setSugOpen(false)}>
        <div>{COUPON_SUGGEST.map(s=>(
          <button key={s} className="pill" style={{margin:'4px 6px 4px 0',padding:'8px 12px',fontSize:12.5}}
            onClick={()=>{ add(s); flash&&flash('Đã tặng phiếu: '+s); }}>＋ {s}</button>
        ))}</div>
      </Sheet>}
    </div>
  );
}

/* ============ Tab: Ước muốn ============ */
function WishTab({people,me,flash}){
  const [seg,setSeg]=useState('gift');
  return (
    <div>
      <SegGrid value={seg} onChange={setSeg} items={[
        {k:'gift',icon:'🎁',label:'Quà tặng'},{k:'bucket',icon:'🎯',label:'Muốn làm cùng'},
        {k:'movie',icon:'🍿',label:'Phim muốn xem'},{k:'watch',icon:'🎬',label:'Xem·Đọc·Nghe'},
        {k:'music',icon:'🎵',label:'Nhạc đôi'},{k:'coupon',icon:'🎟️',label:'Phiếu yêu thương'},
        {k:'link',icon:'🔗',label:'Link hay'},{k:'price',icon:'🏷️',label:'Săn giá'},
      ]} menuId="wish"/>
      {seg==='gift' && <SimpleList skey="ju.wish" people={people} me={me} addLabel="món quà" doneLabel="Đã tặng"
        fields={['photo','price','link','note']} suggest={GIFT_SUGGEST} claimable showTotal empty={{icon:'🎁',text:'Ghi lại món quà bạn mơ ước — để nửa kia biết đường! Bấm 💡 để xem gợi ý.'}} flash={flash}/>}
      {seg==='bucket' && <SimpleList skey="ju.bucket" people={people} me={me} addLabel="điều muốn làm" doneLabel="Đã làm"
        fields={['note']} suggest={BUCKET_SUGGEST} empty={{icon:'🎯',text:'Những điều hai đứa muốn làm cùng nhau… Bấm 💡 để xem gợi ý!'}} flash={flash}/>}
      {seg==='movie' && <MovieList people={people} me={me} flash={flash}/>}
      {seg==='watch' && <SimpleList skey="ju.watch" people={people} me={me} addLabel="sách/nhạc/podcast" doneLabel="Đã xong"
        fields={['tag','link','rating','note']} tagOptions={['Sách','Nhạc','Podcast','Phim','Phim bộ','Khác']} suggest={WATCH_SUGGEST}
        empty={{icon:'🎬',text:'Sách, nhạc, podcast muốn thưởng thức cùng nhau — phim thì để ở mục 🍿 Phim muốn xem. Bấm 💡 để xem gợi ý!'}} flash={flash}/>}
      {seg==='music' && <MusicPlaylists people={people} me={me}/>}
      {seg==='coupon' && <Coupons people={people} me={me} flash={flash}/>}
      {seg==='link' && <SimpleList skey="ju.links" people={people} me={me} addLabel="link/bài viết" doneLabel="Đã đọc"
        fields={['link','note']} empty={{icon:'🔗',text:'Gửi nhau bài viết, link hay ở đây.'}} flash={flash}/>}
      {seg==='price' && <PriceWatch people={people} me={me} flash={flash}/>}
    </div>
  );
}

/* ============ 🍿 Phim muốn xem ============
   Danh sách nằm ở ju.movies. Khác mục 🎬 Xem·Đọc·Nghe (ju.watch — gộp chung sách,
   nhạc, podcast) ở bốn chỗ: ghi được NƠI XEM để tối bật lên là biết mở app nào ·
   HAI NGƯỜI CHẤM SAO RIÊNG sau khi xem chứ không dùng chung một điểm · nút CHIA SẺ
   gửi thẳng sang tin nhắn · nút quay ngẫu nhiên cho lúc không ai chọn được phim.

   Phim cũ đã lỡ ghi trong ju.watch (tag Phim / Phim bộ) thì dải nhắc đầu mục mời
   chuyển sang. Chuyển hẳn, không chép — để khỏi tồn tại hai bản của cùng một phim
   rồi đánh dấu đã xem ở bản này mà bản kia vẫn nằm đó. */
const MOVIE_WHERE=['Netflix','Disney+','Prime Video','HBO Max','Apple TV+','FPT Play','Galaxy Play','K+','YouTube','Rạp','Khác'];
const MOVIE_TAGS=['Phim lẻ','Phim bộ','Hoạt hình','Anime','Tài liệu'];

/* `shareText` nay là mảnh dùng chung, gộp vào ở đầu file qua «@@GOM ui-ju.jsx».
   Sửa nó thì sửa `HeThong/dungapp/chung/ui-ju.jsx` rồi dựng lại CẢ Just Us lẫn Sóc. */

function MovieList({people,me,flash}){
  const [items,setItems]=useLocal('ju.movies',[]);
  const [watch,setWatch]=useLocal('ju.watch',[]);
  const other=me==='a'?'b':'a';
  const [q,setQ]=useState('');
  const [filter,setFilter]=useState('todo');
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [sugOpen,setSugOpen]=useState(false);
  const [pick,setPick]=useState(null);

  const chuaXem=items.filter(x=>!x.done).length;

  /* Phim còn kẹt ở mục Xem·Đọc·Nghe */
  const kep=useMemo(()=>watch.filter(x=>x.tag==='Phim'||x.tag==='Phim bộ'),[watch]);
  const chuyenSang=()=>{
    setItems(prev=>{
      const daCo=new Set(prev.map(x=>(x.title||'').trim().toLowerCase()));   // lọc trùng NẰM TRONG hàm cập nhật
      const them=kep.filter(x=>(x.title||'').trim() && !daCo.has((x.title||'').trim().toLowerCase()))
        .map(x=>({id:uid(),title:x.title,year:'',tag:x.tag==='Phim bộ'?'Phim bộ':'Phim lẻ',where:'',
                  link:x.link||'',note:x.note||'',by:x.by||me,fav:!!x.fav,done:!!x.done,
                  rate:(typeof x.rating==='number'&&x.rating>0)?{[x.by||me]:x.rating}:{},
                  createdAt:x.createdAt||Date.now()}));
      return [...them,...prev];
    });
    setWatch(prev=>prev.filter(x=>x.tag!=='Phim'&&x.tag!=='Phim bộ'));
    flash&&flash('Đã đưa '+kep.length+' phim sang đây ✓');
  };

  const save=(it)=>{
    if(it.id) setItems(prev=>prev.map(x=>x.id===it.id?{...x,...it}:x));
    else setItems(prev=>[{...it,id:uid(),by:me,fav:false,done:false,rate:{},createdAt:Date.now()},...prev]);
    setOpen(false); setEdit(null);
  };
  const addQuick=(title)=> setItems(prev=>[{title,id:uid(),by:me,tag:'Phim lẻ',where:'',link:'',note:'',
    fav:false,done:false,rate:{},createdAt:Date.now()},...prev]);
  const del=(id)=>{ if(confirm('Xoá phim này khỏi danh sách? Thao tác này không hoàn tác được.')) setItems(prev=>prev.filter(x=>x.id!==id)); };
  const toggle=(id,f)=> setItems(prev=>prev.map(x=>{
    if(x.id!==id) return x;
    const nv={...x,[f]:!x[f]};
    if(f==='done'){ if(nv.done){ nv.watchedAt=Date.now(); celebrate(['🍿','🎬','⭐','💖']); } else delete nv.watchedAt; }
    return nv;
  }));
  const chamSao=(id,v)=> setItems(prev=>prev.map(x=>x.id===id?{...x,rate:{...(x.rate||{}),[me]:v}}:x));

  const dongPhim=(x)=> x.title+(x.year?' ('+x.year+')':'')+(x.where?' — '+x.where:'');
  const chiaSeMot=async(it)=>{
    const d=['🍿 '+it.title+(it.year?' ('+it.year+')':'')];
    if(it.where) d.push('Xem trên: '+it.where);
    if(it.note) d.push(it.note);
    const r=await shareText({title:it.title,text:d.join('\n'),url:it.link||''});
    if(r==='copy') flash&&flash('Đã copy — dán vào tin nhắn nhé!');
    if(r==='loi') flash&&flash('Máy không cho chia sẻ — copy tay giúp nhé');
  };
  const chiaSeCaList=async()=>{
    const ds=items.filter(x=>!x.done);
    if(!ds.length){ flash&&flash('Chưa có phim nào đang muốn xem'); return; }
    const txt='🍿 Phim hai đứa muốn xem:\n'+ds.map((x,i)=>(i+1)+'. '+dongPhim(x)+(x.link?'\n   '+x.link:'')).join('\n');
    const r=await shareText({title:'Phim hai đứa muốn xem',text:txt});
    if(r==='copy') flash&&flash('Đã copy danh sách '+ds.length+' phim ✓');
    if(r==='loi') flash&&flash('Máy không cho chia sẻ — copy tay giúp nhé');
  };
  const quayNgauNhien=()=>{
    const ds=items.filter(x=>!x.done);
    if(!ds.length){ flash&&flash('Chưa có phim nào để quay — thêm vài phim đã!'); return; }
    setPick(ds[Math.floor(Math.random()*ds.length)]);
    celebrate(['🍿','🎬','✨']);
  };

  const shown=useMemo(()=>{
    let a=items.slice();
    if(filter==='todo') a=a.filter(x=>!x.done);
    if(filter==='done') a=a.filter(x=>x.done);
    if(filter==='mine') a=a.filter(x=>x.by===me);
    if(filter==='partner') a=a.filter(x=>x.by===other);
    if(filter==='fav') a=a.filter(x=>x.fav);
    if(q.trim()){ const s=q.trim().toLowerCase();
      a=a.filter(x=>(x.title||'').toLowerCase().includes(s)||(x.note||'').toLowerCase().includes(s)||(x.where||'').toLowerCase().includes(s)); }
    a.sort((p,r)=> (r.fav?1:0)-(p.fav?1:0) || (p.done?1:0)-(r.done?1:0) || (r.createdAt||0)-(p.createdAt||0));
    return a;
  },[items,filter,q,me,other]);

  const theSao=(it)=>{
    const ra=(it.rate||{})[me], rb=(it.rate||{})[other];
    return (
      <div className="row" style={{gap:10,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
        <span className="muted" style={{fontSize:12.5}}>{people[me]?.name||'Tôi'}:</span>
        <Stars value={ra||0} onChange={v=>chamSao(it.id,v)}/>
        <span className="muted" style={{fontSize:12.5}}>{people[other]?.name||'Nửa kia'}:</span>
        {rb?<Stars value={rb}/>:<span className="muted" style={{fontSize:12.5}}>chưa chấm</span>}
      </div>
    );
  };

  return (
    <div>
      {kep.length>0 && <div className="item" style={{borderStyle:'dashed'}}>
        <div className="row" style={{gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:20}}>🎬</span>
          <span style={{flex:1,minWidth:150,fontSize:13,lineHeight:1.5}}>
            Có <b>{kep.length}</b> phim đang nằm ở mục Xem·Đọc·Nghe. Đưa sang đây để ghi được nơi xem và chấm sao riêng.
          </span>
          <button className="btn sm" onClick={chuyenSang}>Đưa sang đây</button>
        </div>
      </div>}

      <div className="row" style={{margin:'4px 14px 0',gap:8}}>
        <input className="inp grow" placeholder="🔎 Tìm phim…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn sm soft" aria-label="Gợi ý" title="Gợi ý" onClick={()=>setSugOpen(true)}><Ic n="goiy"/></button>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button>
      </div>

      <div className="row" style={{margin:'8px 14px 0',gap:8}}>
        <button className="btn sm soft grow" onClick={quayNgauNhien}>🎲 Tối nay xem gì?</button>
        <button className="btn sm soft grow" onClick={chiaSeCaList}>📤 Chia sẻ danh sách</button>
      </div>

      <div className="filters">
        <button className={filter==='todo'?'on':''} onClick={()=>setFilter('todo')}>Muốn xem{chuaXem>0?' · '+chuaXem:''}</button>
        <button className={filter==='done'?'on':''} onClick={()=>setFilter('done')}>Đã xem</button>
        <button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Tất cả</button>
        <button className={filter==='mine'?'on':''} onClick={()=>setFilter('mine')}>{people[me]?.name||'Của tôi'}</button>
        <button className={filter==='partner'?'on':''} onClick={()=>setFilter('partner')}>{people[other]?.name||'Của nửa kia'}</button>
        <button className={filter==='fav'?'on':''} onClick={()=>setFilter('fav')}>❤️ Thích</button>
      </div>

      {shown.length===0 && <div className="empty"><span className="big">🍿</span>
        {items.length===0
          ? 'Phim hai đứa hẹn nhau xem cùng — thêm vào đây để tối bật lên là có sẵn. Bấm 💡 để lấy gợi ý!'
          : 'Không có phim nào ở mục này.'}</div>}

      {shown.map(it=>(
        <div key={it.id} className={'item'+(it.done?' dn':'')}>
          <div className="it-top">
            <h4>{it.title}{it.year?<span className="muted" style={{fontWeight:500}}> ({it.year})</span>:null}</h4>
            <button className={'heartbtn'+(it.fav?' on':'')} aria-label={it.fav?'Bỏ thích':'Thích'} onClick={()=>toggle(it.id,'fav')}><Ic n={it.fav?'tim':'timrong'} size={18}/></button>
          </div>
          {it.note && <div className="it-note">{it.note}</div>}
          {it.link && <div style={{marginTop:6}}><a className="linkout" href={it.link} target="_blank" rel="noreferrer">🔗 {it.link}</a></div>}
          {!it.link && <div style={{marginTop:6}}>
            <button className="pill" onClick={()=>openUrl('https://www.google.com/search?q='+encodeURIComponent(it.title+' '+(it.year||'')+' phim xem ở đâu'))}>🔎 Tìm chỗ xem</button>
          </div>}
          {it.done && theSao(it)}
          <div className="it-meta">
            <span className="av-sm">{people[it.by]?.avatar||'❤️'}</span>
            <span className="muted" style={{fontSize:12.5}}>{people[it.by]?.name||''}</span>
            {it.tag && <span className="pill">{it.tag}</span>}
            {it.where && <span className="pill">📺 {it.where}</span>}
            <span className="grow"></span>
            <button className="pill" onClick={()=>toggle(it.id,'done')}>{it.done?'↩︎ Chưa xem':'✓ Đã xem'}</button>
            <button className="iconbtn" title="Chia sẻ" aria-label="Chia sẻ" onClick={()=>chiaSeMot(it)}><Ic n="chiase"/></button>
            <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(it);setOpen(true);}}><Ic n="sua"/></button>
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(it.id)}><Ic n="xoa"/></button>
          </div>
        </div>
      ))}

      {pick && <Sheet title="🎲 Tối nay xem phim này nhé!" onClose={()=>setPick(null)}>
        <div className="center" style={{padding:'6px 0 4px'}}>
          <div style={{fontSize:40}}>🍿</div>
          <div style={{fontSize:19,fontWeight:700,margin:'8px 0 4px'}}>{pick.title}</div>
          <div className="muted" style={{fontSize:13}}>
            {[pick.year,pick.tag,pick.where].filter(Boolean).join(' · ')||'Chưa ghi thêm thông tin'}
          </div>
          {pick.note && <div className="it-note" style={{textAlign:'left',marginTop:10}}>{pick.note}</div>}
        </div>
        <div className="row" style={{gap:8,marginTop:14,flexWrap:'wrap'}}>
          <button className="btn sm soft grow" onClick={quayNgauNhien}>🎲 Quay lại</button>
          {pick.link && <button className="btn sm soft grow" onClick={()=>openUrl(pick.link)}>🔗 Mở link</button>}
          <button className="btn sm grow" onClick={()=>{ toggle(pick.id,'done'); setPick(null); flash&&flash('Chúc hai đứa xem vui 🍿'); }}>✓ Xem cái này</button>
        </div>
      </Sheet>}

      {open && <MovieForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}

      {sugOpen && <Sheet title="💡 Gợi ý phim — chạm để thêm" onClose={()=>setSugOpen(false)}>
        <div>
          {(()=>{ const con=MOVIE_SUGGEST.filter(s=>!items.some(it=>(it.title||'').trim().toLowerCase()===s.toLowerCase()));
            return con.length? con.map(s=>(
              <button key={s} className="pill" style={{margin:'4px 6px 4px 0',padding:'8px 12px',fontSize:12.5}}
                onClick={()=>{ addQuick(s); flash&&flash('Đã thêm: '+s); }}>＋ {s}</button>
            )) : <div className="muted center" style={{padding:'16px 0'}}>Bạn đã thêm hết gợi ý rồi 🎉</div>;
          })()}
        </div>
      </Sheet>}
    </div>
  );
}

function MovieForm({init,onClose,onSave}){
  const [f,setF]=useState(()=> init? {...init} : {title:'',year:'',tag:'Phim lẻ',where:'',link:'',note:''});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const luu=()=>{ if(!(f.title||'').trim()) return; onSave({...f,title:f.title.trim()}); };
  return (
    <Sheet title={(init?'Sửa ':'Thêm ')+'phim'} onClose={onClose}>
      <div style={{display:'grid',gap:10}}>
        <input className="inp" autoFocus placeholder="Tên phim *" value={f.title} onChange={e=>set('title',e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') luu(); }}/>
        <div className="row" style={{gap:8}}>
          <input className="inp grow" inputMode="numeric" maxLength={4} placeholder="Năm (không bắt buộc)"
            value={f.year||''} onChange={e=>set('year',e.target.value.replace(/\D/g,''))}/>
          <select className="inp grow" value={f.tag||'Phim lẻ'} onChange={e=>set('tag',e.target.value)}>
            {MOVIE_TAGS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="muted" style={{fontSize:12.5,marginBottom:6}}>📺 Xem ở đâu</div>
          <div>
            {MOVIE_WHERE.map(w=>(
              <button key={w} className="pill" onClick={()=>set('where',f.where===w?'':w)}
                style={{margin:'4px 6px 4px 0',padding:'8px 12px',fontSize:12.5,
                        background:f.where===w?'var(--primary)':'var(--chip)',
                        color:f.where===w?'var(--on-primary)':'var(--chip-tx)'}}>{w}</button>
            ))}
          </div>
        </div>
        <input className="inp" placeholder="Link tới phim (không bắt buộc)" value={f.link||''} onChange={e=>set('link',e.target.value)}/>
        <textarea className="inp" placeholder="Ghi chú — ai giới thiệu, vì sao muốn xem…" value={f.note||''} onChange={e=>set('note',e.target.value)}/>
        <button className="btn" onClick={luu} disabled={!(f.title||'').trim()}>Lưu</button>
      </div>
    </Sheet>
  );
}

/* ============ Săn giá: theo dõi giá sản phẩm qua link ============
   Danh sách nằm ở ju.pricewatch. Máy ở nhà (script scripts/theo-doi-gia.py, chạy 3 lượt
   mỗi ngày) đọc danh sách này, đo giá từng link rồi ghi giá + lịch sử ngược lại, và bắn
   Telegram kèm thông báo đẩy khi giá hạ. App chỉ nhập link và xem — KHÔNG tự đo giá,
   vì trình duyệt bị chặn đọc trang của trang bán hàng khác (CORS).                     */
function tienVN(n){ if(typeof n!=='number'||!isFinite(n)) return '—'; return Math.round(n).toLocaleString('vi-VN')+'₫'; }
function khiNao(ms){
  if(!ms) return 'chưa đo';
  const p=Math.floor((Date.now()-ms)/60000);
  if(p<1) return 'vừa xong'; if(p<60) return p+' phút trước';
  const g=Math.floor(p/60); if(g<24) return g+' giờ trước';
  return Math.floor(g/24)+' ngày trước';
}
function PriceSpark({hist}){
  const pts=(hist||[]).filter(h=>h&&typeof h.p==='number');
  if(pts.length<2) return null;
  const W=104,H=30,ps=pts.slice(-30).map(h=>h.p);
  const lo=Math.min(...ps),hi=Math.max(...ps),d=(hi-lo)||1;
  const duong=ps.map((p,i)=>`${(i/(ps.length-1))*W},${H-((p-lo)/d)*(H-4)-2}`).join(' ');
  const xuong=ps[ps.length-1]<=ps[0];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{display:'block'}}>
      <polyline points={duong} fill="none" stroke={xuong?'var(--good,#16a34a)':'var(--bad,#dc2626)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
function PriceWatch({people,me,flash}){
  const [items,setItems]=useLocal('ju.pricewatch',[]);
  const [url,setUrl]=useState(''); const [ten,setTen]=useState(''); const [dich,setDich]=useState('');
  const them=()=>{
    const u=(url||'').trim();
    if(!/^https?:\/\//i.test(u)){ flash&&flash('Dán link bắt đầu bằng https:// nhé'); return; }
    const d=parseInt(String(dich).replace(/[^\d]/g,''),10);
    setItems(prev=>{
      if(prev.some(x=>x&&x.url===u)){ flash&&flash('Link này đang theo dõi rồi'); return prev; }
      return [{id:uid(),url:u,name:(ten||'').trim(),target:d>0?d:0,active:true,by:me,addedAt:Date.now()},...prev];
    });
    setUrl(''); setTen(''); setDich('');
    flash&&flash('Đã thêm — máy ở nhà sẽ đo giá trong vài giờ tới ✓');
  };
  const doiDich=(id,v)=>{ const d=parseInt(String(v).replace(/[^\d]/g,''),10); setItems(prev=>prev.map(x=>x.id===id?{...x,target:d>0?d:0}:x)); };
  const bat=(id)=>setItems(prev=>prev.map(x=>x.id===id?{...x,active:x.active===false}:x));
  const xoa=(id)=>setItems(prev=>prev.filter(x=>x.id!==id));
  const daXem=(id)=>setItems(prev=>prev.map(x=>x.id===id?{...x,baoLuc:0}:x));
  const dsSap=[...(items||[])].sort((a,b)=>((b&&b.baoLuc)||0)-((a&&a.baoLuc)||0)||((b&&b.addedAt)||0)-((a&&a.addedAt)||0));
  return (
    <div>
      <div className="card">
        <div className="row"><span className="hc-title">🏷️ Theo dõi giá</span></div>
        <div className="muted" style={{fontSize:12.5,margin:'4px 0 10px'}}>
          Dán link món đang muốn mua. Máy ở nhà đo giá ngày 3 lượt (8h · 13h · 20h); rẻ hơn là báo ngay vào Telegram và hiện thông báo trên máy này.
        </div>
        <div className="field"><label>Link sản phẩm</label>
          <input className="inp" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Dán link Shopee, Tiki, Hasaki…" inputMode="url"/></div>
        <div className="row" style={{gap:8}}>
          <div className="field grow" style={{margin:0}}><label>Tên gọi (bỏ trống cũng được)</label>
            <input className="inp" value={ten} onChange={e=>setTen(e.target.value)} placeholder="Máy hút sữa…"/></div>
          <div className="field" style={{margin:0,minWidth:130}}><label>Giá mong muốn</label>
            <input className="inp" value={dich} onChange={e=>setDich(e.target.value)} placeholder="vd 350000" inputMode="numeric"/></div>
        </div>
        <button className="btn grow" style={{marginTop:8,width:'100%'}} onClick={them}>Theo dõi món này</button>
      </div>

      {!dsSap.length && (
        <div className="card" style={{textAlign:'center',padding:'26px 16px'}}>
          <div style={{fontSize:34,lineHeight:1.1}}>🏷️</div>
          <div style={{fontWeight:600,marginTop:6}}>Chưa theo dõi món nào</div>
          <div className="muted" style={{fontSize:12.5,marginTop:4}}>Dán link món hai đứa đang ngắm ở trên. Khi nào hạ giá sẽ có thông báo, khỏi phải mở app xem đi xem lại.</div>
        </div>
      )}

      {dsSap.map(m=>{
        if(!m||!m.id) return null;
        const co=typeof m.cur==='number';
        const nen=typeof m.base==='number'?m.base:null;
        const lech=co&&nen?m.cur-nen:0;
        const pc=co&&nen&&nen>0?Math.round(Math.abs(lech)/nen*100):0;
        const moi=(m.baoLuc||0)>0;
        const tat=m.active===false;
        return (
          <div key={m.id} className="card" style={tat?{opacity:.6}:(moi?{borderColor:'var(--good,#16a34a)'}:{})}>
            <div className="row" style={{alignItems:'flex-start',gap:8}}>
              <div className="grow" style={{minWidth:0}}>
                <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {moi&&<span style={{color:'var(--good,#16a34a)'}}>● </span>}{m.name||m.url}
                </div>
                <div className="muted" style={{fontSize:11.5,marginTop:2}}>
                  {khiNao(m.last)}{m.cach?' · '+m.cach.split('/').pop():''}{tat?' · đang tạm dừng':''}
                </div>
              </div>
              <PriceSpark hist={m.hist}/>
            </div>

            <div className="row" style={{alignItems:'baseline',gap:10,marginTop:8}}>
              <div style={{fontSize:22,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{co?tienVN(m.cur):'—'}</div>
              {co&&nen&&lech!==0&&(
                <div style={{fontSize:13,fontWeight:600,color:lech<0?'var(--good,#16a34a)':'var(--bad,#dc2626)'}}>
                  {lech<0?'▼':'▲'} {pc}% <span className="muted" style={{fontWeight:400}}>so với {tienVN(nen)}</span>
                </div>
              )}
            </div>

            {typeof m.low==='number'&&(
              <div className="muted" style={{fontSize:12,marginTop:2,fontVariantNumeric:'tabular-nums'}}>
                Thấp nhất từng thấy {tienVN(m.low)}{m.target>0?' · mong muốn '+tienVN(m.target):''}
              </div>
            )}

            {m.err&&!co&&<div className="muted" style={{fontSize:12,marginTop:6,color:'var(--bad,#dc2626)'}}>Chưa đọc được giá tự động ở trang này.</div>}

            <div className="row" style={{gap:6,marginTop:10,flexWrap:'wrap'}}>
              <a className="btn soft" href={m.urlThat||m.url} target="_blank" rel="noreferrer">Mở trang bán</a>
              <input className="inp" style={{width:118,fontVariantNumeric:'tabular-nums'}} defaultValue={m.target>0?m.target:''} placeholder="giá mong muốn"
                inputMode="numeric" onBlur={e=>doiDich(m.id,e.target.value)}/>
              <span className="grow"></span>
              {moi&&<button className="btn soft" onClick={()=>daXem(m.id)}>Đã xem</button>}
              <button className="btn soft" onClick={()=>bat(m.id)}>{tat?'Theo dõi lại':'Tạm dừng'}</button>
              <button className="btn soft" onClick={()=>{ if(confirm('Bỏ theo dõi món này?')) xoa(m.id); }}>Xoá</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ Thời tiết + gợi ý theo thời tiết ============ */
function WeatherCard(){
  const [cityKey,setCityKey]=useLocal('ju.city','giangvo');
  const city=CITIES.find(c=>c.k===cityKey)||CITIES[0];
  const [w,setW]=useState(null); const [err,setErr]=useState(false);
  useEffect(()=>{ let on=true; setW(null); setErr(false);
    getWeather(city.lat,city.lng).then(v=>{ if(on){ v?setW(v):setErr(true); } });
    return ()=>{ on=false; };
  },[city.k]);
  const sel=(
    <select className="inp" style={{width:118,flex:'0 0 auto',padding:'6px 8px',fontSize:12.5}} value={cityKey} onChange={e=>setCityKey(e.target.value)}>
      {CITIES.map(c=><option key={c.k} value={c.k}>{c.name}</option>)}
    </select>
  );
  if(err) return <div className="card row" style={{gap:8}}><span className="muted grow" style={{fontSize:12.5}}>⛅ Không lấy được thời tiết (cần mạng).</span>{sel}</div>;
  if(!w) return <div className="card row" style={{gap:8}}><span className="muted grow" style={{fontSize:12.5}}>⛅ Đang xem thời tiết…</span>{sel}</div>;
  const rainy=w.rain||w.storm||w.rainSoon;
  return <WeatherCardInner w={w} rainy={rainy} sel={sel} city={city}/>;
}
function WeatherCardInner({w,rainy,sel,city}){
  const [fc,setFc]=useState(null); const [open,setOpen]=useState(false);
  const showFc=()=>{ setOpen(o=>!o); if(!fc) getForecast(city.lat,city.lng).then(setFc); };
  const DOWS=['CN','T2','T3','T4','T5','T6','T7'];
  return (
    <div className="card">
      <div className="row" style={{gap:12,alignItems:'center'}}>
        <div style={{fontSize:34}}>{w.icon}</div>
        <div className="grow"><b>{w.temp}°C · {w.text}</b>
          <div className="muted" style={{fontSize:12.5}}>{w.storm?'Giông/gió mạnh — nên ở trong nhà ☕🎬':(w.rain?'Trời đang mưa — hợp hẹn hò trong nhà ☕🎬':(w.rainSoon?'Sắp mưa trong vài giờ tới — nên chọn chỗ trong nhà ☕🎬':'Thời tiết đẹp — ra ngoài thôi 🌳🚲'))}</div></div>
        {sel}
      </div>
      {w.rainSoon && !w.rain && !w.storm && <div style={{fontSize:11,marginTop:6,background:'var(--bg)',borderRadius:8,padding:'6px 9px'}}>☔ Hiện đang khô nhưng khả năng mưa tới <b>{w.rainSoonP}%</b> trong ~{(w.soonHrs||0)+1}–3h tới — gợi ý đang ưu tiên chỗ trong nhà.</div>}
      <div className="row" style={{marginTop:6}}>
        <button className="muted tapmin" style={{fontSize:11}} onClick={showFc}>📅 {open?'Ẩn':'Xem'} 3 ngày tới</button>
        <span className="grow"></span><span className="muted" style={{fontSize:11}}>nguồn: {w.src}</span>
      </div>
      {open && (fc
        ? <div style={{display:'flex',gap:8,marginTop:6}}>{fc.map((d,i)=>{ const wm=wmo(d.code); const dd=new Date(d.date+'T00:00:00');
            return <div key={i} className="grow center" style={{background:'var(--bg)',borderRadius:10,padding:'8px 4px'}}>
              <div className="muted" style={{fontSize:11}}>{i===0?'Hôm nay':DOWS[dd.getDay()]+' '+dd.getDate()+'/'+(dd.getMonth()+1)}</div>
              <div style={{fontSize:22}}>{wm.icon}</div>
              <div style={{fontSize:12.5,fontWeight:700}}>{d.max}°<span className="muted" style={{fontWeight:400}}>/{d.min}°</span></div>
              <div className="muted" style={{fontSize:10}}>💧{d.rainP}%</div>
            </div>; })}</div>
        : <div className="muted center" style={{fontSize:12.5,marginTop:6}}>Đang tải…</div>)}
    </div>
  );
}

/* ============ Catalog "Gợi ý Hà Nội" ============ */
const NHA={lat:21.0301,lng:105.8210,name:'Núi Trúc, Ba Đình, Hà Nội'};
function haversine(la1,lo1,la2,lo2){ const R=6371,toR=x=>x*Math.PI/180;
  const dLa=toR(la2-la1),dLo=toR(lo2-lo1);
  const a=Math.sin(dLa/2)**2+Math.cos(toR(la1))*Math.cos(toR(la2))*Math.sin(dLo/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
const priceMid=(p)=>{ if(!p) return 0; if(/miễn phí|free/i.test(p)) return 0; const ns=(p.match(/\d+/g)||[]).map(Number); if(!ns.length) return 0; return (ns[0]+ns[ns.length-1])/2; };
const isKidSpot=(s)=> s.cat==='ngoaitroi' || s.cat==='vanhoa' || /board game|công viên|sở thú|thuỷ cung|thủy cung|kid|trẻ|vui chơi|aquarium|times city|ecopark|đầm sen|thiếu nhi/i.test((s.n||'')+(s.note||''));
const distOf=(s)=> (s.lat!=null&&s.lng!=null)? haversine(NHA.lat,NHA.lng,s.lat,s.lng) : null;
const VIBES=[
  {k:'sach',label:'☕ Cafe sách',cats:['cafe'],re:/sách|book/i},
  {k:'nhacsong',label:'🎸 Nhạc sống',cats:['cafe'],re:/nhạc sống|acoustic|live|hát/i},
  {k:'songao',label:'📸 Sống ảo / view đẹp',cats:['cafe'],re:/view|rooftop|sống ảo|đẹp|hoàng hôn|hồ|chụp|decor|địa trung hải|sang|lung linh|sân thượng/i},
  {k:'bakery',label:'🥐 Bakery / bánh',cats:['cafe'],re:/bánh|bakery|brunch|dessert/i},
  {k:'rong',label:'🌿 Không gian rộng',cats:['cafe'],re:/rộng|sân vườn|garden|không gian|biệt thự/i},
  {k:'chill',label:'🍃 Chill / sống chậm',cats:['cafe'],re:/chill|thư giãn|sống chậm|yên|nhẹ nhàng|bình yên/i},
  {k:'lamviec',label:'💻 Hợp làm việc',cats:['cafe'],re:/làm việc|học bài|yên tĩnh|wifi|sách|cổ điển/i},
  {k:'boardgame',label:'🎲 Board game',cats:['cafe'],re:/board game|boardgame/i},
  {k:'lau',label:'🍲 Lẩu',cats:['an'],re:/lẩu/i},
  {k:'nuong',label:'🔥 Nướng / BBQ',cats:['an'],re:/nướng|bbq/i},
  {k:'haisan',label:'🦐 Hải sản',cats:['an'],re:/hải sản|ốc|cua|ngao|nghêu|tôm/i},
  {k:'chay',label:'🥗 Chay',cats:['an'],re:/chay/i},
  {k:'buffet',label:'🍽️ Buffet',cats:['an'],re:/buffet/i},
  {k:'dacsan',label:'🍜 Đặc sản truyền thống',cats:['an'],re:/bún|phở|chả|nem|miến|cháo|cơm|đặc sản|truyền thống|bánh/i},
];
const vibeTags=(s)=> VIBES.filter(v=>(v.cats.indexOf(s.cat)>=0)&&v.re.test((s.n||'')+' '+(s.note||''))).map(v=>v.k);
function HanoiCatalog({me,flash}){
  const [,setIdeas]=useLocal('ju.ideas',[]);
  const [,setFood]=useLocal('ju.food',[]);
  const [hidden,setHidden]=useLocal('ju.hiddenSpots',[]);
  const [cat,setCat]=useState('');
  const [bud,setBud]=useState('');
  const [vibe,setVibe]=useState('');
  const [sort,setSort]=useState('near');
  const pickCat=(k)=>{ setCat(k); setVibe(''); };
  const hide=(s)=>{ setHidden(prev=>[...prev,s.n]); flash('Đã ẩn gợi ý: '+s.n); };
  let list=HANOI_SPOTS.filter(s=>(!cat||s.cat===cat)&&(!bud||s.budget===bud)&&(!vibe||vibeTags(s).indexOf(vibe)>=0)&&hidden.indexOf(s.n)<0&&(sort!=='kid'||isKidSpot(s)));
  if(sort==='near') list=list.slice().sort((a,b)=>((distOf(a)??1e9)-(distOf(b)??1e9)));
  else if(sort==='price') list=list.slice().sort((a,b)=>(priceMid(a.p)-priceMid(b.p)));
  const isFood=(s)=>s.cat==='an'||s.cat==='cafe';
  const info=(s)=>[s.h?'🕘 '+s.h:'', s.p?'💵 '+s.p:''].filter(Boolean).join(' · ');
  const mapsUrl=(s)=> 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.n+(/Hà Nội|Gia Lâm|Hưng Yên/i.test(s.area)?', '+s.area:', '+s.area+', Hà Nội'));
  const addIdea=(s)=>{ setIdeas(p=>[{id:uid(),title:s.n,budget:s.budget,note:[s.area,s.note,info(s)].filter(Boolean).join(' · '),by:me,fav:false,done:false,createdAt:Date.now()},...p]); flash('Đã lưu ý tưởng: '+s.n); };
  const addFood=(s)=>{ setFood(p=>[{id:uid(),title:s.n,address:s.area,note:[s.note,info(s)].filter(Boolean).join(' · '),by:me,fav:false,done:false,createdAt:Date.now()},...p]); flash('Đã lưu vào Quán: '+s.n); };
  const catIcon=(k)=>(HANOI_CATS.find(c=>c.k===k)||{}).icon||'📍';
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px 4px'}}>📍 {HANOI_SPOTS.length} địa điểm thật ở Hà Nội — khoảng cách tính từ <b>Núi Trúc</b>; bấm <b>⭐ Đánh giá</b> để xem rating thật trên Google Maps. <i>(Giờ & giá tham khảo.)</i></div>
      <div className="filters">
        <button className={cat===''?'on':''} onClick={()=>pickCat('')}>Tất cả</button>
        {HANOI_CATS.map(c=><button key={c.k} className={cat===c.k?'on':''} onClick={()=>pickCat(c.k)}>{c.icon} {c.name}</button>)}
      </div>
      <div className="row" style={{margin:'6px 14px',gap:8}}>
        <select className="inp grow" value={bud} onChange={e=>setBud(e.target.value)} style={{fontSize:12.5}}>
          <option value="">💵 Mọi mức giá</option>
          {BUDGETS.map(b=><option key={b.k} value={b.k}>{b.label}</option>)}
        </select>
        <select className="inp grow" value={vibe} onChange={e=>setVibe(e.target.value)} style={{fontSize:12.5}}>
          <option value="">🏷️ Mọi kiểu quán</option>
          {VIBES.filter(v=>!cat||v.cats.indexOf(cat)>=0).map(v=><option key={v.k} value={v.k}>{v.label}</option>)}
        </select>
      </div>
      <div className="filters">
        <button className={sort==='near'?'on':''} onClick={()=>setSort('near')}>📍 Gần → xa</button>
        <button className={sort==='price'?'on':''} onClick={()=>setSort('price')}>💵 Giá ↑</button>
        <button className={sort==='kid'?'on':''} onClick={()=>setSort('kid')}>🧸 Hợp trẻ em</button>
        <button className={sort==='default'?'on':''} onClick={()=>setSort('default')}>Mặc định</button>
      </div>
      <div className="row" style={{margin:'8px 14px 0'}}><span className="muted grow" style={{fontSize:11}}>{list.length} địa điểm · từ nhà ({NHA.name.split(',')[0]}){hidden.length?` · đã ẩn ${hidden.length}`:''}</span>
        {hidden.length>0 && <button className="muted" style={{fontSize:11}} onClick={()=>{ if(confirm('Hiện lại tất cả gợi ý đã ẩn?')) setHidden([]); }}>↩︎ Khôi phục</button>}</div>
      {list.map((s,i)=>(
        <div key={i} className="item">
          <div className="it-top"><h4>{catIcon(s.cat)} {s.n}{isKidSpot(s)?<span className="pill" style={{marginLeft:6,fontSize:10,padding:'1px 6px',verticalAlign:'middle'}}>🧸 hợp trẻ em</span>:null}</h4></div>
          <div className="muted" style={{fontSize:12.5,marginTop:2}}>📍 {s.area}{distOf(s)!=null?` · 📏 ~${distOf(s).toFixed(distOf(s)<10?1:0)} km từ nhà`:''}</div>
          {(s.h||s.p) && <div className="muted" style={{fontSize:12.5,marginTop:3}}>{s.h?'🕘 '+s.h:''}{s.h&&s.p?'  ·  ':''}{s.p?'💵 '+s.p+(isFood(s)&&(''+s.p).indexOf('/')<0?'/người':''):''}</div>}
          {s.note && <div className="it-note">{s.note}</div>}
          <div className="it-meta">
            <span className="pill">{budgetLabel(s.budget)}</span>
            <a className="pill" href={mapsUrl(s)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>⭐ Đánh giá · chỉ đường</a>
            <span className="grow"></span>
            <button className="pill" onClick={()=>isFood(s)?addFood(s):addIdea(s)}>{isFood(s)?'🍽️ Lưu Quán':'💡 Lưu'}</button>
            <button className="iconbtn" title="Ẩn gợi ý này" aria-label="Ẩn gợi ý này" onClick={()=>hide(s)}><Ic n="cam"/></button>
          </div>
        </div>
      ))}
      <div style={{height:8}}></div>
    </div>
  );
}

/* ============ Sự kiện ở Hà Nội + học sở thích ============ */
const EVENT_TAGS={nhac:'🎵 Nhạc',trienlam:'🖼️ Triển lãm',lehoi:'🎉 Lễ hội',amthuc:'🍜 Ẩm thực',ngoaitroi:'🌳 Ngoài trời',workshop:'🛠️ Workshop',thethao:'⚽ Thể thao',vanhoa:'🎭 Văn hoá',chodem:'🛍️ Chợ đêm'};
// Cập nhật định kỳ (xem ju.* lịch tự cập nhật). when = thời gian; nhiều mục là sự kiện lặp lại / theo mùa.
const HN_EVENTS=[
  {id:'pdb-hg',title:'Phố đi bộ Hồ Gươm',when:'Tối T6 → CN hằng tuần',where:'Hồ Hoàn Kiếm',tags:['ngoaitroi','vanhoa','nhac'],note:'Biểu diễn đường phố, trò chơi dân gian — miễn phí.'},
  {id:'pdb-tcs',title:'Phố đi bộ Trịnh Công Sơn',when:'Cuối tuần',where:'Tây Hồ',tags:['ngoaitroi','amthuc','nhac'],note:'Ẩm thực + nhạc acoustic ven hồ.'},
  {id:'cho-dong-xuan',title:'Chợ đêm Đồng Xuân',when:'Tối T6–CN',where:'Phố cổ Hoàn Kiếm',tags:['chodem','amthuc'],note:'Mua sắm, ăn vặt, hát xẩm chợ đêm.'},
  {id:'am-thuc-ngu-xa',title:'Phố ẩm thực Đảo Ngọc – Ngũ Xã',when:'Cuối tuần, buổi tối',where:'Trúc Bạch, Ba Đình',tags:['amthuc','ngoaitroi'],note:'Khu ẩm thực đi bộ ven hồ Trúc Bạch.'},
  {id:'btdt-hoc',title:'Sự kiện Bảo tàng Dân tộc học',when:'Dịp lễ / Trung thu / cuối tuần',where:'Nguyễn Văn Huyên, Cầu Giấy',tags:['vanhoa','workshop'],note:'Trò chơi dân gian, workshop thủ công cho gia đình.'},
  {id:'trung-thu-hang-ma',title:'Trung thu phố Hàng Mã',when:'Rằm tháng 8 âm lịch (khoảng 25/9/2026)',where:'Hàng Mã, Hoàn Kiếm',tags:['lehoi','ngoaitroi'],note:'Phố lồng đèn rực rỡ, đông vui.'},
  {id:'countdown',title:'Countdown đón năm mới',when:'Đêm 31/12',where:'Hồ Gươm / Quảng trường',tags:['nhac','lehoi','ngoaitroi'],note:'Đại nhạc hội + pháo hoa giao thừa.'},
  {id:'hoi-chua-huong',title:'Lễ hội Chùa Hương',when:'Mùng 6 Tết → hết tháng 3 âm',where:'Mỹ Đức, Hà Nội',tags:['lehoi','vanhoa','ngoaitroi'],note:'Trẩy hội, đi đò suối Yến, vãn cảnh chùa.'},
  {id:'hoi-go-dong-da',title:'Lễ hội Gò Đống Đa',when:'Mùng 5 Tết',where:'Đống Đa, Hà Nội',tags:['lehoi','vanhoa'],note:'Kỷ niệm chiến thắng Ngọc Hồi – Đống Đa.'},
  {id:'trienlam-vcca',title:'Triển lãm nghệ thuật (VCCA, Manzi, Complex 01)',when:'Theo lịch từng triển lãm',where:'Royal City / Phan Huy Ích / Tây Sơn',tags:['trienlam','vanhoa'],note:'Tranh, sắp đặt, nghệ thuật đương đại.'},
  {id:'concert-mydinh',title:'Concert / liveshow lớn',when:'Theo lịch — xem vé',where:'SVĐ Mỹ Đình / TT Hội nghị QG',tags:['nhac'],note:'Các đêm nhạc, liveshow ca sĩ trong & ngoài nước.'},
  {id:'vothuat-hn-2026',title:'Festival Võ thuật quốc tế Hà Nội 2026',when:'7–9/8/2026',where:'Hoàng thành Thăng Long & phố đi bộ Trần Nhân Tông',tags:['lehoi','thethao','vanhoa'],note:'Trình diễn võ đạo kết hợp ánh sáng nghệ thuật, giao lưu quốc tế — khai mạc tối 7/8.'},
  {id:'veew-2026',title:'Tuần lễ Sự kiện & Triển lãm Việt Nam 2026 (VEEW)',when:'30/7 – 2/8/2026',where:'Trung tâm Triển lãm VEC, Đông Anh',tags:['trienlam','vanhoa'],note:'Có Tuần lễ Thời trang Toàn cầu, công nghệ cưới hỏi, âm thanh – ánh sáng; sự kiện lần đầu tổ chức.'},
  {id:'package-craft-2026',title:'Triển lãm Package Craft – Nghệ thuật tạo hình vỏ hộp',when:'10/7 – 20/9/2026',where:'Không gian nghệ thuật nội thành Hà Nội',tags:['trienlam','workshop'],note:'Biến vật liệu quen thuộc thành tác phẩm nghệ thuật, có góc trải nghiệm thủ công.'},
  {id:'tpmm-summer-2026',title:'Những Thành Phố Mơ Màng – Summer Hà Nội 2026',when:'Mùa hè 2026 (xem lịch bán vé)',where:'Hà Nội',tags:['nhac'],note:'Đêm nhạc indie/acoustic không gian mộng mơ, hợp cho một buổi hẹn thư giãn.'},
  {id:'liveshow-hanhi-2026',title:'Liveshow Hà Nhi – Người yêu cũ là Tri kỷ',when:'Tối 23/8/2026',where:'Sky Melody, Ecopark',tags:['nhac'],note:'Đêm nhạc riêng của Hà Nhi — hợp cho một buổi hẹn lãng mạn.'},
  {id:'festival-thanglong-2026',title:'Festival Thăng Long – Hà Nội 2026',when:'11–20/9/2026',where:'Nhiều không gian văn hóa nội thành',tags:['lehoi','vanhoa','ngoaitroi'],note:'Chủ đề Dòng chảy di sản: trình diễn nghệ thuật, pháo hoa, tôn vinh di sản Thủ đô.'},
  {id:'quoc-khanh-29',title:'Đại lễ Quốc khánh 2/9',when:'Ngày 2/9',where:'Hồ Gươm và nhiều điểm nội thành',tags:['lehoi','ngoaitroi','vanhoa'],note:'Hoạt động mừng Quốc khánh, bắn pháo hoa, phố phường rực cờ hoa.'},
  {id:'workshop-gom',title:'Workshop gốm / nến / tranh',when:'Đặt lịch theo studio',where:'Nhiều studio nội thành',tags:['workshop'],note:'Tự tay làm đồ thủ công cùng nhau.'},
  {id:'giai-chay',title:'Giải chạy / sự kiện thể thao',when:'Theo mùa (xuân–thu)',where:'Hồ Tây / Hồ Gươm',tags:['thethao','ngoaitroi'],note:'Giải chạy phong trào quanh hồ, đăng ký trước.'},
  {id:'tron-nong-bavi',title:'Trốn nóng Ba Vì / Tam Đảo',when:'Cuối tuần mùa hè',where:'Ba Vì / Tam Đảo (ngoại thành)',tags:['ngoaitroi','lehoi'],note:'Đi trong ngày tránh nóng: rừng thông, thác, khí hậu mát.'},
  {id:'cho-hoa-quang-ba',title:'Chợ hoa đêm Quảng Bá',when:'Khuya → rạng sáng hằng ngày',where:'Quảng An, Tây Hồ',tags:['chodem','ngoaitroi'],note:'Chợ hoa đêm lớn nhất HN — trải nghiệm lạ về khuya.'},
];
function EventsSuggest({me,flash}){
  const [prefs,setPrefs]=useLocal('ju.eventPrefs',{});
  const [,setEvents]=useLocal('ju.events',[]);
  const rate=(id,v)=>{ const n={...prefs}; n[id]= n[id]===v? 0 : v; if(!n[id]) delete n[id]; setPrefs(n); };
  const tagScore={};
  HN_EVENTS.forEach(e=>{ const r=prefs[e.id]; if(r) e.tags.forEach(t=>tagScore[t]=(tagScore[t]||0)+r); });
  const score=(e)=> e.tags.reduce((s,t)=>s+(tagScore[t]||0),0) + (prefs[e.id]||0)*0.1;
  const sorted=HN_EVENTS.slice().sort((a,b)=>score(b)-score(a));
  const topTags=Object.entries(tagScore).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>EVENT_TAGS[t]);
  const addToCal=(e)=>{ setEvents(p=>[{id:uid(),title:'🎪 '+e.title,date:'',note:e.where+' · '+e.when,by:me,todos:[],createdAt:Date.now()},...p]); flash('Đã thêm vào Sự kiện: '+e.title); };
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🎪 Sự kiện ở Hà Nội — bấm 👍/👎 để app hiểu gu hai đứa, lần sau gợi ý hợp hơn.</div>
      {topTags.length>0 && <div className="card" style={{background:'linear-gradient(135deg,var(--chip),var(--card))'}}><b style={{fontSize:14}}>💖 Gu của hai đứa:</b> <span style={{fontSize:14}}>{topTags.join(' · ')}</span></div>}
      {sorted.map(e=>(
        <div key={e.id} className="item">
          <div className="it-top"><h4>🎪 {e.title}</h4></div>
          <div className="muted" style={{fontSize:12.5,marginTop:2}}>📅 {e.when} · 📍 {e.where}</div>
          <div className="muted" style={{fontSize:11,marginTop:3}}>{e.tags.map(t=>EVENT_TAGS[t]).filter(Boolean).join(' · ')}</div>
          {e.note && <div className="it-note">{e.note}</div>}
          <div className="it-meta">
            <button className="pill" style={{background:prefs[e.id]===1?'var(--good)':'var(--chip)',color:prefs[e.id]===1?'#fff':'var(--chip-tx)'}} onClick={()=>rate(e.id,1)}>👍 Thích</button>
            <button className="pill" style={{background:prefs[e.id]===-1?'#b06b6b':'var(--chip)',color:prefs[e.id]===-1?'#fff':'var(--chip-tx)'}} onClick={()=>rate(e.id,-1)}>👎 Không</button>
            <span className="grow"></span>
            <button className="pill" onClick={()=>addToCal(e)}>📅 Thêm lịch</button>
          </div>
        </div>
      ))}
      <div className="muted center" style={{fontSize:11,margin:'6px 14px'}}>Danh sách được cập nhật định kỳ. Sự kiện theo mùa/âm lịch ghi rõ thời gian.</div>
    </div>
  );
}
/* ============ Tab: Hẹn hò ============ */
function DateTab({people,me,flash}){
  const [seg,setSeg]=useState('idea');
  return (
    <div>
      <SegGrid value={seg} onChange={setSeg} items={[
        {k:'idea',icon:'💡',label:'Ý tưởng'},{k:'hanoi',icon:'📍',label:'Gợi ý HN'},
        {k:'events',icon:'🎪',label:'Sự kiện HN'},
        {k:'food',icon:'🍜',label:'Quán & Món'},{k:'checkin',icon:'📸',label:'Check-in ảnh'},
        {k:'wish',icon:'💝',label:'Ước mơ chung'},
      ]} menuId="date"/>
      {seg==='idea' && <><WeatherCard/><DateIdeas people={people} me={me}/></>}
      {seg==='hanoi' && <HanoiCatalog me={me} flash={flash}/>}
      {seg==='events' && <EventsSuggest me={me} flash={flash}/>}
      {seg==='food' && <SimpleList skey="ju.food" people={people} me={me} addLabel="quán/món" doneLabel="Đã thử"
        fields={['photos','menu','address','rating','link','note']} suggest={FOOD_SUGGEST} empty={{icon:'🍜',text:'Quán ăn, món muốn thử cùng nhau. Bấm 💡 để xem gợi ý!'}} flash={flash}/>}
      {seg==='checkin' && <CheckIns people={people} me={me}/>}
      {seg==='wish' && <WishTab people={people} me={me} flash={flash}/>}
    </div>
  );
}

/* ============ Trò chơi — phần thưởng cá cược ============ */
const BET_GROUPS=[
  {icon:'🍜',name:'Ăn uống',items:[
    'Người thắng được chọn món ăn tối hôm sau','Người thua đặt đồ ăn đêm','Được mời một cốc cà phê hoặc trà sữa',
    'Người thua tự pha đồ uống yêu thích cho người thắng','Được chọn quán ăn cho buổi đi chơi tiếp theo','Được ăn món ngon mà không phải chia miếng cuối',
    'Người thua chuẩn bị bữa sáng','Được chọn món tráng miệng','Người thua bóc hoa quả và mang tận nơi',
    'Được quyền gọi thêm một món trong lần đi ăn tới','Người thắng được chọn đồ ăn vặt cho trận bóng tiếp theo','Người thua nấu một món theo yêu cầu, trong khả năng hợp lý']},
  {icon:'🧹',name:'Việc nhà',items:[
    'Một lần miễn rửa bát','Một lần miễn đổ rác','Một lần miễn gấp quần áo','Một tối không phải dọn phòng',
    'Người thua thay ga giường','Người thua lau bàn và dọn đồ ăn sau trận','Được chọn một việc nhà để chuyển cho người kia',
    'Một "phiếu miễn việc nhà" dùng trong vòng bảy ngày','Người thua chuẩn bị đồ cho con vào sáng hôm sau',
    'Người thắng được nghỉ hoàn toàn 30 phút, không bị gọi làm việc gì','Người thua xử lý toàn bộ đống bát sau một bữa','Người thắng được quyền bỏ qua một việc lặt vặt mà mình ghét nhất']},
  {icon:'💆',name:'Chăm sóc & thư giãn',items:[
    'Massage vai 10 phút','Massage chân 15 phút','Gội đầu hoặc sấy tóc cho nhau','Được nằm xem điện thoại yên tĩnh trong 30 phút',
    'Được ngủ nướng thêm 30 phút','Được tắm trước và không bị giục','Người thua chuẩn bị nước ấm và đồ ngủ','Được chọn bên giường mình thích',
    'Được ôm và nghe người kia kể chuyện hoặc tâm sự 15 phút','Được một buổi tối không phải xử lý việc gia đình sau khi con ngủ',
    'Người thua bóp vai trong lúc xem tập phim tiếp theo','Được quyền yêu cầu một buổi nghỉ ngơi riêng trong tuần']},
  {icon:'💞',name:'Tình cảm',items:[
    'Người thua phải nói ba lời khen thật lòng','Viết một tin nhắn tình cảm gửi vào sáng hôm sau','Được yêu cầu một cái ôm dài một phút',
    'Người thua kể lại ba điều mình biết ơn ở người kia','Được chọn một bức ảnh hai người để đăng hoặc lưu làm kỷ niệm','Người thua phải chủ động rủ đi hẹn hò',
    'Được nhận một nụ hôn mỗi khi đội mình ghi bàn ở trận tiếp theo','Người thua viết một tờ "voucher yêu thương"','Được quyền hỏi một câu và người kia phải trả lời thật lòng',
    'Người thua kể lại kỷ niệm vui nhất của hai người','Được yêu cầu người kia làm một hành động lãng mạn nhỏ','Người thắng được chọn cách hai người dành thời gian riêng tối hôm đó']},
  {icon:'🎬',name:'Giải trí',items:[
    'Được chọn phim tối hôm sau','Được chọn chương trình truyền hình tiếp theo','Được giữ điều khiển tivi cả tối','Được chọn nhạc khi đi ô tô',
    'Được chọn trận bóng tiếp theo hai người cùng xem','Người thua phải xem cùng 30 phút chương trình người thắng thích','Được chọn trò chơi hai người chơi cùng',
    'Được chọn địa điểm đi chơi cuối tuần','Được chọn chủ đề cho buổi chụp ảnh gia đình','Được chọn quán cà phê lần tới',
    'Được quyền bỏ qua một bộ phim mà người kia đang ép xem','Người thua phải tìm một bộ phim hay và chuẩn bị đồ ăn để cùng xem']},
  {icon:'🛍️',name:'Mua sắm nhỏ',items:[
    'Một món quà dưới 50.000 đồng','Một món quà dưới 100.000 đồng','Một món đồ ăn yêu thích khi đi siêu thị','Một món đồ nhỏ trong giỏ hàng online',
    'Một bó hoa nhỏ','Một món đồ chơi nhỏ cho sở thích cá nhân','Được chọn món đồ gia đình sẽ mua tiếp theo','Người thua bỏ tiền vào "quỹ hẹn hò" 50.000 đồng',
    'Được mua một món không cần giải thích','Một phiếu mua cà phê, bánh ngọt hoặc đồ ăn sáng']},
  {icon:'😜',name:'Vui & hơi "lầy"',items:[
    'Người thua phải đổi ảnh đại diện theo lựa chọn của người thắng trong một giờ','Người thua phải hát một đoạn bài hát','Người thua phải nhảy ăn mừng khi đội người thắng ghi bàn ở trận sau',
    'Người thua phải gọi người thắng là "chuyên gia bóng đá" đến hết tối','Người thua phải đọc một lời xin lỗi bóng đá thật trang trọng','Người thua phải diễn lại pha bóng hài nhất trận',
    'Người thua phải làm bình luận viên trong năm phút','Người thắng được chọn một biệt danh vui cho người thua trong tối đó','Người thua phải chụp một bức ảnh tạo dáng theo yêu cầu',
    'Người thua phải phục vụ đồ uống với phong cách nhân viên VIP','Người thua phải đăng một câu thừa nhận người kia đoán bóng giỏi hơn, chỉ khi cả hai đều thấy thoải mái','Người thua phải mặc áo đội người thắng chọn trong trận tiếp theo']},
  {icon:'🎁',name:'Phần thưởng lớn',items:[
    'Một buổi hẹn hò do người thua lên kế hoạch','Một bữa ăn ngoài do người thua mời','Một buổi đi cà phê riêng không mang theo việc','Một buổi xem phim tại rạp',
    'Một chuyến đi chơi nửa ngày','Một buổi người thắng được nghỉ chăm con trong hai giờ','Người thắng được chọn hoạt động cuối tuần','Một món quà có ngân sách thống nhất trước',
    'Một buổi ăn sáng bên ngoài','Một tối "không điện thoại", chỉ dành thời gian cho nhau','Một buổi spa, gội đầu dưỡng sinh hoặc massage','Tích ba trận thắng để đổi lấy một buổi hẹn lớn']},
];
const BET_TIERS=[
  {t:'Thắng kèo nhỏ',d:'Pha đồ uống · bóc hoa quả · massage 10 phút'},
  {t:'Thắng cả trận',d:'Miễn một việc nhà · chọn món ăn · hoặc chọn phim'},
  {t:'Đoán đúng tỉ số',d:'Một buổi hẹn hò · ngủ nướng · hoặc nghỉ chăm con hai giờ'},
];
const COUPLE_GAMES=[
  {icon:'💬',name:'Chỉ cần nói chuyện (không cần đạo cụ)',items:[
    {n:'20 câu hỏi',d:'Một người nghĩ ra đồ vật/nhân vật, người kia hỏi tối đa 20 câu Có/Không để đoán.'},
    {n:'Ai hiểu ai hơn',d:'Lần lượt đố về thói quen, sở thích của nhau — sai thì làm 1 việc nhỏ cho người kia.'},
    {n:'Thật hay Thách',d:'Chọn "thật" (trả lời thật lòng) hoặc "thách" (làm một hành động vui).'},
    {n:'Tôi chưa từng',d:'Nói "Tôi chưa từng…", ai đã từng thì thú nhận — hiểu nhau thêm.'},
    {n:'Hai thật một xạo',d:'Kể 3 điều về mình, 1 điều là bịa; người kia đoán câu nào xạo.'},
    {n:'Nhìn mắt nhau 2 phút',d:'Im lặng nhìn vào mắt nhau, ai cười/quay đi trước thì thua.'},
    {n:'Kể chuyện nối tiếp',d:'Mỗi người thêm một câu để cùng dựng nên một câu chuyện hài.'},
    {n:'Đoán bài hát ngân nga',d:'Một người ngân "à á" giai điệu, người kia đoán tên bài.'},
    {n:'Taboo (từ cấm)',d:'Tả một từ cho người kia đoán nhưng không được dùng vài từ "cấm" liên quan.'},
    {n:'Cái này hay cái kia',d:'Hỏi nhanh "cà phê hay trà?", "biển hay núi?" — trả lời ngay, hiểu gu nhau.'},
    {n:'Kể tên theo chữ cái A–Z',d:'Chọn chủ đề (món ăn, địa danh…), lần lượt kể theo bảng chữ cái, ai bí thì thua.'},
    {n:'Đố mẹo / câu đố IQ',d:'Thay nhau ra câu đố mẹo cho người kia vắt óc suy nghĩ.'}]},
  {icon:'✏️',name:'Cần giấy bút / điện thoại',items:[
    {n:'Vẽ và đoán (Pictionary)',d:'Một người vẽ, người kia đoán từ trong thời gian giới hạn.'},
    {n:'Cờ caro',d:'Kẻ ô rồi đánh X/O — nhanh gọn, chơi mọi lúc.'},
    {n:'Ô ăn quan / nối chữ',d:'Nối từ cuối của người trước, ai bí thì thua.'},
    {n:'Quiz "hiểu nhau tới đâu"',d:'Tự soạn 10 câu về nhau rồi chấm điểm cho vui.'},
    {n:'Viết thư cho 5 năm sau',d:'Mỗi người viết một lá, cất đi, hẹn ngày mở lại.'},
    {n:'Wordle / giải đố đôi',d:'Cùng giải một câu đố chữ mỗi ngày trên điện thoại.'},
    {n:'Bắn tàu (Battleship)',d:'Mỗi người vẽ lưới giấu tàu, thay nhau "bắn" toạ độ để đoán vị trí tàu đối phương.'},
    {n:'Nối chấm tạo ô (Dots & Boxes)',d:'Nối 2 chấm mỗi lượt, ai khép được ô vuông thì chiếm ô đó — ai nhiều ô hơn thắng.'},
    {n:'Bingo tình yêu',d:'Tự làm bảng bingo các điều "hai đứa hay làm", tích dần cho đủ hàng.'}]},
  {icon:'🎲',name:'Board game & bài',items:[
    {n:'Uno',d:'Bài Uno cho 2 người — nhanh, dễ, nhiều pha "lật kèo".'},
    {n:'Cờ tỷ phú',d:'Cổ điển, kéo dài cả buổi tối cuối tuần.'},
    {n:'Cờ vua / cờ tướng',d:'Đấu trí nhẹ nhàng, có thể vừa chơi vừa nhâm nhi trà.'},
    {n:'Cá ngựa / cờ cá sấu',d:'Đơn giản, hên xui, cười nhiều.'},
    {n:'Rút gỗ (Jenga)',d:'Rút từng thanh gỗ, ai làm đổ tháp thì thua.'},
    {n:'Xếp hình puzzle',d:'Cùng ghép một bức tranh lớn qua nhiều tối — thư giãn.'},
    {n:'Bài Tây (Tiến lên / Phỏm)',d:'Bộ bài 52 lá quen thuộc, chơi 2 người vẫn vui.'},
    {n:'Domino / Rummikub',d:'Xếp số theo quy luật — dễ học, gây nghiện.'},
    {n:'Cờ vây / cờ caro 5 quân',d:'Chiến thuật sâu hơn cho tối rảnh, càng chơi càng hay.'}]},
  {icon:'🤸',name:'Vận động & lầy lội',items:[
    {n:'Cá sấu (charades)',d:'Diễn tả bằng hành động cho người kia đoán, không được nói.'},
    {n:'Bịt mắt cho ăn',d:'Bịt mắt, đút cho nhau ăn và đoán món.'},
    {n:'Thử thách nấu ăn',d:'Bốc 1 nguyên liệu bí mật, mỗi người nấu 1 món rồi chấm.'},
    {n:'Nhảy theo game (Just Dance)',d:'Bật nhạc, thi nhảy theo — cười vỡ bụng.'},
    {n:'Thi plank / squat',d:'Ai giữ lâu hơn thì thắng — vừa vui vừa khoẻ.'},
    {n:'Giữ bóng bay không rơi',d:'Cùng giữ bóng bay trên không bằng mọi cách.'},
    {n:'Oẳn tù tì búng tai',d:'Chơi kéo búa bao, ai thua bị búng tai nhẹ — nhanh và lầy.'},
    {n:'Yoga / giãn cơ đôi',d:'Cùng tập vài tư thế dựa vào nhau — thư giãn và gắn kết.'},
    {n:'Vượt chướng ngại trong nhà',d:'Dùng gối, ghế bày đường đi rồi thi ai qua nhanh hơn.'}]},
  {icon:'📱',name:'Game điện thoại / máy (co-op)',items:[
    {n:'Overcooked',d:'Cùng nấu ăn trong bếp hỗn loạn — phối hợp ăn ý mới qua màn.'},
    {n:'Stardew Valley (co-op)',d:'Cùng làm nông trại, câu cá, xây dựng — chơi dài hơi, thư giãn.'},
    {n:'Chess.com / cờ online',d:'Đấu cờ qua điện thoại kể cả khi mỗi người một nơi.'},
    {n:'Karaoke đôi (Smule…)',d:'Song ca một bài hai đứa thích, chấm điểm cho vui.'},
    {n:'Cùng chơi quiz show',d:'Bật gameshow/trivia trên TV, thi xem ai trả lời đúng nhiều hơn.'},
    {n:'Geoguessr đôi',d:'Nhìn ảnh đường phố đoán đang ở đâu trên thế giới — cùng bàn luận.'}]},
  {icon:'💞',name:'Lãng mạn & kết nối',items:[
    {n:'36 câu hỏi khiến yêu nhau',d:'Bộ câu hỏi tâm lý học nổi tiếng — hỏi đáp để gần nhau hơn.'},
    {n:'"Nếu… thì sao"',d:'Đặt các giả định vui/sâu rồi cùng bàn: "Nếu trúng số thì…".'},
    {n:'Kể lại kỷ niệm đầu',d:'Mỗi người kể lần đầu gặp/hẹn theo góc nhìn của mình.'},
    {n:'Vẽ chân dung nhau',d:'Vẽ mặt người kia mà không nhìn giấy — kết quả rất hài.'},
    {n:'Playlist của hai đứa',d:'Mỗi người thêm bài "gợi nhớ về người kia" rồi cùng nghe.'},
    {n:'20 điều biết ơn nhau',d:'Thay nhau kể điều mình biết ơn ở người kia cho tới khi đủ 20.'},
    {n:'Xem lại ảnh cũ & kể chuyện',d:'Lướt album cũ, mỗi tấm kể một kỷ niệm gắn với nó.'},
    {n:'Lên kế hoạch trong mơ',d:'Cùng vẽ ra chuyến du lịch / ngôi nhà mơ ước của hai đứa.'}]},
];
function GameBets({people,me,flash}){
  const [data,setData]=useLocal('ju.gameBets',{pinned:[]});
  const pinned=data.pinned||[];
  const [openG,setOpenG]=useState({});
  const [openP,setOpenP]=useState({});
  const [picked,setPicked]=useState(null);
  const [view,setView]=useState('play');
  const togglePin=(t)=>{ const has=pinned.includes(t); setData({...data,pinned:has?pinned.filter(x=>x!==t):[...pinned,t]}); if(!has&&flash)flash('Đã ghim vào danh sách chọn trước 📌'); };
  const pickRandom=()=>{ const pool=pinned.length?pinned:BET_GROUPS.flatMap(g=>g.items); setPicked(pool[Math.floor(Math.random()*pool.length)]); celebrate(['🎲','🎉']); };
  return (
    <div>
      <div className="seg" style={{marginTop:10}}>
        <button className={view==='play'?'on':''} onClick={()=>setView('play')}>🎮 Chơi gì</button>
        <button className={view==='bet'?'on':''} onClick={()=>setView('bet')}>🏆 Phần thưởng cược</button>
      </div>
      {view==='play' && <div>
        <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🎮 Gợi ý trò chơi hai vợ chồng chơi cùng nhau — từ chỉ cần nói chuyện tới board game, vận động & lãng mạn. Bấm nhóm để mở.</div>
        {COUPLE_GAMES.map(g=>{ const open=openP[g.name]; return (
          <div key={g.name} className="card" style={{padding:'6px 13px'}}>
            <div className="row" style={{cursor:'pointer',padding:'6px 0'}} onClick={()=>setOpenP({...openP,[g.name]:!open})}>
              <span className="grow" style={{fontSize:14,fontWeight:700}}>{g.icon} {g.name}</span>
              <span className="muted" style={{fontSize:12.5}}>{g.items.length} · {open?'▲':'▾'}</span>
            </div>
            {open && <div style={{paddingBottom:6}}>{g.items.map(it=>(
              <div key={it.n} style={{padding:'7px 0',borderTop:'1px solid var(--line)'}}>
                <div style={{fontSize:13.5,fontWeight:600}}>{it.n}</div>
                <div className="muted" style={{fontSize:12.5,marginTop:1,lineHeight:1.5}}>{it.d}</div>
              </div>
            ))}</div>}
          </div>
        ); })}
      </div>}
      {view==='bet' && <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🎲 Cá cược vui khi xem bóng / chơi game cùng nhau. Chọn trước phần thưởng — đủ vui mà không tạo cảm giác "bị phạt". Bấm 📌 để ghim món hai đứa thích vào danh sách chọn trước.</div>
      <div className="card">
        <div className="hc-title" style={{marginBottom:6}}>⚡ Bộ dễ áp dụng nhất (chốt sẵn 3 cấp)</div>
        {BET_TIERS.map((x,i)=>(
          <div key={i} className="row" style={{padding:'7px 0',borderBottom:i<BET_TIERS.length-1?'1px solid var(--line)':'none',gap:8,alignItems:'flex-start'}}>
            <span className="pill" style={{flex:'0 0 auto',background:'var(--primary)',color:'#fff'}}>{i+1}</span>
            <div className="grow"><div style={{fontSize:14,fontWeight:700}}>{x.t}</div><div className="muted" style={{fontSize:12.5,marginTop:1}}>{x.d}</div></div>
          </div>
        ))}
      </div>
      <div className="row" style={{margin:'12px 14px 4px',gap:8,alignItems:'center'}}>
        <span className="grow muted" style={{fontSize:12.5}}>📌 Đã ghim: {pinned.length}</span>
        <button className="btn sm" onClick={pickRandom}>🎲 Chọn ngẫu nhiên</button>
      </div>
      {picked && <div className="card" style={{background:'linear-gradient(135deg,var(--chip),var(--card))',textAlign:'center'}}>
        <div className="muted" style={{fontSize:12}}>Phần thưởng bốc được 🎉</div>
        <div style={{fontSize:15,fontWeight:800,margin:'6px 0'}}>{picked}</div>
        <button className="muted" style={{fontSize:11}} onClick={()=>setPicked(null)}>✕ Đóng</button>
      </div>}
      {pinned.length>0 && <div className="card">
        <div className="hc-title" style={{marginBottom:6}}>📌 Danh sách chọn trước của hai đứa</div>
        {pinned.map(t=>(
          <div key={t} className="row" style={{padding:'6px 0',borderBottom:'1px solid var(--line)',gap:8}}>
            <span className="grow" style={{fontSize:13.5}}>{t}</span>
            <button className="muted tapmin" aria-label="Xoá" onClick={()=>togglePin(t)}><Ic n="dong" size={15}/></button>
          </div>
        ))}
      </div>}
      {BET_GROUPS.map(g=>{ const open=openG[g.name]; return (
        <div key={g.name} className="card" style={{padding:'6px 13px'}}>
          <div className="row" style={{cursor:'pointer',padding:'6px 0'}} onClick={()=>setOpenG({...openG,[g.name]:!open})}>
            <span className="grow" style={{fontSize:14,fontWeight:700}}>{g.icon} {g.name}</span>
            <span className="muted" style={{fontSize:12.5}}>{g.items.length} · {open?'▲':'▾'}</span>
          </div>
          {open && <div style={{paddingBottom:6}}>{g.items.map(t=>{ const on=pinned.includes(t); return (
            <div key={t} className="row" style={{padding:'6px 0',borderTop:'1px solid var(--line)',gap:8,alignItems:'flex-start'}}>
              <span className="grow" style={{fontSize:13.5}}>{t}</span>
              <button className="pill" style={{flex:'0 0 auto',background:on?'var(--good)':'var(--chip)',color:on?'#fff':'var(--chip-tx)'}} onClick={()=>togglePin(t)}>{on?'📌 Đã ghim':'📌 Ghim'}</button>
            </div>
          ); })}</div>}
        </div>
      ); })}
      </div>}
    </div>
  );
}
/* ============ Check-in quán (đã ghé + tự đánh giá) ============ */
function CheckIns({people,me}){
  const [items,setItems]=useLocal('ju.checkins',[]);
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [filter,setFilter]=useState('all');
  const [view,setView]=useState(null);
  useEffect(()=>{ const latest=items.reduce((m,c)=>Math.max(m,c.createdAt||0),0); const cs={...(store.get('ju.checkinSeen',{})||{})}; if((cs[me]||0)<latest){ cs[me]=latest; store.set('ju.checkinSeen',cs); try{ Cloud.schedulePush&&Cloud.schedulePush(); }catch(_){} } },[items.length]);
  const save=(c)=>{ if(c.id) setItems(prev=>prev.map(x=>x.id===c.id?c:x)); else { setItems(prev=>[{...c,id:uid(),by:me,createdAt:Date.now()},...prev]); celebrate(['📸','💞','✨']); } setOpen(false);setEdit(null); };
  const del=(id)=>{ if(confirm('Xoá check-in này?')) setItems(prev=>prev.filter(x=>x.id!==id)); };
  const mapsUrl=(c)=>{ const q=[c.name,c.address].filter(Boolean).join(' '); return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(/hà nội|hanoi/i.test(q)?q:q+' Hà Nội'); };
  let shown=items.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')|| b.createdAt-a.createdAt);
  if(filter!=='all') shown=shown.filter(x=>x.type===filter);
  return (
    <div>
      <div className="row" style={{margin:'10px 14px'}}><span className="grow muted" style={{fontSize:12.5}}>Quán đã ghé · {items.length} lần</span>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>📸 Check-in mới</button></div>
      <div className="filters">
        <button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Tất cả</button>
        <button className={filter==='cafe'?'on':''} onClick={()=>setFilter('cafe')}>☕ Cafe</button>
        <button className={filter==='food'?'on':''} onClick={()=>setFilter('food')}>🍜 Quán ăn</button>
      </div>
      {shown.length===0 && <div className="empty"><span className="big">📸</span>Đến quán mới? Check-in + chấm điểm + lưu ảnh & địa chỉ ngay — kể cả quán chưa có trong danh sách!</div>}
      {shown.map(c=>{ const ps=photoList(c); const ms=(c.menuPhotos||[]).filter(Boolean); return (
        <div key={c.id} className="item">
          <PhotoShow photos={ps} big onView={i=>setView({photos:ps,i,title:'📷 '+c.name})}/>
          <div className="it-top"><h4>{c.type==='food'?'🍜':'☕'} {c.name}</h4>
            {typeof c.rating==='number'&&c.rating>0 && <Stars value={c.rating}/>}</div>
          {c.address && <div className="it-note muted">📍 {c.address}</div>}
          {c.review && <div className="it-note">{c.review}</div>}
          {ms.length>0 && <div style={{marginTop:6}}>
            <div className="phlab" style={{marginTop:0}}>📋 Menu · {ms.length} ảnh — chạm để xem giá</div>
            <PhotoShow photos={ms} onView={i=>setView({photos:ms,i,title:'📋 Menu · '+c.name})}/>
          </div>}
          <div className="it-meta">
            <span className="av-sm">{people[c.by]?.avatar||'❤️'}</span>
            {c.date && <span className="muted" style={{fontSize:12.5}}>{fmtDateVN(c.date)}</span>}
            <a className="pill" href={mapsUrl(c)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>🗺️ Google Maps</a>
            <span className="grow"></span>
            <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(c);setOpen(true);}}><Ic n="sua"/></button>
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(c.id)}><Ic n="xoa"/></button>
          </div>
        </div>
      ); })}
      <PhotoLightbox photos={view&&view.photos} index={view&&view.i} title={view&&view.title} onClose={()=>setView(null)}/>
      {open && <CheckInForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
    </div>
  );
}
function CheckInForm({init,onClose,onSave}){
  const [f,setF]=useState(()=>{
    if(!init) return {name:'',type:'cafe',address:'',rating:0,review:'',photos:[],menuPhotos:[],date:todayISO()};
    const b={...init,photos:photoList(init),menuPhotos:init.menuPhotos||[]};   // gộp ảnh cũ (1 ảnh) vào danh sách
    delete b.photo; return b;
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const [q,setQ]=useState(''); const [results,setResults]=useState([]); const [searching,setSearching]=useState(false);
  const tRef=useRef(null);
  const runSearch=(text)=>{ setQ(text); clearTimeout(tRef.current);
    if(text.trim().length<3){ setResults([]); return; }
    tRef.current=setTimeout(async()=>{ setSearching(true);
      try{ const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&accept-language=vi&countrycodes=vn&q='+encodeURIComponent(text)); setResults(await r.json()); }
      catch(e){ setResults([]); } setSearching(false);
    },550);
  };
  const pick=(r)=>{ const nm=(r.display_name||'').split(',')[0].trim();
    setF(p=>({...p,name:nm,address:(r.display_name||'').replace(/,?\s*Việt Nam$/,'').trim(),lat:parseFloat(r.lat),lng:parseFloat(r.lon)}));
    setResults([]); setQ(''); };
  return (
    <Sheet title={(init?'Sửa ':'')+'📸 Check-in quán'} onClose={onClose}>
      <div className="field"><label>🔎 Tìm quán (tự điền địa chỉ)</label>
        <input className="inp" autoFocus value={q} onChange={e=>runSearch(e.target.value)} placeholder="Gõ tên quán hoặc địa chỉ…"/>
        {searching && <div className="muted" style={{fontSize:12.5,marginTop:4}}>Đang tìm…</div>}
        {results.length>0 && <div className="card" style={{margin:'6px 0 0',padding:'2px 10px',maxHeight:190,overflow:'auto'}}>
          {results.map((r,i)=>(<div key={i} className="row" style={{padding:'8px 0',borderBottom:'1px solid var(--line)',cursor:'pointer',gap:8}} onClick={()=>pick(r)}>
            <span style={{fontSize:15}}>📍</span><span className="grow" style={{fontSize:12.5,lineHeight:1.3}}>{r.display_name}</span></div>))}
        </div>}
        <div className="muted" style={{fontSize:11,marginTop:3}}>Gợi ý từ OpenStreetMap — chọn xong vẫn sửa tên/địa chỉ bên dưới được.</div>
      </div>
      <div className="field"><label>Tên quán</label>
        <input className="inp" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="VD: Cafe Đinh / Bún chả ..."/></div>
      <div className="field"><label>Loại</label>
        <div className="emoji-row">
          <button className={f.type==='cafe'?'on':''} onClick={()=>set('type','cafe')} style={{width:'auto',padding:'8px 12px',fontSize:12.5}}>☕ Cafe</button>
          <button className={f.type==='food'?'on':''} onClick={()=>set('type','food')} style={{width:'auto',padding:'8px 12px',fontSize:12.5}}>🍜 Quán ăn</button>
        </div></div>
      <div className="field"><label>Địa chỉ</label>
        <input className="inp" value={f.address} onChange={e=>set('address',e.target.value)} placeholder="Số nhà, phố, quận… (để mở Google Maps)"/></div>
      <div className="field"><label>Đánh giá của hai đứa</label><div><Stars value={f.rating||0} onChange={v=>set('rating',v)}/></div></div>
      <div className="field"><label>📷 Ảnh quán (thêm bao nhiêu cũng được)</label>
        <PhotoPicker value={f.photos} onChange={v=>set('photos',v)} label="📷 Thêm ảnh" hint="chọn được nhiều ảnh một lần"/></div>
      <div className="field"><label>📋 Ảnh menu / bảng giá</label>
        <PhotoPicker value={f.menuPhotos} onChange={v=>set('menuPhotos',v)} label="📋 Thêm ảnh menu" hint="chụp tờ menu để lần sau khỏi đoán giá"/></div>
      <div className="field"><label>Ngày ghé</label>
        <input className="inp" type="date" value={f.date||''} onChange={e=>set('date',e.target.value)}/></div>
      <div className="field"><label>Nhận xét</label>
        <textarea className="inp" value={f.review} onChange={e=>set('review',e.target.value)} placeholder="Đồ uống/món ăn, không gian, giá, có quay lại không…"/></div>
      <button className="btn" onClick={()=>{ if(f.name.trim()) onSave(f); }}>📸 Lưu check-in</button>
    </Sheet>
  );
}

function DateIdeas({people,me}){
  const [items,setItems]=useLocal('ju.ideas',[]);
  const [events,setEvents]=useLocal('ju.events',[]);
  const [bFilter,setBFilter]=useState('');
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [pick,setPick]=useState(null);
  const [sugOpen,setSugOpen]=useState(false);
  const [planning,setPlanning]=useState(null);
  const [planDate,setPlanDate]=useState('');
  const schedule=()=>{ if(!planDate)return; setEvents(prev=>[{id:uid(),title:'Hẹn hò: '+planning.title,date:planDate,note:planning.note||'',remind:1,by:me,todos:[]},...prev]); celebrate(['📅','💞','✨']); setPlanning(null); setPlanDate(''); };

  const save=(it)=>{
    if(it.id) setItems(prev=>prev.map(x=>x.id===it.id?it:x));
    else setItems(prev=>[{...it,id:uid(),by:me,fav:false,done:false,createdAt:Date.now()},...prev]);
    setOpen(false);setEdit(null);
  };
  const addIdea=(title,budget,note)=> setItems(prev=>[{title,budget,note:note||'',id:uid(),by:me,fav:false,done:false,createdAt:Date.now()},...prev]);
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const toggle=(id,f)=>setItems(prev=>prev.map(x=>x.id===id?{...x,[f]:!x[f]}:x));

  const pool=bFilter?items.filter(x=>x.budget===bFilter):items;
  const shown=pool.slice().sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)||b.createdAt-a.createdAt);
  const [wnote,setWnote]=useState('');
  const [wbusy,setWbusy]=useState(false);
  const random=async()=>{
    let arr;
    if(pool.length) arr=pool;
    else if(bFilter) arr=(IDEA_SUGGEST[bFilter]||[]).map(t=>({title:t,budget:bFilter}));
    else arr=[].concat.apply([],Object.keys(IDEA_SUGGEST).map(k=>IDEA_SUGGEST[k].map(t=>({title:t,budget:k}))));
    if(!arr.length) return;
    setWbusy(true);
    const w=await getWeather(GIANGVO.lat,GIANGVO.lng);
    setWbusy(false);
    let filtered=arr, note='';
    if(w){
      if(w.storm){ filtered=arr.filter(x=>ideaOutdoor(x.title)===false); note='⛈️ '+w.text+' '+w.temp+'° — chỉ gợi ý trong nhà'; }
      else if(w.rain){ filtered=arr.filter(x=>ideaOutdoor(x.title)!==true); note='🌧️ '+w.text+' '+w.temp+'° — ưu tiên trong nhà'; }
      else if(w.rainSoon){ filtered=arr.filter(x=>ideaOutdoor(x.title)!==true); note='☔ Sắp mưa ('+w.rainSoonP+'% trong vài giờ) '+w.temp+'° — ưu tiên trong nhà'; }
      else if(w.temp>=35){ filtered=arr.filter(x=>ideaOutdoor(x.title)!==true); note='🥵 Nắng nóng '+w.temp+'° — ưu tiên trong nhà/có điều hoà'; }
      else { note=w.icon+' '+w.text+' '+w.temp+'° — thời tiết đẹp, thoải mái ra ngoài'; }
      if(!filtered.length) filtered=arr;
      note+=' · nguồn '+w.src;
    } else { note='(Không lấy được thời tiết — gợi ý ngẫu nhiên)'; }
    setWnote(note);
    setPick(filtered[Math.floor(Math.random()*filtered.length)]);
  };

  return (
    <div>
      <div className="filters">
        <button className={bFilter===''?'on':''} onClick={()=>setBFilter('')}>Mọi mức</button>
        {BUDGETS.map(b=><button key={b.k} className={bFilter===b.k?'on':''} onClick={()=>setBFilter(b.k)}>{b.label}</button>)}
      </div>
      <div className="row" style={{margin:'10px 14px',gap:8}}>
        <button className="btn grow" onClick={random} disabled={wbusy}>{wbusy?'⏳ Xem thời tiết…':'🎲 Gợi ý theo thời tiết'}</button>
        <button className="btn sm soft" onClick={()=>setSugOpen(true)}>💡 Thư viện</button>
        <button className="btn sm soft" onClick={()=>{setEdit(null);setOpen(true);}}>＋</button>
      </div>
      {pick && (()=>{ const pl=ideaPlace(pick.title,pick.budget); const placeNote=pl?('📍 '+pl.n+' · '+pl.area):'';
        const mapQ=pl?(pl.n+', '+pl.area+', Hà Nội'):(pick.title+' gần Núi Trúc, Hà Nội');
        return (
        <div className="card center" style={{borderColor:'var(--primary)',borderWidth:2}}>
          {wnote && <div className="muted" style={{fontSize:12.5,marginBottom:4}}>{wnote}</div>}
          <div className="muted" style={{fontSize:12.5}}>🎲 Hôm nay nên…</div>
          <div style={{fontSize:20,fontWeight:800,margin:'6px 0'}}>{pick.title}</div>
          {pick.budget && <span className="pill">{budgetLabel(pick.budget)}</span>}
          {pl
            ? <div className="muted" style={{fontSize:12.5,marginTop:8}}>📍 Gợi ý chỗ: <b>{pl.n}</b> · {pl.area}{pl.p?' · 💵 '+pl.p+((''+pl.p).indexOf('/')<0?'/người':''):''}</div>
            : <div className="muted" style={{fontSize:12.5,marginTop:8}}>Bấm 🗺️ để tìm chỗ phù hợp gần nhà.</div>}
          {pick.note && <div className="it-note" style={{marginTop:6}}>{pick.note}</div>}
          <div className="row" style={{justifyContent:'center',gap:8,marginTop:10,flexWrap:'wrap'}}>
            <a className="pill" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQ)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>🗺️ {pl?'Chỉ đường':'Tìm chỗ gần nhà'}</a>
            <button className="pill" onClick={()=>{ addIdea(pick.title,pick.budget,placeNote); celebrate(['💾','💡']); }}>💾 Lưu</button>
            <button className="pill" onClick={()=>{ setPlanning({title:pick.title,note:placeNote}); setPlanDate(''); }}>📅 Lên lịch</button>
          </div>
        </div>); })()}
      {shown.length===0 && <div className="empty"><span className="big">💡</span>Thêm ý tưởng hẹn hò theo từng mức ngân sách.</div>}
      {shown.map(it=>(
        <div key={it.id} className={'item'+(it.done?' dn':'')}>
          <div className="it-top">
            <h4>{it.title}</h4>
            <button className={'heartbtn'+(it.fav?' on':'')} aria-label={it.fav?'Bỏ thích':'Thích'} onClick={()=>toggle(it.id,'fav')}><Ic n={it.fav?'tim':'timrong'} size={18}/></button>
          </div>
          {it.note && <div className="it-note">{it.note}</div>}
          <div className="it-meta">
            <span className="av-sm">{people[it.by]?.avatar||'❤️'}</span>
            {it.budget && <span className="pill">{budgetLabel(it.budget)}</span>}
            <span className="grow"></span>
            <button className="pill" onClick={()=>{setPlanning(it);setPlanDate('');}}>📅 Lên lịch</button>
            <button className="pill" onClick={()=>toggle(it.id,'done')}>{it.done?'↩︎ Bỏ':'✓ Đã đi'}</button>
            <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(it);setOpen(true);}}><Ic n="sua"/></button>
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(it.id)}><Ic n="xoa"/></button>
          </div>
        </div>
      ))}
      {open && <ItemForm title={(edit?'Sửa ':'Thêm ')+'ý tưởng hẹn hò'} init={edit} fields={['budget','note']}
        onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}

      {sugOpen && <Sheet title="💡 Thư viện ý tưởng hẹn hò" onClose={()=>setSugOpen(false)}>
        {BUDGETS.map(b=>{
          const left=(IDEA_SUGGEST[b.k]||[]).filter(s=>!items.some(it=>(it.title||'').trim().toLowerCase()===s.toLowerCase()));
          if(left.length===0) return null;
          return (
            <div key={b.k} style={{marginBottom:12}}>
              <div className="muted" style={{fontSize:12.5,fontWeight:800,margin:'4px 0 6px'}}>{b.label}</div>
              <div>{left.map(s=>(
                <button key={s} className="pill" style={{margin:'3px 6px 3px 0',padding:'7px 11px',fontSize:12.5}}
                  onClick={()=>addIdea(s,b.k)}>＋ {s}</button>
              ))}</div>
            </div>
          );
        })}
        <div className="muted center" style={{fontSize:12.5}}>Chạm để thêm vào danh sách của hai bạn.</div>
      </Sheet>}

      {planning && <Sheet title={'📅 Lên lịch: '+planning.title} onClose={()=>setPlanning(null)}>
        <div className="muted" style={{fontSize:12.5,marginBottom:10}}>Chọn ngày hẹn — sẽ tạo một sự kiện và nhắc trước 1 ngày.</div>
        <div className="field"><label>Ngày hẹn hò</label>
          <input className="inp" type="date" value={planDate} onChange={e=>setPlanDate(e.target.value)} autoFocus/></div>
        <button className="btn" onClick={schedule}>💞 Tạo lịch hẹn</button>
      </Sheet>}
    </div>
  );
}

/* ============ Map spots ============ */
/* ============ Tab: Tụi mình ============ */
/* ============ Dòng thời gian tình yêu ============ */
function Timeline({people,me}){
  const [items,setItems]=useLocal('ju.timeline',[]);
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const save=(it)=>{ if(it.id) setItems(prev=>prev.map(x=>x.id===it.id?it:x)); else setItems(prev=>[...prev,{...it,id:uid(),by:me,createdAt:Date.now()}]); setOpen(false); setEdit(null); };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const shown=items.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  return (
    <div>
      <div className="row" style={{margin:'10px 14px'}}><span className="grow muted" style={{fontSize:12.5}}>Những cột mốc của hai đứa 💞</span>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm mốc</button></div>
      {shown.length===0 && <div className="empty"><span className="big">🕰️</span>Lần đầu gặp, ngày yêu, chuyến đi đầu tiên, ngày cưới… ghi lại hành trình nhé!</div>}
      {shown.length>0 && (
        <div style={{margin:'6px 22px 10px',borderLeft:'2px solid var(--line)',paddingLeft:18}}>
          {shown.map(it=>(
            <div key={it.id} style={{position:'relative',paddingBottom:14}}>
              <div style={{position:'absolute',left:-28,top:0,width:20,height:20,borderRadius:'50%',background:'var(--primary)',display:'grid',placeItems:'center',fontSize:11,boxShadow:'0 0 0 3px var(--bg)'}}>{it.icon||'💗'}</div>
              <div className="card" style={{margin:0,padding:'10px 12px'}}>
                <div className="row"><b style={{fontSize:14,flex:1}}>{it.title}</b>
                  <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(it);setOpen(true);}}><Ic n="sua"/></button>
                  <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(it.id)}><Ic n="xoa"/></button></div>
                <div className="muted" style={{fontSize:12.5,marginTop:2}}>{fmtDateVN(it.date)}</div>
                {it.photo && <PhotoImg photo={it.photo} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:10,marginTop:8,display:'block'}}/>}
                {it.note && <div className="it-note">{it.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && <TimelineForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
    </div>
  );
}
function TimelineForm({init,onClose,onSave}){
  const ICONS=['💗','💑','💍','🏠','✈️','🎁','🌹','🎓','👶','🐾','🎉','📸'];
  const [f,setF]=useState(()=>init?{...init}:{title:'',date:'',note:'',icon:'💗',photo:null});
  const [busy,setBusy]=useState(false);
  const fileRef=useRef(null);
  const onFile=async(e)=>{
    const file=e.target.files[0]; if(!file)return; e.target.value='';
    setBusy(true);
    try{
      if(Cloud.connected()){ const path=await Cloud.uploadPhoto(file); setF(p=>({...p,photo:{path}})); setBusy(false); }
      else { const r=new FileReader(); r.onload=()=>{ setF(p=>({...p,photo:{src:r.result}})); setBusy(false); }; r.readAsDataURL(file); }
    }catch(err){ setBusy(false); }
  };
  return (
    <Sheet title={(init?'Sửa ':'Thêm ')+'cột mốc'} onClose={onClose}>
      <div className="field"><label>Cột mốc</label>
        <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Lần đầu gặp nhau"/></div>
      <div className="field"><label>Ngày</label>
        <input className="inp" type="date" value={f.date||''} onChange={e=>setF({...f,date:e.target.value})}/></div>
      <div className="field"><label>Biểu tượng</label>
        <div className="emoji-row">{ICONS.map(i=><button key={i} className={f.icon===i?'on':''} onClick={()=>setF({...f,icon:i})}>{i}</button>)}</div></div>
      <div className="field"><label>Ảnh kỷ niệm (tuỳ chọn)</label>
        {f.photo
          ? <div style={{position:'relative'}}>
              <PhotoImg photo={f.photo} style={{width:'100%',height:150,objectFit:'cover',borderRadius:12,display:'block'}}/>
              <button className="pill" style={{position:'absolute',top:6,right:6}} onClick={()=>setF(p=>({...p,photo:null}))}>✕ Bỏ ảnh</button>
            </div>
          : <button className="btn soft" onClick={()=>fileRef.current.click()}>{busy?'Đang tải…':'📷 Thêm ảnh'}</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/></div>
      <div className="field"><label>Kỷ niệm / ghi chú</label>
        <textarea className="inp" value={f.note||''} onChange={e=>setF({...f,note:e.target.value})} placeholder="Hôm đó thế nào…"/></div>
      <button className="btn" onClick={()=>{ if(f.title.trim()&&f.date) onSave(f); }}>💾 Lưu</button>
    </Sheet>
  );
}

/* ============ Chia việc nhà ============ */
const CHORE_SUGGEST=[
  {group:'🍳 Bếp núc',items:['Nấu cơm','Rửa bát','Đi chợ / mua thực phẩm','Lau bếp & bàn ăn','Đổ rác']},
  {group:'🧹 Dọn dẹp',items:['Quét & lau nhà','Hút bụi','Dọn phòng khách','Cọ nhà vệ sinh','Sắp xếp đồ đạc']},
  {group:'👕 Giặt giũ',items:['Giặt quần áo','Phơi & gấp đồ','Là (ủi) quần áo']},
  {group:'🧸 Chăm con',items:['Tắm cho con','Cho con ăn','Dỗ con ngủ','Đưa / đón con đi lớp','Chơi cùng con']},
  {group:'📦 Việc khác',items:['Thanh toán hoá đơn','Chăm cây','Bảo dưỡng / rửa xe','Mua đồ dùng gia đình']},
];
function Chores({people,me}){
  const [items,setItems]=useLocal('ju.chores',[]);
  const [t,setT]=useState('');
  const [who,setWho]=useState('both');
  const [sugOpen,setSugOpen]=useState(()=>((store.get('ju.chores',[])||[]).length===0));
  const has=(title)=>items.some(x=>x.title===title);
  const addSug=(title)=>{ if(has(title))return; setItems(prev=>[{id:uid(),title,who:'both',done:false,by:me,createdAt:Date.now()},...prev]); };
  const add=()=>{ if(!t.trim())return; setItems(prev=>[{id:uid(),title:t.trim(),who,done:false,by:me,createdAt:Date.now()},...prev]); setT(''); };
  const toggle=(id)=>setItems(prev=>prev.map(x=>x.id===id?{...x,done:!x.done}:x));
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const resetAll=()=>setItems(prev=>prev.map(x=>({...x,done:false})));
  const whoLabel=(w)=> w==='a'?people.a.name : w==='b'?people.b.name : 'Cả hai';
  const whoAv=(w)=> w==='a'?people.a.avatar : w==='b'?people.b.avatar : '👫';
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🧹 Chia việc nhà cho công bằng — ai làm việc gì.</div>
      <div className="row" style={{margin:'0 14px',gap:6}}>
        <input className="inp grow" placeholder="Thêm việc nhà…" value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <select className="inp" style={{width:92,flex:'0 0 auto'}} value={who} onChange={e=>setWho(e.target.value)}>
          <option value="both">Cả hai</option><option value="a">{people.a.name}</option><option value="b">{people.b.name}</option>
        </select>
        <button className="btn sm" onClick={add}>＋</button>
      </div>
      <div className="card">
        <div className="row"><span className="grow" style={{fontSize:12.5,fontWeight:600}}>💡 Gợi ý việc nhà — chia theo khu vực</span>
          <button className="muted" style={{fontSize:11}} onClick={()=>setSugOpen(v=>!v)}>{sugOpen?'▲ Ẩn':'▾ Xem'}</button></div>
        {sugOpen && <div style={{marginTop:2}}>
          <div className="muted" style={{fontSize:11,margin:'2px 0 8px'}}>Bấm để thêm nhanh, rồi giao cho từng người cho công bằng.</div>
          {CHORE_SUGGEST.map(gr=>(
            <div key={gr.group} style={{marginBottom:9}}>
              <div className="muted" style={{fontSize:11,marginBottom:4}}>{gr.group}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {gr.items.map(name=>{ const added=has(name); return <button key={name} className="pill" disabled={added} style={added?{opacity:.45}:{cursor:'pointer'}} onClick={()=>addSug(name)}>{added?'✓ ':'＋ '}{name}</button>; })}
              </div>
            </div>
          ))}
        </div>}
      </div>
      {items.length===0 && <div className="empty"><span className="big">🧹</span>Chưa có việc nào. Thêm tay hoặc bấm 💡 Gợi ý ở trên rồi chia cho công bằng nhé!</div>}
      {items.length>0 && <div className="row" style={{margin:'12px 14px 0'}}><span className="grow muted" style={{fontSize:12.5}}>{items.filter(x=>!x.done).length} việc chưa xong</span>
        <button className="pill" onClick={resetAll}>↻ Đặt lại tất cả</button></div>}
      <div className="card" style={{padding:'4px 13px'}}>
        {items.map(x=>(
          <div key={x.id} className="row" style={{padding:'9px 0',borderBottom:'1px solid var(--line)'}}>
            <button onClick={()=>toggle(x.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={x.done?'dadanh':'chuadanh'} size={18}/>}</button>
            <span className="grow" style={{textDecoration:x.done?'line-through':'none',opacity:x.done?.55:1}}>{x.title}</span>
            <span className="pill">{whoAv(x.who)} {whoLabel(x.who)}</span>
            <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)} style={{marginLeft:6}}><Ic n="dong" size={15}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Mục tiêu chung (có các bước) ============ */
function Goals({people,me}){
  const [goals,setGoals]=useLocal('ju.goals',[]);
  const [open,setOpen]=useState(false);
  const save=(g)=>{ setGoals(prev=>[{...g,id:uid(),by:me,steps:[],createdAt:Date.now()},...prev]); setOpen(false); };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setGoals(prev=>prev.filter(x=>x.id!==id)); } };
  const addStep=(gid,text)=>setGoals(prev=>prev.map(g=>g.id===gid?{...g,steps:[...(g.steps||[]),{id:uid(),text,done:false}]}:g));
  const toggleStep=(gid,sid)=>setGoals(prev=>prev.map(g=>{ if(g.id!==gid) return g; const cur=g.steps||[]; const steps=cur.map(s=>s.id===sid?{...s,done:!s.done}:s); if(steps.length&&steps.every(s=>s.done)&&!cur.every(s=>s.done)) celebrate(['🏆','🎉','💞','✨']); return {...g,steps}; }));
  const delStep=(gid,sid)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setGoals(prev=>prev.map(g=>g.id===gid?{...g,steps:(g.steps||[]).filter(s=>s.id!==sid)}:g)); } };
  return (
    <div>
      <div className="row" style={{margin:'10px 14px'}}><span className="grow muted" style={{fontSize:12.5}}>Mục tiêu hai đứa cùng theo đuổi 🎯</span>
        <button className="btn sm" onClick={()=>setOpen(true)}>＋ Thêm</button></div>
      {goals.length===0 && <div className="empty"><span className="big">🏆</span>VD: học tiếng Anh, tập gym cùng nhau, tiết kiệm mua nhà… chia thành các bước nhỏ.</div>}
      {goals.map(g=>{
        const total=(g.steps||[]).length, done=(g.steps||[]).filter(s=>s.done).length;
        const pct=total?Math.round(done/total*100):0;
        return (
          <div key={g.id} className="item">
            <div className="it-top"><h4>{g.title}</h4><span className="pill">{pct}%</span></div>
            {g.note && <div className="it-note">{g.note}</div>}
            {total>0 && <div className="prog"><i style={{width:pct+'%'}}></i></div>}
            <div style={{marginTop:8}}>
              {(g.steps||[]).map(s=>(
                <div key={s.id} className="row" style={{padding:'3px 0'}}>
                  <button onClick={()=>toggleStep(g.id,s.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={s.done?'dadanh':'chuadanh'} size={15}/>}</button>
                  <span className={'grow'+(s.done?' dim':'')} style={{fontSize:14,textDecoration:s.done?'line-through':'none'}}>{s.text}</span>
                  <button className="muted tapmin" aria-label="Xoá" onClick={()=>delStep(g.id,s.id)}><Ic n="dong" size={15}/></button>
                </div>
              ))}
              <TodoAdd onAdd={(t)=>addStep(g.id,t)}/>
            </div>
            <div className="it-meta"><span className="av-sm">{people[g.by]?.avatar}</span><span className="grow"></span>
              <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(g.id)}><Ic n="xoa"/></button></div>
          </div>
        );
      })}
      {open && <BigGoalForm onClose={()=>setOpen(false)} onSave={save}/>}
    </div>
  );
}
function BigGoalForm({onClose,onSave}){
  const [f,setF]=useState({title:'',note:''});
  return (
    <Sheet title="Thêm mục tiêu chung" onClose={onClose}>
      <div className="field"><label>Mục tiêu</label>
        <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Cùng học tiếng Anh"/></div>
      <div className="field"><label>Ghi chú</label>
        <textarea className="inp" value={f.note} onChange={e=>setF({...f,note:e.target.value})} placeholder="(tuỳ chọn)"/></div>
      <button className="btn" onClick={()=>{ if(f.title.trim()) onSave(f); }}>💾 Lưu (thêm các bước sau)</button>
    </Sheet>
  );
}

/* ============ Tab: Nói chuyện ============ */
function TalkTopics(){
  const [cat,setCat]=useState(TALK_TOPICS[0].k);
  const group=TALK_TOPICS.find(t=>t.k===cat)||TALK_TOPICS[0];
  const [topic,setTopic]=useState(()=>TALK_TOPICS[0].list[Math.floor(Math.random()*TALK_TOPICS[0].list.length)]);
  const pick=(g)=>{ const gg=g||group; setTopic(gg.list[Math.floor(Math.random()*gg.list.length)]); };
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🗣️ Chọn chủ đề rồi cùng nhau trò chuyện sâu hơn.</div>
      <div className="filters">
        {TALK_TOPICS.map(t=><button key={t.k} className={cat===t.k?'on':''} onClick={()=>{ setCat(t.k); pick(t); }}>{t.icon} {t.k}</button>)}
      </div>
      <div className="card center" style={{borderColor:'var(--primary)',borderWidth:2}}>
        <div style={{fontSize:30}}>{group.icon}</div>
        <div style={{fontSize:16.5,fontWeight:700,margin:'8px 0',lineHeight:1.4}}>{topic}</div>
        <button className="btn soft" onClick={()=>pick()}>🔄 Câu khác</button>
      </div>
      <div className="sec-title">Tất cả chủ đề · {group.k}</div>
      {group.list.map((t,i)=><div key={i} className="item" style={{padding:'10px 13px',fontSize:14}}>{group.icon} {t}</div>)}
      <div style={{height:8}}></div>
    </div>
  );
}
/* ============ Mong nhau một chút (điều mong ở nửa kia) ============ */
function PartnerWishes({people,me}){
  const [items,setItems]=useLocal('ju.partnerWishes',[]);
  const [t,setT]=useState('');
  const partner=me==='a'?'b':'a';
  const add=()=>{ if(!t.trim())return; setItems(prev=>[{id:uid(),by:me,text:t.trim(),done:false,createdAt:Date.now()},...prev]); setT(''); celebrate(['💛']); };
  const toggle=(id)=>setItems(prev=>prev.map(x=>x.id===id?{...x,done:!x.done}:x));
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const mine=items.filter(x=>x.by===me);
  const forMe=items.filter(x=>x.by===partner);
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>💛 Mỗi người viết thật nhẹ một điều mong ở nửa kia — để cùng nhau tốt hơn mỗi ngày. Nửa kia sẽ thấy lời nhắc dễ thương này ở Trang chủ.</div>
      <div className="row" style={{margin:'0 14px',gap:6}}>
        <input className="inp grow" placeholder={'Mình mong '+(people[partner].name||'nửa kia')+'…'} value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <button className="btn sm" onClick={add}>＋</button>
      </div>
      <div className="sec-title">💛 Mình mong ở {people[partner].name}</div>
      {mine.length===0 && <div className="empty muted">Chưa có điều nào — viết nhẹ nhàng & cụ thể nhé.</div>}
      {mine.map(x=>(
        <div key={x.id} className="item"><div className="row"><span className="grow" style={{fontSize:14,textDecoration:x.done?'line-through':'none',opacity:x.done?.6:1}}>{x.text}</span>
          {x.done && <span className="pill" style={{background:'var(--good)',color:'#fff'}}>đã cố ✓</span>}
          <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)} style={{marginLeft:6}}><Ic n="dong" size={15}/></button></div></div>
      ))}
      <div className="sec-title">🌷 {people[partner].name} mong ở mình</div>
      {forMe.length===0 && <div className="empty muted">Chưa có gì — nửa kia chưa viết điều nào.</div>}
      {forMe.map(x=>(
        <div key={x.id} className="item"><div className="row"><span style={{fontSize:16}}>{x.done?'✅':'🌱'}</span>
          <span className="grow" style={{fontSize:14,textDecoration:x.done?'line-through':'none'}}>{x.text}</span>
          <button className="pill" onClick={()=>toggle(x.id)}>{x.done?'↩︎':'Mình sẽ cố 💪'}</button></div></div>
      ))}
    </div>
  );
}
function PartnerWishCard({people,me}){
  const [items]=useLocal('ju.partnerWishes',[]);
  const partner=me==='a'?'b':'a';
  const forMe=items.filter(x=>x.by===partner&&!x.done);
  if(!forMe.length) return null;
  const w=forMe[dayNumber()%forMe.length];
  return (
    <div className="card" style={{borderLeft:'4px solid var(--primary)',background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
      <div className="row"><span className="hc-title">💛 {people[partner].name} mong ở bạn 🌷</span></div>
      <div className="hc-lead" style={{margin:'6px 0 0'}}>{w.text}</div>
    </div>
  );
}
/* ============ Hướng dẫn giao tiếp vợ chồng ============ */
const COMM_TIPS=[
  {icon:'☀️',title:'Chào nhau tử tế mỗi ngày',text:'Một câu chào buổi sáng và một cái ôm khi về nhà nghe thì nhỏ, nhưng lặp lại mỗi ngày sẽ nuôi cảm giác được chờ đợi và được nhớ tới. Đừng để sự quen thuộc làm mình quên những cử chỉ ấm áp nhỏ.'},
  {icon:'🎈',title:'Giữ những buổi hẹn riêng',text:'Dù bận tới đâu, hãy giữ cho hai đứa những buổi hẹn chỉ có nhau — một bữa tối, một buổi cà phê. Không gian riêng giúp mình trò chuyện sâu hơn là chỉ nhắc nhau chuyện cơm áo mỗi ngày.'},
  {icon:'🌿',title:'Cho nhau khoảng thở',text:'Yêu nhau không có nghĩa là lúc nào cũng phải dính lấy nhau. Tôn trọng lúc người kia cần ở một mình hay theo đuổi sở thích riêng, rồi quay lại với nhau, sẽ khiến hai đứa trân trọng nhau hơn.'},
  {icon:'👂',title:'Lắng nghe thật sự',text:'Khi nửa kia nói, hãy gác điện thoại, nhìn vào mắt và lắng nghe để HIỂU — đừng vội phản bác hay đưa giải pháp. Nhiều khi người ấy chỉ cần được lắng nghe.'},
  {icon:'💬',title:'Nói “mình” thay vì “bạn”',text:'Thay vì “Anh lúc nào cũng…”, hãy nói “Em thấy buồn khi…”. Nói về cảm xúc của mình giúp tránh đổ lỗi, đối phương dễ tiếp nhận hơn.'},
  {icon:'⏳',title:'Chọn đúng thời điểm',text:'Đừng bàn chuyện căng khi một trong hai đang đói, mệt hay đang giận. Hẹn lúc cả hai bình tĩnh để nói cho rõ.'},
  {icon:'🤝',title:'Tìm giải pháp, không tìm người thắng',text:'Mâu thuẫn không phải cuộc thi. Hỏi “mình cùng làm gì để tốt hơn?” thay vì cố chứng minh ai đúng ai sai.'},
  {icon:'🙏',title:'Xin lỗi & tha thứ',text:'Một lời xin lỗi chân thành và sự bao dung hàn gắn nhanh hơn mọi lý lẽ. Không ai hoàn hảo cả.'},
  {icon:'❤️',title:'Khen nhiều hơn chê',text:'Nói cảm ơn và khen những điều nhỏ mỗi ngày. Càng nhiều lời tích cực, tình cảm càng bền.'},
  {icon:'⏸️',title:'Biết tạm dừng',text:'Khi quá nóng, hãy xin “mình tạm dừng 15 phút” rồi quay lại. Tạm dừng để bình tĩnh, không phải để bỏ đi.'},
  {icon:'🎯',title:'Một chuyện một lần',text:'Đang nói chuyện này thì đừng lôi chuyện cũ ra. Giải quyết gọn từng việc, đừng dồn cục.'},
  {icon:'🫶',title:'Chạm & gần gũi',text:'Một cái ôm, nắm tay, vỗ vai đúng lúc nói được nhiều hơn lời. Giữ kết nối thể chất mỗi ngày.'},
  {icon:'📅',title:'Hẹn “họp gia đình” nhẹ',text:'Mỗi tuần dành 15 phút nói về điều vui, điều cần cải thiện. Đều đặn giúp vấn đề không dồn lại.'},
  {icon:'🔁',title:'Nói lại để chắc đã hiểu',text:'Sau khi nghe, hãy thử nhắc lại ý của người kia bằng lời mình: “Ý em là… đúng không?”. Cách này tránh hiểu lầm và cho thấy bạn thực sự quan tâm.'},
  {icon:'🌡️',title:'Gọi tên cảm xúc',text:'Thay vì im lặng hờn dỗi, hãy nói rõ “mình đang thấy hơi tủi thân”. Khi cảm xúc được gọi tên, cả hai dễ tìm cách xử lý hơn là đoán mò.'},
  {icon:'🎁',title:'Hiểu “ngôn ngữ yêu thương”',text:'Có người cần lời khen, người cần hành động, người cần thời gian bên nhau. Hỏi xem điều gì khiến nửa kia thấy được yêu nhất rồi làm đúng điều đó.'},
  {icon:'📵',title:'Cất điện thoại khi trò chuyện',text:'Khi nói chuyện quan trọng, hãy úp điện thoại xuống. Sự chú ý trọn vẹn là món quà lớn cho người kia và giúp câu chuyện đi tới nơi tới chốn.'},
  {icon:'🌙',title:'Không đi ngủ khi còn giận',text:'Cố gắng làm hoà trước khi tắt đèn, dù chỉ là một câu “mai mình nói tiếp nhé”. Đừng để cơn giận qua đêm biến thành khoảng cách.'},
  {icon:'❓',title:'Hỏi trước khi kết luận',text:'Thay vì đoán ý xấu, hãy hỏi “ý anh/em là sao?”. Rất nhiều mâu thuẫn chỉ là hiểu lầm chưa được hỏi cho rõ.'},
  {icon:'🕯️',title:'Nhắc điều tốt trước khi góp ý',text:'Trước khi nói điều chưa hài lòng, hãy kể một điều bạn trân trọng ở người kia. Bắt đầu bằng sự tích cực giúp câu chuyện dễ đi vào lòng hơn.'},
  {icon:'📝',title:'Viết ra khi khó nói',text:'Có những điều nói trực tiếp dễ nghẹn lời — thử viết một mẩu giấy hay tin nhắn dài cho nhau. Viết giúp mình sắp xếp suy nghĩ rõ ràng hơn.'},
  {icon:'🤔',title:'Nói thẳng điều mình cần',text:'Trước khi trách người kia, hãy tự hỏi mình đang thật sự cần gì rồi nói rõ nhu cầu đó. Người kia không đọc được suy nghĩ của bạn đâu.'},
  {icon:'🔋',title:'Nạp lại năng lượng cho nhau',text:'Sau một ngày mệt, hãy hỏi nhau “hôm nay em/anh cần gì để dễ chịu hơn?” rồi đáp ứng một điều nhỏ. Chăm nhau đúng lúc kiệt sức gắn kết hơn ngàn lời nói.'},
  {icon:'🗓️',title:'Khen ngay, đừng để dành',text:'Thấy nửa kia làm điều tốt thì khen liền lúc đó, đừng đợi dịp đặc biệt. Lời khen đúng thời điểm có sức nặng gấp nhiều lần.'},
  {icon:'🧭',title:'Thống nhất trước mặt người ngoài',text:'Có bất đồng thì góp ý nhau lúc riêng tư; trước mặt con cái hay họ hàng luôn đứng về một phía. Giữ thể diện cho nhau là giữ niềm tin cho nhau.'},
  {icon:'🤜🤛',title:'Cùng phe, không đối đầu',text:'Khi có vấn đề, hãy hình dung hai đứa ngồi cùng một phía nhìn vào chuyện đó như một việc phải cùng giải quyết, thay vì đứng hai đầu chiến tuyến chỉ tay vào nhau.'},
  {icon:'🩹',title:'Hỏi "cần nghe hay cần cách giải quyết"',text:'Trước khi vội đưa lời khuyên, hãy hỏi "em/anh muốn anh/em lắng nghe hay cùng tìm cách?". Nhiều khi người kia chỉ cần được thấu hiểu chứ chưa cần giải pháp.'},
  {icon:'🌟',title:'Reo vui cùng tin vui của nhau',text:'Khi người kia khoe một chuyện vui, hãy hào hứng thật lòng và hỏi thêm về nó. Cách mình đón nhận niềm vui của nhau nuôi dưỡng sự gắn kết chẳng kém gì lúc an ủi nhau.'},
  {icon:'🔑',title:'Giữ những lời hứa nhỏ',text:'Nhớ mua giúp gói cà phê, gọi lại đúng giờ đã hẹn... những lời hứa nhỏ giữ đúng chính là viên gạch xây nên niềm tin lớn. Đừng hứa cho qua rồi quên.'},
];
const COMM_SAY=[
  {x:'Em/anh chẳng bao giờ hỏi han gì anh/em cả.', y:'Dạo này em/anh mong được anh/em hỏi thăm nhiều hơn một chút thôi.'},
  {x:'Sao lúc nào cũng phải nhắc mới làm?', y:'Mình cùng chia sẵn việc từ đầu tuần cho đỡ phải nhắc nhau nhé.'},
  {x:'Anh/em thấy chưa, em/anh nói đúng mà!', y:'Chuyện này mình cùng rút kinh nghiệm, lần sau đỡ vướng hơn nhé.'},
  {x:'Mệt với em/anh lắm rồi.', y:'Giờ em/anh hơi đuối, cho em/anh nghỉ chút rồi mình nói tiếp cho rõ nhé.'},
  {x:'Anh/em lúc nào cũng như thế!', y:'Em/anh thấy buồn khi chuyện này lặp lại. Mình cùng nghĩ cách nhé?'},
  {x:'Sao em/anh không bao giờ giúp gì cả?', y:'Em/anh sẽ vui lắm nếu thỉnh thoảng mình cùng làm việc này.'},
  {x:'Em/anh sai rồi!', y:'Mình đang nhìn chuyện này khác nhau, kể anh/em nghe góc của em/anh với.'},
  {x:'Tùy em/anh.', y:'Em/anh thật sự muốn nghe ý anh/em, mình quyết cùng nhau nhé.'},
  {x:'Có gì đâu mà phải nói.', y:'Em/anh đang hơi rối, cho em/anh chút thời gian rồi mình nói nhé.'},
  {x:'Đáng lẽ em/anh phải tự biết chứ!', y:'Lần sau mình nói rõ mong muốn để cả hai đỡ phải đoán nhau nha.'},
  {x:'Em/anh chẳng quan tâm gì cả.', y:'Dạo này em/anh thấy thiếu sự quan tâm, mình dành thời gian cho nhau hơn nhé.'},
  {x:'Im đi, anh/em mệt rồi!', y:'Anh/em đang mệt quá, cho anh/em nghỉ chút rồi mình nói tiếp được không?'},
  {x:'Lúc nào cũng tại em/anh.', y:'Chuyện này cả hai đều có phần, mình cùng sửa cho lần sau nhé.'},{x:'Sao lúc nào cũng để tôi làm hết vậy?',y:'Mình chia việc lại nhé, dạo này em/anh đuối thật rồi.'},{x:'Em/anh chẳng hiểu gì cả.',y:'Chắc em/anh nói chưa rõ ý, để nói lại cách khác nhé.'},{x:'Chuyện nhỏ vậy mà cũng làm quá lên.',y:'Với em/anh chuyện này quan trọng, mình nói cho hết nhé.'},{x:'Tùy em/anh.',y:'Em/anh nghĩ sao cứ nói thật, anh/em muốn nghe.'},{x:'Mẹ anh/em lại thế rồi.',y:'Chuyện với mẹ làm em/anh khó xử, mình bàn cách cư xử nhẹ nhàng nhé.'},{x:'Anh/em có nghe không đấy?',y:'Anh/em dừng điện thoại chút nghe em/anh nói nhé?'},{x:'Việc đó dễ mà, làm đi.',y:'Em/anh cần giúp phần này, mình làm cùng cho nhanh nhé.'},{x:'Lúc nào cũng viện lý do.',y:'Nghe hơi giống lý do, mình tìm cách giải quyết thật nhé.'},{x:'Thôi khỏi nói nữa.',y:'Giờ em/anh hơi nóng, cho 15 phút rồi mình nói tiếp nhé.'},{x:'Con hư tại anh/em đấy.',y:'Mình thống nhất cách dạy con để nhất quán hơn nhé.'},{x:'Anh/em chẳng bao giờ nhớ gì cả.',y:'Em/anh sợ quên nên nhắc trước nhé, mình cùng ghi vào lịch cho chắc.'},{x:'Sao lúc nào cũng về muộn thế?',y:'Em/anh mong được ăn tối cùng anh/em, hôm nào bận thì nhắn em/anh một câu nhé.'},{x:'Suốt ngày ôm điện thoại.',y:'Mình để điện thoại xuống chút, ngồi nói chuyện với nhau nha.'},{x:'Tiền đâu mà mua thứ đó?',y:'Khoản này hơi lớn, mình bàn với nhau trước khi mua nhé.'},{x:'Anh/em chẳng bao giờ chịu nghe.',y:'Em/anh muốn được nói hết ý, anh/em nghe giúp một chút nhé.'},{x:'Sao nhà cửa lúc nào cũng bừa vậy?',y:'Mình cùng dọn 10 phút mỗi tối cho gọn nhé, một mình em/anh hơi đuối.'},{x:'Cuối tuần lại về nhà anh/em nữa à?',y:'Mình sắp lịch hai bên cho cân nhé, để cả hai đều thoải mái.'},{x:'Việc này em/anh tự lo được.',y:'Em/anh cảm ơn, nhưng có anh/em cùng làm em/anh thấy nhẹ hơn nhiều.'},{x:'Sao chuyện gì cũng phải hỏi ý anh/em?',y:'Việc chung em/anh muốn hai đứa cùng quyết, để cả hai đều thoải mái.'},{x:'Anh/em chẳng bao giờ chịu thay đổi.',y:'Em/anh mong mình cùng thử một cách khác, biết đâu lần này ổn hơn.'},{x:'Thôi, nói với em/anh cũng vô ích.',y:'Em/anh thật sự muốn hiểu, mình nói lại từ đầu cho rõ nhé.'},{x:'Em/anh làm gì mà lâu thế!',y:'Mình còn chút thời gian mà, anh/em cứ từ từ, cần gì em/anh phụ nhé.'},{x:'Sao em/anh cứ so sánh anh/em với người khác vậy?',y:'Em/anh chỉ mong điều tốt cho hai đứa thôi, để em/anh nói lại cho rõ ý nhé.'},{x:'Anh/em nói rồi mà có làm đâu.',y:'Em/anh thấy hơi hụt hẫng, mình cùng nhắc nhau để lần này làm được nhé.'},{x:'Chuyện của em/anh, đừng xen vào.',y:'Anh/em lo cho em/anh nên mới hỏi, khi nào cần cứ nói anh/em nghe nhé.'},{x:'Lúc nào cũng phải theo ý em/anh.',y:'Lần này mình thử làm theo ý anh/em xem sao, lần sau mình đổi lại nhé.'},{x:'Nói bao nhiêu lần rồi mà vẫn thế!',y:'Chắc cách nhắc của em/anh chưa hiệu quả, mình tìm cách khác dễ nhớ hơn nhé.'},{x:'Anh/em chẳng bao giờ chủ động gì cả.',y:'Em/anh sẽ vui lắm nếu thỉnh thoảng anh/em chủ động rủ mình đi đâu đó.'},{x:'Có gì đâu mà phải cảm ơn.',y:'Với em/anh những điều nhỏ anh/em làm đều đáng quý, nên em/anh muốn nói cảm ơn.'},{x:'Sao lúc nào cũng bày ra rồi để đó?',y:'Mình cùng cất đồ ngay sau khi dùng nhé, nhà gọn thì cả hai đều dễ chịu hơn.'},{x:'Em/anh nói vậy mà nghe được à?',y:'Câu đó làm em/anh hơi chạnh lòng, mình nói lại nhẹ nhàng hơn được không?'}];
const LOVE_LANG=[
  {icon:'🗣️',name:'Lời khẳng định',desc:'Được nghe lời khen, động viên, cảm ơn.',how:'Mỗi ngày nói một lời khen/cảm ơn thật cụ thể.'},
  {icon:'⏰',name:'Thời gian chất lượng',desc:'Được ở bên nhau trọn vẹn, không xao nhãng.',how:'Mỗi tối tắt điện thoại 20–30 phút, chỉ hai đứa.'},
  {icon:'🎁',name:'Quà tặng',desc:'Cảm nhận yêu thương qua những món quà nhỏ.',how:'Thỉnh thoảng tặng món nhỏ “thấy là nghĩ tới em/anh”.'},
  {icon:'🤲',name:'Hành động giúp đỡ',desc:'Được san sẻ việc, giúp đỡ thiết thực.',how:'Chủ động làm giúp một việc mà người kia ngại làm.'},
  {icon:'🫂',name:'Cử chỉ âu yếm',desc:'Ôm, nắm tay, gần gũi thể chất.',how:'Ôm nhau khi gặp & trước khi ngủ, nắm tay khi đi cùng.'},
];
const FIGHT_RULES=[
  'Đặt điện thoại xuống khi đang nói chuyện nghiêm túc — sự chú ý trọn vẹn giúp giải quyết nhanh hơn.',
  'Trước khi trách, tự hỏi mình đang thật sự cần điều gì rồi nói rõ ra.',
  'Đừng phán xét ý định của nhau — hỏi cho rõ trước khi kết luận.',
  'Cãi xong đừng im lặng bỏ đi, hãy nói một câu để cả hai biết mình vẫn ở cùng một phía.',
  'Công kích vấn đề, không công kích con người.',
  'Mỗi lần chỉ giải quyết một chuyện — không lôi chuyện cũ ra.',
  'Tránh từ “luôn luôn”, “không bao giờ”, “lúc nào cũng”.',
  'Không to tiếng, không nói lời tổn thương hay doạ chia tay.',
  'Khi quá nóng, xin tạm dừng 15–20 phút rồi quay lại.',
  'Không lôi người thân / gia đình hai bên vào cuộc cãi.',
  'Tìm điểm chung & giải pháp, không cố thắng cho bằng được.',
  'Cãi xong thì làm hoà — một cái ôm, một lời xin lỗi.',
  'Cố gắng không “chiến tranh lạnh” để qua đêm.',"Không cãi nhau trước mặt con — tạm dừng, nói riêng sau.","Không dùng chuyện chia tay/ly hôn để dọa nhau.","Nếu quá nóng, xin 20 phút tạm dừng rồi quay lại.","Mỗi người nói, người kia nghe hết rồi mới đáp.","Nói về cảm xúc (em/anh thấy…) thay vì buộc tội (anh/em luôn…).","Kết thúc bằng một cái ôm hoặc một câu làm hòa, dù chưa xong.","Không lôi gia đình hai bên vào cuộc tranh luận của hai đứa.","Tập trung vào chuyện đang xảy ra, đừng suy diễn quá xa.","Hạ giọng xuống — âm lượng thấp giúp cả hai bình tĩnh hơn.","Nhắc lại một điều tốt của nhau trước khi nói tới điều chưa hài lòng.",'Không nhắn tin cãi nhau khi đang xa nhau — chờ gặp mặt hoặc gọi điện để tránh hiểu lầm.','Đừng cắt lời — để người kia nói hết ý rồi mới đáp lại.','Không so sánh người kia với người yêu cũ hay với vợ/chồng nhà người khác.','Sau khi làm hoà, cùng rút ra một điều nhỏ để lần sau đỡ lặp lại.','Nói xong một ý thì dừng lại nghe, đừng giành nói liên tục.','Khi bế tắc, viết ra giấy điều mình thật sự cần rồi đưa nhau đọc.','Không nhắc lại lỗi cũ đã được tha thứ chỉ để trách móc thêm.','Thỉnh thoảng tự hỏi: mình đang cãi để hiểu nhau hay để thắng nhau?','Đừng vừa cãi vừa làm việc khác — dừng lại, nhìn nhau và nói cho tới nơi tới chốn.','Nếu lỡ buột miệng nói lời tổn thương, xin lỗi ngay khi nhận ra, đừng chờ nguôi cơn.','Cãi xong hãy hỏi nhau "giờ em/anh ổn chưa?" trước khi ai đó đi làm việc khác.','Đừng biến một chuyện nhỏ thành phiên toà kể tội — nói đúng việc đang xảy ra rồi thôi.'];
const CONNECT_QS=[
  'Tối nay em/anh muốn được nghỉ ngơi kiểu nào để dễ chịu nhất?',
  'Có điều nhỏ nào anh/em làm hôm nay khiến em/anh thấy ấm lòng?',
  'Dạo này em/anh mong hai đứa dành thời gian cho nhau nhiều hơn ở việc gì?',
  'Nếu cuối tuần này rảnh, em/anh muốn mình cùng thử điều gì mới?',
  'Hôm nay điều gì làm em/anh vui nhất?',
  'Gần đây em/anh có điều gì lo lắng mà chưa kịp kể?',
  'Anh/em làm điều gì khiến em/anh thấy được yêu tuần này?',
  'Có điều nhỏ nào anh/em làm được để em/anh thấy thoải mái hơn?',
  'Mình đang mơ ước điều gì cho gia đình nhỏ năm nay?',
  'Kỷ niệm nào của hai đứa em/anh muốn được lặp lại?',
  'Điều gì ở anh/em khiến em/anh biết ơn nhất?',
  'Tuần này mình cùng thử một điều mới gì nhé?',
  'Có điều gì em/anh muốn anh/em hiểu hơn về mình không?',
  'Khi buồn, em/anh muốn được an ủi kiểu nào nhất?',"Điều gì ở em/anh khiến bạn thấy may mắn nhất?","Tuần này em/anh có điều gì muốn mình cùng thay đổi?","Khi mệt, em/anh muốn được an ủi kiểu gì?","Có ước mơ nào hồi trẻ mà giờ vẫn muốn thực hiện không?","Nếu có một ngày rảnh hoàn toàn, em/anh muốn làm gì cùng nhau?","Gần đây điều gì khiến em/anh tự hào về gia đình mình?","Em/anh thấy mình đang làm tốt nhất điều gì trong vai trò bố/mẹ?","Có điều gì em/anh muốn cảm ơn mà chưa kịp nói?","Một kỷ niệm nhỏ nào của tụi mình mà em/anh hay nhớ?","Em/anh muốn 5 năm nữa gia đình mình như thế nào?","Điều gì khiến em/anh thấy được yêu thương nhất?","Dạo này em/anh có áp lực gì ở công việc không?","Có món ăn nào của mẹ/bà mà em/anh muốn mình học nấu?","Nếu được đi trốn 2 ngày không có con, em/anh muốn đi đâu?","Điều nhỏ nào mình có thể làm để tuần sau nhẹ nhàng hơn?","Hôm nay em/anh biết ơn điều gì nhất?","Tuần này có khoảnh khắc nào khiến em/anh thấy được yêu không?","Có việc gì em/anh đang gánh một mình mà mình có thể san sẻ?","Điều gì khiến em/anh thấy tự hào về bản thân dạo gần đây?",'Có điều gì tuần này em/anh muốn được khen nhiều hơn không?','Nếu tối nay được làm đúng một việc mình thích cùng nhau, em/anh chọn gì?','Dạo này có điều gì khiến em/anh cười nhiều nhất?','Có thói quen nào của anh/em khiến em/anh thấy được chăm sóc mỗi ngày?','Tuần này có điều gì khiến em/anh thấy được san sẻ nhiều hơn không?','Nếu cuối tuần này mình dành trọn cho nhau, em/anh muốn bắt đầu thế nào?','Có điều gì nhỏ anh/em có thể làm để buổi sáng của em/anh nhẹ nhàng hơn?','Dạo này em/anh mong được lắng nghe về chuyện gì nhất?','Có điều gì mình đã hứa với nhau mà lâu rồi chưa làm được?','Tuần qua khoảnh khắc nào khiến em/anh thấy hai đứa thật là một đội?','Nếu được nói lời cảm ơn tới một người thân của mình, em/anh muốn cảm ơn ai vì điều gì?','Dạo này em/anh có điều gì muốn tự thưởng cho bản thân không?','Nếu ngày mai được nghỉ trọn vẹn bên nhau, em/anh muốn dành nó cho điều gì?','Khoảnh khắc nào tuần này khiến em/anh mỉm cười khi nghĩ tới anh/em?','Có điều nhỏ nào anh/em có thể thay đổi để mình thấy gần nhau hơn không?','Dạo này em/anh mong được anh/em lắng nghe về chuyện gì nhất?'];
function CommGuide(){
  const [tab,setTab]=useState('principles');
  const [open,setOpen]=useState(0);
  const [qi,setQi]=useState(()=>Math.floor(Math.random()*CONNECT_QS.length));
  return (
    <div>
      <FilterBar value={tab} onChange={setTab} menuId="comm" items={[
        {k:'principles',icon:'🕊️',label:'Nguyên tắc'},{k:'say',icon:'💬',label:'Nói khéo'},
        {k:'love',icon:'💖',label:'NN yêu thương'},{k:'fight',icon:'⚖️',label:'Cãi lành mạnh'},
        {k:'connect',icon:'🔗',label:'Câu hỏi kết nối'},
      ]}/>
      {tab==='principles' && <div>
        <div className="muted center" style={{fontSize:12.5,margin:'8px 14px'}}>🕊️ Nguyên tắc giúp hai vợ chồng nói chuyện êm đẹp — chạm để mở.</div>
        {COMM_TIPS.map((t,i)=>(
          <div key={i} className="item" style={{cursor:'pointer'}} onClick={()=>setOpen(open===i?-1:i)}>
            <div className="row"><span style={{fontSize:18}}>{t.icon}</span><b className="grow" style={{fontSize:14}}>{t.title}</b><span className="muted">{open===i?'▾':'▸'}</span></div>
            {open===i && <div className="muted" style={{fontSize:12.5,marginTop:6,lineHeight:1.65}}>{t.text}</div>}
          </div>
        ))}
      </div>}
      {tab==='say' && <div>
        <div className="muted center" style={{fontSize:11,margin:'8px 14px'}}>Cùng một ý, nói khác đi sẽ dịu hơn nhiều: 🔴 tránh nói → 🟢 hãy thử.</div>
        {COMM_SAY.map((s,i)=>(
          <div key={i} className="item">
            <div style={{fontSize:12.5,color:'#b06b6b'}}>🔴 “{s.x}”</div>
            <div style={{fontSize:14,marginTop:5,color:'var(--good)',fontWeight:500}}>🟢 “{s.y}”</div>
          </div>
        ))}
      </div>}
      {tab==='love' && <div>
        <div className="muted center" style={{fontSize:11,margin:'8px 14px'}}>5 “ngôn ngữ yêu thương” — mỗi người cảm nhận yêu theo cách khác nhau. Biết “gu” của nửa kia để yêu đúng cách.</div>
        {LOVE_LANG.map((l,i)=>(
          <div key={i} className="item">
            <div className="it-top"><h4>{l.icon} {l.name}</h4></div>
            <div className="muted" style={{fontSize:12.5,marginTop:2}}>{l.desc}</div>
            <div style={{fontSize:12.5,marginTop:4}}>👉 {l.how}</div>
          </div>
        ))}
        <div className="muted center" style={{fontSize:11,margin:'4px 14px 8px'}}>💡 Hỏi nửa kia: trong 5 điều trên, điều nào khiến em/anh thấy được yêu nhất?</div>
      </div>}
      {tab==='fight' && <div>
        <div className="muted center" style={{fontSize:11,margin:'8px 14px'}}>Cãi nhau là bình thường — cãi sao cho không tổn thương mới là điều quan trọng.</div>
        <div className="card">{FIGHT_RULES.map((r,i)=>(
          <div key={i} style={{fontSize:14,padding:'7px 0',borderBottom:i<FIGHT_RULES.length-1?'1px solid var(--line)':'none'}}>✅ {r}</div>
        ))}</div>
      </div>}
      {tab==='connect' && <div>
        <div className="card center">
          <div className="muted" style={{fontSize:12.5}}>🔗 Câu hỏi kết nối hôm nay</div>
          <div style={{fontSize:15,fontWeight:600,margin:'8px 0',lineHeight:1.4}}>{CONNECT_QS[qi]}</div>
          <button className="btn sm soft" onClick={()=>setQi(p=>{ let n=p; while(n===p&&CONNECT_QS.length>1) n=Math.floor(Math.random()*CONNECT_QS.length); return n; })}>🎲 Câu khác</button>
        </div>
        <div className="muted center" style={{fontSize:11,margin:'4px 14px'}}>Hỏi nhau mỗi tối một câu để ngày càng hiểu nhau hơn 💞</div>
      </div>}
    </div>
  );
}
/* ============ To-do việc gia đình (người làm + ưu tiên) ============ */
const TODO_PRIO=[{k:'cao',label:'Gấp',color:'#e25b5b'},{k:'vua',label:'Vừa',color:'#e0a341'},{k:'thap',label:'Thong thả',color:'#5bb36a'}];
function FamilyTodos({people,me}){
  const [items,setItems]=useLocal('ju.todos',[]);
  const [t,setT]=useState(''); const [who,setWho]=useState('both'); const [prio,setPrio]=useState('vua'); const [due,setDue]=useState('');
  const [showDone,setShowDone]=useState(false);
  const [openId,setOpenId]=useState(null);
  const add=()=>{ if(!t.trim())return; setItems(prev=>[{id:uid(),title:t.trim(),who,priority:prio,due:due||'',done:false,subs:[],comments:[],by:me,createdAt:Date.now()},...prev]); setT('');setDue(''); celebrate(['📝']); };
  const toggle=(id)=>setItems(prev=>prev.map(x=>x.id===id?{...x,done:!x.done}:x));
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setItems(prev=>prev.filter(x=>x.id!==id)); } };
  const patch=(id,fn)=>setItems(prev=>prev.map(x=>x.id===id?fn(x):x));
  const addSub=(id,text)=>patch(id,x=>({...x,subs:[...(x.subs||[]),{id:uid(),text,done:false}]}));
  const toggleSub=(id,sid)=>patch(id,x=>({...x,subs:(x.subs||[]).map(s=>s.id===sid?{...s,done:!s.done}:s)}));
  const delSub=(id,sid)=>patch(id,x=>({...x,subs:(x.subs||[]).filter(s=>s.id!==sid)}));
  const addComment=(id,text)=>patch(id,x=>({...x,comments:[...(x.comments||[]),{id:uid(),text,by:me,at:Date.now()}]}));
  const delComment=(id,cid)=>patch(id,x=>({...x,comments:(x.comments||[]).filter(c=>c.id!==cid)}));
  const fmtWhen=(ms)=>{ const d=new Date(ms); const p=n=>String(n).padStart(2,'0'); return p(d.getHours())+':'+p(d.getMinutes())+' '+d.getDate()+'/'+(d.getMonth()+1); };
  const Detail=({x})=>{ const subs=x.subs||[], cmts=x.comments||[];
    return <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--line)'}}>
      <div className="muted" style={{fontSize:11,fontWeight:700,margin:'0 0 2px'}}>☑️ Việc nhỏ</div>
      {subs.map(s=>(
        <div key={s.id} className="row" style={{gap:6,padding:'2px 0'}}>
          <button onClick={()=>toggleSub(x.id,s.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={s.done?'dadanh':'chuadanh'} size={13}/>}</button>
          <span className="grow" style={{fontSize:12.5,textDecoration:s.done?'line-through':'none',opacity:s.done?.55:1}}>{s.text}</span>
          <button className="muted tapmin" aria-label="Xoá" style={{fontSize:12.5}} onClick={()=>delSub(x.id,s.id)}><Ic n="dong" size={15}/></button>
        </div>
      ))}
      <TodoAdd placeholder="+ việc nhỏ…" onAdd={txt=>addSub(x.id,txt)}/>
      <div className="muted" style={{fontSize:11,fontWeight:700,margin:'12px 0 4px'}}>💬 Bình luận</div>
      {cmts.map(c=>(
        <div key={c.id} style={{background:'var(--chip)',borderRadius:10,padding:'6px 9px',margin:'4px 0'}}>
          <div className="row" style={{gap:6}}>
            <span className="muted grow" style={{fontSize:11}}>{people[c.by]?.avatar} {people[c.by]?.name} · {fmtWhen(c.at)}</span>
            {c.by===me && <button className="muted tapmin" aria-label="Xoá" style={{fontSize:11}} onClick={()=>delComment(x.id,c.id)}><Ic n="dong" size={15}/></button>}
          </div>
          <div style={{fontSize:12.5,whiteSpace:'pre-wrap',color:'var(--chip-tx)',marginTop:2}}>{c.text}</div>
        </div>
      ))}
      <TodoAdd placeholder="+ bình luận…" icon="💬" onAdd={txt=>addComment(x.id,txt)}/>
    </div>;
  };
  const prioOf=(k)=>TODO_PRIO.find(p=>p.k===k)||TODO_PRIO[1];
  const prioRank=(k)=>({cao:0,vua:1,thap:2}[k]!=null?{cao:0,vua:1,thap:2}[k]:1);
  const whoLabel=(w)=> w==='a'?people.a.name : w==='b'?people.b.name : 'Cả hai';
  const whoAv=(w)=> w==='a'?people.a.avatar : w==='b'?people.b.avatar : '👫';
  const active=items.filter(x=>!x.done).sort((a,b)=> prioRank(a.priority)-prioRank(b.priority) || (a.due||'9').localeCompare(b.due||'9'));
  const done=items.filter(x=>x.done);
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>✅ Việc gia đình cần làm — ai làm, mức ưu tiên, hạn chót.</div>
      <div className="card">
        <input className="inp" placeholder="Thêm việc cần làm…" value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <div className="row" style={{gap:6,marginTop:8}}>
          <select className="inp grow" value={who} onChange={e=>setWho(e.target.value)} style={{fontSize:12.5}}><option value="both">👫 Cả hai</option><option value="a">{people.a.name}</option><option value="b">{people.b.name}</option></select>
          <select className="inp grow" value={prio} onChange={e=>setPrio(e.target.value)} style={{fontSize:12.5}}>{TODO_PRIO.map(p=><option key={p.k} value={p.k}>{p.label}</option>)}</select>
          <input className="inp" type="date" value={due} onChange={e=>setDue(e.target.value)} style={{width:130,fontSize:12.5}}/>
        </div>
        <button className="btn" style={{marginTop:8}} onClick={add}>＋ Thêm việc</button>
      </div>
      {active.length===0 && <div className="empty"><span className="big">🎉</span>Hết việc cần làm rồi!</div>}
      {active.map(x=>{ const p=prioOf(x.priority); const dd=x.due?daysFromToday(x.due):null;
        const subs=x.subs||[], sd=subs.filter(s=>s.done).length, cn=(x.comments||[]).length; const isOpen=openId===x.id;
        return <div key={x.id} className="item" style={{borderLeft:'4px solid '+p.color}}>
          <div className="row"><button onClick={()=>toggle(x.id)} aria-label="Đánh dấu xong" className="tapmin"><Ic n="chuadanh" size={17}/></button>
            <span className="grow" style={{fontSize:14}}>{x.title}</span>
            <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)}><Ic n="dong" size={15}/></button></div>
          <div className="row" style={{marginTop:5,gap:6,flexWrap:'wrap'}}>
            <span className="pill" style={{background:p.color,color:'#fff'}}>{p.label}</span>
            <span className="pill">{whoAv(x.who)} {whoLabel(x.who)}</span>
            {x.due && <span className="pill" style={dd!=null&&dd<0?{background:'#e25b5b',color:'#fff'}:null}>📅 {fmtDateVN(x.due)}{dd!=null?(dd<0?' · trễ':dd===0?' · hôm nay':' · còn '+dd+'n'):''}</span>}
            <span className="grow"></span>
            <button className="pill" onClick={()=>setOpenId(isOpen?null:x.id)} style={{cursor:'pointer'}}>
              {subs.length>0 && <span>☑️ {sd}/{subs.length}</span>}
              {cn>0 && <span>💬 {cn}</span>}
              <span>{isOpen?'▲ Thu gọn':'＋ Chi tiết'}</span>
            </button>
          </div>
          {isOpen && <Detail x={x}/>}
        </div>; })}
      {done.length>0 && <div className="row" style={{margin:'10px 14px 0'}}><span className="grow"></span><button className="muted" style={{fontSize:11}} onClick={()=>setShowDone(v=>!v)}>{showDone?'Ẩn':'Xem'} {done.length} việc đã xong</button></div>}
      {showDone && done.map(x=>(
        <div key={x.id} className="item" style={{opacity:.6}}><div className="row"><button onClick={()=>toggle(x.id)} aria-label="Bỏ đánh dấu xong" className="tapmin"><Ic n="dadanh" size={17}/></button>
          <span className="grow" style={{textDecoration:'line-through',fontSize:14}}>{x.title}</span>
          <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)}><Ic n="dong" size={15}/></button></div></div>
      ))}
    </div>
  );
}
/* ============ Playlist Spotify của hai đứa ============ */
function spotifyEmbed(url){ const m=(url||'').match(/open\.spotify\.com\/(?:intl-\w+\/)?(playlist|track|album|artist|episode|show)\/([A-Za-z0-9]+)/); return m? {src:'https://open.spotify.com/embed/'+m[1]+'/'+m[2],type:m[1]} : null; }
function MusicPlaylists({people,me}){
  const [items,setItems]=useLocal('ju.spotify',[]);
  const [url,setUrl]=useState(''); const [title,setTitle]=useState('');
  const add=()=>{ const emb=spotifyEmbed(url); if(!emb){ alert('Dán link Spotify hợp lệ (playlist, bài hát hoặc album).'); return; } setItems(prev=>[{id:uid(),title:title.trim()||'Playlist của tụi mình',url:url.trim(),by:me,createdAt:Date.now()},...prev]); setUrl('');setTitle(''); celebrate(['🎵','💞']); };
  const del=(id)=>{ if(confirm('Xoá playlist này?')) setItems(prev=>prev.filter(x=>x.id!==id)); };
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🎵 Playlist Spotify của hai vợ chồng — dán link để nghe ngay tại đây.</div>
      <div className="card">
        <input className="inp" placeholder="Tên playlist (tuỳ chọn)" value={title} onChange={e=>setTitle(e.target.value)}/>
        <div className="row" style={{gap:6,marginTop:8}}>
          <input className="inp grow" placeholder="Dán link Spotify…" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
          <button className="btn sm" onClick={add}>＋</button>
        </div>
        <div className="muted" style={{fontSize:11,marginTop:6}}>Trên Spotify: bài hát/playlist → Chia sẻ → Sao chép liên kết, rồi dán vào đây.</div>
      </div>
      {items.length===0 && <div className="empty"><span className="big">🎵</span>Thêm playlist / bài hát yêu thích của hai đứa.</div>}
      {items.map(x=>{ const emb=spotifyEmbed(x.url); const h=emb&&(emb.type==='track'||emb.type==='episode')?152:352;
        return <div key={x.id} className="item">
          <div className="it-top"><h4>🎵 {x.title}</h4><button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)}><Ic n="dong" size={15}/></button></div>
          {emb
            ? <iframe title={x.title} src={emb.src} width="100%" height={h} loading="lazy" allow="encrypted-media" style={{borderRadius:12,marginTop:6,border:0}}></iframe>
            : <a className="pill" href={x.url} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>▶︎ Mở Spotify</a>}
          <div className="muted" style={{fontSize:11,marginTop:4}}>{people[x.by]?.avatar} thêm</div>
        </div>; })}
    </div>
  );
}
/* (Mục "Thống nhất cách dạy con" đã chuyển sang app Sóc — soc/index.html) */
/* ============ Quy tắc / giao ước gia đình ============ */
const FAMILY_RULES_SUGGEST=[
  {group:'💛 Ứng xử với nhau',items:['Nói cảm ơn và xin lỗi với nhau mỗi ngày','Không to tiếng, không nói nặng lời — nhất là trước mặt con','Giận nhau không quá một ngày, làm lành trước khi ngủ','Ôm / hôn tạm biệt khi ra khỏi nhà','Khó chịu thì nói thẳng, không im lặng dỗi','Mỗi ngày nói với nhau ít nhất một lời khen / động viên','Không nhắc lại lỗi cũ khi đang tranh luận','Không so sánh bạn đời với người khác','Lắng nghe hết ý người kia rồi mới nói','Cảm ơn khi người kia làm việc nhà / chăm con']},
  {group:'🧸 Với con',items:['Bố mẹ thống nhất một luật — không người cấm người cho','Không dùng điện thoại khi đang chơi với con','Khen khi con làm tốt, phạt bình tĩnh khi con sai','Mỗi ngày đọc sách / chơi cùng con ít nhất 15 phút','Không dọa nạt, không đánh con','Giữ lời hứa với con — hứa là làm','Không cãi nhau trước mặt con','Cho con tự làm việc vừa sức để con tự lập','Thống nhất giờ xem tivi / điện thoại của con','Ôm và nói "bố / mẹ yêu con" mỗi ngày']},
  {group:'🏠 Nếp nhà',items:['Không điện thoại trong bữa ăn','Về đúng giờ ăn tối, báo trước nếu về muộn','Ai nấu thì người kia dọn','Dùng xong đồ cất về chỗ cũ','Cuối tuần dành ít nhất một buổi cho gia đình','Mỗi tối cả nhà dọn nhanh 10 phút','Chia việc nhà công bằng, không đùn đẩy','Ngủ và dậy đúng giờ để giữ nếp','Bữa tối cả nhà ăn cùng nhau khi có thể']},
  {group:'💰 Tiền bạc',items:['Khoản chi lớn bàn nhau trước khi quyết','Minh bạch thu chi, không giấu quỹ đen','Mỗi tháng cùng xem lại chi tiêu một lần','Ưu tiên trả nợ và quỹ dự phòng trước khi mua sắm','Mỗi người có một khoản tiêu riêng không cần giải trình','Cùng đặt mục tiêu tiết kiệm và theo dõi','Không cho vay / đứng tên nợ giúp ai khi chưa bàn nhau']},
  {group:'📱 Công nghệ & riêng tư',items:['Tắt điện thoại 1 giờ trước giờ ngủ','Tôn trọng không gian riêng của nhau','Không đăng chuyện riêng của gia đình lên mạng khi chưa hỏi nhau','Bữa ăn và giờ chơi với con là "vùng không điện thoại"','Không đọc trộm điện thoại của nhau','Sạc điện thoại ngoài phòng ngủ']},
  {group:'🕊️ Khi mâu thuẫn',items:['Tranh luận về vấn đề, không công kích cá nhân','Khi nóng thì tạm dừng, hẹn nói lại lúc bình tĩnh','Không lôi bố mẹ / họ hàng hai bên vào cuộc cãi','Không dùng câu "lúc nào cũng" / "chẳng bao giờ"','Xong chuyện là bỏ qua, không giận dai','Tìm giải pháp cùng nhau thay vì tìm người thắng']},
  {group:'💞 Tình cảm vợ chồng',items:['Mỗi tuần một buổi hẹn hò riêng của hai đứa','Nhắn nhau một tin ngọt ngào mỗi ngày','Nhớ ngày kỷ niệm và sinh nhật của nhau','Nói ra điều mình cần thay vì để người kia đoán','Cảm ơn nhau bằng một hành động nhỏ mỗi tuần']},
  {group:'👵 Gia đình hai bên',items:['Đối xử công bằng với nội và ngoại','Vợ chồng thống nhất trước khi trả lời chuyện hai bên','Về thăm / gọi hỏi ông bà đều đặn','Ghi nhớ ngày giỗ, lễ Tết hai bên','Bảo vệ bạn đời trước mặt gia đình mình']},
  {group:'💪 Sức khỏe & bản thân',items:['Mỗi người có 30 phút "của riêng mình" mỗi ngày','Ngủ đủ giấc, không thức khuya vô cớ','Vận động / tập thể dục vài lần mỗi tuần','Khám sức khỏe định kỳ cho cả nhà','Nhắc nhau ăn uống lành mạnh, bớt rượu bia']},
  {group:'🎉 Niềm vui & biết ơn',items:['Mỗi tối kể cho nhau nghe một điều vui trong ngày','Ăn mừng những cột mốc nhỏ của gia đình','Chụp ảnh / ghi lại kỷ niệm đáng nhớ','Cùng nhau thử một điều mới mỗi tháng']},
];
function FamilyRules({people,me}){
  const [rules,setRules]=useLocal('ju.familyRules',[]);
  const [t,setT]=useState('');
  const [sugOpen,setSugOpen]=useState(()=>((store.get('ju.familyRules',[])||[]).length===0));
  const has=(text)=>rules.some(x=>x.text===text);
  const add=(text)=>{ const x=(text||'').trim(); if(!x||has(x))return; setRules(prev=>[{id:uid(),text:x,by:me,agreed:false,createdAt:Date.now()},...prev]); };
  const addManual=()=>{ if(!t.trim())return; add(t.trim()); setT(''); celebrate(['📜']); };
  const toggle=(id)=>setRules(prev=>prev.map(x=>x.id===id?{...x,agreed:!x.agreed}:x));
  const del=(id)=>{ if(confirm('Xoá quy tắc này?')) setRules(prev=>prev.filter(x=>x.id!==id)); };
  const agreed=rules.filter(x=>x.agreed).length; const pct=rules.length?Math.round(agreed/rules.length*100):0;
  const exportRulesWord=()=>{ if(!rules.length){ alert('Chưa có quy tắc nào để in.'); return; }
    const body=ooP('📜 Quy tắc gia đình',{bold:true,size:18,color:'C2185B'})+ooP(agreed+'/'+rules.length+' quy tắc đã cam kết',{size:10,color:'777777',spacing:200})
      +rules.map((x,i)=>ooP((x.agreed?'☑ ':'☐ ')+(i+1)+'. '+x.text,{spacing:100})).join('');
    exportDocx('Quy-tac-gia-dinh.docx', body); };
  return (
    <div>
      <div style={{margin:'12px 14px',padding:'14px 16px',borderRadius:18,background:'linear-gradient(135deg,var(--primary),var(--primary2))',color:'var(--on-primary)',boxShadow:'var(--shadow)'}}>
        <div style={{fontSize:16,fontWeight:800}}>📜 Giao ước của gia đình mình</div>
        <div style={{fontSize:12.5,opacity:.92,marginTop:2}}>Cùng thống nhất để nhà luôn êm ấm 💞</div>
        {rules.length>0 && <>
          <div style={{height:8,borderRadius:999,background:'rgba(255,255,255,.3)',overflow:'hidden',marginTop:11}}>
            <div style={{height:'100%',width:pct+'%',background:'#fff',borderRadius:999,transition:'width .3s'}}></div>
          </div>
          <div style={{fontSize:11,marginTop:6,fontWeight:700,opacity:.95}}>💞 {agreed}/{rules.length} quy tắc cả nhà đã cam kết · {pct}%</div>
        </>}
      </div>
      <div className="card">
        <div className="row" style={{gap:6}}>
          <input className="inp grow" placeholder="Thêm quy tắc của nhà mình…" value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addManual(); }}/>
          <button className="btn sm" onClick={addManual}>＋</button>
          {rules.length>0 && <button className="btn sm soft" onClick={exportRulesWord} title="Xuất ra file Word (.docx) để in / sửa">🖨️ In</button>}
        </div>
      </div>
      <div className="card">
        <div className="row"><span className="grow" style={{fontSize:12.5,fontWeight:600}}>💡 Gợi ý quy tắc — bấm để thêm</span>
          <button className="muted" style={{fontSize:11}} onClick={()=>setSugOpen(v=>!v)}>{sugOpen?'▲ Ẩn':'▾ Xem'}</button></div>
        {sugOpen && <div style={{marginTop:2}}>
          {FAMILY_RULES_SUGGEST.map(gr=>(
            <div key={gr.group} style={{marginBottom:9}}>
              <div className="muted" style={{fontSize:11,margin:'2px 0 4px'}}>{gr.group}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {gr.items.map(name=>{ const added=has(name); return <button key={name} className="pill" disabled={added} style={added?{opacity:.45}:{cursor:'pointer'}} onClick={()=>add(name)}>{added?'✓ ':'＋ '}{name}</button>; })}
              </div>
            </div>
          ))}
        </div>}
      </div>
      {rules.length===0 && <div className="empty"><span className="big">📜</span>Chưa có quy tắc nào. Thêm tay hoặc bấm 💡 Gợi ý ở trên.</div>}
      {rules.length>0 && <div className="sec-title">Quy tắc của nhà mình</div>}
      {rules.map(x=>(
        <div key={x.id} className="item" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderLeft:'4px solid '+(x.agreed?'var(--good)':'var(--line)'),...(x.agreed?{background:'var(--chip)'}:{})}}>
          <button onClick={()=>toggle(x.id)} title="Đánh dấu đã cam kết" style={{width:30,height:30,borderRadius:'50%',flex:'0 0 auto',display:'grid',placeItems:'center',fontSize:15,fontWeight:800,background:x.agreed?'var(--good)':'transparent',color:'#fff',border:x.agreed?'none':'2px solid var(--line)',boxShadow:x.agreed?'0 2px 8px rgba(43,182,115,.4)':'none'}}>{x.agreed?'✓':''}</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,lineHeight:1.35,color:x.agreed?'var(--chip-tx)':'var(--text)'}}>{x.text}</div>
            <div style={{marginTop:4,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              {x.agreed
                ? <span style={{fontSize:9.5,fontWeight:800,letterSpacing:.3,color:'#fff',background:'var(--good)',borderRadius:999,padding:'2px 8px'}}>💞 ĐÃ CAM KẾT</span>
                : <span className="muted" style={{fontSize:11}}>Chạm vòng tròn để cam kết</span>}
              <span className="muted" style={{fontSize:11}}>{people[x.by]?.avatar} thêm</span>
            </div>
          </div>
          <button className="muted tapmin" aria-label="Xoá" onClick={()=>del(x.id)} style={{flex:'0 0 auto',fontSize:15}}><Ic n="dong" size={15}/></button>
        </div>
      ))}
    </div>
  );
}
function TalkTab({people,me,flash}){
  const [seg,setSeg]=useState('notes');
  return (
    <div>
      <SegGrid value={seg} onChange={setSeg} items={[
        {k:'notes',icon:'💌',label:'Nhắn nhau'},{k:'question',icon:'❓',label:'Câu hỏi'},
        {k:'wishes',icon:'💛',label:'Mong nhau'},{k:'topics',icon:'🗣️',label:'Chủ đề'},
        {k:'quiz',icon:'💞',label:'Đố vui'},{k:'game',icon:'🎲',label:'Trò chơi'},
        {k:'checkin',icon:'📝',label:'Check-in tuần'},{k:'guide',icon:'🕊️',label:'Giao tiếp'},
        {k:'privacy',icon:'🔒',label:'Riêng tư'},
      ]} menuId="talk"/>
      {seg==='notes' && <Notes people={people} me={me}/>}
      {seg==='question' && <DailyQuestion people={people} me={me}/>}
      {seg==='wishes' && <PartnerWishes people={people} me={me}/>}
      {seg==='topics' && <TalkTopics/>}
      {seg==='quiz' && <CoupleQuiz people={people} me={me}/>}
      {seg==='game' && <GameBets people={people} me={me} flash={flash}/>}
      {seg==='checkin' && <WeeklyCheckin people={people} me={me}/>}
      {seg==='guide' && <CommGuide/>}
      {seg==='privacy' && <IntimacyTab people={people} me={me} flash={flash}/>}
    </div>
  );
}

/* ============ Việc gia đình (dự án) ============ */
function FamilyProjects({people,me}){
  const [projects,setProjects]=useLocal('ju.projects',[]);
  const [vinha,setVinha]=useLocal('ju.vinhaUrl','');
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [linkOpen,setLinkOpen]=useState(false);
  const save=(p)=>{ if(p.id) setProjects(prev=>prev.map(x=>x.id===p.id?p:x)); else setProjects(prev=>[{...p,id:uid(),by:me,tasks:[],createdAt:Date.now()},...prev]); setOpen(false);setEdit(null); };
  const del=(id)=>{ if(confirm('Xoá dự án này?')) setProjects(prev=>prev.filter(x=>x.id!==id)); };
  const addTask=(id,text)=>setProjects(prev=>prev.map(p=>p.id===id?{...p,tasks:[...(p.tasks||[]),{id:uid(),text,done:false}]}:p));
  const addTasks=(id,arr)=>setProjects(prev=>prev.map(p=>p.id===id?{...p,tasks:[...(p.tasks||[]),...arr.filter(tx=>!(p.tasks||[]).some(t=>t.text===tx)).map(tx=>({id:uid(),text:tx,done:false}))]}:p));
  const toggleTask=(id,tid)=>setProjects(prev=>prev.map(p=>p.id===id?{...p,tasks:(p.tasks||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:p));
  const delTask=(id,tid)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setProjects(prev=>prev.map(p=>p.id===id?{...p,tasks:(p.tasks||[]).filter(t=>t.id!==tid)}:p)); } };
  const openVinha=()=>{ if(vinha){ window.open(vinha,'_blank','noreferrer'); } else setLinkOpen(true); };
  const shown=projects.slice().sort((a,b)=>(a.date||'9').localeCompare(b.date||'9'));
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px 0'}}>💒 Dự án lớn của gia đình: việc cần làm + ngày mục tiêu. Tiền nong để VíNhà lo 💰</div>
      <div className="row" style={{margin:'10px 14px',gap:8}}>
        <button className="btn soft grow" onClick={openVinha}>💰 VíNhà</button>
        <button className="iconbtn" onClick={()=>setLinkOpen(true)} title="Liên kết VíNhà" aria-label="Liên kết VíNhà"><Ic n="lienket"/></button>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm dự án</button>
      </div>
      {shown.length===0 && <div className="empty"><span className="big">💒</span>Lên kế hoạch đám cưới, sinh nhật, chuyến du lịch… mỗi việc một dự án.</div>}
      {shown.map(p=>{
        const d=daysFromToday(p.date);
        const done=(p.tasks||[]).filter(t=>t.done).length, total=(p.tasks||[]).length;
        const sug=PROJ_TASK_SUGGEST[p.type];
        return (
          <div key={p.id} className="item">
            <div className="it-top"><h4>{projIcon(p.type)} {p.title}</h4>
              {d!=null && <span className="pill">{d<0?'đã qua':d===0?'Hôm nay!':d===1?'Ngày mai':'còn '+d+' ngày'}</span>}</div>
            <div className="muted" style={{fontSize:12.5,marginTop:3}}>{p.date?fmtDateVN(p.date):'chưa đặt ngày'}{p.note?' · '+p.note:''}</div>
            {total>0 && <div className="prog"><i style={{width:(done/total*100)+'%'}}></i></div>}
            {total>0 && <div className="muted" style={{fontSize:11,marginTop:3}}>{done}/{total} việc xong</div>}
            <div style={{marginTop:8}}>
              {(p.tasks||[]).map(t=>(
                <div key={t.id} className="row" style={{padding:'3px 0'}}>
                  <button onClick={()=>toggleTask(p.id,t.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={t.done?'dadanh':'chuadanh'} size={15}/>}</button>
                  <span className={'grow'+(t.done?' dim':'')} style={{fontSize:14,textDecoration:t.done?'line-through':'none'}}>{t.text}</span>
                  <button className="muted tapmin" aria-label="Xoá" onClick={()=>delTask(p.id,t.id)}><Ic n="dong" size={15}/></button>
                </div>
              ))}
              <TodoAdd onAdd={(t)=>addTask(p.id,t)}/>
              {sug && total===0 && <button className="pill" style={{marginTop:6}} onClick={()=>addTasks(p.id,sug)}>💡 Thêm việc gợi ý sẵn</button>}
              {p.type==='paperwork' && <div style={{marginTop:8}}>
                <div className="muted" style={{fontSize:11,marginBottom:5}}>📋 Chọn thủ tục để thêm sẵn giấy tờ cần mang + các bước:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {PAPERWORK_TEMPLATES.map(tpl=><button key={tpl.k} className="pill" style={{cursor:'pointer'}} onClick={()=>addTasks(p.id, tpl.docs.map(d=>'📎 Mang theo: '+d).concat(tpl.steps.map(s=>'▶️ '+s)))}>{tpl.icon} {tpl.label}</button>)}
                </div>
                <div className="muted" style={{fontSize:11,marginTop:6,lineHeight:1.5}}>⚠️ Thông tin tham khảo — thủ tục có thể đổi theo địa phương/thời điểm. Nên gọi hỏi cơ quan hoặc kiểm tra Cổng Dịch vụ công trước khi đi.</div>
              </div>}
            </div>
            <div className="it-meta">
              {vinha && <a className="pill" href={vinha} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>💰 VíNhà</a>}
              {p.date && <button className="pill" onClick={()=>icsDownload(p.title,p.date,p.note)}>📆 Lịch</button>}
              <span className="grow"></span>
              <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(p);setOpen(true);}}><Ic n="sua"/></button>
              <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(p.id)}><Ic n="xoa"/></button>
            </div>
          </div>
        );
      })}
      {open && <ProjectForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
      {linkOpen && <Sheet title="🔗 Liên kết VíNhà" onClose={()=>setLinkOpen(false)}>
        <div className="muted" style={{fontSize:12.5,marginBottom:10}}>Dán đường link VíNhà (khi bạn đã đăng VíNhà lên web) để mở nhanh phần tiền nong từ đây.</div>
        <div className="field"><label>Link VíNhà</label>
          <input className="inp" autoFocus value={vinha} onChange={e=>setVinha(e.target.value)} placeholder="https://…"/></div>
        <button className="btn" onClick={()=>setLinkOpen(false)}>💾 Lưu</button>
      </Sheet>}
    </div>
  );
}
function ProjectForm({init,onClose,onSave}){
  const [f,setF]=useState(()=>init?{...init}:{title:'',type:'wedding',date:'',note:''});
  return (
    <Sheet title={(init?'Sửa ':'Thêm ')+'dự án gia đình'} onClose={onClose}>
      <div className="field"><label>Tên dự án</label>
        <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Đám cưới của chúng mình"/></div>
      <div className="field"><label>Loại</label>
        <div className="emoji-row">{PROJ_TYPES.map(t=><button key={t.k} className={f.type===t.k?'on':''} onClick={()=>setF({...f,type:t.k})} style={{width:'auto',padding:'8px 11px',fontSize:12.5}}>{t.icon} {t.label}</button>)}</div></div>
      <div className="field"><label>Ngày mục tiêu</label>
        <input className="inp" type="date" value={f.date||''} onChange={e=>setF({...f,date:e.target.value})}/></div>
      <div className="field"><label>Ghi chú</label>
        <textarea className="inp" value={f.note||''} onChange={e=>setF({...f,note:e.target.value})} placeholder="Ngân sách, ý tưởng…"/></div>
      <button className="btn" onClick={()=>{ if(f.title.trim()) onSave(f); }}>💾 Lưu</button>
    </Sheet>
  );
}

function periodNext(){
  const p=store.get('ju.period',null); if(!p) return null;
  const cycle=p.cycle||28, length=p.length||5;
  const start=(p.history&&p.history.length)?p.history.slice().sort().slice(-1)[0]:p.start;
  if(!start) return null;
  const s=new Date(start+'T00:00:00'), today=new Date(todayISO()+'T00:00:00');
  let next=new Date(s); while(next<today){ next.setDate(next.getDate()+cycle); }
  const days=Math.round((next-today)/86400000);
  const sinceLast=Math.round((today-s)/86400000);
  return {date:next.getFullYear()+'-'+pad(next.getMonth()+1)+'-'+pad(next.getDate()),days,onPeriod:sinceLast>=0&&sinceLast<length,dayOfPeriod:sinceLast+1,length,start};
}
function PeriodTracker({people}){
  const [pRaw,setP]=useLocal('ju.period',{cycle:28,length:5,history:[],prep:[],note:''});
  const p=pRaw||{cycle:28,length:5,history:[],prep:[],note:''};
  const [showSet,setShowSet]=useState(false);
  const [showHist,setShowHist]=useState(false);
  const info=periodNext();
  const hist=(p.history||[]).slice().sort();
  const gaps=[]; for(let i=1;i<hist.length;i++){ gaps.push(Math.round((new Date(hist[i]+'T00:00:00')-new Date(hist[i-1]+'T00:00:00'))/86400000)); }
  const avg=gaps.length? Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):null;
  const fertile=(()=>{ if(!info||info.onPeriod) return null; const ov=new Date(info.date+'T00:00:00'); ov.setDate(ov.getDate()-14);
    const a=new Date(ov); a.setDate(a.getDate()-3); const b=new Date(ov); b.setDate(b.getDate()+1);
    const f=x=>x.getDate()+'/'+(x.getMonth()+1); return {a:f(a),b:f(b),ov:f(ov)}; })();
  const [pickDate,setPickDate]=useState(todayISO());
  const logOn=(iso)=>{ if(!iso) return; const h=(p.history||[]).slice(); if(h.indexOf(iso)<0) h.push(iso); h.sort(); setP({...p,history:h,start:h[h.length-1]}); celebrate(['🌸']); };
  const logToday=()=>logOn(todayISO());
  const undoLast=()=>{ const h=hist.slice(0,-1); setP({...p,history:h,start:h[h.length-1]}); };
  const togglePrep=(item)=>{ const pr=(p.prep||[]); setP({...p,prep: pr.indexOf(item)>=0? pr.filter(x=>x!==item):[...pr,item]}); };
  const name=(people&&people.b&&people.b.name)||'vợ';
  return (
    <div>
      <div className="card" style={{background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
        <div className="row"><b>🌸 Chu kỳ của {name}</b><span className="grow"></span>
          <button className="muted" style={{fontSize:11}} onClick={()=>setShowSet(v=>!v)}>⚙️ chu kỳ {p.cycle||28}n</button></div>
        {!info ? <div className="muted" style={{fontSize:12.5,margin:'8px 0'}}>Chưa có dữ liệu. Bấm “Bắt đầu kỳ hôm nay” vào ngày đầu của kỳ để theo dõi.</div>
          : info.onPeriod
            ? <div style={{margin:'8px 0',fontSize:14}}>🌸 <b>Đang trong kỳ</b> — ngày thứ {info.dayOfPeriod}/{info.length}. Nhớ giữ ấm & nghỉ ngơi nhé 💗</div>
            : <div style={{margin:'8px 0',fontSize:14}}>Kỳ tiếp theo: <b>{fmtDateVN(info.date)}</b> · còn <b>{info.days} ngày</b>{info.days<=3?<span className="pill" style={{marginLeft:6,background:'var(--primary)',color:'#fff'}}>Sắp đến!</span>:null}</div>}
        {fertile && <div className="muted" style={{fontSize:12.5,margin:'2px 0 8px'}}>🌱 Ngày dễ thụ thai (ước tính): <b>{fertile.a}–{fertile.b}</b> · rụng trứng ~{fertile.ov}</div>}
        <button className="btn" onClick={logToday}>🌸 Bắt đầu kỳ hôm nay</button>
        <div className="row" style={{gap:6,marginTop:8,alignItems:'center'}}>
          <span className="muted" style={{fontSize:11,flex:'0 0 auto'}}>Hoặc chọn ngày:</span>
          <input className="inp grow" type="date" max={todayISO()} value={pickDate} onChange={e=>setPickDate(e.target.value)} style={{padding:'6px 9px',fontSize:12.5}}/>
          <button className="btn sm soft" style={{flex:'0 0 auto'}} onClick={()=>logOn(pickDate)}>＋ Ghi</button>
        </div>
        {showSet && <div className="row" style={{gap:8,marginTop:8}}>
          <div className="field grow" style={{margin:0}}><label>Chu kỳ (ngày)</label><input className="inp" type="number" value={p.cycle||28} onChange={e=>setP({...p,cycle:Number(e.target.value)||28})}/></div>
          <div className="field grow" style={{margin:0}}><label>Số ngày hành kinh</label><input className="inp" type="number" value={p.length||5} onChange={e=>setP({...p,length:Number(e.target.value)||5})}/></div>
        </div>}
        {(avg||hist.length>0) && <div className="row" style={{marginTop:8}}>
          {avg && <span className="muted" style={{fontSize:11}}>📊 Chu kỳ TB: <b>{avg} ngày</b> · {hist.length} kỳ đã ghi</span>}
          <span className="grow"></span>
          {hist.length>0 && <button className="muted" style={{fontSize:11}} onClick={()=>setShowHist(v=>!v)}>📜 lịch sử</button>}
        </div>}
        {showHist && hist.length>0 && <div style={{marginTop:6}}>
          {hist.slice().reverse().slice(0,8).map((d,i,arr)=>{ const gap= i<arr.length-1? Math.round((new Date(d+'T00:00:00')-new Date(arr[i+1]+'T00:00:00'))/86400000):null;
            return <div key={d} className="muted" style={{fontSize:12.5,padding:'3px 0'}}>🌸 {fmtDateVN(d)}{gap?` · cách kỳ trước ${gap} ngày`:''}</div>; })}
          <button className="muted" style={{fontSize:11,marginTop:4}} onClick={undoLast}>↩︎ Xoá kỳ gần nhất (nếu ghi nhầm)</button>
        </div>}
      </div>
      <Collapse id="period-prep" defaultOpen={false} title="🧺 Cần chuẩn bị">
      {(()=>{ const groups=[],other=[]; PERIOD_PREP.forEach(x=>{ if(x&&typeof x==='object'&&x.items) groups.push(x); else if(typeof x==='string') other.push(x); }); if(other.length) groups.push({cat:'🧷 Khác',items:other});
        return groups.map(grp=>(
          <div key={grp.cat} className="card" style={{marginBottom:8,padding:'10px 13px'}}>
            <div style={{fontSize:12.5,fontWeight:800,marginBottom:6}}>{grp.cat}</div>
            <div>{(grp.items||[]).map(it=>(
              <button key={it} className="pill" style={{margin:'3px 6px 3px 0',padding:'7px 11px',fontSize:12.5,background:(p.prep||[]).indexOf(it)>=0?'var(--good)':'var(--chip)',color:(p.prep||[]).indexOf(it)>=0?'#fff':'var(--chip-tx)'}}
                onClick={()=>togglePrep(it)}>{(p.prep||[]).indexOf(it)>=0?'✓ ':''}{it}</button>
            ))}</div>
          </div>
        )); })()}
      </Collapse>
      <Collapse id="period-food" defaultOpen={false} title="🍲 Nên ăn (ấm bụng, bổ máu)">
      <div className="card"><div className="muted" style={{fontSize:14,lineHeight:1.7}}>{PERIOD_FOOD.join(' · ')}</div>
        <div className="muted" style={{fontSize:12.5,marginTop:8}}><b>Hạn chế:</b> {PERIOD_AVOID.join(', ')}.</div>
        <div className="muted" style={{fontSize:12.5,marginTop:6}}>👉 Vào <b>Thực đơn</b> chọn mục tiêu <b>🌸 Bổ máu (đèn đỏ)</b> để tạo thực đơn hợp ngày này.</div>
      </div>
      </Collapse>
      <div className="muted center" style={{fontSize:11,margin:'8px 14px'}}>Chỉ là ước tính theo chu kỳ — không thay thế tư vấn y tế.</div>
    </div>
  );
}
/* ============ Trả bài (chuyện gần gũi vợ chồng) — mục riêng tư ============ */
let _intimacyUnlocked=false;
function hashPin(s){ let h=5381; s=String(s||''); for(let i=0;i<s.length;i++){ h=((h*33)^s.charCodeAt(i))>>>0; } return 'h'+h.toString(36); }
const INT_MOODS=['😏','😍','🔥','🥰','😌','🌙'];
const INT_DESIRE=[{v:0,e:'😴',l:'Nghỉ ngơi'},{v:1,e:'🙂',l:'Bình thường'},{v:2,e:'😊',l:'Muốn gần'},{v:3,e:'🔥',l:'Rất muốn'}];
const INT_HEAT=['#e7cbd8','#eaa9c6','#e57fac','#db4f8f','#c22f76'];
const INT_WANT_SEED=[
  'Hẹn hò lãng mạn rồi về nhà sớm',
  'Massage thư giãn cho nhau',
  'Tắm / thư giãn cùng nhau',
  'Một tối không điện thoại — chỉ hai đứa',
  'Đổi không gian: khách sạn / homestay một đêm',
  'Viết điều thầm kín muốn thử rồi trao nhau',
  'Bất ngờ diện đồ ngủ đẹp cho nửa kia',
  'Nến thơm + nhạc nhẹ tạo không khí',
  'Đặt "buổi hẹn của hai đứa" cố định mỗi tuần',
  'Cùng xem phim lãng mạn rồi âu yếm',
  'Ôm nhau ngủ, không cần làm gì thêm',
  'Nhắn nhau những lời ngọt ngào giữa ngày',
  'Thử một buổi tối chỉ dành cho màn dạo đầu',
  'Cùng tắm nến & thư giãn',
  'Viết thư tay gợi cảm cho nhau',
  'Chọn một "mật khẩu" riêng để ngỏ ý',
  'Thử massage bằng tinh dầu cho nhau',
  'Một kỳ nghỉ ngắn chỉ hai đứa (gửi con)',
  'Cùng xem hoàng hôn rồi về sớm',
  'Thử đổi không gian: phòng khách, ban công…',
];
const INT_CHALLENGES=[
  {t:'Tuần của lời khen',d:'Mỗi ngày nói một điều bạn thấy hấp dẫn ở nửa kia.'},
  {t:'Hẹn hò không màn hình',d:'Một tối trong tuần cất điện thoại, chỉ trò chuyện & gần nhau.'},
  {t:'Massage 10 phút',d:'Đổi phiên massage vai/lưng cho nhau trước khi ngủ.'},
  {t:'Nụ hôn 6 giây',d:'Mỗi lần gặp nhau, ôm & hôn ít nhất 6 giây.'},
  {t:'Hỏi & lắng nghe',d:'Hỏi nửa kia điều họ thích, chỉ lắng nghe không phán xét.'},
  {t:'Bất ngờ nhỏ',d:'Một cử chỉ âu yếm bất ngờ giữa ngày (nhắn tin, ôm sau lưng…).'},
  {t:'Tối lãng mạn tại nhà',d:'Cơm tối nhẹ, nến, nhạc — dành trọn buổi tối cho nhau.'},
  {t:'Chạm nhẹ nhàng',d:'Nắm tay, ôm, tựa vai nhiều hơn — kết nối không vội vàng.'},
  {t:'Tuần âu yếm',d:'Mỗi tối ôm nhau ít nhất 2 phút trước khi ngủ.'},
  {t:'Không gian riêng',d:'Sắp một tối con ngủ sớm, dành trọn cho hai đứa.'},
  {t:'Lời khen mỗi ngày',d:'Mỗi ngày khen nửa kia một điểm hấp dẫn khác nhau.'},
  {t:'Tắt màn hình 9h',d:'Cả tuần, sau 21h cất điện thoại để bên nhau.'},
  {t:'Bất ngờ cuối tuần',d:'Lên một bất ngờ nhỏ cho nửa kia dịp cuối tuần.'},
  {t:'Hỏi & chiều',d:'Hỏi nửa kia một điều họ thích và thực hiện nó.'},
];
const INT_QUESTIONS=[
  'Điều gì khiến bạn thấy được yêu nhất?',
  'Kỷ niệm gần gũi nào của hai đứa bạn nhớ nhất?',
  'Có điều gì bạn muốn thử mà chưa dám nói?',
  'Bạn thích được âu yếm thế nào nhất?',
  'Khoảnh khắc nào khiến bạn thấy gắn kết với người kia?',
  'Điều nhỏ nào người kia làm khiến bạn "rung động"?',
  'Bạn muốn hai đứa dành thời gian riêng thế nào?',
  'Có điều gì khiến bạn ngại — mình cùng gỡ nhé?',
  'Dạo này hai đứa thấy gần gũi đủ chưa?',
  'Có điều gì khiến bạn thấy được yêu hơn?',
  'Mình có thể làm gì để tối của hai đứa thư giãn hơn?',
  'Bạn thích bắt đầu một buổi tối lãng mạn thế nào?',
  'Có điều gì bạn muốn mình thử mà chưa nói?',
  'Khi nào bạn thấy kết nối với người kia nhất?',
];
const INT_KNOW=[
  {t:'💗 Giữ lửa sau khi có con',body:'Có con nhỏ khiến cả hai mệt và ít thời gian riêng — điều này hoàn toàn bình thường. Vài cách giữ kết nối:\n• Hẹn "giờ của hai đứa" cố định, dù chỉ 20–30 phút sau khi con ngủ.\n• Ưu tiên gần gũi phi tình dục: ôm, hôn, nắm tay, massage — giữ lửa mà không áp lực.\n• Thay phiên chăm con để mỗi người có lúc nghỉ, bớt cáu gắt.\n• Nói rõ nhu cầu thay vì mong người kia tự đoán.'},
  {t:'🗣️ Nói về nhu cầu mà không ngại',body:'Trò chuyện cởi mở là chìa khóa:\n• Chọn lúc thoải mái, riêng tư, không phải giữa lúc căng thẳng.\n• Dùng câu "em/anh cảm thấy…", "em/anh thích…" thay vì trách móc.\n• Hỏi và thật sự lắng nghe mong muốn của người kia.\n• Thống nhất "tín hiệu" riêng để ngỏ ý mà không ngại lời.'},
  {t:'🛡️ Các biện pháp tránh thai phổ biến',body:'Tham khảo — nên hỏi bác sĩ để chọn cách hợp với mình:\n• Bao cao su: dễ dùng, còn ngừa bệnh lây qua đường tình dục.\n• Thuốc tránh thai hằng ngày: hiệu quả cao nếu uống đều.\n• Vòng tránh thai (IUD): hiệu quả lâu dài 3–10 năm.\n• Que cấy, miếng dán, tiêm…\n• Tính ngày theo chu kỳ: rủi ro cao hơn, chỉ nên kết hợp.\n• Thuốc tránh thai khẩn cấp: chỉ khi cần, không dùng thường xuyên.\nHiệu quả & tác dụng phụ khác nhau — nên tư vấn y tế.'},
  {t:'⚖️ Khi hai người lệch ham muốn',body:'Chênh lệch nhu cầu rất thường gặp:\n• Không xem là "lỗi" của ai — nhu cầu thay đổi theo sức khỏe, stress, nội tiết.\n• Tìm điểm chung: chất lượng hơn số lần; gần gũi không nhất thiết phải "đến đích".\n• Người muốn nhiều hơn: tránh tạo áp lực. Người muốn ít hơn: chủ động âu yếm theo cách khác.\n• Nếu kéo dài & ảnh hưởng tình cảm, cân nhắc gặp chuyên gia.'},
  {t:'🌸 Gần gũi sau sinh',body:'• Thường nên đợi ~4–6 tuần sau sinh, khi sản dịch hết & cơ thể hồi phục — hỏi bác sĩ ở lần khám sau sinh.\n• Có thể khô hơn do nội tiết (nhất là khi cho con bú) — gel bôi trơn giúp dễ chịu.\n• Bắt đầu nhẹ nhàng, ưu tiên thoải mái của người vợ; dừng nếu đau.\n• Đừng quên tránh thai — có thể mang thai lại sớm dù chưa có kinh trở lại.'},
  {t:'💞 Màn dạo đầu & kết nối',body:'Kết nối cảm xúc trước khi gần gũi giúp cả hai thăng hoa hơn:\n• Dành thời gian âu yếm, hôn, trò chuyện — đừng vội.\n• Tạo không gian: ánh sáng dịu, nhạc nhẹ, điện thoại để xa.\n• Khen ngợi, chạm nhẹ, quan tâm cảm xúc người kia.\n• Hỏi xem người kia thích gì — mỗi người mỗi khác.'},
  {t:'🩺 Sức khỏe & an toàn',body:'• Vệ sinh trước & sau; đi tiểu sau khi gần gũi giúp giảm viêm đường tiết niệu (nữ).\n• Khám phụ khoa/nam khoa định kỳ; tiêm phòng HPV nếu có thể.\n• Nếu đau, khó chịu kéo dài, ra máu bất thường… nên đi khám.\n• Ngủ đủ, vận động, giảm rượu bia — đều tốt cho chuyện chăn gối.'},
  {t:'💆 Massage đôi thư giãn',body:'Massage là màn dạo đầu tuyệt vời & giúp gắn kết:\n• Dùng chút dầu/kem ấm; bắt đầu ở vai, lưng, tay chân.\n• Lực vừa phải, chậm rãi; hỏi nửa kia thích mạnh hay nhẹ.\n• Kết hợp nhạc nhẹ & đèn dịu.\n• Đừng vội — mục tiêu là thư giãn & cảm nhận, không phải "đến đích".'},
  {t:'🤰 Gần gũi khi mang thai',body:'Nếu thai kỳ khỏe mạnh, gần gũi thường an toàn — nhưng nên:\n• Hỏi bác sĩ, nhất là khi có dấu hiệu bất thường (ra máu, dọa sảy, nhau tiền đạo…).\n• Chọn tư thế nhẹ nhàng: nằm nghiêng, vợ ở trên — tránh đè bụng.\n• Đi chậm, lắng nghe cơ thể vợ; dừng nếu khó chịu.\n• Ôm ấp, âu yếm vẫn rất quý dù không quan hệ.'},
  {t:'🌙 Sau "cuộc yêu" (afterglow)',body:'Khoảnh khắc sau khi gần gũi rất quan trọng để gắn kết:\n• Đừng vội quay đi ngủ / bấm điện thoại — ôm nhau vài phút.\n• Nói lời yêu thương, khen ngợi, cảm ơn.\n• Cùng uống nước, đắp chăn ấm.\n• Đây là lúc dễ tâm sự & thấy an toàn bên nhau nhất.'},
  {t:'🧊 Khi gặp trục trặc',body:'Chuyện "trục trặc" đôi lúc là bình thường — đừng hoảng:\n• Không đổ lỗi hay chê bai — càng áp lực càng khó.\n• Cười xòa, chuyển sang âu yếm/massage, thử lại lúc khác.\n• Mệt, stress, rượu bia, thiếu ngủ đều ảnh hưởng.\n• Nếu kéo dài & ảnh hưởng tình cảm, cùng nhau đi khám hoặc gặp chuyên gia.'},
];
const INT_POSITIONS=[
  {n:'Đối mặt (truyền thống)',d:'Gần gũi, dễ nhìn mắt & hôn nhau. Kê gối dưới hông vợ cho thoải mái hơn.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="24" cy="55" r="9"/><rect x="30" y="49" width="72" height="14" rx="7"/></g><g fill="#d98cae"><circle cx="30" cy="34" r="9"/><rect x="36" y="29" width="66" height="13" rx="6.5"/></g></svg>'},
  {n:'Nằm nghiêng ôm nhau ("thìa")',d:'Nhẹ nhàng, ít gắng sức — hợp khi mệt hoặc sau sinh.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="26" cy="44" r="9"/><rect x="32" y="38" width="64" height="15" rx="7.5"/></g><g fill="#d98cae"><circle cx="46" cy="46" r="8"/><rect x="52" y="41" width="56" height="13" rx="6.5"/></g></svg>'},
  {n:'Vợ ở trên',d:'Vợ chủ động nhịp độ & độ sâu; chồng thư giãn, thoải mái.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="20" cy="57" r="9"/><rect x="26" y="52" width="78" height="14" rx="7"/></g><g fill="#d98cae"><circle cx="62" cy="21" r="9"/><rect x="55" y="27" width="14" height="28" rx="7"/></g></svg>'},
  {n:'Ngồi ôm nhau',d:'Ấm áp, chậm rãi, nhiều ôm ấp — hợp không gian nhỏ.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="47" cy="23" r="9"/><rect x="40" y="29" width="14" height="36" rx="7"/></g><g fill="#d98cae"><circle cx="70" cy="25" r="9"/><rect x="64" y="31" width="14" height="32" rx="7"/></g></svg>'},
  {n:'Áp lưng (chồng phía sau)',d:'Cảm giác mới lạ; nên bắt đầu chậm & nhẹ nhàng.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="32" cy="30" r="9"/><rect x="36" y="34" width="44" height="14" rx="7" transform="rotate(14 36 41)"/></g><g fill="#d98cae"><circle cx="54" cy="34" r="8"/><rect x="58" y="38" width="44" height="13" rx="6.5" transform="rotate(14 58 44)"/></g></svg>'},
  {n:'Vợ ở trên (quay lưng)',d:'Vợ ngồi trên, quay lưng lại — góc mới lạ, vợ chủ động nhịp độ.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="18" cy="57" r="9"/><rect x="24" y="52" width="80" height="14" rx="7"/></g><g fill="#d98cae"><circle cx="76" cy="21" r="9"/><rect x="69" y="27" width="14" height="28" rx="7"/></g></svg>'},
  {n:'Gác chân lên vai',d:'Vợ gác chân lên vai chồng — vào sâu hơn; nhẹ nhàng, hỏi vợ có thoải mái không.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="20" cy="57" r="9"/><rect x="26" y="52" width="50" height="14" rx="7"/><rect x="70" y="26" width="12" height="30" rx="6" transform="rotate(22 76 41)"/></g><g fill="#d98cae"><circle cx="34" cy="33" r="9"/><rect x="40" y="29" width="54" height="13" rx="6.5"/></g></svg>'},
  {n:'Vợ nằm sấp',d:'Vợ nằm sấp, kê gối dưới hông — thư giãn, ôm ấp gần gũi.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="24" cy="55" r="9"/><rect x="30" y="50" width="74" height="13" rx="6.5"/></g><g fill="#d98cae"><circle cx="28" cy="40" r="9"/><rect x="34" y="36" width="70" height="13" rx="6.5"/></g></svg>'},
  {n:'Đứng ôm nhau',d:'Đứng ôm nhau — tiện & bất chợt; chú ý giữ thăng bằng, tựa tường cho vững.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="50" cy="16" r="9"/><rect x="43" y="22" width="14" height="46" rx="7"/></g><g fill="#d98cae"><circle cx="70" cy="16" r="9"/><rect x="63" y="22" width="14" height="46" rx="7"/></g></svg>'},
  {n:'Bên mép giường',d:'Vợ nằm mép giường, chồng đứng hoặc quỳ — dễ điều chỉnh độ cao & góc.',svg:'<svg viewBox="0 0 120 80" width="100%"><rect x="6" y="62" width="72" height="6" rx="3" fill="#c9ccd6"/><g fill="#8fb7b0"><circle cx="18" cy="50" r="9"/><rect x="24" y="45" width="52" height="13" rx="6.5"/></g><g fill="#d98cae"><circle cx="90" cy="22" r="9"/><rect x="83" y="28" width="14" height="32" rx="7"/></g></svg>'},
  {n:'Ngồi lên đùi (đối mặt)',d:'Vợ ngồi lên đùi chồng, đối mặt — nhiều ôm ấp, nhìn nhau, chậm rãi.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="52" cy="30" r="9"/><rect x="45" y="36" width="15" height="30" rx="7"/></g><g fill="#d98cae"><circle cx="61" cy="20" r="9"/><rect x="55" y="26" width="14" height="26" rx="7"/></g></svg>'},
  {n:'Nằm nghiêng đối mặt',d:'Hai người nằm nghiêng, đối mặt nhau — thân mật, ít gắng sức, hợp tối muộn.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="26" cy="42" r="9"/><rect x="32" y="37" width="52" height="14" rx="7"/></g><g fill="#d98cae"><circle cx="94" cy="46" r="9"/><rect x="36" y="43" width="52" height="13" rx="6.5"/></g></svg>'},
  {n:'Quỳ gập người (phía sau)',d:'Vợ quỳ gập người, chồng phía sau — cảm giác mạnh; bắt đầu chậm, để ý phản ứng của vợ.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="22" cy="52" r="9"/><rect x="28" y="47" width="48" height="14" rx="7" transform="rotate(8 28 54)"/></g><g fill="#d98cae"><circle cx="74" cy="30" r="9"/><rect x="68" y="36" width="14" height="24" rx="7"/></g></svg>'},
  {n:'Nâng cao hông',d:'Vợ nằm ngửa, kê gối nâng hông — đổi góc, thường dễ chịu & sâu hơn.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="18" cy="57" r="9"/><rect x="24" y="52" width="34" height="13" rx="6.5"/><rect x="52" y="41" width="36" height="13" rx="6.5" transform="rotate(-20 52 47)"/></g><g fill="#d98cae"><circle cx="88" cy="30" r="9"/><rect x="82" y="36" width="14" height="24" rx="7"/></g></svg>'},
  {n:'Kiểu chữ X',d:'Hai người bắt chéo ngang hông tạo hình chữ X — thư thái, vẫn nhìn được nhau.',svg:'<svg viewBox="0 0 120 80" width="100%"><g fill="#8fb7b0"><circle cx="16" cy="22" r="8"/><rect x="22" y="28" width="62" height="13" rx="6.5" transform="rotate(24 22 34)"/></g><g fill="#d98cae"><circle cx="16" cy="62" r="8"/><rect x="22" y="44" width="62" height="13" rx="6.5" transform="rotate(-24 22 50)"/></g></svg>'},
];
const INT_SPARK=[
  'Hôm nay ôm nửa kia thật lâu, không nói gì.','Nhắn một tin ngọt ngào giữa giờ làm.','Khen nửa kia một điều bạn thấy hấp dẫn.','Pha cho nửa kia ly nước/đồ uống họ thích.','Hôn tạm biệt lâu hơn thường lệ (6 giây).','Tối nay cất điện thoại 30 phút, chỉ hai đứa.','Nắm tay khi đi cạnh nhau.','Massage vai cho nửa kia 5 phút.','Nhắc lại một kỷ niệm đẹp của hai đứa.','Chuẩn bị bất ngờ nhỏ: món ăn, ghi chú, hoa.','Nhìn vào mắt nhau 1 phút, không cười.','Nói "cảm ơn vì…" một điều cụ thể.','Cùng nghe một bài hát kỷ niệm.','Rủ nửa kia tắm/thư giãn cùng tối nay.','Viết 3 điều bạn biết ơn về nửa kia.','Lên kế hoạch một buổi hẹn cuối tuần.','Ôm từ phía sau khi họ đang làm việc nhà.','Gửi một tấm ảnh kỷ niệm kèm lời nhắn.','Chủ động làm giúp việc họ hay làm.','Thì thầm một điều dễ thương vào tai họ.','Khen ngoại hình nửa kia hôm nay.','Chuẩn bị bữa sáng/cà phê cho nửa kia.','Dành 15 phút hỏi han ngày của nhau.','Gửi một lời "thả thính" bất ngờ.','Cùng xem hoàng hôn / uống trà tối.','Tặng một cái ôm 20 giây trước khi ngủ.','Viết một mẩu giấy nhắn để nơi họ dễ thấy.','Đề nghị một buổi tối "hẹn hò tại nhà".','Cùng nấu một món hai đứa thích.','Ôm nhau xem một tập phim yêu thích.','Để lại lời nhắn ngọt trong túi/áo nửa kia.','Rủ nửa kia đi dạo tối, nắm tay.','Tự tay pha trà/cà phê sáng cho nửa kia.','Cùng lên danh sách nơi muốn đi cùng nhau.','Gửi ảnh "hồi mới yêu" và nhắc kỷ niệm.','Ôm nửa kia và nói lời yêu.','Chuẩn bị nước ấm/khăn khi nửa kia đi làm về.','Cùng tắt đèn sớm, trò chuyện trước khi ngủ.','Vẽ/viết một tấm thiệp nhỏ bất ngờ.','Nhớ một sở thích nhỏ của nửa kia và chiều theo.','Chủ động làm hoà nếu đang giận nhau.','Đặt một bài hát tặng nửa kia rồi mở cùng nghe.','Cùng chụp một tấm ảnh đôi mới.',
];
const INT_TRUTHS=[
  'Lần đầu bạn thấy rung động với nửa kia là khi nào?','Điều gì ở nửa kia khiến bạn thấy hấp dẫn nhất?','Kỷ niệm gần gũi nào bạn nhớ nhất?','Có điều gì bạn muốn thử mà chưa dám nói?','Bạn thích được âu yếm ở đâu nhất?','Khoảnh khắc nào khiến bạn thấy được yêu nhất?','Điều nhỏ nào nửa kia làm khiến bạn "tan chảy"?','Bạn thích chủ động hay được chủ động hơn?','Buổi hẹn trong mơ của bạn là gì?','Có điều gì bạn tò mò muốn thử cùng nhau?','Bạn thấy mình quyến rũ nhất khi nào?','Điều gì khiến bạn thấy an toàn & thoải mái nhất bên nhau?','Bạn muốn nghe nửa kia nói câu gì nhiều hơn?','Bí mật nhỏ dễ thương nào bạn chưa kể?','Điều gì khiến bạn nhớ nhất về lần đầu của hai đứa?','Bạn thích được "tán tỉnh" như thế nào?','Có nơi nào bạn muốn hai đứa thử gần gũi không?','Bạn thấy tự tin nhất về điểm nào ở mình?','Điều gì ở nửa kia khiến bạn thấy thèm muốn?','Bạn thích trước hay sau khi gần gũi được ôm ấp hơn?','Có ranh giới nào bạn muốn nửa kia biết & tôn trọng?','Điều lãng mạn nhất nửa kia từng làm cho bạn?','Một buổi tối hoàn hảo của hai đứa sẽ diễn ra thế nào?','Bạn muốn được khen kiểu nào khi gần gũi?',
];
const INT_DARES=[
  'Hôn nửa kia 10 giây.','Thì thầm điều bạn thích vào tai nửa kia.','Massage vai nửa kia 1 phút.','Ôm nửa kia thật chặt 20 giây.','Nhìn mắt nhau 30 giây không rời.','Khen 3 điều hấp dẫn ở nửa kia.','Nắm tay & kể một điều bạn mong muốn tối nay.','Hôn lên trán, má rồi tay nửa kia.','Nhảy một điệu chậm cùng nhau.','Gửi nửa kia một ánh mắt "mời gọi".','Vuốt tóc nửa kia trong 30 giây.','Kể một điều bạn thấy "cuốn" ở nửa kia hôm nay.','Cù nhẹ cho nửa kia cười.','Đổi vai: để nửa kia "ra lệnh" một việc dễ thương.','Hôn lên cổ nửa kia thật nhẹ.','Nói 3 điều bạn muốn làm cùng nửa kia tối nay.','Ôm nửa kia từ phía sau 30 giây.','Vuốt nhẹ lưng nửa kia trong 1 phút.','Thì thầm một lời khen táo bạo vào tai nửa kia.','Cởi áo khoác cho nửa kia một cách nhẹ nhàng.','Đặt tay nửa kia lên tim mình, để họ cảm nhịp.','Chọn nhạc & mời nửa kia một điệu nhảy chậm.','Kể một tưởng tượng dễ thương cho nửa kia nghe.','Hôn ở nơi nửa kia thích nhất (hỏi trước nếu chưa biết).',
];
const INT_DICE_ACT=['💋 Hôn','🤲 Chạm nhẹ','💆 Massage','🌬️ Thổi nhẹ','🫦 Cắn yêu','🤗 Ôm','😙 Hôn phớt','👅 Liếm nhẹ'];
const INT_DICE_PART=['👄 Môi','🧣 Cổ','👂 Tai','🤚 Bàn tay','💪 Vai','🫀 Ngực','🦵 Đùi','🔙 Lưng'];
const INT_HOT=[
  'Điều gì khiến bạn thấy thư giãn nhất bên nhau?','Bạn thích được ôm kiểu nào?','Nụ hôn kiểu nào bạn thích nhất?','Bạn thích được chạm ở đâu?','Điều gì khiến bạn dễ "nổi hứng"?','Bạn thích không khí thế nào cho một tối lãng mạn?','Bạn muốn thử điều gì mới trong tuần này?','Có tưởng tượng nhẹ nhàng nào bạn từng nghĩ tới?','Điều gì nửa kia làm khiến bạn "mê mẩn"?','Bạn muốn dẫn dắt hay được dẫn dắt tối nay?','Một điều táo bạo (trong thoải mái) bạn muốn thử?','Cách nào giúp bạn thấy được khao khát nhất?','Bạn thích được hôn ở đâu nhất?','Có kiểu chạm nào khiến bạn "rùng mình" dễ chịu?','Bạn thích ánh sáng thế nào khi gần gũi — sáng hay mờ?','Một điều bạn muốn nửa kia làm nhiều hơn khi gần gũi?','Bạn muốn thử ở đâu ngoài phòng ngủ không?','Điều gì giúp bạn thả lỏng & tận hưởng trọn vẹn hơn?','Bạn thích tốc độ chậm rãi hay mãnh liệt hơn?','Có "vai" nào bạn tò mò muốn thử tối nay?',
];
const INT_AMBIANCE=['🕯️ Thắp nến','🎵 Bật nhạc nhẹ','💡 Chỉnh đèn dịu','📵 Điện thoại để xa','🚪 Khoá cửa phòng','🌸 Xịt hương thơm','🍷 Chuẩn bị đồ uống','🛏️ Thay ga giường sạch','🧴 Sẵn gel bôi trơn','🚿 Tắm gội thơm tho','🛁 Chuẩn bị nước ấm','🍫 Sô-cô-la / trái cây','🎶 Playlist chọn sẵn','🪟 Rèm che kín'];
const INT_PLAYLISTS=[
  {n:'R&B nhẹ nhàng',d:'The Weeknd, SZA, Daniel Caesar…'},
  {n:'Lo-fi ấm cúng',d:'nhạc lo-fi chill, không lời'},
  {n:'Ballad Việt tình',d:'Vũ, Hà Anh Tuấn, Trung Quân…'},
  {n:'Jazz tối',d:'jazz mượt, tiếng saxophone'},
  {n:'Acoustic dịu',d:'guitar mộc, giọng hát ấm'},
  {n:'City pop / Synth chill',d:'nhịp êm, hoài niệm'},
  {n:'Bolero / Trữ tình',d:'không khí hoài cổ, tình tứ'},
];
const INT_MEN=[
  {t:'🏋️ Bài tập Kegel cho nam',body:'Kegel giúp cơ sàn chậu khỏe → kiểm soát tốt hơn, cải thiện phong độ.\n• Xác định cơ: siết như khi nhịn tiểu (chỉ để nhận biết, KHÔNG tập lúc đang đi tiểu).\n• Bài tập: siết 3–5 giây, thả 3–5 giây × 10 lần, 3 hiệp/ngày.\n• Tăng dần lên siết 10 giây. Thở đều, không nín thở, không gồng bụng/mông.\n• Kiên trì 4–6 tuần sẽ thấy cải thiện.'},
  {t:'💪 Mẹo cải thiện phong độ',body:'• Ngủ đủ 7–8 tiếng — thiếu ngủ giảm testosterone.\n• Tập thể dục đều (chân & tim mạch), giữ cân hợp lý.\n• Ăn đủ kẽm, omega-3, rau xanh; hạn chế rượu bia; bỏ thuốc lá.\n• Giảm stress — lo âu là "kẻ thù" số 1 của phong độ.\n• Uống đủ nước; hạn chế đồ ăn nhanh & đường.'},
  {t:'🧘 Thư giãn & giảm lo âu',body:'Áp lực "phải làm tốt" dễ gây trục trặc. Cách gỡ:\n• Tập trung vào cảm giác & kết nối, đừng đặt mục tiêu "thành tích".\n• Thở sâu 4-7-8 (hít 4s, giữ 7s, thở 8s) vài lần trước khi gần gũi.\n• Trò chuyện cởi mở với vợ — được thấu hiểu giúp thả lỏng.\n• Ngủ đủ, giảm caffeine buổi tối.'},
  {t:'🩺 Khi nào nên đi khám nam khoa',body:'Nên đi khám nếu:\n• Trục trặc kéo dài vài tuần (không phải do mệt/stress nhất thời).\n• Đau, sưng, u cục, tiểu buốt/rắt, ra dịch bất thường.\n• Giảm ham muốn rõ rệt, mệt mỏi kéo dài (có thể do nội tiết).\n👉 Nên khám nam khoa/tổng quát định kỳ 6–12 tháng/lần. Đừng ngại — bác sĩ giúp bạn khỏe hơn.'},
  {t:'🥗 Thực phẩm tốt cho phong độ',body:'Ăn uống ảnh hưởng lớn tới sinh lý nam:\n• Kẽm: hàu, thịt bò, hạt bí — hỗ trợ testosterone.\n• Omega-3: cá hồi, cá thu — tốt cho mạch máu.\n• Rau xanh, củ dền, lựu — giúp lưu thông máu.\n• Hạn chế đường, đồ chiên, rượu bia.\n• Uống đủ nước, ăn đều, ngủ đủ.'},
  {t:'⏱️ Mẹo kéo dài & kiểm soát',body:'• Tập Kegel đều (xem bài Kegel) — cải thiện kiểm soát.\n• Kỹ thuật "dừng–thở": khi gần tới, dừng lại, hít thở sâu, tiếp tục sau vài giây.\n• Tập trung vào cảm giác chung & màn dạo đầu thay vì "đích".\n• Giảm lo âu — càng thả lỏng càng kiểm soát tốt.\n• Nếu quá sớm thường xuyên & lo lắng, hỏi bác sĩ nam khoa.'},
];
const INT_WD=[[1,'Thứ 2'],[2,'Thứ 3'],[3,'Thứ 4'],[4,'Thứ 5'],[5,'Thứ 6'],[6,'Thứ 7'],[0,'Chủ nhật']];
const INT_CARE={
  pms:['Kiên nhẫn hơn, tránh tranh luận căng thẳng','Chủ động hỏi han, ôm & vỗ về','Chuẩn bị món / đồ ngọt vợ thích','Gánh bớt việc nhà để vợ nghỉ','Khen & trấn an — đừng chê hay trêu vô duyên'],
  period:['Giữ ấm, pha nước ấm / trà gừng cho vợ','Chuẩn bị sẵn băng vệ sinh, túi chườm','Nhận việc nhà & trông con để vợ nghỉ','Tránh đồ lạnh/chua; hỏi vợ có đau không','Nhẹ nhàng, kiên nhẫn, quan tâm nhiều hơn'],
  ov:['Vợ đang phơi phới — rủ hẹn hò, đi chơi','Thời điểm hai đứa dễ gần gũi & thăng hoa'],
  stable:['Tâm trạng vợ thường ổn — tận hưởng ngày vui bên nhau','Giữ những quan tâm nhỏ mỗi ngày'],
};
function IntimacySection({people,me,flash,view}){
  const v=view||'log';
  const DEF={log:{},want:[],signal:null,desire:{},plan:'',healthNote:'',pin:'',rejects:[]};
  const [d,setD]=useLocal('ju.intimacy',DEF);
  const [seen,setSeen]=useLocal('ju.intimacySeen',{});
  const data=d||DEF;
  const [unlocked,setUnlocked]=useState(()=>_intimacyUnlocked||!(data.pin));
  const [pinIn,setPinIn]=useState('');
  const [rate,setRate]=useState(0);
  const [lnote,setLnote]=useState('');
  const [rjnote,setRjnote]=useState('');
  const [wtext,setWtext]=useState('');
  const [np,setNp]=useState('');
  const [truth,setTruth]=useState(null);
  const [dare,setDare]=useState(null);
  const [dice,setDice]=useState(null);
  const [sparkAlt,setSparkAlt]=useState(0);
  const today=todayISO();
  const set=(patch)=>setD({...data,...patch});
  const other=me==='a'?'b':'a';
  const otName=(people&&people[other]&&people[other].name)||(other==='a'?'anh ấy':'nửa kia');
  useEffect(()=>{ const tl=(data.log||{})[today]; setRate(tl?tl.r||0:0); setLnote(tl?tl.note||'':''); },[today]);
  useEffect(()=>{ if(!unlocked) return; const sg=data.signal; if(sg&&sg.by&&sg.by!==me&&(sg.at||0)>((seen&&seen[me])||0)){ setSeen({...(seen||{}),[me]:sg.at}); } },[unlocked,data.signal&&data.signal.at]);
  const savePin=()=>{ if((np||'').length<4){ flash&&flash('Mã tối thiểu 4 số'); return; } set({pin:hashPin(np)}); _intimacyUnlocked=true; setNp(''); flash&&flash('Đã đặt mã khoá 🔒'); };
  const removePin=()=>{ set({pin:''}); setNp(''); flash&&flash('Đã bỏ mã khoá'); };
  const tryUnlock=()=>{ if(hashPin(pinIn)===data.pin){ _intimacyUnlocked=true; setUnlocked(true); setPinIn(''); } else { flash&&flash('Mã chưa đúng'); setPinIn(''); } };
  if(!unlocked){
    return (<div>
      <div className="card" style={{textAlign:'center',padding:'26px 16px'}}>
        <div style={{fontSize:40}}>🔒</div>
        <div className="hc-title" style={{marginTop:6}}>Mục riêng tư</div>
        <div className="muted" style={{fontSize:12.5,margin:'6px 0 12px'}}>Nhập mã để mở “Trả bài”.</div>
        <input className="inp" type="password" inputMode="numeric" value={pinIn} maxLength={8} onChange={e=>setPinIn(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') tryUnlock(); }} style={{maxWidth:170,margin:'0 auto',textAlign:'center',letterSpacing:5}} placeholder="••••"/>
        <div style={{marginTop:12}}><button className="btn" onClick={tryUnlock}>Mở khoá</button></div>
      </div>
    </div>);
  }
  const log=data.log||{};
  const dts=Object.keys(log).sort();
  const last=dts.length?dts[dts.length-1]:null;
  const daysSince=last?Math.round((new Date(today+'T00:00:00')-new Date(last+'T00:00:00'))/86400000):null;
  const ym=today.slice(0,7);
  const cntMonth=dts.filter(x=>x.slice(0,7)===ym).length;
  const wkAgo=(()=>{ const x=new Date(); x.setDate(x.getDate()-6); return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate()); })();
  const cntWeek=dts.filter(x=>x>=wkAgo).length;
  const ratings=dts.map(x=>log[x]&&log[x].r).filter(Boolean);
  const avgR=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length):0;
  const todayLogged=!!log[today];
  const logToday=()=>{ set({log:{...log,[today]:{r:rate||0,note:lnote||'',by:me}}}); celebrate(['💗','❤️','🔥']); };
  const upToday=(patch)=>{ if(!log[today])return; set({log:{...log,[today]:{...log[today],...patch}}}); };
  const unlogToday=()=>{ const lg={...log}; delete lg[today]; set({log:lg}); };
  const heat=(()=>{ const t=new Date(today+'T00:00:00'); const dow=(t.getDay()+6)%7; const st=new Date(t); st.setDate(st.getDate()-(11*7+dow)); const cols=[]; for(let c=0;c<12;c++){ const col=[]; for(let r=0;r<7;r++){ const dd=new Date(st); dd.setDate(dd.getDate()+c*7+r); const k=dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate()); col.push({k,has:!!log[k],r:(log[k]&&log[k].r)||0,future:dd>t}); } cols.push(col); } return cols; })();
  const sg=data.signal;
  const sendSignal=(m)=>{ set({signal:{by:me,at:Date.now(),mood:m||'😏',reply:null}}); flash&&flash('Đã gửi tín hiệu 💌'); };
  const replySignal=(kind)=>{ if(!sg)return; set({signal:{...sg,reply:kind?{by:me,kind,at:Date.now()}:null}}); if(kind)flash&&flash(kind==='yes'?'❤️ Đã đồng ý':'🌙 Đã hẹn hôm khác'); };
  const clearSignal=()=>set({signal:null});
  const desire=data.desire||{};
  const myD=(desire[today]||{})[me];
  const otD=(desire[today]||{})[other];
  const setDesire=(lv)=>set({desire:{...desire,[today]:{...(desire[today]||{}),[me]:lv}}});
  const rejects=data.rejects||[];
  const addReject=(note)=>{ set({rejects:[{id:uid(),date:today,by:me,note:(note||'').trim()},...rejects]}); };
  const delReject=(id)=>set({rejects:rejects.filter(x=>x.id!==id)});
  const want=data.want||[];
  const addWant=(t)=>{ const tx=(t||wtext).trim(); if(!tx)return; if(want.some(w=>w.text===tx)){ setWtext(''); return; } set({want:[...want,{id:uid(),text:tx,a:false,b:false}]}); setWtext(''); };
  const toggleWant=(id)=>{ const nw=want.map(w=>w.id===id?{...w,[me]:!w[me]}:w); const w2=nw.find(w=>w.id===id); if(w2&&w2.a&&w2.b) celebrate(['💞','💖']); set({want:nw}); };
  const delWant=(id)=>set({want:want.filter(w=>w.id!==id)});
  const wIdx=(()=>{ const dd=new Date(); return Math.floor((dd-new Date(dd.getFullYear(),0,1))/(7*86400000)); })();
  const chal=INT_CHALLENGES[((wIdx%INT_CHALLENGES.length)+INT_CHALLENGES.length)%INT_CHALLENGES.length];
  const dIdx=(()=>{ const dd=new Date(); return Math.floor((dd-new Date(dd.getFullYear(),0,0))/86400000); })();
  const q=INT_QUESTIONS[((dIdx%INT_QUESTIONS.length)+INT_QUESTIONS.length)%INT_QUESTIONS.length];
  const info=periodNext();
  const plan=data.plan||'';
  const cyc=(()=>{ if(!info) return null; if(info.onPeriod) return {k:'period'}; const ov=new Date(info.date+'T00:00:00'); ov.setDate(ov.getDate()-14); const t=new Date(today+'T00:00:00'); const dOv=Math.round((ov-t)/86400000); return {k:(dOv>=-1&&dOv<=3)?'fertile':'low',dOv,ovStr:ov.getDate()+'/'+(ov.getMonth()+1)}; })();
  const cycMsg=(()=>{ if(!info) return null; if(cyc.k==='period') return '🌸 Đang kỳ đèn đỏ — ngày '+info.dayOfPeriod+'/'+info.length+'. Ưu tiên nghỉ ngơi, nhẹ nhàng.'; if(plan==='tranhthai') return cyc.k==='fertile'?'⚠️ Đang ngày dễ thụ thai — nên dùng biện pháp tránh thai an toàn.':'🟢 Hôm nay khả năng thụ thai thấp hơn (vẫn không tuyệt đối an toàn).'; if(plan==='muoncon') return cyc.k==='fertile'?'💚 Ngày dễ thụ thai — thời điểm tốt nếu muốn thêm bé (rụng trứng ~'+cyc.ovStr+').':'Hôm nay khả năng thụ thai thấp; ngày dễ đậu quanh '+cyc.ovStr+'.'; return cyc.k==='fertile'?('🌱 Đang trong ngày dễ thụ thai (rụng trứng ~'+cyc.ovStr+').'):('Ngày rụng trứng ước tính ~'+cyc.ovStr+'.'); })();
  const wifeName=(people&&people.b&&people.b.name)||'vợ';
  const emo=(()=>{ if(!info) return null; if(info.onPeriod) return {k:'period',e:'🌸',t:'Kỳ đèn đỏ',d:wifeName+' có thể mệt, đau bụng & nhạy cảm hơn. Hãy nhẹ nhàng, quan tâm.'}; const dtp=info.days; if(dtp<=5) return {k:'pms',e:'💛',t:'Tiền kinh nguyệt · dễ nhạy cảm',d:'Còn '+dtp+' ngày tới kỳ. Nội tiết thay đổi khiến '+wifeName+' dễ xúc động, tủi thân hoặc cáu. Kiên nhẫn & ân cần hơn nhé.'}; if(dtp>=12&&dtp<=16) return {k:'ov',e:'🌱',t:'Rụng trứng',d:wifeName+' thường vui vẻ, nhiều năng lượng.'}; return {k:'stable',e:'🙂',t:'Giai đoạn ổn định',d:'Tâm trạng '+wifeName+' thường tốt.'}; })();
  const sensWin=(()=>{ if(!info) return null; const np=new Date(info.date+'T00:00:00'); const ps=new Date(np); ps.setDate(ps.getDate()-5); const pe=new Date(np); pe.setDate(pe.getDate()+((info.length||5)-1)); const f=x=>x.getDate()+'/'+(x.getMonth()+1); return {range:f(ps)+'–'+f(pe)}; })();
  const pick=(arr)=>arr[Math.floor(Math.random()*arr.length)];
  const libWin=(()=>{ if(!info||info.onPeriod) return null; const np2=new Date(info.date+'T00:00:00'); const ov=new Date(np2); ov.setDate(ov.getDate()-14); const a=new Date(ov); a.setDate(a.getDate()-2); const b=new Date(ov); b.setDate(b.getDate()+1); const f=x=>x.getDate()+'/'+(x.getMonth()+1); const t=new Date(today+'T00:00:00'); return {range:f(a)+'–'+f(b),inWin:(t>=a&&t<=b)}; })();
  const sparkTip=INT_SPARK[(((dIdx+sparkAlt)%INT_SPARK.length)+INT_SPARK.length)%INT_SPARK.length];
  const dn=data.dateNight||{weekday:null,note:''};
  const setDN=(vv)=>set({dateNight:vv});
  const nextDateNight=(()=>{ if(dn.weekday==null) return null; const t=new Date(today+'T00:00:00'); const diff=(dn.weekday-t.getDay()+7)%7; const d2=new Date(t); d2.setDate(d2.getDate()+diff); const lbl=(INT_WD.find(w=>w[0]===dn.weekday)||[0,''])[1]; return lbl+', '+d2.getDate()+'/'+(d2.getMonth()+1)+(diff===0?' (tối nay)':' (còn '+diff+' ngày)'); })();
  const amb=data.ambiance||[];
  const toggleAmb=(x)=>set({ambiance: amb.includes(x)?amb.filter(y=>y!==x):[...amb,x]});
  const hotIdx=data.hotIdx||0;
  const desOf=(dv)=>INT_DESIRE.find(x=>x.v===dv)||{e:'',l:''};
  return (
    <div>
      {v==='log' && <React.Fragment>
        <div className="card" style={{background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
          <div className="row"><b>💗 Nhật ký gần gũi</b><span className="grow"></span>{daysSince!=null&&<span className="muted" style={{fontSize:11}}>{daysSince===0?'hôm nay 💗':'đã '+daysSince+' ngày'}</span>}</div>
          <div className="muted" style={{fontSize:12.5,margin:'6px 0 8px'}}>Tuần này <b>{cntWeek}</b> · tháng này <b>{cntMonth}</b>{avgR?<span> · điểm TB <b>{avgR.toFixed(1)}</b>★</span>:null}</div>
          {!todayLogged
            ? <button className="btn" onClick={logToday}>💗 Đánh dấu hôm nay</button>
            : <div>
                <div className="row" style={{gap:8,alignItems:'center'}}><span style={{fontSize:14}}>✓ Đã đánh dấu hôm nay</span><span className="grow"></span><Stars value={rate} onChange={sv=>{ setRate(sv); upToday({r:sv}); }}/></div>
                <input className="inp" style={{marginTop:7,padding:'7px 11px',fontSize:12.5}} placeholder="Ghi chú riêng (tuỳ chọn)" value={lnote} onChange={e=>setLnote(e.target.value)} onBlur={()=>upToday({note:lnote})}/>
                <button className="muted" style={{fontSize:11,marginTop:6}} onClick={unlogToday}>↩︎ Bỏ đánh dấu hôm nay</button>
              </div>}
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>📅 Lịch sử gần đây (12 tuần)</div>
          <div style={{display:'flex',gap:3,overflowX:'auto',paddingBottom:4}}>
            {heat.map((col,ci)=><div key={ci} style={{display:'flex',flexDirection:'column',gap:3}}>{col.map(cell=><div key={cell.k} title={fmtDateVN(cell.k)} style={{width:13,height:13,borderRadius:3,background:cell.future?'transparent':(cell.has?INT_HEAT[Math.max(0,Math.min(4,(cell.r||1)-1))]:'var(--chip)'),opacity:cell.future?.2:1}}></div>)}</div>)}
          </div>
          <div className="muted" style={{fontSize:11,marginTop:8}}>Ô đậm = có đánh dấu (đậm hơn nếu điểm cao). Chỉ mình hai đứa thấy.</div>
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:6}}>🌙 Những lần bị từ chối</div>
          <div className="muted" style={{fontSize:12.5,marginBottom:8}}>Ghi lại khi bạn ngỏ ý mà {otName} chưa sẵn sàng — để nhìn lại nhẹ nhàng, hiểu nhau hơn (chỉ hai đứa thấy).</div>
          <div className="row" style={{gap:8}}>
            <input className="inp grow" placeholder="Lý do / cảm giác (tuỳ chọn)…" value={rjnote} onChange={e=>setRjnote(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ addReject(rjnote); setRjnote(''); } }}/>
            <button className="btn sm" onClick={()=>{ addReject(rjnote); setRjnote(''); }}>＋ Ghi</button>
          </div>
          {rejects.length===0
            ? <div className="muted" style={{fontSize:12.5,marginTop:8}}>Chưa ghi lần nào.</div>
            : <div style={{marginTop:8}}>
                <div className="muted" style={{fontSize:11,marginBottom:6}}>Đã ghi {rejects.length} lần{rejects.length>=3?' — có thể nên trò chuyện nhẹ nhàng với nhau 💛':''}</div>
                {rejects.slice(0,20).map(x=>(
                  <div key={x.id} className="row" style={{padding:'7px 0',borderBottom:'1px solid var(--line)',alignItems:'flex-start',gap:8}}>
                    <span className="pill" style={{flex:'0 0 auto'}}>{fmtDateVN(x.date)}</span>
                    <span className="grow" style={{fontSize:13.5}}>{x.by===me?'Bạn ngỏ ý':otName+' ngỏ ý'}{x.note?' · '+x.note:''}</span>
                    <button className="muted tapmin" aria-label="Xoá" onClick={()=>delReject(x.id)}><Ic n="dong" size={15}/></button>
                  </div>
                ))}
              </div>}
        </div>
      </React.Fragment>}

      {v==='signal' && <div className="card">
        <div className="hc-title" style={{marginBottom:8}}>😏 Tín hiệu tế nhị</div>
        {!sg
          ? <div><div className="muted" style={{fontSize:12.5,marginBottom:6}}>Gửi {otName} một tín hiệu kín đáo — chỉ hai đứa hiểu 😉</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{INT_MOODS.map(m=><button key={m} className="pill" style={{fontSize:16,padding:'6px 11px'}} onClick={()=>sendSignal(m)}>{m}</button>)}</div></div>
          : sg.by===me
            ? <div><div style={{fontSize:14}}>Bạn đã bật tín hiệu <b style={{fontSize:18}}>{sg.mood}</b> cho {otName}.</div>
                {sg.reply?<div style={{marginTop:6,fontSize:14}}>{sg.reply.kind==='yes'?'❤️ Nửa kia đồng ý rồi!':'🌙 Nửa kia hẹn hôm khác.'}</div>:<div className="muted" style={{marginTop:6,fontSize:12.5}}>Đang chờ nửa kia phản hồi…</div>}
                <button className="muted" style={{fontSize:11,marginTop:8}} onClick={clearSignal}>✕ Thu hồi tín hiệu</button></div>
            : <div><div style={{fontSize:14}}>💌 {otName} bật tín hiệu <b style={{fontSize:18}}>{sg.mood}</b> cho bạn!</div>
                {sg.reply&&sg.reply.by===me
                  ? <div style={{marginTop:6,fontSize:14}}>{sg.reply.kind==='yes'?'❤️ Bạn đã đồng ý':'🌙 Bạn đã hẹn hôm khác'} <span className="muted" style={{fontSize:11,cursor:'pointer',textDecoration:'underline'}} onClick={()=>replySignal(null)}>đổi</span></div>
                  : <div className="row" style={{gap:8,marginTop:8}}><button className="btn grow" onClick={()=>replySignal('yes')}>❤️ Đồng ý</button><button className="btn soft grow" onClick={()=>replySignal('later')}>🌙 Hôm khác</button></div>}
              </div>}
        <div style={{marginTop:12,borderTop:'1px solid var(--line)',paddingTop:10}}>
          <div className="muted" style={{fontSize:12.5,marginBottom:6}}>Tâm trạng hôm nay của bạn:</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{INT_DESIRE.map(o=><button key={o.v} className="pill" style={{padding:'6px 10px',background:myD===o.v?'var(--primary)':'var(--chip)',color:myD===o.v?'#fff':'var(--chip-tx)'}} onClick={()=>setDesire(o.v)}>{o.e} {o.l}</button>)}</div>
          {otD!=null&&<div className="muted" style={{fontSize:12.5,marginTop:8}}>{otName} hôm nay: <b>{desOf(otD).e} {desOf(otD).l}</b></div>}
        </div>
      </div>}

      {v==='want' && <React.Fragment>
        <div className="card">
          <div className="hc-title" style={{marginBottom:4}}>✨ Gợi ý tuần này</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>🎯 {chal.t}</div>
          <div className="muted" style={{fontSize:12.5,marginTop:2}}>{chal.d}</div>
          <div style={{fontSize:14,marginTop:10}}>💬 <b>Câu hỏi hôm nay:</b> {q}</div>
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:6}}>🌟 Muốn thử cùng nhau</div>
          <div className="muted" style={{fontSize:12.5,marginBottom:8}}>Mỗi người tự tích 💖 điều mình muốn. Cả hai cùng thích → 💞 hợp ý nhau!</div>
          {want.length===0&&<div className="muted" style={{fontSize:12.5,margin:'4px 0 8px'}}>Chưa có mục nào — thêm bên dưới hoặc chọn gợi ý.</div>}
          {want.slice().sort((a,b)=>((b.a&&b.b)?1:0)-((a.a&&a.b)?1:0)).map(w=>{ const mine=w[me],their=w[other],match=w.a&&w.b; return (
            <div key={w.id} className="row" style={{padding:'6px 0',borderBottom:'1px solid var(--line)'}}>
              <button onClick={()=>toggleWant(w.id)} aria-label={mine?'Bỏ muốn':'Cũng muốn'} className="tapmin" style={{color:'var(--heart)'}}><Ic n={mine?'tim':'timrong'} size={18}/></button>
              <span className="grow" style={{fontSize:14}}>{w.text}</span>
              {match?<span className="pill" style={{background:'var(--primary)',color:'#fff'}}>💞 Cả hai</span>:(their?<span className="pill">nửa kia 💗</span>:null)}
              <button className="muted tapmin" aria-label="Xoá" onClick={()=>delWant(w.id)} style={{marginLeft:6}}><Ic n="dong" size={15}/></button>
            </div>); })}
          <div className="row" style={{gap:8,marginTop:8}}>
            <input className="inp grow" placeholder="Thêm điều muốn thử…" value={wtext} onChange={e=>setWtext(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addWant(); }}/>
            <button className="btn sm" onClick={()=>addWant()}>＋</button>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>{INT_WANT_SEED.filter(s=>!want.some(w=>w.text===s)).slice(0,8).map(s=><button key={s} className="pill" style={{opacity:.9}} onClick={()=>addWant(s)}>+ {s}</button>)}</div>
        </div>
      </React.Fragment>}

      {v==='health' && <div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>💛 Chu kỳ & cảm xúc của {wifeName}</div>
          {!info
            ? <div className="muted" style={{fontSize:12.5}}>Chưa có dữ liệu chu kỳ. Vào mục <b>🌸 Chu kỳ</b> (nhóm Sức khỏe) ghi ngày kỳ gần nhất — app sẽ dự đoán ngày {wifeName} dễ nhạy cảm để bạn quan tâm đúng lúc.</div>
            : <React.Fragment>
                <div style={{background:'var(--chip)',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{fontSize:15,fontWeight:800}}>{emo.e} {emo.t}</div>
                  <div style={{fontSize:12.5,marginTop:3,lineHeight:1.55,opacity:.9}}>{emo.d}</div>
                </div>
                <div className="muted" style={{fontSize:12.5,marginTop:8}}>Kỳ tiếp theo: <b>{fmtDateVN(info.date)}</b> · còn <b>{info.days}</b> ngày{sensWin?<span> · ngày nhạy cảm dự kiến <b>{sensWin.range}</b></span>:null}</div>
                {libWin && <div style={{fontSize:12.5,marginTop:8,background:'var(--chip)',borderRadius:10,padding:'8px 11px'}}>💗 <b>{wifeName}</b> dễ hứng khởi (quanh rụng trứng): <b>{libWin.range}</b>{libWin.inWin?<span className="pill" style={{marginLeft:6,background:'var(--primary)',color:'#fff'}}>Hôm nay 😏</span>:null}</div>}
                {INT_CARE[emo.k] && <div style={{marginTop:10}}>
                  <div className="hc-title" style={{fontSize:12.5}}>💡 Gợi ý cho bạn</div>
                  <ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:12.5,lineHeight:1.7}}>{INT_CARE[emo.k].map((t,i)=><li key={i}>{t}</li>)}</ul>
                </div>}
              </React.Fragment>}
        </div>
        <div className="card">
          <div className="field" style={{margin:0}}><label>Ghi chú sức khỏe / mệt–khoẻ (riêng tư)</label><textarea className="inp" value={data.healthNote||''} onChange={e=>set({healthNote:e.target.value})} placeholder="vd: đang mệt, kiêng cữ, dạo này căng thẳng…"/></div>
        </div>
        {data.showPlan && <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>🍼 Kế hoạch thụ thai</div>
          <div className="row" style={{gap:6,flexWrap:'wrap',marginBottom:8}}>
            {[['','—'],['tranhthai','🛡️ Tránh thai'],['muoncon','🤰 Muốn thêm bé']].map(([k,l])=><button key={k} className="pill" style={{background:plan===k?'var(--primary)':'var(--chip)',color:plan===k?'#fff':'var(--chip-tx)'}} onClick={()=>set({plan:k})}>{l}</button>)}
          </div>
          {info
            ? <div style={{fontSize:14,lineHeight:1.6}}>{cycMsg}</div>
            : <div className="muted" style={{fontSize:12.5}}>Cần dữ liệu chu kỳ (mục 🌸 Chu kỳ).</div>}
          <div className="muted center" style={{fontSize:11,marginTop:8}}>Ước tính theo chu kỳ — không thay thế tư vấn y tế.</div>
        </div>}
        <div className="muted center" style={{fontSize:11,marginTop:8}}><span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>set({showPlan:!data.showPlan})}>{data.showPlan?'▴ Ẩn mục kế hoạch thụ thai':'⚙️ Hiện mục kế hoạch thụ thai'}</span></div>
      </div>}

      {v==='know' && <div>
        {INT_KNOW.map((a,i)=><Collapse key={i} id={'int-k'+i} defaultOpen={false} title={a.t}><div className="card"><div style={{fontSize:12.5,lineHeight:1.7,whiteSpace:'pre-line'}}>{a.body}</div></div></Collapse>)}
        <Collapse id="int-pos" defaultOpen={false} title="🧘 Tư thế quan hệ (có minh hoạ)">
          {INT_POSITIONS.map((p,i)=>(
            <div key={i} className="card" style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{flex:'0 0 88px',background:'var(--chip)',borderRadius:10,padding:'6px 4px',display:'flex'}} dangerouslySetInnerHTML={{__html:p.svg}}/>
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{p.n}</div><div className="muted" style={{fontSize:12.5,marginTop:3,lineHeight:1.5}}>{p.d}</div></div>
            </div>
          ))}
          <div className="muted center" style={{fontSize:11,margin:'2px 14px 4px'}}>Hình minh hoạ đơn giản, tôn trọng sự riêng tư — quan trọng nhất là thoải mái & đồng thuận. Sau sinh ưu tiên tư thế nhẹ nhàng, hỏi bác sĩ nếu còn đau.</div>
        </Collapse>
        <div className="sec-title" style={{marginTop:14}}>💪 Góc sức khỏe nam</div>
        {INT_MEN.map((a,i)=><Collapse key={'m'+i} id={'int-m'+i} defaultOpen={false} title={a.t}><div className="card"><div style={{fontSize:12.5,lineHeight:1.7,whiteSpace:'pre-line'}}>{a.body}</div></div></Collapse>)}
        <div className="muted center" style={{fontSize:11,margin:'6px 14px'}}>Thông tin tham khảo, không thay thế tư vấn của bác sĩ.</div>
      </div>}

      {v==='games' && <div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>🎭 Thật hay Thách</div>
          <div className="row" style={{gap:8}}>
            <button className="btn grow" onClick={()=>{ setDare(null); setTruth(pick(INT_TRUTHS)); }}>💬 Thật</button>
            <button className="btn soft grow" onClick={()=>{ setTruth(null); setDare(pick(INT_DARES)); }}>🔥 Thách</button>
          </div>
          {truth && <div style={{marginTop:10,fontSize:14,lineHeight:1.5,background:'var(--chip)',borderRadius:10,padding:'10px 12px'}}>💬 {truth}</div>}
          {dare && <div style={{marginTop:10,fontSize:14,lineHeight:1.5,background:'var(--chip)',borderRadius:10,padding:'10px 12px'}}>🔥 {dare}</div>}
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>🎲 Xúc xắc tình yêu</div>
          <button className="btn" onClick={()=>setDice({a:pick(INT_DICE_ACT),p:pick(INT_DICE_PART)})}>🎲 Tung xúc xắc</button>
          {dice && <div style={{marginTop:12,fontSize:20,fontWeight:800,textAlign:'center'}}>{dice.a} <span style={{opacity:.6}}>→</span> {dice.p}</div>}
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>🌶️ Câu hỏi nóng dần</div>
          <div style={{fontSize:14,lineHeight:1.5}}>{INT_HOT[Math.min(hotIdx,INT_HOT.length-1)]}</div>
          <div className="muted" style={{fontSize:11,marginTop:4}}>Câu {Math.min(hotIdx+1,INT_HOT.length)}/{INT_HOT.length}</div>
          <div className="row" style={{gap:8,marginTop:8}}>
            <button className="btn soft grow" onClick={()=>set({hotIdx:Math.max(0,hotIdx-1)})}>‹ Trước</button>
            <button className="btn grow" onClick={()=>set({hotIdx:Math.min(INT_HOT.length-1,hotIdx+1)})}>Tiếp ›</button>
          </div>
        </div>
        <div className="muted center" style={{fontSize:11,margin:'6px 14px'}}>Chơi vui, luôn tôn trọng & đồng thuận nhau 💞</div>
      </div>}

      {v==='date' && <div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:6}}>💡 Mẹo giữ lửa hôm nay</div>
          <div style={{fontSize:14,lineHeight:1.55}}>{sparkTip}</div>
          <button className="muted" style={{fontSize:11,marginTop:8}} onClick={()=>setSparkAlt(a=>a+1)}>🔀 Mẹo khác</button>
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>📅 Đêm hẹn hò</div>
          <div className="muted" style={{fontSize:12.5,marginBottom:6}}>Chọn một tối cố định trong tuần dành riêng cho hai đứa.</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {INT_WD.map(([wd,l])=><button key={wd} className="pill" style={{background:dn.weekday===wd?'var(--primary)':'var(--chip)',color:dn.weekday===wd?'#fff':'var(--chip-tx)'}} onClick={()=>setDN({...dn,weekday:dn.weekday===wd?null:wd})}>{l}</button>)}
          </div>
          {dn.weekday!=null && <React.Fragment>
            <div style={{marginTop:8,fontSize:14}}>Đêm hẹn tới: <b>{nextDateNight}</b></div>
            <input className="inp" style={{marginTop:8,fontSize:12.5}} placeholder="Ý tưởng cho đêm hẹn (tuỳ chọn)" value={dn.note||''} onChange={e=>setDN({...dn,note:e.target.value})}/>
          </React.Fragment>}
          <div className="muted" style={{fontSize:11,marginTop:8}}>Bật "💗 Trả bài" trong 🔔 Thông báo để được nhắc vào tối hẹn.</div>
        </div>
        <div className="card">
          <div className="hc-title" style={{marginBottom:8}}>🕯️ Tạo không khí</div>
          <div className="muted" style={{fontSize:12.5,marginBottom:6}}>Tick những thứ muốn chuẩn bị:</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {INT_AMBIANCE.map(x=><button key={x} className="pill" style={{background:amb.includes(x)?'var(--good)':'var(--chip)',color:amb.includes(x)?'#fff':'var(--chip-tx)'}} onClick={()=>toggleAmb(x)}>{amb.includes(x)?'✓ ':''}{x}</button>)}
          </div>
          <div className="hc-title" style={{fontSize:12.5,marginTop:12}}>🎵 Gợi ý playlist</div>
          {INT_PLAYLISTS.map(p=><div key={p.n} className="muted" style={{fontSize:12.5,padding:'3px 0'}}>• <b>{p.n}</b> — {p.d}</div>)}
        </div>
      </div>}

      {v==='privacy' && <div className="card">
        <div className="hc-title" style={{marginBottom:8}}>🔒 Riêng tư (khoá mục)</div>
        {data.pin
          ? <div><div style={{fontSize:14,marginBottom:8}}>🔒 Mục này đang được khoá bằng mã.</div>
              <div className="row" style={{gap:8}}><input className="inp grow" type="password" inputMode="numeric" maxLength={8} placeholder="Đổi mã mới (≥4 số)" value={np} onChange={e=>setNp(e.target.value)}/><button className="btn sm" onClick={savePin}>Đổi</button></div>
              <button className="muted" style={{fontSize:12.5,marginTop:8}} onClick={removePin}>Bỏ khoá</button></div>
          : <div><div className="muted" style={{fontSize:12.5,marginBottom:8}}>Đặt mã để mỗi lần mở “Trả bài” phải nhập — an tâm khi đưa máy cho người khác.</div>
              <div className="row" style={{gap:8}}><input className="inp grow" type="password" inputMode="numeric" maxLength={8} placeholder="Mã mới (≥4 số)" value={np} onChange={e=>setNp(e.target.value)}/><button className="btn sm" onClick={savePin}>Đặt mã</button></div></div>}
        <div className="muted" style={{fontSize:11,marginTop:8}}>Mã dùng để che mắt nhanh, không phải bảo mật ngân hàng. Cả hai máy dùng chung một mã.</div>
      </div>}
    </div>
  );
}
/* ============ Mâm cỗ cúng giỗ / Tết (Bắc Bộ) + công thức ============ */
/* ============ Đọc lá số tử vi (luận cơ bản theo can chi · nạp âm) ============ */
/* ============ Thần số học (Pythagoras · theo ngày sinh) ============ */
function reduceNum(n,keepMaster){ n=Math.abs(+n)||0; while(n>9){ if(keepMaster&&(n===11||n===22||n===33)) break; n=String(n).split('').reduce((s,d)=>s+(+d),0); } return n; }
const NUM_MEAN={
  1:{t:'Người tiên phong',g:'Độc lập, lãnh đạo, quyết đoán, sáng tạo, ý chí mạnh.',n:'Cẩn thận: bảo thủ, cái tôi cao, dễ cô độc.'},
  2:{t:'Người hoà giải',g:'Nhạy cảm, tinh tế, hợp tác, ngoại giao, biết lắng nghe.',n:'Cẩn thận: thiếu quyết đoán, dễ tổn thương, hay do dự.'},
  3:{t:'Người sáng tạo',g:'Vui vẻ, giao tiếp giỏi, nghệ thuật, lạc quan, cuốn hút.',n:'Cẩn thận: hời hợt, thiếu tập trung, dễ chán.'},
  4:{t:'Người kiến tạo',g:'Chăm chỉ, kỷ luật, thực tế, đáng tin, bền bỉ.',n:'Cẩn thận: cứng nhắc, ngại thay đổi, quá lo xa.'},
  5:{t:'Người tự do',g:'Linh hoạt, ưa phiêu lưu, năng động, thích nghi nhanh.',n:'Cẩn thận: bốc đồng, thiếu kiên định, cả thèm chóng chán.'},
  6:{t:'Người chăm sóc',g:'Yêu thương, trách nhiệm, tận tụy với gia đình, ấm áp.',n:'Cẩn thận: ôm đồm, hay lo, dễ hy sinh quá mức.'},
  7:{t:'Người tìm tòi',g:'Trí tuệ, sâu sắc, trực giác tốt, thích khám phá tâm linh.',n:'Cẩn thận: khép kín, hoài nghi, khó mở lòng.'},
  8:{t:'Người quyền lực',g:'Tham vọng, giỏi tài chính, bản lĩnh, thực tế, quyết đoán.',n:'Cẩn thận: tham công tiếc việc, đề cao vật chất.'},
  9:{t:'Người nhân ái',g:'Bao dung, lý tưởng, giàu trắc ẩn, rộng lượng, vị tha.',n:'Cẩn thận: mơ mộng, dễ hy sinh, khó dứt điểm.'},
  11:{t:'Bậc thầy trực giác',g:'Nhạy bén phi thường, truyền cảm hứng, tâm linh cao, lý tưởng.',n:'Số bậc thầy · áp lực lớn — cần cân bằng cảm xúc.'},
  22:{t:'Bậc thầy kiến tạo',g:'Tầm nhìn lớn, biến ước mơ thành hiện thực, vừa thực tế vừa lý tưởng.',n:'Số bậc thầy · tiềm năng lớn — cần kiên trì hiện thực hoá.'},
  33:{t:'Bậc thầy dẫn dắt',g:'Yêu thương vô điều kiện, tận hiến, chữa lành, nâng đỡ người khác.',n:'Số bậc thầy hiếm · trách nhiệm tinh thần cao.'},
};
const PY_MEAN={1:'Khởi đầu — gieo hạt, bắt đầu điều mới, chủ động.',2:'Kiên nhẫn — hợp tác, vun đắp quan hệ, chờ thời.',3:'Sáng tạo — giao tiếp, niềm vui, mở rộng, thể hiện.',4:'Xây nền — làm việc chăm chỉ, kỷ luật, ổn định.',5:'Thay đổi — tự do, cơ hội mới, dịch chuyển.',6:'Gia đình — tình yêu, trách nhiệm, chăm sóc, cam kết.',7:'Nội tâm — học hỏi, nghỉ ngơi, chiêm nghiệm.',8:'Gặt hái — thành quả, tài chính, quyền lực.',9:'Kết thúc — buông bỏ, cho đi, dọn đường chu kỳ mới.'};
function thanSo(dateStr,curYear){
  const parts=(dateStr||'').split('-'); if(parts.length<3) return null;
  const Y=parts[0],M=parts[1],D=parts[2]; if(!+Y||!+M||!+D) return null;
  const life=reduceNum((D+M+Y).split('').reduce((s,d)=>s+(+d),0),true);
  const birth=reduceNum(+D,true);
  const py=reduceNum((D+M+String(curYear)).split('').reduce((s,d)=>s+(+d),0),false);
  return {life,birth,py};
}
/* ============ 🍳 Bếp nhà mình — đi từ 3 lên 5 bữa/tuần ============
   Đích: 5 bữa/tuần. Mốc nền đang giữ được: 3 bữa — vẫn hiện trên thanh tiến độ để
   tuần nào cũng thấy phần đã làm được, không chỉ thấy phần còn thiếu.
   Ba rào cản được nhắm thẳng: bận con · tủ trống · mệt rã. */
const COOK_GOAL_DEFAULT=5;
const COOK_BASE=3; // mốc nền đang giữ được — mốc này coi như "không mất"
function mondayISO(iso){ const d=iso?new Date(iso+'T00:00:00'):new Date(); d.setHours(0,0,0,0); const w=(d.getDay()+6)%7; d.setDate(d.getDate()-w); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function shiftWeekISO(wk,n){ const d=new Date(wk+'T00:00:00'); d.setDate(d.getDate()+n*7); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function cookSummary(){
  const cfg=store.get('ju.cook',{})||{}; const goal=cfg.goal||COOK_GOAL_DEFAULT;
  const logs=(store.get('ju.cookLogs',[])||[]).filter(x=>x&&x.date);
  const wk=mondayISO();
  const inWeek=(w)=>logs.filter(x=>mondayISO(x.date)===w).length;
  const weekCount=inWeek(wk);
  let streak=(weekCount>=goal)?1:0; let w=shiftWeekISO(wk,-1);
  while(inWeek(w)>=goal){ streak++; w=shiftWeekISO(w,-1); }
  const today=logs.filter(x=>x.date===todayISO());
  const days=cfg.days||[];
  return {goal,weekCount,streak,total:logs.length,today,todayDone:today.length>0,
    left:Math.max(0,goal-weekCount),base:Math.min(weekCount,COOK_BASE),wk,
    isCookDay:days.indexOf(new Date().getDay())>=0,days};
}
function KitchenCard({people,me,go}){
  const [logs]=useLocal('ju.cookLogs',[]);
  const [cfg]=useLocal('ju.cook',{goal:COOK_GOAL_DEFAULT,days:[]});
  const goal=cfg.goal||COOK_GOAL_DEFAULT;
  const days=cfg.days||[];
  const wk=mondayISO();
  const clean=logs.filter(x=>x&&x.date);
  const doneWeek=clean.filter(x=>mondayISO(x.date)===wk).length;
  const today=clean.filter(x=>x.date===todayISO());
  const nameOf=(w)=> w==='both'?'Cả hai':((people&&people[w]&&people[w].name)||(w==='a'?'A':'B'));
  const pct=Math.min(100,Math.round(doneWeek*100/Math.max(1,goal)));
  const basePct=Math.min(100,Math.round(COOK_BASE*100/Math.max(1,goal)));
  const isCookDay=days.indexOf(new Date().getDay())>=0;
  const line=()=>{
    if(today.length>0) return '✅ Hôm nay '+nameOf(today[0].cook)+' đã nấu'+(today[0].dish?' — '+today[0].dish:'')+'. Nhớ khen một câu 💛';
    if(doneWeek>=goal) return '🎉 Tuần này chạm đích rồi — hôm nay nghỉ cũng được.';
    if(isCookDay) return '📌 Hôm nay là ngày bếp đã chốt. Vướng gì thì bấm 🆘 Cứu.';
    if(doneWeek>=COOK_BASE) return '✅ Đã giữ mốc nền '+COOK_BASE+' bữa. Thêm '+(goal-doneWeek)+' bữa nữa là chạm đích '+goal+'.';
    return '🍚 Còn '+(COOK_BASE-doneWeek)+' bữa nữa là chạm mốc nền. Ghi bữa ở app Bếp Nhà.';
  };
  /* Từ 14/08/2026 mảng Bếp & Chợ đã sang app riêng BẾP NHÀ. Thẻ này ở lại vì tiến
     độ bếp vẫn là việc chung của hai vợ chồng, nhưng nay chỉ TÓM TẮT và dẫn sang
     app kia — dữ liệu là cùng một hàng Supabase nên số liệu luôn khớp.
     ⛔ Đừng đổi thành `go('us')`: nhóm 'Bếp & Chợ' không còn trong US_GROUPS, bấm
     vào sẽ rơi về nhóm đầu tiên mà không báo gì. */
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🍳 Bếp nhà mình</span><span className="grow"></span>
        <span className="hc-act">{doneWeek}/{goal} bữa tuần này</span></div>
      <div style={{position:'relative',height:8,borderRadius:99,background:'var(--chip)',overflow:'hidden',margin:'8px 0 6px'}}>
        <div style={{height:'100%',width:pct+'%',borderRadius:99,background:doneWeek>=goal?'var(--good)':'var(--primary)'}}></div>
        <div style={{position:'absolute',left:basePct+'%',top:0,bottom:0,width:2,background:'var(--card)',opacity:.9}}></div>
      </div>
      <div className="hc-body" style={{fontSize:13}}>{line()}</div>
      <a className="btn soft" style={{marginTop:10,textDecoration:'none'}} href={BEP_NHA_URL}
        target="_blank" rel="noreferrer">🍜 Mở app Bếp Nhà →</a>
      <div className="muted" style={{fontSize:11,marginTop:6}}>Thực đơn tuần, đi chợ và hạn dùng nay nằm ở app riêng — dữ liệu vẫn chung với Just Us.</div>
    </div>
  );
}
const BEP_NHA_URL='https://bep-nha.pages.dev/';
const TAM_LINH_URL='https://tam-linh.pages.dev/';
/* Tâm linh tách thành app riêng 19/08/2026 nên KHÁC origin — localStorage thôi dùng chung.
   Ba khoá dưới được gói vào hash lúc bấm mở để app kia nhận một lần rồi tự lưu; không gửi
   thì bên đó bắt nhập lại ngày sinh và hiện sai tông màu, mà không lỗi nào phát ra. */
function hanhTrangTamLinh(){
  try{
    const goi={};
    /* 'ju.dates' đi cùng ba khoá kia vì Tâm linh dựng thẻ dịp cúng từ ngày giỗ trong sổ
       này. Bỏ nó ra thì thẻ bên đó chỉ còn lễ trong lịch âm, giỗ của nhà biến mất mà
       không lỗi nào phát ra. */
    ['ju.tuvi','ju.thanso','ju.setup','ju.dates'].forEach(k=>{ const v=localStorage.getItem(k); if(v!=null) goi[k]=v; });
    if(!Object.keys(goi).length) return TAM_LINH_URL;
    const b=new TextEncoder().encode(JSON.stringify(goi));
    return TAM_LINH_URL+'#ju='+encodeURIComponent(btoa(String.fromCharCode.apply(null,b)));
  }catch(e){ return TAM_LINH_URL; }
}
const APP_BOARD=[
  {k:'bepnha',icon:'🍜',name:'Bếp Nhà',desc:'Bếp nhà mình, thực đơn tuần, đi chợ, hạn dùng — tách khỏi đây ngày 14/08/2026',href:BEP_NHA_URL,ngoai:true},
  {k:'soc',icon:'🐿️',name:'Sóc',desc:'Nuôi con: mốc phát triển, tiêm chủng, ăn dặm, đi lớp, an toàn & cấp cứu',href:'https://soc-eiv.pages.dev/',ngoai:true},
  {k:'tamlinh',icon:'🪷',name:'Tâm linh',desc:'Ngày lễ âm lịch, kinh Phật, văn khấn, tử vi, thần số, quán chay, mâm cỗ — tách khỏi đây ngày 19/08/2026',href:TAM_LINH_URL,ngoai:true},
];
function AppBoard(){
  const [vinha]=useLocal('ju.vinhaUrl','');
  return (
    <div>
      <div className="sec-title">📱 App của nhà mình</div>
      <div className="muted center" style={{fontSize:11,margin:'0 14px 4px'}}>Các phần đã tách ra thành app riêng cho nhẹ — cài được lên màn hình chính như app độc lập, dữ liệu vẫn dùng chung với Just Us.</div>
      {APP_BOARD.map(a=>(
        <a key={a.k} className="item" href={a.k==='tamlinh'?hanhTrangTamLinh():a.href} {...(a.ngoai?{target:'_blank',rel:'noreferrer'}:{})} style={{display:'block',textDecoration:'none',color:'inherit'}}>
          <div className="row"><span style={{fontSize:26,flex:'0 0 auto'}}>{a.icon}</span>
            <div className="grow"><b style={{fontSize:14.5}}>{a.name}</b>
              <div className="muted" style={{fontSize:12,marginTop:2,lineHeight:1.5}}>{a.desc}</div></div>
            <span style={{fontSize:17,color:'var(--primary)'}}>{a.ngoai?'↗':'›'}</span></div>
        </a>
      ))}
      {vinha && <a className="item" href={vinha} target="_blank" rel="noreferrer" style={{display:'block',textDecoration:'none',color:'inherit'}}>
        <div className="row"><span style={{fontSize:26,flex:'0 0 auto'}}>💰</span>
          <div className="grow"><b style={{fontSize:14.5}}>VíNhà</b>
            <div className="muted" style={{fontSize:12,marginTop:2,lineHeight:1.5}}>Tiền nong của cả nhà — app riêng, mở ở tab mới</div></div>
          <span style={{fontSize:17,color:'var(--primary)'}}>↗</span></div>
      </a>}
    </div>
  );
}
/* ============ Tối ưu lịch sinh hoạt ============ */
// Mỗi mốc: {t} + hoặc {both} (việc chung, span 2 cột) hoặc {a,b} (riêng bố / mẹ)
const DEFAULT_ROUTINE=[
  {id:'r1',t:'06:30',both:'Cả nhà thức dậy, vệ sinh cá nhân'},
  {id:'r2',t:'07:00',a:'Vệ sinh cá nhân, chuẩn bị đi làm',b:'Lo bữa sáng, chuẩn bị đồ cho Sóc'},
  {id:'r3',t:'07:45',a:'Đưa Sóc đi lớp rồi đi làm',b:'Đi làm'},
  {id:'r4',t:'12:00',both:'Sóc ăn trưa + ngủ trưa ở lớp'},
  {id:'r5',t:'17:30',a:'Đi làm về, phụ dọn nhà',b:'Đón Sóc, về nhà'},
  {id:'r6',t:'18:00',a:'Chơi với con',b:'Chuẩn bị bữa tối'},
  {id:'r7',t:'19:00',both:'Cả nhà ăn tối'},
  {id:'r8',t:'20:00',a:'Tắm cho Sóc, đọc sách / hát ru',b:'Dọn bếp, rửa bát'},
  {id:'r9',t:'20:45',both:'Ru Sóc đi ngủ'},
  {id:'r10',t:'21:00',both:'Thời gian riêng của hai vợ chồng 💞'},
  {id:'r11',t:'22:30',both:'Bố mẹ đi ngủ'},
];
const ROUTINE_FIXES=[
  {icon:'🌅',title:'Buổi sáng cập rập',key:['sáng','buổi sáng','cập rập','vội','muộn giờ','đi làm','chuẩn bị','dậy muộn','trễ'],tips:[
    'Chuẩn bị từ tối: quần áo cả nhà, bình sữa, balo lớp, chìa khoá để sẵn.',
    'Dậy trước bé 20–30 phút để bố mẹ vệ sinh cá nhân xong trước.',
    'Bữa sáng gọn, làm nhanh (chuối, sữa, bánh mì, cháo nấu từ tối).',
    'Chia việc rõ: một người lo bé, một người lo bữa sáng + đồ mang đi.',
    'Đặt "giờ chốt ra khỏi nhà" + một mốc nhắc trước 10 phút.']},
  {icon:'💞',title:'Ít thời gian riêng cho hai vợ chồng',key:['thời gian riêng','hai vợ chồng','thời gian đôi','ít gần nhau','vợ chồng','riêng tư','hẹn hò','xa cách','nhạt'],tips:[
    'Đặt "hẹn tại nhà" cố định sau khi con ngủ: 20–30 phút không điện thoại, chỉ hai đứa.',
    'Mỗi tuần một tối "của tụi mình" (xem phim, nấu ăn, trà đêm) — ghi vào Sự kiện.',
    'Nhờ ông bà/người thân trông bé 2–3 tiếng/tháng để ra ngoài hẹn hò.',
    'Tận dụng giờ bé ngủ trưa cuối tuần cho một tách cà phê chung.',
    'Dùng mục 💞 Đố vui / 🗣️ Chủ đề trong app để trò chuyện sâu mỗi tối.']},
  {icon:'🧹',title:'Việc nhà không cân bằng',key:['việc nhà','làm nhiều','không cân bằng','một mình','đùn đẩy','dọn dẹp','giặt','rửa bát','quá tải','ôm hết'],tips:[
    'Liệt kê toàn bộ việc nhà rồi chia rõ theo tuần (dùng mục 🧹 Việc nhà).',
    'Chia theo sở trường/giờ giấc thay vì "ai rảnh thì làm".',
    'Gộp việc: nấu 1 lần ăn 2 bữa, giặt/phơi theo lịch cố định.',
    'Nói nhu cầu bằng câu "Anh/em cần được giúp phần…", tránh trách móc.',
    'Cân nhắc thuê giúp việc theo giờ 1–2 buổi/tuần nếu quá tải.']},
  {icon:'🕗',title:'Bố/mẹ về muộn, lệch giờ',key:['về muộn','tăng ca','lệch giờ','đi sớm về khuya','làm khuya','ít gặp con','công tác','bận'],tips:[
    'Thống nhất "khung giờ lõi" cả nhà chắc chắn ở bên nhau (vd bữa tối / trước giờ con ngủ).',
    'Người về muộn nhận phần việc khác (sáng sớm, cuối tuần) để bù.',
    'Gọi video ngắn với con vào giờ cố định nếu hay vắng nhà.',
    'Báo trước lịch tăng ca để người kia chủ động sắp xếp.',
    'Cuối tuần dành 1 buổi "bù" chất lượng cho con và bạn đời.']},
  {icon:'🍚',title:'Bữa ăn / nấu nướng mất thời gian',key:['bữa ăn','nấu','nấu nướng','cơm','ăn uống','thực đơn','đi chợ','mất thời gian','bếp'],tips:[
    'Lên thực đơn tuần trước (mục 🍱 Thực đơn) để đi chợ 1–2 lần/tuần.',
    'Sơ chế sẵn cuối tuần: rửa, cắt, chia phần, cấp đông.',
    'Ưu tiên món một nồi (canh/hầm/kho) để đỡ công và đỡ rửa.',
    'Nấu dư bữa tối để có phần cho bữa sáng/trưa hôm sau.',
    'Cho bé ăn theo thực đơn nhà (nêm nhạt riêng) để bớt nấu nhiều nồi.']},
  {icon:'📵',title:'Dùng điện thoại quá nhiều',key:['điện thoại','màn hình','lướt','mạng xã hội','nghiện','ipad','xem điện thoại','facebook','tiktok'],tips:[
    'Quy ước "không điện thoại" trong bữa ăn và 1 giờ trước giờ con ngủ.',
    'Để điện thoại phòng khác khi chơi với con / khi hai vợ chồng bên nhau.',
    'Đặt giới hạn giờ dùng app trong cài đặt điện thoại.',
    'Bé dưới 2 tuổi: hạn chế tối đa màn hình, thay bằng vận động/đọc sách.',
    'Đổi thói quen lướt điện thoại buổi tối bằng một hoạt động chung.']},
  {icon:'🔋',title:'Kiệt sức, thiếu thời gian cho bản thân',key:['bản thân','nghỉ ngơi','kiệt sức','stress','căng thẳng','mệt mỏi','mệt','burnout','đuối','áp lực'],tips:[
    'Mỗi người 30 phút "của riêng mình" mỗi ngày — người kia trông con.',
    'Luân phiên ngủ bù cuối tuần (một người dậy sớm với con, đổi ca).',
    'Ưu tiên ngủ đủ; mạnh dạn cắt bớt việc không quan trọng.',
    'Vận động nhẹ 10–15 phút/ngày giúp giảm căng thẳng.',
    'Nói ra khi quá tải thay vì gồng — đây là việc của cả hai.']},
  {icon:'🗓️',title:'Cuối tuần trôi qua vô định',key:['cuối tuần','rảnh','vô định','không biết làm gì','nhàm chán','chán','weekend'],tips:[
    'Tối thứ Sáu lên nhanh kế hoạch 2 ngày: 1 việc cho con, 1 việc cho hai đứa, 1 việc nhà.',
    'Dùng mục 💡 Ý tưởng / 📍 Gợi ý HN để chọn điểm đi chơi hợp thời tiết.',
    'Giữ 1 buổi "không lịch" để nghỉ thật sự, tránh nhồi nhét.',
    'Xen kẽ hoạt động trong nhà và ngoài trời cho bé.',
    'Chụp vài tấm ảnh lưu vào Kỷ niệm để sau này nhìn lại.']},{icon:'😮‍💨',title:'Thiếu ngủ trầm trọng',key:['thiếu ngủ','mất ngủ','ngủ không đủ','mệt vì con','dậy đêm nhiều'],tips:['Chia ca đêm: mỗi người phụ trách một nửa để có giấc dài.','Ngủ khi con ngủ, gác việc nhà không gấp lại.','Cắt caffeine buổi chiều; phòng ngủ tối và mát.','Nhờ ông bà/người thân trông con để ngủ bù cuối tuần.','Hạ kỳ vọng việc nhà giai đoạn này — sức khỏe trước.']},{icon:'⚖️',title:'Phân công chăm con không đều',key:['chăm con','không đều','một mình lo con','gánh hết','không phụ con'],tips:['Liệt kê mọi đầu việc chăm con rồi chia rõ ai làm gì.','Luân phiên việc khó (dỗ ngủ, dậy đêm) theo ngày trong tuần.','Người đi làm về nhận ca tối để người ở nhà được nghỉ.','Nói nhu cầu cụ thể thay vì mong người kia tự hiểu.','Cuối tuần mỗi người có 2 tiếng tự do, người kia trông con.']},
  {icon:'💸',title:'Căng thẳng chi tiêu, tài chính',key:['tiền','chi tiêu','tài chính','tốn kém','thiếu tiền','nợ','lương','tiết kiệm','ngân sách','đắt đỏ'],tips:[
    'Ngồi lại cùng nhau xem thu–chi tháng, thống nhất hạn mức mỗi khoản.',
    'Lập quỹ chung cho khoản cố định (bỉm sữa, học phí) và một quỹ dự phòng.',
    'Ghi chi tiêu hằng ngày để biết tiền đi đâu (mục 💰 Quỹ / ngân sách).',
    'Phân biệt "cần" và "muốn"; hoãn 48 giờ trước khi quyết mua món lớn.',
    'Nói về tiền định kỳ, không đổ lỗi — xem đây là bài toán chung của hai đứa.']},
  {icon:'💢',title:'Vợ chồng hay cãi vặt',key:['cãi nhau','cãi vặt','mâu thuẫn','giận nhau','xung đột','to tiếng','bất đồng','cằn nhằn','chiến tranh lạnh'],tips:[
    'Chọn lúc cả hai bình tĩnh để nói chuyện, tránh khi đang mệt hoặc đói.',
    'Dùng câu "anh/em cảm thấy…" thay vì "tại anh/em…" để tránh công kích.',
    'Đồng ý "tạm dừng" khi căng, hẹn quay lại sau 20–30 phút.',
    'Mỗi tối dành 10 phút hỏi han nhau (mục 📝 Check-in / 💌 Nhắn nhau).',
    'Kết thúc bằng một hành động làm lành nhỏ: ôm, xin lỗi, cảm ơn.']},
  {icon:'🏃',title:'Không có thời gian cho sức khỏe, tập luyện',key:['tập thể dục','thể dục','sức khỏe','vận động','gym','chạy bộ','tăng cân','ít vận động','lười tập'],tips:[
    'Bắt đầu nhỏ: 10–15 phút/ngày tại nhà, tăng dần theo tuần.',
    'Tập cùng con: đi bộ, đạp xe, chơi vận động ngoài trời cuối tuần.',
    'Luân phiên trông con để mỗi người có 30 phút tập riêng.',
    'Gắn vận động vào việc sẵn có: đi cầu thang, đi bộ khi nghe điện thoại.',
    'Ưu tiên ngủ đủ và uống đủ nước — nền tảng của sức khỏe.']},
  {icon:'🧺',title:'Nhà cửa bừa bộn, đồ đạc lộn xộn',key:['bừa bộn','lộn xộn','bừa','dọn nhà','đồ đạc','đồ chơi bừa','nhà bẩn','ngăn nắp','chật chội'],tips:[
    'Mỗi món đồ có "một chỗ ở"; dọn theo khu vực nhỏ, đừng ôm cả nhà một lúc.',
    '"Dọn 10 phút" cả nhà trước giờ ngủ, biến thành trò chơi cho con.',
    'Giỏ đựng đồ chơi ngay nơi con chơi; tập con cất đồ sau khi chơi xong.',
    'Bớt đồ thừa định kỳ: cho/bán món không dùng để nhà thoáng hơn.',
    'Chia việc dọn theo khu vực giữa hai vợ chồng (mục 🧹 Việc nhà).']},
  {icon:'👋',title:'Ít gặp bạn bè, mất kết nối xã hội',key:['bạn bè','cô đơn','mất kết nối','ít ra ngoài','tù túng','không gặp ai','xã hội','tách biệt','gặp gỡ'],tips:[
    'Đặt lịch gặp bạn/gia đình 1–2 lần/tháng, luân phiên trông con.',
    'Rủ nhóm bạn cũng có con để vừa gặp nhau vừa cho các bé chơi.',
    'Giữ liên lạc nhẹ nhàng: gọi/nhắn ngắn khi rảnh thay vì đợi "rảnh hẳn".',
    'Tham gia một hoạt động cộng đồng hoặc lớp học ngắn để mở rộng kết nối.',
    'Chấp nhận giai đoạn bận là bình thường — ưu tiên giữ vài mối quan hệ thân.']}];
function routineMatch(text){ const s=(text||'').toLowerCase(); return ROUTINE_FIXES.map(f=>({f,score:f.key.reduce((n,k)=>n+(s.indexOf(k)>=0?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.f); }
function RoutineTab({people,me}){
  const [routine,setRoutine]=useLocal('ju.routine',DEFAULT_ROUTINE);
  const [issues,setIssues]=useLocal('ju.routineIssues',[]);
  const [view,setView]=useState('lich');
  const [edit,setEdit]=useState(null);
  const [prob,setProb]=useState('');
  const [browse,setBrowse]=useState(null);
  const [openFix,setOpenFix]=useState({});
  const normBlock=(b)=> (b.both!=null||b.a!=null||b.b!=null) ? b : {id:b.id,t:b.t,both:b.act||''}; // migrate mốc cũ {act}
  const list=(routine||[]).map(normBlock).slice().sort((a,b)=>(a.t||'').localeCompare(b.t||''));
  const editMode=(e)=> e._mode || ((e.both!=null&&e.both!=='')?'both':((e.a!=null||e.b!=null)?'split':'both'));
  const saveBlock=()=>{ if(!edit)return; const m=editMode(edit); let blk;
    if(m==='both'){ const v=(edit.both||'').trim(); if(!v)return; blk={id:edit.id,t:edit.t,both:v}; }
    else { const a=(edit.a||'').trim(), b=(edit.b||'').trim(); if(!a&&!b)return; blk={id:edit.id,t:edit.t,a,b}; }
    if(edit.remind) blk.remind=true;
    if(blk.id){ setRoutine(prev=>(prev||[]).map(x=>x.id===blk.id?blk:x)); } else { blk.id=uid(); setRoutine(prev=>[...(prev||[]),blk]); }
    setEdit(null); };
  const delBlock=(id)=>{ if(confirm('Xoá mốc này khỏi lịch?')) setRoutine(prev=>(prev||[]).filter(x=>x.id!==id)); };
  const toggleRemind=(id)=>setRoutine(prev=>(prev||[]).map(x=>x.id===id?{...normBlock(x),remind:!x.remind}:x));
  const exportRoutineWord=()=>{ const shade='FFE0EA';
    const head='<w:tr>'+ooCell('Giờ',{bold:true,shade,w:1100})+ooCell(people.a.name||'Người 1',{bold:true,shade})+ooCell(people.b.name||'Người 2',{bold:true,shade})+'</w:tr>';
    const rows=list.map(b=> (b.both!=null&&b.both!=='')
      ? '<w:tr>'+ooCell(b.t,{bold:true,w:1100})+ooCell(b.both,{span:2,align:'center',shade:'FFF6FA'})+'</w:tr>'
      : '<w:tr>'+ooCell(b.t,{bold:true,w:1100})+ooCell(b.a||'',{})+ooCell(b.b||'',{})+'</w:tr>').join('');
    exportDocx('Lich-sinh-hoat.docx', ooP('🗓️ Lịch sinh hoạt một ngày',{bold:true,size:18,color:'C2185B'})+ooP('Gia đình '+((people.a.name||'')+' & '+(people.b.name||'')),{size:10,color:'777777',spacing:200})+ooTable(head+rows)); };
  const resetR=()=>{ if(confirm('Khôi phục lịch sinh hoạt mặc định?')) setRoutine(DEFAULT_ROUTINE); };
  const addIssueText=(text,fix)=>{ const x=(text||'').trim(); if(!x)return; setIssues(prev=>[{id:uid(),text:x,fix:fix||null,by:me,done:false,createdAt:Date.now()},...(prev||[])]); };
  const addIssue=()=>{ addIssueText(prob); setProb(''); };
  const saveFix=(f)=>{ if(!(issues||[]).some(it=>!it.done&&(it.fix===f.title||it.text===f.title))){ addIssueText(f.title,f.title); celebrate(['📌']); } setBrowse(null); setView('vande'); };
  const delIssue=(id)=>{ if(confirm('Xoá vấn đề này?')) setIssues(prev=>(prev||[]).filter(x=>x.id!==id)); };
  const toggleIssue=(id)=>setIssues(prev=>(prev||[]).map(x=>x.id===id?{...x,done:!x.done}:x));
  const active=(issues||[]).filter(x=>!x.done);
  const doneCount=(issues||[]).filter(x=>x.done).length;
  return (
    <div>
      <div className="seg" style={{marginTop:10}}>
        <button className={view==='lich'?'on':''} onClick={()=>setView('lich')}>🗓️ Lịch trong ngày</button>
        <button className={view==='vande'?'on':''} onClick={()=>setView('vande')}>🧩 Vấn đề & gợi ý</button>
      </div>
      {view==='lich' ? (
        <div className="card">
          <div className="row"><span className="hc-title">🗓️ Lịch sinh hoạt một ngày</span><span className="grow"></span>
            <button className="btn sm soft" onClick={exportRoutineWord} title="Xuất ra file Word (.docx) để in / sửa">🖨️ In</button>
            <button className="btn sm soft" onClick={()=>setEdit({t:'08:00',both:'',_mode:'both'})}>＋ Mốc</button></div>
          <div className="hc-body" style={{margin:'6px 0 6px'}}>Ai làm gì lúc nào — tách 2 cột cho khỏi giẫm việc nhau. Chạm 🔔 ở mốc muốn được nhắc.</div>
          <div className="row" style={{padding:'4px 0 6px',borderBottom:'2px solid var(--line)',gap:8,alignItems:'center'}}>
            <span style={{width:46,flex:'0 0 auto'}}></span>
            <span className="grow" style={{fontSize:11,fontWeight:800,textAlign:'center'}}>{people.a.avatar} {people.a.name}</span>
            <span className="grow" style={{fontSize:11,fontWeight:800,textAlign:'center'}}>{people.b.avatar} {people.b.name}</span>
            <span style={{width:52,flex:'0 0 auto'}}></span>
          </div>
          {list.map(b=>(
            <div key={b.id} className="row" style={{padding:'7px 0',borderBottom:'1px solid var(--line)',gap:8,alignItems:'center'}}>
              <span className="pill" style={{flex:'0 0 auto',minWidth:46,justifyContent:'center'}}>{b.t}</span>
              {b.both!=null && b.both!=='' ?
                <span className="grow" style={{fontSize:12.5,textAlign:'center',background:'var(--chip)',color:'var(--chip-tx)',borderRadius:8,padding:'6px 8px'}}>👫 {b.both}</span>
              : <>
                <span className="grow" style={{fontSize:12.5,textAlign:'center'}}>{b.a||'—'}</span>
                <span style={{width:1,alignSelf:'stretch',background:'var(--line)',flex:'0 0 auto'}}></span>
                <span className="grow" style={{fontSize:12.5,textAlign:'center'}}>{b.b||'—'}</span>
              </>}
              <button className="iconbtn" style={{flex:'0 0 auto',opacity:b.remind?1:.32}} title={b.remind?'Đang nhắc giờ này':'Bật nhắc giờ này'} aria-label={b.remind?'Đang nhắc giờ này':'Bật nhắc giờ này'} onClick={()=>toggleRemind(b.id)}><Ic n="nhac"/></button>
              <button className="iconbtn" style={{flex:'0 0 auto'}} aria-label="Sửa" title="Sửa" onClick={()=>setEdit({...b})}><Ic n="sua"/></button>
            </div>
          ))}
          <div className="muted" style={{fontSize:11,marginTop:6}}>🔔 Mốc có chuông sẽ được nhắc đúng giờ (cần bật <b>Thông báo</b> ở Hồ sơ).</div>
          <button className="muted" style={{fontSize:11,marginTop:8}} onClick={resetR}>↩︎ Về lịch mặc định</button>
          {edit && (()=>{ const m=editMode(edit); return <Sheet title={edit.id?'Sửa mốc':'Thêm mốc'} onClose={()=>setEdit(null)}>
            <div className="field"><label>Giờ</label><input className="inp" type="time" value={edit.t} onChange={e=>setEdit({...edit,t:e.target.value})}/></div>
            <div className="field"><label>Kiểu việc</label>
              <div className="row" style={{gap:6}}>
                <button className={'btn sm grow '+(m==='both'?'':'soft')} onClick={()=>setEdit({...edit,_mode:'both'})}>👫 Việc chung</button>
                <button className={'btn sm grow '+(m==='split'?'':'soft')} onClick={()=>setEdit({...edit,_mode:'split'})}>👤 Riêng từng người</button>
              </div></div>
            {m==='both'
              ? <div className="field"><label>Hoạt động chung</label><input className="inp" autoFocus value={edit.both||''} onChange={e=>setEdit({...edit,both:e.target.value})} placeholder="vd: Cả nhà ăn tối"/></div>
              : <>
                <div className="field"><label>{people.a.avatar} {people.a.name}</label><input className="inp" value={edit.a||''} onChange={e=>setEdit({...edit,a:e.target.value})} placeholder="vd: Tắm cho Sóc"/></div>
                <div className="field"><label>{people.b.avatar} {people.b.name}</label><input className="inp" value={edit.b||''} onChange={e=>setEdit({...edit,b:e.target.value})} placeholder="vd: Dọn bếp, rửa bát"/></div>
              </>}
            <button className="btn" onClick={saveBlock}>💾 Lưu</button>
            {edit.id && <button className="btn soft" style={{marginTop:8,width:'100%'}} onClick={()=>{ delBlock(edit.id); setEdit(null); }}>🗑️ Xoá mốc</button>}
          </Sheet>; })()}
        </div>
      ) : (
        <div>
          <div className="card">
            <div className="hc-title">🧩 Đang gặp vấn đề gì về lịch sinh hoạt?</div>
            <div className="hc-body" style={{margin:'6px 0 8px'}}>Ghi ra điều đang khiến nếp nhà mệt/lệch — app gợi ý cách xử lý.</div>
            <textarea className="inp" value={prob} onChange={e=>setProb(e.target.value)} placeholder="vd: Sóc ngủ muộn, sáng nào cũng cập rập, hai vợ chồng ít thời gian riêng…"/>
            {prob.trim() && (()=>{ const m=routineMatch(prob); return <div style={{marginTop:8}}>
              <div className="muted" style={{fontSize:11,marginBottom:5}}>{m.length?'💡 Gợi ý liên quan (bấm để xem):':'Chưa khớp chủ đề — xem "Chủ đề thường gặp" bên dưới, hoặc mô tả cụ thể hơn.'}</div>
              {m.slice(0,3).map(f=><button key={f.title} className="pill" style={{margin:'0 6px 6px 0'}} onClick={()=>setBrowse(f)}>{f.icon} {f.title}</button>)}
            </div>; })()}
            <button className="btn" style={{marginTop:8}} onClick={addIssue} disabled={!prob.trim()}>💾 Lưu vấn đề</button>
          </div>
          {active.length>0 && <div className="sec-title">Đang cần xử lý</div>}
          {active.map(it=>{ const top=(it.fix&&ROUTINE_FIXES.find(f=>f.title===it.fix))||routineMatch(it.text)[0]; const open=openFix[it.id]!==false;
            return <div key={it.id} className="card">
              <div className="row"><span className="grow" style={{fontSize:14}}>❓ {it.text}</span>
                <button className="iconbtn" title="Đánh dấu đã xử lý" aria-label="Đánh dấu đã xử lý" onClick={()=>toggleIssue(it.id)}><Ic n="tick"/></button>
                <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>delIssue(it.id)}><Ic n="xoa"/></button></div>
              {top ? <React.Fragment>
                <div className="row" style={{marginTop:8,gap:6}}>
                  <span className="pill">💡 {top.icon} {top.title}</span><span className="grow"></span>
                  <button className="muted" style={{fontSize:11}} onClick={()=>setOpenFix({...openFix,[it.id]:!open})}>{open?'▲ Ẩn':'▾ Hiện lời khuyên'}</button>
                </div>
                {open && <ul style={{margin:'8px 0 0',paddingLeft:18,fontSize:12.5,lineHeight:1.65}}>{top.tips.map((t,i)=><li key={i} style={{marginBottom:4}}>{t}</li>)}</ul>}
              </React.Fragment> : <div className="muted" style={{fontSize:12.5,marginTop:6}}>Chưa có gợi ý tự động — thử xem "Chủ đề thường gặp".</div>}
            </div>; })}
          {doneCount>0 && <div className="muted" style={{fontSize:11,margin:'6px 14px'}}>✓ Đã xử lý: {doneCount} · <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>{ if(confirm('Xoá các vấn đề đã xử lý?')) setIssues(prev=>(prev||[]).filter(x=>!x.done)); }}>xoá</span></div>}
          <div className="sec-title">📚 Chủ đề thường gặp</div>
          <div className="card">
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {ROUTINE_FIXES.map(f=><button key={f.title} className="pill" onClick={()=>setBrowse(f)}>{f.icon} {f.title}</button>)}
            </div>
          </div>
          {browse && <Sheet title={browse.icon+' '+browse.title} onClose={()=>setBrowse(null)}>
            <ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:14,lineHeight:1.7}}>{browse.tips.map((t,i)=><li key={i} style={{marginBottom:7}}>{t}</li>)}</ul>
            {(issues||[]).some(it=>!it.done&&(it.fix===browse.title||it.text===browse.title))
              ? <div className="muted" style={{fontSize:12.5,marginTop:12,textAlign:'center'}}>✓ Đã có trong danh sách theo dõi</div>
              : <button className="btn" style={{marginTop:12}} onClick={()=>saveFix(browse)}>📌 Lưu vấn đề này để theo dõi</button>}
          </Sheet>}
        </div>
      )}
    </div>
  );
}
/* ============ Thông báo điện thoại ============ */
// Khoá công khai VAPID — cặp với VAPID_PRIVATE cất trong secret của Supabase (không bao giờ commit).
// Đổi khoá này = mọi subscription cũ chết, nhưng subscribePush() bên dưới đã tự đăng ký lại.
const VAPID_PUBLIC='BFj7hLMvv3G60I0gTYNAvblUBtL4QaYgwV3Go6nzNQDpvkhrhsDxAEOaz8AMaBgU-yrNy6HQo0_ad_5qCZ7bqog';
function urlB64ToU8(s){ const pad='='.repeat((4-s.length%4)%4); const b=(s+pad).replace(/-/g,'+').replace(/_/g,'/'); const raw=atob(b); const arr=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i); return arr; }
function u8ToUrlB64(buf){ const b=new Uint8Array(buf); let s=''; for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
// Đăng ký web-push để nhận thông báo CẢ KHI ĐÓNG APP (cần đã đăng nhập + ghép đôi)
async function subscribePush(){
  try{
    if(!('serviceWorker' in navigator)||!('PushManager' in window)) return {ok:false,reason:'unsupported'};
    if(!Cloud.connected||!Cloud.connected()) return {ok:false,reason:'notconnected'};
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    // Nếu máy đang giữ subscription của CẶP KHOÁ VAPID CŨ thì server mới không đẩy tới được
    // (trình duyệt cũng không cho subscribe đè khoá khác) → huỷ rồi đăng ký lại bằng khoá hiện tại.
    if(sub){
      try{
        const cur=sub.options&&sub.options.applicationServerKey;
        if(cur && u8ToUrlB64(cur)!==VAPID_PUBLIC){
          const old=sub.endpoint;
          await sub.unsubscribe(); sub=null;
          try{ const c0=sbClient(); if(c0&&old) await c0.from('justus_push_subs').delete().eq('endpoint',old); }catch(_){}
        }
      }catch(_){}
    }
    if(!sub){ sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:urlB64ToU8(VAPID_PUBLIC)}); }
    const j=sub.toJSON(); const c=sbClient(); const cp=Cloud.couple&&Cloud.couple();
    const {data:ud}=await c.auth.getUser(); const user=ud&&ud.user;
    if(!user||!cp||!cp.id||!j.keys) return {ok:false,reason:'notconnected'};
    const {error}=await c.from('justus_push_subs').upsert({couple_id:cp.id,user_id:user.id,role:store.get('ju.me',(store.get('ju.setup',{})||{}).me||'a'),endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,ua:navigator.userAgent},{onConflict:'endpoint'});
    if(error) return {ok:false,reason:error.message||'db'};
    return {ok:true};
  }catch(e){ return {ok:false,reason:String((e&&e.message)||e)}; }
}
// Các mục "đối phương vừa làm gì đó, mình chưa xem" (nhắn nhau, check-in…) dùng chung nếp: 1 map <seenKey> lưu mốc thời gian đã xem theo từng người.
function unseenByPartner(listKey,seenKey,me){
  const seen=store.get(seenKey,{})||{};
  return (store.get(listKey,[])||[]).filter(x=>x&&x.by&&x.by!==me&&(x.createdAt||0)>(seen[me]||0));
}
// Giờ nhắc của một mục: dùng giờ riêng nếu đã chỉnh, không thì theo giờ mặc định. 'now' = nhắc ngay khi phát hiện, không chờ giờ cố định.
function catNotiTime(noti,cat){ return (cat&&(noti.times||{})[cat])||noti.time||'08:00'; }
function computeDueNotis(noti){
  const cats=(noti&&noti.cats)||{}; const on=(k)=>cats[k]!==false;
  const out=[]; const setup=store.get('ju.setup',{})||{};
  if(on('kyNiem') && setup.loveDate){
    const dn=daysToNext(setup.loveDate);
    if(dn!=null && dn<=2) out.push({id:'anniv',cat:'kyNiem',title:'💞 '+(dn===0?'Hôm nay kỷ niệm ngày yêu nhau! 🥰':'Còn '+dn+' ngày tới kỷ niệm ngày yêu')});
    else { try{ const lov=new Date(setup.loveDate+'T00:00:00'), t=new Date(todayISO()+'T00:00:00'); if(lov.getDate()===t.getDate()){ const months=(t.getFullYear()-lov.getFullYear())*12+(t.getMonth()-lov.getMonth()); if(months>0) out.push({id:'lovemonth'+months,cat:'kyNiem',title:'💞 Hôm nay tròn '+months+' tháng bên nhau 🥰'}); } }catch(_){} }
  }
  if(on('sukien')) (store.get('ju.events',[])||[]).forEach(e=>{ const d=daysFromToday(e.date); const lead=e.remind!=null?e.remind:1; if(d!=null&&d>=0&&d<=lead) out.push({id:'ev'+(e.id||e.title),cat:'sukien',title:'📅 '+e.title+(d===0?' — hôm nay':' — còn '+d+' ngày')}); });
  if(on('ngayNho')) (store.get('ju.dates',[])||[]).forEach(e=>{ const d=dnext(e); const lead=e.remind!=null?e.remind:1; if(d!=null&&d>=0&&d<=lead) out.push({id:'dt'+(e.id||e.title),cat:'ngayNho',title:(e.icon||'🎂')+' '+e.title+(d===0?' — hôm nay!':' — còn '+d+' ngày')}); });
  if(on('viec')) (store.get('ju.todos',[])||[]).forEach(t=>{ if(t.done) return; if(t.due){ const d=daysFromToday(t.due); if(d!=null&&d<=0) out.push({id:'td'+(t.id||t.title),cat:'viec',title:'✅ '+t.title+(d===0?' — hạn hôm nay':' — đã quá hạn')}); } else if(t.prio==='cao'){ out.push({id:'tdp'+(t.id||t.title),cat:'viec',title:'✅ '+t.title+' — ưu tiên cao'}); } });
  if(on('thucDon')){ const plan=store.get('ju.menuPlan',null); const idx=(new Date().getDay()+6)%7; if(plan&&plan[idx]) out.push({id:'menu',cat:'thucDon',title:'🍱 Nhắc chuẩn bị bữa ăn hôm nay'}); const shop=(store.get('ju.shop',[])||[]).filter(s=>s&&!s.done&&!s.bought); if(shop.length) out.push({id:'shop',cat:'thucDon',title:'🛒 Đi chợ: còn '+shop.length+' món trong danh sách'});
    // Bếp nhà mình: chỉ nhắc đúng ngày bếp đã chốt + nhắc trao thưởng cuối tuần — không nhắc hằng ngày cho khỏi thành cằn nhằn.
    try{ const cs=cookSummary();
      if(cs.isCookDay && !cs.todayDone) out.push({id:'cookday',cat:'thucDon',title:'🍳 Hôm nay là ngày bếp đã chốt — vướng gì thì mở 🆘 Cứu trong mục Bếp nhà mình'});
      if(new Date().getDay()===0 && cs.weekCount>=cs.goal && !(store.get('ju.cookRewards',[])||[]).some(r=>r&&r.week===cs.wk))
        out.push({id:'cookreward',cat:'thucDon',title:'🎁 Tuần này chạm đích '+cs.goal+' bữa — vào trao thưởng cho nửa kia nhé'});
    }catch(_){} }
  if(on('nganSach')){ const vs=store.get('ju.vinhaSync',null); if(vs&&vs.budgets&&vs.budgets.length){ const ym=todayISO().slice(0,7); const sp={}; (vs.rows||[]).filter(x=>x.type==='expense'&&(x.date||'').slice(0,7)===ym).forEach(x=>{ if(x.catId) sp[x.catId]=(sp[x.catId]||0)+x.amount; }); const over=vs.budgets.filter(b=>(sp[b.catId]||0)>b.amount); const near=vs.budgets.filter(b=>{ const s=sp[b.catId]||0; return s<=b.amount&&s>=b.amount*0.8; }); if(over.length) out.push({id:'budover',cat:'nganSach',title:'💰 Vượt ngân sách: '+over.slice(0,3).map(b=>b.cn).join(', ')}); else if(near.length) out.push({id:'budnear',cat:'nganSach',title:'💰 Sắp hết ngân sách: '+near.slice(0,3).map(b=>b.cn).join(', ')}); } }
  if(on('hanDung')) (store.get('ju.expiry',[])||[]).forEach(x=>{ const d=daysFromToday(x.date); if(d!=null&&d<=3) out.push({id:'exp'+(x.id||x.name),cat:'hanDung',title:'🗓️ '+x.name+(d<0?' — đã hết hạn':d===0?' — hết hạn hôm nay':' — còn '+d+' ngày')}); });
  if(on('giayTo')) (store.get('ju.docs',[])||[]).forEach(x=>{ if(!x.expiry) return; const d=daysFromToday(x.expiry); if(d!=null&&d<=30){ /* tên giấy tờ đã mã hoá → chỉ nhắc chung, mở mục Giấy tờ mới thấy */ const nm=x.name||'Một giấy tờ (mở mục Giấy tờ để xem)'; out.push({id:'doc'+(x.id||nm),cat:'giayTo',title:'🗂️ '+nm+(d<0?' — giấy tờ đã hết hạn':d===0?' — hết hạn hôm nay':' — hết hạn sau '+d+' ngày')}); } });
  if(on('yeuThuong')) out.push({id:'love',cat:'yeuThuong',title:'💌 Gửi nửa kia một lời yêu thương hôm nay nhé 💞'});
  if(on('nhanNhau')){ const me=store.get('ju.me',setup.me||'a'); const unread=unseenByPartner('ju.notes','ju.notesSeen',me); if(unread.length) out.push({id:'notes'+unread.length,cat:'nhanNhau',title:'💌 Nửa kia gửi bạn '+unread.length+' lời nhắn mới ("Nhắn nhau")'}); }
  if(on('checkin')){ const me=store.get('ju.me',setup.me||'a'); const newCk=unseenByPartner('ju.checkins','ju.checkinSeen',me); if(newCk.length){ const names=newCk.slice(0,2).map(c=>c.name).filter(Boolean).join(', '); out.push({id:'checkin'+newCk.length,cat:'checkin',title:'📸 Nửa kia vừa check-in quán mới'+(names?': '+names:'')}); } }
  if(on('tamLinh')) (upcomingSpiritual(2)||[]).slice(0,2).forEach((h,i)=>{ if(h.d!=null&&h.d>=0&&h.d<=2) out.push({id:'sp'+(h.name||i),cat:'tamLinh',title:'🪷 '+h.name+(h.d===0?' — hôm nay':' — còn '+h.d+' ngày')}); });
  if(on('chuky')){ const p=periodNext(); if(p&&!p.onPeriod&&p.days!=null&&p.days<=2) out.push({id:'period',cat:'chuky',title:'🌸 Kỳ kinh dự kiến — còn '+p.days+' ngày'}); }
  if(on('trabai')){ const it=store.get('ju.intimacy',null); if(it){ const me=store.get('ju.me',setup.me||'a'); const sg=it.signal; const sn=store.get('ju.intimacySeen',{})||{}; if(sg&&sg.by&&sg.by!==me&&!(sg.reply&&sg.reply.by===me)&&(sg.at||0)>(sn[me]||0)) out.push({id:'intsig'+(sg.at||''),cat:'trabai',title:'💗 Nửa kia vừa bật tín hiệu cho bạn 😏'}); const lg=it.log||{}; const ks=Object.keys(lg).sort(); const lastd=ks.length?ks[ks.length-1]:null; if(lastd){ const ds=Math.round((new Date(todayISO()+'T00:00:00')-new Date(lastd+'T00:00:00'))/86400000); if(ds>=14) out.push({id:'intlong',cat:'trabai',title:'💗 Đã '+ds+' ngày rồi — dành cho nhau chút thời gian nhé 😊'}); } const dnw=it.dateNight&&it.dateNight.weekday; if(dnw!=null && new Date(todayISO()+'T00:00:00').getDay()===dnw) out.push({id:'datenight',cat:'trabai',title:'📅 Tối nay là đêm hẹn hò của hai đứa 💞'+(it.dateNight.note?' — '+it.dateNight.note:'')}); if(me==='a'){ const pinfo=periodNext(); if(pinfo&&!pinfo.onPeriod&&pinfo.days!=null){ const dOv=pinfo.days-14; if(dOv>=-1&&dOv<=2) out.push({id:'lib'+dOv,cat:'trabai',title:dOv<=0?'💗 Hôm nay vợ có thể hứng khởi hơn (quanh rụng trứng) 😏':'💗 Còn '+dOv+' ngày tới ngày vợ dễ hứng khởi 😏'}); } } } }
  return out;
}
const KHO_NHAC='justus-noti';
const DANG_KY_DAY=subscribePush;   // Just Us CÓ đẩy nền: bảng justus_push_subs + Edge Function push-notify
/* @@GOM noti-runner-ju.jsx */
function NotiSettings({flash}){
  const [noti,setNoti]=useLocal('ju.noti',{on:false,cats:{kyNiem:true,sukien:true,viec:true,thucDon:true,nganSach:true,yeuThuong:true,nhanNhau:true,tamLinh:true,trabai:true,lich:true,hanDung:true,giayTo:true,ngayNho:false,chuky:false,checkin:true},time:'08:00'});
  const supported=(typeof Notification!=='undefined')&&('serviceWorker' in navigator);
  const [perm,setPerm]=useState(supported?Notification.permission:'unsupported');
  const [pushMsg,setPushMsg]=useState('');
  useEffect(()=>{ let on=true; (async()=>{ try{ if(noti.on&&supported&&'PushManager' in window){ const reg=await navigator.serviceWorker.ready; const s=await reg.pushManager.getSubscription(); if(on) setPushMsg(s?'push-on':(Cloud.connected&&Cloud.connected()?'':'foreground')); } }catch(_){} })(); return ()=>{on=false;}; },[noti.on]);
  const enable=async()=>{
    if(!supported){ flash&&flash('Máy/trình duyệt không hỗ trợ thông báo'); return; }
    let p=Notification.permission;
    if(p!=='granted'){ try{ p=await Notification.requestPermission(); }catch(_){} setPerm(p); }
    if(p==='granted'){ setNoti({...noti,on:true}); flash&&flash('Đã bật thông báo ✓');
      try{ const reg=await navigator.serviceWorker.ready;
        reg.showNotification('Just Us 💗',{body:'Đã bật thông báo! Tụi mình sẽ nhắc bạn những dịp quan trọng.',icon:'icon.svg',badge:'icon.svg'});
        if('periodicSync' in reg){ try{ const st=await navigator.permissions.query({name:'periodic-background-sync'}); if(st.state==='granted') await reg.periodicSync.register('ju-daily',{minInterval:12*60*60*1000}); }catch(_){} }
      }catch(_){}
      const ps=await subscribePush(); setPushMsg(ps.ok?'push-on':(ps.reason==='notconnected'?'foreground':(ps.reason==='unsupported'?'foreground':'error')));
    } else { setPerm(p); flash&&flash('Thông báo đang bị chặn — mở lại trong cài đặt trình duyệt'); }
  };
  const test=async()=>{ if(!supported){ flash&&flash('Máy không hỗ trợ thông báo'); return; } try{ const reg=await navigator.serviceWorker.ready; reg.showNotification('Thử thông báo 🔔',{body:'Đây là thông báo thử từ Just Us 💗',icon:'icon.svg',badge:'icon.svg'}); }catch(e){ flash&&flash('Không gửi được — kiểm tra quyền thông báo'); } };
  const tog=(k)=>setNoti(prev=>({...prev,cats:{...((prev&&prev.cats)||{}),[k]:!(((prev&&prev.cats)||{})[k]!==false)}}));
  const setCatTime=(k,v)=>setNoti({...noti,times:{...(noti.times||{}),[k]:v}});
  const cats=noti.cats||{};
  const CATS=[['kyNiem','💞 Ngày yêu nhau · cột mốc'],['sukien','📅 Sự kiện gia đình'],['lich','🗓️ Lịch sinh hoạt (mốc có 🔔)'],['hanDung','⏳ Đồ ăn / thuốc sắp hết hạn'],['giayTo','🗂️ Giấy tờ sắp hết hạn'],['viec','✅ Việc tới hạn · ưu tiên cao'],['thucDon','🍱 Món nấu hôm nay · đi chợ'],['nganSach','💰 Cảnh báo ngân sách tháng'],['yeuThuong','💌 Nhắc gửi lời yêu thương'],['nhanNhau','💌 Nhắn nhau (có lời nhắn mới)'],['trabai','💗 Trả bài (tín hiệu · ngày vợ hứng khởi · đêm hẹn)'],['tamLinh','🪷 Mùng 1 · rằm · lễ'],['ngayNho','🎂 Sinh nhật · giỗ · lễ cần quà'],['chuky','🌸 Chu kỳ sắp đến'],['checkin','📸 Check-in quán mới của nửa kia']];
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🔔 Thông báo điện thoại</span><span className="grow"></span>
        {noti.on?<span className="pill" style={{background:'var(--good)',color:'#fff'}}>Đang bật</span>:null}</div>
      {!noti.on
        ? <React.Fragment><div className="hc-body" style={{margin:'6px 0 8px'}}>Nhận nhắc trên điện thoại về sự kiện, ngày nhớ, việc cần làm… Cài Just Us vào màn hình chính để nhận đều hơn.</div>
            <button className="btn" onClick={enable}>🔔 Bật thông báo</button></React.Fragment>
        : <React.Fragment>
            <div className="hc-body" style={{margin:'6px 0 6px'}}>Chọn loại muốn được nhắc — mỗi mục có thể chỉnh giờ nhắc riêng:</div>
            {CATS.map(([k,l])=>(
              <div key={k} className="row" style={{padding:'6px 0',gap:8,flexWrap:'wrap'}}>
                <label className="row grow" style={{cursor:'pointer',minWidth:160,gap:8}}>
                  <input type="checkbox" checked={cats[k]!==false} onChange={()=>tog(k)} style={{width:18,height:18}}/>
                  <span style={{fontSize:14}}>{l}</span>
                </label>
                {cats[k]!==false && k!=='lich' && (()=>{ const isNow=(noti.times||{})[k]==='now'; return <>
                  <button className="pill" style={{background:isNow?'var(--good)':'var(--chip)',color:isNow?'#fff':'var(--chip-tx)'}}
                    onClick={()=>setCatTime(k,isNow?(noti.time||'08:00'):'now')}>⚡ Ngay</button>
                  {!isNow && <input className="inp" type="time" value={catNotiTime(noti,k)} onChange={e=>setCatTime(k,e.target.value)} style={{width:110}}/>}
                </>; })()}
              </div>
            ))}
            <div className="field" style={{marginTop:8}}><label>Giờ nhắc mặc định (áp cho mục chưa chỉnh riêng)</label>
              <input className="inp" type="time" value={noti.time||'08:00'} onChange={e=>setNoti({...noti,time:e.target.value})} style={{width:130}}/></div>
            <div className="row" style={{gap:8,marginTop:8}}>
              <button className="btn soft grow" onClick={test}>Gửi thử 🔔</button>
              <button className="btn soft" onClick={()=>{ setNoti({...noti,on:false}); flash&&flash('Đã tắt thông báo'); }}>Tắt</button>
            </div>
            {perm==='denied' && <div className="muted" style={{fontSize:11,marginTop:8}}>⚠️ Trình duyệt đang chặn thông báo. Vào cài đặt trang → cho phép Thông báo.</div>}
            {pushMsg==='push-on' && <div style={{fontSize:11,marginTop:8,color:'var(--good)',fontWeight:600}}>✅ Đã bật đẩy thông báo — nhận cả khi đóng app.</div>}
            {pushMsg==='foreground' && <div className="muted" style={{fontSize:11,marginTop:8}}>ℹ️ Hiện chỉ nhắc khi mở app. Đăng nhập + ghép đôi (mục ☁️ Đám mây) để nhận cả khi đóng app. <span style={{color:'var(--primary)',cursor:'pointer',textDecoration:'underline'}} onClick={async()=>{ const ps=await subscribePush(); setPushMsg(ps.ok?'push-on':(ps.reason==='notconnected'?'foreground':'error')); if(flash)flash(ps.ok?'Đã bật đẩy thông báo ✓':'Cần đăng nhập + ghép đôi trước'); }}>Thử bật đẩy</span></div>}
            {pushMsg==='error' && <div className="muted" style={{fontSize:11,marginTop:8}}>⚠️ Chưa bật được đẩy nền (vẫn nhắc khi mở app). Thử lại sau khi đã đăng nhập + ghép đôi.</div>}
            <div className="muted" style={{fontSize:11,marginTop:8,lineHeight:1.5}}>Mẹo: cài app vào màn hình chính (menu trình duyệt → "Thêm vào màn hình chính") để nhận thông báo tốt nhất. Thông báo đẩy hoạt động cả khi đóng app khi bạn đã đăng nhập + ghép đôi.</div>
          </React.Fragment>}
    </div>
  );
}
/* ============ Họ hàng (sơ đồ cây) + cư xử + ép rượu ============ */
const FAM_SIDES=[['noiC','Nội (nhà chồng)'],['ngoaiC','Ngoại (nhà chồng)'],['noiV','Nội (nhà vợ)'],['ngoaiV','Ngoại (nhà vợ)'],['nho','Gia đình nhỏ'],['khac','Bạn bè / khác']];
const FAM_GENS=[['1','Ông bà / các cụ'],['2','Bố mẹ · cô dì chú bác'],['3','Anh chị em · cùng lứa'],['4','Con cháu']];
const RELATIVE_TIPS=[
  'Về tới nơi: chào ông bà/người lớn tuổi trước, hỏi thăm sức khỏe rồi mới tới người cùng lứa.',
  'Ôn trước tên & cách xưng hô (dùng Sơ đồ họ hàng) để gọi đúng vai vế — người lớn rất để ý điều này.',
  'Chủ động phụ việc: bê mâm, rửa bát, trông trẻ — ghi điểm hơn ngồi không.',
  'Chuẩn bị quà/mừng tuổi tế nhị, hợp vai vế; đưa hai tay, nói lời chúc.',
  'Tránh chủ đề nhạy cảm trong mâm cỗ: lương thưởng, chuyện sinh con, so sánh con cháu, chính trị.',
  'Câu hỏi khó (bao giờ sinh thêm, mua nhà chưa…): cười xòa, trả lời ngắn, lái sang chuyện khác.',
  'Khen món ăn, cảm ơn chủ nhà; khen con cháu nhà người ta một câu cho vui.',
  'Hai vợ chồng thống nhất trước "kịch bản" và tín hiệu giải vây cho nhau; góp ý nhau riêng, giữ thể diện trước họ hàng.',
  'Đến/về chào đầy đủ; hôm sau nhắn cảm ơn ông bà/cô bác một câu.',
  'Nhớ vài sở thích nhỏ của người lớn (loại trà, món ưa thích) để lần sau tặng đúng ý.',
  'Hạn chế bấm điện thoại trong mâm cơm — chịu khó trò chuyện, hỏi han mới ghi điểm.',
  'Đi cùng con thì nhắc con khoanh tay chào; trẻ ngoan làm cả nhà vui lòng.',
  'Hỏi trước giờ giấc bữa cơm để tới đúng giờ, tránh để cả nhà phải chờ.',
  'Mang một món quà quê nhỏ (trái cây, đặc sản) khi tới thăm — tấm lòng quan trọng hơn giá trị.',
  'Chủ động bắt chuyện, hỏi han các em nhỏ và cháu trong nhà cho không khí gần gũi.',
  'Lỡ nói điều chưa phải thì xin lỗi nhẹ nhàng ngay — người lớn quý ở sự chân thành.',
];
const ALCOHOL_TIPS=[
  'Nhận ly cho phải phép nhưng chỉ nhấp môi; tự rót thêm nước lọc/nước ngọt để "cầm cự".',
  'Lý do sức khỏe (rất dễ được chấp nhận): "Cháu đang uống thuốc / đau dạ dày, bác cho xin phép."',
  'Lý do lái xe & luật: "Cháu còn lái xe đưa vợ con về, giờ phạt nồng độ cồn nặng lắm ạ."',
  'Rủ vợ/chồng làm đồng minh đỡ lời, hoặc nhận phần "lái xe" từ đầu bữa.',
  'Uống chậm, ăn kèm nhiều, xen kẽ nước lọc để giảm say.',
  'Chủ động nâng ly chúc trước, xin phép uống ít — vừa lịch sự vừa không bị ép.',
  'Kiên định & vui vẻ: cười xòa "cháu xin phép", không cần giải thích dài dòng.',
  'Thấy quá chén: dừng ngay, uống nhiều nước, ra ngoài hít thở, tìm chỗ nghỉ.',
  'Đã uống thì TUYỆT ĐỐI không lái xe — đặt taxi/Grab hoặc nhờ người tỉnh chở về.',
  'Ăn lót dạ trước khi vào tiệc (cơm, bánh mì, sữa) để lâu say hơn.',
  'Cầm sẵn ly nước lọc trên tay — vừa đỡ bị mời liên tục vừa giảm say.',
  'Nếu đang mang thai hoặc cho con bú, cứ nói thẳng lý do — không ai ép được.',
  'Chọn ngồi cạnh người không thích ép rượu để cả buổi dễ thở hơn.',
  'Đặt sẵn “chỉ tiêu” số ly cho mình trước khi vào tiệc và giữ đúng.',
  'Nhờ chủ tiệc hoặc người thân biết ý đỡ lời giúp khi bị mời quá nhiệt tình.',
];
function FamilyTree({people,me,flash}){
  const [fam,setFam]=useLocal('ju.family',[]);
  const [view,setView]=useState('tree');
  const [edit,setEdit]=useState(null);
  const [q,setQ]=useState('');
  const fileRef=useRef(null);
  const groupRef=useRef(null);
  const [tagImg,setTagImg]=useState(null); // ảnh đại gia đình (base64) đang gán mặt
  const [box,setBox]=useState(null); // {cx,cy,s} theo tỉ lệ
  const [fromTag,setFromTag]=useState(false);
  const [taggedN,setTaggedN]=useState(0);
  const [quiz,setQuiz]=useState(null); const [ans,setAns]=useState(null); const [score,setScore]=useState({ok:0,total:0});
  const save=()=>{ if(!edit||!(edit.name||'').trim())return; if(edit.id) setFam(prev=>prev.map(x=>x.id===edit.id?edit:x)); else setFam(prev=>[{...edit,id:uid()},...prev]); const wasTag=fromTag; setEdit(null); if(wasTag){ setFromTag(false); setBox(null); setTaggedN(n=>n+1); } };
  const del=(id)=>{ if(confirm('Xoá người này khỏi sơ đồ?')){ setFam(prev=>prev.filter(x=>x.id!==id)); setEdit(null); } };
  const onFile=async(e)=>{ const f=e.target.files[0]; if(!f||!edit)return; e.target.value='';
    if(Cloud.connected&&Cloud.connected()){ try{ flash&&flash('Đang tải ảnh…'); const path=await Cloud.uploadPhoto(f); setEdit(ed=>({...ed,photo:{path}})); flash&&flash('Đã thêm ảnh 📷'); }catch(err){ flash&&flash('Tải ảnh lỗi'); } }
    else { const r=new FileReader(); r.onload=()=>setEdit(ed=>({...ed,photo:{src:r.result}})); r.readAsDataURL(f); } };
  // ---- Gán mặt từ ảnh đại gia đình ----
  const onGroupFile=(e)=>{ const f=e.target.files[0]; if(!f)return; e.target.value=''; const r=new FileReader(); r.onload=()=>{ setTagImg(r.result); setBox(null); setTaggedN(0); }; r.readAsDataURL(f); };
  const onTapImg=(e)=>{ const r=e.currentTarget.getBoundingClientRect(); const cx=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)); const cy=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height)); setBox(b=>({cx,cy,s:(b&&b.s)||0.2})); };
  const cropFace=(src,b)=>new Promise(res=>{ const img=new Image(); img.onload=()=>{ try{ const iw=img.naturalWidth,ih=img.naturalHeight; const side=Math.max(10,b.s*iw); const cx=b.cx*iw, cy=b.cy*ih; const c=document.createElement('canvas'); c.width=220;c.height=220; const ctx=c.getContext('2d'); ctx.fillStyle='#eee'; ctx.fillRect(0,0,220,220); ctx.drawImage(img, cx-side/2, cy-side/2, side, side, 0,0,220,220); res(c.toDataURL('image/jpeg',0.82)); }catch(err){ res(null); } }; img.onerror=()=>res(null); img.src=src; });
  const cropAndAdd=async()=>{ if(!tagImg||!box)return; const cropped=await cropFace(tagImg,box); if(!cropped){ flash&&flash('Không cắt được ảnh, thử lại'); return; } setFromTag(true); setEdit({name:'',side:'noiC',relation:'',gen:'2',xungho:'',note:'',photo:{src:cropped}}); };
  // ---- Ôn tên (quiz) ----
  const pool=fam.filter(f=>(f.name||'').trim());
  const withPhoto=pool.filter(f=>f.photo);
  const newQ=()=>{ const base=withPhoto.length?withPhoto:pool; if(!base.length){ setQuiz(null); setAns(null); return; } const cur=base[Math.floor(Math.random()*base.length)]; const others=pool.filter(f=>f.id!==cur.id).map(f=>f.name); const opts=[cur.name]; while(opts.length<4&&others.length){ opts.push(others.splice(Math.floor(Math.random()*others.length),1)[0]); } for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=opts[i];opts[i]=opts[j];opts[j]=t; } setQuiz({cur,opts}); setAns(null); };
  const pick=(o)=>{ if(ans!=null||!quiz)return; setAns(o); setScore(s=>({ok:s.ok+(o===quiz.cur.name?1:0),total:s.total+1})); };
  const ql=q.trim().toLowerCase();
  const filtered=fam.filter(f=>!ql||(f.name||'').toLowerCase().includes(ql)||(f.relation||'').toLowerCase().includes(ql)||(f.note||'').toLowerCase().includes(ql)||(f.xungho||'').toLowerCase().includes(ql));
  return (
    <div>
      <div className="seg" style={{marginTop:10}}>
        <button className={view==='tree'?'on':''} onClick={()=>setView('tree')}>🌳 Sơ đồ</button>
        <button className={view==='quiz'?'on':''} onClick={()=>{ setView('quiz'); newQ(); }}>🧠 Ôn tên</button>
        <button className={view==='tips'?'on':''} onClick={()=>setView('tips')}>🍶 Cư xử</button>
      </div>
      <input ref={groupRef} type="file" accept="image/*" style={{display:'none'}} onChange={onGroupFile}/>
      {view==='tree' ? <div>
        <div className="row" style={{margin:'8px 14px',gap:8}}>
          <input className="inp grow" placeholder="🔎 Tìm tên / vai vế…" value={q} onChange={e=>setQ(e.target.value)}/>
          <button className="btn sm soft" onClick={()=>groupRef.current&&groupRef.current.click()}>📸 Ảnh cả nhà</button>
          <button className="btn sm" onClick={()=>setEdit({name:'',side:'noiC',relation:'',gen:'2',xungho:'',note:'',photo:null})}>＋</button>
        </div>
        <div className="muted center" style={{fontSize:11,margin:'0 14px 4px'}}>Lưu tên + mặt + cách xưng hô để ôn trước khi về quê/giỗ Tết. Hiện có {fam.length} người.</div>
        {fam.length===0 && <div className="empty muted">Chưa có ai — bấm ＋ Thêm để lưu người họ hàng đầu tiên.</div>}
        {FAM_SIDES.map(([sk,slabel])=>{ const grp=filtered.filter(f=>f.side===sk); if(!grp.length) return null;
          return <div key={sk}>
            <div className="sec-title">{slabel} <span className="muted" style={{fontSize:11,fontWeight:400}}>({grp.length})</span></div>
            {FAM_GENS.map(([gk,glabel])=>{ const gg=grp.filter(f=>(f.gen||'2')===gk); if(!gg.length) return null;
              return <div key={gk} style={{margin:'0 14px 6px'}}>
                <div className="muted" style={{fontSize:11,margin:'4px 0'}}>{glabel}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {gg.map(f=>(
                    <div key={f.id} onClick={()=>setEdit(f)} style={{width:'calc(50% - 4px)',background:'var(--bg)',border:'1px solid var(--line)',borderRadius:12,padding:8,cursor:'pointer',display:'flex',gap:8,alignItems:'center'}}>
                      {f.photo ? <PhotoImg photo={f.photo} style={{width:42,height:42,borderRadius:'50%',objectFit:'cover',flex:'0 0 auto'}}/> : <span style={{width:42,height:42,borderRadius:'50%',background:'var(--chip)',display:'grid',placeItems:'center',fontSize:20,flex:'0 0 auto'}}>{f.gen==='1'?'👴':f.gen==='4'?'🧒':'🧑'}</span>}
                      <div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                        <div className="muted" style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.relation||''}{f.xungho?' · '+f.xungho:''}</div></div>
                    </div>
                  ))}
                </div>
              </div>;
            })}
          </div>;
        })}
        {edit && <Sheet title={edit.id?'Sửa người họ hàng':'Thêm người họ hàng'} onClose={()=>setEdit(null)}>
          <div className="center" style={{marginBottom:8}}>
            {edit.photo ? <PhotoImg photo={edit.photo} style={{width:84,height:84,borderRadius:'50%',objectFit:'cover'}}/> : <div style={{width:84,height:84,borderRadius:'50%',background:'var(--chip)',display:'grid',placeItems:'center',fontSize:38,margin:'0 auto'}}>📷</div>}
            <div style={{marginTop:6}}><button className="btn sm soft" onClick={()=>fileRef.current&&fileRef.current.click()}>{edit.photo?'Đổi ảnh':'Thêm ảnh mặt'}</button>
            {edit.photo && <button className="btn sm soft" style={{marginLeft:6}} onClick={()=>setEdit({...edit,photo:null})}>Xoá ảnh</button>}</div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile}/>
          </div>
          <div className="field"><label>Tên / gọi là</label><input className="inp" autoFocus value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} placeholder="vd: Bác Hùng, Cô Lan"/></div>
          <div className="field"><label>Thuộc bên</label><select className="inp" value={edit.side} onChange={e=>setEdit({...edit,side:e.target.value})}>{FAM_SIDES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label>Thế hệ</label><select className="inp" value={edit.gen} onChange={e=>setEdit({...edit,gen:e.target.value})}>{FAM_GENS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label>Vai vế / quan hệ</label><input className="inp" value={edit.relation} onChange={e=>setEdit({...edit,relation:e.target.value})} placeholder="vd: anh trai của bố"/></div>
          <div className="field"><label>Cách xưng hô</label><input className="inp" value={edit.xungho} onChange={e=>setEdit({...edit,xungho:e.target.value})} placeholder="vd: gọi Bác – xưng cháu"/></div>
          <div className="field"><label>Ghi chú nhận diện / sở thích / kiêng kỵ</label><textarea className="inp" value={edit.note} onChange={e=>setEdit({...edit,note:e.target.value})} placeholder="vd: cao, đeo kính, thích câu cá, hay hỏi chuyện con cái"/></div>
          <button className="btn" onClick={save}>💾 Lưu</button>
          {edit.id && <button className="btn soft" style={{marginTop:8,width:'100%'}} onClick={()=>del(edit.id)}>🗑️ Xoá người này</button>}
        </Sheet>}
      </div> : view==='quiz' ? <div>
        <div className="muted center" style={{fontSize:11,margin:'10px 14px 6px'}}>Nhìn mặt đoán tên — ôn để nhớ cả nhà 💪 (thêm ảnh mặt để hiệu quả hơn)</div>
        {pool.length<1 ? <div className="empty muted">Chưa có ai để ôn — thêm người (kèm ảnh mặt) ở tab Sơ đồ trước nhé.</div> : <div className="card center">
          <div className="muted" style={{fontSize:12.5}}>Đây là ai?</div>
          {quiz && (quiz.cur.photo ? <PhotoImg photo={quiz.cur.photo} style={{width:120,height:120,borderRadius:'50%',objectFit:'cover',margin:'10px auto'}}/> : <div style={{width:120,height:120,borderRadius:'50%',background:'var(--chip)',display:'grid',placeItems:'center',fontSize:52,margin:'10px auto'}}>{quiz.cur.gen==='1'?'👴':quiz.cur.gen==='4'?'🧒':'🧑'}</div>)}
          {quiz && quiz.cur.relation && <div className="muted" style={{fontSize:12.5}}>Gợi ý: {quiz.cur.relation}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
            {quiz && quiz.opts.map((o,i)=>{ const isC=o===quiz.cur.name; const picked=ans===o; const st= ans!=null&&isC?{background:'var(--good)',color:'#fff'}:(picked&&!isC?{background:'#d9534f',color:'#fff'}:{}); return <button key={i} className="btn soft" style={st} onClick={()=>pick(o)}>{o}</button>; })}
          </div>
          {ans!=null && quiz && <div style={{marginTop:10}}>
            <div style={{fontWeight:800,color:ans===quiz.cur.name?'var(--good)':'#d9534f'}}>{ans===quiz.cur.name?'✅ Chính xác!':'❌ Đây là '+quiz.cur.name}</div>
            {(quiz.cur.xungho||quiz.cur.note) && <div className="muted" style={{fontSize:12.5,marginTop:3}}>{quiz.cur.xungho||''}{quiz.cur.xungho&&quiz.cur.note?' · ':''}{quiz.cur.note||''}</div>}
            <button className="btn" style={{marginTop:10}} onClick={newQ}>Người tiếp →</button>
          </div>}
          <div className="muted" style={{fontSize:12.5,marginTop:10}}>Điểm: <b>{score.ok}/{score.total}</b></div>
        </div>}
      </div> : <div>
        <Collapse id="fam-tips" defaultOpen={false} title="🤝 Cư xử với họ hàng">
        <div className="card"><ul style={{margin:0,paddingLeft:18,fontSize:12.5,lineHeight:1.7}}>{RELATIVE_TIPS.map((t,i)=><li key={i} style={{marginBottom:5}}>{t}</li>)}</ul></div>
        </Collapse>
        <Collapse id="fam-alcohol" defaultOpen={false} title="🍶 Khi bị ép rượu">
        <div className="card"><ul style={{margin:0,paddingLeft:18,fontSize:12.5,lineHeight:1.7}}>{ALCOHOL_TIPS.map((t,i)=><li key={i} style={{marginBottom:5}}>{t}</li>)}</ul>
          <div style={{fontSize:11,marginTop:8,background:'var(--bg)',borderRadius:8,padding:'7px 10px'}}>⚠️ Đã uống rượu bia thì <b>tuyệt đối không lái xe</b> — đặt taxi/Grab. Luật VN phạt nồng độ cồn rất nặng.</div></div>
        </Collapse>
      </div>}
      {tagImg && !edit && <div className="ov" onClick={()=>{ setTagImg(null); setBox(null); }}>
        <div className="sheet" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
          <div className="x" onClick={()=>{ setTagImg(null); setBox(null); }}>✕</div>
          <h3>📸 Gán mặt vào cây gia đình</h3>
          <div className="muted" style={{fontSize:12.5}}>Chạm vào MẶT một người → chỉnh vòng cho vừa → “Cắt mặt & thêm người”. Làm lần lượt từng người.</div>
          <div style={{position:'relative',marginTop:8,lineHeight:0}}>
            <img src={tagImg} onClick={onTapImg} style={{width:'100%',borderRadius:10,display:'block',cursor:'crosshair'}}/>
            {box && <div style={{position:'absolute',left:(box.cx*100)+'%',top:(box.cy*100)+'%',width:(box.s*100)+'%',aspectRatio:'1/1',transform:'translate(-50%,-50%)',border:'3px solid #fff',borderRadius:'50%',boxShadow:'0 0 0 9999px rgba(0,0,0,.45)',pointerEvents:'none'}}></div>}
          </div>
          <div className="row" style={{marginTop:10,gap:8}}><span className="muted" style={{fontSize:12.5,flex:'0 0 auto'}}>Cỡ vòng</span>
            <input type="range" min="8" max="45" value={Math.round((box?box.s:0.2)*100)} onChange={e=>setBox(b=>({cx:(b&&b.cx)||0.5,cy:(b&&b.cy)||0.5,s:(+e.target.value)/100}))} className="grow"/></div>
          <button className="btn" disabled={!box} style={{marginTop:6,opacity:box?1:.5}} onClick={cropAndAdd}>✂️ Cắt mặt & thêm người</button>
          <div className="muted center" style={{fontSize:11,marginTop:6}}>Đã thêm {taggedN} người từ ảnh này · bấm ✕ khi xong</div>
        </div>
      </div>}
    </div>
  );
}
/* ============ Sức khỏe gia đình → lưu ý sinh hoạt + ăn uống ============ */
const HEALTH_CONDITIONS=[
  {k:'dạ dày',who:'adult',name:'Đau dạ dày / trào ngược',life:['Ăn đúng giờ, chia nhỏ bữa, không để quá đói hoặc quá no.','Không nằm ngay sau ăn; kê cao gối khi ngủ.','Giảm căng thẳng; bỏ thuốc lá.'],eat:['Cháo, cơm mềm, bánh mì, chuối chín','Nghệ + mật ong, gừng ấm','Rau củ luộc, thịt nạc'],avoid:['Đồ cay, chua, chiên rán nhiều dầu','Rượu bia, cà phê, nước có gas','Ăn khuya']},
  {k:'huyết áp',who:'adult',name:'Huyết áp cao',life:['Giảm muối (dưới 5g/ngày); đo huyết áp đều.','Tập thể dục nhẹ 30 phút/ngày; giảm cân nếu thừa.','Ngủ đủ, tránh stress, hạn chế rượu bia.'],eat:['Rau xanh, chuối, khoai (giàu kali)','Cá, đậu, ngũ cốc nguyên cám','Món luộc/hấp'],avoid:['Muối, nước mắm, đồ muối chua, mì gói','Mỡ, nội tạng, da động vật','Rượu bia, thuốc lá']},
  {k:'mỡ máu',who:'adult',name:'Mỡ máu / gan nhiễm mỡ',life:['Vận động đều, giảm cân từ từ.','Hạn chế bia rượu và đồ ngọt.','Xét nghiệm mỡ máu định kỳ.'],eat:['Cá béo (cá hồi, cá thu), yến mạch','Rau, trái cây, các loại hạt','Dầu thực vật (olive)'],avoid:['Đồ chiên xào, mỡ, nội tạng','Đồ ngọt, tinh bột tinh chế nhiều','Rượu bia']},
  {k:'tiểu đường',who:'adult',name:'Tiểu đường / đường huyết cao',life:['Ăn đúng bữa, không bỏ bữa.','Ăn rau trước, tinh bột sau; đi bộ nhẹ sau ăn.','Theo dõi đường huyết định kỳ.'],eat:['Gạo lứt, yến mạch, khoai lang lượng vừa','Rau xanh nhiều, đạm nạc','Trái cây ít ngọt (bưởi, ổi, táo)'],avoid:['Đường, bánh kẹo, nước ngọt','Cơm trắng/bún/miến lượng lớn','Trái cây quá ngọt (mít, nhãn, sầu riêng)']},
  {k:'gout',who:'adult',name:'Gout / axit uric cao',life:['Uống nhiều nước (2–3L/ngày).','Giảm cân từ từ; bỏ bia rượu.'],eat:['Rau xanh, trái cây, ngũ cốc','Sữa ít béo, trứng','Uống đủ nước'],avoid:['Thịt đỏ, nội tạng, hải sản, nước hầm xương','Bia, rượu','Nước ngọt có đường']},
  {k:'thiếu máu',who:'adult',name:'Thiếu máu / thiếu sắt',life:['Khám để tìm nguyên nhân.','Uống sắt cùng vitamin C; tránh uống cùng trà/cà phê.'],eat:['Thịt bò, gan, lòng đỏ trứng','Rau lá xanh đậm, các loại đậu','Trái cây giàu vitamin C (cam, ổi)'],avoid:['Trà/cà phê ngay sau bữa ăn','Ăn kiêng quá mức']},
  {k:'mất ngủ',who:'adult',name:'Mất ngủ / căng thẳng',life:['Ngủ và dậy đúng giờ; phòng tối, mát.','Tắt màn hình 1 giờ trước ngủ.','Thư giãn: thở sâu, tắm ấm.'],eat:['Sữa ấm, chuối, hạt sen','Bữa tối nhẹ và sớm','Trà thảo mộc (hoa cúc)'],avoid:['Cà phê, trà đặc, nước tăng lực buổi chiều','Ăn no sát giờ ngủ','Rượu bia']},
  {k:'đau lưng',who:'adult',name:'Đau lưng / thoát vị đĩa đệm',life:['Tránh ngồi lâu; đứng dậy vận động mỗi 45 phút.','Không mang vác nặng sai tư thế.','Tập cơ lưng/bụng nhẹ, bơi lội.'],eat:['Thực phẩm giàu canxi (sữa, cá nhỏ, đậu)','Vitamin D (nắng sớm, cá béo)','Rau xanh, các loại hạt'],avoid:['Tăng cân','Ngồi gù lưng lâu','Nâng vật nặng đột ngột']},
  {k:'xoang',who:'adult',name:'Viêm mũi dị ứng / xoang',life:['Giữ ấm mũi họng, tránh lạnh đột ngột.','Đeo khẩu trang khi ra đường; rửa mũi nước muối.','Giữ nhà sạch, ít bụi và nấm mốc.'],eat:['Đồ ấm, nước ấm','Tỏi, gừng, mật ong','Trái cây giàu vitamin C'],avoid:['Đồ lạnh, nước đá','Bụi, phấn hoa, lông thú']},
  {k:'tiểu đêm',who:'adult',name:'Tiểu nhiều lần / tiểu đêm (bàng quang kích thích)',life:['Uống đủ nước ban ngày, giảm dần 2–3 giờ trước khi ngủ.','Giảm cà phê, trà đặc, bia rượu, nước có gas — dễ kích thích bàng quang.','Tập giãn khoảng cách giữa các lần đi tiểu; tập cơ sàn chậu (Kegel).','Đi tiểu hết trước khi ngủ; giữ ấm bụng dưới và chân khi lạnh.','Tiểu buốt/rắt, nước tiểu đục hoặc kéo dài → đi khám (viêm tiết niệu, tuyến tiền liệt, tiểu đường).'],eat:['Uống nước đều ban ngày, giảm về chiều tối','Rau xanh, trái cây ít nước vào buổi tối','Bí đỏ / hạt bí (dân gian hỗ trợ, tham khảo)'],avoid:['Cà phê, trà đặc, bia rượu, nước ngọt có gas (nhất là tối)','Đồ cay nóng, quá mặn','Uống nhiều nước sát giờ ngủ']},
  {k:'đau đầu',who:'adult',name:'Đau đầu khi thay đổi thời tiết',life:['Trở trời: giữ ấm đầu–cổ, tránh gió lùa, đội mũ khi ra ngoài.','Ngủ đủ và đúng giờ; tránh thức khuya.','Uống đủ nước, không bỏ bữa (đói và mất nước dễ gây đau đầu).','Khi đau: nghỉ nơi yên tĩnh, mát, giảm ánh sáng chói; xoa thái dương–gáy, chườm ấm.','Đau dữ dội đột ngột, kèm nôn/mờ mắt/yếu tay chân → đi khám ngay.'],eat:['Uống đủ nước, trà gừng ấm','Ăn đủ bữa; thêm magie (rau lá xanh, hạt, chuối)','Đồ ấm, dễ tiêu'],avoid:['Bỏ bữa, để đói','Rượu bia, đồ uống nhiều caffeine','Đồ lên men, nhiều mì chính, sô-cô-la nếu thấy nhạy cảm']},
  {k:'lo âu',who:'adult',name:'Hay lo lắng / stress',life:['Thở sâu 4–7–8 hoặc thiền/chánh niệm vài phút mỗi ngày.','Vận động đều (đi bộ, yoga) — giảm lo âu rõ rệt.','Ngủ đủ; giảm caffeine, mạng xã hội và tin tức tiêu cực.','Viết ra điều lo, tách việc kiểm soát được / không; chia nhỏ việc.','Chia sẻ với người kia; đặt giới hạn công việc, nghỉ ngơi hợp lý.','Lo âu kéo dài, ảnh hưởng giấc ngủ/sinh hoạt → nên gặp chuyên gia tâm lý.'],eat:['Magie (rau lá xanh, hạt, chuối)','Omega-3 (cá hồi, cá thu), sữa chua','Trà hoa cúc, uống đủ nước'],avoid:['Caffeine nhiều (cà phê, nước tăng lực), rượu bia','Đường và đồ chế biến sẵn nhiều','Bỏ bữa, ăn uống thất thường']},
  {k:'táo bón',who:'both',name:'Táo bón',life:['Uống đủ nước; vận động đều.','Đi vệ sinh đúng giờ; với bé có thể massage bụng.'],eat:['Rau xanh, trái cây (đu đủ, chuối, mận)','Ngũ cốc nguyên cám, khoai lang','Sữa chua / men vi sinh'],avoid:['Đồ ăn nhanh, ít chất xơ','Thiếu nước','Với bé: bớt bánh kẹo']},
  {k:'thừa cân',who:'adult',name:'Thừa cân',life:['Vận động 30–45 phút/ngày.','Ăn chậm, no khoảng 80%.','Ngủ đủ, giảm đường.'],eat:['Rau nhiều, đạm nạc (ức gà, cá, đậu)','Tinh bột ít, ưu tiên gạo lứt/khoai','Uống nước trước bữa ăn'],avoid:['Đồ chiên, đồ ngọt, nước ngọt','Ăn khuya','Rượu bia']},
  {k:'biếng ăn',who:'child',name:'Con biếng ăn',life:['Ăn đúng bữa, không ăn vặt sát bữa.','Không ép; bữa gọn trong 30 phút.','Cho tự xúc, ăn cùng cả nhà.'],eat:['Đa dạng món, đủ 4 nhóm','Đổi cách chế biến, trang trí đẹp mắt','Đủ sữa và chế phẩm sữa'],avoid:['Ép ăn, dọa nạt','Cho xem tivi/điện thoại khi ăn','Nước ngọt, bánh kẹo trước bữa']},
  {k:'ốm vặt',who:'child',name:'Con hay ốm vặt / đề kháng kém',life:['Ngủ đủ giấc; vận động, tắm nắng sớm.','Rửa tay thường xuyên; tiêm chủng đầy đủ.'],eat:['Đủ đạm và kẽm (thịt, hàu, trứng)','Rau củ quả nhiều màu (vitamin A, C)','Sữa chua / men vi sinh'],avoid:['Đồ ngọt nhiều','Thiếu ngủ','Ăn uống thiếu đa dạng']},
  {k:'nóng trong',who:'child',name:'Con nóng trong / rôm sảy',life:['Mặc thoáng mát, tắm rửa sạch sẽ.','Phòng thoáng, không quá nóng.'],eat:['Uống đủ nước','Rau mát, trái cây (cam, dưa hấu, rau má)','Cháo/đồ ăn thanh đạm'],avoid:['Đồ chiên rán, cay nóng','Bánh kẹo, nước ngọt','Mặc quá kín/nóng']},
  {k:'còi',who:'child',name:'Con còi / chậm tăng cân',life:['Ngủ đủ; vận động; tắm nắng sớm lấy vitamin D.','Khám dinh dưỡng nếu chậm nhiều.'],eat:['Đủ đạm và chất béo tốt (dầu ăn, bơ, cá)','Canxi (sữa, phô mai, cá nhỏ)','Bữa phụ giàu năng lượng'],avoid:['Bỏ bữa','Đồ ăn rỗng (bánh kẹo)','Cháo quá loãng, ít đạm']},
];
function FamilyHealth({people,me}){
  const [health,setHealth]=useLocal('ju.health',{});
  const [child]=useLocal('ju.child',{});
  const [openM,setOpenM]=useState('a');
  const members=[{k:'a',name:(people.a.name||'Bố')+' (bố)',who:'adult',icon:'👨'},{k:'b',name:(people.b.name||'Mẹ')+' (mẹ)',who:'adult',icon:'👩'},{k:'child',name:(child&&child.name)||'Con',who:'child',icon:'🧒'}];
  const toggleCond=(mk,ck)=>{ const cur=(health[mk]&&health[mk].conds)||[]; const nn=cur.indexOf(ck)>=0?cur.filter(x=>x!==ck):[...cur,ck]; setHealth({...health,[mk]:{...(health[mk]||{}),conds:nn}}); };
  const setNote=(mk,v)=>setHealth({...health,[mk]:{...(health[mk]||{}),note:v}});
  return (
    <div>
      <div className="muted center" style={{fontSize:11,margin:'10px 14px 4px'}}>Chọn vấn đề sức khỏe của mỗi người → app gợi ý lưu ý sinh hoạt & ăn uống. Tham khảo, không thay tư vấn bác sĩ.</div>
      {members.map(m=>{ const sel=(health[m.k]&&health[m.k].conds)||[];
        const avail=HEALTH_CONDITIONS.filter(c=>c.who===m.who||c.who==='both');
        const chosen=HEALTH_CONDITIONS.filter(c=>sel.indexOf(c.k)>=0);
        const agg=(field)=>{ const s=[]; chosen.forEach(c=>(c[field]||[]).forEach(x=>{ if(s.indexOf(x)<0) s.push(x); })); return s; };
        const open=openM===m.k;
        return <div key={m.k} className="card">
          <div className="row" style={{cursor:'pointer'}} onClick={()=>setOpenM(open?'':m.k)}><span className="hc-title">{m.icon} {m.name}</span><span className="grow"></span><span className="hc-act">{sel.length?sel.length+' vấn đề ›':'chọn ›'}</span></div>
          {open && <div style={{marginTop:8}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {avail.map(c=>{ const on=sel.indexOf(c.k)>=0; return <button key={c.k} className="pill" style={on?{background:'var(--primary)',color:'#fff'}:{opacity:.85}} onClick={()=>toggleCond(m.k,c.k)}>{on?'✓ ':''}{c.name}</button>; })}
            </div>
            {chosen.length>0 && <div style={{marginTop:10}}>
              {agg('life').length>0 && <div><div className="hc-title" style={{fontSize:12.5}}>🧘 Lưu ý sinh hoạt</div><ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:12.5,lineHeight:1.6}}>{agg('life').map((t,i)=><li key={i}>{t}</li>)}</ul></div>}
              {agg('eat').length>0 && <div style={{marginTop:8}}><div className="hc-title" style={{fontSize:12.5,color:'var(--good)'}}>🟢 Nên ăn</div><ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:12.5,lineHeight:1.6}}>{agg('eat').map((t,i)=><li key={i}>{t}</li>)}</ul></div>}
              {agg('avoid').length>0 && <div style={{marginTop:8}}><div className="hc-title" style={{fontSize:12.5,color:'#d9534f'}}>🔴 Nên hạn chế</div><ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:12.5,lineHeight:1.6}}>{agg('avoid').map((t,i)=><li key={i}>{t}</li>)}</ul></div>}
            </div>}
            <div className="field" style={{marginTop:10}}><label>Ghi chú riêng (thuốc đang dùng, dị ứng, chỉ số…)</label><textarea className="inp" value={(health[m.k]&&health[m.k].note)||''} onChange={e=>setNote(m.k,e.target.value)} placeholder="vd: dị ứng penicillin; huyết áp 140/90"/></div>
          </div>}
        </div>;
      })}
      <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>🥣 Gợi ý bữa sáng đủ chất & thực đơn hợp sức khỏe đã chuyển sang mục 🍱 Thực đơn.</div>
    </div>
  );
}
const US_SEGS=[
  {k:'routine',icon:'🗓️',label:'Lịch sinh hoạt'},
  {k:'family',icon:'🌳',label:'Họ hàng'},
  {k:'health',icon:'🩺',label:'Bệnh nền'},
  {k:'projects',icon:'💒',label:'Việc gia đình'},
  {k:'spirit',icon:'🪷',label:'Tâm linh'},
  {k:'period',icon:'🌸',label:'Chu kỳ'},
  {k:'ibLog',icon:'📝',label:'Nhật ký'},
  {k:'ibSig',icon:'😏',label:'Tín hiệu'},
  {k:'ibWant',icon:'🌟',label:'Muốn thử'},
  {k:'ibHealth',icon:'💛',label:'Cảm xúc'},
  {k:'ibGame',icon:'🎲',label:'Chơi'},
  {k:'ibDate',icon:'📅',label:'Hẹn hò'},
  {k:'ibKnow',icon:'📖',label:'Kiến thức'},
  {k:'ibLock',icon:'🔒',label:'Riêng tư'},
  {k:'events',icon:'📅',label:'Sự kiện'},
  {k:'dates',icon:'🎂',label:'Ngày nhớ'},
  {k:'timeline',icon:'🕰️',label:'Kỷ niệm'},
  {k:'onthisday',icon:'📆',label:'Ngày này năm ngoái'},
  {k:'fund',icon:'💸',label:'Chi tiêu'},
  {k:'todos',icon:'✅',label:'Việc cần làm'},
  {k:'goals',icon:'🎯',label:'Mục tiêu'},
  {k:'chores',icon:'🧹',label:'Việc nhà'},
  {k:'rules',icon:'📜',label:'Quy tắc'},
  {k:'stash',icon:'📦',label:'Cất giữ'},
  {k:'docs',icon:'🗂️',label:'Giấy tờ'},
  {k:'budget',icon:'🎚️',label:'Ngân sách'},
  {k:'moneylover',icon:'💵',label:'Money Lover'},
];
const US_GROUPS=[
  {k:'daily',icon:'☀️',label:'Hôm nay',items:['todos','routine','chores']},
  {k:'money',icon:'💰',label:'Tiền nong',items:['fund','budget','moneylover']},
  {k:'plan',icon:'🛣️',label:'Chặng đường',items:['events','dates','timeline','onthisday','goals']},
  {k:'kho',icon:'🗄️',label:'Hồ sơ nhà',items:['docs','stash','rules']},
  {k:'bigfam',icon:'🏡',label:'Gia đình lớn',items:['family','projects']},
];
const US_SEG_MAP=Object.fromEntries(US_SEGS.map(s=>[s.k,s]));
const MENU_REGISTRY=[
  {id:'us-groups',label:'Nhà mình · nhóm chính',items:US_GROUPS.map(g=>({k:g.k,icon:g.icon,label:g.label}))},
  ...US_GROUPS.map(g=>({id:'us-'+g.k,label:'Nhà mình · '+g.label,items:g.items.map(k=>US_SEG_MAP[k]).filter(Boolean)})),
  {id:'date',label:'Hẹn hò',items:[{k:'idea',icon:'💡',label:'Ý tưởng'},{k:'hanoi',icon:'📍',label:'Gợi ý HN'},{k:'events',icon:'🎪',label:'Sự kiện HN'},{k:'food',icon:'🍜',label:'Quán & Món'},{k:'checkin',icon:'📸',label:'Check-in ảnh'},{k:'wish',icon:'💝',label:'Ước mơ chung'}]},
  {id:'wish',label:'Ước mơ chung',items:[{k:'gift',icon:'🎁',label:'Quà tặng'},{k:'bucket',icon:'🎯',label:'Muốn làm cùng'},{k:'movie',icon:'🍿',label:'Phim muốn xem'},{k:'watch',icon:'🎬',label:'Xem·Đọc·Nghe'},{k:'music',icon:'🎵',label:'Nhạc đôi'},{k:'coupon',icon:'🎟️',label:'Phiếu yêu thương'},{k:'link',icon:'🔗',label:'Link hay'},{k:'price',icon:'🏷️',label:'Săn giá'}]},
  {id:'talk',label:'Chúng mình',items:[{k:'notes',icon:'💌',label:'Nhắn nhau'},{k:'question',icon:'❓',label:'Câu hỏi'},{k:'wishes',icon:'💛',label:'Mong nhau'},{k:'topics',icon:'🗣️',label:'Chủ đề'},{k:'quiz',icon:'💞',label:'Đố vui'},{k:'game',icon:'🎲',label:'Trò chơi'},{k:'checkin',icon:'📝',label:'Check-in tuần'},{k:'guide',icon:'🕊️',label:'Giao tiếp'},{k:'privacy',icon:'🔒',label:'Riêng tư'}]},
  {id:'intimacy',label:'Chúng mình · Riêng tư',items:[{k:'ibLog',icon:'📝',label:'Nhật ký'},{k:'ibSig',icon:'😏',label:'Tín hiệu'},{k:'ibWant',icon:'🌟',label:'Muốn thử'},{k:'ibHealth',icon:'💛',label:'Cảm xúc'},{k:'ibGame',icon:'🎲',label:'Chơi'},{k:'ibDate',icon:'📅',label:'Hẹn hò'},{k:'ibKnow',icon:'📖',label:'Kiến thức'},{k:'ibLock',icon:'🔒',label:'Riêng tư'}]},
  {id:'health',label:'Cá nhân · Sức khỏe',items:[{k:'health',icon:'🩺',label:'Bệnh nền'},{k:'period',icon:'🌸',label:'Chu kỳ'}]},
  {id:'comm',label:'Cẩm nang giao tiếp',items:[{k:'principles',icon:'🕊️',label:'Nguyên tắc'},{k:'say',icon:'💬',label:'Nói khéo'},{k:'love',icon:'💖',label:'NN yêu thương'},{k:'fight',icon:'⚖️',label:'Cãi lành mạnh'},{k:'connect',icon:'🔗',label:'Câu hỏi kết nối'}]},
];
function LongSectionsControl({flash}){
  const setAll=(open)=>{ try{ Object.keys(localStorage).forEach(k=>{ if(k.indexOf('ju.col.')===0) localStorage.removeItem(k); }); }catch(_){}; store.set('ju.colDefault',open?1:0); flash&&flash(open?'Đã mở tất cả mục dài ✓':'Đã thu gọn tất cả mục dài ✓'); };
  return (
    <div className="card">
      <div className="row"><span className="hc-title">📂 Mục dài (gập/mở)</span></div>
      <div className="muted" style={{fontSize:12.5,margin:'4px 0 8px'}}>Mở hoặc thu gọn tất cả các mục dài trong app cùng lúc.</div>
      <div className="row" style={{gap:8}}>
        <button className="btn soft grow" onClick={()=>setAll(true)}>▾ Mở tất cả</button>
        <button className="btn soft grow" onClick={()=>setAll(false)}>▸ Thu gọn tất cả</button>
      </div>
    </div>
  );
}
function DefaultTabSettings({setup,setSetup}){
  const cur=setup.defaultTab||'home';
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🚪 Trang mở mặc định</span></div>
      <div className="muted" style={{fontSize:12.5,margin:'4px 0 8px'}}>Chọn tab hiện ra ngay khi mở app, thay vì luôn về Tổ ấm.</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {MAIN_TABS.map(([k,ic,l])=>(
          <button key={k} className="pill" style={cur===k?{background:'var(--good)',color:'#fff'}:{}} onClick={()=>setSetup({...setup,defaultTab:k})}>{ic} {l}</button>
        ))}
      </div>
    </div>
  );
}
function MenuReorderSettings(){
  const [pick,setPick]=useState(null);
  return (
    <div className="card">
      <div className="row"><span className="hc-title">🔀 Sắp xếp menu</span></div>
      <div className="muted" style={{fontSize:12.5,margin:'4px 0 8px'}}>Chọn một menu để đổi thứ tự các mục bên trong.</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {MENU_REGISTRY.map(m=><button key={m.id} className="pill" onClick={()=>setPick(m)}>{m.label}</button>)}
      </div>
      {pick && <Sheet title={'↕︎ '+pick.label} onClose={()=>setPick(null)}><ReorderSheet items={pick.items} menuId={pick.id} onClose={()=>setPick(null)}/></Sheet>}
    </div>
  );
}
/* ============ Hạn dùng (đồ ăn, thuốc…) ============ */
const STASH_CATS=[{k:'seasonal',icon:'🧥',label:'Đồ trái mùa'},{k:'store',icon:'📦',label:'Đồ cất kho'},{k:'kitchen',icon:'🍳',label:'Đồ bếp'},{k:'other',icon:'🔖',label:'Đồ khác'}];
function StashItems({people,me}){
  const [items,setItems]=useLocal('ju.stash',[]);
  const [f,setF]=useState({name:'',cat:'seasonal',place:'',note:'',link:'',photo:null});
  const [q,setQ]=useState(''); const [cat,setCat]=useState('all'); const [view,setView]=useState(null);
  const add=()=>{ if(!f.name.trim()||!f.place.trim()) return; setItems(prev=>[{id:uid(),name:f.name.trim(),cat:f.cat,place:f.place.trim(),note:f.note.trim(),link:(f.link||'').trim(),photo:f.photo||null,by:me,createdAt:Date.now()},...prev]); setF({name:'',cat:f.cat,place:'',note:'',link:'',photo:null}); celebrate(['📦']); };
  const del=(id)=>{ if(confirm('Xoá món này?')) setItems(prev=>prev.filter(x=>x.id!==id)); };
  const catOf=(k)=>STASH_CATS.find(x=>x.k===k)||STASH_CATS[STASH_CATS.length-1];
  const ql=q.trim().toLowerCase();
  const shown=items.filter(x=>(cat==='all'||x.cat===cat)&&(!ql||(x.name+' '+x.place+' '+(x.note||'')).toLowerCase().includes(ql)));
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>📦 Cất đâu quên đó? Ghi lại vị trí để tìm trong 1 nốt nhạc.</div>
      <div className="card"><input className="inp" placeholder="🔎 Tìm nhanh: gõ tên đồ để biết cất ở đâu…" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div className="card">
        <input className="inp" placeholder="Tên đồ (vd: Áo phao mùa đông, Quạt sưởi)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <select className="inp" style={{marginTop:8,fontSize:12.5}} value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}>{STASH_CATS.map(c=><option key={c.k} value={c.k}>{c.icon} {c.label}</option>)}</select>
        <input className="inp" style={{marginTop:8}} placeholder="📍 Cất ở đâu (vd: Thùng 3 gầm giường, nóc tủ)" value={f.place} onChange={e=>setF({...f,place:e.target.value})}/>
        <input className="inp" style={{marginTop:8}} placeholder="Ghi chú (tuỳ chọn)" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/>
        <input className="inp" style={{marginTop:8}} placeholder="🔗 Link Google Photos (tuỳ chọn)" value={f.link} onChange={e=>setF({...f,link:e.target.value})}/>
        <div className="row" style={{gap:8,marginTop:8,alignItems:'center'}}>
          {f.photo ? <div style={{position:'relative'}}><PhotoImg photo={f.photo} style={{width:52,height:52,borderRadius:10,objectFit:'cover'}}/><button className="muted tapmin" aria-label="Xoá" style={{position:'absolute',top:-7,right:-7,background:'var(--card)',border:'1px solid var(--line)',borderRadius:'50%',width:20,height:20,fontSize:11}} onClick={()=>setF({...f,photo:null})}><Ic n="dong" size={15}/></button></div>
            : <div style={{width:52,height:52,borderRadius:10,background:'var(--chip)',display:'grid',placeItems:'center',fontSize:22}}>🖼️</div>}
          <PhotoAddBtn label={f.photo?'Đổi ảnh':'📷 Thêm ảnh'} onAdd={p=>setF(prev=>({...prev,photo:p}))}/>
          <span className="grow"></span>
          <button className="btn sm" onClick={add}>＋ Thêm đồ</button>
        </div>
      </div>
      <div className="filters">{[{k:'all',icon:'📋',label:'Tất cả'},...STASH_CATS].map(c=><button key={c.k} className={cat===c.k?'on':''} onClick={()=>setCat(c.k)}>{c.icon} {c.label}</button>)}</div>
      {shown.length===0 && <div className="empty"><span className="big">📦</span>{ql?'Không tìm thấy đồ khớp.':'Chưa ghi đồ nào. Thêm để khỏi quên chỗ cất.'}</div>}
      {shown.map(x=>{ const c=catOf(x.cat);
        return <div key={x.id} className="item">
          <div className="row" style={{gap:10}}>
            {x.photo && <span style={{flex:'0 0 auto',cursor:'pointer',lineHeight:0}} onClick={()=>setView(x.photo)}><PhotoImg photo={x.photo} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}}/></span>}
            <div className="grow" style={{minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600}}>{c.icon} {x.name}</div>
              <div style={{marginTop:5,display:'flex',gap:6,flexWrap:'wrap'}}>
                <span className="pill" style={{background:'var(--good)',color:'#fff'}}>📍 {x.place}</span>
                <span className="pill">{c.icon} {c.label}</span>
                {x.link && <button className="pill" style={{cursor:'pointer'}} onClick={()=>openUrl(x.link)}>🔗 Google Photos</button>}
              </div>
              {x.note && <div className="muted" style={{fontSize:12.5,marginTop:4}}>{x.note}</div>}
            </div>
            <button className="muted tapmin" aria-label="Xoá" style={{flex:'0 0 auto'}} onClick={()=>del(x.id)}><Ic n="dong" size={15}/></button>
          </div>
        </div>; })}
      <PhotoLightbox photo={view} onClose={()=>setView(null)}/>
    </div>
  );
}
/* ============ Giấy tờ quan trọng (kèm ảnh) ============ */
/* ---------- Mã hoá đầu-cuối cho mục Giấy tờ (AES-256-GCM + PBKDF2-SHA256) ----------
   Khoá chỉ tồn tại trong RAM khi đã nhập mật khẩu. Chưa mở thì cả máy này lẫn máy chủ
   Supabase đều chỉ thấy khối bytes vô nghĩa. `salt` và `check` KHÔNG phải bí mật nên
   đồng bộ được qua ju.docsLock để máy kia mở bằng cùng mật khẩu.
   MẤT MẬT KHẨU = MẤT DỮ LIỆU: không có cửa sau, không ai lấy lại được. */
const DOCS_ITER=210000, DOCS_MAGIC='just-us-docs-v1';
const B64={
  enc(buf){ const b=new Uint8Array(buf); let s=''; for(let i=0;i<b.length;i+=0x8000) s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000)); return btoa(s); },
  dec(str){ const s=atob(str); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; },
};
const DocsCrypto={
  key:null, _subs:[],
  ready(){ return !!(window.crypto&&window.crypto.subtle); },
  hasPass(){ const c=store.get('ju.docsLock',null); return !!(c&&c.salt&&c.check); },
  locked(){ return !this.key; },
  onChange(fn){ this._subs.push(fn); return ()=>{ this._subs=this._subs.filter(f=>f!==fn); }; },
  _emit(){ this._subs.slice().forEach(f=>{ try{ f(); }catch(_){} }); },
  lock(){ this.key=null; this._emit(); },
  async _derive(pass,saltB64,iter){
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:B64.dec(saltB64),iterations:iter||DOCS_ITER,hash:'SHA-256'},
      base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  },
  async encBytes(bytes,key){
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key||this.key,bytes);
    const out=new Uint8Array(12+ct.byteLength); out.set(iv,0); out.set(new Uint8Array(ct),12); return out;
  },
  async decBytes(bytes,key){
    const b=new Uint8Array(bytes);
    return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b.subarray(0,12)},key||this.key,b.subarray(12)));
  },
  async encJSON(obj){ return B64.enc(await this.encBytes(new TextEncoder().encode(JSON.stringify(obj)))); },
  async decJSON(b64,key){ return JSON.parse(new TextDecoder().decode(await this.decBytes(B64.dec(b64),key))); },
  /* Đặt mật khẩu lần đầu */
  async setup(pass){
    const salt=B64.enc(crypto.getRandomValues(new Uint8Array(16)));
    const key=await this._derive(pass,salt,DOCS_ITER);
    const check=B64.enc(await this.encBytes(new TextEncoder().encode(DOCS_MAGIC),key));
    store.set('ju.docsLock',{v:1,salt,iter:DOCS_ITER,check});
    this.key=key; this._emit(); return true;
  },
  /* Mở bằng mật khẩu đã đặt — sai mật khẩu thì decrypt ném lỗi, trả về false */
  async unlock(pass){
    const cfg=store.get('ju.docsLock',null); if(!cfg||!cfg.salt||!cfg.check) return false;
    const key=await this._derive(pass,cfg.salt,cfg.iter||DOCS_ITER);
    try{
      const txt=new TextDecoder().decode(await this.decBytes(B64.dec(cfg.check),key));
      if(txt!==DOCS_MAGIC) return false;
    }catch(_){ return false; }
    this.key=key; this._emit(); return true;
  },
};
/* Ảnh giấy tờ: nén rồi MÃ HOÁ trước khi rời máy. Đã ghép cloud thì đẩy khối bytes đã mã
   hoá lên Storage ({epath}); chưa ghép thì để dataURL trong bản ghi — mà bản ghi thì
   cũng đã được mã hoá cả khối, nên vẫn kín. */
async function docPhotoFromFile(file){
  const src=await compressToDataURL(file,1400,0.72); if(!src) return null;
  if(!DocsCrypto.locked() && typeof Cloud!=='undefined' && Cloud.connected && Cloud.connected()){
    try{
      const enc=await DocsCrypto.encBytes(new TextEncoder().encode(src));
      const path=await Cloud.uploadBlob(new Blob([enc]),'enc','application/octet-stream');
      if(path) return {epath:path};
    }catch(_){}
  }
  return {src};
}
const DOC_CATS=[{k:'cccd',icon:'🪪',label:'CCCD / CMND'},{k:'passport',icon:'🛂',label:'Hộ chiếu'},{k:'khaisinh',icon:'📄',label:'Khai sinh'},{k:'hokhau',icon:'🏠',label:'Hộ khẩu / cư trú'},{k:'sodo',icon:'🏡',label:'Sổ đỏ / nhà đất'},{k:'xe',icon:'🚗',label:'Xe (đăng ký, bằng lái)'},{k:'baohiem',icon:'🩺',label:'Bảo hiểm'},{k:'hocvan',icon:'🎓',label:'Bằng cấp'},{k:'hopdong',icon:'📑',label:'Hợp đồng'},{k:'other',icon:'🗂️',label:'Khác'}];
/* Cổng mật khẩu của mục Giấy tờ: đặt lần đầu, hoặc mở khoá để giải mã */
function DocsLock({count,encCount}){
  const has=DocsCrypto.hasPass();
  const [p1,setP1]=useState(''); const [p2,setP2]=useState('');
  const [busy,setBusy]=useState(false); const [note,setNote]=useState('');
  /* Máy này có dữ liệu đã mã hoá nhưng chưa nhận được ju.docsLock từ máy kia:
     đặt mật khẩu mới ở đây sẽ thay salt → ciphertext cũ thành rác không mở lại được. */
  const orphan=!has&&encCount>0;
  const doSetup=async()=>{
    if(p1.length<8){ setNote('Mật khẩu cần ít nhất 8 ký tự.'); return; }
    if(p1!==p2){ setNote('Hai lần nhập chưa khớp.'); return; }
    if(orphan&&!confirm('Máy này đang có '+encCount+' giấy tờ đã mã hoá bằng mật khẩu đặt ở máy kia.\n\nĐặt mật khẩu MỚI ở đây sẽ làm '+encCount+' giấy tờ đó KHÔNG MỞ LẠI ĐƯỢC BAO GIỜ.\n\nVẫn tiếp tục?')) return;
    setBusy(true); setNote('');
    try{ await DocsCrypto.setup(p1); }catch(e){ setNote('Không đặt được mật khẩu: '+(e&&e.message||e)); }
    setBusy(false);
  };
  const doUnlock=async()=>{
    setBusy(true); setNote('');
    let ok=false; try{ ok=await DocsCrypto.unlock(p1); }catch(_){ ok=false; }
    setBusy(false); if(!ok) setNote('Mật khẩu không đúng.');
  };
  return (
    <div>
      <div className="empty" style={{marginBottom:0}}><span className="big">🔐</span>
        {has?'Mục Giấy tờ đã được mã hoá. Nhập mật khẩu để mở.':'Đặt mật khẩu cho mục Giấy tờ trước khi lưu.'}
      </div>
      <div className="item" style={{margin:'10px 14px'}}>
        {orphan && <div className="muted" style={{fontSize:12.5,lineHeight:1.6,marginBottom:10,color:'#d9534f'}}>
          ⚠️ Máy này đang giữ <b>{encCount} giấy tờ đã mã hoá</b> nhưng chưa nhận được cấu hình mật khẩu từ máy kia.
          Hãy <b>mở app khi có mạng</b> để đồng bộ xong rồi quay lại nhập mật khẩu cũ.
          Đặt mật khẩu mới ở đây sẽ làm mất hẳn {encCount} giấy tờ đó.
        </div>}
        {!has && <div className="muted" style={{fontSize:12.5,lineHeight:1.6,marginBottom:10}}>
          Ảnh và thông tin giấy tờ sẽ được mã hoá <b>AES-256-GCM</b> ngay trên máy, <b>trước khi</b> rời máy.
          Máy chủ chỉ giữ khối bytes vô nghĩa — kể cả người quản trị Supabase cũng không đọc được.<br/>
          <b style={{color:'#d9534f'}}>Mất mật khẩu là mất dữ liệu.</b> Không có cửa sau, không ai lấy lại được cho anh chị.
          Hai người dùng <b>cùng một mật khẩu</b>; nói trực tiếp cho nhau, đừng nhắn qua app.
        </div>}
        <div className="field"><label>{has?'Mật khẩu mục Giấy tờ':'Mật khẩu (ít nhất 8 ký tự)'}</label>
          <input className="inp" type="password" autoFocus value={p1} onChange={e=>setP1(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&has) doUnlock(); }} placeholder="••••••••"/></div>
        {!has && <div className="field"><label>Nhập lại mật khẩu</label>
          <input className="inp" type="password" value={p2} onChange={e=>setP2(e.target.value)} placeholder="••••••••"/></div>}
        {note && <div className="muted" style={{fontSize:12.5,color:'#d9534f',marginBottom:8}}>{note}</div>}
        <button className="btn" disabled={busy} onClick={has?doUnlock:doSetup}>
          {busy?'Đang xử lý…':(has?'🔓 Mở khoá':'🔐 Đặt mật khẩu')}</button>
        {has && count>0 && <div className="muted center" style={{fontSize:11.5,marginTop:8}}>Đang giữ {count} giấy tờ đã mã hoá.</div>}
      </div>
    </div>
  );
}
function DocsVault({people,me}){
  const [items,setItems]=useLocal('ju.docs',[]);
  const [open,setOpen]=useState(false); const [edit,setEdit]=useState(null);
  const [q,setQ]=useState(''); const [cat,setCat]=useState('all'); const [view,setView]=useState(null);
  const [locked,setLocked]=useState(()=>DocsCrypto.locked());
  const [plain,setPlain]=useState(null);
  useEffect(()=>DocsCrypto.onChange(()=>setLocked(DocsCrypto.locked())),[]);
  /* Giải mã ra RAM để hiện & tìm kiếm. Khoá lại là bản rõ mất sạch. */
  useEffect(()=>{
    let on=true;
    if(locked){ setPlain(null); return; }
    (async()=>{
      const out=[];
      for(const x of items){
        if(!x.enc){ out.push(x); continue; }
        try{ const d=await DocsCrypto.decJSON(x.enc); out.push({...d,id:x.id,expiry:x.expiry}); }
        catch(_){ out.push({id:x.id,expiry:x.expiry,name:'⚠️ Không giải mã được',photos:[],_bad:true}); }
      }
      if(on) setPlain(out);
    })();
    return ()=>{ on=false; };
  },[items,locked]);
  /* Chỉ id + expiry để thô — vừa đủ cho mục nhắc hạn ngoài Trang chủ chạy khi đang khoá.
     Mọi thứ còn lại (kể cả LOẠI giấy tờ) đều nằm trong khối mã hoá. */
  const encRec=async(x)=>{ const {id,expiry,...rest}=x; return {id,expiry,enc:await DocsCrypto.encJSON(rest)}; };
  /* Bản ghi cũ còn lưu thô → mã hoá ngay khi vừa mở khoá */
  useEffect(()=>{
    if(locked||!items.some(x=>!x.enc)) return;
    let on=true;
    (async()=>{ const conv=[]; for(const x of items) conv.push(x.enc?x:await encRec(x)); if(on) setItems(conv); })();
    return ()=>{ on=false; };
  },[locked,items]);
  const save=async(d)=>{
    if(!d.name||!d.name.trim())return;
    const base=d.id?d:{...d,id:uid(),by:me,createdAt:Date.now()};
    const rec=await encRec({...base,name:d.name.trim()});
    setItems(prev=>d.id?prev.map(x=>x.id===rec.id?rec:x):[rec,...prev]);
    setOpen(false);setEdit(null); celebrate(['🗂️']);
  };
  const del=(id)=>{
    if(!confirm('Xoá giấy tờ này? (ảnh cũng bị xoá)')) return;
    const rec=(plain||[]).find(x=>x.id===id);
    ((rec&&rec.photos)||[]).forEach(p=>{ const path=p&&(p.epath||p.path); if(path) Cloud.deletePhoto(path); });
    setItems(prev=>prev.filter(x=>x.id!==id));
  };
  const catOf=(k)=>DOC_CATS.find(x=>x.k===k)||DOC_CATS[DOC_CATS.length-1];
  const ql=q.trim().toLowerCase();
  if(!DocsCrypto.ready()) return <div className="empty"><span className="big">🚫</span>Trình duyệt này không có WebCrypto nên không mã hoá được giấy tờ. Hãy mở app bằng Chrome/Safari bản mới qua HTTPS.</div>;
  if(locked) return <DocsLock count={items.length} encCount={items.filter(x=>x.enc).length}/>;
  if(plain===null) return <div className="empty"><span className="big">🔓</span>Đang giải mã…</div>;
  const shown=plain.filter(x=>(cat==='all'||x.cat===cat)&&(!ql||((x.name||'')+' '+(x.number||'')+' '+(x.owner||'')+' '+(x.place||'')).toLowerCase().includes(ql)));
  /* ảnh cũ đã đẩy lên Storage dạng thô trước khi có mã hoá — bytes vẫn nằm đó, phải nói thật */
  const legacy=plain.reduce((n,x)=>n+((x.photos||[]).filter(p=>p&&p.path).length),0);
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>🗂️ Lưu ảnh & thông tin giấy tờ quan trọng — tra cứu nhanh, khỏi lục tung nhà. <span style={{opacity:.85}}>Đã mã hoá đầu-cuối: máy chủ không đọc được.</span></div>
      <div className="row" style={{margin:'0 14px 8px'}}>
        <span className="grow muted" style={{fontSize:11.5}}>🔓 Đang mở — tự khoá lại khi đóng app.</span>
        <button className="btn sm soft" onClick={()=>DocsCrypto.lock()}>🔒 Khoá lại</button>
      </div>
      {legacy>0 && <div className="item" style={{margin:'0 14px 10px',borderColor:'var(--warn)'}}>
        <div className="muted" style={{fontSize:12.5,lineHeight:1.6}}>⚠️ Có <b>{legacy} ảnh cũ</b> đã tải lên từ trước khi bật mã hoá — phần thông tin quanh nó nay đã kín, nhưng <b>bytes ảnh trên máy chủ vẫn ở dạng thô</b>. Muốn kín hẳn thì bấm ✏️ sửa, xoá ảnh đó rồi chụp/chọn lại.</div>
      </div>}
      <div className="row" style={{margin:'0 14px',gap:8}}>
        <input className="inp grow" placeholder="🔎 Tìm: tên, số, của ai…" value={q} onChange={e=>setQ(e.target.value)}/>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button>
      </div>
      <div className="filters">{[{k:'all',icon:'📋',label:'Tất cả'},...DOC_CATS].map(c=><button key={c.k} className={cat===c.k?'on':''} onClick={()=>setCat(c.k)}>{c.icon} {c.label}</button>)}</div>
      {shown.length===0 && <div className="empty"><span className="big">🗂️</span>{ql?'Không tìm thấy giấy tờ khớp.':'Chưa có giấy tờ nào. Bấm ＋ Thêm để lưu (kèm ảnh chụp).'}</div>}
      {shown.map(x=>{ const c=catOf(x.cat); const d=x.expiry?daysFromToday(x.expiry):null;
        return <div key={x.id} className="item">
          <div className="it-top"><h4 style={{fontSize:15}}>{c.icon} {x.name}</h4>
            {d!=null && <span className="pill" style={d<0?{background:'#e25b5b',color:'#fff'}:d<=30?{background:'var(--warn)',color:'#fff'}:null}>{d<0?'hết hạn':d===0?'hết hạn hôm nay':'còn '+d+' ngày'}</span>}</div>
          <div className="row" style={{marginTop:4,gap:6,flexWrap:'wrap'}}>
            <span className="pill">{c.icon} {c.label}</span>
            {x.owner && <span className="pill">👤 {x.owner}</span>}
            {x.number && <span className="pill">#️⃣ {x.number}</span>}
            {x.place && <span className="pill" style={{background:'var(--good)',color:'#fff'}}>📍 {x.place}</span>}
            {x.expiry && <span className="pill">📅 {fmtDateVN(x.expiry)}</span>}
            {x.link && <button className="pill" style={{cursor:'pointer'}} onClick={()=>openUrl(x.link)}>🔗 Google Photos</button>}
          </div>
          {(x.photos||[]).length>0 && <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
            {(x.photos||[]).map((p,i)=><span key={i} style={{cursor:'pointer',lineHeight:0}} onClick={()=>setView(p)}><PhotoImg photo={p} style={{width:78,height:56,borderRadius:8,objectFit:'cover'}}/></span>)}
          </div>}
          {x.note && <div className="muted" style={{fontSize:12.5,marginTop:6}}>{x.note}</div>}
          {x._bad && <div className="muted" style={{fontSize:12,marginTop:6,color:'#d9534f',lineHeight:1.55}}>Bản ghi này mã hoá bằng mật khẩu khác. Không sửa được — sửa & lưu sẽ ghi đè mất bản gốc. Nếu nhớ ra mật khẩu cũ thì 🔒 khoá lại rồi mở bằng mật khẩu đó.</div>}
          <div className="it-meta"><span className="grow"></span>
            {!x._bad && <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(x);setOpen(true);}}><Ic n="sua"/></button>}
            <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(x.id)}><Ic n="xoa"/></button></div>
        </div>; })}
      {open && <DocForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
      <PhotoLightbox photo={view} onClose={()=>setView(null)}/>
    </div>
  );
}
function DocForm({init,onClose,onSave}){
  const [f,setF]=useState(()=>init?{...init,photos:init.photos||[]}:{name:'',cat:'cccd',owner:'',number:'',expiry:'',place:'',note:'',link:'',photos:[]});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const addPhoto=(p)=>setF(prev=>({...prev,photos:[...(prev.photos||[]),p]}));
  const rmPhoto=(i)=>setF(prev=>({...prev,photos:(prev.photos||[]).filter((_,j)=>j!==i)}));
  return <Sheet title={(init?'Sửa ':'Thêm ')+'giấy tờ'} onClose={onClose}>
    <div className="field"><label>Tên giấy tờ</label><input className="inp" autoFocus value={f.name} onChange={e=>set('name',e.target.value)} placeholder="vd: CCCD của Anh"/></div>
    <div className="field"><label>Loại</label><select className="inp" value={f.cat} onChange={e=>set('cat',e.target.value)}>{DOC_CATS.map(c=><option key={c.k} value={c.k}>{c.icon} {c.label}</option>)}</select></div>
    <div className="row" style={{gap:8}}>
      <div className="field grow"><label>Của ai</label><input className="inp" value={f.owner} onChange={e=>set('owner',e.target.value)} placeholder="Anh / Em / Sóc"/></div>
      <div className="field grow"><label>Số hiệu</label><input className="inp" value={f.number} onChange={e=>set('number',e.target.value)} placeholder="(tuỳ chọn)"/></div>
    </div>
    <div className="row" style={{gap:8}}>
      <div className="field grow"><label>Ngày hết hạn</label><input className="inp" type="date" value={f.expiry} onChange={e=>set('expiry',e.target.value)}/></div>
      <div className="field grow"><label>Nơi cất bản gốc</label><input className="inp" value={f.place} onChange={e=>set('place',e.target.value)} placeholder="Két sắt, ngăn kéo…"/></div>
    </div>
    <div className="field"><label>Ảnh chụp giấy tờ (mặt trước / sau…)</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
        {(f.photos||[]).map((p,i)=><div key={i} style={{position:'relative'}}><PhotoImg photo={p} style={{width:66,height:66,borderRadius:8,objectFit:'cover'}}/><button className="muted tapmin" aria-label="Xoá" style={{position:'absolute',top:-7,right:-7,background:'var(--card)',border:'1px solid var(--line)',borderRadius:'50%',width:20,height:20,fontSize:11}} onClick={()=>rmPhoto(i)}><Ic n="dong" size={15}/></button></div>)}
        <PhotoAddBtn size={66} onAdd={addPhoto} make={docPhotoFromFile}/>
      </div>
      <div className="muted" style={{fontSize:11.5,marginTop:6,lineHeight:1.55}}>🔐 Ảnh được mã hoá ngay trên máy trước khi tải lên. Dù vậy vẫn nên cân nhắc: đừng để <b>ảnh giấy tờ + số hiệu + nơi cất bản gốc</b> đủ cả ba trong một mục.</div>
    </div>
    <div className="field"><label>🔗 Link Google Photos (tuỳ chọn — khỏi tải ảnh)</label><input className="inp" value={f.link||''} onChange={e=>set('link',e.target.value)} placeholder="Dán link album/ảnh Google Photos…"/></div>
    <div className="field"><label>Ghi chú</label><textarea className="inp" value={f.note} onChange={e=>set('note',e.target.value)} placeholder="(tuỳ chọn)"/></div>
    <button className="btn" onClick={()=>onSave(f)}>💾 Lưu</button>
  </Sheet>;
}
function UsMenu({group,seg,onPickGroup,onSeg}){
  const map=Object.fromEntries(US_SEGS.map(s=>[s.k,s]));
  const grpDefs=US_GROUPS.map(g=>({k:g.k,icon:g.icon,label:g.label}));
  const groups=orderItems(grpDefs,'us-groups');
  const grp=US_GROUPS.find(g=>g.k===group)||US_GROUPS[0];
  const items=orderItems(grp.items.map(k=>map[k]).filter(Boolean),'us-'+group);
  return (
    <div className="usm4">
      <div className="usm4-groups">
        {groups.map(g=>(
          <button key={g.k} className={'usm4-dot'+(g.k===group?' on':'')} onClick={()=>onPickGroup(g.k)} title={g.label} aria-label={g.label}>{g.icon}</button>
        ))}
      </div>
      <div className="usm4-name">{grp.label}</div>
      <div className="usm4-tabs">
        {items.map(it=>(
          <button key={it.k} className={'usm4-tab'+(seg===it.k?' on':'')} onClick={()=>onSeg(it.k)}>
            <span className="segic">{it.icon}</span><span>{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
/* Riêng tư 🔒 (chuyển từ "Trả bài" của Tụi mình → Chúng mình) */
function IntimacyTab({people,me,flash}){
  const [seg,setSeg]=useState('ibLog');
  return (
    <div>
      <SegGrid value={seg} onChange={setSeg} items={[
        {k:'ibLog',icon:'📝',label:'Nhật ký'},{k:'ibSig',icon:'😏',label:'Tín hiệu'},
        {k:'ibWant',icon:'🌟',label:'Muốn thử'},{k:'ibHealth',icon:'💛',label:'Cảm xúc'},
        {k:'ibGame',icon:'🎲',label:'Chơi'},{k:'ibDate',icon:'📅',label:'Hẹn hò'},
        {k:'ibKnow',icon:'📖',label:'Kiến thức'},{k:'ibLock',icon:'🔒',label:'Riêng tư'},
      ]} menuId="intimacy"/>
      {seg==='ibLog' && <IntimacySection people={people} me={me} flash={flash} view="log"/>}
      {seg==='ibSig' && <IntimacySection people={people} me={me} flash={flash} view="signal"/>}
      {seg==='ibWant' && <IntimacySection people={people} me={me} flash={flash} view="want"/>}
      {seg==='ibHealth' && <IntimacySection people={people} me={me} flash={flash} view="health"/>}
      {seg==='ibGame' && <IntimacySection people={people} me={me} flash={flash} view="games"/>}
      {seg==='ibDate' && <IntimacySection people={people} me={me} flash={flash} view="date"/>}
      {seg==='ibKnow' && <IntimacySection people={people} me={me} flash={flash} view="know"/>}
      {seg==='ibLock' && <IntimacySection people={people} me={me} flash={flash} view="privacy"/>}
    </div>
  );
}
/* Sức khỏe (chuyển từ Tụi mình → Cá nhân): bệnh nền + chu kỳ */
function HealthTab({people,me}){
  const [seg,setSeg]=useState('health');
  return (
    <div>
      <SegGrid value={seg} onChange={setSeg} items={[
        {k:'health',icon:'🩺',label:'Bệnh nền'},{k:'period',icon:'🌸',label:'Chu kỳ'},
      ]} menuId="health"/>
      {seg==='health' && <FamilyHealth people={people} me={me}/>}
      {seg==='period' && <PeriodTracker people={people}/>}
    </div>
  );
}
function UsTab({people,me,flash}){
  /* nhớ nhóm + mục đang mở (riêng từng máy, không đồng bộ) */
  const nav0=store.get('ju.usNav',null)||{};
  const grp0=US_GROUPS.find(g=>g.k===nav0.g)||US_GROUPS[0];
  const [group,setGroup]=useState(grp0.k);
  const [seg,setSeg]=useState(grp0.items.indexOf(nav0.s)>=0?nav0.s:grp0.items[0]);
  const goTo=(gk,sk)=>{ setGroup(gk); setSeg(sk); store.set('ju.usNav',{g:gk,s:sk}); };
  const pickGroup=(gk)=>{ if(gk===group) return; const g=US_GROUPS.find(x=>x.k===gk)||US_GROUPS[0]; goTo(gk,g.items[0]); };
  const pickSeg=(sk)=>goTo(group,sk);
  return (
    <div>
      <UsMenu group={group} seg={seg} onPickGroup={pickGroup} onSeg={pickSeg}/>
      {seg==='routine' && <RoutineTab people={people} me={me}/>}
      {seg==='family' && <FamilyTree people={people} me={me} flash={flash}/>}
      {seg==='projects' && <FamilyProjects people={people} me={me}/>}
      {seg==='events' && <Events people={people} me={me}/>}
      {seg==='dates' && <ImportantDates people={people} me={me}/>}
      {seg==='timeline' && <Timeline people={people} me={me}/>}
      {seg==='onthisday' && <OnThisDayTab people={people}/>}
      {seg==='fund' && <Fund people={people} me={me}/>}
      {seg==='todos' && <FamilyTodos people={people} me={me}/>}
      {seg==='goals' && <Goals people={people} me={me}/>}
      {seg==='budget' && <VinhaBudgets/>}
      {seg==='moneylover' && <MoneyLover/>}
      {seg==='chores' && <Chores people={people} me={me}/>}
      {seg==='rules' && <FamilyRules people={people} me={me}/>}
      {seg==='stash' && <StashItems people={people} me={me}/>}
      {seg==='docs' && <DocsVault people={people} me={me}/>}
    </div>
  );
}

function icsDownload(title,dateISO,note){
  if(!dateISO) return;
  const dt=dateISO.replace(/-/g,'');
  const esc=(s)=>String(s||'').replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//JustUs//VI','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:'+dt+Math.random().toString(36).slice(2)+'@justus','DTSTART;VALUE=DATE:'+dt,'SUMMARY:'+esc(title),
    note?'DESCRIPTION:'+esc(note):'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=(title||'su-kien').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.ics'; a.click();
}
function MiniCalendar(){
  const setup=store.get('ju.setup',{})||{};
  const [events]=useLocal('ju.events',[]);
  const [dates]=useLocal('ju.dates',[]);
  const now=new Date();
  const [ym,setYm]=useState({y:now.getFullYear(),m:now.getMonth()});
  const [sel,setSel]=useState(null);
  const marks={}; const addMark=(day,t,kind)=>{ (marks[day]=marks[day]||[]).push({t,kind}); };
  events.forEach(e=>{ if(!e.date)return; const [y,m,d]=e.date.split('-').map(Number); if(y===ym.y&&m-1===ym.m) addMark(d,e.title,'📅'); });
  dates.forEach(e=>{
    if(e.lunar&&e.lunarDay&&e.lunarMonth){ const r=lunar2Solar(e.lunarDay,e.lunarMonth,ym.y,0,7); if(r&&r[2]&&r[1]-1===ym.m) addMark(r[0],e.title,e.icon||'🕯️'); return; }
    if(!e.date)return; const p=e.date.split('-').map(Number); if(p[1]-1===ym.m) addMark(p[2],e.title,e.icon||'🎂'); });
  [['loveDate','Kỷ niệm ngày yêu'],['weddingDate','Kỷ niệm ngày cưới']].forEach(([k,label])=>{ if(setup[k]){ const p=setup[k].split('-').map(Number); if(p[1]-1===ym.m) addMark(p[2],label,'💞'); } });
  holidaysForYear(ym.y).forEach(h=>{ const p=h.date.split('-').map(Number); if(p[1]-1===ym.m) addMark(p[2],h.name,h.icon); });
  const startDow=(new Date(ym.y,ym.m,1).getDay()+6)%7;
  const daysIn=new Date(ym.y,ym.m+1,0).getDate();
  const cells=[]; for(let i=0;i<startDow;i++) cells.push(null); for(let d=1;d<=daysIn;d++) cells.push(d);
  const isToday=(d)=> ym.y===now.getFullYear()&&ym.m===now.getMonth()&&d===now.getDate();
  const moveM=(x)=>{ let m=ym.m+x,y=ym.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} setYm({y,m}); setSel(null); };
  const MN=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  return (
    <div className="card">
      <div className="row"><button className="iconbtn" onClick={()=>moveM(-1)}>‹</button>
        <b className="grow" style={{textAlign:'center'}}>{MN[ym.m]} {ym.y}</b>
        <button className="iconbtn" onClick={()=>moveM(1)}>›</button></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginTop:8,textAlign:'center'}}>
        {['T2','T3','T4','T5','T6','T7','CN'].map(w=><div key={w} className="muted" style={{fontSize:10,fontWeight:700}}>{w}</div>)}
        {cells.map((d,i)=>(
          <div key={i} onClick={()=>d&&setSel(sel===d?null:d)} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            borderRadius:8,cursor:d?'pointer':'default',
            background:d&&isToday(d)?'var(--primary)':(sel===d?'var(--chip)':'transparent'),
            color:d&&isToday(d)?'var(--on-primary)':'var(--text)',fontSize:12.5}}>
            {d||''}
            {d&&marks[d] && <div style={{display:'flex',gap:1,marginTop:1}}>{marks[d].slice(0,3).map((x,j)=><span key={j} style={{width:4,height:4,borderRadius:'50%',background:isToday(d)?'#fff':'var(--primary)'}}></span>)}</div>}
          </div>
        ))}
      </div>
      {sel && (marks[sel]
        ? <div style={{marginTop:8}}>{marks[sel].map((x,i)=><div key={i} className="row" style={{fontSize:12.5,padding:'3px 0'}}><span>{x.kind}</span><span className="grow" style={{marginLeft:6}}>{x.t}</span></div>)}</div>
        : <div className="muted center" style={{fontSize:12.5,marginTop:8}}>Ngày {sel} chưa có gì.</div>)}
    </div>
  );
}
function Events({people,me}){
  const [events,setEvents]=useLocal('ju.events',[]);
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [showCal,setShowCal]=useState(false);

  const save=(e)=>{
    if(e.id) setEvents(prev=>prev.map(x=>x.id===e.id?e:x));
    else setEvents(prev=>[{...e,id:uid(),by:me,todos:[],createdAt:Date.now()},...prev]);
    setOpen(false);setEdit(null);
  };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setEvents(prev=>prev.filter(x=>x.id!==id)); } };
  const addTodo=(id,text)=> setEvents(prev=>prev.map(e=>e.id===id?{...e,todos:[...(e.todos||[]),{id:uid(),text,done:false}]}:e));
  const toggleTodo=(id,tid)=> setEvents(prev=>prev.map(e=>e.id===id?{...e,todos:e.todos.map(t=>t.id===tid?{...t,done:!t.done}:t)}:e));
  const delTodo=(id,tid)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setEvents(prev=>prev.map(e=>e.id===id?{...e,todos:e.todos.filter(t=>t.id!==tid)}:e)); } };

  // Tết: tự gợi ý tạo kế hoạch khi còn ≤30 ngày (ẩn lúc khác)
  const tetISO=nextTetISO(); const tetD=tetISO?daysFromToday(tetISO):null; const tetYr=tetISO?tetISO.slice(0,4):'';
  const hasTet=events.some(e=>e.tet&&e.tetYear===tetYr);
  const makeTet=()=>{ setEvents(prev=>[{id:uid(),title:'🧧 Chuẩn bị Tết '+tetYr,date:tetISO,note:'Tết Nguyên Đán — việc cần làm trước Tết',by:me,tet:true,tetYear:tetYr,
    todos:(PROJ_TASK_SUGGEST.tet||[]).map(t=>({id:uid(),text:t,done:false})),createdAt:Date.now()},...prev]); celebrate(['🧧','🎉','✨']); };

  // #6 Tự động nhắc: SN gia đình nhỏ (≤7 ngày) + Mùng 1/Rằm (≤2 ngày)
  const [dates]=useLocal('ju.dates',[]);
  const hasAuto=(mk)=>events.some(e=>e.auto===mk);
  const autoBdays=dates.filter(x=>sideOf(x)==='gia_dinh_nho'&&kindOf(x)==='birthday').map(x=>({x,d:dnext(x)})).filter(o=>o.d!=null&&o.d>=0&&o.d<=7).sort((a,b)=>a.d-b.d);
  const autoRam=(()=>{ try{ return upcomingSpiritual(2).filter(h=>/Mùng 1|Rằm/i.test(h.name)); }catch(e){ return []; } })();
  const bdayMk=(o)=>'bday-'+o.x.id+'-'+todayISO().slice(0,4);
  const makeBday=(o)=>{ const mk=bdayMk(o); if(hasAuto(mk)) return; setEvents(p=>[{id:uid(),title:'🎂 Sinh nhật '+o.x.title,date:dnextDate(o.x),note:'Chuẩn bị quà & đặt nhà hàng',by:me,auto:mk,
    todos:['Mua quà','Đặt bàn nhà hàng','Đặt bánh sinh nhật'].map(t=>({id:uid(),text:t,done:false})),createdAt:Date.now()},...p]); celebrate(['🎂','🎁']); };
  const makeRam=(h)=>{ const mk='ram-'+h.date; if(hasAuto(mk)) return; setEvents(p=>[{id:uid(),title:h.icon+' '+h.name+' — sắm đồ thắp hương',date:h.date,note:'Dậy sớm mua hoa quả, vàng hương',by:me,auto:mk,
    todos:['Mua hoa tươi','Mua hoa quả','Mua vàng / hương','Bày mâm thắp hương sáng sớm'].map(t=>({id:uid(),text:t,done:false})),createdAt:Date.now()},...p]); celebrate(['🌸']); };
  const giftHols=upcomingGiftHolidays(30);
  const ghTodos=(h)=> h.who==='both'?['Mua hoa','Chọn quà cho nhau','Đặt bàn ăn / hẹn hò']:['Mua hoa','Chọn quà','Đặt bàn nhà hàng'];
  const makeGiftHol=(h)=>{ const mk='gh-'+h.name+'-'+h.date.slice(0,4); if(hasAuto(mk)) return; setEvents(p=>[{id:uid(),title:h.icon+' '+h.name,date:h.date,note:h.note,by:me,auto:mk,
    todos:ghTodos(h).map(t=>({id:uid(),text:t,done:false})),createdAt:Date.now()},...p]); celebrate(['🌹','🎁']); };

  const shown=events.slice().sort((a,b)=>(a.date||'9').localeCompare(b.date||'9'));
  return (
    <div>
      <div className="row" style={{margin:'10px 14px',gap:6}}><span className="grow muted" style={{fontSize:12.5}}>Sự kiện chung cần chuẩn bị</span>
        <button className={'btn sm '+(showCal?'':'soft')} onClick={()=>setShowCal(v=>!v)}>🗓️ Lịch</button>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button></div>
      {tetD!=null && tetD>=0 && tetD<=30 && !hasTet && <div className="card" style={{borderLeft:'4px solid var(--primary)',background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
        <div className="row" style={{gap:8}}><span style={{fontSize:22}}>🧧</span>
          <span className="grow" style={{fontSize:14}}>Còn <b>{tetD} ngày</b> đến Tết {tetYr}! Tạo ngay danh sách việc chuẩn bị nhé.</span></div>
        <button className="btn" style={{marginTop:8}} onClick={makeTet}>🧧 Tạo kế hoạch chuẩn bị Tết</button>
      </div>}
      {autoBdays.map(o=>{ const made=hasAuto(bdayMk(o));
        return <div key={o.x.id} className="card" style={{borderLeft:'4px solid var(--primary)'}}>
          <div className="row" style={{gap:8}}><span style={{fontSize:20}}>🎂</span>
            <span className="grow" style={{fontSize:14}}>{o.d===0?'Hôm nay':o.d===1?'Ngày mai':'Còn '+o.d+' ngày'} sinh nhật <b>{o.x.title}</b> — chuẩn bị quà & đặt nhà hàng nhé!</span></div>
          {made? <div className="muted" style={{fontSize:12.5,marginTop:6}}>✓ Đã thêm việc chuẩn bị vào danh sách bên dưới.</div>
               : <button className="btn" style={{marginTop:8}} onClick={()=>makeBday(o)}>🎁 Tạo việc chuẩn bị</button>}
        </div>; })}
      {autoRam.map(h=>{ const made=hasAuto('ram-'+h.date);
        return <div key={h.date} className="card" style={{borderLeft:'4px solid var(--gold,#caa24a)'}}>
          <div className="row" style={{gap:8}}><span style={{fontSize:20}}>{h.icon}</span>
            <span className="grow" style={{fontSize:14}}>{h.d===0?'Hôm nay':h.d===1?'Ngày mai':'Còn '+h.d+' ngày'} là <b>{h.name}</b> — dậy sớm mua đồ thắp hương.</span></div>
          {made? <div className="muted" style={{fontSize:12.5,marginTop:6}}>✓ Đã thêm việc sắm lễ bên dưới.</div>
               : <button className="btn" style={{marginTop:8}} onClick={()=>makeRam(h)}>🛒 Tạo việc sắm lễ</button>}
        </div>; })}
      {giftHols.map(h=>{ const made=hasAuto('gh-'+h.name+'-'+h.date.slice(0,4));
        return <div key={h.name} className="card" style={{borderLeft:'4px solid var(--primary)',background:'linear-gradient(135deg,var(--chip),var(--card))'}}>
          <div className="row" style={{gap:8}}><span style={{fontSize:20}}>{h.icon}</span>
            <span className="grow" style={{fontSize:14}}>{h.d===0?'Hôm nay':h.d===1?'Ngày mai':'Còn '+h.d+' ngày'} là <b>{h.name}</b> — {h.note}.{h.who==='h2w'?' 💑 (chồng → vợ)':h.who==='w2h'?' 💑 (vợ → chồng)':''}</span></div>
          {made? <div className="muted" style={{fontSize:12.5,marginTop:6}}>✓ Đã thêm việc chuẩn bị bên dưới.</div>
               : <button className="btn" style={{marginTop:8}} onClick={()=>makeGiftHol(h)}>🎁 Tạo việc mua hoa & quà</button>}
        </div>; })}
      {showCal && <MiniCalendar/>}
      {shown.length===0 && <div className="empty"><span className="big">📅</span>Sinh nhật, du lịch, kỷ niệm… kèm checklist chuẩn bị.</div>}
      {shown.map(e=>{
        const d=daysFromToday(e.date);
        const done=(e.todos||[]).filter(t=>t.done).length, total=(e.todos||[]).length;
        return (
          <div key={e.id} className="item">
            <div className="it-top">
              <h4>{e.title}</h4>
              {d!=null && <span className="pill">{d<0?'đã qua':d===0?'Hôm nay!':d===1?'Ngày mai':'còn '+d+' ngày'}</span>}
            </div>
            <div className="muted" style={{fontSize:12.5,marginTop:3}}>{e.date?fmtDateVN(e.date):'chưa đặt ngày'} · thêm bởi {people[e.by]?.name}</div>
            {e.note && <div className="it-note">{e.note}</div>}
            {total>0 && <div className="prog"><i style={{width:(done/total*100)+'%'}}></i></div>}
            <div style={{marginTop:8}}>
              {(e.todos||[]).map(t=>(
                <div key={t.id} className="row" style={{padding:'3px 0'}}>
                  <button onClick={()=>toggleTodo(e.id,t.id)} aria-label="Đánh dấu xong" className="tapmin">{<Ic n={t.done?'dadanh':'chuadanh'} size={15}/>}</button>
                  <span className={'grow'+(t.done?' dim':'')} style={{fontSize:14,textDecoration:t.done?'line-through':'none'}}>{t.text}</span>
                  <button className="muted tapmin" aria-label="Xoá" onClick={()=>delTodo(e.id,t.id)}><Ic n="dong" size={15}/></button>
                </div>
              ))}
              <TodoAdd onAdd={(t)=>addTodo(e.id,t)}/>
            </div>
            <div className="it-meta">
              <span className="grow"></span>
              {e.date && <button className="pill" onClick={()=>icsDownload(e.title,e.date,e.note)}>📆 Thêm vào lịch</button>}
              <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(e);setOpen(true);}}><Ic n="sua"/></button>
              <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(e.id)}><Ic n="xoa"/></button>
            </div>
          </div>
        );
      })}
      {open && <EventForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
    </div>
  );
}
function TodoAdd({onAdd,placeholder,icon}){
  const [t,setT]=useState('');
  return (
    <div className="row" style={{marginTop:6,gap:6}}>
      <input className="inp grow" placeholder={placeholder||"+ việc cần chuẩn bị…"} value={t}
        onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&t.trim()){onAdd(t.trim());setT('');} }}/>
      <button className="iconbtn" onClick={()=>{ if(t.trim()){onAdd(t.trim());setT('');} }}>{icon||'＋'}</button>
    </div>
  );
}
function EventForm({init,onClose,onSave}){
  const [f,setF]=useState(()=>init?{...init}:{title:'',date:'',note:'',remind:3});
  return (
    <Sheet title={(init?'Sửa ':'Thêm ')+'sự kiện'} onClose={onClose}>
      <div className="field"><label>Tên sự kiện</label>
        <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Sinh nhật Em"/></div>
      <div className="field"><label>Ngày</label>
        <input className="inp" type="date" value={f.date||''} onChange={e=>setF({...f,date:e.target.value})}/></div>
      <div className="field"><label>Nhắc trước (ngày)</label>
        <input className="inp" type="number" value={f.remind!=null?f.remind:3} onChange={e=>setF({...f,remind:Number(e.target.value)})}/></div>
      <div className="field"><label>Ghi chú</label>
        <textarea className="inp" value={f.note||''} onChange={e=>setF({...f,note:e.target.value})}/></div>
      <button className="btn" onClick={()=>{ if(f.title.trim()) onSave(f); }}>💾 Lưu</button>
    </Sheet>
  );
}

const DATE_KINDS=[{k:'birthday',label:'Sinh nhật',icon:'🎂'},{k:'death',label:'Ngày giỗ',icon:'🕯️'}];
const DATE_SIDES=[
  {k:'gia_dinh_nho',label:'Gia đình nhỏ',icon:'👨‍👩‍👧'},
  {k:'noi_chong',label:'Nội chồng',icon:'👨'},
  {k:'ngoai_chong',label:'Ngoại chồng',icon:'🧓'},
  {k:'noi_vo',label:'Nội vợ',icon:'👩'},
  {k:'ngoai_vo',label:'Ngoại vợ',icon:'👵'},
  {k:'khac',label:'Khác',icon:'👥'},
];
const kindOf=(d)=> (d&&d.kind) || (d&&d.lunar?'death':'birthday');
const sideOf=(d)=> (d&&d.side) || 'khac';
const sideLabel=(k)=>(DATE_SIDES.find(s=>s.k===k)||{}).label||'';
const sideIcon=(k)=>(DATE_SIDES.find(s=>s.k===k)||{}).icon||'';
function parseSide(line){ const s=line.toLowerCase();
  if(s.includes('ngoại chồng')||s.includes('ngoai chong')) return 'ngoai_chong';
  if(s.includes('nội chồng')||s.includes('noi chong')) return 'noi_chong';
  if(s.includes('ngoại vợ')||s.includes('ngoai vo')) return 'ngoai_vo';
  if(s.includes('nội vợ')||s.includes('noi vo')) return 'noi_vo';
  return null;
}
const GIFT_BANDS=[
  {k:'child',label:'Trẻ em (0–12)',max:12},
  {k:'teen',label:'Thiếu niên (13–19)',max:19},
  {k:'young',label:'Thanh niên (20–35)',max:35},
  {k:'mid',label:'Trung niên (36–55)',max:55},
  {k:'senior',label:'Lớn tuổi (56+)',max:200},
];
const bandOf=(age)=>{ const a=Number(age)||0; return (GIFT_BANDS.find(b=>a<=b.max)||GIFT_BANDS[2]).k; };
const GIFT_IDEAS={
  child:{chung:['Bộ lắp ráp LEGO','Sách tô màu + bút màu','Balo/đồ dùng học tập ngộ nghĩnh','Xe đạp/xe chòi chân','Bộ đồ chơi xếp hình','Truyện tranh thiếu nhi','Bộ thí nghiệm khoa học mini'],nam:['Ô tô/robot điều khiển','Bộ xếp hình kỹ thuật','Bộ đồ siêu nhân'],nu:['Búp bê + phụ kiện','Bộ đồ chơi nấu ăn','Phụ kiện cài tóc dễ thương']},
  teen:{chung:['Tai nghe bluetooth','Sổ tay + bút đẹp','Sách hay đang hot','Voucher hiệu sách','Đèn học chống cận','Balo thời trang','Bình giữ nhiệt'],nam:['Giày sneaker','Phụ kiện chơi game','Đồ thể thao (bóng, vợt)'],nu:['Son dưỡng/mỹ phẩm nhẹ','Phụ kiện tóc/túi nhỏ','Nhật ký có khoá']},
  young:{chung:['Nước hoa','Loa bluetooth','Sách người ấy thích','Voucher cafe/nhà hàng','Cây cảnh để bàn','Đồng hồ thời trang','Vé xem phim/concert','Album ảnh in kỷ niệm hai đứa','Voucher trải nghiệm (lớp học, spa)','Đèn ngủ/đèn trang trí để bàn'],nam:['Ví/thắt lưng da','Máy cạo râu','Phụ kiện công nghệ (sạc, chuột)','Đồ thể thao/gym'],nu:['Set skincare/mỹ phẩm','Trang sức (dây chuyền, khuyên)','Túi xách','Máy uốn/duỗi tóc']},
  mid:{chung:['Máy massage cầm tay','Trà/cà phê ngon biếu','Sách hay','Đồ gia dụng tiện ích','Set chăm sóc sức khoẻ','Chậu cây/lan để bàn','Máy lọc không khí mini','Bộ ấm chén trà đẹp','Voucher khám sức khoẻ tổng quát'],nam:['Áo sơ mi/áo polo','Ví da cao cấp','Bộ ấm trà/rượu ngon','Phụ kiện golf'],nu:['Skincare cao cấp','Khăn lụa','Trang sức','Máy xông tinh dầu']},
  senior:{chung:['Máy đo huyết áp','Máy massage chân/cổ vai','Yến/đông trùng bồi bổ','Chăn/đệm ấm','Đèn ngủ dịu mắt','Giỏ trái cây/quà sức khoẻ'],nam:['Trà ngon + bộ ấm','Bộ cờ tướng/cờ vua','Áo ấm/khăn len'],nu:['Khăn choàng ấm','Sữa/thực phẩm bổ dưỡng','Máy massage chân']},
};
function giftIdeas(gender,age){ const band=GIFT_IDEAS[bandOf(age)]||GIFT_IDEAS.young;
  const g=gender==='nam'?band.nam:gender==='nu'?band.nu:[]; return [...(g||[]),...band.chung]; }
function ageOf(d){ if(!d) return null; const today=new Date(todayISO()+'T00:00:00'); const cy=today.getFullYear();
  const by=d.birthYear?Number(d.birthYear):((!d.lunar&&d.date&&Number(d.date.slice(0,4))<cy)?Number(d.date.slice(0,4)):null);
  if(!by||by<1900||by>cy) return null;
  let nextOccYear;
  if(d.lunar){ const nd=dnextDate(d); if(!nd) return null; nextOccYear=Number(nd.slice(0,4)); }
  else { const bm=Number(d.date.slice(5,7)), bd=Number(d.date.slice(8,10)); const thisYear=new Date(cy,bm-1,bd);
    if(thisYear.getTime()===today.getTime()) return cy-by; nextOccYear = thisYear>today? cy : cy+1; }
  const a=nextOccYear-by-1; return (a>=0&&a<140)?a:null; }
function DatesCalendar({dates}){
  const now=new Date();
  const [ym,setYm]=useState({y:now.getFullYear(),m:now.getMonth()});
  const [sel,setSel]=useState(null);
  const marks={}; const put=(d,e)=>{ (marks[d]=marks[d]||[]).push(e); };
  dates.forEach(e=>{
    if(e.lunar&&e.lunarDay&&e.lunarMonth){ const r=lunar2Solar(e.lunarDay,e.lunarMonth,ym.y,0,7); if(r&&r[2]&&r[1]-1===ym.m) put(r[0],e); return; }
    if(!e.date) return; const p=e.date.split('-').map(Number); if(p[1]-1===ym.m) put(p[2],e);
  });
  const startDow=(new Date(ym.y,ym.m,1).getDay()+6)%7, daysIn=new Date(ym.y,ym.m+1,0).getDate();
  const cells=[]; for(let i=0;i<startDow;i++) cells.push(null); for(let d=1;d<=daysIn;d++) cells.push(d);
  const isToday=(d)=>ym.y===now.getFullYear()&&ym.m===now.getMonth()&&d===now.getDate();
  const moveM=(x)=>{ let m=ym.m+x,y=ym.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} setYm({y,m}); setSel(null); };
  const MN=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  return (
    <div className="card">
      <div className="row"><button className="iconbtn" onClick={()=>moveM(-1)}>‹</button>
        <b className="grow" style={{textAlign:'center'}}>{MN[ym.m]} {ym.y}</b>
        <button className="iconbtn" onClick={()=>moveM(1)}>›</button></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginTop:8,textAlign:'center'}}>
        {['T2','T3','T4','T5','T6','T7','CN'].map(w=><div key={w} className="muted" style={{fontSize:10,fontWeight:700}}>{w}</div>)}
        {cells.map((d,i)=> d==null? <div key={i}></div> : (
          <div key={i} onClick={()=>marks[d]&&setSel({d,items:marks[d]})}
            style={{padding:'3px 0',borderRadius:8,cursor:marks[d]?'pointer':'default',background:isToday(d)?'var(--chip)':'transparent',border:(sel&&sel.d===d)?'1.5px solid var(--primary)':'1px solid transparent'}}>
            <div style={{fontSize:12.5}}>{d}</div>
            <div style={{fontSize:10,lineHeight:1,height:11,overflow:'hidden'}}>{(marks[d]||[]).slice(0,2).map((e,j)=><span key={j}>{e.icon||'🎂'}</span>)}</div>
          </div>
        ))}
      </div>
      {sel && <div style={{marginTop:8,borderTop:'1px solid var(--line)',paddingTop:8}}>
        <b style={{fontSize:12.5}}>Ngày {sel.d}/{ym.m+1}:</b>
        {sel.items.map((e,i)=><div key={i} style={{fontSize:12.5,padding:'2px 0'}}>{e.icon||'🎂'} {e.title}{e.lunar?` · ${e.lunarDay}/${e.lunarMonth} ÂL`:''}{sideOf(e)!=='khac'?` · ${sideLabel(sideOf(e))}`:''}</div>)}
      </div>}
      <div className="muted center" style={{fontSize:11,marginTop:6}}>Chạm ngày có biểu tượng để xem chi tiết.</div>
    </div>
  );
}
function ImportantDates({people,me}){
  const [calOpen,setCalOpen]=useState(false);
  const [dates,setDates]=useLocal('ju.dates',[]);
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [bulkOpen,setBulkOpen]=useState(false);
  const [bulkText,setBulkText]=useState('');
  const [bulkMsg,setBulkMsg]=useState('');
  const [exportOpen,setExportOpen]=useState(false);
  const [giftFor,setGiftFor]=useState(null);
  const [fKind,setFKind]=useState('all');
  const [fSide,setFSide]=useState('all');
  const save=(d)=>{
    if(d.id) setDates(prev=>prev.map(x=>x.id===d.id?d:x));
    else setDates(prev=>[{...d,id:uid(),by:me,createdAt:Date.now()},...prev]);
    setOpen(false);setEdit(null);
  };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setDates(prev=>prev.filter(x=>x.id!==id)); } };
  const addBulk=()=>{
    const lines=(bulkText||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const parsed=[];
    lines.forEach(line=>{
      const m=line.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})(?:\s*[\/\-.]\s*(\d{2,4}))?/);
      if(!m) return;
      const toks=line.toLowerCase().split(/[\s,;|]+/);
      const isLunar=toks.includes('âm')||toks.includes('âl')||toks.includes('al')||/âm\s*lịch/i.test(line);
      const side=parseSide(line)||'khac';
      const kind=(isLunar || /giỗ|giổ|gio\b/i.test(line))?'death':'birthday';
      const dnum=Math.min(31,Math.max(1,parseInt(m[1],10)));
      const mnum=Math.min(12,Math.max(1,parseInt(m[2],10)));
      const dd=String(dnum).padStart(2,'0'), mm=String(mnum).padStart(2,'0');
      let yy=m[3]?parseInt(m[3],10):2026; if(yy<100) yy+=2000;
      let name=line.replace(m[0],'').replace(/[\s,;|–-]*(âm\s*lịch|âm|âl|al)\s*$/i,'')
        .replace(/(ngoại|nội|ngoai|noi)\s*(chồng|vợ|chong|vo)/ig,'')
        .replace(/^[\s,;\-|–]+|[\s,;\-|–]+$/g,'').trim()||(kind==='death'?'Ngày giỗ':'Sinh nhật');
      if(isLunar) parsed.push({title:name,lunar:true,lunarDay:dnum,lunarMonth:mnum,icon:'🕯️',remind:3,kind,side});
      else parsed.push({title:name,date:yy+'-'+mm+'-'+dd,icon:kind==='death'?'🕯️':'🎂',remind:3,kind,side});
    });
    const key=(t,d)=>(t||'').toLowerCase()+'|'+(d.lunar?('L'+d.lunarDay+'/'+d.lunarMonth):((d.date||'').slice(5)));
    const seen=new Set(dates.map(x=>key(x.title,x)));
    const fresh=parsed.filter(a=>{ const k=key(a.title,a); if(seen.has(k)) return false; seen.add(k); return true; });
    setDates(prev=>{ const co=new Set((prev||[]).map(x=>key(x.title,x))); return [...fresh.filter(a=>!co.has(key(a.title,a))).map(a=>({...a,id:uid(),by:me,createdAt:Date.now()})),...(prev||[])]; });
    setBulkMsg('Đã thêm '+fresh.length+'/'+parsed.length+' ngày'+(parsed.length-fresh.length>0?' ('+(parsed.length-fresh.length)+' đã có sẵn)':'')+'.');
    setBulkText('');
  };
  const matchF=(d)=> (fKind==='all'||kindOf(d)===fKind) && (fSide==='all'||sideOf(d)===fSide);
  const shown=dates.slice().filter(matchF).sort((a,b)=>(dnext(a)??999)-(dnext(b)??999));
  const giftHolidays=GIFT_HOLIDAYS.map(h=>{ const t=new Date(todayISO()+'T00:00:00'); const cy=t.getFullYear(); let dt=new Date(cy,h.m-1,h.d); if(dt<t) dt=new Date(cy+1,h.m-1,h.d); return {...h,dd:Math.round((dt-t)/86400000)}; }).filter(h=>h.dd>=0&&h.dd<=30).sort((a,b)=>a.dd-b.dd);
  const birthdays=dates.filter(d=>kindOf(d)==='birthday');
  const buildBirthdayText=()=>{ const list=birthdays.slice().sort((a,b)=>(dnext(a)??999)-(dnext(b)??999));
    if(!list.length) return 'Chưa có sinh nhật nào.';
    return '🎂 DANH SÁCH SINH NHẬT\n'+list.map(d=>{ const date=d.lunar?`${d.lunarDay}/${d.lunarMonth} âm lịch`:fmtDateVN(d.date);
      const sd=sideOf(d)!=='khac'?` (${sideLabel(sideOf(d))})`:''; return `• ${d.title}: ${date}${sd}`; }).join('\n'); };
  const shareBirthdays=async()=>{ const txt=buildBirthdayText();
    const r=await shareText({title:'Danh sách sinh nhật',text:txt});
    if(r==='copy') alert('Đã copy danh sách — dán vào tin nhắn/ghi chú nhé!');
    else if(r==='loi') alert('Không chia sẻ được — thử lại hoặc copy tay nhé.'); };
  const icsBirthdays=()=>{ const esc=(s)=>String(s||'').replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n'); const ev=[];
    birthdays.forEach(d=>{ const dd=d.lunar?dnextDate(d):d.date; if(!dd) return; const dt=dd.replace(/-/g,'');
      ev.push('BEGIN:VEVENT','UID:'+dt+Math.random().toString(36).slice(2)+'@justus','DTSTART;VALUE=DATE:'+dt,
        ...(d.lunar?[]:['RRULE:FREQ=YEARLY']),'SUMMARY:🎂 '+esc(d.title)+(sideOf(d)!=='khac'?' ('+sideLabel(sideOf(d))+')':'')+(d.lunar?' (âm '+d.lunarDay+'/'+d.lunarMonth+')':''),'END:VEVENT'); });
    if(!ev.length){ alert('Chưa có sinh nhật để xuất.'); return; }
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//JustUs//VI','CALSCALE:GREGORIAN',...ev,'END:VCALENDAR'].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='sinh-nhat.ics'; a.click(); };
  return (
    <div>
      <div className="row" style={{margin:'10px 14px 4px',gap:6}}><span className="grow muted" style={{fontSize:12.5}}>Ngày lặp lại mỗi năm — nhắc trước</span>
        <button className={'btn sm '+(calOpen?'':'soft')} onClick={()=>setCalOpen(v=>!v)}>🗓️ Lịch</button>
        <button className="btn sm soft" onClick={()=>setExportOpen(true)}>📤 Xuất</button>
        <button className="btn sm soft" onClick={()=>{setBulkMsg('');setBulkOpen(true);}}>📋 Nhập</button>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button></div>
      {calOpen && <DatesCalendar dates={dates}/>}
      {giftHolidays.length>0 && <div className="sec-title">🎁 Ngày lễ cần chuẩn bị quà <span className="muted" style={{fontSize:11,fontWeight:400}}>(30 ngày tới)</span></div>}
      {giftHolidays.length>0 && <div className="card" style={{padding:'2px 13px'}}>
        {giftHolidays.map((h,i)=>(
          <div key={i} className="row" style={{padding:'7px 0',borderBottom:i<giftHolidays.length-1?'1px solid var(--line)':'none',gap:8}}>
            <span style={{fontSize:18,flex:'0 0 auto'}}>{h.icon}</span>
            <div className="grow" style={{minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600}}>{h.name}</div>
              <div className="muted" style={{fontSize:11,lineHeight:1.35}}>{h.note}{h.who==='h2w'?' · chồng tặng vợ':h.who==='w2h'?' · vợ tặng chồng':' · tặng nhau'}</div>
            </div>
            <span className="pill" style={{flex:'0 0 auto'}}>{h.dd===0?'Hôm nay!':h.dd===1?'Ngày mai':'còn '+h.dd+' ngày'}</span>
          </div>
        ))}
      </div>}
      <div className="filters">
        <button className={fKind==='all'?'on':''} onClick={()=>setFKind('all')}>Tất cả</button>
        {DATE_KINDS.map(k=><button key={k.k} className={fKind===k.k?'on':''} onClick={()=>setFKind(k.k)}>{k.icon} {k.label}</button>)}
      </div>
      <div className="filters">
        <button className={fSide==='all'?'on':''} onClick={()=>setFSide('all')}>Mọi bên</button>
        {DATE_SIDES.map(s=><button key={s.k} className={fSide===s.k?'on':''} onClick={()=>setFSide(s.k)}>{s.icon} {s.label}</button>)}
      </div>
      {shown.length===0 && <div className="empty"><span className="big">🎂</span>{dates.length?'Không có ngày nào khớp bộ lọc.':'Sinh nhật, kỷ niệm, giỗ chạp 2 bên nội ngoại…'}</div>}
      {shown.map(d=>{
        const dd=dnext(d);
        return (
          <div key={d.id} className="item">
            <div className="it-top">
              <h4>{d.icon||'🎂'} {d.title}{d.lunar?<span className="muted" style={{fontSize:11,fontWeight:400}}> · âm lịch</span>:null}</h4>
              <span className="pill">{dd==null?'—':dd===0?'Hôm nay!':dd===1?'Ngày mai':'còn '+dd+' ngày'}</span>
            </div>
            <div className="row" style={{gap:5,marginTop:3,flexWrap:'wrap'}}>
              <span className="pill" style={{fontSize:11,padding:'2px 7px'}}>{(DATE_KINDS.find(k=>k.k===kindOf(d))||{}).icon} {(DATE_KINDS.find(k=>k.k===kindOf(d))||{}).label}</span>
              {sideOf(d)!=='khac' && <span className="pill" style={{fontSize:11,padding:'2px 7px'}}>{sideIcon(sideOf(d))} {sideLabel(sideOf(d))}</span>}
              {kindOf(d)==='birthday' && ageOf(d)!=null && <span className="pill" style={{fontSize:11,padding:'2px 7px',background:'var(--chip)'}}>🎈 {ageOf(d)} tuổi</span>}
            </div>
            <div className="muted" style={{fontSize:12.5,marginTop:3}}>{d.lunar?`${d.lunarDay}/${d.lunarMonth} âm lịch · dương: ${fmtDateVN(dnextDate(d))}`:`${fmtDateVN(d.date)} hằng năm`}{d.remind?` · nhắc trước ${d.remind} ngày`:''}</div>
            <div className="it-meta">
              {kindOf(d)==='birthday' && <button className="pill" onClick={()=>setGiftFor(d)}>🎁 Gợi ý quà</button>}
              <span className="grow"></span>
              <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(d);setOpen(true);}}><Ic n="sua"/></button>
              <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(d.id)}><Ic n="xoa"/></button></div>
          </div>
        );
      })}
      {open && <DateForm init={edit} onClose={()=>{setOpen(false);setEdit(null);}} onSave={save}/>}
      {bulkOpen && <Sheet title="📋 Nhập nhiều ngày một lúc" onClose={()=>{setBulkOpen(false);setBulkText('');}}>
        <div className="muted" style={{fontSize:12.5,marginBottom:8}}>Mỗi dòng một người. <b>Dương lịch:</b> <i>Mẹ Hương, 20/11</i>. <b>Giỗ (âm lịch):</b> thêm chữ <b>âm</b> — vd <i>Giỗ ông nội, 10/3 âm</i>. Có thể thêm <b>bên</b> (nội/ngoại chồng/vợ) — vd <i>Bố Huy, 5/4, nội chồng</i>. Trùng sẽ tự bỏ qua.</div>
        <div className="field"><textarea className="inp" style={{minHeight:170}} value={bulkText}
          onChange={e=>setBulkText(e.target.value)} placeholder={'Mẹ Hương, 20/11, ngoại vợ\nHuy, 11/01, nội chồng\nGiỗ ông nội, 10/3 âm, nội chồng\nGiỗ bà ngoại, 25/8 âm, ngoại vợ'} autoFocus/></div>
        {bulkMsg && <div className="pill" style={{marginBottom:8}}>{bulkMsg}</div>}
        <button className="btn" onClick={addBulk}>🎂 Thêm vào Ngày nhớ</button>
        <button className="btn soft" style={{marginTop:8}} onClick={()=>{setBulkOpen(false);setBulkText('');}}>Đóng</button>
      </Sheet>}
      {exportOpen && <Sheet title="📤 Xuất danh sách sinh nhật" onClose={()=>setExportOpen(false)}>
        <div className="muted" style={{fontSize:12.5,marginBottom:10}}>Có <b>{birthdays.length}</b> sinh nhật. Tải <b>.ics</b> để nạp vào Lịch điện thoại (tự lặp hằng năm), hoặc copy thành văn bản để gửi.</div>
        <button className="btn" onClick={icsBirthdays}>📆 Tải file lịch (.ics)</button>
        <button className="btn soft" style={{marginTop:8}} onClick={shareBirthdays}>🔗 Copy / chia sẻ văn bản</button>
        <div className="card" style={{marginTop:12,whiteSpace:'pre-wrap',fontSize:12.5,lineHeight:1.6,maxHeight:230,overflow:'auto'}}>{buildBirthdayText()}</div>
        <div className="muted center" style={{fontSize:11,marginTop:8}}>Giỗ âm lịch xuất theo ngày dương của năm nay (không tự lặp chuẩn theo âm lịch).</div>
      </Sheet>}
      {giftFor && (()=>{ const gAge=ageOf(giftFor)!=null?ageOf(giftFor):giftFor.age; return <Sheet title={'🎁 Quà cho '+giftFor.title} onClose={()=>setGiftFor(null)}>
        {(!giftFor.gender||gAge==null||gAge==='') && <div className="muted" style={{fontSize:12.5,marginBottom:8}}>💡 Bấm ✏️ sửa để thêm <b>giới tính</b> & <b>năm sinh</b> cho gợi ý chính xác hơn.</div>}
        <div className="muted" style={{fontSize:12.5,marginBottom:10}}>{giftFor.gender==='nam'?'👨 Nam':giftFor.gender==='nu'?'👩 Nữ':'Chưa rõ giới tính'} · {gAge?('≈ '+gAge+' tuổi'):'chưa rõ tuổi'} · {(GIFT_BANDS.find(b=>b.k===bandOf(gAge))||{}).label}</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {giftIdeas(giftFor.gender,gAge).map((g,i)=>(
            <a key={i} className="pill" style={{padding:'8px 12px',fontSize:12.5,textDecoration:'none'}}
              href={'https://www.google.com/search?tbm=shop&q='+encodeURIComponent(g)} target="_blank" rel="noreferrer">{g} 🔍</a>
          ))}
        </div>
        <div className="muted center" style={{fontSize:11,marginTop:12}}>Chạm món quà để tìm mua trên mạng.</div>
      </Sheet>; })()}
    </div>
  );
}
function DateForm({init,onClose,onSave}){
  const ICONS=['🎂','💍','💗','🌸','🕯️','🎉','👶','📿'];
  const [f,setF]=useState(()=>{ const b=init?{...init}:{title:'',date:'',icon:'🎂',remind:3,lunar:false,lunarDay:1,lunarMonth:1};
    if(!b.kind) b.kind=b.lunar?'death':'birthday'; if(!b.side) b.side='khac'; return b; });
  const valid=f.title.trim() && (f.lunar? (f.lunarDay&&f.lunarMonth) : !!f.date);
  return (
    <Sheet title={(init?'Sửa ':'Thêm ')+'ngày nhớ'} onClose={onClose}>
      <div className="field"><label>Tên ngày</label>
        <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Sinh nhật mẹ / Giỗ ông"/></div>
      <div className="field"><label>Loại ngày</label>
        <div className="row" style={{gap:6}}>
          <button className={'btn sm '+(!f.lunar?'':'soft')} onClick={()=>setF({...f,lunar:false})}>☀️ Dương lịch</button>
          <button className={'btn sm '+(f.lunar?'':'soft')} onClick={()=>setF({...f,lunar:true})}>🌙 Âm lịch (giỗ)</button>
        </div></div>
      {!f.lunar
        ? <div className="field"><label>Ngày (lặp mỗi năm)</label>
            <input className="inp" type="date" value={f.date||''} onChange={e=>setF({...f,date:e.target.value})}/></div>
        : <div className="row" style={{gap:8}}>
            <div className="field grow" style={{margin:0}}><label>Ngày (âm)</label>
              <select className="inp" value={f.lunarDay||1} onChange={e=>setF({...f,lunarDay:Number(e.target.value)})}>{Array.from({length:30},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></div>
            <div className="field grow" style={{margin:0}}><label>Tháng (âm)</label>
              <select className="inp" value={f.lunarMonth||1} onChange={e=>setF({...f,lunarMonth:Number(e.target.value)})}>{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></div>
          </div>}
      <div className="field"><label>Dịp</label>
        <div className="row" style={{gap:6}}>
          {DATE_KINDS.map(k=><button key={k.k} className={'btn sm '+(f.kind===k.k?'':'soft')} onClick={()=>setF({...f,kind:k.k,icon:k.k==='death'?'🕯️':(f.icon==='🕯️'?'🎂':f.icon)})}>{k.icon} {k.label}</button>)}
        </div></div>
      <div className="field"><label>Thuộc bên</label>
        <div className="emoji-row">{DATE_SIDES.map(s=><button key={s.k} className={f.side===s.k?'on':''} onClick={()=>setF({...f,side:s.k})} style={{width:'auto',padding:'8px 11px',fontSize:12.5}}>{s.icon} {s.label}</button>)}</div></div>
      <div className="row" style={{gap:8}}>
        <div className="field grow" style={{margin:0}}><label>Giới tính (gợi ý quà)</label>
          <select className="inp" value={f.gender||''} onChange={e=>setF({...f,gender:e.target.value})}>
            <option value="">— Chọn —</option><option value="nam">Nam</option><option value="nu">Nữ</option></select></div>
        <div className="field grow" style={{margin:0}}><label>Năm sinh (tự tính tuổi)</label>
          <input className="inp" type="number" value={f.birthYear||''} onChange={e=>setF({...f,birthYear:e.target.value})} placeholder="vd 1990"/></div>
      </div>
      <div className="field"><label>Biểu tượng</label>
        <div className="emoji-row">{ICONS.map(i=><button key={i} className={f.icon===i?'on':''} onClick={()=>setF({...f,icon:i})}>{i}</button>)}</div></div>
      <div className="field"><label>Nhắc trước (ngày)</label>
        <input className="inp" type="number" value={f.remind||0} onChange={e=>setF({...f,remind:Number(e.target.value)})}/></div>
      <button className="btn" onClick={()=>{ if(valid) onSave(f); }}>💾 Lưu</button>
    </Sheet>
  );
}

const SAVE_TIPS=[
  'Trích tiết kiệm ngay khi vừa nhận lương, đừng để cuối tháng mới để dành',
  'Đặt quỹ chung cho hai vợ chồng và cùng theo dõi mỗi tháng',
  'Áp dụng "quy tắc 24 giờ": món không thiết yếu thì chờ một ngày rồi mới quyết mua',
  'Đi chợ theo tuần, nấu sẵn và bảo quản để đỡ ăn ngoài lúc bận',
  'Ghi lại mọi khoản chi mỗi ngày',
  'Lập ngân sách theo tháng (quy tắc 50/30/20)',
  'Nấu ăn ở nhà, hạn chế ăn ngoài',
  'Mang theo bình nước & cà phê tự pha',
  'Mua sắm theo danh sách, tránh mua bốc đồng',
  'So sánh giá & săn mã giảm giá trước khi mua',
  'Huỷ các gói đăng ký (app, nhạc, phim) không dùng tới',
  'Đầu tháng tự chuyển ngay một khoản vào tiết kiệm',
  'Quy tắc chờ 24–48h trước khi mua món đắt tiền',
  'Tận dụng/sửa đồ cũ thay vì mua mới',
  'Đi chợ cuối ngày & mua đồ theo mùa cho rẻ',
  'Tắt điện–nước khi không dùng, chọn đồ tiết kiệm điện',
  'Hạn chế trà sữa/cà phê tiệm, để dành tiền vặt',
  'Lên thực đơn tuần, đi chợ một lần để đỡ lãng phí',
  'Mua chung số lượng lớn đồ thiết yếu cho rẻ',
  'Cùng nhau xem lại chi tiêu mỗi cuối tuần',
  'Đặt mục tiêu tiết kiệm có tên gọi rõ ràng (đám cưới, chuyến đi…) để có động lực',
  'Dùng tiền mặt cho khoản dễ vung tay để "thấy" tiền đang tiêu',
  'Tận dụng thẻ tích điểm & hoàn tiền cho chi tiêu thiết yếu',
  'Mỗi tháng để riêng một quỹ nhỏ cho việc bất ngờ (ốm đau, hỏng đồ)',
  'Bán/cho bớt đồ không dùng để vừa gọn nhà vừa thêm tiền',
  'Tự pha đồ uống và mang cơm trưa đi làm vài buổi mỗi tuần','Mỗi tối bỏ tiền lẻ vào hũ tiết kiệm chung','Đặt hạn mức cho mỗi lần đi siêu thị','Nấu phần ăn trưa mang đi thay vì mua ngoài','Tắt nguồn thiết bị thay vì để chờ (standby)','Săn vé / đặt phòng sớm cho chuyến đi để được giá tốt','Ghi mục tiêu tiết kiệm lên tủ lạnh để nhắc nhau','Một tháng có một tuần không chi tiêu ngoài thiết yếu','Bán/cho bớt đồ không dùng để gọn nhà và có thêm tiền','Dùng lại đồ thuỷ tinh, túi vải thay đồ một lần','So sánh giá trên 2-3 ứng dụng trước khi đặt đồ',"Đặt lệnh tự động chuyển tiết kiệm ngay khi có lương","Chờ 24h trước khi mua đồ không thiết yếu","Săn sale mẹ&bé theo đợt, mua sỉ bỉm/sữa khi giá tốt","Tận dụng đồ sơ sinh/đồ chơi cũ, trao đổi với hội bỉm sữa","Nấu theo thực đơn tuần để giảm lãng phí thực phẩm","Mang cơm trưa đi làm 3–4 buổi/tuần","Hủy các gói đăng ký (app, streaming) ít dùng","So sánh giá qua ứng dụng trước khi mua đồ lớn","Dùng ưu đãi ngân hàng/ví điện tử cho hóa đơn điện nước","Đặt hạn mức chi cho ăn ngoài/cà phê mỗi tháng","Bảo dưỡng xe/đồ điện định kỳ để tránh sửa lớn tốn kém","Mua rau theo mùa ở chợ dân sinh","Gom việc di chuyển để tiết kiệm xăng và thời gian","Lập quỹ khẩn cấp 3–6 tháng chi tiêu trước khi đầu tư","Ghi mục tiêu tiết kiệm cụ thể để có động lực",'Rút tiền mặt theo tuần và chỉ tiêu trong hạn mức đó','Nấu một nồi to rồi chia bữa cho cả tuần bận','Trước khi mua đồ mới, tự hỏi ở nhà đã có món tương tự chưa','Đặt lịch nhắc huỷ gói dùng thử trước khi bị tính phí','Chọn quà tự làm hoặc trải nghiệm thay vì đồ đắt tiền'];
const EXPENSE_CATS=[
  {k:'food',icon:'🍜',label:'Ăn uống'},{k:'groc',icon:'🛒',label:'Đi chợ'},{k:'cafe',icon:'☕',label:'Cà phê'},
  {k:'move',icon:'⛽',label:'Đi lại'},{k:'bill',icon:'🧾',label:'Hóa đơn'},{k:'home',icon:'🏠',label:'Nhà cửa'},
  {k:'shop',icon:'🛍️',label:'Mua sắm'},{k:'fun',icon:'🎬',label:'Giải trí'},{k:'health',icon:'💊',label:'Sức khỏe'},
  {k:'edu',icon:'📚',label:'Giáo dục'},{k:'kid',icon:'🧸',label:'Con cái'},{k:'gift',icon:'🎁',label:'Quà tặng'},
  {k:'debt',icon:'💳',label:'Trả nợ'},{k:'other',icon:'📦',label:'Khác'},
];
const EXP_CAT=Object.fromEntries(EXPENSE_CATS.map(c=>[c.k,c]));
const ymOf=(iso)=>(iso||'').slice(0,7);
const thisYM=()=>todayISO().slice(0,7);
function ymShift(ym,delta){ const p=ym.split('-'); const d=new Date(Number(p[0]),Number(p[1])-1+delta,1); return d.getFullYear()+'-'+pad(d.getMonth()+1); }
function ymLabel(ym){ const p=ym.split('-'); return 'Th'+Number(p[1])+'/'+p[0]; }
function daysInYM(ym){ const p=ym.split('-'); return new Date(Number(p[0]),Number(p[1]),0).getDate(); }
function ExpenseTracker({people,me}){
  const [expenses,setExpenses]=useLocal('ju.expenses',[]);
  const [budget,setBudget]=useLocal('ju.budget',{total:0});
  const [ym,setYm]=useState(thisYM());
  const [open,setOpen]=useState(false);
  const [bOpen,setBOpen]=useState(false);
  const add=(e)=>{ setExpenses(prev=>[{id:uid(),...e},...prev]); celebrate(['🧾']); setOpen(false); };
  const del=(id)=>{ if(confirm('Xoá khoản chi này?')) setExpenses(prev=>prev.filter(x=>x.id!==id)); };
  const monthExp=expenses.filter(x=>ymOf(x.date)===ym);
  const total=monthExp.reduce((s,x)=>s+(Number(x.amount)||0),0);
  const byCat={}; monthExp.forEach(x=>{ byCat[x.cat]=(byCat[x.cat]||0)+(Number(x.amount)||0); });
  const catRows=Object.keys(byCat).map(k=>({k,amt:byCat[k]})).sort((a,b)=>b.amt-a.amt);
  const bud=Number(budget.total)||0;
  const pct=bud?Math.round(total/bud*100):0;
  const isThis=ym===thisYM();
  const dim=daysInYM(ym);
  const day=isThis?Number(todayISO().slice(8,10)):dim;
  const daysLeft=Math.max(1,dim-day+1);
  const perDay=bud&&isThis?Math.max(0,Math.round((bud-total)/daysLeft)):0;
  const proj=isThis&&day>0?Math.round(total/day*dim):total;
  return (
    <div>
      <div className="row" style={{margin:'12px 14px 4px'}}>
        <b style={{fontSize:14}}>🧾 Chi tiêu trong tháng</b><span className="grow"></span>
        <button className="iconbtn" onClick={()=>setYm(ymShift(ym,-1))}>‹</button>
        <span className="muted" style={{fontSize:12.5,minWidth:60,textAlign:'center'}}>{ymLabel(ym)}</span>
        <button className="iconbtn" onClick={()=>setYm(ymShift(ym,1))} disabled={ym>=thisYM()} style={ym>=thisYM()?{opacity:.35}:{}}>›</button>
      </div>
      <div className="card" style={{margin:'0 14px'}}>
        <div className="row"><span className="grow muted" style={{fontSize:12.5}}>Tổng chi {ymLabel(ym)}</span>
          <button className="pill" onClick={()=>setBOpen(true)}>{bud?'🎚️ '+VND(bud)+'/tháng':'＋ Đặt ngân sách'}</button></div>
        <div style={{fontSize:24,fontWeight:800,color:'var(--primary)',margin:'2px 0 4px'}}>{VND(total)}</div>
        {bud>0 && <div>
          <div className="prog" style={{background:pct>100?'#f3d5d5':'var(--line)'}}><i style={{width:Math.min(100,pct)+'%',background:pct>100?'#d9534f':(pct>=80?'#e0a341':'var(--primary)')}}></i></div>
          <div className="row" style={{fontSize:12.5,marginTop:5}}>
            <span style={pct>100?{color:'#d9534f',fontWeight:700}:{color:'var(--muted)'}}>{pct}% ngân sách · {pct>100?'vượt '+VND(total-bud):'còn '+VND(bud-total)}</span>
            <span className="grow"></span>
            {isThis && <span className="muted">≈ {VND(perDay)}/ngày</span>}
          </div>
          {isThis && total>0 && <div className="muted" style={{fontSize:11,marginTop:3}}>Đà này dự kiến cả tháng ≈ {VND(proj)}{proj>bud?' — sẽ vượt ngân sách':''}</div>}
        </div>}
      </div>
      {catRows.length>0 && <div className="card" style={{margin:'8px 14px 0',padding:'8px 13px'}}>
        {catRows.map(r=>{ const c=EXP_CAT[r.k]||EXP_CAT.other; const p=total?Math.round(r.amt/total*100):0; return (
          <div key={r.k} style={{padding:'4px 0'}}>
            <div className="row" style={{fontSize:12.5}}><span className="grow">{c.icon} {c.label}</span><b>{VND(r.amt)}</b><span className="muted" style={{fontSize:11,marginLeft:6,minWidth:28,textAlign:'right'}}>{p}%</span></div>
            <div className="prog" style={{height:5,marginTop:2}}><i style={{width:p+'%'}}></i></div>
          </div>
        ); })}
      </div>}
      <div className="row" style={{margin:'10px 14px 4px'}}><span className="grow muted" style={{fontSize:12.5}}>{monthExp.length} khoản chi</span>
        <button className="btn sm" onClick={()=>setOpen(true)}>＋ Ghi khoản chi</button></div>
      {monthExp.length===0 && <div className="empty muted">Chưa ghi khoản chi nào trong {ymLabel(ym)}.</div>}
      {monthExp.slice(0,40).map(x=>{ const c=EXP_CAT[x.cat]||EXP_CAT.other; return (
        <div key={x.id} className="item" style={{padding:'8px 13px'}}>
          <div className="row"><span style={{fontSize:18,marginRight:8}}>{c.icon}</span>
            <span className="grow"><span style={{fontSize:14}}>{c.label}{x.note?' · '+x.note:''}</span>
              <div className="muted" style={{fontSize:11,marginTop:1}}>{fmtDateVN(x.date)}{x.by&&people[x.by]?' · '+people[x.by].name+' trả':''}</div></span>
            <b style={{color:'var(--primary)'}}>{VND(x.amount)}</b>
            <button className="iconbtn" style={{marginLeft:6}} aria-label="Xoá" title="Xoá" onClick={()=>del(x.id)}><Ic n="xoa"/></button></div>
        </div>
      ); })}
      {open && <Sheet title="🧾 Ghi khoản chi" onClose={()=>setOpen(false)}><ExpenseForm people={people} me={me} onSave={add}/></Sheet>}
      {bOpen && <Sheet title="🎚️ Ngân sách mỗi tháng" onClose={()=>setBOpen(false)}><MonthBudgetForm init={budget} onSave={(b)=>{ setBudget(b); setBOpen(false); }}/></Sheet>}
    </div>
  );
}
function ExpenseForm({people,me,onSave}){
  const [amount,setAmount]=useState('');
  const [cat,setCat]=useState('food');
  const [date,setDate]=useState(todayISO());
  const [by,setBy]=useState(me||'a');
  const [note,setNote]=useState('');
  return (<div>
    <div className="field"><label>Số tiền (đ)</label>
      <input className="inp" type="number" autoFocus value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></div>
    <div className="field"><label>Danh mục</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {EXPENSE_CATS.map(c=>(
          <button key={c.k} className="pill" style={cat===c.k?{background:'var(--primary)',color:'#fff'}:{}} onClick={()=>setCat(c.k)}>{c.icon} {c.label}</button>
        ))}
      </div></div>
    <div className="field"><label>Ngày</label>
      <input className="inp" type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></div>
    <div className="field"><label>Ai trả</label>
      <select className="inp" value={by} onChange={e=>setBy(e.target.value)}>
        <option value="a">{people.a.name}</option><option value="b">{people.b.name}</option></select></div>
    <div className="field"><label>Ghi chú (tuỳ chọn)</label>
      <input className="inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="VD: cơm trưa, xăng xe…"/></div>
    <button className="btn" onClick={()=>{ const n=Number(amount); if(n>0) onSave({amount:n,cat,date,by,note:note.trim()}); }}>💾 Lưu</button>
  </div>);
}
function MonthBudgetForm({init,onSave}){
  const [total,setTotal]=useState(init&&init.total?String(init.total):'');
  return (<div>
    <div className="muted" style={{fontSize:12.5,margin:'0 0 10px'}}>Đặt hạn mức chi tiêu mỗi tháng của cả nhà — app sẽ cảnh báo khi sắp/vượt. Để trống nếu không muốn theo dõi ngân sách.</div>
    <div className="field"><label>Ngân sách / tháng (đ)</label>
      <input className="inp" type="number" autoFocus value={total} onChange={e=>setTotal(e.target.value)} placeholder="VD: 15000000"/></div>
    <button className="btn" onClick={()=>onSave({...(init||{}),total:Number(total)||0})}>💾 Lưu</button>
  </div>);
}
const VINHA_CATS={
  c_food:{i:'🍜',n:'Ăn uống'},c_groc:{i:'🛒',n:'Đi chợ'},c_cafe:{i:'☕',n:'Cà phê'},c_move:{i:'⛽',n:'Đi lại'},
  c_bill:{i:'🧾',n:'Hóa đơn'},c_home:{i:'🏠',n:'Nhà cửa'},c_shop:{i:'🛍️',n:'Mua sắm'},c_fun:{i:'🎬',n:'Giải trí'},
  c_health:{i:'💊',n:'Sức khỏe'},c_edu:{i:'📚',n:'Giáo dục'},c_kid:{i:'🧸',n:'Con cái'},c_gift:{i:'🎁',n:'Quà tặng'},
  c_debt:{i:'💳',n:'Trả nợ'},c_other:{i:'📦',n:'Khác'},
  i_salary:{i:'💰',n:'Lương'},i_bonus:{i:'🎉',n:'Thưởng'},i_biz:{i:'🏪',n:'Kinh doanh'},i_invest:{i:'📈',n:'Đầu tư'},
  i_rent:{i:'🏘️',n:'Cho thuê'},i_collect:{i:'🤝',n:'Thu nợ'},i_other:{i:'✨',n:'Khác'},
};
function catsArrToMap(arr){ const m={}; (Array.isArray(arr)?arr:[]).forEach(x=>{ if(x&&x.id) m[x.id]={i:x.icon||'📦',n:x.name||'Khác'}; }); return m; }
function readVinhaLocal(){
  try{ const raw=localStorage.getItem('vn.tx'); if(!raw) return null; const tx=JSON.parse(raw); if(!Array.isArray(tx)) return null;
    let cats={}; try{ cats=catsArrToMap(JSON.parse(localStorage.getItem('vn.cats')||'[]')); }catch(e){}
    let wallets=[]; try{ wallets=JSON.parse(localStorage.getItem('vn.wallets')||'[]'); }catch(e){}
    let budgets=[]; try{ budgets=JSON.parse(localStorage.getItem('vn.budgets')||'[]'); }catch(e){}
    return {tx,cats,wallets,budgets};
  }catch(e){ return null; }
}
// Chỉ lấy chi tiêu CHUNG của gia đình (m_gd) + của Sóc (m_soc); BỎ ví cá nhân (m_cn / w_cn)
function vinhaIsPersonal(wid,wmap){ const mem=wmap[wid]; return mem? mem==='m_cn' : wid==='w_cn'; }
function normVinha(tx,cats,wallets){
  const catMap=Object.assign({},VINHA_CATS,cats||{});
  const wmap={}; (Array.isArray(wallets)?wallets:[]).forEach(w=>{ if(w&&w.id) wmap[w.id]=w.memberId; });
  return (tx||[]).filter(t=>t&&t.type!=='transfer'&&t.date&&!vinhaIsPersonal(t.walletId,wmap)).map(t=>{ const m=catMap[t.categoryId]||{i:'📦',n:'Khác'};
    return {id:t.id||uid(),type:t.type||'expense',amount:Number(t.amount)||0,date:t.date,note:t.note||'',catId:t.categoryId||'',ci:m.i,cn:m.n}; })
    .sort((a,b)=> a.date<b.date?1:(a.date>b.date?-1:0)).slice(0,800);
}
const VN_SB_URL='https://ltmlueqkajqmduoqghdf.supabase.co';
const VN_SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWx1ZXFrYWpxbWR1b3FnaGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTA2NjcsImV4cCI6MjA5NzQyNjY2N30.rvwZsQiaD8a7fFLwBFk5sgSe6o9t9NqbPfVh1hJvxa0';
let _vnsb=null;
function vnSb(){ if(_vnsb) return _vnsb; if(window.supabase&&window.supabase.createClient){ try{ _vnsb=window.supabase.createClient(VN_SB_URL,VN_SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}); }catch(e){ _vnsb=null; } } return _vnsb; }
async function pullVinhaCloud(){ try{ const c=vnSb(); if(!c) return null; const u=await c.auth.getUser(); if(!(u&&u.data&&u.data.user)) return null;
  const r=await c.from('vinha_state').select('data').maybeSingle(); if(r.error||!r.data||!r.data.data) return null; const blob=r.data.data;
  return {tx:blob['vn.tx']||[], cats:catsArrToMap(blob['vn.cats']), wallets:blob['vn.wallets']||[], budgets:blob['vn.budgets']||[]}; }catch(e){ return null; } }
function normBudgets(budgets,cats){
  const catMap=Object.assign({},VINHA_CATS,cats||{});
  return (budgets||[]).filter(b=>b&&b.categoryId&&Number(b.amount)>0&&b.scope!=='m_cn').map(b=>{ const m=catMap[b.categoryId]||{i:'📦',n:'Khác'}; return {catId:b.categoryId,amount:Number(b.amount)||0,ci:m.i,cn:m.n}; });
}
async function refreshVinhaInto(setSync){
  let d=await pullVinhaCloud(); let src='cloud';
  if(!d||!d.tx||!d.tx.length){ const l=readVinhaLocal(); if(l){ d=l; src='local'; } }
  if(!d||!d.tx) return;
  const rows=normVinha(d.tx,d.cats,d.wallets); const budgets=normBudgets(d.budgets,d.cats);
  const sig=rows.length+':'+(rows[0]?rows[0].date+rows[0].id:'')+':b'+budgets.length;
  setSync(s=>{ if(s&&s.src==='file') return s; if(s&&s.sig===sig) return s; return {at:Date.now(),src,sig,rows,budgets}; });
}
function MoneyLover(){
  const [sync,setSync]=useLocal('ju.vinhaSync',null);
  const [ym,setYm]=useState(thisYM());
  const [msg,setMsg]=useState('');
  const fileRef=useRef(null);
  const [busy,setBusy]=useState(false);
  const applyRows=(data,src,manual)=>{ const rows=normVinha(data.tx,data.cats,data.wallets); const budgets=normBudgets(data.budgets,data.cats); const sig=rows.length+':'+(rows[0]?rows[0].date+rows[0].id:'')+':b'+budgets.length;
    setSync(s=>{ if(!manual && s && s.sig===sig) return s; return {at:Date.now(),src,sig,rows,budgets}; });
    if(manual){ setMsg('Đã đồng bộ '+rows.length+' giao dịch từ VíNhà'+(src==='cloud'?' (đám mây)':(src==='file'?' (file)':''))+'.'); celebrate(['💵']); } };
  const refresh=async(manual)=>{ if(manual) setBusy(true);
    let d=await pullVinhaCloud(); let src='cloud';
    if(!d||!d.tx||!d.tx.length){ const l=readVinhaLocal(); if(l){ d=l; src='local'; } }
    if(manual) setBusy(false);
    if(!d||!d.tx||!d.tx.length){ if(manual) setMsg('Chưa lấy được dữ liệu VíNhà. Hãy đăng nhập VíNhà (vinha-web) trên trình duyệt này, hoặc nhập file sao lưu.'); return; }
    applyRows(d,src,manual); };
  const onFile=(e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const rd=new FileReader();
    rd.onload=()=>{ try{ const j=JSON.parse(rd.result); const data=(j&&j.data)?j.data:j; applyRows({tx:data.tx||[],cats:catsArrToMap(data.cats),wallets:data.wallets||[]},'file',true); }catch(err){ setMsg('File không đọc được — cần đúng file JSON sao lưu từ VíNhà.'); } };
    rd.readAsText(f); e.target.value=''; };
  useEffect(()=>{ refresh(false); },[]);
  const rows=(sync&&sync.rows)||[];
  const monthRows=rows.filter(x=>x.type==='expense'&&ymOf(x.date)===ym);
  const total=monthRows.reduce((s,x)=>s+x.amount,0);
  const byCat={}; monthRows.forEach(x=>{ const k=x.ci+'|'+x.cn; byCat[k]=(byCat[k]||0)+x.amount; });
  const catRows=Object.keys(byCat).map(k=>({k,amt:byCat[k]})).sort((a,b)=>b.amt-a.amt);
  const syncDate=sync&&sync.at? fmtDateVN(new Date(sync.at).toISOString().slice(0,10)) : '';
  return (
    <div>
      <div className="muted center" style={{fontSize:11,margin:'10px 14px 6px'}}>💵 Chi tiêu chung của nhà + Sóc, lấy từ <b>VíNhà</b> (không gồm chi tiêu cá nhân). {sync?('Đồng bộ '+syncDate+(sync.src==='file'?' · từ file':(sync.src==='cloud'?' · từ đám mây':''))):'Chưa đồng bộ lần nào.'}</div>
      <div className="row" style={{gap:8,margin:'0 14px 6px'}}>
        <button className="btn soft grow" onClick={()=>refresh(true)} disabled={busy}>{busy?'⏳ Đang lấy…':'🔄 Đồng bộ ngay'}</button>
        <button className="btn soft grow" onClick={()=>fileRef.current&&fileRef.current.click()}>📁 Nhập file VíNhà</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={onFile}/>
      </div>
      {msg && <div className="center" style={{fontSize:11,margin:'0 14px 8px',color:'var(--primary)'}}>{msg}</div>}
      {!rows.length && <div className="empty"><span className="big">💵</span>Chưa có dữ liệu VíNhà.<br/>Đăng nhập VíNhà (vinha-web) trên trình duyệt này rồi bấm “Đồng bộ ngay”, hoặc nhập file sao lưu JSON của VíNhà.</div>}
      {rows.length>0 && <div>
        <div className="row" style={{margin:'4px 14px'}}>
          <b style={{fontSize:14}}>🧾 Chi tiêu VíNhà</b><span className="grow"></span>
          <button className="iconbtn" onClick={()=>setYm(ymShift(ym,-1))}>‹</button>
          <span className="muted" style={{fontSize:12.5,minWidth:60,textAlign:'center'}}>{ymLabel(ym)}</span>
          <button className="iconbtn" onClick={()=>setYm(ymShift(ym,1))} disabled={ym>=thisYM()} style={ym>=thisYM()?{opacity:.35}:{}}>›</button>
        </div>
        <div className="card" style={{margin:'0 14px'}}>
          <div className="muted" style={{fontSize:12.5}}>Tổng chi {ymLabel(ym)}</div>
          <div style={{fontSize:24,fontWeight:800,color:'var(--primary)'}}>{VND(total)}</div>
        </div>
        {catRows.length>0 && <div className="card" style={{margin:'8px 14px 0',padding:'8px 13px'}}>
          {catRows.map(r=>{ const p=total?Math.round(r.amt/total*100):0; const parts=r.k.split('|'); return (
            <div key={r.k} style={{padding:'4px 0'}}>
              <div className="row" style={{fontSize:12.5}}><span className="grow">{parts[0]} {parts[1]}</span><b>{VND(r.amt)}</b><span className="muted" style={{fontSize:11,marginLeft:6,minWidth:28,textAlign:'right'}}>{p}%</span></div>
              <div className="prog" style={{height:5,marginTop:2}}><i style={{width:p+'%'}}></i></div>
            </div>
          ); })}
        </div>}
        <div className="muted" style={{fontSize:12.5,margin:'10px 14px 4px'}}>{monthRows.length} giao dịch</div>
        {monthRows.slice(0,60).map(x=>(
          <div key={x.id} className="item" style={{padding:'8px 13px'}}>
            <div className="row"><span style={{fontSize:18,marginRight:8}}>{x.ci}</span>
              <span className="grow"><span style={{fontSize:14}}>{x.cn}{x.note?' · '+x.note:''}</span>
                <div className="muted" style={{fontSize:11,marginTop:1}}>{fmtDateVN(x.date)}</div></span>
              <b style={{color:'var(--primary)'}}>{VND(x.amount)}</b></div>
          </div>
        ))}
        <div className="muted center" style={{fontSize:11,margin:'8px 14px 4px'}}>Dữ liệu chỉ đọc từ VíNhà — sửa/thêm khoản chi hãy làm bên VíNhà rồi đồng bộ lại.</div>
      </div>}
    </div>
  );
}
function VinhaBudgets(){
  const [sync,setSync]=useLocal('ju.vinhaSync',null);
  useEffect(()=>{ refreshVinhaInto(setSync); },[]);
  const budgets=(sync&&sync.budgets)||[];
  const rows=(sync&&sync.rows)||[];
  const ym=thisYM();
  const spent={}; rows.filter(x=>x.type==='expense'&&ymOf(x.date)===ym).forEach(x=>{ if(x.catId) spent[x.catId]=(spent[x.catId]||0)+x.amount; });
  const totalBud=budgets.reduce((s,b)=>s+b.amount,0);
  const totalSpent=budgets.reduce((s,b)=>s+(spent[b.catId]||0),0);
  const list=budgets.map(b=>({...b,sp:spent[b.catId]||0})).sort((a,b)=>(b.sp/(b.amount||1))-(a.sp/(a.amount||1)));
  const tpct=totalBud?Math.round(totalSpent/totalBud*100):0;
  return (
    <div>
      <div className="muted center" style={{fontSize:11,margin:'10px 14px 6px'}}>🎚️ Hạn mức theo danh mục lấy từ <b>VíNhà</b> — so với chi tiêu chung nhà + Sóc tháng {ymLabel(ym)}. Sửa hạn mức bên VíNhà.</div>
      {!budgets.length && <div className="empty"><span className="big">🎚️</span>Chưa có ngân sách nào từ VíNhà.<br/>Đặt ngân sách danh mục bên VíNhà rồi mở lại (hoặc bấm 🔄 Đồng bộ ở tab Money Lover).</div>}
      {budgets.length>0 && <div className="card" style={{margin:'0 14px'}}>
        <div className="muted" style={{fontSize:12.5}}>Tổng đã chi / ngân sách tháng</div>
        <div style={{fontSize:22,fontWeight:800,color:tpct>100?'#d9534f':'var(--primary)',margin:'2px 0 4px'}}>{VND(totalSpent)} <span className="muted" style={{fontSize:12.5,fontWeight:500}}>/ {VND(totalBud)}</span></div>
        <div className="prog" style={{background:tpct>100?'#f3d5d5':'var(--line)'}}><i style={{width:Math.min(100,tpct)+'%',background:tpct>100?'#d9534f':(tpct>=80?'#e0a341':'var(--primary)')}}></i></div>
        <div style={{fontSize:12.5,marginTop:5}}><span style={tpct>100?{color:'#d9534f',fontWeight:700}:{color:'var(--muted)'}}>{tpct}% · {tpct>100?'vượt '+VND(totalSpent-totalBud):'còn '+VND(totalBud-totalSpent)}</span></div>
      </div>}
      {list.map(b=>{ const pct=b.amount?Math.round(b.sp/b.amount*100):0; const over=pct>100; const near=pct>=80&&!over; return (
        <div key={b.catId} className="item" style={{padding:'9px 13px'}}>
          <div className="row" style={{fontSize:14}}><span style={{marginRight:6}}>{b.ci}</span><span className="grow">{b.cn}</span>
            <b style={over?{color:'#d9534f'}:{}}>{VND(b.sp)}</b><span className="muted" style={{fontSize:12.5,marginLeft:4}}>/ {VND(b.amount)}</span></div>
          <div className="prog" style={{height:6,marginTop:5,background:over?'#f3d5d5':'var(--line)'}}><i style={{width:Math.min(100,pct)+'%',background:over?'#d9534f':(near?'#e0a341':'var(--primary)')}}></i></div>
          <div style={{fontSize:11,marginTop:3}}><span style={over?{color:'#d9534f',fontWeight:700}:{color:'var(--muted)'}}>{pct}% · {over?'vượt '+VND(b.sp-b.amount):(near?'sắp hết — còn '+VND(b.amount-b.sp):'còn '+VND(b.amount-b.sp))}</span></div>
        </div>
      ); })}
    </div>
  );
}
function Fund({people,me}){
  const [goals,setGoals]=useLocal('ju.fund',[]);
  const [tips,setTips]=useLocal('ju.saveTips',{});
  const [custom,setCustom]=useLocal('ju.saveCustom',[]);
  const [tipIn,setTipIn]=useState('');
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState(null);
  const [contrib,setContrib]=useState(null); // goal
  const [transfers,setTransfers]=useLocal('ju.transfers',[]);
  const [txOpen,setTxOpen]=useState(false);
  const allTips=SAVE_TIPS.concat(custom);
  const tgTip=(t)=>{ const n={...tips}; if(n[t]) delete n[t]; else n[t]=true; setTips(n); };
  const addTip=()=>{ const t=tipIn.trim(); if(!t) return; if(!allTips.includes(t)) setCustom(prev=>[t,...prev]); setTips({...tips,[t]:true}); setTipIn(''); celebrate(['🐷']); };
  const doneTips=allTips.filter(t=>tips[t]).length;
  const addTransfer=(from,amount,date,note)=>{ setTransfers(prev=>[{id:uid(),from,to:from==='a'?'b':'a',amount,date:date||todayISO(),note:note||''},...prev]); celebrate(['💸']); };
  const delTransfer=(id)=>{ if(confirm('Xoá ghi chép chuyển khoản này?')) setTransfers(prev=>prev.filter(x=>x.id!==id)); };
  const sumAB=transfers.filter(t=>t.from==='a').reduce((s,t)=>s+(Number(t.amount)||0),0);
  const sumBA=transfers.filter(t=>t.from==='b').reduce((s,t)=>s+(Number(t.amount)||0),0);

  const save=(g)=>{
    if(g.id) setGoals(prev=>prev.map(x=>x.id===g.id?g:x));
    else setGoals(prev=>[{...g,id:uid(),by:me,contribs:[],createdAt:Date.now()},...prev]);
    setOpen(false);setEdit(null);
  };
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setGoals(prev=>prev.filter(x=>x.id!==id)); } };
  const addContrib=(gid,amount,who)=> setGoals(prev=>prev.map(g=>g.id===gid?{...g,contribs:[...(g.contribs||[]),{id:uid(),amount,by:who,date:todayISO()}]}:g));

  return (
    <div>
      <ExpenseTracker people={people} me={me}/>
      <div className="row" style={{margin:'18px 14px 0'}}><span className="grow"><b style={{fontSize:14}}>🎯 Mục tiêu tiết kiệm chung</b></span>
        <button className="btn sm" onClick={()=>{setEdit(null);setOpen(true);}}>＋ Thêm</button></div>
      {goals.length===0 && <div className="empty"><span className="big">🐷</span>Góp quỹ cho du lịch, mua nhà, em bé…</div>}
      {goals.map(g=>{
        const saved=(g.contribs||[]).reduce((s,c)=>s+c.amount,0);
        const pct=g.target?Math.min(100,Math.round(saved/g.target*100)):0;
        return (
          <div key={g.id} className="item">
            <div className="it-top"><h4>{g.title}</h4><span className="pill">{pct}%</span></div>
            <div className="row" style={{marginTop:4}}>
              <b style={{color:'var(--primary)'}}>{VND(saved)}</b>
              <span className="muted" style={{fontSize:12.5}}>/ {VND(g.target)}</span>
            </div>
            <div className="prog"><i style={{width:pct+'%'}}></i></div>
            {(g.contribs||[]).length>0 && (
              <div style={{marginTop:8}}>
                {g.contribs.slice().reverse().slice(0,4).map(c=>(
                  <div key={c.id} className="row" style={{fontSize:12.5,padding:'2px 0'}}>
                    <span>{people[c.by]?.avatar} {people[c.by]?.name}</span>
                    <span className="grow"></span><span className="muted">{fmtDateVN(c.date)}</span>
                    <b style={{marginLeft:8}}>+{VND(c.amount)}</b>
                  </div>
                ))}
              </div>
            )}
            <div className="it-meta"><span className="grow"></span>
              <button className="pill" onClick={()=>setContrib(g)}>＋ Góp tiền</button>
              <button className="iconbtn" aria-label="Sửa" title="Sửa" onClick={()=>{setEdit(g);setOpen(true);}}><Ic n="sua"/></button>
              <button className="iconbtn" aria-label="Xoá" title="Xoá" onClick={()=>del(g.id)}><Ic n="xoa"/></button></div>
          </div>
        );
      })}
      <div className="sec-title">💸 Chuyển khoản cho nhau <span className="grow"></span><button className="btn sm" onClick={()=>setTxOpen(true)}>＋ Ghi</button></div>
      <div className="muted center" style={{fontSize:11,margin:'0 14px 4px'}}>Ghi lại lần vợ/chồng chuyển tiền cho nhau — ngày & số tiền.</div>
      {transfers.length===0 && <div className="empty muted">Chưa có ghi chép nào — bấm ＋ Ghi.</div>}
      {transfers.slice(0,40).map(t=>(
        <div key={t.id} className="item" style={{padding:'8px 13px'}}>
          <div className="row"><span className="grow" style={{fontSize:14}}>{people[t.from]?.avatar} {people[t.from]?.name} → {people[t.to]?.name}</span>
            <b style={{color:'var(--primary)'}}>{VND(t.amount)}</b>
            <button className="iconbtn" style={{marginLeft:6}} aria-label="Xoá" title="Xoá" onClick={()=>delTransfer(t.id)}><Ic n="xoa"/></button></div>
          <div className="muted" style={{fontSize:11,marginTop:2}}>{fmtDateVN(t.date)}{t.note?' · '+t.note:''}</div>
        </div>
      ))}
      {txOpen && <Sheet title="💸 Ghi chuyển khoản" onClose={()=>setTxOpen(false)}><TransferForm people={people} me={me} onSave={(from,amt,date,note)=>{ addTransfer(from,amt,date,note); setTxOpen(false); }}/></Sheet>}
      <Collapse id="fund-tips" defaultOpen={false} title="💡 Mẹo sống tiết kiệm" right={<span className="muted" style={{fontSize:12.5}}>đang áp dụng {doneTips}/{allTips.length}</span>}>
      <div className="muted center" style={{fontSize:11,margin:'0 14px 4px'}}>Tích mẹo hai đứa đang làm — theo dõi mình đã tiết kiệm hơn thế nào.</div>
      <div className="prog" style={{margin:'0 14px'}}><i style={{width:(allTips.length?doneTips/allTips.length*100:0)+'%'}}></i></div>
      <div className="card" style={{padding:'4px 13px',marginTop:8}}>
        {allTips.map(t=>(
          <div key={t} className="row" style={{padding:'7px 0',borderBottom:'1px solid var(--line)'}}>
            <button onClick={()=>tgTip(t)} aria-label="Đánh dấu đã áp dụng" className="tapmin"><Ic n={tips[t]?'dadanh':'chuadanh'} size={17}/></button>
            <span className="grow" style={{fontSize:14,textDecoration:tips[t]?'line-through':'none',opacity:tips[t]?.65:1}}>{t}</span>
            {custom.includes(t) && <button className="muted tapmin" aria-label="Xoá" onClick={()=>{ if(confirm('Xoá mẹo này?')){ setCustom(prev=>prev.filter(x=>x!==t)); const n={...tips}; delete n[t]; setTips(n); } }}><Ic n="dong" size={15}/></button>}
          </div>
        ))}
        <div className="row" style={{gap:6,padding:'8px 0'}}>
          <input className="inp grow" placeholder="Thêm mẹo tiết kiệm của nhà mình…" value={tipIn} onChange={e=>setTipIn(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addTip(); }}/>
          <button className="btn sm" onClick={addTip}>＋</button>
        </div>
      </div>
      </Collapse>
      {open && (
        <Sheet title={(edit?'Sửa ':'Thêm ')+'mục tiêu'} onClose={()=>{setOpen(false);setEdit(null);}}>
          <GoalForm init={edit} onSave={save}/>
        </Sheet>
      )}
      {contrib && (
        <Sheet title={'Góp vào: '+contrib.title} onClose={()=>setContrib(null)}>
          <ContribForm people={people} me={me} onSave={(amt,who)=>{ addContrib(contrib.id,amt,who); setContrib(null); }}/>
        </Sheet>
      )}
    </div>
  );
}
function GoalForm({init,onSave}){
  const [f,setF]=useState(()=>init?{...init}:{title:'',target:0});
  return (<div>
    <div className="field"><label>Tên mục tiêu</label>
      <input className="inp" autoFocus value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="VD: Du lịch Đà Nẵng"/></div>
    <div className="field"><label>Số tiền cần (đ)</label>
      <input className="inp" type="number" value={f.target||''} onChange={e=>setF({...f,target:Number(e.target.value)})}/></div>
    <button className="btn" onClick={()=>{ if(f.title.trim()) onSave(f); }}>💾 Lưu</button>
  </div>);
}
function ContribForm({people,me,onSave}){
  const [amt,setAmt]=useState('');
  const [who,setWho]=useState(me);
  return (<div>
    <div className="field"><label>Người góp</label>
      <select className="inp" value={who} onChange={e=>setWho(e.target.value)}>
        <option value="a">{people.a.name}</option><option value="b">{people.b.name}</option></select></div>
    <div className="field"><label>Số tiền (đ)</label>
      <input className="inp" type="number" autoFocus value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0"/></div>
    <button className="btn" onClick={()=>{ const n=Number(amt); if(n>0) onSave(n,who); }}>💾 Góp</button>
  </div>);
}
function TransferForm({people,me,onSave}){
  const [from,setFrom]=useState(me||'a');
  const [amt,setAmt]=useState('');
  const [date,setDate]=useState(todayISO());
  const [note,setNote]=useState('');
  const to=from==='a'?'b':'a';
  return (<div>
    <div className="field"><label>Người chuyển</label>
      <select className="inp" value={from} onChange={e=>setFrom(e.target.value)}>
        <option value="a">{people.a.name}</option><option value="b">{people.b.name}</option></select></div>
    <div className="muted" style={{fontSize:12.5,margin:'-4px 0 8px'}}>→ Người nhận: <b>{people[to].name}</b></div>
    <div className="field"><label>Số tiền (đ)</label>
      <input className="inp" type="number" inputMode="numeric" autoFocus value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0"/></div>
    <div className="field"><label>Ngày chuyển</label>
      <input className="inp" type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></div>
    <div className="field"><label>Ghi chú (tuỳ chọn)</label>
      <input className="inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="vd: tiền chợ, trả nợ, góp mua đồ…"/></div>
    <button className="btn" onClick={()=>{ const n=Number(amt); if(n>0) onSave(from,n,date,note); }}>💾 Lưu</button>
  </div>);
}

function Notes({people,me}){
  const [notes,setNotes]=useLocal('ju.notes',[]);
  const [t,setT]=useState('');
  const endRef=useRef(null);
  const add=()=>{ if(!t.trim())return; setNotes(prev=>[...prev,{id:uid(),by:me,text:t.trim(),createdAt:Date.now()}]); setT(''); };
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[notes.length]);
  useEffect(()=>{ const latest=notes.reduce((m,n)=>Math.max(m,n.createdAt||0),0); const ns={...(store.get('ju.notesSeen',{})||{})}; if((ns[me]||0)<latest){ ns[me]=latest; store.set('ju.notesSeen',ns); try{ Cloud.schedulePush&&Cloud.schedulePush(); }catch(_){} } },[notes.length]);
  const del=(id)=>{ if(confirm('Bạn có chắc muốn xoá? Thao tác này không hoàn tác được.')){ setNotes(prev=>prev.filter(x=>x.id!==id)); } };
  const heart=(id)=>setNotes(prev=>prev.map(n=>{ if(n.id!==id) return n; const r={...(n.reacts||{})}; r[me]=r[me]?null:'❤️'; return {...n,reacts:r}; }));
  return (
    <div>
      <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>💌 Lời nhắn yêu thương — chạm 🤍 để thả tim</div>
      <div style={{padding:'0 6px'}}>
        {notes.length===0 && <div className="empty"><span className="big">💌</span>Viết lời nhắn đầu tiên cho người ấy…</div>}
        {notes.map(n=>{
          const mine=n.by===me;
          const reacts=[n.reacts&&n.reacts.a, n.reacts&&n.reacts.b].filter(Boolean);
          return (
            <div key={n.id} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',padding:'4px 10px',gap:4,alignItems:'center'}}>
              {mine && <button className="muted tapmin" aria-label="Xoá" style={{fontSize:12.5}} onClick={()=>{ if(confirm('Xoá lời nhắn này?')) del(n.id); }}><Ic n="dong" size={15}/></button>}
              <div style={{maxWidth:'72%'}}>
                <div className="muted" style={{fontSize:11,margin:'0 6px 2px',textAlign:mine?'right':'left'}}>{people[n.by]?.avatar} {people[n.by]?.name}</div>
                <div style={{background:mine?'linear-gradient(135deg,var(--primary),var(--primary2))':'var(--card)',
                    color:mine?'var(--on-primary)':'var(--text)',border:'1px solid var(--line)',
                    padding:'9px 13px',borderRadius:16,fontSize:14,whiteSpace:'pre-wrap',boxShadow:'var(--shadow)'}}>{n.text}</div>
                {reacts.length>0 && <div style={{textAlign:mine?'right':'left',fontSize:12.5,marginTop:2}}>{reacts.join(' ')}</div>}
              </div>
              <button onClick={()=>heart(n.id)} aria-label="Thả tim" className="tapmin" style={{lineHeight:1,color:'var(--heart)'}}><Ic n={(n.reacts&&n.reacts[me])?'tim':'timrong'} size={16}/></button>
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>
      <div className="row" style={{position:'sticky',bottom:0,background:'var(--card)',padding:'10px 14px',borderTop:'1px solid var(--line)',gap:8,margin:'10px 0 0'}}>
        <button className="btn sm soft" title="Gợi ý lời ngọt" aria-label="Gợi ý lời ngọt" onClick={()=>setT(SWEET_NOTES[Math.floor(Math.random()*SWEET_NOTES.length)])}><Ic n="goiy"/></button>
        <input className="inp grow" placeholder="Nhắn gì đó ngọt ngào…" value={t}
          onChange={e=>setT(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <button className="btn sm" onClick={add}>Gửi</button>
      </div>
    </div>
  );
}

/* ============ Tài khoản & ghép đôi (đăng nhập thật) ============ */
function authErrVN(e){
  const m=(e&&e.message||'').toLowerCase();
  if(m.includes('invalid login')) return 'Sai email hoặc mật khẩu.';
  if(m.includes('already registered')||m.includes('already been registered')) return 'Email này đã đăng ký — hãy Đăng nhập.';
  if(m.includes('password')&&m.includes('6')) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if(m.includes('email')&&m.includes('invalid')) return 'Email không hợp lệ.';
  if(m.includes('invalid_code')) return 'Mã mời không đúng.';
  if(m.includes('couple_full')) return 'Cặp đôi này đã đủ 2 người.';
  if(m.includes('already_in_couple')) return 'Bạn đã ở trong một cặp đôi khác.';
  return (e&&e.message)||'Có lỗi xảy ra.';
}
function AccountPanel({flash}){
  const [,force]=useState(0);
  useEffect(()=>{
    const h=()=>force(x=>x+1);
    window.addEventListener('ju:remote',h);
    Cloud.onChange=()=>force(x=>x+1);
    return ()=>{ window.removeEventListener('ju:remote',h); Cloud.onChange=null; };
  },[]);
  const noLib=!sbClient();
  const [mode,setMode]=useState('login');   // login | signup
  const [email,setEmail]=useState(''); const [pw,setPw]=useState(''); const [name,setName]=useState('');
  const [code,setCode]=useState(''); const [busy,setBusy]=useState(false); const [note,setNote]=useState('');

  const doAuth=async()=>{
    if(noLib){ flash('Cần Internet để đăng nhập.'); return; }
    if(!email.trim()||pw.length<6){ setNote('Nhập email và mật khẩu (≥6 ký tự).'); return; }
    setBusy(true); setNote('');
    try{
      if(mode==='signup'){
        const r=await Cloud.signUp(email.trim(),pw,name.trim());
        if(r && !r.session){ setNote('Đã tạo tài khoản. Nếu chưa vào được, hãy mở email xác nhận — hoặc tắt "Confirm email" trong Supabase.'); }
        else flash('Chào mừng! 💞');
      }else{
        await Cloud.signIn(email.trim(),pw); flash('Đăng nhập thành công 💞');
      }
      setPw('');
    }catch(e){ setNote(authErrVN(e)); }
    setBusy(false);
  };
  const doCreate=async()=>{ setBusy(true); setNote(''); try{ await Cloud.createCouple(name.trim()||null); flash('Đã tạo cặp đôi ☁️'); }catch(e){ setNote(authErrVN(e)); } setBusy(false); };
  const doJoin=async()=>{
    const c=normCode(code); if(c.replace(/-/g,'').length<6){ setNote('Mã mời chưa đúng.'); return; }
    if(!confirm('Tham gia sẽ TẢI dữ liệu của cặp đôi này về máy và GHI ĐÈ dữ liệu hiện tại trên máy này. Tiếp tục?')) return;
    setBusy(true); setNote('');
    try{ await Cloud.joinCouple(c,name.trim()||null); window.dispatchEvent(new CustomEvent('ju:remote')); flash('Đã ghép đôi ☁️ — đã tải dữ liệu về.'); }
    catch(e){ setNote(authErrVN(e)); }
    setBusy(false);
  };
  const doSync=async()=>{ setBusy(true); await Cloud.push(); await Cloud.pull(); window.dispatchEvent(new CustomEvent('ju:remote')); setBusy(false); flash('Đã đồng bộ ✓'); };
  const doLeave=async()=>{ if(confirm('Rời cặp đôi? Bạn sẽ không còn đồng bộ với người kia (dữ liệu trên máy này vẫn giữ).')){ try{ await Cloud.leaveCouple(); }catch(e){ flash(authErrVN(e)); } } };
  const doLogout=async()=>{ if(confirm('Đăng xuất khỏi tài khoản này trên máy?')){ await Cloud.signOut(); } };
  const copy=()=>{ const cp=Cloud.couple(); try{ navigator.clipboard.writeText(cp.invite_code); flash('Đã chép mã 📋'); }catch(e){} };
  const [pwOpen,setPwOpen]=useState(false); const [npw,setNpw]=useState(''); const [npw2,setNpw2]=useState('');
  const changePw=async()=>{ if(npw.length<6){ setNote('Mật khẩu mới cần ≥6 ký tự.'); return; } if(npw!==npw2){ setNote('Hai ô mật khẩu chưa khớp.'); return; } setBusy(true); setNote(''); try{ const c=sbClient(); const {error}=await c.auth.updateUser({password:npw}); if(error) throw error; flash('Đã đổi mật khẩu ✓'); setNpw('');setNpw2('');setPwOpen(false); }catch(e){ setNote(authErrVN(e)); } setBusy(false); };

  const loggedIn=Cloud.loggedIn(), connected=Cloud.connected(), couple=Cloud.couple();
  const synced=store.get('ju.synced',null);
  const syncedTxt=synced? new Date(synced).toLocaleString('vi-VN') : '—';

  return (
    <Collapse id="prof-account" title="☁️ Tài khoản & đồng bộ 2 máy" defaultOpen={false}>
      <div className="card">
        {noLib && <div className="danger" style={{fontSize:12.5}}>⚠️ Chưa tải được Supabase (cần Internet/chạy qua web). Mở app qua localhost hoặc bản đã đăng để đăng nhập.</div>}

        {!loggedIn && !noLib && (
          <div>
            <div className="row" style={{gap:6,marginBottom:12}}>
              <button className={'btn grow '+(mode==='login'?'':'soft')} onClick={()=>{setMode('login');setNote('');}}>Đăng nhập</button>
              <button className={'btn grow '+(mode==='signup'?'':'soft')} onClick={()=>{setMode('signup');setNote('');}}>Tạo tài khoản</button>
            </div>
            {mode==='signup' && <div className="field"><label>Tên gọi (tuỳ chọn)</label>
              <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="VD: Huy"/></div>}
            <div className="field"><label>Email</label>
              <input className="inp" type="email" autoCapitalize="none" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ban@email.com"/></div>
            <div className="field"><label>Mật khẩu</label>
              <input className="inp" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="≥ 6 ký tự"
                onKeyDown={e=>{ if(e.key==='Enter') doAuth(); }}/></div>
            <button className="btn" disabled={busy} onClick={doAuth}>{busy?'…':(mode==='signup'?'✨ Tạo tài khoản':'🔑 Đăng nhập')}</button>
            <div className="muted" style={{fontSize:11,marginTop:10}}>Đăng nhập để dữ liệu được bảo mật theo tài khoản và đồng bộ an toàn giữa 2 máy.</div>
          </div>
        )}

        {loggedIn && !connected && (
          <div>
            <div className="row"><span className="muted grow" style={{fontSize:12.5}}>Đăng nhập: <b>{Cloud.emailOf()}</b></span>
              <button className="pill" onClick={doLogout}>Đăng xuất</button></div>
            <div style={{height:10}}></div>
            <div className="muted" style={{fontSize:12.5,marginBottom:8}}>Bạn chưa ghép đôi. Một người <b>Tạo cặp đôi</b>, người kia <b>nhập mã mời</b>.</div>
            <div className="field"><label>Tên gọi của bạn (tuỳ chọn)</label>
              <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="VD: Huy"/></div>
            <button className="btn" disabled={busy} onClick={doCreate}>{busy?'…':'💞 Tạo cặp đôi mới'}</button>
            <div className="center muted" style={{fontSize:12.5,margin:'12px 0 8px'}}>— hoặc nhập mã mời —</div>
            <div className="row" style={{gap:8}}>
              <input className="inp grow" placeholder="VD: A1B2-C3D4" value={code}
                onChange={e=>setCode(normCode(e.target.value))} style={{textTransform:'uppercase',letterSpacing:1}}/>
              <button className="btn sm soft" disabled={busy} onClick={doJoin}>{busy?'…':'Tham gia'}</button>
            </div>
          </div>
        )}

        {connected && couple && (
          <div>
            <div className="row"><b className="grow">Đã ghép đôi ☁️</b>
              <span className="pill" style={{background:'var(--good)',color:'#fff'}}>● {couple.members>=2?'Đủ 2 người':'Chờ người kia'}</span></div>
            <div className="muted" style={{fontSize:12.5,margin:'6px 0 2px'}}>Mã mời (đưa cho người kia nhập):</div>
            <div className="row" style={{margin:'4px 0 6px',gap:8}}>
              <div className="grow" style={{background:'var(--bg)',border:'1.5px dashed var(--primary)',borderRadius:12,padding:'10px 12px',
                fontSize:20,fontWeight:900,letterSpacing:3,textAlign:'center'}}>{couple.invite_code}</div>
              <button className="iconbtn" aria-label="Chép" title="Chép" onClick={copy}><Ic n="chep"/></button>
            </div>
            <div className="muted" style={{fontSize:12.5}}>Tài khoản: <b>{Cloud.emailOf()}</b> · Đồng bộ gần nhất: {syncedTxt}</div>
            <div className="row" style={{gap:8,marginTop:12}}>
              <button className="btn soft grow" disabled={busy} onClick={doSync}>{busy?'…':'🔄 Đồng bộ ngay'}</button>
              <button className="btn ghost grow" onClick={doLogout}>Đăng xuất</button>
            </div>
            <div className="center" style={{marginTop:8}}><button className="pill" onClick={doLeave}>Rời cặp đôi</button></div>
            <div className="muted" style={{fontSize:11,marginTop:10}}>
              ⓘ Chỉ 2 tài khoản trong cặp đôi mới xem/sửa được dữ liệu & ảnh. Ảnh được lưu an toàn trên Supabase Storage.
            </div>
          </div>
        )}

        {loggedIn && <div style={{marginTop:12,borderTop:'1px solid var(--line)',paddingTop:10}}>
          {!pwOpen
            ? <button className="pill" onClick={()=>{ setPwOpen(true); setNote(''); }}>🔑 Đổi mật khẩu</button>
            : <div>
                <b style={{fontSize:14}}>🔑 Đổi mật khẩu</b>
                <div className="field" style={{marginTop:6}}><label>Mật khẩu mới (≥6 ký tự)</label>
                  <input className="inp" type="password" value={npw} onChange={e=>setNpw(e.target.value)} placeholder="Mật khẩu mới"/></div>
                <div className="field"><label>Nhập lại mật khẩu mới</label>
                  <input className="inp" type="password" value={npw2} onChange={e=>setNpw2(e.target.value)} placeholder="Nhập lại"/></div>
                <div className="row" style={{gap:8}}>
                  <button className="btn grow" disabled={busy} onClick={changePw}>{busy?'…':'Lưu mật khẩu mới'}</button>
                  <button className="btn soft" onClick={()=>{ setPwOpen(false); setNpw('');setNpw2(''); setNote(''); }}>Huỷ</button>
                </div>
                <div className="muted" style={{fontSize:11,marginTop:6}}>Đổi ngay, không cần xác nhận qua email. Nhớ lưu lại mật khẩu mới.</div>
              </div>}
        </div>}
        {note && <div className="danger" style={{fontSize:12.5,marginTop:10}}>{note}</div>}
      </div>
    </Collapse>
  );
}

/* ============ Thống kê "Hồ sơ tình yêu" ============ */
function LoveStats({setup}){
  const g=(k,d)=>store.get(k,d)||d;
  const notes=g('ju.notes',[]), photos=g('ju.photos',[]), spots=g('ju.spots',[]),
    bucket=g('ju.bucket',[]), coupons=g('ju.coupons',[]), timeline=g('ju.timeline',[]),
    food=g('ju.food',[]), ideas=g('ju.ideas',[]), qa=g('ju.qa',{}), jar=g('ju.lovejar',[]),
    checkins=g('ju.checkins',[]), habits=g('ju.habits',[]);
  const loveDays=setup.loveDate?Math.max(0,(daysFromToday(setup.loveDate)||0)*-1):0;
  const tiles=[
    ['💗',loveDays.toLocaleString('vi-VN'),'ngày bên nhau'],
    ['💌',notes.length,'lời nhắn'],
    ['📷',photos.length,'ảnh chung'],
    ['🗺️',spots.filter(s=>s.done).length,'chỗ đã đi'],
    ['🍜',food.filter(f=>f.done).length,'món đã thử'],
    ['💡',ideas.filter(i=>i.done).length,'buổi hẹn đã đi'],
    ['🎯',bucket.filter(b=>b.done).length,'điều đã làm cùng'],
    ['🎟️',coupons.filter(c=>c.redeemed).length,'phiếu đã đổi'],
    ['🕰️',timeline.length,'cột mốc'],
    ['🫙',jar.length,'điều yêu thương'],
    ['📸',checkins.length,'lần check-in'],
    ['✅',habits.length,'thói quen chung'],
    ['🔥',answerStreak(qa),'ngày streak'],
  ];
  return (
    <Collapse id="prof-stats" title="📊 Hồ sơ tình yêu" defaultOpen={false}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,margin:'0 14px'}}>
        {tiles.map((t,i)=>(
          <div key={i} className="card" style={{margin:0,padding:'11px 12px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:23}}>{t[0]}</div>
            <div><div style={{fontWeight:900,fontSize:18,color:'var(--primary)',lineHeight:1.1}}>{t[1]}</div>
              <div className="muted" style={{fontSize:11}}>{t[2]}</div></div>
          </div>
        ))}
      </div>
    </Collapse>
  );
}

/* ============ Huy hiệu thành tích ============ */
function Achievements({setup}){
  const g=(k,d)=>store.get(k,d)||d;
  const loveDays=setup.loveDate?Math.max(0,(daysFromToday(setup.loveDate)||0)*-1):0;
  const notes=g('ju.notes',[]).length, photos=g('ju.photos',[]).length;
  const food=g('ju.food',[]).filter(x=>x.done).length, spots=g('ju.spots',[]).filter(x=>x.done).length;
  const bucket=g('ju.bucket',[]).filter(x=>x.done).length, coupons=g('ju.coupons',[]).filter(x=>x.redeemed).length;
  const timeline=g('ju.timeline',[]).length, jar=g('ju.lovejar',[]).length;
  const streak=answerStreak(g('ju.qa',{}));
  const chDays=Object.keys(g('ju.challengeDone',{})).length;
  const checkins=g('ju.checkins',[]).length;
  const habits=g('ju.habits',[]);
  const habitStreak=habits.reduce((m,h)=>Math.max(m,streakOf(d=>!!(h.log||{})[d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())])),0);
  const menuMade=(g('ju.menuPlan',null)?1:0)+(g('ju.menu',[]).length?1:0);
  const gifts=g('ju.wish',[]).length;
  const list=[
    {i:'💗',n:'Khởi đầu',ok:!!setup.loveDate,h:'Đặt ngày yêu'},
    {i:'💯',n:'100 ngày',ok:loveDays>=100,h:'Bên nhau 100 ngày'},
    {i:'🎂',n:'Một năm',ok:loveDays>=365,h:'Bên nhau 1 năm'},
    {i:'🏆',n:'1000 ngày',ok:loveDays>=1000,h:'Bên nhau 1000 ngày'},
    {i:'💌',n:'Tâm tình',ok:notes>=10,h:'≥10 lời nhắn'},
    {i:'📷',n:'Nhiếp ảnh',ok:photos>=5,h:'≥5 ảnh chung'},
    {i:'🍽️',n:'Thực khách',ok:food>=3,h:'Thử ≥3 món'},
    {i:'🗺️',n:'Lữ hành',ok:spots>=3,h:'Đi ≥3 chỗ'},
    {i:'🎯',n:'Đồng đội',ok:bucket>=1,h:'Xong 1 bucket'},
    {i:'🎟️',n:'Hào phóng',ok:coupons>=1,h:'Đổi 1 phiếu'},
    {i:'🕰️',n:'Lưu giữ',ok:timeline>=3,h:'≥3 cột mốc'},
    {i:'🔥',n:'Bền bỉ',ok:streak>=7,h:'Streak ≥7 ngày'},
    {i:'💪',n:'Cùng cố',ok:chDays>=7,h:'≥7 thử thách'},
    {i:'🫙',n:'Đầy lọ',ok:jar>=5,h:'≥5 điều yêu thương'},
    {i:'📸',n:'Check-in',ok:checkins>=3,h:'≥3 lần check-in'},
    {i:'✅',n:'Kỷ luật',ok:habitStreak>=7,h:'Thói quen 7 ngày'},
    {i:'🍳',n:'Đầu bếp',ok:menuMade>=1,h:'Lên thực đơn tuần'},
    {i:'🎁',n:'Mơ ước',ok:gifts>=3,h:'≥3 món trong wishlist'},
  ];
  const got=list.filter(b=>b.ok).length;
  return (
    <Collapse id="prof-badges" title="🏅 Thành tích" defaultOpen={false} right={<span className="muted" style={{fontSize:12.5}}>{got}/{list.length}</span>}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,margin:'0 14px'}}>
        {list.map((b,i)=>(
          <div key={i} className="card" style={{margin:0,padding:'10px 6px',textAlign:'center',opacity:b.ok?1:.5}}>
            <div style={{fontSize:26}}>{b.ok?b.i:'🔒'}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:3}}>{b.n}</div>
            <div className="muted" style={{fontSize:9.5,marginTop:2}}>{b.ok?'Đã mở':b.h}</div>
          </div>
        ))}
      </div>
    </Collapse>
  );
}

/* Ảnh: lấy URL ký tạm nếu là ảnh trên Storage; nếu là base64/link thì dùng trực tiếp */
function PhotoImg({photo,style}){
  const [url,setUrl]=useState(photo.src||null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let on=true;
    if(photo.epath){
      /* ảnh đã mã hoá (mục Giấy tờ): tải bytes qua phiên đăng nhập rồi giải mã trong máy */
      if(DocsCrypto.locked()) setUrl(null);
      else (async()=>{ try{
        const raw=await Cloud.downloadBytes(photo.epath); if(!raw) return;
        const txt=new TextDecoder().decode(await DocsCrypto.decBytes(raw));
        if(on) setUrl(txt);
      }catch(_){} })();
    }
    else if(photo.path){ Cloud.signedUrl(photo.path).then(u=>{ if(on&&u) setUrl(u); }); }
    else setUrl(photo.src||null);
    return ()=>{ on=false; };
  },[photo.path,photo.src,photo.epath,retry]);
  /* link 1 giờ có thể hết hạn khi app mở lâu — xin link mới một lần rồi thử lại */
  const onErr=(e)=>{
    if(photo.path&&retry<1){ Cloud.forgetUrl(photo.path); setRetry(retry+1); return; }
    e.target.style.opacity=.3;
  };
  return <img src={url||''} alt="" style={style} onError={onErr}/>;
}
// Nén ảnh về tối đa maxDim px, JPEG — tránh phình localStorage
function compressToDataURL(file,maxDim,quality){
  return new Promise((resolve)=>{ const r=new FileReader();
    r.onload=()=>{ const img=new Image(); img.onload=()=>{ try{ let w=img.naturalWidth,h=img.naturalHeight; const sc=Math.min(1,(maxDim||1400)/Math.max(w,h)); w=Math.round(w*sc); h=Math.round(h*sc); const c=document.createElement('canvas'); c.width=w;c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); resolve(c.toDataURL('image/jpeg',quality||0.72)); }catch(_){ resolve(r.result); } }; img.onerror=()=>resolve(r.result); img.src=r.result; };
    r.onerror=()=>resolve(null); r.readAsDataURL(file); });
}
async function photoFromFile(file){ try{ if(typeof Cloud!=='undefined'&&Cloud.connected&&Cloud.connected()){ const path=await Cloud.uploadPhoto(file); if(path) return {path}; } }catch(_){} const src=await compressToDataURL(file,1400,0.72); return src?{src}:null; }
function PhotoAddBtn({onAdd,size,label,multiple,make}){
  const ref=useRef(null); const [busy,setBusy]=useState(false);
  const pick=async(e)=>{ const files=Array.from(e.target.files||[]); if(!files.length)return; e.target.value=''; setBusy(true);
    const mk=make||photoFromFile;
    for(let i=0;i<files.length;i++){ try{ const p=await mk(files[i]); if(p) onAdd(p); }catch(_){} }
    setBusy(false); };
  const s=size||64;
  return <><button className="btn sm soft" style={{width:label?'auto':s,height:s,fontSize:label?13:20,padding:label?'0 12px':0}} onClick={()=>ref.current&&ref.current.click()}>{busy?'…':(label||'📷')}</button><input ref={ref} type="file" accept="image/*" multiple={!!multiple} style={{display:'none'}} onChange={pick}/></>;
}
/* Danh sách ảnh của một mục — tương thích dữ liệu cũ (1 ảnh ở khoá `photo`) */
function photoList(x){ if(!x) return []; const a=(x.photos||[]).filter(Boolean); if(a.length) return a; return x.photo?[x.photo]:[]; }
/* Khung chọn nhiều ảnh (dùng trong form): thumbnail + ✕ xoá + 2 cách thêm ảnh.
   Nút chính KHÔNG đặt `multiple`: Android lọc bảng chọn theo thuộc tính này, có `multiple`
   là mấy app không hỗ trợ chọn-nhiều (Thư viện/Gallery của máy) bị ẩn khỏi bảng chọn.
   Muốn chọn nhiều ảnh một lần thì bấm nút phụ bên dưới. */
function PhotoPicker({value,onChange,size,label,hint,make}){
  const list=(value||[]).filter(Boolean);
  const ref=useRef(list); ref.current=list;
  const add=(p)=>{ const next=[...ref.current,p]; ref.current=next; onChange(next); };
  const rm=(i)=>{ const next=ref.current.filter((_,j)=>j!==i); ref.current=next; onChange(next); };
  const manyRef=useRef(null); const [many,setMany]=useState(0);
  const pickMany=async(e)=>{ const files=Array.from(e.target.files||[]); if(!files.length)return; e.target.value='';
    const mk=make||photoFromFile; setMany(files.length);
    for(let i=0;i<files.length;i++){ try{ const p=await mk(files[i]); if(p) add(p); }catch(_){} setMany(files.length-i-1); }
    setMany(0); };
  const s=size||70;
  return <div>
    <div className="phpick">
      {list.map((p,i)=><div key={i} className="cell">
        <PhotoImg photo={p} style={{width:s,height:s,borderRadius:8,objectFit:'cover',display:'block'}}/>
        <button className="x" aria-label="Bỏ mục này" onClick={()=>rm(i)}><Ic n="dong" size={15}/></button>
      </div>)}
      <PhotoAddBtn size={s} onAdd={add} make={make} label={list.length?null:(label||null)}/>
      {/* nút phụ để cùng cỡ với nút 📷: có chữ khi chưa có ảnh, thành ô vuông s×s khi đã có ảnh */}
      <button className="btn sm soft" style={{width:list.length?s:'auto',height:s,fontSize:list.length?20:13,padding:list.length?0:'0 12px'}}
        onClick={()=>manyRef.current&&manyRef.current.click()}>
        {many?(list.length?('…'+many):('Đang thêm… còn '+many)):(list.length?'🖼️':'🖼️ Chọn nhiều ảnh')}</button>
      <input ref={manyRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={pickMany}/>
    </div>
    <div className="phlab" style={{marginTop:4}}>Nút <b>📷</b> mở cả Thư viện/Máy ảnh (1 ảnh mỗi lần) · <b>🖼️</b> chọn nhiều ảnh một lượt.</div>
    {(hint||list.length>0) && <div className="phlab" style={{marginTop:2}}>{list.length>0?(list.length+' ảnh · bấm ✕ để bỏ'+(hint?' · '+hint:'')):hint}</div>}
    {list.length>=6 && !(Cloud.connected&&Cloud.connected()) && <div className="phlab" style={{color:'var(--warn)'}}>
      ⚠️ Chưa ghép đôi nên ảnh lưu ngay trên máy — nhiều ảnh quá có thể đầy bộ nhớ. Vào Hồ sơ → ☁️ Tài khoản &amp; đồng bộ để ảnh lên mây.</div>}
  </div>;
}
/* Hiện nhiều ảnh trong danh sách: ảnh đầu to (khi big), còn lại thành dải thumbnail */
function PhotoShow({photos,onView,big,size,max}){
  const list=(photos||[]).filter(Boolean);
  if(!list.length) return null;
  const s=size||56, lim=max||6;
  const thumbs=(from)=>{ const rest=list.slice(from); const show=rest.slice(0,lim); const extra=rest.length-show.length;
    return <div className="phrow">
      {show.map((p,i)=><span key={i} className="th" onClick={()=>onView&&onView(from+i)}>
        <PhotoImg photo={p} style={{width:s,height:s,objectFit:'cover'}}/></span>)}
      {extra>0 && <span className="more" onClick={()=>onView&&onView(from+show.length)}>+{extra}</span>}
    </div>; };
  if(!big) return thumbs(0);
  return <div style={{marginBottom:8}}>
    <span style={{display:'block',lineHeight:0,cursor:'pointer',position:'relative'}} onClick={()=>onView&&onView(0)}>
      <PhotoImg photo={list[0]} style={{width:'100%',maxHeight:210,objectFit:'cover',borderRadius:10,display:'block'}}/>
      {list.length>1 && <span className="pill" style={{position:'absolute',right:8,bottom:8,background:'rgba(0,0,0,.55)',color:'#fff'}}>📷 {list.length}</span>}
    </span>
    {list.length>1 && thumbs(1)}
  </div>;
}
/* Xem ảnh lớn — nhận 1 ảnh (photo) hoặc cả bộ (photos + index) để lật qua lại */
function PhotoLightbox({photo,photos,index,title,onClose}){
  const list=(photos&&photos.length?photos:(photo?[photo]:[])).filter(Boolean);
  const [i,setI]=useState(index||0);
  useEffect(()=>{ setI(index||0); },[index,photo,list.length]);
  if(!list.length) return null;
  const cur=i<list.length?i:0;
  return <div className="ov" onClick={onClose}><div style={{maxWidth:'94%'}} onClick={e=>e.stopPropagation()}>
    {title && <div className="center" style={{color:'#fff',fontSize:13,marginBottom:6}}>{title}</div>}
    <PhotoImg photo={list[cur]} style={{maxWidth:'100%',maxHeight:'76vh',borderRadius:12,display:'block'}}/>
    <div className="center" style={{marginTop:10,display:'flex',gap:8,justifyContent:'center',alignItems:'center'}}>
      {list.length>1 && <button className="btn sm soft" onClick={()=>setI((cur-1+list.length)%list.length)}>‹</button>}
      {list.length>1 && <span style={{color:'#fff',fontSize:12.5,minWidth:44,textAlign:'center'}}>{cur+1}/{list.length}</span>}
      {list.length>1 && <button className="btn sm soft" onClick={()=>setI((cur+1)%list.length)}>›</button>}
      <button className="btn soft" onClick={onClose}>Đóng</button>
    </div>
  </div></div>;
}

/* Thẻ "🧸 Chơi với con hôm nay" đã gỡ — nội dung nuôi con nay chỉ nằm ở app Sóc (soc/). */
function NowCard({people,go}){
  const [routine]=useLocal('ju.routine',DEFAULT_ROUTINE);
  const [,setTick]=useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setTick(t=>t+1),60000); return ()=>clearInterval(iv); },[]);
  const norm=(b)=> (b.both!=null||b.a!=null||b.b!=null)?b:{id:b.id,t:b.t,both:b.act||''};
  const toMin=(t)=>{ const p=(t||'').split(':'); return p.length<2?-1:(+p[0])*60+(+p[1]); };
  const list=(routine||[]).map(norm).filter(b=>toMin(b.t)>=0).sort((a,b)=>toMin(a.t)-toMin(b.t));
  if(!list.length) return null;
  const now=new Date(); const nm=now.getHours()*60+now.getMinutes(); const nowHM=pad(now.getHours())+':'+pad(now.getMinutes());
  let cur=null,next=null;
  for(let i=0;i<list.length;i++){ if(toMin(list[i].t)<=nm) cur=list[i]; else { next=list[i]; break; } }
  const nextTxt=(b)=> b? (b.both||[b.a,b.b].filter(Boolean).join(' / ')||'') : '';
  return (
    <div className="ju-now" onClick={()=>go('us')} style={{cursor:'pointer',margin:'12px 16px',padding:'14px 16px 14px 17px',borderRadius:16,background:'var(--card)',color:'var(--text)',border:'1px solid var(--line)',borderLeft:'3px solid var(--primary)'}}>
      <div style={{display:'flex',alignItems:'center',gap:6}}><span className="now-lbl" style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--muted)'}}>Bây giờ nên làm</span><span style={{flex:1}}></span><span style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>{nowHM}{cur?' · khung '+cur.t:''}</span></div>
      {cur ? (
        (cur.both!=null && cur.both!=='')
          ? <div style={{marginTop:8,fontSize:16,fontWeight:700}}>👫 {cur.both}</div>
          : <div style={{marginTop:8,display:'flex',gap:10}}>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>{people.a.avatar} {people.a.name}</div><div style={{fontSize:14,fontWeight:700,marginTop:1}}>{cur.a||'—'}</div></div>
              <div style={{width:1,background:'var(--line)'}}></div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>{people.b.avatar} {people.b.name}</div><div style={{fontSize:14,fontWeight:700,marginTop:1}}>{cur.b||'—'}</div></div>
            </div>
      ) : <div style={{marginTop:8,fontSize:14,fontWeight:600,color:'var(--muted)'}}>🌅 Ngày mới sắp bắt đầu…</div>}
      {next && <div style={{marginTop:9,paddingTop:8,borderTop:'1px solid var(--line)',fontSize:12.5,color:'var(--muted)'}}>⏭️ Tiếp theo · {next.t}: <b style={{color:'var(--text)'}}>{nextTxt(next)}</b></div>}
    </div>
  );
}
function TodosCard({go}){
  const [items]=useLocal('ju.todos',[]);
  const rank=(k)=>({cao:0,vua:1,thap:2}[k]!=null?{cao:0,vua:1,thap:2}[k]:1);
  const col=(k)=>({cao:'#e25b5b',vua:'#e0a341',thap:'#5bb36a'}[k]||'#e0a341');
  const active=items.filter(x=>!x.done).sort((a,b)=>rank(a.priority)-rank(b.priority)||(a.due||'9').localeCompare(b.due||'9'));
  return (
    <div className="card">
      <div className="row" style={{cursor:'pointer'}} onClick={()=>go('us')}><span className="hc-title">✅ Việc cần làm</span><span className="grow"></span><span className="hc-act">{active.length} việc ›</span></div>
      {active.length===0 && <div className="muted" style={{fontSize:12.5,marginTop:6}}>🎉 Hết việc cần làm!</div>}
      {active.slice(0,4).map(x=>{ const dd=x.due?daysFromToday(x.due):null;
        return <div key={x.id} className="row" style={{padding:'4px 0',gap:8,cursor:'pointer'}} onClick={()=>go('us')}>
          <span style={{width:8,height:8,borderRadius:8,background:col(x.priority),flex:'0 0 auto'}}></span>
          <span className="grow" style={{fontSize:14}}>{x.title}</span>
          {x.due && <span className="muted" style={{fontSize:11}}>{dd!=null&&dd<0?'trễ':dd===0?'hôm nay':fmtDateVN(x.due)}</span>}
        </div>; })}
      {active.length>4 && <div className="muted" style={{fontSize:11,marginTop:4,cursor:'pointer'}} onClick={()=>go('us')}>+{active.length-4} việc nữa ›</div>}
    </div>
  );
}
function SavingsMini({go}){
  const [tips]=useLocal('ju.saveTips',{});
  const [custom]=useLocal('ju.saveCustom',[]);
  const all=SAVE_TIPS.concat(custom||[]); const done=all.filter(t=>tips[t]).length;
  return (
    <div className="card" onClick={()=>go('us')} style={{cursor:'pointer'}}>
      <div className="row"><span className="hc-title">🐷 Tiết kiệm</span><span className="grow"></span><span className="hc-act">đang áp dụng {done}/{all.length}</span></div>
      <div className="prog" style={{marginTop:6}}><i style={{width:(all.length?done/all.length*100:0)+'%'}}></i></div>
    </div>
  );
}
const HOME_CARDS=[
  ['now','🗓️ Bây giờ nên làm'],
  ['partnerwish','💛 Điều nửa kia mong'],
  ['cook','🍳 Bếp nhà mình'],
  ['fun','🎲 Phân vân (ăn gì/làm gì)'],
  ['anger','😤 Đang cáu / lo lắng'],
  ['reminders','🔔 Nhắc nhở hôm nay'],
  ['upcoming','⏳ Sắp tới (2 tuần)'],
  ['todos','✅ Việc cần làm'],
  ['onthisday','📆 Ngày này năm ngoái'],
  ['mood','🙂 Tâm trạng'],
  ['challenge','🎯 Thử thách đôi'],
  ['habits','✅ Thói quen chung'],
  ['lovejar','🫙 Lọ yêu thương'],
  ['lastnote','💌 Lời nhắn mới'],
  ['stats','📊 Thống kê nhanh'],
  ['weather','🌤️ Thời tiết hôm nay',true],
  ['question','❓ Câu hỏi mỗi ngày',true],
  ['quiz','💞 Đố vui cặp đôi',true],
  ['checkin','📝 Check-in tuần',true],
  ['savings','🐷 Tiến độ tiết kiệm',true],
];
const HOME_DEFAULT_OFF=HOME_CARDS.filter(c=>c[2]).map(c=>c[0]);
function homeOrder(cfg){ const order=(cfg&&cfg.order&&cfg.order.length)?cfg.order:HOME_CARDS.map(c=>c[0]);
  const keys=[]; order.forEach(k=>{ if(!keys.includes(k)&&HOME_CARDS.some(c=>c[0]===k)) keys.push(k); });
  HOME_CARDS.forEach(c=>{ if(!keys.includes(c[0])) keys.push(c[0]); }); return keys; }
function HomeSettings(){
  const [cfg,setCfg]=useLocal('ju.homecfg',{hidden:[]});
  const hidden=cfg.hidden||[];
  const keys=homeOrder(cfg);
  const label=(k)=>((HOME_CARDS.find(c=>c[0]===k)||[])[1]||k);
  const toggle=(k)=>{ const h=hidden.includes(k)?hidden.filter(x=>x!==k):[...hidden,k]; setCfg({...cfg,hidden:h}); };
  const move=(k,dir)=>{ const ks=keys.slice(); const i=ks.indexOf(k); const j=i+dir; if(j<0||j>=ks.length) return; const t=ks[i]; ks[i]=ks[j]; ks[j]=t; setCfg({...cfg,order:ks}); };
  return (
    <Collapse id="prof-home" title="🏠 Tuỳ chỉnh Trang chủ" defaultOpen={false}>
      <div className="card">
        <div className="muted" style={{fontSize:12.5,marginBottom:6}}>Bật/tắt & sắp xếp thứ tự các thẻ bằng nút ▲▼.</div>
        {keys.map((k,i)=>(
          <div key={k} className="row" style={{padding:'6px 0',borderBottom:'1px solid var(--line)',gap:4}}>
            <button className="iconbtn" style={{opacity:i===0?.3:1}} aria-label="Lên" onClick={()=>move(k,-1)}><Ic n="len" size={16}/></button>
            <button className="iconbtn" style={{opacity:i===keys.length-1?.3:1}} aria-label="Xuống" onClick={()=>move(k,1)}><Ic n="xuong" size={16}/></button>
            <span className="grow" style={{fontSize:14,marginLeft:4}}>{label(k)}</span>
            <button className="pill" onClick={()=>toggle(k)} style={{background:hidden.includes(k)?'var(--bg)':'var(--good)',color:hidden.includes(k)?'var(--muted)':'#fff',border:hidden.includes(k)?'1px solid var(--line)':'none'}}>{hidden.includes(k)?'Ẩn':'Hiện'}</button>
          </div>
        ))}
        {(cfg.order&&cfg.order.length>0) && <button className="muted" style={{fontSize:11,marginTop:8}} onClick={()=>setCfg({...cfg,order:[]})}>↩︎ Về thứ tự mặc định</button>}
      </div>
    </Collapse>
  );
}

/* (Đã gỡ mục "Nguồn thời tiết" — luôn dùng open-meteo miễn phí, không cần API key) */

const FEEDBACK_EMAIL='huyneo1101@gmail.com';
function FeedbackForm({people,me}){
  const [kind,setKind]=useState('feature');
  const [text,setText]=useState('');
  const send=()=>{
    if(!text.trim()) return;
    const subject=kind==='feature'?'Just Us - Góp ý tính năng':'Just Us - Nhu cầu / vấn đề';
    const body='Từ: '+(people[me]?.name||me)+'\n\n'+text.trim();
    window.location.href='mailto:'+FEEDBACK_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  };
  return (
    <div className="card">
      <div className="hc-body" style={{marginBottom:8}}>Muốn app có thêm tính năng gì, hay đang gặp khó khăn/vấn đề gì khi dùng — gửi thẳng cho người làm app nhé.</div>
      <div className="row" style={{gap:8,marginBottom:8}}>
        <button className={'btn sm grow '+(kind==='feature'?'':'soft')} onClick={()=>setKind('feature')}>💡 Gợi ý tính năng</button>
        <button className={'btn sm grow '+(kind==='issue'?'':'soft')} onClick={()=>setKind('issue')}>⚠️ Nhu cầu / vấn đề</button>
      </div>
      <textarea className="inp" style={{minHeight:110}}
        placeholder={kind==='feature'?'Bạn muốn app có thêm tính năng gì?':'Bạn đang gặp khó khăn/vấn đề gì khi dùng app?'}
        value={text} onChange={e=>setText(e.target.value)}/>
      <button className="btn" style={{marginTop:8}} onClick={send} disabled={!text.trim()}>📧 Gửi góp ý</button>
      <div className="muted" style={{fontSize:11,marginTop:8}}>Bấm gửi sẽ mở ứng dụng email trên máy, đã điền sẵn nội dung — bạn chỉ cần bấm gửi trong app email.</div>
    </div>
  );
}
/* ============ Tab: Hồ sơ ============ */
function Profile({setup,setSetup,people,me,setMe,flash}){
  const [photos,setPhotos]=useLocal('ju.photos',[]);
  const [editP,setEditP]=useState(false);
  const fileRef=useRef(null);
  const [addPhoto,setAddPhoto]=useState(false);
  const [viewer,setViewer]=useState(null);

  const onFile=async(e)=>{
    const f=e.target.files[0]; if(!f) return;
    e.target.value='';
    if(Cloud.connected()){
      flash('Đang tải ảnh lên…');
      try{
        const path=await Cloud.uploadPhoto(f);
        setPhotos(prev=>[{id:uid(),path,caption:'',by:me,date:todayISO()},...prev]);
        flash('Đã thêm ảnh 📷');
      }catch(err){ flash('Tải ảnh lỗi: '+(err.message||err)); }
    }else{
      if(f.size>2.5*1024*1024){ flash('Ảnh nặng (>2.5MB) — đăng nhập để lưu lên đám mây thay vì máy.'); }
      const r=new FileReader();
      r.onload=()=>{ setPhotos(prev=>[{id:uid(),src:r.result,caption:'',by:me,date:todayISO()},...prev]); flash('Đã thêm ảnh (cục bộ) 📷'); };
      r.readAsDataURL(f);
    }
  };
  const addUrl=(url,cap)=>{ if(!url.trim())return; setPhotos(prev=>[{id:uid(),src:url,caption:cap,by:me,date:todayISO()},...prev]); setAddPhoto(false); };
  const delPhoto=(p)=>{ if(confirm('Xoá ảnh này?')){ if(p.path) Cloud.deletePhoto(p.path); setPhotos(prev=>prev.filter(x=>x.id!==p.id)); } };

  const exportData=()=>{
    const dump={};
    SYNC_KEYS.forEach(k=>{ const v=store.get(k,null); if(v!=null) dump[k]=v; });
    const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='justus-backup-'+todayISO()+'.json';
    a.click();
    flash('Đã xuất file sao lưu 💾');
  };
  const exportYearbook=()=>{
    const g=(k,d)=>store.get(k,d)||d;
    const esc=(s)=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const loveDays=setup.loveDate?Math.max(0,(daysFromToday(setup.loveDate)||0)*-1):0;
    const timeline=g('ju.timeline',[]).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const jar=g('ju.lovejar',[]), notes=g('ju.notes',[]), photos=g('ju.photos',[]),
      spots=g('ju.spots',[]), bucket=g('ju.bucket',[]), food=g('ju.food',[]);
    const stat=(n,l)=>'<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>';
    const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      +'<title>Kỷ yếu '+esc(setup.a.name)+' &amp; '+esc(setup.b.name)+'</title><style>'
      +'body{font-family:ui-serif,"New York",Cambria,"Noto Serif","Times New Roman",Times,serif;max-width:720px;margin:0 auto;padding:42px 28px;color:#3a2b31;background:#fff}'
      +'h1{text-align:center;color:#e85d8a;margin:0 0 4px;font-size:30px}.sub{text-align:center;color:#a07f88;margin:0 0 26px}'
      +'h2{color:#e85d8a;border-bottom:2px solid #ffd0de;padding-bottom:4px;margin-top:30px}'
      +'.grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}'
      +'.stat{background:#fff0f4;border:1px solid #ffd0de;border-radius:12px;padding:10px 16px;text-align:center;min-width:90px}'
      +'.stat b{display:block;font-size:22px;color:#e85d8a}.stat span{font-size:12px;color:#8a6c74}'
      +'.mile{margin:10px 0;padding:8px 14px;border-left:3px solid #e85d8a;background:#fff6f9;border-radius:0 8px 8px 0}'
      +'.mile .d{font-size:12px;color:#a07f88}.q{font-style:italic;color:#6a4f57;margin:6px 0}'
      +'@media print{body{padding:10px}}</style></head><body>'
      +'<h1>💞 '+esc(setup.a.name)+' &amp; '+esc(setup.b.name)+'</h1>'
      +'<p class="sub">'+(setup.loveDate?('Bên nhau từ '+fmtDateVN(setup.loveDate)+' · '+loveDays.toLocaleString('vi-VN')+' ngày'):'Kỷ yếu tình yêu')+'</p>'
      +'<div class="grid">'+stat(loveDays.toLocaleString('vi-VN'),'ngày bên nhau')+stat(timeline.length,'cột mốc')+stat(notes.length,'lời nhắn')+stat(photos.length,'ảnh chung')+stat(spots.filter(s=>s.done).length,'chỗ đã đi')+stat(food.filter(f=>f.done).length,'món đã thử')+stat(bucket.filter(b=>b.done).length,'điều đã làm')+'</div>'
      +(timeline.length?('<h2>🕰️ Dòng thời gian</h2>'+timeline.map(t=>'<div class="mile"><div class="d">'+fmtDateVN(t.date)+'</div><b>'+(t.icon||'💗')+' '+esc(t.title)+'</b>'+(t.note?'<div class="q">'+esc(t.note)+'</div>':'')+'</div>').join('')):'')
      +(jar.length?('<h2>🫙 Lọ yêu thương</h2>'+jar.slice(0,20).map(j=>'<div class="q">“'+esc(j.text)+'”</div>').join('')):'')
      +'<p class="sub" style="margin-top:36px">Tạo từ Just Us 💞 · '+fmtDateVN(todayISO())+'</p>'
      +'</body></html>';
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='ky-yeu-'+todayISO()+'.html';
    a.click();
    flash('Đã xuất kỷ yếu 📖 — mở file rồi Ctrl/⌘+P để lưu PDF');
  };
  const importRef=useRef(null);
  const onImport=(e)=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const data=JSON.parse(r.result);
        Object.keys(data).forEach(k=>store.set(k,data[k]));
        flash('Đã khôi phục! Đang tải lại…');
        setTimeout(()=>location.reload(),700);
      }catch(err){ flash('File không hợp lệ.'); }
    };
    r.readAsText(f); e.target.value='';
  };

  const PinSection=()=>{
    const [v,setV]=useState('');
    if(setup.pin){
      return <button className="btn soft" onClick={()=>{ if(confirm('Tắt khoá PIN?')) setSetup({...setup,pin:''}); }}>🔓 Tắt khoá PIN</button>;
    }
    return (
      <div className="row" style={{gap:8}}>
        <input className="inp grow" inputMode="numeric" maxLength={6} placeholder="Đặt mã PIN (4–6 số)" value={v} onChange={e=>setV(e.target.value.replace(/\D/g,''))}/>
        <button className="btn sm" onClick={()=>{ if(v.length>=4){ setSetup({...setup,pin:v}); flash('Đã bật khoá PIN 🔒'); setV(''); } }}>Bật</button>
      </div>
    );
  };

  return (
    <div>
      {/* Cặp đôi */}
      <div className="card center">
        <div style={{fontSize:40}}>{people.a.avatar} 💞 {people.b.avatar}</div>
        <div style={{fontWeight:800,fontSize:18,marginTop:6}}>{people.a.name} &amp; {people.b.name}</div>
        {setup.loveDate && <div className="muted" style={{fontSize:12.5}}>Yêu nhau từ {fmtDateVN(setup.loveDate)}</div>}
        <button className="btn soft sm" style={{marginTop:10}} onClick={()=>setEditP(true)}>✏️ Sửa thông tin cặp đôi</button>
      </div>

      {/* Cài app & gửi link cho nửa kia */}
      <InstallShare/>

      {/* Thống kê tình yêu */}
      <LoveStats setup={setup}/>

      {/* Huy hiệu thành tích */}
      <Achievements setup={setup}/>

      {/* Người đang dùng */}
      <Collapse id="prof-who" title="👤 Bạn là ai" defaultOpen={false}>
      <div className="card">
        <div className="row" style={{gap:8}}>
          <button className={'btn '+(me==='a'?'':'soft')} onClick={()=>setMe('a')}>{people.a.avatar} {people.a.name}</button>
          <button className={'btn '+(me==='b'?'':'soft')} onClick={()=>setMe('b')}>{people.b.avatar} {people.b.name}</button>
        </div>
        <div className="muted" style={{fontSize:12.5,marginTop:8}}>Chọn để biết ai thêm mục nào & thả tim. (Lựa chọn này riêng từng máy.)</div>
      </div>
      </Collapse>

      {/* Tài khoản & ghép đôi */}
      <AccountPanel flash={flash}/>

      {/* Ảnh chung */}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/>
      <Collapse id="prof-photos" title="📷 Ảnh chung" defaultOpen={false} right={<React.Fragment><button className="pill" onClick={()=>fileRef.current.click()}>＋ Tải ảnh</button><button className="pill" style={{marginLeft:6}} onClick={()=>setAddPhoto(true)}>🔗 Link</button></React.Fragment>}>
      {!Cloud.connected() && <div className="muted center" style={{fontSize:11,margin:'0 16px'}}>Đăng nhập & ghép đôi để ảnh được lưu an toàn trên đám mây và đồng bộ. Khi chưa đăng nhập, ảnh tải lên chỉ nằm trong máy này.</div>}
      {photos.length===0 && <div className="empty" style={{padding:'18px'}}>Chưa có ảnh chung nào.</div>}
      <div className="gallery">
        {photos.map(p=>(
          <div key={p.id} className="ph" onClick={()=>setViewer(p)}>
            <PhotoImg photo={p}/>
            {p.caption && <div className="cap">{p.caption}</div>}
          </div>
        ))}
      </div>
      {photos.length>0 && <div className="muted center" style={{fontSize:11}}>Chạm ảnh để xem lớn</div>}
      </Collapse>

      {viewer && (
        <div className="ov" style={{alignItems:'center'}} onClick={()=>setViewer(null)}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'94%',maxHeight:'90vh',textAlign:'center'}}>
            <PhotoImg photo={viewer} style={{maxWidth:'100%',maxHeight:'74vh',borderRadius:14,display:'block',margin:'0 auto'}}/>
            {viewer.caption && <div style={{color:'#fff',marginTop:8,fontSize:14}}>{viewer.caption}</div>}
            <div className="muted" style={{color:'#eee',fontSize:12.5,marginTop:4}}>{people[viewer.by]?.avatar} {people[viewer.by]?.name} · {fmtDateVN(viewer.date)}</div>
            <div className="row" style={{justifyContent:'center',gap:8,marginTop:12,flexWrap:'wrap'}}>
              <button className="btn soft sm" onClick={()=>setViewer(null)}>Đóng</button>
              <button className="btn sm" onClick={()=>{ setSetup({...setup,cover: viewer.path?{path:viewer.path}:{src:viewer.src}}); setViewer(null); flash('Đã đặt ảnh bìa 🖼️'); }}>🖼️ Làm ảnh bìa</button>
              <button className="btn sm" style={{background:'#e0436b'}} onClick={()=>{ delPhoto(viewer); setViewer(null); }}>🗑️ Xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* Sức khỏe (chuyển từ Tụi mình) */}
      <Collapse id="prof-health" title="🩺 Sức khỏe" defaultOpen={false}>
        <HealthTab people={people} me={me}/>
      </Collapse>

      {/* Bảng app của nhà mình — các phần đã tách thành app riêng, cùng origin nên chung localStorage */}
      <AppBoard/>
      {/* Theme */}
      <Collapse id="prof-theme" title="🎨 Giao diện đôi" defaultOpen={false}>
      <div className="card" style={{marginBottom:8}}>
        <div className="hc-body" style={{marginBottom:8}}>Chế độ sáng/tối</div>
        <div className="row" style={{gap:8}}>
          {[['light','☀️ Sáng'],['dark','🌙 Tối'],['system','🌗 Theo máy']].map(([k,l])=>(
            <button key={k} className={'btn sm grow '+((setup.darkMode||'light')===k?'':'soft')} onClick={()=>setSetup({...setup,darkMode:k})}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {THEMES.map(t=>(
            <button key={t.k} onClick={()=>{ applyTheme(t.k); setSetup({...setup,theme:t.k}); }}
              style={{padding:'12px 6px',borderRadius:14,border:setup.theme===t.k?'2.5px solid '+t.c:'1.5px solid var(--line)',
                background:'var(--bg)',fontWeight:700,fontSize:12.5}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:t.c,margin:'0 auto 6px'}}></div>{t.name}
            </button>
          ))}
        </div>
      </div>
      </Collapse>

      {/* Font chữ trang chủ */}
      <Collapse id="prof-homefont" title="🔤 Font chữ trang chủ" defaultOpen={false}>
      <div className="card">
        <div className="hc-body" style={{marginBottom:8}}>Chọn kiểu chữ cho Trang chủ (số ngày bên nhau vẫn giữ kiểu serif). Áp ngay khi chọn.</div>
        <div style={{display:'grid',gap:8}}>
          {HOME_FONTS.map(fn=>{ const on=(setup.homeFont||'bevn')===fn.k;
            return <button key={fn.k} onClick={()=>{ applyHomeFont(fn.k); setSetup({...setup,homeFont:fn.k}); }}
              style={{textAlign:'left',padding:'11px 13px',borderRadius:12,border:on?'2px solid var(--primary)':'1px solid var(--line)',background:'var(--bg)',fontFamily:fn.css}}>
              <div style={{fontWeight:700,fontSize:14}}>{fn.name}{on?' ✓':''}</div>
              <div style={{fontSize:12.5,opacity:.75,marginTop:2}}>Nhật ký của hai đứa · 1.234 ngày bên nhau 💗</div>
            </button>;
          })}
        </div>
      </div>
      </Collapse>

      {/* Tuỳ chỉnh Trang chủ */}
      <HomeSettings/>

      {/* Thông báo điện thoại */}
      <Collapse id="prof-noti" title="🔔 Thông báo" defaultOpen={false}>
      <NotiSettings flash={flash}/>
      </Collapse>

      {/* Giao diện: mục dài + sắp xếp menu */}
      <Collapse id="prof-ui" title="🎛️ Giao diện" defaultOpen={false}>
      <LongSectionsControl flash={flash}/>
      <MenuReorderSettings/>
      <DefaultTabSettings setup={setup} setSetup={setSetup}/>
      </Collapse>

      {/* Góp ý & báo vấn đề */}
      <Collapse id="prof-feedback" title="💡 Góp ý & báo vấn đề" defaultOpen={false}>
      <FeedbackForm people={people} me={me}/>
      </Collapse>

      {/* Sao lưu & bảo mật */}
      <Collapse id="prof-backup" title="💾 Sao lưu & bảo mật" defaultOpen={false}>
      <div className="card">
        <div className="muted" style={{fontSize:12.5,marginBottom:8}}>Dữ liệu chỉ nằm trong máy này. Nên xuất file để khỏi mất khi xoá cache hoặc đổi máy.</div>
        <div className="row" style={{gap:8}}>
          <button className="btn soft grow" onClick={exportData}>⬇️ Xuất sao lưu</button>
          <button className="btn soft grow" onClick={()=>importRef.current.click()}>⬆️ Khôi phục</button>
        </div>
        <input ref={importRef} type="file" accept="application/json" hidden onChange={onImport}/>
        <button className="btn soft" style={{marginTop:8}} onClick={exportYearbook}>📖 Xuất "Kỷ yếu" (in / PDF)</button>
        <div style={{marginTop:12}}><PinSection/></div>
      </div>
      </Collapse>

      <div className="card">
        <button className="btn ghost" style={{borderColor:'#e0436b',color:'#e0436b'}}
          onClick={async()=>{ if(confirm('Xoá TẤT CẢ dữ liệu trên máy này và bắt đầu lại? (Không xoá dữ liệu trên đám mây của cặp đôi.) Không thể hoàn tác.')){ try{await Cloud.signOut();}catch(e){} SYNC_KEYS.concat(['ju.couple','ju.me','ju.synced']).forEach(k=>store.del(k)); location.reload(); } }}>
          🗑️ Xoá toàn bộ & bắt đầu lại</button>
      </div>
      <div className="center muted" style={{fontSize:11,padding:'4px 0 14px'}}>Just Us · của riêng hai đứa 💞</div>

      {editP && <CoupleForm init={setup} onClose={()=>setEditP(false)} onSave={(s)=>{ setSetup(s); setEditP(false); }}/>}
      {addPhoto && (
        <Sheet title="Thêm ảnh qua link" onClose={()=>setAddPhoto(false)}>
          <PhotoUrlForm onSave={addUrl}/>
        </Sheet>
      )}
    </div>
  );
}
function PhotoUrlForm({onSave}){
  const [url,setUrl]=useState(''),[cap,setCap]=useState('');
  return (<div>
    <div className="field"><label>Link ảnh</label>
      <input className="inp" autoFocus value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…jpg"/></div>
    <div className="field"><label>Chú thích</label>
      <input className="inp" value={cap} onChange={e=>setCap(e.target.value)} placeholder="(tuỳ chọn)"/></div>
    <button className="btn" onClick={()=>onSave(url,cap)}>💾 Thêm ảnh</button>
  </div>);
}

function CoupleForm({init,onClose,onSave}){
  const [s,setS]=useState(()=>({...init}));
  const [pickAv,setPickAv]=useState(null); // 'a'|'b'|null
  const set=(path,v)=>{
    if(path==='aName') setS({...s,a:{...s.a,name:v}});
    else if(path==='bName') setS({...s,b:{...s.b,name:v}});
    else setS({...s,[path]:v});
  };
  return (
    <Sheet title="Thông tin cặp đôi" onClose={onClose}>
      <div className="row" style={{gap:10}}>
        <div className="grow">
          <div className="field"><label>Người 1</label>
            <input className="inp" value={s.a.name} onChange={e=>set('aName',e.target.value)}/></div>
          <button className="btn soft sm" onClick={()=>setPickAv(pickAv==='a'?null:'a')}>{s.a.avatar} đổi</button>
        </div>
        <div className="grow">
          <div className="field"><label>Người 2</label>
            <input className="inp" value={s.b.name} onChange={e=>set('bName',e.target.value)}/></div>
          <button className="btn soft sm" onClick={()=>setPickAv(pickAv==='b'?null:'b')}>{s.b.avatar} đổi</button>
        </div>
      </div>
      {pickAv && (
        <div className="emoji-row" style={{margin:'8px 0'}}>
          {AVATARS.map(a=><button key={a} className={s[pickAv].avatar===a?'on':''}
            onClick={()=>{ setS({...s,[pickAv]:{...s[pickAv],avatar:a}}); }}>{a}</button>)}
        </div>
      )}
      <div className="field" style={{marginTop:8}}><label>Ngày yêu nhau 💗</label>
        <input className="inp" type="date" value={s.loveDate||''} onChange={e=>set('loveDate',e.target.value)}/></div>
      <div className="field"><label>Ngày cưới 💍 (nếu có)</label>
        <input className="inp" type="date" value={s.weddingDate||''} onChange={e=>set('weddingDate',e.target.value)}/></div>
      <button className="btn" onClick={()=>onSave(s)}>💾 Lưu</button>
    </Sheet>
  );
}

/* ============ Onboarding ============ */
function Onboarding({onDone}){
  const [a,setA]=useState({name:'',avatar:'🧑'});
  const [b,setB]=useState({name:'',avatar:'👩'});
  const [loveDate,setLove]=useState('');
  const [step,setStep]=useState(0);
  const [pickAv,setPickAv]=useState(null);

  const finish=()=>{
    onDone({a:{name:a.name||'Anh',avatar:a.avatar}, b:{name:b.name||'Em',avatar:b.avatar},
      loveDate, weddingDate:'', theme:'sotay', me:'a', pin:''});
  };
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'24px'}}>
      <div className="center" style={{marginBottom:18}}>
        {/* Biểu trưng vẽ nét thay emoji: đây là màn ĐẦU TIÊN người mở app nhìn thấy,
            mà emoji đổi hình theo từng máy nên bộ mặt app mỗi máy một kiểu (luật 28, điều 6) */}
        <div style={{display:'flex',justifyContent:'center',marginBottom:2}}>
          <svg width="72" height="60" viewBox="0 0 72 60" aria-hidden="true">
            <path d="M27 54C27 54 6 39.4 6 24.4 6 16.4 12.2 10 20 10c4.6 0 8.7 2.2 11.3 5.7C33.9 12.2 38 10 42.6 10c7.8 0 14 6.4 14 14.4C56.6 39.4 35.6 54 35.6 54z"
                  fill="none" stroke="var(--heart,#e85d8a)" strokeWidth="3.2" strokeLinejoin="round"/>
            <path d="M46 46c8.4-6.6 20-17.4 20-27.2C66 12.4 61.6 8 56 8c-2.7 0-5.2 1-7 2.7"
                  fill="none" stroke="var(--heart,#e85d8a)" strokeWidth="3.2" strokeLinecap="round" opacity=".55"/>
          </svg>
        </div>
        <div className="brand" style={{justifyContent:'center',fontSize:26}}>Just <span className="heart">Us</span></div>
        <div className="muted" style={{marginTop:6}}>Không gian riêng của hai đứa mình</div>
      </div>

      {step===0 && (
        <div className="card">
          <h3 style={{marginTop:0}}>Hai bạn tên gì?</h3>
          <div className="field"><label>Người 1</label>
            <div className="row" style={{gap:8}}>
              <button className="iconbtn" style={{width:46,height:46,fontSize:20}} onClick={()=>setPickAv(pickAv==='a'?null:'a')}>{a.avatar}</button>
              <input className="inp grow" placeholder="VD: Anh" value={a.name} onChange={e=>setA({...a,name:e.target.value})}/>
            </div>
            {pickAv==='a' && <div className="emoji-row" style={{marginTop:8}}>{AVATARS.map(x=><button key={x} className={a.avatar===x?'on':''} onClick={()=>{setA({...a,avatar:x});setPickAv(null);}}>{x}</button>)}</div>}
          </div>
          <div className="field"><label>Người 2</label>
            <div className="row" style={{gap:8}}>
              <button className="iconbtn" style={{width:46,height:46,fontSize:20}} onClick={()=>setPickAv(pickAv==='b'?null:'b')}>{b.avatar}</button>
              <input className="inp grow" placeholder="VD: Em" value={b.name} onChange={e=>setB({...b,name:e.target.value})}/>
            </div>
            {pickAv==='b' && <div className="emoji-row" style={{marginTop:8}}>{AVATARS.map(x=><button key={x} className={b.avatar===x?'on':''} onClick={()=>{setB({...b,avatar:x});setPickAv(null);}}>{x}</button>)}</div>}
          </div>
          <button className="btn" onClick={()=>setStep(1)}>Tiếp tục →</button>
        </div>
      )}

      {step===1 && (
        <div className="card">
          <h3 style={{marginTop:0}}>Hai bạn yêu nhau từ ngày nào? 💗</h3>
          <div className="field"><input className="inp" type="date" value={loveDate} onChange={e=>setLove(e.target.value)}/></div>
          <div className="muted" style={{fontSize:12.5,marginBottom:12}}>Để app đếm số ngày hai đứa bên nhau (có thể bỏ qua, sửa sau).</div>
          <div className="row" style={{gap:8}}>
            <button className="btn soft grow" onClick={finish}>Bỏ qua</button>
            <button className="btn grow" onClick={finish}>Bắt đầu 💞</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ PIN lock ============ */
function PinLock({pin,onOk}){
  const [v,setV]=useState('');
  const [err,setErr]=useState(false);
  const check=(val)=>{ if(val===pin){ onOk(); } else { setErr(true); setTimeout(()=>{setErr(false);setV('');},500); } };
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:24}}>
      <div style={{fontSize:48}}>🔒</div>
      <div className="brand" style={{fontSize:24,margin:'8px 0'}}>Just <span className="heart">Us</span></div>
      <div className="muted" style={{marginBottom:16}}>Nhập mã PIN để mở</div>
      <input className="inp" inputMode="numeric" maxLength={6} autoFocus
        style={{textAlign:'center',fontSize:24,letterSpacing:8,width:180,borderColor:err?'#e0436b':'var(--line)'}}
        value={v} onChange={e=>{ const x=e.target.value.replace(/\D/g,''); setV(x); if(x.length>=pin.length) check(x); }}/>
      {err && <div className="danger" style={{marginTop:10}}>Sai PIN, thử lại</div>}
    </div>
  );
}

/* ============ APP ============ */
const SEARCH_SRC=[
  /* 06 mục dưới đây nằm trong WishTab, mà WishTab render bên trong DateTab (Hẹn hò →
     Ước mơ chung) chứ không phải tab Nhà mình. Khai 'us' thì bấm kết quả tìm kiếm nhảy
     sang Nhà mình — nơi không có mục nào chứa chúng, vì US_SEGS không khai gift/bucket/
     movie/watch/link/coupon. Sửa 12/08/2026. */
  {key:'ju.wish',cat:'🎁 Quà',tab:'date'},{key:'ju.bucket',cat:'🎯 Muốn làm',tab:'date'},
  {key:'ju.movies',cat:'🍿 Phim',tab:'date'},
  {key:'ju.watch',cat:'🎬 Xem·Đọc·Nghe',tab:'date'},{key:'ju.links',cat:'🔗 Link',tab:'date'},
  {key:'ju.coupons',cat:'🎟️ Phiếu',tab:'date'},{key:'ju.ideas',cat:'💡 Ý tưởng',tab:'date'},
  {key:'ju.food',cat:'🍜 Quán/Món',tab:'date'},
  {key:'ju.events',cat:'📅 Sự kiện',tab:'us'},{key:'ju.timeline',cat:'🕰️ Kỷ niệm',tab:'us'},
  {key:'ju.chores',cat:'🧹 Việc nhà',tab:'us'},{key:'ju.lovejar',cat:'🫙 Lọ yêu thương',tab:'home'},
  {key:'ju.todos',cat:'✅ Việc cần làm',tab:'us'},{key:'ju.dates',cat:'🎂 Ngày nhớ',tab:'us'},
  {key:'ju.goals',cat:'🎯 Mục tiêu',tab:'us'},
  {key:'ju.projects',cat:'📋 Dự án',tab:'us'},
];
function GlobalSearch({onClose,go}){
  const [q,setQ]=useState('');
  const results=useMemo(()=>{
    const s=q.trim().toLowerCase(); if(!s) return [];
    const out=[];
    SEARCH_SRC.forEach(src=>{ (store.get(src.key,[])||[]).forEach(it=>{ const title=it.title||it.text||it.name||''; const extra=((it.note||'')+' '+(it.address||'')).toLowerCase(); if(title.toLowerCase().includes(s)||extra.includes(s)) out.push({cat:src.cat,tab:src.tab,title}); }); });
    (store.get('ju.notes',[])||[]).forEach(n=>{ if((n.text||'').toLowerCase().includes(s)) out.push({cat:'💌 Nhắn nhau',tab:'us',title:n.text}); });
    return out.slice(0,40);
  },[q]);
  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()} style={{minHeight:'62vh'}}>
        <div className="x" onClick={onClose}>✕</div>
        <h3>🔎 Tìm kiếm</h3>
        <input className="inp" autoFocus placeholder="Tìm trong mọi danh sách…" value={q} onChange={e=>setQ(e.target.value)}/>
        {q.trim() && results.length===0 && <div className="empty" style={{padding:'24px'}}>Không tìm thấy “{q}”.</div>}
        <div style={{marginTop:10}}>
          {results.map((r,i)=>(
            <div key={i} className="item" style={{margin:'8px 0',cursor:'pointer'}} onClick={()=>{ go(r.tab); onClose(); }}>
              <div className="row"><span className="grow" style={{fontSize:14}}>{r.title}</span><span className="pill" style={{flex:'0 0 auto'}}>{r.cat}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUIZ_BANK=[
  {c:'couple',q:'Sau sinh, thường nên đợi bao lâu mới quan hệ lại?',o:['Ngay khi thấy khỏe','Khoảng 4–6 tuần & khi sản dịch đã hết','Đúng 6 tháng'],a:1,e:'Thường đợi ~4–6 tuần và hỏi bác sĩ ở lần khám sau sinh.'},
  {c:'couple',q:'Bài tập Kegel cho nam giúp gì?',o:['Tăng chiều cao','Khỏe cơ sàn chậu → kiểm soát tốt hơn','Giảm cân nhanh'],a:1,e:'Kegel làm khỏe cơ sàn chậu, cải thiện kiểm soát & phong độ.'},
  {c:'couple',q:'Khi hai vợ chồng lệch ham muốn, nên?',o:['Đổ lỗi cho nhau','Trò chuyện, tìm điểm chung, không tạo áp lực','Im lặng chịu đựng'],a:1,e:'Nhu cầu thay đổi theo sức khỏe/stress — quan trọng là chất lượng & thấu hiểu.'},
  {c:'couple',q:'Vì sao "màn dạo đầu" quan trọng?',o:['Giúp kết nối cảm xúc, cả hai thăng hoa hơn','Không cần thiết','Chỉ tốn thời gian'],a:0,e:'Kết nối cảm xúc trước khi gần gũi giúp cả hai tận hưởng trọn vẹn hơn.'},
  {c:'couple',q:'Ngày vợ dễ hứng khởi thường rơi vào lúc nào của chu kỳ?',o:['Ngày đèn đỏ','Quanh rụng trứng (giữa chu kỳ)','Ngay sát trước kỳ'],a:1,e:'Ham muốn thường tăng quanh thời điểm rụng trứng.'},
  {c:'couple',q:'Khi gặp "trục trặc" nhất thời, nên làm gì?',o:['Chê bai để cố gắng hơn','Thư giãn, chuyển sang âu yếm, thử lại lúc khác','Bỏ cuộc luôn'],a:1,e:'Càng áp lực càng khó — thả lỏng, đừng đổ lỗi.'},
  {c:'couple',q:'Sau khi gần gũi (afterglow), điều nên làm?',o:['Quay đi ngủ ngay','Ôm nhau, nói lời yêu thương vài phút','Bấm điện thoại'],a:1,e:'Khoảnh khắc sau đó rất quý để gắn kết & tâm sự.'},
  {c:'couple',q:'Thực phẩm nào hỗ trợ phong độ nam (giàu kẽm)?',o:['Đồ chiên rán','Hàu, thịt bò, hạt bí','Nước ngọt có ga'],a:1,e:'Kẽm hỗ trợ testosterone; omega-3 & rau xanh tốt cho tuần hoàn.'},
  {c:'couple',q:'Biện pháp tránh thai nào CÒN ngừa bệnh lây qua đường tình dục?',o:['Thuốc uống hằng ngày','Bao cao su','Vòng tránh thai'],a:1,e:'Chỉ bao cao su vừa tránh thai vừa giảm nguy cơ bệnh lây truyền.'},
  {c:'couple',q:'Gel bôi trơn hữu ích nhất khi nào?',o:['Bị cấm dùng','Khi khô rát (vd sau sinh, đang cho con bú)','Chỉ khi có bệnh'],a:1,e:'Nội tiết sau sinh/cho con bú dễ gây khô — gel giúp dễ chịu hơn.'},
  {c:'child',q:'Bé quanh 1–2 tuổi nên ngủ khoảng bao nhiêu/ngày (cả ngủ trưa)?',o:['6–8 tiếng','11–14 tiếng','18 tiếng'],a:1,e:'Trẻ nhỏ cần ngủ nhiều để phát triển não bộ & thể chất.'},
  {c:'child',q:'Khi bé ăn vạ (tantrum), cách nên làm?',o:['Quát mắng, dọa nạt','Bình tĩnh ở bên, gọi tên cảm xúc của bé','Chiều theo mọi đòi hỏi'],a:1,e:'Giữ bình tĩnh & gọi tên cảm xúc giúp bé học điều tiết.'},
  {c:'child',q:'Dấu hiệu bé sốt CẦN đi khám ngay?',o:['Li bì, co giật, phát ban, khó thở','Chỉ hơi ấm đầu','Bé vẫn chơi bình thường'],a:0,e:'Các dấu hiệu nặng cần khám ngay, không tự ý ở nhà.'},
  {c:'child',q:'Cho bé ăn dặm nên?',o:['Ép ăn thật nhiều','Đa dạng món, để bé tự khám phá, không ép','Chỉ cháo trắng'],a:1,e:'Không ép ăn; đa dạng giúp bé quen vị & đủ chất.'},
  {c:'child',q:'Bé đang tập nói, bố mẹ nên?',o:['Nói chuyện, đọc sách, gọi tên đồ vật cùng bé','Cho xem điện thoại nhiều','Không cần nói gì'],a:0,e:'Tương tác ngôn ngữ nhiều giúp bé phát triển lời nói.'},
  {c:'child',q:'Bé va đập đầu, dấu hiệu nguy hiểm?',o:['Nôn nhiều, lơ mơ, bất tỉnh','Khóc rồi nín, chơi lại bình thường','Chỉ có vết đỏ nhẹ'],a:0,e:'Nôn/lơ mơ/bất tỉnh sau va đập đầu cần đi khám ngay.'},
  {c:'child',q:'Thời gian xem màn hình cho trẻ nhỏ nên?',o:['Càng nhiều càng tốt','Hạn chế tối đa, ưu tiên chơi & vận động','Bắt buộc 5 tiếng/ngày'],a:1,e:'Trẻ nhỏ nên hạn chế màn hình, ưu tiên vận động & tương tác.'},
  {c:'child',q:'Cách dạy con tích cực & hiệu quả?',o:['Đòn roi','Khen hành vi tốt, đặt giới hạn nhất quán, làm gương','So sánh với con nhà khác'],a:1,e:'Kỷ luật tích cực + làm gương hiệu quả hơn đòn roi.'},
  {c:'comm',q:'Về quê tới nơi, nên chào ai trước?',o:['Người cùng lứa','Ông bà / người lớn tuổi trước','Không cần chào'],a:1,e:'Chào người lớn tuổi trước rồi mới tới người cùng lứa.'},
  {c:'comm',q:'Bị "ép rượu", cách từ chối khéo?',o:['Uống hết cho vừa lòng','Lý do sức khỏe/đang uống thuốc, nhấp môi + thêm nước lọc','Cãi nhau'],a:1,e:'Lý do sức khỏe rất dễ được chấp nhận; nhấp môi giữ phép.'},
  {c:'comm',q:'Trong mâm cỗ nên TRÁNH chủ đề gì?',o:['Thời tiết, món ăn','Lương thưởng, chuyện sinh con, so sánh con cháu','Chuyện vui gia đình'],a:1,e:'Tránh chủ đề nhạy cảm dễ gây khó xử trong mâm cỗ.'},
  {c:'comm',q:'Điều nào KHÔNG phải "ngôn ngữ yêu thương"?',o:['Lời khẳng định','Thời gian chất lượng','Cãi nhau to tiếng'],a:2,e:'5 NN yêu thương: lời khẳng định, thời gian, quà, hành động, cử chỉ âu yếm.'},
  {c:'comm',q:'Cãi nhau lành mạnh nên?',o:['Công kích cá nhân','Nói về vấn đề, dùng "em/anh cảm thấy…", không lôi chuyện cũ','Im lặng bỏ đi mãi'],a:1,e:'Tập trung vào vấn đề, tránh công kích & lôi quá khứ.'},
  {c:'comm',q:'Gặp câu hỏi khó ("bao giờ sinh thêm?"), nên?',o:['Cáu gắt','Cười xòa, trả lời ngắn, lái sang chuyện khác','Tranh cãi tới cùng'],a:1,e:'Cười xòa & lái chủ đề giúp giữ không khí vui vẻ.'},
  {c:'comm',q:'Cách ghi điểm với họ hàng?',o:['Ngồi không, bấm điện thoại','Chủ động phụ việc: bê mâm, rửa bát, trông trẻ','Chê món ăn'],a:1,e:'Chủ động phụ việc được lòng người lớn hơn ngồi không.'},
  {c:'comm',q:'Khi mừng tuổi/tặng quà người lớn nên?',o:['Đưa một tay, hờ hững','Đưa hai tay, kèm lời chúc','Đặt đại lên bàn'],a:1,e:'Đưa hai tay & nói lời chúc thể hiện sự kính trọng.'},
  {c:'spirit',q:'Ngày Rằm là ngày mấy âm lịch?',o:['Mùng 1','15','30'],a:1,e:'Rằm = ngày 15 âm lịch (trăng tròn).'},
  {c:'spirit',q:'Ông Công Ông Táo là ngày nào âm lịch?',o:['23 tháng Chạp (12)','Mùng 1 Tết','Rằm tháng 7'],a:0,e:'23 tháng Chạp tiễn Táo quân về trời.'},
  {c:'spirit',q:'Lễ Vu Lan (báo hiếu) vào?',o:['Rằm tháng Giêng','Rằm tháng Bảy','Rằm tháng Tám'],a:1,e:'Vu Lan là Rằm tháng 7 âm lịch.'},
  {c:'spirit',q:'Tết Trung Thu là ngày nào?',o:['15 tháng 8 âm','5 tháng 5 âm','10 tháng 3 âm'],a:0,e:'Trung Thu = 15 tháng 8 âm lịch.'},
  {c:'spirit',q:'Vía Thần Tài (nhiều người mua vàng) là?',o:['Mùng 10 tháng Giêng','Mùng 1 Tết','Rằm tháng Giêng'],a:0,e:'Vía Thần Tài mùng 10 tháng Giêng.'},
  {c:'spirit',q:'Trước khi tụng kinh nên?',o:['Ăn mặc luộm thuộm','Rửa tay, súc miệng, ăn mặc chỉnh tề, giữ tâm thanh tịnh','Vừa ăn vừa tụng'],a:1,e:'Giữ thân & tâm thanh tịnh trước khi tụng kinh.'},
  {c:'spirit',q:'Tết Đoan Ngọ ("giết sâu bọ") là?',o:['5 tháng 5 âm','3 tháng 3 âm','10 tháng 3 âm'],a:0,e:'Đoan Ngọ = mùng 5 tháng 5 âm lịch.'},
  {c:'spirit',q:'Giỗ Tổ Hùng Vương là ngày nào âm lịch?',o:['10 tháng 3','15 tháng 4','23 tháng Chạp'],a:0,e:'"Dù ai đi ngược về xuôi, nhớ ngày Giỗ Tổ mùng 10 tháng 3".'},
  {c:'health',q:'Người huyết áp cao nên hạn chế?',o:['Rau xanh','Muối, đồ mặn, mỡ động vật','Nước lọc'],a:1,e:'Giảm muối & mỡ động vật giúp kiểm soát huyết áp.'},
  {c:'health',q:'Người tiểu đường nên?',o:['Ăn nhiều đường','Hạn chế đường/tinh bột nhanh, chia nhỏ bữa','Bỏ hẳn bữa ăn'],a:1,e:'Kiểm soát đường huyết bằng chế độ ăn hợp lý, không bỏ bữa.'},
  {c:'health',q:'Sau khi gần gũi, để giảm viêm đường tiết niệu (nữ) nên?',o:['Nhịn tiểu','Đi tiểu & vệ sinh','Không cần làm gì'],a:1,e:'Đi tiểu sau đó giúp giảm nguy cơ viêm đường tiết niệu.'},
  {c:'health',q:'Người đau dạ dày nên tránh?',o:['Ăn đúng giờ, uống đủ nước','Đồ chua cay, rượu bia, bỏ bữa','Nhai kỹ'],a:1,e:'Đồ chua cay, rượu bia & bỏ bữa làm dạ dày nặng hơn.'},
  {c:'health',q:'Để ngủ ngon nên?',o:['Cà phê tối, lướt điện thoại khuya','Ngủ–dậy đúng giờ, tránh caffeine tối, phòng tối yên tĩnh','Ăn thật no sát giờ ngủ'],a:1,e:'Vệ sinh giấc ngủ tốt giúp ngủ sâu hơn.'},
  {c:'health',q:'Tiêm phòng HPV giúp?',o:['Ngừa cảm cúm','Giảm nguy cơ ung thư cổ tử cung & một số bệnh','Tăng chiều cao'],a:1,e:'HPV liên quan ung thư cổ tử cung; tiêm phòng giúp giảm nguy cơ.'},
  {c:'food',q:'Ngày "đèn đỏ" nên ăn gì cho ấm bụng, bổ máu?',o:['Đồ lạnh, nước đá','Món ấm bổ máu (thịt bò, gừng, canh nóng)','Đồ chua'],a:1,e:'Món ấm & bổ máu giúp dễ chịu hơn trong kỳ.'},
  {c:'food',q:'Bữa sáng đủ chất nên có?',o:['Chỉ cà phê','Tinh bột + đạm + rau/trái cây','Chỉ đồ ngọt'],a:1,e:'Cân đối tinh bột–đạm–vitamin cho năng lượng cả buổi.'},
  {c:'food',q:'Để giữ dinh dưỡng khi nấu rau nên?',o:['Luộc thật lâu','Nấu vừa chín tới, không quá lâu','Chiên ngập dầu'],a:1,e:'Nấu quá lâu làm mất vitamin trong rau.'},
  {c:'food',q:'Bảo quản đồ ăn thừa an toàn?',o:['Để ngoài qua đêm','Đậy kín, cho tủ lạnh sớm, hâm kỹ khi ăn lại','Trộn chung đồ sống & chín'],a:1,e:'Cho tủ lạnh sớm & hâm kỹ để tránh ngộ độc.'},
  {c:'food',q:'Nên uống bao nhiêu nước mỗi ngày (ước lượng)?',o:['Khoảng 1,5–2 lít','Nửa ly','Chỉ khi khát mới uống, càng ít càng tốt'],a:0,e:'Khoảng 1,5–2 lít/ngày, điều chỉnh theo thời tiết & vận động.'},
  {c:'money',q:'Nguyên tắc chia thu nhập 50/30/20 nghĩa là?',o:['50% tiết kiệm hết','50% thiết yếu / 30% mong muốn / 20% tiết kiệm','Tiêu hết, không để dành'],a:1,e:'50% nhu cầu thiết yếu, 30% mong muốn, 20% tiết kiệm/trả nợ.'},
  {c:'money',q:'Quỹ dự phòng nên bằng khoảng?',o:['1 ngày lương','3–6 tháng chi tiêu','10 năm lương'],a:1,e:'Quỹ khẩn cấp ~3–6 tháng chi tiêu giúp an tâm khi biến cố.'},
  {c:'money',q:'Mẹo mua sắm tiết kiệm?',o:['Mua theo cảm hứng','Lập danh sách, so giá, canh dịp sale','Trả góp mọi thứ'],a:1,e:'Danh sách + so giá + canh sale giúp không mua thừa.'},
  {c:'money',q:'Để không "vung tay quá trán" nên?',o:['Không ghi chép gì','Ghi lại chi tiêu & đặt ngân sách tháng','Giấu tiền khắp nơi'],a:1,e:'Ghi chi tiêu & đặt ngân sách giúp kiểm soát dòng tiền.'},
  {c:'money',q:'Khoản nợ nào nên ưu tiên trả trước?',o:['Nợ lãi cao (vd thẻ tín dụng)','Nợ lãi thấp nhất','Không cần trả nợ'],a:0,e:'Trả nợ lãi cao trước để giảm tiền lãi phải gánh.'},
];
function KnowledgeQuiz({onClose}){
  const [best,setBest]=useLocal('ju.quizKnow',{});
  const [stage,setStage]=useState('home');
  const [cat,setCat]=useState('all');
  const [qs,setQs]=useState([]);
  const [idx,setIdx]=useState(0);
  const [picked,setPicked]=useState(null);
  const [score,setScore]=useState(0);
  const CATS=[['all','🎲 Tất cả'],['couple','💞 Vợ chồng'],['child','👶 Nuôi con'],['comm','🕊️ Giao tiếp'],['spirit','🪷 Tâm linh'],['health','🩺 Sức khỏe'],['food','🍱 Bếp núc'],['money','💰 Tiền nong']];
  const catLabel=(c)=>(CATS.find(x=>x[0]===c)||[0,''])[1];
  const start=(c)=>{ const pool=c==='all'?QUIZ_BANK:QUIZ_BANK.filter(x=>x.c===c); const sh=[...pool].sort(()=>Math.random()-0.5).slice(0,10); setCat(c); setQs(sh); setIdx(0); setScore(0); setPicked(null); setStage('play'); };
  const q=qs[idx];
  const answer=(i)=>{ if(picked!=null||!q) return; setPicked(i); if(i===q.a) setScore(s=>s+1); };
  const next=()=>{ if(idx+1>=qs.length){ const nb={...(best||{})}; if((nb[cat]||0)<score) nb[cat]=score; setBest(nb); setStage('done'); } else { setIdx(idx+1); setPicked(null); } };
  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()} style={{minHeight:'64vh'}}>
        <div className="x" onClick={onClose}>✕</div>
        <h3>🧠 Đố kiến thức gia đình</h3>
        {stage==='home' && <div>
          <div className="muted" style={{fontSize:12.5,marginBottom:10,lineHeight:1.5}}>Trắc nghiệm rút từ các bài viết & thông tin trong app: vợ chồng, nuôi con, giao tiếp, tâm linh, sức khỏe, bếp núc, tiền nong. Mỗi lượt 10 câu — chọn chủ đề để bắt đầu.</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {CATS.map(([c,l])=>(
              <button key={c} className="pill" style={{padding:'9px 12px',fontSize:12.5}} onClick={()=>start(c)}>{l}{best&&best[c]?<span style={{opacity:.65}}> · kỷ lục {best[c]}</span>:null}</button>
            ))}
          </div>
        </div>}
        {stage==='play' && q && <div>
          <div className="row"><span className="muted" style={{fontSize:12.5}}>{catLabel(cat)} · Câu {idx+1}/{qs.length}</span><span className="grow"></span><span className="pill">Điểm {score}</span></div>
          <div style={{fontSize:15,fontWeight:700,margin:'12px 0 10px',lineHeight:1.4}}>{q.q}</div>
          {q.o.map((opt,i)=>{ let bg='var(--card)'; if(picked!=null){ if(i===q.a) bg='var(--good)'; else if(i===picked) bg='#e0436b'; } const white=picked!=null&&(i===q.a||i===picked);
            return <button key={i} onClick={()=>answer(i)} style={{display:'block',width:'100%',textAlign:'left',padding:'11px 13px',margin:'6px 0',borderRadius:12,border:'1.5px solid var(--line)',background:bg,color:white?'#fff':'var(--text)',fontSize:14,fontWeight:600,lineHeight:1.4}}>{opt}</button>;
          })}
          {picked!=null && <div>
            <div style={{fontSize:12.5,marginTop:8,padding:'9px 11px',background:'var(--chip)',borderRadius:10,lineHeight:1.5}}>{picked===q.a?'✅ Chính xác! ':'❌ Chưa đúng. '}{q.e||''}</div>
            <button className="btn" style={{marginTop:12}} onClick={next}>{idx+1>=qs.length?'Xem kết quả →':'Câu tiếp →'}</button>
          </div>}
        </div>}
        {stage==='done' && <div style={{textAlign:'center',padding:'12px 0'}}>
          <div style={{fontSize:42}}>{score>=8?'🏆':score>=5?'👏':'💪'}</div>
          <div style={{fontSize:22,fontWeight:800,marginTop:6}}>{score}/{qs.length} điểm</div>
          <div className="muted" style={{fontSize:12.5,margin:'6px 0 4px',lineHeight:1.5}}>{score>=8?'Xuất sắc! Kiến thức gia đình vững ghê 🥰':score>=5?'Khá đấy! Ôn thêm chút nữa nhé.':'Cùng đọc thêm các bài trong app rồi thử lại nha 💗'}</div>
          {best&&best[cat]?<div className="muted" style={{fontSize:12.5}}>Kỷ lục {catLabel(cat)}: {best[cat]}/10</div>:null}
          <div className="row" style={{gap:8,marginTop:14}}>
            <button className="btn grow" onClick={()=>start(cat)}>🔁 Chơi lại</button>
            <button className="btn soft grow" onClick={()=>setStage('home')}>Đổi chủ đề</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
const MAIN_TABS=[['home','🏠','Tổ ấm'],['us','🏡','Nhà mình'],['talk','💞','Chúng mình'],['date','🗺️','Hẹn hò'],['me','🙋','Cá nhân']];
/* Icon nét cho thanh điều hướng (đồng bộ 1 độ dày) — emoji vẫn giữ cho nội dung */
function NavIcon({k}){
  const svg=(children)=>(<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>);
  switch(k){
    // Tổ ấm — Nhà + trái tim
    case 'home': return svg(<React.Fragment><path d="M4 11.2 12 4.5l8 6.7"/><path d="M6 10v9.5h12V10"/><path d="M12 17.3c-1.6-1.1-2.6-2-2.6-3.1 0-.9.7-1.5 1.5-1.5.6 0 1 .3 1.1.6.1-.3.5-.6 1.1-.6.8 0 1.5.6 1.5 1.5 0 1.1-1 2-2.6 3.1z"/></React.Fragment>);
    // Nhà mình — Các phòng (lưới 4 ô)
    case 'us': return svg(<React.Fragment><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></React.Fragment>);
    // Chúng mình — Hai trái tim
    case 'talk': return svg(<React.Fragment><path d="M9.5 15.5C6.7 13.6 5 12.1 5 10.1 5 8.6 6.1 7.5 7.6 7.5c.9 0 1.6.4 1.9 1 .3-.6 1-1 1.9-1 1.5 0 2.6 1.1 2.6 2.6 0 2-1.7 3.5-4.5 5.4z"/><path d="M15 18c-2.4-1.6-3.8-2.9-3.8-4.6 0-1.3.9-2.2 2.2-2.2.8 0 1.4.4 1.6.8.2-.4.8-.8 1.6-.8 1.3 0 2.2.9 2.2 2.2 0 1.7-1.4 3-3.8 4.6z"/></React.Fragment>);
    // Hẹn hò — Hai ly cụng nhau
    case 'date': return svg(<React.Fragment><path d="M5.6 4h4l-.4 3.3a1.6 1.6 0 0 1-3.2 0z"/><path d="M7.6 8.9V19M5.6 19h4"/><path d="M14.4 4h4l-.4 3.3a1.6 1.6 0 0 1-3.2 0z"/><path d="M16.4 8.9V19M14.4 19h4"/></React.Fragment>);
    // Cá nhân — Người + trái tim
    case 'me': return svg(<React.Fragment><circle cx="10" cy="8" r="3.3"/><path d="M4 19a6 6 0 0 1 11-3.2"/><path d="M18 21c-1.6-1.1-2.7-2-2.7-3.2 0-.9.7-1.6 1.6-1.6.6 0 1 .3 1.1.6.1-.3.5-.6 1.1-.6.9 0 1.6.7 1.6 1.6 0 1.2-1.1 2.1-2.7 3.2z"/></React.Fragment>);
    default: return null;
  }
}
function App(){
  const [setup,setSetup]=useLocal('ju.setup',null);
  // Máy nào từng đặt tab mặc định là 'child' (tab Sóc đã gỡ) thì lùi về Tổ ấm, không hiện màn trắng.
  const [tab,setTab]=useState(()=>{ const t=(setup&&setup.defaultTab)||'home'; return MAIN_TABS.some(x=>x[0]===t)?t:'home'; });
  const [me,setMe]=useState(()=> store.get('ju.me', (store.get('ju.setup',{})||{}).me || 'a'));
  const [flashMsg,setFlashMsg]=useState('');
  const [showSearch,setShowSearch]=useState(false);
  const [showQuiz,setShowQuiz]=useState(false);
  const [unlocked,setUnlocked]=useState(false);
  const flash=(m)=>{ setFlashMsg(m); setTimeout(()=>setFlashMsg(''),2200); };

  // áp theme khi setup đổi
  useEffect(()=>{ if(setup?.theme) applyTheme(setup.theme); },[setup?.theme]);
  // Skin Sổ tay: gán góc nghiêng ngẫu nhiên cho thẻ/dòng, cả khi nội dung đổi.
  useEffect(()=>{
    if((setup?.theme)!=='sotay') return;
    const root=document.querySelector('.app')||document.body;
    let raf=0; const run=()=>{ raf=0; applySotayTilt(root); };
    const schedule=()=>{ if(!raf) raf=requestAnimationFrame(run); };
    applySotayTilt(root);
    const mo=new MutationObserver(schedule);
    mo.observe(root,{childList:true,subtree:true});
    return ()=>{ mo.disconnect(); if(raf) cancelAnimationFrame(raf); };
  },[setup?.theme, tab]);
  // Đổi sang skin "Sổ tay" một lần cho máy đang dùng (vẫn đổi lại được trong Cài đặt).
  useEffect(()=>{ if(setup && !store.get('ju.skinSotay',0)){ store.set('ju.skinSotay',1); if((setup.theme||'')!=='sotay') setSetup({...setup,theme:'sotay'}); } },[setup]);
  useEffect(()=>{ applyHomeFont(setup?.homeFont||'bevn'); },[setup?.homeFont]);
  // sáng/tối — 'system' thì theo dõi cả khi điện thoại đổi chế độ
  useEffect(()=>{
    const mode=setup?.darkMode||'light';
    applyDarkMode(mode);
    if(mode!=='system'||typeof window.matchMedia!=='function') return;
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    const onChange=()=>applyDarkMode('system');
    if(mq.addEventListener) mq.addEventListener('change',onChange); else mq.addListener(onChange);
    return ()=>{ if(mq.removeEventListener) mq.removeEventListener('change',onChange); else mq.removeListener(onChange); };
  },[setup?.darkMode]);
  // "me" là riêng từng máy (không đồng bộ)
  useEffect(()=>{ store.set('ju.me',me); },[me]);
  // khởi tạo auth + tự kết nối lại đám mây khi mở app
  useEffect(()=>{ if(sbClient()) Cloud.init(); },[]);

  if(!setup){
    return <Onboarding onDone={(s)=>{ setSetup(s); setMe('a'); applyTheme(s.theme); }}/>;
  }
  if(setup.pin && !unlocked){
    return <PinLock pin={setup.pin} onOk={()=>setUnlocked(true)}/>;
  }

  const people={a:setup.a, b:setup.b};

  return (
    <div className="app">
      <NotiRunner/>
      {flashMsg && <div className="flash">{flashMsg}</div>}
      <div className="topbar">
        <div className="brand">Just <span className="heart">Us</span></div>
        <span className="grow"></span>
        <button className="iconbtn" onClick={()=>setShowSearch(true)} title="Tìm kiếm">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/></svg>
        </button>
        <button className="iconbtn" onClick={()=>setShowQuiz(true)} title="Đố kiến thức gia đình">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.6.8.6 1.2v.4h5.8v-.4c0-.4.1-.8.6-1.2A6 6 0 0 0 12 3z"/></svg>
        </button>
        <button className="who" aria-label={'Đang dùng máy với vai '+people[me].name+', chạm để đổi sang người kia'} onClick={()=>setMe(me==='a'?'b':'a')}>
          <span className="av">{people[me].avatar}</span>{people[me].name} ⇄
        </button>
      </div>
      {showSearch && <GlobalSearch go={setTab} onClose={()=>setShowSearch(false)}/>}
      {showQuiz && <KnowledgeQuiz onClose={()=>setShowQuiz(false)}/>}

      {tab==='home' && <Home setup={setup} setSetup={setSetup} people={people} me={me} go={setTab}/>}
      {tab==='date' && <DateTab people={people} me={me} flash={flash}/>}
      {tab==='us' && <UsTab people={people} me={me} flash={flash}/>}
      {tab==='talk' && <TalkTab people={people} me={me} flash={flash}/>}
      {tab==='me' && <Profile setup={setup} setSetup={setSetup} people={people} me={me} setMe={setMe} flash={flash}/>}

      <div className="nav">
        {MAIN_TABS.map(([k,ic,l])=>(
          <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>
            <span className="ic"><NavIcon k={k}/></span>{l}
          </button>
        ))}
      </div>
    </div>
  );
}

window.__JU_OK=true;
const __root=ReactDOM.createRoot(document.getElementById('root'));
const __mount=()=>{ try{ __root.render(<App/>); }catch(e){ console.error(e); } };
const __dataReady=window.__JU_DATA_READY||Promise.resolve();
// Không để dữ liệu chậm giữ màn hình trắng: quá 5s thì vẽ trước, dữ liệu về sau vẽ lại (React giữ nguyên state).
Promise.race([__dataReady,new Promise(r=>setTimeout(r,5000))]).then(__mount,__mount);
__dataReady.then(__mount,()=>{});
