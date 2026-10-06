class_name SaveGoalActivity
extends RefCounted
## SaveGoalActivity — a short, reusable "save toward a goal" mini-game,
## played with an NPC and a SavingsJar:
##   1. "You have 3 coins. What will you do?"  [Buy a sweet now] [Save them]
##   2. Spending is allowed and never punished: the guide kindly says what
##      happened (the coins are gone, the goal is still far) and offers to
##      try again — the child chooses again, in their own time.
##   3. Saving: the coins drop into the jar, the jar fills, and the vault
##      adds interest — one extra coin — so the child SEES saved money grow.
##   4. One short sentence says what that was ("saving", "interest").
## Rules understood in seconds: two big choices, then something happens.
## Text comes from translation keys (prefix), so another zone can reuse it
## with its own words; the reward is the caller's to give.

var speaker_id: String
var jar: SavingsJar
var coins: int = 3
var interest: int = 1
var key_prefix: String = "activity.save_goal"
## How many times "spend" was chosen before saving (for feedback/tests).
var spent_first: int = 0


func _init(p_speaker_id: String, p_jar: SavingsJar) -> void:
	speaker_id = p_speaker_id
	jar = p_jar


func run() -> void:
	var spend := ChoiceOption.new()
	spend.label_key = key_prefix + ".option_spend"
	var save := ChoiceOption.new()
	save.label_key = key_prefix + ".option_save"
	var choice := DialogueChoice.new()
	choice.situation_text_key = key_prefix + ".situation"
	choice.options.append(spend)
	choice.options.append(save)
	while true:
		var picked: ChoiceOption = await ChoicePanel.show_choice(choice)
		if picked == save:
			break
		spent_first += 1
		AudioManager.play_sfx("retry", 1.0, -6.0)
		await DialogueBox.say(speaker_id, key_prefix + ".spent")
		await DialogueBox.say(speaker_id, key_prefix + ".try_again")
	AudioManager.play_sfx("success", 1.0, -4.0)
	await jar.drop_coins(coins, 0.7)
	await DialogueBox.say(speaker_id, key_prefix + ".interest", {"interest": interest})
	await jar.drop_coins(interest, 1.0)
	await DialogueBox.say(speaker_id, key_prefix + ".learned")
