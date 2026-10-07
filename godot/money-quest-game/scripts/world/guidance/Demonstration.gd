class_name Demonstration
extends RefCounted
## Demonstration — characters teach by DOING (Universal Play & Learn): a
## guide walks to a stall, points at a product, hands the keeper a coin,
## receives the product, and smiles — the child sees the whole sequence and
## can copy it, no words needed. Reusable building blocks (await them):
##
##   walk_to(npc, pos)         walks there (legs moving, facing the way)
##   point(npc, pos)           turns and points ("this one")
##   give_coin(from, to)       a coin travels from one hand to another
##   receive(npc, shape, tint, from_pos)  an item travels into the hand
##   react(npc, kind)          happy / nod / both_wave...
##   buy(npc, stall, product)  the whole purchase, as above
##
## The NPC needs an animated body (NPC.animated_body) to walk; any NPC can
## point, give and receive. During a demonstration NPC.scripted is on, so it
## does not wander off to greet anyone. Reduced Motion: every step still
## happens (the coin and the item still change hands — the meaning is
## kept), just instantly and without travel animation.

const WALK_SPEED: float = 1.8


static func walk_to(npc: NPC, pos: Vector3, speed: float = WALK_SPEED) -> void:
	if npc == null or not is_instance_valid(npc):
		return
	npc.scripted = true
	var to: Vector3 = Vector3(pos.x, npc.global_position.y, pos.z)
	var d: Vector3 = to - npc.global_position
	if d.length() < 0.05:
		return
	npc.visual.global_rotation.y = atan2(d.x, d.z)
	if Settings.reduced_motion:
		npc.global_position = to
		return
	npc.visual.walk_override = speed
	var tw := npc.create_tween()
	tw.tween_property(npc, "global_position", to, d.length() / speed)
	await tw.finished
	if is_instance_valid(npc):
		npc.visual.walk_override = 0.0


static func point(npc: NPC, pos: Vector3, seconds: float = 2.0) -> void:
	if npc == null or not is_instance_valid(npc):
		return
	npc.visual.point_at(pos, seconds)
	await npc.get_tree().create_timer(0.3 if Settings.reduced_motion else seconds).timeout


## A coin travels from one character's hand to another's.
static func give_coin(from: NPC, to: Node3D) -> void:
	if from == null or not is_instance_valid(from) or to == null:
		return
	var coin := _coin()
	from.get_parent().add_child(coin)
	var start: Vector3 = _hand(from)
	var end: Vector3 = (_hand(to as NPC) if to is NPC else to.global_position + Vector3(0, 1.2, 0))
	coin.global_position = start
	if not Settings.reduced_motion:
		var tw := coin.create_tween()
		tw.tween_property(coin, "global_position", (start + end) * 0.5 + Vector3(0, 0.5, 0), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(coin, "global_position", end, 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		await tw.finished
	AudioManager.play_sfx("coin", 1.0, -8.0)
	coin.queue_free()


## An item travels from `from_pos` into the character's hand and stays held.
static func receive(npc: NPC, shape: String, tint: Color, from_pos: Vector3) -> void:
	if npc == null or not is_instance_valid(npc):
		return
	var item := Node3D.new()
	var m := MeshMerger.new()
	ItemVisual.model(m, Transform3D.IDENTITY, shape, tint)
	m.origin = Transform3D.IDENTITY
	m.commit_to(item, "Mesh", false)
	npc.get_parent().add_child(item)
	item.global_position = from_pos
	if not Settings.reduced_motion:
		var tw := item.create_tween()
		tw.tween_property(item, "global_position", _hand(npc), 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
		await tw.finished
	if not is_instance_valid(npc):
		item.queue_free()
		return
	item.get_parent().remove_child(item)
	npc.visual.hold(item)


static func react(npc: NPC, kind: String, seconds: float = 1.4) -> void:
	if npc == null or not is_instance_valid(npc):
		return
	npc.visual.play_reaction(kind)
	await npc.get_tree().create_timer(0.2 if Settings.reduced_motion else seconds).timeout


## The whole purchase, shown by `npc` at `stall`: walk up, point at the
## product, pay the keeper a coin, receive the product, smile.
static func buy(npc: NPC, stall: ShopStall, product_id: String) -> void:
	if npc == null or stall == null:
		return
	var front: Vector3 = stall.global_position + stall.global_transform.basis.z * 1.3 + stall.global_transform.basis.x * 0.9
	await walk_to(npc, front)
	var pos: Vector3 = stall.product_world_position(product_id)
	await point(npc, pos, 1.6)
	await give_coin(npc, stall.keeper if stall.keeper else stall)
	if stall.keeper:
		stall.keeper.visual.play_reaction("happy")
	var p: ProductData = stall.shop.product(product_id)
	if p:
		await receive(npc, p.visual, p.color, pos)
	await react(npc, "happy")


## Hand position in the world (right hand), with a fallback.
static func _hand(npc: NPC) -> Vector3:
	if npc and is_instance_valid(npc) and npc.visual and npc.visual.arm_r:
		return npc.visual.arm_r.global_transform * Vector3(0, -0.5, 0.06)
	return (npc.global_position if npc else Vector3.ZERO) + Vector3(0, 1.0, 0)


static func _coin() -> MeshInstance3D:
	var c := MeshInstance3D.new()
	c.mesh = DecorKit.cyl(0.09, 0.09, 0.025, 16)
	c.material_override = DecorKit.mat("gold", 0.4)
	c.rotation_degrees = Vector3(90, 0, 0)
	c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return c
