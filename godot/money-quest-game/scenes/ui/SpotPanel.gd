extends CanvasLayer
## SpotPanel — the "spot the problem" mini-game: toggle-select any number
## of items, then submit. Checks the selected set against every item's
## `is_suspicious` flag exactly (an exact-set match) — the same contract
## the website's own SpotMechanic.tsx uses. A wrong submission recolors
## every item as feedback and stays open for another try: this mechanic
## has no hard-fail state, matching the site's "always eventually
## succeeds" design.

@onready var panel: PanelContainer = $Panel
@onready var scenario_label: Label = $Panel/VBox/ScenarioLabel
@onready var items_box: VBoxContainer = $Panel/VBox/ItemsBox
@onready var submit_button: Button = $Panel/VBox/SubmitButton

const MIN_BUTTON_HEIGHT: float = 56.0
const CORRECT_COLOR: Color = Color(0.7, 1.0, 0.7)
const MISSED_COLOR: Color = Color(1.0, 0.85, 0.5)
const WRONG_COLOR: Color = Color(1.0, 0.6, 0.6)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

var _items: Array[SpotItemData] = []
var _item_buttons: Array[Button] = []
var _solved: bool = false
var _feedback: Label
var _qid: String = ""


func _ready() -> void:
	visible = false
	submit_button.pressed.connect(_on_submit_pressed)
	# Words as well as colours after a check, and Listen (L / gamepad X).
	_feedback = Narration.feedback_label()
	_feedback.add_theme_color_override("font_color", Color("FFE7A0"))
	$Panel/VBox.add_child(_feedback)
	$Panel/VBox.add_child(Narration.listen_button())


func show_spot(scenario_text_key: String, items: Array[SpotItemData]) -> void:
	scenario_label.text = Localization.t(scenario_text_key)
	submit_button.text = Localization.t("common.spot_submit_button")
	if items.any(func(it): return not it.icon_tokens.is_empty()):
		await _show_picture_spot(scenario_text_key, items)
		return
	# Items in a fresh random order (AnswerOrder): each button stays paired
	# with its own item, so the check below is unchanged.
	_qid = AnswerOrder.question_id(scenario_text_key, items.map(func(it): return it.text_key))
	var shown: Array[SpotItemData] = []
	for i in AnswerOrder.order_for(_qid, items.size()):
		shown.append(items[i])
	_items = shown
	_solved = false
	_feedback.visible = false
	_clear_items()

	_item_buttons.clear()
	for item in _items:
		var button := Button.new()
		button.text = Localization.t(item.text_key)
		button.toggle_mode = true
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		button.toggled.connect(func(_pressed): _refresh_submit_enabled())
		Narration.read_on_focus(button, button.text)
		items_box.add_child(button)
		_item_buttons.append(button)
	_refresh_submit_enabled()

	visible = true
	UIFocus.focus(items_box)
	AudioManager.present(listen_text())
	while not _solved:
		await get_tree().process_frame
	AnswerOrder.answered(_qid)
	visible = false


## What the Listen control reads: the situation, every item (in the order
## shown) and the last check's result.
func listen_text() -> String:
	if not visible:
		return ""
	var texts: Array = _item_buttons.map(func(b): return PictureChoice.words_of(b))
	var s: String = Narration.question_text(scenario_label.text, texts)
	return s + (" " + _feedback.text if _feedback.visible else "")


func _refresh_submit_enabled() -> void:
	var any_selected := false
	for button in _item_buttons:
		if button.button_pressed:
			any_selected = true
			break
	submit_button.disabled = not any_selected


func _on_submit_pressed() -> void:
	var all_correct := true
	for i in _items.size():
		var button := _item_buttons[i]
		var is_selected := button.button_pressed
		var should_be_selected: bool = _items[i].is_suspicious
		if is_selected == should_be_selected:
			button.modulate = CORRECT_COLOR if should_be_selected else DEFAULT_COLOR
		else:
			all_correct = false
			button.modulate = WRONG_COLOR if is_selected else MISSED_COLOR

	Narration.show_feedback(_feedback, all_correct)
	if all_correct:
		_solved = true


func _clear_items() -> void:
	for child in items_box.get_children():
		child.queue_free()


