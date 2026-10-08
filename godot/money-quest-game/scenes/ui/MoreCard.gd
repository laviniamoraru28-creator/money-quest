class_name MoreCard
extends CanvasLayer
## MoreCard — layers 2 and 3 of a topic (InfoLayers), only ever opened by
## choice:
##
##   [topic picture]  ISA                         (the local name)
##   One or two short sentences.                  (layer 2)
##   [🔊 Listen]  [📖 More]  [Library]  [Close]
##   ...the longer explanation...                 (layer 3, after "More")
##
## Nothing here is needed to play. Listen reads what is shown; "Keep in the
## Library" puts the topic on the Library's shelf of kept topics. Escape /
## B closes. Keyboard and gamepad start on Listen (or More when no voice).

signal closed

var topic: String = ""
var deep_box: VBoxContainer
var more_button: Button
var keep_button: Button
var close_button: Button
var _short: Label
var _return_focus: Control


func _ready() -> void:
	layer = 12
	name = "MoreCard"
	add_to_group("mq_more_card")
	_return_focus = get_viewport().gui_get_focus_owner()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.4)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	card.custom_minimum_size = Vector2(620, 0)
	center.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	card.add_child(v)
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 12)
	head.add_child(MissionStrip.Glyph.new(InfoLayers.icon(topic), 64.0))
	var title := UIStyle.label(Localization.t(InfoLayers.title_key(topic)), UIStyle.TITLE, UIStyle.TEAL_DARK)
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	head.add_child(title)
	v.add_child(head)
	_short = UIStyle.label(Localization.t(InfoLayers.short_key(topic)), UIStyle.TEXT)
	_short.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_short.custom_minimum_size = Vector2(580, 0)
	v.add_child(_short)
	# Layer 3: hidden until asked for, scrollable.
	var scroll := ScrollContainer.new()
	scroll.name = "Deep"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(0, minf(300.0, get_viewport().get_visible_rect().size.y - 340.0))
	scroll.visible = false
	v.add_child(scroll)
	deep_box = VBoxContainer.new()
	deep_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	deep_box.add_theme_constant_override("separation", 10)
	scroll.add_child(deep_box)
	for k in InfoLayers.deep_keys(topic):
		var l := UIStyle.label(Localization.t(String(k)), 20)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(560, 0)
		deep_box.add_child(l)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(row)
	var listen := Narration.listen_button()
	row.add_child(listen)
	more_button = UIStyle.button(Localization.t("more.more"), false)
	more_button.name = "MoreButton"
	more_button.visible = deep_box.get_child_count() > 0
	more_button.pressed.connect(func() -> void:
		scroll.visible = not scroll.visible)
	row.add_child(more_button)
	keep_button = UIStyle.button(Localization.t("more.keep"), false)
	keep_button.name = "KeepButton"
	keep_button.pressed.connect(func() -> void:
		InfoLayers.keep_in_library(topic)
		keep_button.disabled = true
		keep_button.text = Localization.t("more.kept")
		AudioManager.play_sfx("success", 1.0, -8.0))
	keep_button.disabled = InfoLayers.kept_topics().has(topic)
	if keep_button.disabled:
		keep_button.text = Localization.t("more.kept")
	row.add_child(keep_button)
	close_button = UIStyle.button(Localization.t("common.close_button"), true)
	close_button.name = "CloseButton"
	close_button.pressed.connect(close)
	row.add_child(close_button)
	AudioManager.play_sfx("ui_open", 1.0, -4.0)
	UIFocus.focus(listen if listen.visible else (more_button if more_button.visible else close_button))


## What Listen reads: what is shown (layer 2, and layer 3 once opened).
func listen_text() -> String:
	var parts: PackedStringArray = [Localization.t(InfoLayers.title_key(topic)), _short.text]
	if deep_box.get_parent().visible:
		for l in deep_box.get_children():
			parts.append((l as Label).text)
	return ". ".join(parts)


func close() -> void:
	closed.emit()
	queue_free()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()


func _exit_tree() -> void:
	if is_instance_valid(_return_focus) and _return_focus.is_inside_tree():
		_return_focus.grab_focus.call_deferred()
