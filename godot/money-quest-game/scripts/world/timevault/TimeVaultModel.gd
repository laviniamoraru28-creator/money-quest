class_name TimeVaultModel
extends RefCounted
## TimeVaultModel — the Time Vault's rules as plain numbers (no scene), so
## the room, "What if?" and the tests all agree on what happens:
##
##   places   piggy (at home: product "home_piggy" — stays the same)
##            bank  (product "easy_saver" — grows a little, open any time)
##            vault (product "locked_saver" — grows more, locked until
##            time is up)
##   growth   from each place's product rule (ProductRules), paid as whole
##            coins once a year in a MoneyBook of its own — so it is the
##            place's RULE that makes money grow, not "being in a bank"
##   needs    "need it now" moments (a broken bike) at a given year: paid
##            from places that are open at that time
##   goal     something to have at the end (a kite), at a price
##   prices   prices can rise each year (stages 5+): needs and goals cost
##            more later — money that doesn't grow buys less
##
## STAGES follow the competency ladder (Competency level 1..8), so the room
## gets richer only as the child shows understanding — never by age.

const PLACES_ALL: Array[String] = ["piggy", "bank", "vault"]
## Each place is an account with a MoneyLife product rule (ProductRules):
## its growth and access come from there, not from this file.
const PLACE_PRODUCT: Dictionary = {"piggy": "home_piggy", "bank": "easy_saver", "vault": "locked_saver"}
const YEARS: int = 10

## One per ladder step: recognize, choose, compare, apply, plan, solve,
## transfer, create.
const STAGES: Array = [
	# 1 recognize: two places, time passes, money grows (or not).
	{"places": ["piggy", "bank"], "coins": 10, "needs": [], "goal": 0, "price_growth": 0.0},
	# 2 choose: a third place that grows more but is locked; a need appears.
	{"places": ["piggy", "bank", "vault"], "coins": 12, "needs": [{"year": 3, "cost": 4, "icon": "bike"}], "goal": 0, "price_growth": 0.0},
	# 3 compare: and a goal at the end — enough for both?
	{"places": ["piggy", "bank", "vault"], "coins": 12, "needs": [{"year": 3, "cost": 4, "icon": "bike"}], "goal": 12, "price_growth": 0.0},
	# 4 apply: new numbers, same ideas.
	{"places": ["piggy", "bank", "vault"], "coins": 14, "needs": [{"year": 4, "cost": 5, "icon": "bike"}], "goal": 13, "price_growth": 0.0},
	# 5 plan: prices change — the need costs more when it comes.
	{"places": ["piggy", "bank", "vault"], "coins": 14, "needs": [{"year": 4, "cost": 4, "icon": "bike"}], "goal": 13, "price_growth": 0.05, "grow_needs": true},
	# 6 solve: inflation — the goal costs more by the end too.
	{"places": ["piggy", "bank", "vault"], "coins": 14, "needs": [{"year": 4, "cost": 4, "icon": "bike"}], "goal": 10, "price_growth": 0.03, "grow_needs": true, "grow_goal": true},
	# 7 transfer: two needs at different times.
	{"places": ["piggy", "bank", "vault"], "coins": 16, "needs": [{"year": 2, "cost": 3, "icon": "bike"}, {"year": 6, "cost": 4, "icon": "tools"}], "goal": 8, "price_growth": 0.03, "grow_needs": true, "grow_goal": true},
	# 8 create: the child picks their own goal first.
	{"places": ["piggy", "bank", "vault"], "coins": 16, "needs": [{"year": 2, "cost": 3, "icon": "bike"}, {"year": 6, "cost": 4, "icon": "tools"}], "goal": 0, "goal_choices": [6, 8, 11], "price_growth": 0.03, "grow_needs": true, "grow_goal": true},
]


static func stage(level: int) -> Dictionary:
	return STAGES[clampi(level, 1, STAGES.size()) - 1]


