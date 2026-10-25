/* Kept Pro: 7-day free trial, then Taxes, Google Drive auto-backup and Excel export need Pro.
   Pro is bought only inside the store apps (Google Play, Microsoft Store) through the Digital Goods API, and is tied to
   the driver's Kept account: the Pro server (worker/) checks the purchase and marks the account Pro, so it unlocks on
   every device and on the website where they sign in. The free trial follows the account too.
   Free forever: logging days, totals, Lyft vs Uber, Customize, saving a backup file, and both Restore buttons
   (so nobody's data is ever held back). */
(function(){
'use strict';

/* ---------- Settings ---------- */
const PRO={
  enabled:false,            // LAUNCH SWITCH: set to true once the Pro products are live in both stores
  lockBeforeLaunch:true,    // until launch, Pro features stay locked for everyone (no trial yet); gifted Pro still unlocks
  trialDays:7,
  skus:{monthly:'kept_pro_monthly',yearly:'kept_pro_yearly',lifetime:'kept_pro_lifetime'},
  prices:{monthly:'$1.99',yearly:'$14.99',lifetime:'$24.99'},   // shown until the store sends local prices
  workerUrl:'',             // Pro server (Cloudflare Worker in worker/): checks purchases, links them to accounts. Required before launch.
  playUrl:'',               // Google Play listing, e.g. https://play.google.com/store/apps/details?id=...
  msStoreUrl:'',            // Microsoft Store listing, e.g. https://apps.microsoft.com/detail/9N...
  playPackage:'com.desertcircuitapps.kept'   // Android package name, for the "Manage subscription" link
};
Object.assign(PRO,window.KEPT_PRO_SETTINGS||{});   // lets automated tests point at a stand-in server
window.keptWorkerUrl=PRO.workerUrl;
const STORES=[
  {name:'play',method:'https://play.google.com/billing'},
  {name:'microsoft',method:'https://store.microsoft.com/billing'}
];
const GATED=['taxBtn','cmpBtn','trendBtn','gdBtn','taxExport','taxPrint'];
const DAY=864e5, GRACE=7*DAY;

/* Preview without launching: add ?pro=preview (trial running) or ?pro=expired (trial over) to the address. */
const preview=new URLSearchParams(location.search).get('pro');
const enabled=PRO.enabled||preview==='preview'||preview==='expired';
window.keptProEnabled=enabled;
const preLock=!enabled&&PRO.lockBeforeLaunch!==false;   // before launch: Pro features locked, "coming soon" note instead of plans   // account.js starts the account's trial clock only once Pro is live

/* ---------- Words (English plus the app's six languages) ---------- */
const T={
en:{soonT:'Kept Pro is coming soon',soonP:'The Taxes report, Compare and Trends, and Google Drive backup are part of Kept Pro, which is coming soon. When it launches, every driver gets a 7-day free trial first. Logging your days, totals, Lyft vs Uber, backup files and Excel export stay free.',soonToast:'Kept Pro is coming soon, with a 7-day free trial.',pro:'Pro',goPro:'Go Pro',proOn:'Pro ✓',trialLeft:'Free trial · {n} days left',trialLast:'Free trial · last day',
  title:'Kept Pro',done:'Done',
  stTrial:'Your free trial has {n} days left. After that, these need Pro:',stTrialLast:'Your free trial ends today. After that, these need Pro:',
  stEnded:'Your free trial has ended. Get Pro to use:',stPro:'You have Pro. Thanks for supporting Kept!',stLife:'You have Pro for life. Thanks for supporting Kept!',
  f1:'Taxes: yearly and quarterly estimates, tax report export and print',f2:'Google Drive: automatic backup every time you save, plus your Google Sheet',f3:'Compare and Trends: month-by-month Lyft vs Uber comparisons and earnings trends',
  free:'Logging days, totals, Lyft vs Uber on Home, backup files and Excel export are always free.',
  monthly:'Monthly',yearly:'Yearly',lifetime:'Lifetime',perMo:'/month',perYr:'/year',once:'one time',best:'Best value',
  restore:'Restore purchases',manage:'Manage subscription',
  renew:'Subscriptions renew automatically until you cancel in your store account.',
  webOnly:'Pro is available in the Kept app on Google Play and the Microsoft Store.',
  getPlay:'Get it on Google Play',getMs:'Get it from Microsoft',
  working:'Opening the store…',thanks:'Pro unlocked. Thanks!',cancelled:'Purchase cancelled.',failed:'The purchase didn\'t go through. Try again.',
  restored:'Pro restored.',none:'No Pro purchase found for this store account.',
  needPro:'That\'s a Pro feature.',driveNeedsPro:'Google Drive backup is a Pro feature. Your days are still saved on this device.',stAcct:'Pro is active on your Kept account, on all your devices.',signInPro:'Bought Pro in the Kept app? Sign in with the same account to use it here.',signIn:'Sign in',linked:'Pro is now linked to your account, so it works on all your devices.',other:'This purchase is already linked to a different Kept account.',signInFirst:'Sign in first so Pro follows you to all your devices.'},
es:{soonT:'Kept Pro llegará pronto',soonP:'El informe de impuestos, Comparar y Tendencias, y el respaldo en Google Drive son parte de Kept Pro, que llegará pronto. Cuando se lance, cada conductor tendrá primero 7 días de prueba gratis. Registrar tus días, los totales, Lyft vs Uber, las copias de respaldo y la exportación a Excel siguen siendo gratis.',soonToast:'Kept Pro llegará pronto, con 7 días de prueba gratis.',pro:'Pro',goPro:'Hazte Pro',proOn:'Pro ✓',trialLeft:'Prueba gratis · quedan {n} días',trialLast:'Prueba gratis · último día',
  title:'Kept Pro',done:'Listo',
  stTrial:'A tu prueba gratis le quedan {n} días. Después, esto requiere Pro:',stTrialLast:'Tu prueba gratis termina hoy. Después, esto requiere Pro:',
  stEnded:'Tu prueba gratis terminó. Hazte Pro para usar:',stPro:'Tienes Pro. ¡Gracias por apoyar Kept!',stLife:'Tienes Pro de por vida. ¡Gracias por apoyar Kept!',
  f1:'Impuestos: estimaciones anuales y trimestrales, exportar e imprimir el informe',f2:'Google Drive: respaldo automático cada vez que guardas, más tu hoja de Google',f3:'Comparar y Tendencias: comparaciones mes a mes de Lyft vs Uber y tendencias de ganancias',
  free:'Registrar días, los totales, Lyft vs Uber en Inicio, las copias de respaldo y la exportación a Excel siempre son gratis.',
  monthly:'Mensual',yearly:'Anual',lifetime:'De por vida',perMo:'/mes',perYr:'/año',once:'pago único',best:'Mejor precio',
  restore:'Restaurar compras',manage:'Administrar suscripción',
  renew:'Las suscripciones se renuevan automáticamente hasta que las canceles en tu cuenta de la tienda.',
  webOnly:'Pro está disponible en la app Kept de Google Play y Microsoft Store.',
  getPlay:'Disponible en Google Play',getMs:'Obtener en Microsoft',
  working:'Abriendo la tienda…',thanks:'Pro activado. ¡Gracias!',cancelled:'Compra cancelada.',failed:'La compra no se completó. Inténtalo de nuevo.',
  restored:'Pro restaurado.',none:'No se encontró una compra de Pro en esta cuenta de la tienda.',
  needPro:'Esa función es de Pro.',driveNeedsPro:'El respaldo en Google Drive es una función de Pro. Tus días siguen guardados en este dispositivo.',stAcct:'Pro está activo en tu cuenta de Kept, en todos tus dispositivos.',signInPro:'¿Compraste Pro en la app Kept? Inicia sesión con la misma cuenta para usarlo aquí.',signIn:'Iniciar sesión',linked:'Pro ya está vinculado a tu cuenta y funciona en todos tus dispositivos.',other:'Esta compra ya está vinculada a otra cuenta de Kept.',signInFirst:'Inicia sesión primero para que Pro te siga en todos tus dispositivos.'},
pt:{soonT:'O Kept Pro chega em breve',soonP:'O relatório de impostos, Comparar e Tendências, e o backup no Google Drive fazem parte do Kept Pro, que chega em breve. No lançamento, todo motorista ganha primeiro 7 dias de teste grátis. Registrar seus dias, os totais, Lyft vs Uber, os arquivos de backup e a exportação para Excel continuam grátis.',soonToast:'O Kept Pro chega em breve, com 7 dias de teste grátis.',pro:'Pro',goPro:'Seja Pro',proOn:'Pro ✓',trialLeft:'Teste grátis · faltam {n} dias',trialLast:'Teste grátis · último dia',
  title:'Kept Pro',done:'Pronto',
  stTrial:'Seu teste grátis tem mais {n} dias. Depois disso, isto exige Pro:',stTrialLast:'Seu teste grátis termina hoje. Depois disso, isto exige Pro:',
  stEnded:'Seu teste grátis terminou. Seja Pro para usar:',stPro:'Você tem Pro. Obrigado por apoiar o Kept!',stLife:'Você tem Pro vitalício. Obrigado por apoiar o Kept!',
  f1:'Impostos: estimativas anuais e trimestrais, exportar e imprimir o relatório',f2:'Google Drive: backup automático sempre que você salva, mais sua planilha Google',f3:'Comparar e Tendências: comparações mês a mês de Lyft vs Uber e tendências de ganhos',
  free:'Registrar dias, os totais, Lyft vs Uber no Início, os arquivos de backup e a exportação para Excel são sempre grátis.',
  monthly:'Mensal',yearly:'Anual',lifetime:'Vitalício',perMo:'/mês',perYr:'/ano',once:'pagamento único',best:'Melhor preço',
  restore:'Restaurar compras',manage:'Gerenciar assinatura',
  renew:'As assinaturas renovam automaticamente até você cancelar na sua conta da loja.',
  webOnly:'O Pro está disponível no app Kept no Google Play e na Microsoft Store.',
  getPlay:'Disponível no Google Play',getMs:'Baixe na Microsoft',
  working:'Abrindo a loja…',thanks:'Pro ativado. Obrigado!',cancelled:'Compra cancelada.',failed:'A compra não foi concluída. Tente de novo.',
  restored:'Pro restaurado.',none:'Nenhuma compra do Pro encontrada nesta conta da loja.',
  needPro:'Esse recurso é do Pro.',driveNeedsPro:'O backup no Google Drive é um recurso Pro. Seus dias continuam salvos neste aparelho.',stAcct:'O Pro está ativo na sua conta Kept, em todos os seus aparelhos.',signInPro:'Comprou o Pro no app Kept? Entre com a mesma conta para usá-lo aqui.',signIn:'Entrar',linked:'O Pro agora está vinculado à sua conta e funciona em todos os seus aparelhos.',other:'Esta compra já está vinculada a outra conta Kept.',signInFirst:'Entre primeiro para que o Pro acompanhe você em todos os aparelhos.'},
fr:{soonT:'Kept Pro arrive bientôt',soonP:'Le rapport fiscal, Comparer et Tendances, et la sauvegarde Google Drive font partie de Kept Pro, qui arrive bientôt. À son lancement, chaque chauffeur aura d\'abord 7 jours d\'essai gratuit. Noter vos journées, les totaux, Lyft vs Uber, les fichiers de sauvegarde et l\'export Excel restent gratuits.',soonToast:'Kept Pro arrive bientôt, avec 7 jours d\'essai gratuit.',pro:'Pro',goPro:'Passer Pro',proOn:'Pro ✓',trialLeft:'Essai gratuit · {n} jours restants',trialLast:'Essai gratuit · dernier jour',
  title:'Kept Pro',done:'Terminé',
  stTrial:'Il reste {n} jours à votre essai gratuit. Ensuite, ceci nécessite Pro :',stTrialLast:'Votre essai gratuit se termine aujourd\'hui. Ensuite, ceci nécessite Pro :',
  stEnded:'Votre essai gratuit est terminé. Passez Pro pour utiliser :',stPro:'Vous avez Pro. Merci de soutenir Kept !',stLife:'Vous avez Pro à vie. Merci de soutenir Kept !',
  f1:'Impôts : estimations annuelles et trimestrielles, export et impression du rapport',f2:'Google Drive : sauvegarde automatique à chaque enregistrement, plus votre feuille Google',f3:'Comparer et Tendances : comparaisons mois par mois Lyft vs Uber et évolution des gains',
  free:'Saisir vos journées, les totaux, Lyft vs Uber sur l\'Accueil, les fichiers de sauvegarde et l\'export Excel restent toujours gratuits.',
  monthly:'Mensuel',yearly:'Annuel',lifetime:'À vie',perMo:'/mois',perYr:'/an',once:'paiement unique',best:'Meilleur prix',
  restore:'Restaurer les achats',manage:'Gérer l\'abonnement',
  renew:'Les abonnements se renouvellent automatiquement jusqu\'à résiliation dans votre compte de la boutique.',
  webOnly:'Pro est disponible dans l\'appli Kept sur Google Play et le Microsoft Store.',
  getPlay:'Disponible sur Google Play',getMs:'Obtenir sur Microsoft',
  working:'Ouverture de la boutique…',thanks:'Pro activé. Merci !',cancelled:'Achat annulé.',failed:'L\'achat n\'a pas abouti. Réessayez.',
  restored:'Pro restauré.',none:'Aucun achat Pro trouvé pour ce compte de la boutique.',
  needPro:'C\'est une fonction Pro.',driveNeedsPro:'La sauvegarde Google Drive est une fonction Pro. Vos journées restent enregistrées sur cet appareil.',stAcct:'Pro est actif sur votre compte Kept, sur tous vos appareils.',signInPro:'Vous avez acheté Pro dans l\'appli Kept ? Connectez-vous avec le même compte pour l\'utiliser ici.',signIn:'Se connecter',linked:'Pro est maintenant lié à votre compte et fonctionne sur tous vos appareils.',other:'Cet achat est déjà lié à un autre compte Kept.',signInFirst:'Connectez-vous d\'abord pour que Pro vous suive sur tous vos appareils.'},
ru:{soonT:'Kept Pro скоро появится',soonP:'Налоговый отчёт, вкладки «Сравнение» и «Динамика» и резервная копия в Google Диске входят в Kept Pro, который скоро появится. После запуска каждый водитель сначала получит 7 дней бесплатно. Запись дней, итоги, сравнение Lyft и Uber, файлы резервных копий и экспорт в Excel остаются бесплатными.',soonToast:'Kept Pro скоро появится, с 7 днями бесплатно.',pro:'Pro',goPro:'Перейти на Pro',proOn:'Pro ✓',trialLeft:'Пробный период · осталось дней: {n}',trialLast:'Пробный период · последний день',
  title:'Kept Pro',done:'Готово',
  stTrial:'До конца пробного периода осталось дней: {n}. Потом для этого нужен Pro:',stTrialLast:'Пробный период заканчивается сегодня. Потом для этого нужен Pro:',
  stEnded:'Пробный период закончился. Оформите Pro, чтобы пользоваться:',stPro:'У вас Pro. Спасибо за поддержку Kept!',stLife:'У вас Pro навсегда. Спасибо за поддержку Kept!',
  f1:'Налоги: годовые и квартальные оценки, экспорт и печать отчёта',f2:'Google Диск: автоматическая копия при каждом сохранении и ваша Google Таблица',f3:'Сравнение и Динамика: помесячное сравнение Lyft и Uber и динамика заработка',
  free:'Запись дней, итоги, сравнение Lyft и Uber на главной, файлы резервных копий и экспорт в Excel всегда бесплатны.',
  monthly:'На месяц',yearly:'На год',lifetime:'Навсегда',perMo:'/мес.',perYr:'/год',once:'разовый платёж',best:'Выгоднее всего',
  restore:'Восстановить покупки',manage:'Управлять подпиской',
  renew:'Подписка продлевается автоматически, пока вы не отмените её в аккаунте магазина.',
  webOnly:'Pro доступен в приложении Kept в Google Play и Microsoft Store.',
  getPlay:'Скачать в Google Play',getMs:'Скачать в Microsoft Store',
  working:'Открываем магазин…',thanks:'Pro включён. Спасибо!',cancelled:'Покупка отменена.',failed:'Покупка не прошла. Попробуйте ещё раз.',
  restored:'Pro восстановлен.',none:'Покупка Pro для этого аккаунта магазина не найдена.',
  needPro:'Это функция Pro.',driveNeedsPro:'Копия в Google Диск — функция Pro. Ваши дни по-прежнему сохранены на этом устройстве.',stAcct:'Pro активен в вашем аккаунте Kept на всех устройствах.',signInPro:'Купили Pro в приложении Kept? Войдите в тот же аккаунт, чтобы пользоваться им здесь.',signIn:'Войти',linked:'Pro привязан к вашему аккаунту и работает на всех устройствах.',other:'Эта покупка уже привязана к другому аккаунту Kept.',signInFirst:'Сначала войдите, чтобы Pro работал на всех ваших устройствах.'},
zh:{soonT:'Kept Pro 即将推出',soonP:'税务报告、对比和趋势，以及 Google 云端硬盘备份属于即将推出的 Kept Pro。推出后，每位司机都可先免费试用 7 天。记录每天、汇总、Lyft 与 Uber 对比、备份文件和导出到 Excel 仍然免费。',soonToast:'Kept Pro 即将推出，可免费试用 7 天。',pro:'Pro',goPro:'升级 Pro',proOn:'Pro ✓',trialLeft:'免费试用 · 剩余 {n} 天',trialLast:'免费试用 · 最后一天',
  title:'Kept Pro',done:'完成',
  stTrial:'免费试用还剩 {n} 天。之后以下功能需要 Pro：',stTrialLast:'免费试用今天结束。之后以下功能需要 Pro：',
  stEnded:'免费试用已结束。升级 Pro 即可使用：',stPro:'你已拥有 Pro。感谢支持 Kept！',stLife:'你已拥有终身 Pro。感谢支持 Kept！',
  f1:'税务：年度和季度估算，导出和打印税务报告',f2:'Google 云端硬盘：每次保存自动备份，并更新你的 Google 表格',f3:'对比和趋势：逐月 Lyft 与 Uber 对比和收入趋势',
  free:'记录每天、汇总、首页的 Lyft 与 Uber 对比、备份文件和导出到 Excel 永远免费。',
  monthly:'按月',yearly:'按年',lifetime:'终身',perMo:'/月',perYr:'/年',once:'一次性',best:'最划算',
  restore:'恢复购买',manage:'管理订阅',
  renew:'订阅会自动续订，直到你在商店账户中取消。',
  webOnly:'Pro 可在 Google Play 和 Microsoft Store 的 Kept 应用中购买。',
  getPlay:'在 Google Play 获取',getMs:'从 Microsoft 获取',
  working:'正在打开商店…',thanks:'Pro 已解锁。谢谢！',cancelled:'购买已取消。',failed:'购买未完成，请重试。',
  restored:'Pro 已恢复。',none:'此商店账户中未找到 Pro 购买记录。',
  needPro:'这是 Pro 功能。',driveNeedsPro:'Google 云端硬盘备份是 Pro 功能。你的记录仍保存在此设备上。',stAcct:'Pro 已在你的 Kept 账户中启用，适用于你的所有设备。',signInPro:'在 Kept 应用中购买了 Pro？用同一账户登录即可在这里使用。',signIn:'登录',linked:'Pro 已关联到你的账户，可在所有设备上使用。',other:'此购买已关联到另一个 Kept 账户。',signInFirst:'请先登录，这样 Pro 就能在你的所有设备上使用。'},
vi:{soonT:'Kept Pro sắp ra mắt',soonP:'Báo cáo thuế, So sánh và Xu hướng, và sao lưu Google Drive thuộc Kept Pro, sắp ra mắt. Khi ra mắt, mỗi tài xế được dùng thử miễn phí 7 ngày trước. Ghi ngày, tổng kết, so sánh Lyft và Uber, tệp sao lưu và xuất sang Excel vẫn miễn phí.',soonToast:'Kept Pro sắp ra mắt, dùng thử miễn phí 7 ngày.',pro:'Pro',goPro:'Nâng cấp Pro',proOn:'Pro ✓',trialLeft:'Dùng thử · còn {n} ngày',trialLast:'Dùng thử · ngày cuối',
  title:'Kept Pro',done:'Xong',
  stTrial:'Bản dùng thử còn {n} ngày. Sau đó, các tính năng này cần Pro:',stTrialLast:'Bản dùng thử kết thúc hôm nay. Sau đó, các tính năng này cần Pro:',
  stEnded:'Bản dùng thử đã kết thúc. Nâng cấp Pro để dùng:',stPro:'Bạn đã có Pro. Cảm ơn bạn đã ủng hộ Kept!',stLife:'Bạn có Pro trọn đời. Cảm ơn bạn đã ủng hộ Kept!',
  f1:'Thuế: ước tính theo năm và quý, xuất và in báo cáo thuế',f2:'Google Drive: tự sao lưu mỗi lần bạn lưu, kèm Google Trang tính của bạn',f3:'So sánh và Xu hướng: so sánh Lyft và Uber theo từng tháng và xu hướng thu nhập',
  free:'Ghi ngày, tổng cộng, so sánh Lyft và Uber ở Trang chủ, tệp sao lưu và xuất sang Excel luôn miễn phí.',
  monthly:'Hàng tháng',yearly:'Hàng năm',lifetime:'Trọn đời',perMo:'/tháng',perYr:'/năm',once:'trả một lần',best:'Tiết kiệm nhất',
  restore:'Khôi phục giao dịch',manage:'Quản lý gói đăng ký',
  renew:'Gói đăng ký tự gia hạn cho đến khi bạn hủy trong tài khoản cửa hàng.',
  webOnly:'Pro có trong ứng dụng Kept trên Google Play và Microsoft Store.',
  getPlay:'Tải trên Google Play',getMs:'Tải từ Microsoft',
  working:'Đang mở cửa hàng…',thanks:'Đã mở khóa Pro. Cảm ơn bạn!',cancelled:'Đã hủy giao dịch.',failed:'Giao dịch chưa thành công. Hãy thử lại.',
  restored:'Đã khôi phục Pro.',none:'Không tìm thấy giao dịch Pro cho tài khoản cửa hàng này.',
  needPro:'Đây là tính năng Pro.',driveNeedsPro:'Sao lưu Google Drive là tính năng Pro. Dữ liệu của bạn vẫn được lưu trên thiết bị này.',stAcct:'Pro đang hoạt động trên tài khoản Kept của bạn, trên mọi thiết bị.',signInPro:'Đã mua Pro trong ứng dụng Kept? Đăng nhập cùng tài khoản để dùng tại đây.',signIn:'Đăng nhập',linked:'Pro đã được liên kết với tài khoản của bạn và dùng được trên mọi thiết bị.',other:'Giao dịch này đã được liên kết với một tài khoản Kept khác.',signInFirst:'Hãy đăng nhập trước để Pro theo bạn trên mọi thiết bị.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);

/* ---------- Saved state ---------- */
const PK=(typeof KEY!=='undefined'?KEY:'kept')+'-pro';
let st={}; try{ st=JSON.parse(localStorage.getItem(PK)||'{}'); }catch(e){}
const saveSt=()=>{ try{ localStorage.setItem(PK,JSON.stringify(st)); }catch(e){} };
if(enabled&&!st.trialStart){ st.trialStart=Date.now(); saveSt(); }
if(preview==='expired') st.trialStart=Date.now()-(PRO.trialDays+1)*DAY;

// Signed-in account (from account.js): its Pro status and trial start, both set where drivers can't change them.
let acct={user:null,pro:null,trialStart:null};
const trialStart=()=>acct.user&&acct.trialStart?Math.min(acct.trialStart,st.trialStart||acct.trialStart):st.trialStart;
function daysLeft(){ return Math.max(0,PRO.trialDays-Math.floor((Date.now()-trialStart())/DAY)); }
function owned(){ return !!(st.ent&&Date.now()-st.ent.checked<GRACE); }
function acctPro(){ const p=acct.user&&acct.pro; return !!(p&&p.active&&(p.expires==null||p.expires>Date.now())); }
function trialOn(){ return daysLeft()>0; }
function isPro(){ if(preLock) return owned()||acctPro(); return !enabled||owned()||acctPro()||trialOn(); }
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
async function ackPlay(p){   // purchase without an account: acknowledge it so Google doesn't refund it (Pro on this device)
  if(store.name!=='play'||!PRO.workerUrl||(st.acked||[]).includes(p.purchaseToken)) return;
  const plan=planOf(p.itemId);
  const r=await fetch(PRO.workerUrl.replace(/\/$/,'')+'/play/ack',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sku:p.itemId,token:p.purchaseToken,type:plan==='lifetime'?'inapp':'sub'})});
  if(r.ok){ st.acked=[...(st.acked||[]),p.purchaseToken].slice(-20); saveSt(); }
}
// Link this store's purchases to the signed-in account (once per purchase), so Pro works everywhere they sign in.
async function claim(p){
  if(!acct.user||!PRO.workerUrl||!store||store.name!=='play') return 'skip';
  st.claimed=st.claimed||{}; const key=acct.user.uid+':'+p.purchaseToken;
  if(st.claimed[key]) return 'done';
  const tok=await window.keptAccount.idToken();
  const r=await fetch(PRO.workerUrl.replace(/\/$/,'')+'/pro/claim',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},
    body:JSON.stringify({store:store.name,sku:p.itemId,token:p.purchaseToken})});
  if(r.status===409) return 'other';
  if(!r.ok) return 'fail';
  st.claimed[key]=Date.now(); saveSt(); return 'linked';
}
async function claimAll(){
  if(!acct.user||!store) return;
  let list; try{ list=await store.svc.listPurchases(); }catch(e){ return; }
  for(const p of list.filter(x=>skuList.includes(x.itemId))){
    try{ const r=await claim(p); if(r==='linked') say(w('linked')); else if(r==='other') say(w('other')); }catch(e){}
  }
}
async function refresh(){
  if(!store) return false;
  let list;
  try{ list=await store.svc.listPurchases(); }catch(e){ return owned(); }   // offline: keep what we knew (7-day grace)
  const mine=list.filter(p=>skuList.includes(p.itemId));
  for(const p of mine){ try{ if(acct.user&&PRO.workerUrl) await claim(p); else await ackPlay(p); }catch(e){} }
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
    let linkMsg='';
    if(token) try{
      if(acct.user&&PRO.workerUrl){ const c=await claim({itemId:sku,purchaseToken:token}); if(c==='linked') linkMsg=w('linked'); else if(c==='other') linkMsg=w('other'); }
      else await ackPlay({itemId:sku,purchaseToken:token});
    }catch(e){}
    const ok=await refresh()||!!token;
    if(ok&&!st.ent){ st.ent={sku,checked:Date.now()}; saveSt(); }
    update(); say(ok?(linkMsg||w('thanks'))+(acct.user?'':' '+w('signInFirst')):w('failed'));
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
#insSeg button{flex:1 1 auto;padding-left:4px;padding-right:4px}
#insSeg button.pro-lock{font-size:.86rem}
#insSeg .pro-lock::after{content:'';display:inline-block;width:.62em;height:.62em;margin-left:3px;padding:0;color:inherit;background:currentColor;opacity:.7;border-radius:1px;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 10V7a6 6 0 0 1 12 0v3h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h8V7a4 4 0 0 0-8 0z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 10V7a6 6 0 0 1 12 0v3h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h8V7a4 4 0 0 0-8 0z'/%3E%3C/svg%3E") center/contain no-repeat}
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
  const keepMsg=(document.getElementById('proMsg')||{}).textContent||'';
  const left=daysLeft(), life=(owned()&&st.ent.sku===PRO.skus.lifetime)||(acctPro()&&acct.pro.expires==null);
  const status= owned()?(life?w('stLife'):w('stPro')) : acctPro()?(life?w('stLife'):w('stAcct')) : trialOn()?(left===1?w('stTrialLast'):w('stTrial',{n:left})) : w('stEnded');
  let buyHtml='';
  const signInHtml=!acct.user&&window.keptAccount?`<p class="pro-free">${esc(w('signInPro'))}</p><div class="pro-links"><button type="button" id="proSignIn">${esc(w('signIn'))}</button></div>`:'';
  if(acctPro()&&!owned()){
    buyHtml='';
  }else if(!owned()){
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
      buyHtml=`<p class="pro-free">${esc(w('webOnly'))}</p>${links?`<div class="pro-links">${links}</div>`:''}`+signInHtml;
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
  say(keepMsg);
  sec.querySelector('#proDone').onclick=()=>{ show(false); btn.focus(); };
  sec.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>buy(b.dataset.plan));
  const r=sec.querySelector('#proRestore');
  if(r) r.onclick=async()=>{ say(w('working')); const ok=await refresh(); update(); say(ok?w('restored'):w('none')); };
  const si=sec.querySelector('#proSignIn');
  if(si) si.onclick=()=>{ const row=document.getElementById('acctRow'); if(row) row.click(); };
}
function show(open,msg){
  if(open){ draw(); if(msg) say(msg); }
  btn.setAttribute('aria-expanded',String(open));
  if(window.keptGo){ if(open) window.keptGo('pro'); else window.keptBack(); return; }
  sec.hidden=!open; if(open) sec.scrollIntoView({behavior:'smooth',block:'start'});
}
// Before launch: a short "coming soon" note in More, so drivers know Pro and its 7-day trial are on the way.
if(!enabled&&bar&&bar.parentNode&&!document.getElementById('proSoon')){
  const soon=document.createElement('div'); soon.className='card'; soon.id='proSoon';
  soon.style.cssText='display:flex;flex-direction:column;gap:6px;text-align:left';
  soon.innerHTML=`<p style="margin:0;font-weight:700;font-size:1.05rem">${esc(w('soonT'))} <span class="pro-lock" style="font-size:0"></span></p><p class="pro-free" style="font-size:.92rem;margin:0">${esc(w('soonP'))}</p>`;
  bar.parentNode.insertBefore(soon,bar);
}
function lockGated(locked){
  GATED.forEach(id=>{ const b=document.getElementById(id); if(b) b.classList.toggle('pro-lock',locked); });
  if(locked&&typeof insTab!=='undefined'&&insTab!=='overview'&&typeof setIns==='function') setIns('overview');
}
function update(){
  if(!enabled){ btn.hidden=true; lockGated(preLock&&!isPro()); const s=document.getElementById('proSoon'); if(s) s.hidden=!preLock||isPro(); return; }
  btn.hidden=false;
  const left=daysLeft();
  btn.classList.toggle('on',owned()||acctPro());
  btn.textContent= (owned()||acctPro())?w('proOn') : trialOn()?(left===1?w('trialLast'):w('trialLeft',{n:left})) : w('goPro');
  const locked=!isPro();
  GATED.forEach(id=>{ const b=document.getElementById(id); if(b) b.classList.toggle('pro-lock',locked); });
  if(locked&&typeof insTab!=='undefined'&&insTab!=='overview'&&typeof setIns==='function') setIns('overview');
  draw();   // keep the Pro screen current even while it's closed
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
  if(preLock){   // before launch there's nothing to buy yet: point to the "coming soon" note
    if(typeof toast==='function') toast(w('soonToast'));
    if(window.keptGo) window.keptGo('more');
    const n=document.getElementById('proSoon'); if(n) setTimeout(()=>n.scrollIntoView({behavior:'smooth',block:'center'}),60);
    return;
  }
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
if(preLock){   // gifted Pro (set on the account) still unlocks before launch
  window.addEventListener('kept-account',e=>{ acct=e.detail||acct; update(); });
  if(window.keptAccount&&window.keptAccount.state){ acct=window.keptAccount.state()||acct; update(); }
}
if(enabled){
  // Show the upgrade screen once when the trial runs out.
  if(!isPro()&&!st.endShown){ st.endShown=true; saveSt(); setTimeout(()=>show(true),400); }
  connect().then(s=>{ if(s) return refresh(); }).then(()=>update()).catch(()=>{});
  // Account changes (sign in/out, Pro status from the server, trial start): re-check, and link store purchases after sign-in.
  const onAcct=d=>{ const was=acct.user&&acct.user.uid; acct=d||acct; update(); if(acct.user&&acct.user.uid!==was) claimAll().then(update); };
  window.addEventListener('kept-account',e=>onAcct(e.detail));
  if(window.keptAccount&&window.keptAccount.state) onAcct(window.keptAccount.state());
  // Re-check when the app comes back to the front (renewals, cancellations, the day ticking over).
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'){ refresh().catch(()=>{}).then(update); } });
}
})();
