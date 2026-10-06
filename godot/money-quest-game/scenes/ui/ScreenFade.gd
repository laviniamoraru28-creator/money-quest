class_name ScreenFade
extends ColorRect
## ScreenFade — a short, soft fade to a calm colour with one friendly line
## ("Let's try that again!"), used when the player is brought back to safe
## ground. With Reduced Motion the colour simply appears and disappears.

var _label: Label


func _ready() -> void:
	name = "ScreenFade"
	color = Color("0B5C50")
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	modulate.a = 0.0
	visible = false
	_label = UIStyle.label("", 40, Color.WHITE)
	_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(_label)


## Fades in, waits for `midpoint` (e.g. the teleport) to run, fades out.
func play(text: String, midpoint: Callable) -> void:
	_label.text = text
	visible = true
	if Settings.reduced_motion:
		modulate.a = 1.0
	else:
		var tin := create_tween()
		tin.tween_property(self, "modulate:a", 1.0, 0.35)
		await tin.finished
	midpoint.call()
	await get_tree().create_timer(0.9).timeout
	if Settings.reduced_motion:
		modulate.a = 0.0
	else:
		var tout := create_tween()
		tout.tween_property(self, "modulate:a", 0.0, 0.45)
		await tout.finished
	visible = false
