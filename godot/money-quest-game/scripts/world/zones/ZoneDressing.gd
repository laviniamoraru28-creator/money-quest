@tool
class_name ZoneDressing
extends Node3D
## ZoneDressing — turns one of the original flat zone rooms into a dressed
## place in Money Quest World's visual language, WITHOUT changing the
## zone's layout, gameplay or nodes. Add one node with a ZoneDressing
## script (or a zone subclass that adds its own props in _build_props())
## to a zone scene; everything else is read from what the zone contains.
##
## Generic for every zone:
## - room size from the existing Ground collision shape (24×24, 28×36…);
## - a two-tone tiled floor; walls with plinth, wainscot, pilasters,
##   cornice and (on the sides) warm windows; a low balustrade at the front
##   (the camera side); invisible boundary walls just inside the edges, so
##   the player can no longer walk off the room;
## - paths from the return portal toward the back wall (stopping at an
##   onward portal or the zone's own furniture on the way) and to every other
##   portal, so the way through the room reads at a glance;
## - every portal's grey placeholder box replaced (the "Visual" child is
##   only hidden): onward portals get the Hub's glowing arch; the return
##   portal — just behind the spawn point and the camera — gets a LOW
##   floor gateway, so it never fills the opening view;
## - a soft "meeting rug" under each NPC so quest-givers read at a glance;
## - a softer interior sun (pair it with mq_interior_environment.tres via
##   the zone's EnvironmentOverride node) and an AmbientDirector for gentle,
##   Reduced-Motion-aware motion.
##
## Theming: the exported palette and shape values are the zone's theme. A
## subclass sets its theme defaults in _init() (scene values still win).
##
## Never touched: the zone root's script, NPCs, portals, interactables,
## the player and the camera (beyond the camera opt-ins set in the scene).
## Built once in _ready(); this node has no _process. Walkable space stays
## at y = 0 (tap-to-move projects onto that plane). Only the walls are
## camera blockers (layer 2) for CameraController's opt-in occlusion; props
## and the invisible boundary are world collision only (layer 1).

const K = preload("res://scripts/world/decor/DecorKit.gd")
const WALL_LAYERS: int = 1 | 2
const RETURN_ZONE_ID: String = "world-hub"
## Clearances kept free of props (metres added to the prop's own radius).
const CLEAR_INTERACTABLE: float = 1.6
const CLEAR_PORTAL: float = 3.0
const CLEAR_SPAWN: float = 1.8
const CLEAR_PATH: float = 1.5
const CLEAR_AUTHORED: float = 0.4
const PATH_WIDTH: float = 2.4
const KERB_WIDTH: float = 0.22
const GATEWAY_RADIUS: float = 2.35   # outer edge of the return gateway ring
const CAMERA_BLOCK_HEIGHT: float = 12.0

@export_group("Palette (DecorKit colour names)")
@export var floor_color: String = "stone_dark"
@export var floor_accent: String = "path_stone"
@export var wall_color: String = "plaster"
@export var wainscot_color: String = "stone"
@export var trim_color: String = "gold"
@export var pilaster_color: String = "teal"
@export var path_color: String = "path_gold"
## Path edging: dark, so the route reads by brightness as well as by hue
## (colour-blind friendly), not only as "a different colour".
@export var kerb_color: String = "teal_dark"
## Onward portal arches and NPC rug rings.
@export var accent: String = "gold"
## The return (World Hub) gateway — the Hub's own teal.
@export var return_color: String = "teal_light"
@export_group("Shape")
@export var tile_size: float = 2.0
@export var back_wall_height: float = 5.5
@export var side_wall_height: float = 4.0
@export var window_spacing: float = 4.0
@export var side_windows: bool = true
## Aisle length from the return gateway; 0 = to the back wall (or to the
## farthest onward portal standing on it).
@export var aisle_length: float = 0.0
@export_group("Light")
## Interior sun: softer than the Hub's 1.0 — a room is mostly pale floor
## and walls, which clip to white under the full outdoor sun.
@export var sun_energy: float = 0.6
@export var sun_pitch_degrees: float = -49.0
@export var sun_yaw_degrees: float = 25.0

