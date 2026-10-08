class_name SeasonWindow
extends Node3D
## SeasonWindow — a big window in the Time Vault's back wall with a tree
## and a little garden outside, plus a wall calendar beside it, so time can
## be SEEN: blossom → green → orange → snow, again each year; the tree
## grows taller over the years; the calendar counts the years (a number
## and a row of year marks). No words.
##
## set_time(years) places everything at a moment (Reduced Motion: the flow
## calls it once with the final value). The tree also keeps a little of
## each finished visit (`base_growth`): coming back, the child sees the
## tree they grew (a persistent change, TimeVaultFlow).

const SEASON_COLORS: Array = [Color("F2A7C4"), Color("5FA35A"), Color("E8873D"), Color("F4F7FA")]
const GROUND_COLORS: Array = [Color("8BC97F"), Color("6DB561"), Color("B58A4C"), Color("E8EEF2")]

var base_growth: float = 0.0
var _crown_mat: StandardMaterial3D
var _ground_mat: StandardMaterial3D
var _tree: Node3D
var _year_label: Label3D
var _marks: Array[MeshInstance3D] = []


func _ready() -> void:
	name = "SeasonWindow"
	var m := MeshMerger.new()
	# The window frame and sky.
	m.part(DecorKit.box(Vector3(5.2, 3.2, 0.12)), DecorKit.mat("wood_dark"), Vector3(0, 2.3, 0))
	m.part(DecorKit.box(Vector3(4.8, 2.8, 0.13)), DecorKit.mat("sky_light"), Vector3(0, 2.3, 0.01))
	m.part(DecorKit.box(Vector3(0.1, 2.8, 0.16)), DecorKit.mat("wood_dark"), Vector3(0, 2.3, 0.02))
	m.part(DecorKit.box(Vector3(4.8, 0.1, 0.16)), DecorKit.mat("wood_dark"), Vector3(0, 2.3, 0.02))
	# The calendar beside it.
	m.part(DecorKit.box(Vector3(1.4, 1.6, 0.06)), DecorKit.mat("white"), Vector3(3.6, 2.3, 0.02))
	m.part(DecorKit.box(Vector3(1.4, 0.36, 0.08)), DecorKit.mat("coral"), Vector3(3.6, 2.92, 0.03))
	m.commit_to(self, "WindowMesh", false)
	# Outside: ground and the tree (their own materials, recoloured).
	_ground_mat = StandardMaterial3D.new()
	_ground_mat.albedo_color = GROUND_COLORS[0]
	var ground := MeshInstance3D.new()
	ground.mesh = DecorKit.box(Vector3(4.6, 0.5, 0.05))
	ground.material_override = _ground_mat
	ground.position = Vector3(0, 1.15, 0.05)
	add_child(ground)
	_tree = Node3D.new()
	_tree.name = "Tree"
	_tree.position = Vector3(-0.9, 1.3, 0.06)
	add_child(_tree)
	var trunk := MeshInstance3D.new()
	trunk.mesh = DecorKit.box(Vector3(0.16, 0.9, 0.03))
	trunk.material_override = DecorKit.mat("wood")
	trunk.position = Vector3(0, 0.45, 0)
	_tree.add_child(trunk)
	_crown_mat = StandardMaterial3D.new()
	_crown_mat.albedo_color = SEASON_COLORS[1]
	var crown := MeshInstance3D.new()
	crown.mesh = DecorKit.sphere(0.55, 16, 8)
	crown.material_override = _crown_mat
	crown.scale = Vector3(1.0, 0.85, 0.08)
	crown.position = Vector3(0, 1.1, 0)
	_tree.add_child(crown)
	_year_label = Label3D.new()
	_year_label.name = "Years"
	_year_label.font_size = 120
	_year_label.outline_size = 16
	_year_label.modulate = MoneyIcons.INK
	_year_label.outline_modulate = Color.WHITE
	_year_label.position = Vector3(3.6, 2.3, 0.08)
	add_child(_year_label)
	for i in TimeVaultModel.YEARS:
		var mark := MeshInstance3D.new()
		mark.mesh = DecorKit.box(Vector3(0.1, 0.1, 0.02))
		mark.material_override = DecorKit.mat("teal")
		mark.position = Vector3(3.0 + (i % 5) * 0.3, 1.82 - (i / 5) * 0.16, 0.08)
		mark.visible = false
		add_child(mark)
		_marks.append(mark)
	set_time(0.0)


## Places the window at `years` since the start (fractions give the season).
func set_time(years: float) -> void:
	var season: int = int(floor(fposmod(years, 1.0) * 4.0)) % 4
	if years >= TimeVaultModel.YEARS - 0.001:
		season = 1
	_crown_mat.albedo_color = SEASON_COLORS[season]
	_ground_mat.albedo_color = GROUND_COLORS[season]
	var grown: float = clampf(years / TimeVaultModel.YEARS, 0.0, 1.0)
	_tree.scale = Vector3.ONE * (0.55 + base_growth + 0.45 * grown)
	var whole: int = int(floor(years + 0.001))
	_year_label.text = str(whole)
	for i in _marks.size():
		_marks[i].visible = i < whole