# --- picture spot (items with pictures) ------------------------------------------------
# The same "spot the problem" game, as picture cards answered at once: a
# tap on a tricky one marks it found (a warning sign and a ✓ — shapes,
# not only colours); a tap on a fine one shows a "try again" sign and
# "this one is OK" — nothing is lost. Done when every tricky one is found.

var picture_mode: bool = false
var _found: Array = []   # bool per item


func _show_picture_spot(scenario_text_key: String, items: Array[SpotItemData]) -> void:
	picture_mode = true
	var words: bool = SupportProfile.show_text()
	_qid = AnswerOrder.question_id(scenario_text_key, items.map(func(it): return it.text_key))
	var shown: Array[SpotItemData] = []
	for i in AnswerOrder.order_for(_qid, items.size()):
		shown.append(items[i])
	_items = shown
	_solved = false
	_feedback.visible = false
	_clear_items()
	_item_buttons.clear()
	_found.clear()
	scenario_label.visible = words
	submit_button.visible = false
	var grid := GridContainer.new()
	grid.name = "PictureItems"
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	items_box.add_child(grid)
	for i in _items.size():
		var b := PictureChoice.make(Localization.t(_items[i].text_key), Array(_items[i].icon_tokens), 50.0, 20)
		b.name = "Message_%s" % _items[i].item_id
		b.custom_minimum_size = Vector2(300, 86)
		# Room on the right for the ✓ and the warning sign (never over the words).
		for st in ["normal", "hover", "pressed", "disabled", "focus"]:
			var sbx: StyleBox = b.get_theme_stylebox(st)
			if sbx:
				var sb2: StyleBox = sbx.duplicate()
				sb2.content_margin_right = 52.0
				b.add_theme_stylebox_override(st, sb2)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var idx := i
		b.pressed.connect(func(): _on_picture_message(idx))
		grid.add_child(b)
		_item_buttons.append(b)
		_found.append(false)
	visible = true
	UIFocus.focus(_item_buttons[0] if not _item_buttons.is_empty() else submit_button)
	AudioManager.present(listen_text())
	_fit_spot_to_content()
	while not _solved:
		await get_tree().process_frame
	AnswerOrder.answered(_qid)
	await get_tree().create_timer(0.9).timeout
	visible = false
	picture_mode = false
	submit_button.visible = true
	scenario_label.visible = true
	panel.offset_top = _base_top
	panel.offset_bottom = _base_bottom


var _base_top: float = 0.0
var _base_bottom: float = 0.0


func _fit_spot_to_content() -> void:
	_base_top = panel.offset_top
	_base_bottom = panel.offset_bottom
	await get_tree().process_frame
	await get_tree().process_frame
	var h: float = maxf(panel.get_combined_minimum_size().y, 240.0)
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5


func _on_picture_message(i: int) -> void:
	if _found[i]:
		return
	var b: Button = _item_buttons[i]
	if _items[i].is_suspicious:
		# Found a trick: a warning sign, a ✓, and it stays marked.
		_found[i] = true
		PictureChoice.set_picked(b, true)
		var sign := MissionStrip.Glyph.new("warning", 40.0)
		sign.name = "TrickSign"
		sign.mouse_filter = Control.MOUSE_FILTER_IGNORE
		sign.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
		sign.offset_left = -44.0
		sign.offset_right = -6.0
		sign.offset_top = -44.0
		sign.offset_bottom = -6.0
		b.add_child(sign)
		AudioManager.play_sfx("coin", 1.0, -6.0)
		var all_found: bool = true
		for j in _items.size():
			if _items[j].is_suspicious and not _found[j]:
				all_found = false
		if all_found:
			Narration.show_feedback(_feedback, true)
			_feedback.visible = SupportProfile.show_text()
			_solved = true
	else:
		# A fine message: "try again" for a moment — this one is OK.
		var sign := MissionStrip.Glyph.new("retry", 40.0)
		sign.name = "TryAgain"
		sign.mouse_filter = Control.MOUSE_FILTER_IGNORE
		sign.position = Vector2(6, 6)
		b.add_child(sign)
		AudioManager.play_sfx("retry", 1.0, -6.0)
		_feedback.text = Localization.t("gg.spot.this_is_ok")
		_feedback.visible = SupportProfile.show_text()
		AudioManager.narrate(_feedback.text)
		await get_tree().create_timer(1.2).timeout
		if is_instance_valid(sign):
			sign.queue_free()
