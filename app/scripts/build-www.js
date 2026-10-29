// Copies Kept's web app (repo root) into app/www, which Capacitor packages inside the Android app.
const fs=require('fs'), path=require('path');
const root=path.resolve(__dirname,'..','..'), out=path.resolve(__dirname,'..','www');
const FILES=['index.html','privacy.html','manifest.webmanifest','native.js','pro.js','account.js','lock.js','moved.js','sync.js','car.js','offer.js'];
const DIRS=['icons'];
fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
for(const f of FILES) fs.copyFileSync(path.join(root,f),path.join(out,f));
for(const d of DIRS) fs.cpSync(path.join(root,d),path.join(out,d),{recursive:true});
console.log('www ready:',fs.readdirSync(out).join(', '));
