/** Host-side, read-only checks. Never prints secrets, buyer data or bearer URLs. */
import {access} from "node:fs/promises";
import path from "node:path";
import {commerceConfig,canCheckout} from "../src/lib/commerce/config";
import {verifyLiveStripeConfiguration} from "../src/lib/commerce/stripe";
import {verifyConfirmationTransport} from "../src/lib/commerce/confirmation";
import {shopProducts} from "../src/content/shop";
async function main(){
 let failures=0;
 const check=async(name:string,action:()=>unknown)=>{try{await action();console.log(`PASS: ${name}`);}catch{failures++;console.log(`BLOCKED: ${name}`);}};
 let config:ReturnType<typeof commerceConfig>|undefined;
 await check("mode-matched private merchant configuration",()=>{config=commerceConfig();});
 if(config){
  const c=config;console.log(`Environment: ${c.mode}. No payment or email is sent by this command.`);
  await check("existing private order directory",()=>access(c.orders));
  for(const product of shopProducts)await check(`archive and price reference: ${product.id}`,async()=>{if(!await canCheckout(product))throw new Error();if(c.mode==="live")await verifyLiveStripeConfiguration(c,product.id);});
  if(c.mode==="live")await check("SMTP TLS/authentication (not mailbox deliverability)",verifyConfirmationTransport);
  await check("private asset directory",()=>access(path.resolve(c.assets)));
 }
 console.log(failures?`${failures} readiness checks blocked. No settings were changed.`:"Technical checks passed. This does not verify tax/legal decisions, actual email delivery, product editorial quality or a completed purchase/refund.");
 process.exitCode=failures?1:0;
}
main().catch(()=>{console.error("Preflight unavailable. Check host configuration privately.");process.exitCode=1});
