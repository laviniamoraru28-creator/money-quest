class_name Symbols
extends RefCounted
## Symbols — Money Quest World's visual language: one picture for each
## idea, used the same way everywhere (mission cards, choice cards, outcome
## cards, What if?, intros, the world). A child learns a symbol once and
## meets it again in every place. Text is never needed to read a symbol.
##
## MEANING maps an idea to its token (a MissionStrip token: drawn by
## MoneyIcons, PurposeGlyphs or here). Code should ask for the idea
## (Symbols.token("save")) rather than hard-coding a picture, so the
## language stays consistent and can evolve in one place.
##
## Drawn here: bank, card, warning, growth, loss, compare, retry, lock,
## unlock, clock, calendar, flag (goal), shield (protected / tax-free),
## vault, piggy, bike, bike_broken, tree. Same style as every glyph: a
## cream badge, dark outlines, shape before colour.

const MEANING: Dictionary = {
	"money": "coin",
	"coins": "coins",
	"earn": "coin",
	"save": "jar",
	"piggy": "piggy",
	"spend": "stall",
	"shop": "stall",
	"yours": "bag",
	"learn": "book",
	"create": "tools",
	"build": "tools",
	"help": "heart",
	"improve": "sprout",
	"enjoy": "play",
	"idea": "bulb",
	"goal": "flag",
	"bank": "bank",
	"card": "card",
	"warning": "warning",
	"risk": "warning",
	"growth": "growth",
	"loss": "loss",
	"compare": "compare",
	"choose": "choose",
	"try_again": "retry",
	"locked": "lock",
	"open": "unlock",
	"time": "clock",
	"years": "calendar",
	"protected": "shield",
	"vault": "vault",
	"yes": "tick",
	"look": "eye",
	"go": "walk",
	"you": "you",
	"question": "question",
}


static func token(meaning: String) -> String:
	return MEANING.get(meaning, meaning)


const INK := MoneyIcons.INK
const CREAM := MoneyIcons.CREAM
const GOLD := MoneyIcons.GOLD
const TEAL := MoneyIcons.TEAL
const CORAL := Color("F07A5A")
const LEAF := Color("5FA35A")
const SKY := Color("6FA8DC")
const STONE := Color("C9CED6")
const STEEL := Color("8A9BA8")
const PINK := Color("F2A7B8")


