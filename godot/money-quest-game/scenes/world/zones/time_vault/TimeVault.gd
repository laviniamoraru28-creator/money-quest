extends Node3D
## TimeVault — a small room off the Golden Vault where time can be sped up:
## the first "gold standard" interaction (TimeVaultFlow). The room itself
## only frames it: the camera follows the player, the dressing gives it the
## Golden Vault's look, and the flow places everything the child uses.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
