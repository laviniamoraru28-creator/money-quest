class_name ActivityStation
extends Interaction
## ActivityStation — a thing in the world that starts a hands-on activity
## when used (a savings jar, a market stall, a sorting table...). It shows
## the HUD's large prompt with its own verb ("Save", "Try it"), glows
## softly while it is the current mission, and emits `used` — the zone's
## flow decides what happens. Subclasses build the visual in _build_visual.

signal used

## The prompt's verb (translation key), e.g. "interaction.save_prompt".
@export var prompt_key: String = "interaction.try_prompt"
@export var reach: float = 2.0

var visual: Node3D


func _ready() -> void:
	super._ready()
	prompt_text_key = prompt_key
	interaction_priority = 60
	prompt_height = 1.9
	collision_layer = 0
	collision_mask = 1
	var shape := CollisionShape3D.new()
	var s := SphereShape3D.new()
	s.radius = reach
	shape.shape = s
	add_child(shape)
	visual = _build_visual()
	if visual:
		add_child(visual)
	set_meta("marker_height", 2.0)


## Override: return this station's visual (its own collider included).
func _build_visual() -> Node3D:
	return null


func interact() -> void:
	used.emit()
