class_name ShareSpot
extends FlowerBed
## ShareSpot — Kindness Grove's sharing bed: "What will you do with what
## you have?" Money and things can help us, help others or make something
## better — and giving is a choice, never a requirement. Using it shows the
## shared picture choice (ResourcePurpose):
##   share a coin          coin → heart → flowers
##   share something       the child's own item → heart (only food and fun
##                         things they hold; never school things the
##                         Library needs, never anything without a shop)
##   keep it               you → bag ("that's OK too")
## Sharing an item asks once more, with the item's picture and a big ✓ / ✗,
## before it leaves the bag. Sharing makes the bed bloom (saved); keeping
## gets a friendly wave — no penalty. Any choice completes the activity.

const ACTIVITY: String = "kg-share-choice"
const XP: int = 10
## Only these kinds of bought things can be shared.
const SHAREABLE_CATEGORIES: Array = ["food", "fun"]
const SHOPS: Array = ["res://data/shops/market_fruit.tres", "res://data/shops/market_paper.tres", "res://data/shops/market_toys.tres"]


func _init() -> void:
	super._init()
	prompt_key = "interaction.share_prompt"
	discovery_id = "kg:share_bed"


## Always "Share": the bed can be used again after it blooms (FlowerBed
## turns its prompt into "Look" then).
func _ready() -> void:
	super._ready()
	prompt_text_key = prompt_key


static func done() -> bool:
	return ProgressManager.is_activity_completed(ACTIVITY)


## The products the child could share now: held (count > 0) and of a
## shareable kind. [ProductData...]
static func shareable() -> Array:
	var out: Array = []
	for path in SHOPS:
		var shop: ShopData = load(path)
		if shop == null:
			continue
		for p in shop.products:
			if p is ProductData and SHAREABLE_CATEGORIES.has(p.category) and ProgressManager.owned_count(p.item_id()) > 0:
				out.append(p)
	return out


static func token(p: ProductData) -> String:
	return "item:%s:%s" % [p.visual, p.color.to_html(false)]


func interact() -> void:
	used.emit()
	var options: Array = [{"purpose": "help", "id": "coin", "picture": "coin", "icons": ["coin", "then", "heart", "then", "flowers"], "cost": 1, "key": "kg.share.coin"}]
	for p in shareable().slice(0, 3):
		options.append({"purpose": "help", "id": "item_" + p.product_id, "picture": token(p), "icons": [token(p), "then", "heart"], "key": "kg.share.item", "product": p})
	options.append({"purpose": "enjoy", "id": "keep", "picture": "bag", "icons": ["you", "then", "bag"], "key": "kg.share.keep"})
	var picked: Dictionary = await ResourcePurpose.choose(self, options, GameState.wallet.balance, ["heart", "then", "npc:friend"])
	if picked.is_empty():
		return   # "Later": nothing happens, nothing is lost
	var id: String = String(picked["id"])
	if id == "keep":
		_record()
		_celebrate_nearby("wave")
		await Feedback.success(self, ["you", "then", "bag"], "kg.share.kept")
		return
	if id == "coin":
		if not GameState.can_afford(1):
			return
		var hud: Node = get_tree().get_first_node_in_group("mq_hud")
		if hud and hud.money_hud:
			hud.money_hud.coins_from_world(global_position + Vector3(0, 0.8, 0))
		if not GameState.spend_coins(1, "kg:share", "heart"):
			return
		_record()
		await _shared(["coin", "then", "heart"])
		return
	# An item: one more, clear question with its picture, before it goes.
	var p: ProductData = picked["product"]
	var t: String = token(p)
	var confirm: Dictionary = await ResourcePurpose.choose(self, [
		{"purpose": "help", "id": "yes", "picture": "tick", "icons": [t, "then", "npc:friend"], "key": "kg.share.yes"},
		{"purpose": "enjoy", "id": "no", "picture": "close", "icons": [t, "then", "bag"], "key": "kg.share.no"},
	], GameState.wallet.balance, [t, "then", "npc:friend"])
	if String(confirm.get("id", "no")) != "yes":
		return   # kept: nothing leaves the bag
	if not ProgressManager.give_item(p.item_id(), 1):
		return
	_record()
	await _shared([t, "then", "heart"])


func _record() -> void:
	if not done():
		GameState.add_xp(XP)
		ProgressManager.complete_activity(ACTIVITY)


func _shared(tokens: Array) -> void:
	if is_improved():
		_celebrate_nearby("celebrate")
		AudioManager.play_sfx("success", 1.0, -4.0)
	else:
		await bloom()
		prompt_text_key = prompt_key
	await Feedback.success(self, tokens + ["then", "flowers"], "kg.share.shared")
