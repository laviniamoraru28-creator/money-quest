import {ShopTerms} from "@/components/ShopTerms";
import {publicParentLocale,shopTermsPresentation} from "@/lib/i18n/parent-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const language=publicParentLocale(locale),copy=shopTermsPresentation(language).copy;return learningMetadata(copy.title,copy.body1,"/parents/shop/terms",undefined,language);}
import {publicCommerce} from "@/lib/commerce/storefront";
import {LiveShopTerms} from "@/components/ShopMerchant";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;const config=publicCommerce();if(config?.mode==="live"&&config.release)return <LiveShopTerms release={config.release} locale={publicParentLocale(locale)}/>;
 return <ShopTerms {...shopTermsPresentation(publicParentLocale(locale))}/>;
}
