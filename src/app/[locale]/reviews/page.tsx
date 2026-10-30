import PublicReviews from "@/components/PublicReviews";
import {learningMetadata} from "@/lib/seo/learning-metadata";
export const metadata=learningMetadata("Reader reviews","Reader ratings and moderated feedback about Money Quest.","/reviews");
export default function Page(){return <PublicReviews/>;}
