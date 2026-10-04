class_name MindLabEntryInteraction
extends Interaction
## MindLabEntryInteraction — one real, placed MindLabEntryData a child can
## walk up to and try/read, Mind Lab's equivalent of BookInteraction.gd/
## ExhibitInteraction.gd. Shows MindLabEntryCardPanel and marks the entry
## discovered. Deliberately never calls QuestManager.notify_entry_discovered()
## — unlike Library/Museum entries, no Mind Lab entry is ever the target of
## an EXPLORATION quest, since nothing here is meant to be a "go find this"
## prompt (project brief Section 3: exploration itself is the point).

## Which MindLabEntryData this placed prop represents — must match a
## MindLabEntryData's own `entry_id` loaded by MindLabManager, e.g.
## "mindlab-strategy-breathing".
@export var entry_id: String = ""

## Lets each placed instance use a different prop color without a family
## of near-duplicate scenes — set per-instance in the zone's own .tscn.
@export var entry_color: Color = Color(0.4, 0.7, 0.75, 1)

@onready var _mesh: MeshInstance3D = $Mesh if has_node("Mesh") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null


func _ready() -> void:
	super._ready()
	if _mesh:
		var material := StandardMaterial3D.new()
		material.albedo_color = entry_color
		_mesh.material_override = material
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func interact() -> void:
	var entry: MindLabEntryData = MindLabManager.get_entry(entry_id)
	if entry == null:
		push_warning("MindLabEntryInteraction: no MindLabEntryData found for entry_id '%s'" % entry_id)
		return
	await MindLabEntryCardPanel.show_entry(entry)
	ProgressManager.discover_entry(entry_id)
