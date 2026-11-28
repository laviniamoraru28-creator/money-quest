# Money Quest Education: full age-differentiation audit

**Date:** 28 November 2026
**Branch:** `audit/age-differentiation-2026-11-28` (audit only — no main changes, no production changes)
**Scope:** all 4 Quests (Money Quest, Entrepreneur Quest, Leadership Quest, AI Quest) × 3 age bands (Explorer 6–8, Builder 9–11, Strategist 12–14)
**Method:** code-level inspection of current `main` (commit `634293eff851cff2178ebe291866ba4162178668`) plus live browser verification (Playwright, local dev server and production) — not source-code inspection alone, per the brief's requirement.

---

## 1. Executive summary

The owner's report is **correct and already has a real, identifiable mechanism**, not a mystery bug. There is **no broken wiring, no state-propagation bug, no production/main drift, and no regression** anywhere in this audit. Age-band switching works correctly end to end: it is stored in one place (`useLocalProgress().state.ageBand`), reacts live without a page reload, persists across refresh, and every page that has band-specific logic reads it correctly.

The actual cause is a **content-authoring and design gap**, present by explicit prior decision in two of the four Quests and by omission in the third:

- **Entrepreneur Quest and Leadership Quest** (redesigned 17–18 November, `docs/eq-lq-age-band-redesign.md`): Builder and Strategist share **100% identical content** on the entire core path — all 18 EQ Build stages, all 12 LQ missions, the Simulator, Final Pitch, Challenges, Real-World Missions, and LQ's Lab scenarios. This was an explicit, disclosed design choice (see §2), not a bug — but it means a parent or tester comparing Builder vs Strategist on the obvious, default path sees **zero difference**, exactly matching the report. Strategist's only distinguishing content is three additional *gated modules* (Run Your Business, Rescue & Grow, AI Lab) plus 5 Uh-oh events — real, verified working, but easy to miss entirely if you don't know to look for them.
- **AI Quest** (never previously audited for this): Builder vs Strategist differ only in **two numeric constants and one extra multiple-choice option** — same mechanic, same prompts, same structure. This is genuinely insufficient differentiation, not by any documented design decision.
- **Explorer** fares much better in EQ/LQ (real interaction swaps exist — tap-based coin counting instead of typed numbers, reduced choice counts, etc.) and in AI Quest (two of five missions get a real content fork), but several Explorer-facing stages were explicitly left unfinished in the prior pass (EQ's `find-a-problem`, `research-demand`'s full data table, the Simulator) and still require independent reading/typing from a 6–8-year-old.
- **Money Quest** (the core curriculum) is the one Quest with **zero gaps**: all 10 topics × 3 bands are genuinely, substantively different, confirmed both in code and live in the browser. This is the working reference pattern the other three Quests should be measured against.

Separately, the reported **grey/inactive header speaker button** is a real, reproducible UX inconsistency (not a code defect in the sense of broken logic) — see §8.

No P0 (site-breaking) issues were found. The highest-priority items are P1 (real, user-visible educational gaps matching the exact report) detailed in §5 and §9.

---

## 2. Confirmed root-cause analysis

### 2.1 The age-band mechanism itself works correctly

