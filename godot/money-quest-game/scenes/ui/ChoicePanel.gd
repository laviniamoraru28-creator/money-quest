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

## Option button pressed -> the waiting show_choice()/show_quiz() resumes
## with the answer. (A signal, not a local flag: a GDScript 4 lambda only
## changes its own copy of a captured local, so a flag set inside the
## button callback never reached the waiting loop and the panel stayed open.)
signal _option_picked(option: ChoiceOption)
signal _quiz_answered(correct: bool)


func _ready() -> void:
	visible = false


func show_choice(choice: DialogueChoice) -> ChoiceOption:
	prompt_label.text = Localization.t(choice.situation_text_key)
	_clear_options()

	for option in choice.options:
		var button := _make_option_button(Localization.t(option.label_key))
		button.pressed.connect(func():
			# Only the first answer counts: the panel hides as soon as it
			# arrives, so any further press is ignored.
			if visible:
				_option_picked.emit(option)
		)
		options_box.add_child(button)

	visible = true
	var result: ChoiceOption = await _option_picked
	visible = false
	return result


func show_quiz(question_key: String, option_keys: Array[String], correct_index: int) -> bool:
	prompt_label.text = Localization.t(question_key)
	_clear_options()

	for i in option_keys.size():
		var button := _make_option_button(Localization.t(option_keys[i]))
		var this_index := i
		button.pressed.connect(func():
			if visible:
				_quiz_answered.emit(this_index == correct_index)
		)
		options_box.add_child(button)

	visible = true
	var result: bool = await _quiz_answered
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
