extends Node3D
## SkyExchange — Money Quest's fourth zone (real website world id
## "sky-exchange", real badge display name "Currency Explorer"), reached
## via a path inside Guardian Gate rather than its own Hub portal —
## extending the Golden Vault → Market Town → Guardian Gate → Sky
## Exchange chain (see docs/money-quest-world-architecture.md Section 3).
## Sam — the real child named in the lesson's own story — gives
## "Cash, Cards, and Currencies" (builder-currencies-l1), ported via
## LessonData.choice_point with no mini-game, same shape as every other
## choice_point-only lesson so far.
##
## Omar — the real child named in the "How a Card Payment Actually Works"
## story — is this zone's second resident (same "a zone can grow another
## quest-giving NPC" pattern Golden Vault proved with Savings Guide/Theo),
## giving builder-digital_money-l1.
##
## Mei — the real child named in the "Owning a Small Piece of a Company"
## story — is this zone's third resident, giving builder-investing_basics-l1.
##
## Tomasz — the real child named in the "Locked Until 18" story — is this
## zone's fourth resident, giving builder-junior_isa-l1. This completed all
## 4 real website topics hosted in "sky-exchange" (currencies, digital_money,
## investing_basics, junior_isa) at the builder age band only.
##
## Visiting Friend — this zone's fifth resident — gives explorer-currencies-l1
## ("Money Looks Different Everywhere"), the first of Sky Exchange's 4 topics
## to grow beyond its builder age band. The real lesson's story has no named
## child (second person "you," with the secondary character simply "a
## friend"), so this NPC uses that role as its generic name, the same
## convention Market Town's Baker established; "Visiting Friend" rather than
## plain "Friend" to avoid reusing the exact npc_id Kindness Grove's unrelated
## "Friend" NPC already uses (a harmless real-content coincidence either way,
## per Section 3, but each zone has so far picked its own distinct name).
##
## Elena — the real teen named in the "Understanding Exchange Rates" story —
## is this zone's sixth resident, giving strategist-currencies-l1. This
## completes the "currencies" topic's full 3-age-band trilogy in one zone
## (the same way Golden Vault completed "saving", Coin Cove completed
## "money_basics", Horizon Peaks completed "long_term_thinking", Kindness
## Grove completed "giving", and Guardian Gate completed "scams"). Like
## Marcus's scams lesson, this quiz tests a conceptual fact (exchange rates
## change over time) rather than a specific action, so the choice_point is
## free to mirror the lesson's own recommended habit directly (check
## today's rate vs. compare rates across providers) with no risk of
## contradicting it.
##
## Mum — this zone's seventh resident — gives explorer-digital_money-l1
## ("Money You Can't Hold"), the first lesson to grow the "digital_money"
## topic beyond its builder age band. The real lesson's story has no named
## child (second person "you," with the secondary character simply "Mum"
## tapping her card), so this NPC uses that role as its generic name, the
## same convention established for Grown-up, Visiting Friend, and others.
## The quiz tests a specific identification task (which of these is digital
## money), so the choice_point is a downstream decision (what to do after
## noticing the tap) rather than re-asking the same classification, keeping
## it safely clear of contradicting the fixed answer.

const CURRENCIES_QUEST_ID: String = "builder-currencies-l1-quest"
const DIGITAL_MONEY_QUEST_ID: String = "builder-digital-money-l1-quest"
const INVESTING_BASICS_QUEST_ID: String = "builder-investing-basics-l1-quest"
const JUNIOR_ISA_QUEST_ID: String = "builder-junior-isa-l1-quest"
const CURRENCIES_EXPLORER_QUEST_ID: String = "explorer-currencies-l1-quest"
const CURRENCIES_STRATEGIST_QUEST_ID: String = "strategist-currencies-l1-quest"
const DIGITAL_MONEY_EXPLORER_QUEST_ID: String = "explorer-digital-money-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var sam: NPC = $Sam
@onready var omar: NPC = $Omar
@onready var mei: NPC = $Mei
@onready var tomasz: NPC = $Tomasz
@onready var visiting_friend: NPC = $VisitingFriend
@onready var elena: NPC = $Elena
@onready var mum: NPC = $Mum


func _ready() -> void:
	camera_controller.target = player
	sam.talked_to.connect(_on_sam_talked_to)
	omar.talked_to.connect(_on_omar_talked_to)
	mei.talked_to.connect(_on_mei_talked_to)
	tomasz.talked_to.connect(_on_tomasz_talked_to)
	visiting_friend.talked_to.connect(_on_visiting_friend_talked_to)
	elena.talked_to.connect(_on_elena_talked_to)
	mum.talked_to.connect(_on_mum_talked_to)


func _on_sam_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CURRENCIES_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.sam.already_done")
	else:
		QuestManager.start_quest(CURRENCIES_QUEST_ID)


func _on_omar_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(DIGITAL_MONEY_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.omar.already_done")
	else:
		QuestManager.start_quest(DIGITAL_MONEY_QUEST_ID)


func _on_mei_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(INVESTING_BASICS_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.mei.already_done")
	else:
		QuestManager.start_quest(INVESTING_BASICS_QUEST_ID)


func _on_tomasz_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(JUNIOR_ISA_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.tomasz.already_done")
	else:
		QuestManager.start_quest(JUNIOR_ISA_QUEST_ID)


func _on_visiting_friend_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CURRENCIES_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.visiting_friend.already_done")
	else:
		QuestManager.start_quest(CURRENCIES_EXPLORER_QUEST_ID)


func _on_elena_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CURRENCIES_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.elena.already_done")
	else:
		QuestManager.start_quest(CURRENCIES_STRATEGIST_QUEST_ID)


func _on_mum_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(DIGITAL_MONEY_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.mum.already_done")
	else:
		QuestManager.start_quest(DIGITAL_MONEY_EXPLORER_QUEST_ID)
