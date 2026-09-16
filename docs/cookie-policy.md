> DRAFT — for lawyer review. Under UK PECR, strictly-necessary cookies are generally exempt from the consent-banner requirement (they're needed for a service the user has explicitly requested, like staying signed in) — this is stated as general ICO guidance, not a legal conclusion for your specific deployment.

# Money Quest — Cookie Policy

We use exactly two cookies. Both are strictly necessary and first-party — neither is used for tracking, advertising, or analytics.

| Cookie | Purpose | Duration | Type |
|---|---|---|---|
| Supabase Auth session cookie | Keeps you signed in | Session-managed by Supabase's own library | Strictly necessary |
| `mq_grownup_verified` | Remembers that you've entered your Grown-up Mode PIN, so you're not re-asked on every page | 30 minutes, httpOnly, secure, sameSite=lax | Strictly necessary |

No third-party cookie is ever set by this application — verified by inspecting every cookie-setting call site in the codebase this session.

Because both cookies above are strictly necessary for a service you've actively asked for (staying signed in; not re-entering a PIN on every page), they generally do not require a cookie-consent banner under current UK PECR guidance. This is stated here so a lawyer reviewing this policy can confirm the conclusion, not so the app can skip a step it should have taken.
