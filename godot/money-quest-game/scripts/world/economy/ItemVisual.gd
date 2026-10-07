class_name ItemVisual
extends RefCounted
## ItemVisual — how a product looks, from one shape id: a small 3D model for
## the stall (model()) and a matching 2D picture for the card (ItemVisual.Icon),
## so the thing on the counter and the thing on the card are recognisably
## the same. Simple, chunky shapes in the world's toy-like language.
##
## Shapes: apple, bread, juice, notebook, notebook_fancy, pencils, kite,
## ball, plant, umbrella, socks, toy_car.

const K = preload("res://scripts/world/decor/DecorKit.gd")
const INK := Color("1C2624")
const CREAM := Color("FBF8EF")


## Adds the product's model to `m` at `x` (sitting on y = 0 there).
static func model(m: MeshMerger, x: Transform3D, shape: String, c: Color) -> void:
	m.origin = x
	var mat := CharacterPalette.mat(c)
	match shape:
		"apple":
			for i in 3:
				m.add(K.sphere(0.09, 10, 5), K.xf(Vector3(-0.1 + i * 0.1, 0.08, 0.03 * (i % 2))), mat)
			m.add(K.cyl(0.008, 0.008, 0.05, 4), K.xf(Vector3(0, 0.18, 0)), CharacterPalette.mat(Color("6B4A33")))
		"bread":
			m.add(K.sphere(0.16, 12, 6), K.xf(Vector3(0, 0.07, 0), Vector3.ZERO, Vector3(1.3, 0.55, 0.75)), mat)
			for i in 3:
				m.add(K.box(Vector3(0.02, 0.02, 0.14)), K.xf(Vector3(-0.09 + i * 0.09, 0.15, 0)), CharacterPalette.mat(c.darkened(0.25)))
		"juice":
			m.add(K.box(Vector3(0.12, 0.22, 0.09)), K.xf(Vector3(0, 0.11, 0)), mat)
			m.add(K.box(Vector3(0.13, 0.08, 0.1)), K.xf(Vector3(0, 0.12, 0.002)), CharacterPalette.mat(CREAM))
			m.add(K.cyl(0.008, 0.008, 0.1, 4), K.xf(Vector3(0.03, 0.27, 0), Vector3(0, 0, 12)), CharacterPalette.mat(Color("D13E19")))
		"notebook", "notebook_fancy":
			m.add(K.box(Vector3(0.24, 0.04, 0.3)), K.xf(Vector3(0, 0.02, 0)), mat)
			m.add(K.box(Vector3(0.22, 0.035, 0.28)), K.xf(Vector3(0.006, 0.021, 0)), CharacterPalette.mat(CREAM))
			if shape == "notebook_fancy":
				m.add(K.cyl(0.05, 0.05, 0.01, 10), K.xf(Vector3(0, 0.045, 0)), CharacterPalette.mat(Color("E8A33D"), 0.2))
				m.add(K.box(Vector3(0.03, 0.01, 0.34)), K.xf(Vector3(-0.08, 0.045, 0)), CharacterPalette.mat(Color("A99BD9")))
		"pencils":
			for i in 4:
				m.add(K.cyl(0.015, 0.015, 0.22, 6), K.xf(Vector3(-0.05 + i * 0.035, 0.016, 0), Vector3(90, 0, 0)), CharacterPalette.mat([Color("D13E19"), Color("367D99"), Color("E8A33D"), Color("4F9B5C")][i]))
		"kite":
			m.add(K.prism(Vector3(0.3, 0.22, 0.02)), K.xf(Vector3(0, 0.36, 0)), mat)
			m.add(K.prism(Vector3(0.3, 0.32, 0.02)), K.xf(Vector3(0, 0.11, 0), Vector3(0, 0, 180)), CharacterPalette.mat(c.lightened(0.3)))
			m.add(K.cyl(0.005, 0.005, 0.3, 4), K.xf(Vector3(0.05, -0.08, 0), Vector3(0, 0, 25)), CharacterPalette.mat(INK))
		"ball":
			m.add(K.sphere(0.12, 12, 6), K.xf(Vector3(0, 0.12, 0)), mat)
			m.add(K.torus(0.115, 0.125, 18, 4), K.xf(Vector3(0, 0.12, 0), Vector3(90, 0, 0)), CharacterPalette.mat(CREAM))
		"plant":
			m.add(K.cyl(0.08, 0.06, 0.12, 10), K.xf(Vector3(0, 0.06, 0)), CharacterPalette.mat(Color("D58660")))
			m.add(K.sphere(0.11, 8, 4), K.xf(Vector3(0, 0.2, 0), Vector3.ZERO, Vector3(1, 0.8, 1)), mat)
		"umbrella":
			m.add(K.sphere(0.2, 12, 6, true), K.xf(Vector3(0, 0.3, 0), Vector3.ZERO, Vector3(1, 0.6, 1)), mat)
			m.add(K.cyl(0.01, 0.01, 0.32, 6), K.xf(Vector3(0, 0.15, 0)), CharacterPalette.mat(INK))
		"socks":
			for sx in [-0.06, 0.06]:
				m.add(K.box(Vector3(0.07, 0.18, 0.05)), K.xf(Vector3(sx, 0.1, 0)), mat)
				m.add(K.box(Vector3(0.07, 0.05, 0.12)), K.xf(Vector3(sx, 0.025, 0.04)), mat)
				m.add(K.box(Vector3(0.072, 0.03, 0.052)), K.xf(Vector3(sx, 0.17, 0)), CharacterPalette.mat(CREAM))
		"toy_car":
			m.add(K.box(Vector3(0.26, 0.08, 0.13)), K.xf(Vector3(0, 0.07, 0)), mat)
			m.add(K.box(Vector3(0.14, 0.07, 0.12)), K.xf(Vector3(-0.02, 0.14, 0)), CharacterPalette.mat(Color("7DB6CF")))
			for sx in [-0.08, 0.08]:
				for sz in [-0.07, 0.07]:
					m.add(K.cyl(0.035, 0.035, 0.02, 10), K.xf(Vector3(sx, 0.035, sz), Vector3(90, 0, 0)), CharacterPalette.mat(INK))
		_:
			m.add(K.box(Vector3(0.18, 0.18, 0.18)), K.xf(Vector3(0, 0.09, 0)), mat)