var room_size: Vector2 = Vector2(24, 24)
var _root: Node3D
var _portals: Array[Node3D] = []
var _npcs: Array[Node3D] = []
var _interactables: Array[Node3D] = []   # every non-portal Interaction (NPCs included)
var _segments: Array = []
var _authored: Array[Rect2] = []   # floor footprints of the zone's own furniture
var _body: StaticBody3D         # walls: world collision + camera blockers
var _props_body: StaticBody3D   # props, arch feet, bollards: world collision only


func _ready() -> void:
	_root = get_parent() as Node3D
	if _root == null:
		return
	_read_zone()
	_segments = _compute_path_segments()
	_body = StaticBody3D.new()
	_body.name = "DressingCollision"
	_body.collision_layer = WALL_LAYERS
	_body.collision_mask = 0
	add_child(_body)
	_props_body = StaticBody3D.new()
	_props_body.name = "PropCollision"
	_props_body.collision_layer = 1
	_props_body.collision_mask = 0
	add_child(_props_body)

	# Flat floor layer (tiles, paths, rugs): receives shadows but never casts
	# any, so it stays out of the shadow passes entirely.
	var ground := MeshMerger.new()
	_build_floor(ground)
	_build_paths(ground)
	_build_npc_rugs(ground)
	ground.commit_to(self, "Floor", false)
	var m := MeshMerger.new()
	_build_walls(m)
	_build_props(m, _props_body)
	m.origin = Transform3D.IDENTITY
	m.commit_to(self, "Room", true)
	_build_boundary()
	_dress_portals()
	if not Engine.is_editor_hint():
		_hide_placeholders()
		_tune_light()
		_add_ambient_director()


## Override in a zone subclass: add that zone's own props (local to the
## zone root; the floor is at y = 0). Use is_free() to keep clear of
## interactables, portals, the spawn point, the paths and the walls, and
## add colliders to `body` for anything solid (world collision only: props
## never push the camera around — only the walls do).
func _build_props(_m: MeshMerger, _body_ref: StaticBody3D) -> void:
	pass


# --- reading the zone ---------------------------------------------------------

func _read_zone() -> void:
	var shape_node := _root.get_node_or_null("Ground/CollisionShape3D") as CollisionShape3D
	if shape_node and shape_node.shape is BoxShape3D:
		var s: Vector3 = (shape_node.shape as BoxShape3D).size
		room_size = Vector2(s.x, s.z)
	for n in _root.find_children("*", "Area3D", true, false):
		if n is PortalInteraction:
			_portals.append(n)
		elif n is Interaction:
			_interactables.append(n)
			if n is NPC:
				_npcs.append(n)
	# Footprints of the zone's own authored furniture (bookshelves, benches,
	# portraits, signposts...) so dressing props never stand inside them.
	# Skips the ground, the player, the camera and the interactables
	# themselves (those keep their own, larger clearance).
	var skip: Array[Node] = []
	for path in ["Ground", "Player", "CameraController"]:
		if _root.has_node(path):
			skip.append(_root.get_node(path))
	skip.append_array(_portals)
	skip.append_array(_interactables)
	skip.append(self)
	for v in _root.find_children("*", "GeometryInstance3D", true, false):
		if v is Label3D or not (v as Node3D).is_visible_in_tree():
			continue
		var skipped := false
		for s in skip:
			if s == v or s.is_ancestor_of(v):
				skipped = true
				break
		if skipped:
			continue
		var box: AABB = _root.global_transform.affine_inverse() * (v.global_transform * (v as GeometryInstance3D).get_aabb())
		_authored.append(Rect2(box.position.x, box.position.z, box.size.x, box.size.z))


func half() -> Vector2:
	return room_size * 0.5


## Position on the zone root's floor plane (interactables may be nested).
func _local(n: Node3D) -> Vector3:
	return _root.to_local(n.global_position) if n.is_inside_tree() else n.position


## The portal back to the World Hub (or, failing that, the one nearest the
## front of the room — the camera side).
func return_portal() -> Node3D:
	var best: Node3D = null
	for p in _portals:
		if String(p.get("target_zone_id")) == RETURN_ZONE_ID:
			return p
		if best == null or _local(p).z > _local(best).z:
			best = p
	return best


func spawn_point() -> Vector3:
	var p := _root.get_node_or_null("Player") as Node3D
	return p.position if p else Vector3(0, 0, 3)


