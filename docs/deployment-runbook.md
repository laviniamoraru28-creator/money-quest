# Money Quest — Deployment Runbook

Concrete, copy-pasteable steps. Written for whoever actually operates the deployment — items marked **[HUMAN]** cannot be automated or done by an AI assistant; they need a person with real account access and, in one case, real legal qualification.

## 1. Pre-deployment (one-time setup)

1. **[HUMAN]** Create a Supabase project (or use an existing one).
2. Run all 19 migrations in order:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. **[HUMAN]** In the Supabase dashboard → Authentication → Settings: set minimum password length to 8+ (matching the app's own check), review the default rate limits.
4. **[HUMAN]** Enable Point-in-Time Recovery: Supabase dashboard → Database → Backups → enable PITR. This is not on by default and costs extra on some tiers — check your plan.
5. **[HUMAN]** Run one real restore drill: clone the project to a staging instance from a backup, confirm the data actually comes back, before trusting this for real families' data. Document the actual restore time.
6. Set environment variables on your hosting platform (never commit these):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, treat as a full-access secret
   - `GROWNUP_GATE_SECRET` — generate with `openssl rand -hex 32`
   - `NEXT_PUBLIC_SITE_URL` — your real production domain
   - `ERROR_REPORTING_WEBHOOK_URL` — optional, see §3
7. **[HUMAN]** Point a monitoring service at `https://<your-domain>/api/health` — UptimeRobot, Better Stack, or your host's own uptime monitor, checking every 1-5 minutes, alerting on a non-200 response.

## 2. Deploy

```bash
npm install
npm run typecheck
npm run test:unit          # should show 21/21 passing before you deploy
npm run build
```
Deploy the build to your host (Vercel or any Node-compatible platform).

## 3. Error reporting

`src/lib/monitoring/report-error.ts` posts a JSON payload to `ERROR_REPORTING_WEBHOOK_URL` if set. Options:
- **Sentry** (recommended for production): `npm install @sentry/nextjs`, run `npx @sentry/wizard@latest -i nextjs`, then point `reportError`'s call sites at `Sentry.captureException` instead of the webhook. Richer stack traces, release tracking, breadcrumbs.
- **A simple webhook** (Slack, Better Stack, a custom endpoint): just set `ERROR_REPORTING_WEBHOOK_URL` — no code change needed, works today.
- **Neither configured**: errors still reach your hosting platform's own logs (Vercel's log viewer, etc.) via `console.error` — not nothing, but not alerting either.

## 4. Post-deploy smoke test

Run through this by hand once, on the real production URL, before telling anyone it's live:
1. Sign up a real test account, complete onboarding.
2. Complete one lesson, one game — confirm XP/coins increase.
3. Create a savings goal, contribute to it.
4. Enter Grown-up Mode, view the child's progress and weekly report.
5. Delete the test account, confirm you're signed out and the login redirect works.
6. Check `/api/health` returns `200 {"status":"ok"}`.
7. **[HUMAN, ideally]** Run `npm run test:e2e` against the real URL — these journeys have never executed against a live environment; this is the first real chance to catch an integration issue the offline audits couldn't.

## 5. Rollback

Keep the previous build's deployment available (most hosts keep prior deployments one click away). If a migration needs rolling back, Supabase migrations in this project are additive-only by design (no migration drops a table another depends on) — reverting the *application* deployment without reverting the database is the normal, low-risk path; only revert a migration itself if you're certain no already-written data depends on the columns it added.

## 6. What this runbook does not cover

A live penetration test and a lawyer's review of the legal checklist are not deployment steps — they're prerequisites that should happen *before* step 1, not after. See `money-quest-launch-audit.md`.
