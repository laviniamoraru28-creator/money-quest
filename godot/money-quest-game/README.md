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
   `AvatarCreation.tscn` (pick a look — including a seated, wheelchair-
   style look — a color, and an optional accessory — glasses, a cap, a
   hearing aid, or a cane, all listed together as equally normal choices;
   all cosmetic, nothing is gated behind these choices, and none of them
   change movement speed or collision); a returning session skips
   straight to the Hub. These choices now actually show up on your 3D
   explorer in every zone — see "Avatar wiring fix" below.
2. You arrive in the **World Hub** — a plaza with a central fountain, 7
   ground paths radiating out to 7 gate-shaped portals, a few decorative
   trees, and a **Hub Guide** NPC near spawn who gives a two-line welcome
   the first time (or any time) you talk to them. Walk up to a portal and
   interact with it:
   - **Money Quest** (gold) takes you to the **Golden Vault** zone.
   - **Entrepreneur Quest** (ember) takes you to the **Idea Lab** zone.
   - **Leadership Quest** (sky) takes you to the **Leadership Academy** zone.
   - **Calm World** (soft green) takes you to the **Bubble Garden** — a
     quiet space with nothing to tap, get right, or get wrong. Seven more
     portals inside Bubble Garden lead to Calm World's other named
     gardens: Aquarium Room, Light Room, Rain Room, Underwater Room,
     Forest Walk, Music Room, and Grow-a-Garden — all 8 gardens are
     always unlocked.
   - **Library** (soft blue) takes you to a real Library zone — bookshelves
     and a Librarian who plainly says the shelves are still being prepared
     (see "Content fidelity" below for why there are no books yet).
   - **Mind Lab** (teal) takes you to a real Mind Lab zone — talk to the
     Mind Lab Guide to try "Different Explanations": a friend doesn't wave
     back, and you practice considering a few different reasons why,
     instead of assuming the worst. No "correct" answer.
   - **Museum** is the only one left showing a short "still being built"
     line — the portal, zone registration, and locking logic all already
     work for it; only its actual zone content doesn't exist yet.
3. In Golden Vault, walk up to Maya and interact with her to start her
   quest. The savings mini-game runs for 3 weeks: each week, choose to save
   the full allowance toward the sketchbook or spend a little on a treat.
   Your choices genuinely determine whether the goal is reached. The real
   explanation and quiz (from the actual website curriculum content) play
   afterward, then the reward screen, which explicitly labels earned coins
   as **virtual** (never implying real money). Golden Vault also has a
   second resident NPC, the Savings Guide — talk to them to start "What
   Does Saving Mean?": you get one coin today, and you choose to spend it
   right away or save it in your jar, with the real curriculum's quiz and
   explanation afterward. A third resident, Theo, completes the "saving"
   topic's full trilogy with "Saving vs. Spending: The Real Trade-off":
   you choose whether to spend his money today or let it slowly grow with
   interest over time, again with the real curriculum's quiz and
   explanation afterward. A second portal inside Golden Vault leads to
   **Market Town**, Money Quest's second zone — walk
   up to the Baker to start "Need It or Want It?": a bakery has only
   enough allowance for bread or a chocolate bar today, and you choose
   which, with the real curriculum's quiz and explanation afterward. A
   second portal inside Market Town leads to **Guardian Gate**, Money
   Quest's third zone — talk to Zara to start "Spotting a Scam": a
   message demands you act immediately, and you choose whether to enter a
   password right away or pause and check with a trusted adult, with the
   real curriculum's quiz and explanation on spotting scam warning signs
   afterward.
4. In Idea Lab, walk up to the Business Guide and interact with them to
   start "Handle Competition" — a single decision ported directly from the
   website's real Entrepreneur Quest content: a competitor undercuts your
   price, and you choose how to respond. There's no single correct
   answer — each option has its own natural-language consequence. A second
   portal inside Idea Lab leads to **Marketing Studio**, Entrepreneur
   Quest's second zone — talk to the Marketing Guide to start "Create Your
   Marketing": some customers like your product but don't understand what
   it does, and you choose how to explain it. A second portal inside
   Marketing Studio leads to **Workshop**, Entrepreneur Quest's third
   zone — talk to the Workshop Guide to start "Handle a Customer
   Problem": a customer tells you your product is too expensive, and you
   choose how to respond.
