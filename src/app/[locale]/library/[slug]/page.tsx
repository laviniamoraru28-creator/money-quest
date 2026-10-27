import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { libraryBooks } from "@/content/discovery";
export default function Page({params}:{params:{slug:string}}){if (!libraryBooks.some(x=>x.slug===params.slug)) notFound(); return <DiscoveryExperience kind="library" slug={params.slug} />;}
export function generateStaticParams(){return libraryBooks.map(x=>({slug:x.slug}));}
export const metadata = {title:"Money Quest Library",description:"Explore the Money Quest Library with child-friendly stories and activities."};
