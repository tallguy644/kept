const {chromium}=require('playwright'); const seed=require('./seed.js');
(async()=>{const b=await chromium.launch();
async function shot(name,opt,fn){
  const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5,timezoneId:'America/Phoenix',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0'});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(seed,opt); await p.addInitScript(()=>{ delete window.Capacitor; window.__TAURI__={core:{invoke:async()=>null}}; });
  await p.goto('http://localhost:8765/index.html?app=windows'); await p.waitForTimeout(1600);
  await fn(p); await p.waitForTimeout(700); await p.screenshot({path:__dirname+'/win/'+name+'.png'}); await ctx.close(); if(errs.length) console.log(name,errs);
}
await shot('1-home',{},async p=>{});
await shot('2-insights',{},async p=>{ await p.evaluate(()=>{ keptGo('insights'); insMonth='2026-10'; renderIns(); }); });
await shot('3-days',{},async p=>{ await p.evaluate(()=>keptGo('days')); });
await shot('4-log',{},async p=>{ await p.evaluate(()=>keptGo('log')); await p.waitForTimeout(300); await p.fill('#le','96.40'); await p.fill('#lt','14'); await p.fill('#lr','8'); await p.fill('#lh','3.6'); });
await shot('5-dark',{dark:true},async p=>{});
await b.close(); console.log('done');})();
