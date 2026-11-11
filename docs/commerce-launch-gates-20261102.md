# Money Quest paid shop: launch gates (2 November 2026)

Status: **BLOCKED / NO LIVE SALES**. This is a read-only audit and operational checklist, not a product approval or a payment test. Branch intentionally separate from navigation PR #11. Do not merge or deploy solely because this document exists.

## Verified in main source
- `src/content/shop.ts` lists `family-adventure-pack` at 599 pence and `adventure-journal` at 799 pence. Both have `releaseReady:false`. Product descriptions promise nine languages, three editions and two visual variants, including supported/SEND material.
- `src/app/api/shop/checkout/route.ts` already creates Stripe-hosted payment sessions and includes metadata used for fulfilment. No new payment code is needed merely to display a payment link.
- `src/lib/commerce/config.ts` requires mode-specific credentials, signing secrets, a private release and matching private archives. `scripts/shop-preflight.ts` checks technical readiness, not legal, editorial or end-to-end readiness.
- `scripts/generate-localized-worksheets.py` generates 180 public lesson-linked worksheet PDFs and nine answer guides. **These are not proof that either complete paid product exists.**
- `docs/commerce-release.example.json` has placeholder merchant, terms, privacy, tax and archive hash/size fields. Never deploy it as-is.
- `STRIPE_INTEGRATION_TODO.md` records live Stripe Prices for £5.99 and £7.99 and account verification as of 30 October. Recheck before activation.

## Product acceptance: Family Adventure Pack, £5.99
- [ ] Private final multilingual archive exists, is not under `public/`, and is not part of Namecheap deploy ZIP.
- [ ] Nine language editions are present, each with three intended editions and two visual variants. Verify exact archive inventory against actual storefront claims.
- [ ] Every PDF opens, renders correctly, prints A4 at 100%, and respects left binding margin.
- [ ] Activities and illustrations agree; questions, answers and age levels are accurate. Review supported/SEND alternatives for usability, not medical claims.
- [ ] Adult guides, picture cards, cut-and-stick material and all promised inclusions are actually present.
- [ ] Human language review and proofread completed for all nine locales; no missing, English-only or misleading edition.
- [ ] Archive byte count and SHA-256 match the private release manifest.

## Product acceptance: Adventure Journal, £7.99
- [ ] Private final multilingual archive exists outside public paths.
- [ ] Nine language editions, three levels and two visual variants match the listing.
- [ ] Each edition has 39 A4 pages, 12 undated weeks, Discover/Try/Reflect structure, 25 mm binding margin and the promised adult guide.
- [ ] All journal prompts, examples, page numbering and illustrations match their intended levels and language.
- [ ] Human language, print and accessibility review completed.
- [ ] Archive byte count and SHA-256 match private release manifest.

## Merchant and hosting acceptance
- [ ] Actual legal seller, geographic business address, support contact and full consumer terms are privately configured and reviewed.
- [ ] UK VAT/tax treatment and selling markets decided for each product; do not infer from Stripe's tax-inclusive price flag.
- [ ] Adult purchase privacy statement, retention and complaints/recovery process reviewed.
- [ ] Namecheap production secrets configured privately: `MONEYQUEST_STRIPE_KEY`, `MONEYQUEST_STRIPE_WEBHOOK_SECRET`, `MONEYQUEST_ORDER_SIGNING_SECRET`, both live Price IDs, private order/archive directories, `MONEYQUEST_DOCUMENT_ROOT`, `MONEYQUEST_LIVE_RELEASE_FILE`, SMTP host/port/user/password/from.
- [ ] Private storage persists across ZIP deployment and rollback; no secrets, paid files or customer data in GitHub, `public/`, offline cache or release ZIP.
- [ ] Correct HTTPS `/api/shop/webhook` configured for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, with signing secret; monitor errors.
- [ ] Sender email is authenticated and actual delivery/recovery confirmed; scheduled `npm run shop:deliver` retry configured.
- [ ] Run `npm run shop:check` on final host; record date, source commit and redacted PASS/BLOCKED lines.

## End-to-end acceptance before live activation
- [ ] Hosted sandbox purchase for both products, with correct price, metadata and consent.
- [ ] Cancellation and declined payment create no download.
- [ ] Webhook signature failure, duplicate events and delayed success handled.
- [ ] Actual confirmation email reaches external inbox; customer can download the correct purchased archive.
- [ ] Expired link/recovery works; unauthorized download is rejected.
- [ ] Refund/dispute blocks subsequent access as designed.
- [ ] Test phone and desktop checkout, seller/terms/privacy text, and rollback with commerce off.
- [ ] After approval, perform controlled live smoke purchase and verify real settlement, fulfilment and customer support. Record evidence privately, not buyer data in repository.

## Launch decision
**NO-GO** until all above gates are evidenced. Keep `MONEYQUEST_COMMERCE_MODE=off`. A green CI build, a valid Stripe account, or existing free PDFs do not prove sellable paid deliverables. Do not flip to live merely to test the checkout.

Source references: `src/content/shop.ts`, `src/lib/commerce/config.ts`, `src/app/api/shop/checkout/route.ts`, `scripts/shop-preflight.ts`, `scripts/generate-localized-worksheets.py`, `docs/live-commerce-readiness-20261030.md`, `STRIPE_INTEGRATION_TODO.md`, `docs/commerce-release.example.json`.
