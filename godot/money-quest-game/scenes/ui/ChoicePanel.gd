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
	_set_prompt_icons(choice.situation_icons)
	_clear_options()
	var keys: Array = choice.options.map(func(o): return o.label_key)
	var qid: String = AnswerOrder.question_id(choice.situation_text_key, keys)
	shown_order = AnswerOrder.order_for(qid, choice.options.size())
	var texts: Array = []

	for slot in shown_order.size():
		var option: ChoiceOption = choice.options[shown_order[slot]]
		var label: String = Localization.t(option.label_key)
		var button := _make_option_button(label, option.icon)
		texts.append(label)
		button.pressed.connect(func():
			# Only the first answer counts: the panel hides as soon as it
			# arrives, so any further press is ignored.
			if visible and not _picking:
				var question: int = _question
				await _show_picked(button)
				if question == _question:   # still the same question on screen
					_option_picked.emit(option)
		)
		options_box.add_child(button)

	_open(texts)
	var result: ChoiceOption = await _option_picked
	AnswerOrder.answered(qid)
	visible = false
	return result


## `option_texts` (optional): what each answer shows, when it needs live
## values (a price); the keys still identify the question for AnswerOrder.
## `option_icons` / `question_icons` (optional, visual-first): a picture
## per answer and pictures above the question (see show_choice).
func show_quiz(question_key: String, option_keys: Array[String], correct_index: int, option_texts: Array[String] = [], option_icons: Array = [], question_icons: Array = []) -> bool:
	prompt_label.text = Localization.t(question_key)
	_set_prompt_icons(question_icons)
	_clear_options()
	var qid: String = AnswerOrder.question_id(question_key, option_keys)
	shown_order = AnswerOrder.order_for(qid, option_keys.size())
	var texts: Array = []

	for slot in shown_order.size():
		# The button remembers which ORIGINAL answer it shows; correctness is
		# judged on that, never on the position on screen.
		var data_index: int = shown_order[slot]
		var label: String = option_texts[data_index] if data_index < option_texts.size() else Localization.t(option_keys[data_index])
		var icon: String = String(option_icons[data_index]) if data_index < option_icons.size() else ""
		var button := _make_option_button(label, icon)
		texts.append(label)
		button.pressed.connect(func():
			if visible and not _picking:
				var question: int = _question
				await _show_picked(button)
				if question == _question:
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


## One answer button. With a picture (visual-first) the picture sits at the
## left inside the button and the words beside it; with words off the
## picture alone fills the button — the meaning never depends on reading.
## Focus (keyboard / gamepad) and hover get a thick gold ring, so "where am
## I" is always visible. The button's own text stays the answer's words
## (read aloud on focus, and what tests and narration use).
func _make_option_button(label_text: String, icon: String = "") -> Button:
	var button := UIStyle.button(label_text)
	button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_style_focus(button)
	if not icon.is_empty():
		var words: bool = SupportProfile.show_text()
		var px: float = 72.0 if words else 96.0
		button.custom_minimum_size.y = px + 20.0
		var pic: Control = MissionStrip.make_token(icon, {}, px)
		pic.name = "OptionPicture"
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(pic)
		if words:
			pic.set_anchors_preset(Control.PRESET_CENTER_LEFT)
			pic.offset_left = 14.0
			pic.offset_right = 14.0 + px
			pic.offset_top = -px * 0.5
			pic.offset_bottom = px * 0.5
			for state in ["normal", "hover", "pressed", "disabled", "focus"]:
				var sb: StyleBox = button.get_theme_stylebox(state)
				if sb:
					var sb2: StyleBox = sb.duplicate()
					sb2.content_margin_left = px + 30.0
					button.add_theme_stylebox_override(state, sb2)
			button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		else:
			pic.set_anchors_preset(Control.PRESET_CENTER)
			pic.offset_left = -px * 0.5
			pic.offset_right = px * 0.5
			pic.offset_top = -px * 0.5
			pic.offset_bottom = px * 0.5
			button.set_meta("words", label_text)
			button.text = ""
			button.tooltip_text = label_text
	Narration.read_on_focus(button, label_text)
	return button


## A clear "you are here" ring for keyboard / gamepad focus and mouse hover.
func _style_focus(button: Button) -> void:
	var ring := StyleBoxFlat.new()
	ring.draw_center = false
	ring.set_corner_radius_all(16)
	ring.border_color = UIStyle.GOLD
	ring.set_border_width_all(6)
	ring.expand_margin_left = 4
	ring.expand_margin_right = 4
	ring.expand_margin_top = 4
	ring.expand_margin_bottom = 4
	button.add_theme_stylebox_override("focus", ring)
	var hover: StyleBox = button.get_theme_stylebox("hover")
	if hover is StyleBoxFlat:
		var h: StyleBoxFlat = (hover as StyleBoxFlat).duplicate()
		h.border_color = UIStyle.GOLD
		h.set_border_width_all(4)
		button.add_theme_stylebox_override("hover", h)


## The chosen answer lights up (gold, with a tick) for a moment before the
## panel closes — the child sees which one they picked. Shorter, and
## without the pop, with Reduced Motion.
var _picking: bool = false

func _show_picked(button: Button) -> void:
	_picking = true
	var question: int = _question
	var sb := StyleBoxFlat.new()
	sb.bg_color = UIStyle.GOLD
	sb.set_corner_radius_all(14)
	sb.border_color = UIStyle.TEAL_DARK
	sb.set_border_width_all(4)
	var old: StyleBox = button.get_theme_stylebox("normal")
	if old:
		sb.content_margin_left = old.content_margin_left
		sb.content_margin_right = old.content_margin_right
	for state in ["normal", "hover", "pressed", "focus"]:
		button.add_theme_stylebox_override(state, sb)
	var tick := MoneyIcons.Tick.new(36.0)
	tick.name = "PickedTick"
	tick.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	tick.offset_left = -50.0
	tick.offset_right = -14.0
	tick.offset_top = -18.0
	tick.offset_bottom = 18.0
	button.add_child(tick)
	AudioManager.play_sfx("ui_click", 1.0, -6.0)
	await get_tree().create_timer(0.12 if Settings.reduced_motion else 0.28).timeout
	if question == _question:
		_picking = false


## Pictures above the question (what it is about). With words off and
## pictures present, the question's words step aside.
var _prompt_strip: MissionStrip

func _set_prompt_icons(icons: Array) -> void:
	if _prompt_strip == null:
		_prompt_strip = MissionStrip.new(84.0)
		_prompt_strip.name = "PromptPictures"
		_prompt_strip.alignment = BoxContainer.ALIGNMENT_CENTER
		$Panel/VBox.add_child(_prompt_strip)
		$Panel/VBox.move_child(_prompt_strip, prompt_label.get_index())
	_prompt_strip.show_tokens(icons, {})
	_prompt_strip.visible = not icons.is_empty()
	prompt_label.visible = SupportProfile.show_text() or icons.is_empty()


## Counts questions shown: a pick still lighting up when a new question
## opens is dropped instead of answering the new one.
var _question: int = 0

func _clear_options() -> void:
	_question += 1
	_picking = false
	for child in options_box.get_children():
		child.queue_free()
