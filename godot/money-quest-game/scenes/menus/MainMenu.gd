extends Control
## MainMenu — the game's entry point (see project.godot's run/main_scene).
## Deliberately minimal — a title and one Start button. A returning child
## who already created an avatar goes straight into the Hub; a new child
## is sent through AvatarCreation.tscn first (see
## docs/money-quest-world-architecture.md Section 9).

@onready var start_button: Button = $CenterContainer/VBox/StartButton
@onready var title_label: Label = $CenterContainer/VBox/TitleLabel


func _ready() -> void:
	title_label.text = Localization.t("menu.title")
	start_button.text = Localization.t("menu.start_button")
	start_button.pressed.connect(_on_start_pressed)


func _on_start_pressed() -> void:
	if ProgressManager.has_created_avatar:
		get_tree().change_scene_to_file("res://scenes/world/Main.tscn")
	else:
		get_tree().change_scene_to_file("res://scenes/player/AvatarCreation.tscn")
