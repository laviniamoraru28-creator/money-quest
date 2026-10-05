class_name FountainDroplets
extends MultiMeshInstance3D
## FountainDroplets — the Hub fountain's gentle trickle: a ring of small
## water drops spilling from the upper basin into the lower one along soft
## arcs. One MultiMesh (one draw call), opaque (no transparency sorting),
## moved by the AmbientDirector. Hidden with Reduced Motion, leaving the
## still basins.

@export var streams: int = 12
@export var drops_per_stream: int = 2
@export var top_radius: float = 1.05
@export var top_height: float = 1.86
@export var bottom_radius: float = 1.8
@export var bottom_height: float = 0.62
@export var fall_time: float = 1.3


func _ready() -> void:
	add_to_group("mq_ambient_updatable")
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	var drop := DecorKit.sphere(0.05, 8, 4)
	mm.mesh = drop
	mm.instance_count = streams * drops_per_stream
	multimesh = mm
	material_override = _drop_material()
	ambient_update(0.0, 0.0)


func _drop_material() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = DecorKit.color("water").lightened(0.25)
	m.roughness = 0.1
	m.metallic_specular = 0.8
	return m


func set_ambient_active(active: bool) -> void:
	visible = active


func ambient_update(t: float, _delta: float) -> void:
	var i: int = 0
	for s in streams:
		var a: float = TAU * float(s) / float(streams)
		var dir := Vector3(cos(a), 0, sin(a))
		for k in drops_per_stream:
			var u: float = fposmod(t / fall_time + float(k) / float(drops_per_stream) + float(s) * 0.137, 1.0)
			var r: float = lerpf(top_radius, bottom_radius, u)
			var y: float = top_height + 0.22 * u - (top_height + 0.22 - bottom_height) * u * u
			var shrink: float = 1.0 - 0.4 * u
			multimesh.set_instance_transform(i, Transform3D(Basis.from_scale(Vector3(shrink, shrink * 1.4, shrink)), dir * r + Vector3(0, y, 0)))
			i += 1
