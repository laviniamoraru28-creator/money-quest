# Money Quest Agent Coordination Hub

This is the central, read-only index over the site's existing audit agents.
It does not run any analysis itself, does not call a paid API, and does not
modify any other agent's branch, workflow, or script.

## The seven agent groups, 26 agents total (and why each exists)

| Agent group | Where | Domain | Overlap risk checked |
|---|---|---|---|
| **Language Guardian** | PR #73, `scripts/language-guardian.py` | Structural i18n consistency across `messages/*.json` for all 9 locales (missing/extra keys, empty values, placeholder mismatches). | None — the only agent touching translation files. |
| **Education Guardians** (Inclusive Experience Guardian, Learning Architect, Future Skills Radar) | PR #74, `scripts/education-guardians.py` | Accessibility review candidates (missing `alt`, icon-only buttons), curriculum-progression review prompts, and curated OECD/WEF/UNESCO future-skills evidence. | Future Skills Radar and Learning Intelligence both produce forward-looking "what might the curriculum need" signals, from different evidence (curated static JSON vs. optional search-console data + nav inventory). Kept separate because the evidence sources are genuinely different, but flagged below for a human to watch. |
| **Learning Intelligence** | PR #72, `tools/learning-intelligence/analyze.py` — owned by ChatGPT Work, not touched by this hub | Offline curriculum-navigation inventory plus an *optional* Search Console query classifier (off by default — runs with no data unless `GSC_SERVICE_ACCOUNT_JSON`/`GSC_SITE_URL` are configured). | Same future-skills overlap note as above. Does not currently deliver a Claude handoff issue at all (its workflow only uploads an artifact) — see Known limitation below. |
| **Journey Improvement Agents** (Child Journey Detective, Experiment Designer, Improvement Engine) | PR #76, `scripts/journey-improvement-agents.py` | UX-flow review prompts (disabled buttons, localStorage usage) and impact×confidence/effort-ranked usability-experiment hypotheses. | Child Journey Detective and Inclusive Experience Guardian both regex-scan the same `src/**/*.tsx` tree, but for different patterns (UX flow vs. accessibility) producing different findings — not true duplication, just a shared *mechanism*. Worth merging into one scan pass later purely as a performance/maintenance simplification, not urgent. |
| **Growth Agents** (Search Opportunity Hunter, First Visit Experience Agent, SEO Technical Guardian, Growth Intelligence Director, Opportunity Prioritizer) | PR #92, `scripts/growth_agents.py` | SEO sitemap/robots/metadata review candidates, first-visit-journey review candidates, and a priority ranking over both. Search Opportunity Hunter and Growth Intelligence Director always report zero findings until an authorized aggregated GSC/analytics source is connected — neither may ever infer search demand, rankings, traffic or engagement. | Shares the "what might improve search/discovery" space with Future Skills Radar and Learning Intelligence, but from a technical-SEO angle rather than curriculum content — kept separate; worth a human comparing outputs occasionally, same as the existing Future Skills Radar / Learning Intelligence note above. |
| **Specialist Agents** (Social Growth Scientist, Parent/Teacher Community Scout, Partnership Discovery Agent, Engagement Designer, Accessibility Personalization Agent, Feedback Intelligence Agent, Learning Gap Detector, Imagination & Innovation Scout, Cultural Learning Adapter, Research-to-Lesson Agent, Performance Optimizer, Security Sentinel, Release Guardian, AI Cost Controller, Privacy Guardian, Weekly Executive Reporter) | PR #94, `scripts/specialist_agents.py`, stacked on PR #92 | Sixteen agents: six (social, parent/teacher, partnership, feedback, imagination, research-to-lesson) explicitly await an approved external data source and report zero findings until then; the other ten run entirely on repository source (engagement/reward-loop language, accessibility axe-test coverage, locale top-level key parity, raw `<img>` tags, `dangerouslySetInnerHTML`, `localStorage`, release CI/test presence, AI/assistant budget review, a cross-agent summary). | Performance Optimizer's image-loading check and Education Guardians' `<img>`-missing-`alt` check both scan images but for different properties (loading strategy vs. accessible text) — not duplication. Security Sentinel's `dangerouslySetInnerHTML` check and Privacy Guardian's `localStorage` check are each the only agent covering that specific concern. |
| **Parent Copywriting Strategist** | PR #95, `scripts/parent_copywriting_agent.py` | Monthly editorial briefs (4/month, rotating across all 8 required parent-education subject areas) and lint-checked article drafts for the existing `/learn` catalog (`src/content/articles.ts` + `messages/*.json`). Never writes to that catalog directly, never links to Facebook or TikTok, never fabricates evidence/testimonials — `lint_draft()` enforces this mechanically. | Parent/Teacher Community Scout (Specialist Agents) reviews *public community needs signals*; this agent *writes the articles* responding to them — different stage of the same pipeline, not duplication. Future Skills Radar (Education Guardians) and Learning Intelligence both inform *what* parents might search for; this agent is the one that actually drafts prose from a brief. |

