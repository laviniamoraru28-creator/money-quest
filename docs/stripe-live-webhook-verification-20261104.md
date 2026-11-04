# Stripe LIVE webhook verification, 4 November 2026

## Confirmed directly in Stripe

Account: Money Quest, `acct_1UVYX9QZFq5acwqx`. Read-only API verification confirmed:

| Setting | Verified value |
| --- | --- |
| Endpoint | `we_1UY3SfQZFq5acwqx8rQLYTO8` |
| Mode | LIVE, `livemode=true` |
| Status | `enabled` |
| URL | `https://moneyquesteducation.com/api/shop/webhook` |
| Events | `checkout.session.completed`, `checkout.session.async_payment_succeeded` |
| Handler | `src/app/api/shop/webhook/route.ts` |
| Activity price | `price_1UWDjcQZFq5acwqxjp58bWKT`, active LIVE, one-time GBP 599 minor units, inclusive |
| Journal price | `price_1UWDjaQZFq5acwqxqB1XcyfK`, active LIVE, one-time GBP 799 minor units, inclusive |

No endpoint was created or changed. No signing secret or API key was retrieved. No payment, refund, Checkout Session or recipient email was created. An enabled endpoint does not establish that the currently deployed website receives or fulfils its events.

## Security and delivery checks

The existing handler already matches the endpoint. It verifies the Stripe signature against the bounded original request body, including Stripe's timestamp tolerance, and rejects the wrong payment environment. It only fulfils the two configured session events when the application metadata matches and `payment_status` is `paid`.

Fulfilment retrieves the expanded session again from Stripe. It validates the settled payment, correct mode, application/product metadata, accepted consents, merchant/immutable contract, amount, currency, Price and quantity. Refunded or disputed payments are refused. Orders use a persistent session ID, filesystem lock and atomic rename. Concurrent completed and asynchronous-success events for one session produce one order. Ordinary repeated events do not resend confirmation. SMTP acceptance followed by a process crash before marker persistence can repeat an email on retry; exactly-once email delivery is not claimed. This code does not charge a customer from a webhook.

Downloads require the configured origin, an unexpired signed token, stored order, successful confirmation and current payment revalidation. LIVE archive bytes and SHA-256 must match the accepted contract. Files remain private and responses use `no-store`, `noindex` and `no-referrer`.

The existing live-commerce test now calls the actual webhook and download route handlers. Synthetic fixtures cover unsigned/wrong/expired/tampered signatures, wrong mode, irrelevant events, unpaid and foreign-app notifications, a paid notification contradicted by an unpaid retrieved session, concurrent delivery of both event types, repeated notification, successful private ZIP bytes, altered/expired tokens, wrong origin and download revocation after refund. SDK session retrieval and SMTP are stubbed and restored in `finally`; these route tests contact no external payment or email service. Existing tests also cover incorrect totals/Prices/contracts, disputes, archive integrity and SMTP retries.

## Namecheap configuration status

This session has no authenticated Namecheap hosting access. Host variables are unverified, not declared missing merely because they are unavailable locally. No claim is made that the signing secret is installed or matches the endpoint. Do not paste secrets into this report, GitHub, an archive or chat.

| Required variable | Expected configuration |
| --- | --- |
| `MONEYQUEST_COMMERCE_MODE` | `live` for live preflight/activation; default remains `off` |
| `MONEYQUEST_STRIPE_KEY` | Mode-matched restricted `rk_live_` key for the Money Quest account |
| `MONEYQUEST_STRIPE_WEBHOOK_SECRET` | The `whsec_` signing secret of the existing endpoint above |
| `MONEYQUEST_ORDER_SIGNING_SECRET` | Persistent private signing material, at least 32 bytes |
| `MONEYQUEST_STRIPE_FAMILY_PRICE_ID` | LIVE activity Price ID above |
| `MONEYQUEST_STRIPE_JOURNAL_PRICE_ID` | LIVE journal Price ID above |
| `NEXT_PUBLIC_SITE_URL` | `https://moneyquesteducation.com` |
| `MONEYQUEST_ORDER_DIRECTORY` | Persistent private absolute directory; live orders use its `live` subdirectory |
| `MONEYQUEST_DOWNLOAD_DIRECTORY` | Private absolute directory with approved content-addressed product ZIPs |
| `MONEYQUEST_DOCUMENT_ROOT` | Actual public document root from cPanel |
| `MONEYQUEST_LIVE_RELEASE_FILE` | Private absolute final release JSON with reviewed seller/policies and exact archive hashes |
| `MONEYQUEST_SMTP_HOST` | Actual transactional SMTP hostname |
| `MONEYQUEST_SMTP_PORT` | `465` or `587`, with TLS |
| `MONEYQUEST_SMTP_USER` | Actual SMTP username |
| `MONEYQUEST_SMTP_PASSWORD` | Actual SMTP credential, kept private |
| `MONEYQUEST_SMTP_FROM` | Verified sending mailbox |

`MONEYQUEST_HOST_ENV_FILE` is optional when variables are set directly in cPanel. If used, it must point to a private absolute `commerce.env` outside the application and document root, permissions `600`. Existing cPanel environment variables take precedence over file values.

Exact manual installation and restart instructions are in [namecheap-installare-ro.md](namecheap-installare-ro.md#6-webhook-și-verificare). Run `npm run shop:check` in the application's Node 24 environment after loading the private settings. It checks configuration, archives, live account/Prices and SMTP authentication without creating a payment or sending an email. It does not compare the signing secret with Stripe's unretrievable stored secret or prove inbox delivery. Hosted signed-event delivery remains unverified until the deployed handler and private configuration can be checked. A real-money test requires the owner's explicit approval.

## Release gate

Local validation on Node 24.22.1: ESLint passed; TypeScript passed; all 51 unit/validation suites passed, including the expanded actual webhook/download route checks; production build and offline-manifest generation passed; `git diff --check` passed. These are source/runtime tests with synthetic payment fixtures, not a hosted Namecheap purchase. No browser, host installation or live signed-event delivery result is claimed for this update.

Baseline inspected: `main` at `e351ffafb7f6a09e2631af73f53b09002e02debb`. This change preserves all runtime payment code and the homepage image. It adds route regression coverage and corrects deployment documentation, including the example file's misleading SANDBOX label on verified LIVE Prices.

At inspection, PR #20 still reports incomplete Library artwork and conflicts; PR #31 is draft with missing animation assets/QA; PR #34 and #35 are draft pending QA; PR #36 is draft with an editorial blocker in the supplied bonus PDF and private-host installation outstanding. These PRs are not approved finished release material. Older stacked drafts may already overlap main and must not be merged blindly.

The owner authorizes merging completed verified work only after existing release work is finished, immediately before production packaging. No final production ZIP is created by this webhook verification. The final report must include this verified endpoint, unresolved hosting checks, final main SHA, build/test evidence and the ZIP SHA-256. Never include the signing secret or private merchant configuration.
