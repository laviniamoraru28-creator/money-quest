import ReviewModeration from "@/components/ReviewModeration";
export const metadata={title:"Review moderation",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <ReviewModeration token={token&&token.length<250?token:undefined}/>;}
