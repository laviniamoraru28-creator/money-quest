extends Node3D
## CalmResetLab — Mind Lab's "Calm & Reset Lab" room (Mind Lab Section 1,
## room 4): calm and reset skills (Section 2D). Three freestanding,
## exploration-only MindLabEntryData stations (slow breathing, noticing
## five things, a movement break) a child can try, skip, or return to
## later — never forced, never graded (project brief Section 3: "Do not
## force the child to perform breathing exercises"). All three stations
## are walkable and interactable with no gate at all; the Calm Guide
## additionally offers one small, optional "go notice what's around
## you" EXPLORATION-kind discovery prompt (mirroring the Library's own
## discovery-prompt pattern, project brief Section 9), never required to
## try the stations. The Calm Guide explicitly points onward to Calm
## World without ever gating it behind anything here (project brief
## Section 7: "This should NOT lock Calm World behind Mind Lab
## progress. Calm World must remain freely accessible.").

const DISCOVER_GROUNDING_QUEST_ID: String = "mindlab-discover-grounding-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var calm_guide: NPC = $CalmGuide


func _ready() -> void:
	camera_controller.target = player
	calm_guide.talked_to.connect(_on_calm_guide_talked_to)


func _on_calm_guide_talked_to(_npc_id: String) -> void:
	await DialogueBox.show_text("zone.calm_reset_lab.guide.line1")
	await DialogueBox.show_text("zone.calm_reset_lab.guide.line2")
	await DialogueBox.show_text("zone.calm_reset_lab.guide.line3")
	if not QuestManager.is_quest_completed(DISCOVER_GROUNDING_QUEST_ID):
		QuestManager.start_quest(DISCOVER_GROUNDING_QUEST_ID)
