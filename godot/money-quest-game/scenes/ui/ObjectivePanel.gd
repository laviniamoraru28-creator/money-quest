class_name ObjectivePanel
extends PanelContainer
## ObjectivePanel — the always-visible "MISSION" card under the top bar:
## the current objective in one short, large line (from ObjectiveManager),
## and a "?" button that opens the help panel (also: H on the keyboard, Y on
## a gamepad — shown on the card). Hidden when there is no objective.
## A new mission briefly lights the card's edge and plays a soft chime;
## with Reduced Motion it simply appears.
## A finished step shows a "Done!" line with a tick (a shape, not only a
## colour) and a soft success chime, read aloud when narration is on; the
## card gives a small happy pop — or, with Reduced Motion, just the tick.
## The card can be minimized (the button beside "?", M on the keyboard, Select
## on a gamepad) to one compact row — the goal pictures, a one-line title and
## an Expand button — and expanded again at any time. A genuinely new mission
## always opens it in full; nothing else (a shop, the arrival banner, a
## setting or language change) reopens it, and nothing closes it by itself.

signal help_requested

var _title: Label
var _text: Label
var _tip: Label
var _help: Button
var _shown_id: String = ""
var _hold_serial: int = 0
var _held: bool = false
## True while a full-width world card (the shop) needs the space: the
## mission is not lost, just tucked away until the card closes.
var suppressed: bool = false:
	set(v):
		suppressed = v
		_refresh()
var _done: HBoxContainer
var _done_label: Label
var _done_serial: int = 0
## ✓ DONE stays visible for a moment even when nothing follows (the card
## shows the finished goal with its tick, then tucks away).
var _finishing: bool = false
var _finishing_quest: bool = false
var _last_icons: Array = []
var _last_params: Dictionary = {}
var _last_text: String = ""
## The mission as pictures (VisualMissions) — shown with words on or off.
var strip: MissionStrip
var _route: HBoxContainer
var _route_sig: String = ""
## Minimized by the player (the session remembers it across places). Only a
## mission this card has never shown before opens it in full again.
var _collapsed: bool = false
var _seen_ids: Dictionary = {}
var _row: HBoxContainer
var _toggle: Button
var _compact: HBoxContainer
var _mini: MissionStrip
var _mini_title: Label
var _mini_tick: TickIcon
var _expand: Button
var _style_full: StyleBoxFlat
var _style_compact: StyleBoxFlat
const COMPACT_BUTTON := 56.0
## The compact row stays within this share of the screen width.
const COMPACT_MAX_SHARE := 0.4


