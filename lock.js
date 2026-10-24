/* Kept App lock: optional. When on, Kept asks for the phone's fingerprint / face (or its screen-lock PIN as backup)
   when opened, and again after the driver has been away for a minute. Uses a passkey kept on this device
   (WebAuthn platform authenticator with user verification), so Kept never sees the fingerprint or face.
   It's a privacy screen for the app; turning it on doesn't change where days are stored. */
(function(){
'use strict';
const KEYL=(typeof KEY!=='undefined'?KEY:'kept')+'-lock';
const AWAY=60*1000;   // relock after this long in the background
let cfg=null; try{ cfg=JSON.parse(localStorage.getItem(KEYL)||'null'); }catch(e){}
const save=()=>{ try{ cfg?localStorage.setItem(KEYL,JSON.stringify(cfg)):localStorage.removeItem(KEYL); }catch(e){} };

const T={
en:{row:'App lock',on:'On · fingerprint or face',off:'Off',title:'App lock',
  pitch:'Ask for your fingerprint or face when Kept opens, so nobody else can see your earnings if they pick up your phone. Your phone\'s screen-lock PIN works as a backup.',
  turnOn:'Turn on App lock',turnOff:'Turn off App lock',enabled:'App lock is on. Kept will ask for your fingerprint or face when it opens.',disabled:'App lock is off.',
  none:'This device doesn\'t support fingerprint or face unlock in the browser. Set up a screen lock or fingerprint in your phone\'s settings first.',
  cancel:'Cancelled. App lock wasn\'t changed.',failed:'That didn\'t work. Try again.',
  locked:'Kept is locked',unlock:'Unlock',unlockHint:'Use your fingerprint, face or phone PIN.',trouble:'Can\'t unlock?',
  reset:'Set up again with this phone\'s screen lock',resetHint:'If your fingerprint or face changed, confirm with your phone\'s screen lock to set App lock up again.',
  note:'App lock protects Kept on this device. You\'ll set it up separately on each phone or computer.',offerT:'Lock Kept with your fingerprint?',offerP:'You\'re signed in. Add App lock so only you can open Kept on this device, even if someone else picks it up.',offerYes:'Turn on App lock',offerNo:'Not now',offerDone:'App lock is on.'},
es:{row:'Bloqueo de la app',on:'Activado · huella o rostro',off:'Desactivado',title:'Bloqueo de la app',
  pitch:'Pide tu huella o tu rostro al abrir Kept, para que nadie más vea tus ganancias si toma tu teléfono. El PIN de bloqueo de pantalla sirve como respaldo.',
  turnOn:'Activar bloqueo',turnOff:'Desactivar bloqueo',enabled:'El bloqueo está activado. Kept pedirá tu huella o rostro al abrirse.',disabled:'El bloqueo está desactivado.',
  none:'Este dispositivo no admite desbloqueo con huella o rostro en el navegador. Configura primero un bloqueo de pantalla o huella en los ajustes del teléfono.',
  cancel:'Cancelado. No se cambió el bloqueo.',failed:'No funcionó. Inténtalo de nuevo.',
  locked:'Kept está bloqueado',unlock:'Desbloquear',unlockHint:'Usa tu huella, rostro o PIN del teléfono.',trouble:'¿No puedes desbloquear?',
  reset:'Configurar de nuevo con el bloqueo de pantalla',resetHint:'Si cambió tu huella o rostro, confirma con el bloqueo de pantalla del teléfono para configurar el bloqueo otra vez.',
  note:'El bloqueo protege Kept en este dispositivo. Se configura por separado en cada teléfono o computadora.',offerT:'¿Bloquear Kept con tu huella?',offerP:'Ya iniciaste sesión. Activa el bloqueo para que solo tú puedas abrir Kept en este dispositivo, aunque otra persona lo tome.',offerYes:'Activar bloqueo',offerNo:'Ahora no',offerDone:'El bloqueo está activado.'},
pt:{row:'Bloqueio do app',on:'Ativado · digital ou rosto',off:'Desativado',title:'Bloqueio do app',
  pitch:'Peça sua digital ou rosto ao abrir o Kept, para ninguém ver seus ganhos se pegar seu celular. O PIN de bloqueio de tela funciona como alternativa.',
  turnOn:'Ativar bloqueio',turnOff:'Desativar bloqueio',enabled:'O bloqueio está ativado. O Kept pedirá sua digital ou rosto ao abrir.',disabled:'O bloqueio está desativado.',
  none:'Este aparelho não aceita desbloqueio por digital ou rosto no navegador. Configure primeiro um bloqueio de tela ou digital nas configurações do celular.',
  cancel:'Cancelado. O bloqueio não foi alterado.',failed:'Não funcionou. Tente de novo.',
  locked:'O Kept está bloqueado',unlock:'Desbloquear',unlockHint:'Use sua digital, rosto ou PIN do celular.',trouble:'Não consegue desbloquear?',
  reset:'Configurar de novo com o bloqueio de tela',resetHint:'Se sua digital ou rosto mudou, confirme com o bloqueio de tela do celular para configurar o bloqueio de novo.',
  note:'O bloqueio protege o Kept neste aparelho. Configure separadamente em cada celular ou computador.',offerT:'Bloquear o Kept com sua digital?',offerP:'Você entrou. Ative o bloqueio para que só você abra o Kept neste aparelho, mesmo que outra pessoa o pegue.',offerYes:'Ativar bloqueio',offerNo:'Agora não',offerDone:'O bloqueio está ativado.'},
fr:{row:'Verrouillage',on:'Activé · empreinte ou visage',off:'Désactivé',title:'Verrouillage de l\'appli',
  pitch:'Demandez votre empreinte ou votre visage à l\'ouverture de Kept, pour que personne ne voie vos gains en prenant votre téléphone. Le code de verrouillage du téléphone sert de secours.',
  turnOn:'Activer le verrouillage',turnOff:'Désactiver le verrouillage',enabled:'Le verrouillage est activé. Kept demandera votre empreinte ou votre visage à l\'ouverture.',disabled:'Le verrouillage est désactivé.',
  none:'Cet appareil ne permet pas le déverrouillage par empreinte ou visage dans le navigateur. Configurez d\'abord un verrouillage d\'écran ou une empreinte dans les réglages.',
  cancel:'Annulé. Le verrouillage n\'a pas changé.',failed:'Ça n\'a pas marché. Réessayez.',
  locked:'Kept est verrouillé',unlock:'Déverrouiller',unlockHint:'Utilisez votre empreinte, votre visage ou le code du téléphone.',trouble:'Impossible de déverrouiller ?',
  reset:'Reconfigurer avec le verrouillage d\'écran',resetHint:'Si votre empreinte ou votre visage a changé, confirmez avec le verrouillage d\'écran pour reconfigurer.',
  note:'Le verrouillage protège Kept sur cet appareil. Il se configure séparément sur chaque téléphone ou ordinateur.',offerT:'Verrouiller Kept avec votre empreinte ?',offerP:'Vous êtes connecté. Activez le verrouillage pour que vous seul puissiez ouvrir Kept sur cet appareil, même si quelqu\'un d\'autre le prend.',offerYes:'Activer le verrouillage',offerNo:'Plus tard',offerDone:'Le verrouillage est activé.'},
ru:{row:'Блокировка',on:'Вкл. · отпечаток или лицо',off:'Выкл.',title:'Блокировка приложения',
  pitch:'Запрашивать отпечаток или лицо при открытии Kept, чтобы никто не увидел ваш заработок, взяв телефон. PIN-код блокировки экрана — запасной вариант.',
  turnOn:'Включить блокировку',turnOff:'Выключить блокировку',enabled:'Блокировка включена. Kept будет запрашивать отпечаток или лицо при открытии.',disabled:'Блокировка выключена.',
  none:'Это устройство не поддерживает разблокировку отпечатком или лицом в браузере. Сначала настройте блокировку экрана или отпечаток в настройках телефона.',
  cancel:'Отменено. Блокировка не изменена.',failed:'Не получилось. Попробуйте ещё раз.',
  locked:'Kept заблокирован',unlock:'Разблокировать',unlockHint:'Используйте отпечаток, лицо или PIN телефона.',trouble:'Не получается разблокировать?',
  reset:'Настроить заново через блокировку экрана',resetHint:'Если отпечаток или лицо изменились, подтвердите блокировкой экрана, чтобы настроить заново.',
  note:'Блокировка защищает Kept на этом устройстве. На каждом телефоне или компьютере она настраивается отдельно.',offerT:'Защитить Kept отпечатком?',offerP:'Вы вошли. Включите блокировку, чтобы открыть Kept на этом устройстве могли только вы, даже если телефон возьмёт кто-то другой.',offerYes:'Включить блокировку',offerNo:'Не сейчас',offerDone:'Блокировка включена.'},
zh:{row:'应用锁',on:'已开启 · 指纹或面容',off:'已关闭',title:'应用锁',
  pitch:'打开 Kept 时要求指纹或面容验证，别人拿到你的手机也看不到你的收入。手机锁屏 PIN 可作为备用。',
  turnOn:'开启应用锁',turnOff:'关闭应用锁',enabled:'应用锁已开启。打开 Kept 时会要求指纹或面容。',disabled:'应用锁已关闭。',
  none:'此设备不支持在浏览器中使用指纹或面容解锁。请先在手机设置中设置锁屏或指纹。',
  cancel:'已取消，应用锁未更改。',failed:'没有成功，请重试。',
  locked:'Kept 已锁定',unlock:'解锁',unlockHint:'使用指纹、面容或手机 PIN。',trouble:'无法解锁？',
  reset:'使用手机锁屏重新设置',resetHint:'如果指纹或面容有变化，请用手机锁屏确认后重新设置应用锁。',
  note:'应用锁只保护此设备上的 Kept，每台手机或电脑需要分别设置。',offerT:'用指纹锁定 Kept？',offerP:'你已登录。开启应用锁后，即使别人拿到这台设备，也只有你能打开 Kept。',offerYes:'开启应用锁',offerNo:'暂不',offerDone:'应用锁已开启。'},
vi:{row:'Khóa ứng dụng',on:'Bật · vân tay hoặc khuôn mặt',off:'Tắt',title:'Khóa ứng dụng',
  pitch:'Yêu cầu vân tay hoặc khuôn mặt khi mở Kept để không ai xem được thu nhập của bạn nếu cầm điện thoại. Mã PIN khóa màn hình dùng làm dự phòng.',
  turnOn:'Bật khóa ứng dụng',turnOff:'Tắt khóa ứng dụng',enabled:'Đã bật khóa. Kept sẽ yêu cầu vân tay hoặc khuôn mặt khi mở.',disabled:'Đã tắt khóa ứng dụng.',
  none:'Thiết bị này không hỗ trợ mở khóa bằng vân tay hoặc khuôn mặt trong trình duyệt. Hãy thiết lập khóa màn hình hoặc vân tay trong cài đặt điện thoại trước.',
  cancel:'Đã hủy. Khóa ứng dụng không thay đổi.',failed:'Chưa được. Hãy thử lại.',
  locked:'Kept đang bị khóa',unlock:'Mở khóa',unlockHint:'Dùng vân tay, khuôn mặt hoặc mã PIN điện thoại.',trouble:'Không mở khóa được?',
  reset:'Thiết lập lại bằng khóa màn hình',resetHint:'Nếu vân tay hoặc khuôn mặt đã thay đổi, xác nhận bằng khóa màn hình để thiết lập lại.',
  note:'Khóa ứng dụng bảo vệ Kept trên thiết bị này. Mỗi điện thoại hoặc máy tính cần thiết lập riêng.',offerT:'Khóa Kept bằng vân tay?',offerP:'Bạn đã đăng nhập. Bật khóa ứng dụng để chỉ mình bạn mở được Kept trên thiết bị này, kể cả khi người khác cầm máy.',offerYes:'Bật khóa ứng dụng',offerNo:'Để sau',offerDone:'Đã bật khóa ứng dụng.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=k=>T[lang][k]||T.en[k];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); };
const rand=n=>crypto.getRandomValues(new Uint8Array(n));

async function supported(){
  try{ return !!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }catch(e){ return false; }
}
// A passkey that lives on this device; creating or using it requires the phone's fingerprint, face or screen lock.
async function enroll(){
  const cred=await navigator.credentials.create({publicKey:{
    challenge:rand(32), rp:{name:'Kept'}, user:{id:rand(16),name:'Kept app lock',displayName:'Kept app lock'},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},
    timeout:60000, attestation:'none'}});
  cfg={id:b64(cred.rawId),since:Date.now()}; save();
}
async function verify(){
  const a=await navigator.credentials.get({publicKey:{challenge:rand(32),allowCredentials:[{type:'public-key',id:unb64(cfg.id)}],userVerification:'required',timeout:60000}});
  // userVerification:'required' means the authenticator only answers after a fingerprint, face or PIN check; the UV flag confirms it.
  const flags=new Uint8Array(a.response.authenticatorData)[32];
  if(!(flags&0x04)) throw new Error('not verified');
}

/* ---------- lock screen ---------- */
const css=document.createElement('style');
css.textContent=`
html.kept-locked .shell,html.kept-locked .nav,html.kept-locked .toast{visibility:hidden}
#lockScreen{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center}
#lockScreen .brand{align-items:center}
#lockScreen .ico{width:84px;height:84px;border-radius:50%;background:var(--chip);color:var(--chip-fg);display:grid;place-items:center}
#lockScreen .ico svg{width:40px;height:40px}
#lockScreen h2{margin:0;font-size:1.3rem}
#lockScreen p{margin:0;color:var(--muted);max-width:320px}
#lockScreen .btn-primary{max-width:320px}
#lockScreen .linkish{border:0;background:none;color:var(--accent);font-weight:600;padding:6px}
#lockScreen .msg{min-height:1.2em}
.lockcard{display:flex;flex-direction:column;gap:14px}
.lockcard p{margin:0}
.lockcard .pitch{color:var(--muted)}
.lockcard .note{font-size:.85rem;color:var(--muted)}
#lockRow small{display:block;color:var(--muted);font-size:.85rem;font-weight:500}
#lockRow .t{display:flex;flex-direction:column;flex:1;min-width:0}
#lockOffer{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px}
#lockOffer .sheet{background:var(--surface);color:var(--fg);border-radius:22px;padding:22px 20px calc(18px + env(safe-area-inset-bottom));width:100%;max-width:520px;display:flex;flex-direction:column;gap:12px;text-align:center;box-shadow:0 -6px 24px rgba(0,0,0,.2)}
#lockOffer .ico{width:64px;height:64px;border-radius:50%;background:var(--chip);color:var(--chip-fg);display:grid;place-items:center;margin:0 auto}
#lockOffer .ico svg{width:32px;height:32px}
#lockOffer h2{margin:0;font-size:1.25rem}
#lockOffer p{margin:0;color:var(--muted)}
#lockOffer .later{border:0;background:none;color:var(--muted);font-weight:600;padding:10px}
@media (min-width:700px){#lockOffer{align-items:center}}
@media print{#lockScreen,#lockOffer{display:none!important}}`;
document.head.appendChild(css);

const FP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v3a8 8 0 01-1.2 4.2M8.5 7.7A5 5 0 0117 11v1.5M7 11a5 5 0 01.4-2M17 15.5a13 13 0 01-.7 3.2M4.5 15A9 9 0 014 12a8 8 0 0113.3-6M20 12a15 15 0 01-.3 3M9 21a12 12 0 001-2.5M12 21.5c.5-1 .9-2 1.2-3.2"/><path d="M9.7 11.6A2.3 2.3 0 0114.3 11v1.5a11 11 0 01-1.6 5.7"/></svg>';
let screen=null, busy=false, hiddenAt=0;
function lockNow(){
  if(!cfg||screen) return;
  document.documentElement.classList.add('kept-locked');
  screen=document.createElement('div'); screen.id='lockScreen'; screen.setAttribute('role','dialog'); screen.setAttribute('aria-modal','true'); screen.setAttribute('aria-labelledby','lockT');
  screen.innerHTML=`<div class="brand"><b>Kept</b><small>for Gig Workers</small></div>
    <div class="ico">${FP}</div><h2 id="lockT">${esc(w('locked'))}</h2><p>${esc(w('unlockHint'))}</p>
    <button type="button" class="btn-primary" id="lockGo">${esc(w('unlock'))}</button>
    <p class="msg" id="lockMsg" role="status"></p>
    <button type="button" class="linkish" id="lockTrouble">${esc(w('trouble'))}</button>`;
  document.body.appendChild(screen);
  $('lockGo').onclick=unlock; $('lockTrouble').onclick=trouble;
  setTimeout(()=>{ if(document.visibilityState==='visible') unlock(); },350);   // ask straight away
}
async function unlock(){
  if(busy) return; busy=true; const m=$('lockMsg'); if(m) m.textContent='';
  try{ await verify(); open_(); }
  catch(e){ if(m) m.textContent=e&&e.name==='NotAllowedError'?'':w('failed'); }
  finally{ busy=false; }
}
function open_(){ if(screen){ screen.remove(); screen=null; } document.documentElement.classList.remove('kept-locked'); }
function trouble(){
  const m=$('lockMsg'); m.innerHTML=`${esc(w('resetHint'))}<br><button type="button" class="linkish" id="lockReset">${esc(w('reset'))}</button>`;
  $('lockReset').onclick=async()=>{ if(busy) return; busy=true; try{ await enroll(); open_(); }catch(e){ m.textContent=w('failed'); } finally{ busy=false; } };
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden') hiddenAt=Date.now();
  else if(cfg&&!screen&&hiddenAt&&Date.now()-hiddenAt>AWAY) lockNow();
});

/* ---------- setting in More ---------- */
const more=$('vMore');
if(more){
  const list=document.createElement('div'); list.className='list';
  list.innerHTML=`<button type="button" id="lockRow">${FP}<span class="t"><span>${esc(w('row'))}</span><small id="lockRowS"></small></span></button>`;
  const dataH=[...more.querySelectorAll('h2.sh')].pop();
  more.insertBefore(list,dataH);
  const page=document.createElement('section'); page.className='view'; page.id='lockSec'; page.hidden=true;
  ($('shell')||document.body).appendChild(page);
  if(typeof VIEWS!=='undefined'){ VIEWS.lock='lockSec'; NAVOF.lock='more'; }
  const drawRow=()=>{ $('lockRowS').textContent=cfg?w('on'):w('off'); };
  const drawPage=async(msg)=>{
    const ok=await supported();
    page.innerHTML=`<div class="page-top"><button type="button" class="back" id="lockBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1>${esc(w('title'))}</h1><span></span></div>
      <div class="card lockcard">
        <p class="pitch">${esc(w('pitch'))}</p>
        ${ok?`<button type="button" class="${cfg?'btn-ghost':'btn-primary'}" id="lockToggle">${esc(w(cfg?'turnOff':'turnOn'))}</button>`:`<p class="msg err" style="text-align:left">${esc(w('none'))}</p>`}
        <p class="msg" id="lockPageMsg" role="status" style="text-align:left">${esc(msg||'')}</p>
        <p class="note">${esc(w('note'))}</p>
      </div>`;
    $('lockBack').onclick=()=>window.keptGo&&window.keptGo('more');
    const t=$('lockToggle');
    if(t) t.onclick=async()=>{
      if(busy) return; busy=true;
      try{
        if(cfg){ await verify(); cfg=null; save(); drawRow(); drawPage(w('disabled')); }   // turning off needs the owner too
        else { await enroll(); drawRow(); drawPage(w('enabled')); }
      }catch(e){ $('lockPageMsg').textContent=e&&e.name==='NotAllowedError'?w('cancel'):w('failed'); }
      finally{ busy=false; }
    };
  };
  $('lockRow').onclick=()=>{ drawPage(); window.keptGo&&window.keptGo('lock'); };
  drawRow();
}
// Right after signing in or creating an account, offer App lock (once per device, only where it's supported).
const ASKED=KEYL+'-asked';
window.addEventListener('kept-signed-in',async()=>{
  let asked=false; try{ asked=!!localStorage.getItem(ASKED); }catch(e){}
  if(cfg||asked||document.getElementById('lockOffer')||!await supported()) return;
  try{ localStorage.setItem(ASKED,String(Date.now())); }catch(e){}
  const o=document.createElement('div'); o.id='lockOffer'; o.setAttribute('role','dialog'); o.setAttribute('aria-modal','true'); o.setAttribute('aria-labelledby','lockOfferT');
  o.innerHTML=`<div class="sheet"><div class="ico">${FP}</div><h2 id="lockOfferT">${esc(w('offerT'))}</h2><p>${esc(w('offerP'))}</p>
    <button type="button" class="btn-primary" id="lockOfferYes">${esc(w('offerYes'))}</button>
    <p class="msg" id="lockOfferMsg" role="status"></p>
    <button type="button" class="later" id="lockOfferNo">${esc(w('offerNo'))}</button></div>`;
  document.body.appendChild(o);
  const close=()=>o.remove();
  $('lockOfferNo').onclick=close;
  o.addEventListener('click',e=>{ if(e.target===o) close(); });
  $('lockOfferYes').onclick=async()=>{
    if(busy) return; busy=true;
    try{ await enroll(); if($('lockRowS')) $('lockRowS').textContent=w('on'); close(); typeof toast==='function'&&toast(w('offerDone')); }
    catch(e){ $('lockOfferMsg').textContent=e&&e.name==='NotAllowedError'?w('cancel'):w('failed'); }
    finally{ busy=false; }
  };
  $('lockOfferYes').focus();
});
if(cfg) lockNow(); else document.documentElement.classList.remove('kept-locked');
window.keptLock={lockNow,isOn:()=>!!cfg};
})();
