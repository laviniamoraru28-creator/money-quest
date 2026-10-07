extends Node
## GameState — the live, in-memory runtime state for the current play
## session: the child's virtual wallet, XP, selected age band, and which
## lesson is currently active.
##
## This is the Godot analogue of the "live" half of the website's
## LocalProgressState — the half that changes constantly during play.
## The "what has been completed, ever" half lives in ProgressManager.
## SaveManager is the only thing that reads AND writes both of these to
## disk; everything else only mutates GameState/ProgressManager in memory
## and lets SaveManager persist the result.

signal xp_changed(new_total: int)
signal coins_changed(new_balance: int)

## "explorer" | "builder" | "strategist" — matches AgeBand in the
## website's src/types/database.types.ts exactly, same 3 values.
var age_band: String = "builder"

var wallet: VirtualMoney = VirtualMoney.new()
var xp_total: int = 0

## The lesson id currently loaded, e.g. "builder-saving-l1" — null when on
## the world map / main menu.
var current_lesson_id: String = ""


func add_xp(amount: int) -> void:
	if amount <= 0:
		return
	xp_total += amount
	xp_changed.emit(xp_total)


func add_coins(amount: int) -> void:
	wallet.add(amount)
	coins_changed.emit(wallet.balance)


## Spends virtual coins if the child has enough — the only way the world
## takes coins away (shops call this through Shop.buy). Returns false and
## changes nothing when the balance is too low. Educational virtual money
## only: nothing here is, or ever touches, real money.
func spend_coins(amount: int) -> bool:
	if not wallet.spend(amount):
		return false
	coins_changed.emit(wallet.balance)
	return true


func can_afford(amount: int) -> bool:
	return amount >= 0 and wallet.can_afford(amount)


## Mirrors computeLevel() in the website's local-progress/state.ts exactly
## (floor(xp/100)+1) so a level earned on the website and a level earned
## in Godot mean the same thing conceptually, even though progress is not
## currently synced between the two (see docs/godot-architecture-plan.md
## Section 10 — no cross-save exists yet, this is intentional parity only).
func compute_level() -> int:
	return int(floor(xp_total / 100.0)) + 1
