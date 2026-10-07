extends CanvasLayer
## SettingsMenu — a reusable overlay reached from MainMenu and from the
## in-world HUD alike (see MainMenu.gd and HUD.gd's settings buttons), so
## the same controls are available whether or not a save file or avatar
## exists yet. Instantiated on demand by whoever opens it and freed on
## "Back" — not an autoload, since every opener already has a direct node
## reference to add a child to (get_tree().current_scene).
##
## CanvasLayer at layer 13 — above HUD (9), DialogueBox (10), ChoicePanel
## (11), and RewardPopup (12) — so Settings always renders on top of
## whatever was on screen when it was opened.
##
## Four short sections, in a scrolling card (follows keyboard/gamepad
## focus), every change applied and saved at once:
##   Help and comfort — reduce motion, subtitles, read text aloud, hints
##   Text and screen  — text size (Small / Medium / Large / Extra large)
##   Sound            — main volume, mute, music, effects, voice, ambient
##   Camera           — turning speed, smooth camera, field of view
## "Read text aloud" is only offered where the device has a voice for the
## current language; otherwise it says so (never a control that does
## nothing).

var title_label: Label
var reduced_motion_check: CheckButton
var subtitles_check: CheckButton
var narration_check: CheckButton
var hints_check: CheckButton
var focus_check: CheckButton
var show_text_check: CheckButton
var scale_buttons: Dictionary = {}     # scale id -> Button
var master_slider: HSlider
var mute_check: CheckButton
var music_slider: HSlider
var sfx_slider: HSlider
var voice_slider: HSlider
var ambient_slider: HSlider
var camera_speed_slider: HSlider
var smoothing_check: CheckButton
var fov_slider: HSlider
var back_button: Button

var _return_focus: Control = null
var _pointer_last: bool = false


func _ready() -> void:
	_return_focus = get_viewport().gui_get_focus_owner()
	var dim := ColorRect.new()
	dim.name = "Dim"
	dim.color = Color(0, 0, 0, 0.5)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	add_child(margin)
	var center := CenterContainer.new()
	margin.add_child(center)
	var card := PanelContainer.new()
	card.name = "Panel"
	card.add_theme_stylebox_override("panel", UIStyle.panel(UIStyle.TEAL, 22))
	center.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	card.add_child(v)
	title_label = UIStyle.label(Localization.t("settings.title"), UIStyle.TITLE, UIStyle.TEAL_DARK)
	v.add_child(title_label)
	var scroll := ScrollContainer.new()
	scroll.name = "Scroll"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	scroll.custom_minimum_size = Vector2(700, 0)
	v.add_child(scroll)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 10)
	scroll.add_child(list)

	_section(list, "settings.section_comfort")
	reduced_motion_check = _check(list, "settings.reduced_motion_label", Settings.reduced_motion, Settings.set_reduced_motion)
	subtitles_check = _check(list, "settings.subtitles_label", Settings.subtitles, func(on): Settings.set_value("subtitles", on))
	narration_check = _check(list, "settings.narration_label", Settings.narration, func(on): Settings.set_value("narration", on))
	if not AudioManager.can_narrate():
		narration_check.disabled = true
		narration_check.button_pressed = false
		narration_check.focus_mode = Control.FOCUS_NONE
		var note := UIStyle.label(Localization.t("settings.narration_unavailable"), 18, UIStyle.MUTED)
		list.add_child(note)
	hints_check = _check(list, "settings.hints_label", Settings.hints, func(on): Settings.set_value("hints", on))
	focus_check = _check(list, "settings.focus_mode_label", Settings.focus_mode, func(on): Settings.set_value("focus_mode", on))
	var focus_note := UIStyle.label(Localization.t("settings.focus_mode_hint"), 18, UIStyle.MUTED)
	focus_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	list.add_child(focus_note)

	_section(list, "settings.section_text")
	var row := _row(list, "settings.ui_scale_label")
	var group := ButtonGroup.new()
	for id in ["small", "medium", "large", "xlarge"]:
		var b := UIStyle.button(Localization.t("settings.ui_scale." + id), false)
		b.name = "Scale_" + id
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = Settings.ui_scale == id
		b.custom_minimum_size = Vector2(0, 52)
		b.add_theme_font_size_override("font_size", 20)
		var pressed_sb: StyleBoxFlat = (b.get_theme_stylebox("normal") as StyleBoxFlat).duplicate()
		pressed_sb.bg_color = UIStyle.GOLD
		b.add_theme_stylebox_override("pressed", pressed_sb)
		b.pressed.connect(func(): Settings.set_value("ui_scale", id))
		row.add_child(b)
		scale_buttons[id] = b

	# Universal Play & Learn: how much support, how strong the pointing,
	# and whether words are shown (never needed to play).
	_section(list, "settings.section_support")
	show_text_check = _check(list, "settings.show_text_label", Settings.show_text, func(on): Settings.set_value("show_text", on))
	_choice_row(list, "settings.guidance_label", "visual_guidance", ["strong", "normal", "light"], Settings.visual_guidance)
	_choice_row(list, "settings.support_level_label", "support_level", [0, 1, 2, 3, 4], Settings.support_level)

	_section(list, "settings.section_sound")
	master_slider = _slider(list, "settings.master_volume_label", Settings.master_volume, 0.0, 1.0, func(x): Settings.set_value("master_volume", x))
	mute_check = _check(list, "settings.mute_label", Settings.sound_muted, func(on): Settings.set_value("sound_muted", on))
	music_slider = _slider(list, "settings.music_volume_label", Settings.music_volume, 0.0, 1.0, Settings.set_music_volume)
	sfx_slider = _slider(list, "settings.sfx_volume_label", Settings.sfx_volume, 0.0, 1.0, Settings.set_sfx_volume)
	voice_slider = _slider(list, "settings.voice_volume_label", Settings.voice_volume, 0.0, 1.0, Settings.set_voice_volume)
	ambient_slider = _slider(list, "settings.ambient_volume_label", Settings.ambient_volume, 0.0, 1.0, Settings.set_ambient_volume)

	_section(list, "settings.section_camera")
	camera_speed_slider = _slider(list, "settings.camera_speed_label", Settings.camera_sensitivity, 0.25, 3.0, func(x): Settings.set_value("camera_sensitivity", x))
	smoothing_check = _check(list, "settings.camera_smoothing_label", Settings.camera_smoothing, func(on): Settings.set_value("camera_smoothing", on))
	fov_slider = _slider(list, "settings.fov_label", Settings.camera_fov, 55.0, 85.0, func(x): Settings.set_value("camera_fov", x))
	fov_slider.step = 1.0

	back_button = UIStyle.button(Localization.t("settings.back_button"))
	back_button.name = "BackButton"
	back_button.custom_minimum_size = Vector2(260, 64)
	back_button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	back_button.pressed.connect(queue_free)
	v.add_child(back_button)
	_fit_height.call_deferred(scroll)
	get_viewport().size_changed.connect(func(): _fit_height(scroll))
	# Keyboard/gamepad users start on the first setting (see UIFocus), and
	# get focus back where they were (the HUD or main-menu Settings button)
	# when Settings closes — unless they used the mouse/touch, whose
	# behaviour stays exactly as before.
	UIFocus.focus(reduced_motion_check)


