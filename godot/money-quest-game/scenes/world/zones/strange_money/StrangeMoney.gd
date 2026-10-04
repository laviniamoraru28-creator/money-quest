extends Node3D
## StrangeMoney — Museum Room 3: 2 real, sourced exhibits on unusual
## historical forms of money (project brief Section 13). Gentle humor is
## used in the copy itself (translation keys), never distorting the
## facts — see the brief's own "Would YOU carry this to the shop?"
## example. No quiz here either; the room is exploration-only.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
