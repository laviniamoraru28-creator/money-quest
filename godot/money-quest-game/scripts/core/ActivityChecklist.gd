class_name ActivityChecklist
extends RefCounted
## ActivityChecklist — the standard every major activity must meet before
## it counts as done (docs/activity-quality-checklist.md). Each activity's
## ActivitySpec answers every criterion: "auto" (an automated test proves
## it — see the activity's harness), "manual: ..." (a person judged it,
## with a note), "pending: ..." (still to be judged, e.g. with children),
## or empty (not looked at). An activity is complete only when nothing is
## empty or pending.

const CRITERIA: Array[Dictionary] = [
	{"id": "objective_without_reading", "q": "Can the player understand the objective without reading?"},
	{"id": "complete_without_speaking", "q": "Can the player complete it without speaking?"},
	{"id": "complete_without_hearing", "q": "Can the player complete it without hearing?"},
	{"id": "success_visible", "q": "Can the player understand success visually?"},
	{"id": "failure_visible", "q": "Can the player understand failure (not yet) visually?"},
	{"id": "retry", "q": "Can the player retry?"},
	{"id": "what_changed", "q": "Can the player understand what changed?"},
	{"id": "compare_alternatives", "q": "Can the player compare alternatives?"},
	{"id": "competency_levels", "q": "Does it work at different competency levels?"},
	{"id": "teaches_something_useful", "q": "Does it teach something useful?"},
	{"id": "fun", "q": "Is it actually fun? (Would it still be fun without the explanation?)"},
	{"id": "reduced_motion", "q": "Does Reduced Motion work?"},
	{"id": "muted", "q": "Does muted mode work?"},
	{"id": "words_off", "q": "Does Words Off work?"},
	{"id": "keyboard", "q": "Does keyboard work?"},
	{"id": "gamepad", "q": "Does gamepad work?"},
	{"id": "mouse_touch", "q": "Do mouse and touch work?"},
]


## Criteria the spec has not answered yet.
static func missing(spec: ActivitySpec) -> Array[String]:
	var out: Array[String] = []
	for c in CRITERIA:
		if String(spec.checklist.get(c["id"], "")).strip_edges().is_empty():
			out.append(c["id"])
	return out


## Criteria answered "pending: ..." (to be judged by people later).
static func pending(spec: ActivitySpec) -> Array[String]:
	var out: Array[String] = []
	for c in CRITERIA:
		if String(spec.checklist.get(c["id"], "")).begins_with("pending"):
			out.append(c["id"])
	return out


static func is_complete(spec: ActivitySpec) -> bool:
	return missing(spec).is_empty() and pending(spec).is_empty()


## A readable report (for reviews and test logs).
static func report(spec: ActivitySpec) -> String:
	var lines: PackedStringArray = ["Activity: %s  (competencies: %s)" % [spec.activity_id, ", ".join(spec.competencies)]]
	for c in CRITERIA:
		var a: String = String(spec.checklist.get(c["id"], ""))
		lines.append("  [%s] %s %s" % ["x" if not a.is_empty() else " ", c["q"], ("— " + a) if not a.is_empty() else "— NOT ANSWERED"])
	return "\n".join(lines)
