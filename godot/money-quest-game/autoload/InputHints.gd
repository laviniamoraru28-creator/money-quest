extends Node
## InputHints — which kind of controller the child is using right now
## (keyboard, mouse, gamepad or touch), so every prompt can name the right
## control: "Talk  E", "Talk  A", "Talk  Click"... It follows the most
## recent input, so switching from the keyboard to a gamepad mid-game
## changes the prompts straight away. Never consumes input.
##
## Words like "Click" or "Left stick" come from Localization; key names
## (E, H, Esc) and gamepad button letters are shown as-is.

signal device_changed(device: String)

const KEYBOARD := "keyboard"
const MOUSE := "mouse"
const GAMEPAD := "gamepad"
const TOUCH := "touch"

## Per action: keyboard (physical keys — shown with the labels of the
## player's own keyboard layout, so AZERTY shows ZQSD), gamepad button,
## mouse hint, touch hint (translation keys; "" = none).
const GLYPHS: Dictionary = {
	"interact": [[KEY_E], "A", "hint.click", "hint.tap"],
	"help": [[KEY_H], "Y", "", ""],
	"listen": [[KEY_L], "X", "", ""],
	"back": [[KEY_ESCAPE], "B", "", ""],
	"confirm": [[KEY_ENTER], "A", "hint.click", "hint.tap"],
	"move": [[KEY_W, KEY_A, KEY_S, KEY_D], "hint.left_stick", "hint.click_floor", "hint.tap_floor"],
	"camera": [[KEY_Z, KEY_X], "hint.right_stick", "hint.right_drag", ""],
}

var device: String = KEYBOARD


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if Input.get_connected_joypads().size() > 0:
		device = GAMEPAD


func _input(event: InputEvent) -> void:
	var d: String = device
	if event is InputEventKey and event.pressed:
		d = KEYBOARD
	elif event is InputEventMouseButton and event.pressed:
		d = MOUSE
	elif event is InputEventScreenTouch and event.pressed:
		d = TOUCH
	elif event is InputEventJoypadButton and event.pressed:
		d = GAMEPAD
	elif event is InputEventJoypadMotion and absf(event.axis_value) > 0.5:
		d = GAMEPAD
	if d != device:
		device = d
		device_changed.emit(device)


## The control to show for `action` on the current device ("E", "A",
## "Click"...), or "" when that device has no single control for it.
func glyph(action: String) -> String:
	if not GLYPHS.has(action):
		return ""
	var g: Array = GLYPHS[action]
	var s: String
	match device:
		GAMEPAD:
			s = g[1]
		MOUSE:
			if g[2] == "":
				return _keys(action, g[0])
			s = g[2]
		TOUCH:
			s = g[3]
		_:
			return _keys(action, g[0])
	return Localization.t(s) if s.begins_with("hint.") else s


func _keys(action: String, keys: Array) -> String:
	var labels: PackedStringArray = []
	for k in keys:
		labels.append(key_label(k))
	if action == "move":
		return Localization.t("hint.keys_move", {"keys": "".join(labels)})
	return " / ".join(labels)


## The label printed on the player's own keyboard for a physical key.
static func key_label(physical: Key) -> String:
	var code: Key = DisplayServer.keyboard_get_keycode_from_physical(physical)
	var s: String = OS.get_keycode_string(code if code != KEY_NONE else physical)
	return "Esc" if s == "Escape" else s


## "Talk  [E]"-style text for an on-screen prompt.
func prompt(label: String, action: String = "interact") -> String:
	var g: String = glyph(action)
	return label if g.is_empty() else "%s   %s" % [label, g]


func is_pointer() -> bool:
	return device == MOUSE or device == TOUCH