func _ready() -> void:
	name = "ObjectivePanel"
	# Clicks pass through the card to the world behind it (tap-to-move); only
	# the "?" button takes them.
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_style_full = UIStyle.panel(UIStyle.GOLD)
	_style_compact = UIStyle.panel(UIStyle.GOLD)
	_style_compact.content_margin_top = 6
	_style_compact.content_margin_bottom = 6
	_style_compact.content_margin_left = 14
	_style_compact.content_margin_right = 8
	add_theme_stylebox_override("panel", _style_full)
	custom_minimum_size = Vector2(360, 0)
	var row := HBoxContainer.new()
	_row = row
	row.add_theme_constant_override("separation", 16)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(row)
	var col := VBoxContainer.new()
	col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 2)
	row.add_child(col)
	_title = UIStyle.label("", UIStyle.TEXT_SMALL, UIStyle.TEAL_DARK)
	col.add_child(_title)
	# The guided adventure: which mission of the chapter this is (✓ done,
	# ★ now, ○ next — shapes, not colours), shown while the route guides.
	_route = HBoxContainer.new()
	_route.name = "RouteRow"
	_route.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_route.add_theme_constant_override("separation", 6)
	_route.visible = false
	col.add_child(_route)
	GuidedRoute.route_changed.connect(_refresh)
	strip = MissionStrip.new(52.0)
	strip.visible = false
	col.add_child(strip)
	_text = UIStyle.label("", 26)
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.custom_minimum_size = Vector2(300, 0)
	col.add_child(_text)
	_tip = UIStyle.label("", 20, UIStyle.MUTED)
	_tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_tip.custom_minimum_size = Vector2(300, 0)
	col.add_child(_tip)
	_done = HBoxContainer.new()
	_done.name = "DoneRow"
	_done.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_done.add_theme_constant_override("separation", 10)
	_done.visible = false
	var tick := TickIcon.new()
	_done.add_child(tick)
	_done_label = UIStyle.label("", 22, UIStyle.TEAL_DARK)
	_done.add_child(_done_label)
	col.add_child(_done)
	_help = UIStyle.button("?", false)
	_help.name = "HelpButton"
	_help.custom_minimum_size = Vector2(60, 60)
	_help.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_help.focus_mode = Control.FOCUS_NONE   # the help action (H / Y) is the keyboard/gamepad route
	_help.tooltip_text = ""
	_help.pressed.connect(func(): help_requested.emit())
	# "?" and Minimize stacked (the card is no wider than before).
	var buttons := VBoxContainer.new()
	buttons.name = "CardButtons"
	buttons.mouse_filter = Control.MOUSE_FILTER_IGNORE
	buttons.add_theme_constant_override("separation", 8)
	buttons.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	buttons.add_child(_help)
	row.add_child(buttons)
	_toggle = _make_toggle("MinimizeButton", true, 60.0)
	_toggle.pressed.connect(minimize)
	buttons.add_child(_toggle)
	# The compact form: [goal pictures] [title, one line] [Expand].
	_compact = HBoxContainer.new()
	_compact.name = "CompactRow"
	_compact.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_compact.add_theme_constant_override("separation", 10)
	_compact.visible = false
	_mini_tick = TickIcon.new()
	_mini_tick.visible = false
	_compact.add_child(_mini_tick)
	_mini = MissionStrip.new(34.0)
	_mini.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_compact.add_child(_mini)
	_mini_title = UIStyle.label("", 20, UIStyle.INK)
	_mini_title.clip_text = true
	_mini_title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	_mini_title.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_compact.add_child(_mini_title)
	_expand = _make_toggle("ExpandButton", false, COMPACT_BUTTON)
	_expand.pressed.connect(expand)
	_compact.add_child(_expand)
	add_child(_compact)
	ObjectiveManager.objective_changed.connect(_refresh)
	ObjectiveManager.objective_completed.connect(_on_completed)
	Localization.locale_changed.connect(func(_l): _refresh())
	InputHints.device_changed.connect(func(_d): _refresh())
	Settings.changed.connect(func(k: String, _v: Variant) -> void:
		if k == "show_text":
			_refresh())
	_refresh()


func _refresh() -> void:
	# The mission as pictures (always, when the place gives some) and as
	# words (an optional layer). With words off and no pictures, the world
	# itself shows the way (beacons, a pointing guide, the trail of lights).
	var icons: Array = ObjectiveManager.icons()
	if icons.is_empty() and ObjectiveManager.has_objective():
		# On a guided mission: its goal picture when this step has none.
		icons = GuidedRoute.goal_icons_here()
	var words: bool = SupportProfile.show_text()
	# A finished goal is shown with its ✓ for a moment before whatever comes
	# next (a quest's goal always; another goal only when nothing follows).
	var finished_only: bool = _finishing and (_finishing_quest or not ObjectiveManager.has_objective())
	if finished_only:
		icons = _last_icons
	visible = (ObjectiveManager.has_objective() or finished_only) and not _held and not suppressed and (words or not icons.is_empty())
	if not visible:
		_shown_id = ""
		return
	if not finished_only and not _seen_ids.has(ObjectiveManager.objective_id):
		# A genuinely new mission: always shown in full.
		_seen_ids[ObjectiveManager.objective_id] = true
		_collapsed = false
	var key: String = InputHints.glyph("help")
	_title.text = Localization.t("objective.title") + ("   ·   %s %s" % [Localization.t("objective.help_hint"), key] if key != "" else "")
	var mkey: String = InputHints.glyph("mission")
	if mkey != "":
		_title.text += "   ·   %s %s" % [Localization.t("objective.minimize_hint"), mkey]
	_text.text = _last_text if finished_only else ObjectiveManager.text()
	_tip.text = ObjectiveManager.tip_text
	_tip.visible = not ObjectiveManager.tip_text.is_empty()
	strip.show_tokens(icons, _last_params if finished_only else ObjectiveManager.params)
	if not finished_only:
		_last_icons = icons.duplicate()
		_last_params = ObjectiveManager.params
		_last_text = _text.text
	strip.visible = not icons.is_empty()
	_refresh_route(words)
	_title.visible = words
	_text.visible = words
	_tip.visible = words and _tip.visible
	custom_minimum_size.x = 360.0 if words else 0.0
	_apply_collapsed(icons, words, finished_only)
	reset_size.call_deferred()
	if not finished_only and ObjectiveManager.objective_id != _shown_id:
		_shown_id = ObjectiveManager.objective_id
		_announce()


