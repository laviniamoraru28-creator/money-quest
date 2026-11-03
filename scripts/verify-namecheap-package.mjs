import {mkdtempSync,rmSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// CI-only integration rehearsal. This starts the extracted production server,
// not a source checkout, and never enables commerce or contacts Stripe/SMTP.
const archive=path.resolve(process.argv[2]??'moneyquest-namecheap-candidate.zip');
const folder=mkdtempSync(path.join(tmpdir(),'moneyquest-rehearsal-'));
let server;
function run(command,args,options={}){
 const r=spawnSync(command,args,{cwd:folder,encoding:'utf8',timeout:180000,...options});
 if(r.error||r.status!==0)throw new Error(`${command} failed: ${r.error?.message??r.stderr??r.stdout}`);
 return r;
}
try{
 run('unzip',['-q',archive,'-d',folder]);
 const status=JSON.parse(readFileSync(path.join(folder,'RELEASE-STATUS.json'),'utf8'));
 for(const file of status.files){
  const full=path.join(folder,file.path);
  assert.equal(statSync(full).size,file.bytes,file.path);
  assert.equal(createHash('sha256').update(readFileSync(full)).digest('hex'),file.sha256,file.path);
 }
 assert.ok(status.files.some(file=>file.path==='host-env.cjs'));
 assert.ok(!status.files.some(file=>/node_modules|\.next\/cache|\.env|private-assets|commerce\.env/.test(file.path)));
 run('npm',['ci','--omit=dev','--no-fund','--no-audit']);
 const config={...process.env,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:'3219',MONEYQUEST_COMMERCE_MODE:'off',MONEYQUEST_HOST_ENV_FILE:''};
 for(const command of ['shop:check','shop:deliver']){
  const r=spawnSync('npm',['run',command],{cwd:folder,env:config,encoding:'utf8',timeout:30000});
  assert.equal(r.status,1,`${command} must refuse missing merchant configuration`);
  assert.doesNotMatch(r.stderr??'',/ERR_MODULE_NOT_FOUND|Cannot find module|TransformError/);
 }
 server=spawn(process.execPath,['server.js'],{cwd:folder,env:config,stdio:'ignore'});
 const origin='http://127.0.0.1:3219';
 let healthy=false;
 for(let attempt=0;attempt<60;attempt++){
  if(server.exitCode!==null)throw new Error('Extracted server stopped before becoming healthy');
  try{healthy=(await fetch(origin+'/api/health')).ok;}catch{}
  if(healthy)break;
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 assert.ok(healthy,'Extracted production server health');
 const routes=['/en','/en/library','/en/museum','/en/mind-lab','/en/brain-lab','/en/parents/shop','/en/privacy','/sitemap.xml','/robots.txt','/offline-manifest.json','/resources/samples/free-family-sample-en.pdf','/resources/samples/free-journal-week-one-en.pdf'];
 for(const locale of ['ro','fr','de','es','it','pt','nl','pl']) routes.push(`/${locale}`,`/${locale}/library`,`/${locale}/brain-lab`,`/resources/samples/free-family-sample-${locale}.pdf`,`/worksheets/${locale}/money-quest-worksheets-answer-key.pdf`);
 for(const route of routes)assert.equal((await fetch(origin+route)).status,200,route);
 for(const band of ['explorer','builder','strategist'])assert.equal((await fetch(origin+`/certificates/${band}-background.jpg`)).status,200);
 for(const font of ['DejaVuSerif.ttf','DejaVuSans.ttf','Allura-Regular.ttf'])assert.equal((await fetch(origin+`/certificates/fonts/${font}`)).status,200);
 assert.equal((await fetch(origin+'/ro/academy-certificate?level=explorer')).status,200);
 const checkout=await fetch(origin+'/api/shop/checkout',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({productId:'family-adventure-pack'})});
 assert.ok(!checkout.ok,'Commerce stays closed in the extracted artifact');
 console.log(JSON.stringify({node:process.version,buildId:status.buildId,sourceCommit:status.sourceCommit,inventoryFiles:status.files.length,routes:routes.length,productionInstall:'PASS',adminImports:'PASS',closedCheckout:'PASS',result:'PASS'},null,2));
}finally{
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}
 rmSync(folder,{recursive:true,force:true});
}
