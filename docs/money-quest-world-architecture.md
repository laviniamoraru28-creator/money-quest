# Money Quest World — Universe Architecture

**Status:** this document supersedes the earlier version of itself (the
single-zone "Money Quest World" pivot) with the full universe vision: a
World Hub connecting three Quest tracks (Money Quest, Entrepreneur Quest,
Leadership Quest) plus four supporting destinations (Library, Museum, Mind
Lab, Calm World). `docs/godot-architecture-plan.md`'s Section 1 audit of
the website remains the unchanged source of truth for curriculum facts —
re-verified again for this revision (Section 0 below).

Implementation of the foundation described here has begun in
`godot/money-quest-game/` alongside this document — see Section 10 for
exactly what's built vs. still a data-driven placeholder.

---

## 0. Audit re-verification (facts unchanged, re-confirmed)

Nothing in the website changed between the previous architecture pass and
this one (git history shows only `docs/` and `godot/` additions since).
Re-confirmed directly from source for this revision:

- **Money Quest curriculum**: 30 lessons (10 topics × 3 age bands), 17
  games, 4 Money Life Simulator scenarios, 7 worlds, 9 locales at 100%
  translation coverage. Unchanged from `docs/godot-architecture-plan.md`.
- **Entrepreneur Quest** (`src/content/entrepreneur-quest/structures.ts`):
  **18 BUILD stages** (find-a-problem → research-demand →
  test-the-idea → name-your-business → create-your-logo →
  choose-your-product → choose-your-customer → understand-costs →
  set-your-price → create-your-marketing → make-your-first-sale →
  calculate-your-profit → handle-competition →
  handle-a-customer-problem → make-a-business-decision →
  grow-your-business → create-your-final-pitch, plus research-demand/
  test-the-idea inserted as stages 3-4), a **Run Your Business** phase
  (pricing-experiment, supplier-and-stock, cash-flow, business-problems,
  AI Business Lab), a **Rescue & Grow** phase (business pivot, grow-or-
  stay-small, business rescue, business review, ethics scenarios), 5
  standalone Challenges, and the existing Simulator — all gated behind
  completing BUILD, matching the website's own BUILD → RUN → RESCUE & GROW
  structure. This is real, substantial, already-shipped content — it must
  be *mapped into* Money Quest World, never rebuilt.
- **Leadership Quest** (`src/content/leadership-quest/structures.ts`):
  **12 missions** (meet-your-team → first-challenge →
  everyone-has-an-idea → missing-task → big-mistake → angry-customer →
  better-idea → team-conflict → motivation-problem → the-deadline →
  pressure-test → final-challenge), 4 original characters, 8 Leadership
  Lab scenarios, 5 "uh-oh" events, 6 badges, and a 6-archetype Leadership
  Profile. Also real, shipped content to map in, not rebuild.
- **The Godot prototype** (`godot/money-quest-game/`): one 2D vertical
  slice (`builder-saving-l1`). See Section 10 for its disposition under
  this revision.

---

## 1. The central shift: from "a 3D lesson game" to "a universe with a Hub"

The previous revision got Money Quest World to "a zone-based 3D world."
This revision adds the piece that makes it a *universe*: a **World Hub**
that is itself a real, walkable place, from which the child reaches
**three Quest tracks** and **four supporting destinations** — not a menu,
a place with doors.

```
                         ┌─────────────────────┐
                         │      WORLD HUB        │
                         │  (a real 3D place)    │
                         └──────────┬────────────┘
            ┌───────────┬───────────┼───────────┬───────────┬───────────┐
            ▼           ▼           ▼            ▼           ▼           ▼
      MONEY QUEST  ENTREPRENEUR  LEADERSHIP   LIBRARY     MUSEUM      MIND LAB
      (financial    QUEST         QUEST     (books,     (stories,   (personal
       literacy)    (business)   (Smart      mentors)    failures,   development,
                                   Skills)                 ideas)      future)
                                                                          │
                                                                          ▼
                                                                    CALM WORLD /
                                                                  SENSORY GARDEN
                                                                  (always reachable,
                                                                   never gated)
```

Two genuinely different *kinds* of destination exist, and the data model
below reflects that rather than forcing everything through one shape:

- **Quest destinations** (Money Quest, Entrepreneur Quest, Leadership
  Quest) — interactive, NPC- and choice-driven, built on the `QuestData`/
  `QuestManager` system (Section 4).
- **Browse destinations** (Library, Museum, and eventually Dictionary/
  Mentors as sub-areas) — the child walks around and *discovers* entries
  (a book, an exhibit, a mentor profile) rather than making
  choice-and-consequence decisions. Built on a simpler `ExhibitData`/
  `BookData`/`MentorData` family (Section 6).
- **Calm destinations** (Calm World and its named gardens) — deliberately
  minimal interaction, no objectives, no progression requirement, never
  gated behind anything (Section 7).

Mind Lab is architecturally a **future Quest-shaped destination** (it will
want choices/consequences like Leadership Quest, e.g. "recognize this
thought pattern") — its content is explicitly not built now, but it's
already representable by the same `QuestData` system the moment it is.

---

## 2. World Hub

The Hub is one more `ZoneData` entry (Section 3), not a special-cased
scene type — it just happens to be the zone every save file starts in and
the zone every destination returns to. Concretely, for the first
implementation: a small plaza with **7 portals** (doors, gates, or
signposts — a visual decision for later polish), one per destination.
Walking up to a portal and interacting with it either:

- **transitions** into that destination's first zone (Money Quest → Golden
  Vault, built this phase — see Section 10), or
