extends Node3D
## GoldenVaultFlow — the Golden Vault's first-visit journey (the vertical
## slice), built only from reusable parts: ObjectiveManager (the mission
## card), GuidanceSystem (help that grows only when needed), Collectible
## coins, a SavingsJar with the SaveGoalActivity mini-game, NPC indicators,
## RewardPopup's celebration and ProgressManager activity progress.
##
##   Arrive -> "Find the Savings Guide" (a gold "!" over him; he waves and
##   calls "Over here!"; the card teaches moving, looking and talking)
##   -> he explains in three short lines -> "Find 3 golden coins (0/3)"
##   (hidden in the vault's corners: exploring pays) -> "Put your coins in
##   the savings jar" -> choose: spend now or save -> saving fills the jar
##   and the vault adds interest -> celebration (+30 XP, Golden Coin Badge)
##   -> "Talk to Maya" -> Theo -> learn more from the Guide -> visit Smart
##   Shopper. Each step is saved, so leaving, falling or restarting resumes
##   exactly here. The existing quests and lessons are unchanged: once the
##   first activity is done, talking to the Guide, Maya and Theo starts
##   their quests as before.

const ACTIVITY: String = "gv-first-savings"
const COIN_TOTAL: int = 3
## Hidden where curiosity is rewarded: by the left wall's bench, in front
## of the "growing savings" pedestals, and behind the coin tower's chest.
const COINS: Dictionary = {
	"coin-bench": Vector3(-8.4, 0, 2.6),
	"coin-pedestals": Vector3(8.4, 0, 1.4),
	"coin-tower": Vector3(-7.6, 0, -8.4),
}
const JAR_POSITION: Vector3 = Vector3(6.9, 0, -0.6)
const XP_REWARD: int = 30
const COIN_REWARD: int = 4
const BADGE_ID: String = "golden-coin"
const MAYA_QUEST: String = "builder-saving-l1-quest"
const GUIDE_QUEST: String = "explorer-saving-l1-quest"
const THEO_QUEST: String = "strategist-saving-l1-quest"

var guide: NPC
var maya: NPC
var theo: NPC
var market_portal: Node3D
var jar: SavingsJar
var guidance: GuidanceSystem
var coins: Dictionary = {}           # id -> Collectible
var activity: SaveGoalActivity       # while running (tests read it)

var _player: Node3D
var _spawn: Vector3
var _moved: bool = false
var _looked: bool = false
var _since_start: float = 0.0
var _xp_tip_left: float = 0.0
var _busy: bool = false


func _ready() -> void:
	name = "GoldenVaultFlow"
	var zone: Node = get_parent()
	guide = zone.get_node("SavingsGuide")
	maya = zone.get_node("Maya")
	theo = zone.get_node("Theo")
	market_portal = zone.get_node("PortalToMarketTown")
	guidance = GuidanceSystem.new()
	add_child(guidance)
	jar = SavingsJar.new()
	jar.name = "SavingsJar"
	jar.position = JAR_POSITION
	add_child(jar)
	jar.used.connect(_on_jar_used)
	for id in COINS:
		var c := Collectible.new()
		c.name = "Coin_" + id
		c.activity_id = ACTIVITY
		c.collectible_id = id
		c.position = COINS[id]
		add_child(c)
		c.collected.connect(_on_coin_collected)
		coins[id] = c
	if ProgressManager.is_activity_completed(ACTIVITY):
		# Saved: a full jar. Spent: the jar stays empty (older saves: saved).
		jar.set_fill(0.0 if saved_choice() == "spend" else 1.0)
	QuestManager.quest_finished.connect(func(_id): refresh())
	InputHints.device_changed.connect(func(_d): _update_tip())
	var timer := Timer.new()
	timer.wait_time = 0.5
	timer.autostart = true
	timer.timeout.connect(_tick)
	add_child(timer)
	refresh.call_deferred()


# --- where are we? -------------------------------------------------------------

func step() -> String:
	if ProgressManager.is_activity_completed(ACTIVITY):
		return "done"
	if not ProgressManager.get_activity_state(ACTIVITY, "met_guide", false):
		return "find_guide"
	if coins_found() < COIN_TOTAL:
		return "find_coins"
	return "save_coins"


