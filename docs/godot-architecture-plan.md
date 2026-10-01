# Money Quest → Godot: Audit & Architecture Plan

**Status:** planning document + one working vertical-slice prototype.
**Scope:** Phase 1 (audit) is complete and verified against the real codebase.
Phases 2-15 below are proposals/architecture, not yet implemented, except the
one representative Godot lesson described in Section 15 and built under
`godot/money-quest-game/`.

This document is the single reference for "what exists," "what doesn't,"
and "how the Godot layer should be built." It deliberately corrects several
assumed numbers from the original brief — see Section 0.

---

## 0. Correction of assumed numbers

The brief assumed 21 lessons / 12 games / 4 simulator scenarios. After
reading the actual source of truth (`src/content/curriculum/structures.ts`,
`src/game-engine/structures.ts`, `src/simulator/structures.ts`, and the
matching `messages/en.json` namespaces), the **real** numbers are:

| Assumed | Actual | Source of truth |
|---|---|---|
| 21 lessons | **30 lessons** (10 topics × 3 age bands) | `LESSON_STRUCTURES` in `src/content/curriculum/structures.ts` + `curriculum.*` in `messages/en.json` |
| 12 games | **17 games** | `GAME_STRUCTURES` in `src/game-engine/structures.ts` + `games.*` in `messages/en.json` |
| 4 simulator scenarios | **4 scenarios** (matches) | `SCENARIO_STRUCTURES` in `src/simulator/structures.ts` |
| 9 languages | **9 languages, confirmed, 100% key coverage right now** | `src/i18n/config.ts`, verified by running `validate-translations.ts` and `test-no-english-fallback.ts` |

Everything below uses the **real** 30/17/4 numbers. A stale code comment in
`src/game-engine/types.ts` still says "12 launch games" — that comment is
outdated, not a second source of truth.

---

## 1. Factual audit — what currently exists

### 1.1 Curriculum (lessons)

- **30 lessons** = 10 topics × 3 age bands (`explorer` / `builder` /
  `strategist`, from `AgeBand` in `src/types/database.types.ts`). Every age
  band has its own fully distinct lesson (different title, story, reward
  numbers, quiz) — not one text reused across bands.
- **7 worlds** (`src/content/worlds.ts`): Coin Cove, Market Town, Golden
  Vault, Sky Exchange, Guardian Gate, Horizon Peaks, Kindness Grove. Sky
  Exchange hosts 4 topics (currencies, digital_money, investing_basics,
  junior_isa); the other 6 worlds host 1 topic each.
- **10 topics**: money_basics, needs_wants, saving, currencies, scams,
  long_term_thinking, giving, digital_money, investing_basics, junior_isa.
- **Lesson id pattern**: `<ageBand>-<topic>-l1`, e.g. `builder-saving-l1`.
- **Lesson shape** (`LessonContent` in `src/content/curriculum/types.ts`):
  `title, learningObjective, shortIntroduction, story, keyConcept,
  vocabulary[], explanation, interactiveActivity, gameIdea, challenge, quiz
  {question, options[], correctAnswer, explanation}, feedback {success,
  retry}, rewardMessage, parentNote, commonMisconception`, plus optional
  `countryVariesNote`. Structural fields (`id, worldId, topicId, ageBand,
  xpReward, coinRewardMinorUnits, orderIndex`) live in
  `curriculum/structures.ts`; all prose lives in `messages/<locale>.json`
  under `curriculum.<id>`.
- **Vocabulary**: lesson-scoped (`{term, definition}[]`), not a global
  glossary. **77 terms total** across the 30 English lessons.
- Entrepreneur Quest and Leadership Quest are **confirmed separate tracks**
  — neither appears in `LESSON_STRUCTURES`, neither is part of the 30-lesson
  count.

### 1.2 Games

- **17 games** (`GAME_STRUCTURES` + `games.*` in `messages/en.json`), each
  built from one of **8 mechanic types**: `sort, compare, allocate, match,
  numeric, spot, multiple-choice, mission`. One mechanic component per type
  under `src/game-engine/mechanics/`, run through the shared `GameShell.tsx`.
- Full list with mechanic(s): bank-builder (numeric), build-a-budget
  (allocate), currency-explorer (match), earn-your-coins (match),
  interest-grower (numeric), money-choices (multiple-choice), needs-or-wants
  (sort), price-detective (compare), reach-your-goal (numeric), save-or-spend
  (sort), scam-detective (spot), smart-shopper (compare), real-life-missions
  (mission), money-mistakes-lab (multiple-choice), money-and-emotions
  (mission), smart-shopping-detective (mission), digital-money-explorer
  (sort + spot).
