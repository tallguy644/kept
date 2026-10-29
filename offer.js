/* Kept Offer Check: the upgrade screen in Kept.
   Offer Check = everything in Pro, plus the free "Kept Offer Check" companion app, which shows a popup over Uber and Lyft
   ride offers saying whether the ride is worth it after the driver's car costs. Bought here (Google Play), recorded on the
   driver's Kept account by the Pro server; the companion app is linked to the account with a one-time code.
   Android app only, and switched off until launch (PRO.offer.enabled in pro.js). Preview on the web with ?pro=offer or ?pro=offeron.
   See OFFERCHECK.md. */
(function(){
'use strict';
const O=window.keptOffer;
const pv=new URLSearchParams(location.search).get('pro');
if(!O||!O.on()||!(window.keptNative||pv==='offer'||pv==='offeron')) return;

/* ---------- Words ---------- */
const T={
en:{row:'Offer Check',rowSub:'See if ride offers are worth it',rowOn:'On · cost {v}/mi',title:'Offer Check',
  lead:'A popup over Uber and Lyft ride offers that shows if the ride is worth it after your car costs, before you accept.',
  f1:'Reads the fare, pickup and trip miles on each Uber and Lyft offer',f2:'Green, amber or red: worth it, below your goal, or losing money',f3:'Uses your real cost per mile from Kept: gas, repairs and the wear on your car',f4:'Includes everything in Kept Pro',
  how:'Works with the free Kept Offer Check app on the same phone.',
  risk:'Uber and Lyft aren\'t part of Kept. Apps that read ride offers may be against their terms. You use Offer Check at your own risk.',
  playOnly:'Offer Check is available in the Kept app on Google Play.',switchNote:'If you already have Pro, cancel it in your store account after upgrading so you aren\'t charged twice.',
  renew:'Subscriptions renew automatically until you cancel in your Google Play account.',
  monthly:'Monthly',yearly:'Yearly',perMo:'/month',perYr:'/year',best:'Best value',
  signIn:'Sign in to your Kept account first. Offer Check is tied to your account, so it works with the companion app.',signInBtn:'Sign in',
  active:'Offer Check is on. Thanks for supporting Kept!',
  numbers:'Your numbers',cpm:'Cost per mile',cpmAuto:'From your car, gas and repairs over the last 90 days.',cpmLogs:'From your gas and repairs over the last 90 days. Add your car to include its wear.',cpmNone:'Log gas, repairs and miles, or add your car, so Kept knows your cost per mile.',addCar:'Add my car',
  own:'Use my own cost per mile',goal:'Profit goal per mile',goalHelp:'Offers at or above this show green. Below it, but still making money, show amber.',
  save:'Save',saved:'Saved. Your phone gets the new numbers the next time Offer Check opens.',
  setup:'Set up on this phone',setupHelp:'Opens the Kept Offer Check app and links it to your account. If it isn\'t installed yet, Google Play opens so you can get it.',
  code:'Or type this code in Kept Offer Check (works for 10 minutes):',storeOpened:'Install Kept Offer Check from Google Play, then come back and tap Set up on this phone.',
  unlinkAll:'Unlink all phones',unlinked:'All phones are unlinked from Offer Check.',manage:'Manage subscription',
  err:'Couldn\'t reach Kept. Check your connection and try again.',
  sample:'Sample: $14.20 for 11.3 miles, with your numbers',good:'Worth it',ok:'Below your goal',bad:'Losing money',after:'After car costs {v}/mi',hr:'{v}/hr',forMi:'{f} for {m} mi · {p}/mi'},
es:{row:'Offer Check',rowSub:'Mira si las ofertas de viaje valen la pena',rowOn:'Activo · costo {v}/mi',title:'Offer Check',
  lead:'Un aviso sobre las ofertas de Uber y Lyft que te dice si el viaje vale la pena después de los costos de tu auto, antes de aceptar.',
  f1:'Lee la tarifa y las millas de recogida y del viaje en cada oferta de Uber y Lyft',f2:'Verde, ámbar o rojo: vale la pena, bajo tu meta o pierdes dinero',f3:'Usa tu costo real por milla de Kept: gasolina, reparaciones y el desgaste del auto',f4:'Incluye todo lo de Kept Pro',
  how:'Funciona con la app gratis Kept Offer Check en el mismo teléfono.',
  risk:'Uber y Lyft no son parte de Kept. Las apps que leen ofertas de viaje pueden ir en contra de sus términos. Usas Offer Check bajo tu propio riesgo.',
  playOnly:'Offer Check está disponible en la app Kept de Google Play.',switchNote:'Si ya tienes Pro, cancélalo en tu cuenta de la tienda después de mejorar para que no te cobren dos veces.',
  renew:'Las suscripciones se renuevan automáticamente hasta que las canceles en tu cuenta de Google Play.',
  monthly:'Mensual',yearly:'Anual',perMo:'/mes',perYr:'/año',best:'Mejor precio',
  signIn:'Primero inicia sesión en tu cuenta de Kept. Offer Check va unido a tu cuenta para funcionar con la app complementaria.',signInBtn:'Iniciar sesión',
  active:'Offer Check está activo. ¡Gracias por apoyar Kept!',
  numbers:'Tus números',cpm:'Costo por milla',cpmAuto:'Según tu auto, gasolina y reparaciones de los últimos 90 días.',cpmLogs:'Según tu gasolina y reparaciones de los últimos 90 días. Agrega tu auto para incluir su desgaste.',cpmNone:'Registra gasolina, reparaciones y millas, o agrega tu auto, para que Kept sepa tu costo por milla.',addCar:'Agregar mi auto',
  own:'Usar mi propio costo por milla',goal:'Meta de ganancia por milla',goalHelp:'Las ofertas iguales o mayores salen en verde. Por debajo, pero con ganancia, salen en ámbar.',
  save:'Guardar',saved:'Guardado. Tu teléfono recibe los nuevos números la próxima vez que abras Offer Check.',
  setup:'Configurar en este teléfono',setupHelp:'Abre la app Kept Offer Check y la vincula a tu cuenta. Si aún no está instalada, se abre Google Play para que la obtengas.',
  code:'O escribe este código en Kept Offer Check (sirve por 10 minutos):',storeOpened:'Instala Kept Offer Check desde Google Play, luego vuelve y toca Configurar en este teléfono.',
  unlinkAll:'Desvincular todos los teléfonos',unlinked:'Todos los teléfonos se desvincularon de Offer Check.',manage:'Administrar suscripción',
  err:'No se pudo conectar con Kept. Revisa tu conexión e inténtalo de nuevo.',
  sample:'Ejemplo: $14.20 por 11.3 millas, con tus números',good:'Vale la pena',ok:'Bajo tu meta',bad:'Pierdes dinero',after:'Tras costos del auto {v}/mi',hr:'{v}/h',forMi:'{f} por {m} mi · {p}/mi'},
pt:{row:'Offer Check',rowSub:'Veja se as ofertas de corrida valem a pena',rowOn:'Ativo · custo {v}/mi',title:'Offer Check',
  lead:'Um aviso sobre as ofertas da Uber e da Lyft que mostra se a corrida vale a pena depois dos custos do carro, antes de aceitar.',
  f1:'Lê o valor e as milhas até o embarque e da corrida em cada oferta da Uber e da Lyft',f2:'Verde, âmbar ou vermelho: vale a pena, abaixo da meta ou dá prejuízo',f3:'Usa seu custo real por milha do Kept: gasolina, reparos e o desgaste do carro',f4:'Inclui tudo do Kept Pro',
  how:'Funciona com o app grátis Kept Offer Check no mesmo telefone.',
  risk:'A Uber e a Lyft não fazem parte do Kept. Apps que leem ofertas de corrida podem violar os termos delas. Você usa o Offer Check por sua conta e risco.',
  playOnly:'O Offer Check está disponível no app Kept no Google Play.',switchNote:'Se você já tem o Pro, cancele-o na sua conta da loja depois de fazer o upgrade para não ser cobrado duas vezes.',
  renew:'As assinaturas renovam automaticamente até você cancelar na sua conta do Google Play.',
  monthly:'Mensal',yearly:'Anual',perMo:'/mês',perYr:'/ano',best:'Melhor preço',
  signIn:'Entre primeiro na sua conta Kept. O Offer Check fica ligado à sua conta para funcionar com o app complementar.',signInBtn:'Entrar',
  active:'O Offer Check está ativo. Obrigado por apoiar o Kept!',
  numbers:'Seus números',cpm:'Custo por milha',cpmAuto:'Com base no seu carro, gasolina e reparos dos últimos 90 dias.',cpmLogs:'Com base na gasolina e nos reparos dos últimos 90 dias. Adicione seu carro para incluir o desgaste.',cpmNone:'Registre gasolina, reparos e milhas, ou adicione seu carro, para o Kept saber seu custo por milha.',addCar:'Adicionar meu carro',
  own:'Usar meu próprio custo por milha',goal:'Meta de lucro por milha',goalHelp:'Ofertas iguais ou acima disso aparecem em verde. Abaixo, mas com lucro, aparecem em âmbar.',
  save:'Salvar',saved:'Salvo. Seu telefone recebe os novos números na próxima vez que o Offer Check abrir.',
  setup:'Configurar neste telefone',setupHelp:'Abre o app Kept Offer Check e o vincula à sua conta. Se ainda não estiver instalado, o Google Play abre para você baixar.',
  code:'Ou digite este código no Kept Offer Check (vale por 10 minutos):',storeOpened:'Instale o Kept Offer Check pelo Google Play, depois volte e toque em Configurar neste telefone.',
  unlinkAll:'Desvincular todos os telefones',unlinked:'Todos os telefones foram desvinculados do Offer Check.',manage:'Gerenciar assinatura',
  err:'Não foi possível conectar ao Kept. Verifique sua conexão e tente de novo.',
  sample:'Exemplo: $14.20 por 11.3 milhas, com seus números',good:'Vale a pena',ok:'Abaixo da meta',bad:'Dá prejuízo',after:'Após custos do carro {v}/mi',hr:'{v}/h',forMi:'{f} por {m} mi · {p}/mi'},
fr:{row:'Offer Check',rowSub:'Voyez si les offres de course valent le coup',rowOn:'Actif · coût {v}/mi',title:'Offer Check',
  lead:'Une fenêtre sur les offres Uber et Lyft qui indique si la course vaut le coup après les coûts de votre voiture, avant d\'accepter.',
  f1:'Lit le prix et les miles de prise en charge et de course de chaque offre Uber et Lyft',f2:'Vert, ambre ou rouge : vaut le coup, sous votre objectif ou à perte',f3:'Utilise votre vrai coût par mile dans Kept : carburant, réparations et usure de la voiture',f4:'Inclut tout Kept Pro',
  how:'Fonctionne avec l\'appli gratuite Kept Offer Check sur le même téléphone.',
  risk:'Uber et Lyft ne font pas partie de Kept. Les applis qui lisent les offres de course peuvent enfreindre leurs conditions. Vous utilisez Offer Check à vos propres risques.',
  playOnly:'Offer Check est disponible dans l\'appli Kept sur Google Play.',switchNote:'Si vous avez déjà Pro, annulez-le dans votre compte de la boutique après la mise à niveau pour ne pas payer deux fois.',
  renew:'Les abonnements se renouvellent automatiquement jusqu\'à résiliation dans votre compte Google Play.',
  monthly:'Mensuel',yearly:'Annuel',perMo:'/mois',perYr:'/an',best:'Meilleur prix',
  signIn:'Connectez-vous d\'abord à votre compte Kept. Offer Check est lié à votre compte pour fonctionner avec l\'appli compagnon.',signInBtn:'Se connecter',
  active:'Offer Check est actif. Merci de soutenir Kept !',
  numbers:'Vos chiffres',cpm:'Coût par mile',cpmAuto:'D\'après votre voiture, votre carburant et vos réparations des 90 derniers jours.',cpmLogs:'D\'après votre carburant et vos réparations des 90 derniers jours. Ajoutez votre voiture pour inclure son usure.',cpmNone:'Notez carburant, réparations et miles, ou ajoutez votre voiture, pour que Kept connaisse votre coût par mile.',addCar:'Ajouter ma voiture',
  own:'Utiliser mon propre coût par mile',goal:'Objectif de bénéfice par mile',goalHelp:'Les offres égales ou supérieures s\'affichent en vert. En dessous, mais rentables, en ambre.',
  save:'Enregistrer',saved:'Enregistré. Votre téléphone reçoit les nouveaux chiffres à la prochaine ouverture d\'Offer Check.',
  setup:'Configurer sur ce téléphone',setupHelp:'Ouvre l\'appli Kept Offer Check et la lie à votre compte. Si elle n\'est pas encore installée, Google Play s\'ouvre pour l\'obtenir.',
  code:'Ou saisissez ce code dans Kept Offer Check (valable 10 minutes) :',storeOpened:'Installez Kept Offer Check depuis Google Play, puis revenez et touchez Configurer sur ce téléphone.',
  unlinkAll:'Délier tous les téléphones',unlinked:'Tous les téléphones sont déliés d\'Offer Check.',manage:'Gérer l\'abonnement',
  err:'Impossible de joindre Kept. Vérifiez votre connexion et réessayez.',
  sample:'Exemple : 14,20 $ pour 11,3 miles, avec vos chiffres',good:'Vaut le coup',ok:'Sous votre objectif',bad:'À perte',after:'Après coûts voiture {v}/mi',hr:'{v}/h',forMi:'{f} pour {m} mi · {p}/mi'},
ru:{row:'Offer Check',rowSub:'Узнайте, выгодны ли заказы',rowOn:'Включено · расход {v}/ми',title:'Offer Check',
  lead:'Окно поверх заказов Uber и Lyft, которое показывает, выгодна ли поездка с учётом расходов на машину, до того как вы её примете.',
  f1:'Читает цену и мили до пассажира и поездки в каждом заказе Uber и Lyft',f2:'Зелёный, жёлтый или красный: выгодно, ниже цели или в убыток',f3:'Использует вашу реальную стоимость мили из Kept: бензин, ремонт и износ машины',f4:'Включает всё из Kept Pro',
  how:'Работает с бесплатным приложением Kept Offer Check на том же телефоне.',
  risk:'Uber и Lyft не связаны с Kept. Приложения, которые читают заказы, могут нарушать их условия. Вы используете Offer Check на свой риск.',
  playOnly:'Offer Check доступен в приложении Kept в Google Play.',switchNote:'Если у вас уже есть Pro, отмените его в аккаунте магазина после перехода, чтобы не платить дважды.',
  renew:'Подписка продлевается автоматически, пока вы не отмените её в аккаунте Google Play.',
  monthly:'На месяц',yearly:'На год',perMo:'/мес.',perYr:'/год',best:'Выгоднее всего',
  signIn:'Сначала войдите в аккаунт Kept. Offer Check привязан к аккаунту, чтобы работать с приложением-компаньоном.',signInBtn:'Войти',
  active:'Offer Check включён. Спасибо за поддержку Kept!',
  numbers:'Ваши цифры',cpm:'Стоимость мили',cpmAuto:'По машине, бензину и ремонту за последние 90 дней.',cpmLogs:'По бензину и ремонту за последние 90 дней. Добавьте машину, чтобы учесть износ.',cpmNone:'Записывайте бензин, ремонт и мили или добавьте машину, чтобы Kept знал стоимость мили.',addCar:'Добавить машину',
  own:'Указать свою стоимость мили',goal:'Цель по прибыли на милю',goalHelp:'Заказы на этом уровне и выше — зелёные. Ниже, но с прибылью — жёлтые.',
  save:'Сохранить',saved:'Сохранено. Телефон получит новые цифры, когда вы в следующий раз откроете Offer Check.',
  setup:'Настроить на этом телефоне',setupHelp:'Открывает приложение Kept Offer Check и привязывает его к аккаунту. Если оно ещё не установлено, откроется Google Play.',
  code:'Или введите этот код в Kept Offer Check (действует 10 минут):',storeOpened:'Установите Kept Offer Check из Google Play, затем вернитесь и нажмите «Настроить на этом телефоне».',
  unlinkAll:'Отвязать все телефоны',unlinked:'Все телефоны отвязаны от Offer Check.',manage:'Управлять подпиской',
  err:'Не удалось связаться с Kept. Проверьте подключение и попробуйте ещё раз.',
  sample:'Пример: $14.20 за 11,3 мили, по вашим цифрам',good:'Выгодно',ok:'Ниже вашей цели',bad:'В убыток',after:'После расходов на машину {v}/ми',hr:'{v}/ч',forMi:'{f} за {m} ми · {p}/ми'},
zh:{row:'Offer Check',rowSub:'看看派单值不值得接',rowOn:'已开启 · 成本每英里 {v}',title:'Offer Check',
  lead:'在 Uber 和 Lyft 派单上方弹出提示，告诉你扣除用车成本后这单值不值得，让你接单前就知道。',
  f1:'读取每个 Uber 和 Lyft 派单的车费、接客里程和行程里程',f2:'绿色、琥珀色或红色：值得接、低于目标或亏钱',f3:'使用你在 Kept 中的真实每英里成本：油费、维修和车辆损耗',f4:'包含 Kept Pro 的全部功能',
  how:'需配合同一部手机上的免费应用 Kept Offer Check 使用。',
  risk:'Uber 和 Lyft 与 Kept 无关。读取派单的应用可能违反它们的条款。使用 Offer Check 的风险由你自行承担。',
  playOnly:'Offer Check 可在 Google Play 上的 Kept 应用中购买。',switchNote:'如果你已经有 Pro，升级后请在商店账户中取消 Pro，以免重复扣费。',
  renew:'订阅会自动续订，直到你在 Google Play 账户中取消。',
  monthly:'按月',yearly:'按年',perMo:'/月',perYr:'/年',best:'最划算',
  signIn:'请先登录你的 Kept 账户。Offer Check 绑定在账户上，才能和配套应用一起使用。',signInBtn:'登录',
  active:'Offer Check 已开启。感谢支持 Kept！',
  numbers:'你的数据',cpm:'每英里成本',cpmAuto:'根据你最近 90 天的车辆、油费和维修费计算。',cpmLogs:'根据你最近 90 天的油费和维修费计算。添加车辆可计入折旧。',cpmNone:'记录油费、维修费和里程，或添加车辆，Kept 才能算出你的每英里成本。',addCar:'添加我的车',
  own:'使用我自己的每英里成本',goal:'每英里利润目标',goalHelp:'达到或超过此目标的派单显示绿色；低于目标但仍赚钱的显示琥珀色。',
  save:'保存',saved:'已保存。下次打开 Offer Check 时，手机会获取新数据。',
  setup:'在此手机上设置',setupHelp:'打开 Kept Offer Check 应用并关联到你的账户。如果还没安装，会打开 Google Play 供你下载。',
  code:'或在 Kept Offer Check 中输入此代码（10 分钟内有效）：',storeOpened:'请先从 Google Play 安装 Kept Offer Check，然后回来点按“在此手机上设置”。',
  unlinkAll:'取消关联所有手机',unlinked:'所有手机均已取消关联 Offer Check。',manage:'管理订阅',
  err:'无法连接 Kept。请检查网络后重试。',
  sample:'示例：11.3 英里 $14.20，按你的数据计算',good:'值得接',ok:'低于你的目标',bad:'亏钱',after:'扣除用车成本后每英里 {v}',hr:'每小时 {v}',forMi:'{f} · {m} 英里 · 每英里 {p}'},
vi:{row:'Offer Check',rowSub:'Xem cuốc xe có đáng nhận không',rowOn:'Đang bật · chi phí {v}/dặm',title:'Offer Check',
  lead:'Một thông báo hiện trên cuốc xe Uber và Lyft, cho biết cuốc đó có đáng không sau chi phí xe, trước khi bạn nhận.',
  f1:'Đọc giá cuốc, số dặm đến điểm đón và số dặm chuyến đi của mỗi cuốc Uber và Lyft',f2:'Xanh, vàng hoặc đỏ: đáng nhận, dưới mục tiêu hoặc lỗ tiền',f3:'Dùng chi phí thật mỗi dặm của bạn trong Kept: xăng, sửa chữa và hao mòn xe',f4:'Bao gồm mọi tính năng của Kept Pro',
  how:'Dùng cùng ứng dụng miễn phí Kept Offer Check trên cùng điện thoại.',
  risk:'Uber và Lyft không thuộc Kept. Ứng dụng đọc cuốc xe có thể vi phạm điều khoản của họ. Bạn tự chịu rủi ro khi dùng Offer Check.',
  playOnly:'Offer Check có trong ứng dụng Kept trên Google Play.',switchNote:'Nếu bạn đã có Pro, hãy hủy Pro trong tài khoản cửa hàng sau khi nâng cấp để không bị tính phí hai lần.',
  renew:'Gói đăng ký tự gia hạn cho đến khi bạn hủy trong tài khoản Google Play.',
  monthly:'Hàng tháng',yearly:'Hàng năm',perMo:'/tháng',perYr:'/năm',best:'Tiết kiệm nhất',
  signIn:'Hãy đăng nhập tài khoản Kept trước. Offer Check gắn với tài khoản để dùng được với ứng dụng đi kèm.',signInBtn:'Đăng nhập',
  active:'Offer Check đang bật. Cảm ơn bạn đã ủng hộ Kept!',
  numbers:'Số liệu của bạn',cpm:'Chi phí mỗi dặm',cpmAuto:'Tính từ xe, xăng và sửa chữa trong 90 ngày qua.',cpmLogs:'Tính từ xăng và sửa chữa trong 90 ngày qua. Thêm xe để tính cả hao mòn.',cpmNone:'Hãy ghi xăng, sửa chữa và số dặm, hoặc thêm xe, để Kept biết chi phí mỗi dặm của bạn.',addCar:'Thêm xe của tôi',
  own:'Dùng chi phí mỗi dặm của riêng tôi',goal:'Mục tiêu lợi nhuận mỗi dặm',goalHelp:'Cuốc đạt hoặc vượt mức này hiện màu xanh. Dưới mức này nhưng vẫn có lời hiện màu vàng.',
  save:'Lưu',saved:'Đã lưu. Điện thoại sẽ nhận số liệu mới khi bạn mở Offer Check lần tới.',
  setup:'Thiết lập trên điện thoại này',setupHelp:'Mở ứng dụng Kept Offer Check và liên kết với tài khoản của bạn. Nếu chưa cài, Google Play sẽ mở để bạn tải.',
  code:'Hoặc nhập mã này trong Kept Offer Check (hiệu lực 10 phút):',storeOpened:'Hãy cài Kept Offer Check từ Google Play, rồi quay lại và nhấn Thiết lập trên điện thoại này.',
  unlinkAll:'Hủy liên kết mọi điện thoại',unlinked:'Đã hủy liên kết mọi điện thoại khỏi Offer Check.',manage:'Quản lý gói đăng ký',
  err:'Không kết nối được với Kept. Hãy kiểm tra mạng và thử lại.',
  sample:'Ví dụ: $14.20 cho 11.3 dặm, theo số liệu của bạn',good:'Đáng nhận',ok:'Dưới mục tiêu',bad:'Lỗ tiền',after:'Sau chi phí xe {v}/dặm',hr:'{v}/giờ',forMi:'{f} cho {m} dặm · {p}/dặm'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const usd=v=>'$'+Math.abs(v).toFixed(2), sign=v=>(v<0?'−':'+')+usd(v);
const DEF_GOAL=0.5;

/* ---------- Settings (saved with Kept's other settings, so they're in backups) ---------- */
const S=()=>{ if(typeof prefs==='undefined') return {goal:DEF_GOAL,own:null}; prefs.offer=prefs.offer||{goal:DEF_GOAL,own:null}; return prefs.offer; };
function auto(){ return typeof window.keptCarCostPerMile==='function'?window.keptCarCostPerMile():{total:0,car:false,miles:0}; }
function settings(){ const s=S(), a=auto(); const own=s.own!=null&&isFinite(s.own); return {cpm:Math.round((own?s.own:a.total)*1000)/1000,target:Number(s.goal)||0,car:!own&&a.car}; }

/* ---------- Server ---------- */
async function call(path,body){
  if(!O.workerUrl) throw new Error('no server');
  const tok=await window.keptAccount.idToken();
  const r=await fetch(O.workerUrl.replace(/\/$/,'')+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){ const e=new Error(j.error||'failed'); e.status=r.status; throw e; }
  return j;
}
let syncT;
window.keptOfferSync=function(){   // car.js calls this when the car changes; the companion app reads the numbers from the server
  clearTimeout(syncT);
  syncT=setTimeout(()=>{ if(O.active()&&O.signedIn()&&O.workerUrl) call('/offer/settings',{settings:settings()}).catch(()=>{}); },1200);
};

/* ---------- Styles ---------- */
const css=document.createElement('style');
css.textContent=`
#offerSec .lead{margin:0;font-size:1rem;line-height:1.45}
#offerSec ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
#offerSec .note{margin:0;font-size:.85rem;color:var(--muted)}
#offerSec .risk{margin:0;font-size:.85rem;color:var(--muted);border-left:3px solid var(--warn);padding-left:10px}
#offerSec .oc{display:flex;flex-direction:column;gap:12px}
#offerSec .pop{border-radius:18px;padding:12px 16px;color:#fff;display:flex;flex-direction:column;gap:2px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
#offerSec .pop .t{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-weight:700;font-size:1.05rem}
#offerSec .pop .t b{font-size:1.35rem}
#offerSec .pop small{opacity:.92;font-size:.86rem}
#offerSec .pop .b{display:flex;justify-content:space-between;gap:10px;opacity:.9;font-size:.8rem}
#offerSec .num-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
#offerSec .num-row b{font-size:1.25rem;font-family:var(--display)}
#offerSec label.chk{display:flex;gap:10px;align-items:center;font-weight:600}
#offerSec .in-row{display:flex;align-items:center;gap:8px;border:1.5px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--surface)}
#offerSec .in-row input{border:0;background:transparent;color:var(--fg);font-size:1.1rem;width:100%;outline:none}
#offerSec .in-row:focus-within{border-color:var(--accent)}
#offerSec .code{font-family:var(--display);font-size:1.8rem;font-weight:800;letter-spacing:.12em;text-align:center;margin:4px 0}
#offerSec .acts{display:flex;gap:8px;flex-wrap:wrap}
#offerSec .acts button,#offerSec .acts a{border:1.5px solid var(--line);background:var(--surface);color:var(--fg);border-radius:12px;padding:10px 14px;font-weight:600;text-decoration:none}
#offerSec .acts .primary{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
#offerSec .msg{margin:0;font-size:.9rem;min-height:1.2em}
@media (min-width:960px){#offerSec{max-width:760px}}`;
document.head.appendChild(css);

/* ---------- Screen ---------- */
const sec=document.createElement('section'); sec.className='view'; sec.id='offerSec'; sec.hidden=true; sec.setAttribute('aria-labelledby','offerTitle');
const shell=$('shell'); if(shell) shell.appendChild(sec);
if(typeof VIEWS!=='undefined'){ VIEWS.offer='offerSec'; NAVOF.offer='more'; }
let from='more', code=null, msg='', nmsg='';
function open(){ from=(typeof cur!=='undefined'&&cur!=='offer')?cur:'more'; code=null; msg=''; nmsg=''; draw(); window.keptGo('offer'); if(O.active()) window.keptOfferSync(); }
function back(){ window.keptGo(from==='offer'?'more':from); }
window.keptOpenOffer=open; window.keptOfferBack=back;

function popHtml(){
  const s=settings(), miles=11.3, fare=14.2, mins=25, cpm=s.cpm||0.45;
  const profit=fare-miles*cpm, ppm=profit/miles, lvl=profit<0?'bad':ppm>=s.target?'good':'ok';
  const bg={good:'#1c6b47',ok:'#8a5a00',bad:'#a12c2c'}[lvl], mark={good:'✓',ok:'!',bad:'✕'}[lvl];
  return `<div class="pop" style="background:${bg}" role="img" aria-label="${esc(w(lvl))}"><div class="t"><span>${mark}&nbsp; ${esc(w(lvl))}</span><b>${sign(profit)}</b></div>
    <small>${esc(w('forMi',{f:usd(fare),m:miles.toFixed(1),p:usd(fare/miles)}))}</small>
    <div class="b"><span>${esc(w('after',{v:(ppm<0?'−':'')+usd(ppm)}))} · ${esc(w('hr',{v:(profit<0?'−':'')+'$'+Math.round(Math.abs(profit)/(mins/60))}))}</span><span style="font-weight:700">Kept</span></div></div>`;
}
const back_=`<div class="page-top"><button type="button" class="back" id="offerBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1 id="offerTitle">${esc(w('title'))}</h1><span></span></div>`;

function draw(){
  const active=O.active(), s=S(), a=auto(), st=settings();
  let h=back_+`<div class="card oc"><p class="lead">${esc(w('lead'))}</p>${popHtml()}<p class="note">${esc(w('sample'))}</p></div>`;
  if(!active){
    h+=`<div class="card oc"><ul><li>${esc(w('f1'))}</li><li>${esc(w('f2'))}</li><li>${esc(w('f3'))}</li><li>${esc(w('f4'))}</li></ul><p class="note">${esc(w('how'))}</p>`;
    if(!O.store()&&pv!=='offer') h+=`<p class="note">${esc(w('playOnly'))}</p>`;
    else if(!O.signedIn()&&pv!=='offer') h+=`<p class="note">${esc(w('signIn'))}</p><div class="acts"><button type="button" class="primary" id="offerSignIn">${esc(w('signInBtn'))}</button></div>`;
    else h+=`<div class="pro-plans two">
        <button type="button" data-oplan="offer_monthly"><span>${esc(w('monthly'))}</span><b>${esc(O.price('offer_monthly'))}</b><small>${esc(w('perMo'))}</small></button>
        <button type="button" class="primary" data-oplan="offer_yearly"><span class="tag">${esc(w('best'))}</span><span>${esc(w('yearly'))}</span><b>${esc(O.price('offer_yearly'))}</b><small>${esc(w('perYr'))}</small></button>
      </div><p class="note">${esc(w('switchNote'))} ${esc(w('renew'))}</p>`;
    h+=`<p class="risk">${esc(w('risk'))}</p><p class="msg" id="offerMsg" role="status">${esc(msg)}</p></div>`;
  }else{
    const cpmNote=s.own!=null?'':a.car?w('cpmAuto'):a.miles>0?w('cpmLogs'):w('cpmNone');
    h+=`<div class="card oc"><p style="margin:0;font-weight:600">✓ ${esc(w('active'))}</p>
        <div class="acts"><button type="button" class="primary" id="offerSetup">${esc(w('setup'))}</button></div>
        <p class="note">${esc(w('setupHelp'))}</p>
        ${code?`<p class="note">${esc(w('code'))}</p><p class="code num">${esc(code.slice(0,4)+'-'+code.slice(4))}</p>`:''}
        <p class="msg" id="offerMsg" role="status">${esc(msg)}</p></div>
      <div class="card oc"><h3 style="margin:0">${esc(w('numbers'))}</h3>
        <div class="num-row"><span>${esc(w('cpm'))}</span><b class="num">${usd(st.cpm)}</b></div>
        ${cpmNote?`<p class="note">${esc(cpmNote)}</p>`:''}
        ${!a.car&&s.own==null&&typeof window.keptOpenCar==='function'?`<div class="acts"><button type="button" id="offerCar">${esc(w('addCar'))}</button></div>`:''}
        <label class="chk"><input type="checkbox" id="offerOwnOn" ${s.own!=null?'checked':''}> ${esc(w('own'))}</label>
        <div class="in-row" id="offerOwnRow" ${s.own!=null?'':'hidden'}><span>$</span><input id="offerOwn" type="number" inputmode="decimal" step="0.01" min="0" max="5" value="${s.own!=null?s.own:(Math.round(a.total*100)/100||'')}" aria-label="${esc(w('cpm'))}"></div>
        <span style="font-weight:600">${esc(w('goal'))}</span>
        <div class="in-row"><span>$</span><input id="offerGoal" type="number" inputmode="decimal" step="0.05" min="-5" max="5" value="${Number(s.goal)}" aria-label="${esc(w('goal'))}"></div>
        <p class="note">${esc(w('goalHelp'))}</p>
        <div class="acts"><button type="button" class="primary" id="offerSave">${esc(w('save'))}</button></div><p class="msg" role="status">${esc(nmsg)}</p></div>
      <div class="card oc"><p class="risk">${esc(w('risk'))}</p>
        <div class="acts">${O.owned()?`<a href="${esc(O.manageUrl())}" target="_blank" rel="noopener">${esc(w('manage'))}</a>`:''}<button type="button" id="offerUnlink">${esc(w('unlinkAll'))}</button></div></div>`;
  }
  sec.innerHTML=h;
  $('offerBack').onclick=back;
  sec.querySelectorAll('[data-oplan]').forEach(b=>b.onclick=()=>O.buy(b.dataset.oplan,m=>{ msg=m; draw(); refresh(); }));
  const si=$('offerSignIn'); if(si) si.onclick=()=>{ const r=$('acctRow'); if(r) r.click(); };
  const car=$('offerCar'); if(car) car.onclick=()=>window.keptOpenCar();
  const ownOn=$('offerOwnOn'); if(ownOn) ownOn.onchange=()=>{ $('offerOwnRow').hidden=!ownOn.checked; };
  const save=$('offerSave'); if(save) save.onclick=async()=>{
    const s=S(), g=parseFloat($('offerGoal').value), own=parseFloat($('offerOwn').value);
    s.goal=isFinite(g)?Math.max(-5,Math.min(5,g)):DEF_GOAL;
    s.own=ownOn.checked&&isFinite(own)?Math.max(0,Math.min(5,own)):null;
    savePrefs();
    try{ await call('/offer/settings',{settings:settings()}); nmsg=w('saved'); }catch(e){ nmsg=w('err'); }
    draw();
  };
  const su=$('offerSetup'); if(su) su.onclick=async()=>{
    su.disabled=true;
    try{
      const r=await call('/offer/pair',{settings:settings()}); code=r.code; msg='';
      const how=window.keptNative&&window.keptNative.openOfferCheck?await window.keptNative.openOfferCheck(r.code):'none';
      if(how==='store') msg=w('storeOpened');
    }catch(e){ msg=w('err'); }
    draw();
  };
  const un=$('offerUnlink'); if(un) un.onclick=async()=>{ try{ await call('/offer/unlink-all'); msg=w('unlinked'); code=null; }catch(e){ msg=w('err'); } draw(); window.scrollTo({top:0,behavior:'smooth'}); };
}

/* ---------- Row in More ---------- */
const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M9 9.5l2 2 4-4"/><path d="M10 18h4"/></svg>';
const more=$('vMore'), list=more&&[...more.querySelectorAll('.list')].find(l=>l.querySelector('#exportBtn'));
if(list){
  const row=document.createElement('button'); row.type='button'; row.id='offerRow';
  row.innerHTML=`${ICON}<span style="display:flex;flex-direction:column;gap:2px;align-items:flex-start"><span>${esc(w('row'))}</span><small style="font-size:.84rem;color:var(--muted);font-weight:500" id="offerRowS"></small></span>`;
  row.onclick=open;
  const carRow=$('carRow'); list.insertBefore(row,carRow?carRow.nextSibling:($('custBtn')||null));
}
function refresh(){
  const s=$('offerRowS'); if(s) s.textContent=O.active()?w('rowOn',{v:usd(settings().cpm)}):w('rowSub');
  if(typeof cur!=='undefined'&&cur==='offer'&&!sec.contains(document.activeElement)) draw();   // don't wipe numbers being typed
}
window.addEventListener('kept-pro-change',refresh);
window.addEventListener('kept-account',()=>setTimeout(refresh,0));
refresh();
})();
