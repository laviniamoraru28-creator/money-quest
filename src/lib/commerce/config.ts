import path from "node:path";
import {access} from "node:fs/promises";
import type {ShopProduct} from "@/content/shop";
export function privateDirectory(value:string|undefined):string{
 if(!value||!path.isAbsolute(value))throw new Error("An absolute private storage directory is required");
 const resolved=path.resolve(value),project=path.resolve(process.cwd());
 if(resolved===project||resolved.startsWith(project+path.sep))throw new Error("Paid downloads and orders must be outside the application directory");
 return resolved;
}
export function commerceConfig(){
 // Live commerce stays blocked while translations, merchant details, tax,
 // durable confirmation, recovery and legal review are incomplete.
 if(process.env.MONEYQUEST_COMMERCE_MODE!=="sandbox")throw new Error("Purchases are not open yet");
 const key=process.env.MONEYQUEST_STRIPE_KEY;
 if(!key||!/^([rs]k)_test_/.test(key))throw new Error("A sandbox-only Stripe API key is required");
 const signing=process.env.MONEYQUEST_ORDER_SIGNING_SECRET;
 if(!signing||Buffer.byteLength(signing)<32)throw new Error("Order signing is not configured");
 const webhook=process.env.MONEYQUEST_STRIPE_WEBHOOK_SECRET;
 if(!webhook?.startsWith("whsec_"))throw new Error("Webhook verification is not configured");
 const url=new URL(process.env.NEXT_PUBLIC_SITE_URL??"https://moneyquesteducation.com");
 if(url.protocol!=="https:"&&url.hostname!=="localhost")throw new Error("Checkout needs an HTTPS site URL");
 return {key,signing,webhook,origin:url.origin,orders:privateDirectory(process.env.MONEYQUEST_ORDER_DIRECTORY),assets:privateDirectory(process.env.MONEYQUEST_DOWNLOAD_DIRECTORY)};
}
export async function canCheckout(product:ShopProduct){try{const c=commerceConfig();if(!process.env[product.priceEnv]?.startsWith("price_"))return false;await access(path.join(c.assets,product.file));return true;}catch{return false;}}
