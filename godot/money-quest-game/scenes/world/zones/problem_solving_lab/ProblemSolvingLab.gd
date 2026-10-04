extends Node3D
## ProblemSolvingLab — Mind Lab's "Problem-Solving Lab" room (Mind Lab
## Section 1, room 5): problem solving (Section 2E) — identify the
## problem and goal, generate and compare options, try one, and learn
## from the result. The Problem Solver offers "The Stuck Zipper," a
## CHALLENGE-kind quest with no single correct option (no new mechanic).

const STUCK_ZIPPER_QUEST_ID: String = "mindlab-stuck-zipper-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var problem_solver: NPC = $ProblemSolver


func _ready() -> void:
	camera_controller.target = player
	problem_solver.talked_to.connect(_on_problem_solver_talked_to)


func _on_problem_solver_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(STUCK_ZIPPER_QUEST_ID):
		DialogueBox.show_text("zone.problem_solving_lab.guide.already_done")
	else:
		QuestManager.start_quest(STUCK_ZIPPER_QUEST_ID)
