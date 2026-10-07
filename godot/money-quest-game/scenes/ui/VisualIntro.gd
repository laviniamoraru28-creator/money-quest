class_name VisualIntro
extends CanvasLayer
## VisualIntro — a place's short picture intro (Universal Play & Learn):
## "this is you, this is the place, here is what you can do", shown as a
## few rows of pictures (MissionStrip tokens) that appear one after
## another. Words under each row are an optional layer (Show words).
##
## - Short: a few rows, about a second and a half each.
## - Skippable at any moment: the Go button, E / Enter / Space, Escape,
##   A / B on a gamepad, a click or a tap on the card (a press still does
##   its usual job too). It also closes by itself a few seconds after the
##   last row.
## - Never in the way: the world keeps running and the child can walk
##   while it is shown (it sits in the upper middle of the screen).
## - Reduced Motion: every row is there at once, nothing slides or fades.
##
## A place shows it on the first visit and again on request (Help →
## "Show me again", via ObjectiveManager.intro_requested).

signal closed

const ROW_SECONDS: float = 1.4
const LINGER_SECONDS: float = 6.0

var place_id: String = ""
var rows: Array = []      # [{"icons": [...], "key": "translation.key"}]
var _card: PanelContainer
var _rows_box: VBoxContainer
var _go: Button
var _closing: bool = false


## Shows the intro for `zone_id` (Destinations gives its name, icon and
## colour). Returns the intro; await `closed` if needed.
static func play(host: Node, zone_id: String, p_rows: Array) -> VisualIntro:
	var intro := VisualIntro.new()
	intro.place_id = zone_id
	intro.rows = p_rows
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	(hud if hud else host.get_tree().current_scene).add_child(intro)
	return intro


static func find(from: Node) -> VisualIntro:
	for n in from.get_tree().get_nodes_in_group("mq_visual_intro"):
		if not n.is_queued_for_deletion():
			return n
	return null


func _ready() -> void:
	layer = 11
	name = "VisualIntro"
	add_to_group("mq_visual_intro")
	var words: bool = SupportProfile.show_text()
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_card = PanelContainer.new()
	_card.name = "IntroCard"
	_card.add_theme_stylebox_override("panel", UIStyle.panel(Destinations.accent(place_id) if Destinations.has(place_id) else UIStyle.GOLD, 22))
	_card.mouse_filter = Control.MOUSE_FILTER_STOP
	_card.gui_input.connect(func(e: InputEvent) -> void:
		if (e is InputEventMouseButton and e.pressed) or (e is InputEventScreenTouch and e.pressed):
			close())
	root.add_child(_card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_card.add_child(v)
	# "You" + "this place".
	var head := HBoxContainer.new()
	head.mouse_filter = Control.MOUSE_FILTER_IGNORE
	head.add_theme_constant_override("separation", 12)
	head.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(head)
	head.add_child(MissionStrip.Face.new(76.0, ""))
	head.add_child(MoneyIcons.Arrow.new(34.0))
	var badge := DestinationIcon.new()
	badge.custom_minimum_size = Vector2(76, 76)
	if Destinations.has(place_id):
		badge.icon = Destinations.icon(place_id)
		badge.accent = Destinations.accent(place_id)
	head.add_child(badge)
	if words and Destinations.has(place_id):
		var t := UIStyle.label(Destinations.title(place_id), UIStyle.TITLE, UIStyle.TEAL_DARK)
		t.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		head.add_child(t)
	_rows_box = VBoxContainer.new()
	_rows_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_rows_box.add_theme_constant_override("separation", 10)
	v.add_child(_rows_box)
	for r in rows:
		var line := HBoxContainer.new()
		line.mouse_filter = Control.MOUSE_FILTER_IGNORE
		line.add_theme_constant_override("separation", 14)
		var strip := MissionStrip.new(56.0)
		strip.show_tokens(r.get("icons", []), r.get("params", {}))
		line.add_child(strip)
		if words and r.has("key"):
			var l := UIStyle.label(Localization.t(r["key"]), UIStyle.TEXT)
			l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			line.add_child(l)
		_rows_box.add_child(line)
	_go = UIStyle.button(Localization.t("intro.go") if words else "", true)
	_go.name = "GoButton"
	_go.focus_mode = Control.FOCUS_NONE   # E / A / Enter close it (see _input)
	_go.custom_minimum_size = Vector2(120, 64)
	_go.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	if not words:
		# No words: the button is an arrow ("go"), centred.
		var arrow := MoneyIcons.Arrow.new(36.0)
		arrow.set_anchors_preset(Control.PRESET_CENTER)
		arrow.offset_left = -18.0
		arrow.offset_top = -18.0
		arrow.offset_right = 18.0
		arrow.offset_bottom = 18.0
		_go.add_child(arrow)
	_go.pressed.connect(close)
	v.add_child(_go)
	_place.call_deferred()
	get_viewport().size_changed.connect(_place)
	AudioManager.play_sfx("hint", 1.0, -6.0)
	_reveal()


func _place() -> void:
	if not is_instance_valid(_card):
		return
	_card.reset_size()
	var vp: Vector2 = _card.get_viewport_rect().size
	var x: float = (vp.x - _card.size.x) * 0.5
	# Beside the mission card when there is room (never on top of it).
	var hud: Node = get_parent()
	var op: Control = hud.get("objective_panel") if hud else null
	if op and ObjectiveManager.has_objective():
		var right: float = op.get_global_rect().end.x + 16.0
		if right + _card.size.x <= vp.x - 8.0:
			x = maxf(x, right)
	_card.position = Vector2(x, maxf(vp.y * 0.16, 70.0))


## Rows appear one by one (all at once with Reduced Motion), each read
## aloud when narration is on; then the card waits a little and goes.
func _reveal() -> void:
	var lines: Array = _rows_box.get_children()
	for l in lines:
		l.modulate.a = 0.0 if not Settings.reduced_motion else 1.0
	for i in lines.size():
		if _closing or not is_inside_tree():
			return
		var line: Control = lines[i]
		if not Settings.reduced_motion:
			line.create_tween().tween_property(line, "modulate:a", 1.0, 0.3)
		if rows[i].has("key") and SupportProfile.show_text():
			AudioManager.narrate(Localization.t(rows[i]["key"]))
		if not Settings.reduced_motion:
			await get_tree().create_timer(ROW_SECONDS).timeout
	if _closing or not is_inside_tree():
		return
	await get_tree().create_timer(LINGER_SECONDS).timeout
	close()


func close() -> void:
	if _closing:
		return
	_closing = true
	closed.emit()
	if Settings.reduced_motion or not is_instance_valid(_card):
		queue_free()
		return
	var tw := _card.create_tween()
	tw.tween_property(_card, "modulate:a", 0.0, 0.2)
	tw.tween_callback(queue_free)


func _input(event: InputEvent) -> void:
	if _closing:
		return
	# Any action closes it and still does what it does (E near a stall
	# opens the stall: no press is ever "lost"); only Escape / B is used up.
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()
	elif event.is_action_pressed("interact") or event.is_action_pressed("ui_accept") or event.is_action_pressed("help"):
		close()


## What the Listen control reads while the intro is shown.
func listen_text() -> String:
	var parts: PackedStringArray = []
	for r in rows:
		if r.has("key"):
			parts.append(Localization.t(r["key"]))
	return " ".join(parts)
