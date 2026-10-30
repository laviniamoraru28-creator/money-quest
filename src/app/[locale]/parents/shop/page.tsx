import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {shopProducts} from "@/content/shop";
import {canCheckout} from "@/lib/commerce/config";
import {ShopCatalogue} from "@/components/ShopCatalogue";
import {shopCataloguePresentation} from "@/lib/i18n/shop-catalogue-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import {safeJsonLd} from "@/lib/seo/safe-json-ld";
import {getSiteUrl} from "@/lib/seo/site-url";
export const dynamic="force-dynamic";
export const metadata=learningMetadata("Printable money activities and journal for families","Preview original illustrated money activities and a 12-week print-at-home journal. Free samples, flexible response methods and parent guidance.","/parents/shop","sections/library.webp");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;const presentation=shopCataloguePresentation(publicParentLocale(locale));
 const available=await Promise.all(shopProducts.map(canCheckout));
 const schema={"@context":"https://schema.org","@type":"CollectionPage",name:"Money Quest parent printables",url:`${getSiteUrl()}/en/parents/shop`,description:"Original printable educational resources for families, with free samples. Paid editions are in preparation."};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/><ShopCatalogue {...presentation} available={available}/></>;
}
