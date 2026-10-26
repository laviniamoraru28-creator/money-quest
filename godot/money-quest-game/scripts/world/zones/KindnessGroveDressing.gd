@tool
extends ZoneDressing
## Kindness Grove — an open woodland garden for giving: soft grass, a pale
## garden path, hedges and trees all around with more woodland beyond, a
## flowering arbour with a heart where the path ends, flower beds, a small
## pond, benches to sit together, a picnic laid out to share and a little
## "give and take" box by the way in. Butterflies and birds visit (ZoneLife
## "town"). Welcoming, quiet, never busy.
##
## Only decoration: the zone's NPCs, quests, portals and B1's sharing bed
## are untouched. The bed is added by KindnessGrove.gd after this node is
## built, so its place is reserved here (STATION) and a branch of the path
## leads to it.

## The B1 sharing bed (KindnessGrove.gd places it here).
const STATION := Vector3(4.4, 0, 0.0)
## Its footprint (bed and seed-box post) plus a step around it.
const STATION_RESERVE := Rect2(2.9, -1.4, 3.4, 2.9)


func _init() -> void:
	district_style = "kindness_grove"


func _read_zone() -> void:
	super._read_zone()
	_authored.append(STATION_RESERVE)


## The garden path: the standard aisle, plus a branch to the sharing bed.
func _compute_path_segments() -> Array:
	var segs: Array = super._compute_path_segments()
	if not segs.is_empty():
		var aisle_x: float = (segs[0][0] as Vector2).x
		segs.append([Vector2(aisle_x, STATION.z), Vector2(STATION.x - 2.0, STATION.z)])
	return segs


# --- grass -------------------------------------------------------------------------

