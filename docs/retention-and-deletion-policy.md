# Money Quest — Retention and Deletion Policy

## Technical mechanisms already implemented

| Data | Retention period | Mechanism | Automatic? |
|---|---|---|---|
| Login attempt log | 7 days rolling | `delete_old_login_attempts()` (`0018_login_rate_limiting.sql`) | Function exists; scheduling is a deployment step |
| Everything tied to a specific child | Until that child is removed | `ON DELETE CASCADE` from `children` on every child-scoped table | Yes — immediate, triggered by the parent's own action |
| Everything tied to an account | Until account deletion | `deleteAccount()` — deletes the `parents` row (cascading to every child), purges the login-attempt log by email, then deletes the actual Supabase Auth credential | Yes — immediate, triggered by the parent's own action |
| Anonymous analytics | Indefinite | N/A — contains no identifier, so there is nothing to delete "for" a specific person | N/A |

## What this policy commits to

- No personal data is kept "just in case" beyond the periods above.
- The one time-bound log (login attempts) exists for a narrow, stated security purpose and is deleted automatically once that purpose's relevant window has passed.
- A parent-triggered deletion (removing a child, or deleting the whole account) is immediate and complete — not queued, not "eventually," and (as of this session) not leaving a residual email behind in the login-attempt log either.

## Genuine gap, stated plainly

The retention function exists and is correct, but is not currently scheduled to run automatically — it needs to be invoked periodically (a cron job, a Supabase Edge Function on a schedule, or an external scheduler hitting a protected endpoint). This is a real, specific, and easy-to-close deployment gap — listed in the final readiness report's YELLOW category, not silently assumed done.
