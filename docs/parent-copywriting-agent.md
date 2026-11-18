# Parent Communication & Copywriting Strategist

Generates four distinct editorial briefs each month for parents and carers, writes and lints drafts against those briefs, and tracks translation/approval status through to a human-reviewed Draft PR. Topics rotate across all eight required subject areas: financial education, entrepreneurship and creativity, leadership and decision-making, emotional intelligence and self-regulation, future skills, inclusive education and SEND, practical family activities, and building independence and confidence.

## What it does today

1. **`create_briefs()`** — picks four topics for the current month from a 12-topic catalog (`TOPICS`), using `select_topics()` to take a fresh, non-overlapping block each month (see "Fixed: topic repetition bug" below) and excluding any topic whose slug already matches a live `/learn` article (`live_article_slugs()`, read directly from `src/content/articles.ts`) or one this agent has already drafted before (`previously_drafted_slugs()`). Optionally folds in Learning Intelligence's own ranked-topic signal when that report's output artifact exists (`consult_learning_intelligence()`) — never imports PR #72's code, only its JSON output, and is explicit when that signal is unavailable rather than guessing.
2. **`lint_draft()`** — the mechanical half of the "quality review" workflow stage. Rejects a draft that's missing a required field, has a title/description outside search-friendly length bounds, has no concrete at-home activity, links its call-to-action anywhere outside `ALLOWED_CTA_SLUGS` (the real, live Money Quest routes — no social platform, ever), or contains a banned fabrication/pressure phrase (fake statistics, guarantees, urgency language, etc.).
3. **`translation_status()`** — reports which of the nine supported locales a draft already has a *reviewed* translation for (a stub translation without `reviewed: true` never counts as complete), so "do not publish incomplete or machine-translated content without quality checks" is enforced in code, not just policy.
4. **`editorial_report()`** — the standard Coordination-Hub-compatible JSON envelope (`mode: read_only`, `safe_to_auto_merge: false`), plus this agent's own `drafts`, `duplicate_warnings` (any draft slug that collides with an already-live article) and `limitations`.

This agent still **never writes to `src/content/articles.ts` or `messages/*.json` directly**, never calls a paid API, and never posts to Facebook or TikTok. A draft only reaches the live site through a separate, human-approved Draft PR — this script's job ends at producing and linting a reviewable draft.

## Fixed: topic repetition bug

The original implementation advanced its rotation index by 1 per *month* while consuming 4 topics per *month* — with an 8-topic catalog that meant 3 of every month's 4 topics were identical to the previous month's, directly contradicting "avoid repeating previously covered subjects." `select_topics()` now advances the start position by `per_month` (4) each month, so with a 12-topic catalog every month gets a disjoint block and the full catalog cycles exactly once every 3 months with zero repeats inside a cycle. Regression-tested in `test_parent_copywriting_agent.py::SelectTopicsRotationTest`.

## Who writes the actual prose

No paid writing API is used or proposed. Within this environment, the Claude Code session that runs the Agent Coordination Hub's daily scheduled poll is the authorized writer: it reads a brief, drafts the article, runs it through `lint_draft()`, and — only for a draft that passes every check — prepares a separate Draft PR. This is the same pattern already used for every other agent's "safe, verified fix" path; see `docs/agent-coordination.md`. **Unattended, scheduled article drafting has not yet been demonstrated** on a real cron firing — see the integration report for what has been demonstrated (one manually-triggered sample) versus what remains to be proven on the next real scheduled run.

## Run and test

```
python3 scripts/parent_copywriting_agent.py
python3 -m unittest discover -s scripts -p 'test_parent_copywriting_agent.py'
```

## Integration

Registered with the Agent Coordination Hub (PR #78) as "Parent Copywriting Strategist" — its workflow now carries a `pull_request` dry-run trigger (tests only) and a scheduled/dispatch-only "Deliver summary to Claude through GitHub issue" step, matching every other agent's convention, so the Hub's digest finds it by title pattern the same way it finds the rest of the fleet.
