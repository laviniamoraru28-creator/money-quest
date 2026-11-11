import {notFound} from "next/navigation";
import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {shopProducts} from "@/content/shop";
import {publiclyListedProductIds} from "@/content/shop-publication";
import {canCheckout} from "@/lib/commerce/config";
import {ShopCatalogue} from "@/components/ShopCatalogue";
import {publicCommerce,storefrontCatalogue} from "@/lib/commerce/storefront";
import {ShopMerchant} from "@/components/ShopMerchant";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {safeJsonLd} from "@/lib/seo/safe-json-ld";
import {getSiteUrl} from "@/lib/seo/site-url";
import {parentBonusReady} from "@/lib/commerce/parent-bonus";
import {checkoutPaused} from "@/lib/commerce/checkout-pause";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const language=publicParentLocale(locale),copy=storefrontCatalogue(language).copy;return learningMetadata(copy.title,copy.intro,"/parents/shop","sections/library.webp",language);}
// Unpublished while checkoutPaused() holds (see checkout-pause.ts) — the
// storefront itself is kept, not deleted, for when purchases resume.
export default async function Page({params}:{params:Promise<{locale:string}>}){
 if(checkoutPaused())notFound();
 const {locale}=await params;const config=publicCommerce(),live=config?.mode==="live";const presentation=storefrontCatalogue(publicParentLocale(locale),live);
 const bonusReady=config?await parentBonusReady(config.assets):false;
 const available=await Promise.all(shopProducts.map(async product=>bonusReady&&await canCheckout(product)));
 // Only publicly-listed products reach the storefront: an unfinished
 // product's code, copy and translations stay in the repo for a future
 // release, but it never renders a card, sample link or buy button here.
 const visible=shopProducts.map((product,index)=>publiclyListedProductIds.has(product.id)?index:-1).filter(index=>index>=0);
 const products=visible.map(index=>presentation.products[index]!);
 const publicAvailable=visible.map(index=>available[index]!);
 const schema={"@context":"https://schema.org","@type":"CollectionPage",name:presentation.copy.title,url:`${getSiteUrl()}/${publicParentLocale(locale)}/parents/shop`,description:presentation.copy.intro};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/><ShopCatalogue {...presentation} products={products} available={publicAvailable} merchant={live&&config?.release?<ShopMerchant release={config.release} locale={publicParentLocale(locale)}/>:undefined}/></>;
}
