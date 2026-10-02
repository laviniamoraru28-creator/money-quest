extends Node3D
## MindLab — Money Quest World's first Mind Lab destination: an
## experimental, curious space, not another classroom (project brief
## Section 6). Populated with `QuestData` entries exactly like Leadership
## Quest — a short scenario, a reflective choice, a consequence — no new
## system (see docs/money-quest-world-architecture.md Section 7). Never
## framed as treatment or diagnosis anywhere in this zone's copy.
##
## The floating orbs are purely decorative "curious lab" dressing and
## respect `reduced_motion` exactly like Bubble Garden's bubbles do.

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var guide: NPC = $MindLabGuide

var _orbs: Array[Node3D] = []
var _base_heights: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	guide.talked_to.connect(_on_guide_talked_to)
	for child in $Orbs.get_children():
		_orbs.append(child)
		_base_heights.append(child.position.y)


func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_orbs.size()):
		_orbs[i].position.y = _base_heights[i] + sin(_time * 0.5 + i * 2.1) * 0.35


const DIFFERENT_EXPLANATIONS_QUEST_ID: String = "mindlab-different-explanations-quest"


func _on_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(DIFFERENT_EXPLANATIONS_QUEST_ID):
		DialogueBox.show_text("zone.mind_lab.guide.already_done")
	else:
		QuestManager.start_quest(DIFFERENT_EXPLANATIONS_QUEST_ID)
