# Public reviews and owner approval

Reviews are reached from the global menu. No homepage or footer promotion.
Both ratings and comments remain private until the owner approves them. Public totals are calculated only from approved records. Existing approved comments are retained. Rejected records are removed from the private queue.

Storage defaults to `../moneyquest-private/reviews.json` outside the application. An existing absolute `MONEYQUEST_REVIEW_STORE_PATH` still takes precedence. Keep this directory outside the hosting document root, preserve it across deployments and include it in private backups. New directory/file permissions are 700/600.

Email notifications go only to `moneyquesteducation@gmail.com`. Configure the existing TLS SMTP variables securely on the host:

- `MONEYQUEST_SMTP_HOST`, `MONEYQUEST_SMTP_PORT` (465 or 587)
- `MONEYQUEST_SMTP_USER`, `MONEYQUEST_SMTP_PASSWORD`, `MONEYQUEST_SMTP_FROM`
- `MONEYQUEST_REVIEW_MODERATION_KEY`, a random secret of at least 32 bytes
- `NEXT_PUBLIC_SITE_URL`, the clean HTTPS production origin

No credentials belong in Git, the production ZIP, or public files. A notification contains a signed 30-day link scoped to one review. Opening the link only loads that review; approval/rejection requires an explicit button click and a same-origin authenticated POST. GET requests never publish content. The owner key still provides access to the full queue. The moderation page has noindex and no-referrer metadata.

If SMTP is unavailable, the saved review remains private and the unsent notification remains queued. After configuration or an outage, run `node --require ./host-env.cjs --import tsx scripts/retry-review-notifications.ts` from the application root. This sends up to 25 queued notices and marks only successfully sent notifications. A periodic hosting job may run the same command with the app's Node environment. Do not enable a periodic job until the sender mailbox has been verified. Normal submission tries only that submission's notification.

Tests inject a synthetic mail transport, verify message destination, signed-link tampering/expiry, per-review authorization, retry handling and publication only after approval. Real SMTP delivery requires a configured mailbox and must be verified on hosting. The UI must not claim email delivery has been verified before that happens.
