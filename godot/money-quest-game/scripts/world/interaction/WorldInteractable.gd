class_name WorldInteractable
extends Interaction
## WorldInteractable — the one reusable "you can do something here" object
## for the 3D world. Everything it shows and does comes from its
## InteractionData; it reuses the existing Interaction / InteractionManager
## proximity system (an Area3D the physics engine watches — no polling),
## and hands the child the shared InteractionCard when they choose to
## interact. Nothing ever opens on its own: walking past is always fine.

@export var data: InteractionData


func _ready() -> void:
	super._ready()
	if data:
		prompt_text_key = data.prompt_key
		interaction_priority = data.priority()
		prompt_height = data.prompt_height


func interact() -> void:
	var card: InteractionCard = InteractionCard.find(self)
	if card and data:
		card.toggle(data, self)
