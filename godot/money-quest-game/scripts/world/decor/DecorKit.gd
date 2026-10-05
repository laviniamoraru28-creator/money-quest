@tool
class_name DecorKit
extends RefCounted
## DecorKit — the shared visual vocabulary of Money Quest World's procedural
## environment: one colour palette, one cache of primitive meshes and one
## cache of materials. Every landmark, prop, path and hill draws from the
## same small set of resources, which is what makes the districts read as
## ONE world (shared materials, shared shapes, shared scale) and keeps the
## GL Compatibility renderer's draw-call count low.
##
## Colours start from the website's brand tokens (tailwind.config.ts: fog,
## cream, teal, gold, ember, sky, ink) and add softer environment tones
## around them. Nothing here is gameplay — it is purely how things look.

const PALETTE: Dictionary = {
	# Brand tokens (tailwind.config.ts)
	"fog": Color("EDF3E8"),
	"cream": Color("FBF8EF"),
	"ink": Color("1C2624"),
	"teal": Color("0F7A6B"),
	"teal_dark": Color("0B5C50"),
	"gold": Color("E8A33D"),
	"ember": Color("D13E19"),
	"sky": Color("367D99"),
	# Architecture
	"teal_light": Color("5FB3A3"),
	"gold_deep": Color("C98A2B"),
	"coral": Color("F07A5A"),
	"sky_light": Color("7DB6CF"),
	"lilac": Color("A99BD9"),
	"lilac_dark": Color("7A68B8"),
	"book_red": Color("B54A3C"),
	"parchment": Color("F4E9D0"),
	"plaster": Color("EFE4CC"),
	"stone": Color("D0C6B2"),
	"stone_dark": Color("A99E8B"),
	"verdigris": Color("8CC4B4"),
	"wood": Color("A9744F"),
	"wood_dark": Color("6B4A33"),
	"glass": Color("3E6475"),
	"window_warm": Color("FFE1A0"),
	"bulb": Color("FFE48A"),
	"white": Color("FFFFFF"),
	# Ground and paving
	"paving": Color("CDBD9C"),
	"paving_light": Color("DACBAE"),
	"path_gold": Color("DDB46A"),
	"path_terracotta": Color("D58660"),
	"path_slate": Color("94AFBD"),
	"path_wood": Color("C0956A"),
	"path_stone": Color("C3B8A3"),
	"path_lilac": Color("B3A7DA"),
	"path_moss": Color("A6C788"),
	"soil": Color("7A5A41"),
	# Nature
	"grass": Color("7DB55F"),
	"grass_light": Color("8CC46B"),
	"grass_dark": Color("5E9C55"),
	"hill": Color("79B262"),
	"hill_far": Color("6FA37E"),
	"mountain": Color("7C988F"),
	"snow": Color("F7FAF9"),
	"leaf": Color("4F9B5C"),
	"leaf_light": Color("7DBF68"),
	"leaf_dark": Color("3D7D4E"),
	"leaf_soft": Color("9CCB8E"),
	"blossom": Color("F4B2C8"),
	"blossom_white": Color("FAEFF2"),
	"rock": Color("9E988B"),
	"water": Color("4A9DB8"),
	"water_deep": Color("2F7489"),
	"cloud": Color("FFFFFF"),
}

## Each destination's identity, keyed by its portal node name in
## WorldHub.tscn. `accent` colours its plaza inlay, signpost arrow and
## glowing arch; `path` is the paving of the path leading to it.
const DISTRICTS: Dictionary = {
	"PortalMoneyQuest": {"accent": "gold", "path": "path_gold"},
	"PortalEntrepreneurQuest": {"accent": "ember", "path": "path_terracotta"},
	"PortalLeadershipQuest": {"accent": "sky", "path": "path_slate"},
	"PortalLibrary": {"accent": "book_red", "path": "path_wood"},
	"PortalMuseum": {"accent": "coral", "path": "path_stone"},
	"PortalMindLab": {"accent": "lilac", "path": "path_lilac"},
	"PortalCalmWorld": {"accent": "leaf_soft", "path": "path_moss"},
}

## Merge groups for MeshMerger's vertex-colour baking. Every plain matte
## colour bakes into "static"; foliage, flowers and cloth bake into their
## own animated groups. One shared material per group — see group_material().
const SWAY_PROFILES: Dictionary = {
	# amplitude, speed, height_start, height_full
	"tree": [0.07, 0.85, 0.8, 3.5],
	"flower": [0.022, 1.3, 0.3, 0.75],
	"calm": [0.03, 0.5, 0.8, 3.5],
}
const SWAY_SHADER: Shader = preload("res://assets/shaders/mq_sway.gdshader")
const CLOTH_SHADER: Shader = preload("res://assets/shaders/mq_cloth.gdshader")
const WATER_SHADER: Shader = preload("res://assets/shaders/mq_water.gdshader")

