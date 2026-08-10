
const {useState,useEffect,useRef,useMemo} = React;

/* ============ store — DÙNG CHUNG khoá 'ju.*' với app Just Us (cùng origin),
   nên lá số tử vi / thần số đã lưu trước đây vẫn còn nguyên ============ */
const mem={};
const store={
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return (k in mem)?mem[k]:d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){ mem[k]=v; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){ delete mem[k]; } }
};
function useLocal(key,initial){
  const [v,setV]=useState(()=>store.get(key,initial));
  useEffect(()=>{ store.set(key,v); },[key,v]);
  return [v,setV];
}

/* ============ helpers ============ */
const pad=(n)=> n<10?'0'+n:''+n;
function todayISO(){ const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function fmtDateVN(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return d+'/'+m+'/'+y; }
function dayNumber(){ const d=new Date(); return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000); }
/* BỐN HÀM DƯỚI ĐÂY BỊ BỎ QUÊN LÚC TÁCH APP KHỎI JUST US (09/08/2026) và được chép lại
   ngày 10/08/2026. Không có chúng thì cả Tử vi lẫn Thần số ném ReferenceError ngay ở
   lần bấm nút đầu tiên — mà nút vẫn vẽ ra bình thường nên nhìn không ra là hỏng.
   Bản gốc nằm ở ../nguon/app.jsx của Just Us; sửa bên đó thì chép lại cả bên này. */
const uid=()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function openUrl(u){ let x=(u||'').trim(); if(!x) return; if(!/^https?:\/\//i.test(x)) x='https://'+x; window.open(x,'_blank','noreferrer'); }
function celebrate(emojis){
  try{ if(navigator.vibrate) navigator.vibrate([28,40,28]); }catch(e){}
  const set=emojis||['🪷','✨','🌸'];
  for(let i=0;i<20;i++){
    const el=document.createElement('div');
    el.textContent=set[Math.floor(Math.random()*set.length)];
    el.style.cssText='position:fixed;z-index:200;left:'+(Math.random()*100)+'vw;top:-30px;font-size:'+(16+Math.random()*18)+'px;pointer-events:none;will-change:transform,opacity;transition:transform 1.7s cubic-bezier(.3,.7,.4,1), opacity 1.7s;';
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.style.transform='translateY('+(105+Math.random()*15)+'vh) rotate('+(Math.random()*540-270)+'deg)'; el.style.opacity='0'; });
    setTimeout(()=>{ try{el.remove();}catch(e){} },1800);
  }
}

/* ===== Âm lịch → Dương lịch (thuật toán Hồ Ngọc Đức) ===== */
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

