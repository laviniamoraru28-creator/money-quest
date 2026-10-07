extends Node3D
## MarketTownFlow — Market Town as the first playable shopping place. It
## places the gameplay (the dressing places the scenery around it):
##
## - three stalls (ShopStall + ShopData from data/shops/): fruit & bread,
##   toys, paper & pencils — each with its keeper behind the counter;
## - "Help unpack the crates" — a small job that pays a few virtual coins
##   once (receiving money: effort → coins);
## - the "Need or want?" board — an optional SortPanel activity using the
##   market's own products;
## - a customer saving up for the kite (an NPC moment, not a lesson);
## - two hidden discoveries: a dropped coin, and a very old price tag.
##
## The mission is a gentle suggestion, never a corridor (ObjectiveManager):
##   Explore the market → Buy something you can afford
## (or first "Help at the market to earn some coins" when the child has too
## little for anything), with "Also try: compare the notebooks / sort needs
## and wants / help unpack" alongside. Every piece is optional; walking
## around and doing none of it is fine. Progress lives in ProgressManager,
## so the right mission is rebuilt after a reload.

const SHOPS: Array = [
	["res://data/shops/market_fruit.tres", Vector3(8.6, 0, -1.0), -90.0],
	["res://data/shops/market_toys.tres", Vector3(8.6, 0, -6.6), -90.0],
	["res://data/shops/market_paper.tres", Vector3(-8.6, 0, 2.6), 90.0],
]
const EXPLORE_XP: int = 5
const BUY_XP: int = 15
const SORT_XP: int = 10
const SORT_ACTIVITY: String = "mt-needs-wants"
const JOB_ID: String = "market_crates"
## Universal Play & Learn: the first visit is a wordless, environmental
## "first purchase" (data/activities/first_purchase.tres): coins to pick
## up, a guide who shows how to buy, then the child's own choice.
const FIRST_PURCHASE: PlayActivityData = preload("res://data/activities/first_purchase.tres")
const TUTORIAL_COINS: Array[Vector3] = [Vector3(0.4, 0, 1.4), Vector3(2.2, 0, 1.8), Vector3(4.0, 0, 2.4)]
const TUTORIAL_COIN_ACTIVITY: String = "mt-first-coins"
## Visual missions: every Market Town objective as pictures (VisualMissions),
## so the next goal is clear without reading.
const MISSION_ICONS: Dictionary = {
	"mt.coins": ["you", "then", "coins"],
	"mt.follow": ["you", "then", "npc:market_guide", "then", "stall"],
	"mt.choose": ["you", "choose", "then", "pay", "then", "bag"],
	"mt.explore": ["you", "then", "eye", "stall"],
	"mt.earn": ["you", "then", "crate", "then", "coin"],
	"mt.buy": ["you", "then", "stall", "then", "bag"],
	"mt.visit": ["you", "then", "door"],
}
## Who the market's people are, and what they remember (NpcVoice): one
## hello each, a word after you buy from them, a comment on what you
## own — and otherwise just a wave or a nod, never the same line again.
const VOICES: Dictionary = {
	"market_guide": {"gesture": "both_wave", "back": "voice.lina.back", "sees": {"product:kite": "voice.lina.sees_kite"}},
	"fruit_seller": {"gesture": "nod", "shop": "market_fruit", "first": "voice.rosa.first", "after_buy": "voice.rosa.after_buy", "back": "voice.rosa.back"},
	"toy_seller": {"gesture": "happy", "shop": "market_toys", "first": "voice.sam.first", "after_buy": "voice.sam.after_buy", "sees": {"product:ball": "voice.sam.sees_ball"}},
	"paper_seller": {"gesture": "nod", "shop": "market_paper", "first": "voice.iris.first", "after_buy": "voice.iris.after_buy"},
	"market_shopper": {"gesture": "both_wave", "first": "voice.noah.first", "sees": {"product:kite": "voice.noah.sees_kite"}, "talk": {"product:kite": "voice.noah.talk_kite"}},
	"baker": {"gesture": "nod", "first": "voice.baker.first"},
	"leah": {"gesture": "wave", "first": "voice.leah.first"},
	"jordan": {"gesture": "happy", "first": "voice.jordan.first"},
}
## Money is a tool (ResourcePurpose, presented by the world, never as a
## menu): a savings jar by Noah — coins put in really leave the wallet and
## can come back out — with the kite as its goal, and a bare flower bed to
## make better. The child discovers them by exploring; Lina points them out
## once after the first purchase.
const JAR_POSITION: Vector3 = Vector3(3.2, 0, -10.2)
const BED_POSITION: Vector3 = Vector3(-4.2, 0, 0.2)
const SAVINGS_STATE: String = "savings"
const JAR_KEY: String = "market_jar"
const SAVE_GOAL: int = 8   # the kite
const KITE_ICON: String = "item:kite:7A68B8"
const INTRO_STATE: String = "intro"
const ZONE_ID: String = "market-town"

