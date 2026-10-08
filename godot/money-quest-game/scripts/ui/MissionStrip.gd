class_name MissionStrip
extends HBoxContainer
## MissionStrip — a mission as a row of pictures (see VisualMissions for
## the tokens): "[your face] → [coin coin coin]". Shown on the mission card
## whether words are on or off, in the help panel, and in a place's picture
## intro. Shapes with dark outlines (never colour alone); nothing animates
## except a one-off pop of the counter when a coin is found (none with
## Reduced Motion).

var px: float = 52.0
var _tokens: Array = []
var _params: Dictionary = {}


func _init(p_px: float = 52.0) -> void:
	px = p_px
	name = "MissionStrip"
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_theme_constant_override("separation", 6)
	alignment = BoxContainer.ALIGNMENT_BEGIN


## Rebuilds the row only when the pictures (or their counts) change.
func show_tokens(tokens: Array, params: Dictionary = {}) -> void:
	if tokens == _tokens and params == _params:
		return
	var counted_before: int = int(_params.get("have", -1))
	_tokens = tokens.duplicate()
	_params = params.duplicate()
	for c in get_children():
		remove_child(c)
		c.queue_free()
	for t in tokens:
		var ctl: Control = make_token(String(t), params, px)
		if ctl:
			ctl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			add_child(ctl)
			if String(t) == "coins" and counted_before >= 0 and int(params.get("have", -1)) > counted_before:
				_pop.call_deferred(ctl)
	visible = get_child_count() > 0


func token_count() -> int:
	return get_child_count()


static func make_token(t: String, params: Dictionary, p: float) -> Control:
	var parts: PackedStringArray = t.split(":")
	match parts[0]:
		"you":
			return Face.new(p, "")
		"npc":
			return Face.new(p, parts[1] if parts.size() > 1 else "")
		"then":
			return MoneyIcons.Arrow.new(p * 0.5)
		"coin":
			return MoneyIcons.Coin.new(p * 0.62)
		"coins":
			var need: int = int(params.get("need", 3))
			var have: int = clampi(int(params.get("have", 0)), 0, need)
			if need > MoneyIcons.Pips.MAX_DRAWN:
				# Too many to draw one by one: a coin and the number.
				var row := HBoxContainer.new()
				row.mouse_filter = Control.MOUSE_FILTER_IGNORE
				row.add_child(MoneyIcons.Coin.new(p * 0.62))
				row.add_child(make_token("num:%d" % have, {}, p))
				return row
			var pips := MoneyIcons.Pips.new()
			pips.coin_px = p * 0.42
			pips.filled = have
			pips.hollow = need - have
			return pips
		"bag":
			return MoneyIcons.Bag.new(p * 0.72)
		"tick":
			return MoneyIcons.Tick.new(p * 0.6)
		"num":
			# A number on its own (counts that pips cannot show: 12 items, 18 coins).
			var l := Label.new()
			l.text = parts[1] if parts.size() > 1 else "0"
			l.add_theme_font_size_override("font_size", int(p * 0.62))
			l.add_theme_color_override("font_color", MoneyIcons.INK)
			l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			l.custom_minimum_size = Vector2(0, p)
			return l
		"item":
			var icon := ItemVisual.Icon.new()
			icon.shape = parts[1] if parts.size() > 1 else "apple"
			if parts.size() > 2:
				icon.tint = Color(parts[2])
			icon.custom_minimum_size = Vector2(p, p)
			return icon
		_:
			return Glyph.new(parts[0], p)


func _pop(ctl: Control) -> void:
	if Settings.reduced_motion or not is_instance_valid(ctl) or not ctl.is_inside_tree():
		return
	ctl.pivot_offset = ctl.size * 0.5
	var tw := ctl.create_tween()
	tw.tween_property(ctl, "scale", Vector2.ONE * 1.25, 0.1)
	tw.tween_property(ctl, "scale", Vector2.ONE, 0.2)


