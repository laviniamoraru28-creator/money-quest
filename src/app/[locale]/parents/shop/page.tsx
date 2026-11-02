import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {shopProducts} from "@/content/shop";
import {canCheckout} from "@/lib/commerce/config";
import {ShopCatalogue} from "@/components/ShopCatalogue";
import {publicCommerce,storefrontCatalogue} from "@/lib/commerce/storefront";
import {ShopMerchant} from "@/components/ShopMerchant";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {safeJsonLd} from "@/lib/seo/safe-json-ld";
import {getSiteUrl} from "@/lib/seo/site-url";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const language=publicParentLocale(locale),copy=storefrontCatalogue(language).copy;return learningMetadata(copy.title,copy.intro,"/parents/shop","sections/library.webp",language);}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;const config=publicCommerce(),live=config?.mode==="live";const presentation=storefrontCatalogue(publicParentLocale(locale),live);
 const available=await Promise.all(shopProducts.map(canCheckout));
 const schema={"@context":"https://schema.org","@type":"CollectionPage",name:presentation.copy.title,url:`${getSiteUrl()}/${publicParentLocale(locale)}/parents/shop`,description:presentation.copy.intro};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/><ShopCatalogue {...presentation} available={available} merchant={live&&config?.release?<ShopMerchant release={config.release} locale={publicParentLocale(locale)}/>:undefined}/></>;
}
