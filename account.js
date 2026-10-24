/* Kept accounts: optional sign-in (Google or email + password) that keeps each driver's days in their own
   Firebase account, synced across devices and safe if a phone is lost. Kept still works fully without an account.
   Each driver's data lives at users/{uid}/days/{dayId}; firestore.rules lets only that signed-in driver read or write it.
   Turned off until FIREBASE_CONFIG is filled in (see ACCOUNTS.md). */
(function(){
'use strict';

/* ---------- Settings ---------- */
// Firebase project "Kept" (kept-b85c0). This config only identifies the project and is safe to publish;
// firestore.rules is what keeps each driver's data private.
const FIREBASE_CONFIG={
  apiKey:'AIzaSyDNWezGzh2TrP1atLNJCC08JEVdu_h8R6o',
  authDomain:'kept-b85c0.firebaseapp.com',
  projectId:'kept-b85c0',
  storageBucket:'kept-b85c0.firebasestorage.app',
  messagingSenderId:'957643145067',
  appId:'1:957643145067:web:0cfecd0fce56cae6e8562e',
  measurementId:'G-HSV2Q3L7WX'
};
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
const cfg=window.KEPT_FIREBASE_CONFIG||FIREBASE_CONFIG;
if(!cfg) return;

/* ---------- Words ---------- */
const T={
en:{row:'Sign in or create account',rowSub:'Keep your days safe on all your devices',title:'Your account',
  pitch:'Sign in to keep your days safe and use Kept on all your devices. Your days are private to your account.',
  google:'Continue with Google',or:'or',email:'Email',password:'Password',signIn:'Sign in',create:'Create account',
  toCreate:'New here? Create an account',toSignIn:'Have an account? Sign in',forgot:'Forgot password?',
  signedAs:'Signed in as',signOut:'Sign out',del:'Delete account',delSure:'Tap again to delete your account and all its days',
  delPw:'Enter your password to confirm',delConfirm:'Delete my account',deleted:'Your account and its days were deleted.',
  synced:'All your days are saved to your account.',syncing:'Saving to your account…',offline:'Offline. Your changes will sync when you\'re back online.',
  signOutNote:'Signing out removes your days from this device. They stay safe in your account.',
  welcome:'Signed in. Your days are now saved to your account.',bye:'Signed out. Your days are safe in your account.',
  reset:'Check your email for a link to reset your password.',needEmail:'Enter your email first, then tap Forgot password.',
  promptT:'Keep your days safe',promptP:'Create a free account to back up your days and use Kept on any device.',notNow:'Not now',
  e_cred:'Email or password is incorrect.',e_inuse:'That email already has an account. Sign in instead.',e_weak:'Use at least 6 characters for your password.',
  e_email:'Enter a valid email address.',e_cancel:'Sign-in was cancelled.',e_net:'No connection. Try again when you\'re online.',
  e_many:'Too many tries. Wait a minute and try again.',e_load:'Accounts aren\'t available right now. Check your connection.',e_other:'Something went wrong. Try again.'},
es:{row:'Inicia sesión o crea una cuenta',rowSub:'Protege tus días en todos tus dispositivos',title:'Tu cuenta',
  pitch:'Inicia sesión para proteger tus días y usar Kept en todos tus dispositivos. Tus días son privados de tu cuenta.',
  google:'Continuar con Google',or:'o',email:'Correo',password:'Contraseña',signIn:'Iniciar sesión',create:'Crear cuenta',
  toCreate:'¿Eres nuevo? Crea una cuenta',toSignIn:'¿Ya tienes cuenta? Inicia sesión',forgot:'¿Olvidaste tu contraseña?',
  signedAs:'Sesión iniciada como',signOut:'Cerrar sesión',del:'Eliminar cuenta',delSure:'Toca otra vez para eliminar tu cuenta y todos sus días',
  delPw:'Escribe tu contraseña para confirmar',delConfirm:'Eliminar mi cuenta',deleted:'Se eliminaron tu cuenta y sus días.',
  synced:'Todos tus días están guardados en tu cuenta.',syncing:'Guardando en tu cuenta…',offline:'Sin conexión. Tus cambios se sincronizarán cuando vuelvas a estar en línea.',
  signOutNote:'Al cerrar sesión se quitan tus días de este dispositivo. Siguen seguros en tu cuenta.',
  welcome:'Sesión iniciada. Tus días ahora se guardan en tu cuenta.',bye:'Sesión cerrada. Tus días están seguros en tu cuenta.',
  reset:'Revisa tu correo: te enviamos un enlace para restablecer tu contraseña.',needEmail:'Escribe tu correo y luego toca ¿Olvidaste tu contraseña?',
  promptT:'Protege tus días',promptP:'Crea una cuenta gratis para respaldar tus días y usar Kept en cualquier dispositivo.',notNow:'Ahora no',
  e_cred:'El correo o la contraseña no son correctos.',e_inuse:'Ese correo ya tiene una cuenta. Inicia sesión.',e_weak:'Usa al menos 6 caracteres en tu contraseña.',
  e_email:'Escribe un correo válido.',e_cancel:'Se canceló el inicio de sesión.',e_net:'Sin conexión. Inténtalo cuando estés en línea.',
  e_many:'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',e_load:'Las cuentas no están disponibles ahora. Revisa tu conexión.',e_other:'Algo salió mal. Inténtalo de nuevo.'},
pt:{row:'Entre ou crie uma conta',rowSub:'Proteja seus dias em todos os aparelhos',title:'Sua conta',
  pitch:'Entre para proteger seus dias e usar o Kept em todos os seus aparelhos. Seus dias são privados da sua conta.',
  google:'Continuar com o Google',or:'ou',email:'E-mail',password:'Senha',signIn:'Entrar',create:'Criar conta',
  toCreate:'É novo aqui? Crie uma conta',toSignIn:'Já tem conta? Entre',forgot:'Esqueceu a senha?',
  signedAs:'Conectado como',signOut:'Sair',del:'Excluir conta',delSure:'Toque de novo para excluir sua conta e todos os dias',
  delPw:'Digite sua senha para confirmar',delConfirm:'Excluir minha conta',deleted:'Sua conta e seus dias foram excluídos.',
  synced:'Todos os seus dias estão salvos na sua conta.',syncing:'Salvando na sua conta…',offline:'Sem conexão. Suas alterações serão sincronizadas quando você voltar a ficar on-line.',
  signOutNote:'Ao sair, seus dias são removidos deste aparelho. Eles continuam seguros na sua conta.',
  welcome:'Conectado. Seus dias agora são salvos na sua conta.',bye:'Você saiu. Seus dias estão seguros na sua conta.',
  reset:'Confira seu e-mail: enviamos um link para redefinir sua senha.',needEmail:'Digite seu e-mail e depois toque em Esqueceu a senha?',
  promptT:'Proteja seus dias',promptP:'Crie uma conta grátis para fazer backup dos seus dias e usar o Kept em qualquer aparelho.',notNow:'Agora não',
  e_cred:'E-mail ou senha incorretos.',e_inuse:'Esse e-mail já tem uma conta. Entre.',e_weak:'Use pelo menos 6 caracteres na senha.',
  e_email:'Digite um e-mail válido.',e_cancel:'O login foi cancelado.',e_net:'Sem conexão. Tente quando estiver on-line.',
  e_many:'Muitas tentativas. Espere um minuto e tente de novo.',e_load:'As contas não estão disponíveis agora. Verifique sua conexão.',e_other:'Algo deu errado. Tente de novo.'},
fr:{row:'Se connecter ou créer un compte',rowSub:'Protégez vos journées sur tous vos appareils',title:'Votre compte',
  pitch:'Connectez-vous pour protéger vos journées et utiliser Kept sur tous vos appareils. Vos journées restent privées dans votre compte.',
  google:'Continuer avec Google',or:'ou',email:'E-mail',password:'Mot de passe',signIn:'Se connecter',create:'Créer un compte',
  toCreate:'Nouveau ? Créez un compte',toSignIn:'Déjà un compte ? Connectez-vous',forgot:'Mot de passe oublié ?',
  signedAs:'Connecté en tant que',signOut:'Se déconnecter',del:'Supprimer le compte',delSure:'Touchez encore pour supprimer votre compte et toutes ses journées',
  delPw:'Saisissez votre mot de passe pour confirmer',delConfirm:'Supprimer mon compte',deleted:'Votre compte et ses journées ont été supprimés.',
  synced:'Toutes vos journées sont enregistrées dans votre compte.',syncing:'Enregistrement dans votre compte…',offline:'Hors ligne. Vos modifications seront synchronisées dès votre retour en ligne.',
  signOutNote:'La déconnexion retire vos journées de cet appareil. Elles restent en sécurité dans votre compte.',
  welcome:'Connecté. Vos journées sont maintenant enregistrées dans votre compte.',bye:'Déconnecté. Vos journées sont en sécurité dans votre compte.',
  reset:'Consultez vos e-mails : un lien pour réinitialiser votre mot de passe vous a été envoyé.',needEmail:'Saisissez d\'abord votre e-mail, puis touchez Mot de passe oublié.',
  promptT:'Protégez vos journées',promptP:'Créez un compte gratuit pour sauvegarder vos journées et utiliser Kept sur n\'importe quel appareil.',notNow:'Plus tard',
  e_cred:'E-mail ou mot de passe incorrect.',e_inuse:'Cet e-mail a déjà un compte. Connectez-vous.',e_weak:'Utilisez au moins 6 caractères pour le mot de passe.',
  e_email:'Saisissez une adresse e-mail valide.',e_cancel:'Connexion annulée.',e_net:'Pas de connexion. Réessayez une fois en ligne.',
  e_many:'Trop de tentatives. Attendez une minute et réessayez.',e_load:'Les comptes ne sont pas disponibles pour le moment. Vérifiez votre connexion.',e_other:'Un problème est survenu. Réessayez.'},
ru:{row:'Войти или создать аккаунт',rowSub:'Ваши дни в безопасности на всех устройствах',title:'Ваш аккаунт',
  pitch:'Войдите, чтобы сохранить свои дни и пользоваться Kept на всех устройствах. Ваши дни видны только вам.',
  google:'Продолжить с Google',or:'или',email:'Эл. почта',password:'Пароль',signIn:'Войти',create:'Создать аккаунт',
  toCreate:'Впервые здесь? Создайте аккаунт',toSignIn:'Уже есть аккаунт? Войдите',forgot:'Забыли пароль?',
  signedAs:'Вы вошли как',signOut:'Выйти',del:'Удалить аккаунт',delSure:'Нажмите ещё раз, чтобы удалить аккаунт и все дни',
  delPw:'Введите пароль для подтверждения',delConfirm:'Удалить мой аккаунт',deleted:'Ваш аккаунт и его дни удалены.',
  synced:'Все ваши дни сохранены в аккаунте.',syncing:'Сохраняем в аккаунт…',offline:'Нет сети. Изменения синхронизируются, когда появится связь.',
  signOutNote:'При выходе дни удаляются с этого устройства. В аккаунте они остаются в безопасности.',
  welcome:'Вы вошли. Теперь ваши дни сохраняются в аккаунте.',bye:'Вы вышли. Ваши дни в безопасности в аккаунте.',
  reset:'Проверьте почту: мы отправили ссылку для сброса пароля.',needEmail:'Сначала введите почту, затем нажмите «Забыли пароль?».',
  promptT:'Сохраните свои дни',promptP:'Создайте бесплатный аккаунт, чтобы сохранить дни и пользоваться Kept на любом устройстве.',notNow:'Не сейчас',
  e_cred:'Неверная почта или пароль.',e_inuse:'На эту почту уже есть аккаунт. Войдите.',e_weak:'Пароль должен быть не короче 6 символов.',
  e_email:'Введите правильный адрес почты.',e_cancel:'Вход отменён.',e_net:'Нет связи. Попробуйте, когда появится сеть.',
  e_many:'Слишком много попыток. Подождите минуту и попробуйте снова.',e_load:'Аккаунты сейчас недоступны. Проверьте подключение.',e_other:'Что-то пошло не так. Попробуйте ещё раз.'},
zh:{row:'登录或创建账户',rowSub:'在所有设备上安全保存你的记录',title:'你的账户',
  pitch:'登录后，你的记录会安全保存，并可在所有设备上使用 Kept。你的记录仅你本人可见。',
  google:'使用 Google 继续',or:'或',email:'邮箱',password:'密码',signIn:'登录',create:'创建账户',
  toCreate:'新用户？创建账户',toSignIn:'已有账户？登录',forgot:'忘记密码？',
  signedAs:'已登录：',signOut:'退出登录',del:'删除账户',delSure:'再点一次将删除你的账户及所有记录',
  delPw:'输入密码以确认',delConfirm:'删除我的账户',deleted:'你的账户及记录已删除。',
  synced:'你的所有记录都已保存到账户。',syncing:'正在保存到账户…',offline:'离线中。恢复联网后会自动同步。',
  signOutNote:'退出登录会从此设备移除你的记录，它们仍安全保存在你的账户中。',
  welcome:'已登录。你的记录现在会保存到账户。',bye:'已退出。你的记录安全保存在账户中。',
  reset:'请查收邮件，我们已发送重设密码的链接。',needEmail:'请先输入邮箱，再点“忘记密码？”。',
  promptT:'安全保存你的记录',promptP:'创建免费账户，备份你的记录，并在任何设备上使用 Kept。',notNow:'暂不',
  e_cred:'邮箱或密码不正确。',e_inuse:'该邮箱已有账户，请直接登录。',e_weak:'密码至少需要 6 个字符。',
  e_email:'请输入有效的邮箱地址。',e_cancel:'已取消登录。',e_net:'没有网络连接，请联网后重试。',
  e_many:'尝试次数过多，请稍等一分钟再试。',e_load:'账户功能暂时不可用，请检查网络连接。',e_other:'出了点问题，请重试。'},
vi:{row:'Đăng nhập hoặc tạo tài khoản',rowSub:'Giữ dữ liệu an toàn trên mọi thiết bị',title:'Tài khoản của bạn',
  pitch:'Đăng nhập để giữ dữ liệu an toàn và dùng Kept trên mọi thiết bị. Dữ liệu chỉ riêng tài khoản của bạn xem được.',
  google:'Tiếp tục với Google',or:'hoặc',email:'Email',password:'Mật khẩu',signIn:'Đăng nhập',create:'Tạo tài khoản',
  toCreate:'Mới dùng? Tạo tài khoản',toSignIn:'Đã có tài khoản? Đăng nhập',forgot:'Quên mật khẩu?',
  signedAs:'Đã đăng nhập:',signOut:'Đăng xuất',del:'Xóa tài khoản',delSure:'Chạm lần nữa để xóa tài khoản và mọi dữ liệu',
  delPw:'Nhập mật khẩu để xác nhận',delConfirm:'Xóa tài khoản của tôi',deleted:'Đã xóa tài khoản và dữ liệu của bạn.',
  synced:'Mọi dữ liệu đã được lưu vào tài khoản.',syncing:'Đang lưu vào tài khoản…',offline:'Đang ngoại tuyến. Thay đổi sẽ được đồng bộ khi có mạng.',
  signOutNote:'Đăng xuất sẽ xóa dữ liệu khỏi thiết bị này. Dữ liệu vẫn an toàn trong tài khoản.',
  welcome:'Đã đăng nhập. Dữ liệu giờ được lưu vào tài khoản.',bye:'Đã đăng xuất. Dữ liệu vẫn an toàn trong tài khoản.',
  reset:'Hãy kiểm tra email để nhận liên kết đặt lại mật khẩu.',needEmail:'Nhập email trước, rồi chạm Quên mật khẩu.',
  promptT:'Giữ dữ liệu an toàn',promptP:'Tạo tài khoản miễn phí để sao lưu dữ liệu và dùng Kept trên mọi thiết bị.',notNow:'Để sau',
  e_cred:'Email hoặc mật khẩu không đúng.',e_inuse:'Email này đã có tài khoản. Hãy đăng nhập.',e_weak:'Mật khẩu cần ít nhất 6 ký tự.',
  e_email:'Nhập địa chỉ email hợp lệ.',e_cancel:'Đã hủy đăng nhập.',e_net:'Không có mạng. Hãy thử lại khi có kết nối.',
  e_many:'Thử quá nhiều lần. Đợi một phút rồi thử lại.',e_load:'Tài khoản hiện không khả dụng. Hãy kiểm tra kết nối.',e_other:'Đã xảy ra lỗi. Hãy thử lại.'}
};
const lang=(typeof LANG!=='undefined'&&T[LANG])?LANG:'en';
const w=k=>T[lang][k]||T.en[k];
const errMsg=e=>{ const c=(e&&e.code)||'';
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return w('e_cred');
  if(/email-already-in-use/.test(c)) return w('e_inuse');
  if(/weak-password/.test(c)) return w('e_weak');
  if(/invalid-email|missing-email/.test(c)) return w('e_email');
  if(/popup-closed|cancelled-popup|user-cancelled/.test(c)) return w('e_cancel');
  if(/network/.test(c)) return w('e_net');
  if(/too-many/.test(c)) return w('e_many');
  return w('e_other'); };

/* ---------- Screens ---------- */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const css=document.createElement('style');
css.textContent=`
#acctRow{flex-wrap:wrap;row-gap:0}
#acctRow .t{display:flex;flex-direction:column;min-width:0;flex:1}
#acctRow .t b{font-weight:700;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acctRow .t small{color:var(--muted);font-size:.85rem;font-weight:500}
#acctRow svg{color:var(--accent)!important}
.acct{display:flex;flex-direction:column;gap:14px}
.acct p{margin:0}
.acct .pitch{color:var(--muted)}
.acct .g{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;border:1.5px solid var(--line);background:var(--surface);border-radius:16px;padding:14px;font-weight:600;font-size:1rem;color:var(--fg)}
.acct .g svg{width:20px;height:20px}
.acct .or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.85rem}
.acct .or::before,.acct .or::after{content:"";flex:1;border-top:1px solid var(--line)}
.acct .fld{box-shadow:none;background:var(--surface-2)}
.acct .links{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.acct .links button{border:0;background:none;padding:4px 0;color:var(--accent);font-weight:600;font-size:.92rem}
.acct .who{font-weight:700;word-break:break-all}
.acct .sync{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.92rem}
.acct .note{font-size:.85rem;color:var(--muted)}
.acct .danger{border:1.5px solid color-mix(in srgb,var(--bad) 40%,var(--line));background:none;color:var(--bad);border-radius:16px;padding:14px;font-weight:600;width:100%}
.acct .msg{text-align:left}
.acct-prompt{display:flex;gap:14px;align-items:flex-start}
.acct-prompt .acts{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
.acct-prompt .acts button{border:0;border-radius:12px;padding:9px 14px;font-weight:600;font-size:.9rem}
.acct-prompt .acts .go{background:var(--accent);color:var(--accent-fg)}
.acct-prompt .acts .later{background:none;color:var(--chip-fg)}
@media print{#acctSec,#acctPrompt{display:none!important}}`;
document.head.appendChild(css);

const G_ICON='<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 010-4.3V7H2.1a11 11 0 000 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 002.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';
const USER_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';

// More page: account row at the top
const more=$('vMore'), rowList=document.createElement('div'); rowList.className='list';
rowList.innerHTML=`<button type="button" id="acctRow">${USER_ICON}<span class="t"><b id="acctRowT"></b><small id="acctRowS"></small></span></button>`;
more.insertBefore(rowList,more.querySelector('.top').nextSibling);
// Account page
const sec=document.createElement('section'); sec.className='view'; sec.id='acctSec'; sec.hidden=true;
($('shell')||document.body).appendChild(sec);
if(typeof VIEWS!=='undefined'){ VIEWS.acct='acctSec'; NAVOF.acct='more'; }
const open=()=>{ draw(); if(window.keptGo) window.keptGo('acct'); };
$('acctRow').onclick=open;
const prof=document.querySelector('#vHome .top .icon-btn'); if(prof){ prof.removeAttribute('data-go'); prof.onclick=open; prof.setAttribute('aria-label',w('title')); }
// Home: gentle prompt once a driver has days but no account
const prompt=document.createElement('div'); prompt.className='insight acct-prompt'; prompt.id='acctPrompt'; prompt.hidden=true;
prompt.innerHTML=`${USER_ICON}<div><b>${esc(w('promptT'))}</b><p>${esc(w('promptP'))}</p><div class="acts"><button type="button" class="go">${esc(w('create'))}</button><button type="button" class="later">${esc(w('notNow'))}</button></div></div>`;
const home=$('vHome'); home.insertBefore(prompt,$('hero'));
prompt.querySelector('.go').onclick=()=>{ mode='create'; open(); };
prompt.querySelector('.later').onclick=()=>{ try{ localStorage.setItem(KEY+'-acctLater',String(Date.now())); }catch(e){} prompt.hidden=true; };
function updatePrompt(){
  let later=0; try{ later=Number(localStorage.getItem(KEY+'-acctLater')||0); }catch(e){}
  prompt.hidden=!!user||!ready||!data.shifts.length||Date.now()-later<14*864e5;   // ask again after two weeks
}

let mode='signin', user=null, ready=false, status='synced', delArmed=false, busy=false;
function draw(){
  if(!user){
    sec.innerHTML=`<div class="page-top"><button type="button" class="back" id="acctBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1>${esc(w('title'))}</h1><span></span></div>
      <div class="card acct">
        <p class="pitch">${esc(w('pitch'))}</p>
        <button type="button" class="g" id="acctGoogle">${G_ICON}<span>${esc(w('google'))}</span></button>
        <div class="or">${esc(w('or'))}</div>
        <form id="acctForm" class="acct" novalidate>
          <div class="fld"><div class="in"><label for="acctEmail">${esc(w('email'))}</label><input id="acctEmail" type="email" autocomplete="email" inputmode="email" required></div></div>
          <div class="fld"><div class="in"><label for="acctPw">${esc(w('password'))}</label><input id="acctPw" type="password" autocomplete="${mode==='create'?'new-password':'current-password'}" required minlength="6"></div></div>
          <button type="submit" class="btn-primary" id="acctSubmit">${esc(w(mode==='create'?'create':'signIn'))}</button>
        </form>
        <div class="links"><button type="button" id="acctMode">${esc(w(mode==='create'?'toSignIn':'toCreate'))}</button>${mode==='signin'?`<button type="button" id="acctForgot">${esc(w('forgot'))}</button>`:''}</div>
        <p class="msg" id="acctMsg" role="status"></p>
      </div>`;
    $('acctGoogle').onclick=googleSignIn;
    $('acctMode').onclick=()=>{ mode=mode==='create'?'signin':'create'; const em=$('acctEmail').value; draw(); $('acctEmail').value=em; };
    if($('acctForgot')) $('acctForgot').onclick=forgot;
    $('acctForm').onsubmit=e=>{ e.preventDefault(); emailAuth(); };
  }else{
    const pwUser=(user.providerData||[]).some(p=>p.providerId==='password');
    sec.innerHTML=`<div class="page-top"><button type="button" class="back" id="acctBack" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1>${esc(w('title'))}</h1><span></span></div>
      <div class="card acct">
        <div><p class="note">${esc(w('signedAs'))}</p><p class="who">${esc(user.email||'')}</p></div>
        <p class="sync"><span class="dot ${status==='synced'?'':status==='offline'?'off':'warn'}"></span><span>${esc(w(status))}</span></p>
        <button type="button" class="btn-ghost" id="acctOut">${esc(w('signOut'))}</button>
        <p class="note">${esc(w('signOutNote'))}</p>
      </div>
      <div class="card acct">
        ${delArmed&&pwUser?`<div class="fld"><div class="in"><label for="acctDelPw">${esc(w('delPw'))}</label><input id="acctDelPw" type="password" autocomplete="current-password"></div></div>`:''}
        <button type="button" class="danger" id="acctDel">${esc(w(delArmed?(pwUser?'delConfirm':'delSure'):'del'))}</button>
        <p class="msg" id="acctMsg" role="status"></p>
      </div>`;
    $('acctOut').onclick=signOutNow;
    $('acctDel').onclick=deleteNow;
  }
  $('acctBack').onclick=()=>{ delArmed=false; window.keptGo&&window.keptGo('more'); };
}
const say=(t,err)=>{ const m=$('acctMsg'); if(m){ m.textContent=t||''; m.className='msg'+(err?' err':''); } };
function drawRow(){
  $('acctRowT').textContent=user?(user.email||w('title')):w('row');
  $('acctRowS').textContent=user?w(status):w('rowSub');
}

/* ---------- Firebase ---------- */
let A,F,auth,db;
const load=Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')]).then(([app,a,f])=>{
  A=a; F=f;
  const fb=app.initializeApp(cfg);
  auth=a.getAuth(fb);
  try{ db=f.initializeFirestore(fb,{localCache:f.persistentLocalCache({tabManager:f.persistentMultipleTabManager()})}); }
  catch(e){ db=f.getFirestore(fb); }
  if(window.KEPT_FIREBASE_EMULATOR){ a.connectAuthEmulator&&a.connectAuthEmulator(auth,'http://127.0.0.1:9099'); f.connectFirestoreEmulator&&f.connectFirestoreEmulator(db,'127.0.0.1',8080); }
  a.getRedirectResult(auth).catch(e=>{ setTimeout(()=>say(errMsg(e),true),0); });
  a.onAuthStateChanged(auth,u=>{ ready=true; onUser(u); });
});
load.catch(()=>{ drawRow(); });
async function need(){ try{ await load; return true; }catch(e){ say(w('e_load'),true); return false; } }

