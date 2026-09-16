# Money Quest — Data Breach Response Procedure

A procedure, not a guarantee that a breach won't happen. Written to be actually followed, not filed away.

## 1. Detect
Currently relies on: application error reporting (`/api/report-client-error`, `src/lib/monitoring/report-error.ts` — functional once `ERROR_REPORTING_WEBHOOK_URL` is set), the `/api/health` endpoint, and Supabase's own project-level security alerts. A genuine gap: no automated anomaly detection (e.g. a sudden spike in failed logins beyond what the rate limiter itself throttles) exists yet — a human reviewing logs periodically is the current detection method beyond automated blocking.

## 2. Contain
- Revoke/rotate the affected credential immediately (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, or `GROWNUP_GATE_SECRET`, depending on what's compromised).
- If the breach involves unauthorized database access, use Supabase's dashboard to restrict network access or pause the project while investigating.

## 3. Assess
- What data was actually exposed? Cross-reference against the Data Inventory (`dpia.md` section 4) — a breach of `anonymous_events` (no identifier) is categorically different from a breach of `children` or `parents`.
- How many individuals are affected?
- Is this a UK GDPR-notifiable breach? (Generally: a breach likely to result in a risk to individuals' rights and freedoms must be reported to the ICO within 72 hours of becoming aware of it — this determination should be made with a lawyer, not by this document.)

## 4. Notify
- ICO (if notifiable): within 72 hours of becoming aware, via the ICO's own breach-reporting service.
- Affected families: if the breach is likely to result in a high risk to them specifically (UK GDPR Art. 34), notify them directly and without undue delay, in clear language — not buried in a generic policy update.
- Internally: whoever holds operational responsibility for the app should be notified immediately regardless of notifiability thresholds.

## 5. Remediate
- Fix the root cause before restoring full access.
- Add a regression test covering the specific vulnerability where possible (matching this project's existing practice — every security finding in `money-quest-security-audit.md` has a corresponding automated test).

## 6. Document
Keep a record of every breach (even ones assessed as not notifiable) — what happened, what data was affected, what was done, and why notification was or wasn't required. The ICO can ask to see this record even for breaches you decided not to report.

## Genuine gap

This procedure has not been tested via a real drill (a simulated breach exercise). That is a reasonable early post-launch activity, not a pre-launch blocker on its own — but it should happen before this procedure is trusted in a real incident.
