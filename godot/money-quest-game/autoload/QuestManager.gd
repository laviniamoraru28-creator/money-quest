extends Node
## QuestManager — the single global entry point: "start quest X." Any NPC
## or portal anywhere in the world calls `QuestManager.start_quest(id)`
## with no reference-passing required, the same reasoning `Localization`/
## `Settings` are autoloads for. See docs/money-quest-world-architecture.md
## Section 4.

signal quest_started(quest_id: String)
signal quest_finished(quest_id: String)

const QUESTS_DIR: String = "res://data/quests/"

var _quest_registry: Dictionary = {}   # quest_id -> QuestData
var _active: bool = false

## EXPLORATION-kind quest ids currently offered and not yet completed —
## see _start_exploration_quest()'s own comment for why these are tracked
## separately from `_active`.
var _pending_exploration_quest_ids: Array[String] = []


func _ready() -> void:
	_load_all_quests()


## Data-driven: adding quest 2 means dropping a new .tres file into
## data/quests/, never editing this script.
func _load_all_quests() -> void:
	var dir := DirAccess.open(QUESTS_DIR)
	if dir == null:
		push_warning("QuestManager: could not open %s" % QUESTS_DIR)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var quest: QuestData = load(QUESTS_DIR + file_name)
			if quest != null:
				_quest_registry[quest.quest_id] = quest
		file_name = dir.get_next()
	dir.list_dir_end()


func get_quest(quest_id: String) -> QuestData:
	return _quest_registry.get(quest_id)


func is_quest_completed(quest_id: String) -> bool:
	return ProgressManager.completed_quest_ids.has(quest_id)


## Starts a quest's full experience. Only one quest can run at a time
## (mirrors there only ever being one child in front of one NPC at once) —
## a second call while one is active is ignored rather than silently
## overlapping two dialogue flows.
func start_quest(quest_id: String) -> void:
	var quest: QuestData = get_quest(quest_id)
	if quest == null:
		push_error("QuestManager: unknown quest_id '%s'" % quest_id)
		return

	# EXPLORATION is the one quest kind that never holds `_active` — see
	# _start_exploration_quest()'s own comment.
	if quest.kind == QuestData.QuestKind.EXPLORATION:
		_start_exploration_quest(quest)
		return

	if _active:
		push_warning("QuestManager: a quest is already running, ignoring start_quest('%s')" % quest_id)
		return

	_active = true
	quest_started.emit(quest_id)

	match quest.kind:
		QuestData.QuestKind.LESSON:
			await _run_lesson_quest(quest)
		QuestData.QuestKind.CHALLENGE:
			await _run_challenge_quest(quest)
		QuestData.QuestKind.MATCH:
			await _run_match_quest(quest)
		QuestData.QuestKind.SPOT:
			await _run_spot_quest(quest)
		QuestData.QuestKind.ALLOCATE:
			await _run_allocate_quest(quest)
		QuestData.QuestKind.SORT:
			await _run_sort_quest(quest)
		QuestData.QuestKind.MULTI_STEP:
			await _run_multi_step_quest(quest)
		_:
			# SIMULATION is architecture-ready (QuestData already models
			# it) but has no concrete runner built yet. Finish immediately
			# rather than hang the game on an unimplemented quest kind.
			# (EXPLORATION is handled above, before this match, since it
			# never sets `_active` — see _start_exploration_quest().)
			push_warning("QuestManager: quest kind %s has no runner yet (quest '%s')" % [quest.kind, quest_id])

	ProgressManager.complete_quest(quest_id, quest.skill_ids)
	_active = false
	quest_finished.emit(quest_id)


## Shared by every runner below: the intro beats every quest kind opens
## with (spoken lines, then an optional single narrator-style line) —
## either or both may be empty.
func _show_intro(quest: QuestData) -> void:
	for line in quest.intro_dialogue:
		await DialogueBox.show_line(line)
	if not quest.intro_text_key.is_empty():
		await DialogueBox.show_text(quest.intro_text_key)


