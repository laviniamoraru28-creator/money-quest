extends Control
## AvatarCreation — a minimal first-launch screen letting a child pick a
## body preset, an outfit color, and an optional accessory before entering
## the Hub for the first time. Deliberately small (see AvatarConfig.gd) —
## no identity is forced, every choice here is cosmetic only and never
## gates any content.
##
## Presets and accessories are listed together, in one unlabeled row each,
## deliberately not split into a separate "accessibility options" section —
## a wheelchair look or a hearing aid is just one more look, the same as a
## cap or a color, per the project brief's "do not force the player into a
## single character identity" and its explicit instruction to offer
## mobility aids / hearing devices / glasses as normal customization
## options rather than a special category.

const BODY_PRESETS: Array[String] = ["preset-a", "preset-b", "preset-c", "preset-d"]
const ACCESSORIES: Array[String] = ["", "glasses", "cap", "hearing_aid", "cane"]

@onready var title_label: Label = $CenterContainer/VBox/TitleLabel
@onready var preset_label: Label = $CenterContainer/VBox/PresetLabel
@onready var preset_option: OptionButton = $CenterContainer/VBox/PresetOption
@onready var color_label: Label = $CenterContainer/VBox/ColorLabel
@onready var color_picker: ColorPickerButton = $CenterContainer/VBox/ColorPickerButton
@onready var accessory_label: Label = $CenterContainer/VBox/AccessoryLabel
@onready var accessory_option: OptionButton = $CenterContainer/VBox/AccessoryOption
@onready var continue_button: Button = $CenterContainer/VBox/ContinueButton


func _ready() -> void:
	title_label.text = Localization.t("avatar_creation.title")
	preset_label.text = Localization.t("avatar_creation.preset_label")
	color_label.text = Localization.t("avatar_creation.color_label")
	accessory_label.text = Localization.t("avatar_creation.accessory_label")
	continue_button.text = Localization.t("common.continue_button")

	preset_option.clear()
	for preset_id in BODY_PRESETS:
		preset_option.add_item(Localization.t("avatar_creation.preset.%s" % preset_id))

	accessory_option.clear()
	for accessory_id in ACCESSORIES:
		var key: String = (
			"avatar_creation.accessory.none" if accessory_id.is_empty()
			else "avatar_creation.accessory.%s" % accessory_id
		)
		accessory_option.add_item(Localization.t(key))

	var preset_index: int = BODY_PRESETS.find(ProgressManager.avatar_config.body_preset_id)
	preset_option.selected = max(preset_index, 0)
	color_picker.color = ProgressManager.avatar_config.outfit_color
	var accessory_index: int = ACCESSORIES.find(ProgressManager.avatar_config.accessory_id)
	accessory_option.selected = max(accessory_index, 0)

	continue_button.pressed.connect(_on_continue_pressed)


func _on_continue_pressed() -> void:
	ProgressManager.avatar_config.body_preset_id = BODY_PRESETS[preset_option.selected]
	ProgressManager.avatar_config.outfit_color = color_picker.color
	ProgressManager.avatar_config.accessory_id = ACCESSORIES[accessory_option.selected]
	ProgressManager.has_created_avatar = true
	SaveManager.save_progress()
	get_tree().change_scene_to_file("res://scenes/world/Main.tscn")
