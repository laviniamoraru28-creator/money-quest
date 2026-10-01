extends CanvasLayer
## ChoicePanel — shows 2-4 large, tappable options and reports back what
## the child picked. Used for two distinct purposes (see
## ChoiceOption.gd's comment on why they're kept separate):
##
##   show_choice(DialogueChoice)  — an open-ended decision, no right
##                                   answer, every option has a consequence
##   show_quiz(question, options, correct_index) — a genuine factual
##                                   check with one correct answer, never
##                                   shaming on a wrong pick (retryable)
##
## Buttons are generated at runtime from data — this scene has zero
## lesson-specific text and zero hard-coded option count.

@onready var panel: PanelContainer = $Panel
@onready var prompt_label: Label = $Panel/VBox/PromptLabel
@onready var options_box: VBoxContainer = $Panel/VBox/OptionsBox

const MIN_BUTTON_HEIGHT: float = 64.0  # comfortable one-handed touch target


func _ready() -> void:
	visible = false


func show_choice(choice: DialogueChoice) -> ChoiceOption:
	prompt_label.text = Localization.t(choice.situation_text_key)
	_clear_options()

	var result: ChoiceOption = null
	var picked := false

	for option in choice.options:
		var button := _make_option_button(Localization.t(option.label_key))
		button.pressed.connect(func():
			if picked:
				return
			picked = true
			result = option
		)
		options_box.add_child(button)

	visible = true
	while not picked:
		await get_tree().process_frame
	visible = false
	return result


func show_quiz(question_key: String, option_keys: Array[String], correct_index: int) -> bool:
	prompt_label.text = Localization.t(question_key)
	_clear_options()

	var result: Variant = null

	for i in option_keys.size():
		var button := _make_option_button(Localization.t(option_keys[i]))
		var this_index := i
		button.pressed.connect(func():
			if result != null:
				return
			result = (this_index == correct_index)
		)
		options_box.add_child(button)

	visible = true
	while result == null:
		await get_tree().process_frame
	visible = false
	return result


func _make_option_button(label_text: String) -> Button:
	var button := Button.new()
	button.text = label_text
	button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return button


func _clear_options() -> void:
	for child in options_box.get_children():
		child.queue_free()