## Draws `kind` centred on `c` (unit `u`). False when unknown.
static func draw(ci: CanvasItem, kind: String, c: Vector2, u: float) -> bool:
	match kind:
		"bank":
			var roof := PackedVector2Array([c + Vector2(-u * 1.1, -u * 0.35), c + Vector2(0, -u * 1.05), c + Vector2(u * 1.1, -u * 0.35)])
			ci.draw_colored_polygon(roof, STONE)
			roof.append(roof[0])
			ci.draw_polyline(roof, INK, 2.5)
			for i in 4:
				var x: float = -u * 0.75 + i * u * 0.5
				ci.draw_rect(Rect2(c + Vector2(x - u * 0.1, -u * 0.25), Vector2(u * 0.2, u * 0.85)), STONE)
				ci.draw_rect(Rect2(c + Vector2(x - u * 0.1, -u * 0.25), Vector2(u * 0.2, u * 0.85)), INK, false, 1.5)
			ci.draw_rect(Rect2(c + Vector2(-u * 1.0, u * 0.6), Vector2(u * 2.0, u * 0.3)), STONE)
			ci.draw_rect(Rect2(c + Vector2(-u * 1.0, u * 0.6), Vector2(u * 2.0, u * 0.3)), INK, false, 2.0)
			MoneyIcons.draw_coin(ci, c + Vector2(0, -u * 0.5), u * 0.2)
		"card":
			var r := Rect2(c + Vector2(-u * 1.05, -u * 0.65), Vector2(u * 2.1, u * 1.3))
			ci.draw_rect(r, SKY)
			ci.draw_rect(Rect2(r.position + Vector2(0, u * 0.25), Vector2(r.size.x, u * 0.25)), INK)
			ci.draw_rect(Rect2(r.position + Vector2(u * 0.2, u * 0.7), Vector2(u * 0.45, u * 0.35)), GOLD)
			ci.draw_rect(r, INK, false, 2.5)
		"warning":
			var t := PackedVector2Array([c + Vector2(0, -u * 1.0), c + Vector2(u * 1.05, u * 0.8), c + Vector2(-u * 1.05, u * 0.8)])
			ci.draw_colored_polygon(t, GOLD)
			t.append(t[0])
			ci.draw_polyline(t, INK, 3.0)
			ci.draw_line(c + Vector2(0, -u * 0.4), c + Vector2(0, u * 0.25), INK, u * 0.22)
			ci.draw_circle(c + Vector2(0, u * 0.52), u * 0.12, INK)
		"growth", "loss":
			var up: bool = kind == "growth"
			for i in 3:
				var h: float = u * (0.5 + i * 0.45) if up else u * (1.4 - i * 0.45)
				var r2 := Rect2(c + Vector2(-u * 0.95 + i * u * 0.65, u * 0.85 - h), Vector2(u * 0.5, h))
				ci.draw_rect(r2, LEAF if up else CORAL)
				ci.draw_rect(r2, INK, false, 2.0)
			var a: Vector2 = c + (Vector2(-u * 0.8, -u * 0.2) if up else Vector2(-u * 0.8, -u * 0.9))
			var b: Vector2 = c + (Vector2(u * 0.8, -u * 0.95) if up else Vector2(u * 0.8, -u * 0.15))
			ci.draw_line(a, b, INK, 3.0)
			var d: Vector2 = (b - a).normalized()
			var n := Vector2(-d.y, d.x)
			ci.draw_colored_polygon(PackedVector2Array([b + d * u * 0.2, b - d * u * 0.2 + n * u * 0.22, b - d * u * 0.2 - n * u * 0.22]), INK)
		"compare":
			# A balance: two pans on a beam.
			ci.draw_line(c + Vector2(0, -u * 0.8), c + Vector2(0, u * 0.8), INK, 3.0)
			ci.draw_line(c + Vector2(-u * 0.6, u * 0.85), c + Vector2(u * 0.6, u * 0.85), INK, 3.0)
			ci.draw_line(c + Vector2(-u * 1.0, -u * 0.55), c + Vector2(u * 1.0, -u * 0.55), INK, 3.0)
			for side in [-1.0, 1.0]:
				var p: Vector2 = c + Vector2(side * u * 0.8, -u * 0.55)
				ci.draw_line(p, p + Vector2(-u * 0.25, u * 0.6), INK, 1.5)
				ci.draw_line(p, p + Vector2(u * 0.25, u * 0.6), INK, 1.5)
				ci.draw_arc(p + Vector2(0, u * 0.6), u * 0.32, 0, PI, 10, GOLD, u * 0.18)
		"retry":
			ci.draw_arc(c, u * 0.75, PI * 0.15, PI * 1.75, 24, TEAL, u * 0.24)
			var tip: Vector2 = c + Vector2(cos(PI * 0.15), sin(PI * 0.15)) * u * 0.75
			ci.draw_colored_polygon(PackedVector2Array([tip + Vector2(-u * 0.38, -u * 0.05), tip + Vector2(u * 0.3, -u * 0.12), tip + Vector2(-u * 0.05, u * 0.42)]), TEAL)
		"lock", "unlock":
			var body := Rect2(c + Vector2(-u * 0.75, -u * 0.1), Vector2(u * 1.5, u * 1.05))
			if kind == "lock":
				ci.draw_arc(c + Vector2(0, -u * 0.1), u * 0.48, PI, TAU, 16, INK, u * 0.2)
			else:
				ci.draw_arc(c + Vector2(u * 0.55, -u * 0.35), u * 0.48, PI, TAU, 16, INK, u * 0.2)
			ci.draw_rect(body, GOLD)
			ci.draw_rect(body, INK, false, 2.5)
			ci.draw_circle(c + Vector2(0, u * 0.3), u * 0.14, INK)
			ci.draw_line(c + Vector2(0, u * 0.3), c + Vector2(0, u * 0.65), INK, 3.0)
		"clock":
			ci.draw_circle(c, u * 0.95, INK)
			ci.draw_circle(c, u * 0.82, Color.WHITE)
			for i in 12:
				var a2: float = TAU * i / 12.0
				ci.draw_line(c + Vector2(cos(a2), sin(a2)) * u * 0.68, c + Vector2(cos(a2), sin(a2)) * u * 0.8, INK, 1.5)
			ci.draw_line(c, c + Vector2(0, -u * 0.55), INK, 3.0)
			ci.draw_line(c, c + Vector2(u * 0.4, u * 0.1), INK, 3.0)
		"calendar":
			var p2 := Rect2(c + Vector2(-u * 0.9, -u * 0.75), Vector2(u * 1.8, u * 1.7))
			ci.draw_rect(p2, Color.WHITE)
			ci.draw_rect(Rect2(p2.position, Vector2(p2.size.x, u * 0.45)), CORAL)
			ci.draw_rect(p2, INK, false, 2.5)
			for x in [-0.45, 0.45]:
				ci.draw_line(c + Vector2(x * u, -u * 0.95), c + Vector2(x * u, -u * 0.55), INK, 3.0)
			for row in 2:
				for col in 3:
					ci.draw_rect(Rect2(c + Vector2(-u * 0.65 + col * u * 0.5, -u * 0.1 + row * u * 0.45), Vector2(u * 0.3, u * 0.28)), Color(INK, 0.35))
		"flag":
			ci.draw_line(c + Vector2(-u * 0.6, -u * 0.95), c + Vector2(-u * 0.6, u * 0.95), INK, 3.0)
			var f := PackedVector2Array([c + Vector2(-u * 0.6, -u * 0.95), c + Vector2(u * 0.85, -u * 0.6), c + Vector2(-u * 0.6, -u * 0.2)])
			ci.draw_colored_polygon(f, CORAL)
			f.append(f[0])
			ci.draw_polyline(f, INK, 2.0)
			ci.draw_line(c + Vector2(-u * 1.0, u * 0.95), c + Vector2(-u * 0.2, u * 0.95), INK, 3.0)
		"shield":
			var s := PackedVector2Array([c + Vector2(0, -u * 0.95), c + Vector2(u * 0.85, -u * 0.6), c + Vector2(u * 0.7, u * 0.3), c + Vector2(0, u * 0.95), c + Vector2(-u * 0.7, u * 0.3), c + Vector2(-u * 0.85, -u * 0.6)])
			ci.draw_colored_polygon(s, TEAL)
			s.append(s[0])
			ci.draw_polyline(s, INK, 2.5)
			ci.draw_polyline(PackedVector2Array([c + Vector2(-u * 0.35, 0), c + Vector2(-u * 0.05, u * 0.3), c + Vector2(u * 0.4, -u * 0.3)]), Color.WHITE, 3.0)
		"vault":
			ci.draw_rect(Rect2(c + Vector2(-u * 0.95, -u * 0.95), Vector2(u * 1.9, u * 1.9)), STEEL)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.95, -u * 0.95), Vector2(u * 1.9, u * 1.9)), INK, false, 2.5)
			ci.draw_circle(c, u * 0.6, INK)
			ci.draw_circle(c, u * 0.5, GOLD)
			for i in 4:
				var a3: float = TAU * i / 4.0 + PI * 0.25
				ci.draw_line(c, c + Vector2(cos(a3), sin(a3)) * u * 0.5, INK, 2.5)
			ci.draw_circle(c, u * 0.14, INK)
		"piggy":
			ci.draw_circle(c + Vector2(0, u * 0.1), u * 0.78, INK)
			ci.draw_circle(c + Vector2(0, u * 0.1), u * 0.7, PINK)
			ci.draw_circle(c + Vector2(u * 0.78, u * 0.15), u * 0.26, INK)
			ci.draw_circle(c + Vector2(u * 0.78, u * 0.15), u * 0.2, PINK.darkened(0.1))
			ci.draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 0.25, -u * 0.5), c + Vector2(0, -u * 0.95), c + Vector2(u * 0.2, -u * 0.5)]), PINK.darkened(0.15))
			ci.draw_line(c + Vector2(-u * 0.25, -u * 0.6), c + Vector2(u * 0.25, -u * 0.6), INK, 3.0)
			ci.draw_circle(c + Vector2(u * 0.35, -u * 0.15), u * 0.08, INK)
			for x in [-0.4, 0.3]:
				ci.draw_rect(Rect2(c + Vector2(x * u, u * 0.7), Vector2(u * 0.2, u * 0.25)), INK)
		"bike", "bike_broken":
			var broken: bool = kind == "bike_broken"
			ci.draw_arc(c + Vector2(-u * 0.6, u * 0.35), u * 0.42, 0, TAU, 20, INK, 3.0)
			if broken:
				ci.draw_arc(c + Vector2(u * 0.6, u * 0.35), u * 0.42, 0.9, TAU - 0.4, 18, INK, 3.0)
				ci.draw_polyline(PackedVector2Array([c + Vector2(u * 0.85, u * 0.05), c + Vector2(u * 1.0, u * 0.2), c + Vector2(u * 0.9, u * 0.35), c + Vector2(u * 1.05, u * 0.5)]), CORAL, 3.0)
			else:
				ci.draw_arc(c + Vector2(u * 0.6, u * 0.35), u * 0.42, 0, TAU, 20, INK, 3.0)
			ci.draw_polyline(PackedVector2Array([c + Vector2(-u * 0.6, u * 0.35), c + Vector2(-u * 0.1, -u * 0.25), c + Vector2(u * 0.45, -u * 0.25), c + Vector2(u * 0.6, u * 0.35)]), TEAL, 3.5)
			ci.draw_line(c + Vector2(-u * 0.1, -u * 0.25), c + Vector2(0, u * 0.35), TEAL, 3.5)
			ci.draw_line(c + Vector2(u * 0.45, -u * 0.25), c + Vector2(u * 0.35, -u * 0.55), INK, 3.0)
			ci.draw_line(c + Vector2(-u * 0.25, -u * 0.45), c + Vector2(u * 0.05, -u * 0.45), INK, 3.0)
		"tree":
			ci.draw_rect(Rect2(c + Vector2(-u * 0.12, u * 0.1), Vector2(u * 0.24, u * 0.85)), Color("7A5434"))
			ci.draw_circle(c + Vector2(0, -u * 0.3), u * 0.7, INK)
			ci.draw_circle(c + Vector2(0, -u * 0.3), u * 0.62, LEAF)
		"need":
			# A house (the same mark as the shop's "need" tag): what you must
			# have to live and stay safe.
			var roof := PackedVector2Array([c + Vector2(-u * 1.0, -u * 0.05), c + Vector2(0, -u * 0.95), c + Vector2(u * 1.0, -u * 0.05)])
			ci.draw_colored_polygon(roof, TEAL)
			roof.append(roof[0])
			ci.draw_polyline(roof, INK, 2.5)
			var body := Rect2(c + Vector2(-u * 0.72, -u * 0.05), Vector2(u * 1.44, u * 0.95))
			ci.draw_rect(body, TEAL)
			ci.draw_rect(body, INK, false, 2.5)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.18, u * 0.35), Vector2(u * 0.36, u * 0.55)), CREAM)
		"want":
			# A star (the same mark as the shop's "want" tag): nice to have.
			var s := PackedVector2Array()
			for i in 10:
				var a: float = -PI * 0.5 + TAU * i / 10.0
				s.append(c + Vector2(cos(a), sin(a)) * (u * 1.0 if i % 2 == 0 else u * 0.45))
			ci.draw_colored_polygon(s, GOLD)
			s.append(s[0])
			ci.draw_polyline(s, INK, 2.5)
			ci.draw_circle(c + Vector2(u * 0.85, -u * 0.8), u * 0.1, GOLD)
			ci.draw_circle(c + Vector2(-u * 0.9, -u * 0.55), u * 0.07, GOLD)
		"leaf":
			var lf := PackedVector2Array()
			for i in 17:
				var t: float = float(i) / 16.0
				lf.append(c + Vector2(lerpf(-u * 0.9, u * 0.9, t), -sin(t * PI) * u * 0.6))
			for i in 17:
				var t2: float = 1.0 - float(i) / 16.0
				lf.append(c + Vector2(lerpf(-u * 0.9, u * 0.9, t2), sin(t2 * PI) * u * 0.5))
			ci.draw_colored_polygon(lf, LEAF)
			lf.append(lf[0])
			ci.draw_polyline(lf, INK, 2.0)
			ci.draw_line(c + Vector2(-u * 0.9, 0), c + Vector2(u * 0.9, 0), INK, 1.5)
		"rock":
			var rk := PackedVector2Array([c + Vector2(-u * 0.95, u * 0.5), c + Vector2(-u * 0.6, -u * 0.35), c + Vector2(0, -u * 0.6), c + Vector2(u * 0.7, -u * 0.25), c + Vector2(u * 0.95, u * 0.5)])
			ci.draw_colored_polygon(rk, STEEL)
			rk.append(rk[0])
			ci.draw_polyline(rk, INK, 2.5)
		"note":
			# A paper banknote.
			var n := Rect2(c + Vector2(-u * 1.05, -u * 0.6), Vector2(u * 2.1, u * 1.2))
			ci.draw_rect(n, Color("9CCB8F"))
			ci.draw_rect(n, INK, false, 2.5)
			ci.draw_circle(c, u * 0.33, Color("6DA35F"))
			ci.draw_arc(c, u * 0.33, 0, TAU, 16, INK, 1.5)
		"chat":
			# A speech bubble: tell someone.
			ci.draw_circle(c + Vector2(0, -u * 0.1), u * 0.85, INK)
			ci.draw_circle(c + Vector2(0, -u * 0.1), u * 0.77, Color.WHITE)
			ci.draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 0.45, u * 0.5), c + Vector2(-u * 0.75, u * 0.95), c + Vector2(-u * 0.05, u * 0.62)]), INK)
			for x in [-0.35, 0.0, 0.35]:
				ci.draw_circle(c + Vector2(x * u, -u * 0.1), u * 0.11, INK)
		"popup":
			# A pop-up window shouting at you: a warning sign on a screen.
			var w := Rect2(c + Vector2(-u * 1.0, -u * 0.8), Vector2(u * 2.0, u * 1.6))
			ci.draw_rect(w, Color.WHITE)
			ci.draw_rect(Rect2(w.position, Vector2(w.size.x, u * 0.35)), CORAL)
			ci.draw_rect(w, INK, false, 2.5)
			ci.draw_line(c + Vector2(0, -u * 0.25), c + Vector2(0, u * 0.35), INK, u * 0.2)
			ci.draw_circle(c + Vector2(0, u * 0.6), u * 0.1, INK)
		"updown":
			# Can go up OR down (nothing is promised): a green arrow up and a
			# coral arrow down, side by side.
			for side in [[-0.45, true], [0.45, false]]:
				var x: float = float(side[0]) * u
				var up: bool = side[1]
				var col: Color = LEAF if up else CORAL
				var tip_y: float = -u * 0.9 if up else u * 0.9
				var base_y: float = u * 0.6 if up else -u * 0.6
				ci.draw_line(c + Vector2(x, base_y), c + Vector2(x, tip_y * 0.55), col, u * 0.28)
				ci.draw_colored_polygon(PackedVector2Array([c + Vector2(x, tip_y), c + Vector2(x - u * 0.38, tip_y * 0.35), c + Vector2(x + u * 0.38, tip_y * 0.35)]), col)
				ci.draw_polyline(PackedVector2Array([c + Vector2(x, tip_y), c + Vector2(x - u * 0.38, tip_y * 0.35), c + Vector2(x + u * 0.38, tip_y * 0.35), c + Vector2(x, tip_y)]), INK, 1.5)
		"game":
			# A video game: a gamepad with a cross and two buttons.
			var pad := Rect2(c + Vector2(-u * 1.05, -u * 0.5), Vector2(u * 2.1, u * 1.1))
			ci.draw_rect(pad, STEEL)
			ci.draw_circle(c + Vector2(-u * 0.75, u * 0.35), u * 0.38, STEEL)
			ci.draw_circle(c + Vector2(u * 0.75, u * 0.35), u * 0.38, STEEL)
			ci.draw_rect(pad, INK, false, 2.5)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.75, -u * 0.12), Vector2(u * 0.5, u * 0.16)), INK)
			ci.draw_rect(Rect2(c + Vector2(-u * 0.58, -u * 0.29), Vector2(u * 0.16, u * 0.5)), INK)
			ci.draw_circle(c + Vector2(u * 0.4, -u * 0.05), u * 0.13, CORAL)
			ci.draw_circle(c + Vector2(u * 0.7, -u * 0.2), u * 0.13, LEAF)
		"close":
			# Close it: a window with an X button.
			var wn := Rect2(c + Vector2(-u * 1.0, -u * 0.8), Vector2(u * 2.0, u * 1.6))
			ci.draw_rect(wn, Color.WHITE)
			ci.draw_rect(wn, INK, false, 2.5)
			ci.draw_line(c + Vector2(-u * 0.45, -u * 0.35), c + Vector2(u * 0.45, u * 0.45), CORAL, u * 0.22)
			ci.draw_line(c + Vector2(u * 0.45, -u * 0.35), c + Vector2(-u * 0.45, u * 0.45), CORAL, u * 0.22)
		"coin_foreign":
			# Money from somewhere else: a silver coin with a hole and a
			# different shape (eight sides).
			var oct := PackedVector2Array()
			for i in 8:
				var a2: float = TAU * i / 8.0 + PI / 8.0
				oct.append(c + Vector2(cos(a2), sin(a2)) * u * 0.9)
			ci.draw_colored_polygon(oct, STONE)
			oct.append(oct[0])
			ci.draw_polyline(oct, INK, 2.5)
			ci.draw_circle(c, u * 0.25, CREAM)
			ci.draw_arc(c, u * 0.25, 0, TAU, 16, INK, 2.0)
		_:
			return false
	return true
