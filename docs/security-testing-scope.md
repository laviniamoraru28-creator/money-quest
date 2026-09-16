# Money Quest — Scope Document for External Security Testing

For handing to a penetration-testing firm. Written to save them (and you) time — not a substitute for their own methodology.

## Application summary
Next.js 14 web app, children's financial-literacy product (ages 6-14). Supabase (Postgres + Auth) backend, Anthropic API for an in-app AI tutor. No mobile app, no file uploads, no user-generated content, no user-to-user contact.

## Priority areas (test these first)
1. **Cross-family data isolation.** The single most important property in this app: one family must never reach another's data. Try direct object reference attacks against `/parent/child/[childId]`, `/dashboard?child=[id]`, and every Server Action taking a `childId` parameter. `e2e/journeys/07-cross-family-access.spec.ts` documents the specific attack paths already considered — treat that as a starting point, not the full test.
2. **Grown-up Mode PIN gate** (`/grown-up-gate`) — the boundary between the child-facing and parent-facing experience. Test PIN brute-forcing, session token forgery/replay, and whether the gate can be bypassed via direct URL access to `/parent/*` routes.
3. **AI Coach** (`/api/coach`) — prompt injection attempts to extract the system prompt, bypass output moderation, or get the model to discuss unsafe topics with a child. Also test the CSRF protection directly (cross-origin POST attempts) and rate-limit bypass.
4. **Authentication** — login brute-force (an app-level rate limiter exists; confirm it can't be bypassed via IP rotation or parallel requests), password reset flow, session fixation.

## Known-fixed issues (confirm these, don't assume)
See `money-quest-security-audit.md` and `money-quest-launch-audit.md` for the full list of previously-found-and-fixed issues (JSON-LD XSS, CSRF on `/api/coach`, login rate limiting). A good pentest re-verifies fixes, not just hunts for new bugs.

## Explicitly out of scope
- Denial-of-service / load testing (test separately, with the hosting provider's knowledge)
- Physical security
- Social engineering of staff

## What "done" looks like
A written report categorizing findings by severity (CRITICAL/HIGH/MEDIUM/LOW), with reproduction steps. CRITICAL and HIGH findings should block launch until fixed and re-verified.
