class_name UIStyle
extends RefCounted
## UIStyle — the shared look of Money Quest World's interface panels:
## warm cream cards with dark ink text (strong contrast), rounded corners,
## a coloured accent edge, generous padding and large, child-readable text.
## Sizes are the base size; the player's UI size setting scales everything.

const CREAM := Color("FBF8EF")
const INK := Color("1C2624")
const TEAL := Color("0F7A6B")
const TEAL_DARK := Color("0B5C50")
const GOLD := Color("E8A33D")
const MUTED := Color("4A5653")

const TEXT := 24          # body text
const TEXT_SMALL := 18    # labels such as "MISSION"
const TITLE := 30
const BUTTON := 22
const BUTTON_HEIGHT := 60


static func panel(accent: Color = TEAL, radius: int = 18, alpha: float = 1.0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(CREAM, alpha)
	sb.set_corner_radius_all(radius)
	sb.border_color = accent
	sb.set_border_width_all(3)
	sb.border_width_left = 8
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 14
	sb.content_margin_bottom = 14
	sb.shadow_color = Color(0, 0, 0, 0.18)
	sb.shadow_size = 6
	return sb


static func label(text: String, size: int = TEXT, color: Color = INK) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


## A large, high-contrast button (teal with white text; focus ring from
## the project theme).
static func button(text: String, primary: bool = true) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, BUTTON_HEIGHT)
	b.add_theme_font_size_override("font_size", BUTTON)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var sb := StyleBoxFlat.new()
		var base: Color = TEAL if primary else CREAM
		if state == "hover":
			base = base.lightened(0.08)
		elif state == "pressed":
			base = base.darkened(0.12)
		sb.bg_color = base
		sb.set_corner_radius_all(14)
		sb.border_color = TEAL_DARK
		sb.set_border_width_all(0 if primary else 3)
		sb.content_margin_left = 22
		sb.content_margin_right = 22
		b.add_theme_stylebox_override(state, sb)
	var fg: Color = Color.WHITE if primary else INK
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		b.add_theme_color_override(c, fg)
	return b
