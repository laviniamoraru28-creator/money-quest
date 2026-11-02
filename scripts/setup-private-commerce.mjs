/** Install only the supplied verified archives into private storage. Sales stay off. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
const options = {};
for (let i=2;i<process.argv.length;i+=2) {
  const key=process.argv[i],value=process.argv[i+1];
  if (!['--app-root','--document-root','--private-root','--kit-root'].includes(key)||!value) throw new Error('Use --app-root PATH --document-root PATH [--private-root PATH] [--kit-root PATH]');
  if (Object.hasOwn(options,key)) throw new Error('Duplicate option');
  options[key]=value;
}
function canonical(value) {
  if (!value||!path.isAbsolute(value)) throw new Error('Absolute paths required');
  const resolved=path.resolve(value);
  if (fs.existsSync(resolved)) return fs.realpathSync(resolved);
  return path.join(canonical(path.dirname(resolved)),path.basename(resolved));
}
const app=canonical(options['--app-root']),web=canonical(options['--document-root']);
const root=canonical(options['--private-root']||path.join(os.homedir(),'moneyquest-private'));
const kit=canonical(options['--kit-root']||path.dirname(fileURLToPath(import.meta.url)));
const inside=(a,b)=>a===b||a.startsWith(b+path.sep);
if ([app,web].some(p=>inside(root,p)||inside(p,root))) throw new Error('Private root must be separate from application and document root');
if (!fs.existsSync(path.join(app,'server.js'))||!fs.statSync(web).isDirectory()) throw new Error('Check actual application and document roots in cPanel');
const products=JSON.parse(fs.readFileSync(path.join(kit,'products.integrity.json'),'utf8'));
const ids=['family-adventure-pack','adventure-journal'];
if (Object.keys(products).sort().join(',')!==[...ids].sort().join(',')) throw new Error('Unexpected product manifest');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pending=[];
for (const id of ids) {
  const a=products[id];
  if (!/^[a-f0-9]{64}$/.test(a.sha256)||!Number.isSafeInteger(a.bytes)||a.bytes<100||a.bytes>100*1024*1024||path.basename(a.file)!==a.file) throw new Error('Invalid archive manifest');
  const source=path.join(kit,'private-assets',a.file);
  if (fs.statSync(source).size!==a.bytes||hash(source)!==a.sha256) throw new Error('Archive verification failed: '+id);
  pending.push({id,source,target:path.join(root,'downloads',id+'-'+a.sha256+'.zip'),asset:a});
}
// All source files and paths have been checked before the first mutation.
for (const dir of [root,path.join(root,'downloads'),path.join(root,'orders'),path.join(root,'orders','live')]) {
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  if (canonical(dir)!==path.resolve(dir)) throw new Error('Private symlink path refused');
  fs.chmodSync(dir,0o700);
}
for (const item of pending) {
  if (fs.existsSync(item.target)) {
    if (fs.lstatSync(item.target).isSymbolicLink()) throw new Error('Archive symlink refused');
    if (hash(item.target)!==item.asset.sha256) throw new Error('Existing immutable archive differs');
  } else fs.copyFileSync(item.source,item.target,fs.constants.COPYFILE_EXCL);
  fs.chmodSync(item.target,0o600);
}
const release={schema:1,accountId:'acct_1UVYX9QZFq5acwqx',merchant:{name:'REPLACE with verified legal seller name',address:'REPLACE with verified geographic business address',email:'moneyquesteducation@gmail.com'},terms:{version:'draft-DO-NOT-ACTIVATE',text:'REPLACE with the complete reviewed consumer contract, including product languages, functionality, household licence, inclusive price, digital supply and cancellation, statutory remedies and support.'},privacy:'REPLACE with the reviewed adult-purchase privacy information and actual processors, purposes, retention periods, rights and support.',taxStatement:'UNCONFIRMED. Complete the actual inclusive-price tax statement for this seller and markets.',products:Object.fromEntries(pending.map(p=>[p.id,{sha256:p.asset.sha256,bytes:p.asset.bytes}]))};
const draft=path.join(root,'release.pending.json');
if (!fs.existsSync(draft)) fs.writeFileSync(draft,JSON.stringify(release,null,2)+'\n',{mode:0o600,flag:'wx'});
const envPath=path.join(root,'commerce.env');
if (!fs.existsSync(envPath)) {
  const env={NODE_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://moneyquesteducation.com',MONEYQUEST_COMMERCE_MODE:'off',MONEYQUEST_STRIPE_KEY:'',MONEYQUEST_STRIPE_WEBHOOK_SECRET:'',MONEYQUEST_ORDER_SIGNING_SECRET:randomBytes(48).toString('hex'),MONEYQUEST_ORDER_DIRECTORY:path.join(root,'orders'),MONEYQUEST_DOWNLOAD_DIRECTORY:path.join(root,'downloads'),MONEYQUEST_DOCUMENT_ROOT:web,MONEYQUEST_LIVE_RELEASE_FILE:path.join(root,'release.json'),MONEYQUEST_STRIPE_FAMILY_PRICE_ID:'price_1UWDjcQZFq5acwqxjp58bWKT',MONEYQUEST_STRIPE_JOURNAL_PRICE_ID:'price_1UWDjaQZFq5acwqxqB1XcyfK',MONEYQUEST_SMTP_HOST:'',MONEYQUEST_SMTP_PORT:'465',MONEYQUEST_SMTP_USER:'moneyquesteducation@gmail.com',MONEYQUEST_SMTP_PASSWORD:'',MONEYQUEST_SMTP_FROM:'moneyquesteducation@gmail.com'};
  fs.writeFileSync(envPath,Object.entries(env).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n',{mode:0o600,flag:'wx'});
}
console.log('PASS: both verified customer archives installed privately. Existing environment and historical files preserved.');
console.log('cPanel environment setting: MONEYQUEST_HOST_ENV_FILE='+envPath);
console.log('Complete the private configuration and release.pending.json on the host. Sales remain off. No payment or email was sent.');
