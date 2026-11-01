/* Kept: "Help us improve" on the More page — Send feedback, Rate Kept, Share Kept.
   Feedback is written in Kept, then handed to the driver's email app addressed to support, with optional app details
   (version, device type, language; never earnings). Rate opens the store review page (Google Play app, Microsoft Store app).
   Share uses the phone's share sheet (native in the Android app, Web Share elsewhere) or copies the link. */
(function(){
'use strict';
const SUPPORT='support@keptforgigworkers.com', SITE='https://keptforgigworkers.com';
const PLAY='https://play.google.com/store/apps/details?id=com.desertcircuitapps.kept', MS_REVIEW='ms-windows-store://review/?ProductId=9NX6GPZ2SG6K';

/* ---------- Words ---------- */
const T={
en:{sh:'Help us improve',fb:'Send feedback',fbSub:'Ideas, problems, questions',rate:'Rate Kept',rateSubPlay:'Leave a review on Google Play',rateSubMs:'Leave a review in the Microsoft Store',share:'Share Kept',shareSub:'Tell another driver about it',
  title:'Send feedback',intro:'Tell us what to fix or what you\'d like Kept to do next. Every message is read by the developer.',
  kind:'What is it about?',idea:'Idea',problem:'Problem',question:'Question',praise:'Something I like',msgL:'Your message',msgPh:'Type here…',
  details:'Include app details (version, device type, language). Never your earnings.',send:'Send',empty:'Type a message first.',
  sent:'Your email app should open with your message ready to send. If it didn\'t, email us at {e}.',copy:'Copy message',copied:'Message copied.',
  subj:'Kept feedback: {k}',shareText:'I track my Lyft and Uber earnings with Kept for Gig Workers. It shows what you really keep after gas. Free, no ads:',linkCopied:'Link copied. Paste it in a text or post.'},
es:{sh:'Ayúdanos a mejorar',fb:'Enviar comentarios',fbSub:'Ideas, problemas, preguntas',rate:'Calificar Kept',rateSubPlay:'Deja una reseña en Google Play',rateSubMs:'Deja una reseña en Microsoft Store',share:'Compartir Kept',shareSub:'Cuéntale a otro conductor',
  title:'Enviar comentarios',intro:'Dinos qué arreglar o qué te gustaría que Kept hiciera. El desarrollador lee cada mensaje.',
  kind:'¿De qué se trata?',idea:'Idea',problem:'Problema',question:'Pregunta',praise:'Algo que me gusta',msgL:'Tu mensaje',msgPh:'Escribe aquí…',
  details:'Incluir datos de la app (versión, tipo de dispositivo, idioma). Nunca tus ganancias.',send:'Enviar',empty:'Escribe un mensaje primero.',
  sent:'Tu app de correo debería abrirse con tu mensaje listo para enviar. Si no se abrió, escríbenos a {e}.',copy:'Copiar mensaje',copied:'Mensaje copiado.',
  subj:'Comentarios de Kept: {k}',shareText:'Llevo mis ganancias de Lyft y Uber con Kept for Gig Workers. Muestra lo que realmente te queda después de la gasolina. Gratis y sin anuncios:',linkCopied:'Enlace copiado. Pégalo en un mensaje o publicación.'},
pt:{sh:'Ajude a melhorar',fb:'Enviar feedback',fbSub:'Ideias, problemas, perguntas',rate:'Avaliar o Kept',rateSubPlay:'Deixe uma avaliação no Google Play',rateSubMs:'Deixe uma avaliação na Microsoft Store',share:'Compartilhar o Kept',shareSub:'Conte para outro motorista',
  title:'Enviar feedback',intro:'Diga o que corrigir ou o que você gostaria que o Kept fizesse. O desenvolvedor lê cada mensagem.',
  kind:'Sobre o que é?',idea:'Ideia',problem:'Problema',question:'Pergunta',praise:'Algo que eu gosto',msgL:'Sua mensagem',msgPh:'Digite aqui…',
  details:'Incluir dados do app (versão, tipo de aparelho, idioma). Nunca seus ganhos.',send:'Enviar',empty:'Digite uma mensagem primeiro.',
  sent:'Seu app de e-mail deve abrir com a mensagem pronta para enviar. Se não abriu, escreva para {e}.',copy:'Copiar mensagem',copied:'Mensagem copiada.',
  subj:'Feedback do Kept: {k}',shareText:'Eu acompanho meus ganhos da Lyft e da Uber com o Kept for Gig Workers. Ele mostra quanto realmente sobra depois da gasolina. Grátis e sem anúncios:',linkCopied:'Link copiado. Cole em uma mensagem ou post.'},
fr:{sh:'Aidez-nous à améliorer',fb:'Envoyer un avis',fbSub:'Idées, problèmes, questions',rate:'Noter Kept',rateSubPlay:'Laissez un avis sur Google Play',rateSubMs:'Laissez un avis sur le Microsoft Store',share:'Partager Kept',shareSub:'Parlez-en à un autre chauffeur',
  title:'Envoyer un avis',intro:'Dites-nous quoi corriger ou ce que vous aimeriez que Kept fasse. Chaque message est lu par le développeur.',
  kind:'C\'est à quel sujet ?',idea:'Idée',problem:'Problème',question:'Question',praise:'Quelque chose que j\'aime',msgL:'Votre message',msgPh:'Écrivez ici…',
  details:'Inclure les infos de l\'appli (version, type d\'appareil, langue). Jamais vos gains.',send:'Envoyer',empty:'Écrivez d\'abord un message.',
  sent:'Votre appli e-mail devrait s\'ouvrir avec votre message prêt à envoyer. Sinon, écrivez-nous à {e}.',copy:'Copier le message',copied:'Message copié.',
  subj:'Avis sur Kept : {k}',shareText:'Je suis mes gains Lyft et Uber avec Kept for Gig Workers. Il montre ce qui vous reste vraiment après le carburant. Gratuit, sans pub :',linkCopied:'Lien copié. Collez-le dans un message ou une publication.'},
ru:{sh:'Помогите улучшить',fb:'Отправить отзыв',fbSub:'Идеи, проблемы, вопросы',rate:'Оценить Kept',rateSubPlay:'Оставьте отзыв в Google Play',rateSubMs:'Оставьте отзыв в Microsoft Store',share:'Поделиться Kept',shareSub:'Расскажите другому водителю',
  title:'Отправить отзыв',intro:'Расскажите, что исправить или что бы вы хотели видеть в Kept. Разработчик читает каждое сообщение.',
  kind:'О чём сообщение?',idea:'Идея',problem:'Проблема',question:'Вопрос',praise:'Мне нравится',msgL:'Ваше сообщение',msgPh:'Пишите здесь…',
  details:'Добавить данные приложения (версия, тип устройства, язык). Без ваших заработков.',send:'Отправить',empty:'Сначала напишите сообщение.',
  sent:'Должно открыться почтовое приложение с готовым сообщением. Если нет, напишите нам на {e}.',copy:'Скопировать сообщение',copied:'Сообщение скопировано.',
  subj:'Отзыв о Kept: {k}',shareText:'Я веду заработок в Lyft и Uber в Kept for Gig Workers. Он показывает, сколько реально остаётся после бензина. Бесплатно, без рекламы:',linkCopied:'Ссылка скопирована. Вставьте её в сообщение или пост.'},
zh:{sh:'帮助我们改进',fb:'发送反馈',fbSub:'想法、问题、疑问',rate:'给 Kept 评分',rateSubPlay:'在 Google Play 上留下评价',rateSubMs:'在 Microsoft Store 中留下评价',share:'分享 Kept',shareSub:'推荐给其他司机',
  title:'发送反馈',intro:'告诉我们需要修复什么，或你希望 Kept 增加什么功能。开发者会阅读每一条消息。',
  kind:'反馈类型',idea:'建议',problem:'问题',question:'疑问',praise:'我喜欢的地方',msgL:'你的消息',msgPh:'在此输入…',
  details:'附上应用信息（版本、设备类型、语言）。绝不包含你的收入。',send:'发送',empty:'请先输入消息。',
  sent:'你的邮件应用应已打开，消息已准备好发送。如果没有打开，请发邮件至 {e}。',copy:'复制消息',copied:'消息已复制。',
  subj:'Kept 反馈：{k}',shareText:'我用 Kept for Gig Workers 记录 Lyft 和 Uber 收入，它能显示扣除油费后真正到手多少。免费、无广告：',linkCopied:'链接已复制，可粘贴到短信或帖子中。'},
vi:{sh:'Giúp chúng tôi cải thiện',fb:'Gửi góp ý',fbSub:'Ý tưởng, sự cố, câu hỏi',rate:'Đánh giá Kept',rateSubPlay:'Viết đánh giá trên Google Play',rateSubMs:'Viết đánh giá trên Microsoft Store',share:'Chia sẻ Kept',shareSub:'Giới thiệu cho tài xế khác',
  title:'Gửi góp ý',intro:'Hãy cho chúng tôi biết cần sửa gì hoặc bạn muốn Kept làm thêm gì. Nhà phát triển đọc mọi tin nhắn.',
  kind:'Góp ý về điều gì?',idea:'Ý tưởng',problem:'Sự cố',question:'Câu hỏi',praise:'Điều tôi thích',msgL:'Tin nhắn của bạn',msgPh:'Nhập tại đây…',
  details:'Kèm thông tin ứng dụng (phiên bản, loại thiết bị, ngôn ngữ). Không bao giờ kèm thu nhập.',send:'Gửi',empty:'Hãy nhập tin nhắn trước.',
  sent:'Ứng dụng email sẽ mở với tin nhắn sẵn sàng để gửi. Nếu không mở, hãy gửi email tới {e}.',copy:'Sao chép tin nhắn',copied:'Đã sao chép tin nhắn.',
  subj:'Góp ý Kept: {k}',shareText:'Tôi theo dõi thu nhập Lyft và Uber bằng Kept for Gig Workers. Ứng dụng cho biết bạn thực sự giữ lại bao nhiêu sau tiền xăng. Miễn phí, không quảng cáo:',linkCopied:'Đã sao chép liên kết. Hãy dán vào tin nhắn hoặc bài đăng.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=(k,o)=>(T[lang][k]||T.en[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const say=t=>{ if(typeof toast==='function') toast(t); };

/* ---------- Where Kept is running ---------- */
const native=!!window.keptNative;
const standalone=matchMedia('(display-mode: standalone)').matches;
const msStore=!native&&standalone&&/Windows/i.test(navigator.userAgent);
const where=native?'Android app':msStore?'Microsoft Store app':standalone?'Installed web app':'Website';
let version='';
try{ const App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App; if(native&&App&&App.getInfo) App.getInfo().then(i=>{ version=i.version+' ('+i.build+')'; }).catch(()=>{}); }catch(e){}

function openLink(url){   // mailto:, store links: the Android app hands these to the phone
  const a=document.createElement('a'); a.href=url; a.rel='noopener';
  if(/^https?:/.test(url)) a.target='_blank';
  document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- Styles ---------- */
const css=document.createElement('style');
css.textContent=`
#fbSec .fb{display:flex;flex-direction:column;gap:12px}
#fbSec .intro{margin:0;line-height:1.45}
#fbSec .kinds{display:flex;flex-wrap:wrap;gap:8px;border:0;margin:0;padding:0}
#fbSec .kinds legend{font-weight:600;margin-bottom:8px;padding:0}
#fbSec .kinds label{border:1.5px solid var(--line);border-radius:99px;padding:8px 14px;font-weight:600;cursor:pointer;background:var(--surface)}
#fbSec .kinds input{position:absolute;opacity:0;pointer-events:none}
#fbSec .kinds label:has(input:checked){background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
#fbSec .kinds label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
#fbSec textarea{width:100%;box-sizing:border-box;min-height:150px;border:1.5px solid var(--line);border-radius:14px;padding:12px;font:inherit;color:var(--fg);background:var(--surface);resize:vertical}
#fbSec textarea:focus{outline:none;border-color:var(--accent)}
#fbSec .chk{display:flex;gap:10px;align-items:flex-start;font-size:.9rem;color:var(--muted)}
#fbSec .chk input{margin-top:3px}
#fbSec .btn-primary{padding:14px;border-radius:14px;font-weight:700;font-size:1rem}
#fbSec .msg{margin:0;font-size:.92rem;min-height:1.2em}
#fbSec .copy{align-self:flex-start;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);border-radius:12px;padding:9px 14px;font-weight:600}
#vMore .help small{display:block;font-size:.84rem;color:var(--muted);font-weight:500;margin-top:2px}
@media (min-width:960px){#fbSec{max-width:760px}}`;
document.head.appendChild(css);

/* ---------- "Help us improve" section on More ---------- */
const ICON={
  fb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
  rate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>'
};
const more=$('vMore'), foot=more&&more.querySelector('.foot');
if(more){
  const rateSub=native?w('rateSubPlay'):msStore?w('rateSubMs'):'';
  const row=(id,icon,label,sub)=>`<button type="button" id="${id}" class="help">${icon}<span style="text-align:left"><span>${esc(label)}</span><small>${esc(sub)}</small></span></button>`;
  const h=document.createElement('h2'); h.className='sh'; h.textContent=w('sh');
  const list=document.createElement('div'); list.className='list'; list.id='helpList';
  list.innerHTML=row('fbRow',ICON.fb,w('fb'),w('fbSub'))+(rateSub?row('rateRow',ICON.rate,w('rate'),rateSub):'')+row('shareRow',ICON.share,w('share'),w('shareSub'));
  more.insertBefore(h,foot||null); more.insertBefore(list,foot||null);
}

/* ---------- Share ---------- */
async function share(){
  const text=w('shareText');
  try{
    if(native&&window.keptNative.shareText){ await window.keptNative.shareText(text+' '+SITE,'Kept for Gig Workers'); return; }
    if(navigator.share){ await navigator.share({title:'Kept for Gig Workers',text,url:SITE}); return; }
  }catch(e){ if(e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(text+' '+SITE); say(w('linkCopied')); }catch(e){ prompt('',text+' '+SITE); }
}

/* ---------- Feedback screen ---------- */
const sec=document.createElement('section'); sec.className='view'; sec.id='fbSec'; sec.hidden=true; sec.setAttribute('aria-labelledby','fbTitle');
const shell=$('shell'); if(shell) shell.appendChild(sec);
if(typeof VIEWS!=='undefined'){ VIEWS.feedback='fbSec'; NAVOF.feedback='more'; }
const KINDS=['idea','problem','question','praise'];
sec.innerHTML=`<div class="page-top"><button type="button" class="back" id="fbBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1 id="fbTitle">${esc(w('title'))}</h1><span></span></div>
  <div class="card fb">
    <p class="intro">${esc(w('intro'))}</p>
    <fieldset class="kinds"><legend>${esc(w('kind'))}</legend>${KINDS.map((k,i)=>`<label><input type="radio" name="fbKind" value="${k}" ${i===0?'checked':''}>${esc(w(k))}</label>`).join('')}</fieldset>
    <label for="fbText" style="font-weight:600">${esc(w('msgL'))}</label>
    <textarea id="fbText" maxlength="3000" placeholder="${esc(w('msgPh'))}"></textarea>
    <label class="chk"><input type="checkbox" id="fbDetails" checked><span>${esc(w('details'))}</span></label>
    <button type="button" class="btn-primary" id="fbSend">${esc(w('send'))}</button>
    <p class="msg" id="fbMsg" role="status"></p>
    <button type="button" class="copy" id="fbCopy" hidden>${esc(w('copy'))}</button>
  </div>`;
let from='more';
function open(){ from=(typeof cur!=='undefined'&&cur!=='feedback')?cur:'more'; $('fbMsg').textContent=''; $('fbCopy').hidden=true; window.keptGo('feedback'); setTimeout(()=>$('fbText').focus(),150); }
function back(){ window.keptGo(from==='feedback'?'more':from); }
window.keptFeedbackBack=back;
$('fbBack').onclick=back;

function compose(){
  const kind=(sec.querySelector('input[name="fbKind"]:checked')||{}).value||'idea';
  let body=$('fbText').value.trim();
  if($('fbDetails').checked){
    const d=[`Kept: ${where}${version?' '+version:''}`,`Language: ${lang}`,`Screen: ${screen.width}x${screen.height}`,`Device: ${navigator.userAgent.replace(/\s+/g,' ').slice(0,180)}`];
    body+='\n\n— '+d.join('\n');
  }
  return {subject:w('subj',{k:T.en[kind]}),body};
}
$('fbSend').onclick=()=>{
  const m=$('fbMsg');
  if(!$('fbText').value.trim()){ m.textContent=w('empty'); $('fbText').focus(); return; }
  const c=compose();
  openLink(`mailto:${SUPPORT}?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(c.body)}`);
  m.textContent=w('sent',{e:SUPPORT}); $('fbCopy').hidden=false;
};
$('fbCopy').onclick=async()=>{ const c=compose(); try{ await navigator.clipboard.writeText(c.subject+'\n\n'+c.body); say(w('copied')); }catch(e){} };

/* ---------- Wire up ---------- */
const fb=$('fbRow'); if(fb) fb.onclick=open;
const rr=$('rateRow'); if(rr) rr.onclick=()=>openLink(native?PLAY:MS_REVIEW);
const sr=$('shareRow'); if(sr) sr.onclick=share;
})();
