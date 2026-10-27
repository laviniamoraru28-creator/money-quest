import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export default function Page(){return <DiscoveryExperience kind="museum" />;}
\n
export function generateMetadata({params}:{params:{locale:string}}){return {title:"Money Quest Museum",description:"Explore ten museum rooms about money and inventions.",alternates:{canonical:`${getSiteUrl()}/${params.locale}/museum`},robots:{index:params.locale==="en",follow:true}};}
