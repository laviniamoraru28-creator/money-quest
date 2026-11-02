# Stripe Checkout integration: remaining setup

Scenario A applies. One production Checkout Session creation call exists in [src/app/api/shop/checkout/route.ts](src/app/api/shop/checkout/route.ts). Only its session parameters were changed. Stripe Node SDK is pinned to 23.1.0, so `ui_mode` is `hosted_page`. Client initialization and its default API version remain unchanged. No dependencies, routes, middleware, webhook handlers or infrastructure were added.

## Order association restored, deployment still pending

The owner authorized completing the integration after Checkout Studio configuration. The checkout route now sends the existing fulfilment metadata and `client_reference_id` again. Both the signed-webhook handler and browser ownership check retain their validations. No validation is bypassed. Adaptive pricing is explicitly disabled to preserve the fixed quoted GBP amount.

The previous parameter-only update removed these fields and could accept payment without delivering the archive. `scripts/test-checkout-session.ts` now executes the actual route for both products in both modes, captures its emitted fields, and passes those exact fields to `validatePaidSession`. This closes the fixture-only coverage gap. It also verifies cookie/reference/hash binding and that rejected choices, origins and preflight failures never create a Session.

Keep `MONEYQUEST_COMMERCE_MODE=off` until final private archives, host configuration and a complete hosted sandbox payment/email/download test are ready. Source-level repair is not a deployed or end-to-end payment verification. Automatic tax remains disabled; merchant tax treatment is still a separate unresolved fact.

## Verified Stripe state on 30 October 2026

The connected live Money Quest account is `acct_1UVYX9QZFq5acwqx`. Account readback confirms charges and payouts enabled, no currently due/past due verification fields, website `moneyquesteducation.com`, and support email `moneyquesteducation@gmail.com`. Bank payout scheduling is manual and was not changed. No bank details are reproduced here.

| Product | Live Product | Verified live Price | GBP total |
| --- | --- | --- | --- |
| Money Quest Family Adventure Pack | `prod_VWfbAO1o5BVjIE` | `price_1UWDjcQZFq5acwqxjp58bWKT` | £5.99 |
| Money Quest 12-Week Adventure Journal | `prod_VWfeErMkSZ33nd` | `price_1UWDjaQZFq5acwqxqB1XcyfK` | £7.99 |

Both Prices are active, one-time and tax-inclusive in Stripe. That API flag is not a VAT assessment. Product names were updated successfully through Stripe. Their descriptions and internal metadata retain editorial/test wording because final paid PDFs are unverified. No new products, Prices, payment links, Checkout Sessions or webhook endpoints were created. A standalone Payment Link is not required for this existing server-created Checkout flow. The latest account snapshot also lists an eventual VAT-related requirement with no current deadline; do not supply an invented identifier.

## Values to Replace

The call has no `sample_only` placeholders or missing sample fields. It preserves the existing one-time `mode: "payment"`, actual application success/cancel routes, and environment-backed product prices. `{CHECKOUT_SESSION_ID}` is Stripe's required substitution template, not a value to replace. A `price_` prefix alone does not mean an ID is a placeholder.

Files containing environment examples that need completion before deployment:

- [.env.commerce.example](.env.commerce.example)
- [.env.local.example](.env.local.example)
- [docs/commerce-release.example.json](docs/commerce-release.example.json), private release template only.

| Field | Current configuration | What to set |
| --- | --- | --- |
| mode | `payment` | Keep for the current one-time PDF products. |
| success_url | `${config.origin}/en/parents/shop/success?session_id={CHECKOUT_SESSION_ID}&checkout=${tag}` | Keep the route and substitution. Configure the actual site origin. |
| cancel_url | `${config.origin}/en/parents/shop?cancelled=1` | Keep the actual return route. Configure the actual site origin. |
| line_items[].price | `process.env[product.priceEnv]` | Set each product's environment variable to an active price in the intended Stripe account/environment. |
| NEXT_PUBLIC_SITE_URL | `.env.local.example` uses `https://your-production-domain.example`; code fallback is `https://moneyquesteducation.com` | Your actual clean HTTPS origin. The local example is a placeholder. |
| MONEYQUEST_STRIPE_FAMILY_PRICE_ID | Existing sandbox ID `price_1UVcFuHDC3WzcjKr1sehD6Qe` | Sandbox only. Live: `price_1UWDjcQZFq5acwqxjp58bWKT` (GBP 599 pence, one-time inclusive). |
| MONEYQUEST_STRIPE_JOURNAL_PRICE_ID | Existing sandbox ID `price_1UVcIxHDC3WzcjKrDcvarmph` | Sandbox only. Live: `price_1UWDjaQZFq5acwqxqB1XcyfK` (GBP 799 pence, one-time inclusive). |

No credentials or host environment files were changed. The verified live IDs above are configuration references, not credentials; `.env.commerce.example` retains sandbox defaults and commerce off.

## Configured Parameters

