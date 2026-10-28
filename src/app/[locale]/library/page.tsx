import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export const metadata=learningMetadata("Money Quest Library","Read 10 free Money Quest chapter books, explore 10 sourced mini-biographies and discover children's books and eight short reads.","/library","sections/library.webp");
export default function Page(){return <DiscoveryExperience kind="library"/>}