var stalls: Array[ShopStall] = []
var board: ActivityStation
var job: CuriosityProp
var customer: NPC
var guide: NPC
var tutorial_coins: Array = []
var activity: PlayActivity
var guidance: GuidanceSystem
var jar: SavingsJar
var bed: FlowerBed
var _busy: bool = false


func _ready() -> void:
	NpcVoice.register(VOICES)
	# Gameplay nodes live under this node (at the zone origin): the zone root
	# is still setting up its children while this runs, and the dressing
	# (next in the scene) sees them and keeps its scenery clear of them.
	var root: Node3D = self
	for s in SHOPS:
		var shop: ShopData = load(s[0])
		stalls.append(ShopStall.make(root, shop, s[1], s[2]))
	# A job: help unpack the crates by the fruit stall (once) → coins.
	job = CuriosityProp.make(root, JOB_ID, "crate_stack", Vector3(8.4, 0, 3.4), -90.0, "curio.market_crates.title", "curio.market_crates.text", "bounce", 1.8, "activity")
	job.with_reward(3, 5, "curio.market_crates.reward")
	job.data.prompt_key = "interaction.help_prompt"
	job.prompt_text_key = "interaction.help_prompt"
	# Hidden discoveries (no glint: finding them is the fun).
	CuriosityProp.make(root, "market_lost_coin", "hidden_coin", Vector3(-2.4, 0, 10.6), 0.0, "curio.market_lost_coin.title", "curio.market_lost_coin.text", "bounce", 1.6, "secret").with_reward(1, 0, "curio.market_lost_coin.reward")
	CuriosityProp.make(root, "market_old_tag", "price_tag", Vector3(9.4, 0, -10.6), 200.0, "curio.market_old_tag.title", "curio.market_old_tag.text", "spin", 1.4, "secret").with_reward(0, 10, "curio.market_old_tag.reward")
	# The "Need or want?" board.
	board = BoardStation.new()
	board.name = "NeedsWantsBoard"
	board.prompt_key = "interaction.try_prompt"
	board.position = Vector3(-4.6, 0, -10.0)
	root.add_child(board)
	board.used.connect(_on_board_used)
	# A customer who is saving up (an NPC moment).
	customer = load("res://scenes/characters/NPC.tscn").instantiate()
	customer.npc_id = "market_shopper"
	customer.behaviour_profile = "child"
	var g := InteractionData.new()
	g.interaction_id = "market_shopper"
	g.title_key = "npc.market_shopper.name"
	g.text_key = "npc.market_shopper.line"
	g.accent = "sky"
	g.remember = false
	customer.greeting = g
	root.add_child(customer)
	customer.position = Vector3(5.6, 0, -8.8)
	customer.rotation_degrees.y = 60.0
	# The savings jar (Noah is saving for the kite too) and the flower bed.
	jar = SavingsJar.new()
	jar.name = "MarketJar"
	jar.position = JAR_POSITION
	root.add_child(jar)
	jar.set_fill(float(saved()) / SAVE_GOAL)
	jar.used.connect(_on_jar_used)
	bed = FlowerBed.new()
	bed.name = "FlowerBed"
	bed.discovery_id = "mt:flowerbed"
	bed.position = BED_POSITION
	root.add_child(bed)
	bed.improved.connect(refresh)
	# The first-visit guide (can walk, to demonstrate) and the coins to find.
	guide = load("res://scenes/characters/NPC.tscn").instantiate()
	guide.npc_id = "market_guide"
	guide.animated_body = true
	guide.behaviour_profile = "guide"
	root.add_child(guide)
	guide.position = Vector3(5.8, 0, 1.6)
	guide.visual.rotation_degrees.y = -120.0
	for i in TUTORIAL_COINS.size():
		var c := Collectible.new()
		c.name = "TutorialCoin_%d" % i
		c.activity_id = TUTORIAL_COIN_ACTIVITY
		c.collectible_id = "c%d" % i
		c.position = TUTORIAL_COINS[i]
		root.add_child(c)
		c.collected.connect(_on_tutorial_coin.bind(c))
		tutorial_coins.append(c)
	guidance = GuidanceSystem.new()
	guidance.level = 1   # beacons do the pointing; the trail comes only when needed
	add_child(guidance)
	# React to what the child does anywhere in the market.
	ProgressManager.item_acquired.connect(func(_id: String, _n: int) -> void: _on_progress())
	ProgressManager.activity_changed.connect(func(_id: String) -> void: _on_progress())
	GameState.coins_changed.connect(func(_b: int) -> void: refresh())
	VisualMissions.register(MISSION_ICONS)
	ObjectiveManager.intro_available = true
	ObjectiveManager.intro_requested.connect(play_intro)
	_first_intro.call_deferred()
	refresh.call_deferred()
	_start_first_purchase.call_deferred()


