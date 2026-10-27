import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import {notFound} from "next/navigation";
import {museumRooms} from "@/content/discovery";
type Props={params:Promise<{slug:string}>};
export default async function Page({params}:Props){const {slug}=await params;if(!museumRooms.some(entry=>entry.slug===slug))notFound();return <DiscoveryExperience kind="museum" slug={slug}/>}
export function generateStaticParams(){return museumRooms.map(entry=>({slug:entry.slug}))}
export async function generateMetadata({params}:Props){const {slug}=await params;const entry=museumRooms.find(item=>item.slug===slug);if(!entry)notFound();return learningMetadata(entry.title,entry.intro,`/museum/${slug}`,"sections/museum.webp")}