## A fresh, separate money book for one run (never the child's real money):
## the purse holds the stage's coins and each place is an account with its
## product rule. Nothing is locked yet: the child may change their mind
## until the clock starts (start_clock).
static func new_book(st: Dictionary) -> MoneyBook:
	var b := MoneyBook.new()
	b.open("purse", "activity", "cash", {"icon": "coin"})
	b.accounts["purse"]["balance"] = int(st["coins"])
	for k in st["places"]:
		b.open(k, "savings", PLACE_PRODUCT[k], {"icon": k})
	return b


## The clock starts: places whose rule locks the money are locked until
## time is up.
static func start_clock(b: MoneyBook) -> void:
	for k in b.accounts:
		if ProductRules.is_locked_product(String(b.accounts[k]["product"])):
			b.accounts[k]["locked_until"] = b.day + YEARS * ProductRules.DAYS_PER_YEAR


## Lets years pass in a book (growth follows each place's product rule).
static func pass_years(b: MoneyBook, years: int) -> void:
	b.advance(years * ProductRules.DAYS_PER_YEAR, "time_vault")


## What something costs at `year` (prices may rise).
static func price_at(base: int, year: int, st: Dictionary, grows: bool) -> int:
	if not grows or float(st.get("price_growth", 0.0)) <= 0.0:
		return base
	return int(round(base * pow(1.0 + float(st["price_growth"]), year)))


static func need_cost(st: Dictionary, need: Dictionary) -> int:
	return price_at(int(need["cost"]), int(need["year"]), st, bool(st.get("grow_needs", false)))


static func goal_cost(st: Dictionary, goal: int) -> int:
	return price_at(goal, YEARS, st, bool(st.get("grow_goal", false)))


## Simulates a whole run with a simple plan for the needs: pay from the
## pocket, then the piggy, then the bank (never possible from the locked
## vault). Returns {"final": {kind: float}, "pocket": float, "paid": [bool],
## "total": int, "goal": int, "goal_met": bool}.
static func simulate(st: Dictionary, alloc: Dictionary, goal: int = -1) -> Dictionary:
	var b: MoneyBook = new_book(st)
	for k in st["places"]:
		b.transfer("purse", k, int(alloc.get(k, 0)), "time_vault")
	start_clock(b)
	var paid: Array = []
	var year: int = 0
	for need in st["needs"]:
		var y: int = int(need["year"])
		pass_years(b, y - year)
		year = y
		var cost: int = need_cost(st, need)
		var open_total: int = b.balance("purse")
		for k in st["places"]:
			if b.can_access(k):
				open_total += b.balance(k)
		if open_total >= cost:
			for k in ["piggy", "bank"]:
				var short: int = cost - b.balance("purse")
				if short > 0 and b.has(k) and b.can_access(k):
					b.transfer(k, "purse", mini(short, b.balance(k)), "time_vault")
			b.spend(cost, "time_vault:need", String(need.get("icon", "coin")), "purse")
			paid.append(true)
		else:
			paid.append(false)
	pass_years(b, YEARS - year)
	var final: Dictionary = {}
	var total: int = b.balance("purse")
	for k in st["places"]:
		final[k] = b.balance(k)
		total += b.balance(k)
	var g: int = goal if goal >= 0 else int(st.get("goal", 0))
	var gc: int = goal_cost(st, g) if g > 0 else 0
	return {"final": final, "pocket": b.balance("purse"), "paid": paid, "total": total, "goal": gc, "goal_met": g <= 0 or total >= gc}


## Did a run meet this stage's objective? (stage 1: see money grow in the
## bank; later: every need paid and the goal reached.)
static func objective_met(st: Dictionary, alloc: Dictionary, result: Dictionary) -> bool:
	if st["needs"].is_empty() and int(st.get("goal", 0)) <= 0 and not st.has("goal_choices"):
		return int(alloc.get("bank", 0)) > 0
	return not result["paid"].has(false) and result["goal_met"]


static func _sum(alloc: Dictionary) -> int:
	var s: int = 0
	for k in alloc:
		s += int(alloc[k])
	return s
