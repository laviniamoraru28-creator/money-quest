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

**Now proven with a second quest-giving NPC in one zone**: Golden Vault's
Savings Guide gives `explorer-saving-l1` ("What Does Saving Mean?"), the
explorer-age-band companion to Maya's builder-age-band `builder-saving-l1`
— both on the real website's "saving" topic, both in `golden-vault`.
Rather than building a 4th Money Quest zone for every remaining lesson, a
zone can simply gain a second (or third) resident NPC: one more `NPC`
node in its `.tscn`, one more `talked_to` connection in its zone script,
one more `QuestData`/`LessonData` pair — `ZoneData.npc_ids`/`quest_ids`
were already `Array[String]` for exactly this reason, so no schema change
was needed either. This keeps the Hub's own zone graph from growing
without bound as the real 30-lesson curriculum fills in.

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

# Set only for a "business problem"-shaped CHALLENGE quest (added for
# Entrepreneur Quest's v2 Business Problems, see Section 10's Main
# Street row) — the real site's investigate-clues -> identify-a-cause
# -> choose-a-response flow. Shown, if set, after intro_text_key and
# before challenge_choice: a reflective, non-scored choice (its
# ConsequenceEffects carry coin_delta = 0/xp_delta = 0 — only
# challenge_choice pays the quest's reward). Left null for every
# ordinary CHALLENGE quest; no existing quest needed to change.
@export var diagnosis_choice: DialogueChoice

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

A `BrowseZoneController.gd` (one reusable script) was planned to eventually
drive any Library/Museum zone, reading the zone's `book_ids`/`exhibit_ids`
and placing a simple `Interaction` per entry. In the end it was never
built: once real content existed, a direct `BookInteraction`/
`MentorInteraction`/`ExhibitInteraction` pair (each a thin `Interaction`
subclass plus its own card-panel UI, all three sharing the same
`EntryData`-derived shape and `DialogueBox`/`ChoicePanel`-style modal
pattern) turned out simpler than a generic placer would have been.

**`EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData`
are built** (`scripts/library/`, see `data/schemas/ENTRY_DATA_FORMAT.md`).
**Dictionary was always the exception**: a dictionary term isn't new
content, it's the same term/definition a lesson's own
`LessonData.vocabulary` already has, so `data/dictionary/goal.tres` and
`data/dictionary/trade-off.tres` reuse `builder-saving-l1`'s real
vocabulary keys verbatim.

**The Library, Mentor Hall, and Museum are now all populated with real,
sourced content** (`data/library/`: 8 real books; `data/mentors/`: 5 real
mentors; `data/museum/`: 16 real exhibits across 10 themed rooms — see
each `.tres` file's own `source_name`/`source_type`/`source_url`/
`verification_date`). A `LibraryManager` autoload loads every
`BookData`/`MentorData` into a registry, and a sibling `MuseumManager`
autoload (an exact mirror) loads every `ExhibitData`, both the same
data-driven pattern `QuestManager`/`WorldManager` already use — so adding
book, mentor, or exhibit N is still just dropping a new `.tres` file in,
never a script edit. See Section 6b for the Museum's own build.

**The Library is now a real, walkable zone with themed sections**
(`data/zones/library.tres`, `scenes/world/zones/library/Library.tscn`):
4 bookshelf sections (Money Basics, Saving & Budgeting, Business &
Entrepreneurship, Money Around the World) each hosting real
`BookInteraction` props (a new `Interaction` subclass, the Library's
equivalent of `NPC.gd` — a book doesn't talk, so it extends `Interaction`
directly rather than composing one), a reading nook, a Discovery Table,
a "more sections coming soon" sign (honestly naming the still-unbuilt
Leadership & Smart Skills and Mind Lab sections), and a second portal to
the new Mentor Hall zone. Walking up to a book and interacting shows
`BookCardPanel` (title, author, age range, 3-5 short "what you'll
discover" bullets, a Read More button that opens the real official
source via `OS.shell_open()`, an optional "Explore this topic in ___"
cross-link reusing `WorldManager.travel_to()` directly, and a source
toggle) — never copied book text, only short original framing lines.
The Librarian now offers real "can you find a book about ___?" discovery
prompts instead of the old "still preparing" line, one at a time in a
fixed order (the same "offer the next incomplete" pattern every other
zone-giver NPC uses) — see the new `EXPLORATION` quest kind below.

**Mentor Hall** (`data/zones/mentor-hall.tres`,
`scenes/world/zones/mentor_hall/MentorHall.tscn`), reached via a portal
inside Library, hosts 5 real, verifiable mentors as framed portraits
(`MentorInteraction`, mirroring `BookInteraction`): Katherine Johnson,
Ada Lovelace, George Washington Carver, Sara Blakely, and Daymond John.
Each opens `MentorCardPanel` — a WHO/WHAT-THEY-DID/CHALLENGE/SKILL
profile in original, factual paraphrase (never an invented quote), plus
an optional "Try a Challenge" button launching a small mini-quest
explicitly framed as "inspired by this skill" rather than the real
person addressing the child. 4 of the 5 mentors have one (Katherine
Johnson → a `CHALLENGE` about checking your work; Ada Lovelace → a
`SORT` about sequencing instructions; George Washington Carver → a
`CHALLENGE` about trying another experiment; Sara Blakely → a
`CHALLENGE` about improving a product from feedback); Daymond John has
none yet (his book and Entrepreneur Quest cross-link cover him instead,
a proportionate scope choice rather than forcing a fifth mini-quest).
Two mentors (Sara Blakely, Daymond John) still have an empty
`source_url` — their facts are well-documented and widely repeated, but
this project's environment had no outbound network access to find and
verify one specific official page for either, so none was guessed;
finding and adding a real source for each remains open work.

A new `QuestData.QuestKind.EXPLORATION` (previously declared but
unimplemented) now has a real runner, built specifically for these
discovery prompts: unlike every choice-driven kind, it's a standing
invitation rather than a modal flow — `QuestManager._start_exploration_quest()`
shows the prompt and returns immediately without setting `_active`, so a
child can keep exploring freely while it's pending. Opening any
`BookInteraction`/`MentorInteraction` calls
`QuestManager.notify_entry_discovered(entry_id)`, which completes any
pending `EXPLORATION` quest whose `target_entry_id` matches. `BrowseZoneController`
(the originally-planned generic placement controller) was never built —
in practice, a small `BookInteraction`/`MentorInteraction` pair proved
simpler and more direct than a generic placer, once real content existed
to build against.

### 6b. The Museum — 10 real rooms

The Museum (Section 6's fourth "Browse" destination, previously an
honestly-empty "coming soon" portal in the World Hub) is now a full,
walkable 10-room destination, built in 4 phases on top of Section 6's
existing `ExhibitData`/`EntryData` schema with only two small additive
fields (`cross_link_zone_id`, `followup_quest_id`, mirroring the fields
`BookData`/`MentorData` already had) — no new systems. A new
`MuseumManager` autoload (an exact mirror of `LibraryManager`) loads every
`ExhibitData` from `data/museum/*.tres` into a registry by `entry_id`. A
new `ExhibitInteraction` (an exact mirror of `BookInteraction`) shows a new
`ExhibitCardPanel` and reuses the existing `discover_entry()`/
`notify_entry_discovered()` pipeline. `ExhibitCardPanel` has two display
modes: an ordinary exhibit shows title/category/summary, with a
detail-toggle, a Learn More button (opens `source_url` via
`OS.shell_open()` when a real one exists), an optional Continue the Story
button (launches `followup_quest_id`), and an optional Explore button
(travels to `cross_link_zone_id` via `WorldManager.travel_to()`, the same
cross-linking convention the Library's books already use); a Failure
Museum exhibit instead shows its four-part What Happened / What Went
Wrong / What Could Have Been Different / What We Learn structure, with no
summary shown up front.

The 10 rooms, each its own `ZoneData` (`kind == MUSEUM`) chained by a
simple portal corridor (Before Money → First Coins → Strange Money →
Money Through Time → Banknote Lab → Gold Vault → Money Around the World →
Business & Invention → Museum of Mistakes → Future Money Lab, each room
also carrying a portal straight back to the World Hub):

1. **Before Money** — a Trader NPC and a barter exhibit (`before-money`,
   source: British Museum); a `CHALLENGE` quest lets the child try solving
   a barter problem.
2. **First Coins** — exploration-only: the `first-coins` exhibit (source:
   American Numismatic Association).
3. **Strange Money** — two exploration-only exhibits, Rai stones and
   cowrie shells (sources: British Museum, American Numismatic
   Association).
4. **Money Through Time** — a Timekeeper NPC gives a `SORT`-kind quest
   (put barter/coins/paper-money/cheques/cards/contactless-payments in
   rough chronological order) followed by an open reflection choice with
   no wrong answer.
5. **Banknote Lab** — an Inspector NPC gives a `SPOT`-kind "Banknote
   Detective" quest (spot which features are genuine security features vs.
   decoys — `SpotItemData.is_suspicious` reused semantically to mean
   "is this a real security feature," an honest reuse of the existing
   mechanic rather than a new one) alongside the `banknote-design` exhibit
   (source: Bank of England Museum).
