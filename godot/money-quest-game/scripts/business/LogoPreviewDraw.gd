class_name LogoPreviewDraw
extends Control
## LogoPreviewDraw — draws the live preview inside LogoBuilderPanel as a
## plain procedural shape (circle/square/hexagon/star) in a flat fill
## color, with the chosen symbol shown as an overlaid Label sibling —
## never an image file, matching this project's "flat-color primitive"
## visual convention (see README's "Known limitations").

var shape: String = "circle"
var fill_color: Color = Color(0.059, 0.478, 0.420, 1)


func _draw() -> void:
	var center := size / 2.0
	var radius: float = min(size.x, size.y) / 2.0 - 4.0
	match shape:
		"square":
			draw_rect(Rect2(center - Vector2(radius, radius), Vector2(radius * 2.0, radius * 2.0)), fill_color)
		"hexagon":
			draw_colored_polygon(_regular_polygon_points(center, radius, 6), fill_color)
		"star":
			draw_colored_polygon(_star_points(center, radius), fill_color)
		_:
			draw_circle(center, radius, fill_color)


func refresh(new_shape: String, new_color: Color) -> void:
	shape = new_shape
	fill_color = new_color
	queue_redraw()


func _regular_polygon_points(center: Vector2, radius: float, sides: int) -> PackedVector2Array:
	var points := PackedVector2Array()
	for i in sides:
		var angle: float = TAU * i / sides - PI / 2.0
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	return points


func _star_points(center: Vector2, radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	var inner_radius := radius * 0.5
	for i in 10:
		var angle: float = TAU * i / 10.0 - PI / 2.0
		var point_radius: float = radius if i % 2 == 0 else inner_radius
		points.append(center + Vector2(cos(angle), sin(angle)) * point_radius)
	return points
