extends Node3D
## MentorHall — the Library's dedicated "Meet the Mentors" room (project
## brief Section 7), reached via a portal inside Library. Every portrait
## here is a real, verifiable person — see data/mentors/ and
## MentorData.gd's own comment on why no mentor is ever invented or
## quoted. Each portrait is a MentorInteraction the child walks up to and
## opens for a short WHO/WHAT/CHALLENGE/SKILL profile and an optional
## "Try a challenge inspired by this skill" mini-quest.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController


func _ready() -> void:
	camera_controller.target = player
