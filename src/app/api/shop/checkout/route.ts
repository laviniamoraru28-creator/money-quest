import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// New purchases are paused. Existing Stripe webhooks and order delivery remain available.
export async function POST(){
 return NextResponse.json({code:"purchases_closed",message:"Purchases are temporarily unavailable."},{status:503});
}
