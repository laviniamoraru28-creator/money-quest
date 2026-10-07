class_name HelpPanel
extends CanvasLayer
## HelpPanel — "What am I doing?". Opened from the mission card's "?"
## button or the help control (H / Y). One calm screen with short lines:
## where you are, your mission, other things you can try, the ways out of
## this place, and the controls for the device you are using right now.
## "Show me the way" lights a trail to the current mission (GuidanceSystem);
## "Back to the start" brings the player to the start of this place (never
## stuck, whatever happened).
## Close / Escape / B closes it. Nothing here is required to play.

signal show_way_requested

var _show_way: Button
var _close: Button
var _return_focus: Control
var _spoken: PackedStringArray = []


func _ready() -> void:
	layer = 12
	name = "HelpPanel"
	_return_focus = get_viewport().gui_get_focus_owner()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.45)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	card.custom_minimum_size = Vector2(640, 0)
	center.add_child(card)
	# Title on top, the lines in a scroll area, the buttons always visible
	# at the bottom (never scrolled away).
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 12)
	card.add_child(outer)
	outer.add_child(UIStyle.label(Localization.t("help.title"), UIStyle.TITLE, UIStyle.TEAL_DARK))
	# The mission as pictures first (readable without words).
	if ObjectiveManager.has_objective() and not ObjectiveManager.icons().is_empty():
		var strip := MissionStrip.new(60.0)
		strip.show_tokens(ObjectiveManager.icons(), ObjectiveManager.params)
		outer.add_child(strip)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)
	scroll.custom_minimum_size = Vector2(0, maxf(160.0, get_viewport().get_visible_rect().size.y - 300.0))
	var v := VBoxContainer.new()
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_theme_constant_override("separation", 8)
	scroll.add_child(v)

	var zone: ZoneData = WorldManager.get_zone(WorldManager.current_zone_id)
	if zone:
		_line(v, "help.you_are_in", Destinations.title(zone.zone_id) if Destinations.has(zone.zone_id) else Localization.t(zone.display_name_key))
	if ObjectiveManager.has_objective():
		_line(v, "help.mission", ObjectiveManager.text())
	var extra: PackedStringArray = ObjectiveManager.optional_texts()
	if extra.size() > 0:
		_line(v, "help.also_try", "\n".join(Array(extra).map(func(s): return "•  " + s)))
	if ObjectiveManager.learned.size() > 0:
		_line(v, "help.learned", "\n".join(ObjectiveManager.learned.map(func(k): return "•  " + Localization.t(k))))
	var exits: PackedStringArray = _exits()
	if exits.size() > 0:
		_line(v, "help.ways_out", "\n".join(Array(exits).map(func(s): return "•  " + s)))
	var controls: PackedStringArray = []
	for pair in [["move", "help.control_move"], ["camera", "help.control_camera"], ["interact", "help.control_talk"], ["help", "help.control_help"], ["listen", "help.control_listen"]]:
		var g: String = InputHints.glyph(pair[0])
		if g != "":
			controls.append("•  %s:  %s" % [Localization.t(pair[1]), g])
	_line(v, "help.controls", "\n".join(controls))

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	outer.add_child(row)
	_show_way = UIStyle.button(Localization.t("help.show_way"))
	_show_way.name = "ShowWayButton"
	_show_way.visible = ObjectiveManager.target() != null
	_show_way.pressed.connect(_on_show_way)
	row.add_child(_show_way)
	# The place's picture intro, again.
	if ObjectiveManager.intro_available:
		var again := UIStyle.button(Localization.t("help.show_intro"), false)
		again.name = "ShowIntroButton"
		again.pressed.connect(func() -> void:
			close()
			ObjectiveManager.intro_requested.emit())
		row.add_child(again)
	# Stuck somewhere? Always one press away from the start of this place.
	var restart := UIStyle.button(Localization.t("help.back_to_start"), false)
	restart.name = "BackToStartButton"
	restart.pressed.connect(_on_back_to_start)
	row.add_child(restart)
	_close = UIStyle.button(Localization.t("common.close_button"), false)
	_close.name = "CloseButton"
	_close.pressed.connect(close)
	row.add_child(_close)
	AudioManager.play_sfx("ui_open", 1.0, -4.0)
	UIFocus.focus(_show_way if _show_way.visible else _close)


func _line(parent: Container, heading_key: String, text: String) -> void:
	_spoken.append("%s: %s" % [Localization.t(heading_key), text.replace("•  ", "")])
	parent.add_child(UIStyle.label(Localization.t(heading_key), UIStyle.TEXT_SMALL, UIStyle.TEAL_DARK))
	var l := UIStyle.label(text, UIStyle.TEXT)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(560, 0)
	parent.add_child(l)


## The current zone's portals, by their own (localized) names.
func _exits() -> PackedStringArray:
	var out := PackedStringArray()
	for p in get_tree().get_nodes_in_group("player"):
		if p.is_queued_for_deletion():
			continue
		var zone: Node = p.get_parent()
		for n in zone.find_children("*", "Area3D", true, false):
			if n is PortalInteraction and not n.label_key.is_empty():
				out.append(Localization.t(n.label_key))
	return out


## What the Listen control reads: the whole help page.
func listen_text() -> String:
	return ". ".join(_spoken)


func _on_show_way() -> void:
	show_way_requested.emit()
	close()


func _on_back_to_start() -> void:
	for p in get_tree().get_nodes_in_group("player"):
		if not p.is_queued_for_deletion() and p.get("safety"):
			p.safety.recover_to_start()
	close()


func close() -> void:
	AudioManager.play_sfx("ui_back", 1.0, -6.0)
	queue_free()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("help"):
		get_viewport().set_input_as_handled()
		close()


func _exit_tree() -> void:
	if is_instance_valid(_return_focus) and _return_focus.is_inside_tree():
		_return_focus.grab_focus.call_deferred()
