class_name NavArrow
extends Control
## NavArrow — the one picture for moving through the world, the same on every
## door, every entry card and the help panel:
##   ← BACK     a thick arrow pointing left (the room before this one)
##   → FORWARD  a thick arrow pointing right (on, further in)
##   HOME       the Hub's compass (DestinationIcon) — not an arrow
## On a round cream badge with a dark rim (the shape carries the meaning, not
## the colour). Nothing moves.

const INK := Color("1C2624")
const CREAM := Color("FBF8EF")

var direction: String = "forward":   # "back" | "forward"
	set(v):
		direction = v
		queue_redraw()


func _init(p_direction: String = "forward", px: float = 64.0) -> void:
	direction = p_direction
	custom_minimum_size = Vector2(px, px)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	var c: Vector2 = size * 0.5
	var r: float = minf(size.x, size.y) * 0.5
	draw_circle(c, r, INK)
	draw_circle(c, r - 4.0, CREAM)
	var s: float = -1.0 if direction == "back" else 1.0
	var u: float = r * 0.5
	# Shaft and head, pointing left (back) or right (forward).
	var shaft_x: float = -u * 0.95 if s > 0 else -u * 0.3
	draw_rect(Rect2(c + Vector2(shaft_x, -u * 0.22), Vector2(u * 1.25, u * 0.44)), INK)
	var tip: Vector2 = c + Vector2(s * u * 1.05, 0)
	var back_x: float = s * u * 0.2
	draw_colored_polygon(PackedVector2Array([tip, c + Vector2(back_x, -u * 0.72), c + Vector2(back_x, u * 0.72)]), INK)
