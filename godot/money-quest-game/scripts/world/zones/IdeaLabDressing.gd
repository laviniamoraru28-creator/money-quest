@tool
extends ZoneDressing
## Idea Lab — "turn a great idea into your own small business", said by
## the room: the district's workbenches and boards along the walls (its
## kit, unchanged) and, in the room, a giant glowing light bulb, an idea
## wall of sticky notes joined by strings, big gears on the wall, a
## prototype corner with a cardboard rocket, a materials shelf, and a
## small stage with a pitch easel (a chart that rises — no words).
##
## Only decoration: the Business Guide and the Startup Mentor (who run the
## BUILD flow) and both doors are untouched. Every kit item's footprint is
## recorded as it is placed, so the room's own props never stand in one.


func _init() -> void:
	district_style = "idea_lab"


## The district's kit (as before), remembering each item's footprint.
func _kit_item(m: MeshMerger, body: StaticBody3D, item: String, pos: Vector3, yaw: float) -> bool:
	var ok: bool = super._kit_item(m, body, item, pos, yaw)
	if ok:
		_authored.append(Rect2(pos.x - 0.9, pos.z - 0.9, 1.8, 1.8))
	return ok


func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	super._build_props(m, body)   # the workbenches and boards along the walls
	var h: Vector2 = half()

	# The giant light bulb: an idea, glowing.
	var bulb := Vector3(5.6, 0, -6.6)
	if is_free(bulb, 1.1):
		m.origin = K.xf(bulb)
		m.part(K.cyl(0.9, 1.0, 0.3, 20), K.mat("wood_dark"), Vector3(0, 0.15, 0))
		for i in 4:
			m.part(K.cyl(0.42, 0.42, 0.14, 16), K.mat("gold" if i % 2 == 0 else "gold_deep"), Vector3(0, 0.42 + i * 0.14, 0))
		m.part(K.sphere(1.0, 18, 9), K.mat("bulb", 0.7), Vector3(0, 1.75, 0))
		m.part(K.torus(0.15, 0.22, 12, 4), K.mat("ember", 0.8), Vector3(0, 1.6, 0), Vector3(90, 0, 0))
		for sx in [-0.12, 0.12]:
			m.part(K.cyl(0.02, 0.02, 0.5, 4), K.mat("stone_dark"), Vector3(sx, 1.15, 0))
		m.origin = Transform3D.IDENTITY
		K.add_cyl_collider(body, 1.0, 2.8, K.xf(bulb + Vector3(0, 1.4, 0)))
		spot("sparkle", bulb + Vector3(0, 2.9, 0))

	# The idea wall on the back wall, above the workbenches.
	_idea_wall(m, Vector3(-3.6, 0, -h.y + 0.62))

	# Big gears on the back wall, between its pilasters, above the benches.
	for g in [[Vector3(5.3, 3.5, -h.y + 0.62), 0.85, "ember"], [Vector3(6.85, 3.0, -h.y + 0.62), 0.55, "gold"], [Vector3(6.75, 4.35, -h.y + 0.62), 0.45, "teal"]]:
		_gear(m, g[0], g[1], g[2])

	# The prototype corner: a cardboard rocket on a round platform.
	var rocket := Vector3(-7.6, 0, 6.4)
	if is_free(rocket, 1.0):
		_rocket(m, rocket)
		K.add_cyl_collider(body, 0.95, 2.6, K.xf(rocket + Vector3(0, 1.3, 0)))
		spot("sparkle", rocket + Vector3(0, 2.8, 0))

	# A shelf of making materials.
	var shelf := Vector3(7.4, 0, 6.8)
	if is_free(shelf, 0.9):
		_shelf(m, K.xf(shelf, Vector3(0, 180.0, 0)))
		K.add_box_collider(body, Vector3(1.8, 1.9, 0.5), K.xf(shelf + Vector3(0, 0.95, 0), Vector3(0, 180.0, 0)))

	# A little stage with a pitch easel, facing the aisle.
	var stage := Vector3(5.2, 0, 3.4)
	if is_free(stage, 1.2):
		m.origin = K.xf(stage)
		m.part(K.cyl(1.2, 1.25, 0.2, 24), K.mat("wood"), Vector3(0, 0.1, 0))
		m.part(K.torus(1.15, 1.25, 24, 4), K.mat("ember"), Vector3(0, 0.2, 0), Vector3.ZERO, Vector3(1, 0.4, 1))
		m.origin = Transform3D.IDENTITY
		_easel(m, K.xf(stage + Vector3(0.2, 0.2, 0), Vector3(0, -90.0, 0)))
		K.add_cyl_collider(body, 1.2, 0.25, K.xf(stage + Vector3(0, 0.12, 0)))
		K.add_box_collider(body, Vector3(0.9, 1.8, 0.6), K.xf(stage + Vector3(0.2, 1.0, 0), Vector3(0, -90.0, 0)))