## True where a prop of the given radius may stand: away from every
## interactable, portal, the spawn point, the paths and the walls.
func is_free(pos: Vector3, radius: float = 0.8) -> bool:
	var flat := Vector2(pos.x, pos.z)
	for n in _interactables:
		var q: Vector3 = _local(n)
		if flat.distance_to(Vector2(q.x, q.z)) < radius + CLEAR_INTERACTABLE:
			return false
	for p in _portals:
		var q: Vector3 = _local(p)
		if flat.distance_to(Vector2(q.x, q.z)) < radius + CLEAR_PORTAL:
			return false
	var sp: Vector3 = spawn_point()
	if flat.distance_to(Vector2(sp.x, sp.z)) < radius + CLEAR_SPAWN:
		return false
	for seg in _segments:
		if _dist_to_segment(flat, seg[0], seg[1]) < radius + CLEAR_PATH:
			return false
	for rect in _authored:
		if (rect as Rect2).grow(radius + CLEAR_AUTHORED).has_point(flat):
			return false
	var h: Vector2 = half()
	return absf(pos.x) < h.x - 0.6 - radius and absf(pos.z) < h.y - 0.6 - radius


# --- floor and paths -------------------------------------------------------------

func _build_floor(m: MeshMerger) -> void:
	var h: Vector2 = half()
	m.origin = Transform3D.IDENTITY
	m.part(K.box(Vector3(room_size.x, 0.06, room_size.y)), K.mat(floor_color), Vector3(0, 0.03, 0))
	# A checker of accent tiles gives the floor scale and texture.
	var nx: int = int(room_size.x / tile_size)
	var nz: int = int(room_size.y / tile_size)
	var tile := K.box(Vector3(tile_size - 0.08, 0.004, tile_size - 0.08))
	for ix in nx:
		for iz in nz:
			if (ix + iz) % 2 == 0:
				var p := Vector3(-h.x + tile_size * (ix + 0.5), 0.062, -h.y + tile_size * (iz + 0.5))
				m.part(tile, K.mat(floor_accent), p)


## [from, to] ground segments: the main aisle from the return portal to the
## back wall, plus a branch from the aisle to every other portal.
func _compute_path_segments() -> Array:
	var segs: Array = []
	var rp: Node3D = return_portal()
	if rp == null:
		return segs
	var r: Vector3 = _local(rp)
	# The aisle begins at the gateway ring's room-side edge (a path box
	# extends half its width past each end), never underneath the ring.
	var start_z: float = r.z - GATEWAY_RADIUS - PATH_WIDTH * 0.5
	# It runs to the back wall, or `aisle_length` metres, or — when an onward
	# portal stands on it — ends at the farthest such portal (never through
	# the arch to the wall behind it).
	var end_z: float = -half().y + 1.5
	if aisle_length > 0.0:
		end_z = maxf(end_z, start_z - aisle_length)
	var on_line: Array[float] = []
	for p in _portals:
		if p != rp and absf(_local(p).x - r.x) < 1.0:
			on_line.append(_local(p).z)
	if not on_line.is_empty():
		end_z = maxf(end_z, on_line.min())
	# ...and it stops short of the zone's own furniture standing on its line
	# (e.g. a portrait or a display case), never running underneath it.
	for rect in _authored:
		var crosses: bool = rect.position.x < r.x + PATH_WIDTH * 0.5 and rect.end.x > r.x - PATH_WIDTH * 0.5
		if crosses and rect.end.y < start_z and rect.end.y > end_z:
			end_z = rect.end.y + 0.3 + PATH_WIDTH * 0.5
	var start := Vector2(r.x, maxf(start_z, end_z))
	var end := Vector2(r.x, end_z)
	segs.append([start, end])
	for p in _portals:
		if p == rp:
			continue
		var q: Vector3 = _local(p)
		var pp := Vector2(q.x, q.z)
		var on_aisle := Vector2(start.x, clampf(pp.y, end.y, start.y))
		segs.append([on_aisle, pp])
	return segs


