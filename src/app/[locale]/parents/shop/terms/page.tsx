import {ShopTerms} from "@/components/ShopTerms";
import {publicParentLocale,shopTermsPresentation} from "@/lib/i18n/parent-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export const metadata=learningMetadata("Digital download terms and preview status","Read the format, household licence and preview status of Money Quest printable PDF resources.","/parents/shop/terms");
import {publicCommerce} from "@/lib/commerce/storefront";
import {LiveShopTerms} from "@/components/ShopMerchant";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;const config=publicCommerce();if(config?.mode==="live"&&config.release)return <LiveShopTerms release={config.release}/>;
 return <ShopTerms {...shopTermsPresentation(publicParentLocale(locale))}/>;
}
