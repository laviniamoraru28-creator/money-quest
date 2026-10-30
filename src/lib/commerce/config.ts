import path from "node:path";
import {realpathSync} from "node:fs";
import {access} from "node:fs/promises";
import type {ShopProduct} from "@/content/shop";
import {SHOP_TERMS_VERSION} from "@/content/shop";
import {readRelease,archiveName,verifyArchive,validEmail} from "./release";
export function privateDirectory(value:string|undefined):string{
 if(!value||!path.isAbsolute(value))throw new Error("An absolute private storage directory is required");
 const resolved=path.resolve(value),project=path.resolve(process.cwd());
 if(resolved===project||resolved.startsWith(project+path.sep))throw new Error("Paid downloads and orders must be outside the application directory");
 const publicRoot=process.env.MONEYQUEST_DOCUMENT_ROOT;
 if(publicRoot){
  if(!path.isAbsolute(publicRoot))throw new Error("Absolute document root required");
  const roots=[path.resolve(publicRoot)];try{roots.push(realpathSync(publicRoot));}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  if(roots.some(root=>resolved===root||resolved.startsWith(root+path.sep)))throw new Error("Private commerce storage cannot be under the document root");
 }
 try{const actual=realpathSync(resolved);if(actual!==resolved)privateDirectory(actual);}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
 return resolved;
}
export function smtpConfig(){
 const host=process.env.MONEYQUEST_SMTP_HOST,port=Number(process.env.MONEYQUEST_SMTP_PORT),user=process.env.MONEYQUEST_SMTP_USER,pass=process.env.MONEYQUEST_SMTP_PASSWORD,from=process.env.MONEYQUEST_SMTP_FROM;
 if(!host||!/^[A-Za-z0-9.-]+$/.test(host)||![465,587].includes(port)||!user||!pass||!validEmail(from))throw new Error("Verified TLS confirmation mailbox configuration required");
 return {host,port,secure:port===465,requireTLS:true,auth:{user,pass},from};
}
export function commerceConfig(){
 const mode=process.env.MONEYQUEST_COMMERCE_MODE;
 if(mode!=="sandbox"&&mode!=="live")throw new Error("Purchases are not open yet");
 const key=process.env.MONEYQUEST_STRIPE_KEY;
 if(!key||!(mode==="live"?/^rk_live_[A-Za-z0-9]+$/:/^([rs]k)_test_[A-Za-z0-9_]+$/).test(key))throw new Error("A mode-matched restricted Stripe key is required");
 const signing=process.env.MONEYQUEST_ORDER_SIGNING_SECRET;
 if(!signing||Buffer.byteLength(signing)<32)throw new Error("Order signing is not configured");
 const webhook=process.env.MONEYQUEST_STRIPE_WEBHOOK_SECRET;
 if(!webhook?.startsWith("whsec_"))throw new Error("Webhook verification is not configured");
 const url=new URL(process.env.NEXT_PUBLIC_SITE_URL??"https://moneyquesteducation.com");
 if(url.username||url.password||url.search||url.hash||url.pathname!=="/"||(url.protocol!=="https:"&&url.hostname!=="localhost")||(mode==="live"&&(url.protocol!=="https:"||url.hostname==="localhost")))throw new Error("Checkout needs a clean HTTPS site origin");
 const base=privateDirectory(process.env.MONEYQUEST_ORDER_DIRECTORY),assets=privateDirectory(process.env.MONEYQUEST_DOWNLOAD_DIRECTORY);
 const orders=mode==="live"?path.join(base,"live"):base;
 let release:ReturnType<typeof readRelease>|undefined;
 if(mode==="live"){
  if(!process.env.MONEYQUEST_DOCUMENT_ROOT)throw new Error("Live hosting document root must be declared");
  const file=process.env.MONEYQUEST_LIVE_RELEASE_FILE;if(!file)throw new Error("Final live release is not configured");
  privateDirectory(file);if(!path.isAbsolute(file))throw new Error("Private absolute release file required");
  release=readRelease(file);smtpConfig();
 }
 return {mode:mode as "sandbox"|"live",key,signing,webhook,origin:url.origin,orders,assets,release,termsVersion:release?.terms.version??SHOP_TERMS_VERSION};
}
export type CommerceConfig=ReturnType<typeof commerceConfig>;
export async function canCheckout(product:ShopProduct){try{const c=commerceConfig();if(!process.env[product.priceEnv]?.startsWith("price_"))return false;
 if(c.mode==="live"){const asset=c.release!.products[product.id];await verifyArchive(c.assets,archiveName(product,asset.sha256),asset,false);}else await access(path.join(c.assets,product.file));return true;}catch{return false;}}