func _build_floor(m: MeshMerger) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	m.part(K.box(Vector3(room_size.x, 0.06, room_size.y)), K.mat(floor_color), Vector3(0, 0.03, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 3131
	# Soft patches of deeper and lighter grass (no tiles: this is a garden).
	for i in 30:
		var r: float = rng.randf_range(0.8, 1.9)
		var p := Vector3(rng.randf_range(-h.x + 1.0, h.x - 1.0), 0.061, rng.randf_range(-h.y + 1.0, h.y - 1.0))
		m.part(K.cyl(r, r, 0.004, 14), K.mat(floor_accent if i % 3 != 0 else "leaf_light"), p, Vector3(0, rng.randf_range(0.0, 180.0), 0), Vector3(1.0, 1.0, rng.randf_range(0.5, 0.85)))
	# Daisies and clover in the grass (flat; away from paths and people).
	for i in 60:
		var p := Vector3(rng.randf_range(-h.x + 1.0, h.x - 1.0), 0.066, rng.randf_range(-h.y + 1.0, h.y - 1.0))
		if not is_free(p, 0.1):
			continue
		m.part(K.cyl(0.07, 0.07, 0.01, 8), K.mat(["blossom_white", "gold", "blossom"][i % 3]), p)


# --- the grove's edges: hedges and trees, woodland beyond, a fence at the front ------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var rng := RandomNumberGenerator.new()
	rng.seed = 8820
	# A hedge just inside the back and side edges...
	var x: float = -h.x + 0.6
	while x < h.x - 0.4:
		DecorProps.bush(m, K.xf(Vector3(x, 0, -h.y + 0.6), Vector3(0, rng.randf_range(0, 360), 0)), rng.randf_range(1.2, 1.5), "leaf" if rng.randf() < 0.6 else "leaf_dark")
		x += 1.4
	for side in [-1.0, 1.0]:
		var z: float = -h.y + 1.6
		while z < h.y - 1.2:
			DecorProps.bush(m, K.xf(Vector3(side * (h.x - 0.6), 0, z), Vector3(0, rng.randf_range(0, 360), 0)), rng.randf_range(1.1, 1.4), "leaf" if rng.randf() < 0.6 else "leaf_dark")
			z += 1.4
	# ...trees right behind it, and more woodland further out for depth.
	var tx: float = -h.x
	var k: int = 0
	while tx <= h.x:
		_grove_tree(m, Vector3(tx + rng.randf_range(-0.4, 0.4), 0, -h.y - 1.2 - rng.randf_range(0.0, 0.8)), k, rng)
		tx += 3.0
		k += 1
	for side in [-1.0, 1.0]:
		var tz: float = -h.y + 1.0
		while tz < h.y:
			_grove_tree(m, Vector3(side * (h.x + 1.2 + rng.randf_range(0.0, 0.8)), 0, tz + rng.randf_range(-0.4, 0.4)), k, rng)
			tz += 3.2
			k += 1
	for i in 34:
		var a: float = rng.randf_range(-PI * 0.95, -PI * 0.05)   # behind and to the sides
		var d: float = rng.randf_range(4.0, 11.0)
		var p := Vector3(cos(a) * (h.x + d), 0, sin(a) * (h.y + d) * 0.9)
		if p.z > h.y * 0.6:
			continue
		DecorProps.tree(m, K.xf(p, Vector3(0, rng.randf_range(0, 360), 0)), "pine" if i % 3 == 0 else "round", rng.randf_range(1.5, 2.3))
	m.origin = Transform3D.IDENTITY
	# The green edges are the room's walls: world collision and camera
	# blockers (as ZoneDressing's walls are), set in front of the hedges so
	# the camera never ends up inside one.
	K.add_box_collider(_body, Vector3(room_size.x, CAMERA_BLOCK_HEIGHT, 0.5), K.xf(Vector3(0, CAMERA_BLOCK_HEIGHT * 0.5, -h.y + 1.3)))
	for side in [-1.0, 1.0]:
		K.add_box_collider(_body, Vector3(0.5, CAMERA_BLOCK_HEIGHT, room_size.y), K.xf(Vector3(side * (h.x - 1.3), CAMERA_BLOCK_HEIGHT * 0.5, 0)))
	# Front (the camera side): a low picket fence with flower boxes.
	var front_z: float = h.y - 0.25
	m.part(K.box(Vector3(room_size.x, 0.12, 0.1)), K.mat("wood"), Vector3(0, 0.55, front_z))
	m.part(K.box(Vector3(room_size.x, 0.1, 0.1)), K.mat("wood"), Vector3(0, 0.25, front_z))
	var pickets: int = int(room_size.x / 0.45)
	for i in pickets:
		var px: float = -h.x + 0.22 + i * (room_size.x - 0.44) / float(maxi(pickets - 1, 1))
		m.part(K.box(Vector3(0.14, 0.8, 0.05)), K.mat("cream"), Vector3(px, 0.4, front_z + 0.07))
		m.part(K.prism(Vector3(0.14, 0.12, 0.05)), K.mat("cream"), Vector3(px, 0.86, front_z + 0.07))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(1.6, 0.35, 0.45)), K.mat("wood_dark"), Vector3(side * (h.x - 1.4), 0.18, front_z - 0.4))
		for j in 4:
			m.part(K.sphere(0.15, 8, 4), K.sway(["coral", "gold", "blossom", "lilac"][j], "flower"), Vector3(side * (h.x - 1.95 + j * 0.36), 0.44, front_z - 0.4))


func _grove_tree(m: MeshMerger, p: Vector3, k: int, rng: RandomNumberGenerator) -> void:
	DecorProps.tree(m, K.xf(p, Vector3(0, rng.randf_range(0, 360), 0)), "blossom" if k % 3 == 1 else "round", rng.randf_range(1.3, 1.7))
	spot("tree", p + Vector3(0, 2.8, 0))


# --- props -------------------------------------------------------------------------

