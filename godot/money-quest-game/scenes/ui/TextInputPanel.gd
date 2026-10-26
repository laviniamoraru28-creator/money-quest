extends CanvasLayer
## TextInputPanel — a single free-text field with a prompt, an optional
## safety hint, and a Save & Continue button (disabled until non-empty)
## — ports every "reflect-text" Entrepreneur Quest BUILD stage (find a
## problem, create an idea, name your business), the product
## description, and the final pitch's two questions, all of which are
## the real website's own single-field text inputs
## (src/app/[locale]/entrepreneur-quest/build/page.tsx's
## ReflectTextStage/ProductStage/PitchHandoffStage). One generic panel
## since every one of these is the exact same shape: a label, a text
## field (single- or multi-line), and a continue button.
##
## No typing needed: a stage can offer picture suggestions (big picture
## buttons). Picking one fills the field, so the whole flow works by
## tapping, clicking or with a gamepad; typing stays possible for a child
## who wants their own words. With words off, the field steps aside and
## the pictures are the choice.

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var prompt_label: Label = $Panel/VBox/PromptLabel
@onready var hint_label: Label = $Panel/VBox/HintLabel
@onready var single_line_edit: LineEdit = $Panel/VBox/SingleLineEdit
@onready var multi_line_edit: TextEdit = $Panel/VBox/MultiLineEdit
@onready var continue_button: Button = $Panel/VBox/ContinueButton

var _multiline: bool = false
var _max_length: int = 200
## The picture suggestions on screen: [{"button": Button, "text": String}].
var _suggestions: Array = []
var _grid: GridContainer


func _ready() -> void:
	panel.add_theme_stylebox_override("panel", UIStyle.dark_panel())
	visible = false
	single_line_edit.text_changed.connect(func(_t): _on_typed())
	multi_line_edit.text_changed.connect(_on_multi_line_text_changed)
	_grid = GridContainer.new()
	_grid.name = "Suggestions"
	_grid.columns = 2
	_grid.add_theme_constant_override("h_separation", 12)
	_grid.add_theme_constant_override("v_separation", 12)
	_grid.visible = false
	var vbox: VBoxContainer = $Panel/VBox
	vbox.add_child(_grid)
	vbox.move_child(_grid, hint_label.get_index() + 1)


## Shows the field pre-filled with `initial_value` and waits for Save &
## Continue; returns the entered text. `hint_key` left empty hides the
## safety-hint line entirely (only "Name Your Business" uses it).
## `suggestions`: optional picture choices, each {"key": text key,
## "icons": MissionStrip tokens}; picking one fills the field.
func show_text_input(prompt_key: String, placeholder_key: String, initial_value: String, multiline: bool, max_length: int, hint_key: String = "", suggestions: Array = []) -> String:
	var words: bool = SupportProfile.show_text()
	prompt_label.text = Localization.t(prompt_key)
	prompt_label.visible = words
	hint_label.visible = not hint_key.is_empty() and words
	if hint_label.visible:
		hint_label.text = Localization.t(hint_key)
	continue_button.text = Localization.t("common.save_and_continue_button")
	PictureChoice.action_symbol(continue_button, "next")

	_multiline = multiline
	_max_length = max_length
	# Typing is optional when there are pictures to choose from; with words
	# off, the pictures are the choice.
	var field_shown: bool = suggestions.is_empty() or words
	single_line_edit.visible = not multiline and field_shown
	multi_line_edit.visible = multiline and field_shown

	if multiline:
		multi_line_edit.text = initial_value
		multi_line_edit.placeholder_text = Localization.t(placeholder_key)
	else:
		single_line_edit.text = initial_value
		single_line_edit.placeholder_text = Localization.t(placeholder_key)
		single_line_edit.max_length = max_length

	_build_suggestions(suggestions)
	_mark_picked()
	_refresh_continue_enabled()

	continue_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	_fit()
	if not _suggestions.is_empty():
		UIFocus.focus(_suggestions[0]["button"])
	else:
		UIFocus.focus(multi_line_edit if multiline else single_line_edit)
	await _closed
	visible = false

	return _value()


## What Listen reads: the question and the choices.
func listen_text() -> String:
	if not visible:
		return ""
	var parts: PackedStringArray = [prompt_label.text]
	for i in _suggestions.size():
		parts.append(Localization.t("narration.option", {"n": i + 1, "text": _suggestions[i]["text"]}))
	return " ".join(parts)


func _value() -> String:
	return multi_line_edit.text if _multiline else single_line_edit.text


func _set_value(text: String) -> void:
	if _multiline:
		multi_line_edit.text = text
	else:
		single_line_edit.text = text
	_mark_picked()
	_refresh_continue_enabled()


func _build_suggestions(suggestions: Array) -> void:
	for s in _suggestions:
		(s["button"] as Button).queue_free()
	_suggestions.clear()
	for s in suggestions:
		var text: String = Localization.t(String(s["key"]))
		var b := PictureChoice.make(text, s.get("icons", []))
		b.name = "Suggestion_%d" % _suggestions.size()
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func() -> void:
			_set_value(text)
			AudioManager.play_sfx("ui_click"))
		_grid.add_child(b)
		_suggestions.append({"button": b, "text": text})
	_grid.visible = not _suggestions.is_empty()
	# Arrows / D-pad go from the pictures straight to Continue: a text box
	# keeps the arrow keys for its cursor, so it must never be a trap on
	# the way. It is still reachable with Tab, a click or a tap.
	var last_row: int = maxi(_suggestions.size() - _grid.columns, 0)
	for i in _suggestions.size():
		var sb: Button = _suggestions[i]["button"]
		if i >= last_row:
			sb.focus_neighbor_bottom = sb.get_path_to(continue_button)
	continue_button.focus_neighbor_top = continue_button.get_path_to(_suggestions[last_row]["button"]) if not _suggestions.is_empty() else NodePath("")


## The ✓ on the picture that matches what the field says.
func _mark_picked() -> void:
	var v: String = _value().strip_edges()
	for s in _suggestions:
		PictureChoice.set_picked(s["button"], v == s["text"])


## Sized to its content (laid out at its real width first, hidden), kept
## on screen at every interface size.
func _fit() -> void:
	panel.offset_top = -280.0
	panel.offset_bottom = 280.0
	await get_tree().process_frame
	await get_tree().process_frame
	var room: float = panel.get_viewport_rect().size.y - 24.0
	var h: float = minf(maxf(panel.get_combined_minimum_size().y, 240.0), room)
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5


func _on_typed() -> void:
	_mark_picked()
	_refresh_continue_enabled()


func _on_multi_line_text_changed() -> void:
	if multi_line_edit.text.length() > _max_length:
		multi_line_edit.text = multi_line_edit.text.substr(0, _max_length)
	_on_typed()


func _refresh_continue_enabled() -> void:
	continue_button.disabled = _value().strip_edges().is_empty()
