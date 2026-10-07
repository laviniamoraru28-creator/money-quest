class_name PurposeGlyphs
extends RefCounted
## PurposeGlyphs — the pictures for what money (and time) can be used for,
## drawn on the same cream badge as every MissionStrip glyph: jar (save),
## book (learn), tools (create / fix), heart (help), sprout (improve),
## flowers (an improved place), play (enjoy), box (stock), bulb (an idea),
## question ("what will you do?"). Shapes with dark outlines, never
## colour alone. Used by MissionStrip.Glyph, so every token works on the
## mission card, in Help, in intros and on the purpose choice card.

const INK := MoneyIcons.INK
const CREAM := MoneyIcons.CREAM
const GOLD := MoneyIcons.GOLD
const TEAL := MoneyIcons.TEAL
const CORAL := Color("F07A5A")
const LEAF := Color("5FA35A")
const SKY := Color("6FA8DC")
const WOOD := Color("B9824F")
const PINK := Color("E58FB5")


## Draws `kind` centred on `c` (unit `u` = a quarter of the badge). False
## when the kind is not a purpose glyph.
static func draw(ci: CanvasItem, kind: String, c: Vector2, u: float) -> bool:
	match kind:
		"jar":
			var body := Rect2(c + Vector2(-u * 0.75, -u * 0.55), Vector2(u * 1.5, u * 1.5))
			ci.draw_rect(body, Color(0.85, 0.94, 0.97))
			ci.draw_rect(Rect2(body.position + Vector2(0, u * 0.7), Vector2(u * 1.5, u * 0.8)), GOLD)
			ci.draw_rect(body, INK, false, 2.5)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.95), Vector2(u * 1.1, u * 0.4)), WOOD)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.95), Vector2(u * 1.1, u * 0.4)), INK, false, 2.0)
			ci.draw_line(c + Vector2(-u * 0.2, -u * 0.8), c + Vector2(u * 0.2, -u * 0.8), INK, 2.5)
		"book":
			# An open book.
			for side in [-1.0, 1.0]:
				var pts := PackedVector2Array([c + Vector2(0, -u * 0.55), c + Vector2(side * u * 1.1, -u * 0.75), c + Vector2(side * u * 1.1, u * 0.65), c + Vector2(0, u * 0.85)])
				ci.draw_colored_polygon(pts, Color.WHITE)
				pts.append(pts[0])
				ci.draw_polyline(pts, INK, 2.5)
				for i in 3:
					var y: float = -u * 0.3 + i * u * 0.32
					ci.draw_line(c + Vector2(side * u * 0.25, y), c + Vector2(side * u * 0.85, y - u * 0.08), Color(INK, 0.5), 1.5)
			ci.draw_rect(Rect2(c + Vector2(-u * 1.1, u * 0.65), Vector2(u * 2.2, u * 0.25)), SKY)
		"tools":
			# A hammer and a spanner, crossed.
			ci.draw_line(c + Vector2(-u * 0.8, u * 0.85), c + Vector2(u * 0.55, -u * 0.5), WOOD, u * 0.28)
			ci.draw_rect(Rect2(c + Vector2(u * 0.15, -u * 1.0), Vector2(u * 0.85, u * 0.45)), Color("8A9BA8"))
			ci.draw_rect(Rect2(c + Vector2(u * 0.15, -u * 1.0), Vector2(u * 0.85, u * 0.45)), INK, false, 2.0)
			ci.draw_line(c + Vector2(u * 0.8, u * 0.85), c + Vector2(-u * 0.45, -u * 0.4), Color("8A9BA8"), u * 0.26)
			ci.draw_arc(c + Vector2(-u * 0.6, -u * 0.6), u * 0.3, 0.6, 5.4, 12, Color("8A9BA8"), u * 0.2)
		"heart":
			var pts2 := PackedVector2Array()
			for i in 33:
				var t: float = TAU * i / 32.0
				var x: float = 16.0 * pow(sin(t), 3)
				var y: float = -(13.0 * cos(t) - 5.0 * cos(2 * t) - 2.0 * cos(3 * t) - cos(4 * t))
				pts2.append(c + Vector2(x, y) * u * 0.062 + Vector2(0, u * 0.1))
			ci.draw_colored_polygon(pts2, CORAL)
			ci.draw_polyline(pts2, INK, 2.5)
		"sprout":
			ci.draw_rect(Rect2(c + Vector2(-u * 0.9, u * 0.45), Vector2(u * 1.8, u * 0.5)), Color("7A5434"))
			ci.draw_line(c + Vector2(0, u * 0.5), c + Vector2(0, -u * 0.35), LEAF, 3.5)
			for side in [-1.0, 1.0]:
				var leaf := PackedVector2Array([c + Vector2(0, -u * 0.2), c + Vector2(side * u * 0.75, -u * 0.75), c + Vector2(side * u * 0.2, -u * 0.95)])
				ci.draw_colored_polygon(leaf, LEAF)
				leaf.append(leaf[0])
				ci.draw_polyline(leaf, INK, 2.0)
		"flowers":
			ci.draw_rect(Rect2(c + Vector2(-u * 1.0, u * 0.5), Vector2(u * 2.0, u * 0.45)), Color("7A5434"))
			var cols := [CORAL, GOLD, PINK]
			for i in 3:
				var p: Vector2 = c + Vector2((i - 1) * u * 0.65, -u * 0.25 + absf(i - 1) * u * 0.25)
				ci.draw_line(p, Vector2(p.x, c.y + u * 0.5), LEAF, 2.5)
				for k in 5:
					var a: float = TAU * k / 5.0
					ci.draw_circle(p + Vector2(cos(a), sin(a)) * u * 0.22, u * 0.17, cols[i])
				ci.draw_circle(p, u * 0.12, INK)
		"play":
			# A ball (enjoy / play).
			ci.draw_circle(c, u * 0.9, INK)
			ci.draw_circle(c, u * 0.82, CORAL)
			ci.draw_arc(c, u * 0.82, -0.6, 0.6, 10, Color.WHITE, u * 0.22)
			ci.draw_arc(c, u * 0.82, PI - 0.6, PI + 0.6, 10, Color.WHITE, u * 0.22)
		"box":
			var b := Rect2(c + Vector2(-u * 0.85, -u * 0.5), Vector2(u * 1.7, u * 1.3))
			ci.draw_rect(b, Color("C9A26B"))
			ci.draw_rect(b, INK, false, 2.5)
			ci.draw_colored_polygon(PackedVector2Array([b.position, b.position + Vector2(u * 0.3, -u * 0.4), Vector2(b.end.x + u * 0.3, b.position.y - u * 0.4), Vector2(b.end.x, b.position.y)]), Color("E0BE8A"))
			ci.draw_line(c + Vector2(0, -u * 0.5), c + Vector2(0, u * 0.8), INK, 2.0)
		"bulb":
			ci.draw_circle(c + Vector2(0, -u * 0.2), u * 0.7, INK)
			ci.draw_circle(c + Vector2(0, -u * 0.2), u * 0.62, Color("FFE07A"))
			ci.draw_rect(Rect2(c + Vector2(-u * 0.32, u * 0.45), Vector2(u * 0.64, u * 0.45)), Color("8A9BA8"))
			ci.draw_rect(Rect2(c + Vector2(-u * 0.32, u * 0.45), Vector2(u * 0.64, u * 0.45)), INK, false, 2.0)
		"question":
			ci.draw_arc(c + Vector2(0, -u * 0.35), u * 0.45, PI, TAU + PI * 0.4, 16, INK, u * 0.22)
			ci.draw_line(c + Vector2(u * 0.15, u * 0.05), c + Vector2(0, u * 0.35), INK, u * 0.22)
			ci.draw_circle(c + Vector2(0, u * 0.75), u * 0.14, INK)
		_:
			return false
	return true
