import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export const metadata=learningMetadata("Money Quest Library","Explore eight short children's books and biographies.","/library","sections/library.webp");
export default function Page(){return <DiscoveryExperience kind="library"/>}
