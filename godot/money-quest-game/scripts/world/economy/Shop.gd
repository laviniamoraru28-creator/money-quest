class_name Shop
extends RefCounted
## Shop — the rules of buying with VIRTUAL coins, in one small place so
## every stall, shop or future district uses exactly the same logic:
##
##   quote(product)  → what buying would mean right now (price, balance,
##                     what would be left, or how many more coins are needed)
##   buy(product)    → spends the coins and records ownership, or explains
##                     why not ("not_enough", "already_have", "sold_out")
##
## Money only moves through GameState (spend_coins) and ownership through
## ProgressManager (own_item); both are saved locally by SaveManager at once.
## There is no real money, no payment, no network — and amounts are always
## written through money.* translation keys, never with a currency symbol.

const NOT_ENOUGH := "not_enough"
const ALREADY_HAVE := "already_have"
const SOLD_OUT := "sold_out"
const OK := "ok"


## "5 virtual coins" in the child's language.
static func coins(amount: int) -> String:
	return Localization.tn("money.virtual_coins", amount)


static func remaining_stock(p: ProductData) -> int:
	if p.stock <= 0:
		return -1   # unlimited
	return maxi(p.stock - ProgressManager.owned_count(p.item_id()), 0)


static func quote(p: ProductData) -> Dictionary:
	var balance: int = GameState.wallet.balance
	var q := {
		"price": p.price,
		"balance": balance,
		"after": balance - p.price,
		"affordable": GameState.can_afford(p.price),
		"needed": maxi(p.price - balance, 0),
		"owned": ProgressManager.owned_count(p.item_id()),
		"status": OK,
	}
	if not p.can_buy_more():
		q["status"] = ALREADY_HAVE
	elif remaining_stock(p) == 0:
		q["status"] = SOLD_OUT
	elif not q["affordable"]:
		q["status"] = NOT_ENOUGH
	return q


## Buys one. On success the coins are spent and the item is owned (and both
## are saved). On failure nothing changes and `status` says why.
static func buy(p: ProductData, shop_id: String = "") -> Dictionary:
	var q: Dictionary = quote(p)
	if q["status"] != OK:
		return q
	if not GameState.spend_coins(p.price):
		q["status"] = NOT_ENOUGH
		return q
	ProgressManager.own_item(p.item_id())
	if not shop_id.is_empty():
		var n: int = int(ProgressManager.get_activity_state("shop:" + shop_id, "bought", 0))
		ProgressManager.set_activity_state("shop:" + shop_id, "bought", n + 1)
	q["balance"] = GameState.wallet.balance
	q["after"] = GameState.wallet.balance
	q["owned"] = ProgressManager.owned_count(p.item_id())
	return q


## Was anything ever bought (anywhere, or at one shop)?
static func has_bought_anything(shop_id: String = "") -> bool:
	if not shop_id.is_empty():
		return int(ProgressManager.get_activity_state("shop:" + shop_id, "bought", 0)) > 0
	for id in ProgressManager.owned_items:
		if String(id).begins_with("product:"):
			return true
	return false