## A face on a round badge: the child's own avatar (gold ring = "you"), or
## a character's (teal ring). Rendered from the real character (Portraits);
## a simple drawn head meanwhile, or where nothing can be rendered.
class Face extends Control:
	var npc_id: String = ""
	var tex: Texture2D = null

	func _init(p: float, p_npc: String) -> void:
		npc_id = p_npc
		custom_minimum_size = Vector2(p, p)
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		var cb := func(t: Texture2D) -> void:
			if is_instance_valid(self):
				tex = t
				queue_redraw()
		tex = Portraits.get_avatar(cb) if npc_id.is_empty() else Portraits.get_portrait(npc_id, cb)

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		draw_circle(c, r, MoneyIcons.INK)
		draw_circle(c, r - 3.0, MoneyIcons.GOLD if npc_id.is_empty() else MoneyIcons.TEAL)
		draw_circle(c, r - 7.0, MoneyIcons.CREAM)
		if tex:
			var s: float = (r - 7.0) * 1.9
			draw_texture_rect(tex, Rect2(c - Vector2(s, s) * 0.5 + Vector2(0, 1), Vector2(s, s)), false)
		else:
			draw_circle(c + Vector2(0, -r * 0.12), r * 0.3, MoneyIcons.INK)
			draw_arc(c + Vector2(0, r * 0.62), r * 0.5, PI * 1.15, PI * 1.85, 16, MoneyIcons.INK, r * 0.2)


