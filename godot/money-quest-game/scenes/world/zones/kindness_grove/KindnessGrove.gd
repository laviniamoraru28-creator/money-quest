extends Node3D
## KindnessGrove — Money Quest's seventh and final zone (real website
## world id "kindness-grove", real badge display name "Giving Hero"),
## reached via a path inside Horizon Peaks rather than its own Hub portal
## — extending the Golden Vault → Market Town → Guardian Gate →
## Sky Exchange → Coin Cove → Horizon Peaks → Kindness Grove chain (see
## docs/money-quest-world-architecture.md Section 3). This completes all
## 7 of the real website's Money Quest zones.
##
## Omar — the real child named in the "Giving on Purpose" story — gives
## builder-giving-l1. His name coincidentally matches Sky Exchange's Omar
## (an unrelated real character from a different real source text) —
## harmless, for the same reason the earlier Theo and Priya coincidences
## were: quest-completion state keys off quest_id, not npc_id, and the
## two zones are never loaded at the same time.
##
## Friend — this zone's second resident — gives explorer-giving-l1 ("The
## Joy of Sharing"). The real lesson's story has no named child (it's
## written in second person, "you," with a second character simply
## called "your friend"), so this NPC uses that same role as its
## generic name, the same convention Market Town's Baker established.
## Because the real story's outcome (sharing a coin so both can play) is
## fixed and the one tested by the curriculum's own quiz, the
## choice_point here is a downstream decision (who goes first) rather
## than whether to share at all — the same safeguard used for the
## Sticker Keeper's lesson in Horizon Peaks.
##
## Sofia — the real teen named in the "Giving Thoughtfully" story — is
## this zone's third resident, completing the full 3-age-band "giving"
## topic trilogy in one zone (the same way Golden Vault completed
## "saving", Coin Cove completed "money_basics", and Horizon Peaks
## completed "long_term_thinking"), giving strategist-giving-l1.

const GIVING_QUEST_ID: String = "builder-giving-l1-quest"
const GIVING_EXPLORER_QUEST_ID: String = "explorer-giving-l1-quest"
const GIVING_STRATEGIST_QUEST_ID: String = "strategist-giving-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var omar: NPC = $Omar
@onready var friend: NPC = $Friend
@onready var sofia: NPC = $Sofia


## The sharing bed: share a coin or something you bought, or keep it.
var share_spot: ShareSpot


func _ready() -> void:
	camera_controller.target = player
	omar.talked_to.connect(_on_omar_talked_to)
	friend.talked_to.connect(_on_friend_talked_to)
	sofia.talked_to.connect(_on_sofia_talked_to)
	share_spot = ShareSpot.new()
	share_spot.name = "ShareSpot"
	share_spot.position = Vector3(4.4, 0, 0.0)
	add_child(share_spot)
	share_spot.used.connect(_on_share_used)
	_set_place_goal.call_deferred()


## The room's own goal while no choice was made yet: you → ♥ or bag.
func _set_place_goal() -> void:
	if ShareSpot.done() or not is_inside_tree():
		return
	ObjectiveManager.set_objective("kg.share", "objective.kg.share", {}, share_spot)
	ObjectiveManager.set_icons(["you", "then", "heart", "bag"])


func _on_share_used() -> void:
	# The choice is made in ShareSpot.interact(); its ✓ once recorded.
	await get_tree().process_frame
	while is_inside_tree() and not ShareSpot.done() and get_tree().get_nodes_in_group("mq_purpose_card").size() > 0:
		await get_tree().create_timer(0.2).timeout
	if ShareSpot.done() and ObjectiveManager.objective_id == "kg.share":
		ObjectiveManager.complete("kg.share")


func _on_omar_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GIVING_QUEST_ID):
		DialogueBox.show_text("zone.kindness_grove.omar.already_done")
	else:
		QuestManager.start_quest(GIVING_QUEST_ID)


func _on_friend_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GIVING_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.kindness_grove.friend.already_done")
	else:
		QuestManager.start_quest(GIVING_EXPLORER_QUEST_ID)


func _on_sofia_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GIVING_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.kindness_grove.sofia.already_done")
	else:
		QuestManager.start_quest(GIVING_STRATEGIST_QUEST_ID)
