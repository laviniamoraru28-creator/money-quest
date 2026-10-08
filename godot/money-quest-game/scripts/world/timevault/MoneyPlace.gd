class_name MoneyPlace
extends ActivityStation
## MoneyPlace — a place to keep money, recognisable by shape alone:
##
##   piggy  a big pink piggy bank on a little table   (at home, no growth)
##   bank   a small stone bank with columns and a slot (grows a little)
##   vault  a heavy round-door vault with a padlock    (grows more, locked)
##
## Shows how much is inside as a stack of coins AND a number floating above
## (numbers are part of the lesson; no words), with a small rule badge
## beside the number (stays the same / grows a little / grows more) — the
## place's MoneyLife product rule (ProductRules). The vault's padlock shows
## that its rule locks the money once time starts; it opens with a click
## when time is up. No product names or real-world labels here: real
## products (e.g. a UK Junior ISA) are only an optional example in MORE.
##
## What using it does is the activity's business (TimeVaultFlow listens to
## `used`); this only shows state.

const MAX_STACK: int = 30

@export var kind: String = "piggy"

var value: float = 0.0
var locked: bool = false
var _stack: MultiMeshInstance3D
var _number: Label3D
var _lock: Node3D
var _badge: Node3D
var _body: StaticBody3D
## The product rule this place follows (ProductRules id).
var rule: String = ""


func _init() -> void:
	prompt_key = "interaction.put_prompt"
	reach = 2.0


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Place_" + kind
	var m := MeshMerger.new()
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	match kind:
		"piggy":
			m.part(DecorKit.cyl(0.55, 0.6, 0.7, 14), DecorKit.mat("wood"), Vector3(0, 0.35, 0))
			m.part(DecorKit.sphere(0.5, 18, 10), DecorKit.mat("coral"), Vector3(0, 1.15, 0), Vector3.ZERO, Vector3(1.2, 0.9, 0.9))
			m.part(DecorKit.cyl(0.16, 0.18, 0.18, 12), DecorKit.mat("coral"), Vector3(0.62, 1.15, 0), Vector3(0, 0, 90))
			m.part(DecorKit.sphere(0.04, 6, 4), DecorKit.mat("ink"), Vector3(0.72, 1.18, 0.06))
			m.part(DecorKit.sphere(0.04, 6, 4), DecorKit.mat("ink"), Vector3(0.72, 1.18, -0.06))
			m.part(DecorKit.prism(Vector3(0.18, 0.18, 0.06)), DecorKit.mat("coral"), Vector3(0.3, 1.58, 0.2))
			m.part(DecorKit.prism(Vector3(0.18, 0.18, 0.06)), DecorKit.mat("coral"), Vector3(0.3, 1.58, -0.2))
			m.part(DecorKit.box(Vector3(0.3, 0.03, 0.06)), DecorKit.mat("ink"), Vector3(-0.05, 1.6, 0))
			m.part(DecorKit.sphere(0.06, 6, 4), DecorKit.mat("ink"), Vector3(0.48, 1.3, 0.22))
			DecorKit.add_box_collider(body, Vector3(1.3, 1.6, 1.2), DecorKit.xf(Vector3(0, 0.8, 0)))
		"bank":
			m.part(DecorKit.box(Vector3(1.6, 0.2, 1.2)), DecorKit.mat("stone"), Vector3(0, 0.1, 0))
			for x in [-0.55, -0.18, 0.18, 0.55]:
				m.part(DecorKit.cyl(0.09, 0.09, 1.2, 10), DecorKit.mat("cream"), Vector3(x, 0.8, 0.4))
			m.part(DecorKit.box(Vector3(1.5, 1.2, 0.7)), DecorKit.mat("stone"), Vector3(0, 0.8, -0.1))
			m.part(DecorKit.prism(Vector3(1.8, 0.5, 1.2)), DecorKit.mat("stone_dark"), Vector3(0, 1.65, 0))
			m.part(DecorKit.box(Vector3(0.4, 0.06, 0.04)), DecorKit.mat("ink"), Vector3(0, 1.1, 0.27))
			m.part(DecorKit.cyl(0.14, 0.14, 0.04, 16), DecorKit.mat("gold", 0.4), Vector3(0, 1.62, 0.6), Vector3(90, 0, 0))
			DecorKit.add_box_collider(body, Vector3(1.6, 1.9, 1.2), DecorKit.xf(Vector3(0, 0.95, 0)))
		_:
			m.part(DecorKit.box(Vector3(1.6, 1.9, 1.1)), DecorKit.mat("stone_dark"), Vector3(0, 0.95, 0))
			m.part(DecorKit.cyl(0.62, 0.62, 0.14, 24), DecorKit.mat("gold"), Vector3(0, 1.0, 0.58), Vector3(90, 0, 0))
			m.part(DecorKit.cyl(0.5, 0.5, 0.16, 24), DecorKit.mat("gold_deep"), Vector3(0, 1.0, 0.6), Vector3(90, 0, 0))
			for a in [0.0, 60.0, 120.0]:
				m.part(DecorKit.box(Vector3(0.8, 0.07, 0.05)), DecorKit.mat("ink"), Vector3(0, 1.0, 0.7), Vector3(0, 0, a))
			m.part(DecorKit.cyl(0.1, 0.1, 0.12, 12), DecorKit.mat("ink"), Vector3(0, 1.0, 0.72), Vector3(90, 0, 0))
			DecorKit.add_box_collider(body, Vector3(1.6, 1.9, 1.2), DecorKit.xf(Vector3(0, 0.95, 0)))
	m.commit_to(root, "PlaceMesh", true)
	root.add_child(body)
	_body = body
	# The coins inside, as a stack in front.
	_stack = MultiMeshInstance3D.new()
	_stack.name = "CoinStack"
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = Collectible._coin_mesh()
	mm.instance_count = MAX_STACK
	mm.visible_instance_count = 0
	for i in MAX_STACK:
		var col: int = i / 10
		var t := Transform3D(Basis(Vector3.RIGHT, PI * 0.5).scaled(Vector3.ONE * 0.55), Vector3(-0.25 + col * 0.25, 0.06 + (i % 10) * 0.075, 1.05))
		mm.set_instance_transform(i, t)
	_stack.multimesh = mm
	_stack.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(_stack)
	# How many, as a number.
	_number = Label3D.new()
	_number.name = "Amount"
	_number.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_number.font_size = 96
	_number.outline_size = 18
	_number.modulate = Color.WHITE
	_number.outline_modulate = MoneyIcons.INK
	_number.position = Vector3(0, 2.55, 0)
	_number.no_depth_test = true
	root.add_child(_number)
	# The vault's padlock (and its sign / shield where a real product exists).
	if kind == "vault":
		_lock = Node3D.new()
		_lock.name = "Padlock"
		var lm := MeshMerger.new()
		lm.part(DecorKit.box(Vector3(0.5, 0.42, 0.14)), DecorKit.mat("gold", 0.3), Vector3(0, 0, 0))
		lm.part(DecorKit.torus(0.13, 0.19, 16, 6), DecorKit.mat("stone_dark"), Vector3(0, 0.26, 0), Vector3(90, 0, 0), Vector3(1, 1, 1.4))
		lm.part(DecorKit.sphere(0.05, 8, 4), DecorKit.mat("ink"), Vector3(0, -0.02, 0.08))
		lm.commit_to(_lock, "LockMesh", false)
		_lock.position = Vector3(0, 1.0, 0.85)
		root.add_child(_lock)
	# The rule badge (set_rule): how this place's product treats money.
	_badge = Node3D.new()
	_badge.name = "RuleBadge"
	_badge.position = Vector3(0.85, 2.55, 0.3)
	_badge.scale = Vector3.ONE * 1.6   # readable from the play camera
	root.add_child(_badge)
	set_value(0.0)
	return root