func coins_found() -> int:
	return (ProgressManager.get_activity_state(ACTIVITY, "collected", []) as Array).size()


## Rebuilds the mission, optional extras, NPC indicators and tips from the
## saved progress — safe to call any time.
func refresh() -> void:
	if not is_inside_tree():
		return
	for npc in [guide, maya, theo]:
		npc.indicator = NPC.Indicator.NONE
	guide.call_out_key = ""
	match step():
		"find_guide":
			ObjectiveManager.set_objective("gv.find_guide", "objective.gv.find_guide", {"name": guide.get_display_name()}, guide)
			guide.call_out_key = "gv.guide.call_out"
		"find_coins":
			ObjectiveManager.set_objective("gv.find_coins", "objective.gv.find_coins", {"found": coins_found(), "total": COIN_TOTAL}, _nearest_coin())
		"save_coins":
			ObjectiveManager.set_objective("gv.save_coins", "objective.gv.save_coins", {}, jar)
		_:
			_set_next_objective()
	var learned: Array[String] = []
	if step() == "done":
		learned = ["learn.gv.saving", "learn.gv.interest"]
	ObjectiveManager.set_learned(learned)
	_update_tip()


func _set_next_objective() -> void:
	var extras: Array = []
	var next_set: bool = false
	for entry in [[maya, MAYA_QUEST, "objective.gv.talk_to"], [theo, THEO_QUEST, "objective.gv.talk_to"], [guide, GUIDE_QUEST, "objective.gv.learn_more"]]:
		if QuestManager.is_quest_completed(entry[1]):
			continue
		(entry[0] as NPC).indicator = NPC.Indicator.TALK
		if not next_set:
			next_set = true
			ObjectiveManager.set_objective("gv.next." + entry[1], entry[2], {"name": (entry[0] as NPC).get_display_name()}, entry[0])
		else:
			extras.append({"text_key": entry[2], "params": {"name": (entry[0] as NPC).get_display_name()}})
	var place: String = Localization.t("zone.market_town.name")
	if not next_set:
		ObjectiveManager.set_objective("gv.visit_market", "objective.gv.visit_market", {"place": place}, market_portal)
	else:
		extras.append({"text_key": "objective.gv.visit_market", "params": {"place": place}})
	ObjectiveManager.set_optional(extras)


func _nearest_coin() -> Node3D:
	var best: Node3D = null
	var from: Vector3 = _player.global_position if is_instance_valid(_player) else Vector3(0, 0, 3)
	for id in coins:
		var c: Collectible = coins[id]
		if c.is_collected():
			continue
		if best == null or from.distance_to(c.global_position) < from.distance_to(best.global_position):
			best = c
	return best


# --- teaching controls through play --------------------------------------------

## Every half second: notice the first steps, the first look around, and
## keep the coin target the nearest one. Cheap; no per-frame work.
func _tick() -> void:
	if not is_instance_valid(_player):
		_player = _find_player()
		if _player:
			_spawn = _player.global_position
		return
	_since_start += 0.5
	if not _moved and _player.global_position.distance_to(_spawn) > 3.0:
		_moved = true
	if not _looked and (Input.is_action_pressed("camera_left") or Input.is_action_pressed("camera_right") or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or _since_start > 25.0):
		_looked = true
	if _xp_tip_left > 0.0:
		_xp_tip_left -= 0.5
	if step() == "find_coins" and ObjectiveManager.objective_id == "gv.find_coins":
		var nearest: Node3D = _nearest_coin()
		if nearest and nearest != ObjectiveManager.target():
			ObjectiveManager.set_objective("gv.find_coins", "objective.gv.find_coins", {"found": coins_found(), "total": COIN_TOTAL}, nearest)
	_update_tip()


func _update_tip() -> void:
	var tip: String = ""
	if step() == "find_guide":
		if not _moved:
			tip = Localization.t("tip.move", {"keys": InputHints.glyph("move")})
		elif not _looked and InputHints.glyph("camera") != "":
			tip = Localization.t("tip.camera", {"keys": InputHints.glyph("camera")})
		elif is_instance_valid(_player) and _player.global_position.distance_to(guide.global_position) < 6.0:
			if InputHints.is_pointer():
				tip = Localization.t("tip.talk_pointer", {"talk": Localization.t("interaction.talk_prompt")})
			else:
				tip = Localization.t("tip.talk", {"key": InputHints.glyph("interact")})
	elif _xp_tip_left > 0.0:
		tip = Localization.t("tip.xp")
	ObjectiveManager.set_tip(tip)


