import type {Metadata} from "next";
import {getSiteUrl} from "./site-url";
/** English-only, public learning pages each get their own share and canonical URL. */
export function learningMetadata(title:string,description:string,path:string,image="guides/girl-and-puppy.webp"):Metadata{
 const url=`${getSiteUrl()}/en${path}`;
 return {title,description,alternates:{canonical:url,languages:{en:url}},openGraph:{title,description,url,type:"website",siteName:"Money Quest",locale:"en_GB",images:[{url:`/images/money-quest/${image}`,width:image.startsWith("books/")?1152:image.startsWith("sections/")?640:768,height:image.startsWith("sections/")?640:768}]},twitter:{card:"summary_large_image",title,description,images:[`/images/money-quest/${image}`]}};
}
