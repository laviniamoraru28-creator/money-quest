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
##
## Answers appear in a fresh random order every time a question starts
## (AnswerOrder): the correct answer is never "always first". Each button
## keeps its own option / data index, so judging never depends on where an
## answer was shown. While a question is open its order is remembered (it
## survives closing and reopening the game before answering).
##
## Read-aloud: the question and its answers are read when it appears (with
## narration on), each answer is read as the child moves onto it, and the
## Listen button (L / gamepad X) reads it all again at any time.

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
## Any checked answer in a quiz or activity panel (quizzes here; spot,
## sort and allocate through Narration.show_feedback): characters react to
## it (the NPC who asked, the player's own character). Purely visual — the
## result is always shown in words by the panel itself.
signal answer_checked(correct: bool)

var _listen: Button
var _listen_text: String = ""
## Display slot -> data index of the question on screen (tests read it).
var shown_order: Array[int] = []


func _ready() -> void:
	visible = false
	_listen = Narration.listen_button()
	_listen.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	$Panel/VBox.add_child(_listen)
	# A warm card sized by its content (never taller than the screen at any
	# text size), a large question, and big, clear answer buttons.
	panel.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	panel.offset_left = -360.0
	panel.offset_right = 360.0
	panel.offset_top = 0.0
	panel.offset_bottom = 0.0
	prompt_label.add_theme_font_size_override("font_size", 28)
	prompt_label.add_theme_color_override("font_color", UIStyle.INK)
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.custom_minimum_size = Vector2(640, 0)


func show_choice(choice: DialogueChoice) -> ChoiceOption:
	prompt_label.text = Localization.t(choice.situation_text_key)
	_clear_options()
	var keys: Array = choice.options.map(func(o): return o.label_key)
	var qid: String = AnswerOrder.question_id(choice.situation_text_key, keys)
	shown_order = AnswerOrder.order_for(qid, choice.options.size())
	var texts: Array = []

	for slot in shown_order.size():
		var option: ChoiceOption = choice.options[shown_order[slot]]
		var button := _make_option_button(Localization.t(option.label_key))
		texts.append(button.text)
		button.pressed.connect(func():
			# Only the first answer counts: the panel hides as soon as it
			# arrives, so any further press is ignored.
			if visible:
				_option_picked.emit(option)
		)
		options_box.add_child(button)

	_open(texts)
	var result: ChoiceOption = await _option_picked
	AnswerOrder.answered(qid)
	visible = false
	return result


func show_quiz(question_key: String, option_keys: Array[String], correct_index: int) -> bool:
	prompt_label.text = Localization.t(question_key)
	_clear_options()
	var qid: String = AnswerOrder.question_id(question_key, option_keys)
	shown_order = AnswerOrder.order_for(qid, option_keys.size())
	var texts: Array = []

	for slot in shown_order.size():
		# The button remembers which ORIGINAL answer it shows; correctness is
		# judged on that, never on the position on screen.
		var data_index: int = shown_order[slot]
		var button := _make_option_button(Localization.t(option_keys[data_index]))
		texts.append(button.text)
		button.pressed.connect(func():
			if visible:
				answer_checked.emit(data_index == correct_index)
				_quiz_answered.emit(data_index == correct_index)
		)
		options_box.add_child(button)

	_open(texts)
	var result: bool = await _quiz_answered
	AnswerOrder.answered(qid)
	visible = false
	return result


func _open(texts: Array) -> void:
	_listen_text = Narration.question_text(prompt_label.text, texts)
	visible = true
	UIFocus.focus(options_box)
	AudioManager.present(_listen_text)


## What the Listen control reads: the question and every answer, in the
## order they are shown.
func listen_text() -> String:
	return _listen_text if visible else ""


func _make_option_button(label_text: String) -> Button:
	var button := UIStyle.button(label_text)
	button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	Narration.read_on_focus(button, label_text)
	return button


func _clear_options() -> void:
	for child in options_box.get_children():
		child.queue_free()