## Simple drawn glyphs for places and actions, on a cream badge.
class Glyph extends Control:
	const INK := MoneyIcons.INK
	const CREAM := MoneyIcons.CREAM
	const GOLD := MoneyIcons.GOLD
	const CORAL := Color("F07A5A")
	const WOOD := Color("B9824F")
	const TEAL := MoneyIcons.TEAL
	var kind: String = ""

	func _init(p_kind: String, p: float) -> void:
		kind = p_kind
		custom_minimum_size = Vector2(p, p)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var c: Vector2 = size * 0.5
		var r: float = minf(size.x, size.y) * 0.5
		draw_circle(c, r, INK)
		draw_circle(c, r - 3.0, CREAM)
		var u: float = r * 0.5
		match kind:
			"stall":
				# A striped awning over a counter.
				var top := Rect2(c + Vector2(-u * 1.1, -u * 0.95), Vector2(u * 2.2, u * 0.6))
				draw_rect(top, CORAL)
				for i in 3:
					draw_rect(Rect2(top.position + Vector2(u * (0.37 + i * 0.73), 0), Vector2(u * 0.36, u * 0.6)), CREAM)
				draw_rect(top, INK, false, 2.5)
				draw_line(c + Vector2(-u * 0.95, -u * 0.35), c + Vector2(-u * 0.95, u * 0.9), INK, 3.0)
				draw_line(c + Vector2(u * 0.95, -u * 0.35), c + Vector2(u * 0.95, u * 0.9), INK, 3.0)
				var counter := Rect2(c + Vector2(-u * 1.1, u * 0.2), Vector2(u * 2.2, u * 0.55))
				draw_rect(counter, WOOD)
				draw_rect(counter, INK, false, 2.5)
				draw_circle(c + Vector2(-u * 0.4, u * 0.05), u * 0.22, CORAL)
				draw_circle(c + Vector2(u * 0.3, u * 0.05), u * 0.22, GOLD)
			"crate":
				var box := Rect2(c + Vector2(-u * 0.9, -u * 0.7), Vector2(u * 1.8, u * 1.5))
				draw_rect(box, WOOD)
				draw_rect(box, INK, false, 3.0)
				draw_line(box.position, box.end, INK, 2.5)
				draw_line(Vector2(box.end.x, box.position.y), Vector2(box.position.x, box.end.y), INK, 2.5)
			"board":
				var b := Rect2(c + Vector2(-u * 1.0, -u * 0.9), Vector2(u * 2.0, u * 1.3))
				draw_rect(b, Color("6B4B33"))
				draw_rect(b, INK, false, 2.5)
				for i in 2:
					draw_rect(Rect2(b.position + Vector2(u * (0.2 + i * 0.95), u * 0.25), Vector2(u * 0.65, u * 0.8)), [Color("7FB77E"), GOLD][i])
				draw_line(c + Vector2(-u * 0.6, u * 0.4), c + Vector2(-u * 0.7, u * 1.0), INK, 3.0)
				draw_line(c + Vector2(u * 0.6, u * 0.4), c + Vector2(u * 0.7, u * 1.0), INK, 3.0)
			"door":
				var d := Rect2(c + Vector2(-u * 0.6, -u * 0.95), Vector2(u * 1.2, u * 1.85))
				draw_rect(d, TEAL)
				draw_rect(d, INK, false, 3.0)
				draw_circle(c + Vector2(u * 0.3, u * 0.05), u * 0.11, GOLD)
			"eye":
				var pts := PackedVector2Array()
				for i in 25:
					var a: float = TAU * i / 24.0
					pts.append(c + Vector2(cos(a) * u * 1.05, sin(a) * u * 0.55))
				draw_colored_polygon(pts, Color.WHITE)
				draw_polyline(pts, INK, 2.5)
				draw_circle(c, u * 0.4, TEAL)
				draw_circle(c, u * 0.18, INK)
			"hand":
				# An open hand reaching to touch (interact).
				draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.1), Vector2(u * 1.1, u * 0.95)), GOLD)
				for i in 4:
					draw_rect(Rect2(c + Vector2(-u * 0.55 + i * u * 0.28, -u * 0.9 + absf(i - 1.5) * u * 0.12), Vector2(u * 0.24, u * 0.85)), GOLD)
				draw_rect(Rect2(c + Vector2(-u * 0.55, -u * 0.1), Vector2(u * 1.1, u * 0.95)), INK, false, 2.0)
				draw_line(c + Vector2(-u * 0.55, u * 0.2), c + Vector2(-u * 0.95, -u * 0.25), INK, 4.0)
			"walk":
				# Two footprints.
				for f in [[Vector2(-u * 0.4, u * 0.25), -0.25], [Vector2(u * 0.4, -u * 0.35), 0.25]]:
					var p: Vector2 = c + f[0]
					draw_set_transform(p, f[1], Vector2.ONE)
					draw_circle(Vector2.ZERO, u * 0.3, INK)
					draw_circle(Vector2(0, -u * 0.45), u * 0.13, INK)
					draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			"choose":
				# Two cards side by side, one raised (picking one).
				draw_rect(Rect2(c + Vector2(-u * 1.05, -u * 0.45), Vector2(u * 0.9, u * 1.2)), CREAM)
				draw_rect(Rect2(c + Vector2(-u * 1.05, -u * 0.45), Vector2(u * 0.9, u * 1.2)), INK, false, 2.5)
				draw_rect(Rect2(c + Vector2(u * 0.15, -u * 0.85), Vector2(u * 0.9, u * 1.2)), GOLD)
				draw_rect(Rect2(c + Vector2(u * 0.15, -u * 0.85), Vector2(u * 0.9, u * 1.2)), INK, false, 3.0)
			"pay":
				# A coin dropping from a hand edge.
				draw_rect(Rect2(c + Vector2(-u * 1.0, -u * 0.8), Vector2(u * 1.3, u * 0.45)), GOLD)
				draw_rect(Rect2(c + Vector2(-u * 1.0, -u * 0.8), Vector2(u * 1.3, u * 0.45)), INK, false, 2.0)
				MoneyIcons.draw_coin(self, c + Vector2(u * 0.35, u * 0.35), u * 0.55)
				draw_line(c + Vector2(u * 0.35, -u * 0.55), c + Vector2(u * 0.35, -u * 0.25), INK, 2.5)
			"star":
				var pts2 := PackedVector2Array()
				for i in 10:
					var a2: float = -PI * 0.5 + TAU * i / 10.0
					pts2.append(c + Vector2(cos(a2), sin(a2)) * (u * 1.05 if i % 2 == 0 else u * 0.45))
				draw_colored_polygon(pts2, GOLD)
				pts2.append(pts2[0])
				draw_polyline(pts2, INK, 2.0)
			_:
				if not PurposeGlyphs.draw(self, kind, c, u):
					draw_circle(c, u * 0.3, INK)
