/** Run from the host scheduler. Retries existing paid orders, never creates a charge. */
import {readdir} from "node:fs/promises";
import {commerceConfig} from "../src/lib/commerce/config";
import {validSessionId} from "../src/lib/commerce/orders";
import {confirmationSent} from "../src/lib/commerce/confirmation";
import {fulfillSession} from "../src/lib/commerce/stripe";
async function main(){
 const c=commerceConfig();if(c.mode!=="live")throw new Error("Live configuration required");
 const files=await readdir(c.orders),start=Date.now();let sent=0,failed=0,attempted=0;
 for(const file of files){if(attempted>=20||Date.now()-start>45000)break;if(!file.endsWith(".json"))continue;const id=file.slice(0,-5);if(!validSessionId(id,"live")||await confirmationSent(c.orders,id))continue;
  attempted++;try{await fulfillSession(id);sent++;}catch{failed++;}
 }
 console.log(JSON.stringify({attempted,smtpAccepted:sent,pendingOrRevoked:failed}));if(failed)process.exitCode=1;
}
main().catch(()=>{console.error("Pending order delivery is unavailable. Check private configuration; no payments were created.");process.exitCode=1});
