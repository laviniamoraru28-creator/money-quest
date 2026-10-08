class_name Competency
extends RefCounted
## Competency — what a child can do, skill by skill, tracked quietly
## (never shown as badges, never sent anywhere). Progression follows
## demonstrated ability, not age: a child can be at "plan" in saving and
## at "recognize" in percentages at the same time.
##
## The ladder (1..8):
##   recognize → choose → compare → apply → plan → solve → transfer → create
##
## Each activity declares what it develops (ActivitySpec.competencies) and
## asks for its challenge level (challenge_level). When the child finishes
## something, the activity records evidence:
##
##   "independent"          done without help at this level
##   "supported"            done with extra help (guidance grew, strong
##                          guidance setting, a hint was taken)
##   "after_retry"          done after trying again
##   "after_demonstration"  done after watching someone do it first
##
## Level rule (simple on purpose, can grow later):
##   - independent success at the current level → next level;
##   - two successes after a retry at the current level → next level;
##   - supported / after a demonstration → stays (the child is still
##     building it); the evidence is kept;
##   - levels never go down (a hard day is not a lost skill).
##
## Stored in ProgressManager.activity_state["competency"] (saved locally).
## Nothing here knows about any activity.

const STATE: String = "competency"
const MAX_LEVEL: int = 8

const LADDER: Array[String] = ["recognize", "choose", "compare", "apply", "plan", "solve", "transfer", "create"]

const ALL: Array[String] = [
	"financial_literacy", "numeracy", "problem_solving", "critical_thinking",
	"decision_making", "planning", "prioritisation", "communication",
	"cooperation", "empathy", "creativity", "adaptability", "resilience",
	"organisation", "digital_literacy", "ai_literacy", "online_safety",
	"consumer_awareness", "entrepreneurship", "emotional_awareness",
	"self_regulation", "risk_awareness",
]

const EVIDENCE: Array[String] = ["independent", "supported", "after_retry", "after_demonstration"]

## Every declared activity, by id (for audits and the quality checklist).
static var _activities: Dictionary = {}


static func register_activity(spec: ActivitySpec) -> void:
	_activities[spec.activity_id] = spec


static func activities() -> Dictionary:
	return _activities


## 1..8 for this competency (1 = recognize).
static func level(id: String) -> int:
	return clampi(int(_entry(id).get("level", 1)), 1, MAX_LEVEL)


static func ladder_name(lvl: int) -> String:
	return LADDER[clampi(lvl, 1, MAX_LEVEL) - 1]


## The level an activity should be played at: its primary competency's
## level (or the lowest of the ones it lists).
static func challenge_level(spec: ActivitySpec) -> int:
	if spec == null:
		return 1
	if not spec.primary_competency.is_empty():
		return level(spec.primary_competency)
	var lo: int = MAX_LEVEL
	for c in spec.competencies:
		lo = mini(lo, level(c))
	return lo if not spec.competencies.is_empty() else 1


## Records one finished attempt at `at_level` for every competency the
## activity develops. Returns true if any level went up.
static func record(spec: ActivitySpec, evidence: String, at_level: int) -> bool:
	if spec == null or not EVIDENCE.has(evidence):
		return false
	var rose: bool = false
	for id in spec.competencies:
		var e: Dictionary = _entry(id).duplicate()
		var lvl: int = clampi(int(e.get("level", 1)), 1, MAX_LEVEL)
		e[evidence] = int(e.get(evidence, 0)) + 1
		e["last"] = spec.activity_id
		if at_level >= lvl and lvl < MAX_LEVEL:
			match evidence:
				"independent":
					lvl += 1
					e["retry_streak"] = 0
					rose = true
				"after_retry":
					e["retry_streak"] = int(e.get("retry_streak", 0)) + 1
					if int(e["retry_streak"]) >= 2:
						lvl += 1
						e["retry_streak"] = 0
						rose = true
		e["level"] = lvl
		ProgressManager.set_activity_state(STATE, id, e)
	return rose


## Evidence counts for one competency (for tests and future reports).
static func evidence(id: String) -> Dictionary:
	var out := {}
	var e: Dictionary = _entry(id)
	for k in EVIDENCE:
		out[k] = int(e.get(k, 0))
	return out


static func _entry(id: String) -> Dictionary:
	var v: Variant = ProgressManager.get_activity_state(STATE, id, {})
	return v if v is Dictionary else {}
