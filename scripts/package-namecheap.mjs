import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// One allowlist for local release preparation and CI. Never copy environment,
// order storage, paid products, Git metadata or development caches.
const root=process.cwd();
const output=path.resolve(process.argv.find(arg=>arg.startsWith('--output='))?.slice(9)??'moneyquest-namecheap-candidate.zip');
const candidate=process.argv.includes('--candidate');
if(process.version!=='v24.22.1')throw new Error('Package with Node 24.22.1');
if(!existsSync('.next/BUILD_ID')||!existsSync('public/offline-manifest.json'))throw new Error('Run the production build first');
const readiness=spawnSync(process.execPath,['--import','tsx','scripts/check-multilingual-release.ts'],{encoding:'utf8'});
if(readiness.error)throw readiness.error;
let languages;
try{languages=JSON.parse(readiness.stdout);}catch{throw new Error('Multilingual inventory failed; no package written');}
if(readiness.status!==0&&!candidate)throw new Error('Multilingual release is blocked. Only an explicitly labelled --candidate archive may be prepared.');
const buildId=readFileSync('.next/BUILD_ID','utf8').trim();
if(JSON.parse(readFileSync('public/offline-manifest.json','utf8')).version!==buildId)throw new Error('Offline manifest does not match this build');
const stage=mkdtempSync(path.join(tmpdir(),'moneyquest-package-'));
const entries=['.next','messages','server.js','host-env.cjs','package.json','package-lock.json','next.config.mjs','public','tsconfig.json','src/i18n','src/content/shop.ts','src/lib/commerce','scripts/shop-preflight.ts','scripts/shop-deliver-pending.ts'];
try{
 for(const entry of entries){
  const target=path.join(stage,entry);mkdirSync(path.dirname(target),{recursive:true});
  cpSync(entry,target,{recursive:true,filter:source=>{
   const relative=path.relative(root,source).split(path.sep).join('/');
   return !relative.startsWith('.next/cache')&&!relative.startsWith('.next/dev')&&!relative.endsWith('.map')&&!relative.endsWith('.tsbuildinfo');
  }});
 }
 // Only the administrative module graph is needed uncompiled. Remove UI-only
 // commerce adapters whose source dependencies are intentionally not shipped.
 for(const file of ['storefront.ts','client-messages.ts','order-error.ts'])rmSync(path.join(stage,'src/lib/commerce',file));
 const files=[];
 function inventory(folder){for(const name of readdirSync(folder).sort()){
  const file=path.join(folder,name);
  if(statSync(file).isDirectory())inventory(file);
  else files.push({path:path.relative(stage,file).split(path.sep).join('/'),bytes:statSync(file).size,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
 }}
 inventory(stage);
 const status={status:'candidate',productionReady:false,node:process.version,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),buildId,activeLocales:languages.activeLocales,multilingualReady:languages.releaseReady,blockers:languages.blockers,commerce:'off unless explicitly configured; hosted settlement, SMTP and delivery evidence still required',files};
 writeFileSync(path.join(stage,'RELEASE-STATUS.json'),JSON.stringify(status,null,2)+'\n');
 writeFileSync(path.join(stage,'README-RELEASE.txt'),'Money Quest release candidate. NOT approved for production.\nSee RELEASE-STATUS.json for blockers and SHA-256 inventory.\nNode.js 24.22.1. Install: npm ci --omit=dev. Start: NODE_ENV=production node server.js.\nNo paid assets, private configuration, secrets or order data are included.\n');
 mkdirSync(path.dirname(output),{recursive:true});
 if(existsSync(output))throw new Error('Output exists; choose a new archive name');
 execFileSync('zip',['-q','-r',output,'.'],{cwd:stage});
 console.log(JSON.stringify({archive:output,bytes:statSync(output).size,sha256:createHash('sha256').update(readFileSync(output)).digest('hex'),files:files.length,status:status.status,productionReady:status.productionReady},null,2));
}finally{rmSync(stage,{recursive:true,force:true});}
