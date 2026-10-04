extends Node3D
## MindLabDiscoveryRoom — Mind Lab's final room (Mind Lab Section 1,
## room 10): 4 real "mind fact" entries (attention, working memory,
## cognitive flexibility, confirmation bias — project brief Section 5),
## each in plain child-friendly language with no invented study,
## researcher, or statistic. Exploration-only, like the Museum's
## exhibit-only rooms — no quiz, no NPC, no forced interaction. The last
## room in Mind Lab's own portal chain (Hub portal only, no portal
## onward).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
