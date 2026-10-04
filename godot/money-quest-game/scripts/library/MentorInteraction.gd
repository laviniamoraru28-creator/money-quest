class_name MentorInteraction
extends Interaction
## MentorInteraction — one real, placed MentorData a child can walk up to
## and open, Mentor Hall's equivalent of BookInteraction.gd. Shows
## MentorCardPanel, marks the entry discovered, and tells QuestManager in
## case a Library discovery prompt is waiting on this exact mentor.

## Which MentorData this placed portrait represents — must match a
## MentorData's own `entry_id` loaded by LibraryManager, e.g.
## "katherine-johnson".
@export var entry_id: String = ""

## Lets each placed instance use a different frame/portrait color without
## a family of near-duplicate scenes — set per-instance in the zone's own
## .tscn.
@export var portrait_color: Color = Color(0.498, 0.702, 0.8, 1)

@onready var _mesh: MeshInstance3D = $Mesh if has_node("Mesh") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null
@onready var _name_label: Label3D = $NameLabel if has_node("NameLabel") else null


func _ready() -> void:
	super._ready()
	if _mesh:
		var material := StandardMaterial3D.new()
		material.albedo_color = portrait_color
		_mesh.material_override = material
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)
	if _name_label:
		var mentor: MentorData = LibraryManager.get_mentor(entry_id)
		_name_label.text = Localization.t(mentor.title_key) if mentor else ""


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func interact() -> void:
	var mentor: MentorData = LibraryManager.get_mentor(entry_id)
	if mentor == null:
		push_warning("MentorInteraction: no MentorData found for entry_id '%s'" % entry_id)
		return
	await MentorCardPanel.show_mentor(mentor)
	ProgressManager.discover_entry(entry_id)
	QuestManager.notify_entry_discovered(entry_id)
