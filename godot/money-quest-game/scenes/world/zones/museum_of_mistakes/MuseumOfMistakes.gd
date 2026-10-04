extends Node3D
## MuseumOfMistakes — Museum Room 9: 2 real, documented examples of
## well-known business/product mistakes (project brief Section 19),
## using ExhibitData's existing failure-museum structure (What Happened/
## What Went Wrong/What Could Have Been Different/What We Learned) and
## a "Continue the Story" follow-up CHALLENGE quest (project brief's
## "Change the idea? Try again? Ask for feedback? Stop?") whose real
## historical outcome is revealed regardless of which option the child
## picks — never implying the child's choice changed history. Connects
## to Leadership Quest (resilience, adaptability).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
