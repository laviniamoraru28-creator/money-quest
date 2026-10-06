extends CanvasLayer
## SortPanel — a tap-select-then-tap-bucket sorting mini-game: tap an
## item, then tap the bucket it belongs in. Never drag — ports the real
## website's own SortMechanic.tsx interaction model and its explicit
## accessibility reasoning ("every drag interaction needs a non-drag
## alternative... this mechanic simply never uses drag at all"). Checks
## every item's `correct_bucket_key` against where it was placed; a wrong
## submission clears the wrong placements so the child can try again —
## nothing here is a hard fail.

@onready var panel: PanelContainer = $Panel
@onready var instructions_label: Label = $Panel/VBox/InstructionsLabel
@onready var items_box: VBoxContainer = $Panel/VBox/ItemsBox
@onready var buckets_box: HBoxContainer = $Panel/VBox/BucketsBox
@onready var submit_button: Button = $Panel/VBox/SubmitButton

const MIN_BUTTON_HEIGHT: float = 56.0
const SELECTED_COLOR: Color = Color(0.7, 0.85, 1.0)
const CORRECT_COLOR: Color = Color(0.7, 1.0, 0.7)
const WRONG_COLOR: Color = Color(1.0, 0.6, 0.6)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

var _items: Array[SortItemData] = []
var _buckets: Array[SortBucketData] = []
var _item_buttons: Array[Button] = []
var _placements: Array = []   # bucket_key or "" per item, parallel to _items
var _selected_item_index: int = -1
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


func show_sort(buckets: Array[SortBucketData], items: Array[SortItemData]) -> void:
	instructions_label.text = Localization.t("common.sort_instructions")
	submit_button.text = Localization.t("common.sort_submit_button")
	_buckets = buckets
	# Items in a fresh random order (AnswerOrder): each item keeps its own
	# correct bucket, so checking is unchanged.
	_qid = AnswerOrder.question_id("sort", items.map(func(it): return it.text_key))
	var shown: Array[SortItemData] = []
	for i in AnswerOrder.order_for(_qid, items.size()):
		shown.append(items[i])
	_items = shown
	_feedback.visible = false
	_placements.clear()
	for i in _items.size():
		_placements.append("")
	_selected_item_index = -1
	_solved = false
	_clear_box(items_box)
	_clear_box(buckets_box)

	_item_buttons.clear()
	for i in _items.size():
		var button := Button.new()
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var this_index := i
		button.pressed.connect(func(): _on_item_pressed(this_index))
		Narration.read_on_focus(button, Localization.t(_items[i].text_key))
		items_box.add_child(button)
		_item_buttons.append(button)

	for bucket in _buckets:
		var button := Button.new()
		button.text = Localization.t(bucket.label_key)
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var this_bucket_key: String = bucket.bucket_key
		button.pressed.connect(func(): _on_bucket_pressed(this_bucket_key))
		Narration.read_on_focus(button, button.text)
		buckets_box.add_child(button)

	_refresh_item_labels()

	visible = true
	UIFocus.focus(items_box)
	AudioManager.present(listen_text())
	while not _solved:
		await get_tree().process_frame
	AnswerOrder.answered(_qid)
	visible = false


## What the Listen control reads: the instructions, every item (in the
## order shown), the buckets, and the last check's result.
func listen_text() -> String:
	if not visible:
		return ""
	var items: Array = []
	for it in _items:
		items.append(Localization.t(it.text_key))
	var s: String = Narration.question_text(instructions_label.text, items)
	s += " " + ", ".join(_buckets.map(func(b): return Localization.t(b.label_key))) + "."
	return s + (" " + _feedback.text if _feedback.visible else "")


func _on_item_pressed(index: int) -> void:
	if _selected_item_index != -1:
		_item_buttons[_selected_item_index].modulate = DEFAULT_COLOR
	_selected_item_index = index
	_item_buttons[index].modulate = SELECTED_COLOR


func _on_bucket_pressed(bucket_key: String) -> void:
	if _selected_item_index == -1:
		return
	_placements[_selected_item_index] = bucket_key
	_item_buttons[_selected_item_index].modulate = DEFAULT_COLOR
	_selected_item_index = -1
	_refresh_item_labels()


func _refresh_item_labels() -> void:
	var all_placed := true
	for i in _items.size():
		var text := Localization.t(_items[i].text_key)
		if not String(_placements[i]).is_empty():
			text += " → %s" % _bucket_label(_placements[i])
		else:
			all_placed = false
		_item_buttons[i].text = text
	submit_button.disabled = not all_placed


func _bucket_label(bucket_key: String) -> String:
	for bucket in _buckets:
		if bucket.bucket_key == bucket_key:
			return Localization.t(bucket.label_key)
	return ""


func _on_submit_pressed() -> void:
	var all_correct := true
	for i in _items.size():
		if _placements[i] == _items[i].correct_bucket_key:
			_item_buttons[i].modulate = CORRECT_COLOR
		else:
			all_correct = false
			_item_buttons[i].modulate = WRONG_COLOR
			_placements[i] = ""

	Narration.show_feedback(_feedback, all_correct)
	if all_correct:
		_solved = true
	else:
		_refresh_item_labels()


func _clear_box(box: Container) -> void:
	for child in box.get_children():
		child.queue_free()
