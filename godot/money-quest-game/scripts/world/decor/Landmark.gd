@tool
class_name Landmark
extends Node3D
## Landmark — base for the seven destination buildings around the World
## Hub. Purely visual: the actual travel still happens through the Hub's
## Portal* nodes (PortalInteraction), which each Landmark is placed around.
##
## Convention: a Landmark's origin sits exactly on its portal, local +Z
## faces the Hub plaza, and the building extends into local -Z. Every
## landmark shares the same architectural grammar — a stone plinth, cream
## or stone walls, gold trim and a glowing entrance arch in its district's
## accent colour (the "glowing arch" the Hub Guide's welcome line refers
## to) — while its silhouette is unique, so the seven read as one world.
##
## Subclasses override _build(); everything is generated at load (and in
## the editor, so the Hub can be previewed), merged into a few meshes.

## Physics layers for landmark collision: 1 = normal world collision (the
## player bumps into it), 2 = "camera blocker", which CameraController's
## optional occlusion check uses to keep the camera out of buildings.
const COLLISION_LAYERS: int = 1 | 2
## Centre height of the name sign over the entrance arch.
const SIGN_HEIGHT: float = 3.95

@export var accent: String = "gold"


func _ready() -> void:
	var m := MeshMerger.new()
	var body := StaticBody3D.new()
	body.name = "Collision"
	body.collision_layer = COLLISION_LAYERS
	body.collision_mask = 0
	_build(m, body)
	_entrance_arch(m)
	m.commit_to(self, "Building")
	add_child(body)
	_add_veil()
	if not Engine.is_editor_hint():
		_add_destination_sign()


## The place's name over its entrance (DestinationSign), for the portal
## this landmark stands on — it replaces that portal's floating label.
func _add_destination_sign() -> void:
	var hub: Node = get_parent().get_parent() if get_parent() else null
	if hub == null:
		return
	for n in hub.get_children():
		if n is PortalInteraction and n.global_position.distance_to(global_position) < 0.5 and Destinations.has(n.target_zone_id):
			var sign: DestinationSign = DestinationSign.make(n.target_zone_id, 5.0)
			sign.position = Vector3(0, SIGN_HEIGHT, 0.45)
			add_child(sign)
			var label := n.get_node_or_null("Label") as Label3D
			if label:
				label.visible = false
			return


## Override: add parts to `m` (local coordinates, entrance at the origin)
## and collision shapes to `body`.
func _build(_m: MeshMerger, _body: StaticBody3D) -> void:
	pass


## The district-coloured glowing arch every destination shares. A torus
## centred on the ground: its lower half is hidden below the grass, so it
## reads as a rounded archway the player walks through toward the portal.
func _entrance_arch(m: MeshMerger) -> void:
	m.origin = Transform3D.IDENTITY
	m.part(DecorKit.torus(2.35, 2.75, 40, 8), DecorKit.mat(accent, 0.55), Vector3(0, 0, 0), Vector3(90, 0, 0))
	m.part(DecorKit.torus(2.75, 2.95, 40, 6), DecorKit.mat("cream"), Vector3(0, 0, -0.05), Vector3(90, 0, 0))
	for sx in [-2.55, 2.55]:
		m.part(DecorKit.cyl(0.42, 0.48, 0.35, 10), DecorKit.mat("stone"), Vector3(sx, 0.17, 0))


## The soft see-through glow filling the arch — separate from the merged
## mesh because it is the one transparent surface.
func _add_veil() -> void:
	var veil := MeshInstance3D.new()
	veil.name = "ArchVeil"
	veil.mesh = DecorKit.cyl(2.35, 2.35, 0.02, 40)
	veil.material_override = DecorKit.veil_mat(accent)
	veil.transform = DecorKit.xf(Vector3(0, 0, -0.15), Vector3(90, 0, 0))
	veil.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(veil)


# --- small shared helpers for subclasses -------------------------------------

func box_part(m: MeshMerger, body: StaticBody3D, size: Vector3, pos: Vector3, color_name: String, collide: bool = true, rot_deg: Vector3 = Vector3.ZERO) -> void:
	m.part(DecorKit.box(size), DecorKit.mat(color_name), pos, rot_deg)
	if collide:
		DecorKit.add_box_collider(body, size, DecorKit.xf(pos, rot_deg))


## Windows along both side walls of a box-shaped building (centre `c`,
## `size`), so a neighbouring district never looks at a blank wall.
func side_windows(m: MeshMerger, c: Vector3, size: Vector3, per_side: int, rows: Array, frame: String = "wood_dark") -> void:
	m.origin = Transform3D.IDENTITY
	for side in [-1.0, 1.0]:
		var x: float = c.x + side * (size.x * 0.5 + 0.04)
		for i in per_side:
			var z: float = c.z - size.z * 0.5 + size.z * (float(i) + 0.5) / float(per_side)
			for wy in rows:
				m.part(DecorKit.box(Vector3(0.1, 1.05, 0.75)), DecorKit.mat("window_warm", 0.25), Vector3(x, wy, z))
				m.part(DecorKit.box(Vector3(0.16, 0.12, 0.9)), DecorKit.mat(frame), Vector3(x, wy - 0.6, z))


## Vertical trims on the four corners of a box-shaped building.
func corner_trims(m: MeshMerger, c: Vector3, size: Vector3, color_name: String) -> void:
	m.origin = Transform3D.IDENTITY
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			m.part(DecorKit.box(Vector3(0.32, size.y, 0.32)), DecorKit.mat(color_name), Vector3(c.x + sx * size.x * 0.5, c.y, c.z + sz * size.z * 0.5))


## A pennant banner on a pole: pole, cloth, gold emblem disc.
func banner(m: MeshMerger, pos: Vector3, cloth: String, height: float = 4.2) -> void:
	m.origin = Transform3D.IDENTITY
	m.part(DecorKit.cyl(0.06, 0.07, height, 6), DecorKit.mat("wood_dark"), pos + Vector3(0, height * 0.5, 0))
	m.part(DecorKit.sphere(0.12, 8, 4), DecorKit.mat("gold"), pos + Vector3(0, height + 0.08, 0))
	m.part(DecorKit.box(Vector3(0.9, 1.7, 0.05)), DecorKit.cloth(cloth), pos + Vector3(0.48, height - 1.0, 0))
	m.part(DecorKit.prism(Vector3(0.9, 0.35, 0.05)), DecorKit.cloth(cloth), pos + Vector3(0.48, height - 2.02, 0), Vector3(0, 0, 180))
	m.part(DecorKit.cyl(0.22, 0.22, 0.03, 12), DecorKit.cloth("gold"), pos + Vector3(0.48, height - 0.85, 0.04), Vector3(90, 0, 0))