## "Mission 2 of 3" with the chapter's dots, while the guided route is on.
func _refresh_route(words: bool) -> void:
	var p: Dictionary = GuidedRoute.progress() if GuidedRoute.is_active() else {}
	_route.visible = not p.is_empty()
	if p.is_empty():
		_route_sig = ""
		return
	var sig: String = "%d/%d/%s/%s" % [p["index"], p["count"], words, Localization.current_locale]
	if sig == _route_sig:
		return
	_route_sig = sig
	for c in _route.get_children():
		c.queue_free()
	for i in int(p["count"]):
		_route.add_child(GuidedMissionCard.RouteDot.new(22.0, "done" if i < int(p["index"]) else ("now" if i == int(p["index"]) else "next")))
	if words:
		var l := UIStyle.label(Localization.t("guided.mission_of", {"n": int(p["index"]) + 1, "count": int(p["count"])}), UIStyle.TEXT_SMALL, UIStyle.TEAL_DARK)
		_route.add_child(l)


## Keeps the card hidden for a moment (while a place's name is shown on
## arrival), then shows it — with its chime — if there is a mission.
func hold(seconds: float) -> void:
	_held = true
	_hold_serial += 1
	var serial: int = _hold_serial
	_refresh()
	await get_tree().create_timer(seconds).timeout
	if serial == _hold_serial:
		_held = false
		_refresh()


## A new mission: soft chime and a short glow of the card's edge.
func _announce() -> void:
	AudioManager.play_sfx("hint", 1.0, -6.0)
	if Settings.reduced_motion:
		return
	var sb: StyleBoxFlat = get_theme_stylebox("panel") as StyleBoxFlat
	if sb == null:
		return
	var tw := create_tween()
	sb.border_color = Color("FFD86B")
	tw.tween_property(sb, "border_color", UIStyle.GOLD, 1.2)


