extends Node3D
## AquariumRoom — one of Calm World's 8 named gardens (see docs/money-quest-
## world-architecture.md Section 7). Soft fish shapes glide in slow circles
## at different heights; nothing to tap, nothing timed, nothing to get
## right or wrong. Never framed as treatment or therapy — "a calm place
## to visit," same as every other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _fish: Array[Node3D] = []
var _centers: Array[Vector3] = []
var _radii: Array[float] = []
var _heights: Array[float] = []
var _phases: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	var i := 0
	for child in $Fish.get_children():
		_fish.append(child)
		var p: Vector3 = child.position
		var radius: float = 1.1 + float(i % 3) * 0.7
		_radii.append(radius)
		_heights.append(p.y)
		_centers.append(Vector3(p.x, 0.0, p.z))
		_phases.append(i * 1.15)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the fish simply hold their authored resting position instead of
## circling when it's on.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_fish.size()):
		var angle: float = _time * 0.35 + _phases[i]
		var c: Vector3 = _centers[i]
		var r: float = _radii[i]
		_fish[i].position = Vector3(c.x + cos(angle) * r, _heights[i], c.z + sin(angle) * r)
