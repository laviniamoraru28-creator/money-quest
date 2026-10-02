extends Node3D
## RainRoom — one of Calm World's 8 named gardens (see docs/money-quest-
## world-architecture.md Section 7). Soft raindrops drift gently downward
## and loop; nothing to tap, nothing timed, nothing to get right or wrong.
## Never framed as treatment or therapy — "a calm place to visit," same as
## every other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

const TOP_HEIGHT: float = 4.0
const GROUND_HEIGHT: float = 0.3
const FALL_RANGE: float = TOP_HEIGHT - GROUND_HEIGHT

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _drops: Array[Node3D] = []
var _phases: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	var i := 0
	for child in $Raindrops.get_children():
		_drops.append(child)
		_phases.append(i * 0.6)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the raindrops simply hold their authored height instead of falling
## when it's on, becoming a still, frozen-rain scene.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_drops.size()):
		var t: float = fmod(_time * 0.8 + _phases[i], FALL_RANGE)
		var pos: Vector3 = _drops[i].position
		_drops[i].position = Vector3(pos.x, TOP_HEIGHT - t, pos.z)
