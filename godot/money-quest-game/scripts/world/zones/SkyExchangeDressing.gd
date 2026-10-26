@tool
extends ZoneDressing
## Sky Exchange — money around the world, as a bright travel hall: tall
## walls of sky windows with clouds, a departures board in pictures (flag
## stripes, coins and arrows — no words), two exchange counters stacked
## with coins of different shapes and colours, a big globe, luggage
## trolleys and suitcases, rows of travellers' seats, flag bunting overhead
## and a model plane hanging from the roof beams.
##
## Only decoration: the zone's twelve NPCs, quests and portals are
## untouched. The middle of the hall belongs to the NPCs, so the dressing
## lives along the walls and in the front corners (every prop passes
## is_free(), which keeps the standard clearance around each NPC).

const WALL_HEIGHT: float = 6.0
const BEAM_Y: float = 6.3
## Plain striped flags: colour pairs (no real country is shown).
const FLAGS: Array = [["coral", "cream"], ["sky", "gold"], ["leaf", "cream"], ["gold", "teal"], ["lilac", "cream"], ["teal", "coral"]]


func _init() -> void:
	district_style = "sky_exchange"


# --- the hall: sky windows on three sides ---------------------------------------------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var t: float = 0.5
	_window_wall(m, Vector3(0, 0, -h.y + t * 0.5), room_size.x, 0.0, true)
	for side in [-1.0, 1.0]:
		_window_wall(m, Vector3(side * (h.x - t * 0.5), 0, 0), room_size.y, -90.0 * side, false)
	# Front (the camera side): the standard low balustrade.
	m.origin = Transform3D.IDENTITY
	var front_z: float = h.y - 0.25
	m.part(K.box(Vector3(room_size.x, 0.18, 0.5)), K.mat("stone_dark"), Vector3(0, 0.09, front_z))
	m.part(K.box(Vector3(room_size.x, 0.14, 0.4)), K.mat(trim_color), Vector3(0, 0.95, front_z))
	var count: int = int(room_size.x / 0.9)
	for i in count:
		var bx: float = -h.x + 0.45 + i * (room_size.x - 0.9) / float(maxi(count - 1, 1))
		m.part(K.cyl(0.07, 0.09, 0.8, 8), K.mat(pilaster_color), Vector3(bx, 0.5, front_z))
	# Roof beams across the hall (high above the camera).
	for bz in [-3.0, -8.0]:
		m.part(K.box(Vector3(room_size.x, 0.35, 0.35)), K.mat(wainscot_color), Vector3(0, BEAM_Y, bz))


## A hall wall: a solid lower band, then tall sky windows with clouds
## between slim mullions, and a cornice. Inside face toward local +Z.
func _window_wall(m: MeshMerger, center: Vector3, length: float, yaw: float, back: bool) -> void:
	var base := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), center)
	var t: float = 0.5
	var inner: float = t * 0.5 + 0.02
	m.origin = base
	m.part(K.box(Vector3(length, WALL_HEIGHT, t)), K.mat("cream"), Vector3(0, WALL_HEIGHT * 0.5, 0))
	m.part(K.box(Vector3(length, 1.1, t + 0.1)), K.mat(wainscot_color), Vector3(0, 0.55, 0))
	m.part(K.box(Vector3(length, 0.12, t + 0.14)), K.mat(trim_color), Vector3(0, 1.12, 0))
	m.part(K.box(Vector3(length, 0.4, t + 0.24)), K.mat(wainscot_color), Vector3(0, WALL_HEIGHT - 0.2, 0))
	var panes: int = int(length / 2.4)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(absf(yaw)) * 31 + (7 if back else 3)
	for i in panes:
		var x: float = -length * 0.5 + length * (float(i) + 0.5) / float(panes)
		# On the back wall the departures board takes the middle.
		if back and absf(x) < 4.0:
			continue
		m.part(K.box(Vector3(2.1, 4.0, 0.05)), K.mat("sky_light", 0.2), Vector3(x, 3.35, inner))
		for c in 2:
			var cp := Vector3(x + rng.randf_range(-0.6, 0.6), rng.randf_range(2.4, 4.7), inner + 0.03)
			m.part(K.sphere(0.32, 10, 5), K.mat("white", 0.25), cp, Vector3.ZERO, Vector3(1.4, 0.55, 0.15))
			m.part(K.sphere(0.24, 10, 5), K.mat("white", 0.25), cp + Vector3(0.3, 0.08, 0), Vector3.ZERO, Vector3(1.2, 0.6, 0.15))
	for i in panes + 1:
		var x: float = -length * 0.5 + length * float(i) / float(panes)
		m.part(K.box(Vector3(0.18, WALL_HEIGHT - 1.1, 0.14)), K.mat(pilaster_color), Vector3(x, 1.1 + (WALL_HEIGHT - 1.1) * 0.5, inner))
	if back:
		_departures_board(m, base, inner)
	m.origin = Transform3D.IDENTITY
	var block_h: float = maxf(WALL_HEIGHT, CAMERA_BLOCK_HEIGHT)
	K.add_box_collider(_body, Vector3(length, block_h, t), base * K.xf(Vector3(0, block_h * 0.5, 0)))


