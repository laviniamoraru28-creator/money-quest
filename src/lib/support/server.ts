import Stripe from "stripe";
import {createHash} from "node:crypto";
import {SUPPORT_APP, MIN_PENCE, MAX_PENCE, checkoutInput} from "./validation";
import {validatedCheckoutUrl} from "@/lib/commerce/client-messages";

// This review build deliberately cannot take live payments. Opening live mode
// requires a separately approved change after merchant/privacy/tax review.
export function supportConfig() {
  if (process.env.MONEYQUEST_SUPPORT_MODE !== "sandbox") throw new Error("Support closed");
  const key = process.env.MONEYQUEST_SUPPORT_STRIPE_KEY || process.env.MONEYQUEST_STRIPE_KEY;
  const product = process.env.MONEYQUEST_SUPPORT_PRODUCT_ID;
  const webhook = process.env.MONEYQUEST_SUPPORT_WEBHOOK_SECRET;
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://moneyquesteducation.com");
  if (!key || !/^(?:sk|rk)_test_[A-Za-z0-9_]+$/.test(key) || !product || !/^prod_[A-Za-z0-9]+$/.test(product) || !webhook?.startsWith("whsec_")) throw new Error("Support configuration incomplete");
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || !(url.protocol === "https:" || url.protocol === "http:" && url.hostname === "localhost")) throw new Error("Invalid origin");
  return {key, product, webhook, origin: url.origin};
}
export function supportReady() {try {supportConfig(); return true;} catch {return false;}}
export function supportClient(config = supportConfig()) {return new Stripe(config.key, {maxNetworkRetries: 2, timeout: 15000});}
export function browserHash(token: string) {return createHash("sha256").update(token).digest("hex");}
export async function createSupportSession(input: ReturnType<typeof checkoutInput>, token: string, config = supportConfig(), client = supportClient(config)) {
  const product = await client.products.retrieve(config.product);
  if (product.deleted || !product.active || product.livemode || product.metadata.app !== SUPPORT_APP) throw new Error("Wrong support product");
  const metadata = {app: SUPPORT_APP, amount: String(input.amount), locale: input.locale, browser_hash: browserHash(token)};
  const session = await client.checkout.sessions.create({
    mode: "payment", locale: input.locale, ui_mode: "hosted_page", integration_identifier: "mq_support_abcdefgh",
    line_items: [{price_data: {product: config.product, currency: "gbp", unit_amount: input.amount}, quantity: 1}],
    metadata, payment_intent_data: {metadata},
    automatic_tax: {enabled: false}, adaptive_pricing: {enabled: false}, allow_promotion_codes: false,
    phone_number_collection: {enabled: false},
    success_url: `${config.origin}/${input.locale}/support/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.origin}/${input.locale}/support?cancelled=1`,
  }, {idempotencyKey: `mq-support-${browserHash(token)}-${input.requestId}`});
  if (session.livemode) throw new Error("Wrong environment");
  return validatedCheckoutUrl(session.url);
}
export function validSupportSession(session: Stripe.Checkout.Session, product: string) {
  const amount = Number(session.metadata?.amount);
  const lines = session.line_items;
  const intent = session.payment_intent;
  if (session.livemode || !session.id.startsWith("cs_test_") || session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid" || session.currency !== "gbp" || session.metadata?.app !== SUPPORT_APP || !Number.isSafeInteger(amount) || amount < MIN_PENCE || amount > MAX_PENCE || session.amount_total !== amount || lines?.has_more || lines?.data.length !== 1 || lines.data[0]?.quantity !== 1 || lines.data[0]?.price?.product !== product || lines.data[0]?.price?.unit_amount !== amount || lines.data[0]?.price?.currency !== "gbp" || lines.data[0]?.price?.type !== "one_time" || !intent || typeof intent === "string" || intent.status !== "succeeded" || intent.amount !== amount || intent.currency !== "gbp") return false;
  const charge = intent.latest_charge;
  return !!charge && typeof charge !== "string" && !charge.refunded && charge.amount_refunded === 0 && !charge.disputed;
}
export async function confirmedSupport(id: string, token: string, config = supportConfig(), client = supportClient(config)) {
  if (!/^cs_test_[A-Za-z0-9]{10,200}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) return false;
  const session = await client.checkout.sessions.retrieve(id, {expand: ["line_items", "payment_intent.latest_charge"]});
  return session.metadata?.browser_hash === browserHash(token) && validSupportSession(session, config.product);
}

// Bounded per-process limits. A global bucket also limits clients that rotate
// cookies/IP headers. No IP addresses or payment details are retained.
const buckets = new Map<string, {count: number; expires: number}>();
export function allowSupportRequest(token: string, now = Date.now()) {
  for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key);
  const keys = ["global", browserHash(token)];
  if (keys.some((key, i) => (buckets.get(key)?.count || 0) >= (i === 0 ? 30 : 5))) return false;
  for (const key of keys) {const old = buckets.get(key); buckets.set(key, {count: (old?.count || 0) + 1, expires: old?.expires || now + 60000});}
  return true;
}