func _find_player() -> Node3D:
	for p in get_tree().get_nodes_in_group("player"):
		# The player whose zone contains this node (wherever it sits in it).
		if not p.is_queued_for_deletion() and p.get_parent().is_ancestor_of(self):
			return p
	return null


# --- the Savings Guide ------------------------------------------------------------

## Called by GoldenVault.gd when the Guide is talked to. Returns true when
## the first-visit journey handles it (so his lesson does not start yet).
func handle_guide_talk() -> bool:
	if _busy or QuestManager._active:
		return true
	match step():
		"find_guide":
			_meet_guide()
			return true
		"find_coins":
			_say_line("gv.guide.remind_coins", {"found": coins_found(), "total": COIN_TOTAL})
			return true
		"save_coins":
			_say_line("gv.guide.remind_jar")
			return true
	return false


func _meet_guide() -> void:
	_busy = true
	ObjectiveManager.complete("gv.find_guide")
	for key in ["gv.guide.welcome", "gv.guide.grow", "gv.guide.find_coins"]:
		await DialogueBox.say("savings-guide", key)
	ProgressManager.set_activity_state(ACTIVITY, "met_guide", true)
	_busy = false
	refresh()


func _say_line(key: String, params: Dictionary = {}) -> void:
	_busy = true
	await DialogueBox.say("savings-guide", key, params)
	_busy = false


# --- coins and the jar --------------------------------------------------------------

func _on_coin_collected(_id: String) -> void:
	var found: int = coins_found()
	var hud: Node = get_tree().get_first_node_in_group("mq_hud")
	if hud:
		hud.show_discovery(Localization.t("gv.coin.found_title"), Localization.t("gv.coin.found_text", {"found": found, "total": COIN_TOTAL}))
	if found >= COIN_TOTAL and step() == "save_coins":
		AudioManager.say(Localization.t("gv.guide.all_found"), guide.get_display_name())
	refresh()


func _on_jar_used() -> void:
	if _busy or QuestManager._active:
		return
	match step():
		"save_coins":
			_run_activity()
		"done":
			_say_line("gv.jar.spent_done" if saved_choice() == "spend" else "gv.jar.full")
		"find_guide":
			_say_line("gv.jar.meet_guide")
		_:
			_say_line("gv.jar.not_yet")


## Save or spend: both complete the activity (SaveGoalActivity). Saving
## gives the coins back later with interest (+4 coins); spending gives a
## snack now (no coins back). Same XP and badge either way — the choice
## changes what happens, not how "good" the child was.
func _run_activity() -> void:
	_busy = true
	activity = SaveGoalActivity.new("savings-guide", jar)
	activity.coins = COIN_TOTAL
	activity.interest = 1
	await activity.run()
	if activity.choice.is_empty():
		# "Later": nothing chosen; the jar waits.
		_busy = false
		refresh()
		return
	ObjectiveManager.complete("gv.save_coins")
	var saved: bool = activity.choice == "save"
	var coins_back: int = COIN_REWARD if saved else 0
	# Reward first, then mark complete (which saves the game with it).
	ProgressManager.set_activity_state(ACTIVITY, "choice", activity.choice)
	GameState.add_xp(XP_REWARD)
	if coins_back > 0:
		GameState.add_coins(coins_back)
	ProgressManager.award_badge(BADGE_ID)
	ProgressManager.complete_activity(ACTIVITY)
	await RewardPopup.celebrate("reward.activity_complete", "gv.reward.message" if saved else "gv.reward.message_spend", XP_REWARD, coins_back, "badge.golden-coin.name")
	await DialogueBox.say("savings-guide", "gv.guide.next_maya")
	_xp_tip_left = 10.0
	_busy = false
	refresh()


func is_busy() -> bool:
	return _busy


## What the child chose at the jar: "save" or "spend" ("save" for saves
## made before both choices completed the activity).
func saved_choice() -> String:
	return String(ProgressManager.get_activity_state(ACTIVITY, "choice", "save"))
