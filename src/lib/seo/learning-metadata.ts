import type {Metadata} from "next";
import {ACTIVE_LOCALES, REGIONAL_LOCALES, type Locale} from "@/i18n/config";
import {getSiteUrl} from "./site-url";
/** A translated page owns its canonical URL; alternates follow the release locales. */
export function learningMetadata(title:string,description:string,path:string,image="guides/girl-and-puppy.webp",locale:Locale="en"):Metadata{
 const url=`${getSiteUrl()}/${locale}${path}`;
 return {title,description,alternates:{canonical:url,languages:Object.fromEntries(ACTIVE_LOCALES.map(language=>[language,`${getSiteUrl()}/${language}${path}`]))},openGraph:{title,description,url,type:"website",siteName:"Money Quest",locale:REGIONAL_LOCALES[locale].replace("-","_"),images:[{url:`/images/money-quest/${image}`,width:image.startsWith("books/")?1152:image.startsWith("sections/")?640:768,height:image.startsWith("sections/")?640:768}]},twitter:{card:"summary_large_image",title,description,images:[`/images/money-quest/${image}`]}};
}
