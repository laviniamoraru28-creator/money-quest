class_name LessonManager
extends Node
## LessonManager — drives ANY LessonData through the same universal beat
## sequence. Instanced fresh by QuestManager for each lesson-kind quest
## (see autoload/QuestManager.gd) and freed when done — it holds no
## persistent state of its own between lessons.
##
## Flow (matches the real curriculum's own field order in
## src/content/curriculum/types.ts — story, explanation, interactiveActivity,
## quiz, feedback, rewardMessage — and the "live it, then explain it"
## principle from the Money Quest World brief):
##
##   1. intro_dialogue        — the lesson's story, as spoken lines
##   2. stage scene           — hands-on interaction (a mini-game; instanced
##                              from lesson_data.stage_scene_path, if any)
##   3. choice_point           — a reflective decision with consequences,
##                              no single "correct" option (optional —
##                              many lessons deliver this through their
##                              stage's mini-game instead, see
##                              data/schemas/LESSON_DATA_FORMAT.md)
##   4. explanation_key        — the financial principle, named AFTER the
##                              child has already experienced it
##   5. quiz                   — a genuine factual check, retryable, never
##                              shaming on a wrong answer
##   6. reward + completion    — ProgressManager.complete_lesson()
##
## Talks to the DialogueBox/ChoicePanel/RewardPopup autoloads directly
## (global UI overlays that persist across zone changes — see
## docs/money-quest-world-architecture.md Section 2) rather than being
## handed references, the same reasoning every other autoload here exists
## for.

signal lesson_finished(lesson_id: String)

var lesson_data: LessonData


func start_lesson(data: LessonData) -> void:
	lesson_data = data
	GameState.current_lesson_id = data.lesson_id
	_run_intro_dialogue()


func _run_intro_dialogue() -> void:
	for line in lesson_data.intro_dialogue:
		await DialogueBox.show_line(line)
	_run_stage_scene()


func _run_stage_scene() -> void:
	if lesson_data.stage_scene_path.is_empty():
		_run_choice_point()
		return

	var stage_scene: PackedScene = load(lesson_data.stage_scene_path)
	var stage_instance: Node = stage_scene.instantiate()
	add_child(stage_instance)
	# Every stage scene emits "stage_finished" when its hands-on part is
	# done (e.g. the mini-game's last week resolves) — this is the one
	# contract a bespoke stage scene must fulfil to plug into LessonManager.
	await stage_instance.stage_finished
	stage_instance.queue_free()
	_run_choice_point()


func _run_choice_point() -> void:
	if lesson_data.choice_point == null:
		_run_explanation()
		return

	var chosen_option: ChoiceOption = await ChoicePanel.show_choice(lesson_data.choice_point)
	if chosen_option.consequence:
		var c: ConsequenceEffect = chosen_option.consequence
		GameState.add_coins(max(c.coin_delta, 0), "lesson:choice", "choose", "reward")
		GameState.add_xp(max(c.xp_delta, 0))
		# Visual-first: what changed in the story, as [before] → [after] (e.g.
		# the story's jar filling up), with the short line, for as long as
		# that line is on screen.
		if not c.change_before.is_empty() or not c.change_after.is_empty():
			Feedback.changed(self, [[c.change_before, c.change_after, c.change_params.get("before", {}), c.change_params.get("after", {})]], "", {}, true)
		await DialogueBox.show_text(c.consequence_text_key, {}, c.icons)
		ResourcePurpose.dismiss_change(self)
	_run_explanation()


func _run_explanation() -> void:
	if lesson_data.visual_first and not lesson_data.explanation_lines.is_empty():
		# Short lines with pictures; the original full explanation is still
		# there, as "More" (never needed to play).
		var topic: String = _register_more_topic()
		for i in lesson_data.explanation_lines.size():
			var last: bool = i == lesson_data.explanation_lines.size() - 1
			await DialogueBox.show_line(lesson_data.explanation_lines[i], topic if last else "")
		_run_practice()
		return
	if not lesson_data.explanation_key.is_empty():
		await DialogueBox.show_text(lesson_data.explanation_key)
	_run_quiz()


## Visual-first: practise by choosing with pictures (e.g. "Need or want?"
## for bread, then chocolate...). Each round repeats until it is right;
## a picture says how it went, then the next one comes.
func _run_practice() -> void:
	for r in lesson_data.practice_rounds:
		var options: Array[String] = []
		options.assign(r.get("options", []))
		var right: bool = false
		while not right:
			right = await ChoicePanel.show_quiz(String(r.get("question_key", "")), options, int(r.get("correct", 0)), NO_TEXTS, r.get("option_icons", []), r.get("icons", []))
			var answer_icons: Array = r.get("icons", []) + ["then", String(r.get("option_icons", [""])[int(r.get("correct", 0))])]
			if right:
				Feedback.success(self, answer_icons)
			else:
				Feedback.not_yet(self, r.get("icons", []))
			await get_tree().create_timer(0.9).timeout
	_run_quiz()


## The lesson's own MORE topic: its key concept (layer 2) and its original
## explanation and quiz explanation (layer 3), unchanged.
func _register_more_topic() -> String:
	var id: String = "lesson:" + lesson_data.lesson_id
	var deep: Array = []
	for k in [lesson_data.explanation_key, lesson_data.quiz_explanation_key]:
		if not String(k).is_empty():
			deep.append(k)
	InfoLayers.register_topic(id, {
		"icon": TOPIC_ICONS.get(lesson_data.topic_id, "book"),
		"title_key": lesson_data.explanation_key.replace(".explanation", ".title"),
		"short_key": lesson_data.key_concept_key,
		"deep_keys": deep,
	})
	return id


## Lesson answers come from their keys (no live texts); typed, as show_quiz needs.
const NO_TEXTS: Array[String] = []

## A picture for each topic (Symbols tokens).
const TOPIC_ICONS: Dictionary = {
	"saving": "jar", "needs_wants": "need", "money_basics": "coin",
	"currencies": "coin_foreign", "digital_money": "card", "giving": "heart",
	"investing_basics": "growth", "junior_isa": "vault",
	"long_term_thinking": "clock", "scams": "warning",
}


func _run_quiz() -> void:
	if lesson_data.quiz_question_key.is_empty():
		_run_reward()
		return

	var is_correct: bool = false
	while not is_correct:
		is_correct = await ChoicePanel.show_quiz(
			lesson_data.quiz_question_key,
			lesson_data.quiz_option_keys,
			lesson_data.quiz_correct_index,
			NO_TEXTS,
			lesson_data.quiz_option_icons,
			lesson_data.quiz_question_icons
		)
		var feedback_key: String = (
			lesson_data.quiz_success_feedback_key if is_correct
			else lesson_data.quiz_retry_feedback_key
		)
		var feedback_icons: Array = lesson_data.quiz_success_icons if is_correct else lesson_data.quiz_retry_icons
		if not feedback_key.is_empty():
			await DialogueBox.show_text(feedback_key, {}, feedback_icons)
		# (Visual-first lessons keep the quiz explanation in their MORE topic.)
		if is_correct and not lesson_data.visual_first and not lesson_data.quiz_explanation_key.is_empty():
			await DialogueBox.show_text(lesson_data.quiz_explanation_key)
	_run_reward()


func _run_reward() -> void:
	ProgressManager.complete_lesson(
		lesson_data.lesson_id, lesson_data.xp_reward, lesson_data.coin_reward
	)
	await RewardPopup.show_reward(
		lesson_data.reward_message_key, lesson_data.xp_reward, lesson_data.coin_reward
	)
	lesson_finished.emit(lesson_data.lesson_id)