- Most game variants have 1-2 rounds (20 variants have 1 round, 16 have 2,
  3 have 3) — short, focused activities, not long quizzes.
- 10 games have only explorer standard/challenge variants; 2 (needs-or-wants,
  scam-detective) span all 3 age bands; the rest have a partial spread.

### 1.3 Money Life Simulator

- **4 scenarios**: `explorer-standard` (4 weeks), `explorer-challenge` (5
  weeks), `builder-standard` (4 weeks), `strategist-standard` (5 weeks).
  `getStandardScenarioForAgeBand()` shows a child only the one scenario
  matching their age band — not a menu of 4.
- **Mechanic**: each week the child allocates that week's income across 5
  fixed categories (needs, wants, savings, giving, unexpected), then an
  optional event fires (expense / opportunity / windfall / milestone). State
  (`SimRunningState`) tracks balance, per-category totals, goal progress, and
  a full week log. Ends in a `FinalReportCard`.
- Progress is recorded through the **same shared** `useLocalProgress()` hook
  as everything else, under activity id `simulator-${ageBand}` — the
  simulator has no separate storage key of its own.

### 1.4 Progression / localStorage

`LocalProgressState` (`src/lib/local-progress/state.ts`):
```
ageBand, currencyCode, xpTotal, walletBalanceMinorUnits,
completedActivityIds[], goals[] {id,name,targetMinorUnits,
currentMinorUnits,achievedAt}, earnedBadgeIds[]
```
Pure functions: `createDefaultState, computeLevel, applyActivityCompletion,
createGoal, contributeToGoal, removeGoal, awardBadge, withdrawFromGoal,
computeWeeksToGoal`. `computeLevel = floor(xp/100)+1`.

**7 separate localStorage keys exist today**, each its own sandboxed
feature, none shared beyond the common `awardBadge`/`earnedBadgeIds` array:
`moneyquest_local_progress_v1` (main), `moneyquest_entrepreneur_quest_v1`,
`moneyquest_leadership_quest_v1`, `moneyquest_investing_lab_v1`,
`moneyquest_sound_muted_v1`, `moneyquest_accessibility_prefs_v1`,
`moneyquest_feedback_v1`.

Badges have **no single global master list** — each feature (Entrepreneur
Quest, Leadership Quest) keeps its own constant object (`EQ_BADGE_IDS`,
`LQ_BADGE_IDS`); `awardBadge()` itself accepts any string.

### 1.5 i18n / translations

- `LOCALES = [en, ro, es, fr, de, it, pt, nl, pl]`, `DEFAULT_LOCALE = en`,
  all 9 in `FULLY_TRANSLATED_LOCALES`, `localePrefix: "always"` (every route
  always carries its locale segment).
- `messages/en.json`: 5965 lines, 32 top-level namespaces, **3654 leaf
  keys**.
- **Both translation gates pass right now**: `validate-translations.ts` →
  100% coverage (0 missing of 3654) on all 8 non-English locales;
  `test-no-english-fallback.ts` → no untranslated English-identical values
  of meaningful length in any locale. Verified by actually running both
  scripts, not assumed.
- Missing-key fallback: `src/i18n/request.ts` substitutes the **English
  string** (not the raw key) for any missing key, with a dev-only console
  warning — so even a translation gap wouldn't show a raw `curriculum.x.y`
  key to a user, only English text.
- `LanguageSwitcher.tsx`: one shared component, full-page navigation on
  switch (`window.location.href`) — a deliberate workaround for an
  RSC-payload 404 bug on the Namecheap custom-server deployment, not a
  dark-mode-style soft transition. No locale cookie; persistence is the URL
  prefix only.

### 1.6 Dark mode — does not exist

Confirmed by grep: zero matches for "dark mode," `ThemeProvider`,
`prefers-color-scheme`, `data-theme` anywhere in the codebase.
`tailwind.config.ts` has no `darkMode` key at all (Tailwind's default,
unconfigured). Zero `dark:` variants used anywhere in `src/**/*.tsx`.

### 1.7 PWA — does not exist

