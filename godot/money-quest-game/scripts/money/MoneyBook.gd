class_name MoneyBook
extends RefCounted
## MoneyBook — the money state itself, as plain data and rules (no scene,
## no signals): accounts, the ledger, goals, the card, subscriptions and
## the game clock. MoneyLife owns the real one (saved); anything that wants
## to try something out — What if?, the Time Vault, a future planner —
## works on a copy (sandbox) or a fresh book, so the child's real virtual
## money only ever changes through real choices.
##
## Accounts (by id): {"kind", "product", "balance", "carry", "opened",
## "created", "locked_until", "icon"}. "kind" says what it is for:
##   wallet    coins in your pocket (its balance lives in GameState.wallet,
##             the one VirtualMoney every existing system already uses)
##   current   the everyday account a future card pays from
##   savings   a savings pot
##   goal      a pot that belongs to a goal
##   business  a future business account
##   activity  temporary coins inside an activity (never saved)
## `balance` is whole coins; `carry` is the part of a coin a growing product
## has earned but not paid yet (it may be negative for a product that can
## fall).
##
## Ledger entries are compact: {"t": day, "k": kind, "a": amount (> 0),
## "f": from, "to": to, "s": source, "p": picture token, "n": optional
## translation key}. "world" stands for everything outside the child's
## accounts (a shop, a quest, the bank's interest). Only the newest
## LEDGER_KEEP entries are kept; older ones are folded into `totals`.

const WORLD: String = "world"
const LEDGER_KEEP: int = 200
const KINDS: Array[String] = [
	"earn", "spend", "save", "transfer", "interest", "growth", "fee",
	"subscription", "refund", "reward", "donation", "business_income",
	"business_expense", "opening",
]
const SAVING_KINDS: Array[String] = ["savings", "goal"]

var accounts: Dictionary = {}
var goals: Dictionary = {}
var card: Dictionary = {"issued": false, "account": "current", "design": "", "frozen": false}
var subscriptions: Array = []
var ledger: Array = []
var totals: Dictionary = {}      # kind -> [count, sum] of folded entries
var day: int = 0
## The real wallet (GameState.wallet) — set on MoneyLife's book only.
var wallet_ref: VirtualMoney = null


# --- accounts ---------------------------------------------------------------------------

func open(id: String, kind: String, product: String, opts: Dictionary = {}) -> Dictionary:
	if accounts.has(id):
		return accounts[id]
	var lock_days: int = int(opts.get("lock_days", 0))
	accounts[id] = {
		"kind": kind,
		"product": product,
		"balance": 0,
		"carry": 0.0,
		"opened": bool(opts.get("opened", true)),
		"created": day,
		"locked_until": day + lock_days if lock_days > 0 else 0,
		"icon": String(opts.get("icon", ProductRules.rule(product).get("icon", "coin"))),
	}
	return accounts[id]


func has(id: String) -> bool:
	return accounts.has(id)


func balance(id: String) -> int:
	if id == "wallet" and wallet_ref != null:
		return wallet_ref.balance
	return int(accounts.get(id, {}).get("balance", 0))


func _set_balance(id: String, value: int) -> void:
	if id == "wallet" and wallet_ref != null:
		wallet_ref.balance = value
	else:
		accounts[id]["balance"] = value


## Can money come out of this account today? (Its product's access rule.)
func can_access(id: String) -> bool:
	var a: Dictionary = accounts.get(id, {})
	if a.is_empty() or not bool(a.get("opened", true)):
		return false
	if ProductRules.is_locked_product(String(a["product"])):
		return day >= int(a.get("locked_until", 0))
	return true


func total(kinds: Array = []) -> int:
	var s: int = 0
	for id in accounts:
		if kinds.is_empty() or kinds.has(accounts[id]["kind"]):
			s += balance(id)
	return s


# --- moving money ------------------------------------------------------------------------

## Moves `amount` coins from `from` to `to` (either may be WORLD) and writes
## one ledger entry. Returns the entry, or {} when it cannot happen (not
## enough, locked, unknown account, nothing to move). Never goes negative.
func post(kind: String, amount: int, from: String, to: String, source: String = "", picture: String = "", note: String = "") -> Dictionary:
	if amount <= 0 or from == to or not KINDS.has(kind):
		return {}
	if from != WORLD:
		if not has(from) or balance(from) < amount or (kind != "growth" and not can_access(from)):
			return {}
	if to != WORLD and (not has(to) or not bool(accounts[to].get("opened", true))):
		return {}   # an account that isn't opened yet can't receive money
	if from != WORLD:
		_set_balance(from, balance(from) - amount)
	if to != WORLD:
		_set_balance(to, balance(to) + amount)
	var e: Dictionary = {"t": day, "k": kind, "a": amount, "f": from, "to": to, "s": source, "p": picture}
	if not note.is_empty():
		e["n"] = note
	_append(e)
	return e


func earn(amount: int, source: String = "", picture: String = "coin", kind: String = "earn", to: String = "wallet") -> Dictionary:
	return post(kind, amount, WORLD, to, source, picture)


func spend(amount: int, source: String = "", picture: String = "", from: String = "wallet", kind: String = "spend") -> Dictionary:
	return post(kind, amount, from, WORLD, source, picture)


## Between the child's own accounts: "save" into a savings or goal pot,
## "transfer" otherwise.
func transfer(from: String, to: String, amount: int, source: String = "", picture: String = "") -> Dictionary:
	var kind: String = "save" if SAVING_KINDS.has(String(accounts.get(to, {}).get("kind", ""))) else "transfer"
	return post(kind, amount, from, to, source, picture if not picture.is_empty() else String(accounts.get(to, {}).get("icon", "coin")))


