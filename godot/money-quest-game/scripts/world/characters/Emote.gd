class_name Emote
extends RefCounted
## Emote — a small comic-style thought bubble over a character's head
## with one symbol: ✓ yes / ★ proud / ! wow, oh no / ? thinking / ♥ thanks
## / … waiting / a lock (can't open). Paired with the face (CharacterRig.
## express) it says how someone feels without words, readable from the
## game camera's distance where a face alone is too small.
##
## Built from cached meshes with billboard materials (always facing the
## camera, no per-frame code). With Reduced Motion it simply appears.

const HEIGHT: float = 2.45

static var _meshes: Dictionary = {}
static var _mats: Dictionary = {}


## Shows `kind` over `rig` for `seconds` (replacing any emote it shows).
static func pop(rig: Node3D, kind: String, seconds: float = 2.2) -> void:
	if rig == null or not is_instance_valid(rig) or not rig.is_inside_tree():
		return
	var old: Node = rig.get_node_or_null("Emote")
	if old:
		old.free()
	var mi := MeshInstance3D.new()
	mi.name = "Emote"
	mi.mesh = _mesh(kind)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.position = Vector3(0.28, HEIGHT, 0)
	rig.add_child(mi)
	var serial: int = randi()
	mi.set_meta("serial", serial)
	if not Settings.reduced_motion:
		mi.scale = Vector3.ONE * 0.2
		mi.create_tween().tween_property(mi, "scale", Vector3.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await rig.get_tree().create_timer(seconds).timeout
	if is_instance_valid(mi) and mi.get_meta("serial", 0) == serial:
		mi.queue_free()


static func _mat(color: Color) -> StandardMaterial3D:
	var key: String = color.to_html()
	if not _mats.has(key):
		var m := StandardMaterial3D.new()
		m.albedo_color = color
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		_mats[key] = m
	return _mats[key]


static func _mesh(kind: String) -> Mesh:
	if _meshes.has(kind):
		return _meshes[kind]
	var ink := _mat(MoneyIcons.INK)
	var m := MeshMerger.new()
	# The bubble: a soft disc with a dark rim and a little tail.
	m.part(DecorKit.cyl(0.25, 0.25, 0.02, 20), ink, Vector3(0, 0, -0.01), Vector3(90, 0, 0))
	m.part(DecorKit.cyl(0.225, 0.225, 0.02, 20), _mat(MoneyIcons.CREAM), Vector3(0, 0, 0.0), Vector3(90, 0, 0))
	m.part(DecorKit.sphere(0.05, 8, 4), _mat(MoneyIcons.CREAM), Vector3(-0.2, -0.24, 0))
	m.part(DecorKit.sphere(0.03, 8, 4), _mat(MoneyIcons.CREAM), Vector3(-0.27, -0.32, 0))
	var z := 0.02
	match kind:
		"yes":
			var teal := _mat(MoneyIcons.TEAL)
			m.part(DecorKit.box(Vector3(0.05, 0.13, 0.01)), teal, Vector3(-0.05, -0.03, z), Vector3(0, 0, 40))
			m.part(DecorKit.box(Vector3(0.05, 0.24, 0.01)), teal, Vector3(0.05, 0.02, z), Vector3(0, 0, -35))
		"proud":
			m.part(DecorKit.cyl(0.13, 0.13, 0.01, 5), _mat(MoneyIcons.GOLD), Vector3(0, 0, z), Vector3(90, 0, 0))
			m.part(DecorKit.cyl(0.13, 0.13, 0.01, 5), _mat(MoneyIcons.GOLD), Vector3(0, 0, z), Vector3(90, 36, 0))
		"wow", "oh_no":
			var col := _mat(Color("F07A5A") if kind == "oh_no" else MoneyIcons.GOLD_DEEP)
			m.part(DecorKit.box(Vector3(0.06, 0.2, 0.01)), col, Vector3(0, 0.05, z))
			m.part(DecorKit.sphere(0.035, 8, 4), col, Vector3(0, -0.12, z))
		"thinking":
			var t := _mat(MoneyIcons.TEAL)
			for i in 6:
				var a: float = PI * 0.95 - i * PI * 0.27
				m.part(DecorKit.sphere(0.028, 6, 3), t, Vector3(cos(a) * 0.075, 0.07 + sin(a) * 0.075, z))
			m.part(DecorKit.sphere(0.028, 6, 3), t, Vector3(0, -0.04, z))
			m.part(DecorKit.sphere(0.03, 6, 3), t, Vector3(0, -0.13, z))
		"thanks":
			var h := _mat(Color("F07A5A"))
			m.part(DecorKit.sphere(0.065, 10, 6), h, Vector3(-0.05, 0.04, z))
			m.part(DecorKit.sphere(0.065, 10, 6), h, Vector3(0.05, 0.04, z))
			m.part(DecorKit.box(Vector3(0.12, 0.12, 0.01)), h, Vector3(0, -0.03, z), Vector3(0, 0, 45))
		"locked":
			var g := _mat(MoneyIcons.GOLD)
			m.part(DecorKit.box(Vector3(0.18, 0.14, 0.01)), g, Vector3(0, -0.05, z))
			m.part(DecorKit.box(Vector3(0.03, 0.12, 0.01)), ink, Vector3(-0.06, 0.06, z))
			m.part(DecorKit.box(Vector3(0.03, 0.12, 0.01)), ink, Vector3(0.06, 0.06, z))
			m.part(DecorKit.box(Vector3(0.15, 0.03, 0.01)), ink, Vector3(0, 0.12, z))
		_:   # "waiting"
			for x in [-0.08, 0.0, 0.08]:
				m.part(DecorKit.sphere(0.03, 6, 3), ink, Vector3(x, 0, z))
	_meshes[kind] = m.commit()
	return _meshes[kind]


## The same bubble, flat, for pictures (MissionStrip faces): a cream disc
## with a dark rim and the same symbol and colour as in the world, so a
## feeling looks the same on screen as over a character's head. "happy"
## has no bubble (the smile says it, and ✓ stays the sign for "right").
## Returns false when this feeling has no bubble.
static func draw_bubble(ci: CanvasItem, expression: String, c: Vector2, r: float) -> bool:
	var kind: String = CharacterRig.EXPRESSION_EMOTE.get(expression, "")
	if kind in ["", "yes", "waiting", "locked"]:
		return false
	ci.draw_circle(c, r, MoneyIcons.INK)
	ci.draw_circle(c, r - 2.5, MoneyIcons.CREAM)
	ci.draw_circle(c + Vector2(-r * 0.85, r * 0.95), r * 0.2, MoneyIcons.INK)
	ci.draw_circle(c + Vector2(-r * 0.85, r * 0.95), r * 0.2 - 1.5, MoneyIcons.CREAM)
	var u: float = r / 0.25   # the 3D bubble is 0.25 across: same proportions
	match kind:
		"proud":
			var pts := PackedVector2Array()
			for i in 10:
				var a: float = -PI * 0.5 + TAU * i / 10.0
				pts.append(c + Vector2(cos(a), sin(a)) * (u * (0.13 if i % 2 == 0 else 0.055)))
			ci.draw_colored_polygon(pts, MoneyIcons.GOLD)
		"wow", "oh_no":
			var col: Color = Color("F07A5A") if kind == "oh_no" else MoneyIcons.GOLD_DEEP
			ci.draw_rect(Rect2(c + Vector2(-u * 0.03, -u * 0.15), Vector2(u * 0.06, u * 0.2)), col)
			ci.draw_circle(c + Vector2(0, u * 0.12), u * 0.035, col)
		"thinking":
			for i in 6:
				var a2: float = PI * 0.95 - i * PI * 0.27
				ci.draw_circle(c + Vector2(cos(a2) * 0.075, -(0.07 + sin(a2) * 0.075)) * u, u * 0.028, MoneyIcons.TEAL)
			ci.draw_circle(c + Vector2(0, u * 0.04), u * 0.028, MoneyIcons.TEAL)
			ci.draw_circle(c + Vector2(0, u * 0.13), u * 0.03, MoneyIcons.TEAL)
		"thanks":
			var h := Color("F07A5A")
			ci.draw_circle(c + Vector2(-u * 0.05, -u * 0.04), u * 0.065, h)
			ci.draw_circle(c + Vector2(u * 0.05, -u * 0.04), u * 0.065, h)
			ci.draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 0.11, -u * 0.01), c + Vector2(u * 0.11, -u * 0.01), c + Vector2(0, u * 0.12)]), h)
	return true
