class_name PoppableBubble
extends Interaction
## PoppableBubble — one Bubble Garden bubble a child can optionally pop
## (project brief: "do NOT make popping bubbles mandatory — the child can
## simply watch"). Popping is an instant visibility toggle, not a tween,
## so there is no motion to reduce under `Settings.reduced_motion` — it
## simply isn't an animation. No score, no reward, no requirement; the
## bubble quietly respawns a few seconds later so a child who enjoys
## popping can keep doing it as long as they like.

const RESPAWN_SECONDS: float = 4.0

@onready var _mesh: MeshInstance3D = $Mesh
@onready var _collision: CollisionShape3D = $CollisionShape3D
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null

var _popped: bool = false


func _ready() -> void:
	super._ready()
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range and not _popped


func interact() -> void:
	if _popped:
		return
	_popped = true
	_mesh.visible = false
	_collision.disabled = true
	await get_tree().create_timer(RESPAWN_SECONDS).timeout
	_mesh.visible = true
	_collision.disabled = false
	_popped = false
