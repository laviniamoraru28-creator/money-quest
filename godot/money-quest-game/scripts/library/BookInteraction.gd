class_name BookInteraction
extends Interaction
## BookInteraction — one real, placed BookData a child can walk up to and
## open, the Library's equivalent of NPC.gd (an Interaction subclass, not
## an NPC — a book doesn't talk). Shows BookCardPanel, marks the entry
## discovered, and tells QuestManager in case a Library discovery prompt
## is waiting on this exact book.

## Which BookData this placed prop represents — must match a BookData's
## own `entry_id` loaded by LibraryManager, e.g. "a-kids-book-about-money".
@export var entry_id: String = ""

## Lets each placed instance use a different cover color without a family
## of near-duplicate scenes — set per-instance in the zone's own .tscn.
@export var book_color: Color = Color(0.6, 0.45, 0.33, 1)

@onready var _mesh: MeshInstance3D = $Mesh if has_node("Mesh") else null
@onready var _prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null


func _ready() -> void:
	super._ready()
	if _mesh:
		var material := StandardMaterial3D.new()
		material.albedo_color = book_color
		_mesh.material_override = material
	if _prompt_label:
		_prompt_label.visible = false
		_prompt_label.text = Localization.t(prompt_text_key)


func _process(_delta: float) -> void:
	if _prompt_label:
		_prompt_label.visible = player_in_range


func interact() -> void:
	var book: BookData = LibraryManager.get_book(entry_id)
	if book == null:
		push_warning("BookInteraction: no BookData found for entry_id '%s'" % entry_id)
		return
	await BookCardPanel.show_book(book)
	ProgressManager.discover_entry(entry_id)
	QuestManager.notify_entry_discovered(entry_id)
