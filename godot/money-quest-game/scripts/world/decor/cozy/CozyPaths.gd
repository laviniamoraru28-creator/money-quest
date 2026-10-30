class_name CozyPaths
extends Node3D
## CozyPaths — walkable paths drawn on a zone's floor, laid out per zone in
## Godot (so they fit any room) and painted with a reusable path material
## (the Blender-authored cobble material once it is approved; a plain
## stone colour until then). Purely visual: flat ribbons 1.2 cm above the
## floor with round joints and ends, no collision, no shadows. UVs are
## world X/Z divided by TILE_METRES, so a tiling texture lines up across
## every path and every zone.
##
## CozySlotLayer keeps every slot off these paths (distance_to()).

const TILE_METRES: float = 2.0
const LIFT: float = 0.012

## Each path is a polyline of floor points (zone-local, y ignored).
@export var paths: Array[PackedVector3Array] = []
## Width of each path in metres (missing entries use default_width).
@export var widths: PackedFloat32Array = PackedFloat32Array()
@export var default_width: float = 3.2
## The path surface (null = the plain placeholder stone).
@export var material: Material

static var _placeholder: StandardMaterial3D


func _ready() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in paths.size():
		var pts: PackedVector3Array = paths[i]
		var half: float = width_of(i) * 0.5
		for j in pts.size():
			_disc(st, pts[j], half)
			if j > 0:
				_quad(st, pts[j - 1], pts[j], half)
	var mi := MeshInstance3D.new()
	mi.name = "PathSurface"
	mi.mesh = st.commit()
	mi.material_override = material if material else _placeholder_material()
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


func width_of(i: int) -> float:
	return widths[i] if i < widths.size() and widths[i] > 0.0 else default_width


## Distance on the floor from `p` (zone-local) to the nearest path edge;
## negative inside a path.
func distance_to(p: Vector3) -> float:
	var best: float = INF
	var q := Vector2(p.x, p.z)
	for i in paths.size():
		var pts: PackedVector3Array = paths[i]
		for j in pts.size():
			var a := Vector2(pts[j].x, pts[j].z)
			var d: float = q.distance_to(a)
			if j > 0:
				var b := Vector2(pts[j - 1].x, pts[j - 1].z)
				var ab: Vector2 = b - a
				var t: float = clampf((q - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
				d = q.distance_to(a + ab * t)
			best = minf(best, d - width_of(i) * 0.5)
	return best


func _vertex(st: SurfaceTool, x: float, z: float) -> void:
	st.set_normal(Vector3.UP)
	st.set_uv(Vector2(x, z) / TILE_METRES)
	st.add_vertex(Vector3(x, LIFT, z))


func _quad(st: SurfaceTool, a: Vector3, b: Vector3, half: float) -> void:
	var dir := Vector2(b.x - a.x, b.z - a.z)
	if dir.length() < 0.001:
		return
	var n: Vector2 = Vector2(-dir.y, dir.x).normalized() * half
	var a1 := Vector2(a.x, a.z) + n
	var a2 := Vector2(a.x, a.z) - n
	var b1 := Vector2(b.x, b.z) + n
	var b2 := Vector2(b.x, b.z) - n
	# Clockwise seen from above: Godot front faces point up.
	for v in [a1, b2, b1, a1, a2, b2]:
		_vertex(st, v.x, v.y)


func _disc(st: SurfaceTool, c: Vector3, radius: float) -> void:
	var segs: int = 20
	for k in segs:
		var t0: float = TAU * k / segs
		var t1: float = TAU * (k + 1) / segs
		_vertex(st, c.x, c.z)
		_vertex(st, c.x + cos(t0) * radius, c.z + sin(t0) * radius)
		_vertex(st, c.x + cos(t1) * radius, c.z + sin(t1) * radius)


static func _placeholder_material() -> StandardMaterial3D:
	if _placeholder == null:
		_placeholder = StandardMaterial3D.new()
		_placeholder.albedo_color = DecorKit.color("path_stone")
		_placeholder.roughness = 1.0
		_placeholder.metallic_specular = 0.2
	return _placeholder