5. In Leadership Academy, walk up to Priya and interact with her to start
   "The Big Mistake" — ported directly from the website's real Leadership
   Quest content: Priya made a mistake and the team is watching to see how
   you, as the leader, respond. Again, no single correct answer. A second
   portal inside Leadership Academy leads to **Team Challenge**,
   Leadership Quest's second zone — talk to Theo to start "The Angry
   Customer": a customer is upset about your team's work, and you choose
   how to respond (one option even lets Priya, from the first zone, handle
   the call). A second portal inside Team Challenge leads to **Strategy
   Room**, Leadership Quest's third zone — talk to Nadia to start "The
   Better Idea": Nadia suggests a genuinely better way to do something
   you'd already planned, and you choose how to respond.
6. In Bubble Garden, there's nothing to do but walk around and watch the
   bubbles drift — no quest, no NPC, no choice. It's always reachable, with
   no unlock condition, and never framed as anything other than a calm
   place to visit. The same is true of all 7 other gardens reachable from
   inside it: fish circling in Aquarium Room, breathing lanterns in Light
   Room, falling raindrops in Rain Room, swaying kelp in Underwater Room,
   swaying tree canopies in Forest Walk, drifting note shapes in Music
   Room, and breathing flowers in Grow-a-Garden.
7. Walk to the portal in each zone to return to the Hub. Progress
   (completed quests, unlocked zones, skill tags, avatar choices) is saved
   to `user://progress.json` automatically.

### Controls

Three input paths all drive the same movement — no platform is a second-
class citizen:

- **Touch / mouse**: tap or click a point on the ground to walk there, tap
  an interactable to focus it, then use the bound `interact` action or the
  on-screen "Talk" button (bottom-right of the HUD) — it only appears once
  something is actually in range.
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
| `QuestData` + `QuestManager`, `LESSON` and `CHALLENGE` kinds (wraps existing `LessonData`, or runs a standalone situation+choice+consequence with optional multi-line intro dialogue, no content duplicated) | `BrowseZoneController` + a walkable Museum zone (no real content to drive one yet) |
| 3D `Player`/`NPC`/`Interaction`/`InteractionManager` + `CameraController` | Museum exhibits/zone, Mentors content |
| World Hub: fountain landmark, 7 paths, 7 gate-shaped portals (6 functional, 1 "coming soon"), decorative trees, Hub Guide NPC | Entrepreneur Quest's full BUILD → RUN → RESCUE & GROW track (only one representative quest is built) |
| Library zone (bookshelves + Librarian NPC, reachable from the Hub, honestly empty — see "Content fidelity" below) | Library books content |
| Mind Lab zone + "Different Explanations" quest (an original scenario — no external fact needed, never diagnostic/medical) | — |
| Golden Vault zone + Maya's quest (reuses the existing `LessonData`/`LessonManager`/mini-game/UI overlays unchanged) | Leadership Quest's remaining 9 missions (only 3 of 12 are built) |
| Golden Vault's Savings Guide + "What Does Saving Mean?" quest (`explorer-saving-l1`, Golden Vault's second quest-giving NPC — no new zone needed, no mini-game needed) | Money Quest's remaining 25 lessons |
| Golden Vault's Theo + "Saving vs. Spending: The Real Trade-off" quest (`strategist-saving-l1`, Golden Vault's third quest-giving NPC — completes the "saving" topic's full 3-age-band trilogy in one zone, no mini-game needed) | — |
| Market Town zone + Baker's quest (`explorer-needs_wants-l1`, reached via a portal inside Golden Vault — Money Quest's first 2-zone graph, no mini-game needed) | — |
| Guardian Gate zone + Zara's quest (`builder-scams-l1`, "Spotting a Scam," reached via a portal inside Market Town — Money Quest's first 3-zone graph, no mini-game needed) | — |
| Idea Lab zone + "Handle Competition" quest (ports the website's real `competitor-lower-price` decision event) | — |
| Marketing Studio zone + "Create Your Marketing" quest (ports the real `product-unclear` decision event, reached via a portal inside Idea Lab) | Entrepreneur Quest's `reflect-text`-kind stages (need a free-text input UI not built yet) |
| Workshop zone + "Handle a Customer Problem" quest (ports the real `too-expensive-feedback` decision event, reached via a portal inside Marketing Studio — Entrepreneur Quest's first 3-zone graph) | — |
| Leadership Academy zone + "The Big Mistake" quest (ports the website's real `big-mistake-choice` decision event, with Priya as a real-character NPC) | AI Quest Coach (explicitly not built — see the architecture doc's non-negotiables) |
| Team Challenge zone + "The Angry Customer" quest (ports the real `angry-customer-choice` decision event, reached via a portal inside Leadership Academy, with Theo as a real-character NPC) | Leadership Quest's `spot`/`allocate`/`sort`-kind missions (need mechanics not built yet) |
| Strategy Room zone + "The Better Idea" quest (ports the real `better-idea-choice` decision event, reached via a portal inside Team Challenge — Leadership Quest's first 3-zone graph, with Nadia as a real-character NPC) | Leadership Quest's remaining `mission-choice`-kind missions |
| `EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData` schema, with 2 real Dictionary entries (`goal`, `trade-off`) reusing existing curriculum vocabulary | — |
| Calm World's all 8 named gardens (Bubble Garden, Aquarium Room, Light Room, Rain Room, Underwater Room, Forest Walk, Music Room, Grow-a-Garden) — always unlocked, no choices, all motion respects `reduced_motion` | — |
| `AvatarConfig` + `AvatarCreation.tscn`, now fully wired to `Player.tscn` (see "Avatar wiring fix" below) — 4 body presets incl. a wheelchair-style look, 4 accessories (glasses, cap, hearing aid, cane), all purely visual | — |
| Zone/quest/skill/avatar progression fields in `ProgressManager`, persisted by `SaveManager` | — |
| 4 real `AudioServer` buses (Music/SFX/Voice/Ambient) + `SettingsMenu.tscn` (reduced-motion toggle + 4 volume sliders), reachable from `MainMenu` and the in-world HUD — see "Audio + Settings screen fix" below | Read-aloud/text-to-speech (`AudioManager.speak()` is a documented no-op — no TTS engine exists, so no toggle is shown for it) |
| HUD "Talk" button, shown only when something is in interaction range | — |

## Content fidelity

Every piece of curriculum text in Maya's quest — the story, the vocabulary
(`goal`, `trade-off`), the quiz question/options/explanation, the feedback
lines, the reward message — is copied directly from the real
`messages/en.json` (`curriculum.builder-saving-l1`) and `messages/ro.json`
in the website repo, not invented for this project.

The Savings Guide's quest, also in Golden Vault, is the same: every
curriculum field (story, vocabulary `save`/`later`, quiz, feedback,
reward) is copied from the real `curriculum.explorer-saving-l1` — the
explorer-age-band version of the same "saving" topic Maya's builder-age-band
quest already covers. The only original text is the intro framing and
the choice/consequence wording turning "spend today vs. save for later"
into a concrete one-coin decision, the same discipline as every other
ported lesson.

Theo's quest, the third in Golden Vault, completes the "saving" topic's
full 3-age-band trilogy the same way: every curriculum field (story,
vocabulary `interest`/`long-term`/`opportunity cost`, quiz, feedback,
reward) is copied from the real `curriculum.strategist-saving-l1`. Theo
is the real teenager named in that lesson's own story — a coincidental
reuse of the same name already used for Team Challenge's NPC in
Leadership Quest, since each is drawn verbatim from its own real,
independent source text, not the same character appearing in two tracks.

The Baker's quest in Market Town is the same: every curriculum field
(story, vocabulary `need`/`want`, quiz, feedback, reward) is copied from
the real `curriculum.explorer-needs_wants-l1`. The only original text is
the Baker's own one-line transition ("I've got fresh bread and a giant
chocolate bar right here...") and the choice/consequence wording applying
that lesson's real need-vs-want distinction to a concrete decision —
exactly the brief's own "find the correct game mechanic for the concept"
instruction, not a rewrite of the lesson's meaning.

Zara's quest in Guardian Gate is the same: every curriculum field (title,
learning objective, key concept, vocabulary `scam`/`urgency`/`personal
information`, explanation, quiz, feedback, reward message) is copied from
the real `curriculum.builder-scams-l1`. Zara herself is the real child
named in that lesson's own story (not invented for this project), and the
only original text is the intro framing and the choice/consequence
wording applying the lesson's real urgency-is-a-red-flag concept to a
concrete decision (enter a password right away vs. pause and check with a
trusted adult) — the same "find the correct game mechanic for the
concept" instruction as Market Town.

Idea Lab's "Handle Competition" quest is likewise copied directly from the
real `messages/en.json`/`messages/ro.json` (`entrepreneurQuest.decisionEvents
.competitor-lower-price` and its `build.handle-competition` title/intro) —
the situation, all 3 choices, and all 3 consequences are the website's own
words, not invented for this project.

Marketing Studio's "Create Your Marketing" quest is the same: the
situation, all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.product-unclear` and
`build.create-your-marketing`'s title/learnText.

Workshop's "Handle a Customer Problem" quest is the same: the situation,
all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.too-expensive-feedback` and
`build.handle-a-customer-problem`'s title/learnText.

Leadership Academy's "The Big Mistake" quest is likewise copied directly
from the real `messages/en.json`/`messages/ro.json`
(`leadershipQuest.missions.big-mistake`, including its `priya`/`oren`
intro dialogue and all 4 choices/consequences for the `big-mistake-choice`
event) — Priya and Oren are two of Leadership Quest's 4 real, already-named
characters (`src/content/leadership-quest/structures.ts`), not invented
for this project.

Team Challenge's "The Angry Customer" quest is the same: Theo's intro line
and all 4 choices/consequences for `angry-customer-choice` are copied
verbatim from `leadershipQuest.missions.angry-customer` — including one
option that references Priya by name, exactly as the website's own
content does, reinforcing that Leadership Academy and Team Challenge are
one team's story, not two disconnected casts.

Strategy Room's "The Better Idea" quest is the same: Nadia's intro line
and all 4 choices/consequences for `better-idea-choice` are copied
verbatim from `leadershipQuest.missions.better-idea` — Nadia is the third
of Leadership Quest's 4 real, already-named characters to appear in
Godot, same cast as Priya and Theo, not a new invented character.

The Dictionary's 2 entries (`goal`, `trade-off`) aren't new content at
all — they point at `builder-saving-l1`'s own existing vocabulary
translation keys verbatim (see `data/schemas/ENTRY_DATA_FORMAT.md`'s rule
on this). Library and Museum have zero entries: no book, author,
historical story, or mentor biography is invented for this project, so
both stay empty until something real and verifiable is approved. Calm
World's 8 gardens and Mind Lab's scenario need no real-world fact to be
honest — a bubble is just a bubble — which is why they could be built now
while Library/Museum couldn't.

The Library's walkable zone is the same discipline applied to a physical
space rather than a data entry: the room, shelves, and Librarian are real
and built, but the Librarian's own line says plainly that there's nothing
to browse yet rather than ever implying otherwise. No book or author
appears anywhere in this project.

Mind Lab's "Different Explanations" scenario is original content, not
ported from the website (there's no existing Mind Lab curriculum to port
from) — but unlike a book, author, or historical story, it makes no claim
that needs an external source to verify: "a situation can have more than
one explanation" is a standard, well-established social-emotional-learning
idea, not a fact about the real world. Every one of its 4 choices gets an
equally validating consequence — there is no "correct" explanation, no
score, and nothing in its copy frames the experience as treatment,
therapy, or diagnosis.

The only new content anywhere in this project is UI chrome (menu/Hub/
portal/avatar-creation/zone-guide labels), the savings mini-game's own
week-prompt text (always original to that lesson's design), and the
"Business Guide" NPC's name — a generic role, not a named person, since
Entrepreneur Quest's real content has no fixed mentor character the way
Money Quest's curriculum already has Maya and Leadership Quest already has
its 4 named characters.

## Avatar wiring fix

A real gap, not a content choice, was found and fixed this phase:
`AvatarConfig` (body preset, outfit color, accessory) was being saved and
loaded correctly by `SaveManager`, but `Player.tscn`'s visual was a single
hardcoded-color capsule that never read it — every choice made in
`AvatarCreation.tscn` was invisible in the actual game. `Player.gd` now
applies the saved config every time a zone's `Player` node is
instantiated: `outfit_color` sets the body's material, `body_preset_id`
sets its shape, `accessory_id` shows one attachment.

At the same time, the preset and accessory lists grew to match the
project brief's explicit instruction to offer mobility aids, hearing
devices, and glasses as normal customization options, not a separate
category: `body_preset_id` now includes `preset-d`, a seated,
wheelchair-style silhouette, and `accessory_id` now includes
`hearing_aid` and `cane` alongside the existing `glasses` and `cap`. All
four presets and five accessory options (including "none") are listed
together in one unlabeled dropdown each in `AvatarCreation.tscn` — there
is no separate "accessibility" menu. Every option is purely visual:
`Player.gd` never changes `SPEED`, the `CollisionShape3D`, or interaction
range based on preset or accessory, so no customization choice carries a
gameplay cost or benefit.

## Audio + Settings screen fix

Two more real gaps, found while scoping audio architecture and fixed the
same way as the avatar wiring gap above:

- `AudioManager.gd` set `music_player.bus = "Music"` and
  `sfx_player.bus = "SFX"`, but no bus layout existed anywhere in the
  project — those buses didn't exist, so both players were silently
  falling back to `Master`, and there was no way to control music/SFX
  volume independently even once real audio assets arrive.
  `default_bus_layout.tres` now defines 4 real buses (Music, SFX, Voice,
  Ambient), `Settings.gd` holds one volume field per bus (0.0–1.0 linear,
  persisted by `SaveManager`), and `AudioManager.gd` applies each to the
  real `AudioServer` bus (with a clean mute at 0, not `linear_to_db(0)`'s
  `-inf`). Still inaudible today since zero audio assets exist — but the
  volume control itself is real, not a placeholder.
- There was no Settings UI anywhere in the project — `Settings.reduced_motion`
  could only ever be set by editing or loading a save file, never toggled
  by the child actually playing the game. `SettingsMenu.tscn` (a reusable
  overlay, reachable from a new button on `MainMenu` and a new gear-style
  button in the in-world `HUD`) now exposes a reduced-motion toggle plus
  the 4 volume sliders above.

Read-aloud was deliberately NOT added as a Settings toggle: there is no
text-to-speech engine anywhere in this project (per the brief's "do not
make AI voice generation a dependency"), so `AudioManager.speak()` stays
a documented no-op. Offering a UI control for something with nothing real
behind it would break this project's own honesty discipline — the same
reason the Library's shelves say plainly that they're empty rather than
pretending to have books.

## Project structure

See `docs/money-quest-world-architecture.md` Section 11 for the full
rationale. Quick map:

- `autoload/` — global singletons: `Localization`, `Settings` (now with 4
  volume fields), `GameState`, `ProgressManager`, `SaveManager`,
  `AudioManager` (now applies real `AudioServer` bus volume),
  `WorldManager`, `QuestManager`. `DialogueBox`/`ChoicePanel`/
  `RewardPopup` are also autoloads (scene-based) — see `project.godot`'s
  own comment on why.
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
  zone; now with 3 resident NPCs, Maya, the Savings Guide, and Theo.
- `scenes/world/zones/market_town/MarketTown.tscn` — Money Quest's second
  zone, reached via a portal inside Golden Vault.
- `scenes/world/zones/guardian_gate/GuardianGate.tscn` — Money Quest's
  third zone, reached via a portal inside Market Town.
- `scenes/world/zones/idea_lab/IdeaLab.tscn` — Entrepreneur Quest's first
  zone.
- `scenes/world/zones/marketing_studio/MarketingStudio.tscn` —
  Entrepreneur Quest's second zone, reached via a portal inside Idea Lab.
- `scenes/world/zones/workshop/Workshop.tscn` — Entrepreneur Quest's
  third zone, reached via a portal inside Marketing Studio.
- `scenes/world/zones/leadership_academy/LeadershipAcademy.tscn` —
  Leadership Quest's first zone.
- `scenes/world/zones/team_challenge/TeamChallenge.tscn` — Leadership
  Quest's second zone, reached via a portal inside Leadership Academy.
- `scenes/world/zones/strategy_room/StrategyRoom.tscn` — Leadership
  Quest's third zone, reached via a portal inside Team Challenge.
- `scenes/world/zones/calm_world/` — Calm World's 8 gardens:
  `BubbleGarden.tscn` (reachable from the Hub) plus `AquariumRoom.tscn`,
  `LightRoom.tscn`, `RainRoom.tscn`, `UnderwaterRoom.tscn`,
  `ForestWalk.tscn`, `MusicRoom.tscn`, and `GrowAGarden.tscn` (each
  reached via a portal placed inside Bubble Garden).
- `scenes/world/zones/library/Library.tscn` — the Library zone, honestly
  empty of real books.
- `scenes/world/zones/mind_lab/MindLab.tscn` — Mind Lab's first zone and
  quest.
- `scenes/world/Main.tscn` — the persistent root: a `ZoneContainer`
  `WorldManager` swaps zone scenes into, plus the always-present `HUD`.
- `scenes/player/` — `Player.tscn`, `CameraController.tscn`,
  `AvatarCreation.tscn`.
- `scenes/characters/NPC.tscn`.
- `scenes/quests/builder_saving_l1/` — Maya's quest's mini-game stage.
- `scenes/ui/` — `DialogueBox`, `ChoicePanel`, `RewardPopup`, `HUD` (now
  with a Settings button and a mobile "Talk" button).
- `scenes/menus/` — `MainMenu.tscn` (now with a Settings button),
  `SettingsMenu.tscn` (reduced-motion toggle + 4 volume sliders,
  reachable from both `MainMenu` and `HUD`).
- `default_bus_layout.tres` — the 4 real audio buses (Music, SFX, Voice,
  Ambient) referenced in `project.godot`'s `[audio]` section.
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
  the architecture. The 4 audio buses and their volume sliders are real
  and already wired to `AudioServer`, but silent until real `.ogg` files
  are dropped into `assets/audio/` and referenced from `AudioManager.gd`.
  Read-aloud/text-to-speech has no engine wired in at all — not even a
  silent placeholder bus — since one would require either an offline
  voice model or a paid API, both out of scope per the brief.
- Only 5 of 30 curriculum lessons are wired up as Quests, only 3 of
  Entrepreneur Quest's many real BUILD/RUN/RESCUE & GROW stages are
  ported, and only 3 of Leadership Quest's 12 real missions are ported.
  See `docs/money-quest-world-architecture.md` Section 12 for the
  development order for the rest, the 17 games, and the 4 simulator
  scenarios.
- Museum is the only Hub portal still reachable-but-"coming soon" — the
  portal, zone registration, and locking logic all already work for it;
  only its actual zone content doesn't exist yet, by design, per the
  brief's explicit "do not build all of this content at once." The
  Library's portal is functional and its zone is real, but it has zero
  real book entries for the same reason Museum has zero exhibits: no
  book, historical story, or mentor biography may be invented — see
  `data/schemas/ENTRY_DATA_FORMAT.md`. Mind Lab and all 8 of Calm World's
  named gardens are fully built, since neither needed a real-world fact
  to verify before it could be written honestly.
