class_name AmbientCreatures
extends MultiMeshInstance3D
## AmbientCreatures — a tiny, sparse population of butterflies or birds,
## drawn as ONE MultiMesh (one draw call for the whole flock), moved by the
## scene's AmbientDirector (no _process of its own). Paths are smooth,
## deterministic loops around fixed anchor points — no randomness at run
## time, no collision, no effect on gameplay. Hidden entirely with Reduced
## Motion.
##
## Butterflies stay low around flower beds and gardens, away from paths
## and from the camera; birds glide in slow, wide circles high above the
## landmarks. Calm World uses fewer, slower butterflies (calm = true).

@export_enum("butterfly", "bird") var kind: String = "butterfly"
@export var anchors: Array[Vector3] = []
@export var per_anchor: int = 1
@export var radius: float = 1.4
@export var height: float = 1.2
@export var calm: bool = false
@export var wing_color: Color = Color("F7D46B")

var _phases: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	add_to_group("mq_ambient_updatable")
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var count: int = maxi(anchors.size() * per_anchor, 0)
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = _butterfly_mesh() if kind == "butterfly" else _bird_mesh()
	mm.instance_count = count
	multimesh = mm
	_phases.resize(count)
	for i in count:
		_phases[i] = fposmod(float(i) * 2.399 + anchors[i / maxi(per_anchor, 1)].length() * 0.37, TAU)
	ambient_update(0.0, 0.0)


func set_ambient_active(active: bool) -> void:
	visible = active


func ambient_update(t: float, _delta: float) -> void:
	if multimesh == null:
		return
	var slow: float = 0.45 if calm else 1.0
	for i in multimesh.instance_count:
		var anchor: Vector3 = anchors[i / maxi(per_anchor, 1)]
		var ph: float = _phases[i]
		var xf: Transform3D
		if kind == "bird":
			var a: float = t * 0.07 + ph
			var pos := anchor + Vector3(cos(a) * radius, sin(t * 0.3 + ph) * 0.6, sin(a) * radius)
			var tangent := Vector3(-sin(a), 0, cos(a))
			xf = Transform3D(Basis.looking_at(tangent, Vector3.UP) * Basis(Vector3.BACK, 0.25), pos)
		else:
			var w: float = (0.55 * slow)
			var a: float = t * w + ph
			var pos := anchor + Vector3(cos(a) * radius, height + 0.25 * sin(t * 1.3 * slow + ph * 2.0), sin(a * 0.8) * radius * 0.8)
			var vel := Vector3(-sin(a) * radius, 0.0, cos(a * 0.8) * radius * 0.64)
			var flap: float = 0.35 + 0.65 * absf(sin(t * (5.0 if calm else 8.0) + ph))
			xf = Transform3D(Basis.looking_at(vel.normalized() if vel.length() > 0.01 else Vector3.FORWARD, Vector3.UP) * Basis.from_scale(Vector3(flap, 1, 1)), pos)
		multimesh.set_instance_transform(i, xf)


func _butterfly_mesh() -> Mesh:
	var m := MeshMerger.new()
	var I := Transform3D.IDENTITY
	var wing := CharacterPalette.mat(wing_color)
	for side in [-1.0, 1.0]:
		m.add(DecorKit.box(Vector3(0.16, 0.008, 0.12)), I * DecorKit.xf(Vector3(side * 0.085, 0, -0.01), Vector3(0, side * 10.0, 0)), wing)
		m.add(DecorKit.box(Vector3(0.1, 0.008, 0.08)), I * DecorKit.xf(Vector3(side * 0.06, 0, 0.07), Vector3(0, side * -15.0, 0)), wing)
	m.add(DecorKit.cyl(0.012, 0.012, 0.14, 6), DecorKit.xf(Vector3.ZERO, Vector3(90, 0, 0)), CharacterPalette.mat(Color("3A3F44")))
	return m.commit()


func _bird_mesh() -> Mesh:
	var m := MeshMerger.new()
	var c := CharacterPalette.mat(Color("4A5560"))
	for side in [-1.0, 1.0]:
		m.add(DecorKit.box(Vector3(0.55, 0.02, 0.16)), DecorKit.xf(Vector3(side * 0.26, 0.05, 0), Vector3(0, 0, side * 14.0)), c)
	m.add(DecorKit.sphere(0.07, 6, 3), DecorKit.xf(Vector3.ZERO, Vector3.ZERO, Vector3(0.8, 0.7, 1.6)), c)
	return m.commit()
