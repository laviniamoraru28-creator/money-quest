# New-visitor UX evaluation plan: Cinematic Universe

**Status: plan only. Not yet run. Do not execute against production until**
**the current Namecheap publish of the cinematic release is finished and**
**verified by the owner, and the owner has approved this plan.**

## Why this exists

`first-visit-experience-agent` (Growth Agents) can only confirm that
cinematic routes exist in the source tree - it cannot tell whether the
real journey (age portal → avatar picker → world map → quest intro →
lesson) is actually usable by the three audiences who will hit it for the
first time: children, parents, and teachers. That requires real people,
not static analysis. This plan is the "do this" the agent's finding
pointed at.

## Scope: the journey being evaluated

Per `docs/cinematic-universe-implementation.md`: age portal (Explorer 6-8 /
Builder 9-11 / Strategist 12-14) → one of six avatars → world map (Money,
Entrepreneur, Leadership, AI quests) → optional quest intro video (skippable,
no autoplay audio) → first lesson → reward celebration. Presentation modes
(Cinematic / Balanced / Calm) and existing accessibility controls (reduced
motion, focus mode, night view, keyboard/screen reader) are in scope for
every audience, not a separate accessibility-only pass.

## Three audiences, three different things to learn

### Children (by age band, not as one group)
- **What we're checking**: can they get from landing on the site to
  finishing their first lesson without an adult's help, at an age-appropriate
  level of "without help" (a 6-year-old thinking aloud with a facilitator
  present is still "without help" for this purpose; a 13-year-old should
  need none)? Does the avatar/age-portal choice feel meaningful rather than
  arbitrary? Does the quest intro video read as fun or as an obstacle they
  want to skip - and can they actually skip it?
- **Method**: moderated, in-person or video-call sessions with a parent or
  guardian present throughout, task-based ("show me how you'd start"),
  think-aloud adapted to age (Explorer band: facilitator narrates and asks
  simple yes/no + pointing questions rather than expecting verbal
  think-aloud; Strategist band: closer to standard think-aloud). No
  unmoderated sessions with children. No session recording beyond what is
  needed for the facilitator's own notes, and only with explicit,
  informed parental consent collected before the session, naming exactly
  what is recorded and for how long it's kept.
- **What we explicitly do not do**: no behavioral analytics or tracking
  pixels added to collect this data, no biometric or eye-tracking capture,
  no recruiting through the live product itself (no in-app prompts aimed
  at children), no compensation offered directly to a child.

### Parents
- **What we're checking**: within the first 60 seconds, do they understand
  what Money Quest is, that it's free, and that it's safe for their child
  (no account required beyond what already exists, no payment prompt
  unless they chose the shop)? Does the cinematic presentation read as
  trustworthy and age-appropriate, or as distracting from that judgment?
  Is the presentation-mode control (Cinematic/Balanced/Calm) discoverable
  if their child finds the motion overwhelming? Would they let their child
  continue unsupervised after this first look?
- **Method**: moderated remote or in-person sessions, think-aloud, plus a
  short structured post-task questionnaire (clarity, trust, intent to let
  their child continue). Separate from the children's sessions - a
  parent's own first-visit reaction is a different, equally real signal
  from watching their child use it.

### Teachers
- **What we're checking**: classroom fit, not personal delight. Can the
  intro be skipped quickly enough not to eat into a lesson period? Is it
  usable on whatever shared/lab devices and screen sizes the school
  actually has? Is it clear which quest maps to which part of their
  curriculum? Does the experience hold up with a full class navigating it
  at once (bandwidth, concurrent localStorage-based progress on shared
  machines), and is the accessibility story (reduced motion, keyboard-only,
  screen reader) solid enough for a mixed-needs classroom?
- **Method**: moderated sessions with practising primary/secondary
  teachers (recruited independently of this product, not from existing
  users only), a short classroom-logistics questionnaire, and - resources
  allowing - one real small-group classroom pilot once the moderated
  sessions find no blocking issues, with the school's own consent process
  for any media/observation.

## What "real data" means here, and what it doesn't

- Automatable first pass: scripted Playwright journeys (reusing
  `e2e/journeys/cinematic-adventure.spec.ts` and
  `e2e/journeys/educational-mission.spec.ts` as a starting point) covering
  each age band × each of the 9 locales × keyboard-only and
  screen-reader-only paths, run against the actual deployed build once
  it's live. This catches broken paths and accessibility regressions
  before any human session is scheduled - cheap, free, zero additional
  cost, uses tooling already in the repo.
- Real, already-connected Search Console and GA4 aggregate data (see
  `scripts/growth_agents.py`) can show *whether* the new landing/portal
  pages are being reached and at what aggregate volume - never *why*, and
  never anything about an individual visitor. Use it to decide which
  locale or age band to prioritize for moderated sessions if resources are
  limited; never report it as a usability finding by itself.
- The moderated sessions above are the only source for *why* something
  does or doesn't work. Do not substitute inferred analytics patterns,
  synthetic personas, or this agent's own guesses for that.

## Reporting

One short report per audience (children-by-age-band, parents, teachers):
what task failed or succeeded, direct quotes/observations (anonymized),
and a specific recommendation tied to a specific screen/interaction - not
a general impression. Findings that are code-fixable go through the same
Growth Agents / Claude coordination process as any other confirmed,
in-scope finding (own draft PR, never auto-merged). Findings that are
product/content decisions (e.g. "the AI quest intro feels too long for
Builder band") go to the owner as a recommendation, not an automatic change.

## Timing and sequencing (explicit, per the owner's instruction)

1. Do not run any part of this plan - automated or moderated - against
   production until the owner confirms the current cinematic-release
   Namecheap publish is finished and verified.
2. Run the automated Playwright pass first, against the verified live
   site, once published. Fix anything that blocks a path entirely before
   scheduling human sessions (no point testing usability of a broken
   route).
3. Schedule moderated sessions only after that, and only with the owner's
   go-ahead on recruitment (this plan does not authorize recruiting
   participants or spending any budget on incentives by itself).
