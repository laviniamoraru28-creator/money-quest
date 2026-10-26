extends CanvasLayer
## RotateHint — "Turn your device sideways" (owner approval 2026-10-21).
##
## Shown only on a touch screen whose window is taller than it is wide (a
## phone or tablet held upright), where the landscape game would be tiny.
## It covers the game and blocks taps while shown, and hides by itself as
## soon as the device is turned. Nothing is paused, reset or changed: the
## game keeps its exact state underneath. Reduced Motion shows a still
## picture (upright phone -> arrow -> sideways phone) instead of a turning
## phone, and the message is read aloud when narration is on.

const LAYER := 100
## Sized to fit the 1280 x 720 game canvas with margin: picture 300 +
## gap 20 + at most two 80-px lines (~220) stays well under 720.
const TEXT_SIZE := 80
const TEXT_WIDTH := 1000.0

var _root: Control
var _icon: _PhoneIcon
var _label: Label
var _tween: Tween
var _shown := false


func _ready() -> void:
	layer = LAYER
	process_mode = Node.PROCESS_MODE_ALWAYS
	_root = Control.new()
	_root.name = "RotateHintRoot"
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_STOP
	var bg := ColorRect.new()
	bg.color = UIStyle.CREAM
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_STOP
	_root.add_child(bg)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 20)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_icon = _PhoneIcon.new()
	_icon.name = "RotateHintIcon"
	_icon.custom_minimum_size = Vector2(560, 300)
	_icon.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label = UIStyle.label(Localization.t("rotate_hint.message"), TEXT_SIZE, UIStyle.INK)
	_label.name = "RotateHintLabel"
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	# Wrapped inside a fixed width: one long line is wider than the screen.
	_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_label.custom_minimum_size = Vector2(TEXT_WIDTH, 0)
	_label.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	box.add_child(_icon)
	box.add_child(_label)
	_root.add_child(box)
	add_child(_root)
	visible = false
	get_tree().root.size_changed.connect(_update)
	Settings.reduced_motion_changed.connect(func(_v: bool) -> void:
		if _shown:
			_apply_motion())
	Localization.locale_changed.connect(func(_l: String) -> void:
		_label.text = Localization.t("rotate_hint.message"))
	_update.call_deferred()


## True when the hint should cover the game: an upright touch screen.
static func should_show(window_size: Vector2i, touch: bool) -> bool:
	return touch and window_size.x > 0 and window_size.y > window_size.x


func is_shown() -> bool:
	return _shown


func _update() -> void:
	var show := should_show(DisplayServer.window_get_size(), DisplayServer.is_touchscreen_available())
	if show == _shown:
		return
	_shown = show
	visible = show
	if show:
		_apply_motion()
		AudioManager.narrate(_label.text)
	else:
		_stop_motion()


func _apply_motion() -> void:
	_stop_motion()
	_icon.animated = not Settings.reduced_motion
	_icon.angle = 0.0
	_icon.queue_redraw()
	if not _icon.animated:
		return
	_tween = create_tween().set_loops()
	_tween.tween_interval(0.5)
	_tween.tween_property(_icon, "angle", -PI / 2.0, 1.2).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_tween.tween_interval(0.9)
	_tween.tween_callback(func() -> void: _icon.angle = 0.0)


func _stop_motion() -> void:
	if _tween:
		_tween.kill()
		_tween = null


## The picture: a phone with a turning arrow. Animated = one phone that
## turns; still (Reduced Motion) = upright phone -> arrow -> sideways phone.
class _PhoneIcon extends Control:
	var animated := true
	var angle := 0.0:
		set(v):
			angle = v
			queue_redraw()

	func _draw() -> void:
		var c := size / 2.0
		if animated:
			draw_set_transform(c, angle, Vector2.ONE)
			_phone(Vector2.ZERO, false)
			draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			_arrow(c + Vector2(150, -40), 70.0)
		else:
			_phone(c + Vector2(-170, 0), false)
			_arrow(c + Vector2(0, -10), 60.0)
			_phone(c + Vector2(170, 0), true)

	func _phone(center: Vector2, sideways: bool) -> void:
		var s := Vector2(220, 130) if sideways else Vector2(130, 220)
		var r := Rect2(center - s / 2.0, s)
		var body := StyleBoxFlat.new()
		body.bg_color = UIStyle.TEAL
		body.set_corner_radius_all(22)
		body.draw(get_canvas_item(), r)
		var screen := StyleBoxFlat.new()
		screen.bg_color = UIStyle.CREAM
		screen.set_corner_radius_all(10)
		screen.draw(get_canvas_item(), r.grow(-14))
		var dot := center + (Vector2(s.x / 2.0 - 8, 0) if sideways else Vector2(0, s.y / 2.0 - 8))
		draw_circle(dot, 5.0, UIStyle.CREAM)

	func _arrow(center: Vector2, radius: float) -> void:
		draw_arc(center, radius, -PI * 0.95, -PI * 0.15, 32, UIStyle.GOLD, 14.0, true)
		var tip := center + Vector2(cos(-PI * 0.15), sin(-PI * 0.15)) * radius
		var dir := Vector2(-sin(-PI * 0.15), cos(-PI * 0.15))
		var side := Vector2(dir.y, -dir.x)
		draw_colored_polygon(PackedVector2Array([tip + dir * 26.0, tip - side * 22.0, tip + side * 22.0]), UIStyle.GOLD)