func _build_paths(m: MeshMerger) -> void:
	m.origin = Transform3D.IDENTITY
	# Kerbs first and lower, fills on top: where two paths cross, the fill
	# of one covers the kerb of the other, so junctions read as one path.
	for pass_index in 2:
		for seg in _segments:
			var a: Vector2 = seg[0]
			var b: Vector2 = seg[1]
			var length: float = a.distance_to(b)
			if length < 0.1:
				continue
			var mid: Vector2 = (a + b) * 0.5
			var yaw: float = rad_to_deg(atan2(b.x - a.x, b.y - a.y))
			if pass_index == 0:
				# Two side kerbs plus an end kerb across each end: a closed frame.
				var across: Vector2 = Vector2(cos(deg_to_rad(yaw)), -sin(deg_to_rad(yaw)))
				var along: Vector2 = (b - a) / length
				for side in [-1.0, 1.0]:
					var off: Vector2 = across * float(side) * (PATH_WIDTH + KERB_WIDTH) * 0.5
					m.part(K.box(Vector3(KERB_WIDTH, 0.05, length + PATH_WIDTH + KERB_WIDTH * 2.0)), K.mat(kerb_color), Vector3(mid.x + off.x, 0.07, mid.y + off.y), Vector3(0, yaw, 0))
					var cap: Vector2 = mid + along * float(side) * (length + PATH_WIDTH + KERB_WIDTH) * 0.5
					m.part(K.box(Vector3(PATH_WIDTH, 0.05, KERB_WIDTH)), K.mat(kerb_color), Vector3(cap.x, 0.07, cap.y), Vector3(0, yaw, 0))
			else:
				m.part(K.box(Vector3(PATH_WIDTH, 0.04, length + PATH_WIDTH)), K.mat(path_color), Vector3(mid.x, 0.085, mid.y), Vector3(0, yaw, 0))


func _dist_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab: Vector2 = b - a
	var t: float = clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return p.distance_to(a + ab * t)


# --- walls ---------------------------------------------------------------------

func _build_walls(m: MeshMerger) -> void:
	var h: Vector2 = half()
	var t: float = 0.5
	_wall(m, Vector3(0, 0, -h.y + t * 0.5), Vector3(room_size.x, back_wall_height, t), 0.0, false)
	for side in [-1.0, 1.0]:
		_wall(m, Vector3(side * (h.x - t * 0.5), 0, 0), Vector3(room_size.y, side_wall_height, t), -90.0 * side, side_windows)
	# Front: a low balustrade the camera looks over.
	m.origin = Transform3D.IDENTITY
	var front_z: float = h.y - 0.25
	m.part(K.box(Vector3(room_size.x, 0.18, 0.5)), K.mat("stone"), Vector3(0, 0.09, front_z))
	m.part(K.box(Vector3(room_size.x, 0.14, 0.4)), K.mat(trim_color), Vector3(0, 0.95, front_z))
	var count: int = int(room_size.x / 0.9)
	var baluster := K.cyl(0.09, 0.12, 0.8, 8)
	for i in count:
		var x: float = -h.x + 0.45 + i * (room_size.x - 0.9) / float(maxi(count - 1, 1))
		m.part(baluster, K.mat("stone"), Vector3(x, 0.5, front_z))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.6, 1.3, 0.6)), K.mat(pilaster_color), Vector3(side * (h.x - 0.3), 0.65, front_z))
		m.part(K.sphere(0.32, 12, 6), K.mat(trim_color), Vector3(side * (h.x - 0.3), 1.5, front_z))