/* ============ UI dùng chung ============ */
function Collapse({id,title,defaultOpen=true,right,children}){
  const k='ju.col.'+id;
  const [open,setOpen]=useState(()=>{ const v=store.get(k,null); if(v!=null) return !!v; const gd=store.get('ju.colDefault',null); return gd!=null?!!gd:defaultOpen; });
  const toggle=()=>setOpen(o=>{ store.set(k,!o); return !o; });
  return (
    <div className="collapse">
      <div className="sec-title">
        <span className="col-h" onClick={toggle}><span className="col-chev">{open?'▾':'▸'}</span> {title}</span>
        <span className="grow"></span>{right}
      </div>
      {open && <div className="col-body">{children}</div>}
    </div>
  );
}
function Sheet({title,onClose,children}){
  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="x" onClick={onClose}>✕</div>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/* ============ Nội dung tâm linh (chuyển từ Just Us sang) ============ */
const VAN_KHAN=JUD.VAN_KHAN;
const SUTRAS=JUD.SUTRAS;
const VEG_RESTAURANTS=[
  {n:'Chay Vị Lai',a:'177 Bùi Thị Xuân, Hai Bà Trưng',r:4.4,p:'75.000–300.000đ/món · buffet ~250.000đ/người'},
  {n:'Veggie Castle',a:'7 Yên Ninh, Ba Đình (& Ngọc Khánh, Âu Cơ)',r:4.5,p:'Buffet 90.000đ/người (thứ 3: 70.000đ)'},
  {n:'Ưu Đàm Chay',a:'55 Nguyễn Du, Hai Bà Trưng',r:4.4,p:'60.000–285.000đ/món'},
  {n:'Buffet Chay An Lạc',a:'109 Trần Hưng Đạo, Hoàn Kiếm',r:4.2},
  {n:'Tịnh Thực Quán',a:'43A Nguyên Hồng, Đống Đa',r:4.4,p:'100.000–150.000đ/người'},
  {n:'Buffet Chay Hương Thiền',a:'261 Xã Đàn, Đống Đa',r:4.2,p:'150.000đ/người (trẻ 1–1,3m: 80.000đ)'},
  {n:'Sadhu Buffet Chay',a:'Tầng 3 Lotte Mall Tây Hồ, 272 Võ Chí Công',r:4.5},
  {n:'D\'ve Buffet Chay',a:'83 Mai Hắc Đế, Hai Bà Trưng',r:4.3},
  {n:'Cơm Chay Nàng Tấm',a:'79A Trần Hưng Đạo, Hoàn Kiếm',r:4.3},
  {n:'Tuệ Tâm Quán',a:'Ngõ 71 Láng Hạ, Ba Đình',r:4.3},
  {n:'Om Tara Vegan',a:'Golden Palm, 21 Lê Văn Lương, Thanh Xuân',r:4.4},
  {n:'Peace Vegan',a:'Ngõ 54 Nguyễn Khuyến, Hà Đông',r:4.5},
  {n:'Phúc Nguyên Hưng',a:'Ngõ 140 Tố Hữu, Hà Đông',r:4.4},
  {n:'Loving Hut',a:'Nhiều cơ sở (Cầu Giấy, Hai Bà Trưng…)',r:4.3},
  {n:'Aum Vegetarian',a:'34 Hàng Bài, Hoàn Kiếm',r:4.5},
  {n:'Trúc Lâm Trai',a:'39 Lê Ngọc Hân, Hai Bà Trưng',r:4.3},
  {n:'Cơm chay Bồ Đề Tâm',a:'Nhiều cơ sở, Hà Nội',r:4.2},
  {n:'Cơm chay Thanh Đạm',a:'Nhiều cơ sở, Hà Nội',r:4.1},
  {n:'An Nhiên Vegan Garden',a:'Khu vực Tây Hồ',r:4.3},
  {n:'Chay Cực Lạc',a:'9 ngõ 295 Thụy Khuê, Ba Đình',p:'150.000–250.000đ/người'},
  {n:'Diệu Tâm',a:'Số 4 ngõ 59 Dương Khuê, Cầu Giấy',p:'40.000–100.000đ/người'},
  {n:'Quán Chay Minh Tâm',a:'Ngõ 213 Xã Đàn, Đống Đa',p:'Bình dân (pizza chay ~80.000đ/phần)'},
  {n:'Nhà hàng Chay Ahimsa',a:'6 Trung Liệt, Đống Đa',p:'30.000–200.000đ/người'},
  {n:'Buffet Chay Định Thức',a:'11 ngõ 4 Đặng Văn Ngữ, Trung Tự, Đống Đa',p:'Từ 99.000đ/người'},
  {n:'Chay Cồ Hồng - EZ Veggie',a:'189 Kim Hoa, Phương Liên, Đống Đa',p:'Từ 25.000đ/món'},
  {n:'Cơm Chay Âu Lạc (Liên Hoa)',a:'277 ngõ Văn Chương, Đống Đa',p:'Bình dân'},
];
const CO_GIO=[
  {n:'🍚 Xôi gấc',r:'Nguyên liệu: 1kg nếp, 1 quả gấc chín, 1 thìa rượu trắng, đường, muối, dầu ăn.\n1) Ngâm nếp 6–8h, để ráo.\n2) Lấy thịt gấc bóp với rượu trắng cho lên màu đỏ.\n3) Trộn gấc + nếp + chút muối, để 30 phút.\n4) Đồ xôi ~40 phút; gần chín rưới dầu + đường, đảo đều, đồ thêm 5 phút cho bóng.'},
  {n:'🐔 Gà luộc cánh tiên',r:'Nguyên liệu: 1 gà ta ~1.5kg, gừng, hành, muối, lá chanh.\n1) Buộc gà dáng cánh tiên, cho vào nồi nước LẠNH ngập gà + gừng + hành + muối.\n2) Đun tới sôi lăn tăn thì hạ nhỏ, luộc 20–25 phút (không sôi mạnh kẻo nứt da).\n3) Tắt bếp ngâm thêm 10 phút, vớt thả nước đá cho da giòn vàng.\n4) Chặt bày đĩa, rắc lá chanh thái chỉ; chấm muối tiêu chanh.'},
  {n:'🥢 Nem rán',r:'Nguyên liệu: thịt vai xay, miến, mộc nhĩ, nấm hương, cà rốt, hành tây, trứng, giá, bánh đa nem.\n1) Ngâm miến/mộc nhĩ/nấm rồi thái nhỏ; cà rốt, hành tây băm.\n2) Trộn tất cả với thịt + 1 trứng + gia vị, để 15 phút.\n3) Cuốn chặt tay; nhúng bánh đa qua nước pha chút giấm cho giòn.\n4) Rán ngập dầu lửa vừa tới vàng; rán lại lần 2 trước khi ăn cho giòn lâu.'},
  {n:'🍲 Canh măng khô móng giò',r:'Nguyên liệu: măng khô, móng giò, hành, gia vị.\n1) Măng khô ngâm nước vo gạo 1–2 ngày, luộc thay nước 2–3 lần cho hết đắng, xé sợi.\n2) Móng giò chặt khúc, chần qua, hầm ~40 phút.\n3) Xào măng với chút mắm cho ngấm rồi cho vào nồi hầm thêm 20 phút.\n4) Nêm vừa, rắc hành lá (có thể thêm mọc).'},
  {n:'🍜 Miến xào lòng gà',r:'Nguyên liệu: miến, lòng mề gà, mộc nhĩ, cà rốt, hành tây, giá, hành lá.\n1) Miến ngâm mềm cắt ngắn; lòng mề bóp muối gừng, thái miếng.\n2) Xào lòng mề cho săn, trút ra.\n3) Xào mộc nhĩ + cà rốt + hành tây, cho miến + chút mắm/dầu hào đảo nhanh.\n4) Cho lòng mề + giá + hành lá, đảo đều nêm vừa.'},
  {n:'🍥 Giò lụa (bày đĩa)',r:'Giò lụa mua ở hàng uy tín, thái khoanh vừa, bày xếp cánh hoa. (Tự làm: giò sống quết nhuyễn với nước mắm ngon, gói lá chuối, luộc ~45 phút.)'},
  {n:'🥗 Nộm su hào cà rốt',r:'Nguyên liệu: su hào, cà rốt, lạc rang, rau thơm (tôm/thịt tuỳ chọn).\n1) Su hào + cà rốt thái sợi, bóp muối 10 phút rồi vắt ráo.\n2) Pha nước trộn: mắm + đường + chanh + tỏi ớt.\n3) Trộn rau củ + nước trộn + rau thơm, rắc lạc rang giã dập.'},
  {n:'🥩 Thịt đông',r:'Nguyên liệu: chân giò + bì, mộc nhĩ, hạt tiêu, nước mắm.\n1) Thịt chân giò + bì thái miếng, chần qua.\n2) Hầm với nước mắm + tiêu ~1 giờ cho nhừ, thêm mộc nhĩ nấu 10 phút.\n3) Múc ra bát để nguội rồi cho ngăn mát; bì tiết gelatin đông lại. Ăn kèm dưa hành.'},
  {n:'🍮 Chè kho đậu xanh',r:'Đậu xanh đãi vỏ hấp chín, xay mịn; sên với đường + chút dầu tới dẻo quánh; ép khuôn, rắc vừng. Món tráng miệng truyền thống trên mâm cỗ.'},
];
const CO_TET=[
  {n:'🍃 Bánh chưng',r:'Nguyên liệu: nếp, đậu xanh, thịt ba chỉ, lá dong, lạt.\n1) Ngâm nếp + đậu xanh; thịt ướp muối tiêu.\n2) Gói: lá dong xếp khuôn → nếp → đậu → thịt → đậu → nếp, gói vuông buộc lạt.\n3) Luộc 8–10 giờ, châm nước sôi khi cạn.\n4) Vớt ra rửa, ép ráo cho chắc bánh. (Bận thì đặt mua bánh ngon.)'},
  {n:'🥓 Giò xào (giò thủ)',r:'Nguyên liệu: tai + thịt thủ + lưỡi heo, mộc nhĩ, hạt tiêu, nước mắm.\n1) Luộc sơ tai/thủ, thái mỏng.\n2) Xào săn với nước mắm + tiêu + mộc nhĩ tới dính keo.\n3) Gói chặt trong lá chuối/khuôn, ép vật nặng, để nguội đông lại. Thái khoanh bày đĩa.'},
  {n:'🥩 Thịt đông',r:'Nguyên liệu: chân giò + bì, mộc nhĩ, hạt tiêu, nước mắm.\n1) Thịt + bì thái miếng, chần qua.\n2) Hầm với mắm + tiêu ~1 giờ, thêm mộc nhĩ nấu 10 phút.\n3) Để nguội rồi cho ngăn mát cho đông. Ăn kèm dưa hành, cơm nóng.'},
  {n:'🧅 Dưa hành muối',r:'Nguyên liệu: hành củ, muối, đường, giấm.\n1) Hành bóc vỏ, ngâm nước vo gạo + muối 1 ngày cho bớt hăng, để ráo.\n2) Đun nước muối chua ngọt (muối + đường + giấm) để nguội.\n3) Xếp hành vào lọ, đổ ngập, nén chặt; 5–7 ngày chua giòn. Ăn kèm bánh chưng, thịt đông.'},
  {n:'🍲 Canh bóng thả',r:'Nguyên liệu: bóng bì, tôm, giò sống, su hào, cà rốt, súp lơ, nấm hương, nước dùng gà.\n1) Bóng bì ngâm mềm, bóp gừng rượu cho hết mùi, cắt miếng.\n2) Rau củ tỉa hoa, chần sơ; giò sống viên nhỏ (mọc).\n3) Nấu nước dùng gà trong, thả rau củ + bóng + mọc + tôm, nêm vừa, rắc rau mùi.'},
  {n:'🍲 Canh măng móng giò',r:'Măng khô ngâm & luộc thay nước cho hết đắng rồi xé sợi; móng giò hầm mềm; xào măng cho ngấm rồi hầm chung; nêm vừa, rắc hành. Món canh không thể thiếu ngày Tết.'},
  {n:'🐔 Gà luộc lá chanh',r:'Gà ta luộc nước lạnh + gừng hành, sôi lăn tăn 20–25 phút, ngâm 10 phút rồi thả nước đá cho da giòn. Chặt bày, rắc lá chanh thái chỉ, chấm muối tiêu chanh.'},
  {n:'🥢 Nem rán',r:'Nhân: thịt xay + miến + mộc nhĩ + nấm + cà rốt + hành tây + trứng. Cuốn chặt, nhúng bánh đa qua nước giấm loãng, rán 2 lửa cho giòn lâu. Chấm nước mắm chua ngọt.'},
  {n:'🍚 Xôi gấc',r:'Nếp ngâm trộn thịt gấc (bóp rượu trắng) + muối, đồ ~40 phút, rưới dầu + đường cho bóng đỏ. Màu đỏ may mắn đầu năm.'},
  {n:'🥗 Nộm gà xé phay',r:'Gà luộc xé; hành tây + rau răm + hoa chuối/bắp cải thái mỏng; trộn nước mắm chua ngọt tỏi ớt, rắc lạc rang. Món khai vị đỡ ngán ngày Tết.'},
  {n:'🍬 Mứt & hạt Tết',r:'Mâm tiếp khách: mứt gừng/dừa/bí, hạt dưa, hạt bí, ô mai, trà sen. (Thường mua sẵn; bày đĩa đẹp đón khách.)'},
];
const TV_CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const TV_CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const TV_ANIMAL=['Chuột','Trâu','Hổ','Mèo','Rồng','Rắn','Ngựa','Dê','Khỉ','Gà','Chó','Lợn'];
const TV_NAPAM=['Hải Trung Kim','Lư Trung Hỏa','Đại Lâm Mộc','Lộ Bàng Thổ','Kiếm Phong Kim','Sơn Đầu Hỏa','Giản Hạ Thủy','Thành Đầu Thổ','Bạch Lạp Kim','Dương Liễu Mộc','Tuyền Trung Thủy','Ốc Thượng Thổ','Tích Lịch Hỏa','Tùng Bách Mộc','Trường Lưu Thủy','Sa Trung Kim','Sơn Hạ Hỏa','Bình Địa Mộc','Bích Thượng Thổ','Kim Bạch Kim','Phú Đăng Hỏa','Thiên Hà Thủy','Đại Trạch Thổ','Thoa Xuyến Kim','Tang Đố Mộc','Đại Khê Thủy','Sa Trung Thổ','Thiên Thượng Hỏa','Thạch Lựu Mộc','Đại Hải Thủy'];
const TV_TRAITS=['Thông minh, nhanh nhạy, khéo xoay xở, biết tiết kiệm.','Cần cù, kiên nhẫn, thật thà, chịu thương chịu khó.','Dũng cảm, quyết đoán, nhiệt huyết, yêu tự do.','Hiền hoà, tinh tế, khéo léo, yêu cái đẹp.','Bản lĩnh, tham vọng, uy tín, thích dẫn đầu.','Sâu sắc, khôn ngoan, trực giác tốt, có chút bí ẩn.','Năng động, phóng khoáng, nhiệt tình, thích khám phá.','Dịu dàng, nhân hậu, giàu nghệ thuật, sống tình cảm.','Linh hoạt, hài hước, thông minh, nhiều tài lẻ.','Chăm chỉ, cẩn thận, cầu toàn, thẳng thắn.','Trung thành, chính trực, tận tâm, đáng tin cậy.','Chân thành, rộng lượng, lạc quan, có phúc khí.'];
const TV_MENH={
  Kim:{mau:'Trắng, ghi, vàng ánh kim',huong:'Tây · Tây Bắc',hop:'Thổ (Thổ sinh Kim), Thủy',ky:'Hỏa (Hỏa khắc Kim)'},
  'Mộc':{mau:'Xanh lá, xanh lục',huong:'Đông · Đông Nam',hop:'Thủy (Thủy sinh Mộc), Hỏa',ky:'Kim (Kim khắc Mộc)'},
  'Thủy':{mau:'Xanh dương, đen',huong:'Bắc',hop:'Kim (Kim sinh Thủy), Mộc',ky:'Thổ (Thổ khắc Thủy)'},
  'Hỏa':{mau:'Đỏ, hồng, cam, tím',huong:'Nam',hop:'Mộc (Mộc sinh Hỏa), Thổ',ky:'Thủy (Thủy khắc Hỏa)'},
  'Thổ':{mau:'Vàng, nâu đất',huong:'Đông Bắc · Tây Nam',hop:'Hỏa (Hỏa sinh Thổ), Kim',ky:'Mộc (Mộc khắc Thổ)'},
};
function tvGroup(groups,ci){ const g=groups.find(x=>x.indexOf(ci)>=0)||[]; return g.filter(i=>i!==ci).map(i=>TV_CHI[i]); }
function luanTuVi(p){
  const parts=(p.date||'').split('-'); if(parts.length<3) return null;
  const Y=+parts[0],M=+parts[1],D=+parts[2]; if(!Y||!M||!D) return null;
  let ly;
  try{ ly=solar2Lunar(D,M,Y)[2]; }catch(_){ ly=Y; }
  const idx=((ly-4)%60+60)%60;
  const can=TV_CAN[idx%10], chiIdx=idx%12, chi=TV_CHI[chiIdx];
  const napAm=TV_NAPAM[Math.floor(idx/2)]||''; const menh=napAm.split(' ').pop();
  let gio=''; if(p.hour){ const h=+String(p.hour).split(':')[0]; if(!isNaN(h)) gio=TV_CHI[Math.floor(((h+1)%24)/2)]; }
  return {canChi:can+' '+chi, conGiap:TV_ANIMAL[chiIdx], conGiapFull:chi+' — '+TV_ANIMAL[chiIdx],
    napAm, menh, menhInfo:TV_MENH[menh]||{}, traits:TV_TRAITS[chiIdx]||'',
    tamHop:tvGroup([[8,0,4],[2,6,10],[5,9,1],[11,3,7]],chiIdx),
    tuXung:tvGroup([[0,6,3,9],[2,8,5,11],[4,10,1,7]],chiIdx), gio, lunarYear:ly};
}
function TuViReader(){
  const [items,setItems]=useLocal('ju.tuvi',[]);
  const [f,setF]=useState({name:'',date:'',hour:'',gender:'nam'});
  const add=()=>{ if(!f.name.trim()||!f.date) return; setItems([{id:uid(),name:f.name.trim(),date:f.date,hour:f.hour,gender:f.gender},...items]); setF({name:'',date:'',hour:'',gender:'nam'}); celebrate(['🔮','✨']); };
  const del=(id)=>{ if(confirm('Xoá lá số này?')) setItems(items.filter(x=>x.id!==id)); };
  const Row=({k,v})=> v? <div style={{display:'flex',gap:8,padding:'4px 0',fontSize:12.5}}><span className="muted" style={{flex:'0 0 88px'}}>{k}</span><span className="grow" style={{fontWeight:600}}>{v}</span></div> : null;
  return (
    <div>
      <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>🔮 Nhập ngày sinh để xem <b>can chi · con giáp · bản mệnh</b>, tuổi hợp/khắc, màu &amp; hướng hợp. Phần luận cơ bản, mang tính tham khảo — vui là chính 😊</div>
      <div className="card">
        <input className="inp" placeholder="Tên (vd: Anh, Vợ, Sóc…)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <div className="row" style={{gap:6,marginTop:8}}>
          <div style={{flex:1,minWidth:0}}><label className="muted" style={{fontSize:11}}>Ngày sinh (dương)</label><input className="inp" style={{minWidth:0}} type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></div>
          <div style={{width:104,flex:'0 0 auto'}}><label className="muted" style={{fontSize:11}}>Giờ sinh</label><input className="inp" style={{minWidth:0}} type="time" value={f.hour} onChange={e=>setF({...f,hour:e.target.value})}/></div>
        </div>
        <div className="row" style={{gap:6,marginTop:8}}>
          <select className="inp grow" style={{minWidth:0}} value={f.gender} onChange={e=>setF({...f,gender:e.target.value})}><option value="nam">♂ Nam</option><option value="nu">♀ Nữ</option></select>
          <button className="btn" style={{flex:'1 1 auto',width:'auto',minWidth:0,whiteSpace:'nowrap'}} onClick={add}>Xem tử vi</button>
        </div>
      </div>
      {items.length===0 && <div className="empty"><span className="big">🔮</span>Thêm ngày sinh của cả nhà để xem tử vi.</div>}
      {items.map(x=>{ const r=luanTuVi(x); if(!r) return null;
        return <div key={x.id} className="item">
          <div className="row"><b className="grow" style={{fontSize:14}}>{x.gender==='nu'?'♀':'♂'} {x.name}</b>
            <span className="pill" style={{background:'var(--chip)'}}>{r.canChi}</span>
            <button className="muted" onClick={()=>del(x.id)} style={{marginLeft:4}}>✕</button></div>
          <div className="muted" style={{fontSize:11,margin:'2px 0 6px'}}>{fmtDateVN(x.date)}{r.gio?' · giờ '+r.gio:''} · tuổi {r.conGiapFull}</div>
          <div style={{borderTop:'1px solid var(--line)',paddingTop:6}}>
            <Row k="Bản mệnh" v={r.napAm+' — hành '+r.menh}/>
            <Row k="Tính cách" v={r.traits}/>
            <Row k="Tam hợp" v={r.tamHop.join(', ')+' — hợp làm ăn, hôn nhân'}/>
            <Row k="Tứ hành xung" v={r.tuXung.join(', ')+' — nên tránh xung khắc'}/>
            <Row k="Màu hợp" v={r.menhInfo.mau}/>
            <Row k="Hướng hợp" v={r.menhInfo.huong}/>
            <Row k="Hợp mệnh" v={r.menhInfo.hop}/>
            <Row k="Kỵ mệnh" v={r.menhInfo.ky}/>
          </div>
          <button className="pill" style={{marginTop:8,cursor:'pointer'}} onClick={()=>openUrl('https://www.google.com/search?q='+encodeURIComponent('lập lá số tử vi '+fmtDateVN(x.date)+(x.hour?' giờ '+x.hour:'')+' '+(x.gender==='nu'?'nữ':'nam')))}>🔗 Lập lá số Tử Vi đầy đủ (12 cung, an sao)</button>
        </div>;
      })}
      <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>Lá số Tử Vi Đẩu Số đầy đủ (an sao 12 cung) khá phức tạp — bấm nút trên để lập chi tiết trên web chuyên tử vi.</div>
    </div>
  );
}
/* ===== Thần số học — chép từ Just Us ngày 10/08/2026 (bị bỏ quên lúc tách app).
   reduceNum giữ số bậc thầy 11/22/33 cho số chủ đạo, KHÔNG giữ cho năm cá nhân. ===== */
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
function ThanSoReader(){
  const [items,setItems]=useLocal('ju.thanso',[]);
  const [f,setF]=useState({name:'',date:''});
  const year=new Date().getFullYear();
  const add=()=>{ if(!f.name.trim()||!f.date) return; setItems([{id:uid(),name:f.name.trim(),date:f.date},...items]); setF({name:'',date:''}); celebrate(['🔢','✨']); };
  const del=(id)=>{ if(confirm('Xoá mục này?')) setItems(items.filter(x=>x.id!==id)); };
  return (
    <div>
      <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>🔢 Thần số học theo ngày sinh — <b>số chủ đạo</b> (đường đời), số ngày sinh và <b>năm cá nhân {year}</b>. Tham khảo cho vui 😊</div>
      <div className="card">
        <input className="inp" placeholder="Tên (vd: Anh, Vợ, Sóc…)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        {/* Ô ngày sinh phải khai min-width:0 — mặc định của input là min-width theo nội
            dung, nên trên máy hiện ngày kiểu mm/dd/yyyy nó đẩy nút Xem tràn khỏi thẻ. */}
        <div className="row" style={{gap:6,marginTop:8}}>
          <input className="inp grow" style={{minWidth:0}} type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
          {/* .btn khai width:100% nên trong hàng ngang phải trả lại width:auto, không thì
              nút giãn hết thẻ rồi tràn ra ngoài (đo 10/08/2026 trên khung 390px). */}
          <button className="btn" style={{flex:'0 0 auto',width:'auto',whiteSpace:'nowrap'}} onClick={add}>Xem số</button>
        </div>
      </div>
      {items.length===0 && <div className="empty"><span className="big">🔢</span>Thêm ngày sinh của cả nhà để xem thần số học.</div>}
      {items.map(x=>{ const r=thanSo(x.date,year); if(!r) return null; const m=NUM_MEAN[r.life]||{};
        return <div key={x.id} className="item">
          <div className="row"><b className="grow" style={{fontSize:14}}>{x.name}</b>
            <span className="muted" style={{fontSize:11}}>{fmtDateVN(x.date)}</span>
            <button className="muted" onClick={()=>del(x.id)} style={{marginLeft:6}}>✕</button></div>
          <div className="row" style={{marginTop:8,gap:12,alignItems:'center'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'var(--chip)',color:'var(--chip-tx)',display:'grid',placeItems:'center',fontSize:26,fontWeight:800,flex:'0 0 auto'}}>{r.life}</div>
            <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:700,letterSpacing:.4,textTransform:'uppercase',color:'var(--primary)'}}>Số chủ đạo (đường đời)</div>
              <div style={{fontSize:14,fontWeight:700}}>Số {r.life} · {m.t}</div></div>
          </div>
          <div style={{fontSize:12.5,marginTop:8,lineHeight:1.55}}><b style={{color:'var(--good)'}}>Điểm mạnh:</b> {m.g}</div>
          <div style={{fontSize:12.5,marginTop:3,lineHeight:1.55}} className="muted">{m.n}</div>
          <div style={{borderTop:'1px solid var(--line)',marginTop:8,paddingTop:7,display:'flex',gap:6,flexWrap:'wrap'}}>
            <span className="pill">🎂 Số ngày sinh: {r.birth}</span>
            <span className="pill" style={{background:'var(--chip)'}}>📅 Năm cá nhân {year}: {r.py}</span>
          </div>
          <div style={{fontSize:12.5,marginTop:6,lineHeight:1.5}} className="muted"><b>Năm {r.py}:</b> {PY_MEAN[r.py]}</div>
        </div>;
      })}
    </div>
  );
}
/* ===== Bộ icon vẽ nét (10/08/2026) =====
   Cố ý KHÔNG dùng emoji cho menu: emoji đổi hình theo hệ điều hành, lệch chân dòng và
   không nhận màu của tab đang chọn. SVG nhận `currentColor` nên đổi màu theo trạng thái. */
