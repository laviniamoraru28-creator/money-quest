extends Node3D
## MoneyAroundTheWorld — Museum Room 7: 5 real, sourced "currency stand"
## exhibits (project brief Section 17). Simplified from the brief's own
## suggested interactive globe/map to a row of inspectable stands, each
## covering one real currency's stable, historical/etymological facts
## (never a live exchange rate, which would go stale) — an honest scope
## reduction for this phase, not a planned final shape. Exploration-only,
## no quiz.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
