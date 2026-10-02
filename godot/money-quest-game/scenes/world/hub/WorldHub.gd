extends Node3D
## WorldHub — the plaza connecting all 7 Money Quest World destinations
## (see docs/money-quest-world-architecture.md Section 2). Not a menu with
## seven buttons: a real place the player walks around — a central
## fountain landmark, 7 paths leading out to 7 gate-shaped portals (4
## functional, 3 "coming soon"), and a Hub Guide NPC near spawn who
## explains the place in two short lines instead of a wall of text (per
## the brief's "the child should understand where each destination leads
## without needing to read large amounts of text").

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var hub_guide: NPC = $HubGuide


func _ready() -> void:
	camera_controller.target = player
	hub_guide.talked_to.connect(_on_hub_guide_talked_to)


func _on_hub_guide_talked_to(_npc_id: String) -> void:
	await DialogueBox.show_text("hub.guide.welcome_line1")
	await DialogueBox.show_text("hub.guide.welcome_line2")
