import {NextResponse} from "next/server";
import {commerceConfig} from "@/lib/commerce/config";
import {stripeClient,fulfillSession,APP_ID} from "@/lib/commerce/stripe";
import {limitedBody} from "@/lib/security/limited-body";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
 let event;try{event=stripeClient().webhooks.constructEvent(await limitedBody(request,262144),request.headers.get("stripe-signature")??"",commerceConfig().webhook);}catch{return NextResponse.json({message:"Invalid webhook signature or configuration"},{status:400})}
 if(event.livemode)return NextResponse.json({message:"Live events are not enabled"},{status:400});
 if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
  if(event.data.object.metadata?.app!==APP_ID||event.data.object.payment_status!=="paid")return NextResponse.json({received:true});
  try{await fulfillSession(event.data.object.id);}catch{return NextResponse.json({message:"Fulfilment pending; retry this event"},{status:500})}
 }
 return NextResponse.json({received:true});
}