async function googleSignIn(){
  if(busy||!await need()) return; busy=true; say('');
  const p=new A.GoogleAuthProvider();
  const standalone=matchMedia('(display-mode: standalone)').matches;
  try{
    if(standalone&&cfg.authDomain===location.hostname) await A.signInWithRedirect(auth,p);
    else await A.signInWithPopup(auth,p);
  }catch(e){
    if(/popup-blocked|operation-not-supported/.test(e.code||'')){ try{ await A.signInWithRedirect(auth,p); }catch(e2){ say(errMsg(e2),true); } }
    else say(errMsg(e),true);
  }finally{ busy=false; }
}
async function emailAuth(){
  if(busy||!await need()) return;
  const em=$('acctEmail').value.trim(), pw=$('acctPw').value;
  if(!/^\S+@\S+\.\S+$/.test(em)){ say(w('e_email'),true); return; }
  if(pw.length<6){ say(mode==='create'?w('e_weak'):w('e_cred'),true); return; }
  busy=true; $('acctSubmit').disabled=true; say('');
  try{ if(mode==='create') await A.createUserWithEmailAndPassword(auth,em,pw); else await A.signInWithEmailAndPassword(auth,em,pw); }
  catch(e){ say(errMsg(e),true); }
  finally{ busy=false; const b=$('acctSubmit'); if(b) b.disabled=false; }
}
async function forgot(){
  const em=$('acctEmail').value.trim();
  if(!/^\S+@\S+\.\S+$/.test(em)){ say(w('needEmail'),true); return; }
  if(!await need()) return;
  try{ await A.sendPasswordResetEmail(auth,em); say(w('reset')); }
  catch(e){ if(/user-not-found/.test(e.code||'')) say(w('reset')); else say(errMsg(e),true); }   // same answer either way, so accounts can't be probed
}

