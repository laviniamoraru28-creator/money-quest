class_name ShopData
extends Resource
## ShopData — a stall or shop as data: its name, who runs it, what it sells,
## and an optional price comparison. ShopStall places it in the world (any
## district); ShopCard shows it. Adding a shop = one .tres in data/shops/.

@export var shop_id: String = ""
@export var name_key: String = ""
## A short welcome (shown on the card; the keeper also says it).
@export var welcome_key: String = ""
## The NPC who runs it (npc_id) — they greet, react to purchases, and
## give a kind line when something is too expensive. Empty = nobody.
@export var keeper_npc_id: String = ""
## Palette colour (DecorKit) for the card's stripe and the stall awning.
@export var accent: String = "coral"
@export var products: Array[ProductData] = []

@export_group("Compare (optional)")
## Two product ids the stall invites the child to compare ("Which costs
## less?" then "Which would you choose?" — every choice is fine).
@export var compare_ids: Array[String] = []
@export var compare_question_key: String = ""
@export var compare_choose_key: String = ""


func product(product_id: String) -> ProductData:
	for p in products:
		if p.product_id == product_id:
			return p
	return null


func cheapest_price() -> int:
	var lo: int = 1 << 30
	for p in products:
		lo = mini(lo, p.price)
	return lo if not products.is_empty() else 0
