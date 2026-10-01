extends Control
## MainMenu — the game's entry point (see project.godot's run/main_scene).
## Deliberately minimal in this phase (see docs/godot-architecture-plan.md
## Section 8 — WorldMap/MainMenu are stubbed, not fleshed out, since a
## one-lesson vertical slice doesn't need a full world-selection flow yet).

@onready var start_button: Button = $CenterContainer/VBox/StartButton
@onready var title_label: Label = $CenterContainer/VBox/TitleLabel


func _ready() -> void:
	title_label.text = Localization.t("menu.title")
	start_button.text = Localization.t("menu.start_button")
	start_button.pressed.connect(_on_start_pressed)


func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/world_map/WorldMap.tscn")