Confirmed by grep: no manifest file, no service worker, no `next-pwa` or
`workbox` dependency, no PWA config in `next.config.mjs`. `public/` has
only `src/app/icon.svg` (Next's file-convention favicon) — no
apple-touch-icon, no 192/512px icons, nothing else.

### 1.8 SEO

- `robots.ts`: allows `/`, disallows `/*/play`, `/*/entrepreneur-quest`,
  `/*/leadership-quest`, `/api/` (interactive app shells with no indexable
  content of their own — correct, not accidental noindex of real content).
- `sitemap.ts`: includes home, `/learn`, `/privacy`, `/contact`,
  `/parent-info`, and every `/learn/{slug}` article, **per locale**, each
  with a full `alternates.languages` hreflang map. `/feedback` deliberately
  excluded.
- `generateMetadata` exists on 6 pages (home, learn hub, learn article,
  parent-info, privacy, contact) with localized title/description/canonical/
  hreflang/Open Graph, all sourced from the actual per-locale content, not
  hardcoded English.
- JSON-LD exists: `buildArticleSchema`, `buildBreadcrumbSchema`,
  `buildFaqSchema`, rendered via a `safeJsonLd` helper on article pages.
- **Lesson/game/simulator pages are intentionally not in the sitemap and
  intentionally disallowed** — this is consistent, existing, correct
  behavior (they're interactive app shells; the curriculum's actual
  educational content is separately surfaced through `/learn` articles).
  Nothing here should be "fixed" — it's working as designed.

### 1.9 Accessibility

`AccessibilityMenu.tsx` currently exposes exactly **two** toggles: **Reduced
Motion** and **Focus Mode** — no font-size or contrast toggle exists today
(font size instead scales automatically by `data-age-band` in
`globals.css`). Reduced motion: a `data-reduced-motion` attribute on
`<html>`, persisted to `moneyquest_accessibility_prefs_v1`, matched by a
`[data-reduced-motion="true"] *` CSS rule mirroring the standard
`prefers-reduced-motion` media query already present.

`ReadAloudButton.tsx` uses the **Web Speech API** (browser
`SpeechSynthesis`), not pre-recorded audio, and renders a **visible text
label** (not icon-only) plus a matching `aria-label` — a deliberate choice
for pre-literate / icon-unfamiliar children.

### 1.10 Design system

`tailwind.config.ts` confirmed tokens: `teal #0F7A6B`, `gold #E8A33D`
(+ `gold-text #8F5E19` AA-safe variant), `ember #D13E19`, `sky #367D99`,
`fog #EDF3E8` (the "sage" page background), `cream #FBF8EF` (card surface),
`coral #F0785A`, `soft-blue #7FB3CC`, `ink #1C2624`, `success/error/warning`,
plus a 7-entry `world.*` palette (one color per world). The brief's
"sage/cream/coral/soft-blue" palette is real — "sage" is implemented as the
`fog` token name, not a literal `sage` key.

Core reusable components (`src/components/ui/`): `Button` (5 variants, 2
sizes), `Card` (4 variants), `ProgressBar` (one shared implementation,
animates `transform: scaleX()` for compositor-thread performance, not
`width`), `AccessibilityMenu`, `ReadAloudButton`, `SoundToggle`,
`LanguageSwitcher`, `KeyTermBadge`, `Coin`, `LevelBadgeStar`, `StarRating`,
`MoneyAmount`, `LevelProgressRing`.

### 1.11 Deployment

Two deployment stories exist in the repo; the one matching the user's
actual target is: `server.js` (a custom Node HTTP server written
specifically for Namecheap cPanel's "Setup Node.js App" feature) +
`.github/workflows/build-for-namecheap.yml` (builds on GitHub Actions
because the Namecheap plan's 1GB RAM can't run `next build` itself, per the
`cpus:1, workerThreads:false` tuning already in `next.config.mjs`), zipping
`.next`, `messages`, `server.js`, `package.json`, `next.config.mjs`,
`src/i18n` for manual upload.

**Found issue, not yet fixed (flagging, not silently fixing):** the
workflow's own comments say `public/` is excluded because "this app has no
static assets" — that's no longer true. `public/images/` (hero + 8 lesson
illustrations) and `public/worksheets/` (20 PDFs + answer key) now exist on
disk but are **not** copied into the Namecheap deploy zip, so they would
404 on a freshly deployed Namecheap build even though they work locally/on
Vercel. This should be fixed before the next Namecheap deploy, but is
outside this task's explicit scope — flagged here for a decision, not
silently patched.

---

## 2. Features that already exist (summary list)

30 lessons across 7 worlds/10 topics/3 age bands · 77 vocabulary terms · 17
games across 8 mechanic types · 4 simulator scenarios · 9 fully-translated
locales with 100%-passing automated coverage gates · shared local-progress
system (XP, wallet, goals, badges) · 7 independent localStorage-backed
feature sandboxes (progress, Entrepreneur Quest, Leadership Quest, Investing
Lab, sound, accessibility prefs, feedback) · reduced-motion system ·
Web-Speech-API read-aloud with visible labels · full SEO metadata + hreflang
+ JSON-LD on indexable content · a 12-color design-token palette with a
per-world palette · Namecheap-specific custom-server deployment pipeline.

## 3. Features that do NOT exist (recommended additions, clearly proposed — not built yet)

- **Dark mode** (Light/Dark/System + localStorage persistence) — proposed,
  not built.
- **PWA infrastructure** (manifest, icons, safe-content caching) —
  proposed, not built.
- **A centralized badge master list** — proposed; today each feature keeps
  its own list, which works but won't scale indefinitely.
- **Font-size/contrast accessibility controls** beyond the existing
  reduced-motion/focus-mode toggles — proposed, optional.
- **The Godot game layer entire** — proposed; see Sections 5-18. Nothing
  Godot-related exists in the repo today except what this task adds under
  `godot/`.
- **Fixing the Namecheap deploy zip's missing `public/` folder** — a bug
  fix, not a new feature, flagged above for a decision.

Nothing else from the brief's assumption list ("AI Quest Coach," real
banking, authentication, a database) exists — correctly, since the brief
explicitly says not to build those, and they don't exist.