## One wall: `center` on the floor, `size` = (length, height, thickness),
## rotated by `yaw` so its inside face (local +Z) points into the room.
func _wall(m: MeshMerger, center: Vector3, size: Vector3, yaw: float, windows: bool) -> void:
	var base := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), center)
	m.origin = base
	var inner: float = size.z * 0.5 + 0.02
	m.part(K.box(Vector3(size.x, size.y, size.z)), K.mat(wall_color), Vector3(0, size.y * 0.5, 0))
	# Plinth, wainscot and chair rail give the wall a solid, darker base.
	m.part(K.box(Vector3(size.x, 0.4, size.z + 0.14)), K.mat("stone_dark"), Vector3(0, 0.2, 0))
	m.part(K.box(Vector3(size.x, 0.95, size.z + 0.08)), K.mat(wainscot_color), Vector3(0, 0.875, 0))
	m.part(K.box(Vector3(size.x, 0.12, size.z + 0.16)), K.mat(trim_color), Vector3(0, 1.4, 0))
	# Cornice
	m.part(K.box(Vector3(size.x, 0.35, size.z + 0.3)), K.mat(pilaster_color), Vector3(0, size.y - 0.17, 0))
	m.part(K.box(Vector3(size.x, 0.12, size.z + 0.34)), K.mat(trim_color), Vector3(0, size.y - 0.4, 0))
	var n: int = maxi(int(size.x / window_spacing), 1)
	var pilaster := K.box(Vector3(0.55, size.y, size.z + 0.18))
	for i in n + 1:
		var x: float = -size.x * 0.5 + size.x * float(i) / float(n)
		m.part(pilaster, K.mat(pilaster_color), Vector3(x, size.y * 0.5, 0))
	if windows:
		var wy: float = minf(2.4, size.y * 0.58)
		for i in n:
			var x: float = -size.x * 0.5 + size.x * (float(i) + 0.5) / float(n)
			m.part(K.box(Vector3(1.1, 1.4, 0.08)), K.mat("window_warm", 0.3), Vector3(x, wy, inner))
			m.part(K.cyl(0.55, 0.55, 0.08, 16), K.mat("window_warm", 0.3), Vector3(x, wy + 0.7, inner), Vector3(90, 0, 0))
			m.part(K.box(Vector3(1.4, 0.12, 0.25)), K.mat(trim_color), Vector3(x, wy - 0.76, inner))
	m.origin = Transform3D.IDENTITY
	# The collider rises well above the visible wall: the follow camera sits
	# about 5 m up, so a ray to it can pass over a 4 m wall in the corners —
	# the camera must still stop inside the room.
	var block_h: float = maxf(size.y, CAMERA_BLOCK_HEIGHT)
	K.add_box_collider(_body, Vector3(size.x, block_h, size.z), base * K.xf(Vector3(0, block_h * 0.5, 0)))


## Invisible walls just inside the room edge (world collision only), so
## the player can never walk off the room, including over the balustrade.
func _build_boundary() -> void:
	var h: Vector2 = half()
	var body := StaticBody3D.new()
	body.name = "Boundary"
	body.collision_layer = 1
	body.collision_mask = 0
	add_child(body)
	K.add_box_collider(body, Vector3(room_size.x, 3.0, 0.6), K.xf(Vector3(0, 1.5, h.y - 0.3)))
	K.add_box_collider(body, Vector3(room_size.x, 3.0, 0.6), K.xf(Vector3(0, 1.5, -h.y + 0.3)))
	for side in [-1.0, 1.0]:
		K.add_box_collider(body, Vector3(0.6, 3.0, room_size.y), K.xf(Vector3(side * (h.x - 0.3), 1.5, 0)))


# --- portals ---------------------------------------------------------------------

func _dress_portals() -> void:
	var rp: Node3D = return_portal()
	for p in _portals:
		var pos: Vector3 = _local(p)
		if p == rp:
			_return_gateway(p, pos)
		else:
			_onward_arch(p, pos)


## Onward portals: the Hub's glowing arch, turned to face the room centre.
func _onward_arch(p: Node3D, pos: Vector3) -> void:
	var to_center := Vector2(-pos.x, -pos.z)
	var yaw: float = rad_to_deg(atan2(to_center.x, to_center.y)) if to_center.length() > 0.5 else 0.0
	var xform := Transform3D(Basis(Vector3.UP, deg_to_rad(yaw)), pos)
	var arch := MeshMerger.new()
	arch.part(K.torus(2.15, 2.5, 40, 8), K.mat(accent, 0.55), Vector3.ZERO, Vector3(90, 0, 0))
	arch.part(K.torus(2.5, 2.7, 40, 6), K.mat("cream"), Vector3(0, 0, -0.05), Vector3(90, 0, 0))
	for sx in [-2.35, 2.35]:
		arch.part(K.cyl(0.4, 0.46, 0.32, 10), K.mat("stone"), Vector3(sx, 0.16, 0))
		K.add_cyl_collider(_props_body, 0.42, 1.0, xform * K.xf(Vector3(sx, 0.5, 0)))
	var mi: MeshInstance3D = arch.commit_to(self, "Arch_" + String(p.name), true)
	mi.transform = xform
	_veil("Veil_" + String(p.name), K.cyl(2.15, 2.15, 0.02, 40), accent, xform * K.xf(Vector3(0, 0, -0.12), Vector3(90, 0, 0)))