## The departures board, in pictures: each row a flag (stripes), an arrow
## and a coin of that place — "money is different around the world".
func _departures_board(m: MeshMerger, base: Transform3D, inner: float) -> void:
	m.origin = base
	m.part(K.box(Vector3(7.4, 3.2, 0.12)), K.mat("ink"), Vector3(0, 3.7, inner + 0.06))
	m.part(K.box(Vector3(7.6, 0.14, 0.16)), K.mat(trim_color), Vector3(0, 5.36, inner + 0.08))
	var coins: Array = ["gold", "white", "coral", "gold_deep", "verdigris"]
	for r in 5:
		var y: float = 4.9 - r * 0.58
		var flag: Array = FLAGS[r % FLAGS.size()]
		for s in 2:
			m.part(K.box(Vector3(0.8, 0.18, 0.02)), K.mat(flag[s], 0.3), Vector3(-2.7, y + 0.09 - s * 0.18, inner + 0.13))
		m.part(K.box(Vector3(1.3, 0.07, 0.02)), K.mat("cream", 0.4), Vector3(-1.2, y, inner + 0.13))
		m.part(K.prism(Vector3(0.24, 0.24, 0.02)), K.mat("cream", 0.4), Vector3(-0.45, y, inner + 0.13), Vector3(0, 0, -90))
		m.part(K.cyl(0.2, 0.2, 0.02, 14), K.mat(coins[r], 0.3), Vector3(0.6, y, inner + 0.13), Vector3(90, 0, 0))
		for d in 3:
			m.part(K.box(Vector3(0.22, 0.3, 0.02)), K.mat("gold", 0.35), Vector3(1.4 + d * 0.32, y, inner + 0.13))
		m.part(K.sphere(0.07, 6, 3), K.mat("leaf_light", 0.6), Vector3(2.9, y, inner + 0.13))
	m.origin = Transform3D.IDENTITY


# --- props -------------------------------------------------------------------------

