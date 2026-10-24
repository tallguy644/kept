/* Kept Pro: 30-day free trial, then Taxes, Google Drive auto-backup and Excel export need Pro.
   Pro is bought only inside the store apps (Google Play, Microsoft Store) through the Digital Goods API.
   Free forever: logging days, totals, Lyft vs Uber, Customize, saving a backup file, and both Restore buttons
   (so nobody's data is ever held back). */
(function(){
'use strict';

/* ---------- Settings ---------- */
const PRO={
  enabled:false,            // LAUNCH SWITCH: set to true once the Pro products are live in both stores
  trialDays:30,
  skus:{monthly:'kept_pro_monthly',yearly:'kept_pro_yearly',lifetime:'kept_pro_lifetime'},
  prices:{monthly:'$1.99',yearly:'$14.99',lifetime:'$24.99'},   // shown until the store sends local prices
  ackUrl:'',                // Cloudflare Worker that acknowledges Google Play purchases (see worker/README.md). Required before launch on Play.
  playUrl:'',               // Google Play listing, e.g. https://play.google.com/store/apps/details?id=...
  msStoreUrl:'',            // Microsoft Store listing, e.g. https://apps.microsoft.com/detail/9N...
  playPackage:''            // Android package name, for the "Manage subscription" link
};
const STORES=[
  {name:'play',method:'https://play.google.com/billing'},
  {name:'microsoft',method:'https://store.microsoft.com/billing'}
];
const GATED=['taxBtn','exportBtn','gdBtn','taxExport','taxPrint'];
const DAY=864e5, GRACE=7*DAY;

/* Preview without launching: add ?pro=preview (trial running) or ?pro=expired (trial over) to the address. */
const preview=new URLSearchParams(location.search).get('pro');
const enabled=PRO.enabled||preview==='preview'||preview==='expired';

/* ---------- Words (English plus the app's six languages) ---------- */
const T={
en:{pro:'Pro',goPro:'Go Pro',proOn:'Pro ✓',trialLeft:'Free trial · {n} days left',trialLast:'Free trial · last day',
  title:'Kept Pro',done:'Done',
  stTrial:'Your free trial has {n} days left. After that, these need Pro:',stTrialLast:'Your free trial ends today. After that, these need Pro:',
  stEnded:'Your free trial has ended. Get Pro to use:',stPro:'You have Pro. Thanks for supporting Kept!',stLife:'You have Pro for life. Thanks for supporting Kept!',
  f1:'Taxes: yearly and quarterly estimates, tax report export and print',f2:'Google Drive: automatic backup every time you save, plus your Google Sheet',f3:'Export to Excel / Sheets',
  free:'Logging days, totals and Lyft vs Uber are always free.',
  monthly:'Monthly',yearly:'Yearly',lifetime:'Lifetime',perMo:'/month',perYr:'/year',once:'one time',best:'Best value',
  restore:'Restore purchases',manage:'Manage subscription',
  renew:'Subscriptions renew automatically until you cancel in your store account.',
  webOnly:'Pro is available in the Kept app on Google Play and the Microsoft Store.',
  getPlay:'Get it on Google Play',getMs:'Get it from Microsoft',
  working:'Opening the store…',thanks:'Pro unlocked. Thanks!',cancelled:'Purchase cancelled.',failed:'The purchase didn\'t go through. Try again.',
  restored:'Pro restored.',none:'No Pro purchase found for this store account.',
  needPro:'That\'s a Pro feature.',driveNeedsPro:'Google Drive backup is a Pro feature. Your days are still saved on this device.'},
es:{pro:'Pro',goPro:'Hazte Pro',proOn:'Pro ✓',trialLeft:'Prueba gratis · quedan {n} días',trialLast:'Prueba gratis · último día',
  title:'Kept Pro',done:'Listo',
  stTrial:'A tu prueba gratis le quedan {n} días. Después, esto requiere Pro:',stTrialLast:'Tu prueba gratis termina hoy. Después, esto requiere Pro:',
  stEnded:'Tu prueba gratis terminó. Hazte Pro para usar:',stPro:'Tienes Pro. ¡Gracias por apoyar Kept!',stLife:'Tienes Pro de por vida. ¡Gracias por apoyar Kept!',
  f1:'Impuestos: estimaciones anuales y trimestrales, exportar e imprimir el informe',f2:'Google Drive: respaldo automático cada vez que guardas, más tu hoja de Google',f3:'Exportar a Excel / Sheets',
  free:'Registrar días, los totales y Lyft vs Uber siempre son gratis.',
  monthly:'Mensual',yearly:'Anual',lifetime:'De por vida',perMo:'/mes',perYr:'/año',once:'pago único',best:'Mejor precio',
  restore:'Restaurar compras',manage:'Administrar suscripción',
  renew:'Las suscripciones se renuevan automáticamente hasta que las canceles en tu cuenta de la tienda.',
  webOnly:'Pro está disponible en la app Kept de Google Play y Microsoft Store.',
  getPlay:'Disponible en Google Play',getMs:'Obtener en Microsoft',
  working:'Abriendo la tienda…',thanks:'Pro activado. ¡Gracias!',cancelled:'Compra cancelada.',failed:'La compra no se completó. Inténtalo de nuevo.',
  restored:'Pro restaurado.',none:'No se encontró una compra de Pro en esta cuenta de la tienda.',
  needPro:'Esa función es de Pro.',driveNeedsPro:'El respaldo en Google Drive es una función de Pro. Tus días siguen guardados en este dispositivo.'},
pt:{pro:'Pro',goPro:'Seja Pro',proOn:'Pro ✓',trialLeft:'Teste grátis · faltam {n} dias',trialLast:'Teste grátis · último dia',
  title:'Kept Pro',done:'Pronto',
  stTrial:'Seu teste grátis tem mais {n} dias. Depois disso, isto exige Pro:',stTrialLast:'Seu teste grátis termina hoje. Depois disso, isto exige Pro:',
  stEnded:'Seu teste grátis terminou. Seja Pro para usar:',stPro:'Você tem Pro. Obrigado por apoiar o Kept!',stLife:'Você tem Pro vitalício. Obrigado por apoiar o Kept!',
  f1:'Impostos: estimativas anuais e trimestrais, exportar e imprimir o relatório',f2:'Google Drive: backup automático sempre que você salva, mais sua planilha Google',f3:'Exportar para Excel / Sheets',
  free:'Registrar dias, os totais e Lyft vs Uber são sempre grátis.',
  monthly:'Mensal',yearly:'Anual',lifetime:'Vitalício',perMo:'/mês',perYr:'/ano',once:'pagamento único',best:'Melhor preço',
  restore:'Restaurar compras',manage:'Gerenciar assinatura',
  renew:'As assinaturas renovam automaticamente até você cancelar na sua conta da loja.',
  webOnly:'O Pro está disponível no app Kept no Google Play e na Microsoft Store.',
  getPlay:'Disponível no Google Play',getMs:'Baixe na Microsoft',
  working:'Abrindo a loja…',thanks:'Pro ativado. Obrigado!',cancelled:'Compra cancelada.',failed:'A compra não foi concluída. Tente de novo.',
  restored:'Pro restaurado.',none:'Nenhuma compra do Pro encontrada nesta conta da loja.',
  needPro:'Esse recurso é do Pro.',driveNeedsPro:'O backup no Google Drive é um recurso Pro. Seus dias continuam salvos neste aparelho.'},
fr:{pro:'Pro',goPro:'Passer Pro',proOn:'Pro ✓',trialLeft:'Essai gratuit · {n} jours restants',trialLast:'Essai gratuit · dernier jour',
  title:'Kept Pro',done:'Terminé',
  stTrial:'Il reste {n} jours à votre essai gratuit. Ensuite, ceci nécessite Pro :',stTrialLast:'Votre essai gratuit se termine aujourd\'hui. Ensuite, ceci nécessite Pro :',
  stEnded:'Votre essai gratuit est terminé. Passez Pro pour utiliser :',stPro:'Vous avez Pro. Merci de soutenir Kept !',stLife:'Vous avez Pro à vie. Merci de soutenir Kept !',
  f1:'Impôts : estimations annuelles et trimestrielles, export et impression du rapport',f2:'Google Drive : sauvegarde automatique à chaque enregistrement, plus votre feuille Google',f3:'Exporter vers Excel / Sheets',
  free:'Saisir vos journées, les totaux et Lyft vs Uber restent toujours gratuits.',
  monthly:'Mensuel',yearly:'Annuel',lifetime:'À vie',perMo:'/mois',perYr:'/an',once:'paiement unique',best:'Meilleur prix',
  restore:'Restaurer les achats',manage:'Gérer l\'abonnement',
  renew:'Les abonnements se renouvellent automatiquement jusqu\'à résiliation dans votre compte de la boutique.',
  webOnly:'Pro est disponible dans l\'appli Kept sur Google Play et le Microsoft Store.',
  getPlay:'Disponible sur Google Play',getMs:'Obtenir sur Microsoft',
  working:'Ouverture de la boutique…',thanks:'Pro activé. Merci !',cancelled:'Achat annulé.',failed:'L\'achat n\'a pas abouti. Réessayez.',
  restored:'Pro restauré.',none:'Aucun achat Pro trouvé pour ce compte de la boutique.',
  needPro:'C\'est une fonction Pro.',driveNeedsPro:'La sauvegarde Google Drive est une fonction Pro. Vos journées restent enregistrées sur cet appareil.'},
ru:{pro:'Pro',goPro:'Перейти на Pro',proOn:'Pro ✓',trialLeft:'Пробный период · осталось дней: {n}',trialLast:'Пробный период · последний день',
  title:'Kept Pro',done:'Готово',
  stTrial:'До конца пробного периода осталось дней: {n}. Потом для этого нужен Pro:',stTrialLast:'Пробный период заканчивается сегодня. Потом для этого нужен Pro:',
  stEnded:'Пробный период закончился. Оформите Pro, чтобы пользоваться:',stPro:'У вас Pro. Спасибо за поддержку Kept!',stLife:'У вас Pro навсегда. Спасибо за поддержку Kept!',
  f1:'Налоги: годовые и квартальные оценки, экспорт и печать отчёта',f2:'Google Диск: автоматическая копия при каждом сохранении и ваша Google Таблица',f3:'Экспорт в Excel / Таблицы',
  free:'Запись дней, итоги и сравнение Lyft и Uber всегда бесплатны.',
  monthly:'На месяц',yearly:'На год',lifetime:'Навсегда',perMo:'/мес.',perYr:'/год',once:'разовый платёж',best:'Выгоднее всего',
  restore:'Восстановить покупки',manage:'Управлять подпиской',
  renew:'Подписка продлевается автоматически, пока вы не отмените её в аккаунте магазина.',
  webOnly:'Pro доступен в приложении Kept в Google Play и Microsoft Store.',
  getPlay:'Скачать в Google Play',getMs:'Скачать в Microsoft Store',
  working:'Открываем магазин…',thanks:'Pro включён. Спасибо!',cancelled:'Покупка отменена.',failed:'Покупка не прошла. Попробуйте ещё раз.',
  restored:'Pro восстановлен.',none:'Покупка Pro для этого аккаунта магазина не найдена.',
  needPro:'Это функция Pro.',driveNeedsPro:'Копия в Google Диск — функция Pro. Ваши дни по-прежнему сохранены на этом устройстве.'},
zh:{pro:'Pro',goPro:'升级 Pro',proOn:'Pro ✓',trialLeft:'免费试用 · 剩余 {n} 天',trialLast:'免费试用 · 最后一天',
  title:'Kept Pro',done:'完成',
  stTrial:'免费试用还剩 {n} 天。之后以下功能需要 Pro：',stTrialLast:'免费试用今天结束。之后以下功能需要 Pro：',
  stEnded:'免费试用已结束。升级 Pro 即可使用：',stPro:'你已拥有 Pro。感谢支持 Kept！',stLife:'你已拥有终身 Pro。感谢支持 Kept！',
  f1:'税务：年度和季度估算，导出和打印税务报告',f2:'Google 云端硬盘：每次保存自动备份，并更新你的 Google 表格',f3:'导出到 Excel / 表格',
  free:'记录每天、汇总和 Lyft 与 Uber 对比永远免费。',
  monthly:'按月',yearly:'按年',lifetime:'终身',perMo:'/月',perYr:'/年',once:'一次性',best:'最划算',
  restore:'恢复购买',manage:'管理订阅',
  renew:'订阅会自动续订，直到你在商店账户中取消。',
  webOnly:'Pro 可在 Google Play 和 Microsoft Store 的 Kept 应用中购买。',
  getPlay:'在 Google Play 获取',getMs:'从 Microsoft 获取',
  working:'正在打开商店…',thanks:'Pro 已解锁。谢谢！',cancelled:'购买已取消。',failed:'购买未完成，请重试。',
  restored:'Pro 已恢复。',none:'此商店账户中未找到 Pro 购买记录。',
  needPro:'这是 Pro 功能。',driveNeedsPro:'Google 云端硬盘备份是 Pro 功能。你的记录仍保存在此设备上。'},
vi:{pro:'Pro',goPro:'Nâng cấp Pro',proOn:'Pro ✓',trialLeft:'Dùng thử · còn {n} ngày',trialLast:'Dùng thử · ngày cuối',
  title:'Kept Pro',done:'Xong',
  stTrial:'Bản dùng thử còn {n} ngày. Sau đó, các tính năng này cần Pro:',stTrialLast:'Bản dùng thử kết thúc hôm nay. Sau đó, các tính năng này cần Pro:',
  stEnded:'Bản dùng thử đã kết thúc. Nâng cấp Pro để dùng:',stPro:'Bạn đã có Pro. Cảm ơn bạn đã ủng hộ Kept!',stLife:'Bạn có Pro trọn đời. Cảm ơn bạn đã ủng hộ Kept!',
  f1:'Thuế: ước tính theo năm và quý, xuất và in báo cáo thuế',f2:'Google Drive: tự sao lưu mỗi lần bạn lưu, kèm Google Trang tính của bạn',f3:'Xuất sang Excel / Trang tính',
  free:'Ghi ngày, tổng cộng và so sánh Lyft với Uber luôn miễn phí.',
  monthly:'Hàng tháng',yearly:'Hàng năm',lifetime:'Trọn đời',perMo:'/tháng',perYr:'/năm',once:'trả một lần',best:'Tiết kiệm nhất',
  restore:'Khôi phục giao dịch',manage:'Quản lý gói đăng ký',
  renew:'Gói đăng ký tự gia hạn cho đến khi bạn hủy trong tài khoản cửa hàng.',
  webOnly:'Pro có trong ứng dụng Kept trên Google Play và Microsoft Store.',
  getPlay:'Tải trên Google Play',getMs:'Tải từ Microsoft',
  working:'Đang mở cửa hàng…',thanks:'Đã mở khóa Pro. Cảm ơn bạn!',cancelled:'Đã hủy giao dịch.',failed:'Giao dịch chưa thành công. Hãy thử lại.',
  restored:'Đã khôi phục Pro.',none:'Không tìm thấy giao dịch Pro cho tài khoản cửa hàng này.',
  needPro:'Đây là tính năng Pro.',driveNeedsPro:'Sao lưu Google Drive là tính năng Pro. Dữ liệu của bạn vẫn được lưu trên thiết bị này.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);

/* ---------- Saved state ---------- */
const PK=(typeof KEY!=='undefined'?KEY:'kept')+'-pro';
let st={}; try{ st=JSON.parse(localStorage.getItem(PK)||'{}'); }catch(e){}
const saveSt=()=>{ try{ localStorage.setItem(PK,JSON.stringify(st)); }catch(e){} };
if(enabled&&!st.trialStart){ st.trialStart=Date.now(); saveSt(); }
if(preview==='expired') st.trialStart=Date.now()-(PRO.trialDays+1)*DAY;

function daysLeft(){ return Math.max(0,PRO.trialDays-Math.floor((Date.now()-st.trialStart)/DAY)); }
function owned(){ return !!(st.ent&&Date.now()-st.ent.checked<GRACE); }
function trialOn(){ return daysLeft()>0; }
function isPro(){ return !enabled||owned()||trialOn(); }
window.keptIsPro=isPro;

/* ---------- Store connection (only inside the Google Play / Microsoft Store apps) ---------- */
let store=null, details={};
const skuList=Object.values(PRO.skus);
const planOf=sku=>Object.keys(PRO.skus).find(k=>PRO.skus[k]===sku);
async function connect(){
  if(!('getDigitalGoodsService' in window)) return null;
  for(const s of STORES){
    try{ const svc=await window.getDigitalGoodsService(s.method); if(svc){ store={...s,svc}; break; } }catch(e){}
  }
  if(!store) return null;
  try{ (await store.svc.getDetails(skuList)).forEach(d=>{ details[d.itemId]=d; }); }catch(e){}
  return store;
}
function priceOf(plan){
  const d=details[PRO.skus[plan]];
  if(d&&d.price){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:d.price.currency}).format(Number(d.price.value)); }catch(e){} }
  return PRO.prices[plan];
}
async function ackPlay(p){
  if(store.name!=='play'||!PRO.ackUrl||(st.acked||[]).includes(p.purchaseToken)) return;
  const plan=planOf(p.itemId);
  const r=await fetch(PRO.ackUrl.replace(/\/$/,'')+'/play/ack',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sku:p.itemId,token:p.purchaseToken,type:plan==='lifetime'?'inapp':'sub'})});
  if(r.ok){ st.acked=[...(st.acked||[]),p.purchaseToken].slice(-20); saveSt(); }
}
async function refresh(){
  if(!store) return false;
  let list;
  try{ list=await store.svc.listPurchases(); }catch(e){ return owned(); }   // offline: keep what we knew (7-day grace)
  const mine=list.filter(p=>skuList.includes(p.itemId));
  for(const p of mine){ try{ await ackPlay(p); }catch(e){} }
  const best=mine.find(p=>p.itemId===PRO.skus.lifetime)||mine[0];
  st.ent=best?{sku:best.itemId,checked:Date.now()}:null; saveSt();
  return !!best;
}
async function buy(plan){
  const sku=PRO.skus[plan]; say(w('working'));
  try{
    const req=new PaymentRequest([{supportedMethods:store.method,data:{sku}}],{total:{label:'Total',amount:{currency:'USD',value:'0'}}});
    const res=await req.show();
    const token=res.details&&(res.details.purchaseToken||res.details.token);
    await res.complete('success');
    if(token) try{ await ackPlay({itemId:sku,purchaseToken:token}); }catch(e){}
    const ok=await refresh()||!!token;
    if(ok&&!st.ent){ st.ent={sku,checked:Date.now()}; saveSt(); }
    update(); say(ok?w('thanks'):w('failed'));
  }catch(e){ say(e&&e.name==='AbortError'?w('cancelled'):w('failed')); }
}
function manageUrl(){
  if(store&&store.name==='microsoft') return 'https://account.microsoft.com/services';
  const sku=st.ent&&st.ent.sku;
  return 'https://play.google.com/store/account/subscriptions'+(sku&&PRO.playPackage?`?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(PRO.playPackage)}`:'');
}

