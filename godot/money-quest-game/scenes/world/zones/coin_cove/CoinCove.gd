extends Node3D
## CoinCove — Money Quest's fifth zone (real website world id "coin-cove"),
## reached via a path inside Sky Exchange rather than its own Hub portal —
## extending the Golden Vault → Market Town → Guardian Gate → Sky Exchange
## → Coin Cove chain (see docs/money-quest-world-architecture.md Section 3).
## On the real website, Coin Cove is actually orderIndex 1 ("where every
## quest begins"), but this game's chain was built in a different order —
## that's a presentation detail, not a curriculum dependency, since each
## zone's lesson is self-contained.
##
## The real lesson's story has no named child character (it's written in
## second person, "you"), so the giver NPC uses the same "generic role
## name" convention Market Town's Baker established rather than inventing
## a named child the source material doesn't have: the Shopkeeper gives
## "What Is Money?" (explorer-money_basics-l1).
##
## Amir — the real child named in the "Where Does Money Come From?"
## story — is this zone's second resident, the same "a zone can grow
## another resident" pattern used throughout Money Quest, giving
## builder-money_basics-l1.
##
## Priya — the real child named in the "Money as a Tool, Not a Goal"
## story — is this zone's third resident, giving strategist-money_basics-l1
## and completing the full 3-age-band "money_basics" topic trilogy in one
## zone (the same way Golden Vault completed its "saving" trilogy). Her
## name coincidentally matches Leadership Academy's Priya (a different
## real character from an unrelated real source text) — harmless, since
## quest-completion state keys off quest_id, not npc_id, and the two
## zones are never loaded at the same time.

const MONEY_BASICS_QUEST_ID: String = "explorer-money-basics-l1-quest"
const MONEY_BASICS_BUILDER_QUEST_ID: String = "builder-money-basics-l1-quest"
const MONEY_BASICS_STRATEGIST_QUEST_ID: String = "strategist-money-basics-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var shopkeeper: NPC = $Shopkeeper
@onready var amir: NPC = $Amir
@onready var priya: NPC = $Priya


func _ready() -> void:
	camera_controller.target = player
	shopkeeper.talked_to.connect(_on_shopkeeper_talked_to)
	amir.talked_to.connect(_on_amir_talked_to)
	priya.talked_to.connect(_on_priya_talked_to)


func _on_shopkeeper_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MONEY_BASICS_QUEST_ID):
		DialogueBox.show_text("zone.coin_cove.shopkeeper.already_done")
	else:
		QuestManager.start_quest(MONEY_BASICS_QUEST_ID)


func _on_amir_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MONEY_BASICS_BUILDER_QUEST_ID):
		DialogueBox.show_text("zone.coin_cove.amir.already_done")
	else:
		QuestManager.start_quest(MONEY_BASICS_BUILDER_QUEST_ID)


func _on_priya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MONEY_BASICS_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.coin_cove.priya.already_done")
	else:
		QuestManager.start_quest(MONEY_BASICS_STRATEGIST_QUEST_ID)
