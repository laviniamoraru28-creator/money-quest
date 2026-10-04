extends Node3D
## Museum — the Money Quest World Museum's entrance room, "Before
## Money": a real barter scenario (project brief Section 11, Room 1) and
## one real, sourced exhibit on trade and exchange before coins existed.
## Reached from the Hub's Museum portal. A second portal leads onward to
## First Coins — the Museum's own zone chain, the same "inner portal"
## pattern every other multi-zone destination in this project already
## uses (see docs/money-quest-world-architecture.md Section 5).

const BARTER_QUEST_ID: String = "museum-before-money-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var trader: NPC = $Trader


func _ready() -> void:
	camera_controller.target = player
	trader.talked_to.connect(_on_trader_talked_to)


func _on_trader_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(BARTER_QUEST_ID):
		DialogueBox.show_text("zone.museum.trader.already_done")
	else:
		QuestManager.start_quest(BARTER_QUEST_ID)
