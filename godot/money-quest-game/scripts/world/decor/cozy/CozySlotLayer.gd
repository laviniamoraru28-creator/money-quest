class_name CozySlotLayer
extends Node3D
## CozySlotLayer — the Cozy Atlas decoration layer of one zone. Add it to a
## zone scene with CozySlot children (and optionally a CozyPaths node);
## nothing else in the zone changes. It is separate from ZoneDressing on
## purpose: ZoneDressing merges primitive props into big meshes and adds
## its own box colliders, while a Cozy Atlas piece is an instanced asset
## that owns its collision.
##
## On _ready every slot is checked once, with ZoneDressing's clearances,
## against the zone's doors, interactables (NPCs, bubbles…), the player's
## spawn point, the CozyPaths ribbons and the other slots. A slot that
## breaks a rule is skipped with a warning, never built, so decoration can
## never cover a door or block the way to it. Each accepted slot then gets
## exactly one piece (CozyKit.build) as its only child: the kit asset when
## it has been delivered, else a placeholder of the same shape.
##
## Roofs and canopies (CozyKit.REVEAL_PARTS) are hidden while they stand
## between the camera and the player, so decoration never hides the child.
##
## Never touched: the zone root's script, NPCs, portals, interactables,
## the player, the camera and the zone's light.

## Physics layer 20, for the invisible view-reveal shapes only: nothing
## else uses it, so they never stop the player or the camera's own
## occlusion (layer 2).
const REVEAL_LAYER: int = 1 << 19
## A hidden roof or canopy comes back only after this long out of the way.
const REVEAL_HOLD_MS: int = 500
## A gate this close to a door (metres, on the floor) is that door's gate.
const GATE_ON_DOOR: float = 0.5
## Heights on the player kept in view (middle and feet), in metres.
const VIEW_HEIGHTS: Array = [1.2, 0.2]

## Use delivered kit assets where they exist (false = placeholders only).
@export var use_assets: bool = true

var _root: Node3D
var _player: Node3D
var _reveal: Dictionary = {}   # reveal body -> the part it hides
var _last_blocked: Dictionary = {}   # reveal body -> msec it last blocked the view
var _gate_body: Dictionary = {}   # reveal body of a gate -> its slot
var _portals: Array[Node3D] = []
var _interactables: Array[Node3D] = []
var _accepted: Array[CozySlot] = []
var _rejected: Dictionary = {}   # slot name -> reason


func _ready() -> void:
	_root = get_parent() as Node3D
	if _root == null:
		return
	_player = _root.get_node_or_null("Player") as Node3D
	_read_zone()
	for c in get_children():
		if c is CozySlot:
			var why: String = _check(c)
			if why.is_empty():
				_accepted.append(c)
			else:
				_rejected[String(c.name)] = why
				push_warning("CozySlotLayer: slot '%s' (%s) not built: %s" % [c.name, c.kind, why])
	for s in _accepted:
		_fill(s)
	_build_shelf_objects()


## Slots that passed the clearance checks and were built.
func accepted_slots() -> Array[CozySlot]:
	return _accepted


## Slot name -> why it was not built.
func rejected_slots() -> Dictionary:
	return _rejected


## Rebuilds every accepted slot from kit assets (true) or placeholders
## (false). The slots themselves never move.
func rebuild(assets: bool) -> void:
	use_assets = assets
	for s in _accepted:
		_fill(s)
	_build_shelf_objects()


func _fill(s: CozySlot) -> void:
	for body in _reveal.keys():
		if not is_instance_valid(body) or s.is_ancestor_of(body):
			_reveal.erase(body)
			_last_blocked.erase(body)
			_gate_body.erase(body)
	for c in s.get_children():
		s.remove_child(c)
		c.queue_free()
	var piece: Node3D = CozyKit.build(s.kind, use_assets)
	_show_stand_in(s, piece == null)
	if piece == null:
		return
	piece.name = "Piece"
	s.add_child(piece)
	if CozyKit.REVEAL_PARTS.has(s.kind):
		_add_reveal(piece, CozyKit.REVEAL_PARTS[s.kind])


