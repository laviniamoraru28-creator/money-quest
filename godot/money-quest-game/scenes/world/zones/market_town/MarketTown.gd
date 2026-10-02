extends Node3D
## MarketTown — Money Quest's second zone (real website world id
## "market-town", display name "Smart Shopper"), reached via a path inside
## Golden Vault rather than its own Hub portal — the first proof that a
## Quest track's internal zone graph can grow past one zone without any
## architecture change (see docs/money-quest-world-architecture.md
## Section 3). The Baker gives "Need It or Want It?"
## (explorer-needs_wants-l1), the real website's simplest Money Quest
## lesson, ported via LessonData.choice_point with no new mini-game.

## Leah — the real child named in the "The Grey Area" story — is this
## zone's second resident, giving builder-needs_wants-l1.
##
## Jordan — the real teen named in the "Needs, Wants, and Social
## Pressure" story (they/them in the real source text, preserved as-is)
## — is this zone's third resident, completing the full 3-age-band
## "needs_wants" topic trilogy in one zone (the same way Golden Vault,
## Coin Cove, Horizon Peaks, and Kindness Grove each completed their
## own topic), giving strategist-needs_wants-l1.

const NEEDS_WANTS_QUEST_ID: String = "explorer-needs-wants-l1-quest"
const NEEDS_WANTS_BUILDER_QUEST_ID: String = "builder-needs-wants-l1-quest"
const NEEDS_WANTS_STRATEGIST_QUEST_ID: String = "strategist-needs-wants-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var baker: NPC = $Baker
@onready var leah: NPC = $Leah
@onready var jordan: NPC = $Jordan


func _ready() -> void:
	camera_controller.target = player
	baker.talked_to.connect(_on_baker_talked_to)
	leah.talked_to.connect(_on_leah_talked_to)
	jordan.talked_to.connect(_on_jordan_talked_to)


func _on_baker_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NEEDS_WANTS_QUEST_ID):
		DialogueBox.show_text("zone.market_town.baker.already_done")
	else:
		QuestManager.start_quest(NEEDS_WANTS_QUEST_ID)


func _on_leah_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NEEDS_WANTS_BUILDER_QUEST_ID):
		DialogueBox.show_text("zone.market_town.leah.already_done")
	else:
		QuestManager.start_quest(NEEDS_WANTS_BUILDER_QUEST_ID)


func _on_jordan_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NEEDS_WANTS_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.market_town.jordan.already_done")
	else:
		QuestManager.start_quest(NEEDS_WANTS_STRATEGIST_QUEST_ID)
