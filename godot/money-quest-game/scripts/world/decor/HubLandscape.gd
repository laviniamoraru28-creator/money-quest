@tool
extends Node3D
## HubLandscape — builds the World Hub's whole landscape around the Hub's
## Portal* nodes: ground, the central coin-motif plaza and fountain, the
## circular promenade, one district-coloured path to every destination,
## the planted boundary that keeps the player inside, trees, flower beds,
## benches, lanterns, rolling hills, far mountains and clouds.
##
## The portals stay the single source of truth for the layout: move a
## portal in WorldHub.tscn and its path, plaza inlay and the spaces kept
## clear around it follow automatically. Nothing here is interactive or
## gameplay — it is scenery plus the collision that keeps navigation safe.
##
## Movement constraint (see Player.gd's tap-to-move): every walkable
## surface stays at y = 0. Hills, mountains and raised beds are scenery
## outside or beside the walkable space, never something to climb.

const K = preload("res://scripts/world/decor/DecorKit.gd")

@export var plaza_radius: float = 8.0
@export var promenade_inner: float = 11.2
@export var promenade_outer: float = 13.0
## The planted edge of the walkable Hub; invisible walls follow it so the
## player can never wander off the world.
@export var boundary_radius: float = 28.0
@export var layout_seed: int = 20261005

var _portals: Array[Node3D] = []
var _tree_spots: Array[Vector3] = []
var _flower_beds: Array[Vector3] = []
var _lamp_spots: Array[Vector3] = []
var _rng := RandomNumberGenerator.new()
var _colliders: StaticBody3D


func _ready() -> void:
	_rng.seed = layout_seed
	_collect_portals()
	_colliders = StaticBody3D.new()
	_colliders.name = "Colliders"
	_colliders.collision_layer = 1
	_colliders.collision_mask = 0
	add_child(_colliders)

	_build_ground()
	_build_plaza_and_paths()
	_build_fountain()
	_build_boundary()
	_build_vegetation()
	_build_props()
	_build_horizon()
	_build_clouds()
	if not Engine.is_editor_hint():
		_build_ambient_life()


func _collect_portals() -> void:
	_portals.clear()
	if get_parent() == null:
		return
	for child in get_parent().get_children():
		if child is Node3D and String(child.name).begins_with("Portal"):
			_portals.append(child)


func _district(portal: Node3D, key: String, fallback: String) -> String:
	var d: Dictionary = K.DISTRICTS.get(String(portal.name), {})
	return d.get(key, fallback)


func _flat(p: Vector3) -> Vector3:
	return Vector3(p.x, 0.0, p.z)


## Mid-bearings between neighbouring destinations — where benches, lamps
## and flower beds go, so they never sit on a path.
func _gap_bearings() -> Array[float]:
	var bearings: Array[float] = []
	for p in _portals:
		bearings.append(K.bearing_of(_flat(p.position)))
	bearings.sort()
	var gaps: Array[float] = []
	for i in bearings.size():
		var a: float = bearings[i]
		var b: float = bearings[(i + 1) % bearings.size()]
		if b <= a:
			b += 360.0
		gaps.append(fposmod((a + b) * 0.5, 360.0))
	return gaps


## True where scenery must not go: the plaza, the promenade, every path
## corridor, and the footprint of every landmark (including Calm World's
## stream and garden).
func _is_reserved(pos: Vector3, margin: float = 0.0) -> bool:
	var r: float = _flat(pos).length()
	if r < plaza_radius + 1.8 + margin:
		return true
	if r > promenade_inner - 0.6 - margin and r < promenade_outer + 0.6 + margin:
		return true
	for portal in _portals:
		var pp: Vector3 = _flat(portal.position)
		var dist: float = pp.length()
		var d: Vector3 = pp / dist
		var along: float = pos.dot(d)
		var lateral: float = (_flat(pos) - d * along).length()
		if along > 0.0 and along < dist and lateral < 2.4 + margin:
			return true
		var calm: bool = String(portal.name) == "PortalCalmWorld"
		var near_edge: float = dist - (6.8 if calm else 3.2)
		var half_width: float = (12.6 if calm else 7.2) + margin
		if along > near_edge and along < dist + 12.0 and lateral < half_width:
			return true
	return false


