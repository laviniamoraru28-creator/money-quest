# Monthly Claude review procedure

This is what a Claude Code session does when the monthly "Money Quest monthly audit review" scheduled trigger fires. It reuses the existing auditor (`.github/workflows/website-quality.yml`, `scripts/website-audit/*`) and the existing test suites. It does not run its own audit, does not create a second auditor, and does not consume the Money Quest educational AI assistant's own API budget (it runs under this Claude Code session's own usage, not `MQ_AI_*`/the lesson assistant's provider key).

Read this document in full before doing anything else. If anything here conflicts with an explicit instruction from the repository owner given directly in chat, the owner's instruction wins — but nothing in this document authorizes skipping the "never" rules below.

## Never

- Never merge the PR this procedure opens. Never merge any PR. That is the owner's decision alone.
- Never deploy to Namecheap, and never touch production (`https://moneyquesteducation.com`) in any way.
- Never add a paid API key, subscription, or monitoring service. Never spend money. If a fix seems to require one, stop and describe the fix and its cost in the PR instead of applying it.
- Never weaken, skip, or delete a test to make a check pass. Never silently substitute an asset or regenerate artwork.
- Never touch Explorer's comic lessons, narration, or activities except to fix a verified, specific bug in them — and then with the smallest change that fixes it.
- Never touch the TikTok Studio workflow/code (`tiktok-studio/`, `.github/workflows/tiktok-studio.yml`) or the Lesson AI Assistant's provider wiring (`src/lib/lesson-assistant/*`, `MQ_AI_*`) unless the audit itself flagged a specific, verified bug there — these are other, separate workstreams.
- Never open a second review PR while an earlier one from this same procedure is still open. Check first (see step 0).

## Step 0 — check whether this cycle should do anything at all

1. **Date gate.** The trigger fires weekly (every Monday) so a missed week can't push the month past its window, but only the first Monday of the month (UTC day-of-month 1–7) is a real review. If today is not in that window, stop immediately — do nothing else, touch nothing.
2. **Open-PR gate.** List open pull requests on `laviniamoraru28-creator/money-quest` whose branch name starts with `audit-fix/`. If one is already open, this cycle is done: do not open another. Optionally leave one short comment on the existing PR only if this month's audit surfaced something materially new that PR doesn't cover; otherwise just stop.
3. **New-audit gate.** Find the most recent *completed, broad-profile* run of `.github/workflows/website-quality.yml` on `main` (the monthly scheduled run, or a manual `workflow_dispatch` broad run if the schedule was skipped for some reason). Read `docs/audit-reviews/last-reviewed.json` on `main`. If that run's id already equals `lastReviewed.runId`, there is nothing new to review — stop.

Only proceed past here once all three checks say to.

## Step 1 — read the audit report

1. Download the `money-quest-audit` artifact from the run identified in step 0.3.
2. Read `audit-report.md` in full, and `comparison.json` for the Newly-detected / Previously-observed / Awaiting-baseline buckets it's built from.
3. Classify every finding into one of the twelve categories the owner cares about: broken buttons/navigation, missing/incorrect images, accessibility, mobile layout, audio/Listen, translation errors (across the nine languages), educational inaccuracies, duplicated lessons/activities, incorrect age-level content, broken games/interactive exercises, performance, security/technical errors. A finding that doesn't fit one of these (e.g. a Lighthouse score delta with no clear cause) still gets recorded, just not forced into a category.
4. Assign each a severity: **Critical** (broken core functionality, a security issue, or content a child could be harmed or badly misled by), **High** (a real bug with real user impact but a workaround exists, or affects one locale/band rather than all), **Medium** (a real but minor/cosmetic issue), **Low** (a nitpick, or something the report itself flags as informational/Lighthouse-delta-only).

## Step 2 — verify before touching anything

For every finding you intend to act on:

