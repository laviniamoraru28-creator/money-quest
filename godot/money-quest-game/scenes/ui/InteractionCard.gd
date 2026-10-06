class_name InteractionCard
extends Control
## InteractionCard — the one card every world interaction uses (objects,
## landmarks, NPC greetings, tiny "try it" moments, gateways into zones).
## It lives in the always-present HUD, opens only when the child chooses
## to interact, never blocks movement, and closes by itself if they walk
## away — exploring is always in the child's control.
##
## Layout: district-coloured accent stripe, a short title, one (at most
## two) short sentences, an optional two-choice "what would you do?" with a
## kind explanation for every answer, then "Explore more" (when the
## interaction leads somewhere) and Close. Large buttons (64 px), keyboard /
## gamepad focus, Escape or the gamepad back button closes. Ink on cream
## for contrast, and no animation beyond a short fade that Reduced Motion
## removes.

const INK := Color("1C2624")
const CREAM := Color("FBF8EF")
const TEAL := Color("0F7A6B")
const MAX_WIDTH: float = 640.0

signal closed

var _data: InteractionData
var _source: Node
var _panel: PanelContainer
var _stripe: StyleBoxFlat
var _title: Label
var _body: Label
var _question: Label
var _choices: HFlowContainer
var _result: Label
var _listen: Button
var _qid: String = ""
var _action_button: Button
var _close_button: Button


## The card belonging to the running HUD (or null in scenes without one).
static func find(from: Node) -> InteractionCard:
	return from.get_tree().get_first_node_in_group("mq_interaction_card") as InteractionCard


func _ready() -> void:
	add_to_group("mq_interaction_card")
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build()
	visible = false
	set_process(false)
	Localization.locale_changed.connect(func(_l: String) -> void:
		if visible and _data:
			_fill(_source.get_display_name() if _source is NPC else ""))


## What the Listen control reads: the card, its question and answers (in
## the order shown) and, once chosen, the explanation.
func listen_text() -> String:
	if not visible or _data == null:
		return ""
	var parts: PackedStringArray = [_title.text]
	if _body.visible:
		parts.append(_body.text)
	if _question.visible:
		var answers: Array = []
		for b in _choices.get_children():
			if not b.is_queued_for_deletion():
				answers.append((b as Button).text)
		parts.append(Narration.question_text(_question.text, answers))
	if _result.visible:
		parts.append(_result.text)
	return " ".join(parts)


func is_open() -> bool:
	return visible


func is_open_for(source: Node) -> bool:
	return visible and _source == source


## Opens the card, or closes it if it's already showing this source (so
## pressing interact again simply puts it away).
func toggle(data: InteractionData, source: Node, title_override: String = "") -> void:
	if is_open_for(source):
		close()
		return
	open(data, source, title_override)


func open(data: InteractionData, source: Node, title_override: String = "") -> void:
	_data = data
	_source = source
	_fill(title_override)
	visible = true
	set_process(true)
	if not Settings.reduced_motion:
		_panel.modulate.a = 0.0
		create_tween().tween_property(_panel, "modulate:a", 1.0, 0.18)
	else:
		_panel.modulate.a = 1.0
	AudioManager.present.call_deferred(listen_text())
	_first_focus().grab_focus.call_deferred()
	if data.remember:
		ProgressManager.discover_world("hub:" + data.interaction_id)
	if not data.reaction.is_empty():
		var director := get_tree().get_first_node_in_group("mq_ambient_director") as AmbientDirector
		if director:
			director.react(data.reaction)


func close() -> void:
	if not visible:
		return
	visible = false
	set_process(false)
	_source = null
	closed.emit()


func _process(_delta: float) -> void:
	# Walked away (or the zone changed): put the card away quietly.
	if _source == null or not is_instance_valid(_source) or ("player_in_range" in _source and not _source.player_in_range):
		close()


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		close()
		get_viewport().set_input_as_handled()


func _fill(title_override: String) -> void:
	var d := _data
	_stripe.border_color = DecorKit.color(d.accent)
	_title.text = title_override if not title_override.is_empty() else Localization.t(d.title_key)
	var body: String = Localization.t(d.text_key) if not d.text_key.is_empty() else ""
	if not d.text2_key.is_empty():
		body += ("\n" if not body.is_empty() else "") + Localization.t(d.text2_key)
	_body.text = body
	_body.visible = not body.is_empty()
	for c in _choices.get_children():
		c.queue_free()
	_result.visible = false
	_question.visible = not d.question_key.is_empty()
	_choices.visible = _question.visible
	if _question.visible:
		_question.text = Localization.t(d.question_key)
		# A fresh random order each time (AnswerOrder); each button keeps its
		# own answer index, so its explanation always matches it.
		_qid = AnswerOrder.question_id(d.question_key, d.choice_keys)
		for i in AnswerOrder.order_for(_qid, d.choice_keys.size()):
			var b := _button(Localization.t(d.choice_keys[i]), false)
			b.set_meta("answer_index", i)
			b.pressed.connect(_on_choice.bind(i))
			Narration.read_on_focus(b, b.text)
			_choices.add_child(b)
	_action_button.visible = d.action != "none" and d.action != "rest"
	_action_button.text = Localization.t(d.action_label_key)
	_close_button.text = Localization.t("interaction.close_button")
	_layout()


