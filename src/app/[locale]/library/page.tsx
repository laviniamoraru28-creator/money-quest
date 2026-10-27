import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export default function Page(){return <DiscoveryExperience kind="library" />;}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return {title:"Money Quest Library",description:"Explore eight children's books and biographies.",alternates:{languages:{en:`${getSiteUrl()}/en/library`},canonical:`${getSiteUrl()}/${locale}/library`},robots:{index:locale==="en",follow:true}};}