## Explored = the child has looked at any stall.
func explored() -> bool:
	for s in stalls:
		if ProgressManager.get_activity_state("shop:" + s.shop.shop_id, "visited", false):
			return true
	return false


func step() -> String:
	if not explored():
		return "explore"
	if not Shop.has_bought_anything():
		if GameState.wallet.balance < _cheapest() and not ProgressManager.has_discovered_world("hub:" + JOB_ID):
			return "earn"
		return "buy"
	return "done"


func refresh() -> void:
	if not is_inside_tree() or _busy or (activity and activity.running):
		return
	match step():
		"explore":
			ObjectiveManager.set_objective("mt.explore", "objective.mt.explore", {}, _nearest_stall())
		"earn":
			ObjectiveManager.set_objective("mt.earn", "objective.mt.earn", {}, job)
		"buy":
			ObjectiveManager.set_objective("mt.buy", "objective.mt.buy", {}, _nearest_stall())
		_:
			_set_free_goal()
	var extras: Array = []
	if not ProgressManager.is_activity_completed("compare:market_paper"):
		extras.append({"text_key": "objective.mt.compare", "params": {}})
	if not ProgressManager.is_activity_completed(SORT_ACTIVITY):
		extras.append({"text_key": "objective.mt.sort", "params": {}})
	if not ProgressManager.has_discovered_world("hub:" + JOB_ID):
		extras.append({"text_key": "objective.mt.help", "params": {}})
	if saved() == 0:
		extras.append({"text_key": "objective.mt.jar", "params": {}})
	if not bed.is_improved():
		extras.append({"text_key": "objective.mt.flowers", "params": {}})
	ObjectiveManager.set_optional(extras)


