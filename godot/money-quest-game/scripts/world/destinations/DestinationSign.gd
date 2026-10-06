class_name DestinationSign
extends Node3D
## DestinationSign — the name of an important place, in the world, over its
## entrance: a big cream board framed in the district's colour, the place's
## name in large dark lettering (the quest / district name small above it),
## and the place's emblem standing on top (coin, book, bulb, column...) so
## it is recognisable by shape too — the same shape as on the HUD's entry
## prompt. One sign per destination portal, added automatically by the
## Hub's Landmark buildings and by ZoneDressing's arches (no per-place
## code); the text comes from Destinations, so it is always the same name.
##
## Local +Z is the reading side (the sign faces the plaza / the room).
## The emblem turns very slowly (an AmbientPart: still with Reduced
## Motion). Built once; nothing runs per frame.

const K = preload("res://scripts/world/decor/DecorKit.gd")
const BOARD_HEIGHT: float = 1.25
const PIXEL: float = 0.0055        # Label3D world size per font pixel

var zone_id: String = ""
var board_width: float = 4.6
var title_label: Label3D
var district_label: Label3D


static func make(p_zone_id: String, width: float = 4.6) -> DestinationSign:
	var s := DestinationSign.new()
	s.zone_id = p_zone_id
	s.board_width = width
	s.name = "DestinationSign"
	return s


func _ready() -> void:
	var accent: String = String(Destinations.entry(zone_id).get("accent", "gold"))
	var w: float = board_width
	var h: float = BOARD_HEIGHT
	var m := MeshMerger.new()
	# Board: cream face, district-coloured frame, a gold cap — rounded ends.
	m.part(K.box(Vector3(w, h, 0.14)), K.mat("cream"), Vector3(0, 0, 0))
	m.part(K.box(Vector3(w + 0.24, 0.16, 0.22)), K.mat(accent), Vector3(0, h * 0.5 + 0.06, 0))
	m.part(K.box(Vector3(w + 0.24, 0.16, 0.22)), K.mat(accent), Vector3(0, -h * 0.5 - 0.06, 0))
	for side in [-1.0, 1.0]:
		m.part(K.box(Vector3(0.16, h + 0.28, 0.22)), K.mat(accent), Vector3(side * (w * 0.5 + 0.04), 0, 0))
		m.part(K.sphere(0.17, 12, 6), K.mat("gold", 0.35), Vector3(side * (w * 0.5 + 0.04), h * 0.5 + 0.2, 0))
	m.commit_to(self, "Board", true)

	var district: String = Destinations.district(zone_id)
	var title: String = Destinations.title(zone_id).to_upper()
	title_label = _label(title, w - 0.4, 0.62 if district.is_empty() else 0.5)
	title_label.name = "TitleText"
	title_label.position = Vector3(0, -0.05 if district.is_empty() else -0.14, 0.08)
	add_child(title_label)
	if not district.is_empty():
		district_label = _label(district.to_upper(), w - 0.6, 0.26)
		district_label.name = "DistrictText"
		district_label.modulate = K.color(accent).darkened(0.35)
		district_label.position = Vector3(0, 0.36, 0.08)
		add_child(district_label)
	_emblem(Vector3(0, h * 0.5 + 0.75, 0))


## Large lettering that fits its line: the font shrinks for long names.
func _label(text: String, max_width: float, height: float) -> Label3D:
	var l := Label3D.new()
	l.text = text
	l.pixel_size = PIXEL
	var size_px: int = int(height / PIXEL)
	var est_width: float = text.length() * size_px * 0.62 * PIXEL
	if est_width > max_width:
		size_px = int(size_px * max_width / est_width)
	l.font_size = maxi(size_px, 24)
	l.outline_size = 0
	l.modulate = K.color("ink")
	l.double_sided = false
	l.shaded = false
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l


