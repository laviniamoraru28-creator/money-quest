extends Node3D
## GuardianGate — Money Quest's third zone (real website world id
## "guardian-gate"), reached via a path inside Market Town rather than its
## own Hub portal — extending the same inner-zone-graph pattern Golden
## Vault → Market Town already proved (see docs/money-quest-world-
## architecture.md Section 3). Zara — the real child from the website's
## own "builder-scams-l1" story — gives "Spotting a Scam"
## (builder-scams-l1), ported via LessonData.choice_point with no new
## mini-game, same shape as Market Town's "Need It or Want It?".
##
## Grown-up — this zone's second resident — gives explorer-scams-l1
## ("Some Promises Are Too Good"). The real lesson's story has no named
## child (second person "you," with the second character simply called
## "a grown-up nearby"), so this NPC uses that role as its generic name,
## the same convention Market Town's Baker established. Because the
## real quiz already tests the lesson's core "tell a grown-up, don't
## click" fact directly, the choice_point here is a downstream decision
## (how to follow up on the pop-up) rather than whether to click at all.
##
## Marcus — this zone's third resident — gives strategist-scams-l1
## ("Scams Target Emotions, Not Logic"), completing the "scams" topic's
## full 3-age-band trilogy in one zone (the same way Golden Vault
## completed "saving", Coin Cove completed "money_basics", Horizon
## Peaks completed "long_term_thinking", and Kindness Grove completed
## "giving"). Marcus is the real teen from the lesson's own story. Here
## the real quiz tests a conceptual mechanism (scams trigger a strong
## feeling to bypass careful thinking), not a specific action, so the
## choice_point is free to mirror the lesson's own recommended
## pause-and-verify habit directly (two different, equally valid ways
## to verify a suspicious message) without risk of contradicting it.

const SCAMS_QUEST_ID: String = "builder-scams-l1-quest"
const SCAMS_EXPLORER_QUEST_ID: String = "explorer-scams-l1-quest"
const SCAMS_STRATEGIST_QUEST_ID: String = "strategist-scams-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var zara: NPC = $Zara
@onready var grown_up: NPC = $GrownUp
@onready var marcus: NPC = $Marcus


## The message board: "Spot the tricks" — a hands-on activity in the room.
var board: MessageBoard
var _spotting: bool = false


func _ready() -> void:
	camera_controller.target = player
	zara.talked_to.connect(_on_zara_talked_to)
	grown_up.talked_to.connect(_on_grown_up_talked_to)
	marcus.talked_to.connect(_on_marcus_talked_to)
	board = MessageBoard.new()
	board.name = "MessageBoard"
	board.position = Vector3(4.6, 0, -0.6)
	board.rotation_degrees.y = -60.0
	add_child(board)
	board.used.connect(_on_board_used)
	_set_place_goal.call_deferred()


## The room's own goal while the board is not done: you → the messages → ⚠.
func _set_place_goal() -> void:
	if MessageBoard.done() or not is_inside_tree():
		return
	ObjectiveManager.set_objective("gg.spot", "objective.gg.spot", {}, board)
	ObjectiveManager.set_icons(["you", "then", "chat", "warning"])


func _on_board_used() -> void:
	if _spotting:
		return
	_spotting = true
	var first: bool = not MessageBoard.done()
	await board.play()
	_spotting = false
	if first and ObjectiveManager.objective_id == "gg.spot":
		ObjectiveManager.complete("gg.spot")


func _on_zara_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SCAMS_QUEST_ID):
		DialogueBox.show_text("zone.guardian_gate.zara.already_done")
	else:
		QuestManager.start_quest(SCAMS_QUEST_ID)


func _on_grown_up_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SCAMS_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.guardian_gate.grown_up.already_done")
	else:
		QuestManager.start_quest(SCAMS_EXPLORER_QUEST_ID)


func _on_marcus_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SCAMS_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.guardian_gate.marcus.already_done")
	else:
		QuestManager.start_quest(SCAMS_STRATEGIST_QUEST_ID)