## Finishing a step: the shared "Done!" moment (ObjectiveManager) and a
## little XP, once each.
func _on_progress() -> void:
	var id: String = ObjectiveManager.objective_id
	if id == "mt.explore" and explored():
		_finish("mt.explore", EXPLORE_XP)
	elif id == "mt.buy" and Shop.has_bought_anything():
		_finish("mt.buy", BUY_XP)
	elif id == "mt.earn" and ProgressManager.has_discovered_world("hub:" + JOB_ID):
		_finish("mt.earn", 0)
	refresh()


func _finish(objective: String, xp: int) -> void:
	var activity: String = "obj:" + objective
	if ProgressManager.is_activity_completed(activity):
		return
	ProgressManager.complete_activity(activity)
	if xp > 0:
		GameState.add_xp(xp)
	ObjectiveManager.complete(objective)


func _on_board_used() -> void:
	if _busy:
		return
	_busy = true
	var buckets: Array[SortBucketData] = []
	for tag in ["need", "want"]:
		var b := SortBucketData.new()
		b.bucket_key = tag
		b.label_key = "shop.tag." + tag
		buckets.append(b)
	var items: Array[SortItemData] = []
	for id in ["apples", "bread", "notebook", "juice", "ball", "kite"]:
		var p: ProductData = _product(id)
		if p == null:
			continue
		var it := SortItemData.new()
		it.item_id = id
		it.text_key = p.name_key
		it.correct_bucket_key = p.tag
		items.append(it)
	await SortPanel.show_sort(buckets, items)
	_busy = false
	if not ProgressManager.is_activity_completed(SORT_ACTIVITY):
		ProgressManager.complete_activity(SORT_ACTIVITY)
		GameState.add_xp(SORT_XP)
	await DialogueBox.show_text("market.needs_wants.after")
	refresh()


func _product(id: String) -> ProductData:
	for s in stalls:
		var p: ProductData = s.shop.product(id)
		if p:
			return p
	return null


func _cheapest() -> int:
	var lo: int = 1 << 30
	for s in stalls:
		lo = mini(lo, s.shop.cheapest_price())
	return lo


func _nearest_stall() -> Node3D:
	var player: Node3D = null
	for p in get_tree().get_nodes_in_group("player"):
		if not p.is_queued_for_deletion() and p.get_parent() and p.get_parent().is_ancestor_of(self):
			player = p
	var best: Node3D = null
	for s in stalls:
		if best == null or (player and s.global_position.distance_to(player.global_position) < best.global_position.distance_to(player.global_position)):
			best = s
	return best


## The "Need or want?" board: a picture board on legs (the market's own
## picture cards), used like any activity station.
class BoardStation extends ActivityStation:
	func _build_visual() -> Node3D:
		var n := Node3D.new()
		var m := MeshMerger.new()
		DecorProps.picture_board(m, Transform3D.IDENTITY, "wood_dark", ["leaf", "gold", "teal", "coral"])
		m.origin = Transform3D.IDENTITY
		m.commit_to(n, "Board", true)
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		n.add_child(body)
		DecorKit.add_box_collider(body, Vector3(1.6, 2.2, 0.3), DecorKit.xf(Vector3(0, 1.1, 0)))
		return n


# --- first visit (Universal Play & Learn) ------------------------------------------

## Runs the wordless first purchase unless it is done (or this child has
## bought something before — an older save: no need to teach it again).
func _start_first_purchase() -> void:
	if ProgressManager.is_activity_completed(FIRST_PURCHASE.activity_id):
		_tidy_tutorial_coins()
		return
	if Shop.has_bought_anything():
		ProgressManager.complete_activity(FIRST_PURCHASE.activity_id)
		_tidy_tutorial_coins()
		return
	activity = PlayActivity.new()
	activity.name = "FirstPurchase"
	activity.guidance = guidance
	add_child(activity)
	var fruit: ShopStall = null
	for s in stalls:
		if s.shop.shop_id == "market_fruit":
			fruit = s
	var first: Node3D = null
	for c in tutorial_coins:
		if not c.is_collected():
			first = c
			break
	activity.finished.connect(func(_id: String) -> void:
		if is_instance_valid(guide):
			guide.scripted = false
			guide.visual.hold(null)
		refresh()
		_show_opportunities())
	activity.run(FIRST_PURCHASE, {"coins": tutorial_coins, "coin_first": first if first else fruit, "guide": guide, "stall": fruit})


