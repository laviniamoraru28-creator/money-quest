class_name MoneyIcons
extends RefCounted
## MoneyIcons — the shared picture language for money, so amounts can be
## understood without reading (Universal Play & Learn):
##
##   Coin      one gold coin (the symbol of "money" everywhere in the game)
##   Pips      N coins in rows of five — a price you can count, or your
##             coins against a price: filled = coins you have, hollow =
##             coins still missing (prices up to 10 are drawn coin by coin;
##             larger amounts show one coin and the number)
##   Arrow     "becomes" / "goes to" (before → after), or "back"
##   Bag       "yours" — where bought things go
##   Tick      "yes / done"
##   Cross     "close"
##
## Shapes with a dark outline — never colour alone — and sized for touch
## when used inside buttons. All are Controls that only draw.

const INK := Color("1C2624")
const GOLD := Color("E8A33D")
const GOLD_DEEP := Color("C98A2B")
const CREAM := Color("FBF8EF")
const TEAL := Color("0F7A6B")


static func draw_coin(ci: CanvasItem, c: Vector2, r: float, hollow: bool = false) -> void:
	ci.draw_circle(c, r, INK)
	if hollow:
		ci.draw_circle(c, r - 2.0, CREAM)
		ci.draw_arc(c, r - 5.0, 0, TAU, 20, Color(INK, 0.35), 1.5)
		return
	ci.draw_circle(c, r - 2.0, GOLD)
	ci.draw_circle(c, (r - 2.0) * 0.62, GOLD_DEEP)
	ci.draw_circle(c, (r - 2.0) * 0.45, GOLD)


class Coin extends Control:
	func _init(px: float = 28.0) -> void:
		custom_minimum_size = Vector2(px, px)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		MoneyIcons.draw_coin(self, size * 0.5, minf(size.x, size.y) * 0.5)


## `filled` gold coins followed by `hollow` empty ones (the gap).
class Pips extends Control:
	const MAX_DRAWN: int = 10
	var filled: int = 0:
		set(v):
			filled = maxi(v, 0)
			_resize()
	var hollow: int = 0:
		set(v):
			hollow = maxi(v, 0)
			_resize()
	var coin_px: float = 18.0:
		set(v):
			coin_px = v
			_resize()

	func _init() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func total() -> int:
		return filled + hollow

	func _resize() -> void:
		var n: int = mini(total(), MAX_DRAWN)
		var cols: int = mini(n, 5)
		var rows: int = int(ceil(n / 5.0))
		var step: float = coin_px * 1.08
		custom_minimum_size = Vector2(maxf(cols, 1) * step + 4.0, maxf(rows, 1) * step + 2.0) if total() <= MAX_DRAWN else Vector2(coin_px + 4.0, coin_px + 2.0)
		queue_redraw()
		update_minimum_size()

	func _draw() -> void:
		var r: float = coin_px * 0.5
		var step: float = coin_px * 1.08
		if total() > MAX_DRAWN:
			MoneyIcons.draw_coin(self, Vector2(r + 2.0, r + 1.0), r, filled == 0)
			return
		for i in total():
			var c := Vector2(2.0 + r + (i % 5) * step, 1.0 + r + (i / 5) * step)
			MoneyIcons.draw_coin(self, c, r, i >= filled)


class Arrow extends Control:
	var back: bool = false

	func _init(px: float = 28.0, p_back: bool = false) -> void:
		custom_minimum_size = Vector2(px, px)
		back = p_back
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.42
		var d: float = -1.0 if back else 1.0
		draw_line(c - Vector2(r * d, 0), c + Vector2(r * 0.6 * d, 0), INK, 4.0)
		draw_colored_polygon(PackedVector2Array([c + Vector2(r * d, 0), c + Vector2(r * 0.25 * d, -r * 0.6), c + Vector2(r * 0.25 * d, r * 0.6)]), INK)


class Bag extends Control:
	func _init(px: float = 32.0) -> void:
		custom_minimum_size = Vector2(px, px)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var u: float = minf(size.x, size.y) * 0.5
		draw_arc(c + Vector2(0, -u * 0.25), u * 0.38, PI, TAU, 14, INK, 3.0)
		var body := Rect2(c + Vector2(-u * 0.75, -u * 0.25), Vector2(u * 1.5, u * 1.1))
		draw_rect(body, GOLD)
		draw_rect(body, INK, false, 2.5)


class Tick extends Control:
	func _init(px: float = 28.0) -> void:
		custom_minimum_size = Vector2(px, px)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		draw_circle(c, r, TEAL)
		draw_polyline(PackedVector2Array([c + Vector2(-r * 0.45, 0), c + Vector2(-r * 0.1, r * 0.38), c + Vector2(r * 0.5, -r * 0.35)]), Color.WHITE, 3.5, true)


class Cross extends Control:
	func _init(px: float = 24.0) -> void:
		custom_minimum_size = Vector2(px, px)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.32
		draw_line(c + Vector2(-r, -r), c + Vector2(r, r), INK, 4.0)
		draw_line(c + Vector2(r, -r), c + Vector2(-r, r), INK, 4.0)


## A price (or any amount) as pictures + number (+ words when shown):
## [coins] 3 [virtual coins]. `have` (optional, >= 0) shows the child's own
## coins against it: filled = what they have, hollow = what is missing.
class PriceView extends HBoxContainer:
	var pips: Pips
	var number: Label
	var words: Label

	func _init() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_theme_constant_override("separation", 8)
		pips = Pips.new()
		pips.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		add_child(pips)
		number = Label.new()
		number.add_theme_font_size_override("font_size", 22)
		number.add_theme_color_override("font_color", INK)
		number.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		add_child(number)
		words = Label.new()
		words.add_theme_font_size_override("font_size", 18)
		words.add_theme_color_override("font_color", Color("4A5653"))
		words.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		add_child(words)

	func set_amount(amount: int, have: int = -1, coin_px: float = 18.0) -> void:
		pips.coin_px = coin_px
		if have >= 0:
			pips.filled = mini(have, amount)
			pips.hollow = maxi(amount - have, 0)
		else:
			pips.filled = amount
			pips.hollow = 0
		number.text = str(amount)
		words.text = Localization.tn("money.virtual_coins", amount).replace(str(amount), "").strip_edges()
		words.visible = SupportProfile.show_text()
