# Money Quest World — Godot foundation

A **standalone Godot 4.2+ project**. It is never imported into the Next.js
website build and has no network code, no database, no authentication —
see `docs/money-quest-world-architecture.md` (at the repo root) for the
full audit, architecture rationale, and 14-stage build order this project
implements.

Money Quest World is **not** "the 30 curriculum lessons converted into a
Godot game." It is the interactive 3D world of the whole Money Quest
ecosystem: a Hub plaza connecting three Quest tracks (Money Quest /
Entrepreneur Quest / Leadership Quest) plus four supporting destinations
(Library, Museum, Mind Lab, Calm World). This phase builds that foundation
and makes it real with playable slices of all three Quest tracks and Calm
World — the Hub itself, Money Quest's Golden Vault zone (Maya's "Saving
for Something Bigger" quest), Entrepreneur Quest's Idea Lab zone ("Handle
Competition"), Leadership Quest's Leadership Academy zone ("The Big
Mistake"), and Calm World's first garden (Bubble Garden) — on architecture
meant to support everything else in
`docs/money-quest-world-architecture.md` Section 10's table without being
rebuilt.

## How to open and run

1. Install Godot **4.2 or later** (this project was written against 4.2's
   feature set; it was not opened/run in the editor as part of producing
   this work, so treat the first open as a verification step, not an
   assumption of correctness).
2. Open Godot, "Import," and select
   `godot/money-quest-game/project.godot`.
3. On first open, Godot will import `localization/translations.csv` as a
   CSV translation source automatically. If it doesn't, select the file in
   the FileSystem dock and re-import it (Import tab → CSV Translation).
4. Press F5 (or the Play button). The game boots into `MainMenu.tscn`.

## Playing the vertical slice

1. Tap/click "Start." On a first launch you'll go through
   `AvatarCreation.tscn` (pick a look, a color, and an optional accessory —
   all cosmetic, nothing is gated behind these choices); a returning
   session skips straight to the Hub.
2. You arrive in the **World Hub** — a plaza with a central fountain, 7
   ground paths radiating out to 7 gate-shaped portals, a few decorative
   trees, and a **Hub Guide** NPC near spawn who gives a two-line welcome
   the first time (or any time) you talk to them. Walk up to a portal and
   interact with it:
   - **Money Quest** (gold) takes you to the **Golden Vault** zone.
   - **Entrepreneur Quest** (ember) takes you to the **Idea Lab** zone.
   - **Leadership Quest** (sky) takes you to the **Leadership Academy** zone.
   - **Calm World** (soft green) takes you to the **Bubble Garden** — a
     quiet space with nothing to tap, get right, or get wrong.
   - The other 3 (Library, Museum, Mind Lab) show a short "still being
     built" line — the portal, zone registration, and locking logic all
     already work for them; only their actual zone content doesn't exist
     yet.
3. In Golden Vault, walk up to Maya and interact with her to start her
   quest. The savings mini-game runs for 3 weeks: each week, choose to save
   the full allowance toward the sketchbook or spend a little on a treat.
   Your choices genuinely determine whether the goal is reached. The real
   explanation and quiz (from the actual website curriculum content) play
   afterward, then the reward screen, which explicitly labels earned coins
   as **virtual** (never implying real money). A second portal inside
   Golden Vault leads to **Market Town**, Money Quest's second zone — walk
   up to the Baker to start "Need It or Want It?": a bakery has only
   enough allowance for bread or a chocolate bar today, and you choose
   which, with the real curriculum's quiz and explanation afterward.
4. In Idea Lab, walk up to the Business Guide and interact with them to
   start "Handle Competition" — a single decision ported directly from the
   website's real Entrepreneur Quest content: a competitor undercuts your
   price, and you choose how to respond. There's no single correct
   answer — each option has its own natural-language consequence. A second
   portal inside Idea Lab leads to **Marketing Studio**, Entrepreneur
   Quest's second zone — talk to the Marketing Guide to start "Create Your
   Marketing": some customers like your product but don't understand what
   it does, and you choose how to explain it.
