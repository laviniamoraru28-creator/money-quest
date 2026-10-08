class_name NeedStand
extends ActivityStation
## NeedStand — "you need money now": something that needs paying for at a
## moment in time, shown as the thing itself plus its price in coins:
##
##   bike   a bicycle with a broken, fallen-off wheel → fixed, wheels spin
##   tools  a leaking pipe with a toolbox → fixed, the drip stops
##
## The price floats above it as coins and a number (prices can rise: the
## activity sets it). Fixing it is the activity's business (`used`).

@export var kind: String = "bike"

var price: int = 0
var fixed: bool = false
var _broken: Node3D
var _whole: Node3D
var _price_label: Label3D
var _price_coin: MeshInstance3D
var _body: StaticBody3D


func _init() -> void:
	prompt_key = "interaction.fix_prompt"
	reach = 2.0


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Need_" + kind
	_whole = Node3D.new()
	_broken = Node3D.new()
	var mw := MeshMerger.new()
	var mb := MeshMerger.new()
	if kind == "bike":
		for side in [-0.55, 0.55]:
			mw.part(DecorKit.torus(0.3, 0.36, 24, 6), DecorKit.mat("ink"), Vector3(side, 0.36, 0), Vector3(90, 0, 0))
		mw.part(DecorKit.box(Vector3(1.1, 0.06, 0.06)), DecorKit.mat("teal"), Vector3(0, 0.62, 0), Vector3(0, 0, 8))
		mw.part(DecorKit.box(Vector3(0.06, 0.55, 0.06)), DecorKit.mat("teal"), Vector3(-0.1, 0.5, 0), Vector3(0, 0, -15))
		mw.part(DecorKit.box(Vector3(0.3, 0.06, 0.12)), DecorKit.mat("ink"), Vector3(-0.15, 0.8, 0))
		mw.part(DecorKit.box(Vector3(0.06, 0.06, 0.4)), DecorKit.mat("ink"), Vector3(0.55, 0.9, 0))
		# Broken: one wheel lies on the ground, the bike leans.
		mb.part(DecorKit.torus(0.3, 0.36, 24, 6), DecorKit.mat("ink"), Vector3(-0.55, 0.36, 0), Vector3(90, 0, 0))
		mb.part(DecorKit.torus(0.3, 0.36, 24, 6), DecorKit.mat("ink"), Vector3(0.95, 0.04, 0.45), Vector3(0, 0, 0))
		mb.part(DecorKit.box(Vector3(1.1, 0.06, 0.06)), DecorKit.mat("teal"), Vector3(0, 0.45, 0), Vector3(0, 0, -12))
		mb.part(DecorKit.box(Vector3(0.06, 0.55, 0.06)), DecorKit.mat("teal"), Vector3(-0.1, 0.4, 0), Vector3(0, 0, -30))
		mb.part(DecorKit.box(Vector3(0.3, 0.06, 0.12)), DecorKit.mat("ink"), Vector3(-0.2, 0.65, 0))
		mb.part(DecorKit.box(Vector3(0.12, 0.12, 0.02)), DecorKit.mat("coral"), Vector3(0.55, 0.2, 0.05), Vector3(0, 0, 45))
	else:
		mw.part(DecorKit.box(Vector3(1.2, 0.12, 0.12)), DecorKit.mat("stone_dark"), Vector3(0, 1.0, 0))
		mw.part(DecorKit.box(Vector3(0.6, 0.35, 0.35)), DecorKit.mat("coral"), Vector3(0.2, 0.18, 0.3))
		mb.part(DecorKit.box(Vector3(1.2, 0.12, 0.12)), DecorKit.mat("stone_dark"), Vector3(0, 1.0, 0))
		mb.part(DecorKit.sphere(0.06, 8, 4), DecorKit.mat("sky"), Vector3(0.1, 0.7, 0), Vector3.ZERO, Vector3(0.7, 1.3, 0.7))
		mb.part(DecorKit.cyl(0.35, 0.35, 0.02, 16), DecorKit.mat("sky"), Vector3(0.1, 0.01, 0))
	_body = StaticBody3D.new()
	_body.collision_layer = 1
	_body.collision_mask = 0
	root.add_child(_body)
	DecorKit.add_box_collider(_body, Vector3(1.6, 1.0, 0.6), DecorKit.xf(Vector3(0, 0.5, 0)))
	mw.commit_to(_whole, "Whole", true)
	mb.commit_to(_broken, "Broken", true)
	root.add_child(_whole)
	root.add_child(_broken)
	_price_coin = MeshInstance3D.new()
	_price_coin.mesh = Collectible._coin_mesh()
	_price_coin.position = Vector3(-0.3, 1.75, 0)
	root.add_child(_price_coin)
	_price_label = Label3D.new()
	_price_label.name = "Price"
	_price_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_price_label.font_size = 96
	_price_label.outline_size = 18
	_price_label.outline_modulate = MoneyIcons.INK
	_price_label.no_depth_test = true
	_price_label.position = Vector3(0.25, 1.75, 0)
	root.add_child(_price_label)
	set_state(false, false)
	return root


## Hidden until its moment comes.
func set_state(present: bool, is_fixed: bool) -> void:
	fixed = is_fixed
	visible = present
	# Fixed: nothing more to do here (no prompt).
	set_deferred("monitorable", present and not is_fixed)
	if _body:
		_body.set_deferred("collision_layer", 1 if present else 0)
	if _whole == null:
		return
	_whole.visible = is_fixed
	_broken.visible = not is_fixed
	_price_label.visible = present and not is_fixed
	_price_coin.visible = present and not is_fixed


func set_price(n: int) -> void:
	price = n
	if _price_label:
		_price_label.text = str(n)


## The fix: the broken thing becomes whole (a little hop, not with RM).
func fix() -> void:
	set_state(true, true)
	AudioManager.play_sfx("success", 1.1, -4.0)
	if Settings.reduced_motion:
		return
	_whole.scale = Vector3.ONE * 0.8
	create_tween().tween_property(_whole, "scale", Vector3.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
