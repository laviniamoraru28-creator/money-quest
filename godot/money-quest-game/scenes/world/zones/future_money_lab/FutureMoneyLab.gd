extends Node3D
## FutureMoneyLab — Museum Room 10, the final room (project brief
## Section 20): neutral, educational exploration of contactless/mobile
## payments and digital information, with cryptocurrency mentioned only
## as a real technology that exists, never as something this game
## recommends buying or investing in. The Future Guide poses the
## brief's own open reflection questions as plain dialogue lines, with
## no choice and no reward — these are genuinely open questions, not
## decision points with a consequence.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var future_guide: NPC = $FutureGuide


func _ready() -> void:
	camera_controller.target = player
	future_guide.talked_to.connect(_on_future_guide_talked_to)


func _on_future_guide_talked_to(_npc_id: String) -> void:
	await DialogueBox.show_text("zone.future_money_lab.guide.question_1")
	await DialogueBox.show_text("zone.future_money_lab.guide.question_2")
	await DialogueBox.show_text("zone.future_money_lab.guide.question_3")
