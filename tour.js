/* Kept: app tour. Spotlights the real buttons one at a time with a short tip, so a new driver knows where everything is.
   Starts once after the welcome slides (first open), and any time from More › Help us improve › App tour.
   Keyboard: arrow keys move between steps, Esc closes. */
(function(){
'use strict';

/* ---------- Words ---------- */
const T={
en:{row:'App tour',rowSub:'Learn how Kept works',next:'Next',back:'Back',skip:'Skip tour',done:'Done',of:'{a} of {b}',logFirst:'Log my first day',
  s1t:'Your money at a glance',s1:'See what you earned and what you really kept after gas, tolls and repairs.',
  s2t:'Pick a period',s2:'Switch between Day, Week, Month and Year. Use the arrows to look back at earlier ones.',
  s3t:'Lyft and Uber, side by side',s3:'Hours, rides, miles and pay per hour for each app, so you can see which one pays you better.',
  s4t:'Log your day',s4:'Done driving? Tap + and enter what each app paid you, tips, rides and hours, plus gas and miles. It takes about a minute.',
  s5t:'Days',s5:'Every day you\'ve logged. Tap a day to fix it or delete it.',
  s6t:'Insights',s6:'Your month at a glance, tax estimates, and Lyft vs Uber over time.',
  s7t:'More',s7:'Backups, your account, My car, Appearance and help all live here.',
  s8t:'Keep your days safe',s8:'Create a free account, or back up to Google Drive, so nothing is lost if you change phones.',
  endT:'You\'re all set',end:'Log your first day after your next shift. You can replay this tour any time from More › App tour.'},
es:{row:'Recorrido por la app',rowSub:'Aprende cómo funciona Kept',next:'Siguiente',back:'Atrás',skip:'Saltar recorrido',done:'Listo',of:'{a} de {b}',logFirst:'Registrar mi primer día',
  s1t:'Tu dinero de un vistazo',s1:'Mira lo que ganaste y lo que realmente te quedó después de gasolina, peajes y reparaciones.',
  s2t:'Elige un periodo',s2:'Cambia entre Día, Semana, Mes y Año. Usa las flechas para ver periodos anteriores.',
  s3t:'Lyft y Uber, lado a lado',s3:'Horas, viajes, millas y pago por hora de cada app, para ver cuál te paga mejor.',
  s4t:'Registra tu día',s4:'¿Terminaste de manejar? Toca + e ingresa lo que te pagó cada app, propinas, viajes y horas, más gasolina y millas. Toma como un minuto.',
  s5t:'Días',s5:'Todos los días que registraste. Toca un día para corregirlo o borrarlo.',
  s6t:'Resumen',s6:'Tu mes de un vistazo, estimaciones de impuestos y Lyft vs Uber con el tiempo.',
  s7t:'Más',s7:'Respaldos, tu cuenta, Mi auto, Apariencia y ayuda están aquí.',
  s8t:'Protege tus días',s8:'Crea una cuenta gratis o respalda en Google Drive para no perder nada si cambias de teléfono.',
  endT:'Todo listo',end:'Registra tu primer día después de tu próximo turno. Puedes repetir este recorrido cuando quieras en Más › Recorrido por la app.'},
pt:{row:'Tour do app',rowSub:'Veja como o Kept funciona',next:'Próximo',back:'Voltar',skip:'Pular tour',done:'Pronto',of:'{a} de {b}',logFirst:'Registrar meu primeiro dia',
  s1t:'Seu dinheiro num relance',s1:'Veja quanto você ganhou e quanto realmente sobrou depois de gasolina, pedágios e reparos.',
  s2t:'Escolha um período',s2:'Alterne entre Dia, Semana, Mês e Ano. Use as setas para ver períodos anteriores.',
  s3t:'Lyft e Uber lado a lado',s3:'Horas, corridas, milhas e ganho por hora de cada app, para ver qual paga melhor.',
  s4t:'Registre seu dia',s4:'Terminou de dirigir? Toque em + e informe quanto cada app pagou, gorjetas, corridas e horas, além de gasolina e milhas. Leva cerca de um minuto.',
  s5t:'Dias',s5:'Todos os dias que você registrou. Toque em um dia para corrigir ou excluir.',
  s6t:'Análises',s6:'Seu mês num relance, estimativas de impostos e Lyft vs Uber ao longo do tempo.',
  s7t:'Mais',s7:'Backups, sua conta, Meu carro, Aparência e ajuda ficam aqui.',
  s8t:'Proteja seus dias',s8:'Crie uma conta grátis ou faça backup no Google Drive para não perder nada se trocar de celular.',
  endT:'Tudo pronto',end:'Registre seu primeiro dia depois do próximo turno. Você pode rever este tour a qualquer momento em Mais › Tour do app.'},
fr:{row:'Visite de l\'appli',rowSub:'Découvrez comment marche Kept',next:'Suivant',back:'Retour',skip:'Passer la visite',done:'Terminé',of:'{a} sur {b}',logFirst:'Noter ma première journée',
  s1t:'Votre argent en un coup d\'œil',s1:'Voyez ce que vous avez gagné et ce qui vous reste vraiment après carburant, péages et réparations.',
  s2t:'Choisissez une période',s2:'Passez de Jour à Semaine, Mois et Année. Les flèches montrent les périodes précédentes.',
  s3t:'Lyft et Uber côte à côte',s3:'Heures, courses, miles et gain horaire pour chaque appli, pour voir laquelle paie le mieux.',
  s4t:'Notez votre journée',s4:'Fini de conduire ? Touchez + et saisissez ce que chaque appli a payé, pourboires, courses et heures, plus carburant et miles. Environ une minute.',
  s5t:'Journées',s5:'Toutes les journées notées. Touchez une journée pour la corriger ou la supprimer.',
  s6t:'Analyses',s6:'Votre mois en un coup d\'œil, estimations d\'impôts et Lyft vs Uber dans le temps.',
  s7t:'Plus',s7:'Sauvegardes, votre compte, Ma voiture, Apparence et aide sont ici.',
  s8t:'Protégez vos journées',s8:'Créez un compte gratuit ou sauvegardez sur Google Drive pour ne rien perdre si vous changez de téléphone.',
  endT:'C\'est prêt',end:'Notez votre première journée après votre prochain service. Revoyez cette visite quand vous voulez dans Plus › Visite de l\'appli.'},
ru:{row:'Обзор приложения',rowSub:'Как пользоваться Kept',next:'Далее',back:'Назад',skip:'Пропустить',done:'Готово',of:'{a} из {b}',logFirst:'Записать первый день',
  s1t:'Деньги с первого взгляда',s1:'Сколько вы заработали и сколько реально осталось после бензина, платных дорог и ремонта.',
  s2t:'Выберите период',s2:'День, неделя, месяц или год. Стрелки показывают прошлые периоды.',
  s3t:'Lyft и Uber рядом',s3:'Часы, поездки, мили и доход в час по каждому приложению — видно, какое платит лучше.',
  s4t:'Запишите день',s4:'Закончили смену? Нажмите + и введите выплаты каждого приложения, чаевые, поездки и часы, а также бензин и мили. Это около минуты.',
  s5t:'Дни',s5:'Все записанные дни. Нажмите на день, чтобы исправить или удалить его.',
  s6t:'Аналитика',s6:'Месяц с первого взгляда, оценка налогов и Lyft против Uber со временем.',
  s7t:'Ещё',s7:'Резервные копии, аккаунт, Мой автомобиль, оформление и помощь — здесь.',
  s8t:'Сохраните свои дни',s8:'Создайте бесплатный аккаунт или сохраняйте копию в Google Диск, чтобы ничего не потерять при смене телефона.',
  endT:'Всё готово',end:'Запишите первый день после следующей смены. Обзор можно открыть снова в Ещё › Обзор приложения.'},
zh:{row:'应用导览',rowSub:'了解 Kept 怎么用',next:'下一步',back:'上一步',skip:'跳过导览',done:'完成',of:'{a}/{b}',logFirst:'记录我的第一天',
  s1t:'收入一目了然',s1:'看看你赚了多少，以及扣除油费、过路费和维修后真正到手多少。',
  s2t:'选择时间段',s2:'在日、周、月、年之间切换。用箭头查看以前的时间段。',
  s3t:'Lyft 和 Uber 并排对比',s3:'每个平台的时长、单数、里程和时薪，看看哪个更赚钱。',
  s4t:'记录你的一天',s4:'收工了？点按 +，输入每个平台付给你的钱、小费、单数和时长，以及油费和里程。大约一分钟。',
  s5t:'每日记录',s5:'你记录过的每一天。点按某天即可修改或删除。',
  s6t:'分析',s6:'本月概览、税务估算，以及 Lyft 与 Uber 的长期对比。',
  s7t:'更多',s7:'备份、账户、我的车、外观和帮助都在这里。',
  s8t:'保护好你的记录',s8:'创建免费账户或备份到 Google 云端硬盘，换手机也不会丢失。',
  endT:'准备就绪',end:'下次收工后记录你的第一天。随时可在 更多 › 应用导览 中重看。'},
vi:{row:'Hướng dẫn sử dụng',rowSub:'Tìm hiểu cách dùng Kept',next:'Tiếp',back:'Quay lại',skip:'Bỏ qua',done:'Xong',of:'{a}/{b}',logFirst:'Ghi ngày đầu tiên',
  s1t:'Tiền của bạn trong nháy mắt',s1:'Xem bạn đã kiếm được bao nhiêu và thực sự giữ lại bao nhiêu sau xăng, phí cầu đường và sửa chữa.',
  s2t:'Chọn khoảng thời gian',s2:'Chuyển giữa Ngày, Tuần, Tháng và Năm. Dùng mũi tên để xem các kỳ trước.',
  s3t:'Lyft và Uber cạnh nhau',s3:'Giờ, số chuyến, số dặm và thu nhập mỗi giờ của từng ứng dụng, để biết bên nào trả tốt hơn.',
  s4t:'Ghi lại ngày làm',s4:'Chạy xong? Nhấn + và nhập số tiền mỗi ứng dụng trả, tiền tip, số chuyến và giờ, cùng tiền xăng và số dặm. Chỉ mất khoảng một phút.',
  s5t:'Các ngày',s5:'Mọi ngày bạn đã ghi. Nhấn vào một ngày để sửa hoặc xóa.',
  s6t:'Phân tích',s6:'Tổng quan tháng, ước tính thuế và so sánh Lyft với Uber theo thời gian.',
  s7t:'Thêm',s7:'Sao lưu, tài khoản, Xe của tôi, Giao diện và trợ giúp đều ở đây.',
  s8t:'Giữ an toàn dữ liệu',s8:'Tạo tài khoản miễn phí hoặc sao lưu lên Google Drive để không mất gì khi đổi điện thoại.',
  endT:'Đã sẵn sàng',end:'Hãy ghi ngày đầu tiên sau ca chạy tới. Bạn có thể xem lại hướng dẫn này bất cứ lúc nào tại Thêm › Hướng dẫn sử dụng.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);

/* ---------- Steps: which screen, which element, which words ---------- */
const navBtn=v=>()=>[...document.querySelectorAll(`.nav [data-go="${v}"]`)].find(visible);
const STEPS=[
  {view:'home',el:()=>$('hero'),k:'s1'},
  {view:'home',el:()=>$('spanSeg'),k:'s2'},
  {view:'home',el:()=>$('tiles'),k:'s3'},
  {view:'home',el:navBtn('log'),k:'s4'},
  {view:'home',el:navBtn('days'),k:'s5'},
  {view:'home',el:navBtn('insights'),k:'s6'},
  {view:'home',el:navBtn('more'),k:'s7'},
  {view:'more',el:()=>$('acctRow')||$('driveBtn'),k:'s8'},
  {view:'home',el:null,k:'end'}
];
function visible(el){ if(!el) return false; const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'; }

/* ---------- Styles ---------- */
const css=document.createElement('style');
css.textContent=`
#tour{position:fixed;inset:0;z-index:1000}
#tour .hole{position:fixed;border-radius:16px;box-shadow:0 0 0 9999px rgba(8,14,11,.66);transition:all .28s ease;pointer-events:none;outline:2px solid rgba(255,255,255,.85);outline-offset:2px}
#tour .hole.none{box-shadow:0 0 0 9999px rgba(8,14,11,.66);outline:0;width:0!important;height:0!important}
#tour .tip{position:fixed;left:16px;width:min(400px,calc(100vw - 32px));box-sizing:border-box;background:var(--surface);color:var(--fg);border-radius:20px;padding:18px 18px 14px;box-shadow:0 18px 40px rgba(0,0,0,.35);transition:top .28s ease,bottom .28s ease;display:flex;flex-direction:column;gap:8px}
#tour .tip:focus{outline:none}
#tour .tip h2{margin:0;font-size:1.12rem}
#tour .tip p{margin:0;line-height:1.45;color:var(--fg)}
#tour .row{display:flex;align-items:center;gap:8px;margin-top:6px}
#tour .count{color:var(--muted);font-size:.85rem;margin-right:auto}
#tour .row button{border:1.5px solid var(--line);background:var(--surface);color:var(--fg);border-radius:12px;padding:9px 14px;font-weight:600}
#tour .row button.primary{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
#tour .skip{align-self:flex-start;border:0;background:none;color:var(--muted);font-size:.85rem;padding:2px 0;text-decoration:underline}
#tour .dots{display:flex;gap:5px}
#tour .dots i{width:6px;height:6px;border-radius:50%;background:var(--line)}
#tour .dots i.on{background:var(--accent)}
@media (prefers-reduced-motion:reduce){#tour .hole,#tour .tip{transition:none}}`;
document.head.appendChild(css);

/* ---------- Tour ---------- */
let box=null, i=0, lastFocus=null;
function start(){
  if(box) return;
  lastFocus=document.activeElement;
  box=document.createElement('div'); box.id='tour'; box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-labelledby','tourT');
  box.innerHTML='<div class="hole"></div><div class="tip" tabindex="-1"></div>';
  document.body.appendChild(box);
  box.addEventListener('click',e=>{ if(e.target===box) e.stopPropagation(); });   // taps outside the tip do nothing
  document.addEventListener('keydown',keys,true);
  addEventListener('resize',place); addEventListener('scroll',place,true);
  i=0; show();
}
function stop(){
  if(!box) return;
  box.remove(); box=null;
  document.removeEventListener('keydown',keys,true);
  removeEventListener('resize',place); removeEventListener('scroll',place,true);
  try{ localStorage.setItem((typeof KEY!=='undefined'?KEY:'kept')+'-toured','1'); }catch(e){}
  if(typeof window.keptGo==='function'&&typeof cur!=='undefined'&&cur!=='home'&&cur!=='log') window.keptGo('home');
  if(lastFocus&&lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
}
function keys(e){
  if(!box) return;
  if(e.key==='Escape'){ e.preventDefault(); stop(); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); go(1); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); go(-1); }
  else if(e.key==='Tab'){   // keep focus inside the tip
    const f=[...box.querySelectorAll('button')]; if(!f.length) return;
    const a=f[0], z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); }
    else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); }
  }
}
function go(d){ const n=i+d; if(n<0) return; if(n>=STEPS.length){ stop(); return; } i=n; show(); }
function show(){
  const s=STEPS[i], last=i===STEPS.length-1;
  if(typeof window.keptGo==='function'&&typeof cur!=='undefined'&&cur!==s.view) window.keptGo(s.view);
  const tip=box.querySelector('.tip');
  const dots=STEPS.map((_,n)=>`<i class="${n===i?'on':''}"></i>`).join('');
  tip.innerHTML=`${last?'':`<button type="button" class="skip" id="tourSkip">${esc(w('skip'))}</button>`}
    <h2 id="tourT">${esc(w(last?'endT':s.k+'t'))}</h2><p>${esc(w(last?'end':s.k))}</p>
    <div class="row"><span class="count"><span class="dots" aria-hidden="true">${dots}</span><span class="sr" style="position:absolute;left:-9999px">${esc(w('of',{a:i+1,b:STEPS.length}))}</span></span>
      ${i>0&&!last?`<button type="button" id="tourBack">${esc(w('back'))}</button>`:''}
      ${last?`<button type="button" id="tourDone">${esc(w('done'))}</button><button type="button" class="primary" id="tourLog">${esc(w('logFirst'))}</button>`:`<button type="button" class="primary" id="tourNext">${esc(w('next'))}</button>`}</div>`;
  const on=(id,f)=>{ const b=$(id); if(b) b.onclick=f; };
  on('tourSkip',stop); on('tourBack',()=>go(-1)); on('tourNext',()=>go(1)); on('tourDone',stop);
  on('tourLog',()=>{ stop(); if(typeof window.keptGo==='function') window.keptGo('log'); });
  // let the screen switch, then scroll the element into view and spotlight it
  setTimeout(()=>{
    if(!box) return;
    const el=s.el&&s.el();
    if(el&&visible(el)){ const r=el.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-90) el.scrollIntoView({block:'center',behavior:'instant'}); }
    place(); tip.focus({preventScroll:true});
    const btn=$('tourNext')||$('tourLog'); if(btn) btn.focus({preventScroll:true});
  },60);
}
function place(){
  if(!box) return;
  const s=STEPS[i], el=s.el&&s.el(), hole=box.querySelector('.hole'), tip=box.querySelector('.tip');
  const pad=8, gap=14;
  if(!el||!visible(el)){   // no element (last step): center the tip
    hole.classList.add('none'); hole.style.cssText=`left:50%;top:50%`;
    tip.style.top=Math.max(16,(innerHeight-tip.offsetHeight)/2)+'px'; tip.style.left=Math.max(16,(innerWidth-tip.offsetWidth)/2)+'px';
    return;
  }
  hole.classList.remove('none');
  const r=el.getBoundingClientRect();
  hole.style.left=(r.left-pad)+'px'; hole.style.top=(r.top-pad)+'px';
  hole.style.width=(r.width+pad*2)+'px'; hole.style.height=(r.height+pad*2)+'px';
  hole.style.borderRadius=(r.height<70&&r.width<90?'50%':'16px');
  const th=tip.offsetHeight, below=innerHeight-(r.bottom+pad+gap), above=r.top-pad-gap;
  if(below>=th+12||below>=above){ tip.style.top=Math.min(innerHeight-th-12,r.bottom+pad+gap)+'px'; }
  else { tip.style.top=Math.max(12,r.top-pad-gap-th)+'px'; }
  const tw=tip.offsetWidth;
  tip.style.left=Math.max(16,Math.min(innerWidth-tw-16,r.left+r.width/2-tw/2))+'px';   // centred under/over the element
  // on wide screens, sit beside a sidebar button rather than over the page
  if(innerWidth>=960&&r.right<300){ tip.style.left=(r.right+pad+gap)+'px'; tip.style.top=Math.max(12,Math.min(innerHeight-th-12,r.top-8))+'px'; }
}
window.keptTour=start;

/* ---------- First open: right after the welcome slides ---------- */
const wNext=$('wNext');
if(wNext){
  wNext.addEventListener('click',()=>{
    setTimeout(()=>{ let seen=false; try{ seen=!!localStorage.getItem((typeof KEY!=='undefined'?KEY:'kept')+'-toured'); }catch(e){}
      if(!seen&&typeof cur!=='undefined'&&cur==='home') start(); },350);
  });
}

/* ---------- "App tour" row in More › Help us improve ---------- */
const list=$('helpList');
if(list){
  const b=document.createElement('button'); b.type='button'; b.id='tourRow'; b.className='help';
  b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 014.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17h.01"/></svg><span style="text-align:left"><span>${esc(w('row'))}</span><small>${esc(w('rowSub'))}</small></span>`;
  b.onclick=start;
  list.insertBefore(b,list.firstChild);
}
})();