5. In Leadership Academy, walk up to Priya and interact with her to start
   "The Big Mistake" — ported directly from the website's real Leadership
   Quest content: Priya made a mistake and the team is watching to see how
   you, as the leader, respond. Again, no single correct answer.
6. In Bubble Garden, there's nothing to do but walk around and watch the
   bubbles drift — no quest, no NPC, no choice. It's always reachable, with
   no unlock condition, and never framed as anything other than a calm
   place to visit.
7. Walk to the portal in each zone to return to the Hub. Progress
   (completed quests, unlocked zones, skill tags, avatar choices) is saved
   to `user://progress.json` automatically.

### Controls

Three input paths all drive the same movement — no platform is a second-
class citizen:

- **Touch / mouse**: tap or click a point on the ground to walk there, tap
  an interactable to focus it, then use the bound `interact` action (or
  call `Player.request_interact()` from a future on-screen "Talk" button).
- **Keyboard**: WASD / arrow keys to move, `E` or Space to interact.
- **Gamepad**: left stick to move, face button 0 (e.g. Xbox A / PlayStation
  ✕) to interact.

Hold the right mouse button and move the mouse to rotate the desktop
camera; touch and gamepad players never need this.

## What this demonstrates (and what it deliberately doesn't yet)

See `docs/money-quest-world-architecture.md` Section 10 for the complete,
up-to-date table. In short:

| Built this phase | Not built yet (architecture-ready) |
|---|---|
| `WorldManager` + generalized `ZoneData` (`HUB`/`QUEST`/`LIBRARY`/`MUSEUM`/`MIND_LAB`/`CALM` kinds) | Library books / Museum exhibits / Mentors (zero real entries — nothing to invent yet) |
| `QuestData` + `QuestManager`, `LESSON` and `CHALLENGE` kinds (wraps existing `LessonData`, or runs a standalone situation+choice+consequence with optional multi-line intro dialogue, no content duplicated) | `BrowseZoneController` + a walkable Library/Museum zone (no real content to drive one yet) |
| 3D `Player`/`NPC`/`Interaction`/`InteractionManager` + `CameraController` | Mind Lab |
| World Hub: fountain landmark, 7 paths, 7 gate-shaped portals (4 functional, 3 "coming soon"), decorative trees, Hub Guide NPC | Entrepreneur Quest's full BUILD → RUN → RESCUE & GROW track (only one representative quest is built) |
| Golden Vault zone + Maya's quest (reuses the existing `LessonData`/`LessonManager`/mini-game/UI overlays unchanged) | Leadership Quest's remaining 11 missions (only one representative quest is built) |
| Market Town zone + Baker's quest (`explorer-needs_wants-l1`, reached via a portal inside Golden Vault — Money Quest's first 2-zone graph, no mini-game needed) | Money Quest's remaining 28 lessons |
| Idea Lab zone + "Handle Competition" quest (ports the website's real `competitor-lower-price` decision event) | Fuller avatar presets beyond color/preset/accessory |
| Marketing Studio zone + "Create Your Marketing" quest (ports the real `product-unclear` decision event, reached via a portal inside Idea Lab) | Entrepreneur Quest's `reflect-text`-kind stages (need a free-text input UI not built yet) |
| Leadership Academy zone + "The Big Mistake" quest (ports the website's real `big-mistake-choice` decision event, with Priya as a real-character NPC) | AI Quest Coach (explicitly not built — see the architecture doc's non-negotiables) |
| `EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData` schema, with 2 real Dictionary entries (`goal`, `trade-off`) reusing existing curriculum vocabulary | Calm World's remaining 7 named gardens |
| Calm World's first garden (Bubble Garden) — always unlocked, no choices, motion respects `reduced_motion` | — |
| `AvatarConfig` + minimal `AvatarCreation.tscn` | — |
| Zone/quest/skill/avatar progression fields in `ProgressManager`, persisted by `SaveManager` | — |

## Content fidelity

Every piece of curriculum text in Maya's quest — the story, the vocabulary
(`goal`, `trade-off`), the quiz question/options/explanation, the feedback
lines, the reward message — is copied directly from the real
`messages/en.json` (`curriculum.builder-saving-l1`) and `messages/ro.json`
in the website repo, not invented for this project.

The Baker's quest in Market Town is the same: every curriculum field
(story, vocabulary `need`/`want`, quiz, feedback, reward) is copied from
the real `curriculum.explorer-needs_wants-l1`. The only original text is
the Baker's own one-line transition ("I've got fresh bread and a giant
chocolate bar right here...") and the choice/consequence wording applying
that lesson's real need-vs-want distinction to a concrete decision —
exactly the brief's own "find the correct game mechanic for the concept"
instruction, not a rewrite of the lesson's meaning.

Idea Lab's "Handle Competition" quest is likewise copied directly from the
real `messages/en.json`/`messages/ro.json` (`entrepreneurQuest.decisionEvents
.competitor-lower-price` and its `build.handle-competition` title/intro) —
the situation, all 3 choices, and all 3 consequences are the website's own
words, not invented for this project.

Marketing Studio's "Create Your Marketing" quest is the same: the
situation, all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.product-unclear` and
`build.create-your-marketing`'s title/learnText.

Leadership Academy's "The Big Mistake" quest is likewise copied directly
from the real `messages/en.json`/`messages/ro.json`
(`leadershipQuest.missions.big-mistake`, including its `priya`/`oren`
intro dialogue and all 4 choices/consequences for the `big-mistake-choice`
event) — Priya and Oren are two of Leadership Quest's 4 real, already-named
characters (`src/content/leadership-quest/structures.ts`), not invented
for this project.

The Dictionary's 2 entries (`goal`, `trade-off`) aren't new content at
all — they point at `builder-saving-l1`'s own existing vocabulary
translation keys verbatim (see `data/schemas/ENTRY_DATA_FORMAT.md`'s rule
on this). Library and Museum have zero entries: no book, author,
historical story, or mentor biography is invented for this project, so
both stay empty until something real and verifiable is approved. Bubble
Garden needs no real-world fact to be honest — a bubble is just a bubble —
which is why it could be built now while Library/Museum/Mind Lab couldn't.

The only new content anywhere in this project is UI chrome (menu/Hub/
portal/avatar-creation/zone-guide labels), the savings mini-game's own
week-prompt text (always original to that lesson's design), and the
"Business Guide" NPC's name — a generic role, not a named person, since
Entrepreneur Quest's real content has no fixed mentor character the way
Money Quest's curriculum already has Maya and Leadership Quest already has
its 4 named characters.

## Project structure

See `docs/money-quest-world-architecture.md` Section 11 for the full
rationale. Quick map:

- `autoload/` — global singletons: `Localization`, `Settings`, `GameState`,
  `ProgressManager`, `SaveManager`, `AudioManager`, `WorldManager`,
  `QuestManager`. `DialogueBox`/`ChoicePanel`/`RewardPopup` are also
  autoloads (scene-based) — see `project.godot`'s own comment on why.
- `scripts/core/` — the reusable lesson data model (`LessonData`,
  `DialogueLine`, `DialogueChoice`, `ChoiceOption`, `ConsequenceEffect`,
  `VocabTerm`), `LessonManager`, `Interaction`, `InteractionManager`,
  `MiniGameBase`, `VirtualMoney`.
- `scripts/world/` — `ZoneData`, `PortalInteraction`.
- `scripts/quests/` — `QuestData`.
- `scripts/player/` — `Player` (3D), `CameraController`, `AvatarConfig`.
- `scripts/characters/` — `NPC` (3D).
- `scripts/minigames/` — concrete mini-games extending `MiniGameBase`
  (currently one: `SavingsAllocationMiniGame`).
- `scripts/library/` — `EntryData`/`BookData`/`ExhibitData`/`MentorData`/
  `DictionaryTermData` (Library/Museum/Dictionary schema).
- `scenes/world/hub/WorldHub.tscn` — the Hub plaza.
- `scenes/world/zones/golden_vault/GoldenVault.tscn` — Money Quest's first
  zone.
- `scenes/world/zones/market_town/MarketTown.tscn` — Money Quest's second
  zone, reached via a portal inside Golden Vault.
- `scenes/world/zones/idea_lab/IdeaLab.tscn` — Entrepreneur Quest's first
  zone.
- `scenes/world/zones/marketing_studio/MarketingStudio.tscn` —
  Entrepreneur Quest's second zone, reached via a portal inside Idea Lab.
- `scenes/world/zones/leadership_academy/LeadershipAcademy.tscn` — this
  phase's one real Leadership Quest zone.
- `scenes/world/zones/calm_world/BubbleGarden.tscn` — Calm World's first
  garden.
- `scenes/world/Main.tscn` — the persistent root: a `ZoneContainer`
  `WorldManager` swaps zone scenes into, plus the always-present `HUD`.
- `scenes/player/` — `Player.tscn`, `CameraController.tscn`,
  `AvatarCreation.tscn`.
- `scenes/characters/NPC.tscn`.
- `scenes/quests/builder_saving_l1/` — Maya's quest's mini-game stage.
- `scenes/ui/` — `DialogueBox`, `ChoicePanel`, `RewardPopup`, `HUD`.
- `scenes/menus/MainMenu.tscn`.
- `data/zones/`, `data/quests/`, `data/lessons/` — content `.tres` files.
- `data/dictionary/` — 2 real `DictionaryTermData` entries.
- `data/library/`, `data/museum/`, `data/avatars/` — reserved, empty.
- `data/schemas/` — `LESSON_DATA_FORMAT.md`, `QUEST_DATA_FORMAT.md`,
  `ZONE_DATA_FORMAT.md`, `ENTRY_DATA_FORMAT.md`: how to add new content
  without touching core scripts.
- `localization/translations.csv` — all UI/dialogue/quiz text, 9 locale
  columns (`en`/`ro` populated; `es/fr/de/it/pt/nl/pl` columns exist but
  are empty — flagged, not silently faked).

## Known limitations (stated plainly)

- Hand-authored `.tscn`/`.tres` files were not opened in the Godot editor
  as part of this work (no Godot editor was available in this
  environment). They follow Godot 4's documented text-format conventions,
  but the first real open in the editor is the actual verification step —
  treat it as such, not as already-proven.
- No art or audio assets are included — visuals are flat-color primitive
  meshes (capsules, boxes), matching the brief's own instruction not to
  invent visual direction decisions beyond what's needed to demonstrate
  the architecture.
- Only 2 of 30 curriculum lessons are wired up as Quests, only 1 of
  Entrepreneur Quest's many real BUILD/RUN/RESCUE & GROW stages is ported,
  and only 1 of Leadership Quest's 12 real missions is ported. See
  `docs/money-quest-world-architecture.md` Section 12 for the development
  order for the rest, the 17 games, and the 4 simulator scenarios.
- Library, Museum, and Mind Lab are all reachable from the Hub (their
  portals exist and correctly report "coming soon") but have no zone
  content yet — by design, per the brief's explicit "do not build all of
  this content at once." Library and Museum specifically have real, built
  schema (`EntryData`/`BookData`/`ExhibitData`/`MentorData`) but zero real
  entries, since no book, historical story, or mentor biography may be
  invented — see `data/schemas/ENTRY_DATA_FORMAT.md`. Calm World's portal
  is now functional, but only 1 of its 8 named gardens (Bubble Garden) is
  built — the other 7 are each a future content-only addition.