6. **Gold Vault** — the `gold-bar` exhibit (source: Royal Mint), with a
   cross-link to Money Quest's existing Golden Vault zone, honoring the
   brief's "connections to Money Quest" requirement directly rather than
   inventing a new mechanic for it.
7. **Money Around the World** — five currency exhibits in a row (pound
   sterling, yen, euro, rupee, M-Pesa), exploration-only; M-Pesa's facts
   are widely documented but have no single official source page, so its
   `source_url`/`verification_date` are honestly left empty rather than
   guessed, with `source_name` describing it plainly as "widely documented
   in mobile-money and financial-inclusion research."
8. **Business & Invention** — the `post-it-note` exhibit (3M's own
   well-documented "accidental idea" story) next to an 8-sign "problem →
   idea → product → customer → price → sale → feedback → improvement"
   walkway connecting the room directly to Entrepreneur Quest's own
   build chain, with a cross-link to Idea Lab.
9. **Museum of Mistakes** — two Failure Museum exhibits, New Coke and the
   Kodak digital camera, each using only real, widely documented facts and
   the required What Happened / What Went Wrong / What Could Have Been
   Different / What We Learn structure. Each links to a `CHALLENGE`
   follow-up quest (`museum-new-coke-quest`, `museum-kodak-quest`) with 3
   choices; critically, **every choice's consequence states the same real
   historical outcome** (Coca-Cola Classic's return within about 3 months;
   Kodak's 2012 bankruptcy filing) rather than letting the child's pick
   change history, satisfying the brief's "the real historical outcome
   should then be shown" requirement regardless of which option is
   chosen. Both exhibits cross-link to Leadership Academy.
10. **Future Money Lab** — the last room (Hub portal only, no portal
    onward). A Future Guide NPC asks three plain reflective questions
    (no choice, no reward) about how money might keep changing. Two
    exploration-only exhibits, digital payments and digital identity,
    cross-link to Sky Exchange; the digital-identity exhibit explicitly
    states cryptocurrency is mentioned only as something that exists, with
    the game recommending neither buying, investing in, nor using it —
    keeping the brief's "no financial advice, no investment/crypto
    promotion" rule intact even where the topic is unavoidable.

Sourcing follows Section 6's existing discipline exactly: every fact that
matches a source in your supplied list (British Museum, American
Numismatic Association, Royal Mint, Bank of England Museum) uses that
real URL; every fact without one (M-Pesa, the Post-it Note, New Coke,
Kodak, general digital-payments/identity facts) is marked with an honest
`source_name` describing it as widely documented, and `source_url`/
`verification_date` are left empty rather than invented — this
environment's outbound network access remains blocked, confirmed again
this phase against several of the same domains tested in Section 6.

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
| World Hub scene, 7 portals | **Built** — all 7 functional (Money Quest, Entrepreneur Quest, Leadership Quest, Calm World, Library, Mind Lab, Museum) |
| Money Quest's Golden Vault zone + Maya's quest (`builder-saving-l1`) | **Built** — reuses the existing `LessonData`/`LessonManager`/`SavingsAllocationMiniGame`/UI overlays unchanged |
| Golden Vault's Savings Guide + "What Does Saving Mean?" quest (`explorer-saving-l1`) | **Built** — Golden Vault's second quest-giving NPC: a second real lesson on the same topic needed only a new NPC node, not a new zone; `LessonData.choice_point` with no mini-game, same shape as Market Town/Guardian Gate |
| Golden Vault's Theo + "Saving vs. Spending: The Real Trade-off" quest (`strategist-saving-l1`) | **Built** — Golden Vault's third quest-giving NPC; completes the "saving" topic's full 3-age-band trilogy (Maya, Savings Guide, Theo) in one zone; `LessonData.choice_point` with no mini-game |
| Money Quest's Market Town zone + Baker's quest (`explorer-needs_wants-l1`) | **Built** — reached via a portal inside Golden Vault (Money Quest's first 2-zone graph); uses `LessonData.choice_point` with no mini-game |
| Market Town's Leah + "The Grey Area" quest (`builder-needs_wants-l1`) | **Built** — Market Town's second quest-giving NPC; Leah is the real child from the lesson's own story; `LessonData.choice_point` with no mini-game; only `strategist-needs_wants-l1` remains untouched of this topic's 3 age bands |
| Market Town's Jordan + "Needs, Wants, and Social Pressure" quest (`strategist-needs_wants-l1`) | **Built** — Market Town's third quest-giving NPC, completing the full 3-age-band "needs_wants" topic trilogy in one zone (the 5th single-topic zone completed, after "saving", "money_basics", "long_term_thinking", "giving"); Jordan is the real teen from the lesson's own story (they/them, preserved as in the real source text); `LessonData.choice_point` with no mini-game |
| Money Quest's Guardian Gate zone + Zara's quest (`builder-scams-l1`, "Spotting a Scam") | **Built** — reached via a portal inside Market Town (Golden Vault → Market Town → Guardian Gate, Money Quest's first 3-zone graph); ports the real website lesson verbatim (title/objective/vocabulary/explanation/quiz/feedback), with Zara, the real child from the lesson's own story, as the giver NPC; another `LessonData.choice_point` with no mini-game |
| Guardian Gate's Grown-up + "Some Promises Are Too Good" quest (`explorer-scams-l1`) | **Built** — Guardian Gate's second quest-giving NPC; the real lesson's story has no named child (second person "you," with the second character simply "a grown-up nearby"), so the giver NPC uses that role as its generic name, the same convention Market Town's Baker established; because the real quiz already tests the lesson's core "tell a grown-up, don't click" fact directly, the choice_point is a downstream decision (how to follow up on the pop-up) rather than whether to click at all, the same safeguard used for the Sticker Keeper's and Friend's lessons; only `strategist-scams-l1` remains untouched of the "scams" topic's 3 age bands |
| Guardian Gate's Marcus + "Scams Target Emotions, Not Logic" quest (`strategist-scams-l1`) | **Built** — Guardian Gate's third quest-giving NPC, completing the full 3-age-band "scams" topic trilogy in one zone (the same way Golden Vault completed "saving", Coin Cove completed "money_basics", Horizon Peaks completed "long_term_thinking", and Kindness Grove completed "giving" — the 6th single-topic zone to reach all 3 age bands); Marcus is the real teen from the lesson's own story; unlike the other two "scams" lessons, this quiz tests a conceptual mechanism (scams trigger a strong feeling to bypass careful thinking) rather than a specific action, so the choice_point is free to mirror the lesson's own pause-and-verify habit directly (two different, equally valid ways to verify a suspicious message) with no risk of contradicting the quiz |
| Money Quest's Sky Exchange zone + Sam's quest (`builder-currencies-l1`, "Cash, Cards, and Currencies") | **Built** — reached via a portal inside Guardian Gate (Golden Vault → Market Town → Guardian Gate → Sky Exchange, Money Quest's first 4-zone graph); real website world id `sky-exchange`, real badge display name "Currency Explorer"; Sam is the real child from the lesson's own story; another `LessonData.choice_point` with no mini-game; `sky-exchange` hosts 4 real topics on the website (currencies, digital_money, investing_basics, junior_isa), so this zone is a natural future home for more quest-giving NPCs the same way Golden Vault grew to 3 |
| Sky Exchange's Omar + "How a Card Payment Actually Works" quest (`builder-digital_money-l1`) | **Built** — Sky Exchange's second quest-giving NPC, the same "a zone can grow another resident" pattern Golden Vault proved; Omar is the real child from the lesson's own story; `LessonData.choice_point` with no mini-game; 2 of `sky-exchange`'s 4 real topics remain untouched (investing_basics, junior_isa) |
| Sky Exchange's Mei + "Owning a Small Piece of a Company" quest (`builder-investing_basics-l1`) | **Built** — Sky Exchange's third quest-giving NPC; Mei is the real child from the lesson's own story (her uncle owns the shares); `LessonData.choice_point` with no mini-game; only `junior_isa` remains untouched of `sky-exchange`'s 4 real topics |
| Sky Exchange's Tomasz + "Locked Until 18: How a Junior ISA Works" quest (`builder-junior_isa-l1`) | **Built** — Sky Exchange's fourth quest-giving NPC; Tomasz is the real child from the lesson's own story; `LessonData.choice_point` with no mini-game; this completes all 4 real website topics hosted in `sky-exchange` (currencies, digital_money, investing_basics, junior_isa) at the builder age band — unlike every other zone's "full," each of these 4 topics still has its explorer/strategist age bands untouched |
| Sky Exchange's Visiting Friend + "Money Looks Different Everywhere" quest (`explorer-currencies-l1`) | **Built** — Sky Exchange's fifth quest-giving NPC, the first lesson to grow one of Sky Exchange's 4 topics beyond its builder age band; the real lesson's story has no named child, so the giver NPC uses that role as its generic name (as "Visiting Friend" rather than plain "Friend," to avoid reusing Kindness Grove's existing `friend` npc_id even though it would be harmless); only `strategist-currencies-l1` remains untouched of the "currencies" topic's 3 age bands |
| Sky Exchange's Elena + "Understanding Exchange Rates" quest (`strategist-currencies-l1`) | **Built** — Sky Exchange's sixth quest-giving NPC, completing the "currencies" topic's full 3-age-band trilogy in one zone (the 7th single-topic trilogy completed, after "saving", "money_basics", "long_term_thinking", "giving", "needs_wants", "scams"); Elena is the real teen from the lesson's own story; like Marcus's scams lesson, this quiz tests a conceptual fact (exchange rates change over time) rather than a specific action, so the choice_point mirrors the lesson's own recommended habit directly (check today's rate vs. compare rates across providers) with no risk of contradicting it; Sky Exchange's other 3 topics (digital_money, investing_basics, junior_isa) remain builder-only |
| Sky Exchange's Mum + "Money You Can't Hold" quest (`explorer-digital_money-l1`) | **Built** — Sky Exchange's seventh quest-giving NPC, the first lesson to grow "digital_money" beyond its builder age band; the real lesson's story has no named child, so the giver NPC uses that role as its generic name ("Mum," matching the real story's own wording); the quiz tests a specific identification task, so the choice_point is a downstream decision (what to do after noticing the tap) rather than re-asking the same classification; only `strategist-digital_money-l1` remains untouched of this topic's 3 age bands |
| Sky Exchange's Priya + "Staying Safe and Aware With Digital Money" quest (`strategist-digital_money-l1`) | **Built** — Sky Exchange's eighth quest-giving NPC, completing the "digital_money" topic's full 3-age-band trilogy in one zone (the 8th single-topic zone/topic to reach all 3 age bands); Priya is the real teen from the lesson's own story; her name coincidentally matches Coin Cove's Priya (an unrelated real character from a different real source text) — harmless, same reasoning as the earlier Theo/Omar collisions (Section 3); the quiz tests a conceptual fact (digital payments lack a felt physical action), so the choice_point mirrors the lesson's own recommended habits directly; Sky Exchange's remaining 2 topics (investing_basics, junior_isa) stay builder-only |
| Sky Exchange's Leo + "Saving vs Growing Your Money" quest (`explorer-investing_basics-l1`) | **Built** — Sky Exchange's ninth quest-giving NPC, the first lesson to grow "investing_basics" beyond its builder age band; Leo is the real child from the lesson's own story; the quiz asks for a specific classification, so the choice_point is a downstream decision (ask for another example vs. decide saving is still right for him) rather than re-testing the same classification; only `strategist-investing_basics-l1` remains untouched of this topic's 3 age bands |
| Sky Exchange's Jamal + "Risk, Diversification, and Time" quest (`strategist-investing_basics-l1`) | **Built** — Sky Exchange's tenth quest-giving NPC, completing the "investing_basics" topic's full 3-age-band trilogy in one zone (the 9th single-topic zone/topic to reach all 3 age bands); Jamal is the real teen from the lesson's own story; unlike Leo's lesson, this quiz tests a separate conceptual fact (investing vs. gambling) rather than which allocation Jamal picks, so the choice_point mirrors the lesson's own real decision directly (put it all in one company vs. spread it across several), with neither option graded; only `junior_isa` remains untouched among Sky Exchange's 4 topics |
| Sky Exchange's Freya + "A Special Savings Account Just for Kids (UK)" quest (`explorer-junior_isa-l1`) | **Built** — Sky Exchange's eleventh quest-giving NPC, the first lesson to grow "junior_isa" beyond its builder age band — this topic was, until now, the only Money Quest topic untouched at every age band; Freya is the real child from the lesson's own story; the quiz asks a specific ownership question, so the choice_point is a downstream decision (ask Grandma why vs. ask Mum when she can use it) rather than re-testing the same ownership fact; only `strategist-junior_isa-l1` remains untouched in all of Money Quest |
| Sky Exchange's Aaliyah + "Junior ISAs: Ownership, Timing, and Changing Rules" quest (`strategist-junior_isa-l1`) | **Built** — Sky Exchange's twelfth and final quest-giving NPC, completing the "junior_isa" topic's full 3-age-band trilogy in one zone (the 10th and final single-topic zone/topic to reach all 3 age bands) — **this completes all 30 of Money Quest's real website curriculum lessons across all 10 topics and 3 age bands**; Aaliyah is the real teen from the lesson's own story; the quiz tests a conceptual fact (the £9,000 figure is current, not permanent), so the choice_point mirrors the lesson's own recommended habit directly (check an official source vs. ask parents what changed before) with no risk of contradicting it |
| Money Quest's Coin Cove zone + Shopkeeper's quest (`explorer-money_basics-l1`, "What Is Money?") | **Built** — reached via a portal inside Sky Exchange (Golden Vault → Market Town → Guardian Gate → Sky Exchange → Coin Cove, Money Quest's first 5-zone graph); real website world id `coin-cove` (actually orderIndex 1 on the website, "where every quest begins" — a presentation detail, not a curriculum dependency, since this game's chain was built in a different order); the real lesson's story has no named child (it's written in second person), so the giver NPC uses the same "generic role name" convention Market Town's Baker established rather than inventing a named child; another `LessonData.choice_point` with no mini-game |
| Coin Cove's Amir + "Where Does Money Come From?" quest (`builder-money_basics-l1`) | **Built** — Coin Cove's second quest-giving NPC; Amir is the real child from the lesson's own story; `LessonData.choice_point` with no mini-game; only `strategist-money_basics-l1` remains untouched of Coin Cove's 1 real topic's 3 age bands |
| Coin Cove's Priya + "Money as a Tool, Not a Goal" quest (`strategist-money_basics-l1`) | **Built** — Coin Cove's third quest-giving NPC, completing the full 3-age-band "money_basics" topic trilogy in one zone (the same way Golden Vault completed "saving"); Priya is the real child from the lesson's own story; her name coincidentally matches Leadership Academy's Priya (an unrelated real character from a different real source text) — harmless, since quest-completion state keys off `quest_id` not `npc_id` and the two zones are never loaded simultaneously, same reasoning as the earlier Theo collision (Section 3); `LessonData.choice_point` with no mini-game |
| Money Quest's Horizon Peaks zone + Finn's quest (`builder-long_term_thinking-l1`, "Planning a Few Steps Ahead") | **Built** — reached via a portal inside Coin Cove (Golden Vault → Market Town → Guardian Gate → Sky Exchange → Coin Cove → Horizon Peaks, Money Quest's first 6-zone graph); real website world id `horizon-peaks`, real badge display name "Future Planner"; Finn is the real child from the lesson's own story; another `LessonData.choice_point` with no mini-game |
| Horizon Peaks' Aisha + "Big Decisions, Long Timelines" quest (`strategist-long_term_thinking-l1`) | **Built** — Horizon Peaks' second quest-giving NPC; Aisha is the real teen from the lesson's own story; unlike every prior choice_point, this lesson's own text explicitly says there's no single right answer (spend a paycheck now vs. save some for later), so the choice_point directly mirrors the real decision instead of a sidestep scenario — safe because the quiz tests deliberateness, not which option was picked; `LessonData.choice_point` with no mini-game |
| Horizon Peaks' Sticker Keeper + "Waiting Can Pay Off" quest (`explorer-long_term_thinking-l1`) | **Built** — Horizon Peaks' third quest-giving NPC, completing the full 3-age-band "long_term_thinking" topic trilogy in one zone (the same way Golden Vault completed "saving" and Coin Cove completed "money_basics"); the real lesson's story has no named child, so the giver NPC uses the same "generic role name" convention Market Town's Baker established; `LessonData.choice_point` with no mini-game |
| Money Quest's Kindness Grove zone + Omar's quest (`builder-giving-l1`, "Giving on Purpose") | **Built** — Money Quest's seventh and final zone, reached via a portal inside Horizon Peaks (Golden Vault → Market Town → Guardian Gate → Sky Exchange → Coin Cove → Horizon Peaks → Kindness Grove, completing all 7 of the real website's Money Quest zones); real website world id `kindness-grove`, real badge display name "Giving Hero"; Omar is the real child from the lesson's own story — his name coincidentally matches Sky Exchange's Omar (an unrelated real character from a different real source text), harmless for the same reason as the earlier Theo/Priya collisions (Section 3); another `LessonData.choice_point` with no mini-game |
| Kindness Grove's Friend + "The Joy of Sharing" quest (`explorer-giving-l1`) | **Built** — Kindness Grove's second quest-giving NPC; the real lesson's story has no named child (second person "you" sharing with "your friend"), so the giver NPC uses that role as its generic name, the same convention Market Town's Baker established; since the real story's outcome (sharing a coin so both can play) is fixed and tested by the curriculum's own quiz, the choice_point is a downstream decision (who goes first) rather than whether to share — the same safeguard used for the Sticker Keeper's lesson in Horizon Peaks; `LessonData.choice_point` with no mini-game |
| Kindness Grove's Sofia + "Giving Thoughtfully" quest (`strategist-giving-l1`) | **Built** — Kindness Grove's third quest-giving NPC, completing the full 3-age-band "giving" topic trilogy in one zone (the same way Golden Vault completed "saving", Coin Cove completed "money_basics", and Horizon Peaks completed "long_term_thinking"); Sofia is the real teen from the lesson's own story; `LessonData.choice_point` with no mini-game |
| Entrepreneur Quest's Idea Lab zone + "Handle Competition" quest | **Built** — a `CHALLENGE`-kind quest porting the website's real `competitor-lower-price` decision event (`src/content/entrepreneur-quest/structures.ts`) verbatim; proves the same pipeline carries a second Quest track with zero new systems |
| Entrepreneur Quest's Marketing Studio zone + "Create Your Marketing" quest | **Built** — reached via a portal inside Idea Lab (Entrepreneur Quest's first 2-zone graph); another `CHALLENGE`-kind quest, porting the real `product-unclear` decision event verbatim |
| Entrepreneur Quest's Workshop zone + "Handle a Customer Problem" quest | **Built** — reached via a portal inside Marketing Studio (Idea Lab → Marketing Studio → Workshop, Entrepreneur Quest's first 3-zone graph); another `CHALLENGE`-kind quest, porting the real `too-expensive-feedback` decision event verbatim |
| Workshop's Supplier + "Rising Material Costs" quest | **Built** — Workshop's second quest-giving NPC, the first "a zone can grow another CHALLENGE-kind resident" case in Entrepreneur Quest, same pattern Money Quest proved throughout; ports the real `materials-cost-increase` decision event verbatim — the sibling event under the same real "handle-a-customer-problem" BUILD stage as the Workshop Guide's quest; the real decision has no secondary character at all (pure second-person framing), so "Supplier" is an invented mentor-role name tied to the scenario, the same convention every Entrepreneur Quest giver NPC so far has used (the website's BUILD-stage decisions never name anyone); 4 of 25 real decision events now ported |
| Entrepreneur Quest's Office zone + "Make a Business Decision" quest | **Built** — reached via a portal inside Workshop (Idea Lab → Marketing Studio → Workshop → Office, Entrepreneur Quest's first 4-zone graph); a brand-new zone rather than growing an existing one, since the real "make-a-business-decision" BUILD stage had no Godot zone/NPC yet; `title_key`/`intro_text_key` reuse that real BUILD stage's own `title`/`learnText` verbatim ("Make a Business Decision" / "Good business owners think through their choices instead of just guessing."), the established convention for the first quest built under a given stage; ports the real `more-orders-than-expected` decision event verbatim via the Office Guide, another invented mentor-role name (the decision has no secondary character at all) |
| Office's Teammate + "A Teammate's Idea" quest | **Built** — Office's second quest-giving NPC, another "zone grows another resident" case; ports the real `teammate-wants-change` decision event verbatim — the sibling event under the same real "make-a-business-decision" BUILD stage as the Office Guide's quest; since that stage's real title/learnText was already used by the Office Guide's quest, this quest's title/intro are original framing instead, the same convention Workshop's Supplier established; "Teammate" is an invented mentor-role name matching the real decision text's own wording ("someone helping with your business," "your teammate") |
| Entrepreneur Quest's Growth Lab zone + "Grow Your Business" quest | **Built** — reached via a portal inside Office (Idea Lab → Marketing Studio → Workshop → Office → Growth Lab, Entrepreneur Quest's first 5-zone graph); a brand-new zone, since the real "grow-your-business" BUILD stage (the only stage besides "make-a-business-decision" with no Godot zone/NPC yet) had none; `title_key`/`intro_text_key` reuse that real stage's own `title`/`learnText` verbatim ("Grow Your Business" / "Sometimes things don't go as planned. Growing a business often means trying again with something new."), the established convention for the first (and, per the real site, only) quest under this stage; ports the real `fewer-sales-than-expected` decision event verbatim via the Growth Guide, another invented mentor-role name |
| Entrepreneur Quest's Research Lab zone + "Research Demand"/"Test the Idea" quests | **Built** — reached via a portal inside Growth Lab (Idea Lab → Marketing Studio → Workshop → Office → Growth Lab → Research Lab, Entrepreneur Quest's first 6-zone graph); a brand-new zone built with 2 residents from the start, the same shape Office used, since the real "research-demand" and "test-the-idea" BUILD stages (the website's two earliest decisions, order 3 and 4) had no Godot zone/NPC yet; the Research Guide's "Research Demand" quest ports the real `market-detective-reflection` decision event verbatim, but the real website version shows a market-data TABLE (the fixed "Fresh Trout" scenario: 300 interested customers, 75 recent buyers, 4 competitors) before the reflection question — Godot has no such table UI, so the Research Guide instead speaks the same real numbers as `intro_dialogue` lines, in the real data's own order and values, before the identical real situation/choices/consequences; this is a presentation-shape adaptation only, not invented content, and resolves the "not yet designed" gap the previous phase flagged. The Test Guide's "Test the Idea" quest ports the real `test-before-invest` decision event verbatim (a simple 2-choice decision with no table dependency); both quests' titles/intros reuse their real stages' own title/learnText verbatim, being each stage's only quest. **All 9 of Entrepreneur Quest's v1 decision events are now ported** (9 of 25 real decision events overall) — only the entire v2 set (RUN, Business Problems, AI Lab, Rescue & Grow — 16 decision events) remains |
| `QuestData.diagnosis_choice` + Entrepreneur Quest's Main Street zone + "Not Enough Customers" quest | **Built** — reached via a portal inside Research Lab (Entrepreneur Quest's first 7-zone graph); Main Street is the first EQ zone not tied to one specific real BUILD stage, since the real website's v2 "Business Problems" library is reusable content encountered during the RUN phase, not a BUILD stage; hosts the Shop Manager, whose "Not Enough Customers" quest ports the real `not-enough-customers` Business Problem verbatim — a richer shape than any earlier CHALLENGE quest (investigate 3 clues -> identify a likely cause, reflective and unrewarded -> choose a response, the real rewarded decision). This motivated a new, minimal `QuestData.diagnosis_choice` field (nullable `DialogueChoice`, shown between `intro_text_key` and `challenge_choice`; see its own doc comment and `QUEST_DATA_FORMAT.md`) rather than a new mechanic category — `QuestManager._run_challenge_quest` just runs one extra `ChoicePanel.show_choice` call when it's set, paying no reward (the real cause options' own `ConsequenceEffect`s carry `coin_delta = 0`/`xp_delta = 0`). The clues are spoken as `intro_dialogue` lines (no new UI); the shared UI prompt "What's the likely cause?" (`entrepreneurQuest.problemFlow.causeLabel`) and the shared framing sentence "Real businesses run into problems..." (`entrepreneurQuest.problemsListIntro`) are both ported verbatim and reused by every future Business Problem quest.
| Main Street's Accountant + "Costs Increased" quest | **Built** — Main Street's second quest-giving NPC, the same "zone grows another resident" pattern every other EQ zone has used; ports the real `costs-increased` Business Problem verbatim via the same investigate-diagnose-respond shape (3 clues as `intro_dialogue`, 3 causes as `diagnosis_choice`, 3 responses as `challenge_choice`); "Accountant" is another invented mentor-role name tied to the scenario (reviewing rising costs).
| Main Street's Support Rep + "A Negative Review" quest | **Built** — Main Street's third quest-giving NPC, the same "zone grows another resident" pattern; ports the real `negative-review` Business Problem verbatim via the same investigate-diagnose-respond shape; "Support Rep" is another invented mentor-role name tied to the scenario (handling customer feedback).
| Main Street's Sales Tracker / Profit Analyst / Cash Flow Advisor / Warehouse Keeper + their 4 quests | **Built** — Main Street's fourth through seventh quest-giving NPCs, completing the zone in one phase; each ports a real v2 Business Problem verbatim via the exact same investigate-diagnose-respond shape (3 clues as `intro_dialogue`, 3 causes as `diagnosis_choice`, 3 responses as `challenge_choice`): Sales Tracker gives "Sales Are Falling" (`sales-falling`), Profit Analyst gives "Why Aren't We Making Money?" (`rising-costs-eating-profit`), Cash Flow Advisor gives "Profit But No Cash" (`profit-but-no-cash`), and Warehouse Keeper gives "Too Much Unsold Stock" (`too-much-stock`); all 4 are invented mentor-role names tied to their own scenario. **This completes all 7 of the v2 Business Problems library** — Main Street now has 7 quest-giving NPCs, Entrepreneur Quest's largest single zone |
| Leadership Quest's Leadership Academy zone + "The Big Mistake" quest | **Built** — a `CHALLENGE`-kind quest porting the website's real `big-mistake-choice` decision event verbatim, with Priya as a real-character NPC; this is what motivated `QuestData.intro_dialogue` (Section 4) |
| Leadership Quest's Team Challenge zone + "The Angry Customer" quest | **Built** — reached via a portal inside Leadership Academy (Leadership Quest's first 2-zone graph); another `CHALLENGE`-kind quest with Theo as a real-character NPC, porting the real `angry-customer-choice` decision event verbatim |
| Leadership Quest's Strategy Room zone + "The Better Idea" quest | **Built** — reached via a portal inside Team Challenge (Leadership Academy → Team Challenge → Strategy Room, Leadership Quest's first 3-zone graph); another `CHALLENGE`-kind quest with Nadia (the 3rd of Leadership Quest's 4 real characters used so far) as the giver NPC, porting the real `better-idea-choice` decision event verbatim |
| Leadership Quest's Huddle Room zone + "Everyone Has an Idea" quest | **Built** — reached via a portal inside Strategy Room (Leadership Academy → Team Challenge → Strategy Room → Huddle Room, Leadership Quest's first 4-zone graph); Oren is the giver NPC — the 4th and last of Leadership Quest's 4 real characters (Nadia, Oren, Priya, Theo), completing the real cast; ports the real `everyone-has-an-idea-choice` decision event verbatim, including its own `nadia`/`oren` intro dialogue |
| Team Challenge's Theo + "The Missing Task" quest (Theo's second quest) | **Built** — ports the real `missing-task-choice` decision event verbatim, including its own `theo`/`priya` intro dialogue plus 3 narrator-style "investigate" lines (the real site's tap-to-reveal clues, shown here as sequential `intro_dialogue` lines, the same adaptation Entrepreneur Quest's Business Problems already used for their own clues); since Leadership Quest has only 4 real characters total and all 4 already have their own zone, this is the first "one NPC gives a second quest" case — `TeamChallenge.gd` now offers Theo's next incomplete quest in a fixed order rather than inventing a new NPC for a mission with no new character. (5 of 12 real missions ported at this point: Big Mistake, Angry Customer, Better Idea, Everyone Has an Idea, The Missing Task) |
| `MATCH`/`SPOT`/`ALLOCATE`/`SORT`/`MULTI_STEP` quest kinds + `MatchPanel`/`SpotPanel`/`AllocatePanel`/`SortPanel` autoloads | **Built** — 4 new `QuestData.QuestKind` values plus a 5th combinator (`MULTI_STEP`), 5 new core Resource classes (`MatchPairData`, `SpotItemData`, `AllocateCategoryData`, `SortBucketData`, `SortItemData`), and 4 new autoloaded `CanvasLayer` UI panels mirroring `ChoicePanel`'s own conventions (centered `PanelContainer`, runtime-generated buttons, `await`-based modal flow), porting the real website's own reusable mini-game mechanics (`src/game-engine/mechanics/{Match,Spot,Allocate,Sort}Mechanic.tsx`) faithfully: `MatchPanel` is tap-tap matching with a shuffled right column and wrong-match flash+retry (never drag); `SpotPanel` is toggle-select-then-submit with an exact-set check and unlimited retry; `AllocatePanel` is a fixed-step +/- stepper with a remaining-amount readout, retry-until-correct; `SortPanel` is tap-select-then-tap-bucket, also never drag, also retry-until-correct — matching the real site's "always eventually succeeds" design in every case. `QuestManager` was refactored into shared helpers (`_show_intro`, `_run_one_choice`, `_pay_flat_reward`) reused by the existing `_run_challenge_quest` (behavior-preserving) and 5 new runners. See `data/schemas/QUEST_DATA_FORMAT.md`'s new "Mini-game quest kinds" section |
| Leadership Quest's remaining 7 real missions (`meet-your-team`, `first-challenge`, `team-conflict`, `motivation-problem`, `the-deadline`, `pressure-test`, `final-challenge`) | **Built** — ported verbatim using the new mechanics above, with NO new zones: each of Leadership Quest's 4 characters simply grew a longer fixed quest queue (the same "NPC offers next incomplete quest in order" pattern Theo's 2-quest queue already proved). Priya (Leadership Academy) now gives 4: Meet Your Team (`MATCH`) → First Challenge (`MATCH`, no follow-up choice) → Big Mistake → Pressure Test (`SORT`). Theo (Team Challenge) now gives 4: Angry Customer → The Missing Task → The Team Conflict (`SPOT`) → The Deadline (`ALLOCATE`). Nadia (Strategy Room) now gives 2: Better Idea → The Final Challenge (`MULTI_STEP`: a matching mini-game followed by two separate decision points). Oren (Huddle Room) now gives 2: Everyone Has an Idea → The Motivation Problem (`SPOT`). The Final Challenge's first decision point uses the real site's own `"none"`-tag fallback situation text verbatim, since Godot has no equivalent of the website's Leadership Profile archetype tracking that personalizes it there for a returning player — an honest simplification, not fabricated content. **This completes all 12 of Leadership Quest's real missions** |
| `AvatarConfig` + creation screen, fully wired to the 3D model | **Built** — 4 body presets (including a seated wheelchair-style look) and 4 accessories (glasses, cap, hearing aid, cane), all purely visual, listed together as equally normal choices |
| Progression fields for zones/quests/skills | **Built** (additive) |
| Entrepreneur Quest's Supply Yard zone (4 NPCs) | **Built** — reached via a second portal inside Main Street, Entrepreneur Quest's eighth zone; hosts the real website's remaining v2 "Run Your Business" activities that aren't Business Problems. The Pricing Tester's "The Pricing Experiment" ports `pricing-experiment-reflection` verbatim — the real site shows 3 pre-authored price/units-sold rows in a table; Godot has no table UI, so the real rows are spoken as `intro_dialogue` lines instead, the same adaptation Research Lab's Fresh Trout data already used. The Supplier Scout's "Choose a Supplier" ports `choose-a-supplier` verbatim, narrating each of the 3 suppliers' real structural price/delivery/minimum-order/quality levels (`EQ_SUPPLIER_OPTIONS`) as dialogue instead of a table. The Stock Keeper's "Managing Your Stock" ports `stock-management-scenario` verbatim — kept as its own quest/NPC rather than folded into the supplier choice, matching the "one NPC per decision" shape every other Entrepreneur Quest zone uses. The Bookkeeper's "Cash Flow" ports `cash-flow-decision` verbatim, including the real restaurant-order scenario's own numbers (2000/30 days/600), spoken as plain numbers since this project's virtual economy has no real-currency formatting to apply to them |
| Entrepreneur Quest's AI Workshop zone (1 NPC) | **Built** — reached via a portal inside Supply Yard, Entrepreneur Quest's ninth zone; the Tech Advisor's "AI Can Be Wrong" ports the real `ai-wrong-answer` decision event verbatim, keeping the real site's own "Simulated AI Assistant (not real AI)" framing intact — 100% pre-written dialogue, never an actual AI integration. The real site's other AI Lab facets (a pure-lookup Q&A list, a prompt-quality quiz, a privacy quiz) are non-decision mechanics, left unbuilt for the same reason every BUILD stage's own non-decision mechanics remain unbuilt |
| Entrepreneur Quest's Turning Point zone (5 NPCs) | **Built** — reached via a portal inside AI Workshop, Entrepreneur Quest's tenth zone; hosts the real website's standalone "Rescue & Grow" decision events (not the separate Business Rescue scenario, which reuses 3 existing Business Problems against its own fixed company and local-stats model — left unbuilt). The Business Advisor's "Business Pivot" ports `business-pivot` verbatim, with its real `{businessName}`-templated situation spoken generically as "your business" since Godot's CHALLENGE quests have no persisted company identity to fill that placeholder — an honest simplification. The Growth Coach's "Grow or Stay Small" ports `grow-or-stay-small` verbatim. The Ad Reviewer, Quality Inspector, and Sourcing Advisor each port one of the real website's 3 Business Ethics scenarios verbatim — "The Misleading Ad" (`misleading-ad`), "Hiding a Problem" (`hiding-a-problem`), and "The Questionable Supplier" (`cheap-questionable-supplier`) — kept as 3 separate NPCs/quests rather than one multi-part quest. **This completes all 26 of Entrepreneur Quest's real decision events** |
| `BusinessProfileData`/`BusinessLogoData` + `BusinessBuilder` autoload + 6 new UI panels (`TextInputPanel`, `LogoBuilderPanel`, `CategoryPickerPanel`, `NumericInputPanel`, `SimulatorPanel`, `PitchDisplayPanel`) | **Built** — Entrepreneur Quest's real BUILD stepper (`src/app/[locale]/entrepreneur-quest/build/page.tsx`), all 18 real stages in order, ported as a new persistent-state feature rather than another CHALLENGE quest (see `BusinessBuilder.gd`'s own doc comment for why). The Idea Lab's new Startup Mentor NPC launches/resumes it. 7 stages whose real content is already a ported CHALLENGE quest (`research-demand`, `test-the-idea`, `create-your-marketing`, `handle-competition`, `handle-a-customer-problem` ×2, `make-a-business-decision` ×2, `grow-your-business`) delegate to `QuestManager.start_quest()` rather than duplicating content; the other 11 get one of the 6 new panels. `TextInputPanel` ports the `reflect-text` stages (find a problem, create an idea, name your business, the final pitch's 2 questions) as a generic single/multi-line field with an optional safety hint. `LogoBuilderPanel` ports the logo stage as shape/color/symbol pickers over a procedurally-drawn preview (`LogoPreviewDraw`, a custom-`_draw()` Control — never an image file), using the real site's own 4 design-token hex colors. `CategoryPickerPanel` is a generic category grid reused for product/customer/marketing category selection. `NumericInputPanel` ports the costs/price stages as a +/- stepper, the same no-typed-number convention `AllocatePanel` established. `SimulatorPanel` ports the Business Simulator's exact `runSimulator()` formula (units made/sold, sales, costs, profit, remaining money) verbatim from `src/lib/entrepreneur-quest/state.ts`. `PitchDisplayPanel` shows the final read-only summary, deliberately omitting the real site's running `reputationOutOf5` line since Godot's flat-reward quests never accumulated that stat — an honest gap, not invented. All money values are plain major-unit integers, matching this project's established no-currency-formatting convention for its virtual economy. **This completes Entrepreneur Quest's full real BUILD → RUN → RESCUE & GROW track end to end** |
| Entrepreneur Quest's remaining real content (the 5 standalone Business Challenges, the RUN/Rescue & Grow hub pages, and the separate Business Rescue scenario) | Not built — these are UI shapes the mission/zone/NPC architecture doesn't fit (a standalone quiz list, hub/dashboard pages with no new decision content of their own, a second company's own local-stats model), not new decision events or BUILD-stage mechanics; with the BUILD stepper now built, this is the final honest remaining gap in Entrepreneur Quest |
| `EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData` schema | **Built** (`scripts/library/`, see `data/schemas/ENTRY_DATA_FORMAT.md`) |
| Dictionary content | **Built** — 2 real terms (`goal`, `trade-off`), reusing `builder-saving-l1`'s own vocabulary keys verbatim |
| Library zone with 4 themed bookshelf sections + 8 real, sourced books (`BookInteraction`/`BookCardPanel`) + Discovery Table (real "find a book about ___" `EXPLORATION` quests) | **Built** — see Section 6 |
| Mentor Hall zone + 5 real, sourced mentors (`MentorInteraction`/`MentorCardPanel`) + 4 "Try This" mini-quests, reached via a portal inside Library | **Built** — see Section 6. Sara Blakely's and Daymond John's `source_url` are still empty (facts well-documented, but no specific official page could be verified without outbound network access) |
| `QuestData.QuestKind.EXPLORATION` runner (`QuestManager._start_exploration_quest`/`notify_entry_discovered`) + `LibraryManager` autoload (BookData/MentorData registry) | **Built** — see Section 6 |
`MuseumManager` autoload + `ExhibitInteraction`/`ExhibitCardPanel` | **Built** — mirrors `LibraryManager`/`BookInteraction`/`BookCardPanel` exactly, plus a Failure Museum display mode and `cross_link_zone_id`/`followup_quest_id` fields on `ExhibitData` (Section 6b) |
| The Museum's 10 rooms (Before Money, First Coins, Strange Money, Money Through Time, Banknote Lab, Gold Vault, Money Around the World, Business & Invention, Museum of Mistakes, Future Money Lab) + 16 real, sourced exhibits + 5 quests (`museum-before-money-quest`, `museum-money-through-time-quest`, `museum-banknote-lab-quest`, `museum-new-coke-quest`, `museum-kodak-quest`) | **Built** — see Section 6b. `BrowseZoneController` itself was superseded by `BookInteraction`/`MentorInteraction`/`ExhibitInteraction`, built directly once real content existed |
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
    library/                  # 8 real BookData .tres + 5 real MentorData .tres
    museum/                   # 16 real ExhibitData .tres across 10 rooms
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
        sky_exchange/           # Money Quest's fourth zone (reached via Guardian Gate)
        coin_cove/              # Money Quest's fifth zone (reached via Sky Exchange)
        horizon_peaks/          # Money Quest's sixth zone (reached via Coin Cove)
        kindness_grove/         # Money Quest's seventh and final zone (reached via Horizon Peaks)
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
    approval first. Through Phase 19: Mind Lab, all 8 of Calm World's
    named gardens, fuller avatar presets (Section 9), audio
    buses/Settings screen/mobile Talk button (Section 15), and
    Guardian Gate/Workshop/Strategy Room (each track's third zone)
    built. Phases 20-39 then systematically completed **Money Quest in
    full**: all 7 real website zones built (Golden Vault, Market Town,
    Guardian Gate, Sky Exchange, Coin Cove, Horizon Peaks, Kindness
    Grove), and every one of the 10 real topics grown to its full
    3-age-band trilogy across those zones (saving, money_basics,
    long_term_thinking, giving, needs_wants, scams, currencies,
    digital_money, investing_basics, junior_isa) — **all 30 of Money
    Quest's real website curriculum lessons are now in the game**,
    each ported with the real title/objective/vocabulary/
    explanation/quiz/feedback/reward verbatim, each giver NPC either
    the real named child from that lesson's own story or (when the
    source has no named child) a consistent generic role name, and
    each `choice_point` designed per lesson to never risk contradicting
    its own fixed quiz answer (a downstream/sidestep decision when the
    quiz tests a specific action or classification; a direct mirror of
    the lesson's real decision when the quiz instead tests a separate
    conceptual fact). Sky Exchange, hosting 4 real topics at once, grew
    to 12 quest-giving NPCs — the largest single zone in the game — to
    carry this to completion. Two small, harmless real-name collisions
    occurred along the way (Theo, Priya, Omar each shared with an
    unrelated real character in a different zone/track) and are
    documented in Section 3 rather than silently avoided. Full
    phase-by-phase detail for Phases 20-39 lives in git history and
    prior session reports, not duplicated here. With Money Quest
    complete, attention shifted to Entrepreneur Quest. Phase 41 added
    Workshop's Supplier + "Rising Material Costs" quest, porting the
    real `materials-cost-increase` decision event (the sibling event to
    the Workshop Guide's `too-expensive-feedback`, both under the real
    "handle-a-customer-problem" BUILD stage) — the first "zone grows
    another resident" case in Entrepreneur Quest, proving the same
    pattern that carried Money Quest to completion applies here too.
    Phase 42 (this update) added a brand-new zone, Office (reached via
    a portal inside Workshop, Entrepreneur Quest's first 4-zone graph),
    since the real "make-a-business-decision" BUILD stage had no
    existing zone/NPC — the Office Guide's "Make a Business Decision"
    quest ports the real `more-orders-than-expected` decision event
    verbatim, reusing that BUILD stage's own `title`/`learnText`
    verbatim for the quest's `title_key`/`intro_text_key` (the
    established convention for the first quest built under a given
    stage). Phase 43 (this update) grew Office to its second
    quest-giving NPC, Teammate, whose "A Teammate's Idea" quest ports
    the real `teammate-wants-change` decision event verbatim — the
    sibling event to the Office Guide's `more-orders-than-expected`,
    both under the real "make-a-business-decision" stage — the same
    "zone grows another resident" pattern Workshop's Supplier already
    proved; since the stage's real title/learnText was already used by
    the Office Guide's quest, this quest's title/intro are original
    framing instead. Phase 44 (this update) built a fifth zone, Growth
    Lab (reached via a portal inside Office), for the real
    "grow-your-business" stage — the only other v1 stage with no Godot
    zone yet; the Growth Guide's "Grow Your Business" quest reuses that
    stage's real title/learnText verbatim (its first and, per the real
    site, only quest) and ports the real `fewer-sales-than-expected`
    decision event verbatim. Phase 45 (this update) built a sixth zone,
    Research Lab (reached via a portal inside Growth Lab), with 2
    residents from the start — the same shape Office used — covering
    the real website's two EARLIEST BUILD decisions, "Research Demand"
    and "Test the Idea" (order 3 and 4), which had no Godot zone/NPC
    yet. The Research Guide's "Research Demand" quest ports the real
    `market-detective-reflection` decision event verbatim; the real
    website version shows a market-data TABLE (the fixed "Fresh Trout"
    scenario: 300 interested customers, 75 recent buyers, 4
    competitors) before the reflection question, which Godot has no UI
    for, so the Research Guide instead speaks those same real numbers
    as `intro_dialogue` lines, in the real data's own order and values
    — a presentation-shape adaptation only, resolving the gap flagged
    in Phase 44. The Test Guide's "Test the Idea" quest ports the real
    `test-before-invest` decision event verbatim (a simple 2-choice
    decision, no table dependency). Both quests' titles/intros reuse
    their real stages' own title/learnText verbatim, each being that
    stage's only quest. **All 9 of Entrepreneur Quest's v1 decision
    events are now ported** (9 of 25 real decision events overall).
    Phase 46 (this update) started on the v2 set: Main Street, a
    seventh zone (reached via a portal inside Research Lab) and the
    first EQ zone not tied to one real BUILD stage, since the v2
    "Business Problems" library is reusable RUN-phase content rather
    than a stage. Its real shape is richer than every earlier CHALLENGE
    quest — investigate 3 clues, identify a likely cause (reflective,
    unrewarded), then choose a response (the real, rewarded decision) —
    which needed one small, principled architecture addition rather
    than a new mechanic category: `QuestData.diagnosis_choice` (a
    nullable `DialogueChoice`, shown between `intro_text_key` and
    `challenge_choice`, its cause options carrying `coin_delta = 0`/
    `xp_delta = 0` so `QuestManager._run_challenge_quest` pays no
    reward for it — only one new `if` branch in the runner, see Section
    4). The clues reuse `intro_dialogue` (no new UI at all). The Shop
    Manager's "Not Enough Customers" quest proves the pattern, porting
    the real `not-enough-customers` Business Problem verbatim,
    including the real site's own shared UI strings ("What's the
    likely cause?", "Real businesses run into problems...") reused
    verbatim and now available for every future Business Problem
    quest. Phase 47 (this update) grew Main Street to its second
    quest-giving NPC, the Accountant, whose "Costs Increased" quest
    ports the real `costs-increased` Business Problem verbatim via the
    same investigate/diagnose/respond shape — the same "zone grows
    another resident" pattern every other EQ zone has used, now proven
    for `diagnosis_choice` too. Phase 48 (this update) grew Main Street
    to its third quest-giving NPC, the Support Rep, whose "A Negative
    Review" quest ports the real `negative-review` Business Problem
    verbatim via the same shape. Phase 49 (this update) completed the
    rest of the v2 Business Problems library in one pass: four more
    Main Street residents — Sales Tracker ("Sales Are Falling"), Profit
    Analyst ("Why Aren't We Making Money?"), Cash Flow Advisor ("Profit
    But No Cash"), and Warehouse Keeper ("Too Much Unsold Stock") — each
    porting its real Business Problem verbatim via the exact same
    investigate/diagnose/respond shape, no further changes to
    `QuestData`/`QuestManager` needed. **All 7 of the v2 Business
    Problems library are now ported**; Main Street has grown to 7
    quest-giving NPCs, Entrepreneur Quest's largest single zone. 9 real
    decision events remain, all in content not yet reachable from any
    Godot zone: the RUN set (4), the AI Lab (`ai-wrong-answer`), and the
    Rescue & Grow set (4) — plus all 18 BUILD stages' own non-decision
    mechanics (logo builder, category pickers, numeric entry, etc.) and
    the 5 standalone Challenges, none of which have any Godot
    implementation yet.
    Phase 50 (this update) ported both of Leadership Quest's remaining
    mission-choice-shaped missions. A brand-new fourth zone, Huddle
    Room (reached via a portal inside Strategy Room), introduces Oren —
    the 4th and last of Leadership Quest's 4 real characters, completing
    the real cast — giving "Everyone Has an Idea" (ports
    `everyone-has-an-idea-choice` verbatim). "The Missing Task" (ports
    `missing-task-choice` verbatim, including 3 narrator-style
    `intro_dialogue` lines standing in for the real site's tap-to-reveal
    investigate clues — the same adaptation Entrepreneur Quest's
    Business Problems already used) is given by Theo as a SECOND quest
    in Team Challenge, since Leadership Quest's 4-character cast was
    already fully placed across zones by this point; `TeamChallenge.gd`
    now offers Theo's next incomplete quest in a fixed order instead of
    inventing a new character for a mission that doesn't introduce one.
    5 of Leadership Quest's 12 real missions are now ported (Big
    Mistake, Angry Customer, Better Idea, Everyone Has an Idea, The
    Missing Task) — **every mission-choice-shaped mission is now
    ported.** The remaining 7 (`meet-your-team`/`first-challenge`: 2
    `match`; `team-conflict`/`motivation-problem`: 2 `spot`;
    `the-deadline`: 1 `allocate`; `pressure-test`: 1 `sort`;
    `final-challenge`: 1 multi-step combining match + 2 choices) need
    mechanics (`QuestData.gd`'s `EXPLORATION`/`SIMULATION` kinds are
    declared but have no runner — `QuestManager.gd` just warns and
    finishes immediately) that don't exist in Godot yet and would need
    designing before those missions can be ported.
    Phase 51 (this update) designed and built exactly those missing
    mechanics, then used them to port all 7 remaining missions in one
    pass. Four new `QuestKind` values (`MATCH`, `SPOT`, `ALLOCATE`,
    `SORT`) plus a 5th combinator (`MULTI_STEP`, for the one mission —
    Final Challenge — that needs a mini-game followed by two separate
    decisions) were added alongside 5 new core Resource classes
    (`MatchPairData`, `SpotItemData`, `AllocateCategoryData`,
    `SortBucketData`, `SortItemData`) and 4 new autoloaded `CanvasLayer`
    panels (`MatchPanel`, `SpotPanel`, `AllocatePanel`, `SortPanel`),
    each built by reading the real website's own mechanic component
    (`src/game-engine/mechanics/{Match,Spot,Allocate,Sort}Mechanic.tsx`)
    first and porting its exact interaction model rather than inventing
    a new one: tap-tap matching with a shuffled right column (never
    drag), toggle-select-then-submit with an exact-set check, a
    fixed-step +/- stepper with a remaining-amount readout, and
    tap-select-then-tap-bucket sorting (also never drag) — every one
    retry-until-correct, matching the real site's own "always
    eventually succeeds" design. `QuestManager._run_challenge_quest` was
    refactored (behavior-preserving) into 3 shared helpers (`_show_intro`,
    `_run_one_choice`, `_pay_flat_reward`) that the 5 new runners reuse,
    so no quest kind duplicates another's intro/reward-paying logic.
    With the mechanics built, all 7 remaining missions were ported
    verbatim with **no new zones**: each of Leadership Quest's 4
    characters simply grew a longer fixed quest queue, the same pattern
    Theo's 2-quest queue in Phase 50 already proved. Priya now gives 4
    quests (Meet Your Team → First Challenge → Big Mistake → Pressure
    Test), Theo now gives 4 (Angry Customer → The Missing Task → The
    Team Conflict → The Deadline), Nadia now gives 2 (Better Idea → The
    Final Challenge), and Oren now gives 2 (Everyone Has an Idea → The
    Motivation Problem). The Final Challenge's first decision point uses
    the real site's own `"none"`-tag fallback situation text verbatim,
    since Godot has no equivalent of the website's Leadership Profile
    archetype tracking that would otherwise personalize it — a
    documented, honest simplification rather than fabricated content.
    **All 12 of Leadership Quest's real missions are now ported.**
    Phase 52 (this update) returned to Entrepreneur Quest and ported
    all 10 of its remaining real decision events — the v2 RUN set (4),
    the AI Business Lab's one decision event, and the Rescue & Grow set
    (5) — via 3 new zones, with no new quest kinds needed: every one of
    these decisions is a single CHALLENGE, simpler than the Business
    Problems' investigate/diagnose/respond shape. Supply Yard (reached
    via a second portal inside Main Street) hosts the Pricing Tester
    ("The Pricing Experiment," `pricing-experiment-reflection`), the
    Supplier Scout ("Choose a Supplier," `choose-a-supplier`), the Stock
    Keeper ("Managing Your Stock," `stock-management-scenario`), and the
    Bookkeeper ("Cash Flow," `cash-flow-decision`) — the real website's
    price/units-sold table and supplier comparison table are both spoken
    as `intro_dialogue` lines using their real values, the same
    adaptation Research Lab's Fresh Trout data already proved, since
    Godot still has no table UI. AI Workshop (reached via a portal
    inside Supply Yard) hosts the Tech Advisor's "AI Can Be Wrong"
    (`ai-wrong-answer`), keeping the real site's own "Simulated AI
    Assistant (not real AI)" framing intact. Turning Point (reached via
    a portal inside AI Workshop) hosts the Business Advisor's "Business
    Pivot" (`business-pivot` — its real `{businessName}` placeholder
    spoken generically as "your business," since Godot's CHALLENGE
    quests have no persisted company identity), the Growth Coach's "Grow
    or Stay Small" (`grow-or-stay-small`), and 3 more NPCs each porting
    one of the real Business Ethics scenarios verbatim: the Ad
    Reviewer's "The Misleading Ad" (`misleading-ad`), the Quality
    Inspector's "Hiding a Problem" (`hiding-a-problem`), and the Sourcing
    Advisor's "The Questionable Supplier" (`cheap-questionable-supplier`).
    **All 26 of Entrepreneur Quest's real decision events are now
    ported.** What remains in Entrepreneur Quest is no longer decision
    events at all: the 18 BUILD stages' own non-decision mechanics (logo
    builder, category pickers, numeric entry), the 5 standalone
    Challenges, the RUN/Rescue & Grow hub pages, and the separate
    Business Rescue scenario (which reuses 3 Business Problems against
    its own fixed company and local-stats model) — each a UI shape the
    mission/zone/NPC architecture doesn't fit, not a content gap.
    Phase 53 (this update) built exactly the first of those UI shapes:
    the real website's own BUILD stepper
    (`src/app/[locale]/entrepreneur-quest/build/page.tsx`), all 18 real
    stages in order, as the first Entrepreneur Quest feature with its
    own persistent, multi-step state rather than one self-contained
    CHALLENGE quest. A new `BusinessProfileData` Resource (held by a new
    `BusinessBuilder` autoload, persisted through `SaveManager` in the
    same one `user://progress.json` file as everything else) tracks the
    one business a child builds across every session; the Idea Lab's
    new Startup Mentor NPC launches or resumes it at the next
    incomplete stage. 7 of the 18 stages (`research-demand`,
    `test-the-idea`, `create-your-marketing`, `handle-competition`,
    `handle-a-customer-problem` ×2, `make-a-business-decision` ×2,
    `grow-your-business`) are exactly the real decision events already
    ported as CHALLENGE quests elsewhere in Entrepreneur Quest, so
    `BusinessBuilder._run_stage()` just calls `QuestManager.start_quest()`
    for those rather than duplicating content, skipping a stage
    entirely if its quest was already completed via its own zone NPC.
    The other 11 needed a UI shape the quest system never had, so 6 new
    autoloaded `CanvasLayer` panels were built, each ported from the
    real website's own stage component: `TextInputPanel` (find a
    problem, create an idea, name your business, the final pitch's 2
    questions — a single/multi-line field with an optional safety
    hint, reused generically since every one of these `reflect-text`
    stages is the same shape); `LogoBuilderPanel` (shape/color/symbol
    pickers over a live preview drawn by a new `LogoPreviewDraw` custom-
    `_draw()` Control — circle/square/hexagon/star, filled with this
    project's own real design-token hex colors, never an image file);
    `CategoryPickerPanel` (a generic category grid, reused for product,
    customer, and marketing-approach selection); `NumericInputPanel`
    (understand costs, set your price — a +/- stepper, the same
    no-typed-number convention `AllocatePanel` already established
    rather than requiring an on-screen keyboard for a number);
    `SimulatorPanel` (the Business Simulator — allocate a fixed starting
    amount across materials/packaging/advertising/saved-aside, then see
    the result of the real site's own exact `runSimulator()` formula,
    ported verbatim from `src/lib/entrepreneur-quest/state.ts`); and
    `PitchDisplayPanel` (the final read-only summary, reusing
    `LogoPreviewDraw`, shown once every stage is done). All business-
    economy numbers (starting money, cost per unit, price, profit) are
    plain major-unit integers, the same no-currency-formatting
    convention this project's virtual economy has used since Phase 52's
    Pricing Experiment/Cash Flow quests. `PitchDisplayPanel` deliberately
    omits the real site's running `reputationOutOf5` line — Godot's
    CHALLENGE quests pay a flat xp/coin reward rather than accumulating
    that running stat across every decision the way the website's
    `BusinessProfile` does, so showing a fabricated number there would
    be inventing content rather than porting it, an honest gap rather
    than a silent one. **This completes Entrepreneur Quest's full real
    BUILD → RUN → RESCUE & GROW track end to end** — the only remaining
    Entrepreneur Quest content is the 5 standalone Business Challenges,
    the RUN/Rescue & Grow hub pages, and the separate Business Rescue
    scenario, none of which add new decision content of their own.
    Still waiting on you: a real book/exhibit/mentor for Library/Museum
    (Section 6).
    Phase 54-55 (this update) turned the Library from an honestly-empty
    walkable zone into a real one, using exactly the real books and
    mentors supplied with their own official sources, and built a new
    Mentor Hall. Phase 54 extended `EntryData` with a sourcing block
    (`source_name`/`source_type`/`verification_date`, shown behind an
    optional toggle, never upfront) and `BookData` with
    `discover_point_keys`/`cross_link_zone_id`; added a new
    `QuestData.QuestKind.EXPLORATION` runner designed specifically for
    "go discover something in the world" prompts — unlike every other
    kind, it never holds `QuestManager._active`, since a child offered
    "find a book about saving" should stay free to keep exploring, not
    have the rest of the game treat one dialogue prompt as a blocking
    modal flow; a new `LibraryManager` autoload loads every real
    `BookData`/`MentorData` into a registry, the same data-driven
    pattern `QuestManager`/`WorldManager` already use. 8 real books
    (from "A Kids Book About Money" to "Little Daymond Learns to Earn")
    were added to `data/library/`, each with its real author/publisher/
    official source URL and 3-5 short, original "what you'll discover"
    bullets — never copied book text. The Library zone was rebuilt with
    4 themed bookshelf sections hosting a new `BookInteraction`
    (`Interaction` subclass, `BookCardPanel` for its card UI with a Read
    More button that opens the real source via `OS.shell_open()`), a
    reading nook, a Discovery Table, and an honest "more sections coming
    soon" sign naming the still-unbuilt Leadership & Smart Skills and
    Mind Lab sections. The Librarian now offers 3 real discovery prompts
    ("find a book about saving," etc.) instead of its old "still
    preparing" line.
    Phase 55 extended `MentorData` with `skill_ids`/`cross_link_zone_id`/
    `try_quest_id`, built a new Mentor Hall zone (reached via a portal
    inside Library) with a new `MentorInteraction`/`MentorCardPanel`
    pair mirroring Phase 54's book UI, and added 5 real, verifiable
    mentors to `data/mentors/`: Katherine Johnson, Ada Lovelace, George
    Washington Carver, Sara Blakely, and Daymond John. Every biography is
    an original child-friendly paraphrase, never an invented quote, and
    every "Try This" mini-quest (4 of the 5 mentors have one, reusing
    the existing `CHALLENGE`/`SORT` quest kinds verbatim — no new
    mechanic) is framed as "try a challenge inspired by this skill,"
    never as the real person addressing the child directly. Two mentors
    (Sara Blakely, Daymond John) still have `source_url = ""`: this
    project's sandboxed environment had no outbound network access to
    independently verify one specific official source page for either
    (confirmed by testing several official domains, all blocked by the
    environment's egress proxy), so none was guessed — an honestly
    incomplete source, not an invented one. `BrowseZoneController`, the
    generic placement controller planned back in Section 6, was never
    built in the end; once real content existed, a direct
    `BookInteraction`/`MentorInteraction` pair turned out simpler than a
    generic placer would have been.
    Still waiting on you: a real Museum exhibit (Section 6), and an
    official source URL for the Sara Blakely and Daymond John mentor
    entries.

    Phases 56-59 (this update) built the Museum as a full 10-room
    destination, closing the one real gap the previous update flagged.
    Phase 56 built the architecture: a `MuseumManager` autoload (an exact
    mirror of `LibraryManager`), a new `ExhibitInteraction`
    (mirroring `BookInteraction`), a new `ExhibitCardPanel` with two
    display modes (an ordinary exhibit's title/summary/detail-toggle, or
    a Failure Museum exhibit's four-part What Happened/What Went
    Wrong/What Could Have Been Different/What We Learn structure), and
    two small additive `ExhibitData` fields (`cross_link_zone_id`,
    `followup_quest_id`) mirroring fields `BookData`/`MentorData`
    already had — no new systems. Phase 57 built the first 4 rooms
    (Before Money, First Coins, Strange Money, Money Through Time),
    reusing the existing `CHALLENGE` and new `SORT` quest kinds for a
    barter scenario and a chronological-order mini-game. Phase 58 built
    rooms 5-7 (Banknote Lab, Gold Vault, Money Around the World),
    introducing the Banknote Lab's "spot the real security feature"
    game by reusing `SpotItemData.is_suspicious` to mean "is this
    genuine," an honest reuse of the existing mechanic's shape rather
    than a new one, and cross-linking the Gold Vault's gold-bar exhibit
    to Money Quest's existing Golden Vault zone. Phase 59 built the
    final 3 rooms (Business & Invention, Museum of Mistakes, Future
    Money Lab): Business & Invention's `post-it-note` exhibit sits next
    to an 8-sign problem-to-improvement walkway cross-linked to Idea
    Lab; the Museum of Mistakes uses the Failure Museum structure for 2
    real, widely documented cases (New Coke, the Kodak digital camera),
    each with a `CHALLENGE` follow-up quest whose 3 choices all state
    the identical real historical outcome, satisfying the brief's
    requirement that the real outcome is shown regardless of which
    option a child picks, rather than letting a choice rewrite history;
    Future Money Lab closes the chain with 3 plain reflective dialogue
    questions (no choice, no reward) and 2 exploration exhibits, one of
    which explicitly states the game recommends neither buying,
    investing in, nor using cryptocurrency, keeping the brief's "no
    financial advice" rule intact. See Section 6b for the full room-by-
    room account. `data/museum/` now holds 16 real `ExhibitData` entries
    across all 10 rooms; every fact either carries one of your supplied
    real sources (British Museum, American Numismatic Association,
    Royal Mint, Bank of England Museum) or is honestly marked as
    widely documented with an empty `source_url` where this
    environment's still-blocked outbound network access prevented
    independently verifying one specific official page (M-Pesa, the
    Post-it Note, New Coke, Kodak, and the two digital-money/identity
    exhibits) — no fact, date, quote, or source was invented.

    **With the Museum built, every one of the World Hub's 7 portals now
    leads to real, populated content** — Money Quest, Entrepreneur
    Quest, Leadership Quest, the Library (with Mentor Hall), the
    Museum, Mind Lab, and Calm World. Still waiting on you: an official
    source URL for the Sara Blakely and Daymond John mentor entries
    (Section 6) — the only remaining honestly-empty source in the
    entire Library/Museum/Mentor Hall content set.