## The same product as a 2D picture on a round badge (a shape, not colour
## alone), for cards and lists.
class Icon extends Control:
	var shape: String = "apple":
		set(v):
			shape = v
			queue_redraw()
	var tint: Color = Color("F07A5A"):
		set(v):
			tint = v
			queue_redraw()

	func _init() -> void:
		custom_minimum_size = Vector2(56, 56)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		draw_circle(c, r, INK)
		draw_circle(c, r - 3.0, CREAM)
		var u: float = r * 0.5
		var col: Color = tint
		match shape:
			"apple":
				draw_circle(c + Vector2(0, u * 0.15), u * 0.9, INK)
				draw_circle(c + Vector2(0, u * 0.15), u * 0.78, col)
				draw_line(c + Vector2(0, -u * 0.7), c + Vector2(u * 0.15, -u * 1.05), INK, 3.0)
				draw_circle(c + Vector2(u * 0.35, -u * 0.85), u * 0.18, Color("4F9B5C"))
			"bread":
				var pts := PackedVector2Array()
				for i in 24:
					var a: float = PI + PI * i / 23.0
					pts.append(c + Vector2(cos(a) * u * 1.2, sin(a) * u * 0.8 + u * 0.35))
				pts.append(c + Vector2(u * 1.2, u * 0.6))
				pts.append(c + Vector2(-u * 1.2, u * 0.6))
				draw_colored_polygon(pts, col)
				pts.append(pts[0])
				draw_polyline(pts, INK, 3.0)
				for i in 3:
					draw_line(c + Vector2(-u * 0.6 + i * u * 0.6, -u * 0.3), c + Vector2(-u * 0.4 + i * u * 0.6, u * 0.1), INK, 2.0)
			"juice":
				draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.8), Vector2(u * 1.1, u * 1.7)), col)
				draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.8), Vector2(u * 1.1, u * 1.7)), INK, false, 3.0)
				draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.1), Vector2(u * 1.1, u * 0.5)), CREAM)
				draw_line(c + Vector2(u * 0.2, -u * 0.8), c + Vector2(u * 0.4, -u * 1.15), Color("D13E19"), 3.0)
			"notebook", "notebook_fancy":
				draw_rect(Rect2(c + Vector2(-u * 0.75, -u * 0.95), Vector2(u * 1.5, u * 1.9)), col)
				draw_rect(Rect2(c + Vector2(-u * 0.75, -u * 0.95), Vector2(u * 1.5, u * 1.9)), INK, false, 3.0)
				for i in 3:
					draw_line(c + Vector2(-u * 0.4, -u * 0.35 + i * u * 0.35), c + Vector2(u * 0.5, -u * 0.35 + i * u * 0.35), CREAM, 2.0)
				if shape == "notebook_fancy":
					draw_circle(c + Vector2(0, -u * 0.6), u * 0.25, Color("E8A33D"))
					draw_line(c + Vector2(-u * 0.5, -u * 0.95), c + Vector2(-u * 0.5, u * 1.1), Color("A99BD9"), 4.0)
			"pencils":
				for i in 3:
					var x: float = -u * 0.5 + i * u * 0.5
					draw_line(c + Vector2(x, u * 0.9), c + Vector2(x, -u * 0.6), [Color("D13E19"), Color("367D99"), Color("E8A33D")][i], 8.0)
					draw_colored_polygon(PackedVector2Array([c + Vector2(x - 4, -u * 0.6), c + Vector2(x + 4, -u * 0.6), c + Vector2(x, -u * 0.95)]), INK)
			"kite":
				draw_colored_polygon(PackedVector2Array([c + Vector2(0, -u), c + Vector2(u * 0.7, -u * 0.1), c + Vector2(0, u * 0.9), c + Vector2(-u * 0.7, -u * 0.1)]), col)
				draw_polyline(PackedVector2Array([c + Vector2(0, -u), c + Vector2(u * 0.7, -u * 0.1), c + Vector2(0, u * 0.9), c + Vector2(-u * 0.7, -u * 0.1), c + Vector2(0, -u)]), INK, 3.0)
				draw_line(c + Vector2(0, -u), c + Vector2(0, u * 0.9), INK, 2.0)
				draw_line(c + Vector2(-u * 0.7, -u * 0.1), c + Vector2(u * 0.7, -u * 0.1), INK, 2.0)
			"ball":
				draw_circle(c, u * 0.95, INK)
				draw_circle(c, u * 0.83, col)
				draw_line(c + Vector2(-u * 0.83, 0), c + Vector2(u * 0.83, 0), CREAM, 4.0)
			"plant":
				draw_rect(Rect2(c + Vector2(-u * 0.45, u * 0.2), Vector2(u * 0.9, u * 0.75)), Color("D58660"))
				draw_circle(c + Vector2(-u * 0.3, -u * 0.2), u * 0.42, col)
				draw_circle(c + Vector2(u * 0.3, -u * 0.3), u * 0.42, col)
				draw_circle(c + Vector2(0, -u * 0.6), u * 0.42, col)
			"umbrella":
				draw_arc(c + Vector2(0, -u * 0.1), u * 0.95, PI, TAU, 24, col, u * 0.5)
				draw_line(c + Vector2(0, -u * 0.1), c + Vector2(0, u * 0.9), INK, 3.0)
				draw_arc(c + Vector2(u * 0.18, u * 0.9), u * 0.18, 0, PI, 8, INK, 3.0)
			"socks":
				for sx in [-0.4, 0.4]:
					draw_rect(Rect2(c + Vector2(sx * u - u * 0.25, -u * 0.85), Vector2(u * 0.5, u * 1.3)), col)
					draw_rect(Rect2(c + Vector2(sx * u - u * 0.25, u * 0.25), Vector2(u * 0.8, u * 0.45)), col)
					draw_rect(Rect2(c + Vector2(sx * u - u * 0.25, -u * 0.85), Vector2(u * 0.5, u * 0.3)), CREAM)
			"toy_car":
				draw_rect(Rect2(c + Vector2(-u * 1.0, -u * 0.1), Vector2(u * 2.0, u * 0.6)), col)
				draw_rect(Rect2(c + Vector2(-u * 0.5, -u * 0.55), Vector2(u * 0.95, u * 0.5)), Color("7DB6CF"))
				for sx in [-0.55, 0.55]:
					draw_circle(c + Vector2(sx * u, u * 0.55), u * 0.25, INK)
			_:
				draw_rect(Rect2(c - Vector2(u, u) * 0.7, Vector2(u, u) * 1.4), col)
