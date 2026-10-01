class_name MiniGameBase
extends Node
## MiniGameBase — the base every reusable mini-game extends.
##
## Plain Node, not Node2D/Node3D: a mini-game in Money Quest World has no
## position of its own in the world — it runs as a logic coordinator
## driving the global ChoicePanel/DialogueBox UI overlays while the child
## stands wherever they already were when they triggered it (e.g. talking
## to an NPC). A mini-game that genuinely needs a visual presence in the
## 3D world (a physical object to manipulate) would extend Node3D instead
## — not needed by the one mini-game built so far.
##
## Contract with LessonManager (see LessonManager._run_stage_scene): a
## mini-game MUST emit `stage_finished` exactly once, when the child's
## hands-on part is done, so the lesson can continue into its choice/
## explanation/quiz beats. A mini-game decides its own win/lose/"how it
## went" presentation internally — LessonManager doesn't need to know the
## details of any specific mini-game, only that it eventually finishes.
##
## This base class carries no educational content itself — see
## scripts/minigames/SavingsAllocationMiniGame.gd for the first concrete
## mini-game, and docs/godot-architecture-plan.md Section 17 for the
## planned mapping of the website's other 16 games onto this same base.

signal stage_finished

## A short, child-readable outcome summary, resolved through Localization
## by the caller if it wants to log/display it — never a raw score.
var outcome_summary_key: String = ""


func finish(summary_key: String = "") -> void:
	outcome_summary_key = summary_key
	stage_finished.emit()
