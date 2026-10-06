class_name SavingsJar
extends ActivityStation
## SavingsJar — a big glass jar on a little stand: put coins in and watch
## the savings grow. `fill` (0..1) shows how full it is (gold coins rising
## inside the glass); drop_coins() animates coins falling in (instant with
## Reduced Motion). A goal card on the stand shows what the savings are
## for. Used by the Golden Vault's first activity; reusable anywhere a
## "save toward a goal" activity needs a jar.

const JAR_RADIUS: float = 0.42
const JAR_HEIGHT: float = 0.9
const STAND_HEIGHT: float = 0.7

var _fill_node: Node3D
var _glass: MeshInstance3D
var fill: float = 0.0


func _init() -> void:
	prompt_key = "interaction.save_prompt"


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Jar"
	var m := MeshMerger.new()
	m.part(DecorKit.cyl(0.55, 0.62, STAND_HEIGHT, 16), DecorKit.mat("teal"), Vector3(0, STAND_HEIGHT * 0.5, 0))
	m.part(DecorKit.cyl(0.62, 0.62, 0.08, 16), DecorKit.mat("gold"), Vector3(0, STAND_HEIGHT, 0))
	m.part(DecorKit.cyl(0.2, 0.24, 0.12, 16), DecorKit.mat("wood_dark"), Vector3(0, STAND_HEIGHT + JAR_HEIGHT + 0.08, 0))
	m.part(DecorKit.torus(0.3, 0.38, 20, 6), DecorKit.mat("gold"), Vector3(0, STAND_HEIGHT + JAR_HEIGHT, 0), Vector3.ZERO, Vector3(1, 0.6, 1))
	# Goal card: a small kite picture on the front of the stand.
	m.part(DecorKit.box(Vector3(0.5, 0.36, 0.04)), DecorKit.mat("cream"), Vector3(0, STAND_HEIGHT * 0.55, 0.6))
	m.part(DecorKit.prism(Vector3(0.22, 0.24, 0.05)), DecorKit.mat("coral"), Vector3(0, STAND_HEIGHT * 0.6, 0.62))
	m.part(DecorKit.prism(Vector3(0.22, 0.1, 0.05)), DecorKit.mat("sky"), Vector3(0, STAND_HEIGHT * 0.6 - 0.17, 0.62), Vector3(0, 0, 180))
	m.commit_to(root, "Stand", true)
	_fill_node = Node3D.new()
	_fill_node.name = "Fill"
	_fill_node.position = Vector3(0, STAND_HEIGHT + 0.04, 0)
	var coins := MeshMerger.new()
	for i in 6:
		coins.part(DecorKit.cyl(JAR_RADIUS - 0.06, JAR_RADIUS - 0.06, 0.12, 18), DecorKit.mat("gold" if i % 2 == 0 else "gold_deep"), Vector3(0.02 * sin(i), 0.06 + i * 0.13, 0.02 * cos(i)))
	coins.commit_to(_fill_node, "Coins", false)
	root.add_child(_fill_node)
	_glass = MeshInstance3D.new()
	_glass.name = "Glass"
	_glass.mesh = DecorKit.cyl(JAR_RADIUS, JAR_RADIUS, JAR_HEIGHT, 24)
	_glass.position = Vector3(0, STAND_HEIGHT + JAR_HEIGHT * 0.5, 0)
	_glass.material_override = DecorKit.veil_mat("sky_light")
	_glass.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(_glass)
	var body := StaticBody3D.new()
	body.name = "Collision"
	body.collision_layer = 1
	body.collision_mask = 0
	DecorKit.add_cyl_collider(body, 0.62, 1.7, DecorKit.xf(Vector3(0, 0.85, 0)))
	root.add_child(body)
	set_fill(0.0)
	return root


## 0..1 — how full the jar looks.
func set_fill(value: float) -> void:
	fill = clampf(value, 0.0, 1.0)
	if _fill_node:
		_fill_node.scale = Vector3(1, maxf(fill, 0.001), 1)
		_fill_node.visible = fill > 0.0


## Coins drop into the jar one by one and the jar fills to `to_fill`.
func drop_coins(count: int, to_fill: float) -> void:
	if Settings.reduced_motion:
		set_fill(to_fill)
		AudioManager.play_sfx("jar")
		return
	var start: float = fill
	for i in count:
		var coin := MeshInstance3D.new()
		coin.mesh = Collectible._coin_mesh()
		coin.position = Vector3(0, STAND_HEIGHT + JAR_HEIGHT + 0.7, 0)
		visual.add_child(coin)
		var tw := create_tween()
		tw.tween_property(coin, "position:y", STAND_HEIGHT + 0.2 + fill * 0.7, 0.45).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
		tw.tween_callback(coin.queue_free)
		AudioManager.play_sfx("coin", 1.0 + i * 0.08, -4.0)
		await tw.finished
		set_fill(lerpf(start, to_fill, float(i + 1) / count))
	AudioManager.play_sfx("jar")
