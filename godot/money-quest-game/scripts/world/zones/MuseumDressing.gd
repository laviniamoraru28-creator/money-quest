@tool
extends ZoneDressing
## Museum — the story of money, as the gallery hall: the museum district's
## display cases along the walls (its kit, unchanged) and, in the hall,
## two great exhibits on roped plinths — a giant ancient coin with a
## square hole and a stone-money wheel — each with a picture plaque (no
## words), classical columns, a timeline set into the floor (shell → coin
## → banknote → card → phone, in pictures), benches to look from, and
## banners by the way on.
##
## Only decoration: the zone's Trader, its exhibit and both doors are
## untouched. Every kit item's footprint is recorded as it is placed, so
## the hall's own props never stand in a display case.


func _init() -> void:
	district_style = "museum"


## The district's kit (as before), remembering each item's footprint.
func _kit_item(m: MeshMerger, body: StaticBody3D, item: String, pos: Vector3, yaw: float) -> bool:
	var ok: bool = super._kit_item(m, body, item, pos, yaw)
	if ok:
		_authored.append(Rect2(pos.x - 0.9, pos.z - 0.9, 1.8, 1.8))
	return ok


func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	super._build_props(m, body)   # the display cases along the walls
	var h: Vector2 = half()

	# The two great exhibits, each roped off, with a picture plaque.
	var coin := Vector3(-6.6, 0, 2.4)
	if is_free(coin, 1.8):
		_plinth(m, body, coin)
		m.origin = K.xf(coin + Vector3(0, 1.0, 0), Vector3(0, 20.0, 0))
		m.part(K.cyl(1.0, 1.0, 0.22, 28), K.mat("gold_deep"), Vector3(0, 1.0, 0), Vector3(90, 0, 0))
		m.part(K.torus(0.84, 1.0, 28, 4), K.mat("gold"), Vector3(0, 1.0, 0.12), Vector3(90, 0, 0))
		m.part(K.box(Vector3(0.42, 0.42, 0.26)), K.mat("ink"), Vector3(0, 1.0, 0))
		m.origin = Transform3D.IDENTITY
		_plaque(m, coin + Vector3(0.9, 0, 1.75), 160.0, "square_coin")
		spot("sparkle", coin + Vector3(0, 2.8, 0))
	var wheel := Vector3(6.6, 0, 2.4)
	if is_free(wheel, 1.8):
		_plinth(m, body, wheel)
		m.origin = K.xf(wheel + Vector3(0, 1.0, 0), Vector3(0, -20.0, 0))
		m.part(K.cyl(1.05, 1.05, 0.34, 24), K.mat("stone"), Vector3(0, 1.05, 0), Vector3(90, 0, 0))
		m.part(K.cyl(1.08, 1.08, 0.28, 24), K.mat("stone_dark"), Vector3(0, 1.05, -0.04), Vector3(90, 0, 0))
		m.part(K.cyl(0.3, 0.3, 0.36, 14), K.mat("ink"), Vector3(0, 1.05, 0), Vector3(90, 0, 0))
		m.origin = Transform3D.IDENTITY
		_plaque(m, wheel + Vector3(-0.9, 0, 1.75), 200.0, "stone")
		spot("sparkle", wheel + Vector3(0, 2.8, 0))

	# Classical columns on both sides of the aisle.
	for cp in [Vector3(-4.2, 0, -1.0), Vector3(4.2, 0, -1.0), Vector3(-4.2, 0, -5.6), Vector3(4.2, 0, -5.6)]:
		if is_free(cp, 0.5):
			_column(m, cp)
			# Architecture, like the walls: the camera stays in front of it.
			K.add_cyl_collider(_body, 0.6, CAMERA_BLOCK_HEIGHT, K.xf(cp + Vector3(0, CAMERA_BLOCK_HEIGHT * 0.5, 0)))

	# The timeline in the floor, across the hall (not on the aisle).
	var symbols: Array = ["shell", "barter", "coin", "square_coin", "note", "card", "phone", "future"]
	var xs: Array = [-8.4, -6.4, -4.4, -2.4, 2.4, 4.4, 6.4, 8.4]
	for i in symbols.size():
		var p := Vector3(xs[i], 0.066, 5.0)
		if not is_free(Vector3(p.x, 0, p.z), 0.4):
			continue
		m.origin = Transform3D.IDENTITY
		m.part(K.cyl(0.55, 0.55, 0.006, 20), K.mat("stone_dark"), p)
		m.part(K.cyl(0.48, 0.48, 0.008, 20), K.mat("parchment"), p + Vector3(0, 0.002, 0))
		_symbol(m, p + Vector3(0, 0.008, 0), symbols[i])
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(6.6, 0.006, 0.12)), K.mat("stone_dark"), Vector3(side * 5.4, 0.064, 5.0))

	# Benches to look at the great exhibits from.
	for bp in [[Vector3(-6.6, 0, 6.8), 180.0], [Vector3(6.6, 0, 6.8), 180.0]]:
		if is_free(bp[0], 0.9):
			DecorProps.bench(m, K.xf(bp[0], Vector3(0, bp[1], 0)))
			K.add_box_collider(body, Vector3(1.8, 0.9, 0.55), K.xf(bp[0] + Vector3(0, 0.45, 0), Vector3(0, bp[1], 0)))

	# Banners by the way on.
	for bx in [-3.4, 3.4]:
		DecorProps.wall_banner(m, K.xf(Vector3(bx, 0, -h.y + 0.55)), "coral", "gold")


