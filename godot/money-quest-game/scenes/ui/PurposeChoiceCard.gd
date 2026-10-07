class_name PurposeChoiceCard
extends CanvasLayer
## PurposeChoiceCard — "What will you do?" as pictures (ResourcePurpose).
##
##   [you] [coin] 3  ?
##   [ jar ]   [ book ]   [ sprout ]      ← big picture buttons
##    ●●○       ●●          ●●            ← what each needs, as coins
##                                          (gold = you have it, hollow = missing)
##   [ x Later ]
##
## Words ("Save", "Learn"...) are an optional layer under each picture.
## An option needing more coins than the child has is still shown — its
## hollow coins show the gap — and choosing it simply does nothing but a
## soft "not yet" (the coins show why). "Later" (Escape / B) always closes
## it: nothing has to be chosen. Keyboard, gamepad (focus starts on the
## first option), mouse and touch. Reduced Motion: no pop or shake.

signal chosen(index: int)

var options: Array = []
var have: int = 0
var header_icons: Array = []
var header_params: Dictionary = {}
var buttons: Array[Button] = []
var _later: Button
var _done: bool = false
var _return_focus: Control


func _ready() -> void:
	layer = 12
	name = "PurposeChoiceCard"
	add_to_group("mq_purpose_card")
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
	card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 22))
	center.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 14)
	card.add_child(v)
	# Header: you, your coins, "?".
	var head := HBoxContainer.new()
	head.alignment = BoxContainer.ALIGNMENT_CENTER
	head.add_theme_constant_override("separation", 10)
	v.add_child(head)
	head.add_child(MissionStrip.Face.new(64.0, ""))
	head.add_child(MoneyIcons.Coin.new(36.0))
	var n := UIStyle.label(str(have), UIStyle.TITLE)
	n.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	head.add_child(n)
	if not header_icons.is_empty():
		var hs := MissionStrip.new(48.0)
		hs.show_tokens(header_icons, header_params)
		head.add_child(hs)
	head.add_child(MissionStrip.Glyph.new("question", 56.0))
	if words:
		var q := UIStyle.label(Localization.t("purpose.question"), UIStyle.TITLE, UIStyle.TEAL_DARK)
		q.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		head.add_child(q)
	# The options.
	var row := HFlowContainer.new()
	row.alignment = FlowContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("h_separation", 14)
	row.add_theme_constant_override("v_separation", 14)
	v.add_child(row)
	for i in options.size():
		var b := _option_button(options[i], words)
		b.name = "Option_%s" % String(options[i].get("id", options[i].get("purpose", str(i))))
		b.pressed.connect(_pick.bind(i))
		row.add_child(b)
		buttons.append(b)
	# Later.
	_later = UIStyle.button(Localization.t("purpose.later") if words else "", false)
	_later.name = "LaterButton"
	_later.custom_minimum_size = Vector2(110, 60)
	_later.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	if not words:
		var x := MoneyIcons.Cross.new(30.0)
		x.set_anchors_preset(Control.PRESET_CENTER)
		x.offset_left = -15.0
		x.offset_top = -15.0
		x.offset_right = 15.0
		x.offset_bottom = 15.0
		_later.add_child(x)
	_later.pressed.connect(_pick.bind(-1))
	v.add_child(_later)
	for i in buttons.size():
		var b: Button = buttons[i]
		b.focus_neighbor_bottom = b.get_path_to(_later)
	AudioManager.play_sfx("ui_open", 1.0, -4.0)
	if words:
		AudioManager.narrate(listen_text())
	_fit_buttons()
	if not buttons.is_empty():
		UIFocus.focus(buttons[0])


func _option_button(o: Dictionary, words: bool) -> Button:
	var b := Button.new()
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = UIStyle.CREAM if state != "hover" else UIStyle.CREAM.darkened(0.04)
		sb.set_corner_radius_all(18)
		sb.border_color = UIStyle.GOLD if state == "focus" else UIStyle.TEAL_DARK
		sb.set_border_width_all(6 if state == "focus" else 3)
		if state == "focus":
			sb.draw_center = false
		b.add_theme_stylebox_override(state, sb)
	b.custom_minimum_size = Vector2(164, 0)
	var col := VBoxContainer.new()
	col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 6)
	col.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	col.offset_top = 12
	col.offset_bottom = -12
	b.add_child(col)
	# The option's own picture ("picture": a token, e.g. the snack itself),
	# or its purpose's picture.
	var px: float = 84.0 if options.size() <= 3 else 64.0
	var big: Control = MissionStrip.make_token(String(o["picture"]), {}, px) if o.has("picture") else MissionStrip.Glyph.new(ResourcePurpose.glyph(String(o.get("purpose", ""))), px)
	big.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	col.add_child(big)
	var icons: Array = o.get("icons", [])
	if not icons.is_empty():
		var s := MissionStrip.new(34.0)
		s.alignment = BoxContainer.ALIGNMENT_CENTER
		s.show_tokens(icons, o.get("params", {}))
		col.add_child(s)
	var cost: int = int(o.get("cost", 0))
	if cost > 0:
		var p := MoneyIcons.PriceView.new()
		p.alignment = BoxContainer.ALIGNMENT_CENTER
		p.set_amount(cost, have, 16.0)
		p.words.visible = false
		col.add_child(p)
	if words:
		var l := UIStyle.label(Localization.t(ResourcePurpose.word_key(o)), 22)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		col.add_child(l)
	b.set_meta("needs_more", cost > have)
	b.set_meta("content", col)
	return b


## Buttons do not size to what is inside them: once the pictures exist,
## each option grows to fit its content (pictures never overflow).
func _fit_buttons() -> void:
	for b in buttons:
		var col: Control = b.get_meta("content")
		var need: Vector2 = col.get_combined_minimum_size()
		b.custom_minimum_size = Vector2(maxf(164.0, need.x + 28.0), need.y + 24.0)


func _pick(index: int) -> void:
	if _done:
		return
	if index >= 0 and buttons[index].get_meta("needs_more", false):
		# Not yet: the hollow coins show what is missing. Nothing happens.
		AudioManager.play_sfx("retry", 1.0, -6.0)
		_nudge(buttons[index])
		return
	_done = true
	AudioManager.play_sfx("ui_click" if index >= 0 else "ui_back", 1.0, -6.0)
	chosen.emit(index)
	queue_free()


func _nudge(b: Control) -> void:
	if Settings.reduced_motion:
		return
	var x: float = b.position.x
	var tw := b.create_tween()
	for d in [8.0, -8.0, 5.0, 0.0]:
		tw.tween_property(b, "position:x", x + d, 0.05)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_pick(-1)


func listen_text() -> String:
	var parts: PackedStringArray = [Localization.t("purpose.question")]
	for o in options:
		parts.append(Localization.t(ResourcePurpose.word_key(o)))
	return ". ".join(parts)


func _exit_tree() -> void:
	if not _done:
		chosen.emit(-1)
	if is_instance_valid(_return_focus) and _return_focus.is_inside_tree():
		_return_focus.grab_focus.call_deferred()
