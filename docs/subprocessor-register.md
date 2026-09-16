# Money Quest — Third Party / Subprocessor Register

Exactly one external service processes any data at all — verified by inspecting every server-side outbound network call in the codebase.

| Subprocessor | What it receives | Why | Data retained by them |
|---|---|---|---|
| **Supabase** (database + authentication hosting) | All application data — every table in this database, including child profiles and progress | Supabase is the database and authentication host — this is infrastructure, not a feature | Governed by Supabase's own data processing agreement and infrastructure region settings — confirm Supabase's DPA terms and hosting region meet your requirements before launch (a YELLOW/RED item, not something this codebase can verify) |

## AI Coach — removed from V1

Anthropic (the AI Coach's model provider) previously appeared in this register. The AI Coach feature has been removed entirely from this application — see `legal-and-privacy-readiness-report.md`'s V1 simplification section. There is no AI API integration anywhere in the current codebase, no `ANTHROPIC_API_KEY`, and no data of any kind sent to Anthropic or any other AI provider.

## Explicitly not used

No advertising network, no third-party analytics SDK (Google Analytics, Mixpanel, etc.), no customer-support chat widget, no email-marketing platform integration, no payment processor (there is nothing to pay for), no social-login provider, no AI/LLM provider of any kind, no CDN-hosted third-party script of any kind. Verified by grepping every `import` statement and every outbound network call across the entire codebase.

## A genuine open item

None remaining specific to AI — see "AI Coach — removed from V1" above. Supabase's DPA/hosting region confirmation (§ above) remains a real, open YELLOW item.
