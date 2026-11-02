# Money Quest — Retention and Deletion Policy

> Rewritten during the 2026 launch-readiness audit: an earlier version of this policy described account/login data held in a Supabase database. That architecture has been fully removed — see `docs/dpia.md` for the current data-flow picture this policy now matches.

## What's actually retained, and where

| Data | Where it lives | Retention period | Deletion mechanism | Automatic? |
|---|---|---|---|---|
| Learning-level/currency preference, learning progress, XP, badges | The visitor's own browser `localStorage` — never on any server operated by this website | Until the visitor (or whoever uses that device) clears it | "Reset Progress" in the app, or clearing the browser's site data for this website | Immediate when triggered; never automatic, since there is no server-side timer to run — there is simply nothing on our side to expire |
| Error reports (only if `ERROR_REPORTING_WEBHOOK_URL` is configured) | Whatever third-party service receives the webhook — outside this codebase | Governed by that service's own policy | Outside this codebase's control | **[LEGAL REVIEW NEEDED: if this is enabled in production, document the receiving service's retention period here explicitly rather than leaving it unstated.]** |

## What this policy commits to

- No personal data is held on any server operated by this website — there is nothing to retain centrally, by design, because nothing is sent centrally.
- The only "deletion" that matters happens entirely on the visitor's own device, is immediate, and never requires contacting anyone.
- If this architecture ever changes (for example, if a future feature introduces any server-side storage of personal data), this policy will be rewritten before that feature ships, not after.

## Why the previous version of this document no longer applies

The previous policy described `deleteAccount()`, a Supabase Auth credential, and a rolling login-attempt log — all part of an account-based architecture that has been removed in full. There is no account to delete and no login-attempt log to retain, because there is no login. This isn't a gap in the current implementation; it's the direct consequence of there being no server-side personal data at all for a retention schedule to apply to.
