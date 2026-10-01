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
	if _active:
		push_warning("QuestManager: a quest is already running, ignoring start_quest('%s')" % quest_id)
		return
	var quest: QuestData = get_quest(quest_id)
	if quest == null:
		push_error("QuestManager: unknown quest_id '%s'" % quest_id)
		return

	_active = true
	quest_started.emit(quest_id)

	match quest.kind:
		QuestData.QuestKind.LESSON:
			await _run_lesson_quest(quest)
		_:
			# EXPLORATION / CHALLENGE / SIMULATION quests are architecture-
			# ready (QuestData already models them) but have no concrete
			# runner built yet — see docs/money-quest-world-architecture.md
			# Section 10's "not built this phase" list. Finish immediately
			# rather than hang the game on an unimplemented quest kind.
			push_warning("QuestManager: quest kind %s has no runner yet (quest '%s')" % [quest.kind, quest_id])

	ProgressManager.complete_quest(quest_id, quest.skill_ids)
	_active = false
	quest_finished.emit(quest_id)


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