## A cork board of sticky notes joined by strings (idea → idea).
func _idea_wall(m: MeshMerger, p: Vector3) -> void:
	m.origin = K.xf(p)
	m.part(K.box(Vector3(4.6, 1.8, 0.06)), K.mat("wood"), Vector3(0, 3.4, 0))
	m.part(K.box(Vector3(4.8, 0.1, 0.1)), K.mat("wood_dark"), Vector3(0, 4.35, 0.02))
	m.part(K.box(Vector3(4.8, 0.1, 0.1)), K.mat("wood_dark"), Vector3(0, 2.45, 0.02))
	var notes: Array = []
	var rng := RandomNumberGenerator.new()
	rng.seed = 707
	for i in 14:
		var q := Vector3(-2.0 + (i % 7) * 0.66 + rng.randf_range(-0.1, 0.1), 3.0 + (i / 7) * 0.8 + rng.randf_range(-0.12, 0.12), 0.05)
		notes.append(q)
		m.part(K.box(Vector3(0.36, 0.36, 0.02)), K.mat(["bulb", "coral", "sky_light", "leaf_light", "blossom"][i % 5]), q, Vector3(0, 0, rng.randf_range(-8.0, 8.0)))
		m.part(K.sphere(0.035, 6, 3), K.mat("ember"), q + Vector3(0, 0.12, 0.02))
	for pair in [[0, 8], [8, 2], [2, 10], [10, 4], [4, 12], [12, 6]]:
		var a: Vector3 = notes[pair[0]] + Vector3(0, 0.12, 0.03)
		var b: Vector3 = notes[pair[1]] + Vector3(0, 0.12, 0.03)
		m.part(K.box(Vector3(a.distance_to(b), 0.015, 0.01)), K.mat("ember"), (a + b) * 0.5, Vector3(0, 0, rad_to_deg(atan2(b.y - a.y, b.x - a.x))))
	m.origin = Transform3D.IDENTITY


## A gear on the back wall (still: a picture of "making", nothing moves).
func _gear(m: MeshMerger, p: Vector3, r: float, color_name: String) -> void:
	m.origin = K.xf(p)
	m.part(K.cyl(r, r, 0.1, 20), K.mat(color_name), Vector3.ZERO, Vector3(90, 0, 0))
	var teeth: int = int(r * 12.0)
	for i in teeth:
		var a: float = TAU * float(i) / float(teeth)
		m.part(K.box(Vector3(0.16, 0.2, 0.1)), K.mat(color_name), Vector3(cos(a) * (r + 0.08), sin(a) * (r + 0.08), 0), Vector3(0, 0, rad_to_deg(a)))
	m.part(K.cyl(r * 0.3, r * 0.3, 0.14, 14), K.mat("stone_dark"), Vector3(0, 0, 0.02), Vector3(90, 0, 0))
	m.origin = Transform3D.IDENTITY


