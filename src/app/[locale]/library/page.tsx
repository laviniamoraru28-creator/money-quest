import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export default function Page(){return <DiscoveryExperience kind="library" />;}
\n
export function generateMetadata({params}:{params:{locale:string}}){return {title:"Money Quest Library",description:"Explore eight children's books and biographies.",alternates:{canonical:`${getSiteUrl()}/${params.locale}/library`},robots:{index:params.locale==="en",follow:true}};}