static var _materials: Dictionary = {}
static var _meshes: Dictionary = {}
static var _group_materials: Dictionary = {}


static func color(color_name: String) -> Color:
	return PALETTE.get(color_name, Color.MAGENTA)


## A shared matte material. `glow` > 0 adds a soft self-lit emission (used
## for windows, lanterns and the entrance arches instead of real lights,
## which the Compatibility renderer pays for per light).
static func mat(color_name: String, glow: float = 0.0) -> StandardMaterial3D:
	var key: String = "%s|%.2f" % [color_name, glow]
	if _materials.has(key):
		return _materials[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color(color_name)
	# Matte, low specular: a soft painted look, and no bright sky sheen
	# washing out the colours at glancing angles.
	m.roughness = 1.0
	m.metallic_specular = 0.2
	if glow > 0.0:
		m.emission_enabled = true
		m.emission = color(color_name)
		m.emission_energy_multiplier = glow
	else:
		tag_vertex_color(m, "static", m.albedo_color)
	_materials[key] = m
	return m


## Same colour, but its geometry gently sways (see mq_sway.gdshader).
## profile: "tree", "flower" or "calm" (slower, softer — Calm World).
static func sway(color_name: String, profile: String = "tree") -> StandardMaterial3D:
	return _tagged("sway_" + profile, color_name)


## Same colour, but it ripples like fabric (see mq_cloth.gdshader).
static func cloth(color_name: String) -> StandardMaterial3D:
	return _tagged("cloth", color_name)


static func _tagged(group: String, color_name: String) -> StandardMaterial3D:
	var key: String = group + "|" + color_name
	if not _materials.has(key):
		var m := StandardMaterial3D.new()
		m.albedo_color = color(color_name)
		m.roughness = 1.0
		tag_vertex_color(m, group, m.albedo_color)
		_materials[key] = m
	return _materials[key]


## Marks a material as "bake me as vertex colour into `group`" for
## MeshMerger. The material itself stays a normal, usable material.
static func tag_vertex_color(m: Material, group: String, c: Color) -> void:
	m.set_meta("mq_vc_group", group)
	m.set_meta("mq_vc_color", c)


## The one real material each merge group renders with.
static func group_material(group: String) -> Material:
	if _group_materials.has(group):
		return _group_materials[group]
	var result: Material
	if group == "static":
		var m := StandardMaterial3D.new()
		m.vertex_color_use_as_albedo = true
		m.vertex_color_is_srgb = true
		m.roughness = 1.0
		m.metallic_specular = 0.2
		result = m
	elif group == "cloth":
		var c := ShaderMaterial.new()
		c.shader = CLOTH_SHADER
		result = c
	elif group.begins_with("sway_"):
		var p: Array = SWAY_PROFILES.get(group.substr(5), SWAY_PROFILES["tree"])
		var s := ShaderMaterial.new()
		s.shader = SWAY_SHADER
		s.set_shader_parameter("amplitude", p[0])
		s.set_shader_parameter("speed", p[1])
		s.set_shader_parameter("height_start", p[2])
		s.set_shader_parameter("height_full", p[3])
		result = s
	else:
		result = group_material("static")
	_group_materials[group] = result
	return result


## Water: opaque (no transparency sorting), softly glossy, with a very slow
## drifting ripple (mq_water.gdshader). `calm` = slower and gentler still,
## for Calm World.
static func water_mat(color_name: String = "water", calm: bool = false) -> ShaderMaterial:
	var key: String = "watershader|%s|%s" % [color_name, calm]
	if _materials.has(key):
		return _materials[key]
	var m := ShaderMaterial.new()
	m.shader = WATER_SHADER
	m.set_shader_parameter("water_color", color(color_name))
	m.set_shader_parameter("speed", 0.3 if calm else 0.6)
	m.set_shader_parameter("strength", 0.035 if calm else 0.06)
	_materials[key] = m
	return m


## Every shared material with a `motion` switch — AmbientDirector sets it
## to 0.0 under Reduced Motion and back to 1.0 otherwise.
static func motion_materials() -> Array[ShaderMaterial]:
	var out: Array[ShaderMaterial] = []
	for g in ["cloth", "sway_tree", "sway_flower", "sway_calm"]:
		out.append(group_material(g))
	for key: String in _materials:
		if key.begins_with("watershader|") and _materials[key] is ShaderMaterial:
			out.append(_materials[key])
	return out


## A soft, unshaded, see-through glow — only for the doorway "veil" inside
## each entrance arch, so a child can see at a glance where to walk in.
static func veil_mat(color_name: String) -> StandardMaterial3D:
	var key: String = "veil|" + color_name
	if _materials.has(key):
		return _materials[key]
	var m := StandardMaterial3D.new()
	var c: Color = color(color_name)
	m.albedo_color = Color(c.r, c.g, c.b, 0.35)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	_materials[key] = m
	return m


static func box(size: Vector3) -> BoxMesh:
	var key: String = "box|%s" % size
	if not _meshes.has(key):
		var b := BoxMesh.new()
		b.size = size
		_meshes[key] = b
	return _meshes[key]


static func cyl(top_radius: float, bottom_radius: float, height: float, segments: int = 12) -> CylinderMesh:
	var key: String = "cyl|%s|%s|%s|%d" % [top_radius, bottom_radius, height, segments]
	if not _meshes.has(key):
		var c := CylinderMesh.new()
		c.top_radius = top_radius
		c.bottom_radius = bottom_radius
		c.height = height
		c.radial_segments = segments
		c.rings = 1
		_meshes[key] = c
	return _meshes[key]


static func sphere(radius: float, segments: int = 12, rings: int = 6, hemisphere: bool = false) -> SphereMesh:
	var key: String = "sph|%s|%d|%d|%s" % [radius, segments, rings, hemisphere]
	if not _meshes.has(key):
		var s := SphereMesh.new()
		s.radius = radius
		s.height = radius if hemisphere else radius * 2.0
		s.is_hemisphere = hemisphere
		s.radial_segments = segments
		s.rings = rings
		_meshes[key] = s
	return _meshes[key]


static func prism(size: Vector3) -> PrismMesh:
	var key: String = "prism|%s" % size
	if not _meshes.has(key):
		var p := PrismMesh.new()
		p.size = size
		_meshes[key] = p
	return _meshes[key]


static func torus(inner_radius: float, outer_radius: float, rings: int = 32, ring_segments: int = 8) -> TorusMesh:
	var key: String = "torus|%s|%s|%d|%d" % [inner_radius, outer_radius, rings, ring_segments]
	if not _meshes.has(key):
		var t := TorusMesh.new()
		t.inner_radius = inner_radius
		t.outer_radius = outer_radius
		t.rings = rings
		t.ring_segments = ring_segments
		_meshes[key] = t
	return _meshes[key]


## Position / rotation (degrees) / local scale -> Transform3D. Scale is
## applied before rotation, so a scaled sphere stays a squashed sphere.
static func xf(pos: Vector3 = Vector3.ZERO, rot_deg: Vector3 = Vector3.ZERO, scl: Vector3 = Vector3.ONE) -> Transform3D:
	var b: Basis = Basis.from_euler(rot_deg * (PI / 180.0)) * Basis.from_scale(scl)
	return Transform3D(b, pos)


## Unit direction on the ground plane for a compass bearing in degrees
## (0 = north = -Z, 90 = east = +X) — the Hub's layout convention.
static func bearing_dir(bearing_deg: float) -> Vector3:
	var r: float = deg_to_rad(bearing_deg)
	return Vector3(sin(r), 0.0, -cos(r))


## The bearing (degrees, 0..360) of a ground-plane position as seen from
## the Hub centre.
static func bearing_of(pos: Vector3) -> float:
	return fposmod(rad_to_deg(atan2(pos.x, -pos.z)), 360.0)


## Y rotation (degrees) that turns a node's local +Z to face the given
## bearing — e.g. a bench at bearing B facing the centre uses B + 180.
static func yaw_facing(bearing_deg: float) -> float:
	return 180.0 - bearing_deg


static func add_box_collider(body: CollisionObject3D, size: Vector3, xform: Transform3D) -> void:
	var shape := BoxShape3D.new()
	shape.size = size
	var cs := CollisionShape3D.new()
	cs.shape = shape
	cs.transform = xform
	body.add_child(cs)


static func add_cyl_collider(body: CollisionObject3D, radius: float, height: float, xform: Transform3D) -> void:
	var shape := CylinderShape3D.new()
	shape.radius = radius
	shape.height = height
	var cs := CollisionShape3D.new()
	cs.shape = shape
	cs.transform = xform
	body.add_child(cs)
