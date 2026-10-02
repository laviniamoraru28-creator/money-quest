extends Node3D
## LightRoom — one of Calm World's 8 named gardens (see docs/money-quest-
## world-architecture.md Section 7). Warm glowing lanterns breathe softly
## in place; nothing to tap, nothing timed, nothing to get right or wrong.
## Never framed as treatment or therapy — "a calm place to visit," same as
## every other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _lanterns: Array[Node3D] = []
var _base_scales: Array[Vector3] = []
var _phases: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	var i := 0
	for child in $Lanterns.get_children():
		_lanterns.append(child)
		_base_scales.append(child.scale)
		_phases.append(i * 1.4)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the lanterns simply hold their authored size instead of breathing
## when it's on.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_lanterns.size()):
		var pulse: float = 1.0 + sin(_time * 0.5 + _phases[i]) * 0.12
		_lanterns[i].scale = _base_scales[i] * pulse
