class_name VirtualMoney
extends RefCounted
## VirtualMoney — a small, explicit wrapper around the child's in-game
## coin balance.
##
## This is the ONLY place balances are stored and changed. It exists
## specifically so that "this is fictional money, not real money" is a
## structural fact of the codebase, not just a UI label someone could
## forget to add: there is no network call anywhere in this class, no
## concept of a real currency code, and every formatted string routes
## through a translation key that always says "virtual" (see
## Localization.t("money.virtual_coins", {"amount": ...})), matching the
## brief's explicit example ("5 lei virtuali", not language that could
## read as real earned money).
##
## Mirrors the SPIRIT of the website's walletBalanceMinorUnits (always a
## plain integer, never a float, to avoid rounding surprises) without
## reusing "minor units" terminology, since there is no real currency
## conversion involved here at all — it's just coins.

var balance: int = 0


func add(amount: int) -> void:
	if amount < 0:
		push_warning("VirtualMoney.add() called with a negative amount; use spend() instead")
		return
	balance += amount


## Returns true if the spend succeeded (sufficient balance), false
## otherwise — callers must check the return value rather than assuming
## success, the same "can this choice actually happen" check a mini-game
## needs before letting a child pick an option that costs coins.
func spend(amount: int) -> bool:
	if amount < 0:
		push_warning("VirtualMoney.spend() called with a negative amount")
		return false
	if amount > balance:
		return false
	balance -= amount
	return true


func can_afford(amount: int) -> bool:
	return amount <= balance


## Always use this (or the equivalent translation key directly) to display
## a balance — never print a bare number next to a coin icon with no
## "virtual" qualifier anywhere on screen.
func formatted() -> String:
	return Localization.tn("money.virtual_coins", balance)
