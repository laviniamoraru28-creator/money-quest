class_name GuidedMissionCard
extends CanvasLayer
## GuidedMissionCard — the guided adventure's one card (GuidedRoute):
##
##   [✓ the mission just finished]        (after a mission)
##   [chapter: ✓ ✓ ★ ○]                  where you are in this chapter
##   [place badge] → [the goal, in pictures]
##   "Put your coins in the jar."          one short instruction (words on)
##   [ Let's go → ]   [ Not now ]
##
## Pictures carry the meaning; words are an extra layer (words off: the
## buttons are an arrow and a pause sign). "Let's go" has focus, so E / A /
## Enter / Space or a tap starts the mission; "Not now" (or Escape / B)
## pauses the route — the child's own pace, never forced. Reduced Motion:
## it simply appears. Listen reads it.

signal _chosen(choice: String)

var _go: Button
var _later: Button
var _card: PanelContainer
var _listen: PackedStringArray = []
var _closing: bool = false


func _init() -> void:
	layer = 11
	name = "GuidedMissionCard"


## Shows the card and waits: "go" or "later" ("done" when nothing follows).
func present(cur: Dictionary, done: MissionStepData, chapter_done: bool, done_chapter: RouteChapterData) -> String:
	var words: bool = SupportProfile.show_text()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.35)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	_card = PanelContainer.new()
	_card.name = "MissionCard"
	_card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 24))
	_card.mouse_filter = Control.MOUSE_FILTER_STOP
	center.add_child(_card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 14)
	v.custom_minimum_size = Vector2(520, 0)
	_card.add_child(v)

	# 1. What was just finished (a tick: a shape, not only a colour).
	if done:
		var row := _row(v)
		row.name = "DoneRow"
		row.add_child(MoneyIcons.Tick.new(56.0))
		var pic := MissionStrip.new(56.0)
		pic.show_tokens(Array(done.goal_icons))
		row.add_child(pic)
		var key: String = "guided.chapter_done" if chapter_done else "guided.mission_done"
		if words:
			row.add_child(_label(Localization.t(key), UIStyle.TITLE, UIStyle.TEAL_DARK))
		_listen.append(Localization.t(key))
		AudioManager.play_sfx("success", 1.0, -4.0)

	if cur.is_empty():
		# Everything on the route is done.
		if words:
			v.add_child(_label(Localization.t("guided.all_done"), UIStyle.TEXT, UIStyle.INK, true))
		_listen.append(Localization.t("guided.all_done"))
		_go = _button(v, "guided.ok", true)
		_go.name = "GoButton"
		if not words:
			_center_icon(_go, MoneyIcons.Tick.new(40.0))   # "OK" as a tick
		_go.pressed.connect(func(): _finish("done"))
		return await _show()

	var step: MissionStepData = cur["step"]
	var chapter: RouteChapterData = cur["chapter"]
	# 2. Where you are: the chapter and its missions (✓ done, ★ now, ○ next).
	var path := _row(v)
	path.name = "RoutePath"
	var flag := MissionStrip.new(40.0)
	flag.show_tokens(Array(chapter.icons))
	path.add_child(flag)
	for i in int(cur["count"]):
		path.add_child(RouteDot.new(30.0, "done" if i < int(cur["index"]) else ("now" if i == int(cur["index"]) else "next")))
	if words:
		path.add_child(_label(Localization.t("guided.mission_of", {"n": int(cur["index"]) + 1, "count": int(cur["count"])}), UIStyle.TEXT_SMALL, UIStyle.TEAL_DARK))
	_listen.append(Localization.t("guided.mission_of", {"n": int(cur["index"]) + 1, "count": int(cur["count"])}))

	# 3. The goal: the place, then what to do there, as pictures.
	var goal := _row(v)
	goal.name = "GoalRow"
	var badge := DestinationIcon.new()
	badge.name = "PlaceBadge"
	badge.custom_minimum_size = Vector2(76, 76)
	var place: String = WorldManager.emblem_place(step.zone_id)
	var own: Dictionary = Destinations.mission_picture(step.zone_id)
	if not own.is_empty():
		# A room with its own mission picture (not a destination of its own).
		badge.icon = own["icon"]
		badge.accent = own["accent"]
	elif Destinations.has(place):
		badge.icon = Destinations.icon(place)
		badge.accent = Destinations.accent(place)
	goal.add_child(badge)
	goal.add_child(MoneyIcons.Arrow.new(34.0))
	var strip := MissionStrip.new(72.0)
	strip.name = "GoalPicture"
	strip.show_tokens(Array(step.goal_icons))
	goal.add_child(strip)

	# 4. One short instruction (words on); Listen always has it.
	var instruction: String = Localization.t(step.instruction_key)
	if words:
		var l := _label(instruction, 30, UIStyle.INK, true)
		l.name = "Instruction"
		v.add_child(l)
	_listen.append(instruction)

	# 5. Let's go / Not now.
	var buttons := _row(v)
	_go = _button(buttons, "guided.go", true)
	_go.name = "GoButton"
	if not words:
		_center_icon(_go, MoneyIcons.Arrow.new(36.0))
	_go.pressed.connect(func(): _finish("go"))
	_later = _button(buttons, "guided.later", false)
	_later.name = "LaterButton"
	if not words:
		_center_icon(_later, PauseSign.new(30.0))
	_later.pressed.connect(func(): _finish("later"))
	return await _show()


