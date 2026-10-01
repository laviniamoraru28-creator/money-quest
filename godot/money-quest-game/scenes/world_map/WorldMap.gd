extends Control
## WorldMap — stubbed intentionally (see docs/godot-architecture-plan.md
## Section 8): a real world map with 7 world icons and 30 lesson nodes is
## future work once this architecture is validated on more than one
## lesson. For this vertical slice, it lists the ONE built lesson.

@onready var lesson_button: Button = $CenterContainer/VBox/LessonButton
@onready var title_label: Label = $CenterContainer/VBox/TitleLabel

const BUILDER_SAVING_L1_PATH := "res://data/lessons/builder_saving_l1.tres"


func _ready() -> void:
	title_label.text = Localization.t("worldmap.title")
	lesson_button.text = Localization.t("curriculum.builder-saving-l1.title")
	lesson_button.pressed.connect(_on_lesson_selected)


func _on_lesson_selected() -> void:
	var lesson_scene: PackedScene = load("res://scenes/lessons/LessonBase.tscn")
	var lesson_base := lesson_scene.instantiate()
	get_tree().root.add_child(lesson_base)
	get_tree().current_scene.queue_free()
	get_tree().current_scene = lesson_base
	lesson_base.lesson_complete.connect(func(_id): get_tree().change_scene_to_file("res://scenes/world_map/WorldMap.tscn"))
	lesson_base.load_and_start(BUILDER_SAVING_L1_PATH)
