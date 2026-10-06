extends Node
## ObjectiveManager — "what am I doing right now?" for the whole game.
##
## One current objective at a time: a short, child-friendly line ("Find
## the Savings Guide", "Find 3 coins (1/3)") from a translation key, plus an
## optional target in the world (a node) that the guidance system can lead
## to. A zone's own flow script sets it (see GoldenVaultFlow); the HUD
## shows it, the help panel repeats it, and narration can read it aloud.
## "Also try" lines list optional things to do, so the player always knows
## there is more to explore without being pushed down a corridor.
##
## Objectives describe the current zone visit; they are cleared when the
## zone changes (the next zone's flow sets its own). Progress that must
## survive (coins found, activities done) lives in ProgressManager, so a
## flow can always rebuild the right objective after a reload.

signal objective_changed
signal objective_completed(objective_id: String)

var objective_id: String = ""
var text_key: String = ""
var params: Dictionary = {}
var _target: WeakRef = null
var optional: Array = []      # [{"text_key": String, "params": Dictionary}]
## A short how-to line under the mission ("Move:  WASD / arrows"), used to
## teach a control at the moment it is needed. Empty = none.
var tip_text: String = ""
## What the player has learned in this place (translation keys), for the
## help panel's "What you learned" list.
var learned: Array[String] = []


func _ready() -> void:
	_connect_world.call_deferred()


func _connect_world() -> void:
	WorldManager.zone_change_requested.connect(func(_z): clear())


func has_objective() -> bool:
	return not objective_id.is_empty()


## Sets the current objective. Setting the same id again just updates
## the text/params (e.g. a counter) without announcing a new mission.
func set_objective(id: String, key: String, key_params: Dictionary = {}, target: Node3D = null) -> void:
	var is_new: bool = id != objective_id
	objective_id = id
	text_key = key
	params = key_params
	_target = weakref(target) if target else null
	objective_changed.emit()
	if is_new:
		AudioManager.narrate(text())


func set_optional(lines: Array) -> void:
	optional = lines
	objective_changed.emit()


## Marks the current objective done (only if it is still `id`).
func complete(id: String) -> void:
	if id != objective_id:
		return
	clear()
	objective_completed.emit(id)


func clear() -> void:
	objective_id = ""
	text_key = ""
	params = {}
	_target = null
	optional = []
	tip_text = ""
	learned = []
	objective_changed.emit()


## Shows (or clears, with "") the how-to line under the mission.
func set_tip(text: String) -> void:
	if text == tip_text:
		return
	tip_text = text
	objective_changed.emit()


func set_learned(keys: Array[String]) -> void:
	learned = keys
	objective_changed.emit()


func text() -> String:
	return Localization.t(text_key, params) if not text_key.is_empty() else ""


func target() -> Node3D:
	var t: Object = _target.get_ref() if _target else null
	return t as Node3D if is_instance_valid(t) else null


func optional_texts() -> PackedStringArray:
	var out := PackedStringArray()
	for line in optional:
		out.append(Localization.t(line["text_key"], line.get("params", {})))
	return out
