class_name SubtitleLine
extends PanelContainer
## SubtitleLine — on-screen text for short spoken lines that are not
## already written somewhere else (an NPC calling "Over here!", a "Well
## done!"). Shown while Settings.subtitles is on (the default), above the
## bottom of the screen, for a time that grows with the length of the line.
## Dialogue and the mission card are already text, so they never repeat
## here.

var _label: Label
var _serial: int = 0


func _ready() -> void:
	name = "SubtitleLine"
	visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	anchor_left = 0.5
	anchor_right = 0.5
	anchor_top = 1.0
	anchor_bottom = 1.0
	grow_horizontal = Control.GROW_DIRECTION_BOTH
	grow_vertical = Control.GROW_DIRECTION_BEGIN
	offset_bottom = -120.0
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(UIStyle.INK, 0.86)
	sb.set_corner_radius_all(14)
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	add_theme_stylebox_override("panel", sb)
	_label = UIStyle.label("", UIStyle.TEXT, Color.WHITE)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_label)
	AudioManager.subtitle_requested.connect(show_line)
	set_process(false)


func show_line(text: String, speaker: String = "") -> void:
	# Subtitles are words: with words off (Universal Play & Learn) they step
	# aside — nothing they say is ever needed to play.
	if not Settings.subtitles or text.is_empty() or not SupportProfile.show_text():
		return
	set_process(true)
	_label.text = ("%s:  %s" % [speaker, text]) if speaker != "" else text
	visible = true
	reset_size()
	offset_top = offset_bottom - get_combined_minimum_size().y
	_serial += 1
	var serial: int = _serial
	await get_tree().create_timer(2.5 + 0.06 * text.length()).timeout
	if serial == _serial:
		visible = false
		set_process(false)


## A panel (dialogue, choice, reward, a character's card) opening takes
## over the screen: the subtitle steps aside rather than covering it.
func _process(_delta: float) -> void:
	var card: Variant = get_parent().get("_card")
	if DialogueBox.visible or ChoicePanel.visible or RewardPopup.visible or (card != null and card.is_open()) or not get_tree().get_nodes_in_group("mq_purpose_card").is_empty():
		visible = false
		set_process(false)