---

## 4. Proposed website architecture after Phase 2 improvements

This is a plan only — Phase 2 (dark mode, PWA, mobile-first pass,
micro-interactions) is not implemented in this task. The proposed shape:

- **Theme system**: a `ThemeProvider`-free approach consistent with this
  app's existing "no unnecessary client state" philosophy — a small
  `data-theme="light"|"dark"` attribute on `<html>`, set by an inline
  blocking `<script>` in the root layout (reads `localStorage`, falls back
  to `prefers-color-scheme`, avoids a flash of wrong theme), persisted to a
  new `moneyquest_theme_v1` key, mirroring the existing
  `moneyquest_accessibility_prefs_v1` pattern exactly. Every existing
  Tailwind color token gets a `dark:` sibling value defined once in
  `tailwind.config.ts` / `globals.css`, not per-component overrides.
- **Mobile-first pass**: audit every `Card`/`Button`/game-mechanic component
  against real touch-target sizes (the design system already has
  `min-h-touch-min`/`min-h-touch-min-child` tokens — the work is auditing
  where they're *not* yet applied, especially in the Simulator's
  `WeekAllocationPanel`), not a rewrite of the component library.
- **Micro-interactions**: extend the existing `ProgressBar`'s
  transform-based animation pattern (already compositor-friendly and
  already reduced-motion-aware) to correct/incorrect feedback and reward
  moments, reusing the same `data-reduced-motion` gate everywhere — no new
  animation library.
- **PWA**: a `manifest.ts` (Next.js file convention) + a small set of
  generated icon sizes + `next.config.mjs` caching headers for
  `/learn/*` and static assets only (never the interactive `/play/*` shells,
  consistent with how they're already excluded from the sitemap) — no
  service-worker-driven offline app shell, no database, no auth.
- **Translation completeness**: extend the existing
  `validate-translations.ts`/`test-no-english-fallback.ts` gates to cover
  every new string this phase introduces (theme labels, PWA install
  prompts) — same scripts, more keys, no new tooling.

## 5. Proposed Godot architecture (high level)

A **separate, standalone Godot 4.x project** living at
`godot/money-quest-game/` in this same repo (for now — could be its own
repo later), never imported into the Next.js build, with no shared runtime
dependency on it. The two products share **concepts**, not code:

- The same **structural/translatable split** the website uses (structural
  Resource/JSON data vs. localized text) is reused in Godot via Godot's
  built-in CSV translation system plus a small custom `LessonData` Resource
  for anything the CSV format can't express (ordered choice/consequence
  trees).
- The same **age-band model** (`explorer`/`builder`/`strategist`) is reused
  as a Godot enum, not reinvented.
