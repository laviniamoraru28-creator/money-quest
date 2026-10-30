import {publicDiscoveryPresentation} from "@/lib/i18n/discovery-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export const metadata=learningMetadata("Money Quest Museum","Explore ten museum rooms about money and inventions.","/museum","sections/museum.webp");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <DiscoveryExperience presentation={publicDiscoveryPresentation("museum",locale)}/>;
}
