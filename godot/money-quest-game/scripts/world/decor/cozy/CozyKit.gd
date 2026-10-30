class_name CozyKit
extends RefCounted
## CozyKit — what each CozySlot kind is: the Cozy Atlas kit asset it uses
## once that asset has been delivered and imported, and a placeholder of
## the same footprint, height and collision layout until then.
##
## One collision set per piece, always owned by the piece itself: a kit
## asset brings its own (COL_… shapes from Blender); a placeholder builds
## its own here. Nothing else adds colliders to a slot.
##
## Every piece: origin at the centre of its footprint on the floor (y = 0),
## front facing +Z, metres, scale 1.0 (the approved Cozy Atlas scale).
## World collision is layer 1. Parts that can come between the camera and
## the player (a roof, a canopy) are named in REVEAL_PARTS; CozySlotLayer
## hides them while they are in the way.

const KIT_DIR: String = "res://art/cozy/kit/"

## kind -> [kit asset file, default footprint radius]
const KINDS: Dictionary = {
	"pavilion": ["Kit_Calm_Pavilion_01.glb", 4.6],
	"pond": ["Kit_Calm_Pond_01.glb", 3.0],
	"signpost": ["Kit_Calm_Signpost_01.glb", 0.8],
	"tree_hero": ["Kit_Nature_OakHero_01.glb", 1.0],
	"tree_light": ["Kit_Nature_OakLight_01.glb", 1.0],
	"boulder": ["Kit_Nature_Boulder_01.glb", 0.8],
}

## Pavilion measurements (the approved split requirements): floor top
## 0.15 m with a gentle bevelled edge all round (no step to climb), eight
## posts with a 2.5 m wide entrance between the front pair, benches 0.45 m
## above the floor, eaves 3.75 m above the ground.
const PAVILION_FLOOR: float = 0.15
const PAVILION_FLOOR_RADIUS: float = 4.0
const PAVILION_EDGE_RADIUS: float = 4.6
const PAVILION_POST_RING: float = 3.7
const PAVILION_EAVE: float = 3.75
const PAVILION_SEAT: float = 0.45
const PAVILION_BENCH_RING: float = 3.0

## kind -> name fragments of the parts hidden while they block the camera's
## view of the player (or hold the camera inside them). They match the
## placeholders' "Roof"/"Canopy" and the kit's EX_Pavilion_Roof and
## EX_…_Leaves.
const REVEAL_PARTS: Dictionary = {
	"pavilion": ["Roof"],
	"tree_hero": ["Canopy", "Leaves"],
	"tree_light": ["Canopy", "Leaves"],
}


static func is_kind(kind: String) -> bool:
	return KINDS.has(kind)


static func default_radius(kind: String) -> float:
	return float(KINDS[kind][1]) if KINDS.has(kind) else 1.0


static func asset_path(kind: String) -> String:
	return KIT_DIR + String(KINDS[kind][0]) if KINDS.has(kind) else ""


static func has_asset(kind: String) -> bool:
	var path: String = asset_path(kind)
	return not path.is_empty() and ResourceLoader.exists(path)


