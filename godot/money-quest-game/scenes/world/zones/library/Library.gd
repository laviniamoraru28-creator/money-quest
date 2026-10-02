extends Node3D
## Library — a real 3D destination (bookshelves, a reading area, a
## Librarian), not an embedded webpage (project brief Section 9). Honestly
## empty of real books right now: no book, author, or quote may be
## invented — see data/schemas/ENTRY_DATA_FORMAT.md's rule. Talking to the
## Librarian says so plainly instead of pretending there's something to
## browse. `BrowseZoneController` (the reusable script that will place and
## drive real `BookData` entries once at least one is approved) is
## deliberately not built yet — with zero entries there's nothing to place
## and no way to verify the resulting Area3D/collision setup actually
## works, so it would be untested scaffolding, not proven architecture
## (same reasoning Section 6 of the architecture doc already applied to
## Museum).

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var librarian: NPC = $Librarian


func _ready() -> void:
	camera_controller.target = player
	librarian.talked_to.connect(_on_librarian_talked_to)


func _on_librarian_talked_to(_npc_id: String) -> void:
	DialogueBox.show_text("zone.library.librarian.greeting")
