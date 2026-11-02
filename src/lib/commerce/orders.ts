import {createHmac,timingSafeEqual} from "node:crypto";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import path from "node:path";
import {commerceLock} from "./lock";
import {validateContract,type Contract} from "./release";
export type Order={mode?:"sandbox"|"live";contract?:Contract;sessionId:string;productId:string;locale:"en";amount:number;currency:"gbp";created:number;expires:number;termsVersion:string;instantSupply:true;cancellationAcknowledged:true};
export function validSessionId(id:string,mode?:"sandbox"|"live"){return /^cs_(test|live)_[A-Za-z0-9]{12,240}$/.test(id)&&(!mode||id.startsWith(mode==="live"?"cs_live_":"cs_test_"))}
export function orderToken(order:Order,secret:string){
 const data=`${order.sessionId}.${order.expires}`;
 return `${data}.${createHmac("sha256",secret).update(data).digest("base64url")}`;
}
export function parseOrderToken(token:string,secret:string,now=Date.now()):{id:string;expires:number}{
 const [id,expiry,signature,...extra]=token.split(".");
 if(!id||!validSessionId(id)||!expiry||!/^\d{10,16}$/.test(expiry)||!signature||!/^[A-Za-z0-9_-]{43}$/.test(signature)||extra.length)throw new Error("Invalid download link");
 const expires=Number(expiry);if(!Number.isSafeInteger(expires)||expires<now)throw new Error("This link has expired; contact the adult support address for recovery");
 const expected=createHmac("sha256",secret).update(`${id}.${expiry}`).digest();
 const supplied=Buffer.from(signature,"base64url");if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new Error("Invalid download link");
 return {id,expires};
}
export async function readOrder(directory:string,id:string):Promise<Order|null>{
 if(!validSessionId(id))throw new Error("Invalid order reference");
 try{const order=JSON.parse(await readFile(path.join(directory,id+".json"),"utf8")) as Order;if(order.sessionId!==id||order.currency!=="gbp"||!Number.isSafeInteger(order.amount)||order.amount<0||!Number.isSafeInteger(order.expires)||!Number.isSafeInteger(order.created)||typeof order.termsVersion!=="string"||order.locale!=="en"||!order.instantSupply||!order.cancellationAcknowledged)throw new Error("Invalid order data");if(id.startsWith("cs_live_")){if(order.mode!=="live"||!order.contract)throw new Error("Live contract missing");const c=validateContract(order.contract);if(c.productId!==order.productId||c.amount!==order.amount||c.termsVersion!==order.termsVersion)throw new Error("Contract/order mismatch");}else if(order.mode&&order.mode!=="sandbox")throw new Error("Order mode mismatch");return order;}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error;}
}
export async function saveOrderOnce(directory:string,order:Order){
 if(!validSessionId(order.sessionId))throw new Error("Invalid order reference");
 await mkdir(directory,{recursive:true,mode:0o700});const unlock=await commerceLock(path.join(directory,order.sessionId+".json"));
 try{
  const existing=await readOrder(directory,order.sessionId);if(existing)return existing;
  const temporary=path.join(directory,order.sessionId+".tmp");
  await writeFile(temporary,JSON.stringify(order),{mode:0o600,flag:"w"});
  await rename(temporary,path.join(directory,order.sessionId+".json"));return order;
 }finally{await unlock()}
}
