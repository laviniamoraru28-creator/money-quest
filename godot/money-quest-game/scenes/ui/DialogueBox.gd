extends CanvasLayer
## DialogueBox — shows one line of dialogue/narration at a time with a
## single large "Continue" button. Used for both NPC dialogue (a portrait,
## the speaker's name, and their line) and narrator/explanation text (no
## speaker). It reads like a conversation, not a text wall:
## - a portrait of who is speaking (rendered once from the character
##   itself and cached), their name on a coloured tag, large text;
## - a soft sound for each new line, and the line read aloud when narration
##   is on (the text is always on screen — it is the subtitle);
## - "Continue" names the control for the current device (Enter / A /
##   Click), and the speaking NPC animates while their line is shown
##   (line_shown / closed).
##
## Every screen this shows is driven entirely by translation keys passed
## in from LessonData — this scene contains no lesson-specific text.

@onready var panel: PanelContainer = $Panel
@onready var speaker_label: Label = $Panel/VBox/SpeakerLabel
@onready var text_label: Label = $Panel/VBox/TextLabel
@onready var continue_button: Button = $Panel/VBox/ContinueButton

signal advanced
## A new line is on screen ("" = narrator).
signal line_shown(speaker_id: String)
## The box has closed.
signal closed

var _waiting: bool = false
var portrait: TextureRect
var listen_button: Button
var _portrait_frame: PanelContainer


func _ready() -> void:
	visible = false
	continue_button.pressed.connect(_on_continue_pressed)
	Localization.locale_changed.connect(func(_l): _refresh_current_text())
	InputHints.device_changed.connect(func(_d): _refresh_current_text())
	_restyle()

var _current_speaker_id: String = ""
var _current_text_key: String = ""
var _current_text_params: Dictionary = {}


## Larger, warmer layout built around the original nodes (their paths and
## names stay the same): portrait on the left, name tag, text, Continue.
func _restyle() -> void:
	panel.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	# Bottom-anchored, as tall as its content (grows upward).
	panel.offset_top = panel.offset_bottom
	panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	var vbox: VBoxContainer = $Panel/VBox
	var row := HBoxContainer.new()
	row.name = "Row"
	row.add_theme_constant_override("separation", 22)
	panel.remove_child(vbox)
	panel.add_child(row)
	_portrait_frame = PanelContainer.new()
	_portrait_frame.name = "PortraitFrame"
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("E7F1EC")
	sb.set_corner_radius_all(90)
	sb.border_color = UIStyle.GOLD
	sb.set_border_width_all(5)
	_portrait_frame.add_theme_stylebox_override("panel", sb)
	_portrait_frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(_portrait_frame)
	portrait = TextureRect.new()
	portrait.name = "Portrait"
	portrait.custom_minimum_size = Vector2(140, 140)
	portrait.material = _round_mask()
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_portrait_frame.add_child(portrait)
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(vbox)
	speaker_label.add_theme_font_size_override("font_size", 26)
	speaker_label.add_theme_color_override("font_color", UIStyle.TEAL_DARK)
	text_label.add_theme_font_size_override("font_size", 28)
	text_label.add_theme_color_override("font_color", UIStyle.INK)
	var styled := UIStyle.button("")
	for state in ["normal", "hover", "pressed", "disabled"]:
		continue_button.add_theme_stylebox_override(state, styled.get_theme_stylebox(state))
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		continue_button.add_theme_color_override(c, Color.WHITE)
	continue_button.add_theme_font_size_override("font_size", UIStyle.BUTTON)
	continue_button.custom_minimum_size = Vector2(0, 64)
	styled.free()
	# Listen (L / gamepad X) sits beside Continue: hear the line again.
	var buttons := HBoxContainer.new()
	buttons.name = "Buttons"
	buttons.add_theme_constant_override("separation", 12)
	vbox.add_child(buttons)
	vbox.remove_child(continue_button)
	listen_button = Narration.listen_button()
	listen_button.custom_minimum_size = Vector2(0, 64)
	buttons.add_child(listen_button)
	continue_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	buttons.add_child(continue_button)


## A round mask for the portrait (it sits in a round frame).
static func _round_mask() -> ShaderMaterial:
	var sh := Shader.new()
	sh.code = """shader_type canvas_item;
void fragment() {
	vec4 c = texture(TEXTURE, UV);
	float d = distance(UV, vec2(0.5));
	c.a *= 1.0 - smoothstep(0.47, 0.5, d);
	COLOR = c;
}
"""
	var m := ShaderMaterial.new()
	m.shader = sh
	return m


## Shows one DialogueLine and waits for the child to tap Continue.
func show_line(line: DialogueLine) -> void:
	_current_speaker_id = line.speaker_id
	_current_text_key = line.text_key
	_current_text_params = {}
	_refresh_current_text()
	await _wait_for_continue()


## Shows a single translated text block with no named speaker — used for
## the lesson's consequence/explanation/feedback beats. `params` fills
## any `{placeholder}` tokens the key's own translation contains (see
## Localization.t) — e.g. a dynamically computed amount.
func show_text(text_key: String, params: Dictionary = {}) -> void:
	_current_speaker_id = ""
	_current_text_key = text_key
	_current_text_params = params
	_refresh_current_text()
	await _wait_for_continue()


## Shows a line spoken by `speaker_id` from a translation key (the same as
## show_line, without needing a DialogueLine resource).
func say(speaker_id: String, text_key: String, params: Dictionary = {}) -> void:
	_current_speaker_id = speaker_id
	_current_text_key = text_key
	_current_text_params = params
	_refresh_current_text()
	await _wait_for_continue()


func _refresh_current_text() -> void:
	if _current_text_key.is_empty():
		return
	speaker_label.visible = not _current_speaker_id.is_empty()
	if speaker_label.visible:
		speaker_label.text = Localization.t("npc.%s.name" % _current_speaker_id)
	text_label.text = Localization.t(_current_text_key, _current_text_params)
	continue_button.text = InputHints.prompt(Localization.t("common.continue_button"), "confirm")
	_portrait_frame.visible = not _current_speaker_id.is_empty()
	if _portrait_frame.visible:
		portrait.texture = Portraits.get_portrait(_current_speaker_id, _on_portrait_ready.bind(_current_speaker_id))


## A portrait finished rendering: show it if that speaker is still talking.
func _on_portrait_ready(texture: Texture2D, speaker_id: String) -> void:
	if speaker_id == _current_speaker_id:
		portrait.texture = texture


func _wait_for_continue() -> void:
	visible = true
	UIFocus.focus(continue_button)
	_waiting = true
	AudioManager.play_sfx("talk", randf_range(0.95, 1.05), -6.0)
	AudioManager.narrate(text_label.text)
	line_shown.emit(_current_speaker_id)
	# Touch target follows the website's own min-touch-target discipline
	# (see docs/godot-architecture-plan.md Section 4) — kept comfortably
	# large and full-width at the bottom of the screen for one-handed use.
	await advanced
	continue_button.release_focus()
	visible = false
	closed.emit()


## What the Listen control reads: who is speaking and their line.
func listen_text() -> String:
	if not visible:
		return ""
	return ("%s: %s" % [speaker_label.text, text_label.text]) if speaker_label.visible else text_label.text


func _on_continue_pressed() -> void:
	if _waiting:
		_waiting = false
		AudioManager.stop_narration()
		advanced.emit()
