extends Node3D
## MarketTown — Money Quest's second zone (real website world id
## "market-town", display name "Smart Shopper"), reached via a path inside
## Golden Vault rather than its own Hub portal — the first proof that a
## Quest track's internal zone graph can grow past one zone without any
## architecture change (see docs/money-quest-world-architecture.md
## Section 3). The Baker gives "Need It or Want It?"
## (explorer-needs_wants-l1), the real website's simplest Money Quest
## lesson, ported via LessonData.choice_point with no new mini-game.

const NEEDS_WANTS_QUEST_ID: String = "explorer-needs-wants-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var baker: NPC = $Baker


func _ready() -> void:
	camera_controller.target = player
	baker.talked_to.connect(_on_baker_talked_to)


func _on_baker_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NEEDS_WANTS_QUEST_ID):
		DialogueBox.show_text("zone.market_town.baker.already_done")
	else:
		QuestManager.start_quest(NEEDS_WANTS_QUEST_ID)
