import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { museumRooms } from "@/content/discovery";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if (!museumRooms.some(x=>x.slug===slug)) notFound(); return <DiscoveryExperience kind="museum" slug={slug} />;}
export function generateStaticParams(){return museumRooms.map(x=>({slug:x.slug}));}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;const entry=museumRooms.find(x=>x.slug===slug);if(!entry)return {};const url=`${getSiteUrl()}/${locale}/museum/${slug}`;return {title:`${entry.title} | Money Quest Museum`,description:entry.intro,alternates:{canonical:url,languages:{en:url}},robots:{index:locale==="en",follow:true}};}
