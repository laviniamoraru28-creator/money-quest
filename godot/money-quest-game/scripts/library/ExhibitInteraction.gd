class_name ExhibitInteraction
extends Interaction
## ExhibitInteraction — one real, placed ExhibitData a child can walk up
## to and inspect, the Museum's equivalent of BookInteraction.gd/
## MentorInteraction.gd. Shows ExhibitCardPanel, marks the entry
## discovered, and tells QuestManager in case a Museum discovery prompt
## is waiting on this exact exhibit.

## Which ExhibitData this placed prop represents — must match an
## ExhibitData's own `entry_id` loaded by MuseumManager, e.g.
## "first-coins".
@export var entry_id: String = ""

## Lets each placed instance use a different prop color without a family
## of near-duplicate scenes — set per-instance in the zone's own .tscn.
@export var exhibit_color: Color = Color(0.6, 0.45, 0.33, 1)

@onready var _mesh: MeshInstance3D = $Mesh if has_node("Mesh") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null


func _ready() -> void:
	super._ready()
	if _mesh:
		var material := StandardMaterial3D.new()
		material.albedo_color = exhibit_color
		_mesh.material_override = material
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func interact() -> void:
	var exhibit: ExhibitData = MuseumManager.get_exhibit(entry_id)
	if exhibit == null:
		push_warning("ExhibitInteraction: no ExhibitData found for entry_id '%s'" % entry_id)
		return
	await ExhibitCardPanel.show_exhibit(exhibit)
	ProgressManager.discover_entry(entry_id)
	QuestManager.notify_entry_discovered(entry_id)
