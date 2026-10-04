class_name GardenPaletteInteraction
extends Interaction
## GardenPaletteInteraction — the "Create Your Own Calm Garden" prop a
## child walks up to and interacts with to open the customization flow.
## Deliberately a simple prop, not an NPC — mirrors how Mind Lab's
## MindLabEntryInteraction etc. use the same Interaction base without a
## talking character. Emits `palette_interacted`; the zone script owns
## the actual category-picker flow (see CreateYourOwnGarden.gd).

signal palette_interacted

@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null


func _ready() -> void:
	super._ready()
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func interact() -> void:
	palette_interacted.emit()
