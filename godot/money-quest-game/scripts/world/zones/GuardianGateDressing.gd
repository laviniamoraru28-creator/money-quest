@tool
extends ZoneDressing
## Guardian Gate — keeping money safe, said by the place itself: a stone
## courtyard inside battlemented walls, round towers in the back corners,
## a great shield with a key on the back wall (where the golden path
## leads), shields and lanterns along the walls, and a gatehouse — two
## square towers and a lintel with the portcullis raised — framing the
## way on. Shields are protection, never weapons; flowers by the way in
## keep it welcoming.
##
## Only decoration: the zone's NPCs, quests, portals and B1's message
## board are untouched. The board is added by GuardianGate.gd after this
## node is built, so its place is reserved here (STATION) and a branch of
## the path leads to it. The gatehouse stands clear of the door sign over
## the way on (its lintel is above it).

## The B1 message board (GuardianGate.gd places it here).
const STATION := Vector3(4.6, 0, -0.6)
## Its footprint plus a step around it: no prop stands here.
const STATION_RESERVE := Rect2(3.5, -1.9, 2.2, 2.6)
const WALL_HEIGHT: float = 4.6
const WALL_THICKNESS: float = 0.8
## Shields along the walls: field colour + emblem shape (never colour alone).
const SHIELDS: Array = [["teal", "ring"], ["coral", "cross"], ["sky", "dot"], ["teal_dark", "key"]]


func _init() -> void:
	district_style = "guardian_gate"


func _read_zone() -> void:
	super._read_zone()
	_authored.append(STATION_RESERVE)


## The golden path: the standard aisle and branches, plus one to the board.
func _compute_path_segments() -> Array:
	var segs: Array = super._compute_path_segments()
	if not segs.is_empty():
		var aisle_x: float = (segs[0][0] as Vector2).x
		segs.append([Vector2(aisle_x, STATION.z), Vector2(STATION.x - 2.0, STATION.z)])
	return segs


# --- flagstones ----------------------------------------------------------------------

## Flagstones laid in offset rows (not a checkerboard), dark grout between.
func _build_floor(m: MeshMerger) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	m.part(K.box(Vector3(room_size.x, 0.06, room_size.y)), K.mat(floor_color), Vector3(0, 0.03, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 5150
	var depth: float = 1.5
	var row: int = 0
	var z: float = -h.y
	while z < h.y - 0.01:
		var d: float = minf(depth, h.y - z)
		var x: float = -h.x - (0.0 if row % 2 == 0 else 0.9)
		while x < h.x - 0.01:
			var w: float = rng.randf_range(1.4, 2.2)
			var x0: float = maxf(x, -h.x)
			var x1: float = minf(x + w, h.x)
			if x1 - x0 > 0.3:
				var c: String = floor_accent if rng.randf() < 0.7 else "stone_dark"
				m.part(K.box(Vector3(x1 - x0 - 0.1, 0.004, d - 0.1)), K.mat(c), Vector3((x0 + x1) * 0.5, 0.062, z + d * 0.5))
			x += w
		z += depth
		row += 1


# --- battlements, towers and a low parapet ----------------------------------------------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var t: float = WALL_THICKNESS
	_battlement(m, Vector3(0, 0, -h.y + t * 0.5), room_size.x, 0.0, WALL_HEIGHT, true)
	for side in [-1.0, 1.0]:
		_battlement(m, Vector3(side * (h.x - t * 0.5), 0, 0), room_size.y, -90.0 * side, WALL_HEIGHT - 0.4, false)
		_round_tower(m, Vector3(side * (h.x - 1.0), 0, -h.y + 1.0), 1.8, 7.2)
	# Front (the camera side): a low crenellated parapet it looks over.
	m.origin = Transform3D.IDENTITY
	var front_z: float = h.y - 0.3
	m.part(K.box(Vector3(room_size.x, 0.6, 0.5)), K.mat(wall_color), Vector3(0, 0.3, front_z))
	m.part(K.box(Vector3(room_size.x, 0.1, 0.6)), K.mat(wainscot_color), Vector3(0, 0.62, front_z))
	var n: int = int(room_size.x / 1.2)
	for i in n:
		if i % 2 == 0:
			m.part(K.box(Vector3(0.6, 0.32, 0.5)), K.mat(wall_color), Vector3(-h.x + 0.6 + i * 1.2, 0.83, front_z))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.8, 1.4, 0.8)), K.mat(wainscot_color), Vector3(side * (h.x - 0.4), 0.7, front_z))
		m.part(K.box(Vector3(0.3, 0.36, 0.3)), K.mat("window_warm", 1.2), Vector3(side * (h.x - 0.4), 1.6, front_z))
		m.part(K.cyl(0.0, 0.3, 0.3, 4), K.mat(pilaster_color), Vector3(side * (h.x - 0.4), 1.93, front_z), Vector3(0, 45, 0))


