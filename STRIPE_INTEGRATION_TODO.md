# Stripe Checkout integration: remaining setup

Scenario A applies. One production Checkout Session creation call exists in [src/app/api/shop/checkout/route.ts](src/app/api/shop/checkout/route.ts). Only its session parameters were changed. Stripe Node SDK is pinned to 23.1.0, so `ui_mode` is `hosted_page`. Client initialization and its default API version remain unchanged. No dependencies, routes, middleware, webhook handlers or infrastructure were added.

## Release blocker

Do not enable purchases with this configuration yet. The requested removal of every session parameter absent from Field Intents removes `metadata` and `client_reference_id`. Existing fulfilment and browser order verification require them:

- [src/app/api/shop/webhook/route.ts](src/app/api/shop/webhook/route.ts) acknowledges but skips sessions without `metadata.app`. No automatic delivery occurs for these sessions.
- [src/lib/commerce/stripe.ts](src/lib/commerce/stripe.ts) rejects sessions missing product, consent, terms and contract metadata.
- [src/app/api/shop/order/route.ts](src/app/api/shop/order/route.ts) additionally requires `metadata.browser_hash` and `client_reference_id` to verify the purchaser's browser.

A payment can therefore succeed without granting the download or sending its confirmation. These files were left unchanged as requested. Before opening sales, reconcile the configured field list with these requirements, then either explicitly permit the required session metadata/reference or commission a separate change to the existing fulfilment association and ownership verification. Do not bypass those checks. Automatic-tax collection is disabled as requested; confirm the seller's tax treatment separately.

Removing these parameters also leaves pre-existing `createHash`, `APP_ID` and `letters` unused in the route. Surrounding code was deliberately left unchanged. See validation below.

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
| MONEYQUEST_STRIPE_FAMILY_PRICE_ID | Existing sandbox ID `price_1UVcFuHDC3WzcjKr1sehD6Qe` | Keep only for its matching sandbox; use a verified GBP 599-pence, one-time inclusive live price for live mode. |
| MONEYQUEST_STRIPE_JOURNAL_PRICE_ID | Existing sandbox ID `price_1UVcIxHDC3WzcjKrDcvarmph` | Keep only for its matching sandbox; use a verified GBP 799-pence, one-time inclusive live price for live mode. |

No real account IDs, credentials, prices or example files were changed by this task.

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
| payment_method_collection | Omitted because `mode` is `payment`, as required by rule 8. For subscriptions the configured value would be `always`. |

Preserved sample fields: `mode`, `success_url`, `cancel_url`, `line_items`. Removed unconfigured fields: `adaptive_pricing`, `client_reference_id`, `locale`, `customer_creation`, `metadata`, `custom_text`. The second-argument idempotency request option is unchanged; it is not a Session parameter.

## Setup and Next Steps

1. Resolve the release blocker above before accepting any payments. Keep `MONEYQUEST_COMMERCE_MODE=off` during deployment preparation.
2. Use Node 24 and the existing lockfile (`npm ci`). Stripe 23.1.0 is already a dependency. Do not install a second SDK or add a browser key to this server-hosted flow.
3. Configure existing variable names in host secrets. Server-only: `MONEYQUEST_STRIPE_KEY`, `MONEYQUEST_STRIPE_WEBHOOK_SECRET`, `MONEYQUEST_ORDER_SIGNING_SECRET`, `MONEYQUEST_ORDER_DIRECTORY`, `MONEYQUEST_DOWNLOAD_DIRECTORY`, both product price variables above. For live mode also configure `MONEYQUEST_DOCUMENT_ROOT`, `MONEYQUEST_LIVE_RELEASE_FILE`, and `MONEYQUEST_SMTP_HOST`, `MONEYQUEST_SMTP_PORT`, `MONEYQUEST_SMTP_USER`, `MONEYQUEST_SMTP_PASSWORD`, `MONEYQUEST_SMTP_FROM`. Use the actual public origin in `NEXT_PUBLIC_SITE_URL`. Names match the existing code; this is Next.js, not Vite. Never prefix server secrets with `NEXT_PUBLIC_`.
4. Use separate sandbox/live credentials and prices. Existing live checks require a restricted `rk_live_` key, verified merchant account, active charges/payouts and matching inclusive GBP prices. Complete the seller, terms, privacy, tax and final archive details in a private release JSON based on the linked template. Store paid archives and orders outside the application and public document root. Verify the transactional mailbox and host storage.
5. Register the existing HTTPS `/api/shop/webhook` endpoint in the matching Stripe environment. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and configure its signing secret. The existing handler verifies signatures and payment state. Webhook delivery is required for automatic fulfilment once the association blocker is resolved.
6. After resolving the blocker, run `npm run shop:check`, then perform a complete sandbox purchase. Test success, cancellation, delayed payment, webhook retries, email, recovery/download, refund/dispute rejection and duplicate-event handling. Existing unit fixtures contain metadata; their success alone does not prove that a session created with this new parameter list can be fulfilled.
7. In sandbox only, test card `4242 4242 4242 4242`, any future expiry and any three-digit CVC. Use `4000 0000 0000 9995` for insufficient funds and `4000 0025 0000 3155` for authentication. Never use these in live mode or a real card in automated tests.
8. Confirm final products, lawful seller/tax/terms information, actual inbox delivery and host deployment before switching the commerce mode. No live payments or account changes were performed by this task.

### Project Structure and Flow

New file: this `STRIPE_INTEGRATION_TODO.md` only. Changed source: the Session parameter object in the existing checkout route only.

Existing intended flow: adult selects a product and consents, server checks availability and saves a live purchase contract, creates Checkout, browser redirects to Stripe, signed paid webhook validates and records the order, confirmation email and authenticated download follow. Current configured sessions stop at the existing metadata checks as described above. No new customer, subscription or database persistence was added.

### Validation

Checked locally on Node 24.22.1:

- `npm run typecheck`: passed, including SDK types for every configured parameter.
- `npm run lint`: passed. The configuration does not reject the now-unused pre-existing symbols noted above.
- `node --import tsx scripts/test-commerce.ts`: passed.
- `node --import tsx scripts/test-live-commerce.ts`: passed with synthetic loopback Stripe fixtures and local mail doubles only.
- An in-memory TypeScript AST check confirmed the exact allowed Session fields, unchanged real sample values, unchanged idempotency request option, SDK 23.1.0, and byte-identical surrounding code.
- `git diff --check`: passed.

No live Stripe API request, card charge, external email or complete sandbox Checkout-to-download test was performed. Existing fixture tests do not resolve the release blocker. No production build/browser test was repeated for this parameter-only change.

### Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- https://docs.stripe.com/testing
- https://docs.stripe.com/keys-best-practices

Further operational details: [docs/live-commerce-readiness-20261030.md](docs/live-commerce-readiness-20261030.md) and [docs/deployment-runbook.md](docs/deployment-runbook.md). This file is the entry point and current source of truth for the Checkout Studio changes and their remaining setup.