func _far_from_trees(pos: Vector3, min_dist: float) -> bool:
	for t in _tree_spots:
		if t.distance_to(pos) < min_dist:
			return false
	return true


# --- ground, plaza, paths -----------------------------------------------------

func _build_ground() -> void:
	var m := MeshMerger.new()
	m.part(K.cyl(170.0, 170.0, 0.2, 64), K.mat("grass"), Vector3(0, -0.1, 0))
	m.part(K.cyl(boundary_radius + 1.5, boundary_radius + 1.5, 0.02, 64), K.mat("grass_light"), Vector3(0, 0.0, 0))
	m.commit_to(self, "Ground", false)

	var ground_body := StaticBody3D.new()
	ground_body.name = "GroundCollision"
	ground_body.collision_layer = 1
	ground_body.collision_mask = 0
	K.add_box_collider(ground_body, Vector3(340, 1, 340), K.xf(Vector3(0, -0.5, 0)))
	add_child(ground_body)


func _build_plaza_and_paths() -> void:
	var m := MeshMerger.new()
	# Plaza paving, border ring and the gold coin-ring inlay
	m.part(K.cyl(plaza_radius, plaza_radius, 0.06, 48), K.mat("paving"), Vector3(0, 0.03, 0))
	m.part(K.cyl(3.0, 3.0, 0.065, 40), K.mat("paving_light"), Vector3(0, 0.03, 0))
	m.part(K.torus(6.85, 7.05, 48, 4), K.mat("stone_dark"), Vector3(0, 0.05, 0), Vector3.ZERO, Vector3(1, 0.1, 1))
	m.part(K.torus(plaza_radius - 0.35, plaza_radius + 0.25, 48, 6), K.mat("stone_dark"), Vector3(0, 0.03, 0), Vector3.ZERO, Vector3(1, 0.12, 1))
	m.part(K.torus(3.05, 3.45, 40, 6), K.mat("gold"), Vector3(0, 0.05, 0), Vector3.ZERO, Vector3(1, 0.1, 1))
	m.part(K.torus(4.1, 4.3, 40, 6), K.mat("teal"), Vector3(0, 0.05, 0), Vector3.ZERO, Vector3(1, 0.08, 1))
	# Promenade ring linking every district
	m.part(K.torus(promenade_inner, promenade_outer, 72, 8), K.mat("paving_light"), Vector3(0, 0.0, 0), Vector3.ZERO, Vector3(1, 0.06, 1))

	for portal in _portals:
		var pp: Vector3 = _flat(portal.position)
		var dist: float = pp.length()
		var b: float = K.bearing_of(pp)
		var d: Vector3 = pp / dist
		var right := Vector3(-d.z, 0, d.x)
		var yaw := Vector3(0, K.yaw_facing(b), 0)
		# Accent inlay pointing from the fountain toward the destination
		m.part(K.box(Vector3(0.8, 0.03, 3.4)), K.mat(_district(portal, "accent", "gold")), d * 5.9 + Vector3(0, 0.065, 0), yaw)
		m.part(K.prism(Vector3(1.3, 0.9, 0.03)), K.mat(_district(portal, "accent", "gold")), d * 7.85 + Vector3(0, 0.065, 0), Vector3(-90, K.yaw_facing(b) + 180.0, 0))
		# The path itself, with curbs
		var start: float = plaza_radius - 0.3
		var end: float = dist - 0.2
		var length: float = end - start
		var mid: Vector3 = d * (start + length * 0.5)
		m.part(K.box(Vector3(3.0, 0.04, length)), K.mat(_district(portal, "path", "paving")), mid + Vector3(0, 0.02, 0), yaw)
		for side in [-1.0, 1.0]:
			m.part(K.box(Vector3(0.16, 0.08, length)), K.mat("stone_dark"), mid + right * side * 1.58 + Vector3(0, 0.04, 0), yaw)

	# Coin medallions between the inlays
	for gb in _gap_bearings():
		var p: Vector3 = K.bearing_dir(gb) * 6.2
		m.part(K.cyl(0.45, 0.45, 0.03, 20), K.mat("gold"), p + Vector3(0, 0.065, 0))
		m.part(K.cyl(0.26, 0.26, 0.035, 16), K.mat("gold_deep"), p + Vector3(0, 0.068, 0))
	m.commit_to(self, "PlazaAndPaths", false)


