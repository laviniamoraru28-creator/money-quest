extends CanvasLayer
## CategoryPickerPanel — a generic grid of category buttons, reused for
## 3 real Entrepreneur Quest BUILD stages that are otherwise identical
## in shape: "Choose Your Product" (12 categories + a description
## field), "Choose Your Customer" (8 categories, no description), and
## marketing-approach selection within "Create Your Marketing" (5
## categories, no description) — ports
## src/app/[locale]/entrepreneur-quest/build/page.tsx's
## ProductStage/CustomerStage/its inline marketing `CategorySelect`.

const MIN_BUTTON_HEIGHT: float = 56.0
const SELECTED_COLOR: Color = Color(0.7, 0.85, 1.0)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

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
	visible = false


## `label_key_prefix` + "." + each id is looked up for that option's
## label (e.g. "eq_build.category.product.food"). Returns
## {"category": ..., "description": ...} — "description" is always ""
## when `show_description` is false.
func show_category_picker(instructions_key: String, category_ids: Array, label_key_prefix: String, show_description: bool, description_label_key: String, description_placeholder_key: String, initial_category: String, initial_description: String) -> Dictionary:
	instructions_label.visible = not instructions_key.is_empty()
	if instructions_label.visible:
		instructions_label.text = Localization.t(instructions_key)
	continue_button.text = Localization.t("common.save_and_continue_button")
	_selected_category = initial_category
	_show_description = show_description

	description_label.visible = show_description
	description_edit.visible = show_description
	if show_description:
		description_label.text = Localization.t(description_label_key)
		description_edit.placeholder_text = Localization.t(description_placeholder_key)
		description_edit.text = initial_description
		description_edit.text_changed.connect(_refresh_continue_enabled)

	_clear_box(categories_box)
	_category_buttons.clear()
	for category_id in category_ids:
		var button := Button.new()
		button.text = Localization.t("%s.%s" % [label_key_prefix, category_id])
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var this_id: String = category_id
		button.pressed.connect(func(): _on_category_picked(this_id))
		categories_box.add_child(button)
		_category_buttons[category_id] = button
	_refresh_category_highlight()
	_refresh_continue_enabled()

	var confirmed := false
	continue_button.pressed.connect(func(): confirmed = true, CONNECT_ONE_SHOT)

	visible = true
	while not confirmed:
		await get_tree().process_frame
	visible = false

	if show_description:
		description_edit.text_changed.disconnect(_refresh_continue_enabled)

	return {"category": _selected_category, "description": description_edit.text if show_description else ""}


func _on_category_picked(category_id: String) -> void:
	_selected_category = category_id
	_refresh_category_highlight()
	_refresh_continue_enabled()


func _refresh_category_highlight() -> void:
	for category_id in _category_buttons.keys():
		_category_buttons[category_id].modulate = SELECTED_COLOR if category_id == _selected_category else DEFAULT_COLOR


func _refresh_continue_enabled() -> void:
	var description_ok := not _show_description or not description_edit.text.strip_edges().is_empty()
	continue_button.disabled = _selected_category.is_empty() or not description_ok


func _clear_box(box: VBoxContainer) -> void:
	for child in box.get_children():
		child.queue_free()