## What the Listen control reads while the card is shown.
func listen_text() -> String:
	return " ".join(_listen)


func _show() -> String:
	if not Settings.reduced_motion:
		_card.modulate.a = 0.0
		_card.create_tween().tween_property(_card, "modulate:a", 1.0, 0.2)
	AudioManager.play_sfx("hint", 1.0, -4.0)
	AudioManager.narrate(listen_text())
	UIFocus.focus(_go)
	var choice: String = await _chosen
	queue_free()
	return choice


func _finish(choice: String) -> void:
	if _closing:
		return
	_closing = true
	_chosen.emit(choice)


func _unhandled_input(event: InputEvent) -> void:
	if _closing:
		return
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_finish("later" if is_instance_valid(_later) else "done")


func _row(parent: Container) -> HBoxContainer:
	var r := HBoxContainer.new()
	r.alignment = BoxContainer.ALIGNMENT_CENTER
	r.add_theme_constant_override("separation", 12)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(r)
	return r


func _label(text: String, size: int, color: Color, wrap: bool = false) -> Label:
	var l := UIStyle.label(text, size, color)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	if wrap:
		# A long line wraps within the card (never one letter per line).
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 480.0
	return l


func _button(parent: Container, key: String, primary: bool) -> Button:
	var b := UIStyle.button(Localization.t(key) if SupportProfile.show_text() else "", primary)
	b.custom_minimum_size = Vector2(200, 72)
	b.set_meta("words", Localization.t(key))
	PictureChoice.focus_ring(b)
	Narration.read_on_focus(b, Localization.t(key))
	parent.add_child(b)
	return b


func _center_icon(b: Button, icon: Control) -> void:
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.set_anchors_preset(Control.PRESET_CENTER)
	var s: Vector2 = icon.custom_minimum_size
	icon.offset_left = -s.x * 0.5
	icon.offset_right = s.x * 0.5
	icon.offset_top = -s.y * 0.5
	icon.offset_bottom = s.y * 0.5
	b.add_child(icon)


## One mission on the chapter path: done (a filled circle with a tick),
## now (a gold ring with a star) or next (an empty ring) — three different
## shapes, so the path never depends on colour.
class RouteDot extends Control:
	var kind: String = "next"

	func _init(p: float, k: String) -> void:
		kind = k
		custom_minimum_size = Vector2(p, p)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5 - 1.0
		match kind:
			"done":
				draw_circle(c, r, UIStyle.TEAL)
				draw_polyline(PackedVector2Array([c + Vector2(-r * 0.45, 0), c + Vector2(-r * 0.1, r * 0.38), c + Vector2(r * 0.5, -r * 0.35)]), Color.WHITE, 3.0, true)
			"now":
				draw_circle(c, r, MoneyIcons.INK)
				draw_circle(c, r - 3.0, UIStyle.GOLD)
				var pts := PackedVector2Array()
				for i in 10:
					var a: float = -PI * 0.5 + TAU * i / 10.0
					pts.append(c + Vector2(cos(a), sin(a)) * (r * 0.62 if i % 2 == 0 else r * 0.28))
				draw_colored_polygon(pts, MoneyIcons.CREAM)
			_:
				draw_arc(c, r - 1.5, 0.0, TAU, 24, MoneyIcons.INK, 3.0)


## A pause sign (two bars): "not now".
class PauseSign extends Control:
	func _init(p: float) -> void:
		custom_minimum_size = Vector2(p, p)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var w: float = size.x * 0.26
		draw_rect(Rect2(Vector2(size.x * 0.16, size.y * 0.1), Vector2(w, size.y * 0.8)), MoneyIcons.INK)
		draw_rect(Rect2(Vector2(size.x * 0.58, size.y * 0.1), Vector2(w, size.y * 0.8)), MoneyIcons.INK)