func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	var rng := RandomNumberGenerator.new()
	rng.seed = 6060
	_arbour(m, body, Vector3(0, 0, -h.y + 1.2))

	# Flower beds (butterflies visit them).
	for fb in [[Vector3(-8.8, 0, -6.6), 1.0], [Vector3(8.6, 0, -8.2), 1.0], [Vector3(8.8, 0, 6.0), 0.9], [Vector3(-8.8, 0, 6.4), 0.9]]:
		if is_free(fb[0], fb[1] + 0.2):
			DecorProps.flower_bed(m, K.xf(fb[0]), rng, fb[1])
			K.add_cyl_collider(body, fb[1] + 0.2, 0.6, K.xf(fb[0] + Vector3(0, 0.3, 0)))
			spot("flower", fb[0] + Vector3(0, 0.7, 0))

	# A small pond with lily pads.
	var pond := Vector3(-7.8, 0, 1.4)
	if is_free(pond, 1.7):
		m.origin = K.xf(pond)
		m.part(K.cyl(1.7, 1.8, 0.24, 24), K.mat("stone"), Vector3(0, 0.12, 0))
		m.part(K.cyl(1.5, 1.5, 0.04, 24), K.mat("water"), Vector3(0, 0.255, 0))
		for lp in [Vector3(-0.5, 0.285, 0.3), Vector3(0.6, 0.285, -0.4), Vector3(0.1, 0.285, 0.8)]:
			m.part(K.cyl(0.22, 0.22, 0.02, 10), K.mat("leaf_light"), lp)
		m.part(K.sphere(0.07, 6, 3), K.mat("blossom"), Vector3(0.6, 0.32, -0.4))
		m.origin = Transform3D.IDENTITY
		K.add_cyl_collider(body, 1.8, 0.6, K.xf(pond + Vector3(0, 0.3, 0)))
		spot("flower", pond + Vector3(0, 0.6, 0))

	# Benches to sit together, facing the path.
	for bp in [[Vector3(-9.6, 0, -2.6), 90.0], [Vector3(9.6, 0, -4.4), -90.0], [Vector3(4.2, 0, 6.8), 180.0]]:
		if is_free(bp[0], 0.9):
			DecorProps.bench(m, K.xf(bp[0], Vector3(0, bp[1], 0)))
			K.add_box_collider(body, Vector3(1.8, 0.9, 0.55), K.xf(bp[0] + Vector3(0, 0.45, 0), Vector3(0, bp[1], 0)))

	# A picnic laid out to share (flat: no collider but the basket's).
	var picnic := Vector3(-5.0, 0, -9.4)
	if is_free(picnic, 1.0):
		DecorProps.picnic_blanket(m, K.xf(picnic, Vector3(0, 8.0, 0)), "coral")
		K.add_cyl_collider(body, 0.3, 0.4, K.xf(picnic, Vector3(0, 8.0, 0)) * K.xf(Vector3(0.55, 0.2, -0.3)))

	# A little "give and take" box by the way in.
	var share_box := Vector3(-3.6, 0, 6.2)
	if is_free(share_box, 0.4):
		_give_box(m, K.xf(share_box, Vector3(0, 20.0, 0)))
		K.add_cyl_collider(body, 0.3, 1.6, K.xf(share_box + Vector3(0, 0.8, 0)))
		spot("perch", share_box + Vector3(0, 1.75, 0))

	# A bird house on a post, and a blossom tree inside the grove (none near
	# the front, where the camera is).
	var birds := Vector3(9.6, 0, -10.0)
	if is_free(birds, 0.3):
		_bird_house(m, K.xf(birds, Vector3(0, -30.0, 0)))
		K.add_cyl_collider(body, 0.15, 2.0, K.xf(birds + Vector3(0, 1.0, 0)))
		spot("perch", birds + Vector3(0, 2.2, 0))
	for tp in [[Vector3(6.8, 0, -9.8), "blossom"]]:
		if is_free(tp[0], 0.5):
			DecorProps.tree(m, K.xf(tp[0]), tp[1], 1.15)
			K.add_cyl_collider(body, 0.3, 2.0, K.xf(tp[0] + Vector3(0, 1.0, 0)))
			spot("tree", tp[0] + Vector3(0, 2.6, 0))

	# Lanterns along the path.
	for lp in [Vector3(-2.8, 0, 1.4), Vector3(2.8, 0, 3.6), Vector3(2.8, 0, -8.8), Vector3(-2.8, 0, -7.2)]:
		if is_free(lp, 0.35):
			DecorProps.lamp(m, K.xf(lp), "coral")
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
			spot("perch", lp + Vector3(0, 3.72, 0))


