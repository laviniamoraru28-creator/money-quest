import {liveShopCopy} from "@/content/live-shop-copy";
import type {Locale} from "@/i18n/config";
import {commerceConfig} from "./config";
import {shopFlowPresentation} from "@/lib/i18n/parent-presentation";
import {shopCataloguePresentation} from "@/lib/i18n/shop-catalogue-presentation";
export function publicCommerce(){try{return commerceConfig();}catch{return null;}}
/** Live publication currently follows the public English-only gate. No mixed-language contract. */
export function storefrontFlow(locale:Locale,live=false){
 const flow=shopFlowPresentation(locale);
 if(!live)return {...flow,termsRequired:false};
 const liveCopy=liveShopCopy[locale];
 return {locale,termsRequired:true,copy:{...flow.copy,testOnly:liveCopy.secure,continueTest:liveCopy.continue,verified:liveCopy.verified}};
}
export function storefrontCatalogue(locale:Locale,live=false){
 const p=shopCataloguePresentation(locale),flow=storefrontFlow(locale,live);
 if(!live)return {...p,termsRequired:false};
 const t=liveShopCopy[locale];
 return {...p,flowCopy:flow.copy,termsRequired:true,copy:{...p.copy,previewTitle:t.previewTitle,previewBody:t.previewBody,priceNote:t.onePayment,a4:t.licence,terms:t.termsShort}};
}
