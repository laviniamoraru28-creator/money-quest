class_name WorldInteractable
extends Interaction
## WorldInteractable — the one reusable "you can do something here" object
## for the 3D world. Everything it shows and does comes from its
## InteractionData; it reuses the existing Interaction / InteractionManager
## proximity system (an Area3D the physics engine watches — no polling),
## and hands the child the shared InteractionCard when they choose to
## interact. Nothing ever opens on its own: walking past is always fine.
##
## "There's something interesting here": while a remembered interaction is
## still undiscovered, a small soft glint floats above it when the child is
## within a few metres (never from across the map, never once found). It
## bobs gently, or stays still with Reduced Motion — and it is a shape, so
## it never relies on motion or colour alone. A wide Area3D notices the
## child coming near (no polling); the glint only updates while they are
## near, and only for undiscovered spots.

const HINT_RANGE: float = 7.0

@export var data: InteractionData

var _hint: MeshInstance3D
var _near: bool = false
var _hint_time: float = 0.0
static var _hint_mesh: Mesh


func _ready() -> void:
	super._ready()
	if data:
		prompt_text_key = data.prompt_key
		interaction_priority = data.priority()
		prompt_height = data.prompt_height
		# Secrets stay secret: no glint for them (finding them is the fun).
		if data.remember and data.kind != "secret" and not ProgressManager.has_discovered_world(discovery_id()):
			_build_hint()


func discovery_id() -> String:
	return "hub:" + data.interaction_id if data else ""


func interact() -> void:
	var card: InteractionCard = InteractionCard.find(self)
	if card and data:
		card.toggle(data, self)
	_remove_hint.call_deferred()


func _build_hint() -> void:
	if _hint_mesh == null:
		var m := MeshMerger.new()
		var mat := DecorKit.mat("bulb", 1.6)
		m.part(DecorKit.box(Vector3(0.32, 0.05, 0.02)), mat, Vector3.ZERO)
		m.part(DecorKit.box(Vector3(0.05, 0.32, 0.02)), mat, Vector3.ZERO)
		m.part(DecorKit.box(Vector3(0.14, 0.035, 0.02)), mat, Vector3.ZERO, Vector3(0, 0, 45))
		m.part(DecorKit.box(Vector3(0.035, 0.14, 0.02)), mat, Vector3.ZERO, Vector3(0, 0, 45))
		m.part(DecorKit.sphere(0.05, 8, 4), mat, Vector3.ZERO)
		_hint_mesh = m.commit()
	_hint = MeshInstance3D.new()
	_hint.name = "CuriosityHint"
	_hint.mesh = _hint_mesh
	_hint.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_hint.visible = false
	_hint.position = Vector3(0, hint_height(), 0)
	add_child(_hint)
	var range_area := Area3D.new()
	range_area.name = "HintRange"
	range_area.monitorable = false
	range_area.collision_layer = 0
	range_area.collision_mask = 1
	var shape := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = HINT_RANGE
	cyl.height = 4.0
	shape.shape = cyl
	shape.position.y = 1.5
	range_area.add_child(shape)
	add_child(range_area)
	range_area.body_entered.connect(func(b: Node3D) -> void:
		if b.is_in_group("player"):
			_near = true
			set_process(_hint != null))
	range_area.body_exited.connect(func(b: Node3D) -> void:
		if b.is_in_group("player"):
			_near = false
			if _hint:
				_hint.visible = false
			set_process(false))
	set_process(false)


## Where the glint floats (a subclass with its own prop may lower it).
func hint_height() -> float:
	return clampf(prompt_height * 0.75, 1.0, 2.6)


func is_hint_visible() -> bool:
	return _hint != null and _hint.visible


func _remove_hint() -> void:
	if _hint and data and ProgressManager.has_discovered_world(discovery_id()):
		_hint.queue_free()
		_hint = null
		set_process(false)
		var ra: Node = get_node_or_null("HintRange")
		if ra:
			ra.queue_free()


func _process(delta: float) -> void:
	if _hint == null:
		set_process(false)
		return
	_hint.visible = _near and not player_in_range and not Settings.focus_mode
	if not _hint.visible:
		return
	_hint_time += delta
	var cam: Camera3D = get_viewport().get_camera_3d()
	var bob: float = 0.0 if Settings.reduced_motion else sin(_hint_time * 2.0) * 0.06
	_hint.position.y = hint_height() + bob
	if cam:
		var spin: float = 0.0 if Settings.reduced_motion else _hint_time * 0.6
		_hint.global_basis = Basis.looking_at(cam.global_position - _hint.global_position, Vector3.UP) * Basis(Vector3.BACK, spin)
