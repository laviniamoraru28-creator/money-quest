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


func show_sort(buckets: Array[SortBucketData], items: Array[SortItemData], instructions_key: String = "") -> void:
	instructions_label.text = Localization.t(instructions_key if not instructions_key.is_empty() else "common.sort_instructions")
	submit_button.text = Localization.t("common.sort_submit_button")
	_buckets = buckets
	_picture_mode = items.any(func(it): return not it.icon_tokens.is_empty())
	if _picture_mode:
		await _show_picture_sort(items)
		return
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


# --- picture sort (items and buckets with pictures) -----------------------------------
# The same tap-an-item-then-tap-where-it-goes game, as pictures: the items
# are picture buttons, the buckets two large pictured areas that collect
# what is placed in them. Each placement is answered at once: a right one
# stays in its area with a ✓ (a shape, not only a colour); a wrong one
# comes back with a "try again" sign — never a hard fail. Words are an
# extra layer (hidden with words off); Listen reads everything.

var _picture_mode: bool = false
var _bucket_buttons: Dictionary = {}   # bucket_key -> Button
var _placed_strips: Dictionary = {}    # bucket_key -> MissionStrip
var _placed_tokens: Dictionary = {}    # bucket_key -> Array


func _show_picture_sort(items: Array[SortItemData]) -> void:
	var words: bool = SupportProfile.show_text()
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
	_bucket_buttons.clear()
	_placed_strips.clear()
	_placed_tokens.clear()
	instructions_label.visible = words
	submit_button.visible = false
	# The items: a grid of picture buttons.
	var grid := GridContainer.new()
	grid.name = "PictureItems"
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	items_box.add_child(grid)
	for i in _items.size():
		var label: String = Localization.t(_items[i].text_key)
		var b := PictureChoice.make(label, Array(_items[i].icon_tokens), 52.0, 20)
		b.name = "Item_%s" % _items[i].item_id
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var this_index := i
		b.pressed.connect(func(): _on_picture_item_pressed(this_index))
		grid.add_child(b)
		_item_buttons.append(b)
	# The buckets: two large pictured areas, each collecting what is placed.
	buckets_box.add_theme_constant_override("separation", 16)
	for bucket in _buckets:
		var bb := UIStyle.button("", false)
		bb.name = "Bucket_%s" % bucket.bucket_key
		bb.custom_minimum_size = Vector2(260, 168)
		bb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		PictureChoice.focus_ring(bb)
		var col := VBoxContainer.new()
		col.mouse_filter = Control.MOUSE_FILTER_IGNORE
		col.alignment = BoxContainer.ALIGNMENT_CENTER
		col.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		col.add_theme_constant_override("separation", 4)
		bb.add_child(col)
		var pic := MissionStrip.new(64.0)
		pic.alignment = BoxContainer.ALIGNMENT_CENTER
		pic.show_tokens(Array(bucket.icon_tokens))
		col.add_child(pic)
		var name_label := UIStyle.label(Localization.t(bucket.label_key), 22)
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_label.visible = words
		col.add_child(name_label)
		var placed := MissionStrip.new(34.0)
		placed.name = "Placed"
		placed.alignment = BoxContainer.ALIGNMENT_CENTER
		col.add_child(placed)
		var key: String = bucket.bucket_key
		bb.pressed.connect(func(): _on_picture_bucket_pressed(key))
		Narration.read_on_focus(bb, Localization.t(bucket.label_key))
		buckets_box.add_child(bb)
		_bucket_buttons[key] = bb
		_placed_strips[key] = placed
		_placed_tokens[key] = []
	# ← / → go straight between the areas (never up into the pictures).
	var areas: Array = _bucket_buttons.values()
	for k in areas.size():
		var a: Button = areas[k]
		a.focus_neighbor_right = a.get_path_to(areas[(k + 1) % areas.size()])
		a.focus_neighbor_left = a.get_path_to(areas[(k - 1 + areas.size()) % areas.size()])
	visible = true
	UIFocus.focus(_item_buttons[0] if not _item_buttons.is_empty() else submit_button)
	AudioManager.present(listen_text())
	_fit_to_content()
	while not _solved:
		await get_tree().process_frame
	AnswerOrder.answered(_qid)
	await get_tree().create_timer(0.9).timeout
	visible = false
	submit_button.visible = true
	instructions_label.visible = true
	panel.offset_top = -340.0
	panel.offset_bottom = 340.0
	buckets_box.remove_theme_constant_override("separation")


