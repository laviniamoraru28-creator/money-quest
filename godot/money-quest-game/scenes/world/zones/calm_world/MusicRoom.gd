extends Node3D
## MusicRoom — one of Calm World's 8 named gardens (see docs/money-quest-
## world-architecture.md Section 7). Soft note-shaped forms drift and turn
## slowly in place; purely visual — AudioManager ships no audio assets, so
## nothing here implies real sound. Nothing to tap, nothing timed, nothing
## to get right or wrong. Never framed as treatment or therapy — "a calm
## place to visit," same as every other Calm World garden.
##
## Reachable from Bubble Garden with no unlock condition (the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController

var _notes: Array[Node3D] = []
var _base_heights: Array[float] = []
var _phases: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	var i := 0
	for child in $Notes.get_children():
		_notes.append(child)
		_base_heights.append(child.position.y)
		_phases.append(i * 1.2)
		i += 1


## Respects reduced_motion exactly like every other Calm World garden —
## the notes simply hold their authored position and angle instead of
## drifting and turning when it's on.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_notes.size()):
		var note: Node3D = _notes[i]
		note.position.y = _base_heights[i] + sin(_time * 0.5 + _phases[i]) * 0.3
		note.rotate_y(delta * 0.3)
