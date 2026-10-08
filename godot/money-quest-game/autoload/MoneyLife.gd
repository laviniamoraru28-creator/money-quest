extends Node
## MoneyLife — the one place the child's virtual money lives: every coin
## earned, spent, saved or moved goes through here and is written in the
## ledger. 100% virtual and offline: no real money, no real accounts, no
## network, no logins. Future Bank, Card and App screens only READ this
## (and ask it to move coins); they never keep a balance of their own.
##
## Built on MoneyBook (accounts, ledger, goals, card, subscriptions, game
## clock) and ProductRules (how each kind of place behaves). The existing
## world keeps working unchanged: GameState.add_coins / spend_coins are
## thin wrappers over earn / spend, and the "wallet" account's balance IS
## GameState.wallet (the single VirtualMoney every system already reads).
##
## MoneyLife records what happened. It does not judge it: competency
## evidence is the Competency system's job (activities report it there).
##
## What if?: sandbox() returns a copy to play with; nothing done to it ever
## reaches the real money.
##
## Saved by SaveManager as "money_life" (versioned). Saves from before
## MoneyLife are migrated once (migrate_legacy).

signal transaction_posted(entry: Dictionary)
signal balance_changed(account: String, before: int, after: int)
signal clock_advanced(from_day: int, to_day: int)

const VERSION: int = 1

var book: MoneyBook


func _ready() -> void:
	book = MoneyBook.new()
	book.wallet_ref = GameState.wallet
	ensure_defaults()


## The accounts every child has from the start: coins in your pocket (open)
## and an everyday current account (not opened yet — the Bank opens it).
func ensure_defaults() -> void:
	book.open("wallet", "wallet", "cash", {"icon": "coin"})
	book.open("current", "current", "current_basic", {"opened": false, "icon": "card"})


# --- reading ------------------------------------------------------------------------------

func balance(account: String = "wallet") -> int:
	return book.balance(account)


func has_account(id: String) -> bool:
	return book.has(id)


func account(id: String) -> Dictionary:
	return book.accounts.get(id, {})


func day() -> int:
	return book.day


## The newest `limit` ledger entries (newest last), optionally of some kinds.
func entries(limit: int = 20, kinds: Array = []) -> Array:
	var l: Array = book.ledger if kinds.is_empty() else book.ledger.filter(func(e): return kinds.has(e["k"]))
	return l.slice(maxi(l.size() - limit, 0))


# --- moving money (each writes one ledger entry) -----------------------------------------

func earn(amount: int, source: String = "", picture: String = "coin", kind: String = "earn", to: String = "wallet") -> bool:
	return _done(book.earn(amount, _src(source), picture, kind, to))


func spend(amount: int, source: String = "", picture: String = "", from: String = "wallet", kind: String = "spend") -> bool:
	return _done(book.spend(amount, _src(source), picture, from, kind))


func transfer(from: String, to: String, amount: int, source: String = "", picture: String = "") -> bool:
	return _done(book.transfer(from, to, amount, _src(source), picture))


func can_afford(amount: int, from: String = "wallet") -> bool:
	return amount >= 0 and book.balance(from) >= amount and book.can_access(from)


## A savings pot (created once; `id` is used as given, e.g. "pot:market_jar").
func open_pot(id: String, product: String = "home_jar", icon: String = "jar", opts: Dictionary = {}) -> Dictionary:
	var o: Dictionary = opts.duplicate()
	o["icon"] = icon
	return book.open(id, "savings", product, o)


func add_goal(id: String, target: int, picture: String, pot: String = "") -> Dictionary:
	return book.add_goal(id, target, picture, pot if not pot.is_empty() else "goal:" + id)


## Moves the game clock (only from play or an explicit activity).
func advance_clock(days: int, source: String = "clock") -> Array:
	var from: int = book.day
	var watch: Dictionary = _snapshot()
	var out: Array = book.advance(days, source)
	for e in out:
		transaction_posted.emit(e)
	_emit_changes(watch)
	clock_advanced.emit(from, book.day)
	return out


## A copy of the real money state for What if? (changes never come back).
func sandbox() -> MoneyBook:
	return book.copy()


## A fresh, empty book for an activity's own coins (e.g. the Time Vault).
static func scratch_book() -> MoneyBook:
	return MoneyBook.new()


# --- saving -------------------------------------------------------------------------------

func to_dict() -> Dictionary:
	var d: Dictionary = book.to_dict()
	d["version"] = VERSION
	return d


## Called by SaveManager after everything else has loaded. `data` is the
## saved "money_life" section ({} for a new game or an older save).
func load_dict(data: Dictionary) -> void:
	book = MoneyBook.new()
	book.wallet_ref = GameState.wallet
	if data.is_empty():
		ensure_defaults()
		migrate_legacy()
		return
	book.from_dict(data)
	ensure_defaults()


## Older saves: the coins they had become the wallet's opening balance (a
## ledger marker, nothing moves); the Market Town jar's saved coins become
## a real savings pot. Runs once — the save then has a money_life section.
func migrate_legacy() -> void:
	book.note_opening("wallet", GameState.wallet.balance, "save:legacy")
	var jar: int = int(ProgressManager.get_activity_state("savings", "market_jar", 0))
	if jar > 0:
		open_pot("pot:market_jar", "home_jar", "jar")
		book.accounts["pot:market_jar"]["balance"] = jar
		book.note_opening("pot:market_jar", jar, "save:legacy")
		ProgressManager.set_activity_state("savings", "market_jar", 0)


# --- internals ----------------------------------------------------------------------------

func _src(source: String) -> String:
	return source if not source.is_empty() else "zone:" + WorldManager.current_zone_id


func _done(e: Dictionary) -> bool:
	if e.is_empty():
		return false
	transaction_posted.emit(e)
	for id in [e["f"], e["to"]]:
		if id == MoneyBook.WORLD:
			continue
		var after: int = book.balance(id)
		var before: int = after + (int(e["a"]) if id == e["f"] else -int(e["a"]))
		balance_changed.emit(id, before, after)
		if id == "wallet":
			GameState.coins_changed.emit(after)
	return true


func _snapshot() -> Dictionary:
	var s := {}
	for id in book.accounts:
		s[id] = book.balance(id)
	return s


func _emit_changes(before: Dictionary) -> void:
	for id in before:
		var now: int = book.balance(id)
		if now != int(before[id]):
			balance_changed.emit(id, int(before[id]), now)
			if id == "wallet":
				GameState.coins_changed.emit(now)