## A cardboard rocket on a round platform: a prototype.
func _rocket(m: MeshMerger, p: Vector3) -> void:
	m.origin = K.xf(p, Vector3(0, 30.0, 0))
	m.part(K.cyl(0.9, 0.95, 0.15, 20), K.mat("wood"), Vector3(0, 0.075, 0))
	m.part(K.cyl(0.38, 0.4, 1.6, 14), K.mat("parchment"), Vector3(0, 1.0, 0))
	m.part(K.cyl(0.41, 0.41, 0.18, 14), K.mat("ember"), Vector3(0, 1.2, 0))
	m.part(K.cyl(0.0, 0.38, 0.7, 14), K.mat("ember"), Vector3(0, 2.15, 0))
	m.part(K.cyl(0.13, 0.13, 0.05, 12), K.mat("sky"), Vector3(0, 1.55, 0.38), Vector3(90, 0, 0))
	m.part(K.torus(0.12, 0.16, 12, 3), K.mat("ink"), Vector3(0, 1.55, 0.39), Vector3(90, 0, 0))
	for a in [0.0, 120.0, 240.0]:
		var d: Vector3 = Basis(Vector3.UP, deg_to_rad(a)) * Vector3(0, 0, 0.5)
		m.part(K.box(Vector3(0.04, 0.5, 0.3)), K.mat("ember"), d + Vector3(0, 0.45, 0), Vector3(0, a, 0))
	m.origin = Transform3D.IDENTITY


## A shelf of materials: card rolls, boxes, a paint pot, string.
func _shelf(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	for sx in [-0.85, 0.85]:
		m.part(K.box(Vector3(0.08, 1.9, 0.45)), K.mat("wood_dark"), Vector3(sx, 0.95, 0))
	for y in [0.1, 0.75, 1.4]:
		m.part(K.box(Vector3(1.75, 0.06, 0.45)), K.mat("wood"), Vector3(0, y, 0))
	for i in 3:
		m.part(K.cyl(0.08, 0.08, 0.4, 10), K.mat(["coral", "sky", "bulb"][i]), Vector3(-0.55 + i * 0.18, 0.33, 0), Vector3(90, 0, 0))
	m.part(K.box(Vector3(0.4, 0.3, 0.3)), K.mat("path_wood"), Vector3(0.45, 0.28, 0))
	m.part(K.box(Vector3(0.36, 0.26, 0.3)), K.mat("parchment"), Vector3(-0.4, 0.92, 0))
	m.part(K.cyl(0.12, 0.12, 0.22, 12), K.mat("teal"), Vector3(0.3, 0.89, 0))
	m.part(K.torus(0.06, 0.11, 12, 4), K.mat("ember"), Vector3(0.55, 0.82, 0))
	m.part(K.box(Vector3(0.5, 0.2, 0.3)), K.mat("leaf_light"), Vector3(-0.3, 1.53, 0))
	m.part(K.cyl(0.09, 0.09, 0.3, 10), K.mat("lilac"), Vector3(0.35, 1.58, 0))
	m.origin = Transform3D.IDENTITY


## An easel with a pitch chart: bars that rise, and an arrow up.
func _easel(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	for sx in [-0.35, 0.35]:
		m.part(K.box(Vector3(0.06, 1.7, 0.06)), K.mat("wood"), Vector3(sx, 0.85, 0), Vector3(-8, 0, sx * -10.0))
	m.part(K.box(Vector3(0.06, 1.6, 0.06)), K.mat("wood"), Vector3(0, 0.8, -0.3), Vector3(18, 0, 0))
	m.part(K.box(Vector3(0.9, 0.06, 0.1)), K.mat("wood_dark"), Vector3(0, 0.75, 0.05))
	m.part(K.box(Vector3(0.84, 0.66, 0.03)), K.mat("cream"), Vector3(0, 1.12, 0.06), Vector3(-8, 0, 0))
	for i in 4:
		var bh: float = 0.1 + i * 0.1
		m.part(K.box(Vector3(0.12, bh, 0.02)), K.mat(["sky", "teal", "gold", "ember"][i]), Vector3(-0.27 + i * 0.18, 0.86 + bh * 0.5, 0.08), Vector3(-8, 0, 0))
	m.part(K.prism(Vector3(0.16, 0.14, 0.02)), K.mat("leaf"), Vector3(0.3, 1.38, 0.09), Vector3(-8, 0, -30))
	m.origin = Transform3D.IDENTITY
