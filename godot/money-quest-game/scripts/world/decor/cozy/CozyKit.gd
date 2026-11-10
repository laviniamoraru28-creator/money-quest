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
	"gate_01": ["Kit_Calm_GateArch_01.glb", 1.8],   # lilac
	"gate_02": ["Kit_Calm_GateArch_02.glb", 1.8],   # mint
	"gate_03": ["Kit_Calm_GateArch_03.glb", 1.8],   # butter
	"ground": ["Kit_Ground_BubbleGarden_01.glb", 19.0],
	"backdrop": ["Kit_Backdrop_CalmRing_01.glb", 40.0],
}

## Landscape kinds: the zone's own floor, not an object standing on it. No
## clearance rules and no placeholder (the zone's plain floor stays until a
## valid asset replaces it). Value: where its collision is centred (x, z in
## metres), because a ground piece may reach further on one side.
const LANDSCAPE: Dictionary = {
	"ground": Vector2(0, 2.5),
	"backdrop": Vector2.ZERO,
}
## Landscape kinds that are only scenery: no collision, any height.
const SCENERY_ONLY: Array = ["backdrop"]

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
	"gate_01": ["GateArch"],
	"gate_02": ["GateArch"],
	"gate_03": ["GateArch"],
}

## kind -> MK_ markers a kit asset must carry (exact names, no ".001").
const REQUIRED_MARKERS: Dictionary = {
	"pavilion": ["MK_Front", "MK_Interact_Bench"],
	"pond": ["MK_Interact_Pond"],
	"gate_01": ["MK_DoorMarker", "MK_HintProp"],
	"gate_02": ["MK_DoorMarker", "MK_HintProp"],
	"gate_03": ["MK_DoorMarker", "MK_HintProp"],
}

## How far a kit asset may be off: its collision centred within this many
## metres of the origin, its lowest point this close to the floor, and its
## footprint at most this much larger than the slot radius.
const ORIGIN_TOLERANCE: float = 0.3
const FOOTPRINT_TOLERANCE: float = 1.1

## Kit assets found invalid this run: asset path -> its problems.
static var _invalid: Dictionary = {}
## Gate kind -> its wood and moss combined into one mesh.
static var _gate_mesh: Dictionary = {}


static func is_kind(kind: String) -> bool:
	return KINDS.has(kind)


static func is_landscape(kind: String) -> bool:
	return LANDSCAPE.has(kind)


static func is_gate(kind: String) -> bool:
	return kind.begins_with("gate_") and KINDS.has(kind)


static func default_radius(kind: String) -> float:
	return float(KINDS[kind][1]) if KINDS.has(kind) else 1.0


static func asset_path(kind: String) -> String:
	return KIT_DIR + String(KINDS[kind][0]) if KINDS.has(kind) else ""


static func has_asset(kind: String) -> bool:
	var path: String = asset_path(kind)
	return not path.is_empty() and ResourceLoader.exists(path)


## Kit assets found invalid this run (asset path -> problems).
static func invalid_assets() -> Dictionary:
	return _invalid


