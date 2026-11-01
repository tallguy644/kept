/* Kept: GPS mileage tracking (free, Android app only).
   "Start driving" on Home starts a foreground service (MileageService.java) that counts miles with GPS and shows an ongoing
   notification, so it keeps going while the driver uses Uber or Lyft. "End driving" (here or in the notification) adds the
   miles to that day's entry. Only miles are kept: no routes or places, and nothing is sent anywhere.
   Preview on the web with ?miles=preview (simulated drive). */
(function(){
'use strict';
const preview=new URLSearchParams(location.search).get('miles')==='preview';
const NM=window.keptNative&&window.keptNative.mileage;
if(!NM&&!preview) return;

/* ---------- Words ---------- */
const T={
en:{title:'Track your miles',idle:'Tap Start when you begin driving. Kept counts your miles with GPS and adds them to that day.',start:'Start driving',end:'End driving',
  live:'{m} mi',since:'Tracking since {t}',hint:'You can switch to Uber or Lyft now. Kept keeps counting in the background.',
  added:'Added {m} mi to {d}.',none:'That drive had no miles, so nothing was added.',denied:'Kept needs precise location to track miles. Turn it on in your phone\'s Settings › Apps › Kept › Permissions.',
  failed:'Couldn\'t start tracking. Try again.',note:'Only your miles are saved, never your route.',today:'today'},
es:{title:'Registra tus millas',idle:'Toca Iniciar cuando empieces a manejar. Kept cuenta tus millas con GPS y las suma a ese día.',start:'Iniciar manejo',end:'Terminar manejo',
  live:'{m} mi',since:'Registrando desde las {t}',hint:'Ya puedes cambiar a Uber o Lyft. Kept sigue contando en segundo plano.',
  added:'Se sumaron {m} mi a {d}.',none:'Ese recorrido no tuvo millas, así que no se sumó nada.',denied:'Kept necesita la ubicación precisa para contar millas. Actívala en Ajustes › Apps › Kept › Permisos.',
  failed:'No se pudo iniciar. Inténtalo de nuevo.',note:'Solo se guardan tus millas, nunca tu ruta.',today:'hoy'},
pt:{title:'Registre suas milhas',idle:'Toque em Iniciar quando começar a dirigir. O Kept conta suas milhas com GPS e soma ao dia.',start:'Começar a dirigir',end:'Parar de dirigir',
  live:'{m} mi',since:'Registrando desde {t}',hint:'Você já pode ir para a Uber ou a Lyft. O Kept continua contando em segundo plano.',
  added:'{m} mi somadas a {d}.',none:'Esse trajeto não teve milhas, então nada foi somado.',denied:'O Kept precisa da localização precisa para contar milhas. Ative em Configurações › Apps › Kept › Permissões.',
  failed:'Não foi possível iniciar. Tente de novo.',note:'Só suas milhas são salvas, nunca seu trajeto.',today:'hoje'},
fr:{title:'Suivez vos miles',idle:'Touchez Démarrer quand vous commencez à conduire. Kept compte vos miles par GPS et les ajoute à la journée.',start:'Démarrer la conduite',end:'Terminer la conduite',
  live:'{m} mi',since:'Suivi depuis {t}',hint:'Vous pouvez passer à Uber ou Lyft. Kept continue de compter en arrière-plan.',
  added:'{m} mi ajoutés à {d}.',none:'Ce trajet n\'a pas de miles, rien n\'a été ajouté.',denied:'Kept a besoin de la position précise pour compter les miles. Activez-la dans Paramètres › Applis › Kept › Autorisations.',
  failed:'Impossible de démarrer. Réessayez.',note:'Seuls vos miles sont enregistrés, jamais votre trajet.',today:'aujourd\'hui'},
ru:{title:'Учёт пробега',idle:'Нажмите «Начать», когда выезжаете. Kept считает мили по GPS и добавляет их к этому дню.',start:'Начать поездку',end:'Закончить поездку',
  live:'{m} ми',since:'Учёт с {t}',hint:'Можно переключиться на Uber или Lyft. Kept продолжит считать в фоне.',
  added:'Добавлено {m} ми к дню {d}.',none:'В этой поездке нет миль, ничего не добавлено.',denied:'Kept нужен точный доступ к геопозиции. Включите его в Настройки › Приложения › Kept › Разрешения.',
  failed:'Не удалось начать. Попробуйте ещё раз.',note:'Сохраняются только мили, маршрут — никогда.',today:'сегодня'},
zh:{title:'记录里程',idle:'开始开车时点按“开始”。Kept 会用 GPS 计算里程并加到当天记录。',start:'开始开车',end:'结束开车',
  live:'{m} 英里',since:'自 {t} 起记录',hint:'现在可以切换到 Uber 或 Lyft，Kept 会在后台继续计算。',
  added:'已将 {m} 英里加到 {d}。',none:'这次没有里程，未添加任何内容。',denied:'Kept 需要精确位置权限来记录里程。请在 设置 › 应用 › Kept › 权限 中开启。',
  failed:'无法开始记录，请重试。',note:'只保存里程，绝不保存路线。',today:'今天'},
vi:{title:'Ghi số dặm',idle:'Nhấn Bắt đầu khi bạn bắt đầu chạy. Kept đếm số dặm bằng GPS và cộng vào ngày đó.',start:'Bắt đầu chạy',end:'Kết thúc chạy',
  live:'{m} dặm',since:'Đang ghi từ {t}',hint:'Bạn có thể chuyển sang Uber hoặc Lyft. Kept vẫn đếm trong nền.',
  added:'Đã cộng {m} dặm vào {d}.',none:'Chuyến này không có dặm nào nên không cộng gì.',denied:'Kept cần vị trí chính xác để đếm số dặm. Hãy bật trong Cài đặt › Ứng dụng › Kept › Quyền.',
  failed:'Không bắt đầu được. Hãy thử lại.',note:'Chỉ lưu số dặm, không bao giờ lưu lộ trình.',today:'hôm nay'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const say=t=>{ if(typeof toast==='function') toast(t); };
const loc=typeof LOC!=='undefined'?LOC:undefined;
const mi=v=>(Math.round(v*10)/10).toLocaleString(loc,{minimumFractionDigits:1,maximumFractionDigits:1});

/* ---------- Preview stand-in (web) ---------- */
const sim={active:false,start:0};
const M=NM||{
  status:async()=>({active:sim.active,start:sim.start,miles:sim.active?(Date.now()-sim.start)/60000*0.5:0,permission:'granted'}),
  start:async()=>{ sim.active=true; sim.start=Date.now(); return {active:true}; },
  stop:async()=>{ sim.done={start:sim.start,end:Date.now(),miles:Math.max(0.1,(Date.now()-sim.start)/60000*0.5)}; sim.active=false; },
  take:async()=>{ const d=sim.done?[sim.done]:[]; sim.done=null; return d; }
};

/* ---------- Styles ---------- */
const css=document.createElement('style');
css.textContent=`
#milesCard{display:flex;flex-direction:column;gap:10px}
#milesCard .row{display:flex;align-items:center;gap:12px}
#milesCard .ic{flex:none;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--chip,var(--surface-2));color:var(--chip-fg,var(--accent))}
#milesCard .ic svg{width:22px;height:22px}
#milesCard h3{margin:0;font-size:1.02rem}
#milesCard p{margin:0;font-size:.9rem;color:var(--muted)}
#milesCard .big{font-family:var(--display);font-size:2rem;font-weight:800;line-height:1;color:var(--fg)}
#milesCard .go{border:0;border-radius:14px;padding:13px;font-weight:700;font-size:1rem;background:var(--accent);color:var(--accent-fg)}
#milesCard .go.stop{background:var(--bad,#a12c2c);color:#fff}
#milesCard .note{font-size:.8rem}
#milesCard .pulse{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--good,#1c6b47);margin-right:6px;animation:kmPulse 1.6s infinite}
@keyframes kmPulse{0%{box-shadow:0 0 0 0 rgba(28,107,71,.6)}70%{box-shadow:0 0 0 9px rgba(28,107,71,0)}100%{box-shadow:0 0 0 0 rgba(28,107,71,0)}}
@media (prefers-reduced-motion:reduce){#milesCard .pulse{animation:none}}
@media (min-width:960px){#vHome>#milesCard{grid-column:1/-1}}`;
document.head.appendChild(css);

/* ---------- Card on Home ---------- */
const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-12a7 7 0 00-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';
const home=$('vHome');
const card=document.createElement('div'); card.className='card'; card.id='milesCard';
if(home){ const anchor=home.querySelector('.datenav'); home.insertBefore(card,anchor?anchor.nextSibling:home.firstChild); }
let st={active:false,miles:0,start:0}, busy=false, timer=null;

function draw(){
  if(st.active){
    const t=new Date(st.start).toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit'});
    card.innerHTML=`<div class="row"><span class="ic">${PIN}</span><div><p><span class="pulse"></span>${esc(w('since',{t}))}</p><div class="big num" aria-live="polite">${esc(w('live',{m:mi(st.miles)}))}</div></div></div>
      <p>${esc(w('hint'))}</p><button type="button" class="go stop" id="milesBtn">${esc(w('end'))}</button>`;
  }else{
    card.innerHTML=`<div class="row"><span class="ic">${PIN}</span><div><h3>${esc(w('title'))}</h3><p>${esc(w('idle'))}</p></div></div>
      <button type="button" class="go" id="milesBtn">${esc(w('start'))}</button><p class="note">${esc(w('note'))}</p>`;
  }
  const b=$('milesBtn'); b.disabled=busy; b.onclick=st.active?stop:start;
}
async function refresh(){
  try{ st=await M.status(); }catch(e){}
  draw();
  if(!st.active) await collect();
  clearInterval(timer);
  if(st.active&&document.visibilityState==='visible') timer=setInterval(async()=>{ try{ st=await M.status(); draw(); if(!st.active) refresh(); }catch(e){} },5000);
}
async function start(){
  busy=true; draw();
  try{ await M.start(); st={active:true,miles:0,start:Date.now()}; say(w('hint')); }
  catch(e){ say(e&&e.code==='denied'?w('denied'):w('failed')); }
  busy=false; refresh();
}
async function stop(){
  busy=true; draw();
  try{ await M.stop(); }catch(e){}
  busy=false; st={active:false,miles:0,start:0}; refresh();
}

/* Finished drives (ended here or from the notification) go into that day's miles. */
async function collect(){
  let drives=[]; try{ drives=await M.take(); }catch(e){ return; }
  for(const d of drives){
    const miles=Math.round((Number(d.miles)||0)*10)/10;
    if(!(miles>0)){ say(w('none')); continue; }
    const date=typeof isoD==='function'?isoD(new Date(d.start)):new Date(d.start).toISOString().slice(0,10);
    if(typeof data==='undefined'||typeof persist!=='function') continue;
    const day=data.shifts.find(s=>s.date===date);
    const rec=day?{...day,miles:Math.round(((day.miles||0)+miles)*10)/10}:{id:newId('s'),date,miles};
    try{ await persist('shifts',rec); if(typeof gdAuto==='function') gdAuto(); }catch(e){ continue; }
    const today=typeof todayStr==='function'&&date===todayStr();
    say(w('added',{m:mi(miles),d:today?w('today'):new Date(d.start).toLocaleDateString(loc,{weekday:'short',month:'short',day:'numeric'})}));
  }
}

document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') refresh(); else clearInterval(timer); });
refresh();
})();
