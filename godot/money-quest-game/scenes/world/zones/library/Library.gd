extends Node3D
## Library — a real 3D destination with themed sections of real, sourced
## children's books a child can walk up to and open (project brief
## Section 9). Every book here is a real, verifiable title with an
## official source — see data/library/ and
## data/schemas/ENTRY_DATA_FORMAT.md's own rule on why this stayed empty
## until now. The Librarian offers a small "can you find a book about
## ___?" discovery prompt (an EXPLORATION-kind quest — see
## QuestManager.gd's own comment) one at a time, in a fixed order,
## skipping any already completed — the same "offer the next incomplete
## quest" pattern every other zone-giver NPC in this project uses. A
## second portal leads to Mentor Hall (see scenes/world/zones/
## mentor_hall/MentorHall.gd).
##
## Section/table signs are plain Label3D nodes (no Interaction) whose
## text this script fills at _ready() — the same "every player-facing
## string goes through Localization.t()" discipline as every other
## label in this project, just without an NPC/Portal script of its own
## to do it.

const DISCOVERY_QUEST_IDS: Array[String] = [
	"lib-discover-money-basics-book",
	"lib-discover-saving-book",
	"lib-discover-business-book",
]

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var librarian: NPC = $Librarian

@onready var _money_basics_label: Label3D = $Bookshelves/MoneyBasicsSection/SectionLabel
@onready var _saving_budgeting_label: Label3D = $Bookshelves/SavingBudgetingSection/SectionLabel
@onready var _business_label: Label3D = $Bookshelves/BusinessSection/SectionLabel
@onready var _world_label: Label3D = $Bookshelves/WorldSection/SectionLabel
@onready var _coming_soon_label: Label3D = $ComingSoonSign
@onready var _discovery_table_label: Label3D = $DiscoveryTableLabel


func _ready() -> void:
	camera_controller.target = player
	librarian.talked_to.connect(_on_librarian_talked_to)

	_money_basics_label.text = Localization.t("zone.library.section.money_basics")
	_saving_budgeting_label.text = Localization.t("zone.library.section.saving_budgeting")
	_business_label.text = Localization.t("zone.library.section.business_entrepreneurship")
	_world_label.text = Localization.t("zone.library.section.money_around_the_world")
	_coming_soon_label.text = Localization.t("zone.library.section.coming_soon")
	_discovery_table_label.text = Localization.t("zone.library.section.discovery_table")


func _on_librarian_talked_to(_npc_id: String) -> void:
	for quest_id in DISCOVERY_QUEST_IDS:
		if not QuestManager.is_quest_completed(quest_id):
			QuestManager.start_quest(quest_id)
			return
	DialogueBox.show_text("zone.library.librarian.all_discoveries_found")