## The fountain: a tiered stone basin crowned by an upright golden coin
## with a sprouting seedling — "money grows with care", the Hub's emblem.
func _build_fountain() -> void:
	var m := MeshMerger.new()
	m.part(K.cyl(2.4, 2.55, 0.55, 32), K.mat("stone"), Vector3(0, 0.275, 0))
	m.part(K.torus(2.25, 2.6, 32, 6), K.mat("stone_dark"), Vector3(0, 0.56, 0), Vector3.ZERO, Vector3(1, 0.5, 1))
	m.part(K.cyl(2.2, 2.2, 0.05, 32), K.water_mat(), Vector3(0, 0.58, 0))
	m.part(K.cyl(0.42, 0.58, 1.1, 16), K.mat("stone"), Vector3(0, 1.0, 0))
	m.part(K.cyl(1.15, 0.7, 0.35, 24), K.mat("stone"), Vector3(0, 1.65, 0))
	m.part(K.cyl(1.0, 1.0, 0.05, 24), K.water_mat(), Vector3(0, 1.84, 0))
	m.part(K.cyl(0.18, 0.24, 0.5, 10), K.mat("stone_dark"), Vector3(0, 2.05, 0))
	# Upright coin
	m.part(K.cyl(0.78, 0.78, 0.18, 28), K.mat("gold_deep"), Vector3(0, 3.05, 0), Vector3(90, 0, 0))
	m.part(K.cyl(0.6, 0.6, 0.2, 28), K.mat("gold"), Vector3(0, 3.05, 0), Vector3(90, 0, 0))
	m.part(K.torus(0.62, 0.72, 28, 6), K.mat("gold"), Vector3(0, 3.05, 0), Vector3(90, 0, 0))
	# Seedling growing out of the coin
	m.part(K.cyl(0.04, 0.05, 0.55, 6), K.mat("leaf_dark"), Vector3(0, 4.05, 0))
	m.part(K.sphere(0.32, 10, 5), K.mat("leaf_light"), Vector3(-0.24, 4.35, 0), Vector3(0, 0, 30), Vector3(1, 0.4, 0.6))
	m.part(K.sphere(0.32, 10, 5), K.mat("leaf_light"), Vector3(0.24, 4.4, 0), Vector3(0, 0, -30), Vector3(1, 0.4, 0.6))
	m.commit_to(self, "Fountain", true)
	K.add_cyl_collider(_colliders, 2.6, 1.4, K.xf(Vector3(0, 0.7, 0)))


# --- boundary, vegetation, props ---------------------------------------------

func _build_boundary() -> void:
	var m := MeshMerger.new()
	var r: float = boundary_radius
	var count: int = int(TAU * r / 1.9)
	for i in count:
		var b: float = 360.0 * float(i) / float(count)
		var p: Vector3 = K.bearing_dir(b) * (r + _rng.randf_range(-0.25, 0.25))
		if _is_reserved(p, -1.5):
			continue
		DecorProps.bush(m, K.xf(p, Vector3(0, _rng.randf_range(0, 360), 0)), _rng.randf_range(1.1, 1.45), "leaf" if i % 3 else "leaf_dark")
	m.commit_to(self, "BoundaryHedge", true)

	# Invisible walls just outside the hedge line (world collision only —
	# they never block the camera).
	var walls: int = 64
	var wall_r: float = r + 0.9
	var seg_len: float = TAU * wall_r / float(walls) * 1.1
	for i in walls:
		var b: float = 360.0 * float(i) / float(walls)
		K.add_box_collider(_colliders, Vector3(seg_len, 3.0, 1.0), K.xf(K.bearing_dir(b) * wall_r + Vector3(0, 1.5, 0), Vector3(0, K.yaw_facing(b), 0)))


