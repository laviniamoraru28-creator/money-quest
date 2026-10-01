# Money Quest — Godot prototype

A **standalone Godot 4.2+ project**. It is never imported into the Next.js
website build and has no network code, no database, no authentication —
see `docs/godot-architecture-plan.md` (at the repo root) for the full
audit and architecture rationale this project implements.

This is a **vertical slice**: one complete, playable lesson
("Saving for Something Bigger" / `builder-saving-l1`) built on a reusable
architecture meant to support the other 29 real curriculum lessons without
rebuilding this foundation — see `data/schemas/LESSON_DATA_FORMAT.md` for
how to add a new lesson.

## How to open and run

1. Install Godot **4.2 or later** (this project was written against 4.2's
   feature set; it was not opened/run in the editor as part of producing
   this prototype, so treat the first open as a verification step, not an
   assumption of correctness).
2. Open Godot, "Import," and select
   `godot/money-quest-game/project.godot`.
3. On first open, Godot will import `localization/translations.csv` as a
   CSV translation source automatically. If it doesn't, select the file in
   the FileSystem dock and re-import it (Import tab → CSV Translation).
4. Press F5 (or the Play button). The game boots into `MainMenu.tscn` →
   `WorldMap.tscn` → the one built lesson.

## Playing the lesson

1. Tap/click "Start," then tap/click the one lesson button on the world
   map ("Saving for Something Bigger").
2. A short intro plays, explaining Maya wants a sketchbook that costs more
   than her weekly allowance.
3. **Tap/click anywhere on the ground to walk** your character over to
   Maya, then press the `interact` input (default: a keyboard action you
   can bind in Project Settings → Input Map — on a touch device, wire an
   on-screen button to call `Player.request_interact()`, see
   `scripts/core/Player.gd`'s comment).
4. The savings mini-game runs for 3 weeks: each week, choose to save the
   full allowance toward the sketchbook or spend a little on a treat. Your
   choices genuinely determine whether the goal is reached — there is no
   single scripted outcome.
5. The lesson's real explanation (from the actual website curriculum
   content) plays, then a quiz question (also real curriculum content,
   retryable, never shaming), then the reward screen, which explicitly
   labels earned coins as **virtual** (never implying real money).
6. Progress is saved to `user://progress.json` automatically.

## What this demonstrates (and what it deliberately doesn't yet)

| Brief requirement | Status here |
|---|---|
| World / character / dialogue | Built — Maya (NPC), a simple room, spoken intro lines |
| Interaction | Built — walk-up-and-interact via `Interaction`/`InteractionManager` |
| Choice and consequence | Built — the 3-week savings mini-game, reusing `DialogueChoice`/`ChoiceOption`/`ConsequenceEffect` |
| Educational explanation after the experience | Built — real `curriculum.builder-saving-l1.explanation` text, shown after, not before |
| Virtual money, clearly labeled | Built — `VirtualMoney`, every display routed through a "virtual coins" translation key |
| Reward / progress / save system | Built — `ProgressManager` + `SaveManager` → `user://progress.json` |
| Mobile-friendly controls | Built — tap-to-move, large touch-target buttons throughout |
| Localization | Built for `en`/`ro` (the two populated CSV columns); `es/fr/de/it/pt/nl/pl` columns exist but are empty — flagged, not silently faked |
| Audio hooks | Stubbed — `AudioManager` has named sound-effect slots and is called from the right places, but ships with zero audio assets (see its own doc comment for why) |
| World map / navigation | Stubbed — lists only the one built lesson; a real 7-world, 30-lesson map is future work |
| Camera following / Inventory | **Not built** — not needed by this one lesson; flagged in `docs/godot-architecture-plan.md` Section 8 as a real gap for lessons that do need them, not silently assumed away |

## Content fidelity

Every piece of curriculum text in this lesson — the story, the vocabulary
(`goal`, `trade-off`), the quiz question/options/explanation, the feedback
lines, the reward message — is copied directly from the real
`messages/en.json` (`curriculum.builder-saving-l1`) and `messages/ro.json`
in the website repo, not invented for this prototype. The only new content
here is the mini-game's own UI text (week prompts, option labels) and the
staging description (the room, the sketchbook on a shelf) — see
`docs/godot-architecture-plan.md` Section 15 for the explicit flag on that
staging choice.

## Project structure

See `docs/godot-architecture-plan.md` Sections 6-9 for the full rationale.
Quick map:

- `autoload/` — global singletons: `Localization`, `Settings`, `GameState`,
  `SaveManager`, `ProgressManager`, `AudioManager`.
- `scripts/core/` — the reusable data model (`LessonData`, `DialogueLine`,
  `DialogueChoice`, `ChoiceOption`, `ConsequenceEffect`, `VocabTerm`) and
  reusable behavior (`LessonManager`, `Interaction`, `InteractionManager`,
  `MiniGameBase`, `Player`, `NPC`, `VirtualMoney`).
- `scripts/minigames/` — concrete mini-games extending `MiniGameBase`
  (currently one: `SavingsAllocationMiniGame`).
- `scenes/core/` — reusable UI/world scenes (`DialogueBox`, `ChoicePanel`,
  `RewardPopup`, `HUD`, `Player.tscn`, `NPC.tscn`).
- `scenes/lessons/LessonBase.tscn` — the one scene every lesson runs
  inside; `scenes/lessons/builder_saving_l1/` — this lesson's own staging.
- `data/lessons/builder_saving_l1.tres` — this lesson's data.
- `data/schemas/LESSON_DATA_FORMAT.md` — how to add lesson 31.
- `localization/translations.csv` — all UI/dialogue/quiz text, 9 locale
  columns (2 populated).

## Known limitations of this prototype (stated plainly)

- Hand-authored `.tscn`/`.tres` files were not opened in the Godot editor
  as part of this task (no Godot editor was available in this environment).
  They follow Godot 4's documented text-format conventions, but the first
  real open in the editor is the actual verification step — treat it as
  such, not as already-proven.
- No art or audio assets are included — visuals are flat-color
  placeholders (`Polygon2D`), matching the brief's own instruction not to
  invent visual direction decisions beyond what's needed to demonstrate
  the architecture.
- Only 1 of 30 lessons is built. See
  `docs/godot-architecture-plan.md` Sections 16-18 for the conversion plan
  for the rest, the 17 games, and the 4 simulator scenarios.