## The objects on the gates' shelves, merged so they cost a few draws in all.
func _build_shelf_objects() -> void:
	var old: Node = get_node_or_null("ShelfObjects")
	if old:
		remove_child(old)
		old.queue_free()
	var placed: Array = []
	for s in _accepted:
		if CozyKit.is_gate(s.kind) and not s.hint.is_empty() and s.get_child_count() > 0:
			var mark := s.get_child(0).find_child("MK_HintProp", true, false) as Node3D
			if mark:
				placed.append([s.hint, global_transform.affine_inverse() * mark.global_transform])
	CozyKit.merge_small_pieces(self, "ShelfObjects", placed)


## The plain shape a kit piece replaces: the zone's floor mesh (ground) or
## the door's grey block (gate). Hidden, never removed, so the zone is whole
## again whenever the piece is missing. Collision and door areas stay.
func _show_stand_in(s: CozySlot, show_it: bool) -> void:
	var stand_in: Node3D = null
	if s.kind == "ground":
		stand_in = _root.get_node_or_null("Ground/MeshInstance3D") as Node3D
	elif CozyKit.is_gate(s.kind):
		var door: Node3D = _door_at(_flat(s))
		if door:
			stand_in = door.get_node_or_null("Visual") as Node3D
	if stand_in:
		stand_in.visible = show_it


func _door_at(p: Vector2) -> Node3D:
	for n in _portals:
		if p.distance_to(_flat(n)) <= GATE_ON_DOOR:
			return n
	return null


## Gives each part of `piece` named in `fragments` (a roof, a canopy) an
## invisible shape on REVEAL_LAYER, matching its meshes. A part may be
## nested at any depth (Blender exports often wrap meshes in empties); only
## the outermost matching node gets the shape, covering every mesh below.
func _add_reveal(piece: Node3D, fragments: Array) -> void:
	for n in piece.find_children("*", "Node3D", true, false):
		if not CozyKit.is_reveal_part(n, fragments) or _inside_part(n, piece, fragments):
			continue
		var meshes: Array = n.find_children("*", "MeshInstance3D", true, false)
		if n is MeshInstance3D:
			meshes.append(n)
		var body := StaticBody3D.new()
		body.name = "Reveal"
		body.collision_layer = REVEAL_LAYER
		body.collision_mask = 0
		n.add_child(body)
		for mi: MeshInstance3D in meshes:
			if mi.mesh == null:
				continue
			var cs := CollisionShape3D.new()
			cs.shape = mi.mesh.create_convex_shape()
			cs.transform = (n as Node3D).global_transform.affine_inverse() * mi.global_transform
			body.add_child(cs)
		_reveal[body] = n
		if CozyKit.is_gate((piece.get_parent() as CozySlot).kind):
			_gate_body[body] = piece.get_parent()


## True when an ancestor of `n` (below `piece`) is itself a revealed part.
func _inside_part(n: Node, piece: Node, fragments: Array) -> bool:
	var p: Node = n.get_parent()
	while p and p != piece:
		if CozyKit.is_reveal_part(p, fragments):
			return true
		p = p.get_parent()
	return false


## Two rays a physics frame, from the camera to the player's middle and
## feet, on REVEAL_LAYER only (it also counts a camera that is inside a part): a
## part it meets is hidden at once, and shown again only after it has been
## clear of the view for REVEAL_HOLD seconds, so a roof or canopy at the
## edge of the view never blinks on and off. An instant switch, nothing
## animates (nothing to reduce under Reduced Motion), and the camera itself
## is left exactly as configured.
func _physics_process(_delta: float) -> void:
	if _reveal.is_empty() or _player == null:
		return
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam == null:
		return
	var hits: Dictionary = {}
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	for height in VIEW_HEIGHTS:
		var q := PhysicsRayQueryParameters3D.create(cam.global_position, _player.global_position + Vector3.UP * float(height), REVEAL_LAYER)
		q.hit_from_inside = true
		for i in 4:
			var hit: Dictionary = space.intersect_ray(q)
			if hit.is_empty():
				break
			hits[hit["collider"]] = true
			var skip: Array[RID] = q.exclude
			skip.append(hit["rid"])
			q.exclude = skip
	for body in _gate_body:
		if is_instance_valid(body) and _between_camera_and_player(_gate_body[body], cam):
			hits[body] = true
	var now: int = Time.get_ticks_msec()
	for body in hits:
		_last_blocked[body] = now
	for body in _reveal:
		if is_instance_valid(body):
			var clear_ms: int = now - int(_last_blocked.get(body, -REVEAL_HOLD_MS))
			(_reveal[body] as Node3D).visible = clear_ms >= REVEAL_HOLD_MS


