class_name InfoLayers
extends RefCounted
## InfoLayers — three layers of information for every topic, so a child
## who wants to play never has to read a textbook, and a child who wants
## to know more can go deeper:
##
##   LAYER 1  gameplay: pictures, objects, actions, a word or two at most.
##            Required to play — and never needs layers 2 or 3.
##   LAYER 2  a short, simple explanation (one or two sentences). Optional.
##   LAYER 3  deep knowledge: the longer explanation, the real-world
##            details, and a link to keep it in the Library. Optional.
##
## Layers 2 and 3 open from a "More" place in the world (an InfoStand) or a
## "More" button, on MoreCard (with Listen). A finance topic takes its
## layers from FinanceLocale, so each country gets its real product's
## facts, or the plain concept where no product exists.
##
## Topics: {id: {"icon", "concept"} or {"icon", "short_key", "deep_keys"}}.
## "Keep in the Library" bookmarks a topic (ProgressManager); the Library's
## shelf of kept topics opens them again (Library.gd).

const BOOKMARKS_STATE: String = "library"
const BOOKMARKS_KEY: String = "kept_topics"

const TOPICS: Dictionary = {
	"long_term_saving": {"concept": "locked_long_term_saving"},
	"instant_saving": {"concept": "instant_access_saving"},
	"cash_at_home": {"concept": "cash_at_home"},
}


## Topics added while playing (e.g. each visual-first lesson registers its
## own: its key concept as layer 2, its original full explanation as layer
## 3 — so the long text stays available, only no longer required).
static var _registered: Dictionary = {}


static func register_topic(topic: String, data: Dictionary) -> void:
	_registered[topic] = data


static func _topic(topic: String) -> Dictionary:
	return TOPICS.get(topic, _registered.get(topic, {}))


static func has_topic(topic: String) -> bool:
	return TOPICS.has(topic) or _registered.has(topic)


static func icon(topic: String) -> String:
	var t: Dictionary = _topic(topic)
	if t.has("concept"):
		return FinanceLocale.icon(t["concept"])
	return String(t.get("icon", "book"))


static func title_key(topic: String) -> String:
	var t: Dictionary = _topic(topic)
	if t.has("concept"):
		return FinanceLocale.name_key(t["concept"])
	return String(t.get("title_key", ""))


static func short_key(topic: String) -> String:
	var t: Dictionary = _topic(topic)
	if t.has("concept"):
		return FinanceLocale.short_key(t["concept"])
	return String(t.get("short_key", ""))


static func deep_keys(topic: String) -> Array:
	var t: Dictionary = _topic(topic)
	if t.has("concept"):
		return FinanceLocale.deep_keys(t["concept"])
	return t.get("deep_keys", [])


## Opens layers 2 and 3 for `topic` (MoreCard). Await `closed` if needed.
static func open(host: Node, topic: String) -> MoreCard:
	var card := MoreCard.new()
	card.topic = topic
	var hud: Node = host.get_tree().get_first_node_in_group("mq_hud")
	(hud if hud else host.get_tree().current_scene).add_child(card)
	return card


static func keep_in_library(topic: String) -> void:
	var kept: Array = kept_topics()
	if not kept.has(topic):
		kept.append(topic)
		ProgressManager.set_activity_state(BOOKMARKS_STATE, BOOKMARKS_KEY, kept)


static func kept_topics() -> Array:
	var v: Variant = ProgressManager.get_activity_state(BOOKMARKS_STATE, BOOKMARKS_KEY, [])
	return (v as Array).duplicate() if v is Array else []