- The same **virtual-money, no-real-banking principle** is enforced at the
  architecture level: there is no network code in the Godot project at all
  in this phase — `VirtualMoney` is a pure in-memory/save-file concept.
- Progress is **local-file-based** (`user://progress.json`), the Godot
  equivalent of the website's localStorage — no database, no auth, same
  constraint as the website.

## 6. Godot folder structure

```
godot/
  money-quest-game/
    project.godot
    icon.svg
    README.md
    autoload/                      # Godot "Autoload" singletons (global systems)
      GameState.gd                 # virtual wallet, XP, current age band
      SaveManager.gd                # load/save user://progress.json
      ProgressManager.gd            # lesson/badge completion tracking
      Localization.gd               # locale switching helpers on top of TranslationServer
      Settings.gd                   # reduced motion, read-aloud toggle, theme
      AudioManager.gd               # music/sfx bus control, stubbed sounds
    data/
      lessons/
        builder_saving_l1.tres      # the one built lesson, as a LessonData resource
      schemas/
        LESSON_DATA_FORMAT.md       # documents the Resource shape for future lessons
    scripts/
      core/
        LessonData.gd               # Resource: data model for one lesson
        DialogueLine.gd             # Resource: one line of dialogue
        DialogueChoice.gd           # Resource: one player choice
        ConsequenceEffect.gd        # Resource: a choice's effect (money/trust/etc.)
        LessonManager.gd            # drives a loaded LessonData through its beats
        InteractionManager.gd       # generic "walk up, press interact" handling
        Interaction.gd              # base class an interactable object extends
        MiniGameBase.gd             # base class every mini-game extends
      minigames/
        SavingsAllocationMiniGame.gd  # the "Reach Your Goal" mechanic, Godot version
    scenes/
      core/
        Player.tscn / Player.gd
        NPC.tscn / NPC.gd
        DialogueBox.tscn / DialogueBox.gd
        ChoicePanel.tscn / ChoicePanel.gd
        RewardPopup.tscn / RewardPopup.gd
        HUD.tscn / HUD.gd
      lessons/
        LessonBase.tscn              # generic lesson-runner scene, reused by every lesson
        builder_saving_l1/
          BuilderSavingL1.tscn        # this lesson's specific room/set-dressing
          BuilderSavingL1.gd
      world_map/
        WorldMap.tscn / WorldMap.gd
      main_menu/
        MainMenu.tscn / MainMenu.gd
    localization/
      en.csv
      ro.csv
    assets/
      README.md                     # placeholder — no art/audio assets generated in this task
```

## 7. Reusable scene structure

- **`LessonBase.tscn`** is the one scene every lesson instantiates content
  into — it owns the `HUD`, `DialogueBox`, `ChoicePanel`, `RewardPopup`, and
  a `Node2D` "stage" child where a lesson-specific scene (e.g.
  `BuilderSavingL1.tscn`) is instanced. New lessons add a small
  scene+script pair under `scenes/lessons/<lesson_id>/`, not a new copy of
  the whole runner.
- **`Player.tscn`/`NPC.tscn`** are generic, reused in every lesson that has
  a walk-around component; a lesson that's pure dialogue+choice (no
  movement) simply doesn't instance `Player.tscn` at all — the architecture
  doesn't force movement where the educational objective doesn't call for
  it.
