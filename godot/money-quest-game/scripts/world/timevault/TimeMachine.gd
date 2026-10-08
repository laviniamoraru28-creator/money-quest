class_name TimeMachine
extends ActivityStation
## TimeMachine — a big brass clock on a stand with a lever: "make time
## pass". Its hands spin while years go by (still with Reduced Motion, the
## hands just jump). What pulling it does is the activity's business
## (TimeVaultFlow listens to `used`).

var _hand_long: Node3D
var _hand_short: Node3D
var _lever: Node3D


func _init() -> void:
	prompt_key = "interaction.time_prompt"
	reach = 2.2


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Clock"
	var m := MeshMerger.new()
	m.part(DecorKit.cyl(0.5, 0.65, 0.3, 16), DecorKit.mat("wood_dark"), Vector3(0, 0.15, 0))
	m.part(DecorKit.box(Vector3(0.3, 1.5, 0.3)), DecorKit.mat("wood_dark"), Vector3(0, 1.0, 0))
	m.part(DecorKit.cyl(0.85, 0.85, 0.16, 32), DecorKit.mat("gold"), Vector3(0, 2.3, 0), Vector3(90, 0, 0))
	m.part(DecorKit.cyl(0.74, 0.74, 0.18, 32), DecorKit.mat("cream"), Vector3(0, 2.3, 0.01), Vector3(90, 0, 0))
	for i in 12:
		var a: float = TAU * i / 12.0
		m.part(DecorKit.box(Vector3(0.05, 0.14, 0.03)), DecorKit.mat("ink"), Vector3(sin(a) * 0.6, 2.3 + cos(a) * 0.6, 0.11), Vector3(0, 0, -rad_to_deg(a)))
	m.part(DecorKit.sphere(0.07, 10, 6), DecorKit.mat("ink"), Vector3(0, 2.3, 0.12))
	m.commit_to(root, "ClockMesh", true)
	_hand_long = _hand(root, 0.5, 0.04)
	_hand_short = _hand(root, 0.32, 0.06)
	_hand_short.rotation.z = -PI * 0.6
	# The lever on the side.
	_lever = Node3D.new()
	_lever.name = "Lever"
	_lever.position = Vector3(0.32, 1.2, 0)
	var lm := MeshMerger.new()
	lm.part(DecorKit.box(Vector3(0.06, 0.6, 0.06)), DecorKit.mat("stone_dark"), Vector3(0.06, 0.3, 0))
	lm.part(DecorKit.sphere(0.1, 10, 6), DecorKit.mat("coral"), Vector3(0.06, 0.62, 0))
	lm.commit_to(_lever, "LeverMesh", false)
	_lever.rotation.z = -0.5
	root.add_child(_lever)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	root.add_child(body)
	DecorKit.add_box_collider(body, Vector3(1.2, 3.2, 0.6), DecorKit.xf(Vector3(0, 1.6, 0)))
	return root


func _hand(root: Node3D, length: float, width: float) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = Vector3(0, 2.3, 0.13)
	var hm := MeshMerger.new()
	hm.part(DecorKit.box(Vector3(width, length, 0.02)), DecorKit.mat("ink"), Vector3(0, length * 0.5, 0))
	hm.commit_to(pivot, "Hand", false)
	root.add_child(pivot)
	return pivot


## Pulls the lever (down, then back up after `seconds`).
func pull() -> void:
	AudioManager.play_sfx("portal", 1.3, -6.0)
	if Settings.reduced_motion:
		return
	var tw := create_tween()
	tw.tween_property(_lever, "rotation:z", 0.6, 0.15)
	tw.tween_interval(0.4)
	tw.tween_property(_lever, "rotation:z", -0.5, 0.3)


## Shows `years` passing: the long hand turns once a year.
func set_years(years: float) -> void:
	_hand_long.rotation.z = -TAU * years
	_hand_short.rotation.z = -PI * 0.6 - TAU * years / 12.0
