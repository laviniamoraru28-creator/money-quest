import type {Locale} from "@/i18n/config";
import {commerceConfig} from "./config";
import {shopFlowPresentation} from "@/lib/i18n/parent-presentation";
import {shopCataloguePresentation} from "@/lib/i18n/shop-catalogue-presentation";
export function publicCommerce(){try{return commerceConfig();}catch{return null;}}
/** Live publication currently follows the public English-only gate. No mixed-language contract. */
export function storefrontFlow(locale:Locale,live=false){
 const flow=shopFlowPresentation(locale);
 if(!live)return {...flow,termsRequired:false};
 if(locale!=="en")throw new Error("Live storefront language not released");
 return {termsRequired:true,copy:{...flow.copy,testOnly:"Secure card payment for an English digital download. No printed item or subscription.",continueTest:"Continue to secure payment",verified:"Payment verified. Your order confirmation has been sent to the email provided at checkout. Download your files or save another copy of the confirmation below."}};
}
export function storefrontCatalogue(locale:Locale,live=false){
 const p=shopCataloguePresentation(locale),flow=storefrontFlow(locale,live);
 if(!live)return {...p,termsRequired:false};
 return {...p,flowCopy:flow.copy,termsRequired:true,copy:{...p.copy,previewTitle:"English print-at-home editions",previewBody:"These digital files and free samples are in English. You print and bind them at home. The prices shown are one-time totals in GBP; there is no subscription. Other language editions are in preparation.",priceNote:"one payment",a4:"The licence is for one household. Classroom copying and redistribution are not included.",terms:"Digital download terms"}};
}