## The piece for `kind`: the kit asset when allowed, present and valid,
## else the placeholder. An asset that fails to load or fails validate()
## is reported once with a warning and replaced by the placeholder. Null
## for an unknown kind.
static func build(kind: String, use_asset: bool) -> Node3D:
	if not KINDS.has(kind):
		return null
	if use_asset and has_asset(kind):
		var path: String = asset_path(kind)
		var scene := load(path) as PackedScene
		var piece: Node3D = scene.instantiate() as Node3D if scene else null
		var problems := PackedStringArray(["it could not be loaded"]) if piece == null else validate(kind, piece)
		if problems.is_empty():
			batch_repeats(piece)
			if is_gate(kind):
				_one_surface(kind, piece)
			piece.set_meta("cozy_source", "asset")
			return piece
		if piece:
			piece.free()
		if not _invalid.has(path):
			_invalid[path] = problems
			push_warning("CozyKit: INVALID kit asset %s — %s. The placeholder is used instead." % [path, "; ".join(problems)])
	if is_landscape(kind):
		return null
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
		"gate_01", "gate_02", "gate_03":
			for x in [-1.1, 1.1]:
				m.part(DecorKit.box(Vector3(0.42, 2.7, 0.6)), DecorKit.mat("wood"), Vector3(x, 1.35, 0))
				var post := CollisionShape3D.new()
				var ps := BoxShape3D.new()
				ps.size = Vector3(0.42, 2.3, 0.6)
				post.shape = ps
				post.position = Vector3(x, 1.15, 0)
				body.add_child(post)
			m.part(DecorKit.box(Vector3(2.6, 0.3, 0.6)), DecorKit.mat("wood_dark"), Vector3(0, 2.85, 0))
			_marker(root, "MK_DoorMarker", Vector3(0, 3.2, 0))
			_marker(root, "MK_HintProp", Vector3(1.62, 0.92, 0))
	m.commit_to(root, "GateArch" if is_gate(kind) else "Placeholder", true)
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


# --- kit asset checks ----------------------------------------------------------

## Problems with `piece` as the `kind` piece ("" list = valid): visible
## geometry; scale 1; standing on the floor at the origin; collision on
## layer 1, centred on the origin; footprint within the slot radius (trees:
## their trunk collision, the canopy may spread); the parts the camera
## reveal needs (roof, canopy); the required MK_ markers. Works on a piece
## that is not in the scene tree yet.
static func validate(kind: String, piece: Node3D) -> PackedStringArray:
	var problems := PackedStringArray()
	var r: float = default_radius(kind)
	if not piece.scale.is_equal_approx(Vector3.ONE):
		problems.append("its root is scaled %s (must be 1)" % piece.scale)
	var seen := false
	var looks := AABB()
	for g in piece.find_children("*", "GeometryInstance3D", true, false):
		if g is Label3D:
			continue
		var b: AABB = _rel(g, piece) * (g as GeometryInstance3D).get_aabb()
		looks = b if not seen else looks.merge(b)
		seen = true
	if not seen:
		problems.append("it has no visible geometry")
	elif is_landscape(kind):
		if not SCENERY_ONLY.has(kind) and absf(looks.end.y) > ORIGIN_TOLERANCE:
			problems.append("its top is at %.2f m, not at floor level (y = 0)" % looks.end.y)
	elif absf(looks.position.y) > ORIGIN_TOLERANCE:
		problems.append("its lowest point is at %.2f m, not on the floor (y = 0)" % looks.position.y)
	var solid := AABB()
	var shapes: int = 0
	for body in piece.find_children("*", "CollisionObject3D", true, false):
		if not ((body as CollisionObject3D).collision_layer & 1):
			continue
		for cs in body.find_children("*", "CollisionShape3D", true, false):
			var shape: Shape3D = (cs as CollisionShape3D).shape
			if shape == null or (cs as CollisionShape3D).disabled:
				continue
			var b: AABB = _rel(cs, piece) * shape.get_debug_mesh().get_aabb()
			solid = b if shapes == 0 else solid.merge(b)
			shapes += 1
	if shapes == 0:
		if not SCENERY_ONLY.has(kind):
			problems.append("it has no collision (COL_… shapes on layer 1)")
	else:
		var c: Vector3 = solid.get_center()
		var off: float = (Vector2(c.x, c.z) - LANDSCAPE.get(kind, Vector2.ZERO)).length()
		if off > ORIGIN_TOLERANCE:
			problems.append("its collision is centred %.2f m from where it should be" % off)
	# Trees are measured by their trunk collision (the canopy may spread);
	# everything else by what is visible, collision or not.
	var spread: AABB = solid if kind.begins_with("tree") else looks
	if (seen and not kind.begins_with("tree")) or shapes > 0:
		var half: float = maxf(maxf(absf(spread.position.x), absf(spread.end.x)), maxf(absf(spread.position.z), absf(spread.end.z)))
		if half > r * FOOTPRINT_TOLERANCE:
			problems.append("its footprint reaches %.2f m from the origin (slot radius %.1f m)" % [half, r])
	var fragments: Array = REVEAL_PARTS.get(kind, [])
	if not fragments.is_empty():
		var found := false
		for n in piece.find_children("*", "Node3D", true, false):
			if is_reveal_part(n, fragments):
				found = true
				break
		if not found:
			problems.append("it has no separate %s part" % " / ".join(fragments))
	for mk in REQUIRED_MARKERS.get(kind, []):
		if piece.find_child(String(mk), true, false) == null:
			problems.append("the marker %s is missing" % mk)
	return problems


