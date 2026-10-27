import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { museumRooms } from "@/content/discovery";
export default function Page({params}:{params:{slug:string}}){if (!museumRooms.some(x=>x.slug===params.slug)) notFound(); return <DiscoveryExperience kind="museum" slug={params.slug} />;}
export function generateStaticParams(){return museumRooms.map(x=>({slug:x.slug}));}
\n
export function generateMetadata({params}:{params:{locale:string;slug:string}}){const entry=museumRooms.find(x=>x.slug===params.slug);if(!entry)return {};const url=`${getSiteUrl()}/${params.locale}/museum/${params.slug}`;return {title:`${entry.title} | Money Quest Museum`,description:entry.intro,alternates:{canonical:url},robots:{index:params.locale==="en",follow:true}};}
