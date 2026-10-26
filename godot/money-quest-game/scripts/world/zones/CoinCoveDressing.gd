@tool
extends ZoneDressing
## Coin Cove — where the Money Quest trail reaches the sea: warm sand, a
## wooden boardwalk running from the way in down to a little pier, the sea
## beyond the shore (gently moving; still with Reduced Motion), rocky
## cliffs with grassy tops on both sides and a lighthouse on the far
## headland. Closed treasure chests with coins beside them (savings
## symbols, never prizes), a rowing boat drawn up on the sand, barrels and
## crates from the boats, shells on the sand, lanterns along the boardwalk.
##
## Only decoration: the zone's NPCs, quests, portals and B1's money-sort
## table are untouched. The table is added by CoinCove.gd after this node
## is built, so its place is reserved here (STATION) and a branch of the
## boardwalk leads to it.

## The B1 money-sort table (CoinCove.gd places it here).
const STATION := Vector3(4.6, 0, 0.4)
## Its footprint plus a step around it: no prop stands here.
const STATION_RESERVE := Rect2(3.6, -1.1, 2.0, 3.0)
## Where the wet sand begins (the sea is beyond the back edge).
const SHORE_Z: float = -9.4


func _init() -> void:
	district_style = "coin_cove"


func _read_zone() -> void:
	super._read_zone()
	_authored.append(STATION_RESERVE)


## The boardwalk: the standard aisle and branches, plus one to the table.
func _compute_path_segments() -> Array:
	var segs: Array = super._compute_path_segments()
	if not segs.is_empty():
		var aisle_x: float = (segs[0][0] as Vector2).x
		segs.append([Vector2(aisle_x, STATION.z), Vector2(STATION.x - 1.9, STATION.z)])
	return segs


# --- sand and sea ---------------------------------------------------------------

