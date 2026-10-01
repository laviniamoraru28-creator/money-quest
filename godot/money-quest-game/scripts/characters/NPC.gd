class_name NPC
extends Interaction
## NPC — a character the player can walk up to and talk to. Extends
## Interaction directly rather than composing one, since "this object
## reacts when talked to" IS an NPC's whole purpose here — a future object
## that needs to be interactable but ISN'T a character (a shelf, a sign)
## would extend Interaction directly instead, as the base class intends.

## A structural id, e.g. "maya" — resolves to a display name via
## Localization ("npc.maya.name") so the same NPC script works for any
## character without hard-coding a name anywhere, the same "character id
## is structural, display name is translated" split the website's
## Leadership Quest characters already use.
@export var npc_id: String = ""

signal talked_to(npc_id: String)

## Label3D, not a Control/Label — in the 3D world a name/prompt floats
## above the NPC's head in world space (billboarded toward the camera)
## rather than living in a 2D screen-space layout.
@onready var _name_label: Label3D = $NameLabel if has_node("NameLabel") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null


func _ready() -> void:
	super._ready()
	if _name_label:
		_name_label.text = get_display_name()
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func get_display_name() -> String:
	return Localization.t("npc.%s.name" % npc_id)


func interact() -> void:
	talked_to.emit(npc_id)