## The material a small piece's surface is drawn with when merged: all plain
## opaque vertex-coloured surfaces share one draw (at this size their small
## roughness differences do not show); glass, water and glowing ones keep
## their own.
static func _draw_group(mat: Material, seen: Dictionary) -> Material:
	if not _is_plain(mat):
		return mat
	for other in seen:
		if _is_plain(other):
			return other
	return mat


static func _is_plain(mat: Material) -> bool:
	var m := mat as StandardMaterial3D
	return m != null and m.transparency == BaseMaterial3D.TRANSPARENCY_DISABLED and not m.emission_enabled


## A gate's wood and moss drawn as one surface, one shared mesh per kind, so
## nine gates cost nine draws rather than eighteen.
static func _one_surface(kind: String, piece: Node3D) -> void:
	var parts: Array = piece.find_children("EX_*", "MeshInstance3D", true, false)
	if parts.size() < 2:
		return
	if not _gate_mesh.has(kind):
		var first_mat: Material = null
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for mi in parts:
			var mesh: Mesh = (mi as MeshInstance3D).mesh
			for s in mesh.get_surface_count():
				if first_mat == null:
					first_mat = mesh.surface_get_material(s)
				st.append_from(mesh, s, (parts[0] as Node3D).transform.affine_inverse() * (mi as Node3D).transform)
		var out: ArrayMesh = st.commit()
		out.surface_set_material(0, first_mat)
		_gate_mesh[kind] = out
	(parts[0] as MeshInstance3D).mesh = _gate_mesh[kind]
	for i in range(1, parts.size()):
		(parts[i] as Node).get_parent().remove_child(parts[i])
		(parts[i] as Node).free()


## Small objects placed many times (the gates' shelf objects) become one
## mesh with one surface per shared material: a handful of draws however
## many there are. `placed` = [[kit file without extension, Transform3D], ...]
## relative to `parent`. A missing file is reported and left out.
static func merge_small_pieces(parent: Node3D, node_name: String, placed: Array) -> void:
	var tools: Dictionary = {}   # material -> SurfaceTool
	for entry in placed:
		var path: String = KIT_DIR + String(entry[0]) + ".glb"
		var scene := load(path) as PackedScene if ResourceLoader.exists(path) else null
		if scene == null:
			push_warning("CozyKit: small piece %s is missing, left out." % path)
			continue
		var piece := scene.instantiate() as Node3D
		for mi in piece.find_children("*", "MeshInstance3D", true, false):
			var mesh: Mesh = (mi as MeshInstance3D).mesh
			if mesh == null:
				continue
			var xf: Transform3D = (entry[1] as Transform3D) * _rel(mi, piece)
			for s in mesh.get_surface_count():
				var mat: Material = _draw_group(mesh.surface_get_material(s), tools)
				if not tools.has(mat):
					var fresh := SurfaceTool.new()
					fresh.begin(Mesh.PRIMITIVE_TRIANGLES)
					tools[mat] = fresh
				(tools[mat] as SurfaceTool).append_from(mesh, s, xf)
		piece.free()
	if tools.is_empty():
		return
	var out := ArrayMesh.new()
	for mat in tools:
		out = (tools[mat] as SurfaceTool).commit(out)
		out.surface_set_material(out.get_surface_count() - 1, mat)
	var mi := MeshInstance3D.new()
	mi.name = node_name
	mi.mesh = out
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)


