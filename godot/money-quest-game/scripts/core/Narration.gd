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
	# A speaker picture, so "listen" is clear without reading.
	b.icon = speaker_icon()
	b.expand_icon = false
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
		# Words off: the speaker picture and the control ("L" / "X") only.
		b.text = InputHints.prompt(Localization.t("narration.listen"), "listen") if SupportProfile.show_text() else InputHints.glyph("listen")


static var _speaker: Texture2D


## A 28 px speaker with two sound waves, drawn once.
static func speaker_icon() -> Texture2D:
	if _speaker:
		return _speaker
	var n: int = 28
	var img := Image.create(n, n, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var ink := Color("1C2624")
	for y in n:
		for x in n:
			var fx: float = x + 0.5
			var fy: float = y + 0.5
			var c: float = n * 0.5
			var on: bool = false
			# body: a small box, then the cone widening to the right
			if fx >= 3.0 and fx <= 8.0 and absf(fy - c) <= 3.5:
				on = true
			if fx > 8.0 and fx <= 14.0 and absf(fy - c) <= 3.5 + (fx - 8.0) * 1.1:
				on = true
			# two waves
			var d: float = Vector2(fx - 13.0, fy - c).length()
			if fx > 15.5 and ((d > 5.5 and d < 7.5) or (d > 10.0 and d < 12.0)) and absf(fy - c) < d * 0.75:
				on = true
			if on:
				img.set_pixel(x, y, ink)
	_speaker = ImageTexture.create_from_image(img)
	return _speaker


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
	ChoicePanel.answer_checked.emit(all_correct)
