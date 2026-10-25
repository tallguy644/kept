/* Kept Pro+: automatic Uber and Lyft sync.
   The driver connects their Uber and Lyft accounts through Argyle (a secure connection service; Kept never sees the
   passwords). Argyle sends the trips to the Kept server (worker/), which adds them up per day. This file shows the
   "Automatic sync" section in More, opens Argyle's sign-in, and brings the daily totals into Kept.

   Merging never overwrites the driver's own numbers: each synced day remembers the last values that came from
   Uber/Lyft (s.sy). A field is only updated if it still holds that synced value (or is empty), so anything the driver
   typed in or corrected stays as they left it. Gas, tolls, maintenance and deposits are never touched.

   Nothing here runs until Pro+ is switched on in pro.js (or previewed with ?pro=plus / ?pro=plusoffer). */
(function(){
'use strict';
if(!window.keptPlusEnabled) return;
const SET=window.keptPlusSettings||{};
const demo=new URLSearchParams(location.search).get('plus')==='demo';
const ARGYLE_JS='https://plugin.argyle.com/argyle.web.v5.js';

/* ---------- Words ---------- */
const W={
en:{sec:'Automatic sync',connect:'Connect Uber & Lyft',connectSub:'Your days fill in on their own',manage:'Add or remove accounts',now:'Sync now',disc:'Disconnect',discArm:'Tap again to disconnect',
  stOff:'Not connected yet.',stWait:'Connected. Waiting for your first trips…',stLast:'Connected · last synced {t}',stSyncing:'Syncing…',justNow:'just now',
  needPlus:'Automatic Uber and Lyft sync is part of Kept Pro+.',signIn:'Sign in to your Kept account first, so your synced days follow you to every device.',
  opening:'Opening the secure Uber and Lyft sign-in…',connected:'Connected. Your trips will show up in a few minutes.',updated:'{n} days updated from Uber and Lyft.',upToDate:'Everything is up to date.',
  failed:'Couldn\'t reach the sync service. Try again later.',discDone:'Disconnected. Days already synced stay in Kept.',
  note:'Kept uses Argyle to connect to Uber and Lyft securely and never sees your Uber or Lyft password. Hours count time on trips, so edit a day to add waiting time. Anything you change on a synced day is kept.',synced:'Synced'},
es:{sec:'Sincronización automática',connect:'Conectar Uber y Lyft',connectSub:'Tus días se llenan solos',manage:'Agregar o quitar cuentas',now:'Sincronizar ahora',disc:'Desconectar',discArm:'Toca otra vez para desconectar',
  stOff:'Aún no está conectado.',stWait:'Conectado. Esperando tus primeros viajes…',stLast:'Conectado · última sincronización {t}',stSyncing:'Sincronizando…',justNow:'justo ahora',
  needPlus:'La sincronización automática con Uber y Lyft es parte de Kept Pro+.',signIn:'Primero inicia sesión en tu cuenta Kept, así tus días sincronizados te siguen en todos tus dispositivos.',
  opening:'Abriendo el inicio de sesión seguro de Uber y Lyft…',connected:'Conectado. Tus viajes aparecerán en unos minutos.',updated:'{n} días actualizados desde Uber y Lyft.',upToDate:'Todo está al día.',
  failed:'No se pudo conectar con el servicio de sincronización. Inténtalo más tarde.',discDone:'Desconectado. Los días ya sincronizados se quedan en Kept.',
  note:'Kept usa Argyle para conectarse de forma segura con Uber y Lyft y nunca ve tu contraseña de Uber o Lyft. Las horas cuentan el tiempo en viajes; edita un día para sumar el tiempo de espera. Lo que cambies en un día sincronizado se respeta.',synced:'Sincronizado'},
pt:{sec:'Sincronização automática',connect:'Conectar Uber e Lyft',connectSub:'Seus dias são preenchidos sozinhos',manage:'Adicionar ou remover contas',now:'Sincronizar agora',disc:'Desconectar',discArm:'Toque de novo para desconectar',
  stOff:'Ainda não conectado.',stWait:'Conectado. Aguardando suas primeiras corridas…',stLast:'Conectado · última sincronização {t}',stSyncing:'Sincronizando…',justNow:'agora mesmo',
  needPlus:'A sincronização automática com Uber e Lyft faz parte do Kept Pro+.',signIn:'Entre na sua conta Kept primeiro, assim seus dias sincronizados acompanham você em todos os aparelhos.',
  opening:'Abrindo o login seguro da Uber e da Lyft…',connected:'Conectado. Suas corridas aparecerão em alguns minutos.',updated:'{n} dias atualizados pela Uber e pela Lyft.',upToDate:'Tudo em dia.',
  failed:'Não foi possível acessar o serviço de sincronização. Tente mais tarde.',discDone:'Desconectado. Os dias já sincronizados continuam no Kept.',
  note:'O Kept usa a Argyle para se conectar com segurança à Uber e à Lyft e nunca vê sua senha. As horas contam o tempo em corridas; edite um dia para somar o tempo de espera. O que você mudar em um dia sincronizado é mantido.',synced:'Sincronizado'},
fr:{sec:'Synchro automatique',connect:'Connecter Uber et Lyft',connectSub:'Vos journées se remplissent toutes seules',manage:'Ajouter ou retirer des comptes',now:'Synchroniser',disc:'Déconnecter',discArm:'Touchez encore pour déconnecter',
  stOff:'Pas encore connecté.',stWait:'Connecté. En attente de vos premières courses…',stLast:'Connecté · dernière synchro {t}',stSyncing:'Synchronisation…',justNow:'à l\'instant',
  needPlus:'La synchro automatique Uber et Lyft fait partie de Kept Pro+.',signIn:'Connectez-vous d\'abord à votre compte Kept, pour retrouver vos journées synchronisées sur tous vos appareils.',
  opening:'Ouverture de la connexion sécurisée Uber et Lyft…',connected:'Connecté. Vos courses apparaîtront dans quelques minutes.',updated:'{n} journées mises à jour depuis Uber et Lyft.',upToDate:'Tout est à jour.',
  failed:'Impossible de joindre le service de synchro. Réessayez plus tard.',discDone:'Déconnecté. Les journées déjà synchronisées restent dans Kept.',
  note:'Kept utilise Argyle pour se connecter à Uber et Lyft en toute sécurité et ne voit jamais votre mot de passe. Les heures comptent le temps en course ; modifiez une journée pour ajouter l\'attente. Ce que vous changez sur une journée synchronisée est conservé.',synced:'Synchronisé'},
ru:{sec:'Автосинхронизация',connect:'Подключить Uber и Lyft',connectSub:'Дни заполняются сами',manage:'Добавить или убрать аккаунты',now:'Синхронизировать',disc:'Отключить',discArm:'Нажмите ещё раз, чтобы отключить',
  stOff:'Пока не подключено.',stWait:'Подключено. Ждём ваши первые поездки…',stLast:'Подключено · синхронизировано {t}',stSyncing:'Синхронизация…',justNow:'только что',
  needPlus:'Автосинхронизация с Uber и Lyft входит в Kept Pro+.',signIn:'Сначала войдите в аккаунт Kept, чтобы синхронизированные дни были на всех ваших устройствах.',
  opening:'Открываем безопасный вход в Uber и Lyft…',connected:'Подключено. Поездки появятся через несколько минут.',updated:'Обновлено дней из Uber и Lyft: {n}.',upToDate:'Всё актуально.',
  failed:'Не удалось связаться со службой синхронизации. Попробуйте позже.',discDone:'Отключено. Уже синхронизированные дни остаются в Kept.',
  note:'Kept подключается к Uber и Lyft через защищённый сервис Argyle и никогда не видит ваш пароль. Часы учитывают только время поездок — отредактируйте день, чтобы добавить ожидание. Ваши правки в синхронизированном дне сохраняются.',synced:'Синхр.'},
zh:{sec:'自动同步',connect:'连接 Uber 和 Lyft',connectSub:'每天的数据自动填好',manage:'添加或移除账户',now:'立即同步',disc:'断开连接',discArm:'再点一次以断开',
  stOff:'尚未连接。',stWait:'已连接，正在等待你的第一批行程…',stLast:'已连接 · 上次同步 {t}',stSyncing:'正在同步…',justNow:'刚刚',
  needPlus:'Uber 和 Lyft 自动同步是 Kept Pro+ 的功能。',signIn:'请先登录 Kept 账户，这样同步的数据会出现在你的所有设备上。',
  opening:'正在打开 Uber 和 Lyft 的安全登录…',connected:'已连接。你的行程几分钟后就会出现。',updated:'已从 Uber 和 Lyft 更新 {n} 天。',upToDate:'已是最新。',
  failed:'无法连接同步服务，请稍后再试。',discDone:'已断开连接。已同步的日子会保留在 Kept 中。',
  note:'Kept 通过 Argyle 安全连接 Uber 和 Lyft，永远看不到你的密码。时长只计算行程时间，可编辑当天添加等单时间。你对已同步日子的修改会被保留。',synced:'已同步'},
vi:{sec:'Đồng bộ tự động',connect:'Kết nối Uber và Lyft',connectSub:'Ngày làm việc tự được điền',manage:'Thêm hoặc gỡ tài khoản',now:'Đồng bộ ngay',disc:'Ngắt kết nối',discArm:'Chạm lần nữa để ngắt kết nối',
  stOff:'Chưa kết nối.',stWait:'Đã kết nối. Đang chờ các chuyến đầu tiên…',stLast:'Đã kết nối · đồng bộ lần cuối {t}',stSyncing:'Đang đồng bộ…',justNow:'vừa xong',
  needPlus:'Đồng bộ tự động Uber và Lyft thuộc Kept Pro+.',signIn:'Hãy đăng nhập tài khoản Kept trước để các ngày đã đồng bộ có trên mọi thiết bị của bạn.',
  opening:'Đang mở trang đăng nhập an toàn của Uber và Lyft…',connected:'Đã kết nối. Các chuyến đi sẽ hiện ra trong vài phút.',updated:'Đã cập nhật {n} ngày từ Uber và Lyft.',upToDate:'Mọi thứ đã được cập nhật.',
  failed:'Không kết nối được dịch vụ đồng bộ. Hãy thử lại sau.',discDone:'Đã ngắt kết nối. Các ngày đã đồng bộ vẫn còn trong Kept.',
  note:'Kept dùng Argyle để kết nối an toàn với Uber và Lyft và không bao giờ thấy mật khẩu của bạn. Giờ chỉ tính thời gian chạy chuyến; hãy sửa ngày để thêm thời gian chờ. Mọi thay đổi bạn làm trên ngày đã đồng bộ đều được giữ lại.',synced:'Đã đồng bộ'}
};
const lang=(typeof LANG!=='undefined'&&W[LANG])?LANG:'en';
const w=(k,o)=>(W[lang][k]||W.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
window.keptSyncedLabel=w('synced');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const say=t=>{ if(typeof toast==='function') toast(t); };

/* ---------- Saved state (this device) ---------- */
const SK=(typeof KEY!=='undefined'?KEY:'kept')+'-plus';
let st={}; try{ st=JSON.parse(localStorage.getItem(SK)||'{}'); }catch(e){}
const saveSt=()=>{ try{ localStorage.setItem(SK,JSON.stringify(st)); }catch(e){} };
const isPlus=()=>!!(window.keptIsPlus&&window.keptIsPlus());
const acctUser=()=>{ const a=window.keptAccount&&window.keptAccount.state&&window.keptAccount.state(); return a&&a.user; };

/* ---------- Server ---------- */
async function call(path,body){
  const base=(SET.workerUrl||'').replace(/\/$/,''); if(!base) throw new Error('no server');
  const tok=await window.keptAccount.idToken();
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify(body||{})});
  if(!r.ok) throw Object.assign(new Error('server '+r.status),{status:r.status});
  return r.json();
}

/* ---------- Merge synced daily totals into Kept ---------- */
const r1=n=>Math.round(n*10)/10, r2=n=>Math.round(n*100)/100;
// Server day: {date:'YYYY-MM-DD', l:{pay,tips,bonus,rides,secs,miles}, u:{...}}  ->  Kept fields
function valsOf(d){
  const l=d.l||{}, u=d.u||{};
  return {le:r2(l.pay||0),lt:r2(l.tips||0),lr:l.rides||0,lh:r1((l.secs||0)/3600),
          ue:r2(u.pay||0),ut:r2(u.tips||0),ur:u.rides||0,uh:r1((u.secs||0)/3600),
          bonus:r2((l.bonus||0)+(u.bonus||0)),miles:r1((l.miles||0)+(u.miles||0))};
}
function mergeDays(days){
  let changed=0;
  for(const d of days){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')) continue;
    const v=valsOf(d);
    const same=data.shifts.filter(x=>x.date===d.date);
    let s=same.find(x=>x.sy)||same[0];
    if(!s){
      if(!Object.values(v).some(Boolean)) continue;
      s={id:'y'+d.date.replace(/-/g,''),date:d.date,dtype:'',ddate:''}; FIELDS.forEach(k=>s[k]=0);
      Object.assign(s,v); s.sy={...v}; data.shifts.push(s); changed++; continue;
    }
    const sy={...(s.sy||{})}; let touched=false;
    for(const k of Object.keys(v)){
      const cur=s[k]||0, prev=sy[k];
      const untouched=prev===undefined?cur===0:Math.abs(cur-prev)<0.005;   // still what Uber/Lyft sent last time (or empty)
      if(untouched&&Math.abs(cur-v[k])>=0.005){ s[k]=v[k]; touched=true; }
      if(untouched) sy[k]=v[k];
    }
    if(JSON.stringify(sy)!==JSON.stringify(s.sy||{})){ s.sy=sy; touched=true; }
    if(touched) changed++;
  }
  if(changed){ save(); render(); }
  return changed;
}
window.keptMergeSynced=mergeDays;   // used by the tests

/* ---------- Demo (preview only): sample trips instead of the server ---------- */
function demoDays(){
  const out=[], t=new Date(); let seed=11; const R=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  for(let i=0;i<10;i++){ if(R()<.3) continue; const d=new Date(t); d.setDate(t.getDate()-i); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    out.push({date:d.toISOString().slice(0,10),l:{pay:90+R()*80,tips:R()*25,bonus:R()<.2?15:0,rides:6+Math.round(R()*8),secs:(2+R()*3)*3600,miles:60+R()*60},
      u:{pay:70+R()*90,tips:R()*30,bonus:0,rides:5+Math.round(R()*9),secs:(2+R()*3)*3600,miles:50+R()*70}}); }
  return out;
}

/* ---------- Pull new totals ---------- */
let busy=false;
async function pull(manual){
  if(busy||!isPlus()) return;
  if(!demo&&!acctUser()) return;
  busy=true; if(manual) status(w('stSyncing'));
  try{
    let res;
    if(demo) res={days:st.connected?demoDays():[],cursor:Date.now(),connected:!!st.connected};
    else res=await call('/plus/days',{since:st.cursor||0});
    if(typeof res.connected==='boolean') st.connected=res.connected;
    const n=mergeDays(res.days||[]);
    st.cursor=res.cursor||st.cursor; st.last=Date.now(); saveSt();
    if(manual||n) say(n?w('updated',{n}):w('upToDate'));
  }catch(e){ if(manual) say(w('failed')); }
  finally{ busy=false; draw(); }
}

/* ---------- Argyle sign-in ---------- */
let argyleLoad=null;
function loadArgyle(){
  if(window.Argyle) return Promise.resolve();
  if(!argyleLoad) argyleLoad=new Promise((ok,bad)=>{ const sc=document.createElement('script'); sc.src=ARGYLE_JS; sc.async=true; sc.onload=ok; sc.onerror=()=>{ argyleLoad=null; bad(new Error('argyle')); }; document.head.appendChild(sc); });
  return argyleLoad;
}
const LINK_LANG={en:'EN',es:'ES',ru:'RU',zh:'ZH'};
async function connect(){
  if(!isPlus()){ if(window.keptShowPro) window.keptShowPro(w('needPlus')); else say(w('needPlus')); return; }
  if(demo){ st.connected=true; saveSt(); say(w('connected')); draw(); setTimeout(()=>pull(false),800); return; }
  if(!acctUser()){ say(w('signIn')); const row=document.getElementById('acctRow'); if(row) row.click(); return; }
  say(w('opening'));
  try{
    const [{userToken,sandbox}]=await Promise.all([call('/plus/link'),loadArgyle()]);
    const opts={userToken,sandbox:sandbox!==undefined?!!sandbox:SET.sandbox!==false,language:LINK_LANG[lang]||'EN',
      onAccountConnected:()=>{ st.connected=true; saveSt(); draw(); say(w('connected')); setTimeout(()=>pull(false),20000); },
      onTokenExpired:update=>{ call('/plus/link').then(r=>update(r.userToken)).catch(()=>{}); },
      onClose:()=>{ pull(false); }};
    if(SET.items&&SET.items.length) opts.items=SET.items;
    window.Argyle.create(opts).open();
  }catch(e){ say(w('failed')); }
}
async function disconnect(btn){
  if(!btn.dataset.armed){ btn.dataset.armed='1'; btn.textContent=w('discArm'); setTimeout(()=>{ if(btn.isConnected){ delete btn.dataset.armed; btn.textContent=w('disc'); } },3000); return; }
  btn.disabled=true;
  try{ if(!demo) await call('/plus/disconnect'); st={}; saveSt(); say(w('discDone')); }
  catch(e){ say(w('failed')); }
  draw();
}

/* ---------- Screen: "Automatic sync" in More ---------- */
const css=document.createElement('style');
css.textContent=`#plusSync .row2{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
#plusSync .row2 small{font-size:.84rem;color:var(--muted);font-weight:500}
#plusSync .plus-tag{display:inline-block;margin-left:6px;padding:0 6px;border-radius:4px;font-size:.66rem;font-weight:800;letter-spacing:.06em;line-height:1.6;vertical-align:2px;background:var(--fg);color:var(--bg)}
.plus-note{margin:-6px 4px 0;font-size:.8rem;color:var(--muted)}
.day .sy-tag{display:inline-block;margin-left:8px;padding:0 6px;border-radius:99px;font-size:.68rem;font-weight:700;vertical-align:2px;background:var(--chip);color:var(--chip-fg)}`;
document.head.appendChild(css);
const more=document.getElementById('vMore');
const anchor=more&&[...more.querySelectorAll('h2.sh')][1];   // before "Your data"
const head=document.createElement('h2'); head.className='sh'; head.id='plusSyncH';
const box=document.createElement('div'); box.className='list'; box.id='plusSync';
const note=document.createElement('p'); note.className='plus-note';
if(anchor){ more.insertBefore(head,anchor); more.insertBefore(box,anchor); more.insertBefore(note,anchor); }

function rel(t){
  const s=Math.round((Date.now()-t)/1000); if(s<60) return w('justNow');
  try{ const f=new Intl.RelativeTimeFormat(typeof LOC!=='undefined'?LOC:undefined,{numeric:'auto'});
    if(s<3600) return f.format(-Math.round(s/60),'minute'); if(s<86400) return f.format(-Math.round(s/3600),'hour'); return f.format(-Math.round(s/86400),'day');
  }catch(e){ return new Date(t).toLocaleString(); }
}
function status(text){ const el=document.getElementById('plusStatus'); if(el) el.lastChild.textContent=text; }
function draw(){
  if(!anchor) return;
  head.textContent=w('sec');
  const on=isPlus()&&st.connected;
  const stText=!st.connected?w('stOff'):st.last?w('stLast',{t:rel(st.last)}):w('stWait');
  box.innerHTML=`<button type="button" id="plusConnect"><span class="row2"><span>${esc(on?w('manage'):w('connect'))}${isPlus()?'':' <span class="plus-tag">PRO+</span>'}</span><small>${esc(w('connectSub'))}</small></span></button>`+
    (isPlus()?`<div class="status" id="plusStatus"><span class="dot ${on?'ok':''}"></span><span>${esc(stText)}</span></div>`:'')+
    (on?`<button type="button" id="plusNow">${esc(w('now'))}</button><button type="button" id="plusDisc">${esc(w('disc'))}</button>`:'');
  note.textContent=isPlus()?w('note'):'';
  note.hidden=!isPlus();
  box.querySelector('#plusConnect').onclick=connect;
  const n=box.querySelector('#plusNow'); if(n) n.onclick=()=>pull(true);
  const d=box.querySelector('#plusDisc'); if(d) d.onclick=()=>disconnect(d);
}
draw();
window.addEventListener('kept-pro-change',draw);
window.addEventListener('kept-account',()=>{ draw(); if(st.connected) pull(false); });
if(typeof render==='function') render();   // show the "Synced" tags on days

// Bring in new trips: at start, when Kept comes back to the front (at most every 10 minutes), and every 15 minutes while open.
const stale=()=>!st.last||Date.now()-st.last>10*60e3;
setTimeout(()=>{ if(st.connected) pull(false); },1500);
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&st.connected&&stale()) pull(false); });
setInterval(()=>{ if(document.visibilityState==='visible'&&st.connected) pull(false); },15*60e3);
})();
