class_name SaveGoalActivity
extends RefCounted
## SaveGoalActivity — a short, reusable "save or spend?" moment, played at
## a SavingsJar with a guide (Money is a tool). Neither choice is the
## wrong one: both complete the activity, each with its own consequence.
##
##   [coins coins coin]  ?   →   SAVE: jar → kite (later)   SPEND: a snack (now)
##
## - SAVE (delayed benefit): the coins drop into the jar, the vault adds
##   interest (one more coin) and the jar shows the goal is within reach —
##   wait now, get more later.
## - SPEND (immediate benefit): the coins buy a snack right now; it flies
##   into the bag and the guide is pleased. The jar stays empty and the
##   coins are gone — enjoy it now.
## The guide says what happened, never which is "right": what is best
## depends on the goal and the timing. "Later" closes it with nothing
## chosen (choice stays ""), so the child can come back.
##
## The choice is the picture card used everywhere (ResourcePurpose /
## PurposeChoiceCard): pictures first, words optional. Text comes from
## translation keys (key_prefix), so another place can reuse it.

const KITE_ICON: String = "item:kite:7A68B8"
const SNACK_SHAPE: String = "juice"
const SNACK_TINT: Color = Color("F2994A")
const SNACK_ITEM: String = "product:gv_snack"

var speaker_id: String
var jar: SavingsJar
var coins: int = 3
var interest: int = 1
var key_prefix: String = "activity.save_goal"
## "save", "spend", or "" (not chosen yet / later).
var choice: String = ""
## Kept for older callers and tests (always 0 now: spending is a valid end).
var spent_first: int = 0


func _init(p_speaker_id: String, p_jar: SavingsJar) -> void:
	speaker_id = p_speaker_id
	jar = p_jar


func run() -> void:
	var have := {"have": coins, "need": coins}
	var options: Array = [
		{"purpose": "save", "id": "save", "icons": ["coins", "then", "jar", "then", KITE_ICON], "params": have, "key": key_prefix + ".option_save"},
		{"purpose": "enjoy", "id": "spend", "picture": "item:%s:%s" % [SNACK_SHAPE, SNACK_TINT.to_html(false)],"icons": ["coins", "then", "item:%s:%s" % [SNACK_SHAPE, SNACK_TINT.to_html(false)]], "params": have, "key": key_prefix + ".option_spend"},
	]
	# Neither comes first on purpose.
	if randi() % 2 == 0:
		options.reverse()
	var picked: Dictionary = await ResourcePurpose.choose(jar, options, coins, [KITE_ICON])
	if picked.is_empty():
		return
	choice = String(picked["id"])
	SupportProfile.record_success()
	if choice == "save":
		await _save()
	else:
		await _spend()


## Delayed benefit: the jar fills, the vault adds interest, the goal is
## within reach.
func _save() -> void:
	AudioManager.play_sfx("success", 1.0, -4.0)
	await jar.drop_coins(coins, 0.7)
	await DialogueBox.say(speaker_id, key_prefix + ".interest", {"interest": interest})
	await jar.drop_coins(interest, 1.0)
	ResourcePurpose.show_outcome(jar, ["coins", "then", "jar"], ["jar", "num:%d" % (coins + interest), "then", KITE_ICON], "", {"before": {"have": coins, "need": coins}})
	await DialogueBox.say(speaker_id, key_prefix + ".learned")


## Immediate benefit: something good right now; the jar stays empty.
func _spend() -> void:
	AudioManager.play_sfx("coin", 1.0, -4.0)
	ProgressManager.own_item(SNACK_ITEM)
	var hud: Node = jar.get_tree().get_first_node_in_group("mq_hud")
	if hud and hud.money_hud:
		hud.money_hud.item_to_bag(SNACK_SHAPE, SNACK_TINT, jar.global_position + Vector3(0, 1.2, 0))
	for n in jar.get_tree().get_nodes_in_group("mq_npc"):
		if n is NPC and n.npc_id == speaker_id and n.visual:
			n.visual.play_reaction("happy")
	ResourcePurpose.show_outcome(jar, ["coins"], ["item:%s:%s" % [SNACK_SHAPE, SNACK_TINT.to_html(false)], "bag"], "", {"before": {"have": coins, "need": coins}})
	await DialogueBox.say(speaker_id, key_prefix + ".spent")
	await DialogueBox.say(speaker_id, key_prefix + ".learned_spend")
