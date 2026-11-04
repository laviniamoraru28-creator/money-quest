# Parent Toolkit free purchase bonus

Branch: `feature/parent-toolkit-free-bonus`, based on main `e351ffafb7f6a09e2631af73f53b09002e02debb`.

## Source PDF and release blocker

Located the exact `Little_Minds_Smart_Money_Illustrated.pdf` supplied by the owner. Technical verification: eight A4 pages, five embedded Meta AI illustrations, 1,662,500 bytes, unencrypted, no JavaScript, readable text, no replacement glyphs or out-of-page text. All eight rendered pages were visually inspected. The PDF was not rewritten or replaced.

SHA-256: `1d3e2d2b3666562786cbeffdd413bb572d3fd29a0bf372df63f2b34261d93833`.

Page 8 still describes the material as an "expanded working draft" and says the final illustrated edition will include verified references and matched artwork. This contradicts its description as a completed final guide. Resolve that editorial note before publishing it to customers. No unfinished alternative guide has been substituted, and the other four Parent Toolkit guides have not been added.

The original source remains in the owner's existing private ChatGPT file. Only a WebP rendering of its original first-page cover is committed. The complete PDF is deliberately absent from Git, public/, offline assets and this public repository. No unrestricted PDF URL exists.

## Secure storage and activation

The server expects the PDF inside its existing `MONEYQUEST_DOWNLOAD_DIRECTORY`, outside both the application directory and `MONEYQUEST_DOCUMENT_ROOT`. Its content-addressed filename is:

`parent-toolkit-little-minds-smart-money-1d3e2d2b3666562786cbeffdd413bb572d3fd29a0bf372df63f2b34261d93833.pdf`

No LIVE key, signing secret, product, Stripe Price or product amount is changed. The existing merchant/release, SMTP, paid ZIP and readiness rules remain in force. The new shop page disables purchase controls when the bonus is not installed, and the checkout route verifies it again before creating any Stripe Session. A missing or corrupt bonus therefore cannot start a new charge. Existing paid orders can still retrieve their original product using the existing mechanism.

After editorial resolution and normal code review, an operator with Namecheap access must:

1. Obtain the exact approved original PDF privately. Do not upload it to public_html, public/, or Git.
2. Make it available at an absolute private source path on the host, keeping the existing private download directory and document-root settings.
3. Run `npm run shop:install-parent-bonus -- /absolute/private/source/Little_Minds_Smart_Money_Illustrated.pdf` from the application, using the existing private environment configuration. The installer verifies exact bytes and SHA-256, writes with mode 0600 and verifies the destination again.
4. Run `npm run shop:check`. The extra bonus-integrity readiness check must pass alongside the existing product, merchant and SMTP checks.
5. Complete a staged sandbox purchase and confirm host mail/download delivery before production activation.

If the editorial note is corrected in the PDF, it becomes a new file version. Update the pinned size/hash, content-addressed filename and version in `src/lib/commerce/parent-bonus.ts` to that approved file before installation. Retain historical private versions for existing orders. Never bypass checksum validation to install a changed document.

This task verified installation using the exact original PDF in isolated private local storage. It did not install anything on Namecheap, change the live environment, send customer mail, make a charge, merge main or generate a deployment ZIP.

## Customer experience

`ParentGuideBonus` adds an illustrated promotion to the existing shop, using the original cover with its full A4 aspect ratio. It lists the requested age groups, practical activities and inclusive adaptations. Copy is complete in EN, RO, ES, FR, DE, IT, PT, NL and PL. Every edition explicitly says the bonus PDF is English only. The guide is not a purchasable SKU or an extra checkout line item.

After verified purchase, `ShopOrder` displays the original product and confirmation controls plus a separate localized parent-guide download button. Recovery tokens are checked on the server before either download control is displayed. Invalid or unpaid references display the existing localized recovery/retry message. Query strings and recovery fragments are removed from the address bar as before.

The preview uses the site's cream/sage design, responsive layout and existing night view. Buttons support keyboard activation. No complete PDF is embedded in the page or exposed as a public preview.

## Payment and delivery mechanism

- Checkout retains one existing paid Stripe Price and its unchanged amount. The server adds bonus ID/version/hash metadata and, for live purchases, an immutable bonus descriptor in the existing private purchase-contract snapshot.
- The existing signed webhook handles paid `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The server retrieves and validates the Stripe payment, amount, price, currency, product, settlement and refund/dispute state. Live bonus metadata must match the saved contract.
- `fulfillSession` verifies the private bonus before issuing a new entitled order, stores the descriptor alongside the existing order, and reuses `saveOrderOnce` and the confirmation lock/marker. Duplicate or concurrent webhook deliveries preserve the original entitlement and expiry; there is no separate bonus email or duplicate file-copy side effect.
- `/api/shop/download` keeps the existing signed order token, private order lookup, payment revalidation, same-origin POST rule and existing expiry. `asset=parent-guide` selects the order's server-stored PDF descriptor; it never accepts a client filename. The default download remains the purchased ZIP.
- Both live and sandbox confirmation text name the English-only free guide. Live confirmation uses the existing single email and private recovery link, which opens both downloads. No email attachment or public PDF link is introduced.
- Bonus bytes are checked for exact size, PDF signature and SHA-256 on access. Paths resolving inside the app or document root, including public symlinks, are rejected. Responses use `private, no-store`, noindex/nofollow, nosniff and attachment headers.
- The bonus has the order's existing 90-day expiry. Older orders without a recorded entitlement keep their original product access and do not acquire an unverified bonus from a URL parameter.

## Validation

- TypeScript: passed.
- ESLint: passed.
- Full unit/validation suite: 52/52 passed; the checkout suite additionally verifies that missing bonus integrity prevents Stripe Session creation.
- New security suite executes the production authorization, download, order-recovery and webhook route bodies with synthetic payment services. It covers successful product/PDF downloads, token tampering, absent/unpaid/expired orders, origin/asset restrictions, corrupt or missing bonus bytes, public symlinks, old order preservation, concurrent fulfillment, signed webhook retries/asynchronous success, immutable live metadata and one confirmation email.
- Existing Stripe SDK loopback tests cover settlement, amount/Price, refund/dispute rejection, merchant checks and existing durable confirmation. No real Stripe calls, payments or recipient emails are used.
- Production build under Node 24.22.1: passed, including the existing worksheet/offline generation steps. Only the cover is added to public assets.
- New browser tests: 40/40 passed, desktop Chromium and Pixel 7 emulation. All nine promotional and success/download interfaces are checked, including full-cover loading, no overflow, night-view controls and keyboard focus. A complete mocked shop-to-Stripe-to-success journey downloads both files and recovers both entitlements on both layouts. Unverified and legacy orders withhold the bonus. The successful download page passes axe WCAG 2 A/AA and 2.1 AA checks.
- Existing parent-shop browser regression suite: 22/22 passed on desktop/mobile. Its recovery test now enforces the new server-verification step before download controls appear.
- Browser screenshots were visually reviewed on desktop light mode and mobile dark mode. Browser transaction/download payloads are fixtures; the real supplied PDF was separately verified and privately installed in local tests.

## Remaining blockers

1. Resolve the final-guide/editorial-draft contradiction on page 8.
2. Install the approved PDF in Namecheap's existing private download directory. Hosting access is not available in this session, so no host or LIVE-delivery pass is claimed.
3. Follow the existing production review/release process; this feature is proposed as a draft PR and must not merge automatically. Existing commerce launch gates, including unreleased products, are unchanged.