- **`DialogueBox.tscn`/`ChoicePanel.tscn`/`RewardPopup.tscn`** are populated
  entirely from data (`LessonData`'s dialogue/choice arrays) — they contain
  zero lesson-specific text.

## 8. Reusable script structure

Matches the brief's requested system list, scoped honestly to what this
phase actually builds vs. documents as an extension point:

| System | Status in this phase |
|---|---|
| `LessonData` (Resource) | **Built** — the data model, Section 9 |
| `DialogueLine` / `DialogueChoice` / `ConsequenceEffect` (Resources) | **Built** |
| `LessonManager` | **Built** — drives any `LessonData` through dialogue → choice → consequence → reward |
| `Player` / `NPC` | **Built** — minimal, reusable, top-down 2D |
| `InteractionManager` / `Interaction` | **Built** — generic "nearby + press interact" base |
| `MiniGameBase` + `SavingsAllocationMiniGame` | **Built** — one concrete mini-game as the pattern for others |
| `SaveManager` | **Built** — `user://progress.json` read/write |
| `GameState` (virtual money/XP) | **Built** |
| `ProgressManager` | **Built** — lesson-completion + badge tracking |
| `Localization` | **Built** — locale switching + helper for non-CSV text |
| `Settings` (reduced motion, read-aloud) | **Built**, minimal |
| `AudioManager` | **Stubbed** — bus control + hooks, no audio assets |
| `WorldMap` / `Navigation` | **Stubbed scene**, not fleshed out (not needed for a one-lesson vertical slice) |
| `CameraController` | **Not built this phase** — the vertical slice uses a static camera; flagged as a real gap for lessons that need following/panning |
| `Inventory` | **Not built this phase** — no lesson in the real curriculum currently needs an inventory concept; flagged rather than invented |

## 9. Data model for lessons (`LessonData`)

Deliberately mirrors the website's own `LessonContent` shape (Section 1.1)
field-for-field where a Godot equivalent makes sense, so content authors
moving between the two systems recognize the same concepts:

```gdscript
# scripts/core/LessonData.gd
class_name LessonData
extends Resource

@export var lesson_id: String            # e.g. "builder-saving-l1" — matches the website's id
@export var age_band: String             # "explorer" | "builder" | "strategist"
@export var world_id: String             # e.g. "golden-vault"
@export var topic_id: String             # e.g. "saving"
@export var xp_reward: int
@export var coin_reward: int             # virtual coins, never real money
@export var learning_objective_key: String   # translation key, resolved via Localization
@export var key_concept_key: String
@export var vocabulary: Array[Dictionary] # [{term_key, definition_key}]
@export var dialogue_beats: Array[DialogueLine]
@export var choice_point: DialogueChoice  # the single decision beat (one per lesson in this model)
@export var quiz_question_key: String
@export var quiz_options_keys: Array[String]
@export var quiz_correct_index: int
@export var quiz_explanation_key: String
@export var reward_message_key: String
```

`DialogueLine`, `DialogueChoice`, `ConsequenceEffect` are small sibling
Resources (full source in the prototype) — a choice holds 2-4 options, each
producing a `ConsequenceEffect` (coin delta, a short consequence text key,
and which reward/feedback path to show), the same "every choice has its own
consequence, never a bare right/wrong" principle the website's `mission`
mechanic already uses.

Content is authored as `.tres` resource files (or generated from JSON if a
future export-from-website pipeline is built) — never hard-coded inside a
lesson's scene script.

## 10. Progression / save architecture

- `SaveManager` reads/writes a single `user://progress.json` file —
  the direct Godot analogue of the website's localStorage, with the exact
  same constraints the brief asks for: **no database, no authentication,
  local-only**.
- Shape mirrors `LocalProgressState` conceptually:
  ```json
  {
    "age_band": "builder",
    "xp_total": 0,
    "virtual_coins": 0,
    "completed_lesson_ids": [],
    "earned_badge_ids": [],
    "theme": "system",
    "reduced_motion": false
  }
  ```
- `GameState` (autoload) holds the live in-memory values; `SaveManager`
  flushes them to disk on every meaningful change (lesson/quiz completion,
  badge award) — same "persist on every mutation" pattern the website's
  `use-local-progress.ts` hook already uses.
- **No cross-save with the website.** The brief explicitly asks for a
  "clean separation" (Phase 14) and "design an interface for it later, but
  do not build backend infrastructure now" (Phase 14) — so this phase
  defines the save shape but does not build any sync mechanism. A future
  integration could let a parent manually view "my child's Money Quest
  world progress" as a read-only export, but that is explicitly out of
  scope now.

## 11. Localization architecture

- Godot's built-in **CSV translation system** (`localization/en.csv`,
  `ro.csv`, …) handles all UI chrome and dialogue/choice/quiz text — the
  direct Godot equivalent of `messages/<locale>.json`. One row per
  translation key, one column per locale, exactly like the website's
  flat-key JSON but in Godot's native format.
- The `Localization` autoload wraps `TranslationServer.set_locale()` and
  exposes `Localization.t(key)` so scripts never read `tr()` results
  directly — a single swap point if the project ever needs richer
  interpolation than Godot's CSV format natively supports (the website's
  `{placeholder}` ICU-style syntax doesn't exist in Godot's CSV loader by
  default, so `Localization.t(key, {params})` does simple `%s`-style
  substitution internally).
