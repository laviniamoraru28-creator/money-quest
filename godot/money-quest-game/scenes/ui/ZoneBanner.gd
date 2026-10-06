class_name ZoneBanner
extends PanelContainer
## ZoneBanner — "Where am I?": the place's name (and a short tagline, when
## it has one) shown large at the top-centre for a few seconds whenever the
## player arrives somewhere. Fades in and out; with Reduced Motion it
## simply appears and disappears. Never blocks input.
##
## Important places (Destinations) get the full orientation banner, the
## same words and emblem as the sign over their door and the entry card:
##     [emblem]  YOU ARE ENTERING
##               GOLDEN VAULT
##               Learn how saving makes your money grow

## How long the name stays up (the mission card appears right after).
const SHOW_SECONDS: float = 3.2

var _kicker: Label
var _icon: DestinationIcon
var _name: Label
var _tag: Label
var _serial: int = 0


func _ready() -> void:
	name = "ZoneBanner"
	visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	anchor_left = 0.5
	anchor_right = 0.5
	anchor_top = 0.0
	grow_horizontal = Control.GROW_DIRECTION_BOTH
	offset_top = 96.0
	var sb := UIStyle.panel(UIStyle.GOLD, 26)
	sb.border_width_left = 3
	sb.border_width_bottom = 8
	sb.content_margin_left = 40
	sb.content_margin_right = 40
	add_theme_stylebox_override("panel", sb)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 18)
	add_child(row)
	_icon = DestinationIcon.new()
	_icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(_icon)
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(v)
	_kicker = UIStyle.label("", UIStyle.TEXT_SMALL, UIStyle.MUTED)
	_kicker.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_kicker)
	_name = UIStyle.label("", 44, UIStyle.TEAL_DARK)
	_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_name)
	_tag = UIStyle.label("", UIStyle.TEXT, UIStyle.MUTED)
	_tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_tag)


func show_zone(zone: ZoneData) -> void:
	var place: bool = Destinations.has(zone.zone_id)
	_kicker.text = Localization.t("place.entering").to_upper()
	_icon.visible = place
	var tag: String
	if place:
		_name.text = Destinations.title(zone.zone_id).to_upper()
		tag = Destinations.purpose(zone.zone_id)
		_icon.icon = Destinations.icon(zone.zone_id)
		_icon.accent = Destinations.accent(zone.zone_id)
	else:
		_name.text = Localization.t(zone.display_name_key)
		var tag_key: String = zone.display_name_key.trim_suffix(".name") + ".tagline"
		tag = Localization.t(tag_key) if TranslationServer.translate(tag_key) != tag_key else ""
	_tag.text = tag
	_tag.visible = not tag.is_empty()
	if place:
		AudioManager.narrate(". ".join(PackedStringArray([Localization.t("place.entering"), Destinations.title(zone.zone_id), tag])))
	_serial += 1
	var serial: int = _serial
	visible = true
	reset_size()
	if Settings.reduced_motion:
		modulate.a = 1.0
	else:
		modulate.a = 0.0
		create_tween().tween_property(self, "modulate:a", 1.0, 0.5)
	await get_tree().create_timer(SHOW_SECONDS - 0.4).timeout
	if serial != _serial:
		return
	if not Settings.reduced_motion:
		var tw := create_tween()
		tw.tween_property(self, "modulate:a", 0.0, 0.4)
		await tw.finished
	if serial == _serial:
		visible = false