/* ---------- Screen ---------- */
const css=document.createElement('style');
css.textContent=`
.pro-lock::after{content:"PRO";display:inline-block;margin-left:6px;padding:0 5px;border-radius:4px;font-size:.66rem;font-weight:700;letter-spacing:.06em;line-height:1.5;vertical-align:1px;background:var(--accent);color:var(--accent-fg)}
#proBtn.on{color:var(--accent)}
.pro{display:flex;flex-direction:column;gap:14px}
.pro-status{margin:0;font-weight:600}
.pro ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.pro-free{margin:0;font-size:.88rem;color:var(--muted)}
.pro-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
@media (max-width:480px){.pro-plans{grid-template-columns:1fr}}
.pro-plans button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:14px 8px;position:relative;border:1.5px solid var(--line);background:var(--surface);border-radius:16px;color:var(--fg)}
.pro-plans button.primary{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
.pro-links .btn,.pro-links button{flex:1;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);border-radius:14px;padding:12px;font-weight:600;text-align:center;text-decoration:none}
.pro-links .btn.primary{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
#proSlot:not(:has(button:not([hidden]))){display:none}
.pro-plans b{font-size:1.25rem;font-family:var(--display)}
.pro-plans small{font-size:.78rem;font-weight:500;opacity:.85}
.pro-plans .tag{position:absolute;top:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:.66rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:1px 7px;border-radius:99px;background:var(--fg);color:var(--bg)}
.pro-links{display:flex;gap:8px;flex-wrap:wrap}
.pro-note{margin:0;font-size:.8rem;color:var(--muted)}
.pro-msg{margin:0;font-size:.9rem;min-height:1.2em}
@media print{#proSec{display:none!important}}`;
document.head.appendChild(css);