## The tutorial is over (or was never needed): its coins are not left lying
## around as unexplained pickups.
func _tidy_tutorial_coins() -> void:
	for c in tutorial_coins:
		if is_instance_valid(c):
			c.queue_free()
	tutorial_coins.clear()


## A found coin: it flies into the balance, which counts up (MoneyHUD).
func _on_tutorial_coin(_id: String, coin: Node3D) -> void:
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	if hud and hud.money_hud:
		hud.money_hud.coins_from_world(coin.global_position + Vector3(0, 0.9, 0))
	GameState.add_coins(1)


func _exit_tree() -> void:
	ObjectiveManager.intro_available = false


# --- visual missions ---------------------------------------------------------------

## After the first purchase the market stays open: the next goal is
## always visible as pictures — what there still is to discover here
## (the savings jar, the bare flower bed, a notebook to learn with, the
## board, the two notebooks to compare, the crates), at most four at a
## time, leading to the first; once all is done, another place. These
## are opportunities, not orders: walking anywhere else is fine.
func _set_free_goal() -> void:
	var found: Array = []   # [token, target]
	if saved() == 0:
		found.append(["jar", jar])
	if not bed.is_improved():
		found.append(["sprout", bed])
	if not LearningDesk.is_learned():
		if LearningDesk.has_notebook().is_empty():
			found.append(["item:notebook:6FA8DC", _stall("market_paper")])
		else:
			found.append(["book", _nearest_portal()])   # the Library, via the Hub
	if not ProgressManager.is_activity_completed(SORT_ACTIVITY):
		found.append(["board", board])
	if not ProgressManager.is_activity_completed("compare:market_paper") and not found.any(func(f): return String(f[0]).begins_with("item:notebook")):
		found.append(["item:notebook:6FA8DC", _stall("market_paper")])
	if not ProgressManager.has_discovered_world("hub:" + JOB_ID):
		found.append(["crate", job])
	if found.is_empty():
		ObjectiveManager.set_objective("mt.visit", "objective.mt.visit", {}, _nearest_portal())
		return
	var tokens: Array = ["you", "then"]
	for f in found.slice(0, 4):
		tokens.append(f[0])
	ObjectiveManager.set_objective("mt.free", "objective.mt.free", {}, found[0][1])
	ObjectiveManager.set_icons(tokens)


func _stall(shop_id: String) -> ShopStall:
	for s in stalls:
		if s.shop.shop_id == shop_id:
			return s
	return null


func _nearest_portal() -> Node3D:
	for n in get_parent().find_children("*", "Area3D", true, false):
		if n is PortalInteraction and n.target_zone_id == "world-hub":
			return n
	return null


# --- the picture intro -------------------------------------------------------------

## First visit only: "you → Market Town: find coins, spend them, it is yours".
func _first_intro() -> void:
	if ProgressManager.get_activity_state(INTRO_STATE, ZONE_ID, false):
		return
	ProgressManager.set_activity_state(INTRO_STATE, ZONE_ID, true)
	await get_tree().create_timer(1.2).timeout
	if is_inside_tree():
		play_intro()


