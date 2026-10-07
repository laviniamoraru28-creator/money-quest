class_name VisualCues
extends RefCounted
## VisualCues — the world's one consistent way to say "look here" without
## words (Universal Play & Learn):
##
##   beacon(target)   a soft ring on the floor around it + a bobbing gold
##                    chevron above it, pointing down: "this one"
##   clear(target)    removes it
##
## The same cue everywhere (a coin to collect, a stall to visit, a product
## to choose), so a child learns it once. Its size follows
## SupportProfile.highlight_strength() (strong guidance = bigger; light
## guidance = a small ring only); Reduced Motion keeps it perfectly still
## (it is a shape, so it still says "here"). Lives as a child of the
## target, updates only while it exists.

const CUE_NAME: String = "VisualCue"


static func beacon(target: Node3D, height: float = -1.0) -> Node3D:
	if target == null or not is_instance_valid(target):
		return null
	clear(target)
	var b := Beacon.new()
	b.name = CUE_NAME
	b.height = height if height > 0.0 else float(target.get_meta("marker_height", 2.0))
	b.strength = SupportProfile.highlight_strength()
	target.add_child(b)
	return b


static func clear(target: Node3D) -> void:
	if target == null or not is_instance_valid(target):
		return
	var old: Node = target.get_node_or_null(CUE_NAME)
	if old:
		target.remove_child(old)
		old.queue_free()


static func has_cue(target: Node3D) -> bool:
	return target != null and is_instance_valid(target) and target.has_node(CUE_NAME)


class Beacon extends Node3D:
	var height: float = 2.0
	var strength: float = 0.6
	var _ring: MeshInstance3D
	var _chevron: MeshInstance3D
	var _t: float = 0.0
	static var _ring_mesh: Mesh
	static var _chev_mesh: Mesh

	func _ready() -> void:
		if _ring_mesh == null:
			var rm := MeshMerger.new()
			rm.part(DecorKit.torus(0.85, 1.0, 36, 4), DecorKit.mat("gold", 0.9), Vector3.ZERO, Vector3.ZERO, Vector3(1, 0.05, 1))
			_ring_mesh = rm.commit()
			var cm := MeshMerger.new()
			for side in [-1.0, 1.0]:
				cm.part(DecorKit.box(Vector3(0.36, 0.11, 0.11)), DecorKit.mat("gold", 0.9), Vector3(side * 0.12, 0.12, 0), Vector3(0, 0, side * -45.0))
			_chev_mesh = cm.commit()
		_ring = MeshInstance3D.new()
		_ring.mesh = _ring_mesh
		_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		_ring.position.y = 0.06
		add_child(_ring)
		_chevron = MeshInstance3D.new()
		_chevron.mesh = _chev_mesh
		_chevron.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(_chevron)
		var s: float = lerpf(0.7, 1.35, clampf(strength, 0.0, 1.0))
		_ring.scale = Vector3.ONE * s
		_chevron.scale = Vector3.ONE * s
		# Light guidance: the ring only (no pointing chevron).
		_chevron.visible = strength > 0.0
		_place()

	func _process(delta: float) -> void:
		_t += delta
		_place()

	func _place() -> void:
		var still: bool = Settings.reduced_motion
		_chevron.position = Vector3(0, height + (0.0 if still else absf(sin(_t * 2.6)) * 0.22), 0)
		var cam: Camera3D = get_viewport().get_camera_3d() if is_inside_tree() else null
		if cam:
			var to_cam: Vector3 = cam.global_position - _chevron.global_position
			_chevron.rotation.y = atan2(to_cam.x, to_cam.z) - global_rotation.y
		var pulse: float = 1.0 if still else 1.0 + 0.06 * sin(_t * 2.0)
		var s: float = lerpf(0.7, 1.35, clampf(strength, 0.0, 1.0))
		_ring.scale = Vector3(s * pulse, s, s * pulse)
