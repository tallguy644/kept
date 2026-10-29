/* Kept native bridge: only active inside the Google Play app (Capacitor). On the website it does nothing.
   Inside the app, Kept's own files run from the phone, and a few things the browser normally does are handed
   to Android instead: Google sign-in, saving/sharing backup files, printing, fingerprint/face unlock,
   the back button and the status bar colours. */
(function(){
'use strict';
const C=window.Capacitor;
if(!(C&&typeof C.isNativePlatform==='function'&&C.isNativePlatform())){ window.keptNative=null; return; }
document.documentElement.classList.add('kept-native');
const plug=n=>(C.Plugins&&C.Plugins[n])||(typeof C.registerPlugin==='function'?C.registerPlugin(n):null);
const K=plug('KeptNative'), App=plug('App'), Splash=plug('SplashScreen'), Bars=plug('SystemBars');
// Web client ID of the Firebase project (kept-b85c0). Public by design; Android checks the app's signing key.
const WEB_CLIENT_ID='957643145067-qvoj60s3qrjdtmi41qacjs7rsoefko8l.apps.googleusercontent.com';

const errOf=e=>{ const x=new Error((e&&e.message)||'failed'); x.name=(e&&(e.code==='cancelled'||/cancel/i.test(e.message||'')))?'NotAllowedError':'Error'; return x; };
window.keptNative={
  async share(name,text,type){ await K.shareFile({name,type,text}); return 'shared'; },
  print(title){ return K.printPage({title:title||'Kept'}); },
  async bioAvailable(){ try{ return !!(await K.biometricAvailable()).available; }catch(e){ return false; } },
  async bio(title,reason){ try{ await K.biometric({title,reason}); }catch(e){ throw errOf(e); } },
  // Kept Offer Check (companion app): open it with a one-time link code, or its Google Play page if it isn't installed
  async openOfferCheck(code){ try{ return (await K.openOfferCheck({code})).opened; }catch(e){ return 'failed'; } },
  async googleIdToken(){ try{ return (await K.googleSignIn({webClientId:WEB_CLIENT_ID})).idToken; }catch(e){ throw errOf(e); } },
  // Google Play Billing (Kept Pro / Pro+), used by pro.js
  billing:{
    async products(subs,inapp){ return (await K.billingProducts({subs,inapp})).products||[]; },
    async buy(id,type){ try{ return await K.billingBuy({id,type}); }catch(e){ throw errOf(e); } },
    async purchases(){ return (await K.billingPurchases()).purchases||[]; }
  }
};

// Android back button: step back inside Kept, and only leave the app from the Home screen.
if(App) App.addListener('backButton',()=>{
  const offer=document.getElementById('lockOffer'); if(offer){ offer.remove(); return; }
  if(document.getElementById('lockScreen')){ App.minimizeApp&&App.minimizeApp(); return; }
  const v=typeof cur!=='undefined'?cur:'home';
  if(v==='home'||v==='welcome'){ App.exitApp(); return; }
  if(v==='car'&&typeof window.keptCarBack==='function'){ window.keptCarBack(); return; }
  if(v==='offer'&&typeof window.keptOfferBack==='function'){ window.keptOfferBack(); return; }
  if((v==='log'||v==='pro'||v==='cust')&&typeof window.keptBack==='function'){ window.keptBack(); return; }
  if(typeof window.keptGo==='function') window.keptGo('home');
});

// Status bar icons follow Kept's own light/dark appearance (which can differ from the phone's).
function bars(){ try{ const dark=typeof isDark==='function'?isDark():matchMedia('(prefers-color-scheme: dark)').matches; Bars&&Bars.setStyle({style:dark?'DARK':'LIGHT'}); }catch(e){} }
new MutationObserver(bars).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',bars);
addEventListener('DOMContentLoaded',bars);
addEventListener('load',()=>{ bars(); try{ Splash&&Splash.hide(); }catch(e){} });
})();
