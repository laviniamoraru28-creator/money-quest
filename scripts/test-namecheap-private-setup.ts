import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,symlinkSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=mkdtempSync(path.join(tmpdir(),'mq-install-'));
try {
 const app=path.join(root,'app'),web=path.join(root,'public_html'),kit=path.join(root,'kit'),privateRoot=path.join(root,'private');
 for(const p of [app,web,path.join(kit,'private-assets')])mkdirSync(p,{recursive:true});
 writeFileSync(path.join(app,'server.js'),'// fixture');
 const products:Record<string,{file:string;sha256:string;bytes:number}>={};
 for(const id of ['family-adventure-pack','adventure-journal']) {
  const data=Buffer.concat([Buffer.from('PK\x03\x04'),Buffer.alloc(300,id==='adventure-journal'?2:1)]),file=id+'.zip';
  writeFileSync(path.join(kit,'private-assets',file),data);products[id]={file,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length};
 }
 writeFileSync(path.join(kit,'products.integrity.json'),JSON.stringify(products));
 const run=(p:string)=>spawnSync(process.execPath,['scripts/setup-private-commerce.mjs','--app-root',app,'--document-root',web,'--private-root',p,'--kit-root',kit],{encoding:'utf8'});
 assert.notEqual(run(path.join(web,'private')).status,0);assert(!existsSync(path.join(web,'private')));
 const corrupt=path.join(kit,'private-assets',products['family-adventure-pack']!.file),saved=readFileSync(corrupt);writeFileSync(corrupt,Buffer.alloc(304));
 assert.notEqual(run(privateRoot).status,0);assert(!existsSync(privateRoot));writeFileSync(corrupt,saved);
 assert.equal(run(privateRoot).status,0);
 const envPath=path.join(privateRoot,'commerce.env'),initial=readFileSync(envPath,'utf8');
 assert(initial.includes('MONEYQUEST_COMMERCE_MODE="off"'));assert(initial.includes('price_1UWDjcQZFq5acwqxjp58bWKT'));assert(initial.match(/MONEYQUEST_ORDER_SIGNING_SECRET="[a-f0-9]{96}"/));
 assert.equal(run(privateRoot).status,0);assert.equal(readFileSync(envPath,'utf8'),initial,'Rerun preserves signing material and settings');
 const a=products['adventure-journal']!,target=path.join(privateRoot,'downloads','adventure-journal-'+a.sha256+'.zip');
 rmSync(target);symlinkSync(path.join(kit,'private-assets',a.file),target);assert.notEqual(run(privateRoot).status,0);
 const loader=path.resolve('host-env.cjs');
 const check=(file:string)=>spawnSync(process.execPath,['--require',loader,'-e','if(process.env.MONEYQUEST_COMMERCE_MODE!=="off")process.exit(3)'],{cwd:app,encoding:'utf8',env:{...process.env,MONEYQUEST_HOST_ENV_FILE:file}});
 assert.equal(check(envPath).status,0);
 chmodSync(envPath,0o644);assert.notEqual(check(envPath).status,0);chmodSync(envPath,0o600);
 const exposed=path.join(app,'commerce.env');writeFileSync(exposed,initial,{mode:0o600});assert.notEqual(check(exposed).status,0);
 console.log('PASS: corrupt bundle refusal before mutation, private-root isolation, immutable archive symlink refusal, rerun preservation of signing material, mode off, private environment loading and permission/public-path rejection. No network, payment or email.');
} finally {rmSync(root,{recursive:true,force:true});}
