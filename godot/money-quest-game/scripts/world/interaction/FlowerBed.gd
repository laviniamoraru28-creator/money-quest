class_name FlowerBed
extends ActivityStation
## FlowerBed — "use what you have to improve a place" (Money is a tool).
## A bare bed of soil with a few dry twigs and a seed box. Using it asks
## "What will you do?" with the one choice that makes sense here: buy
## seeds (coins, shown as pips against the child's own) to plant them.
## Then the bed visibly changes — flowers grow (instantly with Reduced
## Motion), people nearby celebrate, and it stays changed for good (saved).
## Before / after is the lesson: nothing is explained in words.
##
## Not a donation: the child buys seeds and plants them; the place (and
## everyone who walks by) gets better. Not enough coins: the hollow coins
## show the gap and nothing happens. Nothing has to be chosen ("Later").

const COST: int = 2

signal improved

@export var discovery_id: String = "flowerbed"

var _bare: Node3D
var _flowers: Node3D


func _init() -> void:
	prompt_key = "interaction.improve_prompt"
	reach = 2.2


func is_improved() -> bool:
	return ProgressManager.has_discovered_world(discovery_id)


func _ready() -> void:
	super._ready()
	if is_improved():
		prompt_text_key = "interaction.look_prompt"   # nothing to buy any more: just look


func _build_visual() -> Node3D:
	var root := Node3D.new()
	root.name = "Bed"
	var m := MeshMerger.new()
	# A low stone border and soil.
	for side in [[Vector3(0, 0.15, -0.9), Vector3(2.6, 0.3, 0.2)], [Vector3(0, 0.15, 0.9), Vector3(2.6, 0.3, 0.2)], [Vector3(-1.2, 0.15, 0), Vector3(0.2, 0.3, 1.6)], [Vector3(1.2, 0.15, 0), Vector3(0.2, 0.3, 1.6)]]:
		m.part(DecorKit.box(side[1]), DecorKit.mat("stone"), side[0])
	m.part(DecorKit.box(Vector3(2.2, 0.2, 1.6)), DecorKit.mat("soil"), Vector3(0, 0.1, 0))
	# The seed box on a post (a sprout on its front).
	m.part(DecorKit.box(Vector3(0.08, 0.9, 0.08)), DecorKit.mat("wood_dark"), Vector3(1.55, 0.45, 0.7))
	m.part(DecorKit.box(Vector3(0.46, 0.34, 0.3)), DecorKit.mat("wood"), Vector3(1.55, 1.02, 0.7))
	m.part(DecorKit.box(Vector3(0.05, 0.16, 0.02)), DecorKit.mat("leaf"), Vector3(1.55, 1.04, 0.86))
	m.part(DecorKit.sphere(0.06, 8, 4), DecorKit.mat("leaf"), Vector3(1.5, 1.12, 0.86), Vector3.ZERO, Vector3(1.4, 0.7, 0.4))
	m.commit_to(root, "BedMesh", true)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	root.add_child(body)
	DecorKit.add_box_collider(body, Vector3(2.6, 0.3, 2.0), DecorKit.xf(Vector3(0, 0.15, 0)))
	# Before: dry twigs.
	_bare = Node3D.new()
	_bare.name = "Bare"
	var bm := MeshMerger.new()
	for p in [Vector3(-0.6, 0.3, -0.3), Vector3(0.2, 0.3, 0.35), Vector3(0.7, 0.3, -0.4)]:
		bm.part(DecorKit.box(Vector3(0.03, 0.22, 0.03)), DecorKit.mat("wood_dark"), p, Vector3(0, 0, 20))
		bm.part(DecorKit.box(Vector3(0.03, 0.14, 0.03)), DecorKit.mat("wood_dark"), p + Vector3(0.04, 0.04, 0), Vector3(0, 0, -35))
	bm.commit_to(_bare, "Twigs", false)
	root.add_child(_bare)
	# After: flowers (one merged mesh).
	_flowers = Node3D.new()
	_flowers.name = "Flowers"
	var fm := MeshMerger.new()
	var cols := ["coral", "gold", "blossom", "lilac", "cream"]
	var i: int = 0
	for x in [-0.8, -0.4, 0.0, 0.4, 0.8]:
		for z in [-0.45, 0.0, 0.45]:
			var p := Vector3(x + (0.08 if i % 2 == 0 else -0.06), 0.2, z + (0.05 if i % 3 == 0 else -0.04))
			var h: float = 0.3 + float(i % 3) * 0.08
			fm.part(DecorKit.cyl(0.015, 0.015, h, 5), DecorKit.mat("leaf"), p + Vector3(0, h * 0.5, 0))
			fm.part(DecorKit.sphere(0.075, 8, 5), DecorKit.mat(cols[i % cols.size()]), p + Vector3(0, h + 0.02, 0), Vector3.ZERO, Vector3(1.0, 0.6, 1.0))
			fm.part(DecorKit.sphere(0.06, 6, 4), DecorKit.mat("leaf_light"), p + Vector3(0.05, h * 0.4, 0), Vector3.ZERO, Vector3(1.0, 0.4, 0.6))
			i += 1
	fm.commit_to(_flowers, "Blooms", false)
	root.add_child(_flowers)
	var done: bool = is_improved()
	_bare.visible = not done
	_flowers.visible = done
	return root


func interact() -> void:
	used.emit()
	if is_improved():
		_celebrate_nearby("happy")
		return
	var option := {"purpose": "improve", "id": "seeds", "icons": ["coin", "then", "sprout", "then", "flowers"], "cost": COST, "key": "purpose.plant"}
	var picked: Dictionary = await ResourcePurpose.choose(self, [option], GameState.wallet.balance)
	if picked.is_empty() or not GameState.can_afford(COST):
		return
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	if hud and hud.money_hud:
		hud.money_hud.coins_from_world(global_position + Vector3(0, 0.8, 0))
	if not GameState.spend_coins(COST):
		return
	await bloom()


## The bed changes: twigs go, flowers grow. Saved for good.
func bloom() -> void:
	ProgressManager.discover_world(discovery_id)
	SupportProfile.record_success()
	prompt_text_key = "interaction.look_prompt"
	_bare.visible = false
	_flowers.visible = true
	AudioManager.play_sfx("success", 1.0, -4.0)
	if not Settings.reduced_motion:
		_flowers.scale = Vector3(1, 0.05, 1)
		var tw := create_tween()
		tw.tween_property(_flowers, "scale", Vector3.ONE, 1.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		await tw.finished
	var who: NPC = _celebrate_nearby("celebrate")
	if who:
		AudioManager.say(Localization.t("improve.flowerbed.done"), who.get_display_name())
	improved.emit()


## Everyone close by reacts; returns the nearest of them.
func _celebrate_nearby(kind: String) -> NPC:
	var nearest: NPC = null
	for n in get_tree().get_nodes_in_group("mq_npc"):
		if n is NPC and n.visual and not n.scripted and n.global_position.distance_to(global_position) < 9.0:
			n.visual.play_reaction(kind)
			if nearest == null or n.global_position.distance_to(global_position) < nearest.global_position.distance_to(global_position):
				nearest = n
	return nearest
