extends Node3D
## FirstCoins — Museum Room 2: one real, sourced exhibit on the
## earliest known coins (project brief Section 12). No mini-game here on
## purpose — inspecting the exhibit card IS the "pick up and look
## closer" moment (the same honest simplification BookCardPanel/
## MentorCardPanel already use in place of literal 3D object rotation);
## not every Museum room needs a quest (project brief's own "do not make
## every interaction into a quiz").

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
