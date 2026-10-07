class_name ProductData
extends Resource
## ProductData — one thing a child can find, inspect and (maybe) buy in the
## world, as data. Shops list products; the world shows them on stalls; the
## ShopCard shows their name, picture, price and what buying would mean.
## Every player-facing string is a translation key. Prices are whole
## VIRTUAL coins (educational only — never real money, never a currency
## symbol: amounts are always shown through money.* keys).

@export var product_id: String = ""
@export var name_key: String = ""
## One short sentence: what it is / what it's for.
@export var description_key: String = ""
## Optional "did you know?" line (hidden in Focus Mode).
@export var fact_key: String = ""
@export var price: int = 1
## A simple grouping for the card and future activities: "food", "fun",
## "school", "home", "garden"...
@export var category: String = "food"
## Needs and wants: "need" | "want" | "useful" | "" (no label).
@export var tag: String = ""
## How the product looks (ItemIcon / ItemModel shape): "apple", "bread",
## "juice", "notebook", "notebook_fancy", "pencils", "kite", "ball",
## "plant", "umbrella", "socks", "toy_car".
@export var visual: String = "apple"
@export var color: Color = Color("F07A5A")
## How many one child can buy in total: 1 = a one-off (a kite), 0 = no limit
## (apples). After the limit the card says "You already have it".
@export var max_owned: int = 0
## Stock on the stall for the whole game (0 = always available). Optional
## scarcity for future activities; most products leave it at 0.
@export var stock: int = 0
## Free-form learning tag for future activities/analytics-free reporting
## (e.g. "compare", "needs_wants", "saving").
@export var learning_tag: String = ""


func item_id() -> String:
	return "product:" + product_id


func can_buy_more() -> bool:
	return max_owned <= 0 or ProgressManager.owned_count(item_id()) < max_owned
