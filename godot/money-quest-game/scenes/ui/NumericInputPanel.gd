extends CanvasLayer
## NumericInputPanel — a +/- stepper for a single whole-number amount,
## ports the real website's "Understand Costs"/"Set Your Price" numeric
## text-field stages (src/app/[locale]/entrepreneur-quest/build/page.tsx's
## `NumericMoneyStage`) as a stepper instead of a typed number field —
## the same accessible, no-small-text-input convention this project's
## other numeric entry (`AllocatePanel`) already established, rather
## than requiring an on-screen keyboard for a number. Plain integers,
## no currency formatting — see `BusinessProfileData`'s own comment on
## why this project's business-economy numbers are never minor-unit/
## currency-formatted.

const STEP_AMOUNT: int = 1
const MIN_VALUE: int = 1

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var label: Label = $Panel/VBox/FieldLabel
@onready var help_label: Label = $Panel/VBox/HelpLabel
@onready var value_label: Label = $Panel/VBox/StepperRow/ValueLabel
@onready var minus_button: Button = $Panel/VBox/StepperRow/MinusButton
@onready var plus_button: Button = $Panel/VBox/StepperRow/PlusButton
@onready var continue_button: Button = $Panel/VBox/ContinueButton

var _value: int = 1


func _ready() -> void:
	visible = false
	minus_button.pressed.connect(func(): _adjust(-STEP_AMOUNT))
	plus_button.pressed.connect(func(): _adjust(STEP_AMOUNT))


func show_numeric_input(label_key: String, help_key: String, initial_value: int) -> int:
	label.text = Localization.t(label_key)
	help_label.visible = not help_key.is_empty()
	if help_label.visible:
		help_label.text = Localization.t(help_key)
	continue_button.text = Localization.t("common.save_and_continue_button")

	_value = max(MIN_VALUE, initial_value)
	_refresh_value_label()

	continue_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	visible = true
	UIFocus.focus(plus_button)
	await _closed
	visible = false

	return _value


func _adjust(delta: int) -> void:
	_value = max(MIN_VALUE, _value + delta)
	_refresh_value_label()


func _refresh_value_label() -> void:
	value_label.text = str(_value)