/* ---------- Sync ---------- */
// Local days stay in localStorage (works offline, instantly). When signed in, every change is mirrored to
// users/{uid}/days and changes from other devices come back through a live listener.
let unsub=null, synced=new Map(), applying=false;
// Pro status (written only by the Pro server) and trial start (set once, by the server clock) for the signed-in driver.
let metaUnsub=[], acctPro=null, trialStart=null;
const acctState=()=>({user:user?{uid:user.uid,email:user.email}:null,pro:acctPro,trialStart});
const emit=()=>window.dispatchEvent(new CustomEvent('kept-account',{detail:acctState()}));
window.keptAccount={state:acctState,idToken:()=>auth&&auth.currentUser?auth.currentUser.getIdToken():Promise.reject(new Error('signed out'))};
function stopMeta(){ metaUnsub.forEach(f=>f()); metaUnsub=[]; acctPro=null; trialStart=null; }
async function watchMeta(u){
  const proRef=F.doc(db,'users',u.uid,'meta','pro'), trialRef=F.doc(db,'users',u.uid,'meta','trial');
  metaUnsub.push(F.onSnapshot(proRef,d=>{ const x=d.exists()?d.data():null; acctPro=x?{active:!!x.active,sku:x.sku||'',expires:x.expires==null?null:Number(x.expires)}:null; emit(); },()=>{}));
  if(window.keptProEnabled) try{ const t=await F.getDoc(trialRef); if(!t.exists()) await F.setDoc(trialRef,{start:F.serverTimestamp()}); }catch(e){ console.warn('trial',e); }
  metaUnsub.push(F.onSnapshot(trialRef,d=>{ const v=d.exists()&&d.data().start; trialStart=v&&v.toMillis?v.toMillis():null; if(trialStart) emit(); },()=>{}));
}
const OWNER=KEY+'-owner';
const strip=s=>{ const o={...s}; delete o.u; return JSON.stringify(o,Object.keys(o).sort()); };
const daysCol=()=>F.collection(db,'users',user.uid,'days');
const origSave=save;
save=function(){ origSave.apply(this,arguments); if(user&&!applying) push(); };
async function push(){
  const now=Date.now(), seen=new Set(), ops=[];
  for(const s of data.shifts){
    seen.add(s.id); const j=strip(s);
    if(synced.get(s.id)!==j){ s.u=now; ops.push(['set',s]); synced.set(s.id,j); }
  }
  for(const id of [...synced.keys()]) if(!seen.has(id)){ ops.push(['del',id]); synced.delete(id); }
  if(!ops.length) return;
  origSave();   // keep the new timestamps locally too
  await writeOps(ops);
}
async function writeOps(ops){
  for(let i=0;i<ops.length;i+=400){
    const b=F.writeBatch(db);
    for(const [op,x] of ops.slice(i,i+400)){
      if(op==='set') b.set(F.doc(db,'users',user.uid,'days',x.id),JSON.parse(JSON.stringify(x)));
      else b.delete(F.doc(db,'users',user.uid,'days',x));
    }
    b.commit().catch(e=>{ console.warn('sync',e); setStatus('offline'); });   // the SDK keeps queued writes and retries when back online
  }
}
async function onUser(u){
  const prev=user; user=u; delArmed=false;
  if(unsub){ unsub(); unsub=null; }
  stopMeta();
  if(!u){ synced.clear(); drawRow(); updatePrompt(); if(cur()==='acct') draw(); emit(); return; }
  emit(); watchMeta(u);
  // First sign-in on this device: merge days saved before the account with the ones already in it.
  let owner=''; try{ owner=localStorage.getItem(OWNER)||''; }catch(e){}
  const mine=!owner||owner===u.uid;
  try{
    const snap=await F.getDocs(daysCol()), cloud=new Map(snap.docs.map(d=>[d.id,d.data()]));
    const merged=new Map(cloud), up=[];
    if(mine) for(const l of data.shifts){ const c=cloud.get(l.id); if(!c||(l.u||0)>(c.u||0)){ const x={...l,u:l.u||Date.now()}; merged.set(l.id,x); up.push(['set',x]); } }
    applyCloud([...merged.values()]);
    if(up.length) await writeOps(up);
  }catch(e){ console.warn('first sync',e); }
  try{ localStorage.setItem(OWNER,u.uid); }catch(e){}
  unsub=F.onSnapshot(daysCol(),{includeMetadataChanges:true},snap=>{
    setStatus(snap.metadata.hasPendingWrites?'syncing':snap.metadata.fromCache?'offline':'synced');
    if(!snap.metadata.hasPendingWrites) applyCloud(snap.docs.map(d=>d.data()));
  },e=>{ console.warn('listen',e); setStatus('offline'); });
  drawRow(); updatePrompt();
  if(cur()==='acct'){ draw(); }
  if(!prev&&ready&&cur()==='acct'&&typeof toast==='function') toast(w('welcome'));
}
function applyCloud(list){
  const next=JSON.stringify(list.map(strip).sort()), now=JSON.stringify(data.shifts.map(strip).sort());
  synced=new Map(list.map(s=>[s.id,strip(s)]));
  if(next===now) return;
  applying=true; try{ data.shifts=list; origSave(); render(); } finally{ applying=false; }
}
function setStatus(s){ if(s===status) return; status=s; drawRow(); if(cur()==='acct'&&user) { const el=sec.querySelector('.sync'); if(el) el.innerHTML=`<span class="dot ${s==='synced'?'':s==='offline'?'off':'warn'}"></span><span>${esc(w(s))}</span>`; } }
const cur=()=>{ const el=sec; return el&&!el.hidden?'acct':''; };