- All 9 locale codes are reserved in the CSV header row from day one (this
  phase ships `en` and `ro` fully populated for the one built lesson; the
  other 7 columns are present but empty, clearly marked — not silently
  invented translations).
- **No lesson text is ever hard-coded into a scene script** — every string
  a lesson shows goes through a translation key, the same discipline the
  website's `useTranslations()` convention already enforces.

## 12. Mobile / PWA strategy (website)

Proposal only (see Section 4) — not implemented this phase. Summary: a
localStorage-persisted `light/dark/system` theme flag using the existing
accessibility-preferences pattern; a mobile-first audit of existing touch
targets rather than a visual rewrite; a `manifest.ts` + icon set + safe
static-content caching, explicitly excluding the interactive `/play/*`
shells from any offline/caching story, consistent with how they're already
excluded from the sitemap.

## 13. SEO preservation strategy

No SEO changes are needed to support the Godot layer — Godot is a separate
project with no web pages to index. The one thing to actively avoid when a
public-facing "play the Godot game" download/launch page is eventually
added to the website: do **not** let that page inherit the same
`disallow: "/*/play"` pattern unless it is genuinely as non-indexable as
the interactive app shells — a marketing/download page for the Godot game
should likely be indexable (with its own `generateMetadata`), unlike the
in-browser `/play/*` activities. This is a note for whenever that page is
built, not an action taken now.

## 14. Recommended order of implementation

1. **This phase**: finish this audit/plan doc + the one Godot vertical
   slice (done — see Section 15).
2. Review this plan with the project owner; confirm the `LessonData` shape
   and reusable-system list before investing in 29 more lessons.
3. Convert 2-3 more lessons spanning different mechanics (not just another
   dialogue+choice lesson) to pressure-test the architecture before mass
   production — e.g. one `sort`-style lesson (needs vs. wants), one
   scam-detection lesson, one multi-round budget-allocation lesson.
4. Only then batch-convert the remaining ~25 lessons.
5. Convert the 17 games into Godot mini-games reusing `MiniGameBase`,
   prioritizing the ones already mapped 1:1 to a mechanic the prototype's
   `SavingsAllocationMiniGame` pattern covers (numeric, allocate, sort,
   match) before the bespoke `mission`-mechanic games.
6. Convert the 4 simulator scenarios last — they're the most stateful
   (multi-week running totals) and benefit most from the other systems
   being proven first.
7. Website Phase 2 (dark mode, PWA, mobile-first, micro-interactions) can
   happen in parallel with the Godot work, on its own track, since the two
   are architecturally independent.

## 15. Representative lesson prototype — what was built

Lesson: **`builder-saving-l1` — "Saving for Something Bigger"** (Golden
Vault world, saving topic, builder age band). Chosen because its real,
existing content — Maya saving three weeks of allowance for a sketchbook
instead of spending on small treats — is *already* exactly the
"situation → choice → consequence → explanation" shape Phase 6 of the
brief asks for, with no invented educational content: every line of
dialogue, the vocabulary (`goal`, `trade-off`), the quiz, and the reward
message are taken directly from the real `curriculum.builder-saving-l1`
entry in `messages/en.json` (and `ro.json` for the Romanian localization
demo), not invented for this prototype.

Built under `godot/money-quest-game/`: the full autoload set (Section 6),
the `LessonData`/`DialogueLine`/`DialogueChoice`/`ConsequenceEffect` data
model (Section 9), `LessonManager` driving the lesson end-to-end, `NPC`
(Maya) + `Player` + `DialogueBox` + `ChoicePanel` + `RewardPopup` scenes,
the `SavingsAllocationMiniGame` (a richer, week-by-week version of the
website's "Reach Your Goal" numeric game, preserving its exact educational
objective — save toward a fixed target over several weeks — while adding
visible weekly choice-and-consequence), full EN+RO localization for every
string the lesson uses, and a `user://progress.json` save flow via
`SaveManager`/`GameState`. See `godot/money-quest-game/README.md` for how
to open it in Godot 4.x and a walkthrough of the lesson beat-by-beat.

**Flagged gap, not silently filled**: the real lesson content does not
specify a visual setting (no "where" is described beyond "Maya" wanting a
sketchbook) or Maya's appearance/personality beyond what's in the quiz/
story text. The prototype places her in a simple room with a sketchbook on
a shelf as a reasonable, minimal staging choice — this is a presentation
decision, not an invented educational claim, and should be reviewed as part
of Phase 10 (visual direction) rather than treated as curriculum content.