## Shared by every runner below: shows one open-ended DialogueChoice (if
## set — a null choice is a silent no-op) and applies/narrates its picked
## option's consequence. Used for `diagnosis_choice`, `challenge_choice`,
## and `second_challenge_choice` alike.
func _run_one_choice(choice: DialogueChoice) -> void:
	if not choice:
		return
	var chosen: ChoiceOption = await ChoicePanel.show_choice(choice)
	if chosen.consequence:
		GameState.add_coins(max(chosen.consequence.coin_delta, 0), "quest:choice", "choose", "reward")
		GameState.add_xp(max(chosen.consequence.xp_delta, 0))
		await DialogueBox.show_text(chosen.consequence.consequence_text_key)


## Shared by every runner below: pays the quest's flat xp_reward/
## coin_reward and shows its reward message, if any.
func _pay_flat_reward(quest: QuestData) -> void:
	GameState.add_xp(quest.xp_reward)
	GameState.add_coins(quest.coin_reward, "quest:" + quest.quest_id, "flag", "reward")
	if not quest.reward_message_key.is_empty():
		await RewardPopup.show_reward(quest.reward_message_key, quest.xp_reward, quest.coin_reward)


## For a standalone situation-and-consequence quest with no wrapped
## LessonData (Entrepreneur Quest/Leadership Quest content ported from the
## website's own "mission"-shaped decision events — see QuestData.gd's own
## comment). Pays its own xp_reward/coin_reward directly, unlike a LESSON-
## kind quest where the wrapped LessonData already paid its reward.
func _run_challenge_quest(quest: QuestData) -> void:
	await _show_intro(quest)

	if quest.diagnosis_choice:
		var cause: ChoiceOption = await ChoicePanel.show_choice(quest.diagnosis_choice)
		if cause.consequence:
			await DialogueBox.show_text(cause.consequence.consequence_text_key)

	await _run_one_choice(quest.challenge_choice)
	await _pay_flat_reward(quest)


## For a MATCH-kind quest's matching mini-game (e.g. Leadership Quest's
## "Meet Your Team"), optionally followed by a decision point.
func _run_match_quest(quest: QuestData) -> void:
	await _show_intro(quest)
	await MatchPanel.show_match(quest.match_pairs)
	if not quest.match_outro_text_key.is_empty():
		await DialogueBox.show_text(quest.match_outro_text_key)
	await _run_one_choice(quest.challenge_choice)
	await _pay_flat_reward(quest)


## For a SPOT-kind quest's "spot the problem" mini-game (e.g. Leadership
## Quest's "The Team Conflict"), optionally followed by a decision point.
func _run_spot_quest(quest: QuestData) -> void:
	await _show_intro(quest)
	await SpotPanel.show_spot(quest.spot_scenario_text_key, quest.spot_items)
	if not quest.spot_outro_text_key.is_empty():
		await DialogueBox.show_text(quest.spot_outro_text_key)
	await _run_one_choice(quest.challenge_choice)
	await _pay_flat_reward(quest)


## For an ALLOCATE-kind quest's budget-splitting mini-game (e.g. Leadership
## Quest's "The Deadline"), optionally followed by a decision point.
func _run_allocate_quest(quest: QuestData) -> void:
	await _show_intro(quest)
	await AllocatePanel.show_allocate(quest.allocate_total_amount, quest.allocate_unit_label_key, quest.allocate_categories)
	if not quest.allocate_outro_text_key.is_empty():
		await DialogueBox.show_text(quest.allocate_outro_text_key)
	await _run_one_choice(quest.challenge_choice)
	await _pay_flat_reward(quest)


## For a SORT-kind quest's tap-select-then-tap-bucket sorting mini-game
## (e.g. Leadership Quest's "The Pressure Test"), optionally followed by a
## decision point.
func _run_sort_quest(quest: QuestData) -> void:
	await _show_intro(quest)
	await SortPanel.show_sort(quest.sort_buckets, quest.sort_items)
	if not quest.sort_outro_text_key.is_empty():
		await DialogueBox.show_text(quest.sort_outro_text_key)
	await _run_one_choice(quest.challenge_choice)
	await _pay_flat_reward(quest)


