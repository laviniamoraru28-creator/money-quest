class_name WhatIf
extends RefCounted
## WhatIf — "what if you had chosen the other way?" for any decision:
## shopping, budgeting, saving, business, credit, risk, life choices.
##
## An activity describes two outcomes as pictures (and can simulate the
## second one without replaying it):
##
##   var a := WhatIf.outcome(["jar", "num:4", "vault", "num:8"],      ← your choice
##                           [["coins", "num:20"], ["bike", "tick"]]) ← what happened
##   var b := WhatIf.outcome(["jar", "num:0", "vault", "num:12"], [...])
##   var answer: String = await WhatIf.compare(self, a, b)
##
## The card shows A (your face) and B (a "?" face) side by side; result
## rows that differ are marked so the difference is the first thing seen.
## Answers: "again" (try again, your own way), "other" (play choice B),
## "done". Words are optional; no answer is "right" — it is a comparison.
##
## `history` keeps this session's outcomes per activity, so a later card
## can compare "last time" with "this time".

static var history: Dictionary = {}   # activity id -> Array of outcomes


static func outcome(choice_tokens: Array, result_rows: Array, params: Dictionary = {}) -> Dictionary:
	return {"choice": choice_tokens, "results": result_rows, "params": params}


static func remember(activity_id: String, o: Dictionary) -> void:
	if not history.has(activity_id):
		history[activity_id] = []
	history[activity_id].append(o)


static func last(activity_id: String, back: int = 1) -> Dictionary:
	var h: Array = history.get(activity_id, [])
	return h[h.size() - back] if h.size() >= back else {}


## Shows the comparison; returns "again", "other" or "done".
static func compare(host: Node, a: Dictionary, b: Dictionary, allow_other: bool = true) -> String:
	var card := WhatIfCard.new()
	card.a = a
	card.b = b
	card.allow_other = allow_other
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	(hud if hud else host.get_tree().current_scene).add_child(card)
	return await card.answered


## Which result rows differ between a and b (indices).
static func differences(a: Dictionary, b: Dictionary) -> Array:
	var out: Array = []
	var ra: Array = a.get("results", [])
	var rb: Array = b.get("results", [])
	for i in maxi(ra.size(), rb.size()):
		if i >= ra.size() or i >= rb.size() or ra[i] != rb[i]:
			out.append(i)
	return out
