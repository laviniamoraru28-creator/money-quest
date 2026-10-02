extends Node3D
## BubbleGarden — Calm World's first garden (see docs/money-quest-world-
## architecture.md Section 7 and the original brief's 8 named Calm World
## concepts). Nothing to tap, nothing to get right or wrong, nothing timed
## — a quiet place to walk around and look at drifting bubbles. Never
## framed as treatment or therapy anywhere in this zone's copy; only ever
## "a calm place to visit."
##
## Always reachable from the Hub with no unlock condition (see
## data/zones/calm-world-bubble-garden.tres — this is the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _bubbles: Array[Node3D] = []
var _base_heights: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	for child in $Bubbles.get_children():
		_bubbles.append(child)
		_base_heights.append(child.position.y)


## Respects reduced_motion exactly like every other animated piece of this
## project (Settings.gd's project-wide rule) — the bubbles simply hold
## still instead of drifting when it's on, so the space stays calm and
## fully present either way, never emptied out to "turn off" the motion.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_bubbles.size()):
		_bubbles[i].position.y = _base_heights[i] + sin(_time * 0.6 + i * 1.3) * 0.4
