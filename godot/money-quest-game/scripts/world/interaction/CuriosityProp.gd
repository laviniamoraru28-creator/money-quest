class_name CuriosityProp
extends WorldInteractable
## CuriosityProp — a small "there's something interesting here" detail in
## the world: a savings jar, a coin tower, a market basket, the scales, a
## tiny vault door... Optional, never part of a mission. It is a
## WorldInteractable (same prompt pill, same InteractionCard with its
## Listen button, same first-time glint and discovery memory) that also
## owns its own little prop mesh, so it can REACT when the child interacts:
##
##   "wobble" — tips a little and settles (coin towers, baskets)
##   "bounce" — hops up once (jars, boxes)
##   "spin"   — turns once (a globe, a sign)
##   "tip"    — the scales dip one way and back
##
## plus a soft sound. With Reduced Motion the prop stays still (the card,
## the text and the sound still say what happened). Built from a
## DecorProps builder name so any zone can place one in a line of code
## (see make()).

@export var prop_kind: String = ""
@export var reaction_kind: String = "wobble"
@export var sound: String = "hint"

var prop: Node3D
var reacting: bool = false
var _tween: Tween


## A curiosity at `local_pos` under `parent`: its prop (a DecorProps
## builder: "savings_jar", "basket", "scales", "crate_stack", "coin_stack",
## "tiny_vault"), a short card (title + one or two lines), its reaction and
## an interaction radius. `kind` is "info", or "secret" for an easter egg.
static func make(parent: Node3D, id: String, kind_of_prop: String, local_pos: Vector3, yaw_deg: float, title_key: String, text_key: String, react: String = "wobble", radius: float = 1.6, kind: String = "info") -> CuriosityProp:
	var c := CuriosityProp.new()
	c.name = "Curiosity_" + id
	c.prop_kind = kind_of_prop
	c.reaction_kind = react
	var d := InteractionData.new()
	d.interaction_id = id
	d.kind = kind
	d.radius = radius
	d.prompt_height = 1.6
	d.title_key = title_key
	d.text_key = text_key
	d.prompt_key = "interaction.look_prompt"
	d.remember = true
	c.data = d
	c.monitorable = false
	c.collision_layer = 0
	c.collision_mask = 1
	var shape := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = radius
	cyl.height = 2.5
	shape.shape = cyl
	shape.position.y = 1.25
	c.add_child(shape)
	c.position = local_pos
	c.rotation_degrees.y = yaw_deg
	parent.add_child(c)
	return c


func _ready() -> void:
	_build_prop()
	super._ready()


func hint_height() -> float:
	return 1.7


func interact() -> void:
	_react()
	super.interact()


func _build_prop() -> void:
	var m := MeshMerger.new()
	var I := Transform3D.IDENTITY
	match prop_kind:
		"savings_jar":
			DecorProps.savings_jar(m, I, 0.6)
		"basket":
			DecorProps.basket(m, I, ["coral", "gold", "leaf_light"])
		"scales":
			DecorProps.scales(m, I)
		"crate_stack":
			DecorProps.crate_stack(m, I, ["coral", "gold"])
		"coin_stack":
			for j in 6:
				m.part(DecorKit.cyl(0.32, 0.32, 0.12, 16), DecorKit.mat("gold" if j % 2 == 0 else "gold_deep"), Vector3(0.03 * sin(j * 1.7), 0.06 + j * 0.125, 0.03 * cos(j * 2.1)))
		"tiny_vault":
			# The smallest savings vault in the world: a little round door with
			# a wheel, set in a stone block — and one coin peeking out.
			m.part(DecorKit.box(Vector3(0.6, 0.6, 0.4)), DecorKit.mat("stone"), Vector3(0, 0.3, 0))
			m.part(DecorKit.cyl(0.2, 0.2, 0.05, 20), DecorKit.mat("gold_deep"), Vector3(0, 0.32, 0.2), Vector3(90, 0, 0))
			m.part(DecorKit.cyl(0.16, 0.16, 0.05, 20), DecorKit.mat("gold"), Vector3(0, 0.32, 0.22), Vector3(90, 0, 0))
			for a in [0.0, 60.0, 120.0]:
				m.part(DecorKit.box(Vector3(0.22, 0.025, 0.02)), DecorKit.mat("teal_dark"), Vector3(0, 0.32, 0.25), Vector3(0, 0, a))
			m.part(DecorKit.cyl(0.06, 0.06, 0.015, 12), DecorKit.mat("gold", 0.3), Vector3(0.24, 0.02, 0.26))
		_:
			return
	prop = Node3D.new()
	prop.name = "Prop"
	add_child(prop)
	m.commit_to(prop, "Mesh", true)
	# Solid like any prop (world collision only), so the child walks around it.
	var body := StaticBody3D.new()
	body.name = "PropCollision"
	body.collision_layer = 1
	body.collision_mask = 0
	add_child(body)
	var r: float = {"basket": 0.32, "scales": 0.45, "crate_stack": 0.75, "tiny_vault": 0.42}.get(prop_kind, 0.38)
	DecorKit.add_cyl_collider(body, r, 1.2, DecorKit.xf(Vector3(0, 0.6, 0)))


func _react() -> void:
	if sound != "":
		AudioManager.play_sfx(sound, 1.0, -4.0)
	if prop == null or Settings.reduced_motion:
		return
	if _tween:
		_tween.kill()
	reacting = true
	prop.transform = Transform3D.IDENTITY
	_tween = create_tween()
	match reaction_kind:
		"bounce":
			_tween.tween_property(prop, "position:y", 0.25, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
			_tween.tween_property(prop, "position:y", 0.0, 0.32).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
		"spin":
			_tween.tween_property(prop, "rotation:y", TAU, 1.1).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		"tip":
			_tween.tween_property(prop, "rotation:z", 0.18, 0.3).set_trans(Tween.TRANS_SINE)
			_tween.tween_property(prop, "rotation:z", -0.1, 0.4).set_trans(Tween.TRANS_SINE)
			_tween.tween_property(prop, "rotation:z", 0.0, 0.4).set_trans(Tween.TRANS_SINE)
		_:   # wobble
			_tween.tween_property(prop, "rotation:z", 0.12, 0.15).set_trans(Tween.TRANS_SINE)
			_tween.tween_property(prop, "rotation:z", -0.08, 0.2).set_trans(Tween.TRANS_SINE)
			_tween.tween_property(prop, "rotation:z", 0.04, 0.2).set_trans(Tween.TRANS_SINE)
			_tween.tween_property(prop, "rotation:z", 0.0, 0.2).set_trans(Tween.TRANS_SINE)
	_tween.finished.connect(func() -> void:
		reacting = false
		prop.transform = Transform3D.IDENTITY)