- for anything not yet built, shows a short, honest **"coming soon"**
  response from a signpost/NPC — never a dead, unresponsive door. This is
  a real `Interaction` with real (translated) text, not a visual bug.

This satisfies "do not make the hub feel like a menu with seven buttons"
concretely: every destination is a place you walk to and a door you open,
whether or not what's behind it is built yet.

**Visual/structural pass (new)**: the Hub is no longer 7 bare colored
boxes in a field. It now has:

- A **Hub Guide NPC** near spawn (the first character a child ever meets)
  who gives two short welcome lines explaining the plaza in plain language
  — same `NPC.gd`/`Interaction` pattern every other NPC in the project
  already uses, satisfying the brief's "the child should understand where
  each destination leads without needing to read large amounts of text."
- Each portal is a small **gate landmark** (two pillars, a lintel, a
  colored topper sphere matching that destination's theme color) instead
  of a single floating box — still primitive geometry (no art pipeline),
  but now reads as "a place with a door," not "a marker."
- Seven **ground paths** radiate from the plaza center out to each gate,
  so the layout communicates "these are 7 separate places you walk to"
  without a single word of UI.
- A **central fountain** landmark (stone base, column, water-colored top)
  gives the plaza a middle to orient around, the way a real town square
  would.
- Four **decorative trees** at the plaza's outer corners, purely for life/
  warmth — no collision, no interaction, kept deliberately sparse per the
  brief's "do not fill the world with random placeholder art."

All of this is still flat-color primitive meshes — no textures, no
imported models, no new asset pipeline — matching the brief's explicit
"use procedural or primitive geometry for early development" and "do not
lock the project into an overly complicated art pipeline before testing
performance." Total added node count is modest (a few dozen static mesh
instances, zero new physics bodies beyond one fountain collider) and
should have no measurable performance impact.

---

## 3. Generalized Zone/Area data model

A single `ZoneData` resource (not a family of subclasses — simpler, and
the brief explicitly warns against over-building) describes **every**
place in the world, Hub included, tagged with a `kind` the loader and UI
use to decide behavior:

```gdscript
# scripts/world/ZoneData.gd
class_name ZoneData
extends Resource

@export var zone_id: String                 # e.g. "world-hub", "golden-vault"
@export var display_name_key: String
@export var scene_path: String

enum ZoneKind { HUB, QUEST, LIBRARY, MUSEUM, MIND_LAB, CALM }
@export var kind: ZoneKind = ZoneKind.QUEST

@export var theme_color: Color              # from the website's world.* tokens where one exists
@export var unlock_condition_quest_id: String = ""   # "" = always unlocked
@export var npc_ids: Array[String] = []
@export var quest_ids: Array[String] = []           # populated for QUEST zones
@export var exhibit_ids: Array[String] = []         # populated for MUSEUM zones
@export var book_ids: Array[String] = []            # populated for LIBRARY zones
```

**Reusing the website's 7 worlds**: Money Quest's own zones use the
website's real world ids/names/colors directly (`coin-cove`,
`market-town`, `golden-vault`, `sky-exchange`, `guardian-gate`,
`horizon-peaks`, `kindness-grove`) — continuing the previous revision's
recommendation, now scoped explicitly to the **Money Quest quest track's
own internal zones**, distinct from the **top-level Hub destinations**
(which are Money Quest / Entrepreneur Quest / Leadership Quest / Library /
Museum / Mind Lab / Calm World — a different, higher level of the same
`ZoneData` system). In other words: the Hub's "Money Quest" portal leads
into a small zone graph of its own (Coin Cove, Golden Vault, etc.), the
same way Entrepreneur Quest's portal will eventually lead into its own
zone graph (Idea Lab, Business District, Market, …).

**Now proven with a second zone**: `market-town` (real website world id,
display name "Smart Shopper") is reached via a path/portal **inside
Golden Vault**, not from the Hub directly — the Hub's Money Quest portal
is still the track's one entry point, and the track's own zones connect
to each other beyond that, exactly as described above. The Baker NPC
there gives "Need It or Want It?" (`explorer-needs_wants-l1`), the
website's real simplest Money Quest lesson, ported through
`LessonData.choice_point` with **zero new mini-game** — proof that most
of the remaining 29 lessons can be added as pure content the same way
`builder-saving-l1` already was, reserving a bespoke mini-game (like
`SavingsAllocationMiniGame`) for the minority of lessons whose real
interactive activity genuinely needs one.

---

## 4. Quest system (Money Quest / Entrepreneur Quest / Leadership Quest)

Unchanged from the previous revision's proposal, now implemented (Section
10):

