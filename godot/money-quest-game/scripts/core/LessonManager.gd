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
		GameState.add_coins(max(chosen_option.consequence.coin_delta, 0))
		GameState.add_xp(max(chosen_option.consequence.xp_delta, 0))
		await DialogueBox.show_text(chosen_option.consequence.consequence_text_key)
	_run_explanation()


func _run_explanation() -> void:
	if not lesson_data.explanation_key.is_empty():
		await DialogueBox.show_text(lesson_data.explanation_key)
	_run_quiz()


func _run_quiz() -> void:
	if lesson_data.quiz_question_key.is_empty():
		_run_reward()
		return

	var is_correct: bool = false
	while not is_correct:
		is_correct = await ChoicePanel.show_quiz(
			lesson_data.quiz_question_key,
			lesson_data.quiz_option_keys,
			lesson_data.quiz_correct_index
		)
		var feedback_key: String = (
			lesson_data.quiz_success_feedback_key if is_correct
			else lesson_data.quiz_retry_feedback_key
		)
		if not feedback_key.is_empty():
			await DialogueBox.show_text(feedback_key)
		if is_correct and not lesson_data.quiz_explanation_key.is_empty():
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
