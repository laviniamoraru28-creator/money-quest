import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import {notFound} from "next/navigation";
import {libraryBooks} from "@/content/discovery";
type Props={params:Promise<{slug:string}>};
export default async function Page({params}:Props){const {slug}=await params;if(!libraryBooks.some(entry=>entry.slug===slug))notFound();return <DiscoveryExperience kind="library" slug={slug}/>}
export function generateStaticParams(){return libraryBooks.map(entry=>({slug:entry.slug}))}
export async function generateMetadata({params}:Props){const {slug}=await params;const entry=libraryBooks.find(item=>item.slug===slug);if(!entry)notFound();return learningMetadata(entry.title,entry.topic,`/library/${slug}`,"sections/library.webp")}