```gdscript
# scripts/quests/QuestData.gd
class_name QuestData
extends Resource

@export var quest_id: String
@export var title_key: String
@export var description_key: String
@export var educational_objective_key: String

@export var track: String              # "money-quest" | "entrepreneur-quest" | "leadership-quest"
@export var zone_id: String
@export var giver_npc_id: String

enum QuestKind { LESSON, EXPLORATION, CHALLENGE, SIMULATION }
@export var kind: QuestKind = QuestKind.LESSON

@export var lesson_data_path: String = ""   # set when kind == LESSON

# Set when kind == CHALLENGE instead — a standalone situation+choice+
# consequence quest with no wrapped LessonData (added this phase for
# Entrepreneur Quest's first real quest, see Section 5). intro_dialogue
# (spoken lines between named characters) was added for Leadership
# Quest's "Big Mistake" quest, which opens with Priya/Oren dialogue
# before its decision — shown before intro_text_key, which stays for a
# single narrator-style line (Entrepreneur Quest's case):
@export var intro_dialogue: Array[DialogueLine] = []
@export var intro_text_key: String = ""
@export var challenge_choice: DialogueChoice
@export var reward_message_key: String = ""

@export var xp_reward: int
@export var coin_reward: int
@export var skill_ids: Array[String] = []
```

