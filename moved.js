/* Shown only on the old address (tallguy644.github.io/kept): points drivers to keptforgigworkers.com
   and helps them bring their days. Days saved in a browser belong to that address, so they move either
   by signing in (account sync) or with a backup file. */
(function(){
'use strict';
if(location.hostname!=='tallguy644.github.io') return;
const NEW='https://keptforgigworkers.com/';
const T={
en:{t:'Kept has moved to keptforgigworkers.com',acct:'You\'re signed in, so your days are already in your account. Open the new site and sign in there.',
  noacct:'Your days are saved on this old address. To bring them along: tap "Save backup file" below, then on the new site use More → Restore backup. Or create a free account here first, and just sign in on the new site.',
  go:'Open keptforgigworkers.com',save:'Save backup file',hide:'Later'},
es:{t:'Kept se mudó a keptforgigworkers.com',acct:'Ya iniciaste sesión, así que tus días están en tu cuenta. Abre el nuevo sitio e inicia sesión allí.',
  noacct:'Tus días están guardados en esta dirección antigua. Para llevarlos: toca "Guardar copia" abajo y, en el nuevo sitio, usa Más → Restaurar respaldo. O crea una cuenta gratis aquí e inicia sesión en el nuevo sitio.',
  go:'Abrir keptforgigworkers.com',save:'Guardar copia',hide:'Después'},
pt:{t:'O Kept mudou para keptforgigworkers.com',acct:'Você está conectado, então seus dias já estão na sua conta. Abra o novo site e entre lá.',
  noacct:'Seus dias estão salvos neste endereço antigo. Para levá-los: toque em "Salvar backup" abaixo e, no novo site, use Mais → Restaurar backup. Ou crie uma conta grátis aqui e entre no novo site.',
  go:'Abrir keptforgigworkers.com',save:'Salvar backup',hide:'Depois'},
fr:{t:'Kept a déménagé sur keptforgigworkers.com',acct:'Vous êtes connecté : vos journées sont déjà dans votre compte. Ouvrez le nouveau site et connectez-vous.',
  noacct:'Vos journées sont enregistrées sur cette ancienne adresse. Pour les emporter : touchez « Enregistrer une sauvegarde » ci-dessous, puis sur le nouveau site utilisez Plus → Restaurer une sauvegarde. Ou créez un compte gratuit ici et connectez-vous sur le nouveau site.',
  go:'Ouvrir keptforgigworkers.com',save:'Enregistrer une sauvegarde',hide:'Plus tard'},
ru:{t:'Kept переехал на keptforgigworkers.com',acct:'Вы вошли, поэтому ваши дни уже в аккаунте. Откройте новый сайт и войдите там.',
  noacct:'Ваши дни сохранены на этом старом адресе. Чтобы перенести их, нажмите «Сохранить копию» ниже, затем на новом сайте выберите Ещё → Восстановить из копии. Или создайте здесь бесплатный аккаунт и войдите на новом сайте.',
  go:'Открыть keptforgigworkers.com',save:'Сохранить копию',hide:'Позже'},
zh:{t:'Kept 已迁移到 keptforgigworkers.com',acct:'你已登录，记录已在你的账户中。打开新网站并登录即可。',
  noacct:'你的记录保存在这个旧地址。要带走它们：点下面的“保存备份文件”，然后在新网站使用 更多 → 恢复备份。或者先在这里创建免费账户，然后在新网站登录。',
  go:'打开 keptforgigworkers.com',save:'保存备份文件',hide:'稍后'},
vi:{t:'Kept đã chuyển sang keptforgigworkers.com',acct:'Bạn đã đăng nhập nên dữ liệu đã nằm trong tài khoản. Mở trang mới và đăng nhập ở đó.',
  noacct:'Dữ liệu của bạn đang lưu ở địa chỉ cũ này. Để mang theo: chạm "Lưu tệp sao lưu" bên dưới, rồi trên trang mới dùng Thêm → Khôi phục bản sao lưu. Hoặc tạo tài khoản miễn phí ở đây rồi đăng nhập trên trang mới.',
  go:'Mở keptforgigworkers.com',save:'Lưu tệp sao lưu',hide:'Để sau'}};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en', w=k=>T[lang][k]||T.en[k];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const css=document.createElement('style');
css.textContent=`#moved{background:var(--accent);color:var(--accent-fg);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;margin-bottom:4px}
#moved b{font-size:1.05rem}#moved p{margin:0;font-size:.92rem;opacity:.95}
#moved .acts{display:flex;gap:8px;flex-wrap:wrap}#moved .acts a,#moved .acts button{border:0;border-radius:12px;padding:10px 14px;font-weight:600;font-size:.92rem;text-decoration:none;cursor:pointer}
#moved .go{background:var(--accent-fg);color:var(--accent)}#moved .sv{background:rgba(255,255,255,.18);color:var(--accent-fg)}#moved .later{background:none;color:var(--accent-fg);opacity:.85}`;
document.head.appendChild(css);
const box=document.createElement('div'); box.id='moved';
const home=document.getElementById('vHome'); if(!home) return;
home.insertBefore(box,home.querySelector('.seg'));
function draw(){
  const st=window.keptAccount&&window.keptAccount.state&&window.keptAccount.state();
  const signed=!!(st&&st.user), has=typeof data!=='undefined'&&data.shifts&&data.shifts.length;
  box.innerHTML=`<b>${esc(w('t'))}</b>${has?`<p>${esc(w(signed?'acct':'noacct'))}</p>`:''}
    <div class="acts"><a class="go" href="${NEW}">${esc(w('go'))}</a>${has&&!signed?`<button type="button" class="sv" id="movedSave">${esc(w('save'))}</button>`:''}<button type="button" class="later" id="movedLater">${esc(w('hide'))}</button></div>`;
  const s=document.getElementById('movedSave'); if(s) s.onclick=()=>document.getElementById('driveBtn').click();
  document.getElementById('movedLater').onclick=()=>{ box.hidden=true; };
}
draw(); window.addEventListener('kept-account',draw);
})();