const Ic={
  lich:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/></svg>),
  kinh:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5S10 4.8 6.6 4.8c-1.2 0-2 .2-2.6.4v13c.6-.2 1.4-.4 2.6-.4C10 17.8 12 19.5 12 19.5s2-1.7 5.4-1.7c1.2 0 2 .2 2.6.4v-13c-.6-.2-1.4-.4-2.6-.4C14 5.2 12 6.5 12 6.5z"/><path d="M12 6.5v13"/></svg>),
  so:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/><path d="M18.5 15.5l.7 1.9 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7zM5.2 3.4l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4L3.3 5.3l1.4-.5z"/></svg>),
  chay:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18c0 4.4-4 7.6-9 7.6S3 16.4 3 12z"/><path d="M2 20.4h20"/><path d="M12 9.6c0-2.1 1.7-3.8 3.8-3.8 0 2.1-1.7 3.8-3.8 3.8z"/><path d="M12 9.6C12 8 10.7 6.7 9.1 6.7c0 1.6 1.3 2.9 2.9 2.9z"/><path d="M12 9.6V12"/></svg>),
};
function IcSlot({node}){ return <span className="tl-ic">{node}</span>; }

/* Bốn nhóm thay cho 07 viên chữ dàn ba hàng của bản cũ: mỗi nhóm là một việc
   ("hôm nay có lễ gì", "đọc gì", "xem số", "ăn gì"), mục con nằm trong nhóm. */