`QuestManager` (autoload) is the single entry point: "start quest `X`."
For `kind == LESSON` it loads the referenced `LessonData` and runs the
exact same beat sequence `LessonManager` already implements (unchanged —
see the previous revision's Section 3/4 rationale, still valid). For
`kind == CHALLENGE` it shows `intro_text_key` (if any), runs
`challenge_choice` through the same `ChoicePanel`/`ConsequenceEffect`
pipeline a `LessonData.choice_point` uses, then pays `xp_reward`/
`coin_reward` directly and shows `reward_message_key` — this is what
Entrepreneur Quest's "Handle Competition" quest uses (Section 5). A BUILD
stage like "name-your-business" or a Leadership mission like "big-mistake"
is already shaped this same way (situation → choice → consequence →
reward), so porting them later means authoring `QuestData` content, not
inventing new systems.

**Smart Skills tagging** (brief Section 17): `QuestData.skill_ids` already
carries this — a quest "demonstrates" a skill by listing it, and
`ProgressManager.skill_points` (Section 8) increments on completion. No
separate skill-demonstration engine needed; it rides on quest completion,
which is the correct level of honesty ("tracks learning progress without
turning it into a simplistic intelligence score," per your own
instruction) — it's a tally of what a child has *done*, not a graded test.

---

## 5. Entrepreneur Quest World & Leadership Quest World

Both now have a first real slice built, each a single `CHALLENGE`-kind
quest proving the shared pipeline carries that track with no new systems.

- **Entrepreneur Quest**: the Hub's portal leads into `idea-lab`, a
  `ZoneData` with `kind == QUEST`, where a "Business Guide" NPC gives the
  "Handle Competition" quest — a `QuestData` of `kind == CHALLENGE`
  wrapping the website's real `competitor-lower-price` decision event
  (situation + 3 choices + consequences, copied verbatim from
  `messages/en.json`'s `entrepreneurQuest.decisionEvents`, not invented).
  **Now a second zone proves the track's own graph grows the same way
  Money Quest's did**: `marketing-studio` is reached via a portal inside
  Idea Lab (not its own Hub portal), where a Marketing Guide NPC gives
  "Create Your Marketing" — another `CHALLENGE`-kind quest, wrapping the
  website's real `product-unclear` decision event, copied verbatim. The
  rest of Entrepreneur Quest's real BUILD → RUN → RESCUE & GROW track
  (Section 0) is the source to port, stage by stage, as further zones
  (Business District, Market, …) once this slice is validated — not built
  this phase, by design. (Its `reflect-text`-kind stages — "find-a-
  problem," "name-your-business" — will need a free-text input UI that
  doesn't exist yet; `CHALLENGE` only covers its `mission`-kind stages so
  far.)
- **Leadership Quest**: the Hub's portal leads into `leadership-academy`,
  another `ZoneData` with `kind == QUEST`, where Priya — one of the real
  `leadership-quest/structures.ts` characters (Nadia, Oren, Priya, Theo) —
  gives "The Big Mistake" quest: a `QuestData` of `kind == CHALLENGE`
  wrapping the website's real `big-mistake-choice` decision event,
  including its own two-line `priya`/`oren` intro dialogue (copied
  verbatim from `messages/en.json`'s `leadershipQuest.missions
  .big-mistake`). This exercised one real schema gap `CHALLENGE` didn't
  have yet — a mission can open with spoken dialogue between named
  characters before its decision, not just a single narrator line — so
  `QuestData` gained `intro_dialogue: Array[DialogueLine]` (shown before
  `intro_text_key`/`challenge_choice`, reusing the exact same
  `DialogueLine` resource `LessonData.intro_dialogue` already uses). Same
  `NPC.gd`, same `Interaction` pattern — no new character system required.
  **Now a second zone proves the track's own graph grows the same way
  Money Quest's and Entrepreneur Quest's did**: `team-challenge` is
  reached via a portal inside Leadership Academy (not its own Hub portal),
  where Theo — another of the 4 real characters — gives "The Angry
  Customer," wrapping the website's real `angry-customer-choice` decision
  event (4 choices, copied verbatim; one option lets Priya handle the
  call, the same character from the first LQ zone, reinforcing that it's
  one team, not two disconnected casts). Leadership Quest's remaining 10
  missions (Section 0) are the source to port, stage by stage, as further
  zones (Decision Lab, per your Section 24) once this slice is validated —
  not built this phase, by design. (Its `match`/`spot`/`allocate`/`sort`-
  kind missions — `meet-your-team`, `motivation-problem`, `the-deadline`,
  `pressure-test` — will need their own mechanic, same reasoning as
  Entrepreneur Quest's `reflect-text` gap above; `CHALLENGE` only covers
  `mission-choice`-kind missions so far, which is most of what remains.)

---

## 6. Library, Museum, Mentors, Dictionary — the "Browse" family

These don't need choices-and-consequences; they need "walk up, discover an
entry, read/hear a short piece of real content." One small shared pattern
covers all of them:

```gdscript
# scripts/library/EntryData.gd — base shape shared by books, exhibits, mentors
class_name EntryData
extends Resource

@export var entry_id: String
@export var title_key: String
@export var summary_key: String
@export var detail_key: String          # the fuller text, shown on "read more"
@export var source_url: String = ""     # for Library: a REAL, verifiable link; "" until a real one is approved — never invented
@export var icon_key: String = ""
```

- **`BookData`** (Library): adds `author_key`, `recommended_age_band`.
  **No books/authors are invented for this architecture** — `source_url`
  and `author_key` stay empty placeholders until real, verifiable titles
  are approved and added as content, exactly as your brief requires.
- **`ExhibitData`** (Museum): adds `exhibit_category` ("money-through-time"
  | "business-stories" | "failure-museum" | …) and, for Failure Museum
  entries specifically, four short fields mapping to your required
  structure: `what_happened_key`, `what_went_wrong_key`,
  `what_could_differ_key`, `what_we_learn_key` — factual, non-shaming, and
  **no historical story is invented**; this shape exists now so real,
  verified stories can be added later without a data-model change.
- **`MentorData`** (Library sub-area): adds `known_for_key`,
  `mistake_or_challenge_key`, `lesson_key`, `small_challenge_key` — maps
  directly to your "Meet the Mentors" structure. **No mentor is invented
  or quoted** — this is schema only, populated later with real, factual
  bios.
- **`DictionaryTermData`**: `term_key`, `definition_key`,
  `related_lesson_ids: Array[String]` — explicitly sourced from the real
  curriculum's own vocabulary (the 77 terms already in `messages/en.json`
  are the correct starting set, not new definitions invented for Godot).

A `BrowseZoneController.gd` (one reusable script) will eventually drive
any Library/Museum zone: reading the zone's `book_ids`/`exhibit_ids`,
placing a simple `Interaction` per entry, and showing the entry via the
**same** `DialogueBox`/`ChoicePanel`-style UI already built — no new UI
system needed, just new content types flowing through the existing
overlay components. Not built yet, deliberately: with zero real entries to
drive it, a placement controller would be untested scaffolding rather than
proven architecture — it's the next piece once the first real book or
exhibit is approved, not before.

**`EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData`
are now built** (`scripts/library/`, see `data/schemas/
ENTRY_DATA_FORMAT.md`) — this phase's actual foundation work. **Library
and Museum still have zero real entries** (`data/library/`, `data/museum/`
are empty) — no book, author, historical story, or mentor biography is
invented; both stay empty until real, verifiable content is approved (see
`ENTRY_DATA_FORMAT.md`'s own rule on this). **Dictionary is the one
exception**: a dictionary term isn't new content, it's the same
term/definition a lesson's own `LessonData.vocabulary` already has, so
`data/dictionary/goal.tres` and `data/dictionary/trade-off.tres` exist
now, reusing `builder-saving-l1`'s real vocabulary keys verbatim as the
schema's first worked examples.

**The Library now has a real, walkable zone** (`data/zones/library.tres`,
`scenes/world/zones/library/Library.tscn`), reachable from the Hub's
Library portal — bookshelves (colorful primitive-geometry "books" against
a case, no new mesh types) and a Librarian NPC. It is honestly empty: the
Librarian says plainly that the shelves are still being prepared rather
than pretending there's something to browse, and `book_ids` on the zone
stays `[]`. Museum does not yet have a walkable zone — a room with
literally nothing in it read as less honest than a portal that says
"coming soon," whereas the Library's physical shelves-with-no-books-yet
reads as "under construction," matching the brief's explicit "it is
acceptable for a destination to remain visibly under construction while
real content is being prepared." `BrowseZoneController` is still not
built — now that a zone exists to host it, it's a smaller step than
before, but still deferred until the first real `BookData` entry is
approved, so the controller's `Area3D`/collision setup for a placed entry
is built against something real rather than guessed at.

---

## 7. Mind Lab and Calm World / Sensory Garden

- **Mind Lab**: now has its first real zone (`data/zones/mind-lab.tres`,
  `scenes/world/zones/mind_lab/MindLab.tscn`, `kind == MIND_LAB`), reachable
  from the Hub's Mind Lab portal, which is now functional. A Mind Lab Guide
  gives "Different Explanations" — a `QuestData` of `kind == CHALLENGE`,
  exactly the shape already proven for Entrepreneur/Leadership Quest: a
  short scenario (a friend doesn't wave back) → a reflective choice among
  several equally-valid explanations → a consequence, no new system. Unlike
  Library/Museum/Mentors, Mind Lab content needs no external fact to
  verify — "there's often more than one explanation for someone's
  behavior" is a standard, well-established social-emotional-learning
  concept, not a claim requiring a source, so one original scenario could
  be written now rather than waiting on approval. **Non-negotiables
  enforced in the copy**: no diagnosis, no "wrong" option, no medical or
  therapeutic framing anywhere — every choice gets a validating, equally
  legitimate consequence, and the reward line names it as "a real thinking
  skill," never a score or a correct/incorrect judgment. The zone's
  decorative floating orbs respect `Settings.reduced_motion` (holding
  still instead of bobbing), same discipline as Bubble Garden. Mind Lab's
  remaining activity types (practicing calming strategies, impulsive vs.
  considered decisions, identifying unhelpful thoughts) are each a future
  `QuestData` addition on the same pipeline.
- **Calm World / Sensory Garden**: `kind == CALM`. Each named garden
  (Aquarium, Light, Rain, Underwater, Forest, Music, Bubble, Grow-a-Garden)
  is its own `ZoneData` entry with `unlock_condition_quest_id = ""`
  (**never gated**) and a scene that deliberately has: no `Interaction`
  requiring a correct answer, no audio forced on (so it can be fully
  silent — `AudioManager` ships zero audio assets anyway, so there is
  nothing to gate yet), and all motion respecting `Settings.reduced_motion`.
  **No medical or therapeutic framing in any copy** — translation keys for
  this zone type read as "a calm place to visit," never as treatment.
  **The first garden is now built**: `calm-world-bubble-garden`
  (`scenes/world/zones/calm_world/BubbleGarden.tscn`) — six softly glowing,
  semi-transparent bubbles drifting with a gentle sine-wave bob, nothing to
  tap or get right or wrong, reachable now from the Hub's Calm World
  portal with no unlock condition. The bob motion holds perfectly still
  instead of animating when `reduced_motion` is on (same discipline as
  every other animated piece of this project — see Section 13's audit).
  Calm World is uniquely safe to build ahead of Library/Museum/Mind Lab:
  unlike those, it needs no real-world fact, book, or biography to be
  honest — a bubble is just a bubble. **All 8 named gardens are now
  built**: Aquarium Room (fish gliding in slow circles), Light Room
  (warm lanterns breathing softly via emission + scale pulse), Rain Room
  (soft raindrops falling and looping — frozen mid-air when
  `reduced_motion` is on, which reads as its own calm "still rain"
  scene), Underwater Room (tall kelp swaying), Forest Walk (tree
  canopies swaying), Music Room (floating note shapes drifting and
  turning — purely visual, since `AudioManager` ships no audio assets
  and nothing here implies real sound), and Grow-a-Garden (flowers
  breathing via bloom scale pulse), alongside Bubble Garden. Each is its
  own `ZoneData` (`kind == CALM`, `unlock_condition_quest_id = ""`,
  never gated) reachable via a portal placed inside Bubble Garden —
  Calm World's 8 gardens share one Hub portal rather than claiming 7
  more Hub slots, exactly the inner-zone-graph pattern already proven by
  Idea Lab → Marketing Studio and the other Quest tracks' second zones.
  Every garden motion respects `Settings.reduced_motion` with the same
  early-return guard used everywhere else in this project. No new system
  was introduced — each garden is a `.tres` + `.tscn` pair with a small
  (<45-line) zone script, the same shape as Bubble Garden and Mind Lab.

---

## 8. Progression (additive, unified)

`ProgressManager` (existing, unchanged core) grows to:

```gdscript
var completed_quest_ids: Array[String] = []
var unlocked_zone_ids: Array[String] = ["world-hub"]
var skill_points: Dictionary = {}        # skill_id -> int
var discovered_entry_ids: Array[String] = []   # books/exhibits/mentors seen
var avatar_config: Dictionary = {}       # see Section 9
```

Same idempotent-award discipline the website's `awardBadge()`/
`applyActivityCompletion()` already established, and the same one that
`ProgressManager.complete_lesson()`/`award_badge()` already implement in
the Godot prototype — this is growth of an existing, working pattern, not
a new one.

---

## 9. Avatar (new this phase, minimal and inclusive by construction)

Scope deliberately small for the first slice, per your own "do not force a
single identity" instruction read literally: a palette of options, not a
narrow set of body presets.

```gdscript
# scripts/player/AvatarConfig.gd
class_name AvatarConfig
extends Resource

@export var body_preset_id: String = "preset-a"   # a small, neutral initial set
@export var outfit_color: Color = Color(0.059, 0.478, 0.42)
@export var accessory_id: String = ""              # "" = none; a short curated list, never required
```

A minimal `AvatarCreation.tscn` (reached from `MainMenu`) lets a child pick
these three things before entering the Hub for the first time. **Now
wired all the way through**: a real gap was found and fixed this phase —
`AvatarConfig` was being saved and loaded correctly, but `Player.tscn`'s
visual was a single hardcoded-color capsule that never read it, so every
choice in `AvatarCreation.tscn` was invisible in the actual game.
`Player.gd._apply_avatar_config()` now applies `outfit_color` to the
body's material, `body_preset_id` to the body's shape (including a
seated, wheelchair-style silhouette, `preset-d`), and `accessory_id` to a
visible attachment (`glasses`, `cap`, `hearing_aid`, or `cane`), every
time a zone's `Player` node is instantiated. All of this is purely
visual — collision shape, movement `SPEED`, and interaction range never
change based on preset or accessory, so no customization choice carries a
gameplay cost or advantage. Presets and accessories are listed together
in `AvatarCreation.gd`'s two plain arrays, not split into a separate
"accessibility" section — a wheelchair look or a hearing aid is offered
exactly like a cap or a color, per your own "do not force the player into
a single character identity" instruction and the explicit ask for
mobility aids/hearing devices/glasses as normal customization options.
The schema stays intentionally small so more presets/accessories can keep
being added later as pure content (one list entry plus one `Player.tscn`
node), never an architecture change.

---

## 10. What's implemented this phase vs. still a placeholder

| System | Status |
|---|---|
| `WorldManager` (zone loading/unloading) | **Built** |
| `ZoneData` (generalized, `ZoneKind` enum) | **Built** |
| `Player`/`NPC`/`Interaction`/`InteractionManager` ported to 3D | **Built** |
| `CameraController` (third-person follow) | **Built** |
| `QuestData`/`QuestManager`, `LESSON` and `CHALLENGE` kinds | **Built** — `CHALLENGE` added this phase for standalone situation+choice+consequence content with no wrapped `LessonData` |
| World Hub scene, 7 portals | **Built** — 6 functional (Money Quest, Entrepreneur Quest, Leadership Quest, Calm World, Library, Mind Lab), 1 "coming soon" (Museum) |
| Money Quest's Golden Vault zone + Maya's quest (`builder-saving-l1`) | **Built** — reuses the existing `LessonData`/`LessonManager`/`SavingsAllocationMiniGame`/UI overlays unchanged |
| Money Quest's Market Town zone + Baker's quest (`explorer-needs_wants-l1`) | **Built** — reached via a portal inside Golden Vault (Money Quest's first 2-zone graph); uses `LessonData.choice_point` with no mini-game |
| Money Quest's Guardian Gate zone + Zara's quest (`builder-scams-l1`, "Spotting a Scam") | **Built** — reached via a portal inside Market Town (Golden Vault → Market Town → Guardian Gate, Money Quest's first 3-zone graph); ports the real website lesson verbatim (title/objective/vocabulary/explanation/quiz/feedback), with Zara, the real child from the lesson's own story, as the giver NPC; another `LessonData.choice_point` with no mini-game |
| Entrepreneur Quest's Idea Lab zone + "Handle Competition" quest | **Built** — a `CHALLENGE`-kind quest porting the website's real `competitor-lower-price` decision event (`src/content/entrepreneur-quest/structures.ts`) verbatim; proves the same pipeline carries a second Quest track with zero new systems |
| Entrepreneur Quest's Marketing Studio zone + "Create Your Marketing" quest | **Built** — reached via a portal inside Idea Lab (Entrepreneur Quest's first 2-zone graph); another `CHALLENGE`-kind quest, porting the real `product-unclear` decision event verbatim |
| Entrepreneur Quest's Workshop zone + "Handle a Customer Problem" quest | **Built** — reached via a portal inside Marketing Studio (Idea Lab → Marketing Studio → Workshop, Entrepreneur Quest's first 3-zone graph); another `CHALLENGE`-kind quest, porting the real `too-expensive-feedback` decision event verbatim |
| Leadership Quest's Leadership Academy zone + "The Big Mistake" quest | **Built** — a `CHALLENGE`-kind quest porting the website's real `big-mistake-choice` decision event verbatim, with Priya as a real-character NPC; this is what motivated `QuestData.intro_dialogue` (Section 4) |
| Leadership Quest's Team Challenge zone + "The Angry Customer" quest | **Built** — reached via a portal inside Leadership Academy (Leadership Quest's first 2-zone graph); another `CHALLENGE`-kind quest with Theo as a real-character NPC, porting the real `angry-customer-choice` decision event verbatim |
| Leadership Quest's Strategy Room zone + "The Better Idea" quest | **Built** — reached via a portal inside Team Challenge (Leadership Academy → Team Challenge → Strategy Room, Leadership Quest's first 3-zone graph); another `CHALLENGE`-kind quest with Nadia (the 3rd of Leadership Quest's 4 real characters used so far) as the giver NPC, porting the real `better-idea-choice` decision event verbatim |
| `AvatarConfig` + creation screen, fully wired to the 3D model | **Built** — 4 body presets (including a seated wheelchair-style look) and 4 accessories (glasses, cap, hearing aid, cane), all purely visual, listed together as equally normal choices |
| Progression fields for zones/quests/skills | **Built** (additive) |
| Entrepreneur Quest's full BUILD → RUN → RESCUE & GROW track / Leadership Quest's remaining 11 missions | Not built — only one representative slice per track exists so far |
| `EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData` schema | **Built** (`scripts/library/`, see `data/schemas/ENTRY_DATA_FORMAT.md`) |
| Dictionary content | **Built** — 2 real terms (`goal`, `trade-off`), reusing `builder-saving-l1`'s own vocabulary keys verbatim |
| Library zone (`data/zones/library.tres`, bookshelves, Librarian NPC, reachable from the Hub) | **Built** — honestly empty; the Librarian says the shelves are still being prepared rather than pretending there's content |
| Library books, Museum exhibits/zone, Mentors content, `BrowseZoneController` | Not built — zero real books/exhibits/mentors exist to populate or drive a placement controller with (Section 6) |
| Mind Lab zone + "Different Explanations" quest | **Built** — a `CHALLENGE`-kind quest with an original scenario (no external fact to verify), never diagnostic or medical in framing (Section 7) |
| Calm World's 8 named gardens (Bubble, Aquarium, Light, Rain, Underwater, Forest, Music, Grow-a-Garden) | **Built** — always-unlocked, no choices, all motion respects `reduced_motion`; the 7 gardens beyond Bubble Garden are each reached via a portal placed inside Bubble Garden (Section 7) |
| 4 real `AudioServer` buses (Music/SFX/Voice/Ambient) + `Settings.gd` volume fields, applied by `AudioManager.gd` | **Built** — fixes a real gap: the buses referenced in code didn't previously exist as a bus layout, so volume was silently inert |
| `SettingsMenu.tscn` (reduced-motion toggle + 4 volume sliders), reachable from `MainMenu` and the in-world `HUD` | **Built** — fixes a real gap: there was no Settings UI anywhere, so `reduced_motion` could only ever be set by editing/loading a save file |
| HUD "Talk" button, wired to `Player.request_interact()`, shown only when something is in interaction range | **Built** — the on-screen mobile interaction path `InteractionManager`'s own doc comment always described, now actually present |
| Read-aloud / text-to-speech | Not built — `AudioManager.speak()` is a documented no-op; no TTS engine exists, so no Settings toggle is shown for it (see the Library's same no-fake-controls discipline) |

---

## 11. Revised folder structure (as implemented)

```
godot/money-quest-game/
  autoload/
    Localization.gd / Settings.gd (now 4 volume fields too) / GameState.gd /
    SaveManager.gd / ProgressManager.gd /
    AudioManager.gd           # now applies real AudioServer bus volume
    WorldManager.gd           # NEW
    QuestManager.gd           # NEW
  data/
    lessons/                  # kept
    quests/                   # NEW — QuestData .tres
    zones/                    # NEW — ZoneData .tres (world-hub, golden-vault, ...)
    library/                  # empty — BookData/MentorData .tres go here once approved
    museum/                   # empty — ExhibitData .tres go here once approved
    dictionary/               # NEW — 2 real DictionaryTermData .tres (goal, trade-off)
    avatars/                  # NEW — avatar preset definitions
    schemas/                  # kept, growing (QUEST_DATA_FORMAT.md added)
  localization/
    translations.csv          # kept, grows with hub/zone/quest keys
  scripts/
    core/                     # kept: LessonData, DialogueLine, ChoiceOption,
                               # DialogueChoice, ConsequenceEffect, VocabTerm,
                               # VirtualMoney, Interaction, InteractionManager,
                               # MiniGameBase
    world/                    # NEW: ZoneData, (WorldManager lives in autoload/)
    player/                   # NEW home: Player.gd (3D, now applies AvatarConfig
                               # to the model), CameraController.gd, AvatarConfig.gd
    characters/                # NEW home: NPC.gd (3D)
    quests/                   # NEW: QuestData (QuestManager lives in autoload/)
    lessons/                  # kept: LessonManager
    library/                  # NEW: EntryData, BookData, ExhibitData, MentorData, DictionaryTermData
    minigames/                 # kept: SavingsAllocationMiniGame
  scenes/
    world/
      hub/                     # NEW — WorldHub.tscn + PortalInteraction
      zones/
        golden_vault/           # Money Quest's first zone
        market_town/            # Money Quest's second zone (reached via Golden Vault)
        guardian_gate/          # Money Quest's third zone (reached via Market Town)
        idea_lab/               # Entrepreneur Quest's first zone
        marketing_studio/       # Entrepreneur Quest's second zone (reached via Idea Lab)
        workshop/               # Entrepreneur Quest's third zone (reached via Marketing Studio)
        leadership_academy/     # Leadership Quest's first zone
        team_challenge/         # Leadership Quest's second zone (reached via Leadership Academy)
        strategy_room/          # Leadership Quest's third zone (reached via Team Challenge)
        calm_world/             # Calm World's 8 gardens (BubbleGarden.tscn +
                                 # AquariumRoom/LightRoom/RainRoom/
                                 # UnderwaterRoom/ForestWalk/MusicRoom/
                                 # GrowAGarden.tscn, all reached via a portal
                                 # inside Bubble Garden)
        library/                # Library.tscn — honestly empty, no BookData yet
        mind_lab/               # Mind Lab's first zone + quest (MindLab.tscn)
      Main.tscn                 # persistent root: ZoneContainer + HUD
    player/                    # Player.tscn (3D), AvatarCreation.tscn
    characters/                 # NPC.tscn (3D)
    quests/
      builder_saving_l1/        # kept, relocated — unchanged content
    ui/                        # DialogueBox, ChoicePanel, RewardPopup,
                               # HUD (now with Settings + Talk buttons) — kept, relocated
    menus/                     # MainMenu.tscn (now with a Settings button),
                               # SettingsMenu.tscn            # NEW
  default_bus_layout.tres     # NEW — Music/SFX/Voice/Ambient buses
```

---

## 12. Staged build order (your Section 36, mapped to what's done)

1. **Audit** — done (Section 0).
2. **Architecture** — this document.
3. **World Hub** — built this phase (Section 10).
4. **Player/avatar** — built this phase (minimal: color/preset).
5. **Basic exploration** — built this phase (3D movement in the Hub + Golden Vault).
6. **NPC interaction** — built this phase (Maya; portal signposts).
7. **Quest system** — built this phase (`QuestData`/`QuestManager`).
8. **Unified progression/save** — built this phase (additive fields).
9. **One complete Money Quest experience** — built
   (`builder-saving-l1`, unchanged from the prior prototype, now reached
   through the Hub instead of a menu).
10. **One Entrepreneur Quest experience** — built (`idea-lab` zone,
    "Handle Competition" quest, Section 5).
11. **One Leadership Quest experience** — built (`leadership-academy`
    zone, "The Big Mistake" quest, Section 5).
12. **Library/Museum/Mind Lab/Calm World foundations** — mostly built now:
    the `EntryData`/`BookData`/`ExhibitData`/`MentorData`/
    `DictionaryTermData` schema is built and Dictionary has 2 real entries
    (Section 6); the Library has a real, walkable, honestly-empty zone;
    Museum has zero real entries and no zone yet (nothing to invent yet —
    the actual blocker now is your approval of real content, not
    architecture); Calm World now has all 8 named gardens built (Bubble
    Garden plus Aquarium Room, Light Room, Rain Room, Underwater Room,
    Forest Walk, Music Room, and Grow-a-Garden, Section 7); Mind Lab now
    has its first zone and quest built too (Section 7) — neither Calm
    World nor Mind Lab shared Library/Museum's content-approval blocker,
    since neither needs an external fact to verify.
13. **Test accessibility, localization, performance** — a static audit
    this phase (no Godot editor available in this environment, so this is
    code/content inspection, not a live playtest):
    - **Localization**: every translation key referenced anywhere in any
      script, scene, or `.tres` file across the whole project resolves in
      `translations.csv` (verified by extracting every call site and
      format-string pattern and diffing against the CSV) — zero orphaned
      keys, `en`/`ro` both complete.
    - **Hardcoded text**: no user-facing string is passed to
      `DialogueBox`/`ChoicePanel`/`RewardPopup`/`Localization.t()` as a
      literal anywhere in the project — everything is a translation key.
    - **Reduced motion — one real gap found and fixed**: `Settings.gd`'s
      own rule ("any tween/animation anywhere in this project MUST check
      `reduced_motion`") wasn't followed by two pieces of new 3D code:
      `CameraController`'s follow-smoothing lerp and `Player`'s turn-to-
      face rotation lerp. Both now snap instantly when `reduced_motion` is
      on, matching the discipline `RewardPopup` (pre-existing) already
      followed. `ChoicePanel`/`DialogueBox` have no animation to gate.
    - **Virtual money discipline**: Entrepreneur/Leadership Quest's new
      `CHALLENGE` quests pay `coin_delta`/`xp_delta` silently via
      `GameState`, same as every existing lesson — no raw number is shown
      mid-choice, only at the final `RewardPopup`.
    - **Performance**: confirmed `Main.gd` frees the previous zone
      instance before instancing the next (only one zone ever resident),
      and found no per-frame allocation or unbounded work in
      `Player`/`CameraController`/`NPC`'s `_process`/`_physics_process`.
    - **Previously a known gap, now fixed (Section 15)**: the on-screen
      mobile "Talk" button `Player.request_interact()` was always ready
      for now exists in `HUD.tscn`, and `Settings.gd` now has 4
      independent volume fields applied to 4 real `AudioServer` buses
      (Music/SFX/Voice/Ambient) — both reachable the moment real audio
      assets or a Talk-button use case exist, not bolted on after the
      fact. Read-aloud remains a documented no-op (`AudioManager.speak()`)
      — there is still no text-to-speech engine, and per this project's
      own honesty discipline (the Library's empty shelves), no toggle is
      shown in the UI for a feature with nothing real behind it yet.
15. **Audio architecture + accessible Settings screen + mobile Talk
    button** — a real gap was found while scoping this: `AudioManager`
    referenced "Music"/"SFX" buses that didn't exist anywhere (no bus
    layout file at all), so both `AudioStreamPlayer`s were silently
    falling back to `Master`; and there was no Settings UI anywhere in
    the project, meaning `Settings.reduced_motion` could only ever be set
    by loading a save file, never toggled by the child playing the game.
    Both are fixed now: `default_bus_layout.tres` defines 4 real buses,
    `Settings.gd` exposes 4 volume fields wired all the way to
    `AudioServer`, and a new reusable `SettingsMenu.tscn` overlay
    (reduced-motion toggle + 4 volume sliders) is reachable from both
    `MainMenu` and the in-world `HUD`. `HUD.tscn` also gained the "Talk"
    button `InteractionManager`'s own doc comment always described but
    that never actually existed, shown only when something is in range
    to interact with.
16. **Expand gradually** — done for everything that didn't need your
    approval first: Mind Lab (Section 7), all 8 of Calm World's named
    gardens (Section 7), fuller avatar presets including a wheelchair
    body preset and glasses/cap/hearing-aid/cane accessories, all purely
    visual (Section 9), audio buses/Settings screen/mobile Talk button
    (Section 15), Guardian Gate + "Spotting a Scam" (`builder-scams-l1`),
    Money Quest's third zone, Workshop + "Handle a Customer Problem,"
    Entrepreneur Quest's third zone, and Strategy Room + "The Better
    Idea," Leadership Quest's third zone (Section 10). Still waiting on
    you: a real book/exhibit/mentor for Library/Museum (Section 6). Still
    unstarted: Leadership Quest's remaining `mission-choice`-kind
    missions and its `spot`/`allocate`/`sort`-kind missions (need
    mechanics not built yet), Money Quest's remaining 27 lessons,
    Entrepreneur Quest's remaining real BUILD/RUN/RESCUE & GROW stages.
