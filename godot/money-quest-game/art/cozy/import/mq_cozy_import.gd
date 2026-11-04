@tool
extends EditorScenePostImport
## Cozy Atlas import rules for the kit files in res://art/cozy/kit/ (set as
## each .glb's import script). It only:
##  1. swaps every imported material for the shared master of the same name
##     in res://art/cozy/materials/ (Godot's glTF import leaves vertex colour
##     off, and the masters carry it), and
##  2. switches shadows off for small props, so only the large pieces cast.
## Anything that breaks the rules is reported, never silently skipped.
## Repeated MM_ parts are NOT combined here: CozyKit.batch_repeats() does that
## when a piece is built, so a headless import keeps every position.
## Collision (-colonly / -convcolonly) and MK_ markers are left to Godot's
## own name-suffix handling.

const MATERIAL_DIR := "res://art/cozy/materials/"
## Parts too small or too flat to cast a shadow worth its cost.
const NO_SHADOW := ["MM_", "EX_Pavilion_Glow", "EX_Pavilion_Fabric", "EX_Pond_", "EX_Signpost_Stone", "EX_Boulder_"]


func _post_import(scene: Node) -> Object:
	var problems: Array[String] = []
	var swapped := 0
	for mi in scene.find_children("*", "MeshInstance3D", true, false):
		swapped += _swap_materials(mi as MeshInstance3D, problems)
		for prefix in NO_SHADOW:
			if String(mi.name).begins_with(prefix):
				(mi as GeometryInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	print("[mq_cozy_import] %s: %d surfaces on shared materials, %d problems" % [get_source_file(), swapped, problems.size()])
	for p in problems:
		push_warning("[mq_cozy_import] %s: %s" % [get_source_file(), p])
	return scene


func _swap_materials(mi: MeshInstance3D, problems: Array[String]) -> int:
	if mi.mesh == null:
		return 0
	var count := 0
	for s in mi.mesh.get_surface_count():
		var imported: Material = mi.mesh.surface_get_material(s)
		var key: String = imported.resource_name if imported else ""
		var path: String = MATERIAL_DIR + key + ".tres"
		if key.is_empty() or not ResourceLoader.exists(path):
			problems.append("%s surface %d uses '%s', which is not a Cozy Atlas master" % [mi.name, s, key])
			continue
		mi.mesh.surface_set_material(s, load(path))
		count += 1
	return count
