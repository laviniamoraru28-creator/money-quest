@tool
extends ZoneDressing
## Horizon Peaks — planning ahead, as an alpine lookout: a meadow with
## alpine flowers and rocks, rocky slopes with pines on both sides, a
## wooden lookout railing at the back edge with the valley far below and
## snowy peaks and clouds on the horizon. A telescope on a deck ("look
## ahead"), milestone cairns that grow taller along the path ("steps to a
## goal"), a picture signpost, a summit flag, log benches, a map table, and
## a wooden trailhead around the way on to Kindness Grove.
##
## Only decoration: the zone's NPCs, quests and portals are untouched; the
## trailhead's crossbar sits above the door's ← / → sign.

const RAIL_Z_OFFSET: float = 0.45


func _init() -> void:
	district_style = "horizon_peaks"


# --- meadow --------------------------------------------------------------------------

func _build_floor(m: MeshMerger) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	m.part(K.box(Vector3(room_size.x, 0.06, room_size.y)), K.mat(floor_color), Vector3(0, 0.03, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 4848
	for i in 26:
		var r: float = rng.randf_range(0.7, 1.8)
		var p := Vector3(rng.randf_range(-h.x + 1.0, h.x - 1.0), 0.061, rng.randf_range(-h.y + 1.0, h.y - 1.0))
		m.part(K.cyl(r, r, 0.004, 14), K.mat(floor_accent if i % 3 != 0 else "grass_dark"), p, Vector3(0, rng.randf_range(0.0, 180.0), 0), Vector3(1.0, 1.0, rng.randf_range(0.5, 0.85)))
	# Gravel and flat stones in the grass, and small alpine flowers.
	for i in 70:
		var p := Vector3(rng.randf_range(-h.x + 1.0, h.x - 1.0), 0.066, rng.randf_range(-h.y + 1.0, h.y - 1.0))
		if not is_free(p, 0.12):
			continue
		if i % 4 == 0:
			m.part(K.cyl(0.14, 0.16, 0.03, 7), K.mat("rock"), p, Vector3(0, rng.randf_range(0, 90), 0), Vector3(1.0, 1.0, 0.7))
		else:
			m.part(K.cyl(0.06, 0.06, 0.01, 8), K.mat(["blossom_white", "lilac", "sky", "gold"][i % 4]), p)


# --- edges: rocky slopes with pines, the lookout railing over the valley ------------------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var rng := RandomNumberGenerator.new()
	rng.seed = 9292
	m.origin = Transform3D.IDENTITY
	for side in [-1.0, 1.0]:
		var z: float = h.y + 1.0
		while z > -h.y - 1.0:
			var s: float = rng.randf_range(1.5, 2.3)
			var hgt: float = rng.randf_range(3.4, 6.0)
			var p := Vector3(side * (h.x + s * 0.7 + rng.randf_range(-0.15, 0.35)), hgt * 0.5 - 0.35, z)
			m.part(K.sphere(s, 9, 5), K.mat(["rock", "mountain", "stone_dark"][rng.randi() % 3]), p, Vector3(0, rng.randf_range(0.0, 360.0), 0), Vector3(1.0, hgt / (s * 2.0), 1.0))
			if rng.randf() < 0.7:
				DecorProps.tree(m, K.xf(p + Vector3(side * 0.3, hgt * 0.5 - 0.3, 0), Vector3(0, rng.randf_range(0, 360), 0)), "pine", rng.randf_range(1.0, 1.4))
				m.origin = Transform3D.IDENTITY
			z -= s * 1.25
		# The slope is the room's side wall: world collision and a camera
		# blocker, in front of the rocks so the camera never ends up in one.
		K.add_box_collider(_body, Vector3(0.5, CAMERA_BLOCK_HEIGHT, room_size.y), K.xf(Vector3(side * (h.x - 1.2), CAMERA_BLOCK_HEIGHT * 0.5, 0)))
	_lookout_rail(m)
	_horizon(m, rng)
	# Front (the camera side): a low log fence.
	m.origin = Transform3D.IDENTITY
	var front_z: float = h.y - 0.3
	var posts: int = int(room_size.x / 2.0)
	for i in posts + 1:
		var px: float = -h.x + 0.4 + i * (room_size.x - 0.8) / float(posts)
		m.part(K.cyl(0.12, 0.14, 0.9, 8), K.mat("wood_dark"), Vector3(px, 0.45, front_z))
	m.part(K.cyl(0.07, 0.07, room_size.x - 0.8, 8), K.mat("wood"), Vector3(0, 0.7, front_z), Vector3(0, 0, 90))


## The lookout railing along the back edge, and the cliff face dropping
## away below it. A camera blocker like a wall (it stops nobody's view:
## the camera looks over it from the room side).
func _lookout_rail(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var z: float = -h.y + RAIL_Z_OFFSET
	m.origin = Transform3D.IDENTITY
	var posts: int = int(room_size.x / 1.6)
	for i in posts + 1:
		var px: float = -h.x + 0.3 + i * (room_size.x - 0.6) / float(posts)
		m.part(K.box(Vector3(0.16, 1.1, 0.16)), K.mat("wood_dark"), Vector3(px, 0.55, z))
	for ry in [0.55, 1.05]:
		m.part(K.box(Vector3(room_size.x - 0.4, 0.1, 0.1)), K.mat("wood"), Vector3(0, ry, z))
	# The cliff face below the edge, then the valley far below.
	m.part(K.box(Vector3(room_size.x + 8.0, 9.0, 0.6)), K.mat("rock"), Vector3(0, -4.5, -h.y - 0.25))
	m.part(K.box(Vector3(200.0, 0.2, 120.0)), K.mat("hill_far"), Vector3(0, -9.0, -h.y - 60.0))
	K.add_box_collider(_body, Vector3(room_size.x, CAMERA_BLOCK_HEIGHT, 0.4), K.xf(Vector3(0, CAMERA_BLOCK_HEIGHT * 0.5, z - 0.1)))


## Snowy peaks and clouds on the horizon, far beyond the railing.
func _horizon(m: MeshMerger, rng: RandomNumberGenerator) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	for i in 9:
		var px: float = -80.0 + i * 20.0 + rng.randf_range(-4.0, 4.0)
		var pz: float = -h.y - rng.randf_range(70.0, 95.0)
		var hgt: float = rng.randf_range(26.0, 40.0)
		var r: float = hgt * rng.randf_range(0.65, 0.85)
		m.part(K.cyl(0.0, r, hgt, 8), K.mat("mountain" if i % 2 == 0 else "hill_far"), Vector3(px, -9.0 + hgt * 0.5, pz), Vector3(0, rng.randf_range(0, 45), 0))
		m.part(K.cyl(0.0, r * 0.3, hgt * 0.3, 8), K.mat("snow"), Vector3(px, -9.0 + hgt * 0.86, pz), Vector3(0, rng.randf_range(0, 45), 0))
	# Small far clouds drifting below the peaks' tops (the shared Hub
	# cloud, scaled down).
	for i in 5:
		DecorProps.cloud(m, K.xf(Vector3(-48.0 + i * 24.0 + rng.randf_range(-6.0, 6.0), rng.randf_range(4.0, 9.0), -h.y - rng.randf_range(55.0, 75.0)), Vector3.ZERO, Vector3.ONE * rng.randf_range(0.55, 0.8)), rng)
	m.origin = Transform3D.IDENTITY


# --- props -------------------------------------------------------------------------

func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	_trailheads(m)

	# The telescope on a small deck at the lookout: "look ahead".
	var deck := Vector3(6.4, 0, -10.0)
	if is_free(deck, 1.2):
		m.origin = K.xf(deck)
		m.part(K.box(Vector3(2.4, 0.22, 1.7)), K.mat("wood"), Vector3(0, 0.11, 0))
		for i in 6:
			m.part(K.box(Vector3(0.04, 0.005, 1.7)), K.mat("wood_dark"), Vector3(-1.0 + i * 0.4, 0.223, 0))
		m.origin = Transform3D.IDENTITY
		DecorProps.telescope(m, K.xf(deck + Vector3(0.2, 0.22, -0.2), Vector3(0, 10.0, 0)))
		K.add_box_collider(body, Vector3(2.4, 0.25, 1.7), K.xf(deck + Vector3(0, 0.12, 0)))
		K.add_cyl_collider(body, 0.4, 1.6, K.xf(deck + Vector3(0.2, 0.95, -0.2)))
		spot("perch", deck + Vector3(0.2, 1.8, -0.4))

	# Milestone cairns along the path, each taller than the last: steps to a
	# goal.
	var cairns: Array = [Vector3(3.4, 0, 6.0), Vector3(3.4, 0, 2.6), Vector3(-3.8, 0, 0.6), Vector3(4.2, 0, -4.0)]
	for i in cairns.size():
		if is_free(cairns[i], 0.4):
			_cairn(m, cairns[i], i + 2)
			K.add_cyl_collider(body, 0.35, 0.4 + i * 0.3, K.xf(cairns[i] + Vector3(0, 0.2 + i * 0.15, 0)))

	# A picture signpost where the way on branches off.
	var sp := Vector3(-1.9, 0, -6.1)
	if is_free(sp, 0.3):
		_signpost(m, K.xf(sp))
		K.add_cyl_collider(body, 0.15, 2.4, K.xf(sp + Vector3(0, 1.2, 0)))

	# The summit flag.
	var flag := Vector3(9.2, 0, -6.4)
	if is_free(flag, 0.3):
		DecorProps.pole_flag(m, K.xf(flag, Vector3(0, -30.0, 0)), "sky", "cream", 4.4)
		K.add_cyl_collider(body, 0.24, 4.4, K.xf(flag + Vector3(0, 2.2, 0)))
		spot("perch", flag + Vector3(0, 4.6, 0))

	# Log benches facing the path, a map table by the way in.
	for lb in [[Vector3(-8.8, 0, 1.0), 90.0], [Vector3(8.8, 0, 2.6), -90.0]]:
		if is_free(lb[0], 0.9):
			_log_bench(m, K.xf(lb[0], Vector3(0, lb[1], 0)))
			K.add_box_collider(body, Vector3(1.9, 0.5, 0.5), K.xf(lb[0] + Vector3(0, 0.25, 0), Vector3(0, lb[1], 0)))
	var mt := Vector3(-7.4, 0, 6.4)
	if is_free(mt, 0.8):
		_map_table(m, K.xf(mt, Vector3(0, 20.0, 0)))
		K.add_box_collider(body, Vector3(1.4, 0.9, 0.9), K.xf(mt + Vector3(0, 0.45, 0), Vector3(0, 20.0, 0)))

	# Boulders and a few pines inside the meadow, away from the camera side.
	var rng := RandomNumberGenerator.new()
	rng.seed = 1717
	for b in [Vector3(-9.4, 0, -4.4), Vector3(9.6, 0, -1.6), Vector3(-6.0, 0, 3.2)]:
		if is_free(b, 0.7):
			DecorProps.rock(m, K.xf(b), 1.3, rng.randf_range(0, 90))
			K.add_cyl_collider(body, 0.7, 0.6, K.xf(b + Vector3(0, 0.3, 0)))
	for tp in [Vector3(-9.6, 0, -9.6), Vector3(9.6, 0, -9.6)]:
		if is_free(tp, 0.5):
			DecorProps.tree(m, K.xf(tp), "pine", 1.3)
			K.add_cyl_collider(body, 0.3, 2.0, K.xf(tp + Vector3(0, 1.0, 0)))
			spot("tree", tp + Vector3(0, 3.0, 0))


## A wooden trailhead around each onward door: two log posts and a little
## roof on a crossbar — above the door's ← / → sign.
func _trailheads(m: MeshMerger) -> void:
	var rp: Node3D = return_portal()
	for p in _portals:
		if p == rp:
			continue
		var pos: Vector3 = _local(p)
		var to_center := Vector2(-pos.x, -pos.z)
		var yaw: float = rad_to_deg(atan2(to_center.x, to_center.y)) if to_center.length() > 0.5 else 0.0
		var xf := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), Vector3(pos.x, 0, pos.z))
		m.origin = xf
		for sx in [-3.2, 3.2]:
			m.part(K.cyl(0.22, 0.26, 4.9, 8), K.mat("wood"), Vector3(sx, 2.45, -0.2))
			m.part(K.sphere(0.32, 8, 4), K.mat("rock"), Vector3(sx, 0.15, -0.2), Vector3.ZERO, Vector3(1.2, 0.6, 1.2))
		m.part(K.box(Vector3(7.0, 0.3, 0.3)), K.mat("wood_dark"), Vector3(0, 4.75, -0.2))
		m.part(K.prism(Vector3(7.4, 0.7, 1.2)), K.mat("teal_dark"), Vector3(0, 5.25, -0.2))
		m.origin = Transform3D.IDENTITY
		for sx in [-3.2, 3.2]:
			K.add_cyl_collider(_body, 0.3, 4.9, xf * K.xf(Vector3(sx, 2.45, -0.2)))
			var tp: Vector3 = xf * Vector3(sx, 0, -0.2)
			_authored.append(Rect2(tp.x - 0.8, tp.z - 0.8, 1.6, 1.6))
		spot("perch", xf * Vector3(0, 5.7, -0.2))


## A cairn of flat stones, `stones` high, topped with a small flag.
func _cairn(m: MeshMerger, p: Vector3, stones: int) -> void:
	m.origin = K.xf(p)
	var y: float = 0.0
	for i in stones:
		var r: float = 0.34 - i * 0.04
		m.part(K.sphere(r, 8, 4), K.mat("stone_dark" if i % 2 == 0 else "rock"), Vector3(0, y + r * 0.35, 0), Vector3(0, i * 37.0, 0), Vector3(1.0, 0.45, 0.85))
		y += r * 0.62
	m.part(K.cyl(0.015, 0.015, 0.5, 4), K.mat("wood_dark"), Vector3(0, y + 0.25, 0))
	m.part(K.prism(Vector3(0.24, 0.18, 0.02)), K.cloth("coral"), Vector3(0.12, y + 0.42, 0), Vector3(0, 0, -90))
	m.origin = Transform3D.IDENTITY


## A signpost in pictures: a heart board points the way on (Kindness
## Grove), a coin board points back (the way the trail came).
func _signpost(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(0.14, 2.4, 0.14)), K.mat("wood_dark"), Vector3(0, 1.2, 0))
	m.part(K.box(Vector3(1.2, 0.36, 0.06)), K.mat("cream"), Vector3(-0.5, 1.95, 0), Vector3(0, -20, 0))
	m.part(K.prism(Vector3(0.36, 0.3, 0.06)), K.mat("cream"), Vector3(-1.2, 1.95, -0.25), Vector3(0, -20, 90))
	m.part(K.sphere(0.08, 8, 4), K.mat("coral"), Vector3(-0.55, 1.98, 0.08), Vector3.ZERO, Vector3(1, 1, 0.4))
	m.part(K.sphere(0.08, 8, 4), K.mat("coral"), Vector3(-0.41, 1.98, 0.13), Vector3.ZERO, Vector3(1, 1, 0.4))
	m.part(K.prism(Vector3(0.26, 0.18, 0.04)), K.mat("coral"), Vector3(-0.48, 1.88, 0.11), Vector3(0, -20, 180))
	m.part(K.box(Vector3(1.1, 0.34, 0.06)), K.mat("cream"), Vector3(0.5, 1.45, 0), Vector3(0, 30, 0))
	m.part(K.prism(Vector3(0.34, 0.3, 0.06)), K.mat("cream"), Vector3(1.1, 1.45, 0.36), Vector3(0, 30, -90))
	m.part(K.cyl(0.11, 0.11, 0.04, 14), K.mat("gold"), Vector3(0.5, 1.45, 0.06), Vector3(90, 30, 0))
	m.origin = Transform3D.IDENTITY