## A round stone plinth with a rope barrier on brass posts around it.
func _plinth(m: MeshMerger, body: StaticBody3D, p: Vector3) -> void:
	m.origin = K.xf(p)
	m.part(K.cyl(0.85, 0.95, 0.9, 20), K.mat("stone"), Vector3(0, 0.45, 0))
	m.part(K.cyl(0.95, 0.95, 0.1, 20), K.mat("stone_dark"), Vector3(0, 0.95, 0))
	for i in 6:
		var a: float = TAU * float(i) / 6.0
		var q := Vector3(cos(a) * 1.55, 0, sin(a) * 1.55)
		m.part(K.cyl(0.05, 0.07, 0.9, 8), K.mat("gold_deep"), q + Vector3(0, 0.45, 0))
		m.part(K.sphere(0.08, 8, 4), K.mat("gold"), q + Vector3(0, 0.93, 0))
		var a2: float = TAU * float(i + 1) / 6.0
		var q2 := Vector3(cos(a2) * 1.55, 0, sin(a2) * 1.55)
		var mid: Vector3 = (q + q2) * 0.5
		m.part(K.cyl(0.03, 0.03, q.distance_to(q2), 6), K.mat("book_red"), mid + Vector3(0, 0.72, 0), Vector3(0, -rad_to_deg(atan2(q2.z - q.z, q2.x - q.x)), 90))
	m.origin = Transform3D.IDENTITY
	K.add_cyl_collider(body, 1.6, 1.0, K.xf(p + Vector3(0, 0.5, 0)))
	_authored.append(Rect2(p.x - 1.7, p.z - 1.7, 3.4, 3.4))


## A small slanted stand with a picture of the exhibit (no words).
func _plaque(m: MeshMerger, p: Vector3, yaw: float, symbol: String) -> void:
	m.origin = K.xf(p, Vector3(0, yaw, 0))
	m.part(K.box(Vector3(0.08, 0.8, 0.08)), K.mat("gold_deep"), Vector3(0, 0.4, 0))
	m.part(K.box(Vector3(0.62, 0.44, 0.05)), K.mat("parchment"), Vector3(0, 0.9, 0), Vector3(-30, 0, 0))
	m.origin = m.origin * K.xf(Vector3(0, 0.92, 0.04), Vector3(60, 0, 0))
	_symbol(m, Vector3.ZERO, symbol, 0.5, false)
	m.origin = Transform3D.IDENTITY


