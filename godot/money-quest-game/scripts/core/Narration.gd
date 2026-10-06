class_name Narration
extends RefCounted
## Narration — small helpers so every question panel offers read-aloud the
## same way, on top of AudioManager's one narration system:
## - listen_button(): an obvious "Listen" button (with its control: L on a
##   keyboard, X on a gamepad) that reads the whole question and its answers
##   again — clickable and tappable, so it works on every device;
## - read_on_focus(): an answer is read when the child moves onto it with
##   the keyboard / gamepad, or rests the pointer on it (only while
##   automatic narration is on);
## - question_text(): "Question. 1: first answer. 2: second answer." in the
##   order the answers are actually shown.
## Tiny labels are never read automatically — only questions, answers,
## instructions and feedback.


static func listen_button() -> Button:
	var b := UIStyle.button(InputHints.prompt(Localization.t("narration.listen"), "listen"), false)
	b.name = "ListenButton"
	b.custom_minimum_size = Vector2(0, 52)
	b.add_theme_font_size_override("font_size", 20)
	b.pressed.connect(AudioManager.replay)
	b.visible = AudioManager.can_narrate()
	# One connection per button, held only while it is in the tree (a
	# shared bound static callable could be connected just once).
	var relabel := func(d: String) -> void:
		_relabel(d, b)
	b.tree_entered.connect(func() -> void:
		if not InputHints.device_changed.is_connected(relabel):
			InputHints.device_changed.connect(relabel)
		_relabel(InputHints.device, b))
	b.tree_exiting.connect(func() -> void:
		if InputHints.device_changed.is_connected(relabel):
			InputHints.device_changed.disconnect(relabel))
	return b


static func _relabel(_device: String, b: Button) -> void:
	if is_instance_valid(b):
		b.text = InputHints.prompt(Localization.t("narration.listen"), "listen")


## Reads `control`'s text when it gets keyboard/gamepad focus or the
## pointer rests on it.
static func read_on_focus(control: Control, text: String) -> void:
	control.set_meta("mq_read", true)
	control.focus_entered.connect(func(): AudioManager.read_focused(text))
	control.mouse_entered.connect(func(): AudioManager.read_focused(text))


static func question_text(prompt: String, answers: Array) -> String:
	var parts: PackedStringArray = [prompt]
	for i in answers.size():
		parts.append(Localization.t("narration.option", {"n": i + 1, "text": answers[i]}))
	return " ".join(parts)


## A short result line under a mini-game's answers ("All correct!" /
## "Not quite yet…"), so feedback is words as well as colours — read
## aloud with narration on. Hidden until the first check.
static func feedback_label() -> Label:
	var l := UIStyle.label("", 22, UIStyle.TEAL_DARK)
	l.name = "FeedbackLabel"
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.visible = false
	return l


static func show_feedback(label: Label, all_correct: bool) -> void:
	label.text = Localization.t("common.check_all_correct" if all_correct else "common.check_try_again")
	label.visible = true
	AudioManager.play_sfx("success" if all_correct else "retry", 1.0, -6.0)
	AudioManager.narrate(label.text)
