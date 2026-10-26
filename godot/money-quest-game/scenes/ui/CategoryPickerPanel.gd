extends CanvasLayer
## CategoryPickerPanel — a generic grid of category buttons, reused for
## 3 real Entrepreneur Quest BUILD stages that are otherwise identical
## in shape: "Choose Your Product" (12 categories + a description
## field), "Choose Your Customer" (8 categories, no description), and
## marketing-approach selection within "Create Your Marketing" (5
## categories, no description) — ports
## src/app/[locale]/entrepreneur-quest/build/page.tsx's
## ProductStage/CustomerStage/its inline marketing `CategorySelect`.
##
## Choices can be pictures (`icons`: id → MissionStrip tokens), laid out
## as a grid of big picture buttons; the picked one gets a ✓ badge (a
## shape, not only a colour). The product description is optional: a
## child who does not type still finishes the stage with one tap.

const MIN_BUTTON_HEIGHT: float = 56.0
const SELECTED_COLOR: Color = Color(0.7, 0.85, 1.0)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var instructions_label: Label = $Panel/VBox/InstructionsLabel
@onready var categories_box: VBoxContainer = $Panel/VBox/CategoriesBox
@onready var description_label: Label = $Panel/VBox/DescriptionLabel
@onready var description_edit: TextEdit = $Panel/VBox/DescriptionEdit
@onready var continue_button: Button = $Panel/VBox/ContinueButton

var _selected_category: String = ""
var _category_buttons: Dictionary = {}
var _show_description: bool = false


func _ready() -> void:
	panel.add_theme_stylebox_override("panel", UIStyle.dark_panel())
	visible = false


## `label_key_prefix` + "." + each id is looked up for that option's
## label (e.g. "eq_build.category.product.food"). Returns
## {"category": ..., "description": ...} — "description" is always ""
## when `show_description` is false. `icons` (optional): id → picture
## tokens; with them the choices are a grid of picture buttons.
func show_category_picker(instructions_key: String, category_ids: Array, label_key_prefix: String, show_description: bool, description_label_key: String, description_placeholder_key: String, initial_category: String, initial_description: String, icons: Dictionary = {}) -> Dictionary:
	var words: bool = SupportProfile.show_text()
	instructions_label.visible = not instructions_key.is_empty() and words
	if instructions_label.visible:
		instructions_label.text = Localization.t(instructions_key)
	continue_button.text = Localization.t("common.save_and_continue_button")
	PictureChoice.action_symbol(continue_button, "next")
	_selected_category = initial_category
	_show_description = show_description

	# The description is optional (typing is never required); with words
	# off it steps aside.
	description_label.visible = show_description and words
	description_edit.visible = show_description and words
	if show_description:
		description_label.text = Localization.t(description_label_key)
		description_edit.placeholder_text = Localization.t(description_placeholder_key)
		description_edit.text = initial_description
		description_edit.custom_minimum_size.y = 72.0 if not icons.is_empty() else 140.0

	_clear_box(categories_box)
	_category_buttons.clear()
	var holder: Container = categories_box
	if not icons.is_empty():
		var grid := GridContainer.new()
		grid.name = "PictureGrid"
		grid.columns = 3 if category_ids.size() > 6 else 2
		grid.add_theme_constant_override("h_separation", 10)
		grid.add_theme_constant_override("v_separation", 10)
		categories_box.add_child(grid)
		holder = grid
	for category_id in category_ids:
		var label: String = Localization.t("%s.%s" % [label_key_prefix, category_id])
		var button: Button
		if icons.is_empty():
			button = Button.new()
			button.text = label
			button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
			button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			button.set_meta("words", label)
		else:
			button = PictureChoice.make(label, icons.get(category_id, []), 44.0, 20)
			button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var this_id: String = category_id
		button.pressed.connect(func(): _on_category_picked(this_id))
		holder.add_child(button)
		_category_buttons[category_id] = button
	_refresh_category_highlight()
	_refresh_continue_enabled()
	# Arrows / D-pad go from the last row of choices straight to Continue
	# (the optional description box keeps the arrows for its cursor; Tab,
	# a click or a tap still reach it).
	var ids: Array = _category_buttons.keys()
	var cols: int = (holder as GridContainer).columns if holder is GridContainer else 1
	var last_row: int = maxi(ids.size() - cols, 0)
	for i in ids.size():
		if i >= last_row:
			var cb: Button = _category_buttons[ids[i]]
			cb.focus_neighbor_bottom = cb.get_path_to(continue_button)
	continue_button.focus_neighbor_top = continue_button.get_path_to(_category_buttons[ids[last_row]]) if not ids.is_empty() else NodePath("")

	continue_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	UIFocus.focus(categories_box)
	_fit()
	await _closed
	visible = false

	return {"category": _selected_category, "description": description_edit.text if show_description else ""}


## What Listen reads: the question and the choices.
func listen_text() -> String:
	if not visible:
		return ""
	var parts: PackedStringArray = [instructions_label.text if instructions_label.visible else ""]
	var i: int = 0
	for id in _category_buttons.keys():
		i += 1
		parts.append(Localization.t("narration.option", {"n": i, "text": PictureChoice.words_of(_category_buttons[id])}))
	return " ".join(parts).strip_edges()


func _on_category_picked(category_id: String) -> void:
	_selected_category = category_id
	_refresh_category_highlight()
	_refresh_continue_enabled()


## The picked choice: a ✓ (a shape, not only the tint).
func _refresh_category_highlight() -> void:
	for category_id in _category_buttons.keys():
		var b: Button = _category_buttons[category_id]
		var picked: bool = category_id == _selected_category
		if b.has_node("PickedTick"):
			PictureChoice.set_picked(b, picked)
		else:
			b.modulate = SELECTED_COLOR if picked else DEFAULT_COLOR
			b.text = ("✓ " if picked else "") + String(b.get_meta("words", b.text))


func _refresh_continue_enabled() -> void:
	continue_button.disabled = _selected_category.is_empty()


## Sized to its content, kept on screen at every interface size.
func _fit() -> void:
	panel.offset_top = -320.0
	panel.offset_bottom = 320.0
	await get_tree().process_frame
	await get_tree().process_frame
	var room: float = panel.get_viewport_rect().size.y - 24.0
	var h: float = minf(maxf(panel.get_combined_minimum_size().y, 240.0), room)
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5


func _clear_box(box: Container) -> void:
	for child in box.get_children():
		child.queue_free()
