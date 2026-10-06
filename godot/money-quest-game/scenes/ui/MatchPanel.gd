extends CanvasLayer
## MatchPanel — a tap-tap matching mini-game: tap a left-column item, then
## tap the right-column item it matches. Never drag — ports the real
## website's own MatchMechanic.tsx interaction model into Godot. A wrong
## tap flashes red and deselects; a correct tap locks the pair green.
## Finishes once every pair is matched — there is no "fail", only
## retry-per-pair.

@onready var panel: PanelContainer = $Panel
@onready var instructions_label: Label = $Panel/VBox/InstructionsLabel
@onready var left_box: VBoxContainer = $Panel/VBox/Columns/LeftBox
@onready var right_box: VBoxContainer = $Panel/VBox/Columns/RightBox

const MIN_BUTTON_HEIGHT: float = 56.0
const WRONG_FLASH_DURATION: float = 0.9
const SELECTED_COLOR: Color = Color(0.7, 0.85, 1.0)
const CORRECT_COLOR: Color = Color(0.7, 1.0, 0.7)
const WRONG_COLOR: Color = Color(1.0, 0.6, 0.6)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

var _pairs: Array[MatchPairData] = []
var _right_order: Array = []   # right_box child slot -> index into _pairs
var _left_buttons: Array[Button] = []
var _right_buttons: Array[Button] = []
var _selected_left_index: int = -1
var _matched_count: int = 0
var _busy: bool = false   # true while a wrong-match flash is showing


func _ready() -> void:
	visible = false
	$Panel/VBox.add_child(Narration.listen_button())


## Runs the full matching mini-game and waits until every pair is matched.
func show_match(pairs: Array[MatchPairData]) -> void:
	instructions_label.text = Localization.t("common.match_instructions")
	_pairs = pairs
	_selected_left_index = -1
	_matched_count = 0
	_busy = false
	_clear_columns()

	_left_buttons.clear()
	for i in _pairs.size():
		var button := _make_item_button(Localization.t(_pairs[i].left_text_key))
		var this_index := i
		button.pressed.connect(func(): _on_left_pressed(this_index))
		left_box.add_child(button)
		_left_buttons.append(button)

	_right_order = range(_pairs.size())
	_right_order.shuffle()
	_right_buttons.clear()
	for slot in _right_order.size():
		var pair_index: int = _right_order[slot]
		var pair: MatchPairData = _pairs[pair_index]
		var right_label: String = Localization.t(pair.right_text_key) if not pair.right_text_key.is_empty() else Localization.t("npc.%s.name" % pair.right_character_id)
		var button := _make_item_button(right_label)
		button.pressed.connect(func(): _on_right_pressed(slot))
		right_box.add_child(button)
		_right_buttons.append(button)

	visible = true
	UIFocus.focus(left_box)
	AudioManager.present(listen_text())
	while _matched_count < _pairs.size():
		await get_tree().process_frame
	visible = false


## What the Listen control reads: the instructions and both columns (in
## the order shown).
func listen_text() -> String:
	if not visible:
		return ""
	var items: Array = []
	for b in _left_buttons + _right_buttons:
		items.append(b.text)
	return Narration.question_text(instructions_label.text, items)


func _on_left_pressed(index: int) -> void:
	if _busy or _left_buttons[index].disabled:
		return
	if _selected_left_index != -1 and not _left_buttons[_selected_left_index].disabled:
		_left_buttons[_selected_left_index].modulate = DEFAULT_COLOR
	_selected_left_index = index
	_left_buttons[index].modulate = SELECTED_COLOR


func _on_right_pressed(slot: int) -> void:
	if _busy or _selected_left_index == -1 or _right_buttons[slot].disabled:
		return
	var pair_index: int = _right_order[slot]
	if pair_index == _selected_left_index:
		_left_buttons[pair_index].disabled = true
		_right_buttons[slot].disabled = true
		_left_buttons[pair_index].modulate = CORRECT_COLOR
		_right_buttons[slot].modulate = CORRECT_COLOR
		_selected_left_index = -1
		_matched_count += 1
	else:
		_busy = true
		var flashed_button := _right_buttons[slot]
		flashed_button.modulate = WRONG_COLOR
		await get_tree().create_timer(WRONG_FLASH_DURATION).timeout
		flashed_button.modulate = DEFAULT_COLOR
		if _selected_left_index != -1:
			_left_buttons[_selected_left_index].modulate = DEFAULT_COLOR
		_selected_left_index = -1
		_busy = false


func _make_item_button(label_text: String) -> Button:
	var button := Button.new()
	button.text = label_text
	button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	Narration.read_on_focus(button, label_text)
	return button


func _clear_columns() -> void:
	for child in left_box.get_children():
		child.queue_free()
	for child in right_box.get_children():
		child.queue_free()
