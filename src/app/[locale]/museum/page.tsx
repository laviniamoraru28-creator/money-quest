import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
export default function Page(){return <DiscoveryExperience kind="museum" />;}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return {title:"Money Quest Museum",description:"Explore ten museum rooms about money and inventions.",alternates:{languages:{en:`${getSiteUrl()}/en/museum`},canonical:`${getSiteUrl()}/${locale}/museum`},robots:{index:locale==="en",follow:true}};}
