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


## Metres of "head start" each priority point is worth when choosing what
## to offer: 10 points ≈ 1.5 m. Relevance and closeness both count, so the
## thing a child is standing right next to wins over something more
## important a few steps away — while a doorway (priority 70) still wins
## whenever the child is inside its reach.
const PRIORITY_METRES: float = 0.15


## The most relevant interactable in reach (priority blended with
## distance, see PRIORITY_METRES). Only the handful currently in range is
## ever considered — nothing is polled world-wide.
func get_nearest() -> Interaction:
	var player := get_parent() as Node3D
	var best: Interaction = null
	var best_score: float = -INF
	for i in _in_range:
		if not is_instance_valid(i):
			continue
		var dist: float = player.global_position.distance_to(i.global_position) if player else 0.0
		var score: float = float(i.interaction_priority) * PRIORITY_METRES - dist
		if score > best_score:
			best_score = score
			best = i
	return best


func has_any() -> bool:
	return not _in_range.is_empty()


## Call this from an "interact" input action OR directly from a mobile
## on-screen button — both paths are equally first-class.
func try_interact() -> void:
	var nearest: Interaction = get_nearest()
	if nearest:
		nearest.interact()
