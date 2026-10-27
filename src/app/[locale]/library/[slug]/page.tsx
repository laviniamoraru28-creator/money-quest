import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { libraryBooks } from "@/content/discovery";
export default function Page({params}:{params:{slug:string}}){if (!libraryBooks.some(x=>x.slug===params.slug)) notFound(); return <DiscoveryExperience kind="library" slug={params.slug} />;}
export function generateStaticParams(){return libraryBooks.map(x=>({slug:x.slug}));}

export function generateMetadata({params}:{params:{locale:string;slug:string}}){const entry=libraryBooks.find(x=>x.slug===params.slug);if(!entry)return {};const url=`${getSiteUrl()}/${params.locale}/library/${params.slug}`;return {title:`${entry.title} | Money Quest Library`,description:entry.topic,alternates:{canonical:url},robots:{index:params.locale==="en",follow:true}};}