const bar=document.getElementById('proSlot')||document.querySelector('.syncbar span[style]');
const btn=document.createElement('button'); btn.type='button'; btn.id='proBtn'; btn.setAttribute('aria-controls','proSec');
const sec=document.createElement('section'); sec.className='view'; sec.id='proSec'; sec.hidden=true; sec.setAttribute('aria-labelledby','proTitle');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function say(t){ const m=document.getElementById('proMsg'); if(m) m.textContent=t||''; }

function draw(){
  const left=daysLeft(), life=owned()&&st.ent.sku===PRO.skus.lifetime;
  const status= owned()?(life?w('stLife'):w('stPro')) : trialOn()?(left===1?w('stTrialLast'):w('stTrial',{n:left})) : w('stEnded');
  let buyHtml='';
  if(!owned()){
    if(store){
      buyHtml=`<div class="pro-plans">
        <button type="button" data-plan="monthly"><span>${esc(w('monthly'))}</span><b>${esc(priceOf('monthly'))}</b><small>${esc(w('perMo'))}</small></button>
        <button type="button" class="primary" data-plan="yearly"><span class="tag">${esc(w('best'))}</span><span>${esc(w('yearly'))}</span><b>${esc(priceOf('yearly'))}</b><small>${esc(w('perYr'))}</small></button>
        <button type="button" data-plan="lifetime"><span>${esc(w('lifetime'))}</span><b>${esc(priceOf('lifetime'))}</b><small>${esc(w('once'))}</small></button>
      </div>
      <div class="pro-links"><button type="button" id="proRestore">${esc(w('restore'))}</button></div>
      <p class="pro-note">${esc(w('renew'))}</p>`;
    }else{
      const links=[PRO.playUrl&&`<a class="btn primary" href="${esc(PRO.playUrl)}" target="_blank" rel="noopener">${esc(w('getPlay'))}</a>`,
                   PRO.msStoreUrl&&`<a class="btn primary" href="${esc(PRO.msStoreUrl)}" target="_blank" rel="noopener">${esc(w('getMs'))}</a>`].filter(Boolean).join('');
      buyHtml=`<p class="pro-free">${esc(w('webOnly'))}</p>${links?`<div class="pro-links">${links}</div>`:''}`;
    }
  }else if(store&&!life){
    buyHtml=`<div class="pro-links"><a class="btn" href="${esc(manageUrl())}" target="_blank" rel="noopener">${esc(w('manage'))}</a></div>`;
  }
  sec.innerHTML=`<div class="page-top"><button type="button" class="back" id="proDone" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1 id="proTitle">${esc(w('title'))}</h1><span></span></div>
    <div class="card pro">
      <p class="pro-status">${esc(status)}</p>
      <ul><li>${esc(w('f1'))}</li><li>${esc(w('f2'))}</li><li>${esc(w('f3'))}</li></ul>
      <p class="pro-free">${esc(w('free'))}</p>
      ${buyHtml}
      <p class="pro-msg" id="proMsg" role="status"></p>
    </div>`;
  sec.querySelector('#proDone').onclick=()=>{ show(false); btn.focus(); };
  sec.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>buy(b.dataset.plan));
  const r=sec.querySelector('#proRestore');
  if(r) r.onclick=async()=>{ say(w('working')); const ok=await refresh(); update(); say(ok?w('restored'):w('none')); };
}
function show(open,msg){
  if(open){ draw(); if(msg) say(msg); }
  btn.setAttribute('aria-expanded',String(open));
  if(window.keptGo){ if(open) window.keptGo('pro'); else window.keptBack(); return; }
  sec.hidden=!open; if(open) sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function update(){
  if(!enabled){ btn.hidden=true; return; }
  btn.hidden=false;
  const left=daysLeft();
  btn.classList.toggle('on',owned());
  btn.textContent= owned()?w('proOn') : trialOn()?(left===1?w('trialLast'):w('trialLeft',{n:left})) : w('goPro');
  const locked=!isPro();
  GATED.forEach(id=>{ const b=document.getElementById(id); if(b) b.classList.toggle('pro-lock',locked); });
  if(locked&&!document.getElementById('taxSec').hidden&&typeof showTax==='function') showTax(false);
  if(!sec.hidden) draw();
}

if(bar){ bar.prepend(btn); }
const shell=document.getElementById('shell'); if(shell) shell.appendChild(sec); else { const app=document.getElementById('app'); app.parentNode.insertBefore(sec,app); }
btn.onclick=()=>show(sec.hidden);

/* Block Pro features when locked: this runs before each button's own handler. */
document.addEventListener('click',e=>{
  if(isPro()) return;
  const b=e.target.closest&&e.target.closest(GATED.map(id=>'#'+id).join(','));
  if(!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  show(true,w('needPro'));
},true);

/* Google Drive auto-backup only runs with Pro. */
if(typeof gdAuto==='function'){
  const orig=gdAuto;
  gdAuto=function(){ if(isPro()) return orig.apply(this,arguments); if(typeof gdState!=='undefined'&&gdState.connected) setSync(w('driveNeedsPro'),'off'); };
}
if(typeof gdStatus==='function'){
  const orig=gdStatus;
  gdStatus=function(){ const r=orig.apply(this,arguments); if(!isPro()&&typeof gdState!=='undefined'&&gdState.connected) setSync(w('driveNeedsPro'),'off'); update(); return r; };
}

update();
if(enabled){
  // Show the upgrade screen once when the trial runs out.
  if(!isPro()&&!st.endShown){ st.endShown=true; saveSt(); setTimeout(()=>show(true),400); }
  connect().then(s=>{ if(s) return refresh(); }).then(()=>update()).catch(()=>{});
  // Re-check when the app comes back to the front (renewals, cancellations, the day ticking over).
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'){ refresh().catch(()=>{}).then(update); } });
}
})();
