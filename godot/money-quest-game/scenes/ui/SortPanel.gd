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


func _ready() -> void:
	visible = false
	submit_button.pressed.connect(_on_submit_pressed)


func show_sort(buckets: Array[SortBucketData], items: Array[SortItemData]) -> void:
	instructions_label.text = Localization.t("common.sort_instructions")
	submit_button.text = Localization.t("common.sort_submit_button")
	_buckets = buckets
	_items = items
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
		items_box.add_child(button)
		_item_buttons.append(button)

	for bucket in _buckets:
		var button := Button.new()
		button.text = Localization.t(bucket.label_key)
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var this_bucket_key: String = bucket.bucket_key
		button.pressed.connect(func(): _on_bucket_pressed(this_bucket_key))
		buckets_box.add_child(button)

	_refresh_item_labels()

	visible = true
	while not _solved:
		await get_tree().process_frame
	visible = false


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

	if all_correct:
		_solved = true
	else:
		_refresh_item_labels()


func _clear_box(box: Container) -> void:
	for child in box.get_children():
		child.queue_free()