## One battlemented wall: `center` on the floor, inside face (local +Z)
## toward the room. Merlons along the top, arrow slits, lanterns and
## shields on the inside face (kept clear of the corner towers and, on the
## back wall, of the great shield and its banners). Same collision as
## ZoneDressing's walls.
func _battlement(m: MeshMerger, center: Vector3, length: float, yaw: float, height: float, back: bool) -> void:
	var base := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), center)
	var t: float = WALL_THICKNESS
	var inner: float = t * 0.5 + 0.02
	m.origin = base
	m.part(K.box(Vector3(length, height, t)), K.mat(wall_color), Vector3(0, height * 0.5, 0))
	m.part(K.box(Vector3(length, 0.45, t + 0.14)), K.mat(wainscot_color), Vector3(0, 0.225, 0))
	m.part(K.box(Vector3(length, 0.14, t + 0.12)), K.mat(wainscot_color), Vector3(0, height - 0.55, 0))
	var count: int = int(length / 1.1)
	for i in count:
		if i % 2 == 0:
			m.part(K.box(Vector3(0.62, 0.7, t)), K.mat(wall_color), Vector3(-length * 0.5 + 0.55 + i * 1.1, height + 0.35, 0))
	# Arrow slits and lanterns, evenly along the wall.
	var bays: int = maxi(int(length / 4.4), 1)
	for i in bays:
		var x: float = -length * 0.5 + length * (float(i) + 0.5) / float(bays)
		if _bay_ok(x, length, back):
			m.part(K.box(Vector3(0.16, 0.9, 0.04)), K.mat("ink"), Vector3(x, height - 0.95, inner))
		var lx: float = x + length / float(bays) * 0.5
		if _bay_ok(lx, length, back):
			m.part(K.box(Vector3(0.12, 0.12, 0.34)), K.mat("teal_dark"), Vector3(lx, 2.3, inner + 0.15))
			m.part(K.box(Vector3(0.3, 0.38, 0.3)), K.mat("window_warm", 1.2), Vector3(lx, 2.1, inner + 0.36))
			m.part(K.cyl(0.0, 0.3, 0.28, 4), K.mat(pilaster_color), Vector3(lx, 2.43, inner + 0.36), Vector3(0, 45, 0))
	m.origin = Transform3D.IDENTITY
	# Shields below the slits (DecorProps.shield moves the origin).
	for i in bays:
		var x: float = -length * 0.5 + length * (float(i) + 0.5) / float(bays)
		if not _bay_ok(x, length, back):
			continue
		var sh: Array = SHIELDS[(i + int(absf(yaw))) % SHIELDS.size()]
		DecorProps.shield(m, base * K.xf(Vector3(x, 2.2, inner + 0.05)), sh[0], trim_color, sh[1], 0.8)
	m.origin = Transform3D.IDENTITY
	var block_h: float = maxf(height, CAMERA_BLOCK_HEIGHT)
	K.add_box_collider(_body, Vector3(length, block_h, t), base * K.xf(Vector3(0, block_h * 0.5, 0)))


## A wall decoration at `x` (along the wall) stays clear of the corner
## towers at the ends and, on the back wall, of the great shield.
func _bay_ok(x: float, length: float, back: bool) -> bool:
	if absf(x) > length * 0.5 - 2.6:
		return false
	return not back or absf(x) > 3.8