## The place's emblem, standing on the sign and turning very slowly.
func _emblem(pos: Vector3) -> void:
	var accent: String = String(Destinations.entry(zone_id).get("accent", "gold"))
	var e := MeshMerger.new()
	var a := K.mat(accent, 0.3)
	var ink := K.mat("ink")
	match Destinations.icon(zone_id):
		"coin":
			e.part(K.cyl(0.55, 0.55, 0.14, 28), K.mat("gold", 0.35), Vector3.ZERO, Vector3(90, 0, 0))
			e.part(K.torus(0.38, 0.45, 28, 4), K.mat("gold_deep"), Vector3.ZERO, Vector3(90, 0, 0), Vector3(1, 1.6, 1))
		"book":
			for side in [-1.0, 1.0]:
				e.part(K.box(Vector3(0.5, 0.7, 0.08)), a, Vector3(side * 0.26, 0, side * 0.08), Vector3(0, side * 18.0, 0))
				e.part(K.box(Vector3(0.44, 0.62, 0.05)), K.mat("cream"), Vector3(side * 0.26, 0, side * 0.08 + 0.05), Vector3(0, side * 18.0, 0))
			e.part(K.box(Vector3(0.06, 0.72, 0.12)), ink, Vector3.ZERO)
		"bulb":
			e.part(K.sphere(0.42, 16, 8), K.mat("bulb", 0.6), Vector3(0, 0.12, 0))
			e.part(K.cyl(0.18, 0.2, 0.3, 12), K.mat("stone_dark"), Vector3(0, -0.38, 0))
		"column":
			e.part(K.prism(Vector3(1.0, 0.3, 0.25)), a, Vector3(0, 0.4, 0))
			for x in [-0.32, 0.0, 0.32]:
				e.part(K.cyl(0.08, 0.09, 0.62, 10), K.mat("cream"), Vector3(x, -0.07, 0))
			e.part(K.box(Vector3(1.0, 0.1, 0.3)), a, Vector3(0, -0.42, 0))
		"mind":
			for p in [Vector3(-0.25, 0, 0), Vector3(0, 0.18, 0), Vector3(0.25, 0, 0), Vector3(0, -0.1, 0.05)]:
				e.part(K.sphere(0.3, 12, 6), a, p, Vector3.ZERO, Vector3(1, 0.85, 0.7))
		"leaf":
			e.part(K.sphere(0.5, 14, 7), K.sway(accent, "calm"), Vector3.ZERO, Vector3(0, 0, -35), Vector3(1, 0.5, 0.18))
			e.part(K.cyl(0.025, 0.025, 0.9, 6), K.mat("leaf_dark"), Vector3.ZERO, Vector3(0, 0, 55))
		"star":
			e.part(K.prism(Vector3(0.9, 0.55, 0.14)), a, Vector3(0, 0.1, 0))
			e.part(K.prism(Vector3(0.9, 0.55, 0.14)), a, Vector3(0, -0.08, 0), Vector3(0, 0, 180))
		"bag":
			e.part(K.box(Vector3(0.7, 0.6, 0.3)), a, Vector3(0, -0.1, 0))
			e.part(K.torus(0.18, 0.24, 18, 4), ink, Vector3(0, 0.22, 0), Vector3(90, 0, 0))
		"frame":
			e.part(K.box(Vector3(0.7, 0.85, 0.08)), a, Vector3.ZERO)
			e.part(K.box(Vector3(0.52, 0.66, 0.06)), K.mat("cream"), Vector3(0, 0, 0.03))
			e.part(K.sphere(0.13, 10, 5), ink, Vector3(0, 0.08, 0.06))
		_:
			e.part(K.cyl(0.5, 0.5, 0.1, 28), K.mat("cream"), Vector3.ZERO, Vector3(90, 0, 0))
			e.part(K.torus(0.46, 0.55, 28, 4), a, Vector3.ZERO, Vector3(90, 0, 0), Vector3(1, 1.4, 1))
			e.part(K.prism(Vector3(0.22, 0.4, 0.06)), K.mat(accent, 0.3), Vector3(0, 0.2, 0.06))
			e.part(K.prism(Vector3(0.22, 0.4, 0.06)), ink, Vector3(0, -0.2, 0.06), Vector3(0, 0, 180))
	AmbientPart.make(self, "Emblem", e, Transform3D(Basis.IDENTITY, pos), "sweep", 0.25, 0.5, Vector3.UP)