File: [src/app/api/shop/checkout/route.ts](src/app/api/shop/checkout/route.ts).

| Parameter | Value |
| --- | --- |
| ui_mode | `hosted_page` |
| billing_address_collection | `auto` |
| phone_number_collection | `{ "enabled": false }` |
| automatic_tax | `{ "enabled": false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |
| adaptive_pricing | `{ "enabled": false }` |
| client_reference_id | Server-generated checkout tag, also present in the success URL/cookie name. |
| metadata | Existing app/product/English locale/consent/terms/browser hash; live sessions also include immutable contract ID/account/terms acceptance. No buyer email or raw cookie nonce. |
| payment_method_collection | Omitted because `mode` is `payment`, as required by rule 8. For subscriptions the configured value would be `always`. |

Preserved fields: `mode`, `success_url`, `cancel_url`, `line_items` and all Checkout Studio display/collection parameters. The follow-up restores required `metadata`, `client_reference_id` and fixed-GBP `adaptive_pricing`. `locale`, `customer_creation` and `custom_text` remain omitted. The second-argument idempotency request option is unchanged; it is not a Session parameter.

## Setup and Next Steps

1. Deploy and validate the order-association repair before accepting any payments. Keep `MONEYQUEST_COMMERCE_MODE=off` during deployment preparation.
2. Use Node 24 and the existing lockfile (`npm ci`). Stripe 23.1.0 is already a dependency. Do not install a second SDK or add a browser key to this server-hosted flow.
3. Configure existing variable names in host secrets. Server-only: `MONEYQUEST_STRIPE_KEY`, `MONEYQUEST_STRIPE_WEBHOOK_SECRET`, `MONEYQUEST_ORDER_SIGNING_SECRET`, `MONEYQUEST_ORDER_DIRECTORY`, `MONEYQUEST_DOWNLOAD_DIRECTORY`, both product price variables above. For live mode also configure `MONEYQUEST_DOCUMENT_ROOT`, `MONEYQUEST_LIVE_RELEASE_FILE`, and `MONEYQUEST_SMTP_HOST`, `MONEYQUEST_SMTP_PORT`, `MONEYQUEST_SMTP_USER`, `MONEYQUEST_SMTP_PASSWORD`, `MONEYQUEST_SMTP_FROM`. Use the actual public origin in `NEXT_PUBLIC_SITE_URL`. Names match the existing code; this is Next.js, not Vite. Never prefix server secrets with `NEXT_PUBLIC_`.
4. Use separate sandbox/live credentials and prices. Existing live checks require a restricted `rk_live_` key, verified merchant account, active charges/payouts and matching inclusive GBP prices. Complete the seller, terms, privacy, tax and final archive details in a private release JSON based on the linked template. Store paid archives and orders outside the application and public document root. Verify the transactional mailbox and host storage.
5. Register the existing HTTPS `/api/shop/webhook` endpoint in the matching Stripe environment. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and configure its signing secret. The existing handler verifies signatures and payment state. Webhook delivery is required for automatic fulfilment after the repaired code is deployed.
6. After deploying the repair, run `npm run shop:check`, then perform a complete sandbox purchase. Test success, cancellation, delayed payment, webhook retries, email, recovery/download, refund/dispute rejection and duplicate-event handling. The new route test checks emitted fields against fulfilment validation; full hosted Stripe/SMTP/browser evidence is still required.
7. In sandbox only, test card `4242 4242 4242 4242`, any future expiry and any three-digit CVC. Use `4000 0000 0000 9995` for insufficient funds and `4000 0025 0000 3155` for authentication. Never use these in live mode or a real card in automated tests.
8. Confirm final products, lawful seller/tax/terms information, actual inbox delivery and host deployment before switching the commerce mode. No live payments or account changes were performed by this task.

### Project structure and flow

The existing checkout route creates a Session, the signed webhook validates settled payment and fulfils the immutable order, and the browser return verifies its cookie/hash/reference before retrieving a download token. Live confirmation mail also supports a customer who never returns to the browser. Existing refund/dispute, amount/price, archive and private-storage checks remain intact.

### Validation

Verified locally on Node 24.22.1: `npm run typecheck`, `npm run lint`, `scripts/test-checkout-session.ts`, `scripts/test-commerce.ts`, `scripts/test-live-commerce.ts` and `git diff --check` all pass. The new route regression test is automatically discovered by `npm run test:unit`. No full build/browser suite was run for this focused server-side repair.

No actual Stripe payment, external email, bank settlement, final paid PDF review or host deployment is established by the local tests. No live payment is initiated as part of this repair.

### Resources

- https://docs.stripe.com/payments/checkout/custom-success-page
- https://docs.stripe.com/metadata
- https://docs.stripe.com/testing
- https://docs.stripe.com/keys-best-practices

Further operational details: [docs/live-commerce-readiness-20261030.md](docs/live-commerce-readiness-20261030.md) and [docs/deployment-runbook.md](docs/deployment-runbook.md). This file is the current entry point for Stripe setup.