## A mission step is done: "Done! Nice work." with a tick, a chime, the
## words read aloud (narration on), and a small pop of the card.
func _on_completed(id: String) -> void:
	_done_serial += 1
	var serial: int = _done_serial
	_finishing = true
	_finishing_quest = id.begins_with("quest:")
	_refresh()
	_done_label.text = Localization.t("objective.done")
	_done_label.visible = SupportProfile.show_text()
	_done.visible = true
	AudioManager.play_sfx("success", 1.0, -4.0)
	AudioManager.narrate(_done_label.text)
	if not Settings.reduced_motion and visible:
		pivot_offset = size * 0.5
		var tw := create_tween()
		tw.tween_property(self, "scale", Vector2.ONE * 1.06, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(self, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_SINE)
	await get_tree().create_timer(3.0).timeout
	if serial == _done_serial:
		_done.visible = false
		_finishing = false
		_finishing_quest = false
		_refresh()


## A drawn tick in a teal circle (a shape, readable without colour).
class TickIcon extends Control:
	func _init() -> void:
		custom_minimum_size = Vector2(30, 30)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		draw_circle(c, r, UIStyle.TEAL)
		draw_polyline(PackedVector2Array([c + Vector2(-r * 0.45, 0), c + Vector2(-r * 0.1, r * 0.38), c + Vector2(r * 0.5, -r * 0.35)]), Color.WHITE, 3.5, true)


func is_collapsed() -> bool:
	return _collapsed


## Minimize: the compact row (pictures, one-line title, Expand). Instant —
## no animation, no timer; the mission itself is untouched.
func minimize() -> void:
	if _collapsed:
		return
	_collapsed = true
	AudioManager.play_sfx("ui_click")
	_refresh()


## Expand: the full card again, exactly as it was.
func expand() -> void:
	if not _collapsed:
		return
	_collapsed = false
	AudioManager.play_sfx("ui_click")
	_refresh()


func toggle() -> void:
	if _collapsed:
		expand()
	else:
		minimize()


## M (keyboard) / Select (gamepad): only while exploring — never while a
## menu or panel has the focus, the same rule as the help control.
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("mission") and visible and UIFocus.visible_focus(get_viewport()) == null:
		get_viewport().set_input_as_handled()
		toggle()


## Shows the full card or the compact row; the compact row keeps to
## COMPACT_MAX_SHARE of the screen width (the title is cut with "…").
func _apply_collapsed(icons: Array, words: bool, finished_only: bool) -> void:
	_row.visible = not _collapsed
	_compact.visible = _collapsed
	add_theme_stylebox_override("panel", _style_compact if _collapsed else _style_full)
	if not _collapsed:
		return
	custom_minimum_size.x = 0.0
	var mini_icons: Array = icons.slice(0, 3)
	_mini.show_tokens(mini_icons, _last_params if finished_only else ObjectiveManager.params)
	_mini.visible = not mini_icons.is_empty()
	_mini_tick.visible = _finishing
	_mini_title.text = _text.text
	_mini_title.visible = words and not _mini_title.text.is_empty()
	if _mini_title.visible:
		var used: float = COMPACT_BUTTON + _style_compact.content_margin_left + _style_compact.content_margin_right + 30.0
		if _mini.visible:
			used += _mini.get_combined_minimum_size().x + 10.0
		if _mini_tick.visible:
			used += 40.0
		_mini_title.custom_minimum_size.x = clampf(get_viewport_rect().size.x * COMPACT_MAX_SHARE - used, 60.0, 280.0)


func _make_toggle(node_name: String, minimizing: bool, px: float) -> Button:
	var b := UIStyle.button("", false)
	b.name = node_name
	b.custom_minimum_size = Vector2(px, px)
	b.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	b.focus_mode = Control.FOCUS_NONE   # the mission control (M / Select) is the keyboard/gamepad route
	b.tooltip_text = Localization.t("objective.minimize" if minimizing else "objective.expand")
	b.set_meta("words", b.tooltip_text)
	var icon := ToggleIcon.new(minimizing)
	icon.set_anchors_preset(Control.PRESET_FULL_RECT)
	b.add_child(icon)
	return b


## Minimize: a chevron pointing up onto a bar (fold it away). Expand: a
## chevron pointing down over three text lines (open the mission). Two
## different shapes, readable without words or colour.
class ToggleIcon extends Control:
	var minimizing: bool = true

	func _init(m: bool) -> void:
		minimizing = m
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var s: float = minf(size.x, size.y) * 0.22
		var ink: Color = UIStyle.TEAL_DARK
		if minimizing:
			draw_line(c + Vector2(-s, -s * 1.1), c + Vector2(s, -s * 1.1), ink, 4.0, true)
			draw_polyline(PackedVector2Array([c + Vector2(-s, s * 0.9), c + Vector2(0, -s * 0.1), c + Vector2(s, s * 0.9)]), ink, 4.0, true)
		else:
			draw_polyline(PackedVector2Array([c + Vector2(-s, -s * 1.1), c + Vector2(0, -s * 0.1), c + Vector2(s, -s * 1.1)]), ink, 4.0, true)
			for i in 3:
				var y: float = s * (0.45 + 0.42 * i)
				draw_line(c + Vector2(-s, y), c + Vector2(s * (1.0 - 0.35 * i), y), ink, 3.0, true)