func _build_floor(m: MeshMerger) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	m.part(K.box(Vector3(room_size.x, 0.06, room_size.y)), K.mat(floor_color), Vector3(0, 0.03, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 2207
	# Soft patches of paler and darker sand (no tiles: this is a beach).
	for i in 12:
		var r: float = rng.randf_range(0.5, 1.1)
		var p := Vector3(rng.randf_range(-h.x + 1.0, h.x - 1.0), 0.061, rng.randf_range(SHORE_Z + 1.2, h.y - 1.0))
		m.part(K.cyl(r, r, 0.004, 14), K.mat(floor_accent), p, Vector3(0, rng.randf_range(0.0, 180.0), 0), Vector3(1.0, 1.0, rng.randf_range(0.45, 0.8)))
	# Wet sand down to the water, and a ruffle of foam along the edge.
	var wet: float = h.y + SHORE_Z
	m.part(K.box(Vector3(room_size.x, 0.004, wet)), K.mat("path_wood"), Vector3(0, 0.062, -h.y + wet * 0.5))
	var fx: float = -h.x
	while fx < h.x:
		var w: float = rng.randf_range(0.8, 1.6)
		m.part(K.cyl(w * 0.5, w * 0.5, 0.01, 10), K.mat("cream"), Vector3(fx + w * 0.5, 0.064, -h.y + 0.15), Vector3.ZERO, Vector3(1, 1, 0.45))
		fx += w * 0.85
	# The sea, beyond the room's edge (nobody can walk into it): shallow
	# near the shore, deeper further out.
	m.part(K.box(Vector3(160.0, 0.04, 14.0)), K.water_mat("water"), Vector3(0, 0.0, -h.y - 7.0))
	m.part(K.box(Vector3(160.0, 0.04, 70.0)), K.water_mat("water_deep"), Vector3(0, -0.01, -h.y - 49.0))
	# Shells and starfish on the sand (flat: nothing to trip over).
	for i in 22:
		var p := Vector3(rng.randf_range(-h.x + 1.2, h.x - 1.2), 0.06, rng.randf_range(SHORE_Z - 1.5, h.y - 2.0))
		if not is_free(p, 0.15):
			continue
		if i % 4 == 0:
			for k in 5:
				m.part(K.box(Vector3(0.05, 0.03, 0.2)), K.mat("coral"), p + Vector3(0, 0.015, 0) + Basis(Vector3.UP, TAU * k / 5.0) * Vector3(0, 0, 0.09), Vector3(0, rad_to_deg(TAU * k / 5.0), 0))
		else:
			var r: float = rng.randf_range(0.08, 0.13)
			m.part(K.sphere(r, 8, 4), K.mat(["cream", "blossom", "parchment"][i % 3]), p, Vector3(0, rng.randf_range(0.0, 180.0), 0), Vector3(1.0, 0.45, 0.8))


# --- the cove's edges: cliffs on both sides, a rope fence at the front --------------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var rng := RandomNumberGenerator.new()
	rng.seed = 7311
	m.origin = Transform3D.IDENTITY
	for side in [-1.0, 1.0]:
		var z: float = h.y + 1.0
		while z > -h.y - 9.0:
			var s: float = rng.randf_range(1.5, 2.4)
			var in_sea: bool = z < -h.y
			var hgt: float = rng.randf_range(2.6, 4.0) if in_sea else rng.randf_range(3.6, 6.2)
			var p := Vector3(side * (h.x + s * 0.7 + rng.randf_range(-0.15, 0.35)), hgt * 0.5 - 0.35, z)
			m.part(K.sphere(s, 9, 5), K.mat(["rock", "mountain", "stone_dark"][rng.randi() % 3]), p, Vector3(0, rng.randf_range(0.0, 360.0), 0), Vector3(1.0, hgt / (s * 2.0), 1.0))
			if not in_sea or rng.randf() < 0.5:
				m.part(K.sphere(s * 0.78, 9, 4), K.mat("grass" if rng.randf() < 0.6 else "leaf"), p + Vector3(0, hgt * 0.5 - 0.1, 0), Vector3.ZERO, Vector3(1.0, 0.28, 1.0))
			z -= s * 1.25
		# The cliff is the room's side wall: world collision and a camera
		# blocker rising well above the rocks (as ZoneDressing's walls do),
		# set in front of the rocks so the camera never ends up inside one.
		K.add_box_collider(_body, Vector3(0.5, CAMERA_BLOCK_HEIGHT, room_size.y), K.xf(Vector3(side * (h.x - 1.2), CAMERA_BLOCK_HEIGHT * 0.5, 0)))
	# Front (the camera side): a low rope fence on wooden posts.
	var front_z: float = h.y - 0.3
	var posts: int = int(room_size.x / 2.0)
	for i in posts + 1:
		var px: float = -h.x + 0.4 + i * (room_size.x - 0.8) / float(posts)
		m.part(K.cyl(0.11, 0.13, 1.0, 8), K.mat("wood_dark"), Vector3(px, 0.5, front_z))
		m.part(K.sphere(0.13, 8, 4), K.mat("wood_dark"), Vector3(px, 1.02, front_z))
	for ry in [0.55, 0.85]:
		m.part(K.cyl(0.035, 0.035, room_size.x - 0.8, 6), K.mat("path_wood"), Vector3(0, ry, front_z), Vector3(0, 0, 90))


# --- props -------------------------------------------------------------------------

func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	_boardwalk(m)
	_lighthouse(m, Vector3(h.x + 2.2, 0, -h.y - 6.0))

	# Treasure chests (closed: savings, not prizes), coins piled beside them.
	for c in [[Vector3(-9.0, 0, -2.6), 35.0], [Vector3(9.0, 0, -6.6), -30.0]]:
		if is_free(c[0], 0.8):
			DecorProps.chest(m, K.xf(c[0], Vector3(0, c[1], 0)))
			K.add_box_collider(body, Vector3(1.0, 0.8, 0.7), K.xf(c[0] + Vector3(0, 0.4, 0), Vector3(0, c[1], 0)))
			_coin_pile(m, c[0] + Basis(Vector3.UP, deg_to_rad(c[1])) * Vector3(0.9, 0, 0.35))
			spot("sparkle", c[0] + Vector3(0, 1.0, 0))

	# A rowing boat drawn up on the wet sand.
	var boat := Vector3(8.2, 0, -9.7)
	if is_free(boat, 1.0):
		DecorProps.rowboat(m, K.xf(boat, Vector3(0, 62.0, 0)), "coral")
		K.add_box_collider(body, Vector3(1.1, 0.6, 2.7), K.xf(boat + Vector3(0, 0.3, 0), Vector3(0, 62.0, 0)))
		spot("perch", boat + Vector3(0, 0.6, 0))

	# Crates and barrels unloaded from the boats.
	var crates := Vector3(-9.3, 0, 5.0)
	if is_free(crates, 0.8):
		DecorProps.crate_stack(m, K.xf(crates, Vector3(0, 25.0, 0)), ["gold", "coral"])
		K.add_box_collider(body, Vector3(1.4, 0.8, 0.6), K.xf(crates + Vector3(0.35, 0.4, 0), Vector3(0, 25.0, 0)))
	for b in [Vector3(-9.6, 0, 7.4), Vector3(-8.7, 0, 7.9), Vector3(9.4, 0, 6.2), Vector3(9.6, 0, 5.2)]:
		if is_free(b, 0.4):
			DecorProps.barrel(m, K.xf(b))
			K.add_cyl_collider(body, 0.36, 0.9, K.xf(b + Vector3(0, 0.45, 0)))

	# Rocks at the foot of the cliffs.
	for r in [[Vector3(-10.3, 0, -8.6), 1.0], [Vector3(10.4, 0, -3.4), 0.9], [Vector3(-10.4, 0, 2.8), 0.8], [Vector3(10.2, 0, 2.6), 0.7]]:
		if is_free(r[0], 0.6):
			DecorProps.rock(m, K.xf(r[0]), r[1], r[0].x * 17.0)
			K.add_cyl_collider(body, 0.55 * r[1], 0.5, K.xf(r[0] + Vector3(0, 0.25, 0)))

	# Lanterns along the boardwalk.
	for lp in [Vector3(-2.9, 0, 1.6), Vector3(2.9, 0, 4.6), Vector3(2.9, 0, -8.9), Vector3(-2.9, 0, -10.4)]:
		if is_free(lp, 0.35):
			DecorProps.lamp(m, K.xf(lp), "gold")
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
			spot("perch", lp + Vector3(0, 3.72, 0))


## Plank seams across the boardwalk, and the pier that carries it on over
## the water (beyond the room's edge, on posts — a place for gulls).
func _boardwalk(m: MeshMerger) -> void:
	if _segments.is_empty():
		return
	var h: Vector2 = half()
	var a: Vector2 = _segments[0][0]
	var b: Vector2 = _segments[0][1]
	m.origin = Transform3D.IDENTITY
	var z: float = a.y + PATH_WIDTH * 0.5 - 0.35
	while z > b.y - PATH_WIDTH * 0.5 + 0.2:
		m.part(K.box(Vector3(PATH_WIDTH - 0.1, 0.006, 0.05)), K.mat("wood_dark"), Vector3(a.x, 0.108, z))
		z -= 0.7
	var length: float = 7.5
	var pier_z: float = -h.y - length * 0.5
	m.part(K.box(Vector3(PATH_WIDTH, 0.14, length)), K.mat(path_color), Vector3(a.x, 0.28, pier_z))
	var sz: float = -h.y - 0.35
	while sz > -h.y - length + 0.2:
		m.part(K.box(Vector3(PATH_WIDTH - 0.1, 0.006, 0.05)), K.mat("wood_dark"), Vector3(a.x, 0.354, sz))
		sz -= 0.7
	for side in [-1.0, 1.0]:
		var px: float = a.x + side * (PATH_WIDTH * 0.5 + 0.06)
		for k in 5:
			var pz: float = -h.y - 0.6 - k * 1.7
			m.part(K.cyl(0.12, 0.14, 1.5, 8), K.mat("wood_dark"), Vector3(px, 0.25, pz))
			m.part(K.sphere(0.13, 8, 4), K.mat("wood_dark"), Vector3(px, 1.0, pz))
			if k == 4:
				spot("perch", Vector3(px, 1.15, pz))
		m.part(K.cyl(0.035, 0.035, length - 0.6, 6), K.mat("path_wood"), Vector3(px, 0.85, pier_z - 0.1), Vector3(90, 0, 0))


## A striped lighthouse on a rock in the sea: a landmark that says "coast".
func _lighthouse(m: MeshMerger, p: Vector3) -> void:
	m.origin = Transform3D.IDENTITY
	m.part(K.sphere(2.6, 9, 5), K.mat("rock"), p + Vector3(0, 0.3, 0), Vector3.ZERO, Vector3(1.0, 0.5, 1.0))
	m.part(K.sphere(1.6, 9, 4), K.mat("grass"), p + Vector3(0, 1.45, 0), Vector3.ZERO, Vector3(1.0, 0.22, 1.0))
	var base: Vector3 = p + Vector3(0, 1.4, 0)
	for i in 4:
		var r0: float = 1.1 - i * 0.12
		var r1: float = 1.1 - (i + 1) * 0.12
		m.part(K.cyl(r1, r0, 1.6, 14), K.mat("cream" if i % 2 == 0 else "coral"), base + Vector3(0, 0.8 + i * 1.6, 0))
	var top: Vector3 = base + Vector3(0, 6.4, 0)
	m.part(K.cyl(0.95, 0.95, 0.16, 14), K.mat("teal_dark"), top + Vector3(0, 0.08, 0))
	m.part(K.cyl(0.48, 0.48, 0.8, 12), K.mat("window_warm", 1.6), top + Vector3(0, 0.56, 0))
	m.part(K.cyl(0.0, 0.75, 0.7, 12), K.mat("coral"), top + Vector3(0, 1.31, 0))
	m.part(K.sphere(0.1, 6, 3), K.mat("gold"), top + Vector3(0, 1.72, 0))
	spot("perch", top + Vector3(0.7, 0.25, 0))


## Three little stacks of coins and one lying flat, beside a chest.
func _coin_pile(m: MeshMerger, p: Vector3) -> void:
	m.origin = Transform3D.IDENTITY
	var coin := K.cyl(0.11, 0.11, 0.04, 12)
	for i in 3:
		var n: int = [4, 2, 6][i]
		for j in n:
			m.part(coin, K.mat("gold" if j % 2 == 0 else "gold_deep"), p + Vector3(i * 0.25 - 0.25, 0.08 + j * 0.042, (i % 2) * 0.15))
	m.part(coin, K.mat("gold"), p + Vector3(0.32, 0.1, -0.22), Vector3(70, 0, 20))