## The piece for `kind`: the kit asset when allowed and present, else the
## placeholder. Null for an unknown kind.
static func build(kind: String, use_asset: bool) -> Node3D:
	if not KINDS.has(kind):
		return null
	if use_asset and has_asset(kind):
		var scene := load(asset_path(kind)) as PackedScene
		if scene:
			var piece: Node3D = scene.instantiate()
			piece.set_meta("cozy_source", "asset")
			return piece
	var root := Node3D.new()
	root.set_meta("cozy_source", "placeholder")
	var m := MeshMerger.new()
	var body := StaticBody3D.new()
	body.name = "Collision"
	body.collision_layer = 1
	body.collision_mask = 0
	match kind:
		"pavilion":
			_pavilion(m, body, root)
		"pond":
			_pond(m, body, root)
		"signpost":
			m.part(DecorKit.cyl(0.09, 0.11, 2.5), DecorKit.mat("wood_dark"), Vector3(0, 1.25, 0))
			m.part(DecorKit.box(Vector3(0.9, 0.26, 0.06)), DecorKit.mat("wood"), Vector3(0.3, 2.05, 0), Vector3(0, 0, 4))
			m.part(DecorKit.box(Vector3(0.8, 0.24, 0.06)), DecorKit.mat("wood"), Vector3(-0.25, 1.62, 0), Vector3(0, 0, -5))
			m.part(DecorKit.cyl(0.32, 0.36, 0.14), DecorKit.mat("stone"), Vector3(0, 0.07, 0))
			DecorKit.add_cyl_collider(body, 0.15, 2.5, DecorKit.xf(Vector3(0, 1.25, 0)))
		"tree_hero":
			_tree(m, body, root, 0.26, 0.36, 3.2, 2.1, 4.7)
		"tree_light":
			_tree(m, body, root, 0.18, 0.25, 3.0, 1.6, 4.3)
		"boulder":
			m.part(DecorKit.sphere(0.7, 10, 5), DecorKit.mat("rock"), Vector3(0, 0.22, 0), Vector3.ZERO, Vector3(1.0, 0.62, 0.82))
			DecorKit.add_cyl_collider(body, 0.62, 0.7, DecorKit.xf(Vector3(0, 0.35, 0)))
	m.commit_to(root, "Placeholder", true)
	root.add_child(body)
	return root


static func _pavilion(m: MeshMerger, body: StaticBody3D, root: Node3D) -> void:
	# Floor: a low disc whose edge is bevelled down to the ground, so it
	# can be walked onto from every side.
	var floor_mesh: CylinderMesh = DecorKit.cyl(PAVILION_FLOOR_RADIUS, PAVILION_EDGE_RADIUS, PAVILION_FLOOR, 24)
	m.part(floor_mesh, DecorKit.mat("stone"), Vector3(0, PAVILION_FLOOR * 0.5, 0))
	var floor_shape := CollisionShape3D.new()
	floor_shape.name = "Floor"
	floor_shape.shape = floor_mesh.create_convex_shape()
	floor_shape.position.y = PAVILION_FLOOR * 0.5
	body.add_child(floor_shape)
	# Eight posts, none on the entrance axis (+Z).
	for i in 8:
		var a: float = deg_to_rad(22.5 + 45.0 * i)
		var p := Vector3(sin(a), 0, cos(a)) * PAVILION_POST_RING
		var h: float = PAVILION_EAVE - PAVILION_FLOOR
		m.part(DecorKit.cyl(0.13, 0.16, h), DecorKit.mat("wood_dark"), p + Vector3(0, PAVILION_FLOOR + h * 0.5, 0))
		var post := CollisionShape3D.new()
		post.name = "Post%d" % (i + 1)
		var cs := CylinderShape3D.new()
		cs.radius = 0.17
		cs.height = h
		post.shape = cs
		post.position = p + Vector3(0, PAVILION_FLOOR + h * 0.5, 0)
		body.add_child(post)
	# Three benches around the back, facing the middle.
	for deg in [135.0, 180.0, 225.0]:
		var a: float = deg_to_rad(deg)
		var p := Vector3(sin(a), 0, cos(a)) * PAVILION_BENCH_RING
		var seat_y: float = PAVILION_FLOOR + PAVILION_SEAT
		m.part(DecorKit.box(Vector3(1.8, 0.08, 0.5)), DecorKit.mat("wood"), p + Vector3(0, seat_y - 0.04, 0), Vector3(0, deg, 0))
		m.part(DecorKit.box(Vector3(1.7, PAVILION_SEAT - 0.08, 0.36)), DecorKit.mat("wood_dark"), p + Vector3(0, PAVILION_FLOOR + (PAVILION_SEAT - 0.08) * 0.5, 0), Vector3(0, deg, 0))
		var bench := CollisionShape3D.new()
		bench.name = "Bench%d" % (int(deg) / 45 - 2)
		var bs := BoxShape3D.new()
		bs.size = Vector3(1.8, PAVILION_SEAT, 0.5)
		bench.shape = bs
		bench.transform = DecorKit.xf(p + Vector3(0, PAVILION_FLOOR + PAVILION_SEAT * 0.5, 0), Vector3(0, deg, 0))
		body.add_child(bench)
	# Eave ring, roof and a soft lantern (visual only, no light).
	m.part(DecorKit.torus(PAVILION_POST_RING - 0.12, PAVILION_POST_RING + 0.12, 32, 6), DecorKit.mat("wood_dark"), Vector3(0, PAVILION_EAVE, 0))
	var roof_mesh: CylinderMesh = DecorKit.cyl(0.25, PAVILION_POST_RING + 0.7, 1.9, 16)
	# The roof is its own mesh, so it can be hidden while it blocks the view.
	var roof_m := MeshMerger.new()
	roof_m.part(roof_mesh, DecorKit.mat("book_red"), Vector3(0, PAVILION_EAVE + 0.95, 0))
	roof_m.commit_to(root, "Roof", true)
	m.part(DecorKit.sphere(0.22, 10, 5), DecorKit.mat("bulb", 1.2), Vector3(0, PAVILION_EAVE - 0.35, 0))
	_marker(root, "MK_Front", Vector3(0, 0, PAVILION_EDGE_RADIUS))
	_marker(root, "MK_Interact_Bench", Vector3(0, PAVILION_FLOOR, -PAVILION_BENCH_RING + 0.75))


