class_name InteractionManager
extends Node
## InteractionManager — tracks every Interaction currently in range of the
## player and routes the "interact" input to the nearest one. Attached as
## a child of Player (see Player.gd); not an autoload, since interaction
## range is a per-scene, per-player concern, not global state.
##
## Mobile-friendly by design: on touchscreens, a lesson scene can also call
## try_interact() directly from an on-screen "Talk" button tap instead of a
## keyboard "interact" key — the same entry point serves both input modes,
## so mobile never gets a worse or different interaction model than desktop.

signal nearest_interaction_changed(interaction: Interaction)

var _in_range: Array[Interaction] = []


func register(interaction: Interaction) -> void:
	if not _in_range.has(interaction):
		_in_range.append(interaction)
		nearest_interaction_changed.emit(get_nearest())


func unregister(interaction: Interaction) -> void:
	_in_range.erase(interaction)
	nearest_interaction_changed.emit(get_nearest())


func get_nearest() -> Interaction:
	return _in_range[0] if _in_range.size() > 0 else null


## Call this from an "interact" input action OR directly from a mobile
## on-screen button — both paths are equally first-class.
func try_interact() -> void:
	var nearest: Interaction = get_nearest()
	if nearest:
		nearest.interact()