## Bottom-centre, as wide as fits (max 640 px). Wrapping labels get an
## explicit width so their height is right before the panel sizes itself.
func _layout() -> void:
	var vp: Vector2 = get_viewport_rect().size
	var w: float = minf(MAX_WIDTH, vp.x - 32.0)
	var text_w: float = w - 60.0
	for l in [_title, _body, _question, _result]:
		l.custom_minimum_size.x = text_w
	_panel.custom_minimum_size = Vector2(w, 0)
	_panel.reset_size()
	_place.call_deferred()


func _place() -> void:
	var vp: Vector2 = get_viewport_rect().size
	_panel.reset_size()
	_panel.position = Vector2((vp.x - _panel.size.x) * 0.5, vp.y - _panel.size.y - 24.0)


func _on_choice(i: int) -> void:
	# Every answer is fine: show its short explanation, no score, no penalty.
	if i < _data.result_keys.size():
		_result.text = Localization.t(_data.result_keys[i])
		_result.visible = true
	for b in _choices.get_children():
		(b as Button).disabled = int(b.get_meta("answer_index", -1)) != i
	AnswerOrder.answered(_qid)
	if _result.visible:
		AudioManager.narrate(_result.text)
	_first_focus().grab_focus()
	_place.call_deferred()


func _on_action() -> void:
	var d := _data
	match d.action:
		"open_zone":
			if WorldManager.get_zone(d.target_id) == null:
				push_warning("InteractionCard: unknown zone '%s'" % d.target_id)
				return
			if not WorldManager.is_zone_unlocked(d.target_id):
				# Gentle, never "error": the place simply opens later.
				_result.text = Localization.t("interaction.locked")
				_result.visible = true
				_place.call_deferred()
				return
			close()
			WorldManager.travel_to(d.target_id)
		"library_book":
			var book: BookData = LibraryManager.get_book(d.target_id)
			if book:
				close()
				await BookCardPanel.show_book(book)
				_mark_entry(d.target_id)
		"mentor":
			var mentor: MentorData = LibraryManager.get_mentor(d.target_id)
			if mentor:
				close()
				await MentorCardPanel.show_mentor(mentor)
				_mark_entry(d.target_id)
		"exhibit":
			var exhibit: ExhibitData = MuseumManager.get_exhibit(d.target_id)
			if exhibit:
				close()
				await ExhibitCardPanel.show_exhibit(exhibit)
				_mark_entry(d.target_id)


## Same bookkeeping the in-zone Library/Museum interactions do.
func _mark_entry(entry_id: String) -> void:
	ProgressManager.discover_entry(entry_id)
	QuestManager.notify_entry_discovered(entry_id)


func _first_focus() -> Control:
	for b in _choices.get_children():
		if not (b as Button).disabled and _choices.visible and not _result.visible:
			return b
	return _action_button if _action_button.visible else _close_button


# --- construction -------------------------------------------------------------

func _build() -> void:
	_panel = PanelContainer.new()
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_stripe = StyleBoxFlat.new()
	_stripe.bg_color = CREAM
	_stripe.set_corner_radius_all(18)
	_stripe.border_width_left = 10
	_stripe.border_color = Color("E8A33D")
	_stripe.content_margin_left = 24
	_stripe.content_margin_right = 20
	_stripe.content_margin_top = 16
	_stripe.content_margin_bottom = 16
	_stripe.shadow_color = Color(0, 0, 0, 0.18)
	_stripe.shadow_size = 8
	_panel.add_theme_stylebox_override("panel", _stripe)
	add_child(_panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 10)
	_panel.add_child(box)
	_title = _label(24)
	box.add_child(_title)
	_body = _label(19)
	box.add_child(_body)
	_question = _label(19)
	box.add_child(_question)
	_choices = HFlowContainer.new()
	_choices.add_theme_constant_override("h_separation", 12)
	_choices.add_theme_constant_override("v_separation", 8)
	box.add_child(_choices)
	_result = _label(19)
	_result.add_theme_color_override("font_color", Color("0B5C50"))
	box.add_child(_result)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	box.add_child(row)
	_action_button = _button("", true)
	_action_button.pressed.connect(_on_action)
	row.add_child(_action_button)
	_close_button = _button("", false)
	_close_button.pressed.connect(close)
	row.add_child(_close_button)
	_listen = Narration.listen_button()
	_listen.custom_minimum_size = Vector2(150, 56)
	row.add_child(_listen)


func _label(size: int) -> Label:
	var l := Label.new()
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", INK)
	return l


func _button(text: String, primary: bool) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(150, 56)
	b.add_theme_font_size_override("font_size", 19)
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		var sb := StyleBoxFlat.new()
		sb.set_corner_radius_all(12)
		sb.content_margin_left = 18
		sb.content_margin_right = 18
		if primary:
			sb.bg_color = TEAL.darkened(0.15) if state == "pressed" else TEAL
		else:
			sb.bg_color = Color("EDE6D3") if state != "disabled" else Color("EDE6D3", 0.5)
			sb.border_color = Color("B9AE97")
			sb.set_border_width_all(2)
		if state == "focus" or state == "hover":
			sb.border_color = INK
			sb.set_border_width_all(4)
		b.add_theme_stylebox_override(state, sb)
	var fc: Color = Color.WHITE if primary else INK
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(c, fc)
	b.add_theme_color_override("font_disabled_color", Color(INK, 0.45))
	return b
