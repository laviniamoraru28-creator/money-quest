class_name CharacterBehaviour
extends RefCounted
## CharacterBehaviour — how a character idles: a small, reusable profile
## that CharacterRig reads. It only changes timing and which quiet idle
## actions a character chooses, never gameplay. Profiles are data: a new
## kind of character is one more entry in PRESETS.
##
##   energy  — breathing / weight-shift speed and amount (1 = standard)
##   glance  — how often and how far they look around
##   actions — idle actions and their weights (see CharacterRig.ACTIONS)
##   every   — seconds between idle actions (a range; one at a time)
##   greet   — how they greet the player: "wave", "nod" or "both" (both
##             hands, a child's excited hello)
##   talk    — talking gestures: "calm" (one hand) or "lively" (both)
##
## Chosen from an NPC's id (role keywords, like CharacterLook) unless the
## NPC sets one explicitly. Idle actions are short (2–4 s), happen one at a
## time, several seconds apart, and pause while the player is close — so a
## room never moves all at once. With Reduced Motion nothing plays.

const PRESETS: Dictionary = {
	"default": {"energy": 1.0, "glance": 1.0, "every": Vector2(8, 14), "greet": "wave", "talk": "calm",
		"actions": [["nod", 1.0], ["gesture", 1.0], ["look_side", 1.5]]},
	"mentor": {"energy": 0.8, "glance": 0.7, "every": Vector2(9, 15), "greet": "nod", "talk": "calm",
		"actions": [["gesture", 3.0], ["hands_behind", 1.5], ["nod", 1.0]]},
	"shopkeeper": {"energy": 1.1, "glance": 1.3, "every": Vector2(6, 11), "greet": "wave", "talk": "lively",
		"actions": [["check_counter", 3.0], ["look_side", 2.0], ["gesture", 1.0]]},
	"child": {"energy": 1.35, "glance": 1.4, "every": Vector2(5, 9), "greet": "both", "talk": "lively",
		"actions": [["bounce", 3.0], ["look_side", 2.0], ["stretch", 1.0]]},
	"librarian": {"energy": 0.8, "glance": 0.6, "every": Vector2(7, 12), "greet": "nod", "talk": "calm",
		"actions": [["read", 4.0], ["adjust_glasses", 1.0], ["nod", 1.0]]},
	"guide": {"energy": 1.0, "glance": 1.2, "every": Vector2(7, 12), "greet": "wave", "talk": "lively",
		"actions": [["point", 3.0], ["look_side", 2.0], ["gesture", 1.0]]},
	"gardener": {"energy": 0.7, "glance": 0.6, "every": Vector2(9, 15), "greet": "nod", "talk": "calm",
		"actions": [["tend", 4.0], ["look_side", 1.0]]},
	## The player's own character: only idles after standing still a while.
	"player": {"energy": 1.0, "glance": 1.0, "every": Vector2(7, 12), "greet": "wave", "talk": "calm",
		"actions": [["look_side", 3.0], ["stretch", 1.0], ["bounce", 1.0]]},
}

var id: String = "default"
var energy: float = 1.0
var glance: float = 1.0
var every: Vector2 = Vector2(8, 14)
var greet: String = "wave"
var talk: String = "calm"
var actions: Array = []
var _total_weight: float = 0.0


static func preset(preset_id: String) -> CharacterBehaviour:
	var b := CharacterBehaviour.new()
	var p: Dictionary = PRESETS.get(preset_id, PRESETS["default"])
	b.id = preset_id if PRESETS.has(preset_id) else "default"
	b.energy = p["energy"]
	b.glance = p["glance"]
	b.every = p["every"]
	b.greet = p["greet"]
	b.talk = p["talk"]
	b.actions = p["actions"]
	for a in b.actions:
		b._total_weight += float(a[1])
	return b


## The profile for an NPC id, from role keywords (same idea as
## CharacterLook.for_npc: appearance and behaviour stay consistent).
static func preset_id_for_npc(npc_id: String) -> String:
	var id := npc_id.to_lower()
	if _has_any(id, ["librar", "bookkeeper", "research", "archiv"]):
		return "librarian"
	if _has_any(id, ["mentor", "coach", "advisor", "teacher", "professor", "elder"]):
		return "mentor"
	if _has_any(id, ["shop", "baker", "trader", "supplier", "stock", "market", "seller", "vendor"]):
		return "shopkeeper"
	if _has_any(id, ["calm", "garden", "grove", "flower", "plant"]):
		return "gardener"
	if _has_any(id, ["guide", "keeper", "museum", "curator"]):
		return "guide"
	if _has_any(id, ["friend", "teammate", "maya", "leah", "theo", "kid", "child", "cousin"]):
		return "child"
	return "default"


## Picks an idle action with a deterministic value r in [0, 1).
func pick(r: float) -> String:
	if actions.is_empty():
		return ""
	var x: float = r * _total_weight
	for a in actions:
		x -= float(a[1])
		if x < 0.0:
			return a[0]
	return actions[-1][0]


static func _has_any(text: String, words: Array) -> bool:
	for w in words:
		if text.contains(w):
			return true
	return false