## A gate is open air in the middle, so a ray can pass through it while its
## arch still covers the player on screen. It counts as in the way whenever
## the line from the camera to the player crosses its width on the floor.
func _between_camera_and_player(gate: CozySlot, cam: Camera3D) -> bool:
	var c: Vector3 = gate.to_local(cam.global_position)
	var p: Vector3 = gate.to_local(_player.global_position)
	if signf(c.z) == signf(p.z):
		return false
	return absf(lerpf(c.x, p.x, c.z / (c.z - p.z))) < gate.footprint()


func _read_zone() -> void:
	for n in _root.find_children("*", "Area3D", true, false):
		if n is PortalInteraction:
			_portals.append(n)
		elif n is Interaction:
			_interactables.append(n)


func _flat(n: Node3D) -> Vector2:
	var p: Vector3 = _root.to_local(n.global_position) if n.is_inside_tree() else n.position
	return Vector2(p.x, p.z)


## "" when the slot may be built, else the reason it may not.
func _check(s: CozySlot) -> String:
	if not CozyKit.is_kind(s.kind):
		return "unknown kind '%s'" % s.kind
	if CozyKit.is_landscape(s.kind):
		return ""
	var r: float = s.footprint()
	var p: Vector2 = _flat(s)
	if CozyKit.is_gate(s.kind):
		# A gate frames its door, so the door clearances do not apply; it
		# must stand exactly on a door and clear of every other piece.
		return "not on a door" if _door_at(p) == null else _overlap(p, r)
	for n in _portals:
		if p.distance_to(_flat(n)) < r + ZoneDressing.CLEAR_PORTAL:
			return "too close to the door %s" % n.name
	for n in _interactables:
		if p.distance_to(_flat(n)) < r + ZoneDressing.CLEAR_INTERACTABLE:
			return "too close to %s" % n.name
	var spawn := Vector2(0, 3)
	var player := _root.get_node_or_null("Player") as Node3D
	if player:
		spawn = _flat(player)
	if p.distance_to(spawn) < r + ZoneDressing.CLEAR_SPAWN:
		return "too close to the spawn point"
	# The straight way from the spawn point to every door stays open.
	for n in _portals:
		if _dist_to_segment(p, spawn, _flat(n)) < r + ZoneDressing.CLEAR_PATH:
			return "in the way to the door %s" % n.name
	if not s.entrance_path_ok:
		for paths in _root.find_children("*", "CozyPaths", true, false):
			if (paths as CozyPaths).distance_to(Vector3(p.x, 0, p.y)) < r + ZoneDressing.CLEAR_AUTHORED:
				return "on a path"
	var overlap: String = _overlap(p, r)
	if not overlap.is_empty():
		return overlap
	var ground := _root.get_node_or_null("Ground/CollisionShape3D") as CollisionShape3D
	if ground and ground.shape is BoxShape3D:
		var h: Vector3 = (ground.shape as BoxShape3D).size * 0.5
		if absf(p.x) > h.x - 0.6 - r or absf(p.y) > h.z - 0.6 - r:
			return "outside the room"
	return ""


func _overlap(p: Vector2, r: float) -> String:
	for o in _accepted:
		if not CozyKit.is_landscape(o.kind) and p.distance_to(_flat(o)) < r + o.footprint():
			return "overlaps the slot %s" % o.name
	return ""


func _dist_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab: Vector2 = b - a
	var t: float = clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return p.distance_to(a + ab * t)
