import {ParentResourceGuide} from "@/components/ParentResourceGuide";
import {parentGuidePresentation,publicParentLocale} from "@/lib/i18n/parent-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export const metadata=learningMetadata("Parent guide to money learning and printable activities","Help your child explore money through fictional examples, accessible activities and everyday conversations. Free illustrated samples and evidence sources.","/parents/resources","sections/inclusive-learning.webp");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <ParentResourceGuide {...parentGuidePresentation(publicParentLocale(locale))}/>;
}