func _build_props(m: MeshMerger, body: StaticBody3D) -> void:
	var h: Vector2 = half()
	# Exchange counters by the way in, facing the aisle.
	for c in [[Vector3(-7.6, 0, 4.6), 90.0], [Vector3(7.6, 0, 4.6), -90.0]]:
		if is_free(c[0], 1.2):
			_exchange_counter(m, K.xf(c[0], Vector3(0, c[1], 0)))
			K.add_box_collider(body, Vector3(2.6, 1.2, 1.0), K.xf(c[0] + Vector3(0, 0.6, 0), Vector3(0, c[1], 0)))
			spot("sparkle", c[0] + Vector3(0, 1.4, 0))

	# The globe.
	var g := Vector3(-8.2, 0, -9.4)
	if is_free(g, 0.7):
		DecorProps.globe(m, K.xf(g, Vector3(0, 30.0, 0)), 1.25)
		K.add_cyl_collider(body, 0.6, 2.4, K.xf(g + Vector3(0, 1.2, 0)))
		spot("sparkle", g + Vector3(0, 2.4, 0))

	# Luggage trolleys and suitcases.
	for tr in [[Vector3(8.8, 0, 1.0), -90.0], [Vector3(-3.8, 0, 7.0), 15.0]]:
		if is_free(tr[0], 0.8):
			_trolley(m, K.xf(tr[0], Vector3(0, tr[1], 0)))
			K.add_box_collider(body, Vector3(1.3, 1.2, 0.8), K.xf(tr[0] + Vector3(0, 0.6, 0), Vector3(0, tr[1], 0)))
	var cases: Array = [[Vector3(3.9, 0, 7.2), "sky", 20.0], [Vector3(4.6, 0, 6.9), "gold", -10.0], [Vector3(9.4, 0, -9.6), "lilac", 40.0], [Vector3(-9.6, 0, 7.6), "leaf", -30.0]]
	for cs in cases:
		if is_free(cs[0], 0.4):
			DecorProps.suitcase(m, K.xf(cs[0], Vector3(0, cs[2], 0)), cs[1])
			K.add_box_collider(body, Vector3(0.65, 0.9, 0.35), K.xf(cs[0] + Vector3(0, 0.45, 0), Vector3(0, cs[2], 0)))

	# Travellers' seats: a row of three joined chairs.
	for s in [[Vector3(-8.8, 0, 0.8), 90.0], [Vector3(9.0, 0, 7.4), -90.0]]:
		if is_free(s[0], 1.0):
			_seat_row(m, K.xf(s[0], Vector3(0, s[1], 0)))
			K.add_box_collider(body, Vector3(2.2, 0.9, 0.6), K.xf(s[0] + Vector3(0, 0.45, 0), Vector3(0, s[1], 0)))

	# Plants and lanterns.
	for pp in [Vector3(-10.0, 0, -9.8), Vector3(3.0, 0, -10.4)]:
		if is_free(pp, 0.45):
			DecorProps.potted_plant(m, K.xf(pp), "sky", "gold")
			K.add_cyl_collider(body, 0.42, 1.2, K.xf(pp + Vector3(0, 0.6, 0)))
			spot("tree", pp + Vector3(0, 1.4, 0))
	for lp in [Vector3(-2.8, 0, 2.2), Vector3(2.8, 0, 2.2)]:
		if is_free(lp, 0.35):
			DecorProps.lamp(m, K.xf(lp), "sky")
			K.add_cyl_collider(body, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
			spot("perch", lp + Vector3(0, 3.72, 0))

	_bunting_flags(h)
	_model_plane(m, Vector3(-4.2, BEAM_Y - 1.1, -8.0))


## An exchange counter: coins of different shapes and colours on trays,
## and a sign above with two coins and turning arrows (exchange).
func _exchange_counter(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(2.4, 1.05, 0.8)), K.mat("teal"), Vector3(0, 0.52, 0))
	m.part(K.box(Vector3(2.5, 0.08, 0.9)), K.mat(trim_color), Vector3(0, 1.08, 0))
	m.part(K.box(Vector3(2.4, 0.12, 0.06)), K.mat("teal_dark"), Vector3(0, 0.12, 0.42))
	var kinds: Array = [["gold", 0.1], ["white", 0.09], ["coral", 0.08], ["gold_deep", 0.11]]
	for i in 4:
		var px: float = -0.85 + i * 0.57
		m.part(K.box(Vector3(0.48, 0.03, 0.42)), K.mat("wood_dark"), Vector3(px, 1.13, 0.05))
		for j in 3:
			var k: Array = kinds[i]
			if i == 3:
				m.part(K.box(Vector3(0.16, 0.03, 0.16)), K.mat(k[0]), Vector3(px - 0.1 + j * 0.1, 1.16 + j * 0.03, 0.05))
			else:
				m.part(K.cyl(k[1], k[1], 0.03, 12), K.mat(k[0]), Vector3(px - 0.1 + j * 0.1, 1.16 + j * 0.03, 0.05))
	# The sign: coin ↔ coin.
	for sx in [-1.1, 1.1]:
		m.part(K.box(Vector3(0.08, 1.4, 0.08)), K.mat("teal_dark"), Vector3(sx, 1.8, -0.3))
	m.part(K.box(Vector3(2.3, 0.7, 0.08)), K.mat("cream"), Vector3(0, 2.6, -0.3))
	m.part(K.cyl(0.22, 0.22, 0.04, 14), K.mat("gold"), Vector3(-0.6, 2.6, -0.24), Vector3(90, 0, 0))
	m.part(K.cyl(0.22, 0.22, 0.04, 14), K.mat("white"), Vector3(0.6, 2.6, -0.24), Vector3(90, 0, 0))
	m.part(K.box(Vector3(0.24, 0.05, 0.03)), K.mat("ink"), Vector3(0, 2.72, -0.24))
	m.part(K.prism(Vector3(0.12, 0.12, 0.03)), K.mat("ink"), Vector3(0.14, 2.72, -0.24), Vector3(0, 0, -90))
	m.part(K.box(Vector3(0.24, 0.05, 0.03)), K.mat("ink"), Vector3(0, 2.48, -0.24))
	m.part(K.prism(Vector3(0.12, 0.12, 0.03)), K.mat("ink"), Vector3(-0.14, 2.48, -0.24), Vector3(0, 0, 90))
	m.origin = Transform3D.IDENTITY