## A marker that changes nothing (e.g. the balance an older save started
## with), so the ledger tells the whole story.
func note_opening(account: String, amount: int, source: String) -> void:
	if amount > 0:
		_append({"t": day, "k": "opening", "a": amount, "f": WORLD, "to": account, "s": source, "p": "coin"})


func _append(e: Dictionary) -> void:
	ledger.append(e)
	while ledger.size() > LEDGER_KEEP:
		var old: Dictionary = ledger.pop_front()
		var k: String = String(old["k"])
		var t: Array = totals.get(k, [0, 0])
		totals[k] = [int(t[0]) + 1, int(t[1]) + int(old["a"])]


# --- goals and subscriptions (structure; gameplay comes later) ---------------------------

func add_goal(id: String, target: int, picture: String, pot: String) -> Dictionary:
	if not has(pot):
		open(pot, "goal", "home_jar", {"icon": picture})
	goals[id] = {"target": target, "picture": picture, "pot": pot, "created": day}
	return goals[id]


func goal_progress(id: String) -> Vector2i:
	var g: Dictionary = goals.get(id, {})
	return Vector2i(balance(String(g.get("pot", ""))), int(g.get("target", 0)))


func add_subscription(id: String, amount: int, every_days: int, account: String, picture: String, source: String) -> void:
	subscriptions.append({"id": id, "amount": amount, "every": every_days, "next": day + every_days, "account": account, "picture": picture, "source": source, "active": true})


# --- the game clock ---------------------------------------------------------------------

## Moves the game clock forward (only ever by play or an explicit activity:
## never by real time). Applies each account's product rule (growth paid as
## whole coins) and any subscription that falls due. Returns the entries.
func advance(days: int, source: String = "clock") -> Array:
	var out: Array = []
	if days <= 0:
		return out
	for id in accounts:
		var a: Dictionary = accounts[id]
		var product: String = String(a["product"])
		if not ProductRules.grows(product):
			continue
		a["carry"] = float(a["carry"]) + ProductRules.growth_delta(product, balance(id), days, hash(id) + day)
		var whole: int = int(floor(float(a["carry"]))) if float(a["carry"]) > 0.0 else int(ceil(float(a["carry"])))
		if whole > 0:
			a["carry"] = float(a["carry"]) - whole
			out.append(post("interest", whole, WORLD, id, source, "growth"))
		elif whole < 0:
			var loss: int = mini(-whole, balance(id))
			a["carry"] = float(a["carry"]) + loss
			if loss > 0:
				out.append(post("growth", loss, id, WORLD, source, "loss"))
	day += days
	for sub in subscriptions:
		while bool(sub["active"]) and int(sub["next"]) <= day:
			var e: Dictionary = post("subscription", int(sub["amount"]), String(sub["account"]), WORLD, String(sub["source"]), String(sub["picture"]))
			if e.is_empty():
				sub["active"] = false   # couldn't pay: it stops (a future safety/learning moment)
			else:
				out.append(e)
			sub["next"] = int(sub["next"]) + int(sub["every"])
	return out.filter(func(e): return not e.is_empty())


# --- copies and saving ------------------------------------------------------------------

## A full copy that can be changed freely (What if?). Its wallet is a
## detached copy, so nothing reaches the real money.
func copy() -> MoneyBook:
	var b := MoneyBook.new()
	b.from_dict(to_dict())
	if wallet_ref != null:
		b.open("wallet", "wallet", "cash")
		b.accounts["wallet"]["balance"] = wallet_ref.balance
	return b


func to_dict() -> Dictionary:
	return {
		"day": day,
		"accounts": accounts.duplicate(true),
		"goals": goals.duplicate(true),
		"card": card.duplicate(true),
		"subscriptions": subscriptions.duplicate(true),
		"ledger": ledger.duplicate(true),
		"totals": totals.duplicate(true),
	}


## Loads saved data, keeping only well-formed parts (a damaged save stays
## playable). JSON numbers come back as floats: whole-coin fields are
## turned back into ints.
func from_dict(d: Dictionary) -> void:
	day = int(d.get("day", 0))
	accounts = {}
	var acc: Variant = d.get("accounts", {})
	if acc is Dictionary:
		for id in acc:
			var a: Variant = acc[id]
			if a is Dictionary and a.has("kind") and a.has("product"):
				accounts[String(id)] = {
					"kind": String(a["kind"]),
					"product": String(a["product"]) if ProductRules.has(String(a["product"])) else "cash",
					"balance": maxi(int(a.get("balance", 0)), 0),
					"carry": float(a.get("carry", 0.0)),
					"opened": bool(a.get("opened", true)),
					"created": int(a.get("created", 0)),
					"locked_until": int(a.get("locked_until", 0)),
					"icon": String(a.get("icon", "coin")),
				}
	goals = (d.get("goals", {}) as Dictionary).duplicate(true) if d.get("goals", {}) is Dictionary else {}
	var c: Variant = d.get("card", {})
	if c is Dictionary:
		for k in card.keys():
			if c.has(k):
				card[k] = c[k]
	subscriptions = (d.get("subscriptions", []) as Array).duplicate(true) if d.get("subscriptions", []) is Array else []
	ledger = []
	var l: Variant = d.get("ledger", [])
	if l is Array:
		for e in l:
			if e is Dictionary and e.has("k") and e.has("a"):
				var x: Dictionary = (e as Dictionary).duplicate()
				x["t"] = int(x.get("t", 0))
				x["a"] = int(x["a"])
				ledger.append(x)
	totals = (d.get("totals", {}) as Dictionary).duplicate(true) if d.get("totals", {}) is Dictionary else {}
