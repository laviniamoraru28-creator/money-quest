import {discoveryCopy} from "@/content/discovery-copy";
import {publicDiscoveryPresentation} from "@/lib/i18n/discovery-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 const presentation=publicDiscoveryPresentation("museum",locale),copy=discoveryCopy[presentation.locale];
 return learningMetadata(copy.museumTitle,copy.museumIntro,"/museum","sections/museum.webp",presentation.locale);
}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <DiscoveryExperience presentation={publicDiscoveryPresentation("museum",locale)}/>;
}
