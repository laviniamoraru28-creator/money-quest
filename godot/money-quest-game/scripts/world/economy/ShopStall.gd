class_name ShopStall
extends WorldInteractable
## ShopStall — a ShopData placed in the world: a market stall (or any
## counter) with its products set out on it, so the child SEES what is for
## sale before they ever open a menu. Walking up shows the usual prompt
## ("Look"); interacting opens the ShopCard (inspect, price, buy or not).
## Until the child has looked once, a soft glint says "something to
## explore here" (WorldInteractable). Optional keeper NPC stands behind the
## counter: talking to them opens the same shop, and they react to what
## happens — a smile for a purchase, a kind word when something costs too
## much, nothing negative ever.
##
## Reusable in any district: ShopStall.make(parent, shop, position, yaw).
## Each product on the counter is its own small node so it can give a
## little hop when bought (none with Reduced Motion).

## Tray positions on DecorProps.market_stall's counter (local).
const SLOTS: Array[Vector3] = [Vector3(-0.7, 1.08, 0.05), Vector3(0.0, 1.08, 0.05), Vector3(0.7, 1.08, 0.05)]

var shop: ShopData
var keeper: NPC = null
## While set, the stall offers only these products (an activity's choices).
var offer_only: Array = []
var _product_nodes: Dictionary = {}   # product_id -> Node3D
var _tween: Tween


static func make(parent: Node3D, p_shop: ShopData, local_pos: Vector3, yaw_deg: float, with_keeper: bool = true) -> ShopStall:
	var s := ShopStall.new()
	s.name = "Shop_" + p_shop.shop_id
	s.shop = p_shop
	var d := InteractionData.new()
	d.interaction_id = "shop_" + p_shop.shop_id
	d.kind = "activity"
	d.radius = 2.2
	d.prompt_height = 2.2
	d.title_key = p_shop.name_key
	d.prompt_key = "interaction.look_prompt"
	d.accent = p_shop.accent
	d.remember = true
	s.data = d
	s.monitorable = false
	s.collision_layer = 0
	s.collision_mask = 1
	var shape := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = 2.2
	cyl.height = 2.5
	shape.shape = cyl
	shape.position = Vector3(0, 1.25, 1.0)   # reach is in front of the counter
	s.add_child(shape)
	s.position = local_pos
	s.rotation_degrees.y = yaw_deg
	parent.add_child(s)
	if with_keeper and not p_shop.keeper_npc_id.is_empty():
		s._spawn_keeper(parent)
	return s


func _ready() -> void:
	_build_stall()
	super._ready()
	ProgressManager.item_acquired.connect(_on_item_acquired)


func hint_height() -> float:
	return 2.9


func interact() -> void:
	var card := ShopCard.find(self)
	if card:
		if card.is_open_for(self):
			card.close()
		else:
			card.open(shop, self, offer_only)
	# Looking at the stall counts as discovering it (the glint goes).
	ProgressManager.discover_world(discovery_id())
	_remove_hint.call_deferred()


## The keeper's reaction to what happened at the card: "bought",
## "not_enough", "browse" (opened), "compare_ok". Never negative.
func keeper_react(kind: String) -> void:
	if keeper == null or not is_instance_valid(keeper) or keeper.visual == null:
		return
	match kind:
		"bought":
			keeper.visual.play_reaction("happy")
			AudioManager.say(Localization.t("shop.keeper.thanks"), keeper.get_display_name())
		"not_enough":
			keeper.visual.play_reaction("nod")
			AudioManager.say(Localization.t("shop.keeper.save_up"), keeper.get_display_name())
		"compare_ok":
			keeper.visual.play_reaction("nod")
		"browse":
			keeper.visual.greet()


## A small hop of the bought product on the counter.
func product_hop(product_id: String) -> void:
	var n: Node3D = _product_nodes.get(product_id)
	if n == null or Settings.reduced_motion:
		return
	if _tween:
		_tween.kill()
	var base: Vector3 = n.get_meta("base_pos")
	n.position = base
	_tween = create_tween()
	_tween.tween_property(n, "position:y", base.y + 0.22, 0.16).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_tween.tween_property(n, "position:y", base.y, 0.3).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)


func _build_stall() -> void:
	var m := MeshMerger.new()
	DecorProps.market_stall(m, Transform3D.IDENTITY, shop.accent if shop else "coral", [])
	m.origin = Transform3D.IDENTITY
	m.commit_to(self, "Stall", true)
	var body := StaticBody3D.new()
	body.name = "StallCollision"
	body.collision_layer = 1
	body.collision_mask = 0
	add_child(body)
	DecorKit.add_box_collider(body, Vector3(2.3, 1.2, 1.0), DecorKit.xf(Vector3(0, 0.6, 0)))
	if shop == null:
		return
	for i in mini(shop.products.size(), SLOTS.size()):
		var p: ProductData = shop.products[i]
		var pm := MeshMerger.new()
		ItemVisual.model(pm, DecorKit.xf(Vector3.ZERO, Vector3(0, -15 + i * 15, 0), Vector3.ONE * 1.4), p.visual, p.color)
		# The price as countable coins in front of the product (rows of five;
		# the number tag sits beside them) — part of the same mesh, one draw.
		pm.origin = Transform3D.IDENTITY
		var shown: int = mini(p.price, 10)
		for c in shown:
			var cx: float = -0.2 + (c % 5) * 0.075
			var cy: float = 0.02 - (c / 5) * 0.075
			pm.part(DecorKit.cyl(0.032, 0.032, 0.012, 12), DecorKit.mat("gold", 0.25), Vector3(cx, cy, 0.4), Vector3(90, 0, 0))
		var node := Node3D.new()
		node.name = "Product_" + p.product_id
		node.position = SLOTS[i]
		node.set_meta("base_pos", SLOTS[i])
		add_child(node)
		# Small things on a counter: no shadow pass needed.
		pm.commit_to(node, "Mesh", false)
		_product_nodes[p.product_id] = node
		# A little price tag in front of each product: a shape + the number.
		var tag := Label3D.new()
		tag.name = "PriceTag"
		tag.text = str(p.price)
		tag.font_size = 44
		tag.pixel_size = 0.006
		tag.outline_size = 10
		tag.modulate = Color("1C2624")
		tag.outline_modulate = Color("FBF8EF")
		tag.position = Vector3(0.22, -0.01, 0.4)
		tag.double_sided = false
		tag.visibility_range_end = 9.0
		node.add_child(tag)


## The keeper stands behind the counter, facing the street.
func _spawn_keeper(parent: Node3D) -> void:
	var scene: PackedScene = load("res://scenes/characters/NPC.tscn")
	keeper = scene.instantiate() as NPC
	keeper.npc_id = shop.keeper_npc_id
	keeper.name = "Keeper_" + shop.shop_id
	keeper.behaviour_profile = "shopkeeper"
	parent.add_child(keeper)
	keeper.global_transform = global_transform * Transform3D(Basis.IDENTITY, Vector3(0, 0, -1.0))
	keeper.talked_to.connect(func(_id: String) -> void: interact())


func _on_item_acquired(item_id: String, _count: int) -> void:
	if shop == null:
		return
	for p in shop.products:
		if p.item_id() == item_id:
			product_hop(p.product_id)


## Where a product sits in the world (for coins / items flying to and from it).
func product_world_position(product_id: String) -> Vector3:
	var n: Node3D = _product_nodes.get(product_id)
	return n.global_position + Vector3(0, 0.15, 0) if n else global_position + Vector3(0, 1.2, 0)