## Also from Help → "Show me again". What a returning child can do here
## differs a little from a first visit (no coins to find any more).
func play_intro() -> void:
	if not is_inside_tree() or VisualIntro.find(self):
		return
	var rows: Array = []
	if not ProgressManager.is_activity_completed(FIRST_PURCHASE.activity_id):
		rows.append({"icons": ["you", "then", "coins"], "params": {"have": 0, "need": TUTORIAL_COINS.size()}, "key": "intro.mt.coins"})
	else:
		rows.append({"icons": ["you", "then", "crate", "then", "coin"], "key": "intro.mt.earn"})
	rows.append({"icons": ["coin", "then", "stall"], "key": "intro.mt.spend"})
	rows.append({"icons": ["stall", "then", "bag"], "key": "intro.mt.yours"})
	VisualIntro.play(self, ZONE_ID, rows)


# --- money is a tool: the jar and the flower bed ----------------------------------

func saved() -> int:
	return int(ProgressManager.get_activity_state(SAVINGS_STATE, JAR_KEY, 0))


## The jar: put coins in (they really leave the wallet), take them out
## again whenever wanted. Its goal — the kite — is shown with the coins
## saved so far. Saving is one choice among several, never "the right one":
## taking coins out to spend them is just as allowed.
func _on_jar_used() -> void:
	if _busy:
		return
	_busy = true
	while is_inside_tree():
		var options: Array = [{"purpose": "save", "id": "put", "icons": ["coin", "then", "jar"], "cost": 1, "key": "purpose.put_in"}]
		if saved() > 0:
			options.append({"purpose": "spend", "id": "take", "icons": ["jar", "then", "coin"], "key": "purpose.take_out"})
		var picked: Dictionary = await ResourcePurpose.choose(self, options, GameState.wallet.balance, ["jar", "coins", "then", KITE_ICON], {"have": saved(), "need": SAVE_GOAL})
		if picked.is_empty():
			break
		var hud: Node = get_tree().get_first_node_in_group("mq_hud")
		if picked["id"] == "put":
			if hud and hud.money_hud:
				hud.money_hud.coins_from_world(jar.global_position + Vector3(0, 1.4, 0))
			if not GameState.spend_coins(1):
				break
			var first: bool = saved() == 0
			ProgressManager.set_activity_state(SAVINGS_STATE, JAR_KEY, saved() + 1)
			await jar.drop_coins(1, float(saved()) / SAVE_GOAL)
			if first:
				SupportProfile.record_success()
			if saved() == SAVE_GOAL:
				customer.visual.play_reaction("celebrate")
				ResourcePurpose.show_outcome(self, ["jar", "coins"], [KITE_ICON], "jar.goal_reached", {"before": {"have": SAVE_GOAL, "need": SAVE_GOAL}})
		else:
			ProgressManager.set_activity_state(SAVINGS_STATE, JAR_KEY, saved() - 1)
			jar.set_fill(float(saved()) / SAVE_GOAL)
			if hud and hud.money_hud:
				hud.money_hud.coins_from_world(jar.global_position + Vector3(0, 1.4, 0))
			GameState.add_coins(1)
			AudioManager.play_sfx("coin", 1.0, -4.0)
	_busy = false
	refresh()


## Once, after the first purchase (when coins are left): Lina looks at what
## else there is — the jar, then the flower bed — pointing, with a "look
## here" beacon on each. No menu and no words needed; the child decides
## whether to go there at all.
func _show_opportunities() -> void:
	if ProgressManager.get_activity_state("purpose", "mt_shown", false) or GameState.wallet.balance <= 0:
		return
	ProgressManager.set_activity_state("purpose", "mt_shown", true)
	await get_tree().create_timer(1.5).timeout
	if not is_inside_tree() or not is_instance_valid(guide):
		return
	AudioManager.say(Localization.t("market.guide.coins_left"), guide.get_display_name())
	for t in [jar, bed]:
		if t == bed and bed.is_improved():
			continue
		VisualCues.beacon(t, 2.4)
		if Settings.visual_guidance != "light":
			await Demonstration.point(guide, t.global_position + Vector3(0, 1.0, 0), 1.8)
		else:
			await get_tree().create_timer(1.2).timeout
		if is_instance_valid(t):
			VisualCues.clear(t)
