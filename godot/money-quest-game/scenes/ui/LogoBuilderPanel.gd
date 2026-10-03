extends CanvasLayer
## LogoBuilderPanel — the "Create Your Logo" BUILD stage: pick a shape,
## a color, and a symbol from the real website's own small curated sets
## (`EQ_LOGO_SHAPE_IDS`/`EQ_LOGO_COLOR_IDS`/`EQ_LOGO_SYMBOL_OPTIONS`),
## write an optional slogan, see a live preview — ports
## src/app/[locale]/entrepreneur-quest/build/page.tsx's `LogoStage`. The
## preview is a plain procedural shape (see LogoPreviewDraw.gd), never
## an image file; the 4 color swatches use this project's own real
## design-token hex values (tailwind.config.ts), not invented colors.

const SHAPE_IDS: Array[String] = ["circle", "square", "hexagon", "star"]
const COLOR_IDS: Array[String] = ["teal", "coral", "gold", "soft-blue"]
const SYMBOL_OPTIONS: Array[String] = ["🚀", "🌟", "🎨", "🍪", "🛠️", "🌱", "🐝", "📚"]

const COLOR_BY_KEY: Dictionary = {
	"teal": Color(0.059, 0.478, 0.420, 1),
	"coral": Color(0.941, 0.471, 0.353, 1),
	"gold": Color(0.910, 0.639, 0.239, 1),
	"soft-blue": Color(0.498, 0.702, 0.800, 1),
}

const MIN_BUTTON_HEIGHT: float = 56.0
const SELECTED_COLOR: Color = Color(0.7, 0.85, 1.0)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

@onready var panel: PanelContainer = $Panel
@onready var preview: LogoPreviewDraw = $Panel/VBox/PreviewRow/Preview
@onready var preview_symbol_label: Label = $Panel/VBox/PreviewRow/Preview/SymbolLabel
@onready var shape_label: Label = $Panel/VBox/ShapeLabel
@onready var shape_box: HBoxContainer = $Panel/VBox/ShapeBox
@onready var color_label: Label = $Panel/VBox/ColorLabel
@onready var color_box: HBoxContainer = $Panel/VBox/ColorBox
@onready var symbol_label: Label = $Panel/VBox/SymbolLabel
@onready var symbol_box: HBoxContainer = $Panel/VBox/SymbolBox
@onready var slogan_label: Label = $Panel/VBox/SloganLabel
@onready var slogan_edit: LineEdit = $Panel/VBox/SloganEdit
@onready var continue_button: Button = $Panel/VBox/ContinueButton

var _logo: BusinessLogoData
var _shape_buttons: Dictionary = {}
var _color_buttons: Dictionary = {}
var _symbol_buttons: Dictionary = {}


func _ready() -> void:
	visible = false


func show_logo_builder(logo: BusinessLogoData, initial_slogan: String) -> String:
	_logo = logo
	shape_label.text = Localization.t("eq_stage.create_your_logo.shape_label")
	color_label.text = Localization.t("eq_stage.create_your_logo.color_label")
	symbol_label.text = Localization.t("eq_stage.create_your_logo.symbol_label")
	slogan_label.text = Localization.t("eq_stage.create_your_logo.slogan_label")
	slogan_edit.placeholder_text = Localization.t("eq_stage.create_your_logo.slogan_placeholder")
	slogan_edit.max_length = 60
	slogan_edit.text = initial_slogan
	continue_button.text = Localization.t("common.save_and_continue_button")

	_build_shape_buttons()
	_build_color_buttons()
	_build_symbol_buttons()
	_refresh_preview()

	var confirmed := false
	continue_button.pressed.connect(func(): confirmed = true, CONNECT_ONE_SHOT)

	visible = true
	while not confirmed:
		await get_tree().process_frame
	visible = false

	return slogan_edit.text


func _build_shape_buttons() -> void:
	_clear_box(shape_box)
	_shape_buttons.clear()
	for shape_id in SHAPE_IDS:
		var button := _make_option_button(Localization.t("eq_build.logo_shape.%s" % shape_id))
		button.pressed.connect(func(): _on_shape_picked(shape_id))
		shape_box.add_child(button)
		_shape_buttons[shape_id] = button
	_refresh_shape_highlight()


func _build_color_buttons() -> void:
	_clear_box(color_box)
	_color_buttons.clear()
	for color_id in COLOR_IDS:
		var button := Button.new()
		button.custom_minimum_size = Vector2(MIN_BUTTON_HEIGHT, MIN_BUTTON_HEIGHT)
		button.modulate = COLOR_BY_KEY.get(color_id, Color.WHITE)
		button.pressed.connect(func(): _on_color_picked(color_id))
		color_box.add_child(button)
		_color_buttons[color_id] = button
	_refresh_color_highlight()


func _build_symbol_buttons() -> void:
	_clear_box(symbol_box)
	_symbol_buttons.clear()
	for symbol in SYMBOL_OPTIONS:
		var button := Button.new()
		button.text = symbol
		button.custom_minimum_size = Vector2(MIN_BUTTON_HEIGHT, MIN_BUTTON_HEIGHT)
		button.pressed.connect(func(): _on_symbol_picked(symbol))
		symbol_box.add_child(button)
		_symbol_buttons[symbol] = button
	_refresh_symbol_highlight()


func _on_shape_picked(shape_id: String) -> void:
	_logo.shape = shape_id
	_refresh_shape_highlight()
	_refresh_preview()


func _on_color_picked(color_id: String) -> void:
	_logo.color_key = color_id
	_refresh_color_highlight()
	_refresh_preview()


func _on_symbol_picked(symbol: String) -> void:
	_logo.symbol = symbol
	_refresh_symbol_highlight()
	_refresh_preview()


func _refresh_shape_highlight() -> void:
	for shape_id in _shape_buttons.keys():
		_shape_buttons[shape_id].modulate = SELECTED_COLOR if shape_id == _logo.shape else DEFAULT_COLOR


func _refresh_color_highlight() -> void:
	for color_id in _color_buttons.keys():
		var button: Button = _color_buttons[color_id]
		button.text = "✓" if color_id == _logo.color_key else ""


func _refresh_symbol_highlight() -> void:
	for symbol in _symbol_buttons.keys():
		_symbol_buttons[symbol].modulate = SELECTED_COLOR if symbol == _logo.symbol else DEFAULT_COLOR


func _refresh_preview() -> void:
	preview.refresh(_logo.shape, COLOR_BY_KEY.get(_logo.color_key, Color.WHITE))
	preview_symbol_label.text = _logo.symbol


func _make_option_button(label_text: String) -> Button:
	var button := Button.new()
	button.text = label_text
	button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
	return button


func _clear_box(box: HBoxContainer) -> void:
	for child in box.get_children():
		child.queue_free()
