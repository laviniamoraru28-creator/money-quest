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


func _ready() -> void:
	visible = false
	single_line_edit.text_changed.connect(func(_t): _refresh_continue_enabled())
	multi_line_edit.text_changed.connect(_on_multi_line_text_changed)


## Shows the field pre-filled with `initial_value` and waits for Save &
## Continue; returns the entered text. `hint_key` left empty hides the
## safety-hint line entirely (only "Name Your Business" uses it).
func show_text_input(prompt_key: String, placeholder_key: String, initial_value: String, multiline: bool, max_length: int, hint_key: String = "") -> String:
	prompt_label.text = Localization.t(prompt_key)
	hint_label.visible = not hint_key.is_empty()
	if hint_label.visible:
		hint_label.text = Localization.t(hint_key)
	continue_button.text = Localization.t("common.save_and_continue_button")

	_multiline = multiline
	_max_length = max_length
	single_line_edit.visible = not multiline
	multi_line_edit.visible = multiline

	if multiline:
		multi_line_edit.text = initial_value
		multi_line_edit.placeholder_text = Localization.t(placeholder_key)
	else:
		single_line_edit.text = initial_value
		single_line_edit.placeholder_text = Localization.t(placeholder_key)
		single_line_edit.max_length = max_length

	_refresh_continue_enabled()

	continue_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	UIFocus.focus(multi_line_edit if multiline else single_line_edit)
	await _closed
	visible = false

	return multi_line_edit.text if multiline else single_line_edit.text


func _on_multi_line_text_changed() -> void:
	if multi_line_edit.text.length() > _max_length:
		multi_line_edit.text = multi_line_edit.text.substr(0, _max_length)
	_refresh_continue_enabled()


func _refresh_continue_enabled() -> void:
	var text := multi_line_edit.text if _multiline else single_line_edit.text
	continue_button.disabled = text.strip_edges().is_empty()
