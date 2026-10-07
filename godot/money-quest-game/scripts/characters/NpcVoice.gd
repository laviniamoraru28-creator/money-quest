class_name NpcVoice
extends RefCounted
## NpcVoice — what a character says (or just does) when the child comes
## near, based on what has actually happened between them. Replaces
## one-size-fits-all lines ("Hello again!") with a little memory:
##
##   first meeting       their own short hello            ("first")
##   after you bought    something about what you bought  ("after_buy")
##   sees your things    a comment on something you own   ("sees")
##   coming back         one "welcome back" line, once    ("back")
##   otherwise           a gesture only — a wave, a nod, a happy bounce —
##                       never the same words again and again
##
## Personality is data: each character's lines and their usual gesture
## (a zone registers them, e.g. MarketTownFlow.VOICES). A character with
## no voice data keeps the old behaviour (a wave, plus its zone's
## call-out line if any). Memory is local (ProgressManager activity state
## "npc_voice"), and nothing here speaks during a Play & Learn activity or
## in Focus Mode — then they only gesture (NPC._calm_moment).
##
## Voice data, per npc_id:
##   "gesture":   "both_wave" | "nod" | "happy" | "wave"   (their greeting)
##   "shop":      a shop id — "after_buy" fires after buying there
##   "first", "back", "after_buy":  translation keys
##   "sees":      {item_id: key} — said once when the child owns the item
##   "talk":      {item_id: key} — what they say when talked to, if the
##                child owns the item (otherwise their usual card line)

const STATE: String = "npc_voice"

static var _voices: Dictionary = {}


static func register(map: Dictionary) -> void:
	for id in map:
		_voices[id] = map[id]


static func has_voice(npc_id: String) -> bool:
	return _voices.has(npc_id)


static func gesture(npc_id: String) -> String:
	return String(_voices.get(npc_id, {}).get("gesture", ""))


## The line for this approach (a translation key), or "" for a gesture
## only. Updates the character's memory.
static func approach(npc_id: String) -> String:
	var v: Dictionary = _voices.get(npc_id, {})
	if v.is_empty():
		return ""
	var met: bool = _recall(npc_id, "met", false)
	_remember(npc_id, "met", true)
	if not met:
		# Meeting someone who already sees something of yours: that comes first.
		var seen: String = _sees(npc_id, v)
		return seen if not seen.is_empty() else String(v.get("first", ""))
	if v.has("shop"):
		var bought: int = int(ProgressManager.get_activity_state("shop:" + String(v["shop"]), "bought", 0))
		if bought > int(_recall(npc_id, "ack_bought", 0)):
			_remember(npc_id, "ack_bought", bought)
			if v.has("after_buy"):
				return String(v["after_buy"])
	var seen2: String = _sees(npc_id, v)
	if not seen2.is_empty():
		return seen2
	if v.has("back") and not _recall(npc_id, "said_back", false):
		_remember(npc_id, "said_back", true)
		return String(v["back"])
	return ""


static func _sees(npc_id: String, v: Dictionary) -> String:
	var sees: Dictionary = v.get("sees", {})
	for item in sees:
		if ProgressManager.owns(item) and not _recall(npc_id, "saw:" + item, false):
			_remember(npc_id, "saw:" + item, true)
			return String(sees[item])
	return ""


## Characters take turns: one remembered line at a time across the whole
## place (never three people talking at once on arrival).
const TURN_SECONDS: float = 6.0
static var _last_line_ms: int = -100000


static func my_turn() -> bool:
	return Time.get_ticks_msec() - _last_line_ms >= int(TURN_SECONDS * 1000.0)


static func took_turn() -> void:
	_last_line_ms = Time.get_ticks_msec()


## The card line when talked to, if something the child owns changes it.
static func talk_key(npc_id: String) -> String:
	var talk: Dictionary = _voices.get(npc_id, {}).get("talk", {})
	for item in talk:
		if ProgressManager.owns(item):
			return String(talk[item])
	return ""


static func _recall(npc_id: String, key: String, default: Variant) -> Variant:
	return ProgressManager.get_activity_state(STATE, npc_id + "." + key, default)


static func _remember(npc_id: String, key: String, value: Variant) -> void:
	ProgressManager.set_activity_state(STATE, npc_id + "." + key, value)
