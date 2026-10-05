@tool
class_name MeshMerger
extends RefCounted
## MeshMerger — collects many small primitive parts (a tree, a bench, a
## whole building, a character) and bakes them into ONE ArrayMesh.
##
## Plain matte colours (materials tagged by DecorKit.tag_vertex_color) are
## baked as vertex colours into a shared group surface, so a landmark made
## of sixty parts in fifteen colours still costs only one surface for all
## of its plain geometry, plus one per animated group (foliage, cloth) and
## one per special material (glowing, water). That keeps a richly
## decorated, gently animated Hub practical on the GL Compatibility
## renderer and on modest hardware.
##
## Usage: set `origin` to where the next group of parts should go, then
## call part() with positions local to that origin; commit() at the end.

var origin: Transform3D = Transform3D.IDENTITY

var _tools: Dictionary = {}   # Material -> SurfaceTool

## (primitive mesh, colour) -> the same mesh with a baked colour array.
static var _colored_cache: Dictionary = {}


func add(mesh: Mesh, xform: Transform3D, material: Material) -> void:
	var target_material: Material = material
	var source: Mesh = mesh
	if material and material.has_meta("mq_vc_group"):
		target_material = DecorKit.group_material(material.get_meta("mq_vc_group"))
		source = _colored(mesh, material.get_meta("mq_vc_color"))
	var st: SurfaceTool = _tools.get(target_material)
	if st == null:
		st = SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		st.set_material(target_material)
		_tools[target_material] = st
	st.append_from(source, 0, xform)


## Adds one part relative to `origin`.
func part(mesh: Mesh, material: Material, pos: Vector3 = Vector3.ZERO, rot_deg: Vector3 = Vector3.ZERO, scl: Vector3 = Vector3.ONE) -> void:
	add(mesh, origin * DecorKit.xf(pos, rot_deg, scl), material)


func is_empty() -> bool:
	return _tools.is_empty()


func commit() -> ArrayMesh:
	var am := ArrayMesh.new()
	for st: SurfaceTool in _tools.values():
		st.commit(am)
	return am


## Convenience: commit into a new MeshInstance3D child of `parent`.
func commit_to(parent: Node, node_name: String, cast_shadows: bool = true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.name = node_name
	mi.mesh = commit()
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if cast_shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


static func _colored(mesh: Mesh, c: Color) -> Mesh:
	var key: String = "%d|%s" % [mesh.get_instance_id(), c.to_html(false)]
	if _colored_cache.has(key):
		return _colored_cache[key]
	var arrays: Array = mesh.surface_get_arrays(0)
	var colors := PackedColorArray()
	colors.resize((arrays[Mesh.ARRAY_VERTEX] as PackedVector3Array).size())
	colors.fill(c)
	arrays[Mesh.ARRAY_COLOR] = colors
	var am := ArrayMesh.new()
	am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	_colored_cache[key] = am
	return am
