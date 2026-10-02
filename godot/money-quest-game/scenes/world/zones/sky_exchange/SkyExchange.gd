extends Node3D
## SkyExchange — Money Quest's fourth zone (real website world id
## "sky-exchange", real badge display name "Currency Explorer"), reached
## via a path inside Guardian Gate rather than its own Hub portal —
## extending the Golden Vault → Market Town → Guardian Gate → Sky
## Exchange chain (see docs/money-quest-world-architecture.md Section 3).
## Sam — the real child named in the lesson's own story — gives
## "Cash, Cards, and Currencies" (builder-currencies-l1), ported via
## LessonData.choice_point with no mini-game, same shape as every other
## choice_point-only lesson so far.
##
## Omar — the real child named in the "How a Card Payment Actually Works"
## story — is this zone's second resident (same "a zone can grow another
## quest-giving NPC" pattern Golden Vault proved with Savings Guide/Theo),
## giving builder-digital_money-l1. The real website still hosts 2 more
## untouched sky-exchange topics (investing_basics, junior_isa), so this
## zone remains a natural home for further residents.

const CURRENCIES_QUEST_ID: String = "builder-currencies-l1-quest"
const DIGITAL_MONEY_QUEST_ID: String = "builder-digital-money-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var sam: NPC = $Sam
@onready var omar: NPC = $Omar


func _ready() -> void:
	camera_controller.target = player
	sam.talked_to.connect(_on_sam_talked_to)
	omar.talked_to.connect(_on_omar_talked_to)


func _on_sam_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CURRENCIES_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.sam.already_done")
	else:
		QuestManager.start_quest(CURRENCIES_QUEST_ID)


func _on_omar_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(DIGITAL_MONEY_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.omar.already_done")
	else:
		QuestManager.start_quest(DIGITAL_MONEY_QUEST_ID)
