# Optional Google Search Console connection

The MVP runs without Google credentials. To enable site-specific search impressions and clicks, create a Google Cloud service account with Search Console API access, grant its service account email **restricted/read-only** access to the verified Search Console property, and configure:

- GitHub Actions secret `GSC_SERVICE_ACCOUNT_JSON`: complete service-account JSON, never committed.
- GitHub Actions variable `GSC_SITE_URL`: exact property identifier from Search Console, such as `sc-domain:moneyquesteducation.com` or `https://moneyquesteducation.com/`.

The connector uses the read-only OAuth scope `webmasters.readonly`, requests the latest 28-day period ending three days before execution, and fetches up to 1,000 query rows. Search Console may omit low-volume/anonymized queries. The workflow stores raw query CSV only in the runner's temporary directory and uploads aggregate topic counts and navigation inventory, not raw queries. The API may return 403 if the service account has not been added to the property.

Before connecting, ensure the repository's Actions secrets policy and PR trust boundary are appropriate. Secrets should not be exposed to untrusted PR code. Prefer a dedicated scheduled workflow with protected environment for credentials in a follow-up hardening change.

This is *site-specific visibility*, not total Google search demand. Do not make course decisions from impressions alone.
