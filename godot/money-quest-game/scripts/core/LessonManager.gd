class_name LessonManager
extends Node
## LessonManager — drives ANY LessonData through the same universal beat
## sequence. This is the one script every lesson shares; a new lesson
## never needs its own copy of this flow, only its own LessonData resource
## and (optionally) its own small stage scene for bespoke staging/mini-games.
##
## Flow (matches the real curriculum's own field order in
## src/content/curriculum/types.ts — story, explanation, interactiveActivity,
## quiz, feedback, rewardMessage — and the project brief's Phase 6 "live it,
## then explain it" principle):
##
##   1. intro_dialogue        — the lesson's story, as spoken lines
##   2. stage scene           — hands-on interaction (may be a mini-game;
##                              instanced from lesson_data.stage_scene_path)
##   3. choice_point           — a reflective decision with consequences,
##                              no single "correct" option
##   4. explanation_key        — the financial principle, named AFTER the
##                              child has already experienced it
##   5. quiz                   — a genuine factual check, retryable, never
##                              shaming on a wrong answer
##   6. reward + completion    — ProgressManager.complete_lesson()
##
## UI elements (DialogueBox, ChoicePanel, RewardPopup) are passed in by the
## LessonBase scene that owns this node — LessonManager never creates UI
## itself, it only tells existing UI what to show and waits for its
## signals, keeping this script UI-framework-agnostic and easy to test.

signal lesson_finished(lesson_id: String)

var lesson_data: LessonData
var dialogue_box: Node   # expects show_line(DialogueLine) -> awaits "advanced" signal
var choice_panel: Node   # expects show_choice(DialogueChoice) -> awaits "chosen" signal with ChoiceOption
							# or show_quiz(...) -> awaits "answered" signal with bool is_correct
var reward_popup: Node   # expects show_reward(String message, int xp, int coins)
var stage_container: Node  # where the lesson's bespoke stage scene is instanced


func start_lesson(data: LessonData) -> void:
	lesson_data = data
	GameState.current_lesson_id = data.lesson_id
	_run_intro_dialogue()


func _run_intro_dialogue() -> void:
	for line in lesson_data.intro_dialogue:
		await dialogue_box.show_line(line)
	_run_stage_scene()


func _run_stage_scene() -> void:
	if lesson_data.stage_scene_path.is_empty():
		_run_choice_point()
		return

	var stage_scene: PackedScene = load(lesson_data.stage_scene_path)
	var stage_instance: Node = stage_scene.instantiate()
	# Pass the shared UI down to the stage, the same duck-typed
	# reference-passing LessonBase uses to wire this manager itself —
	# a stage scene never creates its own DialogueBox/ChoicePanel.
	if "dialogue_box" in stage_instance:
		stage_instance.dialogue_box = dialogue_box
	if "choice_panel" in stage_instance:
		stage_instance.choice_panel = choice_panel
	stage_container.add_child(stage_instance)
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

	var chosen_option: ChoiceOption = await choice_panel.show_choice(lesson_data.choice_point)
	if chosen_option.consequence:
		GameState.add_coins(max(chosen_option.consequence.coin_delta, 0))
		GameState.add_xp(max(chosen_option.consequence.xp_delta, 0))
		await dialogue_box.show_text(chosen_option.consequence.consequence_text_key)
	_run_explanation()


func _run_explanation() -> void:
	if not lesson_data.explanation_key.is_empty():
		await dialogue_box.show_text(lesson_data.explanation_key)
	_run_quiz()


func _run_quiz() -> void:
	if lesson_data.quiz_question_key.is_empty():
		_run_reward()
		return

	var is_correct: bool = false
	while not is_correct:
		is_correct = await choice_panel.show_quiz(
			lesson_data.quiz_question_key,
			lesson_data.quiz_option_keys,
			lesson_data.quiz_correct_index
		)
		var feedback_key: String = (
			lesson_data.quiz_success_feedback_key if is_correct
			else lesson_data.quiz_retry_feedback_key
		)
		if not feedback_key.is_empty():
			await dialogue_box.show_text(feedback_key)
		if is_correct and not lesson_data.quiz_explanation_key.is_empty():
			await dialogue_box.show_text(lesson_data.quiz_explanation_key)
	_run_reward()


func _run_reward() -> void:
	ProgressManager.complete_lesson(
		lesson_data.lesson_id, lesson_data.xp_reward, lesson_data.coin_reward
	)
	await reward_popup.show_reward(
		lesson_data.reward_message_key, lesson_data.xp_reward, lesson_data.coin_reward
	)
	lesson_finished.emit(lesson_data.lesson_id)
