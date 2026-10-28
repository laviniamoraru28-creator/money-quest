import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export const metadata=learningMetadata("Money Quest Library","Read original Money Quest chapter books, discover published children's books, and explore eight short reads.","/library","sections/library.webp");
export default function Page(){return <DiscoveryExperience kind="library"/>}