## A bench made of a split log on two short stumps (sitter faces local +Z).
func _log_bench(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.cyl(0.24, 0.24, 1.8, 10), K.mat("wood"), Vector3(0, 0.42, 0), Vector3(0, 0, 90), Vector3(1, 1, 0.7))
	for sx in [-0.65, 0.65]:
		m.part(K.cyl(0.18, 0.2, 0.3, 8), K.mat("wood_dark"), Vector3(sx, 0.15, 0))
	m.origin = Transform3D.IDENTITY


## A small table with a trail map (paths and a flag), for planning the way.
func _map_table(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.3, 0.08, 0.8)), K.mat("wood"), Vector3(0, 0.82, 0))
	for sx in [-0.55, 0.55]:
		for sz in [-0.3, 0.3]:
			m.part(K.box(Vector3(0.08, 0.8, 0.08)), K.mat("wood_dark"), Vector3(sx, 0.4, sz))
	m.part(K.box(Vector3(1.0, 0.01, 0.6)), K.mat("parchment"), Vector3(0, 0.865, 0), Vector3(0, 4, 0))
	for i in 5:
		m.part(K.box(Vector3(0.12, 0.004, 0.03)), K.mat("coral"), Vector3(-0.38 + i * 0.17, 0.872, -0.12 + sin(i * 1.3) * 0.1))
	m.part(K.cyl(0.0, 0.07, 0.12, 4), K.mat("teal_dark"), Vector3(0.35, 0.93, 0.1))
	m.part(K.cyl(0.006, 0.006, 0.22, 4), K.mat("ink"), Vector3(-0.42, 0.98, -0.12))
	m.part(K.prism(Vector3(0.1, 0.08, 0.01)), K.mat("coral"), Vector3(-0.37, 1.06, -0.12), Vector3(0, 0, -90))
	m.origin = Transform3D.IDENTITY
