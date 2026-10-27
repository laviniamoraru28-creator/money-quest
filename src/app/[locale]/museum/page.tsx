import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export const metadata=learningMetadata("Money Quest Museum","Explore ten museum rooms about money and inventions.","/museum","sections/museum.webp");
export default function Page(){return <DiscoveryExperience kind="museum"/>}
