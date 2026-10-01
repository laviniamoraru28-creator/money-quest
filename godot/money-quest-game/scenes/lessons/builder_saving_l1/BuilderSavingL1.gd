extends Node2D
## BuilderSavingL1 — the bespoke staging for "Saving for Something Bigger."
##
## Flagged presentation choice (see docs/godot-architecture-plan.md
## Section 15): the real curriculum text doesn't describe a setting beyond
## "Maya wants a sketchbook," so this places her in a simple room with a
## sketchbook visible on a shelf — a minimal, reasonable staging decision,
## not an invented educational claim. A child walks their own character
## up to Maya and interacts to begin, demonstrating the reusable Player/
## NPC/Interaction system before handing off to the SavingsAllocationMiniGame.

# Set by LessonManager before this scene enters the tree (duck-typed, same
# pattern LessonBase uses to wire LessonManager itself).
var dialogue_box: Node
var choice_panel: Node

signal stage_finished

@onready var maya: NPC = $Maya
@onready var sketchbook_label: Label = $SketchbookLabel


func _ready() -> void:
	sketchbook_label.text = Localization.t("lesson.builder_saving_l1.sketchbook_label")
	maya.talked_to.connect(_on_maya_talked_to)


func _on_maya_talked_to(_npc_id: String) -> void:
	# Only start the mini-game once — a child re-approaching Maya after
	# starting shouldn't restart the whole sequence.
	maya.set_deferred("monitoring", false)
	var mini_game := SavingsAllocationMiniGame.new()
	add_child(mini_game)
	await mini_game.run(choice_panel, dialogue_box)
	mini_game.queue_free()
	stage_finished.emit()