## Shows the place's product rule as a picture beside its number, so a
## child sees that growth comes from the RULE of the place: a flat bar =
## stays the same, one green chevron = grows a little, two = grows more,
## up-and-down = may rise or fall (ProductRules.badge).
func set_rule(product: String) -> void:
	rule = product
	if _badge == null:
		return
	for c in _badge.get_children():
		c.queue_free()
	var m := MeshMerger.new()
	var b: int = ProductRules.badge(product)
	match b:
		0:
			m.part(DecorKit.box(Vector3(0.36, 0.08, 0.06)), DecorKit.mat("stone_dark"), Vector3.ZERO)
		-1:
			m.part(DecorKit.prism(Vector3(0.24, 0.16, 0.06)), DecorKit.mat("leaf"), Vector3(0, 0.12, 0))
			m.part(DecorKit.prism(Vector3(0.24, 0.16, 0.06)), DecorKit.mat("coral"), Vector3(0, -0.12, 0), Vector3(0, 0, 180))
		_:
			for i in b:
				m.part(DecorKit.prism(Vector3(0.3, 0.18, 0.06)), DecorKit.mat("leaf"), Vector3(0, i * 0.2, 0))
	m.commit_to(_badge, "Badge", false)
	for c in _badge.get_children():
		if c is GeometryInstance3D:
			(c as GeometryInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


## Shows `v` coins (rounded) — stack and number.
func set_value(v: float) -> void:
	value = maxf(v, 0.0)
	var n: int = int(round(value))
	if _stack:
		_stack.multimesh.visible_instance_count = mini(n, MAX_STACK)
	if _number:
		_number.text = str(n)


func shown() -> int:
	return int(round(value))


func set_locked(on: bool, animate: bool = false) -> void:
	locked = on
	if _lock == null:
		return
	if on:
		_lock.visible = true
		_lock.rotation = Vector3.ZERO
		_lock.position.y = 1.0
		return
	if not animate or Settings.reduced_motion:
		_lock.visible = false
		return
	AudioManager.play_sfx("ui_click", 0.8, -2.0)
	var tw := create_tween()
	tw.tween_property(_lock, "rotation:z", 0.6, 0.2)
	tw.tween_property(_lock, "position:y", 0.2, 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.tween_callback(func() -> void: _lock.visible = false)


## "It won't open": the padlock shakes (still with Reduced Motion).
func refuse() -> void:
	AudioManager.play_sfx("retry", 0.9, -6.0)
	if _lock == null or Settings.reduced_motion:
		return
	var x: float = _lock.position.x
	var tw := create_tween()
	for d in [0.06, -0.06, 0.04, 0.0]:
		tw.tween_property(_lock, "position:x", x + d, 0.05)


## A little hop of the number when the value changes (not with RM).
func pulse() -> void:
	if Settings.reduced_motion or _number == null:
		return
	var tw := create_tween()
	tw.tween_property(_number, "scale", Vector3.ONE * 1.35, 0.1)
	tw.tween_property(_number, "scale", Vector3.ONE, 0.15)


func set_verb(key: String) -> void:
	prompt_text_key = key


## In this stage or not: hidden places neither show, collide nor prompt.
func set_present(on: bool) -> void:
	visible = on
	set_deferred("monitorable", on)
	if _body:
		_body.set_deferred("collision_layer", 1 if on else 0)
