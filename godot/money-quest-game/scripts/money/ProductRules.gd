class_name ProductRules
extends RefCounted
## ProductRules — how each kind of (virtual) place for money behaves, as
## data. A product is a game simulation rule, never a real product: real
## products and their facts live in FinanceLocale and the optional MORE
## layers. Every account in MoneyLife points at one of these.
##
##   growth   "none"      the money stays exactly as it is (cash, a piggy
##                        bank, a current account: most accounts do NOT grow)
##            "rate"      grows by a simulated yearly rate, credited as whole
##                        coins (the part of a coin not yet earned is kept
##                        and shown as "coming")
##            "variable"  may go up OR down (future investing; not offered
##                        anywhere yet — available: false)
##   access   "open"      take money out any time
##            "locked"    only after the account's lock period has passed
##   fee      a monthly fee in coins (structure for later; none use it yet)
##
## The game calendar is simple on purpose: 7 days a week, 30 a month, 360 a
## year. Nothing here knows about real dates or real time.

const DAYS_PER_WEEK: int = 7
const DAYS_PER_MONTH: int = 30
const DAYS_PER_YEAR: int = 360

const RULES: Dictionary = {
	"cash": {"growth": "none", "access": "open", "icon": "coin"},
	"home_piggy": {"growth": "none", "access": "open", "icon": "piggy"},
	"home_jar": {"growth": "none", "access": "open", "icon": "jar"},
	"current_basic": {"growth": "none", "access": "open", "icon": "card"},
	"easy_saver": {"growth": "rate", "yearly": 0.03, "access": "open", "icon": "bank"},
	"locked_saver": {"growth": "rate", "yearly": 0.06, "access": "locked", "icon": "vault"},
	"business_basic": {"growth": "none", "access": "open", "icon": "box"},
	# Future: value may rise or fall. Defined so the model is complete; no
	# place offers it yet.
	"growth_fund": {"growth": "variable", "yearly": 0.05, "swing": 0.15, "access": "open", "icon": "growth", "available": false},
}


static func rule(product: String) -> Dictionary:
	return RULES.get(product, RULES["cash"])


static func has(product: String) -> bool:
	return RULES.has(product)


static func grows(product: String) -> bool:
	return String(rule(product)["growth"]) != "none"


static func yearly_rate(product: String) -> float:
	return float(rule(product).get("yearly", 0.0))


static func is_locked_product(product: String) -> bool:
	return String(rule(product)["access"]) == "locked"


## How much the money changes over `days` (a float; MoneyBook credits whole
## coins and keeps the rest). `seed` makes "variable" products repeatable.
static func growth_delta(product: String, balance: int, days: int, seed: int = 0) -> float:
	var r: Dictionary = rule(product)
	if balance <= 0 or days <= 0:
		return 0.0
	match String(r["growth"]):
		"rate":
			return float(balance) * (pow(1.0 + float(r["yearly"]), float(days) / DAYS_PER_YEAR) - 1.0)
		"variable":
			var rng := RandomNumberGenerator.new()
			rng.seed = seed
			var yearly: float = float(r["yearly"]) + rng.randf_range(-float(r["swing"]), float(r["swing"]))
			return float(balance) * (pow(1.0 + yearly, float(days) / DAYS_PER_YEAR) - 1.0)
	return 0.0


## A picture-sized summary for places in the world: 0 = stays the same,
## 1 = grows a little, 2 = grows more, -1 = may go up or down.
static func badge(product: String) -> int:
	var r: Dictionary = rule(product)
	match String(r["growth"]):
		"rate":
			return 2 if float(r["yearly"]) >= 0.05 else 1
		"variable":
			return -1
	return 0
