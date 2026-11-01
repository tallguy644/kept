/* Kept Windows app bridge: only active inside the Microsoft Store app for Windows (Tauri, see windows/).
   The app's own window shows keptforgigworkers.com; a few things go to Windows instead:
   - Microsoft Store purchases for Kept Pro (pro.js uses window.keptWindows.billing, like the Android app's Play Billing)
   - links that leave Kept (store pages, email, other sites) open in the default browser or mail app. */
(function(){
'use strict';
const TA=window.__TAURI__;
if(!TA||!TA.core||typeof TA.core.invoke!=='function'){ window.keptWindows=null; return; }
const inv=TA.core.invoke;
document.documentElement.classList.add('kept-windows');

window.keptWindows={
  billing:{
    // [{id, price, storeId}] for the add-ons the Store knows (id = the product ID set in Partner Center, e.g. kept_pro_monthly)
    async products(subs,inapp){ return await inv('store_products',{ids:[...(subs||[]),...(inapp||[])]}); },
    async buy(id){
      const r=await inv('store_buy',{id});
      if(r==='cancelled'){ const e=new Error('cancelled'); e.name='NotAllowedError'; throw e; }
      if(r!=='purchased'&&r!=='owned') throw new Error(r||'failed');
      return {owned:true,token:null};
    },
    async purchases(){ return await inv('store_purchases'); }   // [{id, token}] active add-ons
  },
  open:url=>inv('open_external',{url})
};

// Keep sign-in (Google, Firebase) inside the app; everything else that leaves Kept opens outside it.
const STAY=/^https:\/\/(accounts\.google\.com|[a-z0-9-]+\.firebaseapp\.com|kept-b85c0\.web\.app|(www\.)?keptforgigworkers\.com)\//i;
const outside=u=>/^(mailto:|ms-windows-store:)/i.test(u)||(/^https?:/i.test(u)&&!STAY.test(u));
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href]'); if(!a) return;
  const u=a.href;
  if(outside(u)||(a.target==='_blank'&&/^https:/i.test(u)&&!/__\/auth\//.test(u))){ e.preventDefault(); e.stopPropagation(); inv('open_external',{url:u}).catch(()=>{}); }
},true);
const open0=window.open;
window.open=function(u,...rest){
  const url=u?new URL(String(u),location.href).href:'';
  if(url&&outside(url)){ inv('open_external',{url}).catch(()=>{}); return null; }
  return open0.call(window,u,...rest);
};
})();
