extends Node3D
## MoneyThroughTime — Museum Room 4: an interactive timeline activity
## (project brief Section 14), implemented as a SORT-kind quest sorting
## 6 real milestones into 3 rough eras (Long Ago / Not As Long Ago / More
## Recently) rather than a bespoke walkable-timeline UI — the same
## "reuse the existing mini-game architecture" discipline every other
## Museum room follows. A reflection choice afterwards asks why money
## changed, with several equally valid real answers, never a single
## "correct" cause for a genuinely complex historical question.

const TIMELINE_QUEST_ID: String = "museum-money-through-time-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var timekeeper: NPC = $Timekeeper


func _ready() -> void:
	camera_controller.target = player
	timekeeper.talked_to.connect(_on_timekeeper_talked_to)


func _on_timekeeper_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TIMELINE_QUEST_ID):
		DialogueBox.show_text("zone.money_through_time.timekeeper.already_done")
	else:
		QuestManager.start_quest(TIMELINE_QUEST_ID)
