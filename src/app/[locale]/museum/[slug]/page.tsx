import DiscoveryExperience from "@/components/DiscoveryExperience";
import { notFound } from "next/navigation";
import { museumRooms } from "@/content/discovery";
export default function Page({params}:{params:{slug:string}}){if (!museumRooms.some(x=>x.slug===params.slug)) notFound(); return <DiscoveryExperience kind="museum" slug={params.slug} />;}
export function generateStaticParams(){return museumRooms.map(x=>({slug:x.slug}));}
export const metadata = {title:"Money Quest Museum",description:"Explore the Money Quest Museum with child-friendly stories and activities."};
