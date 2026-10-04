extends Node3D
## GoldVault — Museum Room 6: a visually distinct vault room holding one
## real, sourced exhibit on gold's monetary history (project brief
## Section 16). Deliberately explains gold's historical role without
## ever framing it as good investment advice — the brief's own explicit
## boundary. No mini-game here; the room is exploration-only, matching
## the brief's "visually impressive but simple."

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