## The card never grows past the screen: the list scrolls instead.
func _fit_height(scroll: ScrollContainer) -> void:
	if not is_instance_valid(scroll):
		return
	var vp: Vector2 = get_viewport().get_visible_rect().size
	scroll.custom_minimum_size.y = maxf(200.0, vp.y - 260.0)


func _section(parent: Container, key: String) -> void:
	var l := UIStyle.label(Localization.t(key), 22, UIStyle.TEAL_DARK)
	l.add_theme_constant_override("line_spacing", 4)
	parent.add_child(HSeparator.new())
	parent.add_child(l)


func _row(parent: Container, key: String) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	var l := UIStyle.label(Localization.t(key), 22)
	l.custom_minimum_size = Vector2(250, 0)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(l)
	parent.add_child(row)
	return row


func _check(parent: Container, key: String, value: bool, setter: Callable) -> CheckButton:
	var row := _row(parent, key)
	var c := CheckButton.new()
	c.button_pressed = value
	c.custom_minimum_size = Vector2(0, 48)
	c.toggled.connect(setter)
	row.add_child(c)
	return c


func _slider(parent: Container, key: String, value: float, lo: float, hi: float, setter: Callable) -> HSlider:
	var row := _row(parent, key)
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = (hi - lo) / 20.0
	s.value = value
	s.custom_minimum_size = Vector2(300, 40)
	s.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	s.value_changed.connect(setter)
	row.add_child(s)
	return s


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton or event is InputEventScreenTouch:
		_pointer_last = true
	elif event is InputEventKey or event is InputEventJoypadButton:
		_pointer_last = false


## Back (gamepad B or Escape) closes Settings, like the Back button.
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		queue_free()


func _exit_tree() -> void:
	if not _pointer_last and is_instance_valid(_return_focus) and _return_focus.is_inside_tree():
		_return_focus.grab_focus.call_deferred()


## A row of toggle buttons for one setting (one pressed at a time).
func _choice_row(parent: Container, label_key: String, key: String, values: Array, current: Variant) -> void:
	var row := _row(parent, label_key)
	var group := ButtonGroup.new()
	for v in values:
		var b := UIStyle.button(Localization.t("settings.%s.%s" % [key, str(v)]), false)
		b.name = "%s_%s" % [key, str(v)]
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = current == v
		b.custom_minimum_size = Vector2(0, 52)
		b.add_theme_font_size_override("font_size", 20)
		var pressed_sb: StyleBoxFlat = (b.get_theme_stylebox("normal") as StyleBoxFlat).duplicate()
		pressed_sb.bg_color = UIStyle.GOLD
		b.add_theme_stylebox_override("pressed", pressed_sb)
		b.pressed.connect(func(): Settings.set_value(key, v))
		row.add_child(b)