## 16. Plan for converting the remaining 29 lessons

- Group by mechanic-fit, not by world, so similar engineering patterns are
  built together: dialogue+single-choice lessons (most `explorer`-band
  lessons, by their short, concrept-introduction shape) → reuse
  `LessonBase`+`ChoicePanel` directly; multi-round numeric/allocation
  lessons (saving, investing_basics, junior_isa `builder`/`strategist`
  content) → reuse `SavingsAllocationMiniGame`'s pattern generalized into
  `MiniGameBase` subclasses; scam-detection lessons (`guardian-gate` world)
  → a new `SpotTheProblemMiniGame` extending `MiniGameBase`, modeled on the
  website's existing `spot` mechanic's "select the suspicious items" logic.
- Each new lesson is one `.tres` `LessonData` resource + (only if it needs
  bespoke staging) one small scene under `scenes/lessons/<id>/` — the
  reusable core (autoloads, `LessonManager`, dialogue/choice/reward scenes)
  is never duplicated.
- Translate each lesson's CSV rows as content is authored, following the
  website's own discipline: write English first, then translate into all 9
  locales before considering a lesson "done," reusing the website's
  `validate-translations.ts`-style key-parity check adapted for CSV (a
  small new script, not a new concept).

## 17. Plan for converting the existing 17 games

Map each game's existing mechanic to a `MiniGameBase` subclass, 1:1 where
the mechanic already generalizes, richer where Godot's interactivity adds
real value without changing the educational objective:

| Website mechanic | Godot mini-game pattern |
|---|---|
| `numeric` (bank-builder, interest-grower, reach-your-goal) | `SavingsAllocationMiniGame`-style — already built, directly reusable |
| `allocate` (build-a-budget) | A `BudgetAllocationMiniGame` extending the same base, swapping "weeks toward a goal" for "categories within a budget" |
| `sort` (needs-or-wants, save-or-spend, part of digital-money-explorer) | A `SortingMiniGame` — drag-or-tap items into labeled bins, matching the website's existing tap-based (not drag-only) accessibility pattern |
| `match` (currency-explorer, earn-your-coins) | A `MatchingMiniGame` — tap-pairs, same non-drag accessibility principle |
| `compare` (price-detective, smart-shopper) | A `CompareMiniGame` — present 2-3 priced options, pick the best value |
| `spot` (scam-detective, part of digital-money-explorer) | A `SpotTheProblemMiniGame` (shared with scam-detection lessons, Section 16) |
| `multiple-choice` (money-choices, money-mistakes-lab) | Reuses the `ChoicePanel` core system directly — no new mini-game class needed |
| `mission` (real-life-missions, money-and-emotions, smart-shopping-detective) | Reuses `LessonManager`'s own choice-and-consequence flow directly — these are already closest to the Godot lesson shape |

No mini-game is invented that doesn't map to a real, existing game's
educational purpose — this table is a conversion map, not a wishlist.

## 18. Plan for converting the 4 simulator scenarios

- A `WeekSimulationManager` (new, built on `MiniGameBase`) generalizes the
  website's `applyWeek()`/`SimRunningState` logic: same 5 fixed allocation
  categories (needs/wants/savings/giving/unexpected), same event types
  (expense/opportunity/windfall/milestone), same per-week log structure —
  ported faithfully, not redesigned, since the brief says the existing
  simulator mechanic should be mapped, not reinvented.
- Each of the 4 scenarios (`explorer-standard/challenge`,
  `builder-standard`, `strategist-standard`) becomes its own `LessonData`-
  adjacent resource (a `SimulatorScenarioData` Resource reusing the same
  structural/translatable split) feeding the same manager — one engine,
  four data files, matching exactly how the website already does it.
- Because this is the most stateful system (multi-week running totals,
  goal tracking, a final report), it's sequenced **last** in Section 14's
  implementation order, after the simpler lesson/mini-game patterns are
  proven.

---

## Non-negotiables carried through unchanged

No real banking, no Open Banking, no real bank account connections, no
AI Quest Coach, no authentication, no database, no gambling mechanics, no
real-money purchases, no public chat, no unnecessary personal-data
collection. All money in both the website and the Godot layer is virtual
and must read that way to a child — the Godot prototype's UI explicitly
labels amounts as virtual coins, never implying real monetary value.
