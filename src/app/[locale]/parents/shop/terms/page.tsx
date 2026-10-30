import {ShopTerms} from "@/components/ShopTerms";
import {publicParentLocale,shopTermsPresentation} from "@/lib/i18n/parent-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export const metadata=learningMetadata("Digital download terms and preview status","Read the format, household licence and preview status of Money Quest printable PDF resources.","/parents/shop/terms");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <ShopTerms {...shopTermsPresentation(publicParentLocale(locale))}/>;
}
