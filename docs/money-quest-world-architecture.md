# Money Quest World — Revised Architecture

**Status:** architecture proposal, supersedes the Godot-specific sections of
`docs/godot-architecture-plan.md` (that document's Section 1 audit of the
website remains the source of truth and is unchanged — read it first if
you haven't). This document covers the pivot from "a Godot game containing
21 lessons" to "Money Quest World: a persistent, zone-based 3D world that
existing lessons become experiences inside."

Nothing has been rebuilt yet. This is the proposal requested before
continuing implementation.

---

## 1. What exists today vs. what's proposed

The previous prototype (`godot/money-quest-game/`, see its own README) is
a **2D, single-lesson vertical slice**. It proved the content pipeline
(real curriculum text → `LessonData` → UI) works end to end. It was never
a "world" — there was no zone, no persistent space, no avatar. Below is
the disposition of every piece of it.

### Kept as-is (zero change)

| File | Why |
|---|---|
| `scripts/core/LessonData.gd`, `DialogueLine.gd`, `ChoiceOption.gd`, `DialogueChoice.gd`, `ConsequenceEffect.gd`, `VocabTerm.gd` | Pure content data, no dimensionality |
| `scripts/core/VirtualMoney.gd` | Pure logic |
| `autoload/Localization.gd`, `localization/translations.csv` | Locale-agnostic |
| `autoload/GameState.gd`, `ProgressManager.gd`, `SaveManager.gd` | Pure data/logic (schema grows additively, see Section 6) |
| `scenes/core/DialogueBox.tscn/.gd`, `ChoicePanel.tscn/.gd`, `RewardPopup.tscn/.gd`, `HUD.tscn/.gd` | `CanvasLayer` screen-space UI — works identically over a 2D or 3D world |
| `scripts/minigames/SavingsAllocationMiniGame.gd` | Pure `ChoicePanel` logic, no world presence |
| `scripts/core/MiniGameBase.gd`'s `stage_finished` contract | A signal, dimension-agnostic |
| `data/lessons/builder_saving_l1.tres` + its `translations.csv` rows | Real curriculum content, not code |
| `autoload/AudioManager.gd` (core) | Hooks are sound; grows additively (Section 9) |

### Refactored (same role, ported to 3D)

| File | Change |
|---|---|
| `scripts/core/Player.gd` / `scenes/core/Player.tscn` | `CharacterBody2D` → `CharacterBody3D`; tap-to-move → full mobile/desktop/gamepad controller (Section 5) |
| `scripts/core/NPC.gd` / `scenes/core/NPC.tscn` | `Area2D` → `Area3D` |
| `scripts/core/Interaction.gd` / `InteractionManager.gd` | `Area2D`/body detection → `Area3D`; the `register()`/`unregister()`/`try_interact()` signal pattern is unchanged |
| `scenes/world_map/WorldMap.tscn` | Was a button-list stub → becomes the first real 3D zone (a hub) |

### Redesigned (new concept)

- **Quest system** (`QuestData`) — did not exist; see Section 3.
- **Zone/World system** (`ZoneData`, `WorldManager`) — did not exist; see Section 2.
- **Avatar customization** — did not exist; see Section 5.
- **`CameraController`** — explicitly deferred in the first pass; now required; see Section 5.
- **`LessonManager`'s ownership model** — it used to own a whole scene (`LessonBase.tscn`); it becomes a sub-system a **quest** invokes inside a zone, not the only entry point into content; see Section 4.

### Unchanged principles

No network code, no database, no authentication, no real banking, no
gambling mechanics, no AI Coach — Money Quest World remains a standalone
Godot project with local save only. Every piece of curriculum content
comes from the real `messages/*.json`, never invented. Nothing is built
before its foundation is proven (Section 10's staged plan).

---

## 2. World structure: Zones

**Proposal: reuse the website's existing 7 worlds as the initial zone
list**, rather than inventing new names. The website already has
`src/content/worlds.ts` (Coin Cove, Market Town, Golden Vault, Sky
Exchange, Guardian Gate, Horizon Peaks, Kindness Grove) with its own
`world.*` color tokens in `tailwind.config.ts`. Using these:

- Makes "Play this in Money Quest World" a real, coherent link later
  (Section 18 of your brief) — same world, same name, same color identity,
  on both the website and in Godot.
- Avoids inventing a second, parallel naming scheme to maintain.
- Each zone's existing topic (saving, needs_wants, scams, etc.) gives it
  an obvious set of quests to eventually contain.

If you'd rather keep the brief's illustrative zone list (Money Quest Town,
Shopping District, Bank/Savings area, etc.) as a *separate, additional*
layer — e.g., Golden Vault's in-world "district" is themed around
saving/banking — that also works; the data model below supports either
without caring which naming scheme wins.

```gdscript
# data model — scripts/world/ZoneData.gd
class_name ZoneData
extends Resource

@export var zone_id: String          # e.g. "golden-vault" — matches the website's worldId
@export var display_name_key: String
@export var scene_path: String       # res:// path to this zone's 3D scene
@export var theme_color: Color       # pulled from the website's world.* tokens for visual continuity
@export var unlock_condition: String # e.g. "" (always unlocked) or a quest_id that must be completed first
@export var npc_ids: Array[String]
@export var quest_ids: Array[String]
```

**Loading**: each zone is its own scene, loaded/unloaded by a new
`WorldManager` autoload — never all zones resident at once (Section 21's
performance requirement). A simple `change_zone(zone_id)` swaps the active
zone scene under a persistent root (HUD, player data, and autoloads stay
alive across the swap; only the zone's own `Node3D` tree is freed/loaded).
This is Godot's standard "additive scene loading" pattern — no custom
streaming engine needed for a project this size.

---

## 3. Quest system

`QuestData` is new, and is the thing a child actually "picks up" in the
world. A quest MAY wrap a `LessonData` (for anything that maps to real
curriculum content) or stand alone (a pure exploration/challenge quest
with no lesson behind it, per your Section 7's "quests shouldn't all look
identical").

```gdscript
# scripts/quests/QuestData.gd
class_name QuestData
extends Resource

@export var quest_id: String
@export var title_key: String
@export var description_key: String
@export var educational_objective_key: String   # "" if this is a pure exploration quest

@export var zone_id: String
@export var location_id: String        # a named spot within the zone (see LocationData, Section 2 extension)
@export var giver_npc_id: String

enum QuestKind { LESSON, EXPLORATION, CHALLENGE, SIMULATION }
@export var kind: QuestKind = QuestKind.LESSON

## Only set when kind == LESSON — the existing LessonData this quest wraps.
## This is the ONE place a lesson and its in-world placement connect;
## LessonData itself never knows about zones, NPCs, or quests.
@export var lesson_data_path: String = ""

@export var xp_reward: int
@export var coin_reward: int
@export var skill_ids: Array[String] = []   # which Skill(s) this quest develops — see Section 6
```

`QuestManager` (new, `scripts/quests/QuestManager.gd`) replaces
`LessonManager`'s role as "the thing the game talks to when a quest
starts." When `kind == LESSON`, `QuestManager` loads the referenced
`LessonData` and runs it through the **exact same beat sequence**
`LessonManager` already implements (intro → stage/mini-game → choice →
explanation → quiz → reward) — that sequence doesn't change, only who owns
it changes. For `EXPLORATION`/`CHALLENGE`/`SIMULATION` kinds, `QuestManager`
runs a simpler flow (no quiz, for instance) appropriate to that kind.

**This directly satisfies your Section 8 requirement**: the same
`LessonData` that powers a quest in Money Quest World is the same resource
that could describe the lesson on the website side — neither duplicates
the other's content.

---

## 4. Where a quest actually "happens"

Two patterns, chosen per-quest (not forced to be identical everywhere):

1. **In-place, in the open zone**: the child walks up to an NPC standing
   in, say, Market Town, talks to them, and the dialogue/choice/consequence
   plays out right there via the existing `CanvasLayer` UI overlays, with
   no scene transition. Best for short, simple quests (most
   `EXPLORATION`/`CHALLENGE` quests, and simple one-choice lessons).
2. **Interior instance**: the child walks through a door (an `Interaction`
   on a door object) into a dedicated interior scene — this is exactly
   what `BuilderSavingL1.tscn` already is, just reframed: instead of being
   the top-level scene the whole game boots into, it's instanced by
   `WorldManager`/`QuestManager` as a sub-scene, with the parent zone
   remembered so "exit" returns the child to exactly where they were.
   Best for quests needing their own staged room (like Maya's
   sketchbook scenario) or a mini-game that benefits from a focused space.

Both patterns reuse the same `QuestManager` → `LessonManager` → UI
pipeline underneath — the only difference is whether a new `Node3D` scene
is instanced first.

---

## 5. Player avatar, camera, and controls

**Avatar (new)**: a small `AvatarConfig` resource (body base, outfit
color, accessory) saved in `SaveManager`'s data. Scope the FIRST
implementation small and inclusive by construction, not by addition later:

- No gendered default; a handful of neutral body/outfit presets to start.
- Color choices only at first (cheap to build, inherently inclusive — no
  "which one looks most like me" problem when the options are a palette,
  not a narrow set of body types).
- Architecture leaves room for more presets (varied builds, visible
  accessibility representation like glasses, hearing aids, a mobility
  aid, or a wheelchair-using avatar) as a clearly-labeled later addition —
  not promised as part of the first slice, but the `AvatarConfig` shape
  doesn't need to change to add them.

**Camera (new)**: a `CameraController.gd` doing a simple third-person
follow (smoothed position + fixed or light touch-drag rotation) — no
complex cinematic system needed for the first zone.

**Controls (refactor)**: `Player.gd` becomes dimension-aware with THREE
input paths feeding the same movement vector, matching your Section 19
requirement:
- **Touch**: an on-screen virtual joystick (bottom-left, thumb-reachable
  one-handed) + a tap-to-interact button, not tap-to-move-to-a-point (a 3D
  world with a camera makes click-to-move ambiguous in a way the 2D
  prototype's flat ground didn't have — a joystick is the standard,
  predictable mobile 3D control).
- **Desktop**: WASD/arrow keys + mouse-look (optional) or a fixed camera
  needing no mouse-look at all for the first zone, to keep Stage 1-3
  simple.
- **Gamepad**: left stick for movement, one face button for interact —
  Godot's InputMap already abstracts this cheaply if actions are bound to
  all three device types from the start.

---

## 6. Progression: Skills and Achievements (additive)

`ProgressManager` already has `completed_lesson_ids`/`earned_badge_ids` —
this grows, it doesn't change shape:

```gdscript
# addition to ProgressManager's saved data
var completed_quest_ids: Array[String] = []
var unlocked_zone_ids: Array[String] = []
var skill_points: Dictionary = {}   # skill_id -> int, incremented by completed quests' skill_ids
```

`SkillData`/`AchievementData` are small new Resources (id + display key +
icon key) — a reusable, data-driven list, not hard-coded. This is new
infrastructure, clearly flagged as new (per your Section 12's explicit
instruction), not a pretend-existing feature.

---

## 7. Inclusive design and accessibility (from the start, not bolted on)

`Settings.gd` already holds `reduced_motion`/`theme_mode` — extend it now,
before more systems are built on top of it, exactly as your brief asks:

```gdscript
var music_volume: float = 0.8
var sfx_volume: float = 0.8
var music_enabled: bool = true
var sfx_enabled: bool = true
var visual_intensity: String = "standard"   # "standard" | "calm" — see below
```

`AudioManager` reads these before every `play_music()`/`play_sfx()` call —
one gate, applied everywhere, the same "respect it everywhere, don't bolt
it on per-component" discipline `reduced_motion` already uses.

**"Calm spaces"** (your Section 5 example): modeled as nothing more than a
`ZoneData` entry whose scene has gentle lighting, minimal interaction, and
ambient audio — no special engine feature needed, no therapeutic framing
in any copy, just a zone like any other with deliberately quiet content. Not
built in the first slice; the zone system supports it the moment it's
wanted.

---

## 8. Revised folder structure

```
godot/money-quest-game/
  autoload/
    Localization.gd / Settings.gd / GameState.gd / SaveManager.gd
    ProgressManager.gd / AudioManager.gd
    WorldManager.gd          # NEW — which zone is active, zone transitions
  data/
    lessons/                 # kept — one .tres per real lesson
    quests/                  # NEW — one QuestData .tres per quest
    zones/                   # NEW — one ZoneData .tres per zone
    characters/              # NEW — per-NPC personality/dialogue-set data
    avatars/                 # NEW — avatar option sets
    schemas/                 # kept — format docs, growing with QuestData/ZoneData
  localization/
    translations.csv         # kept, grows with new keys
  scripts/
    core/                    # kept: LessonData, DialogueLine, ChoiceOption,
                              # DialogueChoice, ConsequenceEffect, VocabTerm,
                              # VirtualMoney, Interaction, InteractionManager,
                              # MiniGameBase
    world/                   # NEW: ZoneData, WorldManager
    player/                  # NEW home for Player.gd (now 3D), CameraController.gd, AvatarConfig.gd
    characters/              # NEW home for NPC.gd (now 3D)
    quests/                  # NEW: QuestData, QuestManager
    lessons/                 # kept: LessonManager (now invoked by QuestManager)
    minigames/               # kept: SavingsAllocationMiniGame
    progression/             # NEW home for SkillData, AchievementData
  scenes/
    world/
      zones/                 # NEW — one subfolder per zone (e.g. golden_vault/)
    player/                  # Player.tscn (3D), avatar customization scene
    characters/              # NPC.tscn (3D)
    quests/                  # interior/quest scenes (e.g. builder_saving_l1/, unchanged content, new home)
    ui/                      # DialogueBox, ChoicePanel, RewardPopup, HUD — kept, relocated
    menus/                   # MainMenu.tscn + avatar creation
```

This is an evolution of the existing structure (nothing in `scripts/core/`
or `scenes/ui/` changes behavior), not a parallel rewrite.

---

## 9. Audio, localization, save — what's additive vs. new

- **Audio**: `AudioManager`'s existing named-slot pattern (`sfx_library`
  dictionary, silent no-op on a missing key) is kept exactly as designed —
  it already anticipated "assets arrive later." Only `Settings`'
  volume/mute fields are new.
- **Localization**: no change in approach — `translations.csv` grows with
  `zone.*`, `quest.*`, `npc.*` keys as content is added. Still EN+RO
  populated, 7 columns reserved, same discipline.
- **Save**: `SaveManager`'s `user://progress.json` shape grows additively
  (avatar config, unlocked zones, completed quests, skill points) using
  the exact same "merge over defaults" safety it already has — an older
  save never breaks when a new field is added.

---

## 10. Staged build plan (your Section 26, mapped to concrete deliverables)

1. **Core foundation**: `WorldManager` + `ZoneData` + convert `Player`/
   `NPC`/`Interaction` to 3D. No content yet — a bare zone with a
   moveable capsule.
2. **One small playable zone**: Golden Vault, minimal geometry (placeholder
   primitives, matching the brief's "don't over-build visuals yet").
3. **Player avatar**: `AvatarConfig` + a tiny customization menu (color
   choices only, per Section 5 above).
4. **NPC interaction**: Maya, reusing the existing `Interaction` pattern,
   now in 3D.
5. **Quest system**: `QuestData` + `QuestManager`, wired to trigger
   `LessonManager` for `kind == LESSON`.
6. **One complete educational experience**: `builder-saving-l1`, now
   triggered as a real quest from Maya in Golden Vault (not a menu
   button) — the existing `SavingsAllocationMiniGame` plugs in unchanged.
7. **Progression + save**: wire `QuestManager` completion into
   `ProgressManager`/`SaveManager` (already designed to take this).
8. **Accessibility + localization foundations**: `Settings` audio/visual
   fields (Section 7 above); confirm the zone/quest/NPC keys round-trip
   through `translations.csv`.
9. **Test the architecture**: play the one full zone end to end, on a
   touch-simulated viewport and desktop input, before adding more content.
10. **Only then expand**: more zones, more quests, more NPCs — each one
    is now "add a `.tres` file," not "build a new system."

Stage 1 has not been started — this document is the checkpoint you asked
for before continuing.