const TL_NHOM=[
  {k:'lich', ten:'Lịch lễ',   ic:Ic.lich, con:[{k:'le',   ten:'Ngày lễ sắp tới'}]},
  {k:'doc',  ten:'Kinh · Khấn',ic:Ic.kinh, con:[{k:'kinh', ten:'Kinh Phật'},{k:'khan', ten:'Văn khấn'}]},
  {k:'so',   ten:'Vận số',    ic:Ic.so,   con:[{k:'tuvi', ten:'Tử vi'},{k:'thanso', ten:'Thần số'}]},
  {k:'an',   ten:'Chay · Cỗ', ic:Ic.chay, con:[{k:'chay', ten:'Quán chay'},{k:'co', ten:'Mâm cỗ'}]},
];
const TL_NHOM_CUA={}; TL_NHOM.forEach(n=>n.con.forEach(c=>{ TL_NHOM_CUA[c.k]=n.k; }));

function SpiritualSection({tab,setTab}){
  const [read,setRead]=useState(null);
  /* Cửa sổ 30 ngày có lúc chỉ còn 02 mục (đo 10/08/2026), để lại nửa màn hình trắng
     trông như app hết dữ liệu. Ít quá thì nới ra 90 ngày và nói rõ đang xem bao xa. */
  const [coNhom,setCoNhom]=useState('gio');
  const days30=upcomingSpiritual(30);
  const rong=days30.length<5;
  const days=rong?upcomingSpiritual(90):days30;
  const mapUrl=(n,a)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(n+' '+a+' Hà Nội');
  const CHAY_ORIGIN='114 Nguyễn Khuyến, Văn Miếu, Đống Đa, Hà Nội';
  const dirUrl=(n,a)=>'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(CHAY_ORIGIN)+'&destination='+encodeURIComponent(n+' '+a+' Hà Nội')+'&travelmode=driving';
  return (
    <div>
      {tab==='le' && <DailySutra/>}
      {tab==='tuvi' && <TuViReader/>}
      {tab==='thanso' && <ThanSoReader/>}
      {tab==='le' && <div>
        <div className="sec-title">🪷 Mùng 1 · rằm · lễ trong {rong?90:30} ngày tới</div>
        {days.length===0 && <div className="empty"><span className="big">🗓️</span>Không có mùng 1, rằm hay ngày lễ nào trong 90 ngày tới.</div>}
        {days.slice(0,14).map((h,i)=>(
          <div key={i} className="item" style={{padding:'9px 13px'}}>
            <div className="row"><span style={{fontSize:18}}>{h.icon}</span>
              <span className="grow" style={{fontSize:14}}>{h.name}</span>
              <span className="pill">{h.d===0?'Hôm nay':h.d===1?'Mai':'còn '+h.d+'n'}</span></div>
            <div className="muted" style={{fontSize:11,marginTop:2}}>{fmtDateVN(h.date)} · {h.lunar} âm lịch</div>
          </div>
        ))}
      </div>}
      {tab==='kinh' && <div>
        <div className="muted center" style={{fontSize:12.5,margin:'10px 14px'}}>Những bài kinh / chú quan trọng nhất — chạm để đọc & tụng.</div>
        {SUTRAS.map((s,i)=>(
          <div key={i} className="item" style={{cursor:'pointer'}} onClick={()=>setRead(s)}>
            <div className="row"><b className="grow" style={{fontSize:14}}>{s.title}</b><span className="muted">đọc ›</span></div>
            {s.sub && <div className="muted" style={{fontSize:11,marginTop:2}}>{s.sub}</div>}
          </div>
        ))}
      </div>}
      {tab==='khan' && <div>
        <div className="muted center" style={{fontSize:11,margin:'10px 14px 4px'}}>Văn khấn theo phong tục — chạm để đọc, thay “……” bằng tên & địa chỉ gia chủ.</div>
        {/* Trước đây là 07 viên chữ dài ngắn khác nhau xếp dọc, nhìn rời rạc và lệch hẳn
            với tab Kinh Phật ngay cạnh. Nay dùng đúng một kiểu dòng cho cả hai tab. */}
        {VAN_KHAN.map((v,i)=>(
          <div key={i} className="item" style={{cursor:'pointer'}} onClick={()=>setRead(v)}>
            <div className="row"><b className="grow" style={{fontSize:14}}>{v.title}</b><span className="muted">đọc ›</span></div>
          </div>
        ))}
      </div>}
      {tab==='chay' && <div>
        <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>Quán chay ở Hà Nội · ⭐ điểm tham khảo — bấm <b>⭐ Đánh giá</b> để xem đúng quán trên Google Maps, bấm <b>🧭 Khoảng cách</b> để xem đường đi & km thực tế từ {CHAY_ORIGIN}.</div>
        {VEG_RESTAURANTS.slice().sort((a,b)=>(b.r||0)-(a.r||0)).map((r,i)=>(
          <div key={i} className="item">
            <div className="it-top"><h4>🍃 {r.n}</h4>{r.r?<span className="pill" style={{background:'var(--chip)'}}>⭐ {r.r.toFixed(1)}</span>:null}</div>
            <div className="muted" style={{fontSize:12.5,marginTop:2}}>📍 {r.a}</div>
            {r.p && <div className="muted" style={{fontSize:12.5,marginTop:2}}>💰 {r.p}</div>}
            <div className="it-meta"><span className="grow"></span>
              <a className="pill" href={mapUrl(r.n,r.a)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>⭐ Đánh giá</a>
              <a className="pill" href={dirUrl(r.n,r.a)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>🧭 Khoảng cách</a></div>
          </div>
        ))}
      </div>}
      {tab==='co' && <div>
        <div className="muted center" style={{fontSize:11,margin:'10px 14px'}}>Gợi ý mâm cỗ cúng truyền thống (Bắc Bộ) — chạm từng món để xem <b>công thức</b> & video.</div>
        {/* Hai mục gập cũ hiện ra như hai dòng chữ trần, không ai biết là bấm được.
            Nay là hai nút chọn rõ mặt, danh sách món đổi theo nút đang chọn. */}
        <div className="seg" role="tablist">
          {[{k:'gio',ten:'Ngày giỗ',ds:CO_GIO},{k:'tet',ten:'Tết',ds:CO_TET}].map(g=>(
            <button key={g.k} role="tab" aria-selected={coNhom===g.k} style={{flex:1}}
              className={coNhom===g.k?'on':''} onClick={()=>setCoNhom(g.k)}>{g.ten} · {g.ds.length} món</button>
          ))}
        </div>
        {(coNhom==='tet'?CO_TET:CO_GIO).map((d,i)=>(
          <div key={i} className="item" style={{cursor:'pointer',padding:'11px 13px'}}
            onClick={()=>setRead({title:d.n,sub:coNhom==='tet'?'Mâm cỗ Tết':'Mâm cỗ ngày giỗ',text:d.r,yt:d.n})}>
            <div className="row"><span className="grow" style={{fontSize:14}}>{d.n}</span><span className="muted" style={{fontSize:12.5}}>công thức ›</span></div>
          </div>
        ))}
      </div>}
      {read && <Sheet title={read.title} onClose={()=>setRead(null)}>
        {read.sub && <div className="muted" style={{fontSize:12.5,marginBottom:8}}>{read.sub}</div>}
        <div style={{whiteSpace:'pre-wrap',fontSize:14,lineHeight:1.7}}>{read.text}</div>
        {read.q && <a className="btn soft" style={{display:'block',textAlign:'center',marginTop:14,textDecoration:'none'}}
          href={'https://www.google.com/search?q='+encodeURIComponent(read.q)} target="_blank" rel="noreferrer">📖 Đọc / tụng toàn văn</a>}
        {read.yt && <a className="btn" style={{display:'block',textAlign:'center',marginTop:14,textDecoration:'none'}}
          href={'https://www.youtube.com/results?search_query='+encodeURIComponent('cách làm '+read.yt)} target="_blank" rel="noreferrer">🎬 Xem video nấu</a>}
      </Sheet>}
    </div>
  );
}
function DailySutra(){
  const [read,setRead]=useState(false);
  const s=SUTRAS[dayNumber()%SUTRAS.length];
  return (
    <div className="card">
      <div style={{cursor:'pointer'}} onClick={()=>setRead(true)}>
        <div className="row"><span className="hc-title">📿 Đọc kinh hôm nay</span><span className="grow"></span><span className="hc-act">đọc ›</span></div>
        <div className="hc-lead" style={{margin:'6px 0 0'}}>{s.title}</div>
        {s.sub && <div className="hc-body" style={{marginTop:3}}>{s.sub}</div>}
      </div>
      {read && <Sheet title={s.title} onClose={()=>setRead(false)}>
        {s.sub && <div className="muted" style={{fontSize:12.5,marginBottom:8}}>{s.sub}</div>}
        <div style={{whiteSpace:'pre-wrap',fontSize:14,lineHeight:1.7}}>{s.text}</div>
        {s.q && <a className="btn soft" style={{display:'block',textAlign:'center',marginTop:14,textDecoration:'none'}} href={'https://www.google.com/search?q='+encodeURIComponent(s.q)} target="_blank" rel="noreferrer">📖 Đọc / tụng toàn văn</a>}
      </Sheet>}
    </div>
  );
}

/* Ngày âm hôm nay đặt ngay dưới tên app: đây là thứ mở app ra là muốn biết, trước đây
   phải cuộn xuống danh sách 30 ngày mới đọc được. */
function amHomNay(){
  const d=new Date();
  const r=solar2Lunar(d.getDate(),d.getMonth()+1,d.getFullYear(),7);
  const ten=r[0]===1?'Mùng 1':r[0]===15?'Rằm':(r[0]+' âm');
  return ten+' tháng '+r[1]+(r[3]?' nhuận':'')+' · '+pad(d.getDate())+'/'+pad(d.getMonth()+1);
}
/* Giao diện đang chọn bên Just Us được lưu ở khoá 'ju.setup' của CÙNG origin. App con
   trước đây không đọc khoá này nên ai chọn nền tối bên kia, sang đây vẫn ra nền hồng
   sáng — không lỗi nào phát ra, chỉ là hai app của cùng một nhà nhìn như hai app lạ. */
function apDungGiaoDien(){
  try{
    const s=store.get('ju.setup',null)||{};
    const k=s.theme||'rose';
    [...document.body.classList].forEach(c=>{ if(c.indexOf('theme-')===0) document.body.classList.remove(c); });
    document.body.classList.add('theme-'+k);
    const mode=s.darkMode||'light';
    const toi = mode==='dark' || (mode==='system' && typeof window.matchMedia==='function' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('dark', toi);
    const bg=getComputedStyle(document.body).getPropertyValue('--bg').trim();
    const m=/^#([0-9a-f]{6})$/i.exec(bg);
    if(m){ const n=parseInt(m[1],16);
      const sang=(((n>>16)&255)*0.299+(((n>>8)&255))*0.587+(n&255)*0.114)/255;
      document.documentElement.style.colorScheme = sang<0.5 ? 'dark' : 'only light';
      const meta=document.querySelector('meta[name="theme-color"]');
      if(meta) meta.setAttribute('content', bg);
    }
  }catch(e){}
}
function App(){
  const [tab,setTab]=useState('le');
  useEffect(()=>{ apDungGiaoDien(); },[]);
  const nhomK=TL_NHOM_CUA[tab]||'lich';
  const nhom=TL_NHOM.find(n=>n.k===nhomK)||TL_NHOM[0];
  const am=amHomNay();
  const chon=(n)=>{ if(n.k!==nhomK) setTab(n.con[0].k); window.scrollTo({top:0,behavior:'smooth'}); };
  return (
    <div className="tl-app">
      <header className="tl-top">
        <div className="tl-bar">
          <a className="tl-ib" href="../index.html" aria-label="Về Just Us">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
          </a>
          <div className="tl-ttl"><b>{nhom.ten}</b><span>{am}</span></div>
          <span className="tl-ib tl-lotus" aria-hidden="true">🪷</span>
        </div>
        {nhom.con.length>1 && (
          <div className="tl-subs" role="tablist">
            {nhom.con.map(c=>(
              <button key={c.k} role="tab" aria-selected={tab===c.k}
                className={'tl-sub'+(tab===c.k?' on':'')} onClick={()=>setTab(c.k)}>{c.ten}</button>
            ))}
          </div>
        )}
      </header>
      <SpiritualSection tab={tab} setTab={setTab}/>
      <nav className="nav tl-dock">
        {TL_NHOM.map(n=>(
          <button key={n.k} className={n.k===nhomK?'on':''} onClick={()=>chon(n)} aria-label={n.ten}>
            <IcSlot node={n.ic}/><span>{n.ten}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

window.__TL_OK=true;
const __root=ReactDOM.createRoot(document.getElementById('root'));
const __mount=()=>{ try{ __root.render(<App/>); }catch(e){ console.error(e); } };
const __ready=window.__JU_DATA_READY||Promise.resolve();
Promise.race([__ready,new Promise(r=>setTimeout(r,5000))]).then(__mount,__mount);
__ready.then(__mount,()=>{});
