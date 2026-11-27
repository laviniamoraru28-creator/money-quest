# Money Quest Education: final release handover, 27 November 2026

Phase 7 of the "Final AI Assistant & Release Preparation" task. Production
is live, verified, and the AI Lesson Assistant is confirmed disabled. This
is the complete record of what shipped, what was found and fixed along the
way, and what remains for ChatGPT Work and the owner.

## 1. Final state

- **`main` HEAD**: `d83f59092d2a1c3a11dacf8828ca5191d90c9f4e`
- **Live site**: `https://moneyquesteducation.com` — verified directly
  (not just trusting the deploy workflow's own report) immediately after
  the final successful deploy run:
  - `/api/health` → `{"status":"ok",...}`
  - `/api/lesson-assistant` → `{"ready":false}`
  - Homepage and all 9 locales (en, ro, es, fr, de, it, pt, nl, pl) → 200
  - All 4 Quests (Play, Entrepreneur, Leadership, Real-Life) → 200
  - Canonical tag + all 9 `hreflang` alternates + `x-default` → present
  - `/sitemap.xml`, `/robots.txt` → 200
- **Deploy run**: [45851458572](https://github.com/laviniamoraru28-creator/money-quest/actions/runs/45851458572) —
  every step succeeded: connectivity-test, build, package, backup,
  rsync/install/restart, 15x health-check poll (passed), AI-assistant-
  disabled check.

## 2. Pull requests merged this session, in order

| PR | What |
|---|---|
| #133 | GA4/GSC real-data growth-agent integration (synced, rebased, merged earlier in this task) |
| #134 | Cinematic consolidation: direct, localized homepage Quest entry replacing the old decision-preview/certificate-overview flow |
| #145 | AI Lesson Assistant privacy/safety hardening — 4 Quests, 3 age bands, 9 languages, independent safety review, PII screening, injection resistance, accessibility. **Assistant stays disabled in production regardless** (`MQ_AI_ENABLED` defaults `false`, strictly validated server-side) |
| #146 | SEO fix: title/meta description/canonical were rendering outside `<head>` site-wide (missing `setRequestLocale`) |
| #150 | Namecheap SSH deploy composite action + `namecheap-deploy.yml` workflow (connectivity-test + deploy, host-key pinning, backup/rollback) |
| #151 | Assistant launch handover doc for ChatGPT Work |
| #152 | Fix: resolve `app_path` against the server's own `$HOME` server-side (GitHub masks the SSH username everywhere in logs, including inside literal paths, so a typed absolute path could never be confirmed from log output) |
| #153 | Fix: install `reportlab`/`PyMuPDF` before `npm ci` — the production build needs them for `scripts/generate-localized-worksheets.py`, present locally but not on a fresh GitHub Actions runner |
| #154 | **Emergency**: fix SSH argument-rejoin bug that caused a real production outage (see Incident 1 below) |
| #155 | **Emergency**: fix unbound-variable abort in the server's own `nodevenv` activate script (see Incident 2 below) |

PR #148 (TikTok sample videos / Money Quest Education rebrand) remained
untouched and in draft throughout, exactly as instructed — awaiting the
owner's own review, not part of this release.

## 3. AI Lesson Assistant: technical readiness vs. public activation

**Fully built and verified** (code-level, no live credentials needed):
4 Quests × 3 age bands × 9 languages content-context resolution,
server-side PII screening before every provider call, independent two-call
safety review, prompt-injection resistance (live test case), structured-
output validation, full accessibility (keyboard, ARIA live regions,
zero axe-core violations), atomic budget ledger (£5 hard cap / £4 warning /
10-per-day limit, verified against a real local Redis instance under
concurrency), and confirmed graceful degradation with the assistant off.

**Stays disabled in production** — confirmed live, not assumed
(`/api/lesson-assistant` → `{"ready":false}`) — until these four items are
resolved. Full detail in
[`docs/assistant-launch-handover-2026-11-26.md`](./assistant-launch-handover-2026-11-26.md),
owned by ChatGPT Work per the owner's 30 November deadline:

1. Live OpenAI connectivity to the dedicated "Money Quest Assistant"
   project (key declined this session; did not re-request per policy
   after one decline).
2. Live Upstash connectivity (credential-save failed — session too
   long-lived; needs the environment's own settings or a fresh session).
   Ledger logic itself is fully verified against a real local Redis.
3. OpenAI project-specific Zero Data Retention approval — no evidence
   exists anywhere in this repository; must be confirmed before accepting
   children's free text, not after.
4. Parent/child-facing privacy notices — confirmed by direct content read
   that neither currently mentions the AI assistant at all, which is
   accurate while disabled but needs updating before activation.

## 4. Deployment mechanism: now real, battle-tested, and reusable

Built in response to the owner enabling cPanel SSH access and the 12
security requirements given (`workflow_dispatch`-only trigger, pinned host
key fingerprint obtained out-of-band from the server's own authenticated
terminal, secrets confined to a branch-restricted GitHub Environment,
passphrase never on the command line or in logs, read-only connectivity
test always first, verified backup before every write, automatic rollback
on any failure). Full operator documentation, now updated to match exactly
what's running:
[`docs/namecheap-ssh-deploy.md`](./namecheap-ssh-deploy.md).

### Three real bugs found only by running it against the actual server

Local testing and code review could not have caught any of these —
each was root-caused from the actual failed GitHub Actions run's logs,
fixed with a verified minimal change, and confirmed by a subsequent
successful run plus independent live-site verification. This is offered
as evidence the fail-closed, backup-then-write, rollback-on-any-failure
design did its job even when the code driving it had bugs:

1. **GitHub log-masking makes literal absolute paths unusable as
   workflow inputs.** GitHub masks the SSH username everywhere in logs,
   including inside file paths, so a typed `/home/<user>/app` could never
   be confirmed from log output. Fixed (PR #152) by resolving `app_path`
   against the server's own `$HOME` in a dedicated step whose output goes
   only to `$GITHUB_OUTPUT`, never the log stream.
2. **Missing Python build dependency on a fresh runner.** `npm run build`
   needs `reportlab`/`PyMuPDF` for worksheet generation; present in this
   session's sandbox already, absent on a clean GitHub Actions runner.
   First real deploy attempt failed cleanly here — before touching the
   server at all. Fixed (PR #153) by installing them explicitly,
   matching the main CI workflow's own versions.
3. **SSH argument-rejoin bug → real production outage, then a second,
   different bug during recovery.** Full incident writeup, root cause,
   and both fixes are in
   [`docs/namecheap-ssh-deploy.md`](./namecheap-ssh-deploy.md#incidents-kept-here-so-the-failure-modes-arent-rediscovered).
   In summary: an unquoted multi-argument SSH call split `activate_cmd`
   into pieces mid-flight, aborting the deploy *after* new files were
   already synced but *before* the restart, leaving the site broken
   (confirmed live, HTTP 503). The automatic rollback from that fix (#154)
   then worked exactly as designed on the next attempt — but could only
   restore the already-broken pre-existing state, because a second,
   independent bug (the server's own `nodevenv` activate script aborting
   under `set -u`) stopped that attempt before a working version was ever
   actually written. Fixed in #155; the following attempt succeeded end
   to end and was independently verified live.

Both emergency fixes were verified with a direct local bash simulation
reproducing the exact failure mode *before* being trusted against
production again — not guessed and retried blind.

## 5. What's left, and who owns it

- **ChatGPT Work** (by 30 November, per the owner's instruction): the 4
  AI Assistant activation items in section 3 above.
- **Owner**: review PR #148 (TikTok samples) whenever convenient — it was
  deliberately left untouched all session; decide whether to act on the
  one UX judgment call and one informational item surfaced in today's
  routine agent-coordination poll (issue #79) — neither is a code defect,
  both are exactly the kind of call that needs a human, not an agent.
- **Nothing else blocks the current release.** No further action needed
  from me unless something changes.
