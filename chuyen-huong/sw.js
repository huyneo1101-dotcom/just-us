/* qd377-chuyen-huong — service worker tự gỡ: máy còn giữ bản cũ thì lần kiểm cập nhật kế
   tiếp nhận file này, xoá cache của app, tự gỡ đăng ký rồi nạp lại trang (ra trang chuyển hướng). */
self.addEventListener('install',function(){ self.skipWaiting(); });
self.addEventListener('activate',function(e){ e.waitUntil((async function(){
  for(const k of await caches.keys()){ if(k.indexOf('justus-')===0) await caches.delete(k); }
  await self.registration.unregister();
  for(const c of await self.clients.matchAll({type:'window'})){ try{ c.navigate(c.url); }catch(_){} }
})()); });
