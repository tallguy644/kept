const {chromium}=require('playwright'); const seed=require('./seed.js');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:720,height:1440},deviceScaleFactor:1,timezoneId:'America/Phoenix'});
const p=await ctx.newPage(); const fs=require('fs'); fs.rmSync(__dirname+'/frames',{recursive:true,force:true}); fs.mkdirSync(__dirname+'/frames');
const cdp=await ctx.newCDPSession(p); const frames=[]; let n=0;
cdp.on('Page.screencastFrame',async f=>{ const name='f'+String(n++).padStart(5,'0')+'.jpg'; fs.writeFileSync(__dirname+'/frames/'+name,Buffer.from(f.data,'base64')); frames.push([name,f.metadata.timestamp]); try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});}catch(e){} });
let T0=0; const marks={};
const mark=k=>marks[k]=Date.now()/1000;
await p.addInitScript(seed,{rate:0.55,todayMiles:0}); await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='html{zoom:2}.tile{padding:14px 12px;gap:10px}.tile svg{width:22px;height:22px}.tile b{font-size:18px}';document.head.appendChild(s);});});
await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500); await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:720,maxHeight:1440}); await p.waitForTimeout(300);
const tick=()=>p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
const smooth=async(sel,off,ms)=>p.evaluate(([sel,off,ms])=>new Promise(r=>{const s=scrollY; if(sel){document.querySelector(sel).scrollIntoView({block:'start'}); scrollBy(0,-off);} else scrollBy(0,off); const y=scrollY; scrollTo(0,s); const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;scrollTo(0,s+(y-s)*e);k<1?requestAnimationFrame(f):r();})(t0);}),[sel,off,ms]);
mark('A'); await p.waitForTimeout(1200);
await p.click('#milesBtn'); 
for(let i=0;i<24;i++){ await p.waitForTimeout(250); await tick(); }
mark('B'); await p.click('#milesBtn'); await p.waitForTimeout(2600);
mark('C'); await smooth('#hero',24,1200); await p.waitForTimeout(1800);
mark('D'); await p.evaluate(()=>{scrollTo(0,0); keptGo('insights'); insMonth='2026-10'; renderIns();}); await p.waitForTimeout(1600);
await smooth('#insOverview .cpm',28,1500); await p.waitForTimeout(1800);
mark('E'); await p.evaluate(()=>{scrollTo(0,0); keptGo('log');}); await p.waitForTimeout(700);
for(const [s,v] of [['#le','96.40'],['#lt','14'],['#lr','8'],['#lh','3.6']]){ await p.click(s); await p.type(s,v,{delay:110}); }
await p.waitForTimeout(1000);
mark('F'); await p.evaluate(()=>{scrollTo(0,0); keptGo('days');}); await p.waitForTimeout(1200); await smooth(null,900,1600); await p.waitForTimeout(900);
mark('G'); await p.evaluate(()=>{keptGo('more'); const h=document.getElementById('modeH'); h.scrollIntoView({block:'start'}); scrollBy(0,-48);}); await p.waitForTimeout(1100);
await p.evaluate(()=>document.querySelector('#modeSeg button[data-mode="dark"]').click()); await p.waitForTimeout(800);
await p.evaluate(()=>{keptGo('home'); scrollTo(0,0);}); await p.waitForTimeout(2000);
mark('END');
await cdp.send('Page.stopScreencast'); await ctx.close(); fs.writeFileSync(__dirname+'/rec/marks.json',JSON.stringify({marks,frames})); console.log(frames.length, frames[0], marks);
await b.close();})();
