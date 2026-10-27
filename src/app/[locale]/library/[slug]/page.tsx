import { getSiteUrl } from "@/lib/seo/site-url";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { libraryBooks } from "@/content/discovery";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if (!libraryBooks.some(x=>x.slug===slug)) notFound(); return <DiscoveryExperience kind="library" slug={slug} />;}
export function generateStaticParams(){return libraryBooks.map(x=>({slug:x.slug}));}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;const entry=libraryBooks.find(x=>x.slug===slug);if(!entry)return {};const url=`${getSiteUrl()}/${locale}/library/${slug}`;return {title:`${entry.title} | Money Quest Library`,description:entry.topic,alternates:{canonical:url,languages:{en:url}},robots:{index:locale==="en",follow:true}};}
