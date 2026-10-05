extends Control
## AvatarCreation — a quick first-launch screen where a child builds the
## explorer they'll walk around as, with a live 3D preview that updates
## with every choice. No identity is forced, there is no gender choice,
## every option is cosmetic only and never gates any content.
##
## Choices are mostly visual — colour swatches for skin tone, hair colour
## and outfit, numbered buttons for hair style (the preview shows what each
## one looks like) — so creating a character needs very little reading.
## Every swatch and button is at least 44 px, keyboard/gamepad focusable,
## and shows its selected state with a thick outline, not by colour alone.
##
## Presets and accessories are listed together, deliberately not split into
## a separate "accessibility options" section — the Wheelchair look (preset-d),
## a hearing aid or a cane is just one more look, the same as a cap or a
## colour, per the project brief's "do not force the player into a single
## character identity" and its explicit instruction to offer mobility aids
## / hearing devices / glasses as normal customization options rather than
## a special category. Accessories are independent toggles: any
## combination (or none) is fine.

const BODY_PRESETS: Array[String] = ["preset-a", "preset-b", "preset-c", "preset-d"]
const ACCESSORIES: Array[String] = ["glasses", "cap", "hearing_aid", "cane"]
const SWATCH_SIZE := Vector2(48, 48)
const INK := Color("1C2624")
const TEAL := Color("0F7A6B")
const TURNTABLE_SPEED: float = 0.45

@onready var title_label: Label = $Margin/HBox/Scroll/VBox/TitleLabel
@onready var preset_label: Label = $Margin/HBox/Scroll/VBox/PresetLabel
@onready var preset_option: OptionButton = $Margin/HBox/Scroll/VBox/PresetOption
@onready var skin_label: Label = $Margin/HBox/Scroll/VBox/SkinLabel
@onready var hair_style_label: Label = $Margin/HBox/Scroll/VBox/HairStyleLabel
@onready var hair_color_label: Label = $Margin/HBox/Scroll/VBox/HairColorLabel
@onready var skin_row: HFlowContainer = $Margin/HBox/Scroll/VBox/SkinRow
@onready var hair_style_row: HFlowContainer = $Margin/HBox/Scroll/VBox/HairStyleRow
@onready var hair_color_row: HFlowContainer = $Margin/HBox/Scroll/VBox/HairColorRow
@onready var color_label: Label = $Margin/HBox/Scroll/VBox/ColorLabel
@onready var outfit_row: HFlowContainer = $Margin/HBox/Scroll/VBox/OutfitRow
@onready var color_picker: ColorPickerButton = $Margin/HBox/Scroll/VBox/OutfitRow/ColorPickerButton
@onready var accessory_label: Label = $Margin/HBox/Scroll/VBox/AccessoryLabel
@onready var accessory_row: HFlowContainer = $Margin/HBox/Scroll/VBox/AccessoryRow
@onready var continue_button: Button = $Margin/HBox/Scroll/VBox/ContinueButton
@onready var character_anchor: Node3D = $Margin/HBox/Preview/SubViewport/CharacterAnchor

## Edited copy — only written back to ProgressManager on Continue.
var _draft: AvatarConfig
var _outfit_group := ButtonGroup.new()


func _ready() -> void:
	_draft = ProgressManager.avatar_config.duplicate(true)

	title_label.text = Localization.t("avatar_creation.title")
	preset_label.text = Localization.t("avatar_creation.preset_label")
	color_label.text = Localization.t("avatar_creation.color_label")
	accessory_label.text = Localization.t("avatar_creation.accessory_label")
	continue_button.text = Localization.t("common.continue_button")
	skin_label.text = Localization.t("avatar_creation.skin_label")
	hair_style_label.text = Localization.t("avatar_creation.hair_style_label")
	hair_color_label.text = Localization.t("avatar_creation.hair_color_label")
	# Ink text on the cream background (the default theme's white text would
	# be unreadable here); Continue is the one strong teal action.
	for label in [title_label, preset_label, skin_label, hair_style_label, hair_color_label, color_label, accessory_label]:
		label.add_theme_color_override("font_color", INK)
	_apply_primary_style(continue_button)

	preset_option.clear()
	for preset_id in BODY_PRESETS:
		preset_option.add_item(Localization.t("avatar_creation.preset.%s" % preset_id))
	preset_option.selected = max(BODY_PRESETS.find(_draft.body_preset_id), 0)
	preset_option.item_selected.connect(func(i: int) -> void:
		_draft.body_preset_id = BODY_PRESETS[i]
		_refresh_preview())

	_build_color_row(skin_row, CharacterPalette.SKIN_TONES, _draft.skin_tone_id, func(id: String) -> void:
		_draft.skin_tone_id = id)
	_build_hair_style_row()
	_build_color_row(hair_color_row, CharacterPalette.HAIR_COLORS, _draft.hair_color_id, func(id: String) -> void:
		_draft.hair_color_id = id)
	_build_outfit_row()
	_build_accessory_row()

	continue_button.pressed.connect(_on_continue_pressed)
	_refresh_preview()
	# Keyboard/gamepad players start on the first choice (see UIFocus);
	# the scroll list follows focus so every row stays reachable.
	UIFocus.focus(preset_option)


func _process(delta: float) -> void:
	# A slow turntable so the child sees the whole character; still when
	# reduced motion is on.
	if not Settings.reduced_motion:
		character_anchor.rotate_y(TURNTABLE_SPEED * delta)