## For a MULTI_STEP-kind quest combining a matching mini-game with two
## separate decision points (e.g. Leadership Quest's "Final Challenge").
func _run_multi_step_quest(quest: QuestData) -> void:
	await _show_intro(quest)
	await MatchPanel.show_match(quest.match_pairs)
	if not quest.match_outro_text_key.is_empty():
		await DialogueBox.show_text(quest.match_outro_text_key)
	await _run_one_choice(quest.challenge_choice)
	await _run_one_choice(quest.second_challenge_choice)
	await _pay_flat_reward(quest)


func _run_lesson_quest(quest: QuestData) -> void:
	var lesson_data: LessonData = load(quest.lesson_data_path)
	if lesson_data == null:
		push_error("QuestManager: could not load LessonData at %s" % quest.lesson_data_path)
		return

	var lesson_manager := LessonManager.new()
	add_child(lesson_manager)
	lesson_manager.start_lesson(lesson_data)
	# start_lesson() is fire-and-forget (it's a chain of internal awaits,
	# not itself awaitable to completion) — wait for its own completion
	# signal instead, the real end of the lesson.
	await lesson_manager.lesson_finished
	lesson_manager.queue_free()


## For an EXPLORATION-kind quest (a Library discovery prompt — "find a
## book about saving," etc. — see docs/money-quest-world-architecture.md
## Section 6). Deliberately does NOT set `_active`: a child who gets this
## prompt from the Librarian should be free to keep browsing, talk to
## other NPCs, or even leave the zone and come back, without the rest of
## the game staying "busy" in the meantime — unlike every choice-driven
## quest kind above, there's no modal flow to hold open here, just a
## standing invitation that resolves whenever notify_entry_discovered()
## reports a match (see BookInteraction.gd/MentorInteraction.gd, the only
## callers). Shows just the prompt text and returns immediately — talking
## to the same giver again while it's still pending just repeats the
## prompt as a gentle reminder, rather than staying silent.
func _start_exploration_quest(quest: QuestData) -> void:
	if is_quest_completed(quest.quest_id):
		return
	if _pending_exploration_quest_ids.has(quest.quest_id):
		await _show_intro(quest)
		return
	_pending_exploration_quest_ids.append(quest.quest_id)
	quest_started.emit(quest.quest_id)
	await _show_intro(quest)


## Called by BookInteraction/MentorInteraction whenever a child opens any
## Library entry's card, discovered or not — checks every still-pending
## EXPLORATION quest for a match and completes it if so. A no-op (beyond
## nothing matching) when no exploration quest is waiting for this id.
func notify_entry_discovered(entry_id: String) -> void:
	for quest_id in _pending_exploration_quest_ids.duplicate():
		var quest: QuestData = get_quest(quest_id)
		if quest and quest.target_entry_id == entry_id:
			_pending_exploration_quest_ids.erase(quest_id)
			await _complete_exploration_quest(quest)


func _complete_exploration_quest(quest: QuestData) -> void:
	var has_reward: bool = not quest.reward_message_key.is_empty() or quest.xp_reward > 0 or quest.coin_reward > 0
	# Only hold `_active` for the brief moment of showing the reward popup
	# itself, and only when nothing else is already running — a discovery
	# prompt resolving mid-way through an unrelated dialogue/choice flow
	# should never interrupt it. Progress is never lost either way: the
	# quest still completes below, just without the popup animation that
	# one time.
	if has_reward and not _active:
		_active = true
		await _pay_flat_reward(quest)
		_active = false
	else:
		GameState.add_xp(quest.xp_reward)
		GameState.add_coins(quest.coin_reward, "quest:" + quest.quest_id, "flag", "reward")
	ProgressManager.complete_quest(quest.quest_id, quest.skill_ids)
	quest_finished.emit(quest.quest_id)
