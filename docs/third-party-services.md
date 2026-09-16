# Money Quest — Third-Party Services

Audited as instructed: for every external service, why it's needed, what it receives, whether it can identify or track a user, and whether it can be removed.

**After this redesign, Money Quest uses zero external services.** There is no database, no authentication provider, no analytics platform, no advertising network, and no AI/LLM provider anywhere in the application.

## What changed

Before this redesign, the website depended on Supabase (database and authentication) and, in an earlier session, an AI provider for a chat feature. Both are gone:

- Supabase — removed entirely. There is no longer anything for it to store, since accounts, child profiles, and server-side progress no longer exist. See `docs/data-flow-inventory-pre-redesign.md` for the audit that led to this, and `archive/README.md` for where the old schema is kept as historical record.
- AI provider — removed in an earlier session, before this redesign began.

## Hosting

The website itself still needs to be hosted somewhere to be reachable at all (any static or server-rendered site does). A hosting provider can see standard web server logs (IP addresses, requested URLs, timestamps) as an inherent part of serving any website over the internet — this is not something specific to Money Quest's own code, and is true of essentially any website. It is listed here for completeness and transparency, not because Money Quest's own code sends anything to a hosting provider beyond what's required to serve the page.

## Optional, not currently active

An error-reporting webhook (`ERROR_REPORTING_WEBHOOK_URL`) can optionally be configured to receive a JSON payload — message, stack trace, and page path — if a technical error occurs. It is entirely optional, receives no information about a specific child (there's no child data anywhere in the app to include), and the website works identically whether or not it's configured.
