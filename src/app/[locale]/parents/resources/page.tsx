import {ParentResourceGuide} from "@/components/ParentResourceGuide";
import {parentGuidePresentation,publicParentLocale} from "@/lib/i18n/parent-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const language=publicParentLocale(locale),copy=parentGuidePresentation(language).copy;return learningMetadata(copy.title,copy.intro,"/parents/resources","sections/inclusive-learning.webp",language);}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <ParentResourceGuide {...parentGuidePresentation(publicParentLocale(locale))}/>;
}
