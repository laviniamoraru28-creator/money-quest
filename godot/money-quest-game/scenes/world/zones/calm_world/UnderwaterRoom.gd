extends Node3D
## UnderwaterRoom — one of Calm World's 8 named gardens (see docs/money-
## quest-world-architecture.md Section 7). Tall kelp sways gently in place;
## nothing to tap, nothing timed, nothing to get right or wrong. Never
## framed as treatment or therapy — "a calm place to visit," same as every
## other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _kelp: Array[Node3D] = []
var _base_rotations: Array[float] = []
var _phases: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	var i := 0
	for child in $Kelp.get_children():
		_kelp.append(child)
		_base_rotations.append(child.rotation.z)
		_phases.append(i * 1.3)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the kelp simply holds its authored upright angle instead of swaying
## when it's on.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_kelp.size()):
		var sway: float = sin(_time * 0.4 + _phases[i]) * 0.12
		var rot: Vector3 = _kelp[i].rotation
		_kelp[i].rotation = Vector3(rot.x, rot.y, _base_rotations[i] + sway)