## A round corner tower with a crenellated top and a pointed roof.
func _round_tower(m: MeshMerger, p: Vector3, r: float, height: float) -> void:
	m.origin = Transform3D.IDENTITY
	m.part(K.cyl(r, r + 0.1, height, 16), K.mat(wall_color), p + Vector3(0, height * 0.5, 0))
	m.part(K.cyl(r + 0.15, r + 0.2, 0.5, 16), K.mat(wainscot_color), p + Vector3(0, 0.25, 0))
	m.part(K.cyl(r + 0.2, r + 0.2, 0.18, 16), K.mat(wainscot_color), p + Vector3(0, height - 0.1, 0))
	for i in 8:
		var a: float = TAU * float(i) / 8.0
		m.part(K.box(Vector3(0.55, 0.6, 0.4)), K.mat(wall_color), p + Vector3(cos(a) * (r - 0.05), height + 0.3, sin(a) * (r - 0.05)), Vector3(0, -rad_to_deg(a) + 90.0, 0))
	m.part(K.cyl(0.0, r * 0.95, 2.0, 16), K.mat(pilaster_color), p + Vector3(0, height + 1.4, 0))
	m.part(K.sphere(0.16, 8, 4), K.mat(trim_color), p + Vector3(0, height + 2.45, 0))
	spot("perch", p + Vector3(0, height + 2.6, 0))
	K.add_cyl_collider(_body, r, CAMERA_BLOCK_HEIGHT, K.xf(p + Vector3(0, CAMERA_BLOCK_HEIGHT * 0.5, 0)))


# --- props -------------------------------------------------------------------------

func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	_gatehouse(m, body)

	# The great shield with a key on the back wall, where the path leads,
	# with a banner on each side.
	var back_face: float = -h.y + WALL_THICKNESS + 0.04
	DecorProps.shield(m, K.xf(Vector3(0, 2.75, back_face + 0.05)), "teal", trim_color, "key", 2.1)
	for bx in [-3.0, 3.0]:
		DecorProps.wall_banner(m, K.xf(Vector3(bx, 0, back_face)), "teal_dark", "gold")
	spot("sparkle", Vector3(0, 3.0, back_face + 0.4))

	# A strongbox with a padlock: what the gate keeps safe.
	var box := Vector3(8.8, 0, -8.4)
	if is_free(box, 0.8):
		DecorProps.chest(m, K.xf(box, Vector3(0, -25.0, 0)))
		m.origin = K.xf(box, Vector3(0, -25.0, 0))
		m.part(K.torus(0.07, 0.11, 12, 4), K.mat("gold_deep"), Vector3(0, 0.56, 0.4), Vector3(90, 0, 0))
		m.part(K.box(Vector3(0.22, 0.18, 0.08)), K.mat("gold_deep"), Vector3(0, 0.44, 0.4))
		m.origin = Transform3D.IDENTITY
		K.add_box_collider(body, Vector3(1.0, 0.8, 0.7), K.xf(box + Vector3(0, 0.4, 0), Vector3(0, -25.0, 0)))
		spot("sparkle", box + Vector3(0, 1.0, 0))

	# A rack of standing shields by the way in.
	var rack := Vector3(-9.2, 0, 5.6)
	if is_free(rack, 0.9):
		_shield_rack(m, K.xf(rack, Vector3(0, 90.0, 0)))
		K.add_box_collider(body, Vector3(1.9, 1.4, 0.6), K.xf(rack + Vector3(0, 0.7, 0), Vector3(0, 90.0, 0)))

	for b in [Vector3(9.4, 0, 6.4), Vector3(9.6, 0, 5.4), Vector3(-9.5, 0, -6.4)]:
		if is_free(b, 0.4):
			DecorProps.barrel(m, K.xf(b))
			K.add_cyl_collider(body, 0.36, 0.9, K.xf(b + Vector3(0, 0.45, 0)))

	# Flowers by the way in: a guarded place, and a friendly one.
	for pp in [Vector3(-3.4, 0, 6.6), Vector3(3.4, 0, 6.6), Vector3(9.4, 0, -3.8)]:
		if is_free(pp, 0.45):
			DecorProps.potted_plant(m, K.xf(pp), "teal", "gold")
			K.add_cyl_collider(body, 0.42, 1.2, K.xf(pp + Vector3(0, 0.6, 0)))
			spot("tree", pp + Vector3(0, 1.4, 0))

	# Lantern posts along the golden path.
	for lp in [Vector3(-2.8, 0, 1.2), Vector3(2.8, 0, 4.6), Vector3(2.8, 0, -8.6), Vector3(-2.8, 0, -8.6)]:
		if is_free(lp, 0.35):
			DecorProps.lamp(m, K.xf(lp), "teal")
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
			spot("perch", lp + Vector3(0, 3.72, 0))