## A luggage trolley with suitcases on it.
func _trolley(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(1.2, 0.08, 0.7)), K.mat("stone_dark"), Vector3(0, 0.25, 0))
	for sx in [-0.5, 0.5]:
		for sz in [-0.28, 0.28]:
			m.part(K.cyl(0.08, 0.08, 0.06, 10), K.mat("ink"), Vector3(sx, 0.08, sz), Vector3(0, 0, 90))
	m.part(K.box(Vector3(0.06, 0.9, 0.7)), K.mat("stone_dark"), Vector3(0.6, 0.7, 0))
	m.part(K.cyl(0.03, 0.03, 0.75, 6), K.mat("teal_dark"), Vector3(0.62, 1.15, 0), Vector3(90, 0, 0))
	m.origin = Transform3D.IDENTITY
	DecorProps.suitcase(m, x * K.xf(Vector3(-0.25, 0.29, 0), Vector3(90, 0, 90)), "coral", 0.9)
	DecorProps.suitcase(m, x * K.xf(Vector3(0.15, 0.29, 0.05), Vector3(0, 90, 0)), "sky", 0.75)
	m.origin = Transform3D.IDENTITY


## Three joined travellers' seats on one beam (seats face local +Z).
func _seat_row(m: MeshMerger, x: Transform3D) -> void:
	m.origin = x
	m.part(K.box(Vector3(2.2, 0.08, 0.1)), K.mat("stone_dark"), Vector3(0, 0.3, -0.05))
	for sx in [-0.9, 0.9]:
		m.part(K.box(Vector3(0.08, 0.3, 0.45)), K.mat("stone_dark"), Vector3(sx, 0.15, 0))
	for i in 3:
		var sx: float = -0.72 + i * 0.72
		m.part(K.box(Vector3(0.62, 0.08, 0.5)), K.mat(["coral", "sky", "gold"][i]), Vector3(sx, 0.45, 0.02))
		m.part(K.box(Vector3(0.62, 0.5, 0.08)), K.mat(["coral", "sky", "gold"][i]), Vector3(sx, 0.72, -0.22), Vector3(-8, 0, 0))
	m.origin = Transform3D.IDENTITY


## Strings of plain striped flags across the hall (cloth: they ripple
## gently, and lie still with Reduced Motion).
func _bunting_flags(h: Vector2) -> void:
	var bm := MeshMerger.new()
	for line in [[Vector3(-h.x + 0.5, 5.7, -3.0), Vector3(h.x - 0.5, 5.7, -3.0)], [Vector3(-h.x + 0.5, 5.8, -8.0), Vector3(h.x - 0.5, 5.8, -8.0)]]:
		var a: Vector3 = line[0]
		var b: Vector3 = line[1]
		var n: int = int(a.distance_to(b) / 0.9)
		for k in n:
			var u: float = (k + 0.5) / float(n)
			var p: Vector3 = a.lerp(b, u) - Vector3(0, sin(u * PI) * 0.4, 0)
			var flag: Array = FLAGS[k % FLAGS.size()]
			bm.part(K.box(Vector3(0.5, 0.17, 0.02)), K.cloth(flag[0]), p - Vector3(0, 0.12, 0))
			bm.part(K.box(Vector3(0.5, 0.17, 0.02)), K.cloth(flag[1]), p - Vector3(0, 0.29, 0))
			bm.part(K.box(Vector3(0.9, 0.02, 0.02)), K.mat("ink"), p)
	bm.commit_to(self, "Bunting", false)


## A model plane hanging from a roof beam by two thin wires.
func _model_plane(m: MeshMerger, p: Vector3) -> void:
	m.origin = K.xf(p, Vector3(0, 70.0, -6.0))
	m.part(K.cyl(0.32, 0.26, 2.6, 12), K.mat("white"), Vector3.ZERO, Vector3(0, 0, 90))
	m.part(K.sphere(0.32, 12, 6), K.mat("white"), Vector3(1.3, 0, 0), Vector3.ZERO, Vector3(0.7, 1, 1))
	m.part(K.box(Vector3(0.7, 0.06, 3.2)), K.mat("coral"), Vector3(0.1, -0.05, 0))
	m.part(K.box(Vector3(0.4, 0.05, 1.2)), K.mat("coral"), Vector3(-1.2, 0.05, 0))
	m.part(K.box(Vector3(0.45, 0.6, 0.05)), K.mat("coral"), Vector3(-1.2, 0.35, 0))
	m.part(K.box(Vector3(0.05, 0.9, 0.12)), K.mat("ink"), Vector3(1.55, 0, 0))
	for wx in [-0.8, 0.8]:
		m.part(K.cyl(0.012, 0.012, 1.0, 4), K.mat("ink"), Vector3(wx, 0.8, 0))
	m.origin = Transform3D.IDENTITY
