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
and makes it real with one playable slice — the Hub itself, plus one full
Money Quest zone (Golden Vault) containing Maya's "Saving for Something
Bigger" quest — on architecture meant to support everything else in
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
2. You arrive in the **World Hub** — a plaza with 7 portals. Walk up to one
   and interact with it:
   - **Money Quest** (gold) is the one functional portal — it takes you to
     the **Golden Vault** zone.
   - The other 6 (Entrepreneur Quest, Leadership Quest, Library, Museum,
     Mind Lab, Calm World) show a short "still being built" line — the
     portal, zone registration, and locking logic all already work for
     them; only their actual zone content doesn't exist yet.
3. In Golden Vault, walk up to Maya and interact with her to start her
   quest. The savings mini-game runs for 3 weeks: each week, choose to save
   the full allowance toward the sketchbook or spend a little on a treat.
   Your choices genuinely determine whether the goal is reached.
4. The lesson's real explanation (from the actual website curriculum
   content) plays, then a quiz question (also real curriculum content,
   retryable, never shaming), then the reward screen, which explicitly
   labels earned coins as **virtual** (never implying real money).
5. Walk to the portal near Maya to return to the Hub. Progress (completed
   quests, unlocked zones, skill tags, avatar choices) is saved to
   `user://progress.json` automatically.

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
| `WorldManager` + generalized `ZoneData` (`HUB`/`QUEST`/`LIBRARY`/`MUSEUM`/`MIND_LAB`/`CALM` kinds) | Entrepreneur Quest / Leadership Quest zones |
| `QuestData` + `QuestManager` (wraps existing `LessonData`, no content duplicated) | Library / Museum / Mentor / Dictionary content |
| 3D `Player`/`NPC`/`Interaction`/`InteractionManager` + `CameraController` | Mind Lab |
| World Hub, 7 portals (1 functional, 6 "coming soon") | Calm World gardens |
| Golden Vault zone + Maya's quest (reuses the existing `LessonData`/`LessonManager`/mini-game/UI overlays unchanged) | Fuller avatar presets beyond color/preset/accessory |
| `AvatarConfig` + minimal `AvatarCreation.tscn` | AI Quest Coach (explicitly not built — see the architecture doc's non-negotiables) |
| Zone/quest/skill/avatar progression fields in `ProgressManager`, persisted by `SaveManager` | — |

## Content fidelity

Every piece of curriculum text in Maya's quest — the story, the vocabulary
(`goal`, `trade-off`), the quiz question/options/explanation, the feedback
lines, the reward message — is copied directly from the real
`messages/en.json` (`curriculum.builder-saving-l1`) and `messages/ro.json`
in the website repo, not invented for this project. The only new content
is UI chrome (menu/Hub/portal/avatar-creation labels) and the mini-game's
own week-prompt text, which was always original to this lesson's design.

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
  `DictionaryTermData` schema only, zero content yet (Library/Museum).
- `scenes/world/hub/WorldHub.tscn` — the Hub plaza.
- `scenes/world/zones/golden_vault/GoldenVault.tscn` — this phase's one
  real Money Quest zone.
- `scenes/world/Main.tscn` — the persistent root: a `ZoneContainer`
  `WorldManager` swaps zone scenes into, plus the always-present `HUD`.
- `scenes/player/` — `Player.tscn`, `CameraController.tscn`,
  `AvatarCreation.tscn`.
- `scenes/characters/NPC.tscn`.
- `scenes/quests/builder_saving_l1/` — Maya's quest's mini-game stage.
- `scenes/ui/` — `DialogueBox`, `ChoicePanel`, `RewardPopup`, `HUD`.
- `scenes/menus/MainMenu.tscn`.
- `data/zones/`, `data/quests/`, `data/lessons/` — content `.tres` files.
- `data/library/`, `data/museum/`, `data/dictionary/`, `data/avatars/` —
  reserved, empty.
- `data/schemas/` — `LESSON_DATA_FORMAT.md`, `QUEST_DATA_FORMAT.md`,
  `ZONE_DATA_FORMAT.md`: how to add new content without touching core
  scripts.
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
- Only 1 of 30 curriculum lessons is wired up as a Quest. See
  `docs/money-quest-world-architecture.md` Section 12 for the development
  order for the rest, the 17 games, and the 4 simulator scenarios.
- Entrepreneur Quest, Leadership Quest, Library, Museum, Mind Lab, and
  Calm World are all reachable from the Hub (their portals exist and
  correctly report "coming soon") but have no zone content yet — by
  design, per the brief's explicit "do not build all of this content at
  once."