func _build_vegetation() -> void:
	var inner := MeshMerger.new()
	var outer := MeshMerger.new()

	# Trees between and behind the districts, inside the boundary
	var b: float = 0.0
	while b < 360.0:
		var r: float = _rng.randf_range(17.5, boundary_radius - 1.2)
		var p: Vector3 = K.bearing_dir(b + _rng.randf_range(-1.5, 1.5)) * r
		if not _is_reserved(p, 0.6) and _far_from_trees(p, 3.0):
			var roll: float = _rng.randf()
			var kind: String = "round" if roll < 0.55 else ("pine" if roll < 0.8 else "blossom")
			DecorProps.tree(inner, K.xf(p, Vector3(0, _rng.randf_range(0, 360), 0)), kind, _rng.randf_range(0.95, 1.4))
			K.add_cyl_collider(_colliders, 0.3, 2.0, K.xf(p + Vector3(0, 1.0, 0)))
			_tree_spots.append(p)
		b += 3.0

	# A softer ring of trees just outside the playable space for depth
	b = 0.0
	while b < 360.0:
		var r: float = _rng.randf_range(boundary_radius + 2.5, boundary_radius + 13.0)
		var p: Vector3 = K.bearing_dir(b + _rng.randf_range(-2.0, 2.0)) * r
		if _far_from_trees(p, 3.4):
			var kind: String = "pine" if _rng.randf() < 0.45 else "round"
			DecorProps.tree(outer, K.xf(p, Vector3(0, _rng.randf_range(0, 360), 0)), kind, _rng.randf_range(1.2, 1.9))
			_tree_spots.append(p)
		b += 4.0

	# Bushes scattered near the edges of districts
	for i in 46:
		var p: Vector3 = K.bearing_dir(_rng.randf_range(0, 360)) * _rng.randf_range(14.2, boundary_radius - 1.0)
		if not _is_reserved(p, 0.3) and _far_from_trees(p, 1.6):
			DecorProps.bush(inner, K.xf(p, Vector3(0, _rng.randf_range(0, 360), 0)), _rng.randf_range(0.8, 1.2))

	# Flower beds in the green gaps beside the promenade
	for gb in _gap_bearings():
		var p: Vector3 = K.bearing_dir(gb) * 15.6
		if _is_reserved(p, 1.2):
			continue
		DecorProps.flower_bed(inner, K.xf(p), _rng, 1.5)
		K.add_cyl_collider(_colliders, 1.7, 0.8, K.xf(p + Vector3(0, 0.4, 0)))
		_flower_beds.append(p)

	inner.commit_to(self, "Vegetation", true)
	var outer_mi: MeshInstance3D = outer.commit_to(self, "OuterTrees", false)
	outer_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


## Keeps the camera's first view clear: the player spawns at (0, 0, 4) and
## the Hub camera looks north from behind them, so nothing tall stands on
## that sightline.
func _in_spawn_sightline(p: Vector3) -> bool:
	return absf(p.x) < 2.2 and p.z > 3.0 and p.z < 16.0


func _build_props() -> void:
	var m := MeshMerger.new()
	for gb in _gap_bearings():
		if _in_spawn_sightline(K.bearing_dir(gb) * 10.0):
			continue
		# A bench at the plaza edge, facing the fountain
		var bp: Vector3 = K.bearing_dir(gb) * (plaza_radius + 1.2)
		var yaw := Vector3(0, -gb, 0)
		DecorProps.bench(m, K.xf(bp, yaw))
		K.add_box_collider(_colliders, Vector3(1.8, 0.9, 0.55), K.xf(bp + Vector3(0, 0.45, 0), yaw))
		# Lanterns on either side of the promenade
		for lr in [promenade_inner - 0.7, promenade_outer + 0.7]:
			var lp: Vector3 = K.bearing_dir(gb) * lr
			if _is_reserved(lp, -0.9) and lr > promenade_outer:
				continue
			DecorProps.lamp(m, K.xf(lp))
			_lamp_spots.append(lp)
			K.add_cyl_collider(_colliders, 0.25, 3.0, K.xf(lp + Vector3(0, 1.5, 0)))
	# A few rock clusters for texture
	for i in 18:
		var p: Vector3 = K.bearing_dir(_rng.randf_range(0, 360)) * _rng.randf_range(15.0, boundary_radius - 0.8)
		if _is_reserved(p, 0.4) or not _far_from_trees(p, 1.5):
			continue
		DecorProps.rock(m, K.xf(p), _rng.randf_range(0.6, 1.2), _rng.randf_range(0, 180))
	m.commit_to(self, "Props", true)


# --- horizon -------------------------------------------------------------------

