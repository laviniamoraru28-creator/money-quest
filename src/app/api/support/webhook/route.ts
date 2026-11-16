import {NextResponse} from "next/server";
import {limitedBody} from "@/lib/security/limited-body";
import {supportConfig, supportClient, validSupportSession} from "@/lib/support/server";
import {SUPPORT_APP} from "@/lib/support/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  let config, client, event;
  try {
    config = supportConfig(); client = supportClient(config);
    event = client.webhooks.constructEvent(await limitedBody(request, 262144), request.headers.get("stripe-signature") || "", config.webhook);
  } catch {return NextResponse.json({received: false}, {status: 400});}
  if (event.livemode) return NextResponse.json({received: false}, {status: 400});
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (event.data.object.metadata?.app !== SUPPORT_APP || event.data.object.payment_status !== "paid") return NextResponse.json({received: true});
    try {
      const session = await client.checkout.sessions.retrieve(event.data.object.id, {expand: ["line_items", "payment_intent.latest_charge"]});
      // No entitlements, emails, or local payment database. Stripe is the ledger.
      // Replayed events are consequently idempotent. Refunded sessions are ignored.
      return NextResponse.json({received: true, verified: validSupportSession(session, config.product)});
    } catch {return NextResponse.json({received: false}, {status: 500});}
  }
  // Includes async_payment_failed: never marks a pending/failed payment as paid.
  return NextResponse.json({received: true});
}
