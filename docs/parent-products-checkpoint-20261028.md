# Parent resources and commerce checkpoint

## Implemented
- Approved photorealistic homepage image: desktop WebP 133,864 bytes and mobile crop 69,996 bytes. The phone display is an illustrative mockup, not a screenshot of the deployed website. The child is fictional and AI-generated. Existing artwork is preserved.
- Visible parent-shop links on the homepage, including a narrow-screen header; free learning remains a separate entry point. New dark-purple action colour is #5B3D85 with white text.
- Parent guide page, two product cards, complete free samples, clear digital-only/no-shipping disclosure, one-household licence, proposed one-off GBP prices, and explicit preview status. No invented discount, rating, review or outcome claim.
- English editorial source PDFs generated outside the public repository: 20 activities in colour and reduced-distraction versions, 40 individual sheets, 4-page parent guide, 5-page answers, and 39-page/12-week journal in both visual versions. A4 with 25 mm left binding margin; single-sided at actual size. The parent can print and bind at home; no physical item is supplied. These are not tagged accessible PDFs and are not validated SEND interventions.
- Free 3-activity sample with answers (4 PDF pages) and week-one journal sample (5 pages) are public. Full paid archives are NOT committed to this public repository, served from public/, or included in the offline package. The content-builder source and full English draft are preserved in the owner's deliverable archive.
- Sandbox-only Stripe hosted Checkout, server-side price selection, separate unchecked adult/instant-supply/cancellation choices, browser-bound order lookup, signature-verified webhook, paid-session/price/amount/currency verification, refund/dispute rejection, private order records and signed 90-day repeat-download links. Session IDs and tokens never appear in third-party analytics; no analytics were introduced. Success/recovery URLs are noindex and excluded from sitemap/offline learning.
- Sandbox downloadable confirmation includes consent version and private recovery URL. No real payment has been taken and no live checkout has been enabled.

## Sandbox catalogue created with owner-selected account
Account: `acct_1UVTeNHDC3WzcjKr`, Money Quest sandbox, livemode=false.
- Family Adventure Pack: product `prod_VWfbAO1o5BVjIE`, price `price_1UVcFuHDC3WzcjKr1sehD6Qe`, GBP 5.99.
- Adventure Journal: product `prod_VWfeErMkSZ33nd`, price `price_1UVcIxHDC3WzcjKrDcvarmph`, GBP 7.99 (proposed, not a validated willingness-to-pay result).
No API key or webhook signing secret was retrieved or committed. Connected Stripe account access does not itself configure hosting credentials.

## Tests and launch gates
Unit coverage exercises token tampering/expiry, private directory checks, idempotent order writes, payment/price/consent mismatches, refunds/disputes and real Stripe webhook signature verification. End-to-end tests cover parent page accessibility, narrow-screen navigation, actual free PDF responses, disabled unconfigured checkout and noindex order routes. Record execution results after the real CI run; added tests are not passing evidence until executed.

Live commerce deliberately remains unsupported in this checkpoint. Still required:
1. Complete and review all nine language versions of the website, PDFs, journal and answer guides. English drafts are not presented as finished translations.
2. Owner/editorial review of educational content and real print testing; child/family usability and assistive-technology checks. Reduced-distraction layouts alone do not establish SEND suitability.
3. Verified seller identity/address/contact, final consumer terms and privacy/retention, tax/VAT treatment and territories. No automatic_tax was enabled or tax-registration assumption made.
4. Automatic durable order confirmation, verified support mailbox and recovery process. A downloadable sandbox receipt is not claimed sufficient for live consumer-law compliance.
5. Private persistent hosting directories and backup/retention policy, a restricted sandbox API key, webhook secret, externally reachable webhook endpoint, and end-to-end sandbox payment/duplicate event/refund/recovery checks. Test keys must be configured through a secure environment channel, not chat.
6. Owner approval before a separate live-mode implementation/configuration, merge or deployment. No live keys, live products, real charges or hosting changes here.

Order JSON has no customer email, name, date of birth or child data. Stripe processes adult payment/billing data. A recovery token is a bearer credential: keep it private. Downloads re-check payment state before access. Hosting logs and retained event/account data need their own privacy policy. Storage uses atomic replacement and exclusive per-order locks; a crash can leave a lock/tmp file requiring authorised maintenance. This is suitable for review on a single-instance Node host, not a claim of multi-region durability or abuse-proof protection.

The existing free worksheets, Library, Museum, three learning levels, Godot files and main branch are preserved.

## Executed verification for this checkpoint

Local Node 24.22.1: clean npm ci with existing package versions preserved, lint, TypeScript, all 25 unit/content suites and production build passed. All generated PDF text glyphs were checked against page safety bounds, with zero out-of-bounds glyphs. Representative worksheet, cover and journal spread images were visually inspected; the initial cover overlap was corrected before delivery. Free PDFs were recompressed using JPEG scene images without changing text or page geometry (approximately 172 KB and 248 KB). Full-page/browser accessibility and actual checkout execution for the new shop still require recorded execution; a passing unit signature test is not a completed card purchase.

The preceding offline correction passed all 180 browser checks in Node 24 CI run 40751529034. That run predates this shop/hero checkpoint and must not be used as evidence for its new pages.

## Live implementation authorization, 30 October 2026

The owner explicitly authorized implementing real payments without further routine approvals. The earlier sandbox-only implementation/approval notes above are historical. See docs/live-commerce-readiness-20261030.md for the current dual-mode implementation, actual technical evidence and external prerequisites. Only the sandbox account was connected at inspection; no live key, charge, hosting change or deployment was made.