function clearDevice(){
  data.shifts=[]; applying=true; try{ origSave(); render(); } finally{ applying=false; }
  try{ localStorage.removeItem(OWNER); }catch(e){}
}
async function signOutNow(){
  if(!await need()) return;
  try{ if(unsub){ unsub(); unsub=null; } await A.signOut(auth); clearDevice(); window.keptGo&&window.keptGo('home'); typeof toast==='function'&&toast(w('bye')); }
  catch(e){ say(errMsg(e),true); }
}
async function deleteNow(){
  if(!delArmed){ delArmed=true; draw(); return; }
  if(!await need()||busy) return; busy=true;
  const u=auth.currentUser, pwUser=(u.providerData||[]).some(p=>p.providerId==='password');
  try{
    if(pwUser){ const pw=($('acctDelPw')||{}).value||''; await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,pw)); }
    else await A.reauthenticateWithPopup(u,new A.GoogleAuthProvider());
    if(unsub){ unsub(); unsub=null; }
    stopMeta();
    // Pro status, trial and linked purchases are server-only records: ask the Pro server to remove them too.
    if(window.keptWorkerUrl){ try{ await fetch(window.keptWorkerUrl.replace(/\/$/,'')+'/account/delete',{method:'POST',headers:{Authorization:'Bearer '+await u.getIdToken()}}); }catch(e){} }
    const snap=await F.getDocs(daysCol());
    for(let i=0;i<snap.docs.length;i+=400){ const b=F.writeBatch(db); snap.docs.slice(i,i+400).forEach(d=>b.delete(d.ref)); await b.commit(); }
    await A.deleteUser(u);
    clearDevice(); delArmed=false; window.keptGo&&window.keptGo('home'); typeof toast==='function'&&toast(w('deleted'));
  }catch(e){ say(errMsg(e),true); }
  finally{ busy=false; }
}

/* keep the Home prompt current as days are added */
const origRender=render;
render=function(){ origRender.apply(this,arguments); updatePrompt(); };
drawRow(); updatePrompt();
})();
