extends Node
## LibraryManager — the registry for every real BookData/MentorData entry,
## loaded the same data-driven way QuestManager/WorldManager load quests
## and zones: dropping a new .tres into data/library/ or data/mentors/ is
## the whole job of adding book/mentor N, never a script edit. See
## docs/money-quest-world-architecture.md Section 6.
##
## Holds no save-dependent state itself — ProgressManager.discovered_entry_ids
## is still the one place "has this child opened this entry" lives (see
## ProgressManager.discover_entry()). This autoload only answers "what IS
## entry X," not "has the child seen it."

const BOOKS_DIR: String = "res://data/library/"
const MENTORS_DIR: String = "res://data/mentors/"

var _book_registry: Dictionary = {}     # entry_id -> BookData
var _mentor_registry: Dictionary = {}   # entry_id -> MentorData


func _ready() -> void:
	_load_all(BOOKS_DIR, _book_registry)
	_load_all(MENTORS_DIR, _mentor_registry)


func _load_all(dir_path: String, registry: Dictionary) -> void:
	var dir := DirAccess.open(dir_path)
	if dir == null:
		push_warning("LibraryManager: could not open %s" % dir_path)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var entry: EntryData = load(dir_path + file_name)
			if entry != null:
				registry[entry.entry_id] = entry
		file_name = dir.get_next()
	dir.list_dir_end()


func get_book(entry_id: String) -> BookData:
	return _book_registry.get(entry_id)


func get_mentor(entry_id: String) -> MentorData:
	return _mentor_registry.get(entry_id)


func get_all_books() -> Array:
	return _book_registry.values()


func get_all_mentors() -> Array:
	return _mentor_registry.values()
