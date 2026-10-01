extends Node2D
## LessonBase — the ONE scene every lesson runs inside. Owns the shared UI
## (HUD, DialogueBox, ChoicePanel, RewardPopup) and a LessonManager wired
## to them, plus a "Stage" container where the lesson's own Player/NPC/
## mini-game content lives. A new lesson never copies this scene's
## wiring — it only provides a LessonData resource and, if it needs
## bespoke staging, a small scene instanced into Stage.
##
## Usage: instance LessonBase, then call load_and_start(lesson_data_path)
## — see scenes/world_map/WorldMap.gd for how the world map does this
## when a lesson is selected.

@onready var hud: Node = $HUD
@onready var dialogue_box: Node = $DialogueBox
@onready var choice_panel: Node = $ChoicePanel
@onready var reward_popup: Node = $RewardPopup
@onready var stage: Node2D = $Stage
@onready var lesson_manager: LessonManager = $LessonManager

signal lesson_complete(lesson_id: String)


func _ready() -> void:
	lesson_manager.dialogue_box = dialogue_box
	lesson_manager.choice_panel = choice_panel
	lesson_manager.reward_popup = reward_popup
	lesson_manager.stage_container = stage
	lesson_manager.lesson_finished.connect(func(id): lesson_complete.emit(id))


func load_and_start(lesson_data_path: String) -> void:
	var data: LessonData = load(lesson_data_path)
	if data == null:
		push_error("LessonBase: could not load LessonData at %s" % lesson_data_path)
		return
	lesson_manager.start_lesson(data)
