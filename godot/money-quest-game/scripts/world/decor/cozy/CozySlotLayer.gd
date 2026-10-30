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

## Use delivered kit assets where they exist (false = placeholders only).
@export var use_assets: bool = true

var _root: Node3D
var _player: Node3D
var _reveal: Dictionary = {}   # reveal body -> the part it hides
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


func _fill(s: CozySlot) -> void:
	for body in _reveal.keys():
		if not is_instance_valid(body) or s.is_ancestor_of(body):
			_reveal.erase(body)
	for c in s.get_children():
		s.remove_child(c)
		c.queue_free()
	var piece: Node3D = CozyKit.build(s.kind, use_assets)
	if piece == null:
		return
	piece.name = "Piece"
	s.add_child(piece)
	if CozyKit.REVEAL_PARTS.has(s.kind):
		_add_reveal(piece, CozyKit.REVEAL_PARTS[s.kind])


## Gives each part of `piece` named in `fragments` (a roof, a canopy) an
## invisible shape on REVEAL_LAYER, matching its meshes.
func _add_reveal(piece: Node3D, fragments: Array) -> void:
	for n in piece.find_children("*", "Node3D", true, false):
		if n is CollisionObject3D or n is CollisionShape3D or not _named(n, fragments):
			continue
		if _named(n.get_parent(), fragments):
			continue   # its parent is already a revealed part
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


func _named(n: Node, fragments: Array) -> bool:
	for f in fragments:
		if String(n.name).contains(String(f)):
			return true
	return false


## One ray a physics frame, from the camera to the player's middle, on
## REVEAL_LAYER only (it also counts a camera that is inside a part): every
## part it meets is hidden, every other part shown. An instant switch,
## nothing animates, and the camera itself is left exactly as configured.
func _physics_process(_delta: float) -> void:
	if _reveal.is_empty() or _player == null:
		return
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam == null:
		return
	var hits: Dictionary = {}
	var q := PhysicsRayQueryParameters3D.create(cam.global_position, _player.global_position + Vector3.UP * 1.2, REVEAL_LAYER)
	q.hit_from_inside = true
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	for i in 4:
		var hit: Dictionary = space.intersect_ray(q)
		if hit.is_empty():
			break
		hits[hit["collider"]] = true
		var skip: Array[RID] = q.exclude
		skip.append(hit["rid"])
		q.exclude = skip
	for body in _reveal:
		if is_instance_valid(body):
			(_reveal[body] as Node3D).visible = not hits.has(body)


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
	var r: float = s.footprint()
	var p: Vector2 = _flat(s)
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
	for paths in _root.find_children("*", "CozyPaths", true, false):
		if (paths as CozyPaths).distance_to(Vector3(p.x, 0, p.y)) < r + ZoneDressing.CLEAR_AUTHORED:
			return "on a path"
	for o in _accepted:
		if p.distance_to(_flat(o)) < r + o.footprint():
			return "overlaps the slot %s" % o.name
	var ground := _root.get_node_or_null("Ground/CollisionShape3D") as CollisionShape3D
	if ground and ground.shape is BoxShape3D:
		var h: Vector3 = (ground.shape as BoxShape3D).size * 0.5
		if absf(p.x) > h.x - 0.6 - r or absf(p.y) > h.z - 0.6 - r:
			return "outside the room"
	return ""


func _dist_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab: Vector2 = b - a
	var t: float = clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return p.distance_to(a + ab * t)