## The way on (each onward door): two square towers and a lintel with
## the portcullis raised, built around the door's glowing arch. The lintel
## sits above the door's ← / → sign, so the sign stays in view.
func _gatehouse(m: MeshMerger, body: StaticBody3D) -> void:
	var rp: Node3D = return_portal()
	for p in _portals:
		if p == rp:
			continue
		var pos: Vector3 = _local(p)
		var to_center := Vector2(-pos.x, -pos.z)
		var yaw: float = rad_to_deg(atan2(to_center.x, to_center.y)) if to_center.length() > 0.5 else 0.0
		var xf := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), Vector3(pos.x, 0, pos.z))
		m.origin = xf
		for sx in [-3.6, 3.6]:
			m.part(K.box(Vector3(1.6, 5.6, 1.6)), K.mat(wall_color), Vector3(sx, 2.8, -0.2))
			m.part(K.box(Vector3(1.8, 0.45, 1.8)), K.mat(wainscot_color), Vector3(sx, 0.225, -0.2))
			for cx in [-0.55, 0.55]:
				for cz in [-0.55, 0.55]:
					m.part(K.box(Vector3(0.45, 0.6, 0.45)), K.mat(wall_color), Vector3(sx + cx, 5.9, -0.2 + cz))
		m.part(K.box(Vector3(8.8, 0.9, 1.4)), K.mat(wall_color), Vector3(0, 5.05, -0.2))
		m.part(K.box(Vector3(8.8, 0.12, 1.5)), K.mat(wainscot_color), Vector3(0, 4.62, -0.2))
		for i in 8:
			if i % 2 == 0:
				m.part(K.box(Vector3(0.6, 0.6, 1.2)), K.mat(wall_color), Vector3(-3.85 + i * 1.1, 5.8, -0.2))
		# The portcullis, raised: only its spiked lower edge shows.
		m.part(K.box(Vector3(4.4, 0.22, 0.1)), K.mat("teal_dark"), Vector3(0, 4.42, 0.3))
		for i in 9:
			m.part(K.cyl(0.0, 0.07, 0.24, 4), K.mat("teal_dark"), Vector3(-2.0 + i * 0.5, 4.2, 0.3), Vector3(180, 0, 0))
		m.origin = Transform3D.IDENTITY
		for sx in [-3.6, 3.6]:
			DecorProps.shield(m, xf * K.xf(Vector3(sx, 3.2, 0.65)), "teal", trim_color, "ring", 0.8)
			# Architecture, like the walls: the camera stays in front of it.
			K.add_box_collider(_body, Vector3(1.6, 5.6, 1.6), xf * K.xf(Vector3(sx, 2.8, -0.2)))
			var tp: Vector3 = xf * Vector3(sx, 0, -0.2)
			_authored.append(Rect2(tp.x - 1.2, tp.z - 1.2, 2.4, 2.4))
			spot("perch", xf * Vector3(sx, 6.3, -0.2))
		DecorProps.shield(m, xf * K.xf(Vector3(0, 5.05, 0.55)), "teal_dark", trim_color, "key", 0.75)
		m.origin = Transform3D.IDENTITY


## Three standing shields on a wooden rack (protection on display).
func _shield_rack(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.9, 0.1, 0.5)), K.mat("wood_dark"), Vector3(0, 0.05, 0))
	for sx in [-0.85, 0.85]:
		m.part(K.box(Vector3(0.1, 1.3, 0.1)), K.mat("wood_dark"), Vector3(sx, 0.65, -0.15))
	m.part(K.box(Vector3(1.8, 0.08, 0.08)), K.mat("wood_dark"), Vector3(0, 1.22, -0.15))
	for i in 3:
		var sh: Array = SHIELDS[i]
		DecorProps.shield(m, x * K.xf(Vector3(-0.6 + i * 0.6, 0.72, 0.05), Vector3(-10, 0, 0)), sh[0], "gold", sh[1], 0.55)
	m.origin = Transform3D.IDENTITY
