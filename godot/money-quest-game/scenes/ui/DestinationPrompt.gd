class_name DestinationPrompt
extends PanelContainer
## DestinationPrompt — the big "you can go in here" card shown at the
## bottom-centre whenever the player is in reach of an important place's
## entrance (a portal whose target is in Destinations):
##
##     [emblem]  MONEY QUEST
##               GOLDEN VAULT
##               Learn how saving makes your money grow
##               [ E ]  Enter Golden Vault
##
## Deliberately different from the small cream NPC "Talk" pill: a dark,
## high-contrast card in a fixed place, with the place's emblem (shape, not
## only colour), its name, what it is for, and the exact control for the
## current device (InputHints — E, A, Click or Tap). The whole card can be
## clicked or tapped. A locked place says so on the card instead of
## offering to enter. It slides up gently, or simply appears with Reduced
## Motion. Read aloud on arrival when narration is on; Listen repeats it.
## Larger text sizes are handled by UIScale like the rest of the HUD; the
## card's width follows the screen and its text wraps.

signal pressed

const INK := Color("1C2624")
const CREAM := Color("FBF8EF")
const MAX_WIDTH: float = 660.0

var zone_id: String = ""
var locked: bool = false

var _icon: DestinationIcon
var _district: Label
var _title: Label
var _purpose: Label
var _key: Label
var _action: Label
var _key_box: PanelContainer
var _style: StyleBoxFlat
var _tween: Tween
var bottom_margin: float = 24.0


func _ready() -> void:
	name = "DestinationPrompt"
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_style = StyleBoxFlat.new()
	_style.bg_color = Color(INK, 0.94)
	_style.set_corner_radius_all(22)
	_style.set_border_width_all(4)
	_style.border_width_bottom = 8
	_style.border_color = UIStyle.GOLD
	_style.content_margin_left = 22
	_style.content_margin_right = 28
	_style.content_margin_top = 14
	_style.content_margin_bottom = 16
	add_theme_stylebox_override("panel", _style)

	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 20)
	add_child(row)
	_icon = DestinationIcon.new()
	_icon.custom_minimum_size = Vector2(96, 96)
	_icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(_icon)
	var col := VBoxContainer.new()
	col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 2)
	row.add_child(col)
	_district = _make_label(UIStyle.TEXT_SMALL, UIStyle.GOLD)
	col.add_child(_district)
	_title = _make_label(38, Color.WHITE)
	_title.add_theme_color_override("font_outline_color", INK)
	col.add_child(_title)
	_purpose = _make_label(UIStyle.TEXT - 2, Color("E9E4D6"))
	_purpose.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	col.add_child(_purpose)

	# The control to press, in a key-cap box, then what it does.
	var act := HBoxContainer.new()
	act.mouse_filter = Control.MOUSE_FILTER_IGNORE
	act.add_theme_constant_override("separation", 14)
	col.add_child(act)
	_key_box = PanelContainer.new()
	_key_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var ksb := StyleBoxFlat.new()
	ksb.bg_color = CREAM
	ksb.set_corner_radius_all(10)
	ksb.border_color = UIStyle.GOLD
	ksb.border_width_bottom = 5
	ksb.content_margin_left = 14
	ksb.content_margin_right = 14
	ksb.content_margin_top = 2
	ksb.content_margin_bottom = 2
	_key_box.add_theme_stylebox_override("panel", ksb)
	act.add_child(_key_box)
	_key = _make_label(UIStyle.BUTTON + 2, INK)
	_key_box.add_child(_key)
	_action = _make_label(UIStyle.BUTTON + 4, Color.WHITE)
	_action.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	act.add_child(_action)

	gui_input.connect(_on_gui_input)
	InputHints.device_changed.connect(func(_d): _refresh_texts())
	Localization.locale_changed.connect(func(_l): _refresh_texts())


func _make_label(size: int, color: Color) -> Label:
	var l := Label.new()
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


## Shows the card for `p_zone_id` (does nothing if it is already showing it).
func show_for(p_zone_id: String, p_locked: bool) -> void:
	if visible and zone_id == p_zone_id and locked == p_locked:
		return
	var fresh: bool = not visible or zone_id != p_zone_id
	zone_id = p_zone_id
	locked = p_locked
	_icon.icon = Destinations.icon(zone_id)
	_icon.accent = Destinations.accent(zone_id)
	_style.border_color = Destinations.accent(zone_id).lightened(0.1)
	_refresh_texts()
	visible = true
	place()
	if fresh:
		_appear()
		AudioManager.narrate(listen_text())


func hide_prompt() -> void:
	if not visible:
		return
	visible = false
	zone_id = ""
	if _tween:
		_tween.kill()


func _refresh_texts() -> void:
	if zone_id.is_empty():
		return
	var place: String = Destinations.title(zone_id)
	var district: String = Destinations.district(zone_id)
	_district.text = district.to_upper()
	_district.visible = not district.is_empty()
	_title.text = place.to_upper()
	# A locked place says so in words (and a "LOCKED" tag where the control
	# would be) rather than offering to go in.
	_purpose.text = Localization.t("interaction.locked") if locked else Destinations.purpose(zone_id)
	_purpose.visible = not _purpose.text.is_empty()
	var g: String = Localization.t("place.locked").to_upper() if locked else InputHints.glyph("interact")
	_key.text = g
	_key_box.visible = not g.is_empty()
	_action.text = "" if locked else Localization.t("place.enter_action", {"place": place})
	_action.visible = not locked


## Sizes and places the card: bottom-centre, `bottom` px above the screen's
## lower edge. Its width follows the (scaled) screen — never wider than the
## screen minus a margin — so Large / Extra Large text and narrow phone
## screens wrap the purpose line instead of running off the edge.
func place(bottom: float = -1.0) -> void:
	if bottom >= 0.0:
		bottom_margin = bottom
	bottom = bottom_margin
	if not is_inside_tree():
		return
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var w: float = minf(MAX_WIDTH, vp.x - 32.0)
	custom_minimum_size.x = w
	_purpose.custom_minimum_size.x = maxf(w - 96.0 - 20.0 - 50.0, 120.0)
	_purpose.size.x = _purpose.custom_minimum_size.x
	reset_size()
	position = Vector2(roundf((vp.x - size.x) * 0.5), vp.y - bottom - size.y)


func _appear() -> void:
	if _tween:
		_tween.kill()
	if Settings.reduced_motion:
		modulate.a = 1.0
		return
	modulate.a = 0.0
	_tween = create_tween()
	_tween.tween_property(self, "modulate:a", 1.0, 0.25)


func _on_gui_input(event: InputEvent) -> void:
	var click: bool = event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT
	var tap: bool = event is InputEventScreenTouch and event.pressed
	if click or tap:
		accept_event()
		pressed.emit()


## What Listen reads (and what is read on arrival when narration is on).
func listen_text() -> String:
	if zone_id.is_empty():
		return ""
	var parts: PackedStringArray = []
	parts.append(Destinations.title(zone_id))
	if not _purpose.text.is_empty():
		parts.append(_purpose.text)
	if not locked:
		parts.append(_action.text)
	return ". ".join(parts)