func _on_picture_item_pressed(index: int) -> void:
	if not String(_placements[index]).is_empty():
		return
	if _selected_item_index != -1:
		_mark_selected(_item_buttons[_selected_item_index], false)
	_selected_item_index = index
	_mark_selected(_item_buttons[index], true)
	AudioManager.play_sfx("ui_move", 1.0, -6.0)
	# Keyboard / gamepad: straight on to the areas.
	if UIFocus.visible_focus(get_viewport()) != null and not _bucket_buttons.is_empty():
		UIFocus.focus(_bucket_buttons.values()[0])


func _on_picture_bucket_pressed(bucket_key: String) -> void:
	if _selected_item_index == -1:
		return
	var i: int = _selected_item_index
	var b: Button = _item_buttons[i]
	_mark_selected(b, false)
	_selected_item_index = -1
	if bucket_key == _items[i].correct_bucket_key:
		# Right: it stays in its area, with a ✓.
		_placements[i] = bucket_key
		PictureChoice.set_picked(b, true)
		b.disabled = true
		_placed_tokens[bucket_key].append_array(Array(_items[i].icon_tokens).slice(0, 1))
		(_placed_strips[bucket_key] as MissionStrip).show_tokens(_placed_tokens[bucket_key])
		AudioManager.play_sfx("coin", 1.0, -6.0)
		if _placements.all(func(p): return not String(p).is_empty()):
			Narration.show_feedback(_feedback, true)
			_feedback.visible = SupportProfile.show_text()
			_solved = true
			return
	else:
		# Not there: it comes back, with a "try again" sign for a moment.
		_try_again_sign(b)
		AudioManager.play_sfx("retry", 1.0, -6.0)
		Narration.show_feedback(_feedback, false)
		_feedback.visible = SupportProfile.show_text()
	# Keyboard / gamepad: on to the next item still to place.
	for j in _item_buttons.size():
		if String(_placements[j]).is_empty():
			UIFocus.focus(_item_buttons[j])
			break


## A picture sort is as tall as what it shows (no empty space below);
## UIScale keeps it on screen and centred.
func _fit_to_content() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	var h: float = maxf(panel.get_combined_minimum_size().y, 240.0)
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5


## The chosen item: a thick gold frame (thickness, not only colour).
func _mark_selected(b: Button, on: bool) -> void:
	var old: Node = b.get_node_or_null("SelectedFrame")
	if old:
		old.queue_free()
		b.remove_child(old)
	if not on:
		return
	var frame := Panel.new()
	frame.name = "SelectedFrame"
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	var sb := StyleBoxFlat.new()
	sb.draw_center = false
	sb.set_corner_radius_all(14)
	sb.border_color = UIStyle.GOLD
	sb.set_border_width_all(8)
	frame.add_theme_stylebox_override("panel", sb)
	b.add_child(frame)


func _try_again_sign(b: Button) -> void:
	var sign := MissionStrip.Glyph.new("retry", 40.0)
	sign.name = "TryAgain"
	sign.mouse_filter = Control.MOUSE_FILTER_IGNORE
	sign.set_anchors_preset(Control.PRESET_TOP_LEFT)
	sign.position = Vector2(6, 6)
	b.add_child(sign)
	await get_tree().create_timer(1.2).timeout
	if is_instance_valid(sign):
		sign.queue_free()
