class_name DestinationIcon
extends Control
## DestinationIcon — a destination's simple, recognisable shape drawn in 2D
## (the same shapes as its 3D sign emblem): coin, book, bulb, column, mind
## (a thought cloud), leaf, star, bag, frame, compass. On a round badge in
## the district colour, with a dark outline — so a place is recognisable by
## SHAPE as well as by name and colour (never colour alone).

var icon: String = "compass":
	set(v):
		icon = v
		queue_redraw()
var accent: Color = Color("E8A33D"):
	set(v):
		accent = v
		queue_redraw()

const INK := Color("1C2624")
const CREAM := Color("FBF8EF")


func _init() -> void:
	custom_minimum_size = Vector2(84, 84)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	var s: float = minf(size.x, size.y)
	var c := size * 0.5
	var r: float = s * 0.5
	draw_circle(c, r, INK)
	draw_circle(c, r - 4.0, accent)
	draw_circle(c, r - 10.0, CREAM)
	var u: float = r * 0.5   # drawing unit
	match icon:
		"coin":
			draw_circle(c, u * 1.15, INK)
			draw_circle(c, u * 1.0, accent)
			draw_arc(c, u * 0.72, 0, TAU, 32, INK, 3.0)
			_star(c, u * 0.42, INK)
		"book":
			draw_rect(Rect2(c + Vector2(-u * 1.1, -u * 0.8), Vector2(u * 1.05, u * 1.6)), accent)
			draw_rect(Rect2(c + Vector2(u * 0.05, -u * 0.8), Vector2(u * 1.05, u * 1.6)), accent)
			draw_rect(Rect2(c + Vector2(-u * 1.1, -u * 0.8), Vector2(u * 2.2, u * 1.6)), INK, false, 3.0)
			draw_line(c + Vector2(0, -u * 0.8), c + Vector2(0, u * 0.8), INK, 3.0)
			for i in 3:
				var y: float = -u * 0.4 + i * u * 0.35
				draw_line(c + Vector2(-u * 0.85, y), c + Vector2(-u * 0.25, y), INK, 2.0)
				draw_line(c + Vector2(u * 0.25, y), c + Vector2(u * 0.85, y), INK, 2.0)
		"bulb":
			draw_circle(c + Vector2(0, -u * 0.25), u * 0.8, INK)
			draw_circle(c + Vector2(0, -u * 0.25), u * 0.66, accent)
			draw_rect(Rect2(c + Vector2(-u * 0.38, u * 0.5), Vector2(u * 0.76, u * 0.6)), INK)
			draw_line(c + Vector2(-u * 0.38, u * 0.75), c + Vector2(u * 0.38, u * 0.75), CREAM, 2.0)
		"column":
			draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 1.2, -u * 0.55), c + Vector2(0, -u * 1.15), c + Vector2(u * 1.2, -u * 0.55)]), INK)
			for x in [-0.8, 0.0, 0.8]:
				draw_rect(Rect2(c + Vector2(x * u - u * 0.18, -u * 0.5), Vector2(u * 0.36, u * 1.2)), accent)
				draw_rect(Rect2(c + Vector2(x * u - u * 0.18, -u * 0.5), Vector2(u * 0.36, u * 1.2)), INK, false, 2.0)
			draw_rect(Rect2(c + Vector2(-u * 1.2, u * 0.7), Vector2(u * 2.4, u * 0.3)), INK)
		"mind":
			for p in [Vector2(-0.55, 0.05), Vector2(0.0, -0.35), Vector2(0.55, 0.05), Vector2(0.0, 0.25)]:
				draw_circle(c + p * u, u * 0.62, INK)
			for p in [Vector2(-0.55, 0.05), Vector2(0.0, -0.35), Vector2(0.55, 0.05), Vector2(0.0, 0.25)]:
				draw_circle(c + p * u, u * 0.5, accent)
			draw_circle(c + Vector2(-u * 0.9, u * 0.95), u * 0.18, INK)
		"leaf":
			var pts := PackedVector2Array()
			for i in 32:
				var t: float = TAU * float(i) / 32.0
				pts.append(c + Vector2(cos(t) * u * 1.1, sin(t) * u * 0.55).rotated(-0.6))
			draw_colored_polygon(pts, accent)
			pts.append(pts[0])
			draw_polyline(pts, INK, 3.0, true)
			draw_line(c + Vector2(-u, 0).rotated(-0.6), c + Vector2(u, 0).rotated(-0.6), INK, 2.0)
		"star":
			_star(c, u * 1.15, INK)
			_star(c, u * 0.95, accent)
		"bag":
			draw_arc(c + Vector2(0, -u * 0.35), u * 0.45, PI, TAU, 16, INK, 4.0)
			draw_rect(Rect2(c + Vector2(-u * 0.9, -u * 0.35), Vector2(u * 1.8, u * 1.35)), accent)
			draw_rect(Rect2(c + Vector2(-u * 0.9, -u * 0.35), Vector2(u * 1.8, u * 1.35)), INK, false, 3.0)
		"frame":
			draw_rect(Rect2(c + Vector2(-u * 0.9, -u * 1.0), Vector2(u * 1.8, u * 2.0)), accent)
			draw_rect(Rect2(c + Vector2(-u * 0.9, -u * 1.0), Vector2(u * 1.8, u * 2.0)), INK, false, 3.0)
			draw_circle(c + Vector2(0, -u * 0.2), u * 0.35, INK)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 0.55, u * 0.75), c + Vector2(0, u * 0.2), c + Vector2(u * 0.55, u * 0.75)]), INK)
		_:   # compass
			draw_arc(c, u * 1.05, 0, TAU, 32, INK, 3.0)
			draw_colored_polygon(PackedVector2Array([c + Vector2(0, -u * 0.95), c + Vector2(u * 0.28, 0), c + Vector2(0, u * 0.95), c + Vector2(-u * 0.28, 0)]), INK)
			draw_colored_polygon(PackedVector2Array([c + Vector2(0, -u * 0.95), c + Vector2(u * 0.28, 0), c + Vector2(-u * 0.28, 0)]), accent)


func _star(c: Vector2, r: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a: float = -PI * 0.5 + TAU * i / 10.0
		pts.append(c + Vector2(cos(a), sin(a)) * (r if i % 2 == 0 else r * 0.45))
	draw_colored_polygon(pts, col)