## A flowering arbour where the path ends, with a heart on top.
func _arbour(m: MeshMerger, body: StaticBody3D, p: Vector3) -> void:
	m.origin = K.xf(p)
	for sx in [-1.6, 1.6]:
		m.part(K.box(Vector3(0.22, 2.7, 0.22)), K.mat("wood"), Vector3(sx, 1.35, 0))
		K.add_box_collider(body, Vector3(0.3, 2.7, 0.3), K.xf(p + Vector3(sx, 1.35, 0)))
	for i in 7:
		var a: float = PI * float(i) / 6.0
		var q := Vector3(cos(a) * 1.6, 2.7 + sin(a) * 1.0, 0)
		m.part(K.box(Vector3(0.5, 0.18, 0.3)), K.mat("wood"), q, Vector3(0, 0, rad_to_deg(a) + 90.0))
		m.part(K.sphere(0.2, 8, 4), K.sway(["coral", "blossom", "gold"][i % 3], "flower"), q + Vector3(0, 0.12, 0.18))
	for sx in [-1.6, 1.6]:
		for j in 4:
			m.part(K.sphere(0.17, 8, 4), K.sway("leaf" if j % 2 == 0 else "blossom", "flower"), Vector3(sx + (0.14 if j % 2 == 0 else -0.14), 0.5 + j * 0.6, 0.14))
	_heart(m, Vector3(0, 4.05, 0.05), 0.7, "coral")
	m.origin = Transform3D.IDENTITY
	spot("flower", p + Vector3(0, 3.7, 0.3))


## A heart shape (two round lobes and a point), facing local +Z.
func _heart(m: MeshMerger, c: Vector3, s: float, color_name: String) -> void:
	m.part(K.sphere(0.3 * s, 10, 5), K.mat(color_name), c + Vector3(-0.22 * s, 0.1 * s, 0), Vector3.ZERO, Vector3(1, 1, 0.45))
	m.part(K.sphere(0.3 * s, 10, 5), K.mat(color_name), c + Vector3(0.22 * s, 0.1 * s, 0), Vector3.ZERO, Vector3(1, 1, 0.45))
	m.part(K.prism(Vector3(0.98 * s, 0.62 * s, 0.26 * s)), K.mat(color_name), c + Vector3(0, -0.24 * s, 0), Vector3(0, 0, 180))


## A little box on a post with a glass door: take something, leave something.
func _give_box(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(0.12, 1.1, 0.12)), K.mat("wood_dark"), Vector3(0, 0.55, 0))
	m.part(K.box(Vector3(0.75, 0.55, 0.5)), K.mat("teal"), Vector3(0, 1.38, 0))
	m.part(K.prism(Vector3(0.9, 0.32, 0.6)), K.mat("teal_dark"), Vector3(0, 1.81, 0))
	m.part(K.box(Vector3(0.56, 0.38, 0.03)), K.mat("glass", 0.15), Vector3(0, 1.38, 0.26))
	m.part(K.sphere(0.07, 6, 3), K.mat("coral"), Vector3(-0.12, 1.3, 0.2))
	m.part(K.box(Vector3(0.12, 0.16, 0.08)), K.mat("gold"), Vector3(0.12, 1.3, 0.2))
	_heart(m, Vector3(0, 1.82, 0.31), 0.32, "coral")
	m.origin = Transform3D.IDENTITY


## A bird house on a tall post.
func _bird_house(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(0.1, 1.8, 0.1)), K.mat("wood_dark"), Vector3(0, 0.9, 0))
	m.part(K.box(Vector3(0.42, 0.42, 0.38)), K.mat("coral"), Vector3(0, 1.98, 0))
	m.part(K.prism(Vector3(0.56, 0.26, 0.48)), K.mat("teal_dark"), Vector3(0, 2.32, 0))
	m.part(K.cyl(0.07, 0.07, 0.02, 10), K.mat("ink"), Vector3(0, 2.02, 0.2), Vector3(90, 0, 0))
	m.origin = Transform3D.IDENTITY
