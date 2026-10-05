extends Control
## MainMenu — the game's entry point (see project.godot's run/main_scene).
## Deliberately minimal — a title and one Start button. A returning child
## who already created an avatar goes straight into the Hub; a new child
## is sent through AvatarCreation.tscn first (see
## docs/money-quest-world-architecture.md Section 9).

const SETTINGS_MENU_SCENE: PackedScene = preload("res://scenes/menus/SettingsMenu.tscn")

@onready var start_button: Button = $CenterContainer/VBox/StartButton
@onready var settings_button: Button = $CenterContainer/VBox/SettingsButton
@onready var title_label: Label = $CenterContainer/VBox/TitleLabel


func _ready() -> void:
	title_label.text = Localization.t("menu.title")
	start_button.text = Localization.t("menu.start_button")
	settings_button.text = Localization.t("common.settings_button")
	start_button.pressed.connect(_on_start_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	# Keyboard/gamepad players start on Start (see UIFocus).
	UIFocus.focus(start_button)


func _on_start_pressed() -> void:
	if ProgressManager.has_created_avatar:
		get_tree().change_scene_to_file("res://scenes/world/Main.tscn")
	else:
		get_tree().change_scene_to_file("res://scenes/player/AvatarCreation.tscn")


func _on_settings_pressed() -> void:
	add_child(SETTINGS_MENU_SCENE.instantiate())
