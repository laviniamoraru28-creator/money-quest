# Money Quest — External Services Audit

Every external service this application depends on, audited against: is it necessary, what does it receive, can it be removed, can it be replaced with something simpler. Verified by inspecting every outbound network call and every import in the codebase — not a generic list of "what a typical website uses."

| Service | Purpose | Data received | Why needed | Can it be removed? | Can it be simplified further? |
|---|---|---|---|---|---|
| Supabase (Postgres database + Auth) | The application's entire database and user authentication | Every table in the schema — account emails, child profiles, learning progress | Core infrastructure — there is no functioning app without a database and a way to authenticate parents | No — this is not an optional add-on, it is the application's data layer | No — this is already the simplest practical choice (one managed service covering both database and auth, instead of two separate services) |
| Anthropic (AI API) — REMOVED | Previously powered the AI Coach | Previously: message text | N/A | Removed this session — the entire feature it supported has been deleted | N/A |

## That's the complete list

No advertising network is currently live (house creatives only — see `advertising-architecture.md`). No analytics SDK (the app's own first-party, identifier-free analytics table requires no external service at all). No email-marketing platform, no customer-support widget, no CDN-hosted third-party script, no payment processor, no social-login provider, no exchange-rate API (currency data is predefined and local — see `currency-architecture.md`), no translation API (all copy is local JSON files — see `messages/en.json`, `messages/ro.json`).

After this session's AI Coach removal, Money Quest depends on exactly one external service: Supabase. This is as close to the minimum practical number of dependencies as a database-backed, authenticated web application can reach.

## Optional, not currently active

`ERROR_REPORTING_WEBHOOK_URL` (see `deployment-runbook.md` section 3) — if set, error reports are forwarded to a webhook (Sentry, Slack, etc.). With it unset, the app functions identically, just without that alerting — this is genuinely optional infrastructure, not a hidden dependency the app requires to run.
