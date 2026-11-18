import {ADULT_COOKIE, verifiedAdult} from "@/lib/support/adult-gate";
import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {limitedBody} from "@/lib/security/limited-body";
import {checkoutInput} from "@/lib/support/validation";
import {supportConfig, createSupportSession, allowSupportRequest} from "@/lib/support/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control": "no-store"};
export async function POST(request: Request) {
  let config;
  try {config = supportConfig();} catch {return NextResponse.json({code: "unavailable"}, {status: 503, headers});}
  if (request.headers.get("origin") !== config.origin) return NextResponse.json({code: "unavailable"}, {status: 403, headers});
  let input;
  try {input = checkoutInput(JSON.parse(await limitedBody(request, 1024)));} catch {return NextResponse.json({code: "invalid"}, {status: 400, headers});}
  const jar = await cookies();
  if (!verifiedAdult(jar.get(ADULT_COOKIE)?.value)) return NextResponse.json({code: "adult"}, {status: 403, headers});
  const existing = jar.get("mq_support")?.value;
  const token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString("hex");
  if (!allowSupportRequest(token)) return NextResponse.json({code: "rate"}, {status: 429, headers: {...headers, "Retry-After": "60"}});
  // Set the token even on upstream timeout, so a retry uses the same Stripe key.
  jar.set("mq_support", token, {httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", maxAge: 86400, path: "/"});
  try {return NextResponse.json({url: await createSupportSession(input, token, config)}, {headers});}
  catch {return NextResponse.json({code: "unavailable"}, {status: 503, headers});}
}
