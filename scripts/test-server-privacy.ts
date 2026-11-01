import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

async function main(){
 const token='cs_live_sensitive.DownloadSignature';
 const logs:unknown[][]=[];
 let handler:(request:unknown,response:unknown)=>Promise<void>=()=>Promise.resolve();
 const server={once(){return server;},listen(){return server;}};
 const next=()=>({prepare:()=>Promise.resolve(),getRequestHandler:()=>async()=>{throw new Error(token);}});
 const require=(name:string)=>{
  if(name==='./host-env.cjs')return {};
  if(name==='next')return next;
  if(name==='url')return {parse:()=>({pathname:'/api/shop/download',query:{token}})};
  if(name==='http')return {createServer:(callback:typeof handler)=>{handler=callback;return server;}};
  throw new Error(`Unexpected dependency: ${name}`);
 };
 vm.runInNewContext(readFileSync('server.js','utf8'),{require,process:{env:{NODE_ENV:'production'}},console:{error:(...args:unknown[])=>logs.push(args),log:()=>{}}});
 await new Promise(resolve=>setImmediate(resolve));
 const response={statusCode:200,body:'',end(value:string){this.body=value;}};
 await handler({url:`/api/shop/download?token=${token}`},response);
 assert.equal(response.statusCode,500);
 assert.equal(response.body,'internal server error');
 assert.deepEqual(logs,[['Request failed']]);
 assert.ok(!JSON.stringify(logs).includes(token));
 console.log('PASS: unhandled requests return a generic 500 without logging signed links or exception details.');
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
