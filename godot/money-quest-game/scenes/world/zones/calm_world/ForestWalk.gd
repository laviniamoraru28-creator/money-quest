extends Node3D
## ForestWalk — one of Calm World's 8 named gardens (see docs/money-quest-
## world-architecture.md Section 7). Tree canopies sway gently in place;
## nothing to tap, nothing timed, nothing to get right or wrong. Never
## framed as treatment or therapy — "a calm place to visit," same as every
## other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _canopies: Array[Node3D] = []
var _base_rotations: Array[float] = []
var _phases: Array[float] = []
var _time: float = 0.0
## A kit crown turns about the foot of its tree, so it needs a smaller angle
## than a sphere turning about its own middle.
const KIT_SWAY: float = 0.018
var _sway: float = 0.08


func _ready() -> void:
	camera_controller.target = player
	var kit_crowns: Array[Node] = $CozySlots.find_children("EX_*Leaves*", "Node3D", true, false)
	if kit_crowns.is_empty():
		for tree in $Trees.get_children():
			kit_crowns.append(tree.get_node("Canopy"))
	else:
		$Trees.visible = false
		_sway = KIT_SWAY
	var i := 0
	for crown in kit_crowns:
		_canopies.append(crown as Node3D)
		_base_rotations.append((crown as Node3D).rotation.z)
		_phases.append(i * 1.6)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the canopies simply hold their authored angle instead of swaying when
## it's on.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_canopies.size()):
		var sway: float = sin(_time * 0.3 + _phases[i]) * _sway
		var rot: Vector3 = _canopies[i].rotation
		_canopies[i].rotation = Vector3(rot.x, rot.y, _base_rotations[i] + sway)