func _build_horizon() -> void:
	var m := MeshMerger.new()
	# Rolling hills just beyond the outer trees
	var hills: int = 22
	for i in hills:
		var b: float = 360.0 * float(i) / float(hills) + _rng.randf_range(-5, 5)
		var r: float = _rng.randf_range(50.0, 74.0)
		var size: float = _rng.randf_range(10.0, 18.0)
		var color_name: String = "hill" if i % 2 == 0 else "hill_far"
		m.part(K.sphere(size, 16, 6, true), K.mat(color_name), K.bearing_dir(b) * r, Vector3(0, _rng.randf_range(0, 90), 0), Vector3(1.0, _rng.randf_range(0.35, 0.7), 0.8))
	# Distant mountains, softened by the atmosphere's fog
	var peaks: int = 13
	for i in peaks:
		var b: float = 360.0 * float(i) / float(peaks) + _rng.randf_range(-8, 8)
		var r: float = _rng.randf_range(120.0, 150.0)
		var base: float = _rng.randf_range(22.0, 34.0)
		var h: float = _rng.randf_range(20.0, 34.0)
		var p: Vector3 = K.bearing_dir(b) * r
		var yaw := Vector3(0, _rng.randf_range(0, 60), 0)
		m.part(K.cyl(0.0, base, h, 7), K.mat("mountain"), p + Vector3(0, h * 0.5, 0), yaw)
		var cap: float = 0.2
		m.part(K.cyl(0.0, base * cap * 1.04, h * cap, 7), K.mat("snow"), p + Vector3(0, h - h * cap * 0.5 + 0.05, 0), yaw)
	m.commit_to(self, "Horizon", false)


## Small, sparse signs of life, all driven by the scene's AmbientDirector:
## the fountain's trickle, a butterfly over some of the flower beds, and
## three birds gliding high above the landmarks.
func _build_ambient_life() -> void:
	var drops := FountainDroplets.new()
	drops.name = "FountainDroplets"
	add_child(drops)

	var anchors: Array[Vector3] = []
	for i in _flower_beds.size():
		if i % 2 == 0:
			anchors.append(_flower_beds[i])
	var butterflies := AmbientCreatures.new()
	butterflies.name = "Butterflies"
	butterflies.kind = "butterfly"
	butterflies.anchors = anchors
	butterflies.radius = 1.3
	butterflies.height = 1.0
	add_child(butterflies)

	var birds := AmbientCreatures.new()
	birds.name = "Birds"
	birds.kind = "bird"
	birds.anchors = [Vector3(0, 21, -12), Vector3(-4, 24, -8), Vector3(5, 23, -15)] as Array[Vector3]
	birds.radius = 22.0
	add_child(birds)

	# Occasional small events, one at a time (ZoneLife "hub"): a bird lands
	# on a lantern and hops before flying off, a leaf drifts down from a
	# tree, a butterfly rests on a flower bed, the Savings Tower glints.
	# Nearby NPCs glance at them.
	if Engine.is_editor_hint():
		return
	var life := ZoneLife.new()
	life.name = "ZoneLife"
	life.profile = "hub"
	life.seed_value = layout_seed
	life.area_center = Vector3(0, 2.4, 0)
	life.area_extents = Vector3(14, 1.6, 14)
	add_child(life)
	for p in _lamp_spots:
		life.add_spot("perch", to_global(p + Vector3(0, 3.72, 0)))
	for i in _tree_spots.size():
		if i % 3 == 0:
			life.add_spot("tree", to_global(_tree_spots[i] + Vector3(0, 3.0, 0)))
	for p in _flower_beds:
		life.add_spot("flower", to_global(p + Vector3(0, 0.6, 0)))
	var root: Node = get_parent()
	var tower: Node3D = root.get_node_or_null("Landmarks/MoneyQuestLandmark") if root else null
	if tower:
		life.add_spot("sparkle", tower.global_transform * Vector3(5.6, 10.0, -3.4))


func _build_clouds() -> void:
	var m := MeshMerger.new()
	for i in 10:
		var b: float = 36.0 * i + _rng.randf_range(-12, 12)
		var r: float = _rng.randf_range(45.0, 120.0)
		DecorProps.cloud(m, K.xf(K.bearing_dir(b) * r + Vector3(0, _rng.randf_range(30.0, 46.0), 0), Vector3(0, _rng.randf_range(0, 180), 0)), _rng)
	m.commit_to(self, "Clouds", false)
