class_name PictureChoice
extends RefCounted
## PictureChoice — one big choice button that shows its meaning as a
## picture (MissionStrip tokens) with its words beside it; with words off
## the picture alone fills the button. The same look as the picture
## answers in ChoicePanel: a thick gold ring for keyboard / gamepad focus
## and hover, so "where am I" is always visible, and a ✓ badge (a shape,
## not only a colour) on the picked one. The button's text stays the words
## (read aloud on focus; what tests and narration use).

const MIN_HEIGHT: float = 76.0


static func make(label_text: String, tokens: Array, px: float = 60.0, font_size: int = 0) -> Button:
	var button := UIStyle.button(label_text, false)
	button.custom_minimum_size = Vector2(0, MIN_HEIGHT)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if font_size > 0:
		button.add_theme_font_size_override("font_size", font_size)
	focus_ring(button)
	var words: bool = SupportProfile.show_text()
	if not tokens.is_empty():
		var size: float = px if words else px * 1.25
		var strip := MissionStrip.new(size)
		strip.name = "ChoicePicture"
		strip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		strip.show_tokens(tokens)
		button.add_child(strip)
		button.custom_minimum_size.y = maxf(MIN_HEIGHT, size + 16.0)
		var width: float = strip.get_combined_minimum_size().x
		if words:
			strip.set_anchors_preset(Control.PRESET_CENTER_LEFT)
			strip.offset_left = 12.0
			strip.offset_right = 12.0 + width
			strip.offset_top = -size * 0.5
			strip.offset_bottom = size * 0.5
			for state in ["normal", "hover", "pressed", "disabled", "focus"]:
				var sb: StyleBox = button.get_theme_stylebox(state)
				if sb:
					var sb2: StyleBox = sb.duplicate()
					sb2.content_margin_left = width + 24.0
					sb2.content_margin_right = 14.0
					button.add_theme_stylebox_override(state, sb2)
			button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		else:
			strip.set_anchors_preset(Control.PRESET_CENTER)
			strip.offset_left = -width * 0.5
			strip.offset_right = width * 0.5
			strip.offset_top = -size * 0.5
			strip.offset_bottom = size * 0.5
			button.custom_minimum_size.x = width + 40.0
			button.set_meta("words", label_text)
			button.text = ""
			button.tooltip_text = label_text
	var tick := MoneyIcons.Tick.new(30.0)
	tick.name = "PickedTick"
	tick.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tick.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	tick.offset_left = -38.0
	tick.offset_right = -6.0
	tick.offset_top = 6.0
	tick.offset_bottom = 38.0
	tick.visible = false
	button.add_child(tick)
	Narration.read_on_focus(button, label_text)
	return button


## The words a picture button stands for (its text, or — words off — kept
## aside in its meta).
static func words_of(button: Button) -> String:
	return String(button.get_meta("words", button.text))


## Marks a button as the picked one (or not): the ✓ badge and a gold edge.
static func set_picked(button: Button, picked: bool) -> void:
	var tick: Control = button.get_node_or_null("PickedTick")
	if tick:
		tick.visible = picked
	var sb: StyleBox = button.get_theme_stylebox("normal")
	if sb is StyleBoxFlat:
		var flat: StyleBoxFlat = (sb as StyleBoxFlat).duplicate()
		flat.border_color = UIStyle.GOLD if picked else UIStyle.TEAL_DARK
		flat.set_border_width_all(6 if picked else 3)
		button.add_theme_stylebox_override("normal", flat)


## An action button that works without words: with words off its text is
## replaced by a symbol — "next" (an arrow: continue / save & continue),
## "done" (a tick), "again" (the try-again circle) or "close" (a cross);
## with words on the words come back. Call it whenever the panel opens
## (after setting the text). Listen still says the words on focus.
static func action_symbol(button: Button, kind: String) -> void:
	if button.has_meta("words") and button.text.is_empty():
		pass
	elif not button.text.is_empty():
		button.set_meta("words", button.text)
	var old: Node = button.get_node_or_null("ActionSymbol")
	if old:
		old.queue_free()
		button.remove_child(old)
	if SupportProfile.show_text():
		button.text = String(button.get_meta("words", button.text))
		return
	button.text = ""
	var icon: Control
	match kind:
		"done":
			icon = MoneyIcons.Tick.new(34.0)
		"again":
			icon = MissionStrip.Glyph.new("retry", 40.0)
		"close":
			icon = MoneyIcons.Cross.new(30.0)
		"next":
			icon = MoneyIcons.Arrow.new(36.0)
		_:
			# Any picture of the shared visual language (eye, walk, …).
			icon = MissionStrip.Glyph.new(kind, 40.0)
	if kind == "next" or kind == "close":
		# Dark-ink symbols sit on a cream round badge (like every other
		# picture), so they show on any button — light, dark or disabled.
		var badge := Panel.new()
		var sb := StyleBoxFlat.new()
		sb.bg_color = UIStyle.CREAM
		sb.set_corner_radius_all(40)
		sb.border_color = UIStyle.INK
		sb.set_border_width_all(2)
		badge.add_theme_stylebox_override("panel", sb)
		var bs: float = icon.custom_minimum_size.x + 14.0
		badge.custom_minimum_size = Vector2(bs, bs)
		icon.set_anchors_preset(Control.PRESET_CENTER)
		icon.offset_left = -icon.custom_minimum_size.x * 0.5
		icon.offset_right = icon.custom_minimum_size.x * 0.5
		icon.offset_top = -icon.custom_minimum_size.y * 0.5
		icon.offset_bottom = icon.custom_minimum_size.y * 0.5
		icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		badge.add_child(icon)
		icon = badge
	icon.name = "ActionSymbol"
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.set_anchors_preset(Control.PRESET_CENTER)
	var s: Vector2 = icon.custom_minimum_size
	icon.offset_left = -s.x * 0.5
	icon.offset_right = s.x * 0.5
	icon.offset_top = -s.y * 0.5
	icon.offset_bottom = s.y * 0.5
	button.add_child(icon)
	button.custom_minimum_size.x = maxf(button.custom_minimum_size.x, 96.0)
	if not button.has_meta("mq_read"):
		Narration.read_on_focus(button, String(button.get_meta("words", "")))


## A clear "you are here" ring for keyboard / gamepad focus and mouse hover.
static func focus_ring(button: Button) -> void:
	var ring := StyleBoxFlat.new()
	ring.draw_center = false
	ring.set_corner_radius_all(16)
	ring.border_color = UIStyle.GOLD
	ring.set_border_width_all(6)
	ring.expand_margin_left = 4
	ring.expand_margin_right = 4
	ring.expand_margin_top = 4
	ring.expand_margin_bottom = 4
	button.add_theme_stylebox_override("focus", ring)
