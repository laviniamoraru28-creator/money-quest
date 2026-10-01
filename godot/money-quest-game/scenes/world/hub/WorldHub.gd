extends Node3D
## WorldHub — the plaza connecting all 7 Money Quest World destinations
## (see docs/money-quest-world-architecture.md Section 2). Not a menu with
## seven buttons: a real place the player walks around, with one portal
## per destination — 1 functional (Money Quest, leading into Golden Vault)
## and 6 "coming soon" for destinations not built yet.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
