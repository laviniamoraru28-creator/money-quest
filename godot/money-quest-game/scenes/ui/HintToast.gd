class_name HintToast
extends PanelContainer
## HintToast — a small, friendly offer of help at the bottom of the screen:
## "Need a little help?" with a "Show me" button (mouse/touch) and the
## help control shown for keyboard/gamepad (H / Y), which accepts the
## offer without moving focus away from walking. It never interrupts,
## never blocks input, and goes away by itself. Declining is fine — the
## help panel is always one press away.

signal accepted

var _text: Label
var _button: Button
var _serial: int = 0


func _ready() -> void:
	name = "HintToast"
	visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE   # only the button takes clicks
	anchor_left = 0.5
	anchor_right = 0.5
	anchor_top = 1.0
	anchor_bottom = 1.0
	grow_horizontal = Control.GROW_DIRECTION_BOTH
	grow_vertical = Control.GROW_DIRECTION_BEGIN
	offset_bottom = -30.0
	add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.GOLD, 20))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 18)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(row)
	_text = UIStyle.label("", UIStyle.TEXT)
	_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(_text)
	_button = UIStyle.button("")
	_button.name = "ShowMeButton"
	_button.focus_mode = Control.FOCUS_NONE
	_button.pressed.connect(func(): accept())
	row.add_child(_button)


func offer() -> void:
	var g: String = InputHints.glyph("help")
	_text.text = Localization.t("hint.need_help")
	_button.text = Localization.t("hint.show_me") + ("   " + g if g != "" and not InputHints.is_pointer() else "")
	visible = true
	reset_size()
	AudioManager.play_sfx("hint", 1.0, -4.0)
	_serial += 1
	var serial: int = _serial
	await get_tree().create_timer(9.0).timeout
	if serial == _serial:
		visible = false


func accept() -> void:
	if not visible:
		return
	visible = false
	_serial += 1
	accepted.emit()


func dismiss() -> void:
	visible = false
	_serial += 1