## A classical column: base, fluted shaft, capital.
func _column(m: MeshMerger, p: Vector3) -> void:
	m.origin = K.xf(p)
	m.part(K.box(Vector3(1.0, 0.3, 1.0)), K.mat("stone_dark"), Vector3(0, 0.15, 0))
	m.part(K.cyl(0.38, 0.42, 3.6, 12), K.mat("parchment"), Vector3(0, 2.1, 0))
	for i in 8:
		var a: float = TAU * float(i) / 8.0
		m.part(K.box(Vector3(0.05, 3.5, 0.05)), K.mat("stone"), Vector3(cos(a) * 0.39, 2.1, sin(a) * 0.39))
	m.part(K.box(Vector3(1.0, 0.3, 1.0)), K.mat("stone_dark"), Vector3(0, 4.05, 0))
	m.part(K.box(Vector3(0.8, 0.14, 0.8)), K.mat(trim_color), Vector3(0, 3.84, 0))
	m.origin = Transform3D.IDENTITY


## A money symbol drawn flat (in the floor, or on a plaque): the shape
## says what it is (never colour alone).
func _symbol(m: MeshMerger, c: Vector3, kind: String, s: float = 1.0, flat: bool = true) -> void:
	var o: Transform3D = m.origin
	m.origin = o * K.xf(c, Vector3(0, 0, 0) if flat else Vector3(-90, 0, 0), Vector3.ONE * s)
	match kind:
		"shell":
			m.part(K.sphere(0.24, 10, 5), K.mat("cream"), Vector3(0, 0.01, 0), Vector3.ZERO, Vector3(0.75, 0.15, 1.0))
			m.part(K.box(Vector3(0.03, 0.02, 0.36)), K.mat("ink"), Vector3(0, 0.03, 0))
		"barter":
			m.part(K.sphere(0.12, 8, 4), K.mat("coral"), Vector3(-0.15, 0.02, 0), Vector3.ZERO, Vector3(1, 0.2, 1))
			m.part(K.box(Vector3(0.16, 0.02, 0.05)), K.mat("ink"), Vector3(0.04, 0.03, 0))
			m.part(K.box(Vector3(0.18, 0.02, 0.18)), K.mat("wood"), Vector3(0.22, 0.02, 0))
		"coin":
			m.part(K.cyl(0.24, 0.24, 0.02, 16), K.mat("gold"), Vector3(0, 0.01, 0))
			m.part(K.torus(0.16, 0.2, 16, 3), K.mat("gold_deep"), Vector3(0, 0.025, 0), Vector3.ZERO, Vector3(1, 0.2, 1))
		"square_coin":
			m.part(K.cyl(0.24, 0.24, 0.02, 16), K.mat("gold_deep"), Vector3(0, 0.01, 0))
			m.part(K.box(Vector3(0.12, 0.03, 0.12)), K.mat("ink"), Vector3(0, 0.015, 0))
		"stone":
			m.part(K.cyl(0.26, 0.26, 0.02, 16), K.mat("stone_dark"), Vector3(0, 0.01, 0))
			m.part(K.cyl(0.08, 0.08, 0.03, 10), K.mat("ink"), Vector3(0, 0.015, 0))
		"note":
			m.part(K.box(Vector3(0.48, 0.02, 0.24)), K.mat("leaf_light"), Vector3(0, 0.01, 0))
			m.part(K.cyl(0.07, 0.07, 0.03, 10), K.mat("leaf_dark"), Vector3(0, 0.015, 0))
		"card":
			m.part(K.box(Vector3(0.44, 0.02, 0.28)), K.mat("sky"), Vector3(0, 0.01, 0))
			m.part(K.box(Vector3(0.1, 0.03, 0.08)), K.mat("gold"), Vector3(-0.12, 0.015, -0.03))
		"phone":
			m.part(K.box(Vector3(0.22, 0.02, 0.4)), K.mat("ink"), Vector3(0, 0.01, 0))
			m.part(K.box(Vector3(0.17, 0.03, 0.3)), K.mat("sky_light"), Vector3(0, 0.015, 0))
		_:   # the future: a question mark of dots
			for i in 5:
				m.part(K.sphere(0.04, 6, 3), K.mat("lilac"), Vector3(-0.1 + 0.1 * cos(i * 0.9), 0.02, -0.12 + i * 0.05))
			m.part(K.sphere(0.04, 6, 3), K.mat("lilac"), Vector3(0, 0.02, 0.2))
	m.origin = o
