extends Node3D
## GoldenVault — the persistent 3D zone where Maya's "Saving for Something
## Bigger" quest lives. Maya is a permanent resident NPC here, not a
## separate instanced "lesson room" the way the 2D prototype worked — see
## docs/money-quest-world-architecture.md's reasoning for why a lesson is
## now a Quest triggered from inside a persistent zone.
##
## Also home to the Savings Guide, who gives "What Does Saving Mean?"
## (explorer-saving-l1) — the explorer-age-band companion to Maya's
## builder-age-band lesson, same topic ("saving"), same zone. This is the
## first zone in this project with two independent quest-giving NPCs: a
## second real lesson didn't need a whole new zone, just a second NPC
## node and a second talked_to connection, exactly as data-driven as
## adding a new zone would have been.
##
## A third resident, Theo, completes the "saving" topic's full 3-age-band
## trilogy with "Saving vs. Spending: The Real Trade-off"
## (strategist-saving-l1). Theo is the real child named in this lesson's
## own story — a coincidental reuse of the same name already used for
## Team Challenge's NPC in Leadership Quest, since each is drawn verbatim
## from its own real, independent source text, not the same character
## appearing in two tracks.

const MAYA_QUEST_ID: String = "builder-saving-l1-quest"
const SAVINGS_GUIDE_QUEST_ID: String = "explorer-saving-l1-quest"
const THEO_QUEST_ID: String = "strategist-saving-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var maya: NPC = $Maya
@onready var savings_guide: NPC = $SavingsGuide
@onready var theo: NPC = $Theo


func _ready() -> void:
	camera_controller.target = player
	maya.talked_to.connect(_on_maya_talked_to)
	savings_guide.talked_to.connect(_on_savings_guide_talked_to)
	theo.talked_to.connect(_on_theo_talked_to)


func _on_maya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MAYA_QUEST_ID):
		DialogueBox.show_text("zone.golden_vault.maya.already_done")
	else:
		QuestManager.start_quest(MAYA_QUEST_ID)


func _on_savings_guide_talked_to(_npc_id: String) -> void:
	# The first-visit journey (GoldenVaultFlow) handles the Guide until the
	# first savings activity is done; then his lesson starts as before.
	var flow: Node = get_node_or_null("GoldenVaultFlow")
	if flow and flow.handle_guide_talk():
		return
	if QuestManager.is_quest_completed(SAVINGS_GUIDE_QUEST_ID):
		DialogueBox.show_text("zone.golden_vault.savings_guide.already_done")
	else:
		QuestManager.start_quest(SAVINGS_GUIDE_QUEST_ID)


func _on_theo_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(THEO_QUEST_ID):
		DialogueBox.show_text("zone.golden_vault.theo.already_done")
	else:
		QuestManager.start_quest(THEO_QUEST_ID)
