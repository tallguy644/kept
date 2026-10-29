/* Kept: "My car" and cost per mile.
   The driver enters their car once (what they paid, odometer then, expected resale and odometer at sale). Kept combines
   that depreciation with the gas and maintenance they already log to show what each mile really costs, next to what they
   earn per mile. Car details live in prefs.car, so they are saved with the other settings and included in backup files.
   Free, Android app only (Google Play). */
(function(){
'use strict';
// Android only (Google Play app). Hidden on the website and in the Microsoft Store app; preview on the web with ?car=preview.
if(!window.keptNative&&new URLSearchParams(location.search).get('car')!=='preview') return;

/* ---------- Words ---------- */
const T={
en:{row:'My car',rowSub:'For your real cost per mile',title:'My car',
  intro:'Enter your car once. Kept uses it with your gas and repairs to show what each mile really costs you, including the wear on your car.',
  name:'Car (optional)',namePh:'e.g. 2022 Toyota Camry',price:'What you paid',odoStart:'Odometer when you got it',resale:'What you expect to sell it for',odoEnd:'Odometer when you expect to sell it',
  tip:'Not sure what it will be worth? Look up a similar car with more miles on a car value website. Many drivers keep a car to 150,000–200,000 miles.',
  save:'Save',saved:'Car saved.',clear:'Remove car details',cleared:'Car details removed.',
  errPrice:'Enter what you paid and what you expect to sell it for.',errOdo:'The selling odometer has to be higher than the starting odometer.',errResale:'What you expect to sell it for should be less than what you paid.',
  depPreview:'Depreciation: {v} per mile',
  card:'Cost per mile',gas:'Gas',maint:'Maintenance & repairs',dep:'Depreciation (wear on your car)',total:'Total cost per mile',
  earn:'You earn per mile',profit:'Profit per mile',keptAfter:'Kept after car costs',
  irs:'IRS mileage rate: {r} per mile.',irsCovers:'It covers your real costs.',irsShort:'Your real costs are higher than the IRS rate.',
  noCar:'Add your car to see what each mile really costs you, including wear and tear.',addCar:'Add my car',edit:'Edit car',noMiles:'Log your miles to see your cost per mile for this month.',
  newT:'New: your real cost per mile',newP:'Add your car once and Kept shows what every mile costs you: gas, repairs and the wear on your car.',notNow:'Not now'},
es:{row:'Mi auto',rowSub:'Para tu costo real por milla',title:'Mi auto',
  intro:'Ingresa tu auto una sola vez. Kept lo usa con tu gasolina y reparaciones para mostrar lo que realmente te cuesta cada milla, incluido el desgaste del auto.',
  name:'Auto (opcional)',namePh:'p. ej. Toyota Camry 2022',price:'Lo que pagaste',odoStart:'Odómetro cuando lo compraste',resale:'En cuánto esperas venderlo',odoEnd:'Odómetro cuando esperas venderlo',
  tip:'¿No sabes cuánto valdrá? Busca un auto similar con más millas en un sitio de valor de autos. Muchos conductores usan su auto hasta 150,000–200,000 millas.',
  save:'Guardar',saved:'Auto guardado.',clear:'Borrar datos del auto',cleared:'Datos del auto borrados.',
  errPrice:'Ingresa lo que pagaste y en cuánto esperas venderlo.',errOdo:'El odómetro de venta debe ser mayor que el inicial.',errResale:'El precio de venta esperado debe ser menor que lo que pagaste.',
  depPreview:'Depreciación: {v} por milla',
  card:'Costo por milla',gas:'Gasolina',maint:'Mantenimiento y reparaciones',dep:'Depreciación (desgaste del auto)',total:'Costo total por milla',
  earn:'Ganas por milla',profit:'Ganancia por milla',keptAfter:'Te quedó después de costos del auto',
  irs:'Tarifa de millaje del IRS: {r} por milla.',irsCovers:'Cubre tus costos reales.',irsShort:'Tus costos reales son mayores que la tarifa del IRS.',
  noCar:'Agrega tu auto para ver lo que realmente te cuesta cada milla, incluido el desgaste.',addCar:'Agregar mi auto',edit:'Editar auto',noMiles:'Registra tus millas para ver tu costo por milla de este mes.',
  newT:'Nuevo: tu costo real por milla',newP:'Agrega tu auto una vez y Kept te muestra lo que cuesta cada milla: gasolina, reparaciones y el desgaste del auto.',notNow:'Ahora no'},
pt:{row:'Meu carro',rowSub:'Para seu custo real por milha',title:'Meu carro',
  intro:'Informe seu carro uma vez. O Kept usa isso com sua gasolina e reparos para mostrar quanto cada milha realmente custa, incluindo o desgaste do carro.',
  name:'Carro (opcional)',namePh:'ex.: Toyota Camry 2022',price:'Quanto você pagou',odoStart:'Hodômetro quando comprou',resale:'Por quanto espera vendê-lo',odoEnd:'Hodômetro quando espera vendê-lo',
  tip:'Não sabe quanto vai valer? Procure um carro parecido com mais milhas em um site de avaliação de carros. Muitos motoristas ficam com o carro até 150.000–200.000 milhas.',
  save:'Salvar',saved:'Carro salvo.',clear:'Remover dados do carro',cleared:'Dados do carro removidos.',
  errPrice:'Informe quanto pagou e por quanto espera vender.',errOdo:'O hodômetro de venda precisa ser maior que o inicial.',errResale:'O valor de venda esperado deve ser menor que o que você pagou.',
  depPreview:'Depreciação: {v} por milha',
  card:'Custo por milha',gas:'Gasolina',maint:'Manutenção e reparos',dep:'Depreciação (desgaste do carro)',total:'Custo total por milha',
  earn:'Você ganha por milha',profit:'Lucro por milha',keptAfter:'Ficou com você após custos do carro',
  irs:'Taxa de milhagem do IRS: {r} por milha.',irsCovers:'Ela cobre seus custos reais.',irsShort:'Seus custos reais são maiores que a taxa do IRS.',
  noCar:'Adicione seu carro para ver quanto cada milha realmente custa, incluindo o desgaste.',addCar:'Adicionar meu carro',edit:'Editar carro',noMiles:'Registre suas milhas para ver o custo por milha deste mês.',
  newT:'Novo: seu custo real por milha',newP:'Adicione seu carro uma vez e o Kept mostra quanto cada milha custa: gasolina, reparos e o desgaste do carro.',notNow:'Agora não'},
fr:{row:'Ma voiture',rowSub:'Pour votre vrai coût par mile',title:'Ma voiture',
  intro:'Saisissez votre voiture une seule fois. Kept l\'utilise avec votre carburant et vos réparations pour montrer ce que chaque mile vous coûte vraiment, usure comprise.',
  name:'Voiture (facultatif)',namePh:'ex. Toyota Camry 2022',price:'Prix payé',odoStart:'Compteur à l\'achat',resale:'Prix de revente prévu',odoEnd:'Compteur prévu à la revente',
  tip:'Vous ne savez pas combien elle vaudra ? Cherchez une voiture similaire avec plus de miles sur un site de cote automobile. Beaucoup de chauffeurs gardent leur voiture jusqu\'à 150 000–200 000 miles.',
  save:'Enregistrer',saved:'Voiture enregistrée.',clear:'Supprimer les infos de la voiture',cleared:'Infos de la voiture supprimées.',
  errPrice:'Saisissez le prix payé et le prix de revente prévu.',errOdo:'Le compteur à la revente doit être supérieur au compteur de départ.',errResale:'Le prix de revente prévu doit être inférieur au prix payé.',
  depPreview:'Dépréciation : {v} par mile',
  card:'Coût par mile',gas:'Carburant',maint:'Entretien et réparations',dep:'Dépréciation (usure de la voiture)',total:'Coût total par mile',
  earn:'Vous gagnez par mile',profit:'Bénéfice par mile',keptAfter:'Gardé après les coûts de la voiture',
  irs:'Taux kilométrique de l\'IRS : {r} par mile.',irsCovers:'Il couvre vos vrais coûts.',irsShort:'Vos vrais coûts dépassent le taux de l\'IRS.',
  noCar:'Ajoutez votre voiture pour voir ce que chaque mile vous coûte vraiment, usure comprise.',addCar:'Ajouter ma voiture',edit:'Modifier la voiture',noMiles:'Notez vos miles pour voir votre coût par mile ce mois-ci.',
  newT:'Nouveau : votre vrai coût par mile',newP:'Ajoutez votre voiture une fois et Kept montre ce que coûte chaque mile : carburant, réparations et usure de la voiture.',notNow:'Plus tard'},
ru:{row:'Мой автомобиль',rowSub:'Для реальной стоимости мили',title:'Мой автомобиль',
  intro:'Укажите автомобиль один раз. Kept учтёт его вместе с бензином и ремонтом и покажет, во что на самом деле обходится каждая миля, включая износ машины.',
  name:'Автомобиль (необязательно)',namePh:'напр. Toyota Camry 2022',price:'Сколько вы заплатили',odoStart:'Пробег при покупке',resale:'За сколько планируете продать',odoEnd:'Пробег при продаже',
  tip:'Не знаете, сколько он будет стоить? Найдите похожий автомобиль с большим пробегом на сайте оценки авто. Многие водители ездят до 150 000–200 000 миль.',
  save:'Сохранить',saved:'Автомобиль сохранён.',clear:'Удалить данные автомобиля',cleared:'Данные автомобиля удалены.',
  errPrice:'Укажите цену покупки и ожидаемую цену продажи.',errOdo:'Пробег при продаже должен быть больше начального.',errResale:'Ожидаемая цена продажи должна быть меньше цены покупки.',
  depPreview:'Амортизация: {v} за милю',
  card:'Стоимость мили',gas:'Бензин',maint:'Обслуживание и ремонт',dep:'Амортизация (износ машины)',total:'Итого за милю',
  earn:'Заработок за милю',profit:'Прибыль за милю',keptAfter:'Осталось после расходов на машину',
  irs:'Ставка IRS за милю: {r}.',irsCovers:'Она покрывает ваши реальные расходы.',irsShort:'Ваши реальные расходы выше ставки IRS.',
  noCar:'Добавьте автомобиль, чтобы увидеть реальную стоимость каждой мили с учётом износа.',addCar:'Добавить автомобиль',edit:'Изменить',noMiles:'Записывайте пробег, чтобы увидеть стоимость мили за этот месяц.',
  newT:'Новое: реальная стоимость мили',newP:'Добавьте автомобиль один раз, и Kept покажет, сколько стоит каждая миля: бензин, ремонт и износ машины.',notNow:'Не сейчас'},
zh:{row:'我的车',rowSub:'计算每英里真实成本',title:'我的车',
  intro:'只需输入一次车辆信息。Kept 会结合你的油费和维修费，算出每英里真正的成本，包括车辆折旧。',
  name:'车辆（可选）',namePh:'例如 2022 丰田凯美瑞',price:'购车价格',odoStart:'购车时里程',resale:'预计卖出价格',odoEnd:'预计卖出时里程',
  tip:'不确定将来值多少？可在汽车估价网站查一辆里程更高的同款车。很多司机会把车开到 15 万–20 万英里。',
  save:'保存',saved:'车辆已保存。',clear:'删除车辆信息',cleared:'车辆信息已删除。',
  errPrice:'请输入购车价格和预计卖出价格。',errOdo:'卖出时里程必须大于购车时里程。',errResale:'预计卖出价格应低于购车价格。',
  depPreview:'折旧：每英里 {v}',
  card:'每英里成本',gas:'油费',maint:'保养和维修',dep:'折旧（车辆损耗）',total:'每英里总成本',
  earn:'每英里收入',profit:'每英里利润',keptAfter:'扣除用车成本后到手',
  irs:'IRS 里程费率：每英里 {r}。',irsCovers:'足以覆盖你的真实成本。',irsShort:'你的真实成本高于 IRS 费率。',
  noCar:'添加你的车，查看每英里真正的成本（含损耗）。',addCar:'添加我的车',edit:'编辑车辆',noMiles:'记录里程即可查看本月每英里成本。',
  newT:'新功能：每英里真实成本',newP:'只需添加一次车辆，Kept 就会显示每英里的成本：油费、维修和车辆损耗。',notNow:'以后再说'},
vi:{row:'Xe của tôi',rowSub:'Để biết chi phí thật mỗi dặm',title:'Xe của tôi',
  intro:'Nhập thông tin xe một lần. Kept dùng nó cùng tiền xăng và sửa chữa để cho biết mỗi dặm thực sự tốn bao nhiêu, kể cả hao mòn xe.',
  name:'Xe (không bắt buộc)',namePh:'vd. Toyota Camry 2022',price:'Giá đã mua',odoStart:'Số dặm khi mua',resale:'Giá dự kiến bán lại',odoEnd:'Số dặm khi dự kiến bán',
  tip:'Chưa biết xe sẽ còn bao nhiêu? Hãy tra một xe tương tự có nhiều dặm hơn trên trang định giá xe. Nhiều tài xế chạy xe đến 150.000–200.000 dặm.',
  save:'Lưu',saved:'Đã lưu xe.',clear:'Xóa thông tin xe',cleared:'Đã xóa thông tin xe.',
  errPrice:'Hãy nhập giá đã mua và giá dự kiến bán lại.',errOdo:'Số dặm khi bán phải lớn hơn số dặm khi mua.',errResale:'Giá dự kiến bán lại phải thấp hơn giá đã mua.',
  depPreview:'Khấu hao: {v} mỗi dặm',
  card:'Chi phí mỗi dặm',gas:'Xăng',maint:'Bảo dưỡng và sửa chữa',dep:'Khấu hao (hao mòn xe)',total:'Tổng chi phí mỗi dặm',
  earn:'Thu nhập mỗi dặm',profit:'Lợi nhuận mỗi dặm',keptAfter:'Còn lại sau chi phí xe',
  irs:'Mức khấu trừ dặm của IRS: {r} mỗi dặm.',irsCovers:'Mức này đủ bù chi phí thật của bạn.',irsShort:'Chi phí thật của bạn cao hơn mức của IRS.',
  noCar:'Thêm xe để xem mỗi dặm thực sự tốn bao nhiêu, kể cả hao mòn.',addCar:'Thêm xe của tôi',edit:'Sửa thông tin xe',noMiles:'Hãy ghi số dặm để xem chi phí mỗi dặm tháng này.',
  newT:'Mới: chi phí thật mỗi dặm',newP:'Thêm xe một lần và Kept sẽ cho biết mỗi dặm tốn bao nhiêu: xăng, sửa chữa và hao mòn xe.',notNow:'Để sau'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const say=t=>{ if(typeof toast==='function') toast(t); };
const fmt=v=>typeof money==='function'?money(v):'$'+v.toFixed(2);
const car=()=>(typeof prefs!=='undefined'&&prefs.car)||null;
const num=v=>{ const n=parseFloat(String(v??'').replace(/[^0-9.]/g,'')); return isFinite(n)?n:0; };

// Depreciation per mile: (price paid − expected resale) ÷ miles driven while owning it.
function depPerMile(c){
  if(!c) return null;
  const miles=c.odoEnd-c.odoStart, loss=c.price-c.resale;
  return miles>0&&loss>=0&&c.price>0?loss/miles:null;
}
window.keptCarDepPerMile=()=>depPerMile(car());   // used by the tests

/* ---------- Styles ---------- */
const css=document.createElement('style');
css.textContent=`
#insOverview>.cpm{order:5}
.cpm .rows{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.cpm .r{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:.95rem}
.cpm .r span{color:var(--muted)}
.cpm .r b{font-weight:600}
.cpm .r.tot{border-top:1px solid var(--line);padding-top:8px;font-weight:700}
.cpm .r.tot span{color:var(--fg)}
.cpm .r.good b{color:var(--good)} .cpm .r.bad b{color:var(--bad)}
.cpm .bar{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--surface-2);margin:10px 0 2px}
.cpm .bar i{display:block;height:100%}
.cpm .note{margin:8px 0 0;font-size:.82rem;color:var(--muted)}
.cpm .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.cpm .acts button,.car-new .acts button{border:1.5px solid var(--line);background:var(--surface);color:var(--fg);border-radius:12px;padding:9px 14px;font-weight:600}
.cpm .acts button.primary,.car-new .acts button.primary{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
.car-new{display:flex;flex-direction:column;gap:6px}
.car-new p{margin:0}
.car-new .t{font-weight:700;font-size:1.02rem}
.car-new .s{color:var(--muted);font-size:.92rem}
.car-new .acts{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
#carSec .fgrid .fld.full{grid-column:1/-1}
#carSec .tip{margin:0 2px;font-size:.84rem;color:var(--muted)}
#carSec .prev{margin:0 2px;font-weight:600}
#carSec .carBtns{display:flex;flex-direction:column;gap:10px;align-items:stretch}
#carSec .carBtns .btn-primary{padding:14px;border-radius:14px;font-weight:700;font-size:1rem}
#carSec .skip{align-self:center}
@media (max-width:420px){#carSec .fgrid{grid-template-columns:1fr}}
@media (min-width:960px){#carSec{max-width:760px}}`;
document.head.appendChild(css);

/* ---------- "My car" screen ---------- */
const ICON={
  car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.6-4.4A2 2 0 018.5 5h7a2 2 0 011.9 1.6L19 11M4 11h16v6H4zM6 17v2M18 17v2"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/></svg>',
  cash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.3-5 3.3c0 4.7 10 2.4 10 7 0 2-2.2 3.4-5 3.4s-5-1.2-5-3.2"/></svg>',
  odo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 18a9 9 0 1116 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1"/></svg>'
};
const sec=document.createElement('section'); sec.className='view'; sec.id='carSec'; sec.hidden=true; sec.setAttribute('aria-labelledby','carTitle');
const fld=(id,label,icon,unit,ph,mode)=>`<div class="fld${id==='carName'?' full':''}">${icon}<div class="in"><label for="${id}">${esc(label)}</label><div class="v">${unit==='$'?'<i>$</i>':''}<input id="${id}" ${mode==='text'?'type="text" autocomplete="off"':'type="number" inputmode="decimal" min="0" step="any"'} placeholder="${esc(ph)}">${unit==='mi'?'<i>mi</i>':''}</div></div></div>`;
sec.innerHTML=`<div class="page-top"><button type="button" class="back" id="carBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1 id="carTitle">${esc(w('title'))}</h1><span></span></div>
  <p class="tip" style="font-size:.95rem;color:var(--fg)">${esc(w('intro'))}</p>
  <div class="fgrid">
    ${fld('carName',w('name'),ICON.car,'',w('namePh'),'text')}
    ${fld('carPrice',w('price'),ICON.cash,'$','0')}
    ${fld('carOdoStart',w('odoStart'),ICON.odo,'mi','0')}
    ${fld('carResale',w('resale'),ICON.cash,'$','0')}
    ${fld('carOdoEnd',w('odoEnd'),ICON.odo,'mi','0')}
  </div>
  <p class="tip">${esc(w('tip'))}</p>
  <p class="prev num" id="carPrev" aria-live="polite"></p>
  <p class="msg" id="carMsg" role="alert"></p>
  <div class="carBtns"><button type="button" class="btn-primary" id="carSave">${esc(w('save'))}</button><button type="button" class="skip" id="carClear">${esc(w('clear'))}</button></div>`;
const shell=$('shell'); if(shell) shell.appendChild(sec);
if(typeof VIEWS!=='undefined'){ VIEWS.car='carSec'; NAVOF.car='more'; }

const readForm=()=>({name:$('carName').value.trim().slice(0,60),price:num($('carPrice').value),odoStart:num($('carOdoStart').value),resale:num($('carResale').value),odoEnd:num($('carOdoEnd').value)});
function preview(){
  const d=depPerMile(readForm());
  $('carPrev').textContent=d!=null?w('depPreview',{v:fmt(d)}):'';
}
['carPrice','carOdoStart','carResale','carOdoEnd'].forEach(id=>$(id).addEventListener('input',preview));
function fill(){
  const c=car()||{};
  $('carName').value=c.name||''; $('carPrice').value=c.price||''; $('carOdoStart').value=c.odoStart||'';
  $('carResale').value=c.resale||''; $('carOdoEnd').value=c.odoEnd||'';
  $('carMsg').textContent=''; $('carClear').hidden=!car(); preview();
}
let from='more';
function open(){ from=(typeof cur!=='undefined'&&cur!=='car')?cur:'more'; fill(); window.keptGo('car'); }
function back(){ window.keptGo(from==='car'?'more':from); }
window.keptOpenCar=open; window.keptCarBack=back;
$('carBack').onclick=back;
$('carSave').onclick=()=>{
  const c=readForm(), msg=$('carMsg'); msg.className='msg err';
  if(!c.price) return void (msg.textContent=w('errPrice'));
  if(!(c.odoEnd>c.odoStart)) return void (msg.textContent=w('errOdo'));
  if(c.resale>c.price) return void (msg.textContent=w('errResale'));
  prefs.car={...c,updated:Date.now()}; savePrefs(); seen();
  msg.textContent=''; say(w('saved')); refresh(); back();
};
$('carClear').onclick=()=>{ delete prefs.car; savePrefs(); say(w('cleared')); refresh(); back(); };

/* ---------- Row in More ---------- */
const more=$('vMore'), dataList=more&&[...more.querySelectorAll('.list')].find(l=>l.querySelector('#exportBtn'));
if(dataList){
  const row=document.createElement('button'); row.type='button'; row.id='carRow';
  row.innerHTML=`${ICON.car}<span style="display:flex;flex-direction:column;gap:2px;align-items:flex-start"><span>${esc(w('row'))}</span><small style="font-size:.84rem;color:var(--muted);font-weight:500" id="carRowS"></small></span>`;
  row.onclick=open;
  dataList.insertBefore(row,$('custBtn')||null);
}

/* ---------- Cost per mile card on Insights > Overview ---------- */
function monthTotals(){
  if(typeof insMonth==='undefined'||!insMonth) return null;
  const ms=parseD(insMonth+'-01');
  return {T:totals(rangeAB(ms,new Date(ms.getFullYear(),ms.getMonth()+1,1))),iso:insMonth+'-15'};
}
function cardHtml(){
  const c=car(), d=depPerMile(c), mt=monthTotals();
  if(!c||d==null) return `<div class="card cpm" style="grid-column:1/-1"><div class="card-h"><h3>${esc(w('card'))}</h3></div><p class="note" style="margin-top:2px">${esc(w('noCar'))}</p><div class="acts"><button type="button" class="primary" data-car="open">${esc(w('addCar'))}</button></div></div>`;
  if(!mt||!mt.T.miles) return `<div class="card cpm" style="grid-column:1/-1"><div class="card-h"><h3>${esc(w('card'))}</h3><span>${esc(c.name||'')}</span></div><p class="note" style="margin-top:2px">${esc(w('noMiles'))}</p><p class="note">${esc(w('depPreview',{v:fmt(d)}))}</p><div class="acts"><button type="button" data-car="open">${esc(w('edit'))}</button></div></div>`;
  const T=mt.T, mi=T.miles, gas=T.gas/mi, maint=T.maint/mi, total=gas+maint+d, earn=T.M/mi, profit=earn-total;
  const keptAfter=T.K-d*mi, rate=typeof rateOn==='function'?rateOn(mt.iso):null;
  const pct=v=>total>0?Math.max(0,v/total*100).toFixed(1):0;
  return `<div class="card cpm num" style="grid-column:1/-1"><div class="card-h"><h3>${esc(w('card'))}</h3><span>${esc(c.name||'')}</span></div>
    <div class="bar" role="img" aria-label="${esc(w('gas'))} ${fmt(gas)}, ${esc(w('maint'))} ${fmt(maint)}, ${esc(w('dep'))} ${fmt(d)}"><i style="width:${pct(gas)}%;background:var(--accent)"></i><i style="width:${pct(maint)}%;background:var(--warn)"></i><i style="width:${pct(d)}%;background:var(--muted)"></i></div>
    <div class="rows">
      <div class="r"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--accent);margin-right:6px"></i>${esc(w('gas'))}</span><b>${fmt(gas)}</b></div>
      <div class="r"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--warn);margin-right:6px"></i>${esc(w('maint'))}</span><b>${fmt(maint)}</b></div>
      <div class="r"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--muted);margin-right:6px"></i>${esc(w('dep'))}</span><b>${fmt(d)}</b></div>
      <div class="r tot"><span>${esc(w('total'))}</span><b>${fmt(total)}</b></div>
      <div class="r"><span>${esc(w('earn'))}</span><b>${fmt(earn)}</b></div>
      <div class="r ${profit>=0?'good':'bad'}"><span>${esc(w('profit'))}</span><b>${fmt(profit)}</b></div>
      <div class="r ${keptAfter>=0?'good':'bad'}"><span>${esc(w('keptAfter'))}</span><b>${fmt(keptAfter)}</b></div>
    </div>
    ${rate!=null?`<p class="note">${esc(w('irs',{r:fmt(rate)}))} ${esc(rate>=total?w('irsCovers'):w('irsShort'))}</p>`:''}
    <div class="acts"><button type="button" data-car="open">${esc(w('edit'))}</button></div></div>`;
}
function addCard(){
  const box=$('insOverview'); if(!box||box.hidden) return;
  const old=box.querySelector('.cpm'); if(old) old.remove();
  box.insertAdjacentHTML('beforeend',cardHtml());
  box.querySelector('.cpm [data-car="open"]').onclick=open;
}
if(typeof renderIns==='function'){
  const orig=renderIns;
  renderIns=function(){ const r=orig.apply(this,arguments); try{ if(typeof insTab==='undefined'||insTab==='overview') addCard(); }catch(e){ console.warn('car card',e); } return r; };
}

/* ---------- One-time "New" note on Home for drivers who update ---------- */
const NK=(typeof KEY!=='undefined'?KEY:'kept')+'-new-car';
const seenIt=()=>{ try{ return !!localStorage.getItem(NK); }catch(e){ return true; } };
function seen(){ try{ localStorage.setItem(NK,'1'); }catch(e){} const n=$('carNew'); if(n) n.remove(); }
function showNew(){
  const home=$('vHome'); if(!home||seenIt()||car()||$('carNew')) return;
  const n=document.createElement('div'); n.className='card car-new'; n.id='carNew';
  n.innerHTML=`<p class="t">${esc(w('newT'))}</p><p class="s">${esc(w('newP'))}</p><div class="acts"><button type="button" class="primary" id="carNewGo">${esc(w('addCar'))}</button><button type="button" id="carNewNo">${esc(w('notNow'))}</button></div>`;
  const top=home.querySelector('.top'); home.insertBefore(n,top?top.nextSibling:home.firstChild);
  $('carNewGo').onclick=()=>{ seen(); open(); };
  $('carNewNo').onclick=seen;
}

function refresh(){
  const s=$('carRowS'); if(s){ const c=car(), d=depPerMile(c); s.textContent=c&&d!=null?(c.name?c.name+' · ':'')+w('depPreview',{v:fmt(d)}):w('rowSub'); }
  if(typeof cur!=='undefined'&&cur==='insights'&&typeof renderIns==='function') renderIns();
}
refresh(); showNew();
})();
