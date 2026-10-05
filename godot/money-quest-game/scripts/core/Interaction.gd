class_name Interaction
extends Area3D
## Interaction — base class for anything in the 3D world the player can
## walk up to and act on (an NPC, a portal, a book, an exhibit). Subclass
## and override interact() — InteractionManager handles detecting
## proximity and routing input, so a new interactable object never needs
## to reimplement "is the player close enough" logic.
##
## Ported from the original 2D prototype's Area2D version — the
## register()/unregister()/try_interact() signal pattern this plugs into
## is unchanged; only the physics dimension changed. See
## docs/money-quest-world-architecture.md's "what needed refactoring"
## assessment.

## Shown above the object when it's the nearest interactable to the
## player — resolved through Localization so "Talk" reads correctly in
## every supported locale, never hard-coded English.
@export var prompt_text_key: String = "interaction.talk_prompt"

## When several interactables are in reach at once, the most relevant one
## is offered — priority blended with distance, see
## InteractionManager.get_nearest(). Portals 70, NPCs 50, world objects
## 30–60 by kind (InteractionData.priority()).
@export var interaction_priority: int = 10
## Height above this node where the on-screen prompt is anchored.
@export var prompt_height: float = 2.2

var player_in_range: bool = false


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)


func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if "interaction_manager" in body:
			body.interaction_manager.register(self)


func _on_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		if "interaction_manager" in body:
			body.interaction_manager.unregister(self)


## Override in subclasses. Called by InteractionManager when the player
## presses "interact" while this is the nearest in-range Interaction.
func interact() -> void:
	pass
