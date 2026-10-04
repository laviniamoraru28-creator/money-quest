class_name FactInteraction
extends Interaction
## FactInteraction — a generic "walk up and read one short fact" prop,
## reused across Calm World rooms where only a couple of decorative
## objects should be interactive (project brief, Aquarium: "some fish
## should simply exist for atmosphere... do not turn this into a
## quiz"). Shows exactly one line via `DialogueBox.show_text()` — no
## card panel, no reward, no discovery tracking — since this is pure
## atmosphere, not Library/Museum/Mind-Lab-style sourced content.

@export var fact_text_key: String = ""

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
	if not fact_text_key.is_empty():
		await DialogueBox.show_text(fact_text_key)
