extends Node3D
## BubbleGarden — Calm World's hub (see docs/money-quest-world-
## architecture.md Section 7/7b and the project brief's 8 named Calm World
## concepts). Doubles as the fan-out point to every other Calm World
## space, exactly as it already did before this phase — this phase only
## adds the explicit "choose what feels right for you" framing (the Calm
## Guide NPC) and optional, never-mandatory bubble popping
## (`PoppableBubble.gd`). Nothing to tap, nothing to get right or wrong,
## nothing timed — a quiet place to walk around and look at drifting
## bubbles. Never framed as treatment or therapy anywhere in this zone's
## copy; only ever "a calm place to visit."
##
## Always reachable from the Hub with no unlock condition (see
## data/zones/calm-world-bubble-garden.tres — this is the one non-
## negotiable the brief states for every Calm World zone).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var calm_guide: NPC = $CalmGuide

var _bubbles: Array[Node3D] = []
var _base_heights: Array[float] = []
var _time: float = 0.0


func _ready() -> void:
	camera_controller.target = player
	calm_guide.talked_to.connect(_on_calm_guide_talked_to)
	for child in $Bubbles.get_children():
		_bubbles.append(child)
		_base_heights.append(child.position.y)
	Settings.reduced_motion_changed.connect(_on_reduced_motion_changed)
	_apply_bubble_quantity()


func _on_calm_guide_talked_to(_npc_id: String) -> void:
	await DialogueBox.show_text("zone.calm_world_hub.guide.line1")
	await DialogueBox.show_text("zone.calm_world_hub.guide.line2")
	await DialogueBox.show_text("zone.calm_world_hub.guide.line3")


## Respects reduced_motion exactly like every other animated piece of this
## project (Settings.gd's project-wide rule) — the bubbles simply hold
## still instead of drifting when it's on, so the space stays calm and
## fully present either way, never emptied out to "turn off" the motion.
func _process(delta: float) -> void:
	if Settings.reduced_motion:
		return
	_time += delta
	for i in range(_bubbles.size()):
		_bubbles[i].position.y = _base_heights[i] + sin(_time * 0.6 + i * 1.3) * 0.4


## Project brief's explicit reduced-motion request for Bubble Garden:
## "reduce quantity" in addition to reducing movement — every other
## bubble simply hides rather than being removed, so turning reduced
## motion back off instantly restores the full garden.
func _on_reduced_motion_changed(_enabled: bool) -> void:
	_apply_bubble_quantity()


func _apply_bubble_quantity() -> void:
	for i in range(_bubbles.size()):
		var bubble_shown: bool = not Settings.reduced_motion or i % 2 == 0
		_bubbles[i].visible = bubble_shown
		_bubbles[i].monitoring = bubble_shown
