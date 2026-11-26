# AI Lesson Assistant: handover to ChatGPT Work, 26 November 2026

PR #145 (lesson-assistant privacy/safety hardening) merged into `main` at
`3a9040651102e215b2a7eaa70524c94f99c7e620`, synced with #133/#134/#146.
Everything technically verifiable without live provider credentials has
been verified (see below). **The assistant stays disabled in production
regardless** — `MQ_AI_ENABLED` defaults to `false` and is strictly
validated server-side in `src/app/api/lesson-assistant/route.ts`'s
`configFromEnv()`. Merging #145 does not, and was never intended to,
activate it.

This is the exact list of what remains before public activation can even
be considered, handed over because the owner asked for it to be completed
by Monday 30 November and I could not complete it in this session.

## 1. Live OpenAI connectivity (dedicated "Money Quest Assistant" project)

Not verified this session. I requested the API key via this session's
credential tool twice; it was declined once, and I did not re-ask after
that per this session's own policy on repeated requests. Needs: a live
call against the dedicated project (not a personal/shared key), confirming
the pinned model (`gpt-4.1-mini-2025-04-14` — see `src/lib/lesson-assistant/provider.ts`)
is available there, response shape matches what `openAIProvider()` expects,
and the project's own enforced spend limit is configured.

## 2. Live Upstash connectivity (`money-quest-assistant` / `diverse-ghost-204254.upstash.io`)

Not verified this session — the credential-saving flow reported this
session is too long-lived to save a new one; it needs adding directly in
the environment's settings, or a fresh session. What **is** already
verified: the exact same Lua scripts and REST protocol
(`src/lib/lesson-assistant/budget.ts`) against a real local Redis
instance (`scripts/test-lesson-assistant-ledger.ts`, passing) — atomic
daily/monthly limits under real concurrency, refund on settle, the £4
warning firing exactly once, duplicate-settlement rejection, and
fail-closed suspension on a cost-estimate overrun. What still needs
checking against the *actual* instance specifically: that
`mq:assistant:ledger-ready` is initialized with the same value as
`MQ_AI_LEDGER_MARKER` (per `docs/lesson-assistant.md`'s own activation
checklist, item 2), and that eviction is disabled on that Upstash
database (a budget ledger silently evicted mid-month would fail open, not
closed, defeating the whole point).

## 3. OpenAI Zero Data Retention approval

No evidence of project-specific ZDR approval exists anywhere I could find
in this repository or session. `docs/lesson-assistant.md` and
`docs/dpia.md` both already correctly flag this as outstanding — I have
not claimed it is resolved, and neither should the next person to touch
this. Per OpenAI's own under-18 guidance (linked from
`docs/lesson-assistant.md`), ZDR must be confirmed for the specific
project and endpoint *before* accepting children's free text, not after.

## 4. Parent- and child-facing privacy notices

Confirmed by direct content read (not assumption): neither
`messages/en.json`'s `parentInfo` namespace (42 keys) nor its
`privacyPage` namespace mentions the AI assistant, OpenAI, or any
"optional AI feature" at all. `src/app/[locale]/privacy/page.tsx`'s
current copy doesn't make a false "no AI" claim either (unlike the old
DPIA's §8, which the new draft assessment at the top of `docs/dpia.md`
already supersedes) — it simply doesn't mention the assistant yet, which
is accurate while it's disabled but needs updating before activation.
This is a policy/content decision, not something I judged appropriate to
author myself and publish as the final word.

## 5. Only then: flip `MQ_AI_ENABLED=true`

Via the hosting environment's variables (cPanel's Setup Node.js App env
var UI, or wherever `.env.local.example`'s variables are actually
configured in production) — never by editing a default in the repository
itself. `MQ_AI_CONFIGURATION_EXPIRES` must also be set to an ISO UTC
timestamp within 31 days, forcing a recurring re-review rather than a
one-time activation that's never revisited.

## What does NOT need redoing

Everything in `docs/lesson-assistant.md`'s own "Activation and
verification" checklist that's about the *code* (not live credentials) is
done: 4 Quests × 3 age bands × 9 languages content-context resolution,
server-side PII screening before every provider call (including the new
follow-up-leak guard), independent two-call safety review, prompt-injection
resistance (verified by a live test case, not just assumed), structured-
output validation, full accessibility (keyboard, ARIA live regions,
screen-reader narration, zero axe-core violations), and confirmed
graceful degradation — every lesson stays fully usable with the assistant
off, rate-limited, or over budget.
