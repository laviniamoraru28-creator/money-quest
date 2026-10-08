class_name WhatIfCard
extends CanvasLayer
## WhatIfCard — the picture comparison behind WhatIf.compare():
##
##   [your face]          compare          [? face]
##   [your choice]                         [other choice]
##        ↓                                     ↓
##   [result rows]   (rows that differ are     [result rows]
##                    marked on both sides)
##   [↻ Try again]   [→ Try that way]   [✓ Done]
##
## Pictures first; words ("Compare", "Try again") only when words are on.
## Keyboard / gamepad focus starts on Try again; mouse and touch press the
## buttons; Escape / B is Done. Reduced Motion: no pop.

signal answered(answer: String)

var a: Dictionary = {}
var b: Dictionary = {}
var allow_other: bool = true
var again_button: Button
var other_button: Button
var done_button: Button
var _done: bool = false
var _return_focus: Control


func _ready() -> void:
	layer = 12
	name = "WhatIfCard"
	add_to_group("mq_whatif_card")
	_return_focus = get_viewport().gui_get_focus_owner()
	var words: bool = SupportProfile.show_text()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.35)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var card := PanelContainer.new()
	card.name = "Card"
	card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	center.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	card.add_child(v)
	var head := HBoxContainer.new()
	head.alignment = BoxContainer.ALIGNMENT_CENTER
	head.add_theme_constant_override("separation", 10)
	head.add_child(MissionStrip.Glyph.new("compare", 56.0))
	if words:
		var t := UIStyle.label(Localization.t("whatif.title"), UIStyle.TITLE, UIStyle.TEAL_DARK)
		t.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		head.add_child(t)
	v.add_child(head)
	var cols := HBoxContainer.new()
	cols.alignment = BoxContainer.ALIGNMENT_CENTER
	cols.add_theme_constant_override("separation", 18)
	v.add_child(cols)
	var diff: Array = WhatIf.differences(a, b)
	cols.add_child(_column(a, true, diff))
	var sep := VSeparator.new()
	cols.add_child(sep)
	cols.add_child(_column(b, false, diff))
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 14)
	v.add_child(row)
	again_button = Feedback.try_again_button(true)
	again_button.pressed.connect(_answer.bind("again"))
	row.add_child(again_button)
	if allow_other:
		other_button = _icon_button("whatif.try_other", ["question", "then", "clock"])
		other_button.name = "TryOtherButton"
		other_button.pressed.connect(_answer.bind("other"))
		row.add_child(other_button)
	done_button = _icon_button("whatif.done", ["tick"])
	done_button.name = "DoneButton"
	done_button.pressed.connect(_answer.bind("done"))
	row.add_child(done_button)
	AudioManager.play_sfx("ui_open", 1.0, -4.0)
	if not Settings.reduced_motion:
		card.pivot_offset = card.size * 0.5
		card.modulate.a = 0.0
		card.create_tween().tween_property(card, "modulate:a", 1.0, 0.2)
	UIFocus.focus(again_button)


func _column(o: Dictionary, mine: bool, diff: Array) -> VBoxContainer:
	var col := VBoxContainer.new()
	col.name = "Mine" if mine else "Other"
	col.add_theme_constant_override("separation", 8)
	col.alignment = BoxContainer.ALIGNMENT_BEGIN
	var face: Control = MissionStrip.Face.new(52.0, "") if mine else MissionStrip.Glyph.new("question", 52.0)
	face.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	col.add_child(face)
	var choice := MissionStrip.new(36.0)
	choice.alignment = BoxContainer.ALIGNMENT_CENTER
	choice.show_tokens(o.get("choice", []), o.get("params", {}))
	col.add_child(choice)
	var arrow := MoneyIcons.Arrow.new(30.0)
	arrow.rotation = PI * 0.5
	arrow.pivot_offset = Vector2(15, 15)
	arrow.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	col.add_child(arrow)
	var results: Array = o.get("results", [])
	for i in results.size():
		var cell := PanelContainer.new()
		cell.name = "Result_%d" % i
		var sb := StyleBoxFlat.new()
		sb.set_corner_radius_all(12)
		sb.content_margin_left = 8
		sb.content_margin_right = 8
		sb.content_margin_top = 4
		sb.content_margin_bottom = 4
		var differs: bool = diff.has(i)
		sb.bg_color = Color("FFF1CC") if differs else Color(0, 0, 0, 0)
		sb.border_color = UIStyle.GOLD
		sb.set_border_width_all(3 if differs else 0)
		cell.add_theme_stylebox_override("panel", sb)
		cell.set_meta("differs", differs)
		var s := MissionStrip.new(40.0)
		s.alignment = BoxContainer.ALIGNMENT_CENTER
		s.show_tokens(results[i], {})
		cell.add_child(s)
		col.add_child(cell)
	return col


func _icon_button(key: String, tokens: Array) -> Button:
	var words: bool = SupportProfile.show_text()
	var b := UIStyle.button("", false)
	b.custom_minimum_size = Vector2(110, 64)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var s := MissionStrip.new(36.0)
	s.show_tokens(tokens, {})
	row.add_child(s)
	if words:
		var l := UIStyle.label(Localization.t(key), 20)
		l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		row.add_child(l)
	b.add_child(row)
	# Buttons do not size to their content: fit once the pictures exist.
	(func() -> void:
		if is_instance_valid(b):
			b.custom_minimum_size.x = maxf(110.0, row.get_combined_minimum_size().x + 28.0)).call_deferred()
	return b


func _answer(what: String) -> void:
	if _done:
		return
	_done = true
	AudioManager.play_sfx("ui_click", 1.0, -6.0)
	answered.emit(what)
	queue_free()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_answer("done")


func _exit_tree() -> void:
	if not _done:
		answered.emit("done")
	if is_instance_valid(_return_focus) and _return_focus.is_inside_tree():
		_return_focus.grab_focus.call_deferred()