## Repeated small parts (plants, stones, lily pads) arrive from Blender as
## separate MM_<Kind>_<n> mesh nodes. Here, when the piece is built, every
## group of two or more of one <Kind> under the same parent with the same
## mesh (shared, or a plain copy: same size, vertex count and material)
## becomes one MultiMeshInstance3D (one draw) drawing the first one's mesh,
## keeping each one's exact placement. A copy tinted differently must have
## its own <Kind> name. Done at run time, not at import, so a headless
## import keeps every position. Returns how many groups were batched.
static func batch_repeats(piece: Node3D) -> int:
	var groups: Dictionary = {}
	var first_mesh: Dictionary = {}   # mesh signature -> the first mesh seen
	for mi in piece.find_children("MM_*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		if m.mesh == null or m.get_child_count() > 0:
			continue
		var sig: String = "%s|%s" % [String(m.name).get_slice("_", 1), _mesh_signature(m.mesh)]
		if not first_mesh.has(sig):
			first_mesh[sig] = m.mesh
		var key: Array = [m.get_parent(), first_mesh[sig]]
		if not groups.has(key):
			groups[key] = []
		groups[key].append(m)
	var batched: int = 0
	for key in groups:
		var nodes: Array = groups[key]
		if nodes.size() < 2:
			continue
		var first := nodes[0] as MeshInstance3D
		var override: Material = first.material_override
		if override == null and first.get_surface_override_material_count() == 1:
			override = first.get_surface_override_material(0)
		elif override == null and first.get_surface_override_material_count() > 1 and first.get_surface_override_material(0) != null:
			continue   # several overridden surfaces: keep the separate nodes
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = key[1]
		mm.instance_count = nodes.size()
		for i in nodes.size():
			mm.set_instance_transform(i, (nodes[i] as Node3D).transform)
		var mmi := MultiMeshInstance3D.new()
		mmi.name = "MMI_" + String(first.name).get_slice("_", 1)
		mmi.multimesh = mm
		mmi.material_override = override
		mmi.cast_shadow = first.cast_shadow
		var parent: Node = key[0]
		parent.add_child(mmi)
		for n in nodes:
			parent.remove_child(n)
			n.free()
		batched += 1
	return batched


## The same text for copies of one mesh (whatever their resource): size,
## and per surface its vertex and index counts and material name. Cheap:
## no mesh data is read back from the GPU.
static func _mesh_signature(mesh: Mesh) -> String:
	var out: String = str(mesh.get_aabb().size.snapped(Vector3(0.001, 0.001, 0.001)))
	if mesh is ArrayMesh:
		var am := mesh as ArrayMesh
		for s in am.get_surface_count():
			var mat: Material = am.surface_get_material(s)
			out += "|%d/%d/%s" % [am.surface_get_array_len(s), am.surface_get_array_index_len(s), mat.resource_name if mat else ""]
	else:
		out += "|" + str(mesh.get_instance_id())   # not an ArrayMesh: only the very same mesh groups
	return out


## Transform of `n` relative to `root` (works outside the scene tree).
static func _rel(n: Node, root: Node) -> Transform3D:
	var t := Transform3D.IDENTITY
	var p: Node = n
	while p and p != root:
		if p is Node3D:
			t = (p as Node3D).transform * t
		p = p.get_parent()
	return t


## True for a visible part named after one of `fragments` (not collision).
static func is_reveal_part(n: Node, fragments: Array) -> bool:
	if n is CollisionObject3D or n is CollisionShape3D:
		return false
	for f in fragments:
		if String(n.name).contains(String(f)):
			return true
	return false
