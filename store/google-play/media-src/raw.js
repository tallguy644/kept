const {chromium}=require('playwright'); const seed=require('./seed.js');
const OUT=__dirname+'/raw/';
(async()=>{const b=await chromium.launch();
async function shot(name,opt,fn){
  const ctx=await b.newContext({viewport:{width:360,height:720},deviceScaleFactor:3,timezoneId:'America/Phoenix'}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(seed,opt); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  await fn(p); await p.waitForTimeout(600);
  await p.screenshot({path:OUT+name+'.png'}); await ctx.close(); if(errs.length) console.log(name,errs);
}
const month=async p=>{ await p.evaluate(()=>{ keptGo('insights'); insMonth='2026-10'; renderIns(); }); await p.waitForTimeout(500); };
const hero=async p=>{ await p.evaluate(()=>{ document.getElementById('hero').scrollIntoView({block:'start'}); window.scrollBy(0,-12); }); };
await shot('1-miles',{active:true},async p=>{});
await shot('2-home',{},hero);
await shot('3-insights',{},month);
await shot('4-cpm',{},async p=>{ await month(p); await p.evaluate(()=>{ const c=document.querySelector('#insOverview .cpm'); if(c) c.scrollIntoView({block:'start'}); window.scrollBy(0,-14); }); });
await shot('5-log',{},async p=>{ await p.evaluate(()=>keptGo('log')); await p.waitForTimeout(300); await p.fill('#le','96.40'); await p.fill('#lt','14'); await p.fill('#lr','8'); await p.fill('#lh','3.6'); });
await shot('6-days',{},async p=>{ await p.evaluate(()=>keptGo('days')); });
await shot('7-dark',{dark:true},async p=>{});
await shot('8-more',{},async p=>{ await p.evaluate(()=>{ keptGo('more'); document.getElementById('modeH').scrollIntoView({block:'start'}); window.scrollBy(0,-56); }); });
await b.close(); console.log('done');})();