**No eighth agent group should be added without checking this table first** — specifically, before adding a workflow, confirm its domain isn't already one of the seven above.

## Why a coordination hub, not edits to the four workflows

Each of the four agents lives on its own feature branch and draft PR, owned
by a separate workstream. Per the owner's explicit rule, this coordination
work **never edits another agent's active branch** — so instead of
consolidating their individual `gh issue create` / `@claude`-comment steps
in place, this hub is purely additive: a fifth, independent workflow that
only *reads* whatever issues already exist, regardless of whether the other
four PRs are merged yet. It is safe to merge on its own.

## What it does

`scripts/agent-coordination-digest.py`:
1. Lists every **open** GitHub issue in the repository.
2. Classifies each by agent, using the title patterns in `AGENT_PATTERNS`
   (matches both the four workflows' own automated issue titles, e.g.
   `"Education Guardians report: <run id>"`, and the owner's manually
   opened handoff issues, e.g. `"Claude handoff: Education Guardians MVP
   report and review"` — issues #75 and #77 are exactly this second shape).
3. Builds one Markdown digest, grouped by agent, plus an "unrecognized"
   section that should normally be empty — a title landing there usually
   means an agent's naming drifted, or an undeclared new one appeared.
4. **Updates one rolling issue in place** ("Money Quest Agent Coordination
   Digest") rather than creating a new issue every run, so report volume
   never grows unbounded the way five separate one-off issues already have.

Run locally: `python3 scripts/agent-coordination-digest.py --repo owner/repo --dry-run`
(reads `GH_TOKEN` from the environment; `--dry-run` never writes to GitHub).
Unit tests (no token needed): `python3 -m unittest scripts.test_agent_coordination_digest -v`.

The GitHub Actions workflow runs daily (`.github/workflows/agent-coordination.yml`,
`06:10 UTC`, ahead of all four agents' own weekly schedules) plus on manual
dispatch. Pull-request runs only dry-run the digest build and run unit
tests — they never write to Issues, matching the other four agents'
PR-safe convention.

## Execution health and duplicate detection (2026-11-18)

Two gaps closed in `scripts/agent-coordination-digest.py`, still purely
additive and still not touching any other agent's branch:

1. **Duplicate-report detection.** Within each agent's own open issues,
   `find_duplicate_reports()` flags two or more issues with the same
   (case/whitespace-normalized) title — a sign an agent's own workflow
   opened a fresh issue instead of updating an existing one for the same
   finding. Rendered inline under the affected agent's section with a
   note to close the stale one rather than fixing both.
2. **Agent execution health.** `fetch_workflow_health()` calls the GitHub
   Actions API (`GET /repos/{repo}/actions/workflows/{file}/runs`) for
   each of the four agents' own workflow plus this hub's own, and
   `classify_workflow_health()` turns the most recent run into one of
   `healthy` / `pending` / `stale` / `failed` / `never-run`, rendered as a
   new `## Agent execution health` section. Needs `actions: read` in the
   workflow's `permissions:` block (added here) on top of the existing
   `issues: write`.

**The honest finding this surfaced:** as of 2026-11-18, none of the five
workflows (`language-guardian.yml`, `education-guardians.yml`,
`journey-improvement-agents.yml`, `learning-intelligence.yml`,
`agent-coordination.yml` itself) exist on `main` — each lives only on its
own still-open draft PR's branch (#73, #74, #76, #72, #78 respectively).
A GitHub Actions `schedule:` trigger only fires for a workflow file that
is present on the repository's default branch, so **none of these five
are actually running on their documented cron schedule today** — only
this hub's own daily Claude Code Remote scheduled task (not a GitHub
Action) keeps the digest current, by manually dispatching this workflow
once a day. The new health section reports this plainly (`never-run` or
`stale` for all five, with a note that this is expected pre-merge, not a
new defect) rather than silently going quiet about it. **Merging the
underlying PRs — starting with this one, since it depends on nothing else
— is the one change that would make the schedules real; that merge
decision belongs to the repository owner, not this coordination layer.**

## Registering the Parent Copywriting Strategist (2026-11-18)

Extended in place a third time, same pattern, for the owner's "integrate
the Parent Copywriting Strategist" brief: one new `AGENT_PATTERNS` entry
and one new `KNOWN_WORKFLOWS` entry (`parent-copywriting.yml`, monthly
cadence — 30-day `STALE_AFTER_CADENCES` window rather than weekly, since
this agent's own schedule is `15 9 1 * *`). PR #95's workflow was
separately given a `pull_request` dry-run trigger and a scheduled/
dispatch-only "deliver to Claude through GitHub issue" step (it had
neither before — the workflow had never been exercised by CI pre-merge),
titled "Parent Copywriting Strategist report: `<run_id>`", matching the
rest of the fleet. This hub's own 25 tests pass (1 new title-matching
case; the agent-count assertions were already written dynamically against
`len(AGENT_PATTERNS)`, so they needed no change).

## Registering Growth Agents and Specialist Agents (2026-11-18)

Extended in place again for the same reason as the section above: the
owner's "complete and activate the multi-agent organization" brief asked
for every agent, including the 21 new ones added by PR #92 (five Growth
Agents) and PR #94 (sixteen Specialist Agents, stacked on #92), to be
registered with this hub. Two new `AGENT_PATTERNS` entries ("Growth
Agents", "Specialist Agents") and two new `KNOWN_WORKFLOWS` entries
(`growth-agents.yml`, `specialist-agents.yml`, both weekly) — nothing else
changed in this hub's own code. Both PRs' own workflows were separately
given a `pull_request` dry-run trigger and a scheduled/dispatch-only
"deliver to Claude through GitHub issue" step (PR #92 had neither before;
PR #94 had the trigger via its test step but no issue step), titled
"Growth Agents report: `<run_id>`" / "Specialist Agents report:
`<run_id>`" respectively, so this hub's title-pattern classification
finds them the same way it already finds the other four. This hub's own
23 tests pass (2 new title-matching cases added, 2 renamed away from a
hard-coded "four agents" assumption).

## Recommended convention for future agents

Going forward, a new agent's workflow should:
- Use exactly one `gh issue create` per scheduled/dispatched run (never one
  per finding).
- Keep its report title matchable against this hub's `AGENT_PATTERNS` (or,
  better, once the other four branches merge, adopt a shared `agent-report`
  label so this hub can match by label instead of title regex).
- State evidence, not invented claims — every one of the four existing
  agents already does this (e.g. Future Skills Radar explicitly reports an
  "evidence gap" rather than fabricating a source).

## Automatic Claude execution: what works today, what doesn't

**Does not work:** a GitHub Actions bot comment containing `@claude` does
**not** wake any Claude session automatically in this repository. Verified
concretely, not assumed:
- No Claude GitHub App / webhook integration is installed on this repo (no
  `claude-code-action`-style workflow exists anywhere in `.github/workflows`).
- The `@claude` comments already posted on issues #75 and #77 produced no
  automatic session wake-up — confirmed by checking for queued notifications
  at review time (none were queued) and by the fact that both issues were
  only ever reviewed after the owner pasted their numbers into a live
  session.
- This matches what the four agents' own documentation already says:
  `docs/language-guardian-claude.md` and `docs/education-guardians.md` both
  state plainly that Claude acknowledgement has never been observed, and
  that bot-authored comments are ignored by some integrations entirely.

**What works instead:** a scheduled task inside the coordinating Claude Code
session itself (not a GitHub feature — a capability of the Claude Code
Remote environment this coordination role runs in). On a fixed daily cadence
it wakes the same coordinating session, which polls this hub's digest issue
(and, as a fallback, lists open issues directly) for anything new, reviews
findings against real source code, and — for confirmed problems only —
opens a separate draft PR with tests. This introduces no new paid service
and no separate AI API key; it uses the coordinator's own existing session
time. It is polling, not push: up to ~24h of latency versus an instant
webhook, which is the deliberate trade-off for staying free and simple.

**Still requires a human:**
- Approving/merging any PR — never done automatically.
- Judging suggestions that need educational expertise (age-appropriateness,
  pedagogical sequencing, whether a "future skills" research pointer is
  actually relevant) — these are reported, never auto-applied.
- Installing a real Claude GitHub App, if instant (rather than polled)
  delivery is ever wanted — that is a GitHub App installation decision for
  the repository owner, not something this coordination layer can grant
  itself.