- **Single source of truth**: `src/lib/local-progress/use-local-progress.ts`'s `useLocalProgress()` hook stores one global `ageBand: "explorer" | "builder" | "strategist" | null` field in `localStorage` (key `moneyquest_local_progress_v1`), shared across all 4 Quests — not per-Quest state.
- **Live reactivity, no stale state**: every `setAgeBand()` call dispatches a `moneyquest-progress` `CustomEvent`; every mounted `useLocalProgress()` instance re-renders immediately. Verified in the browser: switching from Builder to Strategist and navigating straight to a previously-gated route (`/entrepreneur-quest/run/cash-flow`) shows the unlocked content on the very next render, with no second reload needed.
- **Persistence**: confirmed live — setting the band, reloading the page, and re-reading `localStorage` returns the same value.
- **Band-scoped progress storage** (`src/lib/band-scoped-storage.ts`, built in PR #85) keeps each band's own completion/answer data in its own slice, so switching bands never leaks or overwrites another band's progress. A stale-closure class of bug in the underlying setters was already fixed in commit `407d0bb` (22 November), unrelated to this audit but hardening the exact mechanism this audit depends on.
- **Production matches `main` exactly** — verified live against `https://moneyquesteducation.com`: the same gate text, the same unlock behavior, for the same bands, as the local dev build of current `main`. No deployment drift.
- **No regression** was found from any commit after the 17–18 November redesign landed (checked `git log` for every touched file; the only later touch, PR #134's "Cinematic consolidation," removed an unrelated breadcrumb nav and added an unrelated Agency-mission link — the band-gating conditionals it left in place are byte-identical to what the redesign commit wrote).

### 2.2 What is actually missing

| Quest | Builder vs Strategist on the core/default path | Explorer vs the rest |
|---|---|---|
| **Money Quest** | Genuinely different (10/10 topics) | Genuinely different |
| **Entrepreneur Quest** | **Identical** (18/18 stages, Simulator, Challenges, Real-World Missions) — Strategist's only extra content is 3 gated modules reachable after completing the Pitch / a Run problem | Real differences on 2 of 18 stages (`understand-costs`, `set-your-price` via `CoinCountStage`) + `calculate-your-profit`'s visual; everything else (16 of 18 stages, the Simulator, Challenges) is unchanged for Explorer too |
| **Leadership Quest** | **Identical** (12/12 missions, byte-for-byte except harmless match-pair shuffle order) — Strategist's only extra content is 5 gated Uh-oh events, inline within missions, easy to miss | Real reductions on 6 of 12 missions (choice-count cuts, spot/sort item reductions); `the-deadline`'s allocate step and all 8 Lab scenarios unchanged for every band |
| **AI Quest** | **Superficially different only** (2 numeric constants + 1 extra MC option; same mechanic/prompts for both) | Real content fork on 2 of 5 missions |

This table *is* the root cause: for the two largest, longest-running Quests, "switch the age level and the activities stay the same" is literally true for Builder vs Strategist on the path every user naturally takes, and AI Quest never got even the scope-gating treatment EQ/LQ received.

---

## 3. Complete educational content inventory

Legend for the classification column, used consistently throughout this report:
- **GENUINE** = GENUINELY_AGE_SPECIFIC — a real interaction, content, or complexity difference exists.
- **SHARED-OK** = SHARED_BUT_APPROPRIATE — same for 2+ bands, but defensible (band-invariant choice, e.g. picking a business name).
- **SUPERFICIAL** = SUPERFICIALLY_DIFFERENTIATED — different wording/numbers/title only, same mechanic and difficulty.
- **IDENTICAL** = IDENTICAL_INSUFFICIENT — literally the same for 2+ bands with no defensible reason.
- **MISSING** = no path to the content for a band at all (not found anywhere in this audit).
- **MISWIRED** = band-specific code exists but has a real bug (none found anywhere in this audit).

### 3.1 Money Quest (reference implementation)

| Content | File(s) | Classification | Evidence |
|---|---|---|---|
| All 10 core curriculum topics (`money_basics`, and 9 others) | `src/content/curriculum/structures.ts` (`LESSON_STRUCTURES`), rendered by `src/app/[locale]/play/world/[worldId]/page.tsx` | **GENUINE** (10/10) | Each topic has a distinct `{band}-{topicId}-l1` entry with its own title/story/vocabulary/interactive activity. Worked example (`money_basics`, EN): Explorer = concrete shop story + picture-sort + tap game; Builder = "where does money come from" + match game; Strategist = currency/trust/FX systems-level concept. Confirmed live in browser: full-page text differs between every band pair. |

**No gaps found in Money Quest.** This is the pattern every other Quest should be brought up to.

### 3.2 Entrepreneur Quest

| Content | File(s) | Classification | Evidence |
|---|---|---|---|
| find-a-problem, create-an-idea (reflect-text) | `build/page.tsx` `ReflectTextStage` | **IDENTICAL** | No band param anywhere; free-text textarea, all 3 bands. 6–8-year-old must type. |
| research-demand (Market Detective) | `build/page.tsx:336-394` | **IDENTICAL** | 7-metric data table + demand ladder render unconditionally. Doc's own Explorer proposal (a `compare` round) was never built. |
| test-the-idea, handle-competition, handle-a-customer-problem (×2), make-a-business-decision (×2), grow-your-business (mission-kind, 7 stages) | `MissionMechanic.tsx`, `build/page.tsx` | **SUPERFICIAL** | `isExplorer` only toggles CSS text size; full, untruncated choice array for every band. |
| understand-costs, set-your-price (numeric) | `build/page.tsx:195,218` | **GENUINE** (Explorer) / **IDENTICAL** (Builder=Strategist) | Explorer gets `CoinCountStage` (tap-based); Builder and Strategist both get the typed `<input>`. |
| calculate-your-profit | `build/page.tsx:787-849` | **GENUINE** (Explorer) / **IDENTICAL** (Builder=Strategist) | Explorer gets `CoinPileComparison` visual; Builder/Strategist get a bare currency string. |
| name-your-business, create-your-logo, choose-your-product, choose-your-customer | `build/page.tsx` | **SHARED-OK** | Band-invariant, tap/text-entry choices already fine at any age. |
| create-your-final-pitch | `build/page.tsx:308-321` | **SHARED-OK** | Band-invariant hand-off. |
| Simulator | `simulator/page.tsx` | **IDENTICAL** | Zero band references anywhere in the file. Same typed-number-entry problem as the original `understand-costs` bug, never fixed here. |
| Standalone Challenges (list + detail) | `challenges/page.tsx`, `challenges/[challengeId]/page.tsx` | **IDENTICAL** (list) / **SUPERFICIAL** (detail, text styling only) | No real content branching. |
| Real-World Missions (4-item checklist) | `entrepreneur-quest/page.tsx:129-151` | **SHARED-OK** | Simple checklist, reasonably age-invariant. |
| Run Your Business (pricing, suppliers, cash flow, 7 Business Problems) | `run/layout.tsx` + `BandGate` | **GENUINE** (programme-scope gate) | Verified live: 🔒 message for Explorer/Builder, full content for Strategist. |
| Rescue & Grow (pivot/grow/ethics/business-rescue) | `rescue-grow/layout.tsx` + `BandGate` | **GENUINE** (programme-scope gate) | Same pattern, verified. |
| AI Business Lab | `ai-lab/page.tsx:97,188` | **GENUINE** (programme-scope gate) | Same pattern. |
| EQ hub tile visibility | `entrepreneur-quest/page.tsx:45,90,101` | **GENUINE**, correctly wired | Verified live: Strategist sees the Run Your Business section appear immediately on switching bands (as a locked-until-pitch-complete placeholder, then a live tile once the Pitch is done); Explorer/Builder never see it at all. |

### 3.3 Leadership Quest

| Content | File(s) | Classification | Evidence |
|---|---|---|---|
| 12 core Missions — match rounds (×2: meet-your-team, first-challenge) | `missions/[missionId]/page.tsx` | **SUPERFICIAL** for Explorer / **IDENTICAL** Builder=Strategist | Doc's plan proposed pictures for Explorer; never built — `isExplorer` only affects styling/read-aloud, not round content. Builder/Strategist get byte-identical pairs and labels (confirmed live; only the random shuffle order differs, which is normal game behavior, not differentiation). |
| spot rounds (×2: team-conflict, motivation-problem) | same | **GENUINE** (Explorer: 3 of 5 items) / **IDENTICAL** Builder=Strategist | Matches doc exactly. |
| allocate (the-deadline) | same | **IDENTICAL** (all 3 bands) | No `isExplorer` branch exists at all here — a disclosed, still-open gap. |
| sort (pressure-test) | same | **GENUINE** (Explorer: 1 item/bucket of 5) / **IDENTICAL** Builder=Strategist | Matches doc. |
| mission-choice events (6 of them) | same | **GENUINE** (Explorer: 2 of 3-4 choices) / **IDENTICAL** Builder=Strategist | `choices = isExplorer ? allChoices.slice(0,2) : allChoices`. |
| missing-task's investigate step | same | **GENUINE** (Explorer skips it) | Matches doc. |
| **All 12 missions, Builder vs Strategist** | same | **IDENTICAL** | No code branch anywhere distinguishes `builder` from `strategist` on the 12-mission core path. Confirmed live. |
| 5 Uh-oh events | same | **GENUINE** (Strategist-exclusive) | `isStrategist = ageBand === "strategist"` gates `showUhOh`. Correctly reactive to live band switches. Only attached to 5 of the 12 missions, and only appears *after* that mission's own events are answered — easy to miss in a casual comparison. |
| 8 Lab scenarios | `lab/page.tsx`, `LeadershipLabCard.tsx` | **IDENTICAL** (all 3 bands) | No band slicing anywhere; disclosed, still-open gap. |
| LQ hub + Profile pages | `leadership-quest/page.tsx`, `.../profile/page.tsx` | **SHARED-OK** | Correctly band-invariant — no hub-level tile ever needs hiding since LQ's only gated content is inline, not a separate route. |

### 3.4 AI Quest

| Content | File(s) | Classification | Evidence |
|---|---|---|---|
| Main Challenge flow, missions #2 and #4 | `ai-quest/page.tsx` | **GENUINE** (Explorer: real interaction swap) | Poster-prompt-clarity vs AI-prompt-quality task; apple-counting vs AI-wrong-answer-trust task. Confirmed live: Explorer page text differs substantively from Builder's. |
| Main Challenge flow, remaining 3 missions, Builder vs Strategist | `ai-quest/page.tsx` (`Challenge({band})`) | **SUPERFICIAL** | Only two numeric constants (`sales: 30` vs `120`; `costs: [12]` vs `[42,18]`) and one extra multiple-choice option differ. Same mechanic, same prompts, same structure. Confirmed live: page text differs (so not literally byte-identical) but the difference is numbers only. |
| Content source | `src/content/ai-quest/lessons.json` | — | Keyed **per locale only**, not per band — all band variation lives in `page.tsx` branching logic on top of shared base text, structurally different from every other Quest's content-schema approach. |
| Agency missions (`ai-explorer-helper-robot.ts`, `ai-builder-book-report.ts`, `ai-strategist-business-plan.ts`) | `src/lib/agency/missions/` | **GENUINE** | Three fully distinct mission definitions — different premise, different tracked resources, different decision graphs. A separate, properly-working system, surfaced as one extra link (`<AgencyMissionLink quest="ai">`) on the AI Quest hub. |
| Minor i18n gap (unrelated to band differentiation) | `ai-quest/page.tsx` `<h1>` | — | Hardcoded literal `"AI Quest"`, not run through `useTranslations()`, unlike every other Quest hub. Flagged since this audit also covers multilingual availability; does not block any locale from loading (confirmed `fr`/`pl`/`ro` all return 200), just shows the English title untranslated. |

---

## 4. 4×3 Quest × age-band audit matrix

Cell format: dominant classification, abbreviated as in §3's legend.

| | Explorer (6–8) | Builder (9–11) | Strategist (12–14) |
|---|---|---|---|
| **Money Quest** | GENUINE | GENUINE | GENUINE |
| **Entrepreneur Quest** | Mixed: GENUINE on 2/18 core stages + profit visual; IDENTICAL/SUPERFICIAL on the rest, Simulator, Challenges | IDENTICAL to Strategist on everything core; no gated modules | IDENTICAL to Builder on core; GENUINE via 3 gated extra modules (Run / Rescue & Grow / AI Lab) |
| **Leadership Quest** | Mixed: GENUINE on 6/12 missions (choice/item reductions); IDENTICAL on `the-deadline` + 8 Lab scenarios | IDENTICAL to Strategist on all 12 missions + Lab | IDENTICAL to Builder on core; GENUINE via 5 gated Uh-oh events |
| **AI Quest** | GENUINE on 2/5 Challenge missions; GENUINE via Agency mission | SUPERFICIAL vs Strategist (numbers only) on Challenge; GENUINE via Agency mission | SUPERFICIAL vs Builder on Challenge; GENUINE via Agency mission |

---

## 5. Missing or insufficiently differentiated activities (the remediation backlog)

In priority order (see §9 for P-ratings):

1. **EQ: Builder vs Strategist identical on the entire 18-stage core path, Simulator, Challenges, Real-World Missions.**
2. **LQ: Builder vs Strategist identical on all 12 core missions.**
3. **AI Quest: Builder vs Strategist differ only in two numbers and one option count** on 3 of 5 Challenge missions.
4. **LQ's `the-deadline` (allocate) and all 8 Lab scenarios**: identical across all 3 bands, no Explorer accommodation at all.
5. **EQ's `find-a-problem`/`create-an-idea`**: force independent free-text typing on Explorer.
6. **EQ's `research-demand`**: full 7-metric data table shown unmodified to Explorer.
7. **EQ's Simulator**: zero Explorer accommodation; same typed-number-entry barrier the original redesign fixed elsewhere.
8. **EQ's mission-kind stages** (test-the-idea, handle-competition, etc., 7 stages): Explorer gets styling-only changes, not the choice-count reduction LQ's equivalent stages received.
9. **LQ's match rounds** (`meet-your-team`, `first-challenge`): the redesign doc's own plan promised a picture-based Explorer variant; never implemented — Explorer gets the same text-label match as everyone else.
10. **EQ's product/customer category grids**: not yet curated to a smaller Explorer-friendly subset, as the doc's own plan proposed.

---

## 6. Exact technical findings (files, functions, code references)

All file paths relative to repo root, current `main` (`634293eff851cff2178ebe291866ba4162178668`):

- `src/lib/local-progress/use-local-progress.ts` — the single `ageBand` source of truth; `setAgeBand()` at line 118; live-reactivity via the `moneyquest-progress` `CustomEvent` dispatched in `writeToStorage()` (line 66).
- `src/components/BandGate.tsx` — the Strategist-only gate component (EQ Run/Rescue & Grow/AI Lab).
- `src/app/[locale]/entrepreneur-quest/page.tsx:45,90,101` — hub tile visibility (`progressState.ageBand === "strategist"`, further gated on `state.pitchCompleted` / `state.completedProblemIds.length > 0`).
- `src/app/[locale]/entrepreneur-quest/build/page.tsx` — `ReflectTextStage` (line 127, IDENTICAL), `MarketDetectiveStage` (336–394, IDENTICAL), numeric stages (195, 218 — Explorer-only `CoinCountStage`), `calculate-your-profit` (787–849).
- `src/app/[locale]/entrepreneur-quest/run/layout.tsx`, `rescue-grow/layout.tsx`, `ai-lab/page.tsx:97,188` — `<BandGate requiredBand="strategist">` wrapping.
- `src/app/[locale]/entrepreneur-quest/simulator/page.tsx` — zero band references (confirmed via full-file read).
- `src/app/[locale]/leadership-quest/missions/[missionId]/page.tsx` — all mechanic branches: match (278–301, no content change), spot (309–311, GENUINE), allocate (336–358, IDENTICAL, no branch), sort (360–365, GENUINE), mission-choice (396, GENUINE), investigate-skip (407, GENUINE), Uh-oh gate (113–115, `isStrategist`).
- `src/components/leadership-quest/LeadershipLabCard.tsx` — renders all `choiceKeys` regardless of band (IDENTICAL).
- `src/app/[locale]/ai-quest/page.tsx` — `Challenge({band})`; `explorer`/`pro` boolean branches; numeric constants `sales`/`costs` differ Builder vs Strategist only.
- `src/content/ai-quest/lessons.json` — per-locale, not per-band, content base.
- `src/lib/agency/missions/ai-explorer-helper-robot.ts`, `ai-builder-book-report.ts`, `ai-strategist-business-plan.ts` — confirmed genuinely distinct mission definitions.
- `src/content/curriculum/structures.ts` (`LESSON_STRUCTURES`) — Money Quest's reference content schema, `{band}-{topicId}-l1` keying, 30 entries (10 topics × 3 bands), zero gaps.
- `docs/eq-lq-age-band-redesign.md` — the prior audit+plan+implementation record (commits `bda32a4`, `15d2a1e`, 17–18 November). Its own disclosed "known limitations" sections (5, 7.3) are **accurate** against current code — every gap found in this audit was already honestly disclosed there, except: its §3/§4 plan for LQ match-round pictures and EQ's `research-demand` compare-round was never actually built (its own §6/§7.2 "delivered" lists correctly omit these — the plan and the delivery summary disagree with each other, and the delivery summary is the one that matches reality).
- `src/components/ui/PageReadAloud.tsx:61` / `src/lib/accessibility/use-read-aloud.ts:21,29` — the header speaker-button finding, see §8.

**No existing automated test was found to catch any of these gaps.** `entrepreneur-quest-age-bands.spec.ts` and `leadership-quest-age-bands.spec.ts` (added with the redesign) test that the *implemented* Explorer differences work, but assert nothing about Builder vs Strategist — so they would not fail even though Builder and Strategist are identical. This is the direct answer to the brief's "do any existing tests fail to detect these problems" question: **yes, by omission** — the tests only ever check Explorer-vs-the-rest, never Builder-vs-Strategist equality/inequality.

---

## 7. Browser test results and evidence

Playwright, against a local dev server (`npm run dev`, current branch) and separately against production (`https://moneyquesteducation.com`). 16 full-page screenshots captured; paths below are local to this session's sandbox (not committed — see note at end of this section).

| Check | Result |
|---|---|
| EQ hub tiles per band (Explorer/Builder/Strategist) | Explorer: no Run/Rescue&Grow tiles. Builder: no tiles. Strategist: Run tile appears immediately. |
| EQ `/run/cash-flow` direct navigation, gating | Explorer: gated (🔒 "Strategist Level" message). Builder: gated, identical message. Strategist: full content, no gate. |
| EQ Build stage 1 ("Find a Problem") across bands | Identical text for all 3 bands — confirms the IDENTICAL classification live, not just in code. |
| LQ `meet-your-team` mission, Builder vs Strategist | Same 4 dialogue lines, same match-pair labels and character names for both bands; only the random shuffle order of list items differs (normal game randomization, not a content difference) — confirms IDENTICAL. |
| AI Quest, Builder vs Strategist | Page text differs (not byte-identical) — consistent with the SUPERFICIAL (numbers-only) classification, not full identity. |
| AI Quest, Explorer vs Builder | Page text differs substantively — confirms GENUINE for Explorer. |
| Money Quest world page (`coin-cove`), all 3 bands | Full page text differs between every band pair (shared intro banner text, but the lesson list/content below genuinely differs) — confirms Money Quest as the clean reference. |
| Band persists across page refresh | Confirmed: set to `strategist`, reloaded, re-read from `localStorage` — still `strategist`. |
| Mobile viewport (375×812, iPhone user agent), header speaker button | **Not disabled** in a real mobile browser context — isolates the owner's report to something specific to the Messenger in-app browser, not a universal site defect (see §8). |
| Mobile viewport (375px), EQ gate message layout | No horizontal scroll (`scrollWidth === clientWidth === 375`). |
| Multilingual availability, all 4 Quest hubs | `fr`, `pl`, `ro` locales each return HTTP 200 for `entrepreneur-quest`, `leadership-quest`, `ai-quest`, `play`. |
| Certificate page | Loads correctly, correctly references all 4 Quests ("Complete Money Quest, Entrepreneur Quest, Leadership Quest and AI Quest at your chosen level to unlock your certificate"). |
| Production vs `main` parity | Verified live against `https://moneyquesteducation.com`: identical gate text and identical unlock behavior for Builder vs Strategist on `/entrepreneur-quest/run/cash-flow`, and `ai-quest` loads correctly. **No drift.** |

**Limitation disclosed, not hidden**: the full certificate-eligibility flow, desktop-vs-mobile visual regression across all 12 combinations, and a deep multi-stage click-through of every EQ stage (to visually, not just code-level, confirm the Explorer `CoinCountStage` at stage 9) were not exhaustively screenshotted in this pass, given the audit's time budget — the `understand-costs`/`set-your-price` Explorer interaction swap is verified at the code level (§3.2, §6) but not independently re-confirmed via a fresh screenshot reaching stage 9 specifically. This is the one area where this report relies on code-level confirmation alone; everything else in §7's table was independently confirmed live.

The 16 screenshots and the raw JSON result file are being handed to the owner as session attachments alongside this report (they are not committed to the repository, since they are point-in-time diagnostic evidence, not a permanent fixture).

---

## 8. Audio accessibility findings (Read Aloud / header speaker button)

**Root cause, confirmed at the code level**: `src/components/ui/PageReadAloud.tsx` (the persistent header "Listen" button) disables its button (`disabled={!isSupported}`) whenever `"speechSynthesis" in window` is false — i.e., whenever the Web Speech API's synthesis object is not exposed by the browsing context at all. This is a real, intentional defensive check (the button must not let a child tap something that would silently do nothing), but it produces exactly the "grey and inactive" appearance the owner reported.

**This is NOT how the rest of the site's read-aloud buttons behave.** `src/components/ui/ReadAloudButton.tsx` (every in-lesson "Listen" button) uses the identical `useReadAloud()` hook but, on the same `!isSupported` condition, **renders nothing at all** rather than a disabled button — explicitly documented in its own comment: *"Renders nothing at all when the browser has no speech support, rather than a disabled/broken-looking button."* **The header button is the one inconsistent place in the codebase that does the opposite of this documented design intent.**

**Is this a genuine implementation defect, unsupported browser functionality, or an unclear interface state?** All three, in combination:
- It is **unsupported browser functionality** in the sense that Meta's in-app browser (used when a link is opened from inside Messenger/Facebook/Instagram) is well-documented, publicly, to use its own Chromium-based WebView loaded from the app's own storage rather than the OS's system WebView (Meta's own 2022 engineering blog post), and is independently reported by developers to restrict various Web APIs compared to a normal browser (file access, WebAuthn, install prompts, and others) — a pattern consistent with `window.speechSynthesis` being entirely absent in that context specifically. This is a platform limitation outside this codebase's control.
- It is simultaneously an **unclear interface state**: nothing in the UI tells the person WHY the button is grey — the `title` attribute (hover-only, useless on a touchscreen) is the only explanation offered, so a parent sees an apparently-broken control with zero actionable information. Confirmed live that the button is NOT disabled in an ordinary mobile browser context (real iPhone-UA Chromium, §7) — reproducing it specifically inside Messenger's in-app browser itself was not possible from this sandboxed environment (no access to a real Messenger client), so **this part is a well-evidenced inference from code + platform documentation, not a first-hand observation inside Messenger** — flagged honestly per the brief's instruction to distinguish verified findings from assumptions.
- It **is a genuine, fixable implementation inconsistency**: regardless of the exact cause in Messenger specifically, the header button's choice to show disabled-and-unexplained, rather than following the rest of the codebase's own established and documented pattern of hiding entirely, is a real defect independent of any particular browser.

**Other audio-accessibility findings, all confirmed at the code level:**
- **All 9 languages are wired through** (`REGIONAL_LOCALES` maps every active locale to a BCP-47 tag used by every speech call site), but the header widget (unlike `LessonAssistant.tsx`'s use of the `localOnly` flag) never checks whether a matching voice actually exists on the device for the current language — so for a language without a locally installed TTS voice, the button can appear enabled yet produce silence, the wrong accent, or no audible output, depending on the OS. This is a secondary, lower-severity gap in the same area.
- **Video audio and spoken narration are correctly separated**: lesson/game sound effects use the Web Audio API (`src/lib/audio/sound-manager.ts`, synthesized tones, no audio files), background/decorative video (`QuietVideos.tsx`) uses native HTML5 `<video>` with its own `controls`/`muted` attributes, and educational narration uses the Web Speech API (`use-read-aloud.ts`) — three independent systems, confirmed not to interfere with each other, each already independently defensive against being unsupported.
- **Accessible fallback behaviour is correct everywhere except the header button**: per `use-read-aloud.ts`'s own doc comment, "the lesson's text is always fully readable on screen regardless" of speech support — read-aloud is additive, never required, confirmed true for every lesson/game component checked.
- **Persisted audio preferences**: sound effects/background audio have a dedicated, persisted on/off toggle (`SoundToggle`, its own `localStorage` key, separate from progress). Read Aloud itself has **no persisted on/off preference** — it is stopped on every page navigation by design (`PageReadAloud`'s own `useEffect`) and started fresh by a button press each time. This is a reasonable design choice, not a defect, since the content to read changes on every page, but is noted here as a direct answer to the brief's question about preference persistence.

---

## 9. Prioritised remediation plan (P0–P3)

- **P0 (none found).** No defect in this audit breaks the site, loses data, exposes privacy-sensitive information, or blocks certification. Age-band switching, persistence, and gating all work correctly as a mechanism.
- **P1 (real, user-visible educational gaps matching the owner's report — fix first):**
  1. EQ: differentiate Builder vs Strategist on the 18-stage core path (or, at minimum, make Strategist's existing extra modules impossible to miss — e.g. surface them more prominently on the hub, rather than relying on a tester to notice a conditionally-rendered tile).
  2. LQ: same, for the 12-mission core path and the 5 Uh-oh events' visibility.
  3. AI Quest: replace the numbers-only Builder/Strategist split in the 3 shared Challenge missions with a genuine complexity/interaction difference, matching the quality bar the 3 Agency missions for AI Quest already meet.
  4. Header speaker button (`PageReadAloud.tsx`): change `disabled={!isSupported}` to the same "render nothing" pattern `ReadAloudButton.tsx` already uses, OR add a visible (not hover-only) explanatory message with an "open in your browser" suggestion for in-app-browser contexts. This is a small, well-scoped fix.
- **P2 (disclosed-but-still-open content gaps, lower visibility than P1 but still real):**
  5. LQ's `the-deadline` allocate step and all 8 Lab scenarios: no Explorer accommodation at all.
  6. EQ's `find-a-problem`/`create-an-idea`: Explorer forced into free-text typing.
  7. EQ's `research-demand`: full data table shown unmodified to Explorer.
  8. EQ's Simulator: no Explorer accommodation.
  9. EQ's 7 mission-kind stages: Explorer gets styling only, not the choice-count reduction LQ's equivalents received.
- **P3 (smaller, lower-impact polish):**
  10. LQ's match rounds: implement the previously-planned-but-never-built picture-based Explorer variant.
  11. EQ's product/customer category grids: curate to a smaller Explorer-friendly subset.
  12. AI Quest's hardcoded `<h1>AI Quest</h1>` → route through `useTranslations()`.
  13. Header read-aloud: check local voice availability before enabling (parity with `LessonAssistant.tsx`'s `localOnly` pattern), to avoid a silently-non-functional-but-enabled button on languages with no local TTS voice.

---

## 10. Estimated implementation complexity and dependencies

Reusing `docs/eq-lq-age-band-redesign.md`'s own honest scale assessment (§1.3 of that document), extended to AI Quest:

| Item | Complexity | Why |
|---|---|---|
| P1.1 EQ Builder/Strategist differentiation | **Large** | 18 stages × genuine content/interaction authoring, if done to the same standard as Explorer's existing work; comparable in scope to the original Explorer pass. Alternative lower-cost option: reframe Strategist's 3 extra modules as more prominent, separately-badged content rather than authoring 18 new variants — much smaller, but doesn't fully close the gap. |
| P1.2 LQ Builder/Strategist differentiation | **Large** | Same shape as above, 12 missions. Same two-option trade-off (author real content vs. make the existing Uh-oh events unmissable). |
| P1.3 AI Quest Builder/Strategist | **Small–Medium** | Only 3 missions need real rework (2 already have a real Explorer fork to use as a design pattern); the existing Agency mission trio (already genuinely distinct per band) is a ready-made quality bar and partial template. |
| P1.4 Header speaker button fix | **Trivial** | One conditional change, already has a working sibling pattern (`ReadAloudButton.tsx`) to copy. |
| P2 items (5 items) | **Medium**, each independently shippable | Each is scoped to one stage/mission/module; the reusable mechanic engine (`sort`/`compare`/`allocate`/`match`/`numeric`/`spot`/`multiple-choice`/`mission`) already exists for all of them — this is content-authoring work, not new-component work, per the existing redesign doc's own architecture conclusion (§1.2, still valid). |
| P3 items (4 items) | **Small**, each | Narrow, well-scoped single-file changes. |

**Dependencies**: none of the above touch the AI Lesson Assistant, Stripe/payments, or privacy architecture (per the brief's restrictions) — all are confined to `src/content/`, `src/app/[locale]/{entrepreneur-quest,leadership-quest,ai-quest}/`, and the two read-aloud components. New translation strings would be needed for any genuinely new P1/P2 content (9 languages each, following the existing `curriculum.<id>` / `entrepreneurQuest.stages.<id>.<band>` namespacing convention already established).

---

## 11. Acceptance criteria and regression test requirements

For any remediation PR addressing a P1/P2 item:

1. **Band-pair inequality test, not just "Explorer differs"**: a new or extended Playwright spec must assert `builderText !== strategistText` (or the equivalent structural check) for whatever content was changed — the existing `entrepreneur-quest-age-bands.spec.ts` / `leadership-quest-age-bands.spec.ts` pattern must be extended to cover this, since (per §6) today's tests only check Explorer-vs-the-rest and would pass even with Builder/Strategist fully identical.
2. **No regression to Explorer's existing, working differentiation** — the existing age-band spec files must continue to pass unchanged.
3. **Band-scoped progress isolation**: any new content unit must be verified not to leak completion state between bands (reuse the existing `band-scoped-storage.ts` pattern; add a test if the unit is new).
4. **Accessibility baseline maintained**: zero new axe violations, keyboard reachability, and (where applicable) the existing `isExplorer`-driven larger-text/read-aloud treatment extended to any new Explorer-specific component, matching the standard `CoinCountStage` already set.
5. **9-language coverage**: any new string must pass `validate-translations.ts` at 100% coverage before merge, per the existing convention.
6. **Mobile viewport**: no horizontal scroll at 320–375px for any new or changed screen.
7. **Header speaker button fix specifically**: a regression test confirming the button renders nothing (not disabled) when `speechSynthesis` is absent from `window`, mirroring `ReadAloudButton.tsx`'s existing behavior — this can reuse that component's own test pattern if one exists, or add one following it.
8. **Production parity check before declaring any remediation complete**: re-run the live production verification pattern used in this audit (§7's last row) against the actual deployed site, not just CI.

---

## 12. Existing content to preserve and reuse

Per the brief's explicit instruction not to create competing systems, the following should be the foundation for all remediation work, not replaced:

- **The shared mechanic engine** (`src/game-engine/`: `sort`, `compare`, `allocate`, `match`, `numeric`, `spot`, `multiple-choice`, `mission`) — both EQ and LQ already render every branching/mini-game round through this; no new mechanic type is needed for any P1/P2 item identified here except possibly a close variant of the existing `CoinCountStage` pattern.
- **`CoinCountStage`** (EQ's existing Explorer numeric-input replacement) — the proven template for "replace typed input with tap-based interaction," directly reusable as a pattern for any future numeric Explorer work (e.g. the Simulator, P2.8).
- **`BandGate`** (`src/components/BandGate.tsx`) — the existing, correctly-working Strategist-gate component; reusable as-is for any future programme-scope gating decision, requires no changes.
- **`band-scoped-storage.ts`** — the existing, correctly-working per-band progress isolation; must be used by any new band-specific content, never bypassed.
- **The AI Quest Agency missions** (`ai-explorer-helper-robot.ts`, `ai-builder-book-report.ts`, `ai-strategist-business-plan.ts`) — already a genuine, working example of real AI Quest band differentiation; the most direct template for fixing AI Quest's main Challenge flow (P1.3).
- **Money Quest's `LESSON_STRUCTURES` content schema** (`{band}-{topicId}-l1` keying under `src/content/curriculum/structures.ts`) — the proven, zero-gap reference pattern; EQ/LQ's own redesign doc already explicitly models its (different, stage-level) schema on this same idea, and any future AI Quest content-schema rework should follow it too (moving band variation out of `page.tsx` branching and into structured content, as Money Quest already does).
- **`docs/eq-lq-age-band-redesign.md`** itself — an unusually honest, detailed, and (per this audit) accurate record of what was built and what was deliberately deferred; the next engineer should treat it as the authoritative starting point for EQ/LQ remediation rather than re-deriving the activity matrix from scratch. This audit found no inaccuracy in its "delivered" claims, only two places (LQ match rounds, EQ's `research-demand`) where its own *plan* sections describe something its own *delivery* sections correctly admit was never built.
- **`entrepreneur-quest-age-bands.spec.ts`, `leadership-quest-age-bands.spec.ts`** — keep and extend (per §11), don't replace.
- **`ReadAloudButton.tsx`'s** "render nothing when unsupported" pattern — the fix for the header button (§8/§9) is to adopt this existing, already-correct, already-documented pattern, not invent a new one.
