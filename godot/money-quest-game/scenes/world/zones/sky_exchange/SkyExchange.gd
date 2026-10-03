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
##
## Priya — this zone's eighth resident — gives strategist-digital_money-l1
## ("Staying Safe and Aware With Digital Money"), completing the
## "digital_money" topic's full 3-age-band trilogy in one zone (the 8th
## single-topic zone/topic to reach all 3 age bands). Priya is the real
## teen named in that lesson's own story; her name coincidentally matches
## Coin Cove's Priya (an unrelated real character from a different real
## source text) — harmless, since quest-completion state keys off
## `quest_id` not `npc_id` and the two zones are never loaded
## simultaneously, same reasoning as the earlier Theo/Omar collisions
## (Section 3). The quiz tests a conceptual fact (digital payments lack a
## felt physical action), so the choice_point again mirrors the lesson's
## own recommended habits directly, with no risk of contradicting it.
##
## Leo — this zone's ninth resident — gives explorer-investing_basics-l1
## ("Saving vs Growing Your Money"), the first lesson to grow the
## "investing_basics" topic beyond its builder age band. Leo is the real
## child named in that lesson's own story; his sister (unnamed in the
## source) explains investing without a mini-game, same `choice_point`
## shape as every other lesson. The quiz asks for a specific
## classification (what's different about investing), so the choice_point
## is a downstream decision (ask for another example vs. decide saving is
## still right for him) rather than re-testing the same classification.
##
## Jamal — this zone's tenth resident — gives strategist-investing_basics-l1
## ("Risk, Diversification, and Time"), completing the "investing_basics"
## topic's full 3-age-band trilogy in one zone (the 9th single-topic
## zone/topic to reach all 3 age bands). Jamal is the real teen named in
## that lesson's own story; his cousin (unnamed in the source) explains
## diversification. Unlike Leo's lesson, the real quiz here tests a
## separate conceptual fact (investing vs. gambling), not which
## allocation Jamal picks, so the choice_point is free to mirror the
## lesson's own real decision directly (put it all in one company vs.
## spread it across several) — neither option is graded, so this carries
## no risk of contradicting the quiz.
##
## Freya — this zone's eleventh resident — gives explorer-junior_isa-l1
## ("A Special Savings Account Just for Kids (UK)"), the first lesson to
## grow the "junior_isa" topic beyond its builder age band — this topic
## was, until now, the only Money Quest topic untouched at every age
## band. Freya is the real child named in that lesson's own story. The
## quiz asks a specific ownership question (whose money is it), so the
## choice_point is a downstream decision (ask Grandma why vs. ask Mum
## when she can use it) rather than re-testing the same ownership fact.

const CURRENCIES_QUEST_ID: String = "builder-currencies-l1-quest"
const DIGITAL_MONEY_QUEST_ID: String = "builder-digital-money-l1-quest"
const INVESTING_BASICS_QUEST_ID: String = "builder-investing-basics-l1-quest"
const JUNIOR_ISA_QUEST_ID: String = "builder-junior-isa-l1-quest"
const CURRENCIES_EXPLORER_QUEST_ID: String = "explorer-currencies-l1-quest"
const CURRENCIES_STRATEGIST_QUEST_ID: String = "strategist-currencies-l1-quest"
const DIGITAL_MONEY_EXPLORER_QUEST_ID: String = "explorer-digital-money-l1-quest"
const DIGITAL_MONEY_STRATEGIST_QUEST_ID: String = "strategist-digital-money-l1-quest"
const INVESTING_BASICS_EXPLORER_QUEST_ID: String = "explorer-investing-basics-l1-quest"
const INVESTING_BASICS_STRATEGIST_QUEST_ID: String = "strategist-investing-basics-l1-quest"
const JUNIOR_ISA_EXPLORER_QUEST_ID: String = "explorer-junior-isa-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var sam: NPC = $Sam
@onready var omar: NPC = $Omar
@onready var mei: NPC = $Mei
@onready var tomasz: NPC = $Tomasz
@onready var visiting_friend: NPC = $VisitingFriend
@onready var elena: NPC = $Elena
@onready var mum: NPC = $Mum
@onready var priya: NPC = $Priya
@onready var leo: NPC = $Leo
@onready var jamal: NPC = $Jamal
@onready var freya: NPC = $Freya


func _ready() -> void:
	camera_controller.target = player
	sam.talked_to.connect(_on_sam_talked_to)
	omar.talked_to.connect(_on_omar_talked_to)
	mei.talked_to.connect(_on_mei_talked_to)
	tomasz.talked_to.connect(_on_tomasz_talked_to)
	visiting_friend.talked_to.connect(_on_visiting_friend_talked_to)
	elena.talked_to.connect(_on_elena_talked_to)
	mum.talked_to.connect(_on_mum_talked_to)
	priya.talked_to.connect(_on_priya_talked_to)
	leo.talked_to.connect(_on_leo_talked_to)
	jamal.talked_to.connect(_on_jamal_talked_to)
	freya.talked_to.connect(_on_freya_talked_to)


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


func _on_priya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(DIGITAL_MONEY_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.priya.already_done")
	else:
		QuestManager.start_quest(DIGITAL_MONEY_STRATEGIST_QUEST_ID)


func _on_leo_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(INVESTING_BASICS_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.leo.already_done")
	else:
		QuestManager.start_quest(INVESTING_BASICS_EXPLORER_QUEST_ID)


func _on_jamal_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(INVESTING_BASICS_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.jamal.already_done")
	else:
		QuestManager.start_quest(INVESTING_BASICS_STRATEGIST_QUEST_ID)


func _on_freya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(JUNIOR_ISA_EXPLORER_QUEST_ID):
		DialogueBox.show_text("zone.sky_exchange.freya.already_done")
	else:
		QuestManager.start_quest(JUNIOR_ISA_EXPLORER_QUEST_ID)