func _refresh_preview() -> void:
	for child in character_anchor.get_children():
		child.queue_free()
	character_anchor.add_child(CharacterBuilder.build(CharacterLook.from_avatar_config(_draft), true))


# --- rows -------------------------------------------------------------------

func _build_color_row(row: Container, colors: Dictionary, selected_id: String, on_pick: Callable) -> void:
	var group := ButtonGroup.new()
	for id: String in colors:
		var b := _swatch(colors[id], group)
		b.button_pressed = id == selected_id
		b.pressed.connect(func() -> void:
			on_pick.call(id)
			_refresh_preview())
		row.add_child(b)


func _build_hair_style_row() -> void:
	var group := ButtonGroup.new()
	for i in CharacterPalette.HAIR_STYLES.size():
		var style: String = CharacterPalette.HAIR_STYLES[i]
		var b := Button.new()
		b.text = str(i + 1)
		b.toggle_mode = true
		b.button_group = group
		b.custom_minimum_size = SWATCH_SIZE
		b.button_pressed = style == _draft.hair_style_id
		_apply_outline_style(b, Color("F3ECDD"))
		b.pressed.connect(func() -> void:
			_draft.hair_style_id = style
			_refresh_preview())
		hair_style_row.add_child(b)


func _build_outfit_row() -> void:
	var matched: bool = false
	for c in CharacterPalette.OUTFIT_COLORS:
		var b := _swatch(c, _outfit_group)
		if c.is_equal_approx(_draft.outfit_color):
			b.button_pressed = true
			matched = true
		b.pressed.connect(func() -> void:
			_draft.outfit_color = c
			color_picker.color = c
			_refresh_preview())
		outfit_row.add_child(b)
	# The original free colour picker stays available at the end of the row
	# ("more colours"), so any colour chosen before keeps working.
	outfit_row.move_child(color_picker, -1)
	color_picker.color = _draft.outfit_color
	color_picker.color_changed.connect(func(c: Color) -> void:
		_draft.outfit_color = c
		for b in _outfit_group.get_buttons():
			b.set_pressed_no_signal(false)
		_refresh_preview())
	if not matched:
		for b in _outfit_group.get_buttons():
			b.set_pressed_no_signal(false)


func _build_accessory_row() -> void:
	for id in ACCESSORIES:
		var b := Button.new()
		b.text = Localization.t("avatar_creation.accessory.%s" % id)
		b.toggle_mode = true
		b.custom_minimum_size = Vector2(0, 48)
		b.button_pressed = _draft.has_accessory(id)
		_apply_outline_style(b, Color("F3ECDD"))
		b.toggled.connect(func(on: bool) -> void:
			_draft.set_accessory(id, on)
			_refresh_preview())
		accessory_row.add_child(b)


# --- styling ------------------------------------------------------------------

func _swatch(c: Color, group: ButtonGroup) -> Button:
	var b := Button.new()
	b.toggle_mode = true
	b.button_group = group
	b.custom_minimum_size = SWATCH_SIZE
	_apply_outline_style(b, c, 24)
	return b


## Selected = thick ink outline; focused/hovered = sky outline. The state
## never relies on colour alone.
func _apply_outline_style(b: Button, fill: Color, radius: int = 10) -> void:
	var states := {
		"normal": [fill.darkened(0.25), 2],
		"hover": [Color("367D99"), 3],
		"focus": [Color("367D99"), 4],
		"pressed": [Color("1C2624"), 5],
		"hover_pressed": [Color("1C2624"), 5],
	}
	for state in states:
		var sb := StyleBoxFlat.new()
		sb.bg_color = fill
		sb.set_corner_radius_all(radius)
		sb.border_color = states[state][0]
		sb.set_border_width_all(states[state][1])
		sb.content_margin_left = 12
		sb.content_margin_right = 12
		b.add_theme_stylebox_override(state, sb)
	b.add_theme_color_override("font_color", Color("1C2624"))
	b.add_theme_color_override("font_pressed_color", Color("1C2624"))
	b.add_theme_color_override("font_hover_color", Color("1C2624"))
	b.add_theme_color_override("font_focus_color", Color("1C2624"))
	b.add_theme_color_override("font_hover_pressed_color", Color("1C2624"))


## Teal with white text (5.4:1 contrast); a thick ink outline when focused.
func _apply_primary_style(b: Button) -> void:
	for state in ["normal", "hover", "pressed", "focus"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = TEAL.darkened(0.15) if state == "pressed" else TEAL
		sb.set_corner_radius_all(14)
		if state == "focus" or state == "hover":
			sb.border_color = INK
			sb.set_border_width_all(4)
		b.add_theme_stylebox_override(state, sb)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(c, Color.WHITE)
	b.add_theme_font_size_override("font_size", 22)


func _on_continue_pressed() -> void:
	var config: AvatarConfig = ProgressManager.avatar_config
	config.body_preset_id = _draft.body_preset_id
	config.outfit_color = _draft.outfit_color
	config.skin_tone_id = _draft.skin_tone_id
	config.hair_style_id = _draft.hair_style_id
	config.hair_color_id = _draft.hair_color_id
	config.accessory_ids = _draft.accessory_ids.duplicate()
	config.accessory_id = _draft.accessory_id
	ProgressManager.has_created_avatar = true
	SaveManager.save_progress()
	get_tree().change_scene_to_file("res://scenes/world/Main.tscn")