## The return portal sits just behind the spawn point, between the player
## and the camera: a full-height arch there would fill the opening view.
## Instead, a glowing ring set into the floor with two low lantern bollards
## — the same teal as the Hub, clearly a way out, never in the way.
func _return_gateway(p: Node3D, pos: Vector3) -> void:
	var xform := Transform3D(Basis.IDENTITY, pos)
	var g := MeshMerger.new()
	g.part(K.torus(1.85, 2.15, 40, 6), K.mat(return_color, 0.55), Vector3(0, 0.1, 0), Vector3.ZERO, Vector3(1, 0.35, 1))
	g.part(K.torus(2.15, GATEWAY_RADIUS, 40, 4), K.mat("cream"), Vector3(0, 0.09, 0), Vector3.ZERO, Vector3(1, 0.3, 1))
	for sx in [-2.55, 2.55]:
		g.part(K.cyl(0.3, 0.36, 0.25, 10), K.mat("stone"), Vector3(sx, 0.125, 0))
		g.part(K.box(Vector3(0.28, 0.45, 0.28)), K.mat(pilaster_color), Vector3(sx, 0.47, 0))
		g.part(K.box(Vector3(0.38, 0.08, 0.38)), K.mat(trim_color), Vector3(sx, 0.73, 0))
		g.part(K.sphere(0.2, 12, 6), K.mat(return_color, 0.55), Vector3(sx, 0.92, 0))
		K.add_cyl_collider(_props_body, 0.34, 1.0, xform * K.xf(Vector3(sx, 0.5, 0)))
	var mi: MeshInstance3D = g.commit_to(self, "Gateway_" + String(p.name), true)
	mi.transform = xform
	_veil("Veil_" + String(p.name), K.cyl(1.85, 1.85, 0.01, 40), return_color, xform * K.xf(Vector3(0, 0.1, 0)))


func _veil(node_name: String, mesh: Mesh, color_name: String, xform: Transform3D) -> void:
	var veil := MeshInstance3D.new()
	veil.name = node_name
	veil.mesh = mesh
	veil.material_override = K.veil_mat(color_name)
	veil.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	veil.transform = xform
	add_child(veil)


# --- NPCs, placeholders, light, ambient ---------------------------------------------

func _build_npc_rugs(m: MeshMerger) -> void:
	m.origin = Transform3D.IDENTITY
	var ring := K.cyl(1.0, 1.0, 0.02, 28)
	var centre := K.cyl(0.82, 0.82, 0.024, 28)
	for n in _npcs:
		var q: Vector3 = _local(n)
		var p := Vector3(q.x, 0, q.z)
		# Above the paths (an NPC may stand on the aisle).
		m.part(ring, K.mat(accent), p + Vector3(0, 0.112, 0))
		m.part(centre, K.mat("parchment"), p + Vector3(0, 0.114, 0))


func _hide_placeholders() -> void:
	var ground_mesh := _root.get_node_or_null("Ground/MeshInstance3D") as Node3D
	if ground_mesh:
		ground_mesh.visible = false
	var rp: Node3D = return_portal()
	for p in _portals:
		var v := p.get_node_or_null("Visual") as Node3D
		if v:
			v.visible = false
		var label := p.get_node_or_null("Label") as Label3D
		if label:
			# Above the arch, or just above the low gateway's lanterns.
			label.position.y = 2.7 if p == rp else 3.4
			label.pixel_size = 0.008
			# Hidden only while the camera is right beside it (the return
			# gateway just behind the spawn point), so it never fills the screen.
			label.visibility_range_begin = 4.0
			label.modulate = K.color("cream")
			label.outline_modulate = K.color("ink")
			label.outline_size = 12


func _tune_light() -> void:
	var sun: DirectionalLight3D = null
	for c in _root.get_children():
		if c is DirectionalLight3D:
			sun = c
			break
	if sun == null:
		return
	sun.rotation = Vector3(deg_to_rad(sun_pitch_degrees), deg_to_rad(sun_yaw_degrees), 0)
	sun.light_color = Color(1, 0.96, 0.88)
	sun.light_energy = sun_energy
	sun.shadow_enabled = true
	sun.shadow_blur = 1.5
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = maxf(room_size.x, room_size.y) * 1.6


func _add_ambient_director() -> void:
	for c in _root.get_children():
		if c is AmbientDirector:
			return
	var d := AmbientDirector.new()
	d.name = "AmbientDirector"
	_root.add_child.call_deferred(d)