1. Reproduce it against current `main` — the report can be stale by days. Read the actual file/component/translation it names. For a browser-journey finding, re-run just that spec if you can (see Step 4's testing note on running e2e via the hosted workflow rather than assuming a local browser).
2. Decide: **confirmed** (still real, as described), **false positive** (not actually broken, or the report misread something), or **already resolved** (fixed by something else since the report ran). Record which, and why, for the PR body. Don't fix a false positive or an already-resolved finding — just note it.
3. For a confirmed finding, judge whether it's safe to fix this cycle: a small, well-scoped, low-risk change you can verify with the existing test suites, OR a finding that specifically needs a new regression test anyway. If it's large, ambiguous, needs a product/design decision, or you can't verify your fix well enough to trust it — don't fix it. Describe it in the PR as a finding for the owner to decide on instead. Fixing nothing is a perfectly good outcome for a cycle if nothing confirmed is safe to fix.

## Step 3 — implement

Only once you have at least one confirmed, in-scope, verifiable fix:

1. Branch from current `main`: `audit-fix/<YYYY-MM-DD>` (today's date).
2. Apply the smallest reliable correction for each fix. Preserve existing content and functionality — this is a repair, not a refactor or a redesign. For anything touching Explorer, keep the comic lessons, their narration, and the activities that follow each lesson exactly as they are unless the bug is specifically in one of them.
3. Add or update a regression test for each fix, in the same style as the existing spec files (see `e2e/journeys/*.spec.ts` and `scripts/test-*.ts` for the house style). A fix with no test coverage added or updated is not done.
4. If a finding affects translations, re-check the correction against all nine locales (`src/i18n/config.ts` → `LOCALES`), not just English.
5. If a finding affects accessibility, verify against the existing axe/keyboard/focus/reduced-motion checks, not just visually.

## Step 4 — validate

Run what the repository already runs, in this order, stopping to fix forward (not to weaken the check) on any failure:

1. `npm run lint`
2. `npm run typecheck`
3. Start a local Redis (`redis-server --daemonize yes`) and run `MQ_TEST_REQUIRE_REDIS=true npm run test:unit` — all suites, not just ones you think are related.
4. `npm run build`
5. Whatever Playwright specs are most directly relevant to the fix, if a working local Chromium is available in this environment. If it is not (a fresh Claude Code Remote container does not reliably have one preconfigured the way some longer-lived sessions do), do not skip e2e verification — instead push the branch and open the PR as a **draft**, then watch the `pull_request`-triggered run of `website-quality.yml` on it (same pattern used to land PR #59) as the real verification, and only mark the PR ready for review once that hosted run is green. Never claim e2e coverage you did not actually see pass somewhere real.
6. Re-read your own diff once, adversarially, before pushing: what would make this fail in CI that your local run didn't catch?

## Step 5 — open the PR

1. Push the branch.
2. Open one PR (draft if waiting on hosted CI per Step 4.5, else ready-for-review) titled `Monthly audit review: <YYYY-MM-DD>`. The body must include, for this cycle:
   - The audit run it's based on (link to the `website-quality.yml` run and its `money-quest-audit` artifact).
   - Every finding considered, grouped Critical→Low, each marked confirmed-and-fixed, confirmed-but-deferred (with why), false-positive, or already-resolved.
   - What was actually changed, and the regression tests added/updated for each fix.
   - Full test results (lint/typecheck/unit/build, plus the hosted e2e run's outcome once known).
   - An explicit line: "Not merged automatically. Not deployed. Awaiting your review."
3. Do not request your own review. Do not approve. Do not merge.

## Step 6 — record the cycle

Whether or not anything was fixed, as part of the same PR (same branch, same commits — never pushed straight to `main`):

1. Update `docs/audit-reviews/last-reviewed.json`: set `lastReviewed` to this cycle's run id/url/date, today's date, and this PR's URL (state `"open"`); append the previous `lastReviewed` entry (if any) to `history` first.
2. Add `docs/audit-reviews/<YYYY-MM>.md`, a short monthly report: date of the audit, counts (issues detected / confirmed / corrected / false positives / remaining), tests completed, the PR link, and a one-line recommendation for next month (e.g. "re-run the Lighthouse sample after the CDN change lands" or "nothing outstanding").

If step 0 stopped the cycle early (nothing new, or a prior PR still open), skip step 6 entirely — there is nothing to record, and `last-reviewed.json` must not be touched outside an actual review PR.

## Where this fits

- The audit itself: `.github/workflows/website-quality.yml` (scheduled, gated to the first Monday of the month by its own "Check monthly schedule window" step), `scripts/website-audit/*`, `docs/website-quality-auditor.md`.
- This procedure's trigger: a Claude Code scheduled trigger (not a GitHub Action — a GitHub Actions runner cannot invoke a personal Claude subscription). It runs under the owner's existing Claude Code usage, not a separate billed API key, so it adds no new recurring cost beyond their existing plan's usage.
- The durable state this procedure reads and writes: `docs/audit-reviews/last-reviewed.json` and the dated reports beside it — committed to the repo, not GitHub Actions cache, so they don't expire.
