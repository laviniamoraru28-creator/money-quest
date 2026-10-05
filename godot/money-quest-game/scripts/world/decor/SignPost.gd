@tool
extends Node3D
## SignPost — a wooden fingerpost by the Hub's spawn point with one arrow
## board per destination, each pointing the real way to its portal and
## naming it with that portal's own label_key (so it is localised exactly
## like the portal's floating label — no new text). Board colour = the
## district's accent; lettering is ink on cream for high contrast.
##
## Environmental wayfinding complementing (never replacing) the portals'
## always-visible labels: a child can stand at spawn and see "that way".

const K = preload("res://scripts/world/decor/DecorKit.gd")

const BOARD_LENGTH: float = 1.9
const BOARD_HEIGHT: float = 0.3

var _labels: Array[Label3D] = []
var _label_keys: Array[String] = []


func _ready() -> void:
	var portals: Array[Node3D] = []
	if get_parent():
		for child in get_parent().get_children():
			if child is Node3D and String(child.name).begins_with("Portal"):
				portals.append(child)

	var m := MeshMerger.new()
	m.part(K.cyl(0.11, 0.13, 3.6, 8), K.mat("wood_dark"), Vector3(0, 1.8, 0))
	m.part(K.cyl(0.3, 0.36, 0.25, 8), K.mat("stone"), Vector3(0, 0.12, 0))
	m.part(K.sphere(0.17, 10, 5), K.mat("gold"), Vector3(0, 3.66, 0))

	var y: float = 3.3
	for portal in portals:
		var to_portal: Vector3 = portal.global_position - global_position if is_inside_tree() else portal.position - position
		to_portal.y = 0.0
		var b: float = K.bearing_of(to_portal)
		var accent: String = K.DISTRICTS.get(String(portal.name), {}).get("accent", "gold")
		# Board local +X points toward the portal (yaw = 90 - bearing).
		var board_xf: Transform3D = K.xf(Vector3(0, y, 0), Vector3(0, 90.0 - b, 0))
		m.origin = board_xf
		m.part(K.box(Vector3(BOARD_LENGTH, BOARD_HEIGHT, 0.07)), K.mat("cream"), Vector3(BOARD_LENGTH * 0.5 + 0.12, 0, 0))
		m.part(K.prism(Vector3(BOARD_HEIGHT, 0.32, 0.075)), K.mat(accent), Vector3(BOARD_LENGTH + 0.28, 0, 0), Vector3(0, 0, -90))
		m.part(K.box(Vector3(0.16, BOARD_HEIGHT, 0.075)), K.mat(accent), Vector3(0.2, 0, 0))
		for side in [1.0, -1.0]:
			var label := Label3D.new()
			label.font_size = 34
			label.pixel_size = 0.004
			label.outline_size = 0
			label.modulate = K.color("ink")
			label.double_sided = false
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			# Front label reads left-to-right toward the arrow; the back
			# one is turned around so it reads correctly from behind.
			var lx: Transform3D = board_xf * K.xf(Vector3(BOARD_LENGTH * 0.5 + 0.2, 0, side * 0.04), Vector3(0, 0 if side > 0 else 180, 0))
			label.transform = lx
			add_child(label)
			_labels.append(label)
			_label_keys.append(String(portal.get("label_key")) if portal.get("label_key") != null else "")
		y -= 0.38
	m.origin = Transform3D.IDENTITY
	m.commit_to(self, "Post", true)

	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	K.add_cyl_collider(body, 0.35, 3.0, K.xf(Vector3(0, 1.5, 0)))
	add_child(body)

	_refresh_text()
	if not Engine.is_editor_hint():
		Localization.locale_changed.connect(func(_l: String) -> void: _refresh_text())


func _refresh_text() -> void:
	for i in _labels.size():
		var key: String = _label_keys[i]
		_labels[i].text = key if Engine.is_editor_hint() else Localization.t(key)