static func _pond(m: MeshMerger, body: StaticBody3D, root: Node3D) -> void:
	m.part(DecorKit.cyl(2.55, 2.55, 0.04, 24), DecorKit.mat("water"), Vector3(0, 0.03, 0))
	m.part(DecorKit.torus(2.5, 2.95, 24, 6), DecorKit.mat("stone"), Vector3(0, 0.08, 0), Vector3.ZERO, Vector3(1, 0.7, 1))
	for i in 5:
		var a: float = deg_to_rad(40.0 + 61.0 * i)
		m.part(DecorKit.cyl(0.3, 0.3, 0.02, 10), DecorKit.mat("leaf_soft"), Vector3(sin(a) * 1.5, 0.06, cos(a) * 1.2))
	DecorKit.add_cyl_collider(body, 2.8, 0.6, DecorKit.xf(Vector3(0, 0.3, 0)))
	_marker(root, "MK_Interact_Pond", Vector3(0, 0, 3.3))


## Canopy underside = canopy_y - 0.8 * canopy_r (about 3.0 m here; 2.6 m
## or more keeps it clear of the player and the camera).
static func _tree(m: MeshMerger, body: StaticBody3D, root: Node3D, top_r: float, bottom_r: float, trunk_h: float, canopy_r: float, canopy_y: float) -> void:
	m.part(DecorKit.cyl(top_r, bottom_r, trunk_h), DecorKit.mat("wood_dark"), Vector3(0, trunk_h * 0.5, 0))
	# The canopy is its own mesh, so it can be hidden while it blocks the view.
	var canopy := MeshMerger.new()
	canopy.part(DecorKit.sphere(canopy_r, 12, 6), DecorKit.mat("leaf"), Vector3(0, canopy_y, 0), Vector3.ZERO, Vector3(1, 0.8, 1))
	canopy.part(DecorKit.sphere(canopy_r * 0.62, 10, 5), DecorKit.mat("leaf_light"), Vector3(canopy_r * 0.45, canopy_y + canopy_r * 0.35, canopy_r * 0.2))
	canopy.commit_to(root, "Canopy", true)
	DecorKit.add_cyl_collider(body, bottom_r + 0.05, trunk_h, DecorKit.xf(Vector3(0, trunk_h * 0.5, 0)))


static func _marker(root: Node3D, marker_name: String, pos: Vector3) -> void:
	var mk := Marker3D.new()
	mk.name = marker_name
	mk.position = pos
	root.add_child(mk)
