// Sample data + native mocks shared by screenshot and video capture
module.exports=function seed(o){
  const P='shift-ledger-v1';
  localStorage.setItem(P+'-welcomed','1'); localStorage.setItem(P+'-toured','1'); localStorage.setItem(P+'-new-car','1');
  const shifts=[]; const d0=new Date(); d0.setHours(0,0,0,0);
  let r=7; const rnd=()=>{ r=(r*9301+49297)%233280; return r/233280; };
  const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  for(let i=1;i<=75;i++){ const d=new Date(d0); d.setDate(d.getDate()-i); if(d.getDay()===2) continue;
    const lh=+(2+rnd()*3).toFixed(1), uh=+(2+rnd()*3).toFixed(1);
    const le=+(lh*(19+rnd()*6)).toFixed(2), ue=+(uh*(21+rnd()*7)).toFixed(2);
    shifts.push({id:'s'+i,date:iso(d),le,ue,lt:+(rnd()*18).toFixed(2),ut:+(rnd()*22).toFixed(2),lh,uh,lr:Math.round(lh*2.1),ur:Math.round(uh*2.3),
      gas:+(18+rnd()*22).toFixed(2),miles:Math.round((lh+uh)*21),bonus:i%6===0?25:0,tolls:i%5===0?4.5:0,maint:i===9?64.5:i===23?89.99:i===41?42:i===60?120:0});
  }
  if(!o.noToday) shifts.push({id:'s0',date:iso(d0),le:96.4,ue:112.75,lt:14,ut:19.5,lh:3.6,uh:4.1,lr:8,ur:10,gas:31.2,miles:o.todayMiles??162,bonus:0});
  localStorage.setItem(P,JSON.stringify({shifts}));
  localStorage.setItem(P+'-prefs',JSON.stringify(Object.assign({car:{name:'2021 Toyota Camry',price:26500,odoStart:12000,resale:9500,odoEnd:180000}},o.dark?{mode:'dark'}:{mode:'light'})));
  const M=window.__M={active:!!o.active,start:Date.now()-2*3600e3-14*6e4,fixed:o.active?48.6:null,rate:o.rate||0,done:null};
  const miles=()=>M.fixed!=null?M.fixed:(Date.now()-M.start)/1000*M.rate;
  const K=new Proxy({},{get:(_,k)=>async()=>{
    if(k==='mileageStatus') return {active:M.active,start:M.start,miles:M.active?miles():0,permission:'granted'};
    if(k==='mileageStart'){ M.active=true; M.start=Date.now(); M.fixed=null; return {active:true}; }
    if(k==='mileageStop'){ M.done={start:M.start,end:Date.now(),miles:miles()}; M.active=false; return {}; }
    if(k==='mileageTake'){ const d=M.done?[M.done]:[]; M.done=null; return {drives:d}; }
    if(k==='biometricAvailable') return {available:false};
    return {}; }});
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{KeptNative:K,App:{addListener(){},exitApp(){},getInfo:async()=>({version:'2.0.0',build:'12'})},SplashScreen:K,SystemBars:K}};
};
