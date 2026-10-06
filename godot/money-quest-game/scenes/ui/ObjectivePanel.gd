class_name ObjectivePanel
extends PanelContainer
## ObjectivePanel — the always-visible "MISSION" card under the top bar:
## the current objective in one short, large line (from ObjectiveManager),
## and a "?" button that opens the help panel (also: H on the keyboard, Y on
## a gamepad — shown on the card). Hidden when there is no objective.
## A new mission briefly lights the card's edge and plays a soft chime;
## with Reduced Motion it simply appears.

signal help_requested

var _title: Label
var _text: Label
var _tip: Label
var _help: Button
var _shown_id: String = ""
var _hold_serial: int = 0
var _held: bool = false


func _ready() -> void:
	name = "ObjectivePanel"
	# Clicks pass through the card to the world behind it (tap-to-move); only
	# the "?" button takes them.
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD))
	custom_minimum_size = Vector2(360, 0)
	var row := HBoxContainer.new()
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
	_text = UIStyle.label("", 26)
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.custom_minimum_size = Vector2(300, 0)
	col.add_child(_text)
	_tip = UIStyle.label("", 20, UIStyle.MUTED)
	_tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_tip.custom_minimum_size = Vector2(300, 0)
	col.add_child(_tip)
	_help = UIStyle.button("?", false)
	_help.name = "HelpButton"
	_help.custom_minimum_size = Vector2(60, 60)
	_help.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_help.focus_mode = Control.FOCUS_NONE   # the help action (H / Y) is the keyboard/gamepad route
	_help.tooltip_text = ""
	_help.pressed.connect(func(): help_requested.emit())
	row.add_child(_help)
	ObjectiveManager.objective_changed.connect(_refresh)
	Localization.locale_changed.connect(func(_l): _refresh())
	InputHints.device_changed.connect(func(_d): _refresh())
	_refresh()


func _refresh() -> void:
	visible = ObjectiveManager.has_objective() and not _held
	if not visible:
		_shown_id = ""
		return
	var key: String = InputHints.glyph("help")
	_title.text = Localization.t("objective.title") + ("   ·   %s %s" % [Localization.t("objective.help_hint"), key] if key != "" else "")
	_text.text = ObjectiveManager.text()
	_tip.text = ObjectiveManager.tip_text
	_tip.visible = not ObjectiveManager.tip_text.is_empty()
	if ObjectiveManager.objective_id != _shown_id:
		_shown_id = ObjectiveManager.objective_id
		_announce()


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
